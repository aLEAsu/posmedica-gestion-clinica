-- Fase F (10 nov 2026): kárdex real de cilindros de oxígeno medicinal (antes un inventario fijo de ejemplo en el código).
-- Solo crea la tabla. Generada con prisma migrate diff.

-- CreateTable
CREATE TABLE "hd_cilindro_oxigeno" (
    "id" TEXT NOT NULL,
    "tipo" TEXT,
    "capacidad_m3" DOUBLE PRECISION,
    "factor" DOUBLE PRECISION,
    "ubicacion" TEXT,
    "lote" TEXT,
    "vence" DATE,
    "psi" DOUBLE PRECISION,
    "estado" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hd_cilindro_oxigeno_pkey" PRIMARY KEY ("id")
);

