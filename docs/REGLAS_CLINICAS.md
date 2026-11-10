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
| `D1800, D1845, D1811` | constante / catálogo | `portal.js:1014` |
| `isoOr` | función | `portal.js:1015` |
| `cacVals` | función | `portal.js:1016` |
| `ufCalc` | función | `portal.js:1341` |
| `sesUF` | función | `portal.js:1342` |
| `EST_TIPOS` | constante / catálogo | `portal.js:1348` |
| `EST_NOM` | constante / catálogo | `portal.js:1349` |
| `estRelevantes` | función | `portal.js:1350` |
| `estVencidos` | función | `portal.js:1351` |
| `vacEsquemas` | función | `portal.js:1358` |
| `vacMeses` | función | `portal.js:1359` |
| `vacDoses` | función | `portal.js:1360` |
| `labTxt` | función | `portal.js:1361` |
| `vacStatus` | función | `portal.js:1362` |
| `VAC_GRUPOS` | constante / catálogo | `portal.js:1387` |
| `vacGrupo` | función | `portal.js:1388` |
| `vacNextDefaults` | función | `portal.js:1389` |
| `vacEtiqueta` | función | `portal.js:1409` |
| `TX_EST` | constante / catálogo | `portal.js:1415` |
| `txItems` | función | `portal.js:1416` |
| `txState` | función | `portal.js:1417` |
| `TX_EN_PROCESO` | constante / catálogo | `portal.js:1420` |
| `tenerPresente` | función | `portal.js:1448` |
| `SOL_EST` | constante / catálogo | `portal.js:1455` |
| `solRecs` | función | `portal.js:1457` |
| `solPropuesta` | función | `portal.js:1458` |
| `` | constante / catálogo | `portal.js:1692` |
| `` | constante / catálogo | `portal.js:1693` |
| `` | constante / catálogo | `portal.js:1694` |
| `` | constante / catálogo | `portal.js:1695` |
| `` | constante / catálogo | `portal.js:1696` |
| `` | función | `portal.js:1697` |
| `` | constante / catálogo | `portal.js:1698` |
| `` | constante / catálogo | `portal.js:1699` |
| `` | constante / catálogo | `portal.js:1700` |
| `` | constante / catálogo | `portal.js:1701` |
| `lv` | función | `portal.js:4680` |
| `hdOn` | función | `portal.js:4681` |
| `DSP_TIPOS` | constante / catálogo | `portal.js:4698` |
| `DSP_SITIOS` | constante / catálogo | `portal.js:4699` |
| `DSP_RETIRO` | constante / catálogo | `portal.js:4700` |
| `DSP_LUGAR` | constante / catálogo | `portal.js:4701` |
| `dspAll` | función | `portal.js:4702` |
| `dspOf` | función | `portal.js:4703` |
| `dspCVC` | función | `portal.js:4704` |
| `dspFind` | función | `portal.js:4705` |
| `dspOpen` | función | `portal.js:4706` |
| `cdMet` | función | `portal.js:4707` |
| `dspCovers` | función | `portal.js:4708` |
| `hospOn` | función | `portal.js:4709` |
| `cdCalc` | función | `portal.js:4713` |
| `dspPropuestas` | función | `portal.js:4735` |
| `MIC_MUESTRAS` | constante / catálogo | `portal.js:4748` |
| `MIC_SANGRE` | constante / catálogo | `portal.js:4749` |
| `MIC_EST` | constante / catálogo | `portal.js:4750` |
| `MIC_RES` | constante / catálogo | `portal.js:4751` |
| `MIC_FEN` | constante / catálogo | `portal.js:4752` |
| `MIC_FEN_ALERTA` | constante / catálogo | `portal.js:4753` |
| `micAll` | función | `portal.js:4756` |
| `micOfEp` | función | `portal.js:4757` |
| `micOfPac` | función | `portal.js:4758` |
| `micPos` | función | `portal.js:4759` |
| `micAB` | función | `portal.js:4760` |
| `itsConf` | función | `portal.js:4762` |
| `v6Its` | función | `portal.js:4836` |
| `v6Calidad` | función | `portal.js:4971` |
| `catDays` | función | `portal.js:6678` |

## VIH · `crearMotorVIH(ctx)` (140 definiciones)

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
| `VX_CAC_COLS` | constante / catálogo | `portal.js:2416` |
| `VXS` | constante / catálogo | `portal.js:2705` |
| `VXK` | constante / catálogo | `portal.js:2722` |
| `VX_EPS` | constante / catálogo | `portal.js:2725` |
| `VX_EPSCODE_DEF` | constante / catálogo | `portal.js:2726` |
| `VX_REG` | constante / catálogo | `portal.js:2727` |
| `VX_MUN` | constante / catálogo | `portal.js:2729` |
| `VX_MUN_ALIAS` | constante / catálogo | `portal.js:2730` |
| `VX_PCLAVE` | constante / catálogo | `portal.js:2731` |
| `VX_TINGR` | constante / catálogo | `portal.js:2732` |
| `VX_ESTADO` | constante / catálogo | `portal.js:2733` |
| `VX_MODAL` | constante / catálogo | `portal.js:2734` |
| `VX_DISC` | constante / catálogo | `portal.js:2735` |
| `VX_DISC_ACT` | constante / catálogo | `portal.js:2736` |
| `VX_CITTIPO` | constante / catálogo | `portal.js:2737` |
| `VX_MOTINAS` | constante / catálogo | `portal.js:2738` |
| `VX_NOV` | constante / catálogo | `portal.js:2739` |
| `VX_PRC` | constante / catálogo | `portal.js:2740` |
| `VX_PRF` | constante / catálogo | `portal.js:2741` |
| `VX_EX` | constante / catálogo | `portal.js:2743` |
| `VXE` | función | `portal.js:2758` |
| `VX_CONTRATO_DEF` | constante / catálogo | `portal.js:2760` |
| `VX_GUIA_DIF` | constante / catálogo | `portal.js:2773` |
| `VX_MED` | constante / catálogo | `portal.js:2775` |
| `VX_CLASES` | constante / catálogo | `portal.js:2776` |
| `VX_ESQ` | constante / catálogo | `portal.js:2777` |
| `VXQ` | función | `portal.js:2794` |
| `VX_GPC_PREF` | constante / catálogo | `portal.js:2797` |
| `VX_VAC` | constante / catálogo | `portal.js:2799` |
| `VXV` | función | `portal.js:2806` |
| `VX_VACEST` | constante / catálogo | `portal.js:2807` |
| `vxLive` | función | `portal.js:2810` |
| `vxD` | función | `portal.js:2811` |
| `vxNom` | función | `portal.js:2812` |
| `vxCorte` | función | `portal.js:2814` |
| `vxMunCode` | función | `portal.js:2815` |
| `vxMunName` | función | `portal.js:2816` |
| `vxCfg` | función | `portal.js:2817` |
| `vxNewBook` | función | `portal.js:2818` |
| `vxEdad` | función | `portal.js:2825` |
| `vxGrupoEtario` | función | `portal.js:2826` |
| `vxF` | función | `portal.js:2827` |
| `vxIdx` | función | `portal.js:2830` |
| `vxPacs` | función | `portal.js:2839` |
| `vxP` | función | `portal.js:2840` |
| `vxL` | función | `portal.js:2841` |
| `vxLast` | función | `portal.js:2843` |
| `vxFirst` | función | `portal.js:2844` |
| `vxVal` | función | `portal.js:2845` |
| `vxPos` | función | `portal.js:2846` |
| `vxCVind` | función | `portal.js:2847` |
| `vxFmtLab` | función | `portal.js:2848` |
| `vxPeriodo` | función | `portal.js:2851` |
| `vxActivo` | función | `portal.js:2852` |
| `vxTarAt` | función | `portal.js:2853` |
| `vxTarIni` | función | `portal.js:2854` |
| `vxUltEnt` | función | `portal.js:2855` |
| `vxCobertura` | función | `portal.js:2856` |
| `vxUltAtencion` | función | `portal.js:2857` |
| `vxNovAt` | función | `portal.js:2858` |
| `vxSt` | función | `portal.js:2859` |
| `vxVacEstado` | función | `portal.js:2887` |
| `vxVacCompleta` | función | `portal.js:2902` |
| `vxContrato` | función | `portal.js:2905` |
| `vxHSH` | función | `portal.js:2907` |
| `vxSolRecs` | función | `portal.js:2908` |
| `vxSolTieneRes` | función | `portal.js:2910` |
| `vxAlertas` | función | `portal.js:2913` |
| `vxTFG` | función | `portal.js:2935` |
| `VX_GPC14` | constante / catálogo | `portal.js:2939` |
| `vxEnRango` | función | `portal.js:2940` |
| `vxLabIn` | función | `portal.js:2941` |
| `vxPrcIn` | función | `portal.js:2942` |
| `vxPrfIn` | función | `portal.js:2943` |
| `vxHospVIH` | función | `portal.js:2944` |
| `vxFalla` | función | `portal.js:2945` |
| `vxR` | función | `portal.js:2946` |
| `vxUP, vxDOWN, vxLB` | función | `portal.js:2947` |
| `vxSemRng` | función | `portal.js:2948` |
| `VX_IND` | constante / catálogo | `portal.js:2949` |
| `VXI` | función | `portal.js:2999` |
| `vxRng` | función | `portal.js:3000` |
| `vxNivel` | función | `portal.js:3001` |
| `vxRngTxt` | función | `portal.js:3004` |
| `vxFiltro` | función | `portal.js:3006` |
| `vxPer` | función | `portal.js:3007` |
| `vxCalc` | función | `portal.js:3008` |
| `vxCalcBy` | función | `portal.js:3012` |
| `VX_PAQ_DEF` | constante / catálogo | `portal.js:3230` |
| `vxPaq` | función | `portal.js:3231` |
| `vxFactMes` | función | `portal.js:3232` |
| `vxProdMes` | función | `portal.js:3233` |
| `vxDiscMes` | función | `portal.js:3234` |
| `VX_NOM_COLS` | constante / catálogo | `portal.js:3443` |
| `vxNominalRows` | función | `portal.js:3444` |
| `vxNomRow` | función | `portal.js:3446` |
| `vxNominalValidar` | función | `portal.js:3463` |
| `vxCACRows` | función | `portal.js:3479` |
| `vxCACRow` | función | `portal.js:3481` |
| `vxPcCAC` | función | `portal.js:3500` |
| `vxCACValidar` | función | `portal.js:3501` |
| `VX_CAC_LBL` | constante / catálogo | `portal.js:3575` |
| `vxCacCod` | función | `portal.js:3576` |
| `vxCacNum` | función | `portal.js:3577` |
| `vxCacLbl` | función | `portal.js:3578` |
| `VX_AGFREQ_DEF` | constante / catálogo | `portal.js:3585` |
| `vxAgFreq` | función | `portal.js:3586` |
| `VX_DCOL` | constante / catálogo | `portal.js:3587` |
| `vxCitProg` | función | `portal.js:3588` |
| `vxAgEstado` | función | `portal.js:3590` |
| `vxPuedeAgendar` | función | `portal.js:3597` |
| `VX_SMAQ` | constante / catálogo | `portal.js:3637` |
| `vxSmaqRes` | función | `portal.js:3638` |
| `VX_TARCHK` | constante / catálogo | `portal.js:3641` |
| `vxTarChkApl` | función | `portal.js:3642` |
| `VX_FTXT` | constante / catálogo | `portal.js:3774` |
| `vxLabPlan` | función | `portal.js:3775` |
| `vxDue` | función | `portal.js:3796` |
| `vxPPD` | función | `portal.js:3812` |
| `vxCit` | función | `portal.js:3820` |
| `vxPrcPend` | función | `portal.js:3832` |
| `` | constante / catálogo | `portal.js:7948` |
| `` | constante / catálogo | `portal.js:11249` |

## NEFRO · `crearMotorNefro(ctx)` (4 definiciones)

| Definición | Tipo | Origen |
|---|---|---|
| `RCV` | función | `nefro/ruta-1.js:18` |
| `NP` | función | `nefro/ruta-2.js:4` |
| `EPSMODEL_DEF` | constante / catálogo | `nefro/ruta-2.js:431` |
| `COH` | función | `nefro/ruta-4.js:4` |

