/* Equivalencia Hemodiálisis: prototipo original (oráculo) frente a crearMotorHD, con la cohorte ficticia de
   40 pacientes que trae el propio prototipo («Ver con datos ficticios»), en dos fechas de corte distintas. */
import { describe, expect, it } from "vitest";
import { crearMotorHD } from "../src/generado/hd.js";
import { clonarLibro, evaluarEn, normalizar } from "./comparar.js";
import { cargarPortal } from "./oraculo.js";

/** Expresiones que se evalúan igual en ambos lados. «PID» se reemplaza por el ID de cada paciente. */
const POR_PACIENTE = [
  "semaforo(P, ST.corte)",
  "calidadDe(P, ST.corte)",
  "vacStatus(P, ST.corte)",
  "txState(P)",
  "labDue(P, ST.corte)",
  "examsForMonth(P, ST.corte.getFullYear(), ST.corte.getMonth()+1)",
  "examsForMonth(P, addMonths(ST.corte,1).getFullYear(), addMonths(ST.corte,1).getMonth()+1)",
  "tenerPresente(P, ST.corte)",
  "gidStats(P, ST.corte, 8)",
  "taStats(P, ST.corte, 12)",
  "glucoStats(P, addDays(ST.corte,-30), ST.corte)",
  "ktvOnline(P, ST.corte, 8)",
  "accessAt(P, ST.corte)",
  "activeAt(P, ST.corte)",
  "metasDe(P)",
  "estVencidos(P, ST.corte)",
  "vacNextDefaults(P)",
  "cacVals(P, ST.corte, ST.ps)",
];

const GLOBALES = [
  "IND.map(d => evalInd(d, ctxFor(ST.corte, ST.ps, ST.eps)))",
  "IND.map(d => trendPoints(d, 6))",
  "alertas()",
  "calidad()",
  "conciliar(ym(ST.corte))",
  "solPropuesta(ym(addMonths(ST.corte,1)))",
  "pacs().map(p => [p.ID, p._iv, p._noStart])",
];

for (const fecha of [new Date(2026, 9, 8), new Date(2026, 2, 15)]) {
  describe(`Hemodiálisis · corte ${fecha.toISOString().slice(0, 10)}`, async () => {
    const o = cargarPortal(fecha);
    await o.ev("loadDemo()");
    const libro = clonarLibro(o.ev("ST.book"));
    const ps = o.ev<Date>("ST.ps");
    const m = crearMotorHD({ libro, hoy: fecha, corte: fecha, inicioPeriodo: ps }) as Record<string, unknown>;
    evaluarEn(m, "ensureIdx()");
    const ids = o.ev<string[]>("pacs().map(p => p.ID)");

    it("la cohorte ficticia es la esperada", () => {
      expect(ids.length).toBe(40);
      expect(evaluarEn(m, "pacs().map(p => p.ID)")).toEqual(ids);
    });

    for (const expr of GLOBALES) {
      it(expr, () => {
        expect(normalizar(evaluarEn(m, expr))).toEqual(normalizar(o.ev(expr)));
      });
    }

    for (const plantilla of POR_PACIENTE) {
      it(`${plantilla} · 40 pacientes`, () => {
        for (const id of ids) {
          const expr = plantilla.replace(/\bP\b/g, `IDX.pac.get(${JSON.stringify(id)})`);
          expect(normalizar(evaluarEn(m, expr)), `${id}: ${plantilla}`).toEqual(normalizar(o.ev(expr)));
        }
      });
    }
  });
}
