# Inventario de reglas clínicas extraídas

> GENERADO por `packages/clinical-rules/scripts/extraer-reglas.mjs`. No editar a mano.
> Cada definición se copió **textualmente** del prototipo «Gestión Clínica POSMÉDICA (1).html». La columna *Origen* apunta a `_analisis/`.
> Equivalencia verificada en `packages/clinical-rules/test/` (prototipo original frente al módulo extraído, con las cohortes ficticias del propio prototipo).
> Descripción clínica de cada regla: `docs/ANALISIS.md` §4.

## HD · `crearMotorHD(ctx)` (164 definiciones)

| Definición | Tipo | Origen |
|---|---|---|
| `esc` | función | `hd.js:5` |
| `pad` | función | `hd.js:6` |
| `iso` | función | `hd.js:7` |
| `fd` | función | `hd.js:8` |
| `ym` | función | `hd.js:9` |
| `addDays` | función | `hd.js:11` |
| `addMonths` | función | `hd.js:12` |
| `monthStart` | función | `hd.js:13` |
| `monthEnd` | función | `hd.js:14` |
| `dayDiff` | función | `hd.js:15` |
| `nowTs` | función | `hd.js:16` |
| `pdate` | función | `hd.js:17` |
| `num` | función | `hd.js:25` |
| `norm` | función | `hd.js:26` |
| `f1` | función | `hd.js:27` |
| `pct` | función | `hd.js:28` |
| `money` | función | `hd.js:29` |
| `EPS_L` | constante / catálogo | `hd.js:36` |
| `epsList` | función | `hd.js:37` |
| `TURNOS_DEF` | constante / catálogo | `hd.js:38` |
| `turnosCfg` | función | `hd.js:39` |
| `turnoNames` | función | `hd.js:40` |
| `DIAS_L` | constante / catálogo | `hd.js:41` |
| `ESTADOS_SES` | constante / catálogo | `hd.js:42` |
| `MOTIVOS` | constante / catálogo | `hd.js:44` |
| `MOT_RESP` | constante / catálogo | `hd.js:45` |
| `CAUSA_HOSP` | constante / catálogo | `hd.js:46` |
| `ATRIB` | constante / catálogo | `hd.js:47` |
| `TIPO_SES` | constante / catálogo | `hd.js:48` |
| `MOT_EXTRA` | constante / catálogo | `hd.js:49` |
| `RESP` | constante / catálogo | `hd.js:50` |
| `ACCESOS` | constante / catálogo | `hd.js:51` |
| `isCVC` | función | `hd.js:52` |
| `ITS` | constante / catálogo | `hd.js:53` |
| `EVENTOS` | constante / catálogo | `hd.js:54` |
| `SEV` | constante / catálogo | `hd.js:55` |
| `RESUELTO` | constante / catálogo | `hd.js:56` |
| `HEMOC` | constante / catálogo | `hd.js:57` |
| `NOV_TIPOS` | constante / catálogo | `hd.js:58` |
| `MOV_EGRESO` | constante / catálogo | `hd.js:59` |
| `MOV_TIPOS` | constante / catálogo | `hd.js:60` |
| `EGRESO_ESTADO` | constante / catálogo | `hd.js:61` |
| `RUTA` | constante / catálogo | `hd.js:62` |
| `RUTA_EXCL` | constante / catálogo | `hd.js:63` |
| `ACC_NOV` | constante / catálogo | `hd.js:64` |
| `ACC_NOV_RES` | constante / catálogo | `hd.js:65` |
| `TX` | constante / catálogo | `hd.js:66` |
| `PROCED` | constante / catálogo | `hd.js:67` |
| `MEDIOS` | constante / catálogo | `hd.js:68` |
| `RESULT_CTC` | constante / catálogo | `hd.js:69` |
| `DISCIPLINAS` | constante / catálogo | `hd.js:70` |
| `EXAMS` | constante / catálogo | `hd.js:72` |
| `EX` | función | `hd.js:82` |
| `FREQ_TXT` | constante / catálogo | `hd.js:83` |
| `ANCHOR_DEF` | constante / catálogo | `hd.js:85` |
| `META_DEF` | constante / catálogo | `hd.js:86` |
| `CFG_DEF` | constante / catálogo | `hd.js:87` |
| `MUN_DANE` | constante / catálogo | `hd.js:95` |
| `MEDS` | constante / catálogo | `hd.js:97` |
| `AEE` | constante / catálogo | `hd.js:98` |
| `SH` | constante / catálogo | `hd.js:101` |
| `BOOK_KEYS` | constante / catálogo | `hd.js:126` |
| `DATE_F` | constante / catálogo | `hd.js:127` |
| `NUM_F` | constante / catálogo | `hd.js:128` |
| `cacStart` | función | `hd.js:131` |
| `newBook` | función | `hd.js:133` |
| `readSheet` | función | `hd.js:134` |
| `fromRow` | función | `hd.js:135` |
| `isToolBook` | función | `hd.js:136` |
| `isDashboard` | función | `hd.js:137` |
| `parseToolBook` | función | `hd.js:138` |
| `live` | función | `hd.js:171` |
| `IDX` | constante / catálogo | `hd.js:174` |
| `reindex` | función | `hd.js:175` |
| `ensureIdx` | función | `hd.js:195` |
| `nombre` | función | `hd.js:196` |
| `activeAt` | función | `hd.js:197` |
| `activeDays` | función | `hd.js:198` |
| `overlaps` | función | `hd.js:199` |
| `ageAt` | función | `hd.js:200` |
| `adult` | función | `hd.js:201` |
| `ninety` | función | `hd.js:202` |
| `epsOk` | función | `hd.js:203` |
| `turnoDias` | función | `hd.js:204` |
| `turnoJor` | función | `hd.js:205` |
| `absentOn` | función | `hd.js:206` |
| `progDays` | función | `hd.js:207` |
| `sesIn` | función | `hd.js:208` |
| `lastLab` | función | `hd.js:209` |
| `labsIn` | función | `hd.js:210` |
| `accessAt` | función | `hd.js:211` |
| `lastSes` | función | `hd.js:217` |
| `gidStats` | función | `hd.js:219` |
| `taStats` | función | `hd.js:223` |
| `glucoStats` | función | `hd.js:225` |
| `ktvOnline` | función | `hd.js:227` |
| `fmtTA` | función | `hd.js:228` |
| `parseTA` | función | `hd.js:229` |
| `ktvDaugirdas` | función | `hd.js:231` |
| `metasDe` | función | `hd.js:232` |
| `CAC_H_FOMAG` | constante / catálogo | `hd.js:234` |
| `CAC_H_ERC` | constante / catálogo | `hd.js:235` |
| `CAC_SHEET_FOMAG` | constante / catálogo | `hd.js:236` |
| `CAC_SHEET_ERC` | constante / catálogo | `hd.js:237` |
| `pacs` | función | `hd.js:240` |
| `popCut` | función | `hd.js:241` |
| `popPer` | función | `hd.js:242` |
| `popInc` | función | `hd.js:243` |
| `ctxFor` | función | `hd.js:244` |
| `pv` | función | `hd.js:248` |
| `propLab` | función | `hd.js:249` |
| `IND` | constante / catálogo | `hd.js:250` |
| `INDM` | función | `hd.js:298` |
| `progUpTo` | función | `hd.js:299` |
| `catDays` | función | `hd.js:300` |
| `evalInd` | función | `hd.js:305` |
| `statusOf` | función | `hd.js:312` |
| `STATUS_TXT` | constante / catálogo | `hd.js:316` |
| `fmtVal` | función | `hd.js:317` |
| `trendPoints` | función | `hd.js:318` |
| `semaforo` | función | `hd.js:321` |
| `alertas` | función | `hd.js:333` |
| `calidad` | función | `hd.js:359` |
| `tarifaFor` | función | `hd.js:381` |
| `conciliar` | función | `hd.js:382` |
| `freqOf` | función | `hd.js:396` |
| `schedMonths` | función | `hd.js:397` |
| `susceptibleVHB` | función | `hd.js:399` |
| `examApplies` | función | `hd.js:400` |
| `examsForMonth` | función | `hd.js:402` |
| `labDue` | función | `hd.js:410` |
| `CAL_DOM` | constante / catálogo | `hd.js:422` |
| `CAL_OPC` | constante / catálogo | `hd.js:434` |
| `calidadAuto` | función | `hd.js:436` |
| `calidadScore` | función | `hd.js:443` |
| `CAL_CLASS` | constante / catálogo | `hd.js:459` |
| `ultimaValoracion` | función | `hd.js:460` |
| `calidadDe` | función | `hd.js:461` |
| `D1800, D1845, D1811` | constante / catálogo | `hd.js:1100` |
| `isoOr` | función | `hd.js:1101` |
| `cacVals` | función | `hd.js:1102` |
| `ufCalc` | función | `hd.js:1427` |
| `sesUF` | función | `hd.js:1428` |
| `EST_TIPOS` | constante / catálogo | `hd.js:1434` |
| `EST_NOM` | constante / catálogo | `hd.js:1435` |
| `estRelevantes` | función | `hd.js:1436` |
| `estVencidos` | función | `hd.js:1437` |
| `vacEsquemas` | función | `hd.js:1444` |
| `vacMeses` | función | `hd.js:1445` |
| `vacDoses` | función | `hd.js:1446` |
| `labTxt` | función | `hd.js:1447` |
| `vacStatus` | función | `hd.js:1448` |
| `VAC_GRUPOS` | constante / catálogo | `hd.js:1473` |
| `vacGrupo` | función | `hd.js:1474` |
| `vacNextDefaults` | función | `hd.js:1475` |
| `vacEtiqueta` | función | `hd.js:1495` |
| `TX_EST` | constante / catálogo | `hd.js:1501` |
| `txItems` | función | `hd.js:1502` |
| `txState` | función | `hd.js:1503` |
| `TX_EN_PROCESO` | constante / catálogo | `hd.js:1506` |
| `tenerPresente` | función | `hd.js:1534` |
| `SOL_EST` | constante / catálogo | `hd.js:1541` |
| `solRecs` | función | `hd.js:1543` |
| `solPropuesta` | función | `hd.js:1544` |

## VIH · `crearMotorVIH(ctx)` (139 definiciones)

| Definición | Tipo | Origen |
|---|---|---|
| `esc` | función | `hd.js:5` |
| `pad` | función | `hd.js:6` |
| `iso` | función | `hd.js:7` |
| `fd` | función | `hd.js:8` |
| `ym` | función | `hd.js:9` |
| `addDays` | función | `hd.js:11` |
| `addMonths` | función | `hd.js:12` |
| `monthStart` | función | `hd.js:13` |
| `monthEnd` | función | `hd.js:14` |
| `dayDiff` | función | `hd.js:15` |
| `nowTs` | función | `hd.js:16` |
| `pdate` | función | `hd.js:17` |
| `num` | función | `hd.js:25` |
| `norm` | función | `hd.js:26` |
| `f1` | función | `hd.js:27` |
| `pct` | función | `hd.js:28` |
| `money` | función | `hd.js:29` |
| `VX_CAC_COLS` | constante / catálogo | `vih.js:2` |
| `VXS` | constante / catálogo | `vih.js:9` |
| `VXK` | constante / catálogo | `vih.js:26` |
| `VX_EPS` | constante / catálogo | `vih.js:29` |
| `VX_EPSCODE_DEF` | constante / catálogo | `vih.js:30` |
| `VX_REG` | constante / catálogo | `vih.js:31` |
| `VX_MUN` | constante / catálogo | `vih.js:33` |
| `VX_MUN_ALIAS` | constante / catálogo | `vih.js:34` |
| `VX_PCLAVE` | constante / catálogo | `vih.js:35` |
| `VX_TINGR` | constante / catálogo | `vih.js:36` |
| `VX_ESTADO` | constante / catálogo | `vih.js:37` |
| `VX_MODAL` | constante / catálogo | `vih.js:38` |
| `VX_DISC` | constante / catálogo | `vih.js:39` |
| `VX_DISC_ACT` | constante / catálogo | `vih.js:40` |
| `VX_CITEST` | constante / catálogo | `vih.js:41` |
| `VX_CITTIPO` | constante / catálogo | `vih.js:42` |
| `VX_MOTINAS` | constante / catálogo | `vih.js:43` |
| `VX_NOV` | constante / catálogo | `vih.js:44` |
| `VX_PRC` | constante / catálogo | `vih.js:45` |
| `VX_PRF` | constante / catálogo | `vih.js:46` |
| `VX_EX` | constante / catálogo | `vih.js:48` |
| `VXE` | función | `vih.js:63` |
| `VX_CONTRATO_DEF` | constante / catálogo | `vih.js:65` |
| `VX_GUIA_DIF` | constante / catálogo | `vih.js:78` |
| `VX_MED` | constante / catálogo | `vih.js:80` |
| `VX_CLASES` | constante / catálogo | `vih.js:81` |
| `VX_ESQ` | constante / catálogo | `vih.js:82` |
| `VXQ` | función | `vih.js:99` |
| `VX_GPC_PREF` | constante / catálogo | `vih.js:102` |
| `VX_VAC` | constante / catálogo | `vih.js:104` |
| `VXV` | función | `vih.js:111` |
| `VX_VACEST` | constante / catálogo | `vih.js:112` |
| `vxLive` | función | `vih.js:115` |
| `vxD` | función | `vih.js:116` |
| `vxNom` | función | `vih.js:117` |
| `vxCorte` | función | `vih.js:119` |
| `vxMunCode` | función | `vih.js:120` |
| `vxMunName` | función | `vih.js:121` |
| `vxCfg` | función | `vih.js:122` |
| `vxNewBook` | función | `vih.js:124` |
| `vxEdad` | función | `vih.js:131` |
| `vxGrupoEtario` | función | `vih.js:132` |
| `vxF` | función | `vih.js:133` |
| `vxPct` | función | `vih.js:134` |
| `vxIdx` | función | `vih.js:137` |
| `vxPacs` | función | `vih.js:146` |
| `vxP` | función | `vih.js:147` |
| `vxL` | función | `vih.js:148` |
| `vxLast` | función | `vih.js:150` |
| `vxFirst` | función | `vih.js:151` |
| `vxVal` | función | `vih.js:152` |
| `vxPos` | función | `vih.js:153` |
| `vxCVind` | función | `vih.js:154` |
| `vxFmtLab` | función | `vih.js:155` |
| `vxPeriodo` | función | `vih.js:158` |
| `vxActivo` | función | `vih.js:159` |
| `vxTarAt` | función | `vih.js:160` |
| `vxTarIni` | función | `vih.js:161` |
| `vxUltEnt` | función | `vih.js:162` |
| `vxCobertura` | función | `vih.js:163` |
| `vxUltAtencion` | función | `vih.js:164` |
| `vxNovAt` | función | `vih.js:165` |
| `vxSt` | función | `vih.js:166` |
| `vxVacEstado` | función | `vih.js:194` |
| `vxVacCompleta` | función | `vih.js:209` |
| `vxContrato` | función | `vih.js:212` |
| `vxHSH` | función | `vih.js:214` |
| `vxSolRecs` | función | `vih.js:215` |
| `vxSolTieneRes` | función | `vih.js:217` |
| `vxAlertas` | función | `vih.js:220` |
| `vxTFG` | función | `vih.js:242` |
| `VX_GPC14` | constante / catálogo | `vih.js:246` |
| `vxEnRango` | función | `vih.js:247` |
| `vxLabIn` | función | `vih.js:248` |
| `vxPrcIn` | función | `vih.js:249` |
| `vxPrfIn` | función | `vih.js:250` |
| `vxHospVIH` | función | `vih.js:251` |
| `vxFalla` | función | `vih.js:252` |
| `vxR` | función | `vih.js:253` |
| `vxUP, vxDOWN, vxLB` | función | `vih.js:254` |
| `vxSemRng` | función | `vih.js:255` |
| `VX_IND` | constante / catálogo | `vih.js:256` |
| `VXI` | función | `vih.js:306` |
| `vxRng` | función | `vih.js:307` |
| `vxNivel` | función | `vih.js:308` |
| `vxRngTxt` | función | `vih.js:311` |
| `vxFiltro` | función | `vih.js:313` |
| `vxPer` | función | `vih.js:314` |
| `vxCalc` | función | `vih.js:315` |
| `vxCalcBy` | función | `vih.js:319` |
| `VX_PAQ_DEF` | constante / catálogo | `vih.js:525` |
| `vxPaq` | función | `vih.js:526` |
| `vxFactMes` | función | `vih.js:527` |
| `vxProdMes` | función | `vih.js:528` |
| `vxDiscMes` | función | `vih.js:529` |
| `VX_NOM_COLS` | constante / catálogo | `vih.js:738` |
| `vxNominalRows` | función | `vih.js:739` |
| `vxNomRow` | función | `vih.js:741` |
| `vxNominalValidar` | función | `vih.js:758` |
| `vxCACRows` | función | `vih.js:774` |
| `vxCACRow` | función | `vih.js:776` |
| `vxPcCAC` | función | `vih.js:795` |
| `vxCACValidar` | función | `vih.js:796` |
| `VX_CAC_LBL` | constante / catálogo | `vih.js:871` |
| `vxCacCod` | función | `vih.js:872` |
| `vxCacNum` | función | `vih.js:873` |
| `vxCacLbl` | función | `vih.js:874` |
| `VX_AGFREQ_DEF` | constante / catálogo | `vih.js:881` |
| `vxAgFreq` | función | `vih.js:882` |
| `vxCitProg` | función | `vih.js:884` |
| `vxAgEstado` | función | `vih.js:886` |
| `vxPuedeAgendar` | función | `vih.js:893` |
| `VX_SMAQ` | constante / catálogo | `vih.js:933` |
| `vxSmaqRes` | función | `vih.js:934` |
| `VX_TARCHK` | constante / catálogo | `vih.js:937` |
| `vxTarChkApl` | función | `vih.js:938` |
| `VX_FTXT` | constante / catálogo | `vih.js:1070` |
| `vxLabPlan` | función | `vih.js:1071` |
| `vxDue` | función | `vih.js:1092` |
| `vxPPD` | función | `vih.js:1108` |
| `vxCit` | función | `vih.js:1116` |
| `vxPrcPend` | función | `vih.js:1128` |

## NEFRO · `crearMotorNefro(ctx)` (3 definiciones)

| Definición | Tipo | Origen |
|---|---|---|
| `NP` | función | `nefroproteccion/motor_clinico.js:3` |
| `EPSMODEL_DEF` | constante / catálogo | `nefroproteccion/motor_clinico.js:428` |
| `COH` | función | `nefroproteccion/motor_cohorte.js:3` |

