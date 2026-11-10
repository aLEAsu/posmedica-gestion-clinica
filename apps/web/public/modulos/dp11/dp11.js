// Código propio del proyecto. Diálisis peritoneal v1.1 (punto de partida: prototipo v3.2 de la coordinación médica).

"use strict";
/* =====================================================================
   Módulo de Diálisis Peritoneal · UNO-P · v1.0
   Archivo único. Sin servidor. Estado en localStorage + copias .json / .xlsx
   ===================================================================== */
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pad=n=>String(n).padStart(2,"0");
const norm=s=>String(s==null?"":s).normalize("NFD").replace(/[̀-ͯ]/g,"").toUpperCase().replace(/\s+/g," ").trim();
const num=v=>{if(v==null||v==="")return null;if(typeof v==="number")return isFinite(v)?v:null;const s=String(v).replace(",",".").replace(/[^\d.\-]/g,"");const n=parseFloat(s);return isFinite(n)?n:null;};
const f1=(v,d)=>v==null||isNaN(v)?"—":Number(v).toLocaleString("es-CO",{minimumFractionDigits:d==null?1:d,maximumFractionDigits:d==null?1:d});
const pct=(v,d)=>v==null||isNaN(v)?"—":f1(v*100,d==null?1:d)+" %";
const money=v=>v==null||isNaN(v)?"—":"$ "+Math.round(v).toLocaleString("es-CO");
const uid=p=>p+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const MESES=["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const MES3=["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
const ymLabel=ym=>{if(!ym)return"sin fecha";const[y,m]=ym.split("-");return MES3[+m-1]+"-"+y;};
const pdate=s=>{if(!s)return null;const m=/^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(s);return m?new Date(+m[1],+m[2]-1,m[3]?+m[3]:1):null;};
const iso=d=>d?d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate()):"";
const fd=s=>{const d=pdate(s);return d?pad(d.getDate())+"/"+pad(d.getMonth()+1)+"/"+d.getFullYear():"—";};
const addMonths=(d,m)=>new Date(d.getFullYear(),d.getMonth()+m,Math.min(d.getDate(),28));
const monthEnd=d=>new Date(d.getFullYear(),d.getMonth()+1,0);
const dayDiff=(a,b)=>Math.round((b-a)/864e5);
const ICON={
 home:'<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
 shield:'<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
 file:'<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M8 13h8M8 17h6"/>',
 users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c1.8.8 3 2.6 3.5 5.2"/>',
 cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
 alert:'<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>',
 pill:'<rect x="3" y="9" width="18" height="7" rx="3.5" transform="rotate(-35 12 12.5)"/><path d="M9.5 7.5l5 8"/>',
 chart:'<path d="M4 20V4M4 20h16"/><path d="M8 16l4-5 3 3 5-7"/>',
 calc:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h2M12 12h2M16 12h0M8 16h2M12 16h2M16 16h0"/>',
 homev:'<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 15l2 2 3-4"/>',
 gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.3 17l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.3l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1A2 2 0 1 1 19.7 7l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
 ok:'<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
 x:'<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
 warn:'<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
 flask:'<path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3"/><path d="M7 15h10"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 trash:'<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
 back:'<path d="M15 5l-7 7 7 7"/>'
};
const ico=(k,cls)=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"'+(cls?' class="'+cls+'"':'')+'>'+(ICON[k]||"")+'</svg>';
const STI={ok:"ok",bad:"x",warn:"warn",info:"info",base:"info"};
const pill=(t,cls,icon)=>'<span class="pill '+(cls||"base")+'">'+(icon!==false&&STI[cls]?ico(STI[cls]):"")+esc(t)+'</span>';

/* ============================ EPS / contratos ============================ */
const EPS_L=["NUEVA EPS","MALLAMAS","FOMAG"];
const EPS_INFO={
 "NUEVA EPS":{
  doc:"Ficha técnica de servicios y tarifas para atención renal · Paquete de diálisis peritoneal (Anexo técnico DP 2024)",
  modalidad:"Paquete mensual",
  codigos:[["C40109","DP manual (DPCA)",4500000],["C40110","DP automatizada (DPA)",4500000]],
  vigIni:"",vigFin:"",vigTexto:"El anexo cargado no trae fechas de vigencia. Confirmar contrato marco vigente.",
  firmas:"Nueva EPS en intervención (representante legal) · IPS (representante legal)",
  reglas:[
   "Ingreso programado con TFG < 15 mL/min (Cockcroft-Gault) desde prediálisis propia o nefrología de la IPS primaria. Solicitud a la enfermera de Programas Especiales con HC de nefrología de los últimos 30 días.",
   "TFG ≥ 15 mL/min: solicitud a dialisis@nuevaeps.com.co con justificación. No se tramita por zonales.",
   "Promesa de autorización: 5 días calendario (8 días en los primeros 3 días del mes). No hay autorizaciones retroactivas.",
   "Cargue de C40109 / C40110 en el link: hasta el último día calendario del mes.",
   "Cambio de modalidad (p. ej. DP → HD): no se cambia la autorización en el mismo mes; se ajusta el mes siguiente. Se genera una única autorización por el paquete de mayor valor.",
   "Muerte del paciente: se factura paquete completo.",
   "Traslado temporal o definitivo a ciudad sin sede: avisar con 30 días de antelación, con carta firmada, HC de 30 días y perfil infeccioso ≤ 6 meses.",
   "Paciente DP hospitalizado: el gestor pide al usuario llevar líquidos e insumos para continuar la terapia, salvo contraindicación.",
   "La IPS asume los traslados a otro nivel de complejidad por complicaciones durante la terapia dialítica.",
   "KRU (aclaramiento residual de urea) cuando la diuresis es > 100 mL/día: cada 6 meses en antiguos (≥ 1 año en terapia) y cada 4 meses en nuevos. Con diuresis < 100 mL/día, justificar en HC la no medición.",
   "Abandono sin soporte de seguimiento multidisciplinario en HC no tiene validez. Alta voluntaria requiere documento firmado por paciente o familiar.",
   "Pretrasplante: lista de chequeo (Anexo 3) y presentación a pretrasplante@nuevaeps.com.co; MIPRES ATT001 para transporte de la primera valoración."
  ],
  excluye:"El anexo no trae una lista de exclusiones como tal. Incluye la terapia dialítica del paciente crónico hospitalizado (UCI/piso) con códigos 399501, S22220, C40111."
 },
 "MALLAMAS":{
  doc:"Otrosí 20258600120439-21047 al contrato 20258600120439 · EPS Indígena Mallamas (modalidad evento, plan de servicios)",
  modalidad:"Plan de servicios mensual por paciente (contrato por evento)",
  codigos:[["549801","Plan de servicios DP manual y/o automatizada",4888000]],
  vigIni:"2025-07-01",vigFin:"2025-12-31",vigTexto:"Otrosí con vigencia 01/07/2025 a 31/12/2025.",
  firmas:"Mallamas (representante legal) · IPS (representante legal). Firmado en Ipiales el 01/07/2025",
  reglas:[
   "Se factura proporcional a los días atendidos durante el mes.",
   "Parágrafo primero: en auditoría se verifican las actividades y cantidades del plan; lo no realizado se glosa y se descuenta del valor del plan.",
   "Los laboratorios, ayudas diagnósticas o procedimientos no incluidos que formule el equipo multidisciplinario quedan excluidos del plan.",
   "Población: 70.392 afiliados del régimen subsidiado (Putumayo y Huila) asignados a la sede, activos en BDUA."
  ],
  excluye:"Manejo intrahospitalario de complicaciones · TAC y RMN · radiología intervencionista del acceso (fistulografías, arteriografías, venografías, cavografías, angioplastias, stent) · laboratorios, ayudas diagnósticas y procedimientos no listados · demás servicios no incluidos."
 },
 "FOMAG":{
  doc:"Anexo tarifario evento + paquetes FOMAG (archivo POSMEDICA GROUP SAS - NIT 900949604nac, hoja PAQUETES)",
  modalidad:"Paquete mensual",
  codigos:[["549801","DP manual",5180000],["549802","DP automatizada",5180000]],
  vigIni:"",vigFin:"",vigTexto:"El anexo no trae vigencia. Contrato nuevo en revisión del acta precontractual (oct-2026).",
  firmas:"Anexo de cotización/negociación (representante legal)",
  reglas:[
   "El paquete se interrumpe por hospitalización del paciente y cuando el paciente cambia de programa dentro del mismo mes.",
   "Servicios por evento del anexo: UVB 2026 − 3 % (el archivo no trae el valor en pesos).",
   "Los laboratorios, ayudas diagnósticas o procedimientos no incluidos que formule el equipo multidisciplinario quedan excluidos del paquete."
  ],
  excluye:"Manejo intrahospitalario de complicaciones · TAC y RMN · realización de FAV · radiología intervencionista del acceso · traslado en ambulancia básica o medicalizada (urbano y rural) por complicaciones · laboratorios, ayudas diagnósticas y procedimientos no listados · demás servicios no incluidos."
 }
};
/* Matriz curada de conceptos críticos para DP. S = explícito en el paquete, E = por evento (fuera del paquete), N = no aparece en los documentos cargados, Q = ambiguo/contradictorio */
const BRECHAS=[
 ["Insumos y tecnología DP","Líquidos / soluciones de DP",["S","N","N"],"Nueva EPS los incluye de forma expresa (MD000106, MD003896). En Mallamas y FOMAG el plan es «integral» pero no los nombra: dejarlo explícito en la negociación."],
 ["Insumos y tecnología DP","Suministros de la cicladora (cassette, líneas, bolsa de drenaje)",["S","N","N"],"Solo Nueva EPS lo nombra."],
 ["Insumos y tecnología DP","Implante, cambio y retiro de catéter peritoneal",["S","N","N"],"Nueva EPS: 549001, 549013 incluidos. En los otros dos no aparece: definir si se cobra por evento o quién lo asume."],
 ["Insumos y tecnología DP","Entrenamiento del paciente en DP",["S","N","N"],"Nueva EPS: M39140."],
 ["Servicios profesionales","Nefrología mensual",["S","S","S"],"890239 en los tres."],
 ["Servicios profesionales","Nutrición",["S","S","S"],"Nueva EPS: al ingreso y mínimo 4/año. Mallamas y FOMAG: trimestral."],
 ["Servicios profesionales","Psicología",["S","S","S"],"Nueva EPS: al ingreso y mínimo 4/año. Mallamas y FOMAG: trimestral."],
 ["Servicios profesionales","Trabajo social",["N","N","E"],"Ningún paquete lo incluye. El control interno lo programa trimestral: es costo no reconocido salvo FOMAG por evento (890209)."],
 ["Adecuación y función residual","Kt/V (BUN en líquido dializado)",["S","N","S"],"Nueva EPS trimestral; FOMAG trimestral (903856 en líquido peritoneal). Mallamas solo trae BUN al ingreso: el Kt/V que exige la CAC no queda cubierto."],
 ["Adecuación y función residual","Orina de 24 h / función renal residual (KRU)",["S","N","S"],"Nueva EPS: mínimo anual (y exige KRU c/4–6 meses si diuresis > 100 mL/d). FOMAG: NU en orina 24 h semestral. Mallamas: no aparece."],
 ["Adecuación y función residual","Test de equilibrio peritoneal (PET)",["S","N","N"],"Nueva EPS: semestral, junto con el cálculo de Kt/V."],
 ["Peritonitis","Citoquímico de líquido peritoneal",["Q","N","E"],"FOMAG: 903851 por evento. Nueva EPS lo cubriría dentro del «manejo ambulatorio de peritonitis», sin código explícito."],
 ["Peritonitis","Gram y cultivo de líquido peritoneal",["N","N","N"],"No aparece en ningún documento cargado (FOMAG solo trae por evento antibiograma, hemocultivo y urocultivo). ISPD 2022 exige cultivo del efluente para diagnóstico: resolver con laboratorio y EPS."],
 ["Peritonitis","Cefazolina",["S","S","S"],""],
 ["Peritonitis","Ceftazidima",["N","S","S"],"Nueva EPS no la trae; la cobertura Gram negativa quedaría con aminoglucósido (amikacina o gentamicina)."],
 ["Peritonitis","Amikacina",["S","S","S"],""],
 ["Peritonitis","Gentamicina",["S","N","N"],"Nueva EPS: presentación inyectable."],
 ["Peritonitis","Vancomicina",["S","S","S"],""],
 ["Peritonitis","Fluconazol (profilaxis antifúngica secundaria, ISPD 2022)",["N","S","S"],"Nueva EPS solo trae nistatina."],
 ["Orificio de salida","Mupirocina 2 % (antibiótico tópico del orificio)",["N","N","N"],"No está en ningún paquete, pero la fórmula actual entrega 1 tubo por paciente al mes: costo que absorbe la IPS."],
 ["Anemia","Eritropoyetina",["S","S","S"],"Nueva EPS 1.000/2.000/4.000 UI; Mallamas y FOMAG 2.000/4.000 UI."],
 ["Anemia","Hierro parenteral",["S","S","S"],""],
 ["Anemia","Ácido fólico 1 mg",["S","S","S"],""],
 ["Anemia","Complejo B",["N","S","S"],""],
 ["Metabolismo mineral","Calcitriol",["S","S","S"],""],
 ["Metabolismo mineral","Paricalcitol",["S","N","N"],""],
 ["Metabolismo mineral","Sevelamer",["Q","N","N"],"El texto de Nueva EPS dice «incluye sevelamer y paricalcitol», pero el listado de medicamentos no trae sevelamer con código MD."],
 ["Metabolismo mineral","Carbonato de calcio",["S","S","S"],""],
 ["Metabolismo mineral","PTH",["Q","Q","S"],"Nueva EPS y Mallamas: semestral, con la nota contradictoria «frecuencia trimestral en estadio 5». FOMAG: trimestral."],
 ["Nutrición","Suplemento nutricional oral",["S","N","N"],"Coincide con la cohorte: los pacientes con Nepro son de Nueva EPS."],
 ["Laboratorio de rutina","Hemograma mensual",["S","S","S"],""],
 ["Laboratorio de rutina","Albúmina",["S","S","S"],"Nueva EPS trimestral; Mallamas trimestral vía 903861 (albúmina-globulina); FOMAG trimestral."],
 ["Laboratorio de rutina","BUN sérico mensual",["S","N","S"],"Mallamas: solo al ingreso."],
 ["Laboratorio de rutina","Electrocardiograma anual",["S","N","N"],""],
 ["Laboratorio de rutina","Radiografía de abdomen",["S","S","S"],"Por pertinencia (malposición del catéter)."],
 ["Prevención","Vacuna hepatitis B",["S","S","S"],""],
 ["Riesgos","Hospitalización y complicaciones intrahospitalarias",["N","N","N"],"Excluidas en los tres. Nueva EPS sí incluye la terapia dialítica del crónico hospitalizado."],
 ["Riesgos","Traslado por complicaciones",["S","N","N"],"Nueva EPS: a cargo de la IPS. FOMAG: excluido expresamente. Mallamas: no lo menciona en DP."]
];
const OBLIG=[
 ["NUEVA EPS","Reporte de información confiable y oportuno (Res. 2463 de 2014; Ley 1438 de 2011, art. 114): condiciona el pago."],
 ["NUEVA EPS","Notificar cierre parcial o total de sede con 2 meses de antelación (inmediato a dialisis@nuevaeps.com.co si es repentino)."],
 ["NUEVA EPS","Asistencia presencial a las reuniones definidas por la EPS."],
 ["NUEVA EPS","Cargue mensual de atenciones y soportes clínicos en la plataforma y estructura de la EPS."],
 ["NUEVA EPS","Solicitud mensual de autorizaciones (masivas) y cargue en link antes del último día calendario."],
 ["NUEVA EPS","Registro de volumen urinario en HC y KRU según diuresis (instructivo CAC)."],
 ["NUEVA EPS","Justificación en HC del inicio de TRR con TFG > 15 mL/min y de KRU por encima del punto de corte CAC."],
 ["NUEVA EPS","Soporte de abandono (seguimiento multidisciplinario) y de alta voluntaria (firma)."],
 ["NUEVA EPS","Reporte de recuperación de función renal a la EPS."],
 ["NUEVA EPS","Comités de evaluación de trasplante; lista de chequeo pretrasplante (Anexo 3)."],
 ["MALLAMAS","Prestar la totalidad de actividades y cantidades del plan: lo no realizado se glosa."],
 ["MALLAMAS","Renovar el otrosí: vigencia terminó el 31/12/2025."],
 ["FOMAG","Definir con FOMAG metas de ANS (peritonitis, hemoglobina, albúmina) frente al referente CAC 2026."],
 ["FOMAG","Reporte mensual de indicadores (Res. 256 de 2016, RIAS, CAC/SISCAC) y auditorías trimestrales con actas y planes de mejora."]
];
const SINON={EPO:"ERITROPOYETINA",ERITRO:"ERITROPOYETINA",DIANEAL:"DIALISIS PERITONEAL",LIQUIDO:"DIALISIS PERITONEAL",BOLSA:"DIALISIS PERITONEAL",KTV:"LIQUIDO PERITONEAL",CICLADORA:"MAQUINAS",CASSETTE:"MAQUINAS",HIERRO:"HIERRO",NEPRO:"NUTRICION",SUPLEMENTO:"NUTRICION",PTH:"PTH",VITAMINA:"VITAMINA",CATETER:"CATETER",TENCKHOFF:"CATETER"};

/* ============================ Habilitación ============================ */
/* origen: L = texto según compendio de información documentada obligatoria (ConsultorSalud, fuente secundaria de la Res. 3100/2019 · cotejar con el manual);
           V = redacción operativa del criterio · verificar literal contra el Manual (num. 11.3.17 Servicio de diálisis y criterios para todos los servicios);
           B = buena práctica / contrato (no es requisito de habilitación) */
const HAB_STD=["Talento humano","Infraestructura","Dotación","Medicamentos, dispositivos médicos e insumos","Procesos prioritarios","Historia clínica y registros","Interdependencia"];
const HAB_SEED=[
 ["Talento humano","V","Médico especialista en nefrología responsable del servicio, con título y registro en ReTHUS verificables."],
 ["Talento humano","V","Profesional de enfermería del programa de DP con certificado de formación en diálisis peritoneal."],
 ["Talento humano","V","Soportes de hoja de vida de todo el personal: título, convalidación si aplica, ReTHUS y certificados de formación vigentes."],
 ["Talento humano","B","Nutrición, psicología y trabajo social disponibles para el programa según modelo de atención (GAH-MO-001) y contratos."],
 ["Talento humano","B","Plan de capacitación y evaluación anual de competencias en técnica de DP, prevención de infecciones y manejo de peritonitis."],
 ["Talento humano","B","Línea de contacto para urgencias del paciente en DP fuera del horario (responsable y cuadro de disponibilidad)."],
 ["Infraestructura","V","Ambiente para entrenamiento de pacientes y cuidadores en DP, con lavamanos y privacidad."],
 ["Infraestructura","V","Consultorio para valoración médica y de enfermería del paciente en DP."],
 ["Infraestructura","V","Área de almacenamiento de soluciones e insumos: protegida de humedad y temperatura extrema, sobre estibas, con control de inventario."],
 ["Infraestructura","V","Condiciones generales de pisos, paredes, iluminación, ventilación y unidades sanitarias (criterios para todos los servicios)."],
 ["Infraestructura","V","Manejo de residuos según PGIRASA, incluido el efluente y las bolsas de drenaje."],
 ["Dotación","V","Cicladoras con registro sanitario INVIMA, hoja de vida y programa de mantenimiento preventivo/correctivo (propias o en comodato)."],
 ["Dotación","V","Báscula, tallímetro, tensiómetro y termómetro con soporte de calibración/metrología."],
 ["Dotación","V","Inventario de equipos biomédicos del servicio y cronograma de mantenimiento ejecutado."],
 ["Dotación","B","Material didáctico para entrenamiento (simulación de recambio, cuidado de orificio)."],
 ["Medicamentos, dispositivos médicos e insumos","V","Soluciones de DP, líneas de transferencia, cassettes y minicaps con registro sanitario INVIMA vigente."],
 ["Medicamentos, dispositivos médicos e insumos","V","Programas de farmacovigilancia y tecnovigilancia operando, con reporte de eventos."],
 ["Medicamentos, dispositivos médicos e insumos","V","Control de fechas de vencimiento, semaforización y registro de temperatura/humedad del almacenamiento."],
 ["Medicamentos, dispositivos médicos e insumos","V","Cadena de frío para eritropoyetina (2–8 °C) en sede y educación documentada al paciente para el domicilio."],
 ["Medicamentos, dispositivos médicos e insumos","B","Trazabilidad de la entrega domiciliaria: producto, lote, vencimiento, cantidad y firma de recibido."],
 ["Medicamentos, dispositivos médicos e insumos","B","Antibióticos para manejo de peritonitis disponibles según GAG-GU-003 (revisados por Farmacia)."],
 ["Procesos prioritarios","L","Manejo de la injuria renal aguda."],
 ["Procesos prioritarios","L","Bioseguridad en unidad renal."],
 ["Procesos prioritarios","L","Manejo de la anemia en la enfermedad renal crónica."],
 ["Procesos prioritarios","L","Manejo de la osteodistrofia renal."],
 ["Procesos prioritarios","L","Manejo de la nefropatía lúpica."],
 ["Procesos prioritarios","L","Manejo de nefropatía diabética."],
 ["Procesos prioritarios","L","Manejo de hipertensión arterial."],
 ["Procesos prioritarios","L","DP · Formulación de diálisis peritoneal según cinética de la urea."],
 ["Procesos prioritarios","L","DP · Test de equilibrio peritoneal."],
 ["Procesos prioritarios","L","DP · Implante de catéter peritoneal."],
 ["Procesos prioritarios","L","DP · Tratamiento de infección del orificio y túnel del catéter peritoneal."],
 ["Procesos prioritarios","L","DP · Tratamiento de peritonitis en diálisis peritoneal."],
 ["Procesos prioritarios","L","DP · Criterios de ingreso del paciente a la diálisis peritoneal."],
 ["Procesos prioritarios","V","Programa de seguridad del paciente con reporte y análisis de eventos adversos (aplica a todos los servicios)."],
 ["Procesos prioritarios","V","Consentimiento informado específico para DP."],
 ["Procesos prioritarios","V","Limpieza y desinfección de áreas y equipos."],
 ["Procesos prioritarios","B","Programa de entrenamiento y reentrenamiento del paciente/cuidador (incluye reentrenamiento tras peritonitis)."],
 ["Procesos prioritarios","B","Protocolo de visita domiciliaria (condiciones de la vivienda, almacenamiento, técnica, inventario)."],
 ["Procesos prioritarios","B","Referencia y contrarreferencia del paciente en DP (urgencias, hospitalización, cirugía)."],
 ["Historia clínica y registros","V","Historia clínica única con prescripción de DP, Kt/V, PET, entrenamiento, visitas y eventos."],
 ["Historia clínica y registros","V","Custodia, confidencialidad y conservación de la HC (Res. 1995 de 1999)."],
 ["Historia clínica y registros","V","Consentimiento informado firmado y archivado en HC."],
 ["Historia clínica y registros","B","Registro de diuresis de 24 h y KRU (exigencia Nueva EPS / instructivo CAC)."],
 ["Historia clínica y registros","B","Registro de cada peritonitis con citoquímico, cultivo, germen, tratamiento y desenlace (ISPD 2022, CAC dia_19)."],
 ["Historia clínica y registros","B","Registro de entrega de insumos y del inventario domiciliario."],
 ["Interdependencia","V","Laboratorio clínico, incluida microbiología para Gram y cultivo de efluente."],
 ["Interdependencia","V","Servicio farmacéutico."],
 ["Interdependencia","V","Cirugía para implante y retiro de catéter peritoneal (propia o contratada, con acuerdo formal)."],
 ["Interdependencia","V","Hemodiálisis de respaldo ante falla de la técnica."],
 ["Interdependencia","V","Hospitalización y UCI en la red (acuerdo de referencia)."],
 ["Interdependencia","V","Imágenes diagnósticas (radiografía de abdomen)."],
 ["Interdependencia","V","Transporte asistencial."]
];
/* evidencia prellenada solo con documentos que existen en el proyecto; estado queda "Por verificar" */
const HAB_PREFILL={
 "DP · Formulación de diálisis peritoneal según cinética de la urea.":{doc:"Guía para la adecuación de diálisis peritoneal y criterios de ingreso",cod:"GAG-GU-002",ver:"02"},
 "DP · Criterios de ingreso del paciente a la diálisis peritoneal.":{doc:"Guía para la adecuación de diálisis peritoneal y criterios de ingreso",cod:"GAG-GU-002",ver:"02"},
 "DP · Tratamiento de peritonitis en diálisis peritoneal.":{doc:"Guía para el manejo de la peritonitis en diálisis peritoneal",cod:"GAG-GU-003",ver:"01"},
 "Antibióticos para manejo de peritonitis disponibles según GAG-GU-003 (revisados por Farmacia).":{doc:"Guía para el manejo de la peritonitis en DP (tabla de antibióticos pendiente de firma de Farmacia, num. 20.3)",cod:"GAG-GU-003",ver:"01"},
 "Programa de seguridad del paciente con reporte y análisis de eventos adversos (aplica a todos los servicios).":{doc:"Programa institucional de seguridad del paciente",cod:"UNO-P-SP-001",ver:""},
 "Nutrición, psicología y trabajo social disponibles para el programa según modelo de atención (GAH-MO-001) y contratos.":{doc:"Modelo de atención renal",cod:"GAH-MO-001",ver:""}
};

/* ============================ Clínica ============================ */
const EXAMS=[
 {k:"Hb",l:"Hemoglobina",u:"g/dL",lo:3,hi:20},{k:"BUN",l:"BUN sérico",u:"mg/dL",lo:3,hi:250},{k:"Creat",l:"Creatinina",u:"mg/dL",lo:.3,hi:30},
 {k:"K",l:"Potasio",u:"mEq/L",lo:1.5,hi:9},{k:"Na",l:"Sodio",u:"mEq/L",lo:110,hi:170},{k:"Ca",l:"Calcio total (no corregido)",u:"mg/dL",lo:4,hi:16},{k:"P",l:"Fósforo",u:"mg/dL",lo:.5,hi:15},
 {k:"Alb",l:"Albúmina",u:"g/dL",lo:1,hi:6},{k:"PTH",l:"PTH",u:"pg/mL",lo:1,hi:5000},{k:"FA",l:"Fosfatasa alcalina",u:"U/L",lo:10,hi:3000},
 {k:"Ferritina",l:"Ferritina",u:"ng/mL",lo:1,hi:5000},{k:"TSAT",l:"Saturación de transferrina",u:"%",lo:1,hi:100},{k:"Glic",l:"Glicemia",u:"mg/dL",lo:20,hi:800},{k:"HbA1c",l:"HbA1c",u:"%",lo:3,hi:20},
 {k:"ColT",l:"Colesterol total",u:"mg/dL",lo:40,hi:600},{k:"LDL",l:"LDL",u:"mg/dL",lo:5,hi:500},{k:"TG",l:"Triglicéridos",u:"mg/dL",lo:10,hi:3000},
 {k:"HBsAg",l:"HBsAg",txt:["No reactivo","Reactivo"]},{k:"AntiHBs",l:"Anti-HBs",u:"mUI/mL",lo:0,hi:100000},{k:"AntiVHC",l:"Anti-VHC",txt:["No reactivo","Reactivo"]},{k:"VIH",l:"VIH",txt:["No reactivo","Reactivo"]},{k:"VDRL",l:"VDRL",txt:["No reactivo","Reactivo"]},
 {k:"Diuresis",l:"Diuresis de 24 h",u:"mL",lo:0,hi:5000},{k:"Peso",l:"Peso",u:"kg",lo:25,hi:200},{k:"TAS",l:"TA sistólica",u:"mmHg",lo:60,hi:260}
];
const EX=Object.fromEntries(EXAMS.map(e=>[e.k,e]));
/* frecuencia contractual por EPS: M mensual, T trimestral, S semestral, A anual, I ingreso, "" no incluido / por pertinencia */
const LABFREQ={
 Hb:{"NUEVA EPS":"M",MALLAMAS:"M",FOMAG:"M"},BUN:{"NUEVA EPS":"M",MALLAMAS:"I",FOMAG:"M"},Creat:{"NUEVA EPS":"M",MALLAMAS:"M",FOMAG:"S"},K:{"NUEVA EPS":"M",MALLAMAS:"M",FOMAG:"M"},
 Ca:{"NUEVA EPS":"M",MALLAMAS:"M",FOMAG:"M"},P:{"NUEVA EPS":"M",MALLAMAS:"M",FOMAG:"M"},Na:{"NUEVA EPS":"I",MALLAMAS:"I",FOMAG:"S"},Glic:{"NUEVA EPS":"M*",MALLAMAS:"M*",FOMAG:"M*"},
 Alb:{"NUEVA EPS":"T",MALLAMAS:"T",FOMAG:"T"},HbA1c:{"NUEVA EPS":"T*",MALLAMAS:"T*",FOMAG:"T*"},PTH:{"NUEVA EPS":"S",MALLAMAS:"S",FOMAG:"T"},
 Ferritina:{"NUEVA EPS":"S",MALLAMAS:"S",FOMAG:"S"},TSAT:{"NUEVA EPS":"I",MALLAMAS:"I",FOMAG:"S"},HBsAg:{"NUEVA EPS":"S",MALLAMAS:"S",FOMAG:"I"},AntiHBs:{"NUEVA EPS":"S",MALLAMAS:"S",FOMAG:"A"},
 AntiVHC:{"NUEVA EPS":"S",MALLAMAS:"S",FOMAG:"A"},VIH:{"NUEVA EPS":"S",MALLAMAS:"S",FOMAG:"A"},VDRL:{"NUEVA EPS":"",MALLAMAS:"S",FOMAG:"A"},
 ColT:{"NUEVA EPS":"S",MALLAMAS:"S",FOMAG:"S"},TG:{"NUEVA EPS":"S",MALLAMAS:"S",FOMAG:"S"},
 KtV:{"NUEVA EPS":"T",MALLAMAS:"",FOMAG:"T"},PET:{"NUEVA EPS":"S",MALLAMAS:"",FOMAG:""},Orina24:{"NUEVA EPS":"A",MALLAMAS:"",FOMAG:"S"}
};
const FREQ_TXT={M:"Mensual","M*":"Mensual en diabéticos (semestral en no diabéticos)",T:"Trimestral","T*":"Trimestral en diabéticos",S:"Semestral",A:"Anual",I:"Solo al ingreso","":"No incluido"};
const EVT_TIPOS=["Peritonitis","Infección del orificio de salida","Infección del túnel","Hospitalización","Disfunción o malposición del catéter","Fuga pericatéter","Hernia","Falla de ultrafiltración","Desconexión accidental / contaminación","Cambio de línea de transferencia","Implante de catéter","Retiro o recambio de catéter","Otro"];
const GERMEN_GRUPOS=["Gram positivo","Gram negativo","Hongo","Polimicrobiano","Micobacteria","Cultivo negativo","No tomado / pendiente"];
const DESENLACES=["En tratamiento","Resuelto","Refractaria con retiro de catéter","Transferencia a hemodiálisis","Fallecimiento","Otro"];
const DISCIPLINAS=["Nefrología","Enfermería","Nutrición","Psicología","Trabajo social","Medicina general","Calidad de vida (escala validada)"];
const VISITA_TIPOS=["Visita domiciliaria inicial","Visita domiciliaria de seguimiento","Entrenamiento inicial","Reentrenamiento","Llamada de seguimiento"];
const VISITA_ITEMS=["Agua potable disponible","Espacio limpio y exclusivo para el recambio","Almacenamiento de insumos adecuado (seco, sobre estiba, sin sol directo)","Lavado de manos correcto","Técnica de conexión/desconexión correcta","Cuidado del orificio de salida correcto","Registro diario de balances / cicladora","Reconoce signos de peritonitis y sabe a quién llamar","Inventario domiciliario verificado","Cadena de frío de EPO en el domicilio"];
const TX_EST=["Sin evaluar","Idóneo, en estudio","En lista de espera","No idóneo (contraindicación documentada)","Disentimiento","Cuidados paliativos","Trasplantado"];
const ESTADOS=["Activo","Cambio a HD","Trasplantado","Fallecido","Abandono","Traslado a otra unidad","Recuperación de función","Otro egreso"];
const META_DEF={ktv:1.7,hb:10,alb:3.5,pLo:2.5,pHi:6,ca:10.5,pthLo:130,pthHi:600,kLo:3.5,perit:0.4,ktvVentana:6,visitaMeses:6,qolMeses:12,reservaDias:0,anchorT:[1,4,7,10],anchorS:[4,10],anchorA:[4]};

const plural=(n,a,b)=>n+' '+(n===1?a:b);
const fm=v=>v==null?"—":f1(v,Number.isInteger(+v)?0:1);
/* ============================ Estado ============================ */
const LS_KEY="dp_unop_v1";
let S=null;
function seedState(){
  const s={meta:{version:"1.1",creado:new Date().toISOString(),actualizado:"",usuario:""},
    corte:"2026-10",cfg:JSON.parse(JSON.stringify(META_DEF)),
    pacientes:JSON.parse(JSON.stringify(SEED.pacientes)),
    ktv:JSON.parse(JSON.stringify(SEED.ktv)),
    labs:JSON.parse(JSON.stringify(SEED.labs)),
    eventos:[],valoraciones:[],visitas:[],
    plan:JSON.parse(JSON.stringify(SEED.plan)),hechos:{},
    catalogo:JSON.parse(JSON.stringify(SEED.catalogo)),
    formula:JSON.parse(JSON.stringify(SEED.formula)),
    farm:{},
    habil:HAB_SEED.map((h,i)=>{const pf=HAB_PREFILL[h[2]]||{};return{id:"H"+pad(i+1),std:h[0],origen:h[1],crit:h[2],estado:"Por verificar",doc:pf.doc||"",cod:pf.cod||"",ver:pf.ver||"",ubic:"",resp:"",fecha:"",obs:pf.cod?"Prellenado con un documento existente en el proyecto; confirmar versión vigente y ubicación.":""};}),
    oblig:OBLIG.map((o,i)=>({id:"O"+pad(i+1),eps:o[0],txt:o[1],estado:"Por verificar",evid:""})),
    costos:{th:[{rol:"Nefrología",horasMes:0,valorHora:null},{rol:"Enfermería DP",horasMes:0,valorHora:null},{rol:"Nutrición",horasMes:0,valorHora:null},{rol:"Psicología",horasMes:0,valorHora:null},{rol:"Trabajo social",horasMes:0,valorHora:null},{rol:"Química farmacéutica / regente",horasMes:0,valorHora:null}],
      lab:{},visita:null,visitasMes:0,admPct:null,transportePac:null},
    log:[]
  };
  // Nepro como fórmula de los pacientes marcados (cantidad pendiente)
  return s;
}
function load(){
  try{const raw=localStorage.getItem(LS_KEY);if(raw){const s=JSON.parse(raw);if(s&&s.pacientes){S=Object.assign(seedState(),s);S.cfg=Object.assign(JSON.parse(JSON.stringify(META_DEF)),s.cfg||{});return "restaurado";}}}catch(e){}
  S=seedState();return "semilla";
}
let saveT=null;
function save(msg){
  S.meta.actualizado=new Date().toISOString();S.meta.usuario=$("usuario").value||S.meta.usuario;
  clearTimeout(saveT);saveT=setTimeout(()=>{try{localStorage.setItem(LS_KEY,JSON.stringify(S));$("saveinfo").textContent="Guardado en este navegador "+new Date().toLocaleTimeString("es-CO",{hour:"2-digit",minute:"2-digit"});}catch(e){$("saveinfo").textContent="No se pudo guardar en el navegador: descargue una copia.";}},250);
  if(msg)toast(msg);
}
function logAct(t){S.log.unshift({ts:new Date().toISOString(),u:$("usuario").value||"",t});if(S.log.length>500)S.log.length=500;}
function toast(t){const el=$("toast");el.textContent=t;el.hidden=false;clearTimeout(toast._t);toast._t=setTimeout(()=>el.hidden=true,4200);}

/* ============================ Fechas de corte ============================ */
const corteDate=()=>{const[y,m]=S.corte.split("-").map(Number);return new Date(y,m,0);};
const corteYM=()=>S.corte;
const ymOf=s=>s?String(s).slice(0,7):"";
const ymAdd=(ym,k)=>{const[y,m]=ym.split("-").map(Number);const d=new Date(y,m-1+k,1);return d.getFullYear()+"-"+pad(d.getMonth()+1);};
const inWindow=(dateStr,months,ref)=>{ref=ref||corteDate();const d=pdate(dateStr);if(!d)return false;const from=new Date(ref.getFullYear(),ref.getMonth()-months+1,1);return d>=from&&d<=ref;};
const pac=id=>S.pacientes.find(p=>p.id===id);
const isActive=(p,ref)=>{ref=ref||corteDate();if(p.estado==="Activo")return true;const e=pdate(p.fEgreso);return !!(e&&e>ref);};
const activos=ref=>S.pacientes.filter(p=>isActive(p,ref));
const shortName=p=>{const w=p.nombre.split(" ");return (w[0]+" "+(w.length>3?w[w.length-2]:w[w.length-1])).replace(/\b(\w)(\w*)/g,(m,a,b)=>a+b.toLowerCase());};
const nameCase=s=>String(s).toLowerCase().replace(/(^|\s)(\S)/g,(m,a,b)=>a+b.toUpperCase());

/* ============================ Kt/V ============================ */
function ktvCalc(r){
  const p=pac(r.pac)||{};const sexo=(r.sexo||p.sexo||"").toUpperCase();const edad=num(r.edad)??p.edad;
  const peso=num(r.peso),talla=num(r.talla),vol=num(r.vol),bunEf=num(r.bunEf),bunS=num(r.bunS),orina=num(r.orina),ureaOr=num(r.ureaOr);
  const out={V:null,DP:null,ktvP:null,ktvR:null,ktvT:null,estado:"Incompleto",motivos:[]};
  if(talla!=null&&talla<3){out.motivos.push("Talla en metros ("+talla+"): debe ir en cm");}
  if(peso!=null&&talla!=null&&talla>=100&&sexo){
    out.V=sexo==="M"?2.447-0.09516*(edad||0)+0.1074*talla+0.3362*peso:-2.097+0.1069*talla+0.2466*peso;
    if(sexo==="M"&&edad==null)out.motivos.push("Falta edad (Watson en hombres la usa)");
  }
  if(bunEf!=null&&bunS)out.DP=bunEf/bunS;
  if(out.V&&out.DP!=null&&vol!=null){out.ktvP=(vol/1000)*out.DP*7/out.V;}
  if(out.V&&orina>0&&ureaOr!=null&&bunS){out.ktvR=(orina/1000)*(ureaOr/bunS)*7/out.V;}
  if(out.ktvP!=null)out.ktvT=out.ktvP+(out.ktvR||0);
  const falt=[];if(vol==null)falt.push("volumen drenado 24 h");if(bunEf==null)falt.push("BUN efluente");if(bunS==null)falt.push("BUN sérico");if(peso==null)falt.push("peso");if(talla==null)falt.push("talla");
  if(falt.length)out.motivos.push("Falta: "+falt.join(", "));
  if(out.DP!=null&&out.DP>1.05)out.motivos.push("D/P urea "+f1(out.DP,2)+" > 1: no plausible (revisar muestras/etiquetas)");
  if(vol!=null&&vol<4000)out.motivos.push("Volumen drenado "+vol.toLocaleString("es-CO")+" mL: improbable para la prescripción");
  if(out.ktvT!=null&&out.ktvT>4.5)out.motivos.push("Kt/V > 4,5: revisar");
  if(r.dudoso)out.motivos.push("Marcado como dudoso");
  if(out.ktvT==null)out.estado="Incompleto";
  else if(out.motivos.length)out.estado="No válido";
  else out.estado="Válido";
  if(out.ktvT!=null&&!orina&&!out.motivos.length)out.nota="Sin componente renal: Kt/V total = peritoneal";
  return out;
}
const ktvSorted=pid=>S.ktv.filter(k=>k.pac===pid).sort((a,b)=>(a.periodo||"0000")<(b.periodo||"0000")?-1:1);
function lastValidKtv(pid,ref,months){ref=ref||corteDate();months=months||S.cfg.ktvVentana;
  const L=ktvSorted(pid).filter(k=>k.periodo&&inWindow(k.periodo+"-01",months,ref)).map(k=>({k,c:ktvCalc(k)})).filter(x=>x.c.estado==="Válido");
  return L.length?L[L.length-1]:null;}

/* ============================ Laboratorio ============================ */
const labsOf=(pid,ex)=>S.labs.filter(l=>l.pac===pid&&l.ex===ex).sort((a,b)=>a.fecha<b.fecha?-1:1);
function lastLab(pid,ex,months,ref){const L=labsOf(pid,ex).filter(l=>!months||inWindow(l.fecha,months,ref));return L.length?L[L.length-1]:null;}
function avgLab(pid,ex,months,ref){const L=labsOf(pid,ex).filter(l=>inWindow(l.fecha,months,ref)).map(l=>num(l.v)).filter(v=>v!=null);return L.length?L.reduce((a,b)=>a+b,0)/L.length:null;}
function dueFreq(f,month){const c=S.cfg;if(!f)return false;const b=f.replace("*","");if(b==="M")return true;if(b==="T")return c.anchorT.includes(month);if(b==="S")return c.anchorS.includes(month);if(b==="A")return c.anchorA.includes(month);return false;}
function solicitudMes(p,ym){
  const m=+ym.split("-")[1];const out=[];
  Object.entries(LABFREQ).forEach(([k,map])=>{const f=map[p.eps]||"";const dm=String(p.dm).toUpperCase().startsWith("S");
    let due=dueFreq(f,m);if(f==="M*"&&!dm)due=S.cfg.anchorS.includes(m);if(f==="T*"&&!dm)due=false;
    if(due)out.push({k,f,incl:true});
  });
  // lo que la clínica pide aunque el contrato no lo traiga
  const need=[["KtV","T"],["Orina24","T"],["Alb","T"],["PTH","S"]];
  need.forEach(([k,f])=>{if(!out.find(o=>o.k===k)&&dueFreq(f,m)){const inc=(LABFREQ[k]||{})[p.eps];out.push({k,f,incl:false,nota:inc?("Contrato: "+FREQ_TXT[inc]):"No incluido en el contrato"});}});
  return out;
}
const LABNAME=k=>({KtV:"Kt/V (BUN en efluente 24 h + BUN sérico)",PET:"Test de equilibrio peritoneal",Orina24:"Orina 24 h (volumen y NU urinario) · KRU"})[k]||(EX[k]?EX[k].l:k);

/* ============================ Eventos ============================ */
function peritonitisClasif(){
  const res={};const byP={};
  S.eventos.filter(e=>e.tipo==="Peritonitis").sort((a,b)=>a.fIni<b.fIni?-1:1).forEach(e=>{(byP[e.pac]=byP[e.pac]||[]).push(e);});
  Object.values(byP).forEach(L=>{L.forEach((e,i)=>{let cls="Nuevo episodio";if(i>0){const prev=L[i-1];const fin=pdate(prev.fFin||prev.fIni);const ini=pdate(e.fIni);if(fin&&ini){const d=dayDiff(fin,ini);
      const same=prev.germen&&e.germen&&norm(prev.germen)===norm(e.germen);const neg=e.grupo==="Cultivo negativo"||prev.grupo==="Cultivo negativo";
      if(d<=28&&(same||neg))cls="Recaída (no cuenta como episodio nuevo)";else if(d<=28)cls="Recurrente (cuenta)";else if(same)cls="De repetición (cuenta)";}}
    res[e.id]=cls;});});
  return res;
}
function exposicionMeses(desde,hasta,pid,ids){ // meses-paciente en DP entre fechas (aprox. días/30.44)
  let tot=0;S.pacientes.filter(p=>(!pid||p.id===pid)&&(!ids||ids.has(p.id))).forEach(p=>{
    const ini=pdate(p.fIngresoDP)||null;const fin=pdate(p.fEgreso)||null;
    let a=desde,b=hasta;if(ini&&ini>a)a=ini;if(fin&&fin<b)b=fin;
    if(!ini&&p.estado!=="Activo"&&!fin)return;
    if(b>a)tot+=dayDiff(a,b)/30.44;});
  return tot;
}

/* ============================ Alertas por paciente ============================ */
function alertasPac(p,ref){
  ref=ref||corteDate();const A=[];const M=S.cfg;const add=(sev,t,mod)=>A.push({sev,t,mod});
  if(!isActive(p,ref)){
    if(S.formula.some(f=>f.pac===p.id))add("warn","Paciente con estado «"+p.estado+"» y fórmula de DP vigente: suspender la entrega.","farmacia");
    if(!p.fEgreso)add("warn","Falta la fecha de egreso de DP (causa: "+(p.causaEgreso||p.estado)+").","pacientes");
    return A;
  }
  if((p.obsFuente||[]).length)add("info",plural(p.obsFuente.length,"observación","observaciones")+" de calidad del dato en los archivos fuente (detalle en la ficha › Resumen).","pacientes");
  if(!p.fIngresoDP)add("info","Falta fecha de ingreso a DP (necesaria para la regla CAC de 90 días y para la tasa de peritonitis).","pacientes");
  const lk=lastValidKtv(p.id,ref);
  if(!lk)add("bad","Sin Kt/V válido en los últimos "+M.ktvVentana+" meses.","pacientes");
  else if(lk.c.ktvT<M.ktv)add("bad","Kt/V "+f1(lk.c.ktvT,2)+" < "+f1(M.ktv,1)+" ("+ymLabel(lk.k.periodo)+"): revisar prescripción, adherencia, FRR y UF.","pacientes");
  const hb=lastLab(p.id,"Hb",3,ref);if(!hb)add("warn","Sin hemoglobina en el último trimestre.","pacientes");else if(num(hb.v)<M.hb)add("bad","Hb "+f1(num(hb.v))+" g/dL < "+fm(M.hb)+".","pacientes");
  const al=lastLab(p.id,"Alb",3,ref);if(!al)add("warn","Sin albúmina en el último trimestre.","pacientes");else if(num(al.v)<M.alb)add("bad","Albúmina "+f1(num(al.v))+" g/dL < "+fm(M.alb)+".","pacientes");
  const ph=lastLab(p.id,"P",3,ref);if(!ph)add("warn","Sin fósforo en el último trimestre.","pacientes");else if(num(ph.v)<M.pLo||num(ph.v)>M.pHi)add("warn","Fósforo "+f1(num(ph.v))+" mg/dL fuera de "+fm(M.pLo)+"–"+fm(M.pHi)+".","pacientes");
  const ca=avgLab(p.id,"Ca",3,ref);if(ca!=null&&ca>M.ca)add("warn","Calcio total promedio "+f1(ca)+" > "+fm(M.ca)+" mg/dL (hipercalcemia CAC).","pacientes");
  const pth=lastLab(p.id,"PTH",6,ref);if(!pth)add("warn","Sin PTH en los últimos 6 meses.","pacientes");else if(num(pth.v)<M.pthLo||num(pth.v)>M.pthHi)add("warn","PTH "+f1(num(pth.v),0)+" fuera de "+fm(M.pthLo)+"–"+fm(M.pthHi)+" pg/mL.","pacientes");
  const k=lastLab(p.id,"K",3,ref);if(k&&num(k.v)<M.kLo)add("warn","Hipopotasemia: K "+f1(num(k.v))+" mEq/L.","pacientes");
  const diu=lastLab(p.id,"Diuresis",12,ref);
  if(!diu&&!num(p.diuresis))add("warn","Sin diuresis de 24 h registrada: Nueva EPS/CAC la exigen en HC (KRU si > 100 mL/d).","pacientes");
  const lastOr=S.ktv.filter(x=>x.pac===p.id&&num(x.orina)>0&&x.periodo).sort((a,b)=>a.periodo<b.periodo?-1:1).pop();
  if((num(diu&&diu.v)||num(p.diuresis)||0)>100&&(!lastOr||!inWindow(lastOr.periodo+"-01",6,ref)))add("warn","Diuresis > 100 mL/d sin KRU en 6 meses.","pacientes");
  const per=S.eventos.filter(e=>e.pac===p.id&&e.tipo==="Peritonitis");
  const lastPer=per.sort((a,b)=>a.fIni<b.fIni?-1:1).pop();
  if(lastPer){if(inWindow(lastPer.fIni,6,ref))add("warn","Peritonitis el "+fd(lastPer.fIni)+(lastPer.germen?" ("+lastPer.germen+")":"")+".","eventos");
    const re=S.visitas.find(v=>v.pac===p.id&&v.tipo==="Reentrenamiento"&&v.fecha>=lastPer.fIni);if(!re)add("bad","Reentrenamiento pendiente después de la peritonitis del "+fd(lastPer.fIni)+".","visitas");
    if(lastPer.desenlace==="En tratamiento")add("info","Peritonitis en tratamiento: registrar desenlace y fecha de fin.","eventos");}
  const vd=S.visitas.filter(v=>v.pac===p.id&&/domiciliaria/i.test(v.tipo)).sort((a,b)=>a.fecha<b.fecha?-1:1).pop();
  if(!vd)add("warn","Sin visita domiciliaria registrada.","visitas");else if(!inWindow(vd.fecha,M.visitaMeses,ref))add("warn","Última visita domiciliaria "+fd(vd.fecha)+" (> "+M.visitaMeses+" meses).","visitas");
  if(p.tx==="Sin evaluar")add("warn","Idoneidad para trasplante sin evaluar (CAC dia_22).","pacientes");
  const qol=S.valoraciones.find(v=>v.pac===p.id&&v.disc==="Calidad de vida (escala validada)"&&inWindow(v.fecha,M.qolMeses,ref));
  if(!qol)add("info","Sin escala validada de calidad de vida en "+M.qolMeses+" meses (CAC dia_36).","pacientes");
  if(!S.formula.some(f=>f.pac===p.id&&/^D\d/.test(f.cod)))add("bad","Paciente activo sin soluciones de DP en la fórmula.","farmacia");
  const order={bad:0,warn:1,info:2};A.sort((a,b)=>order[a.sev]-order[b.sev]);
  return A;
}
const prioridad=A=>A.some(a=>a.sev==="bad")?"bad":A.some(a=>a.sev==="warn")?"warn":"ok";

/* ============================ Indicadores ============================ */
function semaf(v,cuts){if(v==null)return"base";const[hi,mid,dir]=cuts;if(dir==="lt")return v<hi?"ok":v<=mid?"warn":"bad";return v>hi?"ok":v>=mid?"warn":"bad";}
const fltOk=(p,flt)=>!flt||((!flt.eps||p.eps===flt.eps)&&(!flt.mod||p.modalidad===flt.mod));
function indicadores(ref,flt){
  ref=ref||corteDate();const M=S.cfg;const A=activos(ref).filter(p=>(p.edad||99)>=18&&fltOk(p,flt));const ids=new Set(S.pacientes.filter(p=>fltOk(p,flt)).map(p=>p.id));const EV=S.eventos.filter(e=>ids.has(e.pac));const n=A.length;const I=[];
  const prop=(fn)=>{const ok=[],no=[],sd=[];A.forEach(p=>{const r=fn(p);if(r===null)sd.push(p);else if(r)ok.push(p);else no.push(p);});return{ok,no,sd,v:(n&&ok.length+no.length)?ok.length/n:null};};
  const push=(o)=>I.push(o);
  // Resultado / proceso CAC
  let r=prop(p=>{const x=lastValidKtv(p.id,ref,12);return x?x.c.ktvT>=M.ktv:null;});
  push({g:"Proceso",cod:"dia_12_adul",n:"Adultos en DP con Kt/V total ≥ "+f1(M.ktv,1),num:r.ok.length,den:n,v:r.v,fmt:"pct",cls:semaf(r.v,[.8,.6]),meta:"Alto > 80 % · medio 60–80 % · bajo < 60 %",nota:"Kt/V válido de los últimos 12 meses. Los pacientes sin dato válido cuentan en el denominador ("+r.sd.length+").",det:r,src:"CAC 2026"});
  r=prop(p=>{const x=lastLab(p.id,"Hb",3,ref);return x?num(x.v)>=M.hb:null;});
  push({g:"Resultado",cod:"dia_14_adul",n:"Adultos en DP con Hb ≥ "+fm(M.hb)+" g/dL (último trimestre)",num:r.ok.length,den:n,v:r.v,fmt:"pct",cls:semaf(r.v,[.6,.2]),meta:"Alto > 60 % · medio 20–60 % · bajo < 20 %",nota:"Sin dato: "+r.sd.length,det:r,src:"CAC 2026"});
  r=prop(p=>{const x=lastLab(p.id,"Alb",3,ref);return x?num(x.v)>=M.alb:null;});
  push({g:"Resultado",cod:"dia_16_adul",n:"Adultos en DP con albúmina ≥ "+fm(M.alb)+" g/dL",num:r.ok.length,den:n,v:r.v,fmt:"pct",cls:semaf(r.v,[.4,.2]),meta:"Alto > 40 % · medio 20–40 % · bajo < 20 %",nota:"Sin dato: "+r.sd.length,det:r,src:"CAC 2026"});
  r=prop(p=>{const x=lastLab(p.id,"P",3,ref);return x?(num(x.v)>=M.pLo&&num(x.v)<=M.pHi):null;});
  push({g:"Resultado",cod:"dia_18_adul",n:"Adultos en DP con fósforo "+fm(M.pLo)+"–"+fm(M.pHi)+" mg/dL",num:r.ok.length,den:n,v:r.v,fmt:"pct",cls:semaf(r.v,[.8,.2]),meta:"Alto > 80 % · medio 20–80 % · bajo < 20 %",nota:"Sin dato: "+r.sd.length,det:r,src:"CAC 2026"});
  r=prop(p=>{const x=lastLab(p.id,"PTH",6,ref);return x?(num(x.v)>=M.pthLo&&num(x.v)<=M.pthHi):null;});
  push({g:"Resultado",cod:"dia_28_adul",n:"Adultos en DP con PTH "+fm(M.pthLo)+"–"+fm(M.pthHi)+" pg/mL (6 meses)",num:r.ok.length,den:n,v:r.v,fmt:"pct",cls:"base",meta:"Línea de base",nota:"Excluir paratiroidectomía realizada/programada y antineoplásicos (registrar en la ficha). Sin dato: "+r.sd.length,det:r,src:"CAC 2026"});
  r=prop(p=>{const x=avgLab(p.id,"Ca",3,ref);return x==null?null:x>M.ca;});
  push({g:"Resultado",cod:"dia_30_adul",n:"Adultos en DP con hipercalcemia (Ca total > "+fm(M.ca)+")",num:r.ok.length,den:n,v:r.v,fmt:"pct",cls:"base",meta:"Línea de base (menor es mejor)",nota:"Promedio del último trimestre, calcio no corregido. Sin dato: "+r.sd.length,det:r,src:"CAC 2026"});
  // Peritonitis (12 meses móviles)
  const desde=new Date(ref.getFullYear()-1,ref.getMonth()+1,1);const cls=peritonitisClasif();
  const epis=EV.filter(e=>e.tipo==="Peritonitis"&&pdate(e.fIni)>=desde&&pdate(e.fIni)<=ref&&!/^Recaída/.test(cls[e.id]||""));
  const exp=exposicionMeses(desde,ref,null,ids);const tasa=exp?epis.length/(exp/12):null;
  const sinFecha=S.pacientes.filter(p=>ids.has(p.id)&&!p.fIngresoDP&&(isActive(p,ref)||pdate(p.fEgreso)>=desde)).length;
  const sinReg=!S.eventos.length;
  push({g:"Resultado",cod:"dia_19_adul",n:"Tasa de peritonitis (episodios por paciente-año, 12 meses)",num:epis.length,den:f1(exp,1)+" meses-paciente",v:sinReg?null:tasa,fmt:"rate",cls:(sinReg||tasa==null)?"base":tasa<=M.perit?"ok":"bad",meta:"CAC: línea de base · ISPD 2022: ≤ "+f1(M.perit,2)+" episodios/año en riesgo",nota:(sinReg?"No hay ningún evento registrado: la tasa no se calcula hasta que el registro esté al día (cero eventos no es lo mismo que registro vacío). ":"")+(sinFecha?sinFecha+" paciente(s) sin fecha de ingreso a DP: la exposición se toma desde hace 12 meses y puede sobrestimar el denominador. ":"")+"Las recaídas no cuentan como episodio nuevo.",src:"CAC 2026 · ISPD 2022"});
  const libres=A.filter(p=>!EV.some(e=>e.pac===p.id&&e.tipo==="Peritonitis"&&pdate(e.fIni)>=desde&&pdate(e.fIni)<=ref));
  push({g:"Resultado",cod:"ISPD",n:"Pacientes libres de peritonitis (12 meses)",num:libres.length,den:n,v:(n&&!sinReg)?libres.length/n:null,fmt:"pct",cls:(n&&!sinReg)?(libres.length/n>.8?"ok":"warn"):"base",meta:"ISPD 2022 sugiere > 80 %",nota:"",src:"ISPD 2022"});
  const hosp=EV.filter(e=>e.tipo==="Hospitalización"&&pdate(e.fIni)>=desde&&pdate(e.fIni)<=ref&&(num(e.dias)==null||num(e.dias)>=1));
  push({g:"Resultado",cod:"dia_32_adul",n:"Tasa de hospitalización por todas las causas (por paciente-año)",num:hosp.length,den:f1(exp,1)+" meses-paciente",v:(exp&&!sinReg)?hosp.length/(exp/12):null,fmt:"rate",cls:"base",meta:"Línea de base",nota:"Solo hospitalizaciones > 24 h.",src:"CAC 2026"});
  // Trasplante, abandono, calidad de vida
  const idon=A.filter(p=>["Idóneo, en estudio","En lista de espera"].includes(p.tx));const lista=A.filter(p=>p.tx==="En lista de espera");
  push({g:"Proceso",cod:"dia_22_adul",n:"Adultos en DP en lista de espera (sobre médicamente idóneos)",num:lista.length,den:idon.length,v:idon.length?lista.length/idon.length:null,fmt:"pct",cls:"base",meta:"Línea de base",nota:A.filter(p=>p.tx==="Sin evaluar").length+" paciente(s) sin evaluación de idoneidad: no entran a ningún lado del cociente hasta clasificarlos.",src:"CAC 2026"});
  const per12=S.pacientes.filter(p=>ids.has(p.id)).filter(p=>isActive(p,ref)||(pdate(p.fEgreso)&&pdate(p.fEgreso)>=desde));const aband=per12.filter(p=>p.estado==="Abandono"&&pdate(p.fEgreso)>=desde);
  push({g:"Seguimiento",cod:"dia_24_adul",n:"Adultos en DP que abandonan el tratamiento (12 meses)",num:aband.length,den:per12.length,v:per12.length?aband.length/per12.length:null,fmt:"pct",cls:"base",meta:"Línea de base",nota:"Requiere desistimiento firmado o no ubicación con soportes de contacto.",src:"CAC 2026"});
  const qol=A.filter(p=>S.valoraciones.some(v=>v.pac===p.id&&v.disc==="Calidad de vida (escala validada)"&&inWindow(v.fecha,12,ref)));
  push({g:"Proceso",cod:"dia_36_adul",n:"Prevalentes en DP evaluados con escala validada de calidad de vida",num:qol.length,den:n,v:n?qol.length/n:null,fmt:"pct",cls:"base",meta:"Línea de base",nota:"",src:"CAC 2026"});
  // Proceso internos
  const m=ref.getMonth()+1;const triIni=new Date(ref.getFullYear(),ref.getMonth()-2,1);
  const ktvTri=A.filter(p=>S.ktv.some(k=>k.pac===p.id&&k.periodo&&pdate(k.periodo+"-01")>=triIni&&pdate(k.periodo+"-01")<=ref));
  const ktvTriV=A.filter(p=>S.ktv.some(k=>k.pac===p.id&&k.periodo&&pdate(k.periodo+"-01")>=triIni&&pdate(k.periodo+"-01")<=ref&&ktvCalc(k).estado==="Válido"));
  push({g:"Proceso",cod:"INT-01",n:"Kt/V tomado en el trimestre",num:ktvTri.length,den:n,v:n?ktvTri.length/n:null,fmt:"pct",cls:n?(ktvTri.length/n>=.9?"ok":ktvTri.length/n>=.7?"warn":"bad"):"base",meta:"Meta institucional ≥ 90 %",nota:"Calendario institucional: ene-abr-jul-oct.",src:"Interno"});
  push({g:"Proceso",cod:"INT-02",n:"Kt/V del trimestre con datos válidos (calidad del dato)",num:ktvTriV.length,den:ktvTri.length,v:ktvTri.length?ktvTriV.length/ktvTri.length:null,fmt:"pct",cls:ktvTri.length?(ktvTriV.length/ktvTri.length>=.9?"ok":ktvTriV.length/ktvTri.length>=.7?"warn":"bad"):"base",meta:"Meta institucional ≥ 90 %",nota:"Válido = completo, D/P ≤ 1, talla en cm, volumen plausible.",src:"Interno"});
  const vis=A.filter(p=>S.visitas.some(v=>v.pac===p.id&&/domiciliaria/i.test(v.tipo)&&inWindow(v.fecha,M.visitaMeses,ref)));
  push({g:"Proceso",cod:"INT-03",n:"Pacientes con visita domiciliaria en "+M.visitaMeses+" meses",num:vis.length,den:n,v:n?vis.length/n:null,fmt:"pct",cls:n?(vis.length/n>=.9?"ok":vis.length/n>=.6?"warn":"bad"):"base",meta:"Meta institucional ≥ 90 %",nota:"Periodicidad editable en Configuración (no hay estándar normativo fijo).",src:"Interno"});
  const nutr=A.filter(p=>S.valoraciones.some(v=>v.pac===p.id&&v.disc==="Nutrición"&&inWindow(v.fecha,3,ref)));
  push({g:"Proceso",cod:"INT-04",n:"Valoración por nutrición en el trimestre",num:nutr.length,den:n,v:n?nutr.length/n:null,fmt:"pct",cls:n?(nutr.length/n>=.9?"ok":"warn"):"base",meta:"Contratos: trimestral (Nueva EPS mín. 4/año)",nota:"",src:"Contratos"});
  const psi=A.filter(p=>S.valoraciones.some(v=>v.pac===p.id&&v.disc==="Psicología"&&inWindow(v.fecha,3,ref)));
  push({g:"Proceso",cod:"INT-05",n:"Valoración por psicología en el trimestre",num:psi.length,den:n,v:n?psi.length/n:null,fmt:"pct",cls:n?(psi.length/n>=.9?"ok":"warn"):"base",meta:"Contratos: trimestral",nota:"",src:"Contratos"});
  const nef=A.filter(p=>S.valoraciones.some(v=>v.pac===p.id&&v.disc==="Nefrología"&&ymOf(v.fecha)===ymOf(iso(ref))));
  push({g:"Proceso",cod:"INT-06",n:"Consulta de nefrología en el mes",num:nef.length,den:n,v:n?nef.length/n:null,fmt:"pct",cls:n?(nef.length/n>=1?"ok":nef.length/n>=.8?"warn":"bad"):"base",meta:"Contratos: mensual (100 %)",nota:"Una consulta no realizada es glosa directa en Mallamas.",src:"Contratos"});
  // Estructura
  const H=S.habil.filter(h=>h.estado!=="No aplica");const hc=H.filter(h=>h.estado==="Cumple").length;
  push({g:"Estructura",cod:"EST-01",n:"Criterios de habilitación verificados como «Cumple»",num:hc,den:H.length,v:H.length?hc/H.length:null,fmt:"pct",cls:H.length?(hc/H.length>=1?"ok":hc/H.length>=.8?"warn":"bad"):"base",meta:"100 % (habilitación no admite parciales)",nota:S.habil.filter(h=>h.estado==="Por verificar").length+" criterios sin verificar.",src:"Res. 3100/2019"});
  const ev=H.filter(h=>h.estado==="Cumple"&&h.cod&&h.ubic).length;
  push({g:"Estructura",cod:"EST-02",n:"Criterios «Cumple» con evidencia trazable (código + ubicación)",num:ev,den:hc,v:hc?ev/hc:null,fmt:"pct",cls:hc?(ev/hc>=1?"ok":"warn"):"base",meta:"100 %",nota:"",src:"Interno"});
  const vigN=EPS_L.filter(e=>EPS_INFO[e].vigFin&&pdate(EPS_INFO[e].vigFin)>=ref).length;
  push({g:"Estructura",cod:"EST-03",n:"Contratos de DP con vigencia documentada al corte",num:vigN,den:EPS_L.length,v:vigN/EPS_L.length,fmt:"pct",cls:vigN===EPS_L.length?"ok":"bad",meta:"100 %",nota:"Mallamas vencido (31/12/2025); Nueva EPS y FOMAG sin vigencia en los documentos cargados.",src:"Contratos"});
  // Financieros
  const F=finanzas(ymOf(iso(ref)),flt);
  push({g:"Financiero",cod:"FIN-01",n:"Ingreso esperado por paquetes en el mes",num:null,den:null,v:F.ingreso,fmt:"money",cls:"base",meta:"",nota:F.notaIng,src:"Contratos"});
  push({g:"Financiero",cod:"FIN-02",n:"Costo de insumos y medicamentos del mes (según fórmula)",num:null,den:null,v:F.costoKnown?F.costo:null,fmt:"money",cls:F.costoKnown?"base":"warn",meta:"",nota:F.costoKnown?F.notaCosto:"Faltan costos unitarios en el catálogo ("+F.sinCosto+" productos con consumo sin costo).",src:"Farmacia"});
  push({g:"Financiero",cod:"FIN-03",n:"Costo de insumos como % del ingreso",num:null,den:null,v:F.costoKnown&&F.ingreso?F.costo/F.ingreso:null,fmt:"pct",cls:"base",meta:"Referencia interna a definir",nota:"",src:"Farmacia"});
  push({g:"Financiero",cod:"FIN-04",n:"Costo absorbido por la IPS en ítems no incluidos en el paquete",num:null,den:null,v:F.noInclKnown?F.noIncl:null,fmt:"money",cls:F.noInclKnown?"warn":"base",meta:"",nota:"Mupirocina (todas las EPS), complejo B (Nueva EPS), suplemento nutricional (Mallamas/FOMAG) según la matriz contractual.",src:"Contratos"});
  return I;
}

/* ============================ Farmacia / finanzas ============================ */
const tarifa=eps=>{const c=EPS_INFO[eps];return c?c.codigos[0][2]:null;};
const NO_INCL={"MUPI2":["NUEVA EPS","MALLAMAS","FOMAG"],"CPLB":["NUEVA EPS"],"NEPRO":["MALLAMAS","FOMAG"]};
function farmMes(ym){const F=S.farm[ym]=S.farm[ym]||{};F.entregas=F.entregas||{};F.bodega=F.bodega||{};F.recibido=F.recibido||{};return F;}
function necesidad(ym){
  const F=farmMes(ym);const R=S.cfg.reservaDias||0;const dias=monthEnd(pdate(ym+"-01")).getDate();const rows=[];
  S.formula.forEach(f=>{const p=pac(f.pac);if(!p||!isActive(p,monthEnd(pdate(ym+"-01"))))return;
    const E=F.entregas[f.pac]||{};const req=f.cant;const extra=Math.ceil(req*R/dias);const saldo=num((E.saldo||{})[f.cod])||0;
    const aEntregar=Math.max(0,req+extra-saldo);rows.push({pac:f.pac,cod:f.cod,req,extra,saldo,aEntregar,entregado:E.fecha?num((E.entregado||{})[f.cod]):null});});
  return rows;
}
function pedido(ym){
  const F=farmMes(ym);const N=necesidad(ym);const by={};
  N.forEach(r=>{by[r.cod]=(by[r.cod]||0)+r.aEntregar;});
  return S.catalogo.filter(c=>by[c.cod]||num(F.bodega[c.cod])||num(F.recibido[c.cod])).map(c=>{const need=by[c.cod]||0;const bod=num(F.bodega[c.cod])||0;const min=num(c.stockMin)||0;
    const ped=Math.max(0,need-bod+min);const rec=num(F.recibido[c.cod]);return{c,need,bod,min,ped,rec,dif:rec==null?null:rec-ped,costo:num(c.costo)};});
}
function finanzas(ym,flt){
  const ref=monthEnd(pdate(ym+"-01"));const A=activos(ref).filter(p=>fltOk(p,flt));let ingreso=0;const porEps={};
  A.forEach(p=>{const t=tarifa(p.eps)||0;ingreso+=t;porEps[p.eps]=(porEps[p.eps]||0)+t;});
  let costo=0,sinCosto=0,noIncl=0,noInclKnown=true;const porPac={};
  S.formula.forEach(f=>{const p=pac(f.pac);if(!p||!isActive(p,ref)||!fltOk(p,flt))return;const c=S.catalogo.find(x=>x.cod===f.cod);const cu=c?num(c.costo):null;
    if(cu==null){sinCosto++;if(NO_INCL[f.cod]&&NO_INCL[f.cod].includes(p.eps))noInclKnown=false;return;}
    const v=cu*f.cant;costo+=v;porPac[f.pac]=(porPac[f.pac]||0)+v;if(NO_INCL[f.cod]&&NO_INCL[f.cod].includes(p.eps))noIncl+=v;});
  const prods=new Set(S.formula.filter(f=>{const p=pac(f.pac);return p&&isActive(p,ref)&&fltOk(p,flt);}).map(f=>f.cod));
  const sinCostoProd=[...prods].filter(c=>num((S.catalogo.find(x=>x.cod===c)||{}).costo)==null).length;
  return{ingreso,porEps,costo,costoKnown:sinCostoProd===0,sinCosto:sinCostoProd,porPac,noIncl,noInclKnown:noInclKnown&&noIncl>0,
    notaIng:A.length+" pacientes activos × tarifa mensual de su EPS. No descuenta rupturas de paquete (hospitalización FOMAG, días atendidos Mallamas) ni glosas.",
    notaCosto:"Fórmula vigente × costo unitario del catálogo."};
}

/* ============================ Navegación ============================ */
const MODS=[
 {g:"Resumen"},{k:"tablero",l:"Tablero",i:"home"},
 {g:"SOGCS"},{k:"habil",l:"Habilitación",i:"shield"},
 {g:"Administrativo"},{k:"contratos",l:"Contratación por EPS",i:"file"},
 {g:"Clínico"},{k:"pacientes",l:"Pacientes",i:"users"},{k:"seguimiento",l:"Calendario y laboratorio",i:"cal"},{k:"eventos",l:"Peritonitis y eventos",i:"alert"},{k:"visitas",l:"Visitas y entrenamiento",i:"homev"},
 {g:"Farmacia y finanzas"},{k:"farmacia",l:"Farmacia y suministros",i:"pill"},{k:"indicadores",l:"Indicadores",i:"chart"},{k:"notatec",l:"Nota técnica",i:"calc"},
 {g:"Sistema"},{k:"config",l:"Configuración",i:"gear"}
];
let VIEW={mod:"tablero",sub:null,pac:null};
function navCounts(){const A=activos();const bad=A.filter(p=>prioridad(alertasPac(p))==="bad").length;const hv=S.habil.filter(h=>h.estado==="No cumple").length;
  return{pacientes:[A.length,bad?"bad":""],habil:[hv||"",hv?"bad":""]};}
function renderNav(){const C=navCounts();
  $("nav").innerHTML=MODS.map(m=>m.g?'<div class="grp">'+m.g+'</div>':'<button data-mod="'+m.k+'"'+(VIEW.mod===m.k?' aria-current="page"':'')+'>'+ico(m.i)+'<span>'+m.l+'</span>'+(C[m.k]&&C[m.k][0]!==""?'<span class="count '+(C[m.k][1]||"")+'">'+C[m.k][0]+'</span>':'')+'</button>').join("");
}
function go(mod,extra){VIEW=Object.assign({mod,sub:null,pac:null},extra||{});render();window.scrollTo(0,0);}
function render(){renderNav();const m=MODS.find(x=>x.k===VIEW.mod);$("ttl").innerHTML=esc(m?m.l:"")+'<small>Corte: '+MESES[+S.corte.split("-")[1]-1]+' de '+S.corte.split("-")[0]+' · '+activos().length+' pacientes activos en DP</small>';
  const R={tablero:rTablero,habil:rHabil,contratos:rContratos,pacientes:rPacientes,seguimiento:rSeguimiento,eventos:rEventos,visitas:rVisitas,farmacia:rFarmacia,indicadores:rIndicadores,notatec:rNotaTec,config:rConfig}[VIEW.mod];
  $("out").innerHTML=(R?R():"")+'<p class="privacy">Datos de salud sensibles (Ley 1581 de 2012). Este archivo no envía nada a internet: el estado se guarda en este navegador y en las copias que usted descarga. La herramienta calcula y alerta; la decisión clínica es del profesional tratante.</p>';
  bindAfter();
}
const head=(t,sub,btns)=>'<div class="mhead"><div><h2>'+t+'</h2>'+(sub?'<p>'+sub+'</p>':'')+'</div><div class="row noprint">'+(btns||"")+'</div></div>';
const tabs=(items,cur,attr)=>'<div class="tabs" role="tablist">'+items.map(([k,l])=>'<button role="tab" data-'+(attr||"sub")+'="'+k+'" aria-selected="'+(cur===k)+'">'+l+'</button>').join("")+'</div>';
const opt=(arr,sel,blank)=>(blank!=null?'<option value="">'+esc(blank)+'</option>':"")+arr.map(x=>{const v=Array.isArray(x)?x[0]:x,l=Array.isArray(x)?x[1]:x;return'<option value="'+esc(v)+'"'+(String(sel)===String(v)?" selected":"")+'>'+esc(l)+'</option>';}).join("");
const alertBox=(sev,html)=>'<div class="alert '+sev+'">'+ico(STI[sev]||"info")+'<div>'+html+'</div></div>';
const pacOpts=(sel,all)=>opt(S.pacientes.filter(p=>all||isActive(p)).map(p=>[p.id,p.id+" · "+nameCase(p.nombre)]),sel,"Seleccione paciente");

/* ============================ Gráficas (SVG propio, colores por tema vía CSS) ============================ */
function lineChart(pts,o){
  o=o||{};const W=560,H=o.h||170,L=40,R=22,T=16,B=26;const dec=o.dec==null?1:o.dec;
  const ys=pts.map(p=>p.y).filter(v=>v!=null);if(!ys.length)return'<div class="empty">Sin datos para graficar todavía.</div>';
  let lo=Math.min(...ys,o.band?o.band[0]:Infinity,o.target!=null?o.target:Infinity),hi=Math.max(...ys,o.band?o.band[1]:-Infinity,o.target!=null?o.target:-Infinity);
  if(o.min!=null)lo=Math.min(lo,o.min);if(o.max!=null)hi=Math.max(hi,o.max);const padv=(hi-lo)*.12||1;if(o.max==null)hi+=padv;if(o.min==null)lo-=padv;if(o.floor0)lo=Math.max(0,lo);
  const X=i=>L+12+(pts.length===1?(W-L-R-12)/2:i*(W-L-R-12)/(pts.length-1)),Y=v=>T+(H-T-B)*(1-(v-lo)/(hi-lo));
  let g="";for(let i=0;i<=4;i++){const v=lo+(hi-lo)*i/4;const y=Y(v);g+='<line class="g-grid" x1="'+L+'" x2="'+(W-R)+'" y1="'+y+'" y2="'+y+'"/><text x="'+(L-6)+'" y="'+(y+3.5)+'" text-anchor="end">'+f1(v,dec)+'</text>';}
  const band=o.band?'<rect class="g-band" x="'+L+'" width="'+(W-L-R)+'" y="'+Y(o.band[1])+'" height="'+Math.max(0,Y(o.band[0])-Y(o.band[1]))+'"/>':"";
  const tgt=o.target!=null?'<line class="g-tgt" x1="'+L+'" x2="'+(W-R)+'" y1="'+Y(o.target)+'" y2="'+Y(o.target)+'"/><text class="t-tgt" x="'+(W-R)+'" y="'+(Y(o.target)-5)+'" text-anchor="end">'+esc(o.targetLabel||("meta "+f1(o.target,dec)))+'</text>':"";
  // segmentos continuos (se cortan en meses sin dato)
  let d="",area="",seg=[];const flush=()=>{if(seg.length){if(o.area&&seg.length>1)area+='<path class="g-area" d="M'+seg[0][0]+" "+Y(lo)+seg.map(q=>"L"+q[0]+" "+q[1]).join("")+"L"+seg[seg.length-1][0]+" "+Y(lo)+'Z"/>';seg=[];}};
  pts.forEach((p,i)=>{if(p.y==null){flush();d+=" ";return;}const q=[X(i).toFixed(1),Y(p.y).toFixed(1)];d+=(seg.length?"L":"M")+q[0]+" "+q[1];seg.push(q);});flush();
  const path='<path class="g-line" d="'+d+'"/>';
  const dots=pts.map((p,i)=>p.y==null?'':'<circle class="g-dot'+(p.bad?' bad':'')+'" cx="'+X(i)+'" cy="'+Y(p.y)+'" r="4.5"/>'+(o.labels!==false&&pts.length<=12?'<text class="t-val" x="'+X(i)+'" y="'+(Y(p.y)-9)+'" text-anchor="middle">'+f1(p.y,dec)+'</text>':'')+'<rect x="'+(X(i)-14)+'" y="'+T+'" width="28" height="'+(H-T-B)+'" fill="transparent" data-tip="'+esc(p.tip||(p.x+": "+f1(p.y,dec)))+'"/>').join("");
  const xl=pts.map((p,i)=>(pts.length<=12||i%Math.ceil(pts.length/8)===0)?'<text x="'+X(i)+'" y="'+(H-8)+'" text-anchor="middle">'+esc(p.x)+'</text>':'').join("");
  return'<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(o.label||"Tendencia")+'">'+g+band+area+tgt+path+dots+xl+'</svg>';
}
function sparkline(vals,o){o=o||{};const W=90,H=24;const v=vals.filter(x=>x!=null);if(v.length<1)return'<span class="note">—</span>';const lo=Math.min(...v,o.t??Infinity),hi=Math.max(...v,o.t??-Infinity);const r=hi-lo||1;
  const X=i=>2+(vals.length===1?(W-4)/2:i*(W-4)/(vals.length-1)),Y=x=>H-3-(H-6)*(x-lo)/r;let d="";vals.forEach((x,i)=>{if(x==null)return;d+=(d?"L":"M")+X(i).toFixed(1)+" "+Y(x).toFixed(1);});
  return'<svg class="spark" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'">'+(o.t!=null?'<line class="g-tgt" x1="0" x2="'+W+'" y1="'+Y(o.t)+'" y2="'+Y(o.t)+'"/>':'')+'<path class="g-line" d="'+d+'"/>'+vals.map((x,i)=>x==null?"":'<circle class="g-dot" cx="'+X(i)+'" cy="'+Y(x)+'" r="2.6"/>').join("")+'</svg>';}

/* ============================ Tema claro / oscuro ============================ */
function getTheme(){try{return localStorage.getItem("dp_theme")||"dark";}catch(e){return"dark";}}
function setTheme(t){document.documentElement.setAttribute("data-theme",t);try{localStorage.setItem("dp_theme",t);}catch(e){}
  document.querySelectorAll("[data-themeset]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.themeset===t)));}

/* ============================ HABILITACIÓN (simple) ============================ */
function rHabil(){
  let h=head("Habilitación · Res. 3100 de 2019","Marque el estado de cada criterio con un clic. La evidencia (documento, código, ubicación) se registra con el botón «Evidencia».",
   '<button class="btn sm" id="habAdd">'+ico("plus")+'Agregar criterio</button><button class="btn sm" id="habXls">Exportar lista</button><button class="btn sm" onclick="window.print()">Imprimir</button>');
  const tot=S.habil.length,c=S.habil.filter(x=>x.estado==="Cumple").length,nc=S.habil.filter(x=>x.estado==="No cumple").length,na=S.habil.filter(x=>x.estado==="No aplica").length,pv=tot-c-nc-na;
  const sinEv=S.habil.filter(x=>x.estado==="Cumple"&&!(x.cod&&x.ubic)).length;
  h+='<div class="card" style="margin-bottom:14px"><div class="row" style="justify-content:space-between;gap:14px"><div class="row" style="gap:18px">'+[["Cumple",c,"ok"],["No cumple",nc,"bad"],["Por verificar",pv,"warn"],["No aplica",na,"base"]].map(x=>'<div class="stat"><span class="k">'+x[0]+'</span><span class="v" style="font-size:24px;color:var(--'+(x[2]==="base"?"muted":x[2])+')">'+x[1]+'</span></div>').join("")+'</div><div style="flex:1 1 260px;max-width:460px"><div class="progress" style="height:12px"><i style="width:'+(c/tot*100)+'%;background:var(--ok)"></i><i style="width:'+(nc/tot*100)+'%;background:var(--bad)"></i><i style="width:'+(pv/tot*100)+'%;background:var(--warn);opacity:.55"></i></div><p class="note" style="margin:6px 0 0">'+pct(tot?c/tot:null,0)+' verificado como «Cumple»'+(sinEv?' · '+sinEv+' sin evidencia completa':'')+'</p></div></div></div>';
  const fl=VIEW.f||"Todos";
  h+='<div class="filterbar noprint"><input type="search" id="habQ" placeholder="Buscar criterio, código o documento" style="flex:1 1 240px" value="'+esc(VIEW.q||"")+'"><div class="chips">'+["Todos","Por verificar","No cumple","Cumple","Sin evidencia"].map(k=>'<button class="chip'+(fl===k?' on':'')+'" data-hf="'+k+'">'+k+'</button>').join("")+'</div></div>';
  const q=norm(VIEW.q||"");
  HAB_STD.forEach(std=>{
    const all=S.habil.filter(x=>x.std===std);
    const items=all.filter(x=>!q||norm(x.crit+" "+x.doc+" "+x.cod+" "+x.ubic).includes(q)).filter(x=>fl==="Todos"||(fl==="Sin evidencia"?(x.estado==="Cumple"&&!(x.cod&&x.ubic)):x.estado===fl));
    if(!items.length)return;const cc=all.filter(x=>x.estado==="Cumple").length;
    h+='<div class="card hstd"><div class="row" style="justify-content:space-between;margin-bottom:6px"><h3>'+esc(std)+'</h3><span class="note">'+cc+' de '+all.length+' cumple</span></div>'+
     items.map(x=>{const segb=(v,cl,lbl)=>'<button data-hab="'+x.id+'" data-est="'+v+'" class="'+(x.estado===v?cl:"")+'" aria-pressed="'+(x.estado===v)+'">'+(lbl||v)+'</button>';
      const ev=[x.cod&&(x.cod+(x.ver?" v"+x.ver:"")),x.doc,x.ubic].filter(Boolean).join(" · ");
      return'<div class="hrow"><div class="htxt"><div>'+esc(x.crit)+(x.origen==="V"?' <span class="tag warn" title="Cotejar redacción con el texto literal del Manual (num. 11.3.17)">verificar texto</span>':x.origen==="B"?' <span class="tag" title="No es requisito de habilitación; lo pide la EPS, la CAC o la ISPD">contrato / buena práctica</span>':'')+'</div><div class="note">'+(ev?'Evidencia: '+esc(ev):x.estado==="Cumple"?'<span style="color:var(--warn)">Falta registrar la evidencia</span>':'Sin evidencia registrada')+(x.obs&&!/^Prellenado/.test(x.obs)?' · '+esc(x.obs):'')+'</div></div>'+
       '<div class="seg">'+segb("Cumple","on-ok","Sí")+segb("No cumple","on-bad","No")+segb("No aplica","on-base","N/A")+'</div><button class="btn sm" data-habev="'+x.id+'">Evidencia</button></div>';}).join("")+'</div>';
  });
  h+='<details class="box" style="margin-top:12px"><summary>Origen de los criterios</summary><div class="inner small">Los criterios sin etiqueta de procesos prioritarios vienen del compendio de información documentada obligatoria del servicio de diálisis (ConsultorSalud, fuente secundaria). «verificar texto» = redacción operativa: cotéjela con el texto literal del Manual de la Res. 3100 (num. 11.3.17 y criterios para todos los servicios) y corríjala en «Evidencia». «contrato / buena práctica» no es requisito de habilitación. Un clic de nuevo sobre el estado marcado lo devuelve a «Por verificar».</div></details>';
  return h;
}
function dlgHabEv(id){const x=S.habil.find(h=>h.id===id);
  formDlg("Evidencia · "+x.id,[{k:"crit",l:"Criterio",type:"textarea",wide:true},{k:"doc",l:"Documento / evidencia",wide:true,ph:"p. ej. Guía de adecuación de diálisis peritoneal"},{k:"cod",l:"Código",ph:"p. ej. GAG-GU-002"},{k:"ver",l:"Versión"},{k:"ubic",l:"Ubicación",ph:"Archivo físico o ruta digital"},{k:"resp",l:"Responsable"},{k:"fecha",l:"Fecha de verificación",type:"date"},{k:"estado",l:"Estado",type:"select",opts:["Por verificar","Cumple","No cumple","No aplica"],blank:null},{k:"obs",l:"Observación / plan de acción",type:"textarea",wide:true}],x,o=>{Object.assign(x,o);logAct("Evidencia "+x.id);},
   '<div class="row" style="margin-top:12px"><button class="btn sm danger" data-habdel="'+x.id+'">'+ico("trash")+'Eliminar este criterio</button></div>');}

/* ============================ TABLERO ============================ */
function rTablero(){
  const ref=corteDate();const A=activos();const F=finanzas(S.corte);
  const dpa=A.filter(p=>p.modalidad==="DPA").length,dpca=A.filter(p=>p.modalidad==="DPCA").length;
  const byEps=EPS_L.map(e=>[e,A.filter(p=>p.eps===e).length]);
  const al=A.map(p=>({p,A:alertasPac(p)}));const nBad=al.filter(x=>prioridad(x.A)==="bad").length;
  const I=indicadores();const gi=c=>I.find(x=>x.cod===c);
  const ktv=gi("dia_12_adul"),per=gi("dia_19_adul"),hab=gi("EST-01");
  let h=head("Tablero del programa","Resumen al corte de "+MESES[ref.getMonth()]+" "+ref.getFullYear()+". Todo lo que aparece aquí sale de los módulos; haga clic para ir al detalle.");
  h+='<div class="grid g4" style="margin-bottom:14px">'+
    '<div class="card"><div class="stat"><span class="k">Pacientes activos</span><span class="v">'+A.length+'</span><span class="d">DPA '+dpa+' · DPCA '+dpca+'</span></div></div>'+
    '<div class="card"><div class="stat"><span class="k">Con alerta crítica</span><span class="v" style="color:'+(nBad?"var(--bad)":"var(--ok)")+'">'+nBad+'</span><span class="d">de '+A.length+' activos</span></div></div>'+
    '<div class="card"><div class="stat"><span class="k">Kt/V ≥ '+f1(S.cfg.ktv,1)+' (CAC dia_12)</span><span class="v">'+pct(ktv.v,0)+'</span><span class="d">'+ktv.num+' de '+ktv.den+' · '+ktv.det.sd.length+' sin dato válido</span></div></div>'+
    '<div class="card"><div class="stat"><span class="k">Ingreso esperado del mes</span><span class="v" style="font-size:22px">'+money(F.ingreso)+'</span><span class="d">'+byEps.map(([e,n])=>e+" "+n).join(" · ")+'</span></div></div>'+
  '</div>';
  // Hallazgos críticos del programa
  const prog=[];
  const mv=EPS_INFO.MALLAMAS.vigFin;if(mv&&pdate(mv)<ref)prog.push(["bad","<b>Contrato Mallamas vencido.</b> El otrosí 20258600120439-21047 terminó el 31/12/2025 y hay "+A.filter(p=>p.eps==="MALLAMAS").length+" pacientes Mallamas activos. Confirmar prórroga u otrosí vigente antes de facturar.","contratos"]);
  const ktvT=gi("INT-02");if(ktvT.den&&ktvT.v<.9)prog.push(["bad","<b>Calidad del dato de Kt/V:</b> en el trimestre se tomaron "+ktvT.den+" Kt/V y solo "+ktvT.num+" son válidos (D/P > 1, volúmenes improbables, tallas en metros, campos vacíos). Sin Kt/V válido el indicador CAC queda en "+pct(ktv.v,0)+".","pacientes"]);
  prog.push(["warn","<b>Gram y cultivo de líquido peritoneal</b> no aparecen en ningún contrato cargado y la mupirocina del orificio de salida tampoco: definir cobertura con laboratorio y EPS.","contratos"]);
  if(hab.v!=null&&hab.v<1)prog.push(["warn","<b>Habilitación:</b> "+hab.num+" de "+hab.den+" criterios verificados como «Cumple»; "+S.habil.filter(h=>h.estado==="Por verificar").length+" por verificar.","habil"]);
  if(!S.eventos.length)prog.push(["warn","<b>Sin registro de peritonitis ni hospitalizaciones.</b> Si no hubo eventos, déjelo explícito; si los hubo, regístrelos: la tasa de peritonitis (CAC dia_19) depende de este registro.","eventos"]);
  if(!S.catalogo.some(c=>num(c.costo)!=null))prog.push(["info","<b>Costos unitarios vacíos.</b> Sin costos no hay margen ni nota técnica: cargue el valor de compra de soluciones, insumos y medicamentos.","farmacia"]);
  h+='<div class="grid g2"><div class="card"><h3>Hallazgos del programa</h3><p class="sub">Problemas que afectan a toda la cohorte o al contrato.</p><div class="list">'+prog.map(x=>'<div class="click" data-go="'+x[2]+'">'+alertBox(x[0],x[1])+'</div>').join("")+'</div></div>';
  // Qué hacer este mes (una fila por paciente)
  const m=ref.getMonth()+1;
  const filas=A.map(p=>{const sol=solicitudMes(p,S.corte);const val=Object.entries(S.plan.porPaciente).filter(([act,map])=>(map[p.id]||[]).includes(m)).map(([act])=>act);
    const ent=(farmMes(S.corte).entregas[p.id]||{}).fecha;return{p,sol,val,ent};});
  h+='<div class="card"><h3>Qué toca este mes</h3><p class="sub">Laboratorio según contrato, valoraciones programadas y entrega de insumos.</p><div class="tbl-wrap" style="max-height:360px"><table><thead><tr><th>Paciente</th><th>Laboratorio</th><th>Valoraciones</th><th>Insumos</th></tr></thead><tbody>'+
   filas.map(f=>'<tr class="click" data-pac="'+f.p.id+'"><td><b>'+esc(shortName(f.p))+'</b></td><td class="small">'+(f.sol.length?plural(f.sol.length,"examen","exámenes")+(f.sol.some(x=>x.k==="KtV")?' · <b>Kt/V</b>':'')+(f.sol.some(x=>!x.incl)?' <span class="tag warn">'+f.sol.filter(x=>!x.incl).length+' fuera de contrato</span>':''):'<span class="muted">—</span>')+'</td><td class="small">'+(f.val.length?esc(f.val.join(", ")):'<span class="muted">—</span>')+'</td><td>'+(f.ent?pill("Entregado","ok",false):pill("Pendiente","warn",false))+'</td></tr>').join("")+
   '</tbody></table></div><div class="row" style="margin-top:10px"><button class="btn sm" data-go="seguimiento">Solicitud de laboratorio</button><button class="btn sm" data-go="farmacia">Registrar entregas</button></div></div></div>';
  // Cohorte
  h+='<div class="card" style="margin-top:14px"><h3>Cohorte activa</h3><p class="sub">Ordenada por prioridad. Clic en un paciente para abrir su ficha.</p><div class="tbl-wrap"><table><thead><tr><th>Paciente</th><th>EPS</th><th>Mod.</th><th class="num">Kt/V válido</th><th>Tendencia Kt/V</th><th>Alertas</th><th>Prioridad</th></tr></thead><tbody>'+
   al.sort((a,b)=>({bad:0,warn:1,ok:2})[prioridad(a.A)]-({bad:0,warn:1,ok:2})[prioridad(b.A)]).map(({p,A})=>{const lk=lastValidKtv(p.id);const ser=ktvSorted(p.id).map(k=>{const c=ktvCalc(k);return c.estado==="Válido"?c.ktvT:null;});const pr=prioridad(A);
    return'<tr class="click" data-pac="'+p.id+'"><td><b>'+esc(nameCase(p.nombre))+'</b><div class="note mono">'+p.id+' · CC '+esc(p.doc)+'</div></td><td>'+esc(p.eps)+'</td><td>'+p.modalidad+'</td><td class="num">'+(lk?f1(lk.c.ktvT,2):"—")+'</td><td>'+sparkline(ser,{t:S.cfg.ktv})+'</td><td class="small">'+plural(A.filter(a=>a.sev==="bad").length,"crítica","críticas")+' · '+plural(A.filter(a=>a.sev==="warn").length,"advertencia","advertencias")+'</td><td>'+pill(pr==="bad"?"Alta":pr==="warn"?"Media":"Sin alertas",pr)+'</td></tr>';}).join("")+'</tbody></table></div></div>';
  // Indicadores clave
  h+='<div class="grid g3" style="margin-top:14px">'+["dia_14_adul","dia_16_adul","dia_19_adul"].map(c=>indCard(gi(c),true)).join("")+'</div>';
  return h;
}

/* ============================ CONTRATOS ============================ */
function contratoItems(){const out=[];
  EPS_L.forEach(e=>{const c=CONTRATOS[e]||{};(c.paquete||[]).forEach(x=>out.push(Object.assign({eps:e,ev:false},x)));(c.evento||[]).forEach(x=>out.push(Object.assign({eps:e,ev:true},x)));(c.cotizacion||[]).forEach(x=>out.push(Object.assign({eps:e,ev:true},x)));});
  return out;}
let CITEMS=null;
function rContratos(){
  CITEMS=CITEMS||contratoItems();const sub=VIEW.sub||"buscador";const ref=corteDate();
  let h=head("Contratación por EPS","Qué paga cada EPS por diálisis peritoneal, con qué frecuencia, y dónde están las brechas. Fuente: los tres documentos contractuales cargados; lo que no aparece en ellos se marca «no encontrado», que no es lo mismo que «no contratado».");
  h+='<div class="grid g3" style="margin-bottom:14px">'+EPS_L.map(e=>{const c=EPS_INFO[e];const venc=c.vigFin&&pdate(c.vigFin)<ref;const n=activos().filter(p=>p.eps===e).length;
    return'<div class="card"><div class="row" style="justify-content:space-between"><h3>'+e+'</h3>'+(venc?pill("Vencido","bad"):c.vigFin?pill("Vigente","ok"):pill("Vigencia sin soporte","warn"))+'</div><p class="sub">'+esc(c.modalidad)+'</p>'+
    c.codigos.map(x=>'<div class="row" style="justify-content:space-between;border-top:1px solid var(--line);padding:6px 0"><span><span class="mono">'+x[0]+'</span> · '+esc(x[1])+'</span><b class="mono">'+money(x[2])+'</b></div>').join("")+
    '<p class="note" style="margin:8px 0 0">'+esc(c.vigTexto)+'</p><p class="note" style="margin:4px 0 0">'+n+' paciente(s) activo(s) · ingreso mes '+money(n*c.codigos[0][2])+'</p></div>';}).join("")+'</div>';
  h+=tabs([["buscador","Buscador de tecnologías"],["brechas","Matriz de brechas DP"],["reglas","Reglas y exclusiones"],["oblig","Obligaciones contractuales"]],sub);
  if(sub==="buscador"){
    h+='<div class="card"><div class="row"><div style="position:relative;flex:1 1 320px"><input type="search" id="cQ" placeholder="Escriba un medicamento, examen, insumo o código CUPS/ATC (p. ej. eritropoyetina, 903856, mupirocina, cultivo)" style="width:100%;padding-left:34px;min-height:42px;font-size:15px" value="'+esc(VIEW.q||"")+'"><span style="position:absolute;left:10px;top:12px;color:var(--muted);width:18px;height:18px;display:block">'+ico("search")+'</span></div>'+
      '<label class="field inline"><input type="checkbox" id="cEv" '+(VIEW.ev?"checked":"")+'> incluir servicios por evento y cotizaciones</label></div><div id="cRes" style="margin-top:14px"></div></div>';
  }else if(sub==="brechas"){
    let cat="";h+='<div class="tbl-wrap"><table class="matrix"><thead><tr><th>Concepto</th>'+EPS_L.map(e=>'<th class="c">'+e+'</th>').join("")+'<th>Observación</th></tr></thead><tbody>'+
     BRECHAS.map(b=>{let row="";if(b[0]!==cat){cat=b[0];row+='<tr><td colspan="5" style="background:var(--surface-2);font-weight:700;color:var(--accent)">'+esc(cat)+'</td></tr>';}
      return row+'<tr><td>'+esc(b[1])+'</td>'+b[2].map(s=>'<td class="st st-'+s+'">'+({S:"✔ Incluido",N:"✖ No encontrado",E:"◐ Por evento",Q:"? Ambiguo"})[s]+'</td>').join("")+'<td class="small muted">'+esc(b[3])+'</td></tr>';}).join("")+'</tbody></table></div>';
    h+='<p class="note">✔ explícito en el paquete/plan · ◐ contratado por evento, fuera del paquete · ✖ no aparece en los documentos cargados · ? ambiguo o contradictorio dentro del mismo documento.</p>';
  }else if(sub==="reglas"){
    h+='<div class="grid g3">'+EPS_L.map(e=>{const c=EPS_INFO[e];return'<div class="card"><h3>'+e+'</h3><p class="sub">'+esc(c.doc)+'</p><h4 class="small" style="margin:8px 0 4px;color:var(--muted)">REGLAS DE AUTORIZACIÓN, FACTURACIÓN Y RUPTURA</h4><ul class="small" style="padding-left:18px;margin:0">'+c.reglas.map(r=>'<li style="margin-bottom:5px">'+esc(r)+'</li>').join("")+'</ul><h4 class="small" style="margin:12px 0 4px;color:var(--muted)">EXCLUSIONES</h4><p class="small" style="margin:0">'+esc(c.excluye)+'</p><p class="note" style="margin-top:10px">Firmas: '+esc(c.firmas)+'</p></div>';}).join("")+'</div>';
  }else{
    h+='<div class="tbl-wrap"><table><thead><tr><th>EPS</th><th>Obligación</th><th>Estado</th><th>Evidencia</th></tr></thead><tbody>'+S.oblig.map(o=>'<tr><td>'+esc(o.eps)+'</td><td>'+esc(o.txt)+'</td><td><select data-obl="'+o.id+'" data-k="estado">'+opt(["Por verificar","Cumple","No cumple","No aplica"],o.estado)+'</select></td><td><input type="text" data-obl="'+o.id+'" data-k="evid" value="'+esc(o.evid)+'" placeholder="Soporte" style="width:100%"></td></tr>').join("")+'</tbody></table></div>';
  }
  return h;
}
function contratoBuscar(){
  const box=$("cRes");if(!box)return;const raw=VIEW.q||"";const q=norm(raw);
  if(q.length<2){box.innerHTML='<p class="note">Escriba al menos 2 caracteres. Sugerencias: '+["eritropoyetina","hierro","calcitriol","mupirocina","cefazolina","fluconazol","albumina","PTH","liquido peritoneal","cultivo","cateter","nutricion","890239"].map(s=>'<button class="btn sm ghost" data-csug="'+s+'">'+s+'</button>').join(" ")+'</p>';return;}
  const toks=q.split(" ").filter(Boolean).map(t=>SINON[t]?[t,norm(SINON[t])]:[t]);
  const hit=x=>{const s=norm(x.desc+" "+x.cod+" "+(x.nota||""));return toks.every(alts=>alts.some(a=>s.includes(a)));};
  const res=CITEMS.filter(x=>(VIEW.ev||!x.ev)&&hit(x));
  const byE={};EPS_L.forEach(e=>byE[e]=res.filter(x=>x.eps===e));
  let h='<div class="grid g3" style="margin-bottom:12px">'+EPS_L.map(e=>{const L=byE[e];const pk=L.filter(x=>!x.ev).length,ev=L.filter(x=>x.ev).length;
    const st=pk?["ok","Contratado en el paquete DP"]:ev?["warn","Solo por evento / cotización"]:["bad","No encontrado en el documento"];
    return'<div class="card flat"><div class="row" style="justify-content:space-between"><b>'+e+'</b>'+pill(st[1],st[0])+'</div><p class="note" style="margin:6px 0 0">'+pk+' ítem(s) en paquete'+(VIEW.ev?' · '+ev+' por evento/cotización':'')+'</p></div>';}).join("")+'</div>';
  const br=BRECHAS.filter(b=>toks.every(alts=>alts.some(a=>norm(b[1]+" "+b[3]).includes(a))));
  if(br.length)h+=br.map(b=>alertBox("info","<b>Matriz de brechas · "+esc(b[1])+":</b> "+EPS_L.map((e,i)=>e+" "+({S:"incluido",N:"no encontrado",E:"por evento",Q:"ambiguo"})[b[2][i]]).join(" · ")+(b[3]?". "+esc(b[3]):""))).join("")+'<div style="height:10px"></div>';
  h+='<div class="tbl-wrap" style="max-height:520px"><table><thead><tr><th>EPS</th><th>Código</th><th>Descripción</th><th>Grupo</th><th>Frecuencia</th><th>Tipo</th></tr></thead><tbody>'+
   (res.length?res.slice(0,400).map(x=>'<tr><td>'+esc(x.eps)+'</td><td class="mono small">'+esc(x.cod)+'</td><td>'+esc(x.desc)+(x.nota?'<div class="note">'+esc(x.nota)+'</div>':'')+'</td><td class="small">'+esc(x.grupo)+'</td><td class="small">'+esc(x.freq)+'</td><td class="small muted">'+esc(x.tipo)+'</td></tr>').join(""):'<tr><td colspan="6" class="muted">Sin coincidencias en los documentos cargados. Pruebe con el nombre genérico o active «incluir servicios por evento».</td></tr>')+'</tbody></table></div>';
  if(res.length>400)h+='<p class="note">Se muestran 400 de '+res.length+'. Afine la búsqueda.</p>';
  box.innerHTML=h;
}

/* ============================ Diálogo genérico ============================ */
function formDlg(title,fields,obj,onSave,extraHtml){
  obj=obj||{};
  const fh=fields.map(f=>{const v=obj[f.k]??f.def??"";const id="fd_"+f.k;let inp;
    if(f.type==="select")inp='<select id="'+id+'">'+opt(f.opts,v,f.blank!=null?f.blank:"—")+'</select>';
    else if(f.type==="textarea")inp='<textarea id="'+id+'" placeholder="'+esc(f.ph||"")+'">'+esc(v)+'</textarea>';
    else inp='<input id="'+id+'" type="'+(f.type||"text")+'" value="'+esc(v)+'" placeholder="'+esc(f.ph||"")+'"'+(f.step?' step="'+f.step+'"':'')+'>';
    return'<label class="field'+(f.wide?" wide":"")+'">'+esc(f.l)+inp+(f.help?'<span class="note" style="font-weight:400">'+esc(f.help)+'</span>':'')+'</label>';}).join("");
  $("dlg").innerHTML='<div class="dlg" role="dialog" aria-modal="true"><h3>'+esc(title)+'</h3><div class="formgrid">'+fh+'</div>'+(extraHtml||"")+'<div class="actions"><button class="btn" id="dlgCancel">Cancelar</button><button class="btn primary" id="dlgOk">Guardar</button></div></div>';
  $("dlg").hidden=false;
  $("dlgCancel").onclick=()=>{$("dlg").hidden=true;};
  $("dlgOk").onclick=()=>{const o={};fields.forEach(f=>{let v=$("fd_"+f.k).value;if(f.type==="number")v=v===""?null:num(v);o[f.k]=v;});
    const err=fields.filter(f=>f.req&&(o[f.k]==null||o[f.k]==="")).map(f=>f.l);if(err.length){toast("Falta: "+err.join(", "));return;}
    if(onSave(o)!==false){$("dlg").hidden=true;save();render();}};
  const first=$("dlg").querySelector("input,select,textarea");if(first)first.focus();
}

/* ============================ PACIENTES ============================ */
function rPacientes(){
  if(VIEW.pac)return rFicha(pac(VIEW.pac));
  const showAll=VIEW.all;const L=S.pacientes.filter(p=>showAll||isActive(p));
  let h=head("Pacientes en diálisis peritoneal","Cohorte con los datos que mueven la gestión clínica: adecuación, laboratorio crítico, eventos y pendientes. Clic para abrir la ficha.",
   '<label class="field inline"><input type="checkbox" id="pAll" '+(showAll?"checked":"")+'> incluir egresados</label><button class="btn sm primary" id="pNew">'+ico("plus")+'Nuevo paciente</button>');
  h+='<div class="tbl-wrap"><table><thead><tr><th>Paciente</th><th>EPS</th><th>Mod.</th><th>Estado</th><th class="num">Kt/V</th><th class="num">Hb</th><th class="num">Alb</th><th class="num">P</th><th class="num">PTH</th><th>Trasplante</th><th>Alertas</th></tr></thead><tbody>'+
  L.map(p=>{const A=alertasPac(p);const lk=lastValidKtv(p.id);const v=(ex,m,lo,hi,d)=>{const x=lastLab(p.id,ex,m);if(!x)return'<td class="num muted">—</td>';const n=num(x.v);const bad=(lo!=null&&n<lo)||(hi!=null&&n>hi);return'<td class="num" style="color:'+(bad?"var(--bad)":"inherit")+'" title="'+fd(x.fecha)+'">'+f1(n,d)+'</td>';};
   return'<tr class="click" data-pac="'+p.id+'"><td><b>'+esc(nameCase(p.nombre))+'</b><div class="note mono">'+p.id+' · '+esc(p.tipoDoc)+' '+esc(p.doc)+' · '+(p.sexo||"?")+' · '+(p.edad||"?")+' a</div></td><td>'+esc(p.eps)+'</td><td>'+esc(p.modalidad)+'</td><td>'+(isActive(p)?pill("Activo","ok",false):pill(p.estado,"base",false))+'</td>'+
   '<td class="num" style="color:'+(lk&&lk.c.ktvT<S.cfg.ktv?"var(--bad)":"inherit")+'">'+(lk?f1(lk.c.ktvT,2):'<span class="muted">—</span>')+'</td>'+v("Hb",3,S.cfg.hb,null,1)+v("Alb",3,S.cfg.alb,null,1)+v("P",3,S.cfg.pLo,S.cfg.pHi,1)+v("PTH",6,S.cfg.pthLo,S.cfg.pthHi,0)+
   '<td class="small">'+esc(p.tx)+'</td><td>'+(isActive(p)?pill(A.filter(a=>a.sev==="bad").length+" / "+A.filter(a=>a.sev==="warn").length,prioridad(A)):"")+'</td></tr>';}).join("")+'</tbody></table></div>';
  h+='<p class="note">Alertas: críticas / advertencias. Valores en rojo fuera de meta (CAC 2026). Hb, albúmina y fósforo: último trimestre; PTH: últimos 6 meses; Kt/V: último válido en '+S.cfg.ktvVentana+' meses.</p>';
  return h;
}
const PAC_FIELDS=()=>[
 {k:"nombre",l:"Nombre completo",req:true,wide:true},{k:"tipoDoc",l:"Tipo de documento",type:"select",opts:["CC","TI","CE","PA","PPT"],def:"CC"},{k:"doc",l:"Número de documento",req:true},
 {k:"sexo",l:"Sexo",type:"select",opts:[["F","Femenino"],["M","Masculino"]]},{k:"fnac",l:"Fecha de nacimiento",type:"date"},{k:"edad",l:"Edad (si no hay fecha de nacimiento)",type:"number"},
 {k:"eps",l:"EPS",type:"select",opts:EPS_L,req:true},{k:"modalidad",l:"Modalidad",type:"select",opts:[["DPA","DPA (automatizada)"],["DPCA","DPCA (manual)"]],req:true},
 {k:"municipio",l:"Municipio de residencia"},{k:"telefono",l:"Teléfono"},{k:"cuidador",l:"Cuidador / acudiente"},
 {k:"fIngresoTRR",l:"Inicio de terapia de reemplazo renal",type:"date"},{k:"fIngresoDP",l:"Ingreso a DP",type:"date"},
 {k:"etiologia",l:"Etiología de la ERC"},{k:"dm",l:"Diabetes",type:"select",opts:["Sí","No"]},{k:"hta",l:"Hipertensión",type:"select",opts:["Sí","No"]},
 {k:"diuresis",l:"Diuresis residual reportada (mL/24 h)",type:"number"},{k:"tx",l:"Trasplante (idoneidad)",type:"select",opts:TX_EST,blank:null},{k:"vacHB",l:"Vacunación hepatitis B",type:"select",opts:["Esquema completo","En curso","No respondedor","Sin vacunar","Inmune natural"]},
 {k:"estado",l:"Estado en el programa",type:"select",opts:ESTADOS,blank:null},{k:"fEgreso",l:"Fecha de egreso de DP",type:"date"},{k:"causaEgreso",l:"Causa / detalle del egreso"},
 {k:"excPTH",l:"Exclusión PTH (paratiroidectomía / antineoplásicos)",type:"select",opts:["No","Paratiroidectomía realizada","Paratiroidectomía programada","Antineoplásicos"]}
];
function editPac(p){const isNew=!p;p=p||{};
  formDlg(isNew?"Nuevo paciente":"Editar datos · "+nameCase(p.nombre),PAC_FIELDS(),p,o=>{
    if(o.fnac){const b=pdate(o.fnac),r=corteDate();o.edad=r.getFullYear()-b.getFullYear()-((r.getMonth()<b.getMonth()||(r.getMonth()===b.getMonth()&&r.getDate()<b.getDate()))?1:0);}
    if(isNew){if(S.pacientes.some(x=>x.doc===o.doc)){toast("Ya existe un paciente con ese documento.");return false;}
      const n=S.pacientes.length+1;let id;do{id="DP-"+String(n).padStart(3,"0");}while(S.pacientes.some(x=>x.id===id)&&(n++));
      S.pacientes.push(Object.assign({id,cateter:{},obsFuente:[],nepro:false},o));logAct("Nuevo paciente "+id);VIEW.pac=id;}
    else{Object.assign(p,o);logAct("Edita paciente "+p.id);}
  });}
function rFicha(p){
  if(!p)return'<p>Paciente no encontrado.</p>';
  const sub=VIEW.sub||"resumen";const A=alertasPac(p);const pr=prioridad(A);
  let h='<div class="row noprint" style="margin-bottom:10px"><button class="btn sm ghost" data-go="pacientes">'+ico("back")+'Volver a la cohorte</button></div>';
  h+='<div class="mhead"><div class="ptitle"><h2>'+esc(nameCase(p.nombre))+'</h2>'+(isActive(p)?pill("Activo","ok"):pill(p.estado,"base"))+pill(p.modalidad,"acc",false)+pill(p.eps,"base",false)+(isActive(p)?pill("Prioridad "+(pr==="bad"?"alta":pr==="warn"?"media":"baja"),pr):"")+'</div><div class="row noprint"><button class="btn sm" id="pEdit">Editar datos</button><button class="btn sm" onclick="window.print()">Imprimir ficha</button></div></div>';
  h+='<p class="note mono" style="margin-top:-8px">'+p.id+' · '+esc(p.tipoDoc)+' '+esc(p.doc)+' · '+(p.sexo==="F"?"Femenino":p.sexo==="M"?"Masculino":"Sexo sin dato")+' · '+(p.edad?p.edad+" años":"edad sin dato")+(p.municipio?" · "+esc(p.municipio):"")+'</p>';
  h+=tabs([["resumen","Resumen"],["ktv","Adecuación (Kt/V)"],["lab","Laboratorio y tendencias"],["presc","Prescripción y fórmula"],["eventos","Eventos"],["valor","Valoraciones"],["visitas","Visitas"]],sub);
  if(sub==="resumen"){
    h+='<div class="grid g2"><div class="card"><h3>Alertas activas</h3><p class="sub">Calculadas al corte; se resuelven registrando el dato o la actividad.</p><div class="list">'+(A.length?A.map(a=>alertBox(a.sev,esc(a.t))).join(""):alertBox("ok","Sin alertas."))+'</div>'+((p.obsFuente||[]).length?'<details class="box" style="margin-top:10px"><summary>Observaciones de los archivos fuente ('+p.obsFuente.length+')</summary><div class="inner"><ul class="small" style="padding-left:18px;margin:0">'+p.obsFuente.map(o=>'<li style="margin-bottom:5px">'+esc(o)+'</li>').join("")+'</ul></div></details>':'')+'</div>';
    const lk=lastValidKtv(p.id);const g=(ex,m,d)=>{const x=lastLab(p.id,ex,m);return x?f1(num(x.v),d)+' <span class="note">'+fd(x.fecha)+'</span>':'<span class="muted">sin dato</span>';};
    h+='<div class="card"><h3>Datos clave</h3><dl class="kv" style="margin-top:10px">'+
     '<dt>Kt/V total válido</dt><dd>'+(lk?'<b>'+f1(lk.c.ktvT,2)+'</b> <span class="note">'+ymLabel(lk.k.periodo)+'</span>':'<span class="muted">sin dato válido</span>')+'</dd>'+
     '<dt>Hemoglobina</dt><dd>'+g("Hb",3,1)+'</dd><dt>Albúmina</dt><dd>'+g("Alb",3,1)+'</dd><dt>Fósforo</dt><dd>'+g("P",3,1)+'</dd><dt>Calcio</dt><dd>'+g("Ca",3,1)+'</dd><dt>PTH</dt><dd>'+g("PTH",6,0)+'</dd><dt>Potasio</dt><dd>'+g("K",3,1)+'</dd>'+
     '<dt>Diuresis residual</dt><dd>'+(lastLab(p.id,"Diuresis",12)?g("Diuresis",12,0)+" mL":(num(p.diuresis)!=null?f1(num(p.diuresis),0)+" mL (reportada)":'<span class="muted">sin dato</span>'))+'</dd>'+
     '<dt>Ingreso a TRR / DP</dt><dd>'+fd(p.fIngresoTRR)+' / '+fd(p.fIngresoDP)+'</dd><dt>Etiología</dt><dd>'+esc(p.etiologia||"—")+'</dd><dt>DM / HTA</dt><dd>'+esc((p.dm||"?")+" / "+(p.hta||"?"))+'</dd>'+
     '<dt>Trasplante</dt><dd>'+esc(p.tx)+'</dd><dt>Vacuna HB</dt><dd>'+esc(p.vacHB||"—")+'</dd><dt>Suplemento nutricional</dt><dd>'+(p.nepro===true?"Sí (Nepro)":p.nepro===false?"No":"Sin dato")+'</dd><dt>Cuidador</dt><dd>'+esc(p.cuidador||"—")+'</dd><dt>Teléfono</dt><dd>'+esc(p.telefono||"—")+'</dd></dl></div></div>';
  }
  if(sub==="ktv"){
    const L=ktvSorted(p.id);const pts=L.map(k=>{const c=ktvCalc(k);return{x:k.periodo?ymLabel(k.periodo):"previa",y:c.ktvT!=null?+c.ktvT.toFixed(2):null,bad:c.estado!=="Válido",tip:(k.periodo?ymLabel(k.periodo):"Medición previa sin fecha")+": "+(c.ktvT!=null?f1(c.ktvT,2):"—")+" · "+c.estado};});
    h+='<div class="grid g2"><div class="card"><h3>Tendencia del Kt/V total semanal</h3><p class="sub">Puntos rojos = medición no válida (se muestra el valor calculado, pero no cuenta para indicadores).</p>'+lineChart(pts,{target:S.cfg.ktv,dec:2,label:"Kt/V",floor0:true})+'</div>';
    h+='<div class="card"><h3>Cómo se calcula</h3><ol class="small" style="padding-left:18px;margin:6px 0">'+
     '<li>D/P urea = BUN del efluente de 24 h / BUN sérico.</li><li>Kt/V peritoneal semanal = volumen drenado 24 h (L) × D/P × 7 / V.</li><li>V por Watson: hombres 2,447 − 0,09516·edad + 0,1074·talla(cm) + 0,3362·peso; mujeres −2,097 + 0,1069·talla + 0,2466·peso.</li><li>Kt/V renal semanal = orina 24 h (L) × (BUN urinario / BUN sérico) × 7 / V.</li><li>Meta operativa CAC 2026 (dia_12): Kt/V total ≥ 1,7. ISPD 2020 pide además evaluar síntomas, volumen, nutrición y FRR: un número bajo es señal de revisión, no un fracaso por sí solo.</li></ol>'+
     '<p class="note">Reglas de validez: datos completos, talla en cm, D/P ≤ 1,05, volumen drenado ≥ 4 L, Kt/V ≤ 4,5 y sin marca de dato dudoso.</p></div></div>';
    h+='<div class="row" style="margin:14px 0 8px;justify-content:space-between"><h3 style="margin:0;font-family:var(--f-display)">Mediciones</h3><button class="btn sm primary" id="kNew">'+ico("plus")+'Registrar Kt/V</button></div>';
    h+='<div class="tbl-wrap"><table><thead><tr><th>Periodo</th><th class="num">Peso</th><th class="num">Talla</th><th class="num">Vol. drenado</th><th class="num">BUN ef.</th><th class="num">BUN sér.</th><th class="num">D/P</th><th class="num">V</th><th class="num">Kt/V p</th><th class="num">Kt/V r</th><th class="num">Kt/V total</th><th>Estado</th><th></th></tr></thead><tbody>'+
     L.map(k=>{const c=ktvCalc(k);return'<tr><td>'+esc(k.periodo?ymLabel(k.periodo):k.etiqueta||"sin fecha")+'</td><td class="num">'+f1(num(k.peso))+'</td><td class="num">'+f1(num(k.talla),num(k.talla)<3?2:0)+'</td><td class="num">'+f1(num(k.vol),0)+'</td><td class="num">'+f1(num(k.bunEf),2)+'</td><td class="num">'+f1(num(k.bunS),2)+'</td><td class="num">'+f1(c.DP,2)+'</td><td class="num">'+f1(c.V,1)+'</td><td class="num">'+f1(c.ktvP,2)+'</td><td class="num">'+f1(c.ktvR,2)+'</td><td class="num"><b>'+f1(c.ktvT,2)+'</b></td><td>'+pill(c.estado,c.estado==="Válido"?(c.ktvT>=S.cfg.ktv?"ok":"bad"):c.estado==="No válido"?"bad":"warn")+(c.motivos.length?'<div class="note">'+esc(c.motivos.join(" · "))+'</div>':'')+(k.obs?'<div class="note">'+esc(k.obs)+'</div>':'')+'</td><td class="noprint"><button class="btn sm ghost" data-kedit="'+k.id+'">Editar</button></td></tr>';}).join("")+'</tbody></table></div><p class="note">Fuente de las mediciones cargadas: FORMULA DE KTV (2).xlsx. La hoja «KtV_PD (2)» no tiene fecha; se muestra como medición previa.</p>';
  }
  if(sub==="lab"){
    const keys=["Hb","Alb","P","Ca","K","PTH","BUN","Creat","Ferritina","TSAT","Glic","HbA1c","Diuresis","Peso"];
    const tgt={Hb:{t:S.cfg.hb,band:[10,11.5]},Alb:{t:S.cfg.alb},P:{band:[S.cfg.pLo,S.cfg.pHi]},Ca:{t:S.cfg.ca,tl:"hipercalcemia > "+S.cfg.ca},PTH:{band:[S.cfg.pthLo,S.cfg.pthHi],d:0},K:{band:[3.5,5.5]},Diuresis:{t:100,tl:"100 mL (umbral KRU)",d:0}};
    h+='<div class="row" style="justify-content:space-between;margin-bottom:10px"><p class="note" style="margin:0">Metas: CAC 2026 (Hb ≥ 10, albúmina ≥ 3,5 en DP, fósforo 2,5–6, PTH 130–600, Ca total > 10,5 = hipercalcemia). Banda de Hb 10–11,5 como referencia de manejo con AEE (KDIGO 2012), editable.</p><button class="btn sm primary" id="lNew">'+ico("plus")+'Registrar resultados</button></div>';
    h+='<div class="grid g3">'+keys.map(k=>{const L=labsOf(p.id,k);if(!L.length)return"";const o=tgt[k]||{};return'<div class="card"><h3>'+esc(EX[k].l)+' <span class="note">'+esc(EX[k].u||"")+'</span></h3>'+lineChart(L.map(l=>({x:fd(l.fecha).slice(3),y:num(l.v),tip:fd(l.fecha)+": "+f1(num(l.v),o.d==null?1:o.d)+" "+(EX[k].u||"")})),{target:o.t,targetLabel:o.tl,band:o.band,dec:o.d==null?1:o.d,h:140,label:EX[k].l})+'</div>';}).join("")+'</div>';
    const all=S.labs.filter(l=>l.pac===p.id).sort((a,b)=>a.fecha<b.fecha?1:-1);
    h+='<div class="tbl-wrap" style="margin-top:14px;max-height:380px"><table><thead><tr><th>Fecha</th><th>Examen</th><th class="num">Resultado</th><th>Fuente / nota</th><th></th></tr></thead><tbody>'+(all.length?all.map(l=>'<tr><td>'+fd(l.fecha)+'</td><td>'+esc(EX[l.ex]?EX[l.ex].l:l.ex)+'</td><td class="num">'+esc(l.v)+' '+esc(EX[l.ex]&&EX[l.ex].u||"")+'</td><td class="small muted">'+esc(l.fuente||"")+'</td><td class="noprint"><button class="btn sm ghost danger" data-ldel="'+l.id+'">'+ico("trash")+'</button></td></tr>').join(""):'<tr><td colspan="5" class="muted">Sin resultados. Solo hay BUN sérico tomado de las hojas de Kt/V; los demás laboratorios no venían en los archivos.</td></tr>')+'</tbody></table></div>';
  }
  if(sub==="presc"){
    const pr=p.presc||{};
    h+='<div class="grid g2"><div class="card"><h3>Prescripción de DP</h3><p class="sub">Lo que el nefrólogo ordenó. Se usa para revisar coherencia con la fórmula de insumos.</p><dl class="kv">'+
     [["Modalidad",p.modalidad],["Volumen total / sesión (L)",pr.volTotal],["N.º recambios o ciclos",pr.ciclos],["Volumen de infusión (mL)",pr.volInf],["Tiempo total en cicladora (h)",pr.tiempo],["Último recambio diurno",pr.diurno],["Concentraciones",pr.conc],["Icodextrina",pr.ico],["Catéter (tipo / fecha implante)",(p.cateter&&p.cateter.tipo||"—")+" / "+fd(p.cateter&&p.cateter.fImplante)],["Fecha de la prescripción",fd(pr.fecha)]].map(x=>'<dt>'+x[0]+'</dt><dd>'+esc(x[1]||"—")+'</dd>').join("")+'</dl><div class="row" style="margin-top:12px"><button class="btn sm" id="prEdit">Editar prescripción</button></div></div>';
    const F=S.formula.filter(f=>f.pac===p.id);
    const sol=F.filter(f=>/^D\d/.test(f.cod));const litros=sol.reduce((a,f)=>a+f.cant*(/6000/.test(f.cod)?6:2),0);
    h+='<div class="card"><h3>Fórmula mensual de insumos y medicamentos</h3><p class="sub">Cantidades por mes. Se edita en Farmacia › Fórmula por paciente.</p><div class="tbl-wrap"><table><thead><tr><th>Producto</th><th class="num">Cantidad/mes</th><th>Incluido en paquete '+esc(p.eps)+'</th></tr></thead><tbody>'+
     F.map(f=>{const c=S.catalogo.find(x=>x.cod===f.cod)||{nombre:f.cod};const ni=NO_INCL[f.cod]&&NO_INCL[f.cod].includes(p.eps);return'<tr><td>'+esc(c.nombre)+'</td><td class="num">'+f.cant+' '+esc(c.unidad||"")+'</td><td>'+(ni?pill("No incluido","bad",false):/^D\d|CASSETTE|BDREN|MINICAP/.test(f.cod)&&p.eps!=="NUEVA EPS"?pill("No explícito","warn",false):pill("Sí / pertinencia","ok",false))+'</td></tr>';}).join("")+'</tbody></table></div>'+
     '<p class="note">Solución al mes: '+f1(litros,0)+' L ('+f1(litros/30,1)+' L/día en promedio).'+(pr.volTotal?' Prescrito: '+esc(pr.volTotal)+' L/sesión.':' Registre la prescripción para comparar.')+'</p></div></div>';
  }
  if(sub==="eventos"){h+=tablaEventos(S.eventos.filter(e=>e.pac===p.id),p.id);}
  if(sub==="valor"){
    const L=S.valoraciones.filter(v=>v.pac===p.id).sort((a,b)=>a.fecha<b.fecha?1:-1);
    h+='<div class="row" style="justify-content:flex-end;margin-bottom:10px"><button class="btn sm primary" id="vNew">'+ico("plus")+'Registrar valoración</button></div><div class="tbl-wrap"><table><thead><tr><th>Fecha</th><th>Disciplina</th><th>Profesional</th><th>Hallazgos / conducta</th><th></th></tr></thead><tbody>'+
     (L.length?L.map(v=>'<tr><td>'+fd(v.fecha)+'</td><td>'+esc(v.disc)+(v.escala?'<div class="note">'+esc(v.escala)+(v.puntaje!=null?" · "+v.puntaje:"")+'</div>':'')+'</td><td>'+esc(v.prof||"")+'</td><td class="small">'+esc(v.nota||"")+'</td><td class="noprint"><button class="btn sm ghost danger" data-vdel="'+v.id+'">'+ico("trash")+'</button></td></tr>').join(""):'<tr><td colspan="5" class="muted">Sin valoraciones registradas. La hoja de control solo traía la programación, no las atenciones realizadas.</td></tr>')+'</tbody></table></div>';
  }
  if(sub==="visitas"){h+=tablaVisitas(S.visitas.filter(v=>v.pac===p.id),p.id);}
  return h;
}
const KTV_FIELDS=[{k:"periodo",l:"Periodo (mes de la recolección)",type:"month",req:true},{k:"peso",l:"Peso (kg)",type:"number",step:"0.1"},{k:"talla",l:"Talla (cm)",type:"number",help:"En centímetros, no en metros."},{k:"edad",l:"Edad (años)",type:"number"},
 {k:"vol",l:"Volumen drenado 24 h (mL)",type:"number"},{k:"bunEf",l:"BUN efluente (mg/dL)",type:"number",step:"0.01"},{k:"bunS",l:"BUN sérico (mg/dL)",type:"number",step:"0.01"},{k:"orina",l:"Orina 24 h (mL)",type:"number",help:"0 si anúrico"},{k:"ureaOr",l:"BUN urinario (mg/dL)",type:"number",step:"0.01"},
 {k:"dudoso",l:"Marcar como dato dudoso",type:"select",opts:[["","No"],["1","Sí"]],blank:null},{k:"obs",l:"Observación",wide:true}];
function editKtv(pid,k){const isNew=!k;const p=pac(pid);k=k||{sexo:p.sexo,edad:p.edad};
  formDlg((isNew?"Registrar":"Editar")+" Kt/V · "+nameCase(p.nombre),KTV_FIELDS,Object.assign({},k,{dudoso:k.dudoso?"1":""}),o=>{o.dudoso=o.dudoso==="1";
    if(isNew){S.ktv.push(Object.assign({id:uid("K"),pac:pid,sexo:p.sexo,fuente:"Registro manual"},o));if(o.bunS!=null)S.labs.push({id:uid("L"),pac:pid,fecha:o.periodo+"-28",ex:"BUN",v:o.bunS,fuente:"BUN sérico del Kt/V"});}
    else Object.assign(k,o);logAct("Kt/V "+pid+" "+o.periodo);},'<p class="note" style="margin-top:10px">El sistema calcula D/P, V de Watson y Kt/V al guardar, y valida la plausibilidad.</p>');}
function editLabs(pid){const p=pac(pid);
  const keys=["Hb","BUN","Creat","K","Na","Ca","P","Alb","PTH","FA","Ferritina","TSAT","Glic","HbA1c","AntiHBs","HBsAg","AntiVHC","VIH","VDRL","ColT","LDL","TG","Diuresis","Peso","TAS"];
  const fields=[{k:"fecha",l:"Fecha de toma",type:"date",req:true}].concat(keys.map(k=>EX[k].txt?{k,l:EX[k].l,type:"select",opts:EX[k].txt}:{k,l:EX[k].l+(EX[k].u?" ("+EX[k].u+")":""),type:"number",step:"0.01"}));
  formDlg("Registrar resultados · "+nameCase(p.nombre),fields,{},o=>{let n=0,bad=[];keys.forEach(k=>{const v=o[k];if(v==null||v==="")return;const e=EX[k];if(!e.txt&&(v<e.lo||v>e.hi)){bad.push(e.l);return;}S.labs.push({id:uid("L"),pac:pid,fecha:o.fecha,ex:k,v,fuente:"Registro manual"});n++;});
    if(bad.length){toast("Fuera de rango plausible, no guardado: "+bad.join(", "));}if(n){logAct(n+" resultados "+pid);}else if(!bad.length){toast("No se ingresó ningún resultado.");return false;}});}
function editPresc(p){const pr=p.presc||{};
  formDlg("Prescripción de DP · "+nameCase(p.nombre),[{k:"fecha",l:"Fecha de la orden",type:"date"},{k:"volTotal",l:"Volumen total por sesión (L)",type:"number",step:"0.1"},{k:"ciclos",l:"N.º recambios (DPCA) o ciclos (DPA)",type:"number"},{k:"volInf",l:"Volumen de infusión (mL)",type:"number"},{k:"tiempo",l:"Tiempo total en cicladora (h)",type:"number",step:"0.5"},{k:"diurno",l:"Último recambio / permanencia diurna"},{k:"conc",l:"Concentraciones de glucosa",ph:"p. ej. 1,5 % + 2,5 %"},{k:"ico",l:"Icodextrina",type:"select",opts:["No","Sí"]},{k:"catTipo",l:"Tipo de catéter"},{k:"catFecha",l:"Fecha de implante del catéter",type:"date"}],
   Object.assign({},pr,{catTipo:p.cateter&&p.cateter.tipo,catFecha:p.cateter&&p.cateter.fImplante}),o=>{p.cateter={tipo:o.catTipo,fImplante:o.catFecha};delete o.catTipo;delete o.catFecha;p.presc=o;logAct("Prescripción "+p.id);});}
function editVal(pid){formDlg("Registrar valoración",[{k:"pac",l:"Paciente",type:"select",opts:S.pacientes.map(p=>[p.id,p.id+" · "+nameCase(p.nombre)]),def:pid,req:true},{k:"fecha",l:"Fecha",type:"date",req:true},{k:"disc",l:"Disciplina",type:"select",opts:DISCIPLINAS,req:true},{k:"prof",l:"Profesional"},{k:"escala",l:"Escala (si es calidad de vida)",ph:"p. ej. KDQOL-36"},{k:"puntaje",l:"Puntaje",type:"number"},{k:"nota",l:"Hallazgos y conducta",type:"textarea",wide:true}],{},o=>{S.valoraciones.push(Object.assign({id:uid("V")},o));logAct("Valoración "+o.disc+" "+o.pac);});}

/* ============================ SEGUIMIENTO ============================ */
function rSeguimiento(){
  const sub=VIEW.sub||"solicitud";const ym=S.corte;const m=+ym.split("-")[1];const y=ym.split("-")[0];
  let h=head("Calendario y laboratorio","Solicitud mensual de laboratorio según lo que cubre el contrato de cada EPS, y calendario anual de actividades del programa (hoja de control).");
  h+=tabs([["solicitud","Solicitud de laboratorio del mes"],["calendario","Calendario anual"],["freq","Frecuencias contractuales"]],sub);
  if(sub==="solicitud"){
    const A=activos();
    h+=alertBox("info","Calendario institucional: trimestral en "+S.cfg.anchorT.map(x=>MES3[x-1]).join(", ")+"; semestral en "+S.cfg.anchorS.map(x=>MES3[x-1]).join(", ")+"; anual en "+S.cfg.anchorA.map(x=>MES3[x-1]).join(", ")+" (editable en Configuración). Lo marcado «fuera de contrato» lo necesita la clínica o la CAC, pero el contrato de esa EPS no lo incluye en esa frecuencia: es costo de la IPS o debe gestionarse aparte.");
    h+='<div class="tbl-wrap" style="margin-top:12px"><table><thead><tr><th>Paciente</th><th>EPS</th><th>Exámenes del mes ('+MESES[m-1]+')</th><th>Fuera de contrato</th></tr></thead><tbody>'+
     A.map(p=>{const s=solicitudMes(p,ym);return'<tr><td><b>'+esc(nameCase(p.nombre))+'</b><div class="note mono">'+p.id+'</div></td><td>'+esc(p.eps)+'</td><td>'+s.filter(x=>x.incl).map(x=>'<span class="pill base" style="margin:2px">'+esc(LABNAME(x.k))+'</span>').join("")+'</td><td>'+s.filter(x=>!x.incl).map(x=>'<span class="pill warn" style="margin:2px" title="'+esc(x.nota||"")+'">'+esc(LABNAME(x.k))+'</span>').join("")+'</td></tr>';}).join("")+'</tbody></table></div>';
    const tot={};A.forEach(p=>solicitudMes(p,ym).forEach(x=>{tot[x.k]=tot[x.k]||{i:0,n:0};tot[x.k][x.incl?"i":"n"]++;}));
    h+='<div class="card" style="margin-top:14px"><h3>Consolidado para el laboratorio</h3><div class="tbl-wrap"><table><thead><tr><th>Examen</th><th class="num">Dentro de contrato</th><th class="num">Fuera de contrato</th><th class="num">Total</th></tr></thead><tbody>'+Object.entries(tot).map(([k,v])=>'<tr><td>'+esc(LABNAME(k))+'</td><td class="num">'+v.i+'</td><td class="num">'+v.n+'</td><td class="num"><b>'+(v.i+v.n)+'</b></td></tr>').join("")+'</tbody></table></div></div>';
  }
  if(sub==="calendario"){
    const A=S.pacientes.filter(p=>isActive(p));
    const cell=(act,pid,mm)=>{const key=act+"|"+pid+"|"+y+"-"+pad(mm);const done=S.hechos[key];const prog=pid?((S.plan.porPaciente[act]||{})[pid]||[]).includes(mm):(S.plan.general.find(g=>g.act===act)||{meses:[]}).meses.includes(mm);
      const past=mm<m;const cls=done?"d":prog?(past?"l":"p"):"f";return'<td><button class="dot '+cls+'" data-hecho="'+esc(key)+'" title="'+(done?"Realizado":prog?(past?"Programado, sin marcar como realizado":"Programado"):"No programado")+'" style="border:0;cursor:pointer">'+(done?"✓":prog?"•":"")+'</button></td>';};
    h+='<p class="note">Clic en una celda para marcarla como realizada. ✓ realizado · • programado · rojo = programado en un mes ya pasado sin marcar. Fuente de la programación: hoja PERITONEAL PACIENTES (CONTROL DE VALORACIONES).</p>';
    h+='<div class="tbl-wrap"><table class="cal"><thead><tr><th class="lbl">Actividad · '+y+'</th>'+MES3.map((x,i)=>'<th'+(i+1===m?' style="color:var(--accent)"':'')+'>'+x+'</th>').join("")+'</tr></thead><tbody>';
    h+='<tr><td colspan="13" style="background:var(--surface-2);font-weight:700;color:var(--accent);text-align:left">Laboratorio del programa (todos los pacientes)</td></tr>'+S.plan.general.map(g=>'<tr><td class="lbl">'+esc(g.act)+(g.nota?'<div class="note">'+esc(g.nota)+'</div>':'')+'</td>'+MES3.map((x,i)=>cell(g.act,"",i+1)).join("")+'</tr>').join("");
    Object.keys(S.plan.porPaciente).forEach(act=>{h+='<tr><td colspan="13" style="background:var(--surface-2);font-weight:700;color:var(--accent);text-align:left">'+esc(act)+'</td></tr>'+A.map(p=>'<tr><td class="lbl">'+esc(nameCase(p.nombre))+'</td>'+MES3.map((x,i)=>cell(act,p.id,i+1)).join("")+'</tr>').join("");});
    h+='</tbody></table></div>';
    h+=alertBox("warn","<b>Brechas de la programación actual frente a los contratos:</b> trabajo social está programado trimestral pero ningún paquete lo paga; un paciente tiene nutrición programada en ene, jun, sep y dic (no trimestral regular); los pacientes con suplemento nutricional (Nueva EPS) tienen nutrición mensual, lo cual excede el mínimo contractual y es una decisión clínica razonable que conviene dejar justificada en HC.");
  }
  if(sub==="freq"){
    h+='<div class="tbl-wrap"><table><thead><tr><th>Examen</th>'+EPS_L.map(e=>'<th>'+e+'</th>').join("")+'</tr></thead><tbody>'+Object.entries(LABFREQ).map(([k,map])=>'<tr><td>'+esc(LABNAME(k))+'</td>'+EPS_L.map(e=>'<td class="small">'+(map[e]?esc(FREQ_TXT[map[e]]):'<span style="color:var(--bad)">No incluido</span>')+'</td>').join("")+'</tr>').join("")+'</tbody></table></div><p class="note">Transcrito de los tres documentos contractuales. Mallamas incluye BUN solo al ingreso y no trae Kt/V, orina de 24 h ni PET: con ese plan, la IPS no puede cumplir la medición de adecuación que exige la CAC sin asumir el costo.</p>';
  }
  return h;
}

/* ============================ EVENTOS ============================ */
function tablaEventos(L,pid){
  const cls=peritonitisClasif();L=L.slice().sort((a,b)=>a.fIni<b.fIni?1:-1);
  return'<div class="row" style="justify-content:flex-end;margin-bottom:10px"><button class="btn sm primary" data-evnew="'+(pid||"")+'">'+ico("plus")+'Registrar evento</button></div><div class="tbl-wrap"><table><thead><tr>'+(pid?'':'<th>Paciente</th>')+'<th>Inicio</th><th>Tipo</th><th>Detalle microbiológico</th><th>Tratamiento</th><th>Desenlace</th><th>Clasificación</th><th></th></tr></thead><tbody>'+
   (L.length?L.map(e=>{const p=pac(e.pac)||{nombre:e.pac};return'<tr>'+(pid?'':'<td>'+esc(nameCase(p.nombre))+'</td>')+'<td>'+fd(e.fIni)+(e.fFin?'<div class="note">fin '+fd(e.fFin)+'</div>':'')+'</td><td>'+esc(e.tipo)+(e.hosp==="Sí"?'<div class="note">hospitalizado '+(e.dias||"?")+' d</div>':'')+'</td><td class="small">'+(e.tipo==="Peritonitis"?esc([e.leuc?"Leuc "+e.leuc+"/µL":"",e.pmn?"PMN "+e.pmn+" %":"",e.grupo,e.germen].filter(Boolean).join(" · ")):esc(e.causa||""))+'</td><td class="small">'+esc(e.trat||"")+'</td><td>'+esc(e.desenlace||"")+'</td><td class="small">'+(e.tipo==="Peritonitis"?esc(cls[e.id]||""):"")+'</td><td class="noprint"><button class="btn sm ghost" data-evedit="'+e.id+'">Editar</button></td></tr>';}).join(""):'<tr><td colspan="8" class="muted">Sin eventos registrados.</td></tr>')+'</tbody></table></div>';
}
function editEvento(pid,e){const isNew=!e;e=e||{pac:pid};
  formDlg(isNew?"Registrar evento":"Editar evento",[{k:"pac",l:"Paciente",type:"select",opts:S.pacientes.map(p=>[p.id,p.id+" · "+nameCase(p.nombre)]),req:true},{k:"tipo",l:"Tipo",type:"select",opts:EVT_TIPOS,req:true},{k:"fIni",l:"Fecha de inicio",type:"date",req:true},{k:"fFin",l:"Fecha de fin del tratamiento / egreso",type:"date"},
   {k:"leuc",l:"Leucocitos en efluente (/µL)",type:"number",help:"ISPD: > 100/µL con > 50 % PMN tras ≥ 2 h de permanencia"},{k:"pmn",l:"% PMN",type:"number"},{k:"cultivo",l:"Cultivo del efluente",type:"select",opts:["Tomado","No tomado","Pendiente"]},{k:"grupo",l:"Resultado microbiológico",type:"select",opts:GERMEN_GRUPOS},{k:"germen",l:"Microorganismo",ph:"p. ej. S. epidermidis"},
   {k:"trat",l:"Antibiótico / vía / días",wide:true},{k:"hosp",l:"¿Requirió hospitalización > 24 h?",type:"select",opts:["No","Sí"]},{k:"dias",l:"Días de hospitalización",type:"number"},{k:"causa",l:"Causa (si es hospitalización u otro evento)"},
   {k:"desenlace",l:"Desenlace",type:"select",opts:DESENLACES},{k:"rca",l:"Análisis de causa / factor identificado",type:"textarea",wide:true}],e,o=>{
    if(isNew){S.eventos.push(Object.assign({id:uid("E")},o));if(o.hosp==="Sí"&&o.tipo!=="Hospitalización")S.eventos.push({id:uid("E"),pac:o.pac,tipo:"Hospitalización",fIni:o.fIni,fFin:o.fFin,dias:o.dias,causa:o.tipo+(o.germen?" ("+o.germen+")":""),desenlace:o.desenlace});}
    else Object.assign(e,o);logAct("Evento "+o.tipo+" "+o.pac);},isNew?'<p class="note" style="margin-top:10px">Si marca hospitalización en una peritonitis, se crea también el registro de hospitalización para la tasa CAC dia_32.</p>':'');}
function rEventos(){
  let h=head("Peritonitis, infecciones y eventos","Registro epidemiológico que alimenta la tasa de peritonitis (CAC dia_19, ISPD 2022), la de hospitalización (dia_32) y el análisis de causas. Las recaídas se identifican solas y no se cuentan como episodio nuevo.");
  const I=indicadores();const t=I.find(x=>x.cod==="dia_19_adul"),hl=I.find(x=>x.cod==="dia_32_adul"),lb=I.find(x=>x.cod==="ISPD");
  h+='<div class="grid g3" style="margin-bottom:14px">'+[t,lb,hl].map(x=>indCard(x,true)).join("")+'</div>';
  const per=S.eventos.filter(e=>e.tipo==="Peritonitis");const g={};per.forEach(e=>{g[e.grupo||"Sin dato"]=(g[e.grupo||"Sin dato"]||0)+1;});
  if(per.length)h+='<div class="card" style="margin-bottom:14px"><h3>Perfil microbiológico acumulado</h3><p class="sub">Base para el antibiograma propio que pide GAG-GU-003 (num. 20.3).</p><div class="row">'+Object.entries(g).map(([k,v])=>pill(k+": "+v+" ("+pct(v/per.length,0)+")","base",false)).join(" ")+'</div></div>';
  h+=tablaEventos(S.eventos,null);
  return h;
}

/* ============================ VISITAS ============================ */
function tablaVisitas(L,pid){L=L.slice().sort((a,b)=>a.fecha<b.fecha?1:-1);
  return'<div class="row" style="justify-content:flex-end;margin-bottom:10px"><button class="btn sm primary" data-visnew="'+(pid||"")+'">'+ico("plus")+'Registrar visita o entrenamiento</button></div><div class="tbl-wrap"><table><thead><tr>'+(pid?'':'<th>Paciente</th>')+'<th>Fecha</th><th>Tipo</th><th>Responsable</th><th>Lista de verificación</th><th>Hallazgos</th><th></th></tr></thead><tbody>'+
  (L.length?L.map(v=>{const p=pac(v.pac)||{nombre:v.pac};const it=v.items||{};const ok=Object.values(it).filter(x=>x==="Sí").length,no=Object.values(it).filter(x=>x==="No").length;
   return'<tr>'+(pid?'':'<td>'+esc(nameCase(p.nombre))+'</td>')+'<td>'+fd(v.fecha)+'</td><td>'+esc(v.tipo)+'</td><td>'+esc(v.resp||"")+'</td><td>'+(ok+no?pill(ok+" cumple","ok",false)+" "+(no?pill(no+" no cumple","bad",false):""):'<span class="muted">—</span>')+(no?'<div class="note">'+esc(Object.entries(it).filter(([k,x])=>x==="No").map(([k])=>k).join(" · "))+'</div>':'')+'</td><td class="small">'+esc(v.obs||"")+'</td><td class="noprint"><button class="btn sm ghost danger" data-visdel="'+v.id+'">'+ico("trash")+'</button></td></tr>';}).join(""):'<tr><td colspan="7" class="muted">Sin registros.</td></tr>')+'</tbody></table></div>';}
function editVisita(pid){
  const extra='<h4 style="margin:16px 0 8px;font-family:var(--f-display)">Lista de verificación</h4><div class="tbl-wrap"><table><tbody>'+VISITA_ITEMS.map((it,i)=>'<tr><td>'+esc(it)+'</td><td style="width:170px"><select id="vi_'+i+'">'+opt(["Sí","No","No aplica"],"","—")+'</select></td></tr>').join("")+'</tbody></table></div>';
  formDlg("Registrar visita o entrenamiento",[{k:"pac",l:"Paciente",type:"select",opts:S.pacientes.map(p=>[p.id,p.id+" · "+nameCase(p.nombre)]),def:pid,req:true},{k:"fecha",l:"Fecha",type:"date",req:true},{k:"tipo",l:"Tipo",type:"select",opts:VISITA_TIPOS,req:true},{k:"resp",l:"Responsable"},{k:"obs",l:"Hallazgos, compromisos y saldo de insumos observado",type:"textarea",wide:true}],{},o=>{
   o.items={};VISITA_ITEMS.forEach((it,i)=>{const v=$("vi_"+i).value;if(v)o.items[it]=v;});S.visitas.push(Object.assign({id:uid("VS")},o));logAct(o.tipo+" "+o.pac);},extra);}
function rVisitas(){
  let h=head("Visitas domiciliarias y entrenamiento","El paciente en DP se trata en su casa: la técnica, el almacenamiento y el inventario se verifican allá. Aquí se registran visitas, entrenamiento inicial y reentrenamientos (la ISPD recomienda considerar reentrenamiento después de una peritonitis).");
  const A=activos();
  h+='<div class="tbl-wrap" style="margin-bottom:14px"><table><thead><tr><th>Paciente</th><th>Última visita domiciliaria</th><th>Último entrenamiento / reentrenamiento</th><th>Estado</th></tr></thead><tbody>'+A.map(p=>{const vd=S.visitas.filter(v=>v.pac===p.id&&/domiciliaria/i.test(v.tipo)).sort((a,b)=>a.fecha<b.fecha?-1:1).pop();const en=S.visitas.filter(v=>v.pac===p.id&&/ntrenamiento/.test(v.tipo)).sort((a,b)=>a.fecha<b.fecha?-1:1).pop();const okv=vd&&inWindow(vd.fecha,S.cfg.visitaMeses);
   return'<tr><td>'+esc(nameCase(p.nombre))+'</td><td>'+(vd?fd(vd.fecha):'<span class="muted">sin registro</span>')+'</td><td>'+(en?fd(en.fecha)+" · "+esc(en.tipo):'<span class="muted">sin registro</span>')+'</td><td>'+pill(okv?"Al día":"Pendiente",okv?"ok":"warn")+'</td></tr>';}).join("")+'</tbody></table></div>';
  h+=tablaVisitas(S.visitas,null);return h;
}

/* ============================ FARMACIA (flujo simple en 3 pasos) ============================ */
const catOf=cod=>S.catalogo.find(x=>x.cod===cod)||{cod,nombre:cod,unidad:"",grupo:""};
const isSol=cod=>/^D\d/.test(cod);
const litrosDe=cod=>/6000/.test(cod)?6:/2000/.test(cod)?2:0;
function rFarmacia(){
  const sub=VIEW.sub||"entregas";const ym=S.corte;const F=farmMes(ym);const A=activos();
  let h=head("Farmacia y suministros","Tres pasos al mes: <b>1</b> entregar a cada paciente lo que le toca (descontando lo que tiene en casa), <b>2</b> pedir al proveedor, <b>3</b> mantener al día las fórmulas. Mes: "+ymLabel(ym)+".");
  h+='<div class="steps">'+[["entregas","1","Entregas del mes"],["pedido","2","Pedido al proveedor"],["formulas","3","Fórmulas"],["costos","$","Costos"]].map(s=>'<button role="tab" data-sub="'+s[0]+'" aria-selected="'+(sub===s[0])+'"><span class="n">'+s[1]+'</span>'+s[2]+'</button>').join("")+'</div>';
  if(sub==="entregas"){
    const N=necesidad(ym);const hechos=A.filter(p=>(F.entregas[p.id]||{}).fecha).length;
    h+='<div class="row" style="margin-bottom:12px;gap:14px"><div class="card flat" style="padding:10px 14px"><span class="note">Entregas registradas</span> <b class="mono" style="font-size:18px">'+hechos+' / '+A.length+'</b></div><p class="note" style="margin:0;flex:1 1 300px">Abra cada paciente, escriba lo que tiene en casa (si no sabe, déjelo en blanco) y guarde. El sistema calcula lo que se entrega y lo suma al pedido.</p></div>';
    h+='<div class="grid g3">'+A.map(p=>{const rows=N.filter(r=>r.pac===p.id);const E=F.entregas[p.id]||{};const bolsas=rows.filter(r=>isSol(r.cod)).reduce((a,r)=>a+r.aEntregar,0);
      return'<div class="card pcard"><div class="row" style="justify-content:space-between"><b>'+esc(nameCase(p.nombre))+'</b>'+(E.fecha?pill("Entregado "+fd(E.fecha),"ok"):pill("Pendiente","warn"))+'</div><p class="note" style="margin:4px 0 10px">'+esc(p.eps)+' · '+p.modalidad+' · '+rows.length+' productos · '+bolsas+' bolsas de solución</p>'+
      (rows.length?'<button class="btn '+(E.fecha?'':'primary')+'" data-entrega="'+p.id+'" style="width:100%;justify-content:center">'+(E.fecha?"Ver o corregir entrega":"Registrar entrega")+'</button>':'<span class="note">Sin fórmula: vaya al paso 3.</span>')+'</div>';}).join("")+'</div>';
    const eg=S.pacientes.filter(p=>!isActive(p)&&S.formula.some(f=>f.pac===p.id));
    if(eg.length)h+=alertBox("warn","<b>"+eg.map(p=>esc(nameCase(p.nombre))).join(", ")+"</b> ya no está activo en DP y conserva fórmula. No se le calcula entrega; borre su fórmula en el paso 3.");
  }
  if(sub==="pedido"){
    const P=pedido(ym);const tot=P.reduce((a,r)=>a+(r.costo!=null?r.costo*r.ped:0),0);const sinc=P.filter(r=>r.costo==null&&r.ped).length;
    const sol=P.filter(r=>isSol(r.c.cod));const bolsas=sol.reduce((a,r)=>a+r.ped,0),litros=sol.reduce((a,r)=>a+r.ped*litrosDe(r.c.cod),0);
    h+='<div class="grid g4" style="margin-bottom:14px">'+
      '<div class="card"><div class="stat"><span class="k">Bolsas de solución a pedir</span><span class="v">'+bolsas+'</span><span class="d">'+f1(litros,0)+' litros</span></div></div>'+
      '<div class="card"><div class="stat"><span class="k">Productos en el pedido</span><span class="v">'+P.filter(r=>r.ped>0).length+'</span><span class="d">de '+P.length+' con consumo</span></div></div>'+
      '<div class="card"><div class="stat"><span class="k">Valor estimado</span><span class="v" style="font-size:22px">'+(tot?money(tot):"—")+'</span><span class="d">'+(sinc?sinc+" productos sin costo":"con costos del catálogo")+'</span></div></div>'+
      '<div class="card"><div class="stat"><span class="k">Entregas registradas</span><span class="v">'+A.filter(p=>(F.entregas[p.id]||{}).fecha).length+' / '+A.length+'</span><span class="d">las pendientes se calculan con la fórmula completa</span></div></div></div>';
    h+='<div class="row" style="justify-content:space-between;margin-bottom:8px"><p class="note" style="margin:0">Solo dos casillas para llenar: <b>En bodega</b> antes de pedir y <b>Llegó</b> cuando reciba. Lo demás se calcula.</p><button class="btn sm primary" id="fXls">Descargar pedido (Excel)</button></div>';
    h+='<div class="tbl-wrap"><table><thead><tr><th>Producto</th><th class="num">Se necesita</th><th class="num">En bodega</th><th class="num">Pedir</th><th class="num">Llegó</th><th>Estado</th></tr></thead><tbody>'+
     P.map(r=>{const falt=r.rec!=null&&r.rec<r.ped;return'<tr><td>'+esc(r.c.nombre)+' <span class="note">'+esc(r.c.unidad)+'</span></td><td class="num">'+r.need+'</td><td class="num"><input type="number" min="0" data-bod="'+r.c.cod+'" value="'+(F.bodega[r.c.cod]??"")+'" placeholder="0"></td><td class="num"><b style="font-size:15px">'+r.ped+'</b></td><td class="num"><input type="number" min="0" data-rec="'+r.c.cod+'" value="'+(F.recibido[r.c.cod]??"")+'" placeholder="—"></td><td>'+(r.rec==null?(r.ped?pill("Por recibir","base",false):pill("No se pide","base",false)):falt?pill("Faltan "+(r.ped-r.rec),"bad"):pill("Completo","ok"))+'</td></tr>';}).join("")+'</tbody></table></div>';
  }
  if(sub==="formulas"){
    const P=S.pacientes.filter(p=>isActive(p)||S.formula.some(f=>f.pac===p.id));const sel=VIEW.fp&&P.find(p=>p.id===VIEW.fp)?VIEW.fp:(P[0]||{}).id;
    h+='<p class="note">Elija un paciente y ajuste las cantidades del mes. Los cambios se guardan solos.</p><div class="chips" style="margin-bottom:14px">'+P.map(p=>'<button class="chip'+(p.id===sel?' on':'')+'" data-fp="'+p.id+'">'+esc(shortName(p))+(isActive(p)?'':' ⚠')+'</button>').join("")+'</div>';
    if(sel){const p=pac(sel);const L=S.formula.filter(f=>f.pac===sel);const notIn=S.catalogo.filter(c=>!L.some(f=>f.cod===c.cod));
      const lit=L.filter(f=>isSol(f.cod)).reduce((a,f)=>a+f.cant*litrosDe(f.cod),0);
      h+='<div class="card"><div class="row" style="justify-content:space-between"><h3>'+esc(nameCase(p.nombre))+' <span class="note">'+esc(p.eps)+' · '+p.modalidad+'</span></h3><span class="note">'+f1(lit,0)+' L de solución al mes ('+f1(lit/30,1)+' L/día)</span></div>'+
       (!isActive(p)?alertBox("warn","Paciente con estado «"+esc(p.estado)+"». Borre la fórmula si ya no recibe insumos de DP. <button class='btn sm danger' data-fclear='"+p.id+"'>Borrar toda la fórmula</button>"):"")+
       ((p.obsFuente||[]).some(o=>/fórmula|cassette|EPO|Eritropoyetina/i.test(o))?alertBox("info",esc((p.obsFuente||[]).filter(o=>/fórmula|cassette|EPO|Eritropoyetina/i.test(o)).join(" ")) ):"")+
       '<div class="tbl-wrap" style="margin-top:10px"><table><thead><tr><th>Producto</th><th class="num">Cantidad al mes</th><th>Paquete '+esc(p.eps)+'</th><th></th></tr></thead><tbody>'+
       L.map(f=>{const c=catOf(f.cod);const ni=NO_INCL[f.cod]&&NO_INCL[f.cod].includes(p.eps);return'<tr><td>'+esc(c.nombre)+' <span class="note">'+esc(c.unidad)+'</span></td><td class="num"><input type="number" min="0" data-form="'+p.id+'|'+f.cod+'" value="'+f.cant+'"></td><td>'+(ni?pill("No incluido","bad",false):(isSol(f.cod)||/CASSETTE|BDREN|MINICAP/.test(f.cod))&&p.eps!=="NUEVA EPS"?pill("No explícito","warn",false):pill("Incluido","ok",false))+'</td><td class="c"><button class="btn sm ghost danger" data-fdel="'+p.id+'|'+f.cod+'" title="Quitar">'+ico("trash")+'</button></td></tr>';}).join("")+
       '</tbody></table></div><div class="row" style="margin-top:10px"><select id="fAddSel">'+opt(notIn.map(c=>[c.cod,c.nombre]),"","Agregar producto…")+'</select><input type="number" id="fAddCant" min="1" placeholder="Cantidad" style="width:110px"><button class="btn sm primary" id="fAdd" data-p="'+p.id+'">'+ico("plus")+'Agregar</button></div></div>';}
  }
  if(sub==="costos"){
    const Fi=finanzas(ym);
    h+='<div class="grid g2"><div class="card"><h3>Costo unitario de compra</h3><p class="sub">Valor que paga la IPS por unidad (no la tarifa a la EPS). Vacío = sin dato; no se inventa.</p><div class="tbl-wrap" style="max-height:560px"><table><thead><tr><th>Producto</th><th>Unidad</th><th class="num">Costo unitario</th></tr></thead><tbody>'+
     S.catalogo.map(c=>'<tr><td>'+esc(c.nombre)+'</td><td class="small muted">'+esc(c.unidad)+'</td><td class="num"><input type="number" min="0" data-cat="'+c.cod+'" data-k="costo" value="'+(c.costo??"")+'" style="width:120px" placeholder="$"></td></tr>').join("")+'</tbody></table></div><div class="row" style="margin-top:10px"><button class="btn sm" id="catAdd">'+ico("plus")+'Producto nuevo</button></div></div>';
    h+='<div class="card"><h3>Costo por paciente este mes</h3><p class="sub">Fórmula × costo unitario, contra la tarifa del paquete.</p>'+(!Fi.costoKnown?alertBox("warn","Faltan costos de "+Fi.sinCosto+" productos con consumo: los totales están incompletos."):"")+
     '<div class="tbl-wrap" style="margin-top:10px"><table><thead><tr><th>Paciente</th><th class="num">Tarifa</th><th class="num">Insumos</th><th class="num">% tarifa</th></tr></thead><tbody>'+
     A.map(p=>{const t=tarifa(p.eps);const c=Fi.porPac[p.id]||0;return'<tr><td>'+esc(shortName(p))+' <span class="note">'+esc(p.eps)+'</span></td><td class="num">'+money(t)+'</td><td class="num">'+(Fi.costoKnown?money(c):'—')+'</td><td class="num">'+(Fi.costoKnown?pct(t?c/t:null):'—')+'</td></tr>';}).join("")+
     '</tbody><tfoot><tr><td><b>Total</b></td><td class="num"><b>'+money(Fi.ingreso)+'</b></td><td class="num"><b>'+(Fi.costoKnown?money(Fi.costo):'—')+'</b></td><td class="num">'+(Fi.costoKnown?pct(Fi.ingreso?Fi.costo/Fi.ingreso:null):'—')+'</td></tr></tfoot></table></div><p class="note">El costo completo (talento humano, laboratorio, visitas) está en la Nota técnica.</p></div></div>';
  }
  return h;
}
function dlgEntrega(pid){
  const p=pac(pid);const ym=S.corte;const F=farmMes(ym);const E=F.entregas[pid]||{};const R=S.cfg.reservaDias||0;const dias=monthEnd(pdate(ym+"-01")).getDate();
  const L=S.formula.filter(f=>f.pac===pid);
  const row=f=>{const c=catOf(f.cod);const extra=Math.ceil(f.cant*R/dias);const s=(E.saldo||{})[f.cod];const ent=E.fecha?(E.entregado||{})[f.cod]:null;const calc=Math.max(0,f.cant+extra-(num(s)||0));
    return'<tr><td>'+esc(c.nombre)+' <span class="note">'+esc(c.unidad)+'</span></td><td class="num">'+(f.cant+extra)+'</td><td class="num"><input type="number" min="0" class="eSaldo" data-cod="'+f.cod+'" data-req="'+(f.cant+extra)+'" value="'+(s??"")+'" placeholder="0"></td><td class="num"><input type="number" min="0" class="eEnt" data-cod="'+f.cod+'" value="'+(ent??calc)+'"></td></tr>';};
  $("dlg").innerHTML='<div class="dlg" role="dialog" aria-modal="true"><h3>Entrega de '+esc(ymLabel(ym))+' · '+esc(nameCase(p.nombre))+'</h3><p class="note" style="margin-top:-6px">Escriba lo que el paciente tiene en casa. «Se entrega» se calcula solo; corríjalo solo si entregó algo distinto.</p>'+
   '<div class="formgrid" style="margin-bottom:10px"><label class="field">Fecha de entrega<input type="date" id="eFecha" value="'+esc(E.fecha||iso(new Date()))+'"></label><label class="field">Recibió (nombre)<input type="text" id="eRecibe" value="'+esc(E.recibe||p.cuidador||"")+'"></label></div>'+
   '<div class="tbl-wrap" style="max-height:52vh"><table><thead><tr><th>Producto</th><th class="num">Le toca</th><th class="num">Tiene en casa</th><th class="num">Se entrega</th></tr></thead><tbody>'+L.map(row).join("")+'</tbody></table></div>'+
   '<div class="actions">'+(E.fecha?'<button class="btn danger" id="eBorrar">Anular entrega</button>':'')+'<button class="btn" id="dlgCancel">Cancelar</button><button class="btn primary" id="eOk">Guardar entrega</button></div></div>';
  $("dlg").hidden=false;
  $("dlg").querySelectorAll(".eSaldo").forEach(inp=>inp.oninput=()=>{const ent=$("dlg").querySelector('.eEnt[data-cod="'+inp.dataset.cod+'"]');ent.value=Math.max(0,num(inp.dataset.req)-(num(inp.value)||0));});
  $("dlgCancel").onclick=()=>$("dlg").hidden=true;
  if($("eBorrar"))$("eBorrar").onclick=()=>{delete F.entregas[pid];logAct("Anula entrega "+pid+" "+ym);$("dlg").hidden=true;save("Entrega anulada");render();};
  $("eOk").onclick=()=>{const o={fecha:$("eFecha").value||iso(new Date()),recibe:$("eRecibe").value,saldo:{},entregado:{}};
    $("dlg").querySelectorAll(".eSaldo").forEach(i=>{if(i.value!=="")o.saldo[i.dataset.cod]=num(i.value);});
    $("dlg").querySelectorAll(".eEnt").forEach(i=>{o.entregado[i.dataset.cod]=num(i.value)||0;});
    F.entregas[pid]=o;logAct("Entrega "+pid+" "+ym);$("dlg").hidden=true;save("Entrega guardada");render();};
}

/* ============================ INDICADORES (gráficas con filtro por EPS) ============================ */
function fmtInd(x){if(x.v==null)return"—";if(x.fmt==="pct")return pct(x.v,0);if(x.fmt==="rate")return f1(x.v,2);if(x.fmt==="money")return money(x.v);return f1(x.v);}
const CUTS={dia_12_adul:[.8,.6],dia_14_adul:[.6,.2],dia_16_adul:[.4,.2],dia_18_adul:[.8,.2],INT_:[.9,.7]};
function indCard(x,compact){if(!x)return"";
  return'<div class="card"><div class="row" style="justify-content:space-between;align-items:flex-start"><span class="mono note">'+esc(x.cod)+'</span>'+pill(x.cls==="ok"?"Cumple":x.cls==="warn"?"Medio":x.cls==="bad"?"Bajo":x.g==="Financiero"?"Informativo":"Línea de base",x.cls)+'</div><h3 style="margin-top:6px">'+esc(x.n)+'</h3><div class="stat"><span class="v">'+fmtInd(x)+'</span><span class="d">'+(x.num!=null?(x.fmt==="rate"?plural(x.num,"episodio","episodios")+" / "+x.den:x.num+" de "+x.den):"")+'</span></div>'+(x.fmt==="pct"&&x.v!=null?bulletBar(x):'')+'<p class="note" style="margin:8px 0 0">'+esc(x.meta)+(x.nota&&!compact?" · "+esc(x.nota):"")+'</p></div>';}
function bulletBar(x){ // barra 0–100 % con zonas de semáforo y marcador
  const c=CUTS[x.cod]||(String(x.cod).startsWith("INT")?CUTS.INT_:null);const v=Math.max(0,Math.min(1,x.v||0));
  const zones=c?'<i class="z bad" style="left:0;width:'+c[1]*100+'%"></i><i class="z warn" style="left:'+c[1]*100+'%;width:'+(c[0]-c[1])*100+'%"></i><i class="z ok" style="left:'+c[0]*100+'%;width:'+(1-c[0])*100+'%"></i>':'<i class="z neu" style="left:0;width:100%"></i>';
  return'<div class="bullet" data-tip="'+esc(x.n+": "+fmtInd(x)+(x.num!=null?" ("+x.num+" de "+x.den+")":""))+'">'+zones+'<b class="'+(x.cls||"")+'" style="width:'+Math.max(v*100,1.5)+'%"></b></div>';}
const EPS_COLOR={"NUEVA EPS":"s1",MALLAMAS:"s2",FOMAG:"s3"};
function groupedBars(cats,series,o){ // cats:[{k,l}], series:[{name,cls,vals:{k:v}, n:{k:"a/b"}, faded}]
  const W=600,H=270,L=38,R=8,T=20,B=42;const cw=(W-L-R)/cats.length;const nS=series.length;const bw=Math.min(34,(cw-24)/nS-2);
  const Y=v=>T+(H-T-B)*(1-v);let g="";[0,.25,.5,.75,1].forEach(t=>{g+='<line class="g-grid" x1="'+L+'" x2="'+(W-R)+'" y1="'+Y(t)+'" y2="'+Y(t)+'"/><text x="'+(L-6)+'" y="'+(Y(t)+4)+'" text-anchor="end">'+(t*100)+'%</text>';});
  let bars="";cats.forEach((c,i)=>{const gx=L+i*cw+(cw-(nS*(bw+2)-2))/2;
    series.forEach((s,j)=>{const v=s.vals[c.k];const x=gx+j*(bw+2);const op=s.faded?' style="opacity:.28"':'';
      if(v==null){bars+='<text x="'+(x+bw/2)+'" y="'+(Y(0)-4)+'" text-anchor="middle" class="t-muted"'+op+'>s/d</text><rect x="'+x+'" y="'+T+'" width="'+bw+'" height="'+(H-T-B)+'" fill="transparent" data-tip="'+esc(s.name+" · "+c.l+": sin dato")+'"/>';return;}
      const y=Y(v),hgt=Math.max(1.5,Y(0)-y),r=Math.min(4,hgt/2);
      bars+='<path class="b-'+s.cls+'"'+op+' d="M'+x+' '+Y(0)+'V'+(y+r)+'Q'+x+' '+y+' '+(x+r)+' '+y+'H'+(x+bw-r)+'Q'+(x+bw)+' '+y+' '+(x+bw)+' '+(y+r)+'V'+Y(0)+'Z"/><text x="'+(x+bw/2)+'" y="'+(y-5)+'" text-anchor="middle" class="t-val"'+op+'>'+Math.round(v*100)+'</text><rect x="'+(x-1)+'" y="'+T+'" width="'+(bw+2)+'" height="'+(H-T-B)+'" fill="transparent" data-tip="'+esc(s.name+" · "+c.l+": "+pct(v,0)+(s.n&&s.n[c.k]?" ("+s.n[c.k]+")":""))+'"/>';});
    bars+='<text x="'+(L+i*cw+cw/2)+'" y="'+(H-B+18)+'" text-anchor="middle" class="t-cat">'+esc(c.l)+'</text>'+(c.meta!=null?'<line class="g-tgt" x1="'+(L+i*cw+8)+'" x2="'+(L+(i+1)*cw-8)+'" y1="'+Y(c.meta)+'" y2="'+Y(c.meta)+'"/>':'');});
  const leg='<div class="legend">'+series.map(s=>'<span'+(s.faded?' style="opacity:.4"':'')+'><i class="sw b-'+s.cls+'"></i>'+esc(s.name)+'</span>').join("")+'<span><i class="sw tgt"></i>Umbral «alto» CAC</span></div>';
  return leg+'<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+esc(o&&o.label||"Comparativo")+'">'+g+bars+'</svg>';
}
function rIndicadores(){
  const fl=VIEW.flt||(VIEW.flt={eps:"",mod:""});const ref=corteDate();
  const I=indicadores(ref,fl);const gi=c=>I.find(x=>x.cod===c);const sub=VIEW.sub||"resumen";
  const nPac=activos().filter(p=>fltOk(p,fl)).length;
  let h=head("Indicadores","Corte "+ymLabel(S.corte)+". Filtre por EPS o modalidad: todo el tablero se recalcula. Metas y ventanas según el consenso CAC 2026 (Hb, albúmina, fósforo y calcio: último trimestre; PTH: 6 meses; tasas por meses-paciente).",'<button class="btn sm" id="iXls">Exportar</button>');
  h+='<div class="filterbar"><span class="note">EPS</span><div class="chips">'+[["","Todas"]].concat(EPS_L.map(e=>[e,e])).map(([k,l])=>'<button class="chip'+(fl.eps===k?' on':'')+'" data-fe="'+k+'">'+(k?'<i class="sw b-'+EPS_COLOR[k]+'"></i>':'')+esc(l)+'</button>').join("")+'</div><span class="note" style="margin-left:10px">Modalidad</span><div class="chips">'+[["","Todas"],["DPA","DPA"],["DPCA","DPCA"]].map(([k,l])=>'<button class="chip'+(fl.mod===k?' on':'')+'" data-fm="'+k+'">'+l+'</button>').join("")+'</div><span class="pill acc" style="margin-left:auto">'+plural(nPac,"paciente activo","pacientes activos")+'</span></div>';
  h+=tabs([["resumen","Resumen gráfico"],["pacientes","Semáforo por paciente"],["todos","Todos los indicadores"]],sub);
  if(!nPac){return h+alertBox("info","No hay pacientes activos con ese filtro.");}
  if(sub==="resumen"){
    // 1. KPI con barra de semáforo
    const k4=["dia_12_adul","dia_14_adul","dia_16_adul","dia_18_adul"].map(gi);
    h+='<div class="grid g4" style="margin-bottom:14px">'+k4.map(x=>'<div class="card kpi"><div class="row" style="justify-content:space-between"><span class="k">'+esc(({dia_12_adul:"Kt/V ≥ "+f1(S.cfg.ktv,1),dia_14_adul:"Hb ≥ "+fm(S.cfg.hb),dia_16_adul:"Albúmina ≥ "+fm(S.cfg.alb),dia_18_adul:"Fósforo "+fm(S.cfg.pLo)+"–"+fm(S.cfg.pHi)})[x.cod])+'</span>'+pill(x.cls==="ok"?"Alto":x.cls==="warn"?"Medio":x.cls==="bad"?"Bajo":"Sin datos",x.cls)+'</div><div class="v">'+fmtInd(x)+'</div><div class="d">'+x.num+' de '+x.den+(x.det&&x.det.sd.length?' · '+x.det.sd.length+' sin dato':'')+'</div>'+bulletBar(x)+'<div class="note" style="margin-top:6px">'+esc(x.meta)+'</div></div>').join("")+'</div>';
    // 2. comparativo por EPS
    const cats=[{k:"dia_12_adul",l:"Kt/V ≥ "+f1(S.cfg.ktv,1),meta:.8},{k:"dia_14_adul",l:"Hb ≥ "+fm(S.cfg.hb),meta:.6},{k:"dia_16_adul",l:"Alb ≥ "+fm(S.cfg.alb),meta:.4},{k:"dia_18_adul",l:"P "+fm(S.cfg.pLo)+"–"+fm(S.cfg.pHi),meta:.8},{k:"dia_28_adul",l:"PTH en rango"},{k:"INT-01",l:"Kt/V tomado",meta:.9}];
    const series=EPS_L.filter(e=>activos().some(p=>p.eps===e&&fltOk(p,{mod:fl.mod}))).map(e=>{const Ie=indicadores(ref,{eps:e,mod:fl.mod});const vals={},n={};cats.forEach(c=>{const x=Ie.find(y=>y.cod===c.k);vals[c.k]=x?x.v:null;n[c.k]=x?x.num+"/"+x.den:"";});return{name:e,cls:EPS_COLOR[e],vals,n,faded:fl.eps&&fl.eps!==e};});
    h+='<div class="grid g2"><div class="card"><h3>Comparativo por EPS</h3><p class="sub">Porcentaje de pacientes que cumplen. «s/d» = ningún paciente con dato en la ventana. La raya verde es el umbral de cumplimiento alto CAC.</p>'+groupedBars(cats,series,{label:"Comparativo de indicadores por EPS"})+'</div>';
    // 3. tendencia
    const tsel=VIEW.tsel||"dia_12_adul";const opts=[["dia_12_adul","Kt/V ≥ "+f1(S.cfg.ktv,1),80],["INT-01","Kt/V tomado",90],["dia_14_adul","Hb ≥ "+fm(S.cfg.hb),60],["dia_16_adul","Albúmina",40],["dia_18_adul","Fósforo",80]];
    const months=[];for(let i=11;i>=0;i--)months.push(ymAdd(S.corte,-i));const meta=opts.find(o=>o[0]===tsel)[2];
    const pts=months.map(ym=>{const ind=indicadores(monthEnd(pdate(ym+"-01")),fl).find(x=>x.cod===tsel);return{x:ymLabel(ym).replace("-20","-"),y:ind&&ind.v!=null?+(ind.v*100).toFixed(1):null,tip:ymLabel(ym)+": "+(ind&&ind.v!=null?fmtInd(ind)+" ("+ind.num+" de "+ind.den+")":"sin datos")};});
    h+='<div class="card"><h3>Tendencia de 12 meses'+(fl.eps?' · '+esc(fl.eps):'')+'</h3><div class="chips" style="margin:8px 0 6px">'+opts.map(o=>'<button class="chip sm'+(o[0]===tsel?' on':'')+'" data-tsel="'+o[0]+'">'+esc(o[1])+'</button>').join("")+'</div>'+lineChart(pts,{target:meta,targetLabel:"alto "+meta+" %",dec:0,h:230,min:0,max:100,floor0:true,area:true,label:"Tendencia"})+'<p class="note">Meses vacíos = sin datos fechados en esa ventana.</p></div></div>';
    // 4. peritonitis + proceso
    const per=gi("dia_19_adul"),lib=gi("ISPD"),hos=gi("dia_32_adul");
    h+='<div class="grid g3" style="margin-top:14px">'+[per,lib,hos].map(x=>indCard(x,true)).join("")+'</div>';
    const proc=["INT-01","INT-02","INT-03","INT-04","INT-05","INT-06","dia_36_adul"].map(gi);
    h+='<div class="card" style="margin-top:14px"><h3>Procesos del programa</h3><p class="sub">Cumplimiento de actividades; las zonas de color muestran la meta.</p><div class="blist">'+proc.map(x=>'<div class="brow"><span class="bl">'+esc(x.n)+'</span>'+bulletBar(x)+'<span class="bv mono">'+fmtInd(x)+'</span><span class="bn note">'+(x.num!=null?x.num+"/"+x.den:"")+'</span></div>').join("")+'</div></div>';
  }
  if(sub==="pacientes"){
    const A=activos().filter(p=>fltOk(p,fl));const M=S.cfg;
    const cols=[["Kt/V",p=>{const x=lastValidKtv(p.id,ref,12);return x?[x.c.ktvT>=M.ktv,f1(x.c.ktvT,2)]:null;}],["Hb",p=>{const x=lastLab(p.id,"Hb",3,ref);return x?[num(x.v)>=M.hb,f1(num(x.v))]:null;}],["Albúmina",p=>{const x=lastLab(p.id,"Alb",3,ref);return x?[num(x.v)>=M.alb,f1(num(x.v))]:null;}],["Fósforo",p=>{const x=lastLab(p.id,"P",3,ref);return x?[num(x.v)>=M.pLo&&num(x.v)<=M.pHi,f1(num(x.v))]:null;}],["Calcio",p=>{const x=avgLab(p.id,"Ca",3,ref);return x==null?null:[x<=M.ca,f1(x)];}],["PTH",p=>{const x=lastLab(p.id,"PTH",6,ref);return x?[num(x.v)>=M.pthLo&&num(x.v)<=M.pthHi,f1(num(x.v),0)]:null;}],
      ["Sin peritonitis 12 m",p=>{if(!S.eventos.length)return null;const e=S.eventos.filter(x=>x.pac===p.id&&x.tipo==="Peritonitis"&&inWindow(x.fIni,12,ref));return[!e.length,e.length?e.length+" ep.":"0"];}],["Visita domiciliaria",p=>{const v=S.visitas.filter(x=>x.pac===p.id&&/domiciliaria/i.test(x.tipo)).sort((a,b)=>a.fecha<b.fecha?-1:1).pop();return v?[inWindow(v.fecha,M.visitaMeses,ref),fd(v.fecha).slice(0,5)]:[false,"nunca"];}],["Nutrición trimestre",p=>{const v=S.valoraciones.some(x=>x.pac===p.id&&x.disc==="Nutrición"&&inWindow(x.fecha,3,ref));return[v,v?"sí":"no"];}]];
    h+='<p class="note">Verde = en meta · rojo = fuera de meta o pendiente · gris = sin dato en la ventana. Clic en el paciente para abrir su ficha.</p><div class="tbl-wrap"><table class="heat"><thead><tr><th>Paciente</th>'+cols.map(c=>'<th class="c">'+c[0]+'</th>').join("")+'<th class="c">En meta</th></tr></thead><tbody>'+
     A.map(p=>{let ok=0,tot=0;const cells=cols.map(c=>{const r=c[1](p);if(!r)return'<td class="c"><span class="hc nd">—</span></td>';tot++;if(r[0])ok++;return'<td class="c"><span class="hc '+(r[0]?"ok":"bad")+'">'+esc(r[1])+'</span></td>';}).join("");
      return'<tr class="click" data-pac="'+p.id+'"><td><b>'+esc(nameCase(p.nombre))+'</b><div class="note"><i class="sw b-'+EPS_COLOR[p.eps]+'"></i>'+esc(p.eps)+' · '+p.modalidad+'</div></td>'+cells+'<td class="c mono"><b>'+ok+'/'+tot+'</b></td></tr>';}).join("")+'</tbody></table></div>';
  }
  if(sub==="todos"){
    const grupos=["Resultado","Proceso","Seguimiento","Estructura","Financiero"];
    grupos.forEach(g=>{const L=I.filter(x=>x.g===g);if(!L.length)return;h+='<h3 class="sec">'+g+(g==="Estructura"?' <span class="note">(no depende del filtro)</span>':'')+'</h3><div class="grid g3" style="margin-bottom:14px">'+L.map(x=>indCard(x,false)).join("")+'</div>';});
    h+='<details class="box"><summary>Fichas técnicas resumidas</summary><div class="inner"><div class="tbl-wrap"><table><thead><tr><th>Código</th><th>Indicador</th><th>Meta / semáforo</th><th>Nota</th><th>Fuente</th></tr></thead><tbody>'+I.map(x=>'<tr><td class="mono small">'+esc(x.cod)+'</td><td>'+esc(x.n)+'</td><td class="small">'+esc(x.meta)+'</td><td class="small muted">'+esc(x.nota||"")+'</td><td class="small">'+esc(x.src)+'</td></tr>').join("")+'</tbody></table></div></div></details>';
  }
  return h;
}

/* ============================ NOTA TÉCNICA ============================ */
function rNotaTec(){
  const C=S.costos;const A=activos();const n=A.length||1;const Fi=finanzas(S.corte);
  const th=C.th.reduce((a,r)=>a+((num(r.horasMes)||0)*(num(r.valorHora)||0)),0);const thOk=C.th.every(r=>!num(r.horasMes)||num(r.valorHora)!=null)&&C.th.some(r=>num(r.horasMes));
  // laboratorio: frecuencia contractual anual / 12 × costo unitario
  const LK=Object.keys(LABFREQ);const perYear=f=>{const b=(f||"").replace("*","");return b==="M"?12:b==="T"?4:b==="S"?2:b==="A"?1:0;};
  let lab=0,labOk=true;A.forEach(p=>LK.forEach(k=>{const f=(LABFREQ[k]||{})[p.eps];const c=num(C.lab[k]);if(perYear(f)){if(c==null)labOk=false;else lab+=c*perYear(f)/12;}}));
  const vis=(num(C.visita)||0)*(num(C.visitasMes)||0);
  const insumos=Fi.costo;const sub=insumos+th+lab+vis+(num(C.transportePac)||0)*A.length;const adm=sub*(num(C.admPct)||0)/100;const total=sub+adm;
  const complete=Fi.costoKnown&&thOk&&labOk&&C.visita!=null&&C.admPct!=null;
  let h=head("Nota técnica del paquete de DP","Documento que sustenta el valor del paquete: población, contenido, frecuencias de uso y costo por componente, contra la tarifa de cada EPS. Se arma sola con los datos del módulo; los costos unitarios los pone la IPS.",'<button class="btn sm" onclick="window.print()">Imprimir / PDF</button>');
  h+=(!complete?alertBox("warn","<b>La nota técnica está incompleta.</b> Faltan costos: "+[!Fi.costoKnown?"insumos y medicamentos (catálogo)":"",!thOk?"talento humano (horas y valor hora)":"",!labOk?"laboratorio (costo por examen)":"",C.visita==null?"visita domiciliaria":"",C.admPct==null?"% administrativo":""].filter(Boolean).join(", ")+". Lo que está en $ 0 no es gratis: es que no hay dato."):"");
  h+='<div class="card doc" style="margin-top:12px"><h4>1. Objeto</h4><p>Atención mensual integral del paciente adulto con ERC estadio 5 en diálisis peritoneal (manual y automatizada) en UNO-P, Mocoa: terapia domiciliaria, soluciones e insumos, consulta de nefrología mensual, nutrición y psicología, laboratorio de seguimiento, medicamentos del paquete, manejo ambulatorio de complicaciones de la técnica y educación al paciente y su cuidador.</p>'+
   '<h4>2. Población al corte ('+ymLabel(S.corte)+')</h4><div class="tbl-wrap"><table><thead><tr><th>EPS</th><th class="num">Pacientes</th><th class="num">DPA</th><th class="num">DPCA</th><th class="num">Tarifa mes</th><th class="num">Ingreso mes</th></tr></thead><tbody>'+EPS_L.map(e=>{const L=A.filter(p=>p.eps===e);return'<tr><td>'+e+'</td><td class="num">'+L.length+'</td><td class="num">'+L.filter(p=>p.modalidad==="DPA").length+'</td><td class="num">'+L.filter(p=>p.modalidad==="DPCA").length+'</td><td class="num">'+money(tarifa(e))+'</td><td class="num">'+money(L.length*tarifa(e))+'</td></tr>';}).join("")+'</tbody><tfoot><tr><td><b>Total</b></td><td class="num"><b>'+A.length+'</b></td><td colspan="3"></td><td class="num"><b>'+money(Fi.ingreso)+'</b></td></tr></tfoot></table></div>'+
   '<h4>3. Frecuencias de uso por paciente-año (según contrato)</h4><div class="tbl-wrap"><table><thead><tr><th>Componente</th>'+EPS_L.map(e=>'<th class="num">'+e+'</th>').join("")+'<th class="num">Costo unitario IPS</th></tr></thead><tbody>'+
   [["Consulta de nefrología",[12,12,12]],["Nutrición",[4,4,4]],["Psicología",[4,4,4]]].map(r=>'<tr><td>'+r[0]+'</td>'+r[1].map(v=>'<td class="num">'+v+'</td>').join("")+'<td class="num muted">en talento humano</td></tr>').join("")+
   LK.map(k=>'<tr><td>'+esc(LABNAME(k))+'</td>'+EPS_L.map(e=>'<td class="num">'+perYear((LABFREQ[k]||{})[e])+'</td>').join("")+'<td class="num"><input type="number" min="0" data-clab="'+k+'" value="'+(C.lab[k]??"")+'" placeholder="$" style="width:100px"></td></tr>').join("")+'</tbody></table></div><p class="note">Frecuencia 0 = no incluido en el contrato de esa EPS. «Al ingreso» no se prorratea aquí.</p>'+
   '<h4>4. Talento humano dedicado al programa (mes)</h4><div class="tbl-wrap"><table><thead><tr><th>Rol</th><th class="num">Horas/mes para DP</th><th class="num">Valor hora (costo empresa)</th><th class="num">Costo mes</th></tr></thead><tbody>'+C.th.map((r,i)=>'<tr><td>'+esc(r.rol)+'</td><td class="num"><input type="number" min="0" data-cth="'+i+'" data-k="horasMes" value="'+(r.horasMes??"")+'"></td><td class="num"><input type="number" min="0" data-cth="'+i+'" data-k="valorHora" value="'+(r.valorHora??"")+'" style="width:110px" placeholder="$"></td><td class="num">'+money((num(r.horasMes)||0)*(num(r.valorHora)||0))+'</td></tr>').join("")+'</tbody></table></div>'+
   '<h4>5. Otros componentes</h4><div class="formgrid" style="max-width:900px"><label class="field">Costo por visita domiciliaria<input type="number" min="0" data-cgen="visita" value="'+(C.visita??"")+'" placeholder="$"></label><label class="field">Visitas domiciliarias al mes (programa)<input type="number" min="0" data-cgen="visitasMes" value="'+(C.visitasMes??"")+'"></label><label class="field">Transporte/entrega de insumos por paciente-mes<input type="number" min="0" data-cgen="transportePac" value="'+(C.transportePac??"")+'" placeholder="$"></label><label class="field">Gastos administrativos (% del costo directo)<input type="number" min="0" max="100" data-cgen="admPct" value="'+(C.admPct??"")+'"></label></div>'+
   '<h4>6. Costo total vs ingreso (mes)</h4><div class="tbl-wrap"><table><tbody>'+
   [["Insumos, soluciones y medicamentos (fórmula × costo)",insumos],["Talento humano",th],["Laboratorio (prorrateo mensual por contrato)",lab],["Visitas domiciliarias",vis],["Transporte / entrega de insumos",(num(C.transportePac)||0)*A.length],["Administración ("+(C.admPct??"?")+" %)",adm]].map(r=>'<tr><td>'+r[0]+'</td><td class="num">'+money(r[1])+'</td><td class="num">'+money(r[1]/n)+' / pac</td></tr>').join("")+
   '<tr><td><b>Costo total del programa</b></td><td class="num"><b>'+money(total)+'</b></td><td class="num"><b>'+money(total/n)+' / pac</b></td></tr><tr><td><b>Ingreso esperado</b></td><td class="num"><b>'+money(Fi.ingreso)+'</b></td><td class="num">'+money(Fi.ingreso/n)+' / pac</td></tr><tr><td><b>Resultado'+(complete?'':' (parcial: faltan costos)')+'</b></td><td class="num" style="color:'+(Fi.ingreso-total<0?"var(--bad)":"var(--ok)")+'"><b>'+money(Fi.ingreso-total)+'</b></td><td class="num">'+pct(Fi.ingreso?(Fi.ingreso-total)/Fi.ingreso:null)+' del ingreso</td></tr></tbody></table></div>'+
   '<h4>7. Por EPS (costo por paciente promedio contra tarifa)</h4><div class="tbl-wrap"><table><thead><tr><th>EPS</th><th class="num">Tarifa</th><th class="num">Costo promedio paciente-mes</th><th class="num">Diferencia</th></tr></thead><tbody>'+EPS_L.map(e=>'<tr><td>'+e+'</td><td class="num">'+money(tarifa(e))+'</td><td class="num">'+money(total/n)+'</td><td class="num" style="color:'+(tarifa(e)-total/n<0?"var(--bad)":"inherit")+'">'+money(tarifa(e)-total/n)+'</td></tr>').join("")+'</tbody></table></div><p class="note">Supuesto simplificador: el costo promedio por paciente es igual entre EPS. Con costos cargados, el costo de insumos por paciente real está en Farmacia › Costo por paciente.</p>'+
   '<h4>8. Supuestos y riesgos que mueven el resultado</h4><ul>'+
   '<li>Mallamas factura proporcional a días atendidos y glosa las actividades del plan no realizadas; FOMAG interrumpe el paquete con la hospitalización. El ingreso esperado no descuenta estos eventos.</li>'+
   '<li>Ítems que la IPS asume sin reconocimiento: mupirocina (las tres EPS), Gram y cultivo de efluente (no aparecen), trabajo social (programado trimestral, no pagado), Kt/V y orina 24 h en Mallamas, complejo B en Nueva EPS, suplemento nutricional en Mallamas/FOMAG.</li>'+
   '<li>Líquidos e insumos de cicladora no están explícitos en Mallamas ni FOMAG: si la EPS los objetara, el paquete quedaría muy por debajo del costo.</li>'+
   '<li>La tasa de peritonitis condiciona costo (antibióticos, hospitalización, retiro de catéter, transferencia a HD) y está excluida del paquete en su componente hospitalario.</li></ul>'+
   '<h4>9. Fuentes</h4><ul class="small"><li>Nueva EPS · Ficha técnica servicios y tarifas para atención renal · Paquete DP (Anexo técnico 2024).</li><li>Mallamas · Otrosí 20258600120439-21047 (vigencia 01/07/2025–31/12/2025).</li><li>FOMAG · Anexo tarifario evento y paquetes (POSMEDICA GROUP SAS - NIT 900949604nac).</li><li>Cuenta de Alto Costo · Consenso de indicadores mínimos en diálisis 2026 (síntesis técnica del proyecto).</li></ul></div>';
  return h;
}

/* ============================ CONFIGURACIÓN ============================ */
function rConfig(){
  const M=S.cfg;
  let h=head("Configuración","Metas y parámetros editables. Los valores por defecto vienen de la CAC 2026 y la ISPD; los que no tienen consenso (periodicidad de visitas, reserva domiciliaria) son decisión institucional.");
  const f=(k,l,help,step)=>'<label class="field">'+l+'<input type="number" step="'+(step||"0.1")+'" data-cfg="'+k+'" value="'+M[k]+'">'+(help?'<span class="note" style="font-weight:400">'+help+'</span>':'')+'</label>';
  h+='<div class="card"><h3>Metas clínicas</h3><div class="formgrid" style="margin-top:10px">'+f("ktv","Kt/V total semanal mínimo","CAC dia_12 (KDOQI 2006 / ISPD)")+f("hb","Hemoglobina mínima (g/dL)","CAC dia_14")+f("alb","Albúmina mínima DP (g/dL)","CAC dia_16")+f("pLo","Fósforo mínimo (mg/dL)","CAC dia_18")+f("pHi","Fósforo máximo (mg/dL)","CAC dia_18")+f("ca","Hipercalcemia: calcio total >","CAC dia_30")+f("pthLo","PTH mínima (pg/mL)","CAC dia_28","1")+f("pthHi","PTH máxima (pg/mL)","CAC dia_28","1")+f("kLo","Potasio mínimo (mEq/L)","Hipopotasemia, frecuente en DP")+f("perit","Tasa de peritonitis máxima (episodios/año)","ISPD 2022: ≤ 0,40","0.01")+'</div></div>';
  h+='<div class="card" style="margin-top:14px"><h3>Parámetros operativos</h3><div class="formgrid" style="margin-top:10px">'+f("ktvVentana","Ventana para alerta de Kt/V (meses)","","1")+f("visitaMeses","Visita domiciliaria cada (meses)","Decisión institucional","1")+f("qolMeses","Escala de calidad de vida cada (meses)","CAC dia_36: al menos una en el periodo","1")+f("reservaDias","Reserva domiciliaria de insumos (días)","Se suma a la necesidad del mes","1")+
   '<label class="field">Meses trimestrales<input type="text" data-cfgarr="anchorT" value="'+M.anchorT.join(",")+'"></label><label class="field">Meses semestrales<input type="text" data-cfgarr="anchorS" value="'+M.anchorS.join(",")+'"></label><label class="field">Mes anual<input type="text" data-cfgarr="anchorA" value="'+M.anchorA.join(",")+'"></label></div></div>';
  h+='<div class="card" style="margin-top:14px"><h3>Datos</h3><p class="sub">Copias, restauración y bitácora.</p><div class="row"><button class="btn" id="cfgReset">Restaurar datos iniciales</button><button class="btn" id="cfgLog">Ver bitácora ('+S.log.length+')</button></div><p class="note" style="margin-top:10px">Última actualización: '+(S.meta.actualizado?new Date(S.meta.actualizado).toLocaleString("es-CO"):"—")+'. Restaurar borra lo registrado en este navegador (descargue antes una copia).</p></div>';
  h+='<div class="card" style="margin-top:14px"><h3>Referencias</h3><ul class="small" style="padding-left:18px">'+
   '<li>Cuenta de Alto Costo. Consenso basado en la evidencia: indicadores mínimos para la gestión del riesgo en adultos con ERC en diálisis peritoneal o hemodiálisis. Bogotá; 2026 (síntesis técnica del proyecto).</li>'+
   '<li>Li PK-T, Chow KM, Cho Y, et al. ISPD peritonitis guideline recommendations: 2022 update on prevention and treatment. Perit Dial Int. 2022;42(2):110-153.</li>'+
   '<li>Brown EA, Blake PG, Boudville N, et al. International Society for Peritoneal Dialysis practice recommendations: prescribing high-quality goal-directed peritoneal dialysis. Perit Dial Int. 2020;40(3):244-253.</li>'+
   '<li>Chow KM, Li PK-T, Cho Y, et al. ISPD catheter-related infection recommendations: 2023 update. Perit Dial Int. 2023;43(3):201-219.</li>'+
   '<li>KDOQI. Clinical practice guidelines for peritoneal dialysis adequacy: 2006 update. Am J Kidney Dis. 2006;48(Suppl 1):S91-S158.</li>'+
   '<li>KDIGO Anemia Work Group. KDIGO clinical practice guideline for anemia in CKD. Kidney Int Suppl. 2012;2(4):279-335.</li>'+
   '<li>KDIGO CKD-MBD Update Work Group. KDIGO 2017 clinical practice guideline update for CKD-MBD. Kidney Int Suppl. 2017;7(1):1-59.</li>'+
   '<li>Watson PE, Watson ID, Batt RD. Total body water volumes for adult males and females estimated from simple anthropometric measurements. Am J Clin Nutr. 1980;33(1):27-39.</li>'+
   '<li>Ministerio de Salud y Protección Social. Resolución 3100 de 2019 (Manual de inscripción de prestadores y habilitación de servicios de salud).</li></ul></div>';
  return h;
}

/* ============================ Eventos de la interfaz ============================ */
function bindAfter(){
  const out=$("out");
  if(VIEW.mod==="contratos"&&(VIEW.sub||"buscador")==="buscador"){contratoBuscar();const q=$("cQ");if(q){q.oninput=()=>{VIEW.q=q.value;contratoBuscar();};}const ev=$("cEv");if(ev)ev.onchange=()=>{VIEW.ev=ev.checked;contratoBuscar();};}
  const hq=$("habQ");if(hq){hq.oninput=()=>{VIEW.q=hq.value;clearTimeout(hq._t);hq._t=setTimeout(()=>{const pos=hq.selectionStart;render();const n=$("habQ");n.focus();n.setSelectionRange(pos,pos);},350);};}
  const pAll=$("pAll");if(pAll)pAll.onchange=()=>{VIEW.all=pAll.checked;render();};
}
document.addEventListener("click",e=>{
  const t=e.target.closest("button,[data-pac],[data-go],tr.click");if(!t)return;const d=t.dataset;
  if(d.mod){go(d.mod);return;}
  if(d.go&&!d.pac){go(d.go);return;}
  if(d.pac&&!d.hab){go("pacientes",{pac:d.pac});return;}
  if(d.sub!=null&&t.getAttribute("role")==="tab"){VIEW.sub=d.sub;render();return;}
  if(d.hab){const x=S.habil.find(h=>h.id===d.hab);x.estado=x.estado===d.est?"Por verificar":d.est;if(!x.fecha&&d.est!=="Por verificar")x.fecha=iso(new Date());logAct("Habilitación "+x.id+" → "+d.est);save();render();return;}
  if(d.habdel){if(confirmInline(t,"Confirmar: eliminar criterio")){S.habil=S.habil.filter(h=>h.id!==d.habdel);$("dlg").hidden=true;save("Criterio eliminado");render();}return;}
  if(t.id==="habAdd"){formDlg("Agregar criterio",[{k:"std",l:"Estándar",type:"select",opts:HAB_STD,req:true},{k:"origen",l:"Origen",type:"select",opts:[["V","Res. 3100 · verificar redacción"],["L","Res. 3100 · literal"],["B","Buena práctica / contrato"]],blank:null},{k:"crit",l:"Criterio",type:"textarea",wide:true,req:true}],{},o=>{S.habil.push(Object.assign({id:"H"+pad(S.habil.length+1)+"x",estado:"Por verificar",doc:"",cod:"",ver:"",ubic:"",resp:"",fecha:"",obs:""},o));});return;}
  if(t.id==="habXls"){exportSheets({Habilitacion:S.habil.map(h=>({ID:h.id,Estandar:h.std,Origen:{L:"Literal (compendio)",V:"Verificar redacción",B:"Buena práctica/contrato"}[h.origen],Criterio:h.crit,Estado:h.estado,Documento:h.doc,Codigo:h.cod,Version:h.ver,Ubicacion:h.ubic,Responsable:h.resp,FechaVerificacion:h.fecha,Observacion:h.obs}))},"Habilitacion_DP_"+S.corte);return;}
  if(d.csug){VIEW.q=d.csug;$("cQ").value=d.csug;contratoBuscar();return;}
  if(t.id==="pNew"){editPac(null);return;}
  if(t.id==="pEdit"){editPac(pac(VIEW.pac));return;}
  if(t.id==="kNew"){editKtv(VIEW.pac,null);return;}
  if(d.kedit){editKtv(VIEW.pac,S.ktv.find(k=>k.id===d.kedit));return;}
  if(t.id==="lNew"){editLabs(VIEW.pac);return;}
  if(d.ldel){S.labs=S.labs.filter(l=>l.id!==d.ldel);save("Resultado eliminado");render();return;}
  if(t.id==="prEdit"){editPresc(pac(VIEW.pac));return;}
  if(t.id==="vNew"){editVal(VIEW.pac);return;}
  if(d.vdel){S.valoraciones=S.valoraciones.filter(v=>v.id!==d.vdel);save();render();return;}
  if(d.evnew!=null){editEvento(d.evnew||"",null);return;}
  if(d.evedit){editEvento(null,S.eventos.find(x=>x.id===d.evedit));return;}
  if(d.visnew!=null){editVisita(d.visnew||"");return;}
  if(d.visdel){S.visitas=S.visitas.filter(v=>v.id!==d.visdel);save();render();return;}
  if(d.hecho){S.hechos[d.hecho]=!S.hechos[d.hecho];if(!S.hechos[d.hecho])delete S.hechos[d.hecho];save();render();return;}
  if(d.entrega){dlgEntrega(d.entrega);return;}
  if(d.fp){VIEW.fp=d.fp;render();return;}
  if(d.fdel){const[pid,cod]=d.fdel.split("|");S.formula=S.formula.filter(f=>!(f.pac===pid&&f.cod===cod));logAct("Quita de fórmula "+pid+" "+cod);save("Producto quitado");render();return;}
  if(d.fclear){if(confirmInline(t,"Confirmar borrado")){S.formula=S.formula.filter(f=>f.pac!==d.fclear);logAct("Borra fórmula "+d.fclear);save("Fórmula borrada");render();}return;}
  if(t.id==="fAdd"){const cod=$("fAddSel").value,c=num($("fAddCant").value);if(!cod||!(c>0)){toast("Elija producto y cantidad.");return;}S.formula.push({pac:d.p,cod,cant:c});logAct("Agrega a fórmula "+d.p+" "+cod);save("Producto agregado");render();return;}
  if(d.fe!=null&&t.classList.contains("chip")){VIEW.flt=Object.assign(VIEW.flt||{},{eps:d.fe});render();return;}
  if(d.fm!=null&&t.classList.contains("chip")){VIEW.flt=Object.assign(VIEW.flt||{},{mod:d.fm});render();return;}
  if(d.tsel){VIEW.tsel=d.tsel;render();return;}
  if(d.hf!=null&&t.classList.contains("chip")){VIEW.f=d.hf;render();return;}
  if(d.habev){dlgHabEv(d.habev);return;}
  if(d.themeset){setTheme(d.themeset);return;}
  if(t.id==="catAdd"){formDlg("Agregar producto",[{k:"cod",l:"Código interno",req:true},{k:"nombre",l:"Nombre",req:true,wide:true},{k:"grupo",l:"Grupo",type:"select",opts:["Solución DP","Insumo DP","Medicamento","Aseo / asepsia","Curación","Nutrición"],req:true},{k:"unidad",l:"Unidad"},{k:"costo",l:"Costo unitario",type:"number"}],{},o=>{if(S.catalogo.some(c=>c.cod===o.cod)){toast("Código repetido");return false;}S.catalogo.push(Object.assign({stockMin:0,proveedor:""},o));});return;}
  if(t.id==="fXls"){const P=pedido(S.corte);exportSheets({Pedido:P.map(r=>({Codigo:r.c.cod,Producto:r.c.nombre,Unidad:r.c.unidad,Necesidad:r.need,Bodega:r.bod,StockMin:r.min,APedir:r.ped,Recibido:r.rec,Diferencia:r.dif,CostoUnit:r.costo,Valor:r.costo!=null?r.costo*r.ped:null})),EntregaPorPaciente:necesidad(S.corte).map(r=>({Paciente:r.pac,Nombre:pac(r.pac).nombre,Producto:(S.catalogo.find(c=>c.cod===r.cod)||{}).nombre,Formula:r.req,SaldoCasa:r.saldo,AEntregar:r.aEntregar,Entregado:r.entregado}))},"Pedido_DP_"+S.corte);return;}
  if(t.id==="iXls"){exportSheets({Indicadores:indicadores().map(x=>({Codigo:x.cod,Grupo:x.g,Indicador:x.n,Numerador:x.num,Denominador:x.den,Valor:x.v,Semaforo:x.cls,Meta:x.meta,Nota:x.nota,Fuente:x.src}))},"Indicadores_DP_"+S.corte);return;}
  if(t.id==="cfgReset"){if(confirmInline(t,"Confirmar: se borra todo lo registrado")){S=seedState();save("Datos iniciales restaurados");render();}return;}
  if(t.id==="cfgLog"){$("dlg").innerHTML='<div class="dlg"><h3>Bitácora</h3><div class="tbl-wrap" style="max-height:60vh"><table><thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th></tr></thead><tbody>'+(S.log.map(l=>'<tr><td class="small">'+new Date(l.ts).toLocaleString("es-CO")+'</td><td>'+esc(l.u)+'</td><td>'+esc(l.t)+'</td></tr>').join("")||'<tr><td colspan="3" class="muted">Vacía</td></tr>')+'</tbody></table></div><div class="actions"><button class="btn" onclick="document.getElementById(\'dlg\').hidden=true">Cerrar</button></div></div>';$("dlg").hidden=false;return;}
});
function confirmInline(btn,msg){if(btn.dataset.armed){delete btn.dataset.armed;return true;}btn.dataset.armed="1";const old=btn.innerHTML;btn.innerHTML=esc(msg);setTimeout(()=>{if(btn.dataset.armed){delete btn.dataset.armed;btn.innerHTML=old;}},3000);return false;}
document.addEventListener("change",e=>{
  const t=e.target;const d=t.dataset;
  if(d.habf){const x=S.habil.find(h=>h.id===d.habf);x[d.k]=t.value;save();return;}
  if(d.obl){const x=S.oblig.find(o=>o.id===d.obl);x[d.k]=t.value;save();return;}
  if(d.bod||d.rec){const F=farmMes(S.corte);(d.bod?F.bodega:F.recibido)[d.bod||d.rec]=t.value===""?null:num(t.value);save();render();return;}
  if(d.form){const[pid,cod]=d.form.split("|");const v=num(t.value);S.formula=S.formula.filter(f=>!(f.pac===pid&&f.cod===cod));if(v>0)S.formula.push({pac:pid,cod,cant:v});logAct("Fórmula "+pid+" "+cod+" = "+(v||0));save();render();return;}
  if(d.cat){const c=S.catalogo.find(x=>x.cod===d.cat);c[d.k]=["costo","stockMin"].includes(d.k)?(t.value===""?null:num(t.value)):t.value;save();return;}
  if(d.clab){S.costos.lab[d.clab]=t.value===""?null:num(t.value);save();render();return;}
  if(d.cth){S.costos.th[+d.cth][d.k]=t.value===""?null:num(t.value);save();render();return;}
  if(d.cgen){S.costos[d.cgen]=t.value===""?null:num(t.value);save();render();return;}
  if(d.cfg){S.cfg[d.cfg]=num(t.value);save("Parámetro actualizado");return;}
  if(d.cfgarr){S.cfg[d.cfgarr]=t.value.split(/[,; ]+/).map(Number).filter(x=>x>=1&&x<=12);save("Calendario actualizado");return;}
});
/* tooltips de gráficas */
document.addEventListener("mousemove",e=>{const t=e.target.closest&&e.target.closest("[data-tip]");const tip=$("tip");if(!t){tip.hidden=true;return;}tip.textContent=t.dataset.tip;tip.hidden=false;tip.style.left=Math.min(window.innerWidth-270,e.clientX+12)+"px";tip.style.top=(e.clientY+14)+"px";});

/* ============================ Exportación ============================ */
function download(name,blob){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);}
function exportSheets(obj,name){if(!window.XLSX){toast("No cargó la librería de Excel (requiere internet la primera vez).");return;}const wb=XLSX.utils.book_new();Object.entries(obj).forEach(([n,rows])=>{XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(rows.length?rows:[{}]),n.slice(0,31));});
  const out=XLSX.write(wb,{bookType:"xlsx",type:"array"});download(name+".xlsx",new Blob([out],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}));}
function exportAll(){
  const P=S.pacientes.map(p=>({ID:p.id,TipoDoc:p.tipoDoc,Documento:p.doc,Nombre:p.nombre,Sexo:p.sexo,FechaNac:p.fnac,Edad:p.edad,EPS:p.eps,Modalidad:p.modalidad,Estado:p.estado,IngresoTRR:p.fIngresoTRR,IngresoDP:p.fIngresoDP,FechaEgreso:p.fEgreso,CausaEgreso:p.causaEgreso,Municipio:p.municipio,Telefono:p.telefono,Cuidador:p.cuidador,DM:p.dm,HTA:p.hta,Etiologia:p.etiologia,Trasplante:p.tx,VacunaHB:p.vacHB,Diuresis:p.diuresis,Suplemento:p.nepro,ObsFuente:(p.obsFuente||[]).join(" | ")}));
  const K=S.ktv.map(k=>{const c=ktvCalc(k);return{ID:k.id,Paciente:k.pac,Periodo:k.periodo||k.etiqueta,Peso:k.peso,Talla:k.talla,Edad:k.edad,VolDrenado_mL:k.vol,BUN_efluente:k.bunEf,BUN_serico:k.bunS,Orina_mL:k.orina,BUN_urinario:k.ureaOr,DP:c.DP,V_Watson:c.V,KtV_peritoneal:c.ktvP,KtV_renal:c.ktvR,KtV_total:c.ktvT,Estado:c.estado,Motivos:c.motivos.join(" | "),Obs:k.obs,Fuente:k.fuente};});
  exportSheets({Pacientes:P,KtV:K,Laboratorios:S.labs,Eventos:S.eventos,Valoraciones:S.valoraciones,Visitas:S.visitas.map(v=>Object.assign({},v,{items:JSON.stringify(v.items||{})})),Formula:S.formula,Catalogo:S.catalogo,Habilitacion:S.habil,Obligaciones:S.oblig,Indicadores:indicadores().map(x=>({Codigo:x.cod,Indicador:x.n,Num:x.num,Den:x.den,Valor:x.v,Meta:x.meta}))},"DP_UNOP_"+S.corte);
}

/* ============================ Inicio ============================ */
(function init(){
  setTheme(getTheme());
  const how=load();
  $("corte").value=S.corte;$("usuario").value=S.meta.usuario||"";
  $("corte").onchange=e=>{if(e.target.value){S.corte=e.target.value;save();render();}};
  $("usuario").onchange=e=>{S.meta.usuario=e.target.value;save();};
  $("btnSave").onclick=()=>{download("DP_UNOP_copia_"+S.corte+"_"+iso(new Date())+".json",new Blob([JSON.stringify(S,null,1)],{type:"application/json"}));toast("Copia descargada");};
  $("fileLoad").onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const s=JSON.parse(r.result);if(!s.pacientes)throw 0;S=Object.assign(seedState(),s);S.cfg=Object.assign(JSON.parse(JSON.stringify(META_DEF)),s.cfg||{});$("corte").value=S.corte;save("Copia cargada: "+f.name);render();}catch(err){toast("El archivo no es una copia válida de este módulo.");}};r.readAsText(f);e.target.value="";};
  $("btnXlsx").onclick=exportAll;
  document.addEventListener("keydown",e=>{if(e.key==="Escape")$("dlg").hidden=true;});
  render();
  $("saveinfo").textContent=how==="restaurado"?"Sesión restaurada de este navegador":"Datos iniciales cargados desde los archivos fuente";
})();


