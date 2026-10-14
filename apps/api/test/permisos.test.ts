/* Permisos por programa (decisiones D2 y D3): el administrador decide qué programas ve cada usuario y qué puede hacer
   en cada uno (ver, registrar, anular, exportar). Se verifica en el SERVIDOR, programa por programa, y que cada cambio
   rija de inmediato (sin que el usuario vuelva a ingresar). Datos ficticios mínimos en la base temporal de la prueba. */
import { beforeAll, describe, expect, it } from "vitest";
import { agente, crearUsuario, sembrarProgramas } from "./ayuda.js";

type Agente = ReturnType<typeof agente>;
const CLAVE = "ClaveSegura2026";
let admin: Agente, med: Agente;
let medId = "";
const permisos = (lista: { programa: string; ver?: boolean; registrar?: boolean; anular?: boolean; exportar?: boolean }[]) =>
  admin.put(`/api/v1/usuarios/${medId}/permisos`, { permisos: lista.map((p) => ({ ver: true, registrar: false, anular: false, exportar: false, ...p })) });

beforeAll(async () => {
  await sembrarProgramas();
  await crearUsuario("admin.perm", CLAVE, "ADMIN");
  admin = agente();
  await admin.post("/api/v1/auth/login", { usuario: "admin.perm", clave: CLAVE });
  medId = (await crearUsuario("med.perm", CLAVE, "MEDICO")).id;
  med = agente();
  await med.post("/api/v1/auth/login", { usuario: "med.perm", clave: CLAVE });
  // Un paciente ficticio en VIH y en HD para probar lectura y escritura.
  await admin.post("/api/v1/vih/sincronizar", { cambios: { pac: { nuevos: [{ ID: "V8001", TipoDoc: "CC", Documento: "880100001", PrimerNombre: "Ficticio", PrimerApellido: "Permisos" }] } } });
  await admin.post("/api/v1/hd/sincronizar", { cambios: { pac: { nuevos: [{ ID: "P8001", TipoDoc: "CC", Documento: "880100002", Nombres: "Ficticia", Apellidos: "Permisos" }] } } });
});

const LECTURAS: [string, string][] = [
  ["hd", "/api/v1/hd/libro"], ["vih", "/api/v1/vih/libro"], ["dp", "/api/v1/dp/libro"], ["ce", "/api/v1/ce/libro"], ["nefro", "/api/v1/nefro/pg/paciente?select=*"],
];
const estados = async () => Object.fromEntries(await Promise.all(LECTURAS.map(async ([p, r]) => [p, (await med.get(r)).status])));

describe("sin programas asignados", () => {
  it("no entra a ningún programa clínico; sí a Mensajes, Documentos y Calendario; nunca a la administración", async () => {
    expect(await estados()).toEqual({ hd: 403, vih: 403, dp: 403, ce: 403, nefro: 403 });
    expect((await med.get("/api/v1/portal/libro")).status).toBe(200);
    for (const r of ["/api/v1/usuarios", "/api/v1/auditoria", "/api/v1/respaldo/excel"]) expect((await med.get(r)).status, r).toBe(403);
  });
});

describe("el administrador asigna, amplía y quita; rige de inmediato", () => {
  it("con «ver» en VIH: lee VIH y nada más; no guarda, no anula, no registra exportaciones", async () => {
    expect((await permisos([{ programa: "vih" }])).status).toBe(200);
    expect(await estados()).toEqual({ hd: 403, vih: 200, dp: 403, ce: 403, nefro: 403 });
    expect((await med.get("/api/v1/vih/libro")).body.hojas.pac).toHaveLength(1);
    const pac = (await med.get("/api/v1/vih/libro")).body.hojas.pac[0];
    expect((await med.post("/api/v1/vih/sincronizar", { cambios: { pac: { modificados: [{ ...pac, Telefono: "3000000000" }] } } })).status).toBe(403);
    expect((await med.post("/api/v1/vih/auditar", { accion: "EXPORTA", detalle: "x.xlsx" })).status).toBe(403);
  });

  it("al darle «registrar» guarda en VIH sin volver a ingresar; «anular» sigue negado hasta que se lo den", async () => {
    await permisos([{ programa: "vih", registrar: true }]);
    let pac = (await med.get("/api/v1/vih/libro")).body.hojas.pac[0];
    expect((await med.post("/api/v1/vih/sincronizar", { cambios: { pac: { modificados: [{ ...pac, Telefono: "3000000001" }] } } })).status).toBe(200);
    expect((await med.post("/api/v1/vih/sincronizar", { cambios: { nov: { nuevos: [{ ID: "NV-8001", Paciente: "V8001", Fecha: "2026-10-01", Tipo: "Prueba", Anulado: "SI" }] } } })).status).toBe(403);
    await permisos([{ programa: "vih", registrar: true, anular: true, exportar: true }]);
    pac = (await med.get("/api/v1/vih/libro")).body.hojas.pac[0];
    expect((await med.post("/api/v1/vih/sincronizar", { cambios: { nov: { nuevos: [{ ID: "NV-8002", Paciente: "V8001", Fecha: "2026-10-01", Tipo: "Prueba", Anulado: "SI", MotivoAnulacion: "prueba" }] } } })).status).toBe(200);
    expect((await med.post("/api/v1/vih/auditar", { accion: "EXPORTA", detalle: "x.xlsx" })).status).toBe(200);
  });

  it("al quitarle VIH y darle Hemodiálisis, el cambio rige en la siguiente petición", async () => {
    await permisos([{ programa: "hd" }]);
    expect(await estados()).toEqual({ hd: 200, vih: 403, dp: 403, ce: 403, nefro: 403 });
  });

  it("«ver» es obligatorio: un permiso sin «ver» no da acceso; el Tablero gerencial no se asigna", async () => {
    expect((await permisos([{ programa: "dp", ver: false, registrar: true }])).status).toBe(200);
    expect((await med.get("/api/v1/auth/me")).body.usuario.permisos).toEqual([]);
    expect(await estados()).toEqual({ hd: 403, vih: 403, dp: 403, ce: 403, nefro: 403 });
    expect((await permisos([{ programa: "ger" }])).status).toBe(400);
  });

  it("un usuario inactivado pierde el acceso en la siguiente petición", async () => {
    await permisos([{ programa: "hd" }]);
    expect((await med.get("/api/v1/hd/libro")).status).toBe(200);
    expect((await admin.patch(`/api/v1/usuarios/${medId}`, { activo: false })).status).toBe(200);
    expect((await med.get("/api/v1/hd/libro")).status).toBe(401);
  });
});
