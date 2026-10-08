-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'MEDICO');

-- CreateTable
CREATE TABLE "usuario" (
    "id" UUID NOT NULL,
    "usuario" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "area" TEXT,
    "email" TEXT,
    "rol" "Rol" NOT NULL DEFAULT 'MEDICO',
    "clave_hash" TEXT NOT NULL,
    "debe_cambiar_clave" BOOLEAN NOT NULL DEFAULT true,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "intentos_fallidos" INTEGER NOT NULL DEFAULT 0,
    "bloqueado_hasta" TIMESTAMPTZ(3),
    "ultimo_ingreso" TIMESTAMPTZ(3),
    "clave_cambiada_en" TIMESTAMPTZ(3),
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programa" (
    "clave" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "grupo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fase" INTEGER,
    "abierto" BOOLEAN NOT NULL DEFAULT false,
    "orden" INTEGER NOT NULL,

    CONSTRAINT "programa_pkey" PRIMARY KEY ("clave")
);

-- CreateTable
CREATE TABLE "usuario_programa" (
    "usuario_id" UUID NOT NULL,
    "programa_clave" TEXT NOT NULL,
    "ver" BOOLEAN NOT NULL DEFAULT true,
    "registrar" BOOLEAN NOT NULL DEFAULT false,
    "anular" BOOLEAN NOT NULL DEFAULT false,
    "exportar" BOOLEAN NOT NULL DEFAULT false,
    "asignado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "asignado_por" UUID,

    CONSTRAINT "usuario_programa_pkey" PRIMARY KEY ("usuario_id","programa_clave")
);

-- CreateTable
CREATE TABLE "sesion" (
    "id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "usuario_id" UUID NOT NULL,
    "creada_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultima_actividad" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expira_en" TIMESTAMPTZ(3) NOT NULL,
    "revocada_en" TIMESTAMPTZ(3),
    "ip" TEXT,
    "agente" TEXT,

    CONSTRAINT "sesion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria" (
    "id" BIGSERIAL NOT NULL,
    "fecha" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario_id" UUID,
    "usuario_nombre" TEXT,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "registro_id" TEXT,
    "programa" TEXT,
    "ip" TEXT,
    "antes" JSONB,
    "despues" JSONB,
    "detalle" TEXT,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eps" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "eps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "municipio" (
    "codigo_dane" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "departamento" TEXT NOT NULL,

    CONSTRAINT "municipio_pkey" PRIMARY KEY ("codigo_dane")
);

-- CreateTable
CREATE TABLE "persona" (
    "id" UUID NOT NULL,
    "tipo_doc" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "primer_nombre" TEXT NOT NULL,
    "segundo_nombre" TEXT,
    "primer_apellido" TEXT NOT NULL,
    "segundo_apellido" TEXT,
    "fecha_nacimiento" DATE,
    "sexo" TEXT,
    "eps_id" INTEGER,
    "regimen" TEXT,
    "fecha_afiliacion" DATE,
    "municipio_dane" TEXT,
    "zona" TEXT,
    "direccion" TEXT,
    "telefono" TEXT,
    "etnia" TEXT,
    "grupo_poblacional" TEXT,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL,
    "anulado_en" TIMESTAMPTZ(3),
    "anulado_por" UUID,
    "motivo_anulacion" TEXT,

    CONSTRAINT "persona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscripcion_programa" (
    "id" UUID NOT NULL,
    "persona_id" UUID NOT NULL,
    "programa_clave" TEXT NOT NULL,
    "codigo_interno" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Activo',
    "fecha_ingreso" DATE,
    "fecha_egreso" DATE,
    "motivo_egreso" TEXT,
    "creado_en" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "creado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL,
    "anulado_en" TIMESTAMPTZ(3),
    "anulado_por" UUID,
    "motivo_anulacion" TEXT,

    CONSTRAINT "inscripcion_programa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parametro" (
    "id" SERIAL NOT NULL,
    "programa" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" JSONB NOT NULL,
    "vigente_desde" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_por" UUID,
    "actualizado_en" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "parametro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_usuario_key" ON "usuario"("usuario");

-- CreateIndex
CREATE UNIQUE INDEX "sesion_token_hash_key" ON "sesion"("token_hash");

-- CreateIndex
CREATE INDEX "sesion_usuario_id_idx" ON "sesion"("usuario_id");

-- CreateIndex
CREATE INDEX "auditoria_fecha_idx" ON "auditoria"("fecha");

-- CreateIndex
CREATE INDEX "auditoria_entidad_registro_id_idx" ON "auditoria"("entidad", "registro_id");

-- CreateIndex
CREATE INDEX "auditoria_usuario_id_idx" ON "auditoria"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "eps_nombre_key" ON "eps"("nombre");

-- CreateIndex
CREATE INDEX "persona_primer_apellido_primer_nombre_idx" ON "persona"("primer_apellido", "primer_nombre");

-- CreateIndex
CREATE UNIQUE INDEX "persona_tipo_doc_documento_key" ON "persona"("tipo_doc", "documento");

-- CreateIndex
CREATE INDEX "inscripcion_programa_persona_id_idx" ON "inscripcion_programa"("persona_id");

-- CreateIndex
CREATE UNIQUE INDEX "inscripcion_programa_programa_clave_codigo_interno_key" ON "inscripcion_programa"("programa_clave", "codigo_interno");

-- CreateIndex
CREATE UNIQUE INDEX "parametro_programa_clave_key" ON "parametro"("programa", "clave");

-- AddForeignKey
ALTER TABLE "usuario_programa" ADD CONSTRAINT "usuario_programa_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_programa" ADD CONSTRAINT "usuario_programa_programa_clave_fkey" FOREIGN KEY ("programa_clave") REFERENCES "programa"("clave") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sesion" ADD CONSTRAINT "sesion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persona" ADD CONSTRAINT "persona_eps_id_fkey" FOREIGN KEY ("eps_id") REFERENCES "eps"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persona" ADD CONSTRAINT "persona_municipio_dane_fkey" FOREIGN KEY ("municipio_dane") REFERENCES "municipio"("codigo_dane") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripcion_programa" ADD CONSTRAINT "inscripcion_programa_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "persona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscripcion_programa" ADD CONSTRAINT "inscripcion_programa_programa_clave_fkey" FOREIGN KEY ("programa_clave") REFERENCES "programa"("clave") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ============================================================================
-- Auditoría inmutable: nadie (ni la aplicación ni un administrador por SQL con
-- el usuario de la aplicación) puede modificar o borrar registros de auditoría.
-- ============================================================================
CREATE OR REPLACE FUNCTION auditoria_inmutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'La auditoría es inmutable: no se permite % sobre auditoria', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auditoria_sin_update_delete
  BEFORE UPDATE OR DELETE ON "auditoria"
  FOR EACH ROW EXECUTE FUNCTION auditoria_inmutable();

CREATE TRIGGER auditoria_sin_truncate
  BEFORE TRUNCATE ON "auditoria"
  FOR EACH STATEMENT EXECUTE FUNCTION auditoria_inmutable();
