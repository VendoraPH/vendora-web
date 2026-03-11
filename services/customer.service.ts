/**
 * Customer Service
 *
 * Handles all customer-related API calls
 */

import api from "@/lib/api-client"
import { endpoints } from "@/lib/api-endpoints"

/**
 * Customer data from API
 */
export interface ApiCustomer {
    id: number
    name: string
    email?: string | null
    phone?: string | null
    address?: string | null
    orders_count?: number
    total_spent?: number
    status: "active" | "inactive" | "vip"
    created_at: string
    updated_at: string
}

/**
 * Customer payload for creating/updating
 */
export interface CustomerPayload {
    name: string
    email?: string | null
    phone?: string | null
    status?: "active" | "inactive" | "vip"
}

/**
 * Customer filters for list endpoint
 */
export interface CustomerFilters {
    search?: string
    status?: string
    sort?: string
    direction?: "asc" | "desc"
    page?: number
    per_page?: number
}

/**
 * Customer summary response
 */
export interface CustomerSummary {
    total_customers: number
    active: number
    vip: number
    inactive: number
}

/**
 * Paginated response structure
 */
export interface PaginatedCustomerResponse {
    data: ApiCustomer[]
    meta?: {
        current_page: number
        per_page: number
        total: number
    }
}

export const customerService = {
    /**
     * Get all customers with optional filters
     * GET /api/customers
     */
    getAll: async (filters?: CustomerFilters): Promise<PaginatedCustomerResponse> => {
        return api.get<PaginatedCustomerResponse>(endpoints.customers.list(), {
            params: filters,
        })
    },

    /**
     * Get single customer by ID
     * GET /api/customers/{customer}
     */
    getById: async (id: string | number): Promise<ApiCustomer> => {
        return api.get<ApiCustomer>(endpoints.customers.get(id))
    },

    /**
     * Create new customer
     * POST /api/customers
     */
    create: async (data: CustomerPayload): Promise<ApiCustomer> => {
        return api.post<ApiCustomer>(endpoints.customers.create(), data)
    },

    /**
     * Update existing customer
     * PATCH /api/customers/{customer}
     */
    update: async (id: string | number, data: Partial<CustomerPayload>): Promise<ApiCustomer> => {
        return api.patch<ApiCustomer>(endpoints.customers.update(id), data)
    },

    /**
     * Delete customer
     * DELETE /api/customers/{customer}
     */
    delete: async (id: string | number): Promise<void> => {
        return api.delete(endpoints.customers.delete(id))
    },

    /**
     * Get customer summary
     * GET /api/customers/summary
     */
    getSummary: async (): Promise<CustomerSummary> => {
        return api.get<CustomerSummary>(endpoints.customers.summary())
    },
}
