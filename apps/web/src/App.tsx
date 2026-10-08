import { Navigate, Route, Routes } from "react-router-dom";
import { Barra } from "./components/Barra";
import { Auditoria } from "./pages/Auditoria";
import { CambiarClave } from "./pages/CambiarClave";
import { Ingreso } from "./pages/Ingreso";
import { Panel } from "./pages/Panel";
import { Programa } from "./pages/Programa";
import { Respaldo } from "./pages/Respaldo";
import { Usuarios } from "./pages/Usuarios";
import { useSesion } from "./sesion";

export function App() {
  const { usuario, cargando, despertando } = useSesion();
  if (cargando)
    return (
      <div className="cargando">
        {despertando ? "El servidor se está encendiendo (puede tardar hasta un minuto después de un rato sin uso)…" : "Conectando con el servidor…"}
      </div>
    );
  if (!usuario) return <Ingreso />;
  if (usuario.debeCambiarClave) return <CambiarClave />;
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
