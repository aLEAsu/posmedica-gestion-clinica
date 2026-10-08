/* Cliente HTTP. Todas las rutas son relativas (/api/...): en local las reenvía Vite y en Render el Static Site,
   así la cookie de sesión es del mismo origen. La cabecera X-Posmedica forma parte de la protección CSRF. */

export class ErrorApi extends Error {
  constructor(public status: number, message: string, public codigo?: string, public campos?: { campo: string; mensaje: string }[]) {
    super(message);
  }
}

type Escucha = (e: ErrorApi) => void;
let alPerderSesion: Escucha | null = null;
export function siPierdeSesion(fn: Escucha) {
  alPerderSesion = fn;
}

async function pedir<T>(metodo: string, ruta: string, cuerpo?: unknown): Promise<T> {
  const r = await fetch(`/api/v1${ruta}`, {
    method: metodo,
    credentials: "same-origin",
    headers: { Accept: "application/json", "X-Posmedica": "1", ...(cuerpo !== undefined ? { "Content-Type": "application/json" } : {}) },
    body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
  });
  if (r.ok) return (await r.json()) as T;
  let datos: { error?: string; codigo?: string; campos?: { campo: string; mensaje: string }[] } = {};
  try {
    datos = await r.json();
  } catch {
    /* respuesta sin JSON (p. ej. el servicio está despertando) */
  }
  const e = new ErrorApi(r.status, datos.error ?? (r.status >= 500 ? "El servidor no responde. Intente de nuevo en un momento." : "No se pudo completar la acción."), datos.codigo, datos.campos);
  if ((r.status === 401 && !ruta.startsWith("/auth/login") && ruta !== "/auth/me") || e.codigo === "CAMBIO_CLAVE") alPerderSesion?.(e);
  throw e;
}

export const api = {
  get: <T>(ruta: string) => pedir<T>("GET", ruta),
  post: <T>(ruta: string, cuerpo: unknown = {}) => pedir<T>("POST", ruta, cuerpo),
  patch: <T>(ruta: string, cuerpo: unknown) => pedir<T>("PATCH", ruta, cuerpo),
  put: <T>(ruta: string, cuerpo: unknown) => pedir<T>("PUT", ruta, cuerpo),
};

/** Descarga un archivo de la API con la sesión actual (respaldo, reportes). */
export async function descargar(ruta: string, nombrePorDefecto: string) {
  const r = await fetch(`/api/v1${ruta}`, { credentials: "same-origin", headers: { "X-Posmedica": "1" } });
  if (!r.ok) {
    let m = "No se pudo descargar el archivo.";
    try {
      m = (await r.json()).error ?? m;
    } catch {
      /* sin cuerpo */
    }
    throw new ErrorApi(r.status, m);
  }
  const cd = r.headers.get("content-disposition") ?? "";
  const nombre = /filename="([^"]+)"/.exec(cd)?.[1] ?? nombrePorDefecto;
  const url = URL.createObjectURL(await r.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  return nombre;
}
