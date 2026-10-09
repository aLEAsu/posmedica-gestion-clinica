# Guía de despliegue manual en Render (plan gratuito)

Tres servicios creados a mano desde el panel de Render y conectados entre sí:

```
 Navegador ──► posmedica-web (Static Site) ──/api/*──► posmedica-api (Web Service) ──► posmedica-db (PostgreSQL)
               portal React + módulos del prototipo         Node.js + Prisma                      datos
```

El navegador **solo** habla con `posmedica-web`. Render reenvía las peticiones `/api/*` al backend, así la cookie de sesión es del mismo dominio y los navegadores no la bloquean.

Qué incluye el despliegue:

- **Portal**: ingreso, usuarios y permisos, auditoría y respaldo.
- **Hemodiálisis**.
- **Nefroprotección**, con su agenda.
- **VIH**.
- **Módulos transversales**: Laboratorio, Producción asistencial, Seguridad del paciente, IAAS, PROA, SOGCS, Documentos, Mensajes y Calendario.
- **Fichas de los programas sin módulo propio**: Diálisis peritoneal, Consulta externa, Quimioterapia y Servicio farmacéutico.

---

## ⚠️ Antes de empezar: límites del plan gratuito

| Servicio | Límite | Qué significa para POSMÉDICA |
|---|---|---|
| **PostgreSQL gratuito** | **Expira a los 30 días** de creado. Hay 14 días de gracia para pasarlo a pago; después **Render lo borra**. No tiene copias de seguridad, ofrece 1 GB y permite **una sola base gratuita por cuenta**. | Sirve para **pruebas**. Para datos reales de pacientes: (a) pase la base a un plan pago antes del día 30, o (b) renuévela cada mes con el procedimiento de la sección 8. **Descargue el Respaldo con frecuencia.** |
| **Web Service gratuito** | Se apaga tras **15 minutos sin uso** y tarda **cerca de 1 minuto** en volver a encender. Tiene 750 horas al mes por cuenta, no tiene consola y no permite «pre-deploy command». | El primer ingreso del día tarda; el sistema muestra «El servidor se está encendiendo…». Las migraciones y la siembra se ejecutan al arrancar (`start:render`). |
| **Static Site** | Gratuito. | Sin límites relevantes. |

> **Recomendación:** pruebe con el plan gratuito, pero antes de cargar datos reales pase **la base de datos** a un plan pago (desde *0.1c-256mb*). Es el único servicio donde perder datos es irreversible. El backend y el frontend pueden seguir gratuitos.

---

## 1. Subir el código a GitHub

1. Cree un repositorio **privado** en GitHub, por ejemplo `posmedica-gestion-clinica`.
2. En la carpeta del proyecto, conecte el repositorio local con el de GitHub:
   ```bash
   git remote add origin https://github.com/SU_USUARIO/posmedica-gestion-clinica.git
   ```
3. Suba la rama principal:
   ```bash
   git push -u origin main
   ```
4. En Render: **Account Settings → Git** y conecte su cuenta de GitHub, dándole acceso a ese repositorio.

> El archivo `.env` y los Excel **no** se suben (están en `.gitignore`). Nunca suba archivos con datos de pacientes.

---

## 2. Crear la base de datos (`posmedica-db`)

Render → **New → Postgres**:

| Campo | Valor |
|---|---|
| Name | `posmedica-db` |
| Database | `posmedica` |
| User | `posmedica` |
| Region | **Virginia (US East)**. Los tres servicios deben estar en **la misma región**. |
| PostgreSQL Version | 16 |
| Instance Type | Free (o *0.1c-256mb* para datos reales) |

Clic en **Create Database**. Cuando quede en estado *Available*, copie la **Internal Database URL** de la pestaña **Info**; la usará en el paso 3.

> Anote la **fecha de creación**: la base gratuita expira 30 días después.

---

## 3. Crear el backend (`posmedica-api`)

Render → **New → Web Service** → elija el repositorio:

| Campo | Valor |
|---|---|
| Name | `posmedica-api` |
| Region | **Virginia**, la misma de la base |
| Branch | `main` |
| Root Directory | (vacío) |
| Runtime / Language | Node |
| Build Command | `npm ci --include=dev && npm run build -w packages/shared && npm run build -w packages/clinical-rules && npm run build -w apps/api` |
| Start Command | `npm run start:render -w apps/api` |
| Instance Type | Free |

En **Advanced → Health Check Path** escriba `/api/health`.

### Variables de entorno (Environment)

| Variable | Valor |
|---|---|
| `NODE_VERSION` | `22` |
| `NODE_ENV` | `production` |
| `DATABASE_URL` | La **Internal Database URL** del paso 2 |
| `SESSION_SECRET` | Use **Generate** (botón de Render) o un texto aleatorio de 40 caracteres o más |
| `ALLOWED_ORIGINS` | La URL del frontend del paso 4, p. ej. `https://posmedica-web.onrender.com` (sin barra final). Si aún no la conoce, póngala después y redespliegue. |
| `TRUST_PROXY_HOPS` | `2` |
| `SESSION_IDLE_MIN` | `30` |
| `SESSION_MAX_HOURS` | `12` |
| `ADMIN_USUARIO` | Usuario del primer administrador, p. ej. `coordinacion` |
| `ADMIN_NOMBRE` | Nombre completo del administrador |
| `ADMIN_CARGO` | `Coordinación asistencial` |
| `ADMIN_CLAVE_INICIAL` | Clave temporal: 10 caracteres o más, con letras y números. Se cambia obligatoriamente en el primer ingreso. |

Clic en **Create Web Service**. En **Logs** debe ver, en este orden:
1. Las migraciones aplicadas («All migrations have been successfully applied»). La primera vez son cinco: inicial, hemodiálisis, VIH, y Nefroprotección más portal.
2. `Administrador inicial creado: …` (solo la primera vez) y `Siembra completa.`
3. `API POSMÉDICA escuchando en el puerto …`

Verifique abriendo `https://posmedica-api.onrender.com/api/health` (use la URL que Render le asignó). Debe responder `{"ok":true,…}`.

> **Anote la URL exacta del backend.** Si el nombre ya estaba tomado, Render agrega un sufijo, p. ej. `posmedica-api-x7k2.onrender.com`.

---

## 4. Crear el frontend (`posmedica-web`)

Render → **New → Static Site** → elija el repositorio:

| Campo | Valor |
|---|---|
| Name | `posmedica-web` |
| Branch | `main` |
| Root Directory | (vacío) |
| Build Command | `npm ci --include=dev && npm run build -w packages/shared && npm run build -w apps/web` |
| Publish Directory | `apps/web/dist` |

Variable de entorno: `NODE_VERSION` = `22`.

> El build del frontend genera las páginas de los módulos (`/modulos/hd`, `/modulos/nefro`, `/modulos/portal`) copiando el código del prototipo «Gestión Clínica POSMÉDICA (1).html», que está en el repositorio.

Clic en **Create Static Site**.

### 4.1 Reglas de reenvío (Redirects/Rewrites): **obligatorio**

En el Static Site, pestaña **Redirects/Rewrites**, agregue **en este orden**:

| # | Source | Destination | Action |
|---|---|---|---|
| 1 | `/api/*` | `https://posmedica-api.onrender.com/api/*` (la URL de su backend) | **Rewrite** |
| 2 | `/*` | `/index.html` | **Rewrite** |

La regla 1 integra el frontend y el backend. La regla 2 permite recargar cualquier página del portal. Los archivos de `/modulos/…` existen, así que Render los sirve antes de aplicar la regla 2.

### 4.2 Cabeceras de seguridad (Headers): recomendado

En la pestaña **Headers**, agregue estas cabeceras, todas con Path `/*`:

| Name | Value |
|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'` |
| `X-Frame-Options` | `SAMEORIGIN` (los módulos se muestran dentro del portal) |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `same-origin` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

Agregue también, con Path `/index.html`, la cabecera `Cache-Control` = `no-cache`, para que siempre cargue la versión nueva.

---

## 5. Integrar los servicios: verificación final

1. En el backend, confirme que `ALLOWED_ORIGINS` sea **exactamente** la URL del Static Site, con `https://` y sin `/` final. Si la cambió, haga **Manual Deploy → Deploy latest commit**.
2. Abra `https://posmedica-web.onrender.com/api/health`. Debe responder `{"ok":true}`; eso confirma que el reenvío funciona.
3. Abra `https://posmedica-web.onrender.com`, ingrese con `ADMIN_USUARIO` y `ADMIN_CLAVE_INICIAL` y cambie la clave.
4. Abra **Hemodiálisis**, **VIH**, **Nefroprotección**, **Laboratorio** y **Mensajes**: cada uno debe cargar y mostrar «Datos al día» (o «BASE DE DATOS» en Nefroprotección).
5. En **Usuarios**, cree los usuarios y asígneles sus programas y permisos.
6. En **Respaldo**, descargue un Excel de prueba.

Después siga [PRUEBAS_ACEPTACION.md](PRUEBAS_ACEPTACION.md) con el personal de la clínica.

### Problemas frecuentes

| Síntoma | Causa y solución |
|---|---|
| «Origen de la petición no permitido» al ingresar | `ALLOWED_ORIGINS` no coincide con la URL del frontend. Corríjala y redespliegue el backend. |
| `/api/health` en el frontend devuelve la página del portal o 404 | Falta la regla 1, o está debajo de la regla 2: el orden importa. |
| Ingresa, pero al recargar vuelve a pedir usuario | El reenvío no está pasando la cookie. Verifique la regla 1. Si persiste, use el plan alternativo (sección 9). |
| Un módulo queda en blanco | Las cabeceras deben tener `frame-ancestors 'self'` y `X-Frame-Options: SAMEORIGIN`, no `'none'` ni `DENY`. |
| «El servidor se está encendiendo…» durante casi un minuto | Normal en el plan gratuito tras 15 minutos sin uso. |
| El backend falla al arrancar con «Configuración inválida» | Falta una variable o `SESSION_SECRET` tiene menos de 32 caracteres. Los Logs solo muestran el nombre de la variable. |
| «ADMIN_CLAVE_INICIAL no cumple la política» | Use 10 caracteres o más, con letras y números, sin incluir el usuario. |
| El administrador olvidó su clave | Si hay otro administrador, puede usar **Usuarios → Restablecer clave**. Si no hay otro, cambie `ADMIN_USUARIO` y `ADMIN_CLAVE_INICIAL`: solo crean un usuario si la tabla está vacía. Lo más seguro es tener siempre **dos administradores**. |

---

## 6. Carga inicial de los datos reales

Cada programa permite **una carga inicial** desde los archivos de Excel que se usaban con el prototipo. La hace el administrador y solo funciona con el programa vacío.

| Programa | Dónde | Archivo |
|---|---|---|
| Hemodiálisis | Hemodiálisis → **Importar libro o Dashboard (carga inicial)** | Libro de hemodiálisis o «Dashboard MES.xlsx» |
| VIH | VIH → **Cargar libro VIH** (solo carga inicial). **Importar cohorte o archivo CAC** sirve en cualquier momento para quien tenga permiso de registrar. | Libro VIH, cohorte nominal de Nueva EPS o reporte CAC de 193 variables. Se acepta **con o sin** fila de encabezado. |
| Nefroprotección | Nefroprotección → **Importar libro de Excel a la base** | Libro de la Ruta: Pacientes, Laboratorios, Valoraciones, Atenciones y Novedades. Si trae hojas de agenda, también se importan. |

Antes de guardar, el sistema muestra lo que va a cargar y los avisos (p. ej. documentos repetidos). Todo queda en la auditoría.

---

## 7. Despliegues siguientes

Cada `git push` a `main` vuelve a desplegar el backend y el frontend (Auto-Deploy). Al arrancar, el backend aplica las migraciones nuevas, que nunca borran datos.

---

## 8. Base de datos gratuita: renovación antes de que expire

Render solo permite **una** base gratuita por cuenta: para renovarla hay que respaldar, borrar, crear de nuevo y restaurar. Hágalo **antes del día 30**:

1. Avise a los usuarios y no registre nada durante el proceso.
2. Desde **Respaldo**, descargue el Excel y el JSON como respaldo de seguridad adicional.
3. Haga una copia exacta con `pg_dump` desde un equipo con PostgreSQL instalado, usando la **External Database URL** de la pestaña Info:
   ```bash
   pg_dump --format=custom --no-owner --no-acl --file=posmedica.dump "EXTERNAL_DATABASE_URL"
   ```
4. Verifique que el archivo `posmedica.dump` exista y pese más de 0 KB. **No continúe si falló.**
5. Borre la base vieja en Render (*Settings → Delete Database*) y cree una nueva igual que en el paso 2.
6. Restaure en la base nueva:
   ```bash
   pg_restore --no-owner --no-acl --dbname="NUEVA_EXTERNAL_DATABASE_URL" posmedica.dump
   ```
7. En el backend, cambie `DATABASE_URL` por la **Internal Database URL** nueva y redespliegue.
8. Ingrese y verifique usuarios, auditoría y datos de cada programa.

> Este procedimiento tiene riesgo de pérdida si se hace mal. Con datos reales, **pase la base a un plan pago**: se cambia en *Settings → Instance Type* sin perder nada y sin renovaciones.

---

## 9. Plan alternativo si el reenvío `/api/*` no funcionara

Si la regla 1 del Static Site no pasa bien las peticiones o la cookie, la solución es un **dominio propio** con dos subdominios del mismo dominio: `app.posmedica.com` para el frontend y `api.posmedica.com` para el backend. En ese caso hay que activar CORS con credenciales en el backend, que es un cambio pequeño en el código.

---

## 10. Desarrollo local

Ver [README.md](../README.md#desarrollo-local).
