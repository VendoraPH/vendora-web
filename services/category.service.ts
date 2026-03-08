/**
 * Category Service
 *
 * Handles all category-related API calls
 * API Endpoint: /api/categories
 */

import api from "@/lib/api-client"
import { endpoints } from "@/lib/api-endpoints"

/**
 * Category data from API (matches actual API response)
 */
export interface ApiCategory {
  id: number
  name: string
  slug?: string
  description?: string
  icon?: string
  is_active?: boolean
  created_at?: string
  updated_at?: string
}

/**
 * Category list response (from api-client after extraction)
 * Note: The api-client extracts response.data.data, so this is the array
 */
export type CategoryListResponse = ApiCategory[]

export const categoryService = {
  /**
   * Get all categories
   * GET /api/categories
   */
  getAll: async (): Promise<CategoryListResponse> => {
    return api.get<CategoryListResponse>(endpoints.categories.list())
  },

  /**
   * Get single category by ID
   * GET /api/categories/{category}
   */
  getById: async (id: string | number): Promise<ApiCategory> => {
    return api.get<ApiCategory>(endpoints.categories.get(id))
  },

  /**
   * Create a new category
   * POST /api/categories
   */
  create: async (data: { name: string; description?: string; icon?: string; is_active?: boolean }): Promise<ApiCategory> => {
    return api.post<ApiCategory>(endpoints.categories.create(), data)
  },

  /**
   * Update an existing category
   * PUT /api/categories/{category}
   */
  update: async (id: string | number, data: Partial<{ name: string; description?: string; icon?: string; is_active?: boolean }>): Promise<ApiCategory> => {
    return api.put<ApiCategory>(endpoints.categories.update(id), data)
  },

  /**
   * Delete a category
   * DELETE /api/categories/{category}
   */
  delete: async (id: string | number): Promise<void> => {
    return api.delete(endpoints.categories.delete(id))
  },
}
