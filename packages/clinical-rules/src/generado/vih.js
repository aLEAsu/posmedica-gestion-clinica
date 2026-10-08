// GENERADO por packages/clinical-rules/scripts/extraer-reglas.mjs a partir de «Gestión Clínica POSMÉDICA (1).html».
// NO EDITAR A MANO: cualquier cambio de regla se hace en el prototipo validado por la coordinación médica y se vuelve a extraer.
// Las referencias «archivo:línea» apuntan a los archivos de _analisis/.
// Programa VIH: estado del paciente al corte, alertas, carné de vacunas, contrato de laboratorios, indicadores CAC y Nueva EPS,
// agenda por disciplina, adherencia (SMAQ), TAR, producción y filas de la cohorte nominal y del reporte CAC.
export function crearMotorVIH(ctx) {
"use strict";
const __hoy = ctx && ctx.hoy ? new Date(ctx.hoy) : new Date();
const TODAY = () => new Date(__hoy.getFullYear(), __hoy.getMonth(), __hoy.getDate());
const XLSX = ctx && ctx.XLSX;
/* Estado que en el prototipo vivía en la pantalla. ctx.libro: el libro del programa VIH (mismas hojas y columnas). */
const VX = { book: ctx.libro, ui: Object.assign({ tab: "tab" }, ctx.ui || {}), dirty: false, corte: ctx.corte ? new Date(ctx.corte) : null, demo: false, ver: 0, memo: {} };
/* hd.js:5 */
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
/* hd.js:6 */
const pad=n=>String(n).padStart(2,"0");
/* hd.js:7 */
const iso=d=>d?d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate()):"";
/* hd.js:8 */
const fd=d=>d?pad(d.getDate())+"/"+pad(d.getMonth()+1)+"/"+d.getFullYear():"";
/* hd.js:9 */
const ym=d=>d.getFullYear()+"-"+pad(d.getMonth()+1);
/* hd.js:11 */
const addDays=(d,k)=>new Date(d.getFullYear(),d.getMonth(),d.getDate()+k);
/* hd.js:12 */
function addMonths(d,m){const t=new Date(d.getFullYear(),d.getMonth()+m,1);const last=new Date(t.getFullYear(),t.getMonth()+1,0).getDate();return new Date(t.getFullYear(),t.getMonth(),Math.min(d.getDate(),last));}
/* hd.js:13 */
const monthStart=d=>new Date(d.getFullYear(),d.getMonth(),1);
/* hd.js:14 */
const monthEnd=d=>new Date(d.getFullYear(),d.getMonth()+1,0);
/* hd.js:15 */
const dayDiff=(a,b)=>Math.round((b-a)/864e5);
/* hd.js:16 */
const nowTs=()=>{const d=new Date();return iso(d)+" "+pad(d.getHours())+":"+pad(d.getMinutes());};
/* hd.js:17 */
function pdate(v){
  if(v==null||v==="")return null;
  if(v instanceof Date)return isNaN(v)?null:new Date(v.getFullYear(),v.getMonth(),v.getDate());
  if(typeof v==="number"){if(v<1000)return null;const d=new Date(Math.round((v-25569)*864e5));return new Date(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate());}
  const s=String(v).trim();let m=/^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);if(m)return new Date(+m[1],+m[2]-1,+m[3]);
  m=/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/.exec(s);if(m){let d=+m[1],mo=+m[2];if(mo>12&&d<=12){const t=d;d=mo;mo=t;}if(mo<1||mo>12||d<1||d>31)return null;return new Date(+m[3],mo-1,d);}
  return null;
}
/* hd.js:25 */
function num(v){if(v==null||v==="")return null;if(typeof v==="number")return isFinite(v)?v:null;const s=String(v).replace(",",".").replace(/[^\d.\-]/g,"");if(s===""||s==="-"||s===".")return null;const n=parseFloat(s);return isFinite(n)?n:null;}
/* hd.js:26 */
const norm=s=>String(s==null?"":s).normalize("NFD").replace(/[̀-ͯ]/g,"").toUpperCase().replace(/\s+/g," ").trim();
/* hd.js:27 */
const f1=(v,n)=>v==null||isNaN(v)?"—":Number(v).toLocaleString("es-CO",{minimumFractionDigits:n==null?1:n,maximumFractionDigits:n==null?1:n});
/* hd.js:28 */
const pct=v=>v==null||isNaN(v)?"—":f1(v*100)+" %";
/* hd.js:29 */
const money=v=>v==null||isNaN(v)?"—":"$ "+Math.round(v).toLocaleString("es-CO");
/* vih.js:2 */
const VX_CAC_COLS=["v1ideps", "v2regimen", "v3tipodocumentoidentificacionusu", "v4numerodeidentificacion", "v5primeapellido", "v6segundoapellido", "v7primernombre", "v8segundonombre", "v9fechadenacimiento", "v10sexo", "v11codigopertenenciaetnica", "v12poblacionclave", "v13codigomunicipioresidencia", "v14fechaafiliacionentidad", "v15mujergestante", "v16menorde12meseshijodemadrre", "v17personacontuberculosisactiva", "v18condicionrespectodiagnostico", "v19fechadiagnosticogestacion", "v20fechatamizajevihprimertrimest", "v21fechatamizajevihsegundotrimes", "v22fechatamizajevihtercertrimest", "v23fechadetamizajeparavihmomento", "v24mujercondxdevihencualquiermom", "v241edadgestacionalmomentodxvihd", "v242recibiottoparavihdurantegest", "v243edadgestacionalcomienzodelat", "v244tarduranteintrapartogestacio", "v245resultadogestacionreportadag", "v246fechaculminaciongestacionrep", "v247supresionfarmacolactanciamat", "v248tipoidentificacionreciennaci", "v249numeroidentreciennacidovivoe", "v25tipoidentificamadredemenor12m", "v251numidentificamadredelmenor12", "v252madredemenor12mexpuestoalvih", "v26profilaxisconantirretrovrecie", "v27suministrodeformulalactea", "v28fechapracargaviralparavihenme", "v281resultprimeracargaviralenmen", "v29fechasegundacargaviralmenor12", "v291resultsegundacargaviralmenor", "v30fechaterceracargaviralmenor18", "v301resultadoterceracargaviralme", "v31condicionfinalmenor12mesesexp", "v32fechadxtuberculosisactivarepo", "v33fecharealizatamizajeparavihpe", "v34fechapruebapresuntivarapidaoe", "v35comollegoapruebapresuntivapar", "v36fechadeconfirmaciondedxinfecc", "v361entidadquereportapteconvihes", "v362entidadreportanteanterior", "v37fechainicioatencionporvih", "v38mecanismoviadetransmisiondelv", "v39estadioclinicomomentodxninosa", "v40serealizoconteolinfocitostcd4", "v401conteodelinfocitostcd4moment", "v41serealizocargaviralalmomentod", "v411valordelacargaviralalmomento", "v42fechadeiniciodelaterapiaantir", "v421medicamento1conelqueiniciola", "v422medicamento2conelqueiniciola", "v423medicamento3conelqueiniciola", "v424medicamento4conelqueiniciola", "v425medicamento5conelqueiniciola", "v43conteodelinfocitostcd4almomen", "v431valorconteolinfocitostcd4mom", "v44cargaviralalmomentodeliniciod", "v441valordelacargaviralaliniciod", "v45motivodeiniciodelatar", "v46teniacoinfeccionconvirusdehep", "v47teniacoinfeccionconvirushepat", "v48teniacoinfeccioncontuberculos", "v49nummesesdispensoformcompltarp", "v50numconsultmedasistiopersvivev", "v51hatenidocambiosenelesquemaini", "v511fecprimercambiocualqumedicam", "v512causadelcambiodemedicamentoc", "v513medicamento1queocasionoelcam", "v514medicamento2queocasionoelcam", "v515medicamento3queocasionoelcam", "v516medicamento4queocasionoelcam", "v517fallasdesdeeliniciodelatarha", "v518numerodefallasdesdeeliniciod", "v521infeccionesbacterianasmultip", "v522candidiasisesofagicatraqueal", "v523tuberculosispulmonaroextrapu", "v524cancerdecervixinvasivo", "v525coccidioidomicosisdiseminada", "v526citomegaloviruscualqorganoex", "v527retinitisporcitomegalovirusc", "v528herpessimpleulcerasmucocutan", "v529diarreaporisosporabelliocryp", "v5210histoplasmosisdiseminadaoex", "v5211linfomadeburkittinmunoblast", "v5212neumoniaporpneumocystisjiro", "v5213neumoniarecurrente", "v5214septicemiaporsalmonellarecu", "v5215infecciondiseminadaoextrapu", "v5216criptococosisextrapulmonar", "v5217sarcomadekaposi", "v5218sindromededesgasteasociadoa", "v5219leucoencefalopatiamultifoca", "v5220toxoplasmosiscerebral", "v5221demenciaasociadaalvih", "v5222neumoniaintersticiallinfoid", "v53codigodehabdelasededelaipsdon", "v531fechadeingresoalaipsactualpa", "v532municipiodelaips", "v533quienhacelaatencionclinicayf", "v534valoracionporinfectologoenlo", "v54fechadelaultimagenotipificaci", "v55estadioclinicoactualparaninos", "v56fechadeultimocolesterolldl", "v561resultadodelultimocolesterol", "v57fechadeultimoniveldetriglicer", "v571resultadodelultimoniveldetri", "v58fechadeultimahemoglobinaseric", "v581resultadodelaultimahemoglobi", "v59fechadelaultimaenzimaalaninaa", "v591resultadodelaultimaaltotgpse", "v60fechadeultimacreatininaserica", "v601resultadodelaultimacreatinin", "v61fechadeultimaglucemiasericaen", "v611resultadodelaultimaglucemias", "v62fechadeultimamediciondelpesoc", "v621resultadodelaultimamediciond", "v63talla", "v64tieneneuropatiaperiferica", "v65tienelipoatrofiaolipodistrofi", "v66tienecoinfeccionconhepatitisb", "v67tienecoinfeccionconhepatitisc", "v68tieneotuvocoinfeccioncontuber", "v681tipodetuberculosisactivaquep", "v682lapersonaconcoinfecciontbvih", "v683fecdeiniciodeltratamantitube", "v684medicamento1deltratamantitub", "v685medicamento2deltratamantitub", "v686medicamento3deltratamantitub", "v687medicamento4deltratamantitub", "v688medicamento5deltratamantitub", "v689medicamento6deltratamantitub", "v6810medicamento7deltratamantitu", "v6811medicamento8deltratamantitu", "v6812medicamento9deltratamantitu", "v6813fechaenqueterminoeltratamie", "v6814condiciondeegresodeltratami", "v69tienecirrosishepatica", "v70tieneenfermedadrenalcronicapo", "v71tieneenfermedadcoronaria", "v72tieneohatenidootrasinfeccdetr", "v73tieneneoplasianorelacionadaco", "v74discapacidadfuncional", "v75fechadelultimoconteodelinfoci", "v751valordelultimoconteodelinfoc", "v76fechadelaultimacargaviralpara", "v761valordelaultimacargaviralpar", "v77recibetar", "v771fechadeiniciodelosmedicament", "v772medicamento1delataractual", "v773medicamento2delataractual", "v774medicamento3delataractual", "v775medicamento4delataractual", "v776medicamento5delataractual", "v777medicamento6delataractual", "v778numerodemesesquesedispensola", "v78numerodecondonessuministrados", "v79metododeplanificacionfamilper", "v80vacunacioncontralahepatitisa", "v81vacunacioncontralahepatitisb", "v82vacunacioncontraneumococo", "v83tamizajeclinicoparatuberculos", "v84sehizoppdopruebasequivalentes", "v85recibiotratamientoparatubercu", "v861recibiotratamientoparasifili", "v86sehizotamizajeparasifilisenla", "v87sehizotamizajeparavphanogenit", "v88sehizotamizajeparahepatitisbe", "v89sehizotamizajeparahepatitisce", "v90resultadodelaevaluacionderies", "v91profilaxisparamacmycobacteriu", "v92profilaxisparacriptococoneofo", "v93profilaxisparapneumocystisjir", "v94costototaldeatencionnohospita", "v95costototaldeatencionhospitala", "v96numerodehospitalizacionesenel", "v97novedaddelusuariorespectoalan", "v971fechadedesafiliaciondelaenti", "v972entidadalacualsetrasladoelus", "v973fechademuerte", "v974causademuerte", "v98fechadecorte", "v99codigounicobduabdexpvsmsps"];
/* vih.js:9 */
const VXS={
 pac:["Pacientes",["ID","TipoDoc","Documento","PrimerNombre","SegundoNombre","PrimerApellido","SegundoApellido","FechaNac","Sexo","EPS","Regimen","CodMunicipio","Municipio","Zona","Direccion","Telefono","ContactoRed","Etnia","PoblacionClave","NaturalDe","Escolaridad","Ocupacion","EstadoCivil","Mecanismo","TipoIngreso","FechaDx","FechaPresentacion","FechaIngresoIPS","OportunistaDx","Modalidad","Sede","Gestante","UltAtencionExt","CIE10","FechaAfiliacion","OrientacionSexual","PracticaAnal","TARPrevio","TARPrevioDetalle","DxOtraIPS","SoporteDx","MotivoTamizaje","PruebasDx","Barreras","NovedadNominal","Estado","FechaEgreso","MotivoEgreso","Observaciones","Usuario","Registrado","Anulado","MotivoAnulacion"]],
 ant:["Antecedentes",["ID","Paciente","Fecha","Patologicos","Oportunistas","ITS","TB","Quirurgicos","FarmNoTAR","Toxicos","Alergicos","Transfusionales","Traumaticos","Psiquiatricos","Psicosociales","Discapacidad","Familiares","GrupoSanguineo","Ginecoobstetricos","Usuario","Registrado"]],
 lab:["Laboratorios",["ID","Paciente","FechaToma","Examen","Valor","Resultado","Fuente","Solicitud","Usuario","Registrado","Anulado","MotivoAnulacion"]],
 tar:["EsquemasTAR",["ID","Paciente","Inicio","Fin","Esquema","Linea","Motivo","TARPrevio","Validacion","ValidadoPor","FechaValidacion","Usuario","Registrado","Anulado","MotivoAnulacion"]],
 ent:["EntregasTAR",["ID","Paciente","Fecha","Esquema","Meses","Unidades","Lugar","Usuario","Registrado","Anulado","MotivoAnulacion"]],
 cit:["Agenda",["ID","Paciente","Fecha","Hora","Disciplina","Tipo","Modalidad","Profesional","Estado","Motivo","Gestion","FechaGestion","Usuario","Registrado","Anulado","MotivoAnulacion"]],
 val:["Valoraciones",["ID","Paciente","Fecha","Cita","Disciplina","Profesional","Motivo","Peso","Talla","PerAbd","PAS","PAD","FC","FR","Temp","SatO2","SMAQ","SMAQd","RCV","RCVCat","TamizTB","Fumador","RiesgoSocial","EnfermedadActual","RevisionSistemas","ExamenFisico","Diagnosticos","Educacion","Extra","Analisis","Plan","Usuario","Registrado","Anulado","MotivoAnulacion"]],
 vac:["Vacunas",["ID","Paciente","Vacuna","Dosis","Fecha","Lote","Estado","Soporte","Usuario","Registrado","Anulado","MotivoAnulacion"]],
 prc:["Procedimientos",["ID","Paciente","Tipo","Ordenado","OrdenadoPor","Fecha","Lote","FechaLectura","Lectura","Resultado","Conducta","ProximaFecha","Estado","Usuario","Registrado","Anulado","MotivoAnulacion"]],
 prf:["Profilaxis",["ID","Paciente","Medicamento","Indicacion","Inicio","Fin","Usuario","Registrado","Anulado","MotivoAnulacion"]],
 nov:["Novedades",["ID","Paciente","Fecha","Tipo","Detalle","FechaFin","Usuario","Registrado","Anulado","MotivoAnulacion"]],
 sol:["SolicitudesLab",["ID","Mes","Paciente","Examen","Origen","Motivo","Estado","FechaToma","Nota","Usuario","Registrado","Anulado","MotivoAnulacion"]],
 cac:["ArrastreCAC",["Paciente","Corte","Fuente","Datos"]],
 log:["Bitacora",["FechaHora","Usuario","Accion","Hoja","Registro","Detalle"]],
 cfg:["Config",["Clave","Valor"]]
};
/* vih.js:26 */
const VXK=Object.keys(VXS);
/* vih.js:29 */
const VX_EPS=["NUEVA EPS","FAMILIAR DE COLOMBIA","MALLAMAS","FOMAG","EMSSANAR","OTRA"];
/* vih.js:30 */
const VX_EPSCODE_DEF={"FAMILIAR DE COLOMBIA":"CCF033"};
/* vih.js:31 */
const VX_REG=[["S","Subsidiado"],["C","Contributivo"],["E","Especial / excepción"],["N","No asegurado"]];
/* vih.js:33 */
const VX_MUN=[["86001","MOCOA"],["86219","COLÓN"],["86320","ORITO"],["86568","PUERTO ASÍS"],["86569","PUERTO CAICEDO"],["86571","PUERTO GUZMÁN"],["86573","PUERTO LEGUÍZAMO"],["86749","SIBUNDOY"],["86755","SAN FRANCISCO"],["86757","SAN MIGUEL"],["86760","SANTIAGO"],["86865","VALLE DEL GUAMUEZ"],["86885","VILLAGARZÓN"]];
/* vih.js:34 */
const VX_MUN_ALIAS={"HORMIGA":"VALLE DEL GUAMUEZ","LA HORMIGA":"VALLE DEL GUAMUEZ","VALLE GUAMUEZ":"VALLE DEL GUAMUEZ","PUERTO ASIS":"PUERTO ASÍS","VILLAGARZON":"VILLAGARZÓN","COLON":"COLÓN","PUERTO GUZMAN":"PUERTO GUZMÁN","PUERTO LEGUIZAMO":"PUERTO LEGUÍZAMO"};
/* vih.js:35 */
const VX_PCLAVE=["1.Hombre que tiene relaciones con Hombres","2.Trabajadoras sexuales","3.Privados de la libertad","4.Bisexual","5.Transgenero","6.Heterosexual","7.Menor en seguimiento"];
/* vih.js:36 */
const VX_TINGR=["Nuevo diagnóstico","Traslado de IPS","Traslado de EPS / cesión","Rediagnóstico o reingreso","Menor expuesto en seguimiento"];
/* vih.js:37 */
const VX_ESTADO=["Activo","Fallecido","Trasladado","Abandono","Alta","Desafiliado"];
/* vih.js:38 */
const VX_MODAL=["Presencial","Telemedicina"];
/* vih.js:39 */
const VX_DISC=["Medicina experta VIH","Infectología","Enfermería","Psicología","Trabajo social","Nutrición","Química farmacéutica","Odontología"];
/* vih.js:40 */
const VX_DISC_ACT={"Medicina experta VIH":"Consulta de medicina del programa","Infectología":"Consulta de infectología","Enfermería":"Atención de enfermería","Psicología":"Valoración por psicología","Trabajo social":"Valoración por trabajo social","Nutrición":"Valoración por nutrición","Química farmacéutica":"Atención farmacéutica","Odontología":"Consulta de odontología"};
/* vih.js:41 */
const VX_CITEST=["Programada","Asistió","No asistió","Canceló","Reprogramada"];
/* vih.js:42 */
const VX_CITTIPO=["Control","Ingreso","Prioritaria","Telemedicina de seguimiento","Entrega de TAR"];
/* vih.js:43 */
const VX_MOTINAS=["No contactado / no informa","Sin transporte o dinero","Laboral","Olvido","Enfermedad intercurrente","Hospitalizado","Viaje o cambio de residencia","Barrera de autorización EPS","Decide no asistir","Otro"];
/* vih.js:44 */
const VX_NOV=["Hospitalización por causa VIH (enfermedad oportunista)","Hospitalización por otra causa","Enfermedad oportunista","Tuberculosis activa","Coinfección hepatitis B","Coinfección hepatitis C","Gestación","Falla virológica","Fallecimiento por causa VIH","Fallecimiento por otra causa","Traslado de IPS","Abandono","Alta del programa","Desafiliación"];
/* vih.js:45 */
const VX_PRC=["Tuberculina (PPD)","Citología cervicovaginal","Citología anal","ADN-VPH"];
/* vih.js:46 */
const VX_PRF=["Trimetoprim/sulfametoxazol","Isoniazida (TB latente)","Rifapentina/isoniazida (TB latente)","Azitromicina","Fluconazol","Tratamiento antituberculoso","AAD hepatitis C","Otra"];
/* vih.js:48 */
const VX_EX=[
 {k:"CV",l:"Carga viral VIH",u:"copias/mL",c:"908832",g:"inm"},{k:"CD4",l:"Linfocitos T CD4",u:"cél/µL",c:"906744",g:"inm"},{k:"CD4P",l:"CD4 porcentaje",u:"%",c:"906744",g:"inm"},{k:"CD8",l:"Linfocitos T CD8",u:"cél/µL",c:"906744",g:"inm"},
 {k:"Hb",l:"Hemoglobina",u:"g/dL",c:"902210",g:"hem"},{k:"Hto",l:"Hematocrito",u:"%",c:"902210",g:"hem"},{k:"Leu",l:"Leucocitos",u:"/µL",c:"902210",g:"hem"},{k:"Plt",l:"Plaquetas",u:"/µL",c:"902210",g:"hem"},
 {k:"Cr",l:"Creatinina",u:"mg/dL",c:"903895",g:"ren"},{k:"Glu",l:"Glucemia",u:"mg/dL",c:"",g:"met",nota:"Agregada al contrato del sistema (exigida por el indicador CAC 16); CUPS por confirmar con la EPS"},{k:"HbA1c",l:"HbA1c",u:"%",c:"",g:"met"},
 {k:"AST",l:"AST (TGO)",u:"U/L",c:"903867",g:"hep"},{k:"ALT",l:"ALT (TGP)",u:"U/L",c:"903866",g:"hep"},{k:"FA",l:"Fosfatasa alcalina",u:"U/L",c:"903833",g:"hep"},{k:"BT",l:"Bilirrubina total",u:"mg/dL",c:"903809",g:"hep"},{k:"BD",l:"Bilirrubina directa",u:"mg/dL",c:"903809",g:"hep"},
 {k:"CT",l:"Colesterol total",u:"mg/dL",c:"903818",g:"met"},{k:"LDL",l:"Colesterol LDL",u:"mg/dL",c:"903817",g:"met"},{k:"HDL",l:"Colesterol HDL",u:"mg/dL",c:"903815",g:"met"},{k:"TG",l:"Triglicéridos",u:"mg/dL",c:"903868",g:"met"},
 {k:"TSH",l:"TSH",u:"µUI/mL",c:"904904",g:"bio"},{k:"UA",l:"Uroanálisis",c:"907106",g:"ren",txt:["Normal","Proteinuria","Hematuria","Leucocituria","Glucosuria","Otro hallazgo"]},
 {k:"VDRL",l:"Prueba no treponémica (VDRL/RPR)",c:"906915",g:"sif",txt:["No reactiva","Reactiva"]},{k:"TREP",l:"Prueba treponémica",c:"906039",g:"sif",txt:["Negativa","Positiva"]},
 {k:"HBsAg",l:"HBsAg",c:"906317",g:"ser",txt:["Negativo","Positivo"]},{k:"AntiHBs",l:"Anti-HBs",u:"mUI/mL",c:"906262",g:"ser"},{k:"AntiHBc",l:"Anti-HBc total",c:"906221",g:"ser",txt:["No reactivo","Reactivo"]},
 {k:"AntiVHC",l:"Anti-VHC",c:"906225",g:"ser",txt:["Negativo","Positivo"]},{k:"VHA",l:"Hepatitis A anticuerpos totales",c:"906219",g:"ser",txt:["No reactivo","Reactivo"]},
 {k:"Toxo",l:"Toxoplasma IgG",c:"906127",g:"ser",txt:["No reactiva","Reactiva"]},{k:"CrAg",l:"Antígeno de criptococo",c:"906314",g:"ser",txt:["Negativo","Positivo"]},{k:"Histo",l:"Antígeno de Histoplasma",c:"906337",g:"ser",txt:["Negativo","Positivo"]},
 {k:"IGRA",l:"IGRA",c:"",g:"tb",txt:["Negativo","Positivo","Indeterminado"]},
 {k:"HLAB5701",l:"HLA-B*5701",c:"",g:"oth",txt:["Negativo","Positivo"],nota:"Corregido: las guías decían HLA-B27 (906517); antes de abacavir se tamiza HLA-B*5701 (GPC 2021, rec. 41). CUPS por confirmar"},
 {k:"GENO",l:"Genotipo VIH",c:"908802",g:"oth",txt:["Sin mutaciones relevantes","Con mutaciones de resistencia"]}
];
/* vih.js:63 */
const VXE=Object.fromEntries(VX_EX.map(e=>[e.k,e]));
/* vih.js:65 */
const VX_CONTRATO_DEF={
 "NUEVA EPS":{fuente:"Guía rápida laboratorios NUEVA EPS (adjunta)",items:[
  ["CV","S","Cada seis meses",""],["CD4","S","Cada seis meses",""],["CT","S","Cada seis meses",""],["LDL","S","Cada seis meses",""],["HDL","S","Cada seis meses",""],["TG","S","Cada seis meses",""],["Cr","S","Cada seis meses",""],["UA","S","Cada seis meses",""],["FA","S","Cada seis meses",""],["AST","S","Cada seis meses",""],["ALT","S","Cada seis meses",""],["Hb","S","Cada seis meses (hemograma)",""],["Glu","S","Cada seis meses","Agregada: la exige el indicador CAC 16 (corrección sobre la guía)"],
  ["TSH","A","Cada año",""],["VDRL","A","Cada año","Si es positiva, seguimiento cada 6 meses"],["VHA","I","Solo al ingreso si no tiene previa","Si es negativa, vacunar"],["AntiVHC","A","Cada año","Si es positiva, solicitar carga viral"],["AntiHBs","A","Cada año","Menor de 100: seguimiento con HBsAg; menor de 10: vacunar"],["AntiHBc","A","Cada año solo si no tiene anticuerpos protectores",""],["HBsAg","A","Cada año solo si no tiene anticuerpos protectores",""],
  ["PPD","A","Cada año si el resultado previo es negativo","Antecedente de TB: no se toma"],["CITANAL","A","Cada año","Hombres que tienen sexo con hombres"],["CITCV","A","Cada año","Mujeres en edad reproductiva"],
  ["Toxo","N","Si CD4 menor de 200",""],["CrAg","N","Tomar a todos si CD4 menor de 100",""],["Histo","N","Tomar a todos si CD4 menor de 50",""],["BT","N","Al ingreso y al usar atazanavir",""],["GENO","N","Solo por orden de infectología",""],["HLAB5701","N","Antes de iniciar abacavir","Corregido: la guía decía HLA-B27 (906517)"]]},
 "FAMILIAR DE COLOMBIA":{fuente:"Guía rápida laboratorios EPS Familiar de Colombia (adjunta; título de las hojas corregido en el sistema)",items:[
  ["CV","S","Cada seis meses",""],["CD4","S","Cada seis meses",""],["CT","S","Cada seis meses",""],["LDL","S","Cada seis meses",""],["HDL","S","Cada seis meses",""],["TG","S","Cada seis meses",""],["Cr","S","Cada seis meses",""],["UA","S","Cada seis meses",""],["FA","S","Cada seis meses",""],["AST","S","Cada seis meses",""],["ALT","S","Cada seis meses",""],["Hb","S","Cada seis meses (hemograma)",""],["Glu","S","Cada seis meses","Agregada: la exige el indicador CAC 16 (corrección sobre la guía)"],
  ["TSH","A","Cada año",""],["VDRL","A","Cada año","Si es positiva, seguimiento cada 6 meses"],["VHA","I","Solo al ingreso si no tiene previa","Si es negativa, vacunar"],["AntiVHC","A","Cada año","Si es positiva, solicitar carga viral"],["AntiHBs","A","Cada año","Menor de 100: seguimiento con HBsAg; menor de 10: vacunar"],["AntiHBc","A","Cada año solo si no tiene anticuerpos protectores",""],["HBsAg","A","Cada año solo si no tiene anticuerpos protectores",""],
  ["PPD","A","Cada año si el resultado previo es negativo","Antecedente de TB: no se toma"],["CITANAL","A","Cada año","Hombres que tienen sexo con hombres"],["CITCV","A","Cada año","Mujeres en edad reproductiva"],
  ["Toxo","N","Si CD4 menor de 200",""],["CrAg","N","Tomar a todos si CD4 menor de 100",""],["Histo","N","Tomar a todos si CD4 menor de 50",""],["BT","N","Según necesidad",""],["HbA1c","N","Según necesidad","Corregido: la guía repetía el CUPS 903862 de proteínas en orina de 24 h; CUPS de HbA1c por confirmar"],["HLAB5701","N","Antes de iniciar abacavir","Corregido: la guía decía HLA-B27 (906517)"]]}
};
/* vih.js:78 */
const VX_GUIA_DIF={soloNueva:["Amilasa (903805)","Citomegalovirus IgG e IgM (906205, 906206)","Coprológico por concentración (907003)","Creatina (903822)","Proteínas diferenciadas y totales (903861, 903863)","Genotipo VIH (908802), solo por infectología","Antígeno e de hepatitis B (906318)","Anticuerpos hepatitis delta (906226)","Osteodensitometría por absorción dual (886012)"],soloFamiliar:["Sodio (903864)","Microalbuminuria (903026)","Hemoglobina glicosilada (la guía repetía el CUPS 903862: corregido, CUPS por confirmar)","Osteodensitometría por TC (886011)"]};
/* vih.js:80 */
const VX_MED={TDF:["Tenofovir disoproxil","ITIAN"],TAF:["Tenofovir alafenamida","ITIAN"],"3TC":["Lamivudina","ITIAN"],FTC:["Emtricitabina","ITIAN"],ABC:["Abacavir","ITIAN"],AZT:["Zidovudina","ITIAN"],EFV:["Efavirenz","ITINN"],NVP:["Nevirapina","ITINN"],RPV:["Rilpivirina","ITINN"],DOR:["Doravirina","ITINN"],ETR:["Etravirina","ITINN"],DTG:["Dolutegravir","INI"],BIC:["Bictegravir","INI"],RAL:["Raltegravir","INI"],EVG:["Elvitegravir","INI"],CAB:["Cabotegravir","INI"],DRV:["Darunavir","IP"],ATV:["Atazanavir","IP"],LPV:["Lopinavir","IP"],RTV:["Ritonavir","Potenciador"],COBI:["Cobicistat","Potenciador"]};
/* vih.js:81 */
const VX_CLASES=[["INI","Inhibidores de integrasa"],["ITIAN","Inhibidores nucleósidos de transcriptasa reversa"],["ITINN","Inhibidores no nucleósidos de transcriptasa reversa"],["IP","Inhibidores de proteasa"],["Potenciador","Potenciadores farmacocinéticos"]];
/* vih.js:82 */
const VX_ESQ=[
 {n:"TDF/3TC/DTG",c:["TDF","3TC","DTG"],it:[["Tenofovir disoproxil/lamivudina/dolutegravir 300/300/50 mg tableta",1]]},
 {n:"BIC/FTC/TAF",c:["BIC","FTC","TAF"],it:[["Bictegravir/emtricitabina/tenofovir alafenamida 50/200/25 mg tableta",1]]},
 {n:"ABC/3TC/DTG",c:["ABC","3TC","DTG"],it:[["Abacavir/lamivudina/dolutegravir 600/300/50 mg tableta",1]]},
 {n:"DTG/3TC",c:["DTG","3TC"],it:[["Dolutegravir/lamivudina 50/300 mg tableta",1]]},
 {n:"DTG + TAF/FTC",c:["DTG","TAF","FTC"],it:[["Dolutegravir 50 mg tableta",1],["Tenofovir alafenamida/emtricitabina 25/200 mg tableta",1]]},
 {n:"DTG + TDF/FTC",c:["DTG","TDF","FTC"],it:[["Dolutegravir 50 mg tableta",1],["Tenofovir disoproxil/emtricitabina 300/200 mg tableta",1]]},
 {n:"DTG + ABC/3TC",c:["DTG","ABC","3TC"],it:[["Dolutegravir 50 mg tableta",1],["Abacavir/lamivudina 600/300 mg tableta",1]]},
 {n:"EFV/3TC/TDF",c:["EFV","3TC","TDF"],it:[["Efavirenz/lamivudina/tenofovir disoproxil 600/300/300 mg tableta",1]]},
 {n:"EVG/c/FTC/TAF",c:["EVG","COBI","FTC","TAF"],it:[["Elvitegravir/cobicistat/emtricitabina/tenofovir alafenamida 150/150/200/10 mg tableta",1]]},
 {n:"RAL + TDF/FTC",c:["RAL","TDF","FTC"],it:[["Raltegravir 400 mg tableta",2],["Tenofovir disoproxil/emtricitabina 300/200 mg tableta",1]]},
 {n:"RAL + ABC/3TC",c:["RAL","ABC","3TC"],it:[["Raltegravir 400 mg tableta",2],["Abacavir/lamivudina 600/300 mg tableta",1]]},
 {n:"DRV/c + TDF/FTC",c:["DRV","COBI","TDF","FTC"],it:[["Darunavir/cobicistat 800/150 mg tableta",1],["Tenofovir disoproxil/emtricitabina 300/200 mg tableta",1]]},
 {n:"DRV/r + DTG",c:["DRV","RTV","DTG"],it:[["Darunavir 800 mg tableta",1],["Ritonavir 100 mg tableta",1],["Dolutegravir 50 mg tableta",1]]},
 {n:"ATV/r + TDF/FTC",c:["ATV","RTV","TDF","FTC"],it:[["Atazanavir 300 mg cápsula",1],["Ritonavir 100 mg tableta",1],["Tenofovir disoproxil/emtricitabina 300/200 mg tableta",1]]},
 {n:"LPV/r + AZT/3TC",c:["LPV","RTV","AZT","3TC"],it:[["Lopinavir/ritonavir 200/50 mg tableta",4],["Zidovudina/lamivudina 300/150 mg tableta",2]]},
 {n:"Esquema sin especificar (importado)",c:[],it:[]}];
/* vih.js:99 */
const VXQ=Object.fromEntries(VX_ESQ.map(e=>[e.n,e]));
/* vih.js:102 */
const VX_GPC_PREF=["DTG + TAF/FTC","DTG + TDF/FTC","ABC/3TC/DTG","DTG + ABC/3TC","DTG/3TC","BIC/FTC/TAF","RAL + TDF/FTC","RAL + ABC/3TC","EVG/c/FTC/TAF"];
/* vih.js:104 */
const VX_VAC=[
 {k:"VHB",l:"Hepatitis B",n:3,nota:"Esquema de 3 dosis; anti-HBs posvacunal. Excluye anti-HBs de 10 o más y coinfección."},
 {k:"VHA",l:"Hepatitis A",n:2,nota:"Si anticuerpos totales no reactivos."},
 {k:"NEUC",l:"Neumococo conjugada",n:1,nota:""},{k:"NEUP",l:"Neumococo polisacárida 23",n:1,nota:"Después de la conjugada (intervalo por confirmar)."},
 {k:"INF",l:"Influenza",n:0,nota:"Una dosis anual."},{k:"VPH",l:"VPH",n:3,ed:[9,26],nota:"Tres dosis en inmunocomprometidos; rango de edad usado: 9 a 26 años (por confirmar)."},
 {k:"TD",l:"Td / Tdap",n:1,dias:3650,nota:"Refuerzo cada 10 años."},{k:"COV",l:"COVID-19",n:1,nota:"Según lineamiento vigente."},
 {k:"FA",l:"Fiebre amarilla",n:1,viva:true,opc:true,nota:"Vacuna viva: contraindicada con CD4 menor de 200."},{k:"SRP",l:"Triple viral (SRP)",n:1,viva:true,opc:true,nota:"Vacuna viva: contraindicada con CD4 menor de 200."}];
/* vih.js:111 */
const VXV=Object.fromEntries(VX_VAC.map(v=>[v.k,v]));
/* vih.js:112 */
const VX_VACEST=["Aplicada","Antecedente con soporte","Antecedente sin soporte","Contraindicada","Rechazada"];
/* vih.js:115 */
const vxLive=r=>r.Anulado!=="SI";
/* vih.js:116 */
const vxD=v=>v instanceof Date?v:pdate(v);
/* vih.js:117 */
const vxNom=p=>p?[p.PrimerNombre,p.SegundoNombre,p.PrimerApellido,p.SegundoApellido].filter(x=>x&&x!=="NONE").join(" "):"";
/* vih.js:119 */
const vxCorte=()=>VX.corte||(VX.corte=monthEnd(addMonths(TODAY(),-1)));
/* vih.js:120 */
const vxMunCode=n=>{const k=VX_MUN_ALIAS[norm(n)]||n;const m=VX_MUN.find(x=>norm(x[1])===norm(k));return m?m[0]:"";};
/* vih.js:121 */
const vxMunName=c=>{const m=VX_MUN.find(x=>x[0]===String(c).trim());return m?m[1]:"";};
/* vih.js:122 */
const vxCfg=(k,d)=>{const r=VX.book&&VX.book.cfg.find(x=>x.Clave===k);if(!r)return d;try{return JSON.parse(r.Valor);}catch(e){return r.Valor;}};
/* vih.js:124 */
function vxNewBook(){const b={};VXK.forEach(k=>b[k]=[]);return b;}
/* vih.js:131 */
const vxEdad=(p,at)=>{const n=vxD(p.FechaNac);if(!n)return null;const d=at||TODAY();let a=d.getFullYear()-n.getFullYear();if(d.getMonth()<n.getMonth()||(d.getMonth()===n.getMonth()&&d.getDate()<n.getDate()))a--;return a;};
/* vih.js:132 */
const vxGrupoEtario=a=>a==null?"Sin dato":a<15?"Menor de 15":a<20?"15 a 19":a<30?"20 a 29":a<40?"30 a 39":a<50?"40 a 49":a<60?"50 a 59":"60 y más";
/* vih.js:133 */
const vxF=(v,n)=>v==null||v===""||isNaN(v)?"":Number(v).toLocaleString("es-CO",{maximumFractionDigits:n==null?2:n});
/* vih.js:134 */
const vxPct=(a,b)=>b?a/b*100:null;
/* vih.js:137 */
function vxIdx(){if(VX.memo.idx)return VX.memo.idx;const I={pac:new Map(),lab:{},tar:{},ent:{},cit:{},val:{},vac:{},prc:{},prf:{},nov:{},ant:{},sol:{},cac:{}};
 if(!VX.book)return I;VX.book.pac.filter(vxLive).forEach(p=>I.pac.set(p.ID,p));
 const push=(k,key,r)=>{(I[k][r.Paciente]=I[k][r.Paciente]||[]).push(r);};
 VX.book.lab.filter(vxLive).forEach(r=>{r._d=vxD(r.FechaToma);push("lab",0,r);});
 ["tar","ent","cit","val","vac","prc","prf","nov","sol"].forEach(k=>VX.book[k].filter(vxLive).forEach(r=>push(k,0,r)));
 VX.book.ant.forEach(r=>push("ant",0,r));VX.book.cac.forEach(r=>{I.cac[r.Paciente]=r;});
 Object.values(I.lab).forEach(L=>L.sort((a,b)=>(a._d||0)-(b._d||0)));
 ["tar","ent","cit","val","vac","prc","prf","nov","ant"].forEach(k=>Object.values(I[k]).forEach(L=>L.sort((a,b)=>String(a.Inicio||a.Fecha||a.Ordenado||"").localeCompare(String(b.Inicio||b.Fecha||b.Ordenado||"")))));
 return VX.memo.idx=I;}
/* vih.js:146 */
const vxPacs=()=>VX.book?VX.book.pac.filter(vxLive):[];
/* vih.js:147 */
const vxP=id=>vxIdx().pac.get(id);
/* vih.js:148 */
const vxL=(id,k)=>(vxIdx()[k][id]||[]);
/* vih.js:150 */
function vxLast(pid,ex,upto,from){const L=vxL(pid,"lab");for(let i=L.length-1;i>=0;i--){const r=L[i];if(r.Examen!==ex||!r._d)continue;if(upto&&r._d>upto)continue;if(from&&r._d<from)return null;return r;}return null;}
/* vih.js:151 */
function vxFirst(pid,ex,from,upto){const L=vxL(pid,"lab");for(const r of L){if(r.Examen!==ex||!r._d)continue;if(from&&r._d<from)continue;if(upto&&r._d>upto)return null;return r;}return null;}
/* vih.js:152 */
const vxVal=r=>r?num(r.Valor):null;
/* vih.js:153 */
const vxPos=r=>!!r&&/^(Reactiv|Positiv|Con mutac|Detectable)/i.test(String(r.Resultado||""));
/* vih.js:154 */
const vxCVind=r=>{if(!r)return null;const v=num(r.Valor);if(v!=null)return v<50;const t=String(r.Resultado||"");if(/indetect|no detect|menor de 50|<\s*50|<\s*20/i.test(t))return true;if(/detect/i.test(t))return false;return null;};
/* vih.js:155 */
const vxFmtLab=r=>{if(!r)return"";const e=VXE[r.Examen]||{};const v=num(r.Valor);return(v!=null?vxF(v,e.k==="CV"?0:2)+(e.u?" "+e.u:""):"")+(r.Resultado?(v!=null?" · ":"")+r.Resultado:"");};
/* vih.js:158 */
function vxPeriodo(corte){const c=corte||vxCorte();const ini=VX.ui.pini?pdate(VX.ui.pini):addDays(addMonths(c,-12),1);return{c,ini,w6:addMonths(c,-6),w12:addMonths(c,-12)};}
/* vih.js:159 */
function vxActivo(p,c){const ing=vxD(p.FechaIngresoIPS)||vxD(p.FechaDx);if(ing&&ing>c)return false;const eg=vxD(p.FechaEgreso);if(p.Estado&&p.Estado!=="Activo"&&(!eg||eg<=c))return false;return true;}
/* vih.js:160 */
function vxTarAt(pid,c){return vxL(pid,"tar").filter(t=>{const i=vxD(t.Inicio),f=vxD(t.Fin);return i&&i<=c&&(!f||f>c);}).pop()||null;}
/* vih.js:161 */
function vxTarIni(pid){const L=vxL(pid,"tar").map(t=>vxD(t.Inicio)).filter(Boolean).sort((a,b)=>a-b);return L[0]||null;}
/* vih.js:162 */
function vxUltEnt(pid,c){return vxL(pid,"ent").filter(e=>{const d=vxD(e.Fecha);return d&&d<=c;}).pop()||null;}
/* vih.js:163 */
function vxCobertura(e){const d=vxD(e.Fecha);return d?addDays(d,Math.round((num(e.Meses)||1)*30)):null;}
/* vih.js:164 */
function vxUltAtencion(pid,c){const L=vxL(pid,"cit").filter(x=>x.Estado==="Asistió"&&vxD(x.Fecha)&&vxD(x.Fecha)<=c).map(x=>vxD(x.Fecha));const p=vxP(pid);const ext=p&&vxD(p.UltAtencionExt);if(ext&&ext<=c)L.push(ext);return L.sort((a,b)=>a-b).pop()||null;}
/* vih.js:165 */
function vxNovAt(pid,tipoRe,c,from){return vxL(pid,"nov").filter(n=>{const d=vxD(n.Fecha);return tipoRe.test(n.Tipo)&&d&&d<=c&&(!from||d>=from);});}
/* vih.js:166 */
function vxSt(p,corte){const c=corte||vxCorte();const key=p.ID+"|"+iso(c);if(VX.memo[key])return VX.memo[key];const P=vxPeriodo(c);const id=p.ID;
 const s={p,id,c,edad:vxEdad(p,c),activo:vxActivo(p,c),expuesto:p.TipoIngreso==="Menor expuesto en seguimiento"};
 s.dx=vxD(p.FechaDx);s.ing=vxD(p.FechaIngresoIPS);
 s.incidente=!!(s.dx&&s.dx>=P.ini&&s.dx<=c&&(!p.TipoIngreso||p.TipoIngreso==="Nuevo diagnóstico"));
 s.cv=vxLast(id,"CV",c);s.cd4=vxLast(id,"CD4",c);s.cv6=s.cv&&s.cv._d>=P.w6?s.cv:null;s.cd46=s.cd4&&s.cd4._d>=P.w6?s.cd4:null;
 s.cvInd=vxCVind(s.cv6);s.cd4v=vxVal(s.cd4);
 s.tar=vxTarAt(id,c);s.tarIni=vxTarIni(id);s.recibeTAR=!!s.tar;s.semTAR=s.tarIni?Math.floor(dayDiff(s.tarIni,c)/7):null;
 s.ent=vxUltEnt(id,c);s.cob=s.ent?vxCobertura(s.ent):null;
 s.sinEnt6=!!(s.tarIni&&s.tarIni<=addMonths(c,-6)&&(!s.ent||vxD(s.ent.Fecha)<addMonths(c,-6)));
 s.ultAt=vxUltAtencion(id,c);
 const cd4dx=s.dx?vxFirst(id,"CD4",addMonths(s.dx,-3),addMonths(s.dx,3)):null;s.cd4dx=cd4dx;
 const cvdx=s.dx?vxFirst(id,"CV",addMonths(s.dx,-3),addMonths(s.dx,3)):null;s.cvdx=cvdx;
 s.oport=String(p.OportunistaDx||"")==="SI";
 s.estIni=s.oport?3:cd4dx?(vxVal(cd4dx)<200?3:vxVal(cd4dx)<500?2:1):4;
 const e2=s.cd4v==null?4:s.cd4v<200?3:s.cd4v<500?2:1;s.estAct=s.estIni===4?e2:e2===4?4:Math.max(s.estIni,e2);
 s.gest=String(p.Gestante||"")==="SI";
 s.tbAct=vxNovAt(id,/^Tuberculosis activa/,c).filter(n=>!vxD(n.FechaFin)||vxD(n.FechaFin)>c).length>0;
 s.tbAlgunaVez=vxNovAt(id,/^Tuberculosis activa/,c).length>0||/TB|tuberculosis/i.test(((vxL(id,"ant").slice(-1)[0])||{}).TB||"")&&!/niega/i.test(((vxL(id,"ant").slice(-1)[0])||{}).TB||"");
 s.vhb=vxNovAt(id,/hepatitis B/,c).length>0||vxPos(vxLast(id,"HBsAg",c));s.vhc=vxNovAt(id,/hepatitis C/,c).length>0;
 const val=vxL(id,"val").filter(v=>vxD(v.Fecha)&&vxD(v.Fecha)<=c);s.val=val;s.lastVal=val[val.length-1]||null;
 s.smaq=val.filter(v=>v.SMAQ&&vxD(v.Fecha)>=P.w6).pop()||null;
 s.rcv=val.filter(v=>(v.RCV||v.RCVCat)&&vxD(v.Fecha)>=P.ini).pop()||null;
 s.ppd=vxL(id,"prc").filter(x=>x.Tipo==="Tuberculina (PPD)"&&x.Estado==="Leída"&&vxD(x.FechaLectura||x.Fecha)<=c).pop()||null;
 s.igra=vxLast(id,"IGRA",c);
 s.disc=new Set(vxL(id,"cit").filter(x=>x.Estado==="Asistió"&&vxD(x.Fecha)>=P.ini&&vxD(x.Fecha)<=c).map(x=>x.Disciplina));
 return VX.memo[key]=s;}
/* vih.js:194 */
function vxVacEstado(p,c){c=c||TODAY();const id=p.ID;const st=vxSt(p,vxCorte());const L=vxL(id,"vac").filter(v=>vxD(v.Fecha)&&vxD(v.Fecha)<=c||!v.Fecha);const ed=vxEdad(p,c);const cd4=st.cd4v;
 const ahbs=vxVal(vxLast(id,"AntiHBs",c));const vha=vxLast(id,"VHA",c);
 return VX_VAC.map(v=>{const D=L.filter(x=>x.Vacuna===v.k&&["Aplicada","Antecedente con soporte"].includes(x.Estado));const ss=L.filter(x=>x.Vacuna===v.k&&x.Estado==="Antecedente sin soporte");const ci=L.some(x=>x.Vacuna===v.k&&x.Estado==="Contraindicada"),re=L.some(x=>x.Vacuna===v.k&&x.Estado==="Rechazada");
  let est,cls,acc="";
  if(v.k==="VHB"&&ahbs!=null&&ahbs>=10){est="Inmune (anti-HBs "+vxF(ahbs,1)+")";cls="ok";}
  else if(v.k==="VHB"&&st.vhb){est="No aplica (coinfección)";cls="base";}
  else if(v.k==="VHA"&&vxPos(vha)){est="Inmune (anticuerpos reactivos)";cls="ok";}
  else if(v.k==="VPH"&&(ed==null||ed<v.ed[0]||ed>v.ed[1])){est="Fuera del rango de edad";cls="base";}
  else if(v.n===0){const u=D.filter(x=>vxD(x.Fecha)>=addMonths(c,-12)).length;est=u?"Al día (último año)":"Pendiente este año";cls=u?"ok":"warn";if(!u)acc="Aplicar";}
  else if(v.dias){const u=D.filter(x=>vxD(x.Fecha)>=addDays(c,-v.dias)).length;est=u?"Vigente":"Sin refuerzo vigente";cls=u?"ok":"warn";if(!u)acc="Aplicar refuerzo";}
  else if(D.length>=v.n){est="Completo ("+D.length+"/"+v.n+")";cls="ok";}
  else{est=(D.length?"Incompleto ("+D.length+"/"+v.n+")":"Sin dosis documentadas")+(ss.length?" · "+ss.length+" sin soporte":"");cls=v.opc?"base":"warn";acc=v.opc?"Valorar indicación":"Aplicar dosis "+(D.length+1);}
  if(v.viva&&cd4!=null&&cd4<200&&!/Completo|Inmune/.test(est)){est+=" · contraindicada hoy (CD4 menor de 200)";cls="bad";acc="";}
  if(ci){est="Contraindicada (registro)";cls="base";acc="";}if(re&&cls==="warn"){est+=" · rechazada";}
  return{v,D,est,cls,acc,ss};});}
/* vih.js:209 */
const vxVacCompleta=(p,keys,c)=>{const E=vxVacEstado(p,c);return keys.every(k=>{const e=E.find(x=>x.v.k===k);return e&&(e.cls==="ok"||/Fuera del rango|No aplica/.test(e.est));});};
/* vih.js:212 */
const vxContrato=eps=>{const C=vxCfg("contrato",VX_CONTRATO_DEF);return C[eps]||C["NUEVA EPS"];};
/* vih.js:214 */
const vxHSH=p=>/^1\./.test(p.PoblacionClave||"")||(/^4\./.test(p.PoblacionClave||"")&&!String(p.Sexo).startsWith("F"));
/* vih.js:215 */
const vxSolRecs=mes=>VX.book?VX.book.sol.filter(vxLive).filter(r=>r.Mes===mes):[];
/* vih.js:217 */
const vxSolTieneRes=r=>{const L=vxL(r.Paciente,"lab");const ms=pdate(r.Mes+"-01");return L.some(l=>l.Examen===r.Examen&&l._d&&l._d>=addMonths(ms,-1));};
/* vih.js:220 */
function vxAlertas(p,c){c=c||vxCorte();const s=vxSt(p,c);if(!s.activo)return{nivel:"—",L:[]};if(s.expuesto)return{nivel:"amarilla",L:[{n:"amarilla",t:"Menor expuesto en seguimiento: definir condición frente al VIH (no entra en los indicadores de PVV)",k:"clin"}]};const L=[];const R=(t,k)=>L.push({n:"roja",t,k}),A=(t,k)=>L.push({n:"amarilla",t,k});const P=vxPeriodo(c);
 if(!s.recibeTAR)R("Sin TAR registrada al corte","clin");
 if(s.cv6&&num(s.cv6.Valor)!=null&&num(s.cv6.Valor)>=200)R("Carga viral detectable ("+vxF(num(s.cv6.Valor),0)+" copias/mL)","clin");
 if(!s.cv6)R(s.cv?"Carga viral vencida (última "+iso(s.cv._d)+")":"Sin carga viral registrada","dato");
 if(!s.cd46)R(s.cd4?"CD4 vencido (último "+iso(s.cd4._d)+")":"Sin CD4 registrado","dato");
 if(s.cd4v!=null&&s.cd4v<200)R("CD4 menor de 200 ("+s.cd4v+")","clin");
 const ua=s.ultAt;const sinReg=s.tarIni&&!vxL(p.ID,"ent").length;if(sinReg&&s.tarIni<=addMonths(c,-2))A("Sin entregas de TAR registradas en el libro: no se puede evaluar abandono","dato");if((s.sinEnt6&&!sinReg)||(s.cob&&dayDiff(s.cob,c)>90)||(ua&&dayDiff(ua,c)>120))R("Sospecha de abandono"+(s.cob?" · cobertura TAR hasta "+iso(s.cob):"")+(ua?" · última atención "+iso(ua):""),"clin");
 if(s.gest)R("Gestante con VIH","clin");if(s.tbAct)R("Tuberculosis activa","clin");
 if(s.recibeTAR&&s.cob&&s.cob<=addDays(TODAY(),7)&&!vxL(p.ID,"cit").some(x=>x.Estado==="Programada"&&vxD(x.Fecha)>=TODAY()))R("Riesgo de desabastecimiento de TAR (cobertura "+iso(s.cob)+", sin cita)","clin");
 const crit=["FechaDx","FechaIngresoIPS","PoblacionClave","CodMunicipio","Regimen","EPS","Documento"].filter(f=>!p[f]);if(crit.length)R("Pendiente crítico para CAC: "+crit.join(", "),"dato");
 if(s.cv6&&s.cv6._d<addMonths(c,-5))A("Carga viral vence en menos de 30 días","dato");if(s.cd46&&s.cd46._d<addMonths(c,-5))A("CD4 vence en menos de 30 días","dato");
 const tz=[];if(!vxLast(p.ID,"VDRL",c,P.w12))tz.push("sífilis");if(!vxLast(p.ID,"AntiVHC",c,P.w12)&&!s.vhc)tz.push("hepatitis C");const ah=vxVal(vxLast(p.ID,"AntiHBs",c));if(ah==null&&!vxLast(p.ID,"HBsAg",c))tz.push("hepatitis B");if(!s.tbAlgunaVez&&!(s.ppd&&vxD(s.ppd.FechaLectura||s.ppd.Fecha)>=P.w12)&&!vxLast(p.ID,"IGRA",c,P.w12)&&!(s.ppd&&/Positiva/.test(s.ppd.Resultado)))tz.push("TB latente");if(tz.length)A("Tamizajes incompletos: "+tz.join(", "),"dato");
 const vi=vxVacEstado(p,c).filter(e=>e.cls==="warn").map(e=>e.v.l);if(vi.length)A("Vacunación incompleta: "+vi.slice(0,4).join(", ")+(vi.length>4?" y "+(vi.length-4)+" más":""),"dato");
 const falt=["Psicología","Trabajo social","Nutrición"].filter(d=>!s.disc.has(d));if(falt.length===3)A("Sin valoración multidisciplinaria en 12 meses","dato");
 if(s.smaq&&s.smaq.SMAQ==="No adherente")A("Adherencia irregular (SMAQ no adherente "+s.smaq.Fecha+")","clin");
 if(s.tar&&!s.tar.Validacion)A("TAR sin validación de seguridad","dato");if(s.tarIni&&!p.TARPrevio)A("TAR previo sin documentar","dato");
 if(s.edad>=40&&!s.rcv)A("Riesgo cardiovascular no calculado en el periodo","dato");
 if(!vxLast(p.ID,"Cr",c,P.w6))A("TFG no calculada (sin creatinina en 6 meses)","dato");
 const ldl=vxVal(vxLast(p.ID,"LDL",c,P.w12)),tg=vxVal(vxLast(p.ID,"TG",c,P.w12));if((ldl!=null&&ldl>=160)||(tg!=null&&tg>=500))A("Perfil lipídico alterado (LDL "+(ldl==null?"—":ldl)+", TG "+(tg==null?"—":tg)+"): verificar plan","clin");
 return{nivel:L.some(x=>x.n==="roja")?"roja":L.length?"amarilla":"verde",L};}
/* vih.js:242 */
function vxTFG(cr,edad,sexo){if(cr==null||edad==null)return null;const f=String(sexo||"").startsWith("F");const k=f?0.7:0.9,a=f?-0.241:-0.302;const x=cr/k;return 142*Math.pow(Math.min(x,1),a)*Math.pow(Math.max(x,1),-1.2)*Math.pow(0.9938,edad)*(f?1.012:1);}
/* vih.js:246 */
const VX_GPC14=["DTG + TDF/FTC","DTG + ABC/3TC","ABC/3TC/DTG","RAL + TDF/FTC","RAL + ABC/3TC","ATV/r + TDF/FTC","DRV/c + TDF/FTC"];
/* vih.js:247 */
const vxEnRango=(d,a,b)=>!!d&&d>=a&&d<=b;
/* vih.js:248 */
const vxLabIn=(id,k,a,b)=>vxL(id,"lab").some(r=>r.Examen===k&&vxEnRango(r._d,a,b));
/* vih.js:249 */
const vxPrcIn=(id,re,a,b)=>vxL(id,"prc").some(x=>re.test(x.Tipo)&&x.Estado!=="Ordenado"&&vxEnRango(vxD(x.FechaLectura||x.Fecha),a,b));
/* vih.js:250 */
const vxPrfIn=(id,re,a,b)=>vxL(id,"prf").some(x=>re.test(x.Medicamento)&&vxD(x.Inicio)&&vxD(x.Inicio)<=b&&(!vxD(x.Fin)||vxD(x.Fin)>=a));
/* vih.js:251 */
const vxHospVIH=(id,a,b)=>vxL(id,"nov").filter(n=>/^Hospitalización por causa VIH/.test(n.Tipo)&&vxEnRango(vxD(n.Fecha),a,b));
/* vih.js:252 */
function vxFalla(id,a,b){if(vxL(id,"nov").some(n=>n.Tipo==="Falla virológica"&&vxEnRango(vxD(n.Fecha),a,b)))return true;const C=vxL(id,"lab").filter(r=>r.Examen==="CV"&&vxEnRango(r._d,a,b)&&num(r.Valor)!=null);for(let i=1;i<C.length;i++)if(num(C[i].Valor)>200&&num(C[i-1].Valor)>200)return true;return false;}
/* vih.js:253 */
const vxR=(ok,d,falta)=>({ok:!!ok,d:d||"",falta:!!falta});
/* vih.js:254 */
const vxUP=(a,m,strict)=>({t:"up",a,m,strict}),vxDOWN=(a,m)=>({t:"down",a,m}),vxLB={t:"lb"};
/* vih.js:255 */
const vxSemRng=(jun,dic)=>c=>c.getMonth()<6?jun:dic;
/* vih.js:256 */
const VX_IND=[
 /* ---- CAC: consenso basado en la evidencia, actualización 2023 (Tabla 1) ---- */
 {id:"CAC-04",set:"cac",dom:"Binomio madre-hijo",n:"TAR en gestantes que viven con el VIH",nd:"Gestantes con VIH en TAR según GPC (rec. 14) / gestantes con VIH",rng:vxUP(100,95),f:s=>!s.gest?null:vxR(s.tar&&VX_GPC14.includes(s.tar.Esquema),s.tar?s.tar.Esquema:"Sin TAR",!s.tar)},
 {id:"CAC-05",set:"cac",dom:"Diagnóstico",n:"Detección con CD4 mayor de 350 en casos incidentes",nd:"Incidentes con CD4 al diagnóstico (±3 meses) mayor de 350 / incidentes del periodo",rng:vxLB,f:s=>!s.incidente?null:s.edad!=null&&s.edad<1?{x:"Menor de 6 meses"}:vxR(s.cd4dx&&vxVal(s.cd4dx)>350&&!s.oport,s.cd4dx?"CD4 "+vxVal(s.cd4dx)+(s.oport?" · oportunista":""):"Sin CD4 al diagnóstico",!s.cd4dx)},
 {id:"CAC-06",set:"cac",dom:"Seguimiento",n:"Atención por infectología en el periodo",nd:"PVV con al menos una atención por infectología / PVV reportadas",rng:vxLB,f:s=>vxR(s.disc.has("Infectología"),s.disc.has("Infectología")?"":"Sin infectología en el periodo")},
 {id:"CAC-07",set:"cac",dom:"Seguimiento",n:"Retención en la atención",nd:"Infectólogo o médico experto + CD4 y CV en 6 meses + TAR al corte / PVV",rng:vxUP(95,90),f:s=>{const m=s.disc.has("Infectología")||s.disc.has("Medicina experta VIH");const f=[!m&&"sin médico",!s.cv6&&"sin CV",!s.cd46&&"sin CD4",!s.recibeTAR&&"sin TAR"].filter(Boolean);return vxR(!f.length,f.join(", "),!s.cv6||!s.cd46);}},
 {id:"CAC-08",set:"cac",dom:"Seguimiento",n:"Tamización de TB latente",nd:"PVV con PPD o IGRA en el periodo / PVV (excluye PPD o IGRA positiva previa y TB)",rng:vxUP(80,50),f:(s,P)=>{const prevPos=vxL(s.id,"prc").some(x=>x.Tipo==="Tuberculina (PPD)"&&/Positiva/.test(x.Resultado||"")&&vxD(x.FechaLectura||x.Fecha)<P.ini)||vxL(s.id,"lab").some(r=>r.Examen==="IGRA"&&vxPos(r)&&r._d<P.ini);if(prevPos)return{x:"PPD o IGRA positiva previa"};if(s.tbAlgunaVez)return{x:"TB activa actual o previa"};const ok=vxPrcIn(s.id,/PPD/,P.ini,P.c)||vxLabIn(s.id,"IGRA",P.ini,P.c);return vxR(ok,ok?"":"Sin PPD ni IGRA en el periodo",!ok);}},
 {id:"CAC-09",set:"cac",dom:"Seguimiento",n:"CD4 y carga viral en los últimos 6 meses",nd:"PVV con CD4 y CV en los 6 meses previos al corte / PVV",rng:vxUP(95,90),f:s=>vxR(s.cv6&&s.cd46,[!s.cv6&&"sin CV",!s.cd46&&"sin CD4"].filter(Boolean).join(", "),!(s.cv6&&s.cd46))},
 {id:"CAC-10",set:"cac",dom:"Seguimiento",n:"Tamización para sífilis en el periodo",nd:"PVV tamizadas para sífilis / PVV",rng:vxUP(95,90),f:(s,P)=>{const ok=vxLabIn(s.id,"VDRL",P.ini,P.c)||vxLabIn(s.id,"TREP",P.ini,P.c);return vxR(ok,ok?"":"Sin prueba de sífilis en el periodo",!ok);}},
 {id:"CAC-11",set:"cac",dom:"Seguimiento",n:"Valoración del riesgo cardiovascular",nd:"PVV de 40 años o más con RCV en el periodo / PVV de 40 años o más",rng:vxUP(95,85),f:(s,P)=>{if(s.edad==null||s.edad<40)return null;if(s.val.some(v=>v.RCVCat==="Alto"&&vxD(v.Fecha)<P.ini))return{x:"RCV alto en periodo anterior"};return vxR(!!s.rcv,s.rcv?(s.rcv.RCV?s.rcv.RCV+" %":"")+" "+(s.rcv.RCVCat||""):"Sin RCV en el periodo",!s.rcv);}},
 {id:"CAC-12",set:"cac",dom:"Seguimiento",n:"Indetectabilidad a las 48 semanas o más de TAR",nd:"PVV en TAR 48 semanas o más con CV menor de 50 (última en 6 meses, posterior a 48 semanas) / PVV en TAR 48 semanas o más",rng:vxUP(90,80),f:s=>{if(!s.recibeTAR||s.semTAR==null||s.semTAR<48)return null;const cv=s.cv6&&s.cv6._d>=addDays(s.tarIni,48*7)?s.cv6:null;return vxR(cv&&vxCVind(cv),cv?vxFmtLab(cv):"Sin CV válida en 6 meses",!cv);}},
 {id:"CAC-13",set:"cac",dom:"Seguimiento",n:"Genotipo en falla virológica",nd:"PVV con falla virológica y genotipo en el periodo / PVV con falla virológica",rng:vxUP(85,75),f:(s,P)=>!vxFalla(s.id,P.ini,P.c)?null:vxR(vxLabIn(s.id,"GENO",P.ini,P.c),"",false)},
 {id:"CAC-14",set:"cac",dom:"Seguimiento",n:"Profilaxis para Pneumocystis jirovecii",nd:"PVV con último CD4 menor de 200 con profilaxis / PVV con último CD4 menor de 200",rng:vxUP(95,90),f:(s,P)=>{if(s.cd4v==null||s.cd4v>=200)return null;if(s.recibeTAR&&s.cd4v>=100){const C=vxL(s.id,"lab").filter(r=>r.Examen==="CV"&&r._d<=P.c&&vxCVind(r)).slice(-2);if(C.length===2){const dd=dayDiff(C[0]._d,C[1]._d);if(dd>=90&&dd<=180)return{x:"Recuperación lenta con 2 CV indetectables"};}}return vxR(vxPrfIn(s.id,/Trimetoprim/,P.ini,P.c),"CD4 "+s.cd4v);}},
 {id:"CAC-15",set:"cac",dom:"Seguimiento",n:"Esquema completo de vacunación para hepatitis B",nd:"PVV con 3 dosis de VHB / PVV (excluye anti-HBs de 10 o más, coinfección y menos de 6 meses de diagnóstico)",rng:vxUP(95,90),f:(s,P)=>{const ah=vxVal(vxLast(s.id,"AntiHBs",P.c));if(ah!=null&&ah>=10)return{x:"Anti-HBs de 10 o más"};if(s.vhb)return{x:"Coinfección VHB"};if(s.dx&&s.dx>addMonths(P.c,-6))return{x:"Menos de 6 meses de diagnóstico"};const n=vxL(s.id,"vac").filter(v=>v.Vacuna==="VHB"&&["Aplicada","Antecedente con soporte"].includes(v.Estado)&&vxD(v.Fecha)<=P.c).length;return vxR(n>=3,n+" dosis");}},
 {id:"CAC-16",set:"cac",dom:"Seguimiento",n:"Seguimiento paraclínico en el periodo",nd:"Adultos: creatinina, glucemia y ALT en 6 meses y colesterol total en 12 / PVV",rng:vxUP(95,90),f:(s,P)=>{const ped=s.edad!=null&&s.edad<18;const need=ped?[["Cr",P.w6],["Glu",P.w6],["CT",P.w6],["ALT",P.w6],["Hb",P.w6]]:[["Cr",P.w6],["Glu",P.w6],["ALT",P.w6],["CT",P.w12]];const f=need.filter(([k,a])=>!vxLabIn(s.id,k,a,P.c)).map(([k])=>VXE[k].l);return vxR(!f.length,f.length?"Falta: "+f.join(", "):"",f.length>0);}},
 {id:"CAC-17",set:"cac",dom:"Seguimiento",n:"Tamización de VPH en mujeres viviendo con VIH",nd:"Mujeres de 25 a 65 años con citología o ADN-VPH en el periodo / mujeres de 25 a 65",rng:vxLB,f:(s,P)=>{if(!String(s.p.Sexo).startsWith("F")||s.edad==null||s.edad<25||s.edad>65)return null;const ok=vxPrcIn(s.id,/cervicovaginal|ADN-VPH/,P.ini,P.c);return vxR(ok,ok?"":"Sin tamización en el periodo",!ok);}},
 {id:"CAC-18",set:"cac",dom:"Seguimiento",n:"Esquema completo de vacunación",nd:"Adultos: neumococo, influenza y VPH (según edad) completos / PVV",rng:vxLB,f:(s,P)=>vxR(vxVacCompleta(s.p,["NEUC","INF","VPH"],P.c),"")},
 {id:"CAC-19",set:"cac",dom:"Seguimiento",n:"Abandono de la TAR (6 meses o más sin reclamar)",nd:"PVV sin entrega de TAR en 6 meses o más / PVV",rng:{t:"lb",low:true},f:s=>!s.tarIni?null:vxR(s.sinEnt6,s.ent?"Última entrega "+s.ent.Fecha:"Sin entregas registradas",!s.ent),inv:true},
 {id:"CAC-20",set:"cac",dom:"Seguimiento",n:"Atención por el equipo interdisciplinario",nd:"Médico experto, infectología, química farmacéutica, odontología y psicología o trabajo social o enfermería / PVV",rng:vxLB,f:s=>{const D=s.disc;const f=[!D.has("Medicina experta VIH")&&"médico experto",!D.has("Infectología")&&"infectología",!D.has("Química farmacéutica")&&"química farmacéutica",!D.has("Odontología")&&"odontología",!(D.has("Psicología")||D.has("Trabajo social")||D.has("Enfermería"))&&"psicosocial o enfermería"].filter(Boolean);return vxR(!f.length,f.length?"Falta: "+f.join(", "):"");}},
 {id:"CAC-21",set:"cac",dom:"Seguimiento",n:"Tamización anal de VPH en HSH",nd:"HSH con citología anal o ADN-VPH en el periodo / HSH",rng:vxLB,f:(s,P)=>!vxHSH(s.p)?null:vxR(vxPrcIn(s.id,/anal|ADN-VPH/,P.ini,P.c),"")},
 {id:"CAC-22",set:"cac",dom:"Seguimiento",n:"Tamización para hepatitis B",nd:"PVV susceptibles con tamización VHB en el periodo / PVV susceptibles",rng:vxLB,f:(s,P)=>{const ah=vxL(s.id,"lab").some(r=>r.Examen==="AntiHBs"&&r._d<P.ini&&num(r.Valor)>=10);if(ah)return{x:"Anticuerpos protectores previos"};if(s.vhb&&!vxLabIn(s.id,"HBsAg",P.ini,P.c))return{x:"Coinfección VHB"};const ok=["HBsAg","AntiHBc","AntiHBs"].some(k=>vxLabIn(s.id,k,P.ini,P.c));return vxR(ok,ok?"":"Sin serología VHB en el periodo",!ok);}},
 {id:"CAC-23",set:"cac",dom:"Seguimiento",n:"Tamización para hepatitis C",nd:"PVV con anti-VHC en el periodo / PVV (excluye VHC confirmada sin tratamiento)",rng:vxLB,f:(s,P)=>{if(s.vhc&&!vxPrfIn(s.id,/AAD/,P.ini,P.c))return{x:"VHC confirmada sin tratamiento"};const ok=vxLabIn(s.id,"AntiVHC",P.ini,P.c);return vxR(ok,ok?"":"Sin anti-VHC en el periodo",!ok);}},
 {id:"CAC-24",set:"cac",dom:"Seguimiento",n:"Hospitalización por VIH con menos de 6 meses de diagnóstico",nd:"PVV hospitalizadas por oportunista en los 6 meses tras el diagnóstico / PVV diagnosticadas en los últimos 18 meses",rng:vxLB,inv:true,f:(s,P)=>{if(!s.dx||s.dx<addMonths(P.c,-18))return null;return vxR(vxHospVIH(s.id,s.dx,addMonths(s.dx,6)).some(n=>vxEnRango(vxD(n.Fecha),P.ini,P.c)),"");}},
 {id:"CAC-25",set:"cac",dom:"Seguimiento",n:"Hospitalización por VIH con más de 6 meses de diagnóstico",nd:"PVV hospitalizadas por oportunista en el periodo / PVV con más de 6 meses de diagnóstico",rng:vxLB,inv:true,f:(s,P)=>{if(!s.dx||s.dx>addMonths(P.c,-6))return null;return vxR(vxHospVIH(s.id,P.ini,P.c).length>0,"");}},
 {id:"CAC-26",set:"cac",dom:"Seguimiento",n:"Letalidad con menos de 6 meses de diagnóstico",nd:"Fallecidos por VIH con menos de 6 meses de diagnóstico / PVV con menos de 6 meses de diagnóstico",rng:vxLB,inv:true,all:true,f:(s,P)=>{if(!s.dx||s.dx<addMonths(P.c,-6))return null;return vxR(vxNovAt(s.id,/^Fallecimiento por causa VIH/,P.c,P.ini).length>0,"");}},
 {id:"CAC-27",set:"cac",dom:"Seguimiento",n:"Letalidad con más de 6 meses de diagnóstico",nd:"Fallecidos por VIH con más de 6 meses de diagnóstico / PVV con más de 6 meses de diagnóstico",rng:vxLB,inv:true,all:true,f:(s,P)=>{if(!s.dx||s.dx>=addMonths(P.c,-6))return null;return vxR(vxNovAt(s.id,/^Fallecimiento por causa VIH/,P.c,P.ini).length>0,"");}},
 {id:"CAC-28",set:"cac",dom:"Tratamiento",n:"Cobertura de la TAR",nd:"PVV recibiendo TAR al corte / PVV",rng:vxUP(95,85),f:s=>vxR(s.recibeTAR,s.tar?s.tar.Esquema:"Sin esquema activo al corte")},
 {id:"CAC-29",set:"cac",dom:"Tratamiento",n:"Prescripción de la TAR según pautas de elección de la GPC",nd:"Inicios de TAR del periodo con pauta preferida o alternativa (GPC 2021, rec. 12 y 13) / inicios de TAR del periodo",rng:vxUP(95,90),f:(s,P)=>{if(!vxEnRango(s.tarIni,P.ini,P.c))return null;const t=vxL(s.id,"tar")[0];return vxR(t&&VX_GPC_PREF.includes(t.Esquema),t?t.Esquema:"");}},
 {id:"CAC-30",set:"cac",dom:"Tratamiento",n:"Oportunidad de TAR en TB activa sin meningitis",nd:"PVV con TB activa en el periodo con 30 días o menos entre el diagnóstico de TB y la TAR / PVV con TB activa",rng:vxUP(95,90,true),f:(s,P)=>{const tb=vxL(s.id,"nov").find(n=>n.Tipo==="Tuberculosis activa"&&vxEnRango(vxD(n.Fecha),P.ini,P.c));if(!tb)return null;if(/mening/i.test(tb.Detalle||""))return{x:"TB meníngea"};if(s.tarIni&&s.tarIni<vxD(tb.Fecha))return{x:"En TAR antes del diagnóstico de TB"};const d=dayDiff(vxD(tb.Fecha),s.tarIni||P.c);return vxR(d<=30,d+" días");}},
 {id:"CAC-31",set:"cac",dom:"Tratamiento",n:"Cambio de esquema en los 12 meses posteriores al inicio",nd:"Inicios de TAR del periodo con cambio en 12 meses / inicios de TAR del periodo",rng:vxDOWN(30,40),inv:true,f:(s,P)=>{if(!vxEnRango(s.tarIni,P.ini,P.c))return null;const T=vxL(s.id,"tar");return vxR(T.length>1&&vxD(T[1].Inicio)<=addMonths(s.tarIni,12),T.length>1?"Cambio "+T[1].Inicio+" ("+(T[1].Motivo||"sin motivo")+")":"");}},
 {id:"CAC-32",set:"cac",dom:"Tratamiento",n:"Tratamiento para TB latente",nd:"PVV con PPD o IGRA positiva que reciben tratamiento de TB latente / PVV con TB latente",rng:vxUP(95,90),f:(s,P)=>{const pos=vxL(s.id,"prc").some(x=>x.Tipo==="Tuberculina (PPD)"&&/Positiva/.test(x.Resultado||"")&&vxD(x.FechaLectura||x.Fecha)<=P.c)||vxL(s.id,"lab").some(r=>r.Examen==="IGRA"&&vxPos(r)&&r._d<=P.c);if(!pos)return null;if(s.tbAct)return{x:"TB activa"};return vxR(vxPrfIn(s.id,/TB latente/,addMonths(P.c,-24),P.c),"");}},
 {id:"CAC-33",set:"cac",dom:"Tratamiento",n:"Adherencia a la TAR (medición con soporte)",nd:"PVV con medición de adherencia (SMAQ) en los últimos 6 meses / PVV",rng:vxUP(90,70),f:s=>vxR(!!s.smaq,s.smaq?s.smaq.SMAQ+" "+s.smaq.Fecha:"Sin SMAQ en 6 meses",!s.smaq)},
 {id:"CAC-34",set:"cac",dom:"Tratamiento",n:"Oportunidad de inicio de la TAR",nd:"Incidentes con 30 días o menos entre la confirmación y el inicio de TAR / incidentes",rng:vxUP(95,90,true),f:(s,P)=>{if(!s.incidente)return null;const d=dayDiff(s.dx,s.tarIni&&s.tarIni>=s.dx?s.tarIni:P.c);return vxR(d<=30,d+" días"+(s.tarIni?"":" (sin inicio)"));}},
 {id:"CAC-35",set:"cac",dom:"Tratamiento",n:"Coinfección hepatitis B / VIH en tratamiento para ambas",nd:"PVV con VHB en TAR con tenofovir / PVV con VHB",rng:vxLB,f:s=>!s.vhb?null:vxR(s.tar&&/TDF|TAF/.test(s.tar.Esquema),s.tar?s.tar.Esquema:"Sin TAR")},
 {id:"CAC-36",set:"cac",dom:"Tratamiento",n:"Coinfección hepatitis C / VIH en tratamiento para ambas",nd:"PVV con VHC con antivirales de acción directa y TAR / PVV con VHC",rng:vxLB,f:(s,P)=>!s.vhc?null:vxR(s.recibeTAR&&vxPrfIn(s.id,/AAD/,P.ini,P.c),"")},
 {id:"CAC-37",set:"cac",dom:"Tratamiento",n:"Coinfección TB / VIH en tratamiento para ambas",nd:"PVV con TB activa con tratamiento antituberculoso y TAR / PVV con TB activa",rng:vxLB,f:(s,P)=>{const tb=vxNovAt(s.id,/^Tuberculosis activa/,P.c,P.ini);if(!tb.length)return null;return vxR(s.recibeTAR&&vxPrfIn(s.id,/antituberculoso/,P.ini,P.c),"");}},
 /* ---- Nueva EPS: fichas de indicadores (archivo FICHAS DE INDICADORES adjunto) ---- */
 {id:"NEPS-01",set:"neps",dom:"Diagnóstico",n:"Detección con CD4 mayor de 350 en casos incidentes",per:"mes",nd:"Incidentes del mes con CD4 mayor de 350 (±3 meses del diagnóstico; excluye oportunistas del numerador) / incidentes del mes (sin traslados, cesiones ni rediagnósticos)",rng:vxUP(95,85),f:(s,P)=>{if(!s.incidente||!vxEnRango(s.dx,P.mi,P.c))return null;if(s.edad!=null&&s.edad<1)return{x:"Recién nacido menor de 6 meses"};return vxR(s.cd4dx&&vxVal(s.cd4dx)>350&&!s.oport,s.cd4dx?"CD4 "+vxVal(s.cd4dx):"Sin CD4 al diagnóstico",!s.cd4dx);}},
 {id:"NEPS-02",set:"neps",dom:"Seguimiento",n:"Atención por el infectólogo en el periodo",per:"sem",nd:"PVV con al menos una atención por infectología en el año hasta el corte / PVV",rng:vxSemRng(vxUP(47.5,45.1),vxUP(95,90.1)),f:(s,P)=>{const ok=vxL(s.id,"cit").some(x=>x.Estado==="Asistió"&&x.Disciplina==="Infectología"&&vxEnRango(vxD(x.Fecha),P.ai,P.c));return vxR(ok,ok?"":"Sin infectología en el año");}},
 {id:"NEPS-03",set:"neps",dom:"Seguimiento",n:"Realización de CD4 y carga viral en los últimos 6 meses",nd:"PVV con CD4 y CV en 6 meses / PVV activas",rng:vxUP(95,90),f:s=>vxR(s.cv6&&s.cd46,[!s.cv6&&"sin CV",!s.cd46&&"sin CD4"].filter(Boolean).join(", "),!(s.cv6&&s.cd46))},
 {id:"NEPS-04",set:"neps",dom:"Seguimiento",n:"Indetectabilidad a las 48 semanas o más de TAR",per:"sem",nd:"PVV en TAR 48 semanas o más con CV menor de 50 (más cercana al corte, en 6 meses) / PVV en TAR 48 semanas o más",rng:vxSemRng(vxUP(47.5,40.1),vxUP(90,80)),f:s=>{if(!s.recibeTAR||s.semTAR==null||s.semTAR<48)return null;const cv=s.cv6&&s.cv6._d>=addDays(s.tarIni,48*7)?s.cv6:null;return vxR(cv&&vxCVind(cv),cv?vxFmtLab(cv):"Sin CV válida",!cv);}},
 {id:"NEPS-05",set:"neps",dom:"Seguimiento",n:"Seguimiento paraclínico en el periodo",per:"sem",nd:"Creatinina, glucemia y ALT semestral y colesterol total anual / PVV",rng:vxSemRng(vxUP(47.5,45.1),vxUP(95,90.1)),f:(s,P)=>{const need=[["Cr",P.w6],["Glu",P.w6],["ALT",P.w6],["CT",P.w12]];const f=need.filter(([k,a])=>!vxLabIn(s.id,k,a,P.c)).map(([k])=>VXE[k].l);return vxR(!f.length,f.length?"Falta: "+f.join(", "):"",f.length>0);}},
 {id:"NEPS-06",set:"neps",dom:"Seguimiento",n:"Abandono de la TAR durante el periodo",nd:"PVV sin reclamar TAR en 6 meses o más / PVV (línea de base, menor de 5 %)",rng:vxDOWN(5,5),inv:true,f:s=>!s.tarIni?null:vxR(s.sinEnt6,s.ent?"Última entrega "+s.ent.Fecha:"Sin entregas",!s.ent)},
 {id:"NEPS-07",set:"neps",dom:"Seguimiento",n:"Tamización para hepatitis C",nd:"PVV tamizadas para VHC en 12 meses / PVV (excluye VHC confirmada sin TAR)",rng:vxLB,f:(s,P)=>{if(s.vhc&&!s.recibeTAR)return{x:"VHC confirmada sin TAR"};const ok=vxLabIn(s.id,"AntiVHC",P.w12,P.c);return vxR(ok,ok?"":"Sin anti-VHC en 12 meses",!ok);}},
 {id:"NEPS-08",set:"neps",dom:"Seguimiento",n:"Hospitalización por causa del VIH-sida (mes)",per:"mes",nd:"PVV hospitalizadas por enfermedad oportunista en el mes / PVV",rng:vxLB,inv:true,f:(s,P)=>vxR(vxHospVIH(s.id,P.mi,P.c).length>0,"")},
 {id:"NEPS-09",set:"neps",dom:"Tratamiento",n:"Cobertura de la TAR en el periodo",nd:"PVV recibiendo TAR al corte / PVV",rng:vxUP(95,85),f:s=>vxR(s.recibeTAR,s.tar?s.tar.Esquema:"Sin esquema activo")},
 {id:"NEPS-10",set:"neps",dom:"Tratamiento",n:"Oportunidad de inicio de la TAR (IPS especializada)",per:"mes",nd:"Casos nuevos con 20 días o menos entre la asignación de la cita y el inicio de TAR / casos nuevos del mes",rng:vxUP(95,90,true),f:(s,P)=>{if(!s.incidente||!vxEnRango(s.dx,P.mi,P.c))return null;const pr=vxD(s.p.FechaPresentacion);if(!pr)return vxR(false,"Sin fecha de asignación de cita",true);const d=dayDiff(pr,s.tarIni&&s.tarIni>=pr?s.tarIni:P.c);return vxR(d<=20,d+" días");}},
 {id:"NEPS-11",set:"neps",dom:"Tratamiento",n:"Oportunidad de ingreso a la IPS especializada",per:"mes",nd:"Casos nuevos con 30 días o menos entre la confirmación y el ingreso a la IPS / casos nuevos del mes",rng:vxUP(95,90,true),f:(s,P)=>{if(!s.incidente||!vxEnRango(s.dx,P.mi,P.c))return null;if(!s.ing)return vxR(false,"Sin fecha de ingreso",true);const d=dayDiff(s.dx,s.ing);return vxR(d<=30,d+" días");}},
 {id:"NEPS-12",set:"neps",dom:"Gestión del riesgo",n:"Personas en TAR con carga viral indetectable (últimos 6 meses)",nd:"En TAR con última CV menor de 50 tomada en 6 meses / PVV en TAR",rng:vxUP(85,80),f:s=>!s.recibeTAR?null:vxR(s.cv6&&vxCVind(s.cv6),s.cv6?vxFmtLab(s.cv6):"Sin CV en 6 meses",!s.cv6)}
];
/* vih.js:306 */
const VXI=Object.fromEntries(VX_IND.map(d=>[d.id,d]));
/* vih.js:307 */
function vxRng(d,c){return typeof d.rng==="function"?d.rng(c):d.rng;}
/* vih.js:308 */
function vxNivel(d,pct,c){const r=vxRng(d,c);if(pct==null)return["Sin denominador","base"];if(r.t==="lb")return["Línea de base","info"];
 if(r.t==="down")return pct<r.a?["Alto","ok"]:pct<r.m?["Medio","warn"]:["Bajo","bad"];
 const ge=(v,t)=>r.strict?v>t:v>=t;return ge(pct,r.a)?["Alto","ok"]:pct>=r.m?["Medio","warn"]:["Bajo","bad"];}
/* vih.js:311 */
function vxRngTxt(d,c){const r=vxRng(d,c);if(r.t==="lb")return r.low?"Línea de base (menor es mejor)":"Línea de base";if(r.t==="down")return r.a===r.m?"Menor de "+r.a+" %":"Alto menor de "+r.a+" % · Medio "+r.a+" a "+r.m+" % · Bajo "+r.m+" % o más";return"Alto "+(r.strict?"mayor de ":"")+vxF(r.a,1)+" % o más · Medio "+vxF(r.m,1)+" % · Bajo menor de "+vxF(r.m,1)+" %";}
/* vih.js:313 */
function vxFiltro(p,F){F=F||VX.ui.f||{};if(F.eps&&p.EPS!==F.eps)return false;if(F.reg&&p.Regimen!==F.reg)return false;if(F.mun&&p.Municipio!==F.mun)return false;if(F.sexo&&!String(p.Sexo).startsWith(F.sexo))return false;if(F.pc&&p.PoblacionClave!==F.pc)return false;if(F.mod&&p.Modalidad!==F.mod)return false;return true;}
/* vih.js:314 */
function vxPer(c){const P=vxPeriodo(c);P.mi=monthStart(P.c);P.ai=new Date(P.c.getFullYear(),0,1);return P;}
/* vih.js:315 */
function vxCalc(d,c,F,pac){c=c||vxCorte();const P=vxPer(c);const rows=[];let num=0,den=0;
 (pac||vxPacs()).filter(p=>vxFiltro(p,F)).forEach(p=>{const s=vxSt(p,c);if(s.expuesto)return;if(!d.all&&!s.activo)return;if(d.all){const ing=s.ing||s.dx;if(ing&&ing>c)return;const eg=vxD(p.FechaEgreso);if(eg&&eg<P.ini)return;}
  const r=d.f(s,P);if(r==null)return;if(r.x){rows.push({p,s,res:"Excluido",d:r.x});return;}den++;if(r.ok)num++;rows.push({p,s,res:r.ok?(d.inv?"Evento":"Cumple"):(d.inv?"Sin evento":"No cumple"),ok:r.ok,falta:r.falta,d:r.d});});
 const pct=den?num/den*100:null;const[nv,cls]=vxNivel(d,pct,c);return{d,num,den,pct,nv,cls,rows,c};}
/* vih.js:319 */
function vxCalcBy(d,c,F,key){const g={};vxPacs().filter(p=>vxFiltro(p,F)).forEach(p=>{const k=key(p)||"Sin dato";(g[k]=g[k]||[]).push(p);});return Object.entries(g).map(([k,L])=>{const r=vxCalc(d,c,F,L);return{k,num:r.num,den:r.den,pct:r.pct,nv:r.nv,cls:r.cls};}).sort((a,b)=>b.den-a.den);}
/* vih.js:525 */
const VX_PAQ_DEF={"NUEVA EPS":{con:"Paquete Mensual Atención Integral Ambulatoria",sin:"Paquete Mensual Atención Integral Ambulatoria Sin Antirretrovirales"},"FAMILIAR DE COLOMBIA":{con:"Paquete mensual atención integral VIH",sin:"Paquete mensual atención integral VIH"}};
/* vih.js:526 */
function vxPaq(p,per){const P=vxCfg("paquetes",VX_PAQ_DEF)[p.EPS];if(!P)return"Paquete mensual (EPS sin paquete configurado)";const ms=pdate(per+"-01"),me=monthEnd(ms);const e=vxL(p.ID,"ent").filter(x=>vxD(x.Fecha)<=me).pop();return e&&e.Lugar==="Farmacia de la IPS"&&vxD(e.Fecha)>=addMonths(ms,-2)?P.con:P.sin;}
/* vih.js:527 */
function vxFactMes(per,F){const ms=pdate(per+"-01"),me=monthEnd(ms);const out=[];vxPacs().filter(p=>!F||vxFiltro(p,F)).forEach(p=>{const s=vxSt(p,me);const eg=vxD(p.FechaEgreso);if(!s.activo&&!(eg&&eg>=ms))return;const at=vxL(p.ID,"cit").filter(x=>x.Estado==="Asistió"&&vxEnRango(vxD(x.Fecha),ms,me));out.push({p,at,fact:at.length>0,paq:vxPaq(p,per)});});return out;}
/* vih.js:528 */
function vxProdMes(per,F){const R={};vxFactMes(per,F).filter(x=>x.fact).forEach(x=>{const k=(x.p.EPS||"Sin EPS")+"|"+x.paq;const r=R[k]=R[k]||{eps:x.p.EPS||"Sin EPS",act:x.paq,cant:0,pac:new Set()};r.cant++;r.pac.add(x.p.ID);});return Object.values(R).sort((a,b)=>a.eps.localeCompare(b.eps)||a.act.localeCompare(b.act));}
/* vih.js:529 */
function vxDiscMes(per,F){const R={};VX.book.cit.filter(vxLive).filter(x=>x.Estado==="Asistió"&&String(x.Fecha).startsWith(per)).forEach(x=>{const p=vxP(x.Paciente);if(!p||(F&&!vxFiltro(p,F)))return;const a=VX_DISC_ACT[x.Disciplina]||x.Disciplina;const k=(p.EPS||"Sin EPS")+"|"+a;const r=R[k]=R[k]||{eps:p.EPS||"Sin EPS",act:a,cant:0,pac:new Set()};r.cant++;r.pac.add(p.ID);});return Object.values(R).sort((a,b)=>a.eps.localeCompare(b.eps)||a.act.localeCompare(b.act));}
/* vih.js:738 */
const VX_NOM_COLS=["CONSECUTIVO","IPS ESPECIALIZADA","COD HABILITACION_IPS ATENCION","FECHA DEL INFORME","FECHA INGRESO A LA IPS ","TIPO DE IDENTIFICACION","NUMERO DE IDENTIFICACION","PRIMER APELLIDO","SEGUNDO APELLIDO","PRIMER NOMBRE","SEGUNDO NOMBRE","POBLACION CLAVE","DEPARTAMENTO DE \nRESIDENCIA DEL PACIENTE","MUNICIPIO DE RESIDENCIA DEL PACIENTE","DIRECCIÓN DE RESIDENCIA","DATO DE CONTACTO","FECHA DIAGNÓSTICO","CIE 10 PRINCIPAL","FECHA CARGA VIRAL AL MOMENTO DEL DIAGNOSTICO ","RESULTADO CARGA VIRAL AL MOMENTO DEL DIAGNOSTICO","FECHA CONTEO DE LINFOCITOS CD4 AL MOMENTO DEL DIAGNOSTICO ","RESULTADO CD4 REALIZADO AL MOMENTO DEL DIAGNOSTICO","ESTADIO INICIAL","FECHA INICIO DE PRIMERA TAR ","FECHA  ULTIMO CD4","RESULTADO ULTIMO CD4","FECHA ULTIMA CARGA VIRAL","RESULTADO ULTIMA CARGA VIRAL","RECIBE TRATAMIENTO ANTIRETROVIRAL ACTUALMENTE","ESTADIO ACTUAL","FECHA TOMA PPD","RESULTADO PPD","FECHA TAMIZAJE SIFILIS","RESULTADO PRUEBA SIFILIS","COINFECCION TB","FECHA TAMIZAJE HEPATITIS C","RESULTADO HEPATITIS C","COINFECCION HEPATITIS C","GESTANTE","MODALIDAD ATENCION","NOVEDADES","FECHA DE LA ULTIMA ATENCION","SEDE"];
/* vih.js:739 */
function vxNominalRows(eps){const c=vxCorte();const out=[];vxPacs().filter(p=>p.EPS===eps&&vxFiltro(Object.assign({},p,{EPS:eps}))).forEach(p=>{const r=vxNomRow(p,c);if(r)out.push({p,r});});out.forEach((x,i)=>x.r.CONSECUTIVO=i+1);return out;}
/* vih.js:741 */
function vxNomRow(p,c,force){const mi=monthStart(c);const W="1800-01-01";{const s=vxSt(p,c);const eg=vxD(p.FechaEgreso);if(!force&&!s.activo&&!(eg&&eg>=mi&&eg<=c))return null;
  const men=p.TipoIngreso==="Menor expuesto en seguimiento";const cvdx=s.cvdx,cd4dx=s.cd4dx;const cv=s.cv,cd4=s.cd4;
  const ppd=vxL(p.ID,"prc").filter(x=>x.Tipo==="Tuberculina (PPD)"&&["Aplicado","Leída"].includes(x.Estado)&&vxD(x.Fecha)<=c).pop();const sif=[vxLast(p.ID,"VDRL",c),vxLast(p.ID,"TREP",c)].filter(Boolean).sort((a,b)=>a._d-b._d).pop();const hc=vxLast(p.ID,"AntiVHC",c);
  const cits=vxL(p.ID,"cit").filter(x=>vxEnRango(vxD(x.Fecha),mi,c));const nov=s.p.Estado==="Fallecido"&&eg>=mi?"4.Fallecido durante el mes":p.Estado==="Desafiliado"&&eg>=mi?"5.Paciente desafiliado":p.Estado==="Trasladado"&&eg>=mi?"6.Traslado de IPS":p.Estado==="Alta"&&eg>=mi?"12.Alta del programa.":men?"10.Menor en seguimiento":s.dx&&s.dx>=mi&&p.TipoIngreso==="Nuevo diagnóstico"?"2.Paciente nuevo":vxHospVIH(p.ID,mi,c).length||vxNovAt(p.ID,/^Hospitalización/,c,mi).length?"8.Hospitalización":(s.ultAt&&dayDiff(s.ultAt,c)>90)?"9.Abandono Tratamiento (Paciente inasistente más de 3 meses)":cits.some(x=>x.Estado==="No asistió")&&!cits.some(x=>x.Estado==="Asistió")?"3.Inasistente durante el mes":"0.No presenta ninguna novedad";
  const r={};const set=(k,v)=>r[k]=v;
  set("IPS ESPECIALIZADA",vxCfg("ips_nombre","IPS POSMEDICA"));set("COD HABILITACION_IPS ATENCION",vxCfg("ips_hab","860010090801"));set("FECHA DEL INFORME",iso(c));set("FECHA INGRESO A LA IPS ",p.FechaIngresoIPS||"");set("TIPO DE IDENTIFICACION",p.TipoDoc);set("NUMERO DE IDENTIFICACION",p.Documento);set("PRIMER APELLIDO",p.PrimerApellido);set("SEGUNDO APELLIDO",p.SegundoApellido||"");set("PRIMER NOMBRE",p.PrimerNombre);set("SEGUNDO NOMBRE",p.SegundoNombre||"");set("POBLACION CLAVE",p.PoblacionClave||"");set("DEPARTAMENTO DE \nRESIDENCIA DEL PACIENTE","PUTUMAYO");set("MUNICIPIO DE RESIDENCIA DEL PACIENTE",norm(p.Municipio||""));set("DIRECCIÓN DE RESIDENCIA",p.Direccion||"");set("DATO DE CONTACTO",p.Telefono||"");
  set("FECHA DIAGNÓSTICO",men?W:(p.FechaDx||""));set("CIE 10 PRINCIPAL",p.CIE10||"B24X");
  set("FECHA CARGA VIRAL AL MOMENTO DEL DIAGNOSTICO ",cvdx?cvdx.FechaToma:W);set("RESULTADO CARGA VIRAL AL MOMENTO DEL DIAGNOSTICO",cvdx?(vxCVind(cvdx)?"0. Indetectable (menor de 50 copias)":"1. Detectable mayor a 50 copias"):"2. No tiene carga viral al momento del diagnostico");
  set("FECHA CONTEO DE LINFOCITOS CD4 AL MOMENTO DEL DIAGNOSTICO ",cd4dx?cd4dx.FechaToma:W);set("RESULTADO CD4 REALIZADO AL MOMENTO DEL DIAGNOSTICO",cd4dx?vxVal(cd4dx):9998);set("ESTADIO INICIAL",["","Estadio 1: Mayor 500","Estadio 2: 200-499","Estadio 3: Menor de 200 o Enfermedad oportunista","Usuarios sin laboratorios"][s.estIni]);
  set("FECHA INICIO DE PRIMERA TAR ",s.tarIni?iso(s.tarIni):W);set("FECHA  ULTIMO CD4",cd4?cd4.FechaToma:W);set("RESULTADO ULTIMO CD4",cd4?vxVal(cd4):9998);
  set("FECHA ULTIMA CARGA VIRAL",cv?cv.FechaToma:W);set("RESULTADO ULTIMA CARGA VIRAL",s.cv6?(vxCVind(s.cv6)?"0. Indetectable (menor de 50 copias)":"1. Detectable mayor a 50 copias"):"2. No tiene carga viral en los últimos 6 meses");
  set("RECIBE TRATAMIENTO ANTIRETROVIRAL ACTUALMENTE",s.recibeTAR?"SI":"NO");set("ESTADIO ACTUAL",["","1. Estadio 1","2. Estadio 2","3. Estadio 3","4. Por establecer"][s.estAct]);
  set("FECHA TOMA PPD",ppd?ppd.Fecha:W);set("RESULTADO PPD",ppd&&ppd.Resultado?(/Positiva/.test(ppd.Resultado)?"1. Positiva":"2. Negativa"):s.tbAlgunaVez?"3. No se realiza por que tiene o tuvo TB activa":"4. No se realizo");if(ppd&&!ppd.Resultado){r["FECHA TOMA PPD"]=W;r["RESULTADO PPD"]="4. No se realizo";}
  set("FECHA TAMIZAJE SIFILIS",sif?sif.FechaToma:W);set("RESULTADO PRUEBA SIFILIS",sif?(vxPos(sif)?"1. Positiva":"2. Negativa"):"4. No se realizo");set("COINFECCION TB",s.tbAct?"SI":"NO");
  set("FECHA TAMIZAJE HEPATITIS C",hc?hc.FechaToma:W);set("RESULTADO HEPATITIS C",hc?(vxPos(hc)?"1. Positiva":"2. Negativa"):"4. No se realizo");set("COINFECCION HEPATITIS C",s.vhc?"SI":"NO");
  set("GESTANTE",s.gest?"SI":"NO");set("MODALIDAD ATENCION",p.Modalidad||"Presencial");set("NOVEDADES",p.NovedadNominal||nov);set("FECHA DE LA ULTIMA ATENCION",s.ultAt?iso(s.ultAt):"");set("SEDE",p.Sede||vxCfg("sede","MOCOA"));
  return r;}}
/* vih.js:758 */
function vxNominalValidar(rows){const E=[];const add=(x,campo,t)=>E.push({x,campo,t});
 rows.forEach(x=>{const r=x.r;["FECHA INGRESO A LA IPS ","POBLACION CLAVE","DIRECCIÓN DE RESIDENCIA","DATO DE CONTACTO","FECHA DIAGNÓSTICO","FECHA DE LA ULTIMA ATENCION"].forEach(k=>{if(!r[k])add(x,k.trim(),"Campo obligatorio vacío");});
  if(r["FECHA DIAGNÓSTICO"]==="1800-01-01"&&!/^7\./.test(r["POBLACION CLAVE"]))add(x,"FECHA DIAGNÓSTICO","Regla 2: comodín 1800-01-01 solo para menor en seguimiento");
  if(/^7\./.test(r["POBLACION CLAVE"])&&!/^10\./.test(r.NOVEDADES))add(x,"NOVEDADES","Regla 1: menor en seguimiento debe ir con novedad 10");
  const fv=r["FECHA ULTIMA CARGA VIRAL"],rv=r["RESULTADO ULTIMA CARGA VIRAL"];if(fv!=="1800-01-01"&&/^2/.test(rv))add(x,"RESULTADO ULTIMA CARGA VIRAL","Regla 8 vs regla del campo: fecha válida mayor de 6 meses con opción 2 (confirmar con la EPS cuál prima)");
  if(String(r["DATO DE CONTACTO"]).replace(/\D/g,"").length&&String(r["DATO DE CONTACTO"]).replace(/\D/g,"").length<7)add(x,"DATO DE CONTACTO","Teléfono incompleto");
  const e1=r["ESTADIO INICIAL"],a=r["ESTADIO ACTUAL"];if(/Estadio 3/.test(e1)&&!/^3/.test(a)&&!/^4/.test(a))add(x,"ESTADIO ACTUAL","Regla 7: inicial 3 debe seguir en 3");if(/Estadio 2/.test(e1)&&/^1/.test(a))add(x,"ESTADIO ACTUAL","Regla 7: inicial 2 no puede bajar a 1");
  if(r["COD HABILITACION_IPS ATENCION"].length>12)add(x,"COD HABILITACION","Más de 12 dígitos");});return E;}
/* vih.js:774 */
function vxCACRows(eps){const c=vxCorte();const out=[];const tr=[];vxPacs().filter(p=>p.EPS===eps).forEach(p=>{const x=vxCACRow(p,c);if(!x)return;out.push({p,D:x.D});x.tr.forEach(t=>tr.push(t));});return{out,tr};}
/* vih.js:776 */
function vxCACRow(p,c,force){const P=vxPer(c);const code=vxCfg("epscode",VX_EPSCODE_DEF)[p.EPS]||"";const tr=[];{const s=vxSt(p,c);const eg=vxD(p.FechaEgreso);if(!force&&!s.activo&&!(eg&&eg>=P.ini))return null;const prev=vxIdx().cac[p.ID];let D={};try{D=prev?JSON.parse(prev.Datos):{};}catch(e){D={};}const nuevo=!prev;
  const up=(k,v,f)=>{if(v==null||v==="")return;const a=D[k]==null?"":String(D[k]);if(a!==String(v)){tr.push({p,k,a,v:String(v),f});D[k]=v;}};
  const NM=x=>norm(x).replace(/[^A-Z ]/g,"").trim();const fem=String(p.Sexo).startsWith("F");
  if(code)up("v1ideps",code,"Configuración EPS");up("v2regimen",p.Regimen,"Paciente");up("v3tipodocumentoidentificacionusu",p.TipoDoc,"Paciente");up("v4numerodeidentificacion",p.Documento,"Paciente");up("v5primeapellido",NM(p.PrimerApellido),"Paciente (instructivo var. 5)");up("v6segundoapellido",NM(p.SegundoApellido)||"NOAP","Paciente (instructivo var. 6: NOAP)");up("v7primernombre",NM(p.PrimerNombre),"Paciente (instructivo var. 7)");up("v8segundonombre",NM(p.SegundoNombre)||"NONE","Paciente (instructivo var. 8: NONE)");up("v9fechadenacimiento",p.FechaNac,"Paciente");up("v10sexo",fem?"M":String(p.Sexo).startsWith("M")?"H":String(p.Sexo).startsWith("I")?"I":"","Paciente (H/M/I)");
  const et={"Indígena":1,"ROM (gitano)":2,"Raizal":3,"Palenquero":4,"Negro, mulato, afrocolombiano":5,"Ninguna de las anteriores":6}[p.Etnia];if(et)up("v11codigopertenenciaetnica",et,"Paciente (var. 11)");
  const pc=vxPcCAC(p);if(pc)up("v12poblacionclave",pc,"Paciente (var. 12, homologación por confirmar)");up("v13codigomunicipioresidencia",p.CodMunicipio,"Paciente");
  const gest=vxNovAt(p.ID,/^Gestación/,c,P.ini);up("v15mujergestante",!fem?9:s.gest?1:gest.length?2:3,"Paciente y novedades (var. 15)");
  up("v16menorde12meseshijodemadrre",p.TipoIngreso==="Menor expuesto en seguimiento"&&s.edad!=null&&s.edad<1?1:0,"Paciente (var. 16)");
  const tb=vxNovAt(p.ID,/^Tuberculosis activa/,c,P.ini);up("v17personacontuberculosisactiva",s.tbAct?1:tb.length?2:3,"Novedades (var. 17)");
  up("v18condicionrespectodiagnostico",p.TipoIngreso==="Menor expuesto en seguimiento"?3:1,"Paciente (var. 18)");
  up("v32fechadxtuberculosisactivarepo",tb.length?tb[tb.length-1].Fecha:"1845-01-01","Novedades (var. 32)");
  if(!fem)["v19fechadiagnosticogestacion","v20fechatamizajevihprimertrimest","v21fechatamizajevihsegundotrimes","v22fechatamizajevihtercertrimest","v23fechadetamizajeparavihmomento","v246fechaculminaciongestacionrep"].forEach(k=>up(k,"1845-01-01","Hombre: no aplica (var. 19 a 24.6)"));
  const lp=(ex,fk,vk)=>{const r=vxLast(p.ID,ex,c,P.ini);if(!r)return;up(fk,r.FechaToma,"Laboratorio "+ex);if(num(r.Valor)!=null)up(vk,num(r.Valor),"Laboratorio "+ex);};
  lp("LDL","v56fechadeultimocolesterolldl","v561resultadodelultimocolesterol");lp("TG","v57fechadeultimoniveldetriglicer","v571resultadodelultimoniveldetri");lp("Hb","v58fechadeultimahemoglobinaseric","v581resultadodelaultimahemoglobi");lp("ALT","v59fechadelaultimaenzimaalaninaa","v591resultadodelaultimaaltotgpse");lp("Cr","v60fechadeultimacreatininaserica","v601resultadodelaultimacreatinin");lp("Glu","v61fechadeultimaglucemiasericaen","v611resultadodelaultimaglucemias");lp("CD4","v75fechadelultimoconteodelinfoci","v751valordelultimoconteodelinfoc");lp("CV","v76fechadelaultimacargaviralpara","v761valordelaultimacargaviralpar");
  const w=vxL(p.ID,"val").filter(v=>v.Peso&&vxEnRango(vxD(v.Fecha),P.ini,c)).pop();if(w){up("v62fechadeultimamediciondelpesoc",w.Fecha,"Valoración");up("v621resultadodelaultimamediciond",w.Peso,"Valoración");if(w.Talla)up("v63talla",w.Talla,"Valoración");}
  if(s.tarIni)up("v42fechadeiniciodelaterapiaantir",iso(s.tarIni),"TAR (primer esquema)");if(s.tar)up("v771fechadeiniciodelosmedicament",s.tar.Inicio,"TAR (esquema actual)");
  if(s.ing)up("v531fechadeingresoalaipsactualpa",iso(s.ing),"Paciente");if(s.dx)up("v36fechadeconfirmaciondedxinfecc",iso(s.dx),"Paciente");if(p.FechaAfiliacion)up("v14fechaafiliacionentidad",p.FechaAfiliacion,"Paciente");
  up("v98fechadecorte",iso(c),"Corte");if(nuevo)tr.push({p,k:"(todas)",a:"",v:"POR DILIGENCIAR",f:"Paciente sin arrastre CAC: completar las variables codificadas con el instructivo vigente"});
  return{D,tr,nuevo};}}
/* vih.js:795 */
function vxPcCAC(p){const t=p.PoblacionClave||"";const f=String(p.Sexo).startsWith("F");if(/^1\./.test(t))return 4;if(/^2\./.test(t))return 1;if(/^3\./.test(t))return 8;if(/^5\./.test(t))return f?3:2;if(/^4\./.test(t))return f?9:4;if(/^[67]\./.test(t))return 9;return null;}
/* vih.js:796 */
function vxCACValidar(out){const E=[];const c=vxCorte();out.forEach(x=>{const D=x.D;const fn=pdate(D.v9fechadenacimiento),fa=pdate(D.v14fechaafiliacionentidad);if(fn&&fa&&fn>fa)E.push({x,k:"v9",t:"Fecha de nacimiento posterior a la fecha de afiliación (var. 9)"});if(fn&&fn>=c)E.push({x,k:"v9",t:"Fecha de nacimiento no anterior al corte"});if(D.v10sexo==="H"&&String(D.v15mujergestante)!=="9")E.push({x,k:"v15",t:"Hombre con variable 15 distinta de 9"});["v5primeapellido","v7primernombre"].forEach(k=>{if(/[^A-Z ]/.test(String(D[k]||"")))E.push({x,k,t:"Caracteres no permitidos (tildes, símbolos o números)"});});if(!D.v14fechaafiliacionentidad)E.push({x,k:"v14",t:"Sin fecha de afiliación (no está en el libro VIH: completar desde BDUA)"});});return E;}
/* vih.js:871 */
const VX_CAC_LBL={v1ideps:"Entidad reportante",v2regimen:"Régimen de la entidad",v3tipodocumentoidentificacionusu:"Tipo de documento",v4numerodeidentificacion:"Número de documento",v5primeapellido:"Primer apellido",v6segundoapellido:"Segundo apellido (NOAP si no tiene)",v7primernombre:"Primer nombre",v8segundonombre:"Segundo nombre (NONE si no tiene)",v9fechadenacimiento:"Fecha de nacimiento",v10sexo:"Sexo H/M/I",v11codigopertenenciaetnica:"Pertenencia étnica 1-6",v12poblacionclave:"Población clave 1-9",v13codigomunicipioresidencia:"Municipio de residencia (DANE)",v14fechaafiliacionentidad:"Fecha de afiliación",v15mujergestante:"Gestante 1/2/3/9",v16menorde12meseshijodemadrre:"Menor de 12 meses hijo de madre con VIH",v17personacontuberculosisactiva:"TB activa 1/2/3",v18condicionrespectodiagnostico:"Condición frente al dx de VIH",v19fechadiagnosticogestacion:"Fecha dx de la gestación",v20fechatamizajevihprimertrimest:"Tamizaje VIH 1er trimestre",v21fechatamizajevihsegundotrimes:"Tamizaje VIH 2º trimestre",v22fechatamizajevihtercertrimest:"Tamizaje VIH 3er trimestre",v23fechadetamizajeparavihmomento:"Tamizaje VIH en el parto",v24mujercondxdevihencualquiermom:"Dx de VIH durante la gestación",v241edadgestacionalmomentodxvihd:"Edad gestacional al dx",v242recibiottoparavihdurantegest:"TAR durante la gestación",v243edadgestacionalcomienzodelat:"Edad gestacional al inicio TAR",v244tarduranteintrapartogestacio:"TAR intraparto",v245resultadogestacionreportadag:"Resultado de la gestación",v246fechaculminaciongestacionrep:"Fecha de culminación",v247supresionfarmacolactanciamat:"Supresión de la lactancia",v248tipoidentificacionreciennaci:"Tipo doc. recién nacido",v249numeroidentreciennacidovivoe:"Número doc. recién nacido",v25tipoidentificamadredemenor12m:"Tipo doc. de la madre",v251numidentificamadredelmenor12:"Número doc. de la madre",v252madredemenor12mexpuestoalvih:"Madre con dx confirmado",v26profilaxisconantirretrovrecie:"Profilaxis ARV del recién nacido",v27suministrodeformulalactea:"Fórmula láctea",v28fechapracargaviralparavihenme:"1ª CV del menor (fecha)",v281resultprimeracargaviralenmen:"1ª CV del menor (resultado)",v29fechasegundacargaviralmenor12:"2ª CV del menor (fecha)",v291resultsegundacargaviralmenor:"2ª CV del menor (resultado)",v30fechaterceracargaviralmenor18:"3ª CV del menor (fecha)",v301resultadoterceracargaviralme:"3ª CV del menor (resultado)",v31condicionfinalmenor12mesesexp:"Condición final del menor",v32fechadxtuberculosisactivarepo:"Fecha dx TB activa",v33fecharealizatamizajeparavihpe:"Tamizaje VIH en persona con TB",v34fechapruebapresuntivarapidaoe:"Fecha de la prueba presuntiva","v35comollegoapruebapresuntivapar": "Cómo llegó a la prueba presuntiva", "v36fechadeconfirmaciondedxinfecc": "Fecha de confirmación del dx de VIH", "v361entidadquereportapteconvihes": "Entidad que reporta al paciente con VIH", "v362entidadreportanteanterior": "Entidad reportante anterior", "v37fechainicioatencionporvih": "Fecha de inicio de la atención por VIH", "v38mecanismoviadetransmisiondelv": "Mecanismo de transmisión", "v39estadioclinicomomentodxninosa": "Estadio clínico al dx", "v40serealizoconteolinfocitostcd4": "¿CD4 al momento del dx?", "v401conteodelinfocitostcd4moment": "CD4 al momento del dx", "v41serealizocargaviralalmomentod": "¿CV al momento del dx?", "v411valordelacargaviralalmomento": "CV al momento del dx", "v42fechadeiniciodelaterapiaantir": "Fecha de inicio de la primera TAR", "v421medicamento1conelqueiniciola": "Medicamento 1 del inicio de TAR", "v422medicamento2conelqueiniciola": "Medicamento 2 del inicio de TAR", "v423medicamento3conelqueiniciola": "Medicamento 3 del inicio de TAR", "v424medicamento4conelqueiniciola": "Medicamento 4 del inicio de TAR", "v425medicamento5conelqueiniciola": "Medicamento 5 del inicio de TAR", "v43conteodelinfocitostcd4almomen": "¿CD4 al inicio de TAR?", "v431valorconteolinfocitostcd4mom": "CD4 al inicio de TAR", "v44cargaviralalmomentodeliniciod": "¿CV al inicio de TAR?", "v441valordelacargaviralaliniciod": "CV al inicio de TAR", "v45motivodeiniciodelatar": "Motivo de inicio de la TAR", "v46teniacoinfeccionconvirusdehep": "Coinfección VHB al inicio de TAR", "v47teniacoinfeccionconvirushepat": "Coinfección VHC al inicio de TAR", "v48teniacoinfeccioncontuberculos": "Coinfección TB al inicio de TAR", "v49nummesesdispensoformcompltarp": "Meses con dispensación completa de TAR", "v50numconsultmedasistiopersvivev": "Consultas médicas a las que asistió", "v51hatenidocambiosenelesquemaini": "¿Cambios del esquema inicial?", "v511fecprimercambiocualqumedicam": "Fecha del primer cambio", "v512causadelcambiodemedicamentoc": "Causa del cambio", "v513medicamento1queocasionoelcam": "Medicamento 1 que ocasionó el cambio", "v514medicamento2queocasionoelcam": "Medicamento 2 que ocasionó el cambio", "v515medicamento3queocasionoelcam": "Medicamento 3 que ocasionó el cambio", "v516medicamento4queocasionoelcam": "Medicamento 4 que ocasionó el cambio", "v517fallasdesdeeliniciodelatarha": "¿Fallas desde el inicio de la TAR?", "v518numerodefallasdesdeeliniciod": "Número de fallas", "v521infeccionesbacterianasmultip": "Infecciones bacterianas múltiples o recurrentes", "v522candidiasisesofagicatraqueal": "Candidiasis esofágica, traqueal o pulmonar", "v523tuberculosispulmonaroextrapu": "Tuberculosis pulmonar o extrapulmonar", "v524cancerdecervixinvasivo": "Cáncer de cérvix invasivo", "v525coccidioidomicosisdiseminada": "Coccidioidomicosis diseminada", "v526citomegaloviruscualqorganoex": "Citomegalovirus (órgano distinto de hígado, bazo o ganglios)", "v527retinitisporcitomegalovirusc": "Retinitis por citomegalovirus", "v528herpessimpleulcerasmucocutan": "Herpes simple con úlceras mucocutáneas", "v529diarreaporisosporabelliocryp": "Diarrea por Isospora o Cryptosporidium", "v5210histoplasmosisdiseminadaoex": "Histoplasmosis diseminada", "v5211linfomadeburkittinmunoblast": "Linfoma de Burkitt, inmunoblástico o primario del SNC", "v5212neumoniaporpneumocystisjiro": "Neumonía por Pneumocystis jirovecii", "v5213neumoniarecurrente": "Neumonía recurrente", "v5214septicemiaporsalmonellarecu": "Septicemia por Salmonella recurrente", "v5215infecciondiseminadaoextrapu": "Micobacterias diseminadas o extrapulmonares", "v5216criptococosisextrapulmonar": "Criptococosis extrapulmonar", "v5217sarcomadekaposi": "Sarcoma de Kaposi", "v5218sindromededesgasteasociadoa": "Síndrome de desgaste por VIH", "v5219leucoencefalopatiamultifoca": "Leucoencefalopatía multifocal progresiva", "v5220toxoplasmosiscerebral": "Toxoplasmosis cerebral", "v5221demenciaasociadaalvih": "Demencia asociada al VIH", "v5222neumoniaintersticiallinfoid": "Neumonía intersticial linfoide", "v53codigodehabdelasededelaipsdon": "Código de habilitación de la sede de la IPS", "v531fechadeingresoalaipsactualpa": "Fecha de ingreso a la IPS actual", "v532municipiodelaips": "Municipio de la IPS", "v533quienhacelaatencionclinicayf": "Quién hace la atención clínica", "v534valoracionporinfectologoenlo": "Valoración por infectología en el periodo", "v54fechadelaultimagenotipificaci": "Fecha de la última genotipificación", "v55estadioclinicoactualparaninos": "Estadio clínico actual", "v56fechadeultimocolesterolldl": "Fecha del último LDL", "v561resultadodelultimocolesterol": "Último LDL", "v57fechadeultimoniveldetriglicer": "Fecha de los últimos triglicéridos", "v571resultadodelultimoniveldetri": "Últimos triglicéridos", "v58fechadeultimahemoglobinaseric": "Fecha de la última hemoglobina", "v581resultadodelaultimahemoglobi": "Última hemoglobina", "v59fechadelaultimaenzimaalaninaa": "Fecha de la última ALT", "v591resultadodelaultimaaltotgpse": "Última ALT", "v60fechadeultimacreatininaserica": "Fecha de la última creatinina", "v601resultadodelaultimacreatinin": "Última creatinina", "v61fechadeultimaglucemiasericaen": "Fecha de la última glucemia", "v611resultadodelaultimaglucemias": "Última glucemia", "v62fechadeultimamediciondelpesoc": "Fecha del último peso", "v621resultadodelaultimamediciond": "Último peso (kg)", "v63talla": "Talla (cm)", "v64tieneneuropatiaperiferica": "Neuropatía periférica", "v65tienelipoatrofiaolipodistrofi": "Lipoatrofia o lipodistrofia", "v66tienecoinfeccionconhepatitisb": "Coinfección con hepatitis B", "v67tienecoinfeccionconhepatitisc": "Coinfección con hepatitis C", "v68tieneotuvocoinfeccioncontuber": "Coinfección con tuberculosis", "v681tipodetuberculosisactivaquep": "Tipo de tuberculosis activa", "v682lapersonaconcoinfecciontbvih": "Persona con coinfección TB/VIH (estado)", "v683fecdeiniciodeltratamantitube": "Inicio del tratamiento antituberculoso", "v684medicamento1deltratamantitub": "Antituberculoso 1", "v685medicamento2deltratamantitub": "Antituberculoso 2", "v686medicamento3deltratamantitub": "Antituberculoso 3", "v687medicamento4deltratamantitub": "Antituberculoso 4", "v688medicamento5deltratamantitub": "Antituberculoso 5", "v689medicamento6deltratamantitub": "Antituberculoso 6", "v6810medicamento7deltratamantitu": "Antituberculoso 7", "v6811medicamento8deltratamantitu": "Antituberculoso 8", "v6812medicamento9deltratamantitu": "Antituberculoso 9", "v6813fechaenqueterminoeltratamie": "Fin del tratamiento antituberculoso", "v6814condiciondeegresodeltratami": "Condición de egreso del tratamiento TB", "v69tienecirrosishepatica": "Cirrosis hepática", "v70tieneenfermedadrenalcronicapo": "Enfermedad renal crónica", "v71tieneenfermedadcoronaria": "Enfermedad coronaria", "v72tieneohatenidootrasinfeccdetr": "Otras infecciones de transmisión sexual", "v73tieneneoplasianorelacionadaco": "Neoplasia no relacionada con sida", "v74discapacidadfuncional": "Discapacidad funcional", "v75fechadelultimoconteodelinfoci": "Fecha del último CD4", "v751valordelultimoconteodelinfoc": "Último CD4", "v76fechadelaultimacargaviralpara": "Fecha de la última carga viral", "v761valordelaultimacargaviralpar": "Última carga viral", "v77recibetar": "¿Recibe TAR?", "v771fechadeiniciodelosmedicament": "Inicio de los medicamentos actuales", "v772medicamento1delataractual": "Medicamento 1 de la TAR actual", "v773medicamento2delataractual": "Medicamento 2 de la TAR actual", "v774medicamento3delataractual": "Medicamento 3 de la TAR actual", "v775medicamento4delataractual": "Medicamento 4 de la TAR actual", "v776medicamento5delataractual": "Medicamento 5 de la TAR actual", "v777medicamento6delataractual": "Medicamento 6 de la TAR actual", "v778numerodemesesquesedispensola": "Meses de TAR dispensada", "v78numerodecondonessuministrados": "Condones suministrados", "v79metododeplanificacionfamilper": "Método de planificación familiar", "v80vacunacioncontralahepatitisa": "Vacunación hepatitis A", "v81vacunacioncontralahepatitisb": "Vacunación hepatitis B", "v82vacunacioncontraneumococo": "Vacunación neumococo", "v83tamizajeclinicoparatuberculos": "Tamizaje clínico de tuberculosis", "v84sehizoppdopruebasequivalentes": "PPD o prueba equivalente", "v85recibiotratamientoparatubercu": "Tratamiento de TB latente", "v861recibiotratamientoparasifili": "Tratamiento para sífilis", "v86sehizotamizajeparasifilisenla": "Tamizaje de sífilis", "v87sehizotamizajeparavphanogenit": "Tamizaje de VPH anogenital", "v88sehizotamizajeparahepatitisbe": "Tamizaje de hepatitis B", "v89sehizotamizajeparahepatitisce": "Tamizaje de hepatitis C", "v90resultadodelaevaluacionderies": "Resultado del riesgo cardiovascular", "v91profilaxisparamacmycobacteriu": "Profilaxis para MAC", "v92profilaxisparacriptococoneofo": "Profilaxis para criptococo", "v93profilaxisparapneumocystisjir": "Profilaxis para Pneumocystis", "v94costototaldeatencionnohospita": "Costo atención no hospitalaria", "v95costototaldeatencionhospitala": "Costo atención hospitalaria", "v96numerodehospitalizacionesenel": "Hospitalizaciones en el periodo", "v97novedaddelusuariorespectoalan": "Novedad respecto al reporte anterior", "v971fechadedesafiliaciondelaenti": "Fecha de desafiliación", "v972entidadalacualsetrasladoelus": "Entidad a la que se trasladó", "v973fechademuerte": "Fecha de muerte", "v974causademuerte": "Causa de muerte", "v98fechadecorte": "Fecha de corte", "v99codigounicobduabdexpvsmsps": "Código único BDUA"};
/* vih.js:872 */
function vxCacCod(k){const m=/^v(\d+)/.exec(k);if(!m)return k;const d=m[1];if(d.length<=2)return d;const a=d.slice(0,2);return+a>=24&&+a<=99&&d.length>2?a+"."+d.slice(2):d;}
/* vih.js:873 */
function vxCacNum(k){const c=vxCacCod(k);return parseInt(c,10)||0;}
/* vih.js:874 */
function vxCacLbl(k){if(VX_CAC_LBL[k])return VX_CAC_LBL[k];return k.replace(/^v\d+/,"").replace(/^(\d)/,"").replace(/fecha/g,"fecha ").replace(/resultado/g,"resultado ").replace(/valor/g,"valor ").replace(/medicamento/g,"medicamento ").replace(/tiene/g,"tiene ").replace(/\s+/g," ").trim();}
/* vih.js:881 */
const VX_AGFREQ_DEF={"Medicina experta VIH":30,"Infectología":180,"Enfermería":30,"Química farmacéutica":90,"Psicología":180,"Trabajo social":180,"Nutrición":180,"Odontología":365};
/* vih.js:882 */
const vxAgFreq=d=>(vxCfg("agfreq",VX_AGFREQ_DEF)||VX_AGFREQ_DEF)[d]||180;
/* vih.js:884 */
const vxCitProg=(pid,d)=>vxL(pid,"cit").filter(x=>x.Estado==="Programada"&&(!d||x.Disciplina===d)).sort((a,b)=>a.Fecha.localeCompare(b.Fecha));
/* vih.js:886 */
function vxAgEstado(p,d){const t=TODAY();const at=vxL(p.ID,"cit").filter(x=>x.Disciplina===d&&x.Estado==="Asistió").map(x=>vxD(x.Fecha)).filter(Boolean).sort((a,b)=>a-b);const last=at[at.length-1]||null;const pr=vxCitProg(p.ID,d)[0];const f=vxAgFreq(d);
 const base=last||vxD(p.FechaIngresoIPS)||t;const due=addDays(base,f);
 if(pr)return{d,last,due,pr,cls:"ok",txt:"agendado "+pr.Fecha};
 if(due<=t)return{d,last,due,cls:"bad",txt:(last?"vencido desde "+iso(due):"sin primera atención"),dias:dayDiff(due,t)};
 if(due<=addDays(t,7))return{d,last,due,cls:"warn",txt:"vence "+iso(due)};
 return{d,last,due,cls:"ok",txt:"próximo "+iso(due)};}
/* vih.js:893 */
function vxPuedeAgendar(pid,d,exceptId){const L=vxCitProg(pid,d).filter(x=>x.ID!==exceptId);return L.length?L[0]:null;}
/* vih.js:933 */
const VX_SMAQ=[["q1","¿Alguna vez olvida tomar la medicación?",["Sí","No"]],["q2","¿Toma siempre los fármacos a la hora indicada?",["Sí","No"]],["q3","¿Alguna vez deja de tomar los fármacos si se siente mal?",["Sí","No"]],["q4","¿Olvidó tomar la medicación durante el fin de semana?",["Sí","No"]],["q5","En la última semana, ¿cuántas veces no tomó alguna dosis?",["Ninguna","1 a 2","3 a 5","6 a 10","Más de 10"]],["q6","Desde la última visita, ¿cuántos días completos no tomó la medicación?",null]];
/* vih.js:934 */
function vxSmaqRes(d){if(!d||!d.q1)return"";const no=d.q1==="Sí"||d.q2==="No"||d.q3==="Sí"||d.q4==="Sí"||["3 a 5","6 a 10","Más de 10"].includes(d.q5)||num(d.q6)>2;return no?"No adherente":"Adherente";}
/* vih.js:937 */
const VX_TARCHK=[["c1","Conciliación medicamentosa (TAR previo y medicamentos no TAR)"],["c2","Interacciones farmacológicas revisadas"],["c3","Función renal revisada (TFG) si el esquema tiene tenofovir"],["c4","Estado de hepatitis B revisado (HBsAg) antes de iniciar o suspender tenofovir o lamivudina"],["c5","HLA-B*5701 negativo si el esquema tiene abacavir"],["c6","Gestación o deseo reproductivo considerado"],["c7","Genotipo revisado si el cambio es por falla virológica"],["c8","Educación al paciente sobre dosis, horario y efectos adversos"]];
/* vih.js:938 */
function vxTarChkApl(p,esq,motivo){const s=vxSt(p,TODAY());const q=VXQ[esq]||{c:[]};return{c3:q.c.some(m=>m==="TDF"),c4:q.c.some(m=>["TDF","TAF","3TC","FTC"].includes(m))||!!(s.tar&&VXQ[s.tar.Esquema]&&VXQ[s.tar.Esquema].c.some(m=>["TDF","TAF","3TC","FTC"].includes(m))),c5:q.c.includes("ABC"),c6:String(p.Sexo).startsWith("F"),c7:motivo==="Falla virológica"};}
/* vih.js:1070 */
const VX_FTXT={S:"Cada 6 meses",A:"Cada año",I:"Solo al ingreso",N:"Según condición"};
/* vih.js:1071 */
function vxLabPlan(p,ref){ref=ref||TODAY();const key="lp|"+p.ID+"|"+iso(ref);if(VX.memo[key])return VX.memo[key];const id=p.ID;const s=vxSt(p,ref);const C=vxContrato(p.EPS);const out=[];const last=k=>vxLast(id,k,ref);
 C.items.forEach(([k,f,txt,obs])=>{const e=VXE[k];if(!e||["CD4P","CD8"].includes(k))return;const r=last(k);const d=r?r._d:null;const row={k,f,txt,obs,last:d,next:null,est:"",mot:""};
  const per=(m)=>{row.next=d?addMonths(d,m):null;row.est=!d?"Faltante":row.next<=ref?"Vencido":row.next<=addDays(ref,30)?"Próximo":"Vigente";};
  if(s.expuesto){row.est="No aplica";row.mot="menor expuesto";out.push(row);return;}
  if(f==="S")per(6);
  else if(f==="A"){if((k==="AntiHBc"||k==="HBsAg")){const ah=vxVal(last("AntiHBs"));if(ah!=null&&ah>=10){row.est="No requerido";row.mot="anti-HBs protector";out.push(row);return;}}
   if(k==="VDRL"&&vxPos(r)){per(6);row.mot="prueba reactiva: seguimiento semestral";}else if(k==="AntiVHC"&&s.vhc){row.est="No aplica";row.mot="coinfección VHC: seguimiento con carga viral";}else per(12);}
  else if(f==="I"){row.est=r?"Realizado":"Faltante";row.mot=r?"solo al ingreso":"";}
  else{const cd=s.cd4v;let need=false;
   if(k==="Toxo"){need=cd!=null&&cd<200&&!r;row.mot="CD4 menor de 200";}
   if(k==="CrAg"){need=cd!=null&&cd<100&&(!d||d<addMonths(ref,-6));row.mot="CD4 menor de 100";}
   if(k==="Histo"){need=cd!=null&&cd<50&&(!d||d<addMonths(ref,-6));row.mot="CD4 menor de 50";}
   if(k==="BT"){need=!!(s.tar&&/ATV/.test(s.tar.Esquema))&&(!d||d<addMonths(ref,-6));row.mot="tratamiento con atazanavir";}
   if(k==="HLAB5701"){need=!!(s.tar&&/ABC/.test(s.tar.Esquema))&&!vxL(id,"lab").some(x=>x.Examen==="HLAB5701");row.mot="esquema con abacavir";}
   if(k==="GENO"){need=vxFalla(id,addMonths(ref,-12),ref)&&!vxLabIn(id,"GENO",addMonths(ref,-12),ref);row.mot="falla virológica";}
   if(k==="HbA1c"){need=false;}
   row.est=need?"Faltante":r?"Realizado":"Sin indicación";}
  if(k==="CV"&&s.cv6&&num(s.cv6.Valor)>=200&&row.est==="Vigente"){row.est="Faltante";row.mot="carga viral detectable: control";}
  out.push(row);});
 return VX.memo[key]=out;}
/* vih.js:1092 */
function vxDue(p,mes){const me=monthEnd(pdate(mes+"-01"));return vxLabPlan(p,me).filter(x=>["Faltante","Vencido"].includes(x.est)).map(x=>({k:x.k,o:x.est+(x.mot?" · "+x.mot:x.last?" (último "+iso(x.last)+")":""),t:x.txt}));}
/* vih.js:1108 */
function vxPPD(p,ref){ref=ref||TODAY();const s=vxSt(p,ref);const L=vxL(p.ID,"prc").filter(x=>x.Tipo==="Tuberculina (PPD)");const pos=L.find(x=>/Positiva/.test(x.Resultado||""))||(vxPos(vxLast(p.ID,"IGRA",ref))?{FechaLectura:iso(vxLast(p.ID,"IGRA",ref)._d),Lectura:"IGRA"}:null);const lt=L[L.length-1];
 if(s.expuesto)return{est:"No aplica",cls:"base"};
 if(s.tbAlgunaVez)return{est:"No indicada: TB activa o previa",cls:"base"};
 if(pos){const tto=vxPrfIn(p.ID,/TB latente/,addMonths(ref,-60),ref);return tto?{est:"Positiva en tratamiento o tratada de TB latente",cls:"ok",fecha:pos.FechaLectura}:{est:"Positiva sin tratamiento de TB latente",cls:"bad",fecha:pos.FechaLectura,acc:"prf"};}
 if(lt&&lt.Estado==="Ordenado")return{est:"Ordenada, por aplicar",cls:"warn",fecha:lt.Ordenado,x:lt};
 if(lt&&lt.Estado==="Aplicado"){const a=pdate(lt.Fecha);const dd=dayDiff(a,ref);return{est:dd<2?"Aplicada, leer entre "+iso(addDays(a,2))+" y "+iso(addDays(a,3)):dd<=3?"Por leer hoy (ventana 48 a 72 h)":"Lectura vencida (más de 72 h): repetir",cls:dd<=3?"warn":"bad",fecha:lt.Fecha,x:lt};}
 if(lt&&lt.Estado==="Leída"){const nx=addMonths(pdate(lt.FechaLectura||lt.Fecha),12);return nx<=ref?{est:"Vencida: repetir (anual)",cls:"bad",fecha:iso(nx)}:{est:"Negativa, próxima "+iso(nx),cls:"ok",fecha:iso(nx),next:nx};}
 return{est:"Pendiente: nunca realizada",cls:"bad"};}
/* vih.js:1116 */
function vxCit(p,tipo,ref){ref=ref||TODAY();const s=vxSt(p,ref);const fem=String(p.Sexo).startsWith("F");const ed=s.edad;
 const apl=tipo==="Citología cervicovaginal"?(fem&&ed!=null&&ed>=25&&ed<=65):(vxHSH(p)||p.PracticaAnal==="Sí"||/^5\./.test(p.PoblacionClave||""));
 if(s.expuesto||!apl){if(tipo==="Citología anal"&&!p.PracticaAnal&&ed>=18&&!vxHSH(p))return{est:"Caracterizar prácticas sexuales",cls:"info",car:true};return{est:"No aplica",cls:"base"};}
 const L=vxL(p.ID,"prc").filter(x=>x.Tipo===tipo||(x.Tipo==="ADN-VPH"&&tipo==="Citología cervicovaginal"));const lt=L[L.length-1];
 if(!lt)return{est:"Pendiente: sin tamizaje",cls:"bad"};
 if(lt.Estado==="Ordenado")return{est:"Ordenada, por tomar",cls:"warn",fecha:lt.Ordenado,x:lt};
 if(lt.Estado==="Tomada")return{est:"Tomada, resultado pendiente",cls:"warn",fecha:lt.Fecha,x:lt};
 const anor=lt.Resultado&&!/^Negativo|ADN-VPH negativo/.test(lt.Resultado)&&!/insatisfactoria/i.test(lt.Resultado);
 if(/insatisfactoria/i.test(lt.Resultado||""))return{est:"Muestra insatisfactoria: repetir",cls:"bad",fecha:lt.FechaLectura||lt.Fecha};
 if(anor&&!lt.Conducta)return{est:"Anormal ("+lt.Resultado+") sin conducta registrada",cls:"bad",fecha:lt.FechaLectura||lt.Fecha,x:lt,acc:"cond"};
 const nx=addMonths(pdate(lt.FechaLectura||lt.Fecha),12);if(anor)return{est:"Anormal en seguimiento: "+lt.Conducta,cls:"warn",fecha:lt.FechaLectura};
 return nx<=ref?{est:"Vencida: repetir (anual)",cls:"bad",fecha:iso(nx)}:{est:"Negativa, próxima "+iso(nx),cls:"ok",fecha:iso(nx),next:nx};}
/* vih.js:1128 */
function vxPrcPend(p){const o=[];const a=vxPPD(p);if(["bad","warn"].includes(a.cls))o.push({t:"Tuberculina (PPD)",est:a.est,fecha:a.fecha});["Citología cervicovaginal","Citología anal"].forEach(t=>{const c=vxCit(p,t);if(["bad","warn"].includes(c.cls)||c.car)o.push({t,est:c.est,fecha:c.fecha});});return o;}
return { esc, pad, iso, fd, ym, addDays, addMonths, monthStart, monthEnd, dayDiff, nowTs, pdate, num, norm, f1, pct, money, VX_CAC_COLS, VXS, VXK, VX_EPS, VX_EPSCODE_DEF, VX_REG, VX_MUN, VX_MUN_ALIAS, VX_PCLAVE, VX_TINGR, VX_ESTADO, VX_MODAL, VX_DISC, VX_DISC_ACT, VX_CITEST, VX_CITTIPO, VX_MOTINAS, VX_NOV, VX_PRC, VX_PRF, VX_EX, VXE, VX_CONTRATO_DEF, VX_GUIA_DIF, VX_MED, VX_CLASES, VX_ESQ, VXQ, VX_GPC_PREF, VX_VAC, VXV, VX_VACEST, vxLive, vxD, vxNom, vxCorte, vxMunCode, vxMunName, vxCfg, vxNewBook, vxEdad, vxGrupoEtario, vxF, vxPct, vxIdx, vxPacs, vxP, vxL, vxLast, vxFirst, vxVal, vxPos, vxCVind, vxFmtLab, vxPeriodo, vxActivo, vxTarAt, vxTarIni, vxUltEnt, vxCobertura, vxUltAtencion, vxNovAt, vxSt, vxVacEstado, vxVacCompleta, vxContrato, vxHSH, vxSolRecs, vxSolTieneRes, vxAlertas, vxTFG, VX_GPC14, vxEnRango, vxLabIn, vxPrcIn, vxPrfIn, vxHospVIH, vxFalla, vxR, vxUP, vxDOWN, vxLB, vxSemRng, VX_IND, VXI, vxRng, vxNivel, vxRngTxt, vxFiltro, vxPer, vxCalc, vxCalcBy, VX_AGFREQ_DEF, vxAgFreq, vxCitProg, vxAgEstado, vxPuedeAgendar, VX_SMAQ, vxSmaqRes, VX_TARCHK, vxTarChkApl, VX_FTXT, vxLabPlan, vxDue, vxPPD, vxCit, vxPrcPend, VX_PAQ_DEF, vxPaq, vxFactMes, vxProdMes, vxDiscMes, VX_NOM_COLS, vxNominalRows, vxNomRow, vxNominalValidar, vxCACRows, vxCACRow, vxPcCAC, vxCACValidar, VX_CAC_LBL, vxCacCod, vxCacNum, vxCacLbl, VX, TODAY };
}
