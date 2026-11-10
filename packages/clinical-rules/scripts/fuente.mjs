/* Lectura del código PROPIO de los módulos (apps/web/public/modulos/), el mismo que la aplicación sirve.
   Lo usan el extractor de reglas y el oráculo de las pruebas de equivalencia: ambos parten de esos archivos, así las
   pruebas verifican que el paquete de reglas coincide con lo que de verdad corre en el navegador.
   El prototipo HTML de la coordinación médica es solo referencia funcional: nada aquí lo lee. */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
export const RUTA_MODULOS = resolve(aqui, "../../../apps/web/public/modulos");

/** Scripts propios que carga una página de módulo, en orden: [{ archivo, codigo }]. */
function scriptsDePagina(pagina, incluir) {
  const html = readFileSync(resolve(RUTA_MODULOS, pagina), "utf8");
  const dir = dirname(resolve(RUTA_MODULOS, pagina));
  return [...html.matchAll(/<script src="([^"]+)"><\/script>/g)]
    .map((m) => m[1])
    .filter(incluir)
    .map((src) => ({ archivo: src, codigo: readFileSync(resolve(dir, src), "utf8") }));
}

/** Devuelve { principal, scripts, porArchivo, lineaBase, nefroScripts } de los módulos.
    principal: el núcleo del portal (portal.js: Hemodiálisis, VIH, transversales); scripts: todo el código propio de la
    página del portal en orden de carga; porArchivo: el código de cada archivo del portal; nefroScripts: la Ruta. */
export function leerModulos() {
  // Todo lo que carga la página salvo librerías (../vendor) y adaptadores a la API: el código de la interfaz.
  const propio = (s) => !s.includes("/") && !s.startsWith("adaptador");
  const portal = scriptsDePagina("portal/index.html", propio);
  const porArchivo = Object.fromEntries(portal.map((s) => [s.archivo, s.codigo]));
  const principal = porArchivo["portal.js"];
  if (!principal || !principal.includes("/* ================= utilidades ================= */"))
    throw new Error("No se encontró el código principal del portal (apps/web/public/modulos/portal/portal.js).");
  const nefroScripts = scriptsDePagina("nefro/index.html", propio).map((s) => s.codigo);
  // Las líneas citadas («portal.js:línea») son las del propio archivo.
  return { principal, scripts: portal.map((s) => s.codigo), porArchivo, lineaBase: 0, nefroScripts };
}

/** Nombre con que se cita el archivo de origen en el código generado («portal.js:línea»). */
export const ETIQUETA = "portal.js";
