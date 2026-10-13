/* Diálisis peritoneal (Fase 8): estructura idéntica al prototipo, resultados idénticos tras guardar en la base, roles
   del módulo en dos capas y bitácora desde la auditoría. La demostración del prototipo se usa SOLO en esta base temporal. */
import { beforeAll, describe, expect, it } from "vitest";
import { HOJAS_DP, FECHAS_DP, NUMEROS_DP } from "../src/modulos/dp/hojas.js";
import { PERMISOS_DP, ROLES_DP } from "../src/modulos/dp/config.js";
import { prisma } from "../src/db.js";
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
const p2 = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
const plano = (r: Fila) => Object.fromEntries(Object.entries(r).filter(([k]) => !k.startsWith("_")).map(([k, v]) => [k, v instanceof Date ? iso(v) : v === "" ? null : v]));

let admin: Agente;
const u: Record<string, Agente> = {};
async function usuario(nombre: string, permisos: { programa: string; registrar?: boolean; anular?: boolean }[]) {
  const x = await crearUsuario(nombre, CLAVE, "MEDICO");
  await admin.put(`/api/v1/usuarios/${x.id}/permisos`, { permisos: permisos.map((p) => ({ ver: true, registrar: false, anular: false, exportar: false, ...p })) });
  const a = agente();
  await a.post("/api/v1/auth/login", { usuario: nombre, clave: CLAVE });
  u[nombre] = a;
}

const o = cargarPortal(HOY);
beforeAll(async () => {
  await sembrarProgramas();
  await crearUsuario("admin.dp", CLAVE, "ADMIN");
  admin = agente();
  await admin.post("/api/v1/auth/login", { usuario: "admin.dp", clave: CLAVE });
  await usuario("enf.dp", [{ programa: "dp", registrar: true }]);
  await usuario("sinrol.dp", [{ programa: "dp", registrar: true }]);
  await usuario("bact.dp", [{ programa: "lab", registrar: true }]);
  await usuario("ver.dp", [{ programa: "dp" }]);
  await o.ev("pxDemo()");
  o.ev(`PX.user = PX.book.usr.find(x => x.Rol === "Administrador")`);
});

describe("estructura idéntica al prototipo", () => {
  it("hojas, columnas, tipos, roles y permisos", () => {
    const DPS = o.ev<Record<string, [string, string[]]>>("DPS");
    for (const [k, h] of Object.entries(HOJAS_DP)) expect([h.nombre, [...h.columnas]], k).toEqual(DPS[k]);
    expect(Object.keys(HOJAS_DP).sort()).toEqual(o.ev<string[]>("DPK").filter((k) => k !== "log").sort());
    expect([...FECHAS_DP].sort()).toEqual([...o.ev<Set<string>>("DP_DATE")].sort());
    expect([...NUMEROS_DP].sort()).toEqual([...o.ev<Set<string>>("DP_NUM")].sort());
    expect(ROLES_DP).toEqual(o.ev("DP_ROLES"));
    expect(PERMISOS_DP).toEqual(o.ev("DP_PERM"));
  });
});

describe("carga inicial y equivalencia de resultados", () => {
  it("la demostración guardada en la base da los mismos indicadores, reporte CAC y valores por paciente", async () => {
    // Mismo ciclo de guardado del prototipo (Excel): celdas vacías vuelven como null.
    o.ev(`for (const k of DPK) for (const r of (DP.book[k] || [])) for (const c of DPS[k][1]) if (r[c] === "" || r[c] === undefined) r[c] = null;`);
    const original = clonarLibro(o.ev("DP.book")) as Record<string, Fila[]>;
    const hojas = Object.fromEntries(Object.keys(HOJAS_DP).map((k) => [k, (original[k] ?? []).map(plano)]));
    const imp = await admin.post("/api/v1/dp/importar", { fuente: "demostración del prototipo (prueba)", hojas });
    expect(imp.status, JSON.stringify(imp.body)).toBe(200);
    expect(imp.body.conteo.pac).toBe(original.pac.length);

    const r = await admin.get("/api/v1/dp/libro").set("Accept-Encoding", "gzip");
    expect(r.status).toBe(200);
    expect(r.headers["content-encoding"]).toBe("gzip"); // optimización: el libro viaja comprimido
    // Segundo prototipo, con el libro leído de la base (igual que el adaptador del navegador: dpRow).
    const o2 = cargarPortal(HOY);
    await o2.ev("pxDemo()");
    o2.ev(`PX.user = PX.book.usr.find(x => x.Rol === "Administrador")`);
    const libro = Object.fromEntries(Object.entries(r.body.hojas as Record<string, Fila[]>).map(([k, L]) => [k, L.map(({ _ts, ...x }) => x)]));
    o2.ev(`globalThis.__libro = ${JSON.stringify(libro)}; DP.book = dpNewBook(); for (const k of Object.keys(__libro)) DP.book[k] = __libro[k].map(dpRow); dpEnsure();`);
    const c = "TODAY()", ps = "cacStart(TODAY())";
    for (const expr of [
      `DP_IND8.concat(DP_OP).map(d => dpEval(d, ${c}, ${ps}, {}))`,
      `dpCacRun(${c}, ${ps}, "", null)`,
      `DP.book.pac.map(p => dpCacVals(p, ${c}, ${ps}))`,
      `epAll(addMonths(TODAY(), -12)).filter(e => e.src === "DP").map(e => [e.ref, e.conf])`,
      `trtAll().filter(t => t.fu === "DP")`,
    ]) {
      const A = normalizar(o2.ev(expr)), B = normalizar(o.ev(expr));
      if (JSON.stringify(A) !== JSON.stringify(B)) console.log("DIF", expr, primeraDif(A, B));
      expect(A, expr).toEqual(B);
    }
    // el maestro único: identidad en persona y sexo con su etiqueta
    const pac = await prisma.dpPaciente.findFirst({ include: { persona: true } });
    expect(["Femenino", "Masculino"]).toContain(pac?.persona.sexo);
  });
});

describe("roles del módulo en dos capas", () => {
  beforeAll(async () => {
    // Dirección Médica (el administrador) asigna los roles en la hoja RolesDP.
    const rol = (Usuario: string, Rol: string) => ({ Usuario, Rol, Activo: "SI", ConcedidoPor: "admin.dp", Fecha: "2026-10-08", Motivo: "prueba" });
    expect((await admin.post("/api/v1/dp/sincronizar", { cambios: { rol: { nuevos: [rol("enf.dp", "enf"), rol("bact.dp", "lab")] } } })).status).toBe(200);
  });
  const val = (ID: string) => ({ ID, Paciente: "DP001", Fecha: "2026-10-08", Tipo: "Enfermería", Estado: "Borrador" });

  it("sin rol en RolesDP (Solo consulta) no registra aunque tenga el permiso del programa", async () => {
    expect((await u["sinrol.dp"].post("/api/v1/dp/sincronizar", { cambios: { val: { nuevos: [val("VA-900001")] } } })).status).toBe(403);
  });
  it("Enfermería registra valoraciones pero no prescribe diálisis ni cambia roles", async () => {
    expect((await u["enf.dp"].post("/api/v1/dp/sincronizar", { cambios: { val: { nuevos: [val("VA-900002")] } } })).status).toBe(200);
    expect((await u["enf.dp"].post("/api/v1/dp/sincronizar", { cambios: { pre: { nuevos: [{ ID: "PR-900001", Paciente: "DP001", Version: 1, Modalidad: "DPCA" }] } } })).status).toBe(403);
    expect((await u["enf.dp"].post("/api/v1/dp/sincronizar", { cambios: { rol: { nuevos: [{ Usuario: "enf.dp", Rol: "dir", Activo: "SI" }] } } })).status).toBe(403);
  });
  it("Laboratorio (módulo Laboratorio + rol Laboratorio en DP) registra resultados, no valoraciones", async () => {
    expect((await u["bact.dp"].get("/api/v1/dp/libro")).status).toBe(200);
    expect((await u["bact.dp"].post("/api/v1/dp/sincronizar", { cambios: { lab: { nuevos: [{ ID: "LD-900001", Paciente: "DP001", Examen: "Hb", Valor: "10.5", FechaToma: "2026-10-07", Estado: "Registrado" }] } } })).status).toBe(200);
    expect((await u["bact.dp"].post("/api/v1/dp/sincronizar", { cambios: { val: { nuevos: [val("VA-900003")] } } })).status).toBe(403);
  });
  it("con solo «ver» se consulta y no se guarda; la bitácora muestra la auditoría del módulo", async () => {
    expect((await u["ver.dp"].post("/api/v1/dp/sincronizar", { cambios: {} })).status).toBe(403);
    const b = await u["ver.dp"].get("/api/v1/dp/bitacora");
    expect(b.status).toBe(200);
    const fila = (b.body.bitacora as Fila[]).find((x) => x.Registro === "VA-900002");
    expect(fila).toMatchObject({ Accion: "CREA", Hoja: "Valoraciones" });
  });
});
