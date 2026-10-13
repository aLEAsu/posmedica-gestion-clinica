/* Catálogo de programas del portal. Fuente: PROGS del prototipo (descripciones de la versión 0.8).
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
  /** Módulo ya migrado y en uso (muestra la interfaz original del prototipo conectada a la base de datos). */
  migrado?: boolean;
  /** Acceso abierto a todo usuario autenticado (prototipo: pxCan devuelve true para msg, docs y cal). */
  abierto?: boolean;
  /** Solo para administradores: no se asigna a otros usuarios (decisión V4: Tablero gerencial). */
  soloAdmin?: boolean;
}

export const GRUPOS: Record<GrupoPrograma, string> = {
  mis: "Programas misionales",
  apo: "Servicios de apoyo",
  tra: "Programas transversales",
  ges: "Gestión",
};

export const PROGRAMAS: ProgramaDef[] = [
  { clave: "nefro", migrado: true, nombre: "Nefroprotección", grupo: "mis", fase: 5, descripcion: "Ruta v8: valoración con RCV y TFG, pacientes por EPS con calendario contractual, agendas, cohortes (caracterización, riesgo y gestión del mes y del próximo), 47 indicadores CAC, auditoría GPC y nominal por EPS." },
  { clave: "hd", nombre: "Hemodiálisis", grupo: "mis", fase: 3, migrado: true, descripcion: "Turno con UF, valoración mensual, paraclínicos, vacunación VHB, acceso vascular, trasplante, calidad de diálisis e indicadores CAC." },
  { clave: "dp", migrado: true, nombre: "Diálisis peritoneal", grupo: "mis", fase: 8, descripcion: "Registro maestro, ficha con histórico integrado, valoraciones auditadas, agenda, laboratorios con calendario y Kt/V, prescripción, catéter, peritonitis (IAAS-09, PROA), suministros, 12 indicadores CAC 2026 y prevalidación del reporte CAC." },
  { clave: "vih", nombre: "VIH", grupo: "mis", fase: 4, migrado: true, descripcion: "Cohorte, agenda e inasistentes, laboratorios, TAR por grupo farmacológico, enfermería y carné de vacunación, historia clínica precargada, indicadores CAC y Nueva EPS, reportes y ruta GAO-PT-008." },
  { clave: "ce", migrado: true, nombre: "Consulta externa", grupo: "mis", fase: 9, descripcion: "Solicitudes, lista de espera única, autorizaciones, apertura de agenda por jornadas y asignación de citas por especialidad." },
  { clave: "qt", nombre: "Quimioterapia", grupo: "mis", fase: null, descripcion: "Agenda de infusión, esquemas, extravasación, reacciones infusionales y doble verificación de citostáticos." },
  { clave: "lab", migrado: true, nombre: "Laboratorio clínico", grupo: "apo", fase: 6, descripcion: "Solicitud mensual de los programas, muestras tomadas, carga de resultados, oportunidad y microbiología (cultivos y antibiogramas de HD y DP)." },
  { clave: "far", nombre: "Servicio farmacéutico", grupo: "apo", fase: null, descripcion: "Dispensación por programa, pendientes, farmacovigilancia y control de antimicrobianos restringidos.", mientras: "Sin módulo por ahora: se definirá su alcance antes de construirlo. Mientras tanto, aportes a PROA y seguridad del paciente desde aquí." },
  { clave: "sp", migrado: true, nombre: "Seguridad del paciente", grupo: "tra", fase: 6, descripcion: "Reportes de todos los programas, análisis, planes de mejora, rondas de seguridad y auditoría trimestral de higiene de manos." },
  { clave: "iaas", migrado: true, nombre: "IAAS", grupo: "tra", fase: 6, descripcion: "Programa gestionado por procesos: bandeja de gestión, plan de trabajo, vigilancia, comité con compromisos verificados, mejoramiento con eficacia, documentos e indicadores calculados desde los procesos fuente." },
  { clave: "proa", migrado: true, nombre: "PROA", grupo: "tra", fase: 6, descripcion: "Programa gestionado por procesos sobre las prescripciones de HD y DP: lista PROA por tratamiento, restringidos, alertas de resistencia, comité, mejoramiento e indicadores." },
  { clave: "ger", migrado: true, soloAdmin: true, nombre: "Tablero gerencial", grupo: "ges", fase: 10, descripcion: "Estado de todos los programas frente a sus metas, radar del rendimiento por programa, atenciones atendidas sobre programadas, riesgos abiertos y datos para decidir." },
  { clave: "cal", migrado: true, nombre: "Calendario de actividades", grupo: "ges", fase: 6, abierto: true, descripcion: "Reuniones, capacitaciones, comités, jornadas y visitas de la clínica, con responsable, invitados y confirmación de asistencia." },
  { clave: "prod", migrado: true, nombre: "Producción asistencial", grupo: "ges", fase: 6, descripcion: "Atenciones de todos los programas por mes y EPS; hemodiálisis se calcula del turno. Tarifas, valores y conciliación con clave." },
  { clave: "sogcs", migrado: true, nombre: "SOGCS · Comités", grupo: "ges", fase: 6, descripcion: "Comités institucionales según su frecuencia, actas, quórum y compromisos." },
  { clave: "docs", migrado: true, nombre: "Documentos y guías", grupo: "ges", fase: 6, abierto: true, descripcion: "Listado maestro de documentos de calidad y direccionamiento a guías de práctica clínica." },
  { clave: "msg", migrado: true, nombre: "Mensajes", grupo: "ges", fase: 6, abierto: true, descripcion: "Notificaciones formales entre usuarios y áreas, con acuse de lectura, plazo y respuesta." },
];

/** Página que muestra cada programa: como en el prototipo, todos viven en el portal (Hemodiálisis en su sección y la Ruta
    de Nefroprotección en un iframe dentro de él); los programas sin módulo propio muestran allí su ficha «en desarrollo». */
export const paginaDe = (_clave: string): "portal" => "portal";

export const PROGRAMA_POR_CLAVE: Record<string, ProgramaDef> = Object.fromEntries(PROGRAMAS.map((p) => [p.clave, p]));
