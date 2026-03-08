"use client"

import { useState, useEffect, useCallback, useRef } from 'react';
import { db } from '@/lib/db';
import { syncService } from '@/lib/sync-service';

interface UseOfflineDataOptions {
  /** How old (in minutes) before data is considered stale */
  staleAfterMinutes?: number;
  /** Whether to auto-fetch from API on mount */
  autoFetch?: boolean;
}

interface UseOfflineDataResult<T> {
  data: T | null;
  isLoading: boolean;
  isStale: boolean;
  lastSyncedAt: Date | null;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useOfflineData<T>(
  cacheKey: string,
  apiFetcher: () => Promise<T>,
  options: UseOfflineDataOptions = {}
): UseOfflineDataResult<T> {
  const { staleAfterMinutes = 5, autoFetch = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  // Load from IndexedDB cache
  const loadFromCache = useCallback(async (): Promise<boolean> => {
    try {
      const cached = await db.cachedData.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached.data) as T;
        setData(parsed);
        setLastSyncedAt(cached.lastSyncedAt);

        // Check staleness
        const ageMs = Date.now() - new Date(cached.lastSyncedAt).getTime();
        const staleMs = staleAfterMinutes * 60 * 1000;
        setIsStale(ageMs > staleMs);

        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [cacheKey, staleAfterMinutes]);

  // Save to IndexedDB cache
  const saveToCache = useCallback(async (newData: T) => {
    try {
      const now = new Date();
      await db.cachedData.put({
        key: cacheKey,
        data: JSON.stringify(newData),
        lastSyncedAt: now,
      });
      setLastSyncedAt(now);
      setIsStale(false);
    } catch (err) {
      console.warn(`[OfflineData] Failed to cache ${cacheKey}:`, err);
    }
  }, [cacheKey]);

  // Fetch from API and update cache
  const fetchFromApi = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      const freshData = await apiFetcher();
      setData(freshData);
      setError(null);
      await saveToCache(freshData);
    } catch (err: any) {
      // Only set error if we have no cached data
      if (!data) {
        setError(err?.message || 'Failed to load data');
      }
    } finally {
      fetchingRef.current = false;
    }
  }, [apiFetcher, saveToCache, data]);

  // Refresh: load from cache first, then API in background
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Load cached data first (instant)
      const hadCache = await loadFromCache();

      if (hadCache) {
        setIsLoading(false);
      }

      // Fetch fresh data from API if online
      if (syncService.getOnlineStatus()) {
        await fetchFromApi();
      } else if (!hadCache) {
        setError('No cached data available. Connect to internet to load.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, [loadFromCache, fetchFromApi]);

  // Initial load
  useEffect(() => {
    if (autoFetch) {
      refresh();
    }
  }, [cacheKey]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, isLoading, isStale, lastSyncedAt, error, refresh };
}
