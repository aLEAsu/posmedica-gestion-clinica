import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";

/* Equivalente de openDlg() del prototipo. onAceptar devuelve un mensaje de error para mostrar, o nada si terminó bien. */
export function Dialogo(props: {
  titulo: string;
  textoAceptar?: string;
  /** Devuelve: nada = cerrar; texto = mostrar ese error; null = dejar abierto sin mensaje (el padre cambia el contenido). */
  onAceptar?: () => Promise<string | void | null> | string | void | null;
  onCerrar: () => void;
  children: ReactNode;
  soloCerrar?: boolean;
}) {
  const [msg, setMsg] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("input,select,textarea,button")?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && props.onCerrar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!props.onAceptar) return props.onCerrar();
    setOcupado(true);
    setMsg("");
    try {
      const m = await props.onAceptar();
      if (m === null) return;
      if (m) setMsg(m);
      else props.onCerrar();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "No se pudo completar la acción.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="ovl">
      <form ref={ref} className="dlg" role="dialog" aria-modal="true" aria-labelledby="dlgt" onSubmit={enviar}>
        <h3 id="dlgt">{props.titulo}</h3>
        {props.children}
        <p className="note" role="alert" style={{ color: "var(--bad)" }}>
          {msg}
        </p>
        <div className="copyrow">
          {!props.soloCerrar && (
            <button type="submit" className="btn primary" disabled={ocupado}>
              {ocupado ? "Guardando…" : (props.textoAceptar ?? "Guardar")}
            </button>
          )}
          <button type="button" className="btn" onClick={props.onCerrar}>
            {props.soloCerrar ? "Cerrar" : "Cancelar"}
          </button>
        </div>
      </form>
    </div>
  );
}
