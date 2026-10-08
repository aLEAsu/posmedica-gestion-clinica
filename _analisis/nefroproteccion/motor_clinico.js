
/* ===================== MOTOR CLÍNICO (sin DOM) ===================== */
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
/* Modelo de atención por EPS (confirmado 6 oct 2026; en la versión con base de datos se lee de eps_modelo_atencion) */
const EPSMODEL_DEF={"EPS Familiar de Colombia":{inter:"MEDICO EXPERTO",interMeses:1,ajustePor:"MEDICO EXPERTO",multi:"PROGRAMA",meds:true},"Nueva EPS":{inter:"NINGUNO",interMeses:1,ajustePor:"NEFROLOGIA",multi:"PAQUETE",meds:false},"Mallamas EPS":{inter:"NINGUNO",interMeses:1,ajustePor:"MEDICO DEL PROGRAMA",multi:"PROGRAMA",meds:false}};
window.EPSMODEL=JSON.parse(JSON.stringify(EPSMODEL_DEF));
try{const sv=JSON.parse(localStorage.getItem("nefro_epsmodel")||"null");if(sv)Object.keys(sv).forEach(k=>{if(window.EPSMODEL[k])Object.assign(window.EPSMODEL[k],sv[k]);});}catch(e){}
