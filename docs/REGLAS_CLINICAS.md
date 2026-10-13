# Inventario de reglas clínicas extraídas

> GENERADO por `packages/clinical-rules/scripts/extraer-reglas.mjs`. No editar a mano.
> Cada definición se copió **textualmente** del prototipo «Gestión Clínica POSMÉDICA (1).html». La columna *Origen* apunta a `_analisis/`.
> Equivalencia verificada en `packages/clinical-rules/test/` (prototipo original frente al módulo extraído, con las cohortes ficticias del propio prototipo).
> Descripción clínica de cada regla: `docs/ANALISIS.md` §4.

## HD · `crearMotorHD(ctx)` (200 definiciones)

| Definición | Tipo | Origen |
|---|---|---|
| `esc` | función | `prototipo:740` |
| `pad` | función | `prototipo:741` |
| `iso` | función | `prototipo:742` |
| `fd` | función | `prototipo:743` |
| `ym` | función | `prototipo:744` |
| `addDays` | función | `prototipo:746` |
| `addMonths` | función | `prototipo:747` |
| `monthStart` | función | `prototipo:748` |
| `monthEnd` | función | `prototipo:749` |
| `dayDiff` | función | `prototipo:750` |
| `nowTs` | función | `prototipo:751` |
| `pdate` | función | `prototipo:752` |
| `num` | función | `prototipo:760` |
| `norm` | función | `prototipo:761` |
| `f1` | función | `prototipo:762` |
| `pct` | función | `prototipo:763` |
| `money` | función | `prototipo:764` |
| `EPS_L` | constante / catálogo | `prototipo:771` |
| `epsList` | función | `prototipo:772` |
| `TURNOS_DEF` | constante / catálogo | `prototipo:773` |
| `turnosCfg` | función | `prototipo:774` |
| `turnoNames` | función | `prototipo:775` |
| `DIAS_L` | constante / catálogo | `prototipo:776` |
| `ESTADOS_SES` | constante / catálogo | `prototipo:777` |
| `MOTIVOS` | constante / catálogo | `prototipo:779` |
| `MOT_RESP` | constante / catálogo | `prototipo:780` |
| `CAUSA_HOSP` | constante / catálogo | `prototipo:781` |
| `ATRIB` | constante / catálogo | `prototipo:782` |
| `MOT_EXTRA` | constante / catálogo | `prototipo:783` |
| `ACCESOS` | constante / catálogo | `prototipo:784` |
| `isCVC` | función | `prototipo:785` |
| `ITS` | constante / catálogo | `prototipo:786` |
| `EVENTOS` | constante / catálogo | `prototipo:787` |
| `SEV` | constante / catálogo | `prototipo:788` |
| `RESUELTO` | constante / catálogo | `prototipo:789` |
| `HEMOC` | constante / catálogo | `prototipo:790` |
| `NOV_TIPOS` | constante / catálogo | `prototipo:791` |
| `MOV_EGRESO` | constante / catálogo | `prototipo:792` |
| `MOV_TIPOS` | constante / catálogo | `prototipo:793` |
| `EGRESO_ESTADO` | constante / catálogo | `prototipo:794` |
| `RUTA` | constante / catálogo | `prototipo:795` |
| `RUTA_EXCL` | constante / catálogo | `prototipo:796` |
| `ACC_NOV` | constante / catálogo | `prototipo:797` |
| `ACC_NOV_RES` | constante / catálogo | `prototipo:798` |
| `TX` | constante / catálogo | `prototipo:799` |
| `PROCED` | constante / catálogo | `prototipo:800` |
| `MEDIOS` | constante / catálogo | `prototipo:801` |
| `RESULT_CTC` | constante / catálogo | `prototipo:802` |
| `DISCIPLINAS` | constante / catálogo | `prototipo:803` |
| `EXAMS` | constante / catálogo | `prototipo:805` |
| `EX` | función | `prototipo:815` |
| `FREQ_TXT` | constante / catálogo | `prototipo:816` |
| `ANCHOR_DEF` | constante / catálogo | `prototipo:818` |
| `META_DEF` | constante / catálogo | `prototipo:819` |
| `CFG_DEF` | constante / catálogo | `prototipo:820` |
| `MUN_DANE` | constante / catálogo | `prototipo:828` |
| `AEE` | constante / catálogo | `prototipo:830` |
| `SH` | constante / catálogo | `prototipo:833` |
| `BOOK_KEYS` | constante / catálogo | `prototipo:858` |
| `DATE_F` | constante / catálogo | `prototipo:859` |
| `NUM_F` | constante / catálogo | `prototipo:860` |
| `cacStart` | función | `prototipo:863` |
| `newBook` | función | `prototipo:865` |
| `readSheet` | función | `prototipo:866` |
| `fromRow` | función | `prototipo:867` |
| `isToolBook` | función | `prototipo:868` |
| `isDashboard` | función | `prototipo:869` |
| `parseToolBook` | función | `prototipo:870` |
| `live` | función | `prototipo:903` |
| `IDX` | constante / catálogo | `prototipo:906` |
| `reindex` | función | `prototipo:907` |
| `ensureIdx` | función | `prototipo:927` |
| `nombre` | función | `prototipo:928` |
| `activeAt` | función | `prototipo:929` |
| `activeDays` | función | `prototipo:930` |
| `overlaps` | función | `prototipo:931` |
| `ageAt` | función | `prototipo:932` |
| `adult` | función | `prototipo:933` |
| `ninety` | función | `prototipo:934` |
| `epsOk` | función | `prototipo:935` |
| `turnoDias` | función | `prototipo:936` |
| `absentOn` | función | `prototipo:937` |
| `progDays` | función | `prototipo:938` |
| `sesIn` | función | `prototipo:939` |
| `lastLab` | función | `prototipo:940` |
| `labsIn` | función | `prototipo:941` |
| `accessAt` | función | `prototipo:942` |
| `lastSes` | función | `prototipo:948` |
| `gidStats` | función | `prototipo:950` |
| `taStats` | función | `prototipo:954` |
| `glucoStats` | función | `prototipo:956` |
| `ktvOnline` | función | `prototipo:958` |
| `fmtTA` | función | `prototipo:959` |
| `parseTA` | función | `prototipo:960` |
| `ktvDaugirdas` | función | `prototipo:962` |
| `metasDe` | función | `prototipo:963` |
| `CAC_H_FOMAG` | constante / catálogo | `prototipo:965` |
| `CAC_H_ERC` | constante / catálogo | `prototipo:966` |
| `CAC_SHEET_FOMAG` | constante / catálogo | `prototipo:967` |
| `CAC_SHEET_ERC` | constante / catálogo | `prototipo:968` |
| `pacs` | función | `prototipo:971` |
| `popCut` | función | `prototipo:972` |
| `popPer` | función | `prototipo:973` |
| `popInc` | función | `prototipo:974` |
| `ctxFor` | función | `prototipo:975` |
| `pv` | función | `prototipo:979` |
| `propLab` | función | `prototipo:980` |
| `IND` | constante / catálogo | `prototipo:981` |
| `INDM` | función | `prototipo:1029` |
| `progUpTo` | función | `prototipo:1030` |
| `evalInd` | función | `prototipo:1031` |
| `statusOf` | función | `prototipo:1038` |
| `STATUS_TXT` | constante / catálogo | `prototipo:1042` |
| `fmtVal` | función | `prototipo:1043` |
| `trendPoints` | función | `prototipo:1044` |
| `semaforo` | función | `prototipo:1047` |
| `alertas` | función | `prototipo:1059` |
| `calidad` | función | `prototipo:1085` |
| `tarifaFor` | función | `prototipo:1108` |
| `conciliar` | función | `prototipo:1109` |
| `freqOf` | función | `prototipo:1123` |
| `schedMonths` | función | `prototipo:1124` |
| `susceptibleVHB` | función | `prototipo:1126` |
| `examApplies` | función | `prototipo:1127` |
| `examsForMonth` | función | `prototipo:1129` |
| `labDue` | función | `prototipo:1137` |
| `CAL_DOM` | constante / catálogo | `prototipo:1149` |
| `CAL_OPC` | constante / catálogo | `prototipo:1161` |
| `calidadAuto` | función | `prototipo:1163` |
| `calidadScore` | función | `prototipo:1170` |
| `CAL_CLASS` | constante / catálogo | `prototipo:1186` |
| `ultimaValoracion` | función | `prototipo:1187` |
| `calidadDe` | función | `prototipo:1188` |
| `D1800, D1845, D1811` | constante / catálogo | `prototipo:1747` |
| `isoOr` | función | `prototipo:1748` |
| `cacVals` | función | `prototipo:1749` |
| `ufCalc` | función | `prototipo:2074` |
| `sesUF` | función | `prototipo:2075` |
| `EST_TIPOS` | constante / catálogo | `prototipo:2081` |
| `EST_NOM` | constante / catálogo | `prototipo:2082` |
| `estRelevantes` | función | `prototipo:2083` |
| `estVencidos` | función | `prototipo:2084` |
| `vacEsquemas` | función | `prototipo:2091` |
| `vacMeses` | función | `prototipo:2092` |
| `vacDoses` | función | `prototipo:2093` |
| `labTxt` | función | `prototipo:2094` |
| `vacStatus` | función | `prototipo:2095` |
| `VAC_GRUPOS` | constante / catálogo | `prototipo:2120` |
| `vacGrupo` | función | `prototipo:2121` |
| `vacNextDefaults` | función | `prototipo:2122` |
| `vacEtiqueta` | función | `prototipo:2142` |
| `TX_EST` | constante / catálogo | `prototipo:2148` |
| `txItems` | función | `prototipo:2149` |
| `txState` | función | `prototipo:2150` |
| `TX_EN_PROCESO` | constante / catálogo | `prototipo:2153` |
| `tenerPresente` | función | `prototipo:2181` |
| `SOL_EST` | constante / catálogo | `prototipo:2188` |
| `solRecs` | función | `prototipo:2190` |
| `solPropuesta` | función | `prototipo:2191` |
| `` | constante / catálogo | `prototipo:2425` |
| `` | constante / catálogo | `prototipo:2426` |
| `` | constante / catálogo | `prototipo:2427` |
| `` | constante / catálogo | `prototipo:2428` |
| `` | constante / catálogo | `prototipo:2429` |
| `` | función | `prototipo:2430` |
| `` | constante / catálogo | `prototipo:2431` |
| `` | constante / catálogo | `prototipo:2432` |
| `` | constante / catálogo | `prototipo:2433` |
| `` | constante / catálogo | `prototipo:2434` |
| `lv` | función | `prototipo:5413` |
| `hdOn` | función | `prototipo:5414` |
| `DSP_TIPOS` | constante / catálogo | `prototipo:5431` |
| `DSP_SITIOS` | constante / catálogo | `prototipo:5432` |
| `DSP_RETIRO` | constante / catálogo | `prototipo:5433` |
| `DSP_LUGAR` | constante / catálogo | `prototipo:5434` |
| `dspAll` | función | `prototipo:5435` |
| `dspOf` | función | `prototipo:5436` |
| `dspCVC` | función | `prototipo:5437` |
| `dspFind` | función | `prototipo:5438` |
| `dspOpen` | función | `prototipo:5439` |
| `cdMet` | función | `prototipo:5440` |
| `dspCovers` | función | `prototipo:5441` |
| `hospOn` | función | `prototipo:5442` |
| `cdCalc` | función | `prototipo:5446` |
| `dspPropuestas` | función | `prototipo:5468` |
| `MIC_MUESTRAS` | constante / catálogo | `prototipo:5481` |
| `MIC_SANGRE` | constante / catálogo | `prototipo:5482` |
| `MIC_EST` | constante / catálogo | `prototipo:5483` |
| `MIC_RES` | constante / catálogo | `prototipo:5484` |
| `MIC_FEN` | constante / catálogo | `prototipo:5485` |
| `MIC_FEN_ALERTA` | constante / catálogo | `prototipo:5486` |
| `micAll` | función | `prototipo:5489` |
| `micOfEp` | función | `prototipo:5490` |
| `micOfPac` | función | `prototipo:5491` |
| `micPos` | función | `prototipo:5492` |
| `micAB` | función | `prototipo:5493` |
| `itsConf` | función | `prototipo:5495` |
| `v6Its` | función | `prototipo:5569` |
| `v6Calidad` | función | `prototipo:5704` |
| `catDays` | función | `prototipo:7411` |

## VIH · `crearMotorVIH(ctx)` (137 definiciones)

| Definición | Tipo | Origen |
|---|---|---|
| `esc` | función | `prototipo:740` |
| `pad` | función | `prototipo:741` |
| `iso` | función | `prototipo:742` |
| `fd` | función | `prototipo:743` |
| `ym` | función | `prototipo:744` |
| `addDays` | función | `prototipo:746` |
| `addMonths` | función | `prototipo:747` |
| `monthStart` | función | `prototipo:748` |
| `monthEnd` | función | `prototipo:749` |
| `dayDiff` | función | `prototipo:750` |
| `nowTs` | función | `prototipo:751` |
| `pdate` | función | `prototipo:752` |
| `num` | función | `prototipo:760` |
| `norm` | función | `prototipo:761` |
| `f1` | función | `prototipo:762` |
| `pct` | función | `prototipo:763` |
| `money` | función | `prototipo:764` |
| `VX_CAC_COLS` | constante / catálogo | `prototipo:3149` |
| `VXS` | constante / catálogo | `prototipo:3438` |
| `VXK` | constante / catálogo | `prototipo:3455` |
| `VX_EPS` | constante / catálogo | `prototipo:3458` |
| `VX_EPSCODE_DEF` | constante / catálogo | `prototipo:3459` |
| `VX_REG` | constante / catálogo | `prototipo:3460` |
| `VX_MUN` | constante / catálogo | `prototipo:3462` |
| `VX_MUN_ALIAS` | constante / catálogo | `prototipo:3463` |
| `VX_PCLAVE` | constante / catálogo | `prototipo:3464` |
| `VX_TINGR` | constante / catálogo | `prototipo:3465` |
| `VX_ESTADO` | constante / catálogo | `prototipo:3466` |
| `VX_MODAL` | constante / catálogo | `prototipo:3467` |
| `VX_DISC` | constante / catálogo | `prototipo:3468` |
| `VX_DISC_ACT` | constante / catálogo | `prototipo:3469` |
| `VX_CITTIPO` | constante / catálogo | `prototipo:3470` |
| `VX_MOTINAS` | constante / catálogo | `prototipo:3471` |
| `VX_NOV` | constante / catálogo | `prototipo:3472` |
| `VX_PRC` | constante / catálogo | `prototipo:3473` |
| `VX_PRF` | constante / catálogo | `prototipo:3474` |
| `VX_EX` | constante / catálogo | `prototipo:3476` |
| `VXE` | función | `prototipo:3491` |
| `VX_CONTRATO_DEF` | constante / catálogo | `prototipo:3493` |
| `VX_GUIA_DIF` | constante / catálogo | `prototipo:3506` |
| `VX_MED` | constante / catálogo | `prototipo:3508` |
| `VX_CLASES` | constante / catálogo | `prototipo:3509` |
| `VX_ESQ` | constante / catálogo | `prototipo:3510` |
| `VXQ` | función | `prototipo:3527` |
| `VX_GPC_PREF` | constante / catálogo | `prototipo:3530` |
| `VX_VAC` | constante / catálogo | `prototipo:3532` |
| `VXV` | función | `prototipo:3539` |
| `VX_VACEST` | constante / catálogo | `prototipo:3540` |
| `vxLive` | función | `prototipo:3543` |
| `vxD` | función | `prototipo:3544` |
| `vxNom` | función | `prototipo:3545` |
| `vxCorte` | función | `prototipo:3547` |
| `vxMunCode` | función | `prototipo:3548` |
| `vxMunName` | función | `prototipo:3549` |
| `vxCfg` | función | `prototipo:3550` |
| `vxNewBook` | función | `prototipo:3551` |
| `vxEdad` | función | `prototipo:3558` |
| `vxGrupoEtario` | función | `prototipo:3559` |
| `vxF` | función | `prototipo:3560` |
| `vxIdx` | función | `prototipo:3563` |
| `vxPacs` | función | `prototipo:3572` |
| `vxP` | función | `prototipo:3573` |
| `vxL` | función | `prototipo:3574` |
| `vxLast` | función | `prototipo:3576` |
| `vxFirst` | función | `prototipo:3577` |
| `vxVal` | función | `prototipo:3578` |
| `vxPos` | función | `prototipo:3579` |
| `vxCVind` | función | `prototipo:3580` |
| `vxFmtLab` | función | `prototipo:3581` |
| `vxPeriodo` | función | `prototipo:3584` |
| `vxActivo` | función | `prototipo:3585` |
| `vxTarAt` | función | `prototipo:3586` |
| `vxTarIni` | función | `prototipo:3587` |
| `vxUltEnt` | función | `prototipo:3588` |
| `vxCobertura` | función | `prototipo:3589` |
| `vxUltAtencion` | función | `prototipo:3590` |
| `vxNovAt` | función | `prototipo:3591` |
| `vxSt` | función | `prototipo:3592` |
| `vxVacEstado` | función | `prototipo:3620` |
| `vxVacCompleta` | función | `prototipo:3635` |
| `vxContrato` | función | `prototipo:3638` |
| `vxHSH` | función | `prototipo:3640` |
| `vxSolRecs` | función | `prototipo:3641` |
| `vxSolTieneRes` | función | `prototipo:3643` |
| `vxAlertas` | función | `prototipo:3646` |
| `vxTFG` | función | `prototipo:3668` |
| `VX_GPC14` | constante / catálogo | `prototipo:3672` |
| `vxEnRango` | función | `prototipo:3673` |
| `vxLabIn` | función | `prototipo:3674` |
| `vxPrcIn` | función | `prototipo:3675` |
| `vxPrfIn` | función | `prototipo:3676` |
| `vxHospVIH` | función | `prototipo:3677` |
| `vxFalla` | función | `prototipo:3678` |
| `vxR` | función | `prototipo:3679` |
| `vxUP, vxDOWN, vxLB` | función | `prototipo:3680` |
| `vxSemRng` | función | `prototipo:3681` |
| `VX_IND` | constante / catálogo | `prototipo:3682` |
| `VXI` | función | `prototipo:3732` |
| `vxRng` | función | `prototipo:3733` |
| `vxNivel` | función | `prototipo:3734` |
| `vxRngTxt` | función | `prototipo:3737` |
| `vxFiltro` | función | `prototipo:3739` |
| `vxPer` | función | `prototipo:3740` |
| `vxCalc` | función | `prototipo:3741` |
| `vxCalcBy` | función | `prototipo:3745` |
| `VX_PAQ_DEF` | constante / catálogo | `prototipo:3963` |
| `vxPaq` | función | `prototipo:3964` |
| `vxFactMes` | función | `prototipo:3965` |
| `vxProdMes` | función | `prototipo:3966` |
| `vxDiscMes` | función | `prototipo:3967` |
| `VX_NOM_COLS` | constante / catálogo | `prototipo:4176` |
| `vxNominalRows` | función | `prototipo:4177` |
| `vxNomRow` | función | `prototipo:4179` |
| `vxNominalValidar` | función | `prototipo:4196` |
| `vxCACRows` | función | `prototipo:4212` |
| `vxCACRow` | función | `prototipo:4214` |
| `vxPcCAC` | función | `prototipo:4233` |
| `vxCACValidar` | función | `prototipo:4234` |
| `VX_CAC_LBL` | constante / catálogo | `prototipo:4308` |
| `vxCacCod` | función | `prototipo:4309` |
| `vxCacNum` | función | `prototipo:4310` |
| `vxCacLbl` | función | `prototipo:4311` |
| `VX_AGFREQ_DEF` | constante / catálogo | `prototipo:4318` |
| `vxAgFreq` | función | `prototipo:4319` |
| `vxCitProg` | función | `prototipo:4321` |
| `vxAgEstado` | función | `prototipo:4323` |
| `vxPuedeAgendar` | función | `prototipo:4330` |
| `VX_SMAQ` | constante / catálogo | `prototipo:4370` |
| `vxSmaqRes` | función | `prototipo:4371` |
| `VX_TARCHK` | constante / catálogo | `prototipo:4374` |
| `vxTarChkApl` | función | `prototipo:4375` |
| `VX_FTXT` | constante / catálogo | `prototipo:4507` |
| `vxLabPlan` | función | `prototipo:4508` |
| `vxDue` | función | `prototipo:4529` |
| `vxPPD` | función | `prototipo:4545` |
| `vxCit` | función | `prototipo:4553` |
| `vxPrcPend` | función | `prototipo:4565` |

## NEFRO · `crearMotorNefro(ctx)` (4 definiciones)

| Definición | Tipo | Origen |
|---|---|---|
| `RCV` | función | `nefroproteccion/riesgo_cv.js:17` |
| `NP` | función | `nefroproteccion/motor_clinico.js:3` |
| `EPSMODEL_DEF` | constante / catálogo | `nefroproteccion/motor_clinico.js:430` |
| `COH` | función | `nefroproteccion/motor_cohorte.js:3` |

