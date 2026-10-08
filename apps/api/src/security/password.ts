import { hash, verify } from "@node-rs/argon2";
import { randomInt } from "node:crypto";

/* Argon2id con los parámetros recomendados por OWASP (19 MiB, 2 iteraciones). */
const OPTS = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

export function hashClave(clave: string): Promise<string> {
  return hash(clave, OPTS);
}

export async function verificarClave(claveHash: string, clave: string): Promise<boolean> {
  try {
    return await verify(claveHash, clave);
  } catch {
    return false;
  }
}

/** Hash fijo para comparar cuando el usuario no existe y no revelar por el tiempo de respuesta si existe. */
let hashSenuelo: Promise<string> | null = null;
export function claveSenuelo(): Promise<string> {
  hashSenuelo ??= hashClave("clave-senuelo-que-nunca-coincide");
  return hashSenuelo;
}

/** Política: mínimo 10 caracteres, con letras y números, distinta del usuario. Devuelve el problema o null. */
export function problemaClave(clave: string, usuario?: string): string | null {
  if (clave.length < 10) return "La clave debe tener al menos 10 caracteres.";
  if (clave.length > 128) return "La clave no puede superar 128 caracteres.";
  if (!/[A-Za-zÁÉÍÓÚÑáéíóúñ]/.test(clave) || !/\d/.test(clave)) return "La clave debe combinar letras y números.";
  if (usuario && clave.toLowerCase().includes(usuario.toLowerCase())) return "La clave no puede contener el nombre de usuario.";
  return null;
}

/** Clave temporal legible (sin caracteres ambiguos) para restablecimientos hechos por el administrador. */
export function claveTemporal(): string {
  const L = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz";
  const D = "23456789";
  const all = L + D;
  let s = L[randomInt(L.length)] + D[randomInt(D.length)];
  while (s.length < 12) s += all[randomInt(all.length)];
  const a = s.split("");
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.join("");
}
