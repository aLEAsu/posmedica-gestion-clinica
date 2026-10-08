import { Link, useLocation, useNavigate } from "react-router-dom";
import { PROGRAMA_POR_CLAVE } from "@posmedica/shared";
import { useSesion } from "../sesion";
import { ICONOS } from "./iconos";

export function Icono({ clave }: { clave: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONOS[clave] ?? "" }} />
  );
}

const TITULOS: Record<string, string> = { usuarios: "Usuarios", auditoria: "Auditoría", respaldo: "Respaldo de la información", clave: "Cambiar clave" };

/* Barra superior del portal (pxBar del prototipo). */
export function Barra() {
  const { usuario, salir } = useSesion();
  const loc = useLocation();
  const nav = useNavigate();
  if (!usuario) return null;
  const seg = loc.pathname.split("/").filter(Boolean);
  const actual = seg[0] === "programa" ? PROGRAMA_POR_CLAVE[seg[1]]?.nombre : TITULOS[seg[0]];
  const enPanel = seg.length === 0;
  const admin = usuario.rol === "ADMIN";

  return (
    <div className="pxbar">
      <div className="pxbar-in">
        {!enPanel && (
          <button type="button" className="btn pxback" onClick={() => (window.history.length > 1 ? nav(-1) : nav("/"))} aria-label="Volver a la vista anterior">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Atrás
          </button>
        )}
        <Link to="/" className="pxhome" aria-label="Ir al panel" title="Ir al panel de programas">
          <img src="/logo-posmedica.jpg" alt="" />
          <span>
            <b>POSMÉDICA</b>
            <small>Gestión clínica</small>
          </span>
        </Link>
        {actual && (
          <span className="crumb">
            <Link className="lnk" to="/">
              Panel
            </Link>{" "}
            › <b>{actual}</b>
          </span>
        )}
        <div className="pxbar-r">
          {admin && (
            <>
              <Link className="btn sm" to="/usuarios">
                Usuarios
              </Link>
              <Link className="btn sm" to="/auditoria">
                Auditoría
              </Link>
              <Link className="btn sm" to="/respaldo">
                Respaldo
              </Link>
            </>
          )}
          <span className="who">
            <b>{usuario.nombre}</b>
            <small>
              {usuario.cargo}
              {admin ? " · administrador" : ""}
            </small>
          </span>
          <Link className="btn sm" to="/clave">
            Mi clave
          </Link>
          <button type="button" className="btn sm" onClick={() => salir()}>
            Salir
          </button>
        </div>
      </div>
    </div>
  );
}
