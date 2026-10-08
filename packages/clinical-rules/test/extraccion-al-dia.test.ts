/* Los módulos de src/generado/ deben ser exactamente lo que produce el extractor a partir del prototipo:
   nadie puede editarlos a mano ni olvidar volver a extraer después de un cambio del prototipo. */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { expect, it } from "vitest";

it("src/generado coincide con una extracción nueva del prototipo", () => {
  const tmp = mkdtempSync(join(tmpdir(), "reglas-"));
  try {
    execFileSync(process.execPath, [resolve(__dirname, "../scripts/extraer-reglas.mjs")], { env: { ...process.env, SALIDA_REGLAS: tmp }, stdio: "ignore" });
    for (const f of ["hd.js", "vih.js", "nefro.js"]) {
      expect(readFileSync(join(tmp, f), "utf8"), `${f} difiere: ejecute «npm run extraer -w packages/clinical-rules»`).toBe(readFileSync(resolve(__dirname, "../src/generado", f), "utf8"));
    }
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
