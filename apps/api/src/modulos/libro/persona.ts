/* Convenciones del maestro único «persona» compartidas por los programas.
   Sexo: la persona guarda la etiqueta («Femenino», «Masculino», «Indeterminado»), como Hemodiálisis, Diálisis peritoneal
   y la fachada de Nefroprotección; VIH y Consulta externa trabajan con el código (F, M, I) y se traducen al guardar y al
   leer. Así un programa nunca sobrescribe el sexo con una convención que otro no reconoce. */

const ETIQUETA: Record<string, string> = { F: "Femenino", M: "Masculino", I: "Indeterminado" };

function codigo(v: unknown): string | null {
  const s = String(v ?? "").trim().toUpperCase();
  if (!s) return null;
  if (s === "F" || s.startsWith("FEM") || s === "MUJER") return "F";
  if (s === "M" || s.startsWith("MASC") || s === "HOMBRE") return "M";
  if (s === "I" || s.startsWith("INDET")) return "I";
  return null;
}

/** Valor de un programa → etiqueta para «persona» (un valor desconocido se guarda tal cual). */
export const sexoEtiqueta = (v: unknown) => {
  const c = codigo(v);
  return c ? ETIQUETA[c] : v == null || v === "" ? v : String(v);
};

/** Valor de «persona» → código F/M/I para los programas que usan código. */
export const sexoCodigo = (v: unknown) => codigo(v) ?? (v == null || v === "" ? v : String(v));
