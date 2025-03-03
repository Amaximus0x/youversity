const CACHE_NAME = 'youversity-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/favicon.ico',
  '/google-icon.svg'
];


// Helper function to check if URL is supported for caching
function isRequestCacheable(request) {
  try {
    const url = new URL(request.url);
    
    // Don't cache:
    // - Non-GET requests
    // - API requests
    // - Authentication-related requests
    // - Chrome extension requests
    // - Local development JS/CSS files
    return request.method === 'GET' && 
           (url.protocol === 'http:' || url.protocol === 'https:') &&
           !url.pathname.startsWith('/api/') &&
           !url.pathname.includes('/auth/') &&
           !url.protocol.startsWith('chrome-extension') &&
           !(self.location.hostname === 'localhost' && url.pathname.match(/\.(js|css)$/));
  } catch {
    return false;
  }
}

// Install event - cache static assets
self.addEventListener('install', (event) => {
  // Activate worker immediately
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        STATIC_ASSETS.map(path => {
          const url = new URL(path, self.location.origin).href;
          return fetch(url, { 
            cache: 'reload',
            credentials: 'same-origin'
          })
          .then(response => {
            if (!response.ok) {
              console.warn(`Failed to fetch ${path}: ${response.status} ${response.statusText}`);
              return;
            }
            // Clone the response before putting it in the cache
            return cache.put(path, response.clone());
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
  // Ignore non-cacheable requests
  if (!isRequestCacheable(event.request)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        // Clone the request because it can only be used once
        return fetch(event.request.clone(), {
          credentials: 'same-origin'
        }).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          try {
            // Clone the response because it can only be used once
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache)
                  .catch(error => {
                    console.warn(`Cache put error for ${event.request.url}:`, error);
                  });
              })
              .catch(error => {
                console.warn('Cache open error:', error);
              });
          } catch (error) {
            console.warn('Response cloning error:', error);
          }

          return response;
        });
      })
      .catch(error => {
        console.warn('Fetch handler error:', error);
        // Optionally return a fallback response for offline experience
        return new Response('Network error occurred', { status: 503, statusText: 'Service Unavailable' });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  // Activate worker immediately
  event.waitUntil(clients.claim());

  // Clean up old caches
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