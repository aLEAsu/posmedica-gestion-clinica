/* Configuración del libro de Hemodiálisis para el motor genérico (modulos/libro). */
import { crearMotorHD } from "@posmedica/clinical-rules";
import type { ConfigLibro, Fila, HojaDef } from "../libro/servicio.js";
import { escrituraConTransversales, leeProgramaOTransversal } from "../libro/transversal.js";
import { CAMPOS_PERSONA, MODELOS_HD } from "./hojas.js";

const { SH, DATE_F, NUM_F } = crearMotorHD({ libro: { pac: [] } }) as unknown as {
  SH: Record<string, [string, string[]]>;
  DATE_F: Set<string>;
  NUM_F: Set<string>;
};

const partir = (s: unknown) => {
  const t = String(s ?? "").trim().split(/\s+/).filter(Boolean);
  return [t[0] ?? "", t.slice(1).join(" ") || null] as const;
};

export const CONFIG_HD: ConfigLibro = {
  programa: "hd",
  nombre: "hemodiálisis",
  hojas: Object.fromEntries(
    Object.entries(MODELOS_HD).map(([k, m]) => [k, { modelo: m.modelo, columnas: SH[k][1], clave: "ID", nombre: SH[k][0] } satisfies HojaDef]),
  ),
  tipo: (_h, c) => (DATE_F.has(c) ? "fecha" : NUM_F.has(c) ? "numero" : "texto"),
  vacio: null, // al reabrir el libro de Excel, las celdas vacías vuelven como null
  textoNumerico: new Set(["lab.Valor"]), // el valor de un paraclínico puede ser 9.8 o «Reactivo»
  puedeLeer: leeProgramaOTransversal("hd"),
  // Laboratorio carga solicitudes y resultados; SP, IAAS y PROA llevan sus hojas con los datos de hemodiálisis.
  ...escrituraConTransversales("hd", { sol: ["lab"], lab: ["lab"], seg: ["sp"], aud: ["iaas"], atb: ["proa"] }),
  paciente: {
    hoja: "pac",
    relacionPersona: "hdPaciente",
    camposPersona: CAMPOS_PERSONA,
    campoIngreso: "IngresoUnidad",
    // Hemodiálisis guarda «Nombres» y «Apellidos» completos: se parten en el primer espacio (igual que cacVals del prototipo).
    aPersona: (r: Fila) => {
      const [n1, n2] = partir(r.Nombres);
      const [a1, a2] = partir(r.Apellidos);
      return {
        tipoDoc: r.TipoDoc, documento: r.Documento, primerNombre: n1, segundoNombre: n2, primerApellido: a1, segundoApellido: a2,
        fechaNacimiento: r.FechaNac, sexo: r.Sexo, eps: r.EPS, regimen: r.Regimen, fechaAfiliacion: r.FechaAfiliacion,
        municipio: r.Municipio, municipioDane: r.MunicipioDANE, zona: r.Zona, direccion: r.Direccion, telefono: r.Telefono,
        etnia: r.Etnia, grupoPoblacional: r.GrupoPob,
      };
    },
    desdePersona: (p, fecha) => ({
      TipoDoc: p.tipoDoc, Documento: p.documento,
      Apellidos: [p.primerApellido, p.segundoApellido].filter(Boolean).join(" ") || null,
      Nombres: [p.primerNombre, p.segundoNombre].filter(Boolean).join(" ") || null,
      FechaNac: fecha(p.fechaNacimiento), Sexo: p.sexo, EPS: p.eps?.nombre ?? null, Regimen: p.regimen,
      FechaAfiliacion: fecha(p.fechaAfiliacion), Municipio: p.municipio, MunicipioDANE: p.municipioDane,
      Zona: p.zona, Direccion: p.direccion, Telefono: p.telefono, Etnia: p.etnia, GrupoPob: p.grupoPoblacional,
    }),
  },
};
