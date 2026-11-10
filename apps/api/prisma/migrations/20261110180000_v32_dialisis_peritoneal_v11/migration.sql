-- Fase D (v3.2, 10 nov 2026): Diálisis peritoneal v1.1.
--   · dp11_paciente: pacientes del módulo; su identidad vive en «persona» (maestro único).
--   · dp11_registro: cada elemento de las colecciones del módulo (Kt/V, laboratorios, eventos, valoraciones, visitas,
--     fórmula, habilitación, obligaciones, catálogo, actividades hechas, farmacia del mes, plan, costos, metas), con
--     llave foránea a su paciente cuando le pertenece. Anular conserva el registro.
-- Las tablas dp_* de la v0.8 no se tocan. Solo crea tablas. Generada con prisma migrate diff.

-- CreateTable
CREATE TABLE "dp11_paciente" (
    "id" TEXT NOT NULL,
    "persona_id" UUID NOT NULL,
    "datos" JSONB NOT NULL,
    "anulado" BOOLEAN NOT NULL DEFAULT false,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dp11_paciente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dp11_registro" (
    "coleccion" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "paciente" TEXT,
    "datos" JSONB NOT NULL,
    "anulado" BOOLEAN NOT NULL DEFAULT false,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dp11_registro_pkey" PRIMARY KEY ("coleccion","clave")
);

-- CreateIndex
CREATE UNIQUE INDEX "dp11_paciente_persona_id_key" ON "dp11_paciente"("persona_id");

-- CreateIndex
CREATE INDEX "dp11_registro_paciente_idx" ON "dp11_registro"("paciente");

-- AddForeignKey
ALTER TABLE "dp11_paciente" ADD CONSTRAINT "dp11_paciente_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dp11_registro" ADD CONSTRAINT "dp11_registro_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "dp11_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

