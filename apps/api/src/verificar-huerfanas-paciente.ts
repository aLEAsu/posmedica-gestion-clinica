/* Auditoría técnica (A6, docs/ANALISIS.md §12): la migración 20261019130000_fk_paciente_hd_vih_dp_ce agregó las llaves
   foráneas reales entre cada tabla clínica y su paciente, pero con NOT VALID (no revisa los datos ya guardados, para
   no bloquear el despliegue si hay huérfanas). Este script SÍ los revisa, de solo lectura: busca filas con «Paciente»
   no vacío que no corresponda a ningún paciente real del mismo programa.
   Uso: npm run pacientes:verificar-huerfanas -w apps/api */
import { prisma } from "./db.js";

// (tabla, columna «paciente» del delegado de Prisma, tabla de pacientes del mismo programa, su columna de paciente).
const TABLAS: { tabla: string; paciente: string; restriccion: string }[] = [
  { tabla: "hdMovimiento", paciente: "hdPaciente", restriccion: "hd_movimiento_paciente_fkey" },
  { tabla: "hdSesion", paciente: "hdPaciente", restriccion: "hd_sesion_paciente_fkey" },
  { tabla: "hdEvento", paciente: "hdPaciente", restriccion: "hd_evento_paciente_fkey" },
  { tabla: "hdParaclinico", paciente: "hdPaciente", restriccion: "hd_paraclinico_paciente_fkey" },
  { tabla: "hdNovedad", paciente: "hdPaciente", restriccion: "hd_novedad_paciente_fkey" },
  { tabla: "hdContacto", paciente: "hdPaciente", restriccion: "hd_contacto_paciente_fkey" },
  { tabla: "hdAccesoNovedad", paciente: "hdPaciente", restriccion: "hd_acceso_novedad_paciente_fkey" },
  { tabla: "hdAtencion", paciente: "hdPaciente", restriccion: "hd_atencion_paciente_fkey" },
  { tabla: "hdValoracion", paciente: "hdPaciente", restriccion: "hd_valoracion_paciente_fkey" },
  { tabla: "hdSeguridadPaciente", paciente: "hdPaciente", restriccion: "hd_seguridad_paciente_paciente_fkey" },
  { tabla: "hdAntimicrobiano", paciente: "hdPaciente", restriccion: "hd_antimicrobiano_paciente_fkey" },
  { tabla: "hdPrescripcion", paciente: "hdPaciente", restriccion: "hd_prescripcion_paciente_fkey" },
  { tabla: "hdDispensacion", paciente: "hdPaciente", restriccion: "hd_dispensacion_paciente_fkey" },
  { tabla: "hdEstudio", paciente: "hdPaciente", restriccion: "hd_estudio_paciente_fkey" },
  { tabla: "hdVacuna", paciente: "hdPaciente", restriccion: "hd_vacuna_paciente_fkey" },
  { tabla: "hdTrasplanteItem", paciente: "hdPaciente", restriccion: "hd_trasplante_item_paciente_fkey" },
  { tabla: "hdSolicitudLab", paciente: "hdPaciente", restriccion: "hd_solicitud_lab_paciente_fkey" },
  { tabla: "hdDispositivo", paciente: "hdPaciente", restriccion: "hd_dispositivo_paciente_fkey" },
  { tabla: "vihAntecedente", paciente: "vihPaciente", restriccion: "vih_antecedente_paciente_fkey" },
  { tabla: "vihLaboratorio", paciente: "vihPaciente", restriccion: "vih_laboratorio_paciente_fkey" },
  { tabla: "vihEsquemaTar", paciente: "vihPaciente", restriccion: "vih_esquema_tar_paciente_fkey" },
  { tabla: "vihEntregaTar", paciente: "vihPaciente", restriccion: "vih_entrega_tar_paciente_fkey" },
  { tabla: "vihCita", paciente: "vihPaciente", restriccion: "vih_cita_paciente_fkey" },
  { tabla: "vihValoracion", paciente: "vihPaciente", restriccion: "vih_valoracion_paciente_fkey" },
  { tabla: "vihVacuna", paciente: "vihPaciente", restriccion: "vih_vacuna_paciente_fkey" },
  { tabla: "vihProcedimiento", paciente: "vihPaciente", restriccion: "vih_procedimiento_paciente_fkey" },
  { tabla: "vihProfilaxis", paciente: "vihPaciente", restriccion: "vih_profilaxis_paciente_fkey" },
  { tabla: "vihNovedad", paciente: "vihPaciente", restriccion: "vih_novedad_paciente_fkey" },
  { tabla: "vihSolicitudLab", paciente: "vihPaciente", restriccion: "vih_solicitud_lab_paciente_fkey" },
  { tabla: "vihArrastreCac", paciente: "vihPaciente", restriccion: "vih_arrastre_cac_paciente_fkey" },
  { tabla: "dpEpisodio", paciente: "dpPaciente", restriccion: "dp_episodio_paciente_fkey" },
  { tabla: "dpAntimicrobiano", paciente: "dpPaciente", restriccion: "dp_antimicrobiano_paciente_fkey" },
  { tabla: "dpTransicion", paciente: "dpPaciente", restriccion: "dp_transicion_paciente_fkey" },
  { tabla: "dpValoracion", paciente: "dpPaciente", restriccion: "dp_valoracion_paciente_fkey" },
  { tabla: "dpLaboratorio", paciente: "dpPaciente", restriccion: "dp_laboratorio_paciente_fkey" },
  { tabla: "dpPlanLaboratorio", paciente: "dpPaciente", restriccion: "dp_plan_laboratorio_paciente_fkey" },
  { tabla: "dpSolicitudLab", paciente: "dpPaciente", restriccion: "dp_solicitud_lab_paciente_fkey" },
  { tabla: "dpAgenda", paciente: "dpPaciente", restriccion: "dp_agenda_paciente_fkey" },
  { tabla: "dpPrescripcion", paciente: "dpPaciente", restriccion: "dp_prescripcion_paciente_fkey" },
  { tabla: "dpCateter", paciente: "dpPaciente", restriccion: "dp_cateter_paciente_fkey" },
  { tabla: "dpEducacion", paciente: "dpPaciente", restriccion: "dp_educacion_paciente_fkey" },
  { tabla: "dpInsumo", paciente: "dpPaciente", restriccion: "dp_insumo_paciente_fkey" },
  { tabla: "dpEntrega", paciente: "dpPaciente", restriccion: "dp_entrega_paciente_fkey" },
  { tabla: "dpHospitalizacion", paciente: "dpPaciente", restriccion: "dp_hospitalizacion_paciente_fkey" },
  { tabla: "dpTrasplante", paciente: "dpPaciente", restriccion: "dp_trasplante_paciente_fkey" },
  { tabla: "dpCalidadVida", paciente: "dpPaciente", restriccion: "dp_calidad_vida_paciente_fkey" },
  { tabla: "dpHeredado", paciente: "dpPaciente", restriccion: "dp_heredado_paciente_fkey" },
  { tabla: "dpCorteCacDetalle", paciente: "dpPaciente", restriccion: "dp_corte_cac_detalle_paciente_fkey" },
  { tabla: "ceSolicitud", paciente: "cePaciente", restriccion: "ce_solicitud_paciente_fkey" },
  { tabla: "ceCita", paciente: "cePaciente", restriccion: "ce_cita_paciente_fkey" },
];
const TABLA_SQL: Record<string, string> = {
  hdMovimiento: "hd_movimiento", hdSesion: "hd_sesion", hdEvento: "hd_evento", hdParaclinico: "hd_paraclinico", hdNovedad: "hd_novedad",
  hdContacto: "hd_contacto", hdAccesoNovedad: "hd_acceso_novedad", hdAtencion: "hd_atencion", hdValoracion: "hd_valoracion",
  hdSeguridadPaciente: "hd_seguridad_paciente", hdAntimicrobiano: "hd_antimicrobiano", hdPrescripcion: "hd_prescripcion",
  hdDispensacion: "hd_dispensacion", hdEstudio: "hd_estudio", hdVacuna: "hd_vacuna", hdTrasplanteItem: "hd_trasplante_item",
  hdSolicitudLab: "hd_solicitud_lab", hdDispositivo: "hd_dispositivo", vihAntecedente: "vih_antecedente", vihLaboratorio: "vih_laboratorio",
  vihEsquemaTar: "vih_esquema_tar", vihEntregaTar: "vih_entrega_tar", vihCita: "vih_cita", vihValoracion: "vih_valoracion",
  vihVacuna: "vih_vacuna", vihProcedimiento: "vih_procedimiento", vihProfilaxis: "vih_profilaxis", vihNovedad: "vih_novedad",
  vihSolicitudLab: "vih_solicitud_lab", vihArrastreCac: "vih_arrastre_cac", dpEpisodio: "dp_episodio", dpAntimicrobiano: "dp_antimicrobiano",
  dpTransicion: "dp_transicion", dpValoracion: "dp_valoracion", dpLaboratorio: "dp_laboratorio", dpPlanLaboratorio: "dp_plan_laboratorio",
  dpSolicitudLab: "dp_solicitud_lab", dpAgenda: "dp_agenda", dpPrescripcion: "dp_prescripcion", dpCateter: "dp_cateter",
  dpEducacion: "dp_educacion", dpInsumo: "dp_insumo", dpEntrega: "dp_entrega", dpHospitalizacion: "dp_hospitalizacion",
  dpTrasplante: "dp_trasplante", dpCalidadVida: "dp_calidad_vida", dpHeredado: "dp_heredado", dpCorteCacDetalle: "dp_corte_cac_detalle",
  ceSolicitud: "ce_solicitud", ceCita: "ce_cita",
};

async function main() {
  const limpias: string[] = [];
  const conHuerfanas: string[] = [];
  for (const t of TABLAS) {
    const delegado = (prisma as unknown as Record<string, { findMany: (a: object) => Promise<{ Paciente: string | null }[]> }>)[t.tabla];
    const pacDelegado = (prisma as unknown as Record<string, { findMany: (a: object) => Promise<{ ID: string }[]> }>)[t.paciente];
    const filas = await delegado.findMany({ where: { Paciente: { not: null } }, select: { Paciente: true } });
    if (!filas.length) continue;
    const ids = new Set((await pacDelegado.findMany({ select: { ID: true } })).map((p) => p.ID));
    const huerfanas = [...new Set(filas.map((f) => f.Paciente).filter((p): p is string => !!p && !ids.has(p)))];
    if (huerfanas.length) {
      conHuerfanas.push(t.tabla);
      console.log(`${t.tabla}: ${huerfanas.length} referencia(s) a un paciente que no existe: ${huerfanas.slice(0, 20).join(", ")}${huerfanas.length > 20 ? "…" : ""}`);
    } else {
      limpias.push(t.restriccion);
    }
  }
  console.log(`\n${conHuerfanas.length ? conHuerfanas.length + " tabla(s) con huérfanas: corríjalas (o anule esas filas) antes de validar su restricción." : "Sin huérfanas en ninguna tabla."}`);
  if (limpias.length) {
    console.log("\nSQL para activar del todo las restricciones ya limpias (ejecútelo una sola vez contra la base; no es una migración):");
    for (const r of limpias) console.log(`ALTER TABLE "${TABLA_SQL[TABLAS.find((t) => t.restriccion === r)!.tabla]}" VALIDATE CONSTRAINT "${r}";`);
  }
}

main()
  .catch((e) => {
    console.error("No se pudo verificar:", e?.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
