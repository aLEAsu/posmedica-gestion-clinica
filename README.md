# Sistema de gestión clínica POSMÉDICA

Versión web multiusuario del prototipo «Gestión Clínica POSMÉDICA» (UNO-P · Mocoa, Putumayo).
Frontend React, backend Node.js y base de datos PostgreSQL, desplegados en Render.

> El prototipo HTML del coordinador médico es la **especificación funcional**: reglas clínicas, cálculos, indicadores, textos y diseño se conservan tal cual. Ver [docs/ANALISIS.md](docs/ANALISIS.md).

## Estado

| Fase | Contenido | Estado |
|---|---|---|
| 0 | Análisis del prototipo | ✅ Aprobada (8 oct 2026) |
| 1 | Monorepo, base de datos, autenticación, usuarios y permisos, auditoría, respaldo, panel, guía de despliegue | ✅ Aprobada |
| 2 | `packages/clinical-rules`: reglas extraídas textualmente y 132 pruebas de equivalencia | ✅ Aprobada |
| 3 | Hemodiálisis con persistencia real (20 tablas), sin datos ficticios, importación inicial del libro o Dashboard | ✅ Lista para revisión |
| 4 | VIH | Pendiente |
| 5 | Nefroprotección | Pendiente |
| 6 | Laboratorio, Producción, SP/IAAS/PROA, SOGCS, Calendario, Mensajes, Documentos | Pendiente |
| 7 | Importadores y exportadores CAC/EPS, migración de libros, E2E | Pendiente |

## Estructura

```
apps/api                 Backend: Express 5 + Prisma 6 + PostgreSQL (TypeScript)
  prisma/schema.prisma   Esquema de la base de datos
  prisma/migrations/     Migraciones versionadas (la inicial incluye el trigger de auditoría inmutable)
  src/routes/            auth, usuarios, auditoria, respaldo, catalogos
  test/                  Pruebas de integración (Vitest + Supertest)
apps/web                 Frontend: React 19 + Vite (estilos copiados del prototipo)
  public/modulos/          Módulos con la interfaz ORIGINAL del prototipo + su adaptador a la API (ver abajo)
  scripts/extraer-modulos.mjs  Copia textual del código del prototipo a public/modulos (corre en cada build)
packages/shared          Catálogo de programas y regla única de permisos (front y back)
packages/clinical-rules  Reglas clínicas extraídas del prototipo + pruebas de equivalencia (ver su README)
_analisis/               Prototipo separado por módulos: referencia para las fases siguientes
docs/                    Análisis y documentación
```

## Desarrollo local

Requisitos: Node.js 22 o superior y Docker Desktop.

```bash
cp .env.example .env
```
Edite `.env` y ponga un `SESSION_SECRET` aleatorio de al menos 32 caracteres.

```bash
npm install
```
```bash
npm run db:up
```
```bash
npm run build -w packages/shared
```
```bash
npm run migrate:dev -w apps/api
```
```bash
npm run seed:dev -w apps/api
```
```bash
npm run dev:api
```
En otra terminal:
```bash
npm run dev:web
```
Abra http://localhost:5173 e ingrese con `ADMIN_USUARIO` y `ADMIN_CLAVE_INICIAL` del `.env`. El sistema pide cambiar la clave en el primer ingreso.

### ¿Olvidó la clave o quedó bloqueado en local?

```bash
npm run admin:restablecer -w apps/api
```
Deja al usuario `ADMIN_USUARIO` con la clave `ADMIN_CLAVE_INICIAL` de su `.env` (desbloqueado y con cambio obligatorio). Para otro usuario: `npm run admin:restablecer -w apps/api -- nombre.usuario`. En Render (sin consola en el plan gratuito) la recuperación la hace otro administrador desde **Usuarios → Restablecer clave**.

> **npm 11** bloquea los scripts de instalación por defecto. Los de Prisma y esbuild ya están aprobados en `package.json` (`allowScripts`).

### Pruebas

```bash
npm run test -w apps/api
```
Cada corrida crea una base temporal `posmedica_test_<marca>` en el Postgres local, aplica las migraciones y la elimina al terminar. Nunca toca la base de desarrollo.

## Cómo funcionan los módulos migrados (Hemodiálisis)

El módulo conserva **la interfaz y la lógica originales del prototipo** (copiadas textualmente en cada build) y un **adaptador** (`public/modulos/hd/adaptador-hd.js`) las conecta con el servidor:

- Al abrir, carga los datos desde la base (`GET /api/v1/hd/libro`), no desde un archivo de Excel.
- Cada cambio que el módulo registra se guarda en el servidor en segundos (`POST /api/v1/hd/sincronizar`). La línea de estado muestra «Guardando…» o «Guardado · hora».
- El servidor valida los tipos, los permisos (registrar, anular, exportar; configuración y facturación solo del administrador), audita cada registro con su valor anterior y nuevo, y **rechaza ediciones simultáneas** del mismo registro (el segundo usuario recarga y repite).
- Si otro usuario guardó algo, aparece «Hay datos nuevos de otros usuarios: actualizar».
- **No hay datos ficticios**: se retiraron el botón de demostración y la carga y descarga del libro. El administrador tiene **«Importar libro o Dashboard (carga inicial)»**, solo disponible mientras Hemodiálisis está vacío, para migrar los datos reales existentes.
- Tablas: `hd_paciente` (la identidad vive en `persona`, el maestro único), `hd_sesion`, `hd_evento`, `hd_paraclinico`, `hd_novedad`, `hd_movimiento`, `hd_contacto`, `hd_acceso_novedad`, `hd_atencion`, `hd_valoracion`, `hd_estudio`, `hd_vacuna`, `hd_trasplante_item`, `hd_solicitud_lab`, `hd_seguridad_paciente`, `hd_antimicrobiano`, `hd_auditoria_iaas`, `hd_prescripcion`, `hd_dispensacion`, `hd_corte`. Se generan desde las hojas del prototipo con `npm run esquema:hd -w apps/api`.

Las pruebas (`apps/api/test/hd.test.ts`) importan en una base temporal la cohorte ficticia del prototipo, la leen desde la API y verifican que **indicadores, alertas, semáforos, vacunación, calidad de diálisis y matriz CAC sean idénticos** a los del prototipo original.

## Modelo de acceso (decisiones D2 y D3)

- **Administrador**: acceso total; crea usuarios, asigna programas y permisos, consulta la auditoría, descarga respaldos y es el **único que ve facturación** (tarifas, valores, conciliación).
- **Médico (estándar)**: solo los programas que el administrador le asigne y, en cada uno, las acciones marcadas: **ver, registrar, anular, exportar**. Nunca ve facturación. Mensajes, Documentos y Calendario están abiertos para todos.
- La autorización se valida **en el backend** con la misma función (`puede()` en `packages/shared`) que usa el frontend para mostrar u ocultar.

## Seguridad

- Contraseñas con **Argon2id**; política de 10 caracteres o más con letras y números; cambio obligatorio en el primer ingreso y tras cada restablecimiento.
- **Bloqueo** de 15 minutos tras 5 intentos fallidos; el administrador puede desbloquear.
- Sesión en cookie `httpOnly`, `Secure`, `SameSite=Lax` (prefijo `__Host-` en producción). En la base solo se guarda el HMAC del token. Cierre por 30 minutos de inactividad y máximo 12 horas.
- **CSRF**: toda petición que modifica datos debe venir del origen permitido y traer la cabecera `X-Posmedica`.
- **Auditoría inmutable**: un trigger de PostgreSQL impide `UPDATE`, `DELETE` y `TRUNCATE` sobre la tabla `auditoria`. Se registran ingresos (exitosos y fallidos), bloqueos, creaciones, cambios con su valor anterior y nuevo, permisos, restablecimientos y respaldos. Nunca se guardan claves.
- Registros sin datos de pacientes: los logs no incluyen cuerpo, parámetros de consulta ni cookies.
- Límite de peticiones por IP, `helmet`, cabeceras de seguridad y CSP en el Static Site.

## Respaldo de la información (P6)

En **Respaldo** el administrador descarga **toda** la información:
- **Excel**: una hoja por tabla más una hoja LEAME. Sirve para consulta y archivo físico.
- **JSON**: copia exacta, útil para restaurar o migrar.

Las claves y los tokens de sesión nunca se incluyen. Cada descarga queda en la auditoría. Las tablas que se agreguen en las fases siguientes entran solas en el respaldo.

Las bases de datos **pagas** de Render tienen además recuperación a un punto en el tiempo (3 días en el plan Hobby, 7 en Pro); la gratuita no. Para una copia exacta con `pg_dump` use la *External Database URL*:
```bash
pg_dump --format=custom --no-owner --file=posmedica.dump "URL_EXTERNA_DE_LA_BASE"
```
Restauración en una base vacía:
```bash
pg_restore --no-owner --dbname="URL_DE_LA_BASE_DESTINO" posmedica.dump
```

## Despliegue en Render

Los tres servicios (PostgreSQL, Web Service y Static Site) se crean **manualmente** en el panel de Render, en plan gratuito. Paso a paso, integración y límites del plan gratuito: **[docs/DESPLIEGUE_RENDER.md](docs/DESPLIEGUE_RENDER.md)**.

> ⚠️ La base de datos gratuita de Render **expira a los 30 días** y no tiene copias de seguridad. Antes de cargar datos reales, pásela a un plan pago o siga el procedimiento de renovación de la guía.

## Documentación

- [docs/ANALISIS.md](docs/ANALISIS.md): análisis del prototipo, modelo de datos, reglas clínicas, formatos Excel y decisiones.
- [docs/DESPLIEGUE_RENDER.md](docs/DESPLIEGUE_RENDER.md): guía de despliegue manual en Render.
- [docs/REGLAS_CLINICAS.md](docs/REGLAS_CLINICAS.md): inventario de las 306 definiciones clínicas extraídas, con su origen (generado).
- [packages/clinical-rules/README.md](packages/clinical-rules/README.md): cómo se extraen y verifican las reglas.
