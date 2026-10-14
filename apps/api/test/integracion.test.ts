/* Integraciones entre módulos revisadas en la auditoría (13 oct 2026). Datos ficticios mínimos, solo en la base temporal
   de esta prueba. */
import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "../src/db.js";
import { agente, crearUsuario, sembrarProgramas } from "./ayuda.js";
// @ts-expect-error utilidades de prueba del paquete de reglas (TypeScript sin compilar)
import { cargarPortal } from "../../../packages/clinical-rules/test/oraculo.ts";

type Agente = ReturnType<typeof agente>;
const CLAVE = "ClaveSegura2026";
let admin: Agente;
const u: Record<string, Agente> = {};

async function usuario(nombre: string, programa: string | null) {
  const x = await crearUsuario(nombre, CLAVE, "MEDICO");
  if (programa) await admin.put(`/api/v1/usuarios/${x.id}/permisos`, { permisos: [{ programa, ver: true, registrar: true, anular: false, exportar: false }] });
  u[nombre] = agente();
  await u[nombre].post("/api/v1/auth/login", { usuario: nombre, clave: CLAVE });
}

beforeAll(async () => {
  await sembrarProgramas();
  await crearUsuario("admin.int", CLAVE, "ADMIN");
  admin = agente();
  await admin.post("/api/v1/auth/login", { usuario: "admin.int", clave: CLAVE });
  await usuario("agenda.ce", "ce");
  await usuario("sin.programa", null);
});

describe("Consulta externa ↔ Nefroprotección: ocupación de los profesionales", () => {
  const manana = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
  beforeAll(async () => {
    const jornada = { id_jornada: "J-INT-1", fecha: manana, servicio: "NEFROLOGIA", profesional: "Dra. Ficticia Nefro", hora_inicio: "08:00", hora_fin: "12:00", estado: "ABIERTA", observaciones: "nota interna" };
    expect((await admin.post("/api/v1/nefro/agenda/sincronizar", { cambios: { Jornadas: { nuevos: [{ clave: "J-INT-1", datos: jornada }] } } })).status).toBe(200);
  });

  it("CE recibe solo la ocupación (sin datos de pacientes ni notas); sin CE ni Nefro no", async () => {
    const r = await u["agenda.ce"].get("/api/v1/nefro/agenda/ocupacion");
    expect(r.status).toBe(200);
    expect(r.body.jornadas).toEqual([{ fecha: manana, profesional: "Dra. Ficticia Nefro", hora_inicio: "08:00", hora_fin: "12:00", estado: "ABIERTA" }]);
    expect((await u["sin.programa"].get("/api/v1/nefro/agenda/ocupacion")).status).toBe(403);
    expect((await u["agenda.ce"].get("/api/v1/nefro/agenda")).status).toBe(403); // la agenda completa sigue siendo de Nefro
  });

  it("con esa ocupación, la apertura de agenda de CE detecta el cruce con Nefroprotección (ceAbrirJornadas)", async () => {
    const o = cargarPortal(new Date(2026, 9, 8));
    await o.ev("pxDemo()");
    o.ev(`PX.user = PX.book.usr.find(x => x.Rol === "Administrador"); ceDemo();`);
    const pr = o.ev<{ ID: string; Nombre: string; Especialidades: string }>(`CE.book.pro.find(p => p.Activo === "SI" && String(p.Especialidades).split(",").includes("NEFROLOGIA")) || CE.book.pro[0]`);
    const esp = String(pr.Especialidades).split(",")[0];
    const fecha = o.ev<string>(`(() => { let f = ceSumar(ceHoy(), 7); while ([0, 6].includes(pdate(f).getDay())) f = ceSumar(f, 1); return f; })()`);
    // Mismo formato que arma el adaptador del portal desde /nefro/agenda/ocupacion.
    o.ev(`globalThis.ceNefroJor = () => [{ fecha: pdate(${JSON.stringify(fecha)}), prof: ${JSON.stringify(pr.Nombre)}, hIni: "07:00", hFin: "12:00", estado: "ABIERTA" }];`);
    const r = o.ev<{ ok: boolean; conflictos?: string[] }>(`(() => { const mods = ceModsHab(${JSON.stringify(esp)}); const con = CE.book.con.find(c => c.Activo === "SI" && (mods[0] === "TELEMEDICINA" ? c.Tipo === "VIRTUAL" : c.Tipo === "FISICO"));
      return ceAbrirJornadas({ Profesional: ${JSON.stringify(pr.ID)}, Especialidad: ${JSON.stringify(esp)}, Modalidad: mods[0], Consultorio: con.ID, Desde: ${JSON.stringify(fecha)}, Hasta: ${JSON.stringify(fecha)}, HoraInicio: "08:00", HoraFin: "10:00", Duracion: 20, Dias: [1,2,3,4,5,6,7] }); })()`);
    expect(r.ok).toBe(false);
    expect((r.conflictos ?? []).join(" ")).toMatch(/Nefroprotección/);
  });
});

describe("maestro único de personas entre programas", () => {
  it("inscribir en Nefroprotección a una persona de Hemodiálisis no reescribe lo que HD registró", async () => {
    const hd = await admin.post("/api/v1/hd/sincronizar", { cambios: { pac: { nuevos: [{ ID: "P701", TipoDoc: "CC", Documento: "701000001", Nombres: "Rosa", Apellidos: "Ficticia", Sexo: "Femenino", Municipio: "MOCOA", Telefono: "3000000001" }] } } });
    expect(hd.status, JSON.stringify(hd.body)).toBe(200);
    const r = await admin.post("/api/v1/nefro/pg/rpc/guardar_paciente", {
      p: { paciente: { codigo: "NF-701", tipo_documento: "CC", documento: "701000001", nombre_completo: "ROSA FICTICIA", sexo: "F", eps: "Nueva EPS", municipio: "ORITO", telefono_1: "3999999999", fecha_ingreso: "2026-10-01", estado: "ACTIVO" } },
    });
    expect(r.status, JSON.stringify(r.body)).toBe(200);
    const per = await prisma.persona.findFirst({ where: { documento: "701000001" }, include: { hdPaciente: true, nefroPaciente: true } });
    expect(per).toMatchObject({ municipio: "MOCOA", telefono: "3000000001", sexo: "Femenino" });
    expect(per?.hdPaciente?.ID).toBe("P701");
    expect(per?.nefroPaciente?.codigo).toBe("NF-701");
    expect(per?.epsId).not.toBeNull(); // lo que faltaba (la EPS) sí se completa
  });
});
