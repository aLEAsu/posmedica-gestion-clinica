/* Minimización de datos de los módulos transversales (auditoría H2): quien no tiene el programa recibe solo las hojas de
   HD, VIH y DP que su módulo usa. Se verifica (1) con el prototipo, que todas las vistas de cada módulo transversal se
   dibujan IDÉNTICAS con esas hojas que con el libro completo, y (2) con la API, que las demás hojas no se entregan. */
import { beforeAll, describe, expect, it } from "vitest";
import { HOJAS_TRANSVERSALES } from "../src/modulos/libro/transversal.js";
import { agente, crearUsuario, sembrarProgramas } from "./ayuda.js";
// @ts-expect-error utilidades de prueba del paquete de reglas (TypeScript sin compilar)
import { cargarPortal } from "../../../packages/clinical-rules/test/oraculo.ts";

const SUBVISTAS: Record<string, string[]> = {
  lab: ["sol", "vih", "dp", "res", "mic", "pend"],
  prod: ["res", "reg", "tar", "hd"],
  sp: ["tab", "rep", "hm", "lst"],
  iaas: ["dir", "proc", "plan", "vig", "com", "mej", "doc", "ind"],
  proa: ["dir", "proc", "plan", "vig", "com", "mej", "doc", "ind"],
};

describe("las vistas transversales no cambian con las hojas mínimas", () => {
  const o = cargarPortal(new Date(2026, 9, 8));
  beforeAll(async () => {
    await o.ev("pxDemo()");
    o.ev(`PX.user = PX.book.usr.find(x => x.Rol === "Administrador"); globalThis.__orig = { hd: ST.book, vih: VX.book, dp: DP.book };`);
  });
  const dibujar = (t: string) =>
    o.ev<string>(`(() => { const vista = { lab: pxLab, prod: pxProd, sp: pxSP, iaas: pxIAAS, proa: pxPROA }[${JSON.stringify(t)}]; PX.view = ${JSON.stringify(t)};
      return ${JSON.stringify(SUBVISTAS[t])}.map(s => { PX.ui = { sub: s }; try { TRM.c = {}; } catch (e) {} try { return s + ":" + vista(); } catch (e) { return s + ": EXC " + e.message; } }).join("\\n"); })()`);
  const poner = (t: string | null) =>
    o.ev(`(() => { const H = ${JSON.stringify(HOJAS_TRANSVERSALES)}, t = ${JSON.stringify(t)};
      const solo = (b, prog) => { if (!t) return b; const ok = (H[prog] || {})[t] || []; const n = Object.assign({}, b); for (const k of Object.keys(n)) if (Array.isArray(n[k]) && !ok.includes(k) && k !== "log" && !(k === "cfg" && prog !== "dp")) n[k] = []; return n; };
      ST.book = solo(__orig.hd, "hd"); IDX.dirty = true; VX.book = solo(__orig.vih, "vih"); VX.memo = {}; DP.book = solo(__orig.dp, "dp"); })()`);
  for (const t of Object.keys(SUBVISTAS)) {
    it(t, () => {
      poner(null);
      const completo = dibujar(t);
      poner(t);
      const minimo = dibujar(t);
      poner(null);
      expect(minimo.length).toBeGreaterThan(1000);
      expect(minimo).toBe(completo);
    });
  }
});

describe("la API entrega solo las hojas mínimas", () => {
  it("Laboratorio recibe su fila de RolesDP (el módulo DP la usa para saber qué puede registrar)", async () => {
    expect((await admin.post("/api/v1/dp/sincronizar", { cambios: { rol: { nuevos: [{ Usuario: "lab.tr", Rol: "lab", Activo: "SI" }] } } })).status).toBe(200);
    const h = (await u["lab.tr"].get("/api/v1/dp/libro")).body.hojas;
    expect(h.rol.map((r: { Usuario: string }) => r.Usuario)).toContain("lab.tr");
    expect(h.val).toHaveLength(0);
  });
  const CLAVE = "ClaveSegura2026";
  let admin: ReturnType<typeof agente>;
  const u: Record<string, ReturnType<typeof agente>> = {};
  beforeAll(async () => {
    await sembrarProgramas();
    await crearUsuario("admin.tr", CLAVE, "ADMIN");
    admin = agente();
    await admin.post("/api/v1/auth/login", { usuario: "admin.tr", clave: CLAVE });
    for (const [nombre, programa] of [["prod.tr", "prod"], ["sp.tr", "sp"], ["vih.tr", "vih"], ["lab.tr", "lab"]]) {
      const x = await crearUsuario(nombre, CLAVE, "MEDICO");
      await admin.put(`/api/v1/usuarios/${x.id}/permisos`, { permisos: [{ programa, ver: true, registrar: false, anular: false, exportar: false }] });
      u[nombre] = agente();
      await u[nombre].post("/api/v1/auth/login", { usuario: nombre, clave: CLAVE });
    }
    // Registros ficticios mínimos en VIH (solo en esta base temporal de pruebas).
    const r = await admin.post("/api/v1/vih/sincronizar", {
      cambios: {
        pac: { nuevos: [{ ID: "V9001", TipoDoc: "CC", Documento: "990000001", PrimerNombre: "Ficticio", PrimerApellido: "Prueba", Sexo: "F" }] },
        tar: { nuevos: [{ ID: "T9001", Paciente: "V9001", Inicio: "2026-01-01" }] },
        cit: { nuevos: [{ ID: "C9001", Paciente: "V9001", Fecha: "2026-10-01" }] },
      },
    });
    expect(r.status, JSON.stringify(r.body)).toBe(200);
  });

  it("Producción recibe citas de VIH pero no su TAR", async () => {
    const h = (await u["prod.tr"].get("/api/v1/vih/libro")).body.hojas;
    expect(h.cit).toHaveLength(1);
    expect(h.tar).toHaveLength(0);
  });
  it("Seguridad del paciente no recibe nada del libro VIH", async () => {
    const h = (await u["sp.tr"].get("/api/v1/vih/libro")).body.hojas as Record<string, unknown[]>;
    expect(Object.values(h).every((L) => L.length === 0)).toBe(true);
  });
  it("quien tiene el programa VIH recibe todo; el sexo vuelve con el código de VIH", async () => {
    const h = (await u["vih.tr"].get("/api/v1/vih/libro")).body.hojas;
    expect(h.tar).toHaveLength(1);
    expect(h.pac[0].Sexo).toBe("F");
  });
});
