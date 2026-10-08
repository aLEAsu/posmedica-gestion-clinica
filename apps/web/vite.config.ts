import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// En desarrollo Vite reenvía /api al backend local: el navegador ve un solo origen, igual que en Render,
// donde el Static Site reenvía /api/* al Web Service (ver render.yaml).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: { "/api": { target: "http://localhost:4000", changeOrigin: false } },
  },
  build: { sourcemap: false },
});
