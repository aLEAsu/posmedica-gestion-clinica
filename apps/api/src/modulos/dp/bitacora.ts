/* Bitácora de Diálisis peritoneal (pestaña Reportes → Bitácora del prototipo).
   En el prototipo era una hoja del libro de Excel con una cadena de huellas para detectar cambios hechos por fuera del
   sistema. Con base de datos esa garantía la da la auditoría inmutable del servidor (un trigger impide modificarla o
   borrarla): aquí se entrega la auditoría de DP con las columnas de la hoja Bitácora. */
import { Router } from "express";
import { puede } from "@posmedica/shared";
import { prisma } from "../../db.js";
import { h, prohibido } from "../../http/errors.js";
import { requiereSesion } from "../../http/middleware.js";
import { HOJAS_DP } from "./hojas.js";

const hora = (d: Date) => d.toLocaleString("sv-SE", { timeZone: "America/Bogota" }).slice(0, 16);
const nombreHoja = (entidad: string) => {
  const k = entidad.split(".")[1] ?? "";
  return (HOJAS_DP as Record<string, { nombre: string }>)[k]?.nombre ?? k;
};

export const dpBitacora = Router();
dpBitacora.use(requiereSesion());

dpBitacora.get(
  "/bitacora",
  h(async (req, res) => {
    if (!puede(req.usuario, "dp", "ver")) throw prohibido();
    const filas = await prisma.auditoria.findMany({
      where: { programa: "dp", accion: { not: "CONSULTA" } },
      orderBy: { id: "desc" },
      take: 5000,
      select: { fecha: true, usuarioNombre: true, accion: true, entidad: true, registroId: true, detalle: true, despues: true },
    });
    const bitacora = filas.reverse().map((f) => ({
      FechaHora: hora(f.fecha),
      Usuario: f.usuarioNombre ?? "",
      Accion: f.accion,
      Hoja: nombreHoja(f.entidad),
      Registro: f.registroId ?? "",
      // Lo que cambió: el detalle registrado o los campos modificados (sin repetir sus valores clínicos).
      Detalle: f.detalle ?? (f.accion === "MODIFICA" && f.despues && typeof f.despues === "object" ? `Campos: ${Object.keys(f.despues).join(", ")}` : ""),
    }));
    res.json({ bitacora });
  }),
);
