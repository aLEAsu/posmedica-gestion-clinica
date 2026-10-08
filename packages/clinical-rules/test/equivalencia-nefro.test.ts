/* Equivalencia Nefroprotección: Ruta v7.2 original (oráculo, documento aparte como el iframe) frente a crearMotorNefro,
   con la cohorte ficticia amplia del prototipo (100 pacientes por EPS con 6 meses de agenda simulada). */
import { describe, expect, it } from "vitest";
import * as XLSX from "xlsx";
import { crearMotorNefro } from "../src/generado/nefro.js";
import { clonarLibro, evaluarEn, normalizar } from "./comparar.js";
import { cargarNefro } from "./oraculo.js";

const POR_PACIENTE = [
  "COH.snapshot(P, B, CORTE, {})",
  "COH.snapshot(P, B, CORTE, { formOnly: true })",
  "COH.snapshot(P, B, NP.addMonths(CORTE, -3), {})",
  "COH.activeAt(P, CORTE)",
];

for (const fecha of [new Date(2026, 9, 8), new Date(2026, 6, 1)]) {
  describe(`Nefroprotección · hoy ${fecha.toISOString().slice(0, 10)}`, () => {
    const o = cargarNefro(fecha);
    o.ev("MG.loadDemo(true)");
    o.ev("globalThis.B = MG.book; globalThis.CORTE = new Date()");
    const motor = crearMotorNefro({ XLSX }) as Record<string, unknown>;
    const m = { ...motor, B: clonarLibro(o.ev("MG.book")), CORTE: new Date(fecha) };
    const codigos = o.ev<string[]>("B.pac.map(p => p.codigo)");

    it("la cohorte ficticia es la esperada y las fichas de indicadores son idénticas", () => {
      expect(codigos.length).toBe(300);
      expect(normalizar(evaluarEn(m, "[COH.FICHAS, COH.ORDER, COH.EPS, EPSMODEL_DEF, window.EPSMODEL]"))).toEqual(normalizar(o.ev("[COH.FICHAS, COH.ORDER, COH.EPS, EPSMODEL_DEF, window.EPSMODEL]")));
    });

    for (const plantilla of POR_PACIENTE) {
      it(`${plantilla} · 300 pacientes`, () => {
        for (const c of codigos) {
          const expr = plantilla.replace(/\bP\b/g, `B.pac.find(p => p.codigo === ${JSON.stringify(c)})`);
          expect(normalizar(evaluarEn(m, expr)), `${c}: ${plantilla}`).toEqual(normalizar(o.ev(expr)));
        }
      });
    }
  });
}
