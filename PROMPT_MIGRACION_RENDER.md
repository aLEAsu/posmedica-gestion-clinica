# Prompt: Migrar "Gestión Clínica POSMÉDICA" a aplicación web (Front + Back + BD) en Render

> Copia todo lo que está debajo de la línea y pégalo en Claude Code, abierto en la carpeta `Aplicativo`.

---

## Rol y objetivo

Actúa como arquitecto y desarrollador full-stack senior con experiencia en software clínico en Colombia. Vas a convertir el archivo `Gestión Clínica POSMÉDICA (1).html` (prototipo de una sola página, ~1,4 MB, hecho por el coordinador médico) en una aplicación web multiusuario con frontend, backend y base de datos PostgreSQL, desplegada en **Render**.

**Regla de oro: el prototipo es la especificación funcional.** Las reglas clínicas, cálculos, metas, semáforos, alertas, indicadores, textos y el diseño visual ya fueron validados por la coordinación médica. No los reinterpretes ni los "mejores": extráelos y conserva el mismo comportamiento. Si algo es ambiguo, pregúntame antes de decidir.

## Qué contiene el prototipo (verifícalo tú leyendo el archivo)

- Shell "Sistema de gestión clínica" con: Panel de programas, Usuarios (rol Administrador y usuarios con programas asignados), Mensajes, Calendario de actividades, Documentos y guías, Laboratorio clínico, Producción asistencial, SOGCS · Comités (Seguridad del paciente, IAAS, PROA, Auditorías).
- **Programa VIH** (grupos: Inicio, Agenda, Pacientes, Gestión clínica — laboratorio, procedimientos, TAR, vacunación, alertas —, Indicadores, Reportes, Ruta y contrato).
- **Hemodiálisis** (Turno del día, Pacientes, Valoración mensual, Paraclínicos, Vacunación VHB, Acceso vascular, Trasplante, Calidad de diálisis y riesgo/Kt/V, Indicadores CAC, Alertas, Reportes, Calidad del dato, Referencia).
- **Ruta de Nefroprotección** embebida en un `<iframe srcdoc>` (estadificación por TFG, metas, controles por estadio, modelo por EPS, configuración de reportes).
- Importación/exportación Excel con SheetJS (`XLSX.read`, `sheet_to_json`, `book_new`, etc.).
- Imágenes (logo) embebidas en base64.
- Persistencia actual: memoria del navegador + `localStorage` (`hd_usuario`, `nefro_usuario`, `nefro_epsmodel`, `nefro_rep_cfg`) y `window.claude.use("downloads")` para descargas. **Todo esto debe reemplazarse** por API + base de datos y descargas normales del navegador.

## Fase 0 — Análisis (no escribas código de la app todavía)

1. El archivo es muy grande: no lo leas completo de una vez. Primero separa en `/_analisis/` los bloques `<style>`, cada `<script>`, el contenido del `srcdoc` del iframe de Nefroprotección (des-escapado) y los base64 como archivos de imagen.
2. Entrégame un documento `docs/ANALISIS.md` con:
   - Mapa de módulos, pestañas y sub-vistas.
   - **Modelo de datos inferido**: cada entidad (paciente, usuario, programa, atención, laboratorio/paraclínico, vacuna, acceso vascular, TAR, medicamento, alerta, evento SOGCS, mensaje, documento, parámetro/meta, EPS…), sus campos, tipos y relaciones.
   - Inventario de **reglas clínicas y cálculos** (TFG, estadios, Kt/V, semáforos, alertas, indicadores CAC, periodicidades por disciplina, metas institucionales) con su ubicación en el código original.
   - Formatos de Excel de entrada y salida (columnas exactas).
   - Lista de dudas y riesgos.
3. **Detente y espera mi aprobación** del análisis antes de la Fase 1.

## Stack (salvo que el análisis justifique otra cosa — en ese caso, propónla)

- **Monorepo** con `apps/web`, `apps/api`, `packages/clinical-rules`.
- **Frontend:** React + Vite + TypeScript. Reproducir fielmente el diseño actual (variables CSS de `:root`, tipografías IBM Plex Sans / Atkinson Hyperlegible / IBM Plex Mono, fondo blanco). Ruteo por módulo (`/vih`, `/hemodialisis`, `/nefroproteccion`, `/sogcs`, …); Nefroprotección deja de ser iframe y pasa a ser un módulo más.
- **Backend:** Node.js + TypeScript (Express o Fastify), validación con Zod, API REST versionada `/api/v1`.
- **Base de datos:** PostgreSQL + Prisma (migraciones versionadas y `seed` con parámetros, metas, EPS y el usuario administrador inicial).
- **`packages/clinical-rules`:** toda la lógica clínica extraída del prototipo como funciones puras compartidas por front y back. El backend es la fuente de verdad: recalcula alertas e indicadores, no confía en lo que envía el navegador.
- **Excel:** SheetJS. Importación en el backend con vista previa, validación fila por fila, reporte de errores y confirmación antes de guardar. Exportaciones con las mismas columnas que el prototipo.

## Requisitos no negociables (datos de salud — Colombia)

- **Autenticación real:** login con correo y contraseña (hash con argon2 o bcrypt), sesiones con cookie `httpOnly` + `Secure` + `SameSite`, bloqueo por intentos fallidos, cambio de contraseña obligatorio en el primer ingreso. Nada de "seleccionar usuario" como en el prototipo.
- **Autorización por rol y por programa:** Administrador, Coordinador médico, Médico, Enfermería, Auxiliar/Digitador, Consulta (solo lectura). Cada usuario ve únicamente los programas asignados (como `u.Programas` en el prototipo). Validar permisos en el backend, no solo ocultar botones.
- **Auditoría:** tabla de auditoría inmutable (quién, qué, cuándo, IP, valor anterior/nuevo) para cada creación, edición, borrado, importación y exportación de datos de pacientes.
- **Borrado lógico** (nunca físico) de registros clínicos.
- Cumplimiento de la **Ley 1581 de 2012** (habeas data) y la **Resolución 1995 de 1999** (historia clínica): confidencialidad, trazabilidad, custodia. Sin datos de pacientes en logs, URLs ni mensajes de error.
- Seguridad: HTTPS (Render lo da), `helmet`, CORS restringido al dominio del frontend, rate limiting, protección CSRF, consultas parametrizadas (Prisma), secretos solo en variables de entorno, nunca en el repo.
- **Datos de prueba ficticios.** No uses ni subas datos reales de pacientes en desarrollo, seeds o tests.

## Despliegue en Render

- Archivo **`render.yaml`** (Blueprint) que cree:
  - `posmedica-db`: PostgreSQL. **Plan pago** (el gratuito expira y no tiene backups; no sirve para datos clínicos). Región más cercana disponible.
  - `posmedica-api`: Web Service Node. Build: install + `prisma generate` + build. **Pre-deploy command:** `prisma migrate deploy`. Health check en `/api/health`. `DATABASE_URL` tomado de la BD con `fromDatabase`.
  - `posmedica-web`: Static Site (Vite) con regla de rewrite `/* → /index.html` para el ruteo SPA. Alternativa válida si simplifica cookies: servir el build del frontend desde la misma API (un solo dominio) — recomiéndame cuál y por qué.
- Variables de entorno documentadas en `.env.example` (`DATABASE_URL`, `SESSION_SECRET`, `CORS_ORIGIN`, `NODE_ENV`, `ADMIN_EMAIL`, …) con `generateValue: true` para secretos en `render.yaml`.
- El servicio web y la BD deben estar en la **misma región** y conectarse por la URL interna.
- Instrucciones de backup/restauración (`pg_dump`) y de creación del primer administrador.

## Plan de trabajo por fases (entrega cada fase funcionando y espera mi revisión)

1. **Fase 0:** análisis (arriba).
2. **Fase 1:** monorepo, BD + Prisma, auth, usuarios/roles/programas, auditoría, shell visual con navegación, `render.yaml` y **primer despliegue en Render** con health check verde.
3. **Fase 2:** `packages/clinical-rules` con **tests unitarios** (Vitest) que comparen resultados contra el prototipo con casos ficticios (mismos insumos → mismos estadios, alertas, indicadores).
4. **Fase 3:** módulo Hemodiálisis completo.
5. **Fase 4:** Programa VIH completo.
6. **Fase 5:** Ruta de Nefroprotección como módulo nativo (incluye modelo por EPS y configuración de reportes, hoy en `localStorage`).
7. **Fase 6:** módulos transversales (Mensajes, Calendario, Documentos, Laboratorio, Producción asistencial, SOGCS).
8. **Fase 7:** importación/exportación Excel, reportes, pruebas end-to-end (Playwright) de los flujos principales y endurecimiento de seguridad.

En cada fase: commits pequeños y descriptivos, README actualizado, y al final una lista de lo que quedó pendiente o con dudas.

## Entregables finales

- Repositorio Git listo para conectar a Render (GitHub).
- `README.md`: cómo correr local (Docker Compose para Postgres), cómo desplegar, cómo restaurar backups.
- `docs/ANALISIS.md`, `docs/MODELO_DATOS.md` (diagrama ER), `docs/REGLAS_CLINICAS.md` (cada regla con su fuente en el prototipo), `docs/MANUAL_USUARIO.md` breve para el personal de la clínica.
- Matriz de trazabilidad: cada pestaña/función del HTML original → dónde quedó en la nueva app.

Empieza por la Fase 0.
