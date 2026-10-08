/* Programa VIH: persistencia, equivalencia de resultados tras guardar en la base y maestro único de personas
   compartido con Hemodiálisis. La cohorte ficticia del prototipo se usa SOLO aquí, en la base temporal de pruebas. */
import { beforeAll, describe, expect, it } from "vitest";
import { crearMotorVIH } from "@posmedica/clinical-rules";
import { prisma } from "../src/db.js";
import { agente, crearUsuario, sembrarProgramas } from "./ayuda.js";
import { primeraDif } from "./difpath.js";
// @ts-expect-error utilidades de prueba del paquete de reglas (TypeScript sin compilar)
import { cargarPortal } from "../../../packages/clinical-rules/test/oraculo.ts";
// @ts-expect-error utilidades de prueba del paquete de reglas (TypeScript sin compilar)
import { evaluarEn, normalizar } from "../../../packages/clinical-rules/test/comparar.ts";

type Fila = Record<string, unknown>;
const HOY = new Date(2026, 9, 8);
const CLAVE = "ClaveSegura2026";
const util = crearMotorVIH({ libro: { pac: [] } }) as unknown as { vxNewBook: () => Record<string, unknown>; VXS: Record<string, [string, string[]]> };
const HOJAS = Object.keys(util.VXS).filter((k) => !["log", "cfg"].includes(k));

/** Arma el libro del prototipo desde /vih/libro, igual que el adaptador (sin el sello _ts, que no entra en los cálculos). */
function libroDesdeApi(r: { hojas: Record<string, Fila[]>; cfg: Record<string, unknown> }) {
  const b = util.vxNewBook() as Record<string, unknown>;
  for (const k of HOJAS) b[k] = (r.hojas[k] ?? []).map(({ _ts, ...x }) => x);
  b.cfg = Object.entries(r.cfg).map(([Clave, Valor]) => ({ Clave, Valor }));
  return b;
}

let admin: ReturnType<typeof agente>;
beforeAll(async () => {
  await sembrarProgramas();
  await crearUsuario("admin.vih", CLAVE, "ADMIN");
  admin = agente();
  await admin.post("/api/v1/auth/login", { usuario: "admin.vih", clave: CLAVE });
});

describe("VIH · importación inicial y equivalencia de resultados", () => {
  it("importa la cohorte del prototipo y, leída de la base, da los mismos indicadores, alertas, carné y reportes", async () => {
    const o = cargarPortal(HOY);
    o.ev("vxDemo()");
    // Ciclo de guardado propio del prototipo: vxParse lee el libro de Excel con todo como texto y "" en las celdas vacías.
    o.ev(`for (const k of VXK) if (k !== "cfg" && k !== "log") for (const r of VX.book[k]) for (const c of VXS[k][1]) r[c] = r[c] == null ? "" : String(r[c]); vxChanged();`);
    const libro0 = o.ev<Record<string, Fila[]>>("VX.book");
    const hojas = Object.fromEntries(HOJAS.map((k) => [k, JSON.parse(JSON.stringify(libro0[k]))]));
    const cfg = Object.fromEntries((libro0.cfg as Fila[]).map((r) => [String(r.Clave), r.Valor]));
    const imp = await admin.post("/api/v1/vih/importar", { fuente: "cohorte ficticia del prototipo (prueba)", hojas, cfg });
    expect(imp.status, JSON.stringify(imp.body).slice(0, 500)).toBe(200);
    expect(imp.body.conteo.pac).toBeGreaterThan(150);

    const r = await admin.get("/api/v1/vih/libro");
    expect(r.status).toBe(200);
    const m = crearMotorVIH({ libro: libroDesdeApi(r.body), hoy: HOY, corte: o.ev("VX.corte"), ui: JSON.parse(JSON.stringify(o.ev("VX.ui"))) }) as unknown as Record<string, unknown>;
    for (const expr of [
      "vxPacs().map(p => p.ID)",
      "VX_IND.map(d => vxCalc(d, vxCorte(), {}, null))",
      "VX_IND.map(d => vxCalcBy(d, vxCorte(), {}, p => p.EPS))",
      "vxPacs().map(p => vxAlertas(p, vxCorte()))",
      "vxPacs().map(p => vxVacEstado(p, vxCorte()))",
      "vxPacs().map(p => vxLabPlan(p, vxCorte()))",
      "vxPacs().map(p => vxSt(p, vxCorte()))",
      "vxNominalRows('NUEVA EPS')",
      "vxCACRows('FAMILIAR DE COLOMBIA')",
      "vxFactMes(ym(vxCorte()), {})",
    ]) {
      const A = normalizar(evaluarEn(m, expr)), B = normalizar(o.ev(expr));
      if (JSON.stringify(A) !== JSON.stringify(B)) console.log("DIF", expr, primeraDif(A, B));
      expect(A, expr).toEqual(B);
    }
    expect(await prisma.inscripcionPrograma.count({ where: { programaClave: "vih" } })).toBe(imp.body.conteo.pac);
  });

  it("no permite una segunda importación inicial", async () => {
    expect((await admin.post("/api/v1/vih/importar", { hojas: { pac: [] } })).status).toBe(409);
  });
});

describe("maestro único de personas entre Hemodiálisis y VIH (D1)", () => {
  it("la misma persona en ambos programas comparte identidad, cada uno con su forma de escribir etnia y zona", async () => {
    const doc = "770000001";
    const enHd = await admin.post("/api/v1/hd/sincronizar", {
      cambios: { pac: { nuevos: [{ ID: "P770", TipoDoc: "CC", Documento: doc, Nombres: "Luis Alberto", Apellidos: "Jamioy Tisoy", Sexo: "Masculino", EPS: "NUEVA EPS", Etnia: "1", Zona: "2", FechaNac: "1970-02-01", Estado: "Activo" }] } },
    });
    expect(enHd.status, JSON.stringify(enHd.body)).toBe(200);
    const enVih = await admin.post("/api/v1/vih/sincronizar", {
      cambios: { pac: { nuevos: [{ ID: "V7700", TipoDoc: "CC", Documento: doc, PrimerNombre: "Luis", SegundoNombre: "Alberto", PrimerApellido: "Jamioy", SegundoApellido: "Tisoy", Sexo: "Masculino", EPS: "NUEVA EPS", Etnia: "Indígena", Zona: "Rural", FechaNac: "1970-02-01", FechaDx: "2026-01-10", Estado: "Activo" }] } },
    });
    expect(enVih.status, JSON.stringify(enVih.body)).toBe(200);
    const personas = await prisma.persona.findMany({ where: { documento: doc }, include: { hdPaciente: true, vihPaciente: true } });
    expect(personas).toHaveLength(1);
    expect(personas[0]).toMatchObject({ etnia: "1", zona: "2", primerNombre: "Luis", segundoNombre: "Alberto" });
    expect(personas[0].hdPaciente?.ID).toBe("P770");
    expect(personas[0].vihPaciente?.ID).toBe("V7700");

    // VIH cambia la zona: Hemodiálisis la ve con su código; VIH conserva su etiqueta.
    const vihP = (await admin.get("/api/v1/vih/libro")).body.hojas.pac.find((x: Fila) => x.ID === "V7700");
    expect(vihP).toMatchObject({ Etnia: "Indígena", Zona: "Rural", FechaDx: "2026-01-10", Telefono: "" });
    expect((await admin.post("/api/v1/vih/sincronizar", { cambios: { pac: { modificados: [{ ...vihP, Zona: "Urbana", Telefono: "3100000000" }] } } })).status).toBe(200);
    const hdP = (await admin.get("/api/v1/hd/libro")).body.hojas.pac.find((x: Fila) => x.ID === "P770");
    expect(hdP).toMatchObject({ Zona: "1", Etnia: "1", Telefono: "3100000000", Nombres: "Luis Alberto", Apellidos: "Jamioy Tisoy" });
  });

  it("un programa que guarda la persona con campos vacíos no borra lo que registró el otro", async () => {
    const hdP = (await admin.get("/api/v1/hd/libro")).body.hojas.pac.find((x: Fila) => x.ID === "P770");
    // Hemodiálisis guarda el paciente sin etnia, zona ni teléfono (p. ej. su formulario no los tenía).
    expect((await admin.post("/api/v1/hd/sincronizar", { cambios: { pac: { modificados: [{ ...hdP, Etnia: null, Zona: null, Telefono: null, PesoSeco: 70 }] } } })).status).toBe(200);
    const vihP = (await admin.get("/api/v1/vih/libro")).body.hojas.pac.find((x: Fila) => x.ID === "V7700");
    expect(vihP).toMatchObject({ Etnia: "Indígena", Zona: "Urbana", Telefono: "3100000000" });
  });

  it("dentro de VIH un documento no puede quedar en dos pacientes", async () => {
    const r = await admin.post("/api/v1/vih/sincronizar", { cambios: { pac: { nuevos: [{ ID: "V7701", TipoDoc: "CC", Documento: "770000001", PrimerNombre: "Otro", PrimerApellido: "Paciente" }] } } });
    expect(r.status).toBe(409);
  });

  it("el arrastre CAC se identifica por paciente (una fila por paciente)", async () => {
    const nuevo = await admin.post("/api/v1/vih/sincronizar", { cambios: { cac: { nuevos: [{ Paciente: "V7700", Corte: "2026-09-30", Fuente: "prueba", Datos: "{\"v1ideps\":\"EPS037\"}" }] } } });
    expect(nuevo.status, JSON.stringify(nuevo.body)).toBe(200);
    const fila = (await admin.get("/api/v1/vih/libro")).body.hojas.cac.find((x: Fila) => x.Paciente === "V7700");
    expect(fila).toMatchObject({ Corte: "2026-09-30", Datos: "{\"v1ideps\":\"EPS037\"}" });
    expect((await admin.post("/api/v1/vih/sincronizar", { cambios: { cac: { nuevos: [{ Paciente: "V7700", Corte: "2026-10-31" }] } } })).status).toBe(409);
  });
});
