const CACHE_NAME = 'youversity-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/favicon.png',
  '/google-icon.svg'
];

// Helper function to check if URL is supported for caching
function isRequestCacheable(request) {
  try {
    const url = new URL(request.url);
    return request.method === 'GET' && 
           (url.protocol === 'http:' || url.protocol === 'https:') &&
           !url.pathname.startsWith('/api/') &&
           !url.protocol.startsWith('chrome-extension') &&
           !(self.location.hostname === 'localhost' && url.pathname.match(/\.(js|css)$/));
  } catch {
    return false;
  }
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        STATIC_ASSETS.map(path => {
          const url = new URL(path, self.location.origin).href;
          return fetch(url, { cache: 'reload' })
            .then(response => {
              if (!response.ok) {
                console.warn(`Failed to fetch ${path}: ${response.status} ${response.statusText}`);
                return;
              }
              return cache.put(path, response);
            })
            .catch(error => {
              console.warn(`Failed to cache ${path}:`, error);
              return Promise.resolve();
            });
        })
      );
    })
  );
});

// Fetch event - serve from cache, then network
self.addEventListener('fetch', (event) => {
  if (!isRequestCacheable(event.request)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        return fetch(event.request.clone()).then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone());
          });

          return response;
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
}); 