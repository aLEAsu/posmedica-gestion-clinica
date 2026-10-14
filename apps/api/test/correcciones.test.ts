/* Correcciones de la auditoría técnica (13 oct 2026): cada prueba reproduce el problema encontrado y verifica la
   corrección. Datos ficticios mínimos, solo en la base temporal de esta prueba. */
import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../src/db.js";
import { purgarSesiones } from "../src/security/session.js";
import { agente, crearUsuario, sembrarProgramas } from "./ayuda.js";

type Fila = Record<string, unknown>;
type Agente = ReturnType<typeof agente>;
const CLAVE = "ClaveSegura2026";
let admin: Agente;
const u: Record<string, Agente> = {};
const ids: Record<string, string> = {};

async function usuario(nombre: string, permisos: { programa: string; registrar?: boolean }[]) {
  const x = await crearUsuario(nombre, CLAVE, "MEDICO");
  ids[nombre] = x.id;
  await admin.put(`/api/v1/usuarios/${x.id}/permisos`, { permisos: permisos.map((p) => ({ ver: true, registrar: false, anular: false, exportar: false, ...p })) });
  u[nombre] = agente();
  await u[nombre].post("/api/v1/auth/login", { usuario: nombre, clave: CLAVE });
}
const hd = async (a: Agente) => (await a.get("/api/v1/hd/libro")).body.hojas as Record<string, Fila[]>;

beforeAll(async () => {
  await sembrarProgramas();
  await crearUsuario("admin.cor", CLAVE, "ADMIN");
  admin = agente();
  await admin.post("/api/v1/auth/login", { usuario: "admin.cor", clave: CLAVE });
  await usuario("enf.cor", [{ programa: "hd", registrar: true }]);
  await usuario("otra.cor", [{ programa: "hd", registrar: true }]);
  await usuario("ce.cor", [{ programa: "ce", registrar: true }]);
  const r = await admin.post("/api/v1/hd/sincronizar", {
    cambios: {
      pac: { nuevos: [{ ID: "P801", TipoDoc: "CC", Documento: "801000001", Nombres: "Ficticia", Apellidos: "Uno", Estado: "Activo" }] },
      evt: { nuevos: [{ ID: "EV-801001", Paciente: "P801", Fecha: "2026-10-01", Tipo: "Hipotensión" }] },
    },
  });
  expect(r.status, JSON.stringify(r.body)).toBe(200);
});

describe("libros: autoría, paciente y concurrencia", () => {
  it("H5: nadie cambia el autor ni la fecha de registro de un registro ajeno", async () => {
    const ev = (await hd(u["enf.cor"])).evt.find((e) => e.ID === "EV-801001")!;
    const r = await u["enf.cor"].post("/api/v1/hd/sincronizar", { cambios: { evt: { modificados: [{ ...ev, Usuario: "Otra persona · Cargo falso", Registrado: "2020-01-01 00:00", Detalle: "corrección" }] } } });
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    const despues = (await hd(u["enf.cor"])).evt.find((e) => e.ID === "EV-801001")!;
    expect(despues.Usuario).toBe("Prueba enf.cor · Cargo de prueba"); // queda quien modificó, nunca el nombre inventado
    expect(despues.Registrado).toBe(ev.Registrado);
  });

  it("H7: una modificación no puede apuntar a un paciente inexistente", async () => {
    const ev = (await hd(u["enf.cor"])).evt.find((e) => e.ID === "EV-801001")!;
    expect((await u["enf.cor"].post("/api/v1/hd/sincronizar", { cambios: { evt: { modificados: [{ ...ev, Paciente: "P999" }] } } })).status).toBe(400);
  });

  it("H12: una modificación sin sello de concurrencia se rechaza (no pisa cambios ajenos)", async () => {
    const { _ts, ...ev } = (await hd(u["enf.cor"])).evt.find((e) => e.ID === "EV-801001")!;
    expect(_ts).toBeTruthy();
    expect((await u["otra.cor"].post("/api/v1/hd/sincronizar", { cambios: { evt: { modificados: [{ ...ev, Detalle: "sin sello" }] } } })).status).toBe(409);
  });
});

describe("mensajes: el destinatario solo marca lectura y cierre", () => {
  it("no puede reescribir el asunto ni el cuerpo de un mensaje ajeno", async () => {
    const r = await admin.post("/api/v1/portal/sincronizar", { cambios: { msg: { nuevos: [{ ID: "MS-801", Hilo: "MS-801", Para: `u:${ids["enf.cor"]}`, Asunto: "Original", Cuerpo: "Texto original", Estado: "Enviado" }] } } });
    expect(r.status).toBe(200);
    const m = ((await u["enf.cor"].get("/api/v1/portal/libro")).body.hojas.msg as Fila[]).find((x) => x.ID === "MS-801")!;
    expect((await u["enf.cor"].post("/api/v1/portal/sincronizar", { cambios: { msg: { modificados: [{ ...m, Estado: "Leído", Asunto: "Alterado", Cuerpo: "Alterado" }] } } })).status).toBe(200);
    const d = ((await admin.get("/api/v1/portal/libro")).body.hojas.msg as Fila[]).find((x) => x.ID === "MS-801")!;
    expect(d).toMatchObject({ Estado: "Leído", Asunto: "Original", Cuerpo: "Texto original" });
  });
});

describe("Consulta externa: reglas de la agenda en el servidor (H6)", () => {
  beforeAll(async () => {
    const r = await admin.post("/api/v1/ce/sincronizar", {
      cambios: {
        pac: { nuevos: [{ ID: "CEP-801", TipoDoc: "CC", Documento: "801000002", PrimerNombre: "FICTICIO", PrimerApellido: "DOS", Sexo: "M" }, { ID: "CEP-802", TipoDoc: "CC", Documento: "801000003", PrimerNombre: "FICTICIA", PrimerApellido: "TRES", Sexo: "F" }] },
        sol: { nuevos: [{ ID: "CES-801", Paciente: "CEP-801", Especialidad: "MEDICINA_GENERAL", TipoConsulta: "CONTROL", Estado: "EN_GESTION" }, { ID: "CES-802", Paciente: "CEP-801", Especialidad: "NEFROLOGIA", TipoConsulta: "CONTROL", Estado: "CERRADA" }] },
        jor: { nuevos: [{ ID: "CEJ-801", Fecha: "2026-12-01", Estado: "ABIERTA" }, { ID: "CEJ-802", Fecha: "2026-12-02", Estado: "CANCELADA" }] },
        cup: { nuevos: [{ ID: "CEU-801", Jornada: "CEJ-801", Estado: "DISPONIBLE" }, { ID: "CEU-802", Jornada: "CEJ-801", Estado: "BLOQUEADO" }, { ID: "CEU-803", Jornada: "CEJ-802", Estado: "DISPONIBLE" }, { ID: "CEU-804", Jornada: "CEJ-801", Estado: "DISPONIBLE" }] },
      },
    });
    expect(r.status, JSON.stringify(r.body)).toBe(200);
  });
  const cita = (ID: string, Cupo: string, Solicitud = "CES-801", Paciente = "CEP-801") => ({ cambios: { cit: { nuevos: [{ ID, Cupo, Solicitud, Paciente, Estado: "ASIGNADA" }] } } });

  it("rechaza citas en cupo bloqueado, en jornada cancelada, de solicitud cerrada o de otro paciente", async () => {
    expect((await admin.post("/api/v1/ce/sincronizar", cita("CEC-801", "CEU-802"))).status).toBe(409);
    expect((await admin.post("/api/v1/ce/sincronizar", cita("CEC-802", "CEU-803"))).status).toBe(409);
    expect((await admin.post("/api/v1/ce/sincronizar", cita("CEC-803", "CEU-801", "CES-802"))).status).toBe(409);
    expect((await admin.post("/api/v1/ce/sincronizar", cita("CEC-804", "CEU-801", "CES-801", "CEP-802"))).status).toBe(400); // dato inválido, no conflicto
  });

  it("la solicitud pasa a «Con cita» solo junto con su cita; un cupo con cita no se bloquea", async () => {
    const L = (await admin.get("/api/v1/ce/libro")).body.hojas;
    const sol = (L.sol as Fila[]).find((s) => s.ID === "CES-801")!;
    expect((await admin.post("/api/v1/ce/sincronizar", { cambios: { sol: { modificados: [{ ...sol, Estado: "CON_CITA" }] } } })).status).toBe(409);
    const ok = await admin.post("/api/v1/ce/sincronizar", { cambios: { sol: { modificados: [{ ...sol, Estado: "CON_CITA" }] }, cit: { nuevos: [{ ID: "CEC-805", Cupo: "CEU-801", Solicitud: "CES-801", Paciente: "CEP-801", Estado: "ASIGNADA" }] } } });
    expect(ok.status, JSON.stringify(ok.body)).toBe(200);
    const cup = ((await admin.get("/api/v1/ce/libro")).body.hojas.cup as Fila[]).find((c) => c.ID === "CEU-801")!;
    expect((await admin.post("/api/v1/ce/sincronizar", { cambios: { cup: { modificados: [{ ...cup, Estado: "BLOQUEADO" }] } } })).status).toBe(409);
  });
});

describe("sesiones, auditoría y respaldo", () => {
  it("H13: el sondeo de versión sin actividad no renueva la sesión; con actividad sí", async () => {
    const s = await prisma.sesion.findFirst({ where: { usuarioId: ids["enf.cor"], revocadaEn: null }, orderBy: { creadaEn: "desc" } });
    const atras = new Date(Date.now() - 5 * 60_000);
    await prisma.sesion.update({ where: { id: s!.id }, data: { ultimaActividad: atras } });
    expect((await u["enf.cor"].get("/api/v1/hd/version")).status).toBe(200);
    expect((await prisma.sesion.findUnique({ where: { id: s!.id } }))!.ultimaActividad.getTime()).toBe(atras.getTime());
    expect((await u["enf.cor"].get("/api/v1/hd/version").set("X-Actividad", "1")).status).toBe(200);
    expect((await prisma.sesion.findUnique({ where: { id: s!.id } }))!.ultimaActividad.getTime()).toBeGreaterThan(atras.getTime());
  });

  it("H14: se purgan los tokens de sesiones vencidas hace más de 30 días, no la auditoría", async () => {
    const vieja = await prisma.sesion.create({ data: { tokenHash: "prueba-sesion-vieja", usuarioId: ids["otra.cor"], expiraEn: new Date(Date.now() - 40 * 86_400_000) } });
    const auditorias = await prisma.auditoria.count();
    expect(await purgarSesiones()).toBeGreaterThanOrEqual(1);
    expect(await prisma.sesion.findUnique({ where: { id: vieja.id } })).toBeNull();
    expect(await prisma.auditoria.count()).toBe(auditorias);
  });

  it("H8/H9: la consulta de un libro se audita una vez por sesión; Nefro también la registra", async () => {
    const antes = await prisma.auditoria.count({ where: { accion: "CONSULTA", entidad: "hd.libro", usuarioId: ids["otra.cor"] } });
    await u["otra.cor"].get("/api/v1/hd/libro");
    await u["otra.cor"].get("/api/v1/hd/libro");
    await u["otra.cor"].get("/api/v1/hd/libro");
    expect(await prisma.auditoria.count({ where: { accion: "CONSULTA", entidad: "hd.libro", usuarioId: ids["otra.cor"] } })).toBe(antes + 1);
    await admin.get("/api/v1/nefro/pg/paciente?select=*");
    expect(await prisma.auditoria.count({ where: { accion: "CONSULTA", entidad: "nefro.libro" } })).toBeGreaterThanOrEqual(1);
  });

  it("H8: el respaldo JSON (escrito en flujo) es JSON válido, trae todas las tablas y ninguna clave", async () => {
    const r = await admin.raw.get("/api/v1/respaldo/json").set("Origin", "http://localhost:5173").buffer(true).parse((res, cb) => {
      let d = "";
      res.setEncoding("utf8");
      res.on("data", (c: string) => (d += c));
      res.on("end", () => cb(null, d));
    });
    expect(r.status).toBe(200);
    const j = JSON.parse(r.body as string);
    expect(j.tablas.hd_evento.some((e: Fila) => e.ID === "EV-801001")).toBe(true);
    expect(JSON.stringify(j)).not.toMatch(/claveHash|tokenHash/);
  });
});

describe("concurrencia: guardados simultáneos de registros distintos", () => {
  it("dos personas que guardan registros distintos a la vez no chocan (antes, una recibía 409 en cada intento)", async () => {
    const res: number[] = [];
    for (let i = 0; i < 10; i++) {
      const [x, y] = await Promise.all([
        u["enf.cor"].post("/api/v1/hd/sincronizar", { cambios: { evt: { nuevos: [{ ID: `EV-SIM-A${i}`, Paciente: "P801", Fecha: "2026-10-02", Tipo: "Hipotensión" }] } } }),
        u["otra.cor"].post("/api/v1/hd/sincronizar", { cambios: { evt: { nuevos: [{ ID: `EV-SIM-B${i}`, Paciente: "P801", Fecha: "2026-10-02", Tipo: "Calambres" }] } } }),
      ]);
      res.push(x.status, y.status);
    }
    expect(res.every((s) => s === 200)).toBe(true);
  });
});
