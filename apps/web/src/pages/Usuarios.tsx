import { useCallback, useEffect, useState } from "react";
import { ACCIONES, GRUPOS, PROGRAMAS, ROLES, type Accion, type PermisoPrograma, type Rol } from "@posmedica/shared";
import { api, ErrorApi } from "../api";
import { useAviso } from "../components/Aviso";
import { Dialogo } from "../components/Dialogo";
import { useSesion } from "../sesion";

interface UsuarioFila {
  id: string;
  usuario: string;
  nombre: string;
  cargo: string;
  area: string | null;
  email: string | null;
  rol: Rol;
  activo: boolean;
  debeCambiarClave: boolean;
  bloqueadoHasta: string | null;
  ultimoIngreso: string | null;
  permisos: { programaClave: string; ver: boolean; registrar: boolean; anular: boolean; exportar: boolean }[];
}

/* Programas con permisos asignables: los de acceso abierto (mensajes, documentos, calendario) no se asignan. */
const ASIGNABLES = PROGRAMAS.filter((p) => !p.abierto);
const fh = (s: string | null) => (s ? new Date(s).toLocaleString("es-CO", { timeZone: "America/Bogota", dateStyle: "short", timeStyle: "short" }) : "—");
const msgError = (e: unknown) => (e instanceof ErrorApi ? (e.campos?.length ? e.campos.map((c) => c.mensaje).join(" ") : e.message) : "No se pudo completar la acción.");

type Dlg = { tipo: "nuevo" } | { tipo: "editar"; u: UsuarioFila } | { tipo: "permisos"; u: UsuarioFila } | { tipo: "clave"; u: UsuarioFila; clave?: string } | { tipo: "creado"; u: UsuarioFila; clave?: string };

export function Usuarios() {
  const { usuario: yo } = useSesion();
  const aviso = useAviso();
  const [lista, setLista] = useState<UsuarioFila[] | null>(null);
  const [dlg, setDlg] = useState<Dlg | null>(null);
  const [error, setError] = useState("");

  const cargar = useCallback(() => {
    api.get<{ usuarios: UsuarioFila[] }>("/usuarios").then((r) => setLista(r.usuarios)).catch((e) => setError(msgError(e)));
  }, []);
  useEffect(cargar, [cargar]);

  async function desbloquear(u: UsuarioFila) {
    try {
      await api.post(`/usuarios/${u.id}/desbloquear`);
      aviso(`Usuario ${u.usuario} desbloqueado.`);
      cargar();
    } catch (e) {
      aviso(msgError(e));
    }
  }

  if (error) return <div className="wrap pxwrap"><div className="alert bad"><p>{error}</p></div></div>;
  if (!lista) return <div className="cargando">Cargando usuarios…</div>;

  return (
    <div className="wrap pxwrap" style={{ display: "grid", gap: 14 }}>
      <div className="mhead">
        <div>
          <h2 className="mt">Usuarios</h2>
          <p className="note" style={{ margin: "3px 0 0" }}>
            El administrador ve todo, incluida la facturación. Los usuarios médicos solo ven los programas y acciones que se les asignen, y nunca la facturación.
          </p>
        </div>
        <div className="copyrow">
          <button type="button" className="btn primary" onClick={() => setDlg({ tipo: "nuevo" })}>
            Nuevo usuario
          </button>
        </div>
      </div>

      <div className="panel tablebox" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Nombre y cargo</th>
              <th>Rol</th>
              <th>Programas</th>
              <th>Estado</th>
              <th>Último ingreso</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {lista.map((u) => {
              const bloqueado = u.bloqueadoHasta && new Date(u.bloqueadoHasta) > new Date();
              return (
                <tr key={u.id} className={u.activo ? "" : "anul"}>
                  <td className="mono">{u.usuario}</td>
                  <td>
                    <strong>{u.nombre}</strong>
                    <span className="sub">{[u.cargo, u.area].filter(Boolean).join(" · ")}</span>
                  </td>
                  <td>{ROLES[u.rol]}</td>
                  <td style={{ fontSize: 13, maxWidth: 280 }}>
                    {u.rol === "ADMIN" ? "Todos" : u.permisos.length ? u.permisos.map((p) => ASIGNABLES.find((x) => x.clave === p.programaClave)?.nombre ?? p.programaClave).join(", ") : <span className="sd">sin programas</span>}
                  </td>
                  <td>
                    <span className={"st " + (u.activo ? (bloqueado ? "bad" : "ok") : "base")}>{u.activo ? (bloqueado ? "Bloqueado" : "Activo") : "Inactivo"}</span>
                    {u.debeCambiarClave && <span className="sub">clave temporal</span>}
                  </td>
                  <td className="mono" style={{ fontSize: 12.5 }}>{fh(u.ultimoIngreso)}</td>
                  <td>
                    <div className="copyrow" style={{ flexWrap: "wrap" }}>
                      <button type="button" className="btn sm" onClick={() => setDlg({ tipo: "editar", u })}>Editar</button>
                      {u.rol === "MEDICO" && <button type="button" className="btn sm" onClick={() => setDlg({ tipo: "permisos", u })}>Programas y permisos</button>}
                      <button type="button" className="btn sm" onClick={() => setDlg({ tipo: "clave", u })}>Restablecer clave</button>
                      {bloqueado && <button type="button" className="btn sm warn" onClick={() => desbloquear(u)}>Desbloquear</button>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {dlg?.tipo === "nuevo" && (
        <DlgDatos
          onCerrar={() => setDlg(null)}
          onGuardar={async (d) => {
            const r = await api.post<{ usuario: UsuarioFila; claveTemporal?: string }>("/usuarios", d);
            cargar();
            setDlg({ tipo: "creado", u: r.usuario, clave: r.claveTemporal });
          }}
        />
      )}
      {dlg?.tipo === "editar" && (
        <DlgDatos
          u={dlg.u}
          esYo={dlg.u.id === yo?.id}
          onCerrar={() => setDlg(null)}
          onGuardar={async (d) => {
            await api.patch(`/usuarios/${dlg.u.id}`, d);
            aviso("Usuario actualizado.");
            cargar();
            setDlg(null);
          }}
        />
      )}
      {dlg?.tipo === "creado" && (
        <Dialogo titulo={`Usuario ${dlg.u.usuario} creado`} soloCerrar onCerrar={() => setDlg(null)}>
          <ClaveTemporal clave={dlg.clave} />
          {dlg.u.rol === "MEDICO" && (
            <p className="note">
              Ahora asígnele sus programas y permisos con <b>Programas y permisos</b>. Mientras no tenga programas asignados, solo verá Mensajes, Documentos y Calendario.
            </p>
          )}
        </Dialogo>
      )}
      {dlg?.tipo === "permisos" && <DlgPermisos u={dlg.u} onCerrar={() => setDlg(null)} onGuardado={() => { aviso("Permisos actualizados."); cargar(); }} />}
      {dlg?.tipo === "clave" &&
        (dlg.clave ? (
          <Dialogo titulo={`Clave temporal de ${dlg.u.usuario}`} soloCerrar onCerrar={() => setDlg(null)}>
            <ClaveTemporal clave={dlg.clave} />
          </Dialogo>
        ) : (
          <Dialogo
            titulo={`Restablecer la clave de ${dlg.u.usuario}`}
            textoAceptar="Restablecer"
            onCerrar={() => setDlg(null)}
            onAceptar={async () => {
              try {
                const r = await api.post<{ claveTemporal: string }>(`/usuarios/${dlg.u.id}/restablecer-clave`);
                setDlg({ tipo: "clave", u: dlg.u, clave: r.claveTemporal });
                cargar();
                return null;
              } catch (e) {
                return msgError(e);
              }
            }}
          >
            <p className="note">Se genera una clave temporal, se cierran las sesiones abiertas del usuario y se le pedirá cambiarla al ingresar. También lo desbloquea.</p>
          </Dialogo>
        ))}
    </div>
  );
}

function ClaveTemporal({ clave }: { clave?: string }) {
  if (!clave) return <p className="note">Se usó la clave inicial que usted escribió. El usuario deberá cambiarla en su primer ingreso.</p>;
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <p className="note">Entréguela al usuario por un medio seguro. <b>Solo se muestra esta vez</b>; el usuario deberá cambiarla en su primer ingreso.</p>
      <span className="clave-temp">{clave}</span>
    </div>
  );
}

function DlgDatos(props: { u?: UsuarioFila; esYo?: boolean; onCerrar: () => void; onGuardar: (d: Record<string, unknown>) => Promise<void> }) {
  const u = props.u;
  const [d, setD] = useState({ usuario: u?.usuario ?? "", nombre: u?.nombre ?? "", cargo: u?.cargo ?? "", area: u?.area ?? "", email: u?.email ?? "", rol: (u?.rol ?? "MEDICO") as Rol, activo: u?.activo ?? true });
  const set = (k: keyof typeof d) => (e: { target: { value: string } }) => setD({ ...d, [k]: e.target.value });

  return (
    <Dialogo
      titulo={u ? `Editar usuario ${u.usuario}` : "Nuevo usuario"}
      onCerrar={props.onCerrar}
      onAceptar={async () => {
        try {
          const { usuario, activo, ...resto } = d;
          await props.onGuardar(u ? { ...resto, activo } : { usuario, ...resto });
          return null; // el padre decide qué mostrar después (cerrar o la clave temporal)
        } catch (e) {
          return msgError(e);
        }
      }}
    >
      <div className="form">
        {!u && (
          <label className="f">
            Usuario (para ingresar)
            <input type="text" value={d.usuario} onChange={set("usuario")} autoCapitalize="none" spellCheck={false} placeholder="p. ej. lbenavides" />
          </label>
        )}
        <label className="f">Nombre completo<input type="text" value={d.nombre} onChange={set("nombre")} /></label>
        <label className="f">Cargo<input type="text" value={d.cargo} onChange={set("cargo")} placeholder="p. ej. Médica nefróloga" /></label>
        <label className="f">Área<input type="text" value={d.area} onChange={set("area")} /></label>
        <label className="f">Correo (opcional)<input type="email" value={d.email} onChange={set("email")} /></label>
        <label className="f">
          Rol
          <select value={d.rol} onChange={set("rol")} disabled={props.esYo}>
            {(Object.keys(ROLES) as Rol[]).map((r) => <option key={r} value={r}>{ROLES[r]}</option>)}
          </select>
        </label>
        {u && (
          <label className="f">
            Estado
            <select value={d.activo ? "SI" : "NO"} onChange={(e) => setD({ ...d, activo: e.target.value === "SI" })} disabled={props.esYo}>
              <option value="SI">Activo</option>
              <option value="NO">Inactivo (no puede ingresar)</option>
            </select>
          </label>
        )}
      </div>
      {!u && <p className="note">Se genera una clave temporal que verá al guardar.</p>}
      {props.esYo && <p className="note">No puede quitarse a sí mismo el rol de administrador ni desactivarse.</p>}
    </Dialogo>
  );
}

function DlgPermisos(props: { u: UsuarioFila; onCerrar: () => void; onGuardado: () => void }) {
  const inicial: Record<string, PermisoPrograma> = {};
  for (const p of ASIGNABLES) {
    const x = props.u.permisos.find((y) => y.programaClave === p.clave);
    inicial[p.clave] = { programa: p.clave, ver: !!x?.ver, registrar: !!x?.registrar, anular: !!x?.anular, exportar: !!x?.exportar };
  }
  const [perm, setPerm] = useState(inicial);

  function cambiar(prog: string, acc: Accion, v: boolean) {
    const p = { ...perm[prog], [acc]: v };
    if (acc === "ver" && !v) Object.assign(p, { registrar: false, anular: false, exportar: false });
    if (acc !== "ver" && v) p.ver = true;
    setPerm({ ...perm, [prog]: p });
  }

  return (
    <Dialogo
      titulo={`Programas y permisos de ${props.u.nombre}`}
      onCerrar={props.onCerrar}
      onAceptar={async () => {
        try {
          await api.put(`/usuarios/${props.u.id}/permisos`, { permisos: Object.values(perm) });
          props.onGuardado();
        } catch (e) {
          return msgError(e);
        }
      }}
    >
      <p className="note">
        Marque «Ver» para dar acceso al programa. Mensajes, Documentos y Calendario están abiertos para todos. En Producción asistencial el médico ve atenciones, nunca tarifas ni valores.
      </p>
      <div className="tablebox" style={{ maxHeight: "55vh" }}>
        <table className="permtab">
          <thead>
            <tr>
              <th>Programa</th>
              {ACCIONES.map((a) => <th key={a.clave} title={a.ayuda}>{a.etiqueta}</th>)}
            </tr>
          </thead>
          <tbody>
            {(Object.keys(GRUPOS) as (keyof typeof GRUPOS)[]).flatMap((g) => [
              <tr key={g}><td colSpan={5} style={{ background: "var(--surface-2)", fontWeight: 700, fontSize: 12.5 }}>{GRUPOS[g]}</td></tr>,
              ...ASIGNABLES.filter((p) => p.grupo === g).map((p) => (
                <tr key={p.clave}>
                  <td>{p.nombre}{p.fase == null && <span className="sub">sin módulo aún</span>}</td>
                  {ACCIONES.map((a) => (
                    <td key={a.clave}>
                      <input type="checkbox" aria-label={`${a.etiqueta} en ${p.nombre}`} checked={perm[p.clave][a.clave]} onChange={(e) => cambiar(p.clave, a.clave, e.target.checked)} />
                    </td>
                  ))}
                </tr>
              )),
            ])}
          </tbody>
        </table>
      </div>
    </Dialogo>
  );
}
