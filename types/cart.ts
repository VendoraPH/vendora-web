/**
 * Shopping Cart Type Definitions
 */

import { Product, ProductVariant } from "./product"

export interface CartItem {
  id: string
  product: Product
  variant?: ProductVariant
  quantity: number
  price: number
  subtotal: number
}

export interface Cart {
  items: CartItem[]
  subtotal: number
  tax: number
  taxRate: number
  discount: number
  discountCode?: string
  shipping: number
  total: number
}

export interface CartState extends Cart {
  addItem: (product: Product, quantity?: number, variant?: ProductVariant) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  applyDiscount: (code: string, amount: number) => void
  removeDiscount: () => void
  setShipping: (amount: number) => void
  recalculate: () => void
}
