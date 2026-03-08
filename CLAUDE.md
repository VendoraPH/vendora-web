# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vendora is a multi-tenant Point of Sale (POS) and E-commerce platform built with Next.js 16 (App Router). It serves three user types: Vendors (primary), Admins, and E-commerce customers.

## Common Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Architecture

### Route Structure

The app has three main sections under `/app`:

**POS (Vendor Dashboard)** - `/pos/*`:
- Primary entry point for vendors (business owners)
- Protected routes requiring vendor authentication
- Features: Dashboard, POS Screen, Products, Orders, Customers, Credit Accounts, Payments, Accounting, E-commerce Store settings, Marketing, Reports, Settings, Help
- Layout: Sidebar navigation with collapsible sections (Primary Menus, Growth & Finance, Management)
- Components: `components/pos/*`, `components/screens/pos-screen/*`

**Admin Portal** - `/admin/*`:
- Platform administration and vendor management
- Protected routes requiring admin authentication
- Features: Dashboard, Vendors management, Users management, Products (all vendors), Orders (all vendors), Analytics, Payments, Reports, Notifications, Settings
- Layout: Admin-specific navigation
- Components: `components/admin/*`

**E-commerce Storefront** - `/ecommerce/*`:
- Public customer-facing shop
- No authentication required (guest shopping with localStorage cart)
- Features: Product browsing, Categories, Product details, Shopping cart, Checkout, Order success, Deals, Contact
- Layout: Navbar + Footer with CartSheet
- Components: `components/ecommerce/*` (Hero, Navbar, Footer, CartSheet, ProductCard)
- Uses Zustand `useCartStore` for cart management

Root page (`/`) redirects to `/pos/auth/login`.

### Key Layers

**Services (`services/`)**: Pure API wrappers with no business logic. All API calls go through services.
- `auth-jwt.service.ts` - Authentication with three contexts: `admin`, `vendor`, `pos`
  - Each context has: `login()`, `register()`, `logout()`, `refresh()`, `me()`, `verify2FA()`, `forgotPassword()`, `resetPassword()`, `verifyEmail()`, `resendVerification()`
- `product.service.ts` - Product CRUD, filters, stock updates, bulk operations
- `category.service.ts` - Category management
- `order.service.ts` - Order creation, retrieval, status updates
- `payment.service.ts` - Payment CRUD, filters, summaries
- `customer.service.ts` - Customer CRUD, filters, summaries
- `store.service.ts` - Vendor store management
- `dashboard.service.ts` - Dashboard KPIs, charts data, analytics (with retry logic for long-running queries)
- `admin-user.service.ts` - Admin user management (CRUD, status updates: active/inactive/suspended)
- Import via barrel: `import { authService, productService, orderService, adminUserService } from "@/services"`
- Service naming: `*.service.ts` exports named service object (e.g., `productService`, `orderService`, `adminUserService`)

**API Client (`lib/`)**:
- `axios-client.ts` - **Single shared Axios instance** with JWT interceptors, token refresh queue, 401 handling
  - Exports `tokenManager` for token operations (get/set access token, refresh token, user type)
  - Handles user-type-aware token refresh (admin vs vendor use different endpoints)
  - Queues concurrent requests during token refresh to avoid race conditions
- `api-client.ts` - High-level helpers (`api.get`, `api.post`, etc.) that wrap `axiosClient` and extract `response.data.data`
  - **IMPORTANT**: Always use this shared instance, not a separate Axios instance
- `api-endpoints.ts` - Endpoint builder functions with parameter interpolation
- **API Endpoint Pattern**: All endpoints defined in `config/api-endpoints.ts` and `lib/api-endpoints.ts`

**State (`store/`)**: Zustand stores with localStorage persistence
- `auth-store.ts` - User, authentication state
- `cart-store.ts` - Cart items with currency.js for decimal calculations
- `ui-store.ts` - Theme, sidebar state

**Configuration (`config/`)**:
- `env.ts` - Environment variables with type safety and defaults
  - Default API URL: `https://vendora-api.abedubas.dev/api`
  - Currency: PHP, Tax rate: 12%, Timezone: Asia/Manila
- `api.config.ts` - API constants, token storage keys (`vendora_access_token`, `vendora_refresh_token`, `vendora_user_type`)
- `api-endpoints.ts` - Centralized endpoint definitions with separate ADMIN and VENDOR namespaces

**Types (`types/`)**: TypeScript interfaces for all entities
- Import via barrel: `import type { User, Product } from "@/types"`

### Authentication Flow

**Vendor & Admin Authentication** - JWT with refresh tokens:

1. Login via `authService.pos.login()` (vendor) or `authService.admin.login()` (admin)
2. Response includes `token`, `refreshToken`, and user data
3. Tokens stored via `tokenManager` in both cookies and localStorage
4. Axios interceptor adds `Authorization: Bearer {token}` header to all requests
5. On 401 error, interceptor attempts token refresh using user-type-specific endpoint
6. Concurrent requests are queued during refresh to prevent race conditions
7. On refresh failure, tokens are cleared and user redirected to appropriate login page

**User Type Tracking**:
- User type (`admin` or `vendor`) stored in both cookie and localStorage
- Determines which refresh endpoint to use (`API_ENDPOINTS.ADMIN.REFRESH` vs `API_ENDPOINTS.VENDOR.REFRESH`)
- Determines redirect path on auth failure (`/admin/auth/login` vs `/pos/auth/login`)

**Token Storage**:
- Access token: `vendora_access_token` (cookie + localStorage)
- Refresh token: `vendora_refresh_token` (localStorage only)
- User type: `vendora_user_type` (cookie + localStorage)
- User profile: `vendora_user_profile` (localStorage, JSON stringified)

**E-commerce Customer Authentication**:
- Currently no authentication required (guest shopping)
- Cart persisted via Zustand `useCartStore` with localStorage (`cart-storage`)
- Future: May add customer accounts for order history and saved addresses

### Component Organization

```
components/
├── ui/          # shadcn/ui primitives (Button, Input, Dialog, etc.)
├── pos/         # POS vendor dashboard components
│   ├── DashboardStats.tsx
│   ├── SalesTrendChart.tsx, OrdersByChannelChart.tsx, PaymentMethodsChart.tsx
│   ├── InventoryHealth.tsx, LowStockAlerts.tsx
│   ├── TopSellingProducts.tsx, RecentActivity.tsx, PendingOrders.tsx
│   ├── CreditAccountCards.tsx, CreditAccountsDataTable.tsx
│   ├── NotificationPanel.tsx, ThemeToggle.tsx, QuickActions.tsx
│   └── AuthFooter.tsx
├── admin/       # Admin portal components
│   ├── dashboard/  # Admin dashboard widgets
│   └── layout/     # Admin layout components
├── ecommerce/   # Customer storefront components
│   ├── Hero.tsx           # Landing page hero section
│   ├── Navbar.tsx         # Main navigation with cart icon
│   ├── Footer.tsx         # Site footer
│   ├── CartSheet.tsx      # Slide-out shopping cart
│   └── ProductCard.tsx    # Product display card
├── screens/     # Full-screen layouts
│   ├── pos-screen/        # POS terminal screen (Sale → Checkout → Receipt)
│   └── dashboard/         # Dashboard screen layouts
├── layout/      # Shared layout components (Header, Sidebar)
├── auth/        # Authentication forms and components
├── shared/      # Reusable cross-section utilities
└── providers/   # React context providers
```

### Path Aliases

Use `@/*` for imports from project root:
```typescript
import { authService } from "@/services"
import { env } from "@/config/env"
import type { User } from "@/types"
```

## Technology Stack

- **Framework**: Next.js 16 with App Router, React 19, TypeScript 5.9
- **State**: Zustand with persist middleware
- **HTTP**: Axios with interceptors
- **Forms**: React Hook Form + Zod validation
- **UI**: Tailwind CSS + shadcn/ui (Radix primitives)
- **Charts**: Recharts
- **Money**: currency.js for decimal calculations

## Business Context

- Currency: PHP (Philippines Peso)
- Tax rate: 12% VAT (configured in cart store)
- Multi-tenant: Vendors have isolated data, admins manage vendors

## Key Features by Section

### POS (Vendor Dashboard)

**POS Screen** (`/pos/pos-screen`):
- Full transaction terminal interface with three screen states: `sale`, `checkout`, `receipt`
- Main logic: `app/pos/pos-screen/page.tsx`
- UI layout: `components/screens/pos-screen/DesktopPOSLayout.tsx`
- Types: `components/screens/pos-screen/types.ts` (includes `CartItem`, `Fulfillment`, `Screen`, `ReceiptData`)
- Sale screen: Product search, barcode scanner, category filtering, cart management
- Checkout screen: Payment method selection, discount presets, quick amount buttons, customer selection
- Receipt screen: Visual receipt display + hidden printable thermal receipt (`#printable-receipt` div)
- Print functionality: Uses `@media print` CSS in `globals.css`
- State management: Local component state (cart items, selected customer, fulfillment, totals)

**POS API Endpoints** (12 total):

*Initial Data Loading (parallel)*:
- `GET /categories` - Category list
- `GET /stores` - Store list
- `GET /products/my?per_page=500` - Vendor products
- `GET /customers?per_page=20` - Customer list

*Product Operations*:
- `GET /stores/{store_id}/products` - Store-specific products (when store selected)
- `GET /products/barcode/{code}` - Find product by barcode
- `GET /products/sku/{code}` - Find product by SKU

*Transaction Flow*:
1. `POST /customers` - Create walk-in customer if needed: `{ name: "Walk-in Customer", status: "active" }`
2. `POST /orders` - Create order: `{ customer_id: number, ordered_at: "YYYY-MM-DD", status: "pending", items: [{ product_id, quantity }] }`
3. `POST /payments` - Create payment(s): `{ order_id, amount, method: "cash"|"card"|"online", status: "completed", paid_at: "YYYY-MM-DD HH:mm" }`
   - **Critical**: `paid_at` must be datetime format "YYYY-MM-DD HH:mm", not just date
   - `amount` must be rounded integer (use `Math.round()`)
4. `POST /products/bulk-stock-decrement` - Update inventory (non-blocking, silent fail): `{ items: [{ productId, quantity, variantSku }], orderId }`
5. Generate transaction number: `TXN-YYYYMMDD-XXXX` format
6. Display receipt screen with full details

*Order History*:
- `GET /orders` - Recent orders list

**Dashboard**:
- KPI metrics (Total Sales, Orders, Revenue)
- Charts: Sales trends, orders by channel, payment methods
- Inventory health, low stock alerts
- Top selling products, recent activity, pending orders

**Credit Accounts**:
- Customer credit management with cards and data table views
- Track credit limits, balances, and payment history

**Products, Orders, Customers, Payments**:
- Full CRUD operations using respective services
- Data tables with filtering, sorting, pagination

### Admin Portal

**Vendor Management**:
- List, create, view, update, delete vendors
- Vendor analytics and performance tracking

**User Management**:
- Admin user CRUD operations
- User suspension functionality

**Platform Analytics**:
- Overview dashboard with platform-wide metrics
- Revenue analytics, vendor analytics, user analytics
- Cross-vendor reporting

**Platform-wide Operations**:
- View all products across all vendors
- View all orders across all vendors
- Payment summaries and tracking

### E-commerce Storefront

**Product Browsing**:
- Landing page with hero section and featured products
- Category filtering, product search
- Product detail pages with image galleries

**Shopping Cart**:
- Slide-out CartSheet component
- Add/remove items, update quantities
- Subtotal, tax (12% VAT), discount, total calculations
- Cart persists in localStorage via Zustand

**Checkout Flow**:
- Customer information collection
- Order summary with totals
- Payment method selection
- Order success confirmation page

## Important Patterns

### API Calls
- **🚨 CRITICAL: NEVER create separate Axios instances** - always use the shared `axiosClient` from `lib/axios-client.ts`
  - **Known Issue (FIXED)**: Previously `api-client.ts` had its own Axios instance with broken refresh logic
  - This caused "session expired" errors because the separate instance didn't have the JWT interceptors
  - **Solution**: `api-client.ts` now wraps the shared `axiosClient` - all requests go through the same instance
- Import services via barrel export: `import { productService, orderService } from "@/services"`
- Services return raw API responses, components handle extraction and error handling
- API responses follow pattern: `{ success: boolean, data: T, message?: string, errors?: Record<string, string[]> }`
- **API Documentation**: Comprehensive endpoint docs at `docs/api/API_DOCUMENTATION.md`

**File Uploads**:
- **Always use `api.upload()`** for FormData/file uploads - never use `apiClient.post()` directly
- Example:
  ```typescript
  const formData = new FormData();
  formData.append('name', 'Product Name');
  formData.append('image', imageFile);

  // ✅ Correct
  const product = await api.upload<ApiProduct>('/products', formData);

  // ❌ Wrong - manual response extraction needed
  const response = await apiClient.post('/products', formData);
  return response.data.data; // error-prone
  ```

**File Downloads (Blob/PDF)**:
- **Use `axiosClient` directly** for blob responses - `api.get()` doesn't work for blobs
- Example:
  ```typescript
  // ✅ Correct - for PDF/blob downloads
  const response = await axiosClient.get(`/orders/${id}/invoice`, {
    responseType: 'blob'
  });
  return response.data; // Returns Blob

  // ❌ Wrong - api.get() tries to extract data.data which fails for blobs
  const blob = await api.get(`/orders/${id}/invoice`, {
    responseType: 'blob'
  });
  ```

### Money/Currency Calculations
- Use `currency.js` library via `lib/currency.ts` for all decimal calculations
- Helper: `PHP(amount)` for currency operations
- Cart calculations use `calculateSubtotal()` and `addVAT()` helpers

### Service Layer & Endpoints
- All API endpoints defined in `config/api-endpoints.ts` (admin/vendor auth) and `lib/api-endpoints.ts` (other endpoints)
- Services in `services/` directory are pure API wrappers with NO business logic
- Endpoints builder: Use `endpoints` object from `lib/api-endpoints.ts` for consistent URL construction

### State Management
- Zustand stores with `persist` middleware for localStorage sync
- Store naming: `use*Store` hooks (e.g., `useAuthStore`, `useCartStore`)
- Auth state includes: `user`, `userType`, `isAuthenticated`, 2FA flags, email verification status

## Recent Changes & Session Context

**Last Updated**: 2026-02-10 (added product image validation requirement)

### Recently Completed

**Critical Fixes**:
- ✅ **Fixed Axios Instance Architecture** (`lib/api-client.ts`, `lib/axios-client.ts`)
  - Issue: `api-client.ts` had its own separate Axios instance without JWT interceptors
  - Impact: Caused "session expired" errors, broken token refresh
  - Solution: `api-client.ts` now imports and wraps the shared `axiosClient`
  - All API helpers (`api.get`, `api.post`, etc.) now go through the single shared instance

**POS Screen Enhancements** (`app/pos/pos-screen/page.tsx`):
- ✅ Enhanced error logging for order/payment creation (full request/response details)
- ✅ Fixed payment datetime format: now uses "YYYY-MM-DD HH:mm" format (was only sending date)
- ✅ Added transaction number generation: `TXN-YYYYMMDD-XXXX` format
- ✅ Improved `ReceiptData` type structure with all required fields
- ✅ Added receipt screen flow: completeOrder → receipt screen → print functionality
- ✅ Better validation error extraction and display in Swal alerts

**New Features**:
- ✅ Admin User Management service (`services/admin-user.service.ts`)
  - Full CRUD operations for admin users
  - Status management (active/inactive/suspended)
  - User type filtering (admin/vendor/buyer)

**New Features - POS Transaction Success**:
- ✅ **Transaction Success Modal** (`app/pos/pos-screen/page.tsx`)
  - Replaces screen change with modal dialog after successful payment
  - Shows transaction summary with success animation
  - Includes transaction number, customer, totals, payment details
  - "Print Receipt" button opens thermal printer preview
  - "New Transaction" button resets POS to sale screen

- ✅ **Thermal Receipt Printing**
  - New `ThermalReceipt` component for 80mm thermal printers
  - Hidden on screen, visible only when printing
  - Formatted for thermal printer (monospace, 80mm width)
  - Includes: store header, transaction details, items, totals, payment info, footer
  - Print preview allows saving as PDF
  - Updated print styles in `globals.css` for thermal receipt

- ✅ **Product Image Validation** (`app/pos/products/page.tsx`)
  - Added validation requiring image upload for new products
  - Validation message: "Product image is required."
  - Visual indicator: Red asterisk (*) next to "Media" section header
  - Helper text: "Image required for new products"
  - Only enforced for new products, not when editing existing products

**Bug Fixes**:
- ✅ **Product Image Upload** (`services/product.service.ts`)
  - Issue: `apiClient.post()` was manually extracting `response.data.data` causing errors
  - Fix: Changed to use `api.upload()` helper for FormData uploads
  - Affected methods: `create()`, `update()`, `patch()`
  - Result: Product creation/update with images now works correctly

- ✅ **Order Invoice/Receipt Download** (`services/order.service.ts`, `app/pos/orders/page.tsx`)
  - Issue: 404 error when downloading invoice - `api.get()` doesn't work for blob responses
  - Fix: Use `axiosClient` directly for blob/PDF downloads
  - Methods fixed: `getInvoice()`, `getReceipt()`
  - Better error message when endpoint doesn't exist (404)

- ✅ **Transaction Flow** (`app/pos/pos-screen/page.tsx`)
  - Fixed: Screen no longer changes to receipt after payment
  - Fixed: Cart no longer clears automatically (waits for "New Transaction")
  - Fixed: Success modal stays open until user dismisses or starts new transaction
  - Fixed: Print now shows thermal receipt instead of empty page

**POS Order Creation Enhancements**:
- ✅ Added `store_id` to order payload (if store selected)
- ✅ Added `total` amount to order payload
- ✅ Added `price` field to each order item
- **Note**: Still experiencing 500 error from backend - this is a server-side issue requiring Laravel logs review

**Documentation**:
- ✅ Comprehensive API documentation at `docs/api/API_DOCUMENTATION.md`
  - All endpoints with request/response examples
  - Query parameters and validation rules
  - Error response formats
- ✅ POS Screen API endpoint mapping documented in CLAUDE.md (12 endpoints total)
  - Initial data loading (categories, stores, products, customers)
  - Product operations (barcode/SKU lookup, store products)
  - Complete transaction flow (customer → order → payment → inventory)
  - Order history

### Known Patterns & Requirements

**API Date/Time Formats**:
- Order `ordered_at`: `"YYYY-MM-DD"` (date only)
- Payment `paid_at`: `"YYYY-MM-DD HH:mm"` (datetime with minutes)
- Never send timezone suffixes - API expects local time in "Asia/Manila"

**Numeric Fields**:
- All monetary amounts: integers only (no decimals), stored in centavos/cents
- Use `Math.round()` before sending to API
- Use `currency.js` for calculations, convert to integer for API

**Error Handling**:
- 500 errors: Full details logged to console with `JSON.stringify()`
- Validation errors: Extract from `response.data.errors` or `err.errors`
- Network errors: Check if `err.response` exists before accessing

### Current State
- ✅ POS Screen: UI fully functional (Sale → Checkout screens working)
- ❌ POS Order Creation: Backend returning 500 error - **BACKEND ISSUE**
- ✅ Product Management: Image uploads working (fixed)
- ✅ Authentication: JWT with refresh working correctly across admin and vendor contexts
- ✅ API Client: Single shared instance with proper interceptors
- 🟡 Admin Portal: User management implemented, other sections may need work
- 🟡 E-commerce: Guest shopping works, customer accounts not yet implemented

### Known Issues (Backend)

**POS Order Creation - 500 Error**:
- **Status**: Blocked by backend issue
- **Frontend**: Sending correct payload with all required fields
- **Backend**: Returns generic "Server Error" without details
- **Payload Being Sent**:
  ```json
  {
    "customer_id": 19,
    "ordered_at": "2026-02-10",
    "status": "pending",
    "store_id": 1,
    "total": 67,
    "items": [{"product_id": 2, "quantity": 2, "price": 30}]
  }
  ```
- **Required Action**: Backend developer needs to:
  1. Check Laravel logs: `tail -f storage/logs/laravel.log`
  2. Enable debug mode: `APP_DEBUG=true`
  3. Fix missing fields: likely `vendor_id` not being set from auth
  4. Check database constraints and relationships
- **Documentation**: Full backend issue report provided to developer

### Uncommitted Changes
Check `git status` - there are modified files that capture recent fixes. Consider committing with message like:
```
fix: resolve axios instance architecture and enhance POS error handling

- Fix api-client to use shared axiosClient instance
- Add comprehensive error logging for POS transactions
- Fix payment datetime format (YYYY-MM-DD HH:mm)
- Add admin user management service
- Update API documentation
```
