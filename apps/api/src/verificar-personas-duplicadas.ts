/* Auditoría técnica (A5, docs/ANALISIS.md §12): antes de desplegar la migración 20261019140000_persona_unica_por_
   documento (que exige un documento único en «persona»), hay que confirmar que no existan ya dos o más personas con
   el mismo documento (el error que esa migración corrige). De solo lectura: no modifica nada.
   Uso: npm run personas:verificar-duplicados -w apps/api */
import { prisma } from "./db.js";

async function main() {
  const grupos = await prisma.persona.groupBy({
    by: ["documento"],
    where: { documento: { not: null } },
    _count: { _all: true },
    having: { documento: { _count: { gt: 1 } } },
  });

  if (!grupos.length) {
    console.log("Sin documentos duplicados: la migración se puede desplegar con seguridad.");
    return;
  }
  console.log(`${grupos.length} documento(s) con más de una persona (hay que fusionarlas o corregirlas antes de desplegar la migración):\n`);
  for (const g of grupos) {
    const filas = await prisma.persona.findMany({
      where: { documento: g.documento },
      select: { id: true, tipoDoc: true, documento: true, primerNombre: true, primerApellido: true, creadoEn: true },
      orderBy: { creadoEn: "asc" },
    });
    console.log(`Documento ${g.documento} (${filas.length} personas):`);
    for (const f of filas) console.log(`  id=${f.id} tipoDoc=${f.tipoDoc ?? "(vacío)"} nombre="${f.primerNombre} ${f.primerApellido}" creado=${f.creadoEn.toISOString()}`);
  }
}

main()
  .catch((e) => {
    console.error("No se pudo verificar:", e?.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
