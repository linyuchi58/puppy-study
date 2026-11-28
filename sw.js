// 《汪汪小精靈 學習小伙伴》離線快取
// v3.8.1：改成「先上網拿最新版，連不上才用快取」。
//   以前是「先用快取」，學生打開時會拿到之前存的舊版（全班測驗時有人是舊版，沒有測驗模式）。
//   新版啟用時，會把已經打開的頁面自動重新整理一次，確保全班都是同一版。
const CACHE_NAME = 'puppy-study-web-v3.28.0-20261129-1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './pet_engine.js',
  './app.js',
  './vocab_data.js', './vocab_filter.js',
  './qrcode.js',
  './stamp.js',
  './zh_texts.js',
  './typing.js',
  './parent.html', './teacher.html', './jsqr.js', './zxing_reader.js', './zxing_reader.wasm', './counter.js', './cloud.js', './math.js', './today.js', './duel.js', './puzzle.js', './tangram.js', './gomoku.js', './sudoku.js', './slide.js', './lever.js', './fx.js', './laser.js', './sel.js', './wheel.js', './petplay.js', './pet_wear.js', './vip.js', './teacher_stamp.js', './cloud_merge.js', './cloud_config.js',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.all(ASSETS.map(u => fetch(new Request(u, { cache: 'reload' }))
        .then(r => (r.ok ? cache.put(u, r) : null)).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      const hadOld = keys.some(k => k !== CACHE_NAME);
      return Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        .then(() => self.clients.claim())
        .then(() => {
          // 換新版時，把已經打開的頁面重新整理，避免有人停在舊版
          if (!hadOld) return null;
          return self.clients.matchAll({ type: 'window' }).then(cs => Promise.all(cs.map(c => c.navigate(c.url).catch(() => null))));
        });
    })
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;   // 外部網站（瀏覽人次）不經過快取
  event.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(c => c || caches.match('./index.html')))
  );
});
