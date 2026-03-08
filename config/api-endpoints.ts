/**
 * Centralized API Endpoints
 * All API endpoints in one place - easy to maintain and update
 * NO HARDCODED ENDPOINTS IN COMPONENTS OR SERVICES
 */

export const API_ENDPOINTS = {
  // Admin Authentication Endpoints
  // Note: Admin uses the same endpoints as vendor, differentiated by user_type field
  ADMIN: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    VERIFY_2FA: '/auth/verify-2fa',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_VERIFICATION: '/auth/resend-verification',
    // Admin Management Endpoints
    VENDORS: {
      LIST: '/admin/vendors',
      CREATE: '/admin/vendors',
      GET: (id: number | string) => `/admin/vendors/${id}`,
      UPDATE: (id: number | string) => `/admin/vendors/${id}`,
      DELETE: (id: number | string) => `/admin/vendors/${id}`,
    },
    USERS: {
      LIST: '/admin/users',
      GET: (id: number | string) => `/admin/users/${id}`,
      UPDATE: (id: number | string) => `/admin/users/${id}`,
      SUSPEND: (id: number | string) => `/admin/users/${id}/suspend`,
    },
    PRODUCTS: {
      LIST: '/admin/products',
      GET: (id: number | string) => `/admin/products/${id}`,
    },
    ORDERS: {
      LIST: '/admin/orders',
      GET: (id: number | string) => `/admin/orders/${id}`,
      SUMMARY: '/admin/orders/summary',
    },
    ANALYTICS: {
      OVERVIEW: '/admin/analytics/overview',
      REVENUE: '/admin/analytics/revenue',
      VENDORS: '/admin/analytics/vendors',
      USERS: '/admin/analytics/users',
    },
    PAYMENTS: {
      LIST: '/admin/payments',
      GET: (id: number | string) => `/admin/payments/${id}`,
      SUMMARY: '/admin/payments/summary',
    },
  },

  // Vendor Authentication Endpoints
  VENDOR: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    VERIFY_2FA: '/auth/verify-2fa',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_VERIFICATION: '/auth/resend-verification',
  },

  // Payment Webhooks
  WEBHOOKS: {
    PAYMENT: '/webhooks/payment',
  },

  // Future endpoints can be added here
  // ADMIN_DASHBOARD: { ... },
  // VENDOR_PRODUCTS: { ... },
  // etc.
} as const


export type ApiEndpoint = typeof API_ENDPOINTS
