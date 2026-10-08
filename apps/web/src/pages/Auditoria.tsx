import { useEffect, useState } from "react";
import { api, ErrorApi } from "../api";

interface Fila {
  id: string;
  fecha: string;
  usuarioNombre: string | null;
  accion: string;
  entidad: string;
  registroId: string | null;
  programa: string | null;
  ip: string | null;
  antes: unknown;
  despues: unknown;
  detalle: string | null;
}
interface Resp {
  total: number;
  pagina: number;
  tamano: number;
  filas: Fila[];
  acciones: string[];
  entidades: string[];
}

const fh = (s: string) => new Date(s).toLocaleString("es-CO", { timeZone: "America/Bogota", dateStyle: "short", timeStyle: "medium" });
const js = (v: unknown) => (v == null ? "" : JSON.stringify(v, null, 1));

/* Consulta de la auditoría inmutable (solo administrador). */
export function Auditoria() {
  const [f, setF] = useState({ desde: "", hasta: "", accion: "", entidad: "", registroId: "" });
  const [pagina, setPagina] = useState(1);
  const [r, setR] = useState<Resp | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const q = new URLSearchParams({ pagina: String(pagina), tamano: "50" });
    Object.entries(f).forEach(([k, v]) => v && q.set(k, v));
    api.get<Resp>(`/auditoria?${q}`).then(setR).catch((e) => setError(e instanceof ErrorApi ? e.message : "No se pudo cargar la auditoría."));
  }, [f, pagina]);

  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => {
    setPagina(1);
    setF({ ...f, [k]: e.target.value });
  };
  const paginas = r ? Math.max(1, Math.ceil(r.total / r.tamano)) : 1;

  return (
    <div className="wrap pxwrap" style={{ display: "grid", gap: 14 }}>
      <div className="mhead">
        <div>
          <h2 className="mt">Auditoría</h2>
          <p className="note" style={{ margin: "3px 0 0" }}>
            Registro inmutable de ingresos, cambios, anulaciones, permisos, exportaciones y respaldos. Nadie puede editarlo ni borrarlo, tampoco el administrador.
          </p>
        </div>
      </div>
      <div className="panel filters">
        <label className="f">Desde<input type="date" value={f.desde} onChange={set("desde")} /></label>
        <label className="f">Hasta<input type="date" value={f.hasta} onChange={set("hasta")} /></label>
        <label className="f">
          Acción
          <select value={f.accion} onChange={set("accion")}>
            <option value="">Todas</option>
            {r?.acciones.map((a) => <option key={a}>{a}</option>)}
          </select>
        </label>
        <label className="f">
          Entidad
          <select value={f.entidad} onChange={set("entidad")}>
            <option value="">Todas</option>
            {r?.entidades.map((a) => <option key={a}>{a}</option>)}
          </select>
        </label>
        <label className="f">Registro (ID)<input type="text" value={f.registroId} onChange={set("registroId")} /></label>
      </div>
      {error && <div className="alert bad"><p>{error}</p></div>}
      {r && (
        <>
          <div className="panel tablebox" style={{ padding: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>Fecha y hora</th>
                  <th>Usuario</th>
                  <th>Acción</th>
                  <th>Entidad · registro</th>
                  <th>Detalle</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {r.filas.length === 0 && (
                  <tr><td colSpan={6} className="empty">Sin registros con estos filtros.</td></tr>
                )}
                {r.filas.map((x) => (
                  <tr key={x.id}>
                    <td className="mono" style={{ fontSize: 12.5, whiteSpace: "nowrap" }}>{fh(x.fecha)}</td>
                    <td style={{ fontSize: 13 }}>{x.usuarioNombre ?? "—"}</td>
                    <td><span className={"st " + (/FALLIDO|BLOQUEO|ANULA/.test(x.accion) ? "bad" : /RESPALDO|EXPORTA|PERMISOS|RESTABLECE/.test(x.accion) ? "warn" : "base")}>{x.accion}</span></td>
                    <td style={{ fontSize: 13 }}>
                      {x.entidad}
                      {x.registroId && <span className="sub mono">{x.registroId}</span>}
                    </td>
                    <td>
                      {x.detalle && <div style={{ fontSize: 13 }}>{x.detalle}</div>}
                      {(x.antes != null || x.despues != null) && (
                        <details className="hist">
                          <summary>Antes → después</summary>
                          <pre className="jsonmini">{js(x.antes)}</pre>
                          <pre className="jsonmini">→ {js(x.despues)}</pre>
                        </details>
                      )}
                    </td>
                    <td className="mono" style={{ fontSize: 12 }}>{x.ip ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="pag">
            <span className="note">{r.total.toLocaleString("es-CO")} registros</span>
            <button type="button" className="btn sm" disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)}>Anterior</button>
            <span className="mono">{pagina} / {paginas}</span>
            <button type="button" className="btn sm" disabled={pagina >= paginas} onClick={() => setPagina(pagina + 1)}>Siguiente</button>
          </div>
        </>
      )}
    </div>
  );
}
