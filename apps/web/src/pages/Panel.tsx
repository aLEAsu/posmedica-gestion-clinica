import { useNavigate } from "react-router-dom";
import { GRUPOS, PROGRAMAS, puede, type GrupoPrograma, type ProgramaDef } from "@posmedica/shared";
import { useAviso } from "../components/Aviso";
import { Icono } from "../components/Barra";
import { useSesion } from "../sesion";

/* Panel de programas (pxPanel del prototipo). Los indicadores rápidos de cada tarjeta (pxKPI) llegan con cada módulo. */
export function Panel() {
  const { usuario } = useSesion();
  const nav = useNavigate();
  const aviso = useAviso();
  if (!usuario) return null;

  const acceso = (p: ProgramaDef) => !!p.abierto || puede(usuario, p.clave);
  const mes = new Date().toLocaleDateString("es-CO", { month: "long", year: "numeric", timeZone: "America/Bogota" });

  return (
    <div className="wrap pxwrap" style={{ display: "grid", gap: 18 }}>
      <div className="mhead">
        <div>
          <p className="eyebrow">{usuario.area ?? usuario.cargo}</p>
          <h2 className="mt">Panel de programas</h2>
          <p className="note" style={{ margin: "3px 0 0" }}>
            {mes.charAt(0).toUpperCase() + mes.slice(1)}. Los programas sin acceso para su usuario aparecen atenuados.
          </p>
        </div>
      </div>

      {usuario.rol === "MEDICO" && usuario.permisos.length === 0 && (
        <div className="alert warn">
          <p>Su usuario todavía no tiene programas asignados. Pida al administrador que le asigne los módulos y permisos de su cargo.</p>
        </div>
      )}

      {(Object.keys(GRUPOS) as GrupoPrograma[]).map((g) => (
        <section className="pxgroup" key={g}>
          <h3>{GRUPOS[g]}</h3>
          <div className="pxcards">
            {PROGRAMAS.filter((p) => p.grupo === g).map((p) => {
              const ok = acceso(p);
              return (
                <button
                  key={p.clave}
                  type="button"
                  className={"pxcard" + (ok ? "" : " off")}
                  aria-disabled={!ok}
                  onClick={() => (ok ? nav(`/programa/${p.clave}`) : aviso(`Su usuario no tiene acceso a ${p.nombre}. Pídalo al administrador.`))}
                >
                  <span className="pxci">
                    <Icono clave={p.clave} />
                  </span>
                  <span className="pxct">
                    <b>{p.nombre}</b>
                  </span>
                  <span className="pxcd">{p.descripcion}</span>
                  <span className="pxck">{p.fase == null ? <span className="tag">en desarrollo</span> : <span className="tag">en migración · fase {p.fase}</span>}</span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
