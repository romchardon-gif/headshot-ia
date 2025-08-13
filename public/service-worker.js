const CACHE_NAME = 'headshot-ia-v1';
const ASSETS = [
  '/offline.html',
  '/',
  '/styles.css',
  '/script.js',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-256.png',
  '/icons/icon-384.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Don't cache Stripe/Replicate/R2 or non-GET
  if (event.request.method !== 'GET' || url.pathname.startsWith('/api/')) {
    return; // let the network handle it
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return resp;
      }).catch(() => {
        // Optional: offline fallback page could be returned here
        return cached;
      });
    })
  );
});


// Navigation fallback to offline page
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const preload = await event.preloadResponse;
        if (preload) return preload;
        const net = await fetch(event.request);
        return net;
      } catch (e) {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match('/offline.html');
        return cached;
      }
    })());
  }
});
