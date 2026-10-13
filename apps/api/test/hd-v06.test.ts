/* Versión 0.6 del prototipo: registro de dispositivos y limpieza en el libro de Hemodiálisis, y Microbiología y
   clasificación IAAS en el libro institucional. La ITS-CVC de HD (dia_33) se confirma con los cultivos que registra
   Laboratorio y usa los días-catéter del registro de dispositivos: se verifica que, guardado todo en la base y leído de
   nuevo, el resultado sea idéntico al del prototipo. La demostración del prototipo se usa SOLO en esta base temporal. */
import { beforeAll, describe, expect, it } from "vitest";
import { crearMotorHD } from "@posmedica/clinical-rules";
import { primeraDif } from "./difpath.js";
import { agente, crearUsuario, sembrarProgramas } from "./ayuda.js";
// @ts-expect-error utilidades de prueba del paquete de reglas (TypeScript sin compilar)
import { cargarPortal } from "../../../packages/clinical-rules/test/oraculo.ts";
// @ts-expect-error utilidades de prueba del paquete de reglas (TypeScript sin compilar)
import { clonarLibro, evaluarEn, normalizar } from "../../../packages/clinical-rules/test/comparar.ts";

type Fila = Record<string, unknown>;
type Agente = ReturnType<typeof agente>;
const HOY = new Date(2026, 9, 8);
const CLAVE = "ClaveSegura2026";
const util = crearMotorHD({ libro: { pac: [] } }) as unknown as { newBook: () => Record<string, unknown[]>; fromRow: (r: Fila) => Fila; iso: (d: Date) => string };
const plano = (r: Fila) => Object.fromEntries(Object.entries(r).filter(([k]) => !k.startsWith("_")).map(([k, v]) => [k, v instanceof Date ? util.iso(v) : v]));
const texto = (r: Fila) => Object.fromEntries(Object.entries(r).filter(([k]) => !k.startsWith("_")).map(([k, v]) => [k, v instanceof Date ? util.iso(v) : v == null ? "" : String(v)]));

function libroHd(r: { hojas: Record<string, Fila[]>; cfg: Record<string, unknown> }) {
  const b = util.newBook() as Record<string, unknown> & { cfgv: Record<string, unknown> };
  for (const [k, filas] of Object.entries(r.hojas)) b[k] = filas.map(({ _ts, ...x }) => util.fromRow(x));
  for (const [k, v] of Object.entries(r.cfg)) {
    const d = b.cfgv[k];
    b.cfgv[k] = d && typeof d === "object" && !Array.isArray(d) && v && typeof v === "object" && !Array.isArray(v) ? Object.assign({}, d, v) : v;
  }
  return b;
}

let admin: Agente;
const u: Record<string, Agente> = {};
async function usuario(nombre: string, permisos: { programa: string; registrar?: boolean }[]) {
  const x = await crearUsuario(nombre, CLAVE, "MEDICO");
  await admin.put(`/api/v1/usuarios/${x.id}/permisos`, { permisos: permisos.map((p) => ({ ver: true, registrar: false, anular: false, exportar: false, ...p })) });
  const a = agente();
  await a.post("/api/v1/auth/login", { usuario: nombre, clave: CLAVE });
  u[nombre] = a;
}

beforeAll(async () => {
  await sembrarProgramas();
  await crearUsuario("admin.v06", CLAVE, "ADMIN");
  admin = agente();
  await admin.post("/api/v1/auth/login", { usuario: "admin.v06", clave: CLAVE });
  await usuario("enf.hd", [{ programa: "hd", registrar: true }]);
  await usuario("bact.lab", [{ programa: "lab", registrar: true }]);
  await usuario("lider.iaas", [{ programa: "iaas", registrar: true }]);
});

describe("dispositivos, limpieza y microbiología guardados en la base", () => {
  it("la ITS-CVC, los días-catéter y la calidad del dato son idénticos a los del prototipo", async () => {
    const o = cargarPortal(HOY);
    await o.ev("pxDemo()");
    o.ev("ST.corte = new Date(); ST.ps = cacStart(ST.corte)");
    // Mismo ciclo de guardado del prototipo (Excel): celdas vacías vuelven como null.
    o.ev(`for (const k of Object.keys(SH)) for (const r of (ST.book[k] || [])) for (const c of SH[k][1]) if (r[c] === "" || r[c] === undefined) r[c] = null; IDX.dirty = true; ensureIdx();`);
    // El libro institucional se relee como texto con "" en las celdas vacías (pxParse): mismo ciclo en el oráculo.
    // El campo Usuario lo fija el servidor con quien registra (aquí, los usuarios de Laboratorio e IAAS de la prueba).
    o.ev(`for (const k of ["mic", "icl"]) for (const r of (PX.book[k] || [])) for (const c of PSH[k][1]) r[c] = r[c] == null ? "" : r[c] instanceof Date ? iso(r[c]) : String(r[c]);
      PX.book.mic.forEach(r => { r.Usuario = "bact.lab"; }); PX.book.icl.forEach(r => { r.Usuario = "lider.iaas"; });`);
    const original = clonarLibro(o.ev("ST.book")) as Record<string, Fila[]> & { cfgv: Fila };
    expect(original.dsp.length).toBeGreaterThan(0);
    expect(original.lim.length).toBeGreaterThan(0);
    const hojas = Object.fromEntries(Object.keys(original).filter((k) => Array.isArray(original[k]) && k !== "log").map((k) => [k, (original[k] as Fila[]).map(plano)]));
    const imp = await admin.post("/api/v1/hd/importar", { fuente: "demostración del prototipo (prueba)", hojas, cfg: original.cfgv });
    expect(imp.status, JSON.stringify(imp.body)).toBe(200);
    expect(imp.body.conteo.dsp).toBe(original.dsp.length);
    expect(imp.body.conteo.lim).toBe(original.lim.length);

    // Microbiología y clasificación las registran Laboratorio e IAAS en el libro institucional.
    const mic = (o.ev<Fila[]>("PX.book.mic") ?? []).map(texto);
    const icl = (o.ev<Fila[]>("PX.book.icl") ?? []).map(texto);
    expect(mic.length).toBeGreaterThan(0);
    expect((await u["bact.lab"].post("/api/v1/portal/sincronizar", { cambios: { mic: { nuevos: mic } } })).status).toBe(200);
    if (icl.length) expect((await u["lider.iaas"].post("/api/v1/portal/sincronizar", { cambios: { icl: { nuevos: icl } } })).status).toBe(200);

    const rHd = await u["enf.hd"].get("/api/v1/hd/libro");
    const rPx = await u["enf.hd"].get("/api/v1/portal/libro");
    expect(rPx.body.hojas.mic).toHaveLength(mic.length); // Hemodiálisis lee los cultivos de sus pacientes
    // _ts es el sello de concurrencia del adaptador: no participa en ningún cálculo.
    const portal = Object.fromEntries(Object.entries(rPx.body.hojas as Record<string, Fila[]>).map(([k, L]) => [k, L.map(({ _ts, ...x }) => x)]));
    const m = crearMotorHD({ libro: libroHd(rHd.body), portal, hoy: HOY, corte: HOY, inicioPeriodo: o.ev("ST.ps") }) as unknown as Record<string, unknown>;
    evaluarEn(m, "ensureIdx()");
    for (const expr of ['cdCalc(ST.ps, ST.corte, "")', "ST.book.evt.filter(e => e.Tipo === ITS).map(itsConf)", "IND.map(d => evalInd(d, ctxFor(ST.corte, ST.ps, ST.eps)))", "alertas()", "calidad()"]) {
      const A = normalizar(evaluarEn(m, expr)), B = normalizar(o.ev(expr));
      if (JSON.stringify(A) !== JSON.stringify(B)) console.log("DIF", expr, primeraDif(A, B));
      expect(A, expr).toEqual(B);
    }
    const its = o.ev<{ st: string }[]>("ST.book.evt.filter(e => e.Tipo === ITS).map(itsConf)");
    expect(its.some((x) => x.st === "Confirmada")).toBe(true);
  });
});

describe("cada dato lo registra su proceso de origen", () => {
  it("Microbiología solo la registra Laboratorio; la clasificación IAAS solo IAAS", async () => {
    const cultivo = { ID: "MB-999001", Programa: "hd", Paciente: "P001", Episodio: "HD:EV-1", Muestra: "Hemocultivo periférico", Estado: "Tomado", Resultado: "Pendiente" };
    expect((await u["enf.hd"].post("/api/v1/portal/sincronizar", { cambios: { mic: { nuevos: [cultivo] } } })).status).toBe(403);
    expect((await u["lider.iaas"].post("/api/v1/portal/sincronizar", { cambios: { mic: { nuevos: [cultivo] } } })).status).toBe(403);
    expect((await u["bact.lab"].post("/api/v1/portal/sincronizar", { cambios: { mic: { nuevos: [cultivo] } } })).status).toBe(200);
    const cls = { ID: "IC-999001", Fuente: "HD", Ref: "HD:EV-1", Programa: "hd", Paciente: "P001", Estado: "Pendiente" };
    expect((await u["bact.lab"].post("/api/v1/portal/sincronizar", { cambios: { icl: { nuevos: [cls] } } })).status).toBe(403);
    expect((await u["lider.iaas"].post("/api/v1/portal/sincronizar", { cambios: { icl: { nuevos: [cls] } } })).status).toBe(200);
  });

  it("IAAS lleva su plan de trabajo, hallazgos y su comité en las hojas del SOGCS; Laboratorio no", async () => {
    const pln = { ID: "PT-999001", Programa: "iaas", Proceso: "IAAS-P04", Actividad: "Supervisión de limpieza terminal", Estado: "Programada" };
    expect((await u["lider.iaas"].post("/api/v1/portal/sincronizar", { cambios: { pln: { nuevos: [pln] } } })).status).toBe(200);
    expect((await u["bact.lab"].post("/api/v1/portal/sincronizar", { cambios: { pln: { nuevos: [{ ...pln, ID: "PT-999002" }] } } })).status).toBe(403);
    const com = { ID: "CO-999001", Nombre: "Comité de Infecciones (IAAS)", Frecuencia: "Mensual", Activo: "SI" };
    expect((await u["lider.iaas"].post("/api/v1/portal/sincronizar", { cambios: { com: { nuevos: [com] } } })).status).toBe(200);
    expect((await u["lider.iaas"].post("/api/v1/portal/sincronizar", { cambios: { cmp: { nuevos: [{ ID: "CP-999001", Comite: "CO-999001", Descripcion: "Verificar adherencia", Estado: "Abierto", Programa: "iaas" }] } } })).status).toBe(200);
    expect((await u["bact.lab"].get("/api/v1/portal/libro")).body.hojas.pln).toHaveLength(0); // no es de su proceso
  });

  it("los dispositivos y la limpieza son de Hemodiálisis", async () => {
    const dsp = { ID: "DS-999001", Paciente: "P001", Tipo: "CVC tunelizado", FechaInsercion: "2026-09-01", Estado: "Activo", Validado: "SI" };
    expect((await u["bact.lab"].post("/api/v1/hd/sincronizar", { cambios: { dsp: { nuevos: [dsp] } } })).status).toBe(403);
    expect((await u["enf.hd"].post("/api/v1/hd/sincronizar", { cambios: { dsp: { nuevos: [dsp] }, lim: { nuevos: [{ ID: "LM-999001", Proceso: "MAQ_EXT", Fecha: "2026-10-07", Maquina: "M01" }] } } })).status).toBe(200);
    const r = await u["enf.hd"].get("/api/v1/hd/libro");
    expect(r.body.hojas.dsp.find((x: Fila) => x.ID === "DS-999001")?.FechaInsercion).toBe("2026-09-01");
    expect(r.body.hojas.lim.find((x: Fila) => x.ID === "LM-999001")?.Maquina).toBe("M01");
  });
});
