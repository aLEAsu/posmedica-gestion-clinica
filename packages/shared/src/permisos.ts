/* Modelo de acceso aprobado (decisiones D2 y D3, 8 oct 2026):
   - ADMIN: acceso total, gestiona usuarios y es el único que ve facturación (tarifas, valores, conciliación).
   - MEDICO (rol estándar): solo los programas y acciones que el administrador le asigne. Nunca ve facturación. */

export type Rol = "ADMIN" | "MEDICO";

export const ROLES: Record<Rol, string> = {
  ADMIN: "Administrador",
  MEDICO: "Médico (estándar)",
};

export type Accion = "ver" | "registrar" | "anular" | "exportar";

export const ACCIONES: { clave: Accion; etiqueta: string; ayuda: string }[] = [
  { clave: "ver", etiqueta: "Ver", ayuda: "Consultar pacientes, registros, indicadores y alertas del programa." },
  { clave: "registrar", etiqueta: "Registrar", ayuda: "Crear y editar registros clínicos y administrativos." },
  { clave: "anular", etiqueta: "Anular", ayuda: "Anular registros con motivo (borrado lógico; nunca se elimina)." },
  { clave: "exportar", etiqueta: "Exportar", ayuda: "Descargar reportes, matrices CAC y archivos Excel del programa." },
];

export interface PermisoPrograma {
  programa: string;
  ver: boolean;
  registrar: boolean;
  anular: boolean;
  exportar: boolean;
}

export interface UsuarioSesion {
  id: string;
  usuario: string;
  nombre: string;
  cargo: string;
  area: string | null;
  rol: Rol;
  debeCambiarClave: boolean;
  permisos: PermisoPrograma[];
}

/** Regla única de autorización, usada igual en backend (fuente de verdad) y frontend (solo para mostrar u ocultar). */
export function puede(u: Pick<UsuarioSesion, "rol" | "permisos"> | null | undefined, programa: string, accion: Accion = "ver"): boolean {
  if (!u) return false;
  if (u.rol === "ADMIN") return true;
  const p = u.permisos.find((x) => x.programa === programa);
  if (!p) return false;
  // Registrar, anular o exportar sin poder ver no tiene sentido: exigimos ver.
  return p.ver && p[accion];
}

export function puedeFacturacion(u: Pick<UsuarioSesion, "rol"> | null | undefined): boolean {
  return u?.rol === "ADMIN";
}
