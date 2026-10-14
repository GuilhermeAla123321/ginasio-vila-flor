document.addEventListener("DOMContentLoaded", () => {

    let deferredPrompt = null;

    /*
     * Solicita orientação vertical em navegadores que suportam a Screen Orientation API.
     * Alguns browsers só permitem o bloqueio em PWA instalada/ecrã inteiro; nesses casos,
     * a tentativa é ignorada e o aviso CSS impede a utilização do layout em paisagem.
     */
    const solicitarOrientacaoVertical = () => {
        const orientation = window.screen?.orientation;
        if (!orientation || typeof orientation.lock !== "function") return;

        try {
            const resultado = orientation.lock("portrait");
            if (resultado && typeof resultado.catch === "function") {
                resultado.catch(() => {
                    // Limitação do navegador/plataforma; o fallback visual continua ativo.
                });
            }
        } catch (_) {
            // O bloqueio físico não é suportado em todos os navegadores.
        }
    };

    solicitarOrientacaoVertical();
    // Repetir após a primeira interação permite APIs que exigem gesto do utilizador.
    window.addEventListener("pointerdown", solicitarOrientacaoVertical, {
        once: true,
        passive: true
    });
    window.addEventListener("appinstalled", solicitarOrientacaoVertical);
    document.addEventListener("fullscreenchange", solicitarOrientacaoVertical);


    /* =====================================================
       SERVICE WORKER
       ===================================================== */

    // Mantém a PWA atualizada e invalida caches de versões anteriores.
    // O SW serve HTML, JavaScript, CSS e o manifesto com estratégias que
    // consultam a rede primeiro; os MP4 não são pré-carregados pelo SW.
    if ("serviceWorker" in navigator && window.isSecureContext) {
        let recarregamentoFeito = false;
        const haviaControlador = Boolean(navigator.serviceWorker.controller);

        navigator.serviceWorker.addEventListener("controllerchange", () => {
            // Só recarregar ao substituir um SW antigo já ativo, não na primeira instalação.
            if (haviaControlador && !recarregamentoFeito) {
                recarregamentoFeito = true;
                window.location.reload();
            }
        });

        window.addEventListener("load", async () => {
            try {
                const registration = await navigator.serviceWorker.register("./sw.js", {
                    updateViaCache: "none"
                });
                await registration.update();
                console.info("Service Worker atualizado:", registration.scope);
            } catch (erro) {
                // A aplicação continua a funcionar sem SW (por exemplo, num servidor de desenvolvimento).
                console.warn("Não foi possível atualizar o Service Worker:", erro);
            }
        }, { once: true });
    }

    /* =====================================================
       INSTALAÇÃO DA PWA
       ===================================================== */

    window.addEventListener(
        "beforeinstallprompt",
        event => {

            event.preventDefault();

            deferredPrompt = event;

            const bar =
                document.getElementById(
                    "installAppBar"
                );

            if (
                bar &&
                !localStorage.getItem(
                    "vf_install_dismissed"
                )
            ) {

                bar.hidden = false;

            }

        }
    );


    /* =====================================================
       BOTÃO INSTALAR
       ===================================================== */

    document
        .getElementById("installAppBtn")
        ?.addEventListener(
            "click",
            async () => {

                if (!deferredPrompt) {
                    return;
                }

                deferredPrompt.prompt();

                await deferredPrompt.userChoice;

                deferredPrompt = null;

                document
                    .getElementById(
                        "installAppBar"
                    )
                    ?.setAttribute(
                        "hidden",
                        ""
                    );

            }
        );


    /* =====================================================
       DISPENSAR BARRA DE INSTALAÇÃO
       ===================================================== */

    document
        .getElementById("dismissInstall")
        ?.addEventListener(
            "click",
            () => {

                localStorage.setItem(
                    "vf_install_dismissed",
                    "1"
                );

                document
                    .getElementById(
                        "installAppBar"
                    )
                    ?.setAttribute(
                        "hidden",
                        ""
                    );

            }
        );


    /* =====================================================
       APP INSTALADA
       ===================================================== */

    window.addEventListener(
        "appinstalled",
        () => {

            deferredPrompt = null;

            document
                .getElementById(
                    "installAppBar"
                )
                ?.setAttribute(
                    "hidden",
                    ""
                );

        }
    );


    /* =====================================================
       NAVEGAÇÃO
       ===================================================== */

    document
        .querySelectorAll(
            "[data-page-jump]"
        )
        .forEach(btn => {

            btn.addEventListener(
                "click",
                () => {

                    const page =
                        btn.dataset.pageJump;

                    if (
                        typeof mostrarPagina ===
                        "function"
                    ) {

                        mostrarPagina(page);

                    }

                }
            );

        });

});