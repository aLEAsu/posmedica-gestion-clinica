
/* ===================== INTERFAZ ===================== */
(function(){
"use strict";
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
function num(id){const v=$(id).value.trim().replace(",",".");if(v==="")return null;const x=parseFloat(v);return isFinite(x)?x:null;}
function dt(id){const s=$(id).value;if(!s)return null;const[y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d);}
function iso(d){const p=x=>String(x).padStart(2,"0");return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate());}
const SINT=[["fatiga","Fatiga o debilidad"],["prurito","Prurito"],["apetito","Pérdida de apetito"],["nausea","Náuseas o vómito"],["sueno","Alteración del sueño o somnolencia"],["edema","Edema"],["disnea","Disnea"],["calambres","Calambres o piernas inquietas"],["dolor","Dolor"],["animo","Ansiedad o ánimo deprimido"],["espuma","Orina espumosa"],["olig","Disminución del volumen urinario"],["hemat","Hematuria macroscópica"]];
$("sintomas").innerHTML=SINT.map(s=>'<label class="chk"><input type="checkbox" id="s_'+s[0]+'"> '+s[1]+'</label>').join("");
const MOPT='<option value="no">No recibe</option><option value="est">Recibe, dosis estable</option><option value="aj">Inicia o ajusta hoy</option><option value="ci">Contraindicado / no tolerado</option>';
["m_raas","m_sglt2","m_stat","m_fin"].forEach(id=>$(id).innerHTML=MOPT);
let isExample=false;

function read(){
  const d={};
  d.prof=$("prof").value;d.tipo=$("tipo").value;d.causa=$("causa").value;d.conducta=d.prof==="nefro"?$("conducta").value:"";
  d.pid=$("pid").value.trim();d.edad=num("edad");d.sexo=$("sexo").value;d.eps=$("eps").value;d.epsModel=(window.EPSMODEL||{})[d.eps]||{};
  d.fCons=dt("fcons")||new Date();d.fnac=dt("fnac");
  if(d.fnac){d.edad=Math.floor(NP.days(d.fnac,d.fCons)/365.25);$("edad").value=d.edad;}
  const fdef=dt("flab")||d.fCons;d.labDates={};
  ["creat","tfgdir","rac","hba1c","ldl","hb","k","ca","fos","pth","hco3","alb"].forEach(k=>{d.labDates[k==="tfgdir"?"tfg":k]=dt("fd_"+k)||fdef;});
  d.hta=$("hta").checked;d.dmTipo=$("dm").value;d.dm=d.dmTipo!=="";
  ["ecv","fam","aine","uro","tab"].forEach(k=>d[k]=$(k).checked);
  d.otrosAnt=$("otrosAnt").value.trim();d.terapia=$("terapia").value;
  d.modo=document.querySelector('input[name="modo"]:checked').value;
  d.creat=num("creat");d.tfg=null;d.tfgNote="";
  if(d.modo==="creat"){if(d.creat!=null&&d.edad!=null&&d.sexo)d.tfg=NP.ckd(d.creat,d.edad,d.sexo==="F");else if(d.creat!=null)d.tfgNote="Falta edad o sexo";}
  else d.tfg=num("tfgdir");
  d.rac=num("rac");d.fLab=d.modo==="creat"?d.labDates.creat:d.labDates.tfg;
  d.otros=[];if($("mk_hem").checked)d.otros.push("hematuria o sedimento anormal");if($("mk_img").checked)d.otros.push("alteración estructural en imagen");if($("mk_bx").checked)d.otros.push("hallazgo histológico");
  d.tfgPrev=num("tfgprev");d.racPrev=num("racprev");d.fPrev=dt("fprev");d.cronHC=$("cronHC").checked;d.agudo=$("agudo").checked;
  d.pas=num("pas");d.pad=num("pad");d.hba1c=num("hba1c");d.ldl=num("ldl");
  const peso=num("peso"),talla=num("talla");d.peso=peso;d.talla=talla;d.imc=(peso&&talla)?peso/Math.pow(talla/100,2):null;d.cint=num("cint");
  ["hb","k","ca","fos","pth","hco3","alb"].forEach(k=>d[k]=num(k));
  d.meds={raas:$("m_raas").value,sglt2:$("m_sglt2").value,stat:$("m_stat").value,fin:d.dmTipo==="2"?$("m_fin").value:"no"};
  d.dmAj=d.dm&&$("dmaj").checked;d.htaRes=$("htares").checked;
  d.sint=SINT.map(s=>({id:s[0],label:s[1],on:$("s_"+s[0]).checked}));
  d.sf1=$("sf1").value;d.kps=$("kps").value?Number($("kps").value):null;
  d.at={};["nefro","nut","enf","psi","ts","edu","flu","rcv"].forEach(k=>d.at[k]=$("at_"+k).checked);
  return d;
}

const ERC_TXT={si:["ERC: SÍ","Confirmada"],no:["ERC: NO","Sin ERC demostrada"],prov:["ERC: POR CONFIRMAR","Alteración sin cronicidad demostrada"],indet:["ERC: SIN DEFINIR","Faltan datos"],agudo:["AGUDO","Sospecha de deterioro agudo"],fuera:["FUERA DE RUTA","Diálisis o trasplante"]};
function render(){
  const d=read();
  $("tr-creat").hidden=d.modo!=="creat";$("tr-tfgdir").hidden=d.modo!=="tfg";
  $("tfgcalc").textContent=d.modo==="creat"?(d.tfg!=null?Math.round(d.tfg)+" ml/min/1,73 m²":(d.tfgNote||"—")):"";
  const showCompl=(d.tfg!=null&&d.tfg<60)||d.terapia==="tmnd"||d.terapia==="trr";
  document.querySelectorAll("tr.compl").forEach(t=>t.hidden=!showCompl);$("hint-compl").hidden=showCompl;
  $("box-cond").hidden=d.prof!=="nefro";
  $("tr-hba1c").hidden=!d.dm;
  const em=d.epsModel;$("epsmodel").textContent=d.eps?("Modelo de "+d.eps+": "+(em.inter==="MEDICO EXPERTO"?"médico experto cada "+(em.interMeses||1)+" mes(es) entre valoraciones de nefrología; ":"sin control intermedio; ")+"equipo multidisciplinario "+(em.multi==="PAQUETE"?"en paquete con nefrología":"según programa")+"; ajuste de metas por "+({"MEDICO EXPERTO":"médico experto","NEFROLOGIA":"nefrología"}[em.ajustePor]||"médico del programa")+"."):"";$("box-dmaj").hidden=!d.dm;$("box-fin").hidden=d.dmTipo!=="2";
  const G=NP.gStage(d.tfg);$("box-kps").hidden=!(G==="G4"||G==="G5"||d.terapia==="tmnd"||d.terapia==="trr");
  const nS=d.sint.filter(s=>s.on).length;$("sm7").textContent=nS?nS+" síntoma"+(nS>1?"s":""):"";
  const out=$("out");
  if(d.tfg==null&&d.rac==null&&!d.terapia){
    out.innerHTML='<div class="panel empty"><p style="font-size:16px;color:var(--ink);margin:0 0 6px"><strong>Escriba la creatinina (con edad y sexo) o la TFGe, y la RAC.</strong></p><p style="margin:0">Con eso aparece si tiene ERC, el grupo, la agenda con fechas fijas y la nota para la historia clínica. También puede cargar un ejemplo.</p></div>';return;
  }
  const c=NP.classify(d),P=NP.plan(d,c);
  $("sm3").textContent=(c.G||"")+(c.A?" "+c.A:"");
  const gc=c.grupo?"var(--g"+c.grupo+")":"var(--line)";
  const et=ERC_TXT[c.erc];
  let h='<section class="panel verdict" style="--gc:'+gc+'"><div>';
  h+='<div class="eyebrow">Resultado'+(isExample?'<span class="exflag">Ejemplo, no es un paciente real</span>':'')+(d.pid?' · '+esc(d.pid):'')+'</div>';
  h+='<div class="erc" style="margin-top:8px"><span class="pill '+c.erc+'">'+et[0]+'</span><span class="erc-txt">'+et[1]+'</span></div>';
  if(c.grupo&&c.erc!=="fuera")h+='<h2>'+NP.GRUPO[c.grupo]+(c.G==="G5"&&d.terapia==="tmnd"?' · TMND':c.G==="G5"&&d.terapia==="trr"?' · preparación TRR':'')+'</h2>';
  h+='<div class="chips">';
  if(c.G)h+='<span class="chip">Estadio <b>'+c.G+(c.A?' '+c.A:'')+'</b></span>';
  if(c.risk)h+='<span class="chip">Riesgo KDIGO <b>'+(c.erc==="no"?"sin ERC":c.risk)+'</b></span>';
  if(d.tfg!=null)h+='<span class="chip">TFGe <b>'+Math.round(d.tfg)+'</b></span>';
  if(c.kfre)h+='<span class="chip">KFRE 2/5 a <b>'+(c.kfre.r2*100).toFixed(1).replace(".",",")+' / '+(c.kfre.r5*100).toFixed(1).replace(".",",")+' %</b></span>';
  h+='</div>';
  const fl=[...c.flags];if(c.erc==="si"&&c.pers)fl.unshift("Cronicidad: "+c.pers+".");if(c.erc==="prov")fl.unshift("Criterios: "+c.crit.join("; ")+". Falta demostrar persistencia > 3 meses.");
  if(fl.length)h+='<ul class="flags">'+fl.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul>';
  h+='</div>';
  if(P.rev){const nx=P.next||P.rev;h+='<div class="next"><div class="l">Próximo contacto médico</div><div class="d">'+NP.fd(nx.date)+'</div><div class="w">'+esc(nx.who)+'</div>'+(nx.date!==P.rev.date&&P.rev.months?'<div class="w" style="margin-top:6px"><strong>'+esc(P.rev.who)+':</strong> '+NP.fd(P.rev.date)+'</div>':'')+(P.labCal&&P.labCal.length?'<div class="w" style="margin-top:6px"><strong>Paraclínicos:</strong> '+NP.fd(P.labCal[0].dt)+'</div>':'')+'</div>';}
  h+='</section>';

  if(P.actions.length){
    const ord={bad:0,warn:1,info:2};P.actions.sort((a,b)=>ord[a.lvl]-ord[b.lvl]);
    h+='<section class="panel"><h3>Para hacer en esta consulta</h3><div class="alerts">'+P.actions.map(a=>'<div class="alert '+a.lvl+'"><p>'+esc(a.t)+(a.when?' <span class="when">'+NP.fd(a.when)+'</span>':'')+'</p></div>').join("")+'</div></section>';
  }
  if(P.rows.length){
    if(P.labCal&&P.labCal.length)h+='<section class="panel"><h3>Calendario de paraclínicos</h3><div class="labcal">'+P.labCal.map(x=>'<div class="lc"><span class="mono">'+NP.fd(x.dt)+'</span><span>'+esc(x.items.join(", "))+'</span></div>').join("")+'</div><p class="note" style="margin:8px 0 0">Cada fecha sale del resultado previo de ese examen más su intervalo (por frecuencia o individualizado). Lo que vence dentro de 35 días se adelanta para tomarlo en la misma muestra.</p></section>';
    h+='<section class="panel"><h3>Agenda del paciente</h3><div class="tablebox"><table class="agenda"><thead><tr><th>Intervención</th><th>Cuándo</th><th>Por qué</th></tr></thead><tbody>';
    let sec="";
    P.rows.forEach(r=>{if(r.sec!==sec){sec=r.sec;h+='<tr><td class="sec" colspan="3">'+sec+'</td></tr>';}
      h+='<tr><td><strong>'+esc(r.act)+'</strong><span class="sub">'+esc(r.what)+'</span></td><td class="when"><span class="dt'+(r.now?' now':'')+'">'+(r.dt?(r.now?'Ahora':NP.fd(r.dt)):'Por definir')+'</span><span class="fq">'+esc(r.cada)+'</span></td><td class="why">'+esc(r.why)+' <span class="tag'+(r.tag==="Propuesta"?' prop':r.tag==="Individualizado"?' ind':'')+'">'+r.tag+'</span></td></tr>';});
    h+='</tbody></table></div><p class="note" style="margin:10px 0 0">«Propuesta» = frecuencia fija adoptada para la IPS dentro de los rangos de CAC/KDIGO; pendiente de adopción formal.</p></section>';
  }
  if(P.interp&&P.interp.length){
    h+='<section class="panel"><h3>Interpretación de resultados</h3><div class="interp">'+P.interp.map(i=>'<div class="irow"><span class="e">'+esc(i.e)+(i.f?'<span class="sub mono">'+NP.fd(i.f)+'</span>':'')+'</span><span class="v '+i.cls+'">'+esc(i.v)+'</span><span class="t">'+esc(i.t)+'</span></div>').join("")+'</div></section>';
  }
  if(P.ind&&P.ind.length){
    const ok=P.ind.filter(i=>i.s==="ok").length,app=P.ind.filter(i=>i.s!=="na").length;
    h+='<details class="panel"><summary>Indicadores CAC del paciente · cumple '+ok+' de '+app+'</summary><div class="ind">'+P.ind.map(i=>'<span class="c">'+i.code+'</span><span class="st '+i.s+'">'+(i.s==="ok"?"Cumple":i.s==="no"?"No cumple":"Sin dato")+'</span><span>'+esc(i.t)+(i.det?' <span class="note">· '+esc(i.det)+'</span>':'')+'</span>').join("")+'</div><p class="note" style="margin:10px 0 0">Asume que los resultados ingresados son de la fecha de laboratorio indicada. La evaluación de cohorte se hace con el nominal mensual.</p></details>';
  }
  h+='<section class="panel"><h3>Nota para la historia clínica</h3><div class="copyrow"><button type="button" class="btn primary" id="btncopy">Copiar enfermedad actual, análisis y plan</button><span class="note" id="copymsg"></span></div><details><summary class="note" style="cursor:pointer;margin-top:8px">Ver o editar el texto antes de copiar</summary><textarea id="note" aria-label="Nota para la historia clínica">'+esc(NP.note(d,c,P))+'</textarea></details></section>';
  const BK=window.MG&&window.MG.book;
  if(BK&&d.pid&&BK.pac.some(x=>x.codigo===d.pid)&&P.next&&P.next.date){const sv=/nefrolog/i.test(P.next.who)?"NEFROLOGIA":/experto/i.test(P.next.who)?"MEDICO EXPERTO":(P.next.who.indexOf("ajuste")>=0&&(d.epsModel||{}).ajustePor==="NEFROLOGIA")?"NEFROLOGIA":"MEDICO PROGRAMA";
    h+='<section class="panel"><h3>Agendar antes de que salga</h3><p class="note" style="margin:0 0 10px">Próximo contacto: <strong>'+NP.fd(P.next.date)+'</strong> ('+esc(P.next.who.toLowerCase())+'). Asignar la cita en la consulta evita que el paciente quede sin fecha.</p><div class="copyrow"><button type="button" class="btn primary" id="btnagd">Agendar '+esc(sv==="NEFROLOGIA"?"nefrología":sv==="MEDICO EXPERTO"?"médico experto":"control médico")+'</button></div></section>';
    setTimeout(()=>{const b=$("btnagd");if(b)b.addEventListener("click",()=>window.MG.agendar(d.pid,sv,P.next.date));},0);}
  const DBM=window.MG&&window.MG.dbMode;
  if(DBM)h+='<section class="panel"><h3>Guardar en la base de datos</h3><p class="note" style="margin:0 0 10px">Guarda la valoración, los paraclínicos nuevos con su fecha y el plan con sus fechas programadas. Los registros guardados no se editan: si hay un error se anulan con motivo.'+(d.pid?'':' <strong style="color:var(--bad)">Seleccione o escriba el código del paciente.</strong>')+'</p><div class="copyrow"><button type="button" class="btn primary" id="btnsave">Guardar valoración</button><span class="note" id="savemsg"></span></div></section>';
  h+='<section class="panel"'+(DBM?' hidden':'')+'><h3>Registrar en el libro de cohorte</h3><p class="note" style="margin:0 0 10px">Copie cada bloque y péguelo en la primera fila vacía (columna A) de la hoja indicada del libro de Excel.'+(d.pid?'':' <strong style="color:var(--bad)">Escriba el código del paciente en el paso 1.</strong>')+'</p><div class="copyrow"><button type="button" class="btn" data-copy="val">Copiar fila · Valoraciones</button><button type="button" class="btn" data-copy="lab">Copiar filas · Laboratorios</button><button type="button" class="btn" data-copy="at">Copiar fila · Atenciones</button><span class="note" id="regmsg"></span></div><textarea id="regtxt" class="regtxt" hidden aria-label="Filas para el libro"></textarea></section>';
  out.innerHTML=h;
  if(DBM)$("btnsave").addEventListener("click",async()=>{const b=$("btnsave");b.disabled=true;$("savemsg").textContent="Guardando…";try{const r=await window.MG.saveValoracion(d,c,P,$("note").value);$("savemsg").textContent=r;}catch(e){const m=$("savemsg");m.textContent="No se guardó: "+(e.message||e);b.disabled=false;const B=window.MG.book;if(d.pid&&!(B&&B.ids&&B.ids[d.pid])){const nb=document.createElement("button");nb.type="button";nb.className="btn";nb.textContent="Crear paciente con este código";nb.style.marginLeft="8px";nb.addEventListener("click",()=>window.MG.newPatientFrom(d));m.appendChild(nb);}}});
  const RG=regRows(d,c,P);
  out.querySelectorAll("[data-copy]").forEach(b=>b.addEventListener("click",()=>{const k=b.dataset.copy,rows=RG[k];const t=$("regtxt");
    if(!d.pid){$("regmsg").textContent="Falta el código del paciente.";return;}
    if(!rows.length){$("regmsg").textContent="No hay filas nuevas para esta hoja.";return;}
    const txt=rows.map(r=>r.map(x=>x==null?"":String(x).replace(/[\t\n]/g," ")).join("\t")).join("\n");t.value=txt;
    const sheet={val:"Valoraciones",lab:"Laboratorios",at:"Atenciones"}[k];
    const ok=()=>{t.hidden=true;$("regmsg").textContent=rows.length+" fila(s) copiada(s) para la hoja "+sheet+".";};
    const fb=()=>{t.hidden=false;t.focus();t.select();$("regmsg").textContent="Texto seleccionado: use Ctrl+C y pegue en la hoja "+sheet+".";};
    try{navigator.clipboard.writeText(txt).then(ok,fb);}catch(e){fb();}}));
  $("btncopy").addEventListener("click",()=>{const t=$("note");const ok=()=>{$("copymsg").textContent="Copiado.";};const fb=()=>{t.closest("details").open=true;t.focus();t.select();$("copymsg").textContent="Texto seleccionado: use Ctrl+C.";};try{navigator.clipboard.writeText(t.value).then(ok,fb);}catch(e){fb();}});
}

/* Ejemplos (no son pacientes reales) */
const today=new Date();
const EX={
  a:{eps:"EPS Familiar de Colombia",causa:"hta",conducta:"sigue",edad:"64",sexo:"M",hta:true,modo:"tfg",tfgdir:"50",rac:"12",tfgprev:"54",fprev:-6,pas:"138",pad:"84",ldl:"118",peso:"82",talla:"170",cint:"99",hb:"13,4",k:"4,6",ca:"9,3",fos:"3,8",pth:"72",m_raas:"est",sf1:"Buena",at_nut:true,at_enf:true,at_edu:true,at_flu:true,at_rcv:true,fdl:{ldl:-2,hb:-1,ca:-7,fos:-7,pth:-7}},
  b:{eps:"Nueva EPS",causa:"dm",conducta:"sigue",edad:"58",sexo:"F",hta:true,dm:"2",modo:"tfg",tfgdir:"31",rac:"180",tfgprev:"38",racprev:"150",fprev:-12,pas:"146",pad:"88",hba1c:"9,4",ldl:"96",peso:"78",talla:"158",cint:"98",hb:"11,2",k:"5,1",ca:"9,0",fos:"5,1",pth:"95",hco3:"21",alb:"3,8",m_raas:"est",m_stat:"est",dmaj:true,s_fatiga:true,s_calambres:true,sf1:"Regular",at_nut:true,at_enf:true,at_edu:true,at_rcv:true,fdl:{hba1c:-1,ldl:-3,pth:-5}},
  d:{eps:"Nueva EPS",causa:"dm",conducta:"sigue",tipo:"primera",edad:"45",sexo:"F",dm:"2",modo:"tfg",tfgdir:"95",rac:"450",racprev:"410",fprev:-4,pas:"128",pad:"78",hba1c:"6,8",ldl:"88",k:"4,4",m_raas:"aj",m_sglt2:"est",m_stat:"est",sf1:"Buena",at_nut:true,at_edu:true,at_flu:true,at_rcv:true,fdl:{}},
  c:{eps:"EPS Familiar de Colombia",causa:"hta",conducta:"tmnd",edad:"79",sexo:"M",hta:true,terapia:"tmnd",modo:"creat",creat:"4,6",rac:"520",tfgprev:"14",fprev:-6,pas:"134",pad:"72",ldl:"84",peso:"61",talla:"166",hb:"9,6",k:"5,4",ca:"8,7",fos:"5,2",pth:"210",hco3:"18",alb:"3,4",m_raas:"est",m_stat:"est",s_fatiga:true,s_prurito:true,s_apetito:true,s_sueno:true,sf1:"Mala",kps:"60",at_nefro:true,at_nut:true,at_enf:true,at_psi:true,at_ts:true,at_edu:true,at_flu:true,at_rcv:true,fdl:{ldl:-4}}
};
const LABK=["creat","tfgdir","rac","hba1c","ldl","hb","k","ca","fos","pth","hco3","alb"];
const TXT=["pid","edad","tfgprev","racprev","pas","pad","peso","talla","cint","otrosAnt"].concat(LABK);
const CHKS=()=>Array.from(document.querySelectorAll('#frm input[type=checkbox]')).map(e=>e.id);
const SELS=["prof","tipo","causa","conducta","eps","sexo","dm","terapia","m_raas","m_sglt2","m_stat","m_fin","sf1","kps"];
function load(k){
  if($("pickmsg"))$("pickmsg").textContent="";
  TXT.forEach(i=>$(i).value="");CHKS().forEach(i=>$(i).checked=false);SELS.forEach(i=>$(i).selectedIndex=0);
  LABK.forEach(i=>$("fd_"+i).value="");$("fnac").value="";
  $("modo-creat").checked=true;$("fcons").value=iso(today);$("flab").value=iso(today);$("fprev").value="";
  if(k!=="clear"){const e=EX[k];Object.keys(e).forEach(key=>{const v=e[key];
    if(key==="modo")$("modo-"+(v==="tfg"?"tfg":"creat")).checked=true;
    else if(key==="fprev")$("fprev").value=iso(NP.addMonths(today,v));
    else if(key==="fdl")Object.keys(v).forEach(x=>{$("fd_"+x).value=iso(NP.addMonths(today,v[x]));});
    else if(typeof v==="boolean")$(key).checked=v;else $(key).value=v;});isExample=true;}
  else isExample=false;
  render();
}
document.querySelectorAll("[data-ex]").forEach(b=>b.addEventListener("click",()=>load(b.dataset.ex)));
$("frm").addEventListener("input",()=>{isExample=false;render();});
$("frm").addEventListener("change",()=>{isExample=false;render();});
$("frm").addEventListener("submit",e=>e.preventDefault());
/* Filas para el libro / la base de datos */
const MEDTXT={no:"NO RECIBE",est:"ESTABLE",aj:"INICIA O AJUSTA",ci:"CONTRAINDICADO"},PROFTXT={nefro:"NEFROLOGIA",exp:"MEDICO EXPERTO",mi:"MEDICINA INTERNA",mg:"MEDICINA GENERAL"},CONDTXT={sigue:"CONTINUA NEFROLOGIA",contra:"CONTRARREFERENCIA",prep:"PREPARACION TRR",tmnd:"TMND"},CAUSATXT={dm:"DIABETICA",hta:"HIPERTENSIVA",glom:"GLOMERULOPATIA",pq:"POLIQUISTOSIS",uro:"UROPATIA OBSTRUCTIVA",nti:"TUBULOINTERSTICIAL",otra:"OTRA",desc:"NO ESTABLECIDA"},ERCTXT={si:"SI",no:"NO",prov:"POR CONFIRMAR",indet:"SIN DEFINIR",agudo:"SOSPECHA AGUDO",fuera:"FUERA DE RUTA"};
window.CODES={MEDTXT,PROFTXT,CONDTXT,CAUSATXT,ERCTXT};
const dec=v=>v==null?"":String(Math.round(v*100)/100).replace(".",",");
const LABMAP=[["CREATININA","creat","creat"],["TFGE_REPORTADA","tfg","tfg"],["RAC","rac","rac"],["HBA1C","hba1c","hba1c"],["LDL","ldl","ldl"],["HEMOGLOBINA","hb","hb"],["POTASIO","k","k"],["CALCIO","ca","ca"],["FOSFORO","fos","fos"],["PTH","pth","pth"],["BICARBONATO","hco3","hco3"],["ALBUMINA","alb","alb"],["FOSFATASA_ALCALINA","fa","fa"]];
function labList(d){ // [{examen, valor, fecha}]
  const B=window.MG&&window.MG.book,ex=(B&&B.L[d.pid])||[];
  return LABMAP.map(([E,dk,bk])=>{let v=dk==="creat"?(d.modo==="creat"?d.creat:null):dk==="tfg"?(d.modo==="tfg"?d.tfg:null):dk==="hba1c"?(d.dm?d.hba1c:null):d[dk];
    const f=(d.labDates||{})[dk]||d.fLab;return{E,bk,v,f};}).filter(x=>x.v!=null&&!ex.some(l=>l.k===x.bk&&NP.days(l.fecha,x.f)===0));
}
function regRows(d,c,P){
  const fc=NP.fd(d.fCons),code=d.pid;
  const val=[[code,fc,PROFTXT[d.prof]||"",d.tipo==="primera"?"PRIMERA VEZ":"CONTROL",dec(d.pas),dec(d.pad),dec(d.peso),dec(d.talla),dec(d.cint),MEDTXT[d.meds.raas],MEDTXT[d.meds.sglt2],MEDTXT[d.meds.stat],d.dmTipo==="2"?MEDTXT[d.meds.fin]:"",d.dm?(d.dmAj?"SI":"NO"):"",d.htaRes?"SI":"NO",d.cronHC?"SI":"NO",CONDTXT[d.conducta]||"",CAUSATXT[d.causa]||"",d.sf1?d.sf1.toUpperCase():"",d.kps==null?"":d.kps,d.sint.filter(s=>s.on).map(s=>s.label).join("; "),ERCTXT[c.erc]||"",c.G||"",c.A||"",c.grupo||"",P.rev&&P.rev.date?NP.fd(P.rev.date):"",""]];
  const lab=labList(d).map(x=>[code,NP.fd(x.f),x.E,dec(x.v),""]);
  const at=d.prof?[[code,fc,PROFTXT[d.prof],"REALIZADA",""]]:[];
  return{val,lab,at};
}
window.APP={read,labList,regRows};
/* Precarga desde el libro o la base de datos */
$("pick").addEventListener("change",()=>{const code=$("pick").value;if(!code||!window.MG)return;const fc=dt("fcons")||new Date();const S=window.MG.snapshotFor(code,fc);if(!S)return;
  const keepProf=$("prof").value;load("clear");$("fcons").value=iso(fc);$("prof").value=keepProf;$("pick").value=code;
  const p=S.p,set=(id,v)=>{$(id).value=v==null?"":String(typeof v==="number"?Math.round(v*100)/100:v).replace(".",",");};
  set("pid",p.codigo);if(p.fnac)$("fnac").value=iso(p.fnac);set("edad",COH.age(p.fnac,fc));$("sexo").value=p.sexo||"";$("eps").value=p.eps||"";
  $("hta").checked=p.hta;$("dm").value=p.dmTipo||"";$("ecv").checked=p.ecv;
  $("causa").value=S.d.causa||"";$("terapia").value=p.terapia||"";$("tipo").value=S.lv?"control":"primera";
  if(S.tl){if(S.tl.cr!=null){$("modo-creat").checked=true;set("creat",S.tl.cr);$("fd_creat").value=iso(S.tl.fecha);}else{$("modo-tfg").checked=true;set("tfgdir",Math.round(S.tl.v));$("fd_tfgdir").value=iso(S.tl.fecha);}$("flab").value=iso(S.tl.fecha);}
  if(S.rl){set("rac",S.rl.v);$("fd_rac").value=iso(S.rl.fecha);}
  if(S.tprev){set("tfgprev",Math.round(S.tprev.v));$("fprev").value=iso(S.tprev.fecha);}else if(S.rprev){set("racprev",S.rprev.v);$("fprev").value=iso(S.rprev.fecha);}
  $("cronHC").checked=!!(S.lv&&S.lv.cron);
  ["hba1c","ldl","hb","k","ca","fos","pth","hco3","alb"].forEach(k=>{const l=S.last(k);if(!l)return;set(k,l.v);$("fd_"+k).value=iso(l.fecha);});
  if(S.lv){["raas","sglt2","stat","fin"].forEach(k=>{$("m_"+k).value=S.lv[k]==="aj"?"est":(S.lv[k]||"no");});$("htares").checked=!!S.lv.htaRes;}
  Object.keys(S.d.at).forEach(k=>{$("at_"+k).checked=!!S.d.at[k];});
  isExample=false;render();
  $("pickmsg").textContent="Cargado: datos del paciente, último resultado de cada examen con su fecha, tratamiento de la última valoración y atenciones del último año. Registre hoy PA, peso, síntomas y cambios de tratamiento; actualice los exámenes nuevos con su fecha.";
});
load("a");
})();
