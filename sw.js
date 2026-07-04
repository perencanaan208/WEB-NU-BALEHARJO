// Service Worker - PRNU Baleharjo
// Hanya meng-cache "app shell" (file statis: html/ikon/manifest).
// Semua panggilan ke Google Apps Script (data berita, pengurus, dsb) TIDAK di-cache,
// supaya data selalu fresh dan tidak ada risiko data lama nyangkut.

const CACHE_NAME = 'prnu-baleharjo-shell-v1';
const SHELL_FILES = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(SHELL_FILES).catch(function () {
        // Kalau salah satu file gagal di-precache (misal belum diupload), jangan gagalkan instalasi.
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (key) { return key !== CACHE_NAME; })
            .map(function (key) { return caches.delete(key); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  const req = event.request;

  // Hanya tangani GET request dari origin sendiri (file statis situs ini).
  // Panggilan ke script.google.com (backend GAS) dan domain lain dibiarkan lewat langsung.
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(req)
      .then(function (res) {
        // Network-first: simpan salinan terbaru ke cache untuk fallback offline.
        const resClone = res.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put(req, resClone); });
        return res;
      })
      .catch(function () {
        // Offline / gagal fetch -> pakai cache kalau ada.
        return caches.match(req).then(function (cached) {
          return cached || caches.match('/');
        });
      })
  );
});
