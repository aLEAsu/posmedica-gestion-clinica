import { beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import * as XLSX from "xlsx";
import { puede } from "@posmedica/shared";
import { prisma } from "../src/db.js";
import { problemaClave } from "../src/security/password.js";
import { ORIGEN, agente, app, crearUsuario, sembrarProgramas } from "./ayuda.js";

const CLAVE_ADMIN = "AdminPrueba2026";

beforeAll(async () => {
  await sembrarProgramas();
  await crearUsuario("admin.prueba", CLAVE_ADMIN, "ADMIN");
});

describe("reglas puras", () => {
  it("política de clave", () => {
    expect(problemaClave("corta1")).toMatch(/10 caracteres/);
    expect(problemaClave("soloLetrasLargas")).toMatch(/letras y números/);
    expect(problemaClave("juanperez2026", "juanperez")).toMatch(/nombre de usuario/);
    expect(problemaClave("Valida2026x", "juan")).toBeNull();
  });

  it("autorización: admin todo, médico solo lo asignado y exige «ver»", () => {
    expect(puede({ rol: "ADMIN", permisos: [] }, "hd", "anular")).toBe(true);
    const med = { rol: "MEDICO" as const, permisos: [{ programa: "hd", ver: true, registrar: true, anular: false, exportar: false }] };
    expect(puede(med, "hd", "ver")).toBe(true);
    expect(puede(med, "hd", "registrar")).toBe(true);
    expect(puede(med, "hd", "anular")).toBe(false);
    expect(puede(med, "vih", "ver")).toBe(false);
    expect(puede({ rol: "MEDICO", permisos: [{ programa: "hd", ver: false, registrar: true, anular: false, exportar: false }] }, "hd", "registrar")).toBe(false);
  });
});

describe("salud y protección CSRF", () => {
  it("health responde con la base conectada", async () => {
    const r = await request(app).get("/api/health");
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
  });

  it("rechaza peticiones que modifican datos sin la cabecera de la aplicación o desde otro origen", async () => {
    const sinCabecera = await request(app).post("/api/v1/auth/login").set("Origin", ORIGEN).send({ usuario: "x", clave: "y" });
    expect(sinCabecera.status).toBe(403);
    const otroOrigen = await request(app).post("/api/v1/auth/login").set("Origin", "https://atacante.example").set("X-Posmedica", "1").send({ usuario: "x", clave: "y" });
    expect(otroOrigen.status).toBe(403);
  });

  it("sin sesión no hay acceso", async () => {
    expect((await request(app).get("/api/v1/usuarios")).status).toBe(401);
    expect((await request(app).get("/api/v1/auth/me")).status).toBe(401);
  });
});

describe("ingreso, bloqueo y cambio de clave", () => {
  it("mensaje genérico para usuario inexistente y clave errada", async () => {
    const a = agente();
    const r1 = await a.post("/api/v1/auth/login", { usuario: "noexiste", clave: "loquesea123" });
    const r2 = await a.post("/api/v1/auth/login", { usuario: "admin.prueba", clave: "Errada123456" });
    expect(r1.status).toBe(401);
    expect(r2.status).toBe(401);
    expect(r1.body.error).toBe(r2.body.error);
  });

  it("bloquea tras 5 intentos fallidos y el admin puede desbloquear", async () => {
    const u = await crearUsuario("bloqueable", "Bloqueable2026", "MEDICO");
    const a = agente();
    for (let i = 0; i < 4; i++) expect((await a.post("/api/v1/auth/login", { usuario: "bloqueable", clave: "Mala1234567" })).status).toBe(401);
    const quinto = await a.post("/api/v1/auth/login", { usuario: "bloqueable", clave: "Mala1234567" });
    expect(quinto.body.codigo).toBe("BLOQUEADO");
    const conBuena = await a.post("/api/v1/auth/login", { usuario: "bloqueable", clave: "Bloqueable2026" });
    expect(conBuena.status).toBe(423);

    const admin = agente();
    await admin.post("/api/v1/auth/login", { usuario: "admin.prueba", clave: CLAVE_ADMIN });
    expect((await admin.post(`/api/v1/usuarios/${u.id}/desbloquear`)).status).toBe(200);
    expect((await a.post("/api/v1/auth/login", { usuario: "bloqueable", clave: "Bloqueable2026" })).status).toBe(200);
  });

  it("con clave temporal solo puede cambiarla; luego accede", async () => {
    await crearUsuario("temporal", "Temporal2026x", "ADMIN", true);
    const a = agente();
    expect((await a.post("/api/v1/auth/login", { usuario: "temporal", clave: "Temporal2026x" })).status).toBe(200);
    const bloqueado = await a.get("/api/v1/usuarios");
    expect(bloqueado.status).toBe(403);
    expect(bloqueado.body.codigo).toBe("CAMBIO_CLAVE");
    expect((await a.post("/api/v1/auth/cambiar-clave", { claveActual: "Temporal2026x", claveNueva: "corta" })).status).toBe(400);
    expect((await a.post("/api/v1/auth/cambiar-clave", { claveActual: "Temporal2026x", claveNueva: "NuevaSegura2026" })).status).toBe(200);
    expect((await a.get("/api/v1/usuarios")).status).toBe(200);
  });

  it("al salir, la sesión deja de servir", async () => {
    const a = agente();
    await a.post("/api/v1/auth/login", { usuario: "admin.prueba", clave: CLAVE_ADMIN });
    expect((await a.get("/api/v1/auth/me")).status).toBe(200);
    await a.post("/api/v1/auth/logout");
    expect((await a.get("/api/v1/auth/me")).status).toBe(401);
  });
});

describe("usuarios y permisos (D2, D3)", () => {
  it("el admin crea un médico, le asigna programas y el médico no administra", async () => {
    const admin = agente();
    await admin.post("/api/v1/auth/login", { usuario: "admin.prueba", clave: CLAVE_ADMIN });
    const creado = await admin.post("/api/v1/usuarios", { usuario: "medico.hd", nombre: "Médica de prueba", cargo: "Nefróloga", rol: "MEDICO" });
    expect(creado.status).toBe(201);
    expect(creado.body.claveTemporal).toMatch(/^\S{12}$/);
    expect(JSON.stringify(creado.body.usuario)).not.toMatch(/claveHash|argon2/);

    const id = creado.body.usuario.id;
    const perm = await admin.put(`/api/v1/usuarios/${id}/permisos`, {
      permisos: [
        { programa: "hd", ver: true, registrar: true, anular: false, exportar: false },
        { programa: "vih", ver: false, registrar: true, anular: false, exportar: false },
      ],
    });
    expect(perm.status).toBe(200);
    expect(perm.body.usuario.permisos).toHaveLength(1); // vih sin «ver» se descarta

    const med = agente();
    await med.post("/api/v1/auth/login", { usuario: "medico.hd", clave: creado.body.claveTemporal });
    await med.post("/api/v1/auth/cambiar-clave", { claveActual: creado.body.claveTemporal, claveNueva: "MedicoSeguro2026" });
    const me = await med.get("/api/v1/auth/me");
    expect(me.body.usuario.rol).toBe("MEDICO");
    expect(me.body.usuario.permisos).toEqual([{ programa: "hd", ver: true, registrar: true, anular: false, exportar: false }]);

    expect((await med.get("/api/v1/usuarios")).status).toBe(403);
    expect((await med.get("/api/v1/auditoria")).status).toBe(403);
    expect((await med.get("/api/v1/respaldo/excel")).status).toBe(403);
  });

  it("no se puede dejar el sistema sin administrador activo", async () => {
    const admin = agente();
    const r = await admin.post("/api/v1/auth/login", { usuario: "admin.prueba", clave: CLAVE_ADMIN });
    const yo = r.body.usuario.id;
    expect((await admin.patch(`/api/v1/usuarios/${yo}`, { activo: false })).status).toBe(400);
  });
});

describe("auditoría inmutable y respaldo (P6)", () => {
  it("registra ingresos, creaciones y permisos sin guardar claves", async () => {
    const acciones = (await prisma.auditoria.findMany({ select: { accion: true } })).map((a) => a.accion);
    expect(acciones).toEqual(expect.arrayContaining(["INGRESO", "INGRESO_FALLIDO", "BLOQUEO", "CREA", "PERMISOS", "CAMBIO_CLAVE", "DESBLOQUEA", "SALIDA"]));
    const todo = JSON.stringify(await prisma.auditoria.findMany(), (_k, v) => (typeof v === "bigint" ? v.toString() : v));
    expect(todo).not.toMatch(/argon2|claveHash/);
  });

  it("la base de datos impide modificar o borrar la auditoría", async () => {
    await expect(prisma.$executeRawUnsafe(`UPDATE auditoria SET accion = 'X'`)).rejects.toThrow(/inmutable/);
    await expect(prisma.$executeRawUnsafe(`DELETE FROM auditoria`)).rejects.toThrow(/inmutable/);
    await expect(prisma.$executeRawUnsafe(`TRUNCATE auditoria`)).rejects.toThrow(/inmutable/);
  });

  it("el respaldo en Excel trae todas las tablas y ninguna clave", async () => {
    const admin = agente();
    await admin.post("/api/v1/auth/login", { usuario: "admin.prueba", clave: CLAVE_ADMIN });
    const r = await admin.raw.get("/api/v1/respaldo/excel").buffer(true).parse((res, cb) => {
      const partes: Buffer[] = [];
      res.on("data", (c: Buffer) => partes.push(c));
      res.on("end", () => cb(null, Buffer.concat(partes)));
    });
    expect(r.status).toBe(200);
    const wb = XLSX.read(r.body as Buffer, { type: "buffer" });
    expect(wb.SheetNames).toEqual(expect.arrayContaining(["LEAME", "usuario", "programa", "usuario_programa", "auditoria", "persona", "inscripcion_programa"]));
    expect(wb.SheetNames).not.toContain("sesion");
    const usuarios = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets["usuario"]);
    expect(usuarios.length).toBeGreaterThan(0);
    expect(Object.keys(usuarios[0])).not.toContain("claveHash");
    expect(JSON.stringify(usuarios)).not.toMatch(/argon2/);
    const ult = await prisma.auditoria.findFirst({ orderBy: { id: "desc" } });
    expect(ult?.accion).toBe("RESPALDO");
  });
});
