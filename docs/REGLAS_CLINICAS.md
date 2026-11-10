# Inventario de reglas clínicas extraídas

> GENERADO por `packages/clinical-rules/scripts/extraer-reglas.mjs`. No editar a mano.
> Cada definición se copió **textualmente** del código de los módulos (`apps/web/public/modulos/`). La columna *Origen* da el archivo y la línea.
> Equivalencia verificada en `packages/clinical-rules/test/` (código del módulo frente al motor extraído, con las cohortes ficticias de demostración).
> Descripción clínica de cada regla: `docs/ANALISIS.md` §4.

## HD · `crearMotorHD(ctx)` (200 definiciones)

| Definición | Tipo | Origen |
|---|---|---|
| `esc` | función | `portal.js:6` |
| `pad` | función | `portal.js:7` |
| `iso` | función | `portal.js:8` |
| `fd` | función | `portal.js:9` |
| `ym` | función | `portal.js:10` |
| `addDays` | función | `portal.js:12` |
| `addMonths` | función | `portal.js:13` |
| `monthStart` | función | `portal.js:14` |
| `monthEnd` | función | `portal.js:15` |
| `dayDiff` | función | `portal.js:16` |
| `nowTs` | función | `portal.js:17` |
| `pdate` | función | `portal.js:18` |
| `num` | función | `portal.js:26` |
| `norm` | función | `portal.js:27` |
| `f1` | función | `portal.js:28` |
| `pct` | función | `portal.js:29` |
| `money` | función | `portal.js:30` |
| `EPS_L` | constante / catálogo | `portal.js:37` |
| `epsList` | función | `portal.js:38` |
| `TURNOS_DEF` | constante / catálogo | `portal.js:39` |
| `turnosCfg` | función | `portal.js:40` |
| `turnoNames` | función | `portal.js:41` |
| `DIAS_L` | constante / catálogo | `portal.js:42` |
| `ESTADOS_SES` | constante / catálogo | `portal.js:43` |
| `MOTIVOS` | constante / catálogo | `portal.js:45` |
| `MOT_RESP` | constante / catálogo | `portal.js:46` |
| `CAUSA_HOSP` | constante / catálogo | `portal.js:47` |
| `ATRIB` | constante / catálogo | `portal.js:48` |
| `MOT_EXTRA` | constante / catálogo | `portal.js:49` |
| `ACCESOS` | constante / catálogo | `portal.js:50` |
| `isCVC` | función | `portal.js:51` |
| `ITS` | constante / catálogo | `portal.js:52` |
| `EVENTOS` | constante / catálogo | `portal.js:53` |
| `SEV` | constante / catálogo | `portal.js:54` |
| `RESUELTO` | constante / catálogo | `portal.js:55` |
| `HEMOC` | constante / catálogo | `portal.js:56` |
| `NOV_TIPOS` | constante / catálogo | `portal.js:57` |
| `MOV_EGRESO` | constante / catálogo | `portal.js:58` |
| `MOV_TIPOS` | constante / catálogo | `portal.js:59` |
| `EGRESO_ESTADO` | constante / catálogo | `portal.js:60` |
| `RUTA` | constante / catálogo | `portal.js:61` |
| `RUTA_EXCL` | constante / catálogo | `portal.js:62` |
| `ACC_NOV` | constante / catálogo | `portal.js:63` |
| `ACC_NOV_RES` | constante / catálogo | `portal.js:64` |
| `TX` | constante / catálogo | `portal.js:65` |
| `PROCED` | constante / catálogo | `portal.js:66` |
| `MEDIOS` | constante / catálogo | `portal.js:67` |
| `RESULT_CTC` | constante / catálogo | `portal.js:68` |
| `DISCIPLINAS` | constante / catálogo | `portal.js:69` |
| `EXAMS` | constante / catálogo | `portal.js:71` |
| `EX` | función | `portal.js:81` |
| `FREQ_TXT` | constante / catálogo | `portal.js:82` |
| `ANCHOR_DEF` | constante / catálogo | `portal.js:84` |
| `META_DEF` | constante / catálogo | `portal.js:85` |
| `CFG_DEF` | constante / catálogo | `portal.js:86` |
| `MUN_DANE` | constante / catálogo | `portal.js:94` |
| `AEE` | constante / catálogo | `portal.js:96` |
| `SH` | constante / catálogo | `portal.js:99` |
| `BOOK_KEYS` | constante / catálogo | `portal.js:124` |
| `DATE_F` | constante / catálogo | `portal.js:125` |
| `NUM_F` | constante / catálogo | `portal.js:126` |
| `cacStart` | función | `portal.js:129` |
| `newBook` | función | `portal.js:131` |
| `readSheet` | función | `portal.js:132` |
| `fromRow` | función | `portal.js:133` |
| `isToolBook` | función | `portal.js:134` |
| `isDashboard` | función | `portal.js:135` |
| `parseToolBook` | función | `portal.js:136` |
| `live` | función | `portal.js:169` |
| `IDX` | constante / catálogo | `portal.js:172` |
| `reindex` | función | `portal.js:173` |
| `ensureIdx` | función | `portal.js:193` |
| `nombre` | función | `portal.js:194` |
| `activeAt` | función | `portal.js:195` |
| `activeDays` | función | `portal.js:196` |
| `overlaps` | función | `portal.js:197` |
| `ageAt` | función | `portal.js:198` |
| `adult` | función | `portal.js:199` |
| `ninety` | función | `portal.js:200` |
| `epsOk` | función | `portal.js:201` |
| `turnoDias` | función | `portal.js:202` |
| `absentOn` | función | `portal.js:203` |
| `progDays` | función | `portal.js:204` |
| `sesIn` | función | `portal.js:205` |
| `lastLab` | función | `portal.js:206` |
| `labsIn` | función | `portal.js:207` |
| `accessAt` | función | `portal.js:208` |
| `lastSes` | función | `portal.js:214` |
| `gidStats` | función | `portal.js:216` |
| `taStats` | función | `portal.js:220` |
| `glucoStats` | función | `portal.js:222` |
| `ktvOnline` | función | `portal.js:224` |
| `fmtTA` | función | `portal.js:225` |
| `parseTA` | función | `portal.js:226` |
| `ktvDaugirdas` | función | `portal.js:228` |
| `metasDe` | función | `portal.js:229` |
| `CAC_H_FOMAG` | constante / catálogo | `portal.js:231` |
| `CAC_H_ERC` | constante / catálogo | `portal.js:232` |
| `CAC_SHEET_FOMAG` | constante / catálogo | `portal.js:233` |
| `CAC_SHEET_ERC` | constante / catálogo | `portal.js:234` |
| `pacs` | función | `portal.js:237` |
| `popCut` | función | `portal.js:238` |
| `popPer` | función | `portal.js:239` |
| `popInc` | función | `portal.js:240` |
| `ctxFor` | función | `portal.js:241` |
| `pv` | función | `portal.js:245` |
| `propLab` | función | `portal.js:246` |
| `IND` | constante / catálogo | `portal.js:247` |
| `INDM` | función | `portal.js:295` |
| `progUpTo` | función | `portal.js:296` |
| `evalInd` | función | `portal.js:297` |
| `statusOf` | función | `portal.js:304` |
| `STATUS_TXT` | constante / catálogo | `portal.js:308` |
| `fmtVal` | función | `portal.js:309` |
| `trendPoints` | función | `portal.js:310` |
| `semaforo` | función | `portal.js:313` |
| `alertas` | función | `portal.js:325` |
| `calidad` | función | `portal.js:351` |
| `tarifaFor` | función | `portal.js:374` |
| `conciliar` | función | `portal.js:375` |
| `freqOf` | función | `portal.js:389` |
| `schedMonths` | función | `portal.js:390` |
| `susceptibleVHB` | función | `portal.js:392` |
| `examApplies` | función | `portal.js:393` |
| `examsForMonth` | función | `portal.js:395` |
| `labDue` | función | `portal.js:403` |
| `CAL_DOM` | constante / catálogo | `portal.js:415` |
| `CAL_OPC` | constante / catálogo | `portal.js:427` |
| `calidadAuto` | función | `portal.js:429` |
| `calidadScore` | función | `portal.js:436` |
| `CAL_CLASS` | constante / catálogo | `portal.js:452` |
| `ultimaValoracion` | función | `portal.js:453` |
| `calidadDe` | función | `portal.js:454` |
| `D1800, D1845, D1811` | constante / catálogo | `portal.js:1013` |
| `isoOr` | función | `portal.js:1014` |
| `cacVals` | función | `portal.js:1015` |
| `ufCalc` | función | `portal.js:1340` |
| `sesUF` | función | `portal.js:1341` |
| `EST_TIPOS` | constante / catálogo | `portal.js:1347` |
| `EST_NOM` | constante / catálogo | `portal.js:1348` |
| `estRelevantes` | función | `portal.js:1349` |
| `estVencidos` | función | `portal.js:1350` |
| `vacEsquemas` | función | `portal.js:1357` |
| `vacMeses` | función | `portal.js:1358` |
| `vacDoses` | función | `portal.js:1359` |
| `labTxt` | función | `portal.js:1360` |
| `vacStatus` | función | `portal.js:1361` |
| `VAC_GRUPOS` | constante / catálogo | `portal.js:1386` |
| `vacGrupo` | función | `portal.js:1387` |
| `vacNextDefaults` | función | `portal.js:1388` |
| `vacEtiqueta` | función | `portal.js:1408` |
| `TX_EST` | constante / catálogo | `portal.js:1414` |
| `txItems` | función | `portal.js:1415` |
| `txState` | función | `portal.js:1416` |
| `TX_EN_PROCESO` | constante / catálogo | `portal.js:1419` |
| `tenerPresente` | función | `portal.js:1447` |
| `SOL_EST` | constante / catálogo | `portal.js:1454` |
| `solRecs` | función | `portal.js:1456` |
| `solPropuesta` | función | `portal.js:1457` |
| `` | constante / catálogo | `portal.js:1691` |
| `` | constante / catálogo | `portal.js:1692` |
| `` | constante / catálogo | `portal.js:1693` |
| `` | constante / catálogo | `portal.js:1694` |
| `` | constante / catálogo | `portal.js:1695` |
| `` | función | `portal.js:1696` |
| `` | constante / catálogo | `portal.js:1697` |
| `` | constante / catálogo | `portal.js:1698` |
| `` | constante / catálogo | `portal.js:1699` |
| `` | constante / catálogo | `portal.js:1700` |
| `lv` | función | `portal.js:4679` |
| `hdOn` | función | `portal.js:4680` |
| `DSP_TIPOS` | constante / catálogo | `portal.js:4697` |
| `DSP_SITIOS` | constante / catálogo | `portal.js:4698` |
| `DSP_RETIRO` | constante / catálogo | `portal.js:4699` |
| `DSP_LUGAR` | constante / catálogo | `portal.js:4700` |
| `dspAll` | función | `portal.js:4701` |
| `dspOf` | función | `portal.js:4702` |
| `dspCVC` | función | `portal.js:4703` |
| `dspFind` | función | `portal.js:4704` |
| `dspOpen` | función | `portal.js:4705` |
| `cdMet` | función | `portal.js:4706` |
| `dspCovers` | función | `portal.js:4707` |
| `hospOn` | función | `portal.js:4708` |
| `cdCalc` | función | `portal.js:4712` |
| `dspPropuestas` | función | `portal.js:4734` |
| `MIC_MUESTRAS` | constante / catálogo | `portal.js:4747` |
| `MIC_SANGRE` | constante / catálogo | `portal.js:4748` |
| `MIC_EST` | constante / catálogo | `portal.js:4749` |
| `MIC_RES` | constante / catálogo | `portal.js:4750` |
| `MIC_FEN` | constante / catálogo | `portal.js:4751` |
| `MIC_FEN_ALERTA` | constante / catálogo | `portal.js:4752` |
| `micAll` | función | `portal.js:4755` |
| `micOfEp` | función | `portal.js:4756` |
| `micOfPac` | función | `portal.js:4757` |
| `micPos` | función | `portal.js:4758` |
| `micAB` | función | `portal.js:4759` |
| `itsConf` | función | `portal.js:4761` |
| `v6Its` | función | `portal.js:4835` |
| `v6Calidad` | función | `portal.js:4970` |
| `catDays` | función | `portal.js:6677` |

## VIH · `crearMotorVIH(ctx)` (137 definiciones)

| Definición | Tipo | Origen |
|---|---|---|
| `esc` | función | `portal.js:6` |
| `pad` | función | `portal.js:7` |
| `iso` | función | `portal.js:8` |
| `fd` | función | `portal.js:9` |
| `ym` | función | `portal.js:10` |
| `addDays` | función | `portal.js:12` |
| `addMonths` | función | `portal.js:13` |
| `monthStart` | función | `portal.js:14` |
| `monthEnd` | función | `portal.js:15` |
| `dayDiff` | función | `portal.js:16` |
| `nowTs` | función | `portal.js:17` |
| `pdate` | función | `portal.js:18` |
| `num` | función | `portal.js:26` |
| `norm` | función | `portal.js:27` |
| `f1` | función | `portal.js:28` |
| `pct` | función | `portal.js:29` |
| `money` | función | `portal.js:30` |
| `VX_CAC_COLS` | constante / catálogo | `portal.js:2415` |
| `VXS` | constante / catálogo | `portal.js:2704` |
| `VXK` | constante / catálogo | `portal.js:2721` |
| `VX_EPS` | constante / catálogo | `portal.js:2724` |
| `VX_EPSCODE_DEF` | constante / catálogo | `portal.js:2725` |
| `VX_REG` | constante / catálogo | `portal.js:2726` |
| `VX_MUN` | constante / catálogo | `portal.js:2728` |
| `VX_MUN_ALIAS` | constante / catálogo | `portal.js:2729` |
| `VX_PCLAVE` | constante / catálogo | `portal.js:2730` |
| `VX_TINGR` | constante / catálogo | `portal.js:2731` |
| `VX_ESTADO` | constante / catálogo | `portal.js:2732` |
| `VX_MODAL` | constante / catálogo | `portal.js:2733` |
| `VX_DISC` | constante / catálogo | `portal.js:2734` |
| `VX_DISC_ACT` | constante / catálogo | `portal.js:2735` |
| `VX_CITTIPO` | constante / catálogo | `portal.js:2736` |
| `VX_MOTINAS` | constante / catálogo | `portal.js:2737` |
| `VX_NOV` | constante / catálogo | `portal.js:2738` |
| `VX_PRC` | constante / catálogo | `portal.js:2739` |
| `VX_PRF` | constante / catálogo | `portal.js:2740` |
| `VX_EX` | constante / catálogo | `portal.js:2742` |
| `VXE` | función | `portal.js:2757` |
| `VX_CONTRATO_DEF` | constante / catálogo | `portal.js:2759` |
| `VX_GUIA_DIF` | constante / catálogo | `portal.js:2772` |
| `VX_MED` | constante / catálogo | `portal.js:2774` |
| `VX_CLASES` | constante / catálogo | `portal.js:2775` |
| `VX_ESQ` | constante / catálogo | `portal.js:2776` |
| `VXQ` | función | `portal.js:2793` |
| `VX_GPC_PREF` | constante / catálogo | `portal.js:2796` |
| `VX_VAC` | constante / catálogo | `portal.js:2798` |
| `VXV` | función | `portal.js:2805` |
| `VX_VACEST` | constante / catálogo | `portal.js:2806` |
| `vxLive` | función | `portal.js:2809` |
| `vxD` | función | `portal.js:2810` |
| `vxNom` | función | `portal.js:2811` |
| `vxCorte` | función | `portal.js:2813` |
| `vxMunCode` | función | `portal.js:2814` |
| `vxMunName` | función | `portal.js:2815` |
| `vxCfg` | función | `portal.js:2816` |
| `vxNewBook` | función | `portal.js:2817` |
| `vxEdad` | función | `portal.js:2824` |
| `vxGrupoEtario` | función | `portal.js:2825` |
| `vxF` | función | `portal.js:2826` |
| `vxIdx` | función | `portal.js:2829` |
| `vxPacs` | función | `portal.js:2838` |
| `vxP` | función | `portal.js:2839` |
| `vxL` | función | `portal.js:2840` |
| `vxLast` | función | `portal.js:2842` |
| `vxFirst` | función | `portal.js:2843` |
| `vxVal` | función | `portal.js:2844` |
| `vxPos` | función | `portal.js:2845` |
| `vxCVind` | función | `portal.js:2846` |
| `vxFmtLab` | función | `portal.js:2847` |
| `vxPeriodo` | función | `portal.js:2850` |
| `vxActivo` | función | `portal.js:2851` |
| `vxTarAt` | función | `portal.js:2852` |
| `vxTarIni` | función | `portal.js:2853` |
| `vxUltEnt` | función | `portal.js:2854` |
| `vxCobertura` | función | `portal.js:2855` |
| `vxUltAtencion` | función | `portal.js:2856` |
| `vxNovAt` | función | `portal.js:2857` |
| `vxSt` | función | `portal.js:2858` |
| `vxVacEstado` | función | `portal.js:2886` |
| `vxVacCompleta` | función | `portal.js:2901` |
| `vxContrato` | función | `portal.js:2904` |
| `vxHSH` | función | `portal.js:2906` |
| `vxSolRecs` | función | `portal.js:2907` |
| `vxSolTieneRes` | función | `portal.js:2909` |
| `vxAlertas` | función | `portal.js:2912` |
| `vxTFG` | función | `portal.js:2934` |
| `VX_GPC14` | constante / catálogo | `portal.js:2938` |
| `vxEnRango` | función | `portal.js:2939` |
| `vxLabIn` | función | `portal.js:2940` |
| `vxPrcIn` | función | `portal.js:2941` |
| `vxPrfIn` | función | `portal.js:2942` |
| `vxHospVIH` | función | `portal.js:2943` |
| `vxFalla` | función | `portal.js:2944` |
| `vxR` | función | `portal.js:2945` |
| `vxUP, vxDOWN, vxLB` | función | `portal.js:2946` |
| `vxSemRng` | función | `portal.js:2947` |
| `VX_IND` | constante / catálogo | `portal.js:2948` |
| `VXI` | función | `portal.js:2998` |
| `vxRng` | función | `portal.js:2999` |
| `vxNivel` | función | `portal.js:3000` |
| `vxRngTxt` | función | `portal.js:3003` |
| `vxFiltro` | función | `portal.js:3005` |
| `vxPer` | función | `portal.js:3006` |
| `vxCalc` | función | `portal.js:3007` |
| `vxCalcBy` | función | `portal.js:3011` |
| `VX_PAQ_DEF` | constante / catálogo | `portal.js:3229` |
| `vxPaq` | función | `portal.js:3230` |
| `vxFactMes` | función | `portal.js:3231` |
| `vxProdMes` | función | `portal.js:3232` |
| `vxDiscMes` | función | `portal.js:3233` |
| `VX_NOM_COLS` | constante / catálogo | `portal.js:3442` |
| `vxNominalRows` | función | `portal.js:3443` |
| `vxNomRow` | función | `portal.js:3445` |
| `vxNominalValidar` | función | `portal.js:3462` |
| `vxCACRows` | función | `portal.js:3478` |
| `vxCACRow` | función | `portal.js:3480` |
| `vxPcCAC` | función | `portal.js:3499` |
| `vxCACValidar` | función | `portal.js:3500` |
| `VX_CAC_LBL` | constante / catálogo | `portal.js:3574` |
| `vxCacCod` | función | `portal.js:3575` |
| `vxCacNum` | función | `portal.js:3576` |
| `vxCacLbl` | función | `portal.js:3577` |
| `VX_AGFREQ_DEF` | constante / catálogo | `portal.js:3584` |
| `vxAgFreq` | función | `portal.js:3585` |
| `vxCitProg` | función | `portal.js:3587` |
| `vxAgEstado` | función | `portal.js:3589` |
| `vxPuedeAgendar` | función | `portal.js:3596` |
| `VX_SMAQ` | constante / catálogo | `portal.js:3636` |
| `vxSmaqRes` | función | `portal.js:3637` |
| `VX_TARCHK` | constante / catálogo | `portal.js:3640` |
| `vxTarChkApl` | función | `portal.js:3641` |
| `VX_FTXT` | constante / catálogo | `portal.js:3773` |
| `vxLabPlan` | función | `portal.js:3774` |
| `vxDue` | función | `portal.js:3795` |
| `vxPPD` | función | `portal.js:3811` |
| `vxCit` | función | `portal.js:3819` |
| `vxPrcPend` | función | `portal.js:3831` |

## NEFRO · `crearMotorNefro(ctx)` (4 definiciones)

| Definición | Tipo | Origen |
|---|---|---|
| `RCV` | función | `nefro/ruta-1.js:18` |
| `NP` | función | `nefro/ruta-2.js:4` |
| `EPSMODEL_DEF` | constante / catálogo | `nefro/ruta-2.js:431` |
| `COH` | función | `nefro/ruta-4.js:4` |

