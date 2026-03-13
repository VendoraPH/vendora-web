/**
 * IndexedDB Database using Dexie.js
 * Local-first storage for offline POS functionality
 */

import Dexie, { Table } from 'dexie';

// ==================== Sync Status Tracking ====================

export type SyncStatus = 'synced' | 'created' | 'updated' | 'deleted';

// ==================== Local Data Models ====================

/**
 * Local Product (cached from API, with local-first tracking)
 */
export interface LocalProduct {
  id: number;
  _localId?: string;
  _status: SyncStatus;
  _lastModified: Date;
  _syncError?: string;
  name: string;
  description?: string;
  sku: string;
  barcode: string | null;
  price: number;
  cost?: number;
  stock: number;
  min_stock?: number;
  category_id: number | null;
  category_name?: string;
  unit: string;
  image_url?: string;
  is_active: boolean;
  is_ecommerce?: boolean;
  last_synced: Date;
}

/**
 * Local Category (cached from API)
 */
export interface LocalCategory {
  id: number;
  name: string;
  description?: string;
  last_synced: Date;
}

/**
 * Local Customer (cached from API, with local-first tracking)
 */
export interface LocalCustomer {
  id: number;
  _localId?: string;
  _status: SyncStatus;
  _lastModified: Date;
  _syncError?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  status: string;
  orders_count?: number;
  total_spent?: number;
  created_at?: string;
  last_synced: Date;
}

/**
 * Local Store (cached from API)
 */
export interface LocalStore {
  id: number;
  name: string;
  is_active: boolean;
  last_synced: Date;
}

/**
 * Local Order (cached from API + locally created via POS transactions)
 */
export interface LocalOrder {
  id: number;
  _localId?: string;
  _status: SyncStatus;
  _lastModified: Date;
  _syncError?: string;
  order_number?: string;
  customer_id?: number;
  customer_name?: string;
  ordered_at?: string;
  status: string;
  total: number;
  subtotal?: number;
  tax?: number;
  discount?: number;
  delivery_fee?: number;
  payment_method?: string;
  items_count?: number;
  items?: Array<{
    product_id: number;
    product_name?: string;
    quantity: number;
    price: number;
  }>;
  created_at?: string;
  last_synced: Date;
}

/**
 * Local Payment (cached from API + locally created via POS transactions)
 */
export interface LocalPayment {
  id: number;
  _localId?: string;
  _status: SyncStatus;
  _lastModified: Date;
  _syncError?: string;
  payment_number?: string;
  order_id: number | null;
  order_number?: string | null;
  customer_id?: number | null;
  customer_name?: string;
  amount: number;
  method: string;
  status: string;
  paid_at?: string;
  created_at?: string;
  last_synced: Date;
}

/**
 * Pending file upload for offline-created products
 */
export interface PendingUpload {
  id?: number;
  entityType: 'product';
  entityLocalId: string;
  fileData: Blob;
  fileName: string;
  mimeType: string;
  status: 'pending' | 'uploaded' | 'failed';
  createdAt: Date;
}

/**
 * Local Transaction (created offline, pending sync)
 */
export interface LocalTransaction {
  uuid: string;                    // Unique identifier (prevents duplicates)
  local_id?: number;               // Auto-increment local ID
  order_id?: number;               // Server order ID (after sync)
  customer_id: number | null;
  customer_name: string;
  ordered_at: string;              // ISO date string
  status: 'pending' | 'completed' | 'failed';

  // Order items
  items: Array<{
    product_id: number;
    product_name: string;
    quantity: number;
    price: number;
  }>;

  // Totals
  subtotal: number;
  discount: number;
  tax: number;
  delivery_fee: number;
  total: number;

  // Payment info
  payment_method: 'cash' | 'card' | 'online';
  payment_methods?: Array<{
    method: 'cash' | 'card' | 'online';
    amount: number;
  }>;
  amount_tendered: number;
  change: number;

  // Credit info (for credit sales — synced as payment_method: 'credit' + credit_customer)
  is_credit?: boolean;
  credit_customer?: {
    first_name: string;
    last_name: string;
    middle_name?: string;
    contact_number?: string;
    address?: string;
  };

  // Metadata
  store_id?: number;
  notes?: string;
  created_at: Date;
  synced: boolean;
  synced_at?: Date;
  sync_attempts: number;
  last_sync_error?: string;
}

/**
 * Sync Queue (failed API calls to retry)
 */
export interface SyncQueueItem {
  id?: number;                     // Auto-increment
  uuid: string;                    // Transaction UUID
  type: 'transaction' | 'inventory' | 'customer';
  action: 'create' | 'update' | 'delete';
  payload: any;                    // Data to send to API
  status: 'pending' | 'processing' | 'failed' | 'completed';
  retry_count: number;
  max_retries: number;
  last_attempt?: Date;
  last_error?: string;
  created_at: Date;
  priority: number;                // Higher = more urgent
}

/**
 * Sync Log (track sync history)
 */
export interface SyncLog {
  id?: number;
  type: 'full' | 'incremental' | 'manual';
  status: 'success' | 'partial' | 'failed';
  items_synced: number;
  items_failed: number;
  started_at: Date;
  completed_at?: Date;
  error?: string;
}

/**
 * Cached Credentials (for offline login)
 */
export interface CachedCredential {
  email: string;
  passwordHash: string;
  userName: string;
  userEmail: string;
  userProfile: string; // JSON stringified profile
  cachedAt: Date;
}

/**
 * Generic Data Cache (for dashboard KPIs, orders, payments, etc.)
 */
export interface CachedData {
  key: string;
  data: string; // JSON stringified
  lastSyncedAt: Date;
}

// ==================== Dexie Database Class ====================

export class VendoraPOSDB extends Dexie {
  // Tables
  products!: Table<LocalProduct, number>;
  categories!: Table<LocalCategory, number>;
  customers!: Table<LocalCustomer, number>;
  stores!: Table<LocalStore, number>;
  orders!: Table<LocalOrder, number>;
  payments!: Table<LocalPayment, number>;
  pendingUploads!: Table<PendingUpload, number>;
  transactions!: Table<LocalTransaction, string>;
  syncQueue!: Table<SyncQueueItem, number>;
  syncLogs!: Table<SyncLog, number>;
  cachedCredentials!: Table<CachedCredential, string>;
  cachedData!: Table<CachedData, string>;

  constructor() {
    super('VendoraPOSDB');

    this.version(1).stores({
      products: 'id, barcode, sku, name, category_id, is_active, last_synced',
      categories: 'id, name, last_synced',
      customers: 'id, name, phone, status, last_synced',
      stores: 'id, name, is_active, last_synced',
      transactions: 'uuid, order_id, customer_id, synced, created_at, status',
      syncQueue: '++id, uuid, type, status, priority, created_at',
      syncLogs: '++id, type, status, started_at'
    });

    this.version(2).stores({
      products: 'id, barcode, sku, name, category_id, is_active, last_synced',
      categories: 'id, name, last_synced',
      customers: 'id, name, phone, status, last_synced',
      stores: 'id, name, is_active, last_synced',
      transactions: 'uuid, order_id, customer_id, synced, created_at, status',
      syncQueue: '++id, uuid, type, status, priority, created_at',
      syncLogs: '++id, type, status, started_at',
      cachedCredentials: 'email, cachedAt',
      cachedData: 'key, lastSyncedAt'
    });

    // v3: Add local-first tracking fields, orders, payments, pendingUploads tables
    this.version(3).stores({
      products: 'id, _localId, barcode, sku, name, category_id, is_active, _status, last_synced',
      categories: 'id, name, last_synced',
      customers: 'id, _localId, name, phone, status, _status, last_synced',
      stores: 'id, name, is_active, last_synced',
      orders: 'id, _localId, customer_id, status, _status, ordered_at, _lastModified',
      payments: 'id, _localId, order_id, method, _status, _lastModified',
      pendingUploads: '++id, entityType, entityLocalId, status, createdAt',
      transactions: 'uuid, order_id, customer_id, synced, created_at, status',
      syncQueue: '++id, uuid, type, status, priority, created_at',
      syncLogs: '++id, type, status, started_at',
      cachedCredentials: 'email, cachedAt',
      cachedData: 'key, lastSyncedAt'
    }).upgrade(tx => {
      // Migrate existing products: add tracking fields
      return tx.table('products').toCollection().modify(product => {
        if (!product._status) {
          product._status = 'synced';
          product._lastModified = new Date();
        }
      }).then(() => {
        // Migrate existing customers: add tracking fields
        return tx.table('customers').toCollection().modify(customer => {
          if (!customer._status) {
            customer._status = 'synced';
            customer._lastModified = new Date();
          }
        });
      });
    });
  }
}

// ==================== Database Instance ====================

// Create single database instance
export const db = new VendoraPOSDB();

// ==================== Helper Functions ====================

/**
 * Clear all data (for logout or reset)
 */
export async function clearDatabase() {
  await db.products.clear();
  await db.categories.clear();
  await db.customers.clear();
  await db.stores.clear();
  await db.orders.clear();
  await db.payments.clear();
  await db.pendingUploads.clear();
  await db.transactions.clear();
  await db.syncQueue.clear();
  await db.syncLogs.clear();
  await db.cachedCredentials.clear();
  await db.cachedData.clear();
}

/**
 * Get database storage usage
 */
export async function getDatabaseSize(): Promise<number> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return estimate.usage || 0;
  }
  return 0;
}

/**
 * Get storage quota
 */
export async function getStorageQuota(): Promise<{ usage: number; quota: number }> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0
    };
  }
  return { usage: 0, quota: 0 };
}

/**
 * Check if storage is persisted
 */
export async function isStoragePersisted(): Promise<boolean> {
  if ('storage' in navigator && 'persisted' in navigator.storage) {
    return await navigator.storage.persisted();
  }
  return false;
}

/**
 * Request persistent storage (prevents browser from clearing data)
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if ('storage' in navigator && 'persist' in navigator.storage) {
    return await navigator.storage.persist();
  }
  return false;
}

/**
 * Get pending transactions count
 */
export async function getPendingTransactionsCount(): Promise<number> {
  const items = await db.transactions.toArray();
  return items.filter(t => t.synced === false).length;
}

/**
 * Get dirty records count across all local-first tables
 */
export async function getDirtyRecordsCount(): Promise<number> {
  const [dirtyProducts, dirtyCustomers, dirtyOrders, dirtyPayments] = await Promise.all([
    db.products.where('_status').notEqual('synced').count(),
    db.customers.where('_status').notEqual('synced').count(),
    db.orders.where('_status').notEqual('synced').count(),
    db.payments.where('_status').notEqual('synced').count(),
  ]);
  return dirtyProducts + dirtyCustomers + dirtyOrders + dirtyPayments;
}

/**
 * Get sync queue count
 */
export async function getSyncQueueCount(): Promise<number> {
  const items = await db.syncQueue.toArray();
  return items.filter(s => s.status === 'pending').length;
}

/**
 * Get last sync time
 */
export async function getLastSyncTime(): Promise<Date | null> {
  const lastLog = await db.syncLogs
    .where('status')
    .equals('success')
    .reverse()
    .first();

  return lastLog?.completed_at || null;
}
