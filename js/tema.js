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
  if(meta)meta.setAttribute("content",safeTheme==="light"?"#f4f5fb":"#0b1020");
  const button=document.getElementById("themeToggle");
  const icon=button?.querySelector(".theme-toggle-icon");
  if(icon)icon.textContent=safeTheme==="light"?"☀":"☾";
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
