const CACHE_NAME = 'flashcards-v1';
const urlsToCache = [
  '/',
  '/static/app.js',
  'https://cdn.tailwindcss.com',
  '/static/manifest.json'
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.log('Service Worker: Cache failed', error);
      })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip API requests for now - always go to network
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
          .then(fetchResponse => {
            // Clone the response
            const responseClone = fetchResponse.clone();
            
            // Add to cache for next time
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseClone);
              });
            
            return fetchResponse;
          });
      })
      .catch(error => {
        console.log('Service Worker: Fetch failed', error);
        // Could return a fallback page here
      })
  );
});

// Background sync (future feature)
self.addEventListener('sync', event => {
  console.log('Service Worker: Background sync', event.tag);
});

// Push notifications (future feature)
self.addEventListener('push', event => {
  console.log('Service Worker: Push message received');
});