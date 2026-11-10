-- Fase E (v3.2, 10 nov 2026): Talento humano y bienestar en el libro institucional (solo el administrador lo lee y lo
-- registra): empleados del mes, cuadro de turnos, formatos de talento humano y clima laboral. Antes vivía en el
-- navegador con personal ficticio de ejemplo. La matriz de Contratos y tecnologías se guarda como parámetro (sin tabla).
-- Solo crea tablas. Generada con prisma migrate diff desde el esquema anterior.

-- CreateTable
CREATE TABLE "portal_th_empleado_mes" (
    "id" TEXT NOT NULL,
    "mes" TEXT,
    "nombre" TEXT,
    "cargo" TEXT,
    "area" TEXT,
    "valor" TEXT,
    "motivo" TEXT,
    "votos" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_th_empleado_mes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_th_turno" (
    "id" TEXT NOT NULL,
    "colaborador" TEXT,
    "cargo" TEXT,
    "servicio" TEXT,
    "lun" TEXT,
    "mar" TEXT,
    "mie" TEXT,
    "jue" TEXT,
    "vie" TEXT,
    "sab" TEXT,
    "obs" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_th_turno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_th_formato" (
    "id" TEXT NOT NULL,
    "codigo" TEXT,
    "tipo" TEXT,
    "colaborador" TEXT,
    "area" TEXT,
    "fecha" TEXT,
    "detalle" TEXT,
    "estado" TEXT,
    "aprobado_por" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_th_formato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_th_clima" (
    "id" TEXT NOT NULL,
    "fecha" TEXT,
    "area" TEXT,
    "dimension" TEXT,
    "puntaje" TEXT,
    "riesgo" TEXT,
    "accion" TEXT,
    "estado" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_th_clima_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "portal_th_empleado_mes_mes_idx" ON "portal_th_empleado_mes"("mes");

-- CreateIndex
CREATE INDEX "portal_th_formato_fecha_idx" ON "portal_th_formato"("fecha");

-- CreateIndex
CREATE INDEX "portal_th_clima_fecha_idx" ON "portal_th_clima"("fecha");

