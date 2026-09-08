document.addEventListener("DOMContentLoaded",()=>{
  let deferredPrompt = null;

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(err => console.warn("Service Worker:", err));
  }

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredPrompt = event;
    const bar = document.getElementById("installAppBar");
    if (bar && !localStorage.getItem("vf_install_dismissed")) bar.hidden = false;
  });

  document.getElementById("installAppBtn")?.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    document.getElementById("installAppBar").hidden = true;
  });

  document.getElementById("dismissInstall")?.addEventListener("click", () => {
    localStorage.setItem("vf_install_dismissed", "1");
    document.getElementById("installAppBar").hidden = true;
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    document.getElementById("installAppBar")?.setAttribute("hidden", "");
  });

  document.querySelectorAll("[data-page-jump]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const page=btn.dataset.pageJump;
      if(typeof mostrarPagina==="function") mostrarPagina(page);
    });
  });
});
