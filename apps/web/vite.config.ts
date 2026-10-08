import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// En desarrollo Vite reenvía /api al backend local: el navegador ve un solo origen, igual que en Render,
// donde el Static Site reenvía /api/* al Web Service (ver docs/DESPLIEGUE_RENDER.md).
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: mode === "e2e" ? 5174 : 5173,
    strictPort: true,
    // modo «e2e»: entorno aislado de verificación (backend en 4001 con su propia base de datos)
    proxy: { "/api": { target: mode === "e2e" ? "http://localhost:4001" : "http://localhost:4000", changeOrigin: false } },
  },
  build: { sourcemap: false },
}));
