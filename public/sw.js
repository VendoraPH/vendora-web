/**
 * Service Worker for Vendora POS
 * Enables offline functionality and background sync
 */

const CACHE_VERSION = 'v2';
const CACHE_NAME = `vendora-pos-${CACHE_VERSION}`;
const STATIC_CACHE = `vendora-static-${CACHE_VERSION}`;
const API_CACHE = `vendora-api-${CACHE_VERSION}`;

// POS routes to cache for offline use
const STATIC_ASSETS = [
  '/',
  '/pos/pos-screen',
  '/pos/dashboard',
  '/pos/products',
  '/pos/orders',
  '/pos/customers',
  '/pos/payments',
  '/pos/credit-accounts',
  '/pos/accounting',
  '/pos/auth/login',
  '/offline.html'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        // Use addAll with individual catch to not fail on missing routes
        return Promise.allSettled(
          STATIC_ASSETS.map(url => cache.add(url).catch(err => {
            console.warn(`[SW] Failed to cache ${url}:`, err.message);
          }))
        );
      })
      .catch((err) => {
        console.error('[SW] Failed to cache static assets:', err);
      })
  );

  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete caches from old versions
          if (
            cacheName !== CACHE_NAME &&
            cacheName !== STATIC_CACHE &&
            cacheName !== API_CACHE &&
            cacheName.startsWith('vendora-')
          ) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // Take control immediately
  return self.clients.claim();
});

// Fetch event - network first with cache fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // Handle /api/ping separately - always network, no cache
  if (url.pathname === '/api/ping') {
    return;
  }

  // Handle API GET requests with stale-while-revalidate
  if (url.pathname.startsWith('/api/') || url.hostname !== self.location.hostname) {
    // Skip external API caching
    if (url.hostname !== self.location.hostname) {
      return;
    }

    event.respondWith(staleWhileRevalidate(request, API_CACHE));
    return;
  }

  // Handle page navigations and static assets
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(request).then((cached) => {
          if (cached) {
            return cached;
          }

          // If HTML page and not in cache, show offline page
          if (request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/offline.html');
          }

          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

/**
 * Stale-while-revalidate strategy for API responses
 * Returns cached response immediately, fetches fresh in background
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  // Fetch fresh data in background
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cachedResponse);

  // Return cached immediately if available, otherwise wait for fetch
  return cachedResponse || fetchPromise;
}

// Background Sync - retry failed transactions and dirty records when online
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'sync-transactions' || event.tag === 'sync-all') {
    event.waitUntil(syncTransactions());
  }
});

// Sync transactions function
async function syncTransactions() {
  try {
    console.log('[SW] Syncing pending transactions...');

    const db = await openDatabase();
    const transactions = await getPendingTransactions(db);

    console.log(`[SW] Found ${transactions.length} pending transactions`);

    for (const txn of transactions) {
      try {
        await syncTransaction(txn);
        console.log(`[SW] Synced transaction: ${txn.uuid}`);
      } catch (err) {
        console.error(`[SW] Failed to sync transaction ${txn.uuid}:`, err);
      }
    }

    console.log('[SW] Background sync complete');
  } catch (err) {
    console.error('[SW] Background sync failed:', err);
    throw err; // Re-throw to retry later
  }
}

// Open IndexedDB
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('VendoraPOSDB', 3);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Get pending transactions from IndexedDB
function getPendingTransactions(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['transactions'], 'readonly');
    const store = transaction.objectStore('transactions');
    const index = store.index('synced');
    const request = index.getAll(false);

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

// Sync a single transaction - message main thread to handle full sync
async function syncTransaction(txn) {
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({
      type: 'SYNC_REQUESTED',
      syncType: 'all',
      uuid: txn.uuid
    });
  });
}

// Push notification
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};

  const options = {
    body: data.body || 'New notification',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Vendora POS', options)
  );
});
