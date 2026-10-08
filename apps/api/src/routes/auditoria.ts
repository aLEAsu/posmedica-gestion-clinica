import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../db.js";
import { h } from "../http/errors.js";
import { requiereAdmin } from "../http/middleware.js";

export const auditoria = Router();
auditoria.use(requiereAdmin);

const Filtro = z.object({
  desde: z.string().date().optional(),
  hasta: z.string().date().optional(),
  usuarioId: z.string().uuid().optional(),
  accion: z.string().max(40).optional(),
  entidad: z.string().max(40).optional(),
  registroId: z.string().max(80).optional(),
  pagina: z.coerce.number().int().min(1).default(1),
  tamano: z.coerce.number().int().min(10).max(200).default(50),
});

auditoria.get(
  "/",
  h(async (req, res) => {
    const f = Filtro.parse(req.query);
    const where: Prisma.AuditoriaWhereInput = {
      ...(f.desde || f.hasta
        ? { fecha: { ...(f.desde ? { gte: new Date(`${f.desde}T00:00:00-05:00`) } : {}), ...(f.hasta ? { lt: new Date(new Date(`${f.hasta}T00:00:00-05:00`).getTime() + 86_400_000) } : {}) } }
        : {}),
      ...(f.usuarioId ? { usuarioId: f.usuarioId } : {}),
      ...(f.accion ? { accion: f.accion } : {}),
      ...(f.entidad ? { entidad: f.entidad } : {}),
      ...(f.registroId ? { registroId: f.registroId } : {}),
    };
    const [total, filas, acciones, entidades] = await Promise.all([
      prisma.auditoria.count({ where }),
      prisma.auditoria.findMany({ where, orderBy: { id: "desc" }, skip: (f.pagina - 1) * f.tamano, take: f.tamano }),
      prisma.auditoria.findMany({ distinct: ["accion"], select: { accion: true }, orderBy: { accion: "asc" } }),
      prisma.auditoria.findMany({ distinct: ["entidad"], select: { entidad: true }, orderBy: { entidad: "asc" } }),
    ]);
    res.json({
      total,
      pagina: f.pagina,
      tamano: f.tamano,
      filas: filas.map((r) => ({ ...r, id: r.id.toString() })),
      acciones: acciones.map((a) => a.accion),
      entidades: entidades.map((e) => e.entidad),
    });
  }),
);
