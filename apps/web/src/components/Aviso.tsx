import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

/* Equivalente del toast() del prototipo: un aviso corto que desaparece a los 5 segundos. */
const AvisoCtx = createContext<(t: string) => void>(() => {});

export function ProveedorAviso({ children }: { children: ReactNode }) {
  const [texto, setTexto] = useState<string | null>(null);
  const t = useRef<number | undefined>(undefined);
  const mostrar = useCallback((s: string) => {
    setTexto(s);
    window.clearTimeout(t.current);
    t.current = window.setTimeout(() => setTexto(null), 5000);
  }, []);
  return (
    <AvisoCtx.Provider value={mostrar}>
      {children}
      <div className="toast" role="status" hidden={!texto}>
        {texto}
      </div>
    </AvisoCtx.Provider>
  );
}

export const useAviso = () => useContext(AvisoCtx);
