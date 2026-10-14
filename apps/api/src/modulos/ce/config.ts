/* Libro de Consulta externa (Fase 9) para el motor genérico (modulos/libro).
   Acceso en dos capas (decisión V2 del 13 oct 2026):
   1. El permiso del programa (Usuarios): «ver» para entrar, «registrar» para guardar, «anular» para anular.
   2. El rol dentro del módulo (hoja RolesCE del prototipo: coordinación, admisiones, autorizaciones, profesional,
      calidad, solo consulta): qué hojas registra cada rol, igual que cePuede. El administrador es Coordinación.
   Especialidades reservadas (Infectología, Oncología…): quien no tiene «Ve reservadas» no recibe del servidor las
   solicitudes, autorizaciones, gestiones ni citas de esas especialidades (decisión del 13 oct 2026). Las jornadas y los
   cupos sí llegan (no tienen datos del paciente) para que la apertura de agenda detecte los cruces de horario.
   Un cupo no puede tener dos citas activas: se verifica en la base dentro de la transacción serializable del guardado
   (el prototipo lo dejaba para la base de datos: «el control simultáneo real llega con la base de datos»). */
import { puede, type UsuarioSesion } from "@posmedica/shared";
import type { ConfigLibro, Db, Fila, HojaDef } from "../libro/servicio.js";
import { sexoCodigo, sexoEtiqueta } from "../libro/persona.js";
import { CAMPOS_PERSONA_CE, HOJAS_CE } from "./hojas.js";

/** Roles y acciones del módulo (CE_ROLES y CE_PUEDE del prototipo; la prueba verifica que sean idénticos). */
export const ROLES_CE: Record<string, string> = { coordinacion: "Coordinación", admisiones: "Admisiones", autorizaciones: "Autorizaciones", profesional: "Profesional", calidad: "Calidad", consulta: "Solo consulta" };
export const PUEDE_CE: Record<string, string[]> = {
  registrar: ["admisiones", "coordinacion"], asignar: ["admisiones", "coordinacion"], abrir: ["admisiones", "coordinacion"], bloquear: ["admisiones", "coordinacion"], bloquearJornada: ["coordinacion"],
  gestion: ["admisiones", "autorizaciones", "coordinacion"], estado: ["admisiones", "autorizaciones", "coordinacion"], priorizar: ["admisiones", "coordinacion", "profesional"], prioClinica: ["coordinacion", "profesional"],
  autorizacion: ["admisiones", "autorizaciones", "coordinacion"], corregirFecha: ["admisiones", "coordinacion"], paciente: ["admisiones", "autorizaciones", "coordinacion"],
  admin: ["coordinacion"], modalidades: ["coordinacion", "calidad"],
};

/** Acciones que permiten registrar en cada hoja (tomadas de la guardia que protege cada escritura del prototipo). */
const ACCIONES_SOLICITUD = ["registrar", "asignar", "autorizacion", "estado", "corregirFecha", "gestion", "priorizar", "prioClinica"];
export const ACCIONES_HOJA_CE: Record<string, string[]> = {
  pac: ["registrar", "paciente"], sol: ACCIONES_SOLICITUD, ges: ACCIONES_SOLICITUD, aut: ["registrar", "autorizacion"], cit: ["asignar"],
  jor: ["abrir", "bloquearJornada"], cup: ["abrir", "bloquear", "bloquearJornada"], pro: ["admin"], con: ["admin"], eps: ["admin"], rol: ["admin"], cfg: ["admin"],
  esp: ["admin", "modalidades"],
};
const rolPuedeCe = (rol: string, hoja: string) => (ACCIONES_HOJA_CE[hoja] ?? []).some((a) => (PUEDE_CE[a] ?? []).includes(rol));

interface CtxCe {
  rol: string;
  veReservadas: boolean;
  reservadas: Set<string>;
  especialidadDe: Map<string, string>; // solicitud → especialidad
}

async function contexto(db: Db, u: UsuarioSesion): Promise<CtxCe> {
  const [roles, esp] = await Promise.all([
    db.ceRol.findMany({ where: { Usuario: { equals: u.usuario, mode: "insensitive" } } }),
    db.ceEspecialidad.findMany({ select: { Codigo: true, Reservada: true } }),
  ]);
  const r = roles.find((x) => x.Rol && ROLES_CE[x.Rol]);
  const veReservadas = u.rol === "ADMIN" ? !r || r.VeReservadas === "SI" : r?.VeReservadas === "SI";
  const reservadas = new Set(esp.filter((e) => e.Reservada === "SI").map((e) => e.Codigo));
  // La especialidad de cada solicitud solo hace falta para ocultar lo reservado a quien no lo ve.
  const sol = veReservadas || !reservadas.size ? [] : await db.ceSolicitud.findMany({ select: { ID: true, Especialidad: true } });
  return {
    // Igual que ceRol/ceVeRes del prototipo: sin fila en RolesCE, el administrador es Coordinación y los demás Solo consulta.
    // El administrador siempre puede registrar (aunque su fila en RolesCE diga otra cosa, para no quedar bloqueado).
    rol: u.rol === "ADMIN" ? "coordinacion" : (r?.Rol ?? "consulta"),
    veReservadas,
    reservadas,
    especialidadDe: new Map(sol.map((s) => [s.ID, s.Especialidad ?? ""])),
  };
}

/** ¿La fila pertenece a una especialidad reservada? */
function reservada(h: string, f: Fila, c: CtxCe) {
  if (h === "sol") return c.reservadas.has(String(f.Especialidad ?? ""));
  if (h === "aut" || h === "ges" || h === "cit") return c.reservadas.has(c.especialidadDe.get(String(f.Solicitud ?? "")) ?? "");
  return false;
}

export const CONFIG_CE: ConfigLibro = {
  programa: "ce",
  nombre: "Consulta externa",
  hojas: Object.fromEntries(Object.entries(HOJAS_CE).map(([k, h]) => [k, { modelo: h.modelo, columnas: [...h.columnas], clave: h.clave, nombre: h.nombre } satisfies HojaDef])),
  // El prototipo lee el libro de Consulta externa todo como texto (ceParse con raw:false y "" en las celdas vacías).
  tipo: () => "texto",
  vacio: "",
  contexto,
  leeFila: (h, f, _u, c: CtxCe) => c.veReservadas || !reservada(h, f, c),
  escribe: (h, u, tipo, f, c: CtxCe) => {
    if (!puede(u, "ce", "registrar") || !rolPuedeCe(c.rol, h)) return false;
    // Una solicitud o una cita nueva de una especialidad reservada la registra solo personal autorizado.
    return !(tipo === "nuevo" && !c.veReservadas && reservada(h, f, c));
  },
  // ceAdd guarda en «Usuario» el usuario de la sesión (no el nombre y cargo).
  fijarNuevo: (_h, datos, u) => {
    if ("Usuario" in datos) datos.Usuario = u.usuario;
  },
  // Reglas críticas de la agenda verificadas también en el servidor (el prototipo las valida en ceAsignar, ceIncompat y
  // ceBloquearCupo). Las hojas se guardan en orden (solicitudes y cupos antes que citas), así que lo creado en el mismo
  // guardado ya está en la base cuando se valida la cita.
  validarNuevo: async (tx, h, d) => {
    if (h !== "cit") return null;
    if (!d.Cupo || !d.Solicitud) return { validacion: "La cita necesita cupo y solicitud." };
    const cupo = await tx.ceCupo.findUnique({ where: { ID: String(d.Cupo) } });
    if (!cupo) return "El cupo no existe. Se recargaron los datos.";
    if (cupo.Estado === "BLOQUEADO") return "El cupo está bloqueado: elija otro.";
    const jor = cupo.Jornada ? await tx.ceJornada.findUnique({ where: { ID: cupo.Jornada } }) : null;
    if (!jor || jor.Estado !== "ABIERTA") return "La jornada de ese cupo no está abierta.";
    const sol = await tx.ceSolicitud.findUnique({ where: { ID: String(d.Solicitud) } });
    if (!sol) return "La solicitud no existe. Se recargaron los datos.";
    if (sol.Estado === "CERRADA") return "La solicitud está cerrada.";
    if (d.Paciente && sol.Paciente !== d.Paciente) return { validacion: "La cita no corresponde al paciente de la solicitud." };
    const otra = await tx.ceCita.findFirst({ where: { Cupo: String(d.Cupo), OR: [{ Estado: null }, { Estado: { notIn: ["CANCELADA", "REPROGRAMADA"] } }] }, select: { ID: true } });
    return otra ? "Otro usuario asignó este cupo. La solicitud sigue en la lista de espera." : null;
  },
  validarModificado: async (tx, h, antes, d, lote) => {
    // Una solicitud pasa a «Con cita» solo por la asignación (regla 6 del prototipo): debe existir su cita.
    if (h === "sol" && d.Estado === "CON_CITA" && antes.Estado !== "CON_CITA") {
      const enLote = (lote?.cit?.nuevos ?? []).some((c) => c.Solicitud === antes.ID);
      if (!enLote && !(await tx.ceCita.findFirst({ where: { Solicitud: String(antes.ID) }, select: { ID: true } }))) return "La solicitud solo pasa a «Con cita» cuando se le asigna una cita.";
    }
    // Un cupo con cita no se bloquea: primero se gestiona la cita (Fase 2 del prototipo).
    if (h === "cup" && d.Estado === "BLOQUEADO" && antes.Estado !== "BLOQUEADO") {
      const cita = await tx.ceCita.findFirst({ where: { Cupo: String(antes.ID), OR: [{ Estado: null }, { Estado: { notIn: ["CANCELADA", "REPROGRAMADA"] } }] }, select: { ID: true } });
      if (cita) return "El cupo tiene una cita: no se puede bloquear.";
    }
    return null;
  },
  paciente: {
    hoja: "pac",
    relacionPersona: "cePaciente",
    camposPersona: CAMPOS_PERSONA_CE,
    campoIngreso: "Registrado",
    aPersona: (r: Fila) => ({
      tipoDoc: r.TipoDoc, documento: r.Documento, primerNombre: r.PrimerNombre, segundoNombre: r.SegundoNombre, primerApellido: r.PrimerApellido,
      segundoApellido: r.SegundoApellido, fechaNacimiento: r.FechaNac, sexo: sexoEtiqueta(r.Sexo), eps: r.EPS, municipio: r.Municipio, telefono: r.Telefono,
    }),
    desdePersona: (p, fecha) => ({
      TipoDoc: p.tipoDoc, Documento: p.documento, PrimerNombre: p.primerNombre || null, SegundoNombre: p.segundoNombre, PrimerApellido: p.primerApellido || null,
      SegundoApellido: p.segundoApellido, FechaNac: fecha(p.fechaNacimiento), Sexo: sexoCodigo(p.sexo), EPS: p.eps?.nombre ?? null, Municipio: p.municipio,
      Telefono: p.telefono,
    }),
  },
};
