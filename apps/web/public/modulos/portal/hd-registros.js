// Código propio del proyecto. Hemodiálisis · registros v3.2 guardados en el libro (y por él, en el servidor).
/* Las vistas del motor v3.0 trabajan sobre V30.siisActs, V30.oxiLog y V13.turnoCheck. Aquí esas listas dejan de ser
   la fuente: se arman desde las hojas del libro (hd-hojas.js) cada vez que el libro se indexa, y cada registro nuevo
   entra al libro con addRec/updRec, que el adaptador sincroniza con el servidor (permisos, auditoría, concurrencia).
   También se retira lo que en la web guardaría datos de pacientes en el navegador (copia local en IndexedDB y el estado
   v2.1 en localStorage): en esta versión el único almacén es el servidor (Ley 1581). */
(function () {
  "use strict";

  const asegurar = () => {
    if (!ST.book) return false;
    for (const k of ["sii", "oxi", "chk"]) if (!Array.isArray(ST.book[k])) ST.book[k] = [];
    return true;
  };
  const isoOVacio = (d) => (d instanceof Date ? iso(d) : d ? String(d).slice(0, 10) : "");

  /* ---------- hoja → lista de las vistas ---------- */
  function siiDeFila(r) {
    const p = IDX.pac.get(r.Paciente);
    return {
      id: r.ID, no: String(r.Codigo ?? ""), act: r.Actividad || "", tipo: r.Tipo || "", cat: r.Categoria || "", prot: r.Protocolo || "",
      fecha: isoOVacio(r.Fecha), pid: r.Paciente, pacNom: p ? nombre(p) : r.Paciente, eps: p ? p.EPS || "" : "",
      turno: r.Turno || "", silla: r.Puesto ?? "", sev: r.Severidad || "", nota: r.Nota || "", estado: r.Estado || "", usuario: r.Usuario || "",
    };
  }
  function oxiDeFila(r) {
    const p = IDX.pac.get(r.Paciente);
    return {
      id: r.ID, fecha: isoOVacio(r.Fecha), turno: r.Turno || "", silla: r.Puesto ?? "", pid: r.Paciente, pacNom: p ? nombre(p) : r.Paciente,
      eps: p ? p.EPS || "" : "", codSiis: r.CodigoSIIS || "", indicacion: r.Indicacion || "", disp: r.Dispositivo || "", flujo: r.FlujoLmin,
      hIni: "", hFin: "", min: r.Minutos, satPre: r.SatO2Pre, satPost: r.SatO2Post, cilindro: r.Cilindro || "", lote: r.Lote || "",
      vence: isoOVacio(r.VenceCilindro), psiIni: r.PsiInicial, psiFin: r.PsiFinal, litros: r.Litros, m3: r.M3, resp: r.Usuario || "",
    };
  }
  const claveChequeo = (r) => isoOVacio(r.Fecha) + "|" + (r.Turno || "");

  /** Rehace las listas de las vistas desde el libro. Los eventos SIIS que salen de los Dashboards los deriva HX.siis(). */
  function sincronizarVistas() {
    if (typeof V30 === "undefined" || !asegurar()) return;
    try {
      if (typeof HX !== "undefined" && HX.siis) HX.siis();
      else V30.siisActs = [];
    } catch (e) {
      V30.siisActs = [];
    }
    V30.siisActs = ST.book.sii.filter(live).map(siiDeFila).concat(V30.siisActs || []);
    V30.oxiLog = ST.book.oxi.filter(live).map(oxiDeFila);
    if (typeof V13 !== "undefined") {
      V13.turnoCheck = {};
      ST.book.chk.filter(live).forEach((r) => {
        V13.turnoCheck[claveChequeo(r)] = { id: r.ID, agua: r.Agua || "", desinf: r.Desinfeccion || "", cond: r.Conductividad || "", cloro: r.Cloro || "", resp: r.Usuario || "" };
      });
    }
  }
  const reindexV32 = reindex;
  reindex = function () {
    reindexV32();
    sincronizarVistas();
  };

  /* ---------- registros nuevos ---------- */
  window.v32GuardarSiis = function (rec) {
    if (!asegurar()) return;
    addRec("sii", "SII-", {
      Fecha: pdate(rec.fecha) || TODAY(), Paciente: rec.pid, Codigo: rec.no, Actividad: rec.act, Tipo: rec.tipo, Categoria: rec.cat,
      Protocolo: rec.prot, Turno: rec.turno || "", Puesto: num(rec.silla), Severidad: rec.sev, Nota: rec.nota, Estado: rec.estado, Origen: "Registro SIIS",
    });
    sincronizarVistas();
  };
  window.v32GuardarOxi = function (rec) {
    if (!asegurar()) return;
    addRec("oxi", "OXI-", {
      Fecha: pdate(rec.fecha) || TODAY(), Turno: rec.turno, Puesto: num(rec.silla), Paciente: rec.pid, CodigoSIIS: rec.codSiis, Indicacion: rec.indicacion,
      Dispositivo: rec.disp, FlujoLmin: rec.flujo, Minutos: rec.min, SatO2Pre: rec.satPre, SatO2Post: rec.satPost, Cilindro: rec.cilindro, Lote: rec.lote,
      VenceCilindro: pdate(rec.vence), PsiInicial: rec.psiIni, PsiFinal: rec.psiFin, Litros: rec.litros, M3: rec.m3,
    });
    sincronizarVistas();
  };
  /** Verificación pre-turno: una fila por fecha y turno; cada respuesta (Sí/No) actualiza su campo. */
  window.v32GuardarChequeo = function (clave, campo, valor) {
    if (!asegurar()) return;
    const [f, turno] = String(clave).split("|");
    const col = { agua: "Agua", desinf: "Desinfeccion", cond: "Conductividad", cloro: "Cloro" }[campo];
    if (!col) return;
    const fila = ST.book.chk.find((r) => live(r) && claveChequeo(r) === f + "|" + turno);
    if (fila) updRec("chk", fila, { [col]: valor });
    else addRec("chk", "CHK-", { Fecha: pdate(f) || TODAY(), Turno: turno, [col]: valor });
    sincronizarVistas();
    render();
    toast("Verificación pre-turno guardada (" + (campo === "agua" ? "calidad del agua" : "limpieza y desinfección") + ": " + valor + ").");
  };

  /* ---------- sin copias de datos de pacientes en el navegador ---------- */
  const SOLO_SERVIDOR = "En la aplicación web la información se guarda en el servidor; no se hacen copias locales en el navegador.";
  v9SaveLocal = async function (silent) {
    if (!silent) toast(SOLO_SERVIDOR);
  };
  v9RestoreLocal = async function () {
    toast(SOLO_SERVIDOR);
  };
  try {
    localStorage.removeItem("posmedica_v13_state");
    if (typeof indexedDB !== "undefined" && V9 && V9.dbName) indexedDB.deleteDatabase(V9.dbName);
  } catch (e) {
    /* almacenamiento bloqueado */
  }
  // El estado v2.1 (preconsulta, procedimientos, Talento humano) queda en memoria hasta tener sus hojas en el servidor.
  v13Save = function () {};

  /* ---------- acciones que antes iban en atributos onclick (la CSP no permite manejadores en línea) ---------- */
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-cerrar-dlg],[data-accion],[data-copiar]");
    if (!t) return;
    if (t.hasAttribute("data-cerrar-dlg")) setTimeout(() => closeDlg(), 0); // después de la acción propia del botón
    const a = t.getAttribute("data-accion");
    if (a === "exportBook") exportBook();
    else if (a === "imprimir") window.print();
    const c = t.getAttribute("data-copiar");
    if (c) {
      const el = document.getElementById(c);
      if (el && navigator.clipboard) navigator.clipboard.writeText(el.value || el.textContent || "").then(() => toast(t.getAttribute("data-copiar-aviso") || "Copiado."));
    }
  });
})();
