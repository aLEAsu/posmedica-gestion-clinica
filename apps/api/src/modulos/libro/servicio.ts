/* Motor genérico de «libros» de programa (Hemodiálisis, VIH, libro institucional del portal…).
   El cliente (módulo original del prototipo + adaptador) trabaja con el libro en la forma del prototipo; aquí se
   traduce a tablas y viceversa, con validación de tipos, permisos por hoja y por fila, control de concurrencia por
   registro y auditoría. Cada libro aporta su configuración. */
import type { Prisma } from "@prisma/client";
import { puede, type Accion, type UsuarioSesion } from "@posmedica/shared";
import { prisma } from "../../db.js";
import { HttpError } from "../../http/errors.js";

export type Tx = Prisma.TransactionClient;
export type Fila = Record<string, unknown>;
type Db = Tx | typeof prisma;
type Delegado = {
  findMany: (a?: object) => Promise<Fila[]>;
  findUnique: (a: object) => Promise<Fila | null>;
  create: (a: object) => Promise<Fila>;
  createMany: (a: object) => Promise<{ count: number }>;
  update: (a: object) => Promise<Fila>;
  count: (a?: object) => Promise<number>;
};
export type PersonaConEps = Prisma.PersonaGetPayload<{ include: { eps: true } }>;

/** Identidad de la persona tal como la escribe un programa (valores crudos; el motor valida tipos y la EPS). */
export interface PersonaCruda {
  tipoDoc?: unknown; documento?: unknown; primerNombre?: unknown; segundoNombre?: unknown; primerApellido?: unknown; segundoApellido?: unknown;
  fechaNacimiento?: unknown; sexo?: unknown; eps?: unknown; regimen?: unknown; fechaAfiliacion?: unknown; municipio?: unknown; municipioDane?: unknown;
  zona?: unknown; direccion?: unknown; telefono?: unknown; etnia?: unknown; grupoPoblacional?: unknown;
}

export interface HojaDef {
  modelo: string; // modelo Prisma
  columnas: string[]; // columnas de la hoja del prototipo
  clave: string; // columna que identifica el registro ("ID", o "Paciente" en el arrastre CAC de VIH)
  nombre: string; // nombre de la hoja en el prototipo
}

export interface ConfigLibro {
  programa: string; // clave del programa (permisos y parámetros)
  nombre: string; // para mensajes: «hemodiálisis», «el programa VIH»
  hojas: Record<string, HojaDef>; // la hoja de pacientes va primero: las demás la referencian
  tipo: (hoja: string, col: string) => "fecha" | "numero" | "texto";
  /** Cómo devuelve el libro un valor ausente: null (HD: celdas vacías de Excel) o "" (VIH: el prototipo lee todo como texto). */
  vacio: null | "";
  /** Columnas de texto que se devuelven como número cuando el texto es un número ("hoja.columna"). */
  textoNumerico?: Set<string>;
  /** Libro con pacientes (identidad en «persona»). El libro institucional no tiene. */
  paciente?: {
    hoja: string;
    relacionPersona: "hdPaciente" | "vihPaciente";
    camposPersona: string[];
    aPersona: (r: Fila) => PersonaCruda;
    desdePersona: (p: PersonaConEps, fecha: (d: Date | null) => string | null) => Fila;
    campoIngreso: string; // columna con la fecha de ingreso al programa (para la inscripción)
  };
  /** Quién puede leer el libro. Por defecto: «ver» en el programa. */
  puedeLeer?: (u: UsuarioSesion) => boolean;
  /** Qué filas de una hoja ve el usuario (p. ej. mensajes propios). Por defecto: todas las hojas, todas las filas. */
  leeHoja?: (hoja: string, u: UsuarioSesion) => boolean;
  leeFila?: (hoja: string, fila: Fila, u: UsuarioSesion) => boolean;
  /** Quién puede guardar algo en este libro (filtro de entrada). Por defecto: «registrar» en el programa. */
  puedeEscribir?: (u: UsuarioSesion) => boolean;
  /** Quién puede crear o modificar registros de una hoja. Por defecto: «registrar» en el programa. */
  escribe?: (hoja: string, u: UsuarioSesion, tipo: "nuevo" | "modificado", fila: Fila) => boolean;
  /** Valores que el servidor fija en los registros nuevos (p. ej. el remitente de un mensaje). */
  fijarNuevo?: (hoja: string, datos: Fila, u: UsuarioSesion) => void;
  /** Claves de configuración que solo recibe el administrador (p. ej. valores de producción cifrados). */
  cfgPrivada?: Set<string>;
}

const MAX_TEXTO = 50_000;
const pad = (n: number) => String(n).padStart(2, "0");
/** Fecha DATE de PostgreSQL (medianoche UTC) → «AAAA-MM-DD». */
export const fechaTexto = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
/** Marca de hora local de la clínica, igual que nowTs() del prototipo: «AAAA-MM-DD HH:MM». */
export const ahoraTexto = () => new Date().toLocaleString("sv-SE", { timeZone: "America/Bogota" }).slice(0, 16);

export function aFecha(v: unknown, campo: string): Date | null {
  if (v == null || v === "") return null;
  const s = String(v).trim();
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  let y: number, mo: number, d: number;
  if (m) [y, mo, d] = [+m[1], +m[2], +m[3]];
  else if ((m = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/.exec(s))) [y, mo, d] = [+m[3], +m[2], +m[1]];
  else throw new HttpError(400, `Fecha inválida en ${campo}: use AAAA-MM-DD.`, "VALIDACION");
  const f = new Date(Date.UTC(y, mo - 1, d));
  if (isNaN(f.getTime()) || f.getUTCMonth() !== mo - 1 || y < 1777 || y > 2200) throw new HttpError(400, `Fecha fuera de rango en ${campo}.`, "VALIDACION");
  return f;
}
function aNumero(v: unknown, campo: string): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  if (!Number.isFinite(n)) throw new HttpError(400, `Número inválido en ${campo}.`, "VALIDACION");
  return n;
}
export function aTexto(v: unknown, campo: string): string | null {
  if (v == null || v === "") return null;
  const s = typeof v === "object" ? JSON.stringify(v) : String(v);
  if (s.length > MAX_TEXTO) throw new HttpError(400, `Texto demasiado largo en ${campo}.`, "VALIDACION");
  return s;
}
const ES_NUMERO = /^-?\d+(\.\d+)?$/;
const conflicto = (m: string) => new HttpError(409, m, "CONFLICTO");
const prohibido = (m: string) => new HttpError(403, m, "PROHIBIDO");
const esAnulado = (v: unknown) => v === "SI";

export interface Actor {
  id: string;
  nombre: string; // «Nombre · Cargo», el mismo texto que el prototipo guarda en Usuario
  admin: boolean;
  u: UsuarioSesion;
}
export const actorDe = (u: UsuarioSesion): Actor => ({ id: u.id, nombre: `${u.nombre} · ${u.cargo}`, admin: u.rol === "ADMIN", u });

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

export function crearServicioLibro(C: ConfigLibro) {
  const HOJAS = Object.keys(C.hojas);
  const P = C.paciente;
  const hojaP = P ? C.hojas[P.hoja] : null;
  const delegado = (db: Db, hoja: string) => {
    const m = C.hojas[hoja].modelo;
    return (db as unknown as Record<string, Delegado>)[m.charAt(0).toLowerCase() + m.slice(1)];
  };
  const esHojaP = (h: string) => !!P && h === P.hoja;
  const columnasTabla = (hoja: string) => C.hojas[hoja].columnas.filter((c) => !(esHojaP(hoja) && P!.camposPersona.includes(c)));
  const valor = (hoja: string, c: string, v: unknown) => {
    const t = C.tipo(hoja, c);
    return t === "fecha" ? aFecha(v, c) : t === "numero" ? aNumero(v, c) : aTexto(v, c);
  };
  const vacio = <T>(v: T | null | undefined) => (v == null ? C.vacio : v);
  const fechaOVacio = (d: Date | null) => (d ? fechaTexto(d) : C.vacio);
  const permiso = (u: UsuarioSesion, a: Accion) => puede(u, C.programa, a);
  const leeHoja = (h: string, u: UsuarioSesion) => (C.leeHoja ? C.leeHoja(h, u) : true);
  const leeFila = (h: string, f: Fila, u: UsuarioSesion) => leeHoja(h, u) && (C.leeFila ? C.leeFila(h, f, u) : true);
  const escribe = (h: string, u: UsuarioSesion, t: "nuevo" | "modificado", f: Fila) => (C.escribe ? C.escribe(h, u, t, f) : permiso(u, "registrar"));

  /** Registro del cliente → datos de la tabla (solo columnas de la hoja; las demás se ignoran, como al guardar el libro). */
  function datosTabla(hoja: string, r: Fila) {
    const d: Fila = {};
    for (const c of columnasTabla(hoja)) if (c !== C.hojas[hoja].clave) d[c] = valor(hoja, c, r[c]);
    return d;
  }

  /** Fila de la tabla → registro del prototipo (fechas «AAAA-MM-DD», _ts para el control de concurrencia). */
  function aRegistro(hoja: string, f: Fila): Fila {
    const r: Fila = {};
    for (const c of columnasTabla(hoja)) {
      const v = f[c];
      r[c] = v instanceof Date ? fechaTexto(v) : C.textoNumerico?.has(`${hoja}.${c}`) && typeof v === "string" && ES_NUMERO.test(v) ? Number(v) : vacio(v);
    }
    r._ts = (f.actualizadoEn as Date).toISOString();
    return r;
  }

  function aRegistroPaciente(f: Fila & { persona: PersonaConEps }): Fila {
    const id = P!.desdePersona(f.persona, fechaOVacio);
    for (const k of Object.keys(id)) id[k] = vacio(id[k]);
    return { ...aRegistro(P!.hoja, f), ...id };
  }

  async function datosPersona(tx: Tx, r: Fila) {
    const x = P!.aPersona(r);
    const t = (v: unknown, c: string) => aTexto(v, c)?.trim() || null;
    const eps = t(x.eps, "EPS");
    const epsId = eps ? (await tx.eps.upsert({ where: { nombre: eps }, create: { nombre: eps }, update: {} })).id : null;
    return {
      tipoDoc: t(x.tipoDoc, "TipoDoc"), documento: t(x.documento, "Documento"),
      primerNombre: t(x.primerNombre, "Nombre") ?? "", segundoNombre: t(x.segundoNombre, "Segundo nombre"),
      primerApellido: t(x.primerApellido, "Apellido") ?? "", segundoApellido: t(x.segundoApellido, "Segundo apellido"),
      fechaNacimiento: aFecha(x.fechaNacimiento, "FechaNac"), sexo: t(x.sexo, "Sexo"), epsId, regimen: t(x.regimen, "Regimen"),
      fechaAfiliacion: aFecha(x.fechaAfiliacion, "FechaAfiliacion"), municipio: t(x.municipio, "Municipio"), municipioDane: t(x.municipioDane, "Código DANE"),
      zona: t(x.zona, "Zona"), direccion: t(x.direccion, "Direccion"), telefono: t(x.telefono, "Telefono"), etnia: t(x.etnia, "Etnia"),
      grupoPoblacional: t(x.grupoPoblacional, "Grupo poblacional"),
    };
  }

  /** Busca o crea la persona. Si el documento ya pertenece a otro paciente de ESTE programa, no se mezcla. */
  async function resolverPersona(tx: Tx, r: Fila, usuarioId: string, propioId?: string): Promise<{ id: string; conflicto?: string }> {
    const d = await datosPersona(tx, r);
    if (d.documento) {
      const existente = await tx.persona.findFirst({ where: { documento: d.documento, ...(d.tipoDoc ? { tipoDoc: d.tipoDoc } : {}) }, include: { [P!.relacionPersona]: true } });
      if (existente) {
        const otro = (existente as unknown as Record<string, Fila | null>)[P!.relacionPersona];
        if (otro && otro[hojaP!.clave] !== propioId) return { id: "", conflicto: String(otro[hojaP!.clave]) };
        // La identidad es compartida entre programas: un campo vacío en un programa no borra lo que otro registró.
        const fusion = Object.fromEntries(Object.entries(d).filter(([, v]) => v != null && v !== ""));
        await tx.persona.update({ where: { id: existente.id }, data: fusion });
        return { id: existente.id };
      }
    }
    const nueva = await tx.persona.create({ data: { ...d, creadoPor: usuarioId } });
    return { id: nueva.id };
  }

  async function version(db: Db = prisma): Promise<number> {
    const p = await db.parametro.findUnique({ where: { programa_clave: { programa: C.programa, clave: "__version" } } });
    return Number(p?.valor ?? 0);
  }

  async function subirVersion(tx: Tx, usuarioId: string) {
    const v = (await version(tx)) + 1;
    await tx.parametro.upsert({
      where: { programa_clave: { programa: C.programa, clave: "__version" } },
      create: { programa: C.programa, clave: "__version", valor: v, actualizadoPor: usuarioId },
      update: { valor: v, actualizadoPor: usuarioId },
    });
    return v;
  }

  async function guardarParametro(tx: Tx, clave: string, val: unknown, usuarioId: string) {
    await tx.parametro.upsert({
      where: { programa_clave: { programa: C.programa, clave } },
      create: { programa: C.programa, clave, valor: val as Prisma.InputJsonValue, actualizadoPor: usuarioId },
      update: { valor: val as Prisma.InputJsonValue, actualizadoPor: usuarioId },
    });
  }

  async function crearPaciente(tx: Tx, actor: Actor, id: string, r: Fila, datos: Fila) {
    const p = await resolverPersona(tx, r, actor.id);
    if (p.conflicto) throw conflicto(`El documento ${r.Documento} ya está registrado en ${C.nombre} como ${p.conflicto}.`);
    const creado = await delegado(tx, P!.hoja).create({ data: { [hojaP!.clave]: id, ...datos, personaId: p.id, creadoPor: actor.id, actualizadoPor: actor.id } });
    // La fecha de ingreso de la inscripción es informativa: si el programa la guarda como texto no válido, queda vacía
    // (el registro del paciente conserva su valor original).
    let fechaIngreso: Date | null = null;
    try {
      const f = datos[P!.campoIngreso];
      fechaIngreso = f instanceof Date ? f : aFecha(f, P!.campoIngreso);
    } catch {
      fechaIngreso = null;
    }
    await tx.inscripcionPrograma.create({
      data: { personaId: p.id, programaClave: C.programa, codigoInterno: id, estado: String(datos.Estado ?? "Activo"), fechaIngreso, creadoPor: actor.id },
    });
    return creado;
  }

  const puedeLeer = (u: UsuarioSesion) => (C.puedeLeer ? C.puedeLeer(u) : permiso(u, "ver"));

  async function leerLibro(u: UsuarioSesion) {
    const esAdmin = u.rol === "ADMIN";
    const hojas: Record<string, Fila[]> = {};
    for (const h of HOJAS) {
      if (!leeHoja(h, u)) {
        hojas[h] = [];
        continue;
      }
      const D = delegado(prisma, h);
      const orden = { [C.hojas[h].clave]: "asc" };
      const filas = esHojaP(h)
        ? (await D.findMany({ include: { persona: { include: { eps: true } } }, orderBy: orden })).map((f) => aRegistroPaciente(f as Fila & { persona: PersonaConEps }))
        : (await D.findMany({ orderBy: orden })).map((f) => aRegistro(h, f));
      hojas[h] = C.leeFila ? filas.filter((f) => leeFila(h, f, u)) : filas;
    }
    const params = await prisma.parametro.findMany({ where: { programa: C.programa } });
    const cfg = Object.fromEntries(params.filter((p) => !p.clave.startsWith("__") && (esAdmin || !C.cfgPrivada?.has(p.clave))).map((p) => [p.clave, p.valor]));
    const fin = params.find((p) => p.clave === "__finBlob");
    return { version: Number(params.find((p) => p.clave === "__version")?.valor ?? 0), hojas, cfg, finBlob: esAdmin ? (fin?.valor ?? null) : null };
  }

  async function sincronizar(tx: Tx, actor: Actor, body: Cambios, auditar: (e: EventoAud) => Promise<void>) {
    const u = actor.u;
    const puedeAnular = permiso(u, "anular");
    const ts: Record<string, Record<string, string>> = {};
    const marcar = (h: string, id: string, f: Fila) => ((ts[h] ??= {})[id] = (f.actualizadoEn as Date).toISOString());
    const cambios = body.cambios ?? {};
    for (const h of Object.keys(cambios)) if (!HOJAS.includes(h)) throw new HttpError(400, `Hoja desconocida: ${h}`, "VALIDACION");
    const nuevosPac = new Set(P ? (cambios[P.hoja]?.nuevos ?? []).map((r) => String(r[hojaP!.clave])) : []);
    const existePaciente = async (id: string) => nuevosPac.has(id) || !!(await delegado(tx, P!.hoja).findUnique({ where: { [hojaP!.clave]: id } }));
    const sinPermiso = (h: string) => prohibido(`Su usuario no tiene permiso para registrar en «${C.hojas[h].nombre}» de ${C.nombre}.`);

    for (const h of HOJAS) {
      const c = cambios[h];
      if (!c) continue;
      const D = delegado(tx, h);
      const clave = C.hojas[h].clave;
      const tienePaciente = !!P && !esHojaP(h) && C.hojas[h].columnas.includes("Paciente");

      for (const r of c.nuevos ?? []) {
        if (!escribe(h, u, "nuevo", r)) throw sinPermiso(h);
        const id = aTexto(r[clave], clave);
        if (!id) throw new HttpError(400, `Registro sin ${clave} en ${C.hojas[h].nombre}.`, "VALIDACION");
        if (await D.findUnique({ where: { [clave]: id } })) throw conflicto(`Otro usuario registró ${id} al mismo tiempo. Se recargaron los datos: repita la acción.`);
        if (tienePaciente && r.Paciente && !(await existePaciente(String(r.Paciente)))) throw new HttpError(400, `El paciente ${r.Paciente} no existe.`, "VALIDACION");
        if (esAnulado(r.Anulado) && !puedeAnular) throw prohibido("Su usuario no tiene permiso para anular registros.");
        const datos = datosTabla(h, r);
        if ("Usuario" in datos) datos.Usuario = actor.nombre;
        if ("Registrado" in datos && !datos.Registrado) datos.Registrado = ahoraTexto();
        C.fijarNuevo?.(h, datos, u);
        const creado = esHojaP(h) ? await crearPaciente(tx, actor, id, r, datos) : await D.create({ data: { [clave]: id, ...datos, creadoPor: actor.id, actualizadoPor: actor.id } });
        marcar(h, id, creado);
        await auditar({ accion: "CREA", entidad: `${C.programa}.${h}`, registroId: id, despues: { ...r, _ts: undefined } });
      }

      for (const r of c.modificados ?? []) {
        const id = String(r[clave] ?? "");
        const actual = esHojaP(h) ? await D.findUnique({ where: { [clave]: id }, include: { persona: { include: { eps: true } } } }) : await D.findUnique({ where: { [clave]: id } });
        if (!actual) throw conflicto(`El registro ${id} ya no existe en la base de datos. Se recargaron los datos.`);
        const antesReg = esHojaP(h) ? aRegistroPaciente(actual as Fila & { persona: PersonaConEps }) : aRegistro(h, actual);
        if (!leeFila(h, antesReg, u) || !escribe(h, u, "modificado", antesReg)) throw sinPermiso(h);
        if (r._ts && (actual.actualizadoEn as Date).toISOString() !== r._ts) {
          throw conflicto(`Otro usuario modificó ${id} mientras usted trabajaba. Se recargaron los datos: revise y repita su cambio.`);
        }
        const datos = datosTabla(h, r);
        const dif: { antes: Fila; despues: Fila } = { antes: {}, despues: {} };
        for (const col of C.hojas[h].columnas) {
          if (col === clave) continue;
          const a = antesReg[col] ?? C.vacio;
          const n = col in datos ? (datos[col] instanceof Date ? fechaTexto(datos[col] as Date) : datos[col]) : r[col];
          const norm = (x: unknown) => JSON.stringify(x === "" || x === undefined || x === null ? null : x);
          if (norm(a) !== norm(n)) {
            dif.antes[col] = a;
            dif.despues[col] = n ?? C.vacio;
          }
        }
        const anula = !esAnulado(antesReg.Anulado) && esAnulado(r.Anulado);
        if ((anula || (esAnulado(antesReg.Anulado) && !esAnulado(r.Anulado))) && !puedeAnular) throw prohibido("Su usuario no tiene permiso para anular registros.");
        if (esHojaP(h)) {
          const p = await resolverPersona(tx, r, actor.id, id);
          if (p.conflicto) throw conflicto(`El documento ${r.Documento} ya está registrado en ${C.nombre} como ${p.conflicto}.`);
          if (p.id !== (actual as { personaId: string }).personaId) await D.update({ where: { [clave]: id }, data: { personaId: p.id } });
          await tx.inscripcionPrograma.updateMany({ where: { programaClave: C.programa, codigoInterno: id }, data: { estado: String(datos.Estado ?? "Activo"), personaId: p.id } });
        }
        const act = await D.update({ where: { [clave]: id }, data: { ...datos, actualizadoPor: actor.id } });
        marcar(h, id, act);
        if (Object.keys(dif.despues).length) {
          await auditar({ accion: anula ? "ANULA" : "MODIFICA", entidad: `${C.programa}.${h}`, registroId: id, antes: dif.antes, despues: dif.despues, detalle: anula ? String(r.MotivoAnulacion ?? "") : undefined });
        }
      }
    }

    if (body.cfg) {
      if (!actor.admin) throw prohibido(`Solo el administrador puede cambiar la configuración de ${C.nombre}.`);
      for (const [clave, val] of Object.entries(body.cfg)) {
        if (clave.startsWith("__")) continue;
        const antes = await tx.parametro.findUnique({ where: { programa_clave: { programa: C.programa, clave } } });
        if (JSON.stringify(antes?.valor ?? null) === JSON.stringify(val ?? null)) continue;
        await guardarParametro(tx, clave, val, actor.id);
        await auditar({ accion: "CONFIGURA", entidad: `${C.programa}.config`, registroId: clave, antes: C.cfgPrivada?.has(clave) ? "(cifrado)" : antes?.valor, despues: C.cfgPrivada?.has(clave) ? "(cifrado)" : val });
      }
    }

    if (body.finBlob !== undefined) {
      if (!actor.admin) throw prohibido("Solo el administrador puede ver o cambiar la facturación.");
      await guardarParametro(tx, "__finBlob", body.finBlob, actor.id);
      await auditar({ accion: "FACTURACION", entidad: `${C.programa}.facturacion`, detalle: "Tarifas o valores facturados actualizados (cifrados con la clave de facturación)" });
    }

    return { version: await subirVersion(tx, actor.id), ts };
  }

  /** Importación inicial de un libro existente (solo administrador, con el programa vacío). */
  async function importar(tx: Tx, actor: Actor, body: { hojas: Record<string, Fila[]>; cfg?: Record<string, unknown>; finBlob?: unknown }) {
    const control = P ? P.hoja : HOJAS[0];
    if ((await delegado(tx, control).count()) > 0) throw conflicto(`${C.nombre.charAt(0).toUpperCase() + C.nombre.slice(1)} ya tiene datos en la base: la importación solo se permite para la carga inicial.`);
    const avisos: string[] = [];
    const conteo: Record<string, number> = {};
    const docs = new Map<string, string>();
    for (const h of HOJAS) {
      const L = body.hojas?.[h] ?? [];
      const clave = C.hojas[h].clave;
      const ids = new Set<string>();
      if (esHojaP(h)) {
        for (const r of L) {
          const id = aTexto(r[clave], clave);
          if (!id) continue;
          if (ids.has(id)) throw new HttpError(400, `ID de paciente repetido en el archivo: ${id}.`, "VALIDACION");
          ids.add(id);
          const doc = String(r.Documento ?? "").trim();
          const fila = { ...r };
          if (doc && docs.has(doc)) {
            avisos.push(`${id}: documento ${doc} repetido con ${docs.get(doc)}; se guardó SIN documento para no mezclar a dos personas. Corríjalo en Pacientes.`);
            fila.Documento = null;
          } else if (doc) docs.set(doc, id);
          await crearPaciente(tx, actor, id, fila, datosTabla(h, fila));
        }
      } else {
        const data: Fila[] = [];
        for (const r of L) {
          const id = aTexto(r[clave], clave);
          if (!id) continue;
          if (ids.has(id)) {
            if (clave === "ID") throw new HttpError(400, `ID repetido en la hoja ${C.hojas[h].nombre}: ${id}.`, "VALIDACION");
            avisos.push(`${C.hojas[h].nombre}: ${id} aparece más de una vez; se conservó el último.`);
            data.splice(data.findIndex((x) => x[clave] === id), 1);
          }
          ids.add(id);
          data.push({ [clave]: id, ...datosTabla(h, r), creadoPor: actor.id, actualizadoPor: actor.id });
        }
        for (let i = 0; i < data.length; i += 1000) await delegado(tx, h).createMany({ data: data.slice(i, i + 1000) });
      }
      conteo[h] = ids.size;
    }
    for (const [clave, val] of Object.entries(body.cfg ?? {})) if (!clave.startsWith("__")) await guardarParametro(tx, clave, val, actor.id);
    if (body.finBlob) await guardarParametro(tx, "__finBlob", body.finBlob, actor.id);
    return { conteo, avisos, version: await subirVersion(tx, actor.id) };
  }

  const puedeEscribir = (u: UsuarioSesion) => (C.puedeEscribir ? C.puedeEscribir(u) : permiso(u, "registrar"));

  return { HOJAS, version, leerLibro, sincronizar, importar, puedeLeer, puedeEscribir };
}
