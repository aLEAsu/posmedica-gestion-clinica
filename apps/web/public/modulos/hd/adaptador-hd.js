/* Adaptador de Hemodiálisis: conecta el módulo ORIGINAL del prototipo (hd.js, sin modificar) con la base de datos.
   - Carga el libro desde /api/v1/hd/libro en lugar de un archivo de Excel.
   - Guarda en el servidor cada cambio que el módulo registra (detecta las diferencias con lo último guardado).
   - Aplica los permisos del usuario (registrar, anular, exportar; facturación solo administrador).
   - Retira los datos ficticios, la carga y descarga del libro y el campo «Usuario que registra».
   - Permite al administrador la carga inicial de un libro o Dashboard existente. */
(function () {
  "use strict";
  const { pedir } = window.POSMEDICA;
  const HOJAS = Object.keys(SH).filter((k) => !["log", "cfg", "fin"].includes(k));
  const FUENTE = "Base de datos POSMÉDICA";

  let ADMIN = false;
  let PERM = { ver: false, registrar: false, anular: false, exportar: false };
  let VERSION = 0;
  let base = null; // { hojas: { k: Map(ID → JSON) }, cfg: { clave: JSON }, fin: JSON }
  let enCurso = false, pendiente = false, guardandoImport = false;
  let importando = false; // bloquea el guardado automático mientras hay una importación en pantalla
  let confirmando = false; // el diálogo de confirmación de la importación está abierto
  let rechazos = []; // marcas de tiempo de rechazos del servidor (freno contra recargas en bucle)
  let estado = "Conectando…", hayNuevos = false, impGuardado = null;

  /* ---------- utilidades ---------- */

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
  const json = (v) => JSON.stringify(v === undefined ? null : v);
  const hora = () => new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

  let avisado = 0;
  function avisoConfig() {
    if (Date.now() - avisado > 10000) toast("Solo el administrador puede cambiar la configuración de hemodiálisis. El cambio no se guardó.");
    avisado = Date.now();
  }

  function tomarBase() {
    base = { hojas: {}, cfg: {}, fin: json(ST.book.finBlob) };
    for (const k of HOJAS) base.hojas[k] = new Map((ST.book[k] || []).filter((r) => r && r.ID).map((r) => [String(r.ID), json(plano(r))]));
    for (const k of Object.keys(ST.book.cfgv)) base.cfg[k] = json(ST.book.cfgv[k]);
  }

  function diferencias() {
    const cambios = {};
    let n = 0;
    for (const k of HOJAS) {
      const B = base.hojas[k];
      for (const r of ST.book[k] || []) {
        if (!r || !r.ID) continue;
        const p = plano(r), s = json(p), prev = B.get(String(r.ID));
        if (prev === s) continue;
        const c = (cambios[k] = cambios[k] || { nuevos: [], modificados: [] });
        if (prev === undefined) c.nuevos.push(p);
        else c.modificados.push(Object.assign(p, { _ts: r._ts || null }));
        n++;
      }
    }
    let cfg = null;
    for (const k of Object.keys(ST.book.cfgv)) {
      if (json(ST.book.cfgv[k]) === base.cfg[k]) continue;
      if (!ADMIN) {
        // La configuración (metas, turnos, frecuencias, esquemas) solo la cambia el administrador: se revierte en pantalla.
        ST.book.cfgv[k] = base.cfg[k] === undefined ? undefined : JSON.parse(base.cfg[k]);
        avisoConfig();
        continue;
      }
      (cfg = cfg || {})[k] = ST.book.cfgv[k];
    }
    if (cfg) n++;
    let fin;
    if (json(ST.book.finBlob) !== base.fin) {
      if (ADMIN) {
        fin = ST.book.finBlob;
        n++;
      } else ST.book.finBlob = JSON.parse(base.fin);
    }
    return { n, cambios, cfg, fin };
  }

  /* ---------- carga desde la base de datos ---------- */

  async function recargar(opts) {
    opts = opts || {};
    estado = "Cargando…";
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
    VERSION = r.version;
    hayNuevos = false;
    tomarBase();
    estado = "Datos al día · " + hora();
    syncBar();
    render();
    bookInfo();
  }

  /* ---------- guardado ---------- */

  let temporizador = null;
  function programar(ms) {
    clearTimeout(temporizador);
    temporizador = setTimeout(sincronizar, ms == null ? 400 : ms);
  }

  async function sincronizar() {
    if (!base || importando) return;
    if (enCurso) {
      pendiente = true;
      return;
    }
    const d = diferencias();
    if (!d.n) {
      if (ST.dirty) {
        ST.dirty = false;
        bookInfo();
      }
      return;
    }
    enCurso = true;
    ST.dirty = true;
    estado = "Guardando " + d.n + (d.n === 1 ? " cambio…" : " cambios…");
    bookInfo();
    try {
      const cuerpo = { cambios: d.cambios };
      if (d.cfg) cuerpo.cfg = d.cfg;
      if (d.fin !== undefined) cuerpo.finBlob = d.fin;
      const r = await pedir("POST", "/hd/sincronizar", cuerpo);
      // Lo enviado pasa a ser la nueva base; si el usuario siguió editando, la próxima pasada lo detecta.
      for (const [k, c] of Object.entries(d.cambios)) {
        for (const p of c.nuevos.concat(c.modificados)) {
          const s = Object.assign({}, p);
          delete s._ts;
          base.hojas[k].set(String(p.ID), json(s));
        }
        const ts = (r.ts && r.ts[k]) || {};
        for (const rec of ST.book[k]) if (rec && ts[rec.ID]) rec._ts = ts[rec.ID];
      }
      if (d.cfg) for (const k of Object.keys(d.cfg)) base.cfg[k] = json(d.cfg[k]);
      if (d.fin !== undefined) base.fin = json(d.fin);
      // Si nadie más escribió entre medias, la versión nueva es la nuestra.
      if (r.version === VERSION + 1) VERSION = r.version;
      else hayNuevos = true;
      estado = "Guardado · " + hora();
      ST.dirty = false;
    } catch (e) {
      if (e.status === 0 || e.status >= 500) {
        estado = "Sin guardar: " + e.message;
        toast(e.message);
        setTimeout(sincronizar, 10000);
      } else {
        toast(e.message);
        estado = "Cambio rechazado";
        rechazos = rechazos.filter((t) => Date.now() - t < 60000).concat(Date.now());
        if (rechazos.length > 3) {
          estado = "Guardado detenido: el servidor rechazó varios cambios seguidos. Recargue la página o informe al administrador.";
          base = null;
          return;
        }
        try {
          await recargar({ conservarBorradores: false });
        } catch (x) {
          toast(x.message);
        }
      }
    } finally {
      enCurso = false;
      bookInfo();
      if (pendiente) {
        pendiente = false;
        programar(50);
      }
    }
  }

  /* ---------- reemplazos sobre el módulo original ---------- */

  function sinPermiso(accion) {
    toast("Su usuario no tiene permiso para " + accion + " en Hemodiálisis. Pídalo al administrador.");
    throw new Error("Sin permiso para " + accion);
  }

  const _changed = window.changed;
  window.changed = function () {
    _changed();
    programar();
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
    return '<div class="panel empty"><p>' + esc(estado) + "</p></div>";
  };

  window.bookInfo = function () {
    const i = $("bookinfo");
    if (!i) return;
    if (!ST.book) {
      i.textContent = estado;
      return;
    }
    let act = 0;
    try {
      ensureIdx();
      act = ST.book.pac.filter((p) => activeAt(p, ST.corte)).length;
    } catch (e) {
      /* índice en construcción */
    }
    const cls = /rechazado|Sin guardar/.test(estado) ? "var(--bad)" : /Guardando|Cargando/.test(estado) ? "var(--warn)" : "var(--ok)";
    i.innerHTML =
      '<strong style="color:' + cls + '">' + esc(estado) + "</strong> · " + act + " activos al corte · " + ST.book.ses.length + " sesiones registradas" +
      (hayNuevos ? ' · <button type="button" class="lnk" id="hdrecargar">Hay datos nuevos de otros usuarios: actualizar</button>' : "");
  };

  // Importación inicial (solo administrador y con hemodiálisis vacía).
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
          importando = true;
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
    importando = true;
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
      importando = false;
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
        (W.length ? '<details class="hist"><summary>' + W.length + " avisos de la importación</summary><ul class=\"note\">" + W.slice(0, 50).map((w) => "<li>" + esc(w) + "</li>").join("") + "</ul></details>" : "") +
        '<p class="note">Es la <strong>carga inicial</strong>: después de guardarla, los datos se registran directamente en el sistema.</p>',
      "Guardar en la base de datos",
      () => {
        guardandoImport = true;
        guardarImportacion(fuente);
      },
    );
  }

  async function guardarImportacion(fuente) {
    estado = "Guardando la importación…";
    bookInfo();
    try {
      const hojas = {};
      for (const k of HOJAS) hojas[k] = ST.book[k].filter((r) => r && r.ID).map(plano);
      const cfg = {};
      for (const k of Object.keys(ST.book.cfgv)) cfg[k] = ST.book.cfgv[k];
      impGuardado = ST.imp && ST.imp.tarifas ? { tarifas: ST.imp.tarifas, warn: [], fn: fuente } : null;
      const r = await pedir("POST", "/hd/importar", { fuente, hojas, cfg, finBlob: ST.book.finBlob || undefined });
      importando = false;
      confirmando = false;
      guardandoImport = false;
      await recargar({ conservarVista: false });
      const cont = Object.entries(r.conteo).filter(([, v]) => v).map(([k, v]) => v + " " + (SH[k] ? SH[k][0] : k)).join(", ");
      openDlg(
        "Importación guardada",
        '<p class="note">Se guardó: ' + esc(cont) + ".</p>" +
          (r.avisos.length ? '<p class="note"><strong>Revise:</strong></p><ul class="note">' + r.avisos.map((a) => "<li>" + esc(a) + "</li>").join("") + "</ul>" : "") +
          (impGuardado || (ST.imp && ST.imp.tarifas) ? '<p class="note">Las tarifas del Dashboard quedan listas para crear la clave de facturación en la pestaña Facturación.</p>' : ""),
        "Entendido",
        () => {},
      );
    } catch (e) {
      importando = false;
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
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) sincronizar();
    });
  }

  async function revisarVersion() {
    if (!base || enCurso || importando || document.hidden) return;
    try {
      const r = await pedir("GET", "/hd/version");
      if (r.version !== VERSION && !hayNuevos) {
        hayNuevos = true;
        bookInfo();
      }
    } catch (e) {
      /* sin conexión: se reintenta en la próxima vuelta */
    }
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
        estado = "Su usuario no tiene acceso a Hemodiálisis.";
        render();
        return;
      }
      await recargar({ conservarVista: false });
      setInterval(() => {
        if (!enCurso && base && !importando && diferencias().n) sincronizar(); // red de seguridad para cambios sin changed()
      }, 5000);
      setInterval(revisarVersion, 45000);
    } catch (e) {
      estado = "No se pudo cargar: " + e.message;
      bookInfo();
      render();
    }
  }

  iniciar();
})();
