-- CreateTable
CREATE TABLE "portal_mensaje" (
    "id" TEXT NOT NULL,
    "hilo" TEXT,
    "fecha_hora" TEXT,
    "de" TEXT,
    "para" TEXT,
    "tipo" TEXT,
    "prioridad" TEXT,
    "asunto" TEXT,
    "cuerpo" TEXT,
    "paciente" TEXT,
    "programa" TEXT,
    "plazo" TEXT,
    "estado" TEXT,
    "leido_en" TEXT,
    "leido_por" TEXT,
    "cerrado_en" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_mensaje_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_comite" (
    "id" TEXT NOT NULL,
    "nombre" TEXT,
    "frecuencia" TEXT,
    "mes_inicio" TEXT,
    "norma" TEXT,
    "responsable" TEXT,
    "integrantes" TEXT,
    "activo" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_comite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_comite_sesion" (
    "id" TEXT NOT NULL,
    "comite" TEXT,
    "periodo" TEXT,
    "fecha" TEXT,
    "acta" TEXT,
    "enlace" TEXT,
    "asistentes" TEXT,
    "quorum" TEXT,
    "estado" TEXT,
    "nota" TEXT,
    "usuario" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_comite_sesion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_compromiso" (
    "id" TEXT NOT NULL,
    "comite" TEXT,
    "sesion" TEXT,
    "descripcion" TEXT,
    "responsable" TEXT,
    "fecha_limite" TEXT,
    "estado" TEXT,
    "fecha_cierre" TEXT,
    "evidencia" TEXT,
    "usuario" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_compromiso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_documento" (
    "id" TEXT NOT NULL,
    "codigo" TEXT,
    "nombre" TEXT,
    "tipo" TEXT,
    "programas" TEXT,
    "proceso" TEXT,
    "version" TEXT,
    "fecha_aprobacion" TEXT,
    "proxima_revision" TEXT,
    "estado" TEXT,
    "enlace" TEXT,
    "responsable" TEXT,
    "fuente" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_lista_chequeo" (
    "id" TEXT NOT NULL,
    "fecha" TEXT,
    "turno" TEXT,
    "programa" TEXT,
    "lista" TEXT,
    "lugar" TEXT,
    "resultado" TEXT,
    "cumplidos" TEXT,
    "aplicables" TEXT,
    "observador" TEXT,
    "observacion" TEXT,
    "usuario" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_lista_chequeo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_aporte_manual" (
    "id" TEXT NOT NULL,
    "periodo" TEXT,
    "matriz" TEXT,
    "indicador" TEXT,
    "programa" TEXT,
    "numerador" TEXT,
    "denominador" TEXT,
    "nota" TEXT,
    "usuario" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_aporte_manual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_proa_auditoria" (
    "id" TEXT NOT NULL,
    "fecha" TEXT,
    "fuente" TEXT,
    "ref" TEXT,
    "programa" TEXT,
    "paciente" TEXT,
    "antimicrobiano" TEXT,
    "restringido" TEXT,
    "justificado" TEXT,
    "autorizado" TEXT,
    "acorde_guia" TEXT,
    "reevaluado" TEXT,
    "duracion_conforme" TEXT,
    "nota" TEXT,
    "usuario" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_proa_auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_alerta_ram" (
    "id" TEXT NOT NULL,
    "fecha" TEXT,
    "evento" TEXT,
    "programa" TEXT,
    "paciente" TEXT,
    "microorganismo" TEXT,
    "resistencia" TEXT,
    "analizada" TEXT,
    "conducta" TEXT,
    "usuario" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_alerta_ram_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_calendario" (
    "id" TEXT NOT NULL,
    "titulo" TEXT,
    "tipo" TEXT,
    "comite" TEXT,
    "fecha" TEXT,
    "hora_inicio" TEXT,
    "hora_fin" TEXT,
    "modalidad" TEXT,
    "lugar" TEXT,
    "enlace" TEXT,
    "responsable" TEXT,
    "invitados" TEXT,
    "programa" TEXT,
    "visibilidad" TEXT,
    "descripcion" TEXT,
    "estado" TEXT,
    "respuestas" TEXT,
    "serie" TEXT,
    "nota" TEXT,
    "creador" TEXT,
    "registrado" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_calendario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_produccion" (
    "id" TEXT NOT NULL,
    "fecha" TEXT,
    "programa" TEXT,
    "eps" TEXT,
    "paciente" TEXT,
    "actividad" TEXT,
    "cups" TEXT,
    "cantidad" TEXT,
    "nota" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_produccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_reporte_sp" (
    "id" TEXT NOT NULL,
    "fecha" TEXT,
    "programa" TEXT,
    "paciente" TEXT,
    "clasificacion" TEXT,
    "categoria" TEXT,
    "severidad" TEXT,
    "descripcion" TEXT,
    "accion_inmediata" TEXT,
    "analisis" TEXT,
    "plan_mejora" TEXT,
    "responsable" TEXT,
    "estado" TEXT,
    "fecha_cierre" TEXT,
    "usuario" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_reporte_sp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nefro_paciente" (
    "id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "persona_id" UUID NOT NULL,
    "nombre_completo" TEXT NOT NULL,
    "telefono_2" TEXT,
    "correo" TEXT,
    "acudiente_nombre" TEXT,
    "acudiente_telefono" TEXT,
    "fecha_ingreso" DATE,
    "hta" BOOLEAN,
    "diabetes" TEXT,
    "enf_cardiovascular" BOOLEAN,
    "causa_erc" TEXT,
    "situacion_renal" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'ACTIVO',
    "fecha_estado" DATE,
    "observaciones" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nefro_paciente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nefro_laboratorio" (
    "id" UUID NOT NULL,
    "paciente_id" UUID NOT NULL,
    "fecha_toma" DATE NOT NULL,
    "examen" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "anulado" BOOLEAN NOT NULL DEFAULT false,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "anulado_por" UUID,
    "anulado_en" TIMESTAMPTZ(3),

    CONSTRAINT "nefro_laboratorio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nefro_valoracion" (
    "id" UUID NOT NULL,
    "paciente_id" UUID NOT NULL,
    "fecha" DATE NOT NULL,
    "datos" JSONB NOT NULL,
    "anulado" BOOLEAN NOT NULL DEFAULT false,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "anulado_por" UUID,
    "anulado_en" TIMESTAMPTZ(3),

    CONSTRAINT "nefro_valoracion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nefro_plan_item" (
    "id" UUID NOT NULL,
    "valoracion_id" UUID NOT NULL,
    "orden" INTEGER NOT NULL,
    "datos" JSONB NOT NULL,

    CONSTRAINT "nefro_plan_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nefro_atencion" (
    "id" UUID NOT NULL,
    "paciente_id" UUID NOT NULL,
    "fecha" DATE NOT NULL,
    "disciplina" TEXT NOT NULL,
    "estado" TEXT,
    "anulado" BOOLEAN NOT NULL DEFAULT false,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "anulado_por" UUID,
    "anulado_en" TIMESTAMPTZ(3),

    CONSTRAINT "nefro_atencion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nefro_novedad" (
    "id" UUID NOT NULL,
    "paciente_id" UUID NOT NULL,
    "fecha" DATE NOT NULL,
    "tipo" TEXT NOT NULL,
    "detalle" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nefro_novedad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nefro_contacto" (
    "id" UUID NOT NULL,
    "paciente_id" UUID NOT NULL,
    "fecha_hora" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "medio" TEXT NOT NULL,
    "resultado" TEXT NOT NULL,
    "cita_fecha" DATE,
    "motivo" TEXT,
    "observaciones" TEXT,
    "creado_por" UUID,

    CONSTRAINT "nefro_contacto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eps_modelo_atencion" (
    "id" UUID NOT NULL,
    "eps_id" INTEGER NOT NULL,
    "contacto_intermedio" TEXT,
    "contacto_meses" INTEGER,
    "ajuste_metas_por" TEXT,
    "multidisciplinario" TEXT,
    "medicamentos_contratados" BOOLEAN,
    "observaciones" TEXT,
    "vigente_desde" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" UUID,

    CONSTRAINT "eps_modelo_atencion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nefro_corte" (
    "id" UUID NOT NULL,
    "fecha_corte" DATE NOT NULL,
    "version" TEXT,
    "resumen" JSONB NOT NULL,
    "detalle" JSONB NOT NULL,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nefro_corte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nefro_agenda_fila" (
    "hoja" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "datos" JSONB NOT NULL,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nefro_agenda_fila_pkey" PRIMARY KEY ("hoja","clave")
);

-- CreateIndex
CREATE INDEX "portal_mensaje_paciente_idx" ON "portal_mensaje"("paciente");

-- CreateIndex
CREATE INDEX "portal_comite_sesion_fecha_idx" ON "portal_comite_sesion"("fecha");

-- CreateIndex
CREATE INDEX "portal_lista_chequeo_fecha_idx" ON "portal_lista_chequeo"("fecha");

-- CreateIndex
CREATE INDEX "portal_proa_auditoria_paciente_idx" ON "portal_proa_auditoria"("paciente");

-- CreateIndex
CREATE INDEX "portal_proa_auditoria_fecha_idx" ON "portal_proa_auditoria"("fecha");

-- CreateIndex
CREATE INDEX "portal_alerta_ram_paciente_idx" ON "portal_alerta_ram"("paciente");

-- CreateIndex
CREATE INDEX "portal_alerta_ram_fecha_idx" ON "portal_alerta_ram"("fecha");

-- CreateIndex
CREATE INDEX "portal_calendario_fecha_idx" ON "portal_calendario"("fecha");

-- CreateIndex
CREATE INDEX "portal_produccion_paciente_idx" ON "portal_produccion"("paciente");

-- CreateIndex
CREATE INDEX "portal_produccion_fecha_idx" ON "portal_produccion"("fecha");

-- CreateIndex
CREATE INDEX "portal_reporte_sp_paciente_idx" ON "portal_reporte_sp"("paciente");

-- CreateIndex
CREATE INDEX "portal_reporte_sp_fecha_idx" ON "portal_reporte_sp"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "nefro_paciente_codigo_key" ON "nefro_paciente"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "nefro_paciente_persona_id_key" ON "nefro_paciente"("persona_id");

-- CreateIndex
CREATE INDEX "nefro_laboratorio_paciente_id_fecha_toma_idx" ON "nefro_laboratorio"("paciente_id", "fecha_toma");

-- CreateIndex
CREATE INDEX "nefro_valoracion_paciente_id_fecha_idx" ON "nefro_valoracion"("paciente_id", "fecha");

-- CreateIndex
CREATE INDEX "nefro_plan_item_valoracion_id_idx" ON "nefro_plan_item"("valoracion_id");

-- CreateIndex
CREATE INDEX "nefro_atencion_paciente_id_fecha_idx" ON "nefro_atencion"("paciente_id", "fecha");

-- CreateIndex
CREATE INDEX "nefro_novedad_paciente_id_fecha_idx" ON "nefro_novedad"("paciente_id", "fecha");

-- CreateIndex
CREATE INDEX "nefro_contacto_paciente_id_idx" ON "nefro_contacto"("paciente_id");

-- CreateIndex
CREATE INDEX "eps_modelo_atencion_eps_id_vigente_desde_idx" ON "eps_modelo_atencion"("eps_id", "vigente_desde");

-- AddForeignKey
ALTER TABLE "nefro_paciente" ADD CONSTRAINT "nefro_paciente_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nefro_laboratorio" ADD CONSTRAINT "nefro_laboratorio_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "nefro_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nefro_valoracion" ADD CONSTRAINT "nefro_valoracion_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "nefro_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nefro_plan_item" ADD CONSTRAINT "nefro_plan_item_valoracion_id_fkey" FOREIGN KEY ("valoracion_id") REFERENCES "nefro_valoracion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nefro_atencion" ADD CONSTRAINT "nefro_atencion_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "nefro_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nefro_novedad" ADD CONSTRAINT "nefro_novedad_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "nefro_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nefro_contacto" ADD CONSTRAINT "nefro_contacto_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "nefro_paciente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eps_modelo_atencion" ADD CONSTRAINT "eps_modelo_atencion_eps_id_fkey" FOREIGN KEY ("eps_id") REFERENCES "eps"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
