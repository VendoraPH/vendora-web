/**
 * Customer Type Definitions
 */

import { Address } from "./order"

export interface Customer {
  id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  phone?: string
  avatar?: string
  addresses: Address[]
  defaultAddressId?: string
  loyaltyPoints: number
  totalOrders: number
  totalSpent: number
  createdAt: Date
  updatedAt: Date
  lastOrderDate?: Date
}

export interface CustomerFilters {
  search?: string
  minOrders?: number
  minSpent?: number
  hasLoyaltyPoints?: boolean
  sort?: "name-asc" | "name-desc" | "spent-desc" | "orders-desc" | "recent"
}
