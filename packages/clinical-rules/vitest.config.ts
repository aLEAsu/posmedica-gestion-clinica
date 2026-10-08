import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    testTimeout: 120_000,
    hookTimeout: 120_000,
    // Zona horaria de la clínica: las fechas sin hora del prototipo son locales (America/Bogota).
    env: { TZ: "America/Bogota" },
  },
});
