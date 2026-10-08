import { defineConfig } from "vitest/config";

// Cada corrida crea su propia base temporal (posmedica_test_<marca>) en el servidor local, aplica las migraciones
// y la elimina al terminar. Nunca toca la base de desarrollo ni la de producción.
const servidor = process.env.TEST_PG_SERVER ?? "postgresql://posmedica:posmedica_local@localhost:5433";
const nombre = `posmedica_test_${Date.now()}`;
process.env.TEST_PG_SERVER = servidor;
process.env.TEST_DB_NAME = nombre;
const url = `${servidor}/${nombre}?schema=public`;

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    globalSetup: ["./test/setup-global.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 120_000,
    env: {
      NODE_ENV: "test",
      DATABASE_URL: url,
      SESSION_SECRET: "secreto-de-pruebas-solo-para-vitest-0123456789",
      ALLOWED_ORIGINS: "http://localhost:5173",
      TRUST_PROXY_HOPS: "0",
    },
  },
});
