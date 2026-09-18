const CACHE_NAME = 'vf-ginasio-v21';

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

        // Assume imediatamente o controlo das páginas abertas
        return self.clients.claim();

      })

  );

});


/* =========================================================
   FETCH
   ========================================================= */

self.addEventListener('fetch', event => {

  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);


  /*
   * HTML
   * ---------------------------------------------------------
   * Vai primeiro à internet para garantir sempre a versão
   * mais recente.
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

          const copy = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, copy);
            });

          return response;

        })

        .catch(() => {

          return caches.match(event.request);

        })

    );

    return;
  }


  /*
   * JAVASCRIPT E CSS
   * ---------------------------------------------------------
   * Também tentamos primeiro a versão online.
   *
   * Isto é importante para que alterações ao código sejam
   * disponibilizadas imediatamente depois de uma atualização.
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

          const copy = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, copy);
            });

          return response;

        })

        .catch(() => {

          return caches.match(event.request);

        })

    );

    return;
  }


  /*
   * RESTANTES FICHEIROS
   * ---------------------------------------------------------
   * Cache primeiro para permitir funcionamento offline.
   */

  event.respondWith(

    caches.match(event.request)
      .then(cached => {

        if (cached) {
          return cached;
        }

        return fetch(event.request)
          .then(response => {

            const copy = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, copy);
              });

            return response;

          });

      })

  );

});