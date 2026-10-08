/* ================= eventos del portal ================= */
(function(){
const root=document.getElementById("px");
document.addEventListener("click",e=>{PX.last=Date.now();
  const li=e.target.closest("[data-lsi]");if(li){const i=li.dataset.lsi.split("|")[0];document.querySelectorAll('[data-lsi^="'+i+'|"]').forEach(b=>b.setAttribute("aria-pressed",String(b===li)));return;}
  const el=e.target.closest("[data-p]");if(!el)return;const[a,x,y,z,w]=el.dataset.p.split("|");
  switch(a){
   case"demo":pxDemo();break;
   case"newbook":pxDlgNewBook();break;
   case"unload":if(PX.dirty){toast("Hay cambios sin descargar en el libro institucional. Descárguelo antes de cambiar de libro.");PX.dirty=false;return;}PX.book=null;PX.demo=false;pxRender();break;
   case"pick":PX.ui.lu=x;pxRender();const p=document.getElementById("pxlp");if(p)p.focus();break;
   case"logout":pxLogout();break;
   case"calnew":pxDlgCal(null,x||PX.ui.cald);break;
   case"calcom":pxDlgCal(null,PX.ui.cald,x);break;
   case"caledit":closeDlg();pxDlgCal(x);break;
   case"calnav":{if(x==="0"){PX.ui.calm0=ym(TODAY());PX.ui.cald=pxToday();}else{PX.ui.calm0=ym(addMonths(pdate((PX.ui.calm0||ym(TODAY()))+"-01"),+x));PX.ui.cald="";}pxRender();break;}
   case"calv":PX.ui.calv=x;pxRender();break;
   case"cald":PX.ui.cald=x;PX.ui.calv="mes";pxRender();break;
   case"cev":pxDlgCalView(x,y);break;
   case"rsvp":pxCalRsvp(x,y);break;
   case"calst":pxCalSt(x,y);break;
   case"calexp":pxCalExp();break;
   case"back":try{if(history.state&&history.state.px){history.back();break;}}catch(err){}pxBack();break;
   case"bookexp":pxExportBook();break;
   case"go":if(x!=="panel"&&!pxCan(x)){toast("Su usuario no tiene acceso a ese programa.");return;}if(x==="msg")PX.ui.th=null;pxGo(x,y);break;
   case"hd":pxOpenHD(x);break;
   case"noacc":toast("Su cargo no tiene acceso a "+PROG[x].n+". Solicítelo al administrador.");break;
   case"compose":pxCompose({prog:x||""});break;
   case"th":pxOpenThread(x);break;
   case"reply":pxReply(x);break;
   case"mclose":{const r=PX.book.msg.find(m=>m.ID===x);pxUpd("msg",r,{Estado:"Cerrado",CerradoEn:pxNow()});pxRender();toast("Notificación cerrada.");break;}
   case"msub":PX.ui.sub=x;PX.ui.th=null;pxRender();break;
   case"msgexp":pxMsgExp();break;
   case"docedit":pxDlgDoc(x);break;
   case"docexp":pxDocExp();break;
   case"copy":{const t=el.dataset.p.slice(5);const done=()=>toast("Ruta copiada: péguela en el explorador de archivos.");try{navigator.clipboard.writeText(t).then(done,()=>toast("Copie la ruta: "+t));}catch(err){toast("Copie la ruta: "+t);}break;}
   case"cses":pxDlgSes(x,y);break;
   case"cf":PX.ui.cf=x;pxRender();break;
   case"cmpclose":{const c=PX.book.cmp.find(k=>k.ID===x);openDlg("Cerrar compromiso",'<p class="note">'+esc(c.Descripcion)+'</p><label class="f">Evidencia del cierre<input type="text" id="cc_ev"></label>',"Cerrar",()=>{const v=$("cc_ev").value.trim();if(v.length<4)return"Describa la evidencia.";pxUpd("cmp",c,{Estado:"Cerrado",FechaCierre:pxToday(),Evidencia:v});pxRender();toast("Compromiso cerrado.");});break;}
   case"comedit":pxDlgCom(x);break;
   case"sogexp":pxSogExp();break;
   case"spnew":pxDlgSP(null,x);break;
   case"spedit":pxDlgSP(x);break;
   case"spf":PX.ui.spf=x;pxRender();break;
   case"lst":if(!PX.user)return;pxDlgLst(x,y,z,w);break;
   case"prv":pxDlgPrv(x);break;
   case"prvnew":pxDlgPrv(null);break;
   case"ram":pxDlgRam(x);break;
   case"mannew":pxDlgMan(x);break;
   case"manan":{const m=PX.book.man.find(k=>k.ID===x);pxUpd("man",m,{Nota:"[ANULADO] "+m.Nota});pxRender();toast("Aporte anulado; queda en la bitácora.");break;}
   case"expm":pxExpMatriz(x);break;
   case"prodlock":pxProdLock("Valores de producción bloqueados.");pxRender();break;
   case"prodexp":pxProdExp();break;
   case"prodadd":pxProdAdd();break;
   case"prodan":pxProdAnular(x);break;
   case"prodtadd":pxProdRead();PRODF.data.tarifas.push({prog:PX.ui.prp||"nefro",act:"",cups:"",eps:"",valor:null,desde:pxToday()});pxProdArm();pxRender();break;
   case"prodtdel":pxProdRead();PRODF.data.tarifas.splice(+x,1);pxProdArm();pxRender();toast("Tarifa quitada. Guarde para que quede cifrada en el libro.");break;
   case"prodtsave":pxProdSave();break;
   case"prodclave":pxProdClave();break;
   case"prodcreate":pxProdCreate();break;
   case"sphd":if(!pxHD())return;dlgSP(null,x||null);break;
   case"sphdedit":dlgSP(x);break;
   case"rutaedit":pxDlgRuta();break;
   case"nefrocfg":pxDlgNefroCfg();break;
   case"rutareset":closeDlg();pxSetCfg("ruta_hd",RUTA_HD_DEF);pxSetCfg("ruta_hd_estado","Borrador por validar");pxLog("MODIFICA","cfg","ruta_hd","Restablecida al borrador original");pxRender();toast("Ruta restablecida al borrador original.");break;
   case"unew":pxDlgUser(null);break;
   case"uedit":pxDlgUser(x);break;
  }});
document.addEventListener("change",e=>{const t=e.target;
  if(t.id==="pxbookfile"){pxOnFile(t.files[0]);t.value="";return;}
  if(t.id==="pxmes"&&t.value){PX.mes=t.value;pxRender();return;}
  if(t.id==="pxcalt"){PX.ui.calt=t.value;pxRender();return;}
  if(t.id==="pxcalm"){PX.ui.calm=t.checked;pxRender();return;}
  if(t.id==="pxyear"){PX.ui.year=t.value;pxRender();return;}
  if(t.id==="pr_p"){PX.ui.prp=t.value;const dl=document.getElementById("pr_al");if(dl)dl.innerHTML=pxProdActs(t.value).map(a=>'<option value="'+esc(a)+'">').join("");return;}
  if(["pxdp","pxdt","pxde"].includes(t.id)){PX.ui.df=Object.assign(PX.ui.df||{},{[{pxdp:"p",pxdt:"t",pxde:"e"}[t.id]]:t.value});pxRender();}});
document.addEventListener("input",e=>{if(e.target.id==="pxdq"){PX.ui.df=Object.assign(PX.ui.df||{},{q:e.target.value});clearTimeout(PX.ui.dqt);PX.ui.dqt=setTimeout(()=>{pxRender();const q=$("pxdq");if(q){q.focus();q.setSelectionRange(q.value.length,q.value.length);}},300);}});
document.addEventListener("submit",e=>{if(e.target.id==="pxlf"){e.preventDefault();pxDoLogin();}if(e.target.id==="prodf"){e.preventDefault();pxProdUnlock();}});
document.addEventListener("keydown",()=>{PX.last=Date.now();if(PX.view==="prod"&&PRODF.key)pxProdArm();});
window.addEventListener("popstate",()=>{if(!PX.user)return;if(!$("dlg").hidden){closeDlg();return;}pxBack();});
setInterval(()=>{if(PX.user&&Date.now()-PX.last>15*60*1000)pxLogout("Sesión cerrada por 15 minutos de inactividad.");},30000);
window.addEventListener("beforeunload",e=>{if(PX.dirty){e.preventDefault();e.returnValue="";}});
/* el libro de hemodiálisis se abre dentro de Hemodiálisis: ocultamos la demo propia del módulo para no confundir con la del sistema */
window.PORTAL={VX,PX,pxRefresh,pxCfg,pxLab,pxProd,pxProdResumen,pxCompose,pxDocsFor,pxIAASCalc,pxPROACalc,pxSPCalc,pxExportBook,pxBuildWb,pxParse,pxGo,pxOpenHD};
pxRender();
})();
