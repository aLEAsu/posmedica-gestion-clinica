# Sistema de gestión clínica POSMÉDICA

Versión web multiusuario del prototipo «Gestión Clínica POSMÉDICA» (UNO-P · Mocoa, Putumayo).
Frontend React, backend Node.js y base de datos PostgreSQL, desplegados en Render.

> El prototipo HTML del coordinador médico es la **especificación funcional**: reglas clínicas, cálculos, indicadores, textos y diseño se conservan tal cual. Ver [docs/ANALISIS.md](docs/ANALISIS.md).

## Estado

| Fase | Contenido | Estado |
|---|---|---|
| 0 | Análisis del prototipo | ✅ Aprobada (8 oct 2026) |
| 1 | Monorepo, base de datos, autenticación, usuarios y permisos, auditoría, respaldo, panel, `render.yaml` | ✅ Lista para desplegar |
| 2 | `packages/clinical-rules` con pruebas de equivalencia | Pendiente |
| 3 | Hemodiálisis | Pendiente |
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
packages/shared          Catálogo de programas y regla única de permisos (front y back)
packages/clinical-rules  Reglas clínicas puras (Fase 2)
_analisis/               Prototipo separado por módulos: referencia para las fases siguientes
docs/                    Análisis y documentación
render.yaml              Blueprint de Render (3 servicios)
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

> **npm 11** bloquea los scripts de instalación por defecto. Los de Prisma y esbuild ya están aprobados en `package.json` (`allowScripts`).

### Pruebas

```bash
npm run test -w apps/api
```
Cada corrida crea una base temporal `posmedica_test_<marca>` en el Postgres local, aplica las migraciones y la elimina al terminar. Nunca toca la base de desarrollo.

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

Además, Render guarda copias de la base de datos (recuperación a un punto en el tiempo de 3 días en el plan Hobby o 7 días en Pro). Para una copia con `pg_dump` desde un equipo autorizado, agregue temporalmente su IP en *posmedica-db → Networking* y ejecute:
```bash
pg_dump --format=custom --no-owner --file=posmedica.dump "URL_EXTERNA_DE_LA_BASE"
```
Restauración en una base vacía:
```bash
pg_restore --no-owner --dbname="URL_DE_LA_BASE_DESTINO" posmedica.dump
```

## Despliegue en Render

1. Suba este repositorio a GitHub (privado).
2. En Render: **New → Blueprint**, elija el repositorio. Render lee `render.yaml` y crea:
   - `posmedica-db`: PostgreSQL 16, plan `0.1c-256mb`, región Virginia, sin acceso desde internet.
   - `posmedica-api`: Web Service (backend). Antes de cada despliegue aplica las migraciones y la siembra.
   - `posmedica-web`: Static Site (frontend). Reenvía `/api/*` al backend.
3. Render pedirá los valores marcados con `sync: false`:
   - `ALLOWED_ORIGINS`: la URL del Static Site, por ejemplo `https://posmedica-web.onrender.com`.
   - `ADMIN_USUARIO`, `ADMIN_NOMBRE` y `ADMIN_CLAVE_INICIAL`: el primer administrador. La clave debe tener al menos 10 caracteres con letras y números, y se cambia en el primer ingreso.
4. Si Render asigna al backend una URL distinta de `https://posmedica-api.onrender.com`, corríjala en la regla `routes` de `render.yaml` (Static Site).
5. Verifique:
   - `https://<backend>/api/health` responde `{"ok":true}`.
   - El Static Site muestra la pantalla de ingreso y permite entrar.

**¿Por qué el reenvío `/api/*`?** El frontend y el backend quedan en dominios distintos de `onrender.com`, y los navegadores bloquean las cookies entre dominios distintos. Con el reenvío, el navegador solo habla con el dominio del frontend y la cookie de sesión funciona sin configuración adicional.

**Plan alternativo** si el reenvío no funcionara: use un dominio propio con dos subdominios (`app.` y `api.`). En ese caso hay que activar CORS con credenciales en el backend; es un cambio pequeño.

## Documentación

- [docs/ANALISIS.md](docs/ANALISIS.md): análisis del prototipo, modelo de datos, reglas clínicas, formatos Excel y decisiones.
