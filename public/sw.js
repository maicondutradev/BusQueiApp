const CACHE_NAME = 'busquei-pwa-cache-v3';

const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/icon.png',
  '/manifest.json'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache).catch(err => console.log('Error caching static assets', err)))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Ignorar extensões do Chrome
  if (url.protocol === 'chrome-extension:') return;

  // Ignorar requisições do Firebase/Firestore para evitar interceptação de WebSockets/WebChannel e dados desatualizados
  if (url.hostname.includes('firestore.googleapis.com') || 
      url.hostname.includes('identitytoolkit.googleapis.com') || 
      url.hostname.includes('firebaseio.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200 && (response.type === 'basic' || response.type === 'cors')) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache).catch(err => console.log('Cache put error:', err));
          }).catch(err => console.log('Cache open error:', err));
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) return cachedResponse;
          
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});
