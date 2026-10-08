/* Catálogo de programas del portal. Fuente: PROGS del prototipo (_analisis/portal/portal_nucleo.js:22).
   "fase" indica en qué fase de la migración se construye el módulo; null = sin módulo en el alcance actual (D4). */

export type GrupoPrograma = "mis" | "apo" | "tra" | "ges";

export interface ProgramaDef {
  clave: string;
  nombre: string;
  grupo: GrupoPrograma;
  descripcion: string;
  /** Texto adicional para programas sin módulo (prototipo: campo nx). */
  mientras?: string;
  fase: number | null;
  /** Acceso abierto a todo usuario autenticado (prototipo: pxCan devuelve true para msg, docs y cal). */
  abierto?: boolean;
}

export const GRUPOS: Record<GrupoPrograma, string> = {
  mis: "Programas misionales",
  apo: "Servicios de apoyo",
  tra: "Programas transversales",
  ges: "Gestión",
};

export const PROGRAMAS: ProgramaDef[] = [
  { clave: "nefro", nombre: "Nefroprotección", grupo: "mis", fase: 5, descripcion: "Ruta de nefroprotección v7.2: valoración y grupo CAC, plan de intervenciones, agenda espejo, cohorte, vencidos e indicadores por EPS." },
  { clave: "hd", nombre: "Hemodiálisis", grupo: "mis", fase: 3, descripcion: "Turno con UF, valoración mensual, paraclínicos, vacunación VHB, acceso vascular, trasplante, calidad de diálisis e indicadores CAC." },
  { clave: "dp", nombre: "Diálisis peritoneal", grupo: "mis", fase: null, descripcion: "Censo DP, entrenamiento, adecuación (Kt/V semanal), peritonitis e infecciones del orificio, visitas domiciliarias.", mientras: "Mientras se construye: reporte aquí eventos de seguridad y los aportes mensuales a IAAS (peritonitis, IAAS-09)." },
  { clave: "vih", nombre: "VIH", grupo: "mis", fase: 4, descripcion: "Cohorte, agenda e inasistentes, laboratorios, TAR por grupo farmacológico, enfermería y carné de vacunación, historia clínica precargada, indicadores CAC y Nueva EPS, reportes y ruta GAO-PT-008." },
  { clave: "ce", nombre: "Consulta externa", grupo: "mis", fase: null, descripcion: "Agenda, oportunidad de la cita, inasistencia y remisiones por especialidad." },
  { clave: "qt", nombre: "Quimioterapia", grupo: "mis", fase: null, descripcion: "Agenda de infusión, esquemas, extravasación, reacciones infusionales y doble verificación de citostáticos." },
  { clave: "lab", nombre: "Laboratorio clínico", grupo: "apo", fase: 6, descripcion: "Solicitud mensual de los programas, muestras tomadas, carga de resultados y oportunidad. Hoy: hemodiálisis." },
  { clave: "far", nombre: "Servicio farmacéutico", grupo: "apo", fase: null, descripcion: "Dispensación por programa, pendientes, farmacovigilancia y control de antimicrobianos restringidos.", mientras: "Sin módulo por ahora: se definirá su alcance antes de construirlo. Mientras tanto, aportes a PROA y seguridad del paciente desde aquí." },
  { clave: "sp", nombre: "Seguridad del paciente", grupo: "tra", fase: 6, descripcion: "Reportes de todos los programas, análisis, planes de mejora y rondas de seguridad." },
  { clave: "iaas", nombre: "IAAS", grupo: "tra", fase: 6, descripcion: "Matriz GDC-MT-IAAS-001 alimentada por los programas y por las listas de chequeo (higiene de manos, técnica aséptica, desinfección)." },
  { clave: "proa", nombre: "PROA", grupo: "tra", fase: 6, descripcion: "Matriz GDC-MT-PROA-001: uso de antimicrobianos, auditoría prospectiva, restringidos y alertas de resistencia." },
  { clave: "cal", nombre: "Calendario de actividades", grupo: "ges", fase: 6, abierto: true, descripcion: "Reuniones, capacitaciones, comités, jornadas y visitas de la clínica, con responsable, invitados y confirmación de asistencia." },
  { clave: "prod", nombre: "Producción asistencial", grupo: "ges", fase: 6, descripcion: "Atenciones de todos los programas por mes y EPS; hemodiálisis se calcula del turno. Tarifas, valores y conciliación solo para el administrador." },
  { clave: "sogcs", nombre: "SOGCS · Comités", grupo: "ges", fase: 6, descripcion: "Comités institucionales según su frecuencia, actas, quórum y compromisos." },
  { clave: "docs", nombre: "Documentos y guías", grupo: "ges", fase: 6, abierto: true, descripcion: "Listado maestro de documentos de calidad y direccionamiento a guías de práctica clínica." },
  { clave: "msg", nombre: "Mensajes", grupo: "ges", fase: 6, abierto: true, descripcion: "Notificaciones formales entre usuarios y áreas, con acuse de lectura, plazo y respuesta." },
];

export const PROGRAMA_POR_CLAVE: Record<string, ProgramaDef> = Object.fromEntries(PROGRAMAS.map((p) => [p.clave, p]));
