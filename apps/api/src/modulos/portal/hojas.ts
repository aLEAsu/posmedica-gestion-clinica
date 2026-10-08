/* Hojas del «libro institucional» del portal del prototipo (PSH en _analisis/portal/portal_nucleo.js:4).
   «Usuarios» no se guarda aquí (los usuarios son los del sistema); «Bitacora» la reemplaza la auditoría; «Config» va a parametro.
   La prueba test/portal.test.ts verifica que estas columnas sean idénticas a las del prototipo. */

export const HOJAS_PORTAL = {
  msg: { modelo: "PortalMensaje", tabla: "portal_mensaje", nombre: "Mensajes", columnas: ["ID","Hilo","FechaHora","De","Para","Tipo","Prioridad","Asunto","Cuerpo","Paciente","Programa","Plazo","Estado","LeidoEn","LeidoPor","CerradoEn"] },
  com: { modelo: "PortalComite", tabla: "portal_comite", nombre: "Comites", columnas: ["ID","Nombre","Frecuencia","MesInicio","Norma","Responsable","Integrantes","Activo"] },
  cse: { modelo: "PortalComiteSesion", tabla: "portal_comite_sesion", nombre: "ComiteSesiones", columnas: ["ID","Comite","Periodo","Fecha","Acta","Enlace","Asistentes","Quorum","Estado","Nota","Usuario"] },
  cmp: { modelo: "PortalCompromiso", tabla: "portal_compromiso", nombre: "Compromisos", columnas: ["ID","Comite","Sesion","Descripcion","Responsable","FechaLimite","Estado","FechaCierre","Evidencia","Usuario"] },
  doc: { modelo: "PortalDocumento", tabla: "portal_documento", nombre: "Documentos", columnas: ["ID","Codigo","Nombre","Tipo","Programas","Proceso","Version","FechaAprobacion","ProximaRevision","Estado","Enlace","Responsable","Fuente"] },
  lst: { modelo: "PortalListaChequeo", tabla: "portal_lista_chequeo", nombre: "ListasChequeo", columnas: ["ID","Fecha","Turno","Programa","Lista","Lugar","Resultado","Cumplidos","Aplicables","Observador","Observacion","Usuario"] },
  man: { modelo: "PortalAporteManual", tabla: "portal_aporte_manual", nombre: "AportesManuales", columnas: ["ID","Periodo","Matriz","Indicador","Programa","Numerador","Denominador","Nota","Usuario"] },
  prv: { modelo: "PortalProaAuditoria", tabla: "portal_proa_auditoria", nombre: "ProaAuditoria", columnas: ["ID","Fecha","Fuente","Ref","Programa","Paciente","Antimicrobiano","Restringido","Justificado","Autorizado","AcordeGuia","Reevaluado","DuracionConforme","Nota","Usuario"] },
  ram: { modelo: "PortalAlertaRam", tabla: "portal_alerta_ram", nombre: "AlertasRAM", columnas: ["ID","Fecha","Evento","Programa","Paciente","Microorganismo","Resistencia","Analizada","Conducta","Usuario"] },
  cal: { modelo: "PortalCalendario", tabla: "portal_calendario", nombre: "Calendario", columnas: ["ID","Titulo","Tipo","Comite","Fecha","HoraInicio","HoraFin","Modalidad","Lugar","Enlace","Responsable","Invitados","Programa","Visibilidad","Descripcion","Estado","Respuestas","Serie","Nota","Creador","Registrado"] },
  prd: { modelo: "PortalProduccion", tabla: "portal_produccion", nombre: "Produccion", columnas: ["ID","Fecha","Programa","EPS","Paciente","Actividad","CUPS","Cantidad","Nota","Usuario","Registrado","Anulado","MotivoAnulacion"] },
  rsp: { modelo: "PortalReporteSp", tabla: "portal_reporte_sp", nombre: "ReportesSP", columnas: ["ID","Fecha","Programa","Paciente","Clasificacion","Categoria","Severidad","Descripcion","AccionInmediata","Analisis","PlanMejora","Responsable","Estado","FechaCierre","Usuario"] },
} as const;
