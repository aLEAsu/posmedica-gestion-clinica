import { Router } from "express";
import { z } from "zod";
import { PROGRAMA_POR_CLAVE } from "@posmedica/shared";
import { prisma } from "../db.js";
import { HttpError, h, noEncontrado } from "../http/errors.js";
import { requiereAdmin } from "../http/middleware.js";
import { auditar, diferencias } from "../services/auditoria.js";
import { claveTemporal, hashClave, problemaClave } from "../security/password.js";
import { revocarSesiones } from "../security/session.js";

export const usuarios = Router();
usuarios.use(requiereAdmin);

const vista = {
  id: true, usuario: true, nombre: true, cargo: true, area: true, email: true, rol: true, activo: true,
  debeCambiarClave: true, bloqueadoHasta: true, ultimoIngreso: true, creadoEn: true,
  permisos: { select: { programaClave: true, ver: true, registrar: true, anular: true, exportar: true } },
} as const;

usuarios.get(
  "/",
  h(async (_req, res) => {
    const L = await prisma.usuario.findMany({ select: vista, orderBy: [{ activo: "desc" }, { nombre: "asc" }] });
    res.json({ usuarios: L });
  }),
);

const Datos = z.object({
  nombre: z.string().trim().min(3).max(120),
  cargo: z.string().trim().min(2).max(120),
  area: z.string().trim().max(120).optional().nullable(),
  email: z.string().trim().email().max(160).optional().nullable().or(z.literal("")),
  rol: z.enum(["ADMIN", "MEDICO"]),
});

const Nuevo = Datos.extend({
  usuario: z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{3,40}$/, "Use de 3 a 40 letras minúsculas, números, punto, guion o guion bajo."),
  claveInicial: z.string().optional(),
});

usuarios.post(
  "/",
  h(async (req, res) => {
    const d = Nuevo.parse(req.body);
    if (await prisma.usuario.findUnique({ where: { usuario: d.usuario } })) throw new HttpError(409, "Ya existe un usuario con ese nombre de usuario.", "DUPLICADO");
    let clave = d.claveInicial?.trim();
    if (clave) {
      const p = problemaClave(clave, d.usuario);
      if (p) throw new HttpError(400, p, "CLAVE_DEBIL");
    } else clave = claveTemporal();

    const u = await prisma.$transaction(async (tx) => {
      const r = await tx.usuario.create({
        data: { usuario: d.usuario, nombre: d.nombre, cargo: d.cargo, area: d.area || null, email: d.email || null, rol: d.rol, claveHash: await hashClave(clave!), debeCambiarClave: true, creadoPor: req.usuario!.id },
        select: vista,
      });
      await auditar(req, { accion: "CREA", entidad: "usuario", registroId: r.id, despues: r }, tx);
      return r;
    });
    // La clave temporal se muestra una sola vez al administrador; nunca se guarda en claro ni en la auditoría.
    res.status(201).json({ usuario: u, claveTemporal: d.claveInicial ? undefined : clave });
  }),
);

const Edicion = Datos.partial().extend({ activo: z.boolean().optional() });

usuarios.patch(
  "/:id",
  h(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const cambios = Edicion.parse(req.body);
    const antes = await prisma.usuario.findUnique({ where: { id }, select: vista });
    if (!antes) throw noEncontrado("No existe ese usuario.");
    if (id === req.usuario!.id && (cambios.activo === false || (cambios.rol && cambios.rol !== "ADMIN"))) {
      throw new HttpError(400, "No puede quitarse a sí mismo el rol de administrador ni desactivarse.", "AUTO_BLOQUEO");
    }
    if ((cambios.activo === false || cambios.rol === "MEDICO") && antes.rol === "ADMIN") {
      const otros = await prisma.usuario.count({ where: { rol: "ADMIN", activo: true, NOT: { id } } });
      if (!otros) throw new HttpError(400, "Debe quedar al menos un administrador activo.", "ULTIMO_ADMIN");
    }
    const data = { ...cambios, area: cambios.area === undefined ? undefined : cambios.area || null, email: cambios.email === undefined ? undefined : cambios.email || null };
    const dif = diferencias(antes as Record<string, unknown>, data);
    if (!dif.cambio) return res.json({ usuario: antes });

    const u = await prisma.$transaction(async (tx) => {
      const r = await tx.usuario.update({ where: { id }, data, select: vista });
      await auditar(req, { accion: "MODIFICA", entidad: "usuario", registroId: id, antes: dif.antes, despues: dif.despues }, tx);
      return r;
    });
    if (cambios.activo === false || cambios.rol) await revocarSesiones(id);
    res.json({ usuario: u });
  }),
);

const Permisos = z.array(
  z.object({
    programa: z.string().refine((k) => !!PROGRAMA_POR_CLAVE[k], "Programa desconocido"),
    ver: z.boolean(),
    registrar: z.boolean(),
    anular: z.boolean(),
    exportar: z.boolean(),
  }),
);

/** Reemplaza todos los permisos de un usuario médico. Los programas sin «ver» se quitan. */
usuarios.put(
  "/:id/permisos",
  h(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const lista = Permisos.parse(req.body?.permisos).filter((p) => p.ver);
    const u = await prisma.usuario.findUnique({ where: { id }, include: { permisos: true } });
    if (!u) throw noEncontrado("No existe ese usuario.");
    const antes = u.permisos.map(({ programaClave, ver, registrar, anular, exportar }) => ({ programa: programaClave, ver, registrar, anular, exportar }));

    const r = await prisma.$transaction(async (tx) => {
      await tx.usuarioPrograma.deleteMany({ where: { usuarioId: id } });
      if (lista.length) {
        await tx.usuarioPrograma.createMany({
          data: lista.map((p) => ({ usuarioId: id, programaClave: p.programa, ver: true, registrar: p.registrar, anular: p.anular, exportar: p.exportar, asignadoPor: req.usuario!.id })),
        });
      }
      await auditar(req, { accion: "PERMISOS", entidad: "usuario", registroId: id, antes, despues: lista }, tx);
      return tx.usuario.findUniqueOrThrow({ where: { id }, select: vista });
    });
    res.json({ usuario: r });
  }),
);

usuarios.post(
  "/:id/restablecer-clave",
  h(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    const u = await prisma.usuario.findUnique({ where: { id } });
    if (!u) throw noEncontrado("No existe ese usuario.");
    const clave = claveTemporal();
    await prisma.$transaction(async (tx) => {
      await tx.usuario.update({ where: { id }, data: { claveHash: await hashClave(clave), debeCambiarClave: true, intentosFallidos: 0, bloqueadoHasta: null } });
      await auditar(req, { accion: "RESTABLECE_CLAVE", entidad: "usuario", registroId: id }, tx);
    });
    await revocarSesiones(id);
    res.json({ claveTemporal: clave });
  }),
);

usuarios.post(
  "/:id/desbloquear",
  h(async (req, res) => {
    const id = z.string().uuid().parse(req.params.id);
    await prisma.$transaction(async (tx) => {
      await tx.usuario.update({ where: { id }, data: { intentosFallidos: 0, bloqueadoHasta: null } });
      await auditar(req, { accion: "DESBLOQUEA", entidad: "usuario", registroId: id }, tx);
    });
    res.json({ ok: true });
  }),
);
