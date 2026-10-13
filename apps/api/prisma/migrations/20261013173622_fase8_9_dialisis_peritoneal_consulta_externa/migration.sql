-- CreateTable
CREATE TABLE "dp_paciente" (
    "id" TEXT NOT NULL,
    "id_inst" TEXT,
    "nombre_fuente" TEXT,
    "cuidador" TEXT,
    "tel_cuidador" TEXT,
    "modalidad" TEXT,
    "modalidad_fuente" TEXT,
    "estado_programa" TEXT,
    "fecha_ingreso_programa" DATE,
    "fecha_inicio_trr" DATE,
    "fecha_cateter" DATE,
    "fecha_inicio_dp" DATE,
    "fecha_fin_dp" DATE,
    "motivo_fin" TEXT,
    "etiologia" TEXT,
    "hta" TEXT,
    "dm" TEXT,
    "comorbilidades" TEXT,
    "talla" DOUBLE PRECISION,
    "paratiroidectomia" TEXT,
    "antineoplasicos" TEXT,
    "vacuna_vhb" TEXT,
    "cac" TEXT,
    "verif" TEXT,
    "origen" TEXT,
    "obs" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "persona_id" UUID NOT NULL,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dp_paciente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dp_episodio" (
    "id" TEXT NOT NULL,
    "paciente" TEXT,
    "tipo" TEXT,
    "fecha" DATE,
    "sintomas" TEXT,
    "leucocitos" DOUBLE PRECISION,
    "pmn" DOUBLE PRECISION,
    "permanencia_h" DOUBLE PRECISION,
    "dx_clinico" TEXT,
    "clasificacion" TEXT,
    "episodio_previo" TEXT,
    "tratamiento" TEXT,
    "fecha_resolucion" DATE,
    "desenlace" TEXT,
    "seguimiento" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dp_episodio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dp_antimicrobiano" (
    "id" TEXT NOT NULL,
    "paciente" TEXT,
    "episodio" TEXT,
    "inicio" DATE,
    "fin" DATE,
    "antimicrobiano" TEXT,
    "dosis" TEXT,
    "via" TEXT,
    "indicacion" TEXT,
    "tipo" TEXT,
    "duracion_prevista" DOUBLE PRECISION,
    "prescriptor" TEXT,
    "nota" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dp_antimicrobiano_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dp_transicion" (
    "id" TEXT NOT NULL,
    "paciente" TEXT,
    "fecha" DATE,
    "estado_anterior" TEXT,
    "estado_nuevo" TEXT,
    "modalidad_anterior" TEXT,
    "modalidad_nueva" TEXT,
    "motivo" TEXT,
    "destino" TEXT,
    "soporte" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dp_transicion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dp_valoracion" (
    "id" TEXT NOT NULL,
    "paciente" TEXT,
    "fecha" DATE,
    "tipo" TEXT,
    "profesional" TEXT,
    "estado" TEXT,
    "version" DOUBLE PRECISION,
    "version_de" TEXT,
    "motivo_correccion" TEXT,
    "datos" TEXT,
    "completitud" DOUBLE PRECISION,
    "finalizada_por" TEXT,
    "finalizada_en" TEXT,
    "agenda" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dp_valoracion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dp_laboratorio" (
    "id" TEXT NOT NULL,
    "paciente" TEXT,
    "examen" TEXT,
    "valor" TEXT,
    "unidad" TEXT,
    "fecha_toma" DATE,
    "fecha_resultado" DATE,
    "lab_origen" TEXT,
    "metodo" TEXT,
    "componentes" TEXT,
    "estado" TEXT,
    "reviso" TEXT,
    "fecha_revision" DATE,
    "version" DOUBLE PRECISION,
    "version_de" TEXT,
    "motivo" TEXT,
    "solicitud" TEXT,
    "soporte" TEXT,
    "observacion" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dp_laboratorio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dp_plan_laboratorio" (
    "id" TEXT NOT NULL,
    "paciente" TEXT,
    "examen" TEXT,
    "periodicidad" DOUBLE PRECISION,
    "meses" TEXT,
    "indicacion" TEXT,
    "fuente" TEXT,
    "estado" TEXT,
    "validado_por" TEXT,
    "fecha_validacion" DATE,
    "nota" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dp_plan_laboratorio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dp_solicitud_lab" (
    "id" TEXT NOT NULL,
    "mes" TEXT,
    "paciente" TEXT,
    "examen" TEXT,
    "origen" TEXT,
    "estado" TEXT,
    "fecha_toma" DATE,
    "motivo" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dp_solicitud_lab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dp_agenda" (
    "id" TEXT NOT NULL,
    "paciente" TEXT,
    "tipo" TEXT,
    "fecha" DATE,
    "hora" TEXT,
    "duracion_min" DOUBLE PRECISION,
    "profesional" TEXT,
    "modalidad" TEXT,
    "lugar" TEXT,
    "estado" TEXT,
    "fecha_realizacion" DATE,
    "resultado" TEXT,
    "registro" TEXT,
    "motivo" TEXT,
    "historial" TEXT,
    "origen" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dp_agenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dp_prescripcion" (
    "id" TEXT NOT NULL,
    "paciente" TEXT,
    "version" DOUBLE PRECISION,
    "modalidad" TEXT,
    "vigente_desde" DATE,
    "vigente_hasta" DATE,
    "prescriptor" TEXT,
    "motivo" TEXT,
    "peso_ref" DOUBLE PRECISION,
    "sistema" TEXT,
    "soluciones" TEXT,
    "volumen_total" DOUBLE PRECISION,
    "intercambios" DOUBLE PRECISION,
    "permanencia_noct" TEXT,
    "tiempo_total_h" DOUBLE PRECISION,
    "ciclos" DOUBLE PRECISION,
    "vol_ciclo" DOUBLE PRECISION,
    "tidal" DOUBLE PRECISION,
    "ultima_infusion" TEXT,
    "dia_seco" TEXT,
    "objetivos" TEXT,
    "obs" TEXT,
    "estado" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dp_prescripcion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dp_cateter" (
    "id" TEXT NOT NULL,
    "paciente" TEXT,
    "tipo" TEXT,
    "fecha" DATE,
    "tipo_cateter" TEXT,
    "datos" TEXT,
    "clasificacion" TEXT,
    "responsable" TEXT,
    "episodio" TEXT,
    "estado" TEXT,
    "fecha_cierre" DATE,
    "cierre" TEXT,
    "obs" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dp_cateter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dp_educacion" (
    "id" TEXT NOT NULL,
    "paciente" TEXT,
    "tipo" TEXT,
    "fecha" DATE,
    "responsable" TEXT,
    "participante" TEXT,
    "datos" TEXT,
    "resultado" TEXT,
    "riesgos" TEXT,
    "plan" TEXT,
    "seguimiento" TEXT,
    "estado" TEXT,
    "fecha_cierre" DATE,
    "cierre" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dp_educacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dp_insumo" (
    "id" TEXT NOT NULL,
    "paciente" TEXT,
    "insumo" TEXT,
    "cantidad" DOUBLE PRECISION,
    "periodo" TEXT,
    "vigente_desde" DATE,
    "estado" TEXT,
    "origen" TEXT,
    "nombre_fuente" TEXT,
    "sugerido" TEXT,
    "confianza" TEXT,
    "nota" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dp_insumo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dp_entrega" (
    "id" TEXT NOT NULL,
    "paciente" TEXT,
    "periodo" TEXT,
    "fecha_programada" DATE,
    "fecha_entrega" DATE,
    "items" TEXT,
    "estado" TEXT,
    "responsable" TEXT,
    "soporte_recibido" TEXT,
    "soporte" TEXT,
    "incidencia" TEXT,
    "contingencia" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dp_entrega_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dp_hospitalizacion" (
    "id" TEXT NOT NULL,
    "paciente" TEXT,
    "fecha_ingreso" DATE,
    "fecha_egreso" DATE,
    "mas24h" TEXT,
    "institucion" TEXT,
    "causa" TEXT,
    "relacion_dp" TEXT,
    "episodio" TEXT,
    "desenlace" TEXT,
    "estado" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dp_hospitalizacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dp_trasplante" (
    "id" TEXT NOT NULL,
    "paciente" TEXT,
    "fecha" DATE,
    "estado" TEXT,
    "contraindicaciones" TEXT,
    "centro" TEXT,
    "soporte" TEXT,
    "nota" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dp_trasplante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dp_calidad_vida" (
    "id" TEXT NOT NULL,
    "paciente" TEXT,
    "fecha" DATE,
    "escala" TEXT,
    "momento" TEXT,
    "puntaje" DOUBLE PRECISION,
    "profesional" TEXT,
    "soporte" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dp_calidad_vida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dp_heredado" (
    "id" TEXT NOT NULL,
    "clave" TEXT,
    "paciente" TEXT,
    "tipo" TEXT,
    "fecha_fuente" DATE,
    "anotacion" TEXT,
    "fuente" TEXT,
    "estado" TEXT,
    "verificacion" TEXT,
    "verificado_por" TEXT,
    "fecha_verificacion" DATE,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dp_heredado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dp_importacion" (
    "id" TEXT NOT NULL,
    "fecha_hora" TEXT,
    "archivos" TEXT,
    "importados" TEXT,
    "omitidos" TEXT,
    "duplicados" TEXT,
    "pendientes" TEXT,
    "detalle" TEXT,
    "usuario" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dp_importacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dp_corte_cac" (
    "id" TEXT NOT NULL,
    "fecha_corte" DATE,
    "inicio_periodo" DATE,
    "eps" TEXT,
    "pacientes" TEXT,
    "version" DOUBLE PRECISION,
    "estructura" TEXT,
    "estado" TEXT,
    "bloqueantes" TEXT,
    "advertencias" TEXT,
    "archivo" TEXT,
    "aprobado_por" TEXT,
    "fecha_aprobacion" DATE,
    "enviado_a" TEXT,
    "fecha_envio" DATE,
    "nota" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dp_corte_cac_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dp_corte_cac_detalle" (
    "clave" TEXT NOT NULL,
    "corte" TEXT,
    "paciente" TEXT,
    "datos" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dp_corte_cac_detalle_pkey" PRIMARY KEY ("clave")
);

-- CreateTable
CREATE TABLE "dp_plan_mejora" (
    "id" TEXT NOT NULL,
    "indicador" TEXT,
    "periodo" TEXT,
    "hallazgo" TEXT,
    "causa" TEXT,
    "accion" TEXT,
    "responsable" TEXT,
    "fecha_limite" DATE,
    "estado" TEXT,
    "evidencia" TEXT,
    "verificacion" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dp_plan_mejora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dp_rol" (
    "usuario" TEXT NOT NULL,
    "rol" TEXT,
    "activo" TEXT,
    "concedido_por" TEXT,
    "fecha" DATE,
    "motivo" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dp_rol_pkey" PRIMARY KEY ("usuario")
);

-- CreateTable
CREATE TABLE "dp_config" (
    "clave" TEXT NOT NULL,
    "valor" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dp_config_pkey" PRIMARY KEY ("clave")
);

-- CreateTable
CREATE TABLE "ce_paciente" (
    "id" TEXT NOT NULL,
    "telefono2" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "persona_id" UUID NOT NULL,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ce_paciente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ce_solicitud" (
    "id" TEXT NOT NULL,
    "paciente" TEXT,
    "especialidad" TEXT,
    "tipo_consulta" TEXT,
    "modalidad" TEXT,
    "fecha_solicitud" TEXT,
    "soporte_fecha" TEXT,
    "canal" TEXT,
    "fecha_deseada" TEXT,
    "profesional_pedido" TEXT,
    "programa" TEXT,
    "tiene_orden" TEXT,
    "orden_ref" TEXT,
    "fecha_limite_clinica" TEXT,
    "sustento_limite" TEXT,
    "observacion" TEXT,
    "estado" TEXT,
    "responsable" TEXT,
    "proxima_accion" TEXT,
    "proxima_fecha" TEXT,
    "prioridad" TEXT,
    "prioridad_motivo" TEXT,
    "prioridad_fuente" TEXT,
    "prioridad_por" TEXT,
    "prioridad_fecha" TEXT,
    "duplicado_justificacion" TEXT,
    "causa_cierre" TEXT,
    "fecha_cierre" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ce_solicitud_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ce_autorizacion" (
    "id" TEXT NOT NULL,
    "solicitud" TEXT,
    "situacion" TEXT,
    "numero" TEXT,
    "entidad" TEXT,
    "fecha_emision" TEXT,
    "fecha_vencimiento" TEXT,
    "cantidad" TEXT,
    "condiciones" TEXT,
    "fecha_tramite" TEXT,
    "responsable" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ce_autorizacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ce_gestion" (
    "id" TEXT NOT NULL,
    "solicitud" TEXT,
    "fecha_hora" TEXT,
    "usuario" TEXT,
    "accion" TEXT,
    "detalle" TEXT,
    "proxima_accion" TEXT,
    "proxima_fecha" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ce_gestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ce_jornada" (
    "id" TEXT NOT NULL,
    "programa" TEXT,
    "profesional" TEXT,
    "especialidad" TEXT,
    "modalidad" TEXT,
    "consultorio" TEXT,
    "eps" TEXT,
    "fecha" TEXT,
    "hora_inicio" TEXT,
    "hora_fin" TEXT,
    "duracion" TEXT,
    "agendas" TEXT,
    "extraordinaria" TEXT,
    "serie" TEXT,
    "estado" TEXT,
    "motivo_cancelacion" TEXT,
    "observacion" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ce_jornada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ce_cupo" (
    "id" TEXT NOT NULL,
    "jornada" TEXT,
    "fecha" TEXT,
    "hora" TEXT,
    "agenda" TEXT,
    "estado" TEXT,
    "bloqueo_tipo" TEXT,
    "bloqueo_motivo" TEXT,
    "bloqueado_por" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ce_cupo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ce_cita" (
    "id" TEXT NOT NULL,
    "cupo" TEXT,
    "solicitud" TEXT,
    "paciente" TEXT,
    "fecha" TEXT,
    "hora" TEXT,
    "estado" TEXT,
    "origen" TEXT,
    "asignada_en" TEXT,
    "asignada_por" TEXT,
    "salto_orden_motivo" TEXT,
    "confirmacion" TEXT,
    "observacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ce_cita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ce_profesional" (
    "id" TEXT NOT NULL,
    "tipo_doc" TEXT,
    "documento" TEXT,
    "nombre" TEXT,
    "registro" TEXT,
    "especialidades" TEXT,
    "activo" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ce_profesional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ce_consultorio" (
    "id" TEXT NOT NULL,
    "sede" TEXT,
    "nombre" TEXT,
    "tipo" TEXT,
    "plataforma" TEXT,
    "activo" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ce_consultorio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ce_especialidad" (
    "codigo" TEXT NOT NULL,
    "nombre" TEXT,
    "reservada" TEXT,
    "reporta_res256" TEXT,
    "presencial" TEXT,
    "telemedicina" TEXT,
    "fuente_reps" TEXT,
    "min_primera_vez" TEXT,
    "min_control" TEXT,
    "duracion_actualizada_por" TEXT,
    "activa" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ce_especialidad_pkey" PRIMARY KEY ("codigo")
);

-- CreateTable
CREATE TABLE "ce_eps" (
    "codigo" TEXT NOT NULL,
    "nombre" TEXT,
    "activa" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ce_eps_pkey" PRIMARY KEY ("codigo")
);

-- CreateTable
CREATE TABLE "ce_rol" (
    "usuario" TEXT NOT NULL,
    "rol" TEXT,
    "ve_reservadas" TEXT,
    "motivo" TEXT,
    "concedido_por" TEXT,
    "fecha" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ce_rol_pkey" PRIMARY KEY ("usuario")
);

-- CreateTable
CREATE TABLE "ce_config" (
    "clave" TEXT NOT NULL,
    "valor" TEXT,
    "fuente" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ce_config_pkey" PRIMARY KEY ("clave")
);

-- CreateIndex
CREATE UNIQUE INDEX "dp_paciente_persona_id_key" ON "dp_paciente"("persona_id");

-- CreateIndex
CREATE INDEX "dp_episodio_paciente_idx" ON "dp_episodio"("paciente");

-- CreateIndex
CREATE INDEX "dp_episodio_fecha_idx" ON "dp_episodio"("fecha");

-- CreateIndex
CREATE INDEX "dp_antimicrobiano_paciente_idx" ON "dp_antimicrobiano"("paciente");

-- CreateIndex
CREATE INDEX "dp_antimicrobiano_inicio_idx" ON "dp_antimicrobiano"("inicio");

-- CreateIndex
CREATE INDEX "dp_transicion_paciente_idx" ON "dp_transicion"("paciente");

-- CreateIndex
CREATE INDEX "dp_transicion_fecha_idx" ON "dp_transicion"("fecha");

-- CreateIndex
CREATE INDEX "dp_valoracion_paciente_idx" ON "dp_valoracion"("paciente");

-- CreateIndex
CREATE INDEX "dp_valoracion_fecha_idx" ON "dp_valoracion"("fecha");

-- CreateIndex
CREATE INDEX "dp_laboratorio_paciente_idx" ON "dp_laboratorio"("paciente");

-- CreateIndex
CREATE INDEX "dp_laboratorio_fecha_toma_idx" ON "dp_laboratorio"("fecha_toma");

-- CreateIndex
CREATE INDEX "dp_laboratorio_solicitud_idx" ON "dp_laboratorio"("solicitud");

-- CreateIndex
CREATE INDEX "dp_plan_laboratorio_paciente_idx" ON "dp_plan_laboratorio"("paciente");

-- CreateIndex
CREATE INDEX "dp_solicitud_lab_paciente_idx" ON "dp_solicitud_lab"("paciente");

-- CreateIndex
CREATE INDEX "dp_solicitud_lab_fecha_toma_idx" ON "dp_solicitud_lab"("fecha_toma");

-- CreateIndex
CREATE INDEX "dp_solicitud_lab_mes_idx" ON "dp_solicitud_lab"("mes");

-- CreateIndex
CREATE INDEX "dp_agenda_paciente_idx" ON "dp_agenda"("paciente");

-- CreateIndex
CREATE INDEX "dp_agenda_fecha_idx" ON "dp_agenda"("fecha");

-- CreateIndex
CREATE INDEX "dp_prescripcion_paciente_idx" ON "dp_prescripcion"("paciente");

-- CreateIndex
CREATE INDEX "dp_cateter_paciente_idx" ON "dp_cateter"("paciente");

-- CreateIndex
CREATE INDEX "dp_cateter_fecha_idx" ON "dp_cateter"("fecha");

-- CreateIndex
CREATE INDEX "dp_educacion_paciente_idx" ON "dp_educacion"("paciente");

-- CreateIndex
CREATE INDEX "dp_educacion_fecha_idx" ON "dp_educacion"("fecha");

-- CreateIndex
CREATE INDEX "dp_insumo_paciente_idx" ON "dp_insumo"("paciente");

-- CreateIndex
CREATE INDEX "dp_entrega_paciente_idx" ON "dp_entrega"("paciente");

-- CreateIndex
CREATE INDEX "dp_hospitalizacion_paciente_idx" ON "dp_hospitalizacion"("paciente");

-- CreateIndex
CREATE INDEX "dp_trasplante_paciente_idx" ON "dp_trasplante"("paciente");

-- CreateIndex
CREATE INDEX "dp_trasplante_fecha_idx" ON "dp_trasplante"("fecha");

-- CreateIndex
CREATE INDEX "dp_calidad_vida_paciente_idx" ON "dp_calidad_vida"("paciente");

-- CreateIndex
CREATE INDEX "dp_calidad_vida_fecha_idx" ON "dp_calidad_vida"("fecha");

-- CreateIndex
CREATE INDEX "dp_heredado_paciente_idx" ON "dp_heredado"("paciente");

-- CreateIndex
CREATE INDEX "dp_corte_cac_detalle_paciente_idx" ON "dp_corte_cac_detalle"("paciente");

-- CreateIndex
CREATE INDEX "dp_rol_fecha_idx" ON "dp_rol"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "ce_paciente_persona_id_key" ON "ce_paciente"("persona_id");

-- CreateIndex
CREATE INDEX "ce_solicitud_paciente_idx" ON "ce_solicitud"("paciente");

-- CreateIndex
CREATE INDEX "ce_autorizacion_solicitud_idx" ON "ce_autorizacion"("solicitud");

-- CreateIndex
CREATE INDEX "ce_gestion_solicitud_idx" ON "ce_gestion"("solicitud");

-- CreateIndex
CREATE INDEX "ce_jornada_fecha_idx" ON "ce_jornada"("fecha");

-- CreateIndex
CREATE INDEX "ce_cupo_fecha_idx" ON "ce_cupo"("fecha");

-- CreateIndex
CREATE INDEX "ce_cupo_jornada_idx" ON "ce_cupo"("jornada");

-- CreateIndex
CREATE INDEX "ce_cita_paciente_idx" ON "ce_cita"("paciente");

-- CreateIndex
CREATE INDEX "ce_cita_fecha_idx" ON "ce_cita"("fecha");

-- CreateIndex
CREATE INDEX "ce_cita_solicitud_idx" ON "ce_cita"("solicitud");

-- CreateIndex
CREATE INDEX "ce_cita_cupo_idx" ON "ce_cita"("cupo");

-- CreateIndex
CREATE INDEX "ce_rol_fecha_idx" ON "ce_rol"("fecha");

-- CreateIndex
CREATE INDEX "vih_laboratorio_solicitud_idx" ON "vih_laboratorio"("solicitud");

-- AddForeignKey
ALTER TABLE "dp_paciente" ADD CONSTRAINT "dp_paciente_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ce_paciente" ADD CONSTRAINT "ce_paciente_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Maestro único de personas: el sexo se guarda con la etiqueta (Femenino, Masculino, Indeterminado), como Hemodiálisis,
-- Diálisis peritoneal y Nefroprotección; VIH y Consulta externa traducen su código F/M/I al guardar y al leer.
UPDATE "persona" SET "sexo" = CASE UPPER(TRIM("sexo")) WHEN 'F' THEN 'Femenino' WHEN 'M' THEN 'Masculino' WHEN 'I' THEN 'Indeterminado' END
WHERE UPPER(TRIM("sexo")) IN ('F', 'M', 'I');
