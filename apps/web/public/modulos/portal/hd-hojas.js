// Código propio del proyecto. Hemodiálisis · hojas nuevas del libro (v3.2).
/* Las funciones de la v3.2 que antes vivían solo en memoria o en el navegador pasan a hojas del libro de Hemodiálisis,
   que el servidor guarda como cualquier otra (tabla, permisos, auditoría, control de concurrencia):
     · ActividadesSIIS: actividades y estadísticas del catálogo SIIS de 64 códigos (los EVENTOS siguen en «Eventos»).
     · OxigenoMedicinal: bitácora del formato GFA-FO-OXI-001; CilindrosOxigeno: su kárdex (el inventario real, no uno fijo).
     · ChequeoTurno: verificación obligatoria antes de conectar pacientes (calidad del agua y limpieza/desinfección).
   Y la sesión guarda los signos vitales que el Turno del día ya pedía (FC, FR, SatO2).
   El motor de reglas (packages/clinical-rules) ejecuta este archivo: de aquí salen las tablas (npm run esquema). */
(function () {
  "use strict";
  const AUD = ["Usuario", "Registrado", "Anulado", "MotivoAnulacion"];
  SH.sii = ["ActividadesSIIS", ["ID", "Fecha", "Paciente", "Codigo", "Actividad", "Tipo", "Categoria", "Protocolo", "Turno", "Puesto", "Severidad", "Nota", "Estado", "Origen", ...AUD]];
  SH.oxi = ["OxigenoMedicinal", ["ID", "Fecha", "Turno", "Puesto", "Paciente", "CodigoSIIS", "Indicacion", "Dispositivo", "FlujoLmin", "Minutos", "SatO2Pre", "SatO2Post", "Cilindro", "Lote", "VenceCilindro", "PsiInicial", "PsiFinal", "Litros", "M3", "Nota", ...AUD]];
  SH.cil = ["CilindrosOxigeno", ["ID", "Tipo", "CapacidadM3", "Factor", "Ubicacion", "Lote", "Vence", "Psi", "Estado", ...AUD]];
  SH.chk = ["ChequeoTurno", ["ID", "Fecha", "Turno", "Agua", "Desinfeccion", "Conductividad", "Cloro", "Observacion", ...AUD]];
  for (const k of ["sii", "oxi", "cil", "chk"]) if (!BOOK_KEYS.includes(k)) BOOK_KEYS.splice(BOOK_KEYS.indexOf("cor"), 0, k);
  const ses = SH.ses[1];
  for (const c of ["FC", "FR", "SatO2"]) if (!ses.includes(c)) ses.splice(ses.indexOf("Gluco"), 0, c);
  ["VenceCilindro", "Vence"].forEach((f) => DATE_F.add(f));
  ["FC", "FR", "SatO2", "Puesto", "FlujoLmin", "Minutos", "SatO2Pre", "SatO2Post", "PsiInicial", "PsiFinal", "Litros", "M3", "CapacidadM3", "Factor", "Psi"].forEach((f) => NUM_F.add(f));
})();
