/* Adaptador común de los módulos con la interfaz original del prototipo (se cargan en un iframe del portal).
   Ofrece las llamadas a la API con la sesión del portal y avisa al portal cuando la sesión termina. */
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

  window.POSMEDICA = { pedir, avisarPortal };
})();
