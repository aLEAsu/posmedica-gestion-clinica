# Pruebas de aceptación · Sistema de gestión clínica POSMÉDICA

Guía para que la coordinación médica y el personal verifiquen el sistema antes de trabajar con datos reales.
Marque cada casilla al comprobarla y anote en **Observaciones** cualquier diferencia con el prototipo.

> **Regla de oro:** las pantallas, los cálculos, las alertas y los indicadores deben ser **los mismos del prototipo** que validó la coordinación. Si algo da distinto, repórtelo con el paciente (código, no nombre), la pestaña y lo que esperaba.

> **Versión v3.2 · arranque desde cero.** El sistema se despliega con la base vacía: no trae pacientes, usuarios de prueba, datos de demostración ni botones para cargarlos. Lo que se registre desde el primer día es real. Si quiere ensayar antes con pacientes ficticios (p. ej. documento 1000000001, «Prueba Ficticia»), hágalo en una base aparte o recree la base de Render antes de empezar con datos reales: los registros nunca se borran (quedan anulados con su motivo).

> **Ningún valor clínico se supone.** Desde la v3.2 el sistema no precarga signos vitales, pesos, puntajes ni pacientes «de ejemplo»: lo que no se midió queda vacío o «sin registro». Si ve un valor que nadie digitó, repórtelo.

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
| `prueba.dp` | Enfermería diálisis peritoneal | Diálisis peritoneal: ver, registrar (la v1.1 no usa roles internos) |
| `prueba.qt` | Quimioterapia | Quimioterapia: ver, registrar |
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

**Novedades de la v3.2 en Hemodiálisis**
- [ ] La navegación nueva (barra lateral, 8 ejes, tema claro/oscuro, buscador Ctrl+K) lleva a cada pestaña.
- [ ] **Verificación pre-turno**: sin registro, el turno aparece en rojo «verifique agua y desinfección» (nunca como «Sí» supuesto). Al marcar Sí/No se guarda, aparece quién verificó y sigue al recargar.
- [ ] **Turno del día**: FC, FR y SatO2 arrancan **vacíos**; lo digitado se guarda con la sesión.
- [ ] **Indicadores CAC 2026** (17): ventanas «al cierre», completitud y estados «No evaluable / Preliminar» como en el prototipo v3.2.
- [ ] **Eventos SIIS (64 códigos)**: registrar una actividad exige paciente y conducta; sigue al recargar.
- [ ] **Oxígeno medicinal**: primero **Registrar cilindro** en el kárdex (tipo, ubicación, lote, vencimiento, presión). La oxigenoterapia exige paciente, cilindro, flujo, minutos y SatO2 antes y después; al guardar, la presión del cilindro se actualiza.
- [ ] **Valoración mensual**: el KRu y el Kt/V total no se calculan si el paciente no tiene peso seco (no se supone un peso). Los signos de la preconsulta caen solos a la valoración.
- [ ] **Calculadora UKM**: al cargar un paciente sin BUN pre/post o sin peso seco, avisa qué campos siguen con valores de simulación.

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
- [ ] Las tarifas y valores **solo** los ve el administrador (desde la v3.2 sin clave adicional: el servidor no los entrega a nadie más).
- [ ] Quien solo tiene Producción ve cuántas valoraciones están cerradas, pero no su contenido clínico.

**Registros transversales de la v3.2 (cada uno por programa: lo ve y lo registra quien tiene ese programa)**
- [ ] **Preconsulta de enfermería**: exige PAS y PAD; los campos arrancan vacíos (sin 36,5 °C ni 96 % precargados). El paciente queda «listo para atención» y sus signos llegan a la HC del programa.
- [ ] **HC de Consulta externa**: sin preconsulta, la nota para SIIS dice «sin registro» (no trae TA, peso ni talla de ejemplo).
- [ ] **Asistencia por disciplina** (calendario de 12 meses): marcar asistió / no asistió y verlo al recargar.
- [ ] **Procedimientos quirúrgicos e invasivos**: exige la verificación de desinfección y la lista de insumos; genera la solicitud a Servicios generales y, si es un catéter, actualiza el registro de dispositivos.
- [ ] **Vacunación renal** (Nefroprotección) y **soportes pre-SISCAC**: se guardan y siguen al recargar.
- [ ] Un usuario de otro programa **no** ve la preconsulta, la asistencia ni los procedimientos de pacientes de un programa que no tiene.
- [ ] **Capacitaciones** y **Liberación de reportes a la EPS**: se registran; la liberación la ve solo su programa (y Calidad).
- [ ] **IAAS-09 y PROA desde DP v1.1**: una peritonitis registrada en Diálisis peritoneal v1.1 aparece en IAAS (una recaída —≤ 28 días con el mismo germen— no cuenta como episodio nuevo) y su tratamiento en PROA. Esos registros se editan en DP v1.1, no desde IAAS.

Observaciones: ______________________________________________

---

## 6. Diálisis peritoneal v1.1 (`prueba.dp`)

- [ ] El módulo abre la **v1.1** (Tablero, Habilitación, Contratación por EPS, Pacientes, Calendario, Gestión clínica, Kt/V, Laboratorios, Farmacia, Peritonitis y eventos, Indicadores). «Quién registra» lo fija la sesión.
- [ ] **Carga inicial** (administrador, con el módulo vacío): «Traer pacientes y laboratorios de DP v0.8» informa lo que no traslada; o «Importar copia .json del módulo». Los **contratos por EPS** se cargan una vez (.json o el .html del prototipo).
- [ ] **Pacientes**: crear y editar; siguen al recargar. Si la persona ya existe en otro programa (mismo documento), es la misma persona del maestro único.
- [ ] **Kt/V, laboratorios, valoraciones, visitas y eventos**: se registran con permiso «registrar»; retirar uno exige «anular» y queda anulado (no se borra).
- [ ] **Metas, costos y catálogo de insumos**: solo el administrador los cambia; los demás no ven costos ni precios.
- [ ] **Dos personas a la vez** sobre el mismo registro: al segundo le aparece el aviso y el módulo se recarga.
- [ ] **Copia .json** y **Excel** exigen el permiso de exportar y quedan en la auditoría.
- [ ] **Indicadores** (CAC 2026 con filtro por EPS): iguales al prototipo con los mismos datos.

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

## 8.1 Robustez (después de la auditoría técnica)

- [ ] Si el servidor rechaza un cambio (por ejemplo, dos personas editan lo mismo), arriba del módulo aparece en rojo «No se guardó un cambio» con el motivo, hasta pulsar **Entendido**.
- [ ] Sin conexión, el estado dice «Sin guardar»; al intentar salir del módulo o cerrar la pestaña, el sistema pide confirmación. Al volver la conexión, el cambio se guarda solo.
- [ ] Dos enfermeras guardan el turno de hemodiálisis al mismo tiempo: la segunda recibe el aviso y su turno sigue digitado en pantalla para guardarlo de nuevo.
- [ ] Trabajando más de 15 minutos solo dentro de Nefroprotección, la sesión NO se cierra. Sin tocar nada durante 15 minutos, sí.
- [ ] Un usuario solo de Producción, IAAS, PROA o SP no ve el TAR, las valoraciones ni los antecedentes del programa VIH; sus vistas muestran lo mismo que antes.
- [ ] En Consulta externa, al abrir agenda para un profesional que ya tiene jornada en Nefroprotección a esa hora, aparece el cruce (aunque Nefroprotección no se haya abierto).

---

## 8.2 Gestión solo para administradores (v3.2)

- [ ] **Contratos y tecnologías**: solo el administrador lo abre. La primera vez pide cargar la matriz contractual (.json o el .html del prototipo; del .html solo se envía la matriz). Después, el buscador responde por programa y EPS. Un usuario no administrador ve «solo para el administrador».
- [ ] **Talento humano y bienestar**: solo el administrador. Arranca **vacío** (sin personal de ejemplo). Empleados del mes, cuadro de turnos, formatos y clima laboral (el puntaje es obligatorio) se guardan y siguen al recargar.
- [ ] Ninguno de los dos se puede asignar a otros usuarios en **Usuarios**.

---

## 9. Quimioterapia y programas sin módulo propio

- [ ] **Quimioterapia** está en uso: con el programa asignado se registran sesiones (esquema, ciclo, doble verificación, extravasación, reacciones); otros usuarios no las ven.
- [ ] Servicio farmacéutico muestra su ficha, como en el prototipo.

---

## 10. Respaldo y continuidad

- [ ] El administrador descarga el **Respaldo** (Excel y JSON) y lo guarda en un medio cifrado de la institución.
- [ ] Si la base de Render es gratuita: está anotada la fecha de vencimiento y la decisión de pasarla a plan pago o renovarla (ver [DESPLIEGUE_RENDER.md](DESPLIEGUE_RENDER.md), sección 8).

---

**Resultado:** ☐ Aprobado para datos reales  ☐ Aprobado con observaciones  ☐ No aprobado

Responsable: ____________________  Fecha: ____________  Firma: ____________________
