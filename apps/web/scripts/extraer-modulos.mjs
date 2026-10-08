/* Genera las páginas de los módulos que conservan la interfaz original del prototipo (public/modulos/<modulo>/).
   El código del prototipo se copia TEXTUALMENTE; el adaptador (adaptador-<modulo>.js, escrito a mano) lo conecta con
   la API: carga desde la base de datos, guarda cada cambio, aplica permisos y elimina los datos ficticios.
   Uso: npm run extraer-modulos -w apps/web   (después de cualquier cambio del prototipo) */
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { MARCAS, leerPrototipo, seccion } from "../../../packages/clinical-rules/scripts/fuente.mjs";

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

mkdirSync(resolve(PUBLICO, "hd"), { recursive: true });
mkdirSync(resolve(PUBLICO, "vendor"), { recursive: true });

// Estilos del prototipo (los mismos del portal) y SheetJS local (la CSP no permite scripts de otros dominios).
writeFileSync(resolve(PUBLICO, "portal.css"), "/* GENERADO: estilos del prototipo. NO EDITAR A MANO. */\n" + estilos);
const require = createRequire(import.meta.url);
copyFileSync(require.resolve("xlsx/dist/xlsx.full.min.js"), resolve(PUBLICO, "vendor/xlsx.full.min.js"));

/* ---------- Hemodiálisis ---------- */
{
  const s = seccion(P.lineas, ...MARCAS.hd);
  const codigo = P.lineas.slice(s.desde, s.hasta).join("\n");
  writeFileSync(resolve(PUBLICO, "hd/hd.js"), CABECERA + codigo + "\n");
  const m = /<section id="hdapp" hidden>([\s\S]*?)<\/section>/.exec(P.html);
  if (!m) throw new Error("No se encontró el marcado de Hemodiálisis (#hdapp).");
  writeFileSync(
    resolve(PUBLICO, "hd/index.html"),
    pagina({
      titulo: "Hemodiálisis · POSMÉDICA",
      cuerpo: `<section id="hdapp">${sinBase64(m[1])}</section>`,
      scripts: ["../vendor/xlsx.full.min.js", "hd.js", "../adaptador-comun.js", "adaptador-hd.js"],
    }),
  );
  console.log(`hd: ${(codigo.length / 1024).toFixed(0)} KB de código original`);
}
