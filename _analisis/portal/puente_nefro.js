/* ================= v0.3 · Nefroprotección: Ruta v7.2 integrada ================= */
/* La Ruta conserva su propio código y su libro (o su base de datos en el servidor). Va en un iframe para que sus variables globales
   y estilos no choquen con los del portal. Embebida (srcdoc) trabaja con libro Excel o datos ficticios; si el administrador
   configura la URL donde nginx publica la Ruta, el iframe la carga desde allí y la Ruta usa su base de datos (PostgREST en /api). */
function pxNefroURL(){return String(pxCfg("nefro_url","")||"").trim();}
function pxNefroFrame(){return document.getElementById("nefroframe");}
function pxNefroWin(){const f=pxNefroFrame();try{return f&&f.contentWindow;}catch(e){return null;}}
function pxNefroKPI(){const w=pxNefroWin();try{if(w&&w.MG&&w.MG.book){const n=w.MG.patients().length;return'<span><b>'+n+'</b> pacientes en la cohorte</span><span>'+(w.MG.dbMode?"base de datos":"libro")+'</span>';}}catch(e){}return'<span>Ruta v7.2 integrada</span>'+(pxNefroURL()?'<span>servidor configurado</span>':'');}
function pxNefroSrcdoc(){let h=NEFRO_HTML||"<p>Módulo no incluido en esta compilación.</p>";
  const inj='<script>try{if(!window.claude&&window.parent&&window.parent.claude)window.claude=window.parent.claude;}catch(e){}window.NEFRO_EMBED=true;'+(PX.demo?'window.NEFRO_DEMO=true;':'')+'<\/script>';
  const i=h.indexOf("<head>");return i>=0?h.slice(0,i+6)+inj+h.slice(i+6):inj+h;}
function pxOpenNefro(nb){if(!pxCan("nefro")){toast("Su usuario no tiene acceso a Nefroprotección.");return;}if(!nb&&PX.view!=="nefro")pxPush();if(PX.view==="prod")pxProdLock();
  PX.view="nefro";document.getElementById("pxmain").hidden=true;document.getElementById("hdapp").hidden=true;const box=document.getElementById("nefroapp");box.hidden=false;
  try{localStorage.setItem("nefro_usuario",PX.user.Nombre+" · "+PX.user.Cargo);}catch(e){}
  const url=pxNefroURL();
  if(!pxNefroFrame()||box.dataset.src!==(url||"embebido")){box.dataset.src=url||"embebido";
    box.innerHTML='<div class="wrap" style="padding-block:10px 0"><div class="copyrow" style="justify-content:space-between"><p class="note" style="margin:0">Ruta de Nefroprotección v7.2 · '+(url?'cargada desde el servidor ('+esc(url)+'): usa la base de datos del programa.':'embebida en el sistema: trabaja con el libro Excel'+(PX.demo?' y datos ficticios':'')+'; la base de datos solo funciona cuando la Ruta se abre desde el servidor.')+' Sus cambios sin descargar se pierden al salir del sistema.</p>'+(pxAdmin()?'<button type="button" class="btn sm" data-p="nefrocfg">Configurar servidor</button>':'')+'</div></div><iframe id="nefroframe" title="Ruta de Nefroprotección" style="display:block;width:100%;height:calc(100vh - 150px);min-height:620px;border:0;border-top:1px solid var(--line);background:#fff"></iframe>';
    const f=pxNefroFrame();if(url)f.src=url;else f.srcdoc=pxNefroSrcdoc();}
  pxBar();window.scrollTo(0,0);}
function pxNefroClose(){const box=document.getElementById("nefroapp");if(box){box.innerHTML="";box.hidden=true;delete box.dataset.src;}}
function pxDlgNefroCfg(){openDlg("Ruta de Nefroprotección en el servidor",'<p class="note">Dirección donde nginx publica la Ruta v7.2 (la que encuentra la base de datos en /api). Vacío = usar la copia embebida, que trabaja con libro Excel. Ejemplo de forma: https://servidor-interno/nefro/ (por confirmar con quien administra el servidor).</p><label class="f">URL<input type="text" id="nf_u" value="'+esc(pxNefroURL())+'" placeholder="https://…/"></label>',"Guardar",()=>{const u=$("nf_u").value.trim();if(u&&!/^https?:\/\//i.test(u)&&!/^\//.test(u))return"Escriba una URL que empiece por http(s):// o por /.";
  pxSetCfg("nefro_url",u);pxLog("MODIFICA","cfg","nefro_url",u||"embebida");pxBookInfo();pxNefroClose();pxOpenNefro(true);toast(u?"La Ruta se cargará desde el servidor. Descargue el libro institucional para conservar la configuración.":"La Ruta vuelve a la copia embebida.");});}
/* Ruta de Nefroprotección nefro_v7.2.html (generado por build.py) */
/* const NEFRO_HTML = ... (372 KB) → ver _analisis/nefroproteccion/ */
