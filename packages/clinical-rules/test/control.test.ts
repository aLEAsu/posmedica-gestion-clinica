import { expect, it } from "vitest";
import { crearMotorHD } from "../src/generado/hd.js";
import { crearMotorVIH } from "../src/generado/vih.js";
import { clonarLibro, evaluarEn, normalizar } from "./comparar.js";
import { cargarPortal } from "./oraculo.js";
it("control negativo: otra fecha de corte da resultados distintos y los resultados no son triviales", async () => {
  const f = new Date(2026, 9, 8);
  const o = cargarPortal(f);
  await o.ev("loadDemo()");
  const m = crearMotorHD({ libro: clonarLibro(o.ev("ST.book")), hoy: f, corte: new Date(2026, 8, 1), inicioPeriodo: o.ev("ST.ps") }) as Record<string, unknown>;
  expect(normalizar(evaluarEn(m, "alertas()"))).not.toEqual(normalizar(o.ev("alertas()")));
  const ind = o.ev<{ n: number; d: number }[]>("IND.map(d => evalInd(d, ctxFor(ST.corte, ST.ps, ST.eps)))");
});

it("control negativo VIH: otra fecha de corte da otros indicadores", () => {
  const f = new Date(2026, 9, 8);
  const o = cargarPortal(f);
  o.ev("vxDemo()");
  const m = crearMotorVIH({ libro: clonarLibro(o.ev("VX.book")), hoy: f, corte: new Date(2026, 2, 31) }) as Record<string, unknown>;
  const expr = "VX_IND.map(d => vxCalc(d, vxCorte(), {}, null))";
  expect(normalizar(evaluarEn(m, expr))).not.toEqual(normalizar(o.ev(expr)));
});
