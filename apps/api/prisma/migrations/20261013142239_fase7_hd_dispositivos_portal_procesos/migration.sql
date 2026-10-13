-- AlterTable
ALTER TABLE "hd_antimicrobiano" ADD COLUMN     "duracion_prevista" DOUBLE PRECISION,
ADD COLUMN     "prescriptor" TEXT;

-- AlterTable
ALTER TABLE "hd_sesion" ADD COLUMN     "limpieza_puesto" TEXT;

-- AlterTable
ALTER TABLE "portal_aporte_manual" ADD COLUMN     "motivo_excepcional" TEXT,
ADD COLUMN     "responsable" TEXT;

-- AlterTable
ALTER TABLE "portal_comite_sesion" ADD COLUMN     "agenda" TEXT,
ADD COLUMN     "decisiones" TEXT,
ADD COLUMN     "estado_acta" TEXT,
ADD COLUMN     "historial" TEXT,
ADD COLUMN     "tipo" TEXT;

-- AlterTable
ALTER TABLE "portal_compromiso" ADD COLUMN     "actas_origen" TEXT,
ADD COLUMN     "estado_reportado" TEXT,
ADD COLUMN     "estado_verificado" TEXT,
ADD COLUMN     "evidencia_esperada" TEXT,
ADD COLUMN     "fecha_verificacion" TEXT,
ADD COLUMN     "historial" TEXT,
ADD COLUMN     "observaciones" TEXT,
ADD COLUMN     "origen" TEXT,
ADD COLUMN     "proceso" TEXT,
ADD COLUMN     "programa" TEXT,
ADD COLUMN     "verificado_por" TEXT;

-- AlterTable
ALTER TABLE "portal_proa_auditoria" ADD COLUMN     "ajuste_renal" TEXT;

-- CreateTable
CREATE TABLE "hd_dispositivo" (
    "id" TEXT NOT NULL,
    "paciente" TEXT,
    "tipo" TEXT,
    "sitio" TEXT,
    "fecha_insercion" DATE,
    "lugar_insercion" TEXT,
    "fecha_retiro" DATE,
    "motivo_retiro" TEXT,
    "estado" TEXT,
    "reemplaza" TEXT,
    "novedad" TEXT,
    "origen" TEXT,
    "validado" TEXT,
    "validado_por" TEXT,
    "validado_fecha" DATE,
    "nota" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hd_dispositivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hd_limpieza" (
    "id" TEXT NOT NULL,
    "proceso" TEXT,
    "fecha" DATE,
    "turno" TEXT,
    "maquina" TEXT,
    "area" TEXT,
    "fecha_programada" DATE,
    "ejecuto" TEXT,
    "cargo" TEXT,
    "actividades" TEXT,
    "producto" TEXT,
    "concentracion" TEXT,
    "tiempo_contacto" TEXT,
    "parametros" TEXT,
    "observacion" TEXT,
    "evidencia" TEXT,
    "sup_resultado" TEXT,
    "sup_items" TEXT,
    "sup_por" TEXT,
    "sup_fecha" DATE,
    "sup_obs" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hd_limpieza_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_microbiologia" (
    "id" TEXT NOT NULL,
    "programa" TEXT,
    "paciente" TEXT,
    "episodio" TEXT,
    "muestra" TEXT,
    "fecha_solicitud" TEXT,
    "fecha_toma" TEXT,
    "hora_toma" TEXT,
    "laboratorio" TEXT,
    "integracion" TEXT,
    "soporte" TEXT,
    "estado" TEXT,
    "fecha_resultado" TEXT,
    "resultado" TEXT,
    "gram" TEXT,
    "microorganismo" TEXT,
    "antibiograma" TEXT,
    "fenotipo" TEXT,
    "nota" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "anulado" TEXT,
    "motivo_anulacion" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_microbiologia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_iaas_clasificacion" (
    "id" TEXT NOT NULL,
    "fuente" TEXT,
    "ref" TEXT,
    "programa" TEXT,
    "paciente" TEXT,
    "estado" TEXT,
    "criterio" TEXT,
    "atribucion" TEXT,
    "version" TEXT,
    "clasificador" TEXT,
    "fecha" TEXT,
    "notificable" TEXT,
    "fecha_notificacion" TEXT,
    "nota" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_iaas_clasificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_indicador_cierre" (
    "id" TEXT NOT NULL,
    "matriz" TEXT,
    "periodo" TEXT,
    "indicador" TEXT,
    "numerador" TEXT,
    "denominador" TEXT,
    "valor" TEXT,
    "estado" TEXT,
    "disponibilidad" TEXT,
    "version" TEXT,
    "fuentes" TEXT,
    "nota" TEXT,
    "cerrado_por" TEXT,
    "fecha" TEXT,
    "vigente" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_indicador_cierre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_plan_trabajo" (
    "id" TEXT NOT NULL,
    "programa" TEXT,
    "proceso" TEXT,
    "actividad" TEXT,
    "objetivo" TEXT,
    "responsable" TEXT,
    "periodicidad" TEXT,
    "fecha_programada" TEXT,
    "fecha_efectiva" TEXT,
    "evidencia" TEXT,
    "estado" TEXT,
    "verificacion" TEXT,
    "verificado_por" TEXT,
    "fecha_verificacion" TEXT,
    "origen" TEXT,
    "ref" TEXT,
    "soporte" TEXT,
    "observaciones" TEXT,
    "historial" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_plan_trabajo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_hallazgo" (
    "id" TEXT NOT NULL,
    "programa" TEXT,
    "proceso" TEXT,
    "fuente" TEXT,
    "ref" TEXT,
    "descripcion" TEXT,
    "riesgo" TEXT,
    "causa" TEXT,
    "accion" TEXT,
    "responsable" TEXT,
    "plazo" TEXT,
    "evidencia_ejecucion" TEXT,
    "fecha_ejecucion" TEXT,
    "verificacion" TEXT,
    "fecha_verificacion" TEXT,
    "verificado_por" TEXT,
    "criterio_eficacia" TEXT,
    "fecha_eficacia" TEXT,
    "eficacia" TEXT,
    "estado" TEXT,
    "para_comite" TEXT,
    "historial" TEXT,
    "usuario" TEXT,
    "registrado" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_hallazgo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_acta_historica" (
    "id" TEXT NOT NULL,
    "comite" TEXT,
    "archivo" TEXT,
    "carpeta" TEXT,
    "num_acta" TEXT,
    "fecha_consignada" TEXT,
    "periodo" TEXT,
    "enlace" TEXT,
    "estado_doc" TEXT,
    "compromisos" TEXT,
    "conciliacion" TEXT,
    "sesion" TEXT,
    "fuente" TEXT,
    "historial" TEXT,
    "registrado" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_acta_historica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portal_indicador_historico" (
    "id" TEXT NOT NULL,
    "programa" TEXT,
    "indicador" TEXT,
    "mes" TEXT,
    "numerador" TEXT,
    "denominador" TEXT,
    "resultado" TEXT,
    "documento" TEXT,
    "version_ficha" TEXT,
    "observacion" TEXT,
    "conciliacion" TEXT,
    "conciliado_por" TEXT,
    "fecha_conciliacion" TEXT,
    "registrado" TEXT,
    "creado_por" UUID,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "portal_indicador_historico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hd_dispositivo_paciente_idx" ON "hd_dispositivo"("paciente");

-- CreateIndex
CREATE INDEX "hd_limpieza_fecha_idx" ON "hd_limpieza"("fecha");

-- CreateIndex
CREATE INDEX "portal_microbiologia_paciente_idx" ON "portal_microbiologia"("paciente");

-- CreateIndex
CREATE INDEX "portal_microbiologia_fecha_toma_idx" ON "portal_microbiologia"("fecha_toma");

-- CreateIndex
CREATE INDEX "portal_iaas_clasificacion_paciente_idx" ON "portal_iaas_clasificacion"("paciente");

-- CreateIndex
CREATE INDEX "portal_iaas_clasificacion_fecha_idx" ON "portal_iaas_clasificacion"("fecha");

-- CreateIndex
CREATE INDEX "portal_indicador_cierre_fecha_idx" ON "portal_indicador_cierre"("fecha");

-- CreateIndex
CREATE INDEX "portal_indicador_historico_mes_idx" ON "portal_indicador_historico"("mes");
