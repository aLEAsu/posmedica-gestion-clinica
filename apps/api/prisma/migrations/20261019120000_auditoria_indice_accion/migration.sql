-- Panel de Auditoría (routes/auditoria.ts): el filtro por «accion» sola (sin «entidad») no tenía ningún índice que lo
-- cubriera, igual que el caso ya resuelto en 20261014090000 para «programa». Solo agrega un índice; no modifica datos.
CREATE INDEX "auditoria_accion_idx" ON "auditoria"("accion");
