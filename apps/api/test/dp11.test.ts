/* Fase D (v3.2): Diálisis peritoneal v1.1 guarda en la base su estado registro por registro. Se verifica: identidad en el
   maestro «persona», llave foránea al paciente, control de concurrencia, anular en vez de borrar (con su permiso),
   metas/costos/catálogo solo del administrador (y precios ocultos para los demás), carga inicial única y el paso desde
   las tablas dp_* de la v0.8. Datos ficticios, solo en la base temporal de la prueba. */
import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../src/db.js";
import { agente, crearUsuario, sembrarProgramas } from "./ayuda.js";

type Agente = ReturnType<typeof agente>;
type Datos = Record<string, unknown>;
const CLAVE = "ClaveSegura2026";
let admin: Agente;
const u: Record<string, Agente> = {};

async function usuario(nombre: string, p: { registrar?: boolean; anular?: boolean; exportar?: boolean }) {
  const x = await crearUsuario(nombre, CLAVE, "MEDICO");
  await admin.put(`/api/v1/usuarios/${x.id}/permisos`, { permisos: [{ programa: "dp", ver: true, registrar: false, anular: false, exportar: false, ...p }] });
  u[nombre] = agente();
  await u[nombre].post("/api/v1/auth/login", { usuario: nombre, clave: CLAVE });
}
const libro = async (a: Agente) => (await a.get("/api/v1/dp11/libro")).body as { estado: Datos & { pacientes: Datos[] }; ts: Record<string, Record<string, string>>; version: number };
const sync = (a: Agente, cambios: Datos) => a.post("/api/v1/dp11/sincronizar", { cambios });

const PAC = { id: "DP-901", tipoDoc: "CC", doc: "990009001", nombre: "Ficticia Ana Prueba Uno", eps: "EPS FICTICIA", sexo: "F", modalidad: "DPA", estado: "Activo", cateter: { tipo: "Tenckhoff", fImplante: "2026-01-10", cirujano: "" }, obsFuente: [] };

beforeAll(async () => {
  await sembrarProgramas();
  await crearUsuario("admin.d", CLAVE, "ADMIN");
  admin = agente();
  await admin.post("/api/v1/auth/login", { usuario: "admin.d", clave: CLAVE });
  await usuario("enf.dp", { registrar: true });
  await usuario("med.dp", { registrar: true, anular: true });
  await usuario("ver.dp", {});
});

describe("registro y lectura", () => {
  it("el paciente queda enlazado al maestro de personas y vuelve con su identidad", async () => {
    const r = await sync(u["enf.dp"], { pacientes: { nuevos: [{ clave: PAC.id, datos: PAC }] } });
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    const per = await prisma.persona.findFirst({ where: { documento: PAC.doc } });
    expect(per).toMatchObject({ primerNombre: "Ficticia", segundoNombre: "Ana", primerApellido: "Prueba", segundoApellido: "Uno" });
    const p = (await libro(u["ver.dp"])).estado.pacientes[0];
    expect(p).toMatchObject({ id: PAC.id, doc: PAC.doc, nombre: PAC.nombre, eps: "EPS FICTICIA", modalidad: "DPA", cateter: PAC.cateter });
  });

  it("laboratorios, mapas y únicos se guardan; un registro de un paciente inexistente se rechaza", async () => {
    const lab = { id: "L1", pac: PAC.id, fecha: "2026-10-01", ex: "Hb", v: 10.8, fuente: "Registro manual" };
    let r = await sync(u["enf.dp"], { labs: { nuevos: [{ clave: "L1", datos: lab }] }, hechos: { nuevos: [{ clave: "Nutrición|DP-901|2026-10", datos: { v: true } }] }, plan: { nuevos: [{ clave: "valor", datos: { v: { general: [], porPaciente: {} } } }] } });
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    const L = await libro(u["enf.dp"]);
    expect(L.estado.labs).toEqual([lab]);
    expect(L.estado.hechos).toEqual({ "Nutrición|DP-901|2026-10": true });
    expect(L.estado.plan).toEqual({ general: [], porPaciente: {} });
    r = await sync(u["enf.dp"], { labs: { nuevos: [{ clave: "L2", datos: { ...lab, id: "L2", pac: "DP-NO" } }] } });
    expect(r.status).toBe(400);
  });

  it("una modificación con un sello viejo se rechaza (409) y no sobrescribe", async () => {
    const L = await libro(u["enf.dp"]);
    const sello = L.ts.labs.L1;
    expect((await sync(u["enf.dp"], { labs: { modificados: [{ clave: "L1", datos: { id: "L1", pac: PAC.id, fecha: "2026-10-01", ex: "Hb", v: 11.2 }, _ts: sello }] } })).status).toBe(200);
    const r = await sync(u["med.dp"], { labs: { modificados: [{ clave: "L1", datos: { id: "L1", pac: PAC.id, fecha: "2026-10-01", ex: "Hb", v: 9 }, _ts: sello }] } });
    expect(r.status).toBe(409);
    expect(((await libro(admin)).estado.labs as Datos[])[0]).toMatchObject({ v: 11.2 });
  });

  it("retirar un laboratorio lo anula (exige «anular») y queda en la base", async () => {
    const L = await libro(u["enf.dp"]);
    expect((await sync(u["enf.dp"], { labs: { eliminados: [{ clave: "L1", _ts: L.ts.labs.L1 }] } })).status).toBe(403);
    expect((await sync(u["med.dp"], { labs: { eliminados: [{ clave: "L1", _ts: L.ts.labs.L1 }] } })).status).toBe(200);
    expect((await libro(admin)).estado.labs).toHaveLength(0);
    expect(await prisma.dp11Registro.findUnique({ where: { coleccion_clave: { coleccion: "labs", clave: "L1" } } })).toMatchObject({ anulado: true });
  });

  it("quien solo ve no registra", async () => {
    expect((await sync(u["ver.dp"], { labs: { nuevos: [{ clave: "L3", datos: { id: "L3", pac: PAC.id, fecha: "2026-10-02", ex: "K", v: 4.1 } }] } })).status).toBe(403);
  });
});

describe("solo el administrador", () => {
  it("cambia metas, costos y catálogo; los demás no reciben costos ni precios", async () => {
    expect((await sync(u["enf.dp"], { cfg: { nuevos: [{ clave: "valor", datos: { v: { ktv: 1.8 } } }] } })).status).toBe(403);
    const r = await sync(admin, {
      cfg: { nuevos: [{ clave: "valor", datos: { v: { ktv: 1.8 } } }] },
      costos: { nuevos: [{ clave: "valor", datos: { v: { visita: 120000 } } }] },
      catalogo: { nuevos: [{ clave: "I-1", datos: { cod: "I-1", nombre: "Bolsa 2,5 %", costo: { "EPS FICTICIA": 15000 } } }] },
    });
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    const e = (await libro(u["enf.dp"])).estado;
    expect(e.cfg).toEqual({ ktv: 1.8 });
    expect(e.costos).toBeUndefined();
    expect(e.catalogo).toEqual([{ cod: "I-1", nombre: "Bolsa 2,5 %" }]);
    expect((await libro(admin)).estado.catalogo).toEqual([{ cod: "I-1", nombre: "Bolsa 2,5 %", costo: { "EPS FICTICIA": 15000 } }]);
  });

  it("la carga inicial solo se permite con el módulo vacío", async () => {
    const r = await admin.post("/api/v1/dp11/importar", { estado: { pacientes: [{ ...PAC, id: "DP-902", doc: "990009002" }] } });
    expect(r.status).toBe(409);
    expect((await u["enf.dp"].post("/api/v1/dp11/importar", { estado: { pacientes: [] } })).status).toBe(403);
  });
});

describe("paso desde Diálisis peritoneal v0.8", () => {
  it("trae pacientes (misma persona) y laboratorios con equivalencia; informa lo que no traslada", async () => {
    // Base sin datos de la v1.1 para este caso.
    await prisma.dp11Registro.deleteMany({});
    await prisma.dp11Paciente.deleteMany({});
    const v08 = await admin.post("/api/v1/dp/sincronizar", {
      cambios: {
        pac: { nuevos: [{ ID: "DPV-1", TipoDoc: "CC", Documento: "990009101", Nombres: "Ficticio", Apellidos: "Ochocero Prueba", Sexo: "M", EPS: "EPS FICTICIA", Modalidad: "DPCA", EstadoPrograma: "Candidato", FechaInicioDP: "2026-02-01" }] },
        lab: {
          nuevos: [
            { ID: "LB-1", Paciente: "DPV-1", Examen: "Hb", Valor: "10.4", FechaToma: "2026-09-10" },
            { ID: "LB-2", Paciente: "DPV-1", Examen: "Urea", Valor: "120", FechaToma: "2026-09-10" },
            { ID: "LB-3", Paciente: "DPV-1", Examen: "Glu", Valor: "98", FechaToma: "2026-09-10" },
          ],
        },
      },
    });
    expect(v08.status, JSON.stringify(v08.body)).toBe(200);
    const r = await admin.post("/api/v1/dp11/traer-v08", {});
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    expect(r.body).toMatchObject({ pacientes: 1, laboratorios: 2, laboratoriosNoTrasladados: { Urea: 1 }, estadosConservados: { Candidato: 1 } });
    const e = (await libro(admin)).estado;
    expect(e.pacientes[0]).toMatchObject({ id: "DPV-1", doc: "990009101", modalidad: "DPCA", estado: "Candidato", fIngresoDP: "2026-02-01" });
    expect((e.labs as Datos[]).map((l) => l.ex).sort()).toEqual(["Glic", "Hb"]);
    const p08 = await prisma.dpPaciente.findUnique({ where: { ID: "DPV-1" } });
    const p11 = await prisma.dp11Paciente.findUnique({ where: { id: "DPV-1" } });
    expect(p11!.personaId).toBe(p08!.personaId);
    expect((await admin.post("/api/v1/dp11/traer-v08", {})).status).toBe(409);
  });
});
