/* Adaptador común de los módulos con la interfaz original del prototipo (se cargan en un iframe del portal).
   - pedir(): llamadas a la API con la sesión del portal; avisa al portal si la sesión terminó.
   - crearSincronizador(): guarda en el servidor los cambios que el módulo original hace en su «libro» en memoria,
     comparando con lo último guardado (nuevos y modificados), con control de concurrencia y reintentos. */
(function () {
  "use strict";
  const API = "/api/v1";

  function avisarPortal(tipo, datos) {
    try {
      if (window.parent && window.parent !== window) window.parent.postMessage(Object.assign({ tipo: "posmedica:" + tipo }, datos || {}), location.origin);
    } catch (e) {
      /* sin portal (página abierta sola) */
    }
  }

  async function pedir(metodo, ruta, cuerpo) {
    let r;
    try {
      r = await fetch(API + ruta, {
        method: metodo,
        credentials: "same-origin",
        headers: Object.assign({ Accept: "application/json", "X-Posmedica": "1" }, cuerpo !== undefined ? { "Content-Type": "application/json" } : {}),
        body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
      });
    } catch (e) {
      const err = new Error("Sin conexión con el servidor. Los cambios se guardarán cuando vuelva la conexión.");
      err.status = 0;
      throw err;
    }
    if (r.ok) return r.json();
    let d = {};
    try {
      d = await r.json();
    } catch (e) {
      /* sin cuerpo JSON */
    }
    const err = new Error(d.error || (r.status >= 500 ? "El servidor no responde. Intente de nuevo en un momento." : "No se pudo completar la acción."));
    err.status = r.status;
    err.codigo = d.codigo;
    if (r.status === 401 || d.codigo === "CAMBIO_CLAVE") avisarPortal("sesion-perdida");
    throw err;
  }

  const json = (v) => JSON.stringify(v === undefined ? null : v);
  const hora = () => new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });

  /**
   * o.ruta            "/hd", "/vih"
   * o.hojas           [[hoja, columnaClave], …]
   * o.libro()         libro en memoria del módulo original
   * o.plano(r)        registro sin campos internos, listo para enviar
   * o.cfgLeer()       { clave: valor } de la configuración del libro
   * o.cfgRevertir(k, valor|undefined)   deshace en pantalla un cambio de configuración no permitido
   * o.finLeer / o.finRevertir           (opcional) datos de facturación cifrados, solo administrador
   * o.esAdmin()       el usuario es administrador
   * o.recargar(opc)   vuelve a cargar el libro desde el servidor
   * o.alCambiar()     refresca la línea de estado del módulo
   * o.toast(texto)
   */
  function crearSincronizador(o) {
    const S = { estado: "Conectando…", hayNuevos: false, version: 0, bloqueado: false };
    let base = null, enCurso = false, pendiente = false, temporizador = null, avisado = 0;
    let rechazos = [];

    S.tomarBase = function () {
      const L = o.libro();
      base = { hojas: {}, cfg: {}, fin: o.finLeer ? json(o.finLeer()) : null };
      for (const [k, c] of o.hojas) base.hojas[k] = new Map((L[k] || []).filter((r) => r && r[c] != null && r[c] !== "").map((r) => [String(r[c]), json(o.plano(r))]));
      const cfg = o.cfgLeer();
      for (const k of Object.keys(cfg)) base.cfg[k] = json(cfg[k]);
    };
    S.listo = () => !!base;

    S.diferencias = function () {
      const L = o.libro();
      const cambios = {};
      let n = 0;
      for (const [k, c] of o.hojas) {
        const B = base.hojas[k];
        for (const r of L[k] || []) {
          if (!r || r[c] == null || r[c] === "") continue;
          const p = o.plano(r), s = json(p), prev = B.get(String(r[c]));
          if (prev === s) continue;
          const ch = (cambios[k] = cambios[k] || { nuevos: [], modificados: [] });
          if (prev === undefined) ch.nuevos.push(p);
          else ch.modificados.push(Object.assign(p, { _ts: r._ts || null }));
          n++;
        }
      }
      let cfg = null;
      const actual = o.cfgLeer();
      for (const k of new Set(Object.keys(actual).concat(Object.keys(base.cfg)))) {
        if (json(actual[k]) === (base.cfg[k] === undefined ? json(undefined) : base.cfg[k])) continue;
        if (!o.esAdmin()) {
          o.cfgRevertir(k, base.cfg[k] === undefined ? undefined : JSON.parse(base.cfg[k]));
          if (Date.now() - avisado > 10000) o.toast("Solo el administrador puede cambiar la configuración del programa. El cambio no se guardó.");
          avisado = Date.now();
          continue;
        }
        (cfg = cfg || {})[k] = actual[k] === undefined ? null : actual[k];
      }
      if (cfg) n++;
      let fin;
      if (o.finLeer && json(o.finLeer()) !== base.fin) {
        if (o.esAdmin()) {
          fin = o.finLeer();
          n++;
        } else o.finRevertir(JSON.parse(base.fin));
      }
      return { n, cambios, cfg, fin };
    };

    S.programar = function (ms) {
      clearTimeout(temporizador);
      temporizador = setTimeout(S.sincronizar, ms == null ? 400 : ms);
    };

    S.pendiente = () => (base && !S.bloqueado ? S.diferencias().n : 0);

    S.sincronizar = async function () {
      if (!base || S.bloqueado) return;
      if (enCurso) {
        pendiente = true;
        return;
      }
      const d = S.diferencias();
      if (!d.n) return;
      enCurso = true;
      S.estado = "Guardando " + d.n + (d.n === 1 ? " cambio…" : " cambios…");
      o.alCambiar();
      try {
        const cuerpo = { cambios: d.cambios };
        if (d.cfg) cuerpo.cfg = d.cfg;
        if (d.fin !== undefined) cuerpo.finBlob = d.fin;
        const r = await pedir("POST", o.ruta + "/sincronizar", cuerpo);
        const L = o.libro();
        // Lo enviado pasa a ser la nueva base; si el usuario siguió editando, la próxima pasada lo detecta.
        for (const [k, c] of o.hojas) {
          const ch = d.cambios[k];
          if (!ch) continue;
          for (const p of ch.nuevos.concat(ch.modificados)) {
            const s = Object.assign({}, p);
            delete s._ts;
            base.hojas[k].set(String(p[c]), json(s));
          }
          const ts = (r.ts && r.ts[k]) || {};
          for (const rec of L[k] || []) if (rec && ts[rec[c]]) rec._ts = ts[rec[c]];
        }
        if (d.cfg) for (const k of Object.keys(d.cfg)) base.cfg[k] = json(d.cfg[k]);
        if (d.fin !== undefined) base.fin = json(d.fin);
        if (r.version === S.version + 1) S.version = r.version;
        else S.hayNuevos = true;
        S.estado = "Guardado · " + hora();
      } catch (e) {
        if (e.status === 0 || e.status >= 500) {
          S.estado = "Sin guardar: " + e.message;
          o.toast(e.message);
          setTimeout(S.sincronizar, 10000);
        } else {
          o.toast(e.message);
          S.estado = "Cambio rechazado";
          rechazos = rechazos.filter((t) => Date.now() - t < 60000).concat(Date.now());
          if (rechazos.length > 3) {
            S.estado = "Guardado detenido: el servidor rechazó varios cambios seguidos. Recargue la página o informe al administrador.";
            base = null;
          } else {
            try {
              await o.recargar({ conservarBorradores: false });
            } catch (x) {
              o.toast(x.message);
            }
          }
        }
      } finally {
        enCurso = false;
        o.alCambiar();
        if (pendiente) {
          pendiente = false;
          S.programar(50);
        }
      }
    };

    S.revisarVersion = async function () {
      if (!base || enCurso || S.bloqueado || document.hidden || S.hayNuevos) return;
      try {
        const r = await pedir("GET", o.ruta + "/version");
        if (r.version !== S.version) {
          S.hayNuevos = true;
          o.alCambiar();
        }
      } catch (e) {
        /* sin conexión: se reintenta en la próxima vuelta */
      }
    };

    S.cargado = function (version) {
      S.version = version;
      S.hayNuevos = false;
      S.tomarBase();
      S.estado = "Datos al día · " + hora();
    };

    S.arrancar = function () {
      setInterval(() => {
        if (!enCurso && base && !S.bloqueado && S.diferencias().n) S.sincronizar(); // red de seguridad para cambios sin aviso
      }, 5000);
      setInterval(S.revisarVersion, 45000);
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) S.sincronizar();
      });
    };

    return S;
  }

  window.POSMEDICA = { pedir, avisarPortal, crearSincronizador, hora };
})();
