/* Genera los modelos Prisma de Hemodiálisis a partir de la definición de hojas del prototipo (SH, DATE_F, NUM_F),
   tomada del motor extraído (@posmedica/clinical-rules). Escribe entre los marcadores de prisma/schema.prisma.
   Uso: npm run esquema:hd -w apps/api   y luego   npm run migrate:dev -w apps/api */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { crearMotorHD } from "@posmedica/clinical-rules";
import { CAMPOS_PERSONA, MODELOS_HD } from "../src/modulos/hd/hojas.ts";

const aqui = dirname(fileURLToPath(import.meta.url));
const RUTA = resolve(aqui, "../prisma/schema.prisma");
const INI = "// <<< HEMODIALISIS (GENERADO por scripts/generar-esquema-hd.mjs: no editar a mano)";
const FIN = "// >>> HEMODIALISIS";

const { SH, DATE_F, NUM_F } = crearMotorHD({ libro: { pac: [] } });
const snake = (s) => s.replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/([A-Z])([A-Z][a-z])/g, "$1_$2").toLowerCase();

const bloques = [];
for (const [hoja, { modelo, tabla }] of Object.entries(MODELOS_HD)) {
  const [nombreHoja, columnas] = SH[hoja];
  const lineas = [`/// Hoja «${nombreHoja}» del libro de hemodiálisis del prototipo.`, `model ${modelo} {`];
  for (const c of columnas) {
    if (hoja === "pac" && CAMPOS_PERSONA.includes(c)) continue; // la identidad vive en «persona» (maestro único, D1)
    const tipo = c === "ID" ? "String" : DATE_F.has(c) ? "DateTime?" : NUM_F.has(c) ? "Float?" : "String?";
    const extra = c === "ID" ? " @id" : DATE_F.has(c) ? " @db.Date" : "";
    lineas.push(`  ${c.padEnd(18)} ${tipo.padEnd(10)}${extra} @map("${snake(c)}")`);
  }
  if (hoja === "pac") lineas.push(`  personaId          String     @unique @map("persona_id") @db.Uuid`, `  persona            Persona    @relation(fields: [personaId], references: [id])`);
  lineas.push(
    `  creadoPor          String?    @map("creado_por") @db.Uuid`,
    `  creadoEn           DateTime   @default(now()) @map("creado_en") @db.Timestamptz(3)`,
    `  actualizadoPor     String?    @map("actualizado_por") @db.Uuid`,
    `  actualizadoEn      DateTime   @default(now()) @updatedAt @map("actualizado_en") @db.Timestamptz(3)`,
    "",
  );
  if (columnas.includes("Paciente")) lineas.push(`  @@index([Paciente])`);
  for (const f of ["Fecha", "FechaToma", "Mes", "Inicio"]) if (columnas.includes(f)) lineas.push(`  @@index([${f}])`);
  lineas.push(`  @@map("${tabla}")`, "}");
  bloques.push(lineas.join("\n"));
}

const actual = readFileSync(RUTA, "utf8");
const a = actual.indexOf(INI), b = actual.indexOf(FIN);
const nuevo = `${INI}\n\n${bloques.join("\n\n")}\n\n${FIN}`;
const salida = a >= 0 && b > a ? actual.slice(0, a) + nuevo + actual.slice(b + FIN.length) : actual.trimEnd() + "\n\n" + nuevo + "\n";
writeFileSync(RUTA, salida);
console.log(`Modelos de hemodiálisis generados: ${bloques.length}`);
