/* Contratos y tecnologías v1.1 · adaptador. Decisión del 10 nov 2026: módulo SOLO para el administrador.
   La matriz contractual (tecnologías por contrato, documentos con sus firmantes, paquetes) no viaja en el código público:
   la entrega la API (/api/v1/contratos/matriz) solo al administrador. Este adaptador verifica la sesión, pide la matriz y
   solo entonces carga el código del módulo (ct11.js), que la usa al arrancar.
   Si aún no hay matriz en el servidor, el administrador la carga una vez: desde un .json con la matriz o directamente desde
   el archivo .html del prototipo (se extrae aquí, en su navegador, y solo se envía la matriz). */
(function () {
  "use strict";
  const { pedir } = window.POSMEDICA;
  const panel = (html) => {
    const d = document.createElement("div");
    d.style.cssText = "max-width:760px;margin:24px auto;padding:18px 20px;border:1px solid #ccd;border-radius:12px;font:15px/1.55 system-ui,sans-serif";
    d.innerHTML = html;
    document.body.prepend(d);
    return d;
  };
  const cargarModulo = (matriz) => {
    window.__CT_DATA = matriz;
    const s = document.createElement("script");
    s.src = "ct11.js";
    document.body.appendChild(s);
  };
  /** Extrae la matriz de un archivo: .json (la matriz) o .html del prototipo (constante DATA del módulo embebido). */
  function extraer(texto) {
    const t = texto.trim();
    if (t.startsWith("{")) return JSON.parse(t);
    const ln = t.split("\n").find((l) => l.startsWith("const CT11_HTML="));
    if (!ln) throw new Error("El archivo no trae el módulo de Contratos y tecnologías.");
    const doc = JSON.parse(ln.slice("const CT11_HTML=".length).replace(/;\s*$/, ""));
    const m = /\nconst DATA=(.*?);\n/.exec(doc);
    if (!m) throw new Error("No se encontró la matriz dentro del módulo.");
    return JSON.parse(m[1]);
  }

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-imprimir]")) window.print();
  });

  (async () => {
    let u;
    try {
      u = (await pedir("GET", "/auth/me")).usuario;
    } catch (e) {
      panel("<p>No se pudo verificar la sesión.</p>");
      return;
    }
    if (!u || u.rol !== "ADMIN") {
      panel("<p><strong>Contratos y tecnologías</strong> es solo para el administrador.</p>");
      return;
    }
    let r;
    try {
      r = await pedir("GET", "/contratos/matriz");
    } catch (e) {
      panel("<p>No se pudo cargar la matriz contractual: " + e.message + "</p>");
      return;
    }
    if (r.matriz) return cargarModulo(r.matriz);
    const d = panel(
      "<p><strong>Aún no hay matriz contractual cargada.</strong></p>" +
        "<p>Cárguela una sola vez: un archivo <code>.json</code> con la matriz o el archivo <code>.html</code> del prototipo (la matriz se extrae en este navegador y solo ella se envía al servidor).</p>" +
        '<p><input type="file" id="ct-archivo" accept=".json,.html,.htm"></p><p id="ct-estado" role="status"></p>',
    );
    d.querySelector("#ct-archivo").onchange = (e) => {
      const f = e.target.files[0];
      if (!f) return;
      const est = d.querySelector("#ct-estado");
      est.textContent = "Leyendo " + f.name + "…";
      const rd = new FileReader();
      rd.onload = async () => {
        try {
          const matriz = extraer(String(rd.result));
          est.textContent = "Enviando " + (matriz.I || []).length + " tecnologías…";
          await pedir("POST", "/contratos/matriz", { matriz, fuente: f.name });
          d.remove();
          cargarModulo(matriz);
        } catch (x) {
          est.textContent = x.message || "No se pudo leer el archivo.";
        }
      };
      rd.readAsText(f);
    };
  })();
})();
