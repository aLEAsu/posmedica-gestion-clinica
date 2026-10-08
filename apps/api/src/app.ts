import cookieParser from "cookie-parser";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { config } from "./config.js";
import { prisma } from "./db.js";
import { h, manejadorErrores, noEncontrado } from "./http/errors.js";
import { cargarSesion, idPeticion, registroAcceso, verificarOrigen } from "./http/middleware.js";
import { auditoria } from "./routes/auditoria.js";
import { auth } from "./routes/auth.js";
import { catalogos } from "./routes/catalogos.js";
import { respaldo } from "./routes/respaldo.js";
import { usuarios } from "./routes/usuarios.js";
import { CONFIG_HD } from "./modulos/hd/config.js";
import { crearRutasLibro } from "./modulos/libro/rutas.js";
import { CONFIG_VIH } from "./modulos/vih/config.js";

export function crearApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", config.trustProxyHops);

  app.use(idPeticion);
  // La API solo devuelve JSON y archivos: política de contenido mínima.
  app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } }, crossOriginResourcePolicy: { policy: "same-site" } }));
  // Límite de tamaño por ruta: la importación inicial de un libro existente puede pesar varios MB.
  const jsonGrande = express.json({ limit: "40mb" });
  const jsonMedio = express.json({ limit: "10mb" });
  const jsonNormal = express.json({ limit: "2mb" });
  app.use((req, res, next) =>
    (req.path.endsWith("/importar") ? jsonGrande : req.path.endsWith("/sincronizar") ? jsonMedio : jsonNormal)(req, res, next),
  );
  app.use(cookieParser());

  app.get(
    "/api/health",
    h(async (_req, res) => {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ ok: true, servicio: "posmedica-api", fecha: new Date().toISOString() });
    }),
  );

  app.use(
    "/api/v1",
    rateLimit({ windowMs: 60_000, limit: 1200, standardHeaders: "draft-7", legacyHeaders: false, validate: { trustProxy: false }, message: { error: "Demasiadas peticiones. Espere un momento.", codigo: "LIMITE" } }),
  );
  app.use("/api/v1", (_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });
  app.use("/api/v1", verificarOrigen, cargarSesion, registroAcceso);

  app.use("/api/v1/auth", auth);
  app.use("/api/v1/usuarios", usuarios);
  app.use("/api/v1/auditoria", auditoria);
  app.use("/api/v1/respaldo", respaldo);
  app.use("/api/v1/catalogos", catalogos);
  app.use("/api/v1/hd", crearRutasLibro(CONFIG_HD));
  app.use("/api/v1/vih", crearRutasLibro(CONFIG_VIH));

  app.use("/api", (_req, _res, next) => next(noEncontrado("Ruta no encontrada.")));
  app.use(manejadorErrores);
  return app;
}
