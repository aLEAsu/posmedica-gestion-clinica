/* Correspondencia entre las hojas del libro del programa VIH del prototipo (VXS) y las tablas de la base de datos.
   «log» (Bitácora) no se guarda: la reemplaza la auditoría del servidor; «cfg» va a la tabla parametro. */

export const MODELOS_VIH = {
  pac: { modelo: "VihPaciente", tabla: "vih_paciente", clave: "ID" },
  ant: { modelo: "VihAntecedente", tabla: "vih_antecedente", clave: "ID" },
  lab: { modelo: "VihLaboratorio", tabla: "vih_laboratorio", clave: "ID" },
  tar: { modelo: "VihEsquemaTar", tabla: "vih_esquema_tar", clave: "ID" },
  ent: { modelo: "VihEntregaTar", tabla: "vih_entrega_tar", clave: "ID" },
  cit: { modelo: "VihCita", tabla: "vih_cita", clave: "ID" },
  val: { modelo: "VihValoracion", tabla: "vih_valoracion", clave: "ID" },
  vac: { modelo: "VihVacuna", tabla: "vih_vacuna", clave: "ID" },
  prc: { modelo: "VihProcedimiento", tabla: "vih_procedimiento", clave: "ID" },
  prf: { modelo: "VihProfilaxis", tabla: "vih_profilaxis", clave: "ID" },
  nov: { modelo: "VihNovedad", tabla: "vih_novedad", clave: "ID" },
  sol: { modelo: "VihSolicitudLab", tabla: "vih_solicitud_lab", clave: "ID" },
  // Arrastre del último reporte CAC enviado: uno por paciente, sin columna ID.
  cac: { modelo: "VihArrastreCac", tabla: "vih_arrastre_cac", clave: "Paciente" },
} as const;

/** Columnas de la hoja Pacientes que son identidad y se guardan en el maestro único «persona» (D1). */
export const CAMPOS_PERSONA_VIH = [
  "TipoDoc", "Documento", "PrimerNombre", "SegundoNombre", "PrimerApellido", "SegundoApellido", "FechaNac", "Sexo", "EPS",
  "Regimen", "CodMunicipio", "Municipio", "Zona", "Direccion", "Telefono", "Etnia", "FechaAfiliacion",
];

/* En «persona» se guardan los códigos CAC (como Hemodiálisis); VIH los muestra con etiqueta. Equivalencias tomadas
   del propio prototipo (vih.js: importación CAC, variable 11). Son biyectivas: cada programa recupera exactamente lo que
   escribió, y un valor fuera de la tabla se guarda tal cual. */
export const ETNIA_VIH: Record<string, string> = {
  "1": "Indígena", "2": "ROM (gitano)", "3": "Raizal", "4": "Palenquero", "5": "Negro, mulato, afrocolombiano", "6": "Ninguna de las anteriores",
};
export const ZONA_VIH: Record<string, string> = { "1": "Urbana", "2": "Rural" };
