/* Diálisis peritoneal v1.1 · adaptador PREVIO (corre antes del código del módulo).
   El módulo arranca leyendo su estado del navegador (localStorage «dp_unop_v1»). En la aplicación web el estado vive en
   el servidor: se borra cualquier copia local para que arranque vacío y el adaptador posterior lo llene desde la base.
   También hace lo que el portal inyectaba en el iframe: el tema lo gobierna el portal (se oculta el selector propio). */
(function () {
  "use strict";
  try {
    localStorage.removeItem("dp_unop_v1");
  } catch (e) {
    /* almacenamiento bloqueado */
  }
  window.SIGC_EMBED = window.parent !== window;
  document.head.insertAdjacentHTML("beforeend", '<style id="v22-embed">.themesw{display:none!important}</style>');
})();
