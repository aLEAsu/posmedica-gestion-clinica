/* Siembra idempotente: se ejecuta en cada despliegue (preDeployCommand) después de las migraciones.
   - Programas: catálogo de @posmedica/shared (se actualizan nombre, descripción y fase).
   - EPS y municipios del Putumayo: solo se agregan si faltan; no se pisan cambios hechos en el sistema.
   - Primer administrador: solo si no existe ningún usuario. */
import { PROGRAMAS } from "@posmedica/shared";
import { config } from "./config.js";
import { prisma } from "./db.js";
import { hashClave, problemaClave } from "./security/password.js";

/* EPS del prototipo (EPS_L y VX_EPS). Códigos tomados del prototipo; los demás se completan desde el sistema. */
const EPS: { nombre: string; codigo: string | null }[] = [
  { nombre: "NUEVA EPS", codigo: null },
  { nombre: "MALLAMAS", codigo: null },
  { nombre: "FOMAG", codigo: "RES004" },
  { nombre: "FAMILIAR DE COLOMBIA", codigo: "CCF033" },
  { nombre: "EMSSANAR", codigo: null },
  { nombre: "OTRA", codigo: null },
];

/* DIVIPOLA Putumayo (prototipo VX_MUN; verificar contra la DIVIPOLA vigente). */
const MUNICIPIOS: [string, string][] = [
  ["86001", "MOCOA"], ["86219", "COLÓN"], ["86320", "ORITO"], ["86568", "PUERTO ASÍS"], ["86569", "PUERTO CAICEDO"],
  ["86571", "PUERTO GUZMÁN"], ["86573", "PUERTO LEGUÍZAMO"], ["86749", "SIBUNDOY"], ["86755", "SAN FRANCISCO"],
  ["86757", "SAN MIGUEL"], ["86760", "SANTIAGO"], ["86865", "VALLE DEL GUAMUEZ"], ["86885", "VILLAGARZÓN"],
];

async function main() {
  for (const [i, p] of PROGRAMAS.entries()) {
    const datos = { nombre: p.nombre, grupo: p.grupo, descripcion: p.descripcion, fase: p.fase, abierto: !!p.abierto, orden: i + 1 };
    await prisma.programa.upsert({ where: { clave: p.clave }, create: { clave: p.clave, ...datos }, update: datos });
  }

  for (const e of EPS) {
    await prisma.eps.upsert({ where: { nombre: e.nombre }, create: e, update: {} });
  }
  for (const [codigoDane, nombre] of MUNICIPIOS) {
    await prisma.municipio.upsert({ where: { codigoDane }, create: { codigoDane, nombre, departamento: "PUTUMAYO" }, update: {} });
  }

  if ((await prisma.usuario.count()) === 0) {
    const { usuario, nombre, cargo, claveInicial } = config.admin;
    if (!usuario || !claveInicial) {
      console.warn("No hay usuarios y faltan ADMIN_USUARIO o ADMIN_CLAVE_INICIAL: no se creó el administrador.");
    } else {
      const p = problemaClave(claveInicial, usuario);
      if (p) throw new Error(`ADMIN_CLAVE_INICIAL no cumple la política: ${p}`);
      const u = await prisma.usuario.create({
        data: { usuario: usuario.toLowerCase(), nombre: nombre || "Administrador del sistema", cargo: cargo || "Coordinación asistencial", rol: "ADMIN", claveHash: await hashClave(claveInicial), debeCambiarClave: true },
      });
      await prisma.auditoria.create({ data: { accion: "CREA", entidad: "usuario", registroId: u.id, usuarioNombre: "Sistema (siembra inicial)", detalle: "Primer administrador" } });
      console.log(`Administrador inicial creado: ${u.usuario} (debe cambiar la clave en el primer ingreso).`);
    }
  }
  console.log("Siembra completa.");
}

main()
  .catch((e) => {
    console.error("Error en la siembra:", e?.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
