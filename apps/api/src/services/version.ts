/* Contador de versión de un libro (cada guardado lo sube; los navegadores lo consultan para saber si hay datos nuevos).
   Se incrementa en UNA sentencia atómica y FUERA de la transacción serializable del guardado: dentro de ella, dos
   usuarios que guardaban registros distintos al mismo tiempo chocaban siempre en esta fila (uno recibía 409). Los
   conflictos reales sobre un mismo registro los sigue detectando su sello de concurrencia (_ts). */
import { prisma } from "../db.js";

export async function subirVersion(programa: string, clave: string, usuarioId: string | null): Promise<number> {
  try {
    const r = await prisma.$queryRaw<{ valor: bigint }[]>`
      INSERT INTO parametro (programa, clave, valor, actualizado_por, actualizado_en, vigente_desde)
      VALUES (${programa}, ${clave}, '1'::jsonb, ${usuarioId}::uuid, now(), now())
      ON CONFLICT (programa, clave) DO UPDATE
        SET valor = to_jsonb(COALESCE((parametro.valor #>> '{}')::bigint, 0) + 1), actualizado_por = EXCLUDED.actualizado_por, actualizado_en = now()
      RETURNING (valor #>> '{}')::bigint AS valor`;
    return Number(r[0].valor);
  } catch (e) {
    // El guardado ya quedó confirmado: si falla solo el contador, el navegador verá «hay datos nuevos» y recargará.
    console.error(JSON.stringify({ nivel: "error", mensaje: "No se pudo subir la versión del libro", programa, error: (e as Error)?.message }));
    return -1;
  }
}

/** Ejecuta una transacción serializable y la reintenta si PostgreSQL la aborta por serialización (P2034). Con aislamiento
    serializable, dos guardados de registros DISTINTOS pueden abortarse por compartir una página de índice (falso
    positivo); el reintento los resuelve. Un conflicto real (mismo registro o mismo cupo) se ve en el reintento y responde
    409 por las reglas de siempre. */
export async function conReintentos<T>(fn: () => Promise<T>, intentos = 4): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (e) {
      if ((e as { code?: string }).code !== "P2034" || i >= intentos) throw e;
      await new Promise((r) => setTimeout(r, 15 + Math.random() * 60 * i));
    }
  }
}
