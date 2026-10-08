/* Genera los modelos Prisma de los libros de programa a partir de las hojas del prototipo, tomadas de los motores
   extraídos (@posmedica/clinical-rules): Hemodiálisis (SH, DATE_F, NUM_F) y VIH (VXS, todo texto como lo lee el
   prototipo). Escribe entre los marcadores de prisma/schema.prisma.
   Uso: npm run esquema -w apps/api   y luego   npm run migrate:dev -w apps/api */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { crearMotorHD, crearMotorVIH } from "@posmedica/clinical-rules";
import { CAMPOS_PERSONA, MODELOS_HD } from "../src/modulos/hd/hojas.ts";
import { CAMPOS_PERSONA_VIH, MODELOS_VIH } from "../src/modulos/vih/hojas.ts";
import { HOJAS_PORTAL } from "../src/modulos/portal/hojas.ts";

const aqui = dirname(fileURLToPath(import.meta.url));
const RUTA = resolve(aqui, "../prisma/schema.prisma");
const snake = (s) => s.replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/([A-Z])([A-Z][a-z])/g, "$1_$2").toLowerCase();

function modelos({ hojas, modelosPorHoja, camposPersona, tipo, relacionPersona, etiquetaLibro }) {
  const bloques = [];
  for (const [hoja, { modelo, tabla, clave = "ID" }] of Object.entries(modelosPorHoja)) {
    const [nombreHoja, columnas] = hojas[hoja];
    const L = [`/// Hoja «${nombreHoja}» del ${etiquetaLibro} del prototipo.`, `model ${modelo} {`];
    for (const c of columnas) {
      if (hoja === "pac" && camposPersona.includes(c)) continue; // la identidad vive en «persona» (maestro único, D1)
      const t = c === clave ? "String" : tipo(c) === "fecha" ? "DateTime?" : tipo(c) === "numero" ? "Float?" : "String?";
      const extra = c === clave ? " @id" : tipo(c) === "fecha" ? " @db.Date" : "";
      L.push(`  ${c.padEnd(18)} ${t.padEnd(10)}${extra} @map("${snake(c)}")`);
    }
    if (hoja === "pac") L.push(`  personaId          String     @unique @map("persona_id") @db.Uuid`, `  persona            Persona    @relation(fields: [personaId], references: [id])`);
    L.push(
      `  creadoPor          String?    @map("creado_por") @db.Uuid`,
      `  creadoEn           DateTime   @default(now()) @map("creado_en") @db.Timestamptz(3)`,
      `  actualizadoPor     String?    @map("actualizado_por") @db.Uuid`,
      `  actualizadoEn      DateTime   @default(now()) @updatedAt @map("actualizado_en") @db.Timestamptz(3)`,
      "",
    );
    if (columnas.includes("Paciente") && clave !== "Paciente") L.push(`  @@index([Paciente])`);
    for (const f of ["Fecha", "FechaToma", "Mes", "Inicio"]) if (columnas.includes(f)) L.push(`  @@index([${f}])`);
    L.push(`  @@map("${tabla}")`, "}");
    bloques.push(L.join("\n"));
  }
  return bloques;
}

function escribir(ini, fin, bloques) {
  const actual = readFileSync(RUTA, "utf8");
  const a = actual.indexOf(ini), b = actual.indexOf(fin);
  const nuevo = `${ini}\n\n${bloques.join("\n\n")}\n\n${fin}`;
  writeFileSync(RUTA, a >= 0 && b > a ? actual.slice(0, a) + nuevo + actual.slice(b + fin.length) : actual.trimEnd() + "\n\n" + nuevo + "\n");
}

const hd = crearMotorHD({ libro: { pac: [] } });
escribir(
  "// <<< HEMODIALISIS (GENERADO por scripts/generar-esquema.mjs: no editar a mano)",
  "// >>> HEMODIALISIS",
  modelos({ hojas: hd.SH, modelosPorHoja: MODELOS_HD, camposPersona: CAMPOS_PERSONA, tipo: (c) => (hd.DATE_F.has(c) ? "fecha" : hd.NUM_F.has(c) ? "numero" : "texto"), etiquetaLibro: "libro de hemodiálisis" }),
);
const vih = crearMotorVIH({ libro: { pac: [] } });
escribir(
  "// <<< VIH (GENERADO por scripts/generar-esquema.mjs: no editar a mano)",
  "// >>> VIH",
  modelos({ hojas: vih.VXS, modelosPorHoja: MODELOS_VIH, camposPersona: CAMPOS_PERSONA_VIH, tipo: () => "texto", etiquetaLibro: "libro del programa VIH" }),
);
escribir(
  "// <<< PORTAL (GENERADO por scripts/generar-esquema.mjs: no editar a mano)",
  "// >>> PORTAL",
  modelos({
    hojas: Object.fromEntries(Object.entries(HOJAS_PORTAL).map(([k, h]) => [k, [h.nombre, h.columnas]])),
    modelosPorHoja: HOJAS_PORTAL,
    camposPersona: [],
    tipo: () => "texto",
    etiquetaLibro: "libro institucional",
  }),
);
console.log("Modelos generados: hemodiálisis", Object.keys(MODELOS_HD).length, "· VIH", Object.keys(MODELOS_VIH).length, "· portal", Object.keys(HOJAS_PORTAL).length);
