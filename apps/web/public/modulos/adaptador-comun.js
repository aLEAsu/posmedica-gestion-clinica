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

  /* Última interacción del usuario (clics o teclas en esta página o, en el portal, dentro de la Ruta). El sondeo de
     /version solo mantiene viva la sesión del servidor si hubo actividad reciente: así una pantalla abierta sin nadie
     enfrente sí se cierra por inactividad. */
  let ultimaInteraccion = Date.now();
  const marcarActividad = () => (ultimaInteraccion = Date.now());
  for (const ev of ["click", "keydown", "input", "wheel", "touchstart"]) document.addEventListener(ev, marcarActividad, { capture: true, passive: true });
  const activo = () => Date.now() - ultimaInteraccion < 60000;

  async function pedir(metodo, ruta, cuerpo, cabeceras) {
    let r;
    try {
      r = await fetch(API + ruta, {
        method: metodo,
        credentials: "same-origin",
        headers: Object.assign({ Accept: "application/json", "X-Posmedica": "1" }, cuerpo !== undefined ? { "Content-Type": "application/json" } : {}, cabeceras || {}),
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
   * o.hojas           [[hoja, columnaClave | (registro) => clave], …]
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
    // ultimoRechazo: el último cambio que el servidor NO guardó (motivo y hora). Se muestra hasta que el usuario lo cierre,
    // para que nadie crea que guardó algo que fue rechazado.
    const S = { estado: "Conectando…", hayNuevos: false, version: 0, bloqueado: false, ultimoRechazo: null };
    S.descartarRechazo = () => {
      S.ultimoRechazo = null;
      o.alCambiar();
    };
    let base = null, enCurso = false, pendiente = false, temporizador = null, avisado = 0;
    let rechazos = [];
    const claveDe = (c, r) => (typeof c === "function" ? c(r) : r[c]);
    const tieneClave = (c, r) => {
      const k = r && claveDe(c, r);
      return k != null && k !== "";
    };

    S.tomarBase = function () {
      const L = o.libro() || {};
      base = { hojas: {}, cfg: {}, fin: o.finLeer ? json(o.finLeer()) : null };
      for (const [k, c] of o.hojas) base.hojas[k] = new Map((L[k] || []).filter((r) => tieneClave(c, r)).map((r) => [String(claveDe(c, r)), json(o.plano(r))]));
      const cfg = o.cfgLeer();
      for (const k of Object.keys(cfg)) base.cfg[k] = json(cfg[k]);
    };
    S.listo = () => !!base;

    S.diferencias = function () {
      const L = o.libro() || {};
      const cambios = {};
      let n = 0;
      for (const [k, c] of o.hojas) {
        const B = base.hojas[k];
        for (const r of L[k] || []) {
          if (!tieneClave(c, r)) continue;
          const p = o.plano(r), s = json(p), prev = B.get(String(claveDe(c, r)));
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

    // programado: hay un guardado en espera (los 400 ms tras un cambio). Cuenta como pendiente para el aviso al salir.
    S.programado = false;
    S.programar = function (ms) {
      clearTimeout(temporizador);
      temporizador = setTimeout(S.sincronizar, ms == null ? 400 : ms);
      if (!S.programado) {
        S.programado = true;
        o.alCambiar();
      }
    };

    S.pendiente = () => (base && !S.bloqueado ? S.diferencias().n : 0);

    S.sincronizar = async function () {
      if (S.programado) {
        S.programado = false;
        o.alCambiar();
      }
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
        const L = o.libro() || {};
        // Lo enviado pasa a ser la nueva base; si el usuario siguió editando, la próxima pasada lo detecta.
        for (const [k, c] of o.hojas) {
          const ch = d.cambios[k];
          if (!ch) continue;
          for (const p of ch.nuevos.concat(ch.modificados)) {
            const s = Object.assign({}, p);
            delete s._ts;
            base.hojas[k].set(String(claveDe(c, p)), json(s));
          }
          const ts = (r.ts && r.ts[k]) || {};
          for (const rec of L[k] || []) if (rec && ts[claveDe(c, rec)]) rec._ts = ts[claveDe(c, rec)];
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
          S.ultimoRechazo = { mensaje: e.message, hora: hora() };
          rechazos = rechazos.filter((t) => Date.now() - t < 60000).concat(Date.now());
          if (rechazos.length > 3) {
            S.estado = "Guardado detenido: el servidor rechazó varios cambios seguidos. Recargue la página o informe al administrador.";
            base = null;
          } else {
            try {
              // Conflicto con otro usuario (409): se recargan los datos conservando lo que se estaba digitando (p. ej. el
              // turno de hemodiálisis), para repetir el guardado sin volver a escribirlo todo.
              await o.recargar({ conservarBorradores: e.status === 409 });
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
        const r = await pedir("GET", o.ruta + "/version", undefined, activo() ? { "X-Actividad": "1" } : undefined);
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
      // Red de seguridad para cambios sin aviso: compara el libro completo solo si el usuario interactuó desde la última
      // pasada (comparar miles de registros cada 5 s sin que nadie toque nada gastaba CPU en equipos modestos).
      let tocado = true;
      for (const ev of ["click", "input", "change", "keydown", "drop"]) document.addEventListener(ev, () => (tocado = true), true);
      setInterval(() => {
        if (!tocado || enCurso || !base || S.bloqueado) return;
        tocado = false;
        if (S.diferencias().n) S.sincronizar();
      }, 5000);
      setInterval(S.revisarVersion, 45000);
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) S.sincronizar();
      });
    };

    return S;
  }

  window.POSMEDICA = { pedir, avisarPortal, crearSincronizador, hora, marcarActividad };
})();
