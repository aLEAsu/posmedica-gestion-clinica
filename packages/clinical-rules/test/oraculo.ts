/* Oráculo de equivalencia: ejecuta el prototipo ORIGINAL completo (sin modificar su código) en un contexto
   aislado de Node, con un DOM simulado que acepta cualquier operación y un reloj fijo. Así se obtienen las
   respuestas del prototipo para compararlas con el paquete extraído. */
import vm from "node:vm";
import * as XLSX from "xlsx";
// @ts-expect-error módulo JS sin tipos
import { leerPrototipo } from "../scripts/fuente.mjs";

/** Objeto comodín: se puede leer, escribir, llamar, construir e iterar sin fallar. */
function comodin(): unknown {
  const fn = function () {};
  return new Proxy(fn, {
    get(_t, k) {
      if (k === Symbol.toPrimitive) return () => "";
      if (k === Symbol.iterator) return function* () {};
      if (k === "then") return undefined;
      if (k === "length") return 0;
      if (k === "value" || k === "textContent" || k === "innerHTML") return "";
      if (k === "checked" || k === "hidden") return false;
      if (k === "dataset" || k === "style") return {};
      return comodin();
    },
    set: () => true,
    apply: () => comodin(),
    construct: () => comodin() as object,
    has: () => true,
  });
}

/** Clase Date con «ahora» fijo (en el reino del anfitrión, así las fechas comparan bien con instanceof). */
export function relojFijo(hoy: Date) {
  const base = hoy.getTime();
  return class FechaFija extends Date {
    constructor(...a: unknown[]) {
      if (a.length) super(...(a as [string]));
      else super(base);
    }
    static now() {
      return base;
    }
  };
}

function contexto(hoy: Date, extra: Record<string, unknown> = {}) {
  const doc = comodin();
  const almacen: Record<string, string> = {};
  const g: Record<string, unknown> = {
    console: { log() {}, warn() {}, error() {}, info() {} },
    Date: relojFijo(hoy),
    document: doc,
    localStorage: { getItem: (k: string) => almacen[k] ?? null, setItem: (k: string, v: string) => (almacen[k] = String(v)), removeItem: (k: string) => delete almacen[k] },
    sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    history: comodin(),
    location: { protocol: "file:", hostname: "", href: "" },
    navigator: { userAgent: "node" },
    XLSX,
    FileReader: comodin(),
    Event: comodin(),
    CustomEvent: comodin(),
    Blob: comodin(),
    URL: { createObjectURL: () => "", revokeObjectURL() {} },
    setTimeout: () => 0,
    clearTimeout() {},
    setInterval: () => 0,
    clearInterval() {},
    requestAnimationFrame: () => 0,
    getComputedStyle: () => comodin(),
    matchMedia: () => ({ matches: false, addEventListener() {} }),
    addEventListener() {},
    removeEventListener() {},
    scrollTo() {},
    alert() {},
    confirm: () => true,
    crypto: globalThis.crypto,
    TextEncoder,
    TextDecoder,
    atob,
    btoa,
    fetch: () => Promise.reject(new Error("sin red en el oráculo")),
    AbortController,
    ...extra,
  };
  g.window = g;
  g.self = g;
  g.parent = g;
  g.top = g;
  return vm.createContext(g);
}

export interface Oraculo {
  /** Evalúa una expresión dentro del prototipo (tiene acceso a ST, VX, IND, alertas…). */
  ev<T = unknown>(expr: string): T;
}

/** Carga el portal completo (Hemodiálisis, VIH y núcleo del portal). */
export function cargarPortal(hoy: Date): Oraculo {
  const P = leerPrototipo();
  const ctx = contexto(hoy);
  for (const s of P.scripts) vm.runInContext(s, ctx, { filename: "prototipo.html" });
  return { ev: (e) => vm.runInContext(e, ctx) };
}

/** Carga la Ruta de Nefroprotección (documento aparte, como el iframe original). */
export function cargarNefro(hoy: Date): Oraculo {
  const P = leerPrototipo();
  const ctx = contexto(hoy);
  for (const s of P.nefroScripts) vm.runInContext(s, ctx, { filename: "nefro.html" });
  return { ev: (e) => vm.runInContext(e, ctx) };
}
