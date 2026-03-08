"use client"

/**
 * Reactive local-data hooks using Dexie liveQuery.
 * Auto-updates when IndexedDB changes (even from other tabs).
 */

import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useRef } from 'react';
import { db, type LocalProduct, type LocalCustomer, type LocalOrder, type LocalPayment } from '@/lib/db';
import { localDb } from '@/lib/local-first-service';
import { getOnlineStatus } from '@/lib/sync-service';

// ==================== Products ====================

export function useLocalProducts() {
  const pulledRef = useRef(false);

  const data = useLiveQuery(
    () => db.products.where('_status').notEqual('deleted').toArray(),
    [],
    [] as LocalProduct[]
  );

  const dirtyCount = useLiveQuery(
    () => db.products.where('_status').notEqual('synced').count(),
    [],
    0
  );

  // Pull fresh + push any unsynced products on mount if online
  useEffect(() => {
    if (pulledRef.current) return;
    pulledRef.current = true;
    if (getOnlineStatus()) {
      localDb.products.pushDirty().catch(console.error);
      localDb.products.pullFresh().catch(console.error);
    }
  }, []);

  return {
    data: data ?? [],
    isLoading: data === undefined,
    dirtyCount: dirtyCount ?? 0,
  };
}

// ==================== Customers ====================

export function useLocalCustomers() {
  const pulledRef = useRef(false);

  const data = useLiveQuery(
    () => db.customers.where('_status').notEqual('deleted').toArray(),
    [],
    [] as LocalCustomer[]
  );

  const dirtyCount = useLiveQuery(
    () => db.customers.where('_status').notEqual('synced').count(),
    [],
    0
  );

  useEffect(() => {
    if (pulledRef.current) return;
    pulledRef.current = true;
    if (getOnlineStatus()) {
      localDb.customers.pullFresh().catch(console.error);
    }
  }, []);

  return {
    data: data ?? [],
    isLoading: data === undefined,
    dirtyCount: dirtyCount ?? 0,
  };
}

// ==================== Orders ====================

export function useLocalOrders() {
  const pulledRef = useRef(false);

  const data = useLiveQuery(
    () => db.orders.where('_status').notEqual('deleted').toArray(),
    [],
    [] as LocalOrder[]
  );

  const dirtyCount = useLiveQuery(
    () => db.orders.where('_status').notEqual('synced').count(),
    [],
    0
  );

  useEffect(() => {
    if (pulledRef.current) return;
    pulledRef.current = true;
    if (getOnlineStatus()) {
      localDb.orders.pullFresh().catch(console.error);
    }
  }, []);

  return {
    data: data ?? [],
    isLoading: data === undefined,
    dirtyCount: dirtyCount ?? 0,
  };
}

// ==================== Payments ====================

export function useLocalPayments() {
  const pulledRef = useRef(false);

  const data = useLiveQuery(
    () => db.payments.where('_status').notEqual('deleted').toArray(),
    [],
    [] as LocalPayment[]
  );

  const dirtyCount = useLiveQuery(
    () => db.payments.where('_status').notEqual('synced').count(),
    [],
    0
  );

  useEffect(() => {
    if (pulledRef.current) return;
    pulledRef.current = true;
    if (getOnlineStatus()) {
      localDb.payments.pullFresh().catch(console.error);
    }
  }, []);

  return {
    data: data ?? [],
    isLoading: data === undefined,
    dirtyCount: dirtyCount ?? 0,
  };
}
