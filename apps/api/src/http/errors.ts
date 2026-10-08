import type { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

/** Error con mensaje apto para mostrar al usuario. Nunca incluir datos de pacientes en el mensaje. */
export class HttpError extends Error {
  constructor(public status: number, message: string, public codigo?: string) {
    super(message);
  }
}

export const noAutenticado = () => new HttpError(401, "Su sesión terminó. Ingrese de nuevo.", "NO_AUTENTICADO");
export const prohibido = (m = "Su usuario no tiene permiso para esta acción.") => new HttpError(403, m, "PROHIBIDO");
export const noEncontrado = (m = "No se encontró el registro.") => new HttpError(404, m, "NO_ENCONTRADO");

/** Envuelve controladores async para que los errores lleguen al manejador central. */
export const h =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res, next).catch(next);

export const manejadorErrores: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: "Datos inválidos.", codigo: "VALIDACION", campos: err.issues.map((i) => ({ campo: i.path.join("."), mensaje: i.message })) });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message, codigo: err.codigo });
    return;
  }
  if (err?.code === "P2025") {
    res.status(404).json({ error: "No se encontró el registro.", codigo: "NO_ENCONTRADO" });
    return;
  }
  if (err?.code === "P2002") {
    res.status(409).json({ error: "Ya existe un registro con esos datos.", codigo: "DUPLICADO" });
    return;
  }
  if (err?.type === "entity.too.large") {
    res.status(413).json({ error: "El contenido enviado es demasiado grande.", codigo: "MUY_GRANDE" });
    return;
  }
  if (err?.type === "entity.parse.failed") {
    res.status(400).json({ error: "El cuerpo de la petición no es JSON válido.", codigo: "JSON_INVALIDO" });
    return;
  }
  // Se registra solo el tipo y el mensaje técnico; nunca el cuerpo de la petición (puede tener datos de pacientes).
  console.error(JSON.stringify({ nivel: "error", id: req.id, ruta: req.path, metodo: req.method, error: err?.name, mensaje: err?.message }));
  res.status(500).json({ error: "Ocurrió un error interno. Intente de nuevo o informe al administrador.", codigo: "INTERNO", ref: req.id });
};
