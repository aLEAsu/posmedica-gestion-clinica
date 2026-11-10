/* Contratos y tecnologías v1.1 (fase E, prototipo v3.2): matriz contractual por EPS (tecnologías con su código, paquetes,
   documentos contractuales con sus partes y firmantes, sinónimos de búsqueda). Decisión del 10 nov 2026: SOLO el
   administrador la consulta y la carga. Se guarda como parámetro del programa «ct» (una sola matriz vigente; cada carga
   queda en la auditoría). */
import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../db.js";
import { h } from "../../http/errors.js";
import { requiereAdmin } from "../../http/middleware.js";
import { auditar, auditarConsulta } from "../../services/auditoria.js";

const PROGRAMA = "ct";
const CLAVE = "matriz";
const Matriz = z.object({
  I: z.array(z.array(z.unknown())).max(100_000),
  C: z.array(z.record(z.unknown())).max(1_000),
  P: z.array(z.record(z.unknown())).max(5_000),
  SIN: z.record(z.string()).optional(),
});
const Cargar = z.object({ matriz: Matriz, fuente: z.string().max(200).optional() });

export const contratos = Router();

contratos.get(
  "/matriz",
  ...requiereAdmin,
  h(async (req, res) => {
    const p = await prisma.parametro.findUnique({ where: { programa_clave: { programa: PROGRAMA, clave: CLAVE } } });
    await auditarConsulta(req, PROGRAMA, "ct.matriz", p ? "matriz contractual" : "sin matriz cargada");
    res.json({ matriz: p?.valor ?? null, actualizadoEn: p?.actualizadoEn ?? null });
  }),
);

contratos.post(
  "/matriz",
  ...requiereAdmin,
  h(async (req, res) => {
    const { matriz, fuente } = Cargar.parse(req.body);
    const valor = { ...matriz, SIN: matriz.SIN ?? {} } as Prisma.InputJsonValue;
    await prisma.$transaction(async (tx) => {
      await tx.parametro.upsert({
        where: { programa_clave: { programa: PROGRAMA, clave: CLAVE } },
        create: { programa: PROGRAMA, clave: CLAVE, valor, actualizadoPor: req.usuario!.id },
        update: { valor, actualizadoPor: req.usuario!.id, vigenteDesde: new Date() },
      });
      await auditar(req, { accion: "IMPORTA", entidad: "ct.matriz", programa: PROGRAMA, detalle: `${fuente ?? "matriz"}: ${matriz.I.length} tecnologías, ${matriz.C.length} documentos, ${matriz.P.length} paquetes` }, tx);
    });
    res.json({ tecnologias: matriz.I.length, documentos: matriz.C.length, paquetes: matriz.P.length });
  }),
);
