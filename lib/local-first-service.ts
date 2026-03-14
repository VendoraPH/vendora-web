/**
 * Local-First Service
 * Wraps IndexedDB operations and triggers background sync.
 * All UI reads/writes go through this service — API services are only called by sync logic.
 */

import {
  db,
  type LocalProduct,
  type LocalCustomer,
  type LocalOrder,
  type LocalPayment,
  type LocalCategory,
  type LocalStore,
  type SyncStatus,
} from './db';
import {
  productService,
  customerService,
  orderService,
  paymentService,
  categoryService,
  storeService,
  type ApiProduct,
  type ApiCustomer,
  type ApiPayment,
} from '@/services';
import api from '@/lib/api-client';
import { getOnlineStatus } from './online-status';

// ==================== Helpers ====================

function generateLocalId(): string {
  return crypto.randomUUID();
}

function generateTempId(): number {
  return -Date.now();
}

// ==================== Products ====================

const products = {
  async getAll(): Promise<LocalProduct[]> {
    return db.products.where('_status').notEqual('deleted').toArray();
  },

  async getById(id: number): Promise<LocalProduct | undefined> {
    const product = await db.products.get(id);
    if (product && product._status === 'deleted') return undefined;
    return product;
  },

  async getByBarcode(barcode: string): Promise<LocalProduct | undefined> {
    const product = await db.products.where('barcode').equals(barcode).first();
    if (product && product._status === 'deleted') return undefined;
    return product;
  },

  async getBySku(sku: string): Promise<LocalProduct | undefined> {
    const product = await db.products.where('sku').equals(sku).first();
    if (product && product._status === 'deleted') return undefined;
    return product;
  },

  async search(query: string): Promise<LocalProduct[]> {
    const q = query.toLowerCase();
    const all = await this.getAll();
    return all.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.toLowerCase().includes(q))
    );
  },

  async create(data: Partial<LocalProduct>, imageFile?: File): Promise<LocalProduct> {
    const localId = generateLocalId();
    const tempId = generateTempId();

    let imageUrl = data.image_url;
    if (imageFile) {
      // Store blob for offline upload
      await db.pendingUploads.add({
        entityType: 'product',
        entityLocalId: localId,
        fileData: imageFile,
        fileName: imageFile.name,
        mimeType: imageFile.type,
        status: 'pending',
        createdAt: new Date(),
      });
      imageUrl = URL.createObjectURL(imageFile);
    }

    const product: LocalProduct = {
      id: tempId,
      _localId: localId,
      _status: 'created',
      _lastModified: new Date(),
      name: data.name || '',
      description: data.description,
      sku: data.sku || '',
      barcode: data.barcode ?? null,
      price: data.price || 0,
      cost: data.cost,
      stock: data.stock || 0,
      min_stock: data.min_stock,
      category_id: data.category_id ?? null,
      category_name: data.category_name,
      unit: data.unit || 'pc',
      image_url: imageUrl,
      is_active: data.is_active !== false,
      is_ecommerce: data.is_ecommerce,
      last_synced: new Date(),
    };

    await db.products.add(product);

    // Try immediate sync if online
    if (getOnlineStatus()) {
      this.pushDirty().catch(console.error);
    }

    return product;
  },

  async update(id: number, changes: Partial<LocalProduct>, imageFile?: File): Promise<void> {
    const existing = await db.products.get(id);
    if (!existing) return;

    if (imageFile) {
      const localId = existing._localId || generateLocalId();
      // Remove old pending upload if any
      await db.pendingUploads
        .where({ entityType: 'product', entityLocalId: localId })
        .delete();

      await db.pendingUploads.add({
        entityType: 'product',
        entityLocalId: localId,
        fileData: imageFile,
        fileName: imageFile.name,
        mimeType: imageFile.type,
        status: 'pending',
        createdAt: new Date(),
      });
      changes.image_url = URL.createObjectURL(imageFile);
      if (!existing._localId) changes._localId = localId;
    }

    await db.products.update(id, {
      ...changes,
      _status: existing._status === 'created' ? 'created' : 'updated',
      _lastModified: new Date(),
      _syncError: undefined,
    });

    if (getOnlineStatus()) {
      this.pushDirty().catch(console.error);
    }
  },

  async delete(id: number): Promise<void> {
    const existing = await db.products.get(id);
    if (!existing) return;

    // If never synced (created locally), just remove entirely
    if (existing._status === 'created') {
      await db.products.delete(id);
      if (existing._localId) {
        await db.pendingUploads
          .where({ entityType: 'product', entityLocalId: existing._localId })
          .delete();
      }
      return;
    }

    await db.products.update(id, {
      _status: 'deleted' as SyncStatus,
      _lastModified: new Date(),
      _syncError: undefined,
    });

    if (getOnlineStatus()) {
      this.pushDirty().catch(console.error);
    }
  },

  async pushDirty(): Promise<{ synced: number; failed: number }> {
    const dirty = await db.products
      .where('_status')
      .notEqual('synced')
      .toArray();

    let synced = 0;
    let failed = 0;

    for (const product of dirty) {
      try {
        if (product._status === 'created') {
          // Build payload
          const payload: any = {
            name: product.name,
            sku: product.sku,
            price: product.price,
            stock: product.stock,
            category_id: product.category_id,
            unit: product.unit,
            is_active: product.is_active,
            currency: 'PHP',
          };
          if (product.description) payload.description = product.description;
          if (product.barcode) payload.barcode = product.barcode;
          if (product.cost) payload.cost = product.cost;
          if (product.min_stock) payload.min_stock = product.min_stock;
          if (product.is_ecommerce !== undefined) payload.is_ecommerce = product.is_ecommerce;

          // Check for pending image upload
          let imageFile: File | undefined;
          if (product._localId) {
            const upload = await db.pendingUploads
              .where({ entityType: 'product', entityLocalId: product._localId })
              .first();
            if (upload && upload.status === 'pending') {
              imageFile = new File([upload.fileData], upload.fileName, { type: upload.mimeType });
            }
          }

          let created: ApiProduct;
          if (imageFile) {
            const formData = new FormData();
            Object.entries(payload).forEach(([key, val]) => {
              if (val === undefined || val === null) return;
              if (typeof val === 'boolean') {
                formData.append(key, val ? '1' : '0');
              } else {
                formData.append(key, String(val));
              }
            });
            formData.append('image', imageFile);
            created = await api.upload<ApiProduct>('/products', formData);
          } else {
            created = await productService.create(payload);
          }

          // Delete temp record, insert with real ID
          await db.products.delete(product.id);
          await db.products.put({
            ...product,
            id: created.id,
            _status: 'synced',
            _lastModified: new Date(),
            _syncError: undefined,
            image_url: (created as any).image || (created as any).image_url || product.image_url,
            last_synced: new Date(),
          });

          // Mark upload as done
          if (product._localId) {
            await db.pendingUploads
              .where({ entityType: 'product', entityLocalId: product._localId })
              .modify({ status: 'uploaded' });
          }

        } else if (product._status === 'updated') {
          const payload: any = {
            name: product.name,
            sku: product.sku,
            price: product.price,
            stock: product.stock,
            category_id: product.category_id,
            unit: product.unit,
            is_active: product.is_active,
            currency: 'PHP',
          };
          if (product.description) payload.description = product.description;
          if (product.barcode) payload.barcode = product.barcode;
          if (product.cost) payload.cost = product.cost;
          if (product.min_stock) payload.min_stock = product.min_stock;
          if (product.is_ecommerce !== undefined) payload.is_ecommerce = product.is_ecommerce;

          let imageFile: File | undefined;
          if (product._localId) {
            const upload = await db.pendingUploads
              .where({ entityType: 'product', entityLocalId: product._localId })
              .first();
            if (upload && upload.status === 'pending') {
              imageFile = new File([upload.fileData], upload.fileName, { type: upload.mimeType });
            }
          }

          if (imageFile) {
            const formData = new FormData();
            Object.entries(payload).forEach(([key, val]) => {
              if (val === undefined || val === null) return;
              if (typeof val === 'boolean') {
                formData.append(key, val ? '1' : '0');
              } else {
                formData.append(key, String(val));
              }
            });
            formData.append('image', imageFile);
            await api.upload<ApiProduct>(`/products/${product.id}`, formData);
          } else {
            await productService.update(product.id, payload);
          }

          await db.products.update(product.id, {
            _status: 'synced' as SyncStatus,
            _lastModified: new Date(),
            _syncError: undefined,
            last_synced: new Date(),
          });

          if (product._localId) {
            await db.pendingUploads
              .where({ entityType: 'product', entityLocalId: product._localId })
              .modify({ status: 'uploaded' });
          }

        } else if (product._status === 'deleted') {
          await productService.delete(product.id);
          await db.products.delete(product.id);
        }

        synced++;
      } catch (err: any) {
        failed++;
        await db.products.update(product.id, {
          _syncError: err?.message || 'Sync failed',
        });
        console.error(`Failed to sync product ${product.id}:`, err);
      }
    }

    return { synced, failed };
  },

  async pullFresh(): Promise<void> {
    try {
      const response = await productService.getMy({ per_page: 1000 });
      const apiProducts: ApiProduct[] = Array.isArray(response)
        ? response
        : (response as any)?.data || [];

      // Get IDs of locally dirty records to skip
      const dirtyIds = new Set(
        (await db.products.where('_status').notEqual('synced').toArray())
          .filter(p => p.id > 0) // Only real server IDs
          .map(p => p.id)
      );

      const now = new Date();
      for (const p of apiProducts) {
        if (dirtyIds.has(p.id)) continue; // Don't overwrite unsynced local changes

        await db.products.put({
          id: p.id,
          _status: 'synced',
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
          last_synced: now,
        });
      }

      // Remove locally-synced records that no longer exist on server
      const serverIds = new Set(apiProducts.map(p => p.id));
      const allLocal = await db.products.where('_status').equals('synced').toArray();
      for (const local of allLocal) {
        if (local.id > 0 && !serverIds.has(local.id)) {
          await db.products.delete(local.id);
        }
      }

      console.log(`✅ Pulled ${apiProducts.length} products from server`);
    } catch (err) {
      console.error('Failed to pull products:', err);
    }
  },
};

// ==================== Customers ====================

const customers = {
  async getAll(): Promise<LocalCustomer[]> {
    return db.customers.where('_status').notEqual('deleted').toArray();
  },

  async getById(id: number): Promise<LocalCustomer | undefined> {
    const customer = await db.customers.get(id);
    if (customer && customer._status === 'deleted') return undefined;
    return customer;
  },

  async search(query: string): Promise<LocalCustomer[]> {
    const q = query.toLowerCase();
    const all = await this.getAll();
    return all.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q))
    );
  },

  async create(data: Partial<LocalCustomer>): Promise<LocalCustomer> {
    const localId = generateLocalId();
    const tempId = generateTempId();

    const customer: LocalCustomer = {
      id: tempId,
      _localId: localId,
      _status: 'created',
      _lastModified: new Date(),
      name: data.name || '',
      email: data.email,
      phone: data.phone,
      address: data.address,
      status: data.status || 'active',
      orders_count: 0,
      total_spent: 0,
      created_at: new Date().toISOString(),
      last_synced: new Date(),
    };

    await db.customers.add(customer);

    if (getOnlineStatus()) {
      this.pushDirty().catch(console.error);
    }

    return customer;
  },

  async update(id: number, changes: Partial<LocalCustomer>): Promise<void> {
    const existing = await db.customers.get(id);
    if (!existing) return;

    await db.customers.update(id, {
      ...changes,
      _status: existing._status === 'created' ? 'created' : 'updated',
      _lastModified: new Date(),
      _syncError: undefined,
    });

    if (getOnlineStatus()) {
      this.pushDirty().catch(console.error);
    }
  },

  async delete(id: number): Promise<void> {
    const existing = await db.customers.get(id);
    if (!existing) return;

    if (existing._status === 'created') {
      await db.customers.delete(id);
      return;
    }

    await db.customers.update(id, {
      _status: 'deleted' as SyncStatus,
      _lastModified: new Date(),
      _syncError: undefined,
    });

    if (getOnlineStatus()) {
      this.pushDirty().catch(console.error);
    }
  },

  async pushDirty(): Promise<{ synced: number; failed: number }> {
    const dirty = await db.customers
      .where('_status')
      .notEqual('synced')
      .toArray();

    let synced = 0;
    let failed = 0;

    for (const customer of dirty) {
      try {
        if (customer._status === 'created') {
          const payload = {
            name: customer.name,
            email: customer.email || null,
            phone: customer.phone || null,
            status: customer.status as any,
          };

          const created: ApiCustomer = await customerService.create(payload);

          await db.customers.delete(customer.id);
          await db.customers.put({
            ...customer,
            id: created.id,
            _status: 'synced',
            _lastModified: new Date(),
            _syncError: undefined,
            orders_count: created.orders_count,
            total_spent: created.total_spent,
            created_at: created.created_at,
            last_synced: new Date(),
          });

        } else if (customer._status === 'updated') {
          const payload = {
            name: customer.name,
            email: customer.email || null,
            phone: customer.phone || null,
            status: customer.status as any,
          };

          await customerService.update(customer.id, payload);

          await db.customers.update(customer.id, {
            _status: 'synced' as SyncStatus,
            _lastModified: new Date(),
            _syncError: undefined,
            last_synced: new Date(),
          });

        } else if (customer._status === 'deleted') {
          await customerService.delete(customer.id);
          await db.customers.delete(customer.id);
        }

        synced++;
      } catch (err: any) {
        failed++;
        await db.customers.update(customer.id, {
          _syncError: err?.message || 'Sync failed',
        });
        console.error(`Failed to sync customer ${customer.id}:`, err);
      }
    }

    return { synced, failed };
  },

  async pullFresh(): Promise<void> {
    try {
      const response = await customerService.getAll({ per_page: 500 });
      const apiCustomers: ApiCustomer[] = Array.isArray(response)
        ? response
        : (response as any)?.data || [];

      const dirtyIds = new Set(
        (await db.customers.where('_status').notEqual('synced').toArray())
          .filter(c => c.id > 0)
          .map(c => c.id)
      );

      const now = new Date();
      for (const c of apiCustomers) {
        if (dirtyIds.has(c.id)) continue;

        await db.customers.put({
          id: c.id,
          _status: 'synced',
          _lastModified: now,
          name: c.name,
          email: c.email || undefined,
          phone: c.phone || undefined,
          status: c.status,
          orders_count: c.orders_count,
          total_spent: c.total_spent,
          created_at: c.created_at,
          last_synced: now,
        });
      }

      // Remove synced records no longer on server
      const serverIds = new Set(apiCustomers.map(c => c.id));
      const allLocal = await db.customers.where('_status').equals('synced').toArray();
      for (const local of allLocal) {
        if (local.id > 0 && !serverIds.has(local.id)) {
          await db.customers.delete(local.id);
        }
      }

      console.log(`✅ Pulled ${apiCustomers.length} customers from server`);
    } catch (err) {
      console.error('Failed to pull customers:', err);
    }
  },
};

// ==================== Orders (read-heavy, writes come from POS transactions) ====================

const orders = {
  async getAll(): Promise<LocalOrder[]> {
    return db.orders.where('_status').notEqual('deleted').toArray();
  },

  async getById(id: number): Promise<LocalOrder | undefined> {
    return db.orders.get(id);
  },

  async addFromTransaction(data: {
    id?: number;
    order_number?: string;
    customer_id: number;
    customer_name: string;
    ordered_at: string;
    status: string;
    total: number;
    subtotal?: number;
    tax?: number;
    discount?: number;
    delivery_fee?: number;
    payment_method?: string;
    items: Array<{ product_id: number; product_name?: string; quantity: number; price: number }>;
  }): Promise<void> {
    const localId = generateLocalId();
    await db.orders.put({
      id: data.id || generateTempId(),
      _localId: localId,
      _status: data.id ? 'synced' : 'created',
      _lastModified: new Date(),
      order_number: data.order_number,
      customer_id: data.customer_id,
      customer_name: data.customer_name,
      ordered_at: data.ordered_at,
      status: data.status,
      total: data.total,
      subtotal: data.subtotal,
      tax: data.tax,
      discount: data.discount,
      delivery_fee: data.delivery_fee,
      payment_method: data.payment_method,
      items_count: data.items.length,
      items: data.items,
      created_at: new Date().toISOString(),
      last_synced: new Date(),
    });
  },

  async pullFresh(): Promise<void> {
    try {
      const response = await orderService.getAll({ per_page: 100 } as any);
      const apiOrders = Array.isArray(response)
        ? response
        : (response as any)?.data || [];

      const dirtyIds = new Set(
        (await db.orders.where('_status').notEqual('synced').toArray())
          .filter(o => o.id > 0)
          .map(o => o.id)
      );

      // Build a set of server order numbers to clean up local TXN-* duplicates later
      const serverOrderNumbers = new Set<string>();

      const now = new Date();
      for (const o of apiOrders) {
        const orderId = (o as any).id;
        if (dirtyIds.has(orderId)) continue;

        const orderNumber = (o as any).order_number || (o as any).orderNumber || '';
        if (orderNumber) serverOrderNumbers.add(orderNumber);

        // Resolve customer name — API may return customer as string or object
        const rawCustomer = (o as any).customer;
        const customerName = typeof rawCustomer === 'string'
          ? rawCustomer
          : rawCustomer?.name || (o as any).customer_name || 'Walk-in';

        // API returns monetary values in raw cents — store as-is; formatCurrency() handles /100
        await db.orders.put({
          id: orderId,
          _status: 'synced',
          _lastModified: now,
          order_number: orderNumber,
          customer_id: (o as any).customer_id || (typeof rawCustomer === 'object' ? rawCustomer?.id : undefined),
          customer_name: customerName,
          ordered_at: (o as any).ordered_at || (o as any).created_at,
          status: (o as any).status || 'pending',
          total: Number((o as any).total || 0),
          subtotal: Number((o as any).subtotal || 0),
          tax: Number((o as any).tax || 0),
          discount: Number((o as any).discount || 0),
          delivery_fee: Number((o as any).delivery_fee || 0),
          payment_method: (o as any).payment_method,
          items_count: Array.isArray((o as any).items)
            ? (o as any).items.length
            : Number((o as any).items_count || 0),
          items: Array.isArray((o as any).items) ? (o as any).items : undefined,
          created_at: (o as any).created_at,
          last_synced: now,
        });
      }

      // Clean up synced records no longer on server
      const serverIds = new Set(apiOrders.map((o: any) => o.id));
      const allLocal = await db.orders.where('_status').equals('synced').toArray();
      for (const local of allLocal) {
        if (local.id > 0 && !serverIds.has(local.id)) {
          await db.orders.delete(local.id);
        }
      }

      // Clean up local TXN-* orders that have been synced to the server
      // (they show as duplicates alongside the ORD-* server version)
      const localCreated = await db.orders.where('_status').equals('created').toArray();
      for (const local of localCreated) {
        if (local.id < 0 && local.order_number?.startsWith('TXN-')) {
          await db.orders.delete(local.id);
        }
      }

      console.log(`✅ Pulled ${apiOrders.length} orders from server`);
    } catch (err) {
      console.error('Failed to pull orders:', err);
    }
  },
};

// ==================== Payments (read-heavy, writes come from POS transactions) ====================

const payments = {
  async getAll(): Promise<LocalPayment[]> {
    return db.payments.where('_status').notEqual('deleted').toArray();
  },

  async getById(id: number): Promise<LocalPayment | undefined> {
    return db.payments.get(id);
  },

  async addFromTransaction(data: {
    id?: number;
    payment_number?: string;
    order_id: number | null;
    order_number?: string | null;
    customer_id?: number | null;
    customer_name?: string;
    amount: number;
    method: string;
    status: string;
    paid_at?: string;
  }): Promise<void> {
    const localId = generateLocalId();
    await db.payments.put({
      id: data.id || generateTempId(),
      _localId: localId,
      _status: data.id ? 'synced' : 'created',
      _lastModified: new Date(),
      payment_number: data.payment_number,
      order_id: data.order_id,
      order_number: data.order_number ?? null,
      customer_id: data.customer_id ?? null,
      customer_name: data.customer_name,
      amount: data.amount,
      method: data.method,
      status: data.status,
      paid_at: data.paid_at,
      created_at: new Date().toISOString(),
      last_synced: new Date(),
    });
  },

  async pullFresh(): Promise<void> {
    try {
      const response = await paymentService.getAll({ per_page: 100 });
      const apiPayments: ApiPayment[] = Array.isArray(response)
        ? response
        : (response as any)?.data || [];

      const dirtyIds = new Set(
        (await db.payments.where('_status').notEqual('synced').toArray())
          .filter(p => p.id > 0)
          .map(p => p.id)
      );

      const now = new Date();
      for (const p of apiPayments) {
        if (dirtyIds.has(p.id)) continue;

        await db.payments.put({
          id: p.id,
          _status: 'synced',
          _lastModified: now,
          payment_number: p.payment_number,
          order_id: p.order_id,
          order_number: p.order_number ?? null,
          customer_id: p.customer_id ?? null,
          customer_name: p.customer,
          amount: Number(p.amount || 0),
          method: p.method,
          status: p.status,
          paid_at: p.paid_at,
          created_at: p.created_at,
          last_synced: now,
        });
      }

      // Clean up temp payments (created offline, now replaced by server records)
      const tempPayments = await db.payments.where('id').below(0).toArray();
      for (const temp of tempPayments) {
        await db.payments.delete(temp.id);
      }

      // Clean up synced records no longer on server
      const serverIds = new Set(apiPayments.map(p => p.id));
      const allLocal = await db.payments.where('_status').equals('synced').toArray();
      for (const local of allLocal) {
        if (local.id > 0 && !serverIds.has(local.id)) {
          await db.payments.delete(local.id);
        }
      }

      console.log(`✅ Pulled ${apiPayments.length} payments from server`);
    } catch (err) {
      console.error('Failed to pull payments:', err);
    }
  },
};

// ==================== Categories (read-only cache) ====================

const categories = {
  async getAll(): Promise<LocalCategory[]> {
    return db.categories.toArray();
  },

  async getById(id: number): Promise<LocalCategory | undefined> {
    return db.categories.get(id);
  },

  async pullFresh(): Promise<void> {
    try {
      const response = await categoryService.getAll();
      const apiCategories = Array.isArray(response)
        ? response
        : (response as any)?.data || [];

      const now = new Date();
      for (const c of apiCategories) {
        await db.categories.put({
          id: c.id,
          name: c.name,
          description: c.description,
          last_synced: now,
        });
      }

      console.log(`✅ Pulled ${apiCategories.length} categories from server`);
    } catch (err) {
      console.error('Failed to pull categories:', err);
    }
  },
};

// ==================== Stores (read-only cache) ====================

const stores = {
  async getAll(): Promise<LocalStore[]> {
    return db.stores.toArray();
  },

  async getById(id: number): Promise<LocalStore | undefined> {
    return db.stores.get(id);
  },

  async pullFresh(): Promise<void> {
    try {
      const response = await storeService.getAll();
      const apiStores = Array.isArray(response)
        ? response
        : (response as any)?.data || [];

      const now = new Date();
      for (const s of apiStores) {
        await db.stores.put({
          id: s.id,
          name: s.name,
          is_active: s.is_active !== false,
          last_synced: now,
        });
      }

      console.log(`✅ Pulled ${apiStores.length} stores from server`);
    } catch (err) {
      console.error('Failed to pull stores:', err);
    }
  },
};

// ==================== Export ====================

export const localDb = {
  products,
  customers,
  orders,
  payments,
  categories,
  stores,
};
