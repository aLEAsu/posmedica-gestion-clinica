import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Barra } from "./components/Barra";
import { Auditoria } from "./pages/Auditoria";
import { CambiarClave } from "./pages/CambiarClave";
import { Ingreso } from "./pages/Ingreso";
import { Panel } from "./pages/Panel";
import { Programa } from "./pages/Programa";
import { Respaldo } from "./pages/Respaldo";
import { Usuarios } from "./pages/Usuarios";
import { useSesion } from "./sesion";

/** Destino interno seguro para volver después de ingresar: solo rutas del portal («/programa/nefro»), nunca otro sitio
    («//otro.com», «https://…») ni la propia pantalla de ingreso. */
function destinoSeguro(v: string | null): string {
  if (!v || !v.startsWith("/") || v.startsWith("//") || v.startsWith("/\\") || v.startsWith("/ingreso")) return "/";
  return v;
}

export function App() {
  const { usuario, cargando, despertando, salidaVoluntaria } = useSesion();
  const loc = useLocation();
  if (cargando)
    return (
      <div className="cargando">
        {despertando ? "El servidor se está encendiendo (puede tardar hasta un minuto después de un rato sin uso)…" : "Conectando con el servidor…"}
      </div>
    );

  // Sin sesión la dirección es siempre /ingreso (también al salir o al volver atrás a una página del portal). Si la sesión
  // venció o se cerró desde otro equipo, se recuerda la página para volver a ella al ingresar; si el usuario pulsó «Salir», no.
  if (!usuario) {
    if (loc.pathname === "/ingreso") return <Ingreso />;
    const volver = loc.pathname !== "/" && !salidaVoluntaria ? `?volver=${encodeURIComponent(loc.pathname + loc.search)}` : "";
    return <Navigate to={`/ingreso${volver}`} replace />;
  }
  // Con sesión, /ingreso ya no aplica: se reemplaza en el historial (Atrás no vuelve al formulario de ingreso).
  if (loc.pathname === "/ingreso") return <Navigate to={destinoSeguro(new URLSearchParams(loc.search).get("volver"))} replace />;
  if (usuario.debeCambiarClave) return loc.pathname === "/clave" ? <CambiarClave /> : <Navigate to="/clave" replace />;
  const admin = usuario.rol === "ADMIN";

  return (
    <>
      <Barra />
      <Routes>
        <Route path="/" element={<Panel />} />
        <Route path="/programa/:clave" element={<Programa />} />
        <Route path="/clave" element={<CambiarClave />} />
        {admin && <Route path="/usuarios" element={<Usuarios />} />}
        {admin && <Route path="/auditoria" element={<Auditoria />} />}
        {admin && <Route path="/respaldo" element={<Respaldo />} />}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
