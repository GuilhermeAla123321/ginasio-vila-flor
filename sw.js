const CACHE_NAME = 'vf-ginasio-v25';

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
            .catch(error => {

                console.warn(
                    'Erro ao criar cache:',
                    error
                );

            })

    );

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

                return self.clients.claim();

            })

    );

});


/* =========================================================
   FUNÇÃO AUXILIAR
   ========================================================= */

async function guardarNoCache(request, response) {

    /*
     * Só guardar respostas válidas.
     */

    if (!response) {
        return;
    }

    if (!response.ok) {
        return;
    }

    /*
     * Algumas respostas não podem ser colocadas
     * no Cache Storage.
     */

    if (response.type === 'opaque') {
        return;
    }

    try {

        const cache = await caches.open(CACHE_NAME);

        await cache.put(
            request,
            response.clone()
        );

    } catch (error) {

        /*
         * Um erro de cache nunca deve impedir
         * o funcionamento da aplicação.
         */

        console.warn(
            'Não foi possível guardar no cache:',
            request.url,
            error
        );

    }

}


/* =========================================================
   FETCH
   ========================================================= */

self.addEventListener('fetch', event => {

    const request = event.request;


    /* =====================================================
       MÉTODO
       ===================================================== */

    if (request.method !== 'GET') {
        return;
    }


    /* =====================================================
       URL
       ===================================================== */

    const url = new URL(request.url);


    /*
     * Só tratar pedidos HTTP/HTTPS.
     */

    if (
        url.protocol !== 'http:' &&
        url.protocol !== 'https:'
    ) {
        return;
    }


    /*
     * Só tratar pedidos da própria aplicação.
     */

    if (url.origin !== self.location.origin) {
        return;
    }


    /* =====================================================
       LIVE SERVER
       ===================================================== */

    /*
     * Não interferir com endpoints especiais
     * utilizados pelo Live Server.
     */

    if (
        url.pathname.includes('__livereload') ||
        url.pathname.includes('livereload') ||
        url.pathname.includes('__webpack') ||
        url.pathname.includes('sockjs')
    ) {

        return;
    }


    /* =====================================================
       HTML
       ===================================================== */

    if (
        request.mode === 'navigate' ||
        url.pathname === '/' ||
        url.pathname.endsWith('/index.html')
    ) {

        event.respondWith(

            fetch(request, {
                cache: 'no-store'
            })

                .then(async response => {

                    await guardarNoCache(
                        request,
                        response
                    );

                    return response;

                })

                .catch(() => {

                    return caches.match(request);

                })

        );

        return;
    }


    /* =====================================================
       JAVASCRIPT / CSS
       ===================================================== */

    if (
        url.pathname.endsWith('.js') ||
        url.pathname.endsWith('.css')
    ) {

        event.respondWith(

            fetch(request, {
                cache: 'no-store'
            })

                .then(async response => {

                    await guardarNoCache(
                        request,
                        response
                    );

                    return response;

                })

                .catch(() => {

                    return caches.match(request);

                })

        );

        return;
    }


    /* =====================================================
       IMAGENS / ÍCONES / MANIFEST
       ===================================================== */

    if (
        url.pathname.endsWith('.png') ||
        url.pathname.endsWith('.jpg') ||
        url.pathname.endsWith('.jpeg') ||
        url.pathname.endsWith('.webp') ||
        url.pathname.endsWith('.gif') ||
        url.pathname.endsWith('.svg') ||
        url.pathname.endsWith('.ico') ||
        url.pathname.endsWith('.json')
    ) {

        event.respondWith(

            caches.match(request)

                .then(cached => {

                    if (cached) {
                        return cached;
                    }

                    return fetch(request)

                        .then(async response => {

                            await guardarNoCache(
                                request,
                                response
                            );

                            return response;

                        });

                })

        );

        return;
    }

});