/* Adaptador del portal: conecta el portal ORIGINAL del prototipo (portal.js, sin modificar) con la base de datos.
   En esta página viven, como en el prototipo, Hemodiálisis (sección #hdapp), VIH, los módulos transversales
   (Laboratorio, Producción, Seguridad del paciente, IAAS, PROA, SOGCS, Documentos, Mensajes, Calendario), la Ruta de
   Nefroprotección (iframe #nefroframe, «cargada desde el servidor») y las fichas de los programas sin módulo propio.
   - La sesión y los permisos vienen del servidor; PX.user y el directorio de usuarios se arman con ellos.
   - Se cargan los tres libros que usa el portal, según los permisos: el institucional (/portal), VIH (/vih) y
     Hemodiálisis (/hd, que también consultan Laboratorio, Producción, SP, IAAS y PROA). Cada uno se guarda solo.
   - La navegación hacia el panel o Usuarios la hace el portal nuevo.
   - Se retiran los datos ficticios y la carga y descarga de libros; queda la carga inicial (administrador). */
(function () {
  "use strict";
  const { pedir, avisarPortal, crearSincronizador } = window.POSMEDICA;
  const TRANSVERSALES = ["lab", "prod", "sp", "iaas", "proa"];
  const ABIERTOS = ["msg", "docs", "cal"];
  let USU = null, ADMIN = false;
  const permiso = (prog, acc) => ADMIN || !!(USU && USU.permisos.find((x) => x.programa === prog && x.ver && x[acc]));
  // Hemodiálisis, VIH y DP los consultan también los módulos transversales; Consulta externa solo su programa.
  const leeLibro = (prog) => ADMIN || permiso(prog, "ver") || (prog !== "ce" && TRANSVERSALES.some((t) => permiso(t, "ver")));
  // Carga inicial en confirmación: "vih", "hd" o false (al cerrar el diálogo sin guardar, se descarta).
  let confirmando = false, guardandoImport = false;
  const FUENTE_HD = "Base de datos POSMÉDICA";
  // La Ruta de Nefroprotección se abre dentro del portal desde el servidor (configuración «nefro_url» del prototipo).
  const RUTA_NEFRO = "/modulos/nefro/index.html";

  const estadoEl = document.createElement("div");
  estadoEl.className = "estado-modulo";
  estadoEl.setAttribute("role", "status");

  /** Registro sin campos internos; los libros del portal y de VIH se guardan como texto. */
  function planoTexto(r) {
    const o = {};
    for (const k of Object.keys(r)) {
      if (k.charAt(0) === "_") continue;
      const v = r[k];
      if (typeof v === "function") continue;
      o[k] = v instanceof Date ? iso(v) : v === undefined || v === null ? "" : v;
    }
    return o;
  }
  /** Hemodiálisis conserva números y null (como su libro de Excel). */
  function planoHD(r) {
    const o = {};
    for (const k of Object.keys(r)) {
      if (k.charAt(0) === "_") continue;
      const v = r[k];
      if (typeof v === "function") continue;
      o[k] = v instanceof Date ? iso(v) : v === undefined ? null : v;
    }
    return o;
  }
  /** Configuración en filas {Clave, Valor} (libro institucional y VIH). */
  const cfgFilas = (libro) => ({
    cfgLeer: () => Object.fromEntries(((libro() || {}).cfg || []).map((r) => [r.Clave, r.Valor])),
    cfgRevertir: (k, v) => {
      const L = libro().cfg;
      const i = L.findIndex((r) => r.Clave === k);
      if (v === undefined) {
        if (i >= 0) L.splice(i, 1);
      } else if (i >= 0) L[i].Valor = v;
      else L.push({ Clave: k, Valor: v });
    },
  });
  const comun = { esAdmin: () => ADMIN, alCambiar: () => pintarEstado(), toast: (t) => toast(t) };

  /* ---------- tres libros, tres motores de guardado ---------- */
  const PHOJAS = PKEYS.filter((k) => !["usr", "log", "cfg"].includes(k));
  const VHOJAS = VXK.filter((k) => !["log", "cfg"].includes(k));
  const HHOJAS = Object.keys(SH).filter((k) => !["log", "cfg", "fin"].includes(k));

  const S_PORTAL = crearSincronizador(Object.assign({ ruta: "/portal", hojas: PHOJAS.map((k) => [k, "ID"]), libro: () => PX.book, plano: planoTexto, recargar: () => cargarPortal() }, cfgFilas(() => PX.book), comun));
  const S_VIH = crearSincronizador(Object.assign({ ruta: "/vih", hojas: VHOJAS.map((k) => [k, k === "cac" ? "Paciente" : "ID"]), libro: () => VX.book, plano: planoTexto, recargar: () => cargarVih() }, cfgFilas(() => VX.book), comun));
  const S_HD = crearSincronizador(
    Object.assign(
      {
        ruta: "/hd", hojas: HHOJAS.map((k) => [k, "ID"]), libro: () => ST.book, plano: planoHD, recargar: () => cargarHd({ conservarBorradores: false }),
        cfgLeer: () => ST.book.cfgv, cfgRevertir: (k, v) => { ST.book.cfgv[k] = v; },
        finLeer: () => ST.book.finBlob || null, finRevertir: (v) => { ST.book.finBlob = v; },
      },
      comun,
      {
        // Hemodiálisis muestra su propia línea de estado (#bookinfo) además de la del portal.
        alCambiar: () => {
          if (S_HD.listo() && ST.book) {
            ST.dirty = /Guardando|Sin guardar/.test(S_HD.estado);
            bookInfo();
          }
          pintarEstado();
        },
      },
    ),
  );
  /* Diálisis peritoneal y Consulta externa: libros propios. Sus hojas sin columna ID se identifican por su clave
     (RolesDP/RolesCE por usuario, Config por clave, Especialidades y EPS por código, el detalle CAC por corte y paciente).
     La Bitácora no se guarda desde aquí: la lleva la auditoría del servidor. */
  const DHOJAS = DPK.filter((k) => k !== "log");
  const CHOJAS = CEK.filter((k) => k !== "log");
  const CLAVE_DP = { rol: "Usuario", cfg: "Clave", cacd: (r) => r.Corte + "|" + r.Paciente };
  const CLAVE_CE = { esp: "Codigo", eps: "Codigo", rol: "Usuario", cfg: "Clave" };
  const sinCfg = { cfgLeer: () => ({}), cfgRevertir: () => {} }; // su configuración es una hoja más del libro
  const S_DP = crearSincronizador(
    Object.assign({ ruta: "/dp", hojas: DHOJAS.map((k) => [k, CLAVE_DP[k] || "ID"]), libro: () => DP.book, plano: planoHD, recargar: () => cargarDp() }, sinCfg, comun, {
      alCambiar: () => {
        if (S_DP.listo() && DP.book) DP.dirty = /Guardando|Sin guardar/.test(S_DP.estado);
        pintarEstado();
      },
    }),
  );
  const S_CE = crearSincronizador(
    Object.assign({ ruta: "/ce", hojas: CHOJAS.map((k) => [k, CLAVE_CE[k] || "ID"]), libro: () => CE.book, plano: planoTexto, recargar: () => cargarCe() }, sinCfg, comun, {
      alCambiar: () => {
        if (S_CE.listo() && CE.book) CE.dirty = /Guardando|Sin guardar/.test(S_CE.estado);
        pintarEstado();
      },
    }),
  );
  const motores = () => [S_PORTAL, S_VIH, S_HD, S_DP, S_CE].filter((s) => s.listo());

  function pintarEstado() {
    const M = motores();
    const peor = M.find((s) => /rechazado|Sin guardar|detenido/.test(s.estado)) || M.find((s) => /Guardando|Cargando/.test(s.estado)) || M.find((s) => /Guardado/.test(s.estado)) || M[0];
    const txt = peor ? peor.estado : "Cargando…";
    estadoEl.className = "estado-modulo " + (/rechazado|Sin guardar|detenido/.test(txt) ? "bad" : /Guardando|Cargando/.test(txt) ? "warn" : "ok");
    estadoEl.innerHTML = "<strong>" + esc(txt) + "</strong>" + (M.some((s) => s.hayNuevos) ? ' · <button type="button" class="lnk" id="portalrecargar">Hay datos nuevos de otros usuarios: actualizar</button>' : "");
    if (PX.book) PX.dirty = M.some((s) => /Guardando|Sin guardar/.test(s.estado));
  }

  /* ---------- carga desde la base de datos ---------- */

  async function cargarDirectorio() {
    const { usuarios } = await pedir("GET", "/catalogos/usuarios");
    return usuarios.map((u) => ({ ID: u.id, Usuario: u.usuario, Nombre: u.nombre, Cargo: u.cargo, Area: u.area || "", Rol: u.rol === "ADMIN" ? "Administrador" : "Estándar", Programas: "", Activo: u.activo ? "SI" : "NO" }));
  }

  async function cargarPortal() {
    S_PORTAL.estado = "Cargando…";
    const [r, usr] = await Promise.all([pedir("GET", "/portal/libro"), cargarDirectorio()]);
    const b = pxNewBook();
    for (const k of PHOJAS) b[k] = (r.hojas[k] || []).map((x) => Object.assign({}, x));
    b.cfg = Object.entries(r.cfg || {}).map(([Clave, Valor]) => ({ Clave, Valor: typeof Valor === "string" ? Valor : JSON.stringify(Valor) }));
    b.usr = usr;
    const yo = usr.find((u) => u.ID === USU.id);
    if (yo) Object.assign(yo, PX.user);
    PX.book = b;
    PX.demo = false;
    S_PORTAL.cargado(r.version);
    pxRender();
    pintarEstado();
  }

  async function cargarVih() {
    if (!leeLibro("vih")) return;
    S_VIH.estado = "Cargando…";
    const r = await pedir("GET", "/vih/libro");
    const b = vxNewBook();
    for (const k of VHOJAS) b[k] = (r.hojas[k] || []).map((x) => Object.assign({}, x));
    b.cfg = Object.entries(r.cfg || {}).map(([Clave, Valor]) => ({ Clave, Valor: typeof Valor === "string" ? Valor : JSON.stringify(Valor) }));
    const previo = VX.book ? { ui: VX.ui, corte: VX.corte } : null;
    vxOpenBook(b, false);
    if (previo) {
      VX.ui = previo.ui;
      VX.corte = previo.corte;
    }
    S_VIH.cargado(r.version);
    VX.dirty = false;
    document.body.classList.toggle("carga-inicial", ADMIN && !vxPacs().length);
    pxRender();
    pintarEstado();
  }

  async function cargarDp() {
    if (!leeLibro("dp")) return;
    S_DP.estado = "Cargando…";
    const [r, bit] = await Promise.all([
      pedir("GET", "/dp/libro"),
      permiso("dp", "ver") ? pedir("GET", "/dp/bitacora").catch(() => ({ bitacora: [] })) : Promise.resolve({ bitacora: [] }),
    ]);
    const b = dpNewBook();
    for (const k of DHOJAS) b[k] = (r.hojas[k] || []).map((x) => Object.assign(dpRow(x), { _ts: x._ts }));
    b.pac.forEach((p) => {
      p.ID = String(p.ID || "").trim();
      if (p.Documento != null) p.Documento = String(p.Documento);
    });
    b.log = bit.bitacora; // Reportes → Bitácora: la auditoría del servidor para DP
    const previo = DP.book ? DP.ui : null;
    DP.book = b;
    dpEnsure();
    DP.demo = false;
    DP.src = "Base de datos POSMÉDICA";
    DP.ui = previo || {};
    DP.ui.chain = { ok: true, n: b.log.length }; // la integridad la garantiza la auditoría inmutable del servidor
    S_DP.cargado(r.version);
    // Propuesta inicial del plan de laboratorio (dpPlanSeed): la crea quien puede validarla, para no generar registros
    // que el servidor rechazaría a otros roles.
    if (permiso("dp", "registrar") && (dpCan("labval") || dpCan("apr"))) dpPlanSeed();
    DP.dirty = false;
    document.body.classList.toggle("carga-inicial-dp", ADMIN && !b.pac.length);
    pxRender();
    pintarEstado();
  }

  async function cargarCe() {
    if (!leeLibro("ce")) return;
    S_CE.estado = "Cargando…";
    const r = await pedir("GET", "/ce/libro");
    const b = {};
    CEK.forEach((k) => (b[k] = []));
    for (const k of CHOJAS) b[k] = (r.hojas[k] || []).map((x) => Object.assign({}, x));
    const previo = CE.book ? CE.ui : null;
    ceOpenBook(b, false);
    if (previo) CE.ui = previo;
    S_CE.cargado(r.version);
    // Catálogos iniciales del prototipo (ceNewBook: especialidades del alcance, EPS y parámetros vacíos): si la base aún
    // no los tiene, el administrador (Coordinación) los guarda la primera vez que abre el módulo.
    if (ADMIN) {
      const ini = ceNewBook();
      for (const k of ["esp", "eps", "cfg"]) if (!CE.book[k].length && ini[k].length) CE.book[k] = ini[k];
      ceChanged();
    }
    CE.dirty = false;
    document.body.classList.toggle("carga-inicial-ce", ADMIN && !b.pac.length && !b.sol.length);
    pxRender();
    pintarEstado();
  }

  let impGuardado = null;
  async function cargarHd(opts) {
    if (!leeLibro("hd")) return;
    opts = opts || {};
    S_HD.estado = "Cargando…";
    if (ST.book) bookInfo();
    const r = await pedir("GET", "/hd/libro");
    const b = newBook();
    for (const k of HHOJAS) b[k] = (r.hojas[k] || []).map((x) => Object.assign(fromRow(x), { _ts: x._ts }));
    b.pac.forEach((p) => {
      p.ID = String(p.ID || "").trim();
      if (p.Documento != null) p.Documento = String(p.Documento);
    });
    // Configuración: misma combinación con los valores por defecto que hace parseToolBook del prototipo.
    for (const [k, v] of Object.entries(r.cfg || {})) {
      const d = b.cfgv[k];
      b.cfgv[k] = d && typeof d === "object" && !Array.isArray(d) && v && typeof v === "object" && !Array.isArray(v) ? Object.assign({}, d, v) : v;
    }
    b.finBlob = r.finBlob || null;
    const previo = ST.book ? { view: ST.view, corte: ST.corte, ps: ST.ps, eps: ST.eps, ui: ST.ui } : null;
    setBook(b, FUENTE_HD);
    if (previo && opts.conservarVista !== false) {
      Object.assign(ST, { view: previo.view, corte: previo.corte, ps: previo.ps, eps: previo.eps });
      if (opts.conservarBorradores) ST.ui = previo.ui;
    }
    if (impGuardado) {
      ST.imp = impGuardado; // tarifas del Dashboard importado, para crear la clave de facturación
      impGuardado = null;
    }
    ST.demo = false;
    ST.dirty = false;
    ST.fin = { key: null, data: null };
    IDX.dirty = true;
    S_HD.cargado(r.version);
    ST.dirty = false;
    syncBar();
    if (PX.view === "hd") render();
    else pxRender();
    bookInfo();
    pintarEstado();
  }

  /* ---------- reemplazos sobre el código original ---------- */

  function sinPermiso(que) {
    toast("Su usuario no tiene permiso para " + que + ". Pídalo al administrador.");
    throw new Error("Sin permiso para " + que);
  }
  const envolver = (nombre, antes, despues) => {
    const orig = window[nombre];
    window[nombre] = function () {
      if (antes) antes.apply(this, arguments);
      const r = orig.apply(this, arguments);
      if (despues) despues();
      return r;
    };
  };

  // Avisos de cambio de cada libro → guardado.
  envolver("changed", null, () => S_HD.listo() && S_HD.programar());
  envolver("vxChanged", null, () => S_VIH.listo() && S_VIH.programar());
  envolver("pxBookInfo", null, () => S_PORTAL.listo() && S_PORTAL.programar());

  // VIH: registrar y anular según permisos (Laboratorio puede escribir solicitudes y resultados).
  const escribeVih = (k) => permiso("vih", "registrar") || (["sol", "lab"].includes(k) && permiso("lab", "registrar"));
  envolver("vxAdd", (k) => escribeVih(k) || sinPermiso("registrar en el programa VIH"));
  envolver("vxUpd", (k) => escribeVih(k) || sinPermiso("registrar en el programa VIH"));
  envolver("vxAnular", () => permiso("vih", "anular") || sinPermiso("anular registros del programa VIH"));
  const _vxImport = window.vxImport;
  window.vxImport = function (files) {
    if (!permiso("vih", "registrar")) return toast("Su usuario no tiene permiso para registrar en el programa VIH.");
    return _vxImport(files);
  };

  // El reporte CAC tal como se envía a la EPS no trae fila de encabezado (los datos empiezan en la fila 1, en el orden
  // de las 193 variables). El importador original exige la fila «v1ideps…»: si falta y el archivo tiene exactamente
  // las 193 columnas, se antepone el encabezado oficial (VX_CAC_COLS, idéntico a la plantilla de la coordinación).
  const _vxImportCAC = window.vxImportCAC;
  window.vxImportCAC = function (wb, fname) {
    try {
      const ws = wb.Sheets[wb.SheetNames[0]];
      const A = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
      if (A.length && A[0] && String(A[0][0]).trim() !== "v1ideps" && A[0].length === VX_CAC_COLS.length) {
        const ws2 = XLSX.utils.aoa_to_sheet([VX_CAC_COLS].concat(A), { cellDates: true });
        const r = _vxImportCAC({ SheetNames: ["CAC"], Sheets: { CAC: ws2 } }, fname);
        return r ? r + " (el archivo no traía encabezado: se usaron las 193 variables del reporte CAC)" : r;
      }
    } catch (e) {
      console.error(e);
    }
    return _vxImportCAC(wb, fname);
  };

  // Hemodiálisis: registrar y anular según permisos. Los módulos transversales escriben sus hojas del libro de HD
  // (las mismas que acepta el servidor en modulos/hd/config.ts).
  const HD_TRANSVERSAL = { sol: ["lab"], lab: ["lab"], seg: ["sp"], aud: ["iaas"], atb: ["proa"] };
  const escribeHd = (k) => permiso("hd", "registrar") || (HD_TRANSVERSAL[k] || []).some((t) => permiso(t, "registrar"));
  envolver("addRec", (k) => escribeHd(k) || sinPermiso("registrar en Hemodiálisis"));
  envolver("updRec", (k) => escribeHd(k) || sinPermiso("registrar en Hemodiálisis"));
  envolver("anular", () => permiso("hd", "anular") || sinPermiso("anular registros de Hemodiálisis"));
  // Sin datos ficticios: Hemodiálisis trabaja con la base de datos.
  window.loadDemo = function () {
    toast("Los datos ficticios se retiraron: el sistema trabaja con la base de datos.");
  };
  window.vStart = function () {
    return '<div class="panel empty"><p>' + esc(S_HD.estado) + "</p></div>";
  };
  window.bookInfo = function () {
    const i = $("bookinfo");
    if (!i) return;
    if (!ST.book) {
      i.textContent = S_HD.estado;
      return;
    }
    let act = 0;
    try {
      ensureIdx();
      act = ST.book.pac.filter((p) => activeAt(p, ST.corte)).length;
    } catch (e) {
      /* índice en construcción */
    }
    const cls = /rechazado|Sin guardar|detenido/.test(S_HD.estado) ? "var(--bad)" : /Guardando|Cargando/.test(S_HD.estado) ? "var(--warn)" : "var(--ok)";
    i.innerHTML =
      '<strong style="color:' + cls + '">' + esc(S_HD.estado) + "</strong> · " + act + " activos al corte · " + ST.book.ses.length + " sesiones registradas" +
      (S_HD.hayNuevos ? ' · <button type="button" class="lnk" id="hdrecargar">Hay datos nuevos de otros usuarios: actualizar</button>' : "");
  };

  /* ---------- carga inicial de Hemodiálisis (solo administrador y con hemodiálisis vacía) ---------- */

  window.onFile = function (f) {
    if (!f) return;
    $("bookfile").value = "";
    if (!ADMIN) return toast("Solo el administrador puede importar.");
    if (ST.book && ST.book.pac.length) return toast("La importación es solo para la carga inicial: hemodiálisis ya tiene pacientes en la base de datos.");
    const rd = new FileReader();
    rd.onload = (ev) => {
      try {
        const wb = XLSX.read(new Uint8Array(ev.target.result), { type: "array", cellDates: false });
        if (isToolBook(wb)) {
          S_HD.bloqueado = true;
          setBook(parseToolBook(wb), "Importado de «" + f.name + "» (sin guardar)");
          confirmando = "hd";
          confirmarImportacionHd(f.name);
        } else if (isDashboard(wb)) {
          dlgImport(wb, f.name);
        } else toast("El archivo no tiene la hoja «Sesiones» del libro de hemodiálisis ni la hoja «2.PACIENTES» del Dashboard.");
      } catch (e) {
        console.error(e);
        toast("No se pudo leer el archivo: " + e.message);
      }
    };
    rd.readAsArrayBuffer(f);
  };
  const _importDashboard = window.importDashboard;
  window.importDashboard = function (wb, fn, mes) {
    S_HD.bloqueado = true;
    _importDashboard(wb, fn, mes);
    // Se abre después de que se cierre el diálogo del mes, para no confundir ese cierre con una cancelación.
    setTimeout(() => {
      confirmando = "hd";
      confirmarImportacionHd(fn);
    }, 0);
  };

  function confirmarImportacionHd(fuente) {
    const n = (k) => ST.book[k].filter((r) => r && r.ID).length;
    const W = (ST.imp && ST.imp.warn) || [];
    openDlg(
      "Guardar la importación en la base de datos",
      '<p class="note">Revise las pestañas antes de guardar si lo desea (puede cerrar este diálogo con Cancelar y no se guardará nada). Se guardará:</p><ul class="note">' +
        "<li>" + n("pac") + " pacientes, " + n("ses") + " sesiones, " + n("lab") + " paraclínicos, " + n("evt") + " eventos, " + n("nov") + " novedades</li>" +
        "<li>y el resto de hojas del archivo «" + esc(fuente) + "».</li></ul>" +
        (W.length ? '<details class="hist"><summary>' + W.length + ' avisos de la importación</summary><ul class="note">' + W.slice(0, 50).map((w) => "<li>" + esc(w) + "</li>").join("") + "</ul></details>" : "") +
        '<p class="note">Es la <strong>carga inicial</strong>: después de guardarla, los datos se registran directamente en el sistema.</p>',
      "Guardar en la base de datos",
      () => {
        guardandoImport = true;
        guardarImportacionHd(fuente);
      },
    );
  }

  async function guardarImportacionHd(fuente) {
    S_HD.estado = "Guardando la importación…";
    bookInfo();
    try {
      const hojas = {};
      for (const k of HHOJAS) hojas[k] = ST.book[k].filter((r) => r && r.ID).map(planoHD);
      const cfg = Object.assign({}, ST.book.cfgv);
      impGuardado = ST.imp && ST.imp.tarifas ? { tarifas: ST.imp.tarifas, warn: [], fn: fuente } : null;
      const r = await pedir("POST", "/hd/importar", { fuente, hojas, cfg, finBlob: ST.book.finBlob || undefined });
      S_HD.bloqueado = false;
      confirmando = false;
      guardandoImport = false;
      await cargarHd({ conservarVista: false });
      const cont = Object.entries(r.conteo).filter(([, v]) => v).map(([k, v]) => v + " " + (SH[k] ? SH[k][0] : k)).join(", ");
      openDlg(
        "Importación guardada",
        '<p class="note">Se guardó: ' + esc(cont) + ".</p>" +
          (r.avisos.length ? '<p class="note"><strong>Revise:</strong></p><ul class="note">' + r.avisos.map((a) => "<li>" + esc(a) + "</li>").join("") + "</ul>" : "") +
          (ST.imp && ST.imp.tarifas ? '<p class="note">Las tarifas del Dashboard quedan listas para crear la clave de facturación.</p>' : ""),
        "Entendido",
        () => {},
      );
    } catch (e) {
      S_HD.bloqueado = false;
      confirmando = false;
      guardandoImport = false;
      toast("No se guardó la importación: " + e.message);
      cargarHd().catch((x) => toast(x.message));
    }
  }

  /* ---------- Diálisis peritoneal y Consulta externa ---------- */

  // Avisos de cambio → guardado (dpLog lo llaman dpAdd, dpUpd y la configuración; ceChanged, ceAdd y ceUpd).
  envolver("dpLog", null, () => S_DP.listo() && S_DP.programar());
  envolver("ceChanged", null, () => S_CE.listo() && S_CE.programar());
  // Permiso del programa (capa 1); el rol dentro del módulo (capa 2) lo aplica el propio módulo y lo valida el servidor.
  const escribeDp = (k) => permiso("dp", "registrar") || (["lab", "sol"].includes(k) && permiso("lab", "registrar"));
  envolver("dpAdd", (k) => escribeDp(k) || sinPermiso("registrar en Diálisis peritoneal"));
  envolver("dpUpd", (k, _r, ch) => {
    if (!escribeDp(k)) sinPermiso("registrar en Diálisis peritoneal");
    if (ch && ch.Anulado === "SI" && !permiso("dp", "anular")) sinPermiso("anular registros de Diálisis peritoneal");
  });
  envolver("ceAdd", () => permiso("ce", "registrar") || sinPermiso("registrar en Consulta externa"));
  envolver("ceUpd", () => permiso("ce", "registrar") || sinPermiso("registrar en Consulta externa"));
  window.dpDemo = window.ceDemo = function () {
    toast("Los datos ficticios se retiraron: el sistema trabaja con la base de datos.");
  };
  window.dpExportBook = window.ceExport = function () {
    toast("La información está en la base de datos. El administrador puede descargar el respaldo completo en «Respaldo».");
  };

  // Carga inicial de un libro existente (solo administrador, con el módulo vacío): el botón aparece arriba del módulo.
  const panelCargaInicial = (id, texto) =>
    '<div class="panel carga-inicial-panel"><h3>Carga inicial</h3><p class="note">' + texto + '</p><label class="btn" for="' + id + '">Cargar libro (.xlsx)</label><input type="file" id="' + id + '" accept=".xlsx" hidden></div>';
  const _dpView = window.dpView;
  window.dpView = function () {
    const h = _dpView.apply(this, arguments);
    return document.body.classList.contains("carga-inicial-dp")
      ? panelCargaInicial("dpfile", "Diálisis peritoneal está vacío. Si ya tiene un libro DP del prototipo («DP_libro_….xlsx»), cárguelo aquí una sola vez. Para el archivo de control use «Importar archivos» en Pacientes.") + h
      : h;
  };
  const _ceView = window.ceView;
  window.ceView = function () {
    const h = _ceView.apply(this, arguments);
    return document.body.classList.contains("carga-inicial-ce")
      ? panelCargaInicial("cebook", "Consulta externa está vacía. Si ya tiene un libro de Consulta externa del prototipo, cárguelo aquí una sola vez.") + h
      : h;
  };

  // El encabezado de CE hablaba de «cambios sin descargar» del libro de Excel: ya no aplica (todo se guarda solo).
  const _ceHead = window.ceHead;
  window.ceHead = function () {
    return _ceHead.apply(this, arguments).replace(/ · libro (?:<b[^>]*>con cambios sin descargar<\/b>|sin cambios)/, "");
  };

  async function cargaInicial(modulo, ruta, fuente, hojas, alGuardar) {
    const n = Object.entries(hojas).filter(([, L]) => L.length).map(([k, L]) => L.length + " " + k).join(", ");
    confirmando = modulo;
    openDlg(
      "Guardar la carga inicial en la base de datos",
      '<p class="note">Se guardará desde «' + esc(fuente) + "»: " + esc(n || "sin registros") + ". Puede cancelar y no se guardará nada.</p>",
      "Guardar en la base de datos",
      async () => {
        guardandoImport = true;
        try {
          const r = await pedir("POST", ruta, { fuente, hojas });
          confirmando = false;
          guardandoImport = false;
          await alGuardar();
          openDlg("Carga inicial guardada", '<p class="note">Se guardó: ' + esc(Object.entries(r.conteo).filter(([, v]) => v).map(([k, v]) => v + " " + k).join(", ")) + ".</p>" + (r.avisos.length ? '<ul class="note">' + r.avisos.map((a) => "<li>" + esc(a) + "</li>").join("") + "</ul>" : ""), "Entendido", () => {});
        } catch (e) {
          confirmando = false;
          guardandoImport = false;
          toast("No se guardó la carga: " + e.message);
          alGuardar().catch(() => {});
        }
      },
    );
  }
  window.dpOnFile = function (f) {
    if (!f) return;
    if (!ADMIN) return toast("Solo el administrador hace la carga inicial.");
    if (DP.book && dpR("pac").length) return toast("La carga inicial solo se permite con Diálisis peritoneal vacío. Para el archivo de control use «Importar archivos».");
    const rd = new FileReader();
    rd.onload = (ev) => {
      try {
        const wb = XLSX.read(new Uint8Array(ev.target.result), { type: "array" });
        if (!dpIsBook(wb)) return toast("Ese archivo no es un libro de DP (faltan las hojas Pacientes y Episodios). Para el archivo de control use «Importar archivos».");
        const b = dpParse(wb);
        const hojas = Object.fromEntries(DHOJAS.map((k) => [k, (b[k] || []).map(planoHD)]));
        cargaInicial("dp", "/dp/importar", f.name, hojas, cargarDp);
      } catch (e) {
        toast("No se pudo leer el archivo: " + e.message);
      }
    };
    rd.readAsArrayBuffer(f);
  };
  window.ceOnBook = async function (f) {
    if (!f) return;
    if (!ADMIN) return toast("Solo el administrador hace la carga inicial.");
    if (CE.book && (CE.book.pac.length || CE.book.sol.length)) return toast("La carga inicial solo se permite con Consulta externa vacía.");
    try {
      const wb = await vxReadFile(f);
      if (!ceIsBook(wb)) return toast("Ese archivo no es un libro de Consulta Externa.");
      const b = ceParse(wb);
      const hojas = Object.fromEntries(CHOJAS.map((k) => [k, (b[k] || []).map(planoTexto)]));
      cargaInicial("ce", "/ce/importar", f.name, hojas, cargarCe);
    } catch (e) {
      toast("No se pudo leer el archivo: " + e.message);
    }
  };

  /** Ajustes de la barra de Hemodiálisis: sin libro de Excel, sin «Usuario que registra» (lo da la sesión). */
  function ajustarHd() {
    ["bookdemo", "booknew", "bookexp"].forEach((id) => {
      const el = $(id);
      if (el) el.hidden = true;
    });
    const lbl = document.querySelector('label[for="bookfile"]');
    if (lbl) {
      lbl.hidden = !ADMIN;
      lbl.textContent = "Importar libro o Dashboard (carga inicial)";
      lbl.classList.remove("primary");
    }
    const u = $("user");
    if (u && u.closest("label")) u.closest("label").hidden = true;
    const priv = document.querySelector("#hdapp .privacy");
    if (priv) priv.textContent = "Datos de salud sensibles (Ley 1581 de 2012). Cada cambio se guarda en el servidor con su usuario y hora, y queda en la auditoría. La herramienta calcula y alerta; la decisión clínica es del profesional.";
    if (!ADMIN) {
      const i = VIEWS.findIndex((v) => v[0] === "fin");
      if (i >= 0) VIEWS.splice(i, 1);
    }
  }

  // Exportaciones: permiso del módulo en pantalla y auditoría.
  const _saveWb = window.saveWb;
  window.saveWb = async function (wb, name) {
    const v = PX.view;
    if (!ABIERTOS.includes(v) && v !== "panel" && !permiso(v, "exportar")) {
      toast("Su usuario no tiene permiso para exportar en este módulo.");
      return false;
    }
    try {
      if (v === "hd") await pedir("POST", "/hd/auditar", { accion: "EXPORTA", detalle: String(name).slice(0, 300) });
      else await pedir("POST", "/portal/auditar", { accion: "EXPORTA", detalle: (v + ": " + String(name)).slice(0, 300) });
    } catch (e) {
      toast(e.message);
      return false;
    }
    return _saveWb(wb, name);
  };

  // El encabezado de VIH hablaba de «cambios sin descargar» del libro de Excel: ya no aplica (todo se guarda solo).
  const _vxHead = window.vxHead;
  window.vxHead = function () {
    return _vxHead.apply(this, arguments).replace(/ · libro (?:<b[^>]*>con cambios sin descargar<\/b>|sin cambios)/, "");
  };

  // Sin datos ficticios ni libros sueltos.
  window.vxDemo = function () {
    toast("Los datos ficticios se retiraron: el sistema trabaja con la base de datos.");
  };
  window.pxExportBook = function () {
    toast("La información está en la base de datos. El administrador puede descargar el respaldo completo en «Respaldo».");
  };

  // Puente con el portal nuevo: el panel y Usuarios son del portal nuevo; lo demás se abre aquí y se avisa la ruta.
  const RUTA_EXTERNA = { panel: "/", usr: "/usuarios" };
  // Módulos del prototipo que todavía no están conectados a la base de datos: los muestra el portal nuevo con su fase.
  const EN_MIGRACION = [];
  const _pxGo = window.pxGo;
  window.pxGo = function (v, sub, nb) {
    if (RUTA_EXTERNA[v] !== undefined) return avisarPortal("navegar", { ruta: RUTA_EXTERNA[v] });
    if (EN_MIGRACION.includes(v)) return avisarPortal("navegar", { ruta: "/programa/" + v });
    _pxGo(v, sub, nb);
    avisarPortal("navegar", { ruta: "/programa/" + v });
  };
  envolver("pxOpenHD", null, () => {
    if (PX.view === "hd") {
      ajustarHd();
      bookInfo();
      avisarPortal("navegar", { ruta: "/programa/hd" });
    }
  });
  envolver("pxOpenNefro", null, () => PX.view === "nefro" && avisarPortal("navegar", { ruta: "/programa/nefro" }));
  window.pxNefroURL = function () {
    return RUTA_NEFRO;
  };
  window.pxDlgNefroCfg = function () {
    toast("La Ruta de Nefroprotección se carga desde el servidor de POSMÉDICA y usa su base de datos.");
  };
  // El aviso del marco hablaba de cambios «sin descargar» (modo Excel): aquí cada registro se guarda en la base.
  envolver("pxNefroEnsure", null, () => {
    const n = document.querySelector("#nefroapp .note");
    if (n) n.textContent = "Ruta de Nefroprotección v8 · usa la base de datos del programa: cada registro se guarda en el servidor con su usuario y hora.";
    const b = document.querySelector('#nefroapp [data-p="nefrocfg"]');
    if (b) b.remove();
  });
  // Tablero gerencial: el prototipo calcula la Ruta en segundo plano solo en la demostración; con la Ruta en el servidor
  // decía «se consulta dentro del módulo». Aquí se carga igual en segundo plano (oculta) y el tablero se redibuja cuando
  // sus indicadores están listos (pxGerNefroWait del prototipo).
  const _gerNefro = window.gerNefro;
  window.gerNefro = function () {
    if (!pxNefroK() && pxCan("nefro")) {
      pxNefroEnsure();
      pxGerNefroWait();
    }
    return _gerNefro.apply(this, arguments);
  };
  // La Ruta (iframe dentro de esta página) avisa aquí si la sesión terminó; el aviso sigue al portal nuevo.
  window.addEventListener("message", (e) => {
    const f = document.getElementById("nefroframe");
    if (e.origin !== location.origin || !f || e.source !== f.contentWindow || !e.data) return;
    if (e.data.tipo === "posmedica:sesion-perdida") avisarPortal("sesion-perdida");
  });
  window.pxBack = function () {
    avisarPortal("navegar", { ruta: "/" });
  };
  window.pxLogout = function () {
    pedir("POST", "/auth/logout").catch(() => {}).finally(() => avisarPortal("sesion-perdida"));
  };
  window.addEventListener("message", (e) => {
    if (e.origin !== location.origin || e.source !== window.parent || !e.data || e.data.tipo !== "posmedica:vista") return;
    const v = String(e.data.vista || "");
    if (v && PX.user && PX.view !== v && !RUTA_EXTERNA[v]) _pxGo(v);
  });

  /* ---------- carga inicial de un libro VIH existente (solo administrador, con el programa vacío) ---------- */

  window.vxOnBook = async function (f) {
    if (!ADMIN) return toast("Solo el administrador puede hacer la carga inicial.");
    if (vxPacs().length) return toast("La carga inicial solo se permite con el programa vacío. Para agregar datos use «Importar cohorte o archivo CAC».");
    try {
      const wb = await vxReadFile(f);
      if (!vxIsBook(wb)) return toast("Ese archivo no es un libro del programa VIH. Para la cohorte nominal o el archivo CAC use «Importar».");
      S_VIH.bloqueado = true;
      vxOpenBook(vxParse(wb), false);
      pxRender();
      confirmando = "vih";
      const n = (k) => (VX.book[k] || []).length;
      openDlg(
        "Guardar el libro VIH en la base de datos",
        '<p class="note">Se guardará la carga inicial desde «' + esc(f.name) + "»: " + n("pac") + " pacientes, " + n("lab") + " laboratorios, " + n("tar") + " esquemas TAR, " + n("cit") + " citas, " + n("val") + " valoraciones y el resto de hojas. Puede cancelar y no se guardará nada.</p>",
        "Guardar en la base de datos",
        () => {
          guardandoImport = true;
          guardarCargaVih(f.name);
        },
      );
    } catch (e) {
      console.error(e);
      toast("No se pudo leer el archivo: " + e.message);
    }
  };
  const _closeDlg = window.closeDlg;
  window.closeDlg = function () {
    _closeDlg();
    if (confirmando && !guardandoImport) {
      const cual = confirmando;
      confirmando = false;
      if (cual === "hd") {
        S_HD.bloqueado = false;
        toast("Importación cancelada: no se guardó nada.");
        cargarHd().catch((e) => toast(e.message));
      } else if (cual === "dp" || cual === "ce") {
        toast("Carga cancelada: no se guardó nada.");
      } else {
        S_VIH.bloqueado = false;
        toast("Carga cancelada: no se guardó nada.");
        cargarVih().catch((e) => toast(e.message));
      }
    }
  };
  async function guardarCargaVih(fuente) {
    try {
      const hojas = {};
      for (const k of VHOJAS) hojas[k] = (VX.book[k] || []).map(planoTexto);
      const cfg = Object.fromEntries((VX.book.cfg || []).map((r) => [r.Clave, r.Valor]));
      const r = await pedir("POST", "/vih/importar", { fuente, hojas, cfg });
      S_VIH.bloqueado = false;
      confirmando = false;
      guardandoImport = false;
      await cargarVih();
      const cont = Object.entries(r.conteo).filter(([, v]) => v).map(([k, v]) => v + " " + (VXS[k] ? VXS[k][0] : k)).join(", ");
      openDlg("Carga inicial guardada", '<p class="note">Se guardó: ' + esc(cont) + ".</p>" + (r.avisos.length ? '<ul class="note">' + r.avisos.map((a) => "<li>" + esc(a) + "</li>").join("") + "</ul>" : ""), "Entendido", () => {});
    } catch (e) {
      S_VIH.bloqueado = false;
      confirmando = false;
      guardandoImport = false;
      toast("No se guardó la carga: " + e.message);
      cargarVih().catch((x) => toast(x.message));
    }
  }

  /* ---------- arranque ---------- */

  async function iniciar() {
    try {
      USU = (await pedir("GET", "/auth/me")).usuario;
      ADMIN = USU.rol === "ADMIN";
      const programas = ADMIN ? PROGS.map((x) => x.k) : USU.permisos.filter((x) => x.ver).map((x) => x.programa).concat(ABIERTOS);
      PX.user = { ID: USU.id, Usuario: USU.usuario, Nombre: USU.nombre, Cargo: USU.cargo, Area: USU.area || "", Rol: ADMIN ? "Administrador" : "Estándar", Programas: programas.join(","), Activo: "SI" };
      document.body.classList.toggle("no-admin", !ADMIN);
      document.body.classList.toggle("sin-registrar", !permiso("vih", "registrar"));
      document.addEventListener("submit", (e) => e.preventDefault(), true); // reemplaza onsubmit="return false" (CSP)
      document.addEventListener("click", (e) => {
        if (e.target && e.target.id === "portalrecargar") Promise.all([cargarPortal(), cargarVih(), cargarHd({ conservarBorradores: true }), cargarDp(), cargarCe()]).catch((x) => toast(x.message));
        if (e.target && e.target.id === "hdrecargar") cargarHd({ conservarBorradores: true }).catch((x) => toast(x.message));
      });
      const main = $("pxmain");
      main.parentNode.insertBefore(estadoEl, main);
      // Los libros se cargan en paralelo; cada uno solo si el usuario lo usa (su programa o un módulo que lo consulta).
      await Promise.all([cargarPortal(), cargarHd(), cargarVih(), cargarDp(), cargarCe()]);
      const vista = decodeURIComponent(location.hash.slice(1)) || "vih";
      if (!RUTA_EXTERNA[vista]) _pxGo(vista);
      document.body.classList.add("listo");
      for (const s of motores()) s.arrancar();
      pintarEstado();
    } catch (e) {
      estadoEl.innerHTML = "<strong>No se pudo cargar: " + esc(e.message) + "</strong>";
      document.body.classList.add("listo");
    }
  }

  iniciar();
})();
