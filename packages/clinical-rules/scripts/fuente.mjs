/* Lectura del prototipo original «Gestión Clínica POSMÉDICA (1).html» (raíz del repositorio).
   Lo usan el extractor de reglas y el oráculo de las pruebas de equivalencia: ambos parten del mismo archivo. */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
export const RUTA_PROTOTIPO = resolve(aqui, "../../../Gestión Clínica POSMÉDICA (1).html");

const ENTIDADES = { "&quot;": '"', "&amp;": "&", "&lt;": "<", "&gt;": ">", "&#39;": "'" };

/** Scripts en línea de un documento HTML, en orden. */
export function scriptsDe(html) {
  const out = [];
  const re = /<script([^>]*)>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html))) if (!/\bsrc=/.test(m[1]) && m[2].trim()) out.push(m[2]);
  return out;
}

/** Devuelve { html, scripts, principal, lineas, nefroHtml, nefroScripts } del prototipo. */
export function leerPrototipo(ruta = RUTA_PROTOTIPO) {
  const html = readFileSync(ruta, "utf8");
  const scripts = scriptsDe(html);
  const principal = scripts.find((s) => s.includes("/* ================= utilidades ================= */"));
  if (!principal) throw new Error("No se encontró el script principal del prototipo.");
  const lineas = principal.split("\n");
  const ln = lineas.find((l) => l.startsWith("const NEFRO_HTML="));
  const nefroHtml = ln ? JSON.parse(ln.slice("const NEFRO_HTML=".length).replace(/;\s*$/, "")) : null;
  const nefroScripts = nefroHtml ? scriptsDe(nefroHtml) : [];
  return { html, scripts, principal, lineas, nefroHtml, nefroScripts };
}

/** Rango de líneas [desde, hasta) del script principal entre dos marcadores (texto de inicio de línea). */
export function seccion(lineas, inicio, fin) {
  const a = lineas.findIndex((l) => l.startsWith(inicio));
  const b = fin ? lineas.findIndex((l, i) => i > a && l.startsWith(fin)) : lineas.length;
  if (a < 0 || b < 0) throw new Error(`Marcador no encontrado: ${a < 0 ? inicio : fin}`);
  return { desde: a, hasta: b };
}

export const MARCAS = {
  hd: ["\"use strict\";", "/* ================= PORTAL POSMÉDICA · núcleo"],
  vih: ["/* ================= v0.4 · PROGRAMA VIH · estructura", "/* ================= eventos del portal"],
};

export { ENTIDADES };
