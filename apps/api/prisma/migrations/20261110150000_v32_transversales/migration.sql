-- Fase C (v3.2, 10 nov 2026): registros transversales en el libro institucional del portal.
--   · portal_preconsulta, portal_asistencia_actividad, portal_procedimiento, portal_vacunacion_renal, portal_soporte_siscac:
--     antes en el navegador (localStorage) o en la configuración; cada fila lleva su programa (la ve y la registra quien
--     tiene ese programa).
--   · portal_quimioterapia_sesion, portal_capacitacion, portal_liberacion_reporte: hojas nuevas de la v2.1.
-- Solo crea tablas (nada se borra ni cambia de tipo). Generada con prisma migrate diff desde el esquema anterior.

-- CreateTable
CREATE TABLE "portal_quimioterapia_sesion" (
    "id" TEXT NOT NULL,
    "fecha" TEXT,
    "paciente" TEXT,
    "nombre" TEXT,
    "eps" TEXT,
    "esquema" TEXT,
    "ciclo" TEXT,
    "medicamentos" TEXT,
    "doble_verif" TEXT,
    "extravasacion" TEXT,
    "reaccion" TEXT,
    "conducta" TEXT,
    "estado" TEXT,
    "profesional" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_quimioterapia_sesion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_capacitacion" (
    "id" TEXT NOT NULL,
    "fecha" TEXT,
    "hora" TEXT,
    "programa" TEXT,
    "proceso" TEXT,
    "tema" TEXT,
    "modalidad" TEXT,
    "facilitador" TEXT,
    "objetivo" TEXT,
    "asistentes" TEXT,
    "total_asistentes" TEXT,
    "evaluacion_pre_post" TEXT,
    "evidencia" TEXT,
    "estado" TEXT,
    "origen" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_capacitacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_liberacion_reporte" (
    "id" TEXT NOT NULL,
    "fecha" TEXT,
    "programa" TEXT,
    "reporte" TEXT,
    "periodo" TEXT,
    "eps" TEXT,
    "registros" TEXT,
    "bloqueantes" TEXT,
    "advertencias" TEXT,
    "soportes_verificados" TEXT,
    "dictamen" TEXT,
    "auditor" TEXT,
    "observacion" TEXT,
    "registrado" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_liberacion_reporte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_preconsulta" (
    "id" TEXT NOT NULL,
    "fecha" TEXT,
    "programa" TEXT,
    "paciente" TEXT,
    "pas" TEXT,
    "pad" TEXT,
    "fc" TEXT,
    "fr" TEXT,
    "temp" TEXT,
    "sat_o2" TEXT,
    "peso" TEXT,
    "talla" TEXT,
    "cintura" TEXT,
    "glucometria" TEXT,
    "auxiliar" TEXT,
    "listo" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_preconsulta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_asistencia_actividad" (
    "id" TEXT NOT NULL,
    "programa" TEXT,
    "paciente" TEXT,
    "disciplina" TEXT,
    "mes" TEXT,
    "resultado" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_asistencia_actividad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_procedimiento" (
    "id" TEXT NOT NULL,
    "fecha" TEXT,
    "programa" TEXT,
    "paciente" TEXT,
    "procedimiento" TEXT,
    "sitio" TEXT,
    "lote" TEXT,
    "responsable" TEXT,
    "solicitud_desinfeccion" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_procedimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_vacunacion_renal" (
    "id" TEXT NOT NULL,
    "programa" TEXT,
    "paciente" TEXT,
    "vhb" TEXT,
    "anti_h_bs" TEXT,
    "influenza" TEXT,
    "neumococo_conjugada" TEXT,
    "neumococo_polisacarida" TEXT,
    "covid" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_vacunacion_renal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_soporte_siscac" (
    "id" TEXT NOT NULL,
    "programa" TEXT,
    "paciente" TEXT,
    "soportes" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_soporte_siscac_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "portal_quimioterapia_sesion_paciente_idx" ON "portal_quimioterapia_sesion"("paciente");

-- CreateIndex
CREATE INDEX "portal_quimioterapia_sesion_fecha_idx" ON "portal_quimioterapia_sesion"("fecha");

-- CreateIndex
CREATE INDEX "portal_capacitacion_fecha_idx" ON "portal_capacitacion"("fecha");

-- CreateIndex
CREATE INDEX "portal_liberacion_reporte_fecha_idx" ON "portal_liberacion_reporte"("fecha");

-- CreateIndex
CREATE INDEX "portal_preconsulta_paciente_idx" ON "portal_preconsulta"("paciente");

-- CreateIndex
CREATE INDEX "portal_preconsulta_fecha_idx" ON "portal_preconsulta"("fecha");

-- CreateIndex
CREATE INDEX "portal_asistencia_actividad_paciente_idx" ON "portal_asistencia_actividad"("paciente");

-- CreateIndex
CREATE INDEX "portal_asistencia_actividad_mes_idx" ON "portal_asistencia_actividad"("mes");

-- CreateIndex
CREATE INDEX "portal_procedimiento_paciente_idx" ON "portal_procedimiento"("paciente");

-- CreateIndex
CREATE INDEX "portal_procedimiento_fecha_idx" ON "portal_procedimiento"("fecha");

-- CreateIndex
CREATE INDEX "portal_vacunacion_renal_paciente_idx" ON "portal_vacunacion_renal"("paciente");

-- CreateIndex
CREATE INDEX "portal_soporte_siscac_paciente_idx" ON "portal_soporte_siscac"("paciente");

