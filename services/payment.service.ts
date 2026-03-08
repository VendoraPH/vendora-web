/**
 * Payment Service
 *
 * Handles all payment-related API calls
 */

import api from "@/lib/api-client"
import { endpoints } from "@/lib/api-endpoints"

/**
 * Payment data from API
 */
export interface ApiPayment {
    id: number
    payment_number: string
    order_id: number
    customer: string
    paid_at: string
    amount: number
    currency: string
    method: "cash" | "card" | "online"
    status: "pending" | "completed" | "failed" | "refunded"
    created_at?: string
    updated_at?: string
}

/**
 * Payment payload for creating a payment
 */
export interface PaymentPayload {
    order_id: number
    amount: number
    method: "cash" | "card" | "online"
    paid_at?: string
    payment_date?: string  // Payment date in YYYY-MM-DD format
    status?: "pending" | "completed" | "failed"
}

/**
 * Payment filters for list endpoint
 */
export interface PaymentFilters {
    search?: string
    status?: string
    method?: "cash" | "card" | "online"
    page?: number
    per_page?: number
}

/**
 * Payment summary response
 */
export interface PaymentSummary {
    total_revenue: number
    cash_payments: number
    card_payments: number
    online_payments: number
}

/**
 * Paginated response structure
 */
export interface PaginatedPaymentResponse {
    data: ApiPayment[]
    meta?: {
        current_page: number
        per_page: number
        total: number
    }
}

export const paymentService = {
    /**
     * Get all payments with optional filters
     * GET /api/payments
     */
    getAll: async (filters?: PaymentFilters): Promise<PaginatedPaymentResponse> => {
        return api.get<PaginatedPaymentResponse>(endpoints.payments.list(), {
            params: filters,
        })
    },

    /**
     * Get single payment by ID
     * GET /api/payments/{payment}
     */
    getById: async (id: string | number): Promise<ApiPayment> => {
        return api.get<ApiPayment>(endpoints.payments.get(id))
    },

    /**
     * Create new payment
     * POST /api/payments
     */
    create: async (data: PaymentPayload): Promise<ApiPayment> => {
        return api.post<ApiPayment>(endpoints.payments.create(), data)
    },

    /**
     * Update existing payment
     * PATCH /api/payments/{payment}
     */
    update: async (id: string | number, data: Partial<PaymentPayload>): Promise<ApiPayment> => {
        return api.patch<ApiPayment>(endpoints.payments.update(id), data)
    },

    /**
     * Get payment summary
     * GET /api/payments/summary
     */
    getSummary: async (): Promise<PaymentSummary> => {
        return api.get<PaymentSummary>(endpoints.payments.summary())
    },

    /**
     * Process payment refund
     * POST /api/payments/{payment}/refund
     */
    refund: async (id: string | number, amount?: number, reason?: string): Promise<ApiPayment> => {
        return api.post<ApiPayment>(endpoints.payments.refund(id), { amount, reason })
    },

    /**
     * Delete a payment
     * DELETE /api/payments/{payment}
     */
    delete: async (id: string | number): Promise<void> => {
        return api.delete(endpoints.payments.delete(id))
    },

    /**
     * Record a credit (buy-now-pay-later) transaction
     * POST /api/payments/credit
     */
    recordCredit: async (data: {
        customer_id: number;
        amount: number;
        paid_at: string;
        method: "cash" | "card" | "online";
        note?: string;
    }): Promise<any> => {
        return api.post(endpoints.payments.credit(), data)
    },
}
