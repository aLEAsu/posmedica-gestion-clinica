import { Router } from "express";
import { z } from "zod";
import { puede } from "@posmedica/shared";
import { prisma } from "../../db.js";
import { h } from "../../http/errors.js";
import { requiereAdmin, requierePermiso } from "../../http/middleware.js";
import { auditar } from "../../services/auditoria.js";
import { crearServicioLibro, type Actor, type Cambios, type ConfigLibro } from "./servicio.js";

const Lote = z.array(z.record(z.unknown())).max(20_000).optional();
const Sincronizacion = z.object({
  cambios: z.record(z.object({ nuevos: Lote, modificados: Lote })).optional(),
  cfg: z.record(z.unknown()).nullable().optional(),
  finBlob: z.unknown().optional(),
});
const Importacion = z.object({
  fuente: z.string().max(300).optional(),
  hojas: z.record(z.array(z.record(z.unknown())).max(200_000)),
  cfg: z.record(z.unknown()).optional(),
  finBlob: z.unknown().optional(),
});
const EventoCliente = z.object({ accion: z.enum(["EXPORTA"]), detalle: z.string().max(300) });

/** Rutas de un libro de programa: /libro, /version, /sincronizar, /importar (carga inicial) y /auditar (exportaciones). */
export function crearRutasLibro(C: ConfigLibro) {
  const S = crearServicioLibro(C);
  const r = Router();
  const actorDe = (u: NonNullable<Express.Request["usuario"]>): Actor => ({
    id: u.id,
    nombre: `${u.nombre} · ${u.cargo}`,
    admin: u.rol === "ADMIN",
    puedeAnular: puede(u, C.programa, "anular"),
  });

  r.get(
    "/libro",
    requierePermiso(C.programa, "ver"),
    h(async (req, res) => {
      const libro = await S.leerLibro(req.usuario!.rol === "ADMIN");
      await auditar(req, { accion: "CONSULTA", entidad: `${C.programa}.libro`, programa: C.programa, detalle: `${libro.hojas[C.paciente.hoja].length} pacientes` });
      res.json(libro);
    }),
  );

  r.get(
    "/version",
    requierePermiso(C.programa, "ver"),
    h(async (_req, res) => {
      res.json({ version: await S.version() });
    }),
  );

  r.post(
    "/sincronizar",
    requierePermiso(C.programa, "registrar"),
    h(async (req, res) => {
      const body = Sincronizacion.parse(req.body) as Cambios;
      const out = await prisma.$transaction(
        (tx) => S.sincronizar(tx, actorDe(req.usuario!), body, (e) => auditar(req, { ...e, programa: C.programa }, tx)),
        { timeout: 60_000, isolationLevel: "Serializable" },
      );
      res.json(out);
    }),
  );

  r.post(
    "/importar",
    ...requiereAdmin,
    h(async (req, res) => {
      const body = Importacion.parse(req.body);
      const out = await prisma.$transaction((tx) => S.importar(tx, actorDe(req.usuario!), body), { timeout: 300_000 });
      await auditar(req, {
        accion: "IMPORTA",
        entidad: `${C.programa}.libro`,
        programa: C.programa,
        detalle: `Carga inicial desde «${body.fuente ?? "archivo"}»: ${Object.entries(out.conteo).map(([k, n]) => `${k}=${n}`).join(", ")}${out.avisos.length ? ` · ${out.avisos.length} avisos` : ""}`,
        despues: { avisos: out.avisos },
      });
      res.json(out);
    }),
  );

  r.post(
    "/auditar",
    requierePermiso(C.programa, "exportar"),
    h(async (req, res) => {
      const e = EventoCliente.parse(req.body);
      await auditar(req, { accion: e.accion, entidad: `${C.programa}.reporte`, programa: C.programa, detalle: e.detalle });
      res.json({ ok: true });
    }),
  );

  return r;
}
