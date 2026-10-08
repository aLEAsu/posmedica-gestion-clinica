/* Herramientas de comparación entre el prototipo (oráculo) y los motores extraídos. */

const esFecha = (v: unknown): v is Date => Object.prototype.toString.call(v) === "[object Date]";

/** Convierte un resultado a una forma comparable: fechas a texto, pacientes a su ID, definiciones de indicador a su
    código, sin funciones y sin ciclos. Funciona con objetos del reino del oráculo (vm) y del anfitrión. */
export function normalizar(v: unknown, vistos = new WeakSet<object>(), prof = 0): unknown {
  if (v === null || v === undefined) return v ?? null;
  if (typeof v === "number") return Number.isNaN(v) ? "NaN" : Object.is(v, -0) ? 0 : Number(v.toPrecision(12));
  if (typeof v === "string" || typeof v === "boolean") return v;
  if (typeof v === "bigint") return v.toString();
  if (typeof v === "function" || typeof v === "symbol") return undefined;
  if (esFecha(v)) return isNaN((v as Date).getTime()) ? "fecha-invalida" : (v as Date).toISOString();
  const o = v as Record<string, unknown>;
  if (prof > 0 && ("_ses" in o || "_iv" in o) && "ID" in o) return { $paciente: o.ID };
  if (prof > 0 && "ID" in o && "PrimerNombre" in o && "FechaDx" in o) return { $paciente: o.ID }; // VIH
  if (prof > 0 && "codigo" in o && "fnac" in o && "terapia" in o) return { $paciente: o.codigo }; // Nefroprotección
  if (prof > 0 && typeof o.f === "function" && typeof o.c === "string") return { $indicador: o.c };
  if (prof > 0 && typeof o.f === "function" && typeof o.id === "string") return { $indicador: o.id };
  if (vistos.has(o)) return { $ciclo: true };
  vistos.add(o);
  const tag = Object.prototype.toString.call(o);
  let r: unknown;
  if (Array.isArray(o)) r = o.map((x) => normalizar(x, vistos, prof + 1));
  else if (tag === "[object Set]") r = { $set: [...(o as unknown as Set<unknown>)].map((x) => normalizar(x, vistos, prof + 1)).sort() };
  else if (tag === "[object Map]") r = { $map: [...(o as unknown as Map<unknown, unknown>)].map(([k, x]) => [String(k), normalizar(x, vistos, prof + 1)]) };
  else {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(o).sort()) {
      const x = normalizar(o[k], vistos, prof + 1);
      if (x !== undefined) out[k] = x;
    }
    r = out;
  }
  vistos.delete(o);
  return r;
}

/** Evalúa una expresión con los nombres exportados por un motor como si fueran variables globales del prototipo. */
export function evaluarEn(motor: Record<string, unknown>, expr: string): unknown {
  const nombres = Object.keys(motor);
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  return new Function(...nombres, `"use strict"; return (${expr});`)(...nombres.map((n) => motor[n]));
}

/** Copia profunda que conserva fechas y quita los campos de índice (_ses, _lab…) que cada motor recalcula. */
export function clonarLibro<T>(libro: T): T {
  const copia = (v: unknown): unknown => {
    if (v === null || typeof v !== "object") return v;
    if (esFecha(v)) return new Date((v as Date).getTime());
    if (Array.isArray(v)) return v.map(copia);
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
      if (k.startsWith("_") && k !== "_dupOf" && k !== "_mod" && k !== "_endGuess" && k !== "_noStart") continue;
      if (typeof x === "function") continue;
      out[k] = copia(x);
    }
    return out;
  };
  return copia(libro) as T;
}
