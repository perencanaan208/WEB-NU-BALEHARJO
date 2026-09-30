// Service Worker PRNU Baleharjo — buka cepat & tetap tampil saat sinyal lemah/offline.
// Strategi: halaman & aset statis = "stale-while-revalidate" (langsung dari cache, diperbarui di latar belakang).
// /api/* dan panggilan ke Apps Script TIDAK disentuh (data punya cache sendiri di halaman & server).
const VERSION = 'prnu-v3';
const SHELL   = VERSION + '-shell';
const EXTRA   = VERSION + '-extra';
const PRECACHE = [
  '/', '/tailwind.css', '/manifest.json',
  '/icons/nuonline-192.png', '/icons/favicon-32.png', '/favicon.ico'
];
const CDN_HOSTS = ['cdnjs.cloudflare.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL)
      .then((c) => Promise.all(PRECACHE.map((u) => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL && k !== EXTRA).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function staleWhileRevalidate(event, cacheName, cacheKey) {
  const req = event.request;
  return caches.open(cacheName).then((cache) =>
    cache.match(cacheKey || req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && (res.ok || res.type === 'opaque')) cache.put(cacheKey || req, res.clone());
          return res;
        })
        .catch(() => null);
      if (cached) { event.waitUntil(network); return cached; }
      return network.then((res) => res || Response.error());
    })
  );
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith('/api/')) return;             // data: jangan di-cache di sini
    if (req.mode === 'navigate') {
      if (url.pathname === '/' || url.pathname === '/index.html') {
        // Halaman utama (SPA): langsung dari cache, diperbarui di latar belakang
        event.respondWith(staleWhileRevalidate(event, SHELL, '/'));
      } else {
        // Halaman lain (mis. /berita/:id yang dilayani fungsi server untuk preview share):
        // selalu ambil dari jaringan; cache '/' hanya dipakai saat offline.
        event.respondWith(fetch(req).catch(() => caches.match('/').then((r) => r || Response.error())));
      }
      return;
    }
    event.respondWith(staleWhileRevalidate(event, SHELL));     // css, ikon, manifest, dll.
    return;
  }
  if (CDN_HOSTS.indexOf(url.hostname) !== -1) {                // FontAwesome & Google Fonts
    event.respondWith(staleWhileRevalidate(event, EXTRA));
  }
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
