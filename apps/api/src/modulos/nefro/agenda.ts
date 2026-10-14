/* Hojas de la Ruta de Nefroprotección que su «modo base de datos» aún no guardaba: la agenda (jornadas, citas, bitácora
   de citas y contactos) y, desde la v8, la auditoría de adherencia a guías (Auditoria_GPC), el arrastre de la nominal
   por EPS (Arrastre_nominal) y su configuración (Config_nominal). Se guardan fila por fila, con las mismas columnas de
   sus hojas de Excel, para que la Ruta las vuelva a leer con su propio lector. */
import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { puede } from "@posmedica/shared";
import { prisma } from "../../db.js";
import { HttpError, h, prohibido } from "../../http/errors.js";
import { requiereAdmin, requiereSesion } from "../../http/middleware.js";
import { auditar, auditarConsulta } from "../../services/auditoria.js";
import { conReintentos, subirVersion } from "../../services/version.js";

export const HOJAS_AGENDA = ["Jornadas", "Citas", "Citas_log", "Contactos", "Auditoria_GPC", "Arrastre_nominal", "Config_nominal"] as const;
/** La configuración de la nominal (códigos de la IPS ante la EPS) solo la cambia el administrador. */
const SOLO_ADMIN = new Set(["Config_nominal"]);
const PROGRAMA = "nefro";

const Fila = z.object({ clave: z.string().min(1).max(500), datos: z.record(z.unknown()), _ts: z.string().nullable().optional() });
const Lote = z.array(Fila).max(50_000).optional();
const Sync = z.object({ cambios: z.record(z.enum(HOJAS_AGENDA), z.object({ nuevos: Lote, modificados: Lote })) });
const Importar = z.object({ hojas: z.record(z.enum(HOJAS_AGENDA), z.array(Fila).max(200_000)) });

async function version() {
  const p = await prisma.parametro.findUnique({ where: { programa_clave: { programa: PROGRAMA, clave: "__version_agenda" } } });
  return Number(p?.valor ?? 0);
}

export const nefroAgenda = Router();
nefroAgenda.use(requiereSesion());

nefroAgenda.get(
  "/agenda",
  h(async (req, res) => {
    if (!puede(req.usuario, PROGRAMA, "ver")) throw prohibido();
    const filas = await prisma.nefroAgendaFila.findMany({ orderBy: [{ hoja: "asc" }, { creadoEn: "asc" }] });
    await auditarConsulta(req, PROGRAMA, "nefro.agenda", `${filas.length} filas (agenda, auditoría GPC, nominal)`);
    const hojas: Record<string, unknown[]> = Object.fromEntries(HOJAS_AGENDA.map((x) => [x, []]));
    for (const f of filas) hojas[f.hoja]?.push({ clave: f.clave, datos: f.datos, _ts: f.actualizadoEn.toISOString() });
    res.json({ version: await version(), hojas });
  }),
);

/** Ocupación de los profesionales en la agenda de la Ruta (sin datos de pacientes): fecha, profesional, horario y estado
    de cada jornada desde ayer. La usa Consulta externa para no cruzar a un profesional entre programas (ceNefroJor del
    prototipo, que solo funcionaba si la Ruta estaba abierta en la misma sesión). */
nefroAgenda.get(
  "/agenda/ocupacion",
  h(async (req, res) => {
    if (!puede(req.usuario, PROGRAMA, "ver") && !puede(req.usuario, "ce", "ver")) throw prohibido();
    const desde = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    const filas = await prisma.nefroAgendaFila.findMany({ where: { hoja: "Jornadas" } });
    const jornadas = filas
      .map((f) => f.datos as Record<string, unknown>)
      .filter((d) => String(d.fecha ?? "") >= desde)
      .map((d) => ({ fecha: d.fecha, profesional: d.profesional, hora_inicio: d.hora_inicio, hora_fin: d.hora_fin, estado: d.estado }));
    res.json({ jornadas });
  }),
);

nefroAgenda.post(
  "/agenda/sincronizar",
  h(async (req, res) => {
    if (!puede(req.usuario, PROGRAMA, "registrar")) throw prohibido("Su usuario no tiene permiso para registrar en la agenda de Nefroprotección.");
    const { cambios } = Sync.parse(req.body);
    if (req.usuario!.rol !== "ADMIN" && Object.keys(cambios).some((x) => SOLO_ADMIN.has(x))) throw prohibido("Solo el administrador puede cambiar la configuración de la nominal.");
    const uid = req.usuario!.id;
    const out = await conReintentos(() => prisma.$transaction(
      async (tx) => {
        const ts: Record<string, Record<string, string>> = {};
        for (const [hoja, c] of Object.entries(cambios)) {
          for (const f of c.nuevos ?? []) {
            const k = { hoja, clave: f.clave };
            if (await tx.nefroAgendaFila.findUnique({ where: { hoja_clave: k } })) throw new HttpError(409, `Otro usuario registró ${f.clave} en la agenda al mismo tiempo. Se recargará la agenda: repita la acción.`, "CONFLICTO");
            const r = await tx.nefroAgendaFila.create({ data: { ...k, datos: f.datos as Prisma.InputJsonValue, creadoPor: uid, actualizadoPor: uid } });
            (ts[hoja] ??= {})[f.clave] = r.actualizadoEn.toISOString();
            await auditar(req, { accion: "CREA", entidad: `nefro.agenda.${hoja}`, registroId: f.clave, programa: PROGRAMA, despues: f.datos }, tx);
          }
          for (const f of c.modificados ?? []) {
            const k = { hoja, clave: f.clave };
            const actual = await tx.nefroAgendaFila.findUnique({ where: { hoja_clave: k } });
            if (!actual) throw new HttpError(409, `${f.clave} ya no existe en la agenda. Se recargará la agenda.`, "CONFLICTO");
            if (f._ts && actual.actualizadoEn.toISOString() !== f._ts) throw new HttpError(409, `Otro usuario modificó ${f.clave} en la agenda mientras usted trabajaba. Se recargará la agenda: revise y repita.`, "CONFLICTO");
            const r = await tx.nefroAgendaFila.update({ where: { hoja_clave: k }, data: { datos: f.datos as Prisma.InputJsonValue, actualizadoPor: uid } });
            (ts[hoja] ??= {})[f.clave] = r.actualizadoEn.toISOString();
            const antes = actual.datos as Record<string, unknown>;
            const dif = Object.keys({ ...antes, ...f.datos }).filter((x) => JSON.stringify(antes[x] ?? null) !== JSON.stringify(f.datos[x] ?? null));
            if (dif.length) {
              await auditar(req, { accion: "MODIFICA", entidad: `nefro.agenda.${hoja}`, registroId: f.clave, programa: PROGRAMA, antes: Object.fromEntries(dif.map((x) => [x, antes[x] ?? null])), despues: Object.fromEntries(dif.map((x) => [x, f.datos[x] ?? null])) }, tx);
            }
          }
        }
        return { ts };
      },
      { timeout: 60_000, isolationLevel: "Serializable" },
    ));
    // La versión de la agenda se sube después de confirmar (services/version.ts): dos guardados distintos no chocan.
    res.json({ ...out, version: await subirVersion(PROGRAMA, "__version_agenda", uid) });
  }),
);

/** Carga inicial de la agenda desde el libro de Excel de la Ruta (solo administrador, con la agenda vacía). */
nefroAgenda.post(
  "/agenda/importar",
  ...requiereAdmin,
  h(async (req, res) => {
    const { hojas } = Importar.parse(req.body);
    if ((await prisma.nefroAgendaFila.count()) > 0) throw new HttpError(409, "La agenda ya tiene registros: la importación solo se permite para la carga inicial.", "CONFLICTO");
    const conteo: Record<string, number> = {};
    await prisma.$transaction(
      async (tx) => {
        for (const [hoja, L] of Object.entries(hojas)) {
          const vistos = new Set<string>();
          const data = L.filter((f) => !vistos.has(f.clave) && vistos.add(f.clave)).map((f) => ({ hoja, clave: f.clave, datos: f.datos as Prisma.InputJsonValue, creadoPor: req.usuario!.id, actualizadoPor: req.usuario!.id }));
          for (let i = 0; i < data.length; i += 1000) await tx.nefroAgendaFila.createMany({ data: data.slice(i, i + 1000) });
          conteo[hoja] = data.length;
        }
        await auditar(req, { accion: "IMPORTA", entidad: "nefro.agenda", programa: PROGRAMA, detalle: Object.entries(conteo).map(([k, n]) => `${k}=${n}`).join(", ") }, tx);
      },
      { timeout: 300_000 },
    );
    res.json({ conteo });
  }),
);

const Evento = z.object({ accion: z.enum(["EXPORTA"]), detalle: z.string().max(300) });
nefroAgenda.post(
  "/auditar",
  h(async (req, res) => {
    if (!puede(req.usuario, PROGRAMA, "exportar")) throw prohibido("Su usuario no tiene permiso para exportar en Nefroprotección.");
    const e = Evento.parse(req.body);
    await auditar(req, { accion: e.accion, entidad: "nefro.reporte", programa: PROGRAMA, detalle: e.detalle });
    res.json({ ok: true });
  }),
);
