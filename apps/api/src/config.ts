import { z } from "zod";

const Env = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET debe tener al menos 32 caracteres"),
  ALLOWED_ORIGINS: z.string().default("http://localhost:5173"),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(0),
  SESSION_IDLE_MIN: z.coerce.number().int().positive().default(30),
  SESSION_MAX_HOURS: z.coerce.number().int().positive().default(12),
  ADMIN_USUARIO: z.string().optional(),
  ADMIN_NOMBRE: z.string().optional(),
  ADMIN_CARGO: z.string().optional(),
  ADMIN_CLAVE_INICIAL: z.string().optional(),
});

const parsed = Env.safeParse(process.env);
if (!parsed.success) {
  // Solo nombres de variables: nunca imprimir valores (pueden ser secretos).
  console.error("Configuración inválida:", parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "));
  process.exit(1);
}

const e = parsed.data;

export const config = {
  env: e.NODE_ENV,
  isProd: e.NODE_ENV === "production",
  port: e.PORT,
  sessionSecret: e.SESSION_SECRET,
  allowedOrigins: e.ALLOWED_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean),
  trustProxyHops: e.TRUST_PROXY_HOPS,
  sessionIdleMs: e.SESSION_IDLE_MIN * 60_000,
  sessionMaxMs: e.SESSION_MAX_HOURS * 3_600_000,
  admin: {
    usuario: e.ADMIN_USUARIO,
    nombre: e.ADMIN_NOMBRE,
    cargo: e.ADMIN_CARGO,
    claveInicial: e.ADMIN_CLAVE_INICIAL,
  },
  /** En producción la cookie lleva el prefijo __Host- (exige Secure, Path=/ y sin Domain). */
  cookieName: e.NODE_ENV === "production" ? "__Host-posmedica_sid" : "posmedica_sid",
  maxIntentosFallidos: 5,
  bloqueoMin: 15,
} as const;
