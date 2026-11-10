// Código propio del proyecto. Talento humano y bienestar (v2.1) guardado en el libro institucional, solo administrador.
/* En la v3.2 este módulo vivía en el navegador (localStorage), estaba abierto a todos los usuarios y arrancaba con
   personal ficticio (empleados del mes, turnos y formatos con nombres de personas). Decisión del 10 nov 2026: SOLO el
   administrador. Aquí sus cuatro listas pasan a hojas del libro institucional, que el servidor entrega y deja escribir
   solo al administrador, y el módulo arranca vacío (no se siembra a nadie). */
(function () {
  "use strict";
  const AUD = ["Usuario", "Registrado", "Anulado", "MotivoAnulacion"];
  /* lista del módulo → hoja: [clave PSH, nombre de hoja, prefijo de ID, campos del módulo → columnas] */
  const HOJAS = {
    emp: ["the", "THEmpleadosMes", "THE-", { mes: "Mes", nombre: "Nombre", cargo: "Cargo", area: "Area", valor: "Valor", motivo: "Motivo", votos: "Votos" }],
    turnos: ["tht", "THCuadroTurnos", "THT-", { colaborador: "Colaborador", cargo: "Cargo", servicio: "Servicio", lun: "Lun", mar: "Mar", mie: "Mie", jue: "Jue", vie: "Vie", sab: "Sab", obs: "Obs" }],
    formatos: ["thf", "THFormatos", "THF-", { codigo: "Codigo", tipo: "Tipo", colaborador: "Colaborador", area: "Area", fecha: "Fecha", detalle: "Detalle", estado: "Estado", aprobadoPor: "AprobadoPor" }],
    clima: ["thc", "THClimaLaboral", "THC-", { fecha: "Fecha", area: "Area", dimension: "Dimension", puntaje: "Puntaje", riesgo: "Riesgo", accion: "Accion", estado: "Estado" }],
  };
  for (const [, [k, nombre, , campos]] of Object.entries(HOJAS)) {
    PSH[k] = [nombre, ["ID", ...Object.values(campos), ...AUD]];
    if (!PKEYS.includes(k)) PKEYS.splice(PKEYS.indexOf("log"), 0, k);
  }

  const vivas = (k) => (PX.book && Array.isArray(PX.book[k]) ? PX.book[k].filter((r) => r.Anulado !== "SI") : []);
  let cambios = 0;
  const memos = {};
  function lista(nombreLista) {
    const [k, , , campos] = HOJAS[nombreLista];
    const arr = PX.book && PX.book[k];
    const llave = [arr, arr ? arr.length : 0, cambios];
    const m = memos[nombreLista];
    if (m && m.llave.every((x, i) => x === llave[i])) return m.valor;
    // Más reciente primero (como la v2.1, que agregaba al inicio).
    const valor = vivas(k)
      .slice()
      .reverse()
      .map((r) => {
        const o = { id: r.ID };
        for (const [c, col] of Object.entries(campos)) o[c] = c === "votos" || c === "puntaje" ? num(r[col]) : r[col];
        return o;
      });
    memos[nombreLista] = { llave, valor };
    return valor;
  }
  for (const nombreLista of Object.keys(HOJAS)) Object.defineProperty(V13.th, nombreLista, { configurable: true, get: () => lista(nombreLista), set: () => {} });

  /** Registra un elemento nuevo de una lista de Talento humano. */
  window.v32TH = function (nombreLista, o) {
    if (!PX.book) return toast("El libro institucional aún no está cargado.");
    if (!pxAdmin()) return toast("Talento humano es solo para el administrador.");
    pxEnsureSheets();
    const [k, , pre, campos] = HOJAS[nombreLista];
    const fila = { Registrado: pxNow() };
    for (const [c, col] of Object.entries(campos)) fila[col] = o[c] == null ? "" : String(o[c]);
    pxAdd(k, pre, fila);
    cambios++;
  };
  /** Suma un reconocimiento a un empleado del mes. */
  window.v32THVoto = function (id) {
    const r = vivas("the").find((x) => x.ID === id);
    if (!r || !pxAdmin()) return;
    pxUpd("the", r, { Votos: String((num(r.Votos) || 1) + 1) });
    cambios++;
  };
  // Sin personal ficticio: el módulo arranca vacío.
  v13SeedTH = function () {};
})();
