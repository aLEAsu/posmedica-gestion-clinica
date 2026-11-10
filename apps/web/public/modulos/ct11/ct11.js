// Código propio del proyecto. Contratos y tecnologías v1.1 (punto de partida: prototipo v3.2 de la coordinación médica).
const DATA = window.__CT_DATA; /* matriz contractual: la entrega la API, solo al administrador */

"use strict";
/* =====================================================================
   Contratos y tecnologías · UNO-P · v1.0
   Archivo único, sin servidor. Fuente: contratos y anexos cargados (sin precios).
   ===================================================================== */
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm=s=>String(s||"").normalize("NFD").replace(/[̀-ͯ]/g,"").toUpperCase().replace(/[^A-Z0-9]+/g," ").trim();
const ICON={
 search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
 grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
 file:'<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M8 13h8M8 17h6"/>',
 alert:'<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
 ok:'<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
 x:'<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
 warn:'<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>',
 back:'<path d="M15 5l-7 7 7 7"/>',
 dl:'<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
 print:'<path d="M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><rect x="7" y="14" width="10" height="7"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 book:'<path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z"/><path d="M20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z"/>'
};
const ico=k=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(ICON[k]||"")+'</svg>';
const STI={ok:"ok",bad:"x",warn:"warn",info:"info"};
const pill=(t,cls)=>'<span class="pill '+(cls||"base")+'">'+(STI[cls]?ico(STI[cls]):"")+esc(t)+'</span>';
function toast(m){const t=$("toast");t.textContent=m;t.hidden=false;clearTimeout(toast._t);toast._t=setTimeout(()=>t.hidden=true,2600);}
function lsGet(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}

/* ---------------- datos ---------------- */
const C=DATA.C,P=DATA.P,PI={},CI={};
P.forEach(p=>PI[p.id]=p);C.forEach(c=>CI[c.id]=c);
const EPS_ORDER=[];C.forEach(c=>{if(!EPS_ORDER.includes(c.eps))EPS_ORDER.push(c.eps);});
const EPS_COLOR={};C.forEach(c=>EPS_COLOR[c.eps]=c.color);
const IT=DATA.I.map((a,ix)=>({ix,p:a[0],c:a[1],t:a[2],d:a[3],g:a[4],f:a[5],m:a[6],n:a[7],pg:a[8],ci:a[9]}));
IT.forEach(x=>{const p=PI[x.p];x.k=p.k;x.eps=CI[p.k].eps;x.h=" "+norm(x.c+" "+x.d+" "+x.g)+" ";x.hn=" "+norm(x.n)+" ";});
P.forEach(p=>{p.items=IT.filter(x=>x.p===p.id);p.hx=" "+norm((p.excluye||[]).join(" | "))+" ";p.eps=CI[p.k].eps;});
const MOD={P:"Incluido en paquete / plan",E:"Por evento",C:"Cotizado (no contratado)",D:"Evento marcado «ELIMINAR»",X:"Excluido expresamente",N:"No encontrado"};
const MODS={P:"Incluido",E:"Evento",C:"Cotizado",D:"Eliminar",X:"Excluido",N:"No encontrado"};
const TIPOS=[["HD","Hemodiálisis"],["DP","Diálisis peritoneal"],["NEFRO","Nefroprotección"],["TMND","TMND"],["PRE","Prediálisis"],["VIH","VIH"],["PREP","PrEP"],["PEP","PEP"],["EVENTO","Evento"],["LAB","Laboratorio"],["COT","Cotización"],["COD","Códigos"]];
const TIPO_N=Object.fromEntries(TIPOS);
const GRUPOS=[...new Set(IT.map(x=>x.g))].sort((a,b)=>a.localeCompare(b,"es"));
const TODAY=new Date();TODAY.setHours(0,0,0,0);
const pdate=s=>{if(!s)return null;const[a,b,c]=s.split("-").map(Number);return new Date(a,b-1,c);};
const fd=s=>{if(!s)return"—";const[a,b,c]=s.split("-");return c+"/"+b+"/"+a;};
function cstatus(c){
  if(c.estado==="propuesta")return["Propuesta · sin firma","info"];
  const fin=pdate(c.vigFin),ini=pdate(c.vigIni);
  if(fin&&fin<TODAY)return["Vencido el "+fd(c.vigFin),"bad"];
  if(ini&&ini>TODAY)return["Inicia el "+fd(c.vigIni),"info"];
  if(fin){const dias=Math.round((fin-TODAY)/864e5);return["Vigente · "+dias+" días restantes",dias<60?"warn":"ok"];}
  if(ini)return["Sin fecha de terminación","warn"];
  return["Sin fechas en el documento","warn"];
}

/* ---------------- búsqueda ---------------- */
function tokGroups(q){
  const n=(" "+norm(q)+" ").replace(/ KT V /g," KTV ").replace(/ ANTI HBS /g," ANTIHBS ").replace(/ HBA 1C /g," HBA1C ").trim();
  return n.split(" ").filter(Boolean).map(t=>{const a=[t];const s=DATA.SIN[t];if(s)s.split("|").forEach(x=>{x=norm(x);if(x&&!a.includes(x))a.push(x);});return a;});
}
function hit(hay,groups){
  return groups.every(alts=>alts.some(a=>(a.length<=3&&!/\d/.test(a))?hay.includes(" "+a+" "):hay.includes(a)));
}
function phraseTest(q){const g=tokGroups(q);return h=>g.length>0&&hit(h,g);}
function conceptAlts(label){return label.split("|").map(s=>s.trim()).filter(Boolean);}
function conceptTest(label){const ts=conceptAlts(label).map(phraseTest);return h=>ts.some(t=>t(h));}
function progStatus(items,p,exclTest){
  const L=items.filter(x=>x.p===p.id);
  for(const m of["P","E","C","D"])if(L.some(x=>x.m===m))return[m,L.length];
  if(exclTest&&exclTest(p.hx))return["X",0];
  return["N",0];
}

/* ---------------- estado de la vista ---------------- */
const VIEW=Object.assign({v:"buscar",q:"",eps:"",tipo:"",grp:"",mods:"PECD",obs:false,prog:""},lsGet("ct_view",{}));
VIEW.prog="";VIEW.ficha="";
const saveView=()=>lsSet("ct_view",{v:VIEW.v,eps:VIEW.eps,tipo:VIEW.tipo,mods:VIEW.mods,obs:VIEW.obs});

const NAV=[["buscar","Buscador de tecnologías","search"],["contratos","Contratos y programas","file"]];
function nav(){
  $("nav").innerHTML='<div class="grp">Consulta</div>'+NAV.map(([k,t,i])=>'<button data-v="'+k+'" '+(VIEW.v===k?'aria-current="page"':'')+'>'+ico(i)+esc(t)+(k==="contratos"?'<span class="count">'+C.length+'</span>':'')+'</button>').join("");
  $("nav").querySelectorAll("button").forEach(b=>b.onclick=()=>{VIEW.v=b.dataset.v;VIEW.ficha="";saveView();render();window.scrollTo(0,0);});
}
function head(t,sub,right){return'<div class="mhead"><div><h2>'+esc(t)+'</h2>'+(sub?'<p>'+sub+'</p>':'')+'</div>'+(right?'<div class="row noprint">'+right+'</div>':'')+'</div>';}

/* ---------------- BUSCADOR ---------------- */
const SUG=["eritropoyetina","hierro","calcitriol","sevelamer","PTH","Kt/V","albúmina","cefazolina","vancomicina","fluconazol","mupirocina","dolutegravir","bictegravir","carga viral","CD4","tuberculina","vacuna hepatitis B","nefrología","trabajo social","ambulancia","catéter","fístula","suplemento","903856","890239","TAC"];
function filtered(test){
  return IT.filter(x=>(!VIEW.eps||x.eps===VIEW.eps)&&(!VIEW.tipo||PI[x.p].tipo===VIEW.tipo)&&(!VIEW.grp||x.g===VIEW.grp)&&VIEW.mods.includes(x.m)&&(!VIEW.prog||x.p===VIEW.prog)&&(test(x.h)||(VIEW.obs&&test(x.hn))));
}
function rBuscar(){
  let h=head("Buscador de tecnologías","Escriba un medicamento, examen, insumo, servicio o código (CUPS, ATC, MD de Nueva EPS o CUM). El módulo muestra en qué contrato y programa aparece, con qué frecuencia y si está dentro del paquete, por evento o excluido. No contiene precios.");
  h+='<div class="card"><div class="row"><div class="searchbox"><input type="search" id="q" autocomplete="off" placeholder="p. ej. eritropoyetina, PTH, cefazolina, dolutegravir, 903856" value="'+esc(VIEW.q)+'" aria-label="Buscar tecnología"><span>'+ico("search")+'</span></div></div>'+
   '<div class="row" style="margin-top:10px">'+
   '<label class="field">EPS / pagador<select id="fEps"><option value="">Todas</option>'+EPS_ORDER.map(e=>'<option'+(VIEW.eps===e?' selected':'')+'>'+esc(e)+'</option>').join("")+'</select></label>'+
   '<label class="field">Programa<select id="fTipo"><option value="">Todos</option>'+TIPOS.map(([k,t])=>'<option value="'+k+'"'+(VIEW.tipo===k?' selected':'')+'>'+esc(t)+'</option>').join("")+'</select></label>'+
   '<label class="field">Grupo<select id="fGrp"><option value="">Todos</option>'+GRUPOS.map(g=>'<option'+(VIEW.grp===g?' selected':'')+'>'+esc(g)+'</option>').join("")+'</select></label>'+
   '<div class="field">Modalidad<div class="chips">'+[["P","Paquete / plan"],["E","Evento"],["C","Cotización"],["D","Marcado eliminar"]].map(([k,t])=>'<button class="chip sm'+(VIEW.mods.includes(k)?' on':'')+'" data-mod="'+k+'">'+t+'</button>').join("")+'</div></div>'+
   '<label class="field inline" style="margin-top:16px"><input type="checkbox" id="fObs" '+(VIEW.obs?'checked':'')+'> buscar también en observaciones</label>'+
   (VIEW.prog?'<span class="pill acc" style="margin-top:16px">Programa: '+esc(PI[VIEW.prog].corto)+' <button class="btn sm ghost" id="clrProg" style="min-height:20px;padding:0 4px">✕</button></span>':'')+
   '</div></div><div id="res" style="margin-top:14px"></div>';
  return h;
}
function bindBuscar(){
  const q=$("q");q.focus();q.setSelectionRange(q.value.length,q.value.length);
  let tm;q.oninput=()=>{clearTimeout(tm);tm=setTimeout(()=>{VIEW.q=q.value;rRes();},140);};
  $("fEps").onchange=e=>{VIEW.eps=e.target.value;saveView();rRes();};
  $("fTipo").onchange=e=>{VIEW.tipo=e.target.value;saveView();rRes();};
  $("fGrp").onchange=e=>{VIEW.grp=e.target.value;rRes();};
  $("fObs").onchange=e=>{VIEW.obs=e.target.checked;saveView();rRes();};
  document.querySelectorAll("[data-mod]").forEach(b=>b.onclick=()=>{const k=b.dataset.mod;VIEW.mods=VIEW.mods.includes(k)?VIEW.mods.replace(k,""):VIEW.mods+k;b.classList.toggle("on");saveView();rRes();});
  if($("clrProg"))$("clrProg").onclick=()=>{VIEW.prog="";render();};
  rRes();
}
let LAST=[];
function rRes(){
  const box=$("res");if(!box)return;const raw=VIEW.q.trim();
  if(norm(raw).length<2&&!VIEW.prog){
    const nC=IT.filter(x=>x.c).length,nI=IT.filter(x=>x.ci).length;
    box.innerHTML='<div class="kpis">'+
     [["Documentos contractuales",C.length,"7 fuentes · 5 pagadores"],["Programas / paquetes",P.length,"incluye evento y cotización"],["Tecnologías registradas",IT.length.toLocaleString("es-CO"),"ítems de paquete, evento y cotización"],["Con código",Math.round(nC/IT.length*100)+" %",nI+" de ellos inferidos de otro contrato"]].map(k=>'<div class="card"><div class="stat"><span class="k">'+k[0]+'</span><span class="v">'+k[1]+'</span><span class="d">'+k[2]+'</span></div></div>').join("")+'</div>'+
     '<div class="card"><h3>Pruebe con</h3><div class="chips" style="margin-top:8px">'+SUG.map(s=>'<button class="chip sm" data-sug="'+esc(s)+'">'+esc(s)+'</button>').join("")+'</div>'+
     '<p class="note" style="margin:12px 0 0">Acepta abreviaturas frecuentes: EPO, BUN, HbA1c, TSH, HBsAg, CV, ARV, TAR, DTG, BIC, TAF, TDF, PPD, EKG, FAV, entre otras.</p></div>'+
     '<p class="disclaimer" style="margin-top:14px"><b>Cómo leer el resultado.</b> «No encontrado» significa que el término no aparece en el documento cargado; no equivale a «no contratado». Revise también las exclusiones y, si el pagador lo exige, confirme con la EPS antes de prestar o facturar.</p>';
    box.querySelectorAll("[data-sug]").forEach(b=>b.onclick=()=>{VIEW.q=b.dataset.sug;$("q").value=VIEW.q;rRes();});
    LAST=[];return;
  }
  const test=norm(raw).length>=2?phraseTest(raw):()=>true;
  const res=filtered(test);LAST=res;
  const exclT=norm(raw).length>=2?test:null;
  // tarjetas por EPS
  const progs=P.filter(p=>(!VIEW.eps||p.eps===VIEW.eps)&&(!VIEW.tipo||p.tipo===VIEW.tipo)&&(!VIEW.prog||p.id===VIEW.prog));
  let h='<h3 class="sec">¿Dónde aparece?</h3><div class="legend2">'+["P","E","C","D","X","N"].map(k=>'<span><span class="st '+k+'">'+MODS[k]+'</span>'+esc(k==="P"?"dentro del paquete o plan":k==="E"?"se presta y factura aparte":k==="C"?"cotizado, sin contrato":k==="D"?"propuesto para retirar":k==="X"?"mencionado en las exclusiones":"no aparece en el documento")+'</span>').join("")+'</div>';
  h+='<div class="epsgrid">'+EPS_ORDER.filter(e=>progs.some(p=>p.eps===e)).map(e=>{
    const ps=progs.filter(p=>p.eps===e).map(p=>({p,s:progStatus(res,p,exclT)}));
    const rank={P:0,E:1,C:2,D:3,X:4,N:5};ps.sort((a,b)=>rank[a.s[0]]-rank[b.s[0]]);
    const stats=[...new Set(ps.map(o=>cstatus(CI[o.p.k])[0]))].join(" · ");
    const row=o=>'<div class="prow" data-prog="'+o.p.id+'" title="Filtrar por este programa"><span class="nm">'+esc(o.p.nombre)+'<span class="note mono">'+esc(o.p.codigo)+'</span></span><span class="st '+o.s[0]+'">'+MODS[o.s[0]]+(o.s[1]?' · '+o.s[1]:'')+'</span></div>';
    const yes=ps.filter(o=>o.s[0]!=="N"),no=ps.filter(o=>o.s[0]==="N");
    return'<div class="epscol"><h4><span class="dotc b-'+EPS_COLOR[e]+'"></span>'+esc(e)+'<small>'+esc(stats)+'</small></h4>'+yes.map(row).join("")+
     (no.length?(yes.length?'<details><summary class="note" style="cursor:pointer;padding:6px">'+no.length+' programa(s) sin coincidencia</summary>'+no.map(row).join("")+'</details>':'<p class="note" style="padding:6px;margin:0;border-top:1px solid var(--line)">No aparece en ninguno de sus '+no.length+' programa(s).</p>'):'')+'</div>';}).join("")+'</div>';
  // exclusiones que mencionan el término
  if(exclT){const ex=progs.filter(p=>(p.excluye||[]).some(t=>exclT(" "+norm(t)+" ")));
    if(ex.length)h+='<div class="alert bad" style="margin-top:14px">'+ico("x")+'<div><b>Mencionado en exclusiones</b><ul class="tight">'+ex.map(p=>'<li><b>'+esc(p.corto)+':</b> '+esc((p.excluye||[]).filter(t=>exclT(" "+norm(t)+" ")).join(" "))+'</li>').join("")+'</ul></div></div>';}
  // tabla
  h+='<div class="row" style="justify-content:space-between;margin:18px 0 8px"><h3 class="sec" style="margin:0">'+res.length.toLocaleString("es-CO")+' coincidencia(s)</h3><button class="btn sm noprint" id="csv">'+ico("dl")+'Exportar CSV</button></div>';
  if(!res.length)h+='<div class="card"><p class="empty">Sin coincidencias con los filtros actuales. Pruebe con el nombre genérico, menos palabras o active «buscar también en observaciones».</p></div>';
  else{
    const rows=res.slice().sort((a,b)=>EPS_ORDER.indexOf(a.eps)-EPS_ORDER.indexOf(b.eps)||P.indexOf(PI[a.p])-P.indexOf(PI[b.p])||a.ix-b.ix).slice(0,700);
    h+='<div class="tbl-wrap" style="max-height:640px"><table><thead><tr><th>Programa</th><th>Código</th><th>Descripción</th><th>Grupo</th><th>Frecuencia / cantidad</th><th>Modalidad</th></tr></thead><tbody>'+rows.map(trItem).join("")+'</tbody></table></div>';
    if(res.length>700)h+='<p class="note">Se muestran 700 de '+res.length+'. Afine la búsqueda o use los filtros.</p>';
  }
  box.innerHTML=h;
  box.querySelectorAll("[data-prog]").forEach(r=>r.onclick=()=>{VIEW.prog=VIEW.prog===r.dataset.prog?"":r.dataset.prog;render();});
  box.querySelectorAll("tr[data-ix]").forEach(r=>r.onclick=()=>itemDlg(IT[+r.dataset.ix]));
  if($("csv"))$("csv").onclick=()=>csv(res,"busqueda_"+(norm(raw).replace(/ /g,"_")||"todo"));
}
function codeCell(x){
  if(!x.c)return'<span class="muted">—</span>';
  return'<span class="codebadge">'+esc(x.c)+'</span>'+(x.ci?'<span class="inf" title="Código tomado de: '+esc(progName(x.ci))+'">inferido</span>':'');
}
function progName(ci){return ci.split("+").map(id=>PI[id]?PI[id].corto:id).join(", ");}
function trItem(x){const p=PI[x.p];
  return'<tr class="click" data-ix="'+x.ix+'"><td class="small"><span class="dotc b-'+EPS_COLOR[x.eps]+'"></span> <b>'+esc(p.corto)+'</b></td><td class="small">'+codeCell(x)+'</td><td class="desc">'+esc(x.d)+(x.n?'<div class="note">'+esc(x.n.length>180?x.n.slice(0,180)+"…":x.n)+'</div>':'')+'</td><td class="small">'+esc(x.g)+'</td><td class="small">'+esc(x.f)+'</td><td><span class="st '+x.m+'">'+MODS[x.m]+'</span></td></tr>';}
function itemDlg(x){const p=PI[x.p],c=CI[p.k];
  $("dlg").innerHTML='<div class="dlg" role="dialog" aria-modal="true"><h3>'+esc(x.d)+'</h3><dl class="kv">'+
   [["Pagador",c.eps],["Documento",c.titulo],["Programa",p.nombre+" · "+p.codigo],["Código",x.c?(x.c+(x.t?" ("+x.t+")":"")):"Sin código en el documento"],x.ci?["Origen del código","No consta en este documento. Se tomó de: "+progName(x.ci)+", donde la descripción coincide."]:null,["Grupo",x.g],["Frecuencia / cantidad",x.f],["Modalidad",MOD[x.m]],x.n?["Observación",x.n]:null,["Fuente",p.fuente+(x.pg&&!/xlsx|anexo DP|SERVICIOS|paquete|LABORATORIO|cotiz/i.test(x.pg)?" · pág. "+x.pg:"")],["Vigencia",cstatus(c)[0]]].filter(Boolean).map(([k,v])=>'<dt>'+esc(k)+'</dt><dd>'+esc(v)+'</dd>').join("")+'</dl>'+
   ((p.excluye||[]).length?'<div class="secttl">Exclusiones del programa</div><ul class="tight small">'+p.excluye.map(t=>'<li>'+esc(t)+'</li>').join("")+'</ul>':'')+
   '<div class="actions"><button class="btn" id="dOtros">Ver la misma tecnología en otros programas</button><button class="btn primary" id="dClose">Cerrar</button></div></div>';
  $("dlg").hidden=false;$("dClose").onclick=()=>$("dlg").hidden=true;
  $("dOtros").onclick=()=>{$("dlg").hidden=true;const w=norm(x.d).split(" ").filter(t=>t.length>2&&!/^(DE|DEL|LOS|LAS|POR|CON|PARA|SOLUCION|TABLETA|TABLETAS|INYECTABLE|CAPSULA|POLVO|SUERO|OTROS|FLUIDOS|CONSULTA|CONTROL|SEGUIMIENTO)$/.test(t)).slice(0,2).join(" ");VIEW.v="buscar";VIEW.q=w||x.c;VIEW.prog="";VIEW.eps="";VIEW.tipo="";render();};
}
function csv(rows,name){
  const H=["Pagador","Documento","Programa","Código del programa","Código","Tipo de código","Código inferido de","Descripción","Grupo","Frecuencia / cantidad","Modalidad","Observación","Página/hoja"];
  const q=v=>'"'+String(v==null?"":v).replace(/"/g,'""')+'"';
  const L=[H.map(q).join(";")].concat(rows.map(x=>{const p=PI[x.p];return[x.eps,CI[p.k].titulo,p.nombre,p.codigo,x.c,x.t,x.ci?progName(x.ci):"",x.d,x.g,x.f,MOD[x.m],x.n,x.pg].map(q).join(";");}));
  const b=new Blob(["﻿"+L.join("\r\n")],{type:"text/csv;charset=utf-8"});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=name.slice(0,60)+".csv";document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);toast("CSV descargado ("+rows.length+" filas)");
}

/* ---------------- CONTRATOS ---------------- */
function rContratos(){
  if(VIEW.ficha)return rFicha(PI[VIEW.ficha]);
  let h=head("Contratos y programas","Un bloque por documento contractual: partes, vigencia, modalidad, programas con su código y las reglas que cambian la operación o la facturación. Los valores en pesos se omitieron a propósito.");
  h+='<div class="ctr">'+C.map(c=>{const[st,cl]=cstatus(c);const ps=P.filter(p=>p.k===c.id);
    return'<details class="box"><summary><span class="dotc b-'+c.color+'"></span><span style="flex:1;min-width:0">'+esc(c.eps)+' · <span class="muted" style="font-weight:600">'+esc(c.titulo)+'</span></span>'+pill(st,cl)+'</summary><div class="inner">'+
     '<dl class="kv">'+[["Documento",c.doc],["Versión / fecha",c.version],["Partes",c.partes],["Firmas",c.firmas],["Modalidad",c.modalidad],["Población / cobertura",c.poblacion],["Vigencia",c.vigTxt],c.habil?["Servicios habilitados",c.habil]:null].filter(Boolean).map(([k,v])=>'<dt>'+esc(k)+'</dt><dd>'+esc(v)+'</dd>').join("")+'</dl>'+
     '<div class="secttl">Programas</div><div class="tbl-wrap"><table><thead><tr><th>Programa</th><th>Código</th><th class="num">Ítems</th><th>Composición</th><th></th></tr></thead><tbody>'+ps.map(p=>{
      const g={};p.items.forEach(x=>g[x.g]=(g[x.g]||0)+1);const comp=Object.entries(g).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([k,v])=>k.split(" /")[0]+" "+v).join(" · ");
      return'<tr><td><b>'+esc(p.nombre)+'</b><div class="note">'+esc(TIPO_N[p.tipo]||p.tipo)+'</div></td><td class="mono small">'+esc(p.codigo)+'</td><td class="num">'+p.items.length+'</td><td class="small muted">'+esc(comp)+'</td><td><button class="btn sm" data-ficha="'+p.id+'">Ver ficha</button></td></tr>';}).join("")+'</tbody></table></div>'+
     (c.reglas&&c.reglas.length?'<div class="secttl">Reglas del contrato</div><ul class="tight small">'+c.reglas.map(r=>'<li>'+esc(r)+'</li>').join("")+'</ul>':'')+
'</div></details>';}).join("")+'</div>';
  return h;
}
function rFicha(p){const c=CI[p.k];const[st,cl]=cstatus(c);
  const g=VIEW.fgrp||"";const qq=VIEW.fq||"";const t=norm(qq).length>=2?phraseTest(qq):()=>true;
  const L=p.items.filter(x=>(!g||x.g===g)&&t(x.h));
  const G=[...new Set(p.items.map(x=>x.g))];
  let h='<div class="row noprint" style="margin-bottom:10px"><button class="btn sm" id="back">'+ico("back")+'Contratos</button></div>';
  h+=head(p.nombre,esc(c.eps)+' · '+esc(c.titulo),'<button class="btn sm" id="fcsv">'+ico("dl")+'Exportar CSV</button><button class="btn sm" onclick="window.print()">'+ico("print")+'Imprimir</button>');
  h+='<div class="grid g3" style="margin-bottom:14px"><div class="card"><div class="stat"><span class="k">Código</span><span class="v mono" style="font-size:18px">'+esc(p.codigo)+'</span><span class="d">'+esc(p.fuente)+'</span></div></div>'+
     '<div class="card"><div class="stat"><span class="k">Vigencia</span><span class="v" style="font-size:18px">'+pill(st,cl)+'</span><span class="d">'+esc(c.vigTxt)+'</span></div></div>'+
     '<div class="card"><div class="stat"><span class="k">Ítems</span><span class="v">'+p.items.length+'</span><span class="d">'+p.items.filter(x=>x.ci).length+' con código inferido · '+p.items.filter(x=>!x.c).length+' sin código</span></div></div></div>';
  const blocks=[["Incluye (texto del documento)",p.incluye],["Reglas de autorización y facturación",p.reglas],["Exclusiones",p.excluye],["Interrupción o ruptura del paquete",p.interrumpe]].filter(b=>b[1]&&b[1].length);
  if(blocks.length)h+='<div class="grid g2" style="margin-bottom:14px">'+blocks.map(([t,l])=>'<div class="card"><h3>'+esc(t)+'</h3><ul class="tight small">'+l.map(r=>'<li>'+esc(r)+'</li>').join("")+'</ul></div>').join("")+'</div>';
  h+='<div class="filterbar noprint"><input type="search" id="fq" placeholder="Filtrar dentro del programa" value="'+esc(qq)+'" style="flex:1 1 240px"><div class="chips"><button class="chip sm'+(!g?' on':'')+'" data-fg="">Todos</button>'+G.map(x=>'<button class="chip sm'+(g===x?' on':'')+'" data-fg="'+esc(x)+'">'+esc(x)+' · '+p.items.filter(y=>y.g===x).length+'</button>').join("")+'</div></div>';
  h+='<div class="tbl-wrap" style="max-height:70vh"><table><thead><tr><th>#</th><th>Código</th><th>Descripción</th><th>Grupo</th><th>Frecuencia / cantidad</th><th>Modalidad</th></tr></thead><tbody>'+L.map((x,i)=>'<tr class="click" data-ix="'+x.ix+'"><td class="num small muted">'+(i+1)+'</td><td class="small">'+codeCell(x)+'</td><td class="desc">'+esc(x.d)+(x.n?'<div class="note">'+esc(x.n.length>200?x.n.slice(0,200)+"…":x.n)+'</div>':'')+'</td><td class="small">'+esc(x.g)+'</td><td class="small">'+esc(x.f)+'</td><td><span class="st '+x.m+'">'+MODS[x.m]+'</span></td></tr>').join("")+'</tbody></table></div>';
  return h;
}
function bindContratos(){
  document.querySelectorAll("[data-ficha]").forEach(b=>b.onclick=()=>{VIEW.ficha=b.dataset.ficha;VIEW.fgrp="";VIEW.fq="";render();window.scrollTo(0,0);});
  if($("back"))$("back").onclick=()=>{VIEW.ficha="";render();};
  if(VIEW.ficha){const p=PI[VIEW.ficha];
    document.querySelectorAll("[data-fg]").forEach(b=>b.onclick=()=>{VIEW.fgrp=b.dataset.fg;render();});
    let tm;$("fq").oninput=e=>{clearTimeout(tm);tm=setTimeout(()=>{VIEW.fq=e.target.value;render();const f=$("fq");f.focus();f.setSelectionRange(f.value.length,f.value.length);},250);};
    document.querySelectorAll("tr[data-ix]").forEach(r=>r.onclick=()=>itemDlg(IT[+r.dataset.ix]));
    $("fcsv").onclick=()=>csv(p.items,"programa_"+p.id);}
}

/* ---------------- render ---------------- */
function render(){
  nav();
  const T={buscar:["Buscador de tecnologías",rBuscar,bindBuscar],contratos:["Contratos y programas",rContratos,bindContratos]}[VIEW.v];
  if(!T){VIEW.v="buscar";return render();}
  $("ttl").textContent=T[0];$("out").innerHTML=T[1]();T[2]();
}
function setTheme(t){document.documentElement.setAttribute("data-theme",t);try{localStorage.setItem("dp_theme",t);}catch(e){}document.querySelectorAll("[data-themeset]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.themeset===t)));}
document.querySelectorAll("[data-themeset]").forEach(b=>b.onclick=()=>setTheme(b.dataset.themeset));
setTheme((()=>{try{return localStorage.getItem("dp_theme")||"dark";}catch(e){return"dark";}})());
$("dlg").addEventListener("click",e=>{if(e.target.id==="dlg")$("dlg").hidden=true;});
document.addEventListener("keydown",e=>{if(e.key==="Escape")$("dlg").hidden=true;if(e.key==="/"&&document.activeElement.tagName!=="INPUT"){e.preventDefault();VIEW.v="buscar";render();}});
$("btnPrint").onclick=()=>window.print();
render();


