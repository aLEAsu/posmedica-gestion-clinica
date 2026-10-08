import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { config } from "../config.js";
import { prisma } from "../db.js";
import { HttpError, h, noAutenticado } from "../http/errors.js";
import { aUsuarioSesion, requiereSesion } from "../http/middleware.js";
import { auditar } from "../services/auditoria.js";
import { claveSenuelo, hashClave, problemaClave, verificarClave } from "../security/password.js";
import { borrarCookie, crearSesion, ponerCookie, revocarSesiones } from "../security/session.js";

export const auth = Router();

const limiteIngreso = rateLimit({
  windowMs: 15 * 60_000,
  limit: 60, // por IP; en la clínica muchos usuarios comparten IP. El bloqueo por usuario (5 intentos) es la defensa principal.
  standardHeaders: "draft-7",
  legacyHeaders: false,
  validate: { trustProxy: false },
  message: { error: "Demasiados intentos de ingreso desde este equipo. Espere 15 minutos.", codigo: "LIMITE" },
});

const Ingreso = z.object({
  usuario: z.string().trim().toLowerCase().min(1).max(60),
  clave: z.string().min(1).max(200),
});

const MSG_FALLA = "Usuario o clave incorrectos.";

auth.post(
  "/login",
  limiteIngreso,
  h(async (req, res) => {
    const { usuario, clave } = Ingreso.parse(req.body);
    const u = await prisma.usuario.findUnique({ where: { usuario }, include: { permisos: true } });

    if (!u || !u.activo) {
      await verificarClave(await claveSenuelo(), clave); // mismo tiempo de respuesta exista o no el usuario
      await auditar(req, { accion: "INGRESO_FALLIDO", entidad: "usuario", detalle: u ? "usuario inactivo" : "usuario inexistente", usuarioNombre: usuario });
      throw new HttpError(401, MSG_FALLA, "CREDENCIALES");
    }

    if (u.bloqueadoHasta && u.bloqueadoHasta > new Date()) {
      await auditar(req, { accion: "INGRESO_BLOQUEADO", entidad: "usuario", registroId: u.id, usuarioId: u.id, usuarioNombre: u.nombre });
      const min = Math.ceil((u.bloqueadoHasta.getTime() - Date.now()) / 60_000);
      throw new HttpError(423, `Usuario bloqueado por intentos fallidos. Intente en ${min} min o pida al administrador que lo desbloquee.`, "BLOQUEADO");
    }

    if (!(await verificarClave(u.claveHash, clave))) {
      const intentos = u.intentosFallidos + 1;
      const bloquear = intentos >= config.maxIntentosFallidos;
      await prisma.usuario.update({
        where: { id: u.id },
        data: { intentosFallidos: bloquear ? 0 : intentos, bloqueadoHasta: bloquear ? new Date(Date.now() + config.bloqueoMin * 60_000) : undefined },
      });
      await auditar(req, { accion: bloquear ? "BLOQUEO" : "INGRESO_FALLIDO", entidad: "usuario", registroId: u.id, usuarioId: u.id, usuarioNombre: u.nombre, detalle: `intento ${intentos}` });
      throw new HttpError(401, bloquear ? `Usuario bloqueado ${config.bloqueoMin} minutos por ${config.maxIntentosFallidos} intentos fallidos.` : MSG_FALLA, bloquear ? "BLOQUEADO" : "CREDENCIALES");
    }

    await prisma.usuario.update({ where: { id: u.id }, data: { intentosFallidos: 0, bloqueadoHasta: null, ultimoIngreso: new Date() } });
    const token = await crearSesion(u.id, req.ip, req.get("user-agent"));
    ponerCookie(res, token);
    await auditar(req, { accion: "INGRESO", entidad: "usuario", registroId: u.id, usuarioId: u.id, usuarioNombre: `${u.nombre} · ${u.cargo}` });
    res.json({ usuario: aUsuarioSesion(u) });
  }),
);

auth.post(
  "/logout",
  h(async (req, res) => {
    if (req.sesionId) {
      await prisma.sesion.update({ where: { id: req.sesionId }, data: { revocadaEn: new Date() } });
      await auditar(req, { accion: "SALIDA", entidad: "usuario", registroId: req.usuario?.id });
    }
    borrarCookie(res);
    res.json({ ok: true });
  }),
);

auth.get(
  "/me",
  h(async (req, res) => {
    if (!req.usuario) throw noAutenticado();
    res.json({ usuario: req.usuario });
  }),
);

const CambioClave = z.object({
  claveActual: z.string().min(1).max(200),
  claveNueva: z.string().min(1).max(200),
});

auth.post(
  "/cambiar-clave",
  requiereSesion({ permitirClavePendiente: true }),
  h(async (req, res) => {
    const { claveActual, claveNueva } = CambioClave.parse(req.body);
    const u = await prisma.usuario.findUniqueOrThrow({ where: { id: req.usuario!.id } });
    if (!(await verificarClave(u.claveHash, claveActual))) throw new HttpError(400, "La clave actual no es correcta.", "CLAVE_ACTUAL");
    const problema = problemaClave(claveNueva, u.usuario);
    if (problema) throw new HttpError(400, problema, "CLAVE_DEBIL");
    if (await verificarClave(u.claveHash, claveNueva)) throw new HttpError(400, "La clave nueva debe ser distinta de la actual.", "CLAVE_REPETIDA");

    const actualizado = await prisma.$transaction(async (tx) => {
      const r = await tx.usuario.update({
        where: { id: u.id },
        data: { claveHash: await hashClave(claveNueva), debeCambiarClave: false, claveCambiadaEn: new Date() },
        include: { permisos: true },
      });
      await auditar(req, { accion: "CAMBIO_CLAVE", entidad: "usuario", registroId: u.id }, tx);
      return r;
    });
    await revocarSesiones(u.id, req.sesionId); // cierra las demás sesiones abiertas
    res.json({ usuario: aUsuarioSesion(actualizado) });
  }),
);
