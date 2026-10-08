# Fase 0 · Análisis del prototipo «Gestión Clínica POSMÉDICA»

> Fuente: `Gestión Clínica POSMÉDICA (1).html` (1,42 MB). Fecha del análisis: 8 de octubre de 2026.
> El archivo se separó en `_analisis/` (ver §1). Todas las referencias `archivo:línea` apuntan a esos archivos.

---

## 0. Resumen ejecutivo

1. **El prototipo son cuatro aplicaciones dentro de un mismo HTML.** Cada una tiene su propia forma de guardar datos, su propio maestro de pacientes y su propio libro Excel:

   | Aplicación | Código | Libro Excel | Hojas | ID de paciente |
   |---|---|---|---|---|
   | **Portal institucional**: usuarios, mensajes, comités, calendario, SP/IAAS/PROA, producción, laboratorio | `portal/portal_nucleo.js` (722 líneas) | «Libro institucional» | 16 | — |
   | **Hemodiálisis** | `hemodialisis/hd.js` (1.735 líneas) | «Libro de hemodiálisis» | 23 | `P001` |
   | **VIH** | `vih/vih.js` (1.278 líneas) | «Libro del programa VIH» | 14 | `V0001` |
   | **Nefroprotección v7.2**: va dentro de un iframe y ya trae un modo con base de datos (PostgREST) | `nefroproteccion/*.js` (~2.100 líneas) | Libro propio | 9 | `codigo` |

2. **La lógica clínica tiene buena calidad y está bien aislada.** Las fórmulas, los indicadores, las alertas y las reglas están en funciones puras con fuentes citadas (KDIGO, CAC, CDC, GPC VIH 2021). Se pueden extraer casi sin cambios a `packages/clinical-rules`.
3. **Ya hace trazabilidad.** Cada libro tiene una hoja `Bitacora` (crea / modifica / anula, con el detalle «antes → después»), usa anulación lógica (`Anulado` + `MotivoAnulacion`) y registra `Usuario` y `Registrado` en cada fila. Esto pasa directamente a la base de datos.
4. **Nefroprotección ya tiene diseñado un esquema PostgreSQL.** Usa tablas `paciente`, `laboratorio`, `valoracion`, `atencion`, `novedad`, `eps`, `eps_modelo_atencion`, `contacto_gestion` y la vista `v_eps_modelo_vigente`. También funciones RPC: `registrar_valoracion`, `importar_libro`, `guardar_paciente` y `congelar_corte`. El SQL de ese esquema **no viene en el HTML** (ver la pregunta P1).
5. **Hay cuatro decisiones de diseño que necesito que apruebes** (§7): el maestro de pacientes, los roles, el cifrado de la facturación y el alcance de los programas que todavía no tienen módulo.

---

## 1. Extracción realizada (`_analisis/`)

```
_analisis/
├─ estilos/portal.css               variables :root, tipografías, componentes (35 KB)
├─ img/logo_posmedica.jpg           logo UNO-P (estaba 3 veces en base64; es la misma imagen)
├─ portal/
│  ├─ markup.html                   esqueleto HTML (contenedores #pxmain, #hdapp, #nefroapp)
│  ├─ portal_nucleo.js              núcleo del portal (líneas 1782-2528 del script original)
│  ├─ puente_nefro.js               cómo se monta el iframe de Nefro (2529-2551)
│  └─ portal_eventos.js             eventos del portal (3868-3953)
├─ hemodialisis/hd.js               módulo HD (líneas 1-1781 del script original)
├─ vih/vih.js                       módulo VIH (2553-3867)
└─ nefroproteccion/                 HTML embebido en NEFRO_HTML (372 KB), des-escapado
   ├─ _original_embebido.html
   ├─ markup.html, estilos.css
   ├─ motor_clinico.js              clasificación, metas, medicamentos, plan (sin DOM)
   ├─ motor_cohorte.js              cohorte, indicadores, fichas técnicas
   ├─ interfaz.js                   formulario de valoración
   └─ gestion_programa.js           agenda, reportes, API PostgREST, datos ficticios
```

Dependencia externa: **SheetJS 0.18.5** (cdnjs). Tipografías: **IBM Plex Sans, Atkinson Hyperlegible, IBM Plex Mono** (Google Fonts).

---

## 2. Mapa de módulos y vistas

### 2.1 Portal (shell)
- **Ingreso**: usuario y clave (PBKDF2-SHA256, 100.000 iteraciones), en `portal_nucleo.js:71` y `:105`. Hay un modo demostración con 11 usuarios ficticios (clave `demo1234`).
- **Panel de programas**: 16 programas en 4 grupos (`portal_nucleo.js:22`). Los que el usuario no tiene asignados aparecen atenuados. Muestra «Pendientes para usted».

| Grupo | Programas | Estado en el prototipo |
|---|---|---|
| Misionales | Nefroprotección, Hemodiálisis, VIH | **Módulo completo** |
| Misionales | Diálisis peritoneal, Consulta externa, Quimioterapia | Solo ficha «en desarrollo» |
| Apoyo | Laboratorio clínico | Módulo mínimo (solicitud mensual, muestras, resultados) |
| Apoyo | Servicio farmacéutico | Solo ficha «en desarrollo» |
| Transversales | Seguridad del paciente, IAAS, PROA | Tableros, listas de chequeo, auditoría PROA, alertas RAM |
| Gestión | Calendario, Producción asistencial, SOGCS·Comités, Documentos y guías, Mensajes | Módulos completos |

- **Usuarios** (solo administrador): crear y editar, asignar programas, activar y desactivar. El administrador no puede quitarse el rol a sí mismo.
- **Mensajes**: hilos con prioridad, plazo, paciente o programa asociado, acuse de lectura y cierre.
- **SOGCS**: comités con frecuencia, sesiones (acta, quórum, asistentes) y compromisos con fecha límite.
- **Calendario**: actividades propias más las que salen de SOGCS (sesiones y vencimientos de compromisos), con invitados y respuestas.
- **Producción asistencial**: atenciones por mes, EPS y CUPS. HD se calcula a partir del turno. Las tarifas y la conciliación están **cifradas con clave**.

### 2.2 Hemodiálisis (13 vistas, `hd.js:229`)
Turno del día · Pacientes · Valoración mensual · Paraclínicos · Vacunación VHB · Acceso vascular · Trasplante · Calidad de diálisis y riesgo · Indicadores CAC · Alertas · Reportes · Calidad del dato · Referencia. Además: Farmacia (prescripción y dispensación), Facturación con clave e importador del «Dashboard mensual».

### 2.3 VIH (7 grupos, 15 pestañas)
`Inicio[tab]` · `Agenda[age]` · `Pacientes[pob, aud, car]` · `Gestión clínica[lab, prc, tar, vac, ale]` · `Indicadores[ind]` · `Reportes[rep, fac, cal]` · `Ruta y contrato[ruta]`. También la ficha del paciente (historial, datos y cohorte editables), valoraciones por disciplina, historia clínica precargada, notas para copiar al sistema y auditoría CAC de la historia clínica.

### 2.4 Nefroprotección v7.2
Valoración individual (clasificación G/A, grupo CAC, metas, medicamentos indicados, plan de intervenciones, nota de HC) · Agenda (jornadas, cupos espejo, citas, asistencia e inasistencias, «por agendar», estadísticas) · Cohorte · Próximo mes · Vencidos · Indicadores (tablero de 15 fichas) · Alertas y calidad · Reportes para EPS y normativos · Modelo de atención por EPS · Configuración de reportes.

---

## 3. Modelo de datos inferido

Convenciones que se repiten en casi todas las tablas clínicas: `ID` con prefijo y consecutivo, `Paciente` (FK), `Usuario`, `Registrado` (marca de tiempo), `Anulado` (SI/vacío) y `MotivoAnulacion`. **En la base de datos** esto se convierte en `id`, `paciente_id`, `creado_por`, `creado_en`, `anulado_en`, `anulado_por` y `motivo_anulacion`, más la tabla de auditoría central.

### 3.1 Portal · 16 hojas (`portal_nucleo.js:4`)
| Entidad | Campos principales |
|---|---|
| **Usuarios** | Usuario, Nombre, Cargo, Area, Rol (`Administrador`/`Estándar`), Programas (lista), Sal, Hash, Activo |
| **Mensajes** | Hilo, FechaHora, De, Para, Tipo, Prioridad, Asunto, Cuerpo, Paciente, Programa, Plazo, Estado, LeidoEn/Por, CerradoEn |
| **Comites** / **ComiteSesiones** / **Compromisos** | Comité (frecuencia, mes de inicio, norma, integrantes) → sesión (periodo, acta, quórum) → compromiso (responsable, fecha límite, evidencia) |
| **Documentos** | Codigo, Nombre, Tipo, Programas, Proceso, Version, FechaAprobacion, ProximaRevision, Estado, Enlace |
| **ListasChequeo** | Fecha, Turno, Programa, Lista, Lugar, Cumplidos, Aplicables, Observador |
| **AportesManuales** | Periodo, Matriz, Indicador, Programa, Numerador, Denominador |
| **ProaAuditoria** / **AlertasRAM** | Auditoría prospectiva de antimicrobianos; alertas de resistencia |
| **Calendario** | Titulo, Tipo, Comite, Fecha, Horas, Modalidad, Lugar, Invitados, Respuestas, Serie, Visibilidad |
| **Produccion** | Fecha, Programa, EPS, Paciente, Actividad, CUPS, Cantidad (+ anulación) |
| **ReportesSP** | Reportes de seguridad del paciente de los programas sin módulo |
| **Bitacora**, **Config** | Auditoría y parámetros clave-valor (JSON) |

### 3.2 Hemodiálisis · 23 hojas (`hd.js:101`)
| Entidad | Campos principales |
|---|---|
| **Pacientes** (64 campos) | Identificación (TipoDoc, Documento, Nombres, Apellidos, FechaNac, Sexo), afiliación (EPS, Régimen, FechaAfiliacion), residencia (Municipio, DANE, Zona), Etnia, GrupoPob, comorbilidades (HTA, DM, DMTipo y sus fechas), ERC (Etiologia, FechaDxERC5, TFGInicio, ModoInicio, InicioTRR), ingreso (IngresoUnidad, Procedencia), **estado** (Estado, FechaEstado, CausaMuerte), **prescripción** (Turno, Puesto, SesSemana, DuracionMin, PesoSeco), **acceso** (AccesoInicial/Actual/Desde, RutaAcceso, SoporteRuta), **trasplante** (TxEstado, TxFecha, TxIPS), VHB (VacunaVHB, VHBNoRespondedor), Paratiroidectomia, **Metas individuales (JSON)** |
| **Sesiones** | Fecha, Turno, Puesto, Tipo (Programada/Extra/Reprogramada), Estado (Realizada/No asistió/Canceló/Suspendida), Motivo → Responsable, DuracionMin, Acceso, Pesos pre/post, TA pre/post, Gluco, KtVOCM, UFNeta, UFR, UFMaquina |
| **Eventos** | Evento intradialítico (24 tipos), Severidad, Conducta, Resuelto, Hemocultivo, Microorganismo, Resistencia |
| **Paraclinicos** | FechaToma, Examen (31 claves, `hd.js:72`), Valor, Metodo |
| **Novedades** | Hospitalización o viaje: Inicio, Fin, Causa, Atribuible, Evitable |
| **Movimientos** | Egresos (7 tipos) y reingresos → definen los **intervalos de actividad** del paciente |
| **Contactos** | Búsqueda activa de inasistentes: Medio, Resultado |
| **AccesoNovedades** | 15 tipos de novedad; algunas cambian el acceso actual |
| **Atenciones** | Por disciplina (10 disciplinas) |
| **Valoraciones** | Mensual: PesoSeco, Diuresis, puntaje y categoría de calidad, Análisis, Plan, Datos (JSON con la rúbrica manual) |
| **SeguridadPaciente**, **Antimicrobianos**, **Auditorias** | Insumos de SP, PROA e IAAS |
| **Prescripciones**, **Dispensacion** | Farmacia: medicamento, dosis, cantidad al mes, MIPRES; entregada frente a prescrita |
| **Estudios** | Imágenes y procedimientos: Resultado, Relevante («tener presente»), ProximoControl |
| **Vacunas** | VHB: Esquema, Serie (1, 2, 3, Refuerzo), NumDosis, Lote |
| **TrasplanteSeguimiento** | Ítem de la lista KDIGO 2020 (28 ítems), Estado, Resultado |
| **SolicitudesLab** | Mes, Programa, Examen, Origen, Estado (Pendiente/Muestra tomada/No tomada) — **compartida con Laboratorio** |
| **Cortes** | Fotografía del corte CAC (Datos JSON) |
| **Config** | Ver §3.5 |
| **Fin_cifrado** | Tarifas y valores facturados, cifrados con AES-256-GCM |

### 3.3 VIH · 14 hojas (`vih.js:9`)
| Entidad | Campos principales |
|---|---|
| **Pacientes** (53 campos) | Nombres separados (4 campos), PoblacionClave (7), Mecanismo, TipoIngreso (5), FechaDx, FechaPresentacion, FechaIngresoIPS, OportunistaDx, Modalidad, Sede, Gestante, CIE10, OrientacionSexual, TARPrevio, Barreras, Estado (6), FechaEgreso, MotivoEgreso |
| **Antecedentes** | 16 categorías de antecedentes y grupo sanguíneo |
| **Laboratorios** | Examen (30 claves con CUPS, `vih.js:48`), Valor **o** Resultado cualitativo, Fuente, Solicitud |
| **EsquemasTAR** | Inicio, Fin, Esquema (15 predefinidos, `vih.js:82`), Linea, Motivo, **Validacion de seguridad** (ValidadoPor, Fecha) |
| **EntregasTAR** | Fecha, Meses, Unidades → define la **cobertura** |
| **Agenda** | Fecha, Hora, Disciplina (8), Tipo, Modalidad, Estado, Motivo de inasistencia, Gestion |
| **Valoraciones** | Signos vitales, SMAQ, RCV, tamizaje TB, examen, diagnósticos, plan, Extra (JSON) |
| **Vacunas** | Carné de 10 vacunas; Estado (Aplicada/Antecedente con o sin soporte/Contraindicada/Rechazada) |
| **Procedimientos** | PPD, citología cervicovaginal y anal, ADN-VPH: orden, lectura, resultado, próxima fecha |
| **Profilaxis** | TMP/SMX, isoniazida, etc. |
| **Novedades** | 14 tipos (hospitalización, TB, gestación, falla virológica, fallecimiento…) |
| **SolicitudesLab** | Igual que HD |
| **ArrastreCAC** | Último reporte CAC enviado por paciente (Datos JSON con las 193 variables) |
| **Config** | Contrato de laboratorios por EPS (editable), frecuencias de agenda |

### 3.4 Nefroprotección · 9 hojas / tablas PostgREST
`Pacientes`, `Laboratorios`, `Valoraciones` (PA, peso, talla, cintura, medicamentos de nefroprotección, conducta, causa de la ERC, Karnofsky, síntomas, **estadio, albuminuria, riesgo KDIGO, grupo, TFGe, KFRE a 2 y 5 años, próximo control, nota de HC, versión de la herramienta**), `Atenciones`, `Novedades`, `Jornadas`, `Citas`, `Citas_log`, `Contactos`. Más el **plan** de cada valoración (sección, actividad, frecuencia, fecha programada) y `eps_modelo_atencion` con vigencia.

### 3.5 Parámetros configurables (hoy en hojas `Config`)
- **HD** (`hd.js:87`): puestos (13), duración por defecto (240 min), **sesiones mínimas y máximas por EPS**, frecuencias de exámenes y mes ancla, método de Kt/V, turnos, metas por paciente (`META_DEF`, `hd.js:86`), código IPS (`860010090801`), códigos de EPS, esquemas de vacuna, ítems de trasplante.
- **VIH**: contrato de laboratorios por EPS, frecuencia de control por disciplina (`vih.js:881`), códigos de EPS.
- **Nefro**: modelo de atención por EPS (`motor_clinico.js:428`) y configuración de reportes.
- **Catálogos compartidos**: EPS (NUEVA EPS, MALLAMAS, FOMAG, FAMILIAR DE COLOMBIA, EMSSANAR, OTRA), municipios DIVIPOLA del Putumayo, disciplinas, CUPS.

### 3.6 Propuesta de modelo relacional (borrador para discutir)
```
-- núcleo
usuario, rol, usuario_programa, programa, sesion_login, auditoria (inmutable)
eps, municipio, catalogo (tipo, clave, etiqueta, orden, activo), parametro (programa, clave, valor jsonb, vigente_desde)
persona (tipo_doc, documento, nombres, apellidos, fecha_nac, sexo, eps, régimen, residencia…)  ← maestro único
inscripcion_programa (persona_id, programa, código interno P001/V0001, estado, ingreso, egreso)
-- HD:    hd_paciente (prescripción, acceso, Tx, metas jsonb), hd_sesion, hd_evento, hd_novedad, hd_movimiento,
--        hd_contacto, hd_acceso_novedad, hd_valoracion, hd_estudio, hd_vacuna, hd_tx_item, hd_prescripcion,
--        hd_dispensacion, hd_corte
-- VIH:   vih_paciente, vih_antecedente, vih_esquema_tar, vih_entrega_tar, vih_cita, vih_valoracion, vih_vacuna,
--        vih_procedimiento, vih_profilaxis, vih_novedad, vih_arrastre_cac
-- Nefro: nefro_paciente, nefro_valoracion, nefro_plan_item, nefro_atencion, nefro_novedad, nefro_jornada,
--        nefro_cita, nefro_cita_log, nefro_contacto, eps_modelo_atencion
-- compartidas: laboratorio_resultado (persona, programa, examen, valor, resultado_texto, método, fuente),
--        solicitud_laboratorio, atencion_disciplina, produccion, tarifa (con permiso especial)
-- portal: mensaje, comite, comite_sesion, compromiso, documento, lista_chequeo, aporte_manual,
--        proa_auditoria, alerta_ram, evento_calendario, reporte_sp, antimicrobiano
```

---

## 4. Inventario de reglas clínicas y cálculos

> Todas son funciones puras y pasan tal cual a `packages/clinical-rules`. Cada una tendrá una prueba de equivalencia contra el prototipo.

### 4.1 Fórmulas
| Regla | Ubicación | Detalle |
|---|---|---|
| **Kt/V Daugirdas II** | `hd.js:231` | `-ln(R − 0,008·t) + (4 − 3,5·R)·UF/W` |
| **UF y tasa de UF** | `hd.js:1427` | UF (kg ≈ L), UFR en mL/kg/h con el peso post; > 13 se marca en rojo |
| **Ganancia interdialítica** | `hd.js:219` | Peso pre de la sesión menos peso post de la anterior (≤ 4 días), % del peso seco, últimas 8 sesiones |
| **TFGe CKD-EPI 2021 (sin raza)** | `vih.js:242`, `motor_clinico.js:7` | Misma fórmula en VIH y Nefro: se unifica en una sola |
| **KFRE de 4 variables** (2 y 5 años) | `motor_clinico.js:8` | Calibración no norteamericana |
| **Estadio G y albuminuria A** | `motor_clinico.js:9-10` | G1 ≥ 90 … G5 < 15; A1 < 30, A2 < 300, A3 |
| **Riesgo KDIGO y frecuencia de controles** | `motor_clinico.js:11-12` | Mapa de calor G×A |
| **Estadio VIH** inicial y actual | `vih.js:166` (`vxSt`) | Por CD4 (< 200, < 500) y enfermedad oportunista |
| **Edad, curso de vida, grupo etario** | `hd.js`, `vih.js` | Varias definiciones según el reporte |

### 4.2 Clasificaciones y metas
- **Nefro · `classify`** (`motor_clinico.js:27`): ERC «sí / provisional / no / indeterminada / agudo / fuera de la ruta», persistencia ≥ 90 días, grupo CAC 1-3 y KFRE si TFGe < 60.
- **Nefro · `goals`** (`:54`): metas de PA (140/90 o 130/80), HbA1c (7 u 8 %) y LDL (100, 70 o 55 según riesgo muy alto).
- **Nefro · `meds`** (`:63`): indicación de IECA/ARA II, iSGLT2, estatina y finerenona, con la regla y la fuente citadas.
- **Nefro · `interp`** (`:99`): interpretación de 15 paraclínicos contra la meta: caída de TFGe > 20 %, duplicación de RAC, K ≥ 6,5, etc.
- **Nefro · `plan`** (`:137`): agenda base [revisión, creatinina, RAC] por G×A (`AG`, `:14`) ajustada por el modelo de la EPS; contactos médicos, paraclínicos, equipo, preparación para TRR y acciones de hoy.
- **HD · metas por paciente** (`hd.js:86`): Hb 10-11,5; P 2,5-5,5; Ca ≤ 10,2; PTH 130-600; Kt/V ≥ 1,2 (objetivo 1,4); Alb ≥ 4; K 3,5-5,5; HbA1c 7,5; GID 4 %; TAS < 140; ferritina ≤ 500; TSAT 20-30. Se pueden sobrescribir por paciente.

### 4.3 Semáforos y puntajes
- **HD · semáforo de riesgo** (`hd.js:321`): suma ponderada de albúmina, Hb, P, TAS, HbA1c y acceso. ≥ 6 alto, ≥ 3 medio. Incluye 9 alertas clínicas (albúmina < 3, Hb < 8, Hb > 13, CVC temporal, posible MIA…).
- **HD · calidad de diálisis** (`hd.js:422`, `:443`): **rúbrica institucional no validada** de 10 dominios (0/1/2). Combina datos automáticos (Kt/V, GID, UFR, hipotensión, adherencia) y manuales de la valoración (congestión, acceso, recuperación, fatiga). Categorías Excelente / Bueno / Regular / Malo / «Sin datos suficientes» (cuando faltan 4 o más dominios).
- **Estado de los indicadores** (`hd.js:312`): alto, medio, bajo, línea de base o sin datos, según los puntos de corte y la dirección.

### 4.4 Indicadores
| Programa | Cantidad | Ubicación |
|---|---|---|
| HD · CAC | 17 (`dia_10`…`dia_36`: CVC, Kt/V, Hb, albúmina, P, ≥ 4 h, lista de Tx, abandono, VHC, anti-HBs, PTH, Ca, hospitalización, ITS-CVC por 1.000 días-catéter, FAV al inicio, calidad de vida) | `hd.js:250` |
| HD · institucionales | 8 (ITS con sospechas, hospitalización atribuible, glucometrías, GID, calidad buena, adherencia, inasistencia, eventos por 100 sesiones) | `hd.js:281-296` |
| VIH · CAC consenso 2023 | 34 (`CAC-04`…`CAC-37`) | `vih.js:258` |
| VIH · Nueva EPS | 12 (`NEPS-01`…`NEPS-12`) | `vih.js:293` |
| Nefro · tablero institucional | 15 fichas (PA, HbA1c, LDL, creatinina, RAC, pérdida de TFGe, periodicidad de TFGe/Hb/PTH/P por estadio, nefrología, equipo, educación, estatina, KFRE) y otras «pendientes de decidir si se conservan» | `motor_cohorte.js:224` |

Cada indicador devuelve el numerador, el denominador, los **excluidos con su motivo** y los **sin dato**. Esa estructura se conserva tal cual porque alimenta el desglose por paciente. Regla del programa VIH: **un dato faltante cuenta como «no cumple»**; no se excluye.

### 4.5 Alertas
- **HD** (`hd.js:333`): 13 tipos, entre ellas: búsqueda activa (inasistencia sin contacto), 7 días o más sin sesión, **riesgo de no llegar al mínimo de sesiones de la EPS**, Hb > 13, CVC sin plan, ITS sin hemocultivo, GID > 4 %, hipoglucemia, valoración del mes faltante, vacuna VHB y estudios vencidos.
- **VIH** (`vih.js:220`): nivel **rojo, amarillo o verde** con 20 reglas, entre ellas: sin TAR, CV ≥ 200, CV o CD4 vencidos, CD4 < 200, **sospecha de abandono** (cobertura de TAR más 90 días o 120 días sin atención), gestante, TB activa, riesgo de desabastecimiento de TAR, tamizajes incompletos, SMAQ no adherente y TAR sin validar.
- **Nefro**: alertas y calidad de la cohorte, y vencidos.

### 4.6 Calendarios y periodicidades
- **HD · calendario institucional de laboratorios** (`hd.js:397`, `:410`): M, T, S o A con mes ancla (trimestral desde enero, semestral desde octubre, anual en abril). Paquete de ingreso si el paciente lleva 60 días o menos. **HBsAg mensual si es susceptible**. Estados «vencido / este mes / próximo mes / al día».
- **Solicitud de laboratorio del mes** (`hd.js:1544`, `vih.js:216`): se genera desde el programa y la valida y carga el módulo Laboratorio.
- **VIH · contrato por EPS** (`vih.js:65`): Nueva EPS y EPS Familiar, con frecuencias S, A, I o N y condiciones (CD4 < 200 → toxoplasma, < 100 → CrAg, < 50 → histoplasma, HLA-B*5701 antes de abacavir).
- **VIH · frecuencia por disciplina** (`vih.js:881`): médico experto 30 días, infectología 180, enfermería 30, química farmacéutica 90, psicología, trabajo social y nutrición 180, odontología 365. **Solo los 30 días del médico experto están confirmados.**
- **Nefro · agenda base** por G×A y modelo por EPS.

### 4.7 Protocolos
- **Vacunación VHB en HD** (`hd.js:1448`): máquina de estados con 15 códigos según CDC 2001, ACIP 2018 y GSH-PT-001 (susceptible, en esquema, dosis vencida, esperar o tomar control, respondedor, refuerzo, anti-HBs anual, revacunar, no respondedor, anti-HBc aislado, HBsAg+). Sincroniza los campos de la variable CAC 54.
- **Carné de vacunas VIH** (`vih.js:194`): 10 vacunas. Las vivas están contraindicadas con CD4 < 200.
- **Trasplante** (`hd.js:1503`): 28 ítems KDIGO 2020. Si se marca la «inscripción en lista» como realizada, el estado cambia automáticamente a «En lista de espera».
- **VIH · validación de seguridad de la TAR** y **SMAQ** (`vih.js:931-936`). **Pautas de elección GPC 2021** (`vih.js:102`): TDF/3TC/DTG **no** cuenta como pauta de elección (decisión de la coordinación del 8 oct 2026).

### 4.8 Calidad del dato
HD (`hd.js:359`): IDs y documentos duplicados, maestro incompleto, puestos dobles, turnos sin cierre en 14 días, sesiones duplicadas, valores fuera de rango plausible (límites `lo`/`hi` por examen), fechas futuras, Kt/V sin método. VIH y Nefro tienen sus propias vistas.

### 4.9 Facturación
`conciliar` (`hd.js:382`): paquete mensual, cobro por sesión si no alcanza el mínimo y paquete más extra si supera el máximo. Calcula el valor esperado frente al facturado y la pérdida. VIH factura por paquete mensual por paciente (definido el 8 oct 2026).

---

## 5. Formatos de Excel

### 5.1 Entrada (importadores)
| Archivo | Importador | Hojas o columnas que lee |
|---|---|---|
| **Dashboard mensual de HD** | `hd.js:1281` | `2.PACIENTES` (desde la fila 5: ID P###, apellidos, nombres, tipo de doc., documento, fecha de nacimiento, sexo, EPS, afiliación, inicio de TRR, acceso, Tx, estado, ingreso, HTA, DM), `3.ASISTENCIAS_DIARIO` (asistencia día a día del mes elegido), glucometrías, laboratorios, vacunación, complicaciones, novedades, tarifas, `INDICADORES`. Detecta IDs repetidos y reasigna el ID. |
| **Cohorte nominal mensual de Nueva EPS** (VIH) | `vih.js:670` | Encabezado detectado por `CONSECUTIVO` + `NUMERO DE IDENTIFICACION`; las 43 columnas de `VX_NOM_COLS` (`vih.js:738`) |
| **Archivo CAC VIH** (193 variables) | `vih.js:691` | `VX_CAC_COLS` (`v1ideps`…), con arrastre a `ArrastreCAC` |
| **Libro de Nefroprotección** | `motor_cohorte.js:32` | 9 hojas; las filas cuyo código empieza por `EJEMPLO` se ignoran |
| **Libros propios** (institucional, HD, VIH) | `pxParse`, `parseToolBook`, `vxParse` | Una hoja por entidad (§3) |

### 5.2 Salida (exportadores)
| Reporte | Formato |
|---|---|
| **Matriz CAC ERC/diálisis · FOMAG** (hoja `BD ERC-TRR`) | 158 columnas `CAC_H_FOMAG` (`hd.js:234`) |
| **Matriz CAC ERC/diálisis · resolución** (hoja `860010090801_31072026_ERC_DIALI`) | 143 columnas `CAC_H_ERC` (`hd.js:235`) |
| **Cohorte nominal Nueva EPS** (VIH) | Plantilla con encabezado institucional (filas 1-6) y las 43 columnas |
| **Reporte CAC VIH** | 193 variables: arrastre más lo que calcula el sistema |
| Reportes de Nefro para EPS y normativos | `gestion_programa.js:647` |
| Exportaciones por vista | Vacunación VHB, trasplante, indicadores con detalle por paciente, solicitudes de laboratorio, producción, etc. (`sheetFrom`/`exportSheets`) |

> En la Fase 7 se generarán con SheetJS en el backend, **con columnas y nombres de hoja idénticos**, y se validarán contra archivos de muestra.

---

## 6. Riesgos encontrados

1. **Seguridad del prototipo.** El propio prototipo lo advierte: «la clave disuade, no protege». Los usuarios y los hashes viajan en el Excel. Ya está cubierto por los requisitos del prompt.
2. **Hay tres maestros de pacientes separados.** La misma persona puede estar en HD, Nefro y VIH con IDs distintos y datos que no coinciden. La migración necesita una **conciliación por tipo y número de documento**.
3. **Fechas.** El prototipo usa fechas locales sin hora y números de serie de Excel. En la base de datos se usa `date` (no `timestamp`) para fechas clínicas y la zona `America/Bogota` para marcas de tiempo.
4. **Reglas marcadas «por confirmar» en el propio código.** Frecuencias por disciplina en VIH, esquemas de vacunas del PAI, intervalo de neumococo, rango de edad de VPH, CUPS de glucemia, HbA1c y HLA-B*5701, esquema de vacunas VHB (pendiente del Anexo 1 de farmacia), metas institucionales de Nefro «propuestas» e indicadores «pendientes de decidir si se conservan». **Se migran tal cual, con una marca visible de «por confirmar».**
5. **La rúbrica de calidad de diálisis no está validada** (lo dice el código). Se conserva con esa advertencia.
6. **El tamaño de los módulos** (HD 436 KB, VIH 344 KB) hace inviable reescribir todo de una vez. Por eso el trabajo va por fases y cada regla tiene su prueba de equivalencia.
7. **Render.** La base de datos gratuita expira y no tiene copias de seguridad: hace falta un plan pago. Recomiendo región **Ohio u Oregon** (Render no tiene región en Suramérica) y revisar con jurídica la transferencia internacional de datos de salud (Ley 1581, art. 26).
8. **Archivos externos de referencia.** Las guías de laboratorio de las EPS, las fichas de Nueva EPS y los archivos CAC están codificados a partir de documentos adjuntos que no tengo. Para validar las exportaciones necesito muestras con datos ficticios o anonimizados.

---

## 7. Decisiones y preguntas para tu aprobación

### Decisiones de diseño (propongo una opción)

| # | Tema | Propuesta |
|---|---|---|
| **D1** | **Maestro de pacientes** | Una tabla `persona` única (por tipo y número de documento) más una **inscripción por programa** que conserve el código interno (P001, V0001, código de Nefro). Así un paciente de HD que también está en VIH es la misma persona, y Laboratorio, Producción y SP la ven una sola vez. |
| **D2** | **Roles** | El prototipo solo tiene `Administrador` y `Estándar` + **programas asignados**. Propongo **conservar ese modelo** y agregar **permisos finos por acción**: lectura, registro, anulación, exportación, configuración y facturación. Los 6 roles del prompt serían **plantillas** de esos permisos, no roles rígidos. |
| **D3** | **Facturación cifrada** | Hoy las tarifas se cifran con una clave aparte en el navegador. Propongo guardarlas en la base de datos con **permiso «Facturación»** + reautenticación (pedir de nuevo la contraseña) + bloqueo a los 10 minutos sin uso (como hoy) y cifrado en reposo de Render. Sin una segunda clave compartida. |
| **D4** | **Programas sin módulo** (DP, Consulta externa, Quimioterapia, Farmacia) | Conservar la ficha «en desarrollo» y el reporte de SP/IAAS que ya permiten. No se construyen en este alcance. |
| **D5** | **Despliegue** | **Un solo Web Service** que sirva la API y el frontend compilado en el mismo dominio, en lugar de un Static Site aparte. Las cookies `SameSite=Strict` funcionan sin CORS ni subdominios, hay un servicio menos que mantener y el CSRF se simplifica. El costo es que el frontend no queda en CDN, lo cual es irrelevante para un uso interno. |
| **D6** | **Persistencia en Excel** | Se elimina el «libro» como forma de guardar datos. Se conservan los importadores (Dashboard, cohorte nominal, CAC, libros existentes para la **migración inicial**) y todas las exportaciones. |
| **D7** | **Frontend** | Migrar las vistas **pantalla por pantalla a componentes React**, reutilizando `portal.css` y `estilos.css` casi intactos (las variables `:root` y las clases ya existen), para conservar la apariencia exacta. |

### Preguntas

- **P1.** Nefroprotección tiene una versión con base de datos (PostgREST + nginx, tablas y RPC ya nombradas). **¿Existe el archivo SQL de ese esquema o el repositorio de esa versión?** Si existe, lo tomo como base para no rediseñar lo que ya está aprobado.
- **P2.** ¿Hay **datos reales** hoy en libros Excel (HD, VIH, Nefro, institucional) que deban migrarse al arrancar? Solo lo pregunto para planear el importador. No los necesito para desarrollar.
- **P3.** En VIH faltan los indicadores **CAC-01 a CAC-03**. ¿Se excluyeron a propósito (por ejemplo, pediatría o binomio) o falta incluirlos?
- **P4.** ¿Quiénes serán los usuarios iniciales y cuántos aproximadamente? Esto define el plan de Render y el tamaño de la base de datos.
- **P5.** ¿Tienen **dominio propio** (por ejemplo, `gestion.posmedica.com`) o se usa el subdominio `onrender.com` al inicio?
- **P6.** ¿Confirmas que el despliegue en Render queda en EE. UU. (no hay región en Suramérica) y que eso está validado con el área jurídica o de protección de datos?
- **P7.** ¿Hay archivos de muestra (con datos ficticios o anonimizados) del Dashboard de HD, la cohorte nominal de Nueva EPS y los reportes CAC, para validar importadores y exportadores?

---

## 8. Plan de fases ajustado según el análisis

| Fase | Contenido | Ajuste respecto al prompt |
|---|---|---|
| 1 | Monorepo, Prisma (núcleo: usuario, permisos, programa, persona, inscripción, auditoría, catálogos, parámetros), autenticación, shell visual con el panel de programas, `render.yaml`, primer despliegue | Shell con el CSS original |
| 2 | `clinical-rules` con fórmulas, indicadores, alertas y protocolos de los 3 programas + pruebas de equivalencia (casos ficticios ejecutados en el prototipo original) | Se extrae **antes** de construir las pantallas |
| 3 | Hemodiálisis (el módulo más grande: 23 entidades) | — |
| 4 | VIH | — |
| 5 | Nefroprotección (tomando el esquema PostgREST de P1 si existe) | — |
| 6 | Transversales: Laboratorio, Producción, SP/IAAS/PROA, SOGCS, Calendario, Mensajes, Documentos | — |
| 7 | Importadores, exportadores CAC y EPS, migración inicial de libros, E2E y endurecimiento | Incluye una **herramienta de migración de libros existentes** |

**Quedo a la espera de tu aprobación del análisis y de tus respuestas a D1-D7 y P1-P7 antes de iniciar la Fase 1.**

---

## 9. Respuestas y decisiones aprobadas (8 de octubre de 2026)

| # | Decisión del usuario | Cómo quedó implementado (Fase 1) |
|---|---|---|
| D1 | Aprobado: maestro único de pacientes | Tablas `persona` (única por tipo y número de documento) e `inscripcion_programa` (código interno por programa) |
| D2 | Dos roles: **Administrador** y **Médico (estándar)**. El administrador asigna o quita módulos y permisos a los médicos | Enum `Rol {ADMIN, MEDICO}` + `usuario_programa` con ver, registrar, anular y exportar por programa; pantalla Usuarios → «Programas y permisos» |
| D3 | El administrador ve facturación; el médico no | `puedeFacturacion()` solo es verdadero para ADMIN; no es un permiso asignable |
| D5 | Tres servicios en Render: PostgreSQL, Static Site (front) y Web Service (back) | Creados manualmente en el panel (plan gratuito), guía en `docs/DESPLIEGUE_RENDER.md`. El Static Site reenvía `/api/*` al backend para que la sesión sea del mismo origen |
| P1 | No existe SQL previo: se crea desde cero | Migración inicial de Prisma (`apps/api/prisma/migrations`) |
| P3 | CAC-01 a CAC-03 se quitaron a propósito | Se conservan los 34 indicadores CAC-04 a CAC-37 |
| P6 | El sistema debe permitir bajar toda la información para tenerla en local o en físico | Pantalla **Respaldo** (administrador): Excel con todas las tablas y JSON exacto; queda auditado |
| P7 | Archivos de muestra entregados | `BD_VIH_POSMEDICA (1).xlsx`: plantilla CAC VIH, **idéntica** a las 193 variables del prototipo (`VX_CAC_COLS`). `860010090801_30092026_VIH.xlsx`: reporte CAC real de EPS Familiar (CCF033), 16 registros sin fila de encabezado, con el mismo orden de 193 columnas. Contiene **datos reales**: se usa solo como referencia de formato en la Fase 4 y **no se copia al repositorio**. Falta la cohorte nominal de Nueva EPS (43 columnas) para validar ese importador. |
