import { useState, type FormEvent } from "react";
import { ErrorApi } from "../api";
import { useSesion } from "../sesion";

/* Portada e ingreso (pxLogin del prototipo), sin la demostración ni la carga de libros: ahora hay servidor. */
export function Ingreso() {
  const { ingresar } = useSesion();
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!usuario.trim() || !clave) {
      setMsg("Escriba usuario y clave.");
      return;
    }
    setOcupado(true);
    setMsg("Verificando…");
    try {
      await ingresar(usuario.trim(), clave);
    } catch (err) {
      setMsg(err instanceof ErrorApi ? err.message : "No hay conexión con el servidor.");
      setClave("");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="wrap pxwrap">
      <section className="pxcover">
        <div className="pxcover-l">
          <img src="/logo-posmedica.jpg" alt="UNO-P Unidad Oncológica del Putumayo" className="pxlogo-big" />
          <p className="eyebrow">POSMÉDICA GROUP S.A.S. · UNO-P · Mocoa, Putumayo</p>
          <h1 className="pxt">Sistema de gestión clínica</h1>
          <p className="pxlead">
            Un solo ingreso para los programas misionales, los servicios de apoyo, los programas transversales de seguridad del paciente, IAAS y PROA, los comités del SOGCS y los documentos de calidad.
          </p>
          <p className="privacy">
            Datos de salud sensibles (Ley 1581 de 2012 y Resolución 1995 de 1999). El acceso queda registrado. Use solo su propio usuario y no comparta su clave.
          </p>
        </div>
        <div className="pxcover-r panel">
          <h3>Ingresar</h3>
          <form className="form1" onSubmit={enviar} noValidate>
            <label className="f">
              Usuario
              <input type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} value={usuario} onChange={(e) => setUsuario(e.target.value)} />
            </label>
            <label className="f">
              Clave
              <input type="password" autoComplete="current-password" value={clave} onChange={(e) => setClave(e.target.value)} />
            </label>
            <p className="note" role="alert" style={{ color: msg === "Verificando…" ? "var(--muted)" : "var(--bad)" }}>
              {msg}
            </p>
            <button type="submit" className="btn primary" disabled={ocupado}>
              Ingresar
            </button>
          </form>
          <p className="note">¿Olvidó su clave o está bloqueado? Pida al administrador del sistema que la restablezca.</p>
        </div>
      </section>
    </div>
  );
}
