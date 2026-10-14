/* Acceso de los módulos transversales a los libros de los programas (como en el prototipo, donde Laboratorio,
   Producción, Seguridad del paciente, IAAS y PROA leen los libros de Hemodiálisis, VIH y Diálisis peritoneal).
   Minimización de datos (Ley 1581): quien no tiene el programa recibe SOLO las hojas que su módulo usa. Las listas se
   midieron con el prototipo (cada vista transversal se dibuja idéntica con estas hojas que con el libro completo; lo
   verifica test/transversal.test.ts) y se completaron con las hojas que el módulo escribe y las que definen si un
   paciente está activo (movimientos, novedades, transiciones). */
import { puede, type UsuarioSesion } from "@posmedica/shared";

export const TRANSVERSALES = ["lab", "prod", "sp", "iaas", "proa"] as const;
type Transversal = (typeof TRANSVERSALES)[number];

export const HOJAS_TRANSVERSALES: Record<"hd" | "vih" | "dp", Partial<Record<Transversal, string[]>>> = {
  hd: {
    lab: ["pac", "mov", "nov", "lab", "sol"],
    prod: ["pac", "mov", "nov", "ses"],
    sp: ["pac", "mov", "nov", "ses", "evt", "seg"],
    iaas: ["pac", "mov", "nov", "ses", "evt", "atb", "dsp", "lim", "aud"],
    proa: ["pac", "mov", "nov", "ses", "evt", "atb"],
  },
  vih: {
    lab: ["pac", "nov", "lab", "sol"],
    prod: ["pac", "nov", "cit", "ent"],
  },
  // DP: RolesDP y Config no tienen datos de pacientes y el módulo los necesita para el rol del usuario (dpRole) y sus
  // parámetros (dpCfg): sin «rol», Laboratorio quedaría como «Solo consulta» aunque tenga su rol en DP.
  dp: {
    lab: ["pac", "est", "lab", "plab", "sol", "rol", "cfg"],
    prod: ["pac", "est", "rol", "cfg"],
    iaas: ["pac", "est", "epi", "atb", "cat", "rol", "cfg"],
    proa: ["pac", "est", "epi", "atb", "rol", "cfg"],
  },
};

/** Lee el libro quien ve el programa o alguno de los módulos transversales que lo consultan. */
export const leeProgramaOTransversal = (programa: string) => (u: UsuarioSesion) =>
  puede(u, programa, "ver") || TRANSVERSALES.some((t) => puede(u, t, "ver"));

/** Hojas que recibe cada usuario: todas si tiene el programa; si no, solo las de sus módulos transversales. */
export const leeHojaProgramaOTransversal = (programa: "hd" | "vih" | "dp") => (hoja: string, u: UsuarioSesion) =>
  puede(u, programa, "ver") || TRANSVERSALES.some((t) => puede(u, t, "ver") && (HOJAS_TRANSVERSALES[programa][t] ?? []).includes(hoja));

/** Hojas de un programa que también puede escribir un módulo transversal (hoja → módulos). */
export function escrituraConTransversales(programa: string, extra: Record<string, string[]>) {
  const modulos = [...new Set(Object.values(extra).flat())];
  return {
    puedeEscribir: (u: UsuarioSesion) => puede(u, programa, "registrar") || modulos.some((t) => puede(u, t, "registrar")),
    escribe: (hoja: string, u: UsuarioSesion) => puede(u, programa, "registrar") || (extra[hoja] ?? []).some((t) => puede(u, t, "registrar")),
  };
}
