-- DropForeignKey
ALTER TABLE "persona" DROP CONSTRAINT "persona_municipio_dane_fkey";

-- AlterTable
ALTER TABLE "persona" ADD COLUMN     "municipio" TEXT,
ALTER COLUMN "tipo_doc" DROP NOT NULL,
ALTER COLUMN "documento" DROP NOT NULL,
ALTER COLUMN "primer_nombre" SET DEFAULT '',
ALTER COLUMN "primer_apellido" SET DEFAULT '';

-- CreateTable
CREATE TABLE "hd_paciente" (
    "id" TEXT NOT NULL,
    "afiliacion" TEXT,
    "barrio" TEXT,
    "acudiente" TEXT,
    "tel_acudiente" TEXT,
    "discapacidad" TEXT,
    "hta" TEXT,
    "fecha_dx_hta" DATE,
    "dm" TEXT,
    "dm_tipo" TEXT,
    "fecha_dx_dm" DATE,
    "dislipidemia" TEXT,
    "etiologia" TEXT,
    "talla" DOUBLE PRECISION,
    "fecha_dx_erc5" DATE,
    "tfg_inicio" DOUBLE PRECISION,
    "modo_inicio" TEXT,
    "inicio_trr" DATE,
    "ingreso_unidad" DATE,
    "ingreso_programa" DATE,
    "procedencia" TEXT,
    "acceso_inicial" TEXT,
    "estado" TEXT,
    "fecha_estado" DATE,
    "causa_muerte" TEXT,
    "turno" TEXT,
    "puesto" DOUBLE PRECISION,
    "ses_semana" DOUBLE PRECISION,
    "duracion_min" DOUBLE PRECISION,
    "peso_seco" DOUBLE PRECISION,
    "acceso_actual" TEXT,
    "acceso_desde" DATE,
    "ruta_acceso" TEXT,
    "soporte_ruta" TEXT,
    "fecha_ruta" DATE,
    "tx_estado" TEXT,
    "tx_fecha" DATE,
    "tx_ips" TEXT,
    "tx_contra" TEXT,
    "vacuna_vhb" TEXT,
    "vhb_no_respondedor" TEXT,
    "paratiroidectomia" TEXT,
    "bdua" TEXT,
    "novedad_cac" TEXT,
    "metas" TEXT,
    "obs" TEXT,
    "usuario" TEXT,
    "actualizado" TEXT,
    "persona_id" UUID NOT NULL,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hd_paciente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hd_movimiento" (
    "id" TEXT NOT NULL,
    "paciente" TEXT,
    "fecha" DATE,
    "tipo" TEXT,
    "detalle" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hd_movimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hd_sesion" (
    "id" TEXT NOT NULL,
    "fecha" DATE,
    "paciente" TEXT,
    "turno" TEXT,
    "puesto" DOUBLE PRECISION,
    "tipo" TEXT,
    "motivo_extra" TEXT,
    "por_contrato" TEXT,
    "reprograma" DATE,
    "estado" TEXT,
    "motivo" TEXT,
    "responsable" TEXT,
    "nota" TEXT,
    "duracion_min" DOUBLE PRECISION,
    "acceso" TEXT,
    "peso_pre" DOUBLE PRECISION,
    "peso_post" DOUBLE PRECISION,
    "tas_pre" DOUBLE PRECISION,
    "tad_pre" DOUBLE PRECISION,
    "tas_post" DOUBLE PRECISION,
    "tad_post" DOUBLE PRECISION,
    "gluco" DOUBLE PRECISION,
    "kt_vocm" DOUBLE PRECISION,
    "uf_neta" DOUBLE PRECISION,
    "ufr" DOUBLE PRECISION,
    "uf_maquina" DOUBLE PRECISION,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hd_sesion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hd_evento" (
    "id" TEXT NOT NULL,
    "fecha" DATE,
    "paciente" TEXT,
    "sesion" TEXT,
    "tipo" TEXT,
    "severidad" TEXT,
    "conducta" TEXT,
    "resuelto" TEXT,
    "hemocultivo" TEXT,
    "microorganismo" TEXT,
    "resistencia" TEXT,
    "fecha_cierre" DATE,
    "reporte_sp" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hd_evento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hd_paraclinico" (
    "id" TEXT NOT NULL,
    "paciente" TEXT,
    "fecha_toma" DATE,
    "examen" TEXT,
    "valor" TEXT,
    "metodo" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hd_paraclinico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hd_novedad" (
    "id" TEXT NOT NULL,
    "paciente" TEXT,
    "tipo" TEXT,
    "inicio" DATE,
    "fin" DATE,
    "descripcion" TEXT,
    "causa" TEXT,
    "atribuible" TEXT,
    "evitable" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hd_novedad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hd_contacto" (
    "id" TEXT NOT NULL,
    "paciente" TEXT,
    "fecha" DATE,
    "medio" TEXT,
    "resultado" TEXT,
    "nota" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hd_contacto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hd_acceso_novedad" (
    "id" TEXT NOT NULL,
    "paciente" TEXT,
    "fecha" DATE,
    "tipo" TEXT,
    "detalle" TEXT,
    "acceso_resultante" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hd_acceso_novedad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hd_atencion" (
    "id" TEXT NOT NULL,
    "paciente" TEXT,
    "fecha" DATE,
    "disciplina" TEXT,
    "nota" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hd_atencion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hd_valoracion" (
    "id" TEXT NOT NULL,
    "paciente" TEXT,
    "fecha" DATE,
    "mes" TEXT,
    "profesional" TEXT,
    "peso_seco" DOUBLE PRECISION,
    "diuresis" DOUBLE PRECISION,
    "calidad_puntaje" DOUBLE PRECISION,
    "calidad_categoria" TEXT,
    "enfermedad_actual" TEXT,
    "analisis" TEXT,
    "plan" TEXT,
    "datos" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hd_valoracion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hd_seguridad_paciente" (
    "id" TEXT NOT NULL,
    "fecha" DATE,
    "paciente" TEXT,
    "clasificacion" TEXT,
    "categoria" TEXT,
    "severidad" TEXT,
    "descripcion" TEXT,
    "accion_inmediata" TEXT,
    "analisis" TEXT,
    "causas" TEXT,
    "plan_mejora" TEXT,
    "responsable" TEXT,
    "estado" TEXT,
    "fecha_cierre" DATE,
    "evento" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hd_seguridad_paciente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hd_antimicrobiano" (
    "id" TEXT NOT NULL,
    "paciente" TEXT,
    "inicio" DATE,
    "fin" DATE,
    "antimicrobiano" TEXT,
    "dosis" TEXT,
    "via" TEXT,
    "indicacion" TEXT,
    "tipo" TEXT,
    "cultivo_previo" TEXT,
    "ajustado" TEXT,
    "evento" TEXT,
    "nota" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hd_antimicrobiano_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hd_auditoria_iaas" (
    "id" TEXT NOT NULL,
    "fecha" DATE,
    "tipo" TEXT,
    "observadas" DOUBLE PRECISION,
    "cumplidas" DOUBLE PRECISION,
    "observador" TEXT,
    "nota" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hd_auditoria_iaas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hd_prescripcion" (
    "id" TEXT NOT NULL,
    "paciente" TEXT,
    "medicamento" TEXT,
    "dosis" TEXT,
    "frecuencia" TEXT,
    "via" TEXT,
    "lugar" TEXT,
    "cantidad_mes" DOUBLE PRECISION,
    "unidad" TEXT,
    "inicio" DATE,
    "fin" DATE,
    "mipres" TEXT,
    "nota" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hd_prescripcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hd_dispensacion" (
    "id" TEXT NOT NULL,
    "mes" TEXT,
    "paciente" TEXT,
    "prescripcion" TEXT,
    "medicamento" TEXT,
    "prescrita" DOUBLE PRECISION,
    "entregada" DOUBLE PRECISION,
    "estado" TEXT,
    "motivo" TEXT,
    "fecha" DATE,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hd_dispensacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hd_estudio" (
    "id" TEXT NOT NULL,
    "paciente" TEXT,
    "fecha" DATE,
    "tipo" TEXT,
    "nombre" TEXT,
    "resultado" TEXT,
    "relevante" TEXT,
    "seguimiento" TEXT,
    "proximo_control" DATE,
    "soporte" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hd_estudio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hd_vacuna" (
    "id" TEXT NOT NULL,
    "paciente" TEXT,
    "vacuna" TEXT,
    "esquema" TEXT,
    "serie" TEXT,
    "num_dosis" DOUBLE PRECISION,
    "fecha" DATE,
    "lote" TEXT,
    "observacion" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hd_vacuna_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hd_trasplante_item" (
    "id" TEXT NOT NULL,
    "paciente" TEXT,
    "item" TEXT,
    "estado" TEXT,
    "fecha" DATE,
    "resultado" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hd_trasplante_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hd_solicitud_lab" (
    "id" TEXT NOT NULL,
    "mes" TEXT,
    "programa" TEXT,
    "paciente" TEXT,
    "examen" TEXT,
    "origen" TEXT,
    "motivo" TEXT,
    "estado" TEXT,
    "fecha_toma" DATE,
    "nota" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hd_solicitud_lab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hd_corte" (
    "id" TEXT NOT NULL,
    "fecha_corte" DATE,
    "inicio_periodo" DATE,
    "eps" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "datos" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hd_corte_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hd_paciente_persona_id_key" ON "hd_paciente"("persona_id");

-- CreateIndex
CREATE INDEX "hd_movimiento_paciente_idx" ON "hd_movimiento"("paciente");

-- CreateIndex
CREATE INDEX "hd_movimiento_fecha_idx" ON "hd_movimiento"("fecha");

-- CreateIndex
CREATE INDEX "hd_sesion_paciente_idx" ON "hd_sesion"("paciente");

-- CreateIndex
CREATE INDEX "hd_sesion_fecha_idx" ON "hd_sesion"("fecha");

-- CreateIndex
CREATE INDEX "hd_evento_paciente_idx" ON "hd_evento"("paciente");

-- CreateIndex
CREATE INDEX "hd_evento_fecha_idx" ON "hd_evento"("fecha");

-- CreateIndex
CREATE INDEX "hd_paraclinico_paciente_idx" ON "hd_paraclinico"("paciente");

-- CreateIndex
CREATE INDEX "hd_paraclinico_fecha_toma_idx" ON "hd_paraclinico"("fecha_toma");

-- CreateIndex
CREATE INDEX "hd_novedad_paciente_idx" ON "hd_novedad"("paciente");

-- CreateIndex
CREATE INDEX "hd_novedad_inicio_idx" ON "hd_novedad"("inicio");

-- CreateIndex
CREATE INDEX "hd_contacto_paciente_idx" ON "hd_contacto"("paciente");

-- CreateIndex
CREATE INDEX "hd_contacto_fecha_idx" ON "hd_contacto"("fecha");

-- CreateIndex
CREATE INDEX "hd_acceso_novedad_paciente_idx" ON "hd_acceso_novedad"("paciente");

-- CreateIndex
CREATE INDEX "hd_acceso_novedad_fecha_idx" ON "hd_acceso_novedad"("fecha");

-- CreateIndex
CREATE INDEX "hd_atencion_paciente_idx" ON "hd_atencion"("paciente");

-- CreateIndex
CREATE INDEX "hd_atencion_fecha_idx" ON "hd_atencion"("fecha");

-- CreateIndex
CREATE INDEX "hd_valoracion_paciente_idx" ON "hd_valoracion"("paciente");

-- CreateIndex
CREATE INDEX "hd_valoracion_fecha_idx" ON "hd_valoracion"("fecha");

-- CreateIndex
CREATE INDEX "hd_valoracion_mes_idx" ON "hd_valoracion"("mes");

-- CreateIndex
CREATE INDEX "hd_seguridad_paciente_paciente_idx" ON "hd_seguridad_paciente"("paciente");

-- CreateIndex
CREATE INDEX "hd_seguridad_paciente_fecha_idx" ON "hd_seguridad_paciente"("fecha");

-- CreateIndex
CREATE INDEX "hd_antimicrobiano_paciente_idx" ON "hd_antimicrobiano"("paciente");

-- CreateIndex
CREATE INDEX "hd_antimicrobiano_inicio_idx" ON "hd_antimicrobiano"("inicio");

-- CreateIndex
CREATE INDEX "hd_auditoria_iaas_fecha_idx" ON "hd_auditoria_iaas"("fecha");

-- CreateIndex
CREATE INDEX "hd_prescripcion_paciente_idx" ON "hd_prescripcion"("paciente");

-- CreateIndex
CREATE INDEX "hd_prescripcion_inicio_idx" ON "hd_prescripcion"("inicio");

-- CreateIndex
CREATE INDEX "hd_dispensacion_paciente_idx" ON "hd_dispensacion"("paciente");

-- CreateIndex
CREATE INDEX "hd_dispensacion_fecha_idx" ON "hd_dispensacion"("fecha");

-- CreateIndex
CREATE INDEX "hd_dispensacion_mes_idx" ON "hd_dispensacion"("mes");

-- CreateIndex
CREATE INDEX "hd_estudio_paciente_idx" ON "hd_estudio"("paciente");

-- CreateIndex
CREATE INDEX "hd_estudio_fecha_idx" ON "hd_estudio"("fecha");

-- CreateIndex
CREATE INDEX "hd_vacuna_paciente_idx" ON "hd_vacuna"("paciente");

-- CreateIndex
CREATE INDEX "hd_vacuna_fecha_idx" ON "hd_vacuna"("fecha");

-- CreateIndex
CREATE INDEX "hd_trasplante_item_paciente_idx" ON "hd_trasplante_item"("paciente");

-- CreateIndex
CREATE INDEX "hd_trasplante_item_fecha_idx" ON "hd_trasplante_item"("fecha");

-- CreateIndex
CREATE INDEX "hd_solicitud_lab_paciente_idx" ON "hd_solicitud_lab"("paciente");

-- CreateIndex
CREATE INDEX "hd_solicitud_lab_fecha_toma_idx" ON "hd_solicitud_lab"("fecha_toma");

-- CreateIndex
CREATE INDEX "hd_solicitud_lab_mes_idx" ON "hd_solicitud_lab"("mes");

-- AddForeignKey
ALTER TABLE "hd_paciente" ADD CONSTRAINT "hd_paciente_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
