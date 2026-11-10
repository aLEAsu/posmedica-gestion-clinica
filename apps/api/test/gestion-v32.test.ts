/* Fase E (v3.2): Contratos y tecnologías y Talento humano, solo para el administrador (decisión del 10 nov 2026).
   Datos ficticios, solo en la base temporal de la prueba. */
import { beforeAll, describe, expect, it } from "vitest";
import { HOJAS_PORTAL } from "../src/modulos/portal/hojas.js";
import { agente, crearUsuario, sembrarProgramas } from "./ayuda.js";
// @ts-expect-error utilidades de prueba del paquete de reglas (TypeScript sin compilar)
import { cargarPortal } from "../../../packages/clinical-rules/test/oraculo.ts";

type Agente = ReturnType<typeof agente>;
const CLAVE = "ClaveSegura2026";
let admin: Agente;
let medico: Agente;
const MATRIZ = {
  I: [["p1", "890278", "CUPS", "CONSULTA FICTICIA", "Consulta", "Por evento", "E", "Sección de prueba", "1", ""]],
  C: [{ id: "C1", eps: "EPS FICTICIA", titulo: "Contrato de prueba", firmas: "Representante de prueba" }],
  P: [{ id: "p1", k: "C1", tipo: "EVENTO", nombre: "Paquete de prueba" }],
  SIN: { EPO: "ERITROPOYETINA" },
};

beforeAll(async () => {
  await sembrarProgramas();
  await crearUsuario("admin.e", CLAVE, "ADMIN");
  admin = agente();
  await admin.post("/api/v1/auth/login", { usuario: "admin.e", clave: CLAVE });
  const x = await crearUsuario("med.e", CLAVE, "MEDICO");
  // Aunque se le asignaran, Contratos y Talento humano son solo del administrador.
  await admin.put(`/api/v1/usuarios/${x.id}/permisos`, { permisos: [{ programa: "hd", ver: true, registrar: true, anular: false, exportar: false }] });
  medico = agente();
  await medico.post("/api/v1/auth/login", { usuario: "med.e", clave: CLAVE });
});

describe("Contratos y tecnologías", () => {
  it("sin matriz cargada responde vacío; el administrador la carga y la consulta", async () => {
    expect((await admin.get("/api/v1/contratos/matriz")).body.matriz).toBeNull();
    const r = await admin.post("/api/v1/contratos/matriz", { matriz: MATRIZ, fuente: "prueba.json" });
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    expect(r.body).toEqual({ tecnologias: 1, documentos: 1, paquetes: 1 });
    expect((await admin.get("/api/v1/contratos/matriz")).body.matriz).toEqual(MATRIZ);
  });

  it("nadie más la consulta ni la carga", async () => {
    expect((await medico.get("/api/v1/contratos/matriz")).status).toBe(403);
    expect((await medico.post("/api/v1/contratos/matriz", { matriz: MATRIZ })).status).toBe(403);
  });

  it("rechaza una matriz con otra forma", async () => {
    expect((await admin.post("/api/v1/contratos/matriz", { matriz: { I: "no" } })).status).toBe(400);
  });
});

describe("Talento humano", () => {
  it("sus hojas son idénticas a las del código del portal (PSH)", () => {
    const o = cargarPortal(new Date(2026, 9, 8));
    const PSH = o.ev<Record<string, [string, string[]]>>("PSH");
    for (const k of ["the", "tht", "thf", "thc"]) {
      const h = HOJAS_PORTAL[k as keyof typeof HOJAS_PORTAL];
      expect([h.nombre, [...h.columnas]], k).toEqual(PSH[k]);
    }
  });

  it("el portal arranca sin personal ficticio", () => {
    const o = cargarPortal(new Date(2026, 9, 8));
    o.ev("v13SeedTH()");
    expect(o.ev("[V13.th.emp.length, V13.th.turnos.length, V13.th.formatos.length, V13.th.clima.length]")).toEqual([0, 0, 0, 0]);
  });

  it("solo el administrador registra y recibe sus hojas", async () => {
    const fila = { ID: "THT-000001", Colaborador: "Colaborador de prueba", Cargo: "Enfermería", Servicio: "Hemodiálisis", Lun: "Mañana" };
    expect((await medico.post("/api/v1/portal/sincronizar", { cambios: { tht: { nuevos: [fila] } } })).status).toBe(403);
    expect((await admin.post("/api/v1/portal/sincronizar", { cambios: { tht: { nuevos: [fila] } } })).status).toBe(200);
    expect((await admin.get("/api/v1/portal/libro")).body.hojas.tht).toHaveLength(1);
    expect((await medico.get("/api/v1/portal/libro")).body.hojas.tht).toHaveLength(0);
  });
});
