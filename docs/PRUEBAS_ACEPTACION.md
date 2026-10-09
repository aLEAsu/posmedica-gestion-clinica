# Pruebas de aceptación · Sistema de gestión clínica POSMÉDICA

Guía para que la coordinación médica y el personal verifiquen el sistema antes de trabajar con datos reales.
Marque cada casilla al comprobarla y anote en **Observaciones** cualquier diferencia con el prototipo.

> **Regla de oro:** las pantallas, los cálculos, las alertas y los indicadores deben ser **los mismos del prototipo** que validó la coordinación. Si algo da distinto, repórtelo con el paciente (código, no nombre), la pestaña y lo que esperaba.

> Para probar **use pacientes ficticios** (p. ej. documento 1000000001, nombre «Prueba Ficticia»). Cuando terminen, el administrador puede inactivarlos o anularlos. Los registros nunca se borran: quedan anulados con su motivo.

---

## 0. Preparación (administrador)

- [ ] Ingresé con el usuario administrador inicial y el sistema me obligó a cambiar la clave.
- [ ] Creé un **segundo administrador** (para no quedar sin acceso si uno olvida su clave).
- [ ] Creé al menos estos usuarios de prueba (rol **Médico**), con sus programas:

| Usuario de prueba | Área | Programas y permisos |
|---|---|---|
| `prueba.enfhd` | Enfermería hemodiálisis | Hemodiálisis: ver, registrar |
| `prueba.vih` | Programa VIH | VIH: ver, registrar, exportar |
| `prueba.nefro` | Nefrología | Nefroprotección: ver, registrar, anular |
| `prueba.lab` | Laboratorio clínico | Laboratorio: ver, registrar |
| `prueba.sp` | Seguridad del paciente | Seguridad del paciente, IAAS, PROA: ver, registrar |
| `prueba.calidad` | **Calidad** | SOGCS: ver, registrar |
| `prueba.lectura` | Nutrición | Hemodiálisis: solo ver |

- [ ] Cada usuario recibió su clave temporal, ingresó y la cambió.

---

## 1. Acceso y seguridad

- [ ] Con una clave errada 5 veces, el usuario queda **bloqueado 15 minutos**; el administrador lo desbloquea en **Usuarios**.
- [ ] Un usuario solo ve **activos** los programas que se le asignaron; los demás aparecen atenuados.
- [ ] `prueba.lectura` entra a Hemodiálisis pero **no puede registrar**: aparece «Su usuario no tiene permiso…».
- [ ] Tras 30 minutos sin uso, la sesión se cierra y pide ingresar de nuevo.
- [ ] Solo el administrador ve **Usuarios**, **Auditoría** y **Respaldo**.
- [ ] En **Auditoría** aparecen los ingresos, los registros creados y modificados (con valor anterior y nuevo), las anulaciones y las exportaciones.
- [ ] En **Respaldo**, el Excel descargado tiene una hoja por tabla y **no** contiene claves.

Observaciones: ______________________________________________

---

## 2. Hemodiálisis (`prueba.enfhd`)

- [ ] **Pacientes → Nuevo paciente**: se crea con ID P001 (o el siguiente) y aparece la alerta de vacunación VHB si aplica.
- [ ] **Turno del día**: el paciente aparece en su turno; marcar «Realizada», escribir pesos y duración, y **Guardar turno**. La línea de estado muestra «Guardado · hora».
- [ ] Al **recargar la página** (o desde otro equipo) la sesión registrada sigue ahí.
- [ ] **Paraclínicos**: registrar Hb, Kt/V, albúmina, fósforo. Los semáforos e **Indicadores CAC** cambian como en el prototipo.
- [ ] **Vacunación VHB**, **Acceso vascular**, **Trasplante**, **Calidad de diálisis y riesgo**, **Alertas**, **Calidad del dato**: muestran lo mismo que el prototipo con los mismos datos.
- [ ] **Reportes**: exportar la matriz CAC; el archivo descarga y queda en la auditoría.
- [ ] **Dos personas a la vez**: dos usuarios editan el mismo paciente; al segundo le aparece «Otro usuario modificó… Se recargaron los datos».
- [ ] Facturación: solo el administrador la ve.

Observaciones: ______________________________________________

---

## 3. VIH (`prueba.vih`)

- [ ] **Pacientes → Nuevo paciente**: se crea con ID V0001 y aparecen sus alertas (sin TAR, sin carga viral…).
- [ ] Registrar **carga viral y CD4**: desaparecen las alertas correspondientes.
- [ ] Registrar **esquema TAR**, **entrega**, **cita**, **valoración**, **vacuna**, **procedimiento**. Al recargar siguen ahí.
- [ ] **Indicadores**: los 46 indicadores (CAC y Nueva EPS) calculan como en el prototipo.
- [ ] **Importar → archivo CAC** de 193 variables, **con y sin** fila de encabezado: crea o actualiza los pacientes y su arrastre CAC.
- [ ] **Reportes**: la cohorte nominal y el reporte CAC se exportan con las mismas columnas del prototipo.
- [ ] **Notificar** (mensaje) y **Evento de seguridad** desde la ficha del paciente funcionan y llegan a Mensajes y a Seguridad del paciente.

Observaciones: ______________________________________________

---

## 4. Nefroprotección (`prueba.nefro`)

- [ ] El encabezado muestra **BASE DE DATOS**; no aparece «Ver con datos ficticios».
- [ ] **Pacientes → Nuevo paciente**: «Paciente creado con novedad de ingreso».
- [ ] **Valoración**: diligenciar una valoración de un paciente y **Guardar valoración**; la clasificación (G, A, riesgo KDIGO, grupo CAC), las metas y el plan coinciden con el prototipo.
- [ ] **Registrar paraclínico, atención, novedad y contacto** desde la ficha. Un paraclínico repetido (mismo examen y fecha) se rechaza.
- [ ] **Anular** un paraclínico con motivo: deja de verse, pero queda en la auditoría.
- [ ] **Agenda → Abrir jornada** y **Agendar cita**: a los pocos segundos aparece «Agenda guardada»; al recargar la jornada y la cita siguen ahí.
- [ ] **Asistencia**: marcar llegada o inasistencia de una cita; se guarda.
- [ ] **Cohorte, Próximo mes, Vencidos, Indicadores por EPS, Alertas**: iguales al prototipo.
- [ ] El **modelo de atención por EPS** solo lo cambia el administrador.

Observaciones: ______________________________________________

---

## 5. Módulos transversales

**Laboratorio (`prueba.lab`)**
- [ ] Ve la solicitud del mes de Hemodiálisis y de VIH, marca muestras tomadas y carga resultados. Los resultados aparecen en Paraclínicos de Hemodiálisis y en Laboratorios de VIH.
- [ ] No puede registrar sesiones de hemodiálisis.

**Seguridad del paciente, IAAS y PROA (`prueba.sp`)**
- [ ] Ve los reportes de seguridad de todos los programas y puede analizarlos y cerrarlos.
- [ ] Listas de chequeo (higiene de manos, desinfección), matrices IAAS y PROA, auditoría de antimicrobianos y alertas de resistencia se registran y se conservan al recargar.
- [ ] Un usuario de otra área puede **reportar** un evento, pero no analizarlo; solo ve sus propios reportes.

**SOGCS y Documentos (`prueba.calidad`)**
- [ ] Crear un comité, una sesión con acta y quórum, y un compromiso con fecha límite.
- [ ] Como área **Calidad** puede crear y editar documentos; otro usuario solo los consulta.

**Mensajes y Calendario (cualquier usuario)**
- [ ] Enviar un mensaje a un usuario y otro a un área: solo los ven el remitente y los destinatarios (**ni siquiera el administrador** ve mensajes ajenos).
- [ ] Marcar como leído y responder.
- [ ] Crear una actividad en el calendario con invitados; los invitados confirman asistencia.

**Producción asistencial (administrador y usuarios con el módulo)**
- [ ] Las atenciones del mes por programa y EPS se ven para quien tiene el módulo.
- [ ] Las tarifas y valores (desbloqueo con clave) **solo** los ve el administrador.

Observaciones: ______________________________________________

---

## 6. Programas sin módulo propio

- [ ] Diálisis peritoneal, Consulta externa, Quimioterapia y Servicio farmacéutico muestran su ficha «en desarrollo» y permiten reportar eventos de seguridad y aportes a IAAS y PROA.

---

## 7. Respaldo y continuidad

- [ ] El administrador descarga el **Respaldo** (Excel y JSON) y lo guarda en un medio cifrado de la institución.
- [ ] Si la base de Render es gratuita: está anotada la fecha de vencimiento y la decisión de pasarla a plan pago o renovarla (ver [DESPLIEGUE_RENDER.md](DESPLIEGUE_RENDER.md), sección 8).

---

**Resultado:** ☐ Aprobado para datos reales  ☐ Aprobado con observaciones  ☐ No aprobado

Responsable: ____________________  Fecha: ____________  Firma: ____________________
