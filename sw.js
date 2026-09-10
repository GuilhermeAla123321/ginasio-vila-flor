const CACHE_NAME = 'vf-ginasio-v8';
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
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match('./index.html')))
  );
});
