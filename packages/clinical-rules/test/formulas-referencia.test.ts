/* Valores de referencia independientes del prototipo: casos calculados a mano con las fórmulas publicadas o
   contrastados con calculadoras públicas. Si alguno fallara, NO se corrige el código: se informa a la coordinación
   médica, porque la regla validada es la del prototipo. */
import { describe, expect, it } from "vitest";
import { formulas } from "../src/index.js";

describe("Kt/V Daugirdas II (spKt/V)", () => {
  it("BUN 60→20, 240 min, UF 3 L, peso post 70 kg = 1,32", () => {
    // -ln(R − 0,008·t) + (4 − 3,5·R)·UF/W con R = 1/3, t = 4 h
    expect(formulas.ktvDaugirdas(60, 20, 240, 3, 70)).toBeCloseTo(1.321, 3);
  });
  it("sin datos válidos devuelve null (BUN post ≥ pre, sin tiempo o sin peso)", () => {
    expect(formulas.ktvDaugirdas(60, 60, 240, 3, 70)).toBeNull();
    expect(formulas.ktvDaugirdas(60, 20, 0, 3, 70)).toBeNull();
    expect(formulas.ktvDaugirdas(60, 20, 240, 3, 0)).toBeNull();
  });
});

describe("Ultrafiltración", () => {
  it("peso 80 → 77 kg en 240 min: 3 L y 9,74 mL/kg/h", () => {
    const u = formulas.ufCalc(80, 77, 240)!;
    expect(u.kg).toBe(3);
    expect(u.ml).toBe(3000);
    expect(u.ufr).toBeCloseTo(9.74, 2);
  });
});

describe("TFGe CKD-EPI 2021 sin raza (NKF: calculadora pública)", () => {
  it.each([
    ["mujer 50 años, Cr 1,0", 1.0, 50, true, 68.6],
    ["hombre 60 años, Cr 1,2", 1.2, 60, false, 69.2],
    ["mujer 30 años, Cr 0,6", 0.6, 30, true, 123.8],
    ["hombre 75 años, Cr 2,5", 2.5, 75, false, 26.1],
  ])("%s", (_n, cr, edad, mujer, esperado) => {
    expect(formulas.tfgNefro(cr, edad, mujer)).toBeCloseTo(esperado, 1);
    // VIH usa su propia copia de la fórmula: debe dar lo mismo
    expect(formulas.tfgVIH(cr, edad, mujer ? "F" : "M")).toBeCloseTo(esperado, 1);
  });
});

describe("KFRE de 4 variables, calibración no norteamericana (Tangri 2016)", () => {
  it("hombre 65 años, TFGe 25, RAC 500 mg/g: 11,2 % a 2 años y 36,9 % a 5 años", () => {
    const r = formulas.kfre(65, 1, 25, 500);
    expect(r.r2).toBeCloseTo(0.1121, 3);
    expect(r.r5).toBeCloseTo(0.369, 3);
  });
  it("el riesgo aumenta con la albuminuria y disminuye con la TFGe", () => {
    expect(formulas.kfre(65, 1, 25, 1000).r2).toBeGreaterThan(formulas.kfre(65, 1, 25, 100).r2);
    expect(formulas.kfre(65, 1, 45, 500).r2).toBeLessThan(formulas.kfre(65, 1, 20, 500).r2);
  });
});

describe("Estadificación KDIGO", () => {
  it.each([
    [120, "G1"], [90, "G1"], [89.9, "G2"], [60, "G2"], [59, "G3a"], [45, "G3a"], [44, "G3b"], [30, "G3b"], [29, "G4"], [15, "G4"], [14.9, "G5"],
  ])("TFGe %s → %s", (tfg, g) => expect(formulas.estadioG(tfg)).toBe(g));
  it.each([[10, "A1"], [29.9, "A1"], [30, "A2"], [299, "A2"], [300, "A3"]])("RAC %s → %s", (rac, a) => expect(formulas.categoriaA(rac)).toBe(a));
});
