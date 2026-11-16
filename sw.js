const CACHE_NAME = 'puppy-study-web-v3.5.0-20261116-1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './pet_engine.js',
  './app.js',
  './vocab_data.js',
  './qrcode.js',
  './stamp.js',
  './typing.js',
  './parent.html',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
