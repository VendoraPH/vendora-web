/**
 * Store Staff Service
 *
 * Handles store staff and role management API calls
 */

import api from "@/lib/api-client"
import { endpoints } from "@/lib/api-endpoints"

export interface StoreRole {
  id: number
  name: string
  permissions?: string[]
  created_at?: string
  updated_at?: string
}

export interface StoreStaffMember {
  id: number
  user_id: number
  store_id: number
  name?: string
  email: string
  role?: string
  permissions?: string[]
  status?: "active" | "inactive"
  created_at?: string
  updated_at?: string
}

export interface AddStaffPayload {
  email: string
  role: string
  permissions?: string[]
}

export interface UpdateStaffPayload {
  role?: string
  permissions?: string[]
}

export const storeStaffService = {
  /**
   * Get all store roles
   * GET /api/store-roles
   */
  getRoles: async (): Promise<StoreRole[]> => {
    return api.get<StoreRole[]>(endpoints.storeRoles.list())
  },

  /**
   * Get staff members for a store
   * GET /api/stores/{store}/staff
   */
  getStaff: async (storeId: string | number): Promise<StoreStaffMember[]> => {
    return api.get<StoreStaffMember[]>(endpoints.stores.staff(storeId))
  },

  /**
   * Add staff member to a store
   * POST /api/stores/{store}/staff
   */
  addStaff: async (storeId: string | number, data: AddStaffPayload): Promise<StoreStaffMember> => {
    return api.post<StoreStaffMember>(endpoints.stores.staff(storeId), data)
  },

  /**
   * Update a staff member
   * PATCH /api/stores/{store}/staff/{user}
   */
  updateStaff: async (
    storeId: string | number,
    userId: string | number,
    data: UpdateStaffPayload
  ): Promise<StoreStaffMember> => {
    return api.patch<StoreStaffMember>(endpoints.stores.staffMember(storeId, userId), data)
  },

  /**
   * Remove a staff member from a store
   * DELETE /api/stores/{store}/staff/{user}
   */
  removeStaff: async (storeId: string | number, userId: string | number): Promise<void> => {
    return api.delete(endpoints.stores.staffMember(storeId, userId))
  },
}
