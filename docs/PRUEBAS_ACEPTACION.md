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
| `prueba.dp` | Enfermería diálisis peritoneal | Diálisis peritoneal: ver, registrar · rol en DP: **Enfermería profesional** |
| `prueba.ce` | Admisiones | Consulta externa: ver, registrar · rol en CE: **Admisiones**, sin ver reservadas |
| `prueba.infecto` | Infectología | Consulta externa: ver, registrar · rol en CE: **Admisiones**, **ve reservadas** |

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
- [ ] **Acceso vascular → Registro de dispositivos** (v0.6): registrar un catéter con su fecha de inserción; con «Proponer desde el historial» aparecen los catéteres sin validar y se validan uno por uno. Mientras falte un dato, el indicador ITS-CVC (dia_33) dice «no calculable» y explica qué falta.
- [ ] **Infecciones y antimicrobianos**: registrar una infección fuera de sesión y prescribir un antimicrobiano. El hemocultivo se confirma solo cuando Laboratorio registra el resultado en **Microbiología**.
- [ ] **Limpieza y desinfección**: registrar la limpieza de una máquina y la terminal de sala; marcar la desinfección del puesto en el Turno del día.
- [ ] La barra fija **Reportar evento adverso** y **Novedad a Coordinación** aparece abajo a la derecha; la novedad llega a Mensajes del área Coordinación asistencial (o del administrador).

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
- [ ] Ruta **v8**: pestañas **Cohortes**, **Auditoría GPC** y **Nominal EPS**. Registrar una auditoría de adherencia: aparece «Guardado en la base de datos» y al recargar sigue ahí. Al cargar la nominal anterior de la EPS (arrastre), queda guardada.
- [ ] La Ruta se abre dentro del portal con la barra **Reportar evento adverso / Novedad a Coordinación**.

Observaciones: ______________________________________________

---

## 5. Módulos transversales

**Laboratorio (`prueba.lab`)**
- [ ] Ve la solicitud del mes de Hemodiálisis y de VIH, marca muestras tomadas y carga resultados. Los resultados aparecen en Paraclínicos de Hemodiálisis y en Laboratorios de VIH.
- [ ] **Microbiología**: registra un hemocultivo de un evento ITS-CVC de hemodiálisis con su resultado y antibiograma. En Hemodiálisis el evento pasa a «Confirmada». Solo Laboratorio registra cultivos.
- [ ] No puede registrar sesiones de hemodiálisis.

**Seguridad del paciente, IAAS y PROA (`prueba.sp`)**
- [ ] Ve los reportes de seguridad de todos los programas y puede analizarlos y cerrarlos.
- [ ] Listas de chequeo (higiene de manos, desinfección), matrices IAAS y PROA, auditoría de antimicrobianos y alertas de resistencia se registran y se conservan al recargar.
- [ ] Un usuario de otra área puede **reportar** un evento, pero no analizarlo; solo ve sus propios reportes.
- [ ] **Seguridad del paciente → Higiene de manos**: registrar la auditoría trimestral de los 5 momentos por servicio.
- [ ] **IAAS y PROA por procesos** (v0.7): Bandeja, Procesos, Plan de trabajo, Vigilancia, Comité (con compromisos verificados), Mejoramiento, Documentos e Indicadores. IAAS clasifica los episodios infecciosos de HD; PROA audita los tratamientos que prescribe Hemodiálisis (no los vuelve a digitar). Cerrar el mes de un indicador deja su valor congelado.

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

## 6. Diálisis peritoneal (`prueba.dp`)

- [ ] El administrador asigna los roles en **Reportes → Roles y parámetros** (p. ej. `prueba.dp` = Enfermería profesional). Sin rol, el usuario solo consulta.
- [ ] **Pacientes → Nuevo paciente** y **Editar datos**: se guardan («Guardado · hora») y siguen al recargar. Si la persona ya existe en otro programa (mismo documento), es la misma persona del maestro único.
- [ ] **Valoraciones**, **Agenda**, **Laboratorios** (resultado, validación y Kt/V), **Tratamiento y seguridad** (catéter, peritonitis y orificio de salida con criterios ISPD, antimicrobianos, hospitalización, trasplante, calidad de vida), **Insumos y entregas**: se registran según el rol (Enfermería no prescribe diálisis; solo Nefrología o Dirección).
- [ ] **Indicadores** (consenso CAC 2026 y operativos) y **Reportes → Reporte CAC — DP**: iguales al prototipo con los mismos datos.
- [ ] **Importar archivos** (archivo de control de valoraciones): muestra la vista previa, no duplica pacientes y deja los heredados «pendientes de verificación».
- [ ] **Reportes → Bitácora** muestra quién cambió qué y cuándo (es la auditoría del servidor).
- [ ] Una peritonitis registrada aparece en **IAAS** (IAAS-09) y su antimicrobiano en **PROA**; el cultivo lo registra **Laboratorio → Microbiología**.

Observaciones: ______________________________________________

---

## 7. Consulta externa (`prueba.ce`, `prueba.infecto`)

- [ ] El administrador asigna los roles en **Administración** (Coordinación, Admisiones, Autorizaciones, Profesional, Calidad) y quién **ve especialidades reservadas**.
- [ ] **Nueva solicitud**: registra la demanda aunque falte la autorización; detecta la solicitud duplicada de la misma necesidad.
- [ ] **Agenda**: abrir jornadas por rango (sin cruces de profesional ni de consultorio), bloquear cupos y **asignar citas** respetando el orden de la lista de espera (saltarlo exige motivo).
- [ ] **Dos personas asignan el mismo cupo a la vez**: a la segunda le aparece «Otro usuario asignó este cupo» y la solicitud sigue en la lista.
- [ ] `prueba.ce` **no ve** solicitudes ni citas de Infectología u Oncología; `prueba.infecto` sí.
- [ ] **Autorizaciones**, **Pacientes**, **Calidad del dato** y la **oportunidad** de la asignación (Res. 256) funcionan como en el prototipo.

Observaciones: ______________________________________________

---

## 8. Tablero gerencial (administrador)

- [ ] Solo lo ven los administradores (no aparece en Usuarios para asignarlo).
- [ ] Muestra el rendimiento de cada programa frente a sus metas, los riesgos abiertos y los datos para decidir. Nefroprotección aparece después de unos segundos (se calcula en segundo plano).

---

## 9. Programas sin módulo propio

- [ ] Quimioterapia y Servicio farmacéutico muestran su ficha «en desarrollo», como en el prototipo.

---

## 10. Respaldo y continuidad

- [ ] El administrador descarga el **Respaldo** (Excel y JSON) y lo guarda en un medio cifrado de la institución.
- [ ] Si la base de Render es gratuita: está anotada la fecha de vencimiento y la decisión de pasarla a plan pago o renovarla (ver [DESPLIEGUE_RENDER.md](DESPLIEGUE_RENDER.md), sección 8).

---

**Resultado:** ☐ Aprobado para datos reales  ☐ Aprobado con observaciones  ☐ No aprobado

Responsable: ____________________  Fecha: ____________  Firma: ____________________
