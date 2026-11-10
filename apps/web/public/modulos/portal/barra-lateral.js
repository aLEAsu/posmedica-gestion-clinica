// Código propio del proyecto. Barra lateral de navegación y tema (v3.2).

/* =====================================================================================================
   SIGC POSMÉDICA v3.2 · MOTOR DE BARRA LATERAL ESTILO GEMINI Y NAVEGACIÓN AMIGABLE POR SUBMÓDULOS
   ===================================================================================================== */
(function(){
  "use strict";

  const G_SUB_LABELS = {
    /* Hemodiálisis - Eje 01 */
    hd_gpc:    ["📘", "GPC y Protocolos (5 GPC + 6 Prot)"],
    hd_ruta:   ["🗺️", "Ruta 360° y Monitor 13 Sillas"],
    hd_proc:   ["⚙️", "Mapa de Procesos (14 Procesos)"],
    hd_plan:   ["📅", "Plan de Trabajo y Capacitación"],
    doc:       ["📂", "Documentos y Guías"],
    ref:       ["📏", "Parámetros y Referencia"],
    /* Hemodiálisis - Eje 02 */
    hd_dash:   ["📊", "Dashboard Gerencial DOPPS"],
    hd_epi:    ["🧬", "Caracterización Epidemiológica"],
    hd_car:    ["💺", "Cohorte (13 Sillas × 4 Turnos)"],
    pac:       ["👥", "Maestro de Pacientes y Ficha 360°"],
    sem:       ["🚦", "Calidad de Diálisis y Semáforo"],
    acc:       ["🩸", "Accesos Vasculares (Fistula First)"],
    tx:        ["🫘", "Trasplante Renal y Lista Espera"],
    alert:     ["🔔", "Alertas Clínicas y Búsqueda Activa"],
    hd_evstat: ["📈", "Eventos y 64 Códigos SIIS"],
    hd_cal12:  ["🗓️", "Calendario Clínico (12 Meses)"],
    /* Hemodiálisis - Eje 03 */
    turno:     ["⏱️", "Turno del Día (Agua + 13 Sillas)"],
    val:       ["🩺", "Valoración Mensual (HC GPC + KRu)"],
    hd_precon: ["👩‍⚕️", "Preconsulta y Multidisciplinaria"],
    hd_qx:     ["🔬", "Procedimientos y Catéteres"],
    lim:       ["🧼", "Limpieza y Desinfección de Sala"],
    /* Hemodiálisis - Eje 04 */
    lab:       ["🧪", "Paraclínicos Mensuales y Solicitud"],
    hd_glab:   ["📉", "Gráficas de Evolución Individual"],
    vac:       ["💉", "Vacunación Hepatitis B (40 µg)"],
    /* Hemodiálisis - Eje 05 */
    hd_anti:   ["💊", "Farmacia Intradiálisis y Ambulatoria"],
    hd_oxi:    ["🫁", "Control de Oxígeno (GFA-FO-OXI-001)"],
    inf:       ["🦠", "Infecciones (IAAS) y PROA"],
    /* Hemodiálisis - Eje 06 */
    hd_cac17:  ["🏆", "Tablero CAC 2026 (17 Indicadores)"],
    ind:       ["📊", "Indicadores CAC y Comparativa EPS"],
    rep:       ["📑", "Matrices y Reportes Regulatorios"],
    cal:       ["✅", "Calidad y Completitud del Dato"],
    /* Hemodiálisis - Eje 07 */
    hd_aud:    ["🔍", "Auditoría Concurrente HC y SISCAC"],
    hd_pamec:  ["🛠️", "Planes de Mejora PAMEC"],
    hd_lib:    ["🔏", "Actas de Liberación de Reportes"],
    /* Hemodiálisis - Eje 08 */
    hd_conc:   ["💰", "Conciliación y Facturación EPS"],
    hd_meta:   ["🎯", "Producción del Mes vs. Meta"]
  };

  const DP_V11_MODS = [
    ["tablero",     "📊", "Tablero General DP"],
    ["habil",       "🛡️", "Habilitación Res. 3100"],
    ["contratos",   "📄", "Contratación por EPS"],
    ["pacientes",   "👥", "Censo de Pacientes DP"],
    ["seguimiento", "🧪", "Calendario y Laboratorio"],
    ["eventos",     "🦠", "Peritonitis y Eventos ISPD"],
    ["visitas",     "🏠", "Visitas Domiciliarias"],
    ["farmacia",    "💊", "Farmacia y Suministros"],
    ["indicadores", "📈", "Indicadores CAC 2026"],
    ["notatec",     "💰", "Nota Técnica y Paquetes"],
    ["config",      "⚙️", "Configuración y Respaldo"]
  ];

  const CT_V11_MODS = [
    ["buscar",    "🔍", "Buscador de Tecnologías (3.336)"],
    ["contratos", "📑", "Contratos y Programas (7)"]
  ];

  const OTHER_PROG_TABS = {
    qt:    [["ses","💉 Sesiones y Doble Verificación"],["proc","⚙️ Procesos y Plan (QT-P01)"],["pamec","🛠️ Auditoría y Mejoramiento"],["prod","📈 Producción y Metas"]],
    lab:   [["sol","🧪 Solicitud del mes · HD"],["vih","🧬 Solicitud del mes · VIH"],["res","📥 Carga de resultados"],["mic","🦠 Microbiología"],["pend","⏱️ Pendientes y oportunidad"]],
    far:   [["anti","💊 Consolidado Farmacéutico"],["oxi","🫁 Control de Oxígeno (GFA-FO-OXI-001)"],["fefo","📦 Lotes y Semáforo FEFO"],["proa","🛡️ Antimicrobianos Restringidos"],["ram","⚠️ Farmacovigilancia"]],
    sp:    [["tab","📊 Tablero de Seguridad"],["rep","🚨 Reportes y Eventos"],["hm","🧼 Higiene de Manos"],["lst","📋 Rondas de Seguridad"]],
    iaas:  [["dir","📥 Bandeja de Gestión"],["proc","⚙️ Procesos IAAS"],["vig","🦠 Vigilancia Epidemiológica"],["ind","📊 Indicadores y Matriz"],["com","🏛️ Comité y Compromisos"],["mej","🛠️ Mejoramiento"],["doc","📂 Documentos"]],
    proa:  [["dir","📥 Bandeja de Gestión"],["proc","⚙️ Procesos PROA"],["vig","💊 Vigilancia de Tratamientos"],["ind","📊 Indicadores y Matriz"],["com","🏛️ Comité y Compromisos"],["mej","🛠️ Mejoramiento"],["doc","📂 Documentos"]],
    sogcs: [["cal","📅 Calendario y Cumplimiento"],["cmp","✅ Compromisos de Comités"],["cat","📚 Catálogo de Comités"]],
    docs:  [["lm","📚 Listado Maestro de Documentos"],["ruta","🗺️ Ruta del Paciente"]],
    msg:   [["in","📥 Bandeja de Recibidos"],["out","📤 Enviados"],["all","🔍 Todos (Auditoría)"]],
    cal:   [["mes","📅 Vista Mensual"],["ag","📋 Agenda Cronológica"]],
    prod:  [["res","📊 Resumen del Mes"],["reg","✍️ Registro de Atenciones"],["tar","💰 Tarifas"],["hd","🏥 Conciliación Hemodiálisis"]],
    th:    [["emp","🌟 Empleados del Mes"],["tur","🗓️ Cuadro de Turnos"],["fmt","📋 Formatos TH"],["cli","💚 Clima y Riesgo Psicosocial"]]
  };

  const G_STATE = {
    collapsed: false,
    mobileOpen: false,
    showBookbar: false,
    expandAllAxes: false,
    openAxes: { e2: true },
    lastTrackedAxis: "e2",
    otherGroupOpen: false,
    filterQ: "",
    dpMod: "tablero",
    ctMod: "buscar"
  };
  window.G_SIDEBAR = G_STATE;

  /* 1. Inicializar en Tema Claro Amigable por defecto en v3.2 (salvo preferencia explícita del usuario en v3.2) */
  function gInitFriendlyTheme(){
    try {
      const savedV32 = localStorage.getItem("sigc_v32_theme_pref");
      const targetTheme = savedV32 || "light";
      if(typeof V10 !== "undefined") V10.theme = targetTheme;
      document.documentElement.setAttribute("data-theme", targetTheme);
      localStorage.setItem("posmedica_theme", targetTheme);
      localStorage.setItem("dp_theme", targetTheme);
    } catch(e){
      document.documentElement.setAttribute("data-theme", "light");
    }
  }
  gInitFriendlyTheme();

  /* 2. Mejorar el embebido de DP11 y CT11 para ocultar su barra lateral duplicada (.side) y gobernarla desde nuestra barra Gemini */
  const gEmbedCleanCss = `
    <style id="v32-gemini-embed-clean">
      .themesw, aside.side { display: none !important; }
      .app { display: block !important; grid-template-columns: minmax(0, 1fr) !important; }
      .main { width: 100% !important; max-width: 1400px !important; margin: 0 auto !important; }
      header.topbar { position: sticky; top: 0; z-index: 10; backdrop-filter: blur(10px); }
    </style>
  `;
  if(typeof v22Srcdoc === "function"){
    const v22SrcdocPrev = v22Srcdoc;
    v22Srcdoc = function(k){
      const raw = v22SrcdocPrev(k);
      const idx = raw.indexOf("</head>");
      return idx >= 0 ? raw.slice(0, idx) + gEmbedCleanCss + raw.slice(idx) : raw + gEmbedCleanCss;
    };
  }

  /* 3. Construir el DOM de la Barra Lateral (#g-sidebar) y la Barra Contextual Superior (#g-topbar) */
  function gEnsureShell(){
    document.body.classList.add("g-has-sidebar");
    if(!document.getElementById("g-backdrop")){
      const bd = document.createElement("div");
      bd.id = "g-backdrop";
      bd.className = "g-backdrop";
      bd.onclick = () => {
        G_STATE.mobileOpen = false;
        document.body.classList.remove("g-mobile-nav-open");
      };
      document.body.appendChild(bd);
    }
    if(!document.getElementById("g-sidebar")){
      const sb = document.createElement("aside");
      sb.id = "g-sidebar";
      sb.className = "g-sidebar";
      sb.setAttribute("aria-label", "Explorador lateral de módulos y submódulos");
      document.body.insertBefore(sb, document.body.firstChild);
    }
    if(!document.getElementById("g-topbar")){
      const tb = document.createElement("header");
      tb.id = "g-topbar";
      tb.className = "g-topbar";
      const pxRoot = document.getElementById("px");
      if(pxRoot) pxRoot.insertBefore(tb, pxRoot.firstChild);
      else document.body.insertBefore(tb, document.body.firstChild);
    }
  }

  /* 4. Obtener etiquetas limpias de programa, eje y submódulo */
  function gActiveProgram(){
    if(!PX || !PX.user) return "hd";
    return PX.view || "panel";
  }

  function gCleanSubLabel(prog, subKey, rawLabel){
    if(prog === "hd" && G_SUB_LABELS[subKey]) return G_SUB_LABELS[subKey];
    const clean = String(rawLabel || subKey)
      .replace(/\s*\([^)]*\)\s*/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return ["•", clean || rawLabel];
  }

  /* 5. Renderizar la Barra Lateral Estilo Gemini */
  function gRenderSidebar(){
    gEnsureShell();
    const sb = document.getElementById("g-sidebar");
    if(!sb) return;

    /* Si el usuario está escribiendo en el buscador del sidebar, actualizar solo la lista para no perder el foco */
    const activeInput = document.activeElement && document.activeElement.id === "g-side-filter-inp";
    const curProg = gActiveProgram();
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const fScale = (window.V30 && window.V30.fontScale) || 1;
    const pal = (window.V30 && window.V30.palette) || "ocean";
    const logoSrc = (document.getElementById("pxlogo") && document.getElementById("pxlogo").src) || "";

    /* Contadores de alertas en vivo */
    let hdAlerts = 0, hdCalBad = 0, unreadMsg = 0;
    try {
      if(typeof ST !== "undefined" && ST.book){
        hdAlerts = alertas().total || 0;
        hdCalBad = calidad().filter(x => x.lvl === "bad").length || 0;
      }
      if(typeof pxUnread === "function") unreadMsg = pxUnread().length || 0;
    } catch(e){}

    const primaryProgs = [
      ["hd",    "🏥", "Hemodiálisis"],
      ["dp",    "💧", "Diálisis Peritoneal"],
      ["nefro", "🛡️", "Nefroprotección"],
      ["vih",   "🧬", "Programa VIH"],
      ["ce",    "🩺", "Consulta Externa"],
      ["ct",    "📄", "Contratos EPS"],
      ["panel", "🧭", "Panel General"]
    ];

    const secondaryProgs = [
      ["ger",   "📊", "Tablero Gerencial"],
      ["qt",    "🎗️", "Quimioterapia"],
      ["lab",   "🧪", "Laboratorio Clínico"],
      ["far",   "💊", "Servicio Farmacéutico"],
      ["sp",    "🛡️", "Seguridad del Paciente"],
      ["iaas",  "🦠", "IAAS"],
      ["proa",  "🧬", "PROA"],
      ["prod",  "📈", "Producción Asistencial"],
      ["sogcs", "🏛️", "SOGCS · Comités"],
      ["cal",   "📅", "Calendario General"],
      ["docs",  "📚", "Documentos y Guías"],
      ["msg",   "✉️", "Mensajes" + (unreadMsg ? " (" + unreadMsg + ")" : "")],
      ["th",    "🌟", "Talento Humano"]
    ];
    if(typeof pxAdmin === "function" && pxAdmin()){
      secondaryProgs.push(["usr", "👥", "Usuarios y Permisos"]);
    }

    /* Construir el árbol de Ejes y Submódulos del programa activo */
    const treeHtml = gBuildSubmodulesTreeHtml(curProg, hdAlerts, hdCalBad);

    if(activeInput){
      const treeBox = document.getElementById("g-side-tree-container");
      if(treeBox){
        treeBox.innerHTML = treeHtml;
        return;
      }
    }

    const uName = (PX && PX.user && PX.user.Nombre) ? PX.user.Nombre : "Coordinación Unidad Renal";
    const uRole = (PX && PX.user && PX.user.Cargo) ? PX.user.Cargo : "Sesión Activa · POSMÉDICA";
    const uInit = uName.trim().slice(0, 2).toUpperCase();

    sb.innerHTML =
      /* Cabecera Superior de la Barra Lateral */
      '<div class="g-side-top">' +
        '<button type="button" class="g-icon-btn" data-gnav="toggle_sidebar" title="Contraer o expandir barra lateral">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>' +
        '</button>' +
        '<button type="button" class="g-brand-btn g-side-expanded-only" data-gnav="prog|hd" title="Ir a Unidad Renal · Hemodiálisis">' +
          (logoSrc ? '<img class="g-brand-logo" src="' + logoSrc + '" alt="POSMÉDICA">' : '') +
          '<span class="g-brand-txt">' +
            '<strong>SIGC POSMÉDICA</strong>' +
            '<small>Unidad Renal & Programas · v3.1</small>' +
          '</span>' +
        '</button>' +
      '</div>' +

      /* Modo Rail (cuando la barra está colapsada a 68px en escritorio) */
      '<div class="g-side-rail-only">' +
        primaryProgs.map(([k, ico, lbl]) =>
          '<button type="button" class="g-rail-btn ' + (curProg === k ? 'active' : '') + '" data-gnav="prog|' + k + '" title="' + esc(lbl) + '">' +
            '<span>' + ico + '</span><small>' + esc(k.toUpperCase().slice(0, 3)) + '</small>' +
          '</button>'
        ).join("") +
        '<div style="height:1px;width:36px;background:var(--line);margin:4px 0"></div>' +
        ((V12 && V12.map && V12.map[curProg]) ? V12.axes.map(([ax, num, lbl]) => {
          const curAx = (V12.state[curProg] && V12.state[curProg].axis) || "e1";
          return '<button type="button" class="g-rail-btn ' + (curAx === ax ? 'active' : '') + '" data-gnav="rail_axis|' + curProg + '|' + ax + '" title="Eje ' + num + ' · ' + esc(lbl) + '">' +
            '<small style="font-size:11px">' + num + '</small>' +
          '</button>';
        }).join("") : '') +
        '<div style="margin-top:auto;display:flex;flex-direction:column;gap:6px;align-items:center">' +
          '<button type="button" class="g-rail-btn" data-v12="cmdk" title="Buscar paciente MPI (Ctrl+K)">🔎</button>' +
          '<button type="button" class="g-rail-btn" data-gnav="theme" title="Cambiar tema Claro / Oscuro">' + (isDark ? '☀️' : '🌙') + '</button>' +
        '</div>' +
      '</div>' +

      /* Contenido Expandido Estilo Gemini */
      '<div class="g-side-search-wrap g-side-expanded-only">' +
        '<div class="g-side-search">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>' +
          '<input type="search" id="g-side-filter-inp" placeholder="Filtrar submódulos (ej. Kt/V, CAC, turno)..." value="' + esc(G_STATE.filterQ) + '" autocomplete="off">' +
        '</div>' +
        '<button type="button" class="g-mpi-pill" data-v12="cmdk" title="Buscador Maestro de Pacientes en las 5 cohortes (Ctrl+K)">🔎 MPI</button>' +
      '</div>' +

      '<div class="g-side-scroll g-side-expanded-only">' +
        /* 1. Selector de Módulo Principal */
        '<div>' +
          '<div class="g-sec-hdr">' +
            '<span>Módulos Principales</span>' +
            '<button type="button" data-gnav="toggle_other_progs">' + (G_STATE.otherGroupOpen ? 'Menos ▴' : '+13 más ▾') + '</button>' +
          '</div>' +
          '<div class="g-prog-grid">' +
            primaryProgs.map(([k, ico, lbl]) =>
              '<button type="button" class="g-prog-chip" data-gnav="prog|' + k + '" aria-current="' + (curProg === k) + '" title="' + esc(lbl) + '">' +
                '<span class="g-p-ico">' + ico + '</span>' +
                '<span class="g-p-lbl">' + esc(lbl) + '</span>' +
              '</button>'
            ).join("") +
          '</div>' +
          (G_STATE.otherGroupOpen || secondaryProgs.some(([k]) => k === curProg) ? (
            '<div class="g-prog-grid" style="margin-top:6px;padding-top:6px;border-top:1px dashed var(--line)">' +
              secondaryProgs.map(([k, ico, lbl]) =>
                '<button type="button" class="g-prog-chip" data-gnav="prog|' + k + '" aria-current="' + (curProg === k) + '" title="' + esc(lbl) + '">' +
                  '<span class="g-p-ico">' + ico + '</span>' +
                  '<span class="g-p-lbl">' + esc(lbl) + '</span>' +
                '</button>'
              ).join("") +
            '</div>'
          ) : '') +
        '</div>' +

        /* 2. Árbol de Ejes y Submódulos del Programa Activo */
        '<div id="g-side-tree-container">' +
          treeHtml +
        '</div>' +
      '</div>' +

      /* Pie de la Barra Lateral */
      '<div class="g-side-foot g-side-expanded-only">' +
        '<div class="g-foot-actions">' +
          '<button type="button" class="g-foot-btn bad" data-g="fabsp" title="Reportar incidente o evento adverso en Seguridad del Paciente">🚨 Evento</button>' +
          '<button type="button" class="g-foot-btn" data-g="fabnov" title="Enviar novedad del servicio a Coordinación">📢 Novedad</button>' +
          '<button type="button" class="g-foot-btn" data-gnav="books_modal" title="Gestión de Libros Excel, Respaldo Local e Impresión">💾 Libros</button>' +
        '</div>' +
        '<div class="g-foot-prefs">' +
          '<div class="g-pref-group" title="Tema visual">' +
            '<button type="button" data-gnav="set_theme|light" aria-pressed="' + (!isDark) + '">☀ Claro</button>' +
            '<button type="button" data-gnav="set_theme|dark" aria-pressed="' + (isDark) + '">☾ Oscuro</button>' +
          '</div>' +
          '<div class="g-pref-group" title="Tamaño de texto">' +
            '<button type="button" data-v30="fscale|0.94" aria-pressed="' + (fScale < 0.97) + '">A-</button>' +
            '<button type="button" data-v30="fscale|1" aria-pressed="' + (fScale >= 0.97 && fScale <= 1.04) + '">A</button>' +
            '<button type="button" data-v30="fscale|1.07" aria-pressed="' + (fScale > 1.04) + '">A+</button>' +
          '</div>' +
          '<div class="g-pref-group" title="Acento de color">' +
            '<button type="button" data-v30="palette|ocean" aria-pressed="' + (pal === "ocean") + '" title="Azul Gemini"><span class="v30-pal-dot" style="background:#0b57d0"></span></button>' +
            '<button type="button" data-v30="palette|emerald" aria-pressed="' + (pal === "emerald") + '" title="Esmeralda Renal"><span class="v30-pal-dot" style="background:#059669"></span></button>' +
            '<button type="button" data-v30="palette|royal" aria-pressed="' + (pal === "royal") + '" title="Índigo"><span class="v30-pal-dot" style="background:#4f46e5"></span></button>' +
          '</div>' +
        '</div>' +
        '<div class="g-user-row">' +
          '<div class="g-user-info">' +
            '<span class="g-avatar">' + esc(uInit) + '</span>' +
            '<span class="g-user-txt"><b>' + esc(uName) + '</b><small>' + esc(uRole) + '</small></span>' +
          '</div>' +
          '<button type="button" class="btn sm" data-p="logout" title="Cambiar de usuario o ir a la portada">Salir</button>' +
        '</div>' +
      '</div>';

    const inp = document.getElementById("g-side-filter-inp");
    if(inp){
      inp.oninput = (ev) => {
        G_STATE.filterQ = ev.target.value || "";
        const treeBox = document.getElementById("g-side-tree-container");
        if(treeBox) treeBox.innerHTML = gBuildSubmodulesTreeHtml(gActiveProgram(), hdAlerts, hdCalBad);
      };
    }
  }

  /* 6. Generar el HTML del árbol de Ejes y Submódulos según el programa activo */
  function gBuildSubmodulesTreeHtml(curProg, hdAlerts, hdCalBad){
    const q = norm(G_STATE.filterQ || "");

    /* Caso A: Diálisis Peritoneal (conmutador entre Operación DP v1.1 y Gobernanza 7 Ejes) */
    if(curProg === "dp"){
      const dpMode = (window.V30 && window.V30.dpMode) || "v11";
      let h =
        '<div class="g-sec-hdr">' +
          '<span>Submódulos · Diálisis Peritoneal</span>' +
        '</div>' +
        '<div class="seg" style="display:grid;grid-template-columns:1fr 1fr;margin-bottom:8px">' +
          '<button type="button" data-v30="dpmode|v11" aria-pressed="' + (dpMode === "v11") + '" style="font-size:11.5px;padding:5px">📋 DP Operativa</button>' +
          '<button type="button" data-v30="dpmode|axes" aria-pressed="' + (dpMode === "axes") + '" style="font-size:11.5px;padding:5px">🧭 7 Ejes</button>' +
        '</div>';

      if(dpMode === "v11"){
        const items = DP_V11_MODS.filter(([k, ico, lbl]) => !q || norm(lbl + " " + k).includes(q));
        h += '<div class="g-axis-list">' +
          items.map(([k, ico, lbl]) =>
            '<button type="button" class="g-sub-item" style="margin-left:0;padding:8px 12px" data-gnav="dp11_mod|' + k + '" aria-current="' + (G_STATE.dpMod === k ? 'page' : 'false') + '">' +
              '<span class="g-sub-item-txt">' + ico + ' ' + esc(lbl) + '</span>' +
            '</button>'
          ).join("") +
        '</div>';
        return h;
      }
      /* Si está en modo axes, continúa abajo con V12.map.dp */
    }

    /* Caso B: Contratos y Tecnologías (CT v1.1) */
    if(curProg === "ct"){
      const items = CT_V11_MODS.filter(([k, ico, lbl]) => !q || norm(lbl).includes(q));
      return '<div class="g-sec-hdr"><span>Submódulos · Contratos EPS</span></div>' +
        '<div class="g-axis-list">' +
          items.map(([k, ico, lbl]) =>
            '<button type="button" class="g-sub-item" style="margin-left:0;padding:8px 12px" data-gnav="ct11_mod|' + k + '" aria-current="' + (G_STATE.ctMod === k ? 'page' : 'false') + '">' +
              '<span class="g-sub-item-txt">' + ico + ' ' + esc(lbl) + '</span>' +
            '</button>'
          ).join("") +
        '</div>';
    }

    /* Caso C: Programas con Arquitectura de Ejes (Hemodiálisis, Nefroprotección, VIH, Consulta Externa, DP-Ejes) */
    if(typeof V12 !== "undefined" && V12.map && V12.map[curProg]){
      const M = V12.map[curProg];
      const st = V12.state[curProg] || { axis: "e2", sub: "" };
      const curAxis = st.axis || "e2";
      const curSub = st.sub || "";
      /* Si cambió el eje activo, abrir exclusivamente ese eje (modo acordeón limpio) salvo que Expandir todo esté activo */
      if(G_STATE.lastTrackedAxis !== curAxis){
        G_STATE.lastTrackedAxis = curAxis;
        if(!G_STATE.expandAllAxes){
          G_STATE.openAxes = { [curAxis]: true };
        } else {
          G_STATE.openAxes[curAxis] = true;
        }
      }

      const progTitle = (typeof PROG !== "undefined" && PROG[curProg]) ? PROG[curProg].n : curProg.toUpperCase();
      let h =
        '<div class="g-sec-hdr">' +
          '<span>Ejes y Submódulos · ' + esc(progTitle) + '</span>' +
          '<button type="button" data-gnav="toggle_all_axes">' + (G_STATE.expandAllAxes ? 'Contraer' : 'Expandir todo') + '</button>' +
        '</div>' +
        '<div class="g-axis-list">';

      V12.axes.forEach(([ax, num, axLbl]) => {
        const subs = M[ax] || [];
        if(!subs.length) return;
        const filteredSubs = q
          ? subs.filter(([sk, sl]) => {
              const shortL = gCleanSubLabel(curProg, sk, sl)[1];
              return norm(axLbl + " " + sl + " " + shortL + " " + sk).includes(q);
            })
          : subs;
        if(q && !filteredSubs.length) return;

        const isOpen = !!(q || G_STATE.expandAllAxes || G_STATE.openAxes[ax]);
        const isActive = (curAxis === ax);
        const axBadgeCnt = (curProg === "hd" && ax === "e2" && hdAlerts) ? hdAlerts : (curProg === "hd" && ax === "e6" && hdCalBad) ? hdCalBad : 0;

        h +=
          '<div class="g-axis-group ' + (isOpen ? 'is-open ' : '') + (isActive ? 'is-active' : '') + '">' +
            '<button type="button" class="g-axis-trigger" data-gnav="toggle_axis|' + curProg + '|' + ax + '" title="Eje ' + num + ' · ' + esc(axLbl) + '">' +
              '<span class="g-axis-badge">' + esc(num) + '</span>' +
              '<span class="g-axis-title">' + esc(axLbl) + '</span>' +
              (axBadgeCnt ? '<span class="g-axis-alert">' + axBadgeCnt + '</span>' : '') +
              '<svg class="g-axis-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>' +
            '</button>' +
            '<div class="g-sub-list">' +
              filteredSubs.map(([sk, sl]) => {
                const [ico, shortLbl] = gCleanSubLabel(curProg, sk, sl);
                const subCnt = (curProg === "hd" && sk === "alert" && hdAlerts) ? hdAlerts : (curProg === "hd" && sk === "cal" && hdCalBad) ? hdCalBad : 0;
                return '<button type="button" class="g-sub-item" data-v12="sub|' + curProg + '|' + ax + '|' + sk + '" aria-current="' + (curSub === sk ? 'page' : 'false') + '" title="' + esc(sl) + '">' +
                  '<span class="g-sub-item-txt">' + (ico !== "•" ? ico + ' ' : '') + esc(shortLbl) + '</span>' +
                  (subCnt ? '<span class="g-sub-cnt">' + subCnt + '</span>' : '') +
                '</button>';
              }).join("") +
            '</div>' +
          '</div>';
      });
      h += '</div>';
      return h;
    }

    /* Caso D: Programas Transversales, de Apoyo y Gestión con subpestañas */
    if(OTHER_PROG_TABS[curProg]){
      const tabs = OTHER_PROG_TABS[curProg];
      const curSub = (curProg === "th" && window.V13) ? (window.V13.th.tab || "emp") : (PX && PX.ui && (PX.ui.sub || PX.ui.calv)) || tabs[0][0];
      const progTitle = (typeof PROG !== "undefined" && PROG[curProg]) ? PROG[curProg].n : curProg;
      return '<div class="g-sec-hdr"><span>Secciones · ' + esc(progTitle) + '</span></div>' +
        '<div class="g-axis-list">' +
          tabs.map(([tk, tl]) =>
            '<button type="button" class="g-sub-item" style="margin-left:0;padding:8px 12px" data-gnav="other_sub|' + curProg + '|' + tk + '" aria-current="' + (curSub === tk ? 'page' : 'false') + '">' +
              '<span class="g-sub-item-txt">' + esc(tl) + '</span>' +
            '</button>'
          ).join("") +
        '</div>';
    }

    /* Caso E: Panel General de Programas o Tablero Gerencial → mostrar acceso directo a los 8 Ejes de Hemodiálisis */
    return gBuildSubmodulesTreeHtml("hd", hdAlerts, hdCalBad);
  }

  /* 7. Renderizar la Barra Contextual Superior Minimalista (#g-topbar) */
  function gRenderTopbar(){
    gEnsureShell();
    const tb = document.getElementById("g-topbar");
    if(!tb) return;

    const curProg = gActiveProgram();
    const progName = curProg === "panel" ? "Panel General" : (typeof PROG !== "undefined" && PROG[curProg] ? PROG[curProg].n : "Hemodiálisis");
    let axisLabel = "";
    let subLabel = "";

    if(typeof V12 !== "undefined" && V12.map && V12.map[curProg]){
      const st = V12.state[curProg] || { axis: "e2", sub: "" };
      const axObj = V12.axes.find(a => a[0] === st.axis);
      if(axObj) axisLabel = "Eje " + axObj[1];
      const subs = V12.map[curProg][st.axis] || [];
      const subObj = subs.find(s => s[0] === st.sub);
      if(subObj) subLabel = gCleanSubLabel(curProg, st.sub, subObj[1])[1];
    } else if(curProg === "dp"){
      axisLabel = "Unidad Renal";
      const m = DP_V11_MODS.find(x => x[0] === G_STATE.dpMod);
      subLabel = m ? m[2] : "Diálisis Peritoneal v1.1";
    } else if(curProg === "ct"){
      axisLabel = "Contratación";
      const m = CT_V11_MODS.find(x => x[0] === G_STATE.ctMod);
      subLabel = m ? m[2] : "Buscador de Tecnologías";
    }

    /* Estadísticas rápidas de Hemodiálisis para el encabezado */
    let hdStatsHtml = "";
    if(curProg === "hd" && typeof ST !== "undefined" && ST.book){
      try {
        ensureIdx();
        const nAct = pacs().filter(p => activeAt(p, ST.corte)).length;
        hdStatsHtml =
          '<span class="g-stat-pill" title="Pacientes activos en las 13 sillas de Hemodiálisis"><b>' + nAct + '</b> activos</span>' +
          '<span class="g-stat-pill" title="Fecha de corte activa">Corte: <b>' + fd(ST.corte) + '</b></span>' +
          (ST.eps ? '<span class="g-stat-pill">EPS: <b>' + esc(ST.eps) + '</b></span>' : '');
      } catch(e){}
    }

    tb.innerHTML =
      '<div class="g-top-left">' +
        '<button type="button" class="g-icon-btn g-top-menu-btn" data-gnav="toggle_sidebar" title="Mostrar u ocultar menú lateral">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 6h16M4 12h16M4 18h16"/></svg>' +
        '</button>' +
        '<nav class="g-breadcrumb" aria-label="Ubicación actual">' +
          '<button type="button" class="g-bc-prog" data-gnav="prog|panel" title="Ir al Panel General de Programas">🏠 Programas</button>' +
          '<span>›</span>' +
          '<button type="button" class="g-bc-prog" data-gnav="prog|' + esc(curProg) + '">' + esc(progName) + '</button>' +
          (axisLabel ? '<span>›</span><span class="g-bc-axis">' + esc(axisLabel) + '</span>' : '') +
          (subLabel ? '<span>›</span><strong class="g-bc-sub">' + esc(subLabel) + '</strong>' : '') +
        '</nav>' +
      '</div>' +
      '<div class="g-top-right">' +
        hdStatsHtml +
        (curProg === "hd" ? (
          '<button type="button" class="g-top-btn ' + (G_STATE.showBookbar ? 'active' : '') + '" data-gnav="toggle_bookbar" title="Mostrar u ocultar filtros de fecha de corte, EPS y cargue de libros">' +
            '⚙️ Filtros y Corte ' + (G_STATE.showBookbar ? '▴' : '▾') +
          '</button>' +
          '<button type="button" class="g-top-btn primary" data-v30="siis_modal" title="Puente de Interoperabilidad SIGC ↔ SIIS">🔗 Puente SIIS</button>' +
          '<button type="button" class="g-top-btn" data-v30="ct_modal" title="Consultar las 3.336 tecnologías contratadas por EPS">📄 Contratos</button>'
        ) : (
          '<button type="button" class="g-top-btn" data-v12="cmdk" title="Buscar paciente en las 5 cohortes (Ctrl+K)">🔎 Buscar Paciente</button>'
        )) +
      '</div>';
  }

  /* 8. Modal unificado para Gestión de Libros Excel, Respaldo e Impresión */
  function gOpenBooksModal(){
    const modLbl = (PX && PX.view === "hd") ? "libro de Hemodiálisis" : (PX && PX.view === "dp") ? "libro de Diálisis Peritoneal" : (PX && PX.view === "vih") ? "libro del Programa VIH" : (PX && PX.view === "ce") ? "libro de Consulta Externa" : (PX && PX.view === "nefro") ? "libro de Nefroprotección" : "libro institucional";
    const body =
      '<p class="note" style="margin:0 0 10px">Gestione desde aquí las descargas en Excel (.xlsx), el respaldo local en el navegador (IndexedDB) y la impresión en PDF:</p>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px">' +
        '<button type="button" class="btn primary" data-v30="exp_evstat_xlsx" data-cerrar-dlg="1">📥 Reporte Integral HD (.xlsx)</button>' +
        '<button type="button" class="btn" data-v12="expcur" data-cerrar-dlg="1">💾 Descargar ' + esc(modLbl) + ' (.xlsx)</button>' +
        '<button type="button" class="btn" data-v9="masterexp" data-cerrar-dlg="1">📦 Descargar Libro Maestro (5 libros)</button>' +
        '<button type="button" class="btn" data-p="bookexp" data-cerrar-dlg="1">🏛️ Descargar Libro Institucional (.xlsx)</button>' +
        '<button type="button" class="btn" data-v12="savelocal" data-cerrar-dlg="1">🔒 Guardar Copia Local (IndexedDB)</button>' +
        '<button type="button" class="btn" data-v9="restore" data-cerrar-dlg="1">♻️ Restaurar Copia Local (IndexedDB)</button>' +
        '<button type="button" class="btn" data-g="print" data-cerrar-dlg="1">🖨️ Imprimir Vista Actual / PDF</button>' +
      '</div>';
    if(typeof openDlg === "function"){
      openDlg("Gestión de Libros Excel, Respaldo e Impresión", body, "Cerrar", () => {});
    }
  }

  /* 9. Sincronizar navegación y estado con la barra lateral y la barra superior */
  function gSyncAllUI(){
    try {
      gRenderSidebar();
      gRenderTopbar();
    } catch(e){ console.error("gSyncAllUI:", e); }
  }

  /* Interceptar render() y pxRender() y pxBar() para mantener siempre actualizada la barra lateral Gemini */
  if(typeof render === "function"){
    const renderPrev = render;
    render = function(){
      renderPrev();
      gSyncAllUI();
    };
  }
  if(typeof pxRender === "function"){
    const pxRenderPrev = pxRender;
    pxRender = function(){
      pxRenderPrev();
      gSyncAllUI();
    };
  }
  if(typeof pxBar === "function"){
    const pxBarPrev = pxBar;
    pxBar = function(){
      pxBarPrev();
      gSyncAllUI();
    };
  }

  /* 10. Manejador de clics de la barra lateral Gemini (data-gnav) */
  document.addEventListener("click", async e => {
    const subBtn = e.target.closest("[data-v12^='sub|']");
    if(subBtn){
      G_STATE.mobileOpen = false;
      document.body.classList.remove("g-mobile-nav-open");
    }

    const el = e.target.closest("[data-gnav]");
    if(!el) return;
    const [act, x, y] = el.dataset.gnav.split("|");

    switch(act){
      case "toggle_sidebar": {
        if(window.innerWidth <= 980){
          G_STATE.mobileOpen = !G_STATE.mobileOpen;
          document.body.classList.toggle("g-mobile-nav-open", G_STATE.mobileOpen);
        } else {
          G_STATE.collapsed = !G_STATE.collapsed;
          document.body.classList.toggle("g-sidebar-collapsed", G_STATE.collapsed);
        }
        break;
      }
      case "toggle_bookbar": {
        G_STATE.showBookbar = !G_STATE.showBookbar;
        document.body.classList.toggle("g-show-bookbar", G_STATE.showBookbar);
        gRenderTopbar();
        break;
      }
      case "toggle_other_progs": {
        G_STATE.otherGroupOpen = !G_STATE.otherGroupOpen;
        gRenderSidebar();
        break;
      }
      case "toggle_all_axes": {
        G_STATE.expandAllAxes = !G_STATE.expandAllAxes;
        if(G_STATE.expandAllAxes && typeof V12 !== "undefined"){
          V12.axes.forEach(([ax]) => { G_STATE.openAxes[ax] = true; });
        } else {
          const curP = gActiveProgram();
          const curA = (V12 && V12.state && V12.state[curP] && V12.state[curP].axis) || "e2";
          G_STATE.openAxes = { [curA]: true };
        }
        gRenderSidebar();
        break;
      }
      case "toggle_axis": {
        const wasOpen = !!G_STATE.openAxes[y];
        if(!G_STATE.expandAllAxes){
          G_STATE.openAxes = wasOpen ? {} : { [y]: true };
        } else {
          G_STATE.openAxes[y] = !wasOpen;
        }
        gRenderSidebar();
        break;
      }
      case "rail_axis": {
        /* Si hace clic en un número de eje desde el modo colapsado (rail), expandir el sidebar y navegar al eje */
        G_STATE.collapsed = false;
        document.body.classList.remove("g-sidebar-collapsed");
        G_STATE.openAxes = { [y]: true };
        if(typeof v11NavigateAxis === "function") v11NavigateAxis(x, y);
        gSyncAllUI();
        break;
      }
      case "prog": {
        G_STATE.mobileOpen = false;
        document.body.classList.remove("g-mobile-nav-open");
        if(!PX.book && typeof pxDemo === "function") await pxDemo();
        if(!PX.user && PX.book && PX.book.usr && PX.book.usr.length){
          const u = PX.book.usr.find(z => z.Rol === "Administrador") || PX.book.usr[0];
          PX.user = u;
          ST.user = u.Nombre + " · " + u.Cargo;
        }
        if(x === "hd"){
          pxOpenHD(ST.view || "hd_dash");
        } else if(x === "panel"){
          PX.view = "panel";
          document.getElementById("hdapp").hidden = true;
          document.getElementById("nefroapp").hidden = true;
          document.getElementById("extapp").hidden = true;
          document.getElementById("pxmain").hidden = false;
          pxRender();
        } else {
          pxGo(x);
        }
        gSyncAllUI();
        break;
      }
      case "dp11_mod": {
        G_STATE.dpMod = x;
        G_STATE.mobileOpen = false;
        document.body.classList.remove("g-mobile-nav-open");
        if(window.V30) window.V30.dpMode = "v11";
        if(PX.view !== "dp") pxGo("dp");
        const tryGoDp = () => {
          const f = (typeof v22Frame === "function" ? v22Frame("dp") : null);
          if(f && f.contentWindow && typeof f.contentWindow.go === "function"){
            f.contentWindow.go(x);
            return true;
          }
          return false;
        };
        if(!tryGoDp()) setTimeout(tryGoDp, 220);
        gSyncAllUI();
        break;
      }
      case "ct11_mod": {
        G_STATE.ctMod = x;
        G_STATE.mobileOpen = false;
        document.body.classList.remove("g-mobile-nav-open");
        if(PX.view !== "ct") pxGo("ct");
        const tryGoCt = () => {
          const f = (typeof v22Frame === "function" ? v22Frame("ct") : null);
          if(f && f.contentWindow && f.contentWindow.VIEW && typeof f.contentWindow.render === "function"){
            f.contentWindow.VIEW.v = x;
            f.contentWindow.VIEW.ficha = "";
            f.contentWindow.render();
            return true;
          }
          return false;
        };
        if(!tryGoCt()) setTimeout(tryGoCt, 220);
        gSyncAllUI();
        break;
      }
      case "other_sub": {
        G_STATE.mobileOpen = false;
        document.body.classList.remove("g-mobile-nav-open");
        if(x === "th" && window.V13){
          window.V13.th.tab = y;
          pxRender();
        } else if(x === "msg"){
          PX.ui.sub = y;
          PX.ui.th = null;
          pxRender();
        } else if(x === "cal"){
          PX.ui.calv = y;
          pxRender();
        } else {
          pxGo(x, y);
        }
        gSyncAllUI();
        break;
      }
      case "set_theme": {
        const target = x === "dark" ? "dark" : "light";
        if(typeof V10 !== "undefined") V10.theme = target;
        document.documentElement.setAttribute("data-theme", target);
        try {
          localStorage.setItem("sigc_v32_theme_pref", target);
          localStorage.setItem("posmedica_theme", target);
          localStorage.setItem("dp_theme", target);
        } catch(err){}
        if(typeof v12SyncNefroTheme === "function") v12SyncNefroTheme();
        if(typeof V22 !== "undefined" && V22.apps && typeof v22Sync === "function"){
          Object.keys(V22.apps).forEach(v22Sync);
        }
        gSyncAllUI();
        break;
      }
      case "theme": {
        const isDarkNow = document.documentElement.getAttribute("data-theme") === "dark";
        const nextT = isDarkNow ? "light" : "dark";
        if(typeof V10 !== "undefined") V10.theme = nextT;
        document.documentElement.setAttribute("data-theme", nextT);
        try {
          localStorage.setItem("sigc_v32_theme_pref", nextT);
          localStorage.setItem("posmedica_theme", nextT);
          localStorage.setItem("dp_theme", nextT);
        } catch(err){}
        if(typeof v12SyncNefroTheme === "function") v12SyncNefroTheme();
        if(typeof V22 !== "undefined" && V22.apps && typeof v22Sync === "function"){
          Object.keys(V22.apps).forEach(v22Sync);
        }
        gSyncAllUI();
        break;
      }
      case "books_modal": {
        gOpenBooksModal();
        break;
      }
    }
  });

  /* 11. Arranque amigable sin fricción: iniciar directamente en Hemodiálisis con la barra lateral lista para explorar */
  async function gAutoBootFriendlyWorkspace(){
    gEnsureShell();
    try {
      if(!PX.book && typeof pxDemo === "function"){
        await pxDemo();
      }
      if(typeof hdxLoadBase === "function" && (!ST.book || ST.demo)){
        hdxLoadBase(true);
      }
      if(!PX.user && PX.book && Array.isArray(PX.book.usr) && PX.book.usr.length){
        const adminU = PX.book.usr.find(z => z.Rol === "Administrador") || PX.book.usr[0];
        PX.user = adminU;
        ST.user = adminU.Nombre + " · " + adminU.Cargo;
      }
      if(typeof V12 !== "undefined" && V12.state && V12.state.hd){
        V12.state.hd.axis = "e2";
        V12.state.hd.sub = "hd_dash";
      }
      G_STATE.openAxes = { e2: true };
      G_STATE.lastTrackedAxis = "e2";
      ST.view = "hd_dash";
      if(typeof pxOpenHD === "function"){
        pxOpenHD("hd_dash", true);
      }
      /* Ocultar el toast inicial de clave demo ya que la sesión arranca lista para explorar */
      const tEl = document.getElementById("toast");
      if(tEl){
        tEl.hidden = true;
        if(typeof toast === "function" && toast._t) clearTimeout(toast._t);
      }
    } catch(e){
      console.error("gAutoBootFriendlyWorkspace:", e);
    }
    gSyncAllUI();
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", gAutoBootFriendlyWorkspace);
  } else {
    setTimeout(gAutoBootFriendlyWorkspace, 10);
  }
})();

