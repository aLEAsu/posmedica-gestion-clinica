/* Lectura del código PROPIO de los módulos (apps/web/public/modulos/), el mismo que la aplicación sirve.
   Lo usan el extractor de reglas y el oráculo de las pruebas de equivalencia: ambos parten de esos archivos, así las
   pruebas verifican que el paquete de reglas coincide con lo que de verdad corre en el navegador.
   El prototipo HTML de la coordinación médica es solo referencia funcional: nada aquí lo lee. */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
export const RUTA_MODULOS = resolve(aqui, "../../../apps/web/public/modulos");

/** Scripts propios (src relativos, sin adaptadores ni librerías) que carga una página de módulo, en orden. */
function scriptsDePagina(pagina, incluir) {
  const html = readFileSync(resolve(RUTA_MODULOS, pagina), "utf8");
  const dir = dirname(resolve(RUTA_MODULOS, pagina));
  return [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]).filter(incluir).map((src) => readFileSync(resolve(dir, src), "utf8"));
}

/** Devuelve { principal, scripts, lineaBase, nefroScripts } de los módulos.
    principal: el código del portal (Hemodiálisis, VIH, transversales); nefroScripts: los de la Ruta de Nefroprotección. */
export function leerModulos() {
  const scripts = scriptsDePagina("portal/index.html", (s) => /^portal[-\d]*\.js$/.test(s));
  const principal = scripts.find((s) => s.includes("/* ================= utilidades ================= */"));
  if (!principal) throw new Error("No se encontró el código principal del portal (apps/web/public/modulos/portal/portal.js).");
  const nefroScripts = scriptsDePagina("nefro/index.html", (s) => /^ruta-\d+\.js$/.test(s));
  // Las líneas citadas («portal.js:línea») son las del propio archivo.
  return { principal, scripts, lineaBase: 0, nefroScripts };
}

/** Nombre con que se cita el archivo de origen en el código generado («portal.js:línea»). */
export const ETIQUETA = "portal.js";
