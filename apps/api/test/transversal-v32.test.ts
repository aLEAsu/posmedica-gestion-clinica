/* Fase C (v3.2): preconsulta, asistencia, procedimientos, vacunación renal y soportes SISCAC pasan del navegador al libro
   institucional, con permisos POR PROGRAMA en cada fila; y las hojas nuevas de quimioterapia, capacitaciones y liberación
   de reportes. Datos ficticios, solo en la base temporal de la prueba. */
import { beforeAll, describe, expect, it } from "vitest";
import { HOJAS_PORTAL } from "../src/modulos/portal/hojas.js";
import { agente, crearUsuario, sembrarProgramas } from "./ayuda.js";
// @ts-expect-error utilidades de prueba del paquete de reglas (TypeScript sin compilar)
import { cargarPortal } from "../../../packages/clinical-rules/test/oraculo.ts";

type Agente = ReturnType<typeof agente>;
type Fila = Record<string, unknown>;
const CLAVE = "ClaveSegura2026";
let admin: Agente;
const u: Record<string, Agente> = {};

async function usuario(nombre: string, permisos: { programa: string; registrar?: boolean }[]) {
  const x = await crearUsuario(nombre, CLAVE, "MEDICO");
  await admin.put(`/api/v1/usuarios/${x.id}/permisos`, { permisos: permisos.map((p) => ({ ver: true, registrar: false, anular: false, exportar: false, ...p })) });
  u[nombre] = agente();
  await u[nombre].post("/api/v1/auth/login", { usuario: nombre, clave: CLAVE });
}
const hojas = async (a: Agente) => (await a.get("/api/v1/portal/libro")).body.hojas as Record<string, Fila[]>;
const sincronizar = (a: Agente, cambios: Record<string, unknown>) => a.post("/api/v1/portal/sincronizar", { cambios });

beforeAll(async () => {
  await sembrarProgramas();
  await crearUsuario("admin.c", CLAVE, "ADMIN");
  admin = agente();
  await admin.post("/api/v1/auth/login", { usuario: "admin.c", clave: CLAVE });
  await usuario("enf.hd.c", [{ programa: "hd", registrar: true }]);
  await usuario("med.vih.c", [{ programa: "vih", registrar: true }]);
  await usuario("qt.c", [{ programa: "qt", registrar: true }]);
});

it("las hojas nuevas del libro institucional son idénticas a las del código del portal (PSH)", () => {
  const o = cargarPortal(new Date(2026, 9, 8));
  const PSH = o.ev<Record<string, [string, string[]]>>("PSH");
  for (const k of ["qts", "cap", "lib", "pre", "asi", "qx", "vre", "sis"]) {
    const h = HOJAS_PORTAL[k as keyof typeof HOJAS_PORTAL];
    expect([h.nombre, [...h.columnas]], k).toEqual(PSH[k]);
  }
});

describe("filas por programa", () => {
  const pre = { ID: "PRE-000001", Fecha: "2026-10-08", Programa: "hd", Paciente: "P001", PAS: "132", PAD: "80", FC: "78", Listo: "SI" };

  it("Hemodiálisis registra la preconsulta de su programa", async () => {
    const r = await sincronizar(u["enf.hd.c"], { pre: { nuevos: [pre] } });
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    expect((await hojas(u["enf.hd.c"])).pre.map((x) => x.ID)).toContain("PRE-000001");
  });

  it("no registra filas de otro programa", async () => {
    const r = await sincronizar(u["enf.hd.c"], { pre: { nuevos: [{ ...pre, ID: "PRE-000002", Programa: "vih", Paciente: "V0001" }] } });
    expect(r.status).toBe(403);
  });

  it("quien no tiene el programa no recibe sus filas", async () => {
    expect((await hojas(u["med.vih.c"])).pre).toHaveLength(0);
    expect((await hojas(admin)).pre).toHaveLength(1);
  });

  it("el programa y el paciente de una fila no cambian después de creada", async () => {
    const actual = (await hojas(u["enf.hd.c"])).pre.find((x) => x.ID === "PRE-000001") as Fila;
    const r = await sincronizar(u["enf.hd.c"], { pre: { modificados: [{ ...actual, Programa: "vih", Paciente: "V0001", FC: "80" }] } });
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    const despues = (await hojas(admin)).pre.find((x) => x.ID === "PRE-000001") as Fila;
    expect(despues).toMatchObject({ Programa: "hd", Paciente: "P001", FC: "80" });
  });

  it("asistencia, procedimientos, vacunación renal y SISCAC siguen la misma regla", async () => {
    const r = await sincronizar(u["enf.hd.c"], {
      asi: { nuevos: [{ ID: "ASI-000001", Programa: "hd", Paciente: "P001", Disciplina: "Psicología", Mes: "2026-10", Resultado: "ASISTIO" }] },
      qx: { nuevos: [{ ID: "QX-000001", Fecha: "2026-10-08", Programa: "hd", Paciente: "P001", Procedimiento: "Colocación de catéter temporal", Lote: "L-1" }] },
      sis: { nuevos: [{ ID: "SIS-000001", Programa: "hd", Paciente: "P001", Soportes: JSON.stringify({ ktv: true }) }] },
    });
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    // La vacunación renal es de Nefroprotección: Hemodiálisis no la registra.
    expect((await sincronizar(u["enf.hd.c"], { vre: { nuevos: [{ ID: "VRE-000001", Programa: "nefro", Paciente: "NP-0001", VHB: "Completo" }] } })).status).toBe(403);
    const h = await hojas(u["med.vih.c"]);
    expect([h.asi.length, h.qx.length, h.sis.length]).toEqual([0, 0, 0]);
  });
});

describe("hojas nuevas de la v2.1", () => {
  it("las sesiones de quimioterapia las lee y registra solo Quimioterapia", async () => {
    const r = await sincronizar(u["qt.c"], { qts: { nuevos: [{ ID: "QT-000001", Fecha: "2026-10-08", Paciente: "Q-1", Esquema: "FOLFOX", Ciclo: "3", DobleVerif: "SI", Estado: "Administrada" }] } });
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    expect((await hojas(u["enf.hd.c"])).qts).toHaveLength(0);
    expect((await hojas(u["qt.c"])).qts).toHaveLength(1);
    expect((await sincronizar(u["enf.hd.c"], { qts: { nuevos: [{ ID: "QT-000002", Fecha: "2026-10-08", Paciente: "Q-2" }] } })).status).toBe(403);
  });

  it("una capacitación la registra quien registra en su programa", async () => {
    expect((await sincronizar(u["enf.hd.c"], { cap: { nuevos: [{ ID: "CAP-000001", Fecha: "2026-10-20", Programa: "hd", Tema: "Manejo del catéter" }] } })).status).toBe(200);
    expect((await sincronizar(u["enf.hd.c"], { cap: { nuevos: [{ ID: "CAP-000002", Fecha: "2026-10-20", Programa: "vih", Tema: "Adherencia TAR" }] } })).status).toBe(403);
    expect((await hojas(u["med.vih.c"])).cap.map((x) => x.ID)).toContain("CAP-000001"); // sin datos de pacientes: todos la ven
  });

  it("la liberación de un reporte la ve solo su programa", async () => {
    expect((await sincronizar(u["med.vih.c"], { lib: { nuevos: [{ ID: "LIB-000001", Fecha: "2026-10-08", Programa: "vih", Reporte: "CAC VIH", Dictamen: "Liberado" }] } })).status).toBe(200);
    expect((await hojas(u["enf.hd.c"])).lib).toHaveLength(0);
  });
});
