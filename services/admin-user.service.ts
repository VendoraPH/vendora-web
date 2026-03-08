/**
 * Admin User Service
 *
 * Handles all admin user management API calls
 */

import api from "@/lib/api-client"
import { endpoints } from "@/lib/api-endpoints"

export interface AdminUser {
  id: number
  name: string
  email: string
  user_type: "admin" | "vendor" | "buyer"
  status: "active" | "inactive" | "suspended"
  created_at: string
  updated_at: string
}

export interface AdminUserFilters {
  search?: string
  user_type?: string
  status?: string
  page?: number
  per_page?: number
}

export interface AdminUserCreatePayload {
  name: string
  email: string
  password: string
  user_type: "admin" | "vendor" | "buyer"
}

export interface AdminUserUpdatePayload {
  name?: string
  email?: string
  user_type?: "admin" | "vendor" | "buyer"
}

export interface PaginatedAdminUserResponse {
  data: AdminUser[]
  meta?: {
    current_page: number
    per_page: number
    total: number
  }
}

export const adminUserService = {
  /**
   * Get all users with optional filters
   */
  getAll: async (filters?: AdminUserFilters): Promise<PaginatedAdminUserResponse> => {
    return api.get<PaginatedAdminUserResponse>(endpoints.admin.users.list(), {
      params: filters,
    })
  },

  /**
   * Get single user by ID
   */
  getById: async (id: number | string): Promise<AdminUser> => {
    return api.get<AdminUser>(endpoints.admin.users.get(id))
  },

  /**
   * Create new user
   */
  create: async (data: AdminUserCreatePayload): Promise<AdminUser> => {
    return api.post<AdminUser>(endpoints.admin.users.create(), data)
  },

  /**
   * Update existing user
   */
  update: async (id: number | string, data: AdminUserUpdatePayload): Promise<AdminUser> => {
    return api.put<AdminUser>(endpoints.admin.users.update(id), data)
  },

  /**
   * Delete user
   */
  delete: async (id: number | string): Promise<void> => {
    return api.delete(endpoints.admin.users.delete(id))
  },

  /**
   * Update user status
   */
  updateStatus: async (id: number | string, status: "active" | "inactive" | "suspended"): Promise<AdminUser> => {
    return api.patch<AdminUser>(endpoints.admin.users.updateStatus(id), { status })
  },
}
