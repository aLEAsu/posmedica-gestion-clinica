/* Roles DENTRO de los módulos de Consulta externa y Diálisis peritoneal (segunda capa de acceso, decisión V2).
   Son los catálogos CE_ROLES y DP_ROLES del prototipo (las pruebas de la API verifican que sean idénticos). El
   administrador los asigna junto con los permisos del programa en Usuarios → Programas y permisos; se guardan en las
   hojas RolesCE y RolesDP del libro de cada módulo. Un usuario sin fila queda en «Solo consulta». */

export const ROLES_CE: Record<string, string> = { coordinacion: "Coordinación", admisiones: "Admisiones", autorizaciones: "Autorizaciones", profesional: "Profesional", calidad: "Calidad", consulta: "Solo consulta" };
export const ROL_CE_SIN = "consulta";

export const ROLES_DP: Record<string, string> = {
  dir: "Dirección Médica", coord: "Coordinación de Unidad Renal", nefro: "Nefrología", med: "Médico autorizado", enf: "Enfermería profesional",
  aux: "Auxiliar de enfermería", multi: "Nutrición, psicología o trabajo social", lab: "Laboratorio", adm: "Administrativo y logística", cons: "Solo consulta o auditoría",
};
export const ROL_DP_SIN = "cons";

/** Qué hace cada rol (resumen de CE_PUEDE y DP_PERM del prototipo, para ayudar al administrador a elegir). */
export const AYUDA_ROLES_CE: Record<string, string> = {
  coordinacion: "Todo el módulo, incluida su administración (especialidades, profesionales, parámetros y roles).",
  admisiones: "Registra pacientes y solicitudes, abre agenda, asigna citas, bloquea cupos y gestiona autorizaciones.",
  autorizaciones: "Gestiona autorizaciones y el estado de las solicitudes. No registra solicitudes ni asigna citas.",
  profesional: "Fija la prioridad clínica de las solicitudes.",
  calidad: "Consulta y habilita modalidades de las especialidades.",
  consulta: "Solo consulta: no registra ni asigna.",
};
export const AYUDA_ROLES_DP: Record<string, string> = {
  dir: "Todo el módulo.",
  coord: "Pacientes, valoraciones, laboratorios, agenda, seguimiento, insumos, importación, aprobaciones y parámetros.",
  nefro: "Pacientes, valoraciones, prescripción, laboratorios, agenda y seguimiento.",
  med: "Valoraciones, laboratorios, agenda y seguimiento.",
  enf: "Pacientes, valoraciones, laboratorios, agenda, seguimiento e insumos.",
  aux: "Agenda, insumos y laboratorios.",
  multi: "Valoraciones y agenda.",
  lab: "Solo laboratorios (también desde el módulo Laboratorio).",
  adm: "Pacientes, agenda e insumos.",
  cons: "Solo consulta y exportación.",
};

/** Rol de un usuario en un módulo, como lo devuelve GET /usuarios (null = sin fila: «Solo consulta»). */
export interface RolesModulo {
  ce: { rol: string; veReservadas: boolean } | null;
  dp: { rol: string; activo: boolean } | null;
}
