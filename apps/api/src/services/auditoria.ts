import type { Request } from "express";
import type { Prisma } from "@prisma/client";
import { prisma } from "../db.js";

/** Campos que nunca se copian a la auditoría. */
const SENSIBLES = new Set(["claveHash", "clave", "claveNueva", "claveActual", "tokenHash"]);

function limpiar(v: unknown): Prisma.InputJsonValue | undefined {
  if (v == null) return undefined;
  return JSON.parse(
    JSON.stringify(v, (k, x) => (SENSIBLES.has(k) ? undefined : typeof x === "bigint" ? x.toString() : x)),
  );
}

export interface EventoAuditoria {
  accion: string;
  entidad: string;
  registroId?: string | null;
  programa?: string | null;
  antes?: unknown;
  despues?: unknown;
  detalle?: string | null;
  /** Para eventos sin sesión (p. ej. ingreso fallido) se indica el usuario explícitamente. */
  usuarioId?: string | null;
  usuarioNombre?: string | null;
}

type Cliente = Prisma.TransactionClient | typeof prisma;

/** Registra un evento en la auditoría inmutable. Use el cliente de la transacción para que quede en la misma operación. */
export async function auditar(req: Request, ev: EventoAuditoria, db: Cliente = prisma) {
  await db.auditoria.create({
    data: {
      usuarioId: ev.usuarioId ?? req.usuario?.id ?? null,
      usuarioNombre: ev.usuarioNombre ?? (req.usuario ? `${req.usuario.nombre} · ${req.usuario.cargo}` : null),
      accion: ev.accion,
      entidad: ev.entidad,
      registroId: ev.registroId ?? null,
      programa: ev.programa ?? null,
      ip: req.ip ?? null,
      antes: limpiar(ev.antes),
      despues: limpiar(ev.despues),
      detalle: ev.detalle ?? null,
    },
  });
}

/** Diferencias campo a campo «antes → después», como la bitácora del prototipo (updRec). */
export function diferencias<T extends Record<string, unknown>>(antes: T, cambios: Partial<T>) {
  const a: Record<string, unknown> = {};
  const d: Record<string, unknown> = {};
  for (const k of Object.keys(cambios)) {
    const va = antes[k], vd = cambios[k];
    const s = (x: unknown) => (x instanceof Date ? x.toISOString() : JSON.stringify(x ?? null));
    if (vd !== undefined && s(va) !== s(vd)) {
      a[k] = va;
      d[k] = vd;
    }
  }
  return { antes: a, despues: d, cambio: Object.keys(d).length > 0 };
}
