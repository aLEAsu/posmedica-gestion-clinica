import { useEffect, useRef } from "react";
import { useSesion } from "../sesion";

/* Muestra un módulo que conserva la interfaz original del prototipo (public/modulos/<clave>/) dentro del portal.
   El módulo usa la misma sesión (mismo origen) y avisa por postMessage si la sesión terminó. */
export function ModuloOriginal({ clave, titulo }: { clave: string; titulo: string }) {
  const { actualizar } = useSesion();
  const ref = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const oir = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== ref.current?.contentWindow) return;
      if (e.data?.tipo === "posmedica:sesion-perdida") actualizar(null);
    };
    window.addEventListener("message", oir);
    return () => window.removeEventListener("message", oir);
  }, [actualizar]);

  return <iframe ref={ref} className="modulo-original" src={`/modulos/${clave}/index.html`} title={titulo} />;
}
