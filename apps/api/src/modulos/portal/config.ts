/* Libro institucional del portal (Fase 6): mensajes, comités del SOGCS, documentos, listas de chequeo, aportes,
   PROA, calendario, producción asistencial y reportes de seguridad del paciente.
   Reglas de acceso tomadas del prototipo y reforzadas en el servidor:
   - Mensajes: cada usuario solo recibe los que envió o los dirigidos a él o a su área (pxMine).
   - Documentos: los edita el administrador o el área de Calidad (pxDocEdit).
   - Reportes de seguridad: cualquier usuario puede reportar; el análisis y el cierre los hace Seguridad del paciente.
   - Valores de producción (prod_fin, cifrados con su clave): solo los recibe el administrador (D3). */
import { puede, type UsuarioSesion } from "@posmedica/shared";
import { ahoraTexto, type ConfigLibro, type Fila, type HojaDef } from "../libro/servicio.js";
import { HOJAS_PORTAL } from "./hojas.js";

const admin = (u: UsuarioSesion) => u.rol === "ADMIN";
const algun = (u: UsuarioSesion, mods: string[], a: "ver" | "registrar") => admin(u) || mods.some((m) => puede(u, m, a));
const norm = (s: unknown) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().trim();
const esCalidad = (u: UsuarioSesion) => norm(u.area) === "CALIDAD";

/** Módulos que leen (y registran) cada hoja. Las hojas sin entrada son de todos los usuarios. */
const LECTURA: Record<string, string[]> = { lst: ["iaas", "sp"], man: ["iaas", "proa", "sp"], prv: ["proa", "iaas"], ram: ["proa", "iaas", "sp"], prd: ["prod"] };

export const CONFIG_PORTAL: ConfigLibro = {
  programa: "portal",
  nombre: "el portal institucional",
  hojas: Object.fromEntries(Object.entries(HOJAS_PORTAL).map(([k, h]) => [k, { modelo: h.modelo, columnas: [...h.columnas], clave: "ID", nombre: h.nombre } satisfies HojaDef])),
  // El prototipo lee el libro institucional como texto (pxParse con raw:false y "" en las celdas vacías).
  tipo: () => "texto",
  vacio: "",
  cfgPrivada: new Set(["prod_fin"]),
  puedeLeer: () => true,
  puedeEscribir: () => true,
  leeHoja: (h, u) => !LECTURA[h] || algun(u, LECTURA[h], "ver"),
  leeFila: (h: string, f: Fila, u: UsuarioSesion) => {
    if (h === "msg") return f.De === u.id || f.Para === `u:${u.id}` || (!!u.area && f.Para === `a:${u.area}`);
    if (h === "rsp") return algun(u, ["sp"], "ver") || f.Usuario === u.usuario;
    return true;
  },
  escribe: (h, u, tipo, f) => {
    switch (h) {
      case "msg":
      case "cal":
        return true; // mensajes y calendario son de todos (la fila de un mensaje ya se filtró por destinatario)
      case "doc":
        return admin(u) || esCalidad(u) || puede(u, "docs", "registrar");
      case "com":
      case "cse":
        return algun(u, ["sogcs"], "registrar");
      case "cmp":
        return algun(u, ["sogcs"], "registrar") || (tipo === "modificado" && (f.Responsable === u.id || f.Responsable === u.area));
      case "rsp":
        return tipo === "nuevo" || algun(u, ["sp"], "registrar");
      default:
        return algun(u, LECTURA[h] ?? [], "registrar");
    }
  },
  fijarNuevo: (h, datos, u) => {
    if ("Usuario" in datos) datos.Usuario = u.usuario; // el portal del prototipo guarda el nombre de usuario (pxAdd)
    if (h === "msg") {
      datos.De = u.id;
      if (!datos.FechaHora) datos.FechaHora = ahoraTexto();
    }
    if (h === "cal" && !datos.Creador) datos.Creador = u.id;
  },
};
