/* Correspondencia entre las hojas del libro de hemodiálisis del prototipo y las tablas de la base de datos.
   La usan el generador del esquema (scripts/generar-esquema-hd.mjs) y la API del módulo (src/modulos/hd). */

/** hoja del prototipo → modelo Prisma y tabla. «log» (Bitácora) no se guarda: la reemplaza la auditoría del servidor. */
export const MODELOS_HD = {
  pac: { modelo: "HdPaciente", tabla: "hd_paciente" },
  mov: { modelo: "HdMovimiento", tabla: "hd_movimiento" },
  ses: { modelo: "HdSesion", tabla: "hd_sesion" },
  evt: { modelo: "HdEvento", tabla: "hd_evento" },
  lab: { modelo: "HdParaclinico", tabla: "hd_paraclinico" },
  nov: { modelo: "HdNovedad", tabla: "hd_novedad" },
  ctc: { modelo: "HdContacto", tabla: "hd_contacto" },
  acn: { modelo: "HdAccesoNovedad", tabla: "hd_acceso_novedad" },
  ate: { modelo: "HdAtencion", tabla: "hd_atencion" },
  val: { modelo: "HdValoracion", tabla: "hd_valoracion" },
  seg: { modelo: "HdSeguridadPaciente", tabla: "hd_seguridad_paciente" },
  atb: { modelo: "HdAntimicrobiano", tabla: "hd_antimicrobiano" },
  aud: { modelo: "HdAuditoriaIaas", tabla: "hd_auditoria_iaas" },
  med: { modelo: "HdPrescripcion", tabla: "hd_prescripcion" },
  dis: { modelo: "HdDispensacion", tabla: "hd_dispensacion" },
  est: { modelo: "HdEstudio", tabla: "hd_estudio" },
  vac: { modelo: "HdVacuna", tabla: "hd_vacuna" },
  txs: { modelo: "HdTrasplanteItem", tabla: "hd_trasplante_item" },
  sol: { modelo: "HdSolicitudLab", tabla: "hd_solicitud_lab" },
  cor: { modelo: "HdCorte", tabla: "hd_corte" },
};

/** Columnas de la hoja Pacientes que son identidad de la persona y se guardan en el maestro único «persona» (D1). */
export const CAMPOS_PERSONA = [
  "TipoDoc", "Documento", "Apellidos", "Nombres", "FechaNac", "Sexo", "EPS", "Regimen", "FechaAfiliacion",
  "Municipio", "MunicipioDANE", "Zona", "Direccion", "Telefono", "Etnia", "GrupoPob",
];
