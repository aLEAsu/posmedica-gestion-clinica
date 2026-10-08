import { createHmac, randomBytes } from "node:crypto";
import type { Response } from "express";
import { config } from "../config.js";
import { prisma } from "../db.js";

/** El token solo vive en la cookie; en la base se guarda su HMAC, así una copia de la base no permite suplantar sesiones. */
export function hashToken(token: string): string {
  return createHmac("sha256", config.sessionSecret).update(token).digest("hex");
}

export async function crearSesion(usuarioId: string, ip: string | undefined, agente: string | undefined) {
  const token = randomBytes(32).toString("base64url");
  const ahora = Date.now();
  await prisma.sesion.create({
    data: {
      tokenHash: hashToken(token),
      usuarioId,
      expiraEn: new Date(ahora + config.sessionMaxMs),
      ip: ip ?? null,
      agente: agente?.slice(0, 300) ?? null,
    },
  });
  return token;
}

export function ponerCookie(res: Response, token: string) {
  res.cookie(config.cookieName, token, {
    httpOnly: true,
    secure: config.isProd,
    sameSite: "lax",
    path: "/",
    maxAge: config.sessionMaxMs,
  });
}

export function borrarCookie(res: Response) {
  res.clearCookie(config.cookieName, { httpOnly: true, secure: config.isProd, sameSite: "lax", path: "/" });
}

/** Devuelve la sesión vigente (y renueva la última actividad) o null si no existe, expiró o estuvo inactiva demasiado tiempo. */
export async function sesionVigente(token: string | undefined) {
  if (!token || token.length > 100) return null;
  const s = await prisma.sesion.findUnique({ where: { tokenHash: hashToken(token) }, include: { usuario: { include: { permisos: true } } } });
  if (!s || s.revocadaEn) return null;
  const ahora = Date.now();
  if (s.expiraEn.getTime() <= ahora || ahora - s.ultimaActividad.getTime() > config.sessionIdleMs || !s.usuario.activo) {
    if (!s.revocadaEn) await prisma.sesion.update({ where: { id: s.id }, data: { revocadaEn: new Date() } });
    return null;
  }
  // Renovar como máximo una vez por minuto para no escribir en cada petición.
  if (ahora - s.ultimaActividad.getTime() > 60_000) {
    await prisma.sesion.update({ where: { id: s.id }, data: { ultimaActividad: new Date() } });
  }
  return s;
}

export async function revocarSesiones(usuarioId: string, exceptoId?: string) {
  await prisma.sesion.updateMany({
    where: { usuarioId, revocadaEn: null, ...(exceptoId ? { NOT: { id: exceptoId } } : {}) },
    data: { revocadaEn: new Date() },
  });
}
