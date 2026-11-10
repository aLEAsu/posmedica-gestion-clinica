// Código propio del proyecto. Hemodiálisis · lectura estricta de los Dashboards mensuales (v3.1).

/* =====================================================================================================
   SIGC POSMÉDICA v3.1 · HDX · Lectura estricta de los Dashboards mensuales de hemodiálisis
   Regla de oro: aquí no se genera ningún dato. Lo que no está en el Excel queda vacío y se reporta.
   El mismo código corre en Node (para construir la base embebida) y en el navegador (para sumar meses).
   ===================================================================================================== */
(function(root){
"use strict";
const HDX = root.HDX = root.HDX || {};
HDX.ver = "3.1";

/* ---------- utilidades puras ---------- */
const nrm = s => String(s == null ? "" : s).normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/\s+/g, " ").trim();
const p2 = n => String(n).padStart(2, "0");
const numv = v => { if(v == null || v === "") return null; if(typeof v === "number") return isFinite(v) ? v : null; const s = String(v).replace(",", ".").replace(/[^\d.\-]/g, ""); if(s === "" || s === "-" || s === ".") return null; const n = parseFloat(s); return isFinite(n) ? n : null; };
const docStr = v => v == null || v === "" ? "" : String(typeof v === "number" ? Math.round(v) : v).replace(/\.0$/, "").trim();
const txt = v => v == null ? "" : String(v).replace(/\s+/g, " ").trim();
/* Fecha → "AAAA-MM-DD" o null. No corrige: si el año no es plausible devuelve null. */
function isoOf(v){
  if(v == null || v === "") return null;
  if(v instanceof Date){ if(isNaN(v)) return null; return v.getFullYear() + "-" + p2(v.getMonth() + 1) + "-" + p2(v.getDate()); }
  if(typeof v === "number"){ if(v < 1000) return null; const d = new Date(Math.round((v - 25569) * 864e5)); return d.getUTCFullYear() + "-" + p2(d.getUTCMonth() + 1) + "-" + p2(d.getUTCDate()); }
  const s = String(v).trim();
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  if(m){ if(+m[1] < 1900 || +m[1] > 2100) return null; return m[1] + "-" + p2(+m[2]) + "-" + p2(+m[3]); }
  m = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/.exec(s);
  if(m){ let d = +m[1], mo = +m[2]; const y = +m[3]; if(mo > 12 && d <= 12){ const t = d; d = mo; mo = t; } if(mo < 1 || mo > 12 || d < 1 || d > 31 || y < 1900 || y > 2100) return null; return y + "-" + p2(mo) + "-" + p2(d); }
  return null;
}
const ymOf = isoStr => isoStr ? isoStr.slice(0, 7) : null;
const monthEndIso = ym => { const [y, m] = ym.split("-").map(Number); return ym + "-" + p2(new Date(y, m, 0).getDate()); };
const MES_TXT = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const mesTxt = ym => { if(!ym) return ""; const [y, m] = ym.split("-").map(Number); return MES_TXT[m - 1] + " de " + y; };
function lev(a, b){ if(a === b) return 0; const m = a.length, n = b.length; if(!m) return n; if(!n) return m; let prev = Array.from({length: n + 1}, (_, i) => i); for(let i = 1; i <= m; i++){ const cur = [i]; for(let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; } return prev[n]; }
const tokSim = (a, b) => a === b ? 1 : (a.length >= 5 && b.length >= 5 && lev(a, b) <= (Math.min(a.length, b.length) >= 6 ? 2 : 1)) ? 0.8 : 0;
/* Nombre abreviado o con errores de digitación → candidato único. Todas las palabras del nombre buscado deben estar en el candidato. */
function matchName(name, cands){
  const tk = nrm(name).split(" ").filter(t => t.length > 1);
  if(!tk.length) return null;
  let best = null, bestSc = 0, tie = false;
  cands.forEach(c => {
    const all = nrm(c.name).split(" ").filter(t => t.length > 1);
    let sc = 0;
    for(const t of tk){ let mx = 0; for(const a of all){ const s = tokSim(t, a); if(s > mx) mx = s; } if(!mx) { sc = -1; break; } sc += mx; }
    if(sc <= 0) return;
    sc = sc / tk.length + Math.min(tk.length, all.length) / 100;
    if(sc > bestSc + 1e-9){ best = c; bestSc = sc; tie = false; } else if(Math.abs(sc - bestSc) < 1e-9 && c.key !== best.key) tie = true;
  });
  return tie ? null : best;
}
const mapAcc = v => { const s = nrm(v); if(!s || s === "N/A") return null; if(s.startsWith("FAV")) return "FAV"; if(/TEMPORAL/.test(s)) return "CVC temporal"; if(/CATETER|CVC/.test(s)) return "CVC tunelizado"; if(/INJERTO|PTFE/.test(s)) return "Injerto"; return null; };
const mapTx = v => { const s = nrm(v); if(!s) return "Sin evaluar"; if(/LISTA/.test(s)) return "En lista de espera"; if(/ESTUDIO|PENDIENTE/.test(s)) return "Idóneo, en estudio"; if(/TRASPLANTADO/.test(s)) return "Trasplantado"; return "Sin evaluar"; };
const TURNOS = ["L-M-V Mañana","L-M-V Tarde","M-J-S Mañana","M-J-S Tarde","M-J-V Mañana","M-J-V Tarde"];
const mapTurno = v => { const s = nrm(v); return TURNOS.find(t => nrm(t) === s) || null; };
const turnoDias = t => /^L-M-V/.test(t || "") ? [1,3,5] : /^M-J-S/.test(t || "") ? [2,4,6] : /^M-J-V/.test(t || "") ? [2,4,5] : [];
const EVT_MAP = {"HIPOTENSION INTRADIALITICA":"Hipotensión intradialítica","HIPERTENSION INTRADIALITICA":"Hipertensión intradialítica","CALAMBRES MUSCULARES":"Calambres musculares","NAUSEAS / VOMITOS":"Náuseas / vómitos","CEFALEA":"Cefalea","HIPOGLUCEMIA":"Hipoglucemia","HIPERPOTASEMIA":"Hiperpotasemia","REACCION DE HIPERSENSIBILIDAD AL DIALIZADOR":"Reacción al dializador","COAGULACION DEL CIRCUITO":"Coagulación del circuito","SANGRADO DEL ACCESO VASCULAR":"Sangrado del acceso vascular","DISFUNCION DEL ACCESO (FLUJO BAJO)":"Disfunción del acceso (flujo bajo)","ARRITMIA CARDIACA":"Arritmia","DOLOR TORACICO / ANGINA":"Dolor torácico","FIEBRE / ESCALOFRIOS":"Fiebre / escalofríos","SINDROME DE DESEQUILIBRIO DIALITICO":"Síndrome de desequilibrio","EMBOLISMO AEREO":"Embolismo aéreo","PRURITO":"Prurito","SINCOPE":"Síncope"};
HDX.util = { nrm, p2, numv, docStr, txt, isoOf, ymOf, monthEndIso, mesTxt, matchName, mapAcc, mapTx, mapTurno, turnoDias, MES_TXT, TURNOS };

/* ---------- lectura de un Dashboard ---------- */
function aoa(XLSX, wb, name){ const sn = wb.SheetNames.find(n => nrm(n) === nrm(name)); return sn ? XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, raw: true, defval: null }) : null; }
function findHeader(rows, tests, maxRow){ for(let i = 0; i < Math.min(rows.length, maxRow || 30); i++){ const r = rows[i]; if(!r) continue; const cells = r.map(nrm); if(tests.every(t => cells.some(c => t.test(c)))) return i; } return -1; }
function colMap(row){ const m = {}; (row || []).forEach((c, i) => { const k = nrm(c); if(k && !(k in m)) m[k] = i; }); return m; }
const pick = (cm, ...pats) => { for(const p of pats){ for(const k in cm){ if(p.test(k)) return cm[k]; } } return -1; };

/* Devuelve lo que trae el archivo, sin interpretar. `mes` = "AAAA-MM" del mes operativo del archivo (asistencias, eventos, novedades). */
HDX.parseDashboard = function(XLSX, wb, fileName, mes){
  const out = { archivo: fileName, mes, pac: [], ret: [], lab: [], asi: [], glu: [], vac: [], evt: [], nov: [], tar: [], warn: [], cnt: {} };
  const W = s => out.warn.push(s);
  const [yy, mm] = mes.split("-").map(Number);
  /* --- 2.PACIENTES --- */
  const P = aoa(XLSX, wb, "2.PACIENTES") || [];
  const hp = findHeader(P, [/^ID$/, /^APELLIDOS$/, /DOCUMENTO/]);
  if(hp < 0) W("No se encontró el encabezado de la hoja 2.PACIENTES.");
  else {
    const cm = colMap(P[hp]);
    const c = { id: pick(cm, /^ID$/), ape: pick(cm, /^APELLIDOS$/), nom: pick(cm, /^NOMBRES$/), tdoc: pick(cm, /^T\.?DOC/), doc: pick(cm, /DOCUMENTO/), fn: pick(cm, /NACIMIENTO/), sexo: pick(cm, /^SEXO$/), eps: pick(cm, /^EPS$/), afi: pick(cm, /AFILIACION/), mod: pick(cm, /^MOD/), ini: pick(cm, /INICIO DIALISIS/), acc: pick(cm, /ACCESO VASCULAR/), tx: pick(cm, /ETAPA TRASPLANTE/), est: pick(cm, /^ESTADO$/), ing: pick(cm, /INGRESO UNIDAD/), hta: pick(cm, /^HTA$/), dm: pick(cm, /^DM$/), erc: pick(cm, /ERC ETAPA/), com: pick(cm, /OTRAS COMORBILIDADES/), obs: pick(cm, /^OBSERVACIONES$/) };
    let i = hp + 1;
    for(; i < P.length; i++){
      const r = P[i]; if(!r) continue; const a = txt(r[c.id]);
      if(/REGISTRO DE N/i.test(nrm(a))) break;
      if(!/^P\d+/i.test(a)) continue;
      const doc = docStr(r[c.doc]); if(!doc){ W("Maestro: fila " + (i + 1) + " (" + a + ") sin documento; no se puede identificar al paciente."); continue; }
      const g = k => c[k] >= 0 ? r[c[k]] : null;
      const fnRaw = g("fn"), iniRaw = g("ini"), ingRaw = g("ing");
      out.pac.push({ id: a.toUpperCase(), doc, tdoc: txt(g("tdoc")) || "", ape: txt(g("ape")), nom: txt(g("nom")), fn: isoOf(fnRaw), sexo: txt(g("sexo")), eps: nrm(g("eps")), afi: txt(g("afi")), mod: nrm(g("mod")) || "", ini: isoOf(iniRaw), ing: isoOf(ingRaw), accRaw: txt(g("acc")), txRaw: txt(g("tx")), est: txt(g("est")), hta: nrm(g("hta")), dm: nrm(g("dm")), erc: numv(g("erc")), com: txt(g("com")), obs: txt(g("obs")) });
      if(fnRaw != null && fnRaw !== "" && !isoOf(fnRaw)) W("Maestro " + a + ": fecha de nacimiento ilegible («" + fnRaw + "»).");
      if(iniRaw != null && iniRaw !== "" && !isoOf(iniRaw)) W("Maestro " + a + ": inicio de diálisis ilegible («" + iniRaw + "»).");
    }
    for(; i < P.length; i++){ const r = P[i]; if(!r) continue; const a = txt(r[0]); if(/^P\d+$/i.test(a) && r[1]) out.ret.push({ id: a.toUpperCase(), estado: txt(r[1]), paciente: txt(r[2]), motivo: txt(r[3]) }); }
  }
  const nameCands = out.pac.map(p => ({ key: p.doc, name: p.nom + " " + p.ape, doc: p.doc }));
  const byDoc = {}; out.pac.forEach(p => { byDoc[p.doc] = p; });
  /* --- 5.LABORATORIOS --- */
  const L = aoa(XLSX, wb, "5.LABORATORIOS") || [];
  const hl = findHeader(L, [/^PERIODO$/, /^ID$/, /FOSFORO/]);
  if(hl >= 0){
    const cm = colMap(L[hl]);
    const c = { per: pick(cm, /^PERIODO$/), id: pick(cm, /^ID$/), nom: pick(cm, /NOMBRE COMPLETO/), mod: pick(cm, /^MOD/), P: pick(cm, /^FOSFORO \(/), Alb: pick(cm, /^ALBUMINA \(/), Hb: pick(cm, /^HGB \(/), KtV: pick(cm, /^KTV$/), acc: pick(cm, /^ACCESO VASCULAR$/), TAS: pick(cm, /^TA SIST/), TAD: pick(cm, /^TA DIAST/), HbA1c: pick(cm, /^HBA1C \(/), Ca: pick(cm, /^CALCIO \(/), PTH: pick(cm, /^PTH \(/), KRU: pick(cm, /^KRU/), Vol: pick(cm, /^VOL\. ORINA/) };
    const rows = [];
    for(let i = hl + 1; i < L.length; i++){ const r = L[i]; if(!r || !txt(r[c.id])) continue; rows.push({ i, r, per: isoOf(r[c.per]) }); }
    /* Arrastre de fecha (+1 día por fila): el periodo es el mes de la primera fila, no una serie de días. */
    let drag = 0; for(let k = 1; k < rows.length; k++){ if(rows[k].per && rows[k - 1].per && (new Date(rows[k].per) - new Date(rows[k - 1].per)) === 864e5) drag++; }
    const dragged = drag >= 10; const first = rows.find(x => x.per);
    if(dragged && first) W("Laboratorios: la columna Período viene con fechas consecutivas por arrastre (" + drag + " filas); se toma todo el bloque como " + mesTxt(ymOf(first.per)) + ".");
    const idName = {};
    rows.forEach(x => { const id = txt(x.r[c.id]).toUpperCase(), nm = txt(x.r[c.nom]); if(nm) (idName[id] = idName[id] || []).push({ per: x.per, nm }); });
    let dp = 0;
    rows.forEach(x => {
      const r = x.r, id = txt(r[c.id]).toUpperCase(); let nm = txt(r[c.nom]);
      const per = dragged && first ? ymOf(first.per) : ymOf(x.per);
      const vals = {}; ["P","Alb","Hb","KtV","TAS","TAD","HbA1c","Ca","PTH","KRU","Vol"].forEach(k => { if(c[k] >= 0){ const raw = r[c[k]]; const v = numv(raw); if(v != null) vals[k] = { v, raw: typeof raw === "string" && /[<>]/.test(raw) ? raw.trim() : null }; } });
      const mod = c.mod >= 0 ? nrm(r[c.mod]) : "";
      if(mod === "DP"){ dp++; return; }
      const acc = c.acc >= 0 ? txt(r[c.acc]) : "";
      if(!Object.keys(vals).length && !nm) return;
      if(!per){ W("Laboratorios: fila " + (x.i + 1) + " (" + id + ") sin periodo legible; no se importó."); return; }
      let inferred = false;
      if(!nm){ const h = (idName[id] || []).filter(z => z.per && ymOf(z.per) <= per).sort((a, b) => a.per < b.per ? -1 : 1).pop() || (idName[id] || [])[0]; if(h){ nm = h.nm; inferred = true; } }
      out.lab.push({ id, nom: nm, per, vals, acc, sinNombre: inferred, fila: x.i + 1 });
    });
    out.cnt.labDP = dp;
  }
  /* --- 3.ASISTENCIAS_DIARIO --- */
  const A = aoa(XLSX, wb, "3.ASISTENCIAS_DIARIO") || [];
  const ha = findHeader(A, [/^TURNO$/, /^NOMBRE$/, /DOC ID/]);
  if(ha >= 0){
    const hr = A[ha]; const cm = colMap(hr);
    const c = { turno: pick(cm, /^TURNO$/), puesto: pick(cm, /^PUESTO/), nom: pick(cm, /^NOMBRE$/), eps: pick(cm, /^EPS$/), doc: pick(cm, /DOC ID/), acc: pick(cm, /^ACCESO$/), prog: pick(cm, /^PROG/) };
    const dayCol = {}; hr.forEach((v, i) => { if(v == null || !/^\d{1,2}(\.0)?$/.test(String(v).trim())) return; const n = Math.round(Number(v)); if(n >= 1 && n <= 31 && !(n in dayCol) && i > c.prog) dayCol[n] = i; });
    const dim = new Date(yy, mm, 0).getDate();
    for(let i = ha + 1; i < A.length; i++){
      const r = A[i]; if(!r) continue; const doc = docStr(r[c.doc]); if(!doc || !/^\d{5,}$/.test(doc)) continue;
      const dias = []; for(let d = 1; d <= 31; d++){ if(dayCol[d] != null && numv(r[dayCol[d]]) === 1){ if(d <= dim) dias.push(d); else W("Asistencias: marca en el día " + d + " de un mes de " + dim + " días (" + txt(r[c.nom]) + "); se ignoró."); } }
      out.asi.push({ doc, nom: txt(r[c.nom]), turno: mapTurno(r[c.turno]), turnoRaw: txt(r[c.turno]), puesto: numv(r[c.puesto]), eps: nrm(r[c.eps]), accRaw: txt(r[c.acc]), prog: numv(r[c.prog]), dias });
    }
    /* Verificación del mes: los días marcados deben caer en los días del turno. */
    const score = (y, m0) => { let ok = 0, n = 0; out.asi.forEach(a => { const td = turnoDias(a.turno); if(!td.length) return; a.dias.forEach(d => { const dt = new Date(y, m0, d); if(dt.getMonth() !== m0) return; n++; if(td.includes(dt.getDay())) ok++; }); }); return n ? ok / n : null; };
    const s0 = score(yy, mm - 1); out.cnt.asiScore = s0;
    if(s0 != null && s0 < 0.8){ let alt = null; for(let k = -3; k <= 3; k++){ if(!k) continue; const d = new Date(yy, mm - 1 + k, 1); const s = score(d.getFullYear(), d.getMonth()); if(s != null && s >= 0.9 && (!alt || s > alt.s)) alt = { s, ym: d.getFullYear() + "-" + p2(d.getMonth() + 1) }; }
      W("Asistencias: solo el " + Math.round(s0 * 100) + " % de las marcas cae en los días del turno para " + mesTxt(mes) + (alt ? "; coinciden mejor con " + mesTxt(alt.ym) + " (" + Math.round(alt.s * 100) + " %)" : "") + ". Verifique el mes del archivo."); out.cnt.asiAlt = alt ? alt.ym : null; }
  }
  /* --- 6.GLUCOMETRIAS --- */
  const G = aoa(XLSX, wb, "6.GLUCOMETRIAS") || [];
  const hg = findHeader(G, [/^ID$/, /NOMBRE COMPLETO/, /^DM$/]);
  if(hg >= 0){
    const hr = G[hg]; const cm = colMap(hr); const cid = pick(cm, /^ID$/), cnom = pick(cm, /NOMBRE COMPLETO/), cmod = pick(cm, /^MOD/);
    const dayCol = {}; hr.forEach((v, i) => { if(v == null || !/^\d{1,2}(\.0)?$/.test(String(v).trim())) return; const n = Math.round(Number(v)); if(n >= 1 && n <= 31 && !(n in dayCol) && i > cmod) dayCol[n] = i; });
    const dim = new Date(yy, mm, 0).getDate();
    for(let i = hg + 1; i < G.length; i++){ const r = G[i]; if(!r || !txt(r[cid])) continue; if(!/^P\d+/i.test(txt(r[cid]))) continue; const vals = []; for(let d = 1; d <= dim; d++){ if(dayCol[d] != null){ const v = numv(r[dayCol[d]]); if(v != null) vals.push({ d, v }); } } if(vals.length) out.glu.push({ id: txt(r[cid]).toUpperCase(), nom: txt(r[cnom]), vals }); }
  }
  /* --- 8.VACUNACION_HEPB --- */
  const V = aoa(XLSX, wb, "8.VACUNACION_HEPB") || [];
  const hv = findHeader(V, [/^ID$/, /FECHA DOSIS 1/]);
  if(hv >= 0){
    const cm = colMap(V[hv]); const c = { id: pick(cm, /^ID$/), nom: pick(cm, /NOMBRE COMPLETO/), mod: pick(cm, /^MOD/), d1: pick(cm, /FECHA DOSIS 1/), d2: pick(cm, /FECHA DOSIS 2/), d3: pick(cm, /FECHA DOSIS 3/), comp: pick(cm, /ESQUEMA COMPLETO/), fs: pick(cm, /FECHA SEROLOGIA/), ab: pick(cm, /^ANTI-HBS \(/), resp: pick(cm, /^RESPUESTA$/), ref: pick(cm, /REFUERZO APLICADO/), fref: pick(cm, /FECHA REFUERZO/), abr: pick(cm, /POST-REFUERZO/), est: pick(cm, /^ESTADO$/), obs: pick(cm, /^OBSERVACIONES$/) };
    for(let i = hv + 1; i < V.length; i++){ const r = V[i]; if(!r || !/^P\d+/i.test(txt(r[c.id]))) continue; if(nrm(r[c.mod]) === "DP") continue;
      const dose = k => { const raw = r[c[k]]; if(raw == null || raw === "") return null; const f = isoOf(raw); return f ? { f } : { f: null, raw: txt(raw) }; };
      out.vac.push({ id: txt(r[c.id]).toUpperCase(), nom: txt(r[c.nom]), d: [dose("d1"), dose("d2"), dose("d3")], comp: nrm(r[c.comp]), fs: isoOf(r[c.fs]), ab: numv(r[c.ab]), resp: txt(r[c.resp]), ref: nrm(r[c.ref]), fref: isoOf(r[c.fref]), abr: numv(r[c.abr]), est: txt(r[c.est]), obs: txt(r[c.obs]) }); }
  }
  /* --- COMPLICACIONES y NOVEDADES --- */
  const fixDate = (raw, hoja, fila) => { const f = isoOf(raw); if(f) return { f }; if(raw == null || raw === "") return { f: null };
    const m = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/.exec(String(raw).trim());
    if(m){ const a = +m[1], b = +m[2]; const d = b === mm ? a : a === mm ? b : null; if(d && d >= 1 && d <= 31){ const f2 = yy + "-" + p2(mm) + "-" + p2(d); W(hoja + ": fila " + fila + " con año mal digitado («" + raw + "»); se leyó como " + f2 + " por coincidir día y mes con el archivo. Confírmelo."); return { f: f2, fix: true }; } }
    W(hoja + ": fila " + fila + " con fecha ilegible («" + raw + "»); no se importó."); return { f: null, bad: true }; };
  const C = aoa(XLSX, wb, "COMPLICACIONES") || [];
  const hc = findHeader(C, [/^FECHA$/, /^COMPLICACION$/]);
  if(hc >= 0){ const cm = colMap(C[hc]); const c = { f: pick(cm, /^FECHA$/), doc: pick(cm, /^ID PACIENTE$/), nom: pick(cm, /NOMBRE COMPLETO/), turno: pick(cm, /^TURNO$/), tipo: pick(cm, /^COMPLICACION$/), sev: pick(cm, /^SEVERIDAD$/), cond: pick(cm, /^CONDUCTA/), res: pick(cm, /^RESUELTO$/), resp: pick(cm, /^RESPONSABLE$/), obs: pick(cm, /^OBSERVACIONES$/) };
    for(let i = hc + 1; i < C.length; i++){ const r = C[i]; if(!r || (r[c.f] == null && !txt(r[c.tipo]))) continue; if(!txt(r[c.tipo]) && !txt(r[c.nom])) continue; const fd = fixDate(r[c.f], "Complicaciones", i + 1); if(!fd.f) continue;
      out.evt.push({ f: fd.f, doc: docStr(r[c.doc]), nom: txt(r[c.nom]), turno: txt(r[c.turno]), tipoRaw: txt(r[c.tipo]), sev: txt(r[c.sev]), cond: txt(r[c.cond]), res: txt(r[c.res]), resp: txt(r[c.resp]), obs: txt(r[c.obs]) }); } }
  const N = aoa(XLSX, wb, "NOVEDADES") || [];
  const hn = findHeader(N, [/^FECHA$/, /TIPO DE NOVEDAD/]);
  if(hn >= 0){ const cm = colMap(N[hn]); const c = { f: pick(cm, /^FECHA$/), doc: pick(cm, /^ID PACIENTE$/), nom: pick(cm, /NOMBRE COMPLETO/), tipo: pick(cm, /TIPO DE NOVEDAD/), des: pick(cm, /^DESCRIPCION$/), resp: pick(cm, /^RESPONSABLE$/), est: pick(cm, /^ESTADO$/), fc: pick(cm, /FECHA CIERRE/), obs: pick(cm, /^OBSERVACIONES$/) };
    for(let i = hn + 1; i < N.length; i++){ const r = N[i]; if(!r || r[c.f] == null || (!txt(r[c.tipo]) && !txt(r[c.des]))) continue; const fd = fixDate(r[c.f], "Novedades", i + 1); if(!fd.f) continue;
      out.nov.push({ f: fd.f, fix: !!fd.fix, doc: docStr(r[c.doc]), nom: txt(r[c.nom]), tipoRaw: txt(r[c.tipo]), des: txt(r[c.des]), resp: txt(r[c.resp]), est: txt(r[c.est]), fc: isoOf(r[c.fc]), obs: txt(r[c.obs]) }); } }
  /* --- 16.FACTURACION (tarifas del contrato) --- */
  const F = aoa(XLSX, wb, "16.FACTURACION") || [];
  const hf = findHeader(F, [/^EPS$/, /HD PAQUETE/]);
  if(hf >= 0){ for(let i = hf + 1; i < Math.min(F.length, hf + 9); i++){ const r = F[i]; if(!r || !txt(r[1])) continue; if(/KPI|DETALLE|SUPUESTOS/i.test(String(r[1]))) break; const paq = numv(r[3]), ses = numv(r[5]); if(paq == null || ses == null) continue; out.tar.push({ eps: nrm(r[1]), paquete: paq, sesion: ses, min: numv(r[7]), max: numv(r[8]), extra: nrm(r[9]) === "SI" ? "SI" : "NO", desde: "" }); } }
  out.cnt.pac = out.pac.length; out.cnt.lab = out.lab.length; out.cnt.asi = out.asi.reduce((a, x) => a + x.dias.length, 0); out.cnt.evt = out.evt.length; out.cnt.nov = out.nov.length;
  out._cands = nameCands; out._byDoc = byDoc;
  return out;
};

/* ---------- consolidación: un payload entra a la base (libro) ---------- */
/* El libro es un objeto con arreglos pac, lab, ses, evt, nov, mov, vac y cfgv.hdx. Las fechas se guardan en ISO; el cargador las convierte.
   Mientras se consolida, los registros apuntan al objeto paciente (no al ID): los ID del Dashboard se repiten y cambian entre meses. */
const dIso = v => v instanceof Date ? isoOf(v) : (typeof v === "string" ? v.slice(0, 10) : isoOf(v));
HDX.dIso = dIso;
HDX.emptyMeta = () => ({ fuentes: [], warn: [], retirados: [] });
HDX.COLS = ["lab","ses","evt","nov","vac","mov","acn","ate","val","est","txs","sol","seg","atb","med","dis","ctc","dsp"];
let UID = 0;
HDX.toRefs = function(book){ const d = {}; book.pac.forEach(p => { if(!p._u) p._u = ++UID; if(p.ID) d[p.ID] = p; }); HDX.COLS.forEach(k => (book[k] || []).forEach(r => { if(!r._ref && typeof r.Paciente === "string" && d[r.Paciente]){ r.Paciente = d[r.Paciente]; r._ref = true; } })); };
const uidOf = r => r._ref ? "#" + r.Paciente._u : String(r.Paciente || "");
HDX.getHist = function(p, f){ const m = {}; String(p[f] || "").split(";").filter(Boolean).forEach(s => { const i = s.indexOf(":"); m[s.slice(0, i)] = s.slice(i + 1); }); return m; };
HDX.setHist = function(p, f, mes, v){ const m = HDX.getHist(p, f); m[mes] = v; p[f] = Object.keys(m).sort().map(k => k + ":" + m[k]).join(";"); };
const fullName = p => txt((p.Nombres || "") + " " + (p.Apellidos || ""));
function sameName(a, b){ const ta = nrm(a).split(" ").filter(t => t.length > 2), tb = nrm(b).split(" ").filter(t => t.length > 2); let n = 0; ta.forEach(t => { if(tb.some(u => tokSim(t, u) > 0)) n++; }); return n >= Math.min(2, ta.length, tb.length) && n > 0; }
function metodoDe(k){ return k === "KtV" ? "Kt/V del Dashboard: tipo y método sin registrar; fecha de toma sin registrar (día 1 = mes del bloque)" : "Dashboard: fecha exacta de toma sin registrar (día 1 = mes del bloque)"; }

HDX.mergePayload = function(book, pl){
  const hx = book.cfgv.hdx = book.cfgv.hdx || HDX.emptyMeta();
  const W = s => { if(hx.warn.length < 110 && !hx.warn.includes(s)) hx.warn.push(String(s).slice(0, 260)); };
  pl.warn.forEach(s => W("[" + pl.archivo + "] " + s));
  const mes = pl.mes;
  HDX.toRefs(book);
  let byDoc = {}; const reDoc = () => { byDoc = {}; book.pac.forEach(p => { if(p.Documento) byDoc[String(p.Documento)] = p; }); }; reDoc();
  const addMes = (p, f, m) => { const s = new Set(String(p[f] || "").split(",").filter(Boolean)); s.add(m); p[f] = [...s].sort().join(","); };
  if(pl.ret.length) hx.retirados = pl.ret;
  /* 1. Maestro: primero se decide a qué persona corresponde cada fila (documento y nombre deben concordar) */
  const plan = [];
  pl.pac.forEach(src => {
    if(src.mod !== "HD"){ hx.otros = hx.otros || {}; hx.otros[src.doc] = { mod: src.mod, ini: src.ini, ing: src.ing, id: src.id, mes, fn: src.fn }; const q = byDoc[src.doc]; if(q && sameName(fullName(q), src.nom + " " + src.ape) && !q.ModalidadPrevia) q.ModalidadPrevia = src.mod; return; }
    const full = src.nom + " " + src.ape; let p = byDoc[src.doc] || null;
    if(p && !sameName(fullName(p), full)){ const m = matchName(full, book.pac.map(z => ({ key: z._u, name: fullName(z), p: z }))); 
      W("[" + pl.archivo + "] El documento " + src.doc + " figuraba a nombre de " + fullName(p) + " y ahora a nombre de " + txt(full) + ". Se sigue a la persona por el nombre y se toma el documento de este archivo; verifique el número.");
      p = m ? m.p : null; }
    else if(!p){ const m = matchName(full, book.pac.map(z => ({ key: z._u, name: fullName(z), p: z }))); if(m && sameName(fullName(m.p), full) && nrm(fullName(m.p)).split(" ").length >= 3 && !pl.pac.some(z => z.doc === String(m.p.Documento))){ W("[" + pl.archivo + "] " + txt(full) + " cambia de documento (" + m.p.Documento + " → " + src.doc + "); se trata como la misma persona. Verifique."); p = m.p; } }
    plan.push({ src, p });
  });
  plan.forEach(x => {
    const src = x.src; let p = x.p;
    if(!p){
      p = { ID: "", TipoDoc: src.tdoc || "", Documento: src.doc, Apellidos: src.ape, Nombres: src.nom, FechaNac: null, Sexo: "", EPS: "", Afiliacion: "", HTA: "", DM: "", DMTipo: "", InicioTRR: null, IngresoUnidad: null, Estado: "Activo", FechaEstado: null, Turno: "", Puesto: null, SesSemana: null, DuracionMin: null, AccesoInicial: null, AccesoActual: null, AccesoDesde: null, RutaAcceso: "Sin valorar", TxEstado: "Sin evaluar", TxEtapaRaw: "", VacunaVHB: "", VHBNoRespondedor: "", Paratiroidectomia: "", Comorbilidades: "", Obs: "", MesesMaestro: "", MesesRegistro: "", IdHist: "", AccesoHist: "", PrimerRegistro: null, InicioHD: null, ModalidadPrevia: "", EstadoFuente: "", EstadoOrigen: "", ProgMes: null, ERCEtapa: null, Usuario: "Lectura de Dashboards", Actualizado: "" };
      p._u = ++UID; book.pac.push(p);
    }
    x.p = p; p.Documento = src.doc;
  });
  reDoc();
  plan.forEach(({ src, p }) => {
    const o = hx.otros && hx.otros[src.doc];
    if(o && !p.ModalidadPrevia && o.mes <= mes && (!p.MesesMaestro)) { p.ModalidadPrevia = o.mod; if(o.fn && !p.FechaNac) p.FechaNac = o.fn; }
    HDX.setHist(p, "IdHist", mes, src.id);
    p.Apellidos = src.ape || p.Apellidos; p.Nombres = src.nom || p.Nombres; if(src.tdoc) p.TipoDoc = src.tdoc;
    if(src.fn) p.FechaNac = src.fn; if(src.sexo) p.Sexo = src.sexo; if(src.eps) p.EPS = src.eps; if(src.afi) p.Afiliacion = src.afi;
    if(src.hta) p.HTA = src.hta; if(src.dm) p.DM = src.dm; if(src.erc != null) p.ERCEtapa = src.erc;
    if(src.com) p.Comorbilidades = src.com; if(src.obs) p.Obs = src.obs;
    if(src.ini){ const prevIni = dIso(p.InicioTRR);
      if(p.ModalidadPrevia && o && o.ini && o.ini < src.ini){ p.InicioTRR = o.ini; p.InicioHD = src.ini; }
      else { if(prevIni && prevIni !== src.ini) W("[" + pl.archivo + "] " + src.id + " " + txt(src.nom + " " + src.ape) + ": el inicio de diálisis cambió de " + prevIni + " a " + src.ini + " entre archivos; se usa el más reciente."); p.InicioTRR = src.ini; } }
    if(src.ing) p.IngresoUnidad = src.ing;
    const acc = mapAcc(src.accRaw); if(acc){ p.AccesoActual = acc; HDX.setHist(p, "AccesoHist", mes, acc); }
    if(src.txRaw !== p.TxEtapaRaw){ p.TxEtapaRaw = src.txRaw; p.TxEstado = mapTx(src.txRaw); }
    p.EstadoFuente = src.est || "(sin diligenciar)";
    addMes(p, "MesesMaestro", mes);
  });
  const cands = () => book.pac.map(p => ({ key: p._u, name: fullName(p), p }));
  const byName = nm => { const m = matchName(nm, cands()); return m ? m.p : null; };
  const plIdToDoc = {}; pl.pac.forEach(s => { if(s.mod === "HD") (plIdToDoc[s.id] = plIdToDoc[s.id] || []).push(s.doc); });
  const resolve = (id, nm, doc) => { if(doc && byDoc[doc] && (!nm || sameName(fullName(byDoc[doc]), nm) || matchName(nm, [{ key: 1, name: fullName(byDoc[doc]) }]))) return byDoc[doc]; if(nm){ const p = byName(nm); if(p) return p; } if(doc && byDoc[doc] && !nm) return byDoc[doc]; if(id && !nm && plIdToDoc[id] && plIdToDoc[id].length === 1) return byDoc[plIdToDoc[id][0]] || null; return null; };
  const newRec = (k, pre, o) => { const r = Object.assign({ ID: pre + String(book[k].length + 1).padStart(6, "0") }, o, { Registrado: "", _ref: true }); book[k].push(r); return r; };
  /* 2. Laboratorios (el archivo más reciente manda; las diferencias se cuentan) */
  const labKey = {}; book.lab.forEach(l => { labKey[uidOf(l) + "|" + l.Examen + "|" + dIso(l.FechaToma)] = l; });
  let nL = 0, nDiff = 0, nSk = 0; const perSet = new Set(); const diffPer = {};
  pl.lab.forEach(x => {
    const p = resolve(x.id, x.nom, null);
    if(!p){ nSk++; W("[" + pl.archivo + "] Laboratorios: fila " + x.fila + " (" + x.id + (x.nom ? " " + x.nom : "") + ", " + x.per + ") sin paciente identificable en el maestro de HD; no se importó."); return; }
    const f = x.per + "-01"; perSet.add(x.per);
    const acc = mapAcc(x.acc); if(acc && !(HDX.getHist(p, "AccesoHist")[x.per] && String(p.MesesMaestro || "").split(",").includes(x.per))) HDX.setHist(p, "AccesoHist", x.per, acc);
    Object.keys(x.vals).forEach(k => {
      if(k === "TAD" || k === "KRU" || k === "Vol") return;
      const key = "#" + p._u + "|" + k + "|" + f; const prev = labKey[key]; const val = x.vals[k].raw || x.vals[k].v;
      if(prev){ if(String(prev.Valor) !== String(val)){ nDiff++; diffPer[x.per] = (diffPer[x.per] || 0) + 1; prev.Valor = val; prev.Usuario = "Dashboard " + mesTxt(mes) + " (corrige el valor de un archivo anterior)"; } return; }
      labKey[key] = newRec("lab", "L-", { Paciente: p, FechaToma: f, Examen: k, Valor: val, Metodo: metodoDe(k), Usuario: "Dashboard " + mesTxt(mes) }); nL++;
    });
    if(x.sinNombre) W("Laboratorios " + x.per + ": la fila de " + x.id + " no trae nombre en el Dashboard; se asignó a " + fullName(p) + " por el ID de los meses anteriores.");
  });
  Object.keys(diffPer).forEach(per => W("[" + pl.archivo + "] " + diffPer[per] + " resultados de " + mesTxt(per) + " difieren de los cargados en un archivo anterior; se conserva el valor de este archivo (el más reciente)."));
  /* 3. Asistencias → sesiones realizadas (sin duración ni pesos: el Dashboard no los trae) */
  const sesKey = new Set(book.ses.map(s => uidOf(s) + "|" + dIso(s.Fecha)));
  let nS = 0; const asiSeen = {};
  pl.asi.forEach(a => {
    const p = resolve(null, a.nom, a.doc);
    if(!p){ if(a.dias.length) W("[" + pl.archivo + "] Asistencias: «" + a.nom + "» (doc. " + a.doc + ") no está en el maestro de HD; no se importaron sus " + a.dias.length + " sesiones."); return; }
    if(asiSeen[p._u]) W("[" + pl.archivo + "] Asistencias: " + fullName(p) + " aparece en más de una fila; se sumaron las marcas."); asiSeen[p._u] = 1;
    if(a.turno) p.Turno = a.turno; if(a.puesto != null) p.Puesto = a.puesto; if(a.prog != null) p.ProgMes = a.prog;
    const acc = mapAcc(a.accRaw);
    a.dias.forEach(d => { const f = mes + "-" + p2(d); const k = "#" + p._u + "|" + f; if(sesKey.has(k)) return; sesKey.add(k);
      newRec("ses", "S-", { Fecha: f, Paciente: p, Turno: a.turno || "", Puesto: a.puesto, Tipo: "Programada", Estado: "Realizada", Motivo: "", Responsable: "", Nota: "Asistencia marcada en el Dashboard de " + mesTxt(mes), DuracionMin: null, Acceso: acc || "", PesoPre: null, PesoPost: null, TASPre: null, TADPre: null, TASPost: null, TADPost: null, Gluco: null, Usuario: "Dashboard " + mesTxt(mes) }); nS++; });
  });
  /* 4. Glucometrías → sobre la sesión del día */
  let nG = 0, nG0 = 0;
  pl.glu.forEach(g => { const p = resolve(g.id, g.nom, null); if(!p) return; g.vals.forEach(({ d, v }) => { const f = mes + "-" + p2(d); const s = book.ses.find(z => z._ref && z.Paciente === p && dIso(z.Fecha) === f); if(s){ if(s.Gluco == null){ s.Gluco = v; nG++; } } else nG0++; }); });
  if(nG0) W("[" + pl.archivo + "] Glucometrías: " + nG0 + " valores en días sin asistencia marcada; no se importaron.");
  /* 5. Vacunación VHB y anti-HBs */
  const vacKey = new Set(book.vac.map(v => uidOf(v) + "|" + v.Serie + "|" + v.NumDosis + "|" + dIso(v.Fecha)));
  pl.vac.forEach(v => { const p = resolve(v.id, v.nom, null); if(!p) return;
    const dated = v.d.filter(x => x && x.f).length, undated = v.d.filter(x => x && !x.f).length;
    p.VacunaVHB = v.comp === "SI" ? (undated ? "Esquema completo (fechas sin registrar)" : "Esquema completo") : (dated || undated ? "Esquema incompleto" : "Sin iniciar");
    p.VHBEstadoRaw = v.est;
    v.d.forEach((x, i) => { if(!x || !x.f) return; const k = "#" + p._u + "|1|" + (i + 1) + "|" + x.f; if(vacKey.has(k)) return; vacKey.add(k); newRec("vac", "V-", { Paciente: p, Vacuna: "Hepatitis B", Esquema: "3 dosis de 40 µg (Dashboard)", Serie: "1", NumDosis: i + 1, Fecha: x.f, Lote: "", Observacion: "", Usuario: "Dashboard " + mesTxt(mes) }); });
    if(v.fref){ const k = "#" + p._u + "|2|1|" + v.fref; if(!vacKey.has(k)){ vacKey.add(k); newRec("vac", "V-", { Paciente: p, Vacuna: "Hepatitis B", Esquema: "Refuerzo", Serie: "2", NumDosis: 1, Fecha: v.fref, Lote: "", Observacion: "Refuerzo", Usuario: "Dashboard " + mesTxt(mes) }); } }
    [[v.fs, v.ab, "Anti-HBs de la hoja de vacunación"], [v.fref, v.abr, "Anti-HBs posrefuerzo"]].forEach(([f, val, met]) => { if(f == null || val == null) return; const key = "#" + p._u + "|AntiHBs|" + f; const prev = labKey[key]; if(prev){ prev.Valor = val; return; } labKey[key] = newRec("lab", "L-", { Paciente: p, FechaToma: f, Examen: "AntiHBs", Valor: val, Metodo: met, Usuario: "Dashboard " + mesTxt(mes) }); });
  });
  /* 6. Complicaciones → eventos */
  const evtKey = new Set(book.evt.map(e => uidOf(e) + "|" + dIso(e.Fecha) + "|" + e.Tipo + "|" + (e.Conducta || "")));
  let nE = 0, nEold = 0;
  pl.evt.forEach(e => { const p = resolve(null, e.nom, e.doc); const rawN = nrm(e.tipoRaw); let tipo = EVT_MAP[rawN] || null; if(!tipo && /BACTEREM/.test(rawN)) tipo = "Bacteriemia asociada a catéter (ITS-CVC)"; if(!tipo && /INFECCION DEL ACCESO/.test(rawN)) tipo = p && /^CVC/.test(p.AccesoActual || "") ? "Bacteriemia asociada a catéter (ITS-CVC)" : "Infección de FAV o injerto"; if(!tipo) tipo = "Otro";
    if(ymOf(e.f) !== mes) nEold++;
    const cond = [tipo === "Otro" && e.tipoRaw && !/^OTRA/i.test(e.tipoRaw) ? e.tipoRaw : "", e.cond, e.obs].filter(Boolean).join(" · ");
    const k = (p ? "#" + p._u : "") + "|" + e.f + "|" + tipo + "|" + cond; if(evtKey.has(k)) return; evtKey.add(k);
    if(!p) W("[" + pl.archivo + "] Complicaciones: evento del " + e.f + " («" + e.nom + "») sin paciente identificable en el maestro.");
    const r = newRec("evt", "E-", { Fecha: e.f, Paciente: p || "", Sesion: "", Tipo: tipo, Severidad: ["Leve","Moderada","Severa"].includes(e.sev) ? e.sev : "", Conducta: cond, Resuelto: ["Sí","No","En seguimiento"].includes(e.res) ? e.res : (e.res ? "En seguimiento" : ""), Hemocultivo: "", Microorganismo: "", Resistencia: "", FechaCierre: null, NombreFuente: e.nom, Usuario: e.resp || ("Dashboard " + mesTxt(mes)) }); if(!p) delete r._ref; nE++; });
  /* 7. Novedades → notas crudas (los episodios de hospitalización se arman en finalize) */
  const novKey = new Set(book.nov.filter(n => n.Causa === "NOTA").map(n => uidOf(n) + "|" + dIso(n.Inicio) + "|" + n.TipoRaw + "|" + n.Descripcion));
  let nN = 0, nNold = 0;
  pl.nov.forEach(n => { const p = resolve(null, n.nom, n.doc); if(ymOf(n.f) !== mes) nNold++;
    const des = [n.des, n.obs].filter(Boolean).join(" · "); const k = (p ? "#" + p._u : "") + "|" + n.f + "|" + n.tipoRaw + "|" + des; if(novKey.has(k)) return; novKey.add(k);
    if(!p) W("[" + pl.archivo + "] Novedades: «" + n.tipoRaw + "» del " + n.f + " («" + n.nom + "») sin paciente identificable en el maestro.");
    const r = newRec("nov", "N-", { Paciente: p || "", Tipo: "Otra", TipoRaw: n.tipoRaw, Inicio: n.f, Fin: n.f, Descripcion: des, Causa: "NOTA", Atribuible: "", Evitable: "", EstadoRaw: n.est, NombreFuente: n.nom, Usuario: n.resp || ("Dashboard " + mesTxt(mes)) }); if(!p) delete r._ref; nN++; });
  if(pl.tar.length) hx.tarifas = pl.tar;
  const lastDay = [].concat(pl.asi.flatMap(a => a.dias.map(d => mes + "-" + p2(d))), pl.evt.filter(e => ymOf(e.f) === mes).map(e => e.f), pl.nov.filter(n => ymOf(n.f) === mes).map(n => n.f)).sort().pop() || null;
  hx.fuentes = hx.fuentes.filter(f => f.mes !== mes);
  hx.fuentes.push({ archivo: pl.archivo, mes, maestro: pl.pac.filter(p => p.mod === "HD").length, labs: [...perSet].sort(), labNuevos: nL, labCorregidos: nDiff, sesiones: nS, asiOk: pl.cnt.asiScore == null ? null : Math.round(pl.cnt.asiScore * 100) / 100, asiAlt: pl.cnt.asiAlt || null, eventos: pl.evt.filter(e => ymOf(e.f) === mes).length, eventosAjenos: nEold, novedades: pl.nov.filter(n => ymOf(n.f) === mes).length, novedadesAjenas: nNold, gluco: nG, hasta: lastDay });
  hx.fuentes.sort((a, b) => a.mes < b.mes ? -1 : 1);
  return { labs: nL, corregidos: nDiff, sesiones: nS, eventos: nE, novedades: nN, sinPaciente: nSk };
};

/* ---------- cierre: ID definitivos, estados inferidos, primer registro y episodios de hospitalización ---------- */
HDX.finalize = function(book, opts){
  const hx = book.cfgv.hdx = book.cfgv.hdx || HDX.emptyMeta(); opts = opts || {};
  const gap = opts.gapHosp || hx.gapHosp || 14; hx.gapHosp = gap;
  const W = s => { if(hx.warn.length < 110 && !hx.warn.includes(s)) hx.warn.push(String(s).slice(0, 260)); };
  HDX.toRefs(book);
  const lastOf = p => String(p.MesesMaestro || "").split(",").filter(Boolean).sort().pop() || "";
  const owner = {}; (hx.retirados || []).forEach(r => { if(/EN USO/i.test(r.estado) && r.paciente) owner[r.id] = r.paciente; });
  const isOwner = (p, id) => !!(owner[id] && matchName(owner[id], [{ key: 1, name: fullName(p) }]));
  let mx = 0; const seen = id => { const m = /^P(\d+)/.exec(id || ""); if(m) mx = Math.max(mx, +m[1]); };
  book.pac.forEach(p => { seen(p.ID); Object.values(HDX.getHist(p, "IdHist")).forEach(seen); }); (hx.retirados || []).forEach(r => seen(r.id));
  const taken = {};
  const cand = p => { const h = HDX.getHist(p, "IdHist"); const c = Object.keys(h).sort().reverse().map(k => h[k]); if(p.ID && !c.includes(p.ID)) c.push(p.ID); return [...new Set(c)]; };
  book.pac.slice().sort((a, b) => { const la = lastOf(a) || "9999", lb = lastOf(b) || "9999"; if(la !== lb) return la > lb ? -1 : 1; const ca = cand(a)[0], cb = cand(b)[0]; return (isOwner(b, cb) ? 1 : 0) - (isOwner(a, ca) ? 1 : 0); }).forEach(p => {
    const c = cand(p); let id = c.find(x => !taken[x]);
    if(!id){ mx++; id = "P" + String(mx).padStart(3, "0"); W("El ID " + c[0] + " está repetido en el maestro: lo conserva " + txt(taken[c[0]]) + "; a " + fullName(p) + " (doc. " + p.Documento + ") se le asigna " + id + " de forma provisional. Corrija el número en el Dashboard."); }
    taken[id] = fullName(p); p.ID = id; });
  HDX.COLS.forEach(k => (book[k] || []).forEach(r => { if(r._ref){ r.Paciente = r.Paciente.ID || ""; delete r._ref; } }));
  book.pac.forEach(p => { delete p._u; });
  const fm = hx.fuentes.filter(f => f.maestro > 0).map(f => f.mes).sort(); const lastM = fm[fm.length - 1];
  const months = {}; const add = (id, m) => { if(!id || !m) return; (months[id] = months[id] || new Set()).add(m); };
  book.lab.forEach(l => { if(l.Examen !== "AntiHBs") add(l.Paciente, ymOf(dIso(l.FechaToma))); });
  book.ses.forEach(s => add(s.Paciente, ymOf(dIso(s.Fecha))));
  book.pac.forEach(p => { String(p.MesesMaestro || "").split(",").filter(Boolean).forEach(m => add(p.ID, m)); });
  book.mov = (book.mov || []).filter(m => m.Origen !== "HDX");
  hx.warn = hx.warn.filter(w => !/^\[cierre\]/.test(w));
  const WC = s => W("[cierre] " + s);
  book.pac.forEach(p => {
    const ms = [...(months[p.ID] || [])].sort(); p.MesesRegistro = ms.join(",");
    if(!String(p.MesesMaestro || "")) return; /* paciente creado en la aplicación: no se toca */
    const startKnown = dIso(p.IngresoUnidad) || dIso(p.InicioHD) || dIso(p.InicioTRR);
    p.PrimerRegistro = ms.length ? ms[0] + "-01" : null;
    const inLast = String(p.MesesMaestro || "").split(",").includes(lastM);
    const manual = p.Estado && p.Estado !== "Activo" && p.EstadoOrigen !== "HDX";
    if(!manual){
      if(inLast){ p.Estado = "Activo"; p.FechaEstado = null; p.EstadoOrigen = ""; }
      else if(ms.length){ const last = ms[ms.length - 1]; const fe = monthEndIso(last); const nextM = fm.find(m => m > last) || lastM;
        p.Estado = "Inactivo"; p.FechaEstado = fe; p.EstadoOrigen = "HDX";
        book.mov.push({ ID: "M-" + String(book.mov.length + 1).padStart(6, "0"), Paciente: p.ID, Fecha: fe, Tipo: "Otro egreso", Detalle: "[Inferido] Sale del maestro sin causa ni fecha registradas. Último registro: " + mesTxt(last) + "; ya no figura en el maestro de " + mesTxt(nextM) + ". Se usa como fecha el fin del último mes con registro.", Origen: "HDX", Usuario: "Lectura de Dashboards", Registrado: "" }); }
    }
    if(!startKnown && p.PrimerRegistro) WC(p.ID + " " + fullName(p) + ": sin inicio de diálisis ni ingreso a la unidad en el maestro; para el censo se toma el primer mes con registro (" + mesTxt(ymOf(p.PrimerRegistro)) + ") y no se clasifica como incidente ni como prevalente.");
    const it = dIso(p.InicioTRR), ig = dIso(p.IngresoUnidad);
    if(it && ig && ig < it) WC(p.ID + " " + fullName(p) + ": ingreso a la unidad (" + ig + ") anterior al inicio de diálisis (" + it + "). Una de las dos fechas está mal.");
    if(p.ModalidadPrevia && p.InicioHD) WC(p.ID + " " + fullName(p) + ": venía de " + p.ModalidadPrevia + " en esta misma unidad (inicio de TRR " + it + "); el " + dIso(p.InicioHD) + " es cambio de modalidad a HD, no un caso incidente.");
    if(!p.EPS) WC(p.ID + " " + fullName(p) + ": sin EPS en el maestro.");
    if(!dIso(p.FechaNac)) WC(p.ID + " " + fullName(p) + ": sin fecha de nacimiento; no entra a las estadísticas de edad y se asume adulto.");
    if(!p.HTA || !p.DM) WC(p.ID + " " + fullName(p) + ": HTA o DM sin diligenciar en el maestro.");
  });
  /* episodios de hospitalización: notas del mismo paciente separadas por ≤ gap días = un episodio (regla institucional provisional) */
  book.nov = book.nov.filter(n => n.Causa !== "EPISODIO");
  const notes = {}; book.nov.filter(n => n.Causa === "NOTA" && /HOSPITAL/i.test(n.TipoRaw || "") && n.Paciente).forEach(n => { (notes[n.Paciente] = notes[n.Paciente] || []).push(n); });
  Object.keys(notes).forEach(pid => { const L = notes[pid].sort((a, b) => dIso(a.Inicio) < dIso(b.Inicio) ? -1 : 1); let cur = null; const flush = () => { if(!cur) return; book.nov.push({ ID: "N-" + String(book.nov.length + 1).padStart(6, "0"), Paciente: pid, Tipo: "Hospitalización", TipoRaw: "Hospitalización", Inicio: cur.a, Fin: cur.b, Descripcion: cur.n.length + (cur.n.length === 1 ? " nota" : " notas") + " (" + cur.n.map(x => dIso(x.Inicio).slice(5).split("-").reverse().join("/")).join(", ") + "): " + [...new Set(cur.n.map(x => x.Descripcion))].join(" | "), Causa: "EPISODIO", Atribuible: "En estudio", Evitable: "", NotasN: cur.n.length, Usuario: "Lectura de Dashboards", Registrado: "" }); cur = null; };
    L.forEach(n => { const f = dIso(n.Inicio); if(cur && (new Date(f) - new Date(cur.b)) / 864e5 <= gap){ cur.b = f; cur.n.push(n); } else { flush(); cur = { a: f, b: f, n: [n] }; } }); flush(); });
  book.pac.sort((a, b) => String(a.ID) < String(b.ID) ? -1 : 1);
  return book;
};
})(typeof window !== "undefined" ? window : globalThis);

/* ---------- base compacta (para embeber) ---------- */
(function(root){
"use strict";
const HDX = root.HDX;
HDX.compact = function(book){
  const S = []; const si = s => { s = s == null ? "" : String(s); let i = S.indexOf(s); if(i < 0){ i = S.length; S.push(s); } return i; };
  const pi = {}; book.pac.forEach((p, i) => { pi[p.ID] = i; });
  const strip = o => { const r = {}; for(const k in o){ const v = o[k]; if(v == null || v === "" || k === "Registrado") continue; r[k] = v; } return r; };
  return { v: 1, S,
    pac: book.pac.map(strip),
    lab: book.lab.map(l => [pi[l.Paciente], l.FechaToma, si(l.Examen), l.Valor, si(l.Metodo), si(l.Usuario)]),
    ses: book.ses.map(s => [pi[s.Paciente], s.Fecha, si(s.Turno), s.Puesto == null ? "" : s.Puesto, si(s.Acceso), s.Gluco == null ? "" : s.Gluco, si(s.Usuario)]),
    evt: book.evt.map(strip), nov: book.nov.map(strip), mov: book.mov.map(strip), vac: book.vac.map(strip), hdx: book.cfgv.hdx };
};
HDX.expand = function(c){
  const S = c.S; const id = i => c.pac[i].ID; const mesDe = u => { const m = /Dashboard (\w+ de \d{4})/.exec(u); return m ? m[1] : ""; };
  const b = { pac: c.pac.map(p => Object.assign({}, p)), evt: c.evt.map(o => Object.assign({}, o)), nov: c.nov.map(o => Object.assign({}, o)), mov: c.mov.map(o => Object.assign({}, o)), vac: c.vac.map(o => Object.assign({}, o)), hdx: JSON.parse(JSON.stringify(c.hdx)) };
  b.lab = c.lab.map((l, i) => ({ ID: "L-" + String(i + 1).padStart(6, "0"), Paciente: id(l[0]), FechaToma: l[1], Examen: S[l[2]], Valor: l[3], Metodo: S[l[4]], Usuario: S[l[5]] }));
  b.ses = c.ses.map((s, i) => ({ ID: "S-" + String(i + 1).padStart(6, "0"), Fecha: s[1], Paciente: id(s[0]), Turno: S[s[2]], Puesto: s[3] === "" ? null : s[3], Tipo: "Programada", Estado: "Realizada", Motivo: "", Responsable: "", Nota: "Asistencia marcada en el Dashboard de " + mesDe(S[s[6]]), DuracionMin: null, Acceso: S[s[4]], PesoPre: null, PesoPost: null, TASPre: null, TADPre: null, TASPost: null, TADPost: null, Gluco: s[5] === "" ? null : s[5], Usuario: S[s[6]] }));
  return b;
};
})(typeof window !== "undefined" ? window : globalThis);


