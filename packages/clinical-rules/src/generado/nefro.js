// GENERADO por packages/clinical-rules/scripts/extraer-reglas.mjs a partir de «Gestión Clínica POSMÉDICA (1).html».
// NO EDITAR A MANO: cualquier cambio de regla se hace en el prototipo validado por la coordinación médica y se vuelve a extraer.
// Las referencias «archivo:línea» apuntan a los archivos de _analisis/.
// Ruta de Nefroprotección v7.2: motor clínico (clasificación, metas, medicamentos, plan) y motor de cohorte (fichas e indicadores).
export function crearMotorNefro(ctx) {
"use strict";
/* El modelo de atención por EPS vivía en window.EPSMODEL (y localStorage). Aquí llega en ctx.modeloEps. */
let __modelo = ctx && ctx.modeloEps ? JSON.parse(JSON.stringify(ctx.modeloEps)) : null;
const window = { get EPSMODEL() { return __modelo || (__modelo = JSON.parse(JSON.stringify(EPSMODEL_DEF))); } };
const XLSX = ctx && ctx.XLSX;
/* nefroproteccion/motor_clinico.js:3 */
const NP=(function(){
"use strict";
const AI=a=>["A1","A2","A3"].indexOf(a);
const n=(v,d)=>v==null||!isFinite(v)?"—":Number(v).toLocaleString("es-CO",{minimumFractionDigits:d||0,maximumFractionDigits:d||0});
function ckd(scr,age,female){const k=female?0.7:0.9,a=female?-0.241:-0.302;return 142*Math.pow(Math.min(scr/k,1),a)*Math.pow(Math.max(scr/k,1),-1.2)*Math.pow(0.9938,age)*(female?1.012:1);}
function kfre(age,male,tfg,rac){const L=-0.2201*(age/10-7.036)+0.2467*(male-0.5642)-0.5567*(tfg/5-7.222)+0.4510*(Math.log(Math.max(rac,1))-5.137);return{r2:1-Math.pow(0.9832,Math.exp(L)),r5:1-Math.pow(0.9365,Math.exp(L))};}
function gStage(t){if(t==null||!isFinite(t))return null;if(t>=90)return"G1";if(t>=60)return"G2";if(t>=45)return"G3a";if(t>=30)return"G3b";if(t>=15)return"G4";return"G5";}
function aCat(r){if(r==null||!isFinite(r))return null;if(r<30)return"A1";if(r<300)return"A2";return"A3";}
const RISK={G1:["bajo","moderado","alto"],G2:["bajo","moderado","alto"],G3a:["moderado","alto","muy alto"],G3b:["alto","muy alto","muy alto"],G4:["muy alto","muy alto","muy alto"],G5:["muy alto","muy alto","muy alto"]};
const KT={G1:["1","1","3"],G2:["1","1","3"],G3a:["1","2","3"],G3b:["2","3","3"],G4:["3","3","≥ 4"],G5:["≥ 4","≥ 4","≥ 4"]};
/* Agenda base adoptada: [revisión clínica, creatinina/TFGe, RAC] en meses */
const AG={G12:{A1:[null,12,12],A2:[null,12,12],A3:[3,3,3]},G3a:{A1:[6,6,12],A2:[6,6,6],A3:[3,3,3]},G3b:{A1:[6,6,6],A2:[3,3,4],A3:[3,3,3]},G4:{A1:[2,2,4],A2:[2,2,4],A3:[2,2,3]},G5:{A1:[1,1,3],A2:[1,1,3],A3:[1,1,3]}};
const GDESC={G1:"normal o alta",G2:"levemente disminuida",G3a:"leve a moderadamente disminuida",G3b:"moderada a gravemente disminuida",G4:"gravemente disminuida",G5:"falla renal"};
const ADESC={A1:"normal a levemente aumentada",A2:"moderadamente aumentada",A3:"gravemente aumentada"};
const GRUPO={1:"Grupo 1 · Riesgo y ERC temprana",2:"Grupo 2 · ERC moderada",3:"Grupo 3 · ERC avanzada sin diálisis"};
const CAUSA={dm:"enfermedad renal diabética",hta:"nefropatía hipertensiva",glom:"glomerulopatía",pq:"poliquistosis renal",uro:"uropatía obstructiva o litiasis",nti:"nefritis tubulointersticial o nefrotóxicos",otra:"otra causa",desc:"causa no establecida, en estudio"};
const CONDUCTA={sigue:"continúa en seguimiento por nefrología dentro del programa",contra:"contrarreferencia al médico del programa con control anual por nefrología",prep:"inicia preparación para terapia de reemplazo renal",tmnd:"decisión compartida de terapia médica no dialítica (manejo conservador)"};
const MEDST={no:"no recibe",est:"recibe a dosis estable",aj:"inicia o ajusta hoy",ci:"contraindicado o no tolerado"};
function addMonths(dt,m){const y=dt.getFullYear(),mo=dt.getMonth()+m,d=dt.getDate();const last=new Date(y,mo+1,0).getDate();return new Date(y,mo,Math.min(d,last));}
function addDays(dt,k){const r=new Date(dt.getFullYear(),dt.getMonth(),dt.getDate());r.setDate(r.getDate()+k);return r;}
function days(a,b){return Math.round((Date.UTC(b.getFullYear(),b.getMonth(),b.getDate())-Date.UTC(a.getFullYear(),a.getMonth(),a.getDate()))/86400000);}
function fd(dt){if(!dt)return"—";const p=x=>String(x).padStart(2,"0");return p(dt.getDate())+"/"+p(dt.getMonth()+1)+"/"+dt.getFullYear();}
const cadaM=m=>m===1?"Cada mes":"Cada "+m+" meses";

function classify(d){
  const c={G:gStage(d.tfg),A:aCat(d.rac),flags:[]};
  const conserv=d.terapia==="tmnd"||d.terapia==="trr";
  if(conserv&&!c.G)c.G="G5";
  if(conserv&&c.G!=="G5")c.flags.push("Marcó manejo de G5, pero la TFGe corresponde a "+c.G+". Revise el dato.");
  c.risk=(c.G&&c.A)?RISK[c.G][AI(c.A)]:null;
  c.kt=(c.G&&c.A)?KT[c.G][AI(c.A)]:null;
  const crit=[];
  if(d.tfg!=null&&d.tfg<60)crit.push("TFGe < 60");
  if(d.rac!=null&&d.rac>=30)crit.push("RAC ≥ 30 mg/g");
  (d.otros||[]).forEach(o=>crit.push(o));
  c.crit=crit;
  c.prevDays=(d.fPrev&&d.fLab)?days(d.fPrev,d.fLab):null;
  const pd=c.prevDays;
  const persT=pd!=null&&pd>=90&&d.tfgPrev!=null&&d.tfgPrev<60&&d.tfg!=null&&d.tfg<60;
  const persR=pd!=null&&pd>=90&&d.racPrev!=null&&d.racPrev>=30&&d.rac!=null&&d.rac>=30;
  c.pers=persT?"TFGe previa de "+n(d.tfgPrev)+" el "+fd(d.fPrev):persR?"RAC previa de "+n(d.racPrev)+" mg/g el "+fd(d.fPrev):d.cronHC?"registrada en la HC":conserv?"G5 con manejo definido":null;
  if(d.terapia==="dx")c.erc="fuera";
  else if(d.agudo)c.erc="agudo";
  else if(!crit.length)c.erc=(d.tfg==null||d.rac==null)?"indet":"no";
  else c.erc=c.pers?"si":"prov";
  c.grupo=c.G?((c.G==="G1"||c.G==="G2")?1:(c.G==="G3a"||c.G==="G3b")?2:3):null;
  c.conserv=conserv;
  if(d.tfg!=null&&d.tfg<60&&d.rac!=null&&d.edad!=null&&d.sexo&&!conserv)c.kfre=kfre(d.edad,d.sexo==="M"?1:0,d.tfg,d.rac);
  return c;
}

function goals(d,c){
  const g=c.grupo,alb=c.A==="A2"||c.A==="A3";
  const pa=(g===1&&!d.dm&&!(c.erc==="si"&&alb))?[140,90]:[130,80];
  const a1c=g===1?7:8;
  const muyAlto=!!(d.ecv||(d.tfg!=null&&d.tfg<30)||(d.tfg!=null&&d.tfg<45&&d.rac!=null&&d.rac>=30)||(d.dm&&d.rac!=null&&d.rac>=30)||c.conserv);
  const ldl=g===1?100:(muyAlto?55:70);
  return{pa,a1c,ldl,muyAlto,paTxt:"< "+pa[0]+"/"+pa[1]+" mmHg",a1cTxt:"< "+a1c+" %",ldlTxt:"≤ "+ldl+" mg/dL"};
}

function meds(d,c){
  const out=[];
  // IECA/ARA II
  let r;
  if(d.rac==null)r={ind:null,why:"falta RAC para definir"};
  else if((d.hta||d.dm)&&d.rac>30)r={ind:true,why:"HTA o DM con RAC > 30 mg/g (nefro_34; KDIGO 2024)"};
  else r={ind:false,why:"sin indicación renal por albuminuria"};
  out.push(Object.assign({k:"raas",name:"IECA o ARA II (no combinados)"},r));
  // iSGLT2
  if(d.tfg==null)r={ind:null,why:"falta TFGe"};
  else if(d.tfg<20)r={ind:false,why:"TFGe < 20: no iniciar; si ya lo recibe, puede continuarse (KDIGO 2024)"};
  else if(d.dmTipo==="2")r={ind:true,why:"DM2 con TFGe ≥ 20 (KDIGO 2024 1A; nefro_38)"};
  else if(c.erc==="si"&&d.rac!=null&&d.rac>=200)r={ind:true,why:"ERC con TFGe ≥ 20 y RAC ≥ 200 (KDIGO 2024 1A). El consenso CAC señala que la indicación INVIMA es solo para DM: definir con nefrología"};
  else if(c.erc==="si"&&d.tfg<45)r={ind:"cons",why:"ERC con TFGe 20–45 (KDIGO 2024 2B). Indicación INVIMA solo en DM: definir con nefrología"};
  else r={ind:false,why:"sin indicación por estos criterios"};
  out.push(Object.assign({k:"sglt2",name:"iSGLT2"},r));
  // Estatina
  if(d.edad==null)r={ind:null,why:"falta la edad"};
  else if(d.edad>=50&&d.tfg!=null&&d.tfg<60)r={ind:true,why:"≥ 50 años con TFGe < 60 (KDIGO lípidos 2013 1A; nefro_29)"};
  else if(d.edad>=50&&c.erc==="si")r={ind:true,why:"≥ 50 años con ERC y TFGe ≥ 60 (KDIGO lípidos 2013 1B)"};
  else if(d.ecv)r={ind:true,why:"enfermedad cardiovascular establecida"};
  else if(c.erc==="si"&&d.dm)r={ind:true,why:"18–49 años con ERC y DM (KDIGO lípidos 2013 2A)"};
  else if(d.dm&&d.edad>=40&&d.edad<=75)r={ind:true,why:"DM de 40 a 75 años (ADA, nivel A)"};
  else r={ind:false,why:"sin indicación por estos criterios"};
  out.push(Object.assign({k:"stat",name:"Estatina ± ezetimiba"},r));
  // Finerenona (solo DM2 con albuminuria)
  if(d.dmTipo==="2"&&d.rac!=null&&d.rac>=30){
    if(d.tfg==null||d.tfg<25)r={ind:false,why:"TFGe < 25: no iniciar"};
    else if(d.k!=null&&d.k>4.8)r={ind:false,why:"potasio > 4,8: no iniciar"};
    else r={ind:"cons",why:"DM2, TFGe ≥ 25 y RAC ≥ 30 con IECA/ARA II a dosis máxima tolerada (KDIGO 2022 DM-ERC 2A)"};
    out.push(Object.assign({k:"fin",name:"Finerenona"},r));
  }
  out.forEach(m=>{m.st=(d.meds&&d.meds[m.k])||"no";});
  return out;
}

function interp(d,c,gl){
  const L=[];const add=(e,v,cls,t)=>L.push({e,v,cls,t});
  if(d.tfg!=null){
    let t=c.G+": función "+GDESC[c.G]+".";
    if(d.tfg>90)t+=" Para el reporte CAC se registra 90.";
    if(d.tfgPrev!=null&&c.prevDays){
      const ch=(d.tfg-d.tfgPrev)/d.tfgPrev*100, an=(d.tfgPrev-d.tfg)/c.prevDays*365;
      t+=" Cambio de "+n(ch,0)+" % frente a "+n(d.tfgPrev)+" del "+fd(d.fPrev)+(c.prevDays>=90?" ("+n(an,1)+" ml/min/año de pérdida).":".");
      if(ch<-20)t+=c.prevDays<90?" Caída > 20 % en menos de 3 meses: descartar proceso agudo.":" Caída > 20 %: revisión clínica de la causa.";
    }
    add("TFGe"+(d.modo==="creat"?" (cr "+n(d.creat,2)+")":""),n(d.tfg)+" ml/min",d.tfg<30?"bad":d.tfg<60?"warn":"ok",t);
  }
  if(d.rac!=null){
    let t=c.A+": albuminuria "+ADESC[c.A]+".";
    if(c.A!=="A1"&&c.erc!=="si")t+=" Confirmar con 2 de 3 muestras en 3–6 meses; descartar infección urinaria, fiebre, ejercicio intenso o descompensación.";
    if(d.racPrev!=null&&d.racPrev>0&&d.rac>=2*d.racPrev)t+=" Se duplicó frente a la previa ("+n(d.racPrev)+"): verificar y adelantar valoración.";
    if(d.rac>300)t+=" Criterio de valoración por nefrología (nefro_33).";
    add("RAC",n(d.rac)+" mg/g",c.A==="A3"?"bad":c.A==="A2"?"warn":"ok",t);
  }
  if(d.pas!=null&&d.pad!=null){const ok=d.pas<gl.pa[0]&&d.pad<gl.pa[1];add("Presión arterial",n(d.pas)+"/"+n(d.pad),ok?"ok":"bad",(ok?"En meta ":"Fuera de meta ")+"("+gl.paTxt+").");}
  if(d.dm&&d.hba1c!=null){const ok=d.hba1c<gl.a1c;let t=(ok?"En meta ":"Fuera de meta ")+"("+gl.a1cTxt+").";if(d.tfg!=null&&d.tfg<30)t+=" Con TFGe < 30 la HbA1c pierde confiabilidad (anemia, hierro, transfusión): apoyarse en glucometrías (KDIGO 2022).";add("HbA1c",n(d.hba1c,1)+" %",ok?"ok":"bad",t);}
  if(d.ldl!=null){const ok=d.ldl<=gl.ldl;let t=(ok?"En meta ":"Fuera de meta ")+"("+gl.ldlTxt+(gl.muyAlto&&c.grupo>1?", muy alto riesgo CV":"")+").";if(c.grupo===1&&gl.muyAlto)t+=" ESC/EAS 2019 propone < 55 en DM con daño de órgano blanco; la meta CAC del grupo 1 es ≤ 100.";if(c.grupo===3)t+=" Meta del grupo 3 = extensión del criterio del grupo 2 (propuesta); el indicador nefro_05_1 mide ≤ 70.";add("cLDL",n(d.ldl)+" mg/dL",ok?"ok":"bad",t);}
  if(d.imc!=null){const v=d.imc;let t=v<18.5?"Bajo peso.":v<25?"Normal.":v<30?"Sobrepeso.":"Obesidad.";t+=(v>=20&&v<=25)?" Dentro de la meta del indicador CAC (20–25).":" Fuera de la meta del indicador CAC (20–25).";add("IMC",n(v,1)+" kg/m²",v>=20&&v<=25?"ok":"warn",t);}
  if(d.cint!=null&&d.sexo){const lim=d.sexo==="M"?94:80,ok=d.cint<lim;add("Cintura",n(d.cint)+" cm",ok?"ok":"warn",(ok?"Bajo":"Por encima de")+" el punto de corte del indicador CAC (< "+lim+" cm, nefro_31).");}
  if(d.hb!=null){const lim=d.sexo==="M"?13:12;let an=d.sexo?d.hb<lim:null;let t=an==null?"Indique el sexo para interpretar.":an?"Anemia (KDIGO: < "+lim+" g/dL en "+(d.sexo==="M"?"hombres":"mujeres")+"). Estudiar: reticulocitos, ferritina, saturación de transferrina; B12 y folato según clínica. No prescribir solo por el umbral.":"Sin anemia por criterio KDIGO.";if(an&&d.hb>10)t+=" Ojo: Hb > 10 cumple el indicador CAC pero no descarta anemia.";add("Hemoglobina",n(d.hb,1)+" g/dL",an?"warn":"ok",t);}
  if(d.k!=null){let cls="ok",t="En rango.";if(d.k<3.5){cls="warn";t="Hipopotasemia: revisar diuréticos y pérdidas.";}else if(d.k>=6.5){cls="bad";t="Hiperpotasemia grave (≥ 6,5): manejo urgente y EKG.";}else if(d.k>=6){cls="bad";t="Hiperpotasemia moderada (6,0–6,4): valoración prioritaria y EKG.";}else if(d.k>=5.5){cls="warn";t="Hiperpotasemia leve (5,5–5,9): revisar dieta, IECA/ARA II, finerenona, AINE y acidosis.";}else if(d.k>=5){cls="warn";t="≥ 5,0: control a 2 semanas si ajusta IECA/ARA II"+(d.k>4.8?"; no iniciar finerenona":"")+".";}add("Potasio",n(d.k,1)+" mEq/L",cls,t);}
  if(d.hco3!=null){let cls=d.hco3<18?"bad":d.hco3<22?"warn":"ok";let t=d.hco3<18?"Acidosis metabólica (< 18): considerar tratamiento farmacológico con o sin intervención dietaria (KDIGO 2024).":d.hco3<22?"Bicarbonato bajo (< 22): repetir con la próxima creatinina y vigilar.":"En rango.";add("Bicarbonato",n(d.hco3,1)+" mmol/L",cls,t);}
  if(d.ca!=null){let t=d.ca<8.5?"Hipocalcemia (verificar con albúmina y rango del laboratorio).":d.ca>10.5?"Hipercalcemia: evitarla (KDIGO MBD 2017); revisar calcio y vitamina D.":"En rango usual (8,5–10,5; confirmar con el laboratorio).";add("Calcio",n(d.ca,1)+" mg/dL",(d.ca<8.5||d.ca>10.5)?"warn":"ok",t);}
  if(d.fos!=null){const g5=c.G==="G5";const hi=g5?5.5:4.6;const ok=d.fos>=2.7&&d.fos<=hi;add("Fósforo",n(d.fos,1)+" mg/dL",ok?"ok":"warn",(ok?"En meta ":"Fuera de meta ")+"(2,7–"+n(hi,1)+(g5?", nefro_26_1":"")+"). "+(ok?"":"KDIGO MBD 2017: llevar hacia el rango normal; revisar dieta y quelantes."));}
  if(d.pth!=null){const ref=c.G==="G4"?"70–110":c.G==="G5"?"150–300":null;let t=(ref?"Referencia CAC "+ref+" pg/mL. ":"")+"No es disparador automático de tratamiento: valorar tendencia, calcio, fósforo y 25-OH vitamina D (KDIGO MBD 2017: nivel óptimo desconocido en ERC sin diálisis).";add("PTH",n(d.pth)+" pg/mL","",t);}
  if(d.fa!=null){add("Fosfatasa alcalina",n(d.fa)+" U/L","","Comparar con el rango del laboratorio. Elevada junto con PTH alta orienta a recambio óseo alto (KDIGO MBD 2017).");}
  if(d.alb!=null){add("Albúmina",n(d.alb,1)+" g/dL",d.alb<3.5?"warn":"ok",d.alb<3.5?"Hipoalbuminemia: valorar estado nutricional, inflamación y proteinuria. No diagnostica desnutrición por sí sola.":"En rango.");}
  const EK={"Fosfatasa alcalina":"fa","Hemoglobina":"hb","Potasio":"k","Bicarbonato":"hco3","Calcio":"ca","Fósforo":"fos","PTH":"pth","Albúmina":"alb","HbA1c":"hba1c","cLDL":"ldl","RAC":"rac"};
  const LDt=d.labDates||{};L.forEach(x=>{const k=x.e.startsWith("TFGe")?(d.modo==="creat"?"creat":"tfg"):EK[x.e];if(k&&LDt[k])x.f=LDt[k];});
  if(c.kfre){const k=c.kfre;let t="Calibración no norteamericana; validado en G3–G5, sin validación específica en Colombia.";if(k.r2>0.4)t+=" > 40 % a 2 años: educación de modalidades y preparación de TRR o TMND.";else if(k.r2>0.1)t+=" > 10 % a 2 años: atención multidisciplinaria intensiva.";if(k.r5>=0.05)t+=" ≥ 5 % a 5 años: criterio de nefrología (umbral institucional dentro del 3–5 % de KDIGO).";add("KFRE 4 variables",n(k.r2*100,1)+" % / "+n(k.r5*100,1)+" %",k.r2>0.4?"bad":k.r5>=0.05?"warn":"ok","2 y 5 años. "+t);}
  return L;
}

function plan(d,c){
  const P={rows:[],actions:[],ind:[],meds:[],rev:null,goals:goals(d,c),labCal:[]};
  const fc=d.fCons||new Date(),fl=d.fLab||fc,gl=P.goals,LD=d.labDates||{};
  const ld=k=>LD[k]||fl;
  P.interp=interp(d,c,gl);
  const act=(lvl,t,when)=>P.actions.push({lvl,t,when});
  if(c.erc==="fuera"){act("bad","Paciente en diálisis o trasplantado: fuera de esta ruta. Aplicar la ruta de TRR.");return P;}
  if(!c.G){act("warn","Falta la TFGe (o la creatinina con edad y sexo): no se puede estratificar.");return P;}
  if(c.erc==="agudo"){act("bad","Sospecha de deterioro agudo: evaluación clínica inmediata. No aplicar el calendario estable ni clasificar ERC con este resultado.",fc);P.rev={months:0,date:fc,who:"Evaluación clínica",short:"sospecha de proceso agudo"};P.next=P.rev;return P;}
  P.meds=meds(d,c);
  const meds0=d.meds||{},M=d.epsModel||{},epsN=d.eps||"la EPS";
  const g3=c.G==="G3a"||c.G==="G3b",g4=c.G==="G4",g5=c.G==="G5",g12=!(g3||g4||g5);
  let[rev0,cr,rac]=AG[g12?"G12":c.G][c.A||"A2"];
  if(rev0==null)rev0=(d.hta||d.dm)?6:12;
  const cat=c.G+" "+(c.A||"sin RAC");
  const rk=c.erc==="no"?"sin ERC demostrada":c.risk?"riesgo KDIGO "+c.risk:"riesgo incompleto por falta de RAC";
  const paOff=d.pas!=null&&d.pad!=null&&!(d.pas<gl.pa[0]&&d.pad<gl.pa[1]);
  const a1cOff=d.dm&&d.hba1c!=null&&!(d.hba1c<gl.a1c);
  const fosHi=g5?5.5:4.6,fosOff=d.fos!=null&&(d.fos<2.7||d.fos>fosHi);
  const anem=d.hb!=null&&d.sexo&&d.hb<(d.sexo==="M"?13:12);
  const low=s=>s.charAt(0).toLowerCase()+s.slice(1),cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
  const R=(o)=>{P.rows.push(o);return o;};

  /* ===== Contactos médicos ===== */
  const nefroLead=d.prof==="nefro"&&d.conducta!=="contra";
  const baseName=nefroLead?"Valoración por nefrología":"Control médico del programa";
  const bw=[];if(g5)bw.push("síntomas urémicos, volumen, potasio y acidosis; revisión de la decisión TRR/TMND");
  bw.push("PA, peso y edema, síntomas, adherencia, conciliación de medicamentos y nefrotóxicos, lectura de los paraclínicos del periodo");
  P.rev={months:rev0,date:addMonths(fc,rev0),who:baseName,short:"Agenda base "+cat};
  R({sec:"Control médico",key:"ctl",act:baseName,what:cap(bw.join("; "))+".",cada:cadaM(rev0),m:rev0,dt:P.rev.date,tag:"Propuesta",
     why:"Agenda base para "+cat+" ("+rk+"): "+low(cadaM(rev0))+"."+(g5?" G5: control mensual por decisión institucional.":"")+" No se acorta por PA o glucemia fuera de meta: ese ajuste va en el control de metas."});
  const inter=M.inter==="MEDICO EXPERTO"&&rev0>(M.interMeses||1);
  const ajusteNeeded=(paOff||a1cOff)&&rev0>1;
  const ajWhat=[];if(paOff)ajWhat.push("titular antihipertensivos tras verificar técnica de toma y adherencia");if(a1cOff)ajWhat.push("ajustar el tratamiento de la diabetes con revisión de glucometrías");
  const ajWhy=[];if(paOff)ajWhy.push("PA "+n(d.pas)+"/"+n(d.pad)+" fuera de meta ("+gl.paTxt+")");if(a1cOff)ajWhy.push("HbA1c "+n(d.hba1c,1)+" % fuera de meta ("+gl.a1cTxt+")");
  if(inter){
    const im=M.interMeses||1;
    R({sec:"Control médico",key:"experto",act:"Control por médico experto"+(ajusteNeeded?" con ajuste de metas":""),
       what:cap((ajusteNeeded?ajWhat.join("; ")+"; ":"")+"formulación de medicamentos contratados, adherencia, PA y efectos adversos")+".",
       cada:cadaM(im),m:im,dt:addMonths(fc,im),tag:"EPS",
       why:"Modelo de atención de "+epsN+": en los meses sin valoración por nefrología el paciente asiste a médico experto para formulación."+(ajusteNeeded?" Además "+ajWhy.join(" y ")+": la CAC indica controles cada 1 a 2 meses hasta lograr la meta; se hace en esta misma consulta.":"")});
  }else if(ajusteNeeded){
    const by=M.ajustePor==="NEFROLOGIA"?"nefrología":M.ajustePor==="MEDICO EXPERTO"?"médico experto":"médico del programa";
    R({sec:"Control médico",key:"ajuste",act:"Control de ajuste de metas ("+by+")",what:cap(ajWhat.join("; "))+".",cada:"Cada mes hasta lograr la meta",m:1,dt:addMonths(fc,1),tag:"CAC",
       why:cap(ajWhy.join(" y "))+": la CAC indica controles cada 1 a 2 meses hasta lograrla; se fija 1 mes. La valoración por nefrología sigue "+low(cadaM(rev0))+"."+(M.ajustePor?" Profesional según el modelo de "+epsN+".":"")});
  }

  /* ===== Paraclínicos: frecuencia base o individualizada por resultado ===== */
  if(c.erc==="prov")act("warn","ERC por confirmar: repetir creatinina y RAC para documentar persistencia > 3 meses.",addMonths(ld(d.modo==="creat"?"creat":"tfg"),3));
  if(c.erc==="indet")act("warn","No se puede afirmar ni descartar ERC: "+(d.rac==null?"falta la RAC":"falta la TFGe")+".",fc);
  const t9=g12?"1 por año":g3?"2 a 4 por año":"más de 4 por año";
  const labs=[];
  const L=(key,dkey,a,w,iv,tag,y,ind)=>{ // iv: {m} meses o {wk} semanas
    const base=ld(dkey);let dt=iv.wk?addDays(base,iv.wk*7):addMonths(base,iv.m),now=false;const due0=dt;
    if(dt<fc){dt=fc;now=true;}
    const o=R({sec:"Laboratorio",key,act:a,what:w,cada:iv.wk?"A las "+iv.wk+" semana"+(iv.wk>1?"s":""):cadaM(iv.m),m:iv.m,wk:iv.wk,dt,now,tag:ind?"Individualizado":tag,
      why:y+(now?" El intervalo desde el último resultado ("+fd(base)+") ya se cumplió.":""),base,due0});
    labs.push(o);return o;};
  const tfgDrop=d.tfgPrev!=null&&c.prevDays&&(d.tfg-d.tfgPrev)/d.tfgPrev<-0.2;
  const racDup=d.racPrev!=null&&d.racPrev>0&&d.rac!=null&&d.rac>=2*d.racPrev;
  // creatinina
  {const dk=d.modo==="creat"?"creat":"tfg";
   if(c.erc==="prov")L("creat",dk,"Creatinina y TFGe","Creatinina sérica; TFGe por CKD-EPI 2021.",{m:Math.min(cr,3)},"KDIGO","Confirmar cronicidad: el diagnóstico de ERC exige persistencia > 3 meses.",cr>3);
   else if(tfgDrop||racDup)L("creat",dk,"Creatinina y TFGe","Creatinina sérica; TFGe por CKD-EPI 2021.",{m:1},"KDIGO",(tfgDrop?"Caída de TFGe > 20 % frente a la previa":"RAC duplicada")+": se repite al mes para confirmar el cambio antes de reclasificar (KDIGO 2024 PP 2.1.3–2.1.5; intervalo = propuesta).",true);
   else L("creat",dk,"Creatinina y TFGe","Creatinina sérica; TFGe por CKD-EPI 2021.",{m:cr},"Propuesta","Para "+cat+" KDIGO indica "+(c.kt||"—")+" al año y la CAC (tabla 9) "+t9+"; se fija "+low(cadaM(cr))+".");}
  // RAC
  if(!c.A){R({sec:"Laboratorio",key:"rac",act:"RAC urinaria",what:"Relación albúmina/creatinina en orina.",cada:"Una vez",dt:fc,now:true,tag:"KDIGO",why:"Falta: sin RAC el riesgo KDIGO queda incompleto y no se puede asumir A1."});}
  else if(c.erc==="prov"&&c.A!=="A1")L("rac","rac","RAC urinaria","Relación albúmina/creatinina, de preferencia primera orina de la mañana.",{m:3},"KDIGO","Confirmar albuminuria persistente (2 de 3 muestras en 3 a 6 meses).");
  else if(racDup)L("rac","rac","RAC urinaria","Relación albúmina/creatinina, de preferencia primera orina de la mañana.",{m:1},"KDIGO","RAC duplicada frente a la previa ("+n(d.racPrev)+" → "+n(d.rac)+"): repetir al mes y verificar contexto (infección, descompensación).",true);
  else L("rac","rac","RAC urinaria","Relación albúmina/creatinina, de preferencia primera orina de la mañana.",{m:rac},"Propuesta","Define la categoría A; para "+cat+" se fija "+low(cadaM(rac))+".");
  // control post-ajuste de fármacos hemodinámicos
  const NM={raas:"IECA/ARA II",sglt2:"iSGLT2",fin:"finerenona"};
  const aj=["raas","sglt2","fin"].filter(k=>meds0[k]==="aj"&&(k!=="fin"||d.dmTipo==="2")).map(k=>NM[k]);
  const wk=((d.tfg!=null&&d.tfg<30)||(d.k!=null&&d.k>=5))?2:4;
  if(aj.length){P.wk=wk;const o=R({sec:"Laboratorio",key:"postaj",act:"Control post-ajuste",what:"PA, creatinina y potasio.",cada:"A las "+wk+" semanas",wk,dt:addDays(fc,wk*7),tag:"Propuesta",
      why:"Inicia o ajusta "+aj.join(" y ")+" hoy: riesgo de hiperpotasemia y de caída hemodinámica de la TFGe. KDIGO 2024 indica 2 a 4 semanas; se fijan "+wk+(wk===2?" por "+((d.tfg!=null&&d.tfg<30)?"TFGe < 30":"potasio "+n(d.k,1)+" (≥ 5,0)")+".":".")+" Una caída de TFGe > 30 % amerita evaluación."});labs.push(o);}
  // potasio
  {const kW=[];if(["est","aj"].includes(meds0.raas))kW.push("recibe IECA/ARA II");if(d.dmTipo==="2"&&["est","aj"].includes(meds0.fin))kW.push("recibe finerenona");if(g4||g5)kW.push("está en "+c.G);
   if(d.k!=null&&d.k>=5.5&&d.k<6)L("k","k","Potasio","Potasio sérico.",{wk:1},"Propuesta","Potasio "+n(d.k,1)+" (hiperpotasemia leve): repetir a la semana tras ajustar dieta y fármacos (intervalo = propuesta institucional).",true);
   else if(kW.length)L("k","k","Potasio","Potasio sérico.",{m:cr},"Propuesta","Se toma con cada creatinina porque "+kW.join(" y ")+".");}
  // HbA1c
  if(d.dm){const m=(a1cOff||d.dmAj)?3:6;L("hba1c","hba1c","HbA1c","Hemoglobina glicosilada.",{m},"CAC",a1cOff?"Fuera de meta ("+n(d.hba1c,1)+" % vs "+gl.a1cTxt+"): cada 3 meses, el tiempo que tarda la HbA1c en reflejar el ajuste (CAC).":d.dmAj?"Se ajusta hoy el tratamiento: control a los 3 meses (CAC).":d.hba1c==null?"Sin dato: la CAC indica cada 3 a 6 meses; se fija 6.":"En meta y estable: cada 6 meses (CAC).",a1cOff||d.dmAj);}
  // lípidos
  if(meds0.stat==="aj"){const o=R({sec:"Laboratorio",key:"ldl",act:"Perfil lipídico",what:"Colesterol total, HDL, triglicéridos y cLDL.",cada:"A las 8 semanas",wk:8,dt:addDays(fc,56),tag:"Individualizado",why:"Inicia o ajusta estatina: verificar respuesta frente a la meta "+gl.ldlTxt+" (ESC/EAS 2019: 8 ± 4 semanas; se fijan 8). Luego anual."});labs.push(o);}
  else L("ldl","ldl","Perfil lipídico","Colesterol total, HDL, triglicéridos y cLDL.",{m:12},"CAC","Control anual del programa (CAC). Meta "+gl.ldlTxt+(d.ldl!=null&&d.ldl>gl.ldl?"; hoy fuera de meta: si ajusta la estatina, marque «inicia o ajusta hoy» para fecharlo a 8 semanas.":"."));
  // hemoglobina
  if(g3)L("hb","hb","Hemoglobina","Hemograma.",{m:anem?3:6},"CAC",anem?"Anemia en ERC G3: control a los 3 meses mientras se estudia y trata (propuesta; la CAC fija semestral sin anemia).":"ERC G3: tamizaje de anemia semestral (CAC).",anem);
  if(g4||g5)L("hb","hb","Hemoglobina","Hemograma.",{m:3},"Propuesta","ERC "+c.G+": trimestral. La CAC dice semestral en p. 46 y trimestral en p. 69; se adopta trimestral.");
  if(anem)R({sec:"Laboratorio",key:"anemia",act:"Estudio de anemia",what:"Reticulocitos, ferritina y saturación de transferrina (B12 y folato según clínica).",cada:"Una vez",dt:fc,now:true,tag:"KDIGO",why:"Hb "+n(d.hb,1)+" g/dL por debajo del umbral KDIGO ("+(d.sexo==="M"?"13":"12")+"): definir la causa antes de tratar."});
  // metabolismo mineral
  if(g3||g4||g5){
    const f=g3?12:g4?6:3;
    if(fosOff&&f>3)L("cap","fos","Calcio y fósforo","Calcio y fósforo séricos.",{m:3},"CAC","Fósforo "+n(d.fos,1)+" fuera de meta (2,7–"+n(fosHi,1)+"): control a los 3 meses tras ajustar dieta o quelante (individualizado; la CAC fija "+low(cadaM(f))+" en "+c.G+").",true);
    else L("cap","fos","Calcio y fósforo","Calcio y fósforo séricos.",{m:f},"CAC","Trastorno mineral óseo en "+c.G+": "+low(cadaM(f))+" (CAC).");
    L("pth","pth","PTH","PTH intacta.",{m:f},"CAC","Trastorno mineral óseo en "+c.G+": "+low(cadaM(f))+" (CAC). Se interpreta la tendencia, no un valor aislado.");
  }
  if(d.hco3!=null&&d.hco3<22)L("hco3","hco3","Bicarbonato","Bicarbonato sérico.",{m:cr},"Propuesta","Valor actual "+n(d.hco3,1)+" mmol/L (< 22): se repite con la creatinina.",true);
  if(d.alb!=null&&d.alb<3.5)L("alb","alb","Albúmina","Albúmina sérica.",{m:3},"Propuesta","Albúmina "+n(d.alb,1)+" g/dL: repetir a los 3 meses junto con la intervención de nutrición (propuesta).",true);
  // Agrupar tomas: lo que vence dentro de 30 días se adelanta a la toma más próxima (nunca se atrasa)
  const mon=labs.filter(o=>!o.wk&&!o.now).sort((a,b)=>a.dt-b.dt);
  let anchor=null;mon.forEach(o=>{if(anchor&&days(anchor,o.dt)<=35){const dd=days(anchor,o.dt);if(dd>0){o.why+=" Se adelanta "+dd+" días para tomarlo junto con los demás del "+fd(anchor)+".";o.dt=anchor;}}else anchor=o.dt;});
  const cal={};P.rows.filter(r=>r.sec==="Laboratorio").forEach(r=>{const k=fd(r.dt);(cal[k]=cal[k]||{dt:r.dt,items:[]}).items.push(r.act);});
  P.labCal=Object.values(cal).sort((a,b)=>a.dt-b.dt);

  /* ===== Estudio inicial ===== */
  const una=(sec,key,a,w,tag,y)=>R({sec,key,act:a,what:w,cada:"Una vez",dt:fc,now:true,tag,why:y});
  if(d.tipo==="primera"){
    una("Estudio inicial","uro","Uroanálisis con sedimento","Buscar hematuria, cilindros o leucocituria que orienten la causa.","CAC","Evaluación etiológica inicial (CAC tabla 8; clasificación CGA de KDIGO).");
    una("Estudio inicial","eco","Ecografía renal y de vías urinarias","Tamaño, ecogenicidad, asimetría, quistes u obstrucción.","CAC","Evaluación etiológica si no hay estudio previo pertinente (CAC p. 60). No se repite anualmente por defecto.");
  }

  /* ===== Clínica ===== */
  const every=(sec,key,a,w,m,tag,y)=>R({sec,key,act:a,what:w,cada:cadaM(m),m,dt:addMonths(fc,m),tag,why:y});
  const due=(sec,key,a,w,done,m,tag,y,dtOverride)=>R({sec,key,act:a,what:w,cada:cadaM(m),m,dt:done?(dtOverride||addMonths(fc,m)):fc,now:!done,tag,why:y+(done?" Hecho en el último año; la fecha es el límite para repetirla.":" Sin registro en el último año.")});
  every("Clínica","antropo","Antropometría","Peso, talla, IMC y circunferencia de cintura.",12,"CAC","Anual (CAC); alimenta los indicadores de IMC 20–25 (nefro_08) y cintura (nefro_31).");
  due("Clínica","rcv","Riesgo cardiovascular","Escala validada para Colombia.",d.at.rcv,12,"Indicador","Anual en todas las poblaciones (nefro_42).");
  if(c.kfre){const rr=P.rows.find(r=>r.key==="rac");R({sec:"Clínica",key:"kfre",act:"KFRE",what:"Recalcular con la nueva TFGe y RAC.",cada:"Con cada RAC",dt:rr?rr.dt:addMonths(fc,rac),tag:"Propuesta",why:"Hoy "+n(c.kfre.r2*100,1)+" % a 2 años y "+n(c.kfre.r5*100,1)+" % a 5 años. Orienta remisión, intensidad y preparación de TRR (KDIGO 2024)."});}
  if(g4||g5||(d.edad!=null&&d.edad>65))every("Clínica","desnut","Tamizaje de desnutrición","Valoración global subjetiva u otra herramienta validada.",6,"CAC",(g4||g5)?"ERC "+c.G+": cada 6 meses (CAC).":"Mayor de 65 años: cada 6 meses (CAC).");

  /* ===== Equipo ===== */
  const pkg=M.multi==="PAQUETE"&&nefroLead;
  const alignM=m=>pkg&&m>=rev0?Math.floor(m/rev0)*rev0:m;
  const pkgTxt=m=>pkg&&m>=rev0?" Paquete de "+epsN+": frecuencia según riesgo (CAC/GPC) y se agenda el mismo día de la valoración por nefrología"+(alignM(m)!==m?" (queda "+low(cadaM(alignM(m)))+")":"")+".":"";
  // Nutrición individualizada
  const n3=[],n6=[];
  if(fosOff&&!g12)n3.push("fósforo fuera de meta");
  if(d.k!=null&&d.k>=5.5)n3.push("potasio ≥ 5,5");
  if(d.alb!=null&&d.alb<3.5)n3.push("albúmina < 3,5");
  if(d.imc!=null&&d.imc<20)n3.push("IMC < 20");
  if(d.imc!=null&&d.imc>=35)n3.push("IMC ≥ 35");
  if(g5)n3.push("ERC G5");
  if(g4)n6.push("ERC G4");
  if(d.imc!=null&&d.imc>=25&&d.imc<35)n6.push((d.imc<30?"sobrepeso":"obesidad")+" (IMC "+n(d.imc,1)+")");
  if(a1cOff)n6.push("HbA1c fuera de meta");
  const nm=n3.length?3:n6.length?6:12;
  const nutWhy=nm<12?"Se intensifica a "+low(cadaM(nm))+" por "+(n3.length?n3:n6).join(", ")+(n3.length&&n6.length?" (además "+n6.join(", ")+")":"")+". La CAC fija mínimo anual; la frecuencia mayor es propuesta institucional (ninguna guía fija el número; KDOQI 2020 recomienda terapia nutricional médica por nutricionista en ERC).":"Mínimo anual (CAC)"+(c.grupo===1?"; desde el diagnóstico.":".")+" Sin hallazgos que obliguen a intensificar.";
  R({sec:"Equipo",key:"nut",act:"Nutrición",what:"Plan alimentario según estadio: proteína, sodio, potasio y fósforo; peso.",cada:cadaM(nm),m:nm,
     dt:d.at.nut?addMonths(fc,alignM(nm)):fc,now:!d.at.nut,
     tag:nm<12?"Individualizado":"CAC",why:nutWhy+pkgTxt(nm)+(d.at.nut?"":" Sin registro en el último año: programar ahora.")});
  const team=(key,a,w,done,y)=>due("Equipo",key,a,w,done,12,"Indicador",y+pkgTxt(12),addMonths(fc,alignM(12)));
  due("Equipo","edu","Educación estructurada","Enfermedad, nefrotóxicos, metas y autocuidado"+(g4||g5?"; modalidades de TRR y TMND":"")+".",d.at.edu,12,"CAC","Mínimo anual (CAC)"+(c.erc==="si"?"; indicador nefro_41.":"."));
  if(g3||g4||g5){
    team("enf","Enfermería","Valoración, educación y seguimiento telefónico entre controles.",d.at.enf,"Mínimo una atención al año desde G3a (nefro_40).");
    team("psi","Psicología","Tamizaje de ansiedad, depresión y adaptación a la enfermedad.",d.at.psi,"Mínimo una atención al año desde G3a (nefro_40).");
    team("ts","Trabajo social","Red de apoyo, barreras de acceso y transporte.",d.at.ts,"Mínimo una atención al año desde G3a (nefro_40).");
  }
  const nef=[];
  if(d.tfg<30)nef.push("TFGe < 30");
  if(d.rac!=null&&d.rac>300)nef.push("RAC > 300");
  if(d.tfgPrev!=null&&c.prevDays>=90&&(d.tfgPrev-d.tfg)/c.prevDays*365>5)nef.push("caída > 5 ml/min/año");
  if(c.kfre&&c.kfre.r5>=0.05)nef.push("KFRE 5 años ≥ 5 %");
  if(d.htaRes)nef.push("HTA resistente");
  P.nef=nef;
  if(!nefroLead&&d.prof!=="nefro"&&nef.length)due("Equipo","nefro","Nefrología","Valoración por especialista.",d.at.nefro,12,"Indicador","Cumple criterio de nefro_33: "+nef.join(", ")+".");
  if(d.prof==="nefro"&&d.conducta==="contra"&&nef.length)every("Equipo","nefro","Nefrología","Control por especialista tras la contrarreferencia.",12,"Indicador","Mantiene criterio de nefro_33 ("+nef.join(", ")+"): mínimo una valoración al año.");
  if(d.terapia==="tmnd"||d.conducta==="tmnd")R({sec:"Equipo",key:"paliativo",act:"Soporte renal / cuidado paliativo",what:"Control de síntomas y planificación anticipada del cuidado.",cada:"Cada mes",m:1,dt:addMonths(fc,1),tag:"CAC",why:"G5 en TMND: integración continua del cuidado paliativo (CAC grupo 3)."});
  const ajAll=aj.concat(meds0.stat==="aj"?["estatina"]:[]);
  if(ajAll.length)R({sec:"Equipo",key:"qf",act:"Química farmacéutica",what:"Educación del medicamento nuevo, adherencia, interacciones y nefrotóxicos.",cada:"Con el control post-ajuste",dt:addDays(fc,(aj.length?wk:8)*7),tag:"CAC",why:"Inicio o ajuste de "+ajAll.join(", ")+" (CAC: al iniciar tratamiento farmacológico)."});
  due("Equipo","flu","Vacuna de influenza","Dosis anual.",d.at.flu,12,"Indicador","Anual en todas las poblaciones (nefro_32).");

  /* ===== Preparación para TRR ===== */
  if(d.terapia==="trr"||d.conducta==="prep"||(c.kfre&&c.kfre.r2>0.4)){
    const pw=d.terapia==="trr"||d.conducta==="prep"?"G5 o decisión de preparación para TRR.":"KFRE a 2 años > 40 % (KDIGO 2024).";
    una("Preparación para TRR","trr_edu","Educación en modalidades","Hemodiálisis, diálisis peritoneal, trasplante y TMND, con decisión compartida con paciente y cuidador.","KDIGO",pw);
    una("Preparación para TRR","hepb","Hepatitis B","Serología (HBsAg, anti-HBs, anti-HBc) y vacunación con verificación de respuesta.","KDIGO","ERC con alto riesgo de progresión (KDIGO 2012, 1B); requisito antes de hemodiálisis.");
    una("Preparación para TRR","tx","Valoración para trasplante renal","Remisión para evaluar candidatura.","KDIGO","Evaluar candidatura antes del inicio previsto de diálisis para permitir trasplante anticipado (KDIGO 2020, candidatos a trasplante).");
    R({sec:"Preparación para TRR",key:"acceso",act:"Acceso para diálisis",what:"Fístula arteriovenosa o catéter peritoneal según la modalidad elegida.",cada:"Al definir modalidad",dt:null,tag:"Propuesta",why:"Evitar iniciar diálisis por catéter venoso de urgencia."});
  }

  /* ===== Próximo contacto ===== */
  const ctlRows=P.rows.filter(r=>r.sec==="Control médico");
  const nx=ctlRows.slice().sort((a,b)=>a.dt-b.dt)[0];
  P.next={date:nx.dt,who:nx.act,short:nx.key==="ctl"?P.rev.short:(nx.key==="ajuste"?"Ajuste de metas":"Formulación / control intermedio")};

  /* ===== Acciones de hoy ===== */
  if(paOff)act("warn","PA fuera de meta ("+gl.paTxt+"): ajustar tratamiento; control al mes hasta lograr la meta.",addMonths(fc,1));
  if(a1cOff)act("warn","HbA1c fuera de meta ("+gl.a1cTxt+"): ajustar tratamiento; control al mes y HbA1c a los 3 meses.",addMonths(fc,1));
  if(d.tipo==="primera"&&!d.causa)act("info","Registre la causa probable de la ERC para completar la clasificación CGA.");
  P.meds.forEach(m=>{
    if(m.ind===true&&m.st==="no")act("warn",m.name+": indicado y no lo recibe ("+m.why+"). Iniciar o registrar el motivo.");
    if(m.ind==="cons"&&m.st==="no")act("info",m.name+": considerar ("+m.why+").");
    if(m.st==="ci")act("info",m.name+": contraindicado o no tolerado. Registrar el motivo en la HC.");
    if(m.k==="fin"&&m.ind===false&&m.st==="aj")act("bad","Finerenona: "+m.why+".");
  });
  if(meds0.stat==="est"&&d.ldl!=null&&d.ldl>gl.ldl)act("warn","cLDL fuera de meta con estatina: ajustar dosis o agregar ezetimiba y marcar «inicia o ajusta hoy» para fechar el control a 8 semanas.");
  if(nef.length&&!d.at.nefro&&d.prof!=="nefro")act("bad","Remitir a nefrología: "+nef.join(", ")+" (nefro_33).",fc);
  if(c.kfre&&c.kfre.r2>0.4)act("bad","KFRE a 2 años > 40 %: educación de modalidades y preparación de TRR o planeación de TMND.");
  else if(c.kfre&&c.kfre.r2>0.1)act("warn","KFRE a 2 años > 10 %: atención multidisciplinaria intensiva.");
  if(tfgDrop)act("warn","TFGe cayó > 20 % frente a la previa: revisar la causa (no diagnosticar progresión automáticamente).");
  if(racDup)act("warn","RAC duplicada frente a la previa: verificar resultado y contexto.");
  const on=(d.sint||[]).filter(s=>s.on).map(s=>s.id);
  if(on.includes("olig")||on.includes("hemat")||(on.includes("disnea")&&on.includes("edema")))act("bad","Síntomas de alarma: valoración prioritaria; descartar deterioro agudo o sobrecarga de volumen.",fc);
  if((g4||g5)&&(on.length>=3||(d.kps!=null&&d.kps<=50)))act("warn","Carga de síntomas o funcional relevante: integrar soporte renal o cuidado paliativo y psicología.");
  if(on.includes("animo"))act("info","Ansiedad o ánimo deprimido: tamizaje y valoración por psicología.");
  if(d.k!=null&&d.k>=6)act("bad","Potasio ≥ 6,0: valoración prioritaria y EKG.",fc);
  P.ind=indicators(d,c,gl,fl,fc,nef);
  return P;
}

function indicators(d,c,gl,fl,fc,nef){
  const I=[],w=days(fl,fc);const add=(code,t,s,det)=>I.push({code,t,s,det});
  const st=(cond)=>cond==null?"na":cond?"ok":"no";
  const inUse=k=>d.meds&&["est","aj"].includes(d.meds[k]);
  add("nefro_39","RAC y TFGe en el último año",st(d.tfg!=null&&d.rac!=null&&w<=365));
  add("nefro_04","cLDL medido en el último año",st(d.ldl!=null&&w<=365));
  add("nefro_08","IMC 20–25 kg/m²",d.imc==null?"na":st(d.imc>=20&&d.imc<=25));
  if(d.dm){
    add("nefro_02","HbA1c en los últimos 6 meses",st(d.hba1c!=null&&w<=180));
    if(d.hba1c!=null)add(c.grupo===1?"nefro_03":"nefro_12","HbA1c "+(c.grupo===1?"< 7 %":"< 8 %"),st(d.hba1c<gl.a1c),"población inferida; confirmar en la ficha");
  }
  if(d.ldl!=null)add(c.grupo===1?"nefro_05":"nefro_05_1","cLDL "+(c.grupo===1?"≤ 100":"≤ 70")+" mg/dL",st(d.ldl<=(c.grupo===1?100:70)));
  if(d.edad!=null&&d.edad>=50&&d.tfg!=null&&d.tfg<60)add("nefro_29","Estatina en ≥ 50 años con ERC 3a–5",st(inUse("stat")));
  if((d.hta||d.dm)&&c.erc==="si"&&d.rac!=null&&d.rac>30)add("nefro_34","IECA o ARA II con RAC > 30",st(inUse("raas")),d.meds.raas==="ci"?"contraindicación registrada":"");
  if(d.dmTipo==="2"&&d.tfg!=null&&d.tfg>=20)add("nefro_38","iSGLT2 en DM2 con TFGe ≥ 20",st(inUse("sglt2")));
  if(nef.length)add("nefro_33","Valoración por nefrología en el año",st(d.at.nefro||d.prof==="nefro"),nef.join(", ")+(d.prof==="nefro"?"; valorado hoy":""));
  if(c.G&&!["G1","G2"].includes(c.G)){const miss=[["nut","nutrición"],["enf","enfermería"],["psi","psicología"],["ts","trabajo social"]].filter(x=>!d.at[x[0]]).map(x=>x[1]);add("nefro_40","Equipo multidisciplinario completo",st(!miss.length),miss.length?"falta: "+miss.join(", "):"");}
  if(c.erc==="si")add("nefro_41","Educación estructurada en ERC",st(d.at.edu));
  add("nefro_32","Vacuna de influenza anual",st(d.at.flu));
  add("nefro_42","RCV con escala validada",st(d.at.rcv));
  if(c.G==="G5"){
    add("nefro_24_2","Fósforo en el último trimestre",st(d.fos!=null&&w<=90),"población inferida");
    if(d.fos!=null)add("nefro_26_1","Fósforo 2,7–5,5 mg/dL",st(d.fos>=2.7&&d.fos<=5.5),"población inferida");
    add("nefro_22","PTH en el último trimestre",st(d.pth!=null&&w<=90),"población inferida");
    if(d.pth!=null)add("nefro_23","PTH 150–300 pg/mL",st(d.pth>=150&&d.pth<=300),"población inferida");
  }
  return I;
}

function note(d,c,P){
  const L=[];const gl=P.goals;
  const sexo=d.sexo==="M"?"Paciente masculino":d.sexo==="F"?"Paciente femenina":"Paciente";
  const prec=[];if(d.hta)prec.push("hipertensión arterial");if(d.dm)prec.push("diabetes mellitus"+(d.dmTipo==="2"?" tipo 2":d.dmTipo==="1"?" tipo 1":""));
  const fr=[];if(d.ecv)fr.push("enfermedad cardiovascular");if(d.fam)fr.push("antecedente familiar de ERC");if(d.aine)fr.push("uso de AINE u otros nefrotóxicos");if(d.uro)fr.push("litiasis o uropatía");if(d.tab)fr.push("tabaquismo");if(d.imc!=null&&d.imc>=30)fr.push("obesidad");if(d.otrosAnt)fr.push(d.otrosAnt);
  const PROF={nefro:"NEFROLOGÍA",mi:"MEDICINA INTERNA",mg:"MEDICINA GENERAL",exp:"MÉDICO EXPERTO"};
  L.push("VALORACIÓN POR "+(PROF[d.prof]||"MEDICINA")+" · PROGRAMA DE NEFROPROTECCIÓN · "+(d.tipo==="primera"?"PRIMERA VEZ":"CONTROL"));
  L.push("");
  L.push("ENFERMEDAD ACTUAL");
  let s=sexo+(d.edad!=null?" de "+n(d.edad)+" años":"")+(d.tipo==="primera"?" que ingresa al programa de nefroprotección. ":" en seguimiento por el programa de nefroprotección. ");
  s+="Condiciones precursoras: "+(prec.length?prec.join(" y "):"no registra HTA ni DM")+". ";
  s+="Otros factores de riesgo renal: "+(fr.length?fr.join(", "):"no refiere")+".";
  L.push(s);
  const LDn=d.labDates||{},fdl=k=>fd(LDn[k]||d.fLab||d.fCons);const lp=[];
  if(d.modo==="creat"&&d.creat!=null)lp.push("creatinina "+n(d.creat,2)+" mg/dL ("+fdl("creat")+")");
  if(d.tfg!=null)lp.push("TFGe "+n(d.tfg)+" ml/min/1,73 m²"+(d.modo==="creat"?" (CKD-EPI 2021)":" ("+fdl("tfg")+")"));
  if(d.rac!=null)lp.push("RAC "+n(d.rac)+" mg/g ("+fdl("rac")+")");
  let lab="Paraclínicos: "+lp.join(", ")+".";
  if(d.fPrev&&(d.tfgPrev!=null||d.racPrev!=null))lab+=" Resultado previo del "+fd(d.fPrev)+": "+[d.tfgPrev!=null?"TFGe "+n(d.tfgPrev):null,d.racPrev!=null?"RAC "+n(d.racPrev)+" mg/g":null].filter(Boolean).join(", ")+".";
  L.push(lab);
  let dx="Algoritmo diagnóstico (KDIGO 2024): ";
  if(c.erc==="fuera")dx+="paciente en diálisis o trasplantado; fuera de la ruta.";
  else if(c.erc==="agudo")dx+="sospecha de deterioro agudo; no se clasifica ERC con este resultado.";
  else if(c.erc==="no")dx+="TFGe ≥ 60 y RAC < 30 sin otros marcadores de daño. Conclusión: sin ERC demostrada ("+c.G+" "+c.A+"); continúa en el programa por su condición precursora.";
  else if(c.erc==="indet")dx+="datos incompletos ("+(d.rac==null?"sin RAC":"sin TFGe")+"); no es posible confirmar ni descartar ERC.";
  else{
    dx+="criterios presentes: "+c.crit.join("; ")+". ";
    dx+=c.erc==="si"?"Persistencia > 3 meses documentada ("+c.pers+"). Conclusión: ERC confirmada, ":"Sin cronicidad demostrada. Conclusión: ERC por confirmar, categorías provisionales ";
    dx+=c.G+(c.A?" "+c.A:" (sin RAC)")+(c.risk?", riesgo KDIGO "+c.risk:"")+".";
    dx+=" Causa probable: "+(CAUSA[d.causa]||"no registrada")+".";
  }
  L.push(dx);
  if(c.grupo&&c.erc!=="fuera"&&c.erc!=="agudo")L.push("Clasificación del programa: "+GRUPO[c.grupo]+(c.G==="G5"&&d.terapia?(d.terapia==="tmnd"?", subruta TMND (manejo conservador)":", subruta preparación para TRR"):"")+".");
  const ctl=[];
  if(d.pas!=null&&d.pad!=null)ctl.push("PA "+n(d.pas)+"/"+n(d.pad)+" mmHg ("+((d.pas<gl.pa[0]&&d.pad<gl.pa[1])?"en meta":"fuera de meta")+" "+gl.paTxt+")");
  if(d.dm&&d.hba1c!=null)ctl.push("HbA1c "+n(d.hba1c,1)+" % ("+(d.hba1c<gl.a1c?"en meta":"fuera de meta")+" "+gl.a1cTxt+")");
  if(d.ldl!=null)ctl.push("cLDL "+n(d.ldl)+" mg/dL ("+(d.ldl<=gl.ldl?"en meta":"fuera de meta")+" "+gl.ldlTxt+")");
  if(d.imc!=null)ctl.push("IMC "+n(d.imc,1)+" kg/m²");
  if(ctl.length)L.push("Control de enfermedades de base: "+ctl.join("; ")+".");
  if(P.meds&&P.meds.length)L.push("Tratamiento nefroprotector: "+P.meds.map(m=>m.name+" "+MEDST[m.st]).join("; ")+".");
  const S=d.sint||[];const pos=S.filter(x=>x.on).map(x=>x.label.toLowerCase()),neg=S.filter(x=>!x.on).map(x=>x.label.toLowerCase());
  if(S.length)L.push(pos.length?"Síntomas: refiere "+pos.join(", ")+"."+(neg.length?" Niega "+neg.join(", ")+".":""):"Asintomático desde el punto de vista renal: niega "+neg.join(", ")+".");
  const q=[];if(d.sf1)q.push("salud autopercibida «"+d.sf1.toLowerCase()+"» (ítem 1 SF-36)");if(d.kps!=null)q.push("Karnofsky "+d.kps+" %");
  L.push("Calidad de vida: "+(q.length?q.join("; "):"no evaluada en esta consulta")+".");
  L.push("");
  L.push("ANÁLISIS DE PARACLÍNICOS");
  (P.interp||[]).forEach(i=>L.push("- "+i.e+" "+i.v+": "+i.t));
  if(c.flags.length)c.flags.forEach(f=>L.push("- "+f));
  L.push("");
  L.push("PLAN");
  if(P.actions.length){L.push("Acciones de esta consulta:");P.actions.forEach(a=>L.push("- "+a.t+(a.when?" Fecha: "+fd(a.when)+".":"")));}
  if(d.prof==="nefro"&&d.conducta)L.push("Conducta de nefrología: "+CONDUCTA[d.conducta]+".");
  if(P.rows.length){L.push("Seguimiento programado:");P.rows.forEach(r=>{const full=r.sec==="Control médico";const showWhy=full||r.now||r.tag==="Individualizado"||r.tag==="EPS"||/^A las|^Con el/.test(r.cada);L.push("- "+r.act+(full?" ("+r.what.replace(/\.$/,"")+")":"")+": "+r.cada.toLowerCase()+"; próxima "+(r.dt?(r.now?"ahora, "+fd(r.dt):fd(r.dt)):"por definir")+"."+(showWhy?" Motivo: "+r.why:""));});}
  if(P.labCal&&P.labCal.length)L.push("Próximos paraclínicos: "+P.labCal.map(x=>fd(x.dt)+" ("+x.items.join(", ").toLowerCase()+")").join("; ")+".");
  if(P.next&&P.next.date)L.push("Próximo contacto médico: "+fd(P.next.date)+" ("+P.next.who.toLowerCase()+").");
  if(P.rev&&P.rev.months)L.push(P.rev.who+": "+fd(P.rev.date)+".");
  L.push("Recomendaciones: consejería en tabaco y alcohol, actividad física regular adaptada, alimentación según plan de nutrición, adherencia y signos de alarma.");
  return L.join("\n");
}

return{ckd,kfre,gStage,aCat,classify,plan,note,goals,addMonths,addDays,fd,days,GRUPO,MEDST,CAUSA};
})();
/* nefroproteccion/motor_clinico.js:428 */
const EPSMODEL_DEF={"EPS Familiar de Colombia":{inter:"MEDICO EXPERTO",interMeses:1,ajustePor:"MEDICO EXPERTO",multi:"PROGRAMA",meds:true},"Nueva EPS":{inter:"NINGUNO",interMeses:1,ajustePor:"NEFROLOGIA",multi:"PAQUETE",meds:false},"Mallamas EPS":{inter:"NINGUNO",interMeses:1,ajustePor:"MEDICO DEL PROGRAMA",multi:"PROGRAMA",meds:false}};
/* nefroproteccion/motor_cohorte.js:3 */
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
return { NP, COH, EPSMODEL_DEF, window };
}
