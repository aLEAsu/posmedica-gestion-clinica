/* Fachada compatible con la API que la Ruta de Nefroprotección v7.2 usaba en su «modo base de datos» (PostgREST
   detrás de nginx en /api). El código de la Ruta no se modifica: solo se le indica que su API está en
   /api/v1/nefro/pg/. Se atienden exactamente las consultas, inserciones, anulaciones y funciones que el prototipo usa:
     GET   eps, paciente, laboratorio, valoracion, atencion, novedad, v_eps_modelo_vigente, contacto_gestion
     POST  atencion, laboratorio, novedad, contacto_gestion, eps_modelo_atencion
     PATCH laboratorio|atencion|valoracion?id=eq.<id>   {anulado:true, motivo_anulacion}
     POST  rpc/guardar_paciente, rpc/registrar_valoracion, rpc/importar_libro, rpc/congelar_corte
   Los errores se responden como {message}, que es lo que la Ruta muestra. */
import { Router, type NextFunction, type Request, type Response } from "express";
import type { Prisma } from "@prisma/client";
import { puede } from "@posmedica/shared";
import { prisma } from "../../db.js";
import { HttpError } from "../../http/errors.js";
import { requiereSesion } from "../../http/middleware.js";
import { auditar } from "../../services/auditoria.js";
import { aFecha, fechaTexto } from "../libro/servicio.js";

type Tx = Prisma.TransactionClient;
type Obj = Record<string, unknown>;
const PROGRAMA = "nefro";

/* La Ruta nombra las EPS a su manera (COH.EPS); el maestro de EPS usa los nombres de los demás programas. */
const EPS_RUTA: Record<string, string> = { "FAMILIAR DE COLOMBIA": "EPS Familiar de Colombia", "NUEVA EPS": "Nueva EPS", MALLAMAS: "Mallamas EPS" };
const EPS_MAESTRO = Object.fromEntries(Object.entries(EPS_RUTA).map(([k, v]) => [v, k]));
const aNombreRuta = (n: string) => EPS_RUTA[n] ?? n;
const aNombreMaestro = (n: string) => EPS_MAESTRO[n] ?? n;
/* Sexo: la Ruta usa F/M; Hemodiálisis y VIH guardan «Femenino»/«Masculino» en persona. */
const SEXO_PERSONA: Record<string, string> = { F: "Femenino", M: "Masculino", FEMENINO: "Femenino", MASCULINO: "Masculino" };
const SEXO_RUTA: Record<string, string> = { Femenino: "F", Masculino: "M" };

const err = (status: number, message: string) => new HttpError(status, message);
const f = (d: Date | null | undefined) => (d ? fechaTexto(d) : null);
const txt = (v: unknown) => (v == null || v === "" ? null : String(v).trim() || null);
const num = (v: unknown) => (v == null || v === "" ? null : Number.isFinite(Number(v)) ? Number(v) : null);
const fecha = (v: unknown, campo: string) => {
  try {
    return aFecha(v, campo);
  } catch {
    throw err(400, `Fecha inválida en ${campo}.`);
  }
};
const hoy = () => new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));

/** Maneja errores con el formato que lee la Ruta ({message}); nunca expone detalles internos. */
const r =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, _next: NextFunction) =>
    fn(req, res).catch((e) => {
      const status = e instanceof HttpError ? e.status : e?.code === "P2002" ? 409 : 500;
      if (status === 500) console.error(JSON.stringify({ nivel: "error", id: req.id, ruta: req.path, error: e?.name, mensaje: e?.message }));
      res.status(status).json({ message: status === 500 ? "Error interno del servidor." : status === 409 ? `duplicate: ${e.message}` : e.message });
    });

function exige(req: Request, accion: "ver" | "registrar" | "anular") {
  if (!puede(req.usuario, PROGRAMA, accion)) throw err(403, "Su usuario no tiene permiso para esta acción en Nefroprotección.");
}

async function epsIdDe(tx: Tx, nombre: unknown) {
  const n = txt(nombre);
  if (!n) return null;
  const canon = aNombreMaestro(n);
  return (await tx.eps.upsert({ where: { nombre: canon }, create: { nombre: canon }, update: {} })).id;
}

/* ---------- pacientes ---------- */

type PacConPersona = Prisma.NefroPacienteGetPayload<{ include: { persona: true } }>;
function aFilaPaciente(p: PacConPersona) {
  const s = p.persona;
  return {
    id: p.id, codigo: p.codigo, tipo_documento: s.tipoDoc, documento: s.documento, nombre_completo: p.nombreCompleto,
    fecha_nacimiento: f(s.fechaNacimiento), sexo: s.sexo ? (SEXO_RUTA[s.sexo] ?? s.sexo) : null, eps_id: s.epsId, municipio: s.municipio,
    telefono_1: s.telefono, telefono_2: p.telefono2, direccion: s.direccion, acudiente_nombre: p.acudienteNombre, acudiente_telefono: p.acudienteTelefono,
    fecha_ingreso: f(p.fechaIngreso), hta: p.hta, diabetes: p.diabetes, enf_cardiovascular: p.enfCardiovascular, causa_erc: p.causaErc,
    situacion_renal: p.situacionRenal, estado: p.estado, fecha_estado: f(p.fechaEstado), correo: p.correo, observaciones: p.observaciones,
  };
}

/** Busca o crea la persona; un documento de otro paciente de la Ruta no se mezcla; un campo vacío no borra lo que otro programa registró. */
async function persona(tx: Tx, P: Obj, usuarioId: string, propioId?: string) {
  const sexo = txt(P.sexo);
  const datos = {
    tipoDoc: txt(P.tipo_documento), documento: txt(P.documento), fechaNacimiento: fecha(P.fecha_nacimiento, "fecha_nacimiento"),
    sexo: sexo ? (SEXO_PERSONA[sexo.toUpperCase()] ?? sexo) : null, epsId: await epsIdDe(tx, P.eps),
    municipio: txt(P.municipio), telefono: txt(P.telefono_1), direccion: txt(P.direccion),
  };
  if (datos.documento) {
    const ex = await tx.persona.findFirst({ where: { documento: datos.documento, ...(datos.tipoDoc ? { tipoDoc: datos.tipoDoc } : {}) }, include: { nefroPaciente: true } });
    if (ex) {
      if (ex.nefroPaciente && ex.nefroPaciente.id !== propioId) throw err(409, `Ya existe un paciente con ese documento (${ex.nefroPaciente.codigo}).`);
      await tx.persona.update({ where: { id: ex.id }, data: Object.fromEntries(Object.entries(datos).filter(([, v]) => v != null && v !== "")) });
      return ex.id;
    }
  }
  const nombre = txt(P.nombre_completo) ?? "";
  return (await tx.persona.create({ data: { ...datos, primerNombre: nombre, creadoPor: usuarioId } })).id;
}

function datosPaciente(P: Obj) {
  const b = (v: unknown) => (v == null || v === "" ? null : v === true || v === "SI" || v === "true");
  return {
    nombreCompleto: txt(P.nombre_completo) ?? "", telefono2: txt(P.telefono_2), correo: txt(P.correo), acudienteNombre: txt(P.acudiente_nombre),
    acudienteTelefono: txt(P.acudiente_telefono), fechaIngreso: fecha(P.fecha_ingreso, "fecha_ingreso"), hta: b(P.hta), diabetes: txt(P.diabetes),
    enfCardiovascular: b(P.enf_cardiovascular), causaErc: txt(P.causa_erc), situacionRenal: txt(P.situacion_renal), estado: txt(P.estado) ?? "ACTIVO",
    fechaEstado: fecha(P.fecha_estado, "fecha_estado"), observaciones: txt(P.observaciones),
  };
}

async function guardarPaciente(tx: Tx, P: Obj, usuarioId: string) {
  const codigo = txt(P.codigo);
  if (!codigo) throw err(400, "Falta el código del paciente.");
  const existente = P.id ? await tx.nefroPaciente.findUnique({ where: { id: String(P.id) } }) : await tx.nefroPaciente.findUnique({ where: { codigo } });
  const personaId = await persona(tx, P, usuarioId, existente?.id);
  const d = datosPaciente(P);
  if (existente) {
    const p = await tx.nefroPaciente.update({ where: { id: existente.id }, data: { ...d, codigo, personaId, actualizadoPor: usuarioId } });
    await tx.inscripcionPrograma.updateMany({ where: { programaClave: PROGRAMA, codigoInterno: existente.codigo }, data: { codigoInterno: codigo, estado: d.estado, personaId } });
    return { p, nuevo: false, antes: existente };
  }
  const p = await tx.nefroPaciente.create({ data: { ...d, codigo, personaId, creadoPor: usuarioId, actualizadoPor: usuarioId } });
  await tx.inscripcionPrograma.create({ data: { personaId, programaClave: PROGRAMA, codigoInterno: codigo, estado: d.estado, fechaIngreso: d.fechaIngreso, creadoPor: usuarioId } });
  return { p, nuevo: true, antes: null };
}

/* ---------- laboratorios ---------- */

/** Inserta un paraclínico si no hay otro vigente igual (mismo paciente, fecha y examen). Devuelve si lo insertó. */
async function insertarLab(tx: Tx, pacienteId: string, l: Obj, usuarioId: string, estricto: boolean) {
  const fechaToma = fecha(l.fecha_toma, "fecha_toma");
  const examen = txt(l.examen);
  const valor = num(l.valor);
  if (!fechaToma || !examen || valor == null) throw err(400, "Fecha, examen y valor numérico son obligatorios.");
  const dup = await tx.nefroLaboratorio.findFirst({ where: { pacienteId, fechaToma, examen, anulado: false } });
  if (dup) {
    if (estricto) throw err(409, "duplicate key value violates unique constraint «laboratorio_unico»");
    return false;
  }
  await tx.nefroLaboratorio.create({ data: { pacienteId, fechaToma, examen, valor, creadoPor: usuarioId } });
  return true;
}

export const nefroPg = Router();
nefroPg.use(requiereSesion());

/* ---------- lecturas ---------- */

nefroPg.get(
  "/:tabla",
  r(async (req, res) => {
    exige(req, "ver");
    switch (req.params.tabla) {
      case "eps":
        return res.json((await prisma.eps.findMany({ where: { activo: true }, orderBy: { id: "asc" } })).map((e) => ({ id: e.id, nombre: aNombreRuta(e.nombre) })));
      case "paciente":
        return res.json((await prisma.nefroPaciente.findMany({ include: { persona: true }, orderBy: { codigo: "asc" } })).map(aFilaPaciente));
      case "laboratorio":
        return res.json((await prisma.nefroLaboratorio.findMany({ where: { anulado: false }, orderBy: { fechaToma: "asc" } })).map((l) => ({ id: l.id, paciente_id: l.pacienteId, fecha_toma: f(l.fechaToma), examen: l.examen, valor: l.valor })));
      case "valoracion":
        return res.json((await prisma.nefroValoracion.findMany({ where: { anulado: false }, orderBy: { fecha: "asc" } })).map((v) => ({ ...(v.datos as Obj), id: v.id, paciente_id: v.pacienteId, fecha: f(v.fecha) })));
      case "atencion":
        return res.json((await prisma.nefroAtencion.findMany({ where: { anulado: false }, orderBy: { fecha: "asc" } })).map((a) => ({ id: a.id, paciente_id: a.pacienteId, fecha: f(a.fecha), disciplina: a.disciplina, estado: a.estado })));
      case "novedad":
        return res.json((await prisma.nefroNovedad.findMany({ orderBy: { fecha: "asc" } })).map((n) => ({ id: n.id, paciente_id: n.pacienteId, fecha: f(n.fecha), tipo: n.tipo, detalle: n.detalle })));
      case "contacto_gestion":
        return res.json((await prisma.nefroContacto.findMany({ orderBy: { fechaHora: "asc" } })).map((c) => ({ paciente_id: c.pacienteId, fecha_hora: c.fechaHora.toISOString(), medio: c.medio, resultado: c.resultado, cita_fecha: f(c.citaFecha), motivo: c.motivo, observaciones: c.observaciones })));
      case "v_eps_modelo_vigente": {
        const L = await prisma.epsModeloAtencion.findMany({ include: { eps: true }, orderBy: { vigenteDesde: "desc" } });
        const vistos = new Set<number>();
        return res.json(
          L.filter((m) => !vistos.has(m.epsId) && vistos.add(m.epsId)).map((m) => ({
            eps: aNombreRuta(m.eps.nombre), contacto_intermedio: m.contactoIntermedio, contacto_meses: m.contactoMeses, ajuste_metas_por: m.ajusteMetasPor,
            multidisciplinario: m.multidisciplinario, medicamentos_contratados: m.medicamentosContratados, vigente_desde: m.vigenteDesde.toISOString(), observaciones: m.observaciones,
          })),
        );
      }
      default:
        throw err(404, `Tabla desconocida: ${req.params.tabla}`);
    }
  }),
);

/* ---------- inserciones ---------- */

nefroPg.post(
  "/:tabla",
  r(async (req, res) => {
    const tabla = req.params.tabla;
    if (tabla === "rpc") throw err(404, "Función no indicada.");
    const filas = Array.isArray(req.body) ? (req.body as Obj[]) : [req.body as Obj];
    if (tabla === "eps_modelo_atencion" && req.usuario!.rol !== "ADMIN") throw err(403, "Solo el administrador puede cambiar el modelo de atención por EPS.");
    exige(req, "registrar");
    const uid = req.usuario!.id;
    await prisma.$transaction(async (tx) => {
      for (const x of filas) {
        const pid = String(x.paciente_id ?? "");
        if (tabla !== "eps_modelo_atencion" && !(await tx.nefroPaciente.findUnique({ where: { id: pid } }))) throw err(400, "El paciente no existe.");
        let id = "";
        if (tabla === "atencion") {
          const fe = fecha(x.fecha, "fecha");
          if (!fe || !txt(x.disciplina)) throw err(400, "Fecha y disciplina son obligatorias.");
          id = (await tx.nefroAtencion.create({ data: { pacienteId: pid, fecha: fe, disciplina: txt(x.disciplina)!, estado: txt(x.estado), creadoPor: uid } })).id;
        } else if (tabla === "laboratorio") {
          await insertarLab(tx, pid, x, uid, true);
        } else if (tabla === "novedad") {
          const fe = fecha(x.fecha, "fecha");
          if (!fe || !txt(x.tipo)) throw err(400, "Fecha y tipo son obligatorios.");
          id = (await tx.nefroNovedad.create({ data: { pacienteId: pid, fecha: fe, tipo: txt(x.tipo)!, detalle: txt(x.detalle), creadoPor: uid } })).id;
        } else if (tabla === "contacto_gestion") {
          if (!txt(x.medio) || !txt(x.resultado)) throw err(400, "Medio y resultado son obligatorios.");
          id = (await tx.nefroContacto.create({ data: { pacienteId: pid, medio: txt(x.medio)!, resultado: txt(x.resultado)!, citaFecha: fecha(x.cita_fecha, "cita_fecha"), motivo: txt(x.motivo), observaciones: txt(x.observaciones), creadoPor: uid } })).id;
        } else if (tabla === "eps_modelo_atencion") {
          const epsId = Number(x.eps_id);
          if (!(await tx.eps.findUnique({ where: { id: epsId } }))) throw err(400, "EPS desconocida.");
          id = (await tx.epsModeloAtencion.create({
            data: { epsId, contactoIntermedio: txt(x.contacto_intermedio), contactoMeses: num(x.contacto_meses), ajusteMetasPor: txt(x.ajuste_metas_por), multidisciplinario: txt(x.multidisciplinario), medicamentosContratados: x.medicamentos_contratados == null ? null : !!x.medicamentos_contratados, observaciones: txt(x.observaciones), creadoPor: uid },
          })).id;
        } else throw err(404, `Tabla desconocida: ${tabla}`);
        await auditar(req, { accion: tabla === "eps_modelo_atencion" ? "CONFIGURA" : "CREA", entidad: `nefro.${tabla}`, registroId: id || undefined, programa: PROGRAMA, despues: x }, tx);
      }
    });
    res.status(201).end();
  }),
);

/* ---------- anulaciones (PATCH tabla?id=eq.X) ---------- */

nefroPg.patch(
  "/:tabla",
  r(async (req, res) => {
    exige(req, "anular");
    const tabla = req.params.tabla;
    const id = /^eq\.(.+)$/.exec(String(req.query.id ?? ""))?.[1];
    const b = req.body as Obj;
    const motivo = txt(b.motivo_anulacion);
    if (!id || b.anulado !== true || !motivo) throw err(400, "Solo se admite anular un registro con su motivo.");
    const data = { anulado: true, motivoAnulacion: motivo, anuladoPor: req.usuario!.id, anuladoEn: new Date() };
    await prisma.$transaction(async (tx) => {
      if (tabla === "laboratorio") await tx.nefroLaboratorio.update({ where: { id }, data });
      else if (tabla === "atencion") await tx.nefroAtencion.update({ where: { id }, data });
      else if (tabla === "valoracion") await tx.nefroValoracion.update({ where: { id }, data });
      else throw err(404, `No se puede anular en ${tabla}.`);
      await auditar(req, { accion: "ANULA", entidad: `nefro.${tabla}`, registroId: id, programa: PROGRAMA, detalle: motivo }, tx);
    });
    res.status(204).end();
  }),
);

/* ---------- funciones (rpc) ---------- */

nefroPg.post(
  "/rpc/:fn",
  r(async (req, res) => {
    const p = ((req.body as Obj)?.p ?? {}) as Obj;
    const uid = req.usuario!.id;
    switch (req.params.fn) {
      case "guardar_paciente": {
        exige(req, "registrar");
        const P = (p.paciente ?? {}) as Obj;
        const out = await prisma.$transaction(async (tx) => {
          const g = await guardarPaciente(tx, P, uid);
          const tipo = txt(p.novedad_tipo);
          if (g.nuevo) {
            await tx.nefroNovedad.create({ data: { pacienteId: g.p.id, fecha: g.p.fechaIngreso ?? hoy(), tipo: tipo ?? "INGRESO", detalle: txt(p.novedad_detalle) ?? "Ingreso al programa", creadoPor: uid } });
          } else if (tipo && g.antes && g.antes.estado !== g.p.estado) {
            await tx.nefroNovedad.create({ data: { pacienteId: g.p.id, fecha: g.p.fechaEstado ?? hoy(), tipo, detalle: txt(p.novedad_detalle), creadoPor: uid } });
          }
          await auditar(req, { accion: g.nuevo ? "CREA" : "MODIFICA", entidad: "nefro.paciente", registroId: g.p.codigo, programa: PROGRAMA, antes: g.antes ?? undefined, despues: P }, tx);
          return { id: g.p.id, nuevo: g.nuevo };
        });
        return res.json(out);
      }
      case "registrar_valoracion": {
        exige(req, "registrar");
        const v = (p.valoracion ?? {}) as Obj;
        const out = await prisma.$transaction(async (tx) => {
          const pid = String(v.paciente_id ?? "");
          if (!(await tx.nefroPaciente.findUnique({ where: { id: pid } }))) throw err(400, "El paciente no existe.");
          const fe = fecha(v.fecha, "fecha");
          if (!fe) throw err(400, "Falta la fecha de la valoración.");
          const { paciente_id: _p, fecha: _f, ...datos } = v;
          const val = await tx.nefroValoracion.create({ data: { pacienteId: pid, fecha: fe, datos: datos as Prisma.InputJsonValue, creadoPor: uid } });
          let labs = 0;
          for (const l of (p.laboratorios as Obj[]) ?? []) if (await insertarLab(tx, pid, l, uid, false)) labs++;
          const plan = ((p.plan as Obj[]) ?? []).map((d, orden) => ({ valoracionId: val.id, orden, datos: d as Prisma.InputJsonValue }));
          if (plan.length) await tx.nefroPlanItem.createMany({ data: plan });
          await auditar(req, { accion: "CREA", entidad: "nefro.valoracion", registroId: val.id, programa: PROGRAMA, despues: v, detalle: `${labs} paraclínicos nuevos, ${plan.length} ítems del plan` }, tx);
          return { valoracion_id: val.id, laboratorios: labs, plan: plan.length };
        });
        return res.json(out);
      }
      case "importar_libro": {
        if (req.usuario!.rol !== "ADMIN") throw err(403, "Solo el administrador puede importar el libro de la Ruta.");
        const out = await prisma.$transaction(
          async (tx) => {
            const ids = new Map<string, string>();
            let pacientes = 0;
            for (const P of (p.pacientes as Obj[]) ?? []) {
              const g = await guardarPaciente(tx, P, uid);
              ids.set(g.p.codigo, g.p.id);
              pacientes++;
            }
            for (const x of await tx.nefroPaciente.findMany({ select: { id: true, codigo: true } })) if (!ids.has(x.codigo)) ids.set(x.codigo, x.id);
            const pidDe = (c: unknown) => ids.get(String(c ?? "").trim());
            let laboratorios = 0, valoraciones = 0, atenciones = 0, novedades = 0;
            for (const l of (p.laboratorios as Obj[]) ?? []) {
              const pid = pidDe(l.codigo);
              if (pid && (await insertarLab(tx, pid, l, uid, false))) laboratorios++;
            }
            for (const v of (p.valoraciones as Obj[]) ?? []) {
              const pid = pidDe(v.codigo);
              const fe = fecha(v.fecha, "fecha");
              if (!pid || !fe) continue;
              const { codigo: _c, fecha: _f, ...datos } = v;
              const ya = await tx.nefroValoracion.findFirst({ where: { pacienteId: pid, fecha: fe, anulado: false, datos: { path: ["profesional"], equals: (datos.profesional as string) ?? null } } });
              if (ya) continue;
              await tx.nefroValoracion.create({ data: { pacienteId: pid, fecha: fe, datos: datos as Prisma.InputJsonValue, creadoPor: uid } });
              valoraciones++;
            }
            for (const a of (p.atenciones as Obj[]) ?? []) {
              const pid = pidDe(a.codigo);
              const fe = fecha(a.fecha, "fecha");
              const dis = txt(a.disciplina);
              if (!pid || !fe || !dis || (await tx.nefroAtencion.findFirst({ where: { pacienteId: pid, fecha: fe, disciplina: dis, anulado: false } }))) continue;
              await tx.nefroAtencion.create({ data: { pacienteId: pid, fecha: fe, disciplina: dis, estado: txt(a.estado), creadoPor: uid } });
              atenciones++;
            }
            for (const n of (p.novedades as Obj[]) ?? []) {
              const pid = pidDe(n.codigo);
              const fe = fecha(n.fecha, "fecha");
              const tipo = txt(n.tipo);
              if (!pid || !fe || !tipo || (await tx.nefroNovedad.findFirst({ where: { pacienteId: pid, fecha: fe, tipo } }))) continue;
              await tx.nefroNovedad.create({ data: { pacienteId: pid, fecha: fe, tipo, detalle: txt(n.detalle), creadoPor: uid } });
              novedades++;
            }
            const resumen = { pacientes, laboratorios, valoraciones, atenciones, novedades };
            await auditar(req, { accion: "IMPORTA", entidad: "nefro.libro", programa: PROGRAMA, detalle: Object.entries(resumen).map(([k, n]) => `${k}=${n}`).join(", ") }, tx);
            return resumen;
          },
          { timeout: 300_000 },
        );
        return res.json(out);
      }
      case "congelar_corte": {
        exige(req, "registrar");
        const fe = fecha(p.fecha_corte, "fecha_corte");
        if (!fe) throw err(400, "Falta la fecha de corte.");
        const resumen = (p.resumen ?? []) as Prisma.InputJsonValue;
        const detalle = (p.detalle ?? []) as Prisma.InputJsonValue;
        const c = await prisma.nefroCorte.create({ data: { fechaCorte: fe, version: txt(p.version), resumen, detalle, creadoPor: uid } });
        await auditar(req, { accion: "CONGELA_CORTE", entidad: "nefro.corte", registroId: c.id, programa: PROGRAMA, detalle: `Corte ${f(fe)}` });
        const n = (x: unknown) => (Array.isArray(x) ? x.length : x && typeof x === "object" ? Object.keys(x).length : 0);
        return res.json({ id: c.id, resumen: n(p.resumen), detalle: n(p.detalle) });
      }
      default:
        throw err(404, `Función desconocida: ${req.params.fn}`);
    }
  }),
);
