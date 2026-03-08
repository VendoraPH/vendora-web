/**
 * Product Service
 *
 * Handles all product-related API calls
 * API Endpoint: /api/products
 */

import api from "@/lib/api-client"
import { endpoints } from "@/lib/api-endpoints"

/**
 * Product category from API
 */
export interface ProductCategory {
  id: number
  name: string
  slug?: string
  description?: string
  icon?: string
  is_active?: boolean
}

/**
 * Product filters for list endpoint
 */
export interface ProductFilters {
  search?: string
  category_id?: number
  min_price?: number
  max_price?: number
  in_stock?: boolean
  sort?: string
  direction?: "asc" | "desc"
  page?: number
  per_page?: number
}

/**
 * Product data from API (matches actual API response)
 */
export interface ApiProduct {
  id: number
  name: string
  description?: string
  sku: string
  barcode?: string | null
  has_barcode?: boolean
  category: ProductCategory
  price: number
  cost?: number
  currency: string
  unit?: string
  stock: number
  min_stock?: number
  max_stock?: number
  is_low_stock: boolean
  image?: string | null
  is_active?: boolean
  is_ecommerce?: boolean
  bulk_pricing?: { min_qty: number; price: number }[]
  vendor?: {
    id: number
    name: string
  }
  created_at: string
  updated_at: string
}

/**
 * Payload for creating/updating a product
 */
export interface ProductPayload {
  name: string
  sku: string
  category_id: number
  price: number
  currency: string
  stock: number
  // Optional fields
  description?: string
  barcode?: string
  cost?: number
  unit?: string
  min_stock?: number
  max_stock?: number
  image?: string | File
  is_active?: boolean
  is_ecommerce?: boolean
}

/**
 * Payload for updating product stock
 */
export interface StockUpdatePayload {
  stock: number
  note?: string
}

/**
 * Item for bulk stock decrement
 */
export interface BulkStockItem {
  productId: number
  quantity: number
  variantSku?: string | null
}

/**
 * Payload for bulk stock decrement
 */
export interface BulkStockDecrementPayload {
  items: BulkStockItem[]
  orderId: string
}

/**
 * Paginated response structure (from api-client after extraction)
 * Note: The api-client extracts response.data.data, so this is the array
 */
export type PaginatedProductResponse = ApiProduct[]

/**
 * Helper to build FormData from product payload
 */
const buildProductFormData = (data: ProductPayload | Partial<ProductPayload>): FormData => {
  const formData = new FormData()

  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return

    if (key === "image") {
      if (value instanceof File) {
        formData.append("image", value)
      } else if (typeof value === "string" && value.startsWith("data:")) {
        // Convert base64 to blob and append
        const parts = value.split(",")
        const meta = parts[0] ?? ""
        const base64 = parts[1] ?? ""
        const mimeMatch = meta.match(/:(.*?);/)
        const mime = mimeMatch?.[1] ?? "image/jpeg"
        const byteString = atob(base64)
        const ab = new ArrayBuffer(byteString.length)
        const ia = new Uint8Array(ab)
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i)
        }
        const blob = new Blob([ab], { type: mime })
        formData.append("image", blob, `product-image.${mime.split("/")[1]}`)
      }
    } else if (typeof value === "boolean") {
      formData.append(key, value ? "1" : "0")
    } else {
      formData.append(key, String(value))
    }
  })

  return formData
}

export const productService = {
  /**
   * Get all products with optional filters
   * GET /api/products
   */
  getAll: async (filters?: ProductFilters): Promise<PaginatedProductResponse> => {
    return api.get<PaginatedProductResponse>(endpoints.products.list(), {
      params: filters,
    })
  },

  /**
   * Get current vendor's products
   * GET /api/products/my
   */
  getMy: async (filters?: ProductFilters): Promise<PaginatedProductResponse> => {
    return api.get<PaginatedProductResponse>(endpoints.products.my(), {
      params: filters,
    })
  },

  /**
   * Get single product by ID
   * GET /api/products/{product}
   */
  getById: async (id: string | number): Promise<ApiProduct> => {
    return api.get<ApiProduct>(endpoints.products.get(id))
  },

  /**
   * Get product by SKU
   * GET /api/products/sku/{sku}
   */
  getBySku: async (sku: string): Promise<ApiProduct> => {
    return api.get<ApiProduct>(endpoints.products.getBySku(sku))
  },

  /**
   * Get product by barcode
   * GET /api/products/barcode/{code}
   */
  getByBarcode: async (code: string): Promise<ApiProduct> => {
    return api.get<ApiProduct>(endpoints.products.getByBarcode(code))
  },

  /**
   * Create new product
   * POST /api/products
   */
  create: async (data: ProductPayload): Promise<ApiProduct> => {
    // Check if we have an image to upload
    const hasImage = data.image && (data.image instanceof File ||
      (typeof data.image === "string" && data.image.startsWith("data:")))

    if (hasImage) {
      const formData = buildProductFormData(data)
      // Use api.upload() which handles FormData and response extraction
      return api.upload<ApiProduct>(endpoints.products.create(), formData)
    }

    // No image, use regular JSON request
    const { image, ...payload } = data
    return api.post<ApiProduct>(endpoints.products.create(), payload)
  },

  /**
   * Update existing product (full update)
   * PUT /api/products/{product}
   */
  update: async (id: string | number, data: ProductPayload): Promise<ApiProduct> => {
    const hasImage = data.image && (data.image instanceof File ||
      (typeof data.image === "string" && data.image.startsWith("data:")))

    if (hasImage) {
      const formData = buildProductFormData(data)
      formData.append("_method", "PUT")
      // Use api.upload() which handles FormData and response extraction
      return api.upload<ApiProduct>(endpoints.products.update(id), formData)
    }

    const { image, ...payload } = data
    return api.put<ApiProduct>(endpoints.products.update(id), payload)
  },

  /**
   * Partially update existing product
   * PATCH /api/products/{product}
   */
  patch: async (id: string | number, data: Partial<ProductPayload>): Promise<ApiProduct> => {
    const hasImage = data.image && (data.image instanceof File ||
      (typeof data.image === "string" && data.image.startsWith("data:")))

    if (hasImage) {
      const formData = buildProductFormData(data)
      formData.append("_method", "PATCH")
      // Use api.upload() which handles FormData and response extraction
      return api.upload<ApiProduct>(endpoints.products.update(id), formData)
    }

    const { image, ...payload } = data
    return api.patch<ApiProduct>(endpoints.products.update(id), payload)
  },

  /**
   * Delete product
   * DELETE /api/products/{product}
   */
  delete: async (id: string | number): Promise<void> => {
    return api.delete(endpoints.products.delete(id))
  },

  /**
   * Update product stock
   * PATCH /api/products/{product}/stock
   */
  updateStock: async (id: string | number, data: StockUpdatePayload): Promise<ApiProduct> => {
    return api.patch<ApiProduct>(endpoints.products.updateStock(id), data)
  },

  /**
   * Bulk decrement stock for multiple products
   * POST /api/products/bulk-stock-decrement
   */
  bulkStockDecrement: async (data: BulkStockDecrementPayload): Promise<void> => {
    return api.post(endpoints.products.bulkStockDecrement(), data)
  },

  /**
   * Search products
   */
  search: async (query: string): Promise<ApiProduct[]> => {
    return api.get<ApiProduct[]>(endpoints.products.search(), {
      params: { search: query },
    })
  },

  /**
   * Get featured products
   */
  getFeatured: async (): Promise<ApiProduct[]> => {
    return api.get<ApiProduct[]>(endpoints.products.featured())
  },

  /**
   * Get products by category
   */
  getByCategory: async (categoryId: string | number): Promise<ApiProduct[]> => {
    return api.get<ApiProduct[]>(endpoints.products.byCategory(categoryId))
  },

  /**
   * Get product variants
   */
  getVariants: async (productId: string | number) => {
    return api.get(endpoints.products.variants(productId))
  },
}
