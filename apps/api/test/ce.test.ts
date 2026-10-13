/* Consulta externa (Fase 9): estructura idéntica al prototipo, resultados idénticos tras guardar en la base, roles del
   módulo, especialidades reservadas ocultas desde el servidor y un cupo que no se asigna dos veces. También verifica que
   el Tablero gerencial no se asigne a usuarios que no son administradores. La demostración del prototipo se usa SOLO en
   esta base temporal. */
import { beforeAll, describe, expect, it } from "vitest";
import { HOJAS_CE } from "../src/modulos/ce/hojas.js";
import { PUEDE_CE, ROLES_CE } from "../src/modulos/ce/config.js";
import { primeraDif } from "./difpath.js";
import { agente, crearUsuario, sembrarProgramas } from "./ayuda.js";
// @ts-expect-error utilidades de prueba del paquete de reglas (TypeScript sin compilar)
import { cargarPortal } from "../../../packages/clinical-rules/test/oraculo.ts";
// @ts-expect-error utilidades de prueba del paquete de reglas (TypeScript sin compilar)
import { clonarLibro, normalizar } from "../../../packages/clinical-rules/test/comparar.ts";

type Fila = Record<string, unknown>;
type Agente = ReturnType<typeof agente>;
const HOY = new Date(2026, 9, 8);
const CLAVE = "ClaveSegura2026";
const texto = (r: Fila) => Object.fromEntries(Object.entries(r).filter(([k]) => !k.startsWith("_")).map(([k, v]) => [k, v == null ? "" : String(v)]));

let admin: Agente;
const u: Record<string, Agente> = {};
const ids: Record<string, string> = {};
async function usuario(nombre: string, permisos: { programa: string; registrar?: boolean }[]) {
  const x = await crearUsuario(nombre, CLAVE, "MEDICO");
  ids[nombre] = x.id;
  await admin.put(`/api/v1/usuarios/${x.id}/permisos`, { permisos: permisos.map((p) => ({ ver: true, registrar: false, anular: false, exportar: false, ...p })) });
  const a = agente();
  await a.post("/api/v1/auth/login", { usuario: nombre, clave: CLAVE });
  u[nombre] = a;
}
const libro = async (a: Agente) => (await a.get("/api/v1/ce/libro")).body as { hojas: Record<string, Fila[]> };

const o = cargarPortal(HOY);
let original: Record<string, Fila[]>;
beforeAll(async () => {
  await sembrarProgramas();
  await crearUsuario("admin.ce", CLAVE, "ADMIN");
  admin = agente();
  await admin.post("/api/v1/auth/login", { usuario: "admin.ce", clave: CLAVE });
  await usuario("admisiones.ce", [{ programa: "ce", registrar: true }]);
  await usuario("infecto.ce", [{ programa: "ce", registrar: true }]);
  await usuario("prof.ce", [{ programa: "ce", registrar: true }]);
  await usuario("otro.ce", [{ programa: "ce", registrar: true }]);
  await o.ev("pxDemo()");
  o.ev(`PX.user = PX.book.usr.find(x => x.Rol === "Administrador"); ceDemo();`);
  // Mismo ciclo de guardado del prototipo (ceParse lee todo como texto, "" en las celdas vacías).
  o.ev(`for (const k of CEK) for (const r of CE.book[k]) for (const c of CES[k][1]) r[c] = r[c] == null ? "" : String(r[c]); CE.memo = {};`);
  original = clonarLibro(o.ev("CE.book")) as Record<string, Fila[]>;
});

describe("estructura idéntica al prototipo", () => {
  it("hojas, columnas, roles y permisos", () => {
    const CES = o.ev<Record<string, [string, string[]]>>("CES");
    for (const [k, h] of Object.entries(HOJAS_CE)) expect([h.nombre, [...h.columnas]], k).toEqual(CES[k]);
    expect(Object.keys(HOJAS_CE).sort()).toEqual(o.ev<string[]>("CEK").filter((k) => k !== "log").sort());
    expect(ROLES_CE).toEqual(o.ev("CE_ROLES"));
    expect(PUEDE_CE).toEqual(o.ev("CE_PUEDE"));
  });
});

describe("carga inicial y equivalencia de resultados", () => {
  it("la demostración guardada en la base da la misma lista de espera, oportunidad, calidad del dato y candidatos por cupo", async () => {
    const hojas = Object.fromEntries(Object.keys(HOJAS_CE).map((k) => [k, (original[k] ?? []).map(texto)]));
    const imp = await admin.post("/api/v1/ce/importar", { fuente: "demostración del prototipo (prueba)", hojas });
    expect(imp.status, JSON.stringify(imp.body)).toBe(200);
    expect(imp.body.conteo.sol).toBe(original.sol.length);

    const r = await libro(admin);
    const o2 = cargarPortal(HOY);
    await o2.ev("pxDemo()");
    const L = Object.fromEntries(Object.entries(r.hojas).map(([k, F]) => [k, F.map(({ _ts, ...x }) => x)]));
    o2.ev(`PX.user = PX.book.usr.find(x => x.Rol === "Administrador"); globalThis.__libro = ${JSON.stringify(L)};
      const b = {}; CEK.forEach(k => b[k] = []); for (const k of Object.keys(__libro)) b[k] = __libro[k]; ceOpenBook(b, false);`);
    for (const expr of [
      "ceKPI()",
      "ceCalidad()",
      "ceSolsAbiertas().map(s => s.ID)",
      "ceOportCalc(ym(TODAY()))",
      "CE.book.cup.slice(0, 60).map(c => [c.ID, ceCupoEstado(c), ceCandidatos(c.ID).map(s => s.ID)])",
      "CE.book.sol.map(s => [s.ID, ceEstadoVis(s), ceBanderas(s)])",
    ]) {
      const A = normalizar(o2.ev(expr)), B = normalizar(o.ev(expr));
      if (JSON.stringify(A) !== JSON.stringify(B)) console.log("DIF", expr, primeraDif(A, B));
      expect(A, expr).toEqual(B);
    }
  });
});

describe("roles, reservadas y cupos", () => {
  let reservada = "", libre: Fila, abiertas: Fila[] = [];
  beforeAll(async () => {
    const rol = (Usuario: string, Rol: string, VeReservadas = "") => ({ Usuario, Rol, VeReservadas, Motivo: "prueba", ConcedidoPor: "admin.ce", Fecha: "2026-10-08" });
    const r = await admin.post("/api/v1/ce/sincronizar", { cambios: { rol: { nuevos: [rol("admisiones.ce", "admisiones"), rol("infecto.ce", "admisiones", "SI"), rol("prof.ce", "profesional")] } } });
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    const L = await libro(admin);
    reservada = String(L.hojas.esp.find((e) => e.Reservada === "SI")?.Codigo ?? "");
    const ocupados = new Set(L.hojas.cit.map((c) => c.Cupo));
    libre = L.hojas.cup.find((c) => c.Estado === "DISPONIBLE" && !ocupados.has(c.ID) && String(c.Fecha) >= "2026-10-09")!;
    abiertas = L.hojas.sol.filter((s) => !["CERRADA", "CON_CITA"].includes(String(s.Estado)) && s.Especialidad !== reservada);
  });

  it("quien no tiene «Ve reservadas» no recibe solicitudes ni citas de esas especialidades; las jornadas sí", async () => {
    expect(reservada).not.toBe("");
    const sinVer = (await libro(u["admisiones.ce"])).hojas;
    const conVer = (await libro(u["infecto.ce"])).hojas;
    expect(sinVer.sol.some((s) => s.Especialidad === reservada)).toBe(false);
    expect(conVer.sol.some((s) => s.Especialidad === reservada)).toBe(true);
    const solRes = new Set(conVer.sol.filter((s) => s.Especialidad === reservada).map((s) => s.ID));
    expect(sinVer.cit.some((c) => solRes.has(String(c.Solicitud)))).toBe(false);
    expect(sinVer.aut.some((a) => solRes.has(String(a.Solicitud)))).toBe(false);
    expect(sinVer.jor.length).toBe(conVer.jor.length);
  });

  it("una solicitud de una especialidad reservada solo la registra personal autorizado", async () => {
    const sol = { ID: "CES-900001", Paciente: original.pac[0].ID, Especialidad: reservada, TipoConsulta: "PRIMERA_VEZ", Estado: "EN_GESTION" };
    expect((await u["admisiones.ce"].post("/api/v1/ce/sincronizar", { cambios: { sol: { nuevos: [sol] } } })).status).toBe(403);
    expect((await u["infecto.ce"].post("/api/v1/ce/sincronizar", { cambios: { sol: { nuevos: [sol] } } })).status).toBe(200);
  });

  it("el profesional no asigna citas; sin rol (solo consulta) no registra solicitudes", async () => {
    const cita = { ID: "CEC-900001", Cupo: libre.ID, Solicitud: abiertas[0].ID, Paciente: abiertas[0].Paciente, Fecha: libre.Fecha, Hora: libre.Hora, Estado: "ASIGNADA" };
    expect((await u["prof.ce"].post("/api/v1/ce/sincronizar", { cambios: { cit: { nuevos: [cita] } } })).status).toBe(403);
    const sol = { ID: "CES-900002", Paciente: original.pac[0].ID, Especialidad: "MEDICINA_GENERAL", TipoConsulta: "CONTROL", Estado: "EN_GESTION" };
    expect((await u["otro.ce"].post("/api/v1/ce/sincronizar", { cambios: { sol: { nuevos: [sol] } } })).status).toBe(403);
  });

  it("dos personas asignan el mismo cupo a la vez: una cita queda y la otra recibe «Otro usuario asignó este cupo»", async () => {
    const cita = (ID: string, s: Fila) => ({ ID, Cupo: libre.ID, Solicitud: s.ID, Paciente: s.Paciente, Fecha: libre.Fecha, Hora: libre.Hora, Estado: "ASIGNADA" });
    const [a, b] = await Promise.all([
      u["admisiones.ce"].post("/api/v1/ce/sincronizar", { cambios: { cit: { nuevos: [cita("CEC-910001", abiertas[0])] } } }),
      admin.post("/api/v1/ce/sincronizar", { cambios: { cit: { nuevos: [cita("CEC-910002", abiertas[1])] } } }),
    ]);
    expect([a.status, b.status].sort()).toEqual([200, 409]);
    const perdedor = a.status === 409 ? a : b;
    expect(perdedor.body.error).toMatch(/Otro usuario|al mismo tiempo/);
    expect((await libro(admin)).hojas.cit.filter((c) => c.Cupo === libre.ID)).toHaveLength(1);
  });
});

describe("Tablero gerencial", () => {
  it("es solo para administradores: no se asigna a otros usuarios", async () => {
    const r = await admin.put(`/api/v1/usuarios/${ids["otro.ce"]}/permisos`, { permisos: [{ programa: "ger", ver: true, registrar: false, anular: false, exportar: false }] });
    expect(r.status).toBe(400);
  });
});
