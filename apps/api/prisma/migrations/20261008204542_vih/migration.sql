-- CreateTable
CREATE TABLE "vih_paciente" (
    "id" TEXT NOT NULL,
    "contacto_red" TEXT,
    "poblacion_clave" TEXT,
    "natural_de" TEXT,
    "escolaridad" TEXT,
    "ocupacion" TEXT,
    "estado_civil" TEXT,
    "mecanismo" TEXT,
    "tipo_ingreso" TEXT,
    "fecha_dx" TEXT,
    "fecha_presentacion" TEXT,
    "fecha_ingreso_ips" TEXT,
    "oportunista_dx" TEXT,
    "modalidad" TEXT,
    "sede" TEXT,
    "gestante" TEXT,
    "ult_atencion_ext" TEXT,
    "cie10" TEXT,
    "orientacion_sexual" TEXT,
    "practica_anal" TEXT,
    "tar_previo" TEXT,
    "tar_previo_detalle" TEXT,
    "dx_otra_ips" TEXT,
    "soporte_dx" TEXT,
    "motivo_tamizaje" TEXT,
    "pruebas_dx" TEXT,
    "barreras" TEXT,
    "novedad_nominal" TEXT,
    "estado" TEXT,
    "fecha_egreso" TEXT,
    "motivo_egreso" TEXT,
    "observaciones" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "persona_id" UUID NOT NULL,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vih_paciente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vih_antecedente" (
    "id" TEXT NOT NULL,
    "paciente" TEXT,
    "fecha" TEXT,
    "patologicos" TEXT,
    "oportunistas" TEXT,
    "its" TEXT,
    "tb" TEXT,
    "quirurgicos" TEXT,
    "farm_no_tar" TEXT,
    "toxicos" TEXT,
    "alergicos" TEXT,
    "transfusionales" TEXT,
    "traumaticos" TEXT,
    "psiquiatricos" TEXT,
    "psicosociales" TEXT,
    "discapacidad" TEXT,
    "familiares" TEXT,
    "grupo_sanguineo" TEXT,
    "ginecoobstetricos" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vih_antecedente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vih_laboratorio" (
    "id" TEXT NOT NULL,
    "paciente" TEXT,
    "fecha_toma" TEXT,
    "examen" TEXT,
    "valor" TEXT,
    "resultado" TEXT,
    "fuente" TEXT,
    "solicitud" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vih_laboratorio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vih_esquema_tar" (
    "id" TEXT NOT NULL,
    "paciente" TEXT,
    "inicio" TEXT,
    "fin" TEXT,
    "esquema" TEXT,
    "linea" TEXT,
    "motivo" TEXT,
    "tar_previo" TEXT,
    "validacion" TEXT,
    "validado_por" TEXT,
    "fecha_validacion" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vih_esquema_tar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vih_entrega_tar" (
    "id" TEXT NOT NULL,
    "paciente" TEXT,
    "fecha" TEXT,
    "esquema" TEXT,
    "meses" TEXT,
    "unidades" TEXT,
    "lugar" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vih_entrega_tar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vih_cita" (
    "id" TEXT NOT NULL,
    "paciente" TEXT,
    "fecha" TEXT,
    "hora" TEXT,
    "disciplina" TEXT,
    "tipo" TEXT,
    "modalidad" TEXT,
    "profesional" TEXT,
    "estado" TEXT,
    "motivo" TEXT,
    "gestion" TEXT,
    "fecha_gestion" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vih_cita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vih_valoracion" (
    "id" TEXT NOT NULL,
    "paciente" TEXT,
    "fecha" TEXT,
    "cita" TEXT,
    "disciplina" TEXT,
    "profesional" TEXT,
    "motivo" TEXT,
    "peso" TEXT,
    "talla" TEXT,
    "per_abd" TEXT,
    "pas" TEXT,
    "pad" TEXT,
    "fc" TEXT,
    "fr" TEXT,
    "temp" TEXT,
    "sat_o2" TEXT,
    "smaq" TEXT,
    "sma_qd" TEXT,
    "rcv" TEXT,
    "rcv_cat" TEXT,
    "tamiz_tb" TEXT,
    "fumador" TEXT,
    "riesgo_social" TEXT,
    "enfermedad_actual" TEXT,
    "revision_sistemas" TEXT,
    "examen_fisico" TEXT,
    "diagnosticos" TEXT,
    "educacion" TEXT,
    "extra" TEXT,
    "analisis" TEXT,
    "plan" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vih_valoracion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vih_vacuna" (
    "id" TEXT NOT NULL,
    "paciente" TEXT,
    "vacuna" TEXT,
    "dosis" TEXT,
    "fecha" TEXT,
    "lote" TEXT,
    "estado" TEXT,
    "soporte" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vih_vacuna_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vih_procedimiento" (
    "id" TEXT NOT NULL,
    "paciente" TEXT,
    "tipo" TEXT,
    "ordenado" TEXT,
    "ordenado_por" TEXT,
    "fecha" TEXT,
    "lote" TEXT,
    "fecha_lectura" TEXT,
    "lectura" TEXT,
    "resultado" TEXT,
    "conducta" TEXT,
    "proxima_fecha" TEXT,
    "estado" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vih_procedimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vih_profilaxis" (
    "id" TEXT NOT NULL,
    "paciente" TEXT,
    "medicamento" TEXT,
    "indicacion" TEXT,
    "inicio" TEXT,
    "fin" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vih_profilaxis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vih_novedad" (
    "id" TEXT NOT NULL,
    "paciente" TEXT,
    "fecha" TEXT,
    "tipo" TEXT,
    "detalle" TEXT,
    "fecha_fin" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vih_novedad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vih_solicitud_lab" (
    "id" TEXT NOT NULL,
    "mes" TEXT,
    "paciente" TEXT,
    "examen" TEXT,
    "origen" TEXT,
    "motivo" TEXT,
    "estado" TEXT,
    "fecha_toma" TEXT,
    "nota" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vih_solicitud_lab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vih_arrastre_cac" (
    "paciente" TEXT NOT NULL,
    "corte" TEXT,
    "fuente" TEXT,
    "datos" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vih_arrastre_cac_pkey" PRIMARY KEY ("paciente")
);

-- CreateIndex
CREATE UNIQUE INDEX "vih_paciente_persona_id_key" ON "vih_paciente"("persona_id");

-- CreateIndex
CREATE INDEX "vih_antecedente_paciente_idx" ON "vih_antecedente"("paciente");

-- CreateIndex
CREATE INDEX "vih_antecedente_fecha_idx" ON "vih_antecedente"("fecha");

-- CreateIndex
CREATE INDEX "vih_laboratorio_paciente_idx" ON "vih_laboratorio"("paciente");

-- CreateIndex
CREATE INDEX "vih_laboratorio_fecha_toma_idx" ON "vih_laboratorio"("fecha_toma");

-- CreateIndex
CREATE INDEX "vih_esquema_tar_paciente_idx" ON "vih_esquema_tar"("paciente");

-- CreateIndex
CREATE INDEX "vih_esquema_tar_inicio_idx" ON "vih_esquema_tar"("inicio");

-- CreateIndex
CREATE INDEX "vih_entrega_tar_paciente_idx" ON "vih_entrega_tar"("paciente");

-- CreateIndex
CREATE INDEX "vih_entrega_tar_fecha_idx" ON "vih_entrega_tar"("fecha");

-- CreateIndex
CREATE INDEX "vih_cita_paciente_idx" ON "vih_cita"("paciente");

-- CreateIndex
CREATE INDEX "vih_cita_fecha_idx" ON "vih_cita"("fecha");

-- CreateIndex
CREATE INDEX "vih_valoracion_paciente_idx" ON "vih_valoracion"("paciente");

-- CreateIndex
CREATE INDEX "vih_valoracion_fecha_idx" ON "vih_valoracion"("fecha");

-- CreateIndex
CREATE INDEX "vih_vacuna_paciente_idx" ON "vih_vacuna"("paciente");

-- CreateIndex
CREATE INDEX "vih_vacuna_fecha_idx" ON "vih_vacuna"("fecha");

-- CreateIndex
CREATE INDEX "vih_procedimiento_paciente_idx" ON "vih_procedimiento"("paciente");

-- CreateIndex
CREATE INDEX "vih_procedimiento_fecha_idx" ON "vih_procedimiento"("fecha");

-- CreateIndex
CREATE INDEX "vih_profilaxis_paciente_idx" ON "vih_profilaxis"("paciente");

-- CreateIndex
CREATE INDEX "vih_profilaxis_inicio_idx" ON "vih_profilaxis"("inicio");

-- CreateIndex
CREATE INDEX "vih_novedad_paciente_idx" ON "vih_novedad"("paciente");

-- CreateIndex
CREATE INDEX "vih_novedad_fecha_idx" ON "vih_novedad"("fecha");

-- CreateIndex
CREATE INDEX "vih_solicitud_lab_paciente_idx" ON "vih_solicitud_lab"("paciente");

-- CreateIndex
CREATE INDEX "vih_solicitud_lab_fecha_toma_idx" ON "vih_solicitud_lab"("fecha_toma");

-- CreateIndex
CREATE INDEX "vih_solicitud_lab_mes_idx" ON "vih_solicitud_lab"("mes");

-- AddForeignKey
ALTER TABLE "vih_paciente" ADD CONSTRAINT "vih_paciente_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
