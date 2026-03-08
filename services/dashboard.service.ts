import axiosClient from '@/lib/axios-client'
import { AxiosError } from 'axios'
import type {
    DashboardKPIs,
    SalesTrend,
    OrdersByChannel,
    PaymentMethods,
    TopProducts,
    InventoryHealth,
    RecentActivity,
    DateRangeParams,
    LowStockAlerts,
    PendingOrders,
    CashVsCredit,
} from '@/types/dashboard'

// Standard API Response wrapper
interface ApiResponse<T> {
    success: boolean
    message: string
    data: T
}

/**
 * Retry helper with exponential backoff
 * Useful for handling temporary network issues or timeouts
 */
async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    retries = 2,
    delay = 1000
): Promise<T> {
    try {
        return await fn()
    } catch (error) {
        if (retries === 0) throw error

        // Only retry on network errors or timeouts
        if (error instanceof AxiosError) {
            const isRetryable =
                !error.response || // Network error
                error.code === 'ECONNABORTED' || // Timeout
                error.message.includes('timeout')

            if (!isRetryable) throw error
        }

        console.log(`⚠️ Request failed, retrying in ${delay}ms... (${retries} retries left)`)
        await new Promise(resolve => setTimeout(resolve, delay))
        return retryWithBackoff(fn, retries - 1, delay * 2) // Exponential backoff
    }
}

/**
 * Dashboard API Service
 * Provides methods to fetch dashboard data from the API
 * Uses centralized axiosClient for consistent auth token management (vendora_access_token)
 */
export const dashboardService = {
    /**
     * Get KPI metrics (Total Sales, Orders, Revenue, etc.)
     */
    async getKPIs(params?: DateRangeParams): Promise<DashboardKPIs> {
        return retryWithBackoff(async () => {
            const { data } = await axiosClient.get<ApiResponse<DashboardKPIs>>('/dashboard/kpis', {
                params,
                timeout: 90000 // Extended timeout for analytics
            })
            return data.data
        })
    },

    /**
     * Get sales trend over time (POS vs Online)
     * With retry logic and extended timeout for analytics
     */
    async getSalesTrend(params?: DateRangeParams): Promise<SalesTrend> {
        return retryWithBackoff(async () => {
            const { data } = await axiosClient.get<ApiResponse<SalesTrend>>('/dashboard/sales-trend', {
                params,
                timeout: 90000 // 90s timeout for analytics endpoint
            })
            return data.data
        })
    },

    /**
     * Get orders distribution by channel
     */
    async getOrdersByChannel(params?: DateRangeParams): Promise<OrdersByChannel> {
        return retryWithBackoff(async () => {
            const { data } = await axiosClient.get<ApiResponse<OrdersByChannel>>('/dashboard/orders-by-channel', {
                params,
                timeout: 90000 // Extended timeout for analytics
            })
            return data.data
        })
    },

    /**
     * Get payment methods distribution
     */
    async getPaymentMethods(params?: DateRangeParams): Promise<PaymentMethods> {
        return retryWithBackoff(async () => {
            const { data } = await axiosClient.get<ApiResponse<PaymentMethods>>('/dashboard/payment-methods', {
                params,
                timeout: 90000 // Extended timeout for analytics
            })
            return data.data
        })
    },

    /**
     * Get top selling products
     */
    async getTopProducts(params?: DateRangeParams & { limit?: number }): Promise<TopProducts> {
        return retryWithBackoff(async () => {
            const { data } = await axiosClient.get<ApiResponse<TopProducts>>('/dashboard/top-products', {
                params,
                timeout: 90000 // Extended timeout for analytics
            })
            return data.data
        })
    },

    /**
     * Get inventory health breakdown
     */
    async getInventoryHealth(): Promise<InventoryHealth> {
        return retryWithBackoff(async () => {
            const { data } = await axiosClient.get<ApiResponse<InventoryHealth>>('/dashboard/inventory-health')
            return data.data
        })
    },

    /**
     * Get recent activity feed
     */
    async getRecentActivity(params?: { limit?: number }): Promise<RecentActivity> {
        return retryWithBackoff(async () => {
            const { data } = await axiosClient.get<ApiResponse<RecentActivity>>('/dashboard/recent-activity', { params })
            return data.data
        })
    },

    /**
     * Get cash vs credit breakdown
     */
    async getCashVsCredit(params?: DateRangeParams): Promise<CashVsCredit> {
        return retryWithBackoff(async () => {
            const { data } = await axiosClient.get<ApiResponse<CashVsCredit>>('/dashboard/cash-vs-credit', {
                params,
                timeout: 90000
            })
            return data.data
        })
    },

    /**
     * Get low stock alerts
     * Returns items that are below minimum stock thresholds
     */
    async getLowStockAlerts(): Promise<LowStockAlerts> {
        return retryWithBackoff(async () => {
            const { data } = await axiosClient.get<ApiResponse<LowStockAlerts>>('/dashboard/low-stock-alerts')
            return data.data
        })
    },

    /**
     * Get pending orders
     * Returns unprocessed/pending orders for dashboard display
     */
    async getPendingOrders(): Promise<PendingOrders> {
        return retryWithBackoff(async () => {
            const { data } = await axiosClient.get<ApiResponse<PendingOrders>>('/dashboard/pending-orders')
            return data.data
        })
    },
}
