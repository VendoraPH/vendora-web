/**
 * Credit Service
 *
 * Handles all credit-related API calls
 * Endpoints:
 *   GET    /api/credits
 *   POST   /api/credits
 *   GET    /api/credits/{id}
 *   POST   /api/credits/{id}/payment
 *   GET    /api/customers/{customer}/credits
 */

import api from "@/lib/api-client"
import { endpoints } from "@/lib/api-endpoints"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single order item inside a credit's associated order */
export interface ApiCreditOrderItem {
    id: number
    product_id?: number | null
    product_name?: string | null
    product?: { id: number; name: string; price?: number | null } | null
    quantity: number
    price?: number | null
    unit_price?: number | null
    sale_price?: number | null
    total?: number | null
}

/** A single credit record as returned by the API */
export interface ApiCredit {
    id: number
    customer_id: number
    /** ID of the order that created this credit */
    order_id?: number | null
    customer?: {
        id: number
        name: string
        phone?: string | null
        email?: string | null
        address?: string | null
    }
    /** Credit customer info as stored from order credit_customer object */
    credit_customer?: {
        first_name?: string | null
        middle_name?: string | null
        last_name?: string | null
        contact_number?: string | null
        address?: string | null
    }
    /** Order associated with this credit (may be included in detail response) */
    order?: {
        id: number
        order_number?: string | null
        ordered_at?: string | null
        items?: ApiCreditOrderItem[]
    } | null
    /** Total original credit amount */
    amount: number
    /** Total amount paid so far */
    paid_amount: number
    /** Remaining unpaid balance */
    balance: number
    status: "active" | "overdue" | "paid" | "defaulted"
    due_date?: string | null
    credit_limit?: number | null
    notes?: string | null
    created_at: string
    updated_at: string
}

/** Payload for issuing credit to a customer */
export interface CreateCreditPayload {
    customer_id: number
    amount: number
    reference?: string
    notes?: string
}

/** Payload for recording a credit payment */
export interface CreditPaymentPayload {
    amount: number
    method: "cash" | "card" | "online"
}

/** Filters for listing credits */
export interface CreditFilters {
    search?: string
    status?: "active" | "overdue" | "paid" | "defaulted"
    customer_id?: number
    page?: number
    per_page?: number
}

/** Paginated response for credits list */
export interface PaginatedCreditResponse {
    data: ApiCredit[]
    meta?: {
        current_page: number
        per_page: number
        total: number
        last_page?: number
    }
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const creditService = {
    /**
     * List all credit transactions
     * GET /api/credits
     */
    getAll: async (filters?: CreditFilters): Promise<PaginatedCreditResponse> => {
        try {
            const response = await api.get<PaginatedCreditResponse>(
                endpoints.credits.list(),
                { params: filters }
            )
            // Handle both paginated { data: [...] } and plain array responses
            if (Array.isArray(response)) {
                return { data: response as unknown as ApiCredit[] }
            }
            return response
        } catch (err: any) {
            // 404 may mean the endpoint exists but returned no results, OR the
            // endpoint does not exist yet. Log so it is visible during development.
            if (err?.response?.status === 404) {
                console.warn("GET /api/credits returned 404 — endpoint may not exist or has no data")
                return { data: [] }
            }
            throw err
        }
    },

    /**
     * Issue credit to a customer
     * POST /api/credits
     */
    create: async (payload: CreateCreditPayload): Promise<ApiCredit> => {
        return api.post<ApiCredit>(endpoints.credits.create(), payload)
    },

    /**
     * Get a single credit record by ID
     * GET /api/credits/{id}
     */
    getById: async (id: string | number): Promise<ApiCredit> => {
        return api.get<ApiCredit>(endpoints.credits.get(id))
    },

    /**
     * Record a payment against an existing credit
     * POST /api/credits/{id}/payment
     */
    recordPayment: async (creditId: string | number, payload: CreditPaymentPayload): Promise<ApiCredit> => {
        return api.post<ApiCredit>(endpoints.credits.recordPayment(creditId), payload)
    },

    /**
     * Get credit transactions for a specific customer
     * GET /api/customers/{customer}/credits
     */
    getByCustomer: async (customerId: string | number): Promise<ApiCredit[] | PaginatedCreditResponse> => {
        const response = await api.get<ApiCredit[] | PaginatedCreditResponse>(
            endpoints.credits.getByCustomer(customerId)
        )
        return response
    },
}
