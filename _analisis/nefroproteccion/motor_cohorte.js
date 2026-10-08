
/* ===================== MOTOR DE COHORTE (libro de Excel o base de datos) ===================== */
const COH=(function(){
"use strict";
const EPS=["EPS Familiar de Colombia","Nueva EPS","Mallamas EPS"];
const norm=s=>String(s==null?"":s).normalize("NFD").replace(/[̀-ͯ]/g,"").trim().toUpperCase();
const key=k=>norm(k).toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"");
function toDate(v){
  if(v==null||v==="")return null;
  if(v instanceof Date&&!isNaN(v))return new Date(v.getFullYear(),v.getMonth(),v.getDate());
  if(typeof v==="number"&&v>0&&v<80000){const d=new Date(Math.round((v-25569)*86400000));return new Date(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate());}
  const s=String(v).trim();let m=s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);if(m)return new Date(+m[3],+m[2]-1,+m[1]);
  m=s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);if(m)return new Date(+m[1],+m[2]-1,+m[3]);return null;
}
function toNum(v){if(v==null||v==="")return null;if(typeof v==="number")return isFinite(v)?v:null;const t=String(v).trim().replace(",",".");if(!/^-?\d+(\.\d+)?$/.test(t))return null;return parseFloat(t);}
const EX={CREATININA:"creat",TFGE_REPORTADA:"tfg","TFGE REPORTADA":"tfg",TFGE:"tfg",RAC:"rac",HBA1C:"hba1c",LDL:"ldl",HEMOGLOBINA:"hb",POTASIO:"k",CALCIO:"ca",FOSFORO:"fos",PTH:"pth",BICARBONATO:"hco3",ALBUMINA:"alb",FOSFATASA_ALCALINA:"fa","FOSFATASA ALCALINA":"fa"};
const EXNAME={creat:"Creatinina",tfg:"TFGe reportada",rac:"RAC",hba1c:"HbA1c",ldl:"cLDL",hb:"Hemoglobina",k:"Potasio",ca:"Calcio",fos:"Fósforo",pth:"PTH",hco3:"Bicarbonato",alb:"Albúmina",fa:"Fosfatasa alcalina"};
const MED={"NO RECIBE":"no",ESTABLE:"est","INICIA O AJUSTA":"aj",CONTRAINDICADO:"ci"};
const CAUSA={DIABETICA:"dm",HIPERTENSIVA:"hta",GLOMERULOPATIA:"glom",POLIQUISTOSIS:"pq","UROPATIA OBSTRUCTIVA":"uro",TUBULOINTERSTICIAL:"nti",OTRA:"otra","NO ESTABLECIDA":"desc"};
const COND={"CONTINUA NEFROLOGIA":"sigue",CONTRARREFERENCIA:"contra","PREPARACION TRR":"prep",TMND:"tmnd"};
const SIT={"SIN TRR":"","G5 TMND":"tmnd","G5 PREPARACION TRR":"trr"};
const DMT={NO:"","TIPO 2":"2","TIPO 1":"1",OTRA:"otra"};
const PROFC={NEFROLOGIA:"nefro","MEDICO EXPERTO":"exp","MEDICINA INTERNA":"mi","MEDICINA GENERAL":"mg"};
const RANGE={creat:[0.2,25],tfg:[1,200],rac:[0,20000],hba1c:[3,20],ldl:[5,500],hb:[3,22],k:[1.5,9],ca:[4,16],fos:[0.5,15],pth:[1,4000],hco3:[5,45],alb:[1,6.5],fa:[10,3000]};
function matchEps(v){const n=norm(v);if(!n)return"";if(n.includes("FAMILIAR"))return EPS[0];if(n.includes("NUEVA"))return EPS[1];if(n.includes("MALLAMAS"))return EPS[2];return"";}
function rows(wb,name){const sn=wb.SheetNames.find(n=>norm(n)===norm(name));if(!sn)return null;return XLSX.utils.sheet_to_json(wb.Sheets[sn],{raw:true,defval:null}).map((r,i)=>{const o={_row:i+2};for(const k in r)o[key(k)]=r[k];return o;});}
const isEx=c=>/^EJEMPLO/i.test(String(c||""));
const code=v=>String(v==null?"":v).trim();
const si=v=>v===true||norm(v)==="SI";
const str=v=>v==null?"":String(v);

function sheetsFromWb(wb){const S={};["Pacientes","Laboratorios","Valoraciones","Atenciones","Novedades","Jornadas","Citas","Citas_log","Contactos"].forEach(s=>S[s]=rows(wb,s));return S;}
function parse(wb){return parseRows(sheetsFromWb(wb));}
function parseRows(S){
  const B={pac:[],lab:[],val:[],at:[],nov:[],jor:[],cit:[],clog:[],ctc:[],issues:[],missing:[]};
  ["Pacientes","Laboratorios","Valoraciones","Atenciones"].forEach(s=>{if(!S[s])B.missing.push(s);});
  const today=new Date();const iss=(sheet,row,c,txt,lvl)=>B.issues.push({sheet,row,c,txt,lvl:lvl||"warn"});
  const seen={};
  (S.Pacientes||[]).forEach(r=>{const c=code(r.codigo);if(!c||isEx(c))return;
    if(seen[c]){iss("Pacientes",r._row,c,"Código duplicado: se usa la primera fila","bad");return;}seen[c]=1;
    const p={codigo:c,id:r._id||null,tipodoc:str(r.tipo_documento),doc:str(r.documento),nombre:str(r.nombre_completo),fnac:toDate(r.fecha_nacimiento),
      sexo:norm(r.sexo)==="F"?"F":norm(r.sexo)==="M"?"M":"",eps:matchEps(r.eps),municipio:str(r.municipio),
      ap1:str(r.primer_apellido),ap2:str(r.segundo_apellido),n1:str(r.primer_nombre),n2:str(r.segundo_nombre),tel:str(r.telefono||r.telefono_1),tel2:str(r.telefono_2),dir:str(r.direccion),acud:str(r.acudiente||r.acudiente_nombre),acudTel:str(r.telefono_acudiente||r.acudiente_telefono),
      fing:toDate(r.fecha_ingreso),hta:si(r.hta),dmTipo:DMT[norm(r.diabetes)]||"",ecv:si(r.enfermedad_cardiovascular),causa:CAUSA[norm(r.causa_erc)]||"",
      terapia:SIT[norm(r.situacion_renal)]||"",estado:norm(r.estado)||"ACTIVO",festado:toDate(r.fecha_estado),correo:str(r.correo),obs:str(r.observaciones)};
    if(!p.fnac)iss("Pacientes",r._row,c,"Sin fecha de nacimiento: no se puede calcular edad ni TFGe","bad");
    if(!p.sexo)iss("Pacientes",r._row,c,"Sin sexo: no se puede calcular TFGe","bad");
    if(!p.eps)iss("Pacientes",r._row,c,"EPS vacía o no reconocida ("+(r.eps||"vacía")+")");
    if(!p.tel&&!p.tel2&&!p.acudTel&&p.estado==="ACTIVO")iss("Pacientes",r._row,c,"Sin teléfono de contacto","warn");
    if(!p.hta&&!p.dmTipo&&!p.causa)iss("Pacientes",r._row,c,"Sin HTA, DM ni causa de ERC registradas","info");
    B.pac.push(p);});
  (S.Laboratorios||[]).forEach(r=>{const c=code(r.codigo);if(!c||isEx(c))return;
    if(!seen[c]){iss("Laboratorios",r._row,c,"El código no existe en Pacientes","bad");return;}
    const k=EX[norm(r.examen)],f=toDate(r.fecha),v=toNum(r.valor);
    if(!k){iss("Laboratorios",r._row,c,"Examen no reconocido: "+(r.examen||"vacío"));return;}
    if(!f){iss("Laboratorios",r._row,c,"Fecha vacía o inválida");return;}
    if(f>today)iss("Laboratorios",r._row,c,"Fecha futura ("+NP.fd(f)+")","bad");
    if(v==null){iss("Laboratorios",r._row,c,"Valor no numérico: "+(r.valor==null?"vacío":r.valor),"bad");return;}
    const rg=RANGE[k];if(rg&&(v<rg[0]||v>rg[1]))iss("Laboratorios",r._row,c,EXNAME[k]+" "+v+" fuera de rango plausible: verifique valor y unidad","bad");
    B.lab.push({c,fecha:f,k,v,id:r._id||null});});
  (S.Valoraciones||[]).forEach(r=>{const c=code(r.codigo);if(!c||isEx(c))return;
    if(!seen[c]){iss("Valoraciones",r._row,c,"El código no existe en Pacientes","bad");return;}
    const f=toDate(r.fecha);if(!f){iss("Valoraciones",r._row,c,"Fecha vacía o inválida");return;}
    B.val.push({c,id:r._id||null,fecha:f,prof:norm(r.profesional),tipo:norm(r.tipo),pas:toNum(r.pa_sistolica),pad:toNum(r.pa_diastolica),peso:toNum(r.peso_kg),talla:toNum(r.talla_cm),cint:toNum(r.cintura_cm),
      raas:MED[norm(r.ieca_ara_ii)]||"no",sglt2:MED[norm(r.isglt2)]||"no",stat:MED[norm(r.estatina)]||"no",fin:MED[norm(r.finerenona)]||"no",dmAj:si(r.ajuste_dm),htaRes:si(r.hta_resistente),cron:si(r.cronicidad_en_hc),
      conducta:COND[norm(r.conducta)]||"",causa:CAUSA[norm(r.causa_erc)]||"",sf1:r.salud_autopercibida?str(r.salud_autopercibida):"",kps:toNum(r.karnofsky),prox:toDate(r.proximo_control)});});
  (S.Atenciones||[]).forEach(r=>{const c=code(r.codigo);if(!c||isEx(c))return;
    if(!seen[c]){iss("Atenciones",r._row,c,"El código no existe en Pacientes","bad");return;}
    const f=toDate(r.fecha);if(!f){iss("Atenciones",r._row,c,"Fecha vacía o inválida");return;}
    B.at.push({c,id:r._id||null,fecha:f,dis:norm(r.disciplina),estado:norm(r.estado)||"REALIZADA"});});
  (S.Novedades||[]).forEach(r=>{const c=code(r.codigo);if(!c||isEx(c))return;const f=toDate(r.fecha);if(!f)return;B.nov.push({c,fecha:f,tipo:norm(r.tipo),det:str(r.detalle)});});
  /* Agenda: jornadas, citas, bitácora y contactos (hojas opcionales) */
  (S.Jornadas||[]).forEach(r=>{const id=str(r.id_jornada).trim(),f=toDate(r.fecha);if(!id||!f){if(id||f)iss("Jornadas",r._row,id,"Jornada sin ID o sin fecha");return;}
    B.jor.push({id,fecha:f,serv:norm(r.servicio)||"NEFROLOGIA",prof:str(r.profesional),hIni:hm(r.hora_inicio)||"07:00",hFin:hm(r.hora_fin)||"12:00",dur:toNum(r.duracion_cupo_min)||20,nAg:toNum(r.agendas_simultaneas)===2?2:1,estado:norm(r.estado)||"ABIERTA",motivo:str(r.motivo_cancelacion),obs:str(r.observaciones),usuario:str(r.usuario),reg:str(r.registrado)});});
  const jids=new Set(B.jor.map(j=>j.id));
  (S.Citas||[]).forEach(r=>{const id=str(r.id_cita).trim(),c=code(r.codigo),f=toDate(r.fecha);if(!id&&!c)return;
    if(!id||!c||!f){iss("Citas",r._row,c,"Cita sin ID, código o fecha","bad");return;}
    if(!seen[c]){iss("Citas",r._row,c,"El código no existe en Pacientes","bad");return;}
    if(!jids.has(str(r.id_jornada)))iss("Citas",r._row,c,"La cita "+id+" apunta a una jornada que no existe");
    const est=norm(r.estado)||"ASIGNADA";
    B.cit.push({id,c,jor:str(r.id_jornada),fecha:f,hora:hm(r.hora),ag:str(r.agenda)||"A",serv:norm(r.servicio),tipo:norm(r.tipo),origen:norm(r.origen),fSol:toDate(r.fecha_solicitud),fDes:toDate(r.fecha_deseada),fAsig:toDate(r.fecha_asignacion),estado:est,conf:norm(r.confirmacion),hLleg:hm(r.hora_llegada),hAten:hm(r.hora_atencion),resp:norm(r.responsable),motivo:str(r.motivo),avisoH:toNum(r.aviso_horas),deId:str(r.cita_anterior),reId:str(r.reprogramada_en),obs:str(r.observaciones),usuario:str(r.usuario),act:str(r.actualizado)});});
  (S.Citas_log||[]).forEach(r=>{if(!r.id&&!r.accion)return;B.clog.push({fh:str(r.fecha_y_hora),id:str(r.id),c:str(r.codigo),acc:str(r.accion),de:str(r.estado_anterior),a:str(r.estado_nuevo),motivo:str(r.motivo),usuario:str(r.usuario)});});
  (S.Contactos||[]).forEach(r=>{if(!r.codigo)return;B.ctc.push({fh:str(r.fecha_y_hora),c:code(r.codigo),cita:str(r.id_cita),medio:norm(r.medio),res:norm(r.resultado),obs:str(r.observaciones),usuario:str(r.usuario)});});
  B.L=idxBy(B.lab);B.V=idxBy(B.val);B.N=idxBy(B.nov);B.C={};B.atBase=B.at;reindexCitas(B);
  return B;
}
const idxBy=(arr)=>{const o={};arr.forEach(x=>{(o[x.c]=o[x.c]||[]).push(x);});for(const k in o)o[k].sort((a,b)=>a.fecha-b.fecha);return o;};
function hm(v){if(v==null||v==="")return"";if(typeof v==="number"){if(v>=0&&v<1){const m=Math.round(v*1440);return String(Math.floor(m/60)).padStart(2,"0")+":"+String(m%60).padStart(2,"0");}return"";}
  if(v instanceof Date)return String(v.getHours()).padStart(2,"0")+":"+String(v.getMinutes()).padStart(2,"0");const m=/^(\d{1,2}):(\d{2})/.exec(String(v).trim());return m?m[1].padStart(2,"0")+":"+m[2]:"";}
/* Una cita atendida cuenta como atención realizada de su disciplina: la hoja Citas es la fuente; no se duplica en Atenciones */
const SERV2DIS={NEFROLOGIA:"NEFROLOGIA",NUTRICION:"NUTRICION",ENFERMERIA:"ENFERMERIA",PSICOLOGIA:"PSICOLOGIA","TRABAJO SOCIAL":"TRABAJO SOCIAL",EDUCACION:"EDUCACION","SOPORTE PALIATIVO":"SOPORTE PALIATIVO","QUIMICA FARMACEUTICA":"QUIMICA FARMACEUTICA","MEDICO EXPERTO":"MEDICO EXPERTO","MEDICO PROGRAMA":"MEDICINA GENERAL"};
function reindexCitas(B){B.CI=idxBy(B.cit);const der=[];B.cit.forEach(x=>{if(x.estado!=="ATENDIDA")return;let dis=SERV2DIS[x.serv];if(x.serv==="VACUNACION")dis=/INFLUENZA/.test(x.tipo||"")?"VACUNA INFLUENZA":null;if(dis)der.push({c:x.c,fecha:x.fecha,dis,estado:"REALIZADA",cita:x.id});});B.at=(B.atBase||[]).concat(der);B.A=idxBy(B.at);}
/* Base de datos (PostgREST) -> mismas estructuras que el libro */
function fromApi(D){
  const epsN={};D.eps.forEach(e=>epsN[e.id]=e.nombre);const byId={};D.pac.forEach(p=>byId[p.id]=p.codigo);
  const yn=b=>b==null?"":(b?"SI":"NO");
  const S={
    Pacientes:D.pac.map((p,i)=>({_row:"id "+p.id,_id:p.id,codigo:p.codigo,tipo_documento:p.tipo_documento,documento:p.documento,nombre_completo:p.nombre_completo,fecha_nacimiento:p.fecha_nacimiento,sexo:p.sexo,eps:epsN[p.eps_id]||"",municipio:p.municipio,telefono_1:p.telefono_1,telefono_2:p.telefono_2,direccion:p.direccion,acudiente_nombre:p.acudiente_nombre,acudiente_telefono:p.acudiente_telefono,fecha_ingreso:p.fecha_ingreso,hta:yn(p.hta),diabetes:p.diabetes,enfermedad_cardiovascular:yn(p.enf_cardiovascular),causa_erc:p.causa_erc,situacion_renal:p.situacion_renal,estado:p.estado,fecha_estado:p.fecha_estado,correo:p.correo,observaciones:p.observaciones})),
    Laboratorios:D.lab.map(l=>({_row:"id "+l.id,_id:l.id,codigo:byId[l.paciente_id],fecha:l.fecha_toma,examen:l.examen,valor:Number(l.valor)})),
    Valoraciones:D.val.map(v=>({_row:"id "+v.id,_id:v.id,codigo:byId[v.paciente_id],fecha:v.fecha,profesional:v.profesional,tipo:v.tipo,pa_sistolica:v.pa_sistolica,pa_diastolica:v.pa_diastolica,peso_kg:v.peso_kg==null?null:Number(v.peso_kg),talla_cm:v.talla_cm==null?null:Number(v.talla_cm),cintura_cm:v.cintura_cm==null?null:Number(v.cintura_cm),ieca_ara_ii:v.ieca_ara_ii,isglt2:v.isglt2,estatina:v.estatina,finerenona:v.finerenona,ajuste_dm:yn(v.ajuste_dm),hta_resistente:yn(v.hta_resistente),cronicidad_en_hc:yn(v.cronicidad_en_hc),conducta:v.conducta,causa_erc:v.causa_erc,salud_autopercibida:v.salud_autopercibida,karnofsky:v.karnofsky,proximo_control:v.proximo_control})),
    Atenciones:D.at.map(a=>({_row:"id "+a.id,_id:a.id,codigo:byId[a.paciente_id],fecha:a.fecha,disciplina:a.disciplina,estado:a.estado})),
    Novedades:D.nov.map(n=>({_row:"id "+n.id,codigo:byId[n.paciente_id],fecha:n.fecha,tipo:n.tipo,detalle:n.detalle}))};
  const B=parseRows(S);B.ids={};D.pac.forEach(p=>B.ids[p.codigo]=p.id);B.epsIds={};D.eps.forEach(e=>B.epsIds[e.nombre]=e.id);
  (D.con||[]).forEach(x=>{const c=byId[x.paciente_id];if(!c)return;(B.C[c]=B.C[c]||[]).push({fecha:new Date(x.fecha_hora),medio:x.medio,resultado:x.resultado,cita:toDate(x.cita_fecha),obs:[x.motivo,x.observaciones].filter(Boolean).join(" · ")});});
  for(const k in B.C)B.C[k].sort((a,b)=>a.fecha-b.fecha);
  return B;
}

const LABKEYS={creat:["creat","tfg"],rac:["rac"],k:["k"],hba1c:["hba1c"],ldl:["ldl"],hb:["hb"],cap:["fos","ca"],pth:["pth"],fa:["fa"],hco3:["hco3"],alb:["alb"]};
const ATK={nut:"NUTRICION",edu:"EDUCACION",enf:"ENFERMERIA",psi:"PSICOLOGIA",ts:"TRABAJO SOCIAL",nefro:"NEFROLOGIA",flu:"VACUNA INFLUENZA",rcv:"RCV",desnut:"TAMIZAJE DESNUTRICION",paliativo:"SOPORTE PALIATIVO"};
const age=(fnac,dt)=>fnac?Math.floor(NP.days(fnac,dt)/365.25):null;

function snapshot(p,B,corte,opts){
  opts=opts||{};
  const labs=(B.L[p.codigo]||[]).filter(l=>l.fecha<=corte);
  const by={};labs.forEach(l=>{(by[l.k]=by[l.k]||[]).push(l);});
  const last=k=>by[k]&&by[k].length?by[k][by[k].length-1]:null;
  const lastD=ks=>{let m=null;ks.forEach(k=>{const l=last(k);if(l&&(!m||l.fecha>m))m=l.fecha;});return m;};
  const tf=[];(by.creat||[]).forEach(l=>{const a=age(p.fnac,l.fecha);if(a!=null&&p.sexo)tf.push({fecha:l.fecha,v:NP.ckd(l.v,a,p.sexo==="F"),cr:l.v});});
  (by.tfg||[]).forEach(l=>tf.push({fecha:l.fecha,v:l.v,cr:null}));tf.sort((a,b)=>a.fecha-b.fecha);
  const tl=tf.length?tf[tf.length-1]:null;
  const tprev=tl?[...tf].reverse().find(x=>NP.days(x.fecha,tl.fecha)>=90):null;
  const rl=last("rac");const rprev=rl?[...by.rac].reverse().find(x=>NP.days(x.fecha,rl.fecha)>=90):null;
  const vals=(B.V[p.codigo]||[]).filter(v=>v.fecha<=corte);const lv=vals.length?vals[vals.length-1]:null;
  const nv=vals.filter(v=>v.prof==="NEFROLOGIA");const lnef=nv.length?nv[nv.length-1]:null;
  const ats=(B.A[p.codigo]||[]).filter(a=>a.fecha<=corte&&a.estado==="REALIZADA");
  const lastAt=dis=>{let m=null;ats.forEach(a=>{if(a.dis===dis&&(!m||a.fecha>m))m=a.fecha;});if(dis==="NEFROLOGIA"&&lnef&&(!m||lnef.fecha>m))m=lnef.fecha;return m;};
  const within=(dt,dd)=>!!dt&&NP.days(dt,corte)<=dd;
  const fLab=tl?tl.fecha:(rl?rl.fecha:corte);
  const lvOk=lv&&within(lv.fecha,365);
  const LD={};["creat","tfg","rac","hba1c","ldl","hb","k","ca","fos","pth","hco3","alb","fa"].forEach(k=>{const l=last(k);if(l)LD[k]=l.fecha;});
  if(tl&&tl.cr==null)LD.tfg=tl.fecha;
  const lv1=k=>{const l=last(k);return l?l.v:null;};
  const d={pid:p.codigo,edad:age(p.fnac,corte),sexo:p.sexo,eps:p.eps,epsModel:(window.EPSMODEL||{})[p.eps]||{},fCons:corte,fLab,labDates:LD,hta:p.hta,dmTipo:p.dmTipo,dm:p.dmTipo!=="",ecv:p.ecv,otrosAnt:"",terapia:p.terapia,
    modo:tl&&tl.cr!=null?"creat":"tfg",creat:tl?tl.cr:null,tfg:tl?tl.v:null,rac:rl?rl.v:null,otros:[],
    tfgPrev:tprev?tprev.v:null,racPrev:(!tprev&&rprev)?rprev.v:null,fPrev:tprev?tprev.fecha:(rprev?rprev.fecha:null),cronHC:!!(lv&&lv.cron),agudo:false,
    pas:lvOk?lv.pas:null,pad:lvOk?lv.pad:null,hba1c:lv1("hba1c"),ldl:lv1("ldl"),imc:(lvOk&&lv.peso&&lv.talla)?lv.peso/Math.pow(lv.talla/100,2):null,cint:lvOk?lv.cint:null,peso:lvOk?lv.peso:null,
    hb:lv1("hb"),k:lv1("k"),ca:lv1("ca"),fos:lv1("fos"),pth:lv1("pth"),hco3:lv1("hco3"),alb:lv1("alb"),fa:lv1("fa"),
    meds:lv?{raas:lv.raas,sglt2:lv.sglt2,stat:lv.stat,fin:lv.fin}:{raas:"no",sglt2:"no",stat:"no",fin:"no"},
    dmAj:!!(lv&&lv.dmAj),htaRes:!!(lv&&lv.htaRes),sint:[],sf1:lv?lv.sf1:"",kps:lv?lv.kps:null,
    prof:lnef?"nefro":(lv?(PROFC[lv.prof]||""):""),tipo:lv?"control":"primera",causa:(lv&&lv.causa)||p.causa,conducta:lnef?lnef.conducta:"",
    at:{nefro:within(lastAt("NEFROLOGIA"),365),nut:within(lastAt("NUTRICION"),365),enf:within(lastAt("ENFERMERIA"),365),psi:within(lastAt("PSICOLOGIA"),365),ts:within(lastAt("TRABAJO SOCIAL"),365),edu:within(lastAt("EDUCACION"),365),flu:within(lastAt("VACUNA INFLUENZA"),365),rcv:within(lastAt("RCV"),365)}};
  if(opts.formOnly)return{p,d,tl,tprev,rl,rprev,lv,by,last};
  const c=NP.classify(d),P=NP.plan(d,c);
  /* Agenda de gestión: fecha límite = último registro de esa actividad + intervalo */
  const items=[];const ctlRow=P.rows.find(r=>r.key==="ctl");let ctlDue=null;
  const mxD=(a,b)=>!a?b:!b?a:(a>b?a:b);
  const lastCita=sv=>{let m=null;((B.CI||{})[p.codigo]||[]).forEach(c=>{if(c.estado==="ATENDIDA"&&c.fecha<=corte&&sv.includes(c.serv)&&(!m||c.fecha>m))m=c.fecha;});return m;};
  P.rows.forEach(r=>{
    const k=r.key;
    if(k==="ctl"){const base=mxD(d.prof==="nefro"&&lnef?lnef.fecha:(lv?lv.fecha:null),lastCita(/nefrolog/i.test(r.act)?["NEFROLOGIA"]:["NEFROLOGIA","MEDICO EXPERTO","MEDICO PROGRAMA"]));ctlDue=base?NP.addMonths(base,r.m):null;items.push({k,tipo:"Atención",grp:"Médico",nombre:r.act,last:base,due:ctlDue,why:r.why});return;}
    if(k==="experto"||k==="ajuste"){const base=mxD(lv?lv.fecha:null,lastCita(["NEFROLOGIA","MEDICO EXPERTO","MEDICO PROGRAMA"]));const due=base?NP.addMonths(base,r.m):null;if(k==="experto"&&due&&ctlDue&&Math.abs(NP.days(due,ctlDue))<=20)return;items.push({k,tipo:"Atención",grp:"Médico",nombre:r.act,last:base,due,why:r.why});return;}
    if(k==="postaj"){if(lv&&["raas","sglt2","fin"].some(x=>lv[x]==="aj")){const cd=lastD(["creat","tfg"]);if(!cd||cd<=lv.fecha)items.push({k,tipo:"Laboratorio",nombre:"Control post-ajuste (PA, creatinina, potasio)",last:lv.fecha,due:NP.addDays(lv.fecha,(P.wk||4)*7),why:r.why});}return;}
    if(k==="ldl"&&r.wk){if(lv&&lv.stat==="aj"){const ld=lastD(["ldl"]);if(!ld||ld<=lv.fecha)items.push({k,tipo:"Laboratorio",nombre:"Perfil lipídico (8 semanas post-ajuste)",last:lv.fecha,due:NP.addDays(lv.fecha,56),why:r.why});}return;}
    if(LABKEYS[k]&&(r.m||r.wk)){const ld=lastD(LABKEYS[k]);items.push({k,tipo:"Laboratorio",nombre:r.act,last:ld,due:ld?(r.now?(r.due0||r.dt):r.dt):null,why:r.why});return;}
    if(ATK[k]&&r.m){let ld=lastAt(ATK[k]);let due=ld?NP.addMonths(ld,r.m):null;if(/Con cada valoración/.test(r.cada))due=ctlDue;items.push({k,tipo:"Atención",grp:"Equipo",nombre:r.act,last:ld,due,why:r.why});}
  });
  /* Indicadores: tablero del programa (fichas institucionales, oct 2026) y otros calculados */
  const w=(ks,dd)=>within(lastD(ks),dd);
  const inUse=k=>["est","aj"].includes(d.meds[k]);
  const ind={};const I=(code,applies,ok,det)=>{if(applies)ind[code]={ok:!!ok,det:det||""};};
  const lh=last("hba1c"),ll=last("ldl"),lf=last("fos"),lp=last("pth"),lb=last("hb"),lr=last("rac");
  const G=c.G,g3=G==="G3a"||G==="G3b",g4=G==="G4",g5=G==="G5",g35=g3||g4||g5;
  const fdt=x=>x?NP.fd(x.fecha):"sin registro";
  /* par de TFGe para pérdida de función: última del año y la más antigua dentro de los 12 meses previos, separadas ≥ 90 días; TFGe > 90 se registra como 90 (CAC) */
  const tLast=tl&&within(tl.fecha,365)?tl:null;
  const tPrev=tLast?tf.filter(x=>NP.days(x.fecha,tLast.fecha)>=90&&NP.days(x.fecha,tLast.fecha)<=365)[0]||null:null;
  const caida=tLast&&tPrev?Math.min(tPrev.v,90)-Math.min(tLast.v,90):null;
  const pas=lv&&within(lv.fecha,180)&&lv.pas!=null?lv:null;
  // 1 · nefro_01_1 PA < 130/80 (ERC 3a–5 y TMND, ≤ 80 años)
  I("nefro_01_1",g35&&d.edad!=null&&d.edad<=80,pas&&pas.pas<130&&pas.pad<80,pas?"PA "+pas.pas+"/"+pas.pad+" ("+NP.fd(pas.fecha)+")":"sin PA en el último semestre");
  // 2 · nefro_12 HbA1c < 8 % (ERC 3a–5 con DM)
  I("nefro_12",d.dm&&g35,w(["hba1c"],180)&&lh.v<8,lh?"HbA1c "+lh.v+" ("+NP.fd(lh.fecha)+")":"sin registro");
  // 3 · nefro_05_1 cLDL ≤ 70 (ERC 3a–5)
  I("nefro_05_1",g35,w(["ldl"],365)&&ll.v<=70,ll?"cLDL "+ll.v+" ("+NP.fd(ll.fecha)+")":"sin registro");
  // 4 · nefro_13 creatinina en 3 meses (ERC 3a–5)
  I("nefro_13",g35,w(["creat","tfg"],90),"última "+(tl?NP.fd(tl.fecha):"sin registro"));
  // 5 · nefro_07_1 RAC en el año (según ficha institucional: ERC 3a–5)
  I("nefro_07_1",g35,w(["rac"],365),"última "+fdt(lr));
  // 6 · nefro_10 sin pérdida > 5 ml/min en un año (evaluables con dos TFGe)
  I("nefro_10",g35&&caida!=null,caida!=null&&caida<=5,caida!=null?"TFGe "+Math.round(Math.min(tPrev.v,90))+" ("+NP.fd(tPrev.fecha)+") → "+Math.round(Math.min(tLast.v,90))+" ("+NP.fd(tLast.fecha)+"): "+(Math.abs(caida)<0.05?"sin cambio":(caida>0?"pierde ":"gana ")+String(Math.abs(Math.round(caida*10)/10)).replace(".",",")+" ml/min"):"");
  // 7 · TFGe en la periodicidad del estadio
  I("TFGE_PER",g35,w(["creat","tfg"],g5?90:180),"última "+(tl?NP.fd(tl.fecha):"sin registro")+" · exige "+(g5?"3":"6")+" meses");
  // 8 · Hemoglobina en la periodicidad del estadio
  I("HB_PER",g35,w(["hb"],g3?180:90),"última "+fdt(lb)+" · exige "+(g3?"6":"3")+" meses");
  // 9 · PTH en la periodicidad del estadio
  I("PTH_PER",g35,w(["pth"],g3?365:g4?180:90),"última "+fdt(lp)+" · exige "+(g3?"12":g4?"6":"3")+" meses");
  // 10 · Fósforo en la periodicidad del estadio
  I("FOS_PER",g35,w(["fos"],g3?365:g4?180:90),"último "+fdt(lf)+" · exige "+(g3?"12":g4?"6":"3")+" meses");
  // 11 · nefro_33 valoración por nefrología (criterios CAC)
  const cr33=[];if((d.hta||d.dm)&&d.tfg!=null&&d.tfg<30)cr33.push("TFGe < 30");if(c.erc==="si"&&d.rac!=null&&d.rac>300)cr33.push("RAC > 300");if(c.erc==="si"&&caida!=null&&caida>5)cr33.push("caída > 5 ml/min en un año");
  I("nefro_33",cr33.length>0,d.at.nefro,cr33.join(", ")+(d.at.nefro?"":" · sin nefrología en 12 meses"));
  // 12 · nefro_40 equipo multidisciplinario
  I("nefro_40",g35,d.at.nut&&d.at.enf&&d.at.psi&&d.at.ts,[["nut","nutrición"],["enf","enfermería"],["psi","psicología"],["ts","trabajo social"]].filter(x=>!d.at[x[0]]).map(x=>"falta "+x[1]).join(", "));
  // 13 · nefro_41 educación estructurada
  I("nefro_41",g35,d.at.edu,d.at.edu?"":"sin educación en 12 meses");
  // 14 · nefro_29 estatina en ≥ 50 años con ERC 3a–5
  I("nefro_29",g35&&d.edad!=null&&d.edad>=50,inUse("stat"),"estatina: "+(NP.MEDST[d.meds.stat]||"sin dato"));
  // 15 · KFRE calculable con datos vigentes (G3a–G5 sin TMND ni preparación de TRR)
  I("KFRE_DOC",g35&&!c.conserv,!!c.kfre&&w(["rac"],365)&&!!tLast,c.kfre?"KFRE 2 años "+(Math.round(c.kfre.r2*1000)/10)+" %"+(w(["rac"],365)?"":" · RAC de más de 12 meses"):"no calculable: "+(!lr?"sin RAC":!d.edad||!d.sexo?"falta edad o sexo":"faltan datos"));
  /* Otros indicadores CAC que la herramienta ya calculaba (pendiente decidir si se conservan) */
  const pa=[140,90];
  I("nefro_01",c.grupo===1&&!d.dm&&d.edad!=null&&d.edad<=80,pas&&pas.pas<pa[0]&&pas.pad<pa[1],pas?"PA "+pas.pas+"/"+pas.pad+" ("+NP.fd(pas.fecha)+")":"sin PA en el último semestre");
  I("nefro_39",true,w(["creat","tfg"],365)&&w(["rac"],365),(!w(["creat","tfg"],365)?"sin TFGe en 12 meses ":"")+(!w(["rac"],365)?"sin RAC en 12 meses":""));
  I("nefro_04",true,w(["ldl"],365),ll?"último "+NP.fd(ll.fecha):"sin registro");
  I("nefro_02",d.dm,w(["hba1c"],180),lh?"última "+NP.fd(lh.fecha):"sin registro");
  I("nefro_03",d.dm&&c.grupo===1,w(["hba1c"],180)&&lh.v<7,lh?"HbA1c "+lh.v+" ("+NP.fd(lh.fecha)+")":"sin registro");
  I("nefro_05",c.grupo===1,w(["ldl"],365)&&ll.v<=100,ll?"cLDL "+ll.v:"sin registro");
  I("nefro_08",true,d.imc!=null&&d.imc>=20&&d.imc<=25,d.imc!=null?"IMC "+d.imc.toFixed(1):"sin peso/talla en 12 meses");
  I("nefro_34",(d.hta||d.dm)&&c.erc==="si"&&d.rac>30,inUse("raas"),"IECA/ARA II: "+(NP.MEDST[d.meds.raas]||"sin dato"));
  I("nefro_38",d.dmTipo==="2"&&d.tfg>=20,inUse("sglt2"),"iSGLT2: "+(NP.MEDST[d.meds.sglt2]||"sin dato"));
  I("nefro_32",true,d.at.flu,d.at.flu?"":"sin vacuna en 12 meses");
  I("nefro_42",true,d.at.rcv,d.at.rcv?"":"sin RCV en 12 meses");
  ["TFGE_PER","HB_PER","PTH_PER","FOS_PER"].forEach(k=>{if(ind[k])ind[k].st=g3?"G3":g4?"G4":"G5";});
  if(g5){I("nefro_26_1",true,w(["fos"],90)&&lf.v>=2.7&&lf.v<=5.5,lf?"fósforo "+lf.v:"sin registro");I("nefro_23",true,w(["pth"],90)&&lp.v>=150&&lp.v<=300,lp?"PTH "+lp.v:"sin registro");}
  return{p,d,c,P,lv,lnef,items,ind,tl,rl,lastLab:lastD(["creat","tfg"]),inas:(B.A[p.codigo]||[]).filter(a=>a.estado==="INASISTENCIA"&&NP.days(a.fecha,corte)<=180&&a.fecha<=corte).length+((B.CI||{})[p.codigo]||[]).filter(x=>x.estado==="INASISTENCIA"&&x.fecha<=corte&&NP.days(x.fecha,corte)<=180).length};
}
function activeAt(p,dt){if(p.fing&&p.fing>dt)return false;if(p.estado==="ACTIVO")return true;return !!(p.festado&&p.festado>dt);}

/* Fichas técnicas. Tablero = 15 fichas institucionales (oct 2026). cac = puntos de corte del consenso CAC 2025 [cumple >, bajo <];
   inst = meta institucional PROPUESTA (pendiente de adopción) para indicadores que la CAC deja en «definir» o que no son CAC.
   est = desagregación por estadio con su propia meta. */
const POB35="ERC 3a, 3b, 4, 5 y 5 con TMND (ficha institucional).";
const FICHAS={
 nefro_01_1:{tab:1,n:"PA < 130/80 mmHg",tipo:"Resultado",num:"Personas con PA < 130/80 mmHg en la medición más reciente del último semestre.",den:"Personas del tipo de población ≤ 80 años.",pob:POB35,vent:"6 meses",cac:null,inst:[50,30],instJ:"Analogía con los indicadores de resultado de la CAC (nefro_03, nefro_12, nefro_05: > 50 % / 30–50 %).",fuente:"CAC, consenso 2025, nefro_01_1 (puntos de corte: definir). En la tabla 2 de la CAC marca 8 poblaciones, no solo ERC 3a–5."},
 nefro_12:{tab:1,n:"HbA1c < 8 %",tipo:"Resultado",num:"Personas con HbA1c < 8 % en los últimos 6 meses.",den:"Personas con DM del tipo de población.",pob:"DM con ERC 3a–5 y TMND (ficha institucional).",vent:"6 meses",cac:[50,30],fuente:"CAC, consenso 2025, nefro_12."},
 nefro_05_1:{tab:1,n:"cLDL ≤ 70 mg/dL",tipo:"Resultado",num:"Personas con cLDL ≤ 70 mg/dL en el último año.",den:"Total de personas del tipo de población.",pob:POB35,vent:"12 meses",cac:null,inst:[50,30],instJ:"Analogía con nefro_05 (cLDL ≤ 100, > 50 % / 30–50 %). Sin medición en el año cuenta como no cumple.",fuente:"CAC, consenso 2025, nefro_05_1 (puntos de corte: definir)."},
 nefro_13:{tab:1,n:"Creatinina en los últimos 3 meses",tipo:"Proceso",num:"Personas con medición de creatinina en los últimos 3 meses.",den:"Total de personas del tipo de población.",pob:POB35,vent:"3 meses (acumulado mensual)",cac:[70,50],fuente:"CAC, consenso 2025, nefro_13. Ojo: la agenda base pide creatinina cada 6 meses en G3; un G3 al día con su plan puede no cumplir este indicador."},
 nefro_07_1:{tab:1,n:"RAC en el último año",tipo:"Proceso",num:"Personas con relación albuminuria/creatinuria en el último año.",den:"Total de personas del tipo de población.",pob:POB35+" La CAC lo mide en las 12 poblaciones.",vent:"12 meses",cac:[60,40],fuente:"CAC, consenso 2025, nefro_07_1."},
 nefro_10:{tab:1,n:"Sin pérdida de TFGe > 5 ml/min en un año",tipo:"Resultado",num:"Personas sin disminución de la TFGe de más de 5 ml/min/1,73 m² en un año.",den:"Personas del tipo de población con dos TFGe evaluables (separadas ≥ 3 meses, dentro de un año).",pob:POB35+" La CAC lo mide en las 12 poblaciones.",vent:"12 meses",cac:[50,40],fuente:"CAC, consenso 2025, nefro_10. CKD-EPI 2021 sin raza; TFGe > 90 se registra como 90; distancia entre creatininas ≥ 3 meses. La herramienta compara la última TFGe del año con la más antigua de los 12 meses previos."},
 TFGE_PER:{tab:1,n:"TFGe en la periodicidad del estadio",tipo:"Proceso (institucional)",num:"Personas con TFGe dentro del plazo de su estadio.",den:"Total de personas del tipo de población.",pob:POB35,vent:"Según estadio",cac:null,inst:[70,50],instJ:"Analogía con nefro_13 y nefro_06 (> 70 % / 50–70 %).",
  est:[{k:"G3",l:"ERC 3a–3b",v:"6 meses",cod:"nefro_36",inst:[70,50]},{k:"G4",l:"ERC 4",v:"6 meses",cod:"nefro_36",inst:[70,50]},{k:"G5",l:"ERC 5 y TMND",v:"3 meses",cod:"nefro_37",inst:[70,50]}],
  fuente:"Indicador institucional. Equivale a nefro_36 (6 meses) y nefro_37 (3 meses) de la CAC, ambos con puntos de corte por definir."},
 HB_PER:{tab:1,n:"Hemoglobina en la periodicidad del estadio",tipo:"Proceso",num:"Personas con hemoglobina dentro del plazo de su estadio.",den:"Total de personas del tipo de población.",pob:POB35,vent:"Según estadio",cac:null,inst:[70,50],instJ:"La CAC no fija corte para la medición de Hb; analogía con nefro_13 (> 70 % / 50–70 %).",
  est:[{k:"G3",l:"ERC 3a–3b",v:"6 meses",cod:"nefro_14_1",inst:[70,50]},{k:"G4",l:"ERC 4",v:"3 meses",cod:"nefro_16_1",inst:[70,50]},{k:"G5",l:"ERC 5 y TMND",v:"3 meses",cod:"nefro_16_1",inst:[70,50]}],
  fuente:"CAC, consenso 2025, nefro_14_1 y nefro_16_1 (definir). Se mide aparte del resultado Hb > 10 g/dL."},
 PTH_PER:{tab:1,n:"PTH en la periodicidad del estadio",tipo:"Proceso",num:"Personas con PTH dentro del plazo de su estadio.",den:"Total de personas del tipo de población.",pob:POB35,vent:"Según estadio",cac:null,inst:null,
  est:[{k:"G3",l:"ERC 3a–3b",v:"12 meses",cod:"nefro_18",inst:[70,50]},{k:"G4",l:"ERC 4",v:"6 meses",cod:"nefro_20",cac:[50,30]},{k:"G5",l:"ERC 5 y TMND",v:"3 meses",cod:"nefro_22",cac:[60,40]}],
  fuente:"CAC, consenso 2025: nefro_18 (G3, definir), nefro_20 (G4, > 50 %), nefro_22 (G5/TMND, > 60 %)."},
 FOS_PER:{tab:1,n:"Fósforo en la periodicidad del estadio",tipo:"Proceso",num:"Personas con fósforo dentro del plazo de su estadio.",den:"Total de personas del tipo de población.",pob:POB35,vent:"Según estadio",cac:null,inst:null,
  est:[{k:"G3",l:"ERC 3a–3b",v:"12 meses",cod:"nefro_24",inst:[70,50]},{k:"G4",l:"ERC 4",v:"6 meses",cod:"nefro_24_1",inst:[70,50]},{k:"G5",l:"ERC 5 y TMND",v:"3 meses",cod:"nefro_24_2",cac:[90,60]}],
  fuente:"CAC, consenso 2025: nefro_24 (G3, definir), nefro_24_1 (G4, definir), nefro_24_2 (G5/TMND, > 90 %)."},
 nefro_33:{tab:1,n:"Valoración por nefrología con criterio de remisión",tipo:"Proceso",num:"Personas valoradas por nefrología al menos una vez en el año.",den:"Personas con criterio CAC: HTA y/o DM con TFGe < 30; ERC con RAC > 300, caída de TFGe > 5 ml/min en un año o TFGe < 30.",pob:"Todas las que cumplan el criterio.",vent:"12 meses",cac:null,inst:[80,60],instJ:"Criterio de coordinación: es la población de mayor riesgo y la valoración depende de la IPS. Sin análogo CAC.",fuente:"CAC, consenso 2025, nefro_38 de la tabla (código nefro_33; línea de base)."},
 nefro_40:{tab:1,n:"Equipo multidisciplinario",tipo:"Proceso",num:"Personas con al menos una atención de nutrición, enfermería, psicología y trabajo social en el periodo.",den:"Total de personas del tipo de población.",pob:POB35,vent:"12 meses",cac:null,inst:[60,40],instJ:"Analogía con los indicadores de proceso de la CAC (nefro_04, nefro_02, nefro_07_1: > 60 % / 40–60 %).",fuente:"CAC, consenso 2025, nefro_40 (línea de base)."},
 nefro_41:{tab:1,n:"Educación estructurada en ERC",tipo:"Proceso",num:"Personas que reciben el programa de educación estructurado en el periodo.",den:"Total de personas del tipo de población.",pob:POB35,vent:"12 meses",cac:null,inst:[60,40],instJ:"Analogía con indicadores de proceso CAC. No operativo hasta definir el programa (contenidos, sesiones, constancia).",fuente:"CAC, consenso 2025, nefro_41 (definir). Hoy cuenta cualquier atención de educación registrada."},
 nefro_29:{tab:1,n:"Estatina y/o ezetimiba en ≥ 50 años con ERC 3a–5",tipo:"Proceso",num:"Personas con estatina y/o ezetimiba en el periodo.",den:"Personas ≥ 50 años con ERC 3a a 5 y TMND.",pob:"ERC 3a–5 y TMND, ≥ 50 años.",vent:"Periodo",cac:null,inst:[70,50],instJ:"Recomendación KDIGO de lípidos 1A para ≥ 50 años con TFGe < 60 sin diálisis; un proceso con evidencia fuerte debería superar 70 %.",fuente:"CAC, consenso 2025, nefro_29 (línea de base). KDIGO Lipid Management in CKD 2013, rec. 2.1.1 (1A). La herramienta solo ve la estatina (no registra ezetimiba aparte)."},
 KFRE_DOC:{tab:1,n:"KFRE calculable con datos vigentes",tipo:"Proceso (institucional)",num:"Personas con KFRE calculado con TFGe y RAC de los últimos 12 meses.",den:"Personas activas con ERC G3a–G5 sin TMND ni preparación de TRR.",pob:"G3a–G5 activos (sin TMND).",vent:"12 meses (corte trimestral)",cac:null,inst:[60,40],instJ:"Acotado por la disponibilidad de RAC, igual que nefro_07_1 (> 60 %).",fuente:"Indicador institucional. KFRE de Tangri (4 variables); calibración no norteamericana; no validado en Colombia. En esta herramienta el KFRE se calcula solo: el indicador mide en la práctica si hay RAC y TFGe vigentes."},
 /* Otros que ya se calculaban: pendiente decidir si se conservan */
 nefro_01:{n:"PA < 140/90 mmHg",tipo:"Resultado",num:"Personas con PA < 140/90 en la medición más reciente del último semestre.",den:"Personas del tipo de población ≤ 80 años.",pob:"Grupo 1 sin DM (asignación inferida; la tabla CAC marca 4 poblaciones).",vent:"6 meses",cac:[60,40],fuente:"CAC, consenso 2025, nefro_01."},
 nefro_39:{n:"RAC y TFGe en el último año",tipo:"Proceso",num:"Personas con RAC y TFGe en el último año.",den:"Total de personas del tipo de población.",pob:"Todas.",vent:"12 meses",cac:null,fuente:"CAC, consenso 2025, nefro_39 (línea de base)."},
 nefro_04:{n:"cLDL medido en el último año",tipo:"Proceso",num:"Personas con medición de LDL en el último año.",den:"Total de personas del tipo de población.",pob:"Todas.",vent:"12 meses",cac:[60,40],fuente:"CAC, consenso 2025, nefro_04."},
 nefro_02:{n:"HbA1c en los últimos 6 meses",tipo:"Proceso",num:"Personas con HbA1c en los últimos 6 meses.",den:"Personas con DM.",pob:"DM.",vent:"6 meses",cac:[60,40],fuente:"CAC, consenso 2025, nefro_02."},
 nefro_03:{n:"HbA1c < 7 %",tipo:"Resultado",num:"Personas con HbA1c < 7 % en los últimos 6 meses.",den:"Personas con DM del tipo de población.",pob:"DM en grupo 1 (inferida; por confirmar).",vent:"6 meses",cac:[50,30],fuente:"CAC, consenso 2025, nefro_03."},
 nefro_05:{n:"cLDL ≤ 100 mg/dL",tipo:"Resultado",num:"Personas con LDL ≤ 100 mg/dL en el último año.",den:"Total de personas del tipo de población.",pob:"Grupo 1.",vent:"12 meses",cac:[50,30],fuente:"CAC, consenso 2025, nefro_05."},
 nefro_08:{n:"IMC 20–25 kg/m²",tipo:"Resultado",num:"Personas con IMC entre 20 y 25 kg/m² en el último año.",den:"Total de personas del tipo de población.",pob:"Todas.",vent:"12 meses",cac:[30,20],fuente:"CAC, consenso 2025, nefro_08."},
 nefro_34:{n:"IECA o ARA II con RAC > 30",tipo:"Proceso",num:"Personas a las que se prescribe IECA o ARA II (excluyentes).",den:"Personas con HTA o DM y ERC con RAC > 30 mg/g.",pob:"ERC con albuminuria.",vent:"Periodo",cac:null,fuente:"CAC, consenso 2025, nefro_34 (línea de base)."},
 nefro_38:{n:"iSGLT2 en DM2 con TFGe ≥ 20",tipo:"Proceso",num:"Personas con iSGLT2 para evitar progresión.",den:"Personas con DM tipo 2 y TFGe ≥ 20.",pob:"DM2.",vent:"Periodo",cac:null,fuente:"CAC, consenso 2025, nefro_38 (línea de base). KDIGO 2024, 1A."},
 nefro_32:{n:"Vacuna de influenza anual",tipo:"Proceso",num:"Personas que reciben vacuna contra influenza en el año.",den:"Total de personas del tipo de población.",pob:"Todas.",vent:"12 meses",cac:null,fuente:"CAC, consenso 2025, nefro_32 (línea de base)."},
 nefro_42:{n:"Evaluación de riesgo cardiovascular",tipo:"Proceso",num:"Personas valoradas para RCV con escalas validadas para Colombia.",den:"Total de personas del tipo de población.",pob:"Todas.",vent:"12 meses",cac:null,fuente:"CAC, consenso 2025, nefro_42 (definir)."},
 nefro_26_1:{n:"Fósforo 2,7–5,5 mg/dL",tipo:"Resultado",num:"Personas con fósforo entre 2,7 y 5,5 mg/dL en el último trimestre.",den:"Total de personas del tipo de población.",pob:"ERC 5 y TMND.",vent:"3 meses",cac:[80,40],fuente:"CAC, consenso 2025, nefro_26_1."},
 nefro_23:{n:"PTH 150–300 pg/mL",tipo:"Resultado",num:"Personas con PTH entre 150 y 300 pg/mL en el último trimestre.",den:"Total de personas del tipo de población.",pob:"ERC 5 y TMND.",vent:"3 meses",cac:[60,40],fuente:"CAC, consenso 2025, nefro_23. KDIGO MBD 2017 no fija rango óptimo de PTH sin diálisis."}
};
const ORDER=["nefro_01_1","nefro_12","nefro_05_1","nefro_13","nefro_07_1","nefro_10","TFGE_PER","HB_PER","PTH_PER","FOS_PER","nefro_33","nefro_40","nefro_41","nefro_29","KFRE_DOC","nefro_01","nefro_39","nefro_04","nefro_02","nefro_03","nefro_05","nefro_08","nefro_34","nefro_38","nefro_32","nefro_42","nefro_26_1","nefro_23"];
return{parse,parseRows,sheetsFromWb,fromApi,snapshot,activeAt,EPS,EXNAME,toDate,toNum,norm,age,FICHAS,ORDER,matchEps,reindexCitas};
})();
