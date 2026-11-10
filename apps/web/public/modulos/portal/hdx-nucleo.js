// Código propio del proyecto. Hemodiálisis · núcleo HDX y 17 indicadores CAC (v3.1).

window.HDX_BASE = null; /* Sin datos embebidos: los Dashboards se importan a la base de datos */
/* =====================================================================================================
   SIGC POSMÉDICA v3.1 · HDX en página · base real estricta + motor de los 17 indicadores CAC de HD
   - La base embebida sale únicamente de los Dashboards mensuales (mayo a noviembre de 2026).
   - Ningún laboratorio, sesión, prescripción, serología o valoración se genera aquí.
   - Los indicadores se calculan del libro que esté cargado: la base embebida, un Dashboard sumado o el Libro HD.
   ===================================================================================================== */
(function(){
"use strict";
const HX = window.HX = { n90: false, thr: 80, ver: "3.1" };
const U = HDX.util;

/* ---------- columnas nuevas del libro (se conservan al descargar y volver a cargar el Libro HD) ---------- */
function addCols(k, cols){ const arr = SH[k][1]; cols.forEach(c => { if(!arr.includes(c)){ const i = arr.indexOf("Usuario"); arr.splice(i < 0 ? arr.length : i, 0, c); } }); }
addCols("pac", ["Comorbilidades","ERCEtapa","TxEtapaRaw","ProgMes","InicioHD","ModalidadPrevia","PrimerRegistro","MesesMaestro","MesesRegistro","IdHist","AccesoHist","EstadoFuente","EstadoOrigen","VHBEstadoRaw"]);
addCols("nov", ["TipoRaw","EstadoRaw","NotasN","NombreFuente"]);
addCols("evt", ["NombreFuente"]);
addCols("mov", ["Origen"]);
["PrimerRegistro","InicioHD"].forEach(f => DATE_F.add(f));
["ProgMes","ERCEtapa","NotasN"].forEach(f => NUM_F.add(f));

function hydrate(b){ Object.keys(b).forEach(k => { if(!Array.isArray(b[k])) return; b[k].forEach(r => { for(const f in r){ if(DATE_F.has(f) && typeof r[f] === "string") r[f] = pdate(r[f]); } }); }); }
HX.hydrate = hydrate;
HX.meta = () => (ST.book && ST.book.cfgv && ST.book.cfgv.hdx) || null;
const mesTxt = U.mesTxt;

/* ---------- carga de la base embebida ---------- */
function hdxLoadBase(silent){
  try {
    const x = HDX.expand(window.HDX_BASE); const b = newBook();
    ["pac","lab","ses","evt","nov","mov","vac"].forEach(k => { b[k] = x[k]; });
    b.cfgv.hdx = x.hdx; hydrate(b);
    const tar = (x.hdx.tarifas || []).map(t => Object.assign({}, t)); tar.forEach(t => { if(t.min != null) b.cfgv.minSes[t.eps] = t.min; });
    const fu = x.hdx.fuentes || []; const lastF = fu[fu.length - 1] || {};
    const lastDay = pdate(lastF.hasta) || TODAY();
    b.log.push({ FechaHora: nowTs(), Usuario: "Lectura de Dashboards", Accion: "CARGA_BASE", Hoja: "Todo", Registro: fu.map(f => f.archivo).join(" + "), Detalle: b.pac.length + " pacientes, " + b.ses.length + " sesiones marcadas, " + b.lab.length + " resultados de laboratorio, " + b.evt.length + " complicaciones. Sin datos generados." });
    ST.book = b; ST.demo = false; ST.dirty = false;
    ST.imp = { tarifas: tar, warn: (x.hdx.warn || []).slice(), fn: "Dashboards de " + (fu.length ? mesTxt(fu[0].mes) + " a " + mesTxt(lastF.mes) : "la unidad"), mes: lastF.mes || ym(TODAY()) };
    const t = TODAY(); ST.corte = t >= lastDay ? t : lastDay; ST.ps = new Date(ST.corte.getFullYear(), 0, 1);
    ST.fin = { key: "UNLOCKED_DIRECT", data: { tarifas: tar, facturado: {}, creado: nowTs(), por: "Hoja 16.FACTURACION del Dashboard" } };
    ST.ui = { tdate: iso(lastDay), tturno: "" };
    IDX.dirty = true; reindex();
    const act = b.pac.filter(p => activeAt(p, ST.corte)).length;
    ST.src = "Base real POSMÉDICA · " + ST.imp.fn + " (" + act + " activos · " + b.ses.length + " sesiones marcadas · sin datos generados)";
    hxSiis();
    try { syncBar(); bookInfo(); } catch(e){}
    if(!silent) toast("Base real de hemodiálisis cargada: " + act + " activos al corte.");
  } catch(e){ console.error("hdxLoadBase", e); }
}
window.hdxLoadBase = hdxLoadBase;

/* Códigos SIIS: solo equivalencias directas con la categoría del Dashboard. Lo ambiguo queda sin código. */
const SIIS_EQ = { "Hipotensión intradialítica": "4", "Hipertensión intradialítica": "17", "Calambres musculares": "85", "Cefalea": "14", "Náuseas / vómitos": "2" };
function hxSiis(){
  if(typeof V30 === "undefined" || typeof SIIS_ACTIVIDADES_HD === "undefined" || !ST.book) return;
  V30.siisActs = []; let n = 0;
  ST.book.evt.filter(live).forEach(e => { const no = SIIS_EQ[e.Tipo]; if(!no) return; const def = SIIS_ACTIVIDADES_HD.find(a => a.no === no); const p = IDX.pac.get(e.Paciente); if(!def) return;
    V30.siisActs.push({ id: "SIIS-" + String(++n).padStart(4, "0"), no: def.no, act: def.act, tipo: def.tipo, cat: def.cat, prot: def.prot, fecha: iso(e.Fecha), pid: p ? p.ID : "", pacNom: p ? nombre(p) : (e.NombreFuente || "Sin identificar"), eps: p ? (p.EPS || "") : "", turno: p ? (p.Turno || "") : "", silla: p ? (p.Puesto || "") : "", sev: e.Severidad || "", nota: e.Tipo + (e.Conducta ? " — Conducta: " + e.Conducta : "") + " · Código asignado por equivalencia con la categoría del Dashboard", estado: e.Resuelto === "Sí" ? "Cerrado" : "En seguimiento", usuario: e.Usuario || "" }); });
}
HX.siis = hxSiis;

/* ---------- ajustes al índice: inicio por primer registro y acceso vascular por mes ---------- */
const reindex0 = reindex;
reindex = function(){
  reindex0();
  IDX.pac.forEach(p => {
    if(p.PrimerRegistro && !p.IngresoUnidad && !p.InicioTRR){
      const end = p.Estado && p.Estado !== "Activo" ? (p.FechaEstado || null) : null;
      if(!p._iv.length) p._iv = [[p.PrimerRegistro, end]]; else if(p._iv[0][0] > p.PrimerRegistro) p._iv[0][0] = p.PrimerRegistro;
      p._noStart = false; p._startInf = true;
    }
    /* cambio de modalidad DP→HD dentro de la unidad: la cohorte de HD empieza en el inicio de HD */
    if(p.InicioHD && p._iv.length && p._iv[0][0] < p.InicioHD) p._iv[0][0] = p.InicioHD;
    p._accH = HDX.getHist(p, "AccesoHist"); p._accK = Object.keys(p._accH).sort();
  });
};
const accessAt0 = accessAt;
accessAt = function(p, d){
  const K = p._accK || []; if(!K.length) return accessAt0(p, d);
  const m = ym(d); let k = null; for(const x of K){ if(x <= m) k = x; else break; }
  let s = null; for(let i = p._ses.length - 1; i >= 0; i--){ const z = p._ses[i]; if(z.Fecha <= d && z.Acceso && z.Estado === "Realizada"){ s = z; break; } }
  if(p.AccesoActual && p.AccesoDesde && p.AccesoDesde <= d && (!k || ym(p.AccesoDesde) > k) && (!s || p.AccesoDesde >= s.Fecha)) return p.AccesoActual;
  if(s && (!k || ym(s.Fecha) > k)) return s.Acceso;
  return k ? p._accH[k] : null;
};

/* ---------- poblaciones ---------- */
const base = x => pacs().filter(p => (!x.eps || p.EPS === x.eps) && activeAt(p, x.c) && adult(p, x.c) && (!HX.n90 || ninety(p, x.c)));
const per = x => pacs().filter(p => (!x.eps || p.EPS === x.eps) && overlaps(p, x.ps, x.c) && adult(p, x.c));
const inc = x => pacs().filter(p => (!x.eps || p.EPS === x.eps) && p.InicioTRR && p.InicioTRR >= x.ps && p.InicioTRR <= x.c && adult(p, p.InicioTRR) && overlaps(p, x.ps, x.c));
HX.pop = { base, per, inc };
const lastMonthWith = k => { let mx = null; ST.book.lab.forEach(l => { if(live(l) && l.Examen === k && l.FechaToma && (!mx || l.FechaToma > mx)) mx = l.FechaToma; }); return mx; };
HX.lastMonthWith = lastMonthWith;
const EXL = { KtV: "Kt/V", Hb: "hemoglobina", Alb: "albúmina", P: "fósforo", PTH: "PTH", Ca: "calcio" };
function noWin(r, k, from, c){ if(r.den.length && r.sd.length === r.den.length){ const m = lastMonthWith(k); r.ne = "Ningún paciente tiene " + EXL[k] + " dentro de la ventana (" + fd(addDays(from, 1)) + " a " + fd(c) + ")." + (m ? " Último mes con dato: " + mesTxt(ym(m)) + "." : " La base no tiene este examen."); } return r; }
function propLabX(x, k, win, test, fmt){ const r = { num: [], den: [], excl: [], sd: [] }; const from = win === "sem" ? x.sem : x.tri;
  base(x).forEach(p => { const l = lastLab(p, k, from, x.c); const v = l ? num(l.Valor) : null; r.den.push(pv(p, v == null ? "sin dato en la ventana" : (fmt ? fmt(v) : v) + " · " + mesTxt(ym(l.FechaToma)))); if(v == null) r.sd.push(p); else if(test(v)) r.num.push(pv(p, v)); });
  return noWin(r, k, from, x.c); }

/* meses en que la fuente sí registró novedades o complicaciones (para no diluir tasas con meses sin registro) */
function obsSegs(x, campo){ const hx = HX.meta(); if(!hx || !hx.fuentes || !hx.fuentes.length) return [[x.ps, x.c]];
  const segs = []; hx.fuentes.forEach(f => { if(!(f[campo] > 0)) return; const a = pdate(f.mes + "-01"); let b = monthEnd(a); const last = hx.fuentes[hx.fuentes.length - 1] === f; if(last && f.hasta && pdate(f.hasta) < b) b = pdate(f.hasta); const s = a < x.ps ? x.ps : a, e = b > x.c ? x.c : b; if(e >= s) segs.push([s, e]); });
  /* registros hechos en la aplicación después del último archivo también cuentan */
  const lf = hx.fuentes[hx.fuentes.length - 1]; const after = lf && lf.hasta ? addDays(pdate(lf.hasta), 1) : null; if(after && after <= x.c && ST.book.log.some(l => l.Accion === "CREA")) segs.push([after < x.ps ? x.ps : after, x.c]);
  return segs; }
const inSegs = (d, S) => S.some(([a, b]) => d >= a && d <= b);
const segTxt = S => S.length ? S.map(([a, b]) => fd(a) + " a " + fd(b)).join("; ") : "ningún mes";
HX.obsSegs = obsSegs;

/* ---------- los 17 indicadores (definición operativa: fichas resumidas CAC 2026 que entregó la coordinación) ---------- */
const F = {
 dia_10_adul: x => { const r = { num: [], den: [], excl: [], sd: [] }; base(x).forEach(p => { if(RUTA_EXCL.includes(p.RutaAcceso) && p.SoporteRuta){ r.excl.push({ p, why: p.RutaAcceso + " · " + p.SoporteRuta }); return; } const a = accessAt(p, x.c); r.den.push(pv(p, a || "sin dato")); if(!a) r.sd.push(p); else if(isCVC(a)) r.num.push(pv(p, a)); }); return r; },
 dia_11_adul: x => propLabX(x, "KtV", "tri", v => v >= 1.2, v => f1(v, 2)),
 dia_13_adul: x => propLabX(x, "Hb", "tri", v => v >= 10),
 dia_15_adul: x => propLabX(x, "Alb", "tri", v => v >= 4, v => f1(v, 2)),
 dia_17_adul: x => propLabX(x, "P", "tri", v => v >= 2.5 && v <= 6),
 dia_20_adul: x => { const r = { num: [], den: [], excl: [], sd: [] }; let conDur = 0;
   base(x).forEach(p => { const sw = num(p.SesSemana); if(sw != null && sw < 3){ r.excl.push({ p, why: "Prescripción menor de 3 sesiones por semana" }); return; } const S = sesIn(p, addDays(x.mes, 1), x.c, "Realizada"); const D = S.filter(s => num(s.DuracionMin) != null); if(!D.length){ r.den.push(pv(p, S.length ? S.length + " sesiones sin duración registrada" : "sin sesiones en el mes")); r.sd.push(p); return; } conDur++; const m = D.reduce((a, s) => a + num(s.DuracionMin), 0) / D.length; r.den.push(pv(p, f1(m, 0) + " min (" + D.length + " ses.)")); if(m >= 240) r.num.push(pv(p, m)); });
   if(r.den.length && !conDur) r.ne = "El Dashboard registra la asistencia con una marca (1) por día; no trae la duración efectiva de la sesión. Tampoco registra las sesiones prescritas por semana.";
   return r; },
 dia_21_adul: x => { const r = { num: [], den: [], excl: [], sd: [] }; let nc = 0, ncNum = 0;
   per(x).forEach(p => { const t = p.TxEstado || "Sin evaluar"; if(["Disentimiento","Cuidados paliativos","No idóneo (contraindicación con soporte)"].includes(t)){ r.excl.push({ p, why: t }); return; }
     const raw = p.TxEtapaRaw || ""; const isNC = /NO CANDIDATO/i.test(raw); if(isNC) nc++;
     r.den.push(pv(p, t === "Sin evaluar" ? (raw ? "«" + raw + "» en el Dashboard, sin concepto de idoneidad con soporte" : "Sin evaluar") : t + (raw && raw !== t ? " («" + raw + "»)" : ""))); if(t === "Sin evaluar") r.sd.push(p); if(t === "En lista de espera" || t === "Trasplantado") r.num.push(pv(p, t)); });
   r.noComp = true;
   if(nc){ const d2 = r.den.length - nc; r.alt = "Si los " + nc + " marcados «No candidato» en el Dashboard se excluyeran (hoy no tienen soporte especializado registrado), el resultado sería " + r.num.length + " de " + d2 + " (" + (d2 ? pct(r.num.length / d2) : "—") + ")."; }
   return r; },
 dia_23_adul: x => { const r = { num: [], den: [], excl: [], sd: [] }; let inf = 0;
   per(x).forEach(p => { const m = p._mov.find(m => m.Tipo === "Abandono" && m.Fecha >= x.ps && m.Fecha <= x.c); const u = p._mov.find(m => m.Origen === "HDX" && m.Fecha >= addDays(x.ps, -1) && m.Fecha < x.c); if(u && !m){ inf++; r.sd.push(p); } r.den.push(pv(p, m ? "Abandono " + fd(m.Fecha) : u ? "Egreso sin causa registrada (último registro: " + mesTxt(ym(u.Fecha)) + ")" : "")); if(m) r.num.push(pv(p, m.Detalle || "")); });
   r.noComp = true;
   if(inf) r.prelim = inf + " egresos del periodo no tienen causa registrada (el maestro solo deja de listarlos). No se puede afirmar ni descartar abandono hasta clasificarlos: fallecimiento, traslado, trasplante, cambio de modalidad o abandono con desistimiento o búsqueda activa documentada.";
   return r; },
 dia_25_adul: x => { const r = { num: [], den: [], excl: [], sd: [] }; let con = 0;
   per(x).forEach(p => { const l = lastLab(p, "CVVHC", null, x.c); const tam = lastLab(p, "AntiVHC", null, x.c); if(l || tam) con++; r.den.push(pv(p, l ? "Carga viral " + l.Valor : (tam ? "Anti-VHC " + tam.Valor + ", sin carga viral" : "sin tamizaje registrado"))); if(!l && !tam) r.sd.push(p); if(l && /^detect/i.test(l.Valor)) r.num.push(pv(p, "Detectable")); });
   if(r.den.length && !con) r.ne = "La base no tiene anti-VHC ni carga viral de VHC de ningún paciente. El Dashboard no captura estas variables.";
   return r; },
 dia_26_adul: x => { const r = { num: [], den: [], excl: [], sd: [] };
   inc(x).forEach(p => { if(p.VHBNoRespondedor === "SI"){ r.excl.push({ p, why: "No respondedor (requiere soporte)" }); return; } const lim = addDays(p.InicioTRR, 30); const l = lastLab(p, "AntiHBs", null, lim); const any = lastLab(p, "AntiHBs", null, x.c); const v = l ? num(l.Valor) : null;
     r.den.push(pv(p, v != null ? f1(v, 1) + " mUI/mL · " + fd(l.FechaToma) + " · inicio " + fd(p.InicioTRR) : any ? "sin anti-HBs hasta 30 días después del inicio (" + fd(p.InicioTRR) + "); hay uno posterior: " + f1(num(any.Valor), 1) + " del " + fd(any.FechaToma) : "sin anti-HBs registrado · inicio " + fd(p.InicioTRR))); if(v == null) r.sd.push(p); else if(v >= 10) r.num.push(pv(p, v)); });
   return r; },
 dia_27_adul: x => { const r = { num: [], den: [], excl: [], sd: [] };
   base(x).forEach(p => { if(p.Paratiroidectomia === "SI"){ r.excl.push({ p, why: "Paratiroidectomía registrada" }); return; } const l = lastLab(p, "PTH", x.sem, x.c); const v = l ? num(l.Valor) : null; r.den.push(pv(p, v == null ? "sin dato en la ventana" : l.Valor + " · " + mesTxt(ym(l.FechaToma)))); if(v == null) r.sd.push(p); else if(v >= 130 && v <= 600) r.num.push(pv(p, v)); });
   return noWin(r, "PTH", x.sem, x.c); },
 dia_29_adul: x => { const r = { num: [], den: [], excl: [], sd: [] };
   base(x).forEach(p => { const L = labsIn(p, "Ca", x.tri, x.c).map(l => num(l.Valor)).filter(v => v != null); if(!L.length){ r.den.push(pv(p, "sin dato en la ventana")); r.sd.push(p); return; } const m = L.reduce((a, b) => a + b, 0) / L.length; r.den.push(pv(p, f1(m, 2) + " mg/dL (" + L.length + (L.length === 1 ? " medición" : " mediciones") + ")")); if(m > 10.5) r.num.push(pv(p, m)); });
   return noWin(r, "Ca", x.tri, x.c); },
 dia_31_adul: x => { const S = obsSegs(x, "novedades"); let ev = 0, days = 0; const list = [];
   per(x).forEach(p => { S.forEach(([a, b]) => { days += activeDays(p, a, b); }); p._nov.filter(n => n.Tipo === "Hospitalización" && n.Inicio >= x.ps && n.Inicio <= x.c && inSegs(n.Inicio, S)).forEach(n => { ev++; list.push(pv(p, fd(n.Inicio) + (n.Fin && n.Fin > n.Inicio ? " a " + fd(n.Fin) : "") + " · " + (n.Descripcion || ""))); }); });
   const meses = days / 30.4375; const r = { ev, exp: meses, val: meses ? ev / meses : null, list, expl: ev + " episodios / " + f1(meses, 1) + " meses-persona" + (meses ? " · equivale a " + f1(ev / meses * 12, 2) + " por persona-año (meses-persona ÷ 12)" : "") };
   const hx = HX.meta(); if(hx) r.prelim = "La fuente trae notas diarias de novedad, sin fecha de ingreso ni de egreso: los episodios se arman uniendo notas del mismo paciente separadas por " + (hx.gapHosp || 14) + " días o menos (regla institucional, no de la CAC) y no se puede verificar la estancia mayor de 24 horas. Exposición contada solo en los meses con registro de novedades: " + segTxt(S) + ".";
   return r; },
 dia_33_adul: x => { const B = ST.book; if((B.dsp || []).filter(live).length && typeof v6Its === "function") return v6Its(x, true);
   const S = obsSegs(x, "eventos"); let ev = 0, days = 0; const list = []; let sus = 0;
   per(x).forEach(p => { S.forEach(([a, b]) => { for(let d = new Date(a); d <= b; d = addDays(d, 1)){ if(activeAt(p, d) && isCVC(accessAt(p, d))) days++; } });
     p._evt.filter(e => e.Fecha >= x.ps && e.Fecha <= x.c && (e.Tipo === ITS || /sitio de salida|túnel/i.test(e.Tipo))).forEach(e => { const conf = e.Tipo === ITS && e.Hemocultivo === "Positivo"; if(conf) ev++; else sus++; list.push(pv(p, fd(e.Fecha) + " · " + e.Tipo + (conf ? " · confirmada" : " · sin confirmación microbiológica (no cuenta)"))); });
     p._nov.filter(n => n.Causa === "NOTA" && n.Inicio >= x.ps && n.Inicio <= x.c && /INFECC|BACTER/i.test(n.Descripcion || "")).forEach(n => { sus++; list.push(pv(p, fd(n.Inicio) + " · nota de novedad: " + n.Descripcion + " (sospecha, no cuenta)")); }); });
   const r = { ev, exp: days, val: null, list, expl: ev + " confirmadas · " + sus + " sospechas o infecciones locales · " + f1(days, 0) + " días-catéter estimados en los meses con registro de complicaciones" };
   r.ne = "La fuente no registra hemocultivos ni fechas de inserción y retiro de cada catéter. Sin eso no hay episodios confirmados que contar ni días-catéter exactos: un cero aquí no significa ausencia de infecciones. Los días-catéter mostrados son una estimación (pacientes con catéter por los días activos de " + segTxt(S) + ").";
   return r; },
 dia_34_adul: x => { const r = { num: [], den: [], excl: [], sd: [] }; let con = 0;
   inc(x).forEach(p => { const a = ageAt(p, p.InicioTRR); if(a != null && a >= 80){ r.excl.push({ p, why: "80 años o más al inicio" }); return; } const k = (p._accK || [])[0]; const first = k ? p._accH[k] : null; const lag = k ? Math.max(0, (pdate(k + "-01").getFullYear() - p.InicioTRR.getFullYear()) * 12 + pdate(k + "-01").getMonth() - p.InicioTRR.getMonth()) : null;
     if(p.AccesoInicial) con++; r.den.push(pv(p, p.AccesoInicial ? p.AccesoInicial : "acceso al inicio sin registrar" + (first ? " · primer acceso conocido: " + first + " (" + mesTxt(k) + (lag ? ", " + lag + " meses después del inicio" : ", mes del inicio") + ")" : ""))); if(!p.AccesoInicial) r.sd.push(p); else if(p.AccesoInicial === "FAV") r.num.push(pv(p, "FAV")); });
   if(r.den.length && !con) r.ne = "El Dashboard no registra el acceso con el que se inició la hemodiálisis (solo el acceso actual de cada mes), ni la madurez de la FAV. Además la ficha publicada describe igual el numerador y el denominador: la definición operativa debe validarse con la CAC antes de reportar.";
   return r; },
 dia_35_adul: x => { const r = { num: [], den: [], excl: [], sd: [] }; inc(x).forEach(p => { const l = lastLab(p, "EscalaCV", addDays(p.InicioTRR, -31), addDays(p.InicioTRR, 90)); r.den.push(pv(p, l ? (l.Metodo || "escala") + " " + fd(l.FechaToma) : "sin escala registrada")); if(l) r.num.push(pv(p, l.Valor)); else r.sd.push(p); }); if(r.den.length && !ST.book.lab.some(l => l.Examen === "EscalaCV" && live(l))) r.ne = "La base no tiene ninguna escala de calidad de vida registrada. El Dashboard no captura esta variable; no se puede distinguir «no evaluado» de «evaluado y no registrado»."; return r; },
 dia_36_adul: x => { const r = { num: [], den: [], excl: [], sd: [] }; per(x).forEach(p => { const l = lastLab(p, "EscalaCV", addDays(x.ps, -1), x.c); r.den.push(pv(p, l ? (l.Metodo || "escala") + " " + fd(l.FechaToma) : "sin escala registrada")); if(l) r.num.push(pv(p, l.Valor)); else r.sd.push(p); }); if(r.den.length && !ST.book.lab.some(l => l.Examen === "EscalaCV" && live(l))) r.ne = "La base no tiene ninguna escala de calidad de vida registrada. El Dashboard no captura esta variable; no se puede distinguir «no evaluado» de «evaluado y no registrado»."; return r; }
};
/* textos de ficha que cambian frente a la versión anterior */
const TXT = {
 dia_10_adul: { win: "Al cierre", src: "Acceso vascular del mes en el maestro del Dashboard (o el registrado en la aplicación)", ex: "Imposibilidad de FAV con concepto, negativa documentada o cuidados paliativos: solo si el soporte está registrado en Acceso vascular." },
 dia_11_adul: { n: "Adultos en HD con Kt/V ≥ 1,2", win: "Último Kt/V de los 3 meses previos al cierre", src: "Paraclínicos · Kt/V (el Dashboard no dice si es spKt/V, eKt/V o total)", nota: "El Dashboard trae un solo valor de Kt/V por mes sin tipo ni método. Se compara tal cual contra 1,2; no se convierte ni se suma función renal residual. La ventana de 3 meses es regla del módulo: la ficha resumida no fija cómo elegir entre varias mediciones." },
 dia_13_adul: { win: "Último valor del trimestre previo al cierre" }, dia_15_adul: { win: "Último valor del trimestre previo al cierre" }, dia_17_adul: { win: "Último valor del trimestre previo al cierre" },
 dia_20_adul: { n: "Adultos en HD con tiempo dialítico de 4 horas o más", win: "Promedio de las sesiones del último mes", src: "Sesiones realizadas con duración efectiva registrada" },
 dia_21_adul: { win: "Periodo", src: "Etapa de trasplante del maestro", nota: "Regla institucional D5: quien no tiene concepto de idoneidad con soporte permanece en el denominador. «No candidato» en el Dashboard no es soporte especializado." },
 dia_23_adul: { win: "Periodo", src: "Movimientos de egreso con causa" },
 dia_25_adul: { win: "Periodo", src: "Paraclínicos · carga viral de VHC" },
 dia_26_adul: { n: "Adultos que inician HD con anti-HBs ≥ 10 mUI/mL", win: "Incidentes del periodo", src: "Anti-HBs de la hoja de vacunación", ex: "No respondedores, solo con soporte documental.", nota: "Regla del módulo (la ficha resumida no la fija): se toma el último anti-HBs disponible hasta 30 días después del inicio de diálisis. La columna «No respondedor» del Dashboard se calcula solo con anti-HBs < 10 y aparece incluso en pacientes sin vacunar; por eso no se usa como exclusión." },
 dia_27_adul: { win: "Último valor de los 6 meses previos al cierre", ex: "Paratiroidectomía realizada o programada; tratamiento antineoplásico. Solo si está registrado." },
 dia_29_adul: { n: "Adultos en HD con hipercalcemia (calcio > 10,5 mg/dL)", win: "Promedio del trimestre previo al cierre, calcio total no corregido" },
 dia_31_adul: { n: "Hospitalizaciones por todas las causas en HD", unit: "por mes-persona", win: "Periodo · meses-persona de exposición", src: "Novedades de hospitalización" },
 dia_33_adul: { win: "Periodo · días-catéter", src: "Complicaciones con hemocultivo positivo · registro de catéteres" },
 dia_34_adul: { n: "Adultos que inician HD con FAV madura", win: "Incidentes del periodo menores de 80 años", src: "Acceso al inicio de HD", nota: "La ficha publicada describe numerador y denominador con el mismo texto. No reportar sin validar la definición con la CAC." },
 dia_35_adul: { n: "Incidentes evaluados con escala de calidad de vida", win: "Del inicio a 90 días", nota: "Indicador conjunto de HD y DP en la ficha. Aquí se muestra solo el subgrupo de HD, como análisis complementario." },
 dia_36_adul: { n: "Prevalentes evaluados con escala de calidad de vida", win: "Periodo", nota: "Indicador conjunto de HD y DP en la ficha. Aquí se muestra solo el subgrupo de HD, como análisis complementario." }
};
IND.forEach(d => { if(F[d.c]){ d.f = F[d.c]; Object.assign(d, TXT[d.c] || {}); } });
HX.CAC = () => IND.filter(d => !d.inst && F[d.c]);

/* ---------- evaluación: completitud y estados que no son «cumple / no cumple» ---------- */
const evalInd0 = evalInd;
evalInd = function(def, x){
  const r = evalInd0(def, x); if(def.inst || !F[def.c]) return r;
  const nsd = r.sd ? new Set(r.sd).size : 0;
  r.comp = def.t === "pct" && r.d && !r.noComp ? (r.d - nsd) / r.d : null;
  r.vCon = def.t === "pct" && r.d && nsd && (r.d - nsd) > 0 && !r.noComp && def.c !== "dia_25_adul" ? r.n / (r.d - nsd) : null;
  if(def.t === "pct" && r.d && !r.noComp && nsd === r.d && !r.ne) r.ne = "Ningún paciente del denominador tiene el dato a este corte.";
  if(def.t === "pct" && !r.d){ r.status = "nc"; r.val = null; }
  else if(r.ne){ r.status = "ne"; r.val = null; }
  else if(r.prelim) r.status = "pre";
  else if(r.comp != null && r.comp * 100 < HX.thr) r.status = "inc";
  return r;
};
Object.assign(STATUS_TXT, { ne: "No evaluable", pre: "Preliminar", inc: "Completitud insuficiente", nc: "No calculable" });
const fmtVal0 = fmtVal;
fmtVal = function(def, v){ if(v != null && def.c === "dia_31_adul") return f1(v, 3); return fmtVal0(def, v); };

/* Los datos de demostración del motor v3.0 (eventos SIIS y oxígeno ficticios) no se siembran sobre la base real */
HX.isReal = () => !!(ST.book && !ST.demo);
})();

/* Compatibilidad con las vistas de v3.0 que leían REAL_HD_DATA: ahora salen del libro cargado */
window.REAL_HD_DATA = {
  fuente: "Dashboards mensuales · Unidad Renal POSMÉDICA Mocoa",
  get novelties(){ try { const hx = (ST.book && ST.book.cfgv.hdx) || {}; const lf = (hx.fuentes || []).slice(-1)[0]; const m = lf ? lf.mes : ym(ST.corte); return ST.book.nov.filter(n => n.Causa === "NOTA" && n.Inicio && ym(n.Inicio) === m).map(n => { const p = IDX.pac.get(n.Paciente); return { Fecha: iso(n.Inicio), Paciente: n.Paciente || "—", PacNombre: p ? nombre(p) : (n.NombreFuente || ""), Tipo: /HOSPITAL/i.test(n.TipoRaw || "") ? "Hospitalización" : "Otra novedad", TipoRaw: n.TipoRaw || "", Descripcion: n.Descripcion || "", Responsable: n.Usuario || "", Estado: n.EstadoRaw || "", Fin: null }; }); } catch(e){ return []; } },
  get retiredIds(){ try { return ((ST.book && ST.book.cfgv.hdx && ST.book.cfgv.hdx.retirados) || []).map(r => ({ id: r.id, estado: r.estado || "", paciente: r.paciente || "—", motivo: r.motivo || "" })); } catch(e){ return []; } },
  get tarifas(){ try { return (ST.book.cfgv.hdx.tarifas || []); } catch(e){ return []; } },
  patients: [], labs: [], vacs: [], sessions: [], events: []
};


