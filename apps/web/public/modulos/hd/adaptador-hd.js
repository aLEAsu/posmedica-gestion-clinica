/* Adaptador de Hemodiálisis: conecta el módulo ORIGINAL del prototipo (hd.js, sin modificar) con la base de datos.
   - Carga el libro desde /api/v1/hd/libro en lugar de un archivo de Excel.
   - Guarda en el servidor cada cambio que el módulo registra (motor de sincronización de adaptador-comun.js).
   - Aplica los permisos del usuario (registrar, anular, exportar; configuración y facturación solo administrador).
   - Retira los datos ficticios, la carga y descarga del libro y el campo «Usuario que registra».
   - Permite al administrador la carga inicial de un libro o Dashboard existente. */
(function () {
  "use strict";
  const { pedir, crearSincronizador } = window.POSMEDICA;
  const HOJAS = Object.keys(SH).filter((k) => !["log", "cfg", "fin"].includes(k));
  const FUENTE = "Base de datos POSMÉDICA";

  let ADMIN = false;
  let PERM = { ver: false, registrar: false, anular: false, exportar: false };
  let confirmando = false, guardandoImport = false, impGuardado = null;

  /** Registro sin campos internos (_ses, _ts…) y con fechas como «AAAA-MM-DD». */
  function plano(r) {
    const o = {};
    for (const k of Object.keys(r)) {
      if (k.charAt(0) === "_") continue;
      const v = r[k];
      if (typeof v === "function") continue;
      o[k] = v instanceof Date ? iso(v) : v === undefined ? null : v;
    }
    return o;
  }

  const S = crearSincronizador({
    ruta: "/hd",
    hojas: HOJAS.map((k) => [k, "ID"]),
    libro: () => ST.book,
    plano,
    cfgLeer: () => ST.book.cfgv,
    cfgRevertir: (k, v) => {
      ST.book.cfgv[k] = v;
    },
    finLeer: () => ST.book.finBlob || null,
    finRevertir: (v) => {
      ST.book.finBlob = v;
    },
    esAdmin: () => ADMIN,
    recargar: (o) => recargar(o),
    alCambiar: () => {
      if (S.listo()) ST.dirty = /Guardando|Sin guardar/.test(S.estado);
      bookInfo();
    },
    toast: (t) => toast(t),
  });

  /* ---------- carga desde la base de datos ---------- */

  async function recargar(opts) {
    opts = opts || {};
    S.estado = "Cargando…";
    bookInfo();
    const r = await pedir("GET", "/hd/libro");
    const b = newBook();
    for (const k of HOJAS) {
      b[k] = (r.hojas[k] || []).map((x) => {
        const o = fromRow(x);
        o._ts = x._ts;
        return o;
      });
    }
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
    setBook(b, FUENTE);
    if (previo && opts.conservarVista !== false) {
      Object.assign(ST, { view: previo.view, corte: previo.corte, ps: previo.ps, eps: previo.eps });
      if (opts.conservarBorradores) ST.ui = previo.ui;
    }
    if (impGuardado) {
      ST.imp = impGuardado; // tarifas del Dashboard importado, para crear la clave de facturación
      impGuardado = null;
    }
    S.cargado(r.version);
    ST.dirty = false;
    syncBar();
    render();
    bookInfo();
  }

  /* ---------- reemplazos sobre el módulo original ---------- */

  function sinPermiso(accion) {
    toast("Su usuario no tiene permiso para " + accion + " en Hemodiálisis. Pídalo al administrador.");
    throw new Error("Sin permiso para " + accion);
  }

  const _changed = window.changed;
  window.changed = function () {
    _changed();
    S.programar();
  };
  const _addRec = window.addRec;
  window.addRec = function (k, pre, o) {
    if (!PERM.registrar) sinPermiso("registrar");
    return _addRec(k, pre, o);
  };
  const _updRec = window.updRec;
  window.updRec = function (k, r, ch) {
    if (!PERM.registrar) sinPermiso("registrar");
    return _updRec(k, r, ch);
  };
  const _anular = window.anular;
  window.anular = function (k, id, mot) {
    if (!PERM.anular) sinPermiso("anular registros");
    return _anular(k, id, mot);
  };
  const _saveWb = window.saveWb;
  window.saveWb = async function (wb, name) {
    if (!PERM.exportar) {
      toast("Su usuario no tiene permiso para exportar en Hemodiálisis.");
      return false;
    }
    try {
      await pedir("POST", "/hd/auditar", { accion: "EXPORTA", detalle: String(name).slice(0, 300) });
    } catch (e) {
      toast(e.message);
      return false;
    }
    return _saveWb(wb, name);
  };

  // Sin datos ficticios: el sistema trabaja solo con la base de datos.
  window.loadDemo = function () {
    toast("Los datos ficticios se retiraron: el sistema trabaja con la base de datos.");
  };
  window.vStart = function () {
    return '<div class="panel empty"><p>' + esc(S.estado) + "</p></div>";
  };

  window.bookInfo = function () {
    const i = $("bookinfo");
    if (!i) return;
    if (!ST.book) {
      i.textContent = S.estado;
      return;
    }
    let act = 0;
    try {
      ensureIdx();
      act = ST.book.pac.filter((p) => activeAt(p, ST.corte)).length;
    } catch (e) {
      /* índice en construcción */
    }
    const cls = /rechazado|Sin guardar|detenido/.test(S.estado) ? "var(--bad)" : /Guardando|Cargando/.test(S.estado) ? "var(--warn)" : "var(--ok)";
    i.innerHTML =
      '<strong style="color:' + cls + '">' + esc(S.estado) + "</strong> · " + act + " activos al corte · " + ST.book.ses.length + " sesiones registradas" +
      (S.hayNuevos ? ' · <button type="button" class="lnk" id="hdrecargar">Hay datos nuevos de otros usuarios: actualizar</button>' : "");
  };

  /* ---------- importación inicial (solo administrador y con hemodiálisis vacía) ---------- */

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
          S.bloqueado = true;
          setBook(parseToolBook(wb), "Importado de «" + f.name + "» (sin guardar)");
          confirmando = true;
          confirmarImportacion(f.name);
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
    S.bloqueado = true;
    _importDashboard(wb, fn, mes);
    // Se abre después de que se cierre el diálogo del mes, para no confundir ese cierre con una cancelación.
    setTimeout(() => {
      confirmando = true;
      confirmarImportacion(fn);
    }, 0);
  };
  const _closeDlg = window.closeDlg;
  window.closeDlg = function () {
    _closeDlg();
    if (confirmando && !guardandoImport) {
      confirmando = false;
      S.bloqueado = false;
      toast("Importación cancelada: no se guardó nada.");
      recargar().catch((e) => toast(e.message));
    }
  };

  function confirmarImportacion(fuente) {
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
        guardarImportacion(fuente);
      },
    );
  }

  async function guardarImportacion(fuente) {
    S.estado = "Guardando la importación…";
    bookInfo();
    try {
      const hojas = {};
      for (const k of HOJAS) hojas[k] = ST.book[k].filter((r) => r && r.ID).map(plano);
      const cfg = Object.assign({}, ST.book.cfgv);
      impGuardado = ST.imp && ST.imp.tarifas ? { tarifas: ST.imp.tarifas, warn: [], fn: fuente } : null;
      const r = await pedir("POST", "/hd/importar", { fuente, hojas, cfg, finBlob: ST.book.finBlob || undefined });
      S.bloqueado = false;
      confirmando = false;
      guardandoImport = false;
      await recargar({ conservarVista: false });
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
      S.bloqueado = false;
      confirmando = false;
      guardandoImport = false;
      toast("No se guardó la importación: " + e.message);
      recargar().catch((x) => toast(x.message));
    }
  }

  /* ---------- interfaz ---------- */

  function ajustarInterfaz() {
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
    const priv = document.querySelector(".privacy");
    if (priv) priv.textContent = "Datos de salud sensibles (Ley 1581 de 2012). Cada cambio se guarda en el servidor con su usuario y hora, y queda en la auditoría. La herramienta calcula y alerta; la decisión clínica es del profesional.";
    if (!ADMIN) {
      const i = VIEWS.findIndex((v) => v[0] === "fin");
      if (i >= 0) VIEWS.splice(i, 1);
    }
    document.addEventListener("submit", (e) => e.preventDefault(), true); // reemplaza onsubmit="return false" (CSP)
    document.addEventListener("click", (e) => {
      if (e.target && e.target.id === "hdrecargar") recargar({ conservarBorradores: true }).catch((x) => toast(x.message));
    });
  }

  async function iniciar() {
    try {
      const { usuario } = await pedir("GET", "/auth/me");
      ADMIN = usuario.rol === "ADMIN";
      const p = usuario.permisos.find((x) => x.programa === "hd");
      PERM = ADMIN ? { ver: true, registrar: true, anular: true, exportar: true } : p && p.ver ? p : PERM;
      ST.user = usuario.nombre + " · " + usuario.cargo;
      ajustarInterfaz();
      if (!PERM.ver) {
        S.estado = "Su usuario no tiene acceso a Hemodiálisis.";
        render();
        return;
      }
      await recargar({ conservarVista: false });
      S.arrancar();
    } catch (e) {
      S.estado = "No se pudo cargar: " + e.message;
      bookInfo();
      render();
    }
  }

  iniciar();
})();
