import { Router } from "express";
import { z } from "zod";
import { puede } from "@posmedica/shared";
import { prisma } from "../../db.js";
import { h } from "../../http/errors.js";
import { requiereAdmin, requierePermiso } from "../../http/middleware.js";
import { auditar } from "../../services/auditoria.js";
import { PROGRAMA, importar, leerLibro, sincronizar, version, type Actor, type Cambios } from "./servicio.js";

export const hd = Router();

const actorDe = (u: NonNullable<Express.Request["usuario"]>): Actor => ({
  id: u.id,
  nombre: `${u.nombre} · ${u.cargo}`,
  admin: u.rol === "ADMIN",
  puedeAnular: puede(u, PROGRAMA, "anular"),
});

hd.get(
  "/libro",
  requierePermiso(PROGRAMA, "ver"),
  h(async (req, res) => {
    const libro = await leerLibro(req.usuario!.rol === "ADMIN");
    await auditar(req, { accion: "CONSULTA", entidad: "hd.libro", programa: PROGRAMA, detalle: `${libro.hojas.pac.length} pacientes` });
    res.json(libro);
  }),
);

hd.get(
  "/version",
  requierePermiso(PROGRAMA, "ver"),
  h(async (_req, res) => {
    res.json({ version: await version() });
  }),
);

const Lote = z.array(z.record(z.unknown())).max(20_000).optional();
const Sincronizacion = z.object({
  cambios: z.record(z.object({ nuevos: Lote, modificados: Lote })).optional(),
  cfg: z.record(z.unknown()).nullable().optional(),
  finBlob: z.unknown().optional(),
});

hd.post(
  "/sincronizar",
  requierePermiso(PROGRAMA, "registrar"),
  h(async (req, res) => {
    const body = Sincronizacion.parse(req.body) as Cambios;
    const r = await prisma.$transaction(
      (tx) => sincronizar(tx, actorDe(req.usuario!), body, (e) => auditar(req, { ...e, programa: PROGRAMA }, tx)),
      { timeout: 60_000, isolationLevel: "Serializable" },
    );
    res.json(r);
  }),
);

const Importacion = z.object({
  fuente: z.string().max(300).optional(),
  hojas: z.record(z.array(z.record(z.unknown())).max(200_000)),
  cfg: z.record(z.unknown()).optional(),
  finBlob: z.unknown().optional(),
});

hd.post(
  "/importar",
  ...requiereAdmin,
  h(async (req, res) => {
    const body = Importacion.parse(req.body);
    const r = await prisma.$transaction((tx) => importar(tx, actorDe(req.usuario!), body), { timeout: 300_000 });
    await auditar(req, {
      accion: "IMPORTA",
      entidad: "hd.libro",
      programa: PROGRAMA,
      detalle: `Carga inicial desde «${body.fuente ?? "archivo"}»: ${Object.entries(r.conteo).map(([k, n]) => `${k}=${n}`).join(", ")}${r.avisos.length ? ` · ${r.avisos.length} avisos` : ""}`,
      despues: { avisos: r.avisos },
    });
    res.json(r);
  }),
);

const EventoCliente = z.object({ accion: z.enum(["EXPORTA"]), detalle: z.string().max(300) });

/** Registro de las exportaciones a Excel hechas desde el módulo (el archivo se arma en el navegador). */
hd.post(
  "/auditar",
  requierePermiso(PROGRAMA, "exportar"),
  h(async (req, res) => {
    const e = EventoCliente.parse(req.body);
    await auditar(req, { accion: e.accion, entidad: "hd.reporte", programa: PROGRAMA, detalle: e.detalle });
    res.json({ ok: true });
  }),
);
