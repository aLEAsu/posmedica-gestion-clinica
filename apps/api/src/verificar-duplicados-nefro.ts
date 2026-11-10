/* Auditoría técnica (A8, docs/ANALISIS.md §12.2): antes de agregar una restricción @@unique real a nefro_laboratorio,
   nefro_atencion y nefro_novedad (para cerrar la condición de carrera corregida en A4), hay que confirmar que no existan
   ya filas duplicadas que esa restricción rechazaría. Esto NO modifica nada: solo informa.
   Uso: npm run nefro:verificar-duplicados -w apps/api */
import { prisma } from "./db.js";

async function main() {
  const lab = await prisma.nefroLaboratorio.groupBy({
    by: ["pacienteId", "fechaToma", "examen"],
    where: { anulado: false },
    _count: { _all: true },
    having: { pacienteId: { _count: { gt: 1 } } },
  });
  const atencion = await prisma.nefroAtencion.groupBy({
    by: ["pacienteId", "fecha", "disciplina"],
    where: { anulado: false },
    _count: { _all: true },
    having: { pacienteId: { _count: { gt: 1 } } },
  });
  // NefroNovedad no tiene anulado (no se anula): se compara la fila completa que el código trata como si no debiera repetirse.
  const novedad = await prisma.nefroNovedad.groupBy({
    by: ["pacienteId", "fecha", "tipo"],
    _count: { _all: true },
    having: { pacienteId: { _count: { gt: 1 } } },
  });

  console.log(`nefro_laboratorio: ${lab.length} grupo(s) duplicado(s) (mismo paciente, fecha de toma y examen, activos).`);
  for (const g of lab) console.log(`  paciente=${g.pacienteId} fecha=${g.fechaToma.toISOString().slice(0, 10)} examen=${g.examen} filas=${g._count._all}`);

  console.log(`nefro_atencion: ${atencion.length} grupo(s) duplicado(s) (mismo paciente, fecha y disciplina, activas).`);
  for (const g of atencion) console.log(`  paciente=${g.pacienteId} fecha=${g.fecha.toISOString().slice(0, 10)} disciplina=${g.disciplina} filas=${g._count._all}`);

  console.log(`nefro_novedad: ${novedad.length} grupo(s) duplicado(s) (mismo paciente, fecha y tipo).`);
  for (const g of novedad) console.log(`  paciente=${g.pacienteId} fecha=${g.fecha.toISOString().slice(0, 10)} tipo=${g.tipo} filas=${g._count._all}`);

  const total = lab.length + atencion.length + novedad.length;
  console.log(total === 0
    ? "\nSin duplicados: se puede agregar la restricción @@unique con seguridad."
    : `\n${total} grupo(s) duplicado(s) en total: hay que decidir qué fila conservar de cada grupo ANTES de agregar la restricción (si no, la migración fallará).`);
}

main()
  .catch((e) => {
    console.error("No se pudo verificar:", e?.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
