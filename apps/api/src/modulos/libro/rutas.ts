import { Router } from "express";
import { z } from "zod";
import { puede } from "@posmedica/shared";
import { prisma } from "../../db.js";
import { h, prohibido } from "../../http/errors.js";
import { requiereAdmin, requiereSesion } from "../../http/middleware.js";
import { auditar } from "../../services/auditoria.js";
import { actorDe, crearServicioLibro, type Cambios, type ConfigLibro } from "./servicio.js";

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

/** Rutas de un libro: /libro, /version, /sincronizar, /importar (carga inicial) y /auditar (exportaciones).
    Los permisos finos (por hoja y por fila) los aplica el servicio según la configuración del libro. */
export function crearRutasLibro(C: ConfigLibro) {
  const S = crearServicioLibro(C);
  const r = Router();
  r.use(requiereSesion());
  const lee = h(async (req, _res, next) => (S.puedeLeer(req.usuario!) ? next() : next(prohibido())));

  r.get(
    "/libro",
    lee,
    h(async (req, res) => {
      const libro = await S.leerLibro(req.usuario!);
      const total = Object.values(libro.hojas).reduce((a, L) => a + L.length, 0);
      await auditar(req, { accion: "CONSULTA", entidad: `${C.programa}.libro`, programa: C.programa, detalle: `${total} registros` });
      res.json(libro);
    }),
  );

  r.get(
    "/version",
    lee,
    h(async (_req, res) => {
      res.json({ version: await S.version() });
    }),
  );

  r.post(
    "/sincronizar",
    lee,
    h(async (req, res) => {
      if (!S.puedeEscribir(req.usuario!)) throw prohibido(`Su usuario no tiene permiso para registrar en ${C.nombre}.`);
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
    lee,
    h(async (req, res) => {
      const e = EventoCliente.parse(req.body);
      if (req.usuario!.rol !== "ADMIN" && !puede(req.usuario!, C.programa, "exportar") && C.programa !== "portal") throw prohibido("Su usuario no tiene permiso para exportar.");
      await auditar(req, { accion: e.accion, entidad: `${C.programa}.reporte`, programa: C.programa, detalle: e.detalle });
      res.json({ ok: true });
    }),
  );

  return r;
}
