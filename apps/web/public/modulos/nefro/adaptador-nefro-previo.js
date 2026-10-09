/* Adaptador previo de la Ruta de Nefroprotección (se carga ANTES de su código).
   - Las llamadas de la Ruta a su API (/api/v1/nefro/pg/…) llevan la cabecera de la aplicación (protección CSRF) y la
     sesión; si la sesión terminó, se avisa al portal.
   - Cuando la Ruta pide los pacientes (inicio de su carga desde la base), se trae también la agenda guardada, para
     que esté lista cuando la Ruta arme su cohorte. */
(function () {
  "use strict";
  const original = window.fetch.bind(window);
  window.__agendaNefro = null;
  window.fetch = function (entrada, opciones) {
    const url = typeof entrada === "string" ? entrada : entrada && entrada.url;
    if (typeof url !== "string" || !url.startsWith("/api/")) return original(entrada, opciones);
    const o = Object.assign({}, opciones || {}, { credentials: "same-origin" });
    const cab = new Headers(o.headers || {});
    cab.set("X-Posmedica", "1");
    o.headers = cab;
    const aviso = (r) => {
      if (r.status === 401) window.POSMEDICA.avisarPortal("sesion-perdida");
      return r;
    };
    if (/\/api\/v1\/nefro\/pg\/paciente\?/.test(url) && (!o.method || o.method === "GET")) {
      const agenda = original("/api/v1/nefro/agenda", { credentials: "same-origin", headers: { Accept: "application/json" } })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);
      return Promise.all([original(entrada, o), agenda]).then(([r, a]) => {
        if (a) window.__agendaNefro = a;
        return aviso(r);
      });
    }
    return original(entrada, o).then(aviso);
  };
})();
