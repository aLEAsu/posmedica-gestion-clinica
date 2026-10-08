import { randomUUID } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { puede, type Accion, type UsuarioSesion } from "@posmedica/shared";
import { config } from "../config.js";
import { sesionVigente } from "../security/session.js";
import { HttpError, noAutenticado, prohibido } from "./errors.js";

export function idPeticion(req: Request, res: Response, next: NextFunction) {
  req.id = randomUUID();
  res.setHeader("X-Request-Id", req.id);
  next();
}

/** Registro de acceso sin datos sensibles: ni cuerpo, ni query string, ni cookies. */
export function registroAcceso(req: Request, res: Response, next: NextFunction) {
  const t0 = performance.now();
  res.on("finish", () => {
    if (req.path === "/api/health") return;
    console.log(JSON.stringify({ nivel: "acceso", id: req.id, metodo: req.method, ruta: req.path, estado: res.statusCode, ms: Math.round(performance.now() - t0), usuario: req.usuario?.usuario }));
  });
  next();
}

/** Protección CSRF: toda petición que modifica datos debe venir de un origen permitido y declarar JSON.
    Junto con la cookie SameSite=Lax, impide que otro sitio envíe formularios o fetch en nombre del usuario. */
export function verificarOrigen(req: Request, _res: Response, next: NextFunction) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  let origen = req.get("origin");
  if (!origen && req.get("referer")) {
    try {
      origen = new URL(req.get("referer")!).origin;
    } catch {
      origen = undefined;
    }
  }
  if (!origen || !config.allowedOrigins.includes(origen)) return next(prohibido("Origen de la petición no permitido."));
  if (req.get("x-posmedica") !== "1") return next(prohibido("Petición sin la cabecera de la aplicación."));
  next();
}

export function aUsuarioSesion(u: {
  id: string; usuario: string; nombre: string; cargo: string; area: string | null; rol: "ADMIN" | "MEDICO"; debeCambiarClave: boolean;
  permisos: { programaClave: string; ver: boolean; registrar: boolean; anular: boolean; exportar: boolean }[];
}): UsuarioSesion {
  return {
    id: u.id, usuario: u.usuario, nombre: u.nombre, cargo: u.cargo, area: u.area, rol: u.rol, debeCambiarClave: u.debeCambiarClave,
    permisos: u.permisos.map((p) => ({ programa: p.programaClave, ver: p.ver, registrar: p.registrar, anular: p.anular, exportar: p.exportar })),
  };
}

/** Carga el usuario de la sesión si hay cookie válida. No exige sesión. */
export async function cargarSesion(req: Request, _res: Response, next: NextFunction) {
  try {
    const s = await sesionVigente(req.cookies?.[config.cookieName]);
    if (s) {
      req.usuario = aUsuarioSesion(s.usuario);
      req.sesionId = s.id;
    }
    next();
  } catch (e) {
    next(e);
  }
}

/** Exige sesión. Mientras el usuario deba cambiar la clave, solo deja pasar las rutas marcadas como permitidas. */
export function requiereSesion(opts: { permitirClavePendiente?: boolean } = {}) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.usuario) return next(noAutenticado());
    if (req.usuario.debeCambiarClave && !opts.permitirClavePendiente) {
      return next(new HttpError(403, "Debe cambiar su clave antes de continuar.", "CAMBIO_CLAVE"));
    }
    next();
  };
}

export const requiereAdmin = [
  requiereSesion(),
  (req: Request, _res: Response, next: NextFunction) => (req.usuario?.rol === "ADMIN" ? next() : next(prohibido("Solo el administrador puede hacer esto."))),
];

export function requierePermiso(programa: string, accion: Accion = "ver") {
  return [
    requiereSesion(),
    (req: Request, _res: Response, next: NextFunction) => (puede(req.usuario, programa, accion) ? next() : next(prohibido())),
  ];
}
