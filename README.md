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
| 3 | Hemodiálisis con persistencia real (20 tablas), sin datos ficticios, importación inicial del libro o Dashboard | ✅ Aprobada |
| 4 | VIH con persistencia real (13 tablas), maestro único compartido con Hemodiálisis, importación del reporte CAC | ✅ Aprobada |
| 5 | Nefroprotección (Ruta de nefroprotección) en «modo base de datos», con su agenda | ✅ Lista para pruebas |
| 6 | Laboratorio, Producción, SP/IAAS/PROA, SOGCS, Calendario, Mensajes, Documentos | ✅ Lista para pruebas |
| — | Guía de despliegue en Render (plan gratuito) y guía de pruebas de aceptación | ✅ [DESPLIEGUE_RENDER.md](docs/DESPLIEGUE_RENDER.md) · [PRUEBAS_ACEPTACION.md](docs/PRUEBAS_ACEPTACION.md) |
| 7 | Prototipo v0.8 sobre lo ya migrado: HD (dispositivos, limpieza, infecciones y antimicrobianos, ITS-CVC por días-catéter), Nefroprotección v8 (auditoría GPC, nominal por EPS), Microbiología, IAAS y PROA por procesos, barra fija de reporte | ✅ Aprobada (13 oct 2026) |
| 8 | Diálisis peritoneal: 24 tablas `dp_*`, roles del módulo en dos capas, importación del archivo de control, reporte CAC, bitácora desde la auditoría | ✅ Lista para pruebas |
| 9 | Consulta externa: 13 tablas `ce_*`, roles del módulo, especialidades reservadas ocultas desde el servidor, un cupo nunca se asigna dos veces | ✅ Lista para pruebas |
| 10 | Tablero gerencial (solo administradores), con Nefroprotección calculada en segundo plano | ✅ Lista para pruebas |
| — | Optimización: respuestas comprimidas, lecturas en paralelo, carga paralela de libros (DP y CE solo a quien los usa), guardado de seguridad solo tras interacción, código de los módulos con huella para caché larga | ✅ |

Quimioterapia y Servicio farmacéutico siguen «en desarrollo», igual que en el prototipo.

**Pruebas automáticas:** 66 de integración del backend y 164 de equivalencia de reglas clínicas, todas en verde.

## Estructura

```
apps/api                 Backend: Express 5 + Prisma 6 + PostgreSQL (TypeScript)
  prisma/schema.prisma   Esquema de la base de datos
  prisma/migrations/     Migraciones versionadas (la inicial incluye el trigger de auditoría inmutable)
  src/routes/            auth, usuarios, auditoria, respaldo, catalogos
  src/modulos/libro/     Motor genérico de libros (lectura, sincronización, permisos, importación)
  src/modulos/{hd,vih,portal,dp,ce}/  Configuración de cada libro (hojas, tipos, permisos y roles)
  src/modulos/nefro/     Fachada de la API de la Ruta de nefroprotección y su agenda
  test/                  Pruebas de integración (Vitest + Supertest)
apps/web                 Frontend: React 19 + Vite (estilos copiados del prototipo)
  public/modulos/          Interfaz ORIGINAL del prototipo + adaptadores a la API: portal/ (HD, VIH, transversales) y nefro/
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

## Cómo funcionan los módulos migrados

Cada módulo conserva **la interfaz y la lógica originales del prototipo** (copiadas textualmente en cada build) y un **adaptador** (`public/modulos/<modulo>/adaptador-<modulo>.js`, con el motor de sincronización común en `public/modulos/adaptador-comun.js`) las conecta con el servidor. En el backend, un **motor genérico de libros** (`apps/api/src/modulos/libro/`) atiende a todos los programas con su configuración (`modulos/hd/config.ts`, `modulos/vih/config.ts`):

- Al abrir, carga los datos desde la base (`GET /api/v1/<programa>/libro`), no desde un archivo de Excel.
- Cada cambio que el módulo registra se guarda en el servidor en segundos (`POST /api/v1/<programa>/sincronizar`). La línea de estado muestra «Guardando…» o «Guardado · hora».
- El servidor valida los tipos, los permisos (registrar, anular, exportar; configuración y facturación solo del administrador), audita cada registro con su valor anterior y nuevo, y **rechaza ediciones simultáneas** del mismo registro (el segundo usuario recarga y repite).
- Si otro usuario guardó algo, aparece «Hay datos nuevos de otros usuarios: actualizar».
- **No hay datos ficticios**: se retiraron el botón de demostración y la carga y descarga del libro. El administrador tiene **«Importar libro o Dashboard (carga inicial)»**, solo disponible mientras Hemodiálisis está vacío, para migrar los datos reales existentes.
- **Una sola página, como en el prototipo**: Hemodiálisis (sección `#hdapp`), VIH y los módulos transversales viven en el portal del prototipo (`public/modulos/portal/`), y la Ruta de Nefroprotección se abre dentro de él en su iframe («cargada desde el servidor»). Desde la v0.6, el código de Hemodiálisis usa definiciones que viven más abajo en el mismo script (dispositivos, Microbiología, IAAS), y la barra fija «Reportar evento adverso / Novedad a Coordinación» aparece en todos los programas.
- **VIH** usa el portal del prototipo completo (VIH es un módulo nativo de ese portal); el adaptador manda la navegación hacia otros programas al portal nuevo. «Importar cohorte o archivo CAC» funciona para cualquier usuario con permiso de registrar y **acepta el reporte CAC sin fila de encabezado** (tal como se envía a la EPS).
- **Maestro único de personas**: la identidad (documento, nombres, nacimiento, sexo, EPS, residencia, etnia, zona) vive en `persona` y la comparten los programas. Etnia y zona se guardan como código CAC y VIH las ve con su etiqueta (equivalencias del propio prototipo). **Un campo vacío no borra un dato que otro programa registró**: para cambiarlo, escriba el valor nuevo.
- **Diálisis peritoneal y Consulta externa** tienen roles propios del prototipo (hojas RolesDP y RolesCE) además de los permisos del programa: el servidor valida las dos capas en cada hoja. El administrador es Dirección Médica en DP y Coordinación en CE. En CE, quien no tiene «ve reservadas» no recibe del servidor las solicitudes, autorizaciones, gestiones ni citas de Infectología u Oncología, y un cupo no puede recibir dos citas (se verifica dentro de la transacción serializable del guardado).
- Tablas de hemodiálisis: `hd_paciente` (la identidad vive en `persona`, el maestro único), `hd_sesion`, `hd_evento`, `hd_paraclinico`, `hd_novedad`, `hd_movimiento`, `hd_contacto`, `hd_acceso_novedad`, `hd_atencion`, `hd_valoracion`, `hd_estudio`, `hd_vacuna`, `hd_trasplante_item`, `hd_solicitud_lab`, `hd_seguridad_paciente`, `hd_antimicrobiano`, `hd_auditoria_iaas`, `hd_prescripcion`, `hd_dispensacion`, `hd_dispositivo`, `hd_limpieza`, `hd_corte`. Tablas de VIH (todo texto, como lo lee el prototipo): `vih_paciente`, `vih_antecedente`, `vih_laboratorio`, `vih_esquema_tar`, `vih_entrega_tar`, `vih_cita`, `vih_valoracion`, `vih_vacuna`, `vih_procedimiento`, `vih_profilaxis`, `vih_novedad`, `vih_solicitud_lab`, `vih_arrastre_cac`. Tablas de Diálisis peritoneal (`dp_*`, 24) y de Consulta externa (`ce_*`, 13), con los mismos nombres de hoja del prototipo. Todas se generan desde las hojas del prototipo con `npm run esquema -w apps/api`.

### Nefroprotección (Fase 5)

La Ruta de nefroprotección original ya tenía un «modo base de datos» que habla con una API estilo PostgREST. El backend ofrece esa misma API en `/api/v1/nefro/pg/` (`apps/api/src/modulos/nefro/fachada.ts`), sobre tablas propias (`nefro_paciente`, `nefro_laboratorio`, `nefro_valoracion`, `nefro_plan_item`, `nefro_atencion`, `nefro_novedad`, `nefro_contacto`, `eps_modelo_atencion`, `nefro_corte`) y el maestro único `persona`. La agenda (jornadas, citas, asistencia) y, desde la v8, la auditoría de adherencia a guías, el arrastre y la configuración de la nominal por EPS se guardan en `nefro_agenda_fila` cada pocos segundos (`/api/v1/nefro/agenda`); la configuración de la nominal solo la cambia el administrador. La Ruta arranca en «BASE DE DATOS» y el botón de datos ficticios está deshabilitado. Anular exige el permiso «anular»; el modelo de atención por EPS solo lo cambia el administrador.

### Portal y módulos transversales (Fase 6)

VIH, Laboratorio, Seguridad del paciente, IAAS, PROA, SOGCS, Producción, Documentos, Mensajes y Calendario usan el portal original (`public/modulos/portal/`). Su libro institucional (19 tablas `portal_*`, idénticas a las hojas del prototipo, incluidas las de la v0.6 y v0.7: Microbiología, clasificación IAAS, cierres de indicadores, plan de trabajo, hallazgos, actas e indicadores históricos) lo atiende el mismo motor de libros en `/api/v1/portal`. El servidor aplica las reglas:
- **Mensajes**: el remitente lo fija el servidor; cada usuario recibe solo los suyos (ni el administrador lee mensajes ajenos).
- **Seguridad del paciente**: cualquiera reporta y ve sus reportes; el análisis y cierre son del equipo de SP.
- **Documentos**: los editan el administrador o el área Calidad.
- **Producción**: las tarifas y valores cifrados solo llegan al administrador.
- Los módulos transversales leen los libros de Hemodiálisis y VIH y escriben solo lo suyo (Laboratorio: solicitudes, resultados y Microbiología; SP: seguridad e higiene de manos; IAAS: clasificación de episodios, cierres, plan de trabajo, hallazgos y su comité; PROA: auditoría de tratamientos, cierres, plan, hallazgos y su comité). Cada dato se registra una sola vez en su proceso de origen: los antimicrobianos los prescribe Hemodiálisis y PROA los lee; los cultivos los registra Laboratorio y Hemodiálisis, IAAS y PROA los leen.

Las pruebas (`apps/api/test/hd.test.ts`, `vih.test.ts`) importan en una base temporal la cohorte ficticia del prototipo, la leen desde la API y verifican que **los resultados clínicos sean idénticos** a los del prototipo original (HD: indicadores, alertas, semáforos, vacunación, calidad de diálisis, matriz CAC; VIH: 46 indicadores, alertas, carné, plan de laboratorios, estado al corte, cohorte nominal y reporte CAC). Cada archivo de pruebas usa su propia base temporal.

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
- [docs/PRUEBAS_ACEPTACION.md](docs/PRUEBAS_ACEPTACION.md): lista de verificación para el personal de la clínica, por módulo y rol.
- [docs/REGLAS_CLINICAS.md](docs/REGLAS_CLINICAS.md): inventario de las 306 definiciones clínicas extraídas, con su origen (generado).
- [packages/clinical-rules/README.md](packages/clinical-rules/README.md): cómo se extraen y verifican las reglas.
