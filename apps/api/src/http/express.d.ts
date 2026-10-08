import type { UsuarioSesion } from "@posmedica/shared";

declare global {
  namespace Express {
    interface Request {
      id: string;
      usuario?: UsuarioSesion;
      sesionId?: string;
    }
  }
}

export {};
