/* Adaptador del programa VIH: conecta el módulo ORIGINAL del prototipo (portal.js, sin modificar) con la base de datos.
   VIH vive dentro del portal del prototipo; este adaptador hace de puente con el portal nuevo:
   - la sesión y los permisos vienen del servidor (PX.user se arma con el usuario de la sesión);
   - el libro VIH se carga desde /api/v1/vih/libro y cada cambio se guarda en el servidor (adaptador-comun.js);
   - la navegación hacia otros programas la hace el portal nuevo;
   - mensajes y reportes de seguridad del paciente avisan que llegan con la Fase 6;
   - se retiran los datos ficticios y la carga y descarga del libro. */
(function () {
  "use strict";
  const { pedir, avisarPortal, crearSincronizador } = window.POSMEDICA;
  const HOJAS = VXK.filter((k) => !["log", "cfg"].includes(k));
  const clave = (k) => (k === "cac" ? "Paciente" : "ID");

  let ADMIN = false;
  let PERM = { ver: false, registrar: false, anular: false, exportar: false };
  let confirmando = false, guardandoImport = false;
  const estadoEl = document.createElement("div");
  estadoEl.className = "estado-modulo";
  estadoEl.setAttribute("role", "status");

  /** Registro sin campos internos (_ts, _d…); VIH guarda texto, las fechas sueltas se pasan a «AAAA-MM-DD». */
  function plano(r) {
    const o = {};
    for (const k of Object.keys(r)) {
      if (k.charAt(0) === "_") continue;
      const v = r[k];
      if (typeof v === "function") continue;
      o[k] = v instanceof Date ? iso(v) : v === undefined || v === null ? "" : v;
    }
    return o;
  }

  const S = crearSincronizador({
    ruta: "/vih",
    hojas: HOJAS.map((k) => [k, clave(k)]),
    libro: () => VX.book,
    plano,
    cfgLeer: () => Object.fromEntries((VX.book.cfg || []).map((r) => [r.Clave, r.Valor])),
    cfgRevertir: (k, v) => {
      const i = VX.book.cfg.findIndex((r) => r.Clave === k);
      if (v === undefined) {
        if (i >= 0) VX.book.cfg.splice(i, 1);
      } else if (i >= 0) VX.book.cfg[i].Valor = v;
      else VX.book.cfg.push({ Clave: k, Valor: v });
      VX.memo = {};
    },
    esAdmin: () => ADMIN,
    recargar: (o) => recargar(o),
    alCambiar: () => {
      if (S.listo()) VX.dirty = /Guardando|Sin guardar/.test(S.estado);
      pintarEstado();
    },
    toast: (t) => toast(t),
  });

  function pintarEstado() {
    const malo = /rechazado|Sin guardar|detenido/.test(S.estado), medio = /Guardando|Cargando/.test(S.estado);
    estadoEl.className = "estado-modulo " + (malo ? "bad" : medio ? "warn" : "ok");
    estadoEl.innerHTML =
      "<strong>" + esc(S.estado) + "</strong>" + (VX.book ? " · " + vxPacs().length + " pacientes en el programa" : "") +
      (S.hayNuevos ? ' · <button type="button" class="lnk" id="vihrecargar">Hay datos nuevos de otros usuarios: actualizar</button>' : "");
  }

  /* ---------- carga desde la base de datos ---------- */

  async function recargar(opts) {
    opts = opts || {};
    S.estado = "Cargando…";
    pintarEstado();
    const r = await pedir("GET", "/vih/libro");
    const b = vxNewBook();
    for (const k of HOJAS) b[k] = (r.hojas[k] || []).map((x) => Object.assign({}, x));
    b.cfg = Object.entries(r.cfg || {}).map(([Clave, Valor]) => ({ Clave, Valor: typeof Valor === "string" ? Valor : JSON.stringify(Valor) }));
    const previo = VX.book ? { ui: VX.ui, corte: VX.corte } : null;
    vxOpenBook(b, false);
    if (previo && opts.conservarVista !== false) {
      VX.ui = previo.ui;
      VX.corte = previo.corte;
    }
    S.cargado(r.version);
    VX.dirty = false;
    document.body.classList.toggle("carga-inicial", ADMIN && !vxPacs().length);
    pxRender();
    pintarEstado();
  }

  /* ---------- reemplazos sobre el módulo original ---------- */

  function sinPermiso(accion) {
    toast("Su usuario no tiene permiso para " + accion + " en el programa VIH. Pídalo al administrador.");
    throw new Error("Sin permiso para " + accion);
  }
  const envolver = (nombre, antes) => {
    const orig = window[nombre];
    window[nombre] = function () {
      antes.apply(this, arguments);
      return orig.apply(this, arguments);
    };
  };

  const _vxChanged = window.vxChanged;
  window.vxChanged = function () {
    _vxChanged();
    if (S.listo()) S.programar();
  };
  envolver("vxAdd", () => PERM.registrar || sinPermiso("registrar"));
  envolver("vxUpd", () => PERM.registrar || sinPermiso("registrar"));
  envolver("vxAnular", () => PERM.anular || sinPermiso("anular registros"));
  const _vxImport = window.vxImport;
  window.vxImport = function (files) {
    if (!PERM.registrar) return toast("Su usuario no tiene permiso para registrar en el programa VIH.");
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

  const _saveWb = window.saveWb;
  window.saveWb = async function (wb, name) {
    if (!PERM.exportar) {
      toast("Su usuario no tiene permiso para exportar en el programa VIH.");
      return false;
    }
    try {
      await pedir("POST", "/vih/auditar", { accion: "EXPORTA", detalle: String(name).slice(0, 300) });
    } catch (e) {
      toast(e.message);
      return false;
    }
    return _saveWb(wb, name);
  };

  // Sin datos ficticios ni libros sueltos: el programa trabaja con la base de datos.
  window.vxDemo = function () {
    toast("Los datos ficticios se retiraron: el programa trabaja con la base de datos.");
  };

  // El encabezado del prototipo habla de «cambios sin descargar» del libro de Excel: ya no aplica (todo se guarda solo).
  const _vxHead = window.vxHead;
  window.vxHead = function () {
    return _vxHead.apply(this, arguments).replace(/ · libro (?:<b[^>]*>con cambios sin descargar<\/b>|sin cambios)/, "");
  };

  // Puente con el portal nuevo.
  const RUTA = (v) => (v === "panel" || !v ? "/" : "/programa/" + v);
  const _pxGo = window.pxGo;
  window.pxGo = function (v, sub, nb) {
    if (v === "vih") return _pxGo(v, sub, nb);
    avisarPortal("navegar", { ruta: RUTA(v) });
  };
  window.pxBack = function () {
    avisarPortal("navegar", { ruta: "/" });
  };
  window.pxLogout = function () {
    pedir("POST", "/auth/logout").catch(() => {}).finally(() => avisarPortal("sesion-perdida"));
  };
  const pendienteFase6 = (que) => () => toast(que + " se habilita cuando se migre ese módulo (Fase 6). Mientras tanto, regístrelo por el canal habitual.");
  window.pxCompose = pendienteFase6("El envío de mensajes");
  window.pxDlgSP = pendienteFase6("El reporte de seguridad del paciente");
  window.pxDocEdit = () => false;

  /* ---------- carga inicial de un libro VIH existente (solo administrador, con el programa vacío) ---------- */

  window.vxOnBook = async function (f) {
    if (!ADMIN) return toast("Solo el administrador puede hacer la carga inicial.");
    if (vxPacs().length) return toast("La carga inicial solo se permite con el programa vacío. Para agregar datos use «Importar cohorte o archivo CAC».");
    try {
      const wb = await vxReadFile(f);
      if (!vxIsBook(wb)) return toast("Ese archivo no es un libro del programa VIH. Para la cohorte nominal o el archivo CAC use «Importar».");
      S.bloqueado = true;
      vxOpenBook(vxParse(wb), false);
      pxRender();
      confirmando = true;
      confirmarCarga(f.name);
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
      S.bloqueado = false;
      toast("Carga cancelada: no se guardó nada.");
      recargar().catch((e) => toast(e.message));
    }
  };

  function confirmarCarga(fuente) {
    const n = (k) => (VX.book[k] || []).length;
    openDlg(
      "Guardar el libro VIH en la base de datos",
      '<p class="note">Se guardará la carga inicial desde «' + esc(fuente) + "»: " + n("pac") + " pacientes, " + n("lab") + " laboratorios, " + n("tar") + " esquemas TAR, " +
        n("cit") + " citas, " + n("val") + " valoraciones y el resto de hojas. Puede cancelar y no se guardará nada.</p>",
      "Guardar en la base de datos",
      () => {
        guardandoImport = true;
        guardarCarga(fuente);
      },
    );
  }

  async function guardarCarga(fuente) {
    S.estado = "Guardando la carga inicial…";
    pintarEstado();
    try {
      const hojas = {};
      for (const k of HOJAS) hojas[k] = (VX.book[k] || []).map(plano);
      const cfg = Object.fromEntries((VX.book.cfg || []).map((r) => [r.Clave, r.Valor]));
      const r = await pedir("POST", "/vih/importar", { fuente, hojas, cfg });
      S.bloqueado = false;
      confirmando = false;
      guardandoImport = false;
      await recargar({ conservarVista: false });
      const cont = Object.entries(r.conteo).filter(([, v]) => v).map(([k, v]) => v + " " + (VXS[k] ? VXS[k][0] : k)).join(", ");
      openDlg("Carga inicial guardada", '<p class="note">Se guardó: ' + esc(cont) + ".</p>" + (r.avisos.length ? '<ul class="note">' + r.avisos.map((a) => "<li>" + esc(a) + "</li>").join("") + "</ul>" : ""), "Entendido", () => {});
    } catch (e) {
      S.bloqueado = false;
      confirmando = false;
      guardandoImport = false;
      toast("No se guardó la carga: " + e.message);
      recargar().catch((x) => toast(x.message));
    }
  }

  /* ---------- arranque ---------- */

  async function iniciar() {
    try {
      const { usuario } = await pedir("GET", "/auth/me");
      ADMIN = usuario.rol === "ADMIN";
      const p = usuario.permisos.find((x) => x.programa === "vih");
      PERM = ADMIN ? { ver: true, registrar: true, anular: true, exportar: true } : p && p.ver ? p : PERM;
      const programas = ADMIN ? PROGS.map((x) => x.k) : usuario.permisos.filter((x) => x.ver).map((x) => x.programa).concat(["msg", "docs", "cal"]);
      PX.book = pxNewBook();
      PX.user = { ID: usuario.id, Usuario: usuario.usuario, Nombre: usuario.nombre, Cargo: usuario.cargo, Area: usuario.area || "", Rol: ADMIN ? "Administrador" : "Estándar", Programas: programas.join(","), Activo: "SI" };
      PX.book.usr.push(PX.user);
      PX.demo = false;
      PX.view = "vih";
      document.body.classList.toggle("sin-registrar", !PERM.registrar);
      document.addEventListener("submit", (e) => e.preventDefault(), true); // reemplaza onsubmit="return false" (CSP)
      document.addEventListener("click", (e) => {
        if (e.target && e.target.id === "vihrecargar") recargar({ conservarVista: true }).catch((x) => toast(x.message));
      });
      const main = $("pxmain");
      main.parentNode.insertBefore(estadoEl, main);
      if (!PERM.ver) {
        S.estado = "Su usuario no tiene acceso al programa VIH.";
        pintarEstado();
        document.body.classList.add("listo");
        return;
      }
      await recargar({ conservarVista: false });
      document.body.classList.add("listo");
      S.arrancar();
    } catch (e) {
      S.estado = "No se pudo cargar: " + e.message;
      pintarEstado();
      document.body.classList.add("listo");
    }
  }

  iniciar();
})();
