/* Extractor de reglas clínicas.
   Copia TEXTUALMENTE (sin reescribir) las definiciones de lógica clínica del prototipo a módulos sin DOM:
     src/generado/hd.js     crearMotorHD(ctx)
     src/generado/vih.js    crearMotorVIH(ctx)
     src/generado/nefro.js  crearMotorNefro(ctx)
   Cada definición lleva un comentario con su línea de origen. Lo único que se reemplaza es el estado global
   del navegador (ST, VX, TODAY), que pasa a venir del contexto `ctx`. Si una definición incluida usa otra que no
   se incluyó, el extractor falla y la nombra: así no puede quedar una regla a medias.

   Uso: npm run extraer -w packages/clinical-rules  (después de cualquier cambio en el prototipo) */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as acorn from "acorn";
import * as walk from "acorn-walk";
import { MARCAS, leerPrototipo, seccion } from "./fuente.mjs";

const aqui = dirname(fileURLToPath(import.meta.url));
const SALIDA = process.env.SALIDA_REGLAS ? resolve(process.env.SALIDA_REGLAS) : resolve(aqui, "../src/generado");
const INVENTARIO = [];
const P = leerPrototipo();

/* ---------- análisis ---------- */

/** Definiciones de primer nivel de un fragmento: nombre → { texto, linea, refs }. */
function definiciones(codigo, lineaBase, archivo) {
  const ast = acorn.parse(codigo, { ecmaVersion: "latest", sourceType: "script", locations: true, allowReturnOutsideFunction: true });
  const defs = new Map();
  const otras = [];
  for (const n of ast.body) {
    const nombres =
      n.type === "FunctionDeclaration" ? [n.id.name] : n.type === "VariableDeclaration" ? n.declarations.flatMap((d) => (d.id.type === "Identifier" ? [d.id.name] : [])) : [];
    const texto = codigo.slice(n.start, n.end);
    if (!nombres.length) {
      otras.push({ linea: lineaBase + n.loc.start.line, texto: texto.slice(0, 80) });
      continue;
    }
    const info = { nombres, texto, linea: lineaBase + n.loc.start.line, archivo, refs: referencias(n) };
    nombres.forEach((x) => defs.set(x, info));
  }
  return { defs, otras };
}

/** Identificadores que una definición usa (excluye propiedades, claves de objetos y nombres declarados dentro de ella).
    Aproximación sin ámbitos completos: si quedara una dependencia oculta, las pruebas fallan con ReferenceError. */
function referencias(nodo) {
  const r = new Set();
  const locales = new Set();
  const decl = (p) => {
    if (!p) return;
    if (p.type === "Identifier") locales.add(p.name);
    else if (p.type === "ObjectPattern") p.properties.forEach((x) => decl(x.type === "RestElement" ? x.argument : x.value));
    else if (p.type === "ArrayPattern") p.elements.forEach(decl);
    else if (p.type === "AssignmentPattern") decl(p.left);
    else if (p.type === "RestElement") decl(p.argument);
  };
  walk.full(nodo, (n) => {
    if (n.type === "VariableDeclarator") decl(n.id);
    if ((n.type === "FunctionDeclaration" || n.type === "FunctionExpression" || n.type === "ArrowFunctionExpression") && n !== nodo) {
      if (n.id && n.type !== "FunctionDeclaration") locales.add(n.id.name);
      if (n.id && n.type === "FunctionDeclaration") locales.add(n.id.name);
      n.params.forEach(decl);
    }
    if (n.type === "FunctionDeclaration" && n === nodo) n.params.forEach(decl);
    if (n.type === "CatchClause") decl(n.param);
  });
  if (nodo.type === "VariableDeclaration") nodo.declarations.forEach((d) => locales.delete(d.id.name));
  walk.fullAncestor(nodo, (n, _st, anc) => {
    if (n.type !== "Identifier") return;
    const p = anc[anc.length - 2];
    if (p && p.type === "MemberExpression" && p.property === n && !p.computed) return;
    if (p && p.type === "Property" && p.key === n && !p.computed && !p.shorthand) return;
    if (p && p.type === "MethodDefinition" && p.key === n) return;
    if (!locales.has(n.name)) r.add(n.name);
  });
  return r;
}

/* ---------- generación ---------- */

const GLOBALES_PERMITIDOS = new Set([
  "Math", "Date", "JSON", "Object", "Array", "String", "Number", "Boolean", "Set", "Map", "WeakMap", "RegExp", "Error", "Promise",
  "isNaN", "isFinite", "parseFloat", "parseInt", "undefined", "Infinity", "NaN", "Symbol", "Intl", "console", "arguments",
  "Uint8Array", "TextEncoder", "TextDecoder", "encodeURIComponent", "decodeURIComponent",
]);

function generar({ archivo, funcion, cabecera, fuentes, incluir, preludio, provistos, exportar }) {
  const todas = new Map();
  for (const f of fuentes) for (const [k, v] of f.defs) if (!todas.has(k)) todas.set(k, v);
  const elegidas = new Set();
  for (const n of incluir) {
    const d = todas.get(n);
    if (!d) throw new Error(`${archivo}: «${n}» no existe en el prototipo.`);
    elegidas.add(d);
  }
  // Verificación de dependencias: toda referencia a una definición del prototipo debe estar incluida o provista.
  const nombresIncluidos = new Set([...elegidas].flatMap((d) => d.nombres));
  const faltan = new Map();
  for (const d of elegidas) {
    for (const ref of d.refs) {
      if (nombresIncluidos.has(ref) || provistos.has(ref) || GLOBALES_PERMITIDOS.has(ref)) continue;
      if (todas.has(ref) || ["document", "window", "localStorage", "XLSX", "crypto", "FileReader", "$"].includes(ref)) {
        if (!faltan.has(ref)) faltan.set(ref, new Set());
        faltan.get(ref).add(d.nombres[0]);
      }
    }
  }
  if (faltan.size) {
    const m = [...faltan].map(([k, v]) => `  ${k}  ← usada por ${[...v].join(", ")}`).join("\n");
    throw new Error(`${archivo}: dependencias sin incluir:\n${m}`);
  }
  const ordenadas = [...elegidas].sort((a, b) => (a.archivo === b.archivo ? a.linea - b.linea : fuentes.findIndex((f) => f.archivo === a.archivo) - fuentes.findIndex((f) => f.archivo === b.archivo)));
  const cuerpo = ordenadas.map((d) => `/* ${d.archivo}:${d.linea} */\n${d.texto}`).join("\n");
  const nombresExport = exportar ?? [...nombresIncluidos, ...[...provistos].filter((x) => x !== "XLSX")];
  const js = `// GENERADO por packages/clinical-rules/scripts/extraer-reglas.mjs a partir de «Gestión Clínica POSMÉDICA (1).html».
// NO EDITAR A MANO: cualquier cambio de regla se hace en el prototipo validado por la coordinación médica y se vuelve a extraer.
// Las referencias «archivo:línea» apuntan a los archivos de _analisis/.
${cabecera}
export function ${funcion}(ctx) {
"use strict";
${preludio}
${cuerpo}
return { ${nombresExport.join(", ")} };
}
`;
  INVENTARIO.push({ archivo, funcion, defs: ordenadas.map((d) => ({ nombres: d.nombres, origen: `${d.archivo}:${d.linea}`, tipo: /^\s*(async\s+)?function/.test(d.texto) || /=>|function/.test(d.texto.slice(0, 120)) ? "función" : "constante / catálogo" })) });
  mkdirSync(SALIDA, { recursive: true });
  writeFileSync(resolve(SALIDA, archivo), js);
  console.log(`${archivo}: ${elegidas.size} definiciones (${nombresIncluidos.size} nombres), ${(js.length / 1024).toFixed(0)} KB`);
}

/* ---------- fuentes ---------- */

const hdSec = seccion(P.lineas, ...MARCAS.hd);
const vihSec = seccion(P.lineas, ...MARCAS.vih);
const trozo = (s) => P.lineas.slice(s.desde, s.hasta).join("\n");
// Las líneas de _analisis/hemodialisis/hd.js empiezan en la línea 1 del script principal; las de vih.js en la del marcador.
const HD = { archivo: "hd.js", ...definiciones(trozo(hdSec), hdSec.desde, "hd.js") };
const VIH = { archivo: "vih.js", ...definiciones(trozo(vihSec), 0, "vih.js") };

/* Utilidades de fecha y número del prototipo (hd.js) que también usa VIH. */
const UTIL = ["esc", "pad", "iso", "fd", "ym", "addDays", "addMonths", "monthStart", "monthEnd", "dayDiff", "nowTs", "pdate", "num", "norm", "f1", "pct", "money"];

/* Reloj: el prototipo usa TODAY() (fecha local sin hora). Aquí sale de ctx.hoy. */
const PRELUDIO_HOY = `const __hoy = ctx && ctx.hoy ? new Date(ctx.hoy) : new Date();
const TODAY = () => new Date(__hoy.getFullYear(), __hoy.getMonth(), __hoy.getDate());
const XLSX = ctx && ctx.XLSX;`;

/* ---------- Hemodiálisis ---------- */
const HD_INCLUIR = [
  ...UTIL,
  // catálogos
  "EPS_L", "epsList", "TURNOS_DEF", "turnosCfg", "turnoNames", "DIAS_L", "ESTADOS_SES", "MOTIVOS", "MOT_RESP", "CAUSA_HOSP", "ATRIB", "TIPO_SES", "MOT_EXTRA", "RESP",
  "ACCESOS", "isCVC", "ITS", "EVENTOS", "SEV", "RESUELTO", "HEMOC", "NOV_TIPOS", "MOV_EGRESO", "MOV_TIPOS", "EGRESO_ESTADO", "RUTA", "RUTA_EXCL", "ACC_NOV", "ACC_NOV_RES",
  "TX", "PROCED", "MEDIOS", "RESULT_CTC", "DISCIPLINAS", "EXAMS", "EX", "FREQ_TXT", "ANCHOR_DEF", "META_DEF", "CFG_DEF", "MUN_DANE", "MEDS", "AEE",
  // libro (lectura de los libros existentes, para la migración)
  "SH", "BOOK_KEYS", "DATE_F", "NUM_F", "cacStart", "newBook", "readSheet", "fromRow", "isToolBook", "isDashboard", "parseToolBook",
  // índice y poblaciones
  "live", "IDX", "reindex", "ensureIdx", "nombre", "activeAt", "activeDays", "overlaps", "ageAt", "adult", "ninety", "epsOk", "turnoDias", "turnoJor", "absentOn", "progDays",
  "sesIn", "lastLab", "labsIn", "accessAt", "lastSes", "pacs", "popCut", "popPer", "popInc", "ctxFor",
  // métricas de sesión y fórmulas
  "gidStats", "taStats", "glucoStats", "ktvOnline", "fmtTA", "parseTA", "ktvDaugirdas", "metasDe", "ufCalc", "sesUF",
  // indicadores, semáforo, alertas, calidad del dato
  "pv", "propLab", "IND", "INDM", "progUpTo", "catDays", "evalInd", "statusOf", "STATUS_TXT", "fmtVal", "trendPoints", "semaforo", "alertas", "calidad",
  // facturación (solo administrador en la aplicación)
  "tarifaFor", "conciliar",
  // calendario de laboratorios y solicitud del mes
  "freqOf", "schedMonths", "susceptibleVHB", "examApplies", "examsForMonth", "labDue", "SOL_EST", "solRecs", "solPropuesta",
  // calidad de diálisis
  "CAL_DOM", "CAL_OPC", "calidadAuto", "calidadScore", "CAL_CLASS", "ultimaValoracion", "calidadDe",
  // estudios, vacunación VHB, trasplante, tener presente
  "EST_TIPOS", "EST_NOM", "estRelevantes", "estVencidos", "vacEsquemas", "vacMeses", "vacDoses", "labTxt", "vacStatus", "VAC_GRUPOS", "vacGrupo", "vacNextDefaults", "vacEtiqueta",
  "TX_EST", "txItems", "txState", "TX_EN_PROCESO", "tenerPresente",
  // reportes CAC (matrices)
  "CAC_H_FOMAG", "CAC_H_ERC", "CAC_SHEET_FOMAG", "CAC_SHEET_ERC", "D1800", "isoOr", "cacVals",
];

generar({
  archivo: "hd.js",
  funcion: "crearMotorHD",
  cabecera: "// Hemodiálisis: índice por paciente, indicadores CAC e institucionales, semáforo, alertas, calidad del dato y de diálisis,\n// calendario de laboratorios, vacunación VHB, trasplante, facturación y valores de la matriz CAC.",
  fuentes: [HD],
  incluir: HD_INCLUIR,
  preludio: `${PRELUDIO_HOY}
/* Estado que en el prototipo vivía en la pantalla. ctx.libro: el libro de hemodiálisis (mismas hojas y columnas). */
const ST = { book: ctx.libro, corte: ctx.corte ? new Date(ctx.corte) : TODAY(), ps: null, eps: ctx.eps || "", ui: {}, fin: { data: ctx.facturacion || null } };
ST.ps = ctx.inicioPeriodo ? new Date(ctx.inicioPeriodo) : cacStart(ST.corte); // cacStart es una declaración de función (se eleva)`,
  provistos: new Set(["ST", "TODAY", "XLSX"]),
});

/* ---------- VIH ---------- */
const VIH_INCLUIR = [
  "VX_CAC_COLS", "VXS", "VXK", "VX_EPS", "VX_EPSCODE_DEF", "VX_REG", "VX_MUN", "VX_MUN_ALIAS", "VX_PCLAVE", "VX_TINGR", "VX_ESTADO", "VX_MODAL", "VX_DISC", "VX_DISC_ACT",
  "VX_CITEST", "VX_CITTIPO", "VX_MOTINAS", "VX_NOV", "VX_PRC", "VX_PRF", "VX_EX", "VXE", "VX_CONTRATO_DEF", "VX_GUIA_DIF", "VX_MED", "VX_CLASES", "VX_ESQ", "VXQ",
  "VX_GPC_PREF", "VX_VAC", "VXV", "VX_VACEST",
  "vxLive", "vxD", "vxNom", "vxCorte", "vxMunCode", "vxMunName", "vxCfg", "vxNewBook", "vxEdad", "vxGrupoEtario", "vxF", "vxPct",
  "vxIdx", "vxPacs", "vxP", "vxL", "vxLast", "vxFirst", "vxVal", "vxPos", "vxCVind", "vxFmtLab", "vxPeriodo", "vxActivo", "vxTarAt", "vxTarIni", "vxUltEnt", "vxCobertura",
  "vxUltAtencion", "vxNovAt", "vxSt", "vxVacEstado", "vxVacCompleta", "vxContrato", "vxHSH", "vxSolRecs", "vxSolTieneRes", "vxAlertas", "vxTFG",
  // indicadores
  "VX_GPC14", "vxEnRango", "vxLabIn", "vxPrcIn", "vxPrfIn", "vxHospVIH", "vxFalla", "vxR", "vxUP", "vxSemRng", "VX_IND", "VXI", "vxRng", "vxNivel", "vxRngTxt", "vxFiltro", "vxPer",
  "vxCalc", "vxCalcBy",
  // agenda, adherencia, TAR, plan de laboratorios y procedimientos
  "VX_AGFREQ_DEF", "vxAgFreq", "vxCitProg", "vxAgEstado", "vxPuedeAgendar", "VX_SMAQ", "vxSmaqRes", "VX_TARCHK", "vxTarChkApl",
  "VX_FTXT", "vxLabPlan", "vxDue", "vxPPD", "vxCit", "vxPrcPend",
  // producción y reportes
  "VX_PAQ_DEF", "vxPaq", "vxFactMes", "vxProdMes", "vxDiscMes", "VX_NOM_COLS", "vxNominalRows", "vxNomRow", "vxNominalValidar", "vxCACRows", "vxCACRow", "vxPcCAC", "vxCACValidar",
  "VX_CAC_LBL", "vxCacCod", "vxCacNum", "vxCacLbl",
];

generar({
  archivo: "vih.js",
  funcion: "crearMotorVIH",
  cabecera: "// Programa VIH: estado del paciente al corte, alertas, carné de vacunas, contrato de laboratorios, indicadores CAC y Nueva EPS,\n// agenda por disciplina, adherencia (SMAQ), TAR, producción y filas de la cohorte nominal y del reporte CAC.",
  fuentes: [HD, VIH], // utilidades de hd.js primero: VIH las usa al definir sus constantes
  incluir: [...UTIL, ...VIH_INCLUIR],
  preludio: `${PRELUDIO_HOY}
/* Estado que en el prototipo vivía en la pantalla. ctx.libro: el libro del programa VIH (mismas hojas y columnas). */
const VX = { book: ctx.libro, ui: Object.assign({ tab: "tab" }, ctx.ui || {}), dirty: false, corte: ctx.corte ? new Date(ctx.corte) : null, demo: false, ver: 0, memo: {} };`,
  provistos: new Set(["VX", "TODAY", "XLSX"]),
});

/* ---------- Nefroprotección ---------- */
{
  const clinico = P.nefroScripts.find((s) => s.includes("MOTOR CLÍNICO (sin DOM)"));
  const cohorte = P.nefroScripts.find((s) => s.includes("MOTOR DE COHORTE"));
  if (!clinico || !cohorte) throw new Error("No se encontraron los motores de Nefroprotección.");
  const N1 = { archivo: "motor_clinico.js", ...definiciones(clinico, 0, "nefroproteccion/motor_clinico.js") };
  const N2 = { archivo: "motor_cohorte.js", ...definiciones(cohorte, 0, "nefroproteccion/motor_cohorte.js") };
  // Las sentencias que tocan window/localStorage (modelo por EPS guardado en el navegador) se omiten: el modelo llega en ctx.
  const omitidas = [...N1.otras, ...N2.otras].map((o) => `${o.linea}: ${o.texto}`);
  console.log("Nefro: sentencias omitidas (estado del navegador):\n  " + omitidas.join("\n  "));
  generar({
    archivo: "nefro.js",
    funcion: "crearMotorNefro",
    cabecera: "// Ruta de Nefroprotección v7.2: motor clínico (clasificación, metas, medicamentos, plan) y motor de cohorte (fichas e indicadores).",
    fuentes: [N1, N2],
    incluir: ["NP", "EPSMODEL_DEF", "COH"],
    preludio: `/* El modelo de atención por EPS vivía en window.EPSMODEL (y localStorage). Aquí llega en ctx.modeloEps. */
let __modelo = ctx && ctx.modeloEps ? JSON.parse(JSON.stringify(ctx.modeloEps)) : null;
const window = { get EPSMODEL() { return __modelo || (__modelo = JSON.parse(JSON.stringify(EPSMODEL_DEF))); } };
const XLSX = ctx && ctx.XLSX;`,
    provistos: new Set(["window", "XLSX"]),
    exportar: ["NP", "COH", "EPSMODEL_DEF", "window"],
  });
}

/* ---------- inventario de reglas (docs/REGLAS_CLINICAS.md) ---------- */
{
  const md = [
    "# Inventario de reglas clínicas extraídas",
    "",
    "> GENERADO por `packages/clinical-rules/scripts/extraer-reglas.mjs`. No editar a mano.",
    "> Cada definición se copió **textualmente** del prototipo «Gestión Clínica POSMÉDICA (1).html». La columna *Origen* apunta a `_analisis/`.",
    "> Equivalencia verificada en `packages/clinical-rules/test/` (prototipo original frente al módulo extraído, con las cohortes ficticias del propio prototipo).",
    "> Descripción clínica de cada regla: `docs/ANALISIS.md` §4.",
    "",
  ];
  for (const m of INVENTARIO) {
    md.push(`## ${m.archivo.replace(".js", "").toUpperCase()} · \`${m.funcion}(ctx)\` (${m.defs.length} definiciones)`, "", "| Definición | Tipo | Origen |", "|---|---|---|");
    for (const d of m.defs) md.push(`| \`${d.nombres.join(", ")}\` | ${d.tipo} | \`${d.origen}\` |`);
    md.push("");
  }
  const destino = process.env.SALIDA_REGLAS ? resolve(SALIDA, "REGLAS_CLINICAS.md") : resolve(aqui, "../../../docs/REGLAS_CLINICAS.md");
  writeFileSync(destino, md.join("\n") + "\n");
  console.log("Inventario: " + destino);
}
