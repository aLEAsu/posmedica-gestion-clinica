import { crearApp } from "./app.js";
import { config } from "./config.js";
import { prisma } from "./db.js";

const servidor = crearApp().listen(config.port, () => {
  console.log(JSON.stringify({ nivel: "info", mensaje: `API POSMÉDICA escuchando en el puerto ${config.port}`, entorno: config.env }));
});

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
