(function(){
 const STORAGE_KEY="vf_ginasio_tema";
 const DEFAULT_THEME="dark";
 function readSavedTheme(){try{return localStorage.getItem(STORAGE_KEY)}catch(e){return null}}
 const initialTheme=readSavedTheme()||DEFAULT_THEME;
 document.documentElement.dataset.theme=initialTheme==="light"?"light":"dark";
 function applyTheme(theme){
  const safeTheme=theme==="light"?"light":"dark";
  document.body.dataset.theme=safeTheme;
  document.documentElement.dataset.theme=safeTheme;
  document.documentElement.style.colorScheme=safeTheme;
  const meta=document.querySelector('meta[name="theme-color"]');
  if(meta)meta.setAttribute("content",safeTheme==="light"?"#f7f2f0":"#17121f");
  const button=document.getElementById("themeToggle");
  const icon=button?.querySelector(".theme-toggle-icon");
  // SVG em vez de ☀/☾: o iOS desenha esses caracteres como emoji colorido.
  if(icon)icon.innerHTML=safeTheme==="light"
   ?'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/></svg>'
   :'<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/></svg>';
  if(button){
   const next=safeTheme==="light"?"escuro":"claro";
   button.setAttribute("aria-label",`Ativar tema ${next}`);
   button.setAttribute("title",`Tema ${next}`);
  }
 }
 function initTheme(){
  applyTheme(readSavedTheme()||DEFAULT_THEME);
  const button=document.getElementById("themeToggle");
  button?.addEventListener("click",()=>{
   const next=document.body.dataset.theme==="light"?"dark":"light";
   try{localStorage.setItem(STORAGE_KEY,next)}catch(e){console.warn("Tema localStorage:",e)}
   applyTheme(next);
  });
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initTheme,{once:true});
 else initTheme();
 window.aplicarTemaGinásio=applyTheme;
})();
