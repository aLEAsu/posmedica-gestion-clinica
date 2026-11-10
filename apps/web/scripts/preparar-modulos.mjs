/* Preparación de los módulos de public/modulos/ (portal, nefro): código PROPIO del proyecto, versionado y editado aquí.
   El prototipo HTML de la coordinación médica es solo una referencia funcional: ni el build ni las pruebas lo leen.

   Uso:
     node scripts/preparar-modulos.mjs              copia SheetJS local a public/modulos/vendor/ (la CSP no permite
                                                    scripts de otros dominios). Corre antes de vite (dev y build).
     node scripts/preparar-modulos.mjs --huella     después de «vite build»: en dist/modulos/, cada script y hoja de
                                                    estilos que cargan las páginas se copia a c/ con una huella de su
                                                    contenido en el nombre (portal.3f9a1c2b.js). Render los guarda en
                                                    caché por un año (cabecera de /modulos/c/*) y el navegador solo
                                                    descarga de nuevo lo que cambió. Las páginas index.html no van en
                                                    caché. Trabaja sobre dist/: los archivos fuente no se modifican. */
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));

if (!process.argv.includes("--huella")) {
  const VENDOR = resolve(aqui, "../public/modulos/vendor");
  mkdirSync(VENDOR, { recursive: true });
  const require = createRequire(import.meta.url);
  copyFileSync(require.resolve("xlsx/dist/xlsx.full.min.js"), resolve(VENDOR, "xlsx.full.min.js"));
  console.log("modulos: SheetJS local en public/modulos/vendor/");
} else {
  const MODULOS = resolve(aqui, "../dist/modulos");
  if (!existsSync(MODULOS)) throw new Error("No existe dist/modulos: ejecute primero «vite build».");
  const CACHE = resolve(MODULOS, "c");
  rmSync(CACHE, { recursive: true, force: true });
  mkdirSync(CACHE, { recursive: true });
  const copias = new Map();
  const huella = (ruta) => {
    if (!copias.has(ruta)) {
      const datos = readFileSync(ruta);
      const h = createHash("sha256").update(datos).digest("hex").slice(0, 10);
      const nombre = basename(ruta).replace(/(\.[a-z]+)$/, `.${h}$1`);
      writeFileSync(resolve(CACHE, nombre), datos);
      copias.set(ruta, nombre);
    }
    return copias.get(ruta);
  };
  const paginas = readdirSync(MODULOS, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(resolve(MODULOS, d.name, "index.html")))
    .map((d) => resolve(MODULOS, d.name, "index.html"));
  for (const archivo of paginas) {
    const dir = dirname(archivo);
    const html = readFileSync(archivo, "utf8").replace(/(<script src="|<link rel="stylesheet" href=")([^"]+)(")/g, (m, a, src, b) =>
      /^(https?:)?\/\//.test(src) || src.startsWith("/") ? m : a + "../c/" + huella(resolve(dir, src)) + b,
    );
    writeFileSync(archivo, html);
  }
  console.log(`huella: ${paginas.length} páginas, ${copias.size} archivos en dist/modulos/c/`);
}
