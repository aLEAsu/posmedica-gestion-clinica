/* Adaptador del portal: conecta el portal ORIGINAL del prototipo (portal.js, sin modificar) con la base de datos.
   En esta página viven VIH y los módulos transversales (Laboratorio, Producción, Seguridad del paciente, IAAS, PROA,
   SOGCS, Documentos, Mensajes, Calendario) y las fichas de los programas sin módulo propio.
   - La sesión y los permisos vienen del servidor; PX.user y el directorio de usuarios se arman con ellos.
   - Se cargan los tres libros que usa el portal, según los permisos: el institucional (/portal), VIH (/vih) y
     Hemodiálisis (/hd, que Laboratorio, Producción, SP, IAAS y PROA consultan). Cada uno se guarda solo.
   - La navegación hacia Hemodiálisis, Nefroprotección, el panel o Usuarios la hace el portal nuevo.
   - Se retiran los datos ficticios y la carga y descarga de libros. */
(function () {
  "use strict";
  const { pedir, avisarPortal, crearSincronizador } = window.POSMEDICA;
  const TRANSVERSALES = ["lab", "prod", "sp", "iaas", "proa"];
  const ABIERTOS = ["msg", "docs", "cal"];
  let USU = null, ADMIN = false;
  const permiso = (prog, acc) => ADMIN || !!(USU && USU.permisos.find((x) => x.programa === prog && x.ver && x[acc]));
  const leeLibro = (prog) => ADMIN || permiso(prog, "ver") || TRANSVERSALES.some((t) => permiso(t, "ver"));
  let confirmando = false, guardandoImport = false;

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
        ruta: "/hd", hojas: HHOJAS.map((k) => [k, "ID"]), libro: () => ST.book, plano: planoHD, recargar: () => cargarHd(),
        cfgLeer: () => ST.book.cfgv, cfgRevertir: (k, v) => { ST.book.cfgv[k] = v; },
        finLeer: () => ST.book.finBlob || null, finRevertir: (v) => { ST.book.finBlob = v; },
      },
      comun,
    ),
  );
  const motores = () => [S_PORTAL, S_VIH, S_HD].filter((s) => s.listo());

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

  async function cargarHd() {
    if (!leeLibro("hd")) return;
    S_HD.estado = "Cargando…";
    const r = await pedir("GET", "/hd/libro");
    const b = newBook();
    for (const k of HHOJAS) b[k] = (r.hojas[k] || []).map((x) => Object.assign(fromRow(x), { _ts: x._ts }));
    b.pac.forEach((p) => {
      p.ID = String(p.ID || "").trim();
      if (p.Documento != null) p.Documento = String(p.Documento);
    });
    for (const [k, v] of Object.entries(r.cfg || {})) {
      const d = b.cfgv[k];
      b.cfgv[k] = d && typeof d === "object" && !Array.isArray(d) && v && typeof v === "object" && !Array.isArray(v) ? Object.assign({}, d, v) : v;
    }
    b.finBlob = r.finBlob || null;
    ST.book = b;
    ST.src = "Base de datos POSMÉDICA";
    ST.demo = false;
    ST.dirty = false;
    ST.fin = { key: null, data: null };
    IDX.dirty = true;
    S_HD.cargado(r.version);
    pxRender();
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

  // Exportaciones: permiso del módulo en pantalla y auditoría.
  const _saveWb = window.saveWb;
  window.saveWb = async function (wb, name) {
    const v = PX.view;
    if (!ABIERTOS.includes(v) && v !== "panel" && !permiso(v, "exportar")) {
      toast("Su usuario no tiene permiso para exportar en este módulo.");
      return false;
    }
    try {
      await pedir("POST", "/portal/auditar", { accion: "EXPORTA", detalle: (v + ": " + String(name)).slice(0, 300) });
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

  // Puente con el portal nuevo.
  const RUTA_EXTERNA = { hd: "/programa/hd", nefro: "/programa/nefro", panel: "/", usr: "/usuarios" };
  const _pxGo = window.pxGo;
  window.pxGo = function (v, sub, nb) {
    if (RUTA_EXTERNA[v] !== undefined) return avisarPortal("navegar", { ruta: RUTA_EXTERNA[v] });
    _pxGo(v, sub, nb);
    avisarPortal("navegar", { ruta: "/programa/" + v });
  };
  window.pxOpenHD = function () {
    avisarPortal("navegar", { ruta: "/programa/hd" });
  };
  window.pxOpenNefro = function () {
    avisarPortal("navegar", { ruta: "/programa/nefro" });
  };
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
      confirmando = true;
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
      confirmando = false;
      S_VIH.bloqueado = false;
      toast("Carga cancelada: no se guardó nada.");
      cargarVih().catch((e) => toast(e.message));
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
        if (e.target && e.target.id === "portalrecargar") Promise.all([cargarPortal(), cargarVih(), cargarHd()]).catch((x) => toast(x.message));
      });
      const main = $("pxmain");
      main.parentNode.insertBefore(estadoEl, main);
      await cargarPortal();
      await Promise.all([cargarHd(), cargarVih()]);
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
