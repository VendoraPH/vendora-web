/**
 * Inventory Service
 *
 * Handles all inventory management API calls
 */

import api from "@/lib/api-client"
import { endpoints } from "@/lib/api-endpoints"

export interface InventoryItem {
  id: number
  product_id: number
  product_name?: string
  quantity: number
  status?: "in_stock" | "low_stock" | "out_of_stock"
  created_at?: string
  updated_at?: string
}

export interface InventoryFilters {
  search?: string
  status?: string
  page?: number
  per_page?: number
}

export interface InventorySummary {
  total_items: number
  low_stock_items: number
  out_of_stock_items: number
}

export interface InventoryAdjustment {
  product_id: number
  type: "add" | "remove"
  quantity: number
  note?: string
}

export interface PaginatedInventoryResponse {
  data: InventoryItem[]
  meta?: {
    current_page: number
    per_page: number
    total: number
  }
}

export const inventoryService = {
  /**
   * Get all inventory items with optional filters
   * GET /api/inventory
   */
  getAll: async (filters?: InventoryFilters): Promise<PaginatedInventoryResponse> => {
    return api.get<PaginatedInventoryResponse>(endpoints.inventory.list(), {
      params: filters,
    })
  },

  /**
   * Get inventory summary
   * GET /api/inventory/summary
   */
  getSummary: async (): Promise<InventorySummary> => {
    return api.get<InventorySummary>(endpoints.inventory.summary())
  },

  /**
   * Create inventory adjustment
   * POST /api/inventory/adjustments
   */
  adjust: async (data: InventoryAdjustment): Promise<void> => {
    return api.post(endpoints.inventory.adjustments(), data)
  },
}
