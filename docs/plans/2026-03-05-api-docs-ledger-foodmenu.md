# API Documentation Update, Ledger Page & Food Menu Integration

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete API documentation with all missing endpoints, create a dedicated Ledger page for full transaction management, and integrate the food-menu POS page with backend API endpoints.

**Architecture:** Three independent workstreams: (1) Documentation update by comparing `lib/api-endpoints.ts` + `config/api-endpoints.ts` against `docs/api/API_DOCUMENTATION.md`, (2) New `/pos/ledger` page using `ledgerService` with full CRUD + filters, (3) Food menu service layer + endpoint config + page integration replacing hardcoded seed data.

**Tech Stack:** Next.js 16 App Router, TypeScript, Tailwind CSS, shadcn/ui, Zustand, Axios (shared `axiosClient`), SweetAlert2

---

## Task 1: Update API Documentation - Missing Auth Endpoints

**Files:**
- Modify: `docs/api/API_DOCUMENTATION.md`

**Step 1: Add missing Auth endpoints after the existing Auth section**

Add these endpoints to the Auth section (after `POST /auth/logout`):

```markdown
#### Refresh Token
\`\`\`
POST /api/auth/refresh
\`\`\`
**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| refresh_token | string | Yes | The refresh token |

**Responses:**
- **200**: New access token + refresh token
- **401**: Invalid refresh token

---

#### Verify 2FA
\`\`\`
POST /api/auth/verify-2fa
\`\`\`
**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| code | string | Yes | 2FA verification code |

**Responses:**
- **200**: 2FA verified
- **422**: Invalid code

---

#### Forgot Password
\`\`\`
POST /api/auth/forgot-password
\`\`\`
**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string (email) | Yes | User email |

**Responses:**
- **200**: Password reset link sent
- **422**: Validation error

---

#### Reset Password
\`\`\`
POST /api/auth/reset-password
\`\`\`
**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| token | string | Yes | Reset token from email |
| password | string | Yes | New password |
| password_confirmation | string | Yes | Confirm new password |

**Responses:**
- **200**: Password reset successful
- **422**: Invalid token or validation error

---

#### Verify Email
\`\`\`
POST /api/auth/verify-email
\`\`\`
**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| token | string | Yes | Email verification token |

**Responses:**
- **200**: Email verified
- **422**: Invalid token

---

#### Resend Verification Email
\`\`\`
POST /api/auth/resend-verification
\`\`\`
**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string (email) | Yes | User email |

**Responses:**
- **200**: Verification email resent
- **422**: Validation error
```

**Step 2: Verify the additions are in the correct location**

The new endpoints should appear after `POST /auth/logout` and before the `Categories` section.

---

## Task 2: Update API Documentation - Missing Product Endpoints

**Files:**
- Modify: `docs/api/API_DOCUMENTATION.md`

**Step 1: Add missing Product endpoints after the existing Product section**

Add these to the Products section (the existing section has list, my, create, update, stock, delete, bulk-stock-decrement):

```markdown
#### Get Product by SKU
\`\`\`
GET /api/products/sku/:sku
\`\`\`
**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| sku | string | Product SKU code |

**Responses:**
- **200**: Product details
- **404**: Product not found

---

#### Get Product by Barcode
\`\`\`
GET /api/products/barcode/:code
\`\`\`
**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| code | string | Product barcode |

**Responses:**
- **200**: Product details
- **404**: Product not found

---

#### Get Product Variants
\`\`\`
GET /api/products/:id/variants
\`\`\`
**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| id | integer | Product ID |

**Responses:**
- **200**: List of product variants
- **404**: Product not found

---

#### Search Products
\`\`\`
GET /api/products/search
\`\`\`
**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| q | string | Yes | Search query |
| category_id | integer | No | Filter by category |
| per_page | integer | No | Items per page |

**Responses:**
- **200**: Matching products

---

#### Get Featured Products
\`\`\`
GET /api/products/featured
\`\`\`
**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| limit | integer | No | Number of products (default: 10) |

**Responses:**
- **200**: List of featured products

---

#### Get Products by Category
\`\`\`
GET /api/products/category/:categoryId
\`\`\`
**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| categoryId | integer | Category ID |

**Responses:**
- **200**: Products in the category
```

---

## Task 3: Update API Documentation - Missing Order Endpoints

**Files:**
- Modify: `docs/api/API_DOCUMENTATION.md`

**Step 1: Add missing Order endpoints to the Orders section**

```markdown
#### Update Order Status
\`\`\`
PUT /api/orders/:id/status
\`\`\`
**Path Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| id | integer | Order ID |

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| status | string | Yes | New status (pending, processing, completed, cancelled) |

**Responses:**
- **200**: Order status updated
- **404**: Order not found

---

#### Update Order Payment Status
\`\`\`
PUT /api/orders/:id/payment-status
\`\`\`
**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| payment_status | string | Yes | New payment status (unpaid, partial, paid) |

**Responses:**
- **200**: Payment status updated

---

#### Get Order Invoice
\`\`\`
GET /api/orders/:id/invoice
\`\`\`
**Note:** Returns PDF blob. Use `axiosClient` directly with `responseType: 'blob'`.

**Responses:**
- **200**: PDF blob
- **404**: Invoice not available

---

#### Get Order Receipt
\`\`\`
GET /api/orders/:id/receipt
\`\`\`
**Note:** Returns PDF blob. Use `axiosClient` directly with `responseType: 'blob'`.

**Responses:**
- **200**: PDF blob
- **404**: Receipt not available

---

#### Cancel Order
\`\`\`
POST /api/orders/:id/cancel
\`\`\`
**Responses:**
- **200**: Order cancelled
- **404**: Order not found
- **422**: Order cannot be cancelled

---

#### Refund Order
\`\`\`
POST /api/orders/:id/refund
\`\`\`
**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| reason | string | No | Refund reason |

**Responses:**
- **200**: Refund initiated
- **404**: Order not found
```

---

## Task 4: Update API Documentation - Missing Payment Endpoints

**Files:**
- Modify: `docs/api/API_DOCUMENTATION.md`

**Step 1: Add missing Payment endpoints**

```markdown
#### Get Payment Status
\`\`\`
GET /api/payments/:id/status
\`\`\`
**Responses:**
- **200**: Payment status details

---

#### Refund Payment
\`\`\`
POST /api/payments/:id/refund
\`\`\`
**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| amount | integer | No | Partial refund amount (omit for full refund) |
| reason | string | No | Refund reason |

**Responses:**
- **200**: Refund processed
- **404**: Payment not found

---

#### Process Payment
\`\`\`
POST /api/payments/process
\`\`\`
**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| order_id | integer | Yes | Order ID |
| method | string | Yes | Payment method |
| amount | integer | Yes | Payment amount (integer) |

**Responses:**
- **200**: Payment processed

---

#### Process GCash Payment
\`\`\`
POST /api/payments/gcash
\`\`\`
**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| order_id | integer | Yes | Order ID |
| amount | integer | Yes | Payment amount |
| phone | string | Yes | GCash phone number |

**Responses:**
- **200**: GCash payment initiated

---

#### Process PayMaya Payment
\`\`\`
POST /api/payments/paymaya
\`\`\`
**Request Body:** Same as GCash

---

#### Process Stripe Payment
\`\`\`
POST /api/payments/stripe
\`\`\`
**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| order_id | integer | Yes | Order ID |
| amount | integer | Yes | Payment amount |
| token | string | Yes | Stripe payment token |

**Responses:**
- **200**: Stripe payment processed

---

#### Process Credit Payment
\`\`\`
POST /api/payments/credit
\`\`\`
**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| order_id | integer | Yes | Order ID |
| customer_id | integer | Yes | Customer ID |
| amount | integer | Yes | Credit amount |

**Responses:**
- **200**: Credit payment recorded
```

---

## Task 5: Update API Documentation - Cart, Customer Address, Credit Endpoints

**Files:**
- Modify: `docs/api/API_DOCUMENTATION.md`

**Step 1: Add Cart section (new section)**

```markdown
### Cart

#### Get Cart
\`\`\`
GET /api/cart
\`\`\`
**Responses:**
- **200**: Cart contents with items, subtotal, tax, total

---

#### Add Item to Cart
\`\`\`
POST /api/cart/items
\`\`\`
**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| product_id | integer | Yes | Product ID |
| quantity | integer | Yes | Quantity to add |
| variant_id | integer | No | Variant ID if applicable |

**Responses:**
- **200**: Updated cart
- **422**: Validation error

---

#### Update Cart Item
\`\`\`
PUT /api/cart/items/:itemId
\`\`\`
**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| quantity | integer | Yes | New quantity |

**Responses:**
- **200**: Updated cart

---

#### Remove Cart Item
\`\`\`
DELETE /api/cart/items/:itemId
\`\`\`
**Responses:**
- **200**: Updated cart

---

#### Clear Cart
\`\`\`
DELETE /api/cart
\`\`\`
**Responses:**
- **200**: Cart cleared

---

#### Apply Coupon
\`\`\`
POST /api/cart/apply-coupon
\`\`\`
**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| code | string | Yes | Coupon code |

**Responses:**
- **200**: Coupon applied
- **422**: Invalid or expired coupon

---

#### Remove Coupon
\`\`\`
DELETE /api/cart/remove-coupon
\`\`\`
**Responses:**
- **200**: Coupon removed
```

**Step 2: Add missing Customer Address endpoints**

```markdown
#### Get Customer Orders
\`\`\`
GET /api/customers/:id/orders
\`\`\`
**Responses:**
- **200**: List of customer orders

---

#### Get Customer Addresses
\`\`\`
GET /api/customers/:id/addresses
\`\`\`
**Responses:**
- **200**: List of customer addresses

---

#### Create Customer Address
\`\`\`
POST /api/customers/:id/addresses
\`\`\`
**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| address_line_1 | string | Yes | Street address |
| address_line_2 | string | No | Apt/Suite |
| city | string | Yes | City |
| province | string | Yes | Province |
| postal_code | string | Yes | Postal code |
| is_default | boolean | No | Set as default address |

**Responses:**
- **201**: Address created

---

#### Update Customer Address
\`\`\`
PUT /api/customers/:id/addresses/:addressId
\`\`\`
**Responses:**
- **200**: Address updated

---

#### Delete Customer Address
\`\`\`
DELETE /api/customers/:id/addresses/:addressId
\`\`\`
**Responses:**
- **200**: Address deleted
```

**Step 3: Add missing Credit endpoints**

```markdown
#### Get Credit by ID
\`\`\`
GET /api/credits/:id
\`\`\`
**Responses:**
- **200**: Credit details

---

#### Get Credits by Customer
\`\`\`
GET /api/customers/:customerId/credits
\`\`\`
**Responses:**
- **200**: List of customer credits
```

---

## Task 6: Update API Documentation - Reports, Subscriptions, Settings, Notifications

**Files:**
- Modify: `docs/api/API_DOCUMENTATION.md`

**Step 1: Add Reports section**

```markdown
### Reports

#### Sales Report
\`\`\`
GET /api/reports/sales
\`\`\`
**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| date_from | string | No | Start date (YYYY-MM-DD) |
| date_to | string | No | End date (YYYY-MM-DD) |
| group_by | string | No | Group by: day, week, month |

**Responses:**
- **200**: Sales report data

---

#### Revenue Report
\`\`\`
GET /api/reports/revenue
\`\`\`
**Query Parameters:** Same as Sales Report

---

#### Products Report
\`\`\`
GET /api/reports/products
\`\`\`
**Responses:**
- **200**: Product performance report

---

#### Customers Report
\`\`\`
GET /api/reports/customers
\`\`\`
**Responses:**
- **200**: Customer activity report

---

#### Inventory Report
\`\`\`
GET /api/reports/inventory
\`\`\`
**Responses:**
- **200**: Inventory status report

---

#### Dashboard Report
\`\`\`
GET /api/reports/dashboard
\`\`\`
**Responses:**
- **200**: Dashboard summary report

---

#### Export Report
\`\`\`
POST /api/reports/export
\`\`\`
**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | string | Yes | Report type (sales, revenue, products, customers, inventory) |
| format | string | Yes | Export format (csv, pdf, xlsx) |
| date_from | string | No | Start date |
| date_to | string | No | End date |

**Note:** Returns blob. Use `axiosClient` directly with `responseType: 'blob'`.

**Responses:**
- **200**: File download (blob)
```

**Step 2: Add Subscriptions section**

```markdown
### Subscriptions

#### List Subscriptions
\`\`\`
GET /api/subscriptions
\`\`\`
**Responses:**
- **200**: List of subscriptions

---

#### Get Subscription Plans
\`\`\`
GET /api/subscriptions/plans
\`\`\`
**Responses:**
- **200**: Available plans

---

#### Get Current Subscription
\`\`\`
GET /api/subscriptions/current
\`\`\`
**Responses:**
- **200**: Current subscription details

---

#### Subscribe
\`\`\`
POST /api/subscriptions/subscribe
\`\`\`
**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| plan_id | integer | Yes | Plan to subscribe to |

**Responses:**
- **200**: Subscription created

---

#### Upgrade Subscription
\`\`\`
PUT /api/subscriptions/upgrade
\`\`\`
**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| plan_id | integer | Yes | New plan ID |

**Responses:**
- **200**: Subscription upgraded

---

#### Downgrade Subscription
\`\`\`
PUT /api/subscriptions/downgrade
\`\`\`
**Request Body:** Same as Upgrade

---

#### Cancel Subscription
\`\`\`
POST /api/subscriptions/cancel
\`\`\`
**Responses:**
- **200**: Subscription cancelled

---

#### Resume Subscription
\`\`\`
POST /api/subscriptions/resume
\`\`\`
**Responses:**
- **200**: Subscription resumed
```

**Step 3: Add Settings section**

```markdown
### Settings

#### Get Settings
\`\`\`
GET /api/settings
\`\`\`
**Responses:**
- **200**: General settings

---

#### Update Settings
\`\`\`
PUT /api/settings
\`\`\`
**Request Body:** Settings key-value pairs

---

#### Get Store Settings
\`\`\`
GET /api/settings/store
\`\`\`
**Responses:**
- **200**: Store-specific settings

---

#### Update Store Settings
\`\`\`
PUT /api/settings/store
\`\`\`

---

#### Get Payment Settings
\`\`\`
GET /api/settings/payment
\`\`\`

---

#### Update Payment Settings
\`\`\`
PUT /api/settings/payment
\`\`\`

---

#### Get Shipping Settings
\`\`\`
GET /api/settings/shipping
\`\`\`

---

#### Update Shipping Settings
\`\`\`
PUT /api/settings/shipping
\`\`\`
```

**Step 4: Add User/Notification endpoints**

```markdown
#### Upload Avatar
\`\`\`
POST /api/user/avatar
\`\`\`
**Request Body:** FormData with `avatar` file field

**Responses:**
- **200**: Avatar updated

---

#### Get Notifications
\`\`\`
GET /api/user/notifications
\`\`\`
**Responses:**
- **200**: List of notifications

---

#### Mark Notification as Read
\`\`\`
PUT /api/user/notifications/:id/read
\`\`\`

---

#### Mark All Notifications as Read
\`\`\`
PUT /api/user/notifications/read-all
\`\`\`
```

---

## Task 7: Update API Documentation - Admin Endpoints

**Files:**
- Modify: `docs/api/API_DOCUMENTATION.md`

**Step 1: Add missing Admin Vendors endpoints**

```markdown
### Admin - Vendors

#### List Vendors (Admin only)
\`\`\`
GET /api/admin/vendors
\`\`\`
**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| search | string | No | Search by name or email |
| status | string | No | Filter by status |
| per_page | integer | No | Items per page |

**Responses:**
- **200**: List of vendors

---

#### Get Vendor (Admin only)
\`\`\`
GET /api/admin/vendors/:id
\`\`\`
**Responses:**
- **200**: Vendor details

---

#### Update Vendor (Admin only)
\`\`\`
PUT /api/admin/vendors/:id
\`\`\`
**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| business_name | string | No | Business name |
| status | string | No | Vendor status |

**Responses:**
- **200**: Vendor updated

---

#### Delete Vendor (Admin only)
\`\`\`
DELETE /api/admin/vendors/:id
\`\`\`
**Responses:**
- **200**: Vendor deleted
```

**Step 2: Add Admin Products section**

```markdown
### Admin - Products

#### List All Products (Admin only)
\`\`\`
GET /api/admin/products
\`\`\`
**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| vendor_id | integer | No | Filter by vendor |
| search | string | No | Search products |
| per_page | integer | No | Items per page |

**Responses:**
- **200**: All products across vendors

---

#### Get Product (Admin only)
\`\`\`
GET /api/admin/products/:id
\`\`\`
**Responses:**
- **200**: Product details
```

**Step 3: Add Admin Orders section**

```markdown
### Admin - Orders

#### List All Orders (Admin only)
\`\`\`
GET /api/admin/orders
\`\`\`
**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| vendor_id | integer | No | Filter by vendor |
| status | string | No | Filter by status |
| per_page | integer | No | Items per page |

**Responses:**
- **200**: All orders

---

#### Get Order (Admin only)
\`\`\`
GET /api/admin/orders/:id
\`\`\`

---

#### Order Summary (Admin only)
\`\`\`
GET /api/admin/orders/summary
\`\`\`
**Responses:**
- **200**: Order summary stats
```

**Step 4: Add Admin Analytics section**

```markdown
### Admin - Analytics

#### Analytics Overview (Admin only)
\`\`\`
GET /api/admin/analytics/overview
\`\`\`
**Responses:**
- **200**: Platform-wide analytics overview

---

#### Revenue Analytics (Admin only)
\`\`\`
GET /api/admin/analytics/revenue
\`\`\`
**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| date_from | string | No | Start date |
| date_to | string | No | End date |

---

#### Vendor Analytics (Admin only)
\`\`\`
GET /api/admin/analytics/vendors
\`\`\`

---

#### User Analytics (Admin only)
\`\`\`
GET /api/admin/analytics/users
\`\`\`
```

**Step 5: Add Admin Payments section**

```markdown
### Admin - Payments

#### List All Payments (Admin only)
\`\`\`
GET /api/admin/payments
\`\`\`
**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| vendor_id | integer | No | Filter by vendor |
| method | string | No | Filter by method |
| per_page | integer | No | Items per page |

---

#### Get Payment (Admin only)
\`\`\`
GET /api/admin/payments/:id
\`\`\`

---

#### Payment Summary (Admin only)
\`\`\`
GET /api/admin/payments/summary
\`\`\`
```

**Step 6: Add Webhooks section**

```markdown
### Webhooks

#### Payment Webhook
\`\`\`
POST /api/webhooks/payment
\`\`\`
**Description:** Receives payment notifications from payment gateways (GCash, PayMaya, Stripe).

**Request Body:** Varies by payment provider.

**Responses:**
- **200**: Webhook processed
```

---

## Task 8: Create Dedicated Ledger Page

**Files:**
- Create: `app/pos/ledger/page.tsx`
- Modify: `app/pos/layout.tsx` (add Ledger nav item)
- Modify: `app/pos/accounting/page.tsx` (add link to Ledger page)

**Step 1: Add Ledger to sidebar navigation in layout.tsx**

In `app/pos/layout.tsx`, add the Ledger item to the "Management" section, right after Accounting:

```typescript
// Add BookOpen to the lucide-react imports
import { ..., BookOpen } from "lucide-react"

// In the Management section items array, after Accounting:
{ icon: BookOpen, label: "Ledger", href: "/pos/ledger", comingSoon: false },
```

**Step 2: Create the Ledger page at `app/pos/ledger/page.tsx`**

Build a full ledger management page with:
- Summary cards at top (total entries, income, expenses, net balance) from `ledgerService.getSummary()`
- Filter bar: type dropdown (All/Income/Expense), category text input, date range (date_from, date_to), search text
- Data table with columns: Date, Type, Description, Category, Amount, Reference
- Color-coded amounts: green for income, red for expense
- Pagination controls
- "Add Entry" button that opens a dialog with form fields matching `LedgerCreatePayload`:
  - type (income/expense select)
  - description (text input, required)
  - amount (number input, required)
  - category (text input, optional)
  - reference (text input, optional)
  - product_id (number input, optional)
  - quantity (number input, optional)
- Uses `useOfflineData` hook for cache-first loading
- Uses `StaleDataBanner` for stale data indication
- Match the existing dark theme styling: `bg-white dark:bg-[#13132a]`, `border-gray-200 dark:border-[#2d1b69]`, purple accents

**Step 3: Update Accounting page to link to Ledger**

In `app/pos/accounting/page.tsx`, add a "View All Transactions" link/button in the Recent Transactions section header that navigates to `/pos/ledger`.

**Step 4: Verify build**

Run: `npm run build`
Expected: No TypeScript errors, page renders correctly.

**Step 5: Commit**

```bash
git add app/pos/ledger/page.tsx app/pos/layout.tsx app/pos/accounting/page.tsx
git commit -m "feat: add dedicated Ledger page with full transaction management"
```

---

## Task 9: Create Food Menu Endpoints and Service

**Files:**
- Modify: `lib/api-endpoints.ts` (add foodMenu endpoints)
- Create: `services/food-menu.service.ts`
- Modify: `services/index.ts` (add barrel export)

**Step 1: Add food menu endpoints to `lib/api-endpoints.ts`**

Add after `ledgerEndpoints`:

```typescript
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

  // PATCH /food-menu/:id/availability
  toggleAvailability: (id: string | number) => buildUrl("/food-menu/:id/availability", { id }),

  // GET /food-menu/categories
  categories: () => "/food-menu/categories",

  // Reservations
  reservations: {
    // GET /food-menu/reservations
    list: () => "/food-menu/reservations",

    // POST /food-menu/reservations
    create: () => "/food-menu/reservations",

    // PATCH /food-menu/reservations/:id/status
    updateStatus: (id: string | number) => buildUrl("/food-menu/reservations/:id/status", { id }),
  },
}
```

Also add to the `endpoints` export object:

```typescript
export const endpoints = {
  // ... existing
  foodMenu: foodMenuEndpoints,
}
```

**Step 2: Create `services/food-menu.service.ts`**

```typescript
/**
 * Food Menu Service
 *
 * Handles all food menu-related API calls
 */

import api from "@/lib/api-client"
import { endpoints } from "@/lib/api-endpoints"

export interface FoodMenuItem {
  id: number
  name: string
  description: string
  category: string
  price: number
  total_servings: number
  reserved_servings: number
  is_available: boolean
  created_at?: string
  updated_at?: string
}

export interface FoodMenuFilters {
  category?: string
  search?: string
  is_available?: boolean
  page?: number
  per_page?: number
}

export interface FoodMenuCreatePayload {
  name: string
  description: string
  category: string
  price: number
  total_servings: number
  is_available: boolean
}

export interface FoodMenuUpdatePayload extends Partial<FoodMenuCreatePayload> {}

export interface PaginatedFoodMenuResponse {
  data: FoodMenuItem[]
  meta?: {
    current_page: number
    per_page: number
    total: number
  }
}

export interface FoodMenuReservation {
  id: number
  menu_item_id: number
  menu_item_name: string
  customer_name: string
  phone: string
  servings: number
  notes: string
  total: number
  status: "pending" | "confirmed" | "cancelled"
  created_at?: string
}

export interface ReservationCreatePayload {
  menu_item_id: number
  customer_name: string
  phone: string
  servings: number
  notes?: string
}

export interface PaginatedReservationResponse {
  data: FoodMenuReservation[]
  meta?: {
    current_page: number
    per_page: number
    total: number
  }
}

export const foodMenuService = {
  getAll: async (filters?: FoodMenuFilters): Promise<PaginatedFoodMenuResponse> => {
    return api.get<PaginatedFoodMenuResponse>(endpoints.foodMenu.list(), {
      params: filters,
    })
  },

  get: async (id: number): Promise<FoodMenuItem> => {
    return api.get<FoodMenuItem>(endpoints.foodMenu.get(id))
  },

  create: async (data: FoodMenuCreatePayload): Promise<FoodMenuItem> => {
    return api.post<FoodMenuItem>(endpoints.foodMenu.create(), data)
  },

  update: async (id: number, data: FoodMenuUpdatePayload): Promise<FoodMenuItem> => {
    return api.put<FoodMenuItem>(endpoints.foodMenu.update(id), data)
  },

  delete: async (id: number): Promise<void> => {
    return api.delete(endpoints.foodMenu.delete(id))
  },

  toggleAvailability: async (id: number): Promise<FoodMenuItem> => {
    return api.patch<FoodMenuItem>(endpoints.foodMenu.toggleAvailability(id))
  },

  getCategories: async (): Promise<string[]> => {
    return api.get<string[]>(endpoints.foodMenu.categories())
  },

  // Reservations
  getReservations: async (filters?: { status?: string; search?: string; page?: number; per_page?: number }): Promise<PaginatedReservationResponse> => {
    return api.get<PaginatedReservationResponse>(endpoints.foodMenu.reservations.list(), {
      params: filters,
    })
  },

  createReservation: async (data: ReservationCreatePayload): Promise<FoodMenuReservation> => {
    return api.post<FoodMenuReservation>(endpoints.foodMenu.reservations.create(), data)
  },

  updateReservationStatus: async (id: number, status: string): Promise<FoodMenuReservation> => {
    return api.patch<FoodMenuReservation>(endpoints.foodMenu.reservations.updateStatus(id), { status })
  },
}
```

**Step 3: Add barrel export in `services/index.ts`**

Add:
```typescript
export * from "./food-menu.service"
```

And add type exports:
```typescript
export type {
  FoodMenuItem,
  FoodMenuFilters,
  FoodMenuCreatePayload,
  FoodMenuUpdatePayload,
  PaginatedFoodMenuResponse,
  FoodMenuReservation,
  ReservationCreatePayload,
  PaginatedReservationResponse,
} from "./food-menu.service"
```

**Step 4: Commit**

```bash
git add lib/api-endpoints.ts services/food-menu.service.ts services/index.ts
git commit -m "feat: add food menu API endpoints and service layer"
```

---

## Task 10: Integrate Food Menu Page with Backend API

**Files:**
- Modify: `app/pos/food-menu/page.tsx`

**Step 1: Replace local state with API integration**

Key changes to the food-menu page:
1. Import `foodMenuService` from `@/services`
2. Import `useOfflineData` hook
3. Replace `useState<MenuItem[]>(seedMenuItems)` with API-loaded data via `useOfflineData`
4. Replace `useState<Reservation[]>(seedReservations)` with API-loaded reservations
5. Update `handleSave` to call `foodMenuService.create()` or `foodMenuService.update()` instead of local state manipulation
6. Update `handleDelete` to call `foodMenuService.delete()` then refresh data
7. Update `toggleAvailability` to call `foodMenuService.toggleAvailability()`
8. Keep the seed data as fallback when API returns empty or errors (for demo mode)
9. Add loading and error states
10. Map API response field names (snake_case) to the existing component field names (camelCase)

**Important mapping:**
- API `total_servings` -> component `totalServings`
- API `reserved_servings` -> component `reservedServings`
- API `is_available` -> component `isAvailable`
- API `menu_item_id` -> component `menuItemId`
- API `menu_item_name` -> component `menuItemName`
- API `customer_name` -> component `employeeName`
- API `created_at` -> component `createdAt`

Create a mapper function:
```typescript
function mapApiToMenuItem(item: FoodMenuItem): MenuItem {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    category: item.category as MenuCategory,
    price: item.price,
    totalServings: item.total_servings,
    reservedServings: item.reserved_servings,
    isAvailable: item.is_available,
  }
}
```

**Step 2: Add data loading with fallback to seed data**

```typescript
const { data, isLoading, isStale, lastSyncedAt, error, refresh } = useOfflineData<{
  items: MenuItem[];
  reservations: Reservation[];
}>(
  "food-menu-data",
  async () => {
    try {
      const [itemsRes, reservationsRes] = await Promise.all([
        foodMenuService.getAll({ per_page: 500 }),
        foodMenuService.getReservations({ per_page: 100 }),
      ])
      const items = Array.isArray(itemsRes) ? itemsRes : (itemsRes.data || [])
      const reservations = Array.isArray(reservationsRes) ? reservationsRes : (reservationsRes.data || [])
      return {
        items: items.map(mapApiToMenuItem),
        reservations: reservations.map(mapApiToReservation),
      }
    } catch {
      // Fallback to seed data if API not available
      return { items: seedMenuItems, reservations: seedReservations }
    }
  },
  { staleAfterMinutes: 15 }
)
```

**Step 3: Update CRUD operations to use API with fallback**

```typescript
const handleSave = async () => {
  // ... existing validation ...
  setIsSaving(true)
  try {
    const payload: FoodMenuCreatePayload = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      price: Number(form.price),
      total_servings: Number(form.totalServings),
      is_available: form.isAvailable,
    }

    if (isEditing && editingId !== null) {
      await foodMenuService.update(editingId, payload)
      Swal.fire({ icon: "success", title: "Updated!", timer: 1800, showConfirmButton: false })
    } else {
      await foodMenuService.create(payload)
      Swal.fire({ icon: "success", title: "Created!", timer: 1800, showConfirmButton: false })
    }
    refresh() // Reload data from API
  } catch (err: any) {
    // Fallback to local state if API fails
    // ... existing local state logic ...
    console.error("Food menu API error:", err?.response?.data || err?.message)
  }
  setIsSaving(false)
  closeDialog()
}
```

**Step 4: Verify build**

Run: `npm run build`
Expected: No errors.

**Step 5: Commit**

```bash
git add app/pos/food-menu/page.tsx
git commit -m "feat: integrate food menu page with backend API (with seed data fallback)"
```

---

## Task 11: Add Food Menu to API Documentation

**Files:**
- Modify: `docs/api/API_DOCUMENTATION.md`

**Step 1: Add Food Menu section**

```markdown
### Food Menu

#### List Menu Items
\`\`\`
GET /api/food-menu
\`\`\`
**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| category | string | No | Filter by category |
| search | string | No | Search by name/description |
| is_available | boolean | No | Filter by availability |
| page | integer | No | Page number |
| per_page | integer | No | Items per page |

**Responses:**
- **200**: Paginated list of menu items

---

#### Get Menu Item
\`\`\`
GET /api/food-menu/:id
\`\`\`
**Responses:**
- **200**: Menu item details

---

#### Create Menu Item
\`\`\`
POST /api/food-menu
\`\`\`
**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Item name |
| description | string | No | Item description |
| category | string | Yes | Category (Appetizer, Main Course, Dessert, Beverage, Snack, Soup, Salad, Combo) |
| price | integer | Yes | Price in PHP (integer) |
| total_servings | integer | Yes | Total available servings |
| is_available | boolean | Yes | Availability status |

**Responses:**
- **201**: Menu item created
- **422**: Validation error

---

#### Update Menu Item
\`\`\`
PUT /api/food-menu/:id
\`\`\`
**Request Body:** Same as Create (all fields optional)

**Responses:**
- **200**: Menu item updated

---

#### Delete Menu Item
\`\`\`
DELETE /api/food-menu/:id
\`\`\`
**Responses:**
- **200**: Menu item deleted

---

#### Toggle Availability
\`\`\`
PATCH /api/food-menu/:id/availability
\`\`\`
**Responses:**
- **200**: Availability toggled

---

#### Get Menu Categories
\`\`\`
GET /api/food-menu/categories
\`\`\`
**Responses:**
- **200**: List of category strings

---

### Food Menu - Reservations

#### List Reservations
\`\`\`
GET /api/food-menu/reservations
\`\`\`
**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| status | string | No | Filter by status (pending, confirmed, cancelled) |
| search | string | No | Search by customer name |
| page | integer | No | Page number |
| per_page | integer | No | Items per page |

**Responses:**
- **200**: Paginated list of reservations

---

#### Create Reservation
\`\`\`
POST /api/food-menu/reservations
\`\`\`
**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| menu_item_id | integer | Yes | Menu item ID |
| customer_name | string | Yes | Customer name |
| phone | string | Yes | Phone number |
| servings | integer | Yes | Number of servings |
| notes | string | No | Special notes |

**Responses:**
- **201**: Reservation created

---

#### Update Reservation Status
\`\`\`
PATCH /api/food-menu/reservations/:id/status
\`\`\`
**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| status | string | Yes | New status (pending, confirmed, cancelled) |

**Responses:**
- **200**: Status updated
```

**Step 2: Commit all documentation changes**

```bash
git add docs/api/API_DOCUMENTATION.md
git commit -m "docs: add all missing API endpoints to documentation (~90 new endpoints)"
```

---

## Task 12: Final Verification

**Step 1: Run build**
```bash
npm run build
```
Expected: Clean build with no errors.

**Step 2: Run lint**
```bash
npm run lint
```
Expected: No new lint errors.

**Step 3: Test pages load**
```bash
npm run dev
```
Navigate to:
- `/pos/ledger` - verify ledger page renders
- `/pos/food-menu` - verify food menu page still works
- `/pos/accounting` - verify link to ledger page

**Step 4: Final commit if any fixes needed**
