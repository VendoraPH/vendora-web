/**
 * Order Service
 *
 * Handles all order-related API calls
 */

import api from "@/lib/api-client"
import axiosClient from "@/lib/axios-client"
import { endpoints } from "@/lib/api-endpoints"
import { Order, OrderFilters, OrderStatus, PaymentStatus, PaginatedResponse } from "@/types"

export const orderService = {
  /**
   * Get all orders with optional filters
   */
  getAll: async (filters?: OrderFilters): Promise<PaginatedResponse<Order>> => {
    return api.get<PaginatedResponse<Order>>(endpoints.orders.list(), {
      params: filters,
    })
  },

  /**
   * Get single order by ID
   */
  getById: async (id: string | number): Promise<Order> => {
    return api.get<Order>(endpoints.orders.get(id))
  },

  /**
   * Create new order
   */
  create: async (data: Partial<Order>): Promise<Order> => {
    return api.post<Order>(endpoints.orders.create(), data)
  },

  /**
   * Update existing order
   */
  update: async (id: string | number, data: Partial<Order>): Promise<Order> => {
    return api.put<Order>(endpoints.orders.update(id), data)
  },

  /**
   * Delete order
   */
  delete: async (id: string | number): Promise<void> => {
    return api.delete(endpoints.orders.delete(id))
  },

  /**
   * Update order status
   */
  updateStatus: async (id: string | number, status: OrderStatus): Promise<Order> => {
    return api.put<Order>(endpoints.orders.updateStatus(id), { status })
  },

  /**
   * Update payment status
   */
  updatePaymentStatus: async (
    id: string | number,
    paymentStatus: PaymentStatus
  ): Promise<Order> => {
    return api.put<Order>(endpoints.orders.updatePaymentStatus(id), {
      payment_status: paymentStatus,
    })
  },

  /**
   * Get order invoice (PDF/Blob)
   */
  getInvoice: async (id: string | number): Promise<Blob> => {
    const response = await axiosClient.get(endpoints.orders.invoice(id), {
      responseType: "blob",
    })
    return response.data
  },

  /**
   * Get order receipt (PDF/Blob)
   */
  getReceipt: async (id: string | number): Promise<Blob> => {
    const response = await axiosClient.get(endpoints.orders.receipt(id), {
      responseType: "blob",
    })
    return response.data
  },

  /**
   * Cancel order
   */
  cancel: async (id: string | number, reason?: string): Promise<Order> => {
    return api.post<Order>(endpoints.orders.cancel(id), { reason })
  },

  /**
   * Refund order
   */
  refund: async (id: string | number, amount?: number, reason?: string): Promise<Order> => {
    return api.post<Order>(endpoints.orders.refund(id), { amount, reason })
  },

  /**
   * Get order summary
   * GET /api/orders/summary
   */
  getSummary: async (): Promise<{ total_orders: number; total_amount: number; pending_orders: number; completed_orders: number }> => {
    return api.get(endpoints.orders.summary())
  },
}
