/* Diálisis peritoneal v1.1 · adaptador POSTERIOR: conecta el módulo con el servidor (/api/v1/dp11).
   - Al abrir: carga el estado desde la base (no del navegador) y redibuja.
   - Cada vez que el módulo guarda (save): compara con lo último guardado y envía solo lo nuevo, lo modificado y lo
     retirado (que el servidor anula, no borra), con el sello de concurrencia de cada registro.
   - Si otro usuario guardó algo, recarga sola cuando no hay cambios propios pendientes.
   - Quién registra lo fija la sesión. Metas, costos y catálogo: solo el administrador (el servidor lo exige).
   - «Abrir copia .json»: solo el administrador y solo para la carga inicial (importa a la base). «Guardar» (copia .json)
     y «Excel» exigen el permiso de exportar y quedan en la auditoría. */
(function () {
  "use strict";
  const { pedir, hora, avisarPortal } = window.POSMEDICA;
  const LISTAS = { ktv: "id", labs: "id", eventos: "id", valoraciones: "id", visitas: "id", formula: "pac|cod", habil: "id", oblig: "id", catalogo: "cod" };
  const MAPAS = ["hechos", "farm"];
  const UNICOS = ["cfg", "costos", "plan"];
  const SOLO_ADMIN = new Set(["cfg", "costos", "catalogo"]);
  const json = (v) => JSON.stringify(v === undefined ? null : v);
  const claveDe = (col, d) => (col === "formula" ? d.pac + "|" + d.cod : String(d[LISTAS[col]] == null ? "" : d[LISTAS[col]]));

  let usuario = null;
  let sinContratos = false;
  let base = null; // { coleccion: Map(clave → json) } de lo último guardado
  let ts = {}; // { coleccion: { clave: sello } }
  let version = 0;
  let enCurso = false;
  let pendiente = false;
  let temporizador = null;
  const info = (t) => {
    const el = $("saveinfo");
    if (el) el.textContent = t;
  };
  const permiso = (a) => usuario && (usuario.rol === "ADMIN" || (usuario.permisos || []).some((p) => p.programa === "dp" && p[a]));
  const esAdmin = () => usuario && usuario.rol === "ADMIN";

  /** Vista del estado por colección: Map(clave → json del registro). */
  function vista() {
    const v = {};
    v.pacientes = new Map((S.pacientes || []).filter((p) => p && p.id).map((p) => [String(p.id), json(p)]));
    for (const col of Object.keys(LISTAS)) v[col] = new Map((S[col] || []).map((d) => [claveDe(col, d), json(d)]).filter(([k]) => k && k !== "|"));
    for (const col of MAPAS) v[col] = new Map(Object.entries(S[col] || {}).map(([k, x]) => [k, json({ v: x })]));
    for (const col of UNICOS) v[col] = new Map(S[col] == null ? [] : [["valor", json({ v: S[col] })]]);
    return v;
  }

  function diferencias() {
    const actual = vista();
    const cambios = {};
    let n = 0;
    let soloAdmin = false;
    for (const col of Object.keys(actual)) {
      const A = actual[col];
      const B = base[col] || new Map();
      const c = { nuevos: [], modificados: [], eliminados: [] };
      for (const [k, s] of A) {
        const prev = B.get(k);
        if (prev === s) continue;
        if (prev === undefined) c.nuevos.push({ clave: k, datos: JSON.parse(s) });
        else c.modificados.push({ clave: k, datos: JSON.parse(s), _ts: (ts[col] || {})[k] || null });
      }
      for (const k of B.keys()) if (!A.has(k)) c.eliminados.push({ clave: k, _ts: (ts[col] || {})[k] || null });
      const total = c.nuevos.length + c.modificados.length + c.eliminados.length;
      if (!total) continue;
      if (SOLO_ADMIN.has(col) && !esAdmin()) {
        soloAdmin = true;
        continue;
      }
      // Los mapas y únicos guardan su valor en {v}: el servidor espera «datos» como objeto.
      cambios[col] = c;
      n += total;
    }
    return { n, cambios, soloAdmin };
  }

  async function cargar(motivo) {
    const r = await pedir("GET", "/dp11/libro");
    const corte = S && S.corte;
    const est = r.estado || {};
    // Lo que el servidor tiene manda; donde no tiene nada se conservan los valores iniciales del módulo (lista de
    // habilitación, obligaciones contractuales, plan general, metas y costos por defecto).
    S = seedState();
    const porDefecto = [];
    S.pacientes = est.pacientes || [];
    for (const col of Object.keys(LISTAS)) {
      if (Array.isArray(est[col]) && est[col].length) S[col] = est[col];
      else if ((S[col] || []).length) porDefecto.push(col);
    }
    for (const col of MAPAS) S[col] = est[col] || {};
    for (const col of UNICOS) {
      if (est[col] != null) S[col] = est[col];
      else if (S[col] != null) porDefecto.push(col);
    }
    S.cfg = Object.assign(JSON.parse(JSON.stringify(META_DEF)), S.cfg || {});
    const hoy = new Date();
    S.corte = corte || hoy.getFullYear() + "-" + String(hoy.getMonth() + 1).padStart(2, "0");
    S.meta.usuario = usuario ? usuario.nombre + " · " + usuario.cargo : "";
    ts = r.ts || {};
    version = r.version || 0;
    base = vista();
    // Los valores iniciales que el usuario puede escribir se guardan en el servidor con el primer cambio.
    if (permiso("registrar")) for (const col of porDefecto) if (!SOLO_ADMIN.has(col) || esAdmin()) base[col] = new Map();
    // Contenido de los contratos por EPS: lo entrega la API (no va en el código público).
    try {
      const k = await pedir("GET", "/dp11/contratos");
      for (const x of Object.keys(CONTRATOS)) delete CONTRATOS[x];
      Object.assign(CONTRATOS, k.contratos || {});
      sinContratos = !k.contratos;
    } catch (e) {
      sinContratos = true;
    }
    const c = $("corte");
    if (c) c.value = S.corte;
    render();
    avisoCargaInicial();
    info((motivo || "Datos al día") + " · " + hora() + " · " + S.pacientes.length + " pacientes");
  }

  async function sincronizar() {
    if (!base) return;
    if (enCurso) {
      pendiente = true;
      return;
    }
    const d = diferencias();
    if (d.soloAdmin) {
      toast("Las metas, los costos y el catálogo de insumos solo los cambia el administrador. El cambio no se guardó.");
      await cargar("Cambio no permitido deshecho");
      return;
    }
    if (!d.n) {
      info("Guardado · " + hora());
      return;
    }
    enCurso = true;
    info("Guardando…");
    try {
      const r = await pedir("POST", "/dp11/sincronizar", { cambios: d.cambios });
      const actual = vista();
      for (const [col, c] of Object.entries(d.cambios)) {
        const B = (base[col] = base[col] || new Map());
        for (const x of c.nuevos.concat(c.modificados)) B.set(x.clave, actual[col].get(x.clave) || json(x.datos));
        for (const x of c.eliminados) B.delete(x.clave);
        ts[col] = Object.assign(ts[col] || {}, (r.ts || {})[col] || {});
      }
      version = r.version || version;
      info("Guardado · " + hora());
    } catch (e) {
      if (e.status === 0) {
        info("Sin conexión: los cambios se guardarán al volver la conexión");
        clearTimeout(temporizador);
        temporizador = setTimeout(sincronizar, 15000);
      } else {
        toast(e.message);
        await cargar("Recargado del servidor").catch((x) => toast(x.message));
      }
    } finally {
      enCurso = false;
      if (pendiente) {
        pendiente = false;
        programar();
      }
    }
  }
  function programar(ms) {
    clearTimeout(temporizador);
    temporizador = setTimeout(sincronizar, ms == null ? 600 : ms);
  }

  /* El módulo llama save() tras cada cambio: aquí guarda en el servidor (nunca en el navegador). */
  save = function (msg) {
    S.meta.actualizado = new Date().toISOString();
    if (!permiso("registrar")) {
      toast("Su usuario no tiene permiso para registrar en Diálisis peritoneal.");
      cargar("Sin permiso de registro: se mostraron los datos guardados").catch((e) => toast(e.message));
      return;
    }
    info("Cambios sin guardar…");
    programar();
    if (msg) toast(msg);
  };

  /* Datos nuevos de otros usuarios: se recargan solos si no hay cambios propios sin guardar. */
  setInterval(async () => {
    if (!base || enCurso || document.hidden) return;
    try {
      const r = await pedir("GET", "/dp11/version");
      if (r.version > version && !diferencias().n) await cargar("Actualizado con cambios de otros usuarios");
    } catch (e) {
      /* el aviso de sesión lo da pedir() */
    }
  }, 30000);

  /* Barra del módulo: quién registra lo da la sesión; copias y exportaciones con permiso y auditoría. */
  function ajustarBarra() {
    const u = $("usuario");
    if (u) {
      u.value = usuario ? usuario.nombre + " · " + usuario.cargo : "";
      u.readOnly = true;
      u.title = "Lo fija la sesión";
    }
    const exportar = async (que, accion) => {
      if (!permiso("exportar")) return toast("Su usuario no tiene permiso para exportar en Diálisis peritoneal.");
      try {
        await pedir("POST", "/dp11/auditar", { accion: "EXPORTA", detalle: que + " · corte " + S.corte });
        accion();
      } catch (e) {
        toast(e.message);
      }
    };
    const bs = $("btnSave");
    if (bs) {
      bs.textContent = "Copia .json";
      bs.title = "Descargar copia completa (.json) · queda en la auditoría";
      bs.onclick = () => exportar("Copia .json de Diálisis peritoneal", () => download("DP_UNOP_copia_" + S.corte + ".json", new Blob([JSON.stringify(S, null, 1)], { type: "application/json" })));
    }
    const bx = $("btnXlsx");
    if (bx) bx.onclick = () => exportar("Excel de Diálisis peritoneal", exportAll);
    const lbl = document.querySelector('label[for="fileLoad"]');
    if (lbl) {
      lbl.hidden = !esAdmin();
      lbl.textContent = "Carga inicial (.json)";
      lbl.title = "Solo el administrador, con el módulo vacío: importa a la base la copia .json del módulo";
    }
    const fl = $("fileLoad");
    if (fl)
      fl.onchange = (e) => {
        const f = e.target.files[0];
        e.target.value = "";
        if (!f || !esAdmin()) return;
        const rd = new FileReader();
        rd.onload = async () => {
          try {
            const estado = JSON.parse(rd.result);
            if (!estado || !Array.isArray(estado.pacientes)) throw new Error("El archivo no es una copia válida de este módulo.");
            if (!confirm("Se importarán " + estado.pacientes.length + " pacientes y sus registros a la base de datos. ¿Continuar?")) return;
            const r = await pedir("POST", "/dp11/importar", { estado, fuente: f.name });
            await cargar("Carga inicial importada");
            toast("Importado: " + Object.entries(r.conteo).map(([k, n]) => k + " " + n).join(", "));
          } catch (x) {
            toast(x.message || "No se pudo importar la copia.");
          }
        };
        rd.readAsText(f);
      };
  }

  /** Con el módulo vacío, el administrador elige cómo hacer la carga inicial. */
  function avisoCargaInicial() {
    const viejo = document.getElementById("dp11-carga");
    if (viejo) viejo.remove();
    const vacio = !(S.pacientes || []).length;
    if (!esAdmin() || (!vacio && !sinContratos)) return;
    const d = document.createElement("div");
    d.id = "dp11-carga";
    d.setAttribute("role", "region");
    d.style.cssText = "margin:12px;padding:12px 14px;border:1px solid var(--line,#ccc);border-left:4px solid var(--accent,#06b6d4);border-radius:10px;font:14px/1.5 system-ui,sans-serif";
    d.innerHTML =
      "<strong>" + (vacio ? "Diálisis peritoneal v1.1 está vacío." : "Faltan los contratos por EPS.") + "</strong> Carga inicial (solo administrador):" +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">' +
      (vacio ? '<button type="button" class="btn sm primary" data-dp11="v08">Traer pacientes y laboratorios de DP v0.8</button><button type="button" class="btn sm" data-dp11="json">Importar copia .json del módulo</button>' : "") +
      (sinContratos ? '<button type="button" class="btn sm" data-dp11="contratos">Cargar contratos por EPS (.json o .html del prototipo)</button><input type="file" id="dp11-contratos" accept=".json,.html,.htm" hidden>' : "") +
      "</div>" +
      '<p class="note" style="margin:6px 0 0">Del v0.8 solo se trae lo que tiene equivalencia clara; lo demás se informa. La copia .json es la que descarga el botón «Guardar» del módulo. De un .html del prototipo solo se extraen y envían los contratos.</p>';
    const fc = d.querySelector("#dp11-contratos");
    if (fc)
      fc.onchange = (e) => {
        const f = e.target.files[0];
        if (!f) return;
        const rd = new FileReader();
        rd.onload = async () => {
          try {
            const t = String(rd.result).trim();
            let contratos;
            if (t.startsWith("{")) contratos = JSON.parse(t);
            else {
              const ln = t.split("\n").find((l) => l.startsWith("const DP11_HTML="));
              if (!ln) throw new Error("El archivo no trae el módulo de Diálisis peritoneal v1.1.");
              const m = /\nconst CONTRATOS=(.*?);\n/.exec(JSON.parse(ln.slice("const DP11_HTML=".length).replace(/;\s*$/, "")));
              if (!m) throw new Error("No se encontraron los contratos dentro del módulo.");
              contratos = JSON.parse(m[1]);
            }
            const r = await pedir("POST", "/dp11/contratos", { contratos, fuente: f.name });
            await cargar("Contratos cargados");
            toast("Contratos por EPS cargados: " + r.eps + " EPS.");
          } catch (x) {
            toast(x.message || "No se pudo leer el archivo.");
          }
        };
        rd.readAsText(f);
      };
    document.body.prepend(d);
  }
  document.addEventListener("click", async (e) => {
    const b = e.target.closest("[data-dp11]");
    if (!b) return;
    if (b.dataset.dp11 === "json") return $("fileLoad").click();
    if (b.dataset.dp11 === "contratos") return document.getElementById("dp11-contratos").click();
    if (!confirm("Se crearán en Diálisis peritoneal v1.1 los pacientes de la v0.8 (con la misma persona del maestro) y sus laboratorios con equivalencia clara. ¿Continuar?")) return;
    try {
      b.disabled = true;
      const r = await pedir("POST", "/dp11/traer-v08", {});
      await cargar("Traído de DP v0.8");
      const no = Object.entries(r.laboratoriosNoTrasladados || {}).map(([k, n]) => k + " " + n).join(", ");
      const est = Object.entries(r.estadosConservados || {}).map(([k, n]) => k + " " + n).join(", ");
      toast(r.pacientes + " pacientes y " + r.laboratorios + " laboratorios traídos." + (no ? " No trasladados: " + no + "." : "") + (est ? " Estados por revisar: " + est + "." : ""));
    } catch (x) {
      toast(x.message);
      b.disabled = false;
    }
  });

  /* Acciones que en el prototipo iban en atributos onclick (la CSP no permite manejadores en línea). */
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-cerrar-dlg]")) $("dlg").hidden = true;
    if (e.target.closest("[data-imprimir]")) window.print();
  });

  (async () => {
    info("Cargando desde el servidor…");
    try {
      usuario = (await pedir("GET", "/auth/me")).usuario;
      ajustarBarra();
      await cargar();
    } catch (e) {
      info("No se pudo cargar: " + e.message);
      if (e.status === 401) avisarPortal("sesion-perdida");
    }
  })();
})();
