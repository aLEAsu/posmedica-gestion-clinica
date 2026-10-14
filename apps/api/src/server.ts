import { crearApp } from "./app.js";
import { config } from "./config.js";
import { prisma } from "./db.js";
import { purgarSesiones } from "./security/session.js";

const servidor = crearApp().listen(config.port, () => {
  console.log(JSON.stringify({ nivel: "info", mensaje: `API POSMÉDICA escuchando en el puerto ${config.port}`, entorno: config.env }));
});

/* Mantenimiento: tokens de sesión viejos (no afecta la auditoría). */
const purgar = () =>
  purgarSesiones()
    .then((n) => n && console.log(JSON.stringify({ nivel: "info", mensaje: `Sesiones antiguas eliminadas: ${n}` })))
    .catch((e) => console.error(JSON.stringify({ nivel: "error", mensaje: "No se pudieron purgar las sesiones", error: e?.message })));
purgar();
setInterval(purgar, 86_400_000).unref();

async function cerrar(senal: string) {
  console.log(JSON.stringify({ nivel: "info", mensaje: `Cerrando (${senal})` }));
  servidor.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on("SIGTERM", () => cerrar("SIGTERM"));
process.on("SIGINT", () => cerrar("SIGINT"));
