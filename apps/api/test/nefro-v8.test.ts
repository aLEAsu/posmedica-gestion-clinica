/* Ruta de Nefroprotección v8: la auditoría de adherencia a guías, el arrastre de la nominal por EPS y su configuración
   vivían solo en el libro de Excel. En la base se guardan fila por fila junto con la agenda (/api/v1/nefro/agenda). */
import { beforeAll, describe, expect, it } from "vitest";
import { agente, crearUsuario, sembrarProgramas } from "./ayuda.js";

type Agente = ReturnType<typeof agente>;
const CLAVE = "ClaveSegura2026";
let admin: Agente, med: Agente, lector: Agente;

async function usuario(nombre: string, registrar: boolean) {
  const x = await crearUsuario(nombre, CLAVE, "MEDICO");
  await admin.put(`/api/v1/usuarios/${x.id}/permisos`, { permisos: [{ programa: "nefro", ver: true, registrar, anular: false, exportar: false }] });
  const a = agente();
  await a.post("/api/v1/auth/login", { usuario: nombre, clave: CLAVE });
  return a;
}

beforeAll(async () => {
  await sembrarProgramas();
  await crearUsuario("admin.v8", CLAVE, "ADMIN");
  admin = agente();
  await admin.post("/api/v1/auth/login", { usuario: "admin.v8", clave: CLAVE });
  med = await usuario("med.nefro", true);
  lector = await usuario("ver.nefro", false);
});

describe("hojas v8 de la Ruta", () => {
  const audit = { clave: "AUD-0001", datos: { ID: "AUD-0001", Fecha: "08/10/2026", Auditor: "Prueba", Guia: "ERC", Codigo: "NP-0001", EPS: "NUEVA EPS", Criterio: "C1", Descripcion: "Criterio ficticio", Resultado: "Cumple", Fuente: "Manual", Observacion: "" } };
  const arrastre = { clave: "NP-0001|NUEVA_EPS", datos: { Codigo: "NP-0001", Formato: "NUEVA_EPS", Corte: "2026-09-30", Origen: "nominal_ficticia.xlsx", Datos: "{\"x\":1}" } };

  it("quien registra en Nefroprotección guarda auditorías y arrastre; se leen de vuelta", async () => {
    const r = await med.post("/api/v1/nefro/agenda/sincronizar", { cambios: { Auditoria_GPC: { nuevos: [audit] }, Arrastre_nominal: { nuevos: [arrastre] } } });
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    const g = await lector.get("/api/v1/nefro/agenda");
    expect(g.status).toBe(200);
    expect(g.body.hojas.Auditoria_GPC.map((x: { datos: unknown }) => x.datos)).toEqual([audit.datos]);
    expect(g.body.hojas.Arrastre_nominal.map((x: { clave: string }) => x.clave)).toEqual([arrastre.clave]);
    // el arrastre de un paciente y formato se reemplaza al cargar una nominal nueva (misma clave, modificado)
    const ts = g.body.hojas.Arrastre_nominal[0]._ts;
    const m = await med.post("/api/v1/nefro/agenda/sincronizar", { cambios: { Arrastre_nominal: { modificados: [{ ...arrastre, datos: { ...arrastre.datos, Corte: "2026-10-31" }, _ts: ts }] } } });
    expect(m.status).toBe(200);
  });

  it("sin permiso de registrar no se guarda; la configuración de la nominal es solo del administrador", async () => {
    expect((await lector.post("/api/v1/nefro/agenda/sincronizar", { cambios: { Auditoria_GPC: { nuevos: [{ ...audit, clave: "AUD-0002" }] } } })).status).toBe(403);
    const cfg = { clave: "codigo_ips", datos: { Clave: "codigo_ips", Valor: "860010090801" } };
    expect((await med.post("/api/v1/nefro/agenda/sincronizar", { cambios: { Config_nominal: { nuevos: [cfg] } } })).status).toBe(403);
    expect((await admin.post("/api/v1/nefro/agenda/sincronizar", { cambios: { Config_nominal: { nuevos: [cfg] } } })).status).toBe(200);
    expect((await med.get("/api/v1/nefro/agenda")).body.hojas.Config_nominal).toHaveLength(1);
  });
});
