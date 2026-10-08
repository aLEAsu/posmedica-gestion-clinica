/* Configuración del libro del programa VIH para el motor genérico (modulos/libro). */
import { crearMotorVIH } from "@posmedica/clinical-rules";
import type { ConfigLibro, Fila, HojaDef } from "../libro/servicio.js";
import { CAMPOS_PERSONA_VIH, ETNIA_VIH, MODELOS_VIH, ZONA_VIH } from "./hojas.js";

const { VXS } = crearMotorVIH({ libro: { pac: [] } }) as unknown as { VXS: Record<string, [string, string[]]> };

const invertir = (m: Record<string, string>) => Object.fromEntries(Object.entries(m).map(([k, v]) => [v, k]));
const ETNIA_COD = invertir(ETNIA_VIH);
const ZONA_COD = invertir(ZONA_VIH);
/** Etiqueta de VIH → código CAC en persona (un valor fuera de la tabla se guarda tal cual). */
const aCodigo = (m: Record<string, string>, v: unknown) => (v == null || v === "" ? v : (m[String(v)] ?? v));

export const CONFIG_VIH: ConfigLibro = {
  programa: "vih",
  nombre: "el programa VIH",
  hojas: Object.fromEntries(
    Object.entries(MODELOS_VIH).map(([k, m]) => [k, { modelo: m.modelo, columnas: VXS[k][1], clave: m.clave, nombre: VXS[k][0] } satisfies HojaDef]),
  ),
  // El prototipo lee el libro VIH todo como texto (vxParse): las columnas se guardan como texto para conservarlo idéntico.
  tipo: () => "texto",
  vacio: "", // vxParse devuelve "" para las celdas vacías
  paciente: {
    hoja: "pac",
    relacionPersona: "vihPaciente",
    camposPersona: CAMPOS_PERSONA_VIH,
    campoIngreso: "FechaIngresoIPS",
    aPersona: (r: Fila) => ({
      tipoDoc: r.TipoDoc, documento: r.Documento, primerNombre: r.PrimerNombre, segundoNombre: r.SegundoNombre,
      primerApellido: r.PrimerApellido, segundoApellido: r.SegundoApellido, fechaNacimiento: r.FechaNac, sexo: r.Sexo, eps: r.EPS,
      regimen: r.Regimen, fechaAfiliacion: r.FechaAfiliacion, municipio: r.Municipio, municipioDane: r.CodMunicipio,
      zona: aCodigo(ZONA_COD, r.Zona), direccion: r.Direccion, telefono: r.Telefono, etnia: aCodigo(ETNIA_COD, r.Etnia),
    }),
    desdePersona: (p, fecha) => ({
      TipoDoc: p.tipoDoc, Documento: p.documento, PrimerNombre: p.primerNombre || null, SegundoNombre: p.segundoNombre,
      PrimerApellido: p.primerApellido || null, SegundoApellido: p.segundoApellido, FechaNac: fecha(p.fechaNacimiento), Sexo: p.sexo,
      EPS: p.eps?.nombre ?? null, Regimen: p.regimen, FechaAfiliacion: fecha(p.fechaAfiliacion), Municipio: p.municipio,
      CodMunicipio: p.municipioDane, Zona: p.zona ? (ZONA_VIH[p.zona] ?? p.zona) : null, Direccion: p.direccion, Telefono: p.telefono,
      Etnia: p.etnia ? (ETNIA_VIH[p.etnia] ?? p.etnia) : null,
    }),
  },
};
