/* Libro de Diálisis peritoneal (Fase 8) para el motor genérico (modulos/libro).
   Acceso en dos capas (decisión V2 del 13 oct 2026):
   1. El permiso del programa (Usuarios): «ver» para entrar, «registrar» para guardar, «anular» para anular.
   2. El rol dentro del módulo (hoja RolesDP del prototipo): qué hojas registra cada rol, igual que dpGuard/dpCan.
   El administrador del sistema es «Dirección Médica»; un usuario sin rol en RolesDP es «Solo consulta», como en el
   prototipo (dpRole). Laboratorio también registra resultados y solicitudes de DP si su rol en RolesDP lo permite. */
import { puede, type UsuarioSesion } from "@posmedica/shared";
import type { ConfigLibro, Fila, HojaDef } from "../libro/servicio.js";
import { sexoEtiqueta } from "../libro/persona.js";
import { leeProgramaOTransversal } from "../libro/transversal.js";
import { CAMPOS_PERSONA_DP, FECHAS_DP, HOJAS_DP, NUMEROS_DP } from "./hojas.js";

/** Roles y acciones del módulo (DP_ROLES y DP_PERM del prototipo; la prueba verifica que sean idénticos). */
export const ROLES_DP: Record<string, string> = {
  dir: "Dirección Médica", coord: "Coordinación de Unidad Renal", nefro: "Nefrología", med: "Médico autorizado", enf: "Enfermería profesional",
  aux: "Auxiliar de enfermería", multi: "Nutrición, psicología o trabajo social", lab: "Laboratorio", adm: "Administrativo y logística", cons: "Solo consulta o auditoría",
};
export const PERMISOS_DP: Record<string, string> = {
  dir: "*", coord: "pac val valfin lab labval age seg ins imp apr exp cfg", nefro: "pac val valfin pre lab labval age seg exp", med: "val valfin lab age seg exp",
  enf: "pac val valfin lab age seg ins exp", aux: "age ins lab", multi: "val valfin age", lab: "lab", adm: "pac age ins exp", cons: "exp",
};

/** Acciones del rol que permiten registrar en cada hoja (tomadas de la guardia que protege cada escritura del prototipo). */
export const ACCIONES_HOJA_DP: Record<string, string[]> = {
  pac: ["pac", "seg", "imp"], // seg: el implante del catéter actualiza el paciente; imp: la importación crea pacientes
  est: ["pac"], val: ["val", "valfin"], age: ["age", "val", "apr"], pre: ["pre"], lab: ["lab", "labval"], plab: ["labval", "apr"],
  sol: ["lab"], cat: ["seg"], edu: ["seg"], hos: ["seg"], trp: ["seg"], cvr: ["seg"], epi: ["seg"], atb: ["seg"], ins: ["ins", "imp"],
  ent: ["ins"], her: ["apr", "imp"], imp: ["imp"], cac: ["apr"], cacd: ["apr"], pm: ["apr"], rol: ["cfg"], cfg: ["cfg"],
};
/** Hojas que también registra el módulo Laboratorio (con su rol de Laboratorio en RolesDP). */
const HOJAS_LAB = new Set(["lab", "sol"]);

export const rolPuedeDp = (rol: string, accion: string) => {
  const p = PERMISOS_DP[rol] ?? PERMISOS_DP.cons;
  return p === "*" || p.split(" ").includes(accion);
};

const partir = (s: unknown) => {
  const t = String(s ?? "").trim().split(/\s+/).filter(Boolean);
  return [t[0] ?? "", t.slice(1).join(" ") || null] as const;
};

export const CONFIG_DP: ConfigLibro = {
  programa: "dp",
  nombre: "Diálisis peritoneal",
  hojas: Object.fromEntries(
    Object.entries(HOJAS_DP).map(([k, h]) => [k, { modelo: h.modelo, columnas: [...h.columnas], clave: h.clave, nombre: h.nombre, ...("compuesta" in h ? { compuesta: [...h.compuesta] } : {}) } satisfies HojaDef]),
  ),
  tipo: (_h, c) => (FECHAS_DP.has(c) ? "fecha" : NUMEROS_DP.has(c) ? "numero" : "texto"),
  vacio: null, // el prototipo lee el libro DP con readSheet (celdas vacías = null), como Hemodiálisis
  textoNumerico: new Set(["lab.Valor"]), // el valor de un laboratorio puede ser 3.2 o «Reactivo» (como en Hemodiálisis)
  puedeLeer: leeProgramaOTransversal("dp"),
  // Rol del usuario en RolesDP (el administrador es Dirección Médica).
  contexto: async (db, u: UsuarioSesion) => {
    if (u.rol === "ADMIN") return "dir";
    const filas = await db.dpRol.findMany({ where: { Usuario: { equals: u.usuario, mode: "insensitive" } } });
    const r = filas.find((x) => x.Activo !== "NO" && x.Rol && ROLES_DP[x.Rol]);
    return r?.Rol ?? "cons";
  },
  puedeEscribir: (u) => puede(u, "dp", "registrar") || puede(u, "lab", "registrar"),
  escribe: (h, u, _t, _f, rol: string) => {
    const capa1 = puede(u, "dp", "registrar") || (HOJAS_LAB.has(h) && puede(u, "lab", "registrar"));
    return capa1 && (ACCIONES_HOJA_DP[h] ?? []).some((a) => rolPuedeDp(rol, a));
  },
  paciente: {
    hoja: "pac",
    relacionPersona: "dpPaciente",
    camposPersona: CAMPOS_PERSONA_DP,
    campoIngreso: "FechaIngresoPrograma",
    // DP guarda «Nombres» y «Apellidos» completos: se parten en el primer espacio (como Hemodiálisis).
    aPersona: (r: Fila) => {
      const [n1, n2] = partir(r.Nombres);
      const [a1, a2] = partir(r.Apellidos);
      return {
        tipoDoc: r.TipoDoc, documento: r.Documento, primerNombre: n1, segundoNombre: n2, primerApellido: a1, segundoApellido: a2,
        fechaNacimiento: r.FechaNac, sexo: sexoEtiqueta(r.Sexo), eps: r.EPS, regimen: r.Regimen, municipio: r.Municipio, direccion: r.Direccion, telefono: r.Telefono,
      };
    },
    desdePersona: (p, fecha) => ({
      TipoDoc: p.tipoDoc, Documento: p.documento,
      Nombres: [p.primerNombre, p.segundoNombre].filter(Boolean).join(" ") || null,
      Apellidos: [p.primerApellido, p.segundoApellido].filter(Boolean).join(" ") || null,
      FechaNac: fecha(p.fechaNacimiento), Sexo: sexoEtiqueta(p.sexo), EPS: p.eps?.nombre ?? null, Regimen: p.regimen, Municipio: p.municipio,
      Direccion: p.direccion, Telefono: p.telefono,
    }),
  },
};
