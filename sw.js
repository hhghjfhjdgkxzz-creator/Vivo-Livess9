
const CACHE_NAME = 'vivo-live-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/index.css',
  '/index.tsx',
  'https://storage.googleapis.com/static.aistudio.google.com/stables/2025/03/06/f0e64906-e7e0-4a87-af9b-029e2467d302/f0e64906-e7e0-4a87-af9b-029e2467d302.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('firestore.googleapis.com')) return;
  
  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request).catch(() => {});
    })
  );
});
