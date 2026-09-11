const CACHE_NAME = 'vf-ginasio-v9';
const APP_SHELL = [
  './', './index.html', './manifest.json',
  './css/style.css', './css/responsive.css',
  './js/equipamentos.js', './js/treino.js', './js/exercicios.js', './js/navegacao.js', './js/timer.js', './js/tema.js', './js/app.js',
  './icons/icon-192.png', './icons/icon-512.png', './assets/vila-flor-identidade.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // O index.html vai sempre buscar a versão mais recente ao servidor
  if (url.pathname === '/' || url.pathname.endsWith('/index.html')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(response => {
          const copy = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, copy);
          });

          return response;
        })
        .catch(() => caches.match(event.request))
    );

    return;
  }

  // Restantes ficheiros: usa cache quando disponível
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        const copy = response.clone();

        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, copy);
        });

        return response;
      });
    })
  );
});
