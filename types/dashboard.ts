// Dashboard API Response Types

export interface DashboardKPIs {
    start_date: string
    end_date: string
    total_sales: number
    total_orders: number
    net_revenue: number
    average_order_value: number
    items_sold: number
    currency: string
}

export interface SalesTrendSeries {
    name: string
    data: number[]
}

export interface SalesTrend {
    start_date: string
    end_date: string
    labels: string[]
    series: SalesTrendSeries[]
    channel_definition: {
        pos: string
        online: string
    }
}

export interface OrderChannel {
    channel: string
    orders_count: number
    percentage: number
}

export interface OrdersByChannel {
    start_date: string
    end_date: string
    total_orders: number
    channels: OrderChannel[]
    channel_definition: {
        pos: string
        online: string
    }
}

export interface PaymentMethodStat {
    method: string
    amount: number
    payments_count: number
    percentage: number
}

export interface PaymentMethods {
    start_date: string
    end_date: string
    total_amount: number
    methods: PaymentMethodStat[]
}

export interface TopProduct {
    product_id: number
    name: string
    units_sold: number
    revenue: number
    currency: string
}

export interface TopProducts {
    start_date: string
    end_date: string
    items: TopProduct[]
}

export interface InventoryBreakdown {
    status: 'in_stock' | 'low_stock' | 'out_of_stock'
    count: number
}

export interface InventoryHealth {
    total_items: number
    breakdown: InventoryBreakdown[]
}

export interface ActivityItem {
    id: number
    action: string
    model_type: string
    model_id: number
    message: string
    created_at: string
}

export interface RecentActivity {
    items: ActivityItem[]
}

export interface CashVsCredit {
    total_amount: number
    cash: {
        amount: number
        percentage: number
        count: number
    }
    credit: {
        amount: number
        percentage: number
        count: number
    }
    outstanding_credit: number
}

export interface DateRangeParams {
    start_date?: string
    end_date?: string
}

// Re-using ApiProduct structure for consistency, but making it available in dashboard types
// In a real app we might import from product types, but this keeps dashboard types self-contained for now
// or we can import it. Let's define it loosely or import if possible.
// Actually, let's just make it a simple interface that matches what the dashboard needs.
export interface InventoryItem {
    id: number
    name: string
    stock: number
    min_stock: number
    stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock'
}

export interface LowStockAlert {
    id: number
    name: string
    stock: number
    min_stock: number
    status: 'low_stock' | 'out_of_stock'
}

export interface LowStockAlerts {
    items: LowStockAlert[]
}

export interface PendingOrder {
    id: number
    order_number: string
    customer: string
    ordered_at: string
    items_count: number
    total: number
    currency: string
    status: 'pending'
}

export interface PendingOrders {
    items: PendingOrder[]
}
