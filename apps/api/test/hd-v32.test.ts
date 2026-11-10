/* Fase B (v3.2): Hemodiálisis guarda en la base las actividades SIIS, la bitácora de oxígeno medicinal, la verificación
   pre-turno y los signos vitales de la sesión (FC, FR, SatO2), que en la v3.2 vivían solo en memoria o en el navegador.
   Se verifica que se guarden y se lean igual, que exijan el permiso de registrar y que la llave foránea proteja al
   paciente. La cohorte de demostración se usa SOLO en esta base temporal. */
import { beforeAll, describe, expect, it } from "vitest";
import { crearMotorHD } from "@posmedica/clinical-rules";
import { agente, crearUsuario, sembrarProgramas } from "./ayuda.js";
// @ts-expect-error utilidades de prueba del paquete de reglas (TypeScript sin compilar)
import { cargarPortal } from "../../../packages/clinical-rules/test/oraculo.ts";
// @ts-expect-error utilidades de prueba del paquete de reglas (TypeScript sin compilar)
import { clonarLibro } from "../../../packages/clinical-rules/test/comparar.ts";

type Fila = Record<string, unknown>;
type Agente = ReturnType<typeof agente>;
const CLAVE = "ClaveSegura2026";
const util = crearMotorHD({ libro: { pac: [] } }) as unknown as { iso: (d: Date) => string; SH: Record<string, [string, string[]]> };
const plano = (r: Fila) => Object.fromEntries(Object.entries(r).filter(([k]) => !k.startsWith("_")).map(([k, v]) => [k, v instanceof Date ? util.iso(v) : v]));

let admin: Agente;
let enf: Agente;
let lector: Agente;
let pacienteId = "";
let sesion: Fila;

beforeAll(async () => {
  await sembrarProgramas();
  await crearUsuario("admin.v32", CLAVE, "ADMIN");
  admin = agente();
  await admin.post("/api/v1/auth/login", { usuario: "admin.v32", clave: CLAVE });
  for (const [nombre, registrar] of [["enf.v32", true], ["lector.v32", false]] as const) {
    const x = await crearUsuario(nombre, CLAVE, "MEDICO");
    await admin.put(`/api/v1/usuarios/${x.id}/permisos`, { permisos: [{ programa: "hd", ver: true, registrar, anular: false, exportar: false }] });
  }
  enf = agente();
  await enf.post("/api/v1/auth/login", { usuario: "enf.v32", clave: CLAVE });
  lector = agente();
  await lector.post("/api/v1/auth/login", { usuario: "lector.v32", clave: CLAVE });

  const o = cargarPortal(new Date(2026, 9, 8));
  await o.ev("loadDemo()");
  const libro = clonarLibro(o.ev("ST.book")) as Record<string, Fila[]> & { cfgv: Fila };
  const hojas = Object.fromEntries(Object.keys(libro).filter((k) => Array.isArray(libro[k]) && k !== "log").map((k) => [k, (libro[k] as Fila[]).map(plano)]));
  const imp = await admin.post("/api/v1/hd/importar", { fuente: "demostración (prueba v3.2)", hojas, cfg: libro.cfgv });
  expect(imp.status, JSON.stringify(imp.body)).toBe(200);
  pacienteId = String(libro.pac[0].ID);
  sesion = plano(libro.ses.find((s) => s.Paciente === pacienteId && s.Estado === "Realizada") as Fila);
});

describe("hojas nuevas de la v3.2 en el libro de Hemodiálisis", () => {
  it("el libro las declara con sus columnas", () => {
    expect(util.SH.sii[0]).toBe("ActividadesSIIS");
    expect(util.SH.oxi[1]).toEqual(expect.arrayContaining(["SatO2Pre", "SatO2Post", "FlujoLmin", "Minutos", "Litros"]));
    expect(util.SH.chk[1]).toEqual(expect.arrayContaining(["Fecha", "Turno", "Agua", "Desinfeccion"]));
    expect(util.SH.ses[1]).toEqual(expect.arrayContaining(["FC", "FR", "SatO2"]));
  });

  it("actividad SIIS, oxígeno y chequeo pre-turno se guardan y se leen igual", async () => {
    const sii = { ID: "SII-0001", Fecha: "2026-10-08", Paciente: pacienteId, Codigo: "3", Actividad: "SE REALIZA SESIÓN CON OXIGENOTERAPIA", Tipo: "ACTIVIDAD", Turno: "L-M-V Mañana", Puesto: 2, Severidad: "Informativa", Nota: "Cánula nasal 2 L/min", Estado: "Cerrado", Origen: "Registro SIIS" };
    const oxi = { ID: "OXI-0001", Fecha: "2026-10-08", Turno: "L-M-V Mañana", Puesto: 2, Paciente: pacienteId, CodigoSIIS: "3", Dispositivo: "Cánula nasal", FlujoLmin: 2, Minutos: 180, SatO2Pre: 89, SatO2Post: 95, Litros: 360, M3: 0.36 };
    const chk = { ID: "CHK-0001", Fecha: "2026-10-08", Turno: "L-M-V Mañana", Agua: "SI", Desinfeccion: "NO", Observacion: "Pendiente la terminal de la sala 2" };
    const r = await enf.post("/api/v1/hd/sincronizar", { cambios: { sii: { nuevos: [sii] }, oxi: { nuevos: [oxi] }, chk: { nuevos: [chk] } } });
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    const libro = (await enf.get("/api/v1/hd/libro")).body as { hojas: Record<string, Fila[]> };
    const uno = (k: string, id: string) => libro.hojas[k].find((x) => x.ID === id) as Fila;
    expect(uno("sii", "SII-0001")).toMatchObject({ Codigo: "3", Paciente: pacienteId, Puesto: 2 });
    expect(String(uno("sii", "SII-0001").Usuario)).toContain("enf.v32"); // la autoría la fija el servidor
    expect(uno("oxi", "OXI-0001")).toMatchObject({ FlujoLmin: 2, Minutos: 180, SatO2Pre: 89, SatO2Post: 95, Litros: 360 });
    expect(uno("chk", "CHK-0001")).toMatchObject({ Agua: "SI", Desinfeccion: "NO" });
  });

  it("la sesión guarda FC, FR y SatO2", async () => {
    const libro0 = (await enf.get("/api/v1/hd/libro")).body as { hojas: Record<string, Fila[]> };
    const actual = libro0.hojas.ses.find((x) => x.ID === sesion.ID) as Fila;
    const r = await enf.post("/api/v1/hd/sincronizar", { cambios: { ses: { modificados: [{ ...actual, FC: 82, FR: 18, SatO2: 94 }] } } });
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    const libro = (await enf.get("/api/v1/hd/libro")).body as { hojas: Record<string, Fila[]> };
    expect(libro.hojas.ses.find((x) => x.ID === sesion.ID)).toMatchObject({ FC: 82, FR: 18, SatO2: 94 });
  });

  it("sin permiso de registrar no se guardan", async () => {
    const r = await lector.post("/api/v1/hd/sincronizar", { cambios: { oxi: { nuevos: [{ ID: "OXI-0002", Fecha: "2026-10-08", Paciente: pacienteId, FlujoLmin: 1, Minutos: 60, SatO2Pre: 90, SatO2Post: 93 }] } } });
    expect(r.status).toBe(403);
  });

  it("no se registra oxígeno de un paciente que no existe", async () => {
    const r = await enf.post("/api/v1/hd/sincronizar", { cambios: { oxi: { nuevos: [{ ID: "OXI-0003", Fecha: "2026-10-08", Paciente: "NO-EXISTE", FlujoLmin: 1, Minutos: 60, SatO2Pre: 90, SatO2Post: 93 }] } } });
    expect(r.status).toBeGreaterThanOrEqual(400);
    const libro = (await enf.get("/api/v1/hd/libro")).body as { hojas: Record<string, Fila[]> };
    expect(libro.hojas.oxi.some((x) => x.ID === "OXI-0003")).toBe(false);
  });
});
