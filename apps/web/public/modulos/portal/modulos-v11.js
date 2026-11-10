// Código propio del proyecto. Módulos independientes v1.1 dentro del portal (punto de partida: prototipo v3.2).

/* =====================================================================================================
   v2.2 · 26-oct-2026 · MÓDULOS INDEPENDIENTES INTEGRADOS
   1. Diálisis peritoneal v1.1 reemplaza el módulo DP nativo (v0.8) en la navegación: la tarjeta del panel,
      «Atrás», los ejes y los enlaces de IAAS/PROA que llamaban pxGo("dp") abren ahora la v1.1.
      El código nativo de DP sigue en el archivo pero sin pantalla: IAAS-09, PROA-DP, la solicitud de laboratorio
      de DP y el tablero gerencial solo lo leen si existe un libro DP nativo (hoy solo en la demostración).
   2. Contratos y tecnologías v1.1 (buscador por programa y EPS, con CUPS cuando existe, sin precios), en Gestión.
   Igual que la Ruta de Nefroprotección: cada módulo va en su propio iframe para que sus variables y estilos no choquen con
   los del portal. En la aplicación web cada uno es una página propia (/modulos/dp11/) y guarda en el servidor.
   ===================================================================================================== */
const V22={ver:"2.2",fecha:"2026-10-26",
  apps:{
    dp:{t:"Diálisis peritoneal · v1.1"} /* página propia: /modulos/dp11/ (fase D). Contratos y tecnologías: fase E */
  }
};

/* ---------- 1. Catálogo de programas ---------- */
if(PROG.dp){
  PROG.dp.d="v1.1: censo, habilitación, contratación, gestión clínica, Kt/V, laboratorios, farmacia simplificada, peritonitis y eventos, indicadores CAC 2026 con filtro por EPS y nota técnica.";
  delete PROG.dp.nx;
}
const pxKPI22=pxKPI;
pxKPI=function(k){
  if(k==="dp")return'<span>v1.1</span><span class="sd">registros en el servidor</span>';
  return pxKPI22(k);
};

/* ---------- 2. Contenedor e iframes ---------- */
function v22Box(){return document.getElementById("extapp");}
function v22Frame(k){return document.getElementById("extframe-"+k);}
function v22Theme(){return V10.theme==="light"?"light":"dark";}
function v22Sync(k){
  const f=v22Frame(k);if(!f)return;
  try{
    const w=f.contentWindow;
    if(w&&typeof w.setTheme==="function")w.setTheme(v22Theme());
    const u=w&&w.document.getElementById("usuario");
    if(u&&!u.value&&PX.user){u.value=PX.user.Nombre+" · "+PX.user.Cargo;}
  }catch(e){}
}
function v22Fit(){
  const box=v22Box();if(!box||box.hidden)return;
  const top=Math.max(0,box.getBoundingClientRect().top+window.scrollY);
  box.querySelectorAll("iframe").forEach(f=>{f.style.height=Math.max(620,window.innerHeight-top)+"px";});
}
window.addEventListener("resize",v22Fit);
function v22Ensure(k){
  const box=v22Box();
  let f=v22Frame(k);
  if(!f){
    /* el módulo nace con el tema del portal */
    try{localStorage.setItem("dp_theme",v22Theme());}catch(e){}
    f=document.createElement("iframe");
    f.id="extframe-"+k;f.title=V22.apps[k].t;
    f.style.cssText="display:block;width:100%;border:0;background:var(--bg)";
    f.addEventListener("load",()=>v22Sync(k));
    f.src="../"+k+"11/index.html"; /* página publicada aparte (la CSP no admite el documento en línea) */
    box.appendChild(f);
  }
  box.querySelectorAll("iframe").forEach(x=>{x.hidden=(x!==f);});
  v22Sync(k);v22Fit();
}

/* ---------- 3. Navegación ---------- */
const pxRender22=pxRender;
pxRender=function(){
  const box=v22Box();
  if(PX.user&&V22.apps[PX.view]){
    if(!pxCan(PX.view)){toast("Su usuario no tiene acceso a "+PROG[PX.view].n+".");PX.view="panel";PX.ui.sub=null;if(box)box.hidden=true;document.getElementById("pxmain").hidden=false;pxRender22();return;}
    pxBar();
    document.getElementById("pxmain").hidden=true;
    document.getElementById("hdapp").hidden=true;
    document.getElementById("nefroapp").hidden=true;
    box.hidden=false;
    v22Ensure(PX.view);
    return;
  }
  if(box&&!box.hidden){
    box.hidden=true;
    if(PX.view!=="hd"&&PX.view!=="nefro")document.getElementById("pxmain").hidden=false;
  }
  pxRender22();
};
const pxOpenHD22=pxOpenHD;
pxOpenHD=function(view,nb){const b=v22Box();if(b)b.hidden=true;return pxOpenHD22(view,nb);};
const pxOpenNefro22=pxOpenNefro;
pxOpenNefro=function(nb){const b=v22Box();if(b)b.hidden=true;return pxOpenNefro22(nb);};

/* Los ejes del programa DP (V12/V10) llevaban a pestañas del módulo nativo: ahora abren la v1.1 */
const v11NavigateAxis22=v11NavigateAxis;
v11NavigateAxis=function(prog,ax,subKey){if(prog==="dp"&&(!window.V30||window.V30.dpMode!=="axes")){pxGo("dp",null);return;}return v11NavigateAxis22(prog,ax,subKey);};

/* ---------- 4. Tema ---------- */
const v11ToggleTheme22=v11ToggleTheme;
v11ToggleTheme=function(){v11ToggleTheme22();Object.keys(V22.apps).forEach(v22Sync);};

pxBar();pxRender();


