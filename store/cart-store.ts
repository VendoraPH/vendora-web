import { create } from "zustand"
import { persist } from "zustand/middleware"
import { CartState, CartItem } from "@/types"
import { Product, ProductVariant } from "@/types"
import PHP, { calculateSubtotal } from "@/lib/currency"

/**
 * Shopping Cart Store
 *
 * Manages cart state with persistence to localStorage
 */
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      subtotal: 0,
      tax: 0,
      taxRate: 12, // 12% VAT for Philippines
      discount: 0,
      discountCode: undefined,
      shipping: 0,
      total: 0,

      addItem: (product: Product, quantity = 1, variant?: ProductVariant) => {
        const items = get().items
        const price = variant?.price || product.discountPrice || product.price

        // Check if item already exists
        const existingItemIndex = items.findIndex(
          (item) =>
            item.product.id === product.id &&
            item.variant?.id === variant?.id
        )

        let newItems: CartItem[]

        if (existingItemIndex > -1) {
          // Update quantity if item exists
          newItems = items.map((item, index) =>
            index === existingItemIndex
              ? {
                  ...item,
                  quantity: item.quantity + quantity,
                  subtotal: PHP(price).multiply(item.quantity + quantity).value,
                }
              : item
          )
        } else {
          // Add new item
          const newItem: CartItem = {
            id: `${product.id}-${variant?.id || "default"}`,
            product,
            variant,
            quantity,
            price,
            subtotal: PHP(price).multiply(quantity).value,
          }
          newItems = [...items, newItem]
        }

        set({ items: newItems })
        get().recalculate()
      },

      removeItem: (itemId: string) => {
        const items = get().items.filter((item) => item.id !== itemId)
        set({ items })
        get().recalculate()
      },

      updateQuantity: (itemId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(itemId)
          return
        }

        const items = get().items.map((item) =>
          item.id === itemId
            ? {
                ...item,
                quantity,
                subtotal: PHP(item.price).multiply(quantity).value,
              }
            : item
        )

        set({ items })
        get().recalculate()
      },

      clearCart: () => {
        set({
          items: [],
          subtotal: 0,
          tax: 0,
          discount: 0,
          discountCode: undefined,
          shipping: 0,
          total: 0,
        })
      },

      applyDiscount: (code: string, amount: number) => {
        set({ discountCode: code, discount: amount })
        get().recalculate()
      },

      removeDiscount: () => {
        set({ discountCode: undefined, discount: 0 })
        get().recalculate()
      },

      setShipping: (amount: number) => {
        set({ shipping: amount })
        get().recalculate()
      },

      recalculate: () => {
        const { items, taxRate, discount, shipping } = get()

        const subtotal = calculateSubtotal(
          items.map((item) => ({
            price: item.price,
            quantity: item.quantity,
          }))
        ).value

        const afterDiscount = PHP(subtotal).subtract(discount).value
        const tax = PHP(afterDiscount).multiply(taxRate / 100).value
        const total = PHP(afterDiscount).add(tax).add(shipping).value

        set({ subtotal, tax, total })
      },
    }),
    {
      name: "cart-storage",
    }
  )
)
