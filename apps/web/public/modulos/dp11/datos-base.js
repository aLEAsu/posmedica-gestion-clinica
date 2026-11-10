// Código propio del proyecto. Diálisis peritoneal v1.1 (punto de partida: prototipo v3.2 de la coordinación médica).

const SEED={"pacientes":[],"ktv":[],"labs":[],"formula":[],"catalogo":[],"plan":{"general":[{"act":"Muestra de líquido peritoneal","meses":[1,4,7,10]},{"act":"Kt/V (solicitar datos de recolección)","meses":[1,4,7,10]},{"act":"Orina de 24 horas","meses":[1,4,7,10]},{"act":"PET","meses":[7],"nota":"La hoja original pregunta «cada cuánto se saca». Nueva EPS lo incluye semestral; ISPD lo recomienda al inicio (4–8 semanas) y cuando la clínica lo indique."}],"porPaciente":{}}}; /* sin pacientes: los datos llegan del servidor */
const CONTRATOS={}; /* contenido de los contratos por EPS: lo entrega la API a quien ve Diálisis peritoneal (adaptador-dp11.js) */

