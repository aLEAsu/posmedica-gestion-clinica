/* @posmedica/clinical-rules
   Reglas clínicas del prototipo «Gestión Clínica POSMÉDICA», extraídas TEXTUALMENTE (src/generado/, no editar a mano)
   y verificadas contra el prototipo original con pruebas de equivalencia (test/).

   Uso típico en el backend: armar el «libro» del programa con las mismas hojas y columnas del prototipo a partir de la
   base de datos, crear el motor con la fecha de corte y llamar las funciones (indicadores, alertas, semáforo…). */
import { crearMotorHD as _hd } from "./generado/hd.js";
import { crearMotorNefro as _nefro } from "./generado/nefro.js";
import { crearMotorVIH as _vih } from "./generado/vih.js";

export const VERSION_REGLAS = "0.2.0";
export const FUENTE = "Gestión Clínica POSMÉDICA (1).html";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Fn = (...a: any[]) => any;
type Fecha = Date | string | number;

export interface ContextoHD {
  /** Libro de hemodiálisis con las hojas del prototipo (pac, ses, evt, lab, nov, mov, ctc, acn, ate, val, est, vac, txs, sol, seg, atb, aud, med, dis, cor, log, cfgv). */
  libro: Record<string, any>;
  /** Fecha de corte de los cálculos (por defecto, hoy). */
  corte?: Fecha;
  /** Inicio del periodo (por defecto, el inicio del periodo CAC: 1 de julio). */
  inicioPeriodo?: Fecha;
  /** Filtro de EPS (vacío = todas). */
  eps?: string;
  /** «Hoy» para los cálculos que dependen de la fecha actual (por defecto, la fecha del sistema). */
  hoy?: Fecha;
  /** Tarifas y valores facturados (solo administrador): { tarifas: [...], facturado: { "AAAA-MM|ID": valor } }. */
  facturacion?: Record<string, any> | null;
  /** Librería SheetJS, solo para leer o escribir libros de Excel. */
  XLSX?: unknown;
}

export interface MotorHD extends Record<string, any> {
  ST: { book: any; corte: Date; ps: Date; eps: string };
  IND: { c: string; n: string; t: "pct" | "rate"; dir: "up" | "down"; inst?: boolean; f: Fn }[];
  INDM: Record<string, any>;
  ensureIdx: () => void;
  pacs: () => any[];
  ctxFor: (c: Date, ps: Date, eps: string) => any;
  evalInd: (def: any, x: any) => { val: number | null; n: number; d: number; status: string; num?: any[]; den?: any[]; excl?: any[]; sd?: any[] };
  trendPoints: Fn;
  alertas: () => Record<string, any> & { total: number };
  calidad: () => { g: string; p: any; t: string; lvl: string }[];
  semaforo: (p: any, c: Date) => { tot: number; lvl: "bajo" | "medio" | "alto"; al: string[]; sd: string[] } & Record<string, any>;
  calidadDe: Fn;
  vacStatus: Fn;
  txState: Fn;
  labDue: Fn;
  examsForMonth: Fn;
  solPropuesta: Fn;
  tenerPresente: Fn;
  conciliar: Fn;
  cacVals: Fn;
  ktvDaugirdas: (pre: number, post: number, tMin: number, uf: number, w: number) => number | null;
  ufCalc: (pre: number | null, post: number | null, min: number | null) => { kg: number; ml: number; ufr: number | null } | null;
}

export interface ContextoVIH {
  /** Libro del programa VIH con las hojas del prototipo (pac, ant, lab, tar, ent, cit, val, vac, prc, prf, nov, sol, cac, log, cfg). */
  libro: Record<string, any>;
  /** Fecha de corte (por defecto, el último día del mes anterior a «hoy»). */
  corte?: Fecha | null;
  hoy?: Fecha;
  /** Estado de filtros de la vista (f: { eps, reg, mun, sexo, pc, mod }, pini: inicio del periodo). */
  ui?: Record<string, any>;
  XLSX?: unknown;
}

export interface MotorVIH extends Record<string, any> {
  VX: { book: any; corte: Date | null; ui: any };
  VX_IND: { id: string; set: "cac" | "neps"; dom: string; n: string; f: Fn }[];
  vxCorte: () => Date;
  vxPacs: () => any[];
  vxP: (id: string) => any;
  vxSt: Fn;
  vxAlertas: (p: any, c?: Date) => { nivel: "roja" | "amarilla" | "verde" | "—"; L: { n: string; t: string; k: string }[] };
  vxVacEstado: Fn;
  vxCalc: (d: any, c: Date | null, F: Record<string, string>, pac: any[] | null) => { num: number; den: number; pct: number | null; nv: string; cls: string; rows: any[] };
  vxCalcBy: Fn;
  vxLabPlan: Fn;
  vxAgEstado: Fn;
  vxNomRow: Fn;
  vxCACRow: Fn;
  vxTFG: (cr: number | null, edad: number | null, sexo: string) => number | null;
}

export interface ContextoNefro {
  /** Modelo de atención por EPS (por defecto, el confirmado el 6 oct 2026: EPSMODEL_DEF). */
  modeloEps?: Record<string, any>;
  XLSX?: unknown;
}

export interface MotorNefro {
  NP: {
    ckd: (scr: number, edad: number, mujer: boolean) => number;
    kfre: (edad: number, hombre: 0 | 1, tfg: number, rac: number) => { r2: number; r5: number };
    gStage: (tfg: number | null) => string | null;
    aCat: (rac: number | null) => string | null;
    classify: Fn;
    plan: Fn;
    note: Fn;
    goals: Fn;
  } & Record<string, any>;
  COH: { snapshot: Fn; parse: Fn; FICHAS: Record<string, any>; ORDER: string[]; activeAt: Fn } & Record<string, any>;
  EPSMODEL_DEF: Record<string, any>;
}

export const crearMotorHD = _hd as unknown as (ctx: ContextoHD) => MotorHD;
export const crearMotorVIH = _vih as unknown as (ctx: ContextoVIH) => MotorVIH;
export const crearMotorNefro = _nefro as unknown as (ctx?: ContextoNefro) => MotorNefro;

/* Fórmulas sueltas para usos puntuales (formularios, validaciones). Son las mismas funciones del prototipo. */
const hd = crearMotorHD({ libro: { pac: [] } });
const vih = crearMotorVIH({ libro: { pac: [] } });
const nefro = crearMotorNefro({});

export const formulas = {
  /** Kt/V Daugirdas II: BUN pre y post (mg/dL), tiempo (min), UF (L), peso post (kg). hd.js:231 */
  ktvDaugirdas: hd.ktvDaugirdas,
  /** UF neta (kg ≈ L) y tasa de UF (mL/kg/h). hd.js:1427 */
  ufCalc: hd.ufCalc,
  /** TFGe CKD-EPI 2021 sin raza (motor de Nefroprotección). motor_clinico.js:7 */
  tfgNefro: nefro.NP.ckd,
  /** TFGe CKD-EPI 2021 sin raza (copia del programa VIH; sexo "F" o "M"). vih.js:242 */
  tfgVIH: vih.vxTFG,
  /** KFRE de 4 variables, calibración no norteamericana. motor_clinico.js:8 */
  kfre: nefro.NP.kfre,
  /** Estadio G por TFGe. motor_clinico.js:9 */
  estadioG: nefro.NP.gStage,
  /** Categoría A por RAC (mg/g). motor_clinico.js:10 */
  categoriaA: nefro.NP.aCat,
};
