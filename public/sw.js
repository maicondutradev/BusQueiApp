const CACHE_NAME = 'busquei-pwa-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/assets/images/favicon.png',
  '/assets/images/splash-icon.png',
  '/assets/images/icon.png',
  '/_expo/static/js/web/entry-34dad16ed8931582f459cc0b18ef6ee3.js' // It's better to use workbox for dynamic hashes, but for a basic demo we can cache standard routes.
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache).catch(err => console.log('Error caching static assets', err));
      })
  );
});

self.addEventListener('fetch', event => {
  // Strategy: Network first, fallback to cache
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
