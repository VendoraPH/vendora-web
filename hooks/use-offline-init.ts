"use client"

import { useState, useEffect, useCallback, useRef } from 'react';
import { registerServiceWorker } from '@/lib/register-sw';
import { networkMonitor, type NetworkQuality } from '@/lib/network-quality-monitor';
import { syncService } from '@/lib/sync-service';
import { requestPersistentStorage, getPendingTransactionsCount, getDirtyRecordsCount } from '@/lib/db';

export interface OfflineState {
  isOnline: boolean;
  networkQuality: NetworkQuality;
  latency: number;
  pendingCount: number;
  dirtyCount: number;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
}

export function useOfflineInit() {
  const [state, setState] = useState<OfflineState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    networkQuality: 'good',
    latency: 0,
    pendingCount: 0,
    dirtyCount: 0,
    isSyncing: false,
    lastSyncedAt: null,
  });
  const initialized = useRef(false);

  const updateCounts = useCallback(async () => {
    try {
      const [pendingCount, dirtyCount] = await Promise.all([
        getPendingTransactionsCount(),
        getDirtyRecordsCount(),
      ]);
      setState(prev => ({ ...prev, pendingCount, dirtyCount }));
    } catch {
      // IndexedDB may not be available
    }
  }, []);

  const triggerSync = useCallback(async () => {
    if (!state.isOnline || state.isSyncing) return;

    setState(prev => ({ ...prev, isSyncing: true }));
    try {
      await syncService.fullSync();
      await updateCounts();
      setState(prev => ({ ...prev, lastSyncedAt: new Date() }));
    } catch (err) {
      console.error('Manual sync failed:', err);
    } finally {
      setState(prev => ({ ...prev, isSyncing: false }));
    }
  }, [state.isOnline, state.isSyncing, updateCounts]);

  useEffect(() => {
    if (typeof window === 'undefined' || initialized.current) return;
    initialized.current = true;

    // Initialize online/offline detection
    syncService.initializeOnlineDetection();

    // Initialize network quality monitoring
    networkMonitor.initBrowserListeners();
    networkMonitor.start();

    // Register service worker
    registerServiceWorker().then(registration => {
      if (registration) {
        console.log('[Offline] PWA ready for offline use');
      }
    });

    // Request persistent storage
    requestPersistentStorage().then(granted => {
      console.log(granted ? '[Offline] Persistent storage granted' : '[Offline] Persistent storage denied');
    });

    // Start background sync
    syncService.startBackgroundSync();

    // Listen for network quality changes
    const unsubscribe = networkMonitor.onChange((stats) => {
      setState(prev => ({
        ...prev,
        isOnline: stats.quality !== 'offline',
        networkQuality: stats.quality,
        latency: stats.latency,
      }));
    });

    // Listen for online/offline changes
    const unsubOnline = syncService.onOnlineStatusChange((online) => {
      setState(prev => ({ ...prev, isOnline: online }));
      if (online) {
        updateCounts();
      }
    });

    // Initial counts
    updateCounts();

    // Periodically check counts (pending transactions + dirty records)
    const countsInterval = setInterval(updateCounts, 30000);

    return () => {
      syncService.stopBackgroundSync();
      networkMonitor.stop();
      unsubscribe();
      unsubOnline();
      clearInterval(countsInterval);
    };
  }, [updateCounts]);

  return { ...state, triggerSync, updateCounts };
}
