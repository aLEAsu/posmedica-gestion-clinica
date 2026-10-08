import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { UsuarioSesion } from "@posmedica/shared";
import { api, siPierdeSesion } from "./api";
import { useAviso } from "./components/Aviso";

interface Ctx {
  usuario: UsuarioSesion | null;
  cargando: boolean;
  ingresar: (usuario: string, clave: string) => Promise<UsuarioSesion>;
  salir: (motivo?: string) => Promise<void>;
  actualizar: (u: UsuarioSesion | null) => void;
}

const SesionCtx = createContext<Ctx | null>(null);

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [cargando, setCargando] = useState(true);
  const aviso = useAviso();

  useEffect(() => {
    api
      .get<{ usuario: UsuarioSesion }>("/auth/me")
      .then((r) => setUsuario(r.usuario))
      .catch(() => setUsuario(null))
      .finally(() => setCargando(false));
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

  const valor = useMemo(() => ({ usuario, cargando, ingresar, salir, actualizar: setUsuario }), [usuario, cargando, ingresar, salir]);
  return <SesionCtx.Provider value={valor}>{children}</SesionCtx.Provider>;
}

export function useSesion() {
  const c = useContext(SesionCtx);
  if (!c) throw new Error("useSesion fuera de ProveedorSesion");
  return c;
}
