/* Adaptador de la Ruta de Nefroprotección (se carga DESPUÉS de su código, que no se modifica).
   La Ruta trabaja en su «modo base de datos» contra la fachada del servidor (/api/v1/nefro/pg). Este adaptador completa
   lo que el prototipo aún no guardaba: la AGENDA (jornadas, citas, bitácora y contactos).
   - Al cargar, la agenda guardada se incorpora a la cohorte con el lector de la propia Ruta (COH.parseRows).
   - Cuando la Ruta recarga sus datos tras un registro, se conserva la agenda que está en pantalla.
   - Cada cambio de agenda se guarda en el servidor en segundos (con control de ediciones simultáneas).
   - Las exportaciones a Excel exigen el permiso «exportar» y quedan en la auditoría.
   - Al importar el libro de la Ruta (carga inicial, administrador), también se importan sus hojas de agenda. */
(function () {
  "use strict";
  const { pedir, hora } = window.POSMEDICA;
  const HOJAS = ["Jornadas", "Citas", "Citas_log", "Contactos"];
  const CAMPO = { Jornadas: "jor", Citas: "cit", Citas_log: "clog", Contactos: "ctc" };
  let PERM = { ver: false, registrar: false, anular: false, exportar: false };
  let ADMIN = false;
  let base = null; // { hoja: Map(clave → JSON) }
  let ts = {}; // { hoja: { clave: _ts } }
  let enCurso = false;
  let detenido = false;

  /* ---------- aviso propio (la Ruta tiene el suyo dentro de su código) ---------- */
  const avisoEl = document.createElement("div");
  avisoEl.className = "toast";
  avisoEl.setAttribute("role", "status");
  avisoEl.hidden = true;
  document.body.appendChild(avisoEl);
  let avisoT = 0;
  function aviso(t) {
    avisoEl.textContent = t;
    avisoEl.hidden = false;
    clearTimeout(avisoT);
    avisoT = setTimeout(() => (avisoEl.hidden = true), 6000);
  }

  /* ---------- filas de agenda: inverso exacto del lector de la Ruta (COH.parseRows) ---------- */
  const p2 = (n) => String(n).padStart(2, "0");
  const F = (d) => (d instanceof Date && !isNaN(d) ? d.getFullYear() + "-" + p2(d.getMonth() + 1) + "-" + p2(d.getDate()) : "");
  const s = (v) => (v == null ? "" : v);
  const A_FILA = {
    Jornadas: (x) => ({ id_jornada: x.id, fecha: F(x.fecha), servicio: s(x.serv), profesional: s(x.prof), hora_inicio: s(x.hIni), hora_fin: s(x.hFin), duracion_cupo_min: x.dur == null ? "" : x.dur, agendas_simultaneas: x.nAg == null ? "" : x.nAg, estado: s(x.estado), motivo_cancelacion: s(x.motivo), observaciones: s(x.obs), usuario: s(x.usuario), registrado: s(x.reg) }),
    Citas: (x) => ({ id_cita: x.id, codigo: x.c, id_jornada: s(x.jor), fecha: F(x.fecha), hora: s(x.hora), agenda: s(x.ag), servicio: s(x.serv), tipo: s(x.tipo), origen: s(x.origen), fecha_solicitud: F(x.fSol), fecha_deseada: F(x.fDes), fecha_asignacion: F(x.fAsig), estado: s(x.estado), confirmacion: s(x.conf), hora_llegada: s(x.hLleg), hora_atencion: s(x.hAten), responsable: s(x.resp), motivo: s(x.motivo), aviso_horas: x.avisoH == null ? "" : x.avisoH, cita_anterior: s(x.deId), reprogramada_en: s(x.reId), observaciones: s(x.obs), usuario: s(x.usuario), actualizado: s(x.act) }),
    Citas_log: (x) => ({ fecha_y_hora: s(x.fh), id: s(x.id), codigo: s(x.c), accion: s(x.acc), estado_anterior: s(x.de), estado_nuevo: s(x.a), motivo: s(x.motivo), usuario: s(x.usuario) }),
    Contactos: (x) => ({ fecha_y_hora: s(x.fh), codigo: s(x.c), id_cita: s(x.cita), medio: s(x.medio), resultado: s(x.res), observaciones: s(x.obs), usuario: s(x.usuario) }),
  };
  /** Clave estable de cada fila. La bitácora y los contactos no tienen ID: se usa su contenido y el orden de repetición. */
  function claves(hoja, filas) {
    const n = {};
    return filas.map((f) => {
      const k =
        hoja === "Jornadas" ? f.id_jornada :
        hoja === "Citas" ? f.id_cita :
        hoja === "Citas_log" ? [f.fecha_y_hora, f.id, f.accion, f.estado_nuevo, f.usuario].join("|") :
        [f.fecha_y_hora, f.codigo, f.id_cita, f.medio, f.resultado].join("|");
      n[k] = (n[k] || 0) + 1;
      return hoja === "Jornadas" || hoja === "Citas" ? String(k) : k + "#" + n[k];
    });
  }
  function filasDe(B, hoja) {
    const filas = (B[CAMPO[hoja]] || []).map(A_FILA[hoja]);
    const k = claves(hoja, filas);
    return filas.map((datos, i) => ({ clave: k[i], datos }));
  }

  /* ---------- la agenda entra a la cohorte que arma la Ruta ---------- */
  const _fromApi = COH.fromApi;
  COH.fromApi = function (D) {
    const B = _fromApi(D);
    const previo = window.MG && window.MG.dbMode ? window.MG.book : null;
    if (previo && previo.jor) {
      // La Ruta recargó tras un registro: se conserva la agenda que está en pantalla (puede tener cambios por guardar).
      B.jor = previo.jor; B.cit = previo.cit; B.clog = previo.clog; B.ctc = previo.ctc;
    } else if (window.__agendaNefro) {
      const S = { Pacientes: B.pac.map((p) => ({ codigo: p.codigo })), Laboratorios: [], Valoraciones: [], Atenciones: [], Novedades: [] };
      ts = {};
      for (const h of HOJAS) {
        const L = window.__agendaNefro.hojas[h] || [];
        S[h] = L.map((x) => x.datos);
        ts[h] = Object.fromEntries(L.map((x) => [x.clave, x._ts]));
      }
      const B2 = COH.parseRows(S);
      B.jor = B2.jor; B.cit = B2.cit; B.clog = B2.clog; B.ctc = B2.ctc;
      const avisos = (B2.issues || []).filter((x) => HOJAS.some((h) => JSON.stringify(x).includes(h)));
      B.issues = (B.issues || []).concat(avisos);
      setTimeout(tomarBase, 0); // cuando la Ruta termine de instalar el libro
    }
    COH.reindexCitas(B);
    return B;
  };

  function tomarBase() {
    const B = window.MG && window.MG.book;
    if (!B) return;
    base = {};
    for (const h of HOJAS) base[h] = new Map(filasDe(B, h).map((f) => [f.clave, JSON.stringify(f.datos)]));
  }

  function diferencias() {
    const B = window.MG && window.MG.book;
    const cambios = {};
    let n = 0;
    for (const h of HOJAS) {
      for (const f of filasDe(B, h)) {
        const s0 = JSON.stringify(f.datos), prev = base[h].get(f.clave);
        if (prev === s0) continue;
        const c = (cambios[h] = cambios[h] || { nuevos: [], modificados: [] });
        if (prev === undefined) c.nuevos.push(f);
        else c.modificados.push(Object.assign({}, f, { _ts: (ts[h] || {})[f.clave] || null }));
        n++;
      }
    }
    return { n, cambios };
  }

  async function guardarAgenda() {
    if (!base || enCurso || detenido || !window.MG || !window.MG.dbMode) return;
    const d = diferencias();
    if (!d.n) return;
    if (!PERM.registrar) {
      aviso("Su usuario no tiene permiso para registrar en la agenda de Nefroprotección: el cambio no se guardará.");
      detenido = true;
      return;
    }
    enCurso = true;
    try {
      const r = await pedir("POST", "/nefro/agenda/sincronizar", { cambios: d.cambios });
      for (const [h, c] of Object.entries(d.cambios)) {
        for (const f of c.nuevos.concat(c.modificados)) base[h].set(f.clave, JSON.stringify(f.datos));
        Object.assign((ts[h] = ts[h] || {}), (r.ts && r.ts[h]) || {});
      }
      if (window.MG.agendaGuardada) window.MG.agendaGuardada();
      aviso("Agenda guardada · " + hora());
    } catch (e) {
      if (e.status === 0 || e.status >= 500) {
        aviso("La agenda no se pudo guardar todavía: " + e.message + " Se reintentará.");
      } else {
        aviso(e.message);
        detenido = true;
        if (e.status === 409) setTimeout(() => location.reload(), 2500);
      }
    } finally {
      enCurso = false;
    }
  }

  /* ---------- exportaciones: permiso y auditoría ---------- */
  const _write = XLSX.write;
  XLSX.write = function (wb, opts) {
    if (!PERM.exportar) {
      aviso("Su usuario no tiene permiso para exportar en Nefroprotección.");
      throw new Error("Sin permiso para exportar");
    }
    pedir("POST", "/nefro/auditar", { accion: "EXPORTA", detalle: "Excel de la Ruta: " + (wb.SheetNames || []).join(", ").slice(0, 280) }).catch(() => {});
    return _write.call(this, wb, opts);
  };

  /* ---------- carga inicial de la agenda junto con el libro de la Ruta ---------- */
  const archivo = document.getElementById("bookfile");
  if (archivo) {
    archivo.addEventListener("change", () => {
      const f = archivo.files && archivo.files[0];
      if (!f || !ADMIN) return;
      const rd = new FileReader();
      rd.onload = async (ev) => {
        try {
          const wb = XLSX.read(new Uint8Array(ev.target.result), { type: "array", cellDates: false });
          if (!wb.SheetNames.some((n) => /^(jornadas|citas)$/i.test(n))) return;
          const actual = await pedir("GET", "/nefro/agenda");
          if (HOJAS.some((h) => (actual.hojas[h] || []).length)) return; // la agenda ya existe: solo carga inicial
          const S = COH.sheetsFromWb(wb);
          const B = COH.parseRows(S);
          const hojas = {};
          for (const h of HOJAS) hojas[h] = filasDe(B, h);
          const r = await pedir("POST", "/nefro/agenda/importar", { hojas });
          aviso("Agenda importada: " + Object.entries(r.conteo).map(([k, v]) => v + " " + k).join(", ") + ". Recargando…");
          setTimeout(() => location.reload(), 2500);
        } catch (e) {
          aviso("No se importó la agenda: " + e.message);
        }
      };
      rd.readAsArrayBuffer(f);
    });
  }

  /* ---------- sin datos ficticios ---------- */
  if (window.MG) window.MG.loadDemo = function () {
    aviso("Los datos ficticios se retiraron: la Ruta trabaja con la base de datos.");
  };
  // El botón se oculta y deshabilita (no se elimina: la Ruta lo usa al arrancar).
  const demo = document.getElementById("bookdemo");
  if (demo) {
    demo.hidden = true;
    demo.disabled = true;
  }

  /* ---------- textos heredados del modo sin servidor ---------- */
  for (const el of document.querySelectorAll(".privacy, p")) {
    if (/Nada de lo que escriba se guarda/.test(el.textContent || "")) {
      el.textContent = "Se diligencia en cada valoración del programa. Lo que se registra (pacientes, valoraciones, paraclínicos, atenciones, novedades, contactos y agenda) se guarda en la base de datos con su usuario y hora. La herramienta propone y la decisión es del profesional.";
    }
  }

  /* ---------- arranque ---------- */
  async function iniciar() {
    try {
      const { usuario } = await pedir("GET", "/auth/me");
      ADMIN = usuario.rol === "ADMIN";
      const p = usuario.permisos.find((x) => x.programa === "nefro");
      PERM = ADMIN ? { ver: true, registrar: true, anular: true, exportar: true } : p && p.ver ? p : PERM;
      document.body.classList.toggle("carga-inicial", ADMIN);
      setInterval(guardarAgenda, 3000);
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) guardarAgenda();
      });
    } catch (e) {
      aviso("No se pudo verificar la sesión: " + e.message);
    }
  }
  // Para las pruebas automáticas (apps/api/test/nefro-agenda.test.ts): conversión de la agenda a filas.
  window.POSMEDICA_NEFRO = { filasDe };
  iniciar();
})();
