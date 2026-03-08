/**
 * Product Type Definitions
 */

export interface Product {
  id: string
  name: string
  description: string
  price: number
  discountPrice?: number
  sku: string
  barcode?: string
  category: Category
  images: string[]
  mainImage: string
  stock: number
  lowStockThreshold: number
  unit: string
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  tags: string[]
  variants?: ProductVariant[]
  isActive: boolean
  isFeatured: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  parentId?: string
  image?: string
  order: number
}

export interface ProductVariant {
  id: string
  name: string
  options: VariantOption[]
  price: number
  stock: number
  sku: string
}

export interface VariantOption {
  name: string
  value: string
}

export interface ProductFilters {
  category?: string
  minPrice?: number
  maxPrice?: number
  inStock?: boolean
  search?: string
  tags?: string[]
  sort?: "price-asc" | "price-desc" | "name-asc" | "name-desc" | "newest"
}
