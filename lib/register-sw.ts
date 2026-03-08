/**
 * Service Worker Registration
 * Registers the service worker for offline functionality and background sync
 */

export async function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('Service Worker not supported');
    return null;
  }

  try {
    // Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });

    console.log('✅ Service Worker registered:', registration.scope);

    // Check for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('🔄 New Service Worker available - refresh to update');
            // You could show a notification here to prompt user to refresh
          }
        });
      }
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('[SW Message]', event.data);

      if (event.data.type === 'SYNC_REQUESTED') {
        // Trigger full sync (push dirty + pull fresh + sync transactions)
        import('./sync-service').then(({ syncService }) => {
          syncService.fullSync().catch(console.error);
        }).catch(console.error);
      } else if (event.data.type === 'SYNC_TRANSACTION') {
        // Legacy: sync single transaction
        import('./sync-service').then(({ syncService }) => {
          syncService.syncSingleTransaction(event.data.uuid).catch(console.error);
        }).catch(console.error);
      }
    });

    // Register background sync (if supported)
    if ('sync' in registration) {
      try {
        await (registration as any).sync.register('sync-transactions');
        await (registration as any).sync.register('sync-all');
        console.log('Background sync registered (transactions + all)');
      } catch (err) {
        console.warn('Background sync registration failed:', err);
      }
    }

    return registration;
  } catch (err) {
    console.error('Service Worker registration failed:', err);
    return null;
  }
}

/**
 * Unregister service worker (for development/testing)
 */
export async function unregisterServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
      console.log('Service Worker unregistered');
    }
  } catch (err) {
    console.error('Failed to unregister Service Worker:', err);
  }
}

/**
 * Check if service worker is registered and active
 */
export function isServiceWorkerActive(): boolean {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  return navigator.serviceWorker.controller !== null;
}

/**
 * Request background sync
 */
export async function requestBackgroundSync(tag: string = 'sync-transactions') {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    if ('sync' in registration) {
      await (registration as any).sync.register(tag);
      console.log(`Background sync requested: ${tag}`);
      return true;
    } else {
      console.warn('Background Sync API not supported');
      return false;
    }
  } catch (err) {
    console.error('Background sync request failed:', err);
    return false;
  }
}
