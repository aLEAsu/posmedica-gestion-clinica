/* Módulo Hemodiálisis: persistencia, permisos, concurrencia y equivalencia de resultados tras guardar en la base.
   La cohorte ficticia del prototipo se usa SOLO aquí, en la base temporal de pruebas. */
import { beforeAll, describe, expect, it } from "vitest";
import { crearMotorHD } from "@posmedica/clinical-rules";
import { prisma } from "../src/db.js";
import { primeraDif } from "./difpath.js";
import { agente, crearUsuario, sembrarProgramas } from "./ayuda.js";
// @ts-expect-error utilidades de prueba del paquete de reglas (TypeScript sin compilar)
import { cargarPortal } from "../../../packages/clinical-rules/test/oraculo.ts";
// @ts-expect-error utilidades de prueba del paquete de reglas (TypeScript sin compilar)
import { clonarLibro, evaluarEn, normalizar } from "../../../packages/clinical-rules/test/comparar.ts";

type Fila = Record<string, unknown>;
const HOY = new Date(2026, 9, 8);
const CLAVE = "ClaveSegura2026";
const util = crearMotorHD({ libro: { pac: [] } }) as unknown as { newBook: () => Record<string, unknown[]>; fromRow: (r: Fila) => Fila; iso: (d: Date) => string; SH: Record<string, [string, string[]]> };

/** Arma el libro del prototipo desde la respuesta de /hd/libro, igual que el adaptador del navegador. */
function libroDesdeApi(r: { hojas: Record<string, Fila[]>; cfg: Record<string, unknown> }) {
  const b = util.newBook() as Record<string, unknown> & { cfgv: Record<string, unknown> };
  // _ts es el sello de concurrencia del adaptador: no participa en ningún cálculo, se excluye para comparar.
  for (const [k, filas] of Object.entries(r.hojas)) b[k] = filas.map(({ _ts, ...x }) => util.fromRow(x));
  for (const [k, v] of Object.entries(r.cfg)) {
    const d = b.cfgv[k];
    b.cfgv[k] = d && typeof d === "object" && !Array.isArray(d) && v && typeof v === "object" && !Array.isArray(v) ? Object.assign({}, d, v) : v;
  }
  return b;
}
const plano = (r: Fila) => Object.fromEntries(Object.entries(r).filter(([k]) => !k.startsWith("_")).map(([k, v]) => [k, v instanceof Date ? util.iso(v) : v]));

let admin: ReturnType<typeof agente>;
beforeAll(async () => {
  await sembrarProgramas();
  await crearUsuario("admin.hd", CLAVE, "ADMIN");
  admin = agente();
  await admin.post("/api/v1/auth/login", { usuario: "admin.hd", clave: CLAVE });
});

async function medico(usuario: string, perm: Partial<Record<"ver" | "registrar" | "anular" | "exportar", boolean>> | null) {
  const u = await crearUsuario(usuario, CLAVE, "MEDICO");
  if (perm) await admin.put(`/api/v1/usuarios/${u.id}/permisos`, { permisos: [{ programa: "hd", ver: true, registrar: false, anular: false, exportar: false, ...perm }] });
  const a = agente();
  await a.post("/api/v1/auth/login", { usuario, clave: CLAVE });
  return a;
}

describe("importación inicial y equivalencia de resultados", () => {
  it("importa la cohorte del prototipo y, leída de la base, da los mismos indicadores, alertas y semáforos", async () => {
    const o = cargarPortal(HOY);
    await o.ev("loadDemo()");
    // El prototipo guarda en Excel: al reabrir el libro, las celdas vacías o ausentes vuelven como null (toAoa + sheet_to_json con defval null). Se aplica lo mismo
    // al libro del oráculo para comparar contra el ciclo de guardado propio del prototipo.
    o.ev(`for (const k of Object.keys(SH)) for (const r of (ST.book[k] || [])) for (const c of SH[k][1]) if (r[c] === "" || r[c] === undefined) r[c] = null; IDX.dirty = true; ensureIdx();`);
    const original = clonarLibro(o.ev("ST.book")) as Record<string, Fila[]> & { cfgv: Fila };
    const hojas = Object.fromEntries(Object.keys(original).filter((k) => Array.isArray(original[k]) && !["log"].includes(k)).map((k) => [k, (original[k] as Fila[]).map(plano)]));
    const imp = await admin.post("/api/v1/hd/importar", { fuente: "cohorte ficticia del prototipo (prueba)", hojas, cfg: original.cfgv });
    expect(imp.status, JSON.stringify(imp.body)).toBe(200);
    expect(imp.body.conteo.pac).toBe(40);
    expect(imp.body.conteo.ses).toBeGreaterThan(2000);

    const libro = await admin.get("/api/v1/hd/libro");
    expect(libro.status).toBe(200);
    const m = crearMotorHD({ libro: libroDesdeApi(libro.body), hoy: HOY, corte: HOY, inicioPeriodo: o.ev("ST.ps") }) as unknown as Record<string, unknown>;
    evaluarEn(m, "ensureIdx()");
    for (const expr of ["IND.map(d => evalInd(d, ctxFor(ST.corte, ST.ps, ST.eps)))", "alertas()", "calidad()", "pacs().map(p => semaforo(p, ST.corte))", "pacs().map(p => vacStatus(p, ST.corte))", "pacs().map(p => calidadDe(p, ST.corte))", "pacs().map(p => cacVals(p, ST.corte, ST.ps))"]) {
      const A = normalizar(evaluarEn(m, expr)), B = normalizar(o.ev(expr));
      if (JSON.stringify(A) !== JSON.stringify(B)) console.log("DIF", expr, primeraDif(A, B));
      expect(A, expr).toEqual(B);
    }
    // identidad en el maestro único y su inscripción en el programa
    expect(await prisma.persona.count()).toBeGreaterThanOrEqual(39);
    expect(await prisma.inscripcionPrograma.count({ where: { programaClave: "hd" } })).toBe(40);
  });

  it("no permite una segunda importación (solo carga inicial) y solo la hace el administrador", async () => {
    expect((await admin.post("/api/v1/hd/importar", { hojas: { pac: [] } })).status).toBe(409);
    const m = await medico("med.imp", { registrar: true });
    expect((await m.post("/api/v1/hd/importar", { hojas: { pac: [] } })).status).toBe(403);
  });
});

describe("permisos", () => {
  it("sin el programa asignado no ve nada; con «ver» lee pero no guarda", async () => {
    const sin = await medico("med.sin", null);
    expect((await sin.get("/api/v1/hd/libro")).status).toBe(403);
    const ver = await medico("med.ver", {});
    const r = await ver.get("/api/v1/hd/libro");
    expect(r.status).toBe(200);
    expect(r.body.finBlob).toBeNull();
    expect((await ver.post("/api/v1/hd/sincronizar", { cambios: {} })).status).toBe(403);
    expect((await ver.post("/api/v1/hd/auditar", { accion: "EXPORTA", detalle: "x.xlsx" })).status).toBe(403);
  });

  it("la configuración y la facturación son solo del administrador", async () => {
    const m = await medico("med.cfg", { registrar: true });
    expect((await m.post("/api/v1/hd/sincronizar", { cfg: { puestos: 14 } })).status).toBe(403);
    expect((await m.post("/api/v1/hd/sincronizar", { finBlob: { salt: "x", iv: "y", ct: "z" } })).status).toBe(403);
    expect((await admin.post("/api/v1/hd/sincronizar", { cfg: { puestos: 14 }, finBlob: { salt: "s", iv: "i", ct: "c" } })).status).toBe(200);
    expect((await admin.get("/api/v1/hd/libro")).body.finBlob).toEqual({ salt: "s", iv: "i", ct: "c" });
    expect((await m.get("/api/v1/hd/libro")).body.finBlob).toBeNull();
    expect((await m.get("/api/v1/hd/libro")).body.cfg.puestos).toBe(14);
  });
});

describe("registro clínico", () => {
  let enf: ReturnType<typeof agente>;
  beforeAll(async () => {
    enf = await medico("enf.hd", { registrar: true });
  });

  it("crea un paciente nuevo (persona + inscripción) y una sesión, y los devuelve iguales", async () => {
    const r = await enf.post("/api/v1/hd/sincronizar", {
      cambios: {
        pac: { nuevos: [{ ID: "P900", TipoDoc: "CC", Documento: "900000001", Nombres: "Ana María", Apellidos: "Pérez Gómez", FechaNac: "1960-05-03", Sexo: "Femenino", EPS: "NUEVA EPS", Estado: "Activo", IngresoUnidad: "2026-09-01", InicioTRR: "2026-08-20", Turno: "L-M-V Mañana", Puesto: 3, SesSemana: 3, DuracionMin: 240, PesoSeco: 61.5 }] },
        ses: { nuevos: [{ ID: "SE-900001", Fecha: "2026-10-06", Paciente: "P900", Turno: "L-M-V Mañana", Estado: "Realizada", DuracionMin: 240, Acceso: "FAV", PesoPre: 64.2, PesoPost: 61.6, Usuario: "lo que diga el cliente" }] },
      },
    });
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    expect(r.body.ts.pac.P900).toBeTruthy();
    const per = await prisma.persona.findFirst({ where: { documento: "900000001" } });
    expect(per).toMatchObject({ primerNombre: "Ana", segundoNombre: "María", primerApellido: "Pérez", segundoApellido: "Gómez" });
    const libro = (await enf.get("/api/v1/hd/libro")).body;
    const p = libro.hojas.pac.find((x: Fila) => x.ID === "P900");
    expect(p).toMatchObject({ Nombres: "Ana María", Apellidos: "Pérez Gómez", FechaNac: "1960-05-03", EPS: "NUEVA EPS", PesoSeco: 61.5, IngresoUnidad: "2026-09-01" });
    const s = libro.hojas.ses.find((x: Fila) => x.ID === "SE-900001");
    expect(s).toMatchObject({ Fecha: "2026-10-06", PesoPre: 64.2, Usuario: "Prueba enf.hd · Cargo de prueba" }); // el usuario lo pone el servidor
    expect(await prisma.auditoria.count({ where: { entidad: "hd.ses", registroId: "SE-900001", accion: "CREA" } })).toBe(1);
  });

  it("detecta ediciones simultáneas: el segundo cambio sobre un registro desactualizado se rechaza", async () => {
    const libro = (await enf.get("/api/v1/hd/libro")).body;
    const s = libro.hojas.ses.find((x: Fila) => x.ID === "SE-900001");
    const otro = await medico("enf.hd2", { registrar: true });
    expect((await otro.post("/api/v1/hd/sincronizar", { cambios: { ses: { modificados: [{ ...s, PesoPost: 61.4 }] } } })).status).toBe(200);
    const tarde = await enf.post("/api/v1/hd/sincronizar", { cambios: { ses: { modificados: [{ ...s, Nota: "editada" }] } } });
    expect(tarde.status).toBe(409);
    const aud = await prisma.auditoria.findFirst({ where: { entidad: "hd.ses", registroId: "SE-900001", accion: "MODIFICA" } });
    expect(aud?.antes).toEqual({ PesoPost: 61.6 });
    expect(aud?.despues).toEqual({ PesoPost: 61.4 });
  });

  it("rechaza IDs repetidos, pacientes inexistentes, documentos de otro paciente y fechas inválidas", async () => {
    const dup = await enf.post("/api/v1/hd/sincronizar", { cambios: { ses: { nuevos: [{ ID: "SE-900001", Paciente: "P900", Fecha: "2026-10-07" }] } } });
    expect(dup.status).toBe(409);
    expect((await enf.post("/api/v1/hd/sincronizar", { cambios: { ses: { nuevos: [{ ID: "SE-900002", Paciente: "P999", Fecha: "2026-10-07" }] } } })).status).toBe(400);
    expect((await enf.post("/api/v1/hd/sincronizar", { cambios: { pac: { nuevos: [{ ID: "P901", TipoDoc: "CC", Documento: "900000001", Nombres: "Otra", Apellidos: "Persona" }] } } })).status).toBe(409);
    expect((await enf.post("/api/v1/hd/sincronizar", { cambios: { ses: { nuevos: [{ ID: "SE-900003", Paciente: "P900", Fecha: "08/10/2026" }] } } })).status).toBe(400);
  });

  it("anular exige el permiso «anular» y queda auditado con su motivo", async () => {
    const libro = (await enf.get("/api/v1/hd/libro")).body;
    const s = libro.hojas.ses.find((x: Fila) => x.ID === "SE-900001");
    const sinPerm = await enf.post("/api/v1/hd/sincronizar", { cambios: { ses: { modificados: [{ ...s, Anulado: "SI", MotivoAnulacion: "Registro duplicado" }] } } });
    expect(sinPerm.status).toBe(403);
    const jefe = await medico("jefe.hd", { registrar: true, anular: true });
    const ok = await jefe.post("/api/v1/hd/sincronizar", { cambios: { ses: { modificados: [{ ...s, Anulado: "SI", MotivoAnulacion: "Registro duplicado" }] } } });
    expect(ok.status).toBe(200);
    const aud = await prisma.auditoria.findFirst({ where: { entidad: "hd.ses", registroId: "SE-900001", accion: "ANULA" } });
    expect(aud?.detalle).toBe("Registro duplicado");
    expect(await prisma.hdSesion.count({ where: { ID: "SE-900001" } })).toBe(1); // nunca se borra
  });

  it("la versión del programa sube con cada guardado (para avisar a otros usuarios)", async () => {
    const v1 = (await enf.get("/api/v1/hd/version")).body.version;
    await enf.post("/api/v1/hd/sincronizar", { cambios: { ctc: { nuevos: [{ ID: "CT-900001", Paciente: "P900", Fecha: "2026-10-07", Medio: "Llamada", Resultado: "Contactado, asistirá" }] } } });
    expect((await enf.get("/api/v1/hd/version")).body.version).toBe(v1 + 1);
  });
});
