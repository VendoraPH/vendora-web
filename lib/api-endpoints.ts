/**
 * API Endpoints Configuration
 *
 * Centralized API endpoint definitions for Laravel backend
 * All endpoints are reusable and not hardcoded
 */

/**
 * Build URL with parameters
 */
const buildUrl = (path: string, params?: Record<string, string | number>): string => {
  let url = path
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, String(value))
    })
  }
  return url
}

/**
 * Authentication Endpoints
 */
export const authEndpoints = {
  // POST /auth/login
  login: () => "/auth/login",

  // POST /auth/register
  register: () => "/auth/register",

  // POST /auth/logout
  logout: () => "/auth/logout",

  // POST /auth/refresh
  refreshToken: () => "/auth/refresh",

  // GET /auth/me 
  me: () => "/auth/me",

  // POST /auth/forgot-password
  forgotPassword: () => "/auth/forgot-password",

  // POST /auth/reset-password
  resetPassword: () => "/auth/reset-password",

  // POST /auth/verify-email
  verifyEmail: () => "/auth/verify-email",

  // POST /auth/resend-verification
  resendVerification: () => "/auth/resend-verification",
}

/**
 * Product Endpoints
 */
export const productEndpoints = {
  // GET /products
  list: () => "/products",

  // GET /products/my - Get current vendor's products
  my: () => "/products/my",

  // GET /products/:id
  get: (id: string | number) => buildUrl("/products/:id", { id }),

  // POST /products
  create: () => "/products",

  // PUT /products/:id
  update: (id: string | number) => buildUrl("/products/:id", { id }),

  // DELETE /products/:id
  delete: (id: string | number) => buildUrl("/products/:id", { id }),

  // GET /products/sku/:sku
  getBySku: (sku: string) => buildUrl("/products/sku/:sku", { sku }),

  // GET /products/barcode/:code
  getByBarcode: (code: string) => buildUrl("/products/barcode/:code", { code }),

  // PATCH /products/:id/stock
  updateStock: (id: string | number) => buildUrl("/products/:id/stock", { id }),

  // POST /products/bulk-stock-decrement
  bulkStockDecrement: () => "/products/bulk-stock-decrement",

  // GET /products/:id/variants
  variants: (id: string | number) => buildUrl("/products/:id/variants", { id }),

  // GET /products/search
  search: () => "/products/search",

  // GET /products/featured
  featured: () => "/products/featured",

  // GET /products/category/:categoryId
  byCategory: (categoryId: string | number) =>
    buildUrl("/products/category/:categoryId", { categoryId }),
}

/**
 * Category Endpoints
 */
export const categoryEndpoints = {
  // GET /categories
  list: () => "/categories",

  // GET /categories/:id
  get: (id: string | number) => buildUrl("/categories/:id", { id }),

  // POST /categories
  create: () => "/categories",

  // PUT /categories/:id
  update: (id: string | number) => buildUrl("/categories/:id", { id }),

  // DELETE /categories/:id
  delete: (id: string | number) => buildUrl("/categories/:id", { id }),
}

/**
 * Order Endpoints
 */
export const orderEndpoints = {
  // GET /orders
  list: () => "/orders",

  // GET /orders/:id
  get: (id: string | number) => buildUrl("/orders/:id", { id }),

  // POST /orders
  create: () => "/orders",

  // PUT /orders/:id
  update: (id: string | number) => buildUrl("/orders/:id", { id }),

  // DELETE /orders/:id
  delete: (id: string | number) => buildUrl("/orders/:id", { id }),

  // GET /orders/summary
  summary: () => "/orders/summary",

  // PUT /orders/:id/status
  updateStatus: (id: string | number) => buildUrl("/orders/:id/status", { id }),

  // PUT /orders/:id/payment-status
  updatePaymentStatus: (id: string | number) =>
    buildUrl("/orders/:id/payment-status", { id }),

  // GET /orders/:id/invoice
  invoice: (id: string | number) => buildUrl("/orders/:id/invoice", { id }),

  // GET /orders/:id/receipt
  receipt: (id: string | number) => buildUrl("/orders/:id/receipt", { id }),

  // POST /orders/:id/cancel
  cancel: (id: string | number) => buildUrl("/orders/:id/cancel", { id }),

  // POST /orders/:id/refund
  refund: (id: string | number) => buildUrl("/orders/:id/refund", { id }),
}

/**
 * Customer Endpoints
 */
export const customerEndpoints = {
  // GET /customers
  list: () => "/customers",

  // GET /customers/summary
  summary: () => "/customers/summary",

  // GET /customers/:id
  get: (id: string | number) => buildUrl("/customers/:id", { id }),

  // POST /customers
  create: () => "/customers",

  // PUT /customers/:id
  update: (id: string | number) => buildUrl("/customers/:id", { id }),

  // DELETE /customers/:id
  delete: (id: string | number) => buildUrl("/customers/:id", { id }),

  // GET /customers/:id/orders
  orders: (id: string | number) => buildUrl("/customers/:id/orders", { id }),

  // GET /customers/:id/addresses
  addresses: (id: string | number) => buildUrl("/customers/:id/addresses", { id }),

  // POST /customers/:id/addresses
  createAddress: (id: string | number) => buildUrl("/customers/:id/addresses", { id }),

  // PUT /customers/:id/addresses/:addressId
  updateAddress: (id: string | number, addressId: string | number) =>
    buildUrl("/customers/:id/addresses/:addressId", { id, addressId }),

  // DELETE /customers/:id/addresses/:addressId
  deleteAddress: (id: string | number, addressId: string | number) =>
    buildUrl("/customers/:id/addresses/:addressId", { id, addressId }),
}

/**
 * Cart Endpoints
 */
export const cartEndpoints = {
  // GET /cart
  get: () => "/cart",

  // POST /cart/items
  addItem: () => "/cart/items",

  // PUT /cart/items/:itemId
  updateItem: (itemId: string | number) => buildUrl("/cart/items/:itemId", { itemId }),

  // DELETE /cart/items/:itemId
  removeItem: (itemId: string | number) => buildUrl("/cart/items/:itemId", { itemId }),

  // DELETE /cart
  clear: () => "/cart",

  // POST /cart/apply-coupon
  applyCoupon: () => "/cart/apply-coupon",

  // DELETE /cart/remove-coupon
  removeCoupon: () => "/cart/remove-coupon",
}

/**
 * Inventory Endpoints
 */
export const inventoryEndpoints = {
  // GET /inventory
  list: () => "/inventory",

  // GET /inventory/:productId
  get: (productId: string | number) => buildUrl("/inventory/:productId", { productId }),

  // PUT /inventory/:productId
  update: (productId: string | number) => buildUrl("/inventory/:productId", { productId }),

  // GET /inventory/low-stock
  lowStock: () => "/inventory/low-stock",

  // GET /inventory/summary
  summary: () => "/inventory/summary",

  // POST /inventory/adjustments
  adjustments: () => "/inventory/adjustments",

  // POST /inventory/:productId/adjust
  adjust: (productId: string | number) =>
    buildUrl("/inventory/:productId/adjust", { productId }),
}

/**
 * Payment Endpoints
 */
export const paymentEndpoints = {
  // GET /payments
  list: () => "/payments",

  // GET /payments/summary
  summary: () => "/payments/summary",

  // POST /payments
  create: () => "/payments",

  // PATCH /payments/:id
  update: (id: string | number) => buildUrl("/payments/:id", { id }),

  // GET /payments/:id
  get: (id: string | number) => buildUrl("/payments/:id", { id }),

  // GET /payments/:id/status
  status: (id: string | number) => buildUrl("/payments/:id/status", { id }),

  // POST /payments/:id/refund
  refund: (id: string | number) => buildUrl("/payments/:id/refund", { id }),

  // POST /payments/process
  process: () => "/payments/process",

  // POST /payments/gcash
  gcash: () => "/payments/gcash",

  // POST /payments/paymaya
  paymaya: () => "/payments/paymaya",

  // POST /payments/stripe
  stripe: () => "/payments/stripe",

  // DELETE /payments/:id
  delete: (id: string | number) => buildUrl("/payments/:id", { id }),

  // POST /payments/credit
  credit: () => "/payments/credit",
}

/**
 * Report Endpoints
 */
export const reportEndpoints = {
  // GET /reports/sales
  sales: () => "/reports/sales",

  // GET /reports/revenue
  revenue: () => "/reports/revenue",

  // GET /reports/products
  products: () => "/reports/products",

  // GET /reports/customers
  customers: () => "/reports/customers",

  // GET /reports/inventory
  inventory: () => "/reports/inventory",

  // GET /reports/dashboard
  dashboard: () => "/reports/dashboard",

  // POST /reports/export
  export: () => "/reports/export",
}

/**
 * Subscription Endpoints
 */
export const subscriptionEndpoints = {
  // GET /subscriptions
  list: () => "/subscriptions",

  // GET /subscriptions/plans
  plans: () => "/subscriptions/plans",

  // GET /subscriptions/current
  current: () => "/subscriptions/current",

  // POST /subscriptions/subscribe
  subscribe: () => "/subscriptions/subscribe",

  // PUT /subscriptions/upgrade
  upgrade: () => "/subscriptions/upgrade",

  // PUT /subscriptions/downgrade
  downgrade: () => "/subscriptions/downgrade",

  // POST /subscriptions/cancel
  cancel: () => "/subscriptions/cancel",

  // POST /subscriptions/resume
  resume: () => "/subscriptions/resume",
}

/**
 * User/Settings Endpoints
 */
export const userEndpoints = {
  // GET /user/profile
  profile: () => "/user/profile",

  // PUT /user/profile
  updateProfile: () => "/user/profile",

  // PUT /user/password
  changePassword: () => "/user/password",

  // POST /user/avatar
  uploadAvatar: () => "/user/avatar",

  // GET /user/notifications
  notifications: () => "/user/notifications",

  // PUT /user/notifications/:id/read
  markNotificationRead: (id: string | number) =>
    buildUrl("/user/notifications/:id/read", { id }),

  // PUT /user/notifications/read-all
  markAllNotificationsRead: () => "/user/notifications/read-all",
}

/**
 * Settings Endpoints
 */
export const settingsEndpoints = {
  // GET /settings
  get: () => "/settings",

  // PUT /settings
  update: () => "/settings",

  // GET /settings/store
  store: () => "/settings/store",

  // PUT /settings/store
  updateStore: () => "/settings/store",

  // GET /settings/payment
  payment: () => "/settings/payment",

  // PUT /settings/payment
  updatePayment: () => "/settings/payment",

  // GET /settings/shipping
  shipping: () => "/settings/shipping",

  // PUT /settings/shipping
  updateShipping: () => "/settings/shipping",
}

/**
 * Store Endpoints
 */
export const storeEndpoints = {
  // GET /stores
  list: () => "/stores",

  // GET /stores/:id
  get: (id: string | number) => buildUrl("/stores/:id", { id }),

  // POST /stores
  create: () => "/stores",

  // PATCH /stores/:id
  update: (id: string | number) => buildUrl("/stores/:id", { id }),

  // DELETE /stores/:id
  delete: (id: string | number) => buildUrl("/stores/:id", { id }),

  // GET /stores/:id/products
  products: (id: string | number) => buildUrl("/stores/:id/products", { id }),

  // GET /stores/:id/staff
  staff: (id: string | number) => buildUrl("/stores/:id/staff", { id }),

  // PATCH/DELETE /stores/:storeId/staff/:userId
  staffMember: (storeId: string | number, userId: string | number) =>
    buildUrl("/stores/:storeId/staff/:userId", { storeId, userId }),

  // Public ecommerce endpoints (no auth required)
  // GET /ecommerce/stores/:code
  publicByCode: (code: string) => `/ecommerce/stores/${code}`,

  // GET /ecommerce/stores/:code/products
  publicProducts: (code: string) => `/ecommerce/stores/${code}/products`,
}

/**
 * Ledger Endpoints
 */
export const ledgerEndpoints = {
  // GET /ledger
  list: () => "/ledger",

  // POST /ledger
  create: () => "/ledger",

  // GET /ledger/summary
  summary: () => "/ledger/summary",
}

/**
 * Food Menu Endpoints
 */
export const foodMenuEndpoints = {
  // GET /food-menu
  list: () => "/food-menu",

  // GET /food-menu/:id
  get: (id: string | number) => buildUrl("/food-menu/:id", { id }),

  // POST /food-menu
  create: () => "/food-menu",

  // PUT /food-menu/:id
  update: (id: string | number) => buildUrl("/food-menu/:id", { id }),

  // DELETE /food-menu/:id
  delete: (id: string | number) => buildUrl("/food-menu/:id", { id }),

  // GET /food-menu/categories
  categories: () => "/food-menu/categories",

  // Reservations
  reservations: {
    // GET /food-menu-reservations
    list: () => "/food-menu-reservations",

    // POST /food-menu-reservations
    create: () => "/food-menu-reservations",

    // PUT /food-menu-reservations/:id
    update: (id: string | number) => buildUrl("/food-menu-reservations/:id", { id }),

    // DELETE /food-menu-reservations/:id
    delete: (id: string | number) => buildUrl("/food-menu-reservations/:id", { id }),
  },
}

/**
 * Store Role Endpoints
 */
export const storeRoleEndpoints = {
  // GET /store-roles
  list: () => "/store-roles",
}

/**
 * Credit Endpoints
 */
export const creditEndpoints = {
  // GET /credits
  list: () => "/credits",

  // POST /credits
  create: () => "/credits",

  // GET /credits/:id
  get: (id: string | number) => buildUrl("/credits/:id", { id }),

  // POST /credits/:id/payment
  recordPayment: (id: string | number) => buildUrl("/credits/:id/payment", { id }),

  // GET /customers/:customerId/credits
  getByCustomer: (customerId: string | number) =>
    buildUrl("/customers/:customerId/credits", { customerId }),
}

/**
 * Admin Endpoints
 */
export const adminEndpoints = {
  users: {
    // GET /admin/users
    list: () => "/admin/users",

    // POST /admin/users
    create: () => "/admin/users",

    // GET /admin/users/:id
    get: (id: string | number) => buildUrl("/admin/users/:id", { id }),

    // PUT /admin/users/:id
    update: (id: string | number) => buildUrl("/admin/users/:id", { id }),

    // DELETE /admin/users/:id
    delete: (id: string | number) => buildUrl("/admin/users/:id", { id }),

    // PATCH /admin/users/:id/status
    updateStatus: (id: string | number) => buildUrl("/admin/users/:id/status", { id }),
  },
}

/**
 * Export all endpoints
 */
export const endpoints = {
  auth: authEndpoints,
  products: productEndpoints,
  categories: categoryEndpoints,
  orders: orderEndpoints,
  customers: customerEndpoints,
  cart: cartEndpoints,
  inventory: inventoryEndpoints,
  payments: paymentEndpoints,
  reports: reportEndpoints,
  subscriptions: subscriptionEndpoints,
  user: userEndpoints,
  settings: settingsEndpoints,
  stores: storeEndpoints,
  ledger: ledgerEndpoints,
  storeRoles: storeRoleEndpoints,
  admin: adminEndpoints,
  credits: creditEndpoints,
  foodMenu: foodMenuEndpoints,
}

export default endpoints
