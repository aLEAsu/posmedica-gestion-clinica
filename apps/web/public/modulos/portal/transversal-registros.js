// Código propio del proyecto. Registros transversales v2.1 guardados en el libro institucional (y por él, en el servidor).
/* En la v3.2 la preconsulta de enfermería, la asistencia a actividades por disciplina, los procedimientos quirúrgicos e
   invasivos, la vacunación renal de Nefroprotección y los soportes pre-SISCAC vivían en el navegador (localStorage) o en
   la configuración del portal. Aquí pasan a hojas del libro institucional, que el servidor guarda con permisos POR
   PROGRAMA (cada fila lleva su «Programa»: la ve y la registra quien tiene ese programa), auditoría y concurrencia.
   Las vistas siguen leyendo V13.precon, V13.qxList y V13.nefroVac: ahora se arman desde esas hojas. */
(function () {
  "use strict";
  const AUD = ["Usuario", "Registrado", "Anulado", "MotivoAnulacion"];
  PSH.pre = ["Preconsulta", ["ID", "Fecha", "Programa", "Paciente", "PAS", "PAD", "FC", "FR", "Temp", "SatO2", "Peso", "Talla", "Cintura", "Glucometria", "Auxiliar", "Listo", ...AUD]];
  PSH.asi = ["AsistenciaActividades", ["ID", "Programa", "Paciente", "Disciplina", "Mes", "Resultado", ...AUD]];
  PSH.qx = ["Procedimientos", ["ID", "Fecha", "Programa", "Paciente", "Procedimiento", "Sitio", "Lote", "Responsable", "SolicitudDesinfeccion", ...AUD]];
  PSH.vre = ["VacunacionRenal", ["ID", "Programa", "Paciente", "VHB", "AntiHBs", "Influenza", "NeumococoConjugada", "NeumococoPolisacarida", "Covid", ...AUD]];
  PSH.sis = ["SoportesSISCAC", ["ID", "Programa", "Paciente", "Soportes", ...AUD]];
  ["pre", "asi", "qx", "vre", "sis"].forEach((k) => {
    if (!PKEYS.includes(k)) PKEYS.splice(PKEYS.indexOf("log"), 0, k);
  });

  const vivas = (k) => (PX.book && Array.isArray(PX.book[k]) ? PX.book[k].filter((r) => r.Anulado !== "SI") : []);
  /** Memoriza un cálculo mientras sus hojas (arreglo y tamaño) y los cambios locales no cambien. */
  let cambios = 0;
  function memo(hojas, armar) {
    let llave = null;
    let valor = null;
    return () => {
      const nueva = [cambios, PX.book];
      for (const k of hojas) {
        const arr = PX.book && PX.book[k];
        nueva.push(arr, arr ? arr.length : 0);
      }
      if (!llave || nueva.some((x, i) => x !== llave[i])) {
        llave = nueva;
        valor = armar();
      }
      return valor;
    };
  }
  const ultimo = (a, b) => (String(b.Registrado || "") > String(a.Registrado || "") || (b.Registrado === a.Registrado && String(b.ID) > String(a.ID)) ? b : a);

  /* ---------- hojas → estado que leen las vistas ---------- */
  const precon = memo(["pre", "asi"], () => {
    const o = {};
    const por = {};
    for (const r of vivas("pre")) {
      const k = r.Programa + "|" + r.Paciente;
      por[k] = por[k] ? ultimo(por[k], r) : r;
    }
    for (const [k, r] of Object.entries(por))
      o[k] = { pas: r.PAS, pad: r.PAD, fc: r.FC, fr: r.FR, temp: r.Temp, sat: r.SatO2, peso: r.Peso, talla: r.Talla, cint: r.Cintura, glu: r.Glucometria, aux: r.Auxiliar, fecha: r.Fecha, listo: r.Listo === "SI", id: r.ID };
    // Asistencia: «Programa|Paciente|Disciplina|Mes» → ASISTIO / INASISTIO
    for (const r of vivas("asi")) if (r.Resultado) o[r.Programa + "|" + r.Paciente + "|" + r.Disciplina + "|" + r.Mes] = r.Resultado;
    return o;
  });
  const qxList = memo(["qx"], () =>
    vivas("qx").map((r) => {
      let nom = r.Paciente;
      try {
        const p = v13GetPatientsForProg(r.Programa).find((x) => x.id === r.Paciente);
        if (p) nom = p.nom;
      } catch (e) {
        /* programa sin libro cargado */
      }
      return { id: r.ID, fecha: r.Fecha, prog: r.Programa, pid: r.Paciente, nom, proc: r.Procedimiento, sitio: r.Sitio, lote: r.Lote, med: r.Responsable, ambId: r.SolicitudDesinfeccion };
    }),
  );
  const nefroVac = memo(["vre"], () => {
    const o = {};
    for (const r of vivas("vre")) o[r.Paciente] = { vhb: r.VHB, ahbs: r.AntiHBs, inf: r.Influenza, neuc: r.NeumococoConjugada, neup: r.NeumococoPolisacarida, cov: r.Covid, id: r.ID };
    return o;
  });
  const ignorar = () => {}; // asignaciones del arranque original (estado del navegador), ya sin efecto
  Object.defineProperty(V13, "precon", { configurable: true, get: precon, set: ignorar });
  Object.defineProperty(V13, "qxList", { configurable: true, get: qxList, set: ignorar });
  Object.defineProperty(V13, "nefroVac", { configurable: true, get: nefroVac, set: ignorar });

  /* ---------- registros nuevos ---------- */
  const listo = () => {
    if (!PX.book) {
      toast("El libro institucional aún no está cargado. Intente de nuevo en un momento.");
      return false;
    }
    pxEnsureSheets();
    return true;
  };
  const tocar = () => {
    cambios++;
  };
  const txt = (v) => (v == null ? "" : String(v).trim());

  window.v32Preconsulta = function (prog, pid, o) {
    if (!listo()) return;
    pxAdd("pre", "PRE-", {
      Fecha: o.fecha || pxToday(), Programa: prog, Paciente: pid, PAS: txt(o.pas), PAD: txt(o.pad), FC: txt(o.fc), FR: txt(o.fr), Temp: txt(o.temp),
      SatO2: txt(o.sat), Peso: txt(o.peso), Talla: txt(o.talla), Cintura: txt(o.cint), Glucometria: txt(o.glu), Auxiliar: txt(o.aux), Listo: "SI", Registrado: pxNow(),
    });
    tocar();
  };
  /** Marca de asistencia por disciplina y mes; resultado vacío = sin marca. */
  window.v32Asistencia = function (prog, pid, disc, mes, resultado) {
    if (!listo()) return;
    const fila = vivas("asi").find((r) => r.Programa === prog && r.Paciente === pid && r.Disciplina === disc && r.Mes === mes);
    if (fila) pxUpd("asi", fila, { Resultado: resultado || "" });
    else if (resultado) pxAdd("asi", "ASI-", { Programa: prog, Paciente: pid, Disciplina: disc, Mes: mes, Resultado: resultado, Registrado: pxNow() });
    tocar();
  };
  window.v32Procedimiento = function (o) {
    if (!listo()) return;
    pxAdd("qx", "QX-", {
      Fecha: o.fecha || pxToday(), Programa: o.prog, Paciente: o.pid, Procedimiento: txt(o.proc), Sitio: txt(o.sitio), Lote: txt(o.lote),
      Responsable: txt(o.med), SolicitudDesinfeccion: txt(o.ambId), Registrado: pxNow(),
    });
    tocar();
  };
  window.v32VacunaRenal = function (pid, o) {
    if (!listo()) return;
    const datos = { VHB: txt(o.vhb), AntiHBs: txt(o.ahbs), Influenza: txt(o.inf), NeumococoConjugada: txt(o.neuc), NeumococoPolisacarida: txt(o.neup), Covid: txt(o.cov) };
    const fila = vivas("vre").find((r) => r.Paciente === pid);
    if (fila) pxUpd("vre", fila, datos);
    else pxAdd("vre", "VRE-", Object.assign({ Programa: "nefro", Paciente: pid, Registrado: pxNow() }, datos));
    tocar();
  };

  /* ---------- soportes pre-SISCAC: una fila por programa y paciente (antes, la configuración del portal) ---------- */
  const leerSoportes = (r) => {
    try {
      return JSON.parse(r.Soportes || "{}") || {};
    } catch (e) {
      return {};
    }
  };
  v9GetSiscac = function (prog, pid) {
    const r = vivas("sis").find((x) => x.Programa === prog && x.Paciente === pid);
    return r ? leerSoportes(r) : {};
  };
  v9SetSiscac = function (prog, pid, obj) {
    if (!listo()) return;
    const r = vivas("sis").find((x) => x.Programa === prog && x.Paciente === pid);
    const s = JSON.stringify(obj || {});
    if (r) pxUpd("sis", r, { Soportes: s });
    else pxAdd("sis", "SIS-", { Programa: prog, Paciente: pid, Soportes: s, Registrado: pxNow() });
    tocar();
  };
})();
