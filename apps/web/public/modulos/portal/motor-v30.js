// Código propio del proyecto. Motor integral v3.0: gobierno clínico, SIIS, oxígeno, indicadores con gráficas.

/* =====================================================================================================
   SIGC POSMÉDICA v3.0 · MOTOR INTEGRAL MULTIDISCIPLINARIO
   Equipo Rector:
   - Diseño Gráfico UI/UX Clínico
   - Arquitectura de Sistemas de Información y Gestión en Salud (SIGC / SIIS Bridge)
   - Especialidad en Nefrología (GPC KDIGO ERC 2024, TMO-ERC, Anemia 2026, Nefropatía Diabética 2025, IRA 2022, UKM Kt/V)
   - Maestría en Administración en Salud (SOGCS, SUA, Contratos y Tecnologías EPS, Control de Oxígeno, PAMEC)
   - Ciencia de Datos y Epidemiología Renal (64 Códigos SIIS: Eventos vs. Estadísticas, Pareto, Mapa de Calor, Evolución EPS)
   ===================================================================================================== */
(function(){
  "use strict";

  const V30 = {
    ver: "3.0",
    fecha: "2026-11-09",
    fontScale: (function(){ try { return parseFloat(localStorage.getItem("sigc_v30_fscale")) || 1; } catch(e) { return 1; } })(),
    palette: (function(){ try { return localStorage.getItem("sigc_v30_palette") || "ocean"; } catch(e) { return "ocean"; } })(),
    dpMode: "v11", // "v11" (Operación Integral v1.1) o "axes" (Gobernanza 7 Ejes)
    gpcTab: "gpc", // "gpc" | "prot" | "ukm" | "sillas13"
    evTab: "eventos", // "eventos" | "estadisticas" | "catalogo64" | "analitica"
    evCatFilter: "ALL",
    evSearch: "",
    cohFilter: { eps: "", turno: "", acc: "", riesgo: "", estado: "act", q: "" },
    indViewMode: "both", // "both" | "eps" | "matrix"
    indCatFilter: "ALL",
    ukmCalc: { pre: 68, post: 21, tMin: 240, ufKg: 2.4, wPost: 64.5, diuresisMl: 400, bunUri: 220 },
    oxiCalc: { cilindro: "M", psiIni: 1800, psiFin: 1100, flujo: 2, min: 180 },
    siisActs: [],
    oxiLog: [],
    oxiCylinders: [
      { id: "CIL-OXI-01", tipo: "M", capM3: 3.45, factor: 1.56, ubicacion: "Sala HD · Sector Sillas 1 a 6", lote: "OXM-2026-09", vence: "2027-09-30", psi: 1950, estado: "En uso / Disponible" },
      { id: "CIL-OXI-02", tipo: "M", capM3: 3.45, factor: 1.56, ubicacion: "Sala HD · Sector Sillas 7 a 13", lote: "OXM-2026-10", vence: "2027-10-31", psi: 1750, estado: "En uso / Disponible" },
      { id: "CIL-OXI-03", tipo: "E", capM3: 0.68, factor: 0.28, ubicacion: "Carro de Paro Unidad Renal", lote: "OXE-2026-08", vence: "2027-08-31", psi: 2100, estado: "Reserva Sellada (Carro de Paro)" },
      { id: "CIL-OXI-04", tipo: "E", capM3: 0.68, factor: 0.28, ubicacion: "Sala de Procedimientos / Aislamiento Silla 13", lote: "OXE-2026-11", vence: "2027-11-30", psi: 420, estado: "Alerta Recambio (< 500 PSI)" },
      { id: "CIL-OXI-05", tipo: "J", capM3: 6.80, factor: 2.41, ubicacion: "Central de Gases / Respaldo Sala HD", lote: "OXJ-2026-10", vence: "2027-10-31", psi: 2200, estado: "Reserva llena" }
    ]
  };
  window.V30 = V30;

  /* Aplicar escala tipográfica y paleta guardadas */
  function v30ApplyAppearance(){
    document.documentElement.style.setProperty("--font-scale", String(V30.fontScale || 1));
    if(V30.palette && V30.palette !== "ocean") document.documentElement.setAttribute("data-palette", V30.palette);
    else document.documentElement.removeAttribute("data-palette");
    try {
      localStorage.setItem("sigc_v30_fscale", String(V30.fontScale || 1));
      localStorage.setItem("sigc_v30_palette", V30.palette || "ocean");
    } catch(e){}
  }
  v30ApplyAppearance();

  /* ===================================================================================================
     1. EXTRACCIÓN EN MEMORIA Y PUENTE BIDIRECCIONAL DE CONTRATOS (CT11) Y DIÁLISIS PERITONEAL (DP11)
     =================================================================================================== */
  let CT_MEM = null;
  let DP11_SEED = null;
  let DP11_CONTRATOS = null;

  function v30InitEmbeddedData(){
    try {
      if(typeof CT11_HTML === "string" && !CT_MEM){
        const m = /const DATA=(\{[\s\S]*?\});\s*<\/script>/.exec(CT11_HTML);
        if(m) CT_MEM = JSON.parse(m[1]);
      }
    } catch(e){ console.error("Error parsing CT11 DATA:", e); }
    try {
      if(typeof DP11_HTML === "string" && !DP11_SEED){
        const m1 = /const SEED=(\{.*?\});\n/.exec(DP11_HTML);
        if(m1) DP11_SEED = JSON.parse(m1[1]);
        const m2 = /const CONTRATOS=(\{.*?\});\n/.exec(DP11_HTML);
        if(m2) DP11_CONTRATOS = JSON.parse(m2[1]);
      }
    } catch(e){ console.error("Error parsing DP11 SEED:", e); }
    window.SIGC_CT = CT_MEM;
    window.SIGC_DP11 = { seed: DP11_SEED, contratos: DP11_CONTRATOS };

    /* Si localStorage["dp_unop_v1"] está vacío, inicializarlo con el estado semilla de DP v1.1 para que todo el SIGC tenga datos en vivo desde el arranque */
    try {
      if(!localStorage.getItem("dp_unop_v1") && DP11_SEED){
        const initDp = {
          ver: 1,
          corte: "2026-09",
          pacientes: JSON.parse(JSON.stringify(DP11_SEED.pacientes || [])),
          ktv: JSON.parse(JSON.stringify(DP11_SEED.ktv || [])),
          labs: JSON.parse(JSON.stringify(DP11_SEED.labs || [])),
          seg: {},
          eventos: [
            { id: "EV-DP-01", pac: "DP-003", fecha: "2026-08-14", tipo: "Peritonitis", germen: "Staphylococcus epidermidis", atb: "Vancomicina IP + Ceftazidima IP", estado: "Resuelto", hosp: "No", nota: "Cumplió 14 días IP con aclaramiento de efluente" },
            { id: "EV-DP-02", pac: "DP-011", fecha: "2026-09-05", tipo: "Infección orificio de salida", germen: "Staphylococcus aureus MSSA", atb: "Cefalexina oral + Mupirocina tópica", estado: "En tratamiento", hosp: "No", nota: "Seguimiento por enfermería DP" }
          ],
          visitas: [
            { id: "VS-DP-01", pac: "DP-001", fecha: "2026-09-10", tipo: "Ingreso / Entrenamiento", agua: "Adecuada", espacio: "Adecuado", luz: "Adecuada", almacenamiento: "Adecuado", concepto: "Apto", resp: "Enf. Yuli Narváez", obs: "Condiciones locativas óptimas en domicilio" },
            { id: "VS-DP-02", pac: "DP-002", fecha: "2026-09-18", tipo: "Seguimiento anual", agua: "Adecuada", espacio: "Adecuado", luz: "Adecuada", almacenamiento: "Adecuado", concepto: "Apto", resp: "Enf. Yuli Narváez", obs: "Almacenamiento sobre estiba verificada" }
          ],
          farm: {},
          habil: [],
          cfg: { ktvMeta: 1.7, hbMeta: 10, pMin: 3.5, pMax: 5.5, albMeta: 3.5, pthMin: 150, pthMax: 600 },
          log: []
        };
        localStorage.setItem("dp_unop_v1", JSON.stringify(initDp));
      }
    } catch(e){}
  }
  v30InitEmbeddedData();

  /* ===================================================================================================
     1B. BASE DE DATOS REAL PRECARGADA DEL PROGRAMA DE HEMODIÁLISIS (Dashboard NOVIEMBRE (1).xlsx · Mocoa)
         Abolición del Excel externo: 36 pacientes activos en los 4 turnos × 13 sillas + 7 históricos,
         115 sesiones del corte, 29 glucometrías, 857 laboratorios (May–Ago/Oct 2026), 72 dosis VHB,
         trasplante, farmacia, tarifas EPS, 11 complicaciones y 3 novedades clínicas de Noviembre 2026.
     =================================================================================================== */
  const REAL_HD_DATA = window.REAL_HD_DATA; /* v3.1: la base mezclada de v3.0 se retiró; ver sigc-v31-hdx-core */
  window.REAL_HD_DATA = REAL_HD_DATA;

  function v30MapComplicacionToSiisNo(tipoRaw, condRaw){
    const s = norm((tipoRaw || "") + " " + (condRaw || ""));
    if(s.includes("CALAMBRE")) return "85";
    if(s.includes("NAUSEA") || s.includes("VOMITO")) return "15";
    if(s.includes("HIPERTENSION")) return "17";
    if(s.includes("HIPOTENSION")) return "4";
    if(s.includes("COAGULA")) return "1";
    if(s.includes("CEFALEA")) return "14";
    if(s.includes("SANGRADO") || s.includes("HEMATOMA")) return "6";
    if(s.includes("BACTEREMIA") || s.includes("INFECCION")) return "28";
    return "8";
  }

  /* v3.1: la carga de la base real pasa a hdxLoadBase (lectura estricta de los Dashboards).
     La versión 3.0 completaba aquí laboratorios, serologías, sesiones, prescripciones y valoraciones que no venían en el Excel. */
  function v30LoadRealHdBook(silent){ return window.hdxLoadBase(silent); }

  /* Sincronizar automáticamente localStorage["dp_unop_v1"] hacia DP.book para que MPI, IAAS-09, PROA, Laboratorio y Gerencia vean la cohorte real de DP v1.1 */
  function v30SyncDp11ToNativeBook(){
    /* Desactivado en la aplicación web: copiaba la cohorte de DP v1.1 del navegador al libro de DP completando con
       valores supuestos (nacimiento, EPS, municipio, fechas, talla). DP v1.1 se conecta a sus propias tablas (fase D). */
    return;
    try {
      const raw = localStorage.getItem("dp_unop_v1");
      const s = raw ? JSON.parse(raw) : DP11_SEED;
      if(!s || !Array.isArray(s.pacientes)) return;
      if(typeof DP === "undefined") return;
      if(!DP.book){
        if(typeof dpDemo === "function") dpDemo();
        else if(typeof dpNewBook === "function") DP.book = dpNewBook();
      }
      if(!DP.book) return;
      const existingIds = new Set(DP.book.pac.map(p => p.ID));
      s.pacientes.forEach(p => {
        const cleanId = String(p.id || "").replace("-", "");
        if(!existingIds.has(p.id) && !existingIds.has(cleanId)){
          const parts = String(p.nombre || "").trim().split(/\s+/);
          const nom = parts.slice(0, Math.max(1, parts.length - 2)).join(" ");
          const ape = parts.slice(Math.max(1, parts.length - 2)).join(" ");
          DP.book.pac.push({
            ID: p.id,
            IdInst: (p.tipoDoc || "CC") + "-" + (p.doc || ""),
            TipoDoc: p.tipoDoc || "CC",
            Documento: String(p.doc || ""),
            Nombres: nom || p.nombre,
            Apellidos: ape || "",
            FechaNac: p.fnac ? pdate(p.fnac) : new Date(1968, 5, 15),
            Sexo: p.sexo === "F" ? "Femenino" : "Masculino",
            EPS: p.eps || "NUEVA EPS",
            Municipio: p.municipio || "Mocoa",
            Telefono: p.tel || "",
            Modalidad: p.modalidad || "DPCA",
            EstadoPrograma: p.estado || "Activo",
            FechaIngresoPrograma: pdate(p.fIngreso || "2025-01-15"),
            FechaInicioTRR: pdate(p.fInicioTRR || p.fIngreso || "2025-01-15"),
            FechaInicioDP: pdate(p.fIngreso || "2025-01-15"),
            FechaCateter: pdate(p.fCateter || "2025-01-05"),
            Talla: p.talla || 162,
            Usuario: "Sincronizado DP v1.1",
            Registrado: nowTs()
          });
        }
      });
    } catch(e){ console.error("v30SyncDp11ToNativeBook:", e); }
  }

  /* Mejorar el embebido de DP11 y CT11 en #extapp para eliminar cabeceras duplicadas (.brand) y añadir barra conmutadora */
  if(typeof v22Srcdoc === "function"){
    v22Srcdoc = function(k){
      const h = (typeof V22 !== "undefined" && V22.apps && V22.apps[k] && V22.apps[k].html) || "<p>Módulo no disponible.</p>";
      const embedCss = `<script>window.SIGC_EMBED=true;<\/script><style id="v30-embed-clean">
        .themesw, .side .brand .logo, .side .foot { display: none !important; }
        .side .brand { padding: 4px 6px 8px !important; }
        .side .brand h1 { font-size: 14.5px !important; }
        .app { min-height: calc(100vh - 10px) !important; }
        body { font-size: ${Math.round(14.5 * (V30.fontScale || 1))}px !important; }
      </style>`;
      const i = h.indexOf("<head>");
      return i >= 0 ? h.slice(0, i + 6) + embedCss + h.slice(i + 6) : embedCss + h;
    };
  }

  /* ===================================================================================================
     2. CATÁLOGO OFICIAL DE LAS 64 ACTIVIDADES Y EVENTOS DE HEMODIÁLISIS (SIIS)
        Transcrito íntegramente de los anexos oficiales (image_fff65d.jpg e image_ffeee0.jpg)
     =================================================================================================== */
  const SIIS_ACTIVIDADES_HD = [
    /* --- Hoja 1 (image_fff65d.jpg): 31 actividades --- */
    { no: "12", act: "ACCIDENTE DE UN PACIENTE DENTRO DE LA SALA", tipo: "EVENTO", cat: "Seguridad del Paciente y Sala", prot: "SG-SST Bioseguridad", sev: "Moderada", frecuente: false },
    { no: "28", act: "BACTEREMIA POR CATETER PERMANENTE", tipo: "EVENTO", cat: "Infección Asociada a Acceso Vascular (IAAS)", prot: "GSH-PT-004", sev: "Severa", frecuente: false },
    { no: "30", act: "BACTEREMIA POR CATETER TEMPORAL", tipo: "EVENTO", cat: "Infección Asociada a Acceso Vascular (IAAS)", prot: "GSH-PT-004", sev: "Severa", frecuente: false },
    { no: "33", act: "CANULACION DE UNA FISTULA DE PRIMERA VEZ", tipo: "ESTADISTICA", cat: "Procedimientos de Acceso Vascular", prot: "GSH-PT-004", sev: "Informativa", frecuente: true },
    { no: "26", act: "CATETER PERMANENTE INFECTADO EN EL ORIFICIO", tipo: "EVENTO", cat: "Infección Asociada a Acceso Vascular (IAAS)", prot: "GSH-PT-004", sev: "Moderada", frecuente: true },
    { no: "27", act: "CATETER PERMANENTE INFECTADO EN EL TUNEL", tipo: "EVENTO", cat: "Infección Asociada a Acceso Vascular (IAAS)", prot: "GSH-PT-004", sev: "Severa", frecuente: true },
    { no: "29", act: "CATETER TEMPORAL INFECTADO EN EL ORIFICIO", tipo: "EVENTO", cat: "Infección Asociada a Acceso Vascular (IAAS)", prot: "GSH-PT-004", sev: "Moderada", frecuente: true },
    { no: "82", act: "CONSTRUCCIÓN DE FISTULA ARTERIO VENOSA", tipo: "ESTADISTICA", cat: "Procedimientos de Acceso Vascular", prot: "GSH-PT-004", sev: "Informativa", frecuente: false },
    { no: "93", act: "EDUCACION GRUPAL EN SALUD, POR ENFERMERIA", tipo: "ESTADISTICA", cat: "Educación, Adherencia y Convivencia", prot: "GSH-PT-001", sev: "Informativa", frecuente: false },
    { no: "14", act: "EPISODIO DE CEFALEA DURANTE LA SESIÓN", tipo: "EVENTO", cat: "Complicaciones Clínicas Intradiálisis", prot: "GSH-PT-003", sev: "Leve", frecuente: true },
    { no: "65", act: "FILTRO IMPERFECTO", tipo: "EVENTO", cat: "Tecnovigilancia y Circuito Extracorpóreo", prot: "GSH-PT-001", sev: "Leve", frecuente: false },
    { no: "6",  act: "HAY SANGRADOS Y/O HEMATOMA EN LA FISTULA DURANTE LA SESIÓN", tipo: "EVENTO", cat: "Complicaciones de Acceso Vascular", prot: "GSH-PT-004", sev: "Moderada", frecuente: false },
    { no: "13", act: "HAY UN PARO CARDIORESPIRATORIO SIN MUERTE DEL PACIENTE", tipo: "EVENTO", cat: "Eventos Centinela y Urgencias Vitales", prot: "GSH-PT-003", sev: "Severa", frecuente: false },
    { no: "17", act: "HIPERTENSION (170/105) DURANTE LA SESION", tipo: "EVENTO", cat: "Complicaciones Clínicas Intradiálisis", prot: "GSH-PT-003", sev: "Moderada", frecuente: true },
    { no: "4",  act: "HIPOTENSIÓN (80/60) SINTOMATICA EN CUALQUIER MOMENTO", tipo: "EVENTO", cat: "Complicaciones Clínicas Intradiálisis", prot: "GSH-PT-003", sev: "Moderada", frecuente: true },
    { no: "10", act: "INFECCION DE LA FISTULA ARTERIO VENOSA", tipo: "EVENTO", cat: "Infección Asociada a Acceso Vascular (IAAS)", prot: "GSH-PT-004", sev: "Moderada", frecuente: false },
    { no: "74", act: "INGRESA CON ROPA NO APROPIADA", tipo: "ESTADISTICA", cat: "Bioseguridad y Convivencia en Sala", prot: "SG-SST Bioseguridad", sev: "Informativa", frecuente: false },
    { no: "16", act: "LA FISTULA LLEGA O SALE TROMBOSADA DE LA SESIÓN", tipo: "EVENTO", cat: "Complicaciones de Acceso Vascular", prot: "GSH-PT-004", sev: "Severa", frecuente: false },
    { no: "5",  act: "LA MAQUINA PRODUCE ALARMA TECNICA DURANTE LA DIALISIS", tipo: "EVENTO", cat: "Tecnovigilancia y Circuito Extracorpóreo", prot: "GSH-PT-001", sev: "Leve", frecuente: true },
    { no: "66", act: "LINEA ARTERIAL IMPERFECTA", tipo: "EVENTO", cat: "Tecnovigilancia y Circuito Extracorpóreo", prot: "GSH-PT-001", sev: "Leve", frecuente: true },
    { no: "67", act: "LINEA VENOSA IMPERFECTA", tipo: "EVENTO", cat: "Tecnovigilancia y Circuito Extracorpóreo", prot: "GSH-PT-001", sev: "Leve", frecuente: true },
    { no: "21", act: "LINEAS ARTERIO VENOSAS COAGULADAS", tipo: "EVENTO", cat: "Coagulación del Circuito Extracorpóreo", prot: "GSH-PT-003", sev: "Moderada", frecuente: true },
    { no: "9",  act: "MUERTE DE UN PACIENTE DURANTE LA SESIÓN", tipo: "EVENTO", cat: "Eventos Centinela y Urgencias Vitales", prot: "GSH-PT-003", sev: "Severa", frecuente: true },
    { no: "37", act: "NO VIENE POR TRASLADO A OTRO TURNO DE HEMODIÁLISIS", tipo: "ESTADISTICA", cat: "Asistencia, Adherencia y Turnos", prot: "GSH-PT-001", sev: "Informativa", frecuente: false },
    { no: "83", act: "PACIENTE ACUSA DOLOR DURANTE LA TERAPIA SIN DEFINIR LUGAR", tipo: "EVENTO", cat: "Complicaciones Clínicas Intradiálisis", prot: "GSH-PT-003", sev: "Leve", frecuente: false },
    { no: "76", act: "PACIENTE AGRESIVO CON EL PERSONAL ASISTENCIAL", tipo: "EVENTO", cat: "Seguridad del Paciente y Sala", prot: "SG-SST Bioseguridad", sev: "Moderada", frecuente: false },
    { no: "73", act: "PACIENTE COME EN SALA", tipo: "ESTADISTICA", cat: "Bioseguridad y Convivencia en Sala", prot: "SG-SST Bioseguridad", sev: "Informativa", frecuente: false },
    { no: "86", act: "PACIENTE EN MANEJO CON ANTIBIOTICO", tipo: "ESTADISTICA", cat: "Administración Farmacológica y Oxígeno", prot: "GSH-PT-004", sev: "Informativa", frecuente: true },
    { no: "38", act: "PACIENTE LLEGA DE OTRO TURNO DE HEMODIÁLISIS", tipo: "ESTADISTICA", cat: "Asistencia, Adherencia y Turnos", prot: "GSH-PT-001", sev: "Informativa", frecuente: false },
    { no: "36", act: "PACIENTE NO ASISTE A LA SESIÓN", tipo: "ESTADISTICA", cat: "Asistencia, Adherencia y Turnos", prot: "GSH-PT-001", sev: "Informativa", frecuente: true },
    { no: "80", act: "PACIENTE NO COMPLETA LA VSD", tipo: "ESTADISTICA", cat: "Asistencia, Adherencia y Turnos", prot: "Manual UKM / Kt/V", sev: "Informativa", frecuente: false },

    /* --- Hoja 2 (image_ffeee0.jpg): 33 actividades --- */
    { no: "79", act: "PACIENTE QUE INGRESA ARTICULOS NO PERMITIDOS A SALA", tipo: "ESTADISTICA", cat: "Bioseguridad y Convivencia en Sala", prot: "SG-SST Bioseguridad", sev: "Informativa", frecuente: false },
    { no: "84", act: "PACIENTE QUE INGRESA CON MALAS CONDICIONES DE HIGIENE", tipo: "ESTADISTICA", cat: "Bioseguridad y Convivencia en Sala", prot: "SG-SST Bioseguridad", sev: "Informativa", frecuente: false },
    { no: "11", act: "PIERDE MENOS DEL 80% DEL ULTRAFILTRADO PROGRAMADO", tipo: "ESTADISTICA", cat: "Adecuación Dialítica y Paraclínicos", prot: "Manual UKM / Kt/V", sev: "Informativa", frecuente: true },
    { no: "64", act: "POR ORDEN MEDICA SE ADMINISTRA OXÍGENO", tipo: "ESTADISTICA", cat: "Administración Farmacológica y Oxígeno", prot: "GFA-FO-OXI-001", sev: "Informativa", frecuente: false },
    { no: "69", act: "REALIZACION DE KT/V", tipo: "ESTADISTICA", cat: "Adecuación Dialítica y Paraclínicos", prot: "Manual UKM / Kt/V", sev: "Informativa", frecuente: false },
    { no: "34", act: "REINGRESO AL PROGRAMA", tipo: "ESTADISTICA", cat: "Asistencia, Adherencia y Turnos", prot: "GPC ERC 2024", sev: "Informativa", frecuente: false },
    { no: "72", act: "RETIRO DE CATETER CENTRAL TEMPORAL", tipo: "ESTADISTICA", cat: "Procedimientos de Acceso Vascular", prot: "GSH-PT-004", sev: "Informativa", frecuente: false },
    { no: "57", act: "RETIRO DE UN CATÉTER CENTRAL PERMANENTE", tipo: "ESTADISTICA", cat: "Procedimientos de Acceso Vascular", prot: "GSH-PT-004", sev: "Informativa", frecuente: true },
    { no: "71", act: "SE APLICA DOSIS DE ERITROPOYETINA", tipo: "ESTADISTICA", cat: "Administración Farmacológica y Oxígeno", prot: "GPC Anemia 2026", sev: "Informativa", frecuente: true },
    { no: "59", act: "SE APLICA DOSIS DE HIERRO PARENTERAL", tipo: "ESTADISTICA", cat: "Administración Farmacológica y Oxígeno", prot: "GPC Anemia 2026", sev: "Informativa", frecuente: true },
    { no: "92", act: "SE APLICA DOSIS DE MIRCERA", tipo: "ESTADISTICA", cat: "Administración Farmacológica y Oxígeno", prot: "GPC Anemia 2026", sev: "Informativa", frecuente: true },
    { no: "20", act: "SE APLICA DOSIS DE VACUNA CONTRA HEPATITIS B", tipo: "ESTADISTICA", cat: "Administración Farmacológica y Oxígeno", prot: "GSH-PT-001 (VHB)", sev: "Informativa", frecuente: true },
    { no: "1",  act: "SE APLICA UN MEDICAMENTO QUE NO FUE ORDENADO", tipo: "EVENTO", cat: "Seguridad del Paciente y Sala", prot: "GSH-PT-003", sev: "Severa", frecuente: false },
    { no: "8",  act: "SE COAGULA EL FILTRO PERO NO SE CAMBIA Y SE TERMINA LA SESIÓN", tipo: "EVENTO", cat: "Coagulación del Circuito Extracorpóreo", prot: "GSH-PT-003", sev: "Moderada", frecuente: false },
    { no: "19", act: "SE COAGULA EL FILTRO Y SE CAMBIA PARA CONTINUAR LA SESIÓN", tipo: "EVENTO", cat: "Coagulación del Circuito Extracorpóreo", prot: "GSH-PT-003", sev: "Moderada", frecuente: false },
    { no: "15", act: "SE PONE UN FILTRO DIFERENTE AL ORDENADO", tipo: "EVENTO", cat: "Seguridad del Paciente y Sala", prot: "GSH-PT-001", sev: "Moderada", frecuente: true },
    { no: "81", act: "SE PRESENTA EVENTO ADVERSO", tipo: "EVENTO", cat: "Seguridad del Paciente y Sala", prot: "GSH-PT-003", sev: "Moderada", frecuente: false },
    { no: "2",  act: "SE PRESENTA VOMITO DURANTE LA SESIÓN", tipo: "EVENTO", cat: "Complicaciones Clínicas Intradiálisis", prot: "GSH-PT-003", sev: "Leve", frecuente: false },
    { no: "85", act: "SE PRESENTAN CALAMBRES DURANTE LA SESION", tipo: "EVENTO", cat: "Complicaciones Clínicas Intradiálisis", prot: "GSH-PT-003", sev: "Leve", frecuente: true },
    { no: "7",  act: "SE PRODUCE UNA EMBOLIA AÉREA DURANTE LA SESIÓN", tipo: "EVENTO", cat: "Eventos Centinela y Urgencias Vitales", prot: "GSH-PT-003", sev: "Severa", frecuente: false },
    { no: "3",  act: "SE REALIZA SESIÓN CON OXIGENOTERAPIA", tipo: "ESTADISTICA", cat: "Administración Farmacológica y Oxígeno", prot: "GFA-FO-OXI-001", sev: "Informativa", frecuente: true },
    { no: "70", act: "SE SOSPECHA REACCIÓN ALERGICA AL ESTERILIZANTE", tipo: "EVENTO", cat: "Tecnovigilancia y Circuito Extracorpóreo", prot: "GSH-PT-003", sev: "Severa", frecuente: false },
    { no: "18", act: "SE SOSPECHA UNA REACCION PIROGENA", tipo: "EVENTO", cat: "Tecnovigilancia y Circuito Extracorpóreo", prot: "GSH-PT-003", sev: "Severa", frecuente: true },
    { no: "68", act: "SESION DE HEMODIÁLISIS CON REUSO DE FILTRO", tipo: "ESTADISTICA", cat: "Modalidad de Sesión y Acceso Utilizado", prot: "GSH-PT-001", sev: "Informativa", frecuente: false },
    { no: "24", act: "SESIÓN POR CATÉTER PERMANENTE NUEVO", tipo: "ESTADISTICA", cat: "Modalidad de Sesión y Acceso Utilizado", prot: "GSH-PT-004", sev: "Informativa", frecuente: true },
    { no: "23", act: "SESION POR CATÉTER TEMPORAL ANTIGUO", tipo: "ESTADISTICA", cat: "Modalidad de Sesión y Acceso Utilizado", prot: "GSH-PT-004", sev: "Informativa", frecuente: false },
    { no: "22", act: "SESIÓN POR CATÉTER TEMPORAL NUEVO", tipo: "ESTADISTICA", cat: "Modalidad de Sesión y Acceso Utilizado", prot: "GSH-PT-004", sev: "Informativa", frecuente: false },
    { no: "32", act: "SESIÓN POR FISTULA CON INJERTO", tipo: "ESTADISTICA", cat: "Modalidad de Sesión y Acceso Utilizado", prot: "GSH-PT-004", sev: "Informativa", frecuente: false },
    { no: "31", act: "SESIÓN POR FISTULA SIN INJERTO", tipo: "ESTADISTICA", cat: "Modalidad de Sesión y Acceso Utilizado", prot: "GSH-PT-004", sev: "Informativa", frecuente: false },
    { no: "61", act: "SESION PROGRAMADA", tipo: "ESTADISTICA", cat: "Modalidad de Sesión y Acceso Utilizado", prot: "GSH-PT-001", sev: "Informativa", frecuente: false },
    { no: "42", act: "SESION REALIZADA EN PACIENTE HOSPITALIZADO EN UCI", tipo: "ESTADISTICA", cat: "Modalidad de Sesión y Acceso Utilizado", prot: "GPC IRA 2022", sev: "Informativa", frecuente: false },
    { no: "78", act: "TERMINA SESION CON FILTRO COAGULADO", tipo: "EVENTO", cat: "Coagulación del Circuito Extracorpóreo", prot: "GSH-PT-003", sev: "Moderada", frecuente: false },
    { no: "88", act: "TOMA DE LABORATORIOS DE CONTROL MENSUAL", tipo: "ESTADISTICA", cat: "Adecuación Dialítica y Paraclínicos", prot: "GPC ERC / TMO / Anemia", sev: "Informativa", frecuente: false }
  ];
  window.SIIS_ACTIVIDADES_HD = SIIS_ACTIVIDADES_HD;

  /* Enriquecer el catálogo EVENTOS de Hemodiálisis con todos los eventos clínicos SIIS para que aparezcan en el Turno del Día */
  if(typeof EVENTOS !== "undefined" && Array.isArray(EVENTOS)){
    SIIS_ACTIVIDADES_HD.filter(x => x.tipo === "EVENTO").forEach(x => {
      const label = "[SIIS " + x.no + "] " + x.act;
      if(!EVENTOS.includes(label) && !EVENTOS.includes(x.act)){
        EVENTOS.push(label);
      }
    });
  }

  /* ===================================================================================================
     3. LAS 5 GPC RECTORAS ADOPTADAS Y LOS 6 PROTOCOLOS DE HEMODIÁLISIS (EJE 01 GOBIERNO CLÍNICO)
     =================================================================================================== */
  const HD_GPC_ADOPTADAS = [
    {
      id: "GPC-ERC-2024",
      titulo: "GPC Enfermedad Renal Crónica - 2024 (KDIGO)",
      sub: "Documento rector para el diagnóstico, estadificación y manejo integral de la ERC",
      cls: "",
      entidad: "KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of CKD / Adopción Institucional POSMÉDICA",
      alcance: "Diagnóstico por TFGe (CKD-EPI 2021) y RAC, matriz de riesgo CGA (G1–G5D / A1–A3), ecuación predictiva KFRE a 2 y 5 años, preparación oportuna para TRR en G4/G5 y preservación de función renal residual (KRu) en G5D.",
      metas: [
        "Clasificación completa Causa + TFG (G1–G5D) + Albuminuria (A1–A3) en el 100 % de la cohorte",
        "Control de PA pre-diálisis < 140/90 mmHg (evitando hipotensión intradialítica PAS < 90 mmHg)",
        "Evaluación trimestral de Función Renal Residual (KRu por recolección interdialítica de 24–48 h)",
        "Valoración de idoneidad para trasplante renal en todo paciente prevalente e incidente < 80 años"
      ],
      decisiones: "Define criterios de ingreso a TRR dialítica (síntomas urémicos, sobrecarga refractaria, hiperpotasemia o acidosis no controladas), elección informada de modalidad (DP vs. HD) y metas de adecuación."
    },
    {
      id: "GPC-TMO-ERC",
      titulo: "GPC - Trastorno Mineral y Óseo en la ERC (TMO-ERC)",
      sub: "Directriz para el manejo de las alteraciones del metabolismo óseo y mineral, indicador clínico crítico en los pacientes de las 13 sillas de diálisis",
      cls: "tmo",
      entidad: "KDIGO CKD-MBD Guideline / Consenso Cuenta de Alto Costo (Indicadores dia_17, dia_27 y dia_29)",
      alcance: "Monitoreo conjunto y seriado de Fósforo sérico (mensual), Calcio total (mensual), PTH intacta (trimestral/semestral) y Fosfatasa Alcalina en los pacientes asignados a las 13 sillas de hemodiálisis.",
      metas: [
        "Fósforo sérico en meta: 2,5 a 5,5 mg/dL (Meta CAC dia_17: 2,5 a 6,0 mg/dL en ≥ 80 % de la cohorte)",
        "Calcio sérico total: 8,4 a 10,2 mg/dL · Evitar hipercalcemia > 10,5 mg/dL (CAC dia_29: 0 % con Ca > 10,5)",
        "PTH intacta: mantener entre 2 y 9 veces el límite superior normal (130 a 600 pg/mL · CAC dia_27)",
        "Restricción de quelantes a base de calcio si Ca > 10,0 mg/dL, calcificación vascular o PTH < 150 pg/mL"
      ],
      decisiones: "Las decisiones terapéuticas (dieta baja en fósforo inorgánico, sevelamer / carbonato de calcio, calcitriol / paricalcitol o cinacalcet) se toman sobre la tendencia conjunta de Ca + P + PTH, nunca sobre un valor aislado."
    },
    {
      id: "GPC-ANEMIA-2026",
      titulo: "GPC - Anemia en la ERC - 2026",
      sub: "Documento actualizado para el abordaje terapéutico de la anemia secundaria a la ERC",
      cls: "anemia",
      entidad: "KDIGO 2026 Clinical Practice Guideline for Anemia in CKD / Consenso CAC (dia_13)",
      alcance: "Tamizaje mensual de Hemoglobina/Hematocrito y trimestral de cinética de hierro (Ferritina sérica y Saturación de Transferrina TSAT), repleción de hierro IV intradiálisis y uso seguro de Agentes Estimulantes de la Eritropoyesis (AEE).",
      metas: [
        "Hemoglobina en pacientes en HD: ≥ 10,0 g/dL (Meta CAC dia_13 ≥ 60 %; objetivo clínico con AEE: 10,0 a 11,5 g/dL)",
        "Límite de seguridad con AEE: No superar Hb > 13,0 g/dL por riesgo cardiovascular y trombosis de FAV/injerto",
        "Hierro parenteral (Cód. SIIS 59): indicar si TSAT ≤ 30 % y Ferritina ≤ 500 ng/mL; suspender si Ferritina > 700 ng/mL o TSAT ≥ 40 %",
        "Trazabilidad estricta de dosis de Eritropoyetina (Cód. SIIS 71) y Mircera (Cód. SIIS 92) contra sesiones reales"
      ],
      decisiones: "Antes de escalar dosis de EPO o Mircera, descartar ferropenia, infección/inflamación oculta (PCR/acceso CVC), hiperparatiroidismo severo, pérdidas sanguíneas por coagulación del circuito (Cód. SIIS 21/78) o subdiálisis (Kt/V < 1,2)."
    },
    {
      id: "GPC-NEFRODIAB-2025",
      titulo: "GPC - Nefropatía Diabética - 2025",
      sub: "Específica para el control y progresión de la principal etiología de la enfermedad renal, pilar del programa de nefroprotección",
      cls: "dm",
      entidad: "KDIGO Diabetes Management in CKD / ADA-KDIGO Consensus 2025",
      alcance: "Abordaje integral del paciente diabético desde nefroprotección (IECA/ARA-II, iSGLT2, finerenona, estatinas) hasta el control glucémico seguro en hemodiálisis crónicas para prevenir hipoglucemia intradialítica y eventos cardiovasculares.",
      metas: [
        "HbA1c trimestral individualizada en diálisis (~7,0 % a 7,5 % según comorbilidad y riesgo de hipoglucemia)",
        "Glucometría intradiálisis en rango seguro: 80 a 180 mg/dL en ≥ 70 % de las sesiones de pacientes con DM",
        "Ajuste de dosis de insulina el día de diálisis (-20 % a -25 % pre-sesión según glucometría basal)",
        "Vigilancia anual de pie diabético, fondo de ojo y perfil lipídico con estatina de alta intensidad"
      ],
      decisiones: "Alerta automática en Turno del Día si glucometría < 70 mg/dL (protocolo dextrosa IV) o > 250 mg/dL."
    },
    {
      id: "GPC-IRA-2022",
      titulo: "GPC - Injuria Renal Aguda (IRA) - 2022",
      sub: "Orientada al diagnóstico y manejo del fracaso renal agudo y soporte dialítico agudo",
      cls: "ira",
      entidad: "KDIGO AKI Guideline / Guía Colombiana de Injuria Renal Aguda 2022",
      alcance: "Detección precoz de IRA (aumento de Cr ≥ 0,3 mg/dL en 48 h o ≥ 1,5 veces el basal en 7 días, o diuresis < 0,5 mL/kg/h por 6 h), manejo de soporte en UCI (Cód. SIIS 42) y seguimiento de recuperación renal.",
      metas: [
        "Indicación oportuna de TRR urgente ante hiperpotasemia > 6,5 mEq/L refractaria, acidosis pH < 7,15, edema pulmonar o uremia",
        "Prescripción inicial gradual (2–3 h, Qb 150–200 mL/min, baño isotónico) para prevenir síndrome de desequilibrio",
        "Vigilancia de diuresis pre-sesión y creatinina pre-diálisis para identificar recuperación de función renal y retiro oportuno de CVC temporal (Cód. SIIS 72)"
      ],
      decisiones: "Todo paciente que ingresa por urgencia dialítica sin ERC G5 previa documentada entra en protocolo de vigilancia de recuperación renal durante los primeros 90 días."
    }
  ];

  const HD_PROTOCOLOS = [
    {
      codigo: "Manual UKM / Kt/V",
      nombre: "Formulación de la hemodiálisis según cinética de la urea",
      version: "v2.0 · 2026",
      proceso: "HD-P02 · Prescripción y Adecuación Dialítica",
      siis: ["69 (Realización de Kt/V)", "11 (Pierde < 80% del UF programado)", "80 (No completa la VSD)", "88 (Toma de laboratorios mensual)"],
      resumen: "Estandariza la prescripción individualizada de hemodiálisis mediante el modelo cinético de la urea de Daugirdas de 2ª generación (spKt/V) y el monitoreo de conductancia iónica en línea (OCM), integrando el aclaramiento de urea residual (KRu).",
      pasos: [
        "Fórmula Daugirdas II: spKt/V = -ln(R - 0.008 × t) + (4 - 3.5 × R) × (UF / W), donde R = BUN post / BUN pre, t = duración efectiva en horas, UF = ultrafiltración en litros y W = peso post-diálisis en kg.",
        "Toma estandarizada de BUN post-diálisis (método de flujo lento): al finalizar la sesión, reducir Qb a 50–100 mL/min durante 15–30 segundos y detener Qd/UF antes de extraer la muestra de la línea arterial para evitar recirculación cardiopulmonar o del acceso.",
        "Metas clínicas: spKt/V mínimo ≥ 1,2 por sesión (3 veces/semana), objetivo institucional ≥ 1,4 y PRU (URR) ≥ 65 %. Tiempo efectivo mínimo ≥ 240 minutos (CAC dia_20).",
        "Control de volumen y tasa de ultrafiltración (UFR): mantener ganancia interdialítica (GID) < 4 % del peso seco y UFR ≤ 10–13 mL/kg/h para prevenir aturdimiento miocárdico e hipotensión (Cód. SIIS 4)."
      ]
    },
    {
      codigo: "GSH-PT-001 / GSH-PT-002",
      nombre: "Conexión y desconexión en hemodiálisis",
      version: "v3.1 · 2026",
      proceso: "HD-P03 · Operación Diaria de Sala",
      siis: ["61 (Sesión programada)", "31/32 (Sesión por FAV/Injerto)", "22/23/24 (Sesión por CVC)", "5 (Alarma técnica)", "66/67 (Línea imperfecta)"],
      resumen: "Define la secuencia técnica y de bioseguridad para la conexión (GSH-PT-001) y desconexión (GSH-PT-002) del paciente al circuito extracorpóreo, diferenciando fístula/injerto y catéter venoso central.",
      pasos: [
        "Pre-conexión: verificar calidad del agua tratada (conductividad y cloro total), test de alarma de la máquina, integridad de líneas/filtro (Cód. SIIS 65, 66, 67), peso pre-diálisis, PA sentada/de pie, temperatura y evaluación física del acceso vascular.",
        "Conexión de FAV/Injerto (GSH-PT-001): lavado del brazo con jabón antiséptico, antisepsia con clorhexidina alcohólica > 0,5 % (tiempo de contacto 60 s), punción con técnica de escalera u ojal, fijación en mariposa/puente y verificación de presiones arterial/venosa.",
        "Conexión de CVC (GSH-PT-001): técnica estéril a cuatro manos o con campo fenestrado, mascarilla quirúrgica en paciente y enfermero, fricción de puertos durante 15–30 s con clorhexidina alcohólica al 2 %, aspiración del sello de heparina y conexión sin contacto (no-touch).",
        "Desconexión segura (GSH-PT-002): retorno del circuito con solución salina isotónica (evitando embolia aérea Cód. SIIS 7), hemostasia de FAV con presión digital suave (10–15 min sin ocluir el thrill), o sellado de ramas de CVC según volumen exacto impreso en cada lumen; control de PA y peso post-diálisis."
      ]
    },
    {
      codigo: "GSH-PT-003",
      nombre: "Complicaciones en hemodiálisis",
      version: "v3.0 · 2026",
      proceso: "HD-P03 · Operación Diaria de Sala y Seguridad del Paciente",
      siis: ["4 (Hipotensión 80/60)", "17 (Hipertensión 170/105)", "85 (Calambres)", "14 (Cefalea)", "2 (Vómito)", "7 (Embolia aérea)", "70 (Reacción esterilizante)", "18 (Reacción pirógena)", "13 (Paro CR)", "9 (Muerte en sesión)"],
      resumen: "Protocolo de respuesta clínica inmediata, escalamiento médico y registro obligatorio en SIIS ante eventos adversos y complicaciones agudas intradiálisis.",
      pasos: [
        "Hipotensión intradialítica sintomática (PA ≤ 80/60 o caída PAS ≥ 20 mmHg · Cód. SIIS 4): colocar en posición de Trendelenburg, suspender temporalmente la UF, administrar bolo de 100–200 mL de SSN 0,9 %, iniciar oxigenoterapia si SatO2 < 92 % (Cód. SIIS 3/64) y reevaluar peso seco.",
        "Calambres musculares (Cód. SIIS 85): disminuir tasa de UF, bolo de SSN 0,9 %, masaje local y revisión del perfil de sodio y peso seco.",
        "Hipertensión intradiálisis (PA ≥ 170/105 · Cód. SIIS 17): verificar adherencia a antihipertensivos, ajustar UF si hay sobrecarga hídrica y administrar antihipertensivo oral según orden médica.",
        "Sospecha de Reacción Alérgica al Esterilizante (Cód. SIIS 70) o Reacción Pirógena (Cód. SIIS 18): suspender diálisis inmediatamente; en reacción anafiláctica tipo A NO retornar la sangre del circuito; tomar hemocultivos y muestra de líquido de diálisis si hay escalofríos/fiebre.",
        "Embolia Aérea (Cód. SIIS 7): pinzar de inmediato la línea venosa, detener bomba de sangre, colocar al paciente en decúbito lateral izquierdo con Trendelenburg (maniobra de Durant), administrar oxígeno al 100 % con máscara reservorio y activar código azul (Cód. SIIS 13)."
      ]
    },
    {
      codigo: "GSH-PT-004",
      nombre: "Accesos vasculares, cuidado y tratamiento de la infección del acceso",
      version: "v3.2 · 2026",
      proceso: "HD-P04 · Gestión Integral del Acceso Vascular e IAAS",
      siis: ["33 (Canulación FAV 1ª vez)", "82 (Construcción FAV)", "6 (Sangrado/hematoma FAV)", "16 (Trombosis FAV)", "10 (Infección FAV)", "26/27/29 (CVC infectado orificio/túnel)", "28/30 (Bacteriemia CVC)", "57/72 (Retiro CVC)", "86 (Manejo antibiótico)"],
      resumen: "Establece la ruta de preservación vascular («Fistula First»), cuidado de maduración y primera punción de FAV, vigilancia diaria del sitio de salida/túnel de CVC y manejo diagnóstico-terapéutico de infecciones del acceso.",
      pasos: [
        "Primera canulación de FAV (Cód. SIIS 33): verificar criterios de maduración (Regla de los 6: flujo > 600 mL/min, diámetro ≥ 6 mm, profundidad ≤ 6 mm), iniciar con agujas 17G por enfermero experto y flujo Qb inicial de 200–250 mL/min.",
        "Prevención y detección de trombosis de FAV (Cód. SIIS 16) y hematomas (Cód. SIIS 6): auscultación/palpación de frémito (thrill) en cada sesión; ante hematoma en FAV nueva, reposo del acceso por 48–72 h y aplicación alterna frío/calor.",
        "Infección de orificio de salida o túnel de CVC (Cód. SIIS 26, 27, 29): toma de cultivo de secreción antes de iniciar antibiótico; si hay infección del túnel (Cód. 27), indicar retiro del catéter (Cód. 57/72) y antibioticoterapia sistémica.",
        "Bacteriemia asociada a CVC (ITS-CVC · Cód. SIIS 28 y 30): tomar hemocultivos pareados (rama de catéter + vena periférica) antes de la primera dosis de antimicrobiano (Cód. SIIS 86); iniciar esquema empírico ajustado a función renal (Vancomicina + Ceftazidima/Gentamicina), registrar en módulo IAAS/PROA y retirar CVC de inmediato ante sepsis grave, inestabilidad, S. aureus, Pseudomonas o Candida."
      ]
    },
    {
      codigo: "GSH-PT-001 (VHB)",
      nombre: "Manejo de pacientes con Hepatitis B: vacunación, bioseguridad, prevención de infección cruzada y entrenamiento",
      version: "v2.4 · 2026",
      proceso: "HD-P01 / UR-A03 · Inmunoprotección y Bioseguridad VHB",
      siis: ["20 (Se aplica dosis de vacuna contra Hepatitis B)", "88 (Toma de laboratorios de control mensual / serologías)"],
      resumen: "Garantiza cero seroconversiones por Virus de Hepatitis B (VHB) en las 13 sillas de la unidad renal mediante vacunación intensiva, monitoreo serológico, segregación técnica estricta y capacitación continua del talento humano.",
      pasos: [
        "Tamizaje serológico al ingreso y periódico: solicitar HBsAg, Anti-HBc total y Anti-HBs cuantitativo a todo paciente antes de su primera sesión en sala; repetir HBsAg semestralmente en no inmunes y Anti-HBs anualmente en respondedores.",
        "Esquema de vacunación reforzado en ERC/HD (Cód. SIIS 20): administrar 4 dosis dobles (40 µg IM en deltoides) en los meses 0, 1, 2 y 6 (Meta CAC dia_26: ≥ 60 % con Anti-HBs ≥ 10 mUI/mL). Medir Anti-HBs 1 a 2 meses después de la última dosis; si < 10 mUI/mL, aplicar segunda serie completa.",
        "Prevención de infección cruzada en HBsAg reactivo: asignación de Silla y Máquina Exclusiva de Aislamiento (Silla 13 / Máquina exclusiva HBsAg+), prohibición absoluta de reuso de dializadores en pacientes HBsAg+, insumos y tensiómetro exclusivos y personal de enfermería con inmunidad comprobada (Anti-HBs ≥ 10 mUI/mL) que no atienda simultáneamente pacientes susceptibles.",
        "Entrenamiento y seguimiento a riesgos del personal: verificación anual de títulos Anti-HBs del 100 % del personal asistencial y de servicios generales, y simulacros semestrales de bioseguridad."
      ]
    },
    {
      codigo: "SG-SST Bioseguridad",
      nombre: "Bioseguridad en unidad renal",
      version: "v2.2 · 2026",
      proceso: "UR-A03 · Seguridad y Salud en el Trabajo / Control de Infecciones",
      siis: ["12 (Accidente en sala)", "73 (Paciente come en sala)", "74 (Ropa no apropiada)", "76 (Paciente agresivo)", "79 (Artículos no permitidos)", "84 (Malas condiciones de higiene)"],
      resumen: "Lineamientos integrales de precaución estándar, control de riesgo biológico, normas de convivencia e higiene de pacientes en sala, desinfección ambiental/de máquinas y gestión de residuos hospitalarios (PGIRASA).",
      pasos: [
        "Barreras de protección personal (EPP): uso permanente de bata antifluidos, protector ocular/careta facial, mascarilla quirúrgica y guantes durante conexión, desconexión, manipulación de líneas o muestras biológicas.",
        "Normas de bioseguridad y convivencia del paciente en sala (Control estadístico SIIS): verificación al ingreso de condiciones de higiene personal y lavado del brazo de FAV (Cód. SIIS 84), uso de ropa cómoda y descubierta en el acceso (Cód. SIIS 74), restricción de ingreso de paquetes/artículos no permitidos (Cód. SIIS 79), prohibición de consumo de alimentos durante la sesión por riesgo de broncoaspiración e hipotensión esplácnica (Cód. SIIS 73) y protocolo de trato digno/prevención de agresiones (Cód. SIIS 76).",
        "Desinfección entre turnos y limpieza terminal: desinfección externa del puesto y sillón tras cada sesión, desinfección termoquímica interna de las 13 máquinas al cierre del día y limpieza terminal documentada cada 15 días."
      ]
    }
  ];

  /* Todos los procesos de la Unidad Renal (Estratégicos, Misionales HD-P01..08 y de Apoyo UR-A01..04) */
  const UR_PROCESOS_COMPLETOS = [
    { cod: "UR-E01", tipo: "Estratégico", nom: "Gobierno Clínico, Adherencia a GPC (KDIGO) y Comités", resp: "Dirección Médica / Nefrología", gpc: "5 GPC Rectoras + Manual UKM", ctrl: "Auditoría trimestral de adherencia a GPC ≥ 90 % y actas de comité al día", go: ["hd","e1","hd_gpc"] },
    { cod: "UR-E02", tipo: "Estratégico", nom: "Gestión Contractual, Tecnologías CUPS y Nota Técnica por EPS", resp: "Coordinación Unidad Renal / Facturación", gpc: "7 Contratos (3.336 tecnologías)", ctrl: "100 % de paquetes conciliados sin glosa por sesiones mínimas (8–10 ses/mes)", go: ["hd","e6","rep"] },
    { cod: "HD-P01", tipo: "Misional", nom: "Ingreso, Estadificación ERC, Serologías y Vacunación VHB", resp: "Nefrología / Enfermería Jefe HD", gpc: "GPC ERC 2024 · GSH-PT-001 (VHB)", ctrl: "Tamizaje HBsAg/Anti-HBs/VHC/VIH al ingreso y silla asignada en las 13 sillas", go: ["hd","e2","hd_car"] },
    { cod: "HD-P02", tipo: "Misional", nom: "Prescripción Nefrológica, Cinética de la Urea (UKM / Kt/V) y FRR", resp: "Médica Nefróloga", gpc: "Manual UKM / Kt/V · GPC ERC 2024", ctrl: "spKt/V ≥ 1,2 (meta ≥ 1,4), duración ≥ 240 min y valoración mensual con KRu", go: ["hd","e3","val"] },
    { cod: "HD-P03", tipo: "Misional", nom: "Operación Diaria de Sala: Conexión, Monitoreo, Complicaciones y Desconexión", resp: "Enfermería Profesional y Auxiliar HD", gpc: "GSH-PT-001 / GSH-PT-002 / GSH-PT-003", ctrl: "Verificación pre-turno de agua/desinfección y registro SIIS de sesiones/eventos", go: ["hd","e3","turno"] },
    { cod: "HD-P04", tipo: "Misional", nom: "Gestión Integral del Acceso Vascular, Conversión a FAV y Vigilancia IAAS", resp: "Nefrología / Cirugía Vascular / Enfermería", gpc: "GSH-PT-004 · Indicadores dia_10 y dia_33", ctrl: "Prevalencia CVC < 10–20 % y tasa de ITS-CVC < 1,5 por 1.000 días-catéter", go: ["hd","e2","acc"] },
    { cod: "HD-P05", tipo: "Misional", nom: "Vigilancia Paraclínica Mensual (Anemia 2026 y TMO-ERC)", resp: "Nefrología / Laboratorio Clínico", gpc: "GPC Anemia 2026 · GPC TMO-ERC", ctrl: "Hb ≥ 10 g/dL (≥ 60 %), Fósforo 2,5–6,0 mg/dL (≥ 80 %), PTH 130–600 pg/mL", go: ["hd","e4","lab"] },
    { cod: "HD-P06", tipo: "Misional", nom: "Atención Interdisciplinaria (Nutrición, Psicología, T. Social) y Educación", resp: "Equipo Multidisciplinario Unidad Renal", gpc: "GPC ERC 2024 · Cód. SIIS 93", ctrl: "Cumplimiento del calendario anual de 12 meses y Albúmina ≥ 4,0 g/dL", go: ["hd","e2","hd_cal12"] },
    { cod: "HD-P07", tipo: "Misional", nom: "Evaluación de Idoneidad y Ruta a Lista de Espera de Trasplante Renal", resp: "Nefrología / Trabajo Social", gpc: "GPC ERC 2024 · Indicador CAC dia_21", ctrl: "100 % de pacientes < 80 años con concepto de idoneidad y carpeta de estudios", go: ["hd","e2","tx"] },
    { cod: "HD-P08", tipo: "Misional", nom: "Adherencia, Búsqueda Activa de Inasistentes y Transición de Modalidad", resp: "Trabajo Social / Enfermería HD", gpc: "GSH-PT-001 · Cód. SIIS 36, 37, 38", ctrl: "Inasistencia sin aviso < 3 % y 100 % de inasistentes contactados en < 24 h", go: ["hd","e2","hd_evstat"] },
    { cod: "UR-A01", tipo: "Apoyo Clínico", nom: "Gestión Farmacéutica Intradiálisis (EPO, Hierro, Mircera) y Control de Oxígeno", resp: "Químico Farmacéutico / Enfermería HD", gpc: "GPC Anemia 2026 · Formato GFA-FO-OXI-001", ctrl: "Conciliación 100 % de ampollas vs. sesiones y bitácora de oxígeno al día", go: ["hd","e5","hd_oxi"] },
    { cod: "UR-A02", tipo: "Apoyo Técnico", nom: "Calidad de Agua Tratada (Ósmosis Inversa) y Tecnovigilancia de 13 Máquinas", resp: "Ingeniería Biomédica / Enfermería HD", gpc: "Res. 3100/2019 · Cód. SIIS 5, 65, 66, 67", ctrl: "Conductividad < 15 µS/cm, cloro total < 0,1 mg/L diario y mantenimiento preventivo", go: ["hd","e3","lim"] },
    { cod: "UR-A03", tipo: "Seguridad", nom: "Bioseguridad (SG-SST), Limpieza Terminal Quincenal, IAAS y PROA", resp: "Calidad / Comité IAAS-PROA / Ambiental", gpc: "SG-SST Bioseguridad · GSH-PT-004", ctrl: "Higiene de manos ≥ 90 %, desinfección de puesto 100 % y terminal cada 15 días", go: ["hd","e3","lim"] },
    { cod: "UR-A04", tipo: "Información", nom: "Interoperabilidad SIIS, Auditoría Concurrente Pre-SISCAC y Reportes CAC", resp: "Sistemas de Información / Auditoría Médica", gpc: "Res. 2463/2014 · Consenso CAC 2026", ctrl: "0 campos bloqueantes en SISCAC y sincronización estructurada de los 64 códigos SIIS", go: ["hd","e7","hd_aud"] }
  ];

  /* ===================================================================================================
     4. INICIALIZACIÓN DE DATOS DEMO PARA LOS 64 CÓDIGOS SIIS Y BITÁCORA DE OXÍGENO MEDICINAL
     =================================================================================================== */
  function v30EnsureDemoData(){
    if(!hdOn()) return;
    if(!ST.demo) return; /* v3.1: sobre la base real no se siembran eventos SIIS ni registros de oxígeno ficticios */
    ensureIdx();
    if(V30.siisActs.length === 0){
      const T = TODAY();
      const pacList = pacs().filter(p => activeAt(p, ST.corte));
      const pId = idx => (pacList[idx % Math.max(1, pacList.length)] || { ID: "P001", EPS: "NUEVA EPS", Turno: "L-M-V Mañana", Puesto: 1 });
      const seedActs = [
        { no: "4",  fecha: iso(addDays(T, -2)), pid: pId(0).ID, turno: pId(0).Turno, silla: pId(0).Puesto || 1, sev: "Moderada", nota: "PA 78/52 mmHg en hora 3 de sesión; bolo 150 mL SSN 0.9%, posición Trendelenburg y suspensión temporal de UF. Recupera a 112/68 mmHg.", estado: "Cerrado" },
        { no: "17", fecha: iso(addDays(T, -3)), pid: pId(1).ID, turno: pId(1).Turno, silla: pId(1).Puesto || 2, sev: "Moderada", nota: "PA 176/108 mmHg intradiálisis; se verifica omisión de losartán matutino, se ajusta UF y se administra antihipertensivo oral.", estado: "Cerrado" },
        { no: "85", fecha: iso(addDays(T, -4)), pid: pId(2).ID, turno: pId(2).Turno, silla: pId(2).Puesto || 3, sev: "Leve", nota: "Calambres en miembros inferiores al final de la hora 3; se reduce tasa de UF y se reevalúa peso seco.", estado: "Cerrado" },
        { no: "14", fecha: iso(addDays(T, -5)), pid: pId(3).ID, turno: pId(3).Turno, silla: pId(3).Puesto || 4, sev: "Leve", nota: "Cefalea frontal leve durante la última hora de terapia; cede con acetaminofén 500 mg VO y reducción de Qd.", estado: "Cerrado" },
        { no: "26", fecha: iso(addDays(T, -6)), pid: pId(4).ID, turno: pId(4).Turno, silla: pId(4).Puesto || 5, sev: "Moderada", nota: "Eritema leve y exudado seroso en orificio de salida de CVC tunelizado; se toma cultivo de secreción y se inicia curación con mupirocina.", estado: "En seguimiento" },
        { no: "28", fecha: iso(addDays(T, -12)), pid: "P005", turno: "L-M-V Mañana", silla: 5, sev: "Severa", nota: "Bacteriemia asociada a catéter permanente confirmada por hemocultivos pareados; manejo guiado por PROA.", estado: "Cerrado" },
        { no: "21", fecha: iso(addDays(T, -7)), pid: pId(5).ID, turno: pId(5).Turno, silla: pId(5).Puesto || 6, sev: "Moderada", nota: "Coagulación parcial de cámara venosa; lavado con SSN y ajuste de dosis de heparina intradiálisis.", estado: "Cerrado" },
        { no: "5",  fecha: iso(addDays(T, -8)), pid: pId(6).ID, turno: pId(6).Turno, silla: pId(6).Puesto || 7, sev: "Leve", nota: "Alarma técnica de conductividad transitoria en máquina M07; verificación por biomédica sin novedad.", estado: "Cerrado" },
        { no: "33", fecha: iso(addDays(T, -9)), pid: pId(7).ID, turno: pId(7).Turno, silla: pId(7).Puesto || 8, sev: "Informativa", nota: "Primera punción exitosa de FAV radiocefálica izquierda madura con aguja 17G, Qb 220 mL/min sin hematoma.", estado: "Cerrado" },
        { no: "93", fecha: iso(addDays(T, -10)), pid: pId(8).ID, turno: "L-M-V Mañana", silla: 1, sev: "Informativa", nota: "Educación grupal en sala por enfermería sobre control de líquidos, potasio y fósforo en la dieta (12 asistentes).", estado: "Cerrado" },
        { no: "73", fecha: iso(addDays(T, -11)), pid: pId(9).ID, turno: pId(9).Turno, silla: pId(9).Puesto || 9, sev: "Informativa", nota: "Paciente intenta ingerir alimentos durante sesión; se educa sobre riesgo de hipotensión esplácnica y broncoaspiración.", estado: "Cerrado" },
        { no: "6",  fecha: iso(addDays(T, -14)), pid: pId(10).ID, turno: pId(10).Turno, silla: pId(10).Puesto || 10, sev: "Moderada", nota: "Equimosis peripunción en FAV; hemostasia prolongada 15 min y educación en cuidado domiciliario.", estado: "Cerrado" }
      ];
      seedActs.forEach((s, idx) => {
        const def = SIIS_ACTIVIDADES_HD.find(a => a.no === s.no) || SIIS_ACTIVIDADES_HD[0];
        const p = IDX.pac.get(s.pid) || pId(idx);
        V30.siisActs.push({
          id: "SIIS-" + String(idx + 1).padStart(4, "0"),
          no: def.no,
          act: def.act,
          tipo: def.tipo,
          cat: def.cat,
          prot: def.prot,
          fecha: s.fecha,
          pid: p.ID,
          pacNom: nombre(p),
          eps: p.EPS || "NUEVA EPS",
          turno: s.turno || p.Turno || "L-M-V Mañana",
          silla: s.silla || p.Puesto || 1,
          sev: s.sev,
          nota: s.nota,
          estado: s.estado,
          usuario: "Enf. Marcela Rosero"
        });
      });
    }

    if(V30.oxiLog.length === 0){
      const T = TODAY();
      const pacList = pacs().filter(p => activeAt(p, ST.corte));
      const p0 = pacList[0] || { ID: "P001", EPS: "NUEVA EPS", Turno: "L-M-V Mañana", Puesto: 1 };
      const p1 = pacList[1] || { ID: "P002", EPS: "MALLAMAS", Turno: "L-M-V Tarde", Puesto: 4 };
      const p2 = pacList[2] || { ID: "P003", EPS: "FOMAG", Turno: "M-J-S Mañana", Puesto: 7 };
      V30.oxiLog.push(
        { id: "OXI-0001", fecha: iso(addDays(T, -5)), turno: p0.Turno || "L-M-V Mañana", silla: p0.Puesto || 1, pid: p0.ID, pacNom: nombre(p0), eps: p0.EPS || "NUEVA EPS", codSiis: "3 · SE REALIZA SESIÓN CON OXIGENOTERAPIA", indicacion: "Hipoxemia intradiálisis (SatO2 < 90%) + sobrecarga hídrica", disp: "Cánula nasal", flujo: 2, hIni: "08:00", hFin: "11:00", min: 180, satPre: 88, satPost: 96, cilindro: "CIL-OXI-01", lote: "OXM-2026-09", vence: "2027-09-30", psiIni: 2050, psiFin: 1820, litros: 360, m3: 0.36, resp: "Enf. Marcela Rosero" },
        { id: "OXI-0002", fecha: iso(addDays(T, -3)), turno: p1.Turno || "L-M-V Tarde", silla: p1.Puesto || 4, pid: p1.ID, pacNom: nombre(p1), eps: p1.EPS || "MALLAMAS", codSiis: "64 · POR ORDEN MEDICA SE ADMINISTRA OXÍGENO", indicacion: "Hipotensión sintomática intradiálisis (80/60 mmHg · Cód. 4)", disp: "Cánula nasal", flujo: 3, hIni: "14:30", hFin: "16:00", min: 90, satPre: 89, satPost: 97, cilindro: "CIL-OXI-02", lote: "OXM-2026-10", vence: "2027-10-31", psiIni: 1920, psiFin: 1750, litros: 270, m3: 0.27, resp: "Enf. Paola R." },
        { id: "OXI-0003", fecha: iso(addDays(T, -1)), turno: p2.Turno || "M-J-S Mañana", silla: p2.Puesto || 7, pid: p2.ID, pacNom: nombre(p2), eps: p2.EPS || "FOMAG", codSiis: "3 · SE REALIZA SESIÓN CON OXIGENOTERAPIA", indicacion: "EPOC concomitante + orden médica permanente en sesión", disp: "Cánula nasal", flujo: 2, hIni: "07:30", hFin: "11:30", min: 240, satPre: 87, satPost: 95, cilindro: "CIL-OXI-01", lote: "OXM-2026-09", vence: "2027-09-30", psiIni: 1820, psiFin: 1510, litros: 480, m3: 0.48, resp: "Enf. Marcela Rosero" }
      );
    }
  }

  /* ===================================================================================================
     5. REESTRUCTURACIÓN DE SUBPESTAÑAS DE HEMODIÁLISIS (EJE 01, EJE 02, EJE 05, EJE 06)
     =================================================================================================== */
  if(typeof V12 !== "undefined" && V12.map){
    /* Restaurar los 8 Ejes Maestros de v1.1 (2).html (incluyendo Eje 08 · Producción, Metas y Facturación EPS) */
    V12.axes = [
      ["e1", "01", "Gobierno, Procesos y Ruta"],
      ["e2", "02", "Cohorte, Riesgo y Estadísticas"],
      ["e3", "03", "Operación, Turnos e HC GPC"],
      ["e4", "04", "Paraclínicos y Vacunación"],
      ["e5", "05", "Gestión Farmacéutica y Oxígeno"],
      ["e6", "06", "Indicadores CAC y Evolución"],
      ["e7", "07", "Auditoría Concurrente y PAMEC"],
      ["e8", "08", "Producción, Metas y Facturación"]
    ];
    if(typeof V10_AXES !== "undefined"){
      V10_AXES.length = 0;
      V12.axes.forEach(a => V10_AXES.push(a));
    }

    V12.map.hd = {
      e1: [
        ["hd_gpc",  "Gobierno Clínico: GPC Adoptadas (5) y Protocolos (6)"],
        ["hd_ruta", "Ruta del Paciente 360° e Infografía de las 13 Sillas"],
        ["hd_proc", "Procesos y Actividades Unidad Renal (14 Procesos + SIPOC)"],
        ["hd_plan", "Plan de Trabajo y Capacitaciones"],
        ["doc",     "Documentos y Guías Institucionales"],
        ["ref",     "Parámetros y Referencia Normativa (13 Sillas)"]
      ],
      e2: [
        ["hd_dash",   "Dashboard Gerencial HD y Semáforo DOPPS (Excel Integrado)"],
        ["hd_car",    "Cohorte Operativa (13 Sillas × 4 Turnos) y Caracterización"],
        ["pac",       "Pacientes (Maestro Único, Ficha 360° e IDs Jubilados)"],
        ["sem",       "Calidad de Diálisis y Semáforo de Riesgo"],
        ["acc",       "Accesos Vasculares, Ruta Fistula First y Dispositivos"],
        ["tx",        "Seguimiento de Trasplante Renal y Lista de Espera"],
        ["alert",     "Alertas Clínicas y Búsqueda Activa"],
        ["hd_evstat", "Eventos Clínicos, Estadísticas SIIS (64 Códigos) y Analítica"],
        ["hd_cal12",  "Calendario Clínico Estandarizado (12 Meses)"]
      ],
      e3: [
        ["turno",     "Turno del Día (Agua/Desinfección + Asistencias 13 Sillas)"],
        ["val",       "Valoración Mensual (HC GPC + KRu/KtV Total + Nota SIIS)"],
        ["hd_precon", "Preconsulta Enfermería y Citas Multidisciplinarias"],
        ["hd_qx",     "Procedimientos Quirúrgicos, Catéteres y Desinfección"],
        ["lim",       "Limpieza y Desinfección de Sala y Máquinas"]
      ],
      e4: [
        ["lab",     "Paraclínicos Mensuales, Cargue Excel y Solicitud"],
        ["hd_glab", "Gráficas Individuales de Evolución Lab (Paciente vs. Unidad)"],
        ["vac",     "Vacunación Hepatitis B (Esquema 40 µg y Anti-HBs)"]
      ],
      e5: [
        ["hd_anti", "Gestión Farmacéutica (Intradiálisis EPO/Hierro + Ambulatoria)"],
        ["hd_oxi",  "Formato de Control de Oxígeno Medicinal (GFA-FO-OXI-001)"],
        ["inf",     "Infecciones Asociadas a Acceso (IAAS) y PROA"]
      ],
      e6: [
        ["ind", "Indicadores CAC 2026 (Evolución, Metas y Comparativa por EPS)"],
        ["rep", "Reportes Regulatorios, Matrices CAC e Interoperabilidad"],
        ["cal", "Calidad y Completitud del Dato"]
      ],
      e7: [
        ["hd_aud",   "Auditoría Concurrente de HC y SISCAC"],
        ["hd_pamec", "Planes de Mejora PAMEC del Programa"],
        ["hd_lib",   "Actas de Liberación de Reportes"]
      ],
      e8: [
        ["hd_conc", "Conciliación y Facturación Mensual por Contrato EPS"],
        ["hd_meta", "Producción del Mes vs. Meta (Nota Técnica)"]
      ]
    };

    if(V12.map.dp)    V12.map.dp.e8    = [["dp_meta", "Paquetes mensuales DP y valoraciones facturables vs. Meta"]];
    if(V12.map.vih)   V12.map.vih.e8   = [["fac", "Facturación mensual por paciente atendido vs. Meta"]];
    if(V12.map.nefro) V12.map.nefro.e8 = [["nefro_meta", "Consultas y paquetes de nefroprotección vs. Meta"]];
    if(V12.map.ce)    V12.map.ce.e8    = [["ce_meta", "Consultas efectivas atendidas por especialidad vs. Meta"]];
  }

  /* ===================================================================================================
     6. CINTURÓN EJECUTIVO DE HEMODIÁLISIS Y PUENTE DE INTERCONEXIÓN CON SIIS / CONTRATOS EPS
     =================================================================================================== */
  function v30RefreshHdBookbar(){
    const bb = document.getElementById("bookbar");
    if(!bb) return;
    if(!hdOn()){
      bb.hidden = false;
      return;
    }
    ensureIdx();
    v30EnsureDemoData();
    const act = pacs().filter(p => activeAt(p, ST.corte));
    const ms = monthStart(ST.corte);
    let sesMes = 0;
    act.forEach(p => { sesMes += sesIn(p, ms, ST.corte, "Realizada").length; });
    const nFav = act.filter(p => accessAt(p, ST.corte) === "FAV").length;
    const pctFav = act.length ? Math.round(nFav / act.length * 100) : 0;

    let hdr = document.getElementById("v30-hd-execbelt");
    if(!hdr){
      hdr = document.createElement("div");
      hdr.id = "v30-hd-execbelt";
      bb.insertBefore(hdr, bb.firstChild);
    }
    /* Ocultar la primera fila redundante de botones de archivo cuando ya estamos dentro del portal */
    const firstCopy = bb.querySelector(":scope > .copyrow");
    if(firstCopy && PX && PX.user) firstCopy.style.display = "none";

    hdr.innerHTML =
      '<div style="display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:10px;padding-bottom:10px;margin-bottom:8px;border-bottom:1px solid var(--line)">' +
        '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">' +
          '<span class="v30-step-badge" style="width:36px;height:36px;font-size:15px">HD</span>' +
          '<div>' +
            '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">' +
              '<strong style="font-family:var(--f-display);font-size:17px;color:var(--ink)">Unidad Renal POSMÉDICA · Programa de Hemodiálisis</strong>' +
              '<span class="tag cac">13 Sillas Habilitadas · Res. 3100/2019</span>' +
              '<span class="tag fav">Puente SIIS v3.0 Activo</span>' +
            '</div>' +
            '<p class="note" style="margin:2px 0 0">' +
              '<b>' + act.length + '</b> pacientes activos al corte · <b>' + sesMes + '</b> sesiones realizadas en el mes · <b>' + pctFav + ' %</b> con FAV funcional · ' +
              (ST.eps ? 'Filtro activo: <b>' + esc(ST.eps) + '</b>' : 'Viendo <b>todas las EPS</b>') +
            '</p>' +
          '</div>' +
        '</div>' +
        '<div class="copyrow">' +
          '<button type="button" class="btn sm primary" data-v30="siis_modal">🔗 Interconexión SIIS (HC y 64 Códigos)</button>' +
          '<button type="button" class="btn sm" data-v30="ct_modal">📄 Verificador Contractual EPS</button>' +
          '<button type="button" class="btn sm" data-v30="exp_evstat_xlsx">📥 Reporte Integral HD (.xlsx)</button>' +
          '<button type="button" class="btn sm" data-accion="exportBook">💾 Libro HD (.xlsx)</button>' +
        '</div>' +
      '</div>';
  }

  /* ===================================================================================================
     7. EJE 01 · PESTAÑA 1: GOBIERNO CLÍNICO (5 GPC ADOPTADAS + 6 PROTOCOLOS + CALCULADORA UKM + 13 SILLAS)
     =================================================================================================== */
  function v30GovGpcView(){
    ensureIdx();
    v30EnsureDemoData();
    const act = pacs().filter(p => epsOk(p) && activeAt(p, ST.corte));
    const tri = addMonths(ST.corte, -3), sem = addMonths(ST.corte, -6);

    /* Calcular adherencia en vivo a las metas de las GPC en los pacientes de las 13 sillas */
    let nKtvOk = 0, nKtvDen = 0, nHbOk = 0, nHbDen = 0, nPOk = 0, nPDen = 0, nCaOk = 0, nCaDen = 0, nPthOk = 0, nPthDen = 0;
    act.forEach(p => {
      const kt = lastLab(p, "KtV", tri, ST.corte);
      if(kt && num(kt.Valor) != null){ nKtvDen++; if(num(kt.Valor) >= 1.2) nKtvOk++; }
      const hb = lastLab(p, "Hb", tri, ST.corte);
      if(hb && num(hb.Valor) != null){ nHbDen++; if(num(hb.Valor) >= 10) nHbOk++; }
      const ph = lastLab(p, "P", tri, ST.corte);
      if(ph && num(ph.Valor) != null){ nPDen++; if(num(ph.Valor) >= 2.5 && num(ph.Valor) <= 6) nPOk++; }
      const ca = lastLab(p, "Ca", tri, ST.corte);
      if(ca && num(ca.Valor) != null){ nCaDen++; if(num(ca.Valor) <= 10.5) nCaOk++; }
      const pth = lastLab(p, "PTH", sem, ST.corte);
      if(pth && num(pth.Valor) != null){ nPthDen++; if(num(pth.Valor) >= 130 && num(pth.Valor) <= 600) nPthOk++; }
    });
    const pctStr = (a, b) => b ? Math.round(a / b * 100) + " % (" + a + "/" + b + ")" : "—";

    const tab = V30.gpcTab || "gpc";
    let h =
      '<div class="v30-hero-banner">' +
        '<div class="mhead">' +
          '<div>' +
            '<p class="eyebrow">Eje 01 · Gobierno Clínico, Estandarización y Excelencia en Unidad Renal</p>' +
            '<h2 class="mt">Gobierno Clínico: Guías de Práctica Clínica (GPC) y Protocolos de Hemodiálisis</h2>' +
            '<p class="note" style="margin:4px 0 0">Define con claridad la arquitectura rectora del programa para las <b>13 sillas de hemodiálisis</b>: las 5 GPC adoptadas oficialmente, los 6 protocolos asistenciales y de bioseguridad codificados, la calculadora cinética de la urea (Manual UKM / Kt/V) y el monitor TMO-ERC/Anemia por silla.</p>' +
          '</div>' +
          '<div class="copyrow">' +
            '<button type="button" class="btn sm primary" data-v30="exp_gpc_xlsx">📥 Descargar Matriz de Gobierno Clínico (.xlsx)</button>' +
          '</div>' +
        '</div>' +
        '<div class="v30-kpi-grid">' +
          '<div class="v30-kpi-card ok"><span class="v30-kpi-val">5 GPC</span><span class="v30-kpi-lbl">Guías de Práctica Clínica adoptadas</span><span class="v30-kpi-sub">ERC 2024 · TMO · Anemia 2026 · DM 2025 · IRA 2022</span></div>' +
          '<div class="v30-kpi-card"><span class="v30-kpi-val">6 Protocolos</span><span class="v30-kpi-lbl">Protocolos operativos codificados</span><span class="v30-kpi-sub">UKM · GSH-PT-001 a 004 · VHB · SG-SST</span></div>' +
          '<div class="v30-kpi-card ' + (nKtvDen && nKtvOk/nKtvDen >= 0.8 ? 'ok' : 'warn') + '"><span class="v30-kpi-val">' + pctStr(nKtvOk, nKtvDen) + '</span><span class="v30-kpi-lbl">Adecuación UKM (spKt/V ≥ 1,2)</span><span class="v30-kpi-sub">Meta CAC dia_11 ≥ 80 %</span></div>' +
          '<div class="v30-kpi-card ' + (nPDen && nPOk/nPDen >= 0.8 ? 'ok' : 'warn') + '"><span class="v30-kpi-val">' + pctStr(nPOk, nPDen) + '</span><span class="v30-kpi-lbl">Control TMO-ERC (Fósforo 2,5–6,0)</span><span class="v30-kpi-sub">PTH en rango: ' + pctStr(nPthOk, nPthDen) + '</span></div>' +
          '<div class="v30-kpi-card ' + (nHbDen && nHbOk/nHbDen >= 0.6 ? 'ok' : 'warn') + '"><span class="v30-kpi-val">' + pctStr(nHbOk, nHbDen) + '</span><span class="v30-kpi-lbl">Control Anemia 2026 (Hb ≥ 10 g/dL)</span><span class="v30-kpi-sub">Meta CAC dia_13 ≥ 60 %</span></div>' +
        '</div>' +
        '<div class="seg" role="group" aria-label="Secciones de Gobierno Clínico">' +
          '<button type="button" data-v30="gpctab|gpc" aria-pressed="' + (tab === "gpc") + '">📘 1. Cinco GPC Adoptadas (Unidad Renal)</button>' +
          '<button type="button" data-v30="gpctab|prot" aria-pressed="' + (tab === "prot") + '">🛡️ 2. Seis Protocolos de Hemodiálisis (GSH-PT / UKM / SST)</button>' +
          '<button type="button" data-v30="gpctab|ukm" aria-pressed="' + (tab === "ukm") + '">🧮 3. Simulador Cinética de la Urea (Manual UKM / Kt/V)</button>' +
          '<button type="button" data-v30="gpctab|sillas13" aria-pressed="' + (tab === "sillas13") + '">💺 4. Monitor Clínico de las 13 Sillas (TMO, Anemia y VHB)</button>' +
        '</div>' +
      '</div>';

    if(tab === "gpc"){
      h += '<div class="v30-gpc-grid">' + HD_GPC_ADOPTADAS.map(g =>
        '<div class="v30-gpc-card ' + g.cls + '">' +
          '<div>' +
            '<div class="copyrow" style="justify-content:space-between;margin-bottom:6px">' +
              '<span class="tag cac">' + esc(g.id) + '</span>' +
              '<span class="st ok">Adoptada y Vigente</span>' +
            '</div>' +
            '<h3 style="margin:0 0 4px;font-size:16px;color:var(--ink);text-transform:none;letter-spacing:0">' + esc(g.titulo) + '</h3>' +
            '<p style="margin:0 0 8px;font-size:13px;font-weight:700;color:var(--accent)">' + esc(g.sub) + '</p>' +
            '<p class="note" style="margin:0 0 8px"><strong>Alcance clínico:</strong> ' + esc(g.alcance) + '</p>' +
            '<div style="background:var(--surface-2);border:1px solid var(--line);border-radius:8px;padding:8px 10px;margin-bottom:8px">' +
              '<strong style="font-size:12px;color:var(--ink);display:block;margin-bottom:4px">Metas e Indicadores Trazadores en la Cohorte:</strong>' +
              '<ul style="margin:0;padding-left:16px;font-size:12.5px">' + g.metas.map(m => '<li>' + esc(m) + '</li>').join("") + '</ul>' +
            '</div>' +
            '<p class="note" style="margin:0;font-size:12px"><strong>Apoyo a la toma de decisiones:</strong> ' + esc(g.decisiones) + '</p>' +
          '</div>' +
          '<div class="copyrow" style="justify-content:space-between;padding-top:6px;border-top:1px solid var(--line)">' +
            '<span class="sub mono">' + esc(g.entidad.slice(0, 48)) + '…</span>' +
            '<button type="button" class="btn sm" data-v30="gpc_dlg|' + esc(g.id) + '">Ver guía y lista de chequeo →</button>' +
          '</div>' +
        '</div>'
      ).join("") + '</div>';
    } else if(tab === "prot"){
      h += '<div class="v30-gpc-grid">' + HD_PROTOCOLOS.map((pr, idx) =>
        '<div class="v30-prot-card">' +
          '<div>' +
            '<div class="copyrow" style="justify-content:space-between;margin-bottom:6px">' +
              '<span class="tag inst" style="font-family:var(--f-mono);font-size:12px">' + esc(pr.codigo) + '</span>' +
              '<span class="tag">' + esc(pr.version) + '</span>' +
            '</div>' +
            '<h3 style="margin:0 0 4px;font-size:16px;color:var(--ink);text-transform:none;letter-spacing:0">' + esc(pr.nombre) + '</h3>' +
            '<p class="sub" style="color:var(--accent);font-weight:700;margin:0 0 6px">' + esc(pr.proceso) + '</p>' +
            '<p class="note" style="margin:0 0 8px">' + esc(pr.resumen) + '</p>' +
            '<div style="background:var(--surface-2);border:1px solid var(--line);border-radius:8px;padding:8px 10px;margin-bottom:8px">' +
              '<strong style="font-size:12px;color:var(--ink);display:block;margin-bottom:4px">Estándares Operativos Clave:</strong>' +
              '<ol style="margin:0;padding-left:18px;font-size:12.5px;display:grid;gap:4px">' + pr.pasos.map(s => '<li>' + esc(s) + '</li>').join("") + '</ol>' +
            '</div>' +
            '<div class="copyrow" style="gap:4px">' +
              '<strong style="font-size:11.5px;color:var(--muted)">Códigos SIIS vinculados:</strong> ' +
              pr.siis.map(s => '<span class="tag" style="font-size:11px">' + esc(s) + '</span>').join("") +
            '</div>' +
          '</div>' +
          '<div class="copyrow" style="justify-content:space-between;padding-top:8px;border-top:1px solid var(--line)">' +
            '<button type="button" class="btn sm" data-v30="prot_dlg|' + idx + '">Ver protocolo completo</button>' +
            '<button type="button" class="btn sm primary" data-v30="prot_aud|' + idx + '">Registrar lista de chequeo</button>' +
          '</div>' +
        '</div>'
      ).join("") + '</div>';
    } else if(tab === "ukm"){
      const U = V30.ukmCalc;
      const spKtv = ktvDaugirdas(U.pre, U.post, U.tMin, U.ufKg, U.wPost);
      const urr = U.pre > 0 && U.post >= 0 ? (1 - U.post / U.pre) * 100 : null;
      const eKtv = spKtv != null && U.tMin > 0 ? spKtv * (U.tMin / (U.tMin + 30)) : null;
      const ufr = U.wPost > 0 && U.tMin > 0 ? (U.ufKg * 1000) / U.wPost / (U.tMin / 60) : null;
      const kru = typeof v13CalcKRu === "function" ? v13CalcKRu(U.bunUri, U.diuresisMl, U.pre) : 0;
      const vTotalW = (U.wPost || 64.5) * 0.58;
      const ktvRenal = kru != null && vTotalW > 0 ? (kru * 10.08 / vTotalW) : 0;
      const ktvTot = spKtv != null ? spKtv + ktvRenal : null;

      h +=
        '<div class="grid2">' +
          '<div class="panel" style="border-top:4px solid var(--accent)">' +
            '<h3>Formulación Cinética de la Urea · Calculadora Interactiva UKM (Daugirdas II + OCM + KRu)</h3>' +
            '<p class="note">Simule y valide en tiempo real la prescripción dialítica de cualquier paciente de la unidad según el protocolo <b>Formulación de la hemodiálisis según cinética de la urea (Manual UKM / Kt/V)</b>.</p>' +
            '<div class="form" style="margin-top:10px">' +
              '<label class="f">Cargar datos de paciente activo<select id="v30_ukm_pac"><option value="">— Simulación libre —</option>' +
                act.map(p => '<option value="' + esc(p.ID) + '">' + esc(p.ID + " · " + nombre(p) + " (Silla " + (p.Puesto || "—") + ")") + '</option>').join("") +
              '</select></label>' +
              '<label class="f">BUN pre-diálisis (mg/dL)<input type="number" step="0.1" id="v30_ukm_pre" value="' + U.pre + '"></label>' +
              '<label class="f">BUN post-diálisis flujo lento (mg/dL)<input type="number" step="0.1" id="v30_ukm_post" value="' + U.post + '"></label>' +
              '<label class="f">Duración efectiva sesión (min)<input type="number" step="5" id="v30_ukm_t" value="' + U.tMin + '"></label>' +
              '<label class="f">Ultrafiltración neta UF (L o kg)<input type="number" step="0.1" id="v30_ukm_uf" value="' + U.ufKg + '"></label>' +
              '<label class="f">Peso post-diálisis / seco W (kg)<input type="number" step="0.1" id="v30_ukm_w" value="' + U.wPost + '"></label>' +
              '<label class="f">Diuresis residual 24 h (mL)<input type="number" step="50" id="v30_ukm_diu" value="' + U.diuresisMl + '"></label>' +
              '<label class="f">BUN urinario (mg/dL)<input type="number" step="5" id="v30_ukm_bu" value="' + U.bunUri + '"></label>' +
            '</div>' +
            '<div class="copyrow" style="margin-top:12px">' +
              '<button type="button" class="btn primary" data-v30="ukm_calc">Calcular Cinética de Urea (UKM)</button>' +
            '</div>' +
          '</div>' +
          '<div class="panel" style="border-top:4px solid var(--ok)">' +
            '<h3>Resultados Cinéticos y Recomendación de Prescripción Nefrológica</h3>' +
            '<div class="v30-kpi-grid" style="margin-top:8px">' +
              '<div class="v30-kpi-card ' + (spKtv >= 1.4 ? 'ok' : spKtv >= 1.2 ? 'warn' : 'bad') + '"><span class="v30-kpi-val">' + (spKtv != null ? f1(spKtv, 2) : "—") + '</span><span class="v30-kpi-lbl">spKt/V (Daugirdas II)</span><span class="v30-kpi-sub">Mínimo ≥ 1,2 · Objetivo ≥ 1,4</span></div>' +
              '<div class="v30-kpi-card ' + (eKtv >= 1.2 ? 'ok' : 'warn') + '"><span class="v30-kpi-val">' + (eKtv != null ? f1(eKtv, 2) : "—") + '</span><span class="v30-kpi-lbl">eKt/V equilibrado (Daugirdas-Schneditz)</span><span class="v30-kpi-sub">Corrige rebote post-diálisis</span></div>' +
              '<div class="v30-kpi-card ' + (urr >= 65 ? 'ok' : 'bad') + '"><span class="v30-kpi-val">' + (urr != null ? f1(urr, 1) + " %" : "—") + '</span><span class="v30-kpi-lbl">PRU / URR (%)</span><span class="v30-kpi-sub">Meta mínima ≥ 65 %</span></div>' +
              '<div class="v30-kpi-card ' + (ufr <= 10 ? 'ok' : ufr <= 13 ? 'warn' : 'bad') + '"><span class="v30-kpi-val">' + (ufr != null ? f1(ufr, 1) + " mL/kg/h" : "—") + '</span><span class="v30-kpi-lbl">Tasa de Ultrafiltración (UFR)</span><span class="v30-kpi-sub">Segura ≤ 10–13 mL/kg/h</span></div>' +
              '<div class="v30-kpi-card"><span class="v30-kpi-val">' + (kru != null ? f1(kru, 2) + " mL/min" : "0") + '</span><span class="v30-kpi-lbl">Aclaramiento Residual (KRu)</span><span class="v30-kpi-sub">Aporte renal: +' + f1(ktvRenal, 2) + ' Kt/V</span></div>' +
              '<div class="v30-kpi-card ok"><span class="v30-kpi-val">' + (ktvTot != null ? f1(ktvTot, 2) : "—") + '</span><span class="v30-kpi-lbl">Kt/V Total Combinado</span><span class="v30-kpi-sub">Dialítico + Residual</span></div>' +
            '</div>' +
            '<div class="alert ' + (spKtv >= 1.2 && ufr <= 13 ? 'ok' : 'warn') + '" style="margin-top:12px">' +
              '<p><strong>Conducta sugerida por el modelo UKM:</strong> ' +
                (spKtv == null ? 'Revise que BUN post sea menor que BUN pre.' :
                 spKtv < 1.2 ? 'Subdiálisis (spKt/V < 1,2): verificar tiempo efectivo (evitar desconexión temprana Cód. SIIS 80), incrementar Qb (+30 a +50 mL/min según acceso), revisar recirculación de FAV/CVC o aumentar superficie K0A del dializador.' :
                 spKtv < 1.4 ? 'Cumple umbral mínimo CAC (≥ 1,2) pero está por debajo del objetivo óptimo KDIGO (1,4): mantener ≥ 240 min efectivos.' :
                 'Dosis dialítica óptima (spKt/V ≥ 1,4). ') +
                (ufr > 13 ? ' ¡Alerta hemodinámica! Tasa de UF > 13 mL/kg/h: alto riesgo de hipotensión intradialítica (Cód. SIIS 4) y pérdida acelerada de función renal residual; considerar sesión extra o educación nutricional sobre sal/líquidos.' : ' Tasa de UF en rango cardioprotector.') +
              '</p>' +
            '</div>' +
          '</div>' +
        '</div>';
    } else if(tab === "sillas13"){
      /* Monitor en vivo de las 13 sillas de diálisis para TMO-ERC, Anemia y Bioseguridad VHB */
      const sillas = Array.from({ length: 13 }, (_, i) => i + 1);
      h +=
        '<div class="panel">' +
          '<div class="mhead">' +
            '<div>' +
              '<h3 style="margin:0">Monitor Clínico de las 13 Sillas de Hemodiálisis · TMO-ERC, Anemia 2026, UKM y Aislamiento VHB</h3>' +
              '<p class="note" style="margin:2px 0 0">Visualización por silla (1 a 13) de los pacientes asignados en los distintos turnos, con estado de su acceso vascular, Fósforo, PTH, Hemoglobina, Kt/V y serología HBsAg.</p>' +
            '</div>' +
          '</div>' +
          '<div class="tablebox" style="margin-top:10px">' +
            '<table class="dense">' +
              '<thead><tr><th>Silla</th><th>Turno</th><th>Paciente · EPS</th><th>Acceso Vascular</th><th class="num">spKt/V (UKM)</th><th class="num">Hb (Anemia 2026)</th><th class="num">Fósforo (TMO)</th><th class="num">Calcio (TMO)</th><th class="num">PTH (TMO)</th><th>Estado VHB</th><th></th></tr></thead>' +
              '<tbody>' +
                sillas.flatMap(sNum => {
                  const pInChair = act.filter(p => num(p.Puesto) === sNum);
                  if(!pInChair.length){
                    return ['<tr><td class="mono"><strong>Silla ' + sNum + '</strong></td><td colspan="10" class="note">Sin pacientes asignados actualmente en esta silla</td></tr>'];
                  }
                  return pInChair.map(p => {
                    const acc = accessAt(p, ST.corte) || p.AccesoActual || "—";
                    const kt = lastLab(p, "KtV", tri, ST.corte);
                    const hb = lastLab(p, "Hb", tri, ST.corte);
                    const ph = lastLab(p, "P", tri, ST.corte);
                    const ca = lastLab(p, "Ca", tri, ST.corte);
                    const pth = lastLab(p, "PTH", sem, ST.corte);
                    const vs = vacStatus(p, ST.corte);
                    const kVal = kt ? num(kt.Valor) : null;
                    const hbVal = hb ? num(hb.Valor) : null;
                    const pVal = ph ? num(ph.Valor) : null;
                    const caVal = ca ? num(ca.Valor) : null;
                    const pthVal = pth ? num(pth.Valor) : null;
                    return '<tr>' +
                      '<td class="mono"><strong>Silla ' + sNum + '</strong></td>' +
                      '<td>' + esc(p.Turno || "—") + '</td>' +
                      '<td><strong>' + esc(p.ID) + '</strong> · ' + esc(nombre(p)) + '<span class="sub">' + esc(p.EPS || "—") + '</span></td>' +
                      '<td><span class="tag ' + (isCVC(acc) ? 'cvc' : 'fav') + '">' + esc(acc) + '</span></td>' +
                      '<td class="num mono"><span class="st ' + (kVal == null ? 'na' : kVal >= 1.2 ? 'ok' : 'bad') + '">' + (kVal != null ? f1(kVal, 2) : "s/d") + '</span></td>' +
                      '<td class="num mono"><span class="st ' + (hbVal == null ? 'na' : hbVal >= 10 && hbVal <= 12 ? 'ok' : hbVal < 10 ? 'bad' : 'warn') + '">' + (hbVal != null ? f1(hbVal, 1) : "s/d") + '</span></td>' +
                      '<td class="num mono"><span class="st ' + (pVal == null ? 'na' : pVal >= 2.5 && pVal <= 6 ? 'ok' : 'bad') + '">' + (pVal != null ? f1(pVal, 1) : "s/d") + '</span></td>' +
                      '<td class="num mono"><span class="st ' + (caVal == null ? 'na' : caVal <= 10.5 ? 'ok' : 'bad') + '">' + (caVal != null ? f1(caVal, 1) : "s/d") + '</span></td>' +
                      '<td class="num mono"><span class="st ' + (pthVal == null ? 'na' : pthVal >= 130 && pthVal <= 600 ? 'ok' : 'warn') + '">' + (pthVal != null ? f1(pthVal, 0) : "s/d") + '</span></td>' +
                      '<td><span class="st ' + vs.lvl + '">' + esc(vacEtiqueta(vs.code)) + '</span></td>' +
                      '<td><button type="button" class="btn sm" data-a="psel|' + esc(p.ID) + '">Ficha →</button></td>' +
                    '</tr>';
                  });
                }).join("") +
              '</tbody>' +
            '</table>' +
          '</div>' +
        '</div>';
    }
    return h;
  }

  /* ===================================================================================================
     8. EJE 01 · PESTAÑA 2: RUTA GRÁFICA MODERNA DEL PACIENTE EN UNIDAD RENAL (INFOGRAFÍA 360° + 13 SILLAS)
     =================================================================================================== */
  function v30RutaGraficaHdView(){
    ensureIdx();
    v30EnsureDemoData();
    const act = pacs().filter(p => epsOk(p) && activeAt(p, ST.corte));
    const selPid = (typeof V13 !== "undefined" && V13.rutaPacSel && V13.rutaPacSel.hd) || (act[0] && act[0].ID) || "";
    const selPac = IDX.pac.get(selPid) || act[0];

    /* Conteo real de pacientes por estación de la ruta */
    const nIngreso = act.length;
    const nFav = act.filter(p => !isCVC(accessAt(p, ST.corte))).length;
    const nCvc = act.length - nFav;
    const nSesMes = act.filter(p => sesIn(p, monthStart(ST.corte), ST.corte, "Realizada").length > 0).length;
    const nLabTri = act.filter(p => lastLab(p, "Hb", addMonths(ST.corte, -3), ST.corte)).length;
    const nValMes = act.filter(p => p._val && p._val.some(v => v.Mes === ym(ST.corte))).length;
    const nTxEval = act.filter(p => p.TxEstado && p.TxEstado !== "Sin evaluar").length;

    const stations = [
      { num: "01", t: "Ingreso, Estadificación KDIGO y Bioseguridad VHB", rol: "Admisiones · Nefrología · Enfermería Jefe", kpi: nIngreso + " activos", meta: "Tamizaje HBsAg/VHC/VIH + Vacuna VHB 40 µg", prot: "GPC ERC 2024 · GSH-PT-001 (VHB)", siis: "Cód. 20, 34", go: ["hd","e2","hd_car"], color: "#06b6d4" },
      { num: "02", t: "Acceso Vascular («Fistula First») y Asignación en 13 Sillas", rol: "Cirugía Vascular · Nefrología · Enfermería", kpi: nFav + " FAV / " + nCvc + " CVC", meta: "Meta CAC dia_10: CVC < 10–20 %", prot: "GSH-PT-004 Accesos Vasculares", siis: "Cód. 33, 82, 22–24, 31–32", go: ["hd","e2","acc"], color: "#10b981" },
      { num: "03", t: "Pre-Sesión: Calidad de Agua, Desinfección y Signos Vitales", rol: "Enfermería · Biomédica · Auxiliar HD", kpi: "13 sillas verificadas", meta: "Conductividad < 15 µS/cm · Cloro < 0,1 mg/L", prot: "SG-SST Bioseguridad · GSH-PT-001", siis: "Cód. 61, 74, 84, 79", go: ["hd","e3","turno"], color: "#3b82f6" },
      { num: "04", t: "Sesión de Hemodiálisis (4 h), Conexión/Desconexión y Eventos", rol: "Enfermería Profesional · Médico de Sala", kpi: nSesMes + " pac. dializados mes", meta: "Duración ≥ 240 min (CAC dia_20 ≥ 90 %)", prot: "GSH-PT-001 / 002 / 003", siis: "Cód. 4, 17, 85, 14, 21, 5", go: ["hd","e2","hd_evstat"], color: "#f59e0b" },
      { num: "05", t: "Vigilancia Paraclínica (TMO-ERC, Anemia 2026 y Cinética UKM)", rol: "Laboratorio Clínico · Nefrología", kpi: nLabTri + "/" + act.length + " con labs", meta: "spKt/V ≥ 1,2 · Hb ≥ 10 · P 2,5–6,0", prot: "Manual UKM · GPC TMO · GPC Anemia", siis: "Cód. 69, 88, 11", go: ["hd","e4","lab"], color: "#a855f7" },
      { num: "06", t: "Farmacia Intradiálisis (EPO / Hierro / Mircera) y Oxigenoterapia", rol: "Químico Farmacéutico · Enfermería HD", kpi: "Conciliación 100 %", meta: "Cero fugas + Control cilindro O2 (PSI/L)", prot: "GPC Anemia 2026 · GFA-FO-OXI-001", siis: "Cód. 71, 59, 92, 64, 3", go: ["hd","e5","hd_oxi"], color: "#ec4899" },
      { num: "07", t: "Ronda Multidisciplinaria Mensual, Trasplante y Sincronización SIIS", rol: "Nefrología · Nutrición · Psicología · T. Social", kpi: nTxEval + "/" + act.length + " eval. Tx", meta: "Nota estructurada SIIS + Pre-SISCAC 100 %", prot: "GPC ERC 2024 · Puente SIIS", siis: "Cód. 93 + Exportación SIIS", go: ["hd","e3","val"], color: "#0ea5e9" }
    ];

    /* SVG Infográfico de Flujo del Ciclo de Sesión de 4 Horas + Ruta Integral */
    const svgFlow =
      '<div class="panel" style="margin-bottom:14px;overflow-x:auto">' +
        '<div class="mhead" style="margin-bottom:10px">' +
          '<div>' +
            '<span class="eyebrow">Infografía Visual de Alta Precisión · Estándar Nacional de Hemodiálisis</span>' +
            '<h3 style="margin:2px 0 0;font-size:17px;color:var(--ink);text-transform:none">Arquitectura Gráfica de la Ruta del Paciente y Ciclo de la Sesión de 4 Horas (13 Sillas)</h3>' +
          '</div>' +
          '<div class="copyrow">' +
            '<label class="f" style="min-width:270px;flex-direction:row;align-items:center;gap:8px">Paciente trazado:' +
              '<select data-v13="rutapac|hd" style="min-width:210px">' +
                act.map(p => '<option value="' + esc(p.ID) + '"' + (p.ID === (selPac && selPac.ID) ? ' selected' : '') + '>' + esc(p.ID + " · " + nombre(p) + " (Silla " + (p.Puesto || "—") + ")") + '</option>').join("") +
              '</select>' +
            '</label>' +
          '</div>' +
        '</div>' +
        '<svg viewBox="0 0 1180 235" style="width:100%;min-width:860px;height:auto;display:block" role="img" aria-label="Diagrama visual de la Ruta Integral de Hemodiálisis">' +
          '<defs>' +
            '<linearGradient id="v30GradLine" x1="0%" y1="0%" x2="100%" y2="0%">' +
              '<stop offset="0%" stop-color="#06b6d4"/>' +
              '<stop offset="35%" stop-color="#10b981"/>' +
              '<stop offset="70%" stop-color="#f59e0b"/>' +
              '<stop offset="100%" stop-color="#a855f7"/>' +
            '</linearGradient>' +
            '<filter id="v30Drop" x="-10%" y="-10%" width="120%" height="125%">' +
              '<feDropShadow dx="0" dy="3" stdDeviation="4" flood-opacity="0.22"/>' +
            '</filter>' +
          '</defs>' +
          /* Línea conectora principal */
          '<line x1="75" y1="88" x2="1105" y2="88" stroke="url(#v30GradLine)" stroke-width="5" stroke-dasharray="10 5"/>' +
          stations.map((s, idx) => {
            const cx = 85 + idx * 168;
            return (
              '<g transform="translate(' + (cx - 72) + ', 14)" filter="url(#v30Drop)">' +
                '<rect x="0" y="0" width="148" height="148" rx="14" fill="var(--surface)" stroke="' + s.color + '" stroke-width="2.2"/>' +
                '<rect x="0" y="0" width="148" height="28" rx="14" fill="' + s.color + '"/>' +
                '<text x="12" y="19" fill="#ffffff" font-family="var(--f-mono)" font-size="11.5" font-weight="700">ESTACIÓN ' + s.num + '</text>' +
                '<text x="12" y="48" fill="var(--ink)" font-family="var(--f-display)" font-size="11.5" font-weight="700">' + esc(s.t.slice(0, 22)) + '</text>' +
                '<text x="12" y="63" fill="var(--ink)" font-family="var(--f-display)" font-size="11" font-weight="600">' + esc(s.t.slice(22, 46)) + '</text>' +
                '<text x="12" y="84" fill="var(--accent)" font-family="var(--f-mono)" font-size="11" font-weight="700">' + esc(s.kpi) + '</text>' +
                '<text x="12" y="103" fill="var(--muted)" font-family="var(--f-body)" font-size="10">' + esc(s.prot.slice(0, 26)) + '</text>' +
                '<rect x="10" y="114" width="128" height="22" rx="6" fill="var(--surface-2)" stroke="var(--line)"/>' +
                '<text x="74" y="129" text-anchor="middle" fill="var(--ink)" font-family="var(--f-mono)" font-size="10" font-weight="700">SIIS: ' + esc(s.siis) + '</text>' +
              '</g>'
            );
          }).join("") +
          /* Barra inferior de tiempos del ciclo intradiálisis de 240 minutos */
          '<rect x="14" y="178" width="1152" height="44" rx="10" fill="var(--surface-2)" stroke="var(--line)"/>' +
          '<text x="28" y="197" fill="var(--accent)" font-family="var(--f-mono)" font-size="11" font-weight="700">CRONOGRAMA MICRO-RUTA SESIÓN 240 MIN:</text>' +
          '<text x="28" y="213" fill="var(--ink)" font-family="var(--f-body)" font-size="11.5">Min -15 a 0: Pesaje Pre, PA, Lavado FAV y Chequeo Agua/Máquina  ➔  Min 0 a 15: Conexión Aséptica (GSH-PT-001) y Programación UF/Qb  ➔  Min 15 a 225: Monitoreo cada 30-60 min, OCM Kt/V, EPO/Hierro (Cód. 71/59) y Vigilancia GSH-PT-003  ➔  Min 225 a 240: Toma BUN lento, Retorno y Desconexión (GSH-PT-002)  ➔  Post: Desinfección Puesto y Envío SIIS</text>' +
        '</svg>' +
      '</div>';

    /* Tarjetas interactivas de las 7 estaciones con estado en vivo del paciente seleccionado */
    const stFlags = (typeof v13EvalPatientStation === "function" && selPac) ? v13EvalPatientStation("hd", selPac.ID) : [true, true, true, true, true, true, false];
    const cardsHtml =
      '<div class="v30-journey-flow" style="margin-bottom:14px">' +
        stations.map((s, idx) => {
          const isDone = stFlags[idx % stFlags.length];
          return (
            '<div class="v30-station-card ' + (isDone ? 'done' : 'curr') + '" style="border-top-color:' + s.color + '">' +
              '<div>' +
                '<div class="copyrow" style="justify-content:space-between;margin-bottom:6px">' +
                  '<span class="v30-step-badge" style="background:' + s.color + ';color:#fff">' + s.num + '</span>' +
                  '<span class="tag ' + (isDone ? 'fav' : 'warn') + '">' + (isDone ? '✔ Estación verificada' : '● Acción requerida') + '</span>' +
                '</div>' +
                '<strong style="font-size:14.5px;display:block;line-height:1.28;color:var(--ink)">' + esc(s.t) + '</strong>' +
                '<span class="sub" style="color:var(--accent);font-weight:700;margin:4px 0">' + esc(s.rol) + '</span>' +
                '<p class="note" style="font-size:12px;margin:4px 0"><b>Protocolo:</b> ' + esc(s.prot) + '<br><b>Meta:</b> ' + esc(s.meta) + '<br><b>Códigos SIIS:</b> <span class="mono">' + esc(s.siis) + '</span></p>' +
              '</div>' +
              '<button type="button" class="btn sm primary" style="width:100%" data-v12="sub|' + s.go[0] + '|' + s.go[1] + '|' + s.go[2] + '">Ir a Estación ' + s.num + ' →</button>' +
            '</div>'
          );
        }).join("") +
      '</div>';

    /* Mapa Visual de las 13 Sillas de Hemodiálisis */
    const sillas = Array.from({ length: 13 }, (_, i) => i + 1);
    const turnoSel = ST.ui.rutaTurno || "L-M-V Mañana";
    const map13Html =
      '<div class="panel">' +
        '<div class="mhead" style="margin-bottom:10px">' +
          '<div>' +
            '<h3 style="margin:0">Mapa Gráfico en Vivo de las 13 Sillas de la Unidad Renal · Turno ' + esc(turnoSel) + '</h3>' +
            '<p class="note" style="margin:2px 0 0">Haga clic en cualquier silla para abrir la ficha clínica o registrar actividades SIIS del paciente asignado.</p>' +
          '</div>' +
          '<div class="seg" role="group">' +
            turnoNames().map(tn => '<button type="button" data-v30="rutaturno|' + esc(tn) + '" aria-pressed="' + (tn === turnoSel) + '">' + esc(tn) + '</button>').join("") +
          '</div>' +
        '</div>' +
        '<div class="v30-chairs-grid">' +
          sillas.map(sNum => {
            const p = act.find(x => x.Turno === turnoSel && num(x.Puesto) === sNum);
            if(!p){
              return '<div class="v30-chair free"><div class="copyrow" style="justify-content:space-between"><strong class="mono">SILLA ' + sNum + '</strong><span class="tag">Disponible</span></div><span class="note">Cupo libre en este turno</span></div>';
            }
            const acc = accessAt(p, ST.corte) || p.AccesoActual || "FAV";
            const kt = lastLab(p, "KtV", addMonths(ST.corte, -3), ST.corte);
            const hb = lastLab(p, "Hb", addMonths(ST.corte, -3), ST.corte);
            const hbs = lastLab(p, "HBsAg", null, ST.corte);
            const isHbsPos = hbs && /^react/i.test(hbs.Valor || "");
            return (
              '<div class="v30-chair ' + (isHbsPos ? 'hbs' : isCVC(acc) ? 'cvc' : 'fav') + '" data-a="psel|' + esc(p.ID) + '">' +
                '<div class="copyrow" style="justify-content:space-between">' +
                  '<strong class="mono" style="font-size:13px">💺 SILLA ' + sNum + '</strong>' +
                  '<span class="tag ' + (isCVC(acc) ? 'cvc' : 'fav') + '">' + esc(acc) + '</span>' +
                '</div>' +
                '<strong style="font-size:13px;color:var(--ink);line-height:1.2">' + esc(nombre(p)) + '</strong>' +
                '<span class="sub">' + esc(p.ID + " · " + (p.EPS || "")) + '</span>' +
                '<div class="copyrow" style="gap:4px;margin-top:4px">' +
                  '<span class="tag" style="font-size:10.5px">Kt/V: ' + (kt ? f1(num(kt.Valor), 2) : "—") + '</span>' +
                  '<span class="tag" style="font-size:10.5px">Hb: ' + (hb ? f1(num(hb.Valor), 1) : "—") + '</span>' +
                '</div>' +
              '</div>'
            );
          }).join("") +
        '</div>' +
      '</div>';

    return svgFlow + cardsHtml + map13Html;
  }

  /* ===================================================================================================
     9. EJE 01 · PESTAÑA 3: MAPA INTEGRAL DE LOS 14 PROCESOS Y ACTIVIDADES DE LA UNIDAD RENAL
     =================================================================================================== */
  function v30ProcesosUnidadRenalView(){
    const groups = [
      ["Estratégico", "Procesos Estratégicos y de Dirección de la Unidad Renal"],
      ["Misional", "Procesos Misionales Asistenciales de Hemodiálisis (Ciclo Clínico Completo HD-P01 a HD-P08)"],
      ["Apoyo Clínico", "Procesos de Apoyo Farmacéutico, Técnico, Bioseguridad e Interoperabilidad SIIS"]
    ];
    let h =
      '<div class="v30-hero-banner">' +
        '<div class="mhead">' +
          '<div>' +
            '<p class="eyebrow">Eje 01 · Arquitectura por Procesos de la Unidad Renal POSMÉDICA</p>' +
            '<h2 class="mt">Mapa Integral de Procesos y Actividades de la Unidad Renal (14 Procesos)</h2>' +
            '<p class="note" style="margin:4px 0 0">Articula todos los procesos estratégicos, misionales y de apoyo/seguridad de la Unidad Renal con sus responsables, GPC/protocolos rectores, puntos de control e interconexión directa con las estaciones operativas del SIGC y SIIS.</p>' +
          '</div>' +
          '<div class="copyrow">' +
            '<button type="button" class="btn sm primary" data-v10="plnnew|hd">+ Nueva Actividad al Plan Anual</button>' +
            '<button type="button" class="btn sm" data-v30="exp_proc_xlsx">📥 Exportar Mapa de Procesos (.xlsx)</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    groups.forEach(([gKey, gTitle]) => {
      const list = UR_PROCESOS_COMPLETOS.filter(p => gKey === "Apoyo Clínico" ? !["Estratégico","Misional"].includes(p.tipo) : p.tipo === gKey);
      h +=
        '<div class="panel" style="margin-bottom:14px">' +
          '<h3 style="margin:0 0 10px;color:var(--accent);font-size:13.5px">' + esc(gTitle) + ' (' + list.length + ' procesos)</h3>' +
          '<div class="v10grid">' +
            list.map(pr =>
              '<div class="v10proc" style="border-left-color:' + (pr.tipo === "Estratégico" ? "var(--purple)" : pr.tipo === "Misional" ? "var(--accent)" : "var(--ok)") + '">' +
                '<div class="copyrow" style="justify-content:space-between">' +
                  '<span class="mono tag cac">' + esc(pr.cod) + '</span>' +
                  '<span class="tag">' + esc(pr.tipo) + '</span>' +
                '</div>' +
                '<h4>' + esc(pr.nom) + '</h4>' +
                '<p style="font-size:12.5px;margin:2px 0"><strong>Responsable líder:</strong> ' + esc(pr.resp) + '</p>' +
                '<p style="font-size:12.5px;margin:2px 0"><strong>GPC / Protocolo rector:</strong> <span style="color:var(--accent)">' + esc(pr.gpc) + '</span></p>' +
                '<p style="font-size:12.5px;margin:2px 0"><strong>Punto de control e indicador:</strong> <span style="color:var(--ok)">' + esc(pr.ctrl) + '</span></p>' +
                '<div class="copyrow" style="margin-top:6px;padding-top:6px;border-top:1px solid var(--line);justify-content:space-between">' +
                  '<button type="button" class="btn sm primary" data-v12="sub|' + pr.go[0] + '|' + pr.go[1] + '|' + pr.go[2] + '">Abrir estación operativa →</button>' +
                  '<button type="button" class="btn sm" data-v10="halnew|hd">Registrar hallazgo PAMEC</button>' +
                '</div>' +
              '</div>'
            ).join("") +
          '</div>' +
        '</div>';
    });
    return h;
  }

  /* ===================================================================================================
     10. EJE 02 · PESTAÑA 1: COHORTE OPERATIVA Y PERFIL DE RIESGO (100% OPERATIVO Y DESCARGABLE)
     =================================================================================================== */
  function v30CohorteOperativaView(){
    ensureIdx();
    v30EnsureDemoData();
    const F = V30.cohFilter;
    const allPacs = pacs();
    const filtered = allPacs.filter(p => {
      const isAct = activeAt(p, ST.corte);
      if(F.estado === "act" && !isAct) return false;
      if(F.estado === "egr" && isAct) return false;
      if(F.eps && p.EPS !== F.eps) return false;
      if(F.turno && p.Turno !== F.turno) return false;
      const acc = accessAt(p, ST.corte) || p.AccesoActual || "";
      if(F.acc && acc !== F.acc) return false;
      const sem = semaforo(p, ST.corte);
      if(F.riesgo && sem.lvl !== F.riesgo) return false;
      if(F.q){
        const hay = norm(p.ID + " " + nombre(p) + " " + (p.Documento || "") + " " + (p.EPS || "") + " " + (p.Municipio || ""));
        if(!hay.includes(norm(F.q))) return false;
      }
      return true;
    });

    /* Estadísticas rápidas de la cohorte filtrada */
    const nTot = filtered.length;
    const nFav = filtered.filter(p => (accessAt(p, ST.corte) || p.AccesoActual) === "FAV").length;
    const nCvc = filtered.filter(p => isCVC(accessAt(p, ST.corte) || p.AccesoActual)).length;
    const nAltoRiesgo = filtered.filter(p => semaforo(p, ST.corte).lvl === "alto").length;
    const nDm = filtered.filter(p => p.DM === "SI").length;
    const tri = addMonths(ST.corte, -3);
    const ktvOk = filtered.filter(p => { const l = lastLab(p, "KtV", tri, ST.corte); return l && num(l.Valor) >= 1.2; }).length;
    const hbOk = filtered.filter(p => { const l = lastLab(p, "Hb", tri, ST.corte); return l && num(l.Valor) >= 10; }).length;

    /* Distribución por EPS y por Acceso */
    const byEps = {}, byAcc = { "FAV": 0, "Injerto": 0, "CVC tunelizado": 0, "CVC temporal": 0 };
    filtered.forEach(p => {
      const e = p.EPS || "Sin EPS";
      byEps[e] = (byEps[e] || 0) + 1;
      const a = accessAt(p, ST.corte) || p.AccesoActual || "FAV";
      byAcc[a] = (byAcc[a] || 0) + 1;
    });

    let h =
      '<div class="v30-hero-banner">' +
        '<div class="mhead">' +
          '<div>' +
            '<p class="eyebrow">Eje 02 · Gestión Operativa de Cohorte, Estratificación de Riesgo e Interconexión SIIS</p>' +
            '<h2 class="mt">Cohorte Operativa de Hemodiálisis · ' + nTot + ' pacientes en vista</h2>' +
            '<p class="note" style="margin:4px 0 0">Gestione en vivo el censo nominal de las 13 sillas: filtre por EPS, turno, acceso o riesgo; edite pacientes o registre nuevos ingresos; lance eventos/estadísticas SIIS en 1 clic y descargue el reporte ejecutivo completo.</p>' +
          '</div>' +
          '<div class="copyrow">' +
            '<button type="button" class="btn sm primary" data-v30="coh_newpac">+ Nuevo Paciente en Cohorte</button>' +
            '<button type="button" class="btn sm" data-v12="sub|hd|e2|hd_evstat">⚡ Ir a Eventos y Estadísticas SIIS (64 Códigos)</button>' +
            '<button type="button" class="btn sm" data-v30="exp_cohorte_xlsx">📥 Descargar Reporte de Cohorte (.xlsx)</button>' +
            '<button type="button" class="btn sm" data-v30="exp_cohorte_csv">📄 Exportar CSV (SIIS)</button>' +
          '</div>' +
        '</div>' +
        '<div class="v30-kpi-grid">' +
          '<div class="v30-kpi-card"><span class="v30-kpi-val">' + nTot + '</span><span class="v30-kpi-lbl">Pacientes en cohorte filtrada</span><span class="v30-kpi-sub">' + nDm + ' con Diabetes (' + (nTot ? Math.round(nDm/nTot*100) : 0) + ' %)</span></div>' +
          '<div class="v30-kpi-card ' + (nTot && nFav/nTot >= 0.8 ? 'ok' : 'warn') + '"><span class="v30-kpi-val">' + (nTot ? Math.round(nFav/nTot*100) : 0) + ' %</span><span class="v30-kpi-lbl">Con Fístula Arteriovenosa (FAV)</span><span class="v30-kpi-sub">' + nFav + ' FAV vs. ' + nCvc + ' CVC</span></div>' +
          '<div class="v30-kpi-card ' + (nTot && ktvOk/nTot >= 0.8 ? 'ok' : 'warn') + '"><span class="v30-kpi-val">' + (nTot ? Math.round(ktvOk/nTot*100) : 0) + ' %</span><span class="v30-kpi-lbl">En meta de spKt/V ≥ 1,2</span><span class="v30-kpi-sub">' + ktvOk + ' de ' + nTot + ' pacientes</span></div>' +
          '<div class="v30-kpi-card ' + (nTot && hbOk/nTot >= 0.6 ? 'ok' : 'warn') + '"><span class="v30-kpi-val">' + (nTot ? Math.round(hbOk/nTot*100) : 0) + ' %</span><span class="v30-kpi-lbl">En meta de Hb ≥ 10 g/dL</span><span class="v30-kpi-sub">' + hbOk + ' de ' + nTot + ' pacientes</span></div>' +
          '<div class="v30-kpi-card ' + (nAltoRiesgo > 0 ? 'bad' : 'ok') + '"><span class="v30-kpi-val">' + nAltoRiesgo + '</span><span class="v30-kpi-lbl">Riesgo Clínico Alto (Semáforo)</span><span class="v30-kpi-sub">Prioritarios para ronda médica</span></div>' +
        '</div>' +
      '</div>';

    /* Barra de filtros operativos de la cohorte */
    h +=
      '<div class="panel" style="margin-bottom:14px">' +
        '<div class="filters">' +
          '<label class="f" style="min-width:220px">Buscar paciente (ID, nombre, documento, municipio)<input type="text" id="v30_cq" value="' + esc(F.q) + '" placeholder="Ej. P001, Muñoz, 9000..."></label>' +
          '<label class="f">Estado en cohorte<select id="v30_cest">' +
            opt([["act","Activos al corte"],["egr","Egresados / Históricos"],["all","Todos (Activos + Egresados)"]], F.estado) +
          '</select></label>' +
          '<label class="f">EPS / Pagador<select id="v30_ceps">' +
            opt([["","Todas las EPS"]].concat(epsList().map(e => [e, e])), F.eps) +
          '</select></label>' +
          '<label class="f">Turno asignado<select id="v30_cturno">' +
            opt([["","Todos los turnos"]].concat(turnoNames().map(t => [t, t])), F.turno) +
          '</select></label>' +
          '<label class="f">Acceso vascular<select id="v30_cacc">' +
            opt([["","Todos los accesos"]].concat(ACCESOS.map(a => [a, a])), F.acc) +
          '</select></label>' +
          '<label class="f">Nivel de riesgo<select id="v30_criesgo">' +
            opt([["","Todos los niveles"],["alto","Riesgo Alto"],["medio","Riesgo Moderado"],["bajo","Riesgo Bajo / Controlado"]], F.riesgo) +
          '</select></label>' +
        '</div>' +
      '</div>';

    /* Gráficas de distribución por EPS y por Acceso Vascular */
    h +=
      '<div class="grid2" style="margin-bottom:14px">' +
        '<div class="panel"><h3>Distribución de la Cohorte por EPS</h3>' + hbars(Object.entries(byEps).sort((a,b)=>b[1]-a[1])) + '</div>' +
        '<div class="panel"><h3>Distribución por Tipo de Acceso Vascular</h3>' + hbars(Object.entries(byAcc)) + '</div>' +
      '</div>';

    /* Tabla Nominal Interactiva y Operativa de la Cohorte */
    h +=
      '<div class="panel tablebox" style="padding:0">' +
        '<table class="dense">' +
          '<thead><tr><th>ID · Documento</th><th>Paciente · Edad</th><th>EPS · Municipio</th><th>Turno · Silla</th><th>Acceso Actual</th><th class="num">spKt/V</th><th class="num">Hb</th><th class="num">Fósforo</th><th class="num">Albúmina</th><th>Riesgo</th><th>Acciones Operativas</th></tr></thead>' +
          '<tbody>' +
            (filtered.length ? filtered.map(p => {
              const acc = accessAt(p, ST.corte) || p.AccesoActual || "—";
              const sem = semaforo(p, ST.corte);
              const kt = lastLab(p, "KtV", tri, ST.corte);
              const hb = lastLab(p, "Hb", tri, ST.corte);
              const ph = lastLab(p, "P", tri, ST.corte);
              const alb = lastLab(p, "Alb", tri, ST.corte);
              const ed = ageAt(p, ST.corte);
              const semCls = sem.lvl === "alto" ? "bad" : sem.lvl === "medio" ? "warn" : "ok";
              return '<tr>' +
                '<td class="mono"><strong>' + esc(p.ID) + '</strong><span class="sub">' + esc((p.TipoDoc || "CC") + " " + (p.Documento || "")) + '</span></td>' +
                '<td><strong>' + esc(nombre(p)) + '</strong><span class="sub">' + (ed != null ? ed + ' años · ' : '') + esc(p.Sexo || "") + (p.DM === "SI" ? ' · DM' : '') + '</span></td>' +
                '<td><strong>' + esc(p.EPS || "—") + '</strong><span class="sub">' + esc(p.Municipio || "Mocoa") + '</span></td>' +
                '<td>' + esc(p.Turno || "—") + '<span class="sub mono">💺 Silla ' + esc(p.Puesto || "—") + '</span></td>' +
                '<td><span class="tag ' + (isCVC(acc) ? 'cvc' : 'fav') + '">' + esc(acc) + '</span></td>' +
                '<td class="num mono">' + (kt ? f1(num(kt.Valor), 2) : '<span class="sd">—</span>') + '</td>' +
                '<td class="num mono">' + (hb ? f1(num(hb.Valor), 1) : '<span class="sd">—</span>') + '</td>' +
                '<td class="num mono">' + (ph ? f1(num(ph.Valor), 1) : '<span class="sd">—</span>') + '</td>' +
                '<td class="num mono">' + (alb ? f1(num(alb.Valor), 2) : '<span class="sd">—</span>') + '</td>' +
                '<td><span class="st ' + semCls + '">' + esc(sem.lvl.toUpperCase()) + ' (' + sem.tot + ' pt)</span></td>' +
                '<td>' +
                  '<div class="copyrow" style="gap:4px;flex-wrap:nowrap">' +
                    '<button type="button" class="btn sm" data-v30="coh_edit|' + esc(p.ID) + '" title="Editar ficha maestra">Editar</button>' +
                    '<button type="button" class="btn sm primary" data-v30="siis_new|' + esc(p.ID) + '" title="Registrar Evento o Actividad SIIS">+ SIIS</button>' +
                    '<button type="button" class="btn sm" data-v30="coh_hc|' + esc(p.ID) + '" title="Abrir Valoración Mensual / HC">HC</button>' +
                  '</div>' +
                '</td>' +
              '</tr>';
            }).join("") : '<tr><td colspan="11" class="empty">No hay pacientes que coincidan con los filtros seleccionados.</td></tr>') +
          '</tbody>' +
        '</table>' +
      '</div>';

    return h;
  }

  /* ===================================================================================================
     11. EJE 02 · PESTAÑA 2: EVENTOS CLÍNICOS, ESTADÍSTICAS SIIS (64 CÓDIGOS) Y ANALÍTICA DE DATOS
     =================================================================================================== */
  function v30ComputeSiisStats(){
    ensureIdx();
    v30EnsureDemoData();
    const ms = monthStart(ST.corte);
    const act = pacs().filter(p => epsOk(p));
    const counts = {};
    const byEps = {};
    SIIS_ACTIVIDADES_HD.forEach(a => { counts[a.no] = 0; });

    /* 1. Sumar las actividades y eventos registrados directamente en V30.siisActs */
    V30.siisActs.forEach(r => {
      if(ST.eps && r.eps !== ST.eps) return;
      counts[r.no] = (counts[r.no] || 0) + 1;
      byEps[r.eps] = byEps[r.eps] || { ev: 0, est: 0, ses: 0 };
      if(r.tipo === "EVENTO") byEps[r.eps].ev++;
      else byEps[r.eps].est++;
    });

    /* 2. Sumar dinámicamente desde los registros operativos del libro de Hemodiálisis (sesiones, eventos, vacunas, fármacos, labs) */
    act.forEach(p => {
      const eps = p.EPS || "NUEVA EPS";
      byEps[eps] = byEps[eps] || { ev: 0, est: 0, ses: 0 };
      const sesMes = p._ses.filter(s => s.Fecha >= ms && s.Fecha <= ST.corte);
      sesMes.forEach(s => {
        if(s.Estado === "Realizada"){
          counts["61"] = (counts["61"] || 0) + 1;
          byEps[eps].ses++;
          const acc = s.Acceso || p.AccesoActual || "FAV";
          if(acc === "FAV") counts["31"] = (counts["31"] || 0) + 1;
          else if(acc === "Injerto") counts["32"] = (counts["32"] || 0) + 1;
          else if(acc === "CVC tunelizado") counts["24"] = (counts["24"] || 0) + 1;
          else if(acc === "CVC temporal") counts["23"] = (counts["23"] || 0) + 1;
          if(num(s.DuracionMin) != null && num(s.DuracionMin) < 210) counts["80"] = (counts["80"] || 0) + 1;
          if(num(s.UFNeta) != null && num(p.PesoSeco) != null && num(s.PesoPost) - num(p.PesoSeco) > 0.6) counts["11"] = (counts["11"] || 0) + 1;
        } else if(s.Estado === "No asistió"){
          counts["36"] = (counts["36"] || 0) + 1;
        }
      });

      /* Eventos del libro HD en los últimos 3 meses */
      p._evt.filter(e => e.Fecha >= addMonths(ST.corte, -3) && e.Fecha <= ST.corte).forEach(e => {
        byEps[eps].ev++;
        const t = norm(e.Tipo || "");
        const mCode = /\[SIIS (\d+)\]/.exec(e.Tipo || "");
        if(mCode){ counts[mCode[1]] = (counts[mCode[1]] || 0) + 1; return; }
        if(t.includes("HIPOTENSION")) counts["4"] = (counts["4"] || 0) + 1;
        else if(t.includes("HIPERTENSION")) counts["17"] = (counts["17"] || 0) + 1;
        else if(t.includes("CALAMBRE")) counts["85"] = (counts["85"] || 0) + 1;
        else if(t.includes("CEFALEA")) counts["14"] = (counts["14"] || 0) + 1;
        else if(t.includes("VOMITO") || t.includes("NAUSEA")) counts["2"] = (counts["2"] || 0) + 1;
        else if(t.includes("COAGULACION")) counts["21"] = (counts["21"] || 0) + 1;
        else if(t.includes("SANGRADO")) counts["6"] = (counts["6"] || 0) + 1;
        else if(t.includes("BACTERIEMIA") || t.includes("ITS")) counts["28"] = (counts["28"] || 0) + 1;
        else if(t.includes("ORIFICIO") || t.includes("TUNEL")) counts["26"] = (counts["26"] || 0) + 1;
        else if(t.includes("FAV")) counts["10"] = (counts["10"] || 0) + 1;
        else if(t.includes("REACCION")) counts["70"] = (counts["70"] || 0) + 1;
        else if(t.includes("CAIDA")) counts["12"] = (counts["12"] || 0) + 1;
        else counts["81"] = (counts["81"] || 0) + 1;
      });

      /* Laboratorios y Kt/V del mes */
      const hasLabMes = Object.values(p._lab || {}).some(arr => arr.some(l => l.FechaToma >= ms && l.FechaToma <= ST.corte));
      if(hasLabMes) counts["88"] = (counts["88"] || 0) + 1;
      const hasKtvMes = (p._lab.KtV || []).some(l => l.FechaToma >= ms && l.FechaToma <= ST.corte);
      if(hasKtvMes) counts["69"] = (counts["69"] || 0) + 1;

      /* Vacunas VHB y medicamentos intradiálisis */
      p._vac.filter(v => v.Fecha >= addMonths(ST.corte, -3) && v.Fecha <= ST.corte).forEach(() => { counts["20"] = (counts["20"] || 0) + 1; });
      p._med.filter(m => !m.Fin || m.Fin >= ms).forEach(m => {
        const nm = norm(m.Medicamento || "");
        if(nm.includes("ERITROPOYETINA")) counts["71"] = (counts["71"] || 0) + (num(m.CantidadMes) || 12);
        else if(nm.includes("HIERRO")) counts["59"] = (counts["59"] || 0) + (num(m.CantidadMes) || 4);
        else if(nm.includes("MIRCERA") || nm.includes("METOXI")) counts["92"] = (counts["92"] || 0) + 1;
      });
      if(p._atb && p._atb.some(a => !a.Fin || a.Fin >= ms)) counts["86"] = (counts["86"] || 0) + 1;
    });

    /* 3. Sumar registros de oxigenoterapia */
    V30.oxiLog.forEach(o => {
      if(ST.eps && o.eps !== ST.eps) return;
      counts["3"] = (counts["3"] || 0) + 1;
      if(String(o.codSiis).startsWith("64")) counts["64"] = (counts["64"] || 0) + 1;
    });

    return { counts, byEps };
  }

  function v30EventosEstadisticasView(){
    ensureIdx();
    v30EnsureDemoData();
    const { counts, byEps } = v30ComputeSiisStats();
    const evDefs = SIIS_ACTIVIDADES_HD.filter(x => x.tipo === "EVENTO");
    const stDefs = SIIS_ACTIVIDADES_HD.filter(x => x.tipo === "ESTADISTICA");
    const totEvCount = evDefs.reduce((a, d) => a + (counts[d.no] || 0), 0);
    const totStCount = stDefs.reduce((a, d) => a + (counts[d.no] || 0), 0);
    const totSes = counts["61"] || 1;
    const tasaEv100 = (totEvCount / Math.max(1, totSes)) * 100;

    /* Combinar eventos de ST.book.evt + V30.siisActs (tipo EVENTO) para la tabla nominal */
    const allEventRows = [];
    V30.siisActs.forEach(r => {
      if(ST.eps && r.eps !== ST.eps) return;
      allEventRows.push(r);
    });
    ST.book.evt.filter(live).forEach(e => {
      const p = IDX.pac.get(e.Paciente);
      if(!p || !epsOk(p)) return;
      const t = norm(e.Tipo || "");
      let code = "81";
      if(t.includes("HIPOTENSION")) code = "4";
      else if(t.includes("HIPERTENSION")) code = "17";
      else if(t.includes("CALAMBRE")) code = "85";
      else if(t.includes("CEFALEA")) code = "14";
      else if(t.includes("VOMITO") || t.includes("NAUSEA")) code = "2";
      else if(t.includes("COAGULACION")) code = "21";
      else if(t.includes("SANGRADO")) code = "6";
      else if(t.includes("BACTERIEMIA") || t.includes("ITS")) code = "28";
      else if(t.includes("ORIFICIO") || t.includes("TUNEL")) code = "26";
      const def = SIIS_ACTIVIDADES_HD.find(x => x.no === code) || { no: code, act: e.Tipo, cat: "Complicaciones Clínicas Intradiálisis", prot: "GSH-PT-003" };
      allEventRows.push({
        id: e.ID,
        no: def.no,
        act: def.act,
        tipo: "EVENTO",
        cat: def.cat,
        prot: def.prot,
        fecha: iso(e.Fecha),
        pid: p.ID,
        pacNom: nombre(p),
        eps: p.EPS || "",
        turno: p.Turno || "",
        silla: p.Puesto || 1,
        sev: e.Severidad || "Leve",
        nota: e.Conducta || "",
        estado: e.Resuelto === "Sí" ? "Cerrado" : "En seguimiento",
        usuario: e.Usuario || "Enfermería HD"
      });
    });
    allEventRows.sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));

    const tab = V30.evTab || "eventos";
    let h =
      '<div class="v30-hero-banner">' +
        '<div class="mhead">' +
          '<div>' +
            '<p class="eyebrow">Eje 02 · Vigilancia Clínica, Estadística Operativa SIIS y Ciencia de Datos en Salud</p>' +
            '<h2 class="mt">Central de Eventos Adversos, Estadísticas SIIS (64 Códigos) y Analítica</h2>' +
            '<p class="note" style="margin:4px 0 0">Integra el catálogo oficial completo de las <b>64 Actividades que se registran en Hemodiálisis (SIIS)</b>, separando de forma inteligente los <b>31 Eventos Clínicos/Adversos</b> de las <b>33 Estadísticas Operativas y Asistenciales</b>, con análisis de Pareto, mapa de calor de las 13 sillas y descarga en Excel/CSV.</p>' +
          '</div>' +
          '<div class="copyrow">' +
            '<button type="button" class="btn sm primary" data-v30="siis_new|">+ Registrar Evento o Actividad SIIS</button>' +
            '<button type="button" class="btn sm" data-v30="exp_evstat_xlsx">📥 Descargar Reporte de Eventos y Estadísticas (.xlsx)</button>' +
            '<button type="button" class="btn sm" data-v30="exp_evstat_csv">📄 Descargar Plano SIIS (.csv)</button>' +
          '</div>' +
        '</div>' +
        '<div class="v30-kpi-grid">' +
          '<div class="v30-kpi-card"><span class="v30-kpi-val">64 Códigos</span><span class="v30-kpi-lbl">Catálogo Oficial SIIS Integrado</span><span class="v30-kpi-sub">31 Eventos · 33 Estadísticas</span></div>' +
          '<div class="v30-kpi-card ' + (tasaEv100 < 5 ? 'ok' : 'warn') + '"><span class="v30-kpi-val">' + totEvCount + '</span><span class="v30-kpi-lbl">Eventos Clínicos / Complicaciones</span><span class="v30-kpi-sub">Tasa: ' + f1(tasaEv100, 1) + ' por 100 sesiones</span></div>' +
          '<div class="v30-kpi-card ok"><span class="v30-kpi-val">' + totStCount.toLocaleString("es-CO") + '</span><span class="v30-kpi-lbl">Registros Estadísticos de Sala</span><span class="v30-kpi-sub">Sesiones, accesos, dosis y bioseguridad</span></div>' +
          '<div class="v30-kpi-card"><span class="v30-kpi-val">' + (counts["4"] || 0) + ' / ' + (counts["17"] || 0) + '</span><span class="v30-kpi-lbl">Hipotensión (Cód. 4) / HTA (Cód. 17)</span><span class="v30-kpi-sub">Protocolo GSH-PT-003</span></div>' +
          '<div class="v30-kpi-card ' + ((counts["28"]||0)+(counts["30"]||0) === 0 ? 'ok' : 'bad') + '"><span class="v30-kpi-val">' + ((counts["28"]||0)+(counts["30"]||0)) + ' / ' + ((counts["26"]||0)+(counts["27"]||0)+(counts["29"]||0)) + '</span><span class="v30-kpi-lbl">Bacteriemias (28/30) / Orificio-Túnel</span><span class="v30-kpi-sub">Protocolo GSH-PT-004</span></div>' +
        '</div>' +
        '<div class="seg" role="group">' +
          '<button type="button" data-v30="evtab|eventos" aria-pressed="' + (tab === "eventos") + '">🚨 1. Gestión de Eventos Clínicos y Complicaciones (31 Códigos)</button>' +
          '<button type="button" data-v30="evtab|estadisticas" aria-pressed="' + (tab === "estadisticas") + '">📊 2. Consolidado de Estadísticas Operativas SIIS (33 Códigos)</button>' +
          '<button type="button" data-v30="evtab|catalogo64" aria-pressed="' + (tab === "catalogo64") + '">📋 3. Catálogo Maestro de las 64 Actividades SIIS</button>' +
          '<button type="button" data-v30="evtab|analitica" aria-pressed="' + (tab === "analitica") + '">📈 4. Analítica de Datos (Pareto, Mapa de Calor 13 Sillas y EPS)</button>' +
        '</div>' +
      '</div>';

    if(tab === "eventos"){
      /* Resumen de los 31 códigos de Eventos + Bitácora nominal de eventos */
      h +=
        '<div class="panel" style="margin-bottom:14px">' +
          '<div class="mhead">' +
            '<div>' +
              '<h3 style="margin:0">Frecuencia por Tipo de Evento Clínico / Adverso en Hemodiálisis (31 Códigos SIIS de Eventos)</h3>' +
              '<p class="note" style="margin:2px 0 0">Haga clic en «+ Registrar» en cualquier fila para documentar inmediatamente ese evento en un paciente de la cohorte.</p>' +
            '</div>' +
          '</div>' +
          '<div class="tablebox" style="max-height:360px;margin-top:8px">' +
            '<table class="dense">' +
              '<thead><tr><th>Cód. SIIS</th><th>Evento / Complicación Clínica</th><th>Categoría</th><th>Protocolo Rector</th><th class="num">Casos en Periodo</th><th class="num">Tasa / 100 ses.</th><th>Acción</th></tr></thead>' +
              '<tbody>' +
                evDefs.slice().sort((a, b) => (counts[b.no] || 0) - (counts[a.no] || 0)).map(d => {
                  const n = counts[d.no] || 0;
                  const rate = (n / Math.max(1, totSes)) * 100;
                  return '<tr>' +
                    '<td class="mono"><span class="tag ' + (d.frecuente ? 'cac' : '') + '">No. ' + esc(d.no) + '</span></td>' +
                    '<td><strong>' + esc(d.act) + '</strong></td>' +
                    '<td>' + esc(d.cat) + '</td>' +
                    '<td class="mono" style="font-size:12px">' + esc(d.prot) + '</td>' +
                    '<td class="num mono"><strong>' + n + '</strong></td>' +
                    '<td class="num mono">' + f1(rate, 2) + ' %</td>' +
                    '<td><button type="button" class="btn sm primary" data-v30="siis_new||'+ esc(d.no) + '">+ Registrar</button></td>' +
                  '</tr>';
                }).join("") +
              '</tbody>' +
            '</table>' +
          '</div>' +
        '</div>' +
        '<div class="panel">' +
          '<div class="mhead">' +
            '<h3 style="margin:0">Bitácora Nominal de Eventos y Complicaciones Registradas (' + allEventRows.length + ')</h3>' +
          '</div>' +
          '<div class="tablebox" style="margin-top:8px">' +
            '<table class="dense">' +
              '<thead><tr><th>Fecha</th><th>Cód. SIIS</th><th>Paciente · EPS</th><th>Turno · Silla</th><th>Evento y Conducta Clínica</th><th>Severidad</th><th>Estado</th></tr></thead>' +
              '<tbody>' +
                allEventRows.slice(0, 80).map(r =>
                  '<tr>' +
                    '<td class="mono">' + esc(r.fecha) + '</td>' +
                    '<td class="mono"><span class="tag cac">No. ' + esc(r.no) + '</span></td>' +
                    '<td><strong>' + esc(r.pid) + '</strong> · ' + esc(r.pacNom) + '<span class="sub">' + esc(r.eps) + '</span></td>' +
                    '<td>' + esc(r.turno) + '<span class="sub mono">💺 Silla ' + esc(r.silla) + '</span></td>' +
                    '<td><strong>' + esc(r.act) + '</strong><span class="sub">' + esc(r.nota) + '</span></td>' +
                    '<td><span class="st ' + (r.sev === "Severa" ? "bad" : r.sev === "Moderada" ? "warn" : "base") + '">' + esc(r.sev) + '</span></td>' +
                    '<td><span class="st ' + (r.estado === "Cerrado" ? "ok" : "warn") + '">' + esc(r.estado) + '</span></td>' +
                  '</tr>'
                ).join("") +
              '</tbody>' +
            '</table>' +
          '</div>' +
        '</div>';
    } else if(tab === "estadisticas"){
      /* Consolidado de las 33 Estadísticas Operativas SIIS por grupo */
      const stGroups = [...new Set(stDefs.map(d => d.cat))];
      h += stGroups.map(gName => {
        const items = stDefs.filter(d => d.cat === gName);
        return (
          '<div class="panel" style="margin-bottom:14px">' +
            '<div class="mhead">' +
              '<h3 style="margin:0;color:var(--accent)">' + esc(gName) + ' (' + items.length + ' variables estadísticas SIIS)</h3>' +
            '</div>' +
            '<div class="tablebox" style="margin-top:8px">' +
              '<table class="dense">' +
                '<thead><tr><th style="width:90px">Cód. SIIS</th><th>Actividad Estadística Registrada en Hemodiálisis</th><th>Protocolo / Guía</th><th class="num">Total Periodo</th><th class="num">% sobre Sesiones</th><th>Acción</th></tr></thead>' +
                '<tbody>' +
                  items.map(d => {
                    const n = counts[d.no] || 0;
                    const pctSes = Math.min(100, (n / Math.max(1, totSes)) * 100);
                    return '<tr>' +
                      '<td class="mono"><span class="tag inst">No. ' + esc(d.no) + '</span></td>' +
                      '<td><strong>' + esc(d.act) + '</strong></td>' +
                      '<td class="mono" style="font-size:12px">' + esc(d.prot) + '</td>' +
                      '<td class="num mono"><strong style="font-size:15px">' + n.toLocaleString("es-CO") + '</strong></td>' +
                      '<td class="num mono">' + f1(pctSes, 1) + ' %</td>' +
                      '<td><button type="button" class="btn sm" data-v30="siis_new||' + esc(d.no) + '">+ Sumar registro</button></td>' +
                    '</tr>';
                  }).join("") +
                '</tbody>' +
              '</table>' +
            '</div>' +
          '</div>'
        );
      }).join("");
    } else if(tab === "catalogo64"){
      const q = norm(V30.evSearch || "");
      const list64 = SIIS_ACTIVIDADES_HD.filter(d => (!q || norm(d.no + " " + d.act + " " + d.cat + " " + d.prot).includes(q)));
      h +=
        '<div class="panel">' +
          '<div class="mhead" style="margin-bottom:10px">' +
            '<div>' +
              '<h3 style="margin:0">Catálogo Oficial Homologado de las 64 Actividades de Hemodiálisis (SIIS ↔ SIGC POSMÉDICA)</h3>' +
              '<p class="note" style="margin:2px 0 0">Incluye los 64 códigos exactos del listado físico institucional, clasificados en Eventos Clínicos (31) y Estadísticas Operativas (33).</p>' +
            '</div>' +
            '<input type="text" id="v30_evq" value="' + esc(V30.evSearch || "") + '" placeholder="Filtrar por código No. o actividad..." style="max-width:280px">' +
          '</div>' +
          '<div class="tablebox">' +
            '<table class="dense">' +
              '<thead><tr><th>No. SIIS</th><th>Actividad que se registra en Hemodiálisis</th><th>Clasificación en SIGC</th><th>Dominio / Categoría</th><th>Protocolo / GPC</th><th class="num">Acumulado</th><th></th></tr></thead>' +
              '<tbody>' +
                list64.map(d =>
                  '<tr>' +
                    '<td class="mono"><strong>' + esc(d.no) + '</strong>' + (d.frecuente ? ' <span class="tag cac" title="Actividad frecuente en sala">★</span>' : '') + '</td>' +
                    '<td><strong>' + esc(d.act) + '</strong></td>' +
                    '<td><span class="st ' + (d.tipo === "EVENTO" ? "bad" : "ok") + '">' + (d.tipo === "EVENTO" ? "EVENTO CLÍNICO" : "ESTADÍSTICA") + '</span></td>' +
                    '<td>' + esc(d.cat) + '</td>' +
                    '<td class="mono" style="font-size:12px">' + esc(d.prot) + '</td>' +
                    '<td class="num mono"><strong>' + (counts[d.no] || 0) + '</strong></td>' +
                    '<td><button type="button" class="btn sm primary" data-v30="siis_new||' + esc(d.no) + '">Registrar</button></td>' +
                  '</tr>'
                ).join("") +
              '</tbody>' +
            '</table>' +
          '</div>' +
        '</div>';
    } else if(tab === "analitica"){
      /* Analítica Avanzada: Diagrama de Pareto 80/20 + Mapa de Calor de las 13 Sillas + Tabla Comparativa por EPS */
      const topEv = evDefs.map(d => ({ d, n: counts[d.no] || 0 })).filter(x => x.n > 0).sort((a, b) => b.n - a.n).slice(0, 10);
      const sumEv = Math.max(1, topEv.reduce((a, x) => a + x.n, 0));
      let cum = 0;
      const paretoRows = topEv.map(x => {
        cum += x.n;
        return { no: x.d.no, act: x.d.act, n: x.n, pct: (x.n / sumEv) * 100, cumPct: (cum / sumEv) * 100 };
      });

      /* Construir SVG de Pareto */
      const W = 680, H = 250, L = 44, R = 44, T = 20, B = 58;
      const maxN = Math.max(1, ...(paretoRows.map(r => r.n)));
      const bw = (W - L - R) / Math.max(1, paretoRows.length);
      const X = i => L + i * bw + bw / 2;
      const Yn = v => T + (1 - v / (maxN * 1.15)) * (H - T - B);
      const Yp = p => T + (1 - p / 100) * (H - T - B);

      let svgPareto = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto;display:block">' +
        '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Yp(80) + '" y2="' + Yp(80) + '" stroke="var(--warn)" stroke-dasharray="5 4" stroke-width="1.5"/>' +
        '<text x="' + (W - R - 4) + '" y="' + (Yp(80) - 4) + '" text-anchor="end" fill="var(--warn)" font-family="var(--f-mono)" font-size="10" font-weight="700">Corte Pareto 80 %</text>';
      paretoRows.forEach((r, i) => {
        const bx = L + i * bw + bw * 0.18, w = bw * 0.64, by = Yn(r.n), bh = (H - B) - by;
        svgPareto += '<rect x="' + bx.toFixed(1) + '" y="' + by.toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + bh.toFixed(1) + '" rx="4" fill="var(--accent)" opacity="0.85"/>' +
          '<text x="' + X(i).toFixed(1) + '" y="' + (by - 5).toFixed(1) + '" text-anchor="middle" fill="var(--ink)" font-family="var(--f-mono)" font-size="11" font-weight="700">' + r.n + '</text>' +
          '<text x="' + X(i).toFixed(1) + '" y="' + (H - B + 16) + '" text-anchor="middle" fill="var(--ink)" font-family="var(--f-mono)" font-size="10.5" font-weight="700">Cód. ' + r.no + '</text>' +
          '<text x="' + X(i).toFixed(1) + '" y="' + (H - B + 30) + '" text-anchor="middle" fill="var(--muted)" font-family="var(--f-body)" font-size="9.5">' + esc(r.act.slice(0, 14)) + '…</text>';
      });
      if(paretoRows.length > 1){
        svgPareto += '<polyline fill="none" stroke="var(--bad)" stroke-width="2.5" points="' + paretoRows.map((r, i) => X(i).toFixed(1) + "," + Yp(r.cumPct).toFixed(1)).join(" ") + '"/>';
        paretoRows.forEach((r, i) => {
          svgPareto += '<circle cx="' + X(i).toFixed(1) + '" cy="' + Yp(r.cumPct).toFixed(1) + '" r="4" fill="var(--bad)" stroke="var(--surface)" stroke-width="1.5"/>' +
            '<text x="' + X(i).toFixed(1) + '" y="' + (Yp(r.cumPct) - 7).toFixed(1) + '" text-anchor="middle" fill="var(--bad)" font-family="var(--f-mono)" font-size="10" font-weight="700">' + Math.round(r.cumPct) + '%</text>';
        });
      }
      svgPareto += '</svg>';

      /* Mapa de calor de eventos por Silla (1 a 13) */
      const chairEv = {};
      for(let s = 1; s <= 13; s++) chairEv[s] = 0;
      allEventRows.forEach(r => { const s = num(r.silla) || 1; if(s >= 1 && s <= 13) chairEv[s] = (chairEv[s] || 0) + 1; });

      h +=
        '<div class="grid2" style="margin-bottom:14px">' +
          '<div class="panel">' +
            '<h3>Diagrama de Pareto (Ley 80/20) · Eventos Intradiálisis</h3>' +
            '<p class="note">Identifica los códigos SIIS que concentran el 80 % de las complicaciones en sala para focalizar las rondas de seguridad del protocolo <b>GSH-PT-003</b>.</p>' +
            '<div class="v30-chart-box" style="margin-top:8px">' + svgPareto + '</div>' +
          '</div>' +
          '<div class="panel">' +
            '<h3>Mapa de Calor de Eventos y Alarmas por Puesto (13 Sillas)</h3>' +
            '<p class="note">Permite al ingeniero biomédico y a enfermería detectar si una silla/máquina concentra alarmas técnicas (Cód. 5), coagulación (Cód. 21) o hipotensión (Cód. 4).</p>' +
            '<div class="v30-chairs-grid" style="margin-top:10px">' +
              Array.from({ length: 13 }, (_, i) => {
                const s = i + 1;
                const c = chairEv[s] || 0;
                const cls = c >= 5 ? "bad" : c >= 3 ? "warn" : "ok";
                return '<div class="v30-kpi-card ' + cls + '" style="padding:10px">' +
                  '<div class="copyrow" style="justify-content:space-between"><strong class="mono">Silla ' + s + '</strong><span class="st ' + cls + '">' + (c >= 5 ? "Alta" : c >= 3 ? "Media" : "Baja") + '</span></div>' +
                  '<span class="v30-kpi-val" style="font-size:20px">' + c + ' ev.</span>' +
                  '<span class="v30-kpi-lbl">Máquina M' + String(s).padStart(2, "0") + '</span>' +
                '</div>';
              }).join("") +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="panel">' +
          '<h3>Matriz Analítica de Eventos y Estadísticas SIIS Diferenciada por EPS</h3>' +
          '<div class="tablebox" style="margin-top:8px">' +
            '<table class="dense">' +
              '<thead><tr><th>EPS / Pagador</th><th class="num">Pacientes Activos</th><th class="num">Sesiones Realizadas (Cód. 61)</th><th class="num">Eventos Clínicos</th><th class="num">Tasa Eventos / 100 ses.</th><th class="num">% FAV Funcional</th><th>Evaluación Analítica</th></tr></thead>' +
              '<tbody>' +
                Object.entries(byEps).map(([eps, d]) => {
                  const pEps = pacs().filter(p => p.EPS === eps && activeAt(p, ST.corte));
                  const favN = pEps.filter(p => (accessAt(p, ST.corte) || p.AccesoActual) === "FAV").length;
                  const rate = d.ses ? (d.ev / d.ses) * 100 : 0;
                  return '<tr>' +
                    '<td><strong>' + esc(eps) + '</strong></td>' +
                    '<td class="num mono">' + pEps.length + '</td>' +
                    '<td class="num mono">' + d.ses + '</td>' +
                    '<td class="num mono"><strong>' + d.ev + '</strong></td>' +
                    '<td class="num mono"><span class="st ' + (rate <= 5 ? "ok" : rate <= 8 ? "warn" : "bad") + '">' + f1(rate, 1) + ' %</span></td>' +
                    '<td class="num mono">' + (pEps.length ? Math.round(favN / pEps.length * 100) + " %" : "—") + '</td>' +
                    '<td class="note">' + (rate <= 5 ? "Estabilidad hemodinámica óptima" : "Focalizar control de GID y peso seco en esta cohorte") + '</td>' +
                  '</tr>';
                }).join("") +
              '</tbody>' +
            '</table>' +
          '</div>' +
        '</div>';
    }
    return h;
  }

  /* ===================================================================================================
     12. EJE 05 · PESTAÑA 2: FORMATO Y CALCULADORA DE CONTROL DE OXÍGENO MEDICINAL (GFA-FO-OXI-001)
     =================================================================================================== */
  const OXI_FACTORES = {
    "E": { nom: "Cilindro Tipo E Portátil (0,68 m³ / 680 L)", factor: 0.28 },
    "M": { nom: "Cilindro Tipo M Estacionario Mediano (3,45 m³ / 3.450 L)", factor: 1.56 },
    "J": { nom: "Cilindro Tipo J/K Estacionario Grande (6,80 m³ / 6.800 L)", factor: 2.41 },
    "BALA": { nom: "Bala Portátil de Transporte (0,40 m³ / 400 L)", factor: 0.16 },
    "RED": { nom: "Concentrador / Red Central de Oxígeno", factor: 0 }
  };

  function v30OxigenoControlView(inFarModule){
    ensureIdx();
    v30EnsureDemoData();
    const act = hdOn() ? pacs().filter(p => activeAt(p, ST.corte)) : [];
    const O = V30.oxiCalc;
    const fInfo = OXI_FACTORES[O.cilindro] || OXI_FACTORES.M;
    const psiUtil = Math.max(0, (num(O.psiIni) || 0) - 200);
    const litrosDisp = O.cilindro === "RED" ? 99999 : Math.round(psiUtil * fInfo.factor);
    const autonomiaMin = (num(O.flujo) || 1) > 0 ? Math.round(litrosDisp / (num(O.flujo) || 1)) : 0;
    const consumoLitros = Math.round((num(O.flujo) || 0) * (num(O.min) || 0));
    const consumoM3 = (consumoLitros / 1000).toFixed(3);
    const suficiente = O.cilindro === "RED" || litrosDisp >= consumoLitros;

    const totLitrosMes = V30.oxiLog.reduce((a, r) => a + (num(r.litros) || 0), 0);
    const totM3Mes = (totLitrosMes / 1000).toFixed(2);
    const cilAlert = V30.oxiCylinders.filter(c => c.psi < 500).length;

    let h =
      '<div class="v30-hero-banner">' +
        '<div class="mhead">' +
          '<div>' +
            '<p class="eyebrow">Gestión Farmacéutica y Gases Medicinales · Formato Estandarizado GFA-FO-OXI-001</p>' +
            '<h2 class="mt">Control de Oxígeno Medicinal, Autonomía de Cilindros y Trazabilidad por Paciente</h2>' +
            '<p class="note" style="margin:4px 0 0">Lleva el control técnico, clínico y farmacéutico del oxígeno medicinal en la Unidad Renal (13 sillas y carro de paro): cálculo exacto de consumo en Litros y m³, presión manométrica (PSI), lote/vencimiento FEFO y vinculación automática con los códigos SIIS <b>64</b> y <b>3</b>.</p>' +
          '</div>' +
          '<div class="copyrow">' +
            '<button type="button" class="btn sm primary" data-v30="oxi_exp_xlsx">📥 Descargar Formato Oficial de Oxígeno (.xlsx)</button>' +
            '<button type="button" class="btn sm" data-accion="imprimir">🖨️ Imprimir Formato GFA-FO-OXI-001</button>' +
          '</div>' +
        '</div>' +
        '<div class="v30-kpi-grid">' +
          '<div class="v30-kpi-card ok"><span class="v30-kpi-val">' + totLitrosMes.toLocaleString("es-CO") + ' L</span><span class="v30-kpi-lbl">Volumen administrado en el mes</span><span class="v30-kpi-sub">Equivalente a ' + totM3Mes + ' m³</span></div>' +
          '<div class="v30-kpi-card"><span class="v30-kpi-val">' + V30.oxiLog.length + '</span><span class="v30-kpi-lbl">Sesiones con oxigenoterapia</span><span class="v30-kpi-sub">Códigos SIIS 3 y 64 sincronizados</span></div>' +
          '<div class="v30-kpi-card ' + (cilAlert ? 'warn' : 'ok') + '"><span class="v30-kpi-val">' + V30.oxiCylinders.length + ' cilindros</span><span class="v30-kpi-lbl">Inventario en Sala y Carro de Paro</span><span class="v30-kpi-sub">' + (cilAlert ? cilAlert + ' requiere recarga (< 500 PSI)' : 'Todos con presión óptima') + '</span></div>' +
          '<div class="v30-kpi-card"><span class="v30-kpi-val">96,0 %</span><span class="v30-kpi-lbl">SatO2 Post-Oxigenoterapia promedio</span><span class="v30-kpi-sub">Recuperación clínica verificada</span></div>' +
        '</div>' +
      '</div>';

    /* Calculadora de Autonomía y Consumo + Formulario de Registro GFA-FO-OXI-001 */
    h +=
      '<div class="grid2" style="margin-bottom:14px">' +
        '<div class="panel" style="border-top:4px solid var(--accent)">' +
          '<h3>1. Calculadora de Consumo y Autonomía de Cilindro de Oxígeno</h3>' +
          '<p class="note">Fórmula farmacéutica: <code>Litros disponibles = (PSI manómetro - 200 PSI residual) × Factor del cilindro</code>.</p>' +
          '<div class="form" style="margin-top:10px">' +
            '<label class="f wide">Tipo de cilindro / fuente<select id="v30_oxc_cil">' +
              Object.entries(OXI_FACTORES).map(([k, v]) => '<option value="' + k + '"' + (O.cilindro === k ? ' selected' : '') + '>' + esc(v.nom) + '</option>').join("") +
            '</select></label>' +
            '<label class="f">Presión actual manómetro (PSI)<input type="number" step="50" id="v30_oxc_psi" value="' + O.psiIni + '"></label>' +
            '<label class="f">Flujo prescrito (L/min)<input type="number" step="0.5" id="v30_oxc_flujo" value="' + O.flujo + '"></label>' +
            '<label class="f">Tiempo de administración (min)<input type="number" step="10" id="v30_oxc_min" value="' + O.min + '"></label>' +
          '</div>' +
          '<div class="copyrow" style="margin-top:10px">' +
            '<button type="button" class="btn sm primary" data-v30="oxi_calc_btn">Calcular Autonomía y Consumo</button>' +
          '</div>' +
          '<div class="v30-kpi-grid" style="margin-top:12px">' +
            '<div class="v30-kpi-card"><span class="v30-kpi-val">' + (O.cilindro === "RED" ? "Continuo" : litrosDisp.toLocaleString("es-CO") + " L") + '</span><span class="v30-kpi-lbl">Volumen seguro disponible</span><span class="v30-kpi-sub">Descontando 200 PSI residuales</span></div>' +
            '<div class="v30-kpi-card ' + (suficiente ? 'ok' : 'bad') + '"><span class="v30-kpi-val">' + (O.cilindro === "RED" ? "Ilimitada" : Math.floor(autonomiaMin / 60) + " h " + (autonomiaMin % 60) + " min") + '</span><span class="v30-kpi-lbl">Autonomía a ' + O.flujo + ' L/min</span><span class="v30-kpi-sub">' + (suficiente ? '✔ Cubre la sesión (' + O.min + ' min)' : '⚠ Insuficiente para ' + O.min + ' min') + '</span></div>' +
            '<div class="v30-kpi-card ok"><span class="v30-kpi-val">' + consumoLitros.toLocaleString("es-CO") + ' L</span><span class="v30-kpi-lbl">Consumo de la sesión</span><span class="v30-kpi-sub">' + consumoM3 + ' m³ (' + O.flujo + ' L/min × ' + O.min + ' min)</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="panel" style="border-top:4px solid var(--ok)">' +
          '<h3>2. Registrar Administración en Formato de Control de Oxígeno (GFA-FO-OXI-001)</h3>' +
          '<div class="form" style="margin-top:8px">' +
            '<label class="f">Fecha<input type="date" id="v30_ox_f" value="' + iso(TODAY()) + '"></label>' +
            '<label class="f">Turno<select id="v30_ox_t">' + opt(turnoNames(), "L-M-V Mañana") + '</select></label>' +
            '<label class="f">Silla (1–13)<select id="v30_ox_s">' + opt(Array.from({length:13},(_,i)=>String(i+1)), "1") + '</select></label>' +
            '<label class="f wide">Paciente *<select id="v30_ox_p">' +
              (act.length ? act.map(p => '<option value="' + esc(p.ID) + '">' + esc(p.ID + " · " + nombre(p) + " (" + (p.EPS || "") + ")") + '</option>').join("") : '<option value="P001">P001 · Paciente en Sala</option>') +
            '</select></label>' +
            '<label class="f wide">Código SIIS asociado<select id="v30_ox_siis">' +
              '<option value="3 · SE REALIZA SESIÓN CON OXIGENOTERAPIA">Cód. SIIS 3 · SE REALIZA SESIÓN CON OXIGENOTERAPIA</option>' +
              '<option value="64 · POR ORDEN MEDICA SE ADMINISTRA OXÍGENO">Cód. SIIS 64 · POR ORDEN MEDICA SE ADMINISTRA OXÍGENO</option>' +
            '</select></label>' +
            '<label class="f">Dispositivo<select id="v30_ox_disp">' + opt(["Cánula nasal","Máscara Venturi","Máscara simple","Máscara con reservorio"], "Cánula nasal") + '</select></label>' +
            '<label class="f">Flujo (L/min)<input type="number" step="0.5" id="v30_ox_fl" value="2"></label>' +
            '<label class="f">Duración (min)<input type="number" step="5" id="v30_ox_min" value="180"></label>' +
            '<label class="f">SatO2 Inicial (%)<input type="number" id="v30_ox_sp1" value="88"></label>' +
            '<label class="f">SatO2 Final (%)<input type="number" id="v30_ox_sp2" value="96"></label>' +
            '<label class="f">Cilindro utilizado<select id="v30_ox_cil">' + V30.oxiCylinders.map(c => '<option value="' + esc(c.id) + '">' + esc(c.id + " (" + c.psi + " PSI · Lote " + c.lote + ")") + '</option>').join("") + '</select></label>' +
            '<label class="f">Presión inicial (PSI)<input type="number" id="v30_ox_psi1" value="1800"></label>' +
            '<label class="f">Presión final (PSI)<input type="number" id="v30_ox_psi2" value="1550"></label>' +
            '<label class="f wide">Indicación clínica / Observación<input type="text" id="v30_ox_ind" value="Hipoxemia intradiálisis (SatO2 < 90%) + soporte hemodinámico"></label>' +
          '</div>' +
          '<div class="copyrow" style="margin-top:10px">' +
            '<button type="button" class="btn primary" data-v30="oxi_save">Guardar Registro en Formato de Oxígeno y Sincronizar SIIS</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    /* Kárdex de Cilindros de Oxígeno en Sala + Bitácora Histórica GFA-FO-OXI-001 */
    h +=
      '<div class="panel" style="margin-bottom:14px">' +
        '<h3>3. Kárdex de Cilindros de Oxígeno Medicinal en Unidad Renal (Sillas 1–13 y Carro de Paro)</h3>' +
        '<div class="tablebox" style="margin-top:8px">' +
          '<table class="dense">' +
            '<thead><tr><th>Código Cilindro</th><th>Tipo · Capacidad</th><th>Ubicación Asignada</th><th>Lote · Vencimiento FEFO</th><th class="num">Presión Actual (PSI)</th><th class="num">Volumen Restante</th><th>Estado / Semáforo</th></tr></thead>' +
            '<tbody>' +
              V30.oxiCylinders.map(c => {
                const lit = Math.max(0, Math.round((c.psi - 200) * c.factor));
                const cls = c.psi < 500 ? "bad" : c.psi < 1000 ? "warn" : "ok";
                return '<tr>' +
                  '<td class="mono"><strong>' + esc(c.id) + '</strong></td>' +
                  '<td>Tipo ' + esc(c.tipo) + ' (' + c.capM3 + ' m³)</td>' +
                  '<td>' + esc(c.ubicacion) + '</td>' +
                  '<td class="mono">' + esc(c.lote) + ' · Vence ' + esc(c.vence) + '</td>' +
                  '<td class="num mono"><strong>' + c.psi + ' PSI</strong></td>' +
                  '<td class="num mono">' + lit.toLocaleString("es-CO") + ' L</td>' +
                  '<td><span class="st ' + cls + '">' + esc(c.psi < 500 ? "Recarga Urgente (< 500 PSI)" : c.estado) + '</span></td>' +
                '</tr>';
              }).join("") +
            '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>' +
      '<div class="panel">' +
        '<h3>4. Bitácora Oficial de Control de Administración de Oxígeno (GFA-FO-OXI-001 · ' + V30.oxiLog.length + ' registros)</h3>' +
        '<div class="tablebox" style="margin-top:8px">' +
          '<table class="dense">' +
            '<thead><tr><th>ID · Fecha</th><th>Turno · Silla</th><th>Paciente · EPS</th><th>Código SIIS e Indicación</th><th>Dispositivo · Flujo · Tiempo</th><th class="num">SatO2 (Pre→Post)</th><th>Cilindro · PSI (Ini→Fin)</th><th class="num">Consumo (L / m³)</th><th>Responsable</th></tr></thead>' +
            '<tbody>' +
              V30.oxiLog.slice().reverse().map(r =>
                '<tr>' +
                  '<td class="mono"><strong>' + esc(r.id) + '</strong><span class="sub">' + esc(r.fecha) + '</span></td>' +
                  '<td>' + esc(r.turno) + '<span class="sub mono">💺 Silla ' + esc(r.silla) + '</span></td>' +
                  '<td><strong>' + esc(r.pid) + '</strong> · ' + esc(r.pacNom) + '<span class="sub">' + esc(r.eps) + '</span></td>' +
                  '<td><span class="tag cac">' + esc(r.codSiis) + '</span><span class="sub">' + esc(r.indicacion) + '</span></td>' +
                  '<td class="mono">' + esc(r.disp) + ' · <b>' + r.flujo + ' L/min</b> × ' + r.min + ' min</td>' +
                  '<td class="num mono"><span class="st warn">' + r.satPre + '%</span> → <span class="st ok">' + r.satPost + '%</span></td>' +
                  '<td class="mono">' + esc(r.cilindro) + '<span class="sub">' + r.psiIni + ' → ' + r.psiFin + ' PSI (Lote ' + esc(r.lote) + ')</span></td>' +
                  '<td class="num mono"><strong>' + r.litros.toLocaleString("es-CO") + ' L</strong><span class="sub">' + r.m3 + ' m³</span></td>' +
                  '<td>' + esc(r.resp) + '</td>' +
                '</tr>'
              ).join("") +
            '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>';

    return h;
  }

  /* ===================================================================================================
     13. EJE 06 · PESTAÑA 1: INDICADORES DE HEMODIÁLISIS CON GRÁFICAS MODERNAS, EVOLUCIÓN, META Y EPS
     =================================================================================================== */
  function v30BigChartSvg(pts, def){
    const W = 660, H = 240, L = 48, R = 24, T = 22, B = 38;
    const isP = def.t === "pct";
    const vals = pts.map(p => p.v).filter(x => x != null).map(v => isP ? v * 100 : v);
    const mi = metaOf(def);
    const cutVal = def.cuts ? def.cuts[0] : (mi != null ? mi : null);
    let mx = isP ? 100 : Math.max(1, ...vals, ...(def.cuts || []), mi || 0) * 1.2;
    const X = i => L + i * (W - L - R) / Math.max(1, pts.length - 1);
    const Y = v => T + (1 - Math.min(mx, Math.max(0, v)) / mx) * (H - T - B);
    const M = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

    let s = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Evolución mensual de ' + esc(def.n) + '">' +
      '<defs>' +
        '<linearGradient id="v30AreaGrad" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0%" stop-color="var(--accent)" stop-opacity="0.34"/>' +
          '<stop offset="100%" stop-color="var(--accent)" stop-opacity="0.02"/>' +
        '</linearGradient>' +
      '</defs>';

    /* Banda verde de zona de cumplimiento respecto a la meta */
    if(cutVal != null){
      const yCut = Y(cutVal);
      if(def.dir === "down"){
        s += '<rect x="' + L + '" y="' + yCut.toFixed(1) + '" width="' + (W - L - R) + '" height="' + Math.max(0, (H - B) - yCut).toFixed(1) + '" fill="var(--ok-soft)" opacity="0.55"/>';
      } else {
        s += '<rect x="' + L + '" y="' + T + '" width="' + (W - L - R) + '" height="' + Math.max(0, yCut - T).toFixed(1) + '" fill="var(--ok-soft)" opacity="0.55"/>';
      }
    }

    /* Líneas guía horizontales */
    const ticks = isP ? [0, 25, 50, 75, 100] : [0, mx / 2, mx].map(v => Math.round(v * 100) / 100);
    ticks.forEach(t => {
      s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(t).toFixed(1) + '" y2="' + Y(t).toFixed(1) + '" stroke="var(--line)" stroke-width="1"/>' +
        '<text class="ax" x="' + (L - 8) + '" y="' + (Y(t) + 4).toFixed(1) + '" text-anchor="end">' + (isP ? t + "%" : f1(t, 1)) + '</text>';
    });

    /* Línea punteada de Meta CAC / Institucional */
    if(cutVal != null){
      const yM = Y(cutVal);
      s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + yM.toFixed(1) + '" y2="' + yM.toFixed(1) + '" stroke="var(--ok)" stroke-dasharray="6 4" stroke-width="2"/>' +
        '<rect x="' + (W - R - 138) + '" y="' + Math.max(4, yM - 19).toFixed(1) + '" width="134" height="17" rx="4" fill="var(--surface)" stroke="var(--ok)"/>' +
        '<text x="' + (W - R - 71) + '" y="' + Math.max(16, yM - 7).toFixed(1) + '" text-anchor="middle" fill="var(--ok)" font-family="var(--f-mono)" font-size="10.5" font-weight="700">META: ' + (def.dir === "down" ? "≤ " : "≥ ") + cutVal + (isP ? " %" : "") + '</text>';
    }

    const d = pts.map((p, i) => p.v == null ? null : [X(i), Y(isP ? p.v * 100 : p.v), p]).filter(Boolean);
    if(d.length > 1){
      const areaPts = d[0][0].toFixed(1) + "," + (H - B) + " " + d.map(q => q[0].toFixed(1) + "," + q[1].toFixed(1)).join(" ") + " " + d[d.length - 1][0].toFixed(1) + "," + (H - B);
      s += '<polygon points="' + areaPts + '" fill="url(#v30AreaGrad)"/>';
      s += '<polyline fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="' + d.map(q => q[0].toFixed(1) + "," + q[1].toFixed(1)).join(" ") + '"/>';
    }
    d.forEach((q, i) => {
      const last = i === d.length - 1;
      const st = statusOf(def, q[2].v);
      const dotColor = st === "alto" ? "var(--ok)" : st === "medio" ? "var(--warn)" : st === "bajo" ? "var(--bad)" : "var(--accent)";
      s += '<circle cx="' + q[0].toFixed(1) + '" cy="' + q[1].toFixed(1) + '" r="' + (last ? 5.5 : 4) + '" fill="' + dotColor + '" stroke="var(--surface)" stroke-width="2"/>' +
        '<text class="val" x="' + q[0].toFixed(1) + '" y="' + Math.max(14, q[1] - 9).toFixed(1) + '" text-anchor="middle" style="font-size:11px">' + fmtVal(def, q[2].v) + '</text>';
    });
    pts.forEach((p, i) => {
      s += '<text class="ax" x="' + X(i).toFixed(1) + '" y="' + (H - 12) + '" text-anchor="middle" style="font-weight:600">' + M[p.d.getMonth()] + ' ' + String(p.d.getFullYear()).slice(2) + '</text>';
    });
    return s + '</svg>';
  }

  /* Gráfica comparativa por EPS con barra de progreso y línea de Meta para el indicador seleccionado */
  function v30EpsComparisonChart(def){
    const epsArr = epsList().filter(e => e !== "OTRA");
    const isP = def.t === "pct";
    const mi = metaOf(def);
    const cutVal = def.cuts ? def.cuts[0] : (mi != null ? mi : null);

    const rows = [["TODAS LAS EPS (GLOBAL IPS)", ""]].concat(epsArr.map(e => [e, e])).map(([lbl, eCode]) => {
      const x = ctxFor(ST.corte, ST.ps, eCode);
      const r = evalInd(def, x);
      const numVal = r.val == null ? null : (isP ? r.val * 100 : r.val);
      return { lbl, eCode, r, numVal };
    }).filter(x => !x.eCode || x.r.d > 0);

    const maxScale = isP ? 100 : Math.max(1, ...rows.map(x => x.numVal || 0), cutVal || 0) * 1.25;
    const targetPct = cutVal != null ? Math.min(98, Math.max(2, (cutVal / maxScale) * 100)) : null;

    let h = '<div class="v30-chart-box">' +
      '<div class="copyrow" style="justify-content:space-between;margin-bottom:10px">' +
        '<strong style="font-size:13.5px;color:var(--ink)">Desempeño Diferenciado por EPS frente a la Meta (' + esc(def.c) + ')</strong>' +
        (cutVal != null ? '<span class="tag fav">Meta: ' + (def.dir === "down" ? "≤ " : "≥ ") + cutVal + (isP ? " %" : " " + (def.unit || "")) + '</span>' : '<span class="tag">Indicador descriptivo / línea de base</span>') +
      '</div>';

    rows.forEach(row => {
      const wPct = row.numVal != null ? Math.min(100, Math.max(2, (row.numVal / maxScale) * 100)) : 0;
      const st = row.r.status;
      const fillCls = st === "alto" ? "ok" : st === "medio" ? "warn" : st === "bajo" ? "bad" : "base";
      let gapTxt = "";
      if(cutVal != null && row.numVal != null){
        const diff = def.dir === "down" ? (cutVal - row.numVal) : (row.numVal - cutVal);
        gapTxt = (diff >= 0 ? '✔ Cumple (' + (diff >= 0 ? '+' : '') + f1(diff, 1) + ')' : '⚠ Brecha ' + f1(diff, 1));
      }
      h +=
        '<div class="v30-eps-bar-row">' +
          '<div>' +
            '<strong style="font-size:12.5px;display:block;color:' + (row.eCode ? 'var(--ink)' : 'var(--accent)') + '">' + esc(row.lbl) + '</strong>' +
            '<span class="sub mono">Num/Den: ' + f1(row.r.n, 0) + ' / ' + f1(row.r.d, def.t === "rate" ? 1 : 0) + '</span>' +
          '</div>' +
          '<div class="v30-eps-track">' +
            '<div class="v30-eps-fill ' + fillCls + '" style="width:' + wPct.toFixed(1) + '%"></div>' +
            (targetPct != null ? '<div class="v30-eps-target" style="left:' + targetPct.toFixed(1) + '%" data-lbl="Meta ' + cutVal + (isP ? '%' : '') + '"></div>' : '') +
          '</div>' +
          '<div style="text-align:right">' +
            '<strong class="mono" style="font-size:14px;display:block">' + fmtVal(def, row.r.val) + '</strong>' +
            '<span class="sub" style="font-size:11px;color:' + (st === "alto" ? "var(--ok)" : st === "bajo" ? "var(--bad)" : "var(--muted)") + '">' + esc(gapTxt || ST_TXT[st]) + '</span>' +
          '</div>' +
        '</div>';
    });
    h += '</div>';
    return h;
  }

  /* Reemplazar vInd() para ofrecer una visualización clara, estética, con Evolución, Meta y Comparativa por EPS */
  const ST_TXT = typeof STATUS_TXT !== "undefined" ? STATUS_TXT : { alto: "Cumplimiento Alto", medio: "Cumplimiento Medio", bajo: "Cumplimiento Bajo", base: "Línea de Base", sd: "Sin Dato" };
  const vInd0 = typeof vInd === "function" ? vInd : null;
  vInd = function(){
    ensureIdx();
    const x = ctxFor(ST.corte, ST.ps, ST.eps);
    const R = IND.map(d => {
      const r = evalInd(d, x);
      r.tr = trendPoints(d, 6);
      return r;
    });
    const cnt = s => R.filter(r => !r.def.inst && r.status === s).length;
    const totConMeta = cnt("alto") + cnt("medio") + cnt("bajo");
    const pctGlobal = totConMeta ? Math.round((cnt("alto") / totConMeta) * 100) : 0;

    const catOf = c => {
      if(["dia_10_adul","dia_33_adul","dia_34_adul","ins_its"].includes(c)) return "ACC";
      if(["dia_11_adul","dia_13_adul","dia_20_adul","ins_gid","ins_cal"].includes(c)) return "ADEC";
      if(["dia_15_adul","dia_17_adul","dia_27_adul","dia_29_adul","ins_glu"].includes(c)) return "TMO";
      return "OTR";
    };
    const catF = V30.indCatFilter || "ALL";
    const Rfilt = R.filter(r => catF === "ALL" || catOf(r.def.c) === catF);
    const selR = R.find(z => z.def.c === ST.sel.ind) || R[0];
    const dSel = selR.def;

    let h =
      '<div class="v30-hero-banner">' +
        '<div class="mhead">' +
          '<div>' +
            '<p class="eyebrow">Eje 06 · Tablero Visual de Indicadores Clínicos CAC 2026 e Institucionales</p>' +
            '<h2 class="mt">Indicadores de Desenlace y Proceso · Evolución, Meta y Diferenciación por EPS</h2>' +
            '<p class="note" style="margin:4px 0 0">Corte <b>' + fd(ST.corte) + '</b> · Periodo desde <b>' + fd(ST.ps) + '</b> · ' + (ST.eps ? 'Filtrado por EPS: <b>' + esc(ST.eps) + '</b>' : 'Mostrando <b>Todas las EPS</b> con comparativa lado a lado') + '.</p>' +
          '</div>' +
          '<div class="copyrow">' +
            '<label class="f" style="flex-direction:row;align-items:center;gap:6px">Filtrar EPS:' +
              '<select id="v30_ind_eps" style="min-width:170px">' + opt([["","Todas las EPS (Comparativo)"]].concat(epsList().map(e => [e, e])), ST.eps) + '</select>' +
            '</label>' +
            '<button type="button" class="btn sm" data-a="corfreeze">❄️ Congelar corte</button>' +
            '<button type="button" class="btn sm primary" data-a="rep|ind">📥 Exportar Indicadores por EPS (.xlsx)</button>' +
          '</div>' +
        '</div>' +
        '<div class="v30-kpi-grid">' +
          '<div class="v30-kpi-card ok"><span class="v30-kpi-val">' + cnt("alto") + ' (' + pctGlobal + ' %)</span><span class="v30-kpi-lbl">En Cumplimiento Alto (Meta CAC)</span><span class="v30-kpi-sub">Sobre ' + totConMeta + ' indicadores con umbral</span></div>' +
          '<div class="v30-kpi-card warn"><span class="v30-kpi-val">' + cnt("medio") + '</span><span class="v30-kpi-lbl">En Cumplimiento Medio</span><span class="v30-kpi-sub">En seguimiento preventivo</span></div>' +
          '<div class="v30-kpi-card bad"><span class="v30-kpi-val">' + cnt("bajo") + '</span><span class="v30-kpi-lbl">En Cumplimiento Bajo</span><span class="v30-kpi-sub">Requieren acción PAMEC</span></div>' +
          '<div class="v30-kpi-card"><span class="v30-kpi-val">' + R.filter(r => !r.def.inst && r.status === "base").length + ' / ' + R.filter(r => r.def.inst).length + '</span><span class="v30-kpi-lbl">Línea de Base CAC / Institucionales</span><span class="v30-kpi-sub">Monitoreo integral 24 indicadores</span></div>' +
        '</div>' +
        '<div class="copyrow" style="justify-content:space-between">' +
          '<div class="seg" role="group">' +
            '<button type="button" data-v30="indcat|ALL" aria-pressed="' + (catF === "ALL") + '">Todos (' + R.length + ')</button>' +
            '<button type="button" data-v30="indcat|ACC" aria-pressed="' + (catF === "ACC") + '">Acceso Vascular e IAAS</button>' +
            '<button type="button" data-v30="indcat|ADEC" aria-pressed="' + (catF === "ADEC") + '">Adecuación UKM y Anemia 2026</button>' +
            '<button type="button" data-v30="indcat|TMO" aria-pressed="' + (catF === "TMO") + '">TMO-ERC, Nutrición y DM</button>' +
            '<button type="button" data-v30="indcat|OTR" aria-pressed="' + (catF === "OTR") + '">Trasplante, Adherencia y Eventos</button>' +
          '</div>' +
          '<div class="seg" role="group">' +
            '<button type="button" data-v30="indmode|both" aria-pressed="' + (V30.indViewMode !== "matrix") + '">📊 Gráficas de Evolución y EPS</button>' +
            '<button type="button" data-v30="indmode|matrix" aria-pressed="' + (V30.indViewMode === "matrix") + '">🧮 Matriz Semáforo Multi-EPS</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    /* Panel Gráfico Superior del Indicador Seleccionado: Evolución Temporal + Comparativa por EPS */
    h +=
      '<div class="panel" style="margin-bottom:14px;border-left:5px solid var(--accent)">' +
        '<div class="mhead" style="margin-bottom:10px">' +
          '<div>' +
            '<div class="copyrow" style="gap:8px;margin-bottom:4px">' +
              '<span class="tag ' + (dSel.inst ? 'inst' : 'cac') + '">' + esc(dSel.c) + '</span>' +
              '<span class="st ' + selR.status + '">' + esc(ST_TXT[selR.status]) + '</span>' +
              '<span class="tag">Meta: ' + esc(metaTxt(dSel)) + '</span>' +
            '</div>' +
            '<h3 style="margin:0;font-size:18px;color:var(--ink);text-transform:none">' + esc(dSel.n) + '</h3>' +
            '<p class="note" style="margin:2px 0 0"><b>Ventana:</b> ' + esc(dSel.win) + ' · <b>Fuente:</b> ' + esc(dSel.src) + '</p>' +
          '</div>' +
          '<div style="text-align:right">' +
            '<div class="mono" style="font-size:34px;font-weight:700;color:var(--accent);line-height:1">' + fmtVal(dSel, selR.val) + '</div>' +
            '<span class="sub mono">' + (dSel.t === "rate" ? esc(selR.expl || "") : f1(selR.n, 0) + " cumple(n) de " + f1(selR.d, 0) + " en denominador") + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="grid2">' +
          '<div class="v30-chart-box">' +
            '<div class="copyrow" style="justify-content:space-between;margin-bottom:6px">' +
              '<strong style="font-size:13.5px;color:var(--ink)">Evolución Temporal (Últimos 6 Cortes Mensuales) vs. Meta</strong>' +
              '<span class="sub">' + (ST.eps ? esc(ST.eps) : 'Total Cohorte POSMÉDICA') + '</span>' +
            '</div>' +
            v30BigChartSvg(selR.tr, dSel) +
          '</div>' +
          v30EpsComparisonChart(dSel) +
        '</div>' +
      '</div>';

    if(V30.indViewMode === "matrix"){
      /* Matriz Comparativa Multi-EPS (Todos los Indicadores × Todas las EPS) */
      const epsCols = epsList().filter(e => e !== "OTRA");
      h +=
        '<div class="panel" style="margin-bottom:14px">' +
          '<h3>Matriz Comparativa Integral de Indicadores Diferenciada por EPS</h3>' +
          '<p class="note">Comparación simultánea del nivel de cumplimiento de cada indicador en cada EPS contratada. Haga clic en cualquier fila para ver sus gráficas de evolución y nominal de pacientes.</p>' +
          '<div class="tablebox" style="margin-top:8px">' +
            '<table class="dense indt">' +
              '<thead><tr><th>Código</th><th>Indicador</th><th>Meta CAC / Inst.</th><th class="num">Total IPS</th>' + epsCols.map(e => '<th class="num">' + esc(e) + '</th>').join("") + '</tr></thead>' +
              '<tbody>' +
                Rfilt.map(r => {
                  const d = r.def;
                  const sel = ST.sel.ind === d.c;
                  return '<tr data-a="isel|' + d.c + '" class="' + (sel ? 'sel' : '') + '">' +
                    '<td class="mono"><span class="tag ' + (d.inst ? 'inst' : 'cac') + '">' + esc(d.c) + '</span></td>' +
                    '<td><strong>' + esc(d.n) + '</strong></td>' +
                    '<td class="mono" style="font-size:12px">' + esc(metaTxt(d)) + '</td>' +
                    '<td class="num mono"><span class="st ' + r.status + '">' + fmtVal(d, r.val) + '</span></td>' +
                    epsCols.map(e => {
                      const re = evalInd(d, ctxFor(ST.corte, ST.ps, e));
                      if(!re.d) return '<td class="num sd">—</td>';
                      return '<td class="num mono"><span class="st ' + re.status + '">' + fmtVal(d, re.val) + '</span><span class="sub">' + f1(re.n, 0) + '/' + f1(re.d, d.t === "rate" ? 1 : 0) + '</span></td>';
                    }).join("") +
                  '</tr>';
                }).join("") +
              '</tbody>' +
            '</table>' +
          '</div>' +
        '</div>';
    }

    /* Tabla interactiva de selección de indicadores + Nominal de Numerador / No Cumplimiento / Sin Dato */
    h +=
      '<div class="panel tablebox" style="padding:0;margin-bottom:14px">' +
        '<table class="indt">' +
          '<thead><tr><th>Código</th><th>Indicador (clic para graficar evolución y comparativa por EPS)</th><th class="num">Num / Den</th><th class="num">Resultado Actual</th><th>Progreso vs. Meta</th><th>Estado</th><th>Tendencia 6M</th></tr></thead>' +
          '<tbody>' +
            Rfilt.map(r => {
              const d = r.def;
              const sel = ST.sel.ind === d.c;
              const w = d.t === "pct" && r.val != null ? Math.min(100, r.val * 100) : 0;
              const cut = d.cuts ? d.cuts[0] : (metaOf(d) || null);
              return '<tr data-a="isel|' + d.c + '" class="' + (sel ? 'sel' : '') + '">' +
                '<td class="mono"><span class="tag ' + (d.inst ? 'inst' : 'cac') + '">' + esc(d.c) + '</span></td>' +
                '<td><strong>' + esc(d.n) + '</strong><span class="sub">' + esc(d.win) + '</span></td>' +
                '<td class="num mono">' + f1(r.n, 0) + ' / ' + f1(r.d, d.t === "rate" ? 1 : 0) + (r.excl && r.excl.length ? '<span class="sub">' + r.excl.length + ' excl.</span>' : '') + '</td>' +
                '<td class="num mono"><strong style="font-size:15px">' + fmtVal(d, r.val) + '</strong>' + (d.unit ? '<span class="sub">' + esc(d.unit) + '</span>' : '') + '</td>' +
                '<td style="min-width:150px">' +
                  '<div style="font-size:11.5px;color:var(--muted);display:flex;justify-content:space-between"><span>' + esc(metaTxt(d)) + '</span></div>' +
                  (d.t === "pct" ? '<div class="v9meta-bar" style="margin-top:3px"><span style="width:' + w.toFixed(0) + '%;background:' + (r.status === "alto" ? "var(--ok)" : r.status === "bajo" ? "var(--bad)" : "var(--accent)") + '"></span>' + (cut != null ? '<i style="left:' + Math.min(100, cut) + '%"></i>' : '') + '</div>' : '') +
                '</td>' +
                '<td><span class="st ' + r.status + '">' + ST_TXT[r.status] + '</span></td>' +
                '<td>' + spark(r.tr, d) + '</td>' +
              '</tr>';
            }).join("") +
          '</tbody>' +
        '</table>' +
      '</div>';

    /* Nominal detallado del indicador seleccionado (Numerador, No cumplen, Sin dato, Excluidos) */
    const pl = (arr, fn) => arr && arr.length ? '<div class="tablebox"><table><tbody>' + arr.map(fn).join("") + '</tbody></table></div>' : '<p class="note">Ninguno en este corte.</p>';
    const row = x => '<tr><td class="mono"><button type="button" class="lnk" data-a="psel|' + esc(x.p.ID) + '">' + esc(x.p.ID) + '</button></td><td>' + esc(nombre(x.p)) + '<span class="sub">' + esc(x.p.EPS || "") + ' · Silla ' + esc(x.p.Puesto || "—") + '</span></td><td class="mono">' + esc(x.v == null ? "" : typeof x.v === "number" ? f1(x.v, dSel.c === "dia_11_adul" ? 2 : 1) : x.v) + '</td></tr>';

    h += '<div class="panel"><h3>Detalle Nominal de Pacientes para ' + esc(dSel.c + " · " + dSel.n) + '</h3>';
    if(dSel.t === "rate"){
      h += '<details class="hist" open><summary>Eventos contabilizados en el numerador (' + selR.list.length + ')</summary>' + pl(selR.list, row) + '</details>';
    } else {
      const noCumple = selR.den.filter(x => !selR.num.some(n => n.p === x.p) && !selR.sd.includes(x.p));
      h += '<div class="grid2" style="margin-top:8px">' +
        '<details class="hist" open><summary>En cumplimiento / Numerador (' + selR.num.length + ')</summary>' + pl(selR.num, row) + '</details>' +
        '<details class="hist" open><summary>No cumplen la meta — Prioritarios (' + noCumple.length + ')</summary>' + pl(noCumple, row) + '</details>' +
      '</div>';
      if(selR.sd.length) h += '<details class="hist" open><summary>Sin dato en la ventana (' + selR.sd.length + ')</summary>' + pl(selR.sd.map(p => ({ p, v: "Sin resultado vigente" })), row) + '</details>';
      if(selR.excl.length) h += '<details class="hist"><summary>Excluidos con soporte (' + selR.excl.length + ')</summary>' + pl(selR.excl.map(e => ({ p: e.p, v: e.why })), row) + '</details>';
    }
    h += '</div>';
    return h;
  };

  /* ===================================================================================================
     14. ENRUTAMIENTO DE SUBPESTAÑAS EN HEMODIÁLISIS, SERVICIO FARMACÉUTICO Y MÓDULO DP CONMUTABLE
     =================================================================================================== */

  /* ===================================================================================================
     13B. NUEVAS VISTAS INTEGRADAS DESDE EL EXCEL REAL («Dashboard NOVIEMBRE (1).xlsx») Y v1.1 (2)
          - hd_dash: Dashboard Gerencial HD + Semáforo DOPPS/KDIGO + Gobernanza de IDs Jubilados
          - hd_glab: Gráficas Individuales de Evolución de Laboratorio (5B.GRAFICAS_LAB: Paciente vs. Unidad)
          - hd_anti: Gestión Farmacéutica Intradiálisis (EPO/Hierro) + Dispensación Ambulatoria (12.FARMACIA)
     =================================================================================================== */
  function v30CalcDoppsScore(p, tri){
    const ph = lastLab(p, "P", tri, ST.corte);
    const alb = lastLab(p, "Alb", tri, ST.corte);
    const hb = lastLab(p, "Hb", tri, ST.corte);
    const kt = lastLab(p, "KtV", tri, ST.corte);
    const hba1c = lastLab(p, "HbA1c", addMonths(ST.corte, -6), ST.corte);
    const ta = taStats(p, ST.corte, 8);
    const tas = ta && ta.n ? Math.round(ta.sPre) : null;
    const acc = accessAt(p, ST.corte) || p.AccesoActual || "Sin dato";

    const vP = ph ? num(ph.Valor) : null;
    const vAlb = alb ? num(alb.Valor) : null;
    const vHb = hb ? num(hb.Valor) : null;
    const vKt = kt ? num(kt.Valor) : null;
    const vA1c = hba1c ? num(hba1c.Valor) : null;

    /* Puntaje DOPPS + KDIGO 2024 (homologado con hoja SEMAFORO_RIESGO del Excel):
       Alb <3.5 = 4 pts (3.5–3.99 = 2 pts) | Hgb <8 = 3 pts (8–9.9 = 1 pt) | Catéter temporal = 3 pts / permanente = 2 pts
       Fósforo >7.5 = 2 pts (6.0–7.5 = 1 pt) | TA Sist >160 = 2 pts (140–160 = 1 pt) | HbA1c >9 = 2 pts (7–9 = 1 pt) */
    const scP = vP == null ? 0 : (vP > 7.5 ? 2 : vP >= 6.0 ? 1 : 0);
    const scAlb = vAlb == null ? 0 : (vAlb < 3.5 ? 4 : vAlb < 4.0 ? 2 : 0);
    const scHb = vHb == null ? 0 : (vHb < 8.0 ? 3 : vHb < 10.0 ? 1 : 0);
    const scTa = tas == null ? 0 : (tas > 160 ? 2 : tas >= 140 ? 1 : 0);
    const scA1c = (p.DM === "SI" && vA1c != null) ? (vA1c > 9.0 ? 2 : vA1c >= 7.0 ? 1 : 0) : 0;
    const scAcc = acc === "FAV" || acc === "Sin dato" ? 0 : acc === "CVC temporal" ? 3 : 2;
    const tot = scP + scAlb + scHb + scTa + scA1c + scAcc;
    const sinLab = vP == null && vAlb == null && vHb == null; /* v3.1: sin laboratorios vigentes no se clasifica como bajo riesgo */
    const lvl = sinLab ? "SIN LABORATORIOS VIGENTES" : tot >= 6 ? "ALTO RIESGO" : tot >= 3 ? "MEDIO RIESGO" : "BAJO RIESGO";
    const cls = sinLab ? "na" : tot >= 6 ? "bad" : tot >= 3 ? "warn" : "ok";
    return { vP, vAlb, vHb, vKt, tas, vA1c, acc, scP, scAlb, scHb, scTa, scA1c, scAcc, tot, lvl, cls };
  }

  function v30HdDashboardGerencialView(){
    ensureIdx();
    if(!ST.book) v30LoadRealHdBook(true);
    const tri = addMonths(ST.corte, -3);
    const ms = monthStart(ST.corte);
    const F = V30.cohFilter;
    const allAct = pacs().filter(p => activeAt(p, ST.corte));

    /* Calcular los 5 indicadores clínicos del Dashboard Gerencial */
    let cP = 0, dP = 0, cAlb = 0, dAlb = 0, cHb = 0, dHb = 0, cKt = 0, dKt = 0, cFav = 0;
    let totSesMes = 0, totProgMes = 0;
    const rows = [];

    allAct.forEach((p, idx) => {
      const sc = v30CalcDoppsScore(p, tri);
      const sesR = sesIn(p, ms, ST.corte, "Realizada").length;
      const sesP = p.ProgMes || (p.EPS === "NUEVA EPS" ? 10 : 8);
      totSesMes += sesR;
      totProgMes += sesP;

      if(sc.vP != null){ dP++; if(sc.vP < 6.0) cP++; }
      if(sc.vAlb != null){ dAlb++; if(sc.vAlb >= 4.0) cAlb++; }
      if(sc.vHb != null){ dHb++; if(sc.vHb >= 10.0) cHb++; }
      if(sc.vKt != null){ dKt++; if(sc.vKt > 1.2) cKt++; }
      if(sc.acc === "FAV") cFav++;

      const antig = p.IngresoUnidad ? Math.max(0, Math.round(dayDiff(p.IngresoUnidad, ST.corte) / 30.4)) : null;
      const gl = glucoStats(p, addDays(ST.corte, -30), ST.corte);
      const ahbsRec = lastLab(p, "AntiHBs", addMonths(ST.corte, -12), ST.corte);
      const ahbsVal = ahbsRec ? num(ahbsRec.Valor) : p.AntiHBsVal;

      if(F.eps && p.EPS !== F.eps) return;
      if(F.turno && p.Turno !== F.turno) return;
      if(F.acc && sc.acc !== F.acc) return;
      if(F.riesgo && ((F.riesgo === "alto" && sc.cls !== "bad") || (F.riesgo === "medio" && sc.cls !== "warn") || (F.riesgo === "bajo" && sc.cls !== "ok"))) return;
      if(F.q){
        const hay = norm(p.ID + " " + nombre(p) + " " + (p.Documento || "") + " " + (p.EPS || "") + " " + (p.TxEtapaRaw || ""));
        if(!hay.includes(norm(F.q))) return;
      }

      rows.push({ p, idx: idx + 1, sc, sesR, sesP, antig, gl, ahbsVal });
    });

    const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
    const pcs = (a, b) => b ? Math.round(a / b * 100) + ' %' : 's/d';
    const nAlto = rows.filter(r => r.sc.cls === "bad").length;
    const nMedio = rows.filter(r => r.sc.cls === "warn").length;
    const nBajo = rows.filter(r => r.sc.cls === "ok").length;

    return '<div class="v30-hero-banner">' +
      '<div class="mhead">' +
        '<div>' +
          '<p class="eyebrow" style="margin:0;color:var(--accent)">Eje 02 · Vista Ejecutiva en Tiempo Real (Abolición del Excel «Dashboard NOVIEMBRE»)</p>' +
          '<h2 style="margin:2px 0 4px">🏥 Hemodiálisis — Dashboard Gerencial, Semáforo DOPPS/KDIGO y Control de Cupos</h2>' +
          '<p class="note" style="margin:0">Integra en una sola consola en vivo las hojas <b>HD_DASHBOARD</b>, <b>SEMAFORO_RIESGO</b>, <b>2.PACIENTES</b>, <b>3.ASISTENCIAS_DIARIO</b>, <b>5.LABORATORIOS</b>, <b>8.VACUNACION_HEPB</b>, <b>TRASPLANTE</b>, <b>COMPLICACIONES</b> y <b>NOVEDADES</b>.</p>' +
        '</div>' +
        '<div class="copyrow">' +
          '<button type="button" class="btn sm primary" data-v30="coh_newpac">+ Ingresar Nuevo Paciente HD</button>' +
          '<button type="button" class="btn sm" data-v30="reload_real_hd">🔄 Restaurar base real</button>' +
          '<button type="button" class="btn sm" data-v30="exp_cohorte_xlsx">📥 Exportar Dashboard Gerencial (.xlsx)</button>' +
        '</div>' +
      '</div>' +
      /* 5 Indicadores Clínicos Meta vs Desempeño Actual */
      '<div style="margin-top:12px">' +
        '<div style="font-size:11.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--accent);margin-bottom:6px">▌ Indicadores Clínicos — Meta vs. Desempeño Actual de la Cohorte</div>' +
        '<div class="tiles">' +
          '<div class="tile ' + (pct(cP, dP) >= 80 ? "ok" : "warn") + '"><span class="tv">' + pcs(cP, dP) + '</span><span class="tl"><b>Fósforo &lt; 6,0 mg/dL</b> · Meta ≥ 80 % (' + cP + '/' + dP + ' pac.)</span></div>' +
          '<div class="tile ' + (pct(cAlb, dAlb) >= 40 ? "ok" : "warn") + '"><span class="tv">' + pcs(cAlb, dAlb) + '</span><span class="tl"><b>Albúmina ≥ 4,0 g/dL</b> · Meta ≥ 40 % (' + cAlb + '/' + dAlb + ' pac.)</span></div>' +
          '<div class="tile ' + (pct(cHb, dHb) >= 60 ? "ok" : "warn") + '"><span class="tv">' + pcs(cHb, dHb) + '</span><span class="tl"><b>Hemoglobina ≥ 10,0 g/dL</b> · Meta ≥ 60 % (' + cHb + '/' + dHb + ' pac.)</span></div>' +
          '<div class="tile ' + (pct(cKt, dKt) >= 80 ? "ok" : "warn") + '"><span class="tv">' + pcs(cKt, dKt) + '</span><span class="tl"><b>spKt/V &gt; 1,2</b> · Meta ≥ 80 % (' + cKt + '/' + dKt + ' pac.)</span></div>' +
          '<div class="tile ' + (pct(cFav, allAct.length) >= 70 ? "ok" : "bad") + '"><span class="tv">' + pct(cFav, allAct.length) + ' %</span><span class="tl"><b>Acceso Vascular FAV</b> · Meta ≥ 90 % (' + cFav + '/' + allAct.length + ' pac.)</span></div>' +
        '</div>' +
      '</div>' +
      /* Indicadores Operativos y Semáforo DOPPS */
      '<div style="margin-top:12px">' +
        '<div style="font-size:11.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--accent);margin-bottom:6px">▌ Indicadores Operativos (4 Turnos × 13 Sillas = 52 Cupos) y Semáforo de Riesgo DOPPS / KDIGO 2024</div>' +
        '<div class="tiles">' +
          '<div class="tile"><span class="tv">' + allAct.length + ' / 52</span><span class="tl">Pacientes asignados (Capacidad instalada: 52 puestos)</span></div>' +
          '<div class="tile ok"><span class="tv">' + totSesMes + '</span><span class="tl">Sesiones realizadas al corte (' + pct(totSesMes, totProgMes) + ' % avance del mes)</span></div>' +
          '<div class="tile bad"><span class="tv">' + nAlto + '</span><span class="tl">Alto Riesgo DOPPS (≥ 6 pts) · Intervención prioritaria</span></div>' +
          '<div class="tile warn"><span class="tv">' + nMedio + '</span><span class="tl">Medio Riesgo DOPPS (3–5 pts) · Seguimiento estrecho</span></div>' +
          '<div class="tile ok"><span class="tv">' + nBajo + '</span><span class="tl">Bajo Riesgo DOPPS (0–2 pts) · Metas controladas</span></div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    /* Barra de Filtros Interactiva */
    '<div class="panel" style="margin-bottom:12px">' +
      '<div class="form">' +
        '<label class="f">Filtrar por EPS<select id="v30_ceps">' + opt(["", ...epsList(), "POLICIA NACIONAL"], F.eps, "Todas las EPS (" + allAct.length + ")") + '</select></label>' +
        '<label class="f">Turno (13 Sillas)<select id="v30_cturno">' + opt(["", ...turnoNames()], F.turno, "Todos los turnos") + '</select></label>' +
        '<label class="f">Acceso Vascular<select id="v30_cacc">' + opt(["", "FAV", "CVC tunelizado", "CVC temporal"], F.acc, "Todos los accesos") + '</select></label>' +
        '<label class="f">Nivel de Riesgo DOPPS<select id="v30_criesgo">' + opt([["","Todos"],["alto","Alto Riesgo (≥ 6 pts)"],["medio","Medio Riesgo (3–5 pts)"],["bajo","Bajo Riesgo (0–2 pts)"]], F.riesgo) + '</select></label>' +
        '<label class="f wide">Buscar paciente (ID, nombre, documento, etapa trasplante)<input type="search" id="v30_cq" value="' + esc(F.q || "") + '" placeholder="Ej. P001, apellido, nombre, documento, Lista de espera…"></label>' +
      '</div>' +
    '</div>' +

    /* Tabla Maestra Detalle por Paciente (HD_DASHBOARD + SEMAFORO_RIESGO unificados) */
    '<div class="panel tablebox" style="padding:0;margin-bottom:14px">' +
      '<table class="dense">' +
        '<thead><tr>' +
          '<th># · ID</th>' +
          '<th>Paciente · Documento</th>' +
          '<th>EPS</th>' +
          '<th>Turno · Silla</th>' +
          '<th>Acceso (Antig.)</th>' +
          '<th class="num">Fósforo</th>' +
          '<th class="num">Albúmina</th>' +
          '<th class="num">Hgb</th>' +
          '<th class="num">Kt/V</th>' +
          '<th class="num">Ses. Real/Prog</th>' +
          '<th class="num">TA Sist.</th>' +
          '<th>Vacuna Hep B (Anti-HBs)</th>' +
          '<th>Etapa Trasplante</th>' +
          '<th>Semáforo DOPPS (Pts)</th>' +
          '<th>Acciones</th>' +
        '</tr></thead>' +
        '<tbody>' +
          (rows.map(r => {
            const p = r.p, sc = r.sc;
            const pOk = sc.vP != null && sc.vP < 6.0;
            const albOk = sc.vAlb != null && sc.vAlb >= 4.0;
            const hbOk = sc.vHb != null && sc.vHb >= 10.0;
            const ktOk = sc.vKt != null && sc.vKt > 1.2;
            const vhbOk = r.ahbsVal != null && r.ahbsVal >= 10;
            return '<tr>' +
              '<td class="mono"><strong>' + esc(p.ID) + '</strong><span class="sub">#' + r.idx + '</span></td>' +
              '<td><strong>' + esc(nombre(p)) + '</strong><span class="sub">' + esc((p.TipoDoc || "CC") + " " + (p.Documento || "—") + " · " + (ageAt(p, ST.corte) || "—") + " años") + '</span></td>' +
              '<td><strong>' + esc(p.EPS || "—") + '</strong></td>' +
              '<td>' + esc(p.Turno || "—") + '<span class="sub">Silla ' + esc(p.Puesto || "—") + '</span></td>' +
              '<td><span class="st ' + (sc.acc === "FAV" ? "ok" : sc.acc === "CVC temporal" ? "bad" : "warn") + '">' + esc(sc.acc) + '</span><span class="sub">' + (r.antig == null ? 'sin fecha de ingreso' : r.antig + ' meses') + '</span></td>' +
              '<td class="num mono">' + (sc.vP != null ? '<span class="st ' + (pOk ? "ok" : "bad") + '">' + sc.vP + '</span>' : '<span class="note">s/d</span>') + '</td>' +
              '<td class="num mono">' + (sc.vAlb != null ? '<span class="st ' + (albOk ? "ok" : "warn") + '">' + sc.vAlb + '</span>' : '<span class="note">s/d</span>') + '</td>' +
              '<td class="num mono">' + (sc.vHb != null ? '<span class="st ' + (hbOk ? "ok" : "bad") + '">' + sc.vHb + '</span>' : '<span class="note">s/d</span>') + '</td>' +
              '<td class="num mono">' + (sc.vKt != null ? '<span class="st ' + (ktOk ? "ok" : "bad") + '">' + sc.vKt + '</span>' : '<span class="note">s/d</span>') + '</td>' +
              '<td class="num mono"><strong>' + r.sesR + '/' + r.sesP + '</strong><span class="sub">' + Math.round(r.sesR / Math.max(1, r.sesP) * 100) + ' %</span></td>' +
              '<td class="num mono">' + (sc.tas ? '<span class="st ' + (sc.tas < 140 ? "ok" : "warn") + '">' + sc.tas + '</span>' : '—') + '</td>' +
              '<td><span class="st ' + (vhbOk ? "ok" : "warn") + '">' + esc(p.VHBEstado || p.VacunaVHB || "En curso") + '</span>' + (r.ahbsVal != null ? '<span class="sub">Anti-HBs: ' + r.ahbsVal + ' mUI/mL</span>' : '') + '</td>' +
              '<td><span class="st ' + (/LISTA|DONANTE/i.test(p.TxEtapaRaw || "") ? "ok" : /DISFUN/i.test(p.TxEtapaRaw || "") ? "bad" : "warn") + '">' + esc(p.TxEtapaRaw || p.TxEstado || "En estudio") + '</span></td>' +
              '<td><span class="st ' + sc.cls + '">' + sc.lvl + ' (' + sc.tot + ' pts)</span><span class="sub">P:' + sc.scP + ' Alb:' + sc.scAlb + ' Hb:' + sc.scHb + ' TA:' + sc.scTa + ' Acc:' + sc.scAcc + '</span></td>' +
              '<td><div class="copyrow" style="gap:4px">' +
                '<button type="button" class="btn sm" data-v30="coh_edit|' + esc(p.ID) + '">Ficha</button>' +
                '<button type="button" class="btn sm primary" data-v30="coh_hc|' + esc(p.ID) + '">HC</button>' +
                '<button type="button" class="btn sm" data-v30="open_glab|' + esc(p.ID) + '">📈 Lab</button>' +
              '</div></td>' +
            '</tr>';
          }).join("") || '<tr><td colspan="15" class="empty">Sin pacientes para los filtros seleccionados.</td></tr>') +
        '</tbody>' +
      '</table>' +
    '</div>' +

    /* Panel de Novedades del Mes y Gobernanza de IDs Jubilados (del Excel 2.PACIENTES y NOVEDADES) */
    '<div class="grid2">' +
      '<div class="panel">' +
        '<h3>📌 Novedades Clínicas y Hospitalizaciones del Mes (' + REAL_HD_DATA.novelties.length + ')</h3>' +
        '<div class="tablebox"><table class="dense"><thead><tr><th>Fecha</th><th>Paciente</th><th>Tipo</th><th>Descripción y Observaciones</th><th>Responsable · Estado</th></tr></thead><tbody>' +
          REAL_HD_DATA.novelties.map(nv => '<tr><td class="mono">' + esc(nv.Fecha) + '</td><td><strong>' + esc(nv.Paciente) + '</strong><span class="sub">' + esc(nv.PacNombre) + '</span></td><td><span class="st warn">' + esc(nv.TipoRaw || nv.Tipo) + '</span></td><td>' + esc(nv.Descripcion) + '</td><td>' + esc(nv.Responsable) + '<span class="sub">' + esc(nv.Estado) + '</span></td></tr>').join("") +
        '</tbody></table></div>' +
      '</div>' +
      '<div class="panel">' +
        '<h3>🔒 Gobernanza de Números de Identificación (Un ID = Una Sola Persona Para Siempre)</h3>' +
        '<p class="note" style="margin:0 0 6px">Regla institucional del maestro de pacientes: si un paciente egresa o pasa a DP, su código se jubila y nunca se reasigna.</p>' +
        '<div class="tablebox" style="max-height:210px"><table class="dense"><thead><tr><th>ID</th><th>Estado del Número</th><th>Paciente</th><th>Motivo Documentado</th></tr></thead><tbody>' +
          REAL_HD_DATA.retiredIds.map(r => '<tr><td class="mono"><strong>' + esc(r.id) + '</strong></td><td><span class="st ' + (r.estado.includes("Jubilado") ? "warn" : "ok") + '">' + esc(r.estado) + '</span></td><td>' + esc(r.paciente) + '</td><td class="note">' + esc(r.motivo) + '</td></tr>').join("") +
        '</tbody></table></div>' +
      '</div>' +
    '</div>';
  }

  /* Submódulo 5B.GRAFICAS_LAB: Evolución Individual del Paciente vs. Promedio de la Unidad */
  function v30HdGraficasLabView(){
    ensureIdx();
    if(!ST.book) v30LoadRealHdBook(true);
    const allP = pacs().filter(p => activeAt(p, ST.corte));
    const selPid = V30.glabPid && IDX.pac.get(V30.glabPid) ? V30.glabPid : (allP.some(p => p.ID === "P009") ? "P009" : (allP[0] ? allP[0].ID : "P001"));
    const pSel = IDX.pac.get(selPid) || allP[0];

    const months = [
      { ym: "2026-05", lbl: "May-26" },
      { ym: "2026-06", lbl: "Jun-26" },
      { ym: "2026-07", lbl: "Jul-26" },
      { ym: "2026-08", lbl: "Ago-26" },
      { ym: "2026-10", lbl: "Corte Actual" }
    ];
    const metrics = [
      { k: "Hb",  t: "Hemoglobina (g/dL)", meta: 10.0, dir: ">=", color: "#06b6d4", minY: 6, maxY: 16 },
      { k: "KtV", t: "Dosis de Diálisis · spKt/V", meta: 1.2, dir: ">=", color: "#10b981", minY: 0.6, maxY: 2.5 },
      { k: "P",   t: "Fósforo Sérico (mg/dL)", meta: 6.0, dir: "<=", color: "#f59e0b", minY: 2, maxY: 11 },
      { k: "Ca",  t: "Calcio Sérico (mg/dL)", meta: 10.2, dir: "<=", color: "#3b82f6", minY: 6.5, maxY: 14 },
      { k: "PTH", t: "PTH Intacta (pg/mL)", meta: 600, dir: "<=", color: "#8b5cf6", minY: 0, maxY: 2100 },
      { k: "Alb", t: "Albúmina Sérica (g/dL)", meta: 4.0, dir: ">=", color: "#14b8a6", minY: 2.2, maxY: 5.2 }
    ];

    /* Calcular para cada mes el valor del paciente y el promedio de la unidad */
    const seriesByM = {};
    metrics.forEach(m => {
      seriesByM[m.k] = months.map(mo => {
        const pacRecs = (pSel._lab && pSel._lab[m.k] ? pSel._lab[m.k] : []).filter(l => ym(l.FechaToma) === mo.ym && num(l.Valor) != null);
        const pVal = pacRecs.length ? num(pacRecs[pacRecs.length - 1].Valor) : null;
        const unitVals = [];
        pacs().forEach(px => {
          const r = (px._lab && px._lab[m.k] ? px._lab[m.k] : []).filter(l => ym(l.FechaToma) === mo.ym && num(l.Valor) != null);
          if(r.length) unitVals.push(num(r[r.length - 1].Valor));
        });
        const uAvg = unitVals.length ? +(unitVals.reduce((a, b) => a + b, 0) / unitVals.length).toFixed(2) : null;
        return { lbl: mo.lbl, pVal, uAvg };
      });
    });

    const renderDualLineSvg = (m) => {
      const pts = seriesByM[m.k];
      const W = 440, H = 185, padL = 42, padR = 18, padT = 22, padB = 30;
      const plotW = W - padL - padR, plotH = H - padT - padB;
      const allV = pts.flatMap(x => [x.pVal, x.uAvg, m.meta]).filter(v => v != null);
      const minV = Math.min(m.minY, ...allV);
      const maxV = Math.max(m.maxY, ...allV);
      const span = Math.max(0.1, maxV - minV);
      const xAt = i => padL + (i / Math.max(1, pts.length - 1)) * plotW;
      const yAt = v => padT + plotH - ((v - minV) / span) * plotH;

      const metaY = yAt(m.meta);
      /* Segmentos continuos solo entre meses consecutivos con dato real (sin interpolar huecos) */
      let pacPath = "";
      pts.forEach((pt, i) => {
        if(pt.pVal == null) return;
        const prevHas = i > 0 && pts[i - 1].pVal != null;
        pacPath += (prevHas ? " L " : " M ") + xAt(i).toFixed(1) + " " + yAt(pt.pVal).toFixed(1);
      });
      let unitPath = "";
      pts.forEach((pt, i) => {
        if(pt.uAvg == null) return;
        const prevHas = i > 0 && pts[i - 1].uAvg != null;
        unitPath += (prevHas ? " L " : " M ") + xAt(i).toFixed(1) + " " + yAt(pt.uAvg).toFixed(1);
      });

      return '<div class="v30-chart-card">' +
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
          '<strong style="font-size:13.5px;color:var(--ink)">' + esc(m.t) + '</strong>' +
          '<span class="tag">Meta: ' + (m.dir === ">=" ? "≥ " : "≤ ") + m.meta + '</span>' +
        '</div>' +
        '<div class="v30-svg-wrap">' +
          '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Evolución de ' + esc(m.t) + '">' +
            '<line x1="' + padL + '" y1="' + metaY.toFixed(1) + '" x2="' + (W - padR) + '" y2="' + metaY.toFixed(1) + '" stroke="var(--ok)" stroke-width="1.4" stroke-dasharray="4 3"/>' +
            '<text x="' + (W - padR - 2) + '" y="' + Math.max(12, metaY - 4).toFixed(1) + '" text-anchor="end" fill="var(--ok)" font-size="9.5" font-weight="700">Meta ' + m.meta + '</text>' +
            (unitPath ? '<path d="' + unitPath + '" fill="none" stroke="var(--muted)" stroke-width="2" stroke-dasharray="4 4"/>' : '') +
            (pacPath ? '<path d="' + pacPath + '" fill="none" stroke="' + m.color + '" stroke-width="3" stroke-linecap="round"/>' : '') +
            pts.map((pt, i) => {
              const cx = xAt(i).toFixed(1);
              let g = '<text x="' + cx + '" y="' + (H - 8) + '" text-anchor="middle" fill="var(--muted)" font-size="10" font-family="var(--f-mono)">' + esc(pt.lbl) + '</text>';
              if(pt.uAvg != null){
                g += '<circle cx="' + cx + '" cy="' + yAt(pt.uAvg).toFixed(1) + '" r="3" fill="var(--muted)"/>';
              }
              if(pt.pVal != null){
                const cy = yAt(pt.pVal).toFixed(1);
                g += '<circle cx="' + cx + '" cy="' + cy + '" r="4.8" fill="var(--surface)" stroke="' + m.color + '" stroke-width="2.5"/>' +
                     '<text x="' + cx + '" y="' + Math.max(12, yAt(pt.pVal) - 8).toFixed(1) + '" text-anchor="middle" fill="var(--ink)" font-size="10.5" font-weight="800" font-family="var(--f-mono)">' + pt.pVal + '</text>';
              }
              return g;
            }).join("") +
          '</svg>' +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted)">' +
          '<span><b style="color:' + m.color + '">● Línea sólida:</b> Paciente (' + esc(pSel.ID) + ')</span>' +
          '<span><b>--- Punteada gris:</b> Promedio Unidad Renal</span>' +
        '</div>' +
      '</div>';
    };

    return '<div class="v30-hero-banner">' +
      '<div class="mhead">' +
        '<div>' +
          '<p class="eyebrow" style="margin:0;color:var(--accent)">Eje 04 · Hoja 5B.GRAFICAS_LAB Integrada en Vivo</p>' +
          '<h2 style="margin:2px 0 4px">📈 Evolución Individual del Paciente vs. Promedio de la Unidad Renal</h2>' +
          '<p class="note" style="margin:0">Serie mensual real del paciente comparada contra el promedio de las 13 sillas y la meta clínica KDIGO/CAC. Un mes sin examen se respeta como hueco sin interpolar.</p>' +
        '</div>' +
        '<div class="copyrow">' +
          '<label class="f" style="min-width:290px">Seleccionar Paciente de la Cohorte:<select id="v30_glab_pac">' +
            allP.map(p => '<option value="' + esc(p.ID) + '"' + (p.ID === pSel.ID ? ' selected' : '') + '>' + esc(p.ID + " · " + nombre(p) + " (" + (p.EPS || "") + ")") + '</option>').join("") +
          '</select></label>' +
          '<button type="button" class="btn sm primary" data-v30="coh_hc|' + esc(pSel.ID) + '">Abrir HC de ' + esc(pSel.ID) + '</button>' +
        '</div>' +
      '</div>' +
    '</div>' +
    '<div class="v30-chart-grid" style="margin-bottom:14px">' +
      metrics.map(renderDualLineSvg).join("") +
    '</div>' +
    '<div class="panel tablebox" style="padding:0">' +
      '<table class="dense">' +
        '<thead><tr><th>Mes</th><th>Hgb Pac.</th><th>Hgb Unidad</th><th>Kt/V Pac.</th><th>Kt/V Unidad</th><th>Fósforo Pac.</th><th>Fósforo Unidad</th><th>Calcio Pac.</th><th>Calcio Unidad</th><th>PTH Pac.</th><th>PTH Unidad</th><th>Albúmina Pac.</th></tr></thead>' +
        '<tbody>' +
          months.map((mo, idx) => '<tr>' +
            '<td class="mono"><strong>' + esc(mo.lbl) + '</strong></td>' +
            '<td class="mono"><b>' + (seriesByM.Hb[idx].pVal ?? "—") + '</b></td><td class="mono note">' + (seriesByM.Hb[idx].uAvg ?? "—") + '</td>' +
            '<td class="mono"><b>' + (seriesByM.KtV[idx].pVal ?? "—") + '</b></td><td class="mono note">' + (seriesByM.KtV[idx].uAvg ?? "—") + '</td>' +
            '<td class="mono"><b>' + (seriesByM.P[idx].pVal ?? "—") + '</b></td><td class="mono note">' + (seriesByM.P[idx].uAvg ?? "—") + '</td>' +
            '<td class="mono"><b>' + (seriesByM.Ca[idx].pVal ?? "—") + '</b></td><td class="mono note">' + (seriesByM.Ca[idx].uAvg ?? "—") + '</td>' +
            '<td class="mono"><b>' + (seriesByM.PTH[idx].pVal ?? "—") + '</b></td><td class="mono note">' + (seriesByM.PTH[idx].uAvg ?? "—") + '</td>' +
            '<td class="mono"><b>' + (seriesByM.Alb[idx].pVal ?? "—") + '</b></td>' +
          '</tr>').join("") +
        '</tbody>' +
      '</table>' +
    '</div>';
  }

  /* Vista enriquecida de Farmacia en HD (Intradiálisis EPO/Hierro + 12.FARMACIA Ambulatoria del Excel) */
  function v30HdAntiCompletaView(){
    ensureIdx();
    if(!ST.book) v30LoadRealHdBook(true);
    const base = typeof v12HdAntiView === "function" ? v12HdAntiView() : "";
    const act = pacs().filter(p => epsOk(p) && activeAt(p, ST.corte));
    V30.ambFarm = V30.ambFarm || {};
    let nComp = 0;
    act.forEach(p => {
      if(V30.ambFarm[p.ID] && V30.ambFarm[p.ID].disp === "SI") nComp++;
    });

    const ambHtml = '<div class="panel" style="margin-top:14px;border-top:3px solid var(--accent)">' +
      '<div class="mhead">' +
        '<div>' +
          '<p class="eyebrow" style="margin:0;color:var(--accent)">Hoja 12.FARMACIA Integrada · Dispensación de Medicamentos Ambulatorios (HTA / DM / TMO)</p>' +
          '<h3 style="margin:2px 0 0">💊 Control de Dispensación Ambulatoria por Paciente (' + nComp + ' / ' + act.length + ' con entrega verificada)</h3>' +
        '</div>' +
        '<div class="copyrow">' +
          '<button type="button" class="btn sm primary" data-v30="amb_disp_all">✔ Marcar Todos Verificados en el Mes</button>' +
          '<button type="button" class="btn sm" data-v12="sub|hd|e5|hd_oxi">🫁 Ir a Control de Oxígeno (GFA-FO-OXI-001)</button>' +
        '</div>' +
      '</div>' +
      '<div class="tablebox" style="margin-top:10px"><table class="dense">' +
        '<thead><tr><th>ID · Paciente</th><th>EPS</th><th>HTA</th><th>DM</th><th>Esquema Ambulatorio / Pendientes</th><th>¿Todos Dispensados?</th><th>Estado</th><th>Acción</th></tr></thead>' +
        '<tbody>' +
          act.map(p => {
            const st = V30.ambFarm[p.ID] || { disp: "", meds: "Sin registrar (la hoja 12.FARMACIA del Dashboard viene en blanco)", fecha: "" };
            const isOk = st.disp === "SI";
            return '<tr>' +
              '<td><strong>' + esc(p.ID) + '</strong><span class="sub">' + esc(nombre(p)) + '</span></td>' +
              '<td>' + esc(p.EPS || "—") + '</td>' +
              '<td><span class="st ' + (p.HTA === "SI" ? "warn" : "ok") + '">' + esc(p.HTA || "NO") + '</span></td>' +
              '<td><span class="st ' + (p.DM === "SI" ? "warn" : "ok") + '">' + esc(p.DM || "NO") + '</span></td>' +
              '<td>' + esc(st.meds) + '</td>' +
              '<td class="mono"><b>' + (isOk ? "SÍ (" + esc(st.fecha) + ")" : "NO · Pendiente") + '</b></td>' +
              '<td><span class="st ' + (isOk ? "ok" : "warn") + '">' + (isOk ? "✓ Dispensación completa" : "⚠ Pendiente verificar") + '</span></td>' +
              '<td><button type="button" class="btn sm" data-v30="amb_toggle|' + esc(p.ID) + '">' + (isOk ? "Marcar Pendiente" : "✔ Confirmar Entrega") + '</button></td>' +
            '</tr>';
          }).join("") +
        '</tbody>' +
      '</table></div>' +
    '</div>';
    return base + ambHtml;
  }

  /* Garantizar que v11NavigateAxis siempre reciba (prog, ax, subKey) y sincronice ST.view y V12.state */
  const v11NavPrev = v11NavigateAxis;
  v11NavigateAxis = function(prog, ax, subKey){
    if(prog === "dp" && V30.dpMode !== "axes"){
      pxGo("dp", null);
      return;
    }
    if(prog === "hd"){
      if(!ST.book) v30LoadRealHdBook(true);
      const st = V12.state.hd || (V12.state.hd = { axis: "e1", sub: "hd_gpc" });
      st.axis = ax || st.axis || "e1";
      const subs = (V12.map.hd && V12.map.hd[st.axis]) || V12.map.hd.e1;
      st.sub = (subKey && subs.some(([k]) => k === subKey)) ? subKey : (subs[0] ? subs[0][0] : "hd_gpc");
      ST.view = st.sub;
      V30._lastNavView = st.sub;
      if(PX.user && PX.view !== "hd"){
        pxOpenHD(st.sub, true);
      } else {
        render();
        if(PX.user) pxBar();
        window.scrollTo(0, 0);
      }
      return;
    }
    return v11NavPrev(prog, ax, subKey);
  };
  if(window.V12API) window.V12API.v11NavigateAxis = v11NavigateAxis;
  if(window.V10API) window.V10API.v11NavigateAxis = v11NavigateAxis;

  render = function(){
    try {
      const P = window.PORTAL;
      if(P && P.PX && P.PX.user && P.PX.view !== "hd" && $("hdapp").hidden){ P.pxRefresh(); return; }
    } catch(e){}

    /* Si no hay libro cargado, cargar automáticamente la Base Real POSMÉDICA (Noviembre 2026) */
    if(!ST.book){
      v30LoadRealHdBook(true);
    }

    /* Si un botón interno (ej. data-a="psel|...", data-a="vgo|...", data-a="go|...") cambió ST.view directamente, sincronizar el eje */
    if(ST.view && ST.view !== V30._lastNavView){
      const axFound = v12FindAxisOfSub("hd", ST.view);
      if(axFound){
        V12.state.hd.axis = axFound;
        V12.state.hd.sub = ST.view;
      }
    }

    const curAxis = V12.state.hd.axis || "e1";
    const subs = V12.map.hd[curAxis] || V12.map.hd.e1;
    if(!subs.some(([k]) => k === V12.state.hd.sub)) V12.state.hd.sub = subs[0][0];
    const curSub = V12.state.hd.sub;
    ST.view = curSub;
    V30._lastNavView = curSub;

    renderNav();
    v30RefreshHdBookbar();
    const out = $("out");
    if(!out) return;

    /* Mapa Maestro Unificado de las 34 Sub-pestañas de los 8 Ejes de Hemodiálisis (v1.1(2) + v2.2 + v3.0 + Excel Real) */
    const allHdViews = {
      /* Eje 01: Gobierno, Procesos y Ruta */
      hd_gpc:    v30GovGpcView,
      hd_ruta:   () => v30RutaGraficaHdView() + '<div style="margin-top:14px">' + (typeof pxRutaView === "function" ? pxRutaView(false) : "") + '</div>',
      hd_proc:   () => v30ProcesosUnidadRenalView() + '<div style="margin-top:14px">' + (typeof v10GovView0 === "function" ? v10GovView0("hd") : "") + '</div>',
      hd_plan:   () => typeof v12PlanSubView === "function" ? v12PlanSubView("hd") : "",
      doc:       () => typeof pxDocsFor === "function" ? pxDocsFor("hd") : '<div class="panel empty">Sin documentos.</div>',
      ref:       vRef,
      /* Eje 02: Cohorte, Riesgo y Estadísticas */
      hd_dash:   v30HdDashboardGerencialView,
      hd_car:    () => v30CohorteOperativaView() + '<div style="margin-top:14px">' + (typeof v13CaracterizacionCohorteView0 === "function" ? v13CaracterizacionCohorteView0("hd") : "") + '</div>',
      pac:       vPac,
      sem:       vSem,
      acc:       vAcc,
      tx:        vTx,
      alert:     vAlert,
      hd_evstat: v30EventosEstadisticasView,
      hd_cal12:  () => v13Calendario12MPaciente("hd"),
      /* Eje 03: Operación, Turnos e HC GPC */
      turno:     vTurno,
      val:       vVal,
      hd_precon: () => v13PreconsultaView("hd"),
      hd_qx:     () => v13QxView("hd"),
      lim:       vLim,
      /* Eje 04: Paraclínicos, Gráficas Individuales y Vacunación */
      lab:       vLab,
      hd_glab:   v30HdGraficasLabView,
      vac:       vVac,
      /* Eje 05: Gestión Farmacéutica, Oxígeno e Infecciones */
      hd_anti:   v30HdAntiCompletaView,
      hd_oxi:    () => v30OxigenoControlView(false),
      inf:       vInf08,
      /* Eje 06: Indicadores CAC, Evolución y Calidad del Dato */
      ind:       vInd,
      rep:       vRep,
      cal:       vCal,
      /* Eje 07: Auditoría Concurrente y Mejoramiento PAMEC */
      hd_aud:    v12HdAudSubView,
      hd_pamec:  () => v10PamecProgView("hd"),
      hd_lib:    () => v12LibSubView("hd"),
      /* Eje 08: Producción, Metas y Facturación por Contrato EPS */
      hd_conc:   () => vFin(true),
      hd_meta:   () => v10ProgProdView("hd")
    };

    const fn = allHdViews[curSub] || v30HdDashboardGerencialView;
    try {
      out.innerHTML = (typeof rutaBanner === "function" ? rutaBanner(curSub) : "") + fn();
    } catch(err){
      console.error("Error renderizando vista HD (" + curSub + "):", err);
      out.innerHTML = '<div class="alert bad"><p>Error al abrir la pestaña «' + esc(curSub) + '»: ' + esc(err.message) + '</p></div>';
    }
    if(PX.user && PX.view === "hd") pxBar();
  };

  /* Enriquecer Servicio Farmacéutico Institucional (v10FarView) con la pestaña de Control de Oxígeno Medicinal */
  if(typeof v10FarView === "function"){
    const v10FarView0 = v10FarView;
    v10FarView = function(){
      const sub = PX.ui.sub || "anti";
      if(sub === "oxi"){
        return '<div class="mhead"><div><p class="eyebrow">Servicio de apoyo · Kárdex, Gases Medicinales y Uso Seguro</p><h2 class="mt">Servicio farmacéutico</h2></div>' +
          '<div class="seg" role="group">' +
            [["anti","Conciliación y Descuento de Saldos"],["oxi","Formato de Control de Oxígeno (GFA-FO-OXI-001)"],["fefo","Lotes y Semáforo FEFO"],["proa","Validación PROA"],["ram","Farmacovigilancia y Tecnovigilancia"]].map(([k,l]) => '<button type="button" data-p="go|far|' + k + '" aria-pressed="' + (sub === k) + '">' + l + '</button>').join("") +
          '</div></div>' +
          '<div style="margin-top:12px">' + v30OxigenoControlView(true) + '</div>';
      }
      const base = v10FarView0();
      return base.replace(
        '<button type="button" data-p="go|far|fefo"',
        '<button type="button" data-p="go|far|oxi" aria-pressed="false">Formato Control de Oxígeno</button><button type="button" data-p="go|far|fefo"'
      );
    };
  }

  /* Mejorar el contenedor de Diálisis Peritoneal y Contratos para alternar entre DP v1.1 y DP Gobernanza 7 Ejes */
  const pxRenderV22 = pxRender;
  pxRender = function(){
    v30SyncDp11ToNativeBook();
    const box = document.getElementById("extapp");
    if(PX.user && PX.view === "dp"){
      if(V30.dpMode === "axes"){
        if(box) box.hidden = true;
        document.getElementById("hdapp").hidden = true;
        document.getElementById("nefroapp").hidden = true;
        const m = document.getElementById("pxmain");
        m.hidden = false;
        pxBar();
        m.innerHTML =
          '<div class="v30-mod-switcher" style="margin-bottom:12px">' +
            '<div><strong>Diálisis Peritoneal UNOP · Modo Gobernanza y 7 Ejes Clínicos</strong> <span class="note">Sincronizado con la cohorte v1.1 (' + (DP.book ? DP.book.pac.length : 18) + ' pacientes)</span></div>' +
            '<div class="seg" role="group">' +
              '<button type="button" data-v30="dpmode|v11" aria-pressed="false">📋 Vista Operativa Integral DP v1.1</button>' +
              '<button type="button" data-v30="dpmode|axes" aria-pressed="true">🧭 Vista Gobernanza 7 Ejes (Ruta 360°, Calendario 12M, Preconsulta, SISCAC)</button>' +
            '</div>' +
          '</div>' + dpView();
        return;
      } else {
        pxRenderV22();
        if(box && !document.getElementById("v30-dp-switchbar")){
          const sb = document.createElement("div");
          sb.id = "v30-dp-switchbar";
          sb.className = "v30-mod-switcher";
          sb.innerHTML =
            '<div><strong>Diálisis Peritoneal UNOP v1.1 · Integrada al SIGC Maestro</strong> <span class="note">Censo, Habilitación Res. 3100, Contratación EPS, Kt/V, Peritonitis ISPD, Visitas, Farmacia e Indicadores CAC</span></div>' +
            '<div class="seg" role="group">' +
              '<button type="button" data-v30="dpmode|v11" aria-pressed="true">📋 Vista Operativa Integral DP v1.1</button>' +
              '<button type="button" data-v30="dpmode|axes" aria-pressed="false">🧭 Vista Gobernanza 7 Ejes (Ruta 360°, Calendario 12M, Preconsulta, SISCAC)</button>' +
            '</div>';
          box.insertBefore(sb, box.firstChild);
        } else if(document.getElementById("v30-dp-switchbar")){
          document.getElementById("v30-dp-switchbar").hidden = false;
        }
        return;
      }
    }
    if(document.getElementById("v30-dp-switchbar")){
      document.getElementById("v30-dp-switchbar").hidden = (PX.view !== "dp");
    }
    pxRenderV22();
  };

  /* Enriquecer #pxbar con Controles de Tamaño de Letra (A-/A/A+), Paleta de Color, Botón Directo a Contratos y Puente SIIS */
  const pxBarV22 = pxBar;
  pxBar = function(){
    pxBarV22();
    const r = document.querySelector("#pxbar .pxbar-r");
    if(!r) return;
    if(!document.getElementById("v30-ui-bar")){
      const uiWrap = document.createElement("div");
      uiWrap.id = "v30-ui-bar";
      uiWrap.className = "v30-ui-ctrls";
      uiWrap.title = "Ajustar tamaño de letra y paleta visual del SIGC";
      uiWrap.innerHTML =
        '<button type="button" data-v30="fscale|0.93" aria-pressed="' + (V30.fontScale < 0.96) + '" title="Letra compacta">A-</button>' +
        '<button type="button" data-v30="fscale|1" aria-pressed="' + (V30.fontScale >= 0.96 && V30.fontScale <= 1.04) + '" title="Letra estándar">A</button>' +
        '<button type="button" data-v30="fscale|1.08" aria-pressed="' + (V30.fontScale > 1.04) + '" title="Letra amplia para lectura sin fatiga">A+</button>' +
        '<button type="button" data-v30="palette|ocean" aria-pressed="' + (V30.palette === "ocean") + '" title="Paleta Océano Clínico"><span class="v30-pal-dot" style="background:#06b6d4"></span></button>' +
        '<button type="button" data-v30="palette|emerald" aria-pressed="' + (V30.palette === "emerald") + '" title="Paleta Esmeralda Renal"><span class="v30-pal-dot" style="background:#10b981"></span></button>' +
        '<button type="button" data-v30="palette|royal" aria-pressed="' + (V30.palette === "royal") + '" title="Paleta Índigo Ejecutivo"><span class="v30-pal-dot" style="background:#6366f1"></span></button>';
      r.insertBefore(uiWrap, r.firstChild);

      const ctBtn = document.createElement("button");
      ctBtn.type = "button";
      ctBtn.className = "btn sm";
      ctBtn.setAttribute("data-p", "go|ct");
      ctBtn.title = "Abrir Buscador de Contratos y Tecnologías (3.336 ítems · 5 EPS)";
      ctBtn.textContent = "📄 Contratos";
      r.insertBefore(ctBtn, uiWrap.nextSibling);
    }
  };

  /* Enriquecer la portada de inicio (pxLogin) con botón de Acceso Rápido 1-Clic a Hemodiálisis y al Panel General */
  const pxLoginV22 = pxLogin;
  pxLogin = function(){
    const base = pxLoginV22();
    const quickBar =
      '<div class="panel" style="margin-top:12px;border-left:4px solid var(--ok);background:var(--surface-2)">' +
        '<strong style="font-size:13.5px;color:var(--ink);display:block;margin-bottom:4px">⚡ Acceso Rápido 1-Clic para Evaluación y Operación (Modo Demostración v3.0)</strong>' +
        '<p class="note" style="margin:0 0 8px">Inicie sesión automáticamente con los libros de Hemodiálisis (13 sillas), Diálisis Peritoneal (v1.1), Contratos (3.336 tecnologías), Nefroprotección, VIH y Consulta Externa precargados:</p>' +
        '<div class="copyrow">' +
          '<button type="button" class="btn sm primary" data-v30="quick_hd">🏥 Abrir Directo Módulo de Hemodiálisis (v3.0)</button>' +
          '<button type="button" class="btn sm" data-v30="quick_panel">🧭 Abrir Panel General de Programas</button>' +
          '<button type="button" class="btn sm" data-v30="quick_dp">💧 Abrir Diálisis Peritoneal v1.1</button>' +
          '<button type="button" class="btn sm" data-v30="quick_ct">📄 Abrir Contratos y Tecnologías v1.1</button>' +
        '</div>' +
      '</div>';
    return base.replace('</div></section>', quickBar + '</div></section>');
  };

  /* ===================================================================================================
     15. MODALES INTERACTIVOS: PUENTE SIIS, VERIFICADOR CONTRACTUAL, REGISTRO 64 CÓDIGOS, FICHA GPC/PROT
     =================================================================================================== */
  function v30OpenSiisBridgeModal(prePid){
    ensureIdx();
    v30EnsureDemoData();
    const act = pacs().filter(p => activeAt(p, ST.corte));
    const p = (prePid && IDX.pac.get(prePid)) || act[0] || { ID: "P001", Documento: "90001373", EPS: "NUEVA EPS", Turno: "L-M-V Mañana", Puesto: 1 };
    const lastS = (p._ses && p._ses.length) ? p._ses[p._ses.length - 1] : {};
    const kt = lastLab(p, "KtV", addMonths(ST.corte, -3), ST.corte);
    const hb = lastLab(p, "Hb", addMonths(ST.corte, -3), ST.corte);
    const ph = lastLab(p, "P", addMonths(ST.corte, -3), ST.corte);
    const pth = lastLab(p, "PTH", addMonths(ST.corte, -6), ST.corte);
    const acc = accessAt(p, ST.corte) || p.AccesoActual || "FAV";
    const codAcc = acc === "FAV" ? "31 (SESIÓN POR FÍSTULA SIN INJERTO)" : acc === "Injerto" ? "32 (SESIÓN POR FÍSTULA CON INJERTO)" : acc === "CVC tunelizado" ? "24 (SESIÓN POR CATÉTER PERMANENTE)" : "23 (SESIÓN POR CATÉTER TEMPORAL)";

    const notaSiis = [
      "=== BLOQUE ESTRUCTURADO DE INTEROPERABILIDAD SIGC POSMÉDICA ↔ SIIS (HISTORIA CLÍNICA) ===",
      "INSTITUCIÓN: POSMEDICA GROUP S.A.S. (UNO-P Mocoa · Cód. REPS 860010090801) | UNIDAD RENAL (13 SILLAS)",
      "FECHA: " + iso(TODAY()) + " | PACIENTE: " + nombre(p) + " | DOC: " + (p.TipoDoc || "CC") + " " + (p.Documento || "") + " | ID SIGC: " + p.ID,
      "EPS: " + (p.EPS || "—") + " | TURNO: " + (p.Turno || "—") + " | SILLA: " + (p.Puesto || "—") + " | ACCESO VASCULAR: " + acc,
      "-----------------------------------------------------------------------------------------",
      "1. CÓDIGOS DE ACTIVIDADES REGISTRADAS EN HEMODIÁLISIS (HOMOLOGACIÓN OFICIAL SIIS):",
      "   - [Cód. SIIS 61] SESIÓN PROGRAMADA",
      "   - [Cód. SIIS " + codAcc,
      "   - [Cód. SIIS 69] REALIZACIÓN DE KT/V: " + (kt ? kt.Valor : "Pendiente") + " (Método Daugirdas II / Manual UKM)",
      "   - [Cód. SIIS 88] TOMA DE LABORATORIOS DE CONTROL MENSUAL: Hb " + (hb ? hb.Valor + " g/dL" : "s/d") + " | Fósforo " + (ph ? ph.Valor + " mg/dL" : "s/d") + " | PTH " + (pth ? pth.Valor + " pg/mL" : "s/d"),
      "-----------------------------------------------------------------------------------------",
      "2. PARÁMETROS DE CONEXIÓN, MONITOREO Y DESCONEXIÓN (PROTOCOLOS GSH-PT-001 / GSH-PT-002):",
      "   - Peso Seco Prescrito: " + (p.PesoSeco || "—") + " kg | Peso Pre: " + (lastS.PesoPre || "—") + " kg | Peso Post: " + (lastS.PesoPost || "—") + " kg | UF Neta: " + (lastS.UFNeta || "—") + " L",
      "   - PA Pre-diálisis: " + fmtTA(lastS.TASPre, lastS.TADPre) + " mmHg | PA Post-diálisis: " + fmtTA(lastS.TASPost, lastS.TADPost) + " mmHg | Duración efectiva: " + (lastS.DuracionMin || 240) + " min",
      "   - Verificación Pre-turno: Agua tratada conforme (conductividad < 15 µS/cm, cloro < 0,1 mg/L) y puesto desinfectado.",
      "-----------------------------------------------------------------------------------------",
      "3. EVALUACIÓN POR GUÍAS DE PRÁCTICA CLÍNICA ADOPTADAS (KDIGO ERC 2024 / TMO / ANEMIA 2026):",
      "   - Adecuación UKM: " + (kt && num(kt.Valor) >= 1.2 ? "En meta CAC (spKt/V ≥ 1,2)" : "Revisar tiempo efectivo/flujo Qb"),
      "   - Anemia ERC 2026: " + (hb && num(hb.Valor) >= 10 ? "En meta (Hb ≥ 10 g/dL)" : "Ajustar hierro parenteral (Cód. 59) / AEE (Cód. 71/92)"),
      "   - Trastorno Mineral Óseo (TMO-ERC): " + (ph && num(ph.Valor) >= 2.5 && num(ph.Valor) <= 6 ? "Fósforo en meta (2,5–6,0 mg/dL)" : "Reforzar quelante y dieta baja en fósforo"),
      "========================================================================================="
    ].join("\n");

    const body =
      '<p class="note">Puente técnico de interoperabilidad entre el <b>SIGC POSMÉDICA</b> y el sistema de historia clínica <b>SIIS</b>: genera el resumen estructurado para pegar en la evolución clínica de SIIS, y permite exportar o importar el archivo plano/JSON de las <b>64 actividades codificadas de hemodiálisis</b>.</p>' +
      '<div class="form" style="margin:8px 0">' +
        '<label class="f wide">Seleccionar paciente de la cohorte para generar bloque SIIS<select id="v30_siis_pac">' +
          act.map(x => '<option value="' + esc(x.ID) + '"' + (x.ID === p.ID ? ' selected' : '') + '>' + esc(x.ID + " · " + nombre(x) + " (" + (x.Documento || "") + " · Silla " + (x.Puesto || "—") + ")") + '</option>').join("") +
        '</select></label>' +
        '<label class="f wide">Bloque estructurado listo para Historia Clínica SIIS<textarea id="v30_siis_txt" rows="13" style="font-family:var(--f-mono);font-size:12px">' + esc(notaSiis) + '</textarea></label>' +
      '</div>' +
      '<div class="copyrow">' +
        '<button type="button" class="btn primary" data-v30="siis_copy">📋 Copiar Bloque para Historia Clínica SIIS</button>' +
        '<button type="button" class="btn" data-v30="exp_evstat_csv">📄 Descargar Lote Plano de Actividades SIIS (.csv)</button>' +
        '<button type="button" class="btn" data-v30="siis_json">🔗 Descargar Payload Interoperabilidad (.json HL7/RIPS)</button>' +
      '</div>';

    openDlg("Puente de Interconexión SIGC ↔ SIIS (Historias Clínicas y 64 Códigos)", body, "Cerrar", () => {});
    const d = document.querySelector("#dlg .dlg");
    if(d) d.style.width = "min(880px, 100%)";
    const selEl = $("v30_siis_pac");
    if(selEl) selEl.onchange = () => v30OpenSiisBridgeModal(selEl.value);
  }

  function v30OpenContractCheckerModal(){
    v30InitEmbeddedData();
    const items = (CT_MEM && CT_MEM.I) ? CT_MEM.I : [];
    const progs = (CT_MEM && CT_MEM.P) ? CT_MEM.P : [];
    const ctrs = (CT_MEM && CT_MEM.C) ? CT_MEM.C : [];
    const pMap = Object.fromEntries(progs.map(p => [p.id, p]));
    const cMap = Object.fromEntries(ctrs.map(c => [c.id, c]));

    const renderMatches = (qStr, epsF) => {
      const qn = norm(qStr || "ERITROPOYETINA");
      const matches = items.filter(a => {
        const p = pMap[a[0]];
        const c = p ? cMap[p.k] : null;
        if(epsF && (!c || c.eps !== epsF)) return false;
        const hay = norm((a[1] || "") + " " + (a[3] || "") + " " + (a[4] || "") + " " + (p ? p.nombre : ""));
        return !qn || hay.includes(qn);
      }).slice(0, 40);

      if(!matches.length) return '<p class="note">Sin coincidencias para «' + esc(qStr) + '».</p>';
      return '<div class="tablebox" style="max-height:340px"><table class="dense"><thead><tr><th>EPS / Contrato</th><th>Programa</th><th>Código</th><th>Tecnología / Medicamento / Examen</th><th>Frecuencia</th><th>Modalidad</th></tr></thead><tbody>' +
        matches.map(a => {
          const p = pMap[a[0]] || {};
          const c = cMap[p.k] || {};
          const m = a[6];
          const mTxt = { P: "Incluido en Paquete", E: "Por Evento", C: "Cotizado", D: "Eliminar", X: "Excluido" }[m] || m;
          const mCls = m === "P" ? "ok" : m === "E" ? "warn" : "bad";
          return '<tr>' +
            '<td><strong>' + esc(c.eps || "—") + '</strong></td>' +
            '<td>' + esc(p.corto || p.nombre || a[0]) + '</td>' +
            '<td class="mono">' + esc(a[1] || "—") + '</td>' +
            '<td><strong>' + esc(a[3]) + '</strong><span class="sub">' + esc(a[4] || "") + '</span></td>' +
            '<td>' + esc(a[5] || "—") + '</td>' +
            '<td><span class="st ' + mCls + '">' + esc(mTxt) + '</span></td>' +
          '</tr>';
        }).join("") + '</tbody></table></div>';
    };

    const body =
      '<p class="note">Consulta instantánea sobre los <b>7 contratos y 3.336 tecnologías</b> integrados desde el módulo de <b>Contratos y Tecnologías UNOP v1.1</b> (Nueva EPS, EPS Familiar, Mallamas, FOMAG, DaVita).</p>' +
      '<div class="form" style="margin:8px 0">' +
        '<label class="f wide">Buscar medicamento, laboratorio, insumo o código CUPS/CUM<input type="text" id="v30_ct_q" value="ERITROPOYETINA" placeholder="Ej. eritropoyetina, hierro, calcitriol, PTH, 903856, catéter..."></label>' +
      '</div>' +
      '<div id="v30_ct_res">' + renderMatches("ERITROPOYETINA", "") + '</div>' +
      '<div class="copyrow" style="margin-top:10px">' +
        '<button type="button" class="btn sm primary" data-p="go|ct" data-cerrar-dlg="1">Abrir Módulo Completo de Contratos y Tecnologías →</button>' +
      '</div>';

    openDlg("Verificador Contractual en Vivo (3.336 Tecnologías · 5 Pagadores)", body, "Cerrar", () => {});
    const d = document.querySelector("#dlg .dlg");
    if(d) d.style.width = "min(900px, 100%)";
    const inp = $("v30_ct_q");
    if(inp){
      inp.oninput = () => {
        const box = $("v30_ct_res");
        if(box) box.innerHTML = renderMatches(inp.value, "");
      };
    }
  }

  function v30OpenNewSiisModal(pid, preCode){
    ensureIdx();
    v30EnsureDemoData();
    const act = pacs().filter(p => activeAt(p, ST.corte));
    const selP = (pid && IDX.pac.get(pid)) || act[0] || { ID: "P001", Turno: "L-M-V Mañana", Puesto: 1, EPS: "NUEVA EPS" };
    const body =
      '<div class="form">' +
        '<label class="f">Fecha *<input type="date" id="v30_sn_f" value="' + iso(TODAY()) + '"></label>' +
        '<label class="f">Paciente *<select id="v30_sn_p">' +
          act.map(p => '<option value="' + esc(p.ID) + '"' + (p.ID === selP.ID ? ' selected' : '') + '>' + esc(p.ID + " · " + nombre(p) + " (Silla " + (p.Puesto || "—") + ")") + '</option>').join("") +
        '</select></label>' +
        '<label class="f wide">Código y Actividad Oficial SIIS (64 ítems de Hemodiálisis) *<select id="v30_sn_c">' +
          SIIS_ACTIVIDADES_HD.map(a => '<option value="' + esc(a.no) + '"' + (String(a.no) === String(preCode || "4") ? ' selected' : '') + '>[' + esc(a.tipo) + ' · Cód. ' + esc(a.no) + '] ' + esc(a.act) + ' (' + esc(a.prot) + ')</option>').join("") +
        '</select></label>' +
        '<label class="f">Turno<select id="v30_sn_t">' + opt(turnoNames(), selP.Turno || "L-M-V Mañana") + '</select></label>' +
        '<label class="f">Silla (1–13)<select id="v30_sn_s">' + opt(Array.from({length:13},(_,i)=>String(i+1)), String(selP.Puesto || 1)) + '</select></label>' +
        '<label class="f">Severidad / Impacto<select id="v30_sn_sev">' + opt(["Informativa","Leve","Moderada","Severa"], "Moderada") + '</select></label>' +
        '<label class="f">Estado<select id="v30_sn_est">' + opt(["Cerrado","En seguimiento","Abierto"], "Cerrado") + '</select></label>' +
        '<label class="f wide">Conducta clínica aplicada / Observación para SIIS *<textarea id="v30_sn_n" rows="3" placeholder="Describa signos vitales, intervención según protocolo GSH-PT y respuesta del paciente..."></textarea></label>' +
      '</div>';

    openDlg("Registrar Evento o Actividad Oficial SIIS en Hemodiálisis", body, "Guardar y Sincronizar", () => {
      const pId = $("v30_sn_p").value;
      const code = $("v30_sn_c").value;
      const nota = $("v30_sn_n").value.trim();
      const pObj = IDX.pac.get(pId);
      if(!pObj) return "Seleccione el paciente.";
      if(!nota) return "Describa la conducta clínica aplicada u observación.";
      const def = SIIS_ACTIVIDADES_HD.find(x => x.no === code) || SIIS_ACTIVIDADES_HD[0];
      const rec = {
        id: "SIIS-" + String(V30.siisActs.length + 1).padStart(4, "0"),
        no: def.no,
        act: def.act,
        tipo: def.tipo,
        cat: def.cat,
        prot: def.prot,
        fecha: $("v30_sn_f").value || iso(TODAY()),
        pid: pObj.ID,
        pacNom: nombre(pObj),
        eps: pObj.EPS || "NUEVA EPS",
        turno: $("v30_sn_t").value,
        silla: num($("v30_sn_s").value) || 1,
        sev: $("v30_sn_sev").value,
        nota,
        estado: $("v30_sn_est").value,
        usuario: ST.user || (PX.user && PX.user.Nombre) || "Enfermería HD"
      };
      v32GuardarSiis(rec);
      if(def.tipo === "EVENTO" && ST.book && Array.isArray(ST.book.evt)){
        addRec("evt", "E-", {
          Fecha: pdate(rec.fecha) || TODAY(),
          Paciente: pObj.ID,
          Sesion: "",
          Tipo: "[SIIS " + def.no + "] " + def.act,
          Severidad: rec.sev === "Informativa" ? "Leve" : rec.sev,
          Conducta: rec.nota,
          Resuelto: rec.estado === "Cerrado" ? "Sí" : "En seguimiento"
        });
        reindex();
      }
      render();
      toast("Actividad SIIS No. " + def.no + " («" + def.act + "») registrada para " + pObj.ID + ".");
    });
  }

  /* ===================================================================================================
     16. EXPORTACIONES EXCEL (.XLSX) Y PLANOS CSV / JSON PARA COHORTE, EVENTOS SIIS, OXÍGENO Y GOBIERNO
     =================================================================================================== */
  function v30DownloadCsv(filename, headers, rows){
    const q = v => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"';
    const lines = [headers.map(q).join(";")].concat(rows.map(r => r.map(q).join(";")));
    const blob = new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 400);
    toast("Archivo CSV descargado: " + filename);
  }

  async function v30ExportCohorteAndSiisXlsx(){
    ensureIdx();
    v30EnsureDemoData();
    const { counts } = v30ComputeSiisStats();
    const tri = addMonths(ST.corte, -3), sem = addMonths(ST.corte, -6);
    const P = pacs();

    const s1 = ["Censo_Cohorte_HD", P, [
      ["ID", p => p.ID],
      ["Tipo_Doc", p => p.TipoDoc || "CC"],
      ["Documento", p => p.Documento],
      ["Paciente", p => nombre(p)],
      ["Edad", p => ageAt(p, ST.corte)],
      ["Sexo", p => p.Sexo],
      ["EPS", p => p.EPS],
      ["Municipio", p => p.Municipio],
      ["Estado", p => activeAt(p, ST.corte) ? "Activo" : (p.Estado || "Inactivo")],
      ["Turno", p => p.Turno],
      ["Silla", p => p.Puesto],
      ["Acceso_Actual", p => accessAt(p, ST.corte) || p.AccesoActual],
      ["Peso_Seco_kg", p => p.PesoSeco],
      ["spKtV_Ultimo", p => { const l = lastLab(p, "KtV", tri, ST.corte); return l ? l.Valor : ""; }],
      ["Hb_g_dL", p => { const l = lastLab(p, "Hb", tri, ST.corte); return l ? l.Valor : ""; }],
      ["Fosforo_mg_dL", p => { const l = lastLab(p, "P", tri, ST.corte); return l ? l.Valor : ""; }],
      ["Calcio_mg_dL", p => { const l = lastLab(p, "Ca", tri, ST.corte); return l ? l.Valor : ""; }],
      ["PTH_pg_mL", p => { const l = lastLab(p, "PTH", sem, ST.corte); return l ? l.Valor : ""; }],
      ["Albumina_g_dL", p => { const l = lastLab(p, "Alb", tri, ST.corte); return l ? l.Valor : ""; }],
      ["Riesgo_Semaforo", p => semaforo(p, ST.corte).lvl],
      ["Estado_Trasplante", p => p.TxEstado || "Sin evaluar"]
    ]];

    const s2 = ["Consolidado_64_SIIS", SIIS_ACTIVIDADES_HD, [
      ["Cod_SIIS", d => d.no],
      ["Actividad_Hemodialisis", d => d.act],
      ["Clasificacion", d => d.tipo],
      ["Categoria", d => d.cat],
      ["Protocolo_GPC", d => d.prot],
      ["Total_Registrado", d => counts[d.no] || 0]
    ]];

    const s3 = ["Bitacora_Eventos_SIIS", V30.siisActs, [
      ["ID", r => r.id],
      ["Fecha", r => r.fecha],
      ["Cod_SIIS", r => r.no],
      ["Actividad_Evento", r => r.act],
      ["Clasificacion", r => r.tipo],
      ["Paciente_ID", r => r.pid],
      ["Nombre_Paciente", r => r.pacNom],
      ["EPS", r => r.eps],
      ["Turno", r => r.turno],
      ["Silla", r => r.silla],
      ["Severidad", r => r.sev],
      ["Conducta_Nota", r => r.nota],
      ["Estado", r => r.estado],
      ["Responsable", r => r.usuario]
    ]];

    const s4 = ["Control_Oxigeno_GFA", V30.oxiLog, [
      ["ID", r => r.id],
      ["Fecha", r => r.fecha],
      ["Turno", r => r.turno],
      ["Silla", r => r.silla],
      ["Paciente", r => r.pid + " - " + r.pacNom],
      ["EPS", r => r.eps],
      ["Codigo_SIIS", r => r.codSiis],
      ["Dispositivo", r => r.disp],
      ["Flujo_L_min", r => r.flujo],
      ["Minutos", r => r.min],
      ["Consumo_Litros", r => r.litros],
      ["Consumo_m3", r => r.m3],
      ["SatO2_Pre", r => r.satPre],
      ["SatO2_Post", r => r.satPost],
      ["Cilindro", r => r.cilindro],
      ["Lote", r => r.lote],
      ["PSI_Inicial", r => r.psiIni],
      ["PSI_Final", r => r.psiFin],
      ["Responsable", r => r.resp]
    ]];

    await exportSheets("Reporte_Integral_HD_Cohorte_Eventos_SIIS_" + iso(ST.corte) + ".xlsx", [s1, s2, s3, s4]);
  }

  /* ===================================================================================================
     17. MANEJADOR DE EVENTOS INTERACTIVOS V3.0 (data-v30, inputs y selects)
     =================================================================================================== */
  document.addEventListener("click", async e => {
    const el = e.target.closest("[data-v30]");
    if(!el) return;
    const [act, x, y] = el.dataset.v30.split("|");

    switch(act){
      case "fscale":
        V30.fontScale = parseFloat(x) || 1;
        v30ApplyAppearance();
        pxBar();
        toast("Tamaño de fuente ajustado (" + Math.round(V30.fontScale * 100) + " %).");
        break;
      case "palette":
        V30.palette = x || "ocean";
        v30ApplyAppearance();
        pxBar();
        toast("Paleta de color institucional aplicada.");
        break;
      case "dpmode":
        V30.dpMode = x || "v11";
        pxRender();
        break;
      case "gpctab":
        V30.gpcTab = x;
        render();
        break;
      case "evtab":
        V30.evTab = x;
        render();
        break;
      case "indcat":
        V30.indCatFilter = x;
        render();
        break;
      case "indmode":
        V30.indViewMode = x;
        render();
        break;
      case "rutaturno":
        ST.ui.rutaTurno = x;
        render();
        break;
      case "ukm_calc": {
        V30.ukmCalc.pre = num(($("v30_ukm_pre")||{}).value) || 68;
        V30.ukmCalc.post = num(($("v30_ukm_post")||{}).value) || 21;
        V30.ukmCalc.tMin = num(($("v30_ukm_t")||{}).value) || 240;
        V30.ukmCalc.ufKg = num(($("v30_ukm_uf")||{}).value) || 2.4;
        V30.ukmCalc.wPost = num(($("v30_ukm_w")||{}).value) || 64.5;
        V30.ukmCalc.diuresisMl = num(($("v30_ukm_diu")||{}).value) || 0;
        V30.ukmCalc.bunUri = num(($("v30_ukm_bu")||{}).value) || 220;
        render();
        toast("Cálculo cinético de la urea (UKM / Kt/V) actualizado.");
        break;
      }
      case "gpc_dlg": {
        const g = HD_GPC_ADOPTADAS.find(z => z.id === x) || HD_GPC_ADOPTADAS[0];
        openDlg(g.titulo,
          '<p class="note"><strong>' + esc(g.sub) + '</strong></p>' +
          '<p style="font-size:13.5px">' + esc(g.alcance) + '</p>' +
          '<h4>Metas Clínicas e Indicadores de Control en las 13 Sillas</h4>' +
          '<ul style="font-size:13.5px">' + g.metas.map(m => '<li>' + esc(m) + '</li>').join("") + '</ul>' +
          '<div class="alert ok" style="margin-top:10px"><p><strong>Regla de Decisión Clínica:</strong> ' + esc(g.decisiones) + '</p></div>',
          "Cerrar", () => {});
        break;
      }
      case "prot_dlg": {
        const pr = HD_PROTOCOLOS[+x] || HD_PROTOCOLOS[0];
        openDlg(pr.codigo + " · " + pr.nombre,
          '<p class="note"><strong>Proceso:</strong> ' + esc(pr.proceso) + ' · <strong>Versión:</strong> ' + esc(pr.version) + '</p>' +
          '<p style="font-size:13.5px">' + esc(pr.resumen) + '</p>' +
          '<h4>Pasos Operativos Estandarizados</h4>' +
          '<ol style="font-size:13.5px;display:grid;gap:6px">' + pr.pasos.map(s => '<li>' + esc(s) + '</li>').join("") + '</ol>' +
          '<p class="note" style="margin-top:10px"><strong>Códigos SIIS vinculados:</strong> ' + pr.siis.map(esc).join(" · ") + '</p>',
          "Cerrar", () => {});
        break;
      }
      case "prot_aud": {
        const pr = HD_PROTOCOLOS[+x] || HD_PROTOCOLOS[0];
        openDlg("Lista de Chequeo de Adherencia · " + pr.codigo,
          '<p class="note">' + esc(pr.nombre) + '</p>' +
          '<div class="chkcol">' + pr.pasos.map((s, i) => '<label class="chk" style="font-size:13px"><input type="checkbox" checked> Paso ' + (i+1) + ': ' + esc(s.slice(0, 120)) + '…</label>').join("") + '</div>',
          "Guardar Verificación", () => { toast("Auditoría de protocolo " + pr.codigo + " registrada con 100 % de adherencia."); });
        break;
      }
      case "siis_modal":
        v30OpenSiisBridgeModal();
        break;
      case "ct_modal":
        v30OpenContractCheckerModal();
        break;
      case "siis_new":
        v30OpenNewSiisModal(x, y);
        break;
      case "siis_copy": {
        const ta = $("v30_siis_txt");
        if(ta){
          try { await navigator.clipboard.writeText(ta.value); toast("Bloque estructurado copiado: péguelo en la Historia Clínica de SIIS."); }
          catch(err){ ta.select(); document.execCommand("copy"); toast("Bloque copiado al portapapeles."); }
        }
        break;
      }
      case "siis_json": {
        v30EnsureDemoData();
        const payload = {
          sistemaOrigen: "SIGC_POSMEDICA_V3_0",
          sistemaDestino: "SIIS_HISTORIA_CLINICA",
          codigoRepsIps: "860010090801",
          fechaGeneracion: nowTs(),
          sillasHabilitadas: 13,
          catalogo64Actividades: SIIS_ACTIVIDADES_HD,
          registrosPeriodo: V30.siisActs,
          bitacoraOxigeno: V30.oxiLog
        };
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "Interoperabilidad_SIIS_Hemodialisis_" + iso(TODAY()) + ".json";
        document.body.appendChild(a); a.click(); a.remove();
        toast("Payload JSON de interoperabilidad SIIS descargado.");
        break;
      }
      case "coh_newpac":
        ST.sel.pac = "__new";
        ST.ui.pnew = null;
        v11NavigateAxis("hd", "e2", "pac");
        break;
      case "coh_edit":
        ST.sel.pac = x;
        v11NavigateAxis("hd", "e2", "pac");
        break;
      case "coh_hc":
        ST.ui.vpid = x;
        ST.ui.vmes = ym(ST.corte);
        ST.ui.vdraft = null;
        v11NavigateAxis("hd", "e3", "val");
        break;
      case "open_glab":
        V30.glabPid = x;
        v11NavigateAxis("hd", "e4", "hd_glab");
        break;
      case "reload_real_hd":
        v30LoadRealHdBook(false);
        render();
        break;
      case "amb_toggle": {
        V30.ambFarm = V30.ambFarm || {};
        const cur = V30.ambFarm[x] || { disp: "NO", meds: "Esquema sin registrar", fecha: iso(ST.corte) };
        cur.disp = cur.disp === "SI" ? "NO" : "SI";
        cur.fecha = iso(TODAY());
        V30.ambFarm[x] = cur;
        render();
        toast("Estado de dispensación ambulatoria actualizado para " + x + ".");
        break;
      }
      case "amb_disp_all": {
        V30.ambFarm = V30.ambFarm || {};
        pacs().filter(p => activeAt(p, ST.corte)).forEach(p => {
          V30.ambFarm[p.ID] = {
            disp: "SI",
            meds: (V30.ambFarm[p.ID] && V30.ambFarm[p.ID].meds) || "Esquema sin registrar",
            fecha: iso(TODAY())
          };
        });
        render();
        toast("Dispensación ambulatoria marcada como verificada para los pacientes activos.");
        break;
      }
      case "exp_cohorte_xlsx":
      case "exp_evstat_xlsx":
        await v30ExportCohorteAndSiisXlsx();
        break;
      case "exp_cohorte_csv": {
        ensureIdx();
        const tri = addMonths(ST.corte, -3);
        const rows = pacs().map(p => [
          p.ID, p.TipoDoc || "CC", p.Documento || "", nombre(p), ageAt(p, ST.corte) || "", p.Sexo || "",
          p.EPS || "", p.Turno || "", p.Puesto || "", accessAt(p, ST.corte) || p.AccesoActual || "",
          (lastLab(p, "KtV", tri, ST.corte) || {}).Valor || "",
          (lastLab(p, "Hb", tri, ST.corte) || {}).Valor || "",
          (lastLab(p, "P", tri, ST.corte) || {}).Valor || "",
          semaforo(p, ST.corte).lvl
        ]);
        v30DownloadCsv("Cohorte_Hemodialisis_POSMEDICA_" + iso(ST.corte) + ".csv",
          ["ID","TipoDoc","Documento","Paciente","Edad","Sexo","EPS","Turno","Silla","Acceso","KtV","Hb","Fosforo","Riesgo"], rows);
        break;
      }
      case "exp_evstat_csv": {
        v30EnsureDemoData();
        const { counts } = v30ComputeSiisStats();
        const rows = SIIS_ACTIVIDADES_HD.map(d => [d.no, d.act, d.tipo, d.cat, d.prot, counts[d.no] || 0]);
        v30DownloadCsv("Consolidado_64_Actividades_SIIS_Hemodialisis_" + iso(ST.corte) + ".csv",
          ["No_SIIS","Actividad_Registrada","Clasificacion","Categoria","Protocolo","Total_Periodo"], rows);
        break;
      }
      case "exp_gpc_xlsx": {
        await exportSheets("Matriz_Gobierno_Clinico_GPC_y_Protocolos_HD_" + iso(TODAY()) + ".xlsx", [
          ["GPC_Adoptadas", HD_GPC_ADOPTADAS, [["Codigo", g => g.id], ["Guia", g => g.titulo], ["Proposito", g => g.sub], ["Alcance", g => g.alcance], ["Metas", g => g.metas.join(" | ")], ["Decisiones", g => g.decisiones]]],
          ["Protocolos_HD", HD_PROTOCOLOS, [["Codigo", p => p.codigo], ["Nombre", p => p.nombre], ["Version", p => p.version], ["Proceso", p => p.proceso], ["Resumen", p => p.resumen], ["Codigos_SIIS", p => p.siis.join(", ")]]]
        ]);
        break;
      }
      case "exp_proc_xlsx": {
        await exportSheets("Mapa_Procesos_Unidad_Renal_POSMEDICA_" + iso(TODAY()) + ".xlsx", [
          ["Procesos_Unidad_Renal", UR_PROCESOS_COMPLETOS, [["Codigo", p => p.cod], ["Tipo", p => p.tipo], ["Proceso", p => p.nom], ["Responsable", p => p.resp], ["GPC_Protocolo", p => p.gpc], ["Punto_Control", p => p.ctrl]]]
        ]);
        break;
      }
      case "oxi_calc_btn": {
        V30.oxiCalc.cilindro = ($("v30_oxc_cil")||{}).value || "M";
        V30.oxiCalc.psiIni = num(($("v30_oxc_psi")||{}).value) || 1800;
        V30.oxiCalc.flujo = num(($("v30_oxc_flujo")||{}).value) || 2;
        V30.oxiCalc.min = num(($("v30_oxc_min")||{}).value) || 180;
        if(PX.view === "hd") render(); else pxRender();
        toast("Cálculo de autonomía y consumo de oxígeno actualizado.");
        break;
      }
      case "oxi_save": {
        /* Registro clínico: nada se supone. Paciente, flujo, minutos y SatO2 antes y después se digitan. */
        const pid = ($("v30_ox_p")||{}).value || "";
        const pObj = hdOn() && IDX.pac.get(pid);
        const fl = num(($("v30_ox_fl")||{}).value);
        const mn = num(($("v30_ox_min")||{}).value);
        const sp1 = num(($("v30_ox_sp1")||{}).value), sp2 = num(($("v30_ox_sp2")||{}).value);
        const falta = [!pObj && "paciente", !(fl > 0) && "flujo (L/min)", !(mn > 0) && "minutos", sp1 == null && "SatO2 antes", sp2 == null && "SatO2 después"].filter(Boolean);
        if(falta.length){ toast("Falta registrar: " + falta.join(", ") + "."); break; }
        const lit = Math.round(fl * mn);
        const m3 = +(lit / 1000).toFixed(3);
        const cilId = ($("v30_ox_cil")||{}).value || "CIL-OXI-01";
        const cilObj = V30.oxiCylinders.find(c => c.id === cilId) || V30.oxiCylinders[0];
        const psi1 = num(($("v30_ox_psi1")||{}).value) || cilObj.psi;
        const psi2 = num(($("v30_ox_psi2")||{}).value) || Math.max(200, psi1 - Math.round(lit / (cilObj.factor || 1.56)));
        cilObj.psi = psi2;

        const rec = {
          id: "OXI-" + String(V30.oxiLog.length + 1).padStart(4, "0"),
          fecha: ($("v30_ox_f")||{}).value || iso(TODAY()),
          turno: ($("v30_ox_t")||{}).value || pObj.Turno || "",
          silla: num(($("v30_ox_s")||{}).value) || num(pObj.Puesto) || null,
          pid: pObj.ID,
          pacNom: nombre(pObj),
          eps: pObj.EPS || "",
          codSiis: ($("v30_ox_siis")||{}).value || "3 · SE REALIZA SESIÓN CON OXIGENOTERAPIA",
          indicacion: ($("v30_ox_ind")||{}).value || "Soporte de oxigenoterapia intradiálisis",
          disp: ($("v30_ox_disp")||{}).value || "Cánula nasal",
          flujo: fl,
          hIni: "",
          hFin: "",
          min: mn,
          satPre: sp1,
          satPost: sp2,
          cilindro: cilObj.id,
          lote: cilObj.lote,
          vence: cilObj.vence,
          psiIni: psi1,
          psiFin: psi2,
          litros: lit,
          m3: m3,
          resp: ST.user || (PX.user && PX.user.Nombre) || "Enfermería HD"
        };
        v32GuardarOxi(rec);
        const siisNo = rec.codSiis.startsWith("64") ? "64" : "3";
        const def = SIIS_ACTIVIDADES_HD.find(a => a.no === siisNo) || SIIS_ACTIVIDADES_HD[0];
        v32GuardarSiis({
          id: "SIIS-" + String(V30.siisActs.length + 1).padStart(4, "0"),
          no: def.no,
          act: def.act,
          tipo: def.tipo,
          cat: def.cat,
          prot: "GFA-FO-OXI-001",
          fecha: rec.fecha,
          pid: rec.pid,
          pacNom: rec.pacNom,
          eps: rec.eps,
          turno: rec.turno,
          silla: rec.silla,
          sev: "Informativa",
          nota: rec.disp + " a " + rec.flujo + " L/min por " + rec.min + " min (" + rec.litros + " L · SatO2 " + rec.satPre + "%→" + rec.satPost + "%)",
          estado: "Cerrado",
          usuario: rec.resp
        });
        if(PX.view === "hd") render(); else pxRender();
        toast("Oxigenoterapia registrada (" + lit + " L / " + m3 + " m³) y sincronizada con código SIIS " + siisNo + ".");
        break;
      }
      case "oxi_exp_xlsx": {
        await exportSheets("Formato_Control_Oxigeno_GFA_FO_OXI_001_" + iso(TODAY()) + ".xlsx", [
          ["Bitacora_Oxigeno", V30.oxiLog, [["ID",r=>r.id],["Fecha",r=>r.fecha],["Turno",r=>r.turno],["Silla",r=>r.silla],["Paciente",r=>r.pid+" "+r.pacNom],["EPS",r=>r.eps],["Cod_SIIS",r=>r.codSiis],["Indicacion",r=>r.indicacion],["Dispositivo",r=>r.disp],["Flujo_L_min",r=>r.flujo],["Minutos",r=>r.min],["Consumo_Litros",r=>r.litros],["Consumo_m3",r=>r.m3],["SatO2_Pre",r=>r.satPre],["SatO2_Post",r=>r.satPost],["Cilindro",r=>r.cilindro],["Lote",r=>r.lote],["PSI_Ini",r=>r.psiIni],["PSI_Fin",r=>r.psiFin],["Responsable",r=>r.resp]]],
          ["Kardex_Cilindros", V30.oxiCylinders, [["Cilindro",c=>c.id],["Tipo",c=>c.tipo],["Capacidad_m3",c=>c.capM3],["Ubicacion",c=>c.ubicacion],["Lote",c=>c.lote],["Vencimiento",c=>c.vence],["PSI_Actual",c=>c.psi],["Estado",c=>c.estado]]]
        ]);
        break;
      }
      case "quick_hd":
      case "quick_panel":
      case "quick_dp":
      case "quick_ct": {
        if(!PX.book) await pxDemo();
        v30LoadRealHdBook(true);
        const u = PX.book.usr.find(z => z.Rol === "Administrador") || PX.book.usr[0];
        PX.user = u;
        ST.user = u.Nombre + " · " + u.Cargo;
        v30SyncDp11ToNativeBook();
        if(act === "quick_hd"){
          V12.state.hd = { axis: "e2", sub: "hd_dash" };
          ST.view = "hd_dash";
          V30._lastNavView = "hd_dash";
          pxOpenHD("hd_dash");
        } else if(act === "quick_dp"){
          pxGo("dp");
        } else if(act === "quick_ct"){
          pxGo("ct");
        } else {
          PX.view = "panel";
          pxRender();
        }
        toast("Sesión iniciada con la base real de hemodiálisis (" + ST.book.pac.filter(p => activeAt(p, ST.corte)).length + " activos al corte).");
        break;
      }
    }
  });

  document.addEventListener("change", e => {
    const t = e.target;
    if(!t || !t.id) return;
    if(t.id === "v30_cest"){ V30.cohFilter.estado = t.value; render(); }
    else if(t.id === "v30_ceps"){ V30.cohFilter.eps = t.value; render(); }
    else if(t.id === "v30_cturno"){ V30.cohFilter.turno = t.value; render(); }
    else if(t.id === "v30_cacc"){ V30.cohFilter.acc = t.value; render(); }
    else if(t.id === "v30_criesgo"){ V30.cohFilter.riesgo = t.value; render(); }
    else if(t.id === "v30_ind_eps"){ ST.eps = t.value; syncBar(); render(); }
    else if(t.id === "v30_glab_pac"){ V30.glabPid = t.value; render(); }
    else if(t.id === "v30_ukm_pac" && t.value){
      const p = IDX.pac.get(t.value);
      if(p){
        const bp = lastLab(p, "BUNpre", addMonths(ST.corte, -3), ST.corte);
        const bq = lastLab(p, "BUNpost", addMonths(ST.corte, -3), ST.corte);
        /* Solo se cargan los datos que el paciente tiene; lo que falta conserva el valor de la simulación y se avisa. */
        const falta = [];
        if(bp) V30.ukmCalc.pre = num(bp.Valor); else falta.push("BUN pre (3 meses)");
        if(bq) V30.ukmCalc.post = num(bq.Valor); else falta.push("BUN post (3 meses)");
        if(num(p.DuracionMin)) V30.ukmCalc.tMin = num(p.DuracionMin); else falta.push("duración prescrita");
        if(num(p.PesoSeco)) V30.ukmCalc.wPost = num(p.PesoSeco); else falta.push("peso seco");
        render();
        if(falta.length) toast(p.ID + " no tiene " + falta.join(", ") + ": esos campos siguen con valores de simulación, no del paciente.");
      }
    }
  });

  document.addEventListener("input", e => {
    const t = e.target;
    if(!t || !t.id) return;
    if(t.id === "v30_cq"){
      V30.cohFilter.q = t.value;
      clearTimeout(V30._cqt);
      V30._cqt = setTimeout(() => {
        render();
        const el = $("v30_cq");
        if(el){ el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
      }, 220);
    } else if(t.id === "v30_evq"){
      V30.evSearch = t.value;
      clearTimeout(V30._eqt);
      V30._eqt = setTimeout(() => {
        render();
        const el = $("v30_evq");
        if(el){ el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
      }, 220);
    }
  });

  /* Asegurar que pxDemo cargue los libros institucionales del portal pero mantenga en Hemodiálisis la Base Real POSMÉDICA (Noviembre 2026) */
  if(typeof pxDemo === "function"){
    const pxDemo0 = pxDemo;
    pxDemo = async function(){
      await pxDemo0();
      v30LoadRealHdBook(true);
      pxRender();
    };
  }

  /* En la aplicación web el libro de Hemodiálisis llega del servidor (adaptador-portal.js): no se carga ninguna base
     embebida al iniciar. Los Dashboards mensuales se importan con «Importar libro o Dashboard». */
  pxBar();
  pxRender();
})();

