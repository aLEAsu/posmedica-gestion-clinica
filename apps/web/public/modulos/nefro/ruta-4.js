// Código propio del proyecto. Ruta de Nefroprotección (punto de partida: prototipo v3.2).

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
const EX={CREATININA:"creat",TFGE_REPORTADA:"tfg","TFGE REPORTADA":"tfg",TFGE:"tfg",RAC:"rac",HBA1C:"hba1c",LDL:"ldl",HEMOGLOBINA:"hb",POTASIO:"k",CALCIO:"ca",FOSFORO:"fos",PTH:"pth",BICARBONATO:"hco3",ALBUMINA:"alb",FOSFATASA_ALCALINA:"fa","FOSFATASA ALCALINA":"fa",
  COLESTEROL_TOTAL:"ct","COLESTEROL TOTAL":"ct",HDL:"hdl",TRIGLICERIDOS:"tg",GLICEMIA:"glu",GLUCEMIA:"glu",ALBUMINURIA:"albu",CREATININA_ORINA_24H:"cr24","CREATININA ORINA 24H":"cr24",ANTI_HBS:"ahbs","ANTI HBS":"ahbs",PARCIAL_ORINA:"po","PARCIAL DE ORINA":"po",QUIMICO_ORINA:"qo","QUIMICO DE ORINA":"qo"};
const EXNAME={creat:"Creatinina",tfg:"TFGe reportada",rac:"RAC",hba1c:"HbA1c",ldl:"cLDL",hb:"Hemoglobina",k:"Potasio",ca:"Calcio",fos:"Fósforo",pth:"PTH",hco3:"Bicarbonato",alb:"Albúmina",fa:"Fosfatasa alcalina",ct:"Colesterol total",hdl:"cHDL",tg:"Triglicéridos",glu:"Glucemia basal",albu:"Albuminuria",cr24:"Creatinina en orina de 24 h",ahbs:"Anticuerpos anti-HBs",po:"Parcial de orina",qo:"Químico de orina"};
const MED={"NO RECIBE":"no",ESTABLE:"est","INICIA O AJUSTA":"aj",CONTRAINDICADO:"ci"};
const CAUSA={DIABETICA:"dm",HIPERTENSIVA:"hta",GLOMERULOPATIA:"glom",POLIQUISTOSIS:"pq","UROPATIA OBSTRUCTIVA":"uro",TUBULOINTERSTICIAL:"nti",OTRA:"otra","NO ESTABLECIDA":"desc"};
const COND={"CONTINUA NEFROLOGIA":"sigue",CONTRARREFERENCIA:"contra","PREPARACION TRR":"prep",TMND:"tmnd"};
const SIT={"SIN TRR":"","G5 TMND":"tmnd","G5 PREPARACION TRR":"trr"};
const DMT={NO:"","TIPO 2":"2","TIPO 1":"1",OTRA:"otra"};
const PROFC={NEFROLOGIA:"nefro","MEDICO EXPERTO":"exp","MEDICINA INTERNA":"mi","MEDICINA GENERAL":"mg"};
const RANGE={creat:[0.2,25],tfg:[1,200],rac:[0,20000],hba1c:[3,20],ldl:[5,500],hb:[3,22],k:[1.5,9],ca:[4,16],fos:[0.5,15],pth:[1,4000],hco3:[5,45],alb:[1,6.5],fa:[10,3000],ct:[50,600],hdl:[5,150],tg:[20,4000],glu:[20,900],albu:[0,20000],cr24:[0,5000],ahbs:[0,100000]};
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
    if(v==null&&(k==="po"||k==="qo")){if(r.valor==null||String(r.valor).trim()===""){iss("Laboratorios",r._row,c,"Resultado vacío");return;}B.lab.push({c,fecha:f,k,v:String(r.valor).trim(),id:r._id||null,txt:true});return;}
    if(v==null){iss("Laboratorios",r._row,c,"Valor no numérico: "+(r.valor==null?"vacío":r.valor),"bad");return;}
    const rg=RANGE[k];if(rg&&(v<rg[0]||v>rg[1]))iss("Laboratorios",r._row,c,EXNAME[k]+" "+v+" fuera de rango plausible: verifique valor y unidad","bad");
    B.lab.push({c,fecha:f,k,v,id:r._id||null});});
  (S.Valoraciones||[]).forEach(r=>{const c=code(r.codigo);if(!c||isEx(c))return;
    if(!seen[c]){iss("Valoraciones",r._row,c,"El código no existe en Pacientes","bad");return;}
    const f=toDate(r.fecha);if(!f){iss("Valoraciones",r._row,c,"Fecha vacía o inválida");return;}
    B.val.push({c,id:r._id||null,fecha:f,prof:norm(r.profesional),tipo:norm(r.tipo),pas:toNum(r.pa_sistolica),pad:toNum(r.pa_diastolica),peso:toNum(r.peso_kg),talla:toNum(r.talla_cm),cint:toNum(r.cintura_cm),
      raas:MED[norm(r.ieca_ara_ii)]||"no",sglt2:MED[norm(r.isglt2)]||"no",stat:MED[norm(r.estatina)]||"no",fin:MED[norm(r.finerenona)]||"no",dmAj:si(r.ajuste_dm),htaRes:si(r.hta_resistente),cron:si(r.cronicidad_en_hc),
      conducta:COND[norm(r.conducta)]||"",causa:CAUSA[norm(r.causa_erc)]||"",sf1:r.salud_autopercibida?str(r.salud_autopercibida):"",kps:toNum(r.karnofsky),prox:toDate(r.proximo_control),
      tab:r.tabaquismo==null||r.tabaquismo===""?null:si(r.tabaquismo),antiHTA:r.antihipertensivo==null||r.antihipertensivo===""?null:si(r.antihipertensivo)});});
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

const LABKEYS={creat:["creat","tfg"],rac:["rac"],k:["k"],hba1c:["hba1c"],ldl:["ldl","ct","hdl"],hb:["hb"],cap:["fos","ca"],pth:["pth"],fa:["fa"],hco3:["hco3"],alb:["alb"]};
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
  const LD={};["creat","tfg","rac","hba1c","ldl","ct","hdl","tg","glu","hb","k","ca","fos","pth","hco3","alb","fa"].forEach(k=>{const l=last(k);if(l)LD[k]=l.fecha;});
  if(tl&&tl.cr==null)LD.tfg=tl.fecha;
  const lv1=k=>{const l=last(k);return l?l.v:null;};
  const d={pid:p.codigo,edad:age(p.fnac,corte),sexo:p.sexo,eps:p.eps,epsModel:(window.EPSMODEL||{})[p.eps]||{},fCons:corte,fLab,labDates:LD,hta:p.hta,dmTipo:p.dmTipo,dm:p.dmTipo!=="",ecv:p.ecv,otrosAnt:"",terapia:p.terapia,
    modo:tl&&tl.cr!=null?"creat":"tfg",creat:tl?tl.cr:null,tfg:tl?tl.v:null,rac:rl?rl.v:null,otros:[],
    tfgPrev:tprev?tprev.v:null,racPrev:(!tprev&&rprev)?rprev.v:null,fPrev:tprev?tprev.fecha:(rprev?rprev.fecha:null),cronHC:!!(lv&&lv.cron),agudo:false,
    pas:lvOk?lv.pas:null,pad:lvOk?lv.pad:null,hba1c:lv1("hba1c"),ldl:lv1("ldl"),imc:(lvOk&&lv.peso&&lv.talla)?lv.peso/Math.pow(lv.talla/100,2):null,cint:lvOk?lv.cint:null,peso:lvOk?lv.peso:null,
    hb:lv1("hb"),k:lv1("k"),ca:lv1("ca"),fos:lv1("fos"),pth:lv1("pth"),hco3:lv1("hco3"),alb:lv1("alb"),fa:lv1("fa"),ct:lv1("ct"),hdl:lv1("hdl"),tg:lv1("tg"),glu:lv1("glu"),tab:!!(lv&&lv.tab),antiHTA:!!(lv&&lv.antiHTA),
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
  /* Indicadores: consenso CAC 2025 (tabla 2, 47 indicadores) con sus poblaciones (tabla 1) + KFRE institucional */
  const w=(ks,dd)=>within(lastD(ks),dd);
  const inUse=k=>["est","aj"].includes(d.meds[k]);
  const ind={};const I=(code,applies,ok,det)=>{if(applies)ind[code]={ok:!!ok,det:det||""};};
  const G=c.G,g3=G==="G3a"||G==="G3b",g4=G==="G4",g5=G==="G5",g35=g3||g4||g5;
  const fdt=x=>x?NP.fd(x.fecha):"sin registro";
  const lastIn=(k,dd)=>{const l=last(k);return l&&within(l.fecha,dd)?l:null;};
  const vtxt=(nm,l,u)=>l?nm+" "+String(l.v).replace(".",",")+(u||"")+" ("+NP.fd(l.fecha)+")":"sin "+nm+" en la ventana";
  /* tipo de población CAC (tabla 1): PG siempre; DM y HTA por diagnóstico; «solo»/«HTA y DM» sin ERC; estadio con TFGe CKD-EPI 2021 */
  const ercSi=c.erc==="si";let stp=null;
  if(G==="G3a")stp="ERC3a";else if(G==="G3b")stp="ERC3b";else if(G==="G4")stp="ERC4";else if(G==="G5")stp=d.terapia==="tmnd"?"ERC5T":"ERC5";else if((G==="G1"||G==="G2")&&ercSi)stp="ERC12";
  const pops=["PG"];if(d.dm)pops.push("DM");if(d.hta)pops.push("HTA");
  if(!stp){if(d.dm&&!d.hta)pops.push("SDM");if(d.hta&&!d.dm)pops.push("SHTA");if(d.hta&&d.dm)pops.push("HDM");}else pops.push(stp);
  const inPop=Lp=>Lp.some(x=>pops.includes(x));const S35=["ERC3a","ERC3b","ERC4","ERC5","ERC5T"],E3=["ERC3a","ERC3b"],E5=["ERC5","ERC5T"];
  /* par de TFGe para pérdida de función: última del año y la más antigua dentro de los 12 meses previos, separadas ≥ 90 días; TFGe > 90 se registra como 90 (CAC) */
  const tLast=tl&&within(tl.fecha,365)?tl:null;
  const tPrev=tLast?tf.filter(x=>NP.days(x.fecha,tLast.fecha)>=90&&NP.days(x.fecha,tLast.fecha)<=365)[0]||null:null;
  const caida=tLast&&tPrev?Math.min(tPrev.v,90)-Math.min(tLast.v,90):null;
  const pas=lv&&within(lv.fecha,180)&&lv.pas!=null?lv:null;const age80=d.edad!=null&&d.edad<=80;
  const paTxt=pas?"PA "+pas.pas+"/"+pas.pad+" ("+NP.fd(pas.fecha)+")":"sin PA en el último semestre";
  I("nefro_01",inPop(["PG","HTA","SHTA","ERC12"])&&age80,pas&&pas.pas<140&&pas.pad<90,paTxt);
  I("nefro_01_1",inPop(["DM","SDM","HDM"].concat(S35))&&age80,pas&&pas.pas<130&&pas.pad<80,paTxt);
  const h6=lastIn("hba1c",180);
  I("nefro_02",d.dm,!!h6,h6?"última "+NP.fd(h6.fecha):"sin HbA1c en 6 meses");
  I("nefro_03",d.dm&&inPop(["DM","HTA","SDM","HDM","ERC12"]),h6&&h6.v<7,vtxt("HbA1c",h6," %"));
  I("nefro_12",d.dm&&inPop(S35),h6&&h6.v<8,vtxt("HbA1c",h6," %"));
  const l12=lastIn("ldl",365);
  I("nefro_04",true,!!l12,l12?"último "+NP.fd(l12.fecha):"sin cLDL en el año");
  I("nefro_05",inPop(["PG","DM","HTA","SDM","SHTA","HDM","ERC12"]),l12&&l12.v<=100,vtxt("cLDL",l12));
  I("nefro_05_1",inPop(S35),l12&&l12.v<=70,vtxt("cLDL",l12));
  const cr12=w(["creat","tfg"],365);
  I("nefro_06",inPop(["PG","DM","HTA","SDM","SHTA","HDM","ERC12"]),cr12,"última "+(tl?NP.fd(tl.fecha):"sin registro"));
  I("nefro_13",inPop(S35),w(["creat","tfg"],90),"última "+(tl?NP.fd(tl.fecha):"sin registro"));
  I("nefro_07_1",true,w(["rac"],365),"última RAC "+fdt(last("rac")));
  const imcOk=lv&&within(lv.fecha,365)&&lv.peso&&lv.talla?lv.peso/Math.pow(lv.talla/100,2):null;
  I("nefro_08",true,imcOk!=null&&imcOk>=20&&imcOk<=25,imcOk!=null?"IMC "+imcOk.toFixed(1).replace(".",","):"sin peso y talla en el año");
  I("nefro_10",caida!=null,caida!=null&&caida<=5,caida!=null?"TFGe "+Math.round(Math.min(tPrev.v,90))+" ("+NP.fd(tPrev.fecha)+") → "+Math.round(Math.min(tLast.v,90))+" ("+NP.fd(tLast.fecha)+"): "+(Math.abs(caida)<0.05?"sin cambio":(caida>0?"pierde ":"gana ")+String(Math.abs(Math.round(caida*10)/10)).replace(".",",")+" ml/min"):"");
  const hb6=lastIn("hb",180),hb3=lastIn("hb",90);
  I("nefro_14_1",inPop(E3),!!hb6,"última Hb "+fdt(last("hb")));
  I("nefro_15_1",inPop(E3),hb6&&hb6.v>10,vtxt("Hb",hb6," g/dL"));
  I("nefro_16_1",inPop(["ERC4"].concat(E5)),!!hb3,"última Hb "+fdt(last("hb")));
  I("nefro_17_1",inPop(["ERC4"].concat(E5)),hb3&&hb3.v>10,vtxt("Hb",hb3," g/dL"));
  const p12=lastIn("pth",365),p6=lastIn("pth",180),p3=lastIn("pth",90);
  I("nefro_18",inPop(E3),!!p12,"última PTH "+fdt(last("pth")));
  I("nefro_19",inPop(E3),p12&&p12.v>=35&&p12.v<=70,vtxt("PTH",p12));
  I("nefro_20",inPop(["ERC4"]),!!p6,"última PTH "+fdt(last("pth")));
  I("nefro_21",inPop(["ERC4"]),p6&&p6.v>=70&&p6.v<=110,vtxt("PTH",p6));
  I("nefro_22",inPop(E5),!!p3,"última PTH "+fdt(last("pth")));
  I("nefro_23",inPop(E5),p3&&p3.v>=150&&p3.v<=300,vtxt("PTH",p3));
  const f12=lastIn("fos",365),f6=lastIn("fos",180),f3=lastIn("fos",90);
  I("nefro_24",inPop(E3),!!f12,"último fósforo "+fdt(last("fos")));
  I("nefro_25",inPop(E3),f12&&f12.v>=2.7&&f12.v<=4.6,vtxt("fósforo",f12));
  I("nefro_24_1",inPop(["ERC4"]),!!f6,"último fósforo "+fdt(last("fos")));
  I("nefro_25_1",inPop(["ERC4"]),f6&&f6.v>=2.7&&f6.v<=4.6,vtxt("fósforo",f6));
  I("nefro_24_2",inPop(E5),!!f3,"último fósforo "+fdt(last("fos")));
  I("nefro_26_1",inPop(E5),f3&&f3.v>=2.7&&f3.v<=5.5,vtxt("fósforo",f3));
  const a12=lastIn("alb",365),a6=lastIn("alb",180);
  I("nefro_27",inPop(E3),!!a12,"última albúmina "+fdt(last("alb")));
  I("nefro_28",inPop(E3),a12&&a12.v>=4,vtxt("albúmina",a12," g/dL"));
  I("nefro_27_1",inPop(["ERC4"].concat(E5)),!!a6,"última albúmina "+fdt(last("alb")));
  I("nefro_28_1",inPop(["ERC4"].concat(E5)),a6&&a6.v>=4,vtxt("albúmina",a6," g/dL"));
  I("nefro_29",inPop(S35)&&d.edad!=null&&d.edad>=50,inUse("stat"),"estatina: "+(NP.MEDST[d.meds.stat]||"sin dato"));
  const ct12=lastIn("ct",365),hd12=lastIn("hdl",365);const nh=ct12&&hd12?ct12.v-hd12.v:null;
  I("nefro_30",true,nh!=null&&nh<100,nh!=null?"no-HDL "+Math.round(nh)+" mg/dL":"sin colesterol total y HDL en el año");
  const cint=lv&&within(lv.fecha,365)&&lv.cint!=null?lv.cint:null;
  I("nefro_31",true,cint!=null&&!!p.sexo&&cint<(p.sexo==="M"?94:80),cint!=null?"cintura "+cint+" cm":"sin cintura en el año");
  I("nefro_32",true,d.at.flu,d.at.flu?"":"sin vacuna en 12 meses");
  const cr33=[];if((d.hta||d.dm)&&d.tfg!=null&&d.tfg<30)cr33.push("TFGe < 30");if(ercSi&&d.rac!=null&&d.rac>300)cr33.push("RAC > 300");if(ercSi&&caida!=null&&caida>5)cr33.push("caída > 5 ml/min en un año");
  I("nefro_33",cr33.length>0,d.at.nefro,cr33.join(", ")+(d.at.nefro?"":" · sin nefrología en 12 meses"));
  I("nefro_34",inPop(["ERC12","ERC3a","ERC3b","ERC4"])&&(d.hta||d.dm)&&d.rac!=null&&d.rac>30,inUse("raas"),"IECA/ARA II: "+(NP.MEDST[d.meds.raas]||"sin dato"));
  I("nefro_35",inPop(["PG","DM","HTA","SDM","SHTA","HDM","ERC12"]),cr12,"última TFGe "+(tl?NP.fd(tl.fecha):"sin registro"));
  I("nefro_36",inPop(["ERC3a","ERC3b","ERC4"]),w(["creat","tfg"],180),"última TFGe "+(tl?NP.fd(tl.fecha):"sin registro"));
  I("nefro_37",inPop(E5),w(["creat","tfg"],90),"última TFGe "+(tl?NP.fd(tl.fecha):"sin registro"));
  I("nefro_38",inPop(["ERC12","ERC3a","ERC3b","ERC4"])&&d.dmTipo==="2"&&d.tfg!=null&&d.tfg>=20,inUse("sglt2"),"iSGLT2: "+(NP.MEDST[d.meds.sglt2]||"sin dato"));
  I("nefro_39",true,w(["creat","tfg"],365)&&w(["rac"],365),(!w(["creat","tfg"],365)?"sin TFGe en 12 meses ":"")+(!w(["rac"],365)?"sin RAC en 12 meses":""));
  I("nefro_40",inPop(S35),d.at.nut&&d.at.enf&&d.at.psi&&d.at.ts,[["nut","nutrición"],["enf","enfermería"],["psi","psicología"],["ts","trabajo social"]].filter(x=>!d.at[x[0]]).map(x=>"falta "+x[1]).join(", "));
  I("nefro_41",inPop(["ERC12"].concat(S35)),d.at.edu,d.at.edu?"":"sin educación en 12 meses");
  I("nefro_42",true,d.at.rcv,d.at.rcv?"":"sin RCV en 12 meses");
  /* institucional */
  I("KFRE_DOC",g35&&!c.conserv,!!c.kfre&&w(["rac"],365)&&!!tLast,c.kfre?"KFRE 2 años "+(Math.round(c.kfre.r2*1000)/10)+" %"+(w(["rac"],365)?"":" · RAC de más de 12 meses"):"no calculable: "+(!last("rac")?"sin RAC":!d.edad||!d.sexo?"falta edad o sexo":"faltan datos"));
  /* intervalo de cada ítem (para el calendario) */
  items.forEach(it=>{const r=P.rows.find(x=>x.key===it.k);if(r){it.m=r.m;it.wk=r.wk;it.tag=r.tag;it.cada=r.cada;}});
  /* riesgo cardiovascular con el último dato (CT y HDL del año, PA del semestre) */
  const rcv=RCV.evalAll({sexo:p.sexo,edad:d.edad,pas:pas?pas.pas:null,ct:ct12?ct12.v:null,hdl:hd12?hd12.v:null,tab:lv&&lv.tab!=null?lv.tab:null,dm:d.dm,ecv:p.ecv,antiHTA:lv&&lv.antiHTA!=null?lv.antiHTA:null,tfg:d.tfg,rac:d.rac,tfgG5:g5});
  return{p,d,c,P,lv,lnef,items,ind,pops,rcv,last,tl,rl,lastLab:lastD(["creat","tfg"]),inas:(B.A[p.codigo]||[]).filter(a=>a.estado==="INASISTENCIA"&&NP.days(a.fecha,corte)<=180&&a.fecha<=corte).length+((B.CI||{})[p.codigo]||[]).filter(x=>x.estado==="INASISTENCIA"&&x.fecha<=corte&&NP.days(x.fecha,corte)<=180).length};
}
function activeAt(p,dt){if(p.fing&&p.fing>dt)return false;if(p.estado==="ACTIVO")return true;return !!(p.festado&&p.festado>dt);}

/* Fichas técnicas: Cuenta de Alto Costo, actualización del consenso basado en la evidencia, indicadores mínimos HTA, DM y ERC 1–4 y 5
   sin diálisis ni trasplante (2025), tabla 2 (47 indicadores). cac = [cumple >, medio ≥] de la CAC. Los que la CAC deja en «Definir» (análisis prospectivo
   para establecer la línea de base) llevan meta institucional > 70 % por decisión de Coordinación Asistencial (11-oct-2026). */
const POPL={PG:"PG",DM:"DM",HTA:"HTA",SDM:"Solo DM",SHTA:"Solo HTA",HDM:"HTA y DM",ERC12:"ERC 1–2",ERC3a:"ERC 3a",ERC3b:"ERC 3b",ERC4:"ERC 4",ERC5:"ERC 5",ERC5T:"ERC 5 TMND"};
const POPK=Object.keys(POPL);
const ALLP=POPK.slice(),S35P=["ERC3a","ERC3b","ERC4","ERC5","ERC5T"],E3P=["ERC3a","ERC3b"],E5P=["ERC5","ERC5T"],PG7=["PG","DM","HTA","SDM","SHTA","HDM","ERC12"];
const INST70={inst:[70,70],instJ:"La CAC lo deja en línea de base («Definir»). Meta institucional > 70 % fijada por Coordinación Asistencial el 11-oct-2026."};
const FX=[
 /* [código, sección, nombre, tipo, numerador, denominador, poblaciones, ventana, corte CAC o null, nota] */
 ["nefro_01","Control de PA y metabólico","PA < 140/90 mmHg","Resultado","Personas con PA < 140/90 mmHg en la medición más reciente del último semestre.","Personas del tipo de población ≤ 80 años.",["PG","HTA","SHTA","ERC12"],"6 meses",[60,40]],
 ["nefro_01_1","Control de PA y metabólico","PA < 130/80 mmHg","Resultado","Personas con PA < 130/80 mmHg en la medición más reciente del último semestre.","Personas del tipo de población ≤ 80 años.",["DM","SDM","HDM"].concat(S35P),"6 meses",null],
 ["nefro_02","Control de PA y metabólico","HbA1c en los últimos 6 meses","Proceso","Personas a quienes se les realizó HbA1c en los últimos 6 meses.","Personas con DM del tipo de población.",["DM","HTA","SDM","HDM","ERC12"].concat(S35P),"6 meses",[60,40],"Solo personas con DM."],
 ["nefro_03","Control de PA y metabólico","HbA1c < 7 %","Resultado","Personas con HbA1c < 7 % en los últimos 6 meses.","Personas con DM del tipo de población.",["DM","HTA","SDM","HDM","ERC12"],"6 meses",[50,30],"Solo personas con DM."],
 ["nefro_12","Control de PA y metabólico","HbA1c < 8 %","Resultado","Personas con HbA1c < 8 % en los últimos 6 meses.","Personas con DM del tipo de población.",S35P,"6 meses",[50,30],"Solo personas con DM."],
 ["nefro_04","Control de PA y metabólico","cLDL medido en el último año","Proceso","Personas con medición de LDL en el último año.","Total de personas del tipo de población.",ALLP,"12 meses",[60,40]],
 ["nefro_05","Control de PA y metabólico","cLDL ≤ 100 mg/dL","Resultado","Personas con LDL ≤ 100 mg/dL en el último año.","Total de personas del tipo de población.",PG7,"12 meses",[50,30]],
 ["nefro_05_1","Control de PA y metabólico","cLDL ≤ 70 mg/dL","Resultado","Personas con LDL ≤ 70 mg/dL en el último año.","Total de personas del tipo de población.",S35P,"12 meses",null],
 ["nefro_08","Control de PA y metabólico","IMC 20–25 kg/m²","Resultado","Personas con IMC entre 20 y 25 kg/m² en el último año.","Total de personas del tipo de población.",ALLP,"12 meses",[30,20]],
 ["nefro_30","Control de PA y metabólico","No-HDL < 100 mg/dL","Resultado","Personas con colesterol no-HDL < 100 mg/dL.","Total de personas del tipo de población.",ALLP,"12 meses",null,"No-HDL = colesterol total − HDL del último año. Sin ambos datos cuenta como no cumple."],
 ["nefro_31","Control de PA y metabólico","Cintura < 94 cm (H) / < 80 cm (M)","Resultado","Personas con circunferencia de cintura < 94 cm en hombres y < 80 cm en mujeres.","Total de personas del tipo de población.",ALLP,"12 meses",null],
 ["nefro_06","Función renal y albuminuria","Creatinina en el último año","Proceso","Personas con medición de creatinina en el último año.","Total de personas del tipo de población.",PG7,"12 meses",[70,50]],
 ["nefro_35","Función renal y albuminuria","TFGe en el último año","Proceso","Personas a las que se les midió TFGe en el último año.","Total de personas del tipo de población.",PG7,"12 meses",null],
 ["nefro_13","Función renal y albuminuria","Creatinina en los últimos 3 meses","Proceso","Personas con medición de creatinina en los últimos 3 meses.","Total de personas del tipo de población.",S35P,"3 meses",[70,50],"La agenda base pide creatinina cada 6 meses en G3: un G3 al día con su plan puede no cumplir este indicador."],
 ["nefro_36","Función renal y albuminuria","TFGe en los últimos 6 meses","Proceso","Personas a las que se les midió TFGe en los últimos 6 meses.","Total de personas del tipo de población.",["ERC3a","ERC3b","ERC4"],"6 meses",null],
 ["nefro_37","Función renal y albuminuria","TFGe en los últimos 3 meses","Proceso","Personas a las que se les midió TFGe en los últimos 3 meses.","Total de personas del tipo de población.",E5P,"3 meses",null],
 ["nefro_07_1","Función renal y albuminuria","RAC en el último año","Proceso","Personas con medición de relación albuminuria/creatinuria en el último año.","Total de personas del tipo de población.",ALLP,"12 meses",[60,40]],
 ["nefro_39","Función renal y albuminuria","RAC y TFGe en el último año","Proceso","Personas a las que se les realizó RAC y TFGe en el último año.","Total de personas del tipo de población.",ALLP,"12 meses",null],
 ["nefro_10","Función renal y albuminuria","Sin pérdida de TFGe > 5 ml/min en un año","Resultado","Personas sin disminución de la TFGe de más de 5 ml/min/1,73 m² en un año.","Personas del tipo de población con dos TFGe evaluables (≥ 3 meses entre ellas, dentro del año).",ALLP,"12 meses",[50,40],"CKD-EPI 2021; TFGe > 90 se registra como 90."],
 ["nefro_14_1","Anemia","Hemoglobina en el último semestre","Proceso","Personas a quienes se les realizó hemoglobina en el último semestre.","Total de personas del tipo de población.",E3P,"6 meses",null],
 ["nefro_15_1","Anemia","Hemoglobina > 10 g/dL (semestre)","Resultado","Personas con hemoglobina > 10 g/dL.","Total de personas del tipo de población.",E3P,"6 meses",null,"Hb > 10 no descarta anemia (KDIGO: < 13 H, < 12 M)."],
 ["nefro_16_1","Anemia","Hemoglobina en el último trimestre","Proceso","Personas a quienes se les realizó hemoglobina en el último trimestre.","Total de personas del tipo de población.",["ERC4"].concat(E5P),"3 meses",null],
 ["nefro_17_1","Anemia","Hemoglobina > 10 g/dL (trimestre)","Resultado","Personas con hemoglobina > 10 g/dL.","Total de personas del tipo de población.",["ERC4"].concat(E5P),"3 meses",null],
 ["nefro_18","Trastorno mineral óseo","PTH en el último año","Proceso","Personas con medición de PTH en el último año.","Total de personas del tipo de población.",E3P,"12 meses",null],
 ["nefro_19","Trastorno mineral óseo","PTH 35–70 pg/mL","Resultado","Personas con PTH entre 35 y 70 pg/mL.","Total de personas del tipo de población.",E3P,"12 meses",null,"KDIGO CKD-MBD 2017: nivel óptimo de PTH sin diálisis desconocido."],
 ["nefro_20","Trastorno mineral óseo","PTH en el último semestre","Proceso","Personas con medición de PTH en el último semestre.","Total de personas del tipo de población.",["ERC4"],"6 meses",[50,30]],
 ["nefro_21","Trastorno mineral óseo","PTH 70–110 pg/mL","Resultado","Personas con PTH entre 70 y 110 pg/mL.","Total de personas del tipo de población.",["ERC4"],"6 meses",[50,30]],
 ["nefro_22","Trastorno mineral óseo","PTH en el último trimestre","Proceso","Personas con medición de PTH en el último trimestre.","Total de personas del tipo de población.",E5P,"3 meses",[60,40]],
 ["nefro_23","Trastorno mineral óseo","PTH 150–300 pg/mL","Resultado","Personas con PTH entre 150 y 300 pg/mL.","Total de personas del tipo de población.",E5P,"3 meses",[60,40]],
 ["nefro_24","Trastorno mineral óseo","Fósforo en el último año","Proceso","Personas con medición de fósforo en el último año.","Total de personas del tipo de población.",E3P,"12 meses",null],
 ["nefro_25","Trastorno mineral óseo","Fósforo 2,7–4,6 mg/dL (año)","Resultado","Personas con fósforo entre 2,7 y 4,6 mg/dL.","Total de personas del tipo de población.",E3P,"12 meses",null],
 ["nefro_24_1","Trastorno mineral óseo","Fósforo en el último semestre","Proceso","Personas con medición de fósforo en el último semestre.","Total de personas del tipo de población.",["ERC4"],"6 meses",null],
 ["nefro_25_1","Trastorno mineral óseo","Fósforo 2,7–4,6 mg/dL (semestre)","Resultado","Personas con fósforo entre 2,7 y 4,6 mg/dL.","Total de personas del tipo de población.",["ERC4"],"6 meses",null],
 ["nefro_24_2","Trastorno mineral óseo","Fósforo en el último trimestre","Proceso","Personas con medición de fósforo en el último trimestre.","Total de personas del tipo de población.",E5P,"3 meses",[90,60]],
 ["nefro_26_1","Trastorno mineral óseo","Fósforo 2,7–5,5 mg/dL","Resultado","Personas con fósforo entre 2,7 y 5,5 mg/dL.","Total de personas del tipo de población.",E5P,"3 meses",[80,40]],
 ["nefro_27","Estado nutricional","Albúmina en el último año","Proceso","Personas con medición de albúmina en el último año.","Total de personas del tipo de población.",E3P,"12 meses",null],
 ["nefro_28","Estado nutricional","Albúmina ≥ 4 g/dL (año)","Resultado","Personas con albúmina ≥ 4 g/dL.","Total de personas del tipo de población.",E3P,"12 meses",null],
 ["nefro_27_1","Estado nutricional","Albúmina en el último semestre","Proceso","Personas con medición de albúmina en el último semestre.","Total de personas del tipo de población.",["ERC4"].concat(E5P),"6 meses",null],
 ["nefro_28_1","Estado nutricional","Albúmina ≥ 4 g/dL (semestre)","Resultado","Personas con albúmina ≥ 4 g/dL.","Total de personas del tipo de población.",["ERC4"].concat(E5P),"6 meses",null],
 ["nefro_29","Tratamiento","Estatina en ≥ 50 años con ERC 3a–5","Proceso","Personas con estatina y/o ezetimiba en el periodo.","Personas ≥ 50 años con ERC 3a a 5.",S35P,"Periodo",null,"La herramienta registra la estatina; la ezetimiba sola no se registra aparte."],
 ["nefro_34","Tratamiento","IECA o ARA II con RAC > 30","Proceso","Personas a las que se les prescribe IECA o ARA II (excluyentes) en el periodo.","Personas con HTA o DM y ERC con RAC > 30 mg/g.",["ERC12","ERC3a","ERC3b","ERC4"],"Periodo",null],
 ["nefro_38","Tratamiento","iSGLT2 en DM2 con TFGe ≥ 20","Proceso","Personas a las que se les prescribe iSGLT2 para evitar la progresión.","Personas con TFGe ≥ 20 y DM tipo 2.",["ERC12","ERC3a","ERC3b","ERC4"],"Periodo",null],
 ["nefro_32","Atención integral","Vacuna de influenza anual","Proceso","Personas que reciben anualmente vacunación contra influenza.","Total de personas del tipo de población.",ALLP,"12 meses",null],
 ["nefro_33","Atención integral","Valoración por nefrología con criterio de remisión","Proceso","Personas valoradas por nefrología al menos una vez al año.","Personas con HTA y/o DM y TFGe < 30; o ERC con RAC > 300, caída de TFGe > 5 ml/min en un año o TFGe < 30.",ALLP,"12 meses",null],
 ["nefro_40","Atención integral","Equipo multidisciplinario","Proceso","Personas con al menos una atención de nutrición, enfermería, psicología y trabajo social en el periodo.","Total de personas del tipo de población.",S35P,"12 meses",null],
 ["nefro_41","Atención integral","Educación estructurada en ERC","Proceso","Personas con ERC que reciben programa de educación estructurado.","Total de personas del tipo de población.",["ERC12"].concat(S35P),"12 meses",null,"Hoy cuenta cualquier atención de educación registrada."],
 ["nefro_42","Atención integral","Evaluación de riesgo cardiovascular","Proceso","Personas valoradas para RCV con escalas validadas para Colombia.","Total de personas del tipo de población.",ALLP,"12 meses",null,"Cuenta la atención «RCV» registrada; la valoración la genera al estimarlo."]
];
const FICHAS={};
FX.forEach(([code,sec,n,tipo,num,den,pp,vent,cac,nota])=>{FICHAS[code]=Object.assign({tab:1,sec,n,tipo,num,den,pp,pob:pp.map(x=>POPL[x]).join(", ")+(code==="nefro_01"||code==="nefro_01_1"?" · ≤ 80 años":""),vent,cac,fuente:"Cuenta de Alto Costo, consenso basado en la evidencia 2025, tabla 2 (código "+code+")."+(nota?" "+nota:"")},cac?{}:INST70);});
FICHAS.KFRE_DOC={sec:"Institucional",n:"KFRE calculable con datos vigentes",tipo:"Proceso (institucional)",num:"Personas con KFRE calculado con TFGe y RAC de los últimos 12 meses.",den:"Personas activas con ERC G3a–G5 sin TMND ni preparación de TRR.",pp:["ERC3a","ERC3b","ERC4","ERC5"],pob:"G3a–G5 activos (sin TMND).",vent:"12 meses",cac:null,inst:[60,40],instJ:"Propuesta acotada por la disponibilidad de RAC, igual que nefro_07_1 (> 60 %); pendiente de adopción.",fuente:"Indicador institucional. KFRE de Tangri (4 variables), calibración no norteamericana; no validado en Colombia."};
const SECS=["Control de PA y metabólico","Función renal y albuminuria","Anemia","Trastorno mineral óseo","Estado nutricional","Tratamiento","Atención integral","Institucional"];
const ORDER=FX.map(x=>x[0]).concat(["KFRE_DOC"]);
return{parse,parseRows,sheetsFromWb,fromApi,snapshot,activeAt,EPS,EXNAME,toDate,toNum,norm,age,FICHAS,ORDER,SECS,POPL,POPK,matchEps,reindexCitas,key,idxBy,TEXTEX:["po","qo"]};
})();

