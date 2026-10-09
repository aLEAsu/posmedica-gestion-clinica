import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSesion } from "../sesion";

/* Muestra una página que conserva la interfaz original del prototipo (public/modulos/<pagina>/) dentro del portal.
   - La página usa la misma sesión (mismo origen) y avisa por postMessage si la sesión terminó o si pide abrir otro
     programa.
   - Las vistas del portal del prototipo (VIH y módulos transversales) comparten un solo iframe: al cambiar de vista se
     le avisa por mensaje en lugar de recargarlo. */
export function ModuloOriginal({ pagina, vista, titulo }: { pagina: string; vista: string; titulo: string }) {
  const { usuario, actualizar } = useSesion();
  const navegar = useNavigate();
  const ref = useRef<HTMLIFrameElement>(null);
  const src = useRef(`/modulos/${pagina}/index.html#${encodeURIComponent(vista)}`);

  // La Ruta de Nefroprotección toma de aquí el nombre de quien registra en la agenda.
  if (usuario) {
    try {
      localStorage.setItem("nefro_usuario", `${usuario.nombre} · ${usuario.cargo}`);
    } catch {
      /* almacenamiento no disponible */
    }
  }

  useEffect(() => {
    const oir = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== ref.current?.contentWindow) return;
      if (e.data?.tipo === "posmedica:sesion-perdida") actualizar(null);
      // El módulo pide abrir otro programa, el panel o Usuarios (solo rutas internas del portal).
      if (e.data?.tipo === "posmedica:navegar" && typeof e.data.ruta === "string" && /^\/((programa\/[a-z]+)|usuarios)?$/.test(e.data.ruta)) {
        if (e.data.ruta !== window.location.pathname) navegar(e.data.ruta);
      }
    };
    window.addEventListener("message", oir);
    return () => window.removeEventListener("message", oir);
  }, [actualizar, navegar]);

  useEffect(() => {
    ref.current?.contentWindow?.postMessage({ tipo: "posmedica:vista", vista }, window.location.origin);
  }, [vista]);

  return <iframe ref={ref} className="modulo-original" src={src.current} title={titulo} />;
}
