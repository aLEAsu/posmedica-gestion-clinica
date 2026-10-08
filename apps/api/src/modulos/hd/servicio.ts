/* Persistencia del libro de hemodiálisis. El cliente (módulo original del prototipo + adaptador) trabaja con el
   «libro» en la forma del prototipo; aquí se traduce a tablas y viceversa, con validación de tipos, permisos,
   control de concurrencia por registro y auditoría de cada cambio. */
import type { Prisma } from "@prisma/client";
import { crearMotorHD } from "@posmedica/clinical-rules";
import { prisma } from "../../db.js";
import { HttpError } from "../../http/errors.js";
import { CAMPOS_PERSONA, MODELOS_HD } from "./hojas.js";

type Tx = Prisma.TransactionClient;
type Fila = Record<string, unknown>;
type Delegado = {
  findMany: (a?: object) => Promise<Fila[]>;
  findUnique: (a: object) => Promise<Fila | null>;
  create: (a: object) => Promise<Fila>;
  createMany: (a: object) => Promise<{ count: number }>;
  update: (a: object) => Promise<Fila>;
  count: (a?: object) => Promise<number>;
};

export const PROGRAMA = "hd";
const { SH, DATE_F, NUM_F } = crearMotorHD({ libro: { pac: [] } }) as unknown as {
  SH: Record<string, [string, string[]]>;
  DATE_F: Set<string>;
  NUM_F: Set<string>;
};
export const HOJAS = Object.keys(MODELOS_HD); // pac primero: los demás registros lo referencian
const MAX_TEXTO = 50_000;

const delegado = (db: Tx | typeof prisma, hoja: string) => {
  const m = MODELOS_HD[hoja as keyof typeof MODELOS_HD].modelo;
  return (db as unknown as Record<string, Delegado>)[m.charAt(0).toLowerCase() + m.slice(1)];
};
export const columnas = (hoja: string) => SH[hoja][1];
const columnasTabla = (hoja: string) => columnas(hoja).filter((c) => !(hoja === "pac" && CAMPOS_PERSONA.includes(c)));

/* ---------- conversión de valores ---------- */

const pad = (n: number) => String(n).padStart(2, "0");
/** Fecha DATE de PostgreSQL (medianoche UTC) → «AAAA-MM-DD». */
const fechaTexto = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
/** Marca de hora local de la clínica, igual que nowTs() del prototipo: «AAAA-MM-DD HH:MM». */
export const ahoraTexto = () => new Date().toLocaleString("sv-SE", { timeZone: "America/Bogota" }).slice(0, 16);

function aFecha(v: unknown, campo: string): Date | null {
  if (v == null || v === "") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v));
  if (!m) throw new HttpError(400, `Fecha inválida en ${campo}: use AAAA-MM-DD.`, "VALIDACION");
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  if (isNaN(d.getTime()) || d.getUTCFullYear() < 1777 || d.getUTCFullYear() > 2200) throw new HttpError(400, `Fecha fuera de rango en ${campo}.`, "VALIDACION");
  return d;
}
function aNumero(v: unknown, campo: string): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  if (!Number.isFinite(n)) throw new HttpError(400, `Número inválido en ${campo}.`, "VALIDACION");
  return n;
}
function aTexto(v: unknown, campo: string): string | null {
  if (v == null || v === "") return null;
  const s = typeof v === "object" ? JSON.stringify(v) : String(v);
  if (s.length > MAX_TEXTO) throw new HttpError(400, `Texto demasiado largo en ${campo}.`, "VALIDACION");
  return s;
}
function valor(c: string, v: unknown) {
  return DATE_F.has(c) ? aFecha(v, c) : NUM_F.has(c) ? aNumero(v, c) : aTexto(v, c);
}

/** Registro del cliente → datos de la tabla (solo columnas de la hoja; las demás se ignoran, como al guardar el libro). */
function datosTabla(hoja: string, r: Fila) {
  const d: Fila = {};
  for (const c of columnasTabla(hoja)) if (c !== "ID") d[c] = valor(c, r[c]);
  return d;
}

/** Fila de la tabla → registro del prototipo (fechas «AAAA-MM-DD», _ts para el control de concurrencia). */
/** Columnas de texto que en el prototipo guardan números (el valor de un paraclínico puede ser 9.8 o «Reactivo»):
    se devuelven como número cuando el texto es un número, igual que al reabrir el libro de Excel. */
const TEXTO_NUMERICO = new Set(["lab.Valor"]);
const ES_NUMERO = /^-?\d+(\.\d+)?$/;

function aRegistro(hoja: string, f: Fila): Fila {
  const r: Fila = {};
  for (const c of columnasTabla(hoja)) {
    const v = f[c];
    r[c] = v instanceof Date ? fechaTexto(v) : TEXTO_NUMERICO.has(`${hoja}.${c}`) && typeof v === "string" && ES_NUMERO.test(v) ? Number(v) : v ?? null;
  }
  r._ts = (f.actualizadoEn as Date).toISOString();
  return r;
}

/* ---------- persona (maestro único, D1) ---------- */

type PersonaConEps = Prisma.PersonaGetPayload<{ include: { eps: true } }>;
const partir = (s: unknown) => {
  const t = String(s ?? "").trim().split(/\s+/).filter(Boolean);
  return [t[0] ?? "", t.slice(1).join(" ") || null] as const;
};

function aRegistroPaciente(f: Fila & { persona: PersonaConEps }): Fila {
  const p = f.persona;
  return {
    ...aRegistro("pac", f),
    TipoDoc: p.tipoDoc, Documento: p.documento,
    Apellidos: [p.primerApellido, p.segundoApellido].filter(Boolean).join(" ") || null,
    Nombres: [p.primerNombre, p.segundoNombre].filter(Boolean).join(" ") || null,
    FechaNac: p.fechaNacimiento ? fechaTexto(p.fechaNacimiento) : null, Sexo: p.sexo, EPS: p.eps?.nombre ?? null, Regimen: p.regimen,
    FechaAfiliacion: p.fechaAfiliacion ? fechaTexto(p.fechaAfiliacion) : null, Municipio: p.municipio, MunicipioDANE: p.municipioDane,
    Zona: p.zona, Direccion: p.direccion, Telefono: p.telefono, Etnia: p.etnia, GrupoPob: p.grupoPoblacional,
  };
}

async function datosPersona(tx: Tx, r: Fila) {
  const [n1, n2] = partir(r.Nombres);
  const [a1, a2] = partir(r.Apellidos);
  const eps = aTexto(r.EPS, "EPS");
  const epsId = eps ? (await tx.eps.upsert({ where: { nombre: eps }, create: { nombre: eps }, update: {} })).id : null;
  return {
    tipoDoc: aTexto(r.TipoDoc, "TipoDoc"), documento: aTexto(r.Documento, "Documento")?.trim() || null,
    primerNombre: n1, segundoNombre: n2, primerApellido: a1, segundoApellido: a2,
    fechaNacimiento: aFecha(r.FechaNac, "FechaNac"), sexo: aTexto(r.Sexo, "Sexo"), epsId, regimen: aTexto(r.Regimen, "Regimen"),
    fechaAfiliacion: aFecha(r.FechaAfiliacion, "FechaAfiliacion"), municipio: aTexto(r.Municipio, "Municipio"), municipioDane: aTexto(r.MunicipioDANE, "MunicipioDANE"),
    zona: aTexto(r.Zona, "Zona"), direccion: aTexto(r.Direccion, "Direccion"), telefono: aTexto(r.Telefono, "Telefono"), etnia: aTexto(r.Etnia, "Etnia"),
    grupoPoblacional: aTexto(r.GrupoPob, "GrupoPob"),
  };
}

/** Busca o crea la persona del paciente. Si el documento ya pertenece a otro paciente de hemodiálisis, no se mezcla. */
async function resolverPersona(tx: Tx, r: Fila, usuarioId: string, propioId?: string): Promise<{ id: string; aviso?: string; conflicto?: string }> {
  const d = await datosPersona(tx, r);
  if (d.documento) {
    const existente = await tx.persona.findFirst({ where: { documento: d.documento, ...(d.tipoDoc ? { tipoDoc: d.tipoDoc } : {}) }, include: { hdPaciente: true } });
    if (existente) {
      if (existente.hdPaciente && existente.hdPaciente.ID !== propioId) return { id: "", conflicto: existente.hdPaciente.ID };
      await tx.persona.update({ where: { id: existente.id }, data: d });
      return { id: existente.id };
    }
  }
  const nueva = await tx.persona.create({ data: { ...d, creadoPor: usuarioId } });
  return { id: nueva.id };
}

/* ---------- lectura ---------- */

export async function version(db: Tx | typeof prisma = prisma): Promise<number> {
  const p = await db.parametro.findUnique({ where: { programa_clave: { programa: PROGRAMA, clave: "__version" } } });
  return Number(p?.valor ?? 0);
}

async function subirVersion(tx: Tx, usuarioId: string) {
  const v = (await version(tx)) + 1;
  await tx.parametro.upsert({
    where: { programa_clave: { programa: PROGRAMA, clave: "__version" } },
    create: { programa: PROGRAMA, clave: "__version", valor: v, actualizadoPor: usuarioId },
    update: { valor: v, actualizadoPor: usuarioId },
  });
  return v;
}

export async function leerLibro(esAdmin: boolean) {
  const hojas: Record<string, Fila[]> = {};
  for (const h of HOJAS) {
    if (h === "pac") {
      const L = await prisma.hdPaciente.findMany({ include: { persona: { include: { eps: true } } }, orderBy: { ID: "asc" } });
      hojas.pac = L.map((f) => aRegistroPaciente(f as unknown as Fila & { persona: PersonaConEps }));
    } else {
      hojas[h] = (await delegado(prisma, h).findMany({ orderBy: { ID: "asc" } })).map((f) => aRegistro(h, f));
    }
  }
  const params = await prisma.parametro.findMany({ where: { programa: PROGRAMA } });
  const cfg = Object.fromEntries(params.filter((p) => !p.clave.startsWith("__")).map((p) => [p.clave, p.valor]));
  const fin = params.find((p) => p.clave === "__finBlob");
  return { version: Number(params.find((p) => p.clave === "__version")?.valor ?? 0), hojas, cfg, finBlob: esAdmin ? (fin?.valor ?? null) : null };
}

/* ---------- escritura ---------- */

export interface Actor {
  id: string;
  nombre: string; // «Nombre · Cargo», el mismo texto que el prototipo guarda en Usuario
  admin: boolean;
  puedeAnular: boolean;
}

export interface Cambios {
  cambios?: Record<string, { nuevos?: Fila[]; modificados?: Fila[] }>;
  cfg?: Record<string, unknown> | null;
  finBlob?: unknown;
}

export interface EventoAud {
  accion: string;
  entidad: string;
  registroId?: string;
  antes?: unknown;
  despues?: unknown;
  detalle?: string;
}

const conflicto = (m: string) => new HttpError(409, m, "CONFLICTO");
const esAnulado = (v: unknown) => v === "SI";

export async function sincronizar(tx: Tx, actor: Actor, body: Cambios, auditar: (e: EventoAud) => Promise<void>) {
  const ts: Record<string, Record<string, string>> = {};
  const marcar = (h: string, id: string, f: Fila) => ((ts[h] ??= {})[id] = (f.actualizadoEn as Date).toISOString());
  const cambios = body.cambios ?? {};
  for (const h of Object.keys(cambios)) if (!HOJAS.includes(h)) throw new HttpError(400, `Hoja desconocida: ${h}`, "VALIDACION");
  const nuevosPac = new Set((cambios.pac?.nuevos ?? []).map((r) => String(r.ID)));

  for (const h of HOJAS) {
    const c = cambios[h];
    if (!c) continue;
    const D = delegado(tx, h);
    const tienePaciente = columnas(h).includes("Paciente");

    for (const r of c.nuevos ?? []) {
      const id = aTexto(r.ID, "ID");
      if (!id) throw new HttpError(400, `Registro sin ID en ${h}.`, "VALIDACION");
      if (await D.findUnique({ where: { ID: id } })) throw conflicto(`Otro usuario registró ${id} al mismo tiempo. Se recargaron los datos: repita la acción.`);
      if (tienePaciente && r.Paciente && !nuevosPac.has(String(r.Paciente)) && !(await tx.hdPaciente.findUnique({ where: { ID: String(r.Paciente) } }))) {
        throw new HttpError(400, `El paciente ${r.Paciente} no existe.`, "VALIDACION");
      }
      if (esAnulado(r.Anulado) && !actor.puedeAnular) throw new HttpError(403, "Su usuario no tiene permiso para anular registros.", "PROHIBIDO");
      const datos = datosTabla(h, r);
      if ("Usuario" in datos) datos.Usuario = actor.nombre;
      if ("Registrado" in datos && !datos.Registrado) datos.Registrado = ahoraTexto();
      let creado: Fila;
      if (h === "pac") {
        const p = await resolverPersona(tx, r, actor.id);
        if (p.conflicto) throw conflicto(`El documento ${r.Documento} ya está registrado en hemodiálisis como ${p.conflicto}.`);
        creado = await tx.hdPaciente.create({ data: { ID: id, ...datos, personaId: p.id, creadoPor: actor.id, actualizadoPor: actor.id } as Prisma.HdPacienteUncheckedCreateInput });
        await tx.inscripcionPrograma.create({ data: { personaId: p.id, programaClave: PROGRAMA, codigoInterno: id, estado: String(datos.Estado ?? "Activo"), fechaIngreso: (datos.IngresoUnidad as Date) ?? null, creadoPor: actor.id } });
      } else {
        creado = await D.create({ data: { ID: id, ...datos, creadoPor: actor.id, actualizadoPor: actor.id } });
      }
      marcar(h, id, creado);
      await auditar({ accion: "CREA", entidad: `hd.${h}`, registroId: id, despues: { ...r, _ts: undefined } });
    }

    for (const r of c.modificados ?? []) {
      const id = String(r.ID ?? "");
      const actual = h === "pac" ? await tx.hdPaciente.findUnique({ where: { ID: id }, include: { persona: { include: { eps: true } } } }) : await D.findUnique({ where: { ID: id } });
      if (!actual) throw conflicto(`El registro ${id} ya no existe en la base de datos. Se recargaron los datos.`);
      if (r._ts && (actual.actualizadoEn as Date).toISOString() !== r._ts) {
        throw conflicto(`Otro usuario modificó ${id} mientras usted trabajaba. Se recargaron los datos: revise y repita su cambio.`);
      }
      const antesReg = h === "pac" ? aRegistroPaciente(actual as unknown as Fila & { persona: PersonaConEps }) : aRegistro(h, actual as Fila);
      const datos = datosTabla(h, r);
      const dif: { antes: Fila; despues: Fila } = { antes: {}, despues: {} };
      for (const col of columnas(h)) {
        if (col === "ID") continue;
        const a = antesReg[col] ?? null;
        const n = r[col] === "" || r[col] === undefined ? null : col in datos ? (datos[col] instanceof Date ? fechaTexto(datos[col] as Date) : datos[col]) : r[col];
        if (JSON.stringify(a) !== JSON.stringify(n ?? null)) {
          dif.antes[col] = a;
          dif.despues[col] = n ?? null;
        }
      }
      const anula = !esAnulado(antesReg.Anulado) && esAnulado(r.Anulado);
      if ((anula || (esAnulado(antesReg.Anulado) && !esAnulado(r.Anulado))) && !actor.puedeAnular) {
        throw new HttpError(403, "Su usuario no tiene permiso para anular registros.", "PROHIBIDO");
      }
      if (h === "pac") {
        const p = await resolverPersona(tx, r, actor.id, id);
        if (p.conflicto) throw conflicto(`El documento ${r.Documento} ya está registrado en hemodiálisis como ${p.conflicto}.`);
        const personaId = (actual as { personaId: string }).personaId;
        if (p.id !== personaId) await tx.hdPaciente.update({ where: { ID: id }, data: { personaId: p.id } });
        await tx.inscripcionPrograma.updateMany({ where: { programaClave: PROGRAMA, codigoInterno: id }, data: { estado: String(datos.Estado ?? "Activo"), personaId: p.id } });
      }
      const act = await D.update({ where: { ID: id }, data: { ...datos, actualizadoPor: actor.id } });
      marcar(h, id, act);
      if (Object.keys(dif.despues).length) {
        await auditar({ accion: anula ? "ANULA" : "MODIFICA", entidad: `hd.${h}`, registroId: id, antes: dif.antes, despues: dif.despues, detalle: anula ? String(r.MotivoAnulacion ?? "") : undefined });
      }
    }
  }

  if (body.cfg) {
    if (!actor.admin) throw new HttpError(403, "Solo el administrador puede cambiar la configuración de hemodiálisis (metas, turnos, frecuencias, esquemas).", "PROHIBIDO");
    for (const [clave, val] of Object.entries(body.cfg)) {
      if (clave.startsWith("__")) continue;
      const antes = await tx.parametro.findUnique({ where: { programa_clave: { programa: PROGRAMA, clave } } });
      if (JSON.stringify(antes?.valor ?? null) === JSON.stringify(val ?? null)) continue;
      await tx.parametro.upsert({
        where: { programa_clave: { programa: PROGRAMA, clave } },
        create: { programa: PROGRAMA, clave, valor: val as Prisma.InputJsonValue, actualizadoPor: actor.id },
        update: { valor: val as Prisma.InputJsonValue, actualizadoPor: actor.id },
      });
      await auditar({ accion: "CONFIGURA", entidad: "hd.config", registroId: clave, antes: antes?.valor, despues: val });
    }
  }

  if (body.finBlob !== undefined) {
    if (!actor.admin) throw new HttpError(403, "Solo el administrador puede ver o cambiar la facturación.", "PROHIBIDO");
    await tx.parametro.upsert({
      where: { programa_clave: { programa: PROGRAMA, clave: "__finBlob" } },
      create: { programa: PROGRAMA, clave: "__finBlob", valor: body.finBlob as Prisma.InputJsonValue, actualizadoPor: actor.id },
      update: { valor: body.finBlob as Prisma.InputJsonValue, actualizadoPor: actor.id },
    });
    await auditar({ accion: "FACTURACION", entidad: "hd.facturacion", detalle: "Tarifas o valores facturados actualizados (cifrados con la clave de facturación)" });
  }

  return { version: await subirVersion(tx, actor.id), ts };
}

/** Importación inicial de un libro o Dashboard existente (solo administrador, con el programa vacío). */
export async function importar(tx: Tx, actor: Actor, body: { hojas: Record<string, Fila[]>; cfg?: Record<string, unknown>; finBlob?: unknown; fuente?: string }) {
  if ((await tx.hdPaciente.count()) > 0) throw conflicto("Hemodiálisis ya tiene pacientes en la base de datos: la importación solo se permite para la carga inicial.");
  const avisos: string[] = [];
  const conteo: Record<string, number> = {};
  const docs = new Map<string, string>();
  for (const h of HOJAS) {
    const L = body.hojas?.[h] ?? [];
    const ids = new Set<string>();
    if (h === "pac") {
      for (const r of L) {
        const id = aTexto(r.ID, "ID");
        if (!id) continue;
        if (ids.has(id)) throw new HttpError(400, `ID de paciente repetido en el archivo: ${id}.`, "VALIDACION");
        ids.add(id);
        const doc = String(r.Documento ?? "").trim();
        const fila = { ...r };
        if (doc && docs.has(doc)) {
          avisos.push(`${id}: documento ${doc} repetido con ${docs.get(doc)}; se guardó SIN documento para no mezclar a dos personas. Corríjalo en Pacientes.`);
          fila.Documento = null;
        } else if (doc) docs.set(doc, id);
        const p = await resolverPersona(tx, fila, actor.id);
        if (p.conflicto) throw conflicto(`El documento ${doc} ya está en hemodiálisis como ${p.conflicto}.`);
        const datos = datosTabla("pac", fila);
        await tx.hdPaciente.create({ data: { ID: id, ...datos, personaId: p.id, creadoPor: actor.id, actualizadoPor: actor.id } as Prisma.HdPacienteUncheckedCreateInput });
        await tx.inscripcionPrograma.create({ data: { personaId: p.id, programaClave: PROGRAMA, codigoInterno: id, estado: String(datos.Estado ?? "Activo"), fechaIngreso: (datos.IngresoUnidad as Date) ?? null, creadoPor: actor.id } });
      }
    } else {
      const data: Fila[] = [];
      for (const r of L) {
        const id = aTexto(r.ID, "ID");
        if (!id) continue;
        if (ids.has(id)) throw new HttpError(400, `ID repetido en la hoja ${SH[h][0]}: ${id}.`, "VALIDACION");
        ids.add(id);
        data.push({ ID: id, ...datosTabla(h, r), creadoPor: actor.id, actualizadoPor: actor.id });
      }
      for (let i = 0; i < data.length; i += 1000) await delegado(tx, h).createMany({ data: data.slice(i, i + 1000) });
    }
    conteo[h] = ids.size;
  }
  for (const [clave, val] of Object.entries(body.cfg ?? {})) {
    if (clave.startsWith("__")) continue;
    await tx.parametro.upsert({ where: { programa_clave: { programa: PROGRAMA, clave } }, create: { programa: PROGRAMA, clave, valor: val as Prisma.InputJsonValue, actualizadoPor: actor.id }, update: { valor: val as Prisma.InputJsonValue, actualizadoPor: actor.id } });
  }
  if (body.finBlob) {
    await tx.parametro.upsert({ where: { programa_clave: { programa: PROGRAMA, clave: "__finBlob" } }, create: { programa: PROGRAMA, clave: "__finBlob", valor: body.finBlob as Prisma.InputJsonValue, actualizadoPor: actor.id }, update: { valor: body.finBlob as Prisma.InputJsonValue } });
  }
  return { conteo, avisos, version: await subirVersion(tx, actor.id) };
}
