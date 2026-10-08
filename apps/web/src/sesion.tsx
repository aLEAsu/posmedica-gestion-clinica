import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { UsuarioSesion } from "@posmedica/shared";
import { api, ErrorApi, siPierdeSesion } from "./api";
import { useAviso } from "./components/Aviso";

interface Ctx {
  usuario: UsuarioSesion | null;
  cargando: boolean;
  /** El servidor no responde todavía (arranque en frío del plan gratuito). */
  despertando: boolean;
  ingresar: (usuario: string, clave: string) => Promise<UsuarioSesion>;
  salir: (motivo?: string) => Promise<void>;
  actualizar: (u: UsuarioSesion | null) => void;
}

const SesionCtx = createContext<Ctx | null>(null);

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [despertando, setDespertando] = useState(false);
  const aviso = useAviso();

  useEffect(() => {
    // En el plan gratuito de Render el backend se apaga tras 15 min sin uso y tarda ~1 min en encender:
    // mientras responda con error de servidor o no haya conexión, se reintenta hasta 2 minutos.
    let vivo = true;
    const inicio = Date.now();
    async function intentar() {
      try {
        const r = await api.get<{ usuario: UsuarioSesion }>("/auth/me");
        if (vivo) setUsuario(r.usuario);
      } catch (e) {
        const despertando = !(e instanceof ErrorApi) || e.status >= 500;
        if (vivo && despertando && Date.now() - inicio < 120_000) {
          setDespertando(true);
          setTimeout(intentar, 4000);
          return;
        }
        if (vivo) setUsuario(null);
      }
      if (vivo) {
        setDespertando(false);
        setCargando(false);
      }
    }
    intentar();
    return () => {
      vivo = false;
    };
  }, []);

  useEffect(() => {
    siPierdeSesion((e) => {
      if (e.codigo === "CAMBIO_CLAVE") {
        setUsuario((u) => (u ? { ...u, debeCambiarClave: true } : u));
        return;
      }
      setUsuario(null);
      aviso("Su sesión terminó por inactividad o desde otro equipo. Ingrese de nuevo.");
    });
  }, [aviso]);

  const ingresar = useCallback(async (u: string, clave: string) => {
    const r = await api.post<{ usuario: UsuarioSesion }>("/auth/login", { usuario: u, clave });
    setUsuario(r.usuario);
    return r.usuario;
  }, []);

  const salir = useCallback(
    async (motivo?: string) => {
      try {
        await api.post("/auth/logout");
      } finally {
        setUsuario(null);
        if (motivo) aviso(motivo);
      }
    },
    [aviso],
  );

  const valor = useMemo(() => ({ usuario, cargando, despertando, ingresar, salir, actualizar: setUsuario }), [usuario, cargando, despertando, ingresar, salir]);
  return <SesionCtx.Provider value={valor}>{children}</SesionCtx.Provider>;
}

export function useSesion() {
  const c = useContext(SesionCtx);
  if (!c) throw new Error("useSesion fuera de ProveedorSesion");
  return c;
}
