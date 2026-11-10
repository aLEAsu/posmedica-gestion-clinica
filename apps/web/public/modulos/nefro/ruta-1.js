// Código propio del proyecto. Ruta de Nefroprotección (punto de partida: prototipo v3.2).

/* ===================== RIESGO CARDIOVASCULAR Y FUNCIÓN RENAL (compartido portal / Nefroprotección) =====================
   Fórmulas transcritas de las publicaciones; ninguna está validada por la IPS. La decisión clínica es del profesional.
   - CKD-EPI 2021 sin raza: Inker LA et al. N Engl J Med 2021;385:1737-49.
   - Cockcroft-Gault: Cockcroft DW, Gault MH. Nephron 1976;16:31-41 (depuración estimada en mL/min, no normalizada).
     La piden los nominales de prediálisis/TMND de la EPS; la CAC usa CKD-EPI 2021 para estadificar.
   - SCORE2 (SCORE2 working group, Eur Heart J 2021;42:2439-54): coeficientes, supervivencia basal y calibración de la
     región de riesgo alto (la que aplicó PURE-Colombia). Recalibración para Colombia: López-López JP et al., PURE-Colombia,
     Eur J Prev Cardiol 2025;32(7):564-72 (multiplicar por 0,75 en mujeres y 0,61 en hombres). Válido de 40 a 69 años,
     sin diabetes ni enfermedad cardiovascular establecida.
   - Framingham general (D'Agostino RB et al. Circulation 2008;117:743-53). Ajuste para Colombia de la GPC de dislipidemias
     MinSalud-Colciencias (multiplicar por 0,75); la GPC no precisa la versión de Framingham. PURE-Colombia propone otros
     factores (0,67 mujeres; 0,27 hombres) y se muestran aparte.
   - Categoría automática por ERC: ESC 2021 (Visseren FLJ et al. Eur Heart J 2021;42:3227-337). La herramienta técnica de
     la CAC también reconoce alto riesgo automático con TFGe < 45 o albuminuria persistente.
*/
const RCV=(function(){
"use strict";
function ckdepi(scr,age,female){if(!(scr>0)||age==null)return null;const k=female?0.7:0.9,a=female?-0.241:-0.302;return 142*Math.pow(Math.min(scr/k,1),a)*Math.pow(Math.max(scr/k,1),-1.2)*Math.pow(0.9938,age)*(female?1.012:1);}
function cockcroft(scr,age,kg,female){if(!(scr>0)||age==null||!(kg>0))return null;return(140-age)*kg/(72*scr)*(female?0.85:1);}
const MMOL=38.67; /* mg/dL de colesterol → mmol/L */
const S2={M:{age:0.3742,smk:0.6012,sbp:0.2777,tc:0.1458,hdl:-0.2698,xsmk:-0.0755,xsbp:-0.0255,xtc:-0.0281,xhdl:0.0426,s0:0.9605,sc1:0.3207,sc2:0.9360,col:0.61},
          F:{age:0.4648,smk:0.7744,sbp:0.3131,tc:0.1002,hdl:-0.2606,xsmk:-0.1088,xsbp:-0.0277,xtc:-0.0226,xhdl:0.0613,s0:0.9776,sc1:0.5710,sc2:0.9369,col:0.75}};
function score2(o){const s=o.sexo==="F"?"F":o.sexo==="M"?"M":null;const miss=[];if(!s)miss.push("sexo");if(o.edad==null)miss.push("edad");if(o.pas==null)miss.push("PA sistólica");if(o.ct==null)miss.push("colesterol total");if(o.hdl==null)miss.push("HDL");if(o.tab==null)miss.push("tabaquismo");
  if(miss.length)return{ok:false,why:"Falta: "+miss.join(", ")+"."};
  if(o.edad<40||o.edad>69)return{ok:false,why:"SCORE2 aplica de 40 a 69 años (para 70 o más existe SCORE2-OP, no recalibrado para Colombia)."};
  if(o.dm)return{ok:false,why:"SCORE2 no aplica con diabetes (existe SCORE2-Diabetes, no recalibrado para Colombia)."};
  if(o.ecv)return{ok:false,why:"No se calcula con enfermedad cardiovascular establecida: es riesgo muy alto."};
  const b=S2[s],cage=(o.edad-60)/5,csbp=(o.pas-120)/20,ctc=o.ct/MMOL-6,chdl=(o.hdl/MMOL-1.3)/0.5,smk=o.tab?1:0;
  const lp=b.age*cage+b.smk*smk+b.sbp*csbp+b.tc*ctc+b.hdl*chdl+b.xsmk*smk*cage+b.xsbp*csbp*cage+b.xtc*ctc*cage+b.xhdl*chdl*cage;
  const unc=1-Math.pow(b.s0,Math.exp(lp));const reg=1-Math.exp(-Math.exp(b.sc1+b.sc2*Math.log(-Math.log(1-unc))));const col=reg*b.col;
  const lim=o.edad<50?[2.5,7.5]:[5,10];const cat=col*100<lim[0]?"Bajo a moderado":col*100<lim[1]?"Alto":"Muy alto";
  return{ok:true,r:col,rEU:reg,f:b.col,cat,lim,why:"Región de riesgo alto × "+String(b.col).replace(".",",")+" (PURE-Colombia). Categoría con umbrales ESC 2021 para "+(o.edad<50?"< 50":"50–69")+" años ("+String(lim[0]).replace(".",",")+" y "+String(lim[1]).replace(".",",")+" %); esos umbrales no se validaron para la recalibración colombiana."};}
const FR={M:{age:3.06117,tc:1.12370,hdl:-0.93263,sbpU:1.93303,sbpT:1.99881,smk:0.65451,dm:0.57367,mean:23.9802,s0:0.88936,pure:0.27},
          F:{age:2.32888,tc:1.20904,hdl:-0.70833,sbpU:2.76157,sbpT:2.82263,smk:0.52873,dm:0.69154,mean:26.1931,s0:0.95012,pure:0.67}};
function framingham(o){const s=o.sexo==="F"?"F":o.sexo==="M"?"M":null;const miss=[];if(!s)miss.push("sexo");if(o.edad==null)miss.push("edad");if(o.pas==null)miss.push("PA sistólica");if(o.ct==null)miss.push("colesterol total");if(o.hdl==null)miss.push("HDL");if(o.tab==null)miss.push("tabaquismo");if(o.antiHTA==null)miss.push("tratamiento antihipertensivo");
  if(miss.length)return{ok:false,why:"Falta: "+miss.join(", ")+"."};
  if(o.edad<30||o.edad>74)return{ok:false,why:"Framingham general se derivó en personas de 30 a 74 años."};
  const b=FR[s];const lp=b.age*Math.log(o.edad)+b.tc*Math.log(o.ct)+b.hdl*Math.log(o.hdl)+(o.antiHTA?b.sbpT:b.sbpU)*Math.log(o.pas)+(o.tab?b.smk:0)+(o.dm?b.dm:0);
  const r=1-Math.pow(b.s0,Math.exp(lp-b.mean));
  return{ok:true,r0:r,r:r*0.75,rPure:r*b.pure,why:"Framingham general 2008 × 0,75 (ajuste de la GPC colombiana de dislipidemias). Con el factor de PURE-Colombia ("+String(b.pure).replace(".",",")+") sería "+(Math.round(r*b.pure*1000)/10).toString().replace(".",",")+" %."+(o.ecv?" Con enfermedad cardiovascular establecida la escala no aplica: riesgo muy alto.":"")};}
/* Categoría automática (sin escala) */
function auto(o){const W=[];let cat=null;const up=c=>{const r={"Alto":1,"Muy alto":2};if(!cat||r[c]>r[cat])cat=c;};
  if(o.ecv){up("Muy alto");W.push("enfermedad cardiovascular aterosclerótica establecida");}
  const t=o.tfg,a=o.rac;
  if(t!=null){if(t<30||(t<45&&a!=null&&a>30)){up("Muy alto");W.push("ERC grave (TFGe < 30, o 30–44 con RAC > 30)");}
    else if((t<45&&(a==null||a<=30))||(t<60&&a!=null&&a>=30&&a<=300)||(a!=null&&a>300)){up("Alto");W.push("ERC moderada (TFGe 30–44 con RAC < 30; 45–59 con RAC 30–300; o RAC > 300)");}}
  if(o.tfgG5)up("Muy alto");
  return cat?{cat,why:W.join("; ")+" (ESC 2021)."}:null;}
function evalAll(o){const A=auto(o),S=score2(o),F=framingham(o);
  let main=null;if(A)main={src:"auto",cat:A.cat,txt:A.cat+" por "+A.why};
  else if(S.ok)main={src:"score2",cat:S.cat,r:S.r,txt:"SCORE2-Colombia "+pct(S.r)+" · "+S.cat};
  else if(F.ok)main={src:"fram",r:F.r,txt:"Framingham ajustado "+pct(F.r)};
  return{auto:A,score2:S,fram:F,main};}
const pct=r=>r==null?"—":(Math.round(r*1000)/10).toLocaleString("es-CO",{minimumFractionDigits:1,maximumFractionDigits:1})+" %";
const REFS=["SCORE2 working group and ESC Cardiovascular risk collaboration. SCORE2 risk prediction algorithms. Eur Heart J. 2021;42:2439-54.",
 "López-López JP, et al. External validation and comparison of six cardiovascular risk prediction models in the PURE-Colombia study. Eur J Prev Cardiol. 2025;32(7):564-72.",
 "D'Agostino RB Sr, et al. General cardiovascular risk profile for use in primary care: the Framingham Heart Study. Circulation. 2008;117:743-53.",
 "Ministerio de Salud y Protección Social – Colciencias. Guía de práctica clínica de dislipidemias (Framingham recalibrado para Colombia: riesgo × 0,75).",
 "Visseren FLJ, et al. 2021 ESC Guidelines on cardiovascular disease prevention in clinical practice. Eur Heart J. 2021;42:3227-337.",
 "Inker LA, et al. New creatinine- and cystatin C-based equations to estimate GFR without race. N Engl J Med. 2021;385:1737-49.",
 "Cockcroft DW, Gault MH. Prediction of creatinine clearance from serum creatinine. Nephron. 1976;16:31-41."];
return{ckdepi,cockcroft,score2,framingham,auto,evalAll,pct,REFS};
})();

