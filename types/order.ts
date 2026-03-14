/**
 * Order Type Definitions
 */

import { CartItem } from "./cart"
import { Customer } from "./customer"

export interface Order {
  id: string
  orderNumber: string
  customer: Customer
  items: CartItem[]
  subtotal: number
  tax: number
  taxRate: number
  discount: number
  discountCode?: string
  shipping: number
  total: number
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
  shippingAddress?: Address
  billingAddress?: Address
  notes?: string
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
}

export type OrderStatus =
  | "pending"
  | "processing"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded"

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded"

export type PaymentMethod = "cash" | "card" | "gcash" | "bank_transfer" | "paymaya"

export interface Address {
  id?: string
  fullName: string
  phone: string
  addressLine1: string
  addressLine2?: string
  city: string
  province: string
  postalCode: string
  country: string
  isDefault?: boolean
}

export interface OrderFilters {
  status?: OrderStatus
  paymentStatus?: PaymentStatus
  startDate?: Date
  endDate?: Date
  customerId?: string
  search?: string
  channel?: 'online' | 'pos'
  per_page?: number
}
