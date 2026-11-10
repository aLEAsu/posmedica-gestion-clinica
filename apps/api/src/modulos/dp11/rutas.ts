/* Diálisis peritoneal v1.1 (fase D, prototipo v3.2). El módulo trabaja sobre un estado completo en memoria (pacientes,
   Kt/V, laboratorios, eventos, valoraciones, visitas, fórmula, habilitación, obligaciones, catálogo, actividades hechas,
   farmacia del mes, plan, costos y metas). Aquí ese estado se guarda registro por registro:
     · cada paciente en dp11_paciente, con su identidad en «persona» (el maestro único compartido con los demás programas);
     · cada elemento de las demás colecciones en dp11_registro, con llave foránea a su paciente cuando le pertenece.
   Igual que el motor de libros: sello de concurrencia en cada modificación, auditoría con valor anterior y nuevo,
   permisos del programa «dp» (ver, registrar, anular, exportar), anular en vez de borrar, y la configuración, los costos
   y los precios del catálogo solo para el administrador (D3). */
import { Router, type Request } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { puede, type UsuarioSesion } from "@posmedica/shared";
import { prisma } from "../../db.js";
import { HttpError, h, prohibido } from "../../http/errors.js";
import { requiereAdmin, requiereSesion } from "../../http/middleware.js";
import { auditar, auditarConsulta } from "../../services/auditoria.js";
import { conReintentos, subirVersion } from "../../services/version.js";

const PROGRAMA = "dp";
const ENTIDAD = "dp11";
const CLAVE_VERSION = "__version_dp11";

/** Colecciones del módulo y cómo se identifica cada elemento. */
export const LISTAS = { ktv: "id", labs: "id", eventos: "id", valoraciones: "id", visitas: "id", formula: "pac|cod", habil: "id", oblig: "id", catalogo: "cod" } as const;
export const MAPAS = ["hechos", "farm"] as const; // objetos: cada llave es un registro
export const UNICOS = ["cfg", "costos", "plan"] as const; // un solo registro (clave «valor»)
const COLECCIONES = ["pacientes", ...Object.keys(LISTAS), ...MAPAS, ...UNICOS] as const;
/** Pertenecen a un paciente (columna «pac»): llevan llave foránea y no se registran para un paciente inexistente. */
const DE_PACIENTE = new Set(["ktv", "labs", "eventos", "valoraciones", "visitas", "formula"]);
/** Registros clínicos: anularlos exige el permiso «anular» (los demás son listas de trabajo del programa). */
const CLINICAS = new Set(["ktv", "labs", "eventos", "valoraciones", "visitas"]);
/** Solo el administrador: metas e indicadores (cfg), costos y el catálogo (lleva precios). */
const SOLO_ADMIN = new Set(["cfg", "costos", "catalogo"]);
/** Identidad del paciente: vive en «persona». */
const IDENTIDAD = ["tipoDoc", "doc", "nombre", "sexo", "fnac", "eps", "municipio", "telefono"] as const;

const esAdmin = (u?: UsuarioSesion) => u?.rol === "ADMIN";
const Item = z.object({ clave: z.string().min(1).max(300), datos: z.record(z.unknown()), _ts: z.string().nullable().optional() });
const Elim = z.object({ clave: z.string().min(1).max(300), _ts: z.string().nullable().optional(), motivo: z.string().max(300).optional() });
const Lote = z.array(Item).max(20_000).optional();
const Sync = z.object({
  cambios: z.record(z.enum(COLECCIONES), z.object({ nuevos: Lote, modificados: Lote, eliminados: z.array(Elim).max(5_000).optional() })),
});
const Importar = z.object({ estado: z.record(z.unknown()), fuente: z.string().max(200).optional() });

type Datos = Record<string, unknown>;
type Tx = Prisma.TransactionClient;
const texto = (v: unknown) => (v == null ? null : String(v).trim() || null);
const iso = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : "");

/** Nombre completo del módulo → nombres y apellidos de «persona»: las dos últimas palabras son los apellidos. */
function partirNombre(nombre: string) {
  const t = nombre.trim().split(/\s+/).filter(Boolean);
  const ap = t.length >= 3 ? t.slice(-2) : t.slice(-1);
  const no = t.slice(0, t.length - ap.length);
  return { primerNombre: no[0] ?? "", segundoNombre: no.slice(1).join(" ") || null, primerApellido: ap[0] ?? "", segundoApellido: ap[1] ?? null };
}

async function datosPersona(tx: Tx, d: Datos) {
  const eps = texto(d.eps);
  const epsId = eps ? (await tx.eps.upsert({ where: { nombre: eps }, create: { nombre: eps }, update: {} })).id : null;
  const nombre = texto(d.nombre);
  const fnac = texto(d.fnac);
  return {
    tipoDoc: texto(d.tipoDoc), documento: texto(d.doc), ...(nombre ? partirNombre(nombre) : {}),
    fechaNacimiento: fnac && /^\d{4}-\d{2}-\d{2}$/.test(fnac) ? new Date(fnac + "T00:00:00Z") : null,
    sexo: texto(d.sexo), epsId, municipio: texto(d.municipio), telefono: texto(d.telefono),
  };
}

/** Busca o crea la persona (por número de documento, como el motor de libros: auditoría A5). Al inscribir solo completa lo
    que falta; al editar su propio paciente actualiza lo que el módulo trae (un campo vacío nunca borra). */
async function resolverPersona(tx: Tx, d: Datos, uid: string, propio?: string) {
  const p = await datosPersona(tx, d);
  if (p.documento) {
    const ex = await tx.persona.findFirst({ where: { documento: p.documento }, include: { dp11Paciente: true } });
    if (ex) {
      if (ex.dp11Paciente && ex.dp11Paciente.id !== propio)
        throw new HttpError(409, `El documento ya pertenece al paciente ${ex.dp11Paciente.id} de Diálisis peritoneal.`, "DUPLICADO");
      const actual = ex as unknown as Record<string, unknown>;
      const fusion = Object.fromEntries(Object.entries(p).filter(([k, v]) => v != null && v !== "" && (propio !== undefined || actual[k] == null || actual[k] === "")));
      await tx.persona.update({ where: { id: ex.id }, data: fusion });
      return ex.id;
    }
  }
  if (!p.primerNombre && !p.primerApellido) throw new HttpError(400, "El paciente necesita al menos el nombre.", "VALIDACION");
  return (await tx.persona.create({ data: { ...p, primerNombre: p.primerNombre ?? "", primerApellido: p.primerApellido ?? "", creadoPor: uid } })).id;
}

type PacienteBD = Prisma.Dp11PacienteGetPayload<{ include: { persona: { include: { eps: true } } } }>;
function pacienteDelModulo(f: PacienteBD): Datos {
  const p = f.persona;
  const nombre = [p.primerNombre, p.segundoNombre, p.primerApellido, p.segundoApellido].filter(Boolean).join(" ");
  const datos = f.datos as Datos;
  return {
    ...datos,
    tipoDoc: p.tipoDoc ?? datos.tipoDoc ?? "", doc: p.documento ?? "", nombre, sexo: p.sexo ?? datos.sexo ?? "",
    fnac: iso(p.fechaNacimiento) || (datos.fnac as string) || "", eps: p.eps?.nombre ?? datos.eps ?? "",
    municipio: p.municipio ?? datos.municipio ?? "", telefono: p.telefono ?? datos.telefono ?? "", id: f.id,
  };
}
const sinIdentidad = (d: Datos) => Object.fromEntries(Object.entries(d).filter(([k]) => !(IDENTIDAD as readonly string[]).includes(k)));
/** Lo que no es del administrador no lleva precios: el catálogo se entrega sin «costo». */
const filtrarDatos = (col: string, d: Datos, u?: UsuarioSesion) => (col === "catalogo" && !esAdmin(u) ? Object.fromEntries(Object.entries(d).filter(([k]) => k !== "costo")) : d);

async function version() {
  const p = await prisma.parametro.findUnique({ where: { programa_clave: { programa: PROGRAMA, clave: CLAVE_VERSION } } });
  return Number(p?.valor ?? 0);
}

/** Estado del módulo para un usuario: colecciones, mapas y únicos, más el sello de cada registro (_ts). */
async function leerEstado(u?: UsuarioSesion) {
  const [pacs, regs] = await Promise.all([
    prisma.dp11Paciente.findMany({ where: { anulado: false }, include: { persona: { include: { eps: true } } }, orderBy: { id: "asc" } }),
    prisma.dp11Registro.findMany({ where: { anulado: false }, orderBy: [{ coleccion: "asc" }, { creadoEn: "asc" }] }),
  ]);
  const estado: Datos = { pacientes: pacs.map(pacienteDelModulo) };
  const ts: Record<string, Record<string, string>> = { pacientes: Object.fromEntries(pacs.map((p) => [p.id, p.actualizadoEn.toISOString()])) };
  for (const k of Object.keys(LISTAS)) estado[k] = [];
  for (const k of MAPAS) estado[k] = {};
  for (const r of regs) {
    if (r.coleccion === "costos" && !esAdmin(u)) continue;
    const d = filtrarDatos(r.coleccion, r.datos as Datos, u);
    (ts[r.coleccion] ??= {})[r.clave] = r.actualizadoEn.toISOString();
    if (r.coleccion in LISTAS) (estado[r.coleccion] as Datos[]).push(d);
    else if ((MAPAS as readonly string[]).includes(r.coleccion)) (estado[r.coleccion] as Datos)[r.clave] = (d as { v?: unknown }).v;
    else estado[r.coleccion] = (d as { v?: unknown }).v;
  }
  return { estado, ts };
}

/** Clave de un elemento de lista (fórmula: paciente|código). */
export const claveDe = (col: string, d: Datos) => (col === "formula" ? `${d.pac}|${d.cod}` : String(d[LISTAS[col as keyof typeof LISTAS] as string] ?? ""));

function permisoEscritura(u: UsuarioSesion, col: string, accion: "registrar" | "anular") {
  if (SOLO_ADMIN.has(col) && !esAdmin(u)) throw prohibido(col === "catalogo" ? "El catálogo de insumos (con sus costos) solo lo cambia el administrador." : "Las metas y los costos de Diálisis peritoneal solo los cambia el administrador.");
  if (!puede(u, PROGRAMA, accion)) throw prohibido(accion === "anular" ? "Su usuario no tiene permiso para anular registros de Diálisis peritoneal." : "Su usuario no tiene permiso para registrar en Diálisis peritoneal.");
}

async function aplicar(req: Request, tx: Tx, col: string, c: z.infer<typeof Sync>["cambios"][string]) {
  const u = req.usuario!;
  const uid = u.id;
  const ts: Record<string, string> = {};
  const conflicto = (clave: string, que: string) => new HttpError(409, `Otro usuario ${que} ${clave} en Diálisis peritoneal mientras usted trabajaba. Se recargará el módulo: revise y repita.`, "CONFLICTO");
  if ((c.nuevos?.length || c.modificados?.length)) permisoEscritura(u, col, "registrar");
  if (c.eliminados?.length) permisoEscritura(u, col, CLINICAS.has(col) || col === "pacientes" ? "anular" : "registrar");

  if (col === "pacientes") {
    for (const f of c.nuevos ?? []) {
      if (await tx.dp11Paciente.findUnique({ where: { id: f.clave } })) throw conflicto(f.clave, "registró");
      const personaId = await resolverPersona(tx, f.datos, uid);
      const r = await tx.dp11Paciente.create({ data: { id: f.clave, personaId, datos: sinIdentidad({ ...f.datos, id: f.clave }) as Prisma.InputJsonValue, creadoPor: uid, actualizadoPor: uid } });
      ts[f.clave] = r.actualizadoEn.toISOString();
      await auditar(req, { accion: "CREA", entidad: `${ENTIDAD}.pacientes`, registroId: f.clave, programa: PROGRAMA, despues: f.datos }, tx);
    }
    for (const f of c.modificados ?? []) {
      const actual = await tx.dp11Paciente.findUnique({ where: { id: f.clave }, include: { persona: { include: { eps: true } } } });
      if (!actual || actual.anulado) throw conflicto(f.clave, "anuló");
      if (!f._ts || actual.actualizadoEn.toISOString() !== f._ts) throw conflicto(f.clave, "modificó");
      const antes = pacienteDelModulo(actual);
      await resolverPersona(tx, f.datos, uid, f.clave);
      const r = await tx.dp11Paciente.update({ where: { id: f.clave }, data: { datos: sinIdentidad({ ...f.datos, id: f.clave }) as Prisma.InputJsonValue, actualizadoPor: uid } });
      ts[f.clave] = r.actualizadoEn.toISOString();
      const dif = Object.keys({ ...antes, ...f.datos }).filter((k) => JSON.stringify(antes[k] ?? null) !== JSON.stringify(f.datos[k] ?? null));
      if (dif.length) await auditar(req, { accion: "MODIFICA", entidad: `${ENTIDAD}.pacientes`, registroId: f.clave, programa: PROGRAMA, antes: Object.fromEntries(dif.map((k) => [k, antes[k] ?? null])), despues: Object.fromEntries(dif.map((k) => [k, f.datos[k] ?? null])) }, tx);
    }
    for (const e of c.eliminados ?? []) {
      const actual = await tx.dp11Paciente.findUnique({ where: { id: e.clave } });
      if (!actual || actual.anulado) continue;
      if (!e._ts || actual.actualizadoEn.toISOString() !== e._ts) throw conflicto(e.clave, "modificó");
      await tx.dp11Paciente.update({ where: { id: e.clave }, data: { anulado: true, motivoAnulacion: e.motivo ?? "Retirado desde el módulo", actualizadoPor: uid } });
      await auditar(req, { accion: "ANULA", entidad: `${ENTIDAD}.pacientes`, registroId: e.clave, programa: PROGRAMA, detalle: e.motivo ?? "Retirado desde el módulo" }, tx);
    }
    return ts;
  }

  const paciente = async (d: Datos) => {
    if (!DE_PACIENTE.has(col)) return null;
    const pid = texto(d.pac);
    if (!pid) throw new HttpError(400, `El registro de ${col} no indica el paciente.`, "VALIDACION");
    const p = await tx.dp11Paciente.findUnique({ where: { id: pid } });
    if (!p || p.anulado) throw new HttpError(400, `El paciente ${pid} no existe en Diálisis peritoneal.`, "VALIDACION");
    return pid;
  };
  for (const f of c.nuevos ?? []) {
    const k = { coleccion: col, clave: f.clave };
    const previo = await tx.dp11Registro.findUnique({ where: { coleccion_clave: k } });
    if (previo && !previo.anulado) throw conflicto(f.clave, "registró");
    const data = { paciente: await paciente(f.datos), datos: f.datos as Prisma.InputJsonValue, anulado: false, motivoAnulacion: null, actualizadoPor: uid };
    // Un elemento anulado puede volver (p. ej. marcar de nuevo una actividad hecha): se reactiva con los datos nuevos.
    const r = previo ? await tx.dp11Registro.update({ where: { coleccion_clave: k }, data }) : await tx.dp11Registro.create({ data: { ...k, ...data, creadoPor: uid } });
    ts[f.clave] = r.actualizadoEn.toISOString();
    await auditar(req, { accion: "CREA", entidad: `${ENTIDAD}.${col}`, registroId: f.clave, programa: PROGRAMA, despues: f.datos }, tx);
  }
  for (const f of c.modificados ?? []) {
    const k = { coleccion: col, clave: f.clave };
    const actual = await tx.dp11Registro.findUnique({ where: { coleccion_clave: k } });
    if (!actual || actual.anulado) throw conflicto(f.clave, "anuló");
    if (!f._ts || actual.actualizadoEn.toISOString() !== f._ts) throw conflicto(f.clave, "modificó");
    // Quien no es administrador no recibe los precios del catálogo: no los puede borrar al guardar (aunque hoy el
    // catálogo es solo del administrador, la regla queda en el servidor).
    const antes = actual.datos as Datos;
    const nuevos = col === "catalogo" && !esAdmin(req.usuario) ? { ...f.datos, costo: antes.costo } : f.datos;
    const r = await tx.dp11Registro.update({ where: { coleccion_clave: k }, data: { paciente: await paciente(nuevos), datos: nuevos as Prisma.InputJsonValue, actualizadoPor: uid } });
    ts[f.clave] = r.actualizadoEn.toISOString();
    const dif = Object.keys({ ...antes, ...nuevos }).filter((x) => JSON.stringify(antes[x] ?? null) !== JSON.stringify(nuevos[x] ?? null));
    if (dif.length) await auditar(req, { accion: "MODIFICA", entidad: `${ENTIDAD}.${col}`, registroId: f.clave, programa: PROGRAMA, antes: Object.fromEntries(dif.map((x) => [x, antes[x] ?? null])), despues: Object.fromEntries(dif.map((x) => [x, nuevos[x] ?? null])) }, tx);
  }
  for (const e of c.eliminados ?? []) {
    const k = { coleccion: col, clave: e.clave };
    const actual = await tx.dp11Registro.findUnique({ where: { coleccion_clave: k } });
    if (!actual || actual.anulado) continue;
    if (!e._ts || actual.actualizadoEn.toISOString() !== e._ts) throw conflicto(e.clave, "modificó");
    const motivo = e.motivo ?? "Retirado desde el módulo";
    await tx.dp11Registro.update({ where: { coleccion_clave: k }, data: { anulado: true, motivoAnulacion: motivo, actualizadoPor: uid } });
    await auditar(req, { accion: "ANULA", entidad: `${ENTIDAD}.${col}`, registroId: e.clave, programa: PROGRAMA, detalle: motivo }, tx);
  }
  return ts;
}

export const dp11 = Router();
dp11.use(requiereSesion());

dp11.get(
  "/libro",
  h(async (req, res) => {
    if (!puede(req.usuario, PROGRAMA, "ver")) throw prohibido();
    const { estado, ts } = await leerEstado(req.usuario);
    await auditarConsulta(req, PROGRAMA, ENTIDAD, `${(estado.pacientes as unknown[]).length} pacientes (Diálisis peritoneal v1.1)`);
    res.json({ version: await version(), estado, ts });
  }),
);

dp11.get(
  "/version",
  h(async (req, res) => {
    if (!puede(req.usuario, PROGRAMA, "ver")) throw prohibido();
    res.json({ version: await version() });
  }),
);

dp11.post(
  "/sincronizar",
  h(async (req, res) => {
    if (!puede(req.usuario, PROGRAMA, "ver")) throw prohibido();
    const { cambios } = Sync.parse(req.body);
    // Pacientes primero: los demás registros pueden referirse a un paciente creado en este mismo guardado.
    const orden = Object.keys(cambios).sort((a, b) => (a === "pacientes" ? -1 : b === "pacientes" ? 1 : 0));
    const ts = await conReintentos(() =>
      prisma.$transaction(
        async (tx) => {
          const out: Record<string, Record<string, string>> = {};
          for (const col of orden) out[col] = await aplicar(req, tx, col, cambios[col as keyof typeof cambios]!);
          return out;
        },
        { timeout: 60_000, isolationLevel: "Serializable" },
      ),
    );
    res.json({ ts, version: await subirVersion(PROGRAMA, CLAVE_VERSION, req.usuario!.id) });
  }),
);

/** Carga inicial (solo administrador, con el módulo vacío): la copia .json que el propio módulo descarga
    («Descargar copia»). Así los datos reales entran a la base sin pasar por el código ni por el repositorio. */
dp11.post(
  "/importar",
  ...requiereAdmin,
  h(async (req, res) => {
    const { estado, fuente } = Importar.parse(req.body);
    if ((await prisma.dp11Paciente.count()) + (await prisma.dp11Registro.count({ where: { coleccion: { in: ["ktv", "labs", "eventos", "valoraciones", "visitas"] } } })) > 0)
      throw new HttpError(409, "Diálisis peritoneal v1.1 ya tiene registros: la importación solo se permite para la carga inicial.", "CONFLICTO");
    const uid = req.usuario!.id;
    const pacientes = Array.isArray(estado.pacientes) ? (estado.pacientes as Datos[]) : [];
    if (!pacientes.length) throw new HttpError(400, "La copia no trae pacientes: no parece una copia de Diálisis peritoneal v1.1.", "VALIDACION");
    const conteo: Record<string, number> = {};
    await prisma.$transaction(
      async (tx) => {
        for (const p of pacientes) {
          const id = texto(p.id);
          if (!id) throw new HttpError(400, "Un paciente de la copia no tiene identificador.", "VALIDACION");
          const personaId = await resolverPersona(tx, p, uid);
          await tx.dp11Paciente.create({ data: { id, personaId, datos: sinIdentidad(p) as Prisma.InputJsonValue, creadoPor: uid, actualizadoPor: uid } });
        }
        conteo.pacientes = pacientes.length;
        const ids = new Set(pacientes.map((p) => String(p.id)));
        // Se conservan las metas y los costos que ya existan (los define el administrador en la aplicación).
        await tx.dp11Registro.deleteMany({ where: { coleccion: { notIn: ["cfg", "costos"] } } });
        const filas: Prisma.Dp11RegistroCreateManyInput[] = [];
        for (const col of Object.keys(LISTAS)) {
          const L = Array.isArray(estado[col]) ? (estado[col] as Datos[]) : [];
          const vistos = new Set<string>();
          for (const d of L) {
            const clave = claveDe(col, d);
            if (!clave || vistos.has(clave)) continue;
            vistos.add(clave);
            const pac = DE_PACIENTE.has(col) ? texto(d.pac) : null;
            if (DE_PACIENTE.has(col) && (!pac || !ids.has(pac))) continue; // registro de un paciente que no viene en la copia
            filas.push({ coleccion: col, clave, paciente: pac, datos: d as Prisma.InputJsonValue, creadoPor: uid, actualizadoPor: uid });
          }
          conteo[col] = vistos.size;
        }
        for (const col of MAPAS) {
          const o = estado[col] && typeof estado[col] === "object" ? (estado[col] as Datos) : {};
          for (const [clave, v] of Object.entries(o)) filas.push({ coleccion: col, clave, datos: { v } as Prisma.InputJsonValue, creadoPor: uid, actualizadoPor: uid });
          conteo[col] = Object.keys(o).length;
        }
        for (const col of UNICOS) {
          if (estado[col] == null || (await tx.dp11Registro.findUnique({ where: { coleccion_clave: { coleccion: col, clave: "valor" } } }))) continue;
          filas.push({ coleccion: col, clave: "valor", datos: { v: estado[col] } as Prisma.InputJsonValue, creadoPor: uid, actualizadoPor: uid });
          conteo[col] = 1;
        }
        for (let i = 0; i < filas.length; i += 1000) await tx.dp11Registro.createMany({ data: filas.slice(i, i + 1000) });
        await auditar(req, { accion: "IMPORTA", entidad: ENTIDAD, programa: PROGRAMA, detalle: `${fuente ?? "copia del módulo"}: ` + Object.entries(conteo).map(([k, n]) => `${k}=${n}`).join(", ") }, tx);
      },
      { timeout: 300_000 },
    );
    await subirVersion(PROGRAMA, CLAVE_VERSION, uid);
    res.json({ conteo });
  }),
);

/* ---------- Paso de Diálisis peritoneal v0.8 (tablas dp_*) a la v1.1 (decisión del 10 nov 2026) ----------
   Solo lo que tiene equivalencia clara; nada se completa con valores supuestos:
     · pacientes: la MISMA persona del maestro; estados de la v0.8 sin par en la v1.1 se conservan tal cual y se anotan;
     · laboratorios: exámenes con el mismo significado y valor numérico. «Urea / BUN sérico» NO se traslada (la v0.8 no
       distingue urea de BUN, que difieren en un factor 2,14); Kt/V, PET, UF, líquido peritoneal y carga viral tienen otra
       estructura en la v1.1 (se registran allí). Todo lo no trasladado se informa con su conteo. */
const EXAMEN_V08_A_V11: Record<string, string> = {
  Hb: "Hb", Ferritina: "Ferritina", TSAT: "TSAT", Alb: "Alb", P: "P", Ca: "Ca", PTH: "PTH", K: "K", Na: "Na", Creat: "Creat",
  HbA1c: "HbA1c", Glu: "Glic", AntiHBs: "AntiHBs", HBsAg: "HBsAg", AntiVHC: "AntiVHC", VIH: "VIH", Diuresis: "Diuresis",
};
const ESTADO_V08_A_V11: Record<string, string> = { Activo: "Activo", Reentrenamiento: "Activo", "Suspendido temporal": "Activo", "Transición a HD": "Cambio a HD" };
const ESTADOS_V11 = ["Activo", "Cambio a HD", "Trasplantado", "Fallecido", "Abandono", "Traslado a otra unidad", "Recuperación de función", "Otro egreso"];
const numero = (v: unknown) => {
  if (v == null || v === "") return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

dp11.post(
  "/traer-v08",
  ...requiereAdmin,
  h(async (req, res) => {
    if ((await prisma.dp11Paciente.count()) > 0) throw new HttpError(409, "Diálisis peritoneal v1.1 ya tiene pacientes: el paso desde la v0.8 solo se hace con la v1.1 vacía.", "CONFLICTO");
    const uid = req.usuario!.id;
    const pacs = await prisma.dpPaciente.findMany({ where: { OR: [{ Anulado: null }, { Anulado: { not: "SI" } }] }, include: { persona: { include: { eps: true } } }, orderBy: { ID: "asc" } });
    const labs = await prisma.dpLaboratorio.findMany({ where: { OR: [{ Anulado: null }, { Anulado: { not: "SI" } }] } });
    const informe = { pacientes: 0, laboratorios: 0, laboratoriosNoTrasladados: {} as Record<string, number>, estadosConservados: {} as Record<string, number> };
    await prisma.$transaction(
      async (tx) => {
        const ids = new Set<string>();
        for (const p of pacs) {
          const per = p.persona;
          const est = String(p.EstadoPrograma ?? "");
          let estado = ESTADO_V08_A_V11[est];
          const obs = [`Traído de Diálisis peritoneal v0.8 (${p.ID}).`];
          if (!estado && est === "Egreso" && ESTADOS_V11.includes(String(p.MotivoFin ?? ""))) estado = String(p.MotivoFin);
          if (!estado) {
            estado = est; // sin equivalencia: se conserva el estado de la v0.8, no se supone otro
            informe.estadosConservados[est || "(vacío)"] = (informe.estadosConservados[est || "(vacío)"] ?? 0) + 1;
            obs.push(`Estado en la v0.8: «${est || "sin estado"}»${p.MotivoFin ? `, motivo «${p.MotivoFin}»` : ""}. Revise y asigne el estado de la v1.1.`);
          }
          const datos = {
            id: p.ID, modalidad: p.Modalidad ?? "", nepro: false, edad: null, cuidador: p.Cuidador ?? "",
            fIngresoDP: iso(p.FechaInicioDP ?? p.FechaIngresoPrograma), fIngresoTRR: iso(p.FechaInicioTRR), estado,
            fEgreso: iso(p.FechaFinDP), causaEgreso: p.MotivoFin ?? "", dm: p.DM ?? "", hta: p.HTA ?? "", etiologia: p.Etiologia ?? "",
            cateter: { tipo: "", fImplante: iso(p.FechaCateter), cirujano: "" }, tx: "", vacHB: p.VacunaVHB ?? "", diuresis: "", obsFuente: obs,
          };
          await tx.dp11Paciente.create({ data: { id: p.ID, personaId: per.id, datos: datos as Prisma.InputJsonValue, creadoPor: uid, actualizadoPor: uid } });
          ids.add(p.ID);
        }
        informe.pacientes = ids.size;
        const filas: Prisma.Dp11RegistroCreateManyInput[] = [];
        for (const l of labs) {
          const ex = EXAMEN_V08_A_V11[String(l.Examen ?? "")];
          const v = numero(l.Valor);
          if (!ex || v == null || !l.Paciente || !ids.has(l.Paciente) || !l.FechaToma) {
            const k = String(l.Examen ?? "(sin examen)");
            informe.laboratoriosNoTrasladados[k] = (informe.laboratoriosNoTrasladados[k] ?? 0) + 1;
            continue;
          }
          const clave = `L08-${l.ID}`;
          filas.push({ coleccion: "labs", clave, paciente: l.Paciente, datos: { id: clave, pac: l.Paciente, fecha: iso(l.FechaToma), ex, v, fuente: `Diálisis peritoneal v0.8 (${l.ID})` } as Prisma.InputJsonValue, creadoPor: uid, actualizadoPor: uid });
        }
        for (let i = 0; i < filas.length; i += 1000) await tx.dp11Registro.createMany({ data: filas.slice(i, i + 1000) });
        informe.laboratorios = filas.length;
        await auditar(req, { accion: "IMPORTA", entidad: ENTIDAD, programa: PROGRAMA, detalle: `Desde Diálisis peritoneal v0.8: ${informe.pacientes} pacientes, ${informe.laboratorios} laboratorios (${Object.values(informe.laboratoriosNoTrasladados).reduce((a, b) => a + b, 0)} no trasladados)` }, tx);
      },
      { timeout: 300_000 },
    );
    await subirVersion(PROGRAMA, CLAVE_VERSION, uid);
    res.json(informe);
  }),
);

/* ---------- Contenido de los contratos por EPS (qué cubre cada paquete de DP) ----------
   No lleva precios ni pacientes, pero es información contractual de la institución: no va en el código público. Lo lee
   quien ve Diálisis peritoneal y lo carga el administrador (parámetro «contratos» del programa dp). */
const Contratos = z.object({ contratos: z.record(z.record(z.unknown())), fuente: z.string().max(200).optional() });
dp11.get(
  "/contratos",
  h(async (req, res) => {
    if (!puede(req.usuario, PROGRAMA, "ver")) throw prohibido();
    const p = await prisma.parametro.findUnique({ where: { programa_clave: { programa: PROGRAMA, clave: "contratos" } } });
    res.json({ contratos: p?.valor ?? null });
  }),
);
dp11.post(
  "/contratos",
  ...requiereAdmin,
  h(async (req, res) => {
    const { contratos, fuente } = Contratos.parse(req.body);
    await prisma.$transaction(async (tx) => {
      await tx.parametro.upsert({
        where: { programa_clave: { programa: PROGRAMA, clave: "contratos" } },
        create: { programa: PROGRAMA, clave: "contratos", valor: contratos as Prisma.InputJsonValue, actualizadoPor: req.usuario!.id },
        update: { valor: contratos as Prisma.InputJsonValue, actualizadoPor: req.usuario!.id, vigenteDesde: new Date() },
      });
      await auditar(req, { accion: "IMPORTA", entidad: `${ENTIDAD}.contratos`, programa: PROGRAMA, detalle: `${fuente ?? "contratos"}: ${Object.keys(contratos).join(", ")}` }, tx);
    });
    res.json({ eps: Object.keys(contratos).length });
  }),
);

const Evento = z.object({ accion: z.enum(["EXPORTA"]), detalle: z.string().max(300) });
dp11.post(
  "/auditar",
  h(async (req, res) => {
    if (!puede(req.usuario, PROGRAMA, "exportar")) throw prohibido("Su usuario no tiene permiso para exportar en Diálisis peritoneal.");
    const e = Evento.parse(req.body);
    await auditar(req, { accion: e.accion, entidad: `${ENTIDAD}.reporte`, programa: PROGRAMA, detalle: e.detalle });
    res.json({ ok: true });
  }),
);
