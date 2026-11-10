// Código propio del proyecto. Ruta de Nefroprotección (punto de partida: prototipo v3.2).

/* ===================== GESTIÓN DEL PROGRAMA ===================== */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
const fd=NP.fd;
const iso=d=>{const p=x=>String(x).padStart(2,"0");return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate());};
const pdate=s=>{if(!s)return null;const[y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d);};
const ST={book:null,name:"",demo:false,db:false,snaps:[],indSel:"nefro_01_1",trend:null};
const VERSION="8.0";
let DL=null;try{if(window.claude&&window.claude.use)window.claude.use("downloads").then(x=>{DL=x;}).catch(()=>{});}catch(e){}

/* ---------- API (PostgREST detrás de nginx en /api) ---------- */
const API="/api/v1/nefro/pg/"; /* fachada del servidor */
async function apiGet(path){const r=await fetch(API+path,{headers:{Accept:"application/json"}});if(!r.ok)throw new Error(r.status+" "+(await r.text()).slice(0,300));return r.json();}
async function apiRpc(fn,payload){const r=await fetch(API+"rpc/"+fn,{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify({p:payload})});const t=await r.text();if(!r.ok){let m=t;try{m=JSON.parse(t).message||t;}catch(e){}throw new Error(m);}return t?JSON.parse(t):null;}
async function apiPost(path,body){const r=await fetch(API+path,{method:"POST",headers:{"Content-Type":"application/json",Prefer:"return=minimal"},body:JSON.stringify(body)});if(!r.ok){let m=await r.text();try{m=JSON.parse(m).message||m;}catch(e){}throw new Error(m);}}
async function probe(){if(!/^https?:$/.test(location.protocol)||/claude/.test(location.hostname))return false;
  try{const ctl=new AbortController();const to=setTimeout(()=>ctl.abort(),3500);const r=await fetch(API+"eps?select=id,nombre",{signal:ctl.signal,headers:{Accept:"application/json"}});clearTimeout(to);if(!r.ok)return false;const j=await r.json();return Array.isArray(j)&&j.length>0&&"nombre" in j[0];}catch(e){return false;}}
async function loadDb(){
  $("bookinfo").textContent="Cargando la base de datos…";
  const[eps,pac,lab,val,at,nov,mod,con]=await Promise.all([apiGet("eps?select=id,nombre"),apiGet("paciente?select=*"),
    apiGet("laboratorio?anulado=is.false&select=id,paciente_id,fecha_toma,examen,valor"),
    apiGet("valoracion?anulado=is.false&select=id,paciente_id,fecha,profesional,tipo,pa_sistolica,pa_diastolica,peso_kg,talla_cm,cintura_cm,ieca_ara_ii,isglt2,estatina,finerenona,ajuste_dm,hta_resistente,cronicidad_en_hc,conducta,causa_erc,salud_autopercibida,karnofsky,proximo_control"),
    apiGet("atencion?anulado=is.false&select=id,paciente_id,fecha,disciplina,estado"),apiGet("novedad?select=id,paciente_id,fecha,tipo,detalle"),apiGet("v_eps_modelo_vigente"),apiGet("contacto_gestion?select=paciente_id,fecha_hora,medio,resultado,cita_fecha,motivo,observaciones").catch(()=>[])]);
  mod.forEach(m=>{window.EPSMODEL[m.eps]={inter:m.contacto_intermedio,interMeses:m.contacto_meses,ajustePor:m.ajuste_metas_por,multi:m.multidisciplinario,meds:m.medicamentos_contratados,vigente:m.vigente_desde,obs:m.observaciones};});
  setBook(COH.fromApi({eps,pac,lab,val,at,nov,con}),"Base de datos del programa",false,true);
}
window.MG={show,get book(){return ST.book;},get dbMode(){return ST.db;},snapshotFor,saveValoracion,patients:()=>ST.book?ST.book.pac:[]};
async function saveValoracion(d,c,P,note){
  const B=ST.book;const pid=B&&B.ids&&B.ids[d.pid];
  if(!pid)throw new Error("El código «"+d.pid+"» no existe en la base. Regístrelo primero (importación del libro o creación del paciente).");
  const C=window.CODES,r1=v=>v==null?null:Math.round(v*10)/10;
  const v={paciente_id:pid,fecha:iso(d.fCons),profesional:C.PROFTXT[d.prof],tipo:d.tipo==="primera"?"PRIMERA VEZ":"CONTROL",pa_sistolica:d.pas,pa_diastolica:d.pad,peso_kg:d.peso,talla_cm:d.talla,cintura_cm:d.cint,
    ieca_ara_ii:C.MEDTXT[d.meds.raas],isglt2:C.MEDTXT[d.meds.sglt2],estatina:C.MEDTXT[d.meds.stat],finerenona:d.dmTipo==="2"?C.MEDTXT[d.meds.fin]:null,ajuste_dm:d.dm?d.dmAj:null,hta_resistente:d.htaRes,cronicidad_en_hc:d.cronHC,
    conducta:C.CONDTXT[d.conducta]||null,causa_erc:C.CAUSATXT[d.causa]||null,salud_autopercibida:d.sf1?d.sf1.toUpperCase():null,karnofsky:d.kps,sintomas:d.sint.filter(s=>s.on).map(s=>s.label),
    erc:C.ERCTXT[c.erc],estadio:c.G,albuminuria:c.A,riesgo_kdigo:c.risk,grupo:c.grupo,tfge:r1(d.tfg),kfre_2a:c.kfre?r1(c.kfre.r2*100):null,kfre_5a:c.kfre?r1(c.kfre.r5*100):null,
    proximo_control:P.rev&&P.rev.date?iso(P.rev.date):null,nota_hc:note,version_herramienta:VERSION};
  const labs=window.APP.labList(d).map(x=>({fecha_toma:iso(x.f),examen:x.E,valor:x.v}));
  const plan=P.rows.map(r=>({seccion:r.sec,clave:r.key||null,actividad:r.act,descripcion:r.what,frecuencia:r.cada,intervalo_meses:r.m||(r.wk?Math.round(r.wk/4.345*100)/100:null),fecha_programada:r.dt?iso(r.dt):null,base:r.tag,motivo:r.why}));
  const res=await apiRpc("registrar_valoracion",{valoracion:v,laboratorios:labs,plan});
  await loadDb();
  return "Guardado: valoración n.º "+res.valoracion_id+", "+res.laboratorios+" paraclínico(s) nuevo(s) y "+res.plan+" ítems del plan.";
}
async function importToDb(wb){
  const S=COH.sheetsFromWb(wb);const B=COH.parseRows(S);
  if(B.missing.length)throw new Error("Faltan hojas: "+B.missing.join(", "));
  const isoD=d=>d?iso(d):null,T=COH.toDate,N=COH.toNum,yn=v=>COH.norm(v)==="SI";
  const DM={NO:"NO","TIPO 2":"TIPO 2","TIPO 1":"TIPO 1",OTRA:"OTRA"};
  const pac=(S.Pacientes||[]).filter(r=>r.codigo&&!/^EJEMPLO/i.test(r.codigo)).map(r=>({codigo:String(r.codigo).trim(),tipo_documento:r.tipo_documento?COH.norm(r.tipo_documento):null,documento:r.documento==null?null:String(r.documento),nombre_completo:r.nombre_completo||"",fecha_nacimiento:isoD(T(r.fecha_nacimiento)),sexo:COH.norm(r.sexo)||null,eps:COH.matchEps(r.eps)||null,municipio:r.municipio||null,direccion:r.direccion||null,telefono_1:r.telefono==null?(r.telefono_1==null?null:String(r.telefono_1)):String(r.telefono),telefono_2:r.telefono_2==null?null:String(r.telefono_2),acudiente_nombre:r.acudiente||null,acudiente_telefono:r.telefono_acudiente==null?null:String(r.telefono_acudiente),fecha_ingreso:isoD(T(r.fecha_ingreso)),hta:yn(r.hta),diabetes:DM[COH.norm(r.diabetes)]||"NO",enf_cardiovascular:yn(r.enfermedad_cardiovascular),causa_erc:r.causa_erc?COH.norm(r.causa_erc):null,situacion_renal:r.situacion_renal?COH.norm(r.situacion_renal):"SIN TRR",estado:r.estado?COH.norm(r.estado):"ACTIVO",fecha_estado:isoD(T(r.fecha_estado)),observaciones:r.observaciones||null}));
  const EXN={creat:"CREATININA",tfg:"TFGE_REPORTADA",rac:"RAC",hba1c:"HBA1C",ldl:"LDL",hb:"HEMOGLOBINA",k:"POTASIO",ca:"CALCIO",fos:"FOSFORO",pth:"PTH",hco3:"BICARBONATO",alb:"ALBUMINA",fa:"FOSFATASA_ALCALINA"};
  const lab=B.lab.map(l=>({codigo:l.c,fecha_toma:iso(l.fecha),examen:EXN[l.k],valor:l.v}));
  const nv=v=>v==null?null:v;
  const val=(S.Valoraciones||[]).filter(r=>r.codigo&&!/^EJEMPLO/i.test(r.codigo)&&T(r.fecha)).map(r=>({codigo:String(r.codigo).trim(),fecha:iso(T(r.fecha)),profesional:COH.norm(r.profesional)||"MEDICINA GENERAL",tipo:r.tipo?COH.norm(r.tipo):"CONTROL",pa_sistolica:nv(N(r.pa_sistolica)),pa_diastolica:nv(N(r.pa_diastolica)),peso_kg:N(r.peso_kg),talla_cm:N(r.talla_cm),cintura_cm:N(r.cintura_cm),ieca_ara_ii:r.ieca_ara_ii?COH.norm(r.ieca_ara_ii):null,isglt2:r.isglt2?COH.norm(r.isglt2):null,estatina:r.estatina?COH.norm(r.estatina):null,finerenona:r.finerenona?COH.norm(r.finerenona):null,ajuste_dm:r.ajuste_dm?yn(r.ajuste_dm):null,hta_resistente:yn(r.hta_resistente),cronicidad_en_hc:yn(r.cronicidad_en_hc),conducta:r.conducta?COH.norm(r.conducta):null,causa_erc:r.causa_erc?COH.norm(r.causa_erc):null,salud_autopercibida:r.salud_autopercibida?COH.norm(r.salud_autopercibida):null,karnofsky:N(r.karnofsky),proximo_control:isoD(T(r.proximo_control))}));
  const at=(S.Atenciones||[]).filter(r=>r.codigo&&!/^EJEMPLO/i.test(r.codigo)&&T(r.fecha)).map(r=>({codigo:String(r.codigo).trim(),fecha:iso(T(r.fecha)),disciplina:COH.norm(r.disciplina),estado:r.estado?COH.norm(r.estado):"REALIZADA"}));
  const nov=(S.Novedades||[]).filter(r=>r.codigo&&!/^EJEMPLO/i.test(r.codigo)&&T(r.fecha)).map(r=>({codigo:String(r.codigo).trim(),fecha:iso(T(r.fecha)),tipo:COH.norm(r.tipo),detalle:r.detalle||null}));
  const res=await apiRpc("importar_libro",{pacientes:pac,laboratorios:lab,valoraciones:val,atenciones:at,novedades:nov});
  await loadDb();
  return res;
}

/* ---------- Pacientes: crear, editar, registrar y anular ---------- */
const PST={sel:null,q:"",estado:"ACTIVO",eps:"",nuevo:false,pre:null,anular:null,msg:""};
const CAP=a=>a.map(x=>Array.isArray(x)?x:[x,x.charAt(0)+x.slice(1).toLowerCase()]);
const OPT=(arr,val)=>arr.map(o=>{const[v,l]=Array.isArray(o)?o:[o,o];return'<option value="'+esc(v)+'"'+(String(val==null?"":val)===String(v)?" selected":"")+'>'+esc(l)+'</option>';}).join("");
const L_TIPODOC=[["","—"],"CC","TI","CE","PA","PT","RC","AS","MS"];
const L_CAUSA=[["","Sin registrar"],["DIABETICA","Enfermedad renal diabética"],["HIPERTENSIVA","Nefropatía hipertensiva"],["GLOMERULOPATIA","Glomerulopatía"],["POLIQUISTOSIS","Poliquistosis renal"],["UROPATIA OBSTRUCTIVA","Uropatía obstructiva o litiasis"],["TUBULOINTERSTICIAL","Tubulointersticial o nefrotóxicos"],["OTRA","Otra"],["NO ESTABLECIDA","No establecida"]];
const L_DM=[["NO","No"],["TIPO 2","Tipo 2"],["TIPO 1","Tipo 1"],["OTRA","Otra"]];
const L_SIT=[["SIN TRR","Sin terapia de reemplazo"],["G5 TMND","G5 con TMND"],["G5 PREPARACION TRR","G5 en preparación para TRR"]];
const L_ESTADO=[["ACTIVO","Activo"],["EGRESO","Egreso"],["TRR","En diálisis o trasplante"],["FALLECIDO","Fallecido"],["TRASLADO","Traslado"]];
const L_NOV=["INGRESO","CAMBIO EPS","HOSPITALIZACION","INICIO DIALISIS","TRASPLANTE","FALLECIMIENTO","EGRESO VOLUNTARIO","TRASLADO","OTRA"];
const L_DISC=["NUTRICION","ENFERMERIA","PSICOLOGIA","TRABAJO SOCIAL","EDUCACION","VACUNA INFLUENZA","RCV","TAMIZAJE DESNUTRICION","QUIMICA FARMACEUTICA","SOPORTE PALIATIVO","NEFROLOGIA","MEDICO EXPERTO","MEDICINA GENERAL","MEDICINA INTERNA"];
const L_EX=[["CREATININA","Creatinina (mg/dL)"],["TFGE_REPORTADA","TFGe reportada"],["RAC","RAC (mg/g)"],["ALBUMINURIA","Albuminuria (mg/L)"],["HBA1C","HbA1c (%)"],["GLICEMIA","Glucemia basal (mg/dL)"],["COLESTEROL_TOTAL","Colesterol total (mg/dL)"],["HDL","cHDL (mg/dL)"],["LDL","cLDL (mg/dL)"],["TRIGLICERIDOS","Triglicéridos (mg/dL)"],["CREATININA_ORINA_24H","Creatinina en orina 24 h"],["ANTI_HBS","Anti-HBs (mUI/mL)"],["PARCIAL_ORINA","Parcial de orina (texto)"],["QUIMICO_ORINA","Químico de orina (texto)"],["HEMOGLOBINA","Hemoglobina (g/dL)"],["POTASIO","Potasio (mEq/L)"],["CALCIO","Calcio (mg/dL)"],["FOSFORO","Fósforo (mg/dL)"],["PTH","PTH (pg/mL)"],["BICARBONATO","Bicarbonato (mmol/L)"],["ALBUMINA","Albúmina (g/dL)"]];
const CAUSA_X={dm:"DIABETICA",hta:"HIPERTENSIVA",glom:"GLOMERULOPATIA",pq:"POLIQUISTOSIS",uro:"UROPATIA OBSTRUCTIVA",nti:"TUBULOINTERSTICIAL",otra:"OTRA",desc:"NO ESTABLECIDA"};
const SIT_X={"":"SIN TRR",tmnd:"G5 TMND",trr:"G5 PREPARACION TRR"};
const DM_X={"":"NO","2":"TIPO 2","1":"TIPO 1",otra:"OTRA"};
const EXK={creat:"CREATININA",tfg:"TFGE_REPORTADA",rac:"RAC",hba1c:"HBA1C",ldl:"LDL",hb:"HEMOGLOBINA",k:"POTASIO",ca:"CALCIO",fos:"FOSFORO",pth:"PTH",hco3:"BICARBONATO",alb:"ALBUMINA",fa:"FOSFATASA_ALCALINA"};
async function apiPatch(path,body){const r=await fetch(API+path,{method:"PATCH",headers:{"Content-Type":"application/json",Prefer:"return=minimal"},body:JSON.stringify(body)});if(!r.ok){let m=await r.text();try{m=JSON.parse(m).message||m;}catch(e){}throw new Error(m);}}
function nextCode(){const B=ST.book;let mx=0;(B?B.pac:[]).forEach(p=>{const m=/^NP-(\d+)$/.exec(p.codigo);if(m)mx=Math.max(mx,+m[1]);});return"NP-"+String(mx+1).padStart(4,"0");}
async function copyText(txt,msgEl,label){try{await navigator.clipboard.writeText(txt);msgEl.textContent=label+" copiada. Péguela en la primera fila vacía (columna A) de la hoja correspondiente del libro.";}catch(e){msgEl.textContent="No se pudo copiar automáticamente. Seleccione el texto, cópielo y péguelo en la columna A: ";const ta=document.createElement("textarea");ta.readOnly=true;ta.rows=2;ta.style.width="100%";ta.value=txt;msgEl.appendChild(ta);ta.select();}}
const tsv=row=>row.map(x=>x==null?"":String(x).replace(/[\t\n]/g," ")).join("\t");
const fdi=d=>d?fd(d):"";
window.MG.newPatientFrom=function(d){PST.nuevo=true;PST.sel=null;PST.pre={codigo:d.pid,fnac:d.fnac,sexo:d.sexo,eps:d.eps,hta:d.hta,dm:DM_X[d.dmTipo]||"NO",ecv:d.ecv,causa:CAUSA_X[d.causa]||"",sit:SIT_X[d.terapia]||"SIN TRR"};show("pac");window.scrollTo(0,0);};

function rPac(out){
  const B=ST.book;const all=B?B.pac:[];
  const q=COH.norm(PST.q);
  const list=all.filter(p=>(PST.estado==="TODOS"||p.estado===PST.estado)&&(!PST.eps||(PST.eps==="sin"?!p.eps:p.eps===PST.eps))&&(!q||COH.norm(p.codigo+" "+p.nombre+" "+p.doc).includes(q))).sort((a,b)=>a.codigo.localeCompare(b.codigo));
  let h=head("Pacientes",ST.db?"Crear y actualizar pacientes, registrar atenciones, paraclínicos, novedades y gestión de contacto. Todo queda auditado con su usuario.":(B?"Los cambios se guardan en el libro cargado; descárguelo al terminar.":"Sin libro cargado: el formulario genera la fila para pegar en el Excel."),'<button type="button" class="btn primary" id="pacnew">Nuevo paciente</button>');
  h+='<div class="pacgrid"><section class="panel paclist"><label class="f">Buscar por código, nombre o documento<input type="text" id="pacq" value="'+esc(PST.q)+'"></label><div class="row" style="margin-top:8px"><label class="f">EPS<select id="paceps">'+OPT([["","Todas"]].concat(COH.EPS.map(e=>[e,epsShort(e)])).concat([["sin","Sin EPS"]]),PST.eps)+'</select></label><label class="f">Estado<select id="pacest">'+OPT([["ACTIVO","Activos"],["TODOS","Todos"],["EGRESO","Egreso"],["TRR","TRR"],["FALLECIDO","Fallecidos"],["TRASLADO","Traslados"]],PST.estado)+'</select></label></div>';
  const epsN=COH.EPS.map(e=>[e,list.filter(p=>p.eps===e).length]).filter(x=>x[1]);
  h+='<p class="note" style="margin:8px 0">'+list.length+' paciente(s)'+(epsN.length>1?' · '+epsN.map(([e,n])=>esc(epsShort(e))+' '+n).join(" · "):'')+(list.length>300?'; se muestran 300, afine la búsqueda':'')+'.</p><div class="tablebox"><table class="pact"><thead><tr><th>Código</th><th>Nombre</th><th>EPS</th><th>Estadio</th><th>Estado</th></tr></thead><tbody>'+
    list.slice(0,300).map(p=>{const s=ST.smap&&ST.smap[p.codigo];return'<tr data-pac="'+esc(p.codigo)+'"'+(PST.sel===p.codigo?' class="sel"':'')+'><td class="mono">'+esc(p.codigo)+'</td><td>'+esc(p.nombre)+'<span class="sub">'+esc((p.tipodoc||"")+" "+(p.doc||""))+'</span></td><td>'+esc(epsShort(p.eps))+'</td><td class="mono">'+(s?esc(stage(s)):"—")+'</td><td>'+esc(p.estado.toLowerCase())+'</td></tr>';}).join("")+'</tbody></table></div></section>';
  h+='<div class="pacdet">'+pacDetail()+'</div></div>';
  out.innerHTML=h;
  $("pacq").addEventListener("input",e=>{PST.q=e.target.value;const pos=e.target.selectionStart;renderMg("pac");const el=$("pacq");el.focus();el.setSelectionRange(pos,pos);});
  $("pacest").addEventListener("change",e=>{PST.estado=e.target.value;renderMg("pac");});
  $("paceps").addEventListener("change",e=>{PST.eps=e.target.value;renderMg("pac");});
  if($("calexp"))$("calexp").addEventListener("click",()=>{const s=ST.smap[PST.sel];if(s)calExport(s);});
  $("pacnew").addEventListener("click",()=>{PST.nuevo=true;PST.sel=null;PST.pre=null;PST.msg="";renderMg("pac");});
  out.querySelectorAll("tr[data-pac]").forEach(tr=>tr.addEventListener("click",()=>{PST.sel=tr.dataset.pac;PST.nuevo=false;PST.anular=null;PST.msg="";renderMg("pac");if(window.innerWidth<=920){const d=document.querySelector(".pacdet");if(d)d.scrollIntoView({block:"start"});}}));
  bindPac(out);
}
function pacDetail(){
  const B=ST.book;const p=PST.sel&&B?B.pac.find(x=>x.codigo===PST.sel):null;
  if(!p&&!PST.nuevo)return'<div class="panel empty"><p style="margin:0">Seleccione un paciente de la lista o cree uno nuevo.</p></div>';
  const pre=PST.pre||{};const isNew=!p;
  const v=p?{codigo:p.codigo,tipodoc:p.tipodoc,doc:p.doc,nombre:p.nombre,n1:p.n1,n2:p.n2,ap1:p.ap1,ap2:p.ap2,fnac:p.fnac,sexo:p.sexo,eps:p.eps,municipio:p.municipio,dir:p.dir,tel:p.tel,tel2:p.tel2,correo:p.correo||"",acud:p.acud,acudTel:p.acudTel,fing:p.fing,hta:p.hta,dm:DM_X[p.dmTipo]||"NO",ecv:p.ecv,causa:CAUSA_X[p.causa]||"",sit:SIT_X[p.terapia]||"SIN TRR",estado:p.estado,festado:p.festado,obs:p.obs||""}
    :{codigo:pre.codigo||nextCode(),tipodoc:"CC",doc:"",nombre:"",n1:"",n2:"",ap1:"",ap2:"",fnac:pre.fnac||null,sexo:pre.sexo||"",eps:pre.eps||"",municipio:"Mocoa",dir:"",tel:"",tel2:"",correo:"",acud:"",acudTel:"",fing:new Date(),hta:!!pre.hta,dm:pre.dm||"NO",ecv:!!pre.ecv,causa:pre.causa||"",sit:pre.sit||"SIN TRR",estado:"ACTIVO",festado:null,obs:""};
  const D=x=>x?iso(x):"";
  let h='';const sp=p&&ST.smap&&ST.smap[p.codigo];
  if(sp)h+='<section class="panel"><h3>'+esc(p.codigo)+' · '+esc(p.nombre||"")+'</h3><div class="chips"><span class="chip">'+esc(epsShort(p.eps))+'</span><span class="chip">Estadio <b>'+esc(stage(sp))+'</b></span>'+(sp.c.grupo?'<span class="chip">'+esc(NP.GRUPO[sp.c.grupo])+'</span>':'')+(sp.d.tfg!=null?'<span class="chip">TFGe <b>'+Math.round(sp.d.tfg)+'</b></span>':'')+(sp.rcv&&sp.rcv.main?'<span class="chip">RCV <b>'+esc(sp.rcv.main.txt)+'</b></span>':'')+'</div></section>'+calHtml(sp);
  else if(p&&p.estado!=="ACTIVO")h+='<div class="alert info"><p>Paciente '+esc(p.estado.toLowerCase())+': no tiene calendario de actividades.</p></div>';
  h+='<section class="panel"><h3>'+(isNew?"Nuevo paciente":"Datos del paciente · "+esc(p.codigo))+'</h3><form id="pacform" class="pacform" autocomplete="off">';
  h+='<div class="row3"><label class="f">Código *<input type="text" id="pf_codigo" value="'+esc(v.codigo)+'"></label><label class="f">Tipo doc.<select id="pf_tipodoc">'+OPT(L_TIPODOC,v.tipodoc)+'</select></label><label class="f">Documento<input type="text" id="pf_doc" inputmode="numeric" value="'+esc(v.doc)+'"></label></div>';
  h+='<label class="f">Nombre completo *<input type="text" id="pf_nombre" value="'+esc(v.nombre)+'"></label>';
  h+='<div class="row"><label class="f">Primer nombre<input type="text" id="pf_n1" value="'+esc(v.n1||"")+'"></label><label class="f">Segundo nombre<input type="text" id="pf_n2" value="'+esc(v.n2||"")+'"></label></div><div class="row"><label class="f">Primer apellido<input type="text" id="pf_ap1" value="'+esc(v.ap1||"")+'"></label><label class="f">Segundo apellido<input type="text" id="pf_ap2" value="'+esc(v.ap2||"")+'"></label></div><p class="hint">Nombres y apellidos separados: los piden los nominales de las EPS y la Res. 256.</p>';
  h+='<div class="row3"><label class="f">Fecha de nacimiento *<input type="date" id="pf_fnac" value="'+D(v.fnac)+'"></label><label class="f">Sexo *<select id="pf_sexo">'+OPT([["","—"],["F","Femenino"],["M","Masculino"]],v.sexo)+'</select></label><label class="f">EPS *<select id="pf_eps">'+OPT([["","—"]].concat(COH.EPS),v.eps)+'</select></label></div>';
  h+='<div class="sub-h">Contacto</div><div class="row3"><label class="f">Teléfono 1<input type="text" id="pf_tel" inputmode="tel" value="'+esc(v.tel)+'"></label><label class="f">Teléfono 2<input type="text" id="pf_tel2" inputmode="tel" value="'+esc(v.tel2)+'"></label><label class="f"'+(ST.db?'':' hidden')+'>Correo<input type="text" id="pf_correo" value="'+esc(v.correo)+'"></label></div>';
  h+='<div class="row"><label class="f">Dirección<input type="text" id="pf_dir" value="'+esc(v.dir)+'"></label><label class="f">Municipio<input type="text" id="pf_mun" value="'+esc(v.municipio)+'"></label></div>';
  h+='<div class="row"><label class="f">Acudiente<input type="text" id="pf_acud" value="'+esc(v.acud)+'"></label><label class="f">Teléfono acudiente<input type="text" id="pf_acudtel" inputmode="tel" value="'+esc(v.acudTel)+'"></label></div>';
  h+='<div class="sub-h">Condición clínica</div><div class="row3"><label class="chk" style="align-self:end"><input type="checkbox" id="pf_hta"'+(v.hta?" checked":"")+'> HTA</label><label class="f">Diabetes<select id="pf_dm">'+OPT(L_DM,v.dm)+'</select></label><label class="chk" style="align-self:end"><input type="checkbox" id="pf_ecv"'+(v.ecv?" checked":"")+'> Enf. cardiovascular</label></div>';
  h+='<div class="row"><label class="f">Causa de ERC<select id="pf_causa">'+OPT(L_CAUSA,v.causa)+'</select></label><label class="f">Situación renal<select id="pf_sit">'+OPT(L_SIT,v.sit)+'</select></label></div>';
  h+='<div class="sub-h">Programa</div><div class="row3"><label class="f">Fecha de ingreso<input type="date" id="pf_fing" value="'+D(v.fing)+'"></label><label class="f">Estado<select id="pf_estado">'+OPT(L_ESTADO,v.estado)+'</select></label><label class="f">Fecha del estado<input type="date" id="pf_festado" value="'+D(v.festado)+'"></label></div>';
  h+='<div class="row" id="pf_novbox" hidden><label class="f">Novedad del cambio de estado *<select id="pf_novtipo">'+OPT(CAP([["","—"]].concat(L_NOV)),"")+'</select></label><label class="f">Detalle<input type="text" id="pf_novdet"></label></div>';
  h+='<label class="f">Observaciones<input type="text" id="pf_obs" value="'+esc(v.obs)+'"></label>';
  h+='<div class="copyrow" style="margin-top:6px"><button type="submit" class="btn primary">'+(ST.db||ST.raw&&ST.book?(isNew?"Crear paciente":"Guardar cambios"):"Copiar fila para la hoja Pacientes")+'</button>'+(p?'<button type="button" class="btn" data-open="'+esc(p.codigo)+'">Valorar</button><button type="button" class="btn" data-agnew="'+esc(p.codigo)+'">Agendar cita</button>':'')+'<span class="note" id="pacmsg">'+esc(PST.msg)+'</span></div></form></section>';
  if(p){
    h+='<section class="panel"><h3>Registrar</h3><div class="regs">';
    const today=iso(new Date());
    h+='<form class="reg" data-reg="at"><div class="sub-h">Atención</div><div class="row3"><label class="f">Fecha<input type="date" name="fecha" value="'+today+'"></label><label class="f">Disciplina<select name="disciplina">'+OPT(CAP(L_DISC),"NUTRICION")+'</select></label><label class="f">Estado<select name="estado">'+OPT(CAP(["REALIZADA"]),"REALIZADA")+'</select></label></div><p class="note" style="margin:0">Para atenciones sin cita (por ejemplo, educación grupal). Citas, llegadas, inasistencias y cancelaciones se registran en Agenda.</p><button type="submit" class="btn">'+(ST.db||ST.raw?"Registrar atención":"Copiar fila · Atenciones")+'</button></form>';
    h+='<form class="reg" data-reg="lab"><div class="sub-h">Paraclínico</div><div class="row3"><label class="f">Fecha de toma<input type="date" name="fecha" value="'+today+'"></label><label class="f">Examen<select name="examen">'+OPT(L_EX,"CREATININA")+'</select></label><label class="f">Valor<input type="text" name="valor" inputmode="decimal"></label></div><button type="submit" class="btn">'+(ST.db||ST.raw?"Registrar paraclínico":"Copiar fila · Laboratorios")+'</button></form>';
    h+='<form class="reg" data-reg="nov"><div class="sub-h">Novedad</div><div class="row3"><label class="f">Fecha<input type="date" name="fecha" value="'+today+'"></label><label class="f">Tipo<select name="tipo">'+OPT(CAP(L_NOV),"HOSPITALIZACION")+'</select></label><label class="f">Detalle<input type="text" name="detalle"></label></div><button type="submit" class="btn">'+(ST.db||ST.raw?"Registrar novedad":"Copiar fila · Novedades")+'</button></form>';
    if(ST.db)h+='<form class="reg" data-reg="con"><div class="sub-h">Gestión de contacto</div><div class="row3"><label class="f">Medio<select name="medio">'+OPT(CAP(["LLAMADA","WHATSAPP","SMS","PRESENCIAL","OTRO"]),"LLAMADA")+'</select></label><label class="f">Resultado<select name="resultado">'+OPT(CAP(["CONTACTADO","NO CONTESTA","NUMERO ERRADO","REPROGRAMADO","RECHAZA"]),"CONTACTADO")+'</select></label><label class="f">Cita asignada<input type="date" name="cita"></label></div><label class="f">Motivo u observaciones<input type="text" name="obs"></label><button type="submit" class="btn">Registrar contacto</button></form>';
    h+='</div><p class="note" id="regmsg2"></p></section>';
    h+=pacHistory(p);
  }
  return h;
}
function pacHistory(p){
  const B=ST.book,c=p.codigo;const an=(t,id,lbl)=>ST.db&&id?'<button type="button" class="lnk" data-anular="'+t+'|'+id+'|'+esc(lbl)+'">Anular</button>':'';
  const labs=(B.L[c]||[]).slice().reverse(),vals=(B.V[c]||[]).slice().reverse(),ats=(B.A[c]||[]).slice().reverse(),novs=(B.N[c]||[]).slice().reverse(),cons=((B.C||{})[c]||[]).slice().reverse();
  let h='<section class="panel"><h3>Historial</h3>';
  if(PST.anular&&ST.db)h+='<div class="alert warn"><p>Anular <strong>'+esc(PST.anular.lbl)+'</strong>. El registro no se borra: queda marcado como anulado con el motivo y su usuario.</p><div class="row" style="margin-top:8px"><label class="f">Motivo *<input type="text" id="anmotivo"></label><div class="copyrow" style="align-self:end"><button type="button" class="btn primary" id="anok">Confirmar anulación</button><button type="button" class="btn" id="anno">Cancelar</button></div></div></div>';
  const T=(title,head,rows)=>'<details class="hist"'+(rows.length?'':'')+'><summary>'+title+' ('+rows.length+')</summary>'+(rows.length?'<div class="tablebox"><table><thead><tr>'+head.map(x=>'<th>'+x+'</th>').join("")+'</tr></thead><tbody>'+rows.join("")+'</tbody></table></div>':'<p class="note">Sin registros.</p>')+'</details>';
  h+=T("Paraclínicos",["Fecha","Examen","Valor",""],labs.map(l=>'<tr><td class="mono">'+fd(l.fecha)+'</td><td>'+esc(COH.EXNAME[l.k]||l.k)+'</td><td class="mono">'+esc(String(l.v).replace(".",","))+'</td><td>'+an("laboratorio",l.id,(COH.EXNAME[l.k]||l.k)+" del "+fd(l.fecha))+'</td></tr>'));
  h+=T("Valoraciones",["Fecha","Profesional","PA","Conducta",""],vals.map(v=>'<tr><td class="mono">'+fd(v.fecha)+'</td><td>'+esc((v.prof||"").toLowerCase())+'</td><td class="mono">'+(v.pas!=null?v.pas+"/"+v.pad:"—")+'</td><td>'+esc(v.conducta||"")+'</td><td>'+an("valoracion",v.id,"valoración del "+fd(v.fecha))+'</td></tr>'));
  h+=T("Atenciones",["Fecha","Disciplina","Estado",""],ats.map(a=>'<tr><td class="mono">'+fd(a.fecha)+'</td><td>'+esc(a.dis.toLowerCase())+'</td><td>'+esc(a.estado.toLowerCase())+'</td><td>'+an("atencion",a.id,a.dis.toLowerCase()+" del "+fd(a.fecha))+'</td></tr>'));
  h+=T("Novedades",["Fecha","Tipo","Detalle"],novs.map(n=>'<tr><td class="mono">'+fd(n.fecha)+'</td><td>'+esc(n.tipo.toLowerCase())+'</td><td>'+esc(n.det)+'</td></tr>'));
  const cits=((B.CI||{})[c]||[]).slice().reverse();
  h+=T("Citas",["Fecha","Servicio","Estado","Motivo",""],cits.map(x=>'<tr><td class="mono">'+fd(x.fecha)+' '+esc(x.hora)+'</td><td>'+esc(AG_SN(x.serv))+'</td><td>'+esc(AG_EST[x.estado]||x.estado)+'</td><td>'+esc(x.motivo||"")+'</td><td><button type="button" class="lnk" data-agopen="'+esc(x.id)+'">Abrir</button></td></tr>'));
  if(ST.db)h+=T("Gestión de contacto",["Fecha","Medio","Resultado","Cita","Observaciones"],cons.map(x=>'<tr><td class="mono">'+fd(x.fecha)+'</td><td>'+esc(x.medio.toLowerCase())+'</td><td>'+esc(x.resultado.toLowerCase())+'</td><td class="mono">'+(x.cita?fd(x.cita):"—")+'</td><td>'+esc(x.obs||"")+'</td></tr>'));
  return h+'</section>';
}
function bindPac(out){
  const f=$("pacform");if(!f)return;
  const B=ST.book;const p=PST.sel&&B?B.pac.find(x=>x.codigo===PST.sel):null;
  const est0=p?p.estado:"ACTIVO";
  const tog=()=>{$("pf_novbox").hidden=!p||$("pf_estado").value===est0;};$("pf_estado").addEventListener("change",tog);tog();
  f.addEventListener("submit",async e=>{e.preventDefault();const msg=$("pacmsg");
    const g=id=>$(id).value.trim();
    const P={codigo:g("pf_codigo"),tipo_documento:g("pf_tipodoc")||null,documento:g("pf_doc")||null,nombre_completo:g("pf_nombre"),fecha_nacimiento:g("pf_fnac")||null,sexo:g("pf_sexo")||null,eps:g("pf_eps")||null,
      municipio:g("pf_mun")||null,direccion:g("pf_dir")||null,telefono_1:g("pf_tel")||null,telefono_2:g("pf_tel2")||null,correo:g("pf_correo")||null,acudiente_nombre:g("pf_acud")||null,acudiente_telefono:g("pf_acudtel")||null,
      fecha_ingreso:g("pf_fing")||null,hta:$("pf_hta").checked,diabetes:g("pf_dm"),enf_cardiovascular:$("pf_ecv").checked,causa_erc:g("pf_causa")||null,situacion_renal:g("pf_sit"),estado:g("pf_estado"),fecha_estado:g("pf_festado")||null,observaciones:g("pf_obs")||null};
    const errs=[];if(!P.codigo)errs.push("código");if(!P.nombre_completo)errs.push("nombre");if(!P.fecha_nacimiento)errs.push("fecha de nacimiento");if(!P.sexo)errs.push("sexo");if(!P.eps)errs.push("EPS");
    if(errs.length){msg.textContent="Falta: "+errs.join(", ")+".";return;}
    if(P.fecha_nacimiento&&pdate(P.fecha_nacimiento)>new Date()){msg.textContent="La fecha de nacimiento es futura.";return;}
    if(!p&&B&&B.pac.some(x=>x.codigo===P.codigo)){msg.textContent="Ya existe un paciente con el código "+P.codigo+".";return;}
    if(P.documento&&B&&B.pac.some(x=>x.doc===P.documento&&x.tipodoc===(P.tipo_documento||"")&&(!p||x.codigo!==p.codigo))){msg.textContent="Ya existe un paciente con ese documento.";return;}
    if(p&&P.estado!==est0&&!g("pf_novtipo")){msg.textContent="Indique la novedad del cambio de estado.";return;}
    const warn=(!P.telefono_1&&!P.telefono_2&&!P.acudiente_telefono)?" Sin teléfono de contacto: no saldrá con contacto en la agenda.":"";
    if(!ST.db&&ST.raw&&B){const o={codigo:P.codigo,tipo_documento:P.tipo_documento||"",documento:P.documento||"",nombre_completo:P.nombre_completo,primer_nombre:g("pf_n1"),segundo_nombre:g("pf_n2"),primer_apellido:g("pf_ap1"),segundo_apellido:g("pf_ap2"),fecha_nacimiento:P.fecha_nacimiento?fd(pdate(P.fecha_nacimiento)):"",sexo:P.sexo,eps:P.eps,municipio:P.municipio||"",direccion:P.direccion||"",telefono:P.telefono_1||"",telefono_2:P.telefono_2||"",acudiente:P.acudiente_nombre||"",telefono_acudiente:P.acudiente_telefono||"",fecha_ingreso:P.fecha_ingreso?fd(pdate(P.fecha_ingreso)):"",hta:P.hta?"SI":"NO",diabetes:P.diabetes,enfermedad_cardiovascular:P.enf_cardiovascular?"SI":"NO",causa_erc:P.causa_erc||"",situacion_renal:P.situacion_renal,estado:P.estado,fecha_estado:P.fecha_estado?fd(pdate(P.fecha_estado)):"",observaciones:P.observaciones||""};
      if(p){rawUpd("Pacientes",p.codigo,o);if(P.estado!==est0)rawAdd("Novedades",{codigo:P.codigo,fecha:P.fecha_estado?fd(pdate(P.fecha_estado)):fd(new Date()),tipo:g("pf_novtipo"),detalle:g("pf_novdet")});}
      else{rawAdd("Pacientes",o);rawAdd("Novedades",{codigo:P.codigo,fecha:o.fecha_ingreso||fd(new Date()),tipo:"INGRESO",detalle:"Ingreso al programa"});}
      rawRebuild();PST.sel=P.codigo;PST.nuevo=false;PST.pre=null;PST.msg=(p?"Cambios guardados en el libro.":"Paciente creado en el libro con novedad de ingreso.")+warn+" Descargue el libro para conservarlo.";renderMg("pac");return;}
    if(!ST.db){const r=[P.codigo,P.tipo_documento,P.documento,P.nombre_completo,P.fecha_nacimiento?fd(pdate(P.fecha_nacimiento)):"",P.sexo,P.eps,P.municipio,P.direccion,P.telefono_1,P.telefono_2,P.acudiente_nombre,P.acudiente_telefono,P.fecha_ingreso?fd(pdate(P.fecha_ingreso)):"",P.hta?"SI":"NO",P.diabetes,P.enf_cardiovascular?"SI":"NO",P.causa_erc,P.situacion_renal,P.estado,P.fecha_estado?fd(pdate(P.fecha_estado)):"",P.observaciones];
      await copyText(tsv(r),msg,p?"Fila actualizada (reemplace la fila del paciente)":"Fila del paciente");msg.textContent+=warn;return;}
    try{msg.textContent="Guardando…";if(p)P.id=B.ids[p.codigo];
      const res=await apiRpc("guardar_paciente",{paciente:P,novedad_tipo:g("pf_novtipo")||null,novedad_detalle:g("pf_novdet")||null});
      await loadDb();PST.sel=P.codigo;PST.nuevo=false;PST.pre=null;PST.msg=(res.nuevo?"Paciente creado con novedad de ingreso.":"Cambios guardados.")+warn;show("pac");}
    catch(err){msg.textContent="No se guardó: "+err.message;}
  });
  out.querySelectorAll("form.reg").forEach(fr=>fr.addEventListener("submit",async e=>{e.preventDefault();const msg=$("regmsg2");const t=fr.dataset.reg;const fv=n=>(fr.elements[n]&&fr.elements[n].value||"").trim();
    const pid=B.ids?B.ids[p.codigo]:null;
    try{
      if(!ST.db&&ST.raw){const F=x=>fd(pdate(fv(x)));
        if(t==="at"){if(!fv("fecha"))throw new Error("Falta la fecha.");rawAdd("Atenciones",{codigo:p.codigo,fecha:F("fecha"),disciplina:fv("disciplina"),estado:fv("estado")});}
        if(t==="lab"){const ex=fv("examen");const txt=ex==="PARCIAL_ORINA"||ex==="QUIMICO_ORINA";const val=txt?fv("valor"):COH.toNum(fv("valor"));if(!fv("fecha")||val==null||val==="")throw new Error(txt?"Fecha y resultado son obligatorios.":"Fecha y valor numérico son obligatorios.");if(pdate(fv("fecha"))>new Date())throw new Error("La fecha de toma es futura.");
          if(ST.raw.Laboratorios.some(r=>String(r.codigo).trim()===p.codigo&&COH.norm(r.examen)===ex&&COH.toDate(r.fecha)&&NP.days(COH.toDate(r.fecha),pdate(fv("fecha")))===0))throw new Error("duplicate");rawAdd("Laboratorios",{codigo:p.codigo,fecha:F("fecha"),examen:ex,valor:txt?val:String(val).replace(".",",")});}
        if(t==="nov"){if(!fv("fecha"))throw new Error("Falta la fecha.");rawAdd("Novedades",{codigo:p.codigo,fecha:F("fecha"),tipo:fv("tipo"),detalle:fv("detalle")});}
        rawRebuild();PST.msg="Registrado en el libro. Descárguelo para conservarlo.";renderMg("pac");toast("Registrado en el libro.");return;}
      if(t==="at"){if(!fv("fecha"))throw new Error("Falta la fecha.");if(ST.db){await apiPost("atencion",[{paciente_id:pid,fecha:fv("fecha"),disciplina:fv("disciplina"),estado:fv("estado")}]);PST.msg="";await loadDb();show("pac");toast("Atención registrada.");}else await copyText(tsv([p.codigo,fd(pdate(fv("fecha"))),fv("disciplina"),fv("estado"),""]),msg,"Fila de atención");}
      if(t==="lab"){const val=COH.toNum(fv("valor"));if(!fv("fecha")||val==null)throw new Error("Fecha y valor numérico son obligatorios.");if(pdate(fv("fecha"))>new Date())throw new Error("La fecha de toma es futura.");
        if(ST.db){await apiPost("laboratorio",[{paciente_id:pid,fecha_toma:fv("fecha"),examen:fv("examen"),valor:val}]);await loadDb();show("pac");toast("Paraclínico registrado.");}else await copyText(tsv([p.codigo,fd(pdate(fv("fecha"))),fv("examen"),String(val).replace(".",","),""]),msg,"Fila de laboratorio");}
      if(t==="nov"){if(!fv("fecha"))throw new Error("Falta la fecha.");if(ST.db){await apiPost("novedad",[{paciente_id:pid,fecha:fv("fecha"),tipo:fv("tipo"),detalle:fv("detalle")||null}]);await loadDb();show("pac");toast("Novedad registrada.");}else await copyText(tsv([p.codigo,fd(pdate(fv("fecha"))),fv("tipo"),fv("detalle")]),msg,"Fila de novedad");}
      if(t==="con"){await apiPost("contacto_gestion",[{paciente_id:pid,medio:fv("medio"),resultado:fv("resultado"),cita_fecha:fv("cita")||null,observaciones:fv("obs")||null}]);await loadDb();show("pac");toast("Contacto registrado.");}
    }catch(err){msg.textContent=/duplicate|unico/i.test(err.message)?"Ya existe ese examen con esa fecha para el paciente.":"No se registró: "+err.message;}
  }));
  out.querySelectorAll("[data-agnew]").forEach(b=>b.addEventListener("click",()=>window.MG.agendar(b.dataset.agnew,"",null)));
  out.querySelectorAll("[data-agopen]").forEach(b=>b.addEventListener("click",()=>{show("agenda");openDlg({t:"cita",id:b.dataset.agopen});}));
  out.querySelectorAll("[data-anular]").forEach(b=>b.addEventListener("click",()=>{const[t,id,lbl]=b.dataset.anular.split("|");PST.anular={t,id,lbl};renderMg("pac");const m=$("anmotivo");if(m)m.focus();}));
  if($("anno"))$("anno").addEventListener("click",()=>{PST.anular=null;renderMg("pac");});
  if($("anok"))$("anok").addEventListener("click",async()=>{const m=$("anmotivo").value.trim();if(!m){$("anmotivo").focus();return;}
    try{await apiPatch(PST.anular.t+"?id=eq."+PST.anular.id,{anulado:true,motivo_anulacion:m});PST.anular=null;await loadDb();show("pac");toast("Registro anulado con motivo.");}catch(err){toast("No se anuló: "+err.message);}});
}


/* ---------- AGENDA: jornadas, cupos espejo, citas, asistencia e inasistencias ---------- */
const AG_SERV=[["NEFROLOGIA","Nefrología"],["MEDICO EXPERTO","Médico experto"],["MEDICO PROGRAMA","Médico del programa"],["NUTRICION","Nutrición"],["ENFERMERIA","Enfermería"],["PSICOLOGIA","Psicología"],["TRABAJO SOCIAL","Trabajo social"],["EDUCACION","Educación"],["QUIMICA FARMACEUTICA","Química farmacéutica"],["SOPORTE PALIATIVO","Soporte paliativo"],["TOMA DE MUESTRAS","Toma de muestras"],["VACUNACION","Vacunación"]];
const AG_SN=k=>(AG_SERV.find(x=>x[0]===k)||[k,k||"—"])[1];
const AG_TIPOS={NEFROLOGIA:["CONTROL","PRIMERA VEZ","AJUSTE DE METAS","PRIORITARIA"],"MEDICO EXPERTO":["CONTROL Y FORMULACION","AJUSTE DE METAS","CONTROL POST-AJUSTE","PRIMERA VEZ"],"MEDICO PROGRAMA":["CONTROL","AJUSTE DE METAS","CONTROL POST-AJUSTE","PRIMERA VEZ"],"TOMA DE MUESTRAS":["PARACLINICOS DEL PLAN","CONTROL POST-AJUSTE","CONFIRMACION DE ERC"],VACUNACION:["INFLUENZA","HEPATITIS B","OTRA"],_:["CONTROL","PRIMERA VEZ"]};
const AG_ORIG=[["PLAN","Plan del programa"],["SOLICITUD PACIENTE","Solicitud del paciente"],["REPROGRAMACION","Reprogramación"],["PRIORITARIA","Prioritaria por alerta clínica"],["REMISION","Remisión"],["REGISTRO POSTERIOR","Registro posterior (fecha pasada, contingencia)"]];
const AG_EST={ASIGNADA:"Asignada","EN SALA":"Llegó · en sala",ATENDIDA:"Atendida","NO ATENDIDA":"Llegó, no atendida",INASISTENCIA:"No asistió",CANCELADA:"Cancelada"};
const AG_CLS={ASIGNADA:"asig","EN SALA":"sala",ATENDIDA:"ok","NO ATENDIDA":"warn",INASISTENCIA:"bad",CANCELADA:"canc"};
const AG_RESP={PACIENTE:"Paciente",ACCESO:"Barrera de acceso",EPS:"EPS",IPS:"IPS",OTRO:"Otro o fuerza mayor"};
const AG_MOT=[
 ["P_OLVIDO","PACIENTE","Olvidó la cita"],["P_BIEN","PACIENTE","Se sentía bien, no lo consideró necesario"],["P_ENFERMO","PACIENTE","Enfermo el día de la cita"],["P_HOSP","PACIENTE","Hospitalizado"],["P_TRABAJO","PACIENTE","Compromiso laboral o familiar"],["P_ACOMP","PACIENTE","Sin acompañante"],["P_NOQUIERE","PACIENTE","No desea continuar en el programa"],
 ["A_COSTO","ACCESO","Sin dinero para el transporte"],["A_RURAL","ACCESO","Distancia o zona rural dispersa"],["A_VIA","ACCESO","Vía cerrada, clima u orden público"],
 ["E_AUT","EPS","Autorización no emitida o vencida"],["E_AFIL","EPS","Cambio o retiro de EPS, afiliación inactiva"],["E_CONTRATO","EPS","Servicio no contratado o sin red"],
 ["I_PROF","IPS","Profesional no disponible"],["I_ERROR","IPS","Error de agendamiento (fecha, hora o doble cita)"],["I_NOTIF","IPS","No se le informó la cita"],["I_LAB","IPS","Paraclínicos previos no tomados o sin resultado"],["I_DEMORA","IPS","Demora en la atención: se retiró"],
 ["O_FALLECE","OTRO","Falleció"],["O_TRASLADO","OTRO","Cambio de domicilio o traslado"],["O_SINCONT","OTRO","No se logró contactar: motivo desconocido"],["O_OTRO","OTRO","Otro (detallar en observaciones)"]];
const AG_MOTL=k=>{const m=AG_MOT.find(x=>x[0]===k);return m?m[2]:"";};
const AG_MOTR=k=>{const m=AG_MOT.find(x=>x[0]===k);return m?m[1]:"";};
const AG_REC=[["CONFIRMA","Confirma asistencia"],["NO CONTESTA","No contesta"],["NUMERO ERRADO","Número errado"],["MENSAJE ENVIADO","Mensaje enviado, sin respuesta"],["CANCELA","Cancela"]];
const AG_DIAS=["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const AST={sub:"dia",date:"",user:"",dlg:null,desde:"",hasta:"",serv:"",eps:"",pserv:"NEFROLOGIA",phor:""};
try{AST.user=localStorage.getItem("nefro_usuario")||"";}catch(e){}
const TODAY=()=>{const d=new Date();return new Date(d.getFullYear(),d.getMonth(),d.getDate());};
AST.date=iso(TODAY());
{const t=TODAY();AST.desde=iso(new Date(t.getFullYear(),t.getMonth()-2,1));AST.hasta=iso(t);AST.phor=iso(NP.addMonths(t,1));}
const hm2m=s=>{const m=/^(\d{1,2}):(\d{2})/.exec(s||"");return m?(+m[1])*60+(+m[2]):null;};
const m2hm=m=>String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0");
const nowHM=()=>{const d=new Date();return m2hm(d.getHours()*60+d.getMinutes());};
const fdt=d=>d?fd(d)+" "+m2hm(d.getHours()*60+d.getMinutes()):"";
function agSlots(j){const a=hm2m(j.hIni),b=hm2m(j.hFin),out=[];if(a==null||b==null||!(j.dur>0))return out;for(let t=a;t+j.dur<=b;t+=j.dur)out.push(m2hm(t));return out;}
const agLetters=j=>j.nAg===2?["A","B"]:["A"];
const citaDT=c=>{const m=hm2m(c.hora)||0;return new Date(c.fecha.getFullYear(),c.fecha.getMonth(),c.fecha.getDate(),Math.floor(m/60),m%60);};
const pOf=code=>ST.pmap&&ST.pmap[code];
const sOf=code=>ST.smap&&ST.smap[code];
const motOpts=(sel,only)=>Object.keys(AG_RESP).filter(r=>!only||only.includes(r)).map(r=>'<optgroup label="'+esc(AG_RESP[r])+'">'+AG_MOT.filter(m=>m[1]===r).map(m=>'<option value="'+m[0]+'"'+(sel===m[0]?" selected":"")+'>'+esc(m[2])+'</option>').join("")+'</optgroup>').join("");
const motKey=label=>{const m=AG_MOT.find(x=>COH.norm(x[2])===COH.norm(label));return m?m[0]:"";};
/* prioridad clínica para ordenar candidatos y reprogramaciones */
function agPrio(s){if(!s)return 0;let p=(s.c.grupo||0)*10;if((s.P.actions||[]).some(a=>a.lvl==="bad"))p+=100;if(s.c.kfre&&s.c.kfre.r2>0.4)p+=50;return p;}
/* qué servicio atiende cada ítem de la agenda de gestión */
function itemServ(s,it){
  if(it.tipo==="Laboratorio")return"TOMA DE MUESTRAS";
  const k=it.k,n=it.nombre||"";
  if(k==="ctl")return /nefrolog/i.test(n)?"NEFROLOGIA":"MEDICO PROGRAMA";
  if(k==="experto")return"MEDICO EXPERTO";
  if(k==="ajuste")return /nefrolog/i.test(n)?"NEFROLOGIA":/experto/i.test(n)?"MEDICO EXPERTO":"MEDICO PROGRAMA";
  return({nut:"NUTRICION",desnut:"NUTRICION",enf:"ENFERMERIA",psi:"PSICOLOGIA",ts:"TRABAJO SOCIAL",edu:"EDUCACION",nefro:"NEFROLOGIA",flu:"VACUNACION",paliativo:"SOPORTE PALIATIVO"})[k]||null;
}
const activeFut=(code,serv)=>((ST.book.CI||{})[code]||[]).filter(c=>(c.estado==="ASIGNADA"||c.estado==="EN SALA")&&c.fecha>=TODAY()&&(!serv||c.serv===serv)).sort((a,b)=>citaDT(a)-citaDT(b));
const inasCount=(code,before,dd)=>((ST.book.CI||{})[code]||[]).filter(c=>c.estado==="INASISTENCIA"&&c.fecha<before&&NP.days(c.fecha,before)<=(dd||365)).length;
/* candidatos: pacientes con ítems de ese servicio vencidos, sin registro o que vencen antes del horizonte, sin cita futura en ese servicio */
function agCands(serv,hasta,excludeJor){
  const out=[];const T=TODAY();
  ST.snaps.forEach(s=>{
    const its=s.items.filter(it=>itemServ(s,it)===serv&&(!it.due||it.due<=hasta));
    if(!its.length)return;
    if(activeFut(s.p.codigo,serv).length)return;
    if(excludeJor&&ST.book.cit.some(c=>c.jor===excludeJor&&c.c===s.p.codigo&&c.estado!=="CANCELADA"))return;
    const dues=its.map(i=>i.due).filter(Boolean).sort((a,b)=>a-b);const due=dues[0]||null;
    const st=!due?"sinreg":due<T?"venc":"prox";
    out.push({s,its,due,st,prio:agPrio(s)+(st==="sinreg"?30:st==="venc"?20+Math.min(60,NP.days(due,T)/10):0)});});
  return out.sort((a,b)=>b.prio-a.prio||((a.due||0)-(b.due||0)));
}
function agNextId(){let mx=0;ST.book.cit.forEach(c=>{const m=/(\d+)$/.exec(c.id);if(m)mx=Math.max(mx,+m[1]);});return"C-"+String(mx+1).padStart(6,"0");}
function agLog(c,acc,de,a,mot){ST.book.clog.push({fh:new Date(),id:c.id,c:c.c,acc,de:de||"",a:a||"",motivo:mot||"",usuario:AST.user});c.usuario=AST.user;c.act=fdt(new Date());}
function agChanged(){ST.dirty=true;COH.reindexCitas(ST.book);compute();bookInfo();}
function needUser(){if(AST.user.trim())return false;toast("Escriba su nombre en «Usuario que registra» antes de modificar la agenda.");const u=$("aguser");if(u)u.focus();return true;}
function agCreate(o){const c=Object.assign({id:agNextId(),estado:"ASIGNADA",conf:"",hLleg:"",hAten:"",resp:"",motivo:"",avisoH:null,deId:"",reId:"",obs:"",fAsig:TODAY()},o);ST.book.cit.push(c);agLog(c,"ASIGNA","","ASIGNADA",c.origen==="REPROGRAMACION"?"Reprograma "+c.deId:"");return c;}
function agSet(c,estado,mot,extra){const de=c.estado;Object.assign(c,extra||{});c.estado=estado;agLog(c,"CAMBIO DE ESTADO",de,estado,mot);}

/* ---------- vista principal ---------- */
function rAgenda(out){
  const B=ST.book;
  let h=head("Agenda del programa","Jornadas por fecha, cupos con agenda espejo, llegada o inasistencia de cada cita y caracterización de inasistencias y cancelaciones."+(ST.db?" <strong>Modo base de datos: la agenda aún no se guarda en la base; descargue las hojas de agenda al terminar.</strong>":""),'<button type="button" class="btn primary" data-ag="exp">'+(ST.db?"Descargar hojas de agenda":"Descargar libro actualizado")+'</button>');
  h+='<div class="agtop"><label class="f">Usuario que registra *<input type="text" id="aguser" value="'+esc(AST.user)+'" placeholder="Nombre de quien maneja la agenda"></label>'+(ST.dirty?'<span class="pendch">Cambios sin descargar</span>':'')+'</div>';
  h+='<div class="seg epsseg agsub" role="group" aria-label="Secciones de la agenda">'+[["dia","Día"],["pend","Por agendar y reprogramar"],["jor","Jornadas"],["est","Asistencia y reportes"]].map(([k,l])=>'<button type="button" data-ag="sub|'+k+'" aria-pressed="'+(AST.sub===k)+'">'+l+'</button>').join("")+'</div>';
  if(ST.corte&&iso(ST.corte)!==iso(TODAY()))h+='<div class="alert warn"><p>La fecha de corte de la cohorte es '+fd(ST.corte)+', no hoy: los pendientes y vencidos de la agenda se calculan a esa fecha. <button type="button" class="lnk" data-ag="cortehoy">Usar hoy</button></p></div>';
  h+=({dia:vDia,pend:vPend,jor:vJor,est:vEst})[AST.sub]();
  out.innerHTML=h;
  out.onclick=agClick;
  out.onchange=e=>{const t=e.target;if(t.dataset&&t.dataset.cfg){const[k,x]=t.dataset.cfg.split("|");if(k==="eap")AST.cfg.eaps[x]=t.value.trim();else if(k==="t256")AST.cfg.t256[x]=t.value;else AST.cfg[k]=t.value.trim();saveCfg();toast("Código guardado en este navegador.");return;}
    if(!t.dataset||!t.dataset.agf)return;AST[t.dataset.agf]=t.value;if(t.dataset.agf!=="user"&&!/^r(mes|base|eps|sem)$/.test(t.dataset.agf))renderMg("agenda");};
  const u=$("aguser");if(u)u.addEventListener("input",()=>{AST.user=u.value;try{localStorage.setItem("nefro_usuario",u.value);}catch(e){}});
  EXPORTS.agest=agExportStats;EXPORTS.agpend=agExportPend;EXPORTS.rep1552=rep1552;EXPORTS.rep256=rep256;EXPORTS.repeps=repEPS;
}
function agClick(e){
  const b=e.target.closest("[data-ag]");if(!b)return;const p=b.dataset.ag.split("|");const B=ST.book;
  if(p[0]==="sub"){AST.sub=p[1];renderMg("agenda");return;}
  if(p[0]==="day"){const d=pdate(AST.date)||TODAY();AST.date=iso(NP.addDays(d,+p[1]));renderMg("agenda");return;}
  if(p[0]==="goto"){AST.date=p[1];AST.sub="dia";renderMg("agenda");return;}
  if(p[0]==="exp"){agExportBook();return;}
  if(p[0]==="cortehoy"){$("corte").value=iso(TODAY());ST.trend=null;compute();renderMg("agenda");return;}
  if(p[0]==="xjor"){agExportJor(p[1]);return;}
  if(p[0]==="newjor"){if(needUser())return;openDlg({t:"newjor",fecha:AST.date,serv:"NEFROLOGIA"});return;}
  if(p[0]==="canjor"){if(needUser())return;openDlg({t:"canjor",id:p[1]});return;}
  if(p[0]==="asig"){if(needUser())return;const j=B.jor.find(x=>x.id===p[1]);openDlg({t:"asig",serv:j.serv,jor:p[1],hora:p[2],ag:p[3],pat:null,q:""});return;}
  if(p[0]==="agendar"){if(needUser())return;openDlg({t:"asig",serv:p[2],pat:p[1],fDes:p[3]?pdate(p[3]):null,q:""});return;}
  if(p[0]==="cita"){openDlg({t:"cita",id:p[1],form:p[2]||null});return;}
}

/* ---------- Día ---------- */
function vDia(){
  const B=ST.book,d=pdate(AST.date)||TODAY();
  const J=B.jor.filter(j=>NP.days(j.fecha,d)===0).sort((a,b)=>hm2m(a.hIni)-hm2m(b.hIni)||a.serv.localeCompare(b.serv));
  let h='<div class="agbar"><button type="button" class="btn" data-ag="day|-1" aria-label="Día anterior">‹</button><label class="f">Fecha<input type="date" data-agf="date" value="'+esc(AST.date)+'"></label><button type="button" class="btn" data-ag="day|1" aria-label="Día siguiente">›</button><span class="note">'+AG_DIAS[d.getDay()]+'</span><button type="button" class="btn primary" data-ag="newjor">Abrir jornada</button></div>';
  const sinCierre=B.cit.filter(c=>(c.estado==="ASIGNADA"||c.estado==="EN SALA")&&c.fecha<TODAY()).length;
  if(sinCierre)h+='<div class="alert warn"><p>'+sinCierre+' cita(s) de días anteriores siguen «asignadas»: falta marcar si el paciente llegó o no. Sin ese cierre la tasa de inasistencia queda subestimada. <button type="button" class="lnk" data-ag="sub|pend">Ver cuáles</button></p></div>';
  if(!J.length){
    const nx=B.jor.filter(j=>j.fecha>=TODAY()&&j.estado!=="CANCELADA").sort((a,b)=>a.fecha-b.fecha).slice(0,8);
    h+='<div class="panel empty"><p style="margin:0 0 6px;color:var(--ink)"><strong>No hay jornadas este día.</strong></p><p style="margin:0">Use «Abrir jornada» para crearla con su horario y duración de cupo.</p>'+(nx.length?'<p style="margin:10px 0 0">Próximas: '+nx.map(j=>'<button type="button" class="lnk" data-ag="goto|'+iso(j.fecha)+'">'+fd(j.fecha)+' '+esc(AG_SN(j.serv))+'</button>').join(" · ")+'</p>':'')+'</div>';
    return h;}
  J.forEach(j=>{h+=jorCard(j);});
  return h;
}
function jorStats(j){const S=agSlots(j),L=agLetters(j),C=ST.book.cit.filter(c=>c.jor===j.id);const act=C.filter(c=>c.estado!=="CANCELADA");const cnt=k=>C.filter(c=>c.estado===k).length;
  return{S,L,C,cupos:S.length*L.length,asig:act.length,libres:Math.max(0,S.length*L.length-act.length),aten:cnt("ATENDIDA"),sala:cnt("EN SALA"),inas:cnt("INASISTENCIA"),noat:cnt("NO ATENDIDA"),canc:cnt("CANCELADA"),pend:cnt("ASIGNADA")};}
function jorCard(j){
  const st=jorStats(j),canc=j.estado==="CANCELADA";
  let h='<section class="panel agjor'+(canc?' jcanc':'')+'"><div class="mhead"><div><h3 class="agjt">'+esc(AG_SN(j.serv))+(j.prof?' · '+esc(j.prof):'')+'</h3><p class="note" style="margin:0">'+fd(j.fecha)+' · '+j.hIni+'–'+j.hFin+' · cupo de '+j.dur+' min'+(st.L.length===2?' · agenda espejo A y B a la misma hora ('+Math.round(120/j.dur)+' pacientes por hora)':'')+' · '+esc(j.id)+(canc?' · <strong style="color:var(--bad)">JORNADA CANCELADA: '+esc(j.motivo)+'</strong>':'')+'</p></div><div class="copyrow"><button type="button" class="btn" data-ag="xjor|'+esc(j.id)+'">Lista para llamar</button>'+(!canc&&j.fecha>=TODAY()?'<button type="button" class="btn" data-ag="canjor|'+esc(j.id)+'">Cancelar jornada</button>':'')+'</div></div>';
  h+='<div class="tiles agtiles">'+tile("Cupos",st.cupos,"")+tile("Asignados",st.asig+" ("+(st.cupos?Math.round(st.asig/st.cupos*100):0)+" %)","")+tile("Libres",st.libres,"")+tile("Atendidos",st.aten,"")+tile("En sala",st.sala,"")+tile("No asistieron",st.inas,st.inas?"bad":"")+tile("Canceladas",st.canc,st.canc?"warn":"")+tile("Sin marcar",st.pend,"")+'</div>';
  h+='<div class="tablebox"><table class="agt"><thead><tr><th>Hora</th>'+st.L.map(a=>'<th>Agenda '+a+'</th>').join("")+'</tr></thead><tbody>';
  st.S.forEach(t=>{h+='<tr><td class="mono">'+t+'</td>'+st.L.map(a=>'<td>'+slotCell(j,t,a,st.C)+'</td>').join("")+'</tr>';});
  return h+'</tbody></table></div></section>';
}
function slotCell(j,t,a,C){
  const here=C.filter(c=>c.hora===t&&c.ag===a);const act=here.filter(c=>c.estado!=="CANCELADA"),cn=here.filter(c=>c.estado==="CANCELADA");
  let h="";
  act.forEach(c=>{const p=pOf(c.c)||{},s=sOf(c.c);const prev=inasCount(c.c,c.fecha,365);
    h+='<button type="button" class="slot st-'+AG_CLS[c.estado]+'" data-ag="cita|'+esc(c.id)+'"><span class="sl1"><strong>'+esc(c.c)+'</strong> '+esc((p.nombre||"").split(" ").slice(0,3).join(" "))+'</span><span class="sl2">'+esc(epsShort(p.eps))+(s&&s.c.grupo?' · G'+s.c.grupo:'')+' · '+esc((c.tipo||"").toLowerCase())+'</span><span class="sl3"><span class="est">'+esc(AG_EST[c.estado])+'</span>'+((window.NEFRO_PRECON&&window.NEFRO_PRECON[c.c]&&window.NEFRO_PRECON[c.c].listo)?'<span class="fl ok" style="background:var(--ok-soft);font-weight:700">✓ LISTO PARA ATENCIÓN</span>':(c.conf==="CONFIRMADA"?'<span class="fl ok">confirmada · hacer preconsulta</span>':c.conf?'<span class="fl">'+esc(c.conf.toLowerCase())+'</span>':''))+(prev?'<span class="fl bad">'+prev+' inasist. previa'+(prev>1?'s':'')+'</span>':'')+(p.estado&&p.estado!=="ACTIVO"?'<span class="fl bad">paciente '+esc(p.estado.toLowerCase())+'</span>':'')+'</span></button>';});
  if(!act.length)h+=j.estado==="ABIERTA"?'<button type="button" class="slot free" data-ag="asig|'+esc(j.id)+'|'+t+'|'+a+'">+ Asignar</button>':'<span class="note">—</span>';
  if(cn.length)h+='<span class="sub agcn">'+cn.map(c=>'<button type="button" class="lnk" data-ag="cita|'+esc(c.id)+'">cancelada '+esc(c.c)+'</button>').join(" ")+'</span>';
  return h;
}

/* ---------- Por agendar y reprogramar ---------- */
function vPend(){
  const B=ST.book,T=TODAY();const hor=pdate(AST.phor)||NP.addMonths(T,1);
  let h='';
  const rep=B.cit.filter(c=>["INASISTENCIA","CANCELADA","NO ATENDIDA"].includes(c.estado)&&!c.reId&&NP.days(c.fecha,T)<=120&&!(c.estado==="CANCELADA"&&c.resp==="OTRO"&&/Falleció|traslado/i.test(c.motivo))&&(pOf(c.c)||{}).estado==="ACTIVO"&&!activeFut(c.c,c.serv).length).sort((a,b)=>agPrio(sOf(b.c))-agPrio(sOf(a.c))||a.fecha-b.fecha);
  const sc=B.cit.filter(c=>(c.estado==="ASIGNADA"||c.estado==="EN SALA")&&c.fecha<T).sort((a,b)=>a.fecha-b.fecha);
  if(sc.length)h+='<section class="panel"><h3>Sin cierre · '+sc.length+'</h3><p class="note" style="margin:0 0 8px">Citas de fechas pasadas sin marcar llegada ni inasistencia.</p>'+citaTable(sc,false)+'</section>';
  h+='<section class="panel"><h3>Por reprogramar · '+rep.length+'</h3><p class="note" style="margin:0 0 8px">Inasistencias, cancelaciones y pacientes que llegaron y no fueron atendidos en los últimos 120 días, sin nueva cita. Ordenados por riesgo clínico (grupo 3 y alertas primero).</p>'+(rep.length?citaTable(rep,true):'<p class="note">Ninguna.</p>')+'</section>';
  const cands=agCands(AST.pserv,hor);
  h+='<section class="panel"><div class="mhead"><h3 style="margin:0">Pacientes por agendar · '+esc(AG_SN(AST.pserv))+' · '+cands.length+'</h3><button type="button" class="btn" data-x="agpend">Exportar</button></div><div class="filters" style="margin:10px 0"><label class="f">Servicio<select data-agf="pserv">'+AG_SERV.map(([k,l])=>'<option value="'+k+'"'+(AST.pserv===k?" selected":"")+'>'+l+'</option>').join("")+'</select></label><label class="f">Con fecha límite hasta<input type="date" data-agf="phor" value="'+esc(AST.phor)+'"></label></div><p class="note" style="margin:0 0 8px">Sale de la agenda de gestión de cada paciente (plan del programa). Excluye a quien ya tiene cita futura en este servicio. «Inasistencia previa» es el principal predictor de una nueva inasistencia: confírmele la cita con más insistencia.</p>';
  h+=cands.length?'<div class="tablebox"><table><thead><tr><th>Paciente</th><th>EPS</th><th>Contacto</th><th>Grupo</th><th>Pendiente</th><th>Alertas</th><th></th></tr></thead><tbody>'+cands.slice(0,400).map(x=>{const s=x.s,prev=inasCount(s.p.codigo,T,365);const bad=(s.P.actions||[]).filter(a=>a.lvl==="bad").length;
    return'<tr><td>'+pname(s)+'</td><td>'+esc(epsShort(s.p.eps))+'</td><td>'+contact(s)+'</td><td>'+grpTag(s)+'</td><td><div class="chs">'+x.its.map(i=>'<span class="ch '+(i.due?(i.due<T?"venc":"mes"):"sinreg")+'" title="'+esc(i.why||"")+'">'+esc(i.nombre)+' · '+(i.due?(i.due<T?"vencido ":"")+fd(i.due):"sin registro")+'</span>').join("")+'</div></td><td>'+(bad?'<span class="fl bad">'+bad+' prioritaria'+(bad>1?'s':'')+'</span>':'')+(prev?'<span class="fl bad">'+prev+' inasist. en 12 m</span>':'')+'</td><td><button type="button" class="btn" data-ag="agendar|'+esc(s.p.codigo)+'|'+esc(AST.pserv)+'|'+(x.due?iso(x.due):"")+'">Agendar</button></td></tr>';}).join("")+'</tbody></table></div>':'<p class="note">Nadie pendiente para este servicio en el horizonte elegido.</p>';
  h+='</section>';
  EXPORTS.agpend=null;
  ST._cands=cands;
  return h;
}
function citaTable(L,repro){
  return'<div class="tablebox"><table><thead><tr><th>Paciente</th><th>EPS</th><th>Contacto</th><th>Grupo</th><th>Cita</th><th>Estado</th><th>Motivo</th><th></th></tr></thead><tbody>'+L.map(c=>{const s=sOf(c.c),p=pOf(c.c)||{codigo:c.c};const fake={p,c:s?s.c:{},P:s?s.P:{}};
    return'<tr><td>'+pname(fake)+'</td><td>'+esc(epsShort(p.eps))+'</td><td>'+contact(fake)+'</td><td>'+(s?grpTag(s):'—')+'</td><td class="mono">'+fd(c.fecha)+' '+esc(c.hora)+'<span class="sub">'+esc(AG_SN(c.serv))+'</span></td><td><span class="est st-'+AG_CLS[c.estado]+'">'+esc(AG_EST[c.estado])+'</span></td><td>'+esc(c.motivo||"—")+(c.resp?'<span class="sub">'+esc(AG_RESP[c.resp]||c.resp)+'</span>':'')+'</td><td><button type="button" class="btn" data-ag="cita|'+esc(c.id)+(repro?'|repro':'')+'">'+(repro?"Reprogramar":"Abrir")+'</button></td></tr>';}).join("")+'</tbody></table></div>';
}

/* ---------- Jornadas ---------- */
function vJor(){
  const B=ST.book;const L=B.jor.slice().sort((a,b)=>b.fecha-a.fecha||hm2m(a.hIni)-hm2m(b.hIni));
  let h='<div class="agbar"><button type="button" class="btn primary" data-ag="newjor">Abrir jornada</button></div>';
  h+='<section class="panel"><h3>Jornadas registradas · '+L.length+'</h3>'+(L.length?'<div class="tablebox"><table><thead><tr><th>Fecha</th><th>Servicio</th><th>Profesional</th><th>Horario</th><th>Cupos</th><th>Asignados</th><th>Atendidos</th><th>No asistieron</th><th>Canceladas</th><th>Estado</th><th></th></tr></thead><tbody>'+L.map(j=>{const s=jorStats(j);return'<tr><td class="mono">'+fd(j.fecha)+'<span class="sub">'+AG_DIAS[j.fecha.getDay()]+'</span></td><td>'+esc(AG_SN(j.serv))+'</td><td>'+esc(j.prof||"—")+'</td><td class="mono">'+j.hIni+'–'+j.hFin+'<span class="sub">'+j.dur+' min'+(j.nAg===2?' · A/B':'')+'</span></td><td class="mono">'+s.cupos+'</td><td class="mono">'+s.asig+'</td><td class="mono">'+s.aten+'</td><td class="mono">'+s.inas+'</td><td class="mono">'+s.canc+'</td><td>'+esc(j.estado.toLowerCase())+(j.motivo?'<span class="sub">'+esc(j.motivo)+'</span>':'')+'</td><td><button type="button" class="lnk" data-ag="goto|'+iso(j.fecha)+'">Ver día</button></td></tr>';}).join("")+'</tbody></table></div>':'<p class="note">Aún no hay jornadas. Ábralas por fecha con su horario.</p>')+'</section>';
  return h;
}

/* ---------- Diálogo ---------- */
function openDlg(o){AST.dlg=o;drawDlg();}
function closeDlg(){AST.dlg=null;const d=$("agdlg");d.hidden=true;d.innerHTML="";}
function drawDlg(){
  const D=AST.dlg,box=$("agdlg");if(!D){closeDlg();return;}
  let h='<div class="agmodal" role="dialog" aria-modal="true" aria-labelledby="agdlgt"><div class="mhead"><h3 id="agdlgt" style="margin:0">'+dlgTitle(D)+'</h3><button type="button" class="btn" data-dl="close">Cerrar</button></div>';
  h+=({newjor:dNewJor,canjor:dCanJor,asig:dAsig,cita:dCita})[D.t](D);
  h+=(D.msg?'<p class="agmsg">'+esc(D.msg)+'</p>':'')+'</div>';
  box.innerHTML=h;box.hidden=false;
  box.onclick=dlgClick;
  const q=box.querySelector("[data-dq]");if(q){q.addEventListener("input",()=>{D.q=q.value;const c=$("agcands");if(c)c.innerHTML=candList(D);});if(!D.pat)q.focus();}
}
function dlgTitle(D){if(D.t==="newjor")return"Abrir jornada";if(D.t==="canjor")return"Cancelar jornada";if(D.t==="asig")return"Asignar cita"+(D.serv?" · "+esc(AG_SN(D.serv)):"");const c=ST.book.cit.find(x=>x.id===D.id);return"Cita "+esc(D.id)+(c?" · "+esc(AG_SN(c.serv)):"");}
const fv=id=>{const e=$(id);return e?String(e.value).trim():"";};
function dNewJor(D){
  return'<div class="pacform"><div class="row3"><label class="f">Fecha *<input type="date" id="nj_fecha" value="'+esc(D.fecha)+'"></label><label class="f">Servicio *<select id="nj_serv">'+AG_SERV.map(([k,l])=>'<option value="'+k+'"'+(D.serv===k?" selected":"")+'>'+l+'</option>').join("")+'</select></label><label class="f">Profesional<input type="text" id="nj_prof" placeholder="Nombre del profesional"></label></div>'+
    '<div class="row3"><label class="f">Hora de inicio *<input type="time" id="nj_ini" value="07:00" step="300"></label><label class="f">Hora de fin *<input type="time" id="nj_fin" value="12:00" step="300"></label><label class="f">Duración del cupo (min) *<input type="text" id="nj_dur" inputmode="numeric" value="20"></label></div>'+
    '<label class="f">Agendas simultáneas<select id="nj_nag"><option value="2"'+(D.serv==="NEFROLOGIA"?" selected":"")+'>Dos: agenda espejo A y B a la misma hora</option><option value="1"'+(D.serv!=="NEFROLOGIA"?" selected":"")+'>Una agenda</option></select></label>'+
    '<label class="f">Observaciones<input type="text" id="nj_obs"></label><p class="note" id="nj_prev"></p><div class="copyrow"><button type="button" class="btn primary" data-dl="nj_ok">Abrir jornada</button></div></div>';
}
function dCanJor(D){const j=ST.book.jor.find(x=>x.id===D.id);const st=jorStats(j);
  return'<p>'+esc(AG_SN(j.serv))+' del '+fd(j.fecha)+' ('+j.hIni+'–'+j.hFin+'). Tiene <strong>'+st.pend+'</strong> cita(s) asignada(s): quedarán canceladas por la IPS con el motivo elegido y pasarán a «Por reprogramar». La jornada no se borra.</p><div class="row"><label class="f">Motivo *<select id="cj_mot"><option value="">—</option>'+motOpts("",["IPS","OTRO"])+'</select></label><label class="f">Detalle<input type="text" id="cj_det"></label></div><div class="copyrow" style="margin-top:8px"><button type="button" class="btn primary" data-dl="cj_ok">Cancelar jornada</button></div>';}
function candList(D){
  const T=TODAY(),q=COH.norm(D.q||"");let L;
  if(q){L=ST.snaps.filter(s=>COH.norm(s.p.codigo+" "+s.p.nombre+" "+s.p.doc).includes(q)).slice(0,30).map(s=>({s,its:s.items.filter(it=>itemServ(s,it)===D.serv),due:null}));}
  else{const j=D.jor?ST.book.jor.find(x=>x.id===D.jor):null;L=agCands(D.serv,NP.addMonths(j?j.fecha:T,1),D.jor).slice(0,40);}
  if(!L.length)return'<p class="note">'+(q?"Sin coincidencias entre pacientes activos.":"Nadie pendiente para este servicio. Busque por código, nombre o documento.")+'</p>';
  return'<div class="tablebox"><table><thead><tr><th>Paciente</th><th>EPS</th><th>Grupo</th><th>Pendiente de '+esc(AG_SN(D.serv))+'</th><th></th></tr></thead><tbody>'+L.map(x=>{const s=x.s,prev=inasCount(s.p.codigo,T,365),fut=activeFut(s.p.codigo,D.serv);
    return'<tr><td>'+pname(s)+(prev?'<span class="fl bad">'+prev+' inasist. en 12 m</span>':'')+'</td><td>'+esc(epsShort(s.p.eps))+'</td><td>'+grpTag(s)+'</td><td>'+(x.its.length?x.its.map(i=>esc(i.nombre)+' · '+(i.due?(i.due<T?"vencido ":"")+fd(i.due):"sin registro")).join("<br>"):'<span class="note">sin pendiente en el plan</span>')+(fut.length?'<span class="sub" style="color:var(--warn)">Ya tiene cita '+fd(fut[0].fecha)+' '+esc(fut[0].hora)+'</span>':'')+'</td><td><button type="button" class="btn" data-dl="pick|'+esc(s.p.codigo)+'">Elegir</button></td></tr>';}).join("")+'</tbody></table></div>';
}
function slotPicker(serv,fDes,code){
  const T=TODAY();const J=ST.book.jor.filter(j=>j.serv===serv&&j.estado==="ABIERTA"&&j.fecha>=T).sort((a,b)=>a.fecha-b.fecha||hm2m(a.hIni)-hm2m(b.hIni));
  if(!J.length)return'<div class="alert warn"><p>No hay jornadas abiertas de '+esc(AG_SN(serv))+' desde hoy. Ábrala primero en Agenda › Abrir jornada.</p></div>';
  const now=new Date();let target=fDes?J.find(j=>j.fecha>=fDes):null;if(!target)target=J[0];
  return'<p class="note" style="margin:0 0 6px">Cupos libres'+(fDes?'. Fecha deseada o límite del plan: <strong>'+fd(fDes)+'</strong>':'')+'.</p><div class="slotpick">'+J.slice(0,12).map(j=>{const st=jorStats(j);const occ=new Set(st.C.filter(c=>c.estado!=="CANCELADA").map(c=>c.hora+"|"+c.ag));const mine=st.C.some(c=>c.c===code&&c.estado!=="CANCELADA");
    const free=[];st.S.forEach(t=>st.L.forEach(a=>{if(!occ.has(t+"|"+a)){const dt=new Date(j.fecha.getFullYear(),j.fecha.getMonth(),j.fecha.getDate(),Math.floor(hm2m(t)/60),hm2m(t)%60);if(dt>now)free.push([t,a]);}}));
    return'<div class="spj'+(j===target?' tgt':'')+'"><div><strong>'+fd(j.fecha)+'</strong> '+AG_DIAS[j.fecha.getDay()].toLowerCase()+' · '+j.hIni+'–'+j.hFin+(j.prof?' · '+esc(j.prof):'')+(fDes&&j.fecha>fDes?' <span class="fl bad">después de la fecha deseada</span>':'')+(mine?' <span class="fl">ya tiene cita en esta jornada</span>':'')+'</div><div class="chs">'+(free.length?free.map(([t,a])=>'<button type="button" class="ch slb" data-dl="slot|'+esc(j.id)+'|'+t+'|'+a+'">'+t+(st.L.length>1?' '+a:'')+'</button>').join(""):'<span class="note">sin cupos libres</span>')+'</div></div>';}).join("")+'</div>';
}
function dAsig(D){
  const B=ST.book,T=TODAY();let h="";
  if(!D.serv){return'<label class="f">Servicio<select id="as_serv"><option value="">—</option>'+AG_SERV.map(([k,l])=>'<option value="'+k+'">'+l+'</option>').join("")+'</select></label><div class="copyrow" style="margin-top:8px"><button type="button" class="btn primary" data-dl="servok">Continuar</button></div>';}
  const j=D.jor?B.jor.find(x=>x.id===D.jor):null;
  if(j)h+='<p class="agsel">'+fd(j.fecha)+' · '+esc(D.hora)+(j.nAg===2?' · agenda '+esc(D.ag):'')+' · '+esc(AG_SN(j.serv))+(j.prof?' · '+esc(j.prof):'')+(D.fixedSlot?'':' <button type="button" class="lnk" data-dl="unslot">cambiar cupo</button>')+'</p>';
  if(!D.pat){
    h+='<label class="f">Buscar paciente activo (código, nombre o documento)<input type="text" data-dq="1" value="'+esc(D.q||"")+'"></label><p class="note" style="margin:6px 0">Sin texto de búsqueda se muestran los pendientes de '+esc(AG_SN(D.serv))+' ordenados por riesgo clínico y atraso.</p><div id="agcands">'+candList(D)+'</div>';
    return h;}
  const s=sOf(D.pat),p=pOf(D.pat)||{};
  h+='<p class="agsel"><strong>'+esc(D.pat)+'</strong> '+esc(p.nombre||"")+' · '+esc(epsShort(p.eps))+(s&&s.c.grupo?' · grupo '+s.c.grupo:'')+' · tel. '+esc([p.tel,p.tel2].filter(Boolean).join(" / ")||"sin teléfono")+(D.fixedPat?'':' <button type="button" class="lnk" data-dl="unpat">cambiar paciente</button>')+'</p>';
  const prev=inasCount(D.pat,T,365);if(prev)h+='<div class="alert warn"><p>Tiene '+prev+' inasistencia(s) en los últimos 12 meses. Antecedente de inasistencia es el predictor más consistente de una nueva (Dantas 2018): programe recordatorio y revise barreras con trabajo social.</p></div>';
  const its=s?s.items.filter(it=>itemServ(s,it)===D.serv):[];
  const fDes=D.fDes||(its.map(i=>i.due).filter(Boolean).sort((a,b)=>a-b)[0])||null;
  if(!j){h+=slotPicker(D.serv,fDes,D.pat);return h;}
  const fut=activeFut(D.pat,D.serv).filter(c=>c.id!==D.deId);
  if(fut.length)h+='<div class="alert warn"><p>Ya tiene cita de '+esc(AG_SN(D.serv))+' el '+fd(fut[0].fecha)+' a las '+esc(fut[0].hora)+'. Si esta la reemplaza, cancele la anterior.</p></div>';
  const clash=B.cit.filter(c=>c.c===D.pat&&c.estado==="ASIGNADA"&&NP.days(c.fecha,j.fecha)===0&&c.hora===D.hora&&c.id!==D.deId);
  if(clash.length)h+='<div class="alert bad"><p>Ya tiene otra cita a esa misma hora ('+esc(AG_SN(clash[0].serv))+').</p></div>';
  if(p.eps&&(window.EPSMODEL[p.eps]||{}).multi==="PAQUETE"&&D.serv==="NEFROLOGIA"&&s){
    const team=["NUTRICION","ENFERMERIA","PSICOLOGIA","TRABAJO SOCIAL","EDUCACION"].filter(sv=>s.items.some(it=>itemServ(s,it)===sv&&(!it.due||it.due<=NP.addMonths(j.fecha,1)))&&!activeFut(D.pat,sv).length);
    if(team.length){const same=B.jor.filter(x=>x.estado==="ABIERTA"&&NP.days(x.fecha,j.fecha)===0&&team.includes(x.serv));h+='<div class="alert"><p>Paquete de '+esc(p.eps)+': también le corresponde '+team.map(AG_SN).join(", ").toLowerCase()+'. Agéndelo el mismo día. '+(same.length?'Hay jornada abierta ese día de: '+same.map(x=>AG_SN(x.serv)).join(", ")+'.':'No hay jornadas abiertas de esos servicios ese día.')+'</p></div>';}
  }
  const tipos=AG_TIPOS[D.serv]||AG_TIPOS._;
  const tipo0=D.serv==="NEFROLOGIA"&&s&&!s.lv?"PRIMERA VEZ":D.serv==="NEFROLOGIA"&&its.some(i=>i.k==="ajuste")&&!its.some(i=>i.k==="ctl")?"AJUSTE DE METAS":tipos[0];
  h+='<div class="pacform"><div class="row"><label class="f">Tipo de cita<select id="as_tipo">'+tipos.map(t=>'<option'+(t===tipo0?" selected":"")+'>'+esc(t)+'</option>').join("")+'</select></label><label class="f">Origen<select id="as_orig">'+AG_ORIG.map(([k,l])=>'<option value="'+k+'"'+((j.fecha<T?"REGISTRO POSTERIOR":D.deId?"REPROGRAMACION":"PLAN")===k?" selected":"")+'>'+l+'</option>').join("")+'</select></label></div>';
  if(j.fecha<T)h+='<div class="alert warn"><p>La jornada ya pasó. Solo use esto para pasar a la herramienta citas que se manejaron por fuera (contingencia en papel). Queda como «registro posterior» y no entra al cálculo de oportunidad.</p></div>';
  h+='<div class="row"><label class="f">Fecha de solicitud<input type="date" id="as_fsol" value="'+iso(T)+'"></label><label class="f">Fecha deseada o límite del plan<input type="date" id="as_fdes" value="'+(fDes?iso(fDes):iso(j.fecha))+'"></label></div>';
  if(its.length)h+='<p class="note" style="margin:0">Del plan: '+its.map(i=>esc(i.nombre)+(i.due?" (límite "+fd(i.due)+")":" (sin registro)")).join("; ")+'.</p>';
  h+='<label class="f">Observaciones<input type="text" id="as_obs" value="'+esc(D.serv==="TOMA DE MUESTRAS"&&its.length?its.map(i=>i.nombre).join(", "):"")+'"></label>';
  h+='<p class="note" style="margin:0">Res. 256 de 2016 pide registrar fecha de solicitud, fecha deseada y fecha asignada; con ellas se mide la oportunidad.</p><div class="copyrow"><button type="button" class="btn primary" data-dl="as_ok">Asignar cita</button></div></div>';
  return h;
}
function dCita(D){
  const B=ST.book,c=B.cit.find(x=>x.id===D.id);if(!c)return'<p>No existe.</p>';
  const p=pOf(c.c)||{},s=sOf(c.c),T=TODAY(),past=c.fecha<=T,dt=citaDT(c);
  let h='<div class="agdet"><dl class="ficha"><dt>Paciente</dt><dd><strong>'+esc(c.c)+'</strong> '+esc(p.nombre||"")+' · '+esc(p.tipodoc||"")+' '+esc(p.doc||"")+'</dd><dt>EPS · grupo</dt><dd>'+esc(p.eps||"Sin EPS")+(s&&s.c.grupo?' · grupo '+s.c.grupo+' ('+esc((s.c.G||"")+" "+(s.c.A||""))+')':'')+'</dd><dt>Contacto</dt><dd>'+esc([p.tel,p.tel2].filter(Boolean).join(" / ")||"sin teléfono")+(p.acud||p.acudTel?' · '+esc((p.acud||"Acudiente")+" "+(p.acudTel||"")):"")+(p.municipio?' · '+esc(p.municipio):'')+'</dd>'+
    '<dt>Cita</dt><dd>'+fd(c.fecha)+' '+esc(c.hora)+' · agenda '+esc(c.ag)+' · '+esc(AG_SN(c.serv))+' · '+esc((c.tipo||"").toLowerCase())+' · origen '+esc((c.origen||"").toLowerCase())+'</dd><dt>Fechas</dt><dd>solicitud '+fd(c.fSol)+' · deseada '+fd(c.fDes)+' · asignada el '+fd(c.fAsig)+'</dd>'+
    '<dt>Estado</dt><dd><span class="est st-'+AG_CLS[c.estado]+'">'+esc(AG_EST[c.estado])+'</span>'+(c.hLleg?' · llegó '+esc(c.hLleg):'')+(c.hAten?' · atendido '+esc(c.hAten):'')+(c.conf?' · recordatorio: '+esc(c.conf.toLowerCase()):'')+'</dd>'+
    (c.motivo?'<dt>Motivo</dt><dd>'+esc(c.motivo)+' ('+esc(AG_RESP[c.resp]||c.resp||"")+')'+(c.avisoH!=null?' · avisó '+Math.round(c.avisoH)+' h antes':'')+'</dd>':'')+
    (c.deId||c.reId?'<dt>Enlaces</dt><dd>'+(c.deId?'reprograma <button type="button" class="lnk" data-dl="open|'+esc(c.deId)+'">'+esc(c.deId)+'</button> ':'')+(c.reId?'reprogramada en <button type="button" class="lnk" data-dl="open|'+esc(c.reId)+'">'+esc(c.reId)+'</button>':'')+'</dd>':'')+(c.obs?'<dt>Observaciones</dt><dd>'+esc(c.obs)+'</dd>':'')+'</dl></div>';
  const A=[];const btn=(k,l,pri)=>A.push('<button type="button" class="btn'+(pri?' primary':'')+'" data-dl="f|'+k+'">'+l+'</button>');
  if(c.estado==="ASIGNADA"){if(past){btn("lleg","Llegó",1);btn("aten","Llegó y fue atendido");if(new Date()>=dt)btn("noasis","No asistió");}btn("rec","Registrar recordatorio");btn("canc","Cancelar");}
  if(c.estado==="EN SALA"){btn("aten","Atendido",1);btn("noaten","Se retiró o no fue atendido");}
  if(c.estado==="INASISTENCIA")btn("motivo",c.motivo?"Cambiar motivo":"Registrar motivo",!c.motivo);
  if(["INASISTENCIA","CANCELADA","NO ATENDIDA"].includes(c.estado)&&!c.reId)btn("repro","Reprogramar",1);
  if(c.estado!=="ASIGNADA")btn("corr","Corregir estado");
  h+='<div class="copyrow agacts">'+A.join("")+(c.estado==="ATENDIDA"&&["NEFROLOGIA","MEDICO EXPERTO","MEDICO PROGRAMA"].includes(c.serv)?'<button type="button" class="btn" data-dl="valorar|'+esc(c.c)+'">Abrir valoración</button>':'')+'</div>';
  const F=D.form;const hhmm=past&&NP.days(c.fecha,T)===0?nowHM():c.hora;
  if(F==="lleg")h+=frm('<label class="f">Hora de llegada<input type="time" id="fx_h" value="'+hhmm+'"></label>',"Registrar llegada");
  if(F==="aten")h+=frm('<div class="row"><label class="f">Hora de llegada<input type="time" id="fx_h" value="'+esc(c.hLleg||hhmm)+'"></label><label class="f">Hora de ingreso a consulta<input type="time" id="fx_h2" value="'+(past&&NP.days(c.fecha,T)===0?nowHM():c.hora)+'"></label></div>',"Marcar atendido");
  if(F==="noasis")h+=frm('<p class="note" style="margin:0">No llegó y no avisó antes de la hora de la cita. Si no conoce el motivo, regístrelo después de llamar al paciente.</p><label class="f">Motivo (si ya se conoce)<select id="fx_m"><option value="">Sin establecer aún</option>'+motOpts("")+'</select></label><label class="f">Observaciones<input type="text" id="fx_o"></label>',"Registrar inasistencia");
  if(F==="noaten")h+=frm('<label class="f">Motivo *<select id="fx_m"><option value="">—</option>'+motOpts("I_DEMORA")+'</select></label><label class="f">Observaciones<input type="text" id="fx_o"></label>',"Registrar");
  if(F==="motivo")h+=frm('<label class="f">Motivo *<select id="fx_m"><option value="">—</option>'+motOpts(motKey(c.motivo))+'</select></label><label class="f">Observaciones<input type="text" id="fx_o"></label>',"Guardar motivo");
  if(F==="canc"){const n=new Date();h+=frm('<p class="note" style="margin:0">Cualquier aviso antes de la hora de la cita es cancelación (decisión del programa). Se guarda la anticipación del aviso.</p><div class="row"><label class="f">Fecha del aviso<input type="date" id="fx_d" value="'+iso(n)+'"></label><label class="f">Hora del aviso<input type="time" id="fx_h" value="'+nowHM()+'"></label></div><label class="f">Motivo *<select id="fx_m"><option value="">—</option>'+motOpts("")+'</select></label><label class="f">Observaciones<input type="text" id="fx_o"></label>',"Cancelar cita");}
  if(F==="rec")h+=frm('<div class="row"><label class="f">Medio<select id="fx_med">'+["LLAMADA","WHATSAPP","SMS","PRESENCIAL"].map(x=>'<option>'+x+'</option>').join("")+'</select></label><label class="f">Resultado<select id="fx_res">'+AG_REC.map(([k,l])=>'<option value="'+k+'">'+l+'</option>').join("")+'</select></label></div><label class="f">Observaciones<input type="text" id="fx_o"></label>',"Registrar recordatorio");
  if(F==="corr")h+=frm('<p class="note" style="margin:0">Devuelve la cita a «asignada». El estado anterior y el motivo de la corrección quedan en el historial; nada se borra.</p><label class="f">Motivo de la corrección *<input type="text" id="fx_o"></label>',"Corregir");
  if(F==="repro")h+='<div class="agform"><h3>Nuevo cupo</h3>'+slotPicker(c.serv,c.fDes,c.c)+'</div>';
  const lg=B.clog.filter(x=>x.id===c.id);
  h+='<details class="hist"'+(lg.length>1?'':'')+'><summary>Historial de la cita ('+lg.length+')</summary>'+(lg.length?'<div class="tablebox"><table><thead><tr><th>Fecha y hora</th><th>Acción</th><th>De → a</th><th>Motivo</th><th>Usuario</th></tr></thead><tbody>'+lg.map(x=>'<tr><td class="mono">'+esc(typeof x.fh==="string"?x.fh:fdt(x.fh))+'</td><td>'+esc(x.acc.toLowerCase())+'</td><td>'+esc((x.de||"—")+" → "+(x.a||"—"))+'</td><td>'+esc(x.motivo||"")+'</td><td>'+esc(x.usuario||"")+'</td></tr>').join("")+'</tbody></table></div>':'<p class="note">Sin registros.</p>')+'</details>';
  const cs=(ST.book.ctc||[]).filter(x=>x.cita===c.id);if(cs.length)h+='<details class="hist"><summary>Recordatorios y contactos ('+cs.length+')</summary><div class="tablebox"><table><thead><tr><th>Fecha y hora</th><th>Medio</th><th>Resultado</th><th>Observaciones</th><th>Usuario</th></tr></thead><tbody>'+cs.map(x=>'<tr><td class="mono">'+esc(typeof x.fh==="string"?x.fh:fdt(x.fh))+'</td><td>'+esc(x.medio.toLowerCase())+'</td><td>'+esc(x.res.toLowerCase())+'</td><td>'+esc(x.obs||"")+'</td><td>'+esc(x.usuario||"")+'</td></tr>').join("")+'</tbody></table></div></details>';
  return h;
}
const frm=(inner,lbl)=>'<div class="agform pacform">'+inner+'<div class="copyrow"><button type="button" class="btn primary" data-dl="f_ok">'+lbl+'</button></div></div>';

function dlgClick(e){
  if(e.target.id==="agdlg"){closeDlg();return;}
  const b=e.target.closest("[data-dl]");if(!b)return;const p=b.dataset.dl.split("|");const D=AST.dlg,B=ST.book;D.msg="";
  if(p[0]==="close"){closeDlg();return;}
  if(p[0]==="open"){openDlg({t:"cita",id:p[1]});return;}
  if(p[0]==="valorar"){closeDlg();openPatient(p[1]);return;}
  if(p[0]==="servok"){const v=fv("as_serv");if(!v){D.msg="Elija el servicio.";drawDlg();return;}D.serv=v;drawDlg();return;}
  if(p[0]==="pick"){D.pat=p[1];drawDlg();return;}
  if(p[0]==="unpat"){D.pat=null;drawDlg();return;}
  if(p[0]==="unslot"){D.jor=null;D.hora=null;D.ag=null;drawDlg();return;}
  if(p[0]==="slot"){
    if(D.t==="cita"){const old=B.cit.find(x=>x.id===D.id);openDlg({t:"asig",serv:old.serv,pat:old.c,fixedPat:true,jor:p[1],hora:p[2],ag:p[3],fixedSlot:true,deId:old.id,fDes:old.fDes,tipo:old.tipo});return;}
    D.jor=p[1];D.hora=p[2];D.ag=p[3];drawDlg();return;}
  if(p[0]==="f"){D.form=p[1];drawDlg();const f=document.querySelector("#agdlg .agform");if(f)f.scrollIntoView({block:"nearest"});return;}
  if(needUser()){return;}
  try{
    if(p[0]==="nj_ok")return okNewJor(D);
    if(p[0]==="cj_ok")return okCanJor(D);
    if(p[0]==="as_ok")return okAsig(D);
    if(p[0]==="f_ok")return okCita(D);
  }catch(err){D.msg=err.message;drawDlg();}
}
function okNewJor(D){
  const f=pdate(fv("nj_fecha")),serv=fv("nj_serv"),ini=fv("nj_ini"),fin=fv("nj_fin"),dur=parseInt(fv("nj_dur"),10),nAg=+fv("nj_nag");
  if(!f||!serv||hm2m(ini)==null||hm2m(fin)==null)throw new Error("Fecha, servicio y horario son obligatorios.");
  if(hm2m(fin)<=hm2m(ini))throw new Error("La hora de fin debe ser posterior a la de inicio.");
  if(!(dur>=5&&dur<=120))throw new Error("Duración del cupo entre 5 y 120 minutos.");
  if(hm2m(fin)-hm2m(ini)<dur)throw new Error("El horario no alcanza para un cupo.");
  const prof=fv("nj_prof");
  const ov=ST.book.jor.find(j=>j.estado==="ABIERTA"&&j.serv===serv&&NP.days(j.fecha,f)===0&&(j.prof||"")===prof&&hm2m(j.hIni)<hm2m(fin)&&hm2m(ini)<hm2m(j.hFin));
  if(ov)throw new Error("Se cruza con la jornada "+ov.id+" ("+ov.hIni+"–"+ov.hFin+") del mismo servicio y profesional.");
  const base="J"+iso(f).replace(/-/g,"");let n=1;while(ST.book.jor.some(j=>j.id===base+"-"+n))n++;
  const j={id:base+"-"+n,fecha:f,serv,prof,hIni:ini,hFin:fin,dur,nAg,estado:"ABIERTA",motivo:"",obs:fv("nj_obs"),usuario:AST.user,reg:fdt(new Date())};
  ST.book.jor.push(j);ST.book.clog.push({fh:new Date(),id:j.id,c:"",acc:"ABRE JORNADA",de:"",a:"ABIERTA",motivo:AG_SN(serv)+" "+ini+"–"+fin+" cupo "+dur+" min, "+nAg+" agenda(s)",usuario:AST.user});
  agChanged();closeDlg();AST.date=iso(f);AST.sub="dia";renderMg("agenda");toast("Jornada abierta: "+agSlots(j).length*nAg+" cupos.");
}
function okCanJor(D){
  const mk=fv("cj_mot");if(!mk)throw new Error("Elija el motivo.");const j=ST.book.jor.find(x=>x.id===D.id);const now=new Date();const det=fv("cj_det");
  j.estado="CANCELADA";j.motivo=AG_MOTL(mk)+(det?": "+det:"");ST.book.clog.push({fh:now,id:j.id,c:"",acc:"CANCELA JORNADA",de:"ABIERTA",a:"CANCELADA",motivo:j.motivo,usuario:AST.user});
  let n=0;ST.book.cit.filter(c=>c.jor===j.id&&c.estado==="ASIGNADA").forEach(c=>{agSet(c,"CANCELADA","Jornada cancelada: "+j.motivo,{resp:AG_MOTR(mk),motivo:AG_MOTL(mk),avisoH:Math.max(0,Math.round((citaDT(c)-now)/36e5*10)/10)});n++;});
  agChanged();closeDlg();renderMg("agenda");toast("Jornada cancelada. "+n+" cita(s) pasan a «Por reprogramar».");
}
function okAsig(D){
  const B=ST.book,j=B.jor.find(x=>x.id===D.jor);if(!j||!D.pat)throw new Error("Falta paciente o cupo.");
  if(B.cit.some(c=>c.jor===j.id&&c.hora===D.hora&&c.ag===D.ag&&c.estado!=="CANCELADA"))throw new Error("Ese cupo ya fue ocupado.");
  if(B.cit.some(c=>c.jor===j.id&&c.c===D.pat&&c.estado!=="CANCELADA"))throw new Error("El paciente ya tiene cita en esta jornada.");
  if(j.fecha<TODAY()&&fv("as_orig")!=="REGISTRO POSTERIOR")throw new Error("Para una jornada pasada use el origen «Registro posterior».");
  const fSol=pdate(fv("as_fsol")),fDes=pdate(fv("as_fdes"));if(!fSol)throw new Error("Falta la fecha de solicitud.");if(fSol>TODAY())throw new Error("La fecha de solicitud no puede ser futura.");
  const c=agCreate({c:D.pat,jor:j.id,fecha:j.fecha,hora:D.hora,ag:D.ag,serv:j.serv,tipo:fv("as_tipo"),origen:fv("as_orig"),fSol,fDes,obs:fv("as_obs"),deId:D.deId||""});
  if(D.deId){const old=B.cit.find(x=>x.id===D.deId);if(old){old.reId=c.id;agLog(old,"REPROGRAMADA",old.estado,old.estado,"Nueva cita "+c.id+" el "+fd(c.fecha));}}
  agChanged();closeDlg();if(AST.sub==="dia"&&!D.deId)AST.date=iso(j.fecha);renderMg("agenda");toast("Cita "+c.id+" asignada: "+fd(c.fecha)+" "+c.hora+(j.nAg===2?" agenda "+c.ag:"")+".");
}
function okCita(D){
  const c=ST.book.cit.find(x=>x.id===D.id),F=D.form,o=fv("fx_o");
  if(F==="lleg"){const h=fv("fx_h");if(!h)throw new Error("Falta la hora.");agSet(c,"EN SALA","",{hLleg:h});}
  if(F==="aten"){const h=fv("fx_h"),h2=fv("fx_h2");if(!h||!h2)throw new Error("Faltan las horas.");if(hm2m(h2)<hm2m(h))throw new Error("El ingreso a consulta no puede ser antes de la llegada.");agSet(c,"ATENDIDA","",{hLleg:h,hAten:h2});}
  if(F==="noasis"&&new Date()<citaDT(c))throw new Error("Aún no es la hora de la cita: no se puede registrar inasistencia.");
  if(F==="noasis"){const m=fv("fx_m");agSet(c,"INASISTENCIA",[m?AG_MOTL(m):"",o].filter(Boolean).join(" · "),{resp:m?AG_MOTR(m):"",motivo:m?AG_MOTL(m):"",obs:o?[c.obs,o].filter(Boolean).join(" · "):c.obs});}
  if(F==="noaten"){const m=fv("fx_m");if(!m)throw new Error("Elija el motivo.");agSet(c,"NO ATENDIDA",[AG_MOTL(m),o].filter(Boolean).join(" · "),{resp:AG_MOTR(m),motivo:AG_MOTL(m)});}
  if(F==="motivo"){const m=fv("fx_m");if(!m)throw new Error("Elija el motivo.");const de=c.motivo;c.resp=AG_MOTR(m);c.motivo=AG_MOTL(m);if(o)c.obs=[c.obs,o].filter(Boolean).join(" · ");agLog(c,"MOTIVO",c.estado,c.estado,(de?"Antes: "+de+". ":"")+"Ahora: "+c.motivo+(o?" · "+o:""));}
  if(F==="canc"){const m=fv("fx_m");if(!m)throw new Error("Elija el motivo.");const d=pdate(fv("fx_d")),hh=hm2m(fv("fx_h"));if(!d||hh==null)throw new Error("Falta fecha u hora del aviso.");
    const av=new Date(d.getFullYear(),d.getMonth(),d.getDate(),Math.floor(hh/60),hh%60);if(av>new Date())throw new Error("El aviso no puede ser futuro.");
    const hrs=(citaDT(c)-av)/36e5;if(hrs<=0)throw new Error("El aviso llegó después de la hora de la cita: regístrela como inasistencia.");
    agSet(c,"CANCELADA",[AG_MOTL(m),"aviso "+Math.round(hrs)+" h antes",o].filter(Boolean).join(" · "),{resp:AG_MOTR(m),motivo:AG_MOTL(m),avisoH:Math.round(hrs*10)/10,obs:o?[c.obs,o].filter(Boolean).join(" · "):c.obs});}
  if(F==="rec"){const res=fv("fx_res"),med=fv("fx_med");ST.book.ctc.push({fh:new Date(),c:c.c,cita:c.id,medio:med,res,obs:o,usuario:AST.user});
    if(res==="CANCELA"){agChanged();D.form="canc";D.msg="Recordatorio registrado. Complete la cancelación.";drawDlg();return;}
    c.conf=res==="CONFIRMA"?"CONFIRMADA":res;agLog(c,"RECORDATORIO",c.estado,c.estado,med+": "+res+(o?" · "+o:""));}
  if(F==="corr"){if(!o)throw new Error("Escriba el motivo de la corrección.");const de=c.estado;Object.assign(c,{hLleg:"",hAten:"",resp:"",motivo:"",avisoH:null});c.estado="ASIGNADA";agLog(c,"CORRECCION",de,"ASIGNADA",o);}
  agChanged();D.form=null;drawDlg();renderMg("agenda");toast("Registrado.");
}

/* ---------- Estadísticas ---------- */
const CERR=["ATENDIDA","EN SALA","NO ATENDIDA","INASISTENCIA"],LLEGO=["ATENDIDA","EN SALA","NO ATENDIDA"];
const med=a=>{if(!a.length)return null;const s=a.slice().sort((x,y)=>x-y),m=Math.floor(s.length/2);return s.length%2?s[m]:(s[m-1]+s[m])/2;};
const pct=(n,d)=>d?n/d*100:null;
const pf=v=>v==null?"—":(Math.round(v*10)/10).toLocaleString("es-CO")+" %";
const ageBand=a=>a==null?"Sin dato":a<50?"< 50":a<65?"50–64":a<80?"65–79":"≥ 80";
function agCompute(){
  const B=ST.book,de=pdate(AST.desde)||new Date(2000,0,1),ha=pdate(AST.hasta)||TODAY(),T=TODAY();
  const inR=f=>f>=de&&f<=ha;
  const C=B.cit.filter(c=>inR(c.fecha)&&(!AST.serv||c.serv===AST.serv)&&(!AST.eps||(pOf(c.c)||{}).eps===AST.eps));
  const J=B.jor.filter(j=>inR(j.fecha)&&(!AST.serv||j.serv===AST.serv));
  const cup=j=>agSlots(j).length*j.nAg;
  const ofert=J.filter(j=>j.estado!=="CANCELADA").reduce((a,j)=>a+cup(j),0),cupJC=J.filter(j=>j.estado==="CANCELADA").reduce((a,j)=>a+cup(j),0);
  const by=k=>C.filter(c=>c.estado===k);
  const cer=C.filter(c=>CERR.includes(c.estado)),inas=by("INASISTENCIA"),lleg=C.filter(c=>LLEGO.includes(c.estado)),aten=by("ATENDIDA"),canc=by("CANCELADA"),noat=by("NO ATENDIDA");
  const sinC=C.filter(c=>(c.estado==="ASIGNADA"||c.estado==="EN SALA")&&c.fecha<T);
  const enJA=C.filter(c=>c.estado!=="CANCELADA"&&J.some(j=>j.id===c.jor&&j.estado!=="CANCELADA")).length;
  const cancR={};canc.forEach(c=>{const r=c.resp||"SIN DATO";cancR[r]=(cancR[r]||0)+1;});
  const tard=canc.filter(c=>c.avisoH!=null&&c.avisoH<24).length;
  const op=C.filter(c=>c.fSol&&c.origen!=="REGISTRO POSTERIOR").map(c=>NP.days(c.fSol,c.fecha)).filter(x=>x>=0);
  const desOk=C.filter(c=>c.fDes&&c.origen!=="REPROGRAMACION"&&c.origen!=="REGISTRO POSTERIOR"),desIn=desOk.filter(c=>c.fecha<=c.fDes).length,retr=desOk.filter(c=>c.fecha>c.fDes).map(c=>NP.days(c.fDes,c.fecha));
  const esp=aten.filter(c=>c.hLleg&&c.hAten).map(c=>hm2m(c.hAten)-hm2m(c.hLleg)).filter(x=>x>=0);
  const tarde=lleg.filter(c=>c.hLleg&&hm2m(c.hLleg)-hm2m(c.hora)>15).length,conH=lleg.filter(c=>c.hLleg).length;
  const rp=C.filter(c=>["INASISTENCIA","CANCELADA","NO ATENDIDA"].includes(c.estado)),rpOk=rp.filter(c=>c.reId),rpD=rpOk.map(c=>{const n=B.cit.find(x=>x.id===c.reId);return n?NP.days(c.fecha,n.fecha):null;}).filter(x=>x!=null);
  const inasMot=inas.filter(c=>c.motivo).length;
  const mgte=C.filter(c=>!c.deId&&c.fSol&&c.origen!=="REGISTRO POSTERIOR").map(c=>{const f=chainEnd(c);return f?NP.days(c.fSol,f.fecha):null;}).filter(x=>x!=null&&x>=0);
  /* dimensiones de la tasa de inasistencia (sobre citas cerradas) */
  const dims=[
    ["Servicio",c=>AG_SN(c.serv)],["EPS",c=>epsShort((pOf(c.c)||{}).eps)],["Grupo del programa (actual)",c=>{const s=sOf(c.c);return s&&s.c.grupo?"Grupo "+s.c.grupo:"Sin grupo";}],
    ["Edad a la fecha de la cita",c=>{const p=pOf(c.c)||{};return ageBand(COH.age(p.fnac,c.fecha));},["< 50","50–64","65–79","≥ 80","Sin dato"]],["Sexo",c=>({F:"Femenino",M:"Masculino"})[(pOf(c.c)||{}).sexo]||"Sin dato"],["Municipio",c=>(pOf(c.c)||{}).municipio||"Sin dato"],
    ["Día de la semana",c=>AG_DIAS[c.fecha.getDay()],["Lunes","Martes","Miércoles","Jueves","Viernes","Sábado","Domingo"]],["Franja horaria",c=>{const m=hm2m(c.hora);return m==null?"Sin hora":m2hm(Math.floor(m/60)*60)+"–"+m2hm(Math.floor(m/60)*60+60);},"alpha"],["Agenda (espejo)",c=>"Agenda "+(c.ag||"A")],
    ["Días entre asignación y cita",c=>{if(!c.fAsig)return"Sin dato";const d=NP.days(c.fAsig,c.fecha);return d<=7?"0–7 días":d<=14?"8–14 días":d<=30?"15–30 días":"> 30 días";},["0–7 días","8–14 días","15–30 días","> 30 días","Sin dato"]],
    ["Recordatorio",c=>c.conf==="CONFIRMADA"?"Confirmó":c.conf?"Contactado sin confirmar ("+c.conf.toLowerCase()+")":"Sin recordatorio registrado"],
    ["Inasistencia previa (12 meses)",c=>inasCount(c.c,c.fecha,365)?"Sí":"No"],["Origen de la cita",c=>(AG_ORIG.find(o=>o[0]===c.origen)||[0,c.origen||"Sin dato"])[1]]];
  const D=dims.map(([n,f,o])=>{const m={};cer.forEach(c=>{const k=f(c);(m[k]=m[k]||{k,n:0,x:0}).n++;if(c.estado==="INASISTENCIA")m[k].x++;});const rows=Object.values(m);
    rows.sort(Array.isArray(o)?(a,b)=>o.indexOf(a.k)-o.indexOf(b.k):o==="alpha"?(a,b)=>a.k.localeCompare(b.k):(a,b)=>b.n-a.n);return{n,rows};});
  const motCount=L=>{const m={};L.forEach(c=>{const k=c.motivo||"Sin motivo registrado";(m[k]=m[k]||{k,r:c.resp||"",n:0}).n++;});return Object.values(m).sort((a,b)=>b.n-a.n);};
  const respCount=L=>{const m={};L.forEach(c=>{const k=c.resp?AG_RESP[c.resp]||c.resp:"Sin establecer";m[k]=(m[k]||0)+1;});return Object.entries(m).map(([k,n])=>({k,n})).sort((a,b)=>b.n-a.n);};
  const reinc={};B.cit.filter(c=>c.estado==="INASISTENCIA"&&c.fecha<=ha&&NP.days(c.fecha,ha)<=180).forEach(c=>{(reinc[c.c]=reinc[c.c]||[]).push(c);});
  const rein=Object.entries(reinc).filter(([k,v])=>v.length>=2).map(([k,v])=>({code:k,L:v.sort((a,b)=>a.fecha-b.fecha)})).sort((a,b)=>b.L.length-a.L.length);
  return{de,ha,C,J,ofert,cupJC,cer,inas,lleg,aten,canc,noat,sinC,enJA,cancR,tard,op,desOk,desIn,retr,esp,tarde,conH,rp,rpOk,rpD,inasMot,mgte,D,motI:motCount(inas),motC:motCount(canc),motN:motCount(noat),respI:respCount(inas),respC:respCount(canc),rein};
}
const bars=(rows,total,lab)=>{const mx=Math.max(1,...rows.map(r=>r.n));return'<div class="hbars">'+rows.map(r=>'<div class="hb" title="'+esc(r.k+": "+r.n+(total?" ("+pf(pct(r.n,total))+")":""))+'"><span class="hbl">'+esc(r.k)+(r.r?'<span class="sub">'+esc(AG_RESP[r.r]||r.r)+'</span>':'')+'</span><span class="hbt"><span style="width:'+(r.n/mx*100)+'%"></span></span><span class="hbv mono">'+r.n+(total?' · '+pf(pct(r.n,total)):'')+'</span></div>').join("")+'</div>';};
function vEst(){
  const R=agCompute();ST._agR=R;const nf=n=>n.toLocaleString("es-CO");
  let h='<div class="filters" style="margin:12px 0"><label class="f">Desde<input type="date" data-agf="desde" value="'+esc(AST.desde)+'"></label><label class="f">Hasta<input type="date" data-agf="hasta" value="'+esc(AST.hasta)+'"></label><label class="f">Servicio<select data-agf="serv"><option value="">Todos</option>'+AG_SERV.map(([k,l])=>'<option value="'+k+'"'+(AST.serv===k?" selected":"")+'>'+l+'</option>').join("")+'</select></label><label class="f">EPS<select data-agf="eps"><option value="">Todas</option>'+COH.EPS.map(e=>'<option'+(AST.eps===e?" selected":"")+'>'+esc(e)+'</option>').join("")+'</select></label><div class="copyrow" style="align-self:end"><button type="button" class="btn primary" data-x="agest">Exportar informe</button></div></div>';
  h+=repPanel();
  if(ST.demo)h+='<p class="note"><span class="exflag">Ficticio</span> Las cifras salen de datos inventados para mostrar la herramienta; no son resultados del programa.</p>';
  const tasaI=pct(R.inas.length,R.cer.length);
  h+='<div class="tiles">'+tile("Cupos ofertados"+(AST.eps?" (sin filtro EPS)":""),nf(R.ofert),"")+tile("Citas programadas",nf(R.C.length),"")+tile("Ocupación de cupos",AST.eps?"—":pf(pct(R.enJA,R.ofert)),"")+tile("Atendidas",nf(R.aten.length),"")+tile("Asistencia",pf(pct(R.lleg.length,R.cer.length)),"")+tile("Inasistencia",pf(tasaI),tasaI>20?"bad":tasaI>10?"warn":"")+tile("Canceladas",nf(R.canc.length)+" ("+pf(pct(R.canc.length,R.C.length))+")",R.canc.length?"warn":"")+tile("Sin cierre",nf(R.sinC.length),R.sinC.length?"warn":"")+'</div>';
  if(R.cer.length&&R.cer.length<30)h+='<p class="note">Solo '+R.cer.length+' citas cerradas en el periodo: los porcentajes por subgrupo son inestables. Mire los números absolutos.</p>';
  if(R.sinC.length)h+='<div class="alert warn"><p>'+R.sinC.length+' citas del periodo no tienen cierre (ni llegada ni inasistencia). Quedan fuera del denominador; si fueran inasistencias, la tasa real sería '+pf(pct(R.inas.length+R.sinC.length,R.cer.length+R.sinC.length))+'.</p></div>';
  h+='<div class="two"><section class="panel"><h3>Oportunidad y cumplimiento</h3><dl class="ficha"><dt>Días solicitud → cita</dt><dd>'+(R.op.length?'mediana '+med(R.op)+' · promedio '+(Math.round(R.op.reduce((a,b)=>a+b,0)/R.op.length*10)/10).toLocaleString("es-CO")+' · '+R.op.length+' citas':'sin datos')+'</dd><dt>Días solicitud → atención efectiva</dt><dd>'+(R.mgte.length?'mediana '+med(R.mgte)+' ('+R.mgte.length+' citas originales que terminaron atendidas, contando reprogramaciones)':'sin datos')+'</dd><dt>Dentro de la fecha deseada o límite del plan</dt><dd>'+(R.desOk.length?pf(pct(R.desIn,R.desOk.length))+' ('+R.desIn+' de '+R.desOk.length+')'+(R.retr.length?' · atraso mediano '+med(R.retr)+' días cuando se pasa':''):'sin datos')+'</dd><dt>Espera en sala</dt><dd>'+(R.esp.length?'mediana '+med(R.esp)+' min ('+R.esp.length+' con ambas horas)':'sin datos')+'</dd><dt>Llegada tardía (> 15 min)</dt><dd>'+(R.conH?pf(pct(R.tarde,R.conH))+' ('+R.tarde+' de '+R.conH+')':'sin datos')+'</dd><dt>Reprogramadas</dt><dd>'+(R.rp.length?pf(pct(R.rpOk.length,R.rp.length))+' de inasistencias, cancelaciones y no atendidas'+(R.rpD.length?' · nueva cita a '+med(R.rpD)+' días (mediana)':''):'sin datos')+'</dd><dt>Inasistencias con motivo</dt><dd>'+(R.inas.length?pf(pct(R.inasMot,R.inas.length))+' ('+R.inasMot+' de '+R.inas.length+')':'sin inasistencias')+'</dd><dt>Cupos de jornadas canceladas</dt><dd>'+R.cupJC+'</dd><dt>Cancelaciones con aviso < 24 h</dt><dd>'+R.tard+' de '+R.canc.length+'</dd></dl></section>';
  h+='<section class="panel"><h3>Cancelaciones por responsable</h3>'+(R.canc.length?bars(R.respC,R.canc.length):'<p class="note">Sin cancelaciones.</p>')+'<h3 style="margin-top:16px">Inasistencias por responsable</h3>'+(R.inas.length?bars(R.respI,R.inas.length):'<p class="note">Sin inasistencias.</p>')+'</section></div>';
  h+='<div class="two"><section class="panel"><h3>Motivos de inasistencia · '+R.inas.length+'</h3>'+(R.inas.length?bars(R.motI,R.inas.length):'<p class="note">Sin inasistencias en el periodo.</p>')+'</section><section class="panel"><h3>Motivos de cancelación · '+R.canc.length+'</h3>'+(R.canc.length?bars(R.motC,R.canc.length):'<p class="note">Sin cancelaciones.</p>')+(R.noat.length?'<h3 style="margin-top:16px">Llegaron y no fueron atendidos · '+R.noat.length+'</h3>'+bars(R.motN,R.noat.length):'')+'</section></div>';
  h+='<section class="panel"><h3>Tasa de inasistencia por característica</h3><p class="note" style="margin:0 0 10px">Inasistencias sobre citas cerradas (atendidas, en sala, llegaron sin atención e inasistencias). Describe; no prueba causas. Con grupos pequeños, una o dos citas mueven mucho el porcentaje.</p><div class="dimgrid">'+R.D.map(d=>'<div class="dimt"><div class="sub-h">'+esc(d.n)+'</div><table><thead><tr><th>Categoría</th><th>Cerradas</th><th>No asistió</th><th>Tasa</th></tr></thead><tbody>'+d.rows.map(r=>'<tr><td>'+esc(r.k)+'</td><td class="mono">'+r.n+'</td><td class="mono">'+r.x+'</td><td class="mono">'+pf(pct(r.x,r.n))+'<span class="mini"><span style="width:'+(r.n?r.x/r.n*100:0)+'%"></span></span></td></tr>').join("")+'</tbody></table></div>').join("")+'</div></section>';
  h+='<section class="panel"><h3>Inasistencia reiterada · '+R.rein.length+'</h3><p class="note" style="margin:0 0 8px">Dos o más inasistencias en los 180 días previos a la fecha final. Candidatos a valoración de barreras por trabajo social y a confirmación reforzada.</p>'+(R.rein.length?'<div class="tablebox"><table><thead><tr><th>Paciente</th><th>EPS</th><th>Contacto</th><th>Grupo</th><th>Inasistencias</th></tr></thead><tbody>'+R.rein.map(x=>{const s=sOf(x.code),p=pOf(x.code)||{codigo:x.code};const fk={p,c:s?s.c:{},P:{}};return'<tr><td>'+pname(fk)+'</td><td>'+esc(epsShort(p.eps))+'</td><td>'+contact(fk)+'</td><td>'+(s?grpTag(s):'—')+'</td><td>'+x.L.map(c=>fd(c.fecha)+' '+esc(AG_SN(c.serv).toLowerCase())+(c.motivo?' ('+esc(c.motivo.toLowerCase())+')':'')).join("<br>")+'</td></tr>';}).join("")+'</tbody></table></div>':'<p class="note">Ninguno.</p>')+'</section>';
  h+='<details class="panel"><summary>Definiciones (fichas institucionales)</summary><dl class="ficha">'+AG_FICHAS.map(([n,d])=>'<dt>'+esc(n)+'</dt><dd>'+esc(d)+'</dd>').join("")+'</dl><p class="note">Definiciones propuestas por el programa; no hay ficha nacional obligatoria de inasistencia para nefrología. La oportunidad sigue la lógica de la Res. 256 de 2016 (fecha de solicitud, deseada y asignada).</p></details>';
  return h;
}
const AG_FICHAS=[
 ["Cupos ofertados","Cupos de jornadas no canceladas en el periodo: (fin − inicio) ÷ duración del cupo × número de agendas simultáneas."],
 ["Ocupación","Citas no canceladas en jornadas no canceladas ÷ cupos ofertados."],
 ["Cita cerrada","Cita con desenlace registrado: atendida, en sala, llegó sin ser atendida o inasistencia. Las canceladas y las asignadas sin marcar no cuentan."],
 ["Asistencia","Citas en que el paciente llegó (atendida, en sala o no atendida) ÷ citas cerradas."],
 ["Inasistencia","Pacientes que no llegaron y no avisaron antes de la hora de la cita ÷ citas cerradas. Cualquier aviso previo es cancelación (decisión del programa)."],
 ["Cancelación","Citas canceladas ÷ citas programadas, por responsable (paciente, barrera de acceso, EPS, IPS, otro). Se guarda la anticipación del aviso en horas."],
 ["Oportunidad","Días entre la fecha de solicitud y la fecha de la cita (mediana y promedio)."],
 ["Dentro de la fecha deseada","Citas (sin contar reprogramaciones) cuya fecha es igual o anterior a la fecha deseada o fecha límite del plan del paciente."],
 ["Espera en sala","Minutos entre la hora de llegada y la hora de ingreso a consulta."],
 ["Sin cierre","Citas de fechas pasadas que siguen «asignadas». Es un indicador de calidad del dato."]];

/* ---------- Exportaciones ---------- */
function agSheets(){
  const B=ST.book;const D=x=>x?fd(x):"";
  const jor=[["ID jornada","Fecha","Servicio","Profesional","Hora inicio","Hora fin","Duración cupo (min)","Agendas simultáneas","Estado","Motivo cancelación","Observaciones","Usuario","Registrado"]].concat(B.jor.map(j=>[j.id,D(j.fecha),j.serv,j.prof,j.hIni,j.hFin,j.dur,j.nAg,j.estado,j.motivo,j.obs,j.usuario,j.reg]));
  const cit=[["ID cita","Código","ID jornada","Fecha","Hora","Agenda","Servicio","Tipo","Origen","Fecha solicitud","Fecha deseada","Fecha asignación","Estado","Confirmación","Hora llegada","Hora atención","Responsable","Motivo","Aviso (horas)","Cita anterior","Reprogramada en","Observaciones","Usuario","Actualizado"]].concat(B.cit.map(c=>[c.id,c.c,c.jor,D(c.fecha),c.hora,c.ag,c.serv,c.tipo,c.origen,D(c.fSol),D(c.fDes),D(c.fAsig),c.estado,c.conf,c.hLleg,c.hAten,c.resp,c.motivo,c.avisoH==null?"":c.avisoH,c.deId,c.reId,c.obs,c.usuario,c.act]));
  const log=[["Fecha y hora","ID","Código","Acción","Estado anterior","Estado nuevo","Motivo","Usuario"]].concat(B.clog.map(x=>[typeof x.fh==="string"?x.fh:fdt(x.fh),x.id,x.c,x.acc,x.de,x.a,x.motivo,x.usuario]));
  const ctc=[["Fecha y hora","Código","ID cita","Medio","Resultado","Observaciones","Usuario"]].concat((B.ctc||[]).map(x=>[typeof x.fh==="string"?x.fh:fdt(x.fh),x.c,x.cita,x.medio,x.res,x.obs,x.usuario]));
  return[["Jornadas",jor],["Citas",cit],["Citas_log",log],["Contactos",ctc]];
}
async function agExportBook(){
  const stamp=iso(new Date())+"_"+nowHM().replace(":","");
  if(ST.db||!ST.wbBuf){await saveXlsx("Agenda_nefroproteccion_"+stamp+".xlsx",agSheets());ST.dirty=false;bookInfo();renderMg("agenda");return;}
  const wb=XLSX.read(ST.wbBuf,{type:"array",cellDates:true});
  applyOps(wb);
  agSheets().forEach(([n,aoa])=>{const i=wb.SheetNames.indexOf(n);if(i>=0){wb.SheetNames.splice(i,1);delete wb.Sheets[n];}XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(aoa),n);});
  await saveWb(wb,(ST.name||"Libro").replace(/\.xlsx?$/i,"").replace(/_(agenda|libro)_\d{4}-\d{2}-\d{2}_\d{4}$/,"")+"_libro_"+stamp+".xlsx");
  ST.wbBuf=new Uint8Array(XLSX.write(wb,{type:"array",bookType:"xlsx"}));ST.ops=[];
  ST.dirty=false;bookInfo();const vv=VIEWS.find(x=>!$("view-"+x).hidden);if(vv&&vv!=="calc"&&vv!=="ref")renderMg(vv);
}
function agExportJor(id){
  const j=ST.book.jor.find(x=>x.id===id);const C=ST.book.cit.filter(c=>c.jor===id&&(c.estado==="ASIGNADA"||c.estado==="EN SALA")).sort((a,b)=>hm2m(a.hora)-hm2m(b.hora)||a.ag.localeCompare(b.ag));
  const aoa=[["Hora","Agenda","Código","Nombre","Documento","EPS","Teléfono 1","Teléfono 2","Acudiente","Teléfono acudiente","Tipo","Estado","Recordatorio","Inasistencias previas 12 m","Observaciones"]];
  C.forEach(c=>{const p=pOf(c.c)||{};aoa.push([c.hora,c.ag,c.c,p.nombre,p.doc,p.eps,p.tel,p.tel2,p.acud,p.acudTel,c.tipo,AG_EST[c.estado],c.conf,inasCount(c.c,c.fecha,365),c.obs]);});
  saveXlsx("Jornada_"+id+".xlsx",[["Lista",aoa]]);
}
function agExportPend(){
  const L=ST._cands||[];const aoa=[["Código","Nombre","Documento","EPS","Teléfono 1","Teléfono 2","Acudiente","Teléfono acudiente","Grupo","Servicio","Pendiente","Fecha límite","Inasistencias 12 m"]];
  L.forEach(x=>{const p=x.s.p;aoa.push([p.codigo,p.nombre,p.doc,p.eps,p.tel,p.tel2,p.acud,p.acudTel,x.s.c.grupo||"",AG_SN(AST.pserv),x.its.map(i=>i.nombre).join("; "),x.due?fd(x.due):"sin registro",inasCount(p.codigo,TODAY(),365)]);});
  saveXlsx("Por_agendar_"+AST.pserv.replace(/\s+/g,"_")+"_"+iso(TODAY())+".xlsx",[["Por agendar",aoa]]);
}
function agExportStats(){
  const R=ST._agR||agCompute();const per=fd(R.de)+" a "+fd(R.ha);
  const res=[["Indicador","Valor","Numerador","Denominador","Periodo","Filtro servicio","Filtro EPS"]];
  const r=(n,v,a,b)=>res.push([n,v==null?"":Math.round(v*10)/10,a,b,per,AST.serv?AG_SN(AST.serv):"Todos",AST.eps||"Todas"]);
  r("Cupos ofertados",R.ofert,"","");r("Citas programadas",R.C.length,"","");r("Ocupación %",AST.eps?null:pct(R.enJA,R.ofert),R.enJA,R.ofert);r("Asistencia %",pct(R.lleg.length,R.cer.length),R.lleg.length,R.cer.length);r("Inasistencia %",pct(R.inas.length,R.cer.length),R.inas.length,R.cer.length);
  r("Cancelación %",pct(R.canc.length,R.C.length),R.canc.length,R.C.length);r("Atendidas sobre cupos ofertados %",AST.eps?null:pct(R.aten.length,R.ofert),R.aten.length,R.ofert);r("Citas sin cierre",R.sinC.length,"","");
  r("Oportunidad, mediana de días",med(R.op),"",R.op.length);r("Dentro de la fecha deseada %",pct(R.desIn,R.desOk.length),R.desIn,R.desOk.length);r("Espera en sala, mediana de minutos",med(R.esp),"",R.esp.length);r("Inasistencias con motivo %",pct(R.inasMot,R.inas.length),R.inasMot,R.inas.length);r("Reprogramadas %",pct(R.rpOk.length,R.rp.length),R.rpOk.length,R.rp.length);
  Object.entries(R.cancR).forEach(([k,n])=>r("Cancelaciones por "+(AG_RESP[k]||k),n,"",""));
  const dim=[["Característica","Categoría","Citas cerradas","Inasistencias","Tasa %"]];R.D.forEach(d=>d.rows.forEach(x=>dim.push([d.n,x.k,x.n,x.x,Math.round(pct(x.x,x.n)*10)/10])));
  const mot=[["Desenlace","Motivo","Responsable","Citas"]];R.motI.forEach(x=>mot.push(["Inasistencia",x.k,AG_RESP[x.r]||x.r,x.n]));R.motC.forEach(x=>mot.push(["Cancelación",x.k,AG_RESP[x.r]||x.r,x.n]));R.motN.forEach(x=>mot.push(["Llegó, no atendida",x.k,AG_RESP[x.r]||x.r,x.n]));
  const nom=[["Fecha","Hora","Servicio","Código","Nombre","Documento","EPS","Teléfono 1","Teléfono 2","Acudiente","Teléfono acudiente","Grupo","Estado","Motivo","Responsable","Aviso (horas)","Reprogramada en"]];
  R.C.filter(c=>["INASISTENCIA","CANCELADA","NO ATENDIDA"].includes(c.estado)).sort((a,b)=>a.fecha-b.fecha).forEach(c=>{const p=pOf(c.c)||{},s=sOf(c.c);nom.push([fd(c.fecha),c.hora,AG_SN(c.serv),c.c,p.nombre,p.doc,p.eps,p.tel,p.tel2,p.acud,p.acudTel,s?s.c.grupo||"":"",AG_EST[c.estado],c.motivo,AG_RESP[c.resp]||c.resp,c.avisoH==null?"":c.avisoH,c.reId]);});
  const rei=[["Código","Nombre","EPS","Teléfono 1","Inasistencias (180 días)","Fechas"]];R.rein.forEach(x=>{const p=pOf(x.code)||{};rei.push([x.code,p.nombre,p.eps,p.tel,x.L.length,x.L.map(c=>fd(c.fecha)).join(", ")]);});
  const fic=[["Indicador","Definición"]].concat(AG_FICHAS);
  saveXlsx("Asistencia_inasistencia_"+iso(R.de)+"_"+iso(R.ha)+".xlsx",[["Resumen",res],["Por característica",dim],["Motivos",mot],["Nominal no atendidos",nom],["Reiterados",rei],["Definiciones",fic]].concat([["Citas del periodo",[agSheets()[1][1][0]].concat(agSheets()[1][1].slice(1).filter(r=>R.C.some(c=>c.id===r[0])))]]));
}
window.MG.agendar=function(code,serv,fecha){show("agenda");if(!ST.book)return;if(!pOf(code)){toast("El código "+code+" no está en el libro cargado.");return;}AST.sub="pend";renderMg("agenda");if(needUser())return;openDlg({t:"asig",serv:serv||"",pat:code,fixedPat:true,fDes:fecha||null,q:""});};
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&AST.dlg)closeDlg();});
window.addEventListener("beforeunload",e=>{if(ST.dirty){e.preventDefault();e.returnValue="";}});


/* ---------- Reportes para EPS y normativos ----------
   Res. 1552 de 2013 art. 2 y 3: la EPS mide cada mes, por especialidad y tipo, citas asignadas, días entre solicitud y fecha asignada,
   días entre fecha deseada y fecha asignada, mínimos, máximos y horas-especialista; la IPS le entrega la información de su red.
   Res. 256 de 2016, anexo técnico 2, registro tipo 2: solo citas de primera vez del año por usuario y especialidad, tipos 1 a 9
   (medicina general, odontología, medicina interna, pediatría, ginecología, obstetricia, cirugía general, ecografía, resonancia).
   Nefrología no está entre esos tipos. Res. 2117 de 2025 (MGTE): tiempo de espera = de la solicitud a la fecha en que el paciente recibe el servicio. */
const REP_DEF={ips:"",hab:"",eaps:{},t256:{"MEDICO EXPERTO":"","MEDICO PROGRAMA":""}};
AST.cfg=(()=>{try{return Object.assign({},REP_DEF,JSON.parse(localStorage.getItem("nefro_rep_cfg")||"{}"));}catch(e){return JSON.parse(JSON.stringify(REP_DEF));}})();
AST.cfg.eaps=AST.cfg.eaps||{};AST.cfg.t256=Object.assign({"MEDICO EXPERTO":"","MEDICO PROGRAMA":""},AST.cfg.t256||{});
const saveCfg=()=>{try{localStorage.setItem("nefro_rep_cfg",JSON.stringify(AST.cfg));}catch(e){}};
{const t=TODAY(),pm=new Date(t.getFullYear(),t.getMonth()-1,1);AST.rmes=pm.getFullYear()+"-"+String(pm.getMonth()+1).padStart(2,"0");AST.rbase="ASIG";AST.reps="";AST.rsem=(t.getMonth()<6?(t.getFullYear()-1)+"-2":t.getFullYear()+"-1");}
const T256=[["","No se reporta"],["1","1 · Medicina general primera vez"],["3","3 · Medicina interna primera vez"]];
const dd=(a,b)=>(a&&b)?NP.days(a,b):null;
const stat=a=>{const v=a.filter(x=>x!=null);if(!v.length)return{n:0,sum:"",prom:"",min:"",max:""};const s=v.reduce((x,y)=>x+y,0);return{n:v.length,sum:s,prom:Math.round(s/v.length*10)/10,min:Math.min(...v),max:Math.max(...v)};};
const tipoGrp=c=>c.tipo==="PRIMERA VEZ"?"Primera vez":"Control o seguimiento";
/* cadena de reprogramaciones: de la cita original a la que terminó atendida */
function chainEnd(c){const B=ST.book;let x=c,guard=0;while(x&&x.estado!=="ATENDIDA"&&x.reId&&guard++<20)x=B.cit.find(y=>y.id===x.reId);return x&&x.estado==="ATENDIDA"?x:null;}
function repPanel(){
  const C=AST.cfg;const eps=COH.EPS;
  return'<section class="panel"><h3>Reportes para EPS y normativos</h3><div class="repgrid">'+
  '<div class="repbox"><div class="sub-h">Oportunidad mensual · Res. 1552 de 2013</div><p class="note">Por EPS, especialidad y tipo de cita: citas asignadas, días de la solicitud a la fecha asignada y de la fecha deseada a la fecha asignada (suma, promedio, mínimo, máximo), horas de profesional y detalle nominal con los datos del artículo 2. Agrega el tiempo hasta la atención efectiva (Res. 2117 de 2025).</p>'+
   '<div class="row"><label class="f">Mes<input type="month" data-agf="rmes" value="'+esc(AST.rmes)+'"></label><label class="f">Contar citas por<select data-agf="rbase"><option value="ASIG"'+(AST.rbase==="ASIG"?" selected":"")+'>Fecha en que se asignó</option><option value="CITA"'+(AST.rbase==="CITA"?" selected":"")+'>Fecha de la cita</option></select></label></div><label class="f">EPS<select data-agf="reps"><option value="">Todas (hoja por EPS)</option>'+eps.map(e=>'<option'+(AST.reps===e?" selected":"")+'>'+esc(e)+'</option>').join("")+'</select></label><button type="button" class="btn primary" data-x="rep1552">Descargar oportunidad del mes</button></div>'+
  '<div class="repbox"><div class="sub-h">Insumo Res. 256 de 2016 · registro tipo 2</div><p class="note">Solo citas de primera vez del año por paciente y especialidad, de los servicios que usted asigne a un tipo de cita permitido. Nefrología no está entre los tipos 1 a 9: no se reporta en este registro. Sale en Excel con los campos 0 a 15; el archivo plano para PISIS lo arma quien reporta y debe pasar el validador.</p>'+
   '<div class="row"><label class="f">Semestre<select data-agf="rsem">'+(()=>{const y=TODAY().getFullYear();const o=[];for(let a=y;a>=y-1;a--){o.push(a+"-2",a+"-1");}return o.map(v=>'<option value="'+v+'"'+(AST.rsem===v?" selected":"")+'>'+(v.endsWith("-1")?"Enero a junio ":"Julio a diciembre ")+v.slice(0,4)+'</option>').join("");})()+'</select></label><div></div></div><button type="button" class="btn" data-x="rep256">Descargar insumo del semestre</button></div>'+
  '<div class="repbox"><div class="sub-h">Informe de agenda por EPS</div><p class="note">Con el periodo y filtros de arriba: citas, atendidas, inasistencias y cancelaciones por responsable, barreras atribuibles a la EPS en lista nominal, oportunidad y pacientes activos sin cita con control vencido.</p><button type="button" class="btn" data-x="repeps">Descargar informe por EPS</button></div></div>'+
  '<details class="hist"><summary>Códigos para los reportes (se guardan en este navegador)</summary><div class="pacform" style="margin-top:10px"><div class="row"><label class="f">Nombre de la IPS<input type="text" data-cfg="ips" value="'+esc(C.ips)+'"></label><label class="f">Código de habilitación (REPS)<input type="text" data-cfg="hab" value="'+esc(C.hab)+'"></label></div>'+
   '<div class="row3">'+eps.map(e=>'<label class="f">Código EAPB · '+esc(epsShort(e))+'<input type="text" data-cfg="eap|'+esc(e)+'" value="'+esc(C.eaps[e]||"")+'"></label>').join("")+'</div>'+
   '<div class="row">'+["MEDICO EXPERTO","MEDICO PROGRAMA"].map(sv=>'<label class="f">Res. 256 · '+esc(AG_SN(sv))+'<select data-cfg="t256|'+sv+'">'+T256.map(([v,l])=>'<option value="'+v+'"'+(C.t256[sv]===v?" selected":"")+'>'+l+'</option>').join("")+'</select></label>').join("")+'</div>'+
   '<p class="note" style="margin:0">Escriba los códigos tal como aparecen en el REPS y en la tabla de EAPB del Ministerio; la herramienta no los trae precargados para no inventarlos. El médico experto se asigna a «medicina general» solo si la consulta se factura con CUPS de medicina general de primera vez: confírmelo con facturación.</p></div></details></section>';
}
function rep1552(){
  const B=ST.book;const[y,m]=(AST.rmes||"").split("-").map(Number);if(!y){toast("Elija el mes.");return;}
  const de=new Date(y,m-1,1),ha=new Date(y,m,0);const inM=d=>d&&d>=de&&d<=ha;
  const base=c=>AST.rbase==="CITA"?c.fecha:c.fAsig;
  const C=B.cit.filter(c=>c.origen!=="REGISTRO POSTERIOR"&&c.serv!=="TOMA DE MUESTRAS"&&c.serv!=="VACUNACION"&&inM(base(c))&&(!AST.reps||(pOf(c.c)||{}).eps===AST.reps));
  const head=["EPS","Especialidad o servicio","Tipo de cita","Citas asignadas","Suma días solicitud → fecha asignada","Promedio días (solicitud)","Mínimo","Máximo","Suma días deseada → fecha asignada","Promedio días (deseada)","Mínimo","Máximo","Citas sin fecha de solicitud","Citas sin fecha deseada"];
  const grp={};C.forEach(c=>{const e=(pOf(c.c)||{}).eps||"Sin EPS";const k=e+"|"+c.serv+"|"+tipoGrp(c);(grp[k]=grp[k]||{e,sv:c.serv,t:tipoGrp(c),L:[]}).L.push(c);});
  const rows=Object.values(grp).sort((a,b)=>a.e.localeCompare(b.e)||AG_SN(a.sv).localeCompare(AG_SN(b.sv))||a.t.localeCompare(b.t)).map(g=>{const s1=stat(g.L.map(c=>dd(c.fSol,c.fecha))),s2=stat(g.L.map(c=>dd(c.fDes,c.fecha)));
    return[g.e,AG_SN(g.sv),g.t,g.L.length,s1.sum,s1.prom,s1.min,s1.max,s2.sum,s2.prom,s2.min,s2.max,g.L.filter(c=>!c.fSol).length,g.L.filter(c=>!c.fDes).length];});
  const J=B.jor.filter(j=>j.estado!=="CANCELADA"&&j.fecha>=de&&j.fecha<=ha);const hr={};J.forEach(j=>{const h=(hm2m(j.hFin)-hm2m(j.hIni))/60;(hr[j.serv]=hr[j.serv]||{n:0,h:0,c:0,pr:new Set()});hr[j.serv].n++;hr[j.serv].h+=h;hr[j.serv].c+=agSlots(j).length*j.nAg;if(j.prof)hr[j.serv].pr.add(j.prof);});
  const hrs=[["Especialidad o servicio","Jornadas","Horas de profesional disponibles","Cupos ofertados","Profesionales"]].concat(Object.entries(hr).map(([k,v])=>[AG_SN(k),v.n,Math.round(v.h*10)/10,v.c,[...v.pr].join("; ")]));
  const det=[["EPS","Código EAPB","Tipo doc.","Documento","Nombre","Teléfono 1","Teléfono 2","Municipio","IPS","Código habilitación","Especialidad o servicio","Tipo de cita","ID cita","Fecha de solicitud","Fecha deseada","Fecha asignada (fecha de la cita)","Fecha en que se asignó","Días solicitud → asignada","Días deseada → asignada","Estado","Origen"]];
  C.slice().sort((a,b)=>a.fecha-b.fecha).forEach(c=>{const p=pOf(c.c)||{};det.push([p.eps,AST.cfg.eaps[p.eps]||"",p.tipodoc,p.doc,p.nombre,p.tel,p.tel2,p.municipio,AST.cfg.ips,AST.cfg.hab,AG_SN(c.serv),tipoGrp(c),c.id,c.fSol?fd(c.fSol):"",c.fDes?fd(c.fDes):"",fd(c.fecha),c.fAsig?fd(c.fAsig):"",dd(c.fSol,c.fecha)??"",dd(c.fDes,c.fecha)??"",AG_EST[c.estado],c.origen]);});
  const orig=C.filter(c=>!c.deId);const mg=[["EPS","Especialidad o servicio","Citas originales","Terminaron atendidas","Mediana días solicitud → atención","Promedio","Pendientes de atención (inasistieron o cancelaron sin cita atendida después)"]];
  const g2={};orig.forEach(c=>{const e=(pOf(c.c)||{}).eps||"Sin EPS";const k=e+"|"+c.serv;(g2[k]=g2[k]||{e,sv:c.serv,L:[]}).L.push(c);});
  Object.values(g2).forEach(g=>{const v=g.L.map(c=>{const f=chainEnd(c);return f&&c.fSol?NP.days(c.fSol,f.fecha):null;}).filter(x=>x!=null);const s=stat(v);mg.push([g.e,AG_SN(g.sv),g.L.length,v.length,med(v)??"",s.prom,g.L.filter(c=>!chainEnd(c)&&c.fecha<TODAY()).length]);});
  const notas=[["Nota"],["Periodo: "+fd(de)+" a "+fd(ha)+". Citas contadas por "+(AST.rbase==="CITA"?"fecha de la cita.":"fecha en que se asignó (Res. 1552 de 2013, art. 3: citas asignadas en el mes).")],
    ["Fecha asignada = fecha para la cual se asigna la cita (Res. 1552 de 2013, art. 2, numeral iv). Días calendario."],
    ["Días deseada → asignada puede ser negativo cuando la cita quedó antes de la fecha deseada o de la fecha límite del plan; se informa tal cual. Defina con cada EPS si lo quiere truncado en cero."],
    ["Solo consultas: se excluyen toma de muestras y vacunación, que no son citas de consulta."],
    ["Se excluyen los registros posteriores (citas pasadas a la herramienta después, por contingencia) porque su fecha de solicitud no es confiable."],
    ["Tiempo hasta atención efectiva: de la solicitud de la cita original a la fecha de la cita que terminó atendida, siguiendo las reprogramaciones (Res. 2117 de 2025, definición de tiempo de espera). Nefrología no está entre los servicios priorizados de la fase I (Circular 038 de 2025)."],
    ["La obligación de medir y publicar es de la EPS; la IPS le entrega la información de su red. Verifique el formato que pide cada EPS: este archivo trae los datos, no el formato de cada una."],
    ["Datos ficticios: "+(ST.demo?"SÍ. No son resultados del programa.":"no")]];
  const sheets=[["Resumen Res. 1552",[head].concat(rows)],["Horas profesional",hrs],["Detalle nominal",det],["Hasta atención (MGTE)",mg],["Notas",notas]];
  if(!AST.reps)COH.EPS.forEach(e=>{const r=rows.filter(x=>x[0]===e);if(r.length)sheets.push([epsShort(e)+" resumen",[head].concat(r)]);});
  saveXlsx("Oportunidad_Res1552_"+AST.rmes+(AST.reps?"_"+epsShort(AST.reps).replace(/\s+/g,""):"")+".xlsx",sheets);
}
const up=s=>String(s==null?"":s).normalize("NFD").replace(/[̀-ͯ]/g,"").toUpperCase().replace(/[^A-Z0-9 ]/g,"").trim();
function rep256(){
  const B=ST.book;const[y,sm]=AST.rsem.split("-").map(Number);const de=new Date(y,sm===1?0:6,1),ha=new Date(y,sm===1?6:12,0);
  const map=AST.cfg.t256;const svs=Object.keys(map).filter(k=>map[k]);
  const notas=[["Nota"],["Semestre "+fd(de)+" a "+fd(ha)+". Res. 256 de 2016, anexo técnico 2, registro tipo 2: una cita de primera vez en el año por usuario y especialidad (ecografía y resonancia: todas)."],
    ["Tipos de cita permitidos en el campo 11: 1 medicina general, 2 odontología general, 3 medicina interna, 4 pediatría, 5 ginecología, 6 obstetricia, 7 cirugía general, 8 ecografía, 9 resonancia. Nefrología no está; sus citas no van en este registro."],
    ["Servicios asignados: "+(svs.length?svs.map(k=>AG_SN(k)+" → tipo "+map[k]).join("; "):"ninguno. Asigne un tipo en «Códigos para los reportes» si alguna consulta del programa se factura como medicina general o interna de primera vez.")],
    ["Sexo: H hombre, M mujer (convención del anexo; no es la misma letra que usa el libro). Nombres y apellidos en mayúsculas, sin tildes ni caracteres especiales."],
    ["El libro solo tiene nombre completo: los campos 6 a 9 salen vacíos salvo que la hoja Pacientes tenga columnas Primer apellido, Segundo apellido, Primer nombre y Segundo nombre."],
    ["Esto es insumo. El registro tipo 1 (control), el nombre del archivo y la carga en PISIS los hace quien reporta, y el archivo debe pasar el validador del Ministerio."]];
  const reg=[["0 Tipo de registro","1 Consecutivo","2 Tipo de identificación","3 Número de identificación","4 Fecha de nacimiento","5 Sexo","6 Primer apellido","7 Segundo apellido","8 Primer nombre","9 Segundo nombre","10 Código EAPB","11 Tipo de cita","12 Fecha de solicitud","13 La cita fue asignada","14 Fecha de asignación de la cita","15 Fecha deseada"]];
  const pend=[["Consecutivo","Código paciente","Falta o error"]];
  const isoD=d=>d?iso(d):"";const TD=["RC","TI","CC","CE","PA","CD"];
  if(svs.length){const seen={};
    B.cit.filter(c=>svs.includes(c.serv)&&c.tipo==="PRIMERA VEZ"&&c.origen!=="REGISTRO POSTERIOR").sort((a,b)=>(a.fSol||a.fecha)-(b.fSol||b.fecha)).forEach(c=>{
      const k=c.c+"|"+map[c.serv]+"|"+(c.fSol||c.fecha).getFullYear();if(seen[k])return;seen[k]=1;
      const fs=c.fSol||c.fecha;if(fs<de||fs>ha)return;
      const p=pOf(c.c)||{};const n=reg.length;const miss=[];
      const td=up(p.tipodoc);if(!TD.includes(td))miss.push("tipo de documento «"+(p.tipodoc||"vacío")+"» no admitido (RC, TI, CC, CE, PA, CD)");
      if(!p.doc)miss.push("documento");if(!p.fnac)miss.push("fecha de nacimiento");if(!p.sexo)miss.push("sexo");
      const ap1=up(p.ap1),n1=up(p.n1);if(!ap1||!n1)miss.push("nombres y apellidos separados");
      const eap=AST.cfg.eaps[p.eps]||"";if(!eap)miss.push("código EAPB de "+(p.eps||"la EPS"));if(!c.fSol)miss.push("fecha de solicitud");if(!c.fDes)miss.push("fecha deseada");
      reg.push([2,n,td,up(p.doc).replace(/\s/g,""),isoD(p.fnac),p.sexo==="M"?"H":p.sexo==="F"?"M":"",ap1,up(p.ap2),n1,up(p.n2),eap,Number(map[c.serv]),isoD(c.fSol),1,isoD(c.fecha),isoD(c.fDes)]);
      if(miss.length)pend.push([n,c.c,miss.join("; ")]);});}
  if(reg.length===1)notas.push(["Sin registros para el semestre con la configuración actual."]);
  saveXlsx("Insumo_Res256_registro2_"+AST.rsem+".xlsx",[["Registro tipo 2",reg],["Por completar",pend],["Notas",notas]]);
}
function repEPS(){
  const R=agCompute();const B=ST.book;const T=TODAY();const per=fd(R.de)+" a "+fd(R.ha);
  const res=[["EPS","Pacientes activos","Pacientes con cita en el periodo","Citas programadas","Atendidas","Inasistencias","Tasa de inasistencia %","Canceladas","Canceladas por paciente","Canceladas por barrera de acceso","Canceladas por EPS","Canceladas por IPS","Inasistencias atribuidas a la EPS","Mediana días solicitud → cita","% dentro de la fecha deseada","Activos sin cita futura y con control médico vencido"]];
  const sheets=[];const barr=[["EPS","Fecha","Servicio","Código","Nombre","Documento","Estado","Motivo","Observaciones"]];
  COH.EPS.forEach(e=>{const C=R.C.filter(c=>(pOf(c.c)||{}).eps===e);const act=ST.snaps.filter(s=>s.p.eps===e);
    const cer=C.filter(c=>CERR.includes(c.estado)),ina=C.filter(c=>c.estado==="INASISTENCIA"),can=C.filter(c=>c.estado==="CANCELADA");const cr=r=>can.filter(c=>c.resp===r).length;
    const op=C.filter(c=>c.fSol&&c.origen!=="REGISTRO POSTERIOR").map(c=>NP.days(c.fSol,c.fecha)).filter(x=>x>=0);const dsk=C.filter(c=>c.fDes&&c.origen!=="REPROGRAMACION"&&c.origen!=="REGISTRO POSTERIOR");
    const venc=act.filter(s=>!activeFut(s.p.codigo).length&&s.items.some(i=>i.grp==="Médico"&&(!i.due||i.due<T)));
    res.push([e,act.length,new Set(C.map(c=>c.c)).size,C.length,C.filter(c=>c.estado==="ATENDIDA").length,ina.length,cer.length?Math.round(ina.length/cer.length*1000)/10:"",can.length,cr("PACIENTE"),cr("ACCESO"),cr("EPS"),cr("IPS"),ina.filter(c=>c.resp==="EPS").length,med(op)??"",dsk.length?Math.round(dsk.filter(c=>c.fecha<=c.fDes).length/dsk.length*1000)/10:"",venc.length]);
    C.filter(c=>c.resp==="EPS").forEach(c=>{const p=pOf(c.c)||{};barr.push([e,fd(c.fecha),AG_SN(c.serv),c.c,p.nombre,p.doc,AG_EST[c.estado],c.motivo,c.obs]);});
    const nom=[["Fecha","Hora","Servicio","Tipo","Código","Nombre","Documento","Teléfono","Estado","Responsable","Motivo","Fecha solicitud","Fecha deseada","Días solicitud → cita","Reprogramada en"]];
    C.slice().sort((a,b)=>a.fecha-b.fecha).forEach(c=>{const p=pOf(c.c)||{};nom.push([fd(c.fecha),c.hora,AG_SN(c.serv),c.tipo,c.c,p.nombre,p.doc,p.tel,AG_EST[c.estado],AG_RESP[c.resp]||c.resp,c.motivo,c.fSol?fd(c.fSol):"",c.fDes?fd(c.fDes):"",dd(c.fSol,c.fecha)??"",c.reId]);});
    const vn=[["Código","Nombre","Documento","Teléfono","Grupo","Control médico","Fecha límite"]];venc.forEach(s=>{const it=s.items.find(i=>i.grp==="Médico"&&(!i.due||i.due<T));vn.push([s.p.codigo,s.p.nombre,s.p.doc,s.p.tel,s.c.grupo||"",it.nombre,it.due?fd(it.due):"sin registro"]);});
    if(C.length||venc.length){sheets.push([epsShort(e)+" citas",nom]);sheets.push([epsShort(e)+" sin cita",vn]);}});
  const notas=[["Nota"],["Periodo: "+per+(AST.serv?" · servicio "+AG_SN(AST.serv):"")+". Pacientes activos y vencidos calculados al corte "+fd(ST.corte)+"."],["Definiciones en la hoja de definiciones del informe de asistencia. Inasistencia: no llegó sin avisar antes de la hora de la cita."],["Datos ficticios: "+(ST.demo?"SÍ":"no")]];
  saveXlsx("Informe_agenda_por_EPS_"+iso(R.de)+"_"+iso(R.ha)+".xlsx",[["Resumen por EPS",res],["Barreras atribuidas a EPS",barr]].concat(sheets,[["Notas",notas]]));
}

/* ---------- navegación ---------- */
const VIEWS=["calc","pac","agenda","coh","ind","aud","nom","cal","ref"];
function show(v){VIEWS.forEach(x=>{const b=document.querySelector('[data-v="'+x+'"]');if(b)b.setAttribute("aria-selected",x===v?"true":"false");const el=$("view-"+x);if(el)el.hidden=x!==v;});$("bookbar").hidden=v==="ref";document.querySelector(".filters").hidden=v==="calc"||v==="pac"||v==="agenda";if(v!=="calc"&&v!=="ref")renderMg(v);}
document.querySelectorAll("[data-v]").forEach(b=>b.addEventListener("click",()=>show(b.dataset.v)));

/* ---------- carga ---------- */
$("corte").value=iso(new Date());
const nm=new Date();nm.setDate(1);nm.setMonth(nm.getMonth()+1);$("mes").value=nm.getFullYear()+"-"+String(nm.getMonth()+1).padStart(2,"0");
$("bookfile").addEventListener("change",e=>{const f=e.target.files[0];if(!f)return;
  if(typeof XLSX==="undefined"){$("bookinfo").textContent="No se pudo cargar el lector de Excel.";return;}
  if(ST.dirty){guardDirty("cargar «"+f.name+"»",()=>readBook(f));e.target.value="";return;}
  readBook(f);e.target.value="";});
function readBook(f){
  const rd=new FileReader();rd.onload=async ev=>{try{const u8=new Uint8Array(ev.target.result);const wb=XLSX.read(u8,{type:"array",cellDates:false});ST.wbBuf=ST.db?null:u8.slice();
    if(ST.db){$("bookinfo").textContent="Importando a la base de datos…";const r=await importToDb(wb);toast("Importado: "+r.pacientes+" pacientes, "+r.laboratorios+" laboratorios, "+r.valoraciones+" valoraciones, "+r.atenciones+" atenciones, "+r.novedades+" novedades.");}
    else{rawInit(wb);setBook(COH.parse(wb),f.name,false,false);}}catch(err){$("bookinfo").textContent="No se pudo procesar el archivo: "+err.message;}};rd.readAsArrayBuffer(f);}
function guardDirty(what,go){const bi=$("bookinfo");
  bi.innerHTML='<span class="alert warn" style="display:inline-flex;flex-wrap:wrap;gap:8px;align-items:center"><span>El libro tiene cambios sin descargar. Si continúa con '+esc(what)+' se pierden.</span><button type="button" class="btn" id="gd_dl">Descargar primero</button><button type="button" class="btn primary" id="gd_go">Descartar y continuar</button><button type="button" class="btn" id="gd_no">Cancelar</button></span>';
  $("gd_dl").onclick=()=>{agExportBook();};$("gd_go").onclick=()=>{ST.dirty=false;go();};$("gd_no").onclick=()=>{bookInfo();};}
$("bookdemo").addEventListener("click",()=>{if(typeof XLSX==="undefined"){$("bookinfo").textContent="No se pudo cargar el lector de Excel.";return;}if(ST.dirty){guardDirty("los datos ficticios",()=>loadDemo(true));return;}loadDemo(true);});
function loadDemo(big){const wb=big?demoBig():demoWorkbook();ST.wbBuf=new Uint8Array(XLSX.write(wb,{type:"array",bookType:"xlsx"}));rawInit(wb);setBook(COH.parse(wb),big?"Datos ficticios · 100 pacientes por EPS":"Datos ficticios de demostración (10 pacientes)",true,false);}
window.MG.loadDemo=loadDemo;
$("bookexp").addEventListener("click",()=>agExportBook());
["corte","f_eps","f_grp","mes"].forEach(id=>$(id).addEventListener("change",()=>{ST.trend=null;compute();const v=VIEWS.find(x=>!$("view-"+x).hidden);if(v&&v!=="calc"&&v!=="ref")renderMg(v);}));
function setBook(B,name,demo,db){
  ST.book=B;ST.name=name;ST.demo=demo;ST.db=!!db;ST.trend=null;ST.dirty=false;AST.dlg=null;
  bookInfo();
  $("booklabel").textContent=db?"Importar libro de Excel a la base":"Cargar libro de Excel";
  compute();fillPick();
  const v=VIEWS.find(x=>!$("view-"+x).hidden);if(v&&v!=="calc"&&v!=="ref")renderMg(v);
  if(window.APP&&$("view-calc")&&!$("view-calc").hidden){const e=new Event("input");$("frm").dispatchEvent(e);}
}
function compute(){if(!ST.book)return;const corte=pdate($("corte").value)||new Date();ST.corte=corte;ST.snaps=ST.book.pac.filter(p=>p.estado==="ACTIVO").map(p=>COH.snapshot(p,ST.book,corte));ST.pmap={};ST.book.pac.forEach(p=>ST.pmap[p.codigo]=p);ST.smap={};ST.snaps.forEach(x=>ST.smap[x.p.codigo]=x);}
function bookInfo(){const B=ST.book;if(!B)return;const act=B.pac.filter(p=>p.estado==="ACTIVO").length;
  $("bookinfo").innerHTML=(ST.db?'<span class="exflag" style="color:var(--ok);border-color:var(--ok)">Base de datos</span> ':'')+(ST.demo?'<span class="exflag">Ficticio</span> ':'')+esc(ST.name)+' · '+act+' activos de '+B.pac.length+' · '+B.lab.length+' laboratorios · '+B.val.length+' valoraciones · '+B.at.length+' atenciones · '+B.cit.length+' citas'+(B.missing.length?' · <span style="color:var(--bad)">faltan hojas: '+esc(B.missing.join(", "))+'</span>':'')+(ST.dirty?' · <strong style="color:var(--warn)">libro con cambios sin descargar</strong>':'');
  const bx=$("bookexp");bx.hidden=false;bx.textContent=ST.db?"Descargar hojas de agenda":"Descargar libro actualizado";}
function snapshotFor(codigo,fecha){const p=ST.book&&ST.book.pac.find(x=>x.codigo===codigo);return p?COH.snapshot(p,ST.book,fecha||new Date(),{formOnly:true}):null;}
function epsSel(){return $("f_eps").value;}
function filtered(){const e=epsSel(),g=$("f_grp").value;return ST.snaps.filter(s=>(!e||(e==="sin"?!s.p.eps:s.p.eps===e))&&(!g||String(s.c.grupo||"")===g));}
function fillPick(){const sel=$("pick");if(!sel)return;const B=ST.book;$("pickbox").hidden=!B;if(!B)return;sel.innerHTML='<option value="">Seleccione un paciente…</option>'+B.pac.filter(p=>p.estado==="ACTIVO").sort((a,b)=>a.codigo.localeCompare(b.codigo)).map(p=>'<option value="'+esc(p.codigo)+'">'+esc(p.codigo+" · "+(p.nombre||"")+" · "+(p.eps||"sin EPS"))+'</option>').join("");}

/* ---------- utilidades ---------- */
const empty=()=>'<div class="panel empty"><p style="font-size:16px;color:var(--ink);margin:0 0 6px"><strong>Cargue el libro de Excel del programa o conéctese a la base de datos.</strong></p><p style="margin:0">Desde el servidor del programa la conexión es automática. Para conocer la herramienta use «Ver con datos ficticios».</p></div>';
const pname=s=>'<strong>'+esc(s.p.codigo)+'</strong>'+(s.p.nombre?'<span class="sub">'+esc(s.p.nombre)+'</span>':'');
const contact=s=>{const t=[s.p.tel,s.p.tel2].filter(Boolean).join(" · ");return'<span class="mono">'+esc(t||"—")+'</span>'+(s.p.acud||s.p.acudTel?'<span class="sub">'+esc((s.p.acud||"Acudiente")+(s.p.acudTel?": "+s.p.acudTel:""))+'</span>':'')+(s.p.dir||s.p.municipio?'<span class="sub">'+esc([s.p.dir,s.p.municipio].filter(Boolean).join(", "))+'</span>':'');};
const grpTag=s=>s.c.grupo?'<span class="tag g'+s.c.grupo+'">Grupo '+s.c.grupo+'</span>':'<span class="tag">—</span>';
const stage=s=>(s.c.G||"—")+(s.c.A?" "+s.c.A:"");
const epsShort=e=>e==="EPS Familiar de Colombia"?"EPS Familiar":e||"Sin EPS";
function status(it,from,to){if(!it.due)return"sinreg";if(it.due<ST.corte)return"venc";if(it.due<=to)return"mes";return"vig";}
async function saveXlsx(name,sheets){
  const wb=XLSX.utils.book_new();sheets.forEach(([sn,aoa])=>{const ws=XLSX.utils.aoa_to_sheet(aoa);ws["!cols"]=(aoa[0]||[]).map((h,i)=>({wch:Math.min(48,Math.max(10,...aoa.slice(0,60).map(r=>String(r[i]==null?"":r[i]).length)))}));XLSX.utils.book_append_sheet(wb,ws,sn.slice(0,31));});
  return saveWb(wb,name);}
async function saveWb(wb,name){
  const buf=XLSX.write(wb,{type:"array",bookType:"xlsx"});const blob=new Blob([buf],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"});
  if(DL){try{await DL.save({filename:name,data:blob});toast("Archivo listo: "+name);}catch(e){toast(e&&e.code==="declined"?"Descarga cancelada.":"No se pudo descargar ("+(e&&e.code||"error")+").");}return;}
  try{const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();toast("Descarga iniciada: "+name);}catch(e){toast("Este visor no permite descargas.");}
}
function toast(t){const el=$("toast");el.textContent=t;el.hidden=false;clearTimeout(toast._t);toast._t=setTimeout(()=>{el.hidden=true;},5000);}
function head(title,sub,btns){return'<div class="mhead"><div><h2 class="mt">'+title+'</h2>'+(sub?'<p class="note" style="margin:2px 0 0">'+sub+'</p>':'')+'</div><div class="copyrow">'+(btns||"")+'</div></div>';}
const tile=(l,v,cls)=>'<div class="tile '+cls+'"><span class="tv">'+v+'</span><span class="tl">'+esc(l)+'</span></div>';
const EXPORTS={};
function renderMg(v){if(v==="mes"||v==="venc"||v==="alert"){ST.cohSub=v==="mes"?"ges":v;if(v==="mes")ST.gesSub="prox";v="coh";}const out=$("out-"+v);if(!ST.book&&v!=="pac"){out.innerHTML=empty();return;}
  ({pac:rPac,agenda:rAgenda,coh:rCohMain,ind:rInd,aud:rAud,nom:rNom,cal:rCal})[v](out);
  out.querySelectorAll("[data-x]").forEach(b=>b.addEventListener("click",()=>EXPORTS[b.dataset.x]&&EXPORTS[b.dataset.x]()));
  out.querySelectorAll("[data-ind]").forEach(b=>b.addEventListener("click",()=>{ST.indSel=b.dataset.ind;renderMg("ind");const t=$("inddetail");if(t)t.scrollIntoView({block:"start"});}));
  out.querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",e=>{e.stopPropagation();openPatient(b.dataset.open);}));
  out.querySelectorAll("[data-epsf]").forEach(b=>b.addEventListener("click",()=>{$("f_eps").value=b.dataset.epsf;ST.trend=null;renderMg(v);}));
}
function openPatient(codigo){show("calc");const sel=$("pick");sel.value=codigo;sel.dispatchEvent(new Event("change"));window.scrollTo(0,0);}
const openBtn=s=>'<button type="button" class="lnk" data-open="'+esc(s.p.codigo)+'">Valorar</button>';
const epsSeg=()=>'<div class="seg epsseg" role="group" aria-label="EPS">'+[["","Todas"]].concat(COH.EPS.map(e=>[e,epsShort(e)])).map(([v,l])=>'<button type="button" data-epsf="'+esc(v)+'" aria-pressed="'+(epsSel()===v)+'">'+esc(l)+'</button>').join("")+'</div>';

/* ---------- Cohorte ---------- */
function rCoh(out){
  const S=filtered(),corte=ST.corte,y=corte.getFullYear(),m=corte.getMonth();
  const all=ST.book.pac;
  const by=(f)=>{const o={};S.forEach(s=>{const k=f(s);o[k]=(o[k]||0)+1;});return o;};
  const epsC=by(s=>s.p.eps||"sin"),erc=by(s=>s.c.erc);
  let h=head("Cohorte activa","Corte "+fd(corte)+". Filtros de EPS y grupo aplicados.");
  h+='<div class="tiles">'+tile("Activos",S.length,"")+COH.EPS.map(e=>tile(epsShort(e),epsC[e]||0,"")).join("")+tile("ERC confirmada",erc.si||0,"")+tile("Por confirmar",erc.prov||0,erc.prov?"warn":"")+tile("Sin definir",(erc.indet||0),erc.indet?"warn":"")+'</div>';
  h+='<div class="two"><section class="panel"><h3>Grupo del programa por EPS</h3><div class="tablebox"><table><thead><tr><th>Grupo</th>'+COH.EPS.map(e=>'<th>'+epsShort(e)+'</th>').join("")+'<th>Total</th></tr></thead><tbody>';
  [1,2,3,0].forEach(g=>{const row=S.filter(s=>(s.c.grupo||0)===g);if(!row.length&&g===0)return;h+='<tr><td>'+(g?NP.GRUPO[g]:"Sin TFGe")+'</td>'+COH.EPS.map(e=>'<td class="mono">'+row.filter(s=>s.p.eps===e).length+'</td>').join("")+'<td class="mono"><strong>'+row.length+'</strong></td></tr>';});
  h+='</tbody></table></div></section>';
  const GS=["G1","G2","G3a","G3b","G4","G5"],AS=["A1","A2","A3",null];
  const RISKC={G1:["low","mod","high"],G2:["low","mod","high"],G3a:["mod","high","vhigh"],G3b:["high","vhigh","vhigh"],G4:["vhigh","vhigh","vhigh"],G5:["vhigh","vhigh","vhigh"]};
  h+='<section class="panel"><h3>Matriz KDIGO de la cohorte</h3><div class="tablebox"><table class="gxa"><thead><tr><th></th><th>A1</th><th>A2</th><th>A3</th><th>Sin RAC</th></tr></thead><tbody>';
  GS.forEach(g=>{h+='<tr><th>'+g+'</th>'+AS.map((a,i)=>{const n=S.filter(s=>s.c.G===g&&s.c.A===a).length;return'<td class="mono '+(a?'k-'+RISKC[g][i]:'')+'">'+(n||"")+'</td>';}).join("")+'</tr>';});
  h+='</tbody></table></div><p class="note" style="margin:8px 0 0">Color: riesgo KDIGO (verde bajo, amarillo moderado, naranja alto, rojo muy alto).</p></section></div>';
  const inMonth=d=>d&&d.getFullYear()===y&&d.getMonth()===m;
  const ing=all.filter(p=>inMonth(p.fing)),nov=ST.book.nov.filter(n=>inMonth(n.fecha));
  const noAct={};all.filter(p=>p.estado!=="ACTIVO").forEach(p=>{noAct[p.estado]=(noAct[p.estado]||0)+1;});
  h+='<section class="panel"><h3>Movimientos del mes de corte</h3><p style="margin:0 0 8px">Ingresos: <strong>'+ing.length+'</strong>'+(ing.length?' ('+ing.map(p=>esc(p.codigo)).join(", ")+')':'')+'. Fuera de seguimiento activo: '+(Object.keys(noAct).length?Object.entries(noAct).map(([k,v])=>esc(k.toLowerCase())+' '+v).join(", "):'ninguno')+'.</p>';
  h+=nov.length?'<div class="tablebox"><table><thead><tr><th>Fecha</th><th>Paciente</th><th>Novedad</th><th>Detalle</th></tr></thead><tbody>'+nov.map(n=>'<tr><td class="mono">'+fd(n.fecha)+'</td><td>'+esc(n.c)+'</td><td>'+esc(n.tipo.toLowerCase())+'</td><td>'+esc(n.det)+'</td></tr>').join("")+'</tbody></table></div>':'<p class="note" style="margin:0">Sin novedades registradas en el mes.</p>';
  h+='</section>';
  h+='<details class="panel"><summary>Listado de pacientes activos ('+S.length+')</summary><div class="tablebox"><table><thead><tr><th>Paciente</th><th>EPS</th><th>Contacto</th><th>Grupo</th><th>Estadio</th><th>TFGe</th><th>Última valoración</th><th>Próximo control</th><th></th></tr></thead><tbody>'+
    S.slice().sort((a,b)=>(b.c.grupo||0)-(a.c.grupo||0)).map(s=>{const ctl=s.items.find(i=>i.grp==="Médico");return'<tr><td>'+pname(s)+'</td><td>'+esc(epsShort(s.p.eps))+'</td><td>'+contact(s)+'</td><td>'+grpTag(s)+'</td><td class="mono">'+stage(s)+'</td><td class="mono">'+(s.d.tfg!=null?Math.round(s.d.tfg):"—")+'</td><td class="mono">'+(s.lv?fd(s.lv.fecha):"—")+'</td><td class="mono">'+(ctl&&ctl.due?fd(ctl.due):"Sin registro")+'</td><td>'+openBtn(s)+'</td></tr>';}).join("")+'</tbody></table></div></details>';
  out.innerHTML=h;
}

/* ---------- Próximo mes ---------- */
function monthRange(){const[y,m]=$("mes").value.split("-").map(Number);return[new Date(y,m-1,1),new Date(y,m,0)];}
function modelPanel(){
  const rowsH=COH.EPS.map(e=>{const M=window.EPSMODEL[e]||{};const id=e.replace(/\W+/g,"_");
    return'<tr data-eps="'+esc(e)+'"><td><strong>'+esc(epsShort(e))+'</strong>'+(M.vigente?'<span class="sub">vigente desde '+esc(String(M.vigente))+'</span>':'')+'</td>'+
    '<td><select data-f="inter"><option value="NINGUNO"'+(M.inter!=="MEDICO EXPERTO"?" selected":"")+'>Ninguno</option><option value="MEDICO EXPERTO"'+(M.inter==="MEDICO EXPERTO"?" selected":"")+'>Médico experto</option></select></td>'+
    '<td><select data-f="interMeses">'+[1,2,3].map(n=>'<option'+((M.interMeses||1)===n?" selected":"")+'>'+n+'</option>').join("")+'</select></td>'+
    '<td><select data-f="ajustePor">'+[["MEDICO DEL PROGRAMA","Médico del programa"],["MEDICO EXPERTO","Médico experto"],["NEFROLOGIA","Nefrología"]].map(([v,l])=>'<option value="'+v+'"'+(M.ajustePor===v?" selected":"")+'>'+l+'</option>').join("")+'</select></td>'+
    '<td><select data-f="multi"><option value="PROGRAMA"'+(M.multi!=="PAQUETE"?" selected":"")+'>Según programa</option><option value="PAQUETE"'+(M.multi==="PAQUETE"?" selected":"")+'>Paquete: mismo día de nefrología</option></select></td>'+
    '<td><input type="checkbox" data-f="meds"'+(M.meds?" checked":"")+' aria-label="Medicamentos contratados"></td></tr>';}).join("");
  return'<details class="panel" id="modelbox"><summary>Modelo de atención por EPS</summary><p class="note">Define quién atiende entre valoraciones de nefrología y cómo se programa el equipo multidisciplinario. EPS Familiar: médico experto cada mes que no hay nefrología, para formulación de medicamentos contratados. Nueva EPS: paquete con nefrología y equipo multidisciplinario, con frecuencias según el riesgo (CAC/GPC) y agendado el mismo día de nefrología.</p><div class="tablebox"><table class="modelt"><thead><tr><th>EPS</th><th>Control intermedio</th><th>Cada (meses)</th><th>Ajuste de metas por</th><th>Equipo multidisciplinario</th><th>Medicamentos contratados</th></tr></thead><tbody>'+rowsH+'</tbody></table></div><div class="copyrow" style="margin-top:10px"><button type="button" class="btn primary" id="modelsave">'+(ST.db?"Guardar en la base de datos":"Aplicar")+'</button><span class="note" id="modelmsg"></span></div></details>';
}
function bindModel(){const b=$("modelsave");if(!b)return;b.addEventListener("click",async()=>{
  const upd={};document.querySelectorAll("#modelbox tr[data-eps]").forEach(tr=>{const e=tr.dataset.eps;const g=f=>tr.querySelector('[data-f="'+f+'"]');upd[e]={inter:g("inter").value,interMeses:Number(g("interMeses").value),ajustePor:g("ajustePor").value,multi:g("multi").value,meds:g("meds").checked};});
  try{
    if(ST.db){for(const e of Object.keys(upd)){const M=upd[e];await apiPost("eps_modelo_atencion",[{eps_id:ST.book.epsIds[e],contacto_intermedio:M.inter,contacto_meses:M.interMeses,ajuste_metas_por:M.ajustePor,multidisciplinario:M.multi,medicamentos_contratados:M.meds}]);}await loadDb();$("modelmsg").textContent="Guardado. Queda versionado con la fecha de hoy.";}
    else{Object.keys(upd).forEach(e=>Object.assign(window.EPSMODEL[e],upd[e]));try{localStorage.setItem("nefro_epsmodel",JSON.stringify(window.EPSMODEL));}catch(x){}compute();renderMg("coh");toast("Modelo aplicado en este navegador.");}
  }catch(err){$("modelmsg").textContent="No se guardó: "+err.message;}
});}
function rMes(out){
  const S=filtered(),[from,to]=monthRange();const mesTxt=from.toLocaleDateString("es-CO",{month:"long",year:"numeric"});
  const labRows=[],atRows=[],cnt={},cntEps={};
  S.forEach(s=>{const l=[],a=[];s.items.forEach(it=>{const st=status(it,from,to);if(st==="vig")return;(it.tipo==="Laboratorio"?l:a).push(Object.assign({st},it));if(it.tipo==="Laboratorio")cnt[it.nombre]=(cnt[it.nombre]||0)+1;});
    if(l.length)labRows.push([s,l]);if(a.length)atRows.push([s,a]);if(l.length||a.length)cntEps[s.p.eps||"Sin EPS"]=(cntEps[s.p.eps||"Sin EPS"]||0)+1;});
  const citOf=(s,it)=>{const sv=itemServ(s,it);return sv?activeFut(s.p.codigo,sv)[0]:null;};
  const chip=(it,s)=>{const ct=citOf(s,it);return'<span class="ch '+(ct?"agd":it.st)+'" title="'+esc(it.why||"")+'">'+esc(it.nombre)+' · '+(it.st==="sinreg"?"sin registro":it.st==="venc"?"vencido "+fd(it.due):fd(it.due))+(ct?' · cita '+fd(ct.fecha)+' '+esc(ct.hora):'')+'</span>';};
  let nAgd=0;[...labRows,...atRows].forEach(([s,l])=>l.forEach(it=>{if(citOf(s,it))nAgd++;}));
  let h=head("Programación de "+mesTxt,"Incluye lo que vence desde hoy hasta el fin del mes y lo ya vencido o sin registro (en rojo). Pase el cursor sobre cada ítem para ver el motivo. El control médico sigue el modelo de atención de cada EPS.",'<button class="btn primary" data-x="agenda">Exportar agenda con contactos</button>');
  h+=epsSeg();
  h+='<div class="tiles">'+tile("Pacientes por contactar",Object.values(cntEps).reduce((a,b)=>a+b,0),"")+Object.entries(cntEps).map(([e,n])=>tile(epsShort(e),n,"")).join("")+tile("Con laboratorios",labRows.length,"")+tile("Con atenciones",atRows.length,"")+tile("Ítems ya con cita",nAgd,"")+'</div>';
  h+=modelPanel();
  h+='<section class="panel"><h3>Laboratorios por solicitar · '+labRows.length+' pacientes</h3><div class="chips" style="margin:0 0 12px">'+Object.entries(cnt).sort((a,b)=>b[1]-a[1]).map(([k,v])=>'<span class="chip">'+esc(k)+' <b>'+v+'</b></span>').join("")+'</div>';
  h+=labRows.length?'<div class="tablebox"><table><thead><tr><th>Paciente</th><th>EPS</th><th>Contacto</th><th>Exámenes</th></tr></thead><tbody>'+labRows.map(([s,l])=>'<tr><td>'+pname(s)+'</td><td>'+esc(epsShort(s.p.eps))+'</td><td>'+contact(s)+'</td><td><div class="chs">'+l.map(it=>chip(it,s)).join("")+'</div></td></tr>').join("")+'</tbody></table></div>':'<p class="note">Nada pendiente en el mes.</p>';
  h+='</section><section class="panel"><h3>Atenciones por agendar · '+atRows.length+' pacientes</h3>';
  h+=atRows.length?'<div class="tablebox"><table><thead><tr><th>Paciente</th><th>EPS</th><th>Contacto</th><th>Atenciones</th><th></th></tr></thead><tbody>'+atRows.map(([s,a])=>'<tr><td>'+pname(s)+'</td><td>'+esc(epsShort(s.p.eps))+'</td><td>'+contact(s)+'</td><td><div class="chs">'+a.map(it=>chip(it,s)).join("")+'</div></td><td>'+openBtn(s)+'</td></tr>').join("")+'</tbody></table></div>':'<p class="note">Nada pendiente en el mes.</p>';
  h+='</section>';
  out.innerHTML=h;bindModel();
  const tag=$("mes").value;
  EXPORTS.agenda=()=>{
    const byP={};labRows.forEach(([s,l])=>{(byP[s.p.codigo]=byP[s.p.codigo]||{s,l:[],a:[]}).l=l;});atRows.forEach(([s,a])=>{(byP[s.p.codigo]=byP[s.p.codigo]||{s,l:[],a:[]}).a=a;});
    const st=x=>({sinreg:"sin registro",venc:"vencido",mes:"vence"})[x.st];
    const ag=[["Código","Nombre","Tipo doc.","Documento","EPS","Teléfono 1","Teléfono 2","Acudiente","Teléfono acudiente","Dirección","Municipio","Grupo","Estadio","Atenciones a agendar","Laboratorios a solicitar","Fecha límite más próxima","Citas asignadas","Gestión de contacto","Observaciones"]];
    Object.values(byP).sort((a,b)=>(a.s.p.eps||"").localeCompare(b.s.p.eps||"")||a.s.p.codigo.localeCompare(b.s.p.codigo)).forEach(({s,l,a})=>{const ds=[...l,...a].map(i=>i.due).filter(Boolean).sort((x,y)=>x-y);
      ag.push([s.p.codigo,s.p.nombre,s.p.tipodoc,s.p.doc,s.p.eps,s.p.tel,s.p.tel2,s.p.acud,s.p.acudTel,s.p.dir,s.p.municipio,s.c.grupo||"",stage(s),a.map(i=>i.nombre+" ("+st(i)+(i.due?" "+fd(i.due):"")+")").join("; "),l.map(i=>i.nombre+" ("+st(i)+(i.due?" "+fd(i.due):"")+")").join("; "),ds.length?fd(ds[0]):"Ahora",activeFut(s.p.codigo).map(c=>AG_SN(c.serv)+" "+fd(c.fecha)+" "+c.hora).join("; "),"",""]);});
    const det=[["Código","Nombre","EPS","Teléfono 1","Teléfono 2","Tipo","Intervención","Estado","Último registro","Fecha límite","Motivo"]];
    [...labRows,...atRows].forEach(([s,l])=>l.forEach(it=>det.push([s.p.codigo,s.p.nombre,s.p.eps,s.p.tel,s.p.tel2,it.tipo,it.nombre,st(it),it.last?fd(it.last):"",it.due?fd(it.due):"",it.why||""])));
    const res=[["EPS","Pacientes a contactar"]];Object.entries(cntEps).forEach(([e,n])=>res.push([e,n]));
    saveXlsx("Agenda_"+tag+(epsSel()?"_"+epsShort(epsSel()).replace(/\s+/g,""):"")+".xlsx",[["Agenda por paciente",ag],["Detalle",det],["Resumen EPS",res]]);};
}

/* ---------- Vencidos ---------- */
function rVenc(out){
  const S=filtered(),corte=ST.corte;const L=[];
  S.forEach(s=>s.items.forEach(it=>{if(!it.due||it.due<corte)L.push({s,it,days:it.due?NP.days(it.due,corte):null});}));
  L.sort((a,b)=>(b.days==null?1e9:b.days)-(a.days==null?1e9:a.days));
  const lost=S.filter(s=>{const ctl=s.items.find(i=>i.grp==="Médico");return!s.lv||(ctl&&ctl.due&&NP.days(ctl.due,corte)>60);});
  const inas=S.filter(s=>s.inas>0);
  let h=head("Vencidos al "+fd(corte),"Actividades cuya fecha límite ya pasó o que nunca se han registrado.",'<button class="btn" data-x="venc">Exportar</button>');
  h+='<div class="tiles">'+tile("Actividades vencidas",L.filter(x=>x.days!=null).length,"bad")+tile("Sin registro",L.filter(x=>x.days==null).length,"warn")+tile("Posible pérdida de seguimiento",lost.length,lost.length?"bad":"")+tile("Con inasistencias (6 meses)",inas.length,inas.length?"warn":"")+'</div>';
  if(lost.length)h+='<section class="panel"><h3>Posible pérdida de seguimiento</h3><p class="note" style="margin:0 0 8px">Sin valoración registrada, o control médico vencido hace más de 60 días.</p><div class="tablebox"><table><thead><tr><th>Paciente</th><th>EPS</th><th>Contacto</th><th>Grupo</th><th>Última valoración</th><th></th></tr></thead><tbody>'+lost.map(s=>'<tr><td>'+pname(s)+'</td><td>'+esc(epsShort(s.p.eps))+'</td><td>'+contact(s)+'</td><td>'+grpTag(s)+'</td><td class="mono">'+(s.lv?fd(s.lv.fecha):"Nunca")+'</td><td>'+openBtn(s)+'</td></tr>').join("")+'</tbody></table></div></section>';
  h+='<details class="panel"><summary>Detalle de vencidos ('+L.length+')</summary>'+(L.length?'<div class="tablebox"><table><thead><tr><th>Paciente</th><th>EPS</th><th>Intervención</th><th>Último registro</th><th>Fecha límite</th><th>Atraso</th></tr></thead><tbody>'+L.slice(0,600).map(x=>'<tr><td>'+pname(x.s)+'</td><td>'+esc(epsShort(x.s.p.eps))+'</td><td>'+esc(x.it.nombre)+'<span class="sub">'+esc(x.it.why||"")+'</span></td><td class="mono">'+(x.it.last?fd(x.it.last):"—")+'</td><td class="mono">'+(x.it.due?fd(x.it.due):"—")+'</td><td class="mono" style="color:var(--bad)">'+(x.days==null?"sin registro":x.days+" d")+'</td></tr>').join("")+'</tbody></table></div>'+(L.length>600?'<p class="note">Se muestran 600; la exportación incluye todos.</p>':''):'<p class="note">Sin vencidos.</p>')+'</details>';
  if(inas.length)h+='<section class="panel"><h3>Inasistencias en los últimos 6 meses</h3><p class="note" style="margin:0 0 8px">El detalle, los motivos y la reprogramación se gestionan en Agenda.</p><div class="tablebox"><table><thead><tr><th>Paciente</th><th>EPS</th><th>Contacto</th><th>Grupo</th><th>Inasistencias</th><th>Última</th><th>Nueva cita</th></tr></thead><tbody>'+inas.sort((a,b)=>b.inas-a.inas).map(s=>{const L=((ST.book.CI||{})[s.p.codigo]||[]).filter(c=>c.estado==="INASISTENCIA");const u=L[L.length-1];const nf=activeFut(s.p.codigo)[0];return'<tr><td>'+pname(s)+'</td><td>'+esc(epsShort(s.p.eps))+'</td><td>'+contact(s)+'</td><td>'+grpTag(s)+'</td><td class="mono">'+s.inas+'</td><td>'+(u?fd(u.fecha)+' '+esc(AG_SN(u.serv).toLowerCase())+'<span class="sub">'+esc(u.motivo||"sin motivo registrado")+'</span>':'—')+'</td><td class="mono">'+(nf?fd(nf.fecha)+' '+esc(nf.hora):'<span style="color:var(--bad)">ninguna</span>')+'</td></tr>';}).join("")+'</tbody></table></div></section>';
  out.innerHTML=h;
  EXPORTS.venc=()=>{const aoa=[["Código","Nombre","EPS","Teléfono 1","Teléfono 2","Acudiente","Teléfono acudiente","Intervención","Último registro","Fecha límite","Días de atraso","Motivo"]];L.forEach(x=>aoa.push([x.s.p.codigo,x.s.p.nombre,x.s.p.eps,x.s.p.tel,x.s.p.tel2,x.s.p.acud,x.s.p.acudTel,x.it.nombre,x.it.last?fd(x.it.last):"",x.it.due?fd(x.it.due):"",x.days==null?"sin registro":x.days,x.it.why||""]));saveXlsx("Vencidos_"+iso(corte)+".xlsx",[["Vencidos",aoa]]);};
}

/* ---------- Indicadores ---------- */
const SCOPES=COH.EPS.concat(["Total"]);
/* Ámbitos visibles: con una EPS filtrada solo esa; con «Todas», las tres EPS y el total */
const scopes=()=>epsSel()?[epsSel()]:SCOPES;
const scLabel=e=>e==="Total"?"Total":e==="sin"?"Sin EPS":epsShort(e);
const STR=[["G3","ERC 3a–3b"],["G4","ERC 4"],["G5","ERC 5 y TMND"]];
function agg(snaps,code,eps,st){const set=snaps.filter(s=>eps==="Total"||(eps==="sin"?!s.p.eps:s.p.eps===eps)).map(s=>s.ind[code]).filter(i=>i&&(!st||i.st===st));const ok=set.filter(i=>i.ok).length;return{n:ok,N:set.length,pc:set.length?ok/set.length*100:null};}
/* Meta aplicable: la de la CAC si existe; si no, la institucional propuesta. Con estadio, la del estadio. */
function metaOf(code,st){const F=COH.FICHAS[code];if(!F)return null;let o=F;if(st&&F.est){o=F.est.find(e=>e.k===st)||{};}else if(F.est&&!st)return{est:true};
  if(o.cac)return{r:o.cac,src:"CAC",t:"Meta CAC"};if(o.inst)return{r:o.inst,src:"INST",t:o.inst[0]===o.inst[1]?"Meta institucional":"Meta institucional (propuesta)"};return null;}
const metaTxt=(m,short)=>!m?"Línea de base":m.est?"Por estadio":(short?(m.src==="CAC"?"CAC > ":"Inst. > ")+m.r[0]+" %":m.r[0]===m.r[1]?m.t+": > "+m.r[0]+" % cumple; ≤ "+m.r[0]+" % no cumple":m.t+": > "+m.r[0]+" % cumple; "+m.r[1]+"–"+m.r[0]+" % medio; < "+m.r[1]+" % bajo");
function semaforo(code,pc,st){if(pc==null)return{cls:"na",txt:"Sin población"};const m=metaOf(code,st);if(!m||m.est)return{cls:"base",txt:"Sin meta definida (línea de base)"};const[hi,lo]=m.r,w=m.src==="CAC"?"meta CAC":"meta institucional";
  if(hi===lo)return pc>hi?{cls:"ok",txt:"Cumple "+w+" (> "+hi+" %)"}:{cls:"bad",txt:"No cumple "+w+" (> "+hi+" %)"};
  return pc>hi?{cls:"ok",txt:"Cumple "+w+" (> "+hi+" %)"}:pc>=lo?{cls:"warn",txt:"Medio frente a "+w+" ("+lo+"–"+hi+" %)"}:{cls:"bad",txt:"Bajo frente a "+w+" (< "+lo+" %)"};}
const RANK={bad:3,warn:2,ok:1,base:0,na:-1};
/* Semáforo global de un ámbito: en indicadores por estadio manda el peor estadio con población */
function semAll(snaps,code,eps){const F=COH.FICHAS[code]||{};const a=agg(snaps,code,eps);if(!F.est)return Object.assign(semaforo(code,a.pc),{a});
  let w=null;STR.forEach(([k,l])=>{const b=agg(snaps,code,eps,k);if(b.pc==null)return;const s=semaforo(code,b.pc,k);if(!w||RANK[s.cls]>RANK[w.cls])w={cls:s.cls,txt:"Peor estadio: "+l+" · "+s.txt.charAt(0).toLowerCase()+s.txt.slice(1)};});
  return Object.assign(w||{cls:"na",txt:"Sin población"},{a});}
function trend(){
  if(ST.trend)return ST.trend;
  const g=$("f_grp").value,pts=[];const c0=ST.corte;
  for(let i=5;i>=0;i--){const dt=i===0?c0:new Date(c0.getFullYear(),c0.getMonth()-i+1,0);
    const sn=(i===0?ST.snaps:ST.book.pac.filter(p=>COH.activeAt(p,dt)).map(p=>COH.snapshot(p,ST.book,dt))).filter(s=>!g||String(s.c.grupo||"")===g);
    pts.push({dt,sn});}
  ST.trend=pts;return pts;
}
const SER=[{k:COH.EPS[0],v:"--s1"},{k:COH.EPS[1],v:"--s2"},{k:COH.EPS[2],v:"--s3"},{k:"Total",v:"--s4"},{k:"sin",v:"--s4"}];
const serOf=k=>SER.find(s=>s.k===k)||{k,v:"--s4"};
function metaLine(code,y1,x1,x2,txtX){const m=metaOf(code);if(!m||m.est)return"";const y=y1(m.r[0]);
  return'<line x1="'+x1+'" x2="'+x2+'" y1="'+y+'" y2="'+y+'" class="std'+(m.src==="INST"?" inst":"")+'"/>'+(txtX!=null?'<text x="'+txtX+'" y="'+(y-5)+'" class="ax" text-anchor="end">'+(m.src==="CAC"?"Meta CAC":m.r[0]===m.r[1]?"Meta institucional":"Meta institucional (propuesta)")+' > '+m.r[0]+' %</text>':'');}
function barChart(code,snaps){
  const W=560,H=230,ml=36,mr=12,mt=16,mb=40,iw=W-ml-mr,ih=H-mt-mb;
  const data=scopes().map(k=>Object.assign({},serOf(k),agg(snaps,code,k)));
  const bw=Math.min(epsSel()?110:70,iw/data.length*0.55),gap=iw/data.length;
  let g='<svg viewBox="0 0 '+W+' '+H+'" class="chart" role="img" aria-label="Cumplimiento por EPS">';
  [0,25,50,75,100].forEach(t=>{const y=mt+ih-ih*t/100;g+='<line x1="'+ml+'" x2="'+(W-mr)+'" y1="'+y+'" y2="'+y+'" class="grid"/><text x="'+(ml-6)+'" y="'+(y+4)+'" class="ax" text-anchor="end">'+t+'</text>';});
  g+=metaLine(code,v=>mt+ih-ih*v/100,ml,W-mr,W-mr);
  data.forEach((d,i)=>{const x=ml+gap*i+(gap-bw)/2,cx=x+bw/2;
    if(d.pc!=null){const hh=Math.max(2,ih*d.pc/100),y=mt+ih-hh;g+='<path d="M'+x+' '+(mt+ih)+'V'+(y+4)+'Q'+x+' '+y+' '+(x+4)+' '+y+'H'+(x+bw-4)+'Q'+(x+bw)+' '+y+' '+(x+bw)+' '+(y+4)+'V'+(mt+ih)+'Z" style="fill:var('+d.v+')" class="bar" data-eps="'+esc(d.k)+'" data-tip="'+esc(scLabel(d.k)+": "+Math.round(d.pc)+" % ("+d.n+"/"+d.N+")")+'"/><text x="'+cx+'" y="'+(y-6)+'" class="val" text-anchor="middle">'+Math.round(d.pc)+' %</text>';}
    else g+='<text x="'+cx+'" y="'+(mt+ih-6)+'" class="ax" text-anchor="middle">sin población</text>';
    g+='<text x="'+cx+'" y="'+(H-22)+'" class="lab" text-anchor="middle">'+esc(scLabel(d.k))+'</text><text x="'+cx+'" y="'+(H-8)+'" class="ax" text-anchor="middle">'+(d.N?d.n+'/'+d.N:'—')+'</text>';});
  return g+'</svg>';
}
function lineChart(code){
  const pts=trend();const W=560,H=230,ml=36,mr=110,mt=16,mb=30,iw=W-ml-mr,ih=H-mt-mb;
  const xs=i=>ml+iw*i/(pts.length-1);const ys=v=>mt+ih-ih*v/100;
  let g='<svg viewBox="0 0 '+W+' '+H+'" class="chart" role="img" aria-label="Tendencia de 6 meses">';
  [0,25,50,75,100].forEach(t=>{g+='<line x1="'+ml+'" x2="'+(ml+iw)+'" y1="'+ys(t)+'" y2="'+ys(t)+'" class="grid"/><text x="'+(ml-6)+'" y="'+(ys(t)+4)+'" class="ax" text-anchor="end">'+t+'</text>';});
  g+=metaLine(code,ys,ml,ml+iw,null);
  pts.forEach((p,i)=>{g+='<text x="'+xs(i)+'" y="'+(H-10)+'" class="ax" text-anchor="middle">'+p.dt.toLocaleDateString("es-CO",{month:"short"}).replace(".","")+'</text>';});
  const labels=[];
  scopes().forEach(k=>{const s=serOf(k);const vals=pts.map(p=>agg(p.sn,code,k));if(!vals.some(v=>v.pc!=null))return;
    let dpath="";vals.forEach((v,i)=>{if(v.pc==null)return;dpath+=(dpath?"L":"M")+xs(i)+" "+ys(v.pc);});
    g+='<path d="'+dpath+'" class="ln'+(k==="Total"?' tot':'')+'" data-eps="'+esc(k)+'" style="stroke:var('+s.v+')"/>';
    vals.forEach((v,i)=>{if(v.pc==null)return;g+='<circle cx="'+xs(i)+'" cy="'+ys(v.pc)+'" r="4.5" class="mk" style="fill:var('+s.v+')" data-tip="'+esc(scLabel(k)+" · "+fd(pts[i].dt)+": "+Math.round(v.pc)+" % ("+v.n+"/"+v.N+")")+'"/>';});
    const lv=[...vals].reverse().find(v=>v.pc!=null);if(lv)labels.push({y:ys(lv.pc),t:scLabel(k)+" "+Math.round(lv.pc)+" %",c:s.v});});
  labels.sort((a,b)=>a.y-b.y);for(let i=1;i<labels.length;i++)if(labels[i].y-labels[i-1].y<14)labels[i].y=labels[i-1].y+14;
  labels.forEach(l=>{g+='<text x="'+(ml+iw+8)+'" y="'+(l.y+4)+'" class="lab">'+esc(l.t)+'</text>';});
  return g+'</svg>';
}
function metaFicha(F){
  const r=x=>x[0]===x[1]?"> "+x[0]+" % cumple; ≤ "+x[0]+" % no cumple":"> "+x[0]+" % cumple; "+x[1]+"–"+x[0]+" % medio; < "+x[1]+" % bajo";
  let h='<dt>Meta CAC</dt><dd>'+(F.cac?r(F.cac):F.est&&F.est.some(e=>e.cac)?"Por estadio (ver abajo)":"Definir (línea de base)")+'</dd>';
  if(F.inst||(F.est&&F.est.some(e=>e.inst)))h+='<dt>Meta institucional</dt><dd><span class="tag inst">'+(F.inst&&F.inst[0]===F.inst[1]?"Coordinación Asistencial":"Propuesta · pendiente de adopción")+'</span> '+(F.inst&&!F.est?r(F.inst):"por estadio (ver abajo)")+(F.instJ?'<span class="sub">'+esc(F.instJ)+'</span>':'')+'</dd>';
  if(F.est)h+='<dt>Por estadio</dt><dd><table class="mini-t"><thead><tr><th>Estadio</th><th>Plazo</th><th>Código CAC</th><th>Meta</th></tr></thead><tbody>'+F.est.map(e=>'<tr><td>'+esc(e.l)+'</td><td>'+esc(e.v)+'</td><td class="mono">'+esc(e.cod||"—")+'</td><td>'+(e.cac?'CAC '+r(e.cac):e.inst?'<span class="tag inst">Institucional propuesta</span> '+r(e.inst):'Línea de base')+'</td></tr>').join("")+'</tbody></table></dd>';
  return h;}
function fichaHtml(code){const F=COH.FICHAS[code];if(!F)return"";return'<dl class="ficha"><dt>Código</dt><dd class="mono">'+esc(code)+'</dd><dt>Sección</dt><dd>'+esc(F.sec||"")+'</dd><dt>Tipo</dt><dd>'+esc(F.tipo)+'</dd><dt>Numerador</dt><dd>'+esc(F.num)+'</dd><dt>Denominador</dt><dd>'+esc(F.den)+'</dd><dt>Población</dt><dd>'+esc(F.pob)+'</dd><dt>Ventana</dt><dd>'+esc(F.vent)+'</dd>'+metaFicha(F)+'<dt>Fuente</dt><dd>'+esc(F.fuente)+'</dd></dl>';}
function metaCell(code){const F=COH.FICHAS[code]||{};if(F.est)return'<td class="note">Por estadio</td>';const m=metaOf(code);return'<td class="note" style="white-space:nowrap">'+(m?(m.src==="CAC"?'<span class="tag cac">CAC</span> > '+m.r[0]+' %':'<span class="tag inst">Inst.</span> > '+m.r[0]+' %'):"Línea de base")+'</td>';}
function indRows(S,codes,sel){return codes.map(code=>{const Fi=COH.FICHAS[code]||{n:code};
  const cells=scopes().map(e=>{const sx=semAll(S,code,e),a=sx.a;if(a.pc==null)return'<td class="mono na">—</td>';return'<td class="mono"><span class="pc '+sx.cls+'">'+Math.round(a.pc)+' %</span><span class="mini"><span style="width:'+Math.round(a.pc)+'%"></span></span><span class="sub">'+a.n+'/'+a.N+'</span></td>';}).join("");
  let h='<tr class="'+(code===sel?"sel":"")+'" data-ind="'+esc(code)+'" tabindex="0"><td><span class="c">'+esc(code)+'</span> '+esc(Fi.n)+'</td>'+cells+metaCell(code)+'</tr>';
  if(Fi.est)h+=STR.map(([k,l])=>{const e=Fi.est.find(x=>x.k===k)||{};const m=metaOf(code,k);return'<tr class="strow" data-ind="'+esc(code)+'"><td><span class="sub">↳ '+esc(l)+' · '+esc(e.v||"")+(e.cod?' · '+esc(e.cod):'')+'</span></td>'+scopes().map(sc=>{const a=agg(S,code,sc,k);if(a.pc==null)return'<td class="mono na">—</td>';const s=semaforo(code,a.pc,k);return'<td class="mono"><span class="pc '+s.cls+'">'+Math.round(a.pc)+' %</span><span class="sub">'+a.n+'/'+a.N+'</span></td>';}).join("")+'<td class="note">'+(m?(m.src==="CAC"?'<span class="tag cac">CAC</span> > ':'<span class="tag inst">Inst.</span> > ')+m.r[0]+' %':"Línea de base")+'</td></tr>';}).join("");
  return h;}).join("");}
function rInd(out){
  const S=ST.snaps.filter(s=>!$("f_grp").value||String(s.c.grupo||"")===$("f_grp").value);
  const sc=epsSel()||"Total";const codes=COH.ORDER.filter(c=>S.some(s=>s.ind[c]));
  const tab=codes.filter(c=>(COH.FICHAS[c]||{}).tab),otros=codes.filter(c=>!(COH.FICHAS[c]||{}).tab);
  const cde=new Date(ST.corte.getFullYear(),ST.corte.getMonth(),1),APm=atProg(cde,ST.corte,epsSel()&&epsSel()!=="sin"?epsSel():""),APp=atProg(new Date(cde.getFullYear(),cde.getMonth()-1,1),new Date(cde.getFullYear(),cde.getMonth(),0),epsSel()&&epsSel()!=="sin"?epsSel():"");
  const apC=a=>a.pc==null?"—":'<span class="pc '+(a.pc>=95?"ok":"bad")+'">'+String(Math.round(a.pc*10)/10).replace(".",",")+' %</span>';
  if(!codes.includes(ST.indSel))ST.indSel=tab[0]||codes[0];
  const sel=ST.indSel,F=COH.FICHAS[sel]||{n:sel},sm=semAll(S,sel,sc),A=sm.a;
  let h=head("Indicadores del programa · corte "+fd(ST.corte),"Los 47 indicadores del consenso CAC 2025 (tabla 2) con sus poblaciones, más uno institucional. El semáforo usa la meta CAC cuando existe; los que la CAC deja en línea de base («Definir») se miden contra la meta institucional > 70 %.",'<button class="btn" data-x="ind">Exportar indicadores y pacientes</button>'+(ST.db?'<button class="btn" data-x="freeze">Congelar corte en la base</button>':''));
  h+=epsSeg();
  h+='<section class="panel"><h3>Atenciones programadas frente a atendidas · meta ≥ 95 %</h3><div class="tablebox"><table><thead><tr><th>Periodo</th><th>Programadas</th><th>Atendidas</th><th>Cumplimiento</th><th>No asistió</th><th>Canceladas</th><th>Sin desenlace</th></tr></thead><tbody><tr><td>Mes en curso hasta el corte</td><td class="mono">'+APm.T.prog+'</td><td class="mono">'+APm.T.at+'</td><td class="mono">'+apC(APm)+'</td><td class="mono">'+APm.T.inas+'</td><td class="mono">'+APm.T.canc+'</td><td class="mono">'+APm.T.sin+'</td></tr><tr><td>Mes anterior completo</td><td class="mono">'+APp.T.prog+'</td><td class="mono">'+APp.T.at+'</td><td class="mono">'+apC(APp)+'</td><td class="mono">'+APp.T.inas+'</td><td class="mono">'+APp.T.canc+'</td><td class="mono">'+APp.T.sin+'</td></tr></tbody></table></div><p class="note" style="margin:8px 0 0">Fuente: agenda (hoja Citas). Programadas = citas con fecha en el periodo en cualquier estado; atendidas = estado «Atendida». Meta institucional ≥ 95 % (Coordinación Asistencial); el detalle por servicio está en Cohortes › Gestión.</p></section>';
  const m=metaOf(sel);
  h+='<section class="panel" id="inddetail"><div class="inddet"><div class="hero"><span class="c mono">'+esc(sel)+'</span><h3 class="hn">'+esc(F.n)+'</h3><div class="hv">'+(A.pc==null?"—":Math.round(A.pc)+" %")+'</div><div class="note">'+A.n+' de '+A.N+' · '+esc(sc==="Total"?"Todas las EPS":scLabel(sc))+'</div><div class="sema '+sm.cls+'"><span class="dot '+sm.cls+'"></span>'+esc(sm.txt)+'</div><div class="note" style="margin-top:6px">'+esc(metaTxt(m))+'</div>'+
     (F.est?'<table class="mini-t" style="margin-top:10px"><thead><tr><th>Estadio</th><th>%</th><th>n/N</th></tr></thead><tbody>'+STR.map(([k,l])=>{const a=agg(S,sel,sc,k);const s=semaforo(sel,a.pc,k);return'<tr><td>'+esc(l)+'</td><td><span class="pc '+s.cls+'">'+(a.pc==null?"—":Math.round(a.pc)+" %")+'</span></td><td class="mono">'+(a.N?a.n+"/"+a.N:"—")+'</td></tr>';}).join("")+'</tbody></table>':'')+'</div>'+
     '<div class="charts"><figure><figcaption>'+(epsSel()?"Cumplimiento · "+esc(scLabel(sc)):"Cumplimiento por EPS y total")+'</figcaption>'+barChart(sel,S)+'</figure><figure><figcaption>Tendencia de los últimos 6 meses'+(epsSel()?" · "+esc(scLabel(sc)):"")+'</figcaption>'+lineChart(sel)+'</figure></div></div>';
  h+='<details><summary class="note" style="cursor:pointer;margin-top:10px">Ficha técnica</summary>'+fichaHtml(sel)+'</details>';
  {const pp=(F.pp||[]).filter(k=>COH.POPL[k]);if(pp.length){h+='<details><summary class="note" style="cursor:pointer;margin-top:6px">Por tipo de población CAC</summary><div class="tablebox"><table class="popm"><thead><tr><th>Ámbito</th>'+pp.map(k=>'<th>'+esc(COH.POPL[k])+'</th>').join("")+'</tr></thead><tbody>'+scopes().map(e=>'<tr><td>'+esc(scLabel(e))+'</td>'+pp.map(k=>{const set=S.filter(s=>(e==="Total"||(e==="sin"?!s.p.eps:s.p.eps===e))&&s.pops.includes(k)).map(s=>s.ind[sel]).filter(Boolean);if(!set.length)return'<td class="na">—</td>';const n=set.filter(i=>i.ok).length;const sx=semaforo(sel,n/set.length*100);return'<td class="mono"><span class="pc '+sx.cls+'">'+Math.round(n/set.length*100)+' %</span><span class="sub">'+n+'/'+set.length+'</span></td>';}).join("")+'</tr>').join("")+'</tbody></table></div><p class="note">Un paciente cuenta en todas las columnas a las que pertenece (PG incluye a todos; DM y HTA por diagnóstico), como en la tabla 2 de la CAC.</p></details>';}}
  const miss=S.filter(s=>(sc==="Total"||(sc==="sin"?!s.p.eps:s.p.eps===sc))&&s.ind[sel]&&!s.ind[sel].ok);
  h+='<details><summary class="note" style="cursor:pointer;margin-top:6px">Pacientes que no cumplen ('+miss.length+')</summary>'+(miss.length?'<div class="tablebox"><table><thead><tr><th>Paciente</th><th>EPS</th><th>Contacto</th><th>Grupo</th><th>Estadio</th><th>Motivo</th><th></th></tr></thead><tbody>'+miss.map(s=>'<tr><td>'+pname(s)+'</td><td>'+esc(epsShort(s.p.eps))+'</td><td>'+contact(s)+'</td><td>'+grpTag(s)+'</td><td class="mono">'+esc(stage(s))+'</td><td>'+esc(s.ind[sel].det||"")+'</td><td>'+openBtn(s)+'</td></tr>').join("")+'</tbody></table></div>':'<p class="note">Todos cumplen.</p>')+'</details></section>';
  const thead='<thead><tr><th>Indicador</th>'+scopes().map(c=>'<th>'+esc(scLabel(c))+'</th>').join("")+'<th>Meta</th></tr></thead>';
  h+='<section class="panel"><h3>Indicadores del consenso CAC ('+tab.length+' con población)</h3><p class="note" style="margin:0 0 8px">'+(epsSel()?"Mostrando solo "+esc(scLabel(sc))+". Elija «Todas» para comparar las EPS y el total.":"Las tres EPS y el total.")+' Seleccione un indicador para ver su resultado, gráficos y ficha. <span class="tag cac">CAC</span> meta de la Cuenta de Alto Costo · <span class="tag inst">Inst.</span> meta institucional (> 70 % en los de línea de base).</p><div class="tablebox"><table class="indt">'+thead+'<tbody>'+COH.SECS.map(sc2=>{const cs=tab.filter(c=>(COH.FICHAS[c]||{}).sec===sc2);return cs.length?'<tr class="strow"><td colspan="'+(scopes().length+2)+'"><b>'+esc(sc2)+'</b></td></tr>'+indRows(S,cs,sel):"";}).join("")+'</tbody></table></div></section>';
  if(otros.length)h+='<section class="panel"><details><summary><h3 style="display:inline">Indicadores institucionales ('+otros.length+')</h3></summary><p class="note" style="margin:6px 0 8px">No hacen parte del consenso CAC. Meta propuesta pendiente de adopción.</p><div class="tablebox"><table class="indt">'+thead+'<tbody>'+indRows(S,otros,sel)+'</tbody></table></div></details></section>';
  h+='<section class="panel"><h3>Fichas técnicas</h3>'+codes.map(code=>'<details class="fichad"><summary><span class="c mono">'+esc(code)+'</span> '+esc((COH.FICHAS[code]||{}).n||code)+((COH.FICHAS[code]||{}).tab?'':' <span class="tag">institucional</span>')+'</summary>'+fichaHtml(code)+'</details>').join("")+'<p class="note" style="margin-top:10px">Fuente: Cuenta de Alto Costo, actualización del consenso basado en la evidencia, indicadores mínimos para evaluar la gestión en HTA, DM y ERC 1–4 y 5 sin diálisis ni trasplante (2025), tablas 1 y 2. Los indicadores que la CAC deja en «Definir» (análisis prospectivo para establecer la línea de base) se miden contra la meta institucional > 70 % que fijó Coordinación Asistencial; esa meta no tiene respaldo de evidencia propio: es una decisión de gestión.</p></section>';
  out.innerHTML=h;
  bindTips(out);
  const mr=(code,st)=>{const m=metaOf(code,st);return!m?["Línea de base",""]:m.est?["Por estadio",""]:m.r[0]===m.r[1]?["> "+m.r[0]+" %","Institucional (Coordinación Asistencial)"]:["> "+m.r[0]+" % (medio "+m.r[1]+"–"+m.r[0]+")",m.src==="CAC"?"CAC":"Institucional propuesta"];};
  EXPORTS.ind=()=>{
    const all=ST.snaps.filter(s=>!$("f_grp").value||String(s.c.grupo||"")===$("f_grp").value);
    const res=[["Sección","Código","Indicador","Estadio","Tipo","Meta","Origen de la meta"].concat(SCOPES.flatMap(e=>[scLabel(e)+" numerador",scLabel(e)+" denominador",scLabel(e)+" %",scLabel(e)+" semáforo"]))];
    const row=(code,st,lab)=>{const Fi=COH.FICHAS[code]||{};const r=[Fi.sec||"",code,Fi.n||code,lab||"",Fi.tipo||""].concat(mr(code,st));SCOPES.forEach(e=>{const a=agg(all,code,e,st);const s=st?semaforo(code,a.pc,st):semAll(all,code,e);r.push(a.n,a.N,a.pc==null?"":Math.round(a.pc*10)/10,a.pc==null?"":({ok:"Cumple",warn:"Medio",bad:Fi.inst&&Fi.inst[0]===Fi.inst[1]&&!Fi.cac?"No cumple":"Bajo",base:"Línea de base"})[s.cls]||"");});res.push(r);};
    codes.forEach(code=>{row(code);const Fi=COH.FICHAS[code]||{};if(Fi.est)STR.forEach(([k,l])=>row(code,k,l));});
    const mat=[["Código","Nombre","Documento","EPS","Teléfono 1","Teléfono 2","Grupo","Estadio"].concat(codes)];
    all.forEach(s=>mat.push([s.p.codigo,s.p.nombre,s.p.doc,s.p.eps,s.p.tel,s.p.tel2,s.c.grupo||"",stage(s)].concat(codes.map(c=>s.ind[c]?(s.ind[c].ok?"CUMPLE":"NO CUMPLE"):"NO APLICA"))));
    const det=[["Indicador","Nombre del indicador","Código paciente","Nombre","EPS","Teléfono 1","Grupo","Estadio","Cumple","Motivo"]];
    codes.forEach(code=>all.forEach(s=>{const i=s.ind[code];if(i)det.push([code,(COH.FICHAS[code]||{}).n||code,s.p.codigo,s.p.nombre,s.p.eps,s.p.tel,s.c.grupo||"",stage(s),i.ok?"SI":"NO",i.det||""]);}));
    const rr=x=>x?"> "+x[0]+" % cumple; "+x[1]+"–"+x[0]+" medio; < "+x[1]+" bajo":"";
    const fic=[["Sección","Código","Indicador","Tipo","Numerador","Denominador","Población","Ventana","Meta CAC","Meta institucional propuesta","Justificación meta institucional","Metas por estadio","Fuente"]];
    codes.forEach(c=>{const Fi=COH.FICHAS[c]||{};fic.push([Fi.sec||"",c,Fi.n,Fi.tipo,Fi.num,Fi.den,Fi.pob,Fi.vent,rr(Fi.cac)||(Fi.est?"":"No definida"),Fi.est?"":rr(Fi.inst),Fi.instJ||"",Fi.est?Fi.est.map(e=>e.l+" ("+e.v+", "+(e.cod||"")+"): "+(e.cac?"CAC "+rr(e.cac):e.inst?"institucional propuesta "+rr(e.inst):"línea de base")).join(" | "):"",Fi.fuente]);});
    const sheets=[["Resumen por EPS",res],["Pacientes x indicador",mat],["Detalle",det],["Fichas técnicas",fic]];
    COH.EPS.forEach(e=>{const sub=all.filter(s=>s.p.eps===e);if(!sub.length)return;const m=[mat[0]];sub.forEach(s=>m.push([s.p.codigo,s.p.nombre,s.p.doc,s.p.eps,s.p.tel,s.p.tel2,s.c.grupo||"",stage(s)].concat(codes.map(c=>s.ind[c]?(s.ind[c].ok?"CUMPLE":"NO CUMPLE"):"NO APLICA"))));sheets.push([epsShort(e),m]);});
    saveXlsx("Indicadores_nefroproteccion_"+iso(ST.corte)+".xlsx",sheets);};
  EXPORTS.freeze=async()=>{try{const all=ST.snaps;const resumen=[];codes.forEach(code=>SCOPES.forEach(e=>{const a=agg(all,code,e);if(a.N)resumen.push({eps:e==="Total"?null:e,indicador:code,numerador:a.n,denominador:a.N,porcentaje:Math.round(a.pc*10)/10});}));
    const detalle=[];codes.forEach(code=>all.forEach(s=>{const i=s.ind[code];if(i)detalle.push({codigo:s.p.codigo,indicador:code,cumple:i.ok,detalle:i.det||null});}));
    const r=await apiRpc("congelar_corte",{fecha_corte:iso(ST.corte),version:VERSION,resumen,detalle});toast("Corte del "+fd(ST.corte)+" congelado: "+r.resumen+" resultados y "+r.detalle+" registros por paciente.");}catch(e){toast("No se congeló: "+e.message);}};
}
function bindTips(root){const tip=$("tip");root.querySelectorAll("svg.chart").forEach(svg=>{svg.addEventListener("mousemove",e=>{const t=e.target.closest("[data-tip]");if(!t){tip.hidden=true;return;}tip.textContent=t.getAttribute("data-tip");tip.hidden=false;tip.style.left=(e.clientX+12)+"px";tip.style.top=(e.clientY-28)+"px";});svg.addEventListener("mouseleave",()=>{tip.hidden=true;});});}

/* ---------- Alertas y calidad ---------- */
function rAlert(out){
  const S=filtered();const A=[];
  S.forEach(s=>{
    if(!s.tl)A.push({s,lvl:"bad",t:"Sin creatinina ni TFGe registradas: no se puede estratificar."});
    else if(NP.days(s.tl.fecha,ST.corte)>365)A.push({s,lvl:"warn",t:"Última TFGe del "+fd(s.tl.fecha)+": más de un año; la clasificación puede estar desactualizada."});
    if(s.c.erc==="prov")A.push({s,lvl:"warn",t:"ERC por confirmar: falta demostrar persistencia > 3 meses."});
    (s.P.actions||[]).forEach(a=>{if(/^PA fuera|^HbA1c fuera|Registre la causa/.test(a.t))return;A.push({s,lvl:a.lvl,t:a.t});});
    const ci=((ST.book.CI||{})[s.p.codigo]||[]).filter(c=>c.fecha<=ST.corte);const lost=ci.filter(c=>["INASISTENCIA","NO ATENDIDA"].includes(c.estado)&&!c.reId&&NP.days(c.fecha,ST.corte)<=90);
    if(lost.length&&!activeFut(s.p.codigo).length){const u=lost[lost.length-1];const hi=s.c.grupo===3||(s.P.actions||[]).some(a=>a.lvl==="bad");A.push({s,lvl:hi?"bad":"warn",t:(u.estado==="INASISTENCIA"?"No asistió":"Llegó y no fue atendido")+" a "+AG_SN(u.serv).toLowerCase()+" el "+fd(u.fecha)+" y no tiene cita nueva"+(hi?": búsqueda activa prioritaria (grupo 3 o alerta clínica).":".")});}
    if(ci.filter(c=>c.estado==="INASISTENCIA"&&NP.days(c.fecha,ST.corte)<=180).length>=2)A.push({s,lvl:"warn",t:"Inasistencia reiterada (2 o más en 6 meses): valorar barreras de acceso con trabajo social."});
  });
  const ord={bad:0,warn:1,info:2};A.sort((a,b)=>ord[a.lvl]-ord[b.lvl]);
  const bad=A.filter(a=>a.lvl==="bad"),gap=A.filter(a=>a.lvl!=="bad");
  let h=head("Alertas de la cohorte","Calculadas con el último dato de cada paciente al corte "+fd(ST.corte)+". Los síntomas solo generan alertas en la valoración individual.");
  const tbl=L=>L.length?'<div class="tablebox"><table><thead><tr><th>Paciente</th><th>EPS</th><th>Contacto</th><th>Grupo</th><th>Alerta</th><th></th></tr></thead><tbody>'+L.map(a=>'<tr><td>'+pname(a.s)+'</td><td>'+esc(epsShort(a.s.p.eps))+'</td><td>'+contact(a.s)+'</td><td>'+grpTag(a.s)+'</td><td><span class="dot '+a.lvl+'"></span>'+esc(a.t)+'</td><td>'+openBtn(a.s)+'</td></tr>').join("")+'</tbody></table></div>':'<p class="note">Ninguna.</p>';
  h+='<section class="panel"><h3>Prioritarias · '+bad.length+'</h3>'+tbl(bad)+'</section><details class="panel"><summary>Brechas de tratamiento y seguimiento · '+gap.length+'</summary>'+tbl(gap)+'</details>';
  out.innerHTML=h;
}
function rCal(out){
  const B=ST.book;const I=B.issues;const S=ST.snaps;const miss=[];
  const T0=new Date();
  S.forEach(s=>{if(!s.rl)miss.push([s,"Sin RAC registrada"]);if(!s.lv)miss.push([s,"Sin valoraciones registradas"]);});B.cit.forEach(c=>{const s=ST.smap[c.c];if(!s)return;if((c.estado==="ASIGNADA"||c.estado==="EN SALA")&&NP.days(c.fecha,T0)>=1)miss.push([s,"Cita "+c.id+" del "+fd(c.fecha)+" sin cierre ("+(c.estado==="EN SALA"?"quedó en sala, sin marcar atención":"no se marcó llegada ni inasistencia")+")"]);if(c.estado==="INASISTENCIA"&&!c.motivo&&NP.days(c.fecha,T0)>7)miss.push([s,"Inasistencia del "+fd(c.fecha)+" sin motivo después de 7 días"]);});
  const noAct=B.cit.filter(c=>(c.estado==="ASIGNADA")&&c.fecha>=new Date(T0.getFullYear(),T0.getMonth(),T0.getDate())&&(ST.pmap[c.c]||{}).estado&&ST.pmap[c.c].estado!=="ACTIVO");
  let h=head("Calidad del dato","Errores y vacíos que afectan la clasificación, la agenda o los indicadores.");
  if(noAct.length)h+='<div class="alert bad"><p>'+noAct.length+' cita(s) futura(s) de pacientes que ya no están activos ('+[...new Set(noAct.map(c=>c.c+" "+ST.pmap[c.c].estado.toLowerCase()))].map(esc).join(", ")+'). Cancélelas en Agenda para liberar el cupo: '+noAct.map(c=>esc(c.id)+" "+fd(c.fecha)).join(", ")+'.</p></div>';
  h+='<div class="tiles">'+tile("Errores",I.filter(i=>i.lvl==="bad").length,"bad")+tile("Advertencias",I.filter(i=>i.lvl==="warn").length,"warn")+tile("Datos faltantes por paciente",miss.length,miss.length?"warn":"")+'</div>';
  if(B.missing.length)h+='<div class="alert bad"><p>Faltan hojas en el libro: '+esc(B.missing.join(", "))+'. Use la plantilla del programa.</p></div>';
  h+='<section class="panel"><h3>Registros con problemas</h3>'+(I.length?'<div class="tablebox"><table><thead><tr><th>Hoja</th><th>Fila</th><th>Código</th><th>Problema</th></tr></thead><tbody>'+I.map(i=>'<tr><td>'+esc(i.sheet)+'</td><td class="mono">'+esc(i.row)+'</td><td class="mono">'+esc(i.c)+'</td><td><span class="dot '+i.lvl+'"></span>'+esc(i.txt)+'</td></tr>').join("")+'</tbody></table></div>':'<p class="note">Sin problemas detectados.</p>')+'</section>';
  h+='<section class="panel"><h3>Datos faltantes por paciente</h3>'+(miss.length?'<div class="tablebox"><table><thead><tr><th>Paciente</th><th>EPS</th><th>Falta</th></tr></thead><tbody>'+miss.map(([s,t])=>'<tr><td>'+pname(s)+'</td><td>'+esc(epsShort(s.p.eps))+'</td><td>'+esc(t)+'</td></tr>').join("")+'</tbody></table></div>':'<p class="note">Completo.</p>')+'</section>';
  out.innerHTML=h;
}

/* ===================== v8 · libro editable, calendario contractual, cohortes, auditoría GPC, nominal por EPS ===================== */
/* ---------- libro editable en el navegador: altas y cambios se aplican al Excel original al descargar ---------- */
ST.ops=[];ST.raw=null;ST.hdr={};
const NEWHDR={tabaquismo:"Tabaquismo",antihipertensivo:"Antihipertensivo",rcv:"Riesgo cardiovascular",primer_apellido:"Primer apellido",segundo_apellido:"Segundo apellido",primer_nombre:"Primer nombre",segundo_nombre:"Segundo nombre",correo:"Correo"};
const RAWSHEETS=["Pacientes","Laboratorios","Valoraciones","Atenciones","Novedades"];
function rawInit(wb){ST.ops=[];ST.hdr={};ST.raw=COH.sheetsFromWb(wb);RAWSHEETS.forEach(n=>{if(!ST.raw[n])ST.raw[n]=[];const sn=wb.SheetNames.find(x=>COH.norm(x)===COH.norm(n));if(sn){const a=XLSX.utils.sheet_to_json(wb.Sheets[sn],{header:1,range:0,blankrows:false});ST.hdr[n]=(a[0]||[]).map(String);}else ST.hdr[n]=[];});
  const ex=n=>{const sn=wb.SheetNames.find(x=>COH.norm(x)===COH.norm(n));return sn?XLSX.utils.sheet_to_json(wb.Sheets[sn],{defval:"",raw:false}):[];};
  ST.aud=ex("Auditoria_GPC");ST.arr=ex("Arrastre_nominal");ST.ncfg={};ex("Config_nominal").forEach(r=>{if(r.Clave)ST.ncfg[r.Clave]=r.Valor;});}
function rawRebuild(){const B0=ST.book;const B=COH.parseRows(ST.raw);
  B.jor=B0.jor;B.cit=B0.cit;B.clog=B0.clog;B.ctc=B0.ctc;COH.reindexCitas(B);ST.book=B;ST.dirty=true;ST.trend=null;compute();fillPick();bookInfo();}
function rawAdd(sheet,obj){const o=Object.assign({_row:"nuevo"},obj);ST.raw[sheet].push(o);ST.ops.push({t:"add",sheet,obj:o});}
function rawUpd(sheet,codigo,obj){const r=ST.raw[sheet].find(x=>String(x.codigo).trim()===codigo);if(!r)return false;Object.assign(r,obj);if(r._row!=="nuevo")ST.ops.push({t:"upd",sheet,row:r._row,obj:r});return true;}
const DATEKEYS=["fecha","fecha_nacimiento","fecha_ingreso","fecha_estado","proximo_control"];
function cellOut(k,v){if(v==null)return"";if(DATEKEYS.includes(k)){const d=COH.toDate(v);return d?fd(d):String(v);}return v;}
function applyOps(wb){
  const touched=new Set();
  ST.ops.forEach(op=>{let sn=wb.SheetNames.find(x=>COH.norm(x)===COH.norm(op.sheet));if(!sn){sn=op.sheet;XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([[]]),sn);}
    const ws=wb.Sheets[sn];let hdr=ST.hdr[op.sheet]||[];if(!hdr.length){hdr=Object.keys(op.obj).filter(k=>k!=="_row").map(k=>NEWHDR[k]||k);ST.hdr[op.sheet]=hdr;XLSX.utils.sheet_add_aoa(ws,[hdr],{origin:{r:0,c:0}});}
    const keys=hdr.map(h=>COH.key(h));
    Object.keys(op.obj).forEach(k=>{if(k==="_row"||keys.includes(k))return;const hn=NEWHDR[k]||k;hdr.push(hn);keys.push(k);XLSX.utils.sheet_add_aoa(ws,[[hn]],{origin:{r:0,c:hdr.length-1}});});
    const row=keys.map(k=>cellOut(k,op.obj[k]));
    if(op.t==="add")XLSX.utils.sheet_add_aoa(ws,[row],{origin:-1});
    else if(typeof op.row==="number")XLSX.utils.sheet_add_aoa(ws,[row],{origin:{r:op.row-1,c:0}});
    else XLSX.utils.sheet_add_aoa(ws,[row],{origin:-1});
    touched.add(op.sheet);});
  const put=(n,aoa)=>{const i=wb.SheetNames.indexOf(n);if(i>=0){wb.SheetNames.splice(i,1);delete wb.Sheets[n];}XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(aoa),n);};
  if(ST.aud&&ST.aud.length){const H=["ID","Fecha","Auditor","Guia","Codigo","EPS","Criterio","Descripcion","Resultado","Fuente","Observacion"];put("Auditoria_GPC",[H].concat(ST.aud.map(r=>H.map(h=>r[h]==null?"":r[h]))));}
  if(ST.arr&&ST.arr.length){const H=["Codigo","Formato","Corte","Origen","Datos"];put("Arrastre_nominal",[H].concat(ST.arr.map(r=>H.map(h=>r[h]==null?"":r[h]))));}
  if(ST.ncfg&&Object.keys(ST.ncfg).length)put("Config_nominal",[["Clave","Valor"]].concat(Object.entries(ST.ncfg)));
  return touched;}
window.MG.addValoracion=function(o){if(!ST.book||ST.db)return"Sin libro cargado.";if(!ST.raw)return"El libro no admite edición en esta sesión.";
  if(!ST.book.pac.some(p=>p.codigo===o.val.codigo))return"El código "+o.val.codigo+" no existe en el libro.";
  rawAdd("Valoraciones",o.val);o.lab.forEach(l=>rawAdd("Laboratorios",l));o.at.forEach(a=>rawAdd("Atenciones",a));rawRebuild();
  return"Agregado al libro: 1 valoración, "+o.lab.length+" paraclínico(s) y "+o.at.length+" atención(es). Descargue el libro para conservarlo.";};

/* ---------- calendario de actividades por modelo de atención de la EPS ---------- */
const MES3=["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
function calPlan(s){
  const M=s.d.epsModel||{};const pkg=M.multi==="PAQUETE";const inter=M.inter==="MEDICO EXPERTO";
  const T0=new Date(ST.corte.getFullYear(),ST.corte.getMonth(),1);const NM=12;
  const months=[...Array(NM)].map((_,i)=>new Date(T0.getFullYear(),T0.getMonth()+i,1));
  const mi=dt=>(dt.getFullYear()-T0.getFullYear())*12+dt.getMonth()-T0.getMonth();
  const occ=it=>{const L=[];if(it.wk){const k=it.due?Math.max(0,mi(it.due)):0;if(k<NM)L.push({k,venc:!it.due||it.due<ST.corte});return L;}
    const m=it.m||12;let d=it.due||null;let venc=false;if(!d||d<ST.corte){venc=true;d=ST.corte;}let k=mi(d);let first=true;
    while(k<NM){L.push({k,venc:first&&venc});first=false;d=NP.addMonths(d,m);k=mi(d);}return L;};
  const gl=s.P.goals||{pa:[140,90],a1c:7};const paOff=s.d.pas!=null&&s.d.pad!=null&&!(s.d.pas<gl.pa[0]&&s.d.pad<gl.pa[1]);const a1cOff=s.d.dm&&s.d.hba1c!=null&&!(s.d.hba1c<gl.a1c);
  const ctl=s.items.find(i=>i.k==="ctl");const rev=ctl&&ctl.m||null;
  const rows=[];const R=(grp,name,serv,cells,why)=>rows.push({grp,name,serv,cells,why});
  const blank=()=>[...Array(NM)].map(()=>null);
  /* control médico base (nefrología o médico del programa) */
  const ctlC=blank();if(ctl)occ(ctl).forEach(o=>{ctlC[o.k]={t:o.venc?"venc":"prog"};});
  const fuera=pkg&&rev!=null&&rev>3;
  if(ctl){R("Consultas médicas",ctl.nombre+(rev?" · cada "+rev+(rev===1?" mes":" meses"):""),itemServ(s,ctl),ctlC,ctl.why);if(fuera)ctlC.forEach(c=>{if(c)c.fuera=true;});}
  const nefM=ctlC.map((c,i)=>c?i:null).filter(x=>x!=null);
  /* ajuste de metas */
  const aj=s.items.find(i=>i.k==="ajuste");
  if(aj&&!inter){const cells=blank();const nx=nefM.find(k=>k>0);const hasta=nx!=null?nx:3;for(let k=1;k<hasta&&k<NM;k++)if(!ctlC[k])cells[k]={t:"prog"};if(aj.due&&aj.due<ST.corte)cells[0]={t:"venc"};
    R("Consultas médicas",aj.nombre+" (hasta la próxima valoración)",itemServ(s,aj),cells,aj.why);}
  /* EPS con médico experto entre valoraciones */
  if(inter){const im=M.interMeses||1;const cells=blank();const nx=nefM.find(k=>k>0);
    for(let k=0;k<NM;k+=1){if(ctlC[k])continue;if(k%im!==0&&im>1)continue;const pa=(paOff||a1cOff)&&(nx==null||k<nx);cells[k]={t:"prog",tx:pa?"F+PA":"F"};}
    R("Consultas médicas","Médico experto · formulación de medicamentos contratados"+((paOff||a1cOff)?" (F+PA: con control de "+(paOff?"PA":"")+(paOff&&a1cOff?" y ":"")+(a1cOff?"HbA1c":"")+" hasta la próxima valoración)":""),"MEDICO EXPERTO",cells,"Modelo de "+(s.p.eps||"la EPS")+": en los meses sin valoración por nefrología el paciente asiste a médico experto para formulación.");}
  /* laboratorios y equipo */
  s.items.forEach(it=>{if(["ctl","ajuste","experto"].includes(it.k))return;
    const grp=it.tipo==="Laboratorio"?"Laboratorios":(it.grp==="Equipo"&&!["rcv","desnut","edu","flu","kfre"].includes(it.k))?"Equipo multidisciplinario":"Clínica, educación y vacunas";
    const cells=blank();occ(it).forEach(o=>{if(o.k>=NM)return;const prev=cells[o.k];cells[o.k]={t:o.venc?"venc":(prev&&prev.t==="venc"?"venc":"prog"),mov:false};});
    R(grp,it.nombre+(it.m?" · cada "+it.m+(it.m===1?" mes":" meses"):it.wk?" · a las "+it.wk+" semanas":""),itemServ(s,it),cells,it.why);});
  if(M.meds||/Familiar/i.test(s.p.eps||"")){
    const medCells=blank();for(let k=0;k<NM;k++)medCells[k]={t:"prog",tx:"MED"};
    R("Gestión farmacéutica contractual","Entrega mensual de medicamentos nefroprotectores (contrato EPS Familiar)","QUIMICA FARMACEUTICA",medCells,"Contratado exclusivamente para EPS Familiar de Colombia junto con la valoración mensual por médico experto.");
  }
  /* citas ya asignadas y asistencias/inasistencias registradas */
  const allCits=((ST.book.CI||{})[s.p.codigo]||[]).filter(c=>c.fecha>=T0);
  rows.forEach(r=>{if(!r.serv)return;allCits.filter(c=>c.serv===r.serv).forEach(c=>{const k=mi(c.fecha);if(k<0||k>=NM)return;
    if(c.estado==="ATENDIDA")r.cells[k]={t:"hecho",tx:"✔"};
    else if(c.estado==="INASISTENCIA")r.cells[k]={t:"venc",tx:"✕"};
    else if(c.estado==="ASIGNADA"||c.estado==="EN SALA")r.cells[k]=Object.assign({},r.cells[k]||{t:"prog"},{cita:fd(c.fecha)+" "+c.hora});
  });});
  /* lo realizado en el mes en curso */
  s.items.forEach(it=>{if(it.last&&it.last>=T0&&it.last<=ST.corte){const r=rows.find(x=>x.name.startsWith(it.nombre));if(r&&(!r.cells[0]||r.cells[0].t!=="prog"))r.cells[0]={t:"hecho"};}});
  const notas=["Calendario clínico estandarizado según la Herramienta Técnica de Contenidos Mínimos y Suficientes para Nefroprotección (CAC / KDIGO 2024), independiente de la EPS."];
  if(/Familiar/i.test(s.p.eps||"")||M.meds)notas.push("Regla contractual EPS Familiar de Colombia: incluye valoración mensual por Médico Experto (meses sin nefrología) y entrega mensual de medicamentos.");
  else if(/Nueva EPS/i.test(s.p.eps||""))notas.push("Regla contractual Nueva EPS: aplica el 100 % del calendario clínico de contenidos mínimos y suficientes por estadio; valoración mensual por médico experto y entrega de medicamentos no contratados.");
  return{months,rows,notas,pkg,fuera,inter,rev};}
function calHtml(s){const C=calPlan(s);const cell=c=>{if(!c)return'<td class="cm"></td>';const cls=c.cita?"cita":c.t==="venc"?"venc":c.t==="hecho"?"hecho":c.fuera?"fuera":"";const tx=c.cita?"✓":c.t==="venc"?"!":c.t==="hecho"?"✔":(c.tx||"●")+(c.mov?"↤":"");return'<td class="cm"><span class="ev '+cls+'" title="'+esc(c.cita?"Cita "+c.cita:c.t==="venc"?"Vencido o sin registro: programar ya":c.t==="hecho"?"Realizado este mes":c.mov?"Se adelanta al mes de nefrología":"Programado")+'">'+tx+'</span></td>';};
  let h='<section class="panel"><div class="mhead"><h3 style="margin:0">Calendario de actividades · 12 meses</h3><div class="copyrow"><button type="button" class="btn sm" id="calexp">Descargar calendario</button></div></div>';
  h+='<p class="note" style="margin:6px 0 8px">Sale del último dato del paciente y de la agenda base de su estadio ('+esc(stage(s))+', '+(s.c.grupo?esc(NP.GRUPO[s.c.grupo]):"sin grupo")+'), ajustada al modelo de atención de '+esc(epsShort(s.p.eps))+'. ● programado · ! vencido o sin registro · ✓ cita asignada · ✔ realizado este mes · F formulación · F+PA formulación y control de metas.</p>';
  if(C.notas.length)h+='<div class="alerts" style="margin-bottom:8px">'+C.notas.map((t,i)=>'<div class="alert '+(C.fuera&&i===(C.pkg?1:0)?"bad":"info")+'"><p>'+esc(t)+'</p></div>').join("")+'</div>';
  h+='<div class="tablebox"><table class="calg"><thead><tr><th>Actividad</th>'+C.months.map(m=>'<th>'+MES3[m.getMonth()]+'<span class="sub">'+String(m.getFullYear()).slice(2)+'</span></th>').join("")+'</tr></thead><tbody>';
  let g="";C.rows.forEach(r=>{if(r.grp!==g){g=r.grp;h+='<tr class="gsec"><td colspan="'+(C.months.length+1)+'">'+esc(g)+'</td></tr>';}h+='<tr><td title="'+esc(r.why||"")+'">'+esc(r.name)+'</td>'+r.cells.map(cell).join("")+'</tr>';});
  h+='</tbody></table></div><details><summary class="note" style="cursor:pointer;margin-top:8px">Ver mes a mes</summary><div class="callist">'+C.months.map((m,i)=>{const L=C.rows.filter(r=>r.cells[i]).map(r=>r.name.split(" · ")[0]+(r.cells[i].t==="venc"?" (vencido)":r.cells[i].cita?" (cita "+r.cells[i].cita+")":""));return'<div class="cmo"><b>'+MES3[m.getMonth()]+' '+m.getFullYear()+'</b><span>'+(L.length?esc(L.join(" · ")):'<span class="note">Sin actividades</span>')+'</span></div>';}).join("")+'</div></details></section>';
  return h;}
function calExport(s){const C=calPlan(s);const aoa=[["Grupo","Actividad"].concat(C.months.map(m=>MES3[m.getMonth()]+" "+m.getFullYear())).concat(["Motivo"])];
  C.rows.forEach(r=>aoa.push([r.grp,r.name].concat(r.cells.map(c=>!c?"":c.cita?"CITA "+c.cita:c.t==="venc"?"VENCIDO":c.t==="hecho"?"REALIZADO":(c.tx||"PROGRAMADO")+(c.mov?" (con nefrología)":"")+(c.fuera?" FUERA DE PAQUETE":""))).concat([r.why||""])));
  const notas=[["Nota"],["Paciente "+s.p.codigo+" · "+(s.p.eps||"sin EPS")+" · estadio "+stage(s)+" · corte "+fd(ST.corte)]].concat(C.notas.map(t=>[t])).concat([["Datos ficticios: "+(ST.demo?"SÍ":"no")]]);
  saveXlsx("Calendario_"+s.p.codigo+"_"+iso(ST.corte)+".xlsx",[["Calendario",aoa],["Notas",notas]]);}

/* ---------- Cohortes: caracterización y perfil de riesgo ---------- */
ST.cohSub="car";ST.gesSub="act";
const COHSUBS=[["car","Caracterización y riesgo"],["ges","Gestión: mes en curso y próximo"],["venc","Vencidos"],["alert","Alertas"]];
function rCohMain(out){
  let h='<div class="nsub" role="group" aria-label="Subsecciones de cohortes">'+COHSUBS.map(([k,l])=>'<button type="button" data-nsub="'+k+'" aria-pressed="'+(ST.cohSub===k)+'">'+l+'</button>').join("")+'</div><div id="cohin"></div>';
  out.innerHTML=h;const inner=$("cohin");
  ({car:rCar,ges:rGes,venc:rVenc,alert:rAlert})[ST.cohSub](inner);
  out.querySelectorAll("[data-nsub]").forEach(b=>b.addEventListener("click",()=>{ST.cohSub=b.dataset.nsub;renderMg("coh");}));}
const cnt=(S,f)=>{const o={};S.forEach(s=>{const k=f(s);if(k==null)return;o[k]=(o[k]||0)+1;});return o;};
const pcts=(n,N)=>N?Math.round(n/N*1000)/10:null;
function hbarsH(obj,N,order){const ks=order||Object.keys(obj).sort((a,b)=>obj[b]-obj[a]);const mx=Math.max(1,...ks.map(k=>obj[k]||0));return'<div class="hbars">'+ks.filter(k=>obj[k]).map(k=>'<div class="hb"><span class="hbl">'+esc(k)+'</span><span class="hbt"><span style="width:'+Math.round((obj[k]||0)/mx*100)+'%"></span></span><span class="hbv mono">'+(obj[k]||0)+(N?' · '+String(pcts(obj[k]||0,N)).replace(".",",")+' %':'')+'</span></div>').join("")+'</div>';}
function rCar(out){
  const S=filtered(),N=S.length;
  let h=head("Caracterización y perfil de riesgo","Corte "+fd(ST.corte)+". Pacientes activos con los filtros de EPS y grupo de arriba. Tipo de población según la tabla 1 del consenso CAC; estadio con TFGe CKD-EPI 2021.",'<button class="btn" data-x="car">Exportar caracterización</button>');
  h+=epsSeg();
  const erc=cnt(S,s=>s.c.erc);
  h+='<div class="tiles">'+tile("Activos",N,"")+COH.EPS.map(e=>tile(epsShort(e),S.filter(s=>s.p.eps===e).length,"")).join("")+tile("ERC confirmada",erc.si||0,"")+tile("Por confirmar",erc.prov||0,erc.prov?"warn":"")+tile("Sin definir",erc.indet||0,erc.indet?"warn":"")+'</div>';
  /* tipo de población CAC (excluyente: estadio o combinación sin ERC) */
  const tp=cnt(S,s=>{const x=s.pops.find(p=>/^ERC|^S|^HDM/.test(p));return x?COH.POPL[x]:"Sin HTA ni DM, sin ERC";});
  const ordTP=["Solo HTA","Solo DM","HTA y DM","ERC 1–2","ERC 3a","ERC 3b","ERC 4","ERC 5","ERC 5 TMND","Sin HTA ni DM, sin ERC"];
  h+='<div class="two"><section class="panel"><h3>Tipo de población (consenso CAC)</h3>'+hbarsH(tp,N,ordTP)+'<p class="note" style="margin:8px 0 0">Cada paciente cuenta una vez: su estadio de ERC o, sin ERC, su combinación de HTA y DM.</p></section>';
  const GS=["G1","G2","G3a","G3b","G4","G5"],AS=["A1","A2","A3",null];
  const RISKC={G1:["low","mod","high"],G2:["low","mod","high"],G3a:["mod","high","vhigh"],G3b:["high","vhigh","vhigh"],G4:["vhigh","vhigh","vhigh"],G5:["vhigh","vhigh","vhigh"]};
  h+='<section class="panel"><h3>Matriz KDIGO de la cohorte</h3><div class="tablebox"><table class="gxa"><thead><tr><th></th><th>A1</th><th>A2</th><th>A3</th><th>Sin RAC</th></tr></thead><tbody>';
  GS.forEach(g=>{h+='<tr><th>'+g+'</th>'+AS.map((a,i)=>{const n=S.filter(s=>s.c.G===g&&s.c.A===a).length;return'<td class="mono '+(a?'k-'+RISKC[g][i]:'')+'">'+(n||"")+'</td>';}).join("")+'</tr>';});
  h+='</tbody></table></div><p class="note" style="margin:8px 0 0">Color: riesgo KDIGO 2024 (verde bajo, amarillo moderado, naranja alto, rojo muy alto).</p></section></div>';
  /* perfil de riesgo clínico */
  const kf=cnt(S.filter(s=>s.c.kfre),s=>s.c.kfre.r2>0.4?"KFRE 2 a > 40 %":s.c.kfre.r2>0.1?"KFRE 2 a 10–40 %":s.c.kfre.r5>=0.05?"KFRE 5 a ≥ 5 % (2 a ≤ 10 %)":"KFRE 5 a < 5 %");
  const rc=cnt(S,s=>{const m=s.rcv&&s.rcv.main;if(!m)return"Sin datos para estimar";if(m.src==="auto")return"Automático: "+m.cat.toLowerCase();if(m.src==="score2")return"SCORE2-Colombia: "+m.cat.toLowerCase();return"Framingham ajustado: "+(m.r<0.1?"< 10 %":m.r<0.2?"10–20 %":"≥ 20 %");});
  h+='<div class="two"><section class="panel"><h3>Riesgo de falla renal (KFRE)</h3>'+hbarsH(kf,S.filter(s=>s.c.kfre).length,["KFRE 2 a > 40 %","KFRE 2 a 10–40 %","KFRE 5 a ≥ 5 % (2 a ≤ 10 %)","KFRE 5 a < 5 %"])+'<p class="note" style="margin:8px 0 0">Calculable en '+S.filter(s=>s.c.kfre).length+' de '+S.filter(s=>["G3a","G3b","G4","G5"].includes(s.c.G)&&!s.c.conserv).length+' pacientes G3a–G5 sin TMND. Umbrales de KDIGO 2024 (preparación de TRR > 40 % a 2 años; remisión 3–5 % a 5 años).</p></section>';
  h+='<section class="panel"><h3>Riesgo cardiovascular</h3>'+hbarsH(rc,N)+'<p class="note" style="margin:8px 0 0">Con el último colesterol total y HDL del año, PA del semestre y tabaquismo registrado en la valoración. La categoría automática (ESC 2021: ECV establecida o ERC moderada o grave) prima sobre las escalas. Framingham se agrupa en &lt; 10, 10–20 y ≥ 20 % solo para describir la cohorte: esos cortes no son una meta validada para Colombia.</p></section></div>';
  const ctl=(f,ap)=>{const A=S.filter(ap);const n=A.filter(f).length;return[n,A.length];};
  const paM=ctl(s=>s.d.pas!=null&&s.d.pas<s.P.goals.pa[0]&&s.d.pad<s.P.goals.pa[1],s=>s.d.pas!=null);
  const a1M=ctl(s=>s.d.hba1c!=null&&s.d.hba1c<s.P.goals.a1c,s=>s.d.dm&&s.d.hba1c!=null);
  const ldM=ctl(s=>s.d.ldl!=null&&s.d.ldl<=s.P.goals.ldl,s=>s.d.ldl!=null);
  const pf2=([n,d])=>d?String(pcts(n,d)).replace(".",",")+" %":"—";
  h+='<section class="panel"><h3>Control de factores de riesgo (meta individual de cada paciente)</h3><div class="tiles">'+tile("PA en meta",pf2(paM),"")+tile("HbA1c en meta (DM)",pf2(a1M),"")+tile("cLDL en meta",pf2(ldM),"")+tile("Con ECV establecida",S.filter(s=>s.p.ecv).length,"")+'</div><p class="note" style="margin:8px 0 0">Denominador: pacientes con el dato (PA de los últimos 6 meses; HbA1c y cLDL del último resultado). La meta es la que la valoración asigna a cada paciente según su grupo, DM y riesgo. Los indicadores CAC con su ventana están en Indicadores.</p></section>';
  /* demografía y comorbilidad */
  const sx=cnt(S,s=>s.p.sexo==="F"?"Mujeres":s.p.sexo==="M"?"Hombres":"Sin dato"),ag=cnt(S,s=>s.d.edad==null?"Sin dato":s.d.edad<40?"< 40":s.d.edad<50?"40–49":s.d.edad<60?"50–59":s.d.edad<70?"60–69":s.d.edad<80?"70–79":"≥ 80");
  const mu=cnt(S,s=>s.p.municipio||"Sin dato"),ca=cnt(S,s=>({dm:"Diabética",hta:"Hipertensiva",glom:"Glomerulopatía",pq:"Poliquistosis",uro:"Uropatía obstructiva",nti:"Tubulointersticial",otra:"Otra",desc:"No establecida"})[s.d.causa]||"Sin registrar");
  h+='<div class="two"><section class="panel"><h3>Sexo y edad</h3>'+hbarsH(sx,N)+'<div style="height:10px"></div>'+hbarsH(ag,N,["< 40","40–49","50–59","60–69","70–79","≥ 80","Sin dato"])+'</section><section class="panel"><h3>Municipio de residencia</h3>'+hbarsH(mu,N)+'</section></div>';
  const com={HTA:S.filter(s=>s.d.hta).length,"DM tipo 2":S.filter(s=>s.d.dmTipo==="2").length,"DM tipo 1 u otra":S.filter(s=>s.d.dm&&s.d.dmTipo!=="2").length,"Enfermedad cardiovascular":S.filter(s=>s.p.ecv).length,"G5 en TMND":S.filter(s=>s.p.terapia==="tmnd").length,"G5 en preparación de TRR":S.filter(s=>s.p.terapia==="trr").length};
  h+='<div class="two"><section class="panel"><h3>Comorbilidad y situación renal</h3>'+hbarsH(com,N,Object.keys(com))+'</section><section class="panel"><h3>Causa de la ERC</h3>'+hbarsH(ca,N)+'</section></div>';
  /* grupo por EPS y movimientos (vista anterior de Cohorte) */
  const corte=ST.corte,y=corte.getFullYear(),m=corte.getMonth();const all=ST.book.pac;
  h+='<section class="panel"><h3>Grupo del programa por EPS</h3><div class="tablebox"><table><thead><tr><th>Grupo</th>'+COH.EPS.map(e=>'<th>'+epsShort(e)+'</th>').join("")+'<th>Total</th></tr></thead><tbody>';
  [1,2,3,0].forEach(g=>{const row=S.filter(s=>(s.c.grupo||0)===g);if(!row.length&&g===0)return;h+='<tr><td>'+(g?NP.GRUPO[g]:"Sin TFGe")+'</td>'+COH.EPS.map(e=>'<td class="mono">'+row.filter(s=>s.p.eps===e).length+'</td>').join("")+'<td class="mono"><strong>'+row.length+'</strong></td></tr>';});
  h+='</tbody></table></div></section>';
  const inMonth=d=>d&&d.getFullYear()===y&&d.getMonth()===m;
  const ing=all.filter(p=>inMonth(p.fing)),nov=ST.book.nov.filter(n=>inMonth(n.fecha));
  const noAct={};all.filter(p=>p.estado!=="ACTIVO").forEach(p=>{noAct[p.estado]=(noAct[p.estado]||0)+1;});
  h+='<section class="panel"><h3>Movimientos del mes de corte</h3><p style="margin:0 0 8px">Ingresos: <strong>'+ing.length+'</strong>'+(ing.length?' ('+ing.map(p=>esc(p.codigo)).join(", ")+')':'')+'. Fuera de seguimiento activo: '+(Object.keys(noAct).length?Object.entries(noAct).map(([k,v])=>esc(k.toLowerCase())+' '+v).join(", "):'ninguno')+'.</p>';
  h+=nov.length?'<div class="tablebox"><table><thead><tr><th>Fecha</th><th>Paciente</th><th>Novedad</th><th>Detalle</th></tr></thead><tbody>'+nov.map(n=>'<tr><td class="mono">'+fd(n.fecha)+'</td><td>'+esc(n.c)+'</td><td>'+esc(n.tipo.toLowerCase())+'</td><td>'+esc(n.det)+'</td></tr>').join("")+'</tbody></table></div>':'<p class="note" style="margin:0">Sin novedades registradas en el mes.</p>';
  h+='</section>';
  h+='<details class="panel"><summary>Listado de pacientes activos ('+N+')</summary><div class="tablebox"><table><thead><tr><th>Paciente</th><th>EPS</th><th>Contacto</th><th>Grupo</th><th>Estadio</th><th>TFGe</th><th>RCV</th><th>Última valoración</th><th>Próximo control</th><th></th></tr></thead><tbody>'+
    S.slice().sort((a,b)=>(b.c.grupo||0)-(a.c.grupo||0)).map(s=>{const ct=s.items.find(i=>i.grp==="Médico");return'<tr><td>'+pname(s)+'</td><td>'+esc(epsShort(s.p.eps))+'</td><td>'+contact(s)+'</td><td>'+grpTag(s)+'</td><td class="mono">'+stage(s)+'</td><td class="mono">'+(s.d.tfg!=null?Math.round(s.d.tfg):"—")+'</td><td>'+esc(s.rcv&&s.rcv.main?s.rcv.main.txt:"—")+'</td><td class="mono">'+(s.lv?fd(s.lv.fecha):"—")+'</td><td class="mono">'+(ct&&ct.due?fd(ct.due):"Sin registro")+'</td><td>'+openBtn(s)+'</td></tr>';}).join("")+'</tbody></table></div></details>';
  out.innerHTML=h;
  EXPORTS.car=()=>{const L=x=>Object.entries(x).sort((a,b)=>b[1]-a[1]).map(([k,v])=>[k,v,pcts(v,N)]);const T=(t,o)=>[[t,"n","%"]].concat(L(o));
    const det=[["Código","Nombre","EPS","Sexo","Edad","Municipio","HTA","DM","ECV","Tipo de población CAC","Grupo","Estadio","TFGe","RAC","KFRE 2 a %","KFRE 5 a %","RCV","Causa ERC"]];
    S.forEach(s=>det.push([s.p.codigo,s.p.nombre,s.p.eps,s.p.sexo,s.d.edad,s.p.municipio,s.d.hta?"SI":"NO",s.d.dmTipo||"NO",s.p.ecv?"SI":"NO",(s.pops.find(p=>/^ERC|^S|^HDM/.test(p))||""),s.c.grupo||"",stage(s),s.d.tfg!=null?Math.round(s.d.tfg):"",s.d.rac==null?"":s.d.rac,s.c.kfre?Math.round(s.c.kfre.r2*1000)/10:"",s.c.kfre?Math.round(s.c.kfre.r5*1000)/10:"",s.rcv&&s.rcv.main?s.rcv.main.txt:"",s.d.causa||""]));
    saveXlsx("Caracterizacion_nefro_"+iso(ST.corte)+(epsSel()?"_"+epsShort(epsSel()).replace(/\s+/g,""):"")+".xlsx",[["Tipo de población",T("Tipo de población CAC",tp)],["Riesgo",T("KFRE",kf).concat([[]]).concat(T("Riesgo cardiovascular",rc))],["Demografía",T("Sexo",sx).concat([[]]).concat(T("Edad",ag)).concat([[]]).concat(T("Municipio",mu))],["Pacientes",det]]);};
}

/* ---------- Gestión: mes en curso (programado frente a realizado) y próximo mes ---------- */
function rGes(out){
  let h='<div class="seg epsseg" role="group" aria-label="Mes"><button type="button" data-gsub="act" aria-pressed="'+(ST.gesSub==="act")+'">Mes en curso</button><button type="button" data-gsub="prox" aria-pressed="'+(ST.gesSub==="prox")+'">Próximo mes</button></div><div id="gesin"></div>';
  out.innerHTML=h;const inn=$("gesin");if(ST.gesSub==="prox")rMes(inn);else rMesAct(inn);
  out.querySelectorAll("[data-gsub]").forEach(b=>b.addEventListener("click",()=>{ST.gesSub=b.dataset.gsub;renderMg("coh");}));}
/* Atenciones programadas frente a atendidas (agenda): meta institucional 95 % */
function atProg(de,ha,eps){const C=ST.book.cit.filter(c=>c.fecha>=de&&c.fecha<=ha&&(!eps||(pOf(c.c)||{}).eps===eps));
  const by={};C.forEach(c=>{const k=c.serv;(by[k]=by[k]||{prog:0,at:0,inas:0,canc:0,noat:0,sin:0});const b=by[k];b.prog++;if(c.estado==="ATENDIDA")b.at++;else if(c.estado==="INASISTENCIA")b.inas++;else if(c.estado==="CANCELADA")b.canc++;else if(c.estado==="NO ATENDIDA")b.noat++;else b.sin++;});
  const T={prog:0,at:0,inas:0,canc:0,noat:0,sin:0};Object.values(by).forEach(b=>Object.keys(T).forEach(k=>T[k]+=b[k]));return{by,T,pc:T.prog?T.at/T.prog*100:null};}
function rMesAct(out){
  const S=filtered(),c=ST.corte,de=new Date(c.getFullYear(),c.getMonth(),1),fin=new Date(c.getFullYear(),c.getMonth()+1,0);
  const mesTxt=de.toLocaleDateString("es-CO",{month:"long",year:"numeric"});
  const act={};const add=(k,f)=>{(act[k]=act[k]||{hecho:0,pend:0,venc:0,sin:0});act[k][f]++;};const pac=[];
  S.forEach(s=>{const L=[];s.items.forEach(it=>{const nm=it.tipo==="Laboratorio"?"Laboratorio · "+it.nombre:it.nombre;
    if(it.last&&it.last>=de&&it.last<=c){add(nm,"hecho");return;}if(!it.due){add(nm,"sin");L.push(it.nombre+" (sin registro)");return;}if(it.due<de){add(nm,"venc");L.push(it.nombre+" (vencido "+fd(it.due)+")");return;}if(it.due<=fin){add(nm,"pend");L.push(it.nombre+" (vence "+fd(it.due)+")");}});if(L.length)pac.push([s,L]);});
  const tot=Object.values(act).reduce((a,x)=>({hecho:a.hecho+x.hecho,pend:a.pend+x.pend,venc:a.venc+x.venc,sin:a.sin+x.sin}),{hecho:0,pend:0,venc:0,sin:0});
  const progT=tot.hecho+tot.pend+tot.venc+tot.sin;
  const A=atProg(de,c,epsSel()&&epsSel()!=="sin"?epsSel():"");
  let h=head("Control del mes en curso · "+mesTxt,"Del 1 de "+de.toLocaleDateString("es-CO",{month:"long"})+" al corte "+fd(c)+". Programado = realizado en el mes + lo que vence en el mes + lo vencido de meses anteriores + lo nunca registrado. Las citas cuentan aparte, por agenda.",'<button class="btn" data-x="mesact">Exportar</button>');
  h+=epsSeg();
  h+='<section class="panel"><h3>Atenciones programadas frente a atendidas (agenda del mes hasta el corte)</h3><div class="tiles">'+tile("Programadas",A.T.prog,"")+tile("Atendidas",A.T.at,"")+tile("Cumplimiento",A.pc==null?"—":String(Math.round(A.pc*10)/10).replace(".",",")+" %",A.pc==null?"":A.pc>=95?"":"bad")+tile("No asistió",A.T.inas,A.T.inas?"warn":"")+tile("Canceladas",A.T.canc,"")+tile("Sin desenlace registrado",A.T.sin,A.T.sin?"warn":"")+'</div>';
  h+='<div class="bar95" style="margin:10px 0 4px" title="Meta institucional 95 %"><span style="width:'+Math.min(100,Math.round(A.pc||0))+'%"></span><i></i></div><p class="note" style="margin:0 0 8px">Meta institucional ≥ 95 % (Coordinación Asistencial). Definición operativa: citas con fecha en el mes hasta el corte, en cualquier estado (incluidas canceladas), frente a citas atendidas. Pendiente de aprobación formal de la ficha.</p>';
  h+='<div class="tablebox"><table><thead><tr><th>Servicio</th><th>Programadas</th><th>Atendidas</th><th>%</th><th>No asistió</th><th>Canceladas</th><th>Llegó, no atendida</th><th>Sin desenlace</th></tr></thead><tbody>'+Object.entries(A.by).sort((a,b)=>b[1].prog-a[1].prog).map(([k,b])=>'<tr><td>'+esc(AG_SN(k))+'</td><td class="mono">'+b.prog+'</td><td class="mono">'+b.at+'</td><td class="mono"><span class="pc '+(b.at/b.prog*100>=95?"ok":"bad")+'">'+Math.round(b.at/b.prog*100)+' %</span></td><td class="mono">'+b.inas+'</td><td class="mono">'+b.canc+'</td><td class="mono">'+b.noat+'</td><td class="mono">'+b.sin+'</td></tr>').join("")+'</tbody></table></div></section>';
  h+='<section class="panel"><h3>Plan de cuidado del mes</h3><div class="tiles">'+tile("Actividades del mes",progT,"")+tile("Realizadas",tot.hecho,"")+tile("Pendientes que vencen en el mes",tot.pend,tot.pend?"warn":"")+tile("Vencidas de meses previos",tot.venc,tot.venc?"bad":"")+tile("Nunca registradas",tot.sin,tot.sin?"warn":"")+tile("Avance",progT?String(pcts(tot.hecho,progT)).replace(".",",")+" %":"—","")+'</div>';
  h+='<div class="tablebox" style="margin-top:10px"><table><thead><tr><th>Actividad</th><th>Realizadas</th><th>Pendientes del mes</th><th>Vencidas previas</th><th>Sin registro</th><th>Avance</th></tr></thead><tbody>'+Object.entries(act).sort((a,b)=>a[0].localeCompare(b[0])).map(([k,x])=>{const t=x.hecho+x.pend+x.venc+x.sin;return'<tr><td>'+esc(k)+'</td><td class="mono">'+x.hecho+'</td><td class="mono">'+x.pend+'</td><td class="mono" style="color:'+(x.venc?"var(--bad)":"inherit")+'">'+x.venc+'</td><td class="mono">'+x.sin+'</td><td class="mono">'+(t?Math.round(x.hecho/t*100)+" %":"—")+'</td></tr>';}).join("")+'</tbody></table></div></section>';
  h+='<details class="panel"><summary>Pacientes con actividades pendientes este mes ('+pac.length+')</summary><div class="tablebox"><table><thead><tr><th>Paciente</th><th>EPS</th><th>Contacto</th><th>Pendiente</th><th></th></tr></thead><tbody>'+pac.slice(0,400).map(([s,L])=>'<tr><td>'+pname(s)+'</td><td>'+esc(epsShort(s.p.eps))+'</td><td>'+contact(s)+'</td><td><div class="chs">'+L.map(t=>'<span class="ch'+(/vencido|sin registro/.test(t)?" venc":"")+'">'+esc(t)+'</span>').join("")+'</div></td><td>'+openBtn(s)+'</td></tr>').join("")+'</tbody></table></div></details>';
  out.innerHTML=h;
  EXPORTS.mesact=()=>{const a1=[["Actividad","Realizadas","Pendientes del mes","Vencidas previas","Sin registro"]].concat(Object.entries(act).map(([k,x])=>[k,x.hecho,x.pend,x.venc,x.sin]));
    const a2=[["Servicio","Programadas","Atendidas","%","No asistió","Canceladas","Llegó no atendida","Sin desenlace"]].concat(Object.entries(A.by).map(([k,b])=>[AG_SN(k),b.prog,b.at,Math.round(b.at/b.prog*1000)/10,b.inas,b.canc,b.noat,b.sin]));
    const a3=[["Código","Nombre","EPS","Teléfono","Pendiente"]].concat(pac.map(([s,L])=>[s.p.codigo,s.p.nombre,s.p.eps,s.p.tel,L.join("; ")]));
    saveXlsx("Mes_en_curso_"+iso(c)+".xlsx",[["Plan del mes",a1],["Agenda programada vs atendida",a2],["Pacientes pendientes",a3]]);};
}

/* ---------- Auditoría de adherencia a guías de práctica clínica ---------- */
const AUDREF={ERC:"KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of CKD. Kidney Int. 2024;105(4S):S117–S314.",
  HTA:"Mancia G, et al. 2023 ESH Guidelines for the management of arterial hypertension. J Hypertens. 2023;41:1874–2071 · Whelton PK, et al. 2017 ACC/AHA Guideline for high blood pressure in adults. Hypertension. 2018;71:e13–e115.",
  DM:"American Diabetes Association. Standards of Care in Diabetes—2025. Diabetes Care. 2025;48(Suppl 1)."};
const ia=(s,code)=>{const i=s.ind[code];return i?(i.ok?"CUMPLE":"NO CUMPLE"):"NO APLICA";};
const AUD={
 ERC:{n:"Enfermedad renal crónica (KDIGO 2024)",elig:s=>s.c.erc==="si"||["G3a","G3b","G4","G5"].includes(s.c.G),cr:[
  {id:"ERC-1",t:"TFGe (CKD-EPI 2021) y RAC en los últimos 12 meses",r:"KDIGO 2024, cap. 1 y 2: TFGe y albuminuria para clasificar y vigilar.",f:s=>ia(s,"nefro_39")},
  {id:"ERC-2",t:"Causa de la ERC registrada (clasificación CGA)",r:"KDIGO 2024, cap. 1: clasificar por causa, TFG y albuminuria.",f:s=>s.d.causa&&s.d.causa!=="desc"?"CUMPLE":"NO CUMPLE"},
  {id:"ERC-3",t:"IECA o ARA II con HTA o DM y RAC > 30 mg/g",r:"KDIGO 2024, cap. 3 (bloqueo del SRAA con albuminuria).",f:s=>ia(s,"nefro_34")},
  {id:"ERC-4",t:"iSGLT2 en DM2 con TFGe ≥ 20",r:"KDIGO 2024, cap. 3 (iSGLT2, 1A).",f:s=>ia(s,"nefro_38")},
  {id:"ERC-5",t:"Estatina en ≥ 50 años con TFGe < 60 sin diálisis",r:"KDIGO 2013 de lípidos en ERC, rec. 1A; KDIGO 2024, cap. 3.",f:s=>ia(s,"nefro_29")},
  {id:"ERC-6",t:"Riesgo de falla renal (KFRE) documentado en G3–G5",r:"KDIGO 2024, cap. 2 (ecuación de riesgo validada).",f:s=>ia(s,"KFRE_DOC")},
  {id:"ERC-7",t:"Potasio controlado en el año si recibe IECA/ARA II",r:"KDIGO 2024, cap. 3 (vigilar potasio y creatinina con SRAA).",f:s=>["est","aj"].includes(s.d.meds.raas)?(s.last&&s.last("k")&&NP.days(s.last("k").fecha,ST.corte)<=365?"CUMPLE":"NO CUMPLE"):"NO APLICA"},
  {id:"ERC-8",t:"Valoración por nefrología si tiene criterio de remisión",r:"KDIGO 2024, cap. 5 (criterios de remisión).",f:s=>ia(s,"nefro_33")},
  {id:"ERC-9",t:"Revisión de nefrotóxicos (AINE y otros) documentada en la HC",r:"KDIGO 2024, cap. 4 (seguridad de medicamentos).",m:true},
  {id:"ERC-10",t:"Educación para el automanejo en el último año",r:"KDIGO 2024, cap. 3 (educación estructurada).",f:s=>s.d.at.edu?"CUMPLE":"NO CUMPLE"}]},
 HTA:{n:"Hipertensión arterial (ESH 2023 · ACC/AHA 2017)",elig:s=>s.d.hta,cr:[
  {id:"HTA-1",t:"PA registrada en los últimos 6 meses",r:"ESH 2023 y ACC/AHA 2017: medir la PA en cada control.",f:s=>s.lv&&s.lv.pas!=null&&NP.days(s.lv.fecha,ST.corte)<=180?"CUMPLE":"NO CUMPLE"},
  {id:"HTA-2",t:"PA en la meta del programa (< 140/90 o < 130/80 según perfil)",r:"ACC/AHA 2017 y ADA 2025 (< 130/80 con DM o ERC); ESH 2023.",f:s=>s.d.pas==null?"NO CUMPLE":(s.d.pas<s.P.goals.pa[0]&&s.d.pad<s.P.goals.pa[1]?"CUMPLE":"NO CUMPLE")},
  {id:"HTA-3",t:"Control cada mes mientras la PA estuvo fuera de meta",r:"ACC/AHA 2017: seguimiento mensual tras iniciar o ajustar hasta el control (clase I).",m:true},
  {id:"HTA-4",t:"Creatinina/TFGe y RAC en el último año",r:"ESH 2023: evaluación de daño renal mediado por HTA.",f:s=>ia(s,"nefro_39")},
  {id:"HTA-5",t:"Perfil lipídico en el último año",r:"ESH 2023: evaluación del riesgo cardiovascular global.",f:s=>ia(s,"nefro_04")},
  {id:"HTA-6",t:"IECA o ARA II si RAC ≥ 30 mg/g",r:"ESH 2023; KDIGO 2024.",f:s=>s.d.rac!=null&&s.d.rac>=30?(["est","aj"].includes(s.d.meds.raas)?"CUMPLE":"NO CUMPLE"):"NO APLICA"},
  {id:"HTA-7",t:"Electrocardiograma de 12 derivaciones registrado",r:"ESH 2023: ECG en todo paciente hipertenso.",m:true},
  {id:"HTA-8",t:"Consejería en sal, actividad física, tabaco y alcohol documentada",r:"ESH 2023 y ACC/AHA 2017: intervenciones de estilo de vida.",m:true},
  {id:"HTA-9",t:"Riesgo cardiovascular estimado en el último año",r:"ESH 2023; ESC 2021 (escala calibrada para el país).",f:s=>ia(s,"nefro_42")}]},
 DM:{n:"Diabetes mellitus (ADA 2025)",elig:s=>s.d.dm,cr:[
  {id:"DM-1",t:"HbA1c en los últimos 6 meses",r:"ADA 2025, sección 6: al menos 2 veces al año.",f:s=>ia(s,"nefro_02")},
  {id:"DM-2",t:"HbA1c en la meta individual del programa",r:"ADA 2025, sección 6 (meta individualizada).",f:s=>s.d.hba1c==null?"NO CUMPLE":(s.d.hba1c<s.P.goals.a1c?"CUMPLE":"NO CUMPLE")},
  {id:"DM-3",t:"RAC y TFGe en el último año",r:"ADA 2025, sección 11: tamizaje anual de ERC.",f:s=>ia(s,"nefro_39")},
  {id:"DM-4",t:"Perfil lipídico en el último año",r:"ADA 2025, sección 10.",f:s=>ia(s,"nefro_04")},
  {id:"DM-5",t:"Estatina entre 40 y 75 años",r:"ADA 2025, sección 10 (estatina de intensidad moderada).",f:s=>s.d.edad!=null&&s.d.edad>=40&&s.d.edad<=75?(["est","aj"].includes(s.d.meds.stat)?"CUMPLE":"NO CUMPLE"):"NO APLICA"},
  {id:"DM-6",t:"iSGLT2 en DM2 con ERC y TFGe ≥ 20",r:"ADA 2025, sección 11; KDIGO 2022 de DM en ERC.",f:s=>ia(s,"nefro_38")},
  {id:"DM-7",t:"PA < 130/80 mmHg",r:"ADA 2025, sección 10.",f:s=>s.d.pas==null?"NO CUMPLE":(s.d.pas<130&&s.d.pad<80?"CUMPLE":"NO CUMPLE")},
  {id:"DM-8",t:"Examen integral de pies en el último año",r:"ADA 2025, sección 12: al menos anual.",m:true},
  {id:"DM-9",t:"Examen de retina vigente (cada 1–2 años sin retinopatía; anual con retinopatía)",r:"ADA 2025, sección 12.",m:true},
  {id:"DM-10",t:"Vacuna de influenza en el último año",r:"ADA 2025, sección 4.",f:s=>ia(s,"nefro_32")}]}};
ST.audSel=null;ST.audG="ERC";ST.audN=10;
function rAud(out){
  const S=filtered();const G=AUD[ST.audG];const elig=S.filter(G.elig);const A=ST.aud||[];
  let h=head("Auditoría de adherencia a guías","Evalúa una muestra de historias del programa contra criterios de la guía. Los criterios automáticos salen del libro; los manuales los marca el auditor revisando la HC en SIIS. El resultado se guarda en la hoja Auditoria_GPC del libro.",'<button class="btn" data-x="audexp">Exportar auditorías</button>');
  h+='<section class="panel"><div class="row3"><label class="f">Guía<select id="audg">'+Object.entries(AUD).map(([k,g])=>'<option value="'+k+'"'+(k===ST.audG?" selected":"")+'>'+esc(g.n)+'</option>').join("")+'</select></label><label class="f">Tamaño de la muestra<input type="text" id="audn" inputmode="numeric" value="'+ST.audN+'"></label><label class="f">Auditor *<input type="text" id="audu" value="'+esc(AST.user)+'" placeholder="Nombre y cargo"></label></div>';
  h+='<p class="note" style="margin:8px 0">Pacientes que aplican con los filtros actuales: <strong>'+elig.length+'</strong>. Referencia: '+esc(AUDREF[ST.audG])+'</p><div class="copyrow"><button type="button" class="btn primary" id="audgen">Generar muestra aleatoria</button>'+(ST.audSel?'<button type="button" class="btn" id="audclr">Descartar muestra</button>':'')+'</div></section>';
  if(ST.audSel){const sm=ST.audSel.codes.map(c=>ST.smap[c]).filter(Boolean);
    h+='<section class="panel"><h3>Muestra · '+esc(AUD[ST.audSel.g].n)+' · '+sm.length+' historias</h3><p class="note" style="margin:0 0 8px">Marque los criterios manuales después de revisar la HC. «Automático» = calculado con el libro al corte '+fd(ST.corte)+'.</p>';
    sm.forEach(s=>{h+='<details class="hist" open><summary>'+esc(s.p.codigo)+' · '+esc(s.p.nombre||"")+' · '+esc(epsShort(s.p.eps))+' · '+esc(stage(s))+'</summary>'+AUD[ST.audSel.g].cr.map(c=>{const auto=c.m?null:c.f(s);return'<div class="audc"><span>'+esc(c.id+" · "+c.t)+'<span class="sub">'+esc(c.r)+'</span></span>'+(c.m?'<select data-audm="'+esc(s.p.codigo+"|"+c.id)+'"><option value="">Sin evaluar</option><option>CUMPLE</option><option>NO CUMPLE</option><option>NO APLICA</option></select>':'<span class="st '+(auto==="CUMPLE"?"ok":auto==="NO CUMPLE"?"no":"na")+'">'+esc(auto.toLowerCase())+' · automático</span>')+'</div>';}).join("")+'<label class="f" style="margin-top:6px">Observación<input type="text" data-audo="'+esc(s.p.codigo)+'"></label></details>';});
    h+='<div class="copyrow" style="margin-top:10px"><button type="button" class="btn primary" id="audsave">Guardar auditoría en el libro</button><span class="note" id="audmsg"></span></div></section>';}
  /* consolidado */
  const by={};A.forEach(r=>{if(r.Resultado==="NO APLICA"||!r.Resultado)return;const k=r.Guia+"|"+r.Criterio;(by[k]=by[k]||{g:r.Guia,c:r.Criterio,t:r.Descripcion,ok:0,n:0});by[k].n++;if(r.Resultado==="CUMPLE")by[k].ok++;});
  const gs={};Object.values(by).forEach(x=>{(gs[x.g]=gs[x.g]||{ok:0,n:0});gs[x.g].ok+=x.ok;gs[x.g].n+=x.n;});
  const hist=[...new Set(A.map(r=>r.ID))];
  h+='<section class="panel"><h3>Adherencia acumulada ('+hist.length+' auditorías de historia)</h3>'+(A.length?'<div class="tiles">'+Object.entries(gs).map(([g,x])=>tile((AUD[g]||{n:g}).n,Math.round(x.ok/x.n*100)+" %",x.ok/x.n>=0.8?"":"warn")).join("")+'</div><div class="tablebox" style="margin-top:10px"><table><thead><tr><th>Guía</th><th>Criterio</th><th>Cumple</th><th>Evaluados</th><th>Adherencia</th></tr></thead><tbody>'+Object.values(by).sort((a,b)=>a.g.localeCompare(b.g)||a.c.localeCompare(b.c,undefined,{numeric:true})).map(x=>'<tr><td>'+esc(x.g)+'</td><td>'+esc(x.c+" · "+x.t)+'</td><td class="mono">'+x.ok+'</td><td class="mono">'+x.n+'</td><td class="mono"><span class="pc '+(x.ok/x.n>=0.8?"ok":x.ok/x.n>=0.6?"warn":"bad")+'">'+Math.round(x.ok/x.n*100)+' %</span></td></tr>').join("")+'</tbody></table></div><p class="note" style="margin:8px 0 0">Adherencia = cumple / (cumple + no cumple); «no aplica» y «sin evaluar» no cuentan. El color (≥ 80 % verde, 60–79 % amarillo) es una referencia de lectura, no una meta adoptada.</p>':'<p class="note">Sin auditorías guardadas en este libro.</p>')+'</section>';
  out.innerHTML=h;
  $("audg").addEventListener("change",e=>{ST.audG=e.target.value;renderMg("aud");});
  $("audn").addEventListener("change",e=>{ST.audN=Math.max(1,Math.min(200,parseInt(e.target.value,10)||10));});
  $("audu").addEventListener("input",e=>{AST.user=e.target.value;try{localStorage.setItem("nefro_usuario",AST.user);}catch(x){}});
  $("audgen").addEventListener("click",()=>{const L=filtered().filter(AUD[ST.audG].elig).map(s=>s.p.codigo);for(let i=L.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[L[i],L[j]]=[L[j],L[i]];}ST.audSel={g:ST.audG,codes:L.slice(0,ST.audN)};renderMg("aud");});
  if($("audclr"))$("audclr").addEventListener("click",()=>{ST.audSel=null;renderMg("aud");});
  if($("audsave"))$("audsave").addEventListener("click",()=>{if(!AST.user.trim()){$("audmsg").textContent="Escriba el nombre del auditor.";return;}
    const g=ST.audSel.g;const now=iso(new Date());let n=0;const base=(ST.aud||[]).length;
    ST.audSel.codes.forEach((code,ix)=>{const s=ST.smap[code];if(!s)return;const id="AUD-"+now.replace(/-/g,"")+"-"+String(base+ix+1).padStart(4,"0");const obs=(out.querySelector('[data-audo="'+code+'"]')||{}).value||"";
      AUD[g].cr.forEach(c=>{let res,src;if(c.m){res=(out.querySelector('[data-audm="'+code+"|"+c.id+'"]')||{}).value||"";src="MANUAL";}else{res=c.f(s);src="AUTOMATICO";}
        (ST.aud=ST.aud||[]).push({ID:id,Fecha:fd(new Date()),Auditor:AST.user,Guia:g,Codigo:code,EPS:s.p.eps,Criterio:c.id,Descripcion:c.t,Resultado:res,Fuente:src,Observacion:obs});});n++;});
    ST.dirty=true;ST.audSel=null;bookInfo();renderMg("aud");toast("Auditoría guardada: "+n+" historias. Descargue el libro para conservarla.");});
  EXPORTS.audexp=()=>{const H=["ID","Fecha","Auditor","Guia","Codigo","EPS","Criterio","Descripcion","Resultado","Fuente","Observacion"];const res=[["Guía","Criterio","Descripción","Cumple","Evaluados","Adherencia %"]].concat(Object.values(by).map(x=>[x.g,x.c,x.t,x.ok,x.n,Math.round(x.ok/x.n*1000)/10]));
    const crit=[["Guía","Criterio","Descripción","Tipo","Referencia"]];Object.entries(AUD).forEach(([g,G])=>G.cr.forEach(c=>crit.push([g,c.id,c.t,c.m?"Manual":"Automático",c.r])));
    saveXlsx("Auditoria_adherencia_GPC_"+iso(ST.corte)+".xlsx",[["Resumen",res],["Detalle",[H].concat((ST.aud||[]).map(r=>H.map(h=>r[h])))],["Criterios",crit],["Referencias",Object.entries(AUDREF).map(([k,v])=>[k,v])]]);};
}

/* ---------- Nominal mensual por EPS (CAC / EPS) ---------- */
/* Encabezados tomados de los archivos de ejemplo que entregó la coordinación (11-oct-2026). Los valores codificados (sí/no, estadio,
   comodines) no se inventan: salen del arrastre del nominal anterior o de la tabla de codificación que diligencie el programa con el
   instructivo vigente. TFG del nominal = Cockcroft-Gault, como lo piden los encabezados; la estadificación clínica usa CKD-EPI 2021. */
const NOM_FAM_H=["Campo 1 Primer nombre del usuario","Campo 2 Segundo nombre del usuario","Campo 3 Primer apellido del usuario","Campo 4 Segundo apellido del usuario","Campo 5 Tipo de Identificación del usuario","Campo 6 Número de Identificación del usuario","Campo 7 Fecha de nacimiento","Campo 8 Sexo","Campo 9 Régimen de afiliación AL SGSS","Campo 10 Código de la EPS o de la entidad territorial","Campo 11 Código pertenencia étnica","Campo 12 Grupo poblacional","Campo 13 Municipio de residencia","Campo 14 número telefónico del paciente (incluyendo a familiares y cuidadores)","Campo 15 Fecha de afiliación a la EPS que registra","Campo 16 Código de la IPS donde se hace seguimiento al usuario","Campo 17 Fecha de ingreso al programa de atención renal (renoprotección, nefroprotección, protección renal, prediálisis) dentro de la EAPB/Ente territorial que reporta","Campo 18 El usuario tiene diagnóstico confirmado de Hipertensión Arterial -HTA (CIE-10 con códigos entre I10-I159)","Campo 19 Fecha de diagnostico de la Hipertension Arterial","Campo 19.1 Costo HTA durante el período de reporte","Campo 20 El usuario tiene diagnóstico confirmado de Diabetes Mellitus- DM (CIE-10 con códigos entre E10-E149; O24-O249; P702)","Campo 21 Fecha de diagnostico de la Diabetes Mellitus","Campo 21.1 Costo DM durante el período de reporte","Campo 22 Etiología de la ERC","Campo 23 Peso (kg)","Campo 24 Talla (cm)","Campo 25 Tensión arterial sistólica (mm de Hg)","Campo 26 Tensión arterial diastólica (mm de Hg)","Campo 27 Creatinina (mg/dl)","Campo 27.1 Fecha de última Creatinina","Campo 28 Hemoglobina Glicosilada","Campo 28.1 Fecha de última Hemoglobina Glicosilada","Campo 29 Albuminuria","Campo 29.1 Fecha de la última Albuminuria","Campo 30 Relación Albuminuria/Creatinuria","Campo 30.1 Fecha de la última Creatinuria","Campo 31 Colesterol total","Campo 31.1 Fecha de la último Colesterol total","Campo 32 HDL","Campo 32.1 Fecha de la último HDL","Campo 33 LDL","Campo 33.1 Fecha del último LDL","Campo 34 PTH","Campo 34.1 Fecha de la última PTH","Campo 35 Tasa de filtración glomerular (TFGe) según Cockroft-Gault (en adultos) y Swhartz (en menores de 18 años) o FRR estimada mediante el cálculo del Kru, dentro del periodo del reporte","Campo 36 El usuario recibe Inhibidor de la Enzima convertidora de angiotensina (IECA)","Campo 37 El usuario recibe Inhibidor de la Enzima convertidora de angiotensina (IECA)","Campo 38 El usuario tiene diagnóstico de enfermedad renal crónica en cualquier de sus estadios","Campo 39 Estadio de ERC (Enfermedad Renal: Ver las notas finales numeral V)","Campo 40 Fecha de diagnóstico de ERC estadio 5 (Solo aplica si marco la opción 5 de la pregunta anterior)","Campo 41 La persona se encuentra en un programa de atención de ERC (renoprotección, nefroprotección, protección renal, prediálisis)","Campo 42 TFG a la fecha, en que el usuario inicio la primera terapia de reemplazo renal -TRR","Campo 43 Modo de Inicio de la Terapia de Reemplazo Renal (primera TRR)","Campo 44 Fecha en que se inicio la terapia de reemplazo renal que recibe el usuario en el momento de la fecha de corte. Sí el Trasplante es la terapia reportada, esta Fecha se refiere a la Fecha de trasplante","Campo 45 Fecha de Ingreso a la Unidad Renal Actual que le presta el servicio en el momento de la fecha de corte, en cualquier modalidad de terapia dialítica (Unidad Actual)","Campo 46 Hemodiálisis (HD)","Campo 47 Dosis de diálisis (Kt/V) single pool","Campo 48 Costo total de la hemodiálisis HD durante el período de reporte","Campo 49 Diálisis peritoneal (DP)","Campo 50 Dosis de diálisis (Kt/V) dpd. KTV/dpd: de máximo cuatro meses de antigüedad contados a partir de la fecha de corte","Campo 51 Numero de horas de hemodiálisis","Campo 52 Peritonitis","Campo 53 Costo DP durante el período de reporte","Campo 54 Vacuna Hepatitis B","Campo 55 Registre la fecha de diagnóstico de la infección por Hepatitis B, si el usuario la ha presentado","Campo 56 Registre la fecha de diagnóstico de la infección por Hepatitis C, si el usuario la ha presentado","Campo 57 Terapia no Dialítica para ERC estadio 5 (también llamada tratamiento médico de nefroproteción)","Campo 58 Costo de la terapia ERC estadio 5 con tratamiento médico","Campo 59 Hemoglobina. (aplica solo cuando el usuario está en diálisis). Las hemoglobinas deben ser del último trimestre contado a partir de la fecha de corte y sus tomas debieron ser pre-diálisis en personas en hemodiálisis","Campo 60 Albúmina Sérica (aplica solo cuando el usuario está en diálisis). La albúmina debe tener máximo tres meses de antigüedad a partir de la fecha de corte y su toma debió ser pre-diálisis en personas en hemodiálisis","Campo 61 Fósforo (P) (aplica solo cuando el usuario está en diálisis). Los niveles séricos de fósforo deben ser del último trimestre contado a partir de la fecha de corte y sus tomas debieron ser pre-diálisis en personas en hemodiálisis","Campo 62 Última valoración clínica por nefrología dentro del periodo de reporte de pacientes con ERC estadio 5 en diálisis o con TMND,en relación con la posibilidad de trasplante renal","Campo 62.1 ¿Se reportó cáncer activo en los últimos 12 meses, como contraindicación para el transplante renal, en la valoración de nefrología?","Campo 62.2 ¿Se reportó infección crónica o activa no tratada o no controlada hasta en los últimos tres meses antes de la fecha de corte, como contraindicación para el transplante renal, en la valoración de nefrología?","Campo 62.3 ¿Se reportó como contraindicación para el transplante renal, en la valoración de nefrología que el paciente NO ha manifestado su deseo de trasplantarse?","Campo 62.4 ¿Se reportó como contraindicación para el transplante renal, en la valoración de nefrología que el paciente presenta esperanza de vida menor o igual a 6 meses?","Campo 62.5 ¿Se reportó como contraindicación para el transplante renal, en la valoración de nefrología que el paciente presenta potenciales limitaciones al autocuidado y adherencia al tratamiento post trasplante?","Campo 62.6 ¿Se reportó enfermedad cardiaca, cerebrovascular o vascular periférica, como contraindicación para el transplante renal, en la valoración de nefrología?","Campo 62.7 ¿Se reportó infección por el VIH, como contraindicación para el transplante renal, en la valoración de nefrología?","Campo 62.8 ¿Se reportó infección por el VHC, como contraindicación para el transplante renal, en la valoración de nefrología?","Campo 62.9 ¿Se reportó como contraindicación para el transplante renal, en la valoración de nefrología, que el paciente presenta enfermedad inmunológica activa los últimos tres meses antes de la fecha de corte?","Campo 62.10 ¿Se reportó como contraindicación para el transplante renal, en la valoración de nefrología, que el paciente presenta enfermedad pulmonar crónica?","Campo 62.11 ¿Se reportó como contraindicación para el transplante renal, en la valoración de nefrología, que el paciente presenta otras enfermedades crónicas?","Campo 63 Fecha de Ingreso a lista de espera para la realización del trasplante","Campo 63.1 Registre el código de la IPS donde está en lista de espera","Campo 64 ¿El usuario ha recibido trasplante renal?","Campo 65 Código de la EPS que realizó el trasplante","Campo 66 Código de la IPS o Grupo de trasplante, que realizó el último trasplante renal","Campo 67 Tipo de donante","Campo 68 Costo del trasplante","Campo 69 ¿El usuario ha presentado alguna complicación relacionada con el trasplante renal?","Campo 69.1 Fecha de diagnóstico si ha presentado infección por Citomegalovirus","Campo 69.2 Fecha de diagnóstico si ha presentado infección por hongos","Campo 69.3 Fecha de diagnóstico si ha presentado infección por tuberculosis","Campo 69.4 Fecha de diagnóstico si ha presentado alguna complicación vascular","Campo 69.5 Fecha de diagnóstico si ha presentado alguna complicación urológica","Campo 69.6 Fecha de diagnóstico si ha presentado alguna complicación herida quirúrgica","Campo 69.7 Fecha del primer diagnóstico de cáncer","Campo 70 Cuantos médicamentos inmunosupresores se formularon para el manejo en este último corte","Campo 70.1 En algún momento, desde el último reporte hasta el reporte actual ha recibido metilprednisolona","Campo 70.2 En algún momento, desde el último reporte hasta el reporte actual ha recibido azatioprina","Campo 70.3 En algún momento, desde el último reporte hasta el reporte actual ha recibido ciclosporina","Campo 70.4 En algún momento, desde el último reporte hasta el reporte actual ha recibido micofenolato","Campo 70.5 En algún momento, desde el último reporte hasta el reporte actual ha recibido tacrolimus","Campo 70.6 En algún momento, desde el último reporte hasta el reporte actual ha recibido prednisona","Campo 70.7 En el periodo del reporte, el paciente ha recibido para el manejo de trasplante renal, medicamentos inmunosupresores no incluidos en las Campo iables 70.1 a 70.6 o no incluidos en el plan de beneficios (medicamento 1)","Campo 70.8 En el periodo del reporte, el paciente ha recibido para el manejo de trasplante renal, medicamentos inmunosupresores no incluidos en las Campo iables 70.1 a 70.6 o no incluidos en el plan de beneficios (medicamento 2)","Campo 70.9 En el periodo del reporte, el paciente ha recibido para el manejo de trasplante renal, medicamentos inmunosupresores no incluidos en las Campo iables 70.1 a 70.6 o no incluidos en el plan de beneficios (medicamento 3)","Campo 71 ¿Cuantos episodios de rechazo agudo en los últimos 12 meses al trasplante, confirmado por biopsia, ha presentado el usuario?","Campo 72 Fecha del primer rechazo del injerto","Campo 73 Fecha de retorno a diálisis","Campo 74 Número de trasplantes renales que ha recibido","Campo 75 Costo de la terapia postrasplante","Campo 76 Tiempo de prestación de servicios","Campo 77 Costo Total","Campo 78 Código de la EPS de origen","Campo 79 Novedad con respecto al reporte anterior","Campo 80 Causa de Muerte","Campo 80.1 Fecha de muerte","Campo 81 Código único de identificación BDUA","Campo 82 Fecha de Corte","Fecha de ultimo peso","Fecha ultima talla","Fecha de ultimos trigliceridos","Resultado de ultimos trigliceridos","Fecha de ultima TFG calculada y registrada en HC","Fecha de diagnostico de ERC (1-4)","Fecha ultima Hemoglobina","Fecha ultima Albúmina Sérica","Fecha ultima Fósforo","Fecha de ultima Valoración Clínica por nefrología","Fecha de ultima valoración médica del programa","Valoración Ultima Especialidad médica del programa","Fecha de ultima valoración médica Endocrinología","Fecha de ultima valoración médica Oftalmología o foto de retina","Fecha de ultima valoración Enfermería","Fecha de ultima valoración Nutrición","Fecha de ultima valoración Trabajo Social","Fecha de ultima valoración QF","Fecha de ultima valoración psicología","Fecha de ultimo parcial de orina","Resultado de ultimo parcial de orina","Circunferencia de cintura"];
const NOM_PRE_H=["Código de Habilitación (Es el código de la IPS ante la EPS)","Tipo de Identificación del usuario","Número de Identificación del usuario","Número telefónico del paciente","Fecha de solicitud de la cita reportada para valoración por Nefrología.","Fecha de asignación de la cita reportada para valoración por Nefrología","Fecha de la consulta realizada por parte de Nefrología (en el mes)","Fecha de la orden generada para la próxima consulta de Nefrología.","Peso (Kg) (Debe ser con el que se calculó la TFG)","Talla (cm) (Debe ser con el que se calculó la TFG)","Tensión arterial sistólica (mm de Hg)","Tensión arterial diastólica (mm de Hg)","Circunferencia Abdominal","Creatinina en Sangre (mg/dl) (Debe ser con la que se calculó la TFG)","Fecha creatinina (Debe ser con la que se calculó la TFG)","Tasa de filtración glomerular estimada (TFG) según Cockcroft- Gault (en adultos) o Swhartz (en niños)","Relación Albuminuria/Creatinuria (mg/g) (Solo reportar las pruebas que se tomen en el mes)","Fecha de la última Albuminuria/Creatinuria (mg/g)","Estadio Renal registrado en HC","Glicemia Basal (Solo reportar las pruebas que se tomen en el mes)","Fecha de Glicemia Basal","Hemoglobina glicosilada (%) (Solamente en personas con diagnóstico de Diabetes Mellitus)  (Solo reportar las pruebas que se tomen en el mes)","Fecha última hemoglobina glicosilada (Solamente en personas con diagnóstico de Diabetes Mellitus)","Colesterol Total (Solo reportar las pruebas que se tomen en el mes)","Fecha último colesterol total","Triglicéridos  (Solo reportar las pruebas que se tomen en el mes)","Fecha de Triglicéridos","Colesterol HDL  (Solo reportar las pruebas que se tomen en el mes)","Fecha último colesterol HDL","Colesterol LDL  (Solo reportar las pruebas que se tomen en el mes)","Fecha último colesterol LDL","Parathormona PTH (pg/mL)  (Solo reportar las pruebas que se tomen en el mes)","Fecha de la última parathormona PTH","Hemoglobina (Solo reportar las pruebas que se tomen en el mes)","Fecha de la última Hemoglobina","Albúmina sérica (g/dl)  (Solo reportar las pruebas que se tomen en el mes)","Fecha de la última Albúmina Sérica (g/dl)","Fósforo sérico (P) mg/dl  (Solo reportar las pruebas que se tomen en el mes)","Fecha de último Fósforo Sérico (P) mg/dl","Químico en Orina","Fecha de Químico en Orina","Creatinina en orina de 24 horas","Fecha de Creatinina en orina de 24 horas"];
const NOM_TMND_H=["Código de Habilitación (Es el código de la IPS ante la EPS)","Tipo de Identificación del usuario","Número de Identificación del usuario","Número telefónico del paciente","Fecha de solicitud de la cita reportada para valoración por Nefrología.","Fecha de asignación de la cita reportada para valoración por Nefrología","Fecha de la consulta realizada por parte de Nefrología (en el mes)","Fecha de la orden generada para la próxima consulta de Nefrología.","Peso (Kg) (Debe ser con el que se calculó la TFG)","Talla (cm) (Debe ser con el que se calculó la TFG)","Tensión arterial sistólica (mm de Hg)","Tensión arterial diastólica (mm de Hg)","Creatinina en Sangre (mg/dl) (Debe ser con la que se calculó la TFG)","Fecha creatinina (Debe ser con la que se calculó la TFG)","Tasa de filtración glomerular estimada (TFG) según Cockcroft- Gault (en adultos) o Swhartz (en niños)","Hemoglobina glicosilada (%) (Solamente en personas con diagnóstico de Diabetes Mellitus) (Solo reportar las pruebas que se tomen en el mes)","Fecha hemoglobina glicosilada (Solamente en personas con diagnóstico de Diabetes Mellitus) (Solo reportar las pruebas que se tomen en el mes)","Colesterol Total (Solo reportar las pruebas que se tomen en el mes)","Fecha último colesterol total (Solo reportar las pruebas que se tomen en el mes)","Triglicéridos (Solo reportar las pruebas que se tomen en el mes)","Fecha de Triglicéridos","Colesterol HDL (Solo reportar las pruebas que se tomen en el mes)","Fecha último colesterol HDL (Solo reportar las pruebas que se tomen en el mes)","Colesterol LDL (Solo reportar las pruebas que se tomen en el mes)","Fecha último colesterol LDL (Solo reportar las pruebas que se tomen en el mes)","Parathormona PTH (pg/mL) (Solo reportar las pruebas que se tomen en el mes)","Fecha de la última parathormona PTH (Solo reportar las pruebas que se tomen en el mes)","Hemoglobina (Solo reportar las pruebas que se tomen en el mes)","Fecha Hemoglobina (Solo reportar las pruebas que se tomen en el mes)","Albúmina sérica (g/dl) (Solo reportar las pruebas que se tomen en el mes)","Fecha Albumina (Solo reportar las pruebas que se tomen en el mes)","Fósforo sérico (P) mg/dl (Solo reportar las pruebas que se tomen en el mes)","Fecha Fosforo (Solo reportar las pruebas que se tomen en el mes)","Vacuna Hepatitis B","Resultado del Anticuerpos Hepatitis B","Fecha del Anticuerpos Hepatitis B","Fecha Valoración Trasplante (Solo en el mes)","Resultado valoración clínica por nefrología dentro del período de reporte de pacientes con ERC estadio 5 en diálisis o con TMND, en relación con la posibilidad de trasplante renal","¿Se reportó cáncer activo en los últimos 12 meses como contraindicación para el trasplante renal, en la valoración de nefrología?","¿Se reportó infección crónica o activa no tratada o no controlada hasta en los últimos tres meses antes de la fecha de corte, como contraindicación para el trasplante renal, en la valoración de nefrología?","¿Se reportó que el paciente ha manifestado su deseo de NO trasplantarse, como contraindicación para el trasplante en la valoración por nefrología?","¿Se reportó que el paciente tiene una esperanza de vida menor o igual a 6 meses, como contraindicación para el trasplante, en la valoración por nefrología?","¿Se reporto que el paciente presenta limitaciones potenciales para el autocuidado y adherencia al tratamiento post trasplante, como contraindicación para el trasplante renal, en la valoración por nefrología?","¿Se reportó enfermedad cardiaca, cerebrovascular o vascular periférica, como contraindicación para el trasplante renal, en la valoración de nefrología?","¿Se reportó infección por el VIH, como contraindicación para el trasplante renal, en la valoración de nefrología?","¿Se reportó infección por el VHC, como contraindicación para el trasplante renal, en la valoración de nefrología?","¿Se reportó que el paciente presenta enfermedad inmunológica activa los últimos tres meses antes de la fecha de corte, como contraindicación para el trasplante, en la valoración por nefrología?","¿Se reportó que el paciente presenta enfermedad pulmonar crónica, como contraindicación para el trasplante, en la valoración por nefrología?","¿Se reportó que el paciente presenta otras enfermedades crónicas, como contraindicación para el trasplante, en la valoración por nefrología?"];
const NOMF={FAM:{n:"EPS Familiar · nominal ERC (143 campos)",eps:"EPS Familiar de Colombia",H:NOM_FAM_H,sel:s=>true},PRE:{n:"Nueva EPS · prediálisis (43 campos)",eps:"Nueva EPS",H:NOM_PRE_H,sel:s=>s.p.terapia!=="tmnd"},TMND:{n:"Nueva EPS · TMND (49 campos)",eps:"Nueva EPS",H:NOM_TMND_H,sel:s=>s.p.terapia==="tmnd"}};
/* tabla de codificación: la diligencia el programa con el instructivo vigente (no se precarga) */
/* (v8) la tabla de codificación se retiró: los códigos de EPS Familiar salen del instructivo CAC de ERC */
ST.nomF="FAM";
function nomMonth(){const v=ST.nomMes||(()=>{const t=ST.corte;const p=new Date(t.getFullYear(),t.getMonth()-1,1);return p.getFullYear()+"-"+String(p.getMonth()+1).padStart(2,"0");})();ST.nomMes=v;const[y,m]=v.split("-").map(Number);return[new Date(y,m-1,1),new Date(y,m,0)];}
const isoD=d=>d?iso(d):"";
const n2=v=>v==null||v===""?"":Math.round(Number(v)*100)/100;
function nomRow(fmt,s,de,ha){
  const p=s.p,B=ST.book,lab=(B.L[p.codigo]||[]).filter(l=>l.fecha<=ha);const last=k=>{const L=lab.filter(l=>l.k===k);return L.length?L[L.length-1]:null;};const inM=l=>l&&l.fecha>=de&&l.fecha<=ha?l:null;
  const vals=(B.V[p.codigo]||[]).filter(v=>v.fecha<=ha);const lv=vals.length?vals[vals.length-1]:null;const lvp=[...vals].reverse().find(v=>v.peso&&v.talla)||null;
  const C=k=>(ST.ncfg||{})[k]||"";const yn=b=>b==null?undefined:(C(b?"SI":"NO")||undefined);
  const cr=last("creat");const age=cr&&p.fnac?COH.age(p.fnac,cr.fecha):null;const cg=cr&&lvp?RCV.cockcroft(cr.v,age,lvp.peso,p.sexo==="F"):null;
  const ats=(B.A[p.codigo]||[]).filter(a=>a.fecha<=ha&&a.estado==="REALIZADA");const lastAt=dis=>{const L=ats.filter(a=>a.dis===dis);return L.length?L[L.length-1].fecha:null;};
  const nefV=[...vals].reverse().find(v=>v.prof==="NEFROLOGIA");const lastNef=[nefV&&nefV.fecha,lastAt("NEFROLOGIA")].filter(Boolean).sort((a,b)=>b-a)[0]||null;
  const lastMed=lv?lv.fecha:null;
  const cit=((B.CI||{})[p.codigo]||[]).filter(c=>c.serv==="NEFROLOGIA");const citM=cit.filter(c=>c.estado==="ATENDIDA"&&c.fecha>=de&&c.fecha<=ha).pop()||null;const citNext=cit.filter(c=>c.fecha>ha&&(c.estado==="ASIGNADA"||c.estado==="EN SALA"))[0]||null;
  const G=s.c.G;const V={};
  if(fmt==="FAM"){
    /* Códigos del instructivo CAC de ERC (Res. 2463 de 2014; texto del formato FOMAG que ya usa Hemodiálisis). W() = valor por defecto
       del instructivo para «desconocido»: si el nominal anterior trae el dato, prevalece el arrastre. */
    const D1800="1800-01-01",D1845="1845-01-01",D1811="1811-01-01";const W=v=>({w:v});const set=(i,v)=>{V[i]=v;};
    const per0=new Date(ha.getFullYear()-1,ha.getMonth(),ha.getDate()+1);const inP=l=>l&&l.fecha>=per0&&l.fecha<=ha?l:null;
    const LP=(iv,id,k,noVal,noDate)=>{const l=inP(last(k));if(l){set(iv,n2(l.v));set(id,isoD(l.fecha));}else{set(iv,noVal);set(id,noDate);}};
    const ercSi=s.c.erc==="si"||["G3a","G3b","G4","G5"].includes(G);const est=G?({G1:1,G2:2,G3a:3,G3b:3,G4:4,G5:5})[G]:null;const e35=ercSi&&est>=3;const tmnd=p.terapia==="tmnd";const g5=G==="G5";
    set(0,p.n1||undefined);set(1,p.n2||(p.n1?"NONE":undefined));set(2,p.ap1||undefined);set(3,p.ap2||(p.ap1?"NOAP":undefined));set(4,p.tipodoc||undefined);set(5,p.doc||undefined);set(6,isoD(p.fnac)||undefined);set(7,p.sexo||undefined);
    if(AST.cfg.eaps&&AST.cfg.eaps[p.eps])set(9,AST.cfg.eaps[p.eps]);
    set(13,[p.tel,p.tel2,p.acudTel].filter(Boolean)[0]||undefined);set(15,AST.cfg.hab||undefined);set(16,p.fing?isoD(p.fing):W(D1800));
    set(17,p.hta?1:2);set(18,p.hta?W(D1800):D1845);set(20,({"1":1,"2":3,otra:4})[p.dmTipo]||2);set(21,p.dmTipo?W(D1800):D1845);
    set(24,lvp?n2(lvp.peso):undefined);set(25,lvp?n2(lvp.talla):undefined);
    const lvPA=[...vals].reverse().find(v=>v.pas!=null&&v.fecha>=per0)||null;set(26,lvPA?lvPA.pas:999);set(27,lvPA&&lvPA.pad!=null?lvPA.pad:999);
    LP(28,29,"creat",99,D1800);
    if(p.dmTipo)LP(30,31,"hba1c",99,D1800);else{set(30,98);set(31,D1845);}
    LP(32,33,"albu",9999,D1800);LP(34,35,"rac",9999,D1800);LP(36,37,"ct",999,D1845);LP(38,39,"hdl",999,D1845);LP(40,41,"ldl",999,D1845);
    if(e35)LP(42,43,"pth",9999,D1800);else{set(42,9988);set(43,D1845);}
    set(44,cg!=null&&inP(cr)?n2(cg):999);
    /* 36 y 37 (IECA / ARA II): la herramienta registra «IECA o ARA II» sin distinguir → arrastre o por diligenciar */
    const sinDatos=!inP(last("creat"))&&!inP(last("tfg"))&&!inP(last("rac"));
    set(47,ercSi?1:s.c.erc==="no"?0:sinDatos?3:2);set(48,ercSi&&est?est:s.c.erc==="no"?98:99);set(49,g5?W(D1800):D1845);set(50,1);
    if(!tmnd){set(51,98);set(52,97);set(53,D1845);}
    set(54,D1845);[55,56,57,58,59,60,61,62].forEach(i=>set(i,98));set(63,98);set(64,D1811);set(65,D1811);set(66,tmnd?1:2);if(!tmnd)set(67,98);
    const LV=(i,k)=>{if(!e35){set(i,98);return;}const l=inP(last(k));set(i,l?n2(l.v):99);};LV(68,"hb");LV(69,"alb");LV(70,"fos");
    if(!g5){const c62=ercSi?97:98;for(let i=71;i<=82;i++)set(i,c62);set(83,D1845);set(84,98);}
    set(85,W(5));[86,87,88,89,90].forEach(i=>set(i,98));for(let i=91;i<=97;i++)set(i,D1845);set(98,98);for(let i=99;i<=107;i++)set(i,98);set(108,98);set(109,D1845);set(110,D1845);set(111,98);set(112,98);
    set(117,98);set(118,D1845);set(120,isoD(ha));
    set(121,lvp?isoD(lvp.fecha):undefined);set(122,lvp?isoD(lvp.fecha):undefined);const tg=last("tg");if(tg){set(123,isoD(tg.fecha));set(124,n2(tg.v));}
    if(s.tl)set(125,isoD(s.tl.fecha));const hb=last("hb"),al=last("alb"),fo=last("fos");if(hb)set(127,isoD(hb.fecha));if(al)set(128,isoD(al.fecha));if(fo)set(129,isoD(fo.fecha));
    if(lastNef)set(130,isoD(lastNef));if(lastMed)set(131,isoD(lastMed));if(lv&&lv.prof)set(132,lv.prof);
    const AD=(i,dis)=>{const f=lastAt(dis);if(f)set(i,isoD(f));};AD(135,"ENFERMERIA");AD(136,"NUTRICION");AD(137,"TRABAJO SOCIAL");AD(138,"QUIMICA FARMACEUTICA");AD(139,"PSICOLOGIA");
    const po=last("po");if(po){set(140,isoD(po.fecha));set(141,po.v);}
    if(lv&&lv.cint!=null)set(142,n2(lv.cint));
  }else{
    const T=fmt==="TMND";const set=(i,v)=>{V[i]=v;};
    set(0,AST.cfg.hab||undefined);set(1,p.tipodoc||undefined);set(2,p.doc||undefined);set(3,[p.tel,p.tel2,p.acudTel].filter(Boolean)[0]||undefined);
    if(citM){set(4,isoD(citM.fSol)||undefined);set(5,isoD(citM.fAsig)||undefined);set(6,isoD(citM.fecha));}
    if(citNext)set(7,isoD(citNext.fAsig||citNext.fSol)||undefined);
    set(8,lvp?n2(lvp.peso):undefined);set(9,lvp?n2(lvp.talla):undefined);set(10,lv&&lv.pas!=null?lv.pas:undefined);set(11,lv&&lv.pad!=null?lv.pad:undefined);
    let o=T?12:13;if(!T&&lv&&lv.cint!=null)set(12,n2(lv.cint));
    if(cr){set(o,n2(cr.v));set(o+1,isoD(cr.fecha));}if(cg!=null)set(o+2,n2(cg));
    const M2=(iv,id,k)=>{const l=inM(last(k));if(l){set(iv,n2(l.v));set(id,isoD(l.fecha));}};
    if(!T){M2(16,17,"rac");if(G)set(18,G);M2(19,20,"glu");if(s.d.dm)M2(21,22,"hba1c");M2(23,24,"ct");M2(25,26,"tg");M2(27,28,"hdl");M2(29,30,"ldl");M2(31,32,"pth");M2(33,34,"hb");M2(35,36,"alb");M2(37,38,"fos");
      const qo=inM(last("qo"));if(qo){set(39,qo.v);set(40,isoD(qo.fecha));}M2(41,42,"cr24");}
    else{if(s.d.dm)M2(15,16,"hba1c");M2(17,18,"ct");M2(19,20,"tg");M2(21,22,"hdl");M2(23,24,"ldl");M2(25,26,"pth");M2(27,28,"hb");M2(29,30,"alb");M2(31,32,"fos");const ab=last("ahbs");if(ab){set(34,n2(ab.v));set(35,isoD(ab.fecha));}}
  }
  return V;}
function nomArrOf(code,fmt){const r=(ST.arr||[]).filter(x=>x.Codigo===code&&x.Formato===fmt).pop();if(!r)return null;try{return JSON.parse(r.Datos);}catch(e){return null;}}
function nomBuild(fmt){const F=NOMF[fmt];const[de,ha]=nomMonth();
  const S=ST.book.pac.filter(p=>p.eps===F.eps&&COH.activeAt(p,ha)).map(p=>ST.smap[p.codigo]&&NP.days(ST.corte,ha)===0?ST.smap[p.codigo]:COH.snapshot(p,ST.book,ha)).filter(F.sel);
  const rows=[],traz=[],pend={};
  S.forEach(s=>{const V=nomRow(fmt,s,de,ha);const A=nomArrOf(s.p.codigo,fmt)||{};const r=[];
    F.H.forEach((h,i)=>{let v=V[i],src="CALCULADO";const hasA=A[h]!=null&&A[h]!=="";if(v&&typeof v==="object"&&"w" in v){if(hasA){v=A[h];src="ARRASTRE";}else{v=v.w;src="INSTRUCTIVO (desconocido)";}}else if(v===undefined||v===""){if(hasA){v=A[h];src="ARRASTRE";}else{v="";src="POR DILIGENCIAR";pend[h]=(pend[h]||0)+1;}}else if(fmt==="FAM"&&typeof v==="number"&&[98,97,99,999,9999,9988].includes(v))src="INSTRUCTIVO";else if(fmt==="FAM"&&/^18(00|11|45)-01-01$/.test(String(v)))src="INSTRUCTIVO";r.push(v);traz.push([s.p.codigo,s.p.doc,h,v,src]);});
    rows.push(r);});
  return{F,S,rows,traz,pend,de,ha};}
function rNom(out){
  const F=NOMF[ST.nomF];const[de,ha]=nomMonth();
  const elig=ST.book.pac.filter(p=>p.eps===F.eps&&COH.activeAt(p,ha));const nArr=(ST.arr||[]).filter(x=>x.Formato===ST.nomF).length;
  let h=head("Nominal mensual por EPS","Genera el archivo nominal con la estructura que usa cada EPS (encabezados de los archivos de ejemplo). Lo que el libro tiene se calcula; lo codificado sigue el instructivo CAC de ERC; lo que el libro no tiene sale del nominal anterior (arrastre) o queda «por diligenciar» en la hoja de trazabilidad. Nunca se rellena con un valor supuesto.");
  h+='<section class="panel"><div class="row3"><label class="f">Formato<select id="nomf">'+Object.entries(NOMF).map(([k,x])=>'<option value="'+k+'"'+(k===ST.nomF?" selected":"")+'>'+esc(x.n)+'</option>').join("")+'</select></label><label class="f">Mes del reporte<input type="month" id="nommes" value="'+esc(ST.nomMes)+'"></label><label class="f">Código de habilitación de la IPS<input type="text" id="nomhab" value="'+esc(AST.cfg.hab||"")+'"></label></div>';
  h+='<p class="note" style="margin:8px 0">Fecha de corte: <strong>'+fd(ha)+'</strong>. Pacientes de '+esc(epsShort(F.eps))+' activos al corte: <strong>'+elig.length+'</strong>. Pacientes con arrastre para este formato: <strong>'+nArr+'</strong>.'+(ST.nomF!=="FAM"?' En los campos marcados «solo pruebas del mes» se reporta el examen solo si se tomó dentro del mes.':'')+'</p>';
  h+='<div class="copyrow"><button type="button" class="btn primary" data-x="nomgen">Descargar nominal</button><label class="btn" for="nomarr">Cargar nominal anterior (arrastre)</label><input type="file" id="nomarr" accept=".xlsx,.xls" hidden><span class="note" id="nommsg"></span></div></section>';
  h+='<section class="panel"><h3>Qué calcula la herramienta</h3><ul class="note" style="margin:0;padding-left:18px;display:grid;gap:3px"><li>Identificación, teléfono, fecha de ingreso y código de habilitación (del libro y de la configuración).</li><li>Peso, talla, PA y cintura de la última valoración; creatinina, HbA1c, albuminuria, RAC, lípidos, PTH, hemoglobina, albúmina, fósforo, glucemia y orina con su fecha.</li><li>TFG por Cockcroft-Gault con el peso de la última valoración, porque así lo piden los encabezados. La estadificación del programa sigue con CKD-EPI 2021, como exige la CAC: el valor del nominal no reemplaza al de la HC.</li><li>Fechas de nefrología (citas de la agenda), última valoración médica y últimas atenciones de enfermería, nutrición, trabajo social, química farmacéutica y psicología.</li><li>EPS Familiar (143 campos): variables codificadas con el instructivo CAC de ERC (Res. 2463 de 2014; el mismo texto que usa el módulo de Hemodiálisis): 1/2 para HTA, tipo de DM, 0–3 para ERC, estadio 1–5/98/99, programa, TMND, «no aplica» de diálisis y trasplante para quien no está en TRR, y los comodines de «no se realizó el laboratorio». Las fechas de diagnóstico desconocidas salen 1800-01-01 solo si el nominal anterior no trae la fecha.</li><li>Quedan por arrastre o por diligenciar: IECA y ARA II por separado (la valoración registra «IECA o ARA II»), costos, régimen, código EPS (si no está configurado), etnia, grupo poblacional, municipio DANE, fecha de afiliación, etiología codificada, meses de prestación, novedad y BDUA; en G5 la valoración para trasplante.</li><li>Discrepancia visible: el encabezado de EPS Familiar dice que hemoglobina, albúmina y fósforo (campos 59–61) aplican «solo en diálisis»; el instructivo CAC los pide en ERC 3 a 5. Se siguió el instructivo; confírmelo con la EPS.</li></ul></section>';
  out.innerHTML=h;
  $("nomf").addEventListener("change",e=>{ST.nomF=e.target.value;renderMg("nom");});
  $("nommes").addEventListener("change",e=>{ST.nomMes=e.target.value;renderMg("nom");});
  $("nomhab").addEventListener("change",e=>{AST.cfg.hab=e.target.value.trim();saveCfg();});
  $("nomarr").addEventListener("change",e=>{const f=e.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=ev=>{try{const wb=XLSX.read(new Uint8Array(ev.target.result),{type:"array",cellDates:true});const ws=wb.Sheets[wb.SheetNames[0]];
      const rows=XLSX.utils.sheet_to_json(ws,{defval:"",raw:false,dateNF:"yyyy-mm-dd"});const H=NOMF[ST.nomF].H;const docH=ST.nomF==="FAM"?H[5]:H[2];
      const byDoc={};ST.book.pac.forEach(p=>{if(p.doc)byDoc[String(p.doc).trim()]=p;});let ok=0,no=0;
      rows.forEach(r=>{const doc=String(r[docH]||"").trim();const p=byDoc[doc];if(!p){no++;return;}const D={};H.forEach(hh=>{if(r[hh]!==""&&r[hh]!=null)D[hh]=r[hh] instanceof Date?iso(r[hh]):r[hh];});
        ST.arr=(ST.arr||[]).filter(x=>!(x.Codigo===p.codigo&&x.Formato===ST.nomF));ST.arr.push({Codigo:p.codigo,Formato:ST.nomF,Corte:iso(nomMonth()[1]),Origen:f.name,Datos:JSON.stringify(D)});ok++;});
      ST.dirty=true;bookInfo();renderMg("nom");toast("Arrastre cargado: "+ok+" pacientes enlazados por documento; "+no+" filas sin paciente en el libro.");}catch(err){$("nommsg").textContent="No se pudo leer: "+err.message;}};rd.readAsArrayBuffer(f);e.target.value="";});
  EXPORTS.nomgen=()=>{const R=nomBuild(ST.nomF);if(!R.rows.length){toast("No hay pacientes de "+epsShort(R.F.eps)+" para este formato.");return;}
    const pend=[["Campo","Pacientes sin dato"]].concat(Object.entries(R.pend).sort((a,b)=>b[1]-a[1]));
    const notas=[["Nota"],["Formato: "+R.F.n+". Mes del reporte "+fd(R.de)+" a "+fd(R.ha)+"."],["Encabezados copiados de los archivos de ejemplo entregados por la coordinación (11-oct-2026). Verifique contra el instructivo vigente de la EPS y de la CAC antes de radicar."],
      ["TFG del nominal: Cockcroft-Gault ((140 − edad) × peso / (72 × creatinina), × 0,85 en mujeres) con la creatinina reportada y el peso de la última valoración. La CAC estadifica con CKD-EPI 2021: ese es el valor clínico."],
      ["Valores codificados (EPS Familiar): instructivo CAC de ERC (Res. 2463 de 2014), el mismo que usa el módulo de Hemodiálisis. Origen de cada celda en la hoja Trazabilidad: CALCULADO, INSTRUCTIVO, ARRASTRE o POR DILIGENCIAR. Verifique contra el instructivo vigente antes de radicar."],
      ["Fechas en formato AAAA-MM-DD. Decimales con punto."],["Datos ficticios: "+(ST.demo?"SÍ. No radicar.":"no")]];
    saveXlsx("Nominal_"+ST.nomF+"_"+ST.nomMes+".xlsx",[["Nominal",[R.F.H].concat(R.rows)],["Trazabilidad",[["Código","Documento","Campo","Valor","Origen"]].concat(R.traz)],["Por diligenciar",pend],["Notas",notas]]);};
}

/* ---------- datos para el tablero gerencial del portal ---------- */
window.MG.kpi=function(){if(!ST.book)return null;const S=ST.snaps;const res=[];
  COH.ORDER.forEach(code=>{const set=S.map(s=>s.ind[code]).filter(Boolean);if(!set.length)return;const n=set.filter(i=>i.ok).length;const F=COH.FICHAS[code]||{};const m=F.cac?{r:F.cac,src:"CAC"}:F.inst?{r:F.inst,src:"INST"}:null;
    res.push({code,n:F.n||code,sec:F.sec||"",num:n,den:set.length,pc:n/set.length*100,meta:m?m.r[0]:null,src:m?m.src:null});});
  const c=ST.corte,de=new Date(c.getFullYear(),c.getMonth(),1);const A=atProg(de,c,"");const pm=new Date(c.getFullYear(),c.getMonth()-1,1),pmf=new Date(c.getFullYear(),c.getMonth(),0);const Ap=atProg(pm,pmf,"");
  const al=S.filter(s=>(s.P.actions||[]).some(a=>a.lvl==="bad")).length;
  return{activos:S.length,porEps:COH.EPS.map(e=>[e,S.filter(s=>s.p.eps===e).length]),corte:iso(c),demo:ST.demo,ind:res,atProg:{mes:A,prev:Ap},alertas:al,
    venc:S.reduce((a,s)=>a+s.items.filter(i=>!i.due||i.due<c).length,0),g3:S.filter(s=>s.c.grupo===3).length};};

/* ---------- datos ficticios ---------- */
function demoWorkbook(){
  const T=new Date();const D=(mo,dd)=>{const x=NP.addMonths(new Date(T.getFullYear(),T.getMonth(),T.getDate()),-mo);if(dd)x.setDate(x.getDate()-dd);return NP.fd(x);};
  const pac=[["Código","Tipo documento","Documento","Nombre completo","Fecha nacimiento","Sexo","EPS","Municipio","Dirección","Teléfono","Teléfono 2","Acudiente","Teléfono acudiente","Fecha ingreso","HTA","Diabetes","Enfermedad cardiovascular","Causa ERC","Situación renal","Estado","Fecha estado","Observaciones"]];
  const lab=[["Código","Fecha","Examen","Valor","Observaciones"]],val=[["Código","Fecha","Profesional","Tipo","PA sistólica","PA diastólica","Peso kg","Talla cm","Cintura cm","IECA/ARA II","iSGLT2","Estatina","Finerenona","Ajuste DM","HTA resistente","Cronicidad en HC","Conducta","Causa ERC","Salud autopercibida","Karnofsky","Síntomas","ERC","Estadio","Albuminuria","Grupo","Próximo control","Observaciones","Tabaquismo","Antihipertensivo"]],at=[["Código","Fecha","Disciplina","Estado","Observaciones"]],nov=[["Código","Fecha","Tipo","Detalle"]];
  const P=[
    ["DEMO-01","Nueva EPS","M",64,"SI","NO","HIPERTENSIVA","SIN TRR",[[8,1.45],[2,1.52]],[[2,14]],{LDL:[2,118],HEMOGLOBINA:[2,13.6],POTASIO:[2,4.6]},[2,142,86,"ESTABLE","NO RECIBE","NO RECIBE","NEFROLOGIA"],{NUTRICION:5,EDUCACION:5,RCV:5}],
    ["DEMO-02","EPS Familiar de Colombia","F",58,"SI","TIPO 2","DIABETICA","SIN TRR",[[12,1.7],[3,1.95]],[[3,180]],{HBA1C:[3,9.1],LDL:[3,96],HEMOGLOBINA:[3,11.2],POTASIO:[3,5.1],FOSFORO:[9,4.0],PTH:[9,92]},[3,146,88,"ESTABLE","NO RECIBE","ESTABLE","NEFROLOGIA"],{NUTRICION:8,ENFERMERIA:8,EDUCACION:14}],
    ["DEMO-03","Nueva EPS","F",71,"SI","TIPO 2","DIABETICA","SIN TRR",[[10,2.4],[1,2.6]],[[1,640]],{HBA1C:[1,7.4],LDL:[1,72],HEMOGLOBINA:[1,10.6],POTASIO:[1,5.3],CALCIO:[1,8.9],FOSFORO:[1,4.8],PTH:[4,140],BICARBONATO:[1,19]},[1,128,74,"ESTABLE","ESTABLE","ESTABLE","NEFROLOGIA"],{NEFROLOGIA:1,NUTRICION:3,ENFERMERIA:3,PSICOLOGIA:3,"TRABAJO SOCIAL":3,EDUCACION:3,"VACUNA INFLUENZA":6,RCV:3}],
    ["DEMO-04","EPS Familiar de Colombia","M",79,"SI","NO","HIPERTENSIVA","G5 TMND",[[7,4.1],[1,4.6]],[[1,520]],{LDL:[1,84],HEMOGLOBINA:[1,9.6],POTASIO:[1,5.4],CALCIO:[1,8.7],FOSFORO:[1,5.2],PTH:[1,210],BICARBONATO:[1,18],ALBUMINA:[1,3.4]},[1,134,72,"ESTABLE","NO RECIBE","ESTABLE","NEFROLOGIA"],{NUTRICION:2,ENFERMERIA:1,PSICOLOGIA:2,"TRABAJO SOCIAL":2,EDUCACION:2,"VACUNA INFLUENZA":4,RCV:2,"SOPORTE PALIATIVO":1}],
    ["DEMO-05","Nueva EPS","F",45,"NO","TIPO 2","DIABETICA","SIN TRR",[[5,0.7],[1,0.72]],[[5,410],[1,450]],{HBA1C:[1,6.8],LDL:[1,88]},[1,124,78,"ESTABLE","ESTABLE","ESTABLE","NEFROLOGIA"],{NUTRICION:1,EDUCACION:1,RCV:1,"VACUNA INFLUENZA":2}],
    ["DEMO-06","EPS Familiar de Colombia","M",55,"SI","NO","HIPERTENSIVA","SIN TRR",[[14,1.0]],[[14,12]],{LDL:[14,130]},null,{}],
    ["DEMO-07","Nueva EPS","M",68,"SI","TIPO 2","DIABETICA","SIN TRR",[[9,1.6],[4,1.75]],[[4,95]],{HBA1C:[4,8.3],LDL:[4,101],HEMOGLOBINA:[4,12.1],POTASIO:[4,4.9]},[4,138,82,"ESTABLE","NO RECIBE","NO RECIBE","MEDICINA GENERAL"],{NUTRICION:10,EDUCACION:10}],
    ["DEMO-08","EPS Familiar de Colombia","F",62,"SI","NO","GLOMERULOPATIA","SIN TRR",[[6,2.9],[1,3.4]],[[1,1200]],{LDL:[1,140],HEMOGLOBINA:[1,10.1],POTASIO:[1,6.1],FOSFORO:[1,5.0],PTH:[1,180]},[1,152,94,"INICIA O AJUSTA","NO RECIBE","ESTABLE","NEFROLOGIA"],{NUTRICION:6,ENFERMERIA:6}],
    ["DEMO-09","Nueva EPS","M",50,"SI","TIPO 2","DIABETICA","SIN TRR",[[3,1.2]],[],{HBA1C:[3,7.9]},[3,132,80,"ESTABLE","ESTABLE","NO RECIBE","MEDICO EXPERTO"],{NUTRICION:3}],
    ["DEMO-10","EPS Familiar de Colombia","F",74,"SI","TIPO 2","DIABETICA","G5 PREPARACION TRR",[[6,3.8],[1,4.4]],[[1,890]],{HBA1C:[1,7.1],LDL:[1,68],HEMOGLOBINA:[1,9.9],POTASIO:[1,5.0],CALCIO:[1,8.6],FOSFORO:[1,5.6],PTH:[2,260]},[1,136,78,"ESTABLE","NO RECIBE","ESTABLE","NEFROLOGIA"],{NUTRICION:1,ENFERMERIA:1,PSICOLOGIA:5,EDUCACION:1,RCV:1}],
  ];
  P.forEach(r=>{const[c,eps,sx,ed,hta,dm,ca,sit,cr,rac,ot,v,ats]=r;const n=c.slice(-2);
    pac.push([c,"CC","90000"+n,"Paciente ficticio "+n,D(ed*12),sx,eps,"Mocoa","Barrio ficticio "+n,"30000000"+n,"31000000"+n,"Acudiente ficticio "+n,"32000000"+n,D(18),hta,dm,"NO",ca,sit,"ACTIVO","",""]);
    cr.forEach(([m,x])=>lab.push([c,D(m),"CREATININA",x,""]));rac.forEach(([m,x])=>lab.push([c,D(m),"RAC",x,""]));
    Object.entries(ot).forEach(([k,[m,x]])=>lab.push([c,D(m),k,x,""]));
    if(v)val.push([c,D(v[0]),v[6],"CONTROL",v[1],v[2],70,165,96,v[3],v[4],v[5],"NO RECIBE","NO","NO","SI",v[6]!=="NEFROLOGIA"?"":sit==="G5 TMND"?"TMND":sit==="G5 PREPARACION TRR"?"PREPARACION TRR":"CONTINUA NEFROLOGIA",ca,"REGULAR","","","","","","","",""]);
    Object.entries(ats).forEach(([k,m])=>at.push([c,D(m),k,"REALIZADA",""]));
  });
  at.push(["DEMO-07",D(1),"NUTRICION","INASISTENCIA",""]);at.push(["DEMO-06",D(2),"NEFROLOGIA","INASISTENCIA",""]);
  pac.push(["DEMO-11","CC","9000011","Paciente ficticio 11",D(80*12),"M","Nueva EPS","Mocoa","","","","","",D(30),"SI","NO","NO","HIPERTENSIVA","SIN TRR","TRR",D(0,10),"Inició hemodiálisis"]);
  nov.push(["DEMO-11",D(0,10),"INICIO DIALISIS","Ingresa a hemodiálisis"]);nov.push(["DEMO-08",D(0,5),"HOSPITALIZACION","Edema y descompensación hipertensiva"]);
  /* Agenda ficticia: jornadas pasadas, de hoy y futuras con desenlaces variados */
  const F=k=>NP.fd(NP.addDays(new Date(T.getFullYear(),T.getMonth(),T.getDate()),k));
  const jor=[["ID jornada","Fecha","Servicio","Profesional","Hora inicio","Hora fin","Duración cupo (min)","Agendas simultáneas","Estado","Motivo cancelación","Observaciones","Usuario","Registrado"]];
  const J=(id,k,sv,pr,a,b,du,n,est,mot)=>jor.push([id,F(k),sv,pr,a,b,du,n,est||"ABIERTA",mot||"","","Agenda ficticia",F(k-20)+" 08:00"]);
  J("JD-1",-63,"NEFROLOGIA","Nefrólogo ficticio","07:00","09:00",20,2);J("JD-2",-35,"NEFROLOGIA","Nefrólogo ficticio","07:00","09:00",20,2);J("JD-3",-28,"MEDICO EXPERTO","Médico experto ficticio","08:00","10:00",20,1);
  J("JD-4",-21,"NUTRICION","Nutricionista ficticia","08:00","10:00",30,1);J("JD-5",-14,"TOMA DE MUESTRAS","Laboratorio","06:30","08:00",15,1);J("JD-6",-7,"NEFROLOGIA","Nefrólogo ficticio","07:00","09:00",20,2,"CANCELADA","Profesional no disponible");
  J("JD-7",0,"NEFROLOGIA","Nefrólogo ficticio","07:00","10:00",20,2);J("JD-8",14,"NEFROLOGIA","Nefrólogo ficticio","07:00","10:00",20,2);J("JD-9",15,"NUTRICION","Nutricionista ficticia","08:00","11:00",30,1);
  const cit=[["ID cita","Código","ID jornada","Fecha","Hora","Agenda","Servicio","Tipo","Origen","Fecha solicitud","Fecha deseada","Fecha asignación","Estado","Confirmación","Hora llegada","Hora atención","Responsable","Motivo","Aviso (horas)","Cita anterior","Reprogramada en","Observaciones","Usuario","Actualizado"]];
  const log=[["Fecha y hora","ID","Código","Acción","Estado anterior","Estado nuevo","Motivo","Usuario"]];
  let ci=0;const C=(cod,jid,k,h,ag,sv,tipo,ksol,kdes,est,o)=>{o=o||{};ci++;const id="C-"+String(ci).padStart(6,"0");
    cit.push([id,cod,jid,F(k),h,ag,sv,tipo,o.orig||"PLAN",F(ksol),F(kdes),F(ksol),est,o.conf||"",o.ll||"",o.at||"",o.resp||"",o.mot||"",o.av==null?"":o.av,o.de||"",o.re||"","","Agenda ficticia",""]);
    log.push([F(ksol)+" 09:00",id,cod,"ASIGNA","","ASIGNADA","","Agenda ficticia"]);if(est!=="ASIGNADA")log.push([F(k)+" "+(o.ll||h),id,cod,"CAMBIO DE ESTADO","ASIGNADA",est,o.mot||"","Agenda ficticia"]);return id;};
  C("DEMO-03","JD-1",-63,"07:00","A","NEFROLOGIA","CONTROL",-90,-60,"ATENDIDA",{conf:"CONFIRMADA",ll:"06:50",at:"07:05"});
  C("DEMO-04","JD-1",-63,"07:00","B","NEFROLOGIA","CONTROL",-90,-62,"ATENDIDA",{ll:"07:10",at:"07:25"});
  C("DEMO-08","JD-1",-63,"07:20","A","NEFROLOGIA","CONTROL",-80,-70,"INASISTENCIA",{resp:"ACCESO",mot:"Vía cerrada, clima u orden público"});
  C("DEMO-10","JD-1",-63,"07:40","A","NEFROLOGIA","CONTROL",-75,-60,"ATENDIDA",{conf:"CONFIRMADA",ll:"07:30",at:"07:45"});
  C("DEMO-06","JD-1",-63,"08:00","B","NEFROLOGIA","PRIMERA VEZ",-120,-100,"INASISTENCIA",{resp:"PACIENTE",mot:"Se sentía bien, no lo consideró necesario"});
  C("DEMO-02","JD-1",-63,"08:20","A","NEFROLOGIA","CONTROL",-70,-63,"CANCELADA",{resp:"EPS",mot:"Autorización no emitida o vencida",av:20});
  C("DEMO-03","JD-2",-35,"07:00","A","NEFROLOGIA","CONTROL",-63,-33,"ATENDIDA",{conf:"CONFIRMADA",ll:"06:55",at:"07:02"});
  C("DEMO-08","JD-2",-35,"07:20","B","NEFROLOGIA","CONTROL",-60,-63,"INASISTENCIA",{orig:"REPROGRAMACION",resp:"ACCESO",mot:"Sin dinero para el transporte"});
  C("DEMO-06","JD-2",-35,"07:40","A","NEFROLOGIA","PRIMERA VEZ",-60,-100,"INASISTENCIA",{orig:"REPROGRAMACION",conf:"NO CONTESTA"});
  C("DEMO-05","JD-2",-35,"08:00","A","NEFROLOGIA","CONTROL",-50,-30,"ATENDIDA",{conf:"CONFIRMADA",ll:"08:20",at:"08:40"});
  C("DEMO-01","JD-2",-35,"08:20","B","NEFROLOGIA","CONTROL",-45,-40,"ATENDIDA",{ll:"08:15",at:"08:30"});
  C("DEMO-07","JD-3",-28,"08:00","A","MEDICO EXPERTO","CONTROL Y FORMULACION",-40,-30,"INASISTENCIA",{resp:"PACIENTE",mot:"Olvidó la cita"});
  C("DEMO-02","JD-3",-28,"08:20","A","MEDICO EXPERTO","AJUSTE DE METAS",-35,-30,"ATENDIDA",{conf:"CONFIRMADA",ll:"08:10",at:"08:25"});
  C("DEMO-04","JD-3",-28,"08:40","A","MEDICO EXPERTO","CONTROL Y FORMULACION",-35,-28,"NO ATENDIDA",{ll:"08:35",resp:"IPS",mot:"Demora en la atención: se retiró"});
  C("DEMO-09","JD-4",-21,"08:00","A","NUTRICION","CONTROL",-30,-25,"ATENDIDA",{ll:"07:55",at:"08:05"});
  C("DEMO-07","JD-4",-21,"08:30","A","NUTRICION","CONTROL",-30,-20,"INASISTENCIA",{});
  C("DEMO-02","JD-5",-14,"06:30","A","TOMA DE MUESTRAS","PARACLINICOS DEL PLAN",-20,-14,"ATENDIDA",{ll:"06:25",at:"06:35"});
  C("DEMO-09","JD-5",-14,"06:45","A","TOMA DE MUESTRAS","PARACLINICOS DEL PLAN",-20,-14,"ASIGNADA",{});
  C("DEMO-01","JD-6",-7,"07:00","A","NEFROLOGIA","CONTROL",-30,-7,"CANCELADA",{resp:"IPS",mot:"Profesional no disponible",av:30});
  C("DEMO-03","JD-7",0,"07:00","A","NEFROLOGIA","CONTROL",-20,0,"ATENDIDA",{conf:"CONFIRMADA",ll:"06:50",at:"07:00"});
  C("DEMO-04","JD-7",0,"07:00","B","NEFROLOGIA","CONTROL",-20,0,"EN SALA",{conf:"CONFIRMADA",ll:"07:05"});
  C("DEMO-10","JD-7",0,"07:20","A","NEFROLOGIA","CONTROL",-15,0,"ASIGNADA",{conf:"CONFIRMADA"});
  C("DEMO-05","JD-7",0,"07:40","B","NEFROLOGIA","CONTROL",-10,2,"ASIGNADA",{conf:"NO CONTESTA"});
  C("DEMO-08","JD-7",0,"08:00","A","NEFROLOGIA","CONTROL",-30,-63,"ASIGNADA",{orig:"REPROGRAMACION"});
  C("DEMO-02","JD-8",14,"07:00","A","NEFROLOGIA","CONTROL",-1,10,"ASIGNADA",{});
  C("DEMO-09","JD-9",15,"08:00","A","NUTRICION","CONTROL",-1,20,"ASIGNADA",{});
  const link=(o,n)=>{const r1=cit.find(r=>r[0]===o),r2=cit.find(r=>r[0]===n);r1[20]=n;r2[19]=o;};link("C-000003","C-000008");link("C-000008","C-000024");link("C-000005","C-000009");
  const wb=XLSX.utils.book_new();[["Pacientes",pac],["Laboratorios",lab],["Valoraciones",val],["Atenciones",at],["Novedades",nov],["Jornadas",jor],["Citas",cit],["Citas_log",log]].forEach(([n,a])=>XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(a),n));
  return wb;
}

/* ---------- datos ficticios amplios: 100 pacientes por EPS con 6 meses de agenda simulada ----------
   Todo es inventado. Las proporciones (estadios, inasistencia, motivos) son supuestos del generador para ver la herramienta funcionando; no son datos del programa. */
function demoBig(){
  const T=new Date();T.setHours(0,0,0,0);
  let seed=20261006;const R=()=>{seed=(seed+0x6D2B79F5)|0;let t=Math.imul(seed^(seed>>>15),1|seed);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
  const ri=(a,b)=>a+Math.floor(R()*(b-a+1)),pick=a=>a[Math.floor(R()*a.length)],ch=p=>R()<p;
  const wp=arr=>{let s=arr.reduce((a,x)=>a+x[1],0),r=R()*s;for(const x of arr){if((r-=x[1])<0)return x[0];}return arr[arr.length-1][0];};
  const AD=(d,k)=>NP.addDays(d,k),AM=(d,m)=>NP.addMonths(d,m),F=d=>NP.fd(d),rd=(v,n)=>{const f=Math.pow(10,n==null?1:n);return Math.round(v*f)/f;};
  const fixW=d=>{const w=d.getDay();return w===6?AD(d,-1):w===0?AD(d,1):d;};
  const crFor=(tfg,age,fem)=>{let lo=0.2,hi=20;for(let i=0;i<40;i++){const m=(lo+hi)/2;if(NP.ckd(m,age,fem)>tfg)lo=m;else hi=m;}return rd((lo+hi)/2,2);};
  const hmA=(h,k)=>m2hm(Math.max(0,hm2m(h)+k));
  const MUN=[["Mocoa",55],["Villagarzón",8],["Puerto Asís",7],["Orito",5],["Sibundoy",5],["Puerto Guzmán",4],["Puerto Caicedo",3],["Santiago",3],["Colón",3],["San Francisco",3],["Valle del Guamuez",2],["Puerto Leguízamo",2]];
  const EPSL=["EPS Familiar de Colombia","Nueva EPS","Mallamas EPS"];
  const pac=[["Código","Tipo documento","Documento","Nombre completo","Fecha nacimiento","Sexo","EPS","Municipio","Dirección","Teléfono","Teléfono 2","Acudiente","Teléfono acudiente","Fecha ingreso","HTA","Diabetes","Enfermedad cardiovascular","Causa ERC","Situación renal","Estado","Fecha estado","Observaciones","Primer nombre","Segundo nombre","Primer apellido","Segundo apellido"]];
  const lab=[["Código","Fecha","Examen","Valor","Observaciones"]],val=[["Código","Fecha","Profesional","Tipo","PA sistólica","PA diastólica","Peso kg","Talla cm","Cintura cm","IECA/ARA II","iSGLT2","Estatina","Finerenona","Ajuste DM","HTA resistente","Cronicidad en HC","Conducta","Causa ERC","Salud autopercibida","Karnofsky","Síntomas","ERC","Estadio","Albuminuria","Grupo","Próximo control","Observaciones","Tabaquismo","Antihipertensivo"]],at=[["Código","Fecha","Disciplina","Estado","Observaciones"]],nov=[["Código","Fecha","Tipo","Detalle"]];
  const TFR={G1:[90,110],G2:[60,89],G3a:[45,59],G3b:[30,44],G4:[15,29],G5:[8,14]};
  const P=[];
  EPSL.forEach((eps,ei)=>{for(let i=0;i<100;i++){
    const n=ei*100+i+1,code="NP-"+String(n).padStart(4,"0"),nn=String(n).padStart(3,"0");
    const G=wp([["G1",5],["G2",25],["G3a",25],["G3b",20],["G4",15],["G5",10]]),A=wp([["A1",50],["A2",35],["A3",15]]);
    const age=wp([[ri(35,49),15],[ri(50,64),35],[ri(65,79),38],[ri(80,90),12]]),fem=ch(.52);
    const tfg=ri(TFR[G][0],TFR[G][1])+R()*0.9,rac=A==="A1"?ri(4,29):A==="A2"?ri(30,299):ri(300,1600);
    const dm=ch(.45)?"TIPO 2":ch(.03)?"TIPO 1":"NO",hta=ch(.85)||dm==="NO",ecv=ch(.15);
    const causa=dm!=="NO"&&ch(.7)?"DIABETICA":hta&&ch(.75)?"HIPERTENSIVA":pick(["GLOMERULOPATIA","POLIQUISTOSIS","UROPATIA OBSTRUCTIVA","TUBULOINTERSTICIAL","NO ESTABLECIDA"]);
    const sit=G==="G5"?(ch(.4)?"G5 TMND":"G5 PREPARACION TRR"):"SIN TRR";
    const g12=G==="G1"||G==="G2",g3=G==="G3a"||G==="G3b",g45=G==="G4"||G==="G5";
    const mNef=g12?(A==="A3"?3:6):G==="G3a"?(A==="A3"?3:6):G==="G3b"?(A==="A1"?6:3):G==="G4"?2:1;
    const nuevo=ch(.04);const fing=nuevo?AD(T,-ri(5,60)):AD(T,-ri(250,1500));
    const p={code,nn,eps,ei,G,A,age,fem,tfg,rac,dm,hta,ecv,causa,sit,g12,g3,g45,mNef,nuevo,fing,mun:wp(MUN),slope:ri(0,4)+(A==="A3"?2:0),sbp:ri(118,152),dbp:ri(70,92),a1c:rd(6+R()*3.6),ldl:ri(55,150),hb:fem?rd(10.2+R()*3.3):rd(10.8+R()*4),k:rd(4+R()*1.1),peso:ri(52,96),talla:fem?ri(148,166):ri(158,180),
      raas:(hta||dm!=="NO")&&rac>30?(ch(.8)?"ESTABLE":"NO RECIBE"):hta&&ch(.55)?"ESTABLE":"NO RECIBE",
      sglt2:dm==="TIPO 2"&&tfg>=20?(ch(.5)?"ESTABLE":"NO RECIBE"):"NO RECIBE",stat:age>=50&&tfg<60?(ch(.7)?"ESTABLE":"NO RECIBE"):(ch(.35)?"ESTABLE":"NO RECIBE"),
      fin:dm==="TIPO 2"&&rac>=30&&tfg>=25&&ch(.12)?"ESTABLE":"NO RECIBE",estado:"ACTIVO",festado:null,obs:"",cits:[],nd:{},prevNS:0,pend:{},hold:{},hasVal:false,last:{},lastToma:null};
    if(!g12&&p.k<4.5&&g45)p.k=rd(p.k+0.4);
    p.tfgAt=d=>Math.max(5,p.tfg+p.slope*NP.days(d,T)/365.25);p.ageAt=d=>p.age-Math.max(0,NP.days(d,T))/365.25;
    p.racAt=d=>Math.max(3,Math.round(p.rac*(0.85+R()*0.3)*(1-0.08*NP.days(d,T)/365.25)));
    P.push(p);}});
  /* v8: datos adicionales con una semilla aparte (no cambia la secuencia original) */
  let seed2=20261011;const R2=()=>{seed2=(seed2+0x6D2B79F5)|0;let t=Math.imul(seed2^(seed2>>>15),1|seed2);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};
  P.forEach(p=>{p.hdl2=p.fem?38+Math.round(R2()*30):32+Math.round(R2()*24);p.tg2=90+Math.round(R2()*190);p.tab=R2()<.14;p.antiHTA=p.hta&&R2()<.9;});
  /* egresos ficticios: 2 por EPS */
  [[4,"FALLECIDO","FALLECIMIENTO","Fallece en hospitalización (ficticio)"],[57,"TRR","INICIO DIALISIS","Inicia hemodiálisis (ficticio)"],[118,"TRASLADO","TRASLADO","Cambio de domicilio (ficticio)"],[160,"TRR","INICIO DIALISIS","Inicia diálisis peritoneal (ficticio)"],[233,"FALLECIDO","FALLECIMIENTO","Fallece en casa (ficticio)"],[271,"TRASLADO","TRASLADO","Traslado a otro departamento (ficticio)"]].forEach(([ix,est,tn,det])=>{const p=P[ix];p.estado=est;p.festado=AD(T,-ri(10,120));nov.push([p.code,F(p.festado),tn,det]);});
  const addLab=(p,d,ex,v)=>{lab.push([p.code,F(d),ex,v,""]);p.last[ex]=d;};
  const takeLabs=(p,d,full)=>{const a=p.ageAt(d),t=p.tfgAt(d);addLab(p,d,"CREATININA",crFor(t,a,p.fem));
    const racEvery=(p.mNef>=6?11:p.mNef*1.6)*30;if(full||!p.last.RAC||NP.days(p.last.RAC,d)>=racEvery-20)addLab(p,d,"RAC",p.racAt(d));
    if(p.g3||p.g45||p.raas==="ESTABLE")addLab(p,d,"POTASIO",rd(p.k+(R()-.5)*.5));
    if(p.dm!=="NO"&&(full||!p.last.HBA1C||NP.days(p.last.HBA1C,d)>=85)){addLab(p,d,"HBA1C",rd(p.a1c+(R()-.5)*.8));if(R2()<.8)addLab(p,d,"GLICEMIA",Math.round(90+(p.a1c-5)*28+(R2()-.5)*30));}
    if(full||!p.last.LDL||NP.days(p.last.LDL,d)>=330){addLab(p,d,"LDL",Math.round(p.ldl*(0.85+R()*.3)));const h2=Math.round(p.hdl2*(0.9+R2()*.2));addLab(p,d,"HDL",h2);addLab(p,d,"TRIGLICERIDOS",Math.round(p.tg2*(0.8+R2()*.4)));addLab(p,d,"COLESTEROL_TOTAL",Math.round(p.ldl+h2+p.tg2/5));if(R2()<.35)addLab(p,d,"PARCIAL_ORINA",R2()<.7?"Normal":"Proteínas +, sin hematuria");}
    if((p.g3||p.g45)&&(full||!p.last.HEMOGLOBINA||NP.days(p.last.HEMOGLOBINA,d)>=(p.g3?170:85)))addLab(p,d,"HEMOGLOBINA",rd(p.hb+(R()-.5)*.6));
    if(!p.g12&&(full||!p.last.FOSFORO||NP.days(p.last.FOSFORO,d)>=(p.g3?330:p.G==="G4"?170:85))){addLab(p,d,"CALCIO",rd(8.6+R()*1.4));addLab(p,d,"FOSFORO",rd(p.G==="G5"?4+R()*2.4:3+R()*1.8));addLab(p,d,"PTH",Math.round(p.G==="G5"?120+R()*260:p.G==="G4"?55+R()*110:35+R()*70));}
    if(p.g45){addLab(p,d,"BICARBONATO",rd(17+R()*7));if(full||ch(.5))addLab(p,d,"ALBUMINA",rd(3.1+R()*1.1));}
    if(p.g3&&(full||!p.last.ALBUMINA||NP.days(p.last.ALBUMINA,d)>=330)&&R2()<.7)addLab(p,d,"ALBUMINA",rd(3.4+R2()*1.0));};
  const addVal=(p,d,prof,tipo)=>{const pa=p.sbp+ri(-10,10),pd=p.dbp+ri(-6,6);
    val.push([p.code,F(d),prof,tipo,pa,pd,p.peso,p.talla,Math.round(p.peso*0.95+ri(-5,8)),p.raas,p.sglt2,p.stat,p.dm==="TIPO 2"?p.fin:"",p.dm!=="NO"?(p.a1c>=8&&ch(.5)?"SI":"NO"):"",ch(.04)?"SI":"NO",p.g12&&p.A==="A1"?"NO":"SI",prof!=="NEFROLOGIA"?"":p.sit==="G5 TMND"?"TMND":p.sit==="G5 PREPARACION TRR"?"PREPARACION TRR":"CONTINUA NEFROLOGIA",p.causa,pick(["BUENA","REGULAR","BUENA","MUY BUENA","MALA"]),p.g45?pick([90,80,70,60]):"","","","","","","","",p.tab?"SI":"NO",p.antiHTA?"SI":"NO"]);p.hasVal=true;};
  /* historia previa a la ventana de agenda (más de 6 meses) */
  const W0=AD(T,-182);
  P.forEach(p=>{
    const sex=p.fem?"F":"M",fn=AD(T,-Math.round(p.age*365.25)-ri(0,300));
    pac.push([p.code,"CC","9"+String(4000000+Number(p.nn)*137).padStart(7,"0"),"Paciente ficticio "+p.nn,F(fn),sex,p.eps,p.mun,"Barrio ficticio "+p.nn,"300"+String(1000000+Number(p.nn)).slice(-7),ch(.5)?"310"+String(2000000+Number(p.nn)).slice(-7):"",ch(.7)?"Acudiente ficticio "+p.nn:"",ch(.6)?"320"+String(3000000+Number(p.nn)).slice(-7):"",F(p.fing),p.hta?"SI":"NO",p.dm,p.ecv?"SI":"NO",p.causa,p.sit,p.estado,p.festado?F(p.festado):"","","PACIENTE","","FICTICIO","N"+p.nn]);
    if(p.nuevo){nov.push([p.code,F(p.fing),"INGRESO","Ingreso al programa (ficticio)"]);addLab(p,AD(p.fing,-ri(5,20)),"CREATININA",crFor(p.tfgAt(p.fing),p.ageAt(p.fing),p.fem));p.nd.NEFROLOGIA=AD(p.fing,7);return;}
    takeLabs(p,AD(T,-ri(330,420)),true);const lv=AD(T,-ri(190,330));takeLabs(p,AD(lv,-ri(5,15)),false);
    addVal(p,lv,ch(.75)||p.eps!=="EPS Familiar de Colombia"?"NEFROLOGIA":"MEDICO EXPERTO","CONTROL");
    p.nd.NEFROLOGIA=AM(lv,p.mNef);if(p.eps==="EPS Familiar de Colombia")p.nd["MEDICO EXPERTO"]=AM(lv,1);
    const nm=p.G==="G5"?3:p.G==="G4"?6:12;const ln=ch(.6)?AD(T,-ri(190,400)):null;if(ln)at.push([p.code,F(ln),"NUTRICION","REALIZADA",""]);p.nd.NUTRICION=ln?AM(ln,nm):AD(W0,ri(0,60));p.nutM=nm;
    ["EDUCACION","ENFERMERIA","PSICOLOGIA","TRABAJO SOCIAL"].forEach(dsc=>{if(dsc!=="EDUCACION"&&p.g12)return;const l=ch(dsc==="EDUCACION"?.5:.4)?AD(T,-ri(190,420)):null;if(l)at.push([p.code,F(l),dsc,"REALIZADA",""]);p.nd[dsc]=l?AM(l,12):AD(W0,ri(0,170));});
    if(ch(.45))at.push([p.code,F(AD(T,-ri(150,400))),"VACUNA INFLUENZA","REALIZADA",""]);if(ch(.5))at.push([p.code,F(AD(T,-ri(150,380))),"RCV","REALIZADA",""]);
  });
  P.filter(()=>ch(.04)).forEach(p=>nov.push([p.code,F(AD(T,-ri(15,170))),"HOSPITALIZACION",pick(["Descompensación hipertensiva (ficticio)","Infección urinaria (ficticio)","Edema pulmonar (ficticio)","Hiperpotasemia (ficticio)"])]));
  /* jornadas */
  const jor=[["ID jornada","Fecha","Servicio","Profesional","Hora inicio","Hora fin","Duración cupo (min)","Agendas simultáneas","Estado","Motivo cancelación","Observaciones","Usuario","Registrado"]];
  const JS=[];const seq={};
  const addJ=(d,serv,prof,a,b,dur,nAg,canc)=>{const base="J"+iso(d).replace(/-/g,"");seq[base]=(seq[base]||0)+1;const j={id:base+"-"+seq[base],fecha:d,serv,prof,hIni:a,hFin:b,dur,nAg,canc};j.slots=[];agSlots(j).forEach(t=>agLetters(j).forEach(ag=>j.slots.push([t,ag])));JS.push(j);};
  for(let k=-26;k<=8;k++){
    addJ(AD(T,7*k),"NEFROLOGIA","Nefrólogo ficticio","07:00","11:00",20,2,k===-9);
    addJ(fixW(AD(T,7*k+1)),"MEDICO EXPERTO","Médico experto ficticio","08:00","12:00",20,1);addJ(fixW(AD(T,7*k+3)),"MEDICO EXPERTO","Médico experto ficticio","08:00","12:00",20,1);
    addJ(fixW(AD(T,7*k+2)),"NUTRICION","Nutricionista ficticia","07:00","12:00",30,1);addJ(fixW(AD(T,7*k+3)),"ENFERMERIA","Enfermera ficticia","08:00","11:00",20,1);
    if(k%2===0){addJ(fixW(AD(T,7*k+4)),"PSICOLOGIA","Psicóloga ficticia","08:00","12:00",30,1);addJ(fixW(AD(T,7*k+2)),"EDUCACION","Enfermera ficticia","14:00","16:00",30,1);}else addJ(fixW(AD(T,7*k+4)),"TRABAJO SOCIAL","Trabajadora social ficticia","08:00","12:00",30,1);
    addJ(fixW(AD(T,7*k-1)),"TOMA DE MUESTRAS","Laboratorio","06:00","08:30",15,1);addJ(fixW(AD(T,7*k+2)),"TOMA DE MUESTRAS","Laboratorio","06:00","08:30",15,1);
  }
  const HOR=AD(T,60);const JJ=JS.filter(j=>j.fecha<=HOR).sort((a,b)=>a.fecha-b.fecha||hm2m(a.hIni)-hm2m(b.hIni));
  const cit=[],log=[],ctc=[];let cn=0;
  const MOTI=[["A_COSTO",16],["A_RURAL",10],["A_VIA",7],["P_OLVIDO",14],["P_BIEN",8],["P_ENFERMO",8],["P_TRABAJO",7],["P_ACOMP",4],["E_AUT",9],["I_NOTIF",4],["O_SINCONT",13]];
  const MOTC=[["P_ENFERMO",18],["P_TRABAJO",16],["E_AUT",20],["A_COSTO",10],["P_HOSP",8],["A_VIA",6],["I_ERROR",4],["I_LAB",6],["O_OTRO",4]];
  const interval=(p,serv)=>serv==="NEFROLOGIA"?p.mNef:serv==="MEDICO EXPERTO"?1:serv==="NUTRICION"?p.nutM||12:12;
  const nowM=new Date().getHours()*60+new Date().getMinutes();
  const book=(j,p,t,ag,cancJ,desT)=>{
    cn++;const id="C-"+String(cn).padStart(6,"0");const past=j.fecha<T,today=NP.days(j.fecha,T)===0;
    const lead=j.serv==="TOMA DE MUESTRAS"?ri(2,10):ri(2,45),fAsig=new Date(Math.min(AD(j.fecha,-lead),T));const des=desT||p.nd[j.serv]||j.fecha;
    const c={id,c:p.code,jor:j.id,fecha:j.fecha,hora:t,ag,serv:j.serv,tipo:j.serv==="NEFROLOGIA"?(p.hasVal?"CONTROL":"PRIMERA VEZ"):j.serv==="MEDICO EXPERTO"?"CONTROL Y FORMULACION":j.serv==="TOMA DE MUESTRAS"?"PARACLINICOS DEL PLAN":"CONTROL",origen:p.pend[j.serv]?"REPROGRAMACION":"PLAN",fSol:fAsig,fDes:des,fAsig,estado:"ASIGNADA",conf:"",hLleg:"",hAten:"",resp:"",motivo:"",avisoH:"",deId:p.pend[j.serv]||"",reId:""};
    if(c.deId){const o=cit.find(x=>x.id===c.deId);if(o)o.reId=id;delete p.pend[j.serv];}
    log.push([F(fAsig)+" "+m2hm(ri(7*60,16*60)),id,p.code,"ASIGNA","","ASIGNADA",c.deId?"Reprograma "+c.deId:"","Agenda ficticia"]);
    if((past||today||NP.days(T,j.fecha)<=3)&&ch(.6)){const res=ch(.8)?"CONFIRMA":pick(["NO CONTESTA","NUMERO ERRADO","MENSAJE ENVIADO"]);c.conf=res==="CONFIRMA"?"CONFIRMADA":res;const fr=AD(j.fecha,-ri(1,2));ctc.push([F(fr<T?fr:T)+" "+m2hm(ri(8*60,17*60)),p.code,id,pick(["LLAMADA","WHATSAPP","SMS"]),res,"","Agenda ficticia"]);}
    let resolve=past||(today&&hm2m(t)+20<nowM);
    if(cancJ){c.estado="CANCELADA";c.resp="IPS";c.motivo=AG_MOTL("I_PROF");c.avisoH=ri(20,48);if(ch(.7))p.pend[j.serv]=id;}
    else if(resolve){
      const pc=.07,pn=Math.max(.02,.055+(p.prevNS>0?.09:0)+(lead>30?.05:0)+(p.mun!=="Mocoa"?.05:0)+(c.conf==="CONFIRMADA"?-.035:0)+(c.conf&&c.conf!=="CONFIRMADA"?.04:0));const r=R();
      if(past&&NP.days(j.fecha,T)<=12&&ch(.02)){/* sin cierre */}
      else if(r<pc){const mk=wp(MOTC);c.estado="CANCELADA";c.resp=AG_MOTR(mk);c.motivo=AG_MOTL(mk);c.avisoH=ch(.25)?ri(1,23):ri(24,120);if(ch(.75))p.pend[j.serv]=id;else p.hold[j.serv]=AD(j.fecha,ri(40,100));}
      else if(r<pc+pn){c.estado="INASISTENCIA";p.prevNS++;if(ch(.72)){const mk=wp(MOTI);c.resp=AG_MOTR(mk);c.motivo=AG_MOTL(mk);}if(ch(.62))p.pend[j.serv]=id;else p.hold[j.serv]=AD(j.fecha,ri(40,120));}
      else if(r<pc+pn+.012){c.estado="NO ATENDIDA";c.hLleg=hmA(t,ri(-10,15));c.resp="IPS";c.motivo=AG_MOTL("I_DEMORA");p.pend[j.serv]=id;}
      else{c.estado="ATENDIDA";c.hLleg=hmA(t,ch(.15)?ri(16,45):ri(-20,12));c.hAten=hmA(hm2m(c.hLleg)>hm2m(t)?c.hLleg:t,ri(0,35));
        if(j.serv!=="TOMA DE MUESTRAS")p.nd[j.serv]=AM(j.fecha,interval(p,j.serv));
        if(j.serv==="NEFROLOGIA"){addVal(p,j.fecha,"NEFROLOGIA",c.tipo);if(p.eps==="EPS Familiar de Colombia")p.nd["MEDICO EXPERTO"]=AM(j.fecha,1);}
        if(j.serv==="MEDICO EXPERTO")addVal(p,j.fecha,"MEDICO EXPERTO","CONTROL");}
      if(c.estado!=="ASIGNADA")log.push([F(j.fecha)+" "+(c.hLleg||t),id,p.code,"CAMBIO DE ESTADO","ASIGNADA",c.estado,c.motivo,"Agenda ficticia"]);
    }else if(today&&hm2m(t)<=nowM+10&&ch(.5)){c.estado="EN SALA";c.hLleg=hmA(t,ri(-15,5));log.push([F(j.fecha)+" "+c.hLleg,id,p.code,"CAMBIO DE ESTADO","ASIGNADA","EN SALA","","Agenda ficticia"]);}
    cit.push(c);p.cits.push(c);return c;};
  const active=(p,d)=>p.fing<=d&&!(p.festado&&p.festado<=d);
  /* servicios clínicos */
  JJ.filter(j=>j.serv!=="TOMA DE MUESTRAS").forEach(j=>{
    const fut=j.fecha>T,dd=NP.days(T,j.fecha);const fill=j.canc?.8:fut?(dd<=14?.75:dd<=35?.45:.2):(.82+R()*.18);
    const cap=Math.round(j.slots.length*fill);
    const cand=P.filter(p=>active(p,j.fecha)&&p.nd[j.serv]&&p.nd[j.serv]<=AD(j.fecha,21)&&!(p.hold[j.serv]&&p.hold[j.serv]>j.fecha)&&!p.cits.some(c=>NP.days(c.fecha,j.fecha)===0&&c.serv===j.serv)
      &&!(j.serv==="MEDICO EXPERTO"&&p.nd.NEFROLOGIA&&NP.days(j.fecha,p.nd.NEFROLOGIA)<=20&&NP.days(j.fecha,p.nd.NEFROLOGIA)>=-30)
      &&!p.cits.some(c=>c.serv===j.serv&&c.estado==="ASIGNADA"&&c.fecha>j.fecha))
      .sort((a,b)=>(a.pend[j.serv]?0:1)-(b.pend[j.serv]?0:1)||a.nd[j.serv]-b.nd[j.serv]).slice(0,cap);
    cand.forEach((p,i)=>{const [t,ag]=j.slots[i];book(j,p,t,ag,j.canc);});
  });
  /* toma de muestras antes de nefrología o médico experto */
  JJ.filter(j=>j.serv==="TOMA DE MUESTRAS").forEach(j=>{
    const cand=P.filter(p=>active(p,j.fecha)&&(!p.lastToma||NP.days(p.lastToma,j.fecha)>=20)&&p.cits.some(c=>(c.serv==="NEFROLOGIA"||c.serv==="MEDICO EXPERTO")&&c.estado!=="CANCELADA"&&NP.days(j.fecha,c.fecha)>=3&&NP.days(j.fecha,c.fecha)<=14)).slice(0,j.slots.length);
    cand.forEach((p,i)=>{const [t,ag]=j.slots[i];const nx=p.cits.filter(c=>(c.serv==="NEFROLOGIA"||c.serv==="MEDICO EXPERTO")&&c.estado!=="CANCELADA"&&NP.days(j.fecha,c.fecha)>=3).sort((a,b)=>a.fecha-b.fecha)[0];const c=book(j,p,t,ag,false,nx?AD(nx.fecha,-7):null);p.lastToma=j.fecha;if(c.estado==="ATENDIDA")takeLabs(p,j.fecha,false);});
  });
  /* desde el año pasado, creatinina de quienes no pasaron por toma de muestras (laboratorio externo) */
  P.forEach(p=>{if(!p.nuevo&&!p.lastToma&&ch(.5))takeLabs(p,AD(T,-ri(20,150)),false);});
  JS.forEach(j=>jor.push([j.id,F(j.fecha),j.serv,j.prof,j.hIni,j.hFin,j.dur,j.nAg,j.canc?"CANCELADA":"ABIERTA",j.canc?AG_MOTL("I_PROF"):"","","Agenda ficticia",F(AD(j.fecha,-30))+" 08:00"]));
  JS.filter(j=>j.canc).forEach(j=>log.push([F(AD(j.fecha,-2))+" 10:00",j.id,"","CANCELA JORNADA","ABIERTA","CANCELADA",AG_MOTL("I_PROF"),"Agenda ficticia"]));
  const citA=[["ID cita","Código","ID jornada","Fecha","Hora","Agenda","Servicio","Tipo","Origen","Fecha solicitud","Fecha deseada","Fecha asignación","Estado","Confirmación","Hora llegada","Hora atención","Responsable","Motivo","Aviso (horas)","Cita anterior","Reprogramada en","Observaciones","Usuario","Actualizado"]].concat(cit.map(c=>[c.id,c.c,c.jor,F(c.fecha),c.hora,c.ag,c.serv,c.tipo,c.origen,F(c.fSol),F(c.fDes),F(c.fAsig),c.estado,c.conf,c.hLleg,c.hAten,c.resp,c.motivo,c.avisoH,c.deId,c.reId,"","Agenda ficticia",""]));
  const logA=[["Fecha y hora","ID","Código","Acción","Estado anterior","Estado nuevo","Motivo","Usuario"]].concat(log);
  const ctcA=[["Fecha y hora","Código","ID cita","Medio","Resultado","Observaciones","Usuario"]].concat(ctc);
  const wb=XLSX.utils.book_new();[["Pacientes",pac],["Laboratorios",lab],["Valoraciones",val],["Atenciones",at],["Novedades",nov],["Jornadas",jor],["Citas",citA],["Citas_log",logA],["Contactos",ctcA]].forEach(([n,a])=>XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(a),n));
  return wb;
}

/* ---------- arranque ---------- */
show("calc");
if(window.NEFRO_DEMO){$("booklabel").hidden=true;$("bookdemo").textContent="Regenerar datos ficticios";
  document.querySelector(".privacy").innerHTML='<strong>Página de demostración.</strong> 300 pacientes inventados (100 por EPS) con seis meses de agenda simulada y dos meses programados. Las cifras salen del generador, no del programa. No cargue datos reales aquí.';
  if(!AST.user)AST.user="Demostración";if(typeof XLSX!=="undefined"){loadDemo(true);show("agenda");}}
else probe().then(ok=>{if(ok){$("bookdemo").hidden=true;loadDb().catch(e=>{$("bookinfo").textContent="No se pudo leer la base de datos: "+e.message;});}});
window.MG.agendaGuardada=function(){ST.dirty=false;try{bookInfo();}catch(e){}};window.MG.estadoRuta=function(){return ST;}; /* puente con el adaptador */
})();

