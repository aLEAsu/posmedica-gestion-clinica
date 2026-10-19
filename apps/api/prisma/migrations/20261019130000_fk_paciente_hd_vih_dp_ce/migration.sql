-- Auditoría técnica (A6, docs/ANALISIS.md §12.2, decisión del 19 oct 2026): ninguna tabla clínica de Hemodiálisis, VIH,
-- Diálisis peritoneal o Consulta externa tenía una llave foránea real hacia su paciente (solo un texto validado en la
-- aplicación). Se agregan las 50 restricciones reales, con ON DELETE RESTRICT (no se permite borrar un paciente con
-- historia clínica asociada: la trazabilidad no se pierde por una eliminación accidental o de otra vía).
--
-- NOT VALID: PostgreSQL agrega la restricción sin revisar primero las filas existentes, así que esta migración NO
-- fallará aunque ya existan referencias huérfanas (un «Paciente» que no corresponde a ningún paciente real). A partir
-- de aquí, todo INSERT o UPDATE nuevo SÍ queda protegido de inmediato. Para que también cubra los datos ya guardados:
--   1. Ejecute `npm run pacientes:verificar-huerfanas -w apps/api` (de solo lectura) y corrija lo que reporte.
--   2. Cuando no reporte nada, ejecute el SQL que imprime al final («ALTER TABLE … VALIDATE CONSTRAINT …») una vez,
--      directamente contra la base (no es necesario como migración: VALIDATE CONSTRAINT no cambia el esquema).

-- AddForeignKey
ALTER TABLE "hd_movimiento" ADD CONSTRAINT "hd_movimiento_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "hd_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "hd_sesion" ADD CONSTRAINT "hd_sesion_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "hd_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "hd_evento" ADD CONSTRAINT "hd_evento_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "hd_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "hd_paraclinico" ADD CONSTRAINT "hd_paraclinico_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "hd_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "hd_novedad" ADD CONSTRAINT "hd_novedad_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "hd_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "hd_contacto" ADD CONSTRAINT "hd_contacto_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "hd_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "hd_acceso_novedad" ADD CONSTRAINT "hd_acceso_novedad_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "hd_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "hd_atencion" ADD CONSTRAINT "hd_atencion_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "hd_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "hd_valoracion" ADD CONSTRAINT "hd_valoracion_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "hd_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "hd_seguridad_paciente" ADD CONSTRAINT "hd_seguridad_paciente_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "hd_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "hd_antimicrobiano" ADD CONSTRAINT "hd_antimicrobiano_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "hd_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "hd_prescripcion" ADD CONSTRAINT "hd_prescripcion_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "hd_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "hd_dispensacion" ADD CONSTRAINT "hd_dispensacion_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "hd_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "hd_estudio" ADD CONSTRAINT "hd_estudio_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "hd_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "hd_vacuna" ADD CONSTRAINT "hd_vacuna_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "hd_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "hd_trasplante_item" ADD CONSTRAINT "hd_trasplante_item_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "hd_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "hd_solicitud_lab" ADD CONSTRAINT "hd_solicitud_lab_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "hd_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "hd_dispositivo" ADD CONSTRAINT "hd_dispositivo_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "hd_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "vih_antecedente" ADD CONSTRAINT "vih_antecedente_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "vih_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "vih_laboratorio" ADD CONSTRAINT "vih_laboratorio_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "vih_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "vih_esquema_tar" ADD CONSTRAINT "vih_esquema_tar_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "vih_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "vih_entrega_tar" ADD CONSTRAINT "vih_entrega_tar_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "vih_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "vih_cita" ADD CONSTRAINT "vih_cita_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "vih_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "vih_valoracion" ADD CONSTRAINT "vih_valoracion_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "vih_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "vih_vacuna" ADD CONSTRAINT "vih_vacuna_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "vih_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "vih_procedimiento" ADD CONSTRAINT "vih_procedimiento_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "vih_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "vih_profilaxis" ADD CONSTRAINT "vih_profilaxis_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "vih_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "vih_novedad" ADD CONSTRAINT "vih_novedad_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "vih_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "vih_solicitud_lab" ADD CONSTRAINT "vih_solicitud_lab_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "vih_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "vih_arrastre_cac" ADD CONSTRAINT "vih_arrastre_cac_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "vih_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "dp_episodio" ADD CONSTRAINT "dp_episodio_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "dp_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "dp_antimicrobiano" ADD CONSTRAINT "dp_antimicrobiano_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "dp_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "dp_transicion" ADD CONSTRAINT "dp_transicion_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "dp_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "dp_valoracion" ADD CONSTRAINT "dp_valoracion_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "dp_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "dp_laboratorio" ADD CONSTRAINT "dp_laboratorio_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "dp_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "dp_plan_laboratorio" ADD CONSTRAINT "dp_plan_laboratorio_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "dp_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "dp_solicitud_lab" ADD CONSTRAINT "dp_solicitud_lab_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "dp_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "dp_agenda" ADD CONSTRAINT "dp_agenda_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "dp_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "dp_prescripcion" ADD CONSTRAINT "dp_prescripcion_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "dp_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "dp_cateter" ADD CONSTRAINT "dp_cateter_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "dp_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "dp_educacion" ADD CONSTRAINT "dp_educacion_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "dp_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "dp_insumo" ADD CONSTRAINT "dp_insumo_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "dp_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "dp_entrega" ADD CONSTRAINT "dp_entrega_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "dp_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "dp_hospitalizacion" ADD CONSTRAINT "dp_hospitalizacion_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "dp_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "dp_trasplante" ADD CONSTRAINT "dp_trasplante_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "dp_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "dp_calidad_vida" ADD CONSTRAINT "dp_calidad_vida_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "dp_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "dp_heredado" ADD CONSTRAINT "dp_heredado_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "dp_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "dp_corte_cac_detalle" ADD CONSTRAINT "dp_corte_cac_detalle_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "dp_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "ce_solicitud" ADD CONSTRAINT "ce_solicitud_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "ce_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;

-- AddForeignKey
ALTER TABLE "ce_cita" ADD CONSTRAINT "ce_cita_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "ce_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE NOT VALID;
