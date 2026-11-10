-- Auditoría técnica (A5, docs/ANALISIS.md §12, decisión del 19 oct 2026): la identidad de una persona se fusiona por
-- el número de documento SOLO (resolverPersona, nefro/fachada.ts persona()); la restricción @@unique([tipoDoc,
-- documento]) no protegía ese caso porque PostgreSQL trata NULL como distinto en una restricción única, así que dos
-- registros con el mismo documento pero el tipo de documento vacío en uno de los dos podían quedar duplicados.
--
-- ATENCIÓN antes de aplicar esta migración en una base con datos reales: si ya existen dos o más personas con el mismo
-- documento (duplicadas por este mismo error), el CREATE UNIQUE INDEX de abajo FALLARÁ (PostgreSQL no permite crear un
-- índice único sobre datos que ya lo violan). A diferencia de una llave foránea, un índice único no admite «NOT VALID»:
-- no hay forma de aplicarlo primero y validarlo después. Antes de desplegar esta migración:
--   1. Ejecute `npm run personas:verificar-duplicados -w apps/api` (de solo lectura) contra la base real.
--   2. Si reporta documentos duplicados, fusione o corrija esas personas ANTES de desplegar esta migración.
--   3. Si la migración falla al desplegar, el servidor no arranca (falla segura: no corrompe nada), pero queda sin
--      servicio hasta corregir los duplicados y reintentar.

-- DropIndex
DROP INDEX "persona_tipo_doc_documento_key";

-- CreateIndex
CREATE UNIQUE INDEX "persona_documento_key" ON "persona"("documento");
