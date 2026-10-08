import request from "supertest";
import { crearApp } from "../src/app.js";
import { prisma } from "../src/db.js";
import { hashClave } from "../src/security/password.js";

export const app = crearApp();
export const ORIGEN = "http://localhost:5173";

/** Agente con cookies y las cabeceras que envía el frontend. */
export function agente() {
  const a = request.agent(app);
  return {
    get: (ruta: string) => a.get(ruta).set("Origin", ORIGEN),
    post: (ruta: string, cuerpo: object = {}) => a.post(ruta).set("Origin", ORIGEN).set("X-Posmedica", "1").send(cuerpo),
    patch: (ruta: string, cuerpo: object) => a.patch(ruta).set("Origin", ORIGEN).set("X-Posmedica", "1").send(cuerpo),
    put: (ruta: string, cuerpo: object) => a.put(ruta).set("Origin", ORIGEN).set("X-Posmedica", "1").send(cuerpo),
    raw: a,
  };
}

export async function crearUsuario(usuario: string, clave: string, rol: "ADMIN" | "MEDICO", debeCambiarClave = false) {
  return prisma.usuario.create({
    data: { usuario, nombre: `Prueba ${usuario}`, cargo: "Cargo de prueba", rol, claveHash: await hashClave(clave), debeCambiarClave },
  });
}

export async function sembrarProgramas() {
  const { PROGRAMAS } = await import("@posmedica/shared");
  for (const [i, p] of PROGRAMAS.entries()) {
    await prisma.programa.upsert({
      where: { clave: p.clave },
      create: { clave: p.clave, nombre: p.nombre, grupo: p.grupo, descripcion: p.descripcion, fase: p.fase, abierto: !!p.abierto, orden: i },
      update: {},
    });
  }
}
