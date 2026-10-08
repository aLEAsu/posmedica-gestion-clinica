import { Link, useParams } from "react-router-dom";
import { ACCIONES, PROGRAMA_POR_CLAVE, puede } from "@posmedica/shared";
import { Icono } from "../components/Barra";
import { ModuloOriginal } from "../components/ModuloOriginal";
import { useSesion } from "../sesion";

/* Página de cada programa. En la Fase 1 muestra en qué fase se construye y los permisos del usuario;
   cada fase reemplaza esta vista por el módulo real. */
export function Programa() {
  const { clave = "" } = useParams();
  const { usuario } = useSesion();
  const p = PROGRAMA_POR_CLAVE[clave];
  if (!p) return <div className="wrap pxwrap"><div className="panel empty">Programa no encontrado.</div></div>;
  if (!p.abierto && !puede(usuario, clave)) {
    return (
      <div className="wrap pxwrap">
        <div className="alert warn"><p>Su usuario no tiene acceso a {p.nombre}. <Link className="lnk" to="/">Volver al panel</Link></p></div>
      </div>
    );
  }

  if (p.migrado) return <ModuloOriginal key={clave} clave={clave} titulo={p.nombre} />;

  return (
    <div className="wrap pxwrap" style={{ display: "grid", gap: 16 }}>
      <div className="mhead">
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span className="pxci"><Icono clave={p.clave} /></span>
          <div>
            <h2 className="mt">{p.nombre}</h2>
            <p className="note" style={{ margin: "3px 0 0" }}>{p.descripcion}</p>
          </div>
        </div>
      </div>
      <div className="panel" style={{ display: "grid", gap: 8 }}>
        {p.fase == null ? (
          <>
            <h3>Programa sin módulo en el alcance actual</h3>
            <p>{p.mientras ?? "Este programa se definirá y construirá después de los módulos misionales."}</p>
          </>
        ) : (
          <>
            <h3>Módulo en migración · fase {p.fase}</h3>
            <p>Este módulo se está trasladando desde el prototipo a la versión con base de datos. Estará disponible al terminar la fase {p.fase} del plan.</p>
          </>
        )}
        {usuario && !p.abierto && (
          <p className="note">
            Sus permisos aquí:{" "}
            {usuario.rol === "ADMIN" ? "todos (administrador)." : ACCIONES.filter((a) => puede(usuario, clave, a.clave)).map((a) => a.etiqueta.toLowerCase()).join(", ") + "."}
          </p>
        )}
      </div>
    </div>
  );
}
