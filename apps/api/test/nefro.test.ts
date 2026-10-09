/* Nefroprotección: fachada compatible con la API del «modo base de datos» de la Ruta, agenda y compatibilidad con el
   código ORIGINAL de la Ruta (se ejecuta en el oráculo contra este servidor). Datos ficticios solo en la base temporal. */
import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { prisma } from "../src/db.js";
import { ORIGEN, agente, app, crearUsuario, sembrarProgramas } from "./ayuda.js";
// @ts-expect-error utilidades de prueba del paquete de reglas (TypeScript sin compilar)
import { cargarNefro } from "../../../packages/clinical-rules/test/oraculo.ts";

const CLAVE = "ClaveSegura2026";
const PG = "/api/v1/nefro/pg";
let admin: ReturnType<typeof agente>;

async function medico(usuario: string, perm: Partial<Record<"ver" | "registrar" | "anular" | "exportar", boolean>>) {
  const u = await crearUsuario(usuario, CLAVE, "MEDICO");
  await admin.put(`/api/v1/usuarios/${u.id}/permisos`, { permisos: [{ programa: "nefro", ver: true, registrar: false, anular: false, exportar: false, ...perm }] });
  const a = agente();
  await a.post("/api/v1/auth/login", { usuario, clave: CLAVE });
  return a;
}

beforeAll(async () => {
  await sembrarProgramas();
  for (const nombre of ["NUEVA EPS", "FAMILIAR DE COLOMBIA", "MALLAMAS"]) await prisma.eps.upsert({ where: { nombre }, create: { nombre }, update: {} });
  await crearUsuario("admin.nefro", CLAVE, "ADMIN");
  admin = agente();
  await admin.post("/api/v1/auth/login", { usuario: "admin.nefro", clave: CLAVE });
});

const PACIENTE = {
  codigo: "NF-001", tipo_documento: "CC", documento: "880000001", nombre_completo: "Marta Lucía Ficticia", fecha_nacimiento: "1955-04-10",
  sexo: "F", eps: "Nueva EPS", municipio: "Mocoa", telefono_1: "3100000001", fecha_ingreso: "2026-01-15", hta: true, diabetes: "TIPO 2",
  enf_cardiovascular: false, causa_erc: "DM", situacion_renal: "SIN TRR", estado: "ACTIVO",
};

describe("fachada de la API de la Ruta", () => {
  let pid = "";

  it("lista las EPS con los nombres que usa la Ruta (la Ruta detecta así el modo base de datos)", async () => {
    const r = await admin.get(`${PG}/eps?select=id,nombre`);
    expect(r.status).toBe(200);
    expect(r.body.map((e: { nombre: string }) => e.nombre)).toEqual(expect.arrayContaining(["Nueva EPS", "EPS Familiar de Colombia", "Mallamas EPS"]));
  });

  it("guardar_paciente crea el paciente, su persona (sexo como en los demás programas) y la novedad de ingreso", async () => {
    const r = await admin.post(`${PG}/rpc/guardar_paciente`, { p: { paciente: PACIENTE, novedad_tipo: null, novedad_detalle: null } });
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    expect(r.body.nuevo).toBe(true);
    pid = r.body.id;
    const per = await prisma.persona.findFirst({ where: { documento: "880000001" }, include: { eps: true } });
    expect(per).toMatchObject({ sexo: "Femenino", municipio: "Mocoa", telefono: "3100000001" });
    expect(per?.eps?.nombre).toBe("NUEVA EPS");
    const pacs = (await admin.get(`${PG}/paciente?select=*`)).body;
    expect(pacs[0]).toMatchObject({ codigo: "NF-001", sexo: "F", fecha_nacimiento: "1955-04-10", hta: true, diabetes: "TIPO 2", nombre_completo: "Marta Lucía Ficticia" });
    expect((await admin.get(`${PG}/novedad?select=id,paciente_id,fecha,tipo,detalle`)).body[0]).toMatchObject({ tipo: "INGRESO", fecha: "2026-01-15" });
  });

  it("no deja dos pacientes de la Ruta con el mismo documento", async () => {
    const r = await admin.post(`${PG}/rpc/guardar_paciente`, { p: { paciente: { ...PACIENTE, codigo: "NF-002" } } });
    expect(r.status).toBe(409);
    expect(r.body.message).toMatch(/documento/);
  });

  it("los paraclínicos no se repiten (la Ruta reconoce el mensaje «duplicate»)", async () => {
    const lab = { paciente_id: pid, fecha_toma: "2026-09-01", examen: "CREATININA", valor: 1.6 };
    expect((await admin.post(`${PG}/laboratorio`, [lab])).status).toBe(201);
    const dup = await admin.post(`${PG}/laboratorio`, [lab]);
    expect(dup.status).toBe(409);
    expect(dup.body.message).toMatch(/duplicate/);
  });

  it("registrar_valoracion guarda la valoración, solo los paraclínicos nuevos y el plan", async () => {
    const v = { paciente_id: pid, fecha: "2026-09-02", profesional: "NEFROLOGIA", tipo: "CONTROL", pa_sistolica: 138, peso_kg: 64.5, ajuste_dm: true, estadio: "G3b", tfge: 38.2 };
    const r = await admin.post(`${PG}/rpc/registrar_valoracion`, {
      p: { valoracion: v, laboratorios: [{ fecha_toma: "2026-09-01", examen: "CREATININA", valor: 1.6 }, { fecha_toma: "2026-09-01", examen: "RAC", valor: 120 }], plan: [{ seccion: "Contactos", actividad: "Nefrología" }, { seccion: "Paraclínicos", actividad: "Creatinina" }] },
    });
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    expect(r.body).toMatchObject({ laboratorios: 1, plan: 2 });
    const vals = (await admin.get(`${PG}/valoracion?anulado=is.false&select=*`)).body;
    expect(vals[0]).toMatchObject({ fecha: "2026-09-02", profesional: "NEFROLOGIA", pa_sistolica: 138, peso_kg: 64.5, ajuste_dm: true });
  });

  it("anular exige el permiso «anular»; lo anulado deja de aparecer pero no se borra", async () => {
    const lab = (await admin.get(`${PG}/laboratorio?anulado=is.false&select=id,paciente_id,fecha_toma,examen,valor`)).body.find((l: { examen: string }) => l.examen === "RAC");
    const sinPermiso = await medico("med.nefro", { registrar: true });
    expect((await sinPermiso.patch(`${PG}/laboratorio?id=eq.${lab.id}`, { anulado: true, motivo_anulacion: "Error de digitación" })).status).toBe(403);
    expect((await admin.patch(`${PG}/laboratorio?id=eq.${lab.id}`, { anulado: true, motivo_anulacion: "Error de digitación" })).status).toBe(204);
    expect((await admin.get(`${PG}/laboratorio?anulado=is.false&select=id`)).body.some((l: { id: string }) => l.id === lab.id)).toBe(false);
    expect(await prisma.nefroLaboratorio.count({ where: { id: lab.id, anulado: true } })).toBe(1);
  });

  it("el modelo de atención por EPS lo cambia solo el administrador y queda versionado", async () => {
    const eps = (await admin.get(`${PG}/eps?select=id,nombre`)).body.find((e: { nombre: string }) => e.nombre === "Nueva EPS");
    const m = { eps_id: eps.id, contacto_intermedio: "NINGUNO", contacto_meses: 1, ajuste_metas_por: "NEFROLOGIA", multidisciplinario: "PAQUETE", medicamentos_contratados: false };
    const med = await medico("med.nefro2", { registrar: true });
    expect((await med.post(`${PG}/eps_modelo_atencion`, [m])).status).toBe(403);
    expect((await admin.post(`${PG}/eps_modelo_atencion`, [m])).status).toBe(201);
    expect((await admin.post(`${PG}/eps_modelo_atencion`, [{ ...m, contacto_intermedio: "MEDICO EXPERTO" }])).status).toBe(201);
    const vig = (await admin.get(`${PG}/v_eps_modelo_vigente`)).body;
    expect(vig).toHaveLength(1);
    expect(vig[0]).toMatchObject({ eps: "Nueva EPS", contacto_intermedio: "MEDICO EXPERTO" });
  });

  it("sin el programa asignado no hay acceso", async () => {
    const u = await crearUsuario("sin.nefro", CLAVE, "MEDICO");
    void u;
    const a = agente();
    await a.post("/api/v1/auth/login", { usuario: "sin.nefro", clave: CLAVE });
    expect((await a.get(`${PG}/paciente?select=*`)).status).toBe(403);
  });
});

describe("agenda de la Ruta", () => {
  it("guarda filas nuevas, rechaza ediciones simultáneas y permite la carga inicial solo con la agenda vacía", async () => {
    const jor = { clave: "J-1", datos: { id_jornada: "J-1", fecha: "2026-10-20", servicio: "NEFROLOGIA", hora_inicio: "07:00", hora_fin: "12:00", estado: "ABIERTA" } };
    const r1 = await admin.post("/api/v1/nefro/agenda/sincronizar", { cambios: { Jornadas: { nuevos: [jor] } } });
    expect(r1.status, JSON.stringify(r1.body)).toBe(200);
    const t = r1.body.ts.Jornadas["J-1"];
    expect((await admin.post("/api/v1/nefro/agenda/sincronizar", { cambios: { Jornadas: { modificados: [{ ...jor, datos: { ...jor.datos, estado: "CANCELADA" }, _ts: t }] } } })).status).toBe(200);
    expect((await admin.post("/api/v1/nefro/agenda/sincronizar", { cambios: { Jornadas: { modificados: [{ ...jor, _ts: t }] } } })).status).toBe(409);
    const ag = (await admin.get("/api/v1/nefro/agenda")).body;
    expect(ag.hojas.Jornadas[0].datos.estado).toBe("CANCELADA");
    expect((await admin.post("/api/v1/nefro/agenda/importar", { hojas: { Citas: [] } })).status).toBe(409);
  });
});

describe("compatibilidad con el código original de la Ruta", () => {
  it("la Ruta original detecta el modo base de datos, carga la cohorte desde esta API y clasifica al paciente", async () => {
    // fetch del navegador simulado → este servidor, con la sesión del administrador y la dirección de la fachada.
    const cookie = (await request(app).post("/api/v1/auth/login").set("Origin", ORIGEN).set("X-Posmedica", "1").send({ usuario: "admin.nefro", clave: CLAVE })).headers["set-cookie"];
    const fetchRuta = async (url: string, o: { method?: string; headers?: Record<string, string>; body?: string } = {}) => {
      const ruta = "/api/v1/nefro/pg/" + String(url).replace(/^api\//, "");
      const m = (o.method ?? "GET").toLowerCase() as "get" | "post" | "patch";
      let q = request(app)[m](ruta).set("Cookie", cookie).set("Origin", ORIGEN).set("X-Posmedica", "1");
      if (o.body) q = q.set("Content-Type", "application/json").send(o.body);
      const r = await q;
      const texto = r.text ?? "";
      return { ok: r.status < 400, status: r.status, json: async () => JSON.parse(texto), text: async () => texto };
    };
    const o = cargarNefro(new Date(2026, 9, 8), { fetch: fetchRuta, location: { protocol: "http:", hostname: "localhost", href: "http://localhost/" } });
    for (let i = 0; i < 100 && !o.ev("window.MG && MG.dbMode && MG.book && MG.book.pac.length"); i++) await new Promise((s) => setTimeout(s, 50));
    expect(o.ev("MG.dbMode")).toBe(true);
    expect(o.ev("MG.book.pac.map(p => p.codigo)")).toEqual(["NF-001"]);
    const snap = o.ev<{ c: { G: string; grupo: number } }>("COH.snapshot(MG.book.pac[0], MG.book, new Date(2026, 9, 8), {})");
    expect(snap.c.G).toBeTruthy();
    expect(o.ev("MG.book.L['NF-001'].length")).toBe(1); // el RAC anulado ya no aparece; queda la creatinina
  });
});
