/* Respaldo completo descargable (respuesta a P6, 8 oct 2026): el administrador puede bajar toda la información
   para conservarla también en local o en físico. Recorre todos los modelos de Prisma, así que los módulos que se
   agreguen en las fases siguientes quedan incluidos sin tocar este archivo. */
import { Router } from "express";
import { Prisma } from "@prisma/client";
import * as XLSX from "xlsx";
import { prisma } from "../db.js";
import { h } from "../http/errors.js";
import { requiereAdmin } from "../http/middleware.js";
import { auditar } from "../services/auditoria.js";

export const respaldo = Router();
respaldo.use(requiereAdmin);

/** Modelos que no se exportan (tokens de sesión) y campos que nunca salen del sistema. */
const MODELOS_EXCLUIDOS = new Set(["Sesion"]);
const CAMPOS_EXCLUIDOS = new Set(["claveHash", "tokenHash"]);
const LOTE = 5000;
const MAX_CELDA = 32_000; // Excel admite 32.767 caracteres por celda

function modelos() {
  return Prisma.dmmf.datamodel.models.filter((m) => !MODELOS_EXCLUIDOS.has(m.name));
}

function delegado(nombre: string) {
  const k = nombre.charAt(0).toLowerCase() + nombre.slice(1);
  return (prisma as unknown as Record<string, { findMany: (a: object) => Promise<Record<string, unknown>[]> }>)[k];
}

async function leerTodo(m: (typeof Prisma.dmmf.datamodel.models)[number]) {
  const escalares = m.fields.filter((f) => f.kind === "scalar" || f.kind === "enum");
  const select = Object.fromEntries(escalares.filter((f) => !CAMPOS_EXCLUIDOS.has(f.name)).map((f) => [f.name, true]));
  // Orden estable por la clave primaria (simple o compuesta) para que la paginación por lotes no repita ni salte filas.
  const orden = (m.primaryKey ? m.primaryKey.fields : [escalares.find((f) => f.isId)!.name]).map((f) => ({ [f]: "asc" }));
  const filas: Record<string, unknown>[] = [];
  for (let skip = 0; ; skip += LOTE) {
    const L = await delegado(m.name).findMany({ select, orderBy: orden, skip, take: LOTE });
    filas.push(...L);
    if (L.length < LOTE) break;
  }
  return { columnas: Object.keys(select), filas };
}

const valor = (v: unknown) =>
  v == null ? null : typeof v === "bigint" ? v.toString() : v instanceof Date ? v.toISOString() : typeof v === "object" ? JSON.stringify(v) : v;

function marcaArchivo() {
  return new Date().toLocaleString("sv-SE", { timeZone: "America/Bogota" }).replace(/[: ]/g, "-").slice(0, 16);
}

respaldo.get(
  "/excel",
  h(async (req, res) => {
    const wb = XLSX.utils.book_new();
    const resumen: (string | number)[][] = [["Tabla", "Hoja", "Registros"]];
    let truncadas = 0;
    for (const m of modelos()) {
      const { columnas, filas } = await leerTodo(m);
      const aoa: unknown[][] = [columnas];
      for (const f of filas) {
        aoa.push(
          columnas.map((c) => {
            const v = valor(f[c]);
            if (typeof v === "string" && v.length > MAX_CELDA) {
              truncadas++;
              return v.slice(0, MAX_CELDA) + "…[TRUNCADO: ver respaldo JSON]";
            }
            return v;
          }),
        );
      }
      const hoja = (m.dbName ?? m.name).slice(0, 31);
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), hoja);
      resumen.push([m.name, hoja, filas.length]);
    }
    const leeme = [
      ["Respaldo completo · Sistema de gestión clínica POSMÉDICA"],
      ["Generado", new Date().toLocaleString("es-CO", { timeZone: "America/Bogota" })],
      ["Por", `${req.usuario!.nombre} (${req.usuario!.usuario})`],
      ["Contenido", "Una hoja por tabla. Fechas en ISO 8601 (UTC). Las claves y los tokens de sesión no se incluyen."],
      ["Aviso", "Contiene datos de salud sensibles (Ley 1581 de 2012). Guárdelo cifrado y con acceso restringido."],
      ...(truncadas ? [["Celdas truncadas", truncadas, "El respaldo JSON contiene el valor completo."]] : []),
      [],
      ...resumen,
    ];
    const wbFinal = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wbFinal, XLSX.utils.aoa_to_sheet(leeme), "LEAME");
    for (const n of wb.SheetNames) XLSX.utils.book_append_sheet(wbFinal, wb.Sheets[n], n);
    const buf = XLSX.write(wbFinal, { type: "buffer", bookType: "xlsx", compression: true });

    await auditar(req, { accion: "RESPALDO", entidad: "sistema", detalle: `Excel · ${resumen.slice(1).map((r) => `${r[0]}=${r[2]}`).join(", ")}` });
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="POSMEDICA_respaldo_${marcaArchivo()}.xlsx"`);
    res.setHeader("Cache-Control", "no-store");
    res.send(buf);
  }),
);

respaldo.get(
  "/json",
  h(async (req, res) => {
    const tablas: Record<string, unknown[]> = {};
    for (const m of modelos()) {
      const { filas } = await leerTodo(m);
      tablas[m.dbName ?? m.name] = filas.map((f) => Object.fromEntries(Object.entries(f).map(([k, v]) => [k, typeof v === "bigint" ? v.toString() : v])));
    }
    await auditar(req, { accion: "RESPALDO", entidad: "sistema", detalle: `JSON · ${Object.entries(tablas).map(([k, v]) => `${k}=${v.length}`).join(", ")}` });
    res.setHeader("Content-Disposition", `attachment; filename="POSMEDICA_respaldo_${marcaArchivo()}.json"`);
    res.setHeader("Cache-Control", "no-store");
    res.json({ sistema: "POSMEDICA gestión clínica", generado: new Date().toISOString(), por: req.usuario!.usuario, tablas });
  }),
);
