// GENERADO por packages/clinical-rules/scripts/extraer-reglas.mjs a partir de apps/web/public/modulos/.
// NO EDITAR A MANO: cualquier cambio de regla se hace en el código del módulo y se vuelve a extraer.
// Las referencias «portal.js:línea» son líneas de apps/web/public/modulos/portal/portal.js; las de Nefroprotección, de nefro/ruta-*.js.
// Hemodiálisis: índice por paciente, indicadores CAC e institucionales, semáforo, alertas, calidad del dato y de diálisis,
// calendario de laboratorios, vacunación VHB, trasplante, facturación y valores de la matriz CAC.
export function crearMotorHD(ctx) {
"use strict";
const __hoy = ctx && ctx.hoy ? new Date(ctx.hoy) : new Date();
const TODAY = () => new Date(__hoy.getFullYear(), __hoy.getMonth(), __hoy.getDate());
const XLSX = ctx && ctx.XLSX;
/* Estado que en el prototipo vivía en la pantalla. ctx.libro: el libro de hemodiálisis (mismas hojas y columnas). */
const ST = { book: ctx.libro, corte: ctx.corte ? new Date(ctx.corte) : TODAY(), ps: null, eps: ctx.eps || "", ui: {}, fin: { data: ctx.facturacion || null } };
/* Libro institucional (ctx.portal): Hemodiálisis lee de él la hoja Microbiología para confirmar las ITS-CVC. */
const PX = { book: ctx.portal || null };
ST.ps = ctx.inicioPeriodo ? new Date(ctx.inicioPeriodo) : cacStart(ST.corte); // cacStart es una declaración de función (se eleva)
/* portal.js:6 */
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
/* portal.js:7 */
const pad=n=>String(n).padStart(2,"0");
/* portal.js:8 */
const iso=d=>d?d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate()):"";
/* portal.js:9 */
const fd=d=>d?pad(d.getDate())+"/"+pad(d.getMonth()+1)+"/"+d.getFullYear():"";
/* portal.js:10 */
const ym=d=>d.getFullYear()+"-"+pad(d.getMonth()+1);
/* portal.js:12 */
const addDays=(d,k)=>new Date(d.getFullYear(),d.getMonth(),d.getDate()+k);
/* portal.js:13 */
function addMonths(d,m){const t=new Date(d.getFullYear(),d.getMonth()+m,1);const last=new Date(t.getFullYear(),t.getMonth()+1,0).getDate();return new Date(t.getFullYear(),t.getMonth(),Math.min(d.getDate(),last));}
/* portal.js:14 */
const monthStart=d=>new Date(d.getFullYear(),d.getMonth(),1);
/* portal.js:15 */
const monthEnd=d=>new Date(d.getFullYear(),d.getMonth()+1,0);
/* portal.js:16 */
const dayDiff=(a,b)=>Math.round((b-a)/864e5);
/* portal.js:17 */
const nowTs=()=>{const d=new Date();return iso(d)+" "+pad(d.getHours())+":"+pad(d.getMinutes());};
/* portal.js:18 */
function pdate(v){
  if(v==null||v==="")return null;
  if(v instanceof Date)return isNaN(v)?null:new Date(v.getFullYear(),v.getMonth(),v.getDate());
  if(typeof v==="number"){if(v<1000)return null;const d=new Date(Math.round((v-25569)*864e5));return new Date(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate());}
  const s=String(v).trim();let m=/^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);if(m)return new Date(+m[1],+m[2]-1,+m[3]);
  m=/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/.exec(s);if(m){let d=+m[1],mo=+m[2];if(mo>12&&d<=12){const t=d;d=mo;mo=t;}if(mo<1||mo>12||d<1||d>31)return null;return new Date(+m[3],mo-1,d);}
  return null;
}
/* portal.js:26 */
function num(v){if(v==null||v==="")return null;if(typeof v==="number")return isFinite(v)?v:null;const s=String(v).replace(",",".").replace(/[^\d.\-]/g,"");if(s===""||s==="-"||s===".")return null;const n=parseFloat(s);return isFinite(n)?n:null;}
/* portal.js:27 */
const norm=s=>String(s==null?"":s).normalize("NFD").replace(/[̀-ͯ]/g,"").toUpperCase().replace(/\s+/g," ").trim();
/* portal.js:28 */
const f1=(v,n)=>v==null||isNaN(v)?"—":Number(v).toLocaleString("es-CO",{minimumFractionDigits:n==null?1:n,maximumFractionDigits:n==null?1:n});
/* portal.js:29 */
const pct=v=>v==null||isNaN(v)?"—":f1(v*100)+" %";
/* portal.js:30 */
const money=v=>v==null||isNaN(v)?"—":"$ "+Math.round(v).toLocaleString("es-CO");
/* portal.js:37 */
const EPS_L=["NUEVA EPS","MALLAMAS","FOMAG","FAMILIAR DE COLOMBIA","EMSSANAR","OTRA"];
/* portal.js:38 */
function epsList(){const s=new Set(EPS_L);if(ST&&ST.book)ST.book.pac.forEach(p=>{if(p.EPS)s.add(p.EPS);});return[...s];}
/* portal.js:39 */
const TURNOS_DEF=[{n:"L-M-V Mañana",d:[1,3,5],j:"Mañana"},{n:"L-M-V Tarde",d:[1,3,5],j:"Tarde"},{n:"M-J-S Mañana",d:[2,4,6],j:"Mañana"},{n:"M-J-S Tarde",d:[2,4,6],j:"Tarde"},{n:"M-J-V Mañana",d:[2,4,5],j:"Mañana"},{n:"M-J-V Tarde",d:[2,4,5],j:"Tarde"}];
/* portal.js:40 */
function turnosCfg(){return(ST.book&&ST.book.cfgv.turnos)||TURNOS_DEF;}
/* portal.js:41 */
function turnoNames(){return turnosCfg().map(t=>t.n);}
/* portal.js:42 */
const DIAS_L=["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
/* portal.js:43 */
const ESTADOS_SES=[["Realizada","Realizada","e-r"],["No asistió","No asistió","e-n"],["Canceló con aviso","Canceló","e-c"],["Suspendida","Suspendida","e-s"]];
/* portal.js:45 */
const MOTIVOS=[["Hospitalización","Clínico"],["Enfermedad intercurrente sin hospitalización","Clínico"],["Falleció","Clínico"],["Viaje o diálisis en otra unidad","Paciente"],["Sin transporte","Paciente"],["Calamidad o problema familiar","Paciente"],["No informa / no contactado","Paciente"],["Decide no asistir","Paciente"],["Cita médica externa","Paciente"],["Autorización de la EPS vencida o negada","EPS"],["Transporte a cargo de la EPS no disponible","EPS"],["Falla de máquina o planta de agua","IPS"],["Falta de insumo","IPS"],["Falta de personal","IPS"],["Otro","Otro"]];
/* portal.js:46 */
const MOT_RESP=Object.fromEntries(MOTIVOS);
/* portal.js:47 */
const CAUSA_HOSP=["Infección del acceso / ITS-CVC","Otra infección","Sobrecarga hídrica / edema pulmonar","Hiperpotasemia u otro trastorno metabólico","Síndrome coronario / falla cardiaca","Arritmia","Evento cerebrovascular","Sangrado digestivo","Disfunción o trombosis del acceso","Fractura o trauma","Cirugía programada","Otra"];
/* portal.js:48 */
const ATRIB=["Sí","No","En estudio"];
/* portal.js:49 */
const MOT_EXTRA=["Sobrecarga hídrica","Hiperpotasemia","Sesión previa incompleta","Prescripción de más de 3 sesiones por semana","Reposición de sesión perdida","Otro"];
/* portal.js:50 */
const ACCESOS=["FAV","Injerto","CVC tunelizado","CVC temporal"];
/* portal.js:51 */
const isCVC=a=>/^CVC/.test(a||"");
/* portal.js:52 */
const ITS="Bacteriemia asociada a catéter (ITS-CVC)";
/* portal.js:53 */
const EVENTOS=["Hipotensión intradialítica","Hipertensión intradialítica","Calambres musculares","Náuseas / vómitos","Cefalea","Hipoglucemia","Hiperpotasemia","Reacción al dializador","Coagulación del circuito","Sangrado del acceso vascular","Disfunción del acceso (flujo bajo)",ITS,"Infección del sitio de salida o túnel","Infección de FAV o injerto","Arritmia","Dolor torácico","Fiebre / escalofríos","Síndrome de desequilibrio","Embolismo aéreo","Prurito","Síncope","Caída","Error de medicación","Otro"];
/* portal.js:54 */
const SEV=["Leve","Moderada","Severa"];
/* portal.js:55 */
const RESUELTO=["Sí","No","En seguimiento"];
/* portal.js:56 */
const HEMOC=["Positivo","Negativo","Pendiente","No tomado"];
/* portal.js:57 */
const NOV_TIPOS=["Hospitalización","Viaje / traslado temporal","Otra"];
/* portal.js:58 */
const MOV_EGRESO=["Fallecimiento","Trasplante","Traslado a otra unidad","Cambio a DP","Abandono","Recuperación de función","Otro egreso"];
/* portal.js:59 */
const MOV_TIPOS=MOV_EGRESO.concat(["Reingreso"]);
/* portal.js:60 */
const EGRESO_ESTADO={"Fallecimiento":"Fallecido","Trasplante":"Trasplantado","Traslado a otra unidad":"Trasladado","Cambio a DP":"Cambio a DP","Abandono":"Abandono","Recuperación de función":"Recuperación de función","Otro egreso":"Inactivo"};
/* portal.js:61 */
const RUTA=["Sin valorar","Remitido a cirugía vascular","Doppler o mapeo vascular","FAV creada, en maduración","FAV lista, pendiente de punción","No factible (concepto especializado)","Desistimiento firmado","Cuidados paliativos"];
/* portal.js:62 */
const RUTA_EXCL=["No factible (concepto especializado)","Desistimiento firmado","Cuidados paliativos"];
/* portal.js:63 */
const ACC_NOV=["Disfunción / bajo flujo","Trombosis","Infección del sitio de salida","Infección del túnel","Sangrado del acceso","Inserción de catéter tunelizado","Inserción de catéter temporal","Recambio de catéter","Retiro de catéter","Creación de FAV","Primera punción de FAV","Angioplastia o trombectomía","Pérdida de FAV","Remisión a cirugía vascular","Otro"];
/* portal.js:64 */
const ACC_NOV_RES={"Inserción de catéter tunelizado":"CVC tunelizado","Inserción de catéter temporal":"CVC temporal","Primera punción de FAV":"FAV"};
/* portal.js:65 */
const TX=["Sin evaluar","No idóneo (contraindicación con soporte)","Disentimiento","Cuidados paliativos","Idóneo, en estudio","En lista de espera","Trasplantado"];
/* portal.js:66 */
const PROCED=["Prediálisis de la IPS","Urgencia","Traslado de otra unidad","Otra"];
/* portal.js:67 */
const MEDIOS=["Llamada","Mensaje","Visita","Acudiente","SIAU","Notificación a EPS"];
/* portal.js:68 */
const RESULT_CTC=["Contactado, asistirá","Contactado, no asistirá","No contesta","Número errado","Hospitalizado","Falleció","Otro"];
/* portal.js:69 */
const DISCIPLINAS=["Nefrología","Medicina general o experto","Medicina interna","Enfermería","Nutrición","Psicología","Trabajo social","Química farmacéutica","Endocrinología","Oftalmología"];
/* portal.js:71 */
const EXAMS=[
 {k:"Hb",l:"Hemoglobina",u:"g/dL",lo:3,hi:20,f:"M"},{k:"Hto",l:"Hematocrito",u:"%",lo:9,hi:65,f:"M"},{k:"BUNpre",l:"BUN pre-diálisis",u:"mg/dL",lo:5,hi:250,f:"M"},{k:"BUNpost",l:"BUN post-diálisis",u:"mg/dL",lo:1,hi:150,f:"M"},
 {k:"KtV",l:"Kt/V (spKt/V)",u:"",lo:0.3,hi:3.5,f:""},{k:"URR",l:"PRU (URR)",u:"%",lo:10,hi:95,f:""},{k:"Creat",l:"Creatinina",u:"mg/dL",lo:0.3,hi:30,f:"M"},
 {k:"K",l:"Potasio",u:"mEq/L",lo:1.5,hi:9,f:"M"},{k:"Na",l:"Sodio",u:"mEq/L",lo:110,hi:170,f:"M"},{k:"Ca",l:"Calcio total",u:"mg/dL",lo:4,hi:16,f:"M"},{k:"P",l:"Fósforo",u:"mg/dL",lo:0.5,hi:15,f:"M"},
 {k:"Alb",l:"Albúmina",u:"g/dL",lo:1,hi:6,f:"T"},{k:"PTH",l:"PTH",u:"pg/mL",lo:1,hi:5000,f:"T"},{k:"FA",l:"Fosfatasa alcalina",u:"U/L",lo:10,hi:3000,f:"T"},{k:"Ferritina",l:"Ferritina",u:"ng/mL",lo:1,hi:5000,f:"T"},{k:"TSAT",l:"Saturación de transferrina",u:"%",lo:1,hi:100,f:"T"},
 {k:"HbA1c",l:"HbA1c",u:"%",lo:3,hi:20,dm:true,f:"T"},{k:"AntiVHC",l:"Anti-VHC",txt:["No reactivo","Reactivo"],f:"S"},{k:"HBsAg",l:"HBsAg",txt:["No reactivo","Reactivo"],f:"S"},{k:"VIH",l:"VIH (tamizaje)",txt:["No reactivo","Reactivo"],f:"S"},
 {k:"AntiHBs",l:"Anti-HBs",u:"mUI/mL",lo:0,hi:100000,f:"A"},{k:"AntiHBc",l:"Anti-HBc total",txt:["No reactivo","Reactivo"],f:"I"},{k:"ColT",l:"Colesterol total",u:"mg/dL",lo:40,hi:600,f:"A"},{k:"HDL",l:"HDL",u:"mg/dL",lo:5,hi:150,f:"A"},{k:"LDL",l:"LDL",u:"mg/dL",lo:5,hi:500,f:"A"},{k:"TG",l:"Triglicéridos",u:"mg/dL",lo:20,hi:3000,f:"A"},
 {k:"AcUrico",l:"Ácido úrico",u:"mg/dL",lo:0.5,hi:20,f:""},{k:"PO",l:"Parcial de orina",txt:["Normal","Alterado","Anuria"],f:""},{k:"EKG",l:"Electrocardiograma",txt:["Normal","Alterado"],f:"A"},
 {k:"CVVHC",l:"Carga viral VHC",txt:["No detectable","Detectable"],f:""},{k:"TAS",l:"TA sistólica de consulta",u:"mmHg",lo:60,hi:260,f:""},{k:"EscalaCV",l:"Escala de calidad de vida",u:"puntaje",lo:0,hi:1000,f:"A"}
];
/* portal.js:81 */
const EX=Object.fromEntries(EXAMS.map(e=>[e.k,e]));
/* portal.js:82 */
const FREQ_TXT={M:"Mensual",T:"Trimestral",S:"Semestral",A:"Anual",I:"Al ingreso","":"A demanda"};
/* portal.js:84 */
const ANCHOR_DEF={T:1,S:10,A:4};
/* portal.js:85 */
const META_DEF={hbLo:10,hbHi:11.5,pLo:2.5,pHi:5.5,caHi:10.2,pthLo:130,pthHi:600,ktv:1.2,ktvObj:1.4,alb:4,kLo:3.5,kHi:5.5,a1c:7.5,gidPct:4,tasHi:140,ferrHi:500,tsatLo:20,tsatHi:30};
/* portal.js:86 */
const CFG_DEF={puestos:13,durDefault:240,minSes:{"NUEVA EPS":10,"MALLAMAS":8,"FOMAG":8,"FAMILIAR DE COLOMBIA":8,"EMSSANAR":8,"OTRA":8},maxSes:{"NUEVA EPS":15,"MALLAMAS":12,"FOMAG":12,"FAMILIAR DE COLOMBIA":15,"EMSSANAR":12,"OTRA":13},freq:{},anchor:ANCHOR_DEF,ktvMetodo:"Daugirdas II (spKt/V)",turnos:null,metas:{},metaPac:META_DEF,
  ips:{codigo:"860010090801",nombre:"POSMEDICA GROUP S.A.S.",depto:"PUTUMAYO"},epsCod:{"FOMAG":"RES004"},
  vacEsq:[{n:"Engerix-B 40 µg (2 × 20 µg) · meses 0-1-2-6",m:[0,1,2,6]},{n:"Recombivax HB 40 µg, formulación diálisis · meses 0-1-6",m:[0,1,6]}],
  txItems:["Proceso · Concepto de idoneidad por nefrología","Proceso · Información al paciente y decisión documentada","Proceso · Remisión a la IPS trasplantadora","Proceso · Valoración en la IPS trasplantadora","Proceso · Inscripción en lista de espera",
   "Inmunología · Grupo sanguíneo ABO","Inmunología · Tipificación HLA (IPS trasplantadora)","Inmunología · Anticuerpos anti-HLA (IPS trasplantadora)",
   "Infecciones · VIH","Infecciones · VHB: HBsAg, anti-HBc y anti-HBs","Infecciones · VHC","Infecciones · CMV IgG","Infecciones · Epstein-Barr IgG","Infecciones · Varicela zóster IgG","Infecciones · Sífilis","Infecciones · Tuberculosis latente (tamizaje)","Infecciones · Strongyloides y Chagas (zona endémica)","Infecciones · Vacunación completa antes del trasplante",
   "Cardiovascular · Electrocardiograma","Cardiovascular · Ecocardiograma (2 años o más en diálisis o riesgo de hipertensión pulmonar)","Cardiovascular · Prueba no invasiva de isquemia (alto riesgo)","Cardiovascular · Evaluación de enfermedad arterial periférica",
   "Otros · Radiografía de tórax (TAC si fumador pesado)","Otros · Tamización de cáncer según edad y sexo","Otros · Valoración psicosocial","Otros · PTH y perfil hepático","Otros · Valoración odontológica (según la IPS trasplantadora)","Otros · Valoración urológica (según la IPS trasplantadora)"]};
/* portal.js:94 */
const MUN_DANE={"MOCOA":"86001","COLON":"86219","ORITO":"86320","PUERTO ASIS":"86568","PUERTO CAICEDO":"86569","PUERTO GUZMAN":"86571","PUERTO LEGUIZAMO":"86573","LEGUIZAMO":"86573","SIBUNDOY":"86749","SAN FRANCISCO":"86755","SAN MIGUEL":"86757","SANTIAGO":"86760","VALLE DEL GUAMUEZ":"86865","VILLAGARZON":"86885"};
/* portal.js:96 */
const AEE=["Eritropoyetina alfa","Darbepoetina alfa"];
/* portal.js:99 */
const SH={
 pac:["Pacientes",["ID","TipoDoc","Documento","Apellidos","Nombres","FechaNac","Sexo","EPS","Regimen","Afiliacion","FechaAfiliacion","Municipio","MunicipioDANE","Zona","Direccion","Barrio","Telefono","Acudiente","TelAcudiente","Etnia","GrupoPob","Discapacidad","HTA","FechaDxHTA","DM","DMTipo","FechaDxDM","Dislipidemia","Etiologia","Talla","FechaDxERC5","TFGInicio","ModoInicio","InicioTRR","IngresoUnidad","IngresoPrograma","Procedencia","AccesoInicial","Estado","FechaEstado","CausaMuerte","Turno","Puesto","SesSemana","DuracionMin","PesoSeco","AccesoActual","AccesoDesde","RutaAcceso","SoporteRuta","FechaRuta","TxEstado","TxFecha","TxIPS","TxContra","VacunaVHB","VHBNoRespondedor","Paratiroidectomia","BDUA","NovedadCAC","Metas","Obs","Usuario","Actualizado"]],
 mov:["Movimientos",["ID","Paciente","Fecha","Tipo","Detalle","Usuario","Registrado","Anulado","MotivoAnulacion"]],
 ses:["Sesiones",["ID","Fecha","Paciente","Turno","Puesto","Tipo","MotivoExtra","PorContrato","Reprograma","Estado","Motivo","Responsable","Nota","DuracionMin","Acceso","PesoPre","PesoPost","TASPre","TADPre","TASPost","TADPost","Gluco","KtVOCM","UFNeta","UFR","UFMaquina","Usuario","Registrado","Anulado","MotivoAnulacion"]],
 evt:["Eventos",["ID","Fecha","Paciente","Sesion","Tipo","Severidad","Conducta","Resuelto","Hemocultivo","Microorganismo","Resistencia","FechaCierre","ReporteSP","Usuario","Registrado","Anulado","MotivoAnulacion"]],
 lab:["Paraclinicos",["ID","Paciente","FechaToma","Examen","Valor","Metodo","Usuario","Registrado","Anulado","MotivoAnulacion"]],
 nov:["Novedades",["ID","Paciente","Tipo","Inicio","Fin","Descripcion","Causa","Atribuible","Evitable","Usuario","Registrado","Anulado","MotivoAnulacion"]],
 ctc:["Contactos",["ID","Paciente","Fecha","Medio","Resultado","Nota","Usuario","Registrado"]],
 acn:["AccesoNovedades",["ID","Paciente","Fecha","Tipo","Detalle","AccesoResultante","Usuario","Registrado","Anulado","MotivoAnulacion"]],
 ate:["Atenciones",["ID","Paciente","Fecha","Disciplina","Nota","Usuario","Registrado","Anulado","MotivoAnulacion"]],
 val:["Valoraciones",["ID","Paciente","Fecha","Mes","Profesional","PesoSeco","Diuresis","CalidadPuntaje","CalidadCategoria","EnfermedadActual","Analisis","Plan","Datos","Usuario","Registrado","Anulado","MotivoAnulacion"]],
 seg:["SeguridadPaciente",["ID","Fecha","Paciente","Clasificacion","Categoria","Severidad","Descripcion","AccionInmediata","Analisis","Causas","PlanMejora","Responsable","Estado","FechaCierre","Evento","Usuario","Registrado","Anulado","MotivoAnulacion"]],
 atb:["Antimicrobianos",["ID","Paciente","Inicio","Fin","Antimicrobiano","Dosis","Via","Indicacion","Tipo","CultivoPrevio","Ajustado","Evento","Nota","Usuario","Registrado","Anulado","MotivoAnulacion"]],
 aud:["Auditorias",["ID","Fecha","Tipo","Observadas","Cumplidas","Observador","Nota","Usuario","Registrado","Anulado","MotivoAnulacion"]],
 med:["Prescripciones",["ID","Paciente","Medicamento","Dosis","Frecuencia","Via","Lugar","CantidadMes","Unidad","Inicio","Fin","Mipres","Nota","Usuario","Registrado","Anulado","MotivoAnulacion"]],
 dis:["Dispensacion",["ID","Mes","Paciente","Prescripcion","Medicamento","Prescrita","Entregada","Estado","Motivo","Fecha","Usuario","Registrado","Anulado","MotivoAnulacion"]],
 est:["Estudios",["ID","Paciente","Fecha","Tipo","Nombre","Resultado","Relevante","Seguimiento","ProximoControl","Soporte","Usuario","Registrado","Anulado","MotivoAnulacion"]],
 vac:["Vacunas",["ID","Paciente","Vacuna","Esquema","Serie","NumDosis","Fecha","Lote","Observacion","Usuario","Registrado","Anulado","MotivoAnulacion"]],
 txs:["TrasplanteSeguimiento",["ID","Paciente","Item","Estado","Fecha","Resultado","Usuario","Registrado","Anulado","MotivoAnulacion"]],
 sol:["SolicitudesLab",["ID","Mes","Programa","Paciente","Examen","Origen","Motivo","Estado","FechaToma","Nota","Usuario","Registrado","Anulado","MotivoAnulacion"]],
 cor:["Cortes",["ID","FechaCorte","InicioPeriodo","EPS","Usuario","Registrado","Datos"]],
 log:["Bitacora",["FechaHora","Usuario","Accion","Hoja","Registro","Detalle"]],
 cfg:["Config",["Clave","Valor"]],
 fin:["Fin_cifrado",["Clave","Valor"]]
};
/* portal.js:124 */
const BOOK_KEYS=["pac","ses","evt","lab","nov","mov","ctc","acn","ate","val","est","vac","txs","sol","seg","atb","aud","med","dis","cor","log"];
/* portal.js:125 */
const DATE_F=new Set(["FechaNac","InicioTRR","IngresoUnidad","IngresoPrograma","FechaEstado","AccesoDesde","FechaRuta","TxFecha","Fecha","FechaToma","Inicio","Fin","FechaCierre","FechaCorte","InicioPeriodo","FechaAfiliacion","FechaDxHTA","FechaDxDM","FechaDxERC5","Reprograma","ProximoControl"]);
/* portal.js:126 */
const NUM_F=new Set(["Puesto","SesSemana","DuracionMin","PesoPre","PesoPost","TASPre","TADPre","TASPost","TADPost","Gluco","KtVOCM","PesoSeco","Talla","TFGInicio","Diuresis","CalidadPuntaje","Observadas","Cumplidas","Prescrita","Entregada","CantidadMes","UFNeta","UFR","UFMaquina","NumDosis"]);
/* portal.js:129 */
function cacStart(d){return d.getMonth()>=6?new Date(d.getFullYear(),6,1):new Date(d.getFullYear()-1,6,1);}
/* portal.js:131 */
function newBook(){const b={};Object.keys(SH).forEach(k=>b[k]=[]);b.cfgv=JSON.parse(JSON.stringify(CFG_DEF));b.finBlob=null;return b;}
/* portal.js:132 */
function readSheet(wb,name){const sn=wb.SheetNames.find(n=>norm(n)===norm(name));if(!sn)return null;return XLSX.utils.sheet_to_json(wb.Sheets[sn],{raw:true,defval:null});}
/* portal.js:133 */
function fromRow(r){const o={};for(const k in r){let v=r[k];if(DATE_F.has(k))v=pdate(v);else if(NUM_F.has(k))v=num(v);else if(v!=null)v=typeof v==="string"?v.trim():v;o[k]=v;}return o;}
/* portal.js:134 */
function isToolBook(wb){return!!wb.SheetNames.find(n=>norm(n)==="SESIONES")&&!!wb.SheetNames.find(n=>norm(n)==="PACIENTES");}
/* portal.js:135 */
function isDashboard(wb){return!!wb.SheetNames.find(n=>norm(n)==="2.PACIENTES");}
/* portal.js:136 */
function parseToolBook(wb){
  const b=newBook();
  for(const k in SH){if(k==="cfg"||k==="fin")continue;const rows=readSheet(wb,SH[k][0])||[];b[k]=rows.map(fromRow).filter(o=>Object.values(o).some(v=>v!=null&&v!==""));}
  b.pac.forEach(p=>{p.ID=String(p.ID||"").trim();if(p.Documento!=null)p.Documento=String(p.Documento);});
  const cfg=readSheet(wb,SH.cfg[0])||[];cfg.forEach(r=>{try{const v=JSON.parse(r.Valor);const d=b.cfgv[r.Clave];if(d&&typeof d==="object"&&!Array.isArray(d)&&v&&typeof v==="object"&&!Array.isArray(v))b.cfgv[r.Clave]=Object.assign({},d,v);else b.cfgv[r.Clave]=v;}catch(e){}});
  const fin=readSheet(wb,SH.fin[0])||[];if(fin.length){const m={};fin.forEach(r=>{m[r.Clave]=r.Valor;});const parts=Object.keys(m).filter(k=>/^Datos\d+$/.test(k)).sort((a,b)=>+a.slice(5)-+b.slice(5)).map(k=>m[k]).join("");if(m.Sal&&m.IV&&parts)b.finBlob={salt:m.Sal,iv:m.IV,ct:parts};}
  return b;
}
/* portal.js:169 */
const live=o=>o.Anulado!=="SI";
/* portal.js:172 */
const IDX={dirty:true,pac:new Map()};
/* portal.js:173 */
function reindex(){
  const B=ST.book;IDX.pac=new Map();
  B.pac.forEach(p=>{p._ses=[];p._evt=[];p._lab={};p._nov=[];p._ctc=[];p._mov=[];p._acn=[];p._ate=[];p._val=[];p._med=[];p._dis=[];p._seg=[];p._atb=[];p._est=[];p._vac=[];p._txs=[];p._sol=[];IDX.pac.set(p.ID,p);});
  [["acn","Fecha"],["ate","Fecha"],["val","Fecha"],["med","Inicio"],["dis","Mes"],["seg","Fecha"],["atb","Inicio"],["est","Fecha"],["vac","Fecha"],["txs","Fecha"],["sol","Mes"]].forEach(([k,f])=>B[k].filter(live).forEach(o=>{const p=IDX.pac.get(o.Paciente);if(p)p["_"+k].push(o);}));
  B.ses.filter(live).forEach(s=>{const p=IDX.pac.get(s.Paciente);if(p&&s.Fecha)p._ses.push(s);});
  B.evt.filter(live).forEach(e=>{const p=IDX.pac.get(e.Paciente);if(p&&e.Fecha)p._evt.push(e);});
  B.lab.filter(live).forEach(l=>{const p=IDX.pac.get(l.Paciente);if(!p||!l.FechaToma||!l.Examen)return;(p._lab[l.Examen]=p._lab[l.Examen]||[]).push(l);});
  B.nov.filter(live).forEach(n=>{const p=IDX.pac.get(n.Paciente);if(p&&n.Inicio)p._nov.push(n);});
  B.ctc.forEach(c=>{const p=IDX.pac.get(c.Paciente);if(p&&c.Fecha)p._ctc.push(c);});
  B.mov.filter(live).forEach(m=>{const p=IDX.pac.get(m.Paciente);if(p&&m.Fecha)p._mov.push(m);});
  IDX.pac.forEach(p=>{
    p._ses.sort((a,b)=>a.Fecha-b.Fecha);for(const k in p._lab)p._lab[k].sort((a,b)=>a.FechaToma-b.FechaToma);
    p._mov.sort((a,b)=>a.Fecha-b.Fecha);p._ctc.sort((a,b)=>a.Fecha-b.Fecha);["_acn","_ate","_val","_est","_vac","_txs"].forEach(k=>p[k].sort((a,b)=>(a.Fecha||0)-(b.Fecha||0)));p._evt.sort((a,b)=>a.Fecha-b.Fecha);
    const st=p.IngresoUnidad||p.InicioTRR||(p._ses[0]&&p._ses[0].Fecha)||null;const iv=[];let cur=st?[st,null]:null;
    p._mov.forEach(m=>{if(MOV_EGRESO.includes(m.Tipo)){if(cur){cur[1]=m.Fecha;iv.push(cur);cur=null;}}else if(m.Tipo==="Reingreso"){if(!cur)cur=[m.Fecha,null];}});
    if(cur){if(p.Estado&&p.Estado!=="Activo"){const lastS=p._ses.length?p._ses[p._ses.length-1].Fecha:null;cur[1]=p.FechaEstado||lastS||cur[0];p._endGuess=!p.FechaEstado;}iv.push(cur);}
    p._iv=iv;p._noStart=!st;
  });
  IDX.dirty=false;
}
/* portal.js:193 */
function ensureIdx(){if(IDX.dirty)reindex();}
/* portal.js:194 */
const nombre=p=>p?((p.Nombres||"")+" "+(p.Apellidos||"")).trim()||p.ID:"";
/* portal.js:195 */
function activeAt(p,d){return p._iv.some(([a,b])=>a<=d&&(!b||d<=b));}
/* portal.js:196 */
function activeDays(p,a,b){let n=0;p._iv.forEach(([s,e])=>{const x=s>a?s:a,y=(e&&e<b)?e:b;if(y>=x)n+=dayDiff(x,y)+1;});return n;}
/* portal.js:197 */
function overlaps(p,a,b){return p._iv.some(([s,e])=>s<=b&&(!e||e>=a));}
/* portal.js:198 */
function ageAt(p,d){if(!p.FechaNac)return null;let a=d.getFullYear()-p.FechaNac.getFullYear();if(d<new Date(d.getFullYear(),p.FechaNac.getMonth(),p.FechaNac.getDate()))a--;return a;}
/* portal.js:199 */
const adult=(p,d)=>{const a=ageAt(p,d);return a==null||a>=18;};
/* portal.js:200 */
const ninety=(p,d)=>{const s=p.InicioTRR||p.IngresoUnidad;return!s||dayDiff(s,d)>=90;};
/* portal.js:201 */
const epsOk=p=>!ST.eps||p.EPS===ST.eps;
/* portal.js:202 */
function turnoDias(t){const c=turnosCfg().find(x=>x.n===t);if(c)return c.d;t=t||"";return/^L-M-V/.test(t)?[1,3,5]:/^M-J-S/.test(t)?[2,4,6]:/^M-J-V/.test(t)?[2,4,5]:[];}
/* portal.js:203 */
function absentOn(p,d){return p._nov.some(n=>(n.Tipo==="Hospitalización"||n.Tipo==="Viaje / traslado temporal")&&n.Inicio<=d&&(!n.Fin||d<=n.Fin));}
/* portal.js:204 */
function progDays(p,a,b){const out=[];const dias=turnoDias(p.Turno);if(!dias.length)return out;for(let d=new Date(a);d<=b;d=addDays(d,1)){if(dias.includes(d.getDay())&&activeAt(p,d)&&!absentOn(p,d))out.push(d);}return out;}
/* portal.js:205 */
function sesIn(p,a,b,est){return p._ses.filter(s=>s.Fecha>=a&&s.Fecha<=b&&(!est||s.Estado===est));}
/* portal.js:206 */
function lastLab(p,k,a,b){const L=p._lab[k];if(!L)return null;for(let i=L.length-1;i>=0;i--){const l=L[i];if(l.FechaToma<=b&&(!a||l.FechaToma>a))return l;}return null;}
/* portal.js:207 */
function labsIn(p,k,a,b){return(p._lab[k]||[]).filter(l=>l.FechaToma>a&&l.FechaToma<=b);}
/* portal.js:208 */
function accessAt(p,d){let s=null;for(let i=p._ses.length-1;i>=0;i--){const x=p._ses[i];if(x.Fecha<=d&&x.Acceso&&x.Estado==="Realizada"){s=x;break;}}
  if(p.AccesoActual&&p.AccesoDesde&&p.AccesoDesde<=d&&(!s||p.AccesoDesde>=s.Fecha))return p.AccesoActual;if(s)return s.Acceso;
  if(p.AccesoActual&&(!p.AccesoDesde||p.AccesoDesde<=d))return p.AccesoActual;return p.AccesoInicial||null;}
/* portal.js:214 */
function lastSes(p,d,n){const out=[];for(let i=p._ses.length-1;i>=0&&out.length<n;i--){const s=p._ses[i];if(s.Fecha<=d&&s.Estado==="Realizada")out.push(s);}return out.reverse();}
/* portal.js:216 */
function gidStats(p,d,n){n=n||8;const R=p._ses.filter(s=>s.Fecha<=d&&s.Estado==="Realizada");const g=[];for(let i=R.length-1;i>0&&g.length<n;i--){const a=R[i-1],b=R[i];const pre=num(b.PesoPre),post=num(a.PesoPost);if(pre!=null&&post!=null&&dayDiff(a.Fecha,b.Fecha)<=4){const ref=num(p.PesoSeco)||post;g.push({d:b.Fecha,kg:pre-post,pct:(pre-post)/ref*100,gap:dayDiff(a.Fecha,b.Fecha)});}}
  const L=lastSes(p,d,n);const uf=L.map(s=>{const a=num(s.PesoPre),b=num(s.PesoPost),m=num(s.DuracionMin);if(a==null||b==null)return null;return{uf:a-b,ufr:m&&b?(a-b)*1000/b/(m/60):null};}).filter(Boolean);
  const av=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
  return{n:g.length,kg:av(g.map(x=>x.kg)),pct:av(g.map(x=>x.pct)),max:g.length?Math.max(...g.map(x=>x.kg)):null,uf:av(uf.map(x=>x.uf)),ufrMax:uf.filter(x=>x.ufr!=null).length?Math.max(...uf.filter(x=>x.ufr!=null).map(x=>x.ufr)):null,list:g};}
/* portal.js:220 */
function taStats(p,d,n){n=n||8;const L=lastSes(p,d,n);const v=k=>L.map(s=>num(s[k])).filter(x=>x!=null);const av=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
  const sp=v("TASPre"),dp=v("TADPre"),sq=v("TASPost"),dq=v("TADPost");return{n:sp.length,sPre:av(sp),dPre:av(dp),sPost:av(sq),dPost:av(dq),min:sp.concat(sq).length?Math.min(...sp.concat(sq)):null};}
/* portal.js:222 */
function glucoStats(p,a,b){const v=p._ses.filter(s=>s.Fecha>a&&s.Fecha<=b&&num(s.Gluco)!=null).map(s=>({d:s.Fecha,v:num(s.Gluco)}));const av=v.length?v.reduce((x,y)=>x+y.v,0)/v.length:null;
  return{n:v.length,avg:av,hipo:v.filter(x=>x.v<70).length,baja:v.filter(x=>x.v>=70&&x.v<80).length,meta:v.filter(x=>x.v>=80&&x.v<=180).length,hiper:v.filter(x=>x.v>180).length,list:v};}
/* portal.js:224 */
function ktvOnline(p,d,n){const L=lastSes(p,d,n||8).map(s=>num(s.KtVOCM)).filter(x=>x!=null);return L.length?{n:L.length,avg:L.reduce((a,b)=>a+b,0)/L.length,last:L[L.length-1]}:null;}
/* portal.js:225 */
function fmtTA(s,d){return s==null?"—":Math.round(s)+"/"+(d==null?"—":Math.round(d));}
/* portal.js:226 */
function parseTA(v){const m=/^\s*(\d{2,3})\s*[\/\-]\s*(\d{2,3})\s*$/.exec(String(v||""));return m?[+m[1],+m[2]]:null;}
/* portal.js:228 */
function ktvDaugirdas(pre,post,tMin,uf,w){if(!pre||!post||post>=pre||!tMin||!w)return null;const R=post/pre,t=tMin/60;const x=R-0.008*t;if(x<=0)return null;return -Math.log(x)+(4-3.5*R)*(uf||0)/w;}
/* portal.js:229 */
function metasDe(p){let m={};try{m=p.Metas?JSON.parse(p.Metas):{};}catch(e){}return Object.assign({},META_DEF,ST.book.cfgv.metaPac||{},m);}
/* portal.js:231 */
const CAC_H_FOMAG=["MES DE REPORTE", "Var1 Primer nombre del usuario", "Var2 Segundo nombre del usuario\n(En caso de un tercer nombre, escríbalo separado por un espacio. Registre \"NONE\", en mayúscula sostenida, cuando el usuario no tiene segundo nombre (NONE=\"Ningún Otro Nombre Escrito\").)", "Var3 Primer apellido del usuario", "Var4 Segundo apellido del usuario\n(Registre \"NOAP\", en mayúscula sostenida, cuando el usuario no tiene segundo apellido (NOAP=Ningún Otro Apellido\").)", "Var5 Tipo de Identificación del usuario\n(RC = Registro Civil, TI = Tarjeta Identidad, CC = Cédula de Ciudadanía, CE = Cédula Extranjería, PA = Pasaporte, MS = Menor sin Identificación, AS = Adulto sin Identificación, CD = Carnet Diplomático, SC = Salvoconducto de permanencia, PE = Permiso especial, PT = Permiso de protección temporal, SI = Sin identificación, DE = Documento extranjero, CN= Certificado nacido vivo)", "Var6 Número de Identificación del usuario\n(Para MS y AS registre el consecutivo interno del afiliado según lo dispuesto en la Resolución 4622/2016.)", "Var7 Fecha de nacimiento (formato AAAA-MM-DD)", "Edad", "Curso de Vida", "Var8 Sexo\n(Registre\nF = Femenino\nM = Masculino)", "Var9 Régimen de afiliación AL SGSS\nP = Regímenes de excepción\nN = No asegurado)", "Var10 Código de la EPS o de la entidad territorial\n(Registre el código de la EAPB/Ente territorial que reporta (los códigos autorizados están disponibles en la plataforma SISCAC, ruta cargue de archivo plano – pestaña de archivos operativos).)", "Var11 Código pertenencia étnica\n(1 = Indígena\n2 = ROM (gitano)\n3 = Raizal del archipiélago de San Andrés y Providencia\n4 = Palenquero de San Basilio\n5 = Negro(a), mulato(a), afro colombiano(a) o afro descendiente\n6 = Ninguna de las anteriores)", "Var12 Grupo poblacional\n(1 = Indigentes, 2 = Población infantil a cargo del ICBF, 3 = Madres comunitarias, 4 = Artistas, autores, compositores, 5 = Otro grupo poblacional, 6 = Recién nacidos, 7= Discapacitados, 8 = Desmovilizados, 9 = Desplazados, 10 = Población ROM, 11 = Población raizal, 12 = Población en centros psiquiátricos, 13 = Migratorio, 14 = Población en centros carcelarios, 15 = Población rural no migratoria, 16 = Afrocolombiano, 31 = Adulto mayor, 32 = Cabeza de familia, 33 = Mujer embarazada, 34 = Mujer lactante, 35 = Trabajador urbano, 36 = Trabajador rural, 37 = Víctima de violencia armada, 38 = Jóvenes vulnerables rurales, 39 = Jóvenes vulnerables urbanos, 50 = Discapacitado del sistema nervioso, 51 = Discapacitado de los ojos, 52 = Discapacitado de los oídos, 53 = Discapacitado de los demás órganos de los sentidos (olfato, tacto y gusto), 54 = Discapacitado de la voz y el habla, 55 = Discapacitado del sistema cardiorrespiratorio y las defensas, 56 = Discapacitado de la digestión, el metabolismo, las hormonas, 57 = Discapacitado del sistema genital y reproductivo, 58 = Discapacitado del movimiento del cuerpo, manos, brazos, piernas, 59 = Discapacitado de la piel, 60 = Discapacitado de otro tipo, 61 = No definido, 62 = Comunidad indígena, 63 = Comunidad migrante de la República de Venezuela)", "Tipo Discapacidad\nRegistra:\n1=Física\n2=Visual\n3=Auditiva\n4=Intelectual\n5=Sicosocial\n6=Sordoceguera\n7=Múltiple\n8=Sin discapacidad", "Región", "Departamento", "Zona Territorial\nRegistrar;\n1= Urbano\n2= Rural", "Var13 Municipio de residencia (Registre codigo DIVIPOLA - DANE)", "Dirección de residencia", "Barrio de Residencia", "Var14 número telefónico del paciente (Si no se tiene el número telefónico diligencie 0)", "Var15 Fecha de afiliación a la EPS que registra (formato AAAA-MM-DD)", "Var16 Código de la IPS donde se hace seguimiento al usuario\n \n(En los pacientes en diálisis se debe reportar la IPS que realiza la TRR.\nEn los pacientes con trasplante, TMND y aquellos con diagnóstico confirmado de HTA, DM o ERC se debe reportar la IPS que realiza el seguimiento.\nEn pacientes con abandono o alta voluntaria, registre el código de la IPS donde se le hizo el último seguimiento al usuario.)", "Var18 Diagnóstico confirmado de Hipertensión Arterial\n(CIE10 I10- I159, I674, O10, O100-O109, P292\n1 = Si\n2 = No)", "Var19 Fecha de diagnostico de la Hipertension Arterial \n(Si se conoce la fecha registrese en formato AAAA-MM-DD. Si conoce sólo el año y el mes, registre el día 01. Si conoce solamente el año registre 01 como mes y 01 como día.\n1800-01-01 = Desconocida\n1845-01-01 = No aplica, paciente sin diagnóstico de HTA)", "Var20 Diagnóstico confirmado de Diabetes Mellitus- DM \n(CIE-10 con códigos entre E10-E149; O240-O243; P702\n1 = Tipo 1\n2 = No tiene DM\n3 = Tipo 2\n4= Otros (Posquirúrgica, postrasplante, secundaria a medicamentos, MODY))", "Var21 Fecha de diagnostico de la Diabetes Mellitus\n(Si se conoce la fecha registrese en formato AAAA-MM-DD. Si conoce sólo el año y el mes, registre el día 01. Si conoce solamente el año registre 01 como mes y 01 como día.\n1800-01-01 = Desconocida\n1845-01-01 = No aplica, paciente sin diagnóstico de HTA)", "FECHA DE DIAGNOSTICO ERC 1 a 4\nFecha con formato AAAA-MM-DD\n1800-01-01 = Cuando el paciente esta en abandono.\n1845-01-01 = No aplica, paciente en TRR \nSí reporta una fecha válida, debe cargar el soporte del programa", "Var23 Peso con 2 decimales maximo.\n(Para los pacientes que en la variable 35 reportan TFG (Trasplante, TMND, HTA, DM y ERC sin diálisis), el dato reportado debe ser con el que se calculó la TFG registrada por el médico tratante en la historia clínica o en su defecto, con el que se calculó la TFG cuando no se dispuso de este dato.)", "Var24 Talla en cm", "IMC", "Clasificación IMC", "Perimetro Abdominal En CM", "Presenta Dislipidemia\n1= SI\n2= NO", "FECHA DE DIAGNOSTICO(Si se conoce la fecha registrese en formato AAAA-MM-DD. Si conoce sólo el año y el mes, registre el día 01. Si conoce solamente el año registre 01 como mes y 01 como día.\n1800-01-01 = Desconocida\n1845-01-01 = No aplica, paciente sin diagnóstico de Dislipidemia", "Var25 Tensión arterial sistólica\n(999 = Si no tiene valor de TAS dentro del periodo de reporte)", "Var26 Tensión arterial diastólica\n(999 = Si no tiene valor de TAD dentro del periodo de reporte)", "Var27 Creatinina con maximo 2 decimales \n(98 = No aplica, paciente en diálisis\n99 = No se realizó el laboratorio.)", "Var27_1 Fecha de última Creatinina\n(1845-01-01 = No aplica, paciente en diálisis\n1800-01-01 = No se realizó el laboratorio)", "Var28 Hemoglobina Glicosilada\n(98 = No aplica, paciente sin diagnóstico de DM\n99 = No se realizó el laboratorio)", "Var28_1 Fecha de última Hemoglobina Glicosilada\n(1845-01-01= No aplica, paciente sin diagnóstico de DM\n1800-01-01= No se realizó el laboratorio)", "Var29 Albuminuria\n(9888 = No aplica, paciente en TRR\n9999 = No se realizó el laboratorio)", "Var29_1 Fecha de la última Albuminuria\n(1845-01-01= No aplica, paciente en TRR\n1800-01-01 = No se realizó el laboratorio)", "Relación Albuminuria/Creatinuria (mg/g)\n(9888 = No aplica, paciente en TRR\n9999 = No se realizó el laboratorio)", "Var30_1 Fecha de la última Albuminuria/Creatinuria \n(1845-01-01 = No aplica, paciente en TRR\n1800-01-01 = No se realizó el laboratorio)", "Var31 Colesterol total \n(999 = No se realizó el laboratorio)", "Var31_1 Fecha de la último Colesterol total\n(1845-01-01= No se realizó el laboratorio)", "Var32 HDL \n(999 = No se realizó el laboratorio)\n", "Var32_1 Fecha de la último HDL\n(1845-01-01= No se realizó el laboratorio)", "Var33 LDL \n(999 = No se realizó el laboratorio)", "Var33_1 Fecha del último LDL\n(1845-01-01= No se realizó el laboratorio.)", "RESULTADO ULTIMO TRIGLICERIDOS \n(999 = No se realizó el laboratorio)", "FECHA ULTIMO TRIGLICERIDOS\n(1845-01-01 = No aplica, paciente sin ERC o con ERC estadios 1 o 2 (aplica para pacientes no estudiados o indeterminados)\n1800-01-01 = No se realizó el laboratorio)", "Var34 PTH\n(9988 = No aplica, paciente sin ERC o con ERC estadios 1 o 2 (aplica para pacientes no estudiados o indeterminados).\n9999 = No se realizó el laboratorio (en pacientes con ERC 3 a 5))", "Var34_1 Fecha de la última PTH \n(1845-01-01 = No aplica, paciente sin ERC o con ERC estadios 1 o 2 (aplica para pacientes no estudiados o indeterminados)\n1800-01-01 = No se realizó el laboratorio)", "Var35 Tasa de filtración glomerular\n(999 = Paciente sin creatinina vigente\n988 = Paciente en diálisis con diuresis en el periodo de recolección < 250 ml\n777 = Paciente en diálisis con diuresis en el periodo de recolección >= 250 ml)", "Fecha de la ultima TFG", "RESULTADO DE SODIO\n(999 = No se realizó el laboratorio). ", "RESULTADO DE SODIO\nRegistre la fecha en el formato \nAAAA-MM-DD.  \n1845-01-01= No se realizó el laboratorio. ", "RESULTADO DE POTASIO (999 = No se realizó el laboratorio)\n", "RESULTADO DE POTASIO\nRegistre la fecha en el formato \nAAAA-MM-DD.  \n1845-01-01= No se realizó el laboratorio. ", "RESULTADO DE ACIDO URICO (999 = No se realizó el laboratorio)\n", "RESULTADO DE ACIDO URICO\nRegistre la fecha en el formato \nAAAA-MM-DD.  \n1845-01-01= No se realizó el laboratorio. ", "RESULTADO DE UROANALISIS (999 = No se realizó el laboratorio)\n", "RESULTADO DE UROANALISIS\nRegistre la fecha en el formato \nAAAA-MM-DD.  \n1845-01-01= No se realizó el laboratorio. ", "RESULTADO DE EKG\nRegistre,\n1= NORMAL\n2= ALTERADO\n3= NO SE REALIZO", "FECHA ULTIMO EKG\nRegistre la fecha en el formato \nAAAA-MM-DD.  \n1845-01-01= No se realizó el laboratorio. ", "FECHA VALORACIÓN POR POR MEDICINA GENERAL Y/O EXPERTO", "FECHA VALORACIÓN POR POR NEFROLOGIA", "FECHA VALORACIÓN POR POR ENDOCRINOLOGIA", "FECHA VALORACIÓN POR POR MEDICINA INTERNA", "FECHA VALORACIÓN POR PSICOLOGIA\nRegistre la fecha en el formato \nAAAA-MM-DD. ", "FECHA VALORACIÓN POR NUTRICIONISTA\nRegistre la fecha en el formato \nAAAA-MM-DD. ", "FECHA VALORACIÓN POR TRABAJO SOCIAL\nRegistre la fecha en el formato \nAAAA-MM-DD. ", "Var38 Tiene diagnóstico de enfermedad renal crónica en cualquier de sus estadios\n(Página 20 de 47\n0 = No presenta ERC\n1 = Si presenta ERC\n2 = Indeterminado\n3= Paciente no estudiado para ERC en el periodo de reporte)", "Var39 Estadio de ERC\n(1 = Paciente con TFGe igual o mayor a 90 ml/min y pruebas complementarias que soportan daño renal\n2 = Paciente con TFGe entre 60 y menor de 90 ml/min y pruebas complementarias que soportan daño renal\n3 = Paciente con TFGe entre 30 y menor de 60 ml/min\n4 = Paciente con TFGe entre 15 y menor de 30 ml/min\n5 = Paciente con TFGe menor de 15 ml/min o paciente en diálisis\n98 = No aplica, no hay enfermedad renal crónica (Debe tener 0 en la variable 38)\n99 = Desconocido (paciente indeterminado o no estudiado para ERC en el periodo de reporte, también aplica para pacientes con ERC confirmada sin seguimiento de TFGe de acuerdo con Guía de Práctica clínica).\nSi esta variable tiene valores entre 1 y 5, la variable 38 debe ser igual a 1. Todos los pacientes reportados en diálisis deben reportar la opción 5, así tengan una TFGe >15.)", "Var40 Fecha de diagnóstico de ERC estadio 5\n(Registre la fecha en el formato AAAA-MM-DD. Verifique que el orden de los números sea AÑO-MES-DÍA y el separador sea guion (-). Si conoce sólo el año y el mes, registre el día 01. Si conoce solamente el año registre 01 como mes y 01 como día.\n1800-01-01 = Desconocida\n1845-01-01 = No aplica, el paciente nunca ha sido diagnosticado con ERC estadio 5)", "TRATAMIENTO ACTUAL ERC", "\nCÓDIGO DE HABILITACIÓN DEL PRESTADOR DE ATENCION DE ERC\n", "NOMBRE DEL PRESTADOR", "Var41 Se encuentra en un programa de atención de ERC\n(1 = Si\n2 = No se encuentra en un programa de atención renal o paciente en abandono\n98 = No aplica, paciente en TRR\n99 = Sin dato en la historia clínica)", "Var42 TFG medida cuando el usuario inició la primera TRR:\n(Se debe reportar la TFG registrada en la historia clínica por el médico tratante, con máximo 2 decimales sin aproximación.\n98 = No aplica, paciente sin inicio de TRR.\n99 = Sin dato, no se conoce porque el paciente inicio la TRR en una EPS diferente a la que reporta o por urgencia dialítica o paciente en abandono.)", "Var43 Modo de Inicio de la TRR\n(1 = Paciente que inició la TRR diálisis en hospitalización\n2 = Paciente que inició la TRR diálisis ambulatoria\n3 = Sin dato, el paciente inicio la TRR en otra EPS diferente a la que reporta\n4 = Paciente que inició la TRR con trasplante renal o TMND\n97 = No aplica, paciente que nunca ha recibido TRR\n98 = No aplica, el usuario a la fecha de corte no recibe ninguna de las terapias de reemplazo renal.\n99 = Paciente que inició la TRR en la EPS que reporta, pero no hay información en la historia clínica o paciente en abandono)", "Var44 Fecha en que se inicio la TRR\n(Registre la fecha en el formato AAAA-MM-DD. Verifique que el orden de los números sea AÑO-MES-DÍA y el separador sea guion (-). Si conoce sólo el año y el mes, registre el día 01. Si conoce solamente el año registre 01 como mes y 01 como día.\n1800-01-01 = Desconocida\n1845-01-01 = No aplica, paciente sin TRR a la fecha de corte.\nTambién es válida para pacientes que han firmado alta voluntaria o paciente en abandono)", "Var45 Fecha de Ingreso a la Unidad Renal Actual\n(Registre la fecha en el formato AAAA-MM-DD. Verifique que el orden de los números sea AÑO-MES-DÍA y el separador sea guion (-). Si conoce sólo el año y el mes, registre el día 01. Si conoce solamente el año registre01 como mes y 01 como día.\n1800-01-01 = Desconocida\n1845-01-01 = No aplica, el paciente no recibe terapia dialítica o paciente en abandono\nVerifique que si registra una fecha diferente a 1845-01-01 en esta variable, debe registrar en alguna de las variables 46(HD) o 49(DP), opciones diferentes a 98.)", "Var46 Hemodiálisis\n(1 = Paciente en hemodiálisis por fístula arteriovenosa\n3 = Paciente en hemodiafiltración en línea de alto volumen o diálisis expandida.\n4 = Pacientes en hemodiálisis por catéter tunelizado\n5 = Paciente en hemodiálisis por catéter transitorio\n6 = Pacientes en hemodiálisis por injerto.\n98 = No aplica, el paciente no recibe hemodiálisis a la fecha de corte o paciente en abandono)", "Var47 Dosis de diálisis Kt_V single pool\n(Registre el resultado del último Kt/V realizado en el último trimestre del periodo de reporte, con máximo 2 decimales sin aproximación.\n98 = No aplica, el paciente no está en hemodiálisis o paciente en abandono)", "Var48 Costo total de la hemodiálisis\n(Registre exclusivamente el costo de la hemodiálisis. Excluya otros costos que no están relacionados con esta terapia.\n98= No aplica, el paciente no ha recibido hemodiálisis durante el periodo de reporte o paciente en abandono.)", "Var49 Diálisis peritoneal\n(1 = Paciente en diálisis peritoneal manual\n2 = Paciente en diálisis peritoneal automatizada\n98 = No aplica, el paciente no está en diálisis peritoneal o paciente en abandono)", "Var50 Dosis de diálisis Kt_V dpd\n(Registre la última dosis de diálisis consignada en la historia clínica, con máximo 2 decimales sin aproximación. El valor debe ser tomado en los últimos 6 meses del periodo de corte (enero a junio de 2024).\n98 = No aplica, usuario no está en diálisis peritoneal o paciente en abandono)", "Var51 Numero de horas de dialisis\n(Registre el promedio de horas/sesión de las hemodiálisis realizadas al paciente en los últimos 3 meses del periodo de reporte (abril a junio de 2024), con máximo 2 decimales sin aproximación.\n98 = No aplica, el paciente no está en hemodiálisis o paciente en abandono)", "Var52 Peritonitis\n(Registre el número de episodios de peritonitis infecciosa relacionada con la diálisis peritoneal que sufrió el paciente durante el periodo de reporte:\n98 = No aplica, el paciente no ha recibido diálisis peritoneal durante el periodo de reporte o paciente en abandono.)", "Tiempo (meses) en el que estuvo recibiendo tratamiento para la peritonitis en diálisis peritoneal\n", "Var53 Costo DP\n(Registre exclusivamente el costo de la diálisis peritoneal. Excluya otros costos que no están relacionados con esta terapia.\n98= No aplica, el paciente no ha recibido diálisis peritoneal durante el periodo de reporte o paciente en abandono\nPara pacientes reportados por ente territorial por prestación de servicios no incluidos en el plan de beneficios, registre la opción 98.)", "Var54 Vacuna Hepatitis B\n(1 = Tiene esquema completo sin títulos\n2 = Tiene esquema incompleto sin títulos\n3 = No ha recibido vacunación para hepatitis B\n4 = Títulos >10\n5 = Títulos <10\n6 = Sin respuesta a la vacunación (dos esquemas completos de vacunación y títulos <10)\n7 = Infección por VHB\n98 = No aplica, el paciente no recibe HD, DP ni ha sido trasplantado\n99 = Sin dato en la historia clínica o paciente en abandono)", "Var55 Fecha de diagnóstico de la infección por Hepatitis B\n(Registre la fecha en el formato AAAA-MM-DD. Verifique que el orden de los números sea AÑO-MES-DÍA y el separador sea guion (-). Si conoce sólo el año y el mes, registre el día 01. Si conoce solamente el año registre 01 como mes y 01 como día.\n1800-01-01= Sin dato en la historia clínica o paciente en abandono\n1811-01-01 = No aplica, el paciente no ha presentado infección por Hepatitis B o el paciente no recibe HD, DP ni ha sido trasplantado.)", "Var56 Fecha de diagnóstico de la infección por Hepatitis C\n(Registre la fecha en el formato AAAA-MM-DD. Verifique que el orden de los números sea AÑO-MES-DÍA y el separador sea guion (-). Si conoce sólo el año y el mes, registre el día 01. Si conoce solamente el año registre01 como mes y 01 como día.\n1800-01-01 = Sin dato en la historia clínica o paciente en abandono\n1811-01-01 = No aplica, el paciente no ha presentado infección por Hepatitis C o el paciente no recibe HD, DP ni ha sido trasplantado.)", "Var57 Terapia no Dialítica para ERC estadio 5\n(1 = Si, paciente que recibe solamente tratamiento médico especial y multidisciplinario sin diálisis\n2 = No recibe esta terapia o paciente en abandono)", "Var58 Costo de la terapia ERC estadio 5 con tratamiento médico\n(Registre exclusivamente el costo del tratamiento médico no dialítico. Excluya otros costos que no están relacionados con esta terapia.\n98= No aplica, el paciente no ha recibido TMND durante el periodo de reporte o paciente en abandono)", "Var59 Hemoglobina\n(Registre el valor de la última hemoglobina tomada durante el periodo de reporte en personas con ERC en estadios 3 a 5, con máximo 2 decimales sin aproximación, teniendo en cuenta que:\n98 = No aplica (pacientes sin ERC o ERC estadios 1 y 2. También aplica para pacientes indeterminados o no estudiados para ERC).\n99= No se realizó el laboratorio dentro del periodo establecido para los pacientes con ERC 3 a 5 (también aplica para diálisis).)", "Var60 Albúmina Sérica\n(Registre el valor de la albumina sérica tomado durante el periodo de reporte en personas con ERC en estadios 3 a 5, con máximo 2 decimales sin aproximación teniendo en cuenta que:\n98 = No aplica (pacientes sin ERC o ERC estadios 1 y 2. También aplica para pacientes indeterminados o no estudiados para ERC).\n99= No se realizó el laboratorio dentro del periodo establecido para los pacientes con ERC 3 a 5 (también aplica para diálisis).)", "Var61 Fósforo\n(Registre el valor del fósforo sérico tomado durante el periodo de reporte en personas con ERC en estadios 3 a 5, teniendo en cuenta que:\n98 = No aplica (pacientes sin ERC o ERC estadios 1 y 2. También aplica para pacientes indeterminados o no estudiados para ERC).\n99= No se realizó el laboratorio dentro del periodo establecido para los pacientes con ERC 3 a 5 (también aplica para diálisis).)", "Var62 Valoración Clínica inicial por nefrología\n(Registre el concepto de la valoración clínica realizada por el nefrólogo:\n1 = Indicado\n2 = Contraindicado\n97 = No aplica, paciente que no tiene ERC estadio 5 (tiene ERC estadio 1 a 4) o ya tiene trasplante funcional\n98 = No aplica, el paciente no tiene ERC o paciente en abandono\n99 = No ha sido valorado por nefrólogo para la posibilidad de trasplante\nSi marca la opción 2 “Contraindicado”, debe marcar la opción 1 “Si” en alguna de las opciones descritas en las variables 62.1 a 62.11, y en las demás debe marcar la opción 2 “No”. Si el trasplante está indicado “opción 1”, marque la opción “No” en las variables de 62.1 a 62.11.\nLas contraindicaciones para trasplante renal deben ser descritas claramente en la historia clínica.)", "Var62_1 Contraindicacion por Cáncer activo en los últimos 12 meses\n(1 = Si\n2 = No\n97 = No aplica, paciente que no tiene ERC estadio 5 (tiene ERC estadio 1 a 4) o ya tiene trasplante funcional\n98 = No aplica, el paciente no tiene ERC o paciente en abandono\n99 = No ha sido valorado por nefrólogo para la posibilidad de trasplante)", "Var62_2 Contraindicacion por infección crónica o activa no tratada o no controlada\n(1 = Si\n2 = No\n97 = No aplica, paciente que no tiene ERC estadio 5 (tiene ERC estadio 1 a 4) o ya tiene trasplante funcional\n98 = No aplica, el paciente no tiene ERC o paciente en abandono\n99 = No ha sido valorado por nefrólogo para la posibilidad de trasplante)", "Var62_3 Contraindicacion porque NO ha manifestado su deseo de trasplantarse\n(1 = Si\n2 = No\n97 = No aplica, paciente que no tiene ERC estadio 5 (tiene ERC estadio 1 a 4) o ya tiene trasplante funcional\n98 = No aplica, el paciente no tiene ERC o paciente en abandono\n99 = No ha sido valorado por nefrólogo para la posibilidad de trasplante)", "Var62_4 Contraindicacion por esperanza de vida menor o igual a 6 meses\n(1 = Si\n2 = No\n97 = No aplica, paciente que no tiene ERC estadio 5 (tiene ERC estadio 1 a 4) o ya tiene trasplante funcional\n98 = No aplica, el paciente no tiene ERC o paciente en abandono\n99 = No ha sido valorado por nefrólogo para la posibilidad de trasplante)", "Var62_5 Contraindicacion potencial limitacion autocuidado y adherencia al tratamiento posttrasplante\n(1 = Si\n2 = No\n97 = No aplica, paciente que no tiene ERC estadio 5 (tiene ERC estadio 1 a 4) o ya tiene trasplante funcional\n98 = No aplica, el paciente no tiene ERC o paciente en abandono\n99 = No ha sido valorado por nefrólogo para la posibilidad de trasplante)", "Var62_6 Contraindicacion por enfermedad cardiaca cerebrovascular o vascular periférica\n(1 = Si\n2 = No\n97 = No aplica, paciente que no tiene ERC estadio 5 (tiene ERC estadio 1 a 4) o ya tiene trasplante funcional\n98 = No aplica, el paciente no tiene ERC o paciente en abandono\n99 = No ha sido valorado por nefrólogo para la posibilidad de trasplante)", "Var62_7 Contraindicacion por infección por el VIH\n(1 = Si\n2 = No\n97 = No aplica, paciente que no tiene ERC estadio 5 (tiene ERC estadio 1 a 4) o ya tiene trasplante funcional\n98 = No aplica, el paciente no tiene ERC o paciente en abandono\n99 = No ha sido valorado por nefrólogo para la posibilidad de trasplante)", "Var62_8 Contraindicacion por infección por el VHC\n(1 = Si\n2 = No\n97 = No aplica, paciente que no tiene ERC estadio 5 (tiene ERC estadio 1 a 4) o ya tiene trasplante funcional\n98 = No aplica, el paciente no tiene ERC o paciente en abandono\n99 = No ha sido valorado por nefrólogo para la posibilidad de trasplante)", "Var62_9 Contraindicacion por enfermedad inmunológica activa\n(1 = Si\n2 = No\n97 = No aplica, paciente que no tiene ERC estadio 5 (tiene ERC estadio 1 a 4) o ya tiene trasplante funcional\n98 = No aplica, el paciente no tiene ERC o paciente en abandono\n99 = No ha sido valorado por nefrólogo para la posibilidad de trasplante)", "Var62_10 Contraindicacion por enfermedad pulmonar crónica\n(1 = Si\n2 = No\n97 = No aplica, paciente que no tiene ERC estadio 5 (tiene ERC estadio 1 a 4) o ya tiene trasplante funcional\n98 = No aplica, el paciente no tiene ERC o paciente en abandono\n99 = No ha sido valorado por nefrólogo para la posibilidad de trasplante)", "Var62_11 Contraindicacion por otras enfermedades crónicas\n(1 = Si\n2 = No\n97 = No aplica, paciente que no tiene ERC estadio 5 (tiene ERC estadio 1 a 4) o ya tiene trasplante funcional\n98 = No aplica, el paciente no tiene ERC o paciente en abandono\n99 = No ha sido valorado por nefrólogo para la posibilidad de trasplante)", "Var63 Fecha de Ingreso a lista de espera para la realización del trasplante\n(Registre la fecha en el formato AAAA-MM-DD. Verifique que el orden de los números sea AÑO-MES-DÍA y el separador sea guion (-). Si conoce sólo el año y el mes, registre el día 01. Si conoce solamente el año registre 01 como mes y 01 como día.\n1800-01-01 = Está indicado el trasplante, pero a la fecha de corte no ha ingresado a la lista de espera\n1845-01-01 = No Aplica, el trasplante está contraindicado o paciente en abandono o paciente con trasplante funcional o el paciente no ha sido valorado por nefrólogo en relación a la posibilidad de trasplante.)", "Var63_1 IPS donde está en lista de espera\n(Registre el código válido de habilitación (disponible en la página web REPS – código de 12 dígitos incluido el cero inicial – IPS trasplantadoras).\n98= No Aplica, el trasplante está contraindicado o paciente en abandono o paciente con trasplante funcional o el paciente no ha sido valorado por nefrólogo en relación con la posibilidad de trasplante.\n99 = Está indicado el trasplante, pero a la fecha de corte no ha ingresado a la lista de espera)", "Var64 Ha recibido trasplante renal\n(1 = SI, el paciente recibió trasplante renal en la EAPB/Ente territorial que reporta (y está funcional)\n2 = SI, el paciente recibió trasplante renal, en otra EAPB/Ente territorial diferente a la que reporta (y está funcional)\n3 = SI, el paciente recibió trasplante renal en la EAPB/Ente territorial que reporta (y no está funcional)\n4 = SI, el paciente recibió trasplante renal, en otra EAPB/Ente territorial diferente a la que reporta (y no está funcional)\n5 = NO, el paciente no ha recibido trasplante renal o paciente en abandono)", "Var65 EPS que realizó el trasplante\n(Registre el código de la EAPB/Ente territorial en la que el paciente recibió el último trasplante renal (sea este funcional o no, al momento del corte). Recuerde que el paciente puede haber recibido uno o más trasplantes renales\n98 = No aplica, el paciente no ha recibido trasplante renal\n99 = Sin dato (solamente cuando el trasplante renal no haya sido realizado por la EAPB/Ente territorial que reporta el usuario y no se dispone de esta información -indicada por el usuario))", "Var66 IPS o Grupo de trasplante que realizó el trasplante\n(Registre el código de habilitación de la IPS que realizó el último trasplante (disponible en la página web REPS – código de 12 dígitos incluido el cero inicial -grupo de trasplante). Recuerde que el paciente puede haber recibido uno o más trasplantes renales.\n98 = No aplica, el paciente no ha recibido trasplante renal\n99 = Sin dato, (solamente cuando el trasplante renal no haya sido realizado por la EAPB/Ente territorial que reporta el usuario y no se dispone de esta información))", "Var67 Tipo de donante\n(Recuerde que el paciente puede haber recibido uno o más trasplantes renales\n1 = Fallecido\n2 = Vivo\n98 = No aplica, el paciente no ha recibido trasplante renal\n99 = Sin dato en la historia clínica)", "Var68 Costo del trasplante\n(Registre el costo total del trasplante incluyendo todos los gastos por servicios POS asociados al procedimiento de trasplante que fueron cubiertos por la EPS/EOC, tales como la obtención o rescate del componente anatómico, su preservación y almacenamiento, así como el transporte tanto del órgano como del usuario.\n97 = No aplica, el paciente recibió trasplante renal en la EAPB/Ente territorial que reporta, pero el procedimiento no se realizó durante el período de reporte.\n98 = No aplica, el paciente no ha recibido trasplante renal o paciente en abandono\n99 = Sin dato, cuando el paciente recibió trasplante renal, pero en una EAPB/Ente territorial diferente a la EAPB/Ente territorial que reporta el usuario)", "Var69 Ha presentado alguna complicación relacionada con el trasplante\n(1 = Si\n2 = No\n98 = No aplica, el paciente no ha recibido trasplante renal o paciente en abandono\nSi marca la opción 1 “Si”. Debe colocar una fecha válida en alguna de las variables de 69.1 a 69.7. Y en las demás variables marcar 1800-01-01.\nSi marca la opción 2 “No”, en las demás variables marque 1800-01-01. Si el paciente no ha sido trasplantado marque 98 “No aplica”, y en las demás variables 1845-01-01.)", "Var69_1 Fecha de diagnóstico si ha presentado infección por Citomegalovirus\n(Registre la fecha en el formato AAAA-MM-DD. Verifique que el orden de los números sea AÑO-MES-DÍA y el separador sea guion (-). Si conoce sólo el año y el mes, registre el día 01. Si conoce solamente el año registre e incluya 01 como mes y 01 como día. Tener en cuenta que los pacientes con trasplante renal pueden recibir tratamiento antiviral para CMV como profilaxis, sin tener infección.\n1800-01-01 = No ha tenido esta complicación\n1845-01-01 = No aplica, el paciente no ha recibido trasplante renal o paciente en abandono)", "Var69_2 Fecha de diagnóstico si ha presentado infección por hongos\n(1800-01-01 = No ha tenido esta complicación\n1845-01-01 = No aplica, el paciente no ha recibido trasplante renal o paciente en abandono)", "Var69_3 Fecha de diagnóstico si ha presentado infección por tuberculosis\n(Registre la fecha en el formato AAAA-MM-DD. Verifique que el orden de los números sea AÑO-MES-DÍA y el separador sea guion (-). Si conoce sólo el año y el mes, registre el día 01. Si conoce solamente el año registre 01 como mes y 01 como día. Tener en cuenta que incluye la infección activa por tuberculosos pulmonar y extrapulmonar. No incluye la tuberculosis latente.\n1800-01-01 = No ha tenido esta complicación\n1845-01-01 = No aplica, el paciente no ha recibido trasplante renal o paciente en abandono)", "Var69_4 Fecha de diagnóstico si ha presentado alguna complicación vascular\n(Registre la fecha en el formato AAAA-MM-DD. Verifique que el orden de los números sea AÑO-MES-DÍA y el separador sea guion (-). Si conoce sólo el año y el mes, registre el día 01.\nSi conoce solamente el año registre 01 como mes y 01 como día. Tener en cuenta que las complicaciones vasculares incluyen:\n• Trombosis, pseudoaneurisma o estenosis de la arterial renal, de la arteria iliaca o del injerto.\n• Estenosis de la arteria renal.\n• Trombosis de la vena renal o de la vena iliaca.\nNo se deben registrar en esta variable:\n• Trombosis de la fístula\n• Trombosis venosa profunda de miembros inferiores\n1800-01-01 = No ha tenido esta complicación\n1845-01-01 = No aplica, el paciente no ha recibido trasplante renal o paciente en abandono)", "Var69_5 Fecha de diagnóstico si ha presentado alguna complicación urológica\n(Registre la fecha en el formato AAAA-MM-DD. Verifique que el orden de los números sea AÑO-MES-DÍA y el separador sea guion (-). Si conoce sólo el año y el mes, registre el día 01. Si conoce solamente el año registre 01 como mes y 01 como día.\nTener en cuenta que las complicaciones urológicas incluyen: uropatia obstructiva, urinoma y fístula del uréter. No se debe registrar en esta variable las infecciones urinarias.\n1800-01-01 = No ha tenido esta complicación\n1845-01-01 = No aplica, el paciente no ha recibido trasplante renal o paciente en abandono)", "Var69_6 Fecha de diagnóstico si ha presentado alguna complicación herida quirúrgica\n(Registre la fecha en el formato AAAA-MM-DD. Verifique que el orden de los números sea AÑO-MES-DÍA y el separador sea guion (-). Si conoce sólo el año y el mes, registre el día 01. Si conoce solamente el año registre 01 como mes y 01 como día.\nTener en cuenta que las complicaciones de la herida quirúrgica, incluyen: dehiscencia cutánea, colección subcutánea, sobreinfección de la herida quirúrgica, infecciones superficiales, celulitis, infección supra o infra aponeurótica, hernia incisional, infección del sitio operatorio y seroma.\n1800-01-01 = No ha tenido esta complicación\n1845-01-01 = No aplica, el paciente no ha recibido trasplante renal o paciente en abandono)", "Var69_7 Fecha del primer diagnóstico de cáncer\n(Registre la fecha en el formato AAAA-MM-DD. Verifique que el orden de los números sea AÑO-MES-DÍA y el separador sea guion (-). Si conoce sólo el año y el mes, registre el día 01. Si conoce solamente el año registre 01 como mes y 01 como día.\n1800-01-01= No ha tenido esta complicación\n1845-01-01=No aplica, el paciente no ha recibido trasplante renal o paciente en abandono)", "Var70 Cuantos médicamentos inmunosupresores se formularon\n(Escriba el número de medicamentos inmunosupresores formulados en la última consulta de nefrología realizada en el periodo en el periodo de reporte\n98= No aplica, el paciente no ha recibido trasplante renal o paciente en abandono)", "Var70_1 Ha recibido metilprednisolona\n(1 = Si\n2 = No\n98 = No aplica, el paciente no ha recibido trasplante renal o paciente en abandono)", "Var70_2 Ha recibido azatioprina\n(1 = Si\n2 = No\n98 = No aplica, el paciente no ha recibido trasplante renal o paciente en abandono)", "Var70_3 Ha recibido ciclosporina\n(1 = Si\n2 = No\n98 = No aplica, el paciente no ha recibido trasplante renal o paciente en abandono)", "Var70_4 Ha recibido micofenolato\n(1 = Si\n2 = No\n98 = No aplica, el paciente no ha recibido trasplante renal o paciente en abandono)", "Var70_5 Ha recibido tacrolimus\n(1 = Si\n2 = No\n98 = No aplica, el paciente no ha recibido trasplante renal o paciente en abandono)", "Var70_6 Ha recibido prednisona\n(En caso de que el paciente haya recibido manejo para trasplante renal con prednisolona debe reportarse en esta variable.\n1 = Si\n2 = No\n98 = No aplica, el paciente no ha recibido trasplante renal o paciente en abandono\nLos pacientes del régimen subsidiado reportados por el ente territorial deben reportar códigos CUMS de inmunosupresores para manejo de trasplante renal no incluidos en el plan de beneficios en salud en las variables 70.7 a la 70.9.)", "Var70_7 Ha recibido Medicamento NO POS 01\n(Registre el código CUM del medicamento usado en este caso (códigos CUM disponibles en la plataforma SISCAC, ruta cargue de archivo plano – pestaña de archivos operativos).\n97 = No aplica, paciente con trasplante renal que no recibió medicamento inmunosupresor no POS\n98 = No Aplica el paciente no ha recibido trasplante renal o paciente en abandono)", "Var70_8 Ha recibido Medicamento NO POS 02\n(Registre el código CUM del medicamento usado en este caso (códigos CUM disponibles en la plataforma SISCAC, ruta cargue de archivo plano – pestaña de archivos operativos).\n97 = No aplica, paciente con trasplante renal que no recibió medicamento inmunosupresor no POS\n98 = No aplica, el paciente no ha recibido trasplante renal o paciente en abandono)", "Var70_9 Ha recibido Medicamento NO POS 03\n(Registre el código CUM del medicamento usado en este caso (códigos CUM disponibles en la plataforma SISCAC, ruta cargue de archivo plano – pestaña de archivos operativos).\n97 = No aplica, paciente con trasplante renal que no recibió medicamento inmunosupresor no POS\n98 = No aplica, el paciente no ha recibido trasplante renal o paciente en abandono)", "Var71 Cuantos episodios de rechazo agudo ha presentado el usuario\n(Registre el número de rechazos agudos confirmados por biopsia en los primeros 12 meses posteriores al trasplante\n98 = No aplica, el paciente nunca ha recibido trasplante renal o el paciente no ha presentado episodios de rechazo agudo o paciente en abandono)", "Var72 Fecha del primer rechazo del injerto\n(Registre la fecha en el formato AAAA-MM-DD. Verifique que el orden de los números sea AÑO-MES-DÍA y el separador sea guion (-). Si conoce sólo el año y el mes, registre el día 01. Si conoce solamente el año registre 01 como mes y 01 como día.\n1800-01-01 = Desconocida\n1845-01-01 = No aplica, el paciente nunca ha recibido trasplante renal o el paciente no ha presentado episodios de rechazo agudo o paciente en abandono)", "Var73 Fecha de retorno a diálisis\n(Registre la fecha en el formato AAAA-MM-DD. Si conoce sólo el año y el mes, registre el día 01. Verifique que el orden de los números sea AÑO-MES-DÍA y el separador sea guion (-). Si conoce solamente el año registre 01 como mes y 01 como día. Registre:\n1800-01-01= desconocida.\n1845-01-01=No aplica, el paciente nunca ha recibido trasplante renal o el paciente con trasplante funcional o paciente en abandono)", "Var74 Número de trasplantes renales que ha recibido\n(Registre el número de trasplantes recibidos.\n98= No aplica, el paciente nunca ha recibido trasplante renal o paciente en abandono)", "Var75 Costo de la terapia postrasplante\n(Registre costo total de la terapia postrasplante del usuario durante el período de reporte (1 de julio de 2023 a 30 de junio de 2024). Esta variable aplica para los pacientes trasplantados que tengan funcional el trasplante (V64= 1 o 2). En este costo se deben incluir solamente los costos de los medicamentos incluidos en el plan de beneficios para el tratamiento de inmunosupresión.\n98= No aplica, el paciente nunca ha recibido trasplante renal o trasplante renal no funcional o paciente en abandono.)", "Var76 Meses de prestación de servicios\n(Número de meses en los que el usuario efectivamente recibió servicios relacionadas con HTA, DM o ERC a cargo de la EPS que reporta (del periodo comprendido entre 1 de julio del 2024 a 30 de junio de 2025).\nEsta información será validada con los soportes de las consultas que apliquen y las fórmulas, cargados en el repositorio.)", "Var77 Costo Total\n(Costo total acumulado de la atención del usuario a la fecha de reporte (1 de julio de 2024 a 30 de junio de 2025). En este campo se deben agregar todos los costos en el usuario, relacionados con los diagnósticos registrados, incluyendo, entre otros, los costos de citas de control, medicamentos, costos de diálisis, trasplante y atención de complicaciones.\n98= Paciente en abandono)", "Var78 EPS de origen\n(Registre el código de la EAPB/Ente territorial donde estaba afiliado el usuario antes de trasladarse a la EAPB/Ente territorial que reporta.\n98 = No aplica\n99 = Sin dato)", "Var79 Novedad con respecto al reporte anterior\n(Las novedades administrativas a reportar en este campo corresponderán a eventos ocurridos respecto al reporte anterior.\n1 = Persona que falleció (esta novedad también aplica a los casos de personas que iniciaron TRR crónica dentro del periodo de reporte pero que a la fecha de corte están fallecidas), 2 = Persona que ingresó a la EPS y traía el diagnóstico de ERC o HTA o DM, 3 = Persona antigua en la EPS y se le realizó nuevo diagnóstico de ERC o HTA o DM., 4 = Persona antigua en la EPS con diagnóstico antiguo de ERC o HTA o DM que ingresa a la BD para reporte de la CAC, 5 = Persona que firmó alta voluntaria del tratamiento prescrito, 6 = Persona que se desafilió (esta novedad también aplica a los casos de personas que iniciaron TRR crónica dentro del periodo de reporte pero que a la fecha de corte están desafiliadas), 7 = Persona que abandona la terapia y no es posible de ubicar, 8 = Persona que se elimina de la BD por corrección de la EPS (auditoría interna o auditoría de la CAC porque el caso reportado no tiene diagnóstico de ERC, HTA ni DM), 9 = Persona que regresa a terapia, 10 = El usuario que cambio de tipo y/o número de identificación respecto al reporte anterior, 12 = Población migrante de la república de Venezuela, 13 = Usuario identificado por fuentes externas con diagnóstico (ERC-HTA-DM) descartado por la entidad o fallecido/desafiliado no gestionado por la entidad sin diagnóstico confirmado de ERC, HTA ni DM, 14 = Usuario identificado por fuentes externas con diagnóstico ERC o HTA o DM, no gestionado por la entidad., 15= Paciente trasladado de EAPB, que fue glosado en periodo anterior y no fue gestionado por la entidad (receptora) en el periodo., 98 = No hay novedad respecto al reporte anterior)", "Var80 Causa Muerte\n(1 = Enfermedad renal crónica\n2 = Enfermedad cardiovascular\n3 = Cáncer\n4 = Infección\n5 = Por causa diferente a las descritas en 1, 2, 3 y 4\n6 = Causa Externa\n98 = No aplica, el usuario no ha fallecido\n99 = Paciente que fallece, pero no hay información sobre la causa de muerte en la historia clínica)", "Var80_1 Fecha Muerte\n(Registre la fecha en el formato AAAA-MM-DD. Si conoce sólo el año y el mes, registre el día 01. Si conoce solamente el año registre 01 como mes y 01 como día.\n1845-01-01=No aplica, el usuario no ha fallecido.)", "Var81_CodigoSerial\n(Registre el código único serial de identificación (BDUA, BDEX, PVS asignado al paciente por el Ministerio de Salud y Protección social. Los Entes Territoriales deben registrar 0 en esta variable.)", "Var82_FechaCorte", "FECHA DE PROXIMA CONSULTA", "FECHA DE HOSPITALIZACION ", "HOSPITALIZACION EVITABLE (SI/ NO)", "SEGUIMIENTO"];
/* portal.js:232 */
const CAC_H_ERC=["Campo 1 Primer nombre del usuario", "Campo 2 Segundo nombre del usuario", "Campo 3 Primer apellido del usuario", "Campo 4 Segundo apellido del usuario", "Campo 5 Tipo de Identificación del usuario", "Campo 6 Número de Identificación del usuario", "Campo 7 Fecha de nacimiento", "Campo 8 Sexo", "Campo 9 Régimen de afiliación AL SGSS", "Campo 10 Código de la EPS o de la entidad territorial", "Campo 11 Código pertenencia étnica", "Campo 12 Grupo poblacional", "Campo 13 Municipio de residencia", "Campo 14 número telefónico del paciente (incluyendo a familiares y cuidadores)", "Campo 15 Fecha de afiliación a la EPS que registra", "Campo 16 Código de la IPS donde se hace seguimiento al usuario", "Campo 17 Fecha de ingreso al programa de atención renal (renoprotección, nefroprotección, protección renal, prediálisis) dentro de la EAPB/Ente territorial que reporta", "Campo 18 El usuario tiene diagnóstico confirmado de Hipertensión Arterial -HTA (CIE-10 con códigos entre I10-I159)", "Campo 19 Fecha de diagnostico de la Hipertension Arterial", "Campo 19.1 Costo HTA durante el período de reporte", "Campo 20 El usuario tiene diagnóstico confirmado de Diabetes Mellitus- DM (CIE-10 con códigos entre E10-E149; O24-O249; P702)", "Campo 21 Fecha de diagnostico de la Diabetes Mellitus", "Campo 21.1 Costo DM durante el período de reporte", "Campo 22 Etiología de la ERC", "Campo 23 Peso (kg)", "Campo 24 Talla (cm)", "Campo 25 Tensión arterial sistólica (mm de Hg)", "Campo 26 Tensión arterial diastólica (mm de Hg)", "Campo 27 Creatinina (mg/dl)", "Campo 27.1 Fecha de última Creatinina", "Campo 28 Hemoglobina Glicosilada", "Campo 28.1 Fecha de última Hemoglobina Glicosilada", "Campo 29 Albuminuria", "Campo 29.1 Fecha de la última Albuminuria", "Campo 30 Relación Albuminuria/Creatinuria", "Campo 30.1 Fecha de la última Creatinuria", "Campo 31 Colesterol total", "Campo 31.1 Fecha de la último Colesterol total", "Campo 32 HDL", "Campo 32.1 Fecha de la último HDL", "Campo 33 LDL", "Campo 33.1 Fecha del último LDL", "Campo 34 PTH", "Campo 34.1 Fecha de la última PTH", "Campo 35 Tasa de filtración glomerular (TFGe) según Cockroft-Gault (en adultos) y Swhartz (en menores de 18 años) o FRR estimada mediante el cálculo del Kru, dentro del periodo del reporte", "Campo 36 El usuario recibe Inhibidor de la Enzima convertidora de angiotensina (IECA)", "Campo 37 El usuario recibe Inhibidor de la Enzima convertidora de angiotensina (IECA)", "Campo 38 El usuario tiene diagnóstico de enfermedad renal crónica en cualquier de sus estadios", "Campo 39 Estadio de ERC (Enfermedad Renal: Ver las notas finales numeral V)", "Campo 40 Fecha de diagnóstico de ERC estadio 5 (Solo aplica si marco la opción 5 de la pregunta anterior)", "Campo 41 La persona se encuentra en un programa de atención de ERC (renoprotección, nefroprotección, protección renal, prediálisis)", "Campo 42 TFG a la fecha, en que el usuario inicio la primera terapia de reemplazo renal -TRR", "Campo 43 Modo de Inicio de la Terapia de Reemplazo Renal (primera TRR)", "Campo 44 Fecha en que se inicio la terapia de reemplazo renal que recibe el usuario en el momento de la fecha de corte. Sí el Trasplante es la terapia reportada, esta Fecha se refiere a la Fecha de trasplante", "Campo 45 Fecha de Ingreso a la Unidad Renal Actual que le presta el servicio en el momento de la fecha de corte, en cualquier modalidad de terapia dialítica (Unidad Actual)", "Campo 46 Hemodiálisis (HD)", "Campo 47 Dosis de diálisis (Kt/V) single pool", "Campo 48 Costo total de la hemodiálisis HD durante el período de reporte", "Campo 49 Diálisis peritoneal (DP)", "Campo 50 Dosis de diálisis (Kt/V) dpd. KTV/dpd: de máximo cuatro meses de antigüedad contados a partir de la fecha de corte", "Campo 51 Numero de horas de hemodiálisis", "Campo 52 Peritonitis", "Campo 53 Costo DP durante el período de reporte", "Campo 54 Vacuna Hepatitis B", "Campo 55 Registre la fecha de diagnóstico de la infección por Hepatitis B, si el usuario la ha presentado", "Campo 56 Registre la fecha de diagnóstico de la infección por Hepatitis C, si el usuario la ha presentado", "Campo 57 Terapia no Dialítica para ERC estadio 5 (también llamada tratamiento médico de nefroproteción)", "Campo 58 Costo de la terapia ERC estadio 5 con tratamiento médico", "Campo 59 Hemoglobina. (aplica solo cuando el usuario está en diálisis). Las hemoglobinas deben ser del último trimestre contado a partir de la fecha de corte y sus tomas debieron ser pre-diálisis en personas en hemodiálisis", "Campo 60 Albúmina Sérica (aplica solo cuando el usuario está en diálisis). La albúmina debe tener máximo tres meses de antigüedad a partir de la fecha de corte y su toma debió ser pre-diálisis en personas en hemodiálisis", "Campo 61 Fósforo (P) (aplica solo cuando el usuario está en diálisis). Los niveles séricos de fósforo deben ser del último trimestre contado a partir de la fecha de corte y sus tomas debieron ser pre-diálisis en personas en hemodiálisis", "Campo 62 Última valoración clínica por nefrología dentro del periodo de reporte de pacientes con ERC estadio 5 en diálisis o con TMND,en relación con la posibilidad de trasplante renal", "Campo 62.1 ¿Se reportó cáncer activo en los últimos 12 meses, como contraindicación para el transplante renal, en la valoración de nefrología?", "Campo 62.2 ¿Se reportó infección crónica o activa no tratada o no controlada hasta en los últimos tres meses antes de la fecha de corte, como contraindicación para el transplante renal, en la valoración de nefrología?", "Campo 62.3 ¿Se reportó como contraindicación para el transplante renal, en la valoración de nefrología que el paciente NO ha manifestado su deseo de trasplantarse?", "Campo 62.4 ¿Se reportó como contraindicación para el transplante renal, en la valoración de nefrología que el paciente presenta esperanza de vida menor o igual a 6 meses?", "Campo 62.5 ¿Se reportó como contraindicación para el transplante renal, en la valoración de nefrología que el paciente presenta potenciales limitaciones al autocuidado y adherencia al tratamiento post trasplante?", "Campo 62.6 ¿Se reportó enfermedad cardiaca, cerebrovascular o vascular periférica, como contraindicación para el transplante renal, en la valoración de nefrología?", "Campo 62.7 ¿Se reportó infección por el VIH, como contraindicación para el transplante renal, en la valoración de nefrología?", "Campo 62.8 ¿Se reportó infección por el VHC, como contraindicación para el transplante renal, en la valoración de nefrología?", "Campo 62.9 ¿Se reportó como contraindicación para el transplante renal, en la valoración de nefrología, que el paciente presenta enfermedad inmunológica activa los últimos tres meses antes de la fecha de corte?", "Campo 62.10 ¿Se reportó como contraindicación para el transplante renal, en la valoración de nefrología, que el paciente presenta enfermedad pulmonar crónica?", "Campo 62.11 ¿Se reportó como contraindicación para el transplante renal, en la valoración de nefrología, que el paciente presenta otras enfermedades crónicas?", "Campo 63 Fecha de Ingreso a lista de espera para la realización del trasplante", "Campo 63.1 Registre el código de la IPS donde está en lista de espera", "Campo 64 ¿El usuario ha recibido trasplante renal?", "Campo 65 Código de la EPS que realizó el trasplante", "Campo 66 Código de la IPS o Grupo de trasplante, que realizó el último trasplante renal", "Campo 67 Tipo de donante", "Campo 68 Costo del trasplante", "Campo 69 ¿El usuario ha presentado alguna complicación relacionada con el trasplante renal?", "Campo 69.1 Fecha de diagnóstico si ha presentado infección por Citomegalovirus", "Campo 69.2 Fecha de diagnóstico si ha presentado infección por hongos", "Campo 69.3 Fecha de diagnóstico si ha presentado infección por tuberculosis", "Campo 69.4 Fecha de diagnóstico si ha presentado alguna complicación vascular", "Campo 69.5 Fecha de diagnóstico si ha presentado alguna complicación urológica", "Campo 69.6 Fecha de diagnóstico si ha presentado alguna complicación herida quirúrgica", "Campo 69.7 Fecha del primer diagnóstico de cáncer", "Campo 70 Cuantos médicamentos inmunosupresores se formularon para el manejo en este último corte", "Campo 70.1 En algún momento, desde el último reporte hasta el reporte actual ha recibido metilprednisolona", "Campo 70.2 En algún momento, desde el último reporte hasta el reporte actual ha recibido azatioprina", "Campo 70.3 En algún momento, desde el último reporte hasta el reporte actual ha recibido ciclosporina", "Campo 70.4 En algún momento, desde el último reporte hasta el reporte actual ha recibido micofenolato", "Campo 70.5 En algún momento, desde el último reporte hasta el reporte actual ha recibido tacrolimus", "Campo 70.6 En algún momento, desde el último reporte hasta el reporte actual ha recibido prednisona", "Campo 70.7 En el periodo del reporte, el paciente ha recibido para el manejo de trasplante renal, medicamentos inmunosupresores no incluidos en las Campo iables 70.1 a 70.6 o no incluidos en el plan de beneficios (medicamento 1)", "Campo 70.8 En el periodo del reporte, el paciente ha recibido para el manejo de trasplante renal, medicamentos inmunosupresores no incluidos en las Campo iables 70.1 a 70.6 o no incluidos en el plan de beneficios (medicamento 2)", "Campo 70.9 En el periodo del reporte, el paciente ha recibido para el manejo de trasplante renal, medicamentos inmunosupresores no incluidos en las Campo iables 70.1 a 70.6 o no incluidos en el plan de beneficios (medicamento 3)", "Campo 71 ¿Cuantos episodios de rechazo agudo en los últimos 12 meses al trasplante, confirmado por biopsia, ha presentado el usuario?", "Campo 72 Fecha del primer rechazo del injerto", "Campo 73 Fecha de retorno a diálisis", "Campo 74 Número de trasplantes renales que ha recibido", "Campo 75 Costo de la terapia postrasplante", "Campo 76 Tiempo de prestación de servicios", "Campo 77 Costo Total", "Campo 78 Código de la EPS de origen", "Campo 79 Novedad con respecto al reporte anterior", "Campo 80 Causa de Muerte", "Campo 80.1 Fecha de muerte", "Campo 81 Código único de identificación BDUA", "Campo 82 Fecha de Corte", "Fecha de ultimo peso", "Fecha ultima talla", "Fecha de ultimos trigliceridos", "Resultado de ultimos trigliceridos", "Fecha de ultima TFG calculada y registrada en HC", "Fecha de diagnostico de ERC (1-4)", "Fecha ultima Hemoglobina", "Fecha ultima Albúmina Sérica", "Fecha ultima Fósforo", "Fecha de ultima Valoración Clínica por nefrología", "Fecha de ultima valoración médica del programa", "Valoración Ultima Especialidad médica del programa", "Fecha de ultima valoración médica Endocrinología", "Fecha de ultima valoración médica Oftalmología o foto de retina", "Fecha de ultima valoración Enfermería", "Fecha de ultima valoración Nutrición", "Fecha de ultima valoración Trabajo Social", "Fecha de ultima valoración QF", "Fecha de ultima valoración psicología", "Fecha de ultimo parcial de orina", "Resultado de ultimo parcial de orina", "Circunferencia de cintura"];
/* portal.js:233 */
const CAC_SHEET_FOMAG="BD ERC-TRR";
/* portal.js:234 */
const CAC_SHEET_ERC="860010090801_31072026_ERC_DIALI";
/* portal.js:237 */
function pacs(){ensureIdx();return ST.book.pac.filter(p=>p.ID);}
/* portal.js:238 */
function popCut(c,eps){return pacs().filter(p=>(!eps||p.EPS===eps)&&activeAt(p,c)&&adult(p,c)&&ninety(p,c));}
/* portal.js:239 */
function popPer(a,c,eps){return pacs().filter(p=>(!eps||p.EPS===eps)&&overlaps(p,a,c)&&adult(p,c));}
/* portal.js:240 */
function popInc(a,c,eps){return pacs().filter(p=>(!eps||p.EPS===eps)&&p.InicioTRR&&p.InicioTRR>=a&&p.InicioTRR<=c&&adult(p,p.InicioTRR));}
/* portal.js:241 */
function ctxFor(c,ps,eps){return{c,ps,eps,tri:addMonths(c,-3),sem:addMonths(c,-6),mes:addMonths(c,-1),ms:monthStart(c)};}
/* portal.js:245 */
const pv=(p,v)=>({p,v});
/* portal.js:246 */
function propLab(x,k,win,test,fmt){const r={num:[],den:[],excl:[],sd:[]};popCut(x.c,x.eps).forEach(p=>{const l=lastLab(p,k,win==="sem"?x.sem:x.tri,x.c);const v=l?num(l.Valor):null;r.den.push(pv(p,v==null?"sin dato":(fmt?fmt(v):v)+" · "+fd(l.FechaToma)));if(v==null)r.sd.push(p);else if(test(v))r.num.push(pv(p,v));});return r;}
/* portal.js:247 */
const IND=[
 {c:"dia_10_adul",n:"Adultos en HD con CVC como acceso vascular",t:"pct",dir:"down",cuts:[10,20],win:"Al corte",src:"Acceso de la última sesión realizada o acceso actual del paciente",ex:"No factibilidad de FAV con concepto, desistimiento firmado, cuidados paliativos (con soporte en Acceso vascular).",
  f:x=>{const r={num:[],den:[],excl:[],sd:[]};popCut(x.c,x.eps).forEach(p=>{if(RUTA_EXCL.includes(p.RutaAcceso)){r.excl.push({p,why:p.RutaAcceso+(p.SoporteRuta?" · "+p.SoporteRuta:" · SIN SOPORTE")});return;}const a=accessAt(p,x.c);r.den.push(pv(p,a||"sin dato"));if(!a)r.sd.push(p);else if(isCVC(a))r.num.push(pv(p,a));});return r;}},
 {c:"dia_11_adul",n:"Adultos en HD con Kt/V ≥ 1,2",t:"pct",dir:"up",cuts:[80,60],win:"Último Kt/V en los 3 meses previos al corte",src:"Paraclínicos · Kt/V con método registrado",f:x=>propLab(x,"KtV","tri",v=>v>=1.2,v=>f1(v,2))},
 {c:"dia_13_adul",n:"Adultos en HD con hemoglobina ≥ 10 g/dL",t:"pct",dir:"up",cuts:[60,20],win:"Último valor del trimestre",src:"Paraclínicos",f:x=>propLab(x,"Hb","tri",v=>v>=10)},
 {c:"dia_15_adul",n:"Adultos en HD con albúmina ≥ 4 g/dL",t:"pct",dir:"up",cuts:[40,20],win:"Último valor del trimestre",src:"Paraclínicos",f:x=>propLab(x,"Alb","tri",v=>v>=4,v=>f1(v,2))},
 {c:"dia_17_adul",n:"Adultos en HD con fósforo entre 2,5 y 6 mg/dL",t:"pct",dir:"up",cuts:[80,20],win:"Último valor del trimestre",src:"Paraclínicos",f:x=>propLab(x,"P","tri",v=>v>=2.5&&v<=6)},
 {c:"dia_20_adul",n:"Adultos en HD con sesiones de 4 horas o más",t:"pct",dir:"up",cuts:[90,10],win:"Promedio de las sesiones del último mes",src:"Turno del día · duración de cada sesión realizada",
  f:x=>{const r={num:[],den:[],excl:[],sd:[]};popCut(x.c,x.eps).forEach(p=>{if((num(p.SesSemana)||3)<3){r.excl.push({p,why:"Prescripción menor de 3 sesiones por semana"});return;}const S=sesIn(p,addDays(x.mes,1),x.c,"Realizada").filter(s=>num(s.DuracionMin)!=null);if(!S.length){r.den.push(pv(p,"sin dato"));r.sd.push(p);return;}const m=S.reduce((a,s)=>a+num(s.DuracionMin),0)/S.length;r.den.push(pv(p,f1(m,0)+" min ("+S.length+" ses.)"));if(m>=240)r.num.push(pv(p,m));});return r;}},
 {c:"dia_21_adul",n:"Adultos en HD incluidos en lista de espera de trasplante",t:"pct",dir:"up",cuts:null,win:"Periodo",src:"Pacientes · estado de trasplante",ex:"Disentimiento, cuidados paliativos, contraindicación con soporte.",
  f:x=>{const r={num:[],den:[],excl:[],sd:[]};popPer(x.ps,x.c,x.eps).forEach(p=>{const t=p.TxEstado||"Sin evaluar";if(["Disentimiento","Cuidados paliativos","No idóneo (contraindicación con soporte)"].includes(t)){r.excl.push({p,why:t});return;}r.den.push(pv(p,t==="Sin evaluar"?"Sin evaluar (no cumple)":t));if(t==="Sin evaluar"){r.sd.push(p);return;}if(t==="En lista de espera"||t==="Trasplantado")r.num.push(pv(p,t));});return r;},nota:"Regla D5 (8 oct 2026): los «Sin evaluar» entran al denominador y cuentan como no cumplimiento; se listan también como sin dato para gestionar el concepto de idoneidad. Los no candidatos a trasplante (contraindicación con soporte), el disentimiento y los cuidados paliativos se excluyen."},
 {c:"dia_23_adul",n:"Adultos en HD que abandonan el tratamiento",t:"pct",dir:"down",cuts:null,win:"Periodo",src:"Movimientos tipo Abandono (requiere desistimiento o búsqueda activa documentada)",
  f:x=>{const r={num:[],den:[],excl:[],sd:[]};popPer(x.ps,x.c,x.eps).forEach(p=>{const m=p._mov.find(m=>m.Tipo==="Abandono"&&m.Fecha>=x.ps&&m.Fecha<=x.c);r.den.push(pv(p,m?"Abandono "+fd(m.Fecha):""));if(m)r.num.push(pv(p,m.Detalle||""));});return r;}},
 {c:"dia_25_adul",n:"Adultos en HD con hepatitis C confirmada",t:"pct",dir:"down",cuts:null,win:"Periodo",src:"Paraclínicos · carga viral VHC detectable",
  f:x=>{const r={num:[],den:[],excl:[],sd:[]};popPer(x.ps,x.c,x.eps).forEach(p=>{const l=lastLab(p,"CVVHC",null,x.c);const tam=lastLab(p,"AntiVHC",null,x.c);r.den.push(pv(p,l?l.Valor:(tam?"Anti-VHC "+tam.Valor:"sin tamizaje")));if(!l&&!tam)r.sd.push(p);if(l&&/^detect/i.test(l.Valor))r.num.push(pv(p,"Detectable"));});return r;}},
 {c:"dia_26_adul",n:"Adultos que inician HD con anti-HBs ≥ 10 mUI/mL",t:"pct",dir:"up",cuts:[60,40],win:"Incidentes del periodo",src:"Paraclínicos · anti-HBs hasta 30 días después del inicio",ex:"No respondedores a la vacuna.",
  f:x=>{const r={num:[],den:[],excl:[],sd:[]};popInc(x.ps,x.c,x.eps).forEach(p=>{if(p.VHBNoRespondedor==="SI"){r.excl.push({p,why:"No respondedor"});return;}const l=lastLab(p,"AntiHBs",null,addDays(p.InicioTRR,30));const v=l?num(l.Valor):null;r.den.push(pv(p,v==null?"sin dato":v));if(v==null)r.sd.push(p);else if(v>=10)r.num.push(pv(p,v));});return r;}},
 {c:"dia_27_adul",n:"Adultos en HD con PTH entre 130 y 600 pg/mL",t:"pct",dir:"up",cuts:null,win:"Último valor en 6 meses",src:"Paraclínicos",ex:"Paratiroidectomía realizada o programada; antineoplásicos.",
  f:x=>{const r={num:[],den:[],excl:[],sd:[]};popCut(x.c,x.eps).forEach(p=>{if(p.Paratiroidectomia==="SI"){r.excl.push({p,why:"Paratiroidectomía"});return;}const l=lastLab(p,"PTH",x.sem,x.c);const v=l?num(l.Valor):null;r.den.push(pv(p,v==null?"sin dato":l.Valor));if(v==null)r.sd.push(p);else if(v>=130&&v<=600)r.num.push(pv(p,v));});return r;}},
 {c:"dia_29_adul",n:"Adultos en HD con hipercalcemia (calcio > 10,5 mg/dL)",t:"pct",dir:"down",cuts:null,win:"Promedio del trimestre, calcio total no corregido",src:"Paraclínicos",
  f:x=>{const r={num:[],den:[],excl:[],sd:[]};popCut(x.c,x.eps).forEach(p=>{const L=labsIn(p,"Ca",x.tri,x.c).map(l=>num(l.Valor)).filter(v=>v!=null);if(!L.length){r.den.push(pv(p,"sin dato"));r.sd.push(p);return;}const m=L.reduce((a,b)=>a+b,0)/L.length;r.den.push(pv(p,f1(m)));if(m>10.5)r.num.push(pv(p,m));});return r;}},
 {c:"dia_31_adul",n:"Hospitalización por todas las causas en HD",t:"rate",unit:"por 12 meses-paciente",dir:"down",cuts:null,win:"Periodo · meses de exposición",src:"Novedades · hospitalización con fecha de ingreso y egreso",
  f:x=>{let ev=0,days=0;const list=[];popPer(x.ps,x.c,x.eps).forEach(p=>{days+=activeDays(p,x.ps,x.c);p._nov.filter(n=>n.Tipo==="Hospitalización"&&n.Inicio>=x.ps&&n.Inicio<=x.c).forEach(n=>{const dur=n.Fin?dayDiff(n.Inicio,n.Fin):null;const ok=dur==null?dayDiff(n.Inicio,x.c)>=1:dur>=1;if(ok){ev++;list.push(pv(p,fd(n.Inicio)+(n.Fin?" a "+fd(n.Fin):" (sin egreso)")));}});});const meses=days/30.4375;return{ev,exp:meses,val:meses?ev/meses*12:null,list,expl:ev+" hospitalizaciones / "+f1(meses)+" meses de exposición"};}},
 {c:"dia_33_adul",n:"Infección del torrente sanguíneo asociada a CVC",t:"rate",unit:"por 1.000 días-catéter",dir:"down",cuts:[1.5],win:"Periodo · días-catéter",src:"Eventos ITS-CVC confirmados por Laboratorio (o dato heredado) · días-catéter del registro de dispositivos",
  f:x=>v6Its(x,true)},
 {c:"dia_34_adul",n:"Adultos que inician HD con FAV madura",t:"pct",dir:"up",cuts:null,win:"Incidentes del periodo menores de 80 años",src:"Pacientes · acceso al inicio",nota:"La síntesis CAC pide verificar la fórmula final contra el instructivo operativo antes de reportar.",
  f:x=>{const r={num:[],den:[],excl:[],sd:[]};popInc(x.ps,x.c,x.eps).forEach(p=>{const a=ageAt(p,p.InicioTRR);if(a!=null&&a>=80){r.excl.push({p,why:"80 años o más al inicio"});return;}r.den.push(pv(p,p.AccesoInicial||"sin dato"));if(!p.AccesoInicial)r.sd.push(p);else if(p.AccesoInicial==="FAV")r.num.push(pv(p,"FAV"));});return r;}},
 {c:"dia_35_adul",n:"Incidentes evaluados con escala de calidad de vida",t:"pct",dir:"up",cuts:null,win:"Del inicio a 90 días",src:"Paraclínicos · escala de calidad de vida",
  f:x=>{const r={num:[],den:[],excl:[],sd:[]};popInc(x.ps,x.c,x.eps).forEach(p=>{const l=lastLab(p,"EscalaCV",addDays(p.InicioTRR,-31),addDays(p.InicioTRR,90));r.den.push(pv(p,l?(l.Metodo||"escala")+" "+fd(l.FechaToma):"sin escala"));if(l)r.num.push(pv(p,l.Valor));});return r;}},
 {c:"dia_36_adul",n:"Prevalentes evaluados con escala de calidad de vida",t:"pct",dir:"up",cuts:null,win:"Periodo",src:"Paraclínicos · escala de calidad de vida",
  f:x=>{const r={num:[],den:[],excl:[],sd:[]};popPer(x.ps,x.c,x.eps).forEach(p=>{const l=lastLab(p,"EscalaCV",addDays(x.ps,-1),x.c);r.den.push(pv(p,l?(l.Metodo||"escala")+" "+fd(l.FechaToma):"sin escala"));if(l)r.num.push(pv(p,l.Valor));});return r;}},
 {c:"ins_its",inst:true,n:"ITS-CVC confirmadas y sospechas (sin hemocultivo positivo)",t:"rate",unit:"por 1.000 días-catéter",dir:"down",cuts:null,win:"Periodo · días-catéter",src:"Eventos ITS-CVC en cualquier estado de confirmación · días-catéter del registro de dispositivos",nota:"Sirve para no perder de vista las sospechas mientras se confirman. El indicador CAC (dia_33) cuenta solo las confirmadas.",
  f:x=>v6Its(x,false)},
 {c:"ins_hosp_atr",inst:true,n:"Hospitalización atribuible a la ERC o a la diálisis",t:"rate",unit:"por 12 meses-paciente",dir:"down",cuts:null,win:"Periodo · meses de exposición",src:"Novedades de hospitalización con «atribuible = Sí»",
  f:x=>{let ev=0,days=0;const list=[];popPer(x.ps,x.c,x.eps).forEach(p=>{days+=activeDays(p,x.ps,x.c);p._nov.filter(n=>n.Tipo==="Hospitalización"&&n.Inicio>=x.ps&&n.Inicio<=x.c&&n.Atribuible==="Sí").forEach(n=>{ev++;list.push(pv(p,fd(n.Inicio)+" · "+(n.Causa||n.Descripcion||"")));});});const m=days/30.4375;return{ev,exp:m,val:m?ev/m*12:null,list,expl:ev+" atribuibles / "+f1(m)+" meses"};}},
 {c:"ins_glu",inst:true,n:"Glucometrías en sesión en rango 80-180 mg/dL",t:"pct",dir:"up",cuts:null,meta:70,win:"Mes del corte",src:"Turno del día · glucometría de pacientes con DM",
  f:x=>{const r={num:[],den:[],excl:[],sd:[],sum:[0,0]};popPer(x.ms,x.c,x.eps).filter(p=>p.DM==="SI").forEach(p=>{const g=glucoStats(p,addDays(x.ms,-1),x.c);if(!g.n){r.sd.push(p);return;}r.sum[0]+=g.meta;r.sum[1]+=g.n;r.den.push(pv(p,g.meta+" de "+g.n+" en rango · promedio "+f1(g.avg,0)+(g.hipo?" · "+g.hipo+" < 70":"")));if(g.meta===g.n)r.num.push(pv(p,g.n));});r.val=r.sum[1]?r.sum[0]/r.sum[1]:null;r.expl=r.sum[0]+" en rango / "+r.sum[1]+" glucometrías";return r;}},
 {c:"ins_gid",inst:true,n:"Pacientes con ganancia interdialítica promedio > 4 % del peso seco",t:"pct",dir:"down",cuts:null,win:"Últimas 8 sesiones al corte",src:"Turno del día · peso pre y post",
  f:x=>{const r={num:[],den:[],excl:[],sd:[]};popCut(x.c,x.eps).forEach(p=>{const g=gidStats(p,x.c,8);if(!g.n){r.sd.push(p);r.den.push(pv(p,"sin dato"));return;}r.den.push(pv(p,f1(g.kg)+" kg · "+f1(g.pct)+" %"));if(g.pct>4)r.num.push(pv(p,g.pct));});return r;}},
 {c:"ins_cal",inst:true,n:"Calidad de diálisis buena o excelente",t:"pct",dir:"up",cuts:null,win:"Últimas 4 semanas y última valoración",src:"Matriz de evaluación integral (rúbrica institucional)",
  f:x=>{const r={num:[],den:[],excl:[],sd:[]};popCut(x.c,x.eps).forEach(p=>{const q=calidadDe(p,x.c);if(q.cat==="Sin datos suficientes"){r.sd.push(p);r.den.push(pv(p,"sin datos suficientes"));return;}r.den.push(pv(p,q.cat+" · "+q.tot+" puntos"));if(q.cat==="Bueno"||q.cat==="Excelente")r.num.push(pv(p,q.cat));});return r;}},
 {c:"ins_adh",inst:true,meta:95,n:"Sesiones realizadas sobre prescritas",t:"pct",dir:"up",cuts:null,win:"Mes del corte hasta la fecha de corte",src:"Turno del día · días de turno del paciente sin hospitalización ni viaje",
  f:x=>{const r={num:[],den:[],excl:[],sd:[],sum:[0,0]};popPer(x.ms,x.c,x.eps).forEach(p=>{const pr=progUpTo(p,x.ms,x.c).length,re=sesIn(p,x.ms,x.c,"Realizada").length;if(!pr&&!re)return;r.sum[0]+=re;r.sum[1]+=pr;r.den.push(pv(p,re+" de "+pr));if(re>=pr)r.num.push(pv(p,re));});r.val=r.sum[1]?Math.min(r.sum[0]/r.sum[1],9.99):null;r.expl=r.sum[0]+" realizadas / "+r.sum[1]+" prescritas";return r;}},
 {c:"ins_ina",inst:true,n:"Inasistencia sin aviso",t:"pct",dir:"down",cuts:null,win:"Mes del corte hasta la fecha de corte",src:"Turno del día · estado «No asistió»",
  f:x=>{const r={num:[],den:[],excl:[],sd:[],sum:[0,0]};popPer(x.ms,x.c,x.eps).forEach(p=>{const pr=progUpTo(p,x.ms,x.c).length;const na=sesIn(p,x.ms,x.c,"No asistió").length;if(!pr)return;r.sum[0]+=na;r.sum[1]+=pr;r.den.push(pv(p,na+" de "+pr));if(na)r.num.push(pv(p,na));});r.val=r.sum[1]?r.sum[0]/r.sum[1]:null;r.expl=r.sum[0]+" inasistencias / "+r.sum[1]+" sesiones prescritas";return r;}},
 {c:"ins_evt",inst:true,n:"Eventos en sesión por cada 100 sesiones",t:"rate",unit:"por 100 sesiones",dir:"down",cuts:null,win:"Mes del corte hasta la fecha de corte",src:"Turno del día · eventos",
  f:x=>{let ev=0,ss=0;const list=[];popPer(x.ms,x.c,x.eps).forEach(p=>{ss+=sesIn(p,x.ms,x.c,"Realizada").length;p._evt.filter(e=>e.Fecha>=x.ms&&e.Fecha<=x.c).forEach(e=>{ev++;list.push(pv(p,fd(e.Fecha)+" · "+e.Tipo+" · "+(e.Severidad||"")));});});return{ev,exp:ss,val:ss?ev/ss*100:null,list,expl:ev+" eventos / "+ss+" sesiones"};}}
];
/* portal.js:295 */
const INDM=Object.fromEntries(IND.map(i=>[i.c,i]));
/* portal.js:296 */
function progUpTo(p,a,c){const t=TODAY();return progDays(p,a,c).filter(d=>d<t||p._ses.some(s=>s.Fecha.getTime()===d.getTime()));}
/* portal.js:297 */
function evalInd(def,x){
  const r=def.f(x);let val,num_,den_;
  if(def.t==="rate"){val=r.val;num_=r.ev;den_=r.exp;}
  else if(r.val!==undefined){val=r.val;num_=r.sum[0];den_=r.sum[1];}
  else{num_=r.num.length;den_=r.den.length;val=den_?num_/den_:null;}
  return Object.assign({def,val,n:num_,d:den_,status:statusOf(def,val)},r);
}
/* portal.js:304 */
function statusOf(def,v){if(v==null)return"na";if(!def.cuts)return"base";const x=def.t==="pct"?v*100:v;
  if(def.t==="rate")return x<def.cuts[0]?"alto":"bajo";
  if(def.dir==="down"){const[lo,hi]=def.cuts;return x<lo?"alto":x<=hi?"medio":"bajo";}
  const[hi,lo]=def.cuts;return x>hi?"alto":x>=lo?"medio":"bajo";}
/* portal.js:308 */
const STATUS_TXT={alto:"Cumplimiento alto",medio:"Cumplimiento medio",bajo:"Cumplimiento bajo",base:"Línea de base",na:"Sin datos"};
/* portal.js:309 */
function fmtVal(def,v){if(v==null)return"—";return def.t==="pct"?pct(v):f1(v,def.c==="dia_33_adul"?2:1);}
/* portal.js:310 */
function trendPoints(def,n){const out=[];const c=ST.corte;for(let i=n-1;i>=0;i--){const ce=i===0?c:monthEnd(addMonths(monthStart(c),-i));const x=ctxFor(ce,addDays(addMonths(ce,-12),1),ST.eps);if(def.inst)x.ms=monthStart(ce);const r=evalInd(def,x);out.push({d:ce,v:r.val,n:r.n,dd:r.d});}return out;}
/* portal.js:313 */
function semaforo(p,c){
  const tri=addMonths(c,-3);const g=k=>{const l=lastLab(p,k,tri,c);return l?num(l.Valor):null;};
  const hb=g("Hb"),alb=g("Alb"),P=g("P");const a1c=p.DM==="SI"?(()=>{const l=lastLab(p,"HbA1c",addMonths(c,-6),c);return l?num(l.Valor):null;})():null;
  const T=sesIn(p,addDays(c,-30),c,"Realizada").map(s=>num(s.TASPre)).filter(v=>v!=null);let tas=T.length?T.reduce((a,b)=>a+b,0)/T.length:null;if(tas==null){const l=lastLab(p,"TAS",tri,c);tas=l?num(l.Valor):null;}
  const acc=accessAt(p,c);const sd=[];
  const sc={alb:alb==null?(sd.push("albúmina"),0):alb>=4?0:alb>=3.5?2:4,hb:hb==null?(sd.push("Hb"),0):hb>=10?0:hb>=8?1:3,p:P==null?(sd.push("fósforo"),0):P<6?0:P<=7.5?1:2,tas:tas==null?(sd.push("TA"),0):tas<140?0:tas<=160?1:2,a1c:p.DM!=="SI"?0:a1c==null?(sd.push("HbA1c"),0):a1c<7?0:a1c<=9?1:2,acc:acc==="CVC temporal"?3:isCVC(acc)?2:acc?0:(sd.push("acceso"),0)};
  const tot=Object.values(sc).reduce((a,b)=>a+b,0);const lvl=tot>=6?"alto":tot>=3?"medio":"bajo";
  const al=[];if(alb!=null&&alb<3)al.push("Desnutrición severa (albúmina < 3)");if(hb!=null&&hb<8)al.push("Anemia severa (Hb < 8)");if(hb!=null&&hb>13)al.push("Hb > 13: revisar dosis de AEE");if(tas!=null&&tas>160)al.push("TA sistólica > 160");if(P!=null&&P>7.5)al.push("Fósforo > 7,5");if(P!=null&&P<2.5)al.push("Fósforo < 2,5");if(a1c!=null&&a1c>9)al.push("HbA1c > 9");if(acc==="CVC temporal")al.push("Catéter temporal");if(alb!=null&&hb!=null&&alb<3.5&&hb<9)al.push("Posible complejo malnutrición-inflamación");
  return{hb,alb,P,tas,a1c,acc,sc,tot,lvl,sd,al};
}
/* portal.js:325 */
function alertas(){
  ensureIdx();const c=ST.corte;const A={busq:[],sinses:[],minimo:[],hb13:[],cvcplan:[],evab:[],its:[],hosp:[],gid:[],hipo:[],val:[],vac:[],est:[],venc:0};
  const act=pacs().filter(p=>epsOk(p)&&activeAt(p,c));
  act.forEach(p=>{
    const na=p._ses.filter(s=>s.Estado==="No asistió"&&s.Fecha<=c&&dayDiff(s.Fecha,c)<=14);
    na.forEach(s=>{const ct=p._ctc.find(k=>k.Fecha>=s.Fecha);if(!ct)A.busq.push({p,s});});
    if(!absentOn(p,c)){const last=[...p._ses].reverse().find(s=>s.Estado==="Realizada"&&s.Fecha<=c);const ref=last?last.Fecha:(p.IngresoUnidad||p.InicioTRR);if(ref&&dayDiff(ref,c)>=7)A.sinses.push({p,last:last?last.Fecha:null,dias:dayDiff(ref,c)});}
    const ms=monthStart(c),me=monthEnd(c);const min=ST.book.cfgv.minSes[p.EPS]??ST.book.cfgv.minSes.OTRA??8;const real=sesIn(p,ms,c,"Realizada").length;const rest=progDays(p,addDays(c,1),me).length;
    if(real+rest<min)A.minimo.push({p,real,rest,min,tipo:"No alcanza el mínimo aunque asista a todas"});else if(real+rest-min<=1)A.minimo.push({p,real,rest,min,tipo:"Sin margen: una inasistencia más lo deja por debajo"});
    const hb=lastLab(p,"Hb",addMonths(c,-3),c);if(hb&&num(hb.Valor)>13)A.hb13.push({p,v:num(hb.Valor),d:hb.FechaToma});
    const acc=accessAt(p,c);if(isCVC(acc)&&(!p.RutaAcceso||p.RutaAcceso==="Sin valorar"))A.cvcplan.push({p,acc});
    if(isCVC(acc)&&RUTA_EXCL.includes(p.RutaAcceso)&&!p.SoporteRuta)A.cvcplan.push({p,acc,sop:true});
    p._evt.filter(e=>e.Resuelto!=="Sí").forEach(e=>A.evab.push({p,e}));
    p._evt.filter(e=>e.Tipo===ITS&&["Cultivo sin registro en laboratorio","Cultivo en proceso","Sin cultivo"].includes(itsConf(e).st)).forEach(e=>A.its.push({p,e}));
    p._nov.filter(n=>n.Tipo==="Hospitalización"&&!n.Fin).forEach(n=>A.hosp.push({p,n}));
    A.venc+=labDue(p,c).filter(x=>x.st==="vencido").length;
    const g=gidStats(p,c,8);if(g.n>=3&&g.pct>4)A.gid.push({p,g});
    const gl=glucoStats(p,addDays(c,-14),c);if(gl.hipo)A.hipo.push({p,gl});
    const v=ultimaValoracion(p,c);if(!v||ym(v.Fecha)!==ym(c))A.val.push({p,v});
    const vs=vacStatus(p,c);if(vs.accion)A.vac.push({p,s:vs});estVencidos(p,c).forEach(e=>A.est.push({p,e}));
  });
  A.total=A.busq.length+A.sinses.length+A.minimo.filter(m=>m.tipo[0]==="N").length+A.hb13.length+A.cvcplan.length+A.its.length+A.hipo.length+A.vac.filter(x=>x.s.lvl==="bad").length;
  return A;
}
/* portal.js:351 */
function calidad(){
  ensureIdx();const c=ST.corte;const B=ST.book;const Q=[];const add=(g,p,t,lvl)=>Q.push({g,p,t,lvl:lvl||"warn"});
  const ids={},docs={};B.pac.forEach(p=>{(ids[p.ID]=ids[p.ID]||[]).push(p);if(p.Documento)(docs[p.Documento]=docs[p.Documento]||[]).push(p);});
  B.pac.filter(p=>p._dupOf).forEach(p=>add("Identificación",p,"Tenía el ID "+p._dupOf+" repetido con otro paciente en el Dashboard; al importar se le asignó "+p.ID+". Confirme que el número quedó con la persona correcta.","bad"));
  Object.values(docs).filter(a=>a.length>1).forEach(a=>add("Identificación",a[0],"Documento "+a[0].Documento+" repetido en "+a.map(p=>p.ID).join(", "),"bad"));
  const act=B.pac.filter(p=>activeAt(p,c));
  act.forEach(p=>{const miss=[];if(!p.Documento)miss.push("documento");if(!p.FechaNac)miss.push("fecha de nacimiento");if(!p.EPS)miss.push("EPS");if(!p.InicioTRR)miss.push("inicio de diálisis");if(!p.Turno)miss.push("turno");if(!p.Puesto)miss.push("puesto");if(!p.AccesoActual)miss.push("acceso actual");if(!p.Telefono)miss.push("teléfono");if(miss.length)add("Maestro incompleto",p,"Falta: "+miss.join(", "),miss.some(m=>/inicio|turno|EPS/.test(m))?"bad":"warn");});
  B.pac.filter(p=>p._endGuess).forEach(p=>add("Maestro incompleto",p,"Estado «"+p.Estado+"» sin fecha: registre el movimiento de egreso con su fecha.","bad"));
  const seat={};act.forEach(p=>{if(p.Turno&&p.Puesto){const k=p.Turno+"|"+p.Puesto;(seat[k]=seat[k]||[]).push(p);}});Object.entries(seat).filter(([k,a])=>a.length>1).forEach(([k,a])=>add("Turnos",a[0],"Puesto "+k.split("|")[1]+" del turno "+k.split("|")[0]+" asignado a "+a.map(p=>p.ID).join(" y "),"warn"));
  const from=addDays(c,-14);
  act.forEach(p=>{const seen=new Set(p._ses.map(s=>iso(s.Fecha)));progDays(p,from,addDays(c,-1)).forEach(d=>{if(!seen.has(iso(d)))add("Turnos sin cierre",p,"Sin registro de la sesión del "+fd(d)+" ("+p.Turno+")"+(p._ses.some(s=>/Importada/.test(s.Nota||s.Motivo||"")&&ym(s.Fecha)===ym(d))?". El Dashboard no distingue inasistencia de falta de registro: defina el estado en el turno de ese día":""),"warn");});});
  const sk={};B.ses.filter(live).forEach(s=>{const k=s.Paciente+"|"+iso(s.Fecha);(sk[k]=sk[k]||[]).push(s);if(s.Estado==="Realizada"&&(num(s.DuracionMin)==null||!s.Acceso)&&!/Importada/.test(s.Nota||s.Motivo||""))add("Sesiones",IDX.pac.get(s.Paciente),"Sesión del "+fd(s.Fecha)+" sin "+(num(s.DuracionMin)==null?"duración":"acceso"));if(s.Estado!=="Realizada"&&!s.Motivo)add("Sesiones",IDX.pac.get(s.Paciente),"Sesión no realizada del "+fd(s.Fecha)+" sin motivo");
    const p=IDX.pac.get(s.Paciente);if(!p)add("Sesiones",{ID:s.Paciente||"(vacío)"},"Sesión "+s.ID+" con paciente que no existe en el maestro","bad");else if(s.Fecha&&!activeAt(p,s.Fecha))add("Sesiones",p,"Sesión del "+fd(s.Fecha)+" cuando el paciente figura inactivo","bad");});
  Object.values(sk).filter(a=>a.length>1).forEach(a=>add("Sesiones",IDX.pac.get(a[0].Paciente),"Dos registros de sesión el "+fd(a[0].Fecha)+" ("+a.map(s=>s.ID).join(", ")+"): anule el que sobra","bad"));
  B.evt.filter(live).forEach(e=>{const p=IDX.pac.get(e.Paciente);if(!p)add("Eventos",{ID:"(sin paciente)"},"Evento del "+fd(e.Fecha)+" ("+e.Tipo+") sin paciente del maestro"+(e.Conducta?" · "+String(e.Conducta).slice(0,60):""),"bad");else if(e.Resuelto!=="Sí"&&e.Fecha&&dayDiff(e.Fecha,c)>7)add("Eventos",p,"Evento abierto desde "+fd(e.Fecha)+": "+e.Tipo);if(e.Tipo===ITS&&!e.Hemocultivo)add("Eventos",p||{ID:"?"},"ITS-CVC del "+fd(e.Fecha)+" sin resultado de hemocultivo","bad");});
  B.lab.filter(live).forEach(l=>{const e=EX[l.Examen];const p=IDX.pac.get(l.Paciente)||{ID:l.Paciente||"?"};if(l.FechaToma&&l.FechaToma>TODAY())add("Paraclínicos",p,l.Examen+" con fecha futura ("+fd(l.FechaToma)+")","bad");if(e&&!e.txt){const v=num(l.Valor);if(v!=null&&(v<e.lo||v>e.hi))add("Paraclínicos",p,e.l+" = "+l.Valor+" fuera de rango plausible ("+fd(l.FechaToma)+")","bad");}if(l.Examen==="KtV"&&!l.Metodo)add("Paraclínicos",p,"Kt/V del "+fd(l.FechaToma)+" sin método de cálculo");});
  B.nov.filter(live).forEach(n=>{if(n.Fin&&n.Inicio&&n.Fin<n.Inicio)add("Novedades",IDX.pac.get(n.Paciente)||{ID:"?"},"Novedad con egreso antes del ingreso","bad");});
  B.pac.filter(p=>p._noStart).forEach(p=>add("Maestro incompleto",p,"Sin fecha de ingreso a la unidad ni de inicio de diálisis: no se puede saber desde cuándo está activo","bad"));
  try{v6Calidad(add,c);}catch(e){console.error(e);}
  return Q;
}
/* portal.js:374 */
function tarifaFor(eps,d){const T=(ST.fin.data&&ST.fin.data.tarifas)||[];const c=T.filter(t=>t.eps===eps&&(!t.desde||pdate(t.desde)<=d)).sort((a,b)=>(pdate(b.desde)||0)-(pdate(a.desde)||0));return c[0]||null;}
/* portal.js:375 */
function conciliar(mes){
  ensureIdx();const ms=pdate(mes+"-01"),me=monthEnd(ms);const lim=me<ST.corte?me:ST.corte;const rows=[];
  pacs().filter(p=>epsOk(p)&&overlaps(p,ms,me)).forEach(p=>{
    const S=sesIn(p,ms,me);const real=S.filter(s=>s.Estado==="Realizada").length;const prog=progDays(p,ms,me).length;const miss={};S.filter(s=>s.Estado!=="Realizada").forEach(s=>{const r=s.Responsable||"Sin responsable";miss[r]=(miss[r]||0)+1;});
    const t=tarifaFor(p.EPS,me);let tipo="Sin tarifa",esp=null,ideal=null;
    if(t){const paq=num(t.paquete),ses=num(t.sesion),mn=num(t.min),mx=num(t.max);ideal=paq;if(!real){tipo="Sin sesiones";esp=0;}else if(mn!=null&&real<mn){tipo="Por sesión";esp=real*(ses||0);}else if(mx!=null&&real>mx&&t.extra==="SI"){tipo="Paquete + extra";esp=paq+(real-mx)*(ses||0);}else{tipo="Paquete";esp=paq;}}
    const fac=ST.fin.data&&ST.fin.data.facturado?num(ST.fin.data.facturado[mes+"|"+p.ID]):null;
    const full=activeAt(p,ms)&&activeAt(p,lim);let perd=0;if(full&&ideal!=null&&esp!=null&&(tipo==="Por sesión"||tipo==="Sin sesiones"))perd=ideal-esp;
    rows.push({p,real,prog,miss,t,tipo,esp,ideal,fac,full,dif:fac!=null&&esp!=null?fac-esp:null,perd});
  });
  return{rows,ms,me,lim};
}
/* portal.js:389 */
function freqOf(k){const f=ST.book.cfgv.freq||{};return f[k]!==undefined?f[k]:(EX[k]?EX[k].f:"");}
/* portal.js:390 */
function schedMonths(f){const A=Object.assign({},ANCHOR_DEF,ST.book.cfgv.anchor||{});if(f==="M")return[1,2,3,4,5,6,7,8,9,10,11,12];
  const step=f==="T"?3:f==="S"?6:f==="A"?12:0;if(!step)return[];const a=A[f]||1;const out=[];for(let i=0;i<12;i+=step)out.push(((a-1+i)%12)+1);return out.sort((x,y)=>x-y);}
/* portal.js:392 */
const susceptibleVHB=p=>{const L=p._lab.AntiHBs||[];const last=L.length?num(L[L.length-1].Valor):null;const hbs=p._lab.HBsAg||[];const pos=hbs.length&&/^react/i.test(hbs[hbs.length-1].Valor);return!pos&&(last==null||last<10);};
/* portal.js:393 */
function examApplies(p,k){const e=EX[k];if(!e)return false;if(e.dm&&p.DM!=="SI")return false;return true;}
/* portal.js:395 */
function examsForMonth(p,y,m){const out=[];const ms=new Date(y,m-1,1);
  const isNew=(p.IngresoUnidad&&dayDiff(p.IngresoUnidad,ms)<=60);
  EXAMS.forEach(e=>{const k=e.k;if(!examApplies(p,k))return;let f=freqOf(k);let why=FREQ_TXT[f]||"";
    if(k==="HBsAg"&&susceptibleVHB(p)){f="M";why="Mensual: anti-HBs < 10, susceptible (CDC 2001)";}
    if(isNew&&f&&!(p._lab[k]||[]).length){out.push({k,why:"Paquete de ingreso (sin resultado previo)"});return;}
    if(f&&schedMonths(f).includes(m))out.push({k,why});});
  return out;}
/* portal.js:403 */
function labDue(p,c){const out=[];const y=c.getFullYear(),m=c.getMonth()+1;
  EXAMS.forEach(e=>{const k=e.k;if(!examApplies(p,k))return;let f=freqOf(k);if(k==="HBsAg"&&susceptibleVHB(p))f="M";if(!f)return;const months=schedMonths(f);if(!months.length)return;
    const L=p._lab[k];const last=L&&L.length?L[L.length-1]:null;
    let prev=null;for(let i=1;i<=12;i++){const d=new Date(y,m-1-i,1);if(months.includes(d.getMonth()+1)){prev=d;break;}}
    const thisMonth=months.includes(m);const nm=addMonths(monthStart(c),1);const nextMonth=months.includes(nm.getMonth()+1);
    const since=prev&&(!last||last.FechaToma<prev);const inIv=prev&&p.IngresoUnidad&&p.IngresoUnidad>monthEnd(prev);
    let st="al día";if(since&&!inIv)st="vencido";else if(thisMonth&&!(last&&last.FechaToma>=monthStart(c)))st="este mes";else if(nextMonth)st="próximo mes";
    out.push({k,last,st,f,due:st==="próximo mes"?nm:st==="este mes"?monthStart(c):prev});});
  return out;}
/* portal.js:415 */
const CAL_DOM=[
 ["ktv","Depuración (Kt/V)","≥ 1,4 · 1,2-1,39 · < 1,2 (KDOQI 2015: objetivo 1,4, mínimo 1,2)"],
 ["gid","Ganancia interdialítica","< 3 % · 3-4 % · > 4 % del peso seco"],
 ["ufr","Tasa de ultrafiltración máxima","≤ 10 · 10-13 · > 13 mL/kg/h"],
 ["hemo","Tolerancia hemodinámica","sin hipotensión · 1 episodio o PAS mín 90-99 · ≥ 2 episodios o PAS < 90"],
 ["sint","Síntomas intradialíticos","nunca · 1 sesión · ≥ 2 sesiones en 4 semanas"],
 ["cong","Congestión residual pos-HD","no · ocasional · frecuente"],
 ["acc","Situación del acceso","sin hallazgos · dificultad, flujo o sangrado · signos de infección"],
 ["rec","Recuperación pos-HD","< 2 h · 2-6 h · > 6 h"],
 ["fat","Fatiga pos-HD (0-10)","0-3 · 4-6 · 7-10"],
 ["adh","Adherencia","sin pérdidas · 1 perdida o ≥ 2 acortadas · ≥ 2 perdidas"]
];
/* portal.js:427 */
const CAL_OPC={sint_pred:["Ninguno","Calambres","Mareo/presíncope","Náusea/vómito","Cefalea","Dolor torácico","Disnea","Prurito","Otro"],sint_frec:["Nunca","1 sesión","2 sesiones","≥3 sesiones"],cong:["No","Ocasional","Frecuente","No valorada"],
 acc:["Sin hallazgos","Dificultad de punción","Bajo flujo/presiones anormales","Sangrado prolongado","Signos de infección","Dolor/infiltración","Otro"],rec:["<2 h","2–6 h","6–12 h","12–24 h",">24 h","No sabe/no valorado"]};
/* portal.js:429 */
function calidadAuto(p,c){const a=addDays(c,-28);const R=sesIn(p,addDays(a,1),c);const real=R.filter(s=>s.Estado==="Realizada");
  const g=gidStats(p,c,8);const ta=taStats(p,c,12);const k=lastLab(p,"KtV",addMonths(c,-3),c);const ko=ktvOnline(p,c,8);
  const hipo=p._evt.filter(e=>e.Tipo==="Hipotensión intradialítica"&&e.Fecha>a&&e.Fecha<=c).length;
  const evS=new Set(p._evt.filter(e=>e.Fecha>a&&e.Fecha<=c&&e.Tipo!==ITS).map(e=>iso(e.Fecha))).size;
  const presc=num(p.DuracionMin)||ST.book.cfgv.durDefault;
  return{ktv:k?num(k.Valor):(ko?ko.avg:null),ktvSrc:k?"laboratorio "+fd(k.FechaToma):(ko?"en línea, promedio "+ko.n+" ses.":""),gidPct:g.pct,gidKg:g.kg,ufrMax:g.ufrMax,pasMin:ta.min,hipo,
    evSes:evS,perdidas:R.filter(s=>s.Estado==="No asistió").length,acortadas:real.filter(s=>num(s.DuracionMin)!=null&&num(s.DuracionMin)<presc-15).length,real:real.length};}
/* portal.js:436 */
function calidadScore(auto,man){man=man||{};const pt={},sd=[];const S=(k,v)=>{if(v==null){sd.push(k);pt[k]=null;}else pt[k]=v;};
  S("ktv",auto.ktv==null?null:auto.ktv>=1.4?0:auto.ktv>=1.2?1:2);
  S("gid",auto.gidPct==null?null:auto.gidPct<3?0:auto.gidPct<=4?1:2);
  S("ufr",auto.ufrMax==null?null:auto.ufrMax<=10?0:auto.ufrMax<=13?1:2);
  const h1=auto.hipo>=2?2:auto.hipo===1?1:0,h2=auto.pasMin==null?0:auto.pasMin<90?2:auto.pasMin<100?1:0;S("hemo",Math.max(h1,h2));
  const sf=man.sint_frec||(auto.evSes>=2?"2 sesiones":auto.evSes===1?"1 sesión":"Nunca");S("sint",sf==="Nunca"?0:sf==="1 sesión"?1:2);
  S("cong",!man.cong||man.cong==="No valorada"?null:man.cong==="No"?0:man.cong==="Ocasional"?1:2);
  S("acc",!man.acc?null:man.acc==="Sin hallazgos"?0:man.acc==="Signos de infección"?2:1);
  S("rec",!man.rec||man.rec==="No sabe/no valorado"?null:man.rec==="<2 h"?0:man.rec==="2–6 h"?1:2);
  S("fat",man.fat==null||man.fat===""?null:+man.fat<=3?0:+man.fat<=6?1:2);
  S("adh",auto.perdidas>=2?2:(auto.perdidas===1||auto.acortadas>=2)?1:0);
  const vals=Object.values(pt).filter(v=>v!=null);const tot=vals.reduce((a,b)=>a+b,0);const twos=vals.filter(v=>v===2).length;
  let cat;if((auto.ktv!=null&&auto.ktv<1.0)||twos>=3||tot>9)cat="Malo";else if(tot<=2&&twos===0)cat="Excelente";else if(tot<=5&&twos<=1)cat="Bueno";else cat="Regular";
  if(sd.length>=4)cat="Sin datos suficientes";
  const worst=CAL_DOM.filter(([k])=>pt[k]===2).map(([,l])=>l);
  return{pt,tot,cat,sd,revision:twos>0?"Sí":"No",motivo:worst[0]||"No aplica",worst};}
/* portal.js:452 */
const CAL_CLASS={"Excelente":"ok","Bueno":"ok","Regular":"warn","Malo":"bad","Sin datos suficientes":"base"};
/* portal.js:453 */
function ultimaValoracion(p,c){for(let i=p._val.length-1;i>=0;i--){const v=p._val[i];if(v.Fecha<=c)return v;}return null;}
/* portal.js:454 */
function calidadDe(p,c){const auto=calidadAuto(p,c);const v=ultimaValoracion(p,c);let man={};if(v&&dayDiff(v.Fecha,c)<=45){try{man=(JSON.parse(v.Datos||"{}").cal)||{};}catch(e){}}return Object.assign(calidadScore(auto,man),{auto,man,val:v});}
/* portal.js:1014 */
const D1800="1800-01-01",D1845="1845-01-01",D1811="1811-01-01";
/* portal.js:1015 */
const isoOr=(d,alt)=>d?iso(d):alt;
/* portal.js:1016 */
function cacVals(p,c,ps){const per=addDays(addMonths(c,-12),1);const tri=addMonths(c,-3);const L=(k,a)=>lastLab(p,k,a||per,c);const C=ST.book.cfgv;const miss=[];const need=(k,v,lbl)=>{if(v==null||v==="")miss.push(lbl);return v==null?"":v;};
  const nm=String(p.Nombres||"").trim().split(/\s+/),ap=String(p.Apellidos||"").trim().split(/\s+/);
  const lastS=[...p._ses].reverse().find(s=>s.Fecha<=c&&s.Estado==="Realizada"&&num(s.PesoPost)!=null);const lastTA=[...p._ses].reverse().find(s=>s.Fecha<=c&&s.Fecha>=per&&num(s.TASPre)!=null);
  const acc=accessAt(p,c);const dm=p.DM==="SI";const fall=p.Estado==="Fallecido";const aband=p.Estado==="Abandono";
  const v={};const lv=(k,cod,codF,a,dec)=>{const l=L(k,a);v[k]=l?(dec!=null?Math.round(num(l.Valor)*Math.pow(10,dec))/Math.pow(10,dec):l.Valor):cod;v["f"+k]=l?iso(l.FechaToma):codF;};
  v.nom1=nm[0]||"";v.nom2=nm.slice(1).join(" ")||"NONE";v.ape1=ap[0]||"";v.ape2=ap.slice(1).join(" ")||"NOAP";v.tdoc=p.TipoDoc==="PPT"?"PT":(p.TipoDoc||"");v.doc=p.Documento||"";v.fnac=isoOr(p.FechaNac,"");v.sexo=p.Sexo==="Femenino"?"F":p.Sexo==="Masculino"?"M":"";
  const age=ageAt(p,c);v.edad=p.FechaNac?Math.floor(dayDiff(p.FechaNac,c)/365.25):"";v.curso=age==null?"":age>=60?"Vejez":age>=29?"Adultez":age>=18?"Juventud":"Adolescencia";
  v.reg=need("reg",p.Regimen,"Régimen (var 9)");v.codeps=need("codeps",C.epsCod[p.EPS],"Código EPS (var 10)");v.etnia=need("etnia",p.Etnia,"Pertenencia étnica (var 11)");v.grupo=need("grupo",p.GrupoPob,"Grupo poblacional (var 12)");
  v.mun=need("mun",p.MunicipioDANE||MUN_DANE[norm(p.Municipio)],"Municipio DANE (var 13)");v.tel=p.Telefono||"0";v.fafil=need("fafil",p.FechaAfiliacion?iso(p.FechaAfiliacion):"","Fecha de afiliación (var 15)");v.ips=C.ips.codigo;v.fprog=isoOr(p.IngresoPrograma||p.IngresoUnidad,D1800);
  v.disc=p.Discapacidad||"";v.region="";v.depto=C.ips.depto||"";v.zona=p.Zona||"";v.dir=p.Direccion||"";v.barrio=p.Barrio||"";
  v.hta=p.HTA==="SI"?1:p.HTA==="NO"?2:need("hta","","HTA (var 18)");v.fhta=p.HTA==="SI"?isoOr(p.FechaDxHTA,D1800):D1845;v.costoHTA="";v.costoDM="";
  v.dm=dm?need("dm",p.DMTipo,"Tipo de DM (var 20)"):p.DM==="NO"?2:need("dm","","Diabetes (var 20)");v.fdm=dm?isoOr(p.FechaDxDM,D1800):D1845;v.etio=need("etio",p.Etiologia,"Etiología (var 22)");
  v.peso=lastS?num(lastS.PesoPost):(num(p.PesoSeco)??"");v.fpeso=lastS?iso(lastS.Fecha):D1800;v.talla=need("talla",num(p.Talla),"Talla (var 24)");v.ftalla=D1800;
  const tm=num(p.Talla)?num(p.Talla)/100:null;v.imc=tm&&v.peso?Math.round(v.peso/(tm*tm)*10)/10:"";v.imcclas=v.imc===""?"":v.imc<18.5?"Delgadez":v.imc<25?"Normal":v.imc<30?"Sobrepeso":"Obesidad";v.cintura="";
  v.dislip=p.Dislipidemia==="SI"?1:p.Dislipidemia==="NO"?2:"";v.fdislip=p.Dislipidemia==="SI"?D1800:D1845;
  v.tas=lastTA?num(lastTA.TASPre):999;v.tad=lastTA&&num(lastTA.TADPre)!=null?num(lastTA.TADPre):999;
  v.creat=98;v.fcreat=D1845;if(dm){lv("HbA1c",99,D1800);v.a1c=v.HbA1c;v.fa1c=v.fHbA1c;}else{v.a1c=98;v.fa1c=D1845;}
  v.albu=9888;v.falbu=D1845;v.rac=9888;v.frac=D1845;lv("ColT",999,D1845);lv("HDL",999,D1845);lv("LDL",999,D1845);lv("TG",999,D1800);lv("PTH",9999,D1800);
  const val=[...p._val].reverse().find(x=>x.Fecha<=c);const diu=val?num(val.Diuresis):null;v.tfg=diu==null?999:diu<250?988:777;v.ftfg=val&&diu!=null?iso(val.Fecha):D1845;
  lv("Na",999,D1845);lv("K",999,D1845);lv("AcUrico",999,D1845);const po=L("PO");v.po=po?po.Valor:999;v.fpo=po?iso(po.FechaToma):D1845;const ekg=L("EKG");v.ekg=ekg?(ekg.Valor==="Normal"?1:2):3;v.fekg=ekg?iso(ekg.FechaToma):D1845;
  const A=d=>{const a=p._ate.filter(x=>x.Disciplina===d&&x.Fecha<=c&&x.Fecha>=per).pop();return a?iso(a.Fecha):D1800;};
  v.fmg=A("Medicina general o experto");v.fnefro=A("Nefrología");v.fendo=A("Endocrinología");v.fmi=A("Medicina interna");v.fpsi=A("Psicología");v.fnut=A("Nutrición");v.fts=A("Trabajo social");v.fqf=A("Química farmacéutica");v.foftal=A("Oftalmología");v.fenf=A("Enfermería");v.fprogval=v.fnefro;v.especialidad="NEFROLOGIA";
  const meds=p._med.filter(m=>m.Inicio<=c&&(!m.Fin||m.Fin>=per)).map(m=>norm(m.Medicamento));v.ieca=meds.some(m=>/ENALAPRIL|CAPTOPRIL|LISINOPRIL|RAMIPRIL/.test(m))?1:2;v.ara=meds.some(m=>/LOSARTAN|VALSARTAN|IRBESARTAN|TELMISARTAN|CANDESARTAN/.test(m))?1:2;
  v.v38=1;v.v39=5;v.v40=isoOr(p.FechaDxERC5,D1800);v.fdxerc14=D1845;v.trat="HEMODIALISIS";v.ipsHab=C.ips.codigo;v.ipsNom=C.ips.nombre;v.v41=98;v.v42=p.TFGInicio!=null&&p.TFGInicio!==""?p.TFGInicio:99;
  v.v43=p.ModoInicio||({"Urgencia":1,"Prediálisis de la IPS":2,"Traslado de otra unidad":3})[p.Procedencia]||99;v.v44=isoOr(p.InicioTRR,D1800);v.v45=isoOr(p.IngresoUnidad,D1800);
  v.v46=aband?98:({"FAV":1,"CVC tunelizado":4,"CVC temporal":5,"Injerto":6})[acc]||need("v46","","Acceso al corte (var 46)");
  const kt=lastLab(p,"KtV",tri,c);v.v47=aband?98:kt?Math.floor(num(kt.Valor)*100)/100:need("v47","","Kt/V del último trimestre (var 47)");
  const fin=ST.fin.data;let costo="";if(fin){let t=0;for(let d=monthStart(ps);d<=c;d=addMonths(d,1)){const r=conciliar(ym(d)).rows.find(x=>x.p===p);if(r&&r.esp)t+=r.esp;}costo=Math.round(t);}v.v48=aband?98:costo;if(!fin)miss.push("Costos (var 48 y 77): desbloquee la conciliación en Producción asistencial o los diligencia la EPS");
  v.v49=98;v.v50=98;const S3=sesIn(p,addDays(tri,1),c,"Realizada").filter(s=>num(s.DuracionMin)!=null);v.v51=aband?98:S3.length?Math.floor(S3.reduce((a,s)=>a+num(s.DuracionMin),0)/S3.length/60*100)/100:need("v51","","Horas promedio por sesión (var 51)");v.v52=98;v.tperit=98;v.v53=98;
  const hbs=(p._lab.HBsAg||[]).find(l=>/^react/i.test(l.Valor));const ah=lastLab(p,"AntiHBs",null,c);const ahv=ah?num(ah.Valor):null;
  v.v54=aband?99:hbs?7:ahv!=null&&ahv>=10?4:p.VHBNoRespondedor==="SI"?6:ahv!=null?5:p.VacunaVHB==="Esquema completo"?1:p.VacunaVHB==="Esquema incompleto"?2:p.VacunaVHB==="No vacunado"?3:99;
  v.v55=hbs?iso(hbs.FechaToma):D1811;const hc=(p._lab.CVVHC||[]).find(l=>/^detect/i.test(l.Valor));v.v56=hc?iso(hc.FechaToma):D1811;v.v57=2;v.v58=98;
  lv("Hb",99,D1800,tri);lv("Alb",99,D1800,tri);lv("P",99,D1800,tri);v.v59=v.Hb;v.v60=v.Alb;v.v61=v.P;v.fhb=v.fHb;v.falb=v.fAlb;v.fp=v.fP;
  const tx=p.TxEstado||"Sin evaluar";const contra=new Set(String(p.TxContra||"").split(",").filter(Boolean));if(tx==="Disentimiento")contra.add("3");
  v.v62=aband?98:["Idóneo, en estudio","En lista de espera"].includes(tx)?1:["No idóneo (contraindicación con soporte)","Disentimiento","Cuidados paliativos"].includes(tx)?2:99;
  if(v.v62===2&&!contra.size)miss.push("Contraindicación de trasplante sin especificar (var 62.1-62.11)");
  for(let i=1;i<=11;i++)v["c"+i]=v.v62===2?(contra.has(String(i))?1:2):v.v62===1?2:v.v62;
  v.v63=tx==="En lista de espera"?(p.TxFecha?iso(p.TxFecha):need("v63","","Fecha de ingreso a lista (var 63)")):tx==="Idóneo, en estudio"?D1800:D1845;v.v63_1=tx==="En lista de espera"?(p.TxIPS||need("v63_1","","IPS de lista de espera (var 63.1)")):tx==="Idóneo, en estudio"?99:98;
  const hadTx=p._mov.some(m=>m.Tipo==="Trasplante");v.v64=hadTx?3:5;if(hadTx)miss.push("Antecedente de trasplante: revise variables 64 a 75");
  ["v65","v66","v67","v68","v69","v70","v71","v74","v75"].forEach(k=>v[k]=98);for(let i=1;i<=7;i++)v["v69_"+i]=D1845;for(let i=1;i<=9;i++)v["v70_"+i]=98;v.v72=D1845;v.v73=D1845;
  const months=new Set(p._ses.filter(s=>s.Estado==="Realizada"&&s.Fecha>=ps&&s.Fecha<=c).map(s=>ym(s.Fecha)));v.v76=months.size;v.v77=aband?98:costo;v.v78=98;
  v.v79=p.NovedadCAC||(fall?1:aband?7:98);v.v80=fall?(p.CausaMuerte||99):98;const fm=p._mov.find(m=>m.Tipo==="Fallecimiento");v.v80_1=fall?isoOr(fm?fm.Fecha:p.FechaEstado,D1800):D1845;v.v81=need("v81",p.BDUA,"Código BDUA (var 81)");v.v82=iso(c);
  const nx=val?(()=>{try{return JSON.parse(val.Datos).f.proxCtrl;}catch(e){return"";}})():"";v.fprox=nx||D1800;const ho=p._nov.filter(n=>n.Tipo==="Hospitalización"&&n.Inicio>=per&&n.Inicio<=c).pop();v.fhosp=ho?iso(ho.Inicio):D1845;v.hospev=ho?(ho.Evitable==="Sí"?"SI":ho.Evitable==="No"?"NO":""):98;v.seguim="";v.mesrep=ym(c);
  v.cintura="";v._miss=miss;return v;}
/* portal.js:1341 */
function ufCalc(pre,post,min){if(pre==null||post==null)return null;const kg=pre-post;const ml=kg*1000;return{kg,ml,ufr:min&&post?ml/post/(min/60):null};}
/* portal.js:1342 */
function sesUF(s){const u=ufCalc(num(s.PesoPre),num(s.PesoPost),num(s.DuracionMin));if(!u)return null;return{kg:num(s.UFNeta)!=null?num(s.UFNeta):u.kg,ufr:num(s.UFR)!=null?num(s.UFR):u.ufr,maq:num(s.UFMaquina)};}
/* portal.js:1348 */
const EST_TIPOS=["Imagen diagnóstica","Procedimiento","Examen especializado","Concepto de especialista"];
/* portal.js:1349 */
const EST_NOM=["Ecocardiograma","Electrocardiograma","Holter de 24 horas","Prueba de esfuerzo o perfusión miocárdica","Radiografía de tórax","Ecografía renal y de vías urinarias","Ecografía abdominal","Doppler de miembros superiores (mapeo vascular)","Doppler de la FAV","Fistulografía","Endoscopia digestiva alta","Colonoscopia","Densitometría ósea","Fondo de ojo","Mamografía","Citología cervicovaginal","Tomografía","Resonancia magnética","Biopsia","Valoración por cardiología","Valoración por cirugía vascular"];
/* portal.js:1350 */
function estRelevantes(p){return(p._est||[]).filter(e=>e.Relevante==="Sí").slice().reverse();}
/* portal.js:1351 */
function estVencidos(p,c){return(p._est||[]).filter(e=>e.ProximoControl&&e.ProximoControl<=c&&!(p._est||[]).some(x=>x!==e&&x.Nombre===e.Nombre&&x.Fecha>e.Fecha));}
/* portal.js:1358 */
function vacEsquemas(){const E=(ST.book&&ST.book.cfgv.vacEsq)||CFG_DEF.vacEsq;return E.filter(e=>e&&e.n&&Array.isArray(e.m)&&e.m.length);}
/* portal.js:1359 */
function vacMeses(nom){const e=vacEsquemas().find(x=>x.n===nom);return e?e.m:(vacEsquemas()[0]||{m:[0,1,2,6]}).m;}
/* portal.js:1360 */
function vacDoses(p,c){return(p._vac||[]).filter(v=>(v.Vacuna||"VHB")==="VHB"&&v.Fecha&&(!c||v.Fecha<=c)).slice().sort((a,b)=>a.Fecha-b.Fecha||String(a.ID).localeCompare(b.ID));}
/* portal.js:1361 */
function labTxt(l){return l?(EX[l.Examen]&&EX[l.Examen].txt?l.Valor:f1(num(l.Valor),0))+" · "+fd(l.FechaToma):"sin dato";}
/* portal.js:1362 */
function vacStatus(p,c){c=c||ST.corte;const D=vacDoses(p,c);const hb=lastLab(p,"HBsAg",null,c),ab=lastLab(p,"AntiHBc",null,c),as=lastLab(p,"AntiHBs",null,c);const asv=as?num(as.Valor):null;
  const o={D,hb,ab,as,next:null,lvl:"base",code:"",txt:"",accion:false};const R=(code,lvl,txt,extra)=>Object.assign(o,{code,lvl,txt,accion:["esq_venc","post_pend","nr1","resp_anual","resp_ref","susc","abc_ais","anti_sin_dosis","ficha"].includes(code)},extra||{});
  if(hb&&/^react/i.test(hb.Valor))return R("hbs","bad","HBsAg reactivo ("+fd(hb.FechaToma)+"): no vacunar; máquina, sala y personal dedicados (CDC 2001; GSH-PT-001).");
  const ser={};D.forEach(d=>{const k=d.Serie||"1";(ser[k]=ser[k]||[]).push(d);});const nums=Object.keys(ser).filter(k=>/^\d+$/.test(k)).map(Number).sort((a,b)=>a-b);
  o.series=nums.map(n=>{const L=ser[String(n)];const m=vacMeses(L[0].Esquema);return{n,L,m,k:L.length,comp:L.length>=m.length};});
  const ref=ser["Refuerzo"]||[];o.refuerzos=ref;
  if(!nums.length){
    if(ab&&/^react/i.test(ab.Valor)&&asv!=null&&asv>=10)return R("inm_inf","ok","Inmune por infección pasada (anti-HBc reactivo y anti-HBs "+f1(asv,0)+"): no requiere vacuna (CDC 2001).");
    if(ab&&/^react/i.test(ab.Valor))return R("abc_ais","warn","Anti-HBc reactivo con anti-HBs < 10 o sin dato: conducta según nefrología e infectología (protocolo GSH-PT-001).");
    if(asv!=null&&asv>=10)return R("anti_sin_dosis","warn","Anti-HBs "+f1(asv,0)+" sin dosis registradas: registre las dosis previas del carné o confirme el anti-HBc.");
    if(p.VacunaVHB&&p.VacunaVHB!=="No vacunado")return R("ficha","warn","Según la ficha: «"+p.VacunaVHB+"», sin dosis registradas en la herramienta. Registre las dosis del carné.");
    return R("susc","bad","Susceptible sin vacunar (anti-HBs "+(asv==null?"sin dato":f1(asv,0))+"): iniciar esquema de alta dosis.",{next:c});}
  const cur=o.series[o.series.length-1];const first=cur.L[0].Fecha,lastD=cur.L[cur.L.length-1].Fecha;o.cur=cur;
  if(!cur.comp){const k=cur.k;const anchor=addMonths(first,cur.m[k]);const minI=addMonths(lastD,cur.m[k]-cur.m[k-1]);const nx=anchor>minI?anchor:minI;
    return R(nx<=c?"esq_venc":"esq",nx<=c?"bad":"warn","Serie "+cur.n+": dosis "+k+" de "+cur.m.length+". Próxima dosis "+(nx<=c?"vencida desde ":"el ")+fd(nx)+".",{next:nx});}
  const post=(p._lab.AntiHBs||[]).filter(l=>l.FechaToma>addDays(lastD,27)&&l.FechaToma<=c);const desde=addDays(lastD,30),hasta=addMonths(lastD,2);
  if(!post.length){if(c<desde)return R("post_esp","info","Serie "+cur.n+" completa ("+fd(lastD)+"). Anti-HBs de control entre "+fd(desde)+" y "+fd(hasta)+" (1-2 meses después de la última dosis).",{next:desde});
    return R("post_pend","warn","Serie "+cur.n+" completa ("+fd(lastD)+") sin anti-HBs de control: tomarlo ya (debía entre "+fd(desde)+" y "+fd(hasta)+").",{next:desde});}
  const pv=num(post[0].Valor);
  if(pv==null||pv<10){if(cur.n<2)return R("nr1","bad","Sin respuesta a la serie "+cur.n+" (anti-HBs "+(pv==null?"?":f1(pv,0))+" el "+fd(post[0].FechaToma)+"): revacunar con una serie completa (CDC 2001; ACIP 2018).",{next:c});
    return R("nr2","info","No respondedor después de "+cur.n+" series: no más vacunas; HBsAg mensual (CDC 2001).");}
  const lastA=(p._lab.AntiHBs||[]).filter(l=>l.FechaToma<=c).slice(-1)[0];const la=num(lastA.Valor);const refAfter=ref.filter(r=>r.Fecha>=lastA.FechaToma);
  if(la!=null&&la<10&&!refAfter.length)return R("resp_ref","warn","Respondedor con anti-HBs "+f1(la,0)+" el "+fd(lastA.FechaToma)+": aplicar dosis de refuerzo (CDC 2001).",{next:c});
  const nxt=addMonths(lastA.FechaToma,12);if(nxt<=c)return R("resp_anual","warn","Respondedor (anti-HBs "+f1(pv,0)+" posvacunación). Anti-HBs anual vencido desde "+fd(nxt)+".",{next:nxt});
  return R("resp","ok","Respondedor (anti-HBs "+f1(pv,0)+" el "+fd(post[0].FechaToma)+"). Próximo anti-HBs anual: "+fd(nxt)+(refAfter.length?" · refuerzo "+fd(refAfter[refAfter.length-1].Fecha):"")+".",{next:nxt});}
/* portal.js:1387 */
const VAC_GRUPOS=[["accion","Requieren acción"],["esq","En esquema"],["prot","Protegidos"],["hbs","HBsAg reactivo"],["nr","No respondedores"],["all","Todos"]];
/* portal.js:1388 */
function vacGrupo(s){return s.accion?"accion":s.code==="esq"||s.code==="post_esp"?"esq":["resp","inm_inf"].includes(s.code)?"prot":s.code==="hbs"?"hbs":s.code==="nr2"?"nr":"otro";}
/* portal.js:1389 */
function vacNextDefaults(p){const D=vacDoses(p,null);const s=vacStatus(p,TODAY());let serie="1";if(s.code==="nr1")serie=String((s.cur?s.cur.n:1)+1);else if(s.code==="resp_ref")serie="Refuerzo";else if(s.cur&&!s.cur.comp)serie=String(s.cur.n);
  const esq=serie==="Refuerzo"?"":(s.cur&&String(s.cur.n)===serie?s.cur.L[0].Esquema:(vacEsquemas()[0]||{}).n);const n=serie==="Refuerzo"?1:D.filter(d=>(d.Serie||"1")===serie).length+1;return{serie,esq,n};}
/* portal.js:1409 */
function vacEtiqueta(c){return({hbs:"HBsAg +",inm_inf:"Inmune",resp:"Respondedor",resp_anual:"Anti-HBs anual",resp_ref:"Refuerzo",esq:"En esquema",esq_venc:"Dosis vencida",post_esp:"Esperar control",post_pend:"Control pendiente",nr1:"Revacunar",nr2:"No respondedor",abc_ais:"Anti-HBc aislado",anti_sin_dosis:"Sin dosis",ficha:"Sin dosis",susc:"Susceptible"})[c]||c;}
/* portal.js:1415 */
const TX_EST=["Pendiente","Solicitado","Realizado","No aplica"];
/* portal.js:1416 */
function txItems(){return((ST.book&&ST.book.cfgv.txItems)||CFG_DEF.txItems).filter(Boolean);}
/* portal.js:1417 */
function txState(p){const last={};(p._txs||[]).forEach(r=>{last[r.Item]=r;});const items=txItems().map(it=>({it,r:last[it]||null,e:last[it]?last[it].Estado:"Pendiente"}));
  const hecho=items.filter(x=>x.e==="Realizado").length,na=items.filter(x=>x.e==="No aplica").length,sol=items.filter(x=>x.e==="Solicitado").length;const falta=items.filter(x=>x.e!=="Realizado"&&x.e!=="No aplica");
  const ult=(p._txs||[]).slice(-1)[0]||null;return{items,hecho,na,sol,apl:items.length-na,falta,ult};}
/* portal.js:1420 */
const TX_EN_PROCESO=["Idóneo, en estudio","En lista de espera"];
/* portal.js:1448 */
function tenerPresente(p,c){c=c||ST.corte;const o=[];estRelevantes(p).forEach(e=>o.push({lvl:"info",t:e.Nombre+" ("+fd(e.Fecha)+")",d:e.Resultado+(e.Seguimiento?" · Seguimiento: "+e.Seguimiento:"")+(e.ProximoControl?" · Próximo control "+fd(e.ProximoControl):""),id:e.ID,venc:e.ProximoControl&&e.ProximoControl<=c}));
  const v=vacStatus(p,c);if(v.lvl!=="ok"&&v.code!=="nr2")o.push({lvl:v.lvl==="bad"?"bad":"warn",t:"Vacunación VHB",d:v.txt});else if(v.code==="nr2")o.push({lvl:"info",t:"Vacunación VHB",d:v.txt});
  if(TX_EN_PROCESO.includes(p.TxEstado)){const t=txState(p);if(t.falta.length)o.push({lvl:"info",t:"Trasplante · "+p.TxEstado,d:"Faltan "+t.falta.length+": "+t.falta.slice(0,4).map(x=>x.it.split(" · ").pop()).join("; ")+(t.falta.length>4?"…":"")});}
  return o;}
/* portal.js:1455 */
const SOL_EST=["Pendiente","Muestra tomada","No tomada"];
/* portal.js:1457 */
function solRecs(mes,prog){prog=prog||"hd";return ST.book.sol.filter(live).filter(r=>r.Mes===mes&&(r.Programa||"hd")===prog);}
/* portal.js:1458 */
function solPropuesta(mes){ensureIdx();const[y,mm]=mes.split("-").map(Number);const ms=new Date(y,mm-1,1);const ref=ST.corte>ms?ST.corte:ms;
  return ST.book.pac.filter(p=>activeAt(p,ST.corte)||activeAt(p,ms)).sort((a,b)=>String(a.ID).localeCompare(b.ID)).map(p=>{const ex=examsForMonth(p,y,mm).map(e=>({k:e.k,why:e.why}));labDue(p,ST.corte).filter(v=>v.st==="vencido"&&!ex.some(e=>e.k===v.k)).forEach(v=>ex.push({k:v.k,why:"Vencido"}));const NO_LAB=["EscalaCV","EKG","TAS","KtV","URR"];return{p,ex:ex.filter(e=>!NO_LAB.includes(e.k))};}).filter(x=>x.ex.length);}
/* portal.js:1692 */
SH.dsp=["Dispositivos",["ID","Paciente","Tipo","Sitio","FechaInsercion","LugarInsercion","FechaRetiro","MotivoRetiro","Estado","Reemplaza","Novedad","Origen","Validado","ValidadoPor","ValidadoFecha","Nota","Usuario","Registrado","Anulado","MotivoAnulacion"]];
/* portal.js:1693 */
SH.lim=["Limpieza",["ID","Proceso","Fecha","Turno","Maquina","Area","FechaProgramada","Ejecuto","Cargo","Actividades","Producto","Concentracion","TiempoContacto","Parametros","Observacion","Evidencia","SupResultado","SupItems","SupPor","SupFecha","SupObs","Usuario","Registrado","Anulado","MotivoAnulacion"]];
/* portal.js:1694 */
BOOK_KEYS.splice(BOOK_KEYS.indexOf("cor"),0,"dsp","lim");
/* portal.js:1695 */
SH.ses[1].splice(SH.ses[1].indexOf("Usuario"),0,"LimpiezaPuesto");
/* portal.js:1696 */
SH.atb[1].splice(SH.atb[1].indexOf("Nota"),0,"DuracionPrevista","Prescriptor");
/* portal.js:1697 */
["FechaInsercion","FechaRetiro","FechaProgramada","SupFecha","ValidadoFecha"].forEach(f=>DATE_F.add(f));
/* portal.js:1698 */
NUM_F.add("DuracionPrevista");
/* portal.js:1699 */
CFG_DEF.maquinas=null;
/* portal.js:1700 */
CFG_DEF.limTer={inicio:"",cada:15,tol:0,validado:"NO",por:"",fecha:""};
/* portal.js:1701 */
CFG_DEF.cdMet={retiro:"incluye",hosp:"cuenta",ver:"CD-2026.10-v1",por:"",fecha:""};
/* portal.js:4680 */
const lv=o=>!!o&&o.Anulado!=="SI";
/* portal.js:4681 */
const hdOn=()=>typeof ST!=="undefined"&&!!ST.book;
/* portal.js:4698 */
const DSP_TIPOS=["CVC tunelizado","CVC temporal","FAV","Injerto"];
/* portal.js:4699 */
const DSP_SITIOS=["Yugular interna derecha","Yugular interna izquierda","Subclavia derecha","Subclavia izquierda","Femoral derecha","Femoral izquierda","Antebrazo izquierdo","Antebrazo derecho","Brazo izquierdo","Brazo derecho","Otro"];
/* portal.js:4700 */
const DSP_RETIRO=["Cambio de acceso","Disfunción","Infección","Trombosis","Fin de uso (FAV o injerto funcional)","Salida accidental","Egreso de la unidad","Otro"];
/* portal.js:4701 */
const DSP_LUGAR=["UNO-P (sala de procedimientos)","Otra institución","Desconocido"];
/* portal.js:4702 */
function dspAll(){return hdOn()&&ST.book.dsp?ST.book.dsp.filter(lv):[];}
/* portal.js:4703 */
function dspOf(pid){return dspAll().filter(d=>d.Paciente===pid).sort((a,b)=>(a.FechaInsercion||0)-(b.FechaInsercion||0));}
/* portal.js:4704 */
function dspCVC(pid){return dspOf(pid).filter(d=>isCVC(d.Tipo));}
/* portal.js:4705 */
function dspFind(id){return id?dspAll().find(d=>d.ID===id):null;}
/* portal.js:4706 */
const dspOpen=d=>!d.FechaRetiro&&d.Estado!=="Retirado";
/* portal.js:4707 */
function cdMet(){return Object.assign({},CFG_DEF.cdMet,(ST.book&&ST.book.cfgv.cdMet)||{});}
/* portal.js:4708 */
function dspCovers(d,day,met){if(!d.FechaInsercion||d.FechaInsercion>day)return false;if(!d.FechaRetiro)return d.Estado!=="Retirado";return met&&met.retiro==="excluye"?day<d.FechaRetiro:day<=d.FechaRetiro;}
/* portal.js:4709 */
function hospOn(p,d){return p._nov.some(n=>n.Tipo==="Hospitalización"&&n.Inicio<=d&&(!n.Fin||d<=n.Fin));}
/* portal.js:4713 */
function cdCalc(a,b,eps,onlyPid){
  const met=cdMet();const R={days:0,per:[],block:[],warn:[],pend:[],recs:[],met,a,b,complete:true};
  if(!hdOn())return R;ensureIdx();
  pacs().filter(p=>(!onlyPid||p.ID===onlyPid)&&(!eps||p.EPS===eps)&&overlaps(p,a,b)).forEach(p=>{
    const D=dspCVC(p.ID);let n=0,dup=0;const used=new Set();
    D.forEach(d=>{const inP=(!d.FechaInsercion||d.FechaInsercion<=b)&&(!d.FechaRetiro||d.FechaRetiro>=a);if(!inP)return;
      if(!d.FechaInsercion)R.block.push({p,d,t:"Catéter "+d.ID+" ("+d.Tipo+") sin fecha de inserción",fix:"Registrar la fecha de inserción (o la primera fecha documentada) en el registro de dispositivos"});
      else if(d.Estado==="Retirado"&&!d.FechaRetiro)R.block.push({p,d,t:"Catéter "+d.ID+" marcado como retirado sin fecha de retiro",fix:"Registrar la fecha de retiro"});
      else if(d.FechaRetiro&&d.FechaRetiro<d.FechaInsercion)R.block.push({p,d,t:"Catéter "+d.ID+" con retiro anterior a la inserción",fix:"Corregir las fechas"});
      if(d.Validado!=="SI")R.pend.push({p,d});});
    const valid=D.filter(d=>d.FechaInsercion&&!(d.Estado==="Retirado"&&!d.FechaRetiro)&&!(d.FechaRetiro&&d.FechaRetiro<d.FechaInsercion));
    for(let d=new Date(a);d<=b;d=addDays(d,1)){if(!activeAt(p,d))continue;if(met.hosp==="excluye"&&hospOn(p,d))continue;const c=valid.filter(x=>dspCovers(x,d,met));if(c.length){n++;c.forEach(x=>used.add(x.ID));const real=c.filter(x=>!(x.FechaRetiro&&iso(x.FechaRetiro)===iso(d)&&c.some(y=>y!==x&&y.FechaInsercion&&iso(y.FechaInsercion)===iso(d))));if(real.length>1)dup++;}}
    if(dup)R.warn.push({p,t:dup+(dup===1?" día":" días")+" con dos catéteres activos a la vez (se cuentan una vez); revise si falta registrar un retiro"});
    const S=p._ses.filter(s=>s.Estado==="Realizada"&&s.Fecha>=a&&s.Fecha<=b&&isCVC(s.Acceso));
    const sinD=S.filter(s=>!D.some(x=>x.FechaInsercion&&dspCovers(x,s.Fecha,{retiro:"incluye"})));
    if(sinD.length)R.block.push({p,t:sinD.length+" sesiones con catéter sin un dispositivo registrado que las cubra (primera: "+fd(sinD[0].Fecha)+")",fix:"Registrar el catéter con su fecha de inserción, o corregir el acceso de la sesión en el Turno",ses:sinD.map(s=>s.ID)});
    const favS=p._ses.filter(s=>s.Estado==="Realizada"&&s.Fecha>=a&&s.Fecha<=b&&s.Acceso&&!isCVC(s.Acceso));
    const cvcOnFav=favS.filter(s=>valid.some(x=>dspCovers(x,s.Fecha,met)));
    if(cvcOnFav.length)R.warn.push({p,t:cvcOnFav.length+" sesiones por FAV/injerto mientras figura un catéter activo: confirme si el catéter sigue in situ (se cuentan sus días)"});
    if(n||D.length||S.length)R.per.push({p,days:n,devs:[...used],ses:S.length});R.days+=n;used.forEach(id=>R.recs.push(id));});
  R.complete=!R.block.length;return R;}
/* portal.js:4735 */
function dspPropuestas(){if(!hdOn())return[];ensureIdx();const out=[];
  pacs().forEach(p=>{if(dspOf(p.ID).length)return;const pts=[];const st=p.IngresoUnidad||p.InicioTRR;
    if(st&&p.AccesoInicial)pts.push({d:st,a:p.AccesoInicial,w:"acceso al ingreso"});
    p._ses.filter(s=>s.Estado==="Realizada"&&s.Acceso).forEach(s=>pts.push({d:s.Fecha,a:s.Acceso,w:"sesión"}));
    if(p.AccesoActual&&p.AccesoDesde)pts.push({d:p.AccesoDesde,a:p.AccesoActual,w:"acceso actual desde"});
    p._acn.forEach(n=>{if(n.AccesoResultante)pts.push({d:n.Fecha,a:n.AccesoResultante,w:"novedad "+n.Tipo});if(n.Tipo==="Recambio de catéter")pts.push({d:n.Fecha,a:"__REC__",w:"recambio"});});
    pts.sort((x,y)=>x.d-y.d);const seg=[];
    pts.forEach(x=>{const cur=seg[seg.length-1];if(x.a==="__REC__"){if(cur&&isCVC(cur.a)){cur.fin=x.d;cur.finW="recambio "+fd(x.d);seg.push({a:cur.a,ini:x.d,iniW:"recambio "+fd(x.d),fin:null});}return;}
      if(!cur||cur.a!==x.a){if(cur&&!cur.fin){cur.fin=x.d;cur.finW="primera evidencia de "+x.a+" ("+x.w+") "+fd(x.d);}seg.push({a:x.a,ini:x.d,iniW:x.w+" "+fd(x.d),fin:null});}});
    seg.forEach(s=>{if(!DSP_TIPOS.includes(s.a))return;out.push({Paciente:p.ID,Tipo:s.a,FechaInsercion:s.ini,FechaRetiro:s.fin,Estado:s.fin?"Retirado":"Activo",MotivoRetiro:s.fin?"Cambio de acceso":"",Origen:"Propuesto desde el historial",Validado:"NO",Nota:"Inserción aproximada: "+s.iniW+(s.fin?" · retiro aproximado: "+s.finW:"")+". Confirmar contra la historia clínica."});});});
  return out;}
/* portal.js:4748 */
const MIC_MUESTRAS=["Hemocultivo periférico","Hemocultivo de catéter","Líquido peritoneal (efluente)","Secreción del orificio de salida","Punta de catéter","Urocultivo","Otra"];
/* portal.js:4749 */
const MIC_SANGRE=["Hemocultivo periférico","Hemocultivo de catéter"];
/* portal.js:4750 */
const MIC_EST=["Solicitado","Tomado","En proceso","Preliminar","Final","No procesado","Rechazado"];
/* portal.js:4751 */
const MIC_RES=["Pendiente","Positivo","Negativo","Contaminado"];
/* portal.js:4752 */
const MIC_FEN=["Ninguno detectado","SAMR","BLEE","Carbapenemasa","Otro multirresistente","Sin antibiograma"];
/* portal.js:4753 */
const MIC_FEN_ALERTA=["SAMR","BLEE","Carbapenemasa","Otro multirresistente"];
/* portal.js:4756 */
function micAll(){return typeof PX!=="undefined"&&PX.book&&PX.book.mic?PX.book.mic.filter(lv):[];}
/* portal.js:4757 */
function micOfEp(ref){return micAll().filter(m=>m.Episodio===ref);}
/* portal.js:4758 */
function micOfPac(prog,pid){return micAll().filter(m=>m.Programa===prog&&m.Paciente===pid);}
/* portal.js:4759 */
const micPos=m=>m.Resultado==="Positivo"&&["Preliminar","Final"].includes(m.Estado);
/* portal.js:4760 */
function micAB(m){try{const a=JSON.parse(m.Antibiograma||"[]");return Array.isArray(a)?a:[];}catch(e){return[];}}
/* portal.js:4762 */
function itsConf(e){const M=micOfEp("HD:"+e.ID).filter(m=>MIC_SANGRE.includes(m.Muestra));const pos=M.filter(micPos);
  if(pos.length)return{st:"Confirmada",src:"lab",m:M,org:[...new Set(pos.map(m=>m.Microorganismo).filter(Boolean))].join(", ")};
  const fin=M.filter(m=>["Final","No procesado","Rechazado"].includes(m.Estado));
  if(M.length&&fin.length===M.length){const proc=M.filter(m=>m.Estado==="Final");return{st:proc.length?"No confirmada":"Muestra no procesada",src:"lab",m:M};}
  if(M.length)return{st:"Cultivo en proceso",src:"lab",m:M};
  if(e.Hemocultivo==="Positivo")return{st:"Confirmada",src:"heredado",m:[],org:e.Microorganismo||""};
  if(e.Hemocultivo==="Negativo")return{st:"No confirmada",src:"heredado",m:[]};
  if(e.Hemocultivo==="No tomado")return{st:"Sin cultivo",src:"hd",m:[]};
  return{st:"Cultivo sin registro en laboratorio",src:"hd",m:[]};}
/* portal.js:4836 */
function v6Its(x,soloConf){const C=cdCalc(x.ps,x.c,x.eps);let ev=0,sus=0;const list=[];
  popPer(x.ps,x.c,x.eps).forEach(p=>p._evt.filter(e=>e.Tipo===ITS&&e.Fecha>=x.ps&&e.Fecha<=x.c).forEach(e=>{const k=itsConf(e);
    if(k.st==="Confirmada"){ev++;list.push(pv(p,fd(e.Fecha)+" · confirmada"+(k.src==="heredado"?" (dato heredado del evento, sin cultivo en Laboratorio)":" por Laboratorio")+(k.org?" · "+k.org:"")));}
    else{if(!soloConf)ev++;else sus++;list.push(pv(p,fd(e.Fecha)+" · "+k.st.toLowerCase()+(soloConf?" (no cuenta)":"")));}}));
  if(!C.complete)return{ev,exp:C.days,val:null,list,nc:true,cd:C,expl:"Indicador no calculable: información de exposición a catéter incompleta ("+C.block.length+" pendiente"+(C.block.length===1?"":"s")+" en Acceso vascular → Registro de dispositivos)."};
  return{ev,exp:C.days,val:C.days?ev/C.days*1000:null,list,cd:C,expl:(C.days?ev+(soloConf?" confirmadas":" episodios")+" / "+C.days.toLocaleString("es-CO")+" días-catéter":"Sin exposición a catéter en el periodo")+(C.pend.length?" · provisional: "+C.pend.length+" catéter"+(C.pend.length===1?"":"es")+" sin validar":"")+(sus?" · "+sus+" sin confirmar":"")+" · método "+C.met.ver};}
/* portal.js:4971 */
function v6Calidad(add,c){const C=cdCalc(ST.ps,c,"");C.block.forEach(b=>add("Dispositivos",b.p,b.t+". "+(b.fix||""),"bad"));C.warn.forEach(b=>add("Dispositivos",b.p,b.t,"warn"));
  dspAll().filter(d=>d.Validado!=="SI").forEach(d=>add("Dispositivos",IDX.pac.get(d.Paciente)||{ID:d.Paciente},"Dispositivo "+d.ID+" ("+d.Tipo+") sin validar contra la historia clínica","warn"));
  ST.book.evt.filter(lv).filter(e=>e.Tipo===ITS&&e.Hemocultivo==="Positivo").forEach(e=>{const k=itsConf(e);if(k.src==="lab"&&k.st!=="Confirmada")add("Eventos",IDX.pac.get(e.Paciente)||{ID:e.Paciente},"ITS-CVC del "+fd(e.Fecha)+": el evento dice hemocultivo positivo y Laboratorio registra «"+k.st+"». Prevalece Laboratorio; revise.","bad");});}
/* portal.js:6678 */
function catDays(p,a,b){const C=cdCalc(a,b,"",p.ID);if(C.block.some(x=>x.p.ID===p.ID))return null;const r=C.per.find(x=>x.p.ID===p.ID);return r?r.days:0;}
/* ---- Núcleo HDX v3.1: se ejecuta igual que en la página. «window» es aquí un objeto propio del motor (no el navegador):
   allí dejan HDX y HX los bloques originales. ---- */
const window = {};
/* hd-hojas.js:9 */
(function () {
  "use strict";
  const AUD = ["Usuario", "Registrado", "Anulado", "MotivoAnulacion"];
  SH.sii = ["ActividadesSIIS", ["ID", "Fecha", "Paciente", "Codigo", "Actividad", "Tipo", "Categoria", "Protocolo", "Turno", "Puesto", "Severidad", "Nota", "Estado", "Origen", ...AUD]];
  SH.oxi = ["OxigenoMedicinal", ["ID", "Fecha", "Turno", "Puesto", "Paciente", "CodigoSIIS", "Indicacion", "Dispositivo", "FlujoLmin", "Minutos", "SatO2Pre", "SatO2Post", "Cilindro", "Lote", "VenceCilindro", "PsiInicial", "PsiFinal", "Litros", "M3", "Nota", ...AUD]];
  SH.cil = ["CilindrosOxigeno", ["ID", "Tipo", "CapacidadM3", "Factor", "Ubicacion", "Lote", "Vence", "Psi", "Estado", ...AUD]];
  SH.chk = ["ChequeoTurno", ["ID", "Fecha", "Turno", "Agua", "Desinfeccion", "Conductividad", "Cloro", "Observacion", ...AUD]];
  for (const k of ["sii", "oxi", "cil", "chk"]) if (!BOOK_KEYS.includes(k)) BOOK_KEYS.splice(BOOK_KEYS.indexOf("cor"), 0, k);
  const ses = SH.ses[1];
  for (const c of ["FC", "FR", "SatO2"]) if (!ses.includes(c)) ses.splice(ses.indexOf("Gluco"), 0, c);
  ["VenceCilindro", "Vence"].forEach((f) => DATE_F.add(f));
  ["FC", "FR", "SatO2", "Puesto", "FlujoLmin", "Minutos", "SatO2Pre", "SatO2Post", "PsiInicial", "PsiFinal", "Litros", "M3", "CapacidadM3", "Factor", "Psi"].forEach((f) => NUM_F.add(f));
})();
/* hdx-lectura.js:8 */
(function(root){
"use strict";
const HDX = root.HDX = root.HDX || {};
HDX.ver = "3.1";

/* ---------- utilidades puras ---------- */
const nrm = s => String(s == null ? "" : s).normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/\s+/g, " ").trim();
const p2 = n => String(n).padStart(2, "0");
const numv = v => { if(v == null || v === "") return null; if(typeof v === "number") return isFinite(v) ? v : null; const s = String(v).replace(",", ".").replace(/[^\d.\-]/g, ""); if(s === "" || s === "-" || s === ".") return null; const n = parseFloat(s); return isFinite(n) ? n : null; };
const docStr = v => v == null || v === "" ? "" : String(typeof v === "number" ? Math.round(v) : v).replace(/\.0$/, "").trim();
const txt = v => v == null ? "" : String(v).replace(/\s+/g, " ").trim();
/* Fecha → "AAAA-MM-DD" o null. No corrige: si el año no es plausible devuelve null. */
function isoOf(v){
  if(v == null || v === "") return null;
  if(v instanceof Date){ if(isNaN(v)) return null; return v.getFullYear() + "-" + p2(v.getMonth() + 1) + "-" + p2(v.getDate()); }
  if(typeof v === "number"){ if(v < 1000) return null; const d = new Date(Math.round((v - 25569) * 864e5)); return d.getUTCFullYear() + "-" + p2(d.getUTCMonth() + 1) + "-" + p2(d.getUTCDate()); }
  const s = String(v).trim();
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s);
  if(m){ if(+m[1] < 1900 || +m[1] > 2100) return null; return m[1] + "-" + p2(+m[2]) + "-" + p2(+m[3]); }
  m = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})/.exec(s);
  if(m){ let d = +m[1], mo = +m[2]; const y = +m[3]; if(mo > 12 && d <= 12){ const t = d; d = mo; mo = t; } if(mo < 1 || mo > 12 || d < 1 || d > 31 || y < 1900 || y > 2100) return null; return y + "-" + p2(mo) + "-" + p2(d); }
  return null;
}
const ymOf = isoStr => isoStr ? isoStr.slice(0, 7) : null;
const monthEndIso = ym => { const [y, m] = ym.split("-").map(Number); return ym + "-" + p2(new Date(y, m, 0).getDate()); };
const MES_TXT = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const mesTxt = ym => { if(!ym) return ""; const [y, m] = ym.split("-").map(Number); return MES_TXT[m - 1] + " de " + y; };
function lev(a, b){ if(a === b) return 0; const m = a.length, n = b.length; if(!m) return n; if(!n) return m; let prev = Array.from({length: n + 1}, (_, i) => i); for(let i = 1; i <= m; i++){ const cur = [i]; for(let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; } return prev[n]; }
const tokSim = (a, b) => a === b ? 1 : (a.length >= 5 && b.length >= 5 && lev(a, b) <= (Math.min(a.length, b.length) >= 6 ? 2 : 1)) ? 0.8 : 0;
/* Nombre abreviado o con errores de digitación → candidato único. Todas las palabras del nombre buscado deben estar en el candidato. */
function matchName(name, cands){
  const tk = nrm(name).split(" ").filter(t => t.length > 1);
  if(!tk.length) return null;
  let best = null, bestSc = 0, tie = false;
  cands.forEach(c => {
    const all = nrm(c.name).split(" ").filter(t => t.length > 1);
    let sc = 0;
    for(const t of tk){ let mx = 0; for(const a of all){ const s = tokSim(t, a); if(s > mx) mx = s; } if(!mx) { sc = -1; break; } sc += mx; }
    if(sc <= 0) return;
    sc = sc / tk.length + Math.min(tk.length, all.length) / 100;
    if(sc > bestSc + 1e-9){ best = c; bestSc = sc; tie = false; } else if(Math.abs(sc - bestSc) < 1e-9 && c.key !== best.key) tie = true;
  });
  return tie ? null : best;
}
const mapAcc = v => { const s = nrm(v); if(!s || s === "N/A") return null; if(s.startsWith("FAV")) return "FAV"; if(/TEMPORAL/.test(s)) return "CVC temporal"; if(/CATETER|CVC/.test(s)) return "CVC tunelizado"; if(/INJERTO|PTFE/.test(s)) return "Injerto"; return null; };
const mapTx = v => { const s = nrm(v); if(!s) return "Sin evaluar"; if(/LISTA/.test(s)) return "En lista de espera"; if(/ESTUDIO|PENDIENTE/.test(s)) return "Idóneo, en estudio"; if(/TRASPLANTADO/.test(s)) return "Trasplantado"; return "Sin evaluar"; };
const TURNOS = ["L-M-V Mañana","L-M-V Tarde","M-J-S Mañana","M-J-S Tarde","M-J-V Mañana","M-J-V Tarde"];
const mapTurno = v => { const s = nrm(v); return TURNOS.find(t => nrm(t) === s) || null; };
const turnoDias = t => /^L-M-V/.test(t || "") ? [1,3,5] : /^M-J-S/.test(t || "") ? [2,4,6] : /^M-J-V/.test(t || "") ? [2,4,5] : [];
const EVT_MAP = {"HIPOTENSION INTRADIALITICA":"Hipotensión intradialítica","HIPERTENSION INTRADIALITICA":"Hipertensión intradialítica","CALAMBRES MUSCULARES":"Calambres musculares","NAUSEAS / VOMITOS":"Náuseas / vómitos","CEFALEA":"Cefalea","HIPOGLUCEMIA":"Hipoglucemia","HIPERPOTASEMIA":"Hiperpotasemia","REACCION DE HIPERSENSIBILIDAD AL DIALIZADOR":"Reacción al dializador","COAGULACION DEL CIRCUITO":"Coagulación del circuito","SANGRADO DEL ACCESO VASCULAR":"Sangrado del acceso vascular","DISFUNCION DEL ACCESO (FLUJO BAJO)":"Disfunción del acceso (flujo bajo)","ARRITMIA CARDIACA":"Arritmia","DOLOR TORACICO / ANGINA":"Dolor torácico","FIEBRE / ESCALOFRIOS":"Fiebre / escalofríos","SINDROME DE DESEQUILIBRIO DIALITICO":"Síndrome de desequilibrio","EMBOLISMO AEREO":"Embolismo aéreo","PRURITO":"Prurito","SINCOPE":"Síncope"};
HDX.util = { nrm, p2, numv, docStr, txt, isoOf, ymOf, monthEndIso, mesTxt, matchName, mapAcc, mapTx, mapTurno, turnoDias, MES_TXT, TURNOS };

/* ---------- lectura de un Dashboard ---------- */
function aoa(XLSX, wb, name){ const sn = wb.SheetNames.find(n => nrm(n) === nrm(name)); return sn ? XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, raw: true, defval: null }) : null; }
function findHeader(rows, tests, maxRow){ for(let i = 0; i < Math.min(rows.length, maxRow || 30); i++){ const r = rows[i]; if(!r) continue; const cells = r.map(nrm); if(tests.every(t => cells.some(c => t.test(c)))) return i; } return -1; }
function colMap(row){ const m = {}; (row || []).forEach((c, i) => { const k = nrm(c); if(k && !(k in m)) m[k] = i; }); return m; }
const pick = (cm, ...pats) => { for(const p of pats){ for(const k in cm){ if(p.test(k)) return cm[k]; } } return -1; };

/* Devuelve lo que trae el archivo, sin interpretar. `mes` = "AAAA-MM" del mes operativo del archivo (asistencias, eventos, novedades). */
HDX.parseDashboard = function(XLSX, wb, fileName, mes){
  const out = { archivo: fileName, mes, pac: [], ret: [], lab: [], asi: [], glu: [], vac: [], evt: [], nov: [], tar: [], warn: [], cnt: {} };
  const W = s => out.warn.push(s);
  const [yy, mm] = mes.split("-").map(Number);
  /* --- 2.PACIENTES --- */
  const P = aoa(XLSX, wb, "2.PACIENTES") || [];
  const hp = findHeader(P, [/^ID$/, /^APELLIDOS$/, /DOCUMENTO/]);
  if(hp < 0) W("No se encontró el encabezado de la hoja 2.PACIENTES.");
  else {
    const cm = colMap(P[hp]);
    const c = { id: pick(cm, /^ID$/), ape: pick(cm, /^APELLIDOS$/), nom: pick(cm, /^NOMBRES$/), tdoc: pick(cm, /^T\.?DOC/), doc: pick(cm, /DOCUMENTO/), fn: pick(cm, /NACIMIENTO/), sexo: pick(cm, /^SEXO$/), eps: pick(cm, /^EPS$/), afi: pick(cm, /AFILIACION/), mod: pick(cm, /^MOD/), ini: pick(cm, /INICIO DIALISIS/), acc: pick(cm, /ACCESO VASCULAR/), tx: pick(cm, /ETAPA TRASPLANTE/), est: pick(cm, /^ESTADO$/), ing: pick(cm, /INGRESO UNIDAD/), hta: pick(cm, /^HTA$/), dm: pick(cm, /^DM$/), erc: pick(cm, /ERC ETAPA/), com: pick(cm, /OTRAS COMORBILIDADES/), obs: pick(cm, /^OBSERVACIONES$/) };
    let i = hp + 1;
    for(; i < P.length; i++){
      const r = P[i]; if(!r) continue; const a = txt(r[c.id]);
      if(/REGISTRO DE N/i.test(nrm(a))) break;
      if(!/^P\d+/i.test(a)) continue;
      const doc = docStr(r[c.doc]); if(!doc){ W("Maestro: fila " + (i + 1) + " (" + a + ") sin documento; no se puede identificar al paciente."); continue; }
      const g = k => c[k] >= 0 ? r[c[k]] : null;
      const fnRaw = g("fn"), iniRaw = g("ini"), ingRaw = g("ing");
      out.pac.push({ id: a.toUpperCase(), doc, tdoc: txt(g("tdoc")) || "", ape: txt(g("ape")), nom: txt(g("nom")), fn: isoOf(fnRaw), sexo: txt(g("sexo")), eps: nrm(g("eps")), afi: txt(g("afi")), mod: nrm(g("mod")) || "", ini: isoOf(iniRaw), ing: isoOf(ingRaw), accRaw: txt(g("acc")), txRaw: txt(g("tx")), est: txt(g("est")), hta: nrm(g("hta")), dm: nrm(g("dm")), erc: numv(g("erc")), com: txt(g("com")), obs: txt(g("obs")) });
      if(fnRaw != null && fnRaw !== "" && !isoOf(fnRaw)) W("Maestro " + a + ": fecha de nacimiento ilegible («" + fnRaw + "»).");
      if(iniRaw != null && iniRaw !== "" && !isoOf(iniRaw)) W("Maestro " + a + ": inicio de diálisis ilegible («" + iniRaw + "»).");
    }
    for(; i < P.length; i++){ const r = P[i]; if(!r) continue; const a = txt(r[0]); if(/^P\d+$/i.test(a) && r[1]) out.ret.push({ id: a.toUpperCase(), estado: txt(r[1]), paciente: txt(r[2]), motivo: txt(r[3]) }); }
  }
  const nameCands = out.pac.map(p => ({ key: p.doc, name: p.nom + " " + p.ape, doc: p.doc }));
  const byDoc = {}; out.pac.forEach(p => { byDoc[p.doc] = p; });
  /* --- 5.LABORATORIOS --- */
  const L = aoa(XLSX, wb, "5.LABORATORIOS") || [];
  const hl = findHeader(L, [/^PERIODO$/, /^ID$/, /FOSFORO/]);
  if(hl >= 0){
    const cm = colMap(L[hl]);
    const c = { per: pick(cm, /^PERIODO$/), id: pick(cm, /^ID$/), nom: pick(cm, /NOMBRE COMPLETO/), mod: pick(cm, /^MOD/), P: pick(cm, /^FOSFORO \(/), Alb: pick(cm, /^ALBUMINA \(/), Hb: pick(cm, /^HGB \(/), KtV: pick(cm, /^KTV$/), acc: pick(cm, /^ACCESO VASCULAR$/), TAS: pick(cm, /^TA SIST/), TAD: pick(cm, /^TA DIAST/), HbA1c: pick(cm, /^HBA1C \(/), Ca: pick(cm, /^CALCIO \(/), PTH: pick(cm, /^PTH \(/), KRU: pick(cm, /^KRU/), Vol: pick(cm, /^VOL\. ORINA/) };
    const rows = [];
    for(let i = hl + 1; i < L.length; i++){ const r = L[i]; if(!r || !txt(r[c.id])) continue; rows.push({ i, r, per: isoOf(r[c.per]) }); }
    /* Arrastre de fecha (+1 día por fila): el periodo es el mes de la primera fila, no una serie de días. */
    let drag = 0; for(let k = 1; k < rows.length; k++){ if(rows[k].per && rows[k - 1].per && (new Date(rows[k].per) - new Date(rows[k - 1].per)) === 864e5) drag++; }
    const dragged = drag >= 10; const first = rows.find(x => x.per);
    if(dragged && first) W("Laboratorios: la columna Período viene con fechas consecutivas por arrastre (" + drag + " filas); se toma todo el bloque como " + mesTxt(ymOf(first.per)) + ".");
    const idName = {};
    rows.forEach(x => { const id = txt(x.r[c.id]).toUpperCase(), nm = txt(x.r[c.nom]); if(nm) (idName[id] = idName[id] || []).push({ per: x.per, nm }); });
    let dp = 0;
    rows.forEach(x => {
      const r = x.r, id = txt(r[c.id]).toUpperCase(); let nm = txt(r[c.nom]);
      const per = dragged && first ? ymOf(first.per) : ymOf(x.per);
      const vals = {}; ["P","Alb","Hb","KtV","TAS","TAD","HbA1c","Ca","PTH","KRU","Vol"].forEach(k => { if(c[k] >= 0){ const raw = r[c[k]]; const v = numv(raw); if(v != null) vals[k] = { v, raw: typeof raw === "string" && /[<>]/.test(raw) ? raw.trim() : null }; } });
      const mod = c.mod >= 0 ? nrm(r[c.mod]) : "";
      if(mod === "DP"){ dp++; return; }
      const acc = c.acc >= 0 ? txt(r[c.acc]) : "";
      if(!Object.keys(vals).length && !nm) return;
      if(!per){ W("Laboratorios: fila " + (x.i + 1) + " (" + id + ") sin periodo legible; no se importó."); return; }
      let inferred = false;
      if(!nm){ const h = (idName[id] || []).filter(z => z.per && ymOf(z.per) <= per).sort((a, b) => a.per < b.per ? -1 : 1).pop() || (idName[id] || [])[0]; if(h){ nm = h.nm; inferred = true; } }
      out.lab.push({ id, nom: nm, per, vals, acc, sinNombre: inferred, fila: x.i + 1 });
    });
    out.cnt.labDP = dp;
  }
  /* --- 3.ASISTENCIAS_DIARIO --- */
  const A = aoa(XLSX, wb, "3.ASISTENCIAS_DIARIO") || [];
  const ha = findHeader(A, [/^TURNO$/, /^NOMBRE$/, /DOC ID/]);
  if(ha >= 0){
    const hr = A[ha]; const cm = colMap(hr);
    const c = { turno: pick(cm, /^TURNO$/), puesto: pick(cm, /^PUESTO/), nom: pick(cm, /^NOMBRE$/), eps: pick(cm, /^EPS$/), doc: pick(cm, /DOC ID/), acc: pick(cm, /^ACCESO$/), prog: pick(cm, /^PROG/) };
    const dayCol = {}; hr.forEach((v, i) => { if(v == null || !/^\d{1,2}(\.0)?$/.test(String(v).trim())) return; const n = Math.round(Number(v)); if(n >= 1 && n <= 31 && !(n in dayCol) && i > c.prog) dayCol[n] = i; });
    const dim = new Date(yy, mm, 0).getDate();
    for(let i = ha + 1; i < A.length; i++){
      const r = A[i]; if(!r) continue; const doc = docStr(r[c.doc]); if(!doc || !/^\d{5,}$/.test(doc)) continue;
      const dias = []; for(let d = 1; d <= 31; d++){ if(dayCol[d] != null && numv(r[dayCol[d]]) === 1){ if(d <= dim) dias.push(d); else W("Asistencias: marca en el día " + d + " de un mes de " + dim + " días (" + txt(r[c.nom]) + "); se ignoró."); } }
      out.asi.push({ doc, nom: txt(r[c.nom]), turno: mapTurno(r[c.turno]), turnoRaw: txt(r[c.turno]), puesto: numv(r[c.puesto]), eps: nrm(r[c.eps]), accRaw: txt(r[c.acc]), prog: numv(r[c.prog]), dias });
    }
    /* Verificación del mes: los días marcados deben caer en los días del turno. */
    const score = (y, m0) => { let ok = 0, n = 0; out.asi.forEach(a => { const td = turnoDias(a.turno); if(!td.length) return; a.dias.forEach(d => { const dt = new Date(y, m0, d); if(dt.getMonth() !== m0) return; n++; if(td.includes(dt.getDay())) ok++; }); }); return n ? ok / n : null; };
    const s0 = score(yy, mm - 1); out.cnt.asiScore = s0;
    if(s0 != null && s0 < 0.8){ let alt = null; for(let k = -3; k <= 3; k++){ if(!k) continue; const d = new Date(yy, mm - 1 + k, 1); const s = score(d.getFullYear(), d.getMonth()); if(s != null && s >= 0.9 && (!alt || s > alt.s)) alt = { s, ym: d.getFullYear() + "-" + p2(d.getMonth() + 1) }; }
      W("Asistencias: solo el " + Math.round(s0 * 100) + " % de las marcas cae en los días del turno para " + mesTxt(mes) + (alt ? "; coinciden mejor con " + mesTxt(alt.ym) + " (" + Math.round(alt.s * 100) + " %)" : "") + ". Verifique el mes del archivo."); out.cnt.asiAlt = alt ? alt.ym : null; }
  }
  /* --- 6.GLUCOMETRIAS --- */
  const G = aoa(XLSX, wb, "6.GLUCOMETRIAS") || [];
  const hg = findHeader(G, [/^ID$/, /NOMBRE COMPLETO/, /^DM$/]);
  if(hg >= 0){
    const hr = G[hg]; const cm = colMap(hr); const cid = pick(cm, /^ID$/), cnom = pick(cm, /NOMBRE COMPLETO/), cmod = pick(cm, /^MOD/);
    const dayCol = {}; hr.forEach((v, i) => { if(v == null || !/^\d{1,2}(\.0)?$/.test(String(v).trim())) return; const n = Math.round(Number(v)); if(n >= 1 && n <= 31 && !(n in dayCol) && i > cmod) dayCol[n] = i; });
    const dim = new Date(yy, mm, 0).getDate();
    for(let i = hg + 1; i < G.length; i++){ const r = G[i]; if(!r || !txt(r[cid])) continue; if(!/^P\d+/i.test(txt(r[cid]))) continue; const vals = []; for(let d = 1; d <= dim; d++){ if(dayCol[d] != null){ const v = numv(r[dayCol[d]]); if(v != null) vals.push({ d, v }); } } if(vals.length) out.glu.push({ id: txt(r[cid]).toUpperCase(), nom: txt(r[cnom]), vals }); }
  }
  /* --- 8.VACUNACION_HEPB --- */
  const V = aoa(XLSX, wb, "8.VACUNACION_HEPB") || [];
  const hv = findHeader(V, [/^ID$/, /FECHA DOSIS 1/]);
  if(hv >= 0){
    const cm = colMap(V[hv]); const c = { id: pick(cm, /^ID$/), nom: pick(cm, /NOMBRE COMPLETO/), mod: pick(cm, /^MOD/), d1: pick(cm, /FECHA DOSIS 1/), d2: pick(cm, /FECHA DOSIS 2/), d3: pick(cm, /FECHA DOSIS 3/), comp: pick(cm, /ESQUEMA COMPLETO/), fs: pick(cm, /FECHA SEROLOGIA/), ab: pick(cm, /^ANTI-HBS \(/), resp: pick(cm, /^RESPUESTA$/), ref: pick(cm, /REFUERZO APLICADO/), fref: pick(cm, /FECHA REFUERZO/), abr: pick(cm, /POST-REFUERZO/), est: pick(cm, /^ESTADO$/), obs: pick(cm, /^OBSERVACIONES$/) };
    for(let i = hv + 1; i < V.length; i++){ const r = V[i]; if(!r || !/^P\d+/i.test(txt(r[c.id]))) continue; if(nrm(r[c.mod]) === "DP") continue;
      const dose = k => { const raw = r[c[k]]; if(raw == null || raw === "") return null; const f = isoOf(raw); return f ? { f } : { f: null, raw: txt(raw) }; };
      out.vac.push({ id: txt(r[c.id]).toUpperCase(), nom: txt(r[c.nom]), d: [dose("d1"), dose("d2"), dose("d3")], comp: nrm(r[c.comp]), fs: isoOf(r[c.fs]), ab: numv(r[c.ab]), resp: txt(r[c.resp]), ref: nrm(r[c.ref]), fref: isoOf(r[c.fref]), abr: numv(r[c.abr]), est: txt(r[c.est]), obs: txt(r[c.obs]) }); }
  }
  /* --- COMPLICACIONES y NOVEDADES --- */
  const fixDate = (raw, hoja, fila) => { const f = isoOf(raw); if(f) return { f }; if(raw == null || raw === "") return { f: null };
    const m = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/.exec(String(raw).trim());
    if(m){ const a = +m[1], b = +m[2]; const d = b === mm ? a : a === mm ? b : null; if(d && d >= 1 && d <= 31){ const f2 = yy + "-" + p2(mm) + "-" + p2(d); W(hoja + ": fila " + fila + " con año mal digitado («" + raw + "»); se leyó como " + f2 + " por coincidir día y mes con el archivo. Confírmelo."); return { f: f2, fix: true }; } }
    W(hoja + ": fila " + fila + " con fecha ilegible («" + raw + "»); no se importó."); return { f: null, bad: true }; };
  const C = aoa(XLSX, wb, "COMPLICACIONES") || [];
  const hc = findHeader(C, [/^FECHA$/, /^COMPLICACION$/]);
  if(hc >= 0){ const cm = colMap(C[hc]); const c = { f: pick(cm, /^FECHA$/), doc: pick(cm, /^ID PACIENTE$/), nom: pick(cm, /NOMBRE COMPLETO/), turno: pick(cm, /^TURNO$/), tipo: pick(cm, /^COMPLICACION$/), sev: pick(cm, /^SEVERIDAD$/), cond: pick(cm, /^CONDUCTA/), res: pick(cm, /^RESUELTO$/), resp: pick(cm, /^RESPONSABLE$/), obs: pick(cm, /^OBSERVACIONES$/) };
    for(let i = hc + 1; i < C.length; i++){ const r = C[i]; if(!r || (r[c.f] == null && !txt(r[c.tipo]))) continue; if(!txt(r[c.tipo]) && !txt(r[c.nom])) continue; const fd = fixDate(r[c.f], "Complicaciones", i + 1); if(!fd.f) continue;
      out.evt.push({ f: fd.f, doc: docStr(r[c.doc]), nom: txt(r[c.nom]), turno: txt(r[c.turno]), tipoRaw: txt(r[c.tipo]), sev: txt(r[c.sev]), cond: txt(r[c.cond]), res: txt(r[c.res]), resp: txt(r[c.resp]), obs: txt(r[c.obs]) }); } }
  const N = aoa(XLSX, wb, "NOVEDADES") || [];
  const hn = findHeader(N, [/^FECHA$/, /TIPO DE NOVEDAD/]);
  if(hn >= 0){ const cm = colMap(N[hn]); const c = { f: pick(cm, /^FECHA$/), doc: pick(cm, /^ID PACIENTE$/), nom: pick(cm, /NOMBRE COMPLETO/), tipo: pick(cm, /TIPO DE NOVEDAD/), des: pick(cm, /^DESCRIPCION$/), resp: pick(cm, /^RESPONSABLE$/), est: pick(cm, /^ESTADO$/), fc: pick(cm, /FECHA CIERRE/), obs: pick(cm, /^OBSERVACIONES$/) };
    for(let i = hn + 1; i < N.length; i++){ const r = N[i]; if(!r || r[c.f] == null || (!txt(r[c.tipo]) && !txt(r[c.des]))) continue; const fd = fixDate(r[c.f], "Novedades", i + 1); if(!fd.f) continue;
      out.nov.push({ f: fd.f, fix: !!fd.fix, doc: docStr(r[c.doc]), nom: txt(r[c.nom]), tipoRaw: txt(r[c.tipo]), des: txt(r[c.des]), resp: txt(r[c.resp]), est: txt(r[c.est]), fc: isoOf(r[c.fc]), obs: txt(r[c.obs]) }); } }
  /* --- 16.FACTURACION (tarifas del contrato) --- */
  const F = aoa(XLSX, wb, "16.FACTURACION") || [];
  const hf = findHeader(F, [/^EPS$/, /HD PAQUETE/]);
  if(hf >= 0){ for(let i = hf + 1; i < Math.min(F.length, hf + 9); i++){ const r = F[i]; if(!r || !txt(r[1])) continue; if(/KPI|DETALLE|SUPUESTOS/i.test(String(r[1]))) break; const paq = numv(r[3]), ses = numv(r[5]); if(paq == null || ses == null) continue; out.tar.push({ eps: nrm(r[1]), paquete: paq, sesion: ses, min: numv(r[7]), max: numv(r[8]), extra: nrm(r[9]) === "SI" ? "SI" : "NO", desde: "" }); } }
  out.cnt.pac = out.pac.length; out.cnt.lab = out.lab.length; out.cnt.asi = out.asi.reduce((a, x) => a + x.dias.length, 0); out.cnt.evt = out.evt.length; out.cnt.nov = out.nov.length;
  out._cands = nameCands; out._byDoc = byDoc;
  return out;
};

/* ---------- consolidación: un payload entra a la base (libro) ---------- */
/* El libro es un objeto con arreglos pac, lab, ses, evt, nov, mov, vac y cfgv.hdx. Las fechas se guardan en ISO; el cargador las convierte.
   Mientras se consolida, los registros apuntan al objeto paciente (no al ID): los ID del Dashboard se repiten y cambian entre meses. */
const dIso = v => v instanceof Date ? isoOf(v) : (typeof v === "string" ? v.slice(0, 10) : isoOf(v));
HDX.dIso = dIso;
HDX.emptyMeta = () => ({ fuentes: [], warn: [], retirados: [] });
HDX.COLS = ["lab","ses","evt","nov","vac","mov","acn","ate","val","est","txs","sol","seg","atb","med","dis","ctc","dsp"];
let UID = 0;
HDX.toRefs = function(book){ const d = {}; book.pac.forEach(p => { if(!p._u) p._u = ++UID; if(p.ID) d[p.ID] = p; }); HDX.COLS.forEach(k => (book[k] || []).forEach(r => { if(!r._ref && typeof r.Paciente === "string" && d[r.Paciente]){ r.Paciente = d[r.Paciente]; r._ref = true; } })); };
const uidOf = r => r._ref ? "#" + r.Paciente._u : String(r.Paciente || "");
HDX.getHist = function(p, f){ const m = {}; String(p[f] || "").split(";").filter(Boolean).forEach(s => { const i = s.indexOf(":"); m[s.slice(0, i)] = s.slice(i + 1); }); return m; };
HDX.setHist = function(p, f, mes, v){ const m = HDX.getHist(p, f); m[mes] = v; p[f] = Object.keys(m).sort().map(k => k + ":" + m[k]).join(";"); };
const fullName = p => txt((p.Nombres || "") + " " + (p.Apellidos || ""));
function sameName(a, b){ const ta = nrm(a).split(" ").filter(t => t.length > 2), tb = nrm(b).split(" ").filter(t => t.length > 2); let n = 0; ta.forEach(t => { if(tb.some(u => tokSim(t, u) > 0)) n++; }); return n >= Math.min(2, ta.length, tb.length) && n > 0; }
function metodoDe(k){ return k === "KtV" ? "Kt/V del Dashboard: tipo y método sin registrar; fecha de toma sin registrar (día 1 = mes del bloque)" : "Dashboard: fecha exacta de toma sin registrar (día 1 = mes del bloque)"; }

HDX.mergePayload = function(book, pl){
  const hx = book.cfgv.hdx = book.cfgv.hdx || HDX.emptyMeta();
  const W = s => { if(hx.warn.length < 110 && !hx.warn.includes(s)) hx.warn.push(String(s).slice(0, 260)); };
  pl.warn.forEach(s => W("[" + pl.archivo + "] " + s));
  const mes = pl.mes;
  HDX.toRefs(book);
  let byDoc = {}; const reDoc = () => { byDoc = {}; book.pac.forEach(p => { if(p.Documento) byDoc[String(p.Documento)] = p; }); }; reDoc();
  const addMes = (p, f, m) => { const s = new Set(String(p[f] || "").split(",").filter(Boolean)); s.add(m); p[f] = [...s].sort().join(","); };
  if(pl.ret.length) hx.retirados = pl.ret;
  /* 1. Maestro: primero se decide a qué persona corresponde cada fila (documento y nombre deben concordar) */
  const plan = [];
  pl.pac.forEach(src => {
    if(src.mod !== "HD"){ hx.otros = hx.otros || {}; hx.otros[src.doc] = { mod: src.mod, ini: src.ini, ing: src.ing, id: src.id, mes, fn: src.fn }; const q = byDoc[src.doc]; if(q && sameName(fullName(q), src.nom + " " + src.ape) && !q.ModalidadPrevia) q.ModalidadPrevia = src.mod; return; }
    const full = src.nom + " " + src.ape; let p = byDoc[src.doc] || null;
    if(p && !sameName(fullName(p), full)){ const m = matchName(full, book.pac.map(z => ({ key: z._u, name: fullName(z), p: z }))); 
      W("[" + pl.archivo + "] El documento " + src.doc + " figuraba a nombre de " + fullName(p) + " y ahora a nombre de " + txt(full) + ". Se sigue a la persona por el nombre y se toma el documento de este archivo; verifique el número.");
      p = m ? m.p : null; }
    else if(!p){ const m = matchName(full, book.pac.map(z => ({ key: z._u, name: fullName(z), p: z }))); if(m && sameName(fullName(m.p), full) && nrm(fullName(m.p)).split(" ").length >= 3 && !pl.pac.some(z => z.doc === String(m.p.Documento))){ W("[" + pl.archivo + "] " + txt(full) + " cambia de documento (" + m.p.Documento + " → " + src.doc + "); se trata como la misma persona. Verifique."); p = m.p; } }
    plan.push({ src, p });
  });
  plan.forEach(x => {
    const src = x.src; let p = x.p;
    if(!p){
      p = { ID: "", TipoDoc: src.tdoc || "", Documento: src.doc, Apellidos: src.ape, Nombres: src.nom, FechaNac: null, Sexo: "", EPS: "", Afiliacion: "", HTA: "", DM: "", DMTipo: "", InicioTRR: null, IngresoUnidad: null, Estado: "Activo", FechaEstado: null, Turno: "", Puesto: null, SesSemana: null, DuracionMin: null, AccesoInicial: null, AccesoActual: null, AccesoDesde: null, RutaAcceso: "Sin valorar", TxEstado: "Sin evaluar", TxEtapaRaw: "", VacunaVHB: "", VHBNoRespondedor: "", Paratiroidectomia: "", Comorbilidades: "", Obs: "", MesesMaestro: "", MesesRegistro: "", IdHist: "", AccesoHist: "", PrimerRegistro: null, InicioHD: null, ModalidadPrevia: "", EstadoFuente: "", EstadoOrigen: "", ProgMes: null, ERCEtapa: null, Usuario: "Lectura de Dashboards", Actualizado: "" };
      p._u = ++UID; book.pac.push(p);
    }
    x.p = p; p.Documento = src.doc;
  });
  reDoc();
  plan.forEach(({ src, p }) => {
    const o = hx.otros && hx.otros[src.doc];
    if(o && !p.ModalidadPrevia && o.mes <= mes && (!p.MesesMaestro)) { p.ModalidadPrevia = o.mod; if(o.fn && !p.FechaNac) p.FechaNac = o.fn; }
    HDX.setHist(p, "IdHist", mes, src.id);
    p.Apellidos = src.ape || p.Apellidos; p.Nombres = src.nom || p.Nombres; if(src.tdoc) p.TipoDoc = src.tdoc;
    if(src.fn) p.FechaNac = src.fn; if(src.sexo) p.Sexo = src.sexo; if(src.eps) p.EPS = src.eps; if(src.afi) p.Afiliacion = src.afi;
    if(src.hta) p.HTA = src.hta; if(src.dm) p.DM = src.dm; if(src.erc != null) p.ERCEtapa = src.erc;
    if(src.com) p.Comorbilidades = src.com; if(src.obs) p.Obs = src.obs;
    if(src.ini){ const prevIni = dIso(p.InicioTRR);
      if(p.ModalidadPrevia && o && o.ini && o.ini < src.ini){ p.InicioTRR = o.ini; p.InicioHD = src.ini; }
      else { if(prevIni && prevIni !== src.ini) W("[" + pl.archivo + "] " + src.id + " " + txt(src.nom + " " + src.ape) + ": el inicio de diálisis cambió de " + prevIni + " a " + src.ini + " entre archivos; se usa el más reciente."); p.InicioTRR = src.ini; } }
    if(src.ing) p.IngresoUnidad = src.ing;
    const acc = mapAcc(src.accRaw); if(acc){ p.AccesoActual = acc; HDX.setHist(p, "AccesoHist", mes, acc); }
    if(src.txRaw !== p.TxEtapaRaw){ p.TxEtapaRaw = src.txRaw; p.TxEstado = mapTx(src.txRaw); }
    p.EstadoFuente = src.est || "(sin diligenciar)";
    addMes(p, "MesesMaestro", mes);
  });
  const cands = () => book.pac.map(p => ({ key: p._u, name: fullName(p), p }));
  const byName = nm => { const m = matchName(nm, cands()); return m ? m.p : null; };
  const plIdToDoc = {}; pl.pac.forEach(s => { if(s.mod === "HD") (plIdToDoc[s.id] = plIdToDoc[s.id] || []).push(s.doc); });
  const resolve = (id, nm, doc) => { if(doc && byDoc[doc] && (!nm || sameName(fullName(byDoc[doc]), nm) || matchName(nm, [{ key: 1, name: fullName(byDoc[doc]) }]))) return byDoc[doc]; if(nm){ const p = byName(nm); if(p) return p; } if(doc && byDoc[doc] && !nm) return byDoc[doc]; if(id && !nm && plIdToDoc[id] && plIdToDoc[id].length === 1) return byDoc[plIdToDoc[id][0]] || null; return null; };
  const newRec = (k, pre, o) => { const r = Object.assign({ ID: pre + String(book[k].length + 1).padStart(6, "0") }, o, { Registrado: "", _ref: true }); book[k].push(r); return r; };
  /* 2. Laboratorios (el archivo más reciente manda; las diferencias se cuentan) */
  const labKey = {}; book.lab.forEach(l => { labKey[uidOf(l) + "|" + l.Examen + "|" + dIso(l.FechaToma)] = l; });
  let nL = 0, nDiff = 0, nSk = 0; const perSet = new Set(); const diffPer = {};
  pl.lab.forEach(x => {
    const p = resolve(x.id, x.nom, null);
    if(!p){ nSk++; W("[" + pl.archivo + "] Laboratorios: fila " + x.fila + " (" + x.id + (x.nom ? " " + x.nom : "") + ", " + x.per + ") sin paciente identificable en el maestro de HD; no se importó."); return; }
    const f = x.per + "-01"; perSet.add(x.per);
    const acc = mapAcc(x.acc); if(acc && !(HDX.getHist(p, "AccesoHist")[x.per] && String(p.MesesMaestro || "").split(",").includes(x.per))) HDX.setHist(p, "AccesoHist", x.per, acc);
    Object.keys(x.vals).forEach(k => {
      if(k === "TAD" || k === "KRU" || k === "Vol") return;
      const key = "#" + p._u + "|" + k + "|" + f; const prev = labKey[key]; const val = x.vals[k].raw || x.vals[k].v;
      if(prev){ if(String(prev.Valor) !== String(val)){ nDiff++; diffPer[x.per] = (diffPer[x.per] || 0) + 1; prev.Valor = val; prev.Usuario = "Dashboard " + mesTxt(mes) + " (corrige el valor de un archivo anterior)"; } return; }
      labKey[key] = newRec("lab", "L-", { Paciente: p, FechaToma: f, Examen: k, Valor: val, Metodo: metodoDe(k), Usuario: "Dashboard " + mesTxt(mes) }); nL++;
    });
    if(x.sinNombre) W("Laboratorios " + x.per + ": la fila de " + x.id + " no trae nombre en el Dashboard; se asignó a " + fullName(p) + " por el ID de los meses anteriores.");
  });
  Object.keys(diffPer).forEach(per => W("[" + pl.archivo + "] " + diffPer[per] + " resultados de " + mesTxt(per) + " difieren de los cargados en un archivo anterior; se conserva el valor de este archivo (el más reciente)."));
  /* 3. Asistencias → sesiones realizadas (sin duración ni pesos: el Dashboard no los trae) */
  const sesKey = new Set(book.ses.map(s => uidOf(s) + "|" + dIso(s.Fecha)));
  let nS = 0; const asiSeen = {};
  pl.asi.forEach(a => {
    const p = resolve(null, a.nom, a.doc);
    if(!p){ if(a.dias.length) W("[" + pl.archivo + "] Asistencias: «" + a.nom + "» (doc. " + a.doc + ") no está en el maestro de HD; no se importaron sus " + a.dias.length + " sesiones."); return; }
    if(asiSeen[p._u]) W("[" + pl.archivo + "] Asistencias: " + fullName(p) + " aparece en más de una fila; se sumaron las marcas."); asiSeen[p._u] = 1;
    if(a.turno) p.Turno = a.turno; if(a.puesto != null) p.Puesto = a.puesto; if(a.prog != null) p.ProgMes = a.prog;
    const acc = mapAcc(a.accRaw);
    a.dias.forEach(d => { const f = mes + "-" + p2(d); const k = "#" + p._u + "|" + f; if(sesKey.has(k)) return; sesKey.add(k);
      newRec("ses", "S-", { Fecha: f, Paciente: p, Turno: a.turno || "", Puesto: a.puesto, Tipo: "Programada", Estado: "Realizada", Motivo: "", Responsable: "", Nota: "Asistencia marcada en el Dashboard de " + mesTxt(mes), DuracionMin: null, Acceso: acc || "", PesoPre: null, PesoPost: null, TASPre: null, TADPre: null, TASPost: null, TADPost: null, Gluco: null, Usuario: "Dashboard " + mesTxt(mes) }); nS++; });
  });
  /* 4. Glucometrías → sobre la sesión del día */
  let nG = 0, nG0 = 0;
  pl.glu.forEach(g => { const p = resolve(g.id, g.nom, null); if(!p) return; g.vals.forEach(({ d, v }) => { const f = mes + "-" + p2(d); const s = book.ses.find(z => z._ref && z.Paciente === p && dIso(z.Fecha) === f); if(s){ if(s.Gluco == null){ s.Gluco = v; nG++; } } else nG0++; }); });
  if(nG0) W("[" + pl.archivo + "] Glucometrías: " + nG0 + " valores en días sin asistencia marcada; no se importaron.");
  /* 5. Vacunación VHB y anti-HBs */
  const vacKey = new Set(book.vac.map(v => uidOf(v) + "|" + v.Serie + "|" + v.NumDosis + "|" + dIso(v.Fecha)));
  pl.vac.forEach(v => { const p = resolve(v.id, v.nom, null); if(!p) return;
    const dated = v.d.filter(x => x && x.f).length, undated = v.d.filter(x => x && !x.f).length;
    p.VacunaVHB = v.comp === "SI" ? (undated ? "Esquema completo (fechas sin registrar)" : "Esquema completo") : (dated || undated ? "Esquema incompleto" : "Sin iniciar");
    p.VHBEstadoRaw = v.est;
    v.d.forEach((x, i) => { if(!x || !x.f) return; const k = "#" + p._u + "|1|" + (i + 1) + "|" + x.f; if(vacKey.has(k)) return; vacKey.add(k); newRec("vac", "V-", { Paciente: p, Vacuna: "Hepatitis B", Esquema: "3 dosis de 40 µg (Dashboard)", Serie: "1", NumDosis: i + 1, Fecha: x.f, Lote: "", Observacion: "", Usuario: "Dashboard " + mesTxt(mes) }); });
    if(v.fref){ const k = "#" + p._u + "|2|1|" + v.fref; if(!vacKey.has(k)){ vacKey.add(k); newRec("vac", "V-", { Paciente: p, Vacuna: "Hepatitis B", Esquema: "Refuerzo", Serie: "2", NumDosis: 1, Fecha: v.fref, Lote: "", Observacion: "Refuerzo", Usuario: "Dashboard " + mesTxt(mes) }); } }
    [[v.fs, v.ab, "Anti-HBs de la hoja de vacunación"], [v.fref, v.abr, "Anti-HBs posrefuerzo"]].forEach(([f, val, met]) => { if(f == null || val == null) return; const key = "#" + p._u + "|AntiHBs|" + f; const prev = labKey[key]; if(prev){ prev.Valor = val; return; } labKey[key] = newRec("lab", "L-", { Paciente: p, FechaToma: f, Examen: "AntiHBs", Valor: val, Metodo: met, Usuario: "Dashboard " + mesTxt(mes) }); });
  });
  /* 6. Complicaciones → eventos */
  const evtKey = new Set(book.evt.map(e => uidOf(e) + "|" + dIso(e.Fecha) + "|" + e.Tipo + "|" + (e.Conducta || "")));
  let nE = 0, nEold = 0;
  pl.evt.forEach(e => { const p = resolve(null, e.nom, e.doc); const rawN = nrm(e.tipoRaw); let tipo = EVT_MAP[rawN] || null; if(!tipo && /BACTEREM/.test(rawN)) tipo = "Bacteriemia asociada a catéter (ITS-CVC)"; if(!tipo && /INFECCION DEL ACCESO/.test(rawN)) tipo = p && /^CVC/.test(p.AccesoActual || "") ? "Bacteriemia asociada a catéter (ITS-CVC)" : "Infección de FAV o injerto"; if(!tipo) tipo = "Otro";
    if(ymOf(e.f) !== mes) nEold++;
    const cond = [tipo === "Otro" && e.tipoRaw && !/^OTRA/i.test(e.tipoRaw) ? e.tipoRaw : "", e.cond, e.obs].filter(Boolean).join(" · ");
    const k = (p ? "#" + p._u : "") + "|" + e.f + "|" + tipo + "|" + cond; if(evtKey.has(k)) return; evtKey.add(k);
    if(!p) W("[" + pl.archivo + "] Complicaciones: evento del " + e.f + " («" + e.nom + "») sin paciente identificable en el maestro.");
    const r = newRec("evt", "E-", { Fecha: e.f, Paciente: p || "", Sesion: "", Tipo: tipo, Severidad: ["Leve","Moderada","Severa"].includes(e.sev) ? e.sev : "", Conducta: cond, Resuelto: ["Sí","No","En seguimiento"].includes(e.res) ? e.res : (e.res ? "En seguimiento" : ""), Hemocultivo: "", Microorganismo: "", Resistencia: "", FechaCierre: null, NombreFuente: e.nom, Usuario: e.resp || ("Dashboard " + mesTxt(mes)) }); if(!p) delete r._ref; nE++; });
  /* 7. Novedades → notas crudas (los episodios de hospitalización se arman en finalize) */
  const novKey = new Set(book.nov.filter(n => n.Causa === "NOTA").map(n => uidOf(n) + "|" + dIso(n.Inicio) + "|" + n.TipoRaw + "|" + n.Descripcion));
  let nN = 0, nNold = 0;
  pl.nov.forEach(n => { const p = resolve(null, n.nom, n.doc); if(ymOf(n.f) !== mes) nNold++;
    const des = [n.des, n.obs].filter(Boolean).join(" · "); const k = (p ? "#" + p._u : "") + "|" + n.f + "|" + n.tipoRaw + "|" + des; if(novKey.has(k)) return; novKey.add(k);
    if(!p) W("[" + pl.archivo + "] Novedades: «" + n.tipoRaw + "» del " + n.f + " («" + n.nom + "») sin paciente identificable en el maestro.");
    const r = newRec("nov", "N-", { Paciente: p || "", Tipo: "Otra", TipoRaw: n.tipoRaw, Inicio: n.f, Fin: n.f, Descripcion: des, Causa: "NOTA", Atribuible: "", Evitable: "", EstadoRaw: n.est, NombreFuente: n.nom, Usuario: n.resp || ("Dashboard " + mesTxt(mes)) }); if(!p) delete r._ref; nN++; });
  if(pl.tar.length) hx.tarifas = pl.tar;
  const lastDay = [].concat(pl.asi.flatMap(a => a.dias.map(d => mes + "-" + p2(d))), pl.evt.filter(e => ymOf(e.f) === mes).map(e => e.f), pl.nov.filter(n => ymOf(n.f) === mes).map(n => n.f)).sort().pop() || null;
  hx.fuentes = hx.fuentes.filter(f => f.mes !== mes);
  hx.fuentes.push({ archivo: pl.archivo, mes, maestro: pl.pac.filter(p => p.mod === "HD").length, labs: [...perSet].sort(), labNuevos: nL, labCorregidos: nDiff, sesiones: nS, asiOk: pl.cnt.asiScore == null ? null : Math.round(pl.cnt.asiScore * 100) / 100, asiAlt: pl.cnt.asiAlt || null, eventos: pl.evt.filter(e => ymOf(e.f) === mes).length, eventosAjenos: nEold, novedades: pl.nov.filter(n => ymOf(n.f) === mes).length, novedadesAjenas: nNold, gluco: nG, hasta: lastDay });
  hx.fuentes.sort((a, b) => a.mes < b.mes ? -1 : 1);
  return { labs: nL, corregidos: nDiff, sesiones: nS, eventos: nE, novedades: nN, sinPaciente: nSk };
};

/* ---------- cierre: ID definitivos, estados inferidos, primer registro y episodios de hospitalización ---------- */
HDX.finalize = function(book, opts){
  const hx = book.cfgv.hdx = book.cfgv.hdx || HDX.emptyMeta(); opts = opts || {};
  const gap = opts.gapHosp || hx.gapHosp || 14; hx.gapHosp = gap;
  const W = s => { if(hx.warn.length < 110 && !hx.warn.includes(s)) hx.warn.push(String(s).slice(0, 260)); };
  HDX.toRefs(book);
  const lastOf = p => String(p.MesesMaestro || "").split(",").filter(Boolean).sort().pop() || "";
  const owner = {}; (hx.retirados || []).forEach(r => { if(/EN USO/i.test(r.estado) && r.paciente) owner[r.id] = r.paciente; });
  const isOwner = (p, id) => !!(owner[id] && matchName(owner[id], [{ key: 1, name: fullName(p) }]));
  let mx = 0; const seen = id => { const m = /^P(\d+)/.exec(id || ""); if(m) mx = Math.max(mx, +m[1]); };
  book.pac.forEach(p => { seen(p.ID); Object.values(HDX.getHist(p, "IdHist")).forEach(seen); }); (hx.retirados || []).forEach(r => seen(r.id));
  const taken = {};
  const cand = p => { const h = HDX.getHist(p, "IdHist"); const c = Object.keys(h).sort().reverse().map(k => h[k]); if(p.ID && !c.includes(p.ID)) c.push(p.ID); return [...new Set(c)]; };
  book.pac.slice().sort((a, b) => { const la = lastOf(a) || "9999", lb = lastOf(b) || "9999"; if(la !== lb) return la > lb ? -1 : 1; const ca = cand(a)[0], cb = cand(b)[0]; return (isOwner(b, cb) ? 1 : 0) - (isOwner(a, ca) ? 1 : 0); }).forEach(p => {
    const c = cand(p); let id = c.find(x => !taken[x]);
    if(!id){ mx++; id = "P" + String(mx).padStart(3, "0"); W("El ID " + c[0] + " está repetido en el maestro: lo conserva " + txt(taken[c[0]]) + "; a " + fullName(p) + " (doc. " + p.Documento + ") se le asigna " + id + " de forma provisional. Corrija el número en el Dashboard."); }
    taken[id] = fullName(p); p.ID = id; });
  HDX.COLS.forEach(k => (book[k] || []).forEach(r => { if(r._ref){ r.Paciente = r.Paciente.ID || ""; delete r._ref; } }));
  book.pac.forEach(p => { delete p._u; });
  const fm = hx.fuentes.filter(f => f.maestro > 0).map(f => f.mes).sort(); const lastM = fm[fm.length - 1];
  const months = {}; const add = (id, m) => { if(!id || !m) return; (months[id] = months[id] || new Set()).add(m); };
  book.lab.forEach(l => { if(l.Examen !== "AntiHBs") add(l.Paciente, ymOf(dIso(l.FechaToma))); });
  book.ses.forEach(s => add(s.Paciente, ymOf(dIso(s.Fecha))));
  book.pac.forEach(p => { String(p.MesesMaestro || "").split(",").filter(Boolean).forEach(m => add(p.ID, m)); });
  book.mov = (book.mov || []).filter(m => m.Origen !== "HDX");
  hx.warn = hx.warn.filter(w => !/^\[cierre\]/.test(w));
  const WC = s => W("[cierre] " + s);
  book.pac.forEach(p => {
    const ms = [...(months[p.ID] || [])].sort(); p.MesesRegistro = ms.join(",");
    if(!String(p.MesesMaestro || "")) return; /* paciente creado en la aplicación: no se toca */
    const startKnown = dIso(p.IngresoUnidad) || dIso(p.InicioHD) || dIso(p.InicioTRR);
    p.PrimerRegistro = ms.length ? ms[0] + "-01" : null;
    const inLast = String(p.MesesMaestro || "").split(",").includes(lastM);
    const manual = p.Estado && p.Estado !== "Activo" && p.EstadoOrigen !== "HDX";
    if(!manual){
      if(inLast){ p.Estado = "Activo"; p.FechaEstado = null; p.EstadoOrigen = ""; }
      else if(ms.length){ const last = ms[ms.length - 1]; const fe = monthEndIso(last); const nextM = fm.find(m => m > last) || lastM;
        p.Estado = "Inactivo"; p.FechaEstado = fe; p.EstadoOrigen = "HDX";
        book.mov.push({ ID: "M-" + String(book.mov.length + 1).padStart(6, "0"), Paciente: p.ID, Fecha: fe, Tipo: "Otro egreso", Detalle: "[Inferido] Sale del maestro sin causa ni fecha registradas. Último registro: " + mesTxt(last) + "; ya no figura en el maestro de " + mesTxt(nextM) + ". Se usa como fecha el fin del último mes con registro.", Origen: "HDX", Usuario: "Lectura de Dashboards", Registrado: "" }); }
    }
    if(!startKnown && p.PrimerRegistro) WC(p.ID + " " + fullName(p) + ": sin inicio de diálisis ni ingreso a la unidad en el maestro; para el censo se toma el primer mes con registro (" + mesTxt(ymOf(p.PrimerRegistro)) + ") y no se clasifica como incidente ni como prevalente.");
    const it = dIso(p.InicioTRR), ig = dIso(p.IngresoUnidad);
    if(it && ig && ig < it) WC(p.ID + " " + fullName(p) + ": ingreso a la unidad (" + ig + ") anterior al inicio de diálisis (" + it + "). Una de las dos fechas está mal.");
    if(p.ModalidadPrevia && p.InicioHD) WC(p.ID + " " + fullName(p) + ": venía de " + p.ModalidadPrevia + " en esta misma unidad (inicio de TRR " + it + "); el " + dIso(p.InicioHD) + " es cambio de modalidad a HD, no un caso incidente.");
    if(!p.EPS) WC(p.ID + " " + fullName(p) + ": sin EPS en el maestro.");
    if(!dIso(p.FechaNac)) WC(p.ID + " " + fullName(p) + ": sin fecha de nacimiento; no entra a las estadísticas de edad y se asume adulto.");
    if(!p.HTA || !p.DM) WC(p.ID + " " + fullName(p) + ": HTA o DM sin diligenciar en el maestro.");
  });
  /* episodios de hospitalización: notas del mismo paciente separadas por ≤ gap días = un episodio (regla institucional provisional) */
  book.nov = book.nov.filter(n => n.Causa !== "EPISODIO");
  const notes = {}; book.nov.filter(n => n.Causa === "NOTA" && /HOSPITAL/i.test(n.TipoRaw || "") && n.Paciente).forEach(n => { (notes[n.Paciente] = notes[n.Paciente] || []).push(n); });
  Object.keys(notes).forEach(pid => { const L = notes[pid].sort((a, b) => dIso(a.Inicio) < dIso(b.Inicio) ? -1 : 1); let cur = null; const flush = () => { if(!cur) return; book.nov.push({ ID: "N-" + String(book.nov.length + 1).padStart(6, "0"), Paciente: pid, Tipo: "Hospitalización", TipoRaw: "Hospitalización", Inicio: cur.a, Fin: cur.b, Descripcion: cur.n.length + (cur.n.length === 1 ? " nota" : " notas") + " (" + cur.n.map(x => dIso(x.Inicio).slice(5).split("-").reverse().join("/")).join(", ") + "): " + [...new Set(cur.n.map(x => x.Descripcion))].join(" | "), Causa: "EPISODIO", Atribuible: "En estudio", Evitable: "", NotasN: cur.n.length, Usuario: "Lectura de Dashboards", Registrado: "" }); cur = null; };
    L.forEach(n => { const f = dIso(n.Inicio); if(cur && (new Date(f) - new Date(cur.b)) / 864e5 <= gap){ cur.b = f; cur.n.push(n); } else { flush(); cur = { a: f, b: f, n: [n] }; } }); flush(); });
  book.pac.sort((a, b) => String(a.ID) < String(b.ID) ? -1 : 1);
  return book;
};
})(typeof window !== "undefined" ? window : globalThis);
/* hdx-lectura.js:378 */
(function(root){
"use strict";
const HDX = root.HDX;
HDX.compact = function(book){
  const S = []; const si = s => { s = s == null ? "" : String(s); let i = S.indexOf(s); if(i < 0){ i = S.length; S.push(s); } return i; };
  const pi = {}; book.pac.forEach((p, i) => { pi[p.ID] = i; });
  const strip = o => { const r = {}; for(const k in o){ const v = o[k]; if(v == null || v === "" || k === "Registrado") continue; r[k] = v; } return r; };
  return { v: 1, S,
    pac: book.pac.map(strip),
    lab: book.lab.map(l => [pi[l.Paciente], l.FechaToma, si(l.Examen), l.Valor, si(l.Metodo), si(l.Usuario)]),
    ses: book.ses.map(s => [pi[s.Paciente], s.Fecha, si(s.Turno), s.Puesto == null ? "" : s.Puesto, si(s.Acceso), s.Gluco == null ? "" : s.Gluco, si(s.Usuario)]),
    evt: book.evt.map(strip), nov: book.nov.map(strip), mov: book.mov.map(strip), vac: book.vac.map(strip), hdx: book.cfgv.hdx };
};
HDX.expand = function(c){
  const S = c.S; const id = i => c.pac[i].ID; const mesDe = u => { const m = /Dashboard (\w+ de \d{4})/.exec(u); return m ? m[1] : ""; };
  const b = { pac: c.pac.map(p => Object.assign({}, p)), evt: c.evt.map(o => Object.assign({}, o)), nov: c.nov.map(o => Object.assign({}, o)), mov: c.mov.map(o => Object.assign({}, o)), vac: c.vac.map(o => Object.assign({}, o)), hdx: JSON.parse(JSON.stringify(c.hdx)) };
  b.lab = c.lab.map((l, i) => ({ ID: "L-" + String(i + 1).padStart(6, "0"), Paciente: id(l[0]), FechaToma: l[1], Examen: S[l[2]], Valor: l[3], Metodo: S[l[4]], Usuario: S[l[5]] }));
  b.ses = c.ses.map((s, i) => ({ ID: "S-" + String(i + 1).padStart(6, "0"), Fecha: s[1], Paciente: id(s[0]), Turno: S[s[2]], Puesto: s[3] === "" ? null : s[3], Tipo: "Programada", Estado: "Realizada", Motivo: "", Responsable: "", Nota: "Asistencia marcada en el Dashboard de " + mesDe(S[s[6]]), DuracionMin: null, Acceso: S[s[4]], PesoPre: null, PesoPost: null, TASPre: null, TADPre: null, TASPost: null, TADPost: null, Gluco: s[5] === "" ? null : s[5], Usuario: S[s[6]] }));
  return b;
};
})(typeof window !== "undefined" ? window : globalThis);
const HDX = window.HDX;
/* hdx-nucleo.js:10 */
(function(){
"use strict";
const HX = window.HX = { n90: false, thr: 80, ver: "3.1" };
const U = HDX.util;

/* ---------- columnas nuevas del libro (se conservan al descargar y volver a cargar el Libro HD) ---------- */
function addCols(k, cols){ const arr = SH[k][1]; cols.forEach(c => { if(!arr.includes(c)){ const i = arr.indexOf("Usuario"); arr.splice(i < 0 ? arr.length : i, 0, c); } }); }
addCols("pac", ["Comorbilidades","ERCEtapa","TxEtapaRaw","ProgMes","InicioHD","ModalidadPrevia","PrimerRegistro","MesesMaestro","MesesRegistro","IdHist","AccesoHist","EstadoFuente","EstadoOrigen","VHBEstadoRaw"]);
addCols("nov", ["TipoRaw","EstadoRaw","NotasN","NombreFuente"]);
addCols("evt", ["NombreFuente"]);
addCols("mov", ["Origen"]);
["PrimerRegistro","InicioHD"].forEach(f => DATE_F.add(f));
["ProgMes","ERCEtapa","NotasN"].forEach(f => NUM_F.add(f));

function hydrate(b){ Object.keys(b).forEach(k => { if(!Array.isArray(b[k])) return; b[k].forEach(r => { for(const f in r){ if(DATE_F.has(f) && typeof r[f] === "string") r[f] = pdate(r[f]); } }); }); }
HX.hydrate = hydrate;
HX.meta = () => (ST.book && ST.book.cfgv && ST.book.cfgv.hdx) || null;
const mesTxt = U.mesTxt;

/* ---------- carga de la base embebida ---------- */
function hdxLoadBase(silent){
  try {
    const x = HDX.expand(window.HDX_BASE); const b = newBook();
    ["pac","lab","ses","evt","nov","mov","vac"].forEach(k => { b[k] = x[k]; });
    b.cfgv.hdx = x.hdx; hydrate(b);
    const tar = (x.hdx.tarifas || []).map(t => Object.assign({}, t)); tar.forEach(t => { if(t.min != null) b.cfgv.minSes[t.eps] = t.min; });
    const fu = x.hdx.fuentes || []; const lastF = fu[fu.length - 1] || {};
    const lastDay = pdate(lastF.hasta) || TODAY();
    b.log.push({ FechaHora: nowTs(), Usuario: "Lectura de Dashboards", Accion: "CARGA_BASE", Hoja: "Todo", Registro: fu.map(f => f.archivo).join(" + "), Detalle: b.pac.length + " pacientes, " + b.ses.length + " sesiones marcadas, " + b.lab.length + " resultados de laboratorio, " + b.evt.length + " complicaciones. Sin datos generados." });
    ST.book = b; ST.demo = false; ST.dirty = false;
    ST.imp = { tarifas: tar, warn: (x.hdx.warn || []).slice(), fn: "Dashboards de " + (fu.length ? mesTxt(fu[0].mes) + " a " + mesTxt(lastF.mes) : "la unidad"), mes: lastF.mes || ym(TODAY()) };
    const t = TODAY(); ST.corte = t >= lastDay ? t : lastDay; ST.ps = new Date(ST.corte.getFullYear(), 0, 1);
    ST.fin = { key: "UNLOCKED_DIRECT", data: { tarifas: tar, facturado: {}, creado: nowTs(), por: "Hoja 16.FACTURACION del Dashboard" } };
    ST.ui = { tdate: iso(lastDay), tturno: "" };
    IDX.dirty = true; reindex();
    const act = b.pac.filter(p => activeAt(p, ST.corte)).length;
    ST.src = "Base real POSMÉDICA · " + ST.imp.fn + " (" + act + " activos · " + b.ses.length + " sesiones marcadas · sin datos generados)";
    hxSiis();
    try { syncBar(); bookInfo(); } catch(e){}
    if(!silent) toast("Base real de hemodiálisis cargada: " + act + " activos al corte.");
  } catch(e){ console.error("hdxLoadBase", e); }
}
window.hdxLoadBase = hdxLoadBase;

/* Códigos SIIS: solo equivalencias directas con la categoría del Dashboard. Lo ambiguo queda sin código. */
const SIIS_EQ = { "Hipotensión intradialítica": "4", "Hipertensión intradialítica": "17", "Calambres musculares": "85", "Cefalea": "14", "Náuseas / vómitos": "2" };
function hxSiis(){
  if(typeof V30 === "undefined" || typeof SIIS_ACTIVIDADES_HD === "undefined" || !ST.book) return;
  V30.siisActs = []; let n = 0;
  ST.book.evt.filter(live).forEach(e => { const no = SIIS_EQ[e.Tipo]; if(!no) return; const def = SIIS_ACTIVIDADES_HD.find(a => a.no === no); const p = IDX.pac.get(e.Paciente); if(!def) return;
    V30.siisActs.push({ id: "SIIS-" + String(++n).padStart(4, "0"), no: def.no, act: def.act, tipo: def.tipo, cat: def.cat, prot: def.prot, fecha: iso(e.Fecha), pid: p ? p.ID : "", pacNom: p ? nombre(p) : (e.NombreFuente || "Sin identificar"), eps: p ? (p.EPS || "") : "", turno: p ? (p.Turno || "") : "", silla: p ? (p.Puesto || "") : "", sev: e.Severidad || "", nota: e.Tipo + (e.Conducta ? " — Conducta: " + e.Conducta : "") + " · Código asignado por equivalencia con la categoría del Dashboard", estado: e.Resuelto === "Sí" ? "Cerrado" : "En seguimiento", usuario: e.Usuario || "" }); });
}
HX.siis = hxSiis;

/* ---------- ajustes al índice: inicio por primer registro y acceso vascular por mes ---------- */
const reindex0 = reindex;
reindex = function(){
  reindex0();
  IDX.pac.forEach(p => {
    if(p.PrimerRegistro && !p.IngresoUnidad && !p.InicioTRR){
      const end = p.Estado && p.Estado !== "Activo" ? (p.FechaEstado || null) : null;
      if(!p._iv.length) p._iv = [[p.PrimerRegistro, end]]; else if(p._iv[0][0] > p.PrimerRegistro) p._iv[0][0] = p.PrimerRegistro;
      p._noStart = false; p._startInf = true;
    }
    /* cambio de modalidad DP→HD dentro de la unidad: la cohorte de HD empieza en el inicio de HD */
    if(p.InicioHD && p._iv.length && p._iv[0][0] < p.InicioHD) p._iv[0][0] = p.InicioHD;
    p._accH = HDX.getHist(p, "AccesoHist"); p._accK = Object.keys(p._accH).sort();
  });
};
const accessAt0 = accessAt;
accessAt = function(p, d){
  const K = p._accK || []; if(!K.length) return accessAt0(p, d);
  const m = ym(d); let k = null; for(const x of K){ if(x <= m) k = x; else break; }
  let s = null; for(let i = p._ses.length - 1; i >= 0; i--){ const z = p._ses[i]; if(z.Fecha <= d && z.Acceso && z.Estado === "Realizada"){ s = z; break; } }
  if(p.AccesoActual && p.AccesoDesde && p.AccesoDesde <= d && (!k || ym(p.AccesoDesde) > k) && (!s || p.AccesoDesde >= s.Fecha)) return p.AccesoActual;
  if(s && (!k || ym(s.Fecha) > k)) return s.Acceso;
  return k ? p._accH[k] : null;
};

/* ---------- poblaciones ---------- */
const base = x => pacs().filter(p => (!x.eps || p.EPS === x.eps) && activeAt(p, x.c) && adult(p, x.c) && (!HX.n90 || ninety(p, x.c)));
const per = x => pacs().filter(p => (!x.eps || p.EPS === x.eps) && overlaps(p, x.ps, x.c) && adult(p, x.c));
const inc = x => pacs().filter(p => (!x.eps || p.EPS === x.eps) && p.InicioTRR && p.InicioTRR >= x.ps && p.InicioTRR <= x.c && adult(p, p.InicioTRR) && overlaps(p, x.ps, x.c));
HX.pop = { base, per, inc };
const lastMonthWith = k => { let mx = null; ST.book.lab.forEach(l => { if(live(l) && l.Examen === k && l.FechaToma && (!mx || l.FechaToma > mx)) mx = l.FechaToma; }); return mx; };
HX.lastMonthWith = lastMonthWith;
const EXL = { KtV: "Kt/V", Hb: "hemoglobina", Alb: "albúmina", P: "fósforo", PTH: "PTH", Ca: "calcio" };
function noWin(r, k, from, c){ if(r.den.length && r.sd.length === r.den.length){ const m = lastMonthWith(k); r.ne = "Ningún paciente tiene " + EXL[k] + " dentro de la ventana (" + fd(addDays(from, 1)) + " a " + fd(c) + ")." + (m ? " Último mes con dato: " + mesTxt(ym(m)) + "." : " La base no tiene este examen."); } return r; }
function propLabX(x, k, win, test, fmt){ const r = { num: [], den: [], excl: [], sd: [] }; const from = win === "sem" ? x.sem : x.tri;
  base(x).forEach(p => { const l = lastLab(p, k, from, x.c); const v = l ? num(l.Valor) : null; r.den.push(pv(p, v == null ? "sin dato en la ventana" : (fmt ? fmt(v) : v) + " · " + mesTxt(ym(l.FechaToma)))); if(v == null) r.sd.push(p); else if(test(v)) r.num.push(pv(p, v)); });
  return noWin(r, k, from, x.c); }

/* meses en que la fuente sí registró novedades o complicaciones (para no diluir tasas con meses sin registro) */
function obsSegs(x, campo){ const hx = HX.meta(); if(!hx || !hx.fuentes || !hx.fuentes.length) return [[x.ps, x.c]];
  const segs = []; hx.fuentes.forEach(f => { if(!(f[campo] > 0)) return; const a = pdate(f.mes + "-01"); let b = monthEnd(a); const last = hx.fuentes[hx.fuentes.length - 1] === f; if(last && f.hasta && pdate(f.hasta) < b) b = pdate(f.hasta); const s = a < x.ps ? x.ps : a, e = b > x.c ? x.c : b; if(e >= s) segs.push([s, e]); });
  /* registros hechos en la aplicación después del último archivo también cuentan */
  const lf = hx.fuentes[hx.fuentes.length - 1]; const after = lf && lf.hasta ? addDays(pdate(lf.hasta), 1) : null; if(after && after <= x.c && ST.book.log.some(l => l.Accion === "CREA")) segs.push([after < x.ps ? x.ps : after, x.c]);
  return segs; }
const inSegs = (d, S) => S.some(([a, b]) => d >= a && d <= b);
const segTxt = S => S.length ? S.map(([a, b]) => fd(a) + " a " + fd(b)).join("; ") : "ningún mes";
HX.obsSegs = obsSegs;

/* ---------- los 17 indicadores (definición operativa: fichas resumidas CAC 2026 que entregó la coordinación) ---------- */
const F = {
 dia_10_adul: x => { const r = { num: [], den: [], excl: [], sd: [] }; base(x).forEach(p => { if(RUTA_EXCL.includes(p.RutaAcceso) && p.SoporteRuta){ r.excl.push({ p, why: p.RutaAcceso + " · " + p.SoporteRuta }); return; } const a = accessAt(p, x.c); r.den.push(pv(p, a || "sin dato")); if(!a) r.sd.push(p); else if(isCVC(a)) r.num.push(pv(p, a)); }); return r; },
 dia_11_adul: x => propLabX(x, "KtV", "tri", v => v >= 1.2, v => f1(v, 2)),
 dia_13_adul: x => propLabX(x, "Hb", "tri", v => v >= 10),
 dia_15_adul: x => propLabX(x, "Alb", "tri", v => v >= 4, v => f1(v, 2)),
 dia_17_adul: x => propLabX(x, "P", "tri", v => v >= 2.5 && v <= 6),
 dia_20_adul: x => { const r = { num: [], den: [], excl: [], sd: [] }; let conDur = 0;
   base(x).forEach(p => { const sw = num(p.SesSemana); if(sw != null && sw < 3){ r.excl.push({ p, why: "Prescripción menor de 3 sesiones por semana" }); return; } const S = sesIn(p, addDays(x.mes, 1), x.c, "Realizada"); const D = S.filter(s => num(s.DuracionMin) != null); if(!D.length){ r.den.push(pv(p, S.length ? S.length + " sesiones sin duración registrada" : "sin sesiones en el mes")); r.sd.push(p); return; } conDur++; const m = D.reduce((a, s) => a + num(s.DuracionMin), 0) / D.length; r.den.push(pv(p, f1(m, 0) + " min (" + D.length + " ses.)")); if(m >= 240) r.num.push(pv(p, m)); });
   if(r.den.length && !conDur) r.ne = "El Dashboard registra la asistencia con una marca (1) por día; no trae la duración efectiva de la sesión. Tampoco registra las sesiones prescritas por semana.";
   return r; },
 dia_21_adul: x => { const r = { num: [], den: [], excl: [], sd: [] }; let nc = 0, ncNum = 0;
   per(x).forEach(p => { const t = p.TxEstado || "Sin evaluar"; if(["Disentimiento","Cuidados paliativos","No idóneo (contraindicación con soporte)"].includes(t)){ r.excl.push({ p, why: t }); return; }
     const raw = p.TxEtapaRaw || ""; const isNC = /NO CANDIDATO/i.test(raw); if(isNC) nc++;
     r.den.push(pv(p, t === "Sin evaluar" ? (raw ? "«" + raw + "» en el Dashboard, sin concepto de idoneidad con soporte" : "Sin evaluar") : t + (raw && raw !== t ? " («" + raw + "»)" : ""))); if(t === "Sin evaluar") r.sd.push(p); if(t === "En lista de espera" || t === "Trasplantado") r.num.push(pv(p, t)); });
   r.noComp = true;
   if(nc){ const d2 = r.den.length - nc; r.alt = "Si los " + nc + " marcados «No candidato» en el Dashboard se excluyeran (hoy no tienen soporte especializado registrado), el resultado sería " + r.num.length + " de " + d2 + " (" + (d2 ? pct(r.num.length / d2) : "—") + ")."; }
   return r; },
 dia_23_adul: x => { const r = { num: [], den: [], excl: [], sd: [] }; let inf = 0;
   per(x).forEach(p => { const m = p._mov.find(m => m.Tipo === "Abandono" && m.Fecha >= x.ps && m.Fecha <= x.c); const u = p._mov.find(m => m.Origen === "HDX" && m.Fecha >= addDays(x.ps, -1) && m.Fecha < x.c); if(u && !m){ inf++; r.sd.push(p); } r.den.push(pv(p, m ? "Abandono " + fd(m.Fecha) : u ? "Egreso sin causa registrada (último registro: " + mesTxt(ym(u.Fecha)) + ")" : "")); if(m) r.num.push(pv(p, m.Detalle || "")); });
   r.noComp = true;
   if(inf) r.prelim = inf + " egresos del periodo no tienen causa registrada (el maestro solo deja de listarlos). No se puede afirmar ni descartar abandono hasta clasificarlos: fallecimiento, traslado, trasplante, cambio de modalidad o abandono con desistimiento o búsqueda activa documentada.";
   return r; },
 dia_25_adul: x => { const r = { num: [], den: [], excl: [], sd: [] }; let con = 0;
   per(x).forEach(p => { const l = lastLab(p, "CVVHC", null, x.c); const tam = lastLab(p, "AntiVHC", null, x.c); if(l || tam) con++; r.den.push(pv(p, l ? "Carga viral " + l.Valor : (tam ? "Anti-VHC " + tam.Valor + ", sin carga viral" : "sin tamizaje registrado"))); if(!l && !tam) r.sd.push(p); if(l && /^detect/i.test(l.Valor)) r.num.push(pv(p, "Detectable")); });
   if(r.den.length && !con) r.ne = "La base no tiene anti-VHC ni carga viral de VHC de ningún paciente. El Dashboard no captura estas variables.";
   return r; },
 dia_26_adul: x => { const r = { num: [], den: [], excl: [], sd: [] };
   inc(x).forEach(p => { if(p.VHBNoRespondedor === "SI"){ r.excl.push({ p, why: "No respondedor (requiere soporte)" }); return; } const lim = addDays(p.InicioTRR, 30); const l = lastLab(p, "AntiHBs", null, lim); const any = lastLab(p, "AntiHBs", null, x.c); const v = l ? num(l.Valor) : null;
     r.den.push(pv(p, v != null ? f1(v, 1) + " mUI/mL · " + fd(l.FechaToma) + " · inicio " + fd(p.InicioTRR) : any ? "sin anti-HBs hasta 30 días después del inicio (" + fd(p.InicioTRR) + "); hay uno posterior: " + f1(num(any.Valor), 1) + " del " + fd(any.FechaToma) : "sin anti-HBs registrado · inicio " + fd(p.InicioTRR))); if(v == null) r.sd.push(p); else if(v >= 10) r.num.push(pv(p, v)); });
   return r; },
 dia_27_adul: x => { const r = { num: [], den: [], excl: [], sd: [] };
   base(x).forEach(p => { if(p.Paratiroidectomia === "SI"){ r.excl.push({ p, why: "Paratiroidectomía registrada" }); return; } const l = lastLab(p, "PTH", x.sem, x.c); const v = l ? num(l.Valor) : null; r.den.push(pv(p, v == null ? "sin dato en la ventana" : l.Valor + " · " + mesTxt(ym(l.FechaToma)))); if(v == null) r.sd.push(p); else if(v >= 130 && v <= 600) r.num.push(pv(p, v)); });
   return noWin(r, "PTH", x.sem, x.c); },
 dia_29_adul: x => { const r = { num: [], den: [], excl: [], sd: [] };
   base(x).forEach(p => { const L = labsIn(p, "Ca", x.tri, x.c).map(l => num(l.Valor)).filter(v => v != null); if(!L.length){ r.den.push(pv(p, "sin dato en la ventana")); r.sd.push(p); return; } const m = L.reduce((a, b) => a + b, 0) / L.length; r.den.push(pv(p, f1(m, 2) + " mg/dL (" + L.length + (L.length === 1 ? " medición" : " mediciones") + ")")); if(m > 10.5) r.num.push(pv(p, m)); });
   return noWin(r, "Ca", x.tri, x.c); },
 dia_31_adul: x => { const S = obsSegs(x, "novedades"); let ev = 0, days = 0; const list = [];
   per(x).forEach(p => { S.forEach(([a, b]) => { days += activeDays(p, a, b); }); p._nov.filter(n => n.Tipo === "Hospitalización" && n.Inicio >= x.ps && n.Inicio <= x.c && inSegs(n.Inicio, S)).forEach(n => { ev++; list.push(pv(p, fd(n.Inicio) + (n.Fin && n.Fin > n.Inicio ? " a " + fd(n.Fin) : "") + " · " + (n.Descripcion || ""))); }); });
   const meses = days / 30.4375; const r = { ev, exp: meses, val: meses ? ev / meses : null, list, expl: ev + " episodios / " + f1(meses, 1) + " meses-persona" + (meses ? " · equivale a " + f1(ev / meses * 12, 2) + " por persona-año (meses-persona ÷ 12)" : "") };
   const hx = HX.meta(); if(hx) r.prelim = "La fuente trae notas diarias de novedad, sin fecha de ingreso ni de egreso: los episodios se arman uniendo notas del mismo paciente separadas por " + (hx.gapHosp || 14) + " días o menos (regla institucional, no de la CAC) y no se puede verificar la estancia mayor de 24 horas. Exposición contada solo en los meses con registro de novedades: " + segTxt(S) + ".";
   return r; },
 dia_33_adul: x => { const B = ST.book; if((B.dsp || []).filter(live).length && typeof v6Its === "function") return v6Its(x, true);
   const S = obsSegs(x, "eventos"); let ev = 0, days = 0; const list = []; let sus = 0;
   per(x).forEach(p => { S.forEach(([a, b]) => { for(let d = new Date(a); d <= b; d = addDays(d, 1)){ if(activeAt(p, d) && isCVC(accessAt(p, d))) days++; } });
     p._evt.filter(e => e.Fecha >= x.ps && e.Fecha <= x.c && (e.Tipo === ITS || /sitio de salida|túnel/i.test(e.Tipo))).forEach(e => { const conf = e.Tipo === ITS && e.Hemocultivo === "Positivo"; if(conf) ev++; else sus++; list.push(pv(p, fd(e.Fecha) + " · " + e.Tipo + (conf ? " · confirmada" : " · sin confirmación microbiológica (no cuenta)"))); });
     p._nov.filter(n => n.Causa === "NOTA" && n.Inicio >= x.ps && n.Inicio <= x.c && /INFECC|BACTER/i.test(n.Descripcion || "")).forEach(n => { sus++; list.push(pv(p, fd(n.Inicio) + " · nota de novedad: " + n.Descripcion + " (sospecha, no cuenta)")); }); });
   const r = { ev, exp: days, val: null, list, expl: ev + " confirmadas · " + sus + " sospechas o infecciones locales · " + f1(days, 0) + " días-catéter estimados en los meses con registro de complicaciones" };
   r.ne = "La fuente no registra hemocultivos ni fechas de inserción y retiro de cada catéter. Sin eso no hay episodios confirmados que contar ni días-catéter exactos: un cero aquí no significa ausencia de infecciones. Los días-catéter mostrados son una estimación (pacientes con catéter por los días activos de " + segTxt(S) + ").";
   return r; },
 dia_34_adul: x => { const r = { num: [], den: [], excl: [], sd: [] }; let con = 0;
   inc(x).forEach(p => { const a = ageAt(p, p.InicioTRR); if(a != null && a >= 80){ r.excl.push({ p, why: "80 años o más al inicio" }); return; } const k = (p._accK || [])[0]; const first = k ? p._accH[k] : null; const lag = k ? Math.max(0, (pdate(k + "-01").getFullYear() - p.InicioTRR.getFullYear()) * 12 + pdate(k + "-01").getMonth() - p.InicioTRR.getMonth()) : null;
     if(p.AccesoInicial) con++; r.den.push(pv(p, p.AccesoInicial ? p.AccesoInicial : "acceso al inicio sin registrar" + (first ? " · primer acceso conocido: " + first + " (" + mesTxt(k) + (lag ? ", " + lag + " meses después del inicio" : ", mes del inicio") + ")" : ""))); if(!p.AccesoInicial) r.sd.push(p); else if(p.AccesoInicial === "FAV") r.num.push(pv(p, "FAV")); });
   if(r.den.length && !con) r.ne = "El Dashboard no registra el acceso con el que se inició la hemodiálisis (solo el acceso actual de cada mes), ni la madurez de la FAV. Además la ficha publicada describe igual el numerador y el denominador: la definición operativa debe validarse con la CAC antes de reportar.";
   return r; },
 dia_35_adul: x => { const r = { num: [], den: [], excl: [], sd: [] }; inc(x).forEach(p => { const l = lastLab(p, "EscalaCV", addDays(p.InicioTRR, -31), addDays(p.InicioTRR, 90)); r.den.push(pv(p, l ? (l.Metodo || "escala") + " " + fd(l.FechaToma) : "sin escala registrada")); if(l) r.num.push(pv(p, l.Valor)); else r.sd.push(p); }); if(r.den.length && !ST.book.lab.some(l => l.Examen === "EscalaCV" && live(l))) r.ne = "La base no tiene ninguna escala de calidad de vida registrada. El Dashboard no captura esta variable; no se puede distinguir «no evaluado» de «evaluado y no registrado»."; return r; },
 dia_36_adul: x => { const r = { num: [], den: [], excl: [], sd: [] }; per(x).forEach(p => { const l = lastLab(p, "EscalaCV", addDays(x.ps, -1), x.c); r.den.push(pv(p, l ? (l.Metodo || "escala") + " " + fd(l.FechaToma) : "sin escala registrada")); if(l) r.num.push(pv(p, l.Valor)); else r.sd.push(p); }); if(r.den.length && !ST.book.lab.some(l => l.Examen === "EscalaCV" && live(l))) r.ne = "La base no tiene ninguna escala de calidad de vida registrada. El Dashboard no captura esta variable; no se puede distinguir «no evaluado» de «evaluado y no registrado»."; return r; }
};
/* textos de ficha que cambian frente a la versión anterior */
const TXT = {
 dia_10_adul: { win: "Al cierre", src: "Acceso vascular del mes en el maestro del Dashboard (o el registrado en la aplicación)", ex: "Imposibilidad de FAV con concepto, negativa documentada o cuidados paliativos: solo si el soporte está registrado en Acceso vascular." },
 dia_11_adul: { n: "Adultos en HD con Kt/V ≥ 1,2", win: "Último Kt/V de los 3 meses previos al cierre", src: "Paraclínicos · Kt/V (el Dashboard no dice si es spKt/V, eKt/V o total)", nota: "El Dashboard trae un solo valor de Kt/V por mes sin tipo ni método. Se compara tal cual contra 1,2; no se convierte ni se suma función renal residual. La ventana de 3 meses es regla del módulo: la ficha resumida no fija cómo elegir entre varias mediciones." },
 dia_13_adul: { win: "Último valor del trimestre previo al cierre" }, dia_15_adul: { win: "Último valor del trimestre previo al cierre" }, dia_17_adul: { win: "Último valor del trimestre previo al cierre" },
 dia_20_adul: { n: "Adultos en HD con tiempo dialítico de 4 horas o más", win: "Promedio de las sesiones del último mes", src: "Sesiones realizadas con duración efectiva registrada" },
 dia_21_adul: { win: "Periodo", src: "Etapa de trasplante del maestro", nota: "Regla institucional D5: quien no tiene concepto de idoneidad con soporte permanece en el denominador. «No candidato» en el Dashboard no es soporte especializado." },
 dia_23_adul: { win: "Periodo", src: "Movimientos de egreso con causa" },
 dia_25_adul: { win: "Periodo", src: "Paraclínicos · carga viral de VHC" },
 dia_26_adul: { n: "Adultos que inician HD con anti-HBs ≥ 10 mUI/mL", win: "Incidentes del periodo", src: "Anti-HBs de la hoja de vacunación", ex: "No respondedores, solo con soporte documental.", nota: "Regla del módulo (la ficha resumida no la fija): se toma el último anti-HBs disponible hasta 30 días después del inicio de diálisis. La columna «No respondedor» del Dashboard se calcula solo con anti-HBs < 10 y aparece incluso en pacientes sin vacunar; por eso no se usa como exclusión." },
 dia_27_adul: { win: "Último valor de los 6 meses previos al cierre", ex: "Paratiroidectomía realizada o programada; tratamiento antineoplásico. Solo si está registrado." },
 dia_29_adul: { n: "Adultos en HD con hipercalcemia (calcio > 10,5 mg/dL)", win: "Promedio del trimestre previo al cierre, calcio total no corregido" },
 dia_31_adul: { n: "Hospitalizaciones por todas las causas en HD", unit: "por mes-persona", win: "Periodo · meses-persona de exposición", src: "Novedades de hospitalización" },
 dia_33_adul: { win: "Periodo · días-catéter", src: "Complicaciones con hemocultivo positivo · registro de catéteres" },
 dia_34_adul: { n: "Adultos que inician HD con FAV madura", win: "Incidentes del periodo menores de 80 años", src: "Acceso al inicio de HD", nota: "La ficha publicada describe numerador y denominador con el mismo texto. No reportar sin validar la definición con la CAC." },
 dia_35_adul: { n: "Incidentes evaluados con escala de calidad de vida", win: "Del inicio a 90 días", nota: "Indicador conjunto de HD y DP en la ficha. Aquí se muestra solo el subgrupo de HD, como análisis complementario." },
 dia_36_adul: { n: "Prevalentes evaluados con escala de calidad de vida", win: "Periodo", nota: "Indicador conjunto de HD y DP en la ficha. Aquí se muestra solo el subgrupo de HD, como análisis complementario." }
};
IND.forEach(d => { if(F[d.c]){ d.f = F[d.c]; Object.assign(d, TXT[d.c] || {}); } });
HX.CAC = () => IND.filter(d => !d.inst && F[d.c]);

/* ---------- evaluación: completitud y estados que no son «cumple / no cumple» ---------- */
const evalInd0 = evalInd;
evalInd = function(def, x){
  const r = evalInd0(def, x); if(def.inst || !F[def.c]) return r;
  const nsd = r.sd ? new Set(r.sd).size : 0;
  r.comp = def.t === "pct" && r.d && !r.noComp ? (r.d - nsd) / r.d : null;
  r.vCon = def.t === "pct" && r.d && nsd && (r.d - nsd) > 0 && !r.noComp && def.c !== "dia_25_adul" ? r.n / (r.d - nsd) : null;
  if(def.t === "pct" && r.d && !r.noComp && nsd === r.d && !r.ne) r.ne = "Ningún paciente del denominador tiene el dato a este corte.";
  if(def.t === "pct" && !r.d){ r.status = "nc"; r.val = null; }
  else if(r.ne){ r.status = "ne"; r.val = null; }
  else if(r.prelim) r.status = "pre";
  else if(r.comp != null && r.comp * 100 < HX.thr) r.status = "inc";
  return r;
};
Object.assign(STATUS_TXT, { ne: "No evaluable", pre: "Preliminar", inc: "Completitud insuficiente", nc: "No calculable" });
const fmtVal0 = fmtVal;
fmtVal = function(def, v){ if(v != null && def.c === "dia_31_adul") return f1(v, 3); return fmtVal0(def, v); };

/* Los datos de demostración del motor v3.0 (eventos SIIS y oxígeno ficticios) no se siembran sobre la base real */
HX.isReal = () => !!(ST.book && !ST.demo);
})();
const HX = window.HX;
return { esc, pad, iso, fd, ym, addDays, addMonths, monthStart, monthEnd, dayDiff, nowTs, pdate, num, norm, f1, pct, money, EPS_L, epsList, TURNOS_DEF, turnosCfg, turnoNames, DIAS_L, ESTADOS_SES, MOTIVOS, MOT_RESP, CAUSA_HOSP, ATRIB, MOT_EXTRA, ACCESOS, isCVC, ITS, EVENTOS, SEV, RESUELTO, HEMOC, NOV_TIPOS, MOV_EGRESO, MOV_TIPOS, EGRESO_ESTADO, RUTA, RUTA_EXCL, ACC_NOV, ACC_NOV_RES, TX, PROCED, MEDIOS, RESULT_CTC, DISCIPLINAS, EXAMS, EX, FREQ_TXT, ANCHOR_DEF, META_DEF, CFG_DEF, MUN_DANE, AEE, SH, BOOK_KEYS, DATE_F, NUM_F, cacStart, newBook, readSheet, fromRow, isToolBook, isDashboard, parseToolBook, live, IDX, reindex, ensureIdx, nombre, activeAt, activeDays, overlaps, ageAt, adult, ninety, epsOk, turnoDias, absentOn, progDays, sesIn, lastLab, labsIn, accessAt, lastSes, pacs, popCut, popPer, popInc, ctxFor, gidStats, taStats, glucoStats, ktvOnline, fmtTA, parseTA, ktvDaugirdas, metasDe, ufCalc, sesUF, pv, propLab, IND, INDM, progUpTo, catDays, evalInd, statusOf, STATUS_TXT, fmtVal, trendPoints, semaforo, alertas, calidad, tarifaFor, conciliar, freqOf, schedMonths, susceptibleVHB, examApplies, examsForMonth, labDue, SOL_EST, solRecs, solPropuesta, CAL_DOM, CAL_OPC, calidadAuto, calidadScore, CAL_CLASS, ultimaValoracion, calidadDe, EST_TIPOS, EST_NOM, estRelevantes, estVencidos, vacEsquemas, vacMeses, vacDoses, labTxt, vacStatus, VAC_GRUPOS, vacGrupo, vacNextDefaults, vacEtiqueta, TX_EST, txItems, txState, TX_EN_PROCESO, tenerPresente, lv, hdOn, DSP_TIPOS, DSP_SITIOS, DSP_RETIRO, DSP_LUGAR, dspAll, dspOf, dspCVC, dspFind, dspOpen, cdMet, dspCovers, hospOn, cdCalc, dspPropuestas, MIC_MUESTRAS, MIC_SANGRE, MIC_EST, MIC_RES, MIC_FEN, MIC_FEN_ALERTA, micAll, micOfEp, micOfPac, micPos, micAB, itsConf, v6Its, v6Calidad, CAC_H_FOMAG, CAC_H_ERC, CAC_SHEET_FOMAG, CAC_SHEET_ERC, D1800, D1845, D1811, isoOr, cacVals, ST, PX, TODAY, HDX, HX };
}
