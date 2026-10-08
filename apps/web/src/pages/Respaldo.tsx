import { useState } from "react";
import { descargar, ErrorApi } from "../api";
import { useAviso } from "../components/Aviso";

/* Descarga completa de la información para conservarla en local o en físico (respuesta a P6). */
export function Respaldo() {
  const aviso = useAviso();
  const [ocupado, setOcupado] = useState<"" | "excel" | "json">("");

  async function bajar(tipo: "excel" | "json") {
    setOcupado(tipo);
    try {
      const n = await descargar(`/respaldo/${tipo}`, `POSMEDICA_respaldo.${tipo === "excel" ? "xlsx" : "json"}`);
      aviso(`Respaldo descargado: ${n}`);
    } catch (e) {
      aviso(e instanceof ErrorApi ? e.message : "No se pudo generar el respaldo.");
    } finally {
      setOcupado("");
    }
  }

  return (
    <div className="wrap pxwrap" style={{ display: "grid", gap: 14, maxWidth: 900 }}>
      <div className="mhead">
        <div>
          <h2 className="mt">Respaldo de la información</h2>
          <p className="note" style={{ margin: "3px 0 0" }}>Descargue toda la información del sistema para conservarla también en local o en físico.</p>
        </div>
      </div>
      <div className="alert warn">
        <p>
          <strong>El archivo contiene datos de salud sensibles</strong> (Ley 1581 de 2012). Guárdelo en un equipo o medio cifrado de la institución, con acceso restringido, y no lo envíe por correo ni mensajería. Cada descarga queda registrada en la auditoría.
        </p>
      </div>
      <div className="grid2">
        <div className="panel" style={{ display: "grid", gap: 8, alignContent: "start" }}>
          <h3>Excel (.xlsx)</h3>
          <p className="note">Una hoja por tabla y una hoja LEAME con el resumen. Para consulta, impresión y archivo físico.</p>
          <button type="button" className="btn primary" disabled={!!ocupado} onClick={() => bajar("excel")}>
            {ocupado === "excel" ? "Generando…" : "Descargar respaldo en Excel"}
          </button>
        </div>
        <div className="panel" style={{ display: "grid", gap: 8, alignContent: "start" }}>
          <h3>JSON</h3>
          <p className="note">Copia exacta de todos los campos, sin límites de tamaño por celda. Sirve para restaurar o migrar la información.</p>
          <button type="button" className="btn" disabled={!!ocupado} onClick={() => bajar("json")}>
            {ocupado === "json" ? "Generando…" : "Descargar respaldo en JSON"}
          </button>
        </div>
      </div>
      <p className="note">
        Además de estas descargas, la base de datos en Render tiene copias de seguridad automáticas del proveedor. Las claves de los usuarios y los tokens de sesión nunca se incluyen en el respaldo.
      </p>
    </div>
  );
}
