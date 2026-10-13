/* Genera las páginas de los módulos que conservan la interfaz original del prototipo (public/modulos/<modulo>/).
   El código del prototipo se copia TEXTUALMENTE; el adaptador (adaptador-<modulo>.js, escrito a mano) lo conecta con
   la API: carga desde la base de datos, guarda cada cambio, aplica permisos y elimina los datos ficticios.
   Uso: npm run extraer-modulos -w apps/web   (después de cualquier cambio del prototipo) */
import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { leerPrototipo } from "../../../packages/clinical-rules/scripts/fuente.mjs";

const aqui = dirname(fileURLToPath(import.meta.url));
const PUBLICO = resolve(aqui, "../public/modulos");
const P = leerPrototipo();
const CABECERA = "// GENERADO por apps/web/scripts/extraer-modulos.mjs a partir de «Gestión Clínica POSMÉDICA (1).html». NO EDITAR A MANO.\n";

const estilos = [...P.html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("\n");
const sinBase64 = (s) => s.replace(/src="data:image\/[a-z]+;base64,[^"]+"/g, 'src="/logo-posmedica.jpg"');

function pagina({ titulo, cuerpo, scripts }) {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow">
<title>${titulo}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=IBM+Plex+Sans:wght@500;600;700&family=IBM+Plex+Mono:wght@400;600&display=swap">
<link rel="stylesheet" href="../portal.css">
<link rel="stylesheet" href="../modulo.css">
</head>
<body>
<!-- GENERADO por apps/web/scripts/extraer-modulos.mjs. NO EDITAR A MANO. -->
<div id="pxmain" hidden></div>
${cuerpo}
<div class="toast" id="toast" role="status" hidden></div>
<div id="dlg" class="ovl" hidden></div>
${scripts.map((s) => `<script src="${s}"></script>`).join("\n")}
</body>
</html>
`;
}

mkdirSync(resolve(PUBLICO, "vendor"), { recursive: true });

// Estilos del prototipo (los mismos del portal) y SheetJS local (la CSP no permite scripts de otros dominios).
writeFileSync(resolve(PUBLICO, "portal.css"), "/* GENERADO: estilos del prototipo. NO EDITAR A MANO. */\n" + estilos);
const require = createRequire(import.meta.url);
copyFileSync(require.resolve("xlsx/dist/xlsx.full.min.js"), resolve(PUBLICO, "vendor/xlsx.full.min.js"));

/* ---------- Nefroprotección ----------
   La Ruta v7.2 es un documento propio (en el prototipo iba en un iframe). Se copia completo; sus scripts en línea pasan
   a archivos (la CSP no admite scripts en línea) y SheetJS se toma local. ÚNICO cambio de configuración: la dirección de
   su API de «modo base de datos» (const API="api/") apunta a la fachada del servidor (/api/v1/nefro/pg/). */
{
  if (!P.nefroHtml) throw new Error("El prototipo no trae la Ruta de Nefroprotección (NEFRO_HTML).");
  mkdirSync(resolve(PUBLICO, "nefro"), { recursive: true });
  let html = P.nefroHtml;
  let n = 0;
  let apiConfigurada = false;
  html = html.replace(/<script src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/xlsx\/[^"]+"><\/script>/, '<script src="../vendor/xlsx.full.min.js"></script>');
  html = html.replace(/<script>([\s\S]*?)<\/script>/g, (_m, codigo) => {
    n++;
    let c = codigo;
    if (c.includes('const API="api/";')) {
      apiConfigurada = true;
      c = c.replace('const API="api/";', 'const API="/api/v1/nefro/pg/"; /* CAMBIO DE CONFIGURACIÓN: fachada del servidor */');
      // PUENTE (única línea agregada): el adaptador avisa que la agenda ya quedó guardada en el servidor, para que la
      // Ruta deje de marcarla «con cambios sin descargar» y no advierta al cerrar si no hay nada pendiente. Desde la v8,
      // también da acceso al estado interno de la Ruta, donde viven la auditoría de guías, el arrastre y la configuración
      // de la nominal (ST.aud, ST.arr, ST.ncfg), que antes solo se guardaban en el Excel.
      const fin = c.lastIndexOf("})();");
      if (fin < 0) throw new Error("No se encontró el cierre del script de gestión de la Ruta.");
      c = c.slice(0, fin) + 'window.MG.agendaGuardada=function(){ST.dirty=false;try{bookInfo();}catch(e){}};window.MG.estadoRuta=function(){return ST;}; /* PUENTE agregado por extraer-modulos.mjs */\n' + c.slice(fin);
    }
    writeFileSync(resolve(PUBLICO, `nefro/ruta-${n}.js`), CABECERA + c + "\n");
    return `<script src="ruta-${n}.js"></script>`;
  });
  if (!apiConfigurada) throw new Error("No se encontró la configuración de la API de la Ruta.");
  // Adaptadores: el previo va antes de los scripts de la Ruta y el posterior al final.
  html = html.replace(/<script src="\.\.\/vendor\/xlsx\.full\.min\.js"><\/script>/, '<script src="../vendor/xlsx.full.min.js"></script>\n<script src="../adaptador-comun.js"></script>\n<script src="adaptador-nefro-previo.js"></script>');
  html = html.replace(/<\/body>(?![\s\S]*<\/body>)/, '<script src="adaptador-nefro.js"></script>\n<link rel="stylesheet" href="../modulo.css">\n</body>');
  html = html.replace(/<head>/, "<head>\n<!-- GENERADO por apps/web/scripts/extraer-modulos.mjs. NO EDITAR A MANO. -->");
  writeFileSync(resolve(PUBLICO, "nefro/index.html"), html);
  console.log(`nefro: ${n} scripts de la Ruta copiados (${(html.length / 1024).toFixed(0)} KB de marcado)`);
}

/* ---------- Portal (Hemodiálisis, VIH, módulos transversales y marco de Nefroprotección) ----------
   Como en el prototipo, todo vive en una sola página: Hemodiálisis en su sección #hdapp (su código usa también el de
   dispositivos, microbiología e IAAS que está más abajo en el mismo script), VIH, Laboratorio, Producción, Seguridad del
   paciente, IAAS, PROA, SOGCS, Documentos, Mensajes y Calendario, y la Ruta de Nefroprotección en el iframe #nefroframe
   (cargada desde el servidor). Se copia el script principal COMPLETO (sin el HTML embebido de Nefroprotección, que se
   publica como página aparte) y el marcado completo del cuerpo; el adaptador lo conecta con la base de datos. */
{
  mkdirSync(resolve(PUBLICO, "portal"), { recursive: true });
  const codigo = P.lineas.map((l) => (l.startsWith("const NEFRO_HTML=") ? 'const NEFRO_HTML=""; /* Nefroprotección se migra como módulo aparte */' : l)).join("\n");
  writeFileSync(resolve(PUBLICO, "portal/portal.js"), CABECERA + codigo + "\n");
  // Del primer <body> al ÚLTIMO </body> (dentro del código hay cadenas con "</body>"), sin scripts ni estilos.
  const ini = P.html.indexOf(">", P.html.indexOf("<body")) + 1;
  const cuerpo = P.html.slice(ini, P.html.lastIndexOf("</body>"))
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "")
    .replace(/<link[^>]*>/g, "")
    .replace(/<title>[\s\S]*?<\/title>/g, "")
    .replace(/<div class="toast" id="toast"[^>]*><\/div>/, "")
    .replace(/<div id="dlg" class="ovl"[^>]*><\/div>/, "");
  writeFileSync(
    resolve(PUBLICO, "portal/index.html"),
    pagina({
      titulo: "Portal · POSMÉDICA",
      cuerpo: `<div class="cargando-modulo" id="cargando-modulo">Cargando…</div>\n${sinBase64(cuerpo).replace('<div id="pxmain"', '<div id="pxmain-original"')}`,
      scripts: ["../vendor/xlsx.full.min.js", "portal.js", "../adaptador-comun.js", "adaptador-portal.js"],
    }).replace('<div id="pxmain" hidden></div>\n', "").replace('id="pxmain-original"', 'id="pxmain"'),
  );
  console.log(`portal: ${(codigo.length / 1024).toFixed(0)} KB de código original (portal completo: Hemodiálisis, VIH, módulos transversales y marco de Nefroprotección)`);
}

/* ---------- Huella de los archivos estáticos (solo en la compilación: npm run build) ----------
   Cada script y hoja de estilos que cargan las páginas de los módulos se copia a public/modulos/c/ con una huella de su
   contenido en el nombre (portal.3f9a1c2b.js). Así Render puede guardarlos en caché por un año (cabecera de
   /modulos/c/*) y el navegador solo descarga de nuevo lo que cambió. Las páginas index.html no se guardan en caché. */
if (process.argv.includes("--huella")) {
  const CACHE = resolve(PUBLICO, "c");
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
  for (const pag of ["portal/index.html", "nefro/index.html"]) {
    const archivo = resolve(PUBLICO, pag);
    const dir = dirname(archivo);
    const html = readFileSync(archivo, "utf8").replace(/(<script src="|<link rel="stylesheet" href=")([^"]+)(")/g, (m, a, src, b) =>
      /^(https?:)?\/\//.test(src) || src.startsWith("/") ? m : a + "../c/" + huella(resolve(dir, src)) + b,
    );
    writeFileSync(archivo, html);
  }
  console.log(`huella: ${copias.size} archivos en /modulos/c/`);
}
