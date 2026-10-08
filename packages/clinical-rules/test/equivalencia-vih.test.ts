/* Equivalencia VIH: prototipo original (oráculo) frente a crearMotorVIH, con la cohorte ficticia del prototipo
   (159 pacientes con distribución parecida a la real: Nueva EPS y EPS Familiar, municipios del Putumayo). */
import { describe, expect, it } from "vitest";
import { crearMotorVIH } from "../src/generado/vih.js";
import { clonarLibro, evaluarEn, normalizar } from "./comparar.js";
import { cargarPortal } from "./oraculo.js";

const GLOBALES = [
  "VX_IND.map(d => vxCalc(d, vxCorte(), {}, null))",
  "VX_IND.map(d => vxCalcBy(d, vxCorte(), {}, p => p.EPS))",
  "VX_IND.map(d => vxCalcBy(d, vxCorte(), {}, p => p.Municipio))",
  "VX_IND.map(d => vxCalc(d, vxCorte(), { eps: 'NUEVA EPS', sexo: 'F' }, null))",
  "vxNominalRows('NUEVA EPS')",
  "vxCACRows('FAMILIAR DE COLOMBIA')",
  "vxFactMes(ym(vxCorte()), {})",
  "vxProdMes(ym(vxCorte()), {})",
  "vxDiscMes(ym(vxCorte()), {})",
  "vxPacs().map(p => [p.ID, vxActivo(p, vxCorte())])",
];

const POR_PACIENTE = [
  "vxSt(P, vxCorte())",
  "vxAlertas(P, vxCorte())",
  "vxVacEstado(P, vxCorte())",
  "vxLabPlan(P, vxCorte())",
  "vxDue(P, ym(TODAY()))",
  "VX_DISC.map(d => vxAgEstado(P, d))",
  "vxPPD(P, vxCorte())",
  "vxPrcPend(P)",
  "vxNomRow(P, vxCorte(), true)",
  "vxCACRow(P, vxCorte(), true)",
];

for (const fecha of [new Date(2026, 9, 8), new Date(2026, 4, 20)]) {
  describe(`VIH · hoy ${fecha.toISOString().slice(0, 10)}`, () => {
    const o = cargarPortal(fecha);
    o.ev("vxDemo()");
    const m = crearMotorVIH({ libro: clonarLibro(o.ev("VX.book")), hoy: fecha, corte: o.ev("VX.corte"), ui: clonarLibro(o.ev("VX.ui")) }) as Record<string, unknown>;
    const ids = o.ev<string[]>("vxPacs().map(p => p.ID)");

    it("la cohorte ficticia es la esperada", () => {
      expect(ids.length).toBeGreaterThan(150);
      expect(evaluarEn(m, "vxPacs().map(p => p.ID)")).toEqual(ids);
      expect(normalizar(evaluarEn(m, "vxCorte()"))).toEqual(normalizar(o.ev("vxCorte()")));
    });

    for (const expr of GLOBALES) {
      it(expr, () => {
        expect(normalizar(evaluarEn(m, expr))).toEqual(normalizar(o.ev(expr)));
      });
    }

    for (const plantilla of POR_PACIENTE) {
      it(`${plantilla} · ${ids.length} pacientes`, () => {
        for (const id of ids) {
          const expr = plantilla.replace(/\bP\b/g, `vxP(${JSON.stringify(id)})`);
          expect(normalizar(evaluarEn(m, expr)), `${id}: ${plantilla}`).toEqual(normalizar(o.ev(expr)));
        }
      });
    }
  });
}
