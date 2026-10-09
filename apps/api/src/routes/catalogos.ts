import { Router } from "express";
import { prisma } from "../db.js";
import { h } from "../http/errors.js";
import { requiereSesion } from "../http/middleware.js";

export const catalogos = Router();
catalogos.use(requiereSesion());

catalogos.get(
  "/programas",
  h(async (_req, res) => {
    res.json({ programas: await prisma.programa.findMany({ orderBy: { orden: "asc" } }) });
  }),
);

catalogos.get(
  "/eps",
  h(async (_req, res) => {
    res.json({ eps: await prisma.eps.findMany({ where: { activo: true }, orderBy: { nombre: "asc" } }) });
  }),
);

/** Directorio de usuarios para mensajes, comités, calendario y responsables (sin permisos ni datos de acceso). */
catalogos.get(
  "/usuarios",
  h(async (_req, res) => {
    const L = await prisma.usuario.findMany({ select: { id: true, usuario: true, nombre: true, cargo: true, area: true, rol: true, activo: true }, orderBy: { nombre: "asc" } });
    res.json({ usuarios: L });
  }),
);

catalogos.get(
  "/municipios",
  h(async (_req, res) => {
    res.json({ municipios: await prisma.municipio.findMany({ orderBy: { nombre: "asc" } }) });
  }),
);
