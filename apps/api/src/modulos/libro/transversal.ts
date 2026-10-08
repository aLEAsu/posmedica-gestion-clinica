/* Acceso de los módulos transversales a los libros de los programas (como en el prototipo, donde Laboratorio,
   Producción, Seguridad del paciente, IAAS y PROA leen los libros de Hemodiálisis y VIH). */
import { puede, type UsuarioSesion } from "@posmedica/shared";

export const TRANSVERSALES = ["lab", "prod", "sp", "iaas", "proa"] as const;

/** Lee el libro quien ve el programa o alguno de los módulos transversales que lo consultan. */
export const leeProgramaOTransversal = (programa: string) => (u: UsuarioSesion) =>
  puede(u, programa, "ver") || TRANSVERSALES.some((t) => puede(u, t, "ver"));

/** Hojas de un programa que también puede escribir un módulo transversal (hoja → módulos). */
export function escrituraConTransversales(programa: string, extra: Record<string, string[]>) {
  const modulos = [...new Set(Object.values(extra).flat())];
  return {
    puedeEscribir: (u: UsuarioSesion) => puede(u, programa, "registrar") || modulos.some((t) => puede(u, t, "registrar")),
    escribe: (hoja: string, u: UsuarioSesion) => puede(u, programa, "registrar") || (extra[hoja] ?? []).some((t) => puede(u, t, "registrar")),
  };
}
