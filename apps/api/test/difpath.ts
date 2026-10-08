export function primeraDif(a: any, b: any, ruta = "$"): string | null {
  if (JSON.stringify(a) === JSON.stringify(b)) return null;
  if (a && b && typeof a === "object" && typeof b === "object") {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) { const d = primeraDif(a[k], b[k], ruta + "." + k); if (d) return d; }
  }
  return `${ruta}: base=${JSON.stringify(a)?.slice(0, 200)} | prototipo=${JSON.stringify(b)?.slice(0, 200)}`;
}
