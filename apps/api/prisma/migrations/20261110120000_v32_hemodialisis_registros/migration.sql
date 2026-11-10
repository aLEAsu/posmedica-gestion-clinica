-- Fase B (v3.2, 10 nov 2026): Hemodiálisis guarda en el servidor lo que la v3.2 tenía solo en el navegador o en memoria.
--   · hd_actividad_siis: actividades y estadísticas SIIS (64 códigos); los EVENTOS siguen en hd_evento.
--   · hd_oxigeno: bitácora de oxígeno medicinal (formato GFA-FO-OXI-001).
--   · hd_chequeo_turno: verificación obligatoria antes de conectar pacientes (agua y limpieza/desinfección).
--   · hd_sesion: FC, FR y SatO2 del Turno del día.
--   · hd_paciente, hd_novedad, hd_evento, hd_movimiento: columnas de la lectura estricta de los Dashboards (HDX v3.1).
--   · vih_entrega_tar: conciliación de la entrega de TAR (saldo previo, unidades teóricas, lote, vencimiento, interrupción).
-- Solo agrega columnas y tablas (nada se borra ni cambia de tipo). Generada con prisma migrate diff desde el esquema anterior.

-- AlterTable
ALTER TABLE "hd_paciente" ADD COLUMN     "acceso_hist" TEXT,
ADD COLUMN     "comorbilidades" TEXT,
ADD COLUMN     "erc_etapa" DOUBLE PRECISION,
ADD COLUMN     "estado_fuente" TEXT,
ADD COLUMN     "estado_origen" TEXT,
ADD COLUMN     "id_hist" TEXT,
ADD COLUMN     "inicio_hd" DATE,
ADD COLUMN     "meses_maestro" TEXT,
ADD COLUMN     "meses_registro" TEXT,
ADD COLUMN     "modalidad_previa" TEXT,
ADD COLUMN     "primer_registro" DATE,
ADD COLUMN     "prog_mes" DOUBLE PRECISION,
ADD COLUMN     "tx_etapa_raw" TEXT,
ADD COLUMN     "vhb_estado_raw" TEXT;

-- AlterTable
ALTER TABLE "hd_movimiento" ADD COLUMN     "origen" TEXT;

-- AlterTable
ALTER TABLE "hd_sesion" ADD COLUMN     "fc" DOUBLE PRECISION,
ADD COLUMN     "fr" DOUBLE PRECISION,
ADD COLUMN     "sat_o2" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "hd_evento" ADD COLUMN     "nombre_fuente" TEXT;

-- AlterTable
ALTER TABLE "hd_novedad" ADD COLUMN     "estado_raw" TEXT,
ADD COLUMN     "nombre_fuente" TEXT,
ADD COLUMN     "notas_n" DOUBLE PRECISION,
ADD COLUMN     "tipo_raw" TEXT;

-- AlterTable
ALTER TABLE "vih_entrega_tar" ADD COLUMN     "dias_interrupcion" TEXT,
ADD COLUMN     "fecha_vencimiento" TEXT,
ADD COLUMN     "lote" TEXT,
ADD COLUMN     "saldo_previo" TEXT,
ADD COLUMN     "unidades_teoricas" TEXT;

-- CreateTable
CREATE TABLE "hd_actividad_siis" (
    "id" TEXT NOT NULL,
    "fecha" DATE,
    "paciente" TEXT,
    "codigo" TEXT,
    "actividad" TEXT,
    "tipo" TEXT,
    "categoria" TEXT,
    "protocolo" TEXT,
    "turno" TEXT,
    "puesto" DOUBLE PRECISION,
    "severidad" TEXT,
    "nota" TEXT,
    "estado" TEXT,
    "origen" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hd_actividad_siis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hd_oxigeno" (
    "id" TEXT NOT NULL,
    "fecha" DATE,
    "turno" TEXT,
    "puesto" DOUBLE PRECISION,
    "paciente" TEXT,
    "codigo_siis" TEXT,
    "indicacion" TEXT,
    "dispositivo" TEXT,
    "flujo_lmin" DOUBLE PRECISION,
    "minutos" DOUBLE PRECISION,
    "sat_o2_pre" DOUBLE PRECISION,
    "sat_o2_post" DOUBLE PRECISION,
    "cilindro" TEXT,
    "lote" TEXT,
    "vence_cilindro" DATE,
    "psi_inicial" DOUBLE PRECISION,
    "psi_final" DOUBLE PRECISION,
    "litros" DOUBLE PRECISION,
    "m3" DOUBLE PRECISION,
    "nota" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hd_oxigeno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hd_chequeo_turno" (
    "id" TEXT NOT NULL,
    "fecha" DATE,
    "turno" TEXT,
    "agua" TEXT,
    "desinfeccion" TEXT,
    "conductividad" TEXT,
    "cloro" TEXT,
    "observacion" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hd_chequeo_turno_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hd_actividad_siis_paciente_idx" ON "hd_actividad_siis"("paciente");

-- CreateIndex
CREATE INDEX "hd_actividad_siis_fecha_idx" ON "hd_actividad_siis"("fecha");

-- CreateIndex
CREATE INDEX "hd_oxigeno_paciente_idx" ON "hd_oxigeno"("paciente");

-- CreateIndex
CREATE INDEX "hd_oxigeno_fecha_idx" ON "hd_oxigeno"("fecha");

-- CreateIndex
CREATE INDEX "hd_chequeo_turno_fecha_idx" ON "hd_chequeo_turno"("fecha");

-- AddForeignKey
ALTER TABLE "hd_actividad_siis" ADD CONSTRAINT "hd_actividad_siis_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "hd_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hd_oxigeno" ADD CONSTRAINT "hd_oxigeno_paciente_fkey" FOREIGN KEY ("paciente") REFERENCES "hd_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

