/**
 * Food Menu Service
 *
 * Handles all food menu-related API calls
 */

import api from "@/lib/api-client"
import { endpoints } from "@/lib/api-endpoints"

export interface FoodMenuItem {
  id: number
  user_id?: number
  store_id?: number | null
  name: string
  description: string
  category: string
  price: number
  currency?: string
  image?: string | null
  total_servings: number
  reserved_servings: number
  remaining_servings?: number
  is_sold_out?: boolean
  is_available: boolean
  created_at?: string
  updated_at?: string
}

export interface FoodMenuFilters {
  category?: string
  search?: string
  is_available?: boolean
  date?: string
  page?: number
  per_page?: number
}

export interface FoodMenuCreatePayload {
  name: string
  description: string
  category: string
  price: number
  total_servings: number
  is_available: boolean
}

export interface FoodMenuUpdatePayload extends Partial<FoodMenuCreatePayload> {}

export interface PaginatedFoodMenuResponse {
  data: FoodMenuItem[]
  meta?: {
    current_page: number
    per_page: number
    total: number
  }
}

export interface FoodMenuReservation {
  id: number
  food_menu_item_id: number
  user_id: number
  customer_id?: number | null
  customer_name: string
  customer_phone?: string | null
  servings: number
  status: string
  notes?: string | null
  reserved_at?: string | null
  food_menu_item?: FoodMenuItem
  created_at?: string
  updated_at?: string
}

export interface ReservationCreatePayload {
  food_menu_item_id: number
  customer_name: string
  customer_phone?: string
  servings: number
  notes?: string
}

export interface PaginatedReservationResponse {
  data: FoodMenuReservation[]
  meta?: {
    current_page: number
    per_page: number
    total: number
  }
}

export const foodMenuService = {
  getAll: async (filters?: FoodMenuFilters): Promise<PaginatedFoodMenuResponse> => {
    return api.get<PaginatedFoodMenuResponse>(endpoints.foodMenu.list(), {
      params: filters,
    })
  },

  get: async (id: number): Promise<FoodMenuItem> => {
    return api.get<FoodMenuItem>(endpoints.foodMenu.get(id))
  },

  create: async (data: FoodMenuCreatePayload): Promise<FoodMenuItem> => {
    return api.post<FoodMenuItem>(endpoints.foodMenu.create(), data)
  },

  update: async (id: number, data: FoodMenuUpdatePayload): Promise<FoodMenuItem> => {
    return api.put<FoodMenuItem>(endpoints.foodMenu.update(id), data)
  },

  delete: async (id: number): Promise<void> => {
    return api.delete(endpoints.foodMenu.delete(id))
  },

  getCategories: async (): Promise<string[]> => {
    return api.get<string[]>(endpoints.foodMenu.categories())
  },

  getReservations: async (filters?: { status?: string; search?: string; page?: number; per_page?: number }): Promise<PaginatedReservationResponse> => {
    return api.get<PaginatedReservationResponse>(endpoints.foodMenu.reservations.list(), {
      params: filters,
    })
  },

  createReservation: async (data: ReservationCreatePayload): Promise<FoodMenuReservation> => {
    return api.post<FoodMenuReservation>(endpoints.foodMenu.reservations.create(), data)
  },

  updateReservationStatus: async (id: number, status: string): Promise<FoodMenuReservation> => {
    return api.put<FoodMenuReservation>(endpoints.foodMenu.reservations.update(id), { status })
  },
}
