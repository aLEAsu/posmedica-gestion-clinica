/* Libro institucional del portal (Fase 6): estructura idéntica al prototipo y reglas de acceso en el servidor. */
import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../src/db.js";
import { HOJAS_PORTAL } from "../src/modulos/portal/hojas.js";
import { agente, crearUsuario, sembrarProgramas } from "./ayuda.js";
// @ts-expect-error utilidades de prueba del paquete de reglas (TypeScript sin compilar)
import { cargarPortal } from "../../../packages/clinical-rules/test/oraculo.ts";

type Fila = Record<string, unknown>;
const CLAVE = "ClaveSegura2026";
let admin: ReturnType<typeof agente>;
const u: Record<string, { id: string; a: ReturnType<typeof agente> }> = {};

async function usuario(nombre: string, permisos: { programa: string; ver?: boolean; registrar?: boolean; anular?: boolean; exportar?: boolean }[], area?: string) {
  const x = await crearUsuario(nombre, CLAVE, "MEDICO");
  if (area) await prisma.usuario.update({ where: { id: x.id }, data: { area } });
  if (permisos.length) await admin.put(`/api/v1/usuarios/${x.id}/permisos`, { permisos: permisos.map((p) => ({ ver: true, registrar: false, anular: false, exportar: false, ...p })) });
  const a = agente();
  await a.post("/api/v1/auth/login", { usuario: nombre, clave: CLAVE });
  u[nombre] = { id: x.id, a };
}
const libro = async (a: ReturnType<typeof agente>) => (await a.get("/api/v1/portal/libro")).body as { hojas: Record<string, Fila[]>; cfg: Record<string, unknown> };

beforeAll(async () => {
  await sembrarProgramas();
  await crearUsuario("admin.portal", CLAVE, "ADMIN");
  admin = agente();
  await admin.post("/api/v1/auth/login", { usuario: "admin.portal", clave: CLAVE });
  await usuario("enf.a", [{ programa: "hd" }], "Enfermería hemodiálisis");
  await usuario("ts.b", [], "Trabajo social");
  await usuario("otro.c", [], "Nutrición");
  await usuario("sp.lider", [{ programa: "sp", registrar: true }], "Seguridad del paciente");
  await usuario("calidad.d", [], "Calidad");
  await usuario("lab.e", [{ programa: "lab", registrar: true }], "Laboratorio clínico");
});

it("las hojas del libro institucional son idénticas a las del prototipo (PSH)", () => {
  const o = cargarPortal(new Date(2026, 9, 8));
  const PSH = o.ev<Record<string, [string, string[]]>>("PSH");
  for (const [k, h] of Object.entries(HOJAS_PORTAL)) expect([h.nombre, h.columnas], k).toEqual(PSH[k]);
});

describe("mensajes: cada usuario recibe solo los suyos", () => {
  it("el remitente lo fija el servidor y solo lo ven remitente, destinatario y su área", async () => {
    const r = await u["enf.a"].a.post("/api/v1/portal/sincronizar", {
      cambios: { msg: { nuevos: [{ ID: "MS-00001", Hilo: "MS-00001", De: "alguien-mas", Para: `u:${u["ts.b"].id}`, Asunto: "Paciente ficticio sin transporte", Cuerpo: "Prueba", Estado: "Abierto" }, { ID: "MS-00002", Hilo: "MS-00002", Para: "a:Nutrición", Asunto: "Para el área", Estado: "Abierto" }] } },
    });
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    const deA = (await libro(u["enf.a"].a)).hojas.msg;
    expect(deA.map((m) => m.ID).sort()).toEqual(["MS-00001", "MS-00002"]);
    expect(deA.find((m) => m.ID === "MS-00001")?.De).toBe(u["enf.a"].id);
    expect((await libro(u["ts.b"].a)).hojas.msg.map((m) => m.ID)).toEqual(["MS-00001"]);
    expect((await libro(u["otro.c"].a)).hojas.msg.map((m) => m.ID)).toEqual(["MS-00002"]);
    expect((await libro(admin)).hojas.msg).toHaveLength(0); // tampoco el administrador lee mensajes ajenos
  });

  it("nadie puede modificar un mensaje que no le corresponde", async () => {
    const m = (await libro(u["ts.b"].a)).hojas.msg[0];
    expect((await u["otro.c"].a.post("/api/v1/portal/sincronizar", { cambios: { msg: { modificados: [{ ...m, Estado: "Cerrado" }] } } })).status).toBe(403);
    expect((await u["ts.b"].a.post("/api/v1/portal/sincronizar", { cambios: { msg: { modificados: [{ ...m, Estado: "Leído", LeidoPor: u["ts.b"].id }] } } })).status).toBe(200);
  });
});

describe("seguridad del paciente, documentos y producción", () => {
  it("cualquiera reporta un evento de seguridad; el análisis es del equipo de SP", async () => {
    expect((await u["otro.c"].a.post("/api/v1/portal/sincronizar", { cambios: { rsp: { nuevos: [{ ID: "RS-00001", Fecha: "2026-10-07", Programa: "dp", Descripcion: "Caída ficticia", Estado: "Abierto" }] } } })).status).toBe(200);
    const r = (await libro(u["otro.c"].a)).hojas.rsp;
    expect(r).toHaveLength(1); // ve su propio reporte
    expect(r[0].Usuario).toBe("otro.c");
    expect((await libro(u["ts.b"].a)).hojas.rsp).toHaveLength(0); // otro usuario no lo ve
    expect((await u["otro.c"].a.post("/api/v1/portal/sincronizar", { cambios: { rsp: { modificados: [{ ...r[0], Analisis: "x" }] } } })).status).toBe(403);
    const deSp = (await libro(u["sp.lider"].a)).hojas.rsp[0];
    expect((await u["sp.lider"].a.post("/api/v1/portal/sincronizar", { cambios: { rsp: { modificados: [{ ...deSp, Analisis: "Sin daño", Estado: "Cerrado" }] } } })).status).toBe(200);
  });

  it("los documentos los editan el administrador o Calidad", async () => {
    const doc = { ID: "DC-00001", Codigo: "GDC-PT-001", Nombre: "Protocolo ficticio", Estado: "Vigente" };
    expect((await u["otro.c"].a.post("/api/v1/portal/sincronizar", { cambios: { doc: { nuevos: [doc] } } })).status).toBe(403);
    expect((await u["calidad.d"].a.post("/api/v1/portal/sincronizar", { cambios: { doc: { nuevos: [doc] } } })).status).toBe(200);
    expect((await libro(u["otro.c"].a)).hojas.doc).toHaveLength(1); // todos los consultan
  });

  it("los valores cifrados de producción solo los recibe el administrador; los demás no pueden cambiar la configuración", async () => {
    expect((await admin.post("/api/v1/portal/sincronizar", { cfg: { prod_fin: "{\"salt\":\"s\",\"iv\":\"i\",\"ct\":\"c\"}", restringidos: "[\"Meropenem\"]" } })).status).toBe(200);
    expect((await libro(admin)).cfg.prod_fin).toBeTruthy();
    const cfgOtro = (await libro(u["otro.c"].a)).cfg;
    expect(cfgOtro.prod_fin).toBeUndefined();
    expect(cfgOtro.restringidos).toBe("[\"Meropenem\"]");
    expect((await u["otro.c"].a.post("/api/v1/portal/sincronizar", { cfg: { restringidos: "[]" } })).status).toBe(403);
    // Producción: sin el módulo asignado no se ven las atenciones
    expect((await admin.post("/api/v1/portal/sincronizar", { cambios: { prd: { nuevos: [{ ID: "PD-00001", Fecha: "2026-10-01", Programa: "ce", Cantidad: "1" }] } } })).status).toBe(200);
    expect((await libro(u["otro.c"].a)).hojas.prd).toHaveLength(0);
  });
});

describe("módulos transversales sobre los libros clínicos", () => {
  it("Laboratorio lee Hemodiálisis y registra solicitudes y resultados, pero no sesiones", async () => {
    await admin.post("/api/v1/hd/sincronizar", { cambios: { pac: { nuevos: [{ ID: "P500", TipoDoc: "CC", Documento: "500000001", Nombres: "Ficticio", Apellidos: "Laboratorio", Estado: "Activo" }] } } });
    const lab = u["lab.e"].a;
    expect((await lab.get("/api/v1/hd/libro")).status).toBe(200);
    expect((await lab.post("/api/v1/hd/sincronizar", { cambios: { sol: { nuevos: [{ ID: "SL-000001", Mes: "2026-11", Programa: "hd", Paciente: "P500", Examen: "Hb", Estado: "Muestra tomada" }] } } })).status).toBe(200);
    expect((await lab.post("/api/v1/hd/sincronizar", { cambios: { lab: { nuevos: [{ ID: "LB-000001", Paciente: "P500", FechaToma: "2026-11-03", Examen: "Hb", Valor: 10.2 }] } } })).status).toBe(200);
    expect((await lab.post("/api/v1/hd/sincronizar", { cambios: { ses: { nuevos: [{ ID: "SE-000001", Paciente: "P500", Fecha: "2026-11-03", Estado: "Realizada" }] } } })).status).toBe(403);
    // sin ningún módulo relacionado no se lee el libro de hemodiálisis
    expect((await u["otro.c"].a.get("/api/v1/hd/libro")).status).toBe(403);
  });
});
