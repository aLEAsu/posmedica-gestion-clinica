// Código propio del proyecto. Hemodiálisis · vistas de caracterización y tablero CAC 2026 (v3.1).

/* =====================================================================================================
   SIGC POSMÉDICA v3.1 · HDX vistas
   Eje 02 · Caracterización epidemiológica de la cohorte (incidentes, prevalentes, HTA, DM, TMO, anemia)
   Eje 06 · Tablero CAC 2026 de hemodiálisis: 17 indicadores, por EPS, pacientes a intervenir, fichas e informe
   ===================================================================================================== */
(function(){
"use strict";
if(typeof V12 === "undefined" || !V12.map || !V12.map.hd) return;
const U = HDX.util, mesTxt = U.mesTxt;
const M3 = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
const VIEW_EPI = "hd_epi", VIEW_CAC = "hd_cac17";
if(!V12.map.hd.e2.some(s => s[0] === VIEW_EPI)) V12.map.hd.e2.splice(1, 0, [VIEW_EPI, "Caracterización Epidemiológica: Incidentes, Prevalentes y Comorbilidad"]);
if(!V12.map.hd.e6.some(s => s[0] === VIEW_CAC)) V12.map.hd.e6.unshift([VIEW_CAC, "Tablero CAC 2026 · 17 Indicadores de HD (cálculo auditado)"]);
const UI = HX.ui = { tab: "tab", sel: "dia_10_adul", epiTab: "res" };

/* ---------- utilidades de vista ---------- */
const pc = (n, d) => d ? f1(n / d * 100, 1) + " %" : "—";
const nd = (n, d) => n + " de " + d;
const median = a => { if(!a.length) return null; const s = a.slice().sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
const ST_CLS = { alto: "ok", medio: "warn", bajo: "bad", base: "base", ne: "na", nc: "na", pre: "info", inc: "warn", na: "na" };
const chip = (s, t) => '<span class="st ' + (ST_CLS[s] || s) + '">' + esc(t || STATUS_TXT[s] || s) + '</span>';
function hbars(rows, tot, unit){ /* una sola serie: barras horizontales en el tono de acento, valor a la derecha */
  const mx = Math.max(1, ...rows.map(r => r.n));
  return '<div class="hx-bars" role="list">' + rows.map(r => '<div class="hx-bar" role="listitem" title="' + esc(r.l) + ': ' + r.n + (tot ? ' de ' + tot + ' (' + pc(r.n, tot) + ')' : '') + '"><span class="hx-bl">' + esc(r.l) + '</span><span class="hx-bt"><span style="width:' + (r.n / mx * 100).toFixed(1) + '%"></span></span><span class="hx-bv">' + r.n + (tot ? ' <small>' + pc(r.n, tot) + '</small>' : (unit ? ' <small>' + unit + '</small>' : '')) + '</span></div>').join("") + '</div>';
}
function cutMonths(){ const hx = HX.meta(); const t = TODAY(); let a = hx && hx.fuentes && hx.fuentes.length ? pdate(hx.fuentes[0].mes + "-01") : addMonths(monthStart(t), -6); const out = []; for(let d = new Date(a); d < monthStart(t); d = addMonths(d, 1)) out.push(monthEnd(d)); return out.slice(-12); }
function lastLabMonth(){ let mx = null; ["Hb","P","KtV","Alb","Ca"].forEach(k => { const m = HX.lastMonthWith(k); if(m && (!mx || m > mx)) mx = m; }); return mx; }
function ctlBar(){
  const c = ST.corte, t = TODAY(); const cm = cutMonths();
  const isT = iso(c) === iso(t);
  const y0 = new Date(c.getFullYear(), 0, 1), cac = cacStart(c); const hx = HX.meta(); const f0 = hx && hx.fuentes && hx.fuentes.length ? pdate(hx.fuentes[0].mes + "-01") : null;
  const pset = (d, l) => '<button type="button" data-hx="ps|' + iso(d) + '" aria-pressed="' + (iso(ST.ps) === iso(d)) + '">' + l + '</button>';
  return '<div class="panel hx-ctl"><div class="hx-ctl-row"><span class="hx-lbl">Fecha de corte</span><div class="seg sm" role="group" aria-label="Fecha de corte">' + cm.map(d => '<button type="button" data-hx="corte|' + iso(d) + '" aria-pressed="' + (iso(c) === iso(d)) + '">' + M3[d.getMonth()] + ' ' + String(d.getFullYear()).slice(2) + '</button>').join("") + '<button type="button" data-hx="corte|' + iso(t) + '" aria-pressed="' + isT + '">Hoy</button></div></div>' +
    '<div class="hx-ctl-row"><span class="hx-lbl">Periodo (incidentes, tasas)</span><div class="seg sm" role="group" aria-label="Inicio del periodo">' + pset(y0, "Año calendario " + c.getFullYear()) + pset(cac, "Periodo CAC desde 1 jul " + cac.getFullYear()) + (f0 && iso(f0) !== iso(y0) && iso(f0) !== iso(cac) ? pset(f0, "Desde el primer Dashboard (" + M3[f0.getMonth()] + " " + f0.getFullYear() + ")") : "") + '</div><span class="note">' + fd(ST.ps) + ' a ' + fd(c) + (ST.eps ? ' · ' + esc(ST.eps) : ' · todas las EPS') + '. También puede escribir las fechas arriba.</span></div></div>';
}
function obsNote(){ const hx = HX.meta(); if(!hx || !hx.fuentes || !hx.fuentes.length) return ""; const f = hx.fuentes; const labs = [...new Set(f.flatMap(x => x.labs))].sort();
  return '<p class="note hx-src">Fuente: ' + f.length + ' Dashboards (' + f.map(x => M3[+x.mes.slice(5) - 1]).join(", ") + ' de ' + f[0].mes.slice(0, 4) + '). Maestro de pacientes en esos meses; laboratorios de ' + (labs.length ? labs.map(m => M3[+m.slice(5) - 1]).join(", ") : "ningún mes") + '; asistencias de ' + f.filter(x => x.sesiones > 0).map(x => M3[+x.mes.slice(5) - 1]).join(", ") + '. Nada en esta vista se estima ni se completa: lo que el Excel no trae aparece como «sin dato».</p>'; }

/* =========================================================================================
   1. CARACTERIZACIÓN EPIDEMIOLÓGICA
   ========================================================================================= */
function tipoCaso(p, ps, c){ if(p.ModalidadPrevia && p.InicioHD){ return p.InicioHD >= ps && p.InicioHD <= c ? "mod" : "prev"; } if(!p.InicioTRR) return "sf"; if(p.InicioTRR >= ps && p.InicioTRR <= c) return "inc"; if(p.InicioTRR > c) return "sf"; return "prev"; }
const TIPO_TXT = { inc: "Incidente del periodo", prev: "Prevalente", mod: "Cambio de modalidad (DP → HD)", sf: "Sin fecha de inicio de TRR" };
const startOf = p => p._iv && p._iv.length ? p._iv[0][0] : null;
const endsIn = (p, a, b) => (p._iv || []).filter(([s, e]) => e && e >= a && e <= b).map(([s, e]) => e);
const dxTMO = p => /HIPERPARATIROID|PARATIROID|OSTEODISTROF|\bTMO\b/i.test(norm(p.Comorbilidades || ""));
const dxAnemia = p => /ANEMIA/i.test(norm(p.Comorbilidades || ""));
const dmTipo = p => p.DM !== "SI" ? "" : p.DMTipo === "1" ? "Tipo 1" : p.DMTipo === "3" ? "Tipo 2" : p.DMTipo === "4" ? "Otros tipos" : "Sin tipificar";
function labAt(p, c){ const tri = addMonths(c, -3), sem = addMonths(c, -6); const g = (k, a) => { const l = lastLab(p, k, a, c); return l ? num(l.Valor) : null; };
  const caL = labsIn(p, "Ca", tri, c).map(l => num(l.Valor)).filter(v => v != null);
  return { hb: g("Hb", tri), alb: g("Alb", tri), P: g("P", tri), ktv: g("KtV", tri), ca: caL.length ? mean(caL) : null, pth: g("PTH", sem), a1c: g("HbA1c", sem), tas: g("TAS", tri) }; }
function cohorte(c, ps, eps){
  ensureIdx(); const all = pacs().filter(p => !eps || p.EPS === eps);
  const prev = all.filter(p => activeAt(p, c)); const peri = all.filter(p => overlaps(p, ps, c));
  const tip = {}; peri.forEach(p => { tip[p.ID] = tipoCaso(p, ps, c); });
  const ing = peri.filter(p => { const s = startOf(p); return s && s >= ps && s <= c; });
  /* el paciente cuenta como activo hasta el último día con registro; el egreso se contabiliza al día siguiente */
  const egr = []; peri.forEach(p => endsIn(p, addDays(ps, -1), addDays(c, -1)).forEach(e => { const m = p._mov.find(m => iso(m.Fecha) === iso(e)); egr.push({ p, f: e, tipo: m ? m.Tipo : (p.Estado || "Egreso"), inf: !!(m && m.Origen === "HDX"), det: m ? m.Detalle : "" }); }));
  return { all, prev, peri, tip, ing, egr, inc: peri.filter(p => tip[p.ID] === "inc"), mod: peri.filter(p => tip[p.ID] === "mod"), sf: peri.filter(p => tip[p.ID] === "sf"), ant: peri.filter(p => tip[p.ID] === "prev") };
}
HX.cohorte = cohorte;
function flujoMensual(c, eps){ const hx = HX.meta(); const t0 = hx && hx.fuentes && hx.fuentes.length ? pdate(hx.fuentes[0].mes + "-01") : addMonths(monthStart(c), -5); const rows = []; const all = pacs().filter(p => !eps || p.EPS === eps);
  for(let d = new Date(t0); d <= c; d = addMonths(d, 1)){ const a = monthStart(d); let b = monthEnd(d); if(b > c) b = c; const m = ym(a); const f = hx ? hx.fuentes.find(x => x.mes === m) : null;
    const ini = all.filter(p => activeAt(p, addDays(a, -1))).length; const fin = all.filter(p => activeAt(p, b)).length;
    const ing = all.filter(p => (p._iv || []).some(([s]) => s >= a && s <= b)); const eg = all.filter(p => endsIn(p, addDays(a, -1), addDays(b, -1)).length);
    const ti = { inc: 0, prev: 0, mod: 0, sf: 0 }; ing.forEach(p => { ti[tipoCaso(p, a, b)]++; });
    rows.push({ a, b, m, ini, fin, ing, eg, ti, ses: all.reduce((n, p) => n + sesIn(p, a, b, "Realizada").length, 0), f, lab: hx ? hx.fuentes.some(x => x.labs.includes(m)) : null }); }
  return rows; }
function censoChart(rows){ if(rows.length < 2) return ""; const W = 640, H = 190, L = 40, R = 18, T = 22, B = 30; const v = rows.map(r => r.fin); const mx = Math.max(...v) + 3, mn = Math.max(0, Math.min(...v) - 5);
  const X = i => L + i * (W - L - R) / (rows.length - 1), Y = y => T + (1 - (y - mn) / (mx - mn)) * (H - T - B);
  let s = '<svg class="chart hx-chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Pacientes activos al cierre de cada mes">';
  [mn, Math.round((mn + mx) / 2), mx].forEach(t => { s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(t) + '" y2="' + Y(t) + '" stroke="var(--line)"/><text class="ax" x="' + (L - 6) + '" y="' + (Y(t) + 4) + '" text-anchor="end">' + t + '</text>'; });
  s += '<polyline fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round" points="' + rows.map((r, i) => X(i) + "," + Y(r.fin)).join(" ") + '"/>';
  rows.forEach((r, i) => { const src = r.f && r.f.maestro; s += '<circle cx="' + X(i) + '" cy="' + Y(r.fin) + '" r="' + (src ? 4.5 : 3.5) + '" fill="' + (src ? "var(--accent)" : "var(--surface)") + '" stroke="' + (src ? "var(--surface)" : "var(--accent)") + '" stroke-width="2"><title>' + mesTxt(r.m) + ': ' + r.fin + ' activos · ' + r.ing.length + ' ingresos · ' + r.eg.length + ' egresos' + (src ? '' : ' · mes sin Dashboard (censo reconstruido con las fechas del maestro)') + '</title></circle><text class="val" x="' + X(i) + '" y="' + (Y(r.fin) - 10) + '" text-anchor="middle">' + r.fin + '</text><text class="ax" x="' + X(i) + '" y="' + (H - 10) + '" text-anchor="middle">' + M3[r.a.getMonth()] + ' ' + String(r.a.getFullYear()).slice(2) + '</text>'; });
  return s + '</svg><p class="note">Punto relleno: mes con Dashboard. Punto hueco: mes sin Dashboard; el censo se reconstruye con las fechas de ingreso y el último mes con registro.</p>'; }

function vEpi(){
  ensureIdx(); const c = ST.corte, ps = ST.ps, eps = ST.eps; const K = cohorte(c, ps, eps); const N = K.prev.length;
  let h = '<div class="mhead"><div><p class="eyebrow">Eje 02 · Epidemiología de la cohorte de hemodiálisis</p><h2 class="mt">Caracterización de la cohorte: incidentes, prevalentes y comorbilidad</h2><p class="note" style="margin:3px 0 0">Corte ' + fd(c) + ' · periodo ' + fd(ps) + ' a ' + fd(c) + (eps ? ' · ' + esc(eps) : ' · todas las EPS') + '.</p></div><div class="copyrow"><button type="button" class="btn" data-hx="xepi">Exportar caracterización (.xlsx)</button></div></div>';
  h += ctlBar();
  /* --- resumen de cohorte --- */
  const egInf = K.egr.filter(e => e.inf).length;
  h += '<div class="tiles hx-tiles">' +
    '<div class="tile"><span class="tv">' + N + '</span><span class="tl"><b>Prevalentes al corte</b><br>pacientes activos en HD el ' + fd(c) + '</span></div>' +
    '<div class="tile"><span class="tv">' + K.peri.length + '</span><span class="tl"><b>Prevalencia de periodo</b><br>atendidos en HD algún día del periodo</span></div>' +
    '<div class="tile ok"><span class="tv">' + K.inc.length + '</span><span class="tl"><b>Incidentes del periodo</b><br>iniciaron TRR entre ' + fd(ps) + ' y ' + fd(c) + ' · ' + pc(K.inc.length, K.peri.length) + ' de los atendidos</span></div>' +
    '<div class="tile"><span class="tv">' + K.ing.length + '</span><span class="tl"><b>Ingresos a la unidad</b><br>incluye prevalentes trasladados y cambios de modalidad</span></div>' +
    '<div class="tile ' + (egInf ? "warn" : "") + '"><span class="tv">' + K.egr.length + '</span><span class="tl"><b>Egresos del periodo</b><br>' + (egInf ? egInf + ' sin causa registrada' : 'con causa registrada') + '</span></div>' +
    '<div class="tile ' + (K.sf.length ? "warn" : "") + '"><span class="tv">' + K.sf.length + '</span><span class="tl"><b>Sin clasificar</b><br>sin fecha de inicio de TRR en el maestro</span></div></div>';
  h += '<div class="alert info hx-def"><p><strong>Cómo se clasifica cada paciente.</strong> <em>Incidente</em>: su primera terapia de reemplazo renal empezó dentro del periodo (columna «Inicio Diálisis» del maestro). <em>Prevalente</em>: empezó antes del periodo y siguió en HD. Un paciente que llega trasladado de otra unidad es un <em>ingreso</em>, pero no un caso incidente. El paso de diálisis peritoneal a hemodiálisis dentro de la unidad se cuenta aparte, como cambio de modalidad. Aquí «prevalencia» es el número de casos en HD de la unidad; no es una tasa poblacional porque no hay denominador de población.</p></div>';
  h += '<div class="seg" role="group" style="margin:4px 0 10px">' + [["res","Flujo de la cohorte"],["dem","Demografía y acceso"],["com","HTA, diabetes, TMO y anemia"],["cmp","Incidentes frente a prevalentes"],["nom","Listado nominal"]].map(([k, l]) => '<button type="button" data-hx="epitab|' + k + '" aria-pressed="' + (UI.epiTab === k) + '">' + l + '</button>').join("") + '</div>';
  if(UI.epiTab === "res") h += epiFlujo(K, c, eps);
  else if(UI.epiTab === "dem") h += epiDemo(K, c);
  else if(UI.epiTab === "com") h += epiComorb(K, c);
  else if(UI.epiTab === "cmp") h += epiCompara(K, c);
  else h += epiNominal(K, c, ps);
  h += obsNote();
  return h;
}
function epiFlujo(K, c, eps){ const R = flujoMensual(c, eps);
  let h = '<div class="hx-flow"><div class="panel"><h3>Pacientes activos al cierre de cada mes</h3>' + censoChart(R) + '</div>';
  h += '<div class="panel"><h3>Casos incidentes del periodo (' + K.inc.length + ')</h3>' + (K.inc.length ? '<div class="tablebox hx-full"><table><thead><tr><th>ID</th><th>Paciente</th><th>EPS</th><th>Inicio de TRR</th><th>Ingreso a la unidad</th><th>Estado al corte</th></tr></thead><tbody>' + K.inc.slice().sort((a, b) => a.InicioTRR - b.InicioTRR).map(p => '<tr><td class="mono">' + esc(p.ID) + '</td><td>' + esc(nombre(p)) + '</td><td>' + esc(p.EPS || "sin EPS") + '</td><td class="mono">' + fd(p.InicioTRR) + '</td><td class="mono">' + (p.IngresoUnidad ? fd(p.IngresoUnidad) : '<span class="sd">sin dato</span>') + '</td><td>' + (activeAt(p, c) ? "Activo" : '<span class="sd">Egresó' + (p.FechaEstado ? " (" + fd(p.FechaEstado) + ")" : "") + '</span>') + '</td></tr>').join("") + '</tbody></table></div>' : '<p class="note">Ningún paciente inició TRR en este periodo.</p>') +
    (K.mod.length ? '<p class="note" style="margin-top:8px"><strong>Cambio de modalidad en el periodo:</strong> ' + K.mod.map(p => esc(p.ID + " " + nombre(p)) + " (en TRR desde " + fd(p.InicioTRR) + "; pasa a HD el " + fd(p.InicioHD) + ")").join("; ") + '. No es caso incidente.</p>' : "") +
    (K.sf.length ? '<p class="note"><strong>Sin fecha de inicio de TRR:</strong> ' + K.sf.map(p => esc(p.ID + " " + nombre(p))).join("; ") + '. No se pueden clasificar hasta completar el maestro.</p>' : "") + '</div></div>';
  h += '<div class="panel" style="margin-top:12px"><h3>Movimiento mensual de la cohorte</h3><div class="tablebox hx-full"><table><thead><tr><th>Mes</th><th class="num">Activos al inicio</th><th class="num">Ingresos</th><th>De los ingresos</th><th class="num">Egresos</th><th class="num">Activos al cierre</th><th class="num">Sesiones marcadas</th><th>Fuente del mes</th></tr></thead><tbody>' +
    R.map(r => '<tr><td>' + esc(mesTxt(r.m)) + (r.b < monthEnd(r.a) ? ' <span class="sub">hasta ' + fd(r.b) + '</span>' : '') + '</td><td class="num mono">' + r.ini + '</td><td class="num mono">' + r.ing.length + '</td><td style="font-size:12.5px">' + (r.ing.length ? [r.ti.inc ? plural(r.ti.inc, "incidente", "incidentes") : "", r.ti.prev ? plural(r.ti.prev, "prevalente que llega", "prevalentes que llegan") : "", r.ti.mod ? r.ti.mod + " cambio de modalidad" : "", r.ti.sf ? r.ti.sf + " sin fecha de inicio" : ""].filter(Boolean).join(" · ") + '<span class="sub">' + r.ing.map(p => esc(p.ID)).join(", ") + '</span>' : "") + '</td><td class="num mono">' + r.eg.length + (r.eg.length ? '<span class="sub">' + r.eg.map(p => esc(p.ID)).join(", ") + '</span>' : "") + '</td><td class="num mono"><strong>' + r.fin + '</strong></td><td class="num mono">' + (r.ses || '<span class="sd">—</span>') + '</td><td style="font-size:12.5px">' + (r.f ? "Dashboard" + (r.lab ? " · con laboratorios" : " · sin laboratorios del mes") : (r.lab ? "Solo laboratorios (consolidado posterior)" : '<span class="sd">Sin Dashboard</span>')) + '</td></tr>').join("") + '</tbody></table></div>' +
    '<p class="note">El mes de ingreso sale de «Ingreso Unidad» o, si falta, de «Inicio Diálisis»; si faltan los dos, del primer mes con registro. El egreso se infiere cuando el paciente deja de aparecer en el maestro: cuenta como activo hasta el fin del último mes con registro, sale al mes siguiente y la causa queda pendiente.</p></div>';
  if(K.egr.length) h += '<div class="panel" style="margin-top:12px"><h3>Egresos del periodo (' + K.egr.length + ')</h3><div class="tablebox"><table><thead><tr><th>ID</th><th>Paciente</th><th>EPS</th><th>Salida</th><th>Causa</th><th>Soporte</th></tr></thead><tbody>' + K.egr.sort((a, b) => a.f - b.f).map(e => '<tr><td class="mono">' + esc(e.p.ID) + '</td><td>' + esc(nombre(e.p)) + '</td><td>' + esc(e.p.EPS || "") + '</td><td>' + (e.inf ? 'después de ' + esc(mesTxt(ym(e.f))) : '<span class="mono">' + fd(e.f) + '</span>') + '</td><td>' + (e.inf ? chip("warn", "Sin causa registrada") : esc(e.tipo)) + '</td><td style="font-size:12.5px">' + esc((e.det || "").replace("[Inferido] ", "")) + '</td></tr>').join("") + '</tbody></table></div><p class="note">Sin la causa no se puede calcular mortalidad, traslados ni abandono (indicador dia_23). Clasifíquelos en Pacientes → Movimientos: fallecimiento, trasplante, traslado, cambio a DP, abandono o recuperación de función.</p></div>';
  return h; }
function dist(arr, fn, order){ const m = {}; arr.forEach(p => { const k = fn(p); m[k] = (m[k] || 0) + 1; }); const keys = order ? order.filter(k => m[k]).concat(Object.keys(m).filter(k => !order.includes(k))) : Object.keys(m).sort((a, b) => m[b] - m[a]); return keys.map(k => ({ l: k, n: m[k] })); }
function epiDemo(K, c){ const P = K.prev, N = P.length; if(!N) return '<div class="panel empty">Sin pacientes activos al corte.</div>';
  const ages = P.map(p => ageAt(p, c)).filter(a => a != null); const vint = P.filter(p => p.InicioTRR).map(p => dayDiff(p.InicioTRR, c) / 365.25);
  const ag = a => a == null ? "Sin fecha de nacimiento" : a < 40 ? "18 a 39 años" : a < 60 ? "40 a 59 años" : a < 75 ? "60 a 74 años" : "75 años o más";
  const vg = p => { if(!p.InicioTRR) return "Sin fecha de inicio"; const y = dayDiff(p.InicioTRR, c) / 365.25; return y < 0.25 ? "Menos de 90 días" : y < 1 ? "90 días a 1 año" : y < 3 ? "1 a 3 años" : y < 5 ? "3 a 5 años" : "5 años o más"; };
  let h = '<div class="hx-grid3">';
  h += '<div class="panel"><h3>Sexo</h3>' + hbars(dist(P, p => p.Sexo || "Sin dato"), N) + '<h3 style="margin-top:14px">Edad al corte</h3><p class="hx-kv"><span><b>' + (ages.length ? f1(median(ages), 0) : "—") + '</b> mediana</span><span><b>' + (ages.length ? f1(mean(ages), 1) : "—") + '</b> media</span><span><b>' + (ages.length ? Math.min(...ages) + "–" + Math.max(...ages) : "—") + '</b> rango</span></p>' + hbars(dist(P, p => ag(ageAt(p, c)), ["18 a 39 años","40 a 59 años","60 a 74 años","75 años o más","Sin fecha de nacimiento"]), N) + '</div>';
  h += '<div class="panel"><h3>Asegurador</h3>' + hbars(dist(P, p => p.EPS || "Sin EPS en el maestro"), N) + '<h3 style="margin-top:14px">Tiempo en terapia de reemplazo renal</h3><p class="hx-kv"><span><b>' + (vint.length ? f1(median(vint), 1) : "—") + '</b> años, mediana</span><span><b>' + P.filter(p => p.InicioTRR && dayDiff(p.InicioTRR, c) < 90).length + '</b> con menos de 90 días</span></p>' + hbars(dist(P, vg, ["Menos de 90 días","90 días a 1 año","1 a 3 años","3 a 5 años","5 años o más","Sin fecha de inicio"]), N) + '</div>';
  const acc = dist(P, p => accessAt(p, c) || "Sin dato", ["FAV","Injerto","CVC tunelizado","CVC temporal","Sin dato"]); const cvc = P.filter(p => isCVC(accessAt(p, c))).length;
  h += '<div class="panel"><h3>Acceso vascular al corte</h3><p class="hx-kv"><span><b>' + pc(cvc, N) + '</b> con catéter (' + nd(cvc, N) + ')</span></p>' + hbars(acc, N) + '<h3 style="margin-top:14px">Etapa de trasplante (texto del Dashboard)</h3>' + hbars(dist(P, p => p.TxEtapaRaw || "Sin diligenciar"), N) + '</div>';
  return h + '</div>'; }
function statRow(l, n, d, sub){ return '<tr><td>' + l + (sub ? '<span class="sub">' + sub + '</span>' : '') + '</td><td class="num mono">' + (d ? n : "—") + '</td><td class="num mono">' + d + '</td><td class="num"><strong>' + (d ? pc(n, d) : "—") + '</strong>' + (d ? '<span class="bar"><span style="width:' + Math.min(100, n / d * 100).toFixed(1) + '%"></span></span>' : '') + '</td></tr>'; }
function epiComorb(K, c){ const P = K.prev, N = P.length; if(!N) return '<div class="panel empty">Sin pacientes activos al corte.</div>';
  const L = {}; P.forEach(p => { L[p.ID] = labAt(p, c); });
  const hta = P.filter(p => p.HTA === "SI"), dm = P.filter(p => p.DM === "SI"), sdH = P.filter(p => !p.HTA).length, sdD = P.filter(p => !p.DM).length;
  const thead = '<thead><tr><th>Condición</th><th class="num">Casos</th><th class="num">Evaluables</th><th class="num">Proporción</th></tr></thead>';
  let h = '<div class="grid2 hx-g2"><div class="panel"><h3>Diagnósticos registrados en el maestro</h3><div class="tablebox hx-full"><table>' + thead + '<tbody>' +
    statRow("Hipertensión arterial", hta.length, N - sdH, sdH ? sdH + " sin diligenciar" : "") +
    statRow("Diabetes mellitus", dm.length, N - sdD, (sdD ? sdD + " sin diligenciar · " : "") + "tipo: " + (dm.length ? dist(dm, dmTipo).map(x => x.n + " " + x.l.toLowerCase()).join(", ") : "—")) +
    statRow("HTA y diabetes a la vez", P.filter(p => p.HTA === "SI" && p.DM === "SI").length, N - Math.max(sdH, sdD)) +
    statRow("Sin HTA ni diabetes", P.filter(p => p.HTA === "NO" && p.DM === "NO").length, N - Math.max(sdH, sdD)) +
    statRow("Hiperparatiroidismo u otro TMO anotado", P.filter(dxTMO).length, N, "texto libre de «Otras comorbilidades»") +
    statRow("Anemia anotada como diagnóstico", P.filter(dxAnemia).length, N, "texto libre de «Otras comorbilidades»") +
    '</tbody></table></div><p class="note">El Dashboard marca DM como SI/NO y no distingue tipo 1 de tipo 2; por eso aparece «sin tipificar». El tipo se puede diligenciar en Pacientes (variable CAC 20) y esta tabla lo toma. Los diagnósticos de TMO y anemia salen de un campo de texto libre: subestiman lo que muestran los laboratorios de la tabla de al lado.</p></div>';
  const withL = k => P.filter(p => L[p.ID][k] != null);
  const hb = withL("hb"), ph = withL("P"), ca = withL("ca"), pth = withL("pth"), alb = withL("alb");
  const tmoEv = P.filter(p => L[p.ID].P != null || L[p.ID].ca != null || L[p.ID].pth != null);
  const tmoAlt = tmoEv.filter(p => { const l = L[p.ID]; return (l.P != null && (l.P > 6 || l.P < 2.5)) || (l.ca != null && l.ca > 10.5) || (l.pth != null && (l.pth > 600 || l.pth < 130)); });
  h += '<div class="panel"><h3>Lo que muestran los laboratorios vigentes al corte</h3><div class="tablebox hx-full"><table>' + thead + '<tbody>' +
    '<tr class="hx-sec"><td colspan="4">Anemia · última hemoglobina del trimestre</td></tr>' +
    statRow("Hb menor de 10 g/dL", hb.filter(p => L[p.ID].hb < 10).length, hb.length, "umbral del indicador CAC dia_13") +
    statRow("Hb menor de 8 g/dL", hb.filter(p => L[p.ID].hb < 8).length, hb.length, "anemia severa") +
    statRow("Hb mayor de 13 g/dL", hb.filter(p => L[p.ID].hb > 13).length, hb.length, "revisar AEE si lo recibe") +
    statRow("Hb bajo el umbral diagnóstico", hb.filter(p => L[p.ID].hb < (/^F/i.test(p.Sexo || "") ? 12 : 13)).length, hb.length, "menor de 13 en hombres y de 12 en mujeres (KDIGO 2012)") +
    '<tr class="hx-sec"><td colspan="4">Trastorno mineral y óseo · fósforo y calcio del trimestre, PTH de 6 meses</td></tr>' +
    statRow("Fósforo mayor de 6 mg/dL", ph.filter(p => L[p.ID].P > 6).length, ph.length) +
    statRow("Fósforo menor de 2,5 mg/dL", ph.filter(p => L[p.ID].P < 2.5).length, ph.length) +
    statRow("Calcio promedio mayor de 10,5 mg/dL", ca.filter(p => L[p.ID].ca > 10.5).length, ca.length, "calcio total sin corregir (dia_29)") +
    statRow("PTH mayor de 600 pg/mL", pth.filter(p => L[p.ID].pth > 600).length, pth.length) +
    statRow("PTH menor de 130 pg/mL", pth.filter(p => L[p.ID].pth < 130).length, pth.length, "riesgo de bajo recambio óseo") +
    statRow("Al menos una alteración de P, Ca o PTH", tmoAlt.length, tmoEv.length, "con los rangos de los indicadores CAC") +
    '<tr class="hx-sec"><td colspan="4">Nutrición y control de las comorbilidades</td></tr>' +
    statRow("Albúmina menor de 4 g/dL", alb.filter(p => L[p.ID].alb < 4).length, alb.length, "de ellos " + alb.filter(p => L[p.ID].alb < 3.5).length + " por debajo de 3,5") +
    statRow("Diabéticos con HbA1c menor de 7 %", dm.filter(p => L[p.ID].a1c != null && L[p.ID].a1c < 7).length, dm.filter(p => L[p.ID].a1c != null).length, "HbA1c de los últimos 6 meses · " + dm.filter(p => L[p.ID].a1c == null).length + " de " + dm.length + " diabéticos sin dato") +
    statRow("Hipertensos con TA sistólica menor de 140", hta.filter(p => L[p.ID].tas != null && L[p.ID].tas < 140).length, hta.filter(p => L[p.ID].tas != null).length, "TA de la hoja de laboratorios, último trimestre · " + hta.filter(p => L[p.ID].tas == null).length + " de " + hta.length + " hipertensos sin dato") +
    '</tbody></table></div>';
  const noLab = !hb.length && !ph.length; const ll = lastLabMonth();
  if(noLab) h += '<div class="alert warn" style="margin-top:8px"><p>Al corte del ' + fd(c) + ' ningún paciente tiene laboratorios dentro del trimestre. ' + (ll ? 'Los últimos cargados son de ' + mesTxt(ym(ll)) + '. <button type="button" class="btn sm" data-hx="corte|' + iso(monthEnd(ll)) + '">Ver el cierre de ' + mesTxt(ym(ll)) + '</button>' : '') + '</p></div>';
  h += '<p class="note">«Evaluables» son los pacientes con el examen dentro de la ventana; quien no lo tiene no se cuenta como normal ni como alterado. La HbA1c es menos confiable en diálisis: tiende a subestimar la glucemia por la anemia, los AEE y la menor vida del eritrocito, así que la meta debe individualizarse. La TA es una sola medición por mes.</p></div></div>';
  return h; }
function epiCompara(K, c){ const G = [["Incidentes del periodo", K.inc], ["Prevalentes (inicio antes del periodo)", K.ant], ["Todos los atendidos en el periodo", K.peri]];
  const L = {}; K.peri.forEach(p => { L[p.ID] = labAt(p, activeAt(p, c) ? c : (p.FechaEstado || c)); });
  const cell = (n, d) => d ? '<strong>' + pc(n, d) + '</strong><span class="sub">' + nd(n, d) + '</span>' : '<span class="sd">sin dato</span>';
  const R = [
    ["Pacientes", g => '<strong>' + g.length + '</strong>'],
    ["Activos al corte", g => cell(g.filter(p => activeAt(p, c)).length, g.length)],
    ["Edad, mediana (años)", g => { const a = g.map(p => ageAt(p, c)).filter(x => x != null); return a.length ? '<strong>' + f1(median(a), 0) + '</strong><span class="sub">' + a.length + ' con fecha de nacimiento</span>' : '<span class="sd">sin dato</span>'; }],
    ["Mujeres", g => cell(g.filter(p => /^F/i.test(p.Sexo || "")).length, g.filter(p => p.Sexo).length)],
    ["Hipertensión arterial", g => cell(g.filter(p => p.HTA === "SI").length, g.filter(p => p.HTA).length)],
    ["Diabetes mellitus", g => cell(g.filter(p => p.DM === "SI").length, g.filter(p => p.DM).length)],
    ["Con catéter (último acceso conocido)", g => { const a = g.map(p => accessAt(p, activeAt(p, c) ? c : (p.FechaEstado || c))).filter(Boolean); return cell(a.filter(isCVC).length, a.length); }],
    ["Hb menor de 10 g/dL", g => { const a = g.filter(p => L[p.ID].hb != null); return cell(a.filter(p => L[p.ID].hb < 10).length, a.length); }],
    ["Albúmina menor de 4 g/dL", g => { const a = g.filter(p => L[p.ID].alb != null); return cell(a.filter(p => L[p.ID].alb < 4).length, a.length); }],
    ["Fósforo fuera de 2,5–6 mg/dL", g => { const a = g.filter(p => L[p.ID].P != null); return cell(a.filter(p => L[p.ID].P > 6 || L[p.ID].P < 2.5).length, a.length); }],
    ["Kt/V menor de 1,2", g => { const a = g.filter(p => L[p.ID].ktv != null); return cell(a.filter(p => L[p.ID].ktv < 1.2).length, a.length); }]
  ];
  return '<div class="panel"><h3>Incidentes frente a prevalentes</h3><div class="tablebox hx-full"><table class="hx-cmp"><thead><tr><th>Característica</th>' + G.map(g => '<th class="num">' + g[0] + '</th>').join("") + '</tr></thead><tbody>' + R.map(r => '<tr><td>' + r[0] + '</td>' + G.map(g => '<td class="num">' + r[1](g[1]) + '</td>').join("") + '</tr>').join("") + '</tbody></table></div><p class="note">Laboratorios: último valor de la ventana al corte (o a la fecha de egreso). Con ' + K.inc.length + ' incidentes los porcentajes del grupo cambian mucho con un solo paciente: sirven para describir, no para comparar con significancia. Quedan fuera de las dos primeras columnas ' + (K.mod.length + K.sf.length) + ' pacientes (cambio de modalidad o sin fecha de inicio).</p></div>'; }
function epiRows(K, c, ps){ return K.peri.map(p => { const act = activeAt(p, c); const ref = act ? c : (p.FechaEstado || c); const l = labAt(p, ref); return { p, tipo: TIPO_TXT[K.tip[p.ID]], act, edad: ageAt(p, c), vint: p.InicioTRR ? dayDiff(p.InicioTRR, ref) / 30.4375 : null, acc: accessAt(p, ref), l, tmo: dxTMO(p), anem: dxAnemia(p) }; }).sort((a, b) => a.p.ID < b.p.ID ? -1 : 1); }
function epiNominal(K, c, ps){ const R = epiRows(K, c, ps); const sn = v => v == null ? '<span class="sd">—</span>' : v;
  return '<div class="panel" style="padding:0"><div class="tablebox"><table><thead><tr><th>ID</th><th>Paciente</th><th>EPS</th><th>Clasificación</th><th>Inicio TRR</th><th>Ingreso unidad</th><th class="num">Meses en TRR</th><th class="num">Edad</th><th>HTA</th><th>DM</th><th>TMO anotado</th><th>Anemia anotada</th><th>Acceso</th><th class="num">Hb</th><th class="num">P</th><th class="num">PTH</th><th>Estado</th></tr></thead><tbody>' +
    R.map(r => { const p = r.p; return '<tr><td class="mono">' + esc(p.ID) + '</td><td>' + esc(nombre(p)) + '<span class="sub">' + esc(p.TipoDoc || "") + ' ' + esc(p.Documento || "") + '</span></td><td>' + esc(p.EPS || "—") + '</td><td>' + chip(K.tip[p.ID] === "inc" ? "ok" : K.tip[p.ID] === "prev" ? "base" : "warn", r.tipo) + '</td><td class="mono">' + (p.InicioTRR ? fd(p.InicioTRR) : '<span class="sd">sin dato</span>') + '</td><td class="mono">' + (p.IngresoUnidad ? fd(p.IngresoUnidad) : p._startInf ? '<span class="sd">' + M3[p.PrimerRegistro.getMonth()] + ' ' + p.PrimerRegistro.getFullYear() + ' (1.er registro)</span>' : '<span class="sd">sin dato</span>') + '</td><td class="num mono">' + (r.vint == null ? "—" : f1(r.vint, 0)) + '</td><td class="num mono">' + sn(r.edad) + '</td><td>' + esc(p.HTA || "—") + '</td><td>' + esc(p.DM || "—") + (p.DM === "SI" ? '<span class="sub">' + esc(dmTipo(p).toLowerCase()) + '</span>' : '') + '</td><td>' + (r.tmo ? "Sí" : "") + '</td><td>' + (r.anem ? "Sí" : "") + '</td><td>' + esc(r.acc || "—") + '</td><td class="num mono">' + (r.l.hb == null ? "—" : f1(r.l.hb, 1)) + '</td><td class="num mono">' + (r.l.P == null ? "—" : f1(r.l.P, 1)) + '</td><td class="num mono">' + (r.l.pth == null ? "—" : f1(r.l.pth, 0)) + '</td><td>' + (r.act ? "Activo" : '<span class="sd">Egresó ' + (p.FechaEstado ? fd(p.FechaEstado) : "") + '</span>') + '</td></tr>'; }).join("") + '</tbody></table></div></div><p class="note">Hb, fósforo y PTH: último valor vigente al corte. ' + K.peri.length + ' pacientes atendidos en el periodo.</p>'; }
async function expEpi(){ const c = ST.corte, ps = ST.ps; const K = cohorte(c, ps, ST.eps); const R = epiRows(K, c, ps); const F = flujoMensual(c, ST.eps);
  await exportSheets("Caracterizacion_cohorte_HD_" + iso(c) + ".xlsx", [
    ["Cohorte", R, [["ID", r => r.p.ID], ["Tipo doc.", r => r.p.TipoDoc], ["Documento", r => r.p.Documento], ["Nombres", r => r.p.Nombres], ["Apellidos", r => r.p.Apellidos], ["EPS", r => r.p.EPS], ["Clasificación", r => r.tipo], ["Inicio TRR", r => r.p.InicioTRR], ["Inicio HD (cambio de modalidad)", r => r.p.InicioHD], ["Ingreso unidad", r => r.p.IngresoUnidad], ["Primer mes con registro", r => r.p.PrimerRegistro], ["Meses en TRR", r => r.vint == null ? "" : Math.round(r.vint)], ["Edad al corte", r => r.edad], ["Sexo", r => r.p.Sexo], ["HTA", r => r.p.HTA], ["DM", r => r.p.DM], ["Tipo de DM", r => dmTipo(r.p)], ["TMO anotado", r => r.tmo ? "SI" : "NO"], ["Anemia anotada", r => r.anem ? "SI" : "NO"], ["Otras comorbilidades (texto)", r => r.p.Comorbilidades], ["Acceso", r => r.acc], ["Etapa trasplante (Dashboard)", r => r.p.TxEtapaRaw], ["Hb vigente", r => r.l.hb], ["Albúmina vigente", r => r.l.alb], ["Fósforo vigente", r => r.l.P], ["Calcio promedio trimestre", r => r.l.ca == null ? "" : Math.round(r.l.ca * 100) / 100], ["PTH vigente", r => r.l.pth], ["Kt/V vigente", r => r.l.ktv], ["HbA1c vigente", r => r.l.a1c], ["Activo al corte", r => r.act ? "SI" : "NO"], ["Fecha de egreso usada", r => r.act ? "" : r.p.FechaEstado]]],
    ["Flujo_mensual", F, [["Mes", r => r.m], ["Activos al inicio", r => r.ini], ["Ingresos", r => r.ing.length], ["Incidentes", r => r.ti.inc], ["Prevalentes que llegan", r => r.ti.prev], ["Cambio de modalidad", r => r.ti.mod], ["Sin fecha de inicio", r => r.ti.sf], ["Egresos", r => r.eg.length], ["Activos al cierre", r => r.fin], ["Sesiones marcadas", r => r.ses], ["Con Dashboard", r => r.f ? "SI" : "NO"], ["Con laboratorios", r => r.lab ? "SI" : "NO"]]],
    ["Egresos", K.egr, [["ID", e => e.p.ID], ["Paciente", e => nombre(e.p)], ["EPS", e => e.p.EPS], ["Fecha usada", e => e.f], ["Causa", e => e.inf ? "Sin causa registrada" : e.tipo], ["Detalle", e => e.det]]]
  ]); }

/* =========================================================================================
   2. TABLERO CAC 2026 · 17 INDICADORES
   ========================================================================================= */
function evalAll(c, ps, eps){ ensureIdx(); const x = ctxFor(c, ps, eps); return HX.CAC().map(d => evalInd(d, x)); }
const prevCut = c => monthEnd(addMonths(monthStart(c), -1));
function refTxt(d){ if(!d.cuts) return "Línea de base (sin rango CAC)"; if(d.t === "rate") return "Alto < " + String(d.cuts[0]).replace(".", ",") + " · bajo ≥ " + String(d.cuts[0]).replace(".", ","); return d.dir === "down" ? "Alto < " + d.cuts[0] + " % · medio " + d.cuts[0] + "–" + d.cuts[1] + " % · bajo > " + d.cuts[1] + " %" : "Alto > " + d.cuts[0] + " % · medio " + d.cuts[1] + "–" + d.cuts[0] + " % · bajo < " + d.cuts[1] + " %"; }
function numDen(r){ const d = r.def; if(d.t === "rate") return [r.n, d.c === "dia_33_adul" ? f1(r.d, 0) + " días-catéter" : f1(r.d, 1) + " meses-persona"]; return [r.n, r.d]; }
function denCell(r){ const d = r.def; if(d.t !== "rate") return String(r.d); return (d.c === "dia_33_adul" ? f1(r.d, 0) : f1(r.d, 1)) + '<span class="sub">' + (d.c === "dia_33_adul" ? "días-catéter" : "meses-persona") + '</span>'; }
const plural = (n, s, p) => n + " " + (n === 1 ? s : p);
function variacion(r, q){ if(!q || r.val == null || q.val == null) return '<span class="sd">—</span>'; const d = r.def; const dv = d.t === "pct" ? (r.val - q.val) * 100 : r.val - q.val; if(Math.abs(dv) < (d.t === "pct" ? 0.05 : 0.0005)) return '<span class="mono">sin cambio</span>'; const better = d.dir === "down" ? dv < 0 : dv > 0; return '<span class="mono" style="color:var(' + (better ? "--ok" : "--bad") + ')">' + (dv > 0 ? "▲ +" : "▼ −") + f1(Math.abs(dv), d.t === "pct" ? 1 : 3) + (d.t === "pct" ? " pp" : "") + '</span><span class="sub">' + (better ? "mejora" : "empeora") + (d.t === "pct" && ((r.sd && r.sd.length) || (q.sd && q.sd.length)) && !r.noComp ? " · con faltantes" : "") + '</span>'; }
function faltantes(r){ const d = r.def; if(d.t === "rate") return '<span class="sd">no aplica</span>'; if(!r.d) return '<span class="sd">—</span>'; const s = r.sd ? new Set(r.sd).size : 0; return '<span class="mono">' + s + ' de ' + r.d + '</span>' + (r.noComp ? '<span class="sub">sin clasificar</span>' : '<span class="sub">compl. ' + pc(r.d - s, r.d) + '</span>'); }
function resultado(r){ const d = r.def; if(r.status === "nc") return '<span class="sd">No calculable</span><span class="sub">denominador 0</span>'; if(r.status === "ne") return '<span class="sd">—</span>'; return '<strong>' + fmtVal(d, r.val) + '</strong>' + (d.t === "rate" ? '<span class="sub">' + esc(d.unit) + '</span>' : ''); }

function vCac(){
  ensureIdx(); const c = ST.corte, ps = ST.ps, eps = ST.eps; const R = evalAll(c, ps, eps); const pcut = prevCut(c); const Q = evalAll(pcut, ps > pcut ? addDays(addMonths(pcut, -12), 1) : ps, eps);
  const cnt = s => R.filter(r => r.status === s).length; const nBase = HX.pop.base(ctxFor(c, ps, eps)).length;
  let h = '<div class="mhead"><div><p class="eyebrow">Eje 06 · Cuenta de Alto Costo · Consenso de indicadores de diálisis (actualización 2026)</p><h2 class="mt">Tablero CAC de hemodiálisis · 17 indicadores</h2><p class="note" style="margin:3px 0 0">Corte ' + fd(c) + ' · periodo ' + fd(ps) + ' a ' + fd(c) + (eps ? ' · ' + esc(eps) : ' · todas las EPS') + '. Cada indicador se recalcula con los datos cargados; un dato faltante cuenta en el denominador y nunca en el numerador.</p></div><div class="copyrow"><button type="button" class="btn primary" data-hx="xcac">Exportar los 5 entregables (.xlsx)</button><button type="button" class="btn" data-a="corfreeze">Congelar este corte</button></div></div>';
  h += ctlBar();
  const labNE = ["dia_11_adul","dia_13_adul","dia_15_adul","dia_17_adul"].every(k => { const r = R.find(z => z.def.c === k); return r && r.status === "ne"; }); const ll = lastLabMonth();
  if(labNE) h += '<div class="alert warn"><p><strong>Sin laboratorios vigentes a este corte.</strong> Hemoglobina, albúmina, fósforo, calcio y Kt/V exigen un resultado del trimestre anterior al cierre y ' + (ll ? 'los últimos cargados son de ' + mesTxt(ym(ll)) : 'la base no tiene laboratorios') + '. Esos indicadores quedan como «No evaluable» en lugar de 0 %: un cero diría que nadie cumple, y lo que pasa es que no hay medición. ' + (ll ? '<button type="button" class="btn sm" data-hx="corte|' + iso(monthEnd(ll)) + '">Ver el cierre de ' + mesTxt(ym(ll)) + '</button>' : '') + '</p></div>';
  h += '<div class="tiles hx-tiles"><div class="tile ok"><span class="tv">' + cnt("alto") + '</span><span class="tl">en cumplimiento alto</span></div><div class="tile warn"><span class="tv">' + cnt("medio") + '</span><span class="tl">en cumplimiento medio</span></div><div class="tile bad"><span class="tv">' + cnt("bajo") + '</span><span class="tl">en cumplimiento bajo</span></div><div class="tile base"><span class="tv">' + cnt("base") + '</span><span class="tl">línea de base medida</span></div><div class="tile"><span class="tv">' + (cnt("pre") + cnt("inc")) + '</span><span class="tl">preliminares o con completitud insuficiente</span></div><div class="tile"><span class="tv">' + (cnt("ne") + cnt("nc")) + '</span><span class="tl">no evaluables con la fuente actual</span></div><div class="tile"><span class="tv">' + nBase + '</span><span class="tl">adultos en HD al cierre' + (HX.n90 ? ' con 90 días o más' : '') + '</span></div></div>';
  h += '<div class="hx-opts"><div class="seg" role="group">' + [["tab","Tablero"],["eps","Por EPS"],["pac","Pacientes a intervenir"],["fic","Fichas técnicas"],["inf","Informe gerencial"],["dat","Fuentes y calidad del dato"]].map(([k, l]) => '<button type="button" data-hx="tab|' + k + '" aria-pressed="' + (UI.tab === k) + '">' + l + '</button>').join("") + '</div>' +
    '<label class="hx-chk"><input type="checkbox" data-hxc="n90"' + (HX.n90 ? " checked" : "") + '> Contar solo pacientes con 90 días o más en diálisis</label><label class="hx-chk">Completitud mínima para clasificar <select data-hxc="thr">' + [50, 60, 70, 80, 90].map(v => '<option value="' + v + '"' + (HX.thr === v ? " selected" : "") + '>' + v + ' %</option>').join("") + '</select></label></div>';
  if(UI.tab === "tab") h += cacTablero(R, Q, pcut);
  else if(UI.tab === "eps") h += cacEps(c, ps);
  else if(UI.tab === "pac") h += cacPac(c);
  else if(UI.tab === "fic") h += cacFichas();
  else if(UI.tab === "inf") h += cacInforme(R, c, ps);
  else h += cacDatos();
  h += obsNote();
  return h;
}
function cacTablero(R, Q, pcut){
  let h = '<div class="panel tablebox hx-full" style="padding:0"><table class="indt hx-tab"><thead><tr><th>Indicador</th><th>Código CAC</th><th class="num">Numerador</th><th class="num">Denominador</th><th class="num">Resultado</th><th>Meta o referencia</th><th>Clasificación</th><th class="num">Cierre de ' + M3[pcut.getMonth()] + ' ' + String(pcut.getFullYear()).slice(2) + '</th><th>Variación</th><th class="num">Datos faltantes</th></tr></thead><tbody>' +
    R.map((r, i) => { const d = r.def, q = Q[i]; const [n, dd] = numDen(r); return '<tr data-hx="sel|' + d.c + '" class="' + (UI.sel === d.c ? "sel" : "") + '" tabindex="0"><td>' + esc(d.n) + '<span class="sub">' + esc(d.win) + '</span></td><td class="mono" style="white-space:nowrap">' + esc(d.c) + '</td><td class="num mono">' + n + '</td><td class="num mono">' + denCell(r) + '</td><td class="num">' + resultado(r) + '</td><td style="font-size:12.5px">' + esc(refTxt(d)) + '</td><td>' + chip(r.status) + '</td><td class="num mono">' + (q.val == null ? '<span class="sd">' + (q.status === "nc" ? "n. c." : "—") + '</span>' : fmtVal(d, q.val)) + '</td><td>' + variacion(r, q) + '</td><td class="num">' + faltantes(r) + '</td></tr>'; }).join("") + '</tbody></table></div>';
  h += '<p class="note">Clasificación: <em>alto, medio, bajo</em> son los rangos de la ficha; <em>línea de base</em> es un indicador que la CAC mide sin rango todavía; <em>preliminar</em> tiene resultado pero una limitación de la fuente que impide darlo por definitivo; <em>completitud insuficiente</em> tiene menos del ' + HX.thr + ' % de los pacientes con dato y no se clasifica (el umbral es una regla del módulo, no de la CAC); <em>no evaluable</em> es que la fuente no trae lo necesario. Haga clic en una fila para ver quién está en el numerador y en el denominador.</p>';
  const r = R.find(z => z.def.c === UI.sel) || R[0]; h += cacDetalle(r); return h; }
function cacDetalle(r){ const d = r.def; const tr = trendPoints(d, 6); const pl = (arr, fn) => arr && arr.length ? '<div class="tablebox" style="max-height:340px"><table><tbody>' + arr.map(fn).join("") + '</tbody></table></div>' : '<p class="note">Ninguno.</p>';
  const row = x => '<tr><td class="mono">' + esc(x.p.ID) + '</td><td>' + esc(nombre(x.p)) + '<span class="sub">' + esc(x.p.EPS || "sin EPS") + '</span></td><td style="font-size:12.5px">' + esc(x.v == null ? "" : typeof x.v === "number" ? f1(x.v, 2) : x.v) + '</td></tr>';
  let h = '<div class="panel" id="hxdet"><div class="inddet"><div class="hero"><span class="tag cac">' + esc(d.c) + '</span><div class="hn">' + esc(d.n) + '</div><div class="hv">' + (r.val == null ? "—" : fmtVal(d, r.val)) + '</div><div class="note">' + (d.t === "rate" ? esc(d.unit) + " · " : "") + esc(r.expl || (r.d ? r.n + " de " + r.d : "sin denominador")) + '</div><p>' + chip(r.status) + '</p>' +
    (r.vCon != null && r.sd && r.sd.length ? '<p class="note">Entre quienes sí tienen dato: ' + pct(r.vCon) + ' (' + r.n + ' de ' + (r.d - r.sd.length) + '). Cifra complementaria, no es la de la ficha.</p>' : '') +
    '<dl class="ficha"><dt>Ventana</dt><dd>' + esc(d.win) + '</dd><dt>Fuente</dt><dd>' + esc(d.src) + '</dd><dt>Referencia CAC</dt><dd>' + esc(refTxt(d)) + '</dd>' + (d.ex ? '<dt>Exclusiones</dt><dd>' + esc(d.ex) + '</dd>' : '') + (d.nota ? '<dt>Nota</dt><dd>' + esc(d.nota) + '</dd>' : '') + '</dl></div>' +
    '<div style="min-width:0">' + (r.ne ? '<div class="alert warn"><p><strong>No evaluable.</strong> ' + esc(r.ne) + '</p></div>' : '') + (r.prelim ? '<div class="alert info"><p>' + esc(r.prelim) + '</p></div>' : '') + (r.alt ? '<div class="alert info"><p><strong>Sensibilidad.</strong> ' + esc(r.alt) + '</p></div>' : '') + (r.status === "inc" ? '<div class="alert warn"><p>Solo el ' + pc(r.d - r.sd.length, r.d) + ' de los pacientes tiene dato en la ventana. El cociente oficial se muestra, pero no se clasifica contra el rango CAC.</p></div>' : '') +
    '<h3 style="margin-top:8px">Cierre de cada mes</h3>' + bigChart(tr, d) + (d.t === "rate" || /Periodo|Incidentes/.test(d.win) ? '<p class="note">Cada punto usa los 12 meses anteriores a ese cierre; el valor grande usa el periodo elegido arriba. Pueden diferir.</p>' : '<p class="note">Los meses sin punto no tienen resultado dentro de la ventana.</p>') + '</div></div>';
  if(d.t === "rate") h += '<details class="hist" open><summary>Registros considerados (' + r.list.length + ')</summary>' + pl(r.list, row) + '</details>';
  else { const rest = r.den.filter(x => !r.num.some(n => n.p === x.p)); h += '<div class="grid2" style="margin-top:10px"><details class="hist" open><summary>Numerador (' + r.num.length + ')</summary>' + pl(r.num, row) + '</details><details class="hist" open><summary>Resto del denominador (' + rest.length + ')</summary>' + pl(rest, row) + '</details></div>'; if(r.excl.length) h += '<details class="hist"><summary>Excluidos con soporte (' + r.excl.length + ')</summary>' + pl(r.excl.map(e => ({ p: e.p, v: e.why })), row) + '</details>'; }
  return h + '</div>'; }
function epsDe(c, ps){ const x = ctxFor(c, ps, ""); const s = new Map(); HX.pop.per(x).forEach(p => { const k = p.EPS || ""; s.set(k, (s.get(k) || 0) + (activeAt(p, c) ? 1 : 0)); }); return [...s.entries()].sort((a, b) => b[1] - a[1]); }
function cacEps(c, ps){ const E = epsDe(c, ps).filter(([k]) => k); const sinE = epsDe(c, ps).find(([k]) => !k); const T = evalAll(c, ps, ""); const M = E.map(([e]) => evalAll(c, ps, e));
  const cell = r => { const d = r.def; if(r.status === "nc") return '<td class="num"><span class="sd">sin casos</span></td>'; if(r.status === "ne") return '<td class="num"><span class="sd">no evaluable</span></td>'; const small = d.t === "pct" && r.d < 10; const [n, dd] = numDen(r); return '<td class="num' + (small ? " hx-small" : "") + '"><strong>' + fmtVal(d, r.val) + '</strong><span class="sub">' + (d.t === "rate" ? n + " / " + dd.split(" ")[0] : n + " / " + dd) + (small ? " · n < 10" : "") + '</span>' + (d.cuts && !small && ["alto","medio","bajo"].includes(r.status) ? chip(r.status, { alto: "Alto", medio: "Medio", bajo: "Bajo" }[r.status]) : ["pre","inc"].includes(r.status) && !small ? chip(r.status, r.status === "pre" ? "Preliminar" : "Incompleto") : "") + '</td>'; };
  let h = '<div class="panel tablebox hx-full" style="padding:0"><table class="hx-eps"><thead><tr><th>Indicador</th><th class="num">Unidad completa</th>' + E.map(([e, n]) => '<th class="num">' + esc(e) + '<br><small>' + n + (n === 1 ? ' activo' : ' activos') + '</small></th>').join("") + '</tr></thead><tbody>' +
    T.map((r, i) => '<tr><td>' + esc(r.def.n) + '<span class="sub mono">' + esc(r.def.c) + '</span></td>' + cell(r) + M.map(m => cell(m[i])).join("") + '</tr>').join("") + '</tbody></table></div>';
  h += '<p class="note">Mismas reglas del consolidado, aplicadas a los pacientes de cada EPS. Con menos de 10 pacientes en el denominador el porcentaje se muestra atenuado y sin clasificar: un solo paciente lo mueve 10 puntos o más. Las EPS difieren en edad, antigüedad en diálisis y tipo de acceso de sus afiliados, así que estas cifras describen a cada contrato; no miden por sí solas la calidad de la atención que recibe.' + (sinE && sinE[1] ? ' ' + (sinE[1] === 1 ? 'Un paciente activo no tiene' : sinE[1] + ' pacientes activos no tienen') + ' EPS en el maestro y solo ' + (sinE[1] === 1 ? 'aparece' : 'aparecen') + ' en la columna de la unidad.' : '') + '</p>';
  return h; }

/* ---------- pacientes que requieren intervención ---------- */
function intervenciones(c){ ensureIdx(); const P = pacs().filter(p => (!ST.eps || p.EPS === ST.eps) && activeAt(p, c)); const tri = addMonths(c, -3), sem = addMonths(c, -6); const out = [];
  const last = (p, k) => { const L = p._lab[k]; if(!L) return null; for(let i = L.length - 1; i >= 0; i--){ if(L[i].FechaToma <= c && num(L[i].Valor) != null) return L[i]; } return null; };
  const add = (p, ind, res, f, riesgo, acc, resp, dias, venc) => out.push({ p, ind, res, f, riesgo, acc, resp, plazo: dias, venc: !!venc, estado: "Abierto" });
  P.forEach(p => {
    const chk = (k, win, fn) => { const l = last(p, k); if(!l) return null; const v = num(l.Valor); const venc = l.FechaToma <= win; fn(v, l, venc); return l; };
    chk("Hb", tri, (v, l, o) => { if(v < 8) add(p, "Hemoglobina (dia_13)", f1(v, 1) + " g/dL", l.FechaToma, "Alto", "Buscar la causa de la anemia severa (sangrado, déficit de hierro, inflamación), revisar el AEE y definir si requiere transfusión según la clínica", "Nefrología", 7, o); else if(v < 10) add(p, "Hemoglobina (dia_13)", f1(v, 1) + " g/dL", l.FechaToma, "Medio", "Revisar dosis de AEE y perfil de hierro (ferritina y saturación de transferrina no están en la base)", "Nefrología", 30, o); else if(v > 13) add(p, "Hemoglobina por encima de 13", f1(v, 1) + " g/dL", l.FechaToma, "Medio", "Si recibe AEE, revisar la dosis", "Nefrología", 30, o); });
    chk("Alb", tri, (v, l, o) => { if(v < 3.5) add(p, "Albúmina (dia_15)", f1(v, 2) + " g/dL", l.FechaToma, "Alto", "Valoración nutricional y búsqueda de inflamación o infección activa", "Nutrición y nefrología", 15, o); else if(v < 4) add(p, "Albúmina (dia_15)", f1(v, 2) + " g/dL", l.FechaToma, "Bajo", "Seguimiento nutricional y de ingesta proteica", "Nutrición", 30, o); });
    chk("P", tri, (v, l, o) => { if(v > 7.5) add(p, "Fósforo (dia_17)", f1(v, 1) + " mg/dL", l.FechaToma, "Alto", "Revisar dieta, quelante y adherencia; verificar la dosis de diálisis", "Nefrología y nutrición", 15, o); else if(v > 6) add(p, "Fósforo (dia_17)", f1(v, 1) + " mg/dL", l.FechaToma, "Medio", "Educación en dieta y ajuste del quelante", "Nefrología y nutrición", 30, o); else if(v < 2.5) add(p, "Fósforo bajo (dia_17)", f1(v, 1) + " mg/dL", l.FechaToma, "Medio", "Descartar desnutrición o exceso de quelante", "Nefrología y nutrición", 30, o); });
    chk("Ca", tri, (v, l, o) => { if(v > 10.5) add(p, "Calcio (dia_29)", f1(v, 1) + " mg/dL", l.FechaToma, "Medio", "Revisar quelantes cálcicos, vitamina D activa y calcio del dializado", "Nefrología", 30, o); });
    chk("PTH", sem, (v, l, o) => { if(v > 600) add(p, "PTH (dia_27)", l.Valor + " pg/mL", l.FechaToma, "Medio", "Ajustar el manejo del hiperparatiroidismo secundario; si es refractario, valorar remisión", "Nefrología", 30, o); else if(v < 130) add(p, "PTH baja (dia_27)", l.Valor + " pg/mL", l.FechaToma, "Bajo", "Riesgo de bajo recambio óseo: revisar vitamina D activa, calcimimético y carga de calcio", "Nefrología", 30, o); });
    chk("KtV", tri, (v, l, o) => { if(v < 1.2) add(p, "Kt/V (dia_11)", f1(v, 2), l.FechaToma, "Alto", "Revisar tiempo efectivo, flujo de sangre, dializador y funcionamiento del acceso; repetir Kt/V", "Nefrología y enfermería", 15, o); });
    const a = accessAt(p, c);
    if(a === "CVC temporal") add(p, "Acceso vascular (dia_10)", "Catéter temporal", null, "Alto", "Definir acceso definitivo: catéter tunelizado y ruta a FAV", "Nefrología y cirugía vascular", 15);
    else if(a === "CVC tunelizado" && !(RUTA_EXCL.includes(p.RutaAcceso) && p.SoporteRuta) && !/FAV/.test(p.RutaAcceso || "") && !/Remitido|Doppler/.test(p.RutaAcceso || "")) add(p, "Acceso vascular (dia_10)", "Catéter tunelizado sin ruta a FAV registrada", null, "Medio", "Valorar factibilidad de FAV y dejar el concepto (o la negativa) con soporte", "Nefrología y cirugía vascular", 90);
    else if(!a) add(p, "Acceso vascular (dia_10)", "Sin dato", null, "Medio", "Registrar el acceso vascular en el maestro", "Enfermería", 7);
    const ab = last(p, "AntiHBs"); if(!ab) add(p, "Anti-HBs (dia_26)", "Sin dato", null, "Medio", "Tomar anti-HBs, HBsAg y anti-HBc y definir esquema de vacunación", "Enfermería", 30); else if(num(ab.Valor) < 10 && !/completo/i.test(p.VacunaVHB || "")) add(p, "Anti-HBs menor de 10 (dia_26)", f1(num(ab.Valor), 1) + " mUI/mL", ab.FechaToma, "Medio", "Iniciar o completar el esquema de hepatitis B (" + (p.VacunaVHB || "sin registro de vacunación") + ")", "Enfermería", 30); else if(num(ab.Valor) < 10) add(p, "Anti-HBs menor de 10 con esquema completo", f1(num(ab.Valor), 1) + " mUI/mL", ab.FechaToma, "Medio", "Definir segundo esquema o refuerzo y repetir anti-HBs; solo después clasificar como no respondedor", "Nefrología y enfermería", 30);
    const falt = [["Hb", tri], ["P", tri], ["KtV", tri], ["Alb", tri], ["Ca", tri], ["PTH", sem]].filter(([k, w]) => !lastLab(p, k, w, c)).map(([k]) => ({ Hb: "hemoglobina", P: "fósforo", KtV: "Kt/V", Alb: "albúmina", Ca: "calcio", PTH: "PTH" }[k]));
    if(falt.length) add(p, "Laboratorios sin resultado vigente", falt.join(", "), null, falt.length >= 4 ? "Medio" : "Bajo", "Tomar y cargar los paraclínicos pendientes del periodo", "Enfermería y laboratorio", 15);
    if(p.TxEstado === "Sin evaluar") add(p, "Trasplante (dia_21)", p.TxEtapaRaw ? "«" + p.TxEtapaRaw + "» sin soporte" : "Sin evaluar", null, "Bajo", "Dejar el concepto de idoneidad para trasplante con soporte de nefrología", "Nefrología", 90);
  });
  const ord = { Alto: 0, Medio: 1, Bajo: 2 }; return out.sort((a, b) => ord[a.riesgo] - ord[b.riesgo] || (a.p.ID < b.p.ID ? -1 : 1)); }
HX.intervenciones = intervenciones;
function cacPac(c){ const L = intervenciones(c); const n = r => L.filter(x => x.riesgo === r).length; const byP = {}; L.forEach(x => { if(x.riesgo === "Alto") byP[x.p.ID] = (byP[x.p.ID] || 0) + 1; });
  const top = Object.entries(byP).sort((a, b) => b[1] - a[1]).slice(0, 6);
  let h = '<div class="tiles hx-tiles"><div class="tile bad"><span class="tv">' + n("Alto") + '</span><span class="tl">hallazgos de riesgo alto</span></div><div class="tile warn"><span class="tv">' + n("Medio") + '</span><span class="tl">de riesgo medio</span></div><div class="tile"><span class="tv">' + n("Bajo") + '</span><span class="tl">de riesgo bajo</span></div><div class="tile"><span class="tv">' + new Set(L.map(x => x.p.ID)).size + '</span><span class="tl">pacientes con al menos un hallazgo</span></div></div>';
  if(top.length) h += '<p class="note"><strong>Más hallazgos de riesgo alto:</strong> ' + top.map(([id, k]) => { const p = IDX.pac.get(id); return esc(id + " " + nombre(p)) + " (" + k + ")"; }).join(" · ") + '</p>';
  h += '<div class="panel tablebox" style="padding:0;max-height:900px"><table class="hx-int"><thead><tr><th>ID</th><th>Paciente</th><th>EPS</th><th>Indicador alterado</th><th>Resultado</th><th>Fecha</th><th>Riesgo clínico</th><th>Acción requerida</th><th>Responsable</th><th class="num">Plazo</th><th>Estado</th></tr></thead><tbody>' +
    L.map(x => '<tr><td class="mono">' + esc(x.p.ID) + '</td><td>' + esc(nombre(x.p)) + '</td><td>' + esc(x.p.EPS || "—") + '</td><td>' + esc(x.ind) + '</td><td class="mono">' + esc(x.res) + '</td><td class="mono" style="white-space:nowrap">' + (x.f ? M3[x.f.getMonth()] + " " + x.f.getFullYear() + (x.venc ? '<span class="sub">fuera de ventana</span>' : '') : '<span class="sd">—</span>') + '</td><td>' + chip(x.riesgo === "Alto" ? "bad" : x.riesgo === "Medio" ? "warn" : "base", x.riesgo) + '</td><td style="font-size:12.5px;min-width:260px">' + esc(x.acc) + '</td><td style="font-size:12.5px">' + esc(x.resp) + '</td><td class="num mono">' + x.plazo + ' d</td><td>' + esc(x.estado) + '</td></tr>').join("") + '</tbody></table></div>';
  h += '<p class="note">La lista usa el último resultado disponible de cada paciente aunque esté fuera de la ventana del indicador (se marca «fuera de ventana»): un valor crítico de hace tres meses sigue necesitando conducta. Riesgo, acción y plazo son una propuesta de gestión del módulo; la conducta la define el nefrólogo tratante. El estado no se guarda: exporte la matriz y llévela como seguimiento.</p>';
  return h; }

/* ---------- fichas técnicas ---------- */
const FT = {
 dia_10_adul: ["Medir la dependencia de catéter como acceso de hemodiálisis", "Resultado", "Prevalente", "Acceso vascular vigente; ruta a FAV y soporte de exclusión", "Coordinación de enfermería"],
 dia_11_adul: ["Verificar que la dosis de diálisis entregada sea suficiente", "Resultado", "Prevalente", "Kt/V con fecha, tipo (spKt/V, eKt/V, semanal) y método; frecuencia semanal", "Nefrología"],
 dia_20_adul: ["Verificar el tiempo efectivo de cada sesión", "Proceso", "Prevalente", "Duración efectiva de cada sesión; sesiones por semana", "Coordinación de enfermería"],
 dia_13_adul: ["Seguir el control de la anemia", "Resultado", "Prevalente", "Hemoglobina prediálisis con fecha", "Nefrología"],
 dia_15_adul: ["Seguir el estado nutricional", "Resultado", "Prevalente", "Albúmina sérica con fecha", "Nutrición"],
 dia_17_adul: ["Seguir el control del fósforo", "Resultado", "Prevalente", "Fósforo sérico con fecha", "Nefrología y nutrición"],
 dia_27_adul: ["Seguir el control del hiperparatiroidismo secundario", "Resultado", "Prevalente", "PTH con fecha; paratiroidectomía; tratamiento antineoplásico", "Nefrología"],
 dia_29_adul: ["Vigilar la hipercalcemia", "Resultado", "Prevalente", "Calcio total sin corregir, todas las mediciones del trimestre", "Nefrología"],
 dia_21_adul: ["Medir el acceso a lista de espera de trasplante", "Proceso", "Prevalente del periodo", "Concepto de idoneidad con soporte; fecha de inclusión en lista; disentimiento", "Nefrología y trabajo social"],
 dia_23_adul: ["Medir el abandono de la terapia", "Seguimiento", "Prevalente del periodo", "Egresos con causa; desistimiento firmado; búsqueda activa", "Trabajo social y coordinación"],
 dia_25_adul: ["Conocer la carga de hepatitis C confirmada", "Seguimiento", "Prevalente del periodo", "Anti-VHC; carga viral con fecha; tratamiento", "Nefrología y laboratorio"],
 dia_26_adul: ["Verificar la protección contra hepatitis B al iniciar HD", "Proceso", "Incidente", "Anti-HBs con fecha; fechas de las dosis; clasificación de no respondedor con soporte", "Enfermería"],
 dia_31_adul: ["Medir la carga de hospitalización", "Resultado", "Prevalente del periodo (episodios)", "Fecha de ingreso y de egreso de cada hospitalización; causa", "Coordinación asistencial"],
 dia_33_adul: ["Vigilar la bacteriemia asociada a catéter", "Resultado", "Expuestos a CVC (episodios)", "Hemocultivos; criterio diagnóstico; fecha de inserción y retiro de cada catéter", "Comité de infecciones"],
 dia_34_adul: ["Medir el inicio planeado de la hemodiálisis", "Proceso", "Incidente", "Acceso usado en la primera sesión; fecha de creación y madurez de la FAV", "Nefrología"],
 dia_35_adul: ["Verificar la evaluación de calidad de vida al inicio", "Proceso", "Incidente (HD y DP)", "Escala validada, fecha y puntaje", "Psicología"],
 dia_36_adul: ["Verificar la evaluación periódica de calidad de vida", "Proceso", "Prevalente (HD y DP)", "Escala validada, fecha y puntaje", "Psicología"]
};
const NUMDEN = {
 dia_10_adul: ["Adultos en HD con CVC como acceso vascular al cierre", "Adultos en HD al cierre, menos las exclusiones documentadas", "(numerador / denominador) × 100"],
 dia_11_adul: ["Adultos en HD al cierre con Kt/V total ≥ 1,2", "Adultos en HD al cierre", "(numerador / denominador) × 100"],
 dia_20_adul: ["Adultos con duración promedio de sesión ≥ 240 minutos en el último mes", "Adultos en HD con tres o más sesiones por semana en ese mes", "(numerador / denominador) × 100"],
 dia_13_adul: ["Adultos en HD con Hb ≥ 10 g/dL en el último trimestre", "Adultos en HD al cierre", "(numerador / denominador) × 100"],
 dia_15_adul: ["Adultos en HD con albúmina ≥ 4 g/dL en el último trimestre", "Adultos en HD al cierre", "(numerador / denominador) × 100"],
 dia_17_adul: ["Adultos en HD con fósforo de 2,5 a 6 mg/dL (límites incluidos) en el último trimestre", "Adultos en HD al cierre", "(numerador / denominador) × 100"],
 dia_27_adul: ["Adultos en HD con PTH ≥ 130 y ≤ 600 pg/mL en los últimos seis meses", "Adultos en HD al cierre, menos las exclusiones", "(numerador / denominador) × 100"],
 dia_29_adul: ["Adultos en HD con promedio de calcio total no corregido > 10,5 mg/dL en el último trimestre", "Adultos en HD al cierre", "(numerador / denominador) × 100"],
 dia_21_adul: ["Adultos en HD incluidos en lista de espera durante el periodo", "Adultos en HD médicamente idóneos para trasplante durante el periodo", "(numerador / denominador) × 100"],
 dia_23_adul: ["Adultos en HD que abandonaron el tratamiento durante el periodo", "Adultos en HD durante el periodo", "(numerador / denominador) × 100"],
 dia_25_adul: ["Adultos en HD con carga viral de VHC positiva documentada", "Adultos en HD durante el periodo", "(numerador / denominador) × 100"],
 dia_26_adul: ["Adultos incidentes en HD con anti-HBs ≥ 10 UI/mL", "Adultos que iniciaron HD durante el periodo, menos las exclusiones", "(numerador / denominador) × 100"],
 dia_31_adul: ["Episodios de hospitalización de más de 24 horas durante el periodo", "Suma de meses-persona de exposición", "episodios / meses-persona"],
 dia_33_adul: ["Episodios confirmados de ITS-CVC durante el periodo", "Suma de días de exposición a CVC", "(episodios / días-catéter) × 1.000"],
 dia_34_adul: ["Adultos que inician HD con FAV (texto de la ficha)", "Adultos menores de 80 años que inician HD con FAV (texto de la ficha)", "Por validar"],
 dia_35_adul: ["Adultos evaluados con escala validada al iniciar HD o DP", "Adultos que iniciaron HD o DP durante el periodo", "(numerador / denominador) × 100"],
 dia_36_adul: ["Adultos prevalentes en HD o DP evaluados con escala validada en el periodo", "Adultos en HD o DP durante el periodo", "(numerador / denominador) × 100"]
};
function fichaRows(){ return HX.CAC().map(d => { const f = FT[d.c] || [], nd_ = NUMDEN[d.c] || []; return { c: d.c, n: d.n, obj: f[0], dom: f[1], pob: f[2], num: nd_[0], den: nd_[1], form: nd_[2], unidad: d.t === "rate" ? (d.c === "dia_33_adul" ? "infecciones por 1.000 días-catéter (× 1.000)" : "episodios por mes-persona (× 1)") : "porcentaje (× 100)", fuente: d.src, vars: f[3], win: d.win, perCac: "Anual", perInst: "Mensual, acumulado trimestral y acumulado anual", excl: d.ex || "Ninguna en la ficha resumida", rango: refTxt(d), sentido: d.dir === "down" ? "Menor es mejor" : "Mayor es mejor", ausentes: d.t === "rate" ? "Evento sin confirmación no cuenta; se lista aparte" : "El paciente sin dato permanece en el denominador y no entra al numerador; se informa aparte", resp: f[4], obs: d.nota || "", pag: "Por verificar en el documento de la CAC" }; }); }
function cacFichas(){ const R = fichaRows(); const sel = R.find(r => r.c === UI.sel) || R[0];
  const dl = (rows) => '<dl class="hx-ficha">' + rows.map(([k, v, inst]) => '<dt>' + k + (inst ? ' <span class="tag inst">Institucional</span>' : '') + '</dt><dd>' + esc(v || "—") + '</dd>').join("") + '</dl>';
  let h = '<div class="hx-fgrid"><div class="panel" style="padding:0"><div class="tablebox" style="max-height:none"><table><thead><tr><th>Código</th><th>Indicador</th><th>Dominio</th><th>Población</th></tr></thead><tbody>' + R.map(r => '<tr data-hx="sel|' + r.c + '" class="' + (sel.c === r.c ? "sel" : "") + '" tabindex="0"><td class="mono" style="white-space:nowrap">' + esc(r.c) + '</td><td>' + esc(r.n) + '</td><td>' + esc(r.dom) + '</td><td>' + esc(r.pob) + '</td></tr>').join("") + '</tbody></table></div></div>';
  h += '<div class="panel"><span class="tag cac">' + esc(sel.c) + '</span><h3 style="margin:6px 0 10px">' + esc(sel.n) + '</h3>' + dl([["Objetivo de medición", sel.obj, 1], ["Dominio", sel.dom, 1], ["Población objeto y tipo", sel.pob], ["Numerador", sel.num], ["Denominador", sel.den], ["Fórmula", sel.form], ["Unidad y factor", sel.unidad], ["Ventana de observación", sel.win], ["Inclusiones y exclusiones", sel.excl], ["Rango de cumplimiento", sel.rango], ["Sentido deseable", sel.sentido], ["Periodicidad oficial CAC", sel.perCac], ["Monitoreo institucional", sel.perInst, 1], ["Fuente primaria", sel.fuente, 1], ["Variables mínimas", sel.vars, 1], ["Datos ausentes o inconsistentes", sel.ausentes, 1], ["Responsable de captura y análisis", sel.resp, 1], ["Observaciones técnicas", sel.obs, 1], ["Página en el consenso", sel.pag]]) + '</div></div>';
  h += '<p class="note">Numerador, denominador, fórmula, ventana, exclusiones y rangos son los de las fichas resumidas del consenso CAC (actualización de abril de 2026) que entregó la coordinación. Lo marcado como «Institucional» es propuesta de POSMÉDICA: objetivo, dominio, fuente, variables, regla de datos ausentes y responsable. El documento completo de la CAC está en su portal con acceso restringido y no se pudo consultar desde aquí: la página de cada ficha y cualquier observación adicional deben verificarse contra ese texto antes del reporte oficial.</p>';
  return h; }

/* ---------- informe gerencial ---------- */
function cacInforme(R, c, ps){ const by = s => R.filter(r => r.status === s); const li = a => a.length ? '<ul>' + a.map(x => '<li>' + x + '</li>').join("") + '</ul>' : '<p class="note">Ninguno a este corte.</p>';
  const gap = r => { const d = r.def, v = d.t === "pct" ? r.val * 100 : r.val; const g = d.dir === "down" ? v - d.cuts[0] : d.cuts[0] - v; return g; };
  const brechas = by("bajo").concat(by("medio")).sort((a, b) => gap(b) - gap(a));
  const fr = r => '<strong>' + esc(r.def.n) + '</strong> (' + esc(r.def.c) + '): ' + fmtVal(r.def, r.val) + (r.def.t === "pct" ? ', ' + r.n + ' de ' + r.d : '') ;
  const L = intervenciones(c); const byP = {}; L.forEach(x => { if(x.riesgo === "Alto") (byP[x.p.ID] = byP[x.p.ID] || []).push(x); });
  const top = Object.entries(byP).sort((a, b) => b[1].length - a[1].length).slice(0, 8);
  const E = epsDe(c, ps).filter(([k, n]) => k && n >= 10).map(([e]) => e); const cmpE = [];
  if(E.length >= 2){ const M = E.map(e => evalAll(c, ps, e)); R.forEach((r, i) => { if(r.def.t !== "pct" || !["alto","medio","bajo","base"].includes(r.status)) return; const vals = M.map((m, k) => ({ e: E[k], r: m[i] })).filter(z => z.r.val != null && z.r.d >= 10 && !["ne","nc"].includes(z.r.status)); if(vals.length < 2) return; const mx = vals.reduce((a, b) => a.r.val > b.r.val ? a : b), mn = vals.reduce((a, b) => a.r.val < b.r.val ? a : b); const dif = (mx.r.val - mn.r.val) * 100; if(dif >= 10) cmpE.push({ dif, t: '<strong>' + esc(r.def.n) + '</strong>: ' + esc(mx.e) + ' ' + pct(mx.r.val) + ' (' + mx.r.n + '/' + mx.r.d + ') frente a ' + esc(mn.e) + ' ' + pct(mn.r.val) + ' (' + mn.r.n + '/' + mn.r.d + '), ' + f1(dif, 0) + ' puntos de diferencia' }); }); }
  cmpE.sort((a, b) => b.dif - a.dif);
  const hx = HX.meta(); const K = cohorte(c, ps, ST.eps); const egInf = K.egr.filter(e => e.inf).length; const ll = lastLabMonth();
  const cvc = R.find(r => r.def.c === "dia_10_adul");
  const prio = [];
  if(cvc && cvc.val != null && cvc.val > 0.2) prio.push('<strong>Acceso vascular.</strong> ' + cvc.n + ' de ' + cvc.d + ' pacientes dializan por catéter (' + pct(cvc.val) + '; el rango alto de la CAC es menos de 10 %). Es la brecha más grande y la que más pesa en infección y hospitalización. Abrir ruta a FAV paciente por paciente y dejar con soporte a quien no sea candidato o no acepte: hoy ninguna exclusión está documentada, así que todos cuentan en contra.');
  if(L.filter(x => x.riesgo === "Alto" && /Hemoglobina/.test(x.ind)).length) prio.push('<strong>Anemia severa.</strong> ' + L.filter(x => x.riesgo === "Alto" && /Hemoglobina/.test(x.ind)).length + ' pacientes con última Hb menor de 8 g/dL: revisión individual esta semana.');
  if(L.filter(x => x.riesgo === "Alto" && /Kt\/V/.test(x.ind)).length) prio.push('<strong>Dosis de diálisis.</strong> ' + L.filter(x => x.riesgo === "Alto" && /Kt\/V/.test(x.ind)).length + ' pacientes con último Kt/V menor de 1,2: revisar prescripción y acceso.');
  const fos = R.find(r => r.def.c === "dia_17_adul"); if(fos && ["bajo","medio"].includes(fos.status)) prio.push('<strong>Fósforo.</strong> ' + pct(fos.val) + ' en rango frente a más de 80 % del rango alto: consulta de nutrición dirigida y revisión de quelantes.');
  if(ll && addMonths(ll, 3) < c) prio.push('<strong>Laboratorios.</strong> No hay resultados cargados después de ' + mesTxt(ym(ll)) + '. Sin ellos no se puede evaluar anemia, nutrición, metabolismo mineral ni Kt/V al corte.');
  if(egInf) prio.push('<strong>Egresos.</strong> Clasificar la causa de los ' + egInf + ' egresos del periodo. Mientras tanto no se puede hablar de mortalidad ni de abandono.');
  let h = '<div class="panel hx-inf"><h3>Informe gerencial · corte ' + fd(c) + '</h3><p class="note">Generado con los resultados del tablero a este corte' + (ST.eps ? ' para ' + esc(ST.eps) : '') + '. Cambia solo cuando cambian los datos.</p>';
  h += '<h4>1. Indicadores con mayores brechas</h4>' + li(brechas.map(r => fr(r) + ' · ' + STATUS_TXT[r.status].toLowerCase() + ' · rango alto: ' + esc(refTxt(r.def).split(" · ")[0].replace("Alto ", ""))));
  h += '<h4>2. Indicadores en el rango alto de la CAC</h4>' + li(by("alto").map(fr));
  h += '<h4>3. Línea de base medida (sin rango CAC)</h4>' + li(by("base").map(r => fr(r) + (r.alt ? '. ' + esc(r.alt) : '')));
  h += '<h4>4. Resultados que no son calculables o no son definitivos, y por qué</h4>' + li(by("ne").concat(by("nc"), by("pre"), by("inc")).map(r => '<strong>' + esc(r.def.n) + '</strong> (' + esc(r.def.c) + ') · ' + STATUS_TXT[r.status].toLowerCase() + ': ' + esc(r.status === "nc" ? "no hay pacientes en el denominador para este periodo." : r.status === "inc" ? "solo " + pc(r.d - r.sd.length, r.d) + " de los pacientes tiene dato en la ventana." : (r.ne || r.prelim || ""))));
  h += '<h4>5. Pacientes con mayor riesgo clínico</h4>' + li(top.map(([id, a]) => { const p = IDX.pac.get(id); return '<strong>' + esc(id + " " + nombre(p)) + '</strong> (' + esc(p.EPS || "sin EPS") + '): ' + a.map(x => esc(x.ind.replace(/ \(dia_\d+\)/, "") + " " + x.res)).join("; "); })) + '<p class="note">Detalle y acciones en la pestaña «Pacientes a intervenir».</p>';
  h += '<h4>6. Diferencias entre EPS</h4>' + (E.length < 2 ? '<p class="note">Solo ' + (E.length ? E[0] : 'ninguna EPS') + ' tiene 10 o más pacientes activos; no hay con quién comparar de forma estable.</p>' : (cmpE.length ? li(cmpE.slice(0, 6).map(x => x.t)) : '<p class="note">Entre ' + E.map(esc).join(" y ") + ' no hay diferencias de 10 puntos o más en los indicadores evaluables.</p>') + '<p class="note">Se comparan solo las EPS con 10 o más pacientes (' + E.map(esc).join(", ") + '). Las demás tienen tan pocos que su porcentaje no es interpretable. Las diferencias no están ajustadas por edad, antigüedad en diálisis ni comorbilidad.</p>');
  h += '<h4>7. Intervenciones que deben priorizarse</h4>' + li(prio);
  h += '<h4>8. Limitaciones de la calidad de los datos</h4>' + li([
    'La fuente son Dashboards mensuales de Excel. Hay archivo de ' + (hx ? hx.fuentes.map(f => M3[+f.mes.slice(5) - 1]).join(", ") : "—") + '; de los meses intermedios solo existen los laboratorios que traía el consolidado.',
    'Los laboratorios no tienen fecha de toma, solo mes. El Kt/V no dice tipo ni método.',
    'La asistencia es una marca por día: no hay duración de la sesión, peso, tensión arterial intradiálisis ni prescripción.',
    'No se registran hemocultivos, fechas de inserción y retiro de catéteres, acceso al inicio de la diálisis, serología de hepatitis C, escala de calidad de vida ni causa de los egresos.',
    'Las hospitalizaciones son notas diarias sin fecha de ingreso ni de egreso.',
    (hx ? hx.warn.length : 0) + ' avisos de lectura (documentos cruzados entre pacientes, ID repetidos, fechas ilegibles, pacientes en sala que no están en el maestro). Están en «Fuentes y calidad del dato».'
  ]);
  h += '<h4>9. Mejoras para los próximos 30 días</h4>' + li([
    (ll && addMonths(ll, 1) < monthStart(c) ? 'Cargar los laboratorios posteriores a ' + mesTxt(ym(ll)) + ' con su fecha de toma.' : 'Cargar cada mes los laboratorios con su fecha de toma.') + ' Responsable: laboratorio y coordinación de enfermería. Medida: completitud de Hb, fósforo y Kt/V ≥ 90 % en el siguiente cierre.',
    'Clasificar la causa y la fecha de cada egreso del año. Responsable: trabajo social y coordinación. Medida: 0 egresos sin causa.',
    'Completar en el maestro inicio de TRR, fecha de nacimiento, EPS, HTA y DM de los pacientes nuevos, corregir el ID repetido e ingresar al maestro a quien dializa sin estar en él. Responsable: admisiones y enfermería. Medida: 0 pacientes sin clasificar.',
    'Revisión individual de los pacientes con hallazgos de riesgo alto. Responsable: nefrología. Medida: conducta registrada en la historia de cada uno.',
    'Registrar la duración efectiva de cada sesión (hora de conexión y de desconexión). Responsable: enfermería de sala. Medida: dia_20 calculable en el siguiente cierre.'
  ]);
  h += '<h4>10. Mejoras para los próximos 90 días</h4>' + li([
    'Ruta de acceso vascular para cada paciente con catéter: valoración, mapeo, cirugía o soporte de no candidato. Medida: 100 % con ruta registrada; meta de catéter a definir por la coordinación.',
    'Registro de catéteres (inserción, retiro, tipo) y de hemocultivos de cada sospecha de bacteriemia. Medida: dia_33 calculable con días-catéter reales.',
    'Tamizaje de hepatitis C y control de anti-HBs de toda la cohorte, con fecha; esquema de vacunación para quien tenga anti-HBs menor de 10. Medida: dia_25 calculable; cobertura de anti-HBs 100 %.',
    'Concepto de idoneidad para trasplante con soporte para cada paciente. Medida: 0 pacientes «sin evaluar».',
    'Escala de calidad de vida validada al ingreso y una vez al año. Medida: dia_35 y dia_36 calculables.',
    'Validar con la CAC la definición de dia_34 y confirmar en el texto completo del consenso si los denominadores exigen 90 días en diálisis.'
  ]);
  return h + '</div>'; }

/* ---------- fuentes y calidad del dato ---------- */
function cacDatos(){ const hx = HX.meta();
  let h = '<div class="panel"><h3>Qué alimenta los indicadores</h3><p class="note">Cada mes se suma el Dashboard nuevo a la base y todo se recalcula. Si el archivo trae meses anteriores corregidos, manda el archivo más reciente y la diferencia queda anotada.</p><div class="copyrow" style="margin:8px 0 12px"><label class="btn primary" for="hxfile">Sumar Dashboard mensual (.xlsx)</label><input type="file" id="hxfile" accept=".xlsx,.xls" hidden><label class="btn" for="hxbook">Abrir un Libro HD guardado</label><input type="file" id="hxbook" accept=".xlsx" hidden><button type="button" class="btn" data-hx="book">Descargar Libro HD con todo lo cargado</button><button type="button" class="btn" data-hx="reload">Volver a la base embebida</button></div>';
  if(hx && hx.fuentes.length){ h += '<div class="tablebox"><table><thead><tr><th>Mes</th><th>Archivo</th><th class="num">Pacientes HD en el maestro</th><th>Laboratorios que trae</th><th class="num">Resultados nuevos</th><th class="num">Corregidos</th><th class="num">Sesiones</th><th class="num">Complicaciones</th><th class="num">Novedades</th><th>Observación</th></tr></thead><tbody>' + hx.fuentes.map(f => '<tr><td>' + esc(mesTxt(f.mes)) + '</td><td style="font-size:12.5px">' + esc(f.archivo) + '</td><td class="num mono">' + f.maestro + '</td><td style="font-size:12.5px">' + (f.labs.length ? f.labs.map(m => M3[+m.slice(5) - 1]).join(", ") : '<span class="sd">ninguno</span>') + '</td><td class="num mono">' + f.labNuevos + '</td><td class="num mono">' + (f.labCorregidos || "") + '</td><td class="num mono">' + f.sesiones + '</td><td class="num mono">' + f.eventos + '</td><td class="num mono">' + f.novedades + '</td><td style="font-size:12.5px">' + [f.eventosAjenos ? "las complicaciones del archivo son copia de otro mes" : "", f.novedadesAjenas ? "las novedades son copia de otro mes" : "", f.asiOk != null && f.asiOk < 0.9 ? Math.round(f.asiOk * 100) + " % de las marcas cae en el día del turno" : "", f.hasta ? "registros hasta " + fd(pdate(f.hasta)) : ""].filter(Boolean).join(" · ") + '</td></tr>').join("") + '</tbody></table></div>'; }
  else h += '<p class="note">El libro cargado no viene de la lectura de Dashboards; los indicadores usan lo registrado en la aplicación.</p>';
  h += '</div>';
  if(hx && hx.warn.length) h += '<div class="panel" style="margin-top:12px"><h3>Avisos de lectura (' + hx.warn.length + ')</h3><p class="note">Nada de esto se corrigió en silencio. Lo que dice «se leyó como» o «se asignó» es una decisión de lectura que debe confirmarse en el Dashboard.</p><ul class="hx-warn">' + hx.warn.map(w => '<li>' + esc(w) + '</li>').join("") + '</ul></div>';
  if(hx && hx.retirados && hx.retirados.length) h += '<div class="panel" style="margin-top:12px"><h3>Registro de números de identificación</h3><div class="tablebox"><table><thead><tr><th>ID</th><th>Estado</th><th>Paciente</th><th>Motivo</th></tr></thead><tbody>' + hx.retirados.map(r => '<tr><td class="mono">' + esc(r.id) + '</td><td>' + esc(r.estado) + '</td><td>' + esc(r.paciente) + '</td><td style="font-size:12.5px">' + esc(r.motivo) + '</td></tr>').join("") + '</tbody></table></div></div>';
  return h; }

/* ---------- exportación de los cinco entregables ---------- */
async function expCac(){ const c = ST.corte, ps = ST.ps, eps = ST.eps; const R = evalAll(c, ps, eps); const pcut = prevCut(c); const Q = evalAll(pcut, ps > pcut ? addDays(addMonths(pcut, -12), 1) : ps, eps);
  const T = R.map((r, i) => ({ r, q: Q[i] })); const E = epsDe(c, ps).filter(([k]) => k).map(([e]) => e); const M = E.map(e => evalAll(c, ps, e)); const hx = HX.meta();
  const epsRows = []; R.forEach((r, i) => { [["Unidad completa", r]].concat(E.map((e, k) => [e, M[k][i]])).forEach(([e, z]) => { const [n, dd] = numDen(z); epsRows.push({ c: r.def.c, n: r.def.n, t: r.def.t, e, num: n, den: typeof dd === "number" ? dd : parseFloat(String(dd).replace(/\./g, "").replace(",", ".")), val: z.val, st: STATUS_TXT[z.status], small: r.def.t === "pct" && z.d < 10 ? "SI" : "NO" }); }); });
  const rv = z => z.val == null ? "" : z.def.t === "pct" ? Math.round(z.val * 1000) / 10 : Math.round(z.val * 10000) / 10000;
  const nom = []; R.forEach(r => { if(r.def.t === "rate"){ r.list.forEach(x => nom.push({ c: r.def.c, p: x.p, rol: "Registro considerado", v: x.v })); return; } r.den.forEach(x => nom.push({ c: r.def.c, p: x.p, rol: r.num.some(n => n.p === x.p) ? "Numerador" : (r.sd && r.sd.includes(x.p) ? "Denominador · sin dato" : "Denominador"), v: x.v })); r.excl.forEach(x => nom.push({ c: r.def.c, p: x.p, rol: "Excluido", v: x.why })); });
  await exportSheets("Indicadores_CAC_HD_POSMEDICA_corte_" + iso(c) + ".xlsx", [
    ["1_Fichas_tecnicas", fichaRows(), [["Código CAC", r => r.c], ["Indicador", r => r.n], ["Objetivo (institucional)", r => r.obj], ["Dominio (institucional)", r => r.dom], ["Población", r => r.pob], ["Numerador", r => r.num], ["Denominador", r => r.den], ["Fórmula", r => r.form], ["Unidad y factor", r => r.unidad], ["Ventana", r => r.win], ["Exclusiones", r => r.excl], ["Rango de cumplimiento", r => r.rango], ["Sentido", r => r.sentido], ["Periodicidad CAC", r => r.perCac], ["Monitoreo institucional", r => r.perInst], ["Fuente (institucional)", r => r.fuente], ["Variables mínimas (institucional)", r => r.vars], ["Datos ausentes (institucional)", r => r.ausentes], ["Responsable (institucional)", r => r.resp], ["Observaciones", r => r.obs], ["Página en el consenso", r => r.pag]]],
    ["2_Tablero", T, [["Indicador", x => x.r.def.n], ["Código CAC", x => x.r.def.c], ["Numerador", x => x.r.n], ["Denominador", x => x.r.def.t === "rate" ? Math.round(x.r.d * 10) / 10 : x.r.d], ["Resultado", x => rv(x.r)], ["Unidad", x => x.r.def.t === "pct" ? "%" : x.r.def.unit], ["Meta o referencia", x => refTxt(x.r.def)], ["Clasificación", x => STATUS_TXT[x.r.status]], ["Resultado periodo anterior (" + iso(pcut) + ")", x => rv(x.q)], ["Variación", x => x.r.val == null || x.q.val == null ? "" : Math.round((x.r.val - x.q.val) * (x.r.def.t === "pct" ? 1000 : 10000)) / (x.r.def.t === "pct" ? 10 : 10000)], ["Datos faltantes", x => x.r.def.t === "rate" ? "" : (x.r.sd ? new Set(x.r.sd).size : 0)], ["Completitud %", x => x.r.comp == null ? "" : Math.round(x.r.comp * 1000) / 10], ["Motivo si no es definitivo", x => x.r.ne || x.r.prelim || x.r.alt || ""], ["Corte", () => c], ["Inicio del periodo", () => ps], ["EPS filtrada", () => eps || "Todas"], ["Criterio 90 días", () => HX.n90 ? "Aplicado" : "No aplicado"]]],
    ["3_Por_EPS", epsRows, [["Código CAC", r => r.c], ["Indicador", r => r.n], ["EPS", r => r.e], ["Numerador", r => r.num], ["Denominador", r => r.den], ["Resultado", r => r.val == null ? "" : r.t === "pct" ? Math.round(r.val * 1000) / 10 : Math.round(r.val * 10000) / 10000], ["Unidad", r => r.t === "pct" ? "%" : "tasa"], ["Clasificación", r => r.small === "SI" && /Cumplimiento/.test(r.st) ? "Sin clasificar (n < 10)" : r.st], ["Denominador menor de 10", r => r.small]]],
    ["4_Pacientes_a_intervenir", intervenciones(c), [["Identificador", x => x.p.ID], ["Documento", x => x.p.Documento], ["Paciente", x => nombre(x.p)], ["EPS", x => x.p.EPS], ["Indicador alterado", x => x.ind], ["Resultado", x => x.res], ["Fecha", x => x.f], ["Fuera de ventana", x => x.venc ? "SI" : ""], ["Riesgo clínico", x => x.riesgo], ["Acción requerida", x => x.acc], ["Responsable", x => x.resp], ["Plazo (días)", x => x.plazo], ["Estado", x => x.estado]]],
    ["5_Detalle_nominal", nom, [["Código CAC", x => x.c], ["ID", x => x.p.ID], ["Paciente", x => nombre(x.p)], ["EPS", x => x.p.EPS], ["Condición", x => x.rol], ["Dato", x => typeof x.v === "number" ? Math.round(x.v * 100) / 100 : x.v]]],
    ["6_Avisos_de_lectura", (hx ? hx.warn : []).map(w => ({ w })), [["Aviso", x => x.w]]]
  ]); }

/* ---------- sumar un Dashboard nuevo a la base ---------- */
function addDashboard(file){ const rd = new FileReader(); rd.onload = ev => { let wb; try { wb = XLSX.read(new Uint8Array(ev.target.result), { type: "array", cellDates: false }); } catch(e){ toast("No se pudo leer el archivo: " + e.message); return; }
    if(!isDashboard(wb)){ toast("Ese archivo no tiene la hoja 2.PACIENTES: no es un Dashboard mensual."); return; }
    const m = monthFromName(file.name, wb); const hx = HX.meta();
    openDlg("Sumar «" + file.name + "» a la base", '<p class="note">Se agregan el maestro, los laboratorios, las asistencias, las complicaciones y las novedades de este archivo. Lo que ya estaba cargado se conserva; si el archivo corrige un resultado anterior, queda el del archivo y se anota.</p><label class="f">¿A qué mes corresponden las asistencias y novedades de este archivo?<input type="month" id="hx_m" value="' + m + '"></label><p class="note">El encabezado interno del Dashboard no siempre está actualizado; se propone el mes del nombre del archivo.' + (hx && hx.fuentes.some(f => f.mes === m) ? ' Ya hay un archivo de ese mes: se reemplaza su registro de fuente y se suman los datos nuevos.' : '') + '</p>', "Sumar a la base", () => { const v = $("hx_m").value; if(!/^\d{4}-\d{2}$/.test(v)) return "Elija el mes.";
      try { const pl = HDX.parseDashboard(XLSX, wb, file.name, v); const r = HDX.mergePayload(ST.book, pl); HDX.finalize(ST.book); HX.hydrate(ST.book); IDX.dirty = true; reindex(); ST.dirty = true; ST.demo = false; ST.imp = ST.imp || {}; ST.imp.warn = (ST.book.cfgv.hdx.warn || []).slice(); ST.imp.fn = file.name; if(ST.book.cfgv.hdx.tarifas) ST.imp.tarifas = ST.book.cfgv.hdx.tarifas;
        logW("IMPORTA", "log", file.name, r.labs + " resultados, " + r.sesiones + " sesiones, " + r.eventos + " complicaciones, " + r.novedades + " novedades de " + v); HX.siis(); const act = ST.book.pac.filter(p => activeAt(p, ST.corte)).length; ST.src = "Base real POSMÉDICA + " + file.name + " (" + act + " activos al corte · sin datos generados)"; try { bookInfo(); } catch(e){} render(); toast("Sumado: " + r.labs + " resultados nuevos, " + r.corregidos + " corregidos, " + r.sesiones + " sesiones, " + r.eventos + " complicaciones. Descargue el Libro HD para conservarlo."); }
      catch(e){ console.error(e); return "No se pudo sumar: " + e.message; } }); };
  rd.readAsArrayBuffer(file); }

/* ---------- enrutamiento ---------- */
const render30 = render;
render = function(){
  render30();
  try { if(!$("hdapp") || $("hdapp").hidden) return; const sub = V12.state.hd && V12.state.hd.sub; if(sub !== VIEW_EPI && sub !== VIEW_CAC) return; const out = $("out"); if(!out || !ST.book) return;
    try { out.innerHTML = sub === VIEW_EPI ? vEpi() : vCac(); } catch(e){ console.error(e); out.innerHTML = '<div class="alert bad"><p>Error al dibujar esta pestaña: ' + esc(e.message) + '</p></div>'; }
  } catch(e){ console.error(e); }
};
document.addEventListener("click", e => { const el = e.target.closest("[data-hx]"); if(!el) return; const [a, x] = el.dataset.hx.split("|");
  if(a === "corte"){ ST.corte = pdate(x); if(ST.ps > ST.corte) ST.ps = new Date(ST.corte.getFullYear(), 0, 1); syncBar(); render(); }
  else if(a === "ps"){ ST.ps = pdate(x); syncBar(); render(); }
  else if(a === "tab"){ UI.tab = x; render(); }
  else if(a === "epitab"){ UI.epiTab = x; render(); }
  else if(a === "sel"){ UI.sel = x; ST.sel.ind = x; const y = window.scrollY; render(); window.scrollTo(0, y); }
  else if(a === "book") exportBook();
  else if(a === "xcac") expCac();
  else if(a === "xepi") expEpi();
  else if(a === "reload"){ if(ST.dirty && !confirmOk()) return; hdxLoadBase(false); render(); }
});
function confirmOk(){ if(HX._conf && Date.now() - HX._conf < 6000){ HX._conf = 0; return true; } HX._conf = Date.now(); toast("Hay cambios sin descargar. Pulse otra vez «Volver a la base embebida» para descartarlos."); return false; }
document.addEventListener("keydown", e => { if(e.key !== "Enter") return; const el = e.target.closest && e.target.closest("tr[data-hx]"); if(el) el.click(); });
document.addEventListener("change", e => { const t = e.target; if(!t) return;
  if(t.dataset && t.dataset.hxc === "n90"){ HX.n90 = t.checked; render(); }
  else if(t.dataset && t.dataset.hxc === "thr"){ HX.thr = +t.value; render(); }
  else if(t.id === "hxfile"){ const f = t.files[0]; t.value = ""; if(f) addDashboard(f); }
  else if(t.id === "hxbook"){ const f = t.files[0]; t.value = ""; if(f) onFile(f); }
});
HX.views = { vEpi, vCac };
})();


