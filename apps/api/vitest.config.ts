import { defineConfig } from "vitest/config";

// Pruebas contra PostgreSQL local: cada archivo crea su propia base temporal y la elimina al terminar
// (test/setup-archivo.ts). Nunca apuntan a la base de desarrollo ni a la de producción.
const servidor = process.env.TEST_PG_SERVER ?? "postgresql://posmedica:posmedica_local@localhost:5433";
process.env.TEST_PG_SERVER = servidor;

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    globalSetup: ["./test/setup-global.ts"],
    setupFiles: ["./test/setup-archivo.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 120_000,
    env: {
      NODE_ENV: "test",
      TEST_PG_SERVER: servidor,
      DATABASE_URL: `${servidor}/posmedica_test_sin_asignar`,
      SESSION_SECRET: "secreto-de-pruebas-solo-para-vitest-0123456789",
      ALLOWED_ORIGINS: "http://localhost:5173",
      TRUST_PROXY_HOPS: "0",
    },
  },
});
