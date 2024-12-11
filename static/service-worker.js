const CACHE_NAME = 'youversity-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/app.css',
  '/app.js',
  '/favicon.png',
  '/google-icon.svg'
];

// Helper function to check if URL is supported for caching
function isRequestCacheable(request) {
  try {
    const url = new URL(request.url);
    return request.method === 'GET' && 
           (url.protocol === 'http:' || url.protocol === 'https:') &&
           !url.pathname.startsWith('/api/');
  } catch {
    return false;
  }
}

// Helper function to get full URL for static assets
function getAssetUrl(path) {
  return new URL(path, self.location.origin).href;
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        STATIC_ASSETS.map(path => {
          const url = getAssetUrl(path);
          return fetch(url)
            .then(response => {
              if (!response.ok) {
                throw new Error(`Failed to fetch ${url}`);
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

// Fetch event - serve from cache, then network
self.addEventListener('fetch', (event) => {
  // Skip unsupported requests early
  if (!isRequestCacheable(event.request)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      const fetchRequest = event.request.clone();

      return fetch(fetchRequest)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          return new Response('Network request failed', {
            status: 404,
            statusText: 'Not Found'
          });
        });
    })
  );
}); 