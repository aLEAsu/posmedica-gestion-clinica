// Código propio del proyecto. Ruta de Nefroprotección (punto de partida: prototipo v3.2).

(function(){
  "use strict";
  const $=id=>document.getElementById(id);
  const esc=s=>String(s==null?"":s).replace(/[&<>"]/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[m]));
  window.NEFRO_PRECON = window.NEFRO_PRECON || {};
  try{
    const sv = JSON.parse(localStorage.getItem("nefro_precon_v1")||"{}");
    Object.assign(window.NEFRO_PRECON, sv);
  }catch(e){}
  function savePrecon(){
    try{localStorage.setItem("nefro_precon_v1", JSON.stringify(window.NEFRO_PRECON));}catch(e){}
  }

  /* 1. Barra superior en #view-calc para Preconsulta y Cargue Masivo de Excel de Laboratorio */
  const vc = $("view-calc");
  if(vc){
    const topBar = document.createElement("div");
    topBar.className = "precon-bar";
    topBar.id = "nefro-calc-topbar";
    topBar.innerHTML = '<div><strong>Conexión automática Preconsulta + Laboratorio → Historia Clínica GPC</strong><span class="sub" style="display:block;font-size:12.5px;color:var(--muted)">Los signos vitales tomados por auxiliar de enfermería en Preconsulta y el Excel de Laboratorio caen automáticamente a esta HC sin redigitación.</span></div>' +
      '<div class="copyrow"><button type="button" class="btn sm" id="btn-nefro-pull-precon">Traer última Preconsulta / Signos Vitales</button>' +
      '<label class="btn sm primary" for="nefro-lab-excel">Cargar Excel de Laboratorio → HC</label><input type="file" id="nefro-lab-excel" accept=".xlsx,.xls,.csv" hidden>' +
      '<button type="button" class="btn sm" id="btn-nefro-lab-tpl">Plantilla Excel Lab</button></div>';
    vc.insertBefore(topBar, vc.firstChild);
  }

  /* 2. Construir Auditoría en Tiempo Real de Adherencia a GPC y Cumplimiento CAC */
  function buildGpcSidebar(d, c, P){
    const gl = P.goals || {pa:[140,90], a1c:7, ldl:100};
    const g35 = c.G && !["G1","G2"].includes(c.G);
    const items = [];
    const add = (st, title, sub, acc) => items.push({st, title, sub, acc});

    // 1. Identificación, EPS y Causa CGA
    add(d.pid && d.eps && d.edad!=null && d.sexo ? "y" : "w",
        "Identificación, EPS y demografía completas",
        (d.pid||"Sin código")+" · "+(d.eps||"Sin EPS"),
        "Completar código, EPS, edad y sexo en el paso 1.");
    add(d.causa && d.causa!=="desc" ? "y" : "n",
        "Causa de la ERC clasificada (CGA · KDIGO 2024)",
        d.causa ? "Causa registrada: "+d.causa.toUpperCase() : "Sin causa probable registrada",
        "Seleccionar la causa probable de la ERC en el paso 1.");
    // 2. Función renal y albuminuria (CKD-EPI 2021 + RAC)
    add(d.tfg!=null && d.rac!=null ? "y" : "n",
        "TFGe (CKD-EPI 2021) y RAC urinaria vigentes (nefro_39)",
        (d.tfg!=null?"TFGe "+Math.round(d.tfg)+" mL/min":"Sin TFGe")+" · "+(d.rac!=null?"RAC "+d.rac+" mg/g":"Sin RAC"),
        "Diligenciar creatinina/TFGe y relación albuminuria/creatinuria en el paso 3.");
    // 3. Cronicidad (> 3 meses)
    add(c.erc==="si" ? "y" : c.erc==="no" ? "na" : "w",
        "Persistencia > 3 meses documentada (KDIGO 2024)",
        c.erc==="si" ? (c.pers||"Confirmada") : c.erc==="no" ? "Sin ERC demostrada" : "Categoría provisional: falta previa > 90 días",
        "Registrar TFGe/RAC previa de hace ≥ 3 meses o marcar cronicidad en HC en el paso 4.");
    // 4. Signos vitales y meta de PA
    const paOk = d.pas!=null && d.pad!=null && d.pas<gl.pa[0] && d.pad<gl.pa[1];
    add(d.pas!=null && d.pad!=null ? (paOk ? "y" : "w") : "n",
        "Presión arterial medida y en meta ("+gl.paTxt+")",
        d.pas!=null ? "PA hoy: "+d.pas+"/"+d.pad+" mmHg"+(paOk?" (en meta)":" (fuera de meta: requiere ajuste y control al mes)") : "Sin PA registrada hoy",
        "Tomar PA en preconsulta o registrarla en el paso 5.");
    // 5. Antropometría (IMC y cintura)
    add(d.imc!=null && d.cint!=null ? "y" : "w",
        "Antropometría completa: Peso, Talla, IMC y Cintura (nefro_08 / nefro_31)",
        d.imc!=null ? "IMC "+d.imc.toFixed(1)+" kg/m²"+(d.cint!=null?" · Cintura "+d.cint+" cm":" · Falta cintura") : "Falta peso o talla",
        "Diligenciar peso, talla y perímetro abdominal en preconsulta o paso 5.");
    // 6. Nefroprotección farmacológica: IECA/ARA-II
    const reqRaas = (d.hta||d.dm) && d.rac!=null && d.rac>30;
    const onRaas = ["est","aj"].includes(d.meds.raas);
    add(!reqRaas ? "na" : onRaas || d.meds.raas==="ci" ? "y" : "n",
        "Bloqueo SRAA (IECA o ARA-II) si RAC > 30 mg/g (nefro_34 · KDIGO 1B)",
        !reqRaas ? "No exigido por albuminuria actual" : onRaas ? "Recibe IECA/ARA-II" : d.meds.raas==="ci" ? "Contraindicación documentada" : "Indicado y no formulado",
        "Iniciar IECA o ARA-II (nunca combinados) o registrar contraindicación en el paso 6.");
    // 7. iSGLT2
    const reqSglt2 = (d.dmTipo==="2" && d.tfg!=null && d.tfg>=20) || (c.erc==="si" && d.tfg!=null && d.tfg>=20 && d.rac!=null && d.rac>=200);
    const onSglt2 = ["est","aj"].includes(d.meds.sglt2);
    add(!reqSglt2 ? "na" : onSglt2 || d.meds.sglt2==="ci" ? "y" : "n",
        "iSGLT2 en DM2 o ERC albuminúrica con TFGe ≥ 20 (nefro_38 · KDIGO 1A)",
        !reqSglt2 ? "No aplica por TFGe/perfil" : onSglt2 ? "Recibe iSGLT2" : d.meds.sglt2==="ci" ? "Contraindicado" : "Indicado para frenar progresión renal",
        "Formular iSGLT2 (empagliflozina/dapagliflozina) en el paso 6.");
    // 8. Estatina
    const reqStat = (d.edad>=50 && c.erc==="si") || d.dm || d.ecv;
    const onStat = ["est","aj"].includes(d.meds.stat);
    add(!reqStat ? "na" : onStat || d.meds.stat==="ci" ? "y" : "n",
        "Estatina ± ezetimiba según riesgo CV (nefro_29 · KDIGO Lípidos 1A)",
        !reqStat ? "No aplica por edad/perfil" : onStat ? "Recibe estatina" : "Indicada por riesgo cardiovascular/ERC",
        "Formular estatina en el paso 6.");
    // 9. Control glucémico en DM
    add(!d.dm ? "na" : d.hba1c!=null ? (d.hba1c<gl.a1c ? "y" : "w") : "n",
        "HbA1c medida y en meta "+gl.a1cTxt+" (nefro_02 / nefro_03 / nefro_12)",
        !d.dm ? "Sin diabetes" : d.hba1c!=null ? "HbA1c "+d.hba1c+" %" : "Sin HbA1c registrada",
        "Registrar HbA1c del semestre en el paso 3.");
    // 10. KFRE y Riesgo Cardiovascular
    add(!g35 || c.conserv ? "na" : c.kfre ? "y" : "n",
        "Ecuación de riesgo de falla renal KFRE 2 y 5 años (KDIGO 2024)",
        !g35 ? "Aplica en G3a–G5" : c.kfre ? "KFRE 2a: "+(c.kfre.r2*100).toFixed(1)+" % · 5a: "+(c.kfre.r5*100).toFixed(1)+" %" : "Faltan datos para KFRE",
        "Con edad, sexo, TFGe y RAC se calcula automáticamente.");
    add(d.rcvHoy || d.at.rcv ? "y" : "n",
        "Riesgo cardiovascular estimado con escala validada (nefro_42)",
        d.rcvTxt || (d.at.rcv ? "Registrado en el año" : "Falta CT, HDL o PAS para calcular SCORE2/Framingham"),
        "Ingresar Colesterol Total, HDL y PAS para cálculo automático de RCV.");
    // 11. Vigilancia de complicaciones en G3–G5 (Hb, Fosforo, PTH, K)
    add(!g35 ? "na" : (d.hb!=null && d.fos!=null && d.pth!=null && d.k!=null) ? "y" : "n",
        "Paraclínicos de complicaciones G3–G5 (Hb, Fósforo, PTH, Potasio)",
        !g35 ? "Aplica desde G3a" : [d.hb==null&&"falta Hb", d.fos==null&&"falta P", d.pth==null&&"falta PTH", d.k==null&&"falta K"].filter(Boolean).join(", ") || "Completos",
        "Cargar desde el Excel de Laboratorio o diligenciar en el paso 3.");
    // 12. Equipo multidisciplinario y vacunación (nefro_40, nefro_41, nefro_32)
    const eqOk = !g35 ? d.at.nut && d.at.edu : (d.at.nut && d.at.enf && d.at.psi && d.at.ts && d.at.edu);
    const eqMiss = [["nut","Nutrición"],["enf","Enfermería"],["psi","Psicología"],["ts","Trabajo social"],["edu","Educación"]].filter(x=>(g35||x[0]==="nut"||x[0]==="edu")&&!d.at[x[0]]).map(x=>x[1]);
    add(eqOk ? "y" : "w",
        "Asistencia a Equipo Multidisciplinario y Educación (nefro_40 / nefro_41)",
        eqOk ? "Equipo completo en los últimos 12 meses" : "Falta asistencia a: "+eqMiss.join(", "),
        "Registrar asistencia en Agenda o marcar en el paso 8.");
    add(d.at.flu ? "y" : "w",
        "Vacunación anual contra Influenza y esquema renal (nefro_32)",
        d.at.flu ? "Vacuna de influenza vigente" : "Sin vacuna de influenza en el último año",
        "Registrar en el módulo de Vacunación o marcar en el paso 8.");
    // 13. Seguridad: AINEs / nefrotóxicos
    add(!d.aine ? "y" : "n",
        "Seguridad renal: libre de AINEs y nefrotóxicos (KDIGO 2024 Cap. 4)",
        !d.aine ? "Sin exposición actual a AINEs" : "Alerta: paciente reporta uso de AINEs/nefrotóxicos",
        "Suspender AINEs y documentar educación sobre nefrotóxicos.");

    const app = items.filter(i=>i.st!=="na");
    const ok = app.filter(i=>i.st==="y").length;
    const pct = app.length ? Math.round(ok/app.length*100) : 100;
    const cls = pct>=88 ? "ok" : pct>=68 ? "warn" : "bad";

    return '<aside class="nefro-gpc-side" aria-label="Auditoría en tiempo real de adherencia a GPC y cumplimiento CAC">' +
      '<div class="nefro-gpc-head"><h3 style="margin:0;color:var(--ink)">Auditoría GPC y CAC en Tiempo Real</h3><span class="nefro-gpc-chip '+cls+'">'+pct+' % ('+ok+'/'+app.length+')</span></div>' +
      '<p class="note" style="margin:0;font-size:12px">Verifica en vivo la adherencia a KDIGO 2024, ADA 2025, ESH/ACC y los indicadores mínimos CAC mientras diligencia la HC.</p>' +
      '<ul class="nefro-audl">' +
      items.map(i=>'<li class="'+i.st+'"><strong>'+esc(i.title)+'</strong><span class="sub">'+esc(i.sub)+'</span>'+(i.st==="n"||i.st==="w"?'<span class="sub" style="color:var(--ink);font-weight:600">→ '+esc(i.acc)+'</span>':'')+'</li>').join("") +
      '</ul></aside>';
  }

  /* Interceptar #out en #view-calc para envolver el resultado junto con la barra lateral de Auditoría GPC en tiempo real */
  const outEl = $("out");
  if(outEl && outEl.parentElement){
    const gridEl = outEl.parentElement;
    const sideContainer = document.createElement("div");
    sideContainer.id = "nefro-gpc-sidebar-box";
    /* Convertimos .grid en 3 columnas en pantallas amplias o envolvemos #out */
    const wrapDiv = document.createElement("div");
    wrapDiv.className = "nefro-calc-wrap";
    gridEl.replaceChild(wrapDiv, outEl);
    wrapDiv.appendChild(outEl);
    wrapDiv.appendChild(sideContainer);

    const refreshSidebar = ()=>{
      try{
        if(!window.APP || typeof window.APP.read!=="function")return;
        const d = window.APP.read();
        const c = NP.classify(d);
        d.rcv = RCV.evalAll({sexo:d.sexo,edad:d.edad,pas:d.pas,ct:d.ct,hdl:d.hdl,tab:d.tab,dm:d.dm,ecv:d.ecv,antiHTA:d.antiHTA,tfg:d.tfg,rac:d.rac,tfgG5:c.G==="G5"});
        d.rcvHoy = !!d.rcv.main;
        d.rcvTxt = d.rcv.main ? d.rcv.main.txt : "";
        const P = NP.plan(d,c);
        sideContainer.innerHTML = buildGpcSidebar(d, c, P);
      }catch(e){console.error(e);}
    };
    const obs = new MutationObserver(()=>refreshSidebar());
    obs.observe(outEl, {childList:true});
    setTimeout(()=>{
      try{
        if($("pick") && $("pick").options && $("pick").options.length>1 && !$("pid").value){
          $("pick").selectedIndex = 1;
          $("pick").dispatchEvent(new Event("change"));
        }
      }catch(e){}
      refreshSidebar();
    }, 180);
  }

  /* 3. Función para cargar signos vitales de Preconsulta directamente en el formulario de HC (#view-calc) */
  window.applyPreconToCalc = function(codigo){
    const code = codigo || ($("pid")&&$("pid").value.trim()) || ($("pick")&&$("pick").value);
    if(!code){toast("Seleccione primero un paciente.");return;}
    let pr = window.NEFRO_PRECON[code];
    if(!pr && window.parent && window.parent.V13_PRECON){
      pr = window.parent.V13_PRECON["nefro|"+code] || window.parent.V13_PRECON[code];
    }
    if(!pr){
      /* Si no hay preconsulta separada pero tiene última valoración en el libro, traer últimos signos vitales */
      const B = window.MG && window.MG.book;
      const vals = B && B.V && B.V[code];
      if(vals && vals.length){
        const lv = vals[vals.length-1];
        pr = {pas:lv.pas, pad:lv.pad, peso:lv.peso, talla:lv.talla, cint:lv.cint, fecha:NP.fd(lv.fecha), origen:"Última valoración registrada"};
      }
    }
    if(!pr){toast("No hay signos vitales de preconsulta registrados hoy para "+code+". Diligéncielos en la Agenda al confirmar la cita.");return;}
    if($("pick") && $("pick").value!==code){
      $("pick").value = code;
      $("pick").dispatchEvent(new Event("change"));
    }
    const setF = (id, val) => {if($(id) && val!=null && val!=="") $(id).value = String(val).replace(".",",");};
    setF("pas", pr.pas);
    setF("pad", pr.pad);
    setF("peso", pr.peso);
    setF("talla", pr.talla);
    setF("cint", pr.cint);
    if(pr.glu) setF("glu", pr.glu);
    const oa = $("otrosAnt");
    const svExtra = [pr.fc?"FC "+pr.fc+" lpm":"", pr.fr?"FR "+pr.fr+" rpm":"", pr.temp?"T "+pr.temp+" °C":"", pr.sat?"SatO2 "+pr.sat+" %":"", pr.glu?"Glucometría "+pr.glu+" mg/dL":""].filter(Boolean).join(", ");
    if(oa && svExtra && !oa.value.includes("Preconsulta")){
      oa.value = (oa.value ? oa.value+" · " : "") + "Preconsulta enfermería ("+(pr.fecha||"hoy")+"): "+svExtra;
    }
    $("frm").dispatchEvent(new Event("input"));
  };

  const btnPull = $("btn-nefro-pull-precon");
  if(btnPull) btnPull.addEventListener("click", ()=>window.applyPreconToCalc());

  /* Al seleccionar un paciente del selector #pick, si tiene Preconsulta lista hoy, cargarla automáticamente */
  if($("pick")){
    $("pick").addEventListener("change", ()=>{
      const code = $("pick").value;
      if(code && (window.NEFRO_PRECON[code] || (window.parent && window.parent.V13_PRECON && window.parent.V13_PRECON["nefro|"+code]))){
        setTimeout(()=>window.applyPreconToCalc(code), 60);
      }
    });
  }

  /* 4. Cargue Masivo de Excel de Laboratorio en Nefroprotección -> Cae directo al libro y a la HC */
  const inpExcel = $("nefro-lab-excel");
  if(inpExcel){
    inpExcel.addEventListener("change", e=>{
      const f = e.target.files[0]; if(!f)return;
      const rd = new FileReader();
      rd.onload = ev=>{
        try{
          const wb = XLSX.read(new Uint8Array(ev.target.result), {type:"array", cellDates:true});
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(ws, {defval:""});
          if(!rows.length){toast("El archivo Excel está vacío.");return;}
          const B = window.MG && window.MG.book;
          const EX_COLS = [
            ["creat", ["CREATININA","CREAT"]],
            ["tfgdir", ["TFGE","TFG"]],
            ["rac", ["RAC","ALBUMINURIA_CREATINURIA","RELACION_ALBUMINURIA"]],
            ["hba1c", ["HBA1C","GLICOSILADA","HEMOGLOBINA_GLICOSILADA"]],
            ["ldl", ["LDL","CLDL","COLESTEROL_LDL"]],
            ["ct", ["COLESTEROL_TOTAL","CT","COLESTEROL"]],
            ["hdl", ["HDL","CHDL","COLESTEROL_HDL"]],
            ["tg", ["TRIGLICERIDOS","TG"]],
            ["glu", ["GLUCEMIA","GLICEMIA","GLUCOSA"]],
            ["hb", ["HEMOGLOBINA","HB"]],
            ["k", ["POTASIO","K"]],
            ["ca", ["CALCIO","CA"]],
            ["fos", ["FOSFORO","P","FOS"]],
            ["pth", ["PTH","PARATOHORMONA"]],
            ["hco3", ["BICARBONATO","HCO3"]],
            ["alb", ["ALBUMINA","ALB"]]
          ];
          const EX_BOOK = {creat:"CREATININA",tfgdir:"TFGE_REPORTADA",rac:"RAC",hba1c:"HBA1C",ldl:"LDL",ct:"COLESTEROL_TOTAL",hdl:"HDL",tg:"TRIGLICERIDOS",glu:"GLICEMIA",hb:"HEMOGLOBINA",k:"POTASIO",ca:"CALCIO",fos:"FOSFORO",pth:"PTH",hco3:"BICARBONATO",alb:"ALBUMINA"};
          let nLoaded = 0, lastCode = "";
          rows.forEach(r=>{
            const normR = {};
            Object.keys(r).forEach(k=>{normR[k.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toUpperCase().replace(/[^A-Z0-9]+/g,"_").replace(/^_|_$/g,"")] = r[k];});
            let code = String(normR.CODIGO || normR.ID || normR.PACIENTE || "").trim();
            const doc = String(normR.DOCUMENTO || normR.CEDULA || normR.NUMERO_DE_IDENTIFICACION || "").replace(/\D/g,"");
            if(!code && doc && B && B.pac){
              const found = B.pac.find(p=>String(p.doc||"").replace(/\D/g,"")===doc);
              if(found) code = found.codigo;
            }
            const fStr = normR.FECHA || normR.FECHA_TOMA || normR.FECHA_DE_TOMA || "";
            const fDate = COH.toDate(fStr) || new Date();
            const fIso = fDate.getFullYear()+"-"+String(fDate.getMonth()+1).padStart(2,"0")+"-"+String(fDate.getDate()).padStart(2,"0");
            /* Formato largo (Examen, Valor) o formato ancho (columnas por examen) */
            const exName = String(normR.EXAMEN || "").toUpperCase().trim();
            if(exName && normR.VALOR!==undefined && normR.VALOR!==""){
              const hit = EX_COLS.find(([k, aliases])=>aliases.includes(exName) || k.toUpperCase()===exName);
              if(hit){
                const k = hit[0], val = normR.VALOR;
                if(code && B && B.L){
                  (B.L[code]=B.L[code]||[]).push({c:code, fecha:fDate, k:k==="tfgdir"?"tfg":k, v:COH.toNum(val)});
                }
                if(!code || code===($("pid")&&$("pid").value.trim()) || rows.length===1){
                  if($(k)) $(k).value = String(val).replace(".",",");
                  if($("fd_"+k)) $("fd_"+k).value = fIso;
                }
                lastCode = code || lastCode;
                nLoaded++;
              }
            } else {
              EX_COLS.forEach(([k, aliases])=>{
                const colKey = aliases.find(a=>normR[a]!==undefined && normR[a]!=="");
                if(colKey){
                  const val = normR[colKey];
                  if(code && B && B.L){
                    (B.L[code]=B.L[code]||[]).push({c:code, fecha:fDate, k:k==="tfgdir"?"tfg":k, v:COH.toNum(val)});
                  }
                  if(!code || code===($("pid")&&$("pid").value.trim()) || rows.length===1){
                    if($(k)) $(k).value = String(val).replace(".",",");
                    if($("fd_"+k)) $("fd_"+k).value = fIso;
                  }
                  lastCode = code || lastCode;
                  nLoaded++;
                }
              });
            }
          });
          if(lastCode && $("pick") && B && B.pac && B.pac.some(p=>p.codigo===lastCode)){
            $("pick").value = lastCode;
            $("pick").dispatchEvent(new Event("change"));
          }
          $("frm").dispatchEvent(new Event("input"));
          toast("Cargue de Laboratorio completado: "+nLoaded+" resultado(s) incorporados automáticamente a la Historia Clínica y al expediente.");
        }catch(err){toast("Error al leer el Excel de Laboratorio: "+err.message);}
        inpExcel.value="";
      };
      rd.readAsArrayBuffer(f);
    });
  }

  const btnTpl = $("btn-nefro-lab-tpl");
  if(btnTpl){
    btnTpl.addEventListener("click", ()=>{
      const wb = XLSX.utils.book_new();
      const aoa = [
        ["CODIGO","DOCUMENTO","FECHA_TOMA","CREATININA","RAC","HBA1C","LDL","COLESTEROL_TOTAL","HDL","TRIGLICERIDOS","GLUCEMIA","HEMOGLOBINA","POTASIO","CALCIO","FOSFORO","PTH","BICARBONATO","ALBUMINA"],
        [($("pid")&&$("pid").value)||"NP-0001","94000137",new Date().toISOString().slice(0,10),1.45,42,6.8,84,165,44,148,96,12.8,4.5,9.2,3.9,68,23,4.1]
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), "Paraclinicos_Lab");
      XLSX.writeFile(wb, "Plantilla_Laboratorio_Nefroproteccion.xlsx");
    });
  }

  /* 5. Enriquecer el diálogo de cita (#agdlg) en Nefroprotección con Preconsulta de Enfermería y Botón "Listo para atención -> Entrar a HC" */
  document.addEventListener("click", e=>{
    setTimeout(()=>{
      const dlg = $("agdlg");
      if(!dlg || dlg.hidden) return;
      const agacts = dlg.querySelector(".agacts");
      if(agacts && !dlg.querySelector("#nefro-precon-box")){
        const titleEl = $("agdlgt");
        const m = titleEl && /Cita\s+(C-\d+)/.exec(titleEl.textContent);
        const cid = m ? m[1] : null;
        const B = window.MG && window.MG.book;
        const c = cid && B && B.cit ? B.cit.find(x=>x.id===cid) : null;
        if(!c) return;
        const pr = window.NEFRO_PRECON[c.c] || {};
        const box = document.createElement("div");
        box.id = "nefro-precon-box";
        box.className = "panel";
        box.style.marginTop = "10px";
        box.style.borderLeft = "4px solid var(--ok)";
        const isConfirmed = c.conf==="CONFIRMADA" || c.estado==="EN SALA" || c.estado==="ATENDIDA" || pr.listo;
        box.innerHTML = '<div class="mhead"><h3 style="margin:0;color:var(--ink)">Preconsulta de Enfermería (Signos Vitales) y Paso a HC</h3>' +
          (pr.listo ? '<span class="listo-badge">✓ Paciente LISTO PARA ATENCIÓN</span>' : '<span class="tag">Confirmar cita para habilitar preconsulta</span>') + '</div>' +
          '<p class="note" style="margin:4px 0 8px">Al confirmar la cita, el auxiliar de enfermería diligencia los signos vitales; estos caen automáticamente a la Historia Clínica y habilitan al médico el botón para entrar a la HC.</p>' +
          '<div class="row3">' +
            '<label class="f">PA Sistólica (mmHg)<input type="number" id="pre_pas" value="'+esc(pr.pas||"")+'"></label>' +
            '<label class="f">PA Diastólica (mmHg)<input type="number" id="pre_pad" value="'+esc(pr.pad||"")+'"></label>' +
            '<label class="f">FC (lpm)<input type="number" id="pre_fc" value="'+esc(pr.fc||"")+'"></label>' +
            '<label class="f">FR (rpm)<input type="number" id="pre_fr" value="'+esc(pr.fr||"")+'"></label>' +
            '<label class="f">Temp (°C)<input type="number" step="0.1" id="pre_temp" value="'+esc(pr.temp||"")+'"></label>' +
            '<label class="f">SatO2 (%)<input type="number" id="pre_sat" value="'+esc(pr.sat||"")+'"></label>' +
            '<label class="f">Peso (kg)<input type="number" step="0.1" id="pre_peso" value="'+esc(pr.peso||"")+'"></label>' +
            '<label class="f">Talla (cm)<input type="number" id="pre_talla" value="'+esc(pr.talla||"")+'"></label>' +
            '<label class="f">Cintura (cm)<input type="number" id="pre_cint" value="'+esc(pr.cint||"")+'"></label>' +
            '<label class="f">Glucometría (mg/dL)<input type="number" id="pre_glu" value="'+esc(pr.glu||"")+'"></label>' +
            '<label class="f">Auxiliar que toma SV<input type="text" id="pre_aux" value="'+esc(pr.aux||"Aux. Enfermería")+'"></label>' +
            '<label class="f">Asistencia actividad<select id="pre_asis"><option value="EN SALA"'+(c.estado==="EN SALA"?" selected":"")+'>Confirmado / En sala (Listo)</option><option value="ATENDIDA"'+(c.estado==="ATENDIDA"?" selected":"")+'>Asistió (Actividad cumplida)</option><option value="INASISTENCIA"'+(c.estado==="INASISTENCIA"?" selected":"")+'>No asistió (Inasistencia)</option></select></label>' +
          '</div>' +
          '<div class="copyrow" style="margin-top:10px">' +
            '<button type="button" class="btn primary" id="btn-save-precon">Confirmar Cita y Guardar Preconsulta (Listo para atención)</button>' +
            (pr.listo || isConfirmed ? '<button type="button" class="btn primary" style="background:var(--ok);border-color:var(--ok);color:#06130e" id="btn-go-hc-precon">▶ Paciente Listo · Entrar a la HC del Paciente</button>' : '') +
          '</div>';
        agacts.parentNode.insertBefore(box, agacts.nextSibling);

        $("btn-save-precon").onclick = ()=>{
          const newPr = {
            pas:$("pre_pas").value.trim(), pad:$("pre_pad").value.trim(),
            fc:$("pre_fc").value.trim(), fr:$("pre_fr").value.trim(),
            temp:$("pre_temp").value.trim(), sat:$("pre_sat").value.trim(),
            peso:$("pre_peso").value.trim(), talla:$("pre_talla").value.trim(),
            cint:$("pre_cint").value.trim(), glu:$("pre_glu").value.trim(),
            aux:$("pre_aux").value.trim(), fecha:new Date().toISOString().slice(0,10),
            listo:true
          };
          window.NEFRO_PRECON[c.c] = newPr;
          if(window.parent && window.parent.V13_PRECON){
            window.parent.V13_PRECON["nefro|"+c.c] = newPr;
          }
          savePrecon();
          const estSel = $("pre_asis").value;
          c.conf = "CONFIRMADA";
          c.estado = estSel;
          if(estSel==="EN SALA" || estSel==="ATENDIDA"){
            c.hLleg = c.hLleg || "08:00";
            if(estSel==="ATENDIDA") c.hAten = c.hAten || "08:15";
          }
          if(window.MG && window.MG.book){
            COH.reindexCitas(window.MG.book);
          }
          dlg.hidden = true;
          if(window.MG && window.MG.show) window.MG.show("agenda");
        };
        const btnHc = $("btn-go-hc-precon");
        if(btnHc){
          btnHc.onclick = ()=>{
            dlg.hidden = true;
            if(window.MG && window.MG.show) window.MG.show("calc");
            if($("pick")){
              $("pick").value = c.c;
              $("pick").dispatchEvent(new Event("change"));
            }
            setTimeout(()=>window.applyPreconToCalc(c.c), 90);
          };
        }
      }
    }, 60);
  });
})();

