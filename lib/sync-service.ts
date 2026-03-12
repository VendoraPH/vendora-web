/**
 * Sync Service
 * Handles online/offline detection and background synchronization
 */

import { db, LocalTransaction, LocalProduct, LocalCategory, LocalCustomer, LocalStore } from './db';
import { orderService, paymentService, productService, categoryService, customerService, storeService } from '@/services';
import type { ApiProduct, ApiCategory, ApiCustomer, ApiStore } from '@/services';
import { networkMonitor } from './network-quality-monitor';
import { localDb } from './local-first-service';
import {
  getOnlineStatus,
  setOnlineStatus,
  onOnlineStatusChange,
} from './online-status';

// Re-export so existing importers of sync-service still work
export { getOnlineStatus, onOnlineStatusChange };

// ==================== Online/Offline Detection ====================

/**
 * Check if user is authenticated before making any API calls.
 * Prevents 401 loops on the login page.
 */
function isAuthenticated(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return !!localStorage.getItem('vendora_access_token');
}

/**
 * Check if network quality is good enough for syncing.
 */
function isNetworkGoodForSync(): boolean {
  const stats = networkMonitor.getCurrentStats();
  return stats.quality !== 'offline';
}

/**
 * Initialize online/offline listeners
 */
export function initializeOnlineDetection() {
  if (typeof window === 'undefined') return;

  const updateOnlineStatus = () => {
    const online = navigator.onLine;
    setOnlineStatus(online);

    if (online && isAuthenticated()) {
      console.log('✅ Connection restored - starting full sync...');
      fullSync().catch(console.error);
    } else if (!online) {
      console.log('❌ Connection lost - working offline');
    }
  };

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);

  // Initial check — only update online state, don't sync on page load
  setOnlineStatus(navigator.onLine);
}

// ==================== Data Caching (API → IndexedDB) ====================

/**
 * Cache products from API to IndexedDB
 */
export async function cacheProducts(products: ApiProduct[]): Promise<void> {
  const now = new Date();
  const localProducts: LocalProduct[] = products.map(p => ({
    id: p.id,
    _status: 'synced' as const,
    _lastModified: now,
    name: p.name,
    description: p.description,
    sku: p.sku,
    barcode: p.barcode || null,
    price: p.price,
    cost: p.cost,
    stock: p.stock,
    min_stock: p.min_stock,
    category_id: p.category?.id || null,
    category_name: p.category?.name,
    unit: (p as any).unit || 'pc',
    image_url: p.image || (p as any).image_url,
    is_active: p.is_active !== false,
    is_ecommerce: p.is_ecommerce,
    last_synced: now
  }));

  await db.products.bulkPut(localProducts);
  console.log(`✅ Cached ${products.length} products to IndexedDB`);
}

/**
 * Cache categories from API to IndexedDB
 */
export async function cacheCategories(categories: ApiCategory[]): Promise<void> {
  const localCategories: LocalCategory[] = categories.map(c => ({
    id: c.id,
    name: c.name,
    description: c.description,
    last_synced: new Date()
  }));

  await db.categories.bulkPut(localCategories);
  console.log(`✅ Cached ${categories.length} categories to IndexedDB`);
}

/**
 * Cache customers from API to IndexedDB
 */
export async function cacheCustomers(customers: ApiCustomer[]): Promise<void> {
  const now = new Date();
  const localCustomers: LocalCustomer[] = customers.map(c => ({
    id: c.id,
    _status: 'synced' as const,
    _lastModified: now,
    name: c.name,
    email: c.email || undefined,
    phone: c.phone || undefined,
    status: c.status as string,
    orders_count: c.orders_count,
    total_spent: c.total_spent,
    created_at: c.created_at,
    last_synced: now
  }));

  await db.customers.bulkPut(localCustomers);
  console.log(`✅ Cached ${customers.length} customers to IndexedDB`);
}

/**
 * Cache stores from API to IndexedDB
 */
export async function cacheStores(stores: ApiStore[]): Promise<void> {
  const localStores: LocalStore[] = stores.map(s => ({
    id: s.id,
    name: s.name,
    is_active: s.is_active !== false,
    last_synced: new Date()
  }));

  await db.stores.bulkPut(localStores);
  console.log(`✅ Cached ${stores.length} stores to IndexedDB`);
}

// ==================== Transaction Sync ====================

/**
 * Save transaction locally (offline-first)
 */
export async function saveTransactionLocally(transaction: Omit<LocalTransaction, 'uuid' | 'created_at' | 'synced' | 'sync_attempts'>): Promise<string> {
  const uuid = crypto.randomUUID();

  const localTransaction: LocalTransaction = {
    ...transaction,
    uuid,
    created_at: new Date(),
    synced: false,
    sync_attempts: 0
  };

  await db.transactions.add(localTransaction);
  console.log(`💾 Transaction saved locally: ${uuid}`);

  // Try to sync immediately if online
  if (getOnlineStatus()) {
    syncSingleTransaction(uuid).catch(err => {
      console.error(`Failed to sync transaction immediately:`, err);
      // Already in local DB, will retry later
    });
  }

  return uuid;
}

/**
 * Sync single transaction to server
 */
export async function syncSingleTransaction(uuid: string): Promise<void> {
  const transaction = await db.transactions.get(uuid);

  if (!transaction) {
    throw new Error(`Transaction ${uuid} not found`);
  }

  if (transaction.synced) {
    console.log(`Transaction ${uuid} already synced`);
    return;
  }

  try {
    // Create order on server
    const isCredit = transaction.is_credit === true;

    const orderPayload: Record<string, any> = {
      customer_id: transaction.customer_id,
      ordered_at: transaction.ordered_at,
      status: transaction.status,
      items: transaction.items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
      }))
    };

    // Only include store_id if set — sending null/undefined causes 422
    if (transaction.store_id) {
      orderPayload.store_id = transaction.store_id;
    }

    // Credit orders: include payment_method + credit_customer so the backend
    // handles customer creation/update, credit_balance increment, payment, and ledger
    if (isCredit && transaction.credit_customer) {
      orderPayload.payment_method = 'credit';
      orderPayload.credit_customer = transaction.credit_customer;
    }

    const order = await orderService.create(orderPayload as any);
    console.log(`✅ Order created on server: ${order.id}`);

    // Create payment(s) on server (credit payments are already handled by the order endpoint)
    const paymentTime = new Date(transaction.created_at);
    const paidAt = `${paymentTime.toISOString().split('T')[0]} ${paymentTime.toTimeString().slice(0, 5)}`;

    if (isCredit) {
      // No separate payment call needed — POST /api/orders with payment_method:'credit'
      // already creates the payment record, ledger entry, and updates credit_balance
      console.log(`✅ Credit order synced (order ${order.id}) — payment handled by order endpoint`);
    } else if (transaction.payment_methods && transaction.payment_methods.length > 1) {
      // Split payment
      await Promise.all(
        transaction.payment_methods.map(pm =>
          paymentService.create({
            order_id: order.id as unknown as number,
            amount: Math.round(pm.amount),
            method: pm.method,
            status: 'completed',
            paid_at: paidAt
          })
        )
      );
      console.log(`✅ Split payments created on server`);
    } else {
      // Single payment
      await paymentService.create({
        order_id: order.id as unknown as number,
        amount: Math.round(transaction.amount_tendered),
        method: transaction.payment_method,
        status: 'completed',
        paid_at: paidAt
      });
      console.log(`✅ Payment created on server`);
    }

    // Update inventory (non-blocking)
    productService.bulkStockDecrement({
      items: transaction.items.map(item => ({
        productId: item.product_id,
        quantity: item.quantity,
        variantSku: null
      })),
      orderId: `ORD-${order.id}`
    }).catch(() => {
      console.warn('Inventory update failed (non-critical)');
    });

    // Mark as synced
    await db.transactions.update(uuid, {
      synced: true,
      synced_at: new Date(),
      order_id: order.id as unknown as number,
      last_sync_error: undefined
    });

    console.log(`✅ Transaction ${uuid} synced successfully`);

  } catch (err: any) {
    // Increment sync attempts
    await db.transactions.update(uuid, {
      sync_attempts: transaction.sync_attempts + 1,
      last_sync_error: err?.message || 'Unknown error'
    });

    const responseData = err?.response?.data;
    console.error(`❌ Failed to sync transaction ${uuid} — raw error:`, err);
    console.error(`❌ Sync error details:`, {
      type: typeof err,
      isAxiosError: err?.isAxiosError,
      status: err?.response?.status,
      statusText: err?.response?.statusText,
      message: responseData?.message || err?.message,
      errors: responseData?.errors || null,
      responseData: JSON.stringify(responseData, null, 2),
    });
    console.error(`❌ Transaction payload that failed:`, JSON.stringify({
      customer_id: transaction.customer_id,
      ordered_at: transaction.ordered_at,
      status: transaction.status,
      store_id: transaction.store_id,
      total: Math.round(transaction.total),
      items: transaction.items,
    }, null, 2));
    throw err;
  }
}

/**
 * Calculate exponential backoff delay
 */
function getBackoffDelay(retryCount: number): number {
  const baseDelay = 1000; // 1 second
  const maxDelay = 60000; // 60 seconds
  const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
  // Add jitter (0-25% of delay)
  return delay + Math.random() * delay * 0.25;
}

const MAX_RETRIES = 5;

/**
 * Sync all pending transactions (batch) with exponential backoff
 */
export async function syncPendingTransactions(
  onProgress?: (synced: number, total: number) => void
): Promise<{ synced: number; failed: number }> {
  const allTransactions = await db.transactions.toArray();
  const pending = allTransactions.filter(t =>
    t.synced === false && t.sync_attempts < MAX_RETRIES
  );

  if (pending.length === 0) {
    return { synced: 0, failed: 0 };
  }

  // Check network quality before syncing
  if (!isNetworkGoodForSync()) {
    const stats = networkMonitor.getCurrentStats();
    console.log(`Skipping sync - network quality is ${stats.quality}`);
    return { synced: 0, failed: 0 };
  }

  console.log(`Syncing ${pending.length} pending transactions...`);

  let synced = 0;
  let failed = 0;

  // Process sequentially with backoff for failures
  for (const txn of pending) {
    // Check if enough time has passed since last retry (backoff)
    if (txn.sync_attempts > 0) {
      const backoffDelay = getBackoffDelay(txn.sync_attempts - 1);
      const timeSinceLastAttempt = Date.now() - new Date(txn.created_at).getTime();
      if (timeSinceLastAttempt < backoffDelay) {
        continue; // Skip - not enough time since last attempt
      }
    }

    try {
      await syncSingleTransaction(txn.uuid);
      synced++;
    } catch {
      failed++;
    }

    if (onProgress) {
      onProgress(synced, pending.length);
    }

    // Small delay between transactions
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`Sync complete: ${synced} synced, ${failed} failed`);

  // Log sync result
  await db.syncLogs.add({
    type: 'manual',
    status: failed === 0 ? 'success' : 'partial',
    items_synced: synced,
    items_failed: failed,
    started_at: new Date(),
    completed_at: new Date()
  });

  return { synced, failed };
}

// ==================== Background Sync ====================

let syncInterval: NodeJS.Timeout | null = null;

/**
 * Start automatic background sync (every 5 minutes)
 */
export function startBackgroundSync() {
  if (syncInterval) {
    console.log('Background sync already running');
    return;
  }

  console.log('🔄 Starting background sync (every 5 minutes)');

  syncInterval = setInterval(() => {
    if (getOnlineStatus() && isAuthenticated()) {
      fullSync().catch(err => {
        console.error('Background sync failed:', err);
      });
    }
  }, 5 * 60 * 1000); // 5 minutes
}

/**
 * Stop background sync
 */
export function stopBackgroundSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('⏹️ Background sync stopped');
  }
}

// ==================== Full Data Sync ====================

/**
 * Full sync: Fetch fresh data from API and cache to IndexedDB
 */
export async function fullDataSync(): Promise<void> {
  if (!getOnlineStatus() || !isAuthenticated()) {
    console.log('Offline or unauthenticated - skipping full data sync');
    return;
  }

  console.log('🔄 Starting full data sync...');

  try {
    const startTime = Date.now();

    // Fetch all data in parallel
    const [productsResponse, categoriesResponse, customersResponse, storesResponse] = await Promise.allSettled([
      productService.getMy({ per_page: 1000 }),
      categoryService.getAll(),
      customerService.getAll({ per_page: 100 }),
      storeService.getAll()
    ]);

    // Extract data
    const extractData = <T,>(response: any): T[] => {
      if (!response || response.status === 'rejected') return [];
      const value = response.value;
      if (Array.isArray(value)) return value;
      if (value && typeof value === 'object' && 'data' in value && Array.isArray(value.data)) {
        return value.data;
      }
      return [];
    };

    const products = extractData<ApiProduct>(productsResponse);
    const categories = extractData<ApiCategory>(categoriesResponse);
    const customers = extractData<ApiCustomer>(customersResponse);
    const stores = extractData<ApiStore>(storesResponse);

    // Cache to IndexedDB
    await Promise.all([
      cacheProducts(products),
      cacheCategories(categories),
      cacheCustomers(customers),
      cacheStores(stores)
    ]);

    const elapsed = Date.now() - startTime;
    console.log(`✅ Full sync complete in ${elapsed}ms`);

    // Log sync
    await db.syncLogs.add({
      type: 'full',
      status: 'success',
      items_synced: products.length + categories.length + customers.length + stores.length,
      items_failed: 0,
      started_at: new Date(startTime),
      completed_at: new Date()
    });

  } catch (err: any) {
    console.error('Full data sync failed:', err);

    // Log failure
    await db.syncLogs.add({
      type: 'full',
      status: 'failed',
      items_synced: 0,
      items_failed: 1,
      started_at: new Date(),
      completed_at: new Date(),
      error: err?.message
    });

    throw err;
  }
}

// ==================== Local-First Sync ====================

/**
 * Push all dirty records from all local-first tables to the server
 */
export async function pushAllDirty(): Promise<{ synced: number; failed: number }> {
  let totalSynced = 0;
  let totalFailed = 0;

  // Push products and customers (entities with CRUD)
  const [productResult, customerResult] = await Promise.allSettled([
    localDb.products.pushDirty(),
    localDb.customers.pushDirty(),
  ]);

  if (productResult.status === 'fulfilled') {
    totalSynced += productResult.value.synced;
    totalFailed += productResult.value.failed;
  }
  if (customerResult.status === 'fulfilled') {
    totalSynced += customerResult.value.synced;
    totalFailed += customerResult.value.failed;
  }

  // Also sync pending POS transactions
  const txnResult = await syncPendingTransactions();
  totalSynced += txnResult.synced;
  totalFailed += txnResult.failed;

  console.log(`📤 pushAllDirty complete: ${totalSynced} synced, ${totalFailed} failed`);
  return { synced: totalSynced, failed: totalFailed };
}

/**
 * Pull fresh data from the server for all entities
 */
export async function pullAllFresh(): Promise<void> {
  const results = await Promise.allSettled([
    localDb.products.pullFresh(),
    localDb.customers.pullFresh(),
    localDb.orders.pullFresh(),
    localDb.payments.pullFresh(),
    localDb.categories.pullFresh(),
    localDb.stores.pullFresh(),
  ]);

  const failed = results.filter(r => r.status === 'rejected');
  if (failed.length > 0) {
    console.warn(`⚠️ pullAllFresh: ${failed.length} entity pulls failed`);
  }
  console.log(`📥 pullAllFresh complete`);
}

/**
 * Full sync: push local changes first, then pull remote changes
 */
export async function fullSync(): Promise<{ synced: number; failed: number }> {
  if (!getOnlineStatus() || !isAuthenticated()) {
    console.log('Offline or unauthenticated - skipping full sync');
    return { synced: 0, failed: 0 };
  }

  if (!isNetworkGoodForSync()) {
    console.log('Network too poor for sync');
    return { synced: 0, failed: 0 };
  }

  console.log('🔄 Starting full sync (push → pull)...');
  const startTime = Date.now();

  // 1. Push local changes to server
  const pushResult = await pushAllDirty();

  // 2. Pull fresh data from server
  await pullAllFresh();

  const elapsed = Date.now() - startTime;
  console.log(`✅ Full sync complete in ${elapsed}ms`);

  // Log sync result
  await db.syncLogs.add({
    type: 'full',
    status: pushResult.failed === 0 ? 'success' : 'partial',
    items_synced: pushResult.synced,
    items_failed: pushResult.failed,
    started_at: new Date(startTime),
    completed_at: new Date(),
  });

  return pushResult;
}

// ==================== Exports ====================

export const syncService = {
  // Online/Offline
  initializeOnlineDetection,
  onOnlineStatusChange,
  getOnlineStatus,

  // Caching (legacy - kept for backwards compatibility)
  cacheProducts,
  cacheCategories,
  cacheCustomers,
  cacheStores,

  // Transaction Sync
  saveTransactionLocally,
  syncSingleTransaction,
  syncPendingTransactions,

  // Background Sync
  startBackgroundSync,
  stopBackgroundSync,

  // Full Sync (legacy)
  fullDataSync,

  // Local-First Sync
  pushAllDirty,
  pullAllFresh,
  fullSync,
};
