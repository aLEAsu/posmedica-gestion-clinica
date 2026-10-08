/* Recuperación de acceso: deja la clave de un usuario igual a ADMIN_CLAVE_INICIAL (del entorno), lo desbloquea,
   lo activa y lo obliga a cambiarla en el siguiente ingreso. Queda en la auditoría.
   Uso local:   npm run admin:restablecer -w apps/api            (usuario = ADMIN_USUARIO)
                npm run admin:restablecer -w apps/api -- otro    (otro usuario)
   Requiere acceso directo a la base de datos, así que solo lo puede ejecutar quien ya administra el servidor. */
import { config } from "./config.js";
import { prisma } from "./db.js";
import { hashClave, problemaClave } from "./security/password.js";

async function main() {
  const usuario = (process.argv[2] || config.admin.usuario || "").toLowerCase();
  const clave = config.admin.claveInicial;
  if (!usuario) throw new Error("Indique el usuario o defina ADMIN_USUARIO.");
  if (!clave) throw new Error("Defina ADMIN_CLAVE_INICIAL en el entorno (.env).");
  const p = problemaClave(clave, usuario);
  if (p) throw new Error(`ADMIN_CLAVE_INICIAL no cumple la política: ${p}`);

  const u = await prisma.usuario.findUnique({ where: { usuario } });
  if (!u) throw new Error(`No existe el usuario «${usuario}».`);
  await prisma.$transaction([
    prisma.usuario.update({ where: { id: u.id }, data: { claveHash: await hashClave(clave), debeCambiarClave: true, intentosFallidos: 0, bloqueadoHasta: null, activo: true } }),
    prisma.sesion.updateMany({ where: { usuarioId: u.id, revocadaEn: null }, data: { revocadaEn: new Date() } }),
    prisma.auditoria.create({ data: { accion: "RESTABLECE_CLAVE", entidad: "usuario", registroId: u.id, usuarioNombre: "Sistema (comando de recuperación)", detalle: "Clave inicial del entorno; cambio obligatorio" } }),
  ]);
  console.log(`Listo: «${usuario}» puede ingresar con ADMIN_CLAVE_INICIAL del .env y deberá cambiarla.`);
}

main()
  .catch((e) => {
    console.error("No se pudo restablecer:", e?.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
