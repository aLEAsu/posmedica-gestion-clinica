-- Bitácora de Diálisis peritoneal (y cualquier consulta de la auditoría por programa): sin este índice, cada consulta
-- recorría la auditoría de todos los programas. Solo agrega un índice; no modifica datos.
CREATE INDEX "auditoria_programa_id_idx" ON "auditoria"("programa", "id");
