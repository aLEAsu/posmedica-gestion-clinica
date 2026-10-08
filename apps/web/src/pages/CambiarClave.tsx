import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import type { UsuarioSesion } from "@posmedica/shared";
import { api, ErrorApi } from "../api";
import { useAviso } from "../components/Aviso";
import { useSesion } from "../sesion";

export function CambiarClave() {
  const { usuario, actualizar, salir } = useSesion();
  const aviso = useAviso();
  const nav = useNavigate();
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [repetir, setRepetir] = useState("");
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const obligatorio = !!usuario?.debeCambiarClave;

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (nueva !== repetir) return setMsg("La clave nueva y su confirmación no coinciden.");
    setOcupado(true);
    setMsg("");
    try {
      const r = await api.post<{ usuario: UsuarioSesion }>("/auth/cambiar-clave", { claveActual: actual, claveNueva: nueva });
      actualizar(r.usuario);
      aviso("Clave actualizada. Las demás sesiones abiertas se cerraron.");
      nav("/");
    } catch (err) {
      setMsg(err instanceof ErrorApi ? err.message : "No se pudo cambiar la clave.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="wrap pxwrap">
      <div className="panel" style={{ maxWidth: 520, margin: "24px auto", borderTop: "3px solid var(--accent)" }}>
        <h2 className="mt">{obligatorio ? "Cambie su clave para continuar" : "Cambiar mi clave"}</h2>
        <p className="note">
          {obligatorio ? "Su clave es temporal (asignada por el administrador o la inicial del sistema). " : ""}
          Use al menos 10 caracteres combinando letras y números, sin incluir su nombre de usuario.
        </p>
        <form className="form1" onSubmit={enviar}>
          <label className="f">
            Clave actual
            <input type="password" autoComplete="current-password" value={actual} onChange={(e) => setActual(e.target.value)} required />
          </label>
          <label className="f">
            Clave nueva
            <input type="password" autoComplete="new-password" value={nueva} onChange={(e) => setNueva(e.target.value)} required minLength={10} />
          </label>
          <label className="f">
            Repita la clave nueva
            <input type="password" autoComplete="new-password" value={repetir} onChange={(e) => setRepetir(e.target.value)} required minLength={10} />
          </label>
          <p className="note" role="alert" style={{ color: "var(--bad)" }}>
            {msg}
          </p>
          <div className="copyrow">
            <button type="submit" className="btn primary" disabled={ocupado}>
              Guardar clave nueva
            </button>
            {obligatorio ? (
              <button type="button" className="btn" onClick={() => salir()}>
                Salir
              </button>
            ) : (
              <button type="button" className="btn" onClick={() => nav(-1)}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
