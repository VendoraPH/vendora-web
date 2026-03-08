/**
 * Services - Barrel Export
 *
 * Central export point for all API services
 */

export * from "./auth.service"
export * from "./product.service"
export * from "./category.service"
export * from "./order.service"
export * from "./payment.service"
export * from "./customer.service"
export * from "./store.service"
export * from "./dashboard.service"
export * from "./admin-user.service"
export * from "./ledger.service"
export * from "./inventory.service"
export * from "./store-staff.service"
export * from "./credit.service"
export * from "./food-menu.service"

// Re-export types for convenience
export type {
  ApiProduct,
  ProductPayload,
  ProductFilters,
  ProductCategory,
  PaginatedProductResponse,
  StockUpdatePayload,
  BulkStockItem,
  BulkStockDecrementPayload,
} from "./product.service"

export type {
  ApiCategory,
  CategoryListResponse,
} from "./category.service"

export type {
  ApiPayment,
  PaymentPayload,
  PaymentFilters,
  PaymentSummary,
  PaginatedPaymentResponse,
} from "./payment.service"

export type {
  ApiCustomer,
  CustomerPayload,
  CustomerFilters,
  CustomerSummary,
  PaginatedCustomerResponse,
} from "./customer.service"

export type {
  ApiStore,
  StorePayload,
  StoreListResponse,
} from "./store.service"

export type {
  AdminUser,
  AdminUserFilters,
  AdminUserCreatePayload,
  AdminUserUpdatePayload,
  PaginatedAdminUserResponse,
} from "./admin-user.service"

export type {
  LedgerEntry,
  LedgerFilters,
  LedgerSummary,
  LedgerCreatePayload,
  PaginatedLedgerResponse,
} from "./ledger.service"

export type {
  InventoryItem,
  InventoryFilters,
  InventorySummary,
  InventoryAdjustment,
  PaginatedInventoryResponse,
} from "./inventory.service"

export type {
  StoreRole,
  StoreStaffMember,
  AddStaffPayload,
  UpdateStaffPayload,
} from "./store-staff.service"

export type {
  ApiCredit,
  CreditFilters,
  PaginatedCreditResponse,
} from "./credit.service"

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
