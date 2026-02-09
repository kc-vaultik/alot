// Service Worker for Vaultik - Performance Optimization
const CACHE_NAME = 'vaultik-v1';
const STATIC_CACHE = 'vaultik-static-v1';
const DYNAMIC_CACHE = 'vaultik-dynamic-v1';

// Cache strategy configuration
const CACHE_STRATEGIES = {
  images: { strategy: 'cache-first', maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days
  api: { strategy: 'network-first', maxAge: 5 * 60 * 1000 }, // 5 minutes
  static: { strategy: 'cache-first', maxAge: 365 * 24 * 60 * 60 * 1000 }, // 1 year
  pages: { strategy: 'stale-while-revalidate', maxAge: 24 * 60 * 60 * 1000 } // 1 day
};

// Resources to cache on install
const STATIC_ASSETS = [
  '/',
  '/what-we-authenticate',
  '/pricing',
  '/benefits',
  '/manifest.json',
  '/robots.txt'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      }),
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE)
            .map((cacheName) => caches.delete(cacheName))
        );
      }),
      self.clients.claim()
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') return;

  // Skip requests from different origins (except for specific CDNs)
  if (url.origin !== location.origin && !isAllowedExternalResource(url)) return;

  event.respondWith(handleRequest(request));
});

// Determine cache strategy based on request type
function getCacheStrategy(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Images
  if (request.destination === 'image' || /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(pathname)) {
    return CACHE_STRATEGIES.images;
  }

  // API requests
  if (pathname.includes('/api/') || url.hostname.includes('supabase.co')) {
    return CACHE_STRATEGIES.api;
  }

  // Static assets
  if (request.destination === 'script' || request.destination === 'style' || 
      /\.(js|css|woff|woff2|ttf|eot)$/i.test(pathname)) {
    return CACHE_STRATEGIES.static;
  }

  // HTML pages
  if (request.destination === 'document' || pathname.endsWith('/') || pathname.includes('.html')) {
    return CACHE_STRATEGIES.pages;
  }

  // Default strategy
  return CACHE_STRATEGIES.pages;
}

// Handle request with appropriate caching strategy
async function handleRequest(request) {
  const strategy = getCacheStrategy(request);
  const cache = await caches.open(DYNAMIC_CACHE);

  switch (strategy.strategy) {
    case 'cache-first':
      return cacheFirst(request, cache, strategy.maxAge);
    case 'network-first':
      return networkFirst(request, cache, strategy.maxAge);
    case 'stale-while-revalidate':
      return staleWhileRevalidate(request, cache, strategy.maxAge);
    default:
      return fetch(request);
  }
}

// Cache-first strategy
async function cacheFirst(request, cache, maxAge) {
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse && !isExpired(cachedResponse, maxAge)) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return cachedResponse || new Response(JSON.stringify({ error: 'Network unavailable' }), {
      status: 408,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Network-first strategy
async function networkFirst(request, cache, maxAge) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse && !isExpired(cachedResponse, maxAge)) {
      return cachedResponse;
    }
    throw error;
  }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request, cache, maxAge) {
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => cachedResponse);

  if (cachedResponse && !isExpired(cachedResponse, maxAge)) {
    // Return cached response immediately, update in background
    fetchPromise.catch(() => {}); // Prevent unhandled rejection
    return cachedResponse;
  }

  return fetchPromise;
}

// Check if cached response is expired
function isExpired(response, maxAge) {
  const cacheTime = response.headers.get('sw-cache-time');
  if (!cacheTime) return true;
  
  const age = Date.now() - parseInt(cacheTime);
  return age > maxAge;
}

// Check if external resource is allowed to be cached
function isAllowedExternalResource(url) {
  const allowedDomains = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'cdnjs.cloudflare.com',
    'unpkg.com'
  ];
  
  return allowedDomains.some(domain => url.hostname.includes(domain));
}

// Background sync for offline analytics
self.addEventListener('sync', (event) => {
  if (event.tag === 'analytics-sync') {
    event.waitUntil(syncAnalytics());
  }
});

// Sync offline analytics data
async function syncAnalytics() {
  try {
    const db = await openDB();
    const tx = db.transaction(['analytics'], 'readonly');
    const store = tx.objectStore('analytics');
    const data = await store.getAll();
    
    if (data.length > 0) {
      // Send analytics data to server
      await fetch('/api/analytics/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      // Clear sent data
      const clearTx = db.transaction(['analytics'], 'readwrite');
      const clearStore = clearTx.objectStore('analytics');
      await clearStore.clear();
    }
  } catch (error) {
    console.error('Analytics sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [100, 50, 100],
    data: data.data,
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if app is not open
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Utility function to open IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('VaultikDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('analytics')) {
        db.createObjectStore('analytics', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}