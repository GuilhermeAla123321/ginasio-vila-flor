/* =========================================================
   JANELAS DA APLICAÇÃO
   Substituem prompt(), confirm() e alert() do navegador por janelas com o estilo da app.
   - await window.pedirTextoApp({ titulo, valor })      → texto ou null
   - await window.confirmarApp({ titulo, mensagem })    → true / false
   - await window.avisoApp("Mensagem")                  → quando o utilizador fecha
   ========================================================= */
(() => {
    // Base comum: monta a janela, gere foco, teclado e fecho, e resolve com o resultado.
    function abrirJanela({ eyebrow = "", titulo = "", mensagem = "", campo = null, botoes, perigo = false, valorCancelar = null }) {
        return new Promise(resolve => {
            const anterior = document.activeElement;
            const overlay = document.createElement("div");
            overlay.className = "vf-dialog-overlay";
            const tipoDialogo = campo || botoes.length > 1 ? "dialog" : "alertdialog";
            overlay.innerHTML = `
                <form class="vf-dialog${perigo ? " is-danger" : ""}" role="${tipoDialogo}" aria-modal="true" aria-labelledby="vfDialogTitle" novalidate>
                    ${eyebrow ? `<span class="vf-dialog-eyebrow"></span>` : ""}
                    <h2 id="vfDialogTitle" class="vf-dialog-title"></h2>
                    ${mensagem ? `<p id="vfDialogMessage" class="vf-dialog-message"></p>` : ""}
                    ${campo ? `<input id="vfDialogInput" class="vf-dialog-input" type="text" autocomplete="off" maxlength="${Number(campo.maxLength) || 60}">` : ""}
                    <div class="vf-dialog-actions${botoes.length === 1 ? " is-single" : ""}"></div>
                </form>
            `;
            // textContent evita interpretar nomes do utilizador como HTML.
            if (eyebrow) overlay.querySelector(".vf-dialog-eyebrow").textContent = eyebrow;
            overlay.querySelector(".vf-dialog-title").textContent = titulo;
            if (mensagem) {
                overlay.querySelector(".vf-dialog-message").textContent = mensagem;
                overlay.querySelector("form").setAttribute("aria-describedby", "vfDialogMessage");
            }

            const input = overlay.querySelector(".vf-dialog-input");
            if (input) {
                input.value = campo.valor || "";
                input.setAttribute("aria-label", titulo);
            }

            const acoes = overlay.querySelector(".vf-dialog-actions");
            const elementos = botoes.map(b => {
                const el = document.createElement("button");
                el.type = b.principal ? "submit" : "button";
                el.className = b.principal ? "vf-dialog-confirm" : "vf-dialog-cancel";
                el.textContent = b.texto;
                if (!b.principal) el.addEventListener("click", () => fechar(b.valor));
                acoes.appendChild(el);
                return el;
            });
            const principal = elementos[botoes.findIndex(b => b.principal)];

            const atualizarEstado = () => { if (input && principal) principal.disabled = !input.value.trim(); };
            atualizarEstado();
            input?.addEventListener("input", atualizarEstado);

            let terminado = false;
            const fechar = resultado => {
                if (terminado) return;
                terminado = true;
                document.removeEventListener("keydown", teclado, true);
                overlay.classList.remove("open");
                window.setTimeout(() => overlay.remove(), 160);
                if (anterior?.isConnected) anterior.focus({ preventScroll: true });
                resolve(resultado);
            };

            const teclado = event => {
                if (event.key === "Escape") {
                    event.preventDefault();
                    event.stopPropagation();
                    fechar(valorCancelar);
                } else if (event.key === "Tab") {
                    const focaveis = [...overlay.querySelectorAll("input, button:not([disabled])")];
                    const primeiro = focaveis[0], ultimo = focaveis[focaveis.length - 1];
                    if (event.shiftKey && document.activeElement === primeiro) { event.preventDefault(); ultimo.focus(); }
                    else if (!event.shiftKey && document.activeElement === ultimo) { event.preventDefault(); primeiro.focus(); }
                }
            };
            document.addEventListener("keydown", teclado, true);

            overlay.querySelector("form").addEventListener("submit", event => {
                event.preventDefault();
                const b = botoes.find(x => x.principal);
                if (input) {
                    const texto = input.value.trim();
                    if (texto) fechar(texto);
                } else if (b) {
                    fechar(b.valor);
                }
            });
            overlay.addEventListener("click", event => { if (event.target === overlay) fechar(valorCancelar); });

            document.body.appendChild(overlay);
            requestAnimationFrame(() => overlay.classList.add("open"));
            if (input) {
                input.focus({ preventScroll: true });
                input.select();
            } else {
                // Numa ação destrutiva o foco começa em Cancelar, para Enter não apagar por engano.
                (perigo ? elementos.find(el => el !== principal) : principal || elementos[0])?.focus({ preventScroll: true });
            }
        });
    }

    window.pedirTextoApp = ({ eyebrow = "", titulo, valor = "", maxLength = 60, confirmar = "Guardar", cancelar = "Cancelar" } = {}) =>
        abrirJanela({
            eyebrow, titulo,
            campo: { valor, maxLength },
            botoes: [{ texto: cancelar, valor: null }, { texto: confirmar, principal: true }]
        });

    window.confirmarApp = ({ eyebrow = "", titulo, mensagem = "", confirmar = "Confirmar", cancelar = "Cancelar", perigo = false } = {}) =>
        abrirJanela({
            eyebrow, titulo, mensagem, perigo, valorCancelar: false,
            botoes: [{ texto: cancelar, valor: false }, { texto: confirmar, valor: true, principal: true }]
        });

    window.avisoApp = (mensagem, { titulo = "Atenção", botao = "OK" } = {}) =>
        abrirJanela({
            titulo, mensagem, valorCancelar: undefined,
            botoes: [{ texto: botao, valor: undefined, principal: true }]
        });
})();

/* A página por trás não se mexe enquanto houver uma janela aberta.
   overflow:hidden chega na maioria dos browsers; o iPhone precisa também de travar o arrasto. */
(() => {
    const JANELAS = ".exercise-editor-overlay.open, .progress-overlay.open, .exercise-modal-overlay.open, .exercise-picker-overlay, .custom-exercise-overlay, .vf-dialog-overlay, .exercise-media-zoom-overlay, .equipment-3d-overlay.is-open, .vf-select-menu";
    const raiz = document.documentElement;
    const aviso = document.querySelector(".portrait-lock-screen");
    const sincronizar = () => raiz.classList.toggle("vf-janela-aberta", Boolean(document.querySelector(JANELAS)) ||
        (aviso && getComputedStyle(aviso).display !== "none"));
    new MutationObserver(sincronizar).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    window.addEventListener("resize", sincronizar);
    sincronizar();

    let inicioX = 0, inicioY = 0;
    document.addEventListener("touchstart", event => {
        inicioX = event.touches[0].clientX;
        inicioY = event.touches[0].clientY;
    }, { passive: true });
    document.addEventListener("touchmove", event => {
        if (!raiz.classList.contains("vf-janela-aberta") || event.touches.length > 1) return;
        const alvo = event.target instanceof Element ? event.target : null;
        // O zoom da demonstração e o modelo 3D têm gestos próprios.
        if (alvo?.closest("#exerciseMediaZoomOverlay, canvas")) return;
        const dx = event.touches[0].clientX - inicioX, dy = event.touches[0].clientY - inicioY;
        if (Math.abs(dx) > Math.abs(dy)) return;
        for (let el = alvo; el && el !== document.body; el = el.parentElement) {
            if (!/(auto|scroll)/.test(getComputedStyle(el).overflowY) || el.scrollHeight <= el.clientHeight) continue;
            const noTopo = el.scrollTop <= 0, noFim = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
            if (!(dy > 0 && noTopo) && !(dy < 0 && noFim)) return;
        }
        if (event.cancelable) event.preventDefault();
    }, { passive: false });
})();

/* Botão "voltar" do telemóvel: fecha o que estiver aberto em vez de sair da app.
   Enquanto não se está na vista inicial, existe uma entrada a mais no histórico para o gesto consumir. */
(() => {
    // Do que está por cima para o que está por baixo.
    const CAMADAS = [
        "#exerciseMediaZoomOverlay",
        "#closeCustomExercise",
        "#closeExercisePicker",
        "#closeExerciseEditor",
        "#closeProgress",
        ".exercise-modal-overlay.open #exerciseModalClose",
        ".equipment-3d-overlay.is-open .equipment-3d-close",
        "#backWorkout",
        "#page-equipment.active .equipment-back"
    ];
    const paginaInicial = () => Boolean(document.querySelector("#page-home.active"));
    const camadaAberta = () => {
        // Numa janela de confirmação, "voltar" nunca pode confirmar: é sempre Cancelar.
        const janela = [...document.querySelectorAll(".vf-dialog-overlay")].pop();
        if (janela) return janela.querySelector(".vf-dialog-cancel") || janela.querySelector(".vf-dialog-confirm");
        return CAMADAS.map(seletor => document.querySelector(seletor)).find(Boolean) || null;
    };
    const naVistaInicial = () => !document.querySelector(".vf-select-menu") && !camadaAberta() && paginaInicial();

    // Depois de recarregar, a entrada anterior continua no histórico.
    let temEntrada = Boolean(history.state?.vfVoltar), aConsumir = false;
    history.scrollRestoration = "manual";

    const sincronizar = () => {
        if (aConsumir) return;
        const inicial = naVistaInicial();
        if (!inicial && !temEntrada) {
            history.pushState({ vfVoltar: true }, "");
            temEntrada = true;
        } else if (inicial && temEntrada) {
            // Fechou-se com o X: retira a entrada, senão o próximo "voltar" não faria nada.
            aConsumir = true;
            history.back();
        }
    };

    window.addEventListener("popstate", () => {
        temEntrada = false;
        if (aConsumir) {
            aConsumir = false;
        } else if (document.querySelector(".vf-select-menu")) {
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        } else {
            const camada = camadaAberta();
            if (camada) camada.click();
            else if (!paginaInicial()) mostrarPagina("home");
        }
        setTimeout(sincronizar, 0);
    });

    new MutationObserver(sincronizar).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    sincronizar();
})();
