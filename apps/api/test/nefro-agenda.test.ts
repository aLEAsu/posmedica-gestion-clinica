/* La agenda de la Ruta se guarda como filas de sus hojas de Excel. La conversión del adaptador (filasDe) debe ser el
   inverso exacto del lector de la Ruta (COH.parseRows): se prueba con la agenda ficticia del prototipo, que solo vive
   en memoria durante la prueba. */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, it } from "vitest";
import * as XLSX from "xlsx";
// @ts-expect-error utilidades de prueba del paquete de reglas (TypeScript sin compilar)
import { cargarNefro } from "../../../packages/clinical-rules/test/oraculo.ts";
// @ts-expect-error utilidades de prueba del paquete de reglas (TypeScript sin compilar)
import { normalizar } from "../../../packages/clinical-rules/test/comparar.ts";

it("filas de agenda → lector de la Ruta devuelve exactamente la misma agenda (jornadas, citas, bitácora, contactos)", () => {
  const o = cargarNefro(new Date(2026, 9, 8), { XLSX: { ...XLSX, utils: XLSX.utils }, POSMEDICA: { pedir: () => Promise.reject(new Error("sin servidor")), hora: () => "", avisarPortal() {} } });
  o.ev("MG.loadDemo(true)");
  o.ev(readFileSync(resolve(__dirname, "../../web/public/modulos/nefro/adaptador-nefro.js"), "utf8"));
  const resultado = o.ev<{ conteo: Record<string, number>; clavesUnicas: boolean; original: unknown; leido: unknown }>(`(() => {
    const B = MG.book, H = ["Jornadas", "Citas", "Citas_log", "Contactos"], C = { Jornadas: "jor", Citas: "cit", Citas_log: "clog", Contactos: "ctc" };
    const S = { Pacientes: B.pac.map(p => ({ codigo: p.codigo })), Laboratorios: [], Valoraciones: [], Atenciones: [], Novedades: [] };
    const conteo = {}; let clavesUnicas = true;
    for (const h of H) { const F = POSMEDICA_NEFRO.filasDe(B, h); S[h] = F.map(f => f.datos); conteo[h] = F.length; if (new Set(F.map(f => f.clave)).size !== F.length) clavesUnicas = false; }
    const B2 = COH.parseRows(S);
    return { conteo, clavesUnicas, original: H.map(h => B[C[h]]), leido: H.map(h => B2[C[h]]) };
  })()`);
  expect(resultado.conteo.Citas).toBeGreaterThan(1000);
  expect(resultado.clavesUnicas).toBe(true);
  expect(normalizar(resultado.leido)).toEqual(normalizar(resultado.original));
});
