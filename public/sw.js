// Minimal service worker to keep the app installable
// without implementing any offline caching.

// Immediately activate the new SW on install
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Take control of clients and clear any legacy caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Remove any caches created by previous versions
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

// Pass-through fetch handler: no caching, always hit network
self.addEventListener('fetch', (event) => {
  // Only handle same-origin GET requests; let the browser handle others
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(fetch(event.request));
});
