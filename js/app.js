document.addEventListener("DOMContentLoaded", () => {

    let deferredPrompt = null;


    /* =====================================================
       SERVICE WORKER
       ===================================================== */

    /*
     * TEMPORARIAMENTE DESATIVADO DURANTE O DESENVOLVIMENTO
     *
     * O Service Worker pode causar problemas com o
     * Live Server e com o cache enquanto estamos
     * a desenvolver a aplicação.
     *
     * Na versão final da PWA podemos voltar a ativá-lo.
     */

    /*
    if ("serviceWorker" in navigator) {

        window.addEventListener("load", async () => {

            try {

                const registration =
                    await navigator.serviceWorker.register(
                        "./sw.js",
                        {
                            updateViaCache: "none"
                        }
                    );

                console.log(
                    "Service Worker registado:",
                    registration.scope
                );

                await registration.update();

            } catch (err) {

                console.warn(
                    "Service Worker:",
                    err
                );

            }

        });


        navigator.serviceWorker.addEventListener(
            "controllerchange",
            () => {

                window.location.reload();

            }
        );

    }
    */


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