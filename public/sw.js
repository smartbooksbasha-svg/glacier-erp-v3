const CACHE = 'gws-v3-2';
const SHELL = [
  './',
  './index.html',
  './fonts.css',
  './manifest.webmanifest',
  './fonts/space-grotesk-latin-700-normal.woff2',
  './fonts/work-sans-latin-400-normal.woff2',
  './fonts/work-sans-latin-500-normal.woff2',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-32.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    for (const path of SHELL) {
      try { await cache.add(path); } catch { /* keep installing */ }
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key !== CACHE && key.startsWith('gws-v3-')) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    try {
      const response = await fetch(event.request);
      if (response && response.status === 200 && response.type === 'basic') {
        const cache = await caches.open(CACHE);
        cache.put(event.request, response.clone());
      }
      return response;
    } catch {
      const cache = await caches.open(CACHE);
      return await cache.match(event.request, { ignoreSearch: true })
        || await cache.match('./index.html')
        || Response.error();
    }
  })());
});
