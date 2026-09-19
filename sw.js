const CACHE_NAME = 'vf-ginasio-v24';

const APP_SHELL = [
    './',
    './index.html',
    './manifest.json',

    './css/style.css',
    './css/responsive.css',

    './js/equipamentos.js',
    './js/treino.js',
    './js/exercicios.js',
    './js/navegacao.js',
    './js/timer.js',
    './js/tema.js',
    './js/app.js',

    './icons/icon-192.png',
    './icons/icon-512.png',
    './assets/vila-flor-identidade.png'
];


/* =========================================================
   INSTALAÇÃO
   ========================================================= */

self.addEventListener('install', event => {

    event.waitUntil(

        caches.open(CACHE_NAME)
            .then(cache => {

                return cache.addAll(APP_SHELL);

            })

    );

    // Ativa imediatamente a nova versão
    self.skipWaiting();

});


/* =========================================================
   ATIVAÇÃO
   ========================================================= */

self.addEventListener('activate', event => {

    event.waitUntil(

        caches.keys()
            .then(keys => {

                return Promise.all(

                    keys
                        .filter(key => key !== CACHE_NAME)
                        .map(key => caches.delete(key))

                );

            })

            .then(() => {

                // Assume imediatamente o controlo das páginas
                return self.clients.claim();

            })

    );

});


/* =========================================================
   FETCH
   ========================================================= */

self.addEventListener('fetch', event => {

    // Apenas pedidos GET
    if (event.request.method !== 'GET') {
        return;
    }

    const url = new URL(event.request.url);


    /*
     * IMPORTANTE:
     * O Service Worker só deve tratar pedidos
     * pertencentes à própria aplicação.
     *
     * Isto impede erros com:
     * chrome-extension://
     * outros domínios
     * extensões do Chrome
     */

    if (url.origin !== self.location.origin) {
        return;
    }


    /* =====================================================
       HTML
       ===================================================== */

    /*
     * O HTML é sempre procurado primeiro online.
     * Se não houver internet, utiliza a versão em cache.
     */

    if (
        url.pathname === '/' ||
        url.pathname.endsWith('/index.html')
    ) {

        event.respondWith(

            fetch(event.request, {
                cache: 'no-store'
            })

                .then(response => {

                    /*
                     * Só guardar respostas válidas
                     * no cache.
                     */

                    if (response && response.ok) {

                        const copy = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {

                                cache.put(
                                    event.request,
                                    copy
                                );

                            });

                    }

                    return response;

                })

                .catch(() => {

                    return caches.match(
                        event.request
                    );

                })

        );

        return;
    }


    /* =====================================================
       JAVASCRIPT E CSS
       ===================================================== */

    /*
     * JS e CSS procuram primeiro a versão online.
     *
     * Assim, durante o desenvolvimento,
     * as alterações aparecem imediatamente.
     */

    if (
        url.pathname.endsWith('.js') ||
        url.pathname.endsWith('.css')
    ) {

        event.respondWith(

            fetch(event.request, {
                cache: 'no-store'
            })

                .then(response => {

                    /*
                     * Só guardar respostas válidas.
                     */

                    if (response && response.ok) {

                        const copy = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {

                                cache.put(
                                    event.request,
                                    copy
                                );

                            });

                    }

                    return response;

                })

                .catch(() => {

                    /*
                     * Sem internet:
                     * utilizar a versão guardada.
                     */

                    return caches.match(
                        event.request
                    );

                })

        );

        return;
    }


    /* =====================================================
       RESTANTES FICHEIROS
       ===================================================== */

    /*
     * Imagens, ícones, manifest, etc.
     *
     * Primeiro tenta o cache.
     * Se não existir, procura online e guarda.
     */

    event.respondWith(

        caches.match(event.request)

            .then(cached => {

                if (cached) {
                    return cached;
                }

                return fetch(event.request)

                    .then(response => {

                        /*
                         * Só guardar respostas válidas.
                         */

                        if (response && response.ok) {

                            const copy = response.clone();

                            caches.open(CACHE_NAME)
                                .then(cache => {

                                    cache.put(
                                        event.request,
                                        copy
                                    );

                                });

                        }

                        return response;

                    });

            })

    );

});