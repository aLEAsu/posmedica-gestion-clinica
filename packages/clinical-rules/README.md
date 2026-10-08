# @posmedica/clinical-rules

Reglas clínicas de Hemodiálisis, VIH y Nefroprotección, **copiadas textualmente** del prototipo validado por la coordinación médica y verificadas contra él.

## Cómo está hecho

```
scripts/fuente.mjs           lee «Gestión Clínica POSMÉDICA (1).html» (raíz del repositorio)
scripts/extraer-reglas.mjs   copia cada definición permitida, con su línea de origen, a src/generado/
src/generado/hd.js           crearMotorHD(ctx)     164 definiciones   ┐
src/generado/vih.js          crearMotorVIH(ctx)    139 definiciones   ├ GENERADOS: no editar a mano
src/generado/nefro.js        crearMotorNefro(ctx)  NP + COH completos ┘
src/index.ts                 API tipada y fórmulas sueltas
test/oraculo.ts              ejecuta el prototipo ORIGINAL completo en un contexto aislado (DOM simulado, reloj fijo)
test/equivalencia-*.test.ts  compara oráculo y motor, paciente por paciente
```

- **No se reescribió ninguna regla.** Solo se reemplazó el estado del navegador (`ST`, `VX`, `TODAY()`, `window.EPSMODEL`) por el contexto `ctx`.
- El extractor **falla** si una definición incluida usa otra que no se incluyó, así no puede quedar una regla a medias.
- Inventario completo, con el origen de cada definición: [docs/REGLAS_CLINICAS.md](../../docs/REGLAS_CLINICAS.md).

## Pruebas (132)

```bash
npm run test -w packages/clinical-rules
```

| Batería | Qué compara | Datos |
|---|---|---|
| Equivalencia HD | 25 indicadores (17 CAC + 8 institucionales) y su tendencia, alertas, calidad del dato, conciliación, solicitud de laboratorio; por paciente: semáforo, calidad de diálisis, vacunación VHB, trasplante, calendario de laboratorios, GID, TA, glucometrías, Kt/V en línea, acceso, metas, valores de la matriz CAC | 40 pacientes ficticios del prototipo, cortes 8 oct y 15 mar 2026 |
| Equivalencia VIH | 46 indicadores (CAC + Nueva EPS), desgloses por EPS y municipio, filtros, cohorte nominal, reporte CAC, producción; por paciente: estado al corte, alertas, carné, plan de laboratorios, agenda por disciplina, PPD, filas nominal y CAC | 159 pacientes ficticios, dos fechas |
| Equivalencia Nefro | Fichas de indicadores, modelo por EPS; por paciente `COH.snapshot` (clasificación, metas, medicamentos, interpretación, plan, indicadores) en tres cortes | 300 pacientes ficticios, dos fechas |
| Valores de referencia | Kt/V Daugirdas II, UF, CKD-EPI 2021 (calculadora NKF), KFRE 4 variables, cortes G y A de KDIGO | casos calculados a mano |
| Controles negativos | Con otra fecha de corte los resultados **deben** diferir (la comparación no es trivial) | — |
| Extracción al día | `src/generado` es idéntico a una extracción nueva | — |

## Uso

```ts
import { crearMotorHD, formulas } from "@posmedica/clinical-rules";

const m = crearMotorHD({ libro, corte: new Date(2026, 9, 31), hoy: new Date() });
m.ensureIdx();
const indicadores = m.IND.map((d) => m.evalInd(d, m.ctxFor(m.ST.corte, m.ST.ps, m.ST.eps)));
const alertas = m.alertas();
formulas.ktvDaugirdas(60, 20, 240, 3, 70); // 1,32
```

`libro` tiene las mismas hojas y columnas que el libro de Excel del prototipo. En las fases 3 a 5 el backend lo arma desde la base de datos.

## Si el prototipo cambia

1. Reemplace `Gestión Clínica POSMÉDICA (1).html` con la versión aprobada por la coordinación.
2. Ejecute la extracción:
   ```bash
   npm run extraer -w packages/clinical-rules
   ```
3. Corra las pruebas:
   ```bash
   npm run test -w packages/clinical-rules
   ```
4. Revise el diff de `src/generado/` y de `docs/REGLAS_CLINICAS.md` antes de hacer commit.
