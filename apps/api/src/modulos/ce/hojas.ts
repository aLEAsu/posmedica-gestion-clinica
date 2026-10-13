/* Hojas del libro de Consulta externa del prototipo (CES) y su correspondencia con las tablas de la base de datos.
   El prototipo lee el libro como texto (ceParse con raw:false). «Bitacora» no se guarda: la reemplaza la auditoría del
   servidor. La prueba test/ce.test.ts verifica que todo sea idéntico al prototipo. */

export const HOJAS_CE = {
  pac: { modelo: "CePaciente", tabla: "ce_paciente", nombre: "Pacientes", clave: "ID", columnas: ["ID","TipoDoc","Documento","PrimerNombre","SegundoNombre","PrimerApellido","SegundoApellido","FechaNac","Sexo","Telefono","Telefono2","Municipio","EPS","Usuario","Registrado"] },
  sol: { modelo: "CeSolicitud", tabla: "ce_solicitud", nombre: "Solicitudes", clave: "ID", columnas: ["ID","Paciente","Especialidad","TipoConsulta","Modalidad","FechaSolicitud","SoporteFecha","Canal","FechaDeseada","ProfesionalPedido","Programa","TieneOrden","OrdenRef","FechaLimiteClinica","SustentoLimite","Observacion","Estado","Responsable","ProximaAccion","ProximaFecha","Prioridad","PrioridadMotivo","PrioridadFuente","PrioridadPor","PrioridadFecha","DuplicadoJustificacion","CausaCierre","FechaCierre","Usuario","Registrado"] },
  aut: { modelo: "CeAutorizacion", tabla: "ce_autorizacion", nombre: "Autorizaciones", clave: "ID", columnas: ["ID","Solicitud","Situacion","Numero","Entidad","FechaEmision","FechaVencimiento","Cantidad","Condiciones","FechaTramite","Responsable","Usuario","Registrado"] },
  ges: { modelo: "CeGestion", tabla: "ce_gestion", nombre: "Gestiones", clave: "ID", columnas: ["ID","Solicitud","FechaHora","Usuario","Accion","Detalle","ProximaAccion","ProximaFecha"] },
  jor: { modelo: "CeJornada", tabla: "ce_jornada", nombre: "Jornadas", clave: "ID", columnas: ["ID","Programa","Profesional","Especialidad","Modalidad","Consultorio","EPS","Fecha","HoraInicio","HoraFin","Duracion","Agendas","Extraordinaria","Serie","Estado","MotivoCancelacion","Observacion","Usuario","Registrado"] },
  cup: { modelo: "CeCupo", tabla: "ce_cupo", nombre: "Cupos", clave: "ID", columnas: ["ID","Jornada","Fecha","Hora","Agenda","Estado","BloqueoTipo","BloqueoMotivo","BloqueadoPor"] },
  cit: { modelo: "CeCita", tabla: "ce_cita", nombre: "Citas", clave: "ID", columnas: ["ID","Cupo","Solicitud","Paciente","Fecha","Hora","Estado","Origen","AsignadaEn","AsignadaPor","SaltoOrdenMotivo","Confirmacion","Observacion"] },
  pro: { modelo: "CeProfesional", tabla: "ce_profesional", nombre: "Profesionales", clave: "ID", columnas: ["ID","TipoDoc","Documento","Nombre","Registro","Especialidades","Activo"] },
  con: { modelo: "CeConsultorio", tabla: "ce_consultorio", nombre: "Consultorios", clave: "ID", columnas: ["ID","Sede","Nombre","Tipo","Plataforma","Activo"] },
  esp: { modelo: "CeEspecialidad", tabla: "ce_especialidad", nombre: "Especialidades", clave: "Codigo", columnas: ["Codigo","Nombre","Reservada","ReportaRes256","Presencial","Telemedicina","FuenteREPS","MinPrimeraVez","MinControl","DuracionActualizadaPor","Activa"] },
  eps: { modelo: "CeEps", tabla: "ce_eps", nombre: "EPS", clave: "Codigo", columnas: ["Codigo","Nombre","Activa"] },
  rol: { modelo: "CeRol", tabla: "ce_rol", nombre: "RolesCE", clave: "Usuario", columnas: ["Usuario","Rol","VeReservadas","Motivo","ConcedidoPor","Fecha"] },
  cfg: { modelo: "CeConfig", tabla: "ce_config", nombre: "Config", clave: "Clave", columnas: ["Clave","Valor","Fuente"] },
} as const;

/** Columnas de la hoja Pacientes que son identidad y se guardan en el maestro único «persona» (D1). */
export const CAMPOS_PERSONA_CE = ["TipoDoc", "Documento", "PrimerNombre", "SegundoNombre", "PrimerApellido", "SegundoApellido", "FechaNac", "Sexo", "Telefono", "Municipio", "EPS"];
