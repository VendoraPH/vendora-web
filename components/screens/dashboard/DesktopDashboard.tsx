"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Package, Plus, ShoppingBag, Wallet, ShoppingCart, Loader2, Truck } from "lucide-react"

const PesoSign = ({ className }: { className?: string }) => (
  <span className={`font-bold flex items-center justify-center ${className ?? ''}`}>₱</span>
)
import { DashboardStats } from "@/components/pos/DashboardStats"
import { SalesTrendChart } from "@/components/pos/SalesTrendChart"
import { OrdersByChannelChart } from "@/components/pos/OrdersByChannelChart"
import { PaymentMethodsChart } from "@/components/pos/PaymentMethodsChart"
import { TopSellingProducts } from "@/components/pos/TopSellingProducts"
import { InventoryHealth } from "@/components/pos/InventoryHealth"
import { LowStockAlerts } from "@/components/pos/LowStockAlerts"
import { PendingOrders } from "@/components/pos/PendingOrders"
import { RecentActivity } from "@/components/pos/RecentActivity"
import { CashVsCreditChart } from "@/components/pos/CashVsCreditChart"
import { AddProductModal } from "@/components/pos/AddProductModal"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDashboardData } from "@/hooks/useDashboardData"
import type { DateRangeParams } from "@/types/dashboard"
import { StaleDataBanner } from "@/components/pos/StaleDataBanner"
import { TOKEN_CONFIG } from "@/config/api.config"

/**
 * Default Dashboard Layout
 * Uses responsive grid utilities for all screen sizes
 */
export default function DesktopDashboard() {
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)
  const [period, setPeriod] = useState("7days")
  const [displayName, setDisplayName] = useState("")

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TOKEN_CONFIG.USER_PROFILE_KEY)
      if (!raw) return
      const profile = JSON.parse(raw)
      // Use first owned store name, then business_name, then user name
      const storeName = profile?.stores?.[0]?.name
      setDisplayName(storeName || profile?.business_name || profile?.name || "")
    } catch {
      // Ignore parse errors
    }
  }, [])

  // Compute date range from selected period
  const dateParams = useMemo<DateRangeParams | undefined>(() => {
    const today = new Date()
    const formatDate = (d: Date) => d.toISOString().split("T")[0]
    const end_date = formatDate(today)

    switch (period) {
      case "today":
        return { start_date: end_date, end_date }
      case "7days":
        return { start_date: formatDate(new Date(today.getTime() - 6 * 86400000)), end_date }
      case "30days":
        return { start_date: formatDate(new Date(today.getTime() - 29 * 86400000)), end_date }
      default:
        return undefined
    }
  }, [period])

  // Fetch dashboard data from API (with offline cache support)
  const {
    kpis,
    salesTrend,
    ordersByChannel,
    paymentMethods,
    topProducts,
    inventoryHealth,
    recentActivity,
    cashVsCredit,
    loading,
    error,
    isStale,
    lastSyncedAt,
  } = useDashboardData(dateParams)

  // Transform KPI data to stats format
  const formatChange = (change: number): { change: string; changeType: "positive" | "negative" | "neutral" } => {
    if (change === 0) {
      return { change: "0%", changeType: "neutral" }
    }
    return {
      change: `${change > 0 ? "+" : ""}${change}%`,
      changeType: change > 0 ? "positive" : "negative",
    }
  }

  const stats = kpis ? [
    {
      title: "Total Sales",
      value: `₱ ${(kpis.total_sales / 100).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      ...formatChange(kpis.total_sales_change),
      icon: PesoSign,
    },
    {
      title: "Total Orders",
      value: kpis.total_orders.toString(),
      ...formatChange(kpis.total_orders_change),
      icon: ShoppingBag,
    },
    {
      title: "Net Revenue",
      value: `₱ ${(kpis.net_revenue / 100).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: "After discount",
      changeType: "label" as const,
      icon: Wallet,
    },
    {
      title: "Items Sold",
      value: kpis.items_sold.toLocaleString(),
      change: "POS and Online",
      changeType: "label" as const,
      icon: Package,
    },
  ] : []

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-600" />
          <p className="text-sm text-gray-500 dark:text-[#b4b4d0] mt-2">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Show error state (only if no cached data available)
  if (error && !kpis) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <p className="text-red-600 font-medium">{error}</p>
          <p className="text-sm text-gray-500 dark:text-[#b4b4d0] mt-2">Please try again later</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 pb-6">
      {/* Stale data indicator for offline/cached data */}
      <StaleDataBanner isStale={isStale} lastSyncedAt={lastSyncedAt} />

      {/* Desktop Header */}
      <div className="hidden sm:flex sm:flex-col gap-3 bg-white dark:bg-card p-4 sm:p-5 rounded-lg border border-gray-200 dark:border-border xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-[#b4b4d0]">Welcome back</p>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mt-0.5">{displayName || "Your Store"}</h1>
        </div>
        <div className="hidden w-full flex-col gap-2 sm:flex sm:flex-row sm:flex-wrap sm:items-center lg:w-auto">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-full sm:w-[140px] h-9" suppressHydrationWarning>
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button asChild className="w-full sm:w-auto h-9 bg-gray-900 dark:bg-primary hover:bg-gray-800 dark:hover:bg-primary/90 text-white">
            <Link href="/pos/pos-screen">
              <ShoppingCart className="mr-2 h-4 w-4" />
              Open POS
            </Link>
          </Button>
          <Button
            variant="outline"
            className="w-full sm:w-auto h-9 border-gray-300 dark:border-border"
            onClick={() => setIsAddProductOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Row 1: Key Metrics */}
      <DashboardStats stats={stats} />

      {/* Row 2: Charts — tighter heights */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-12 xl:grid-rows-[380px_400px]">

        {/* Sales Trend */}
        <div className="md:col-span-2 xl:col-span-5 xl:row-start-1">
          <SalesTrendChart data={salesTrend} className="h-[380px] xl:h-full" contentClassName="flex-1" />
        </div>

        {/* Payment Methods */}
        <div className="xl:col-span-3 xl:row-start-1">
          <PaymentMethodsChart data={paymentMethods} className="h-[380px] xl:h-full" />
        </div>

        {/* Top Selling Products — spans both rows */}
        <div className="xl:col-span-4 xl:row-span-2 h-full">
          <Card className="border-gray-200 dark:border-border dark:bg-card h-full">
            <CardContent className="p-5 h-full overflow-y-auto">
              <TopSellingProducts data={topProducts} variant="embedded" />
            </CardContent>
          </Card>
        </div>

        {/* Orders by Channel */}
        <div className="xl:col-span-5 xl:row-start-2">
          <OrdersByChannelChart data={ordersByChannel} className="h-[400px] xl:h-full" />
        </div>

        {/* Inventory Health */}
        <div className="xl:col-span-3 xl:row-start-2">
          <Card className="border-gray-200 dark:border-border dark:bg-card h-full">
            <CardContent className="p-5 h-full">
              <InventoryHealth data={inventoryHealth} variant="embedded" />
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Row 3: Actionable Items — balanced 4-column layout */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-gray-200 dark:border-border dark:bg-card">
          <CardContent className="p-5">
            <LowStockAlerts variant="embedded" />
          </CardContent>
        </Card>
        <Card className="border-gray-200 dark:border-border dark:bg-card">
          <CardContent className="p-5">
            <PendingOrders variant="embedded" />
          </CardContent>
        </Card>
        <CashVsCreditChart data={cashVsCredit} className="dark:bg-card dark:border-border" />
        <Card className="border-gray-200 dark:border-border dark:bg-card">
          <CardContent className="p-5">
            <RecentActivity data={recentActivity} variant="embedded" />
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Quick Actions — horizontal strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button
          asChild
          variant="outline"
          className="h-12 justify-start gap-3 text-purple-600 hover:bg-purple-50 border-purple-200 dark:text-purple-400 dark:border-purple-800/40 dark:hover:bg-purple-950/40"
        >
          <Link href="/pos/pos-screen">
            <ShoppingCart className="w-5 h-5 shrink-0" />
            <span className="font-medium text-sm dark:text-[#e0e0f0]">Start POS Sale</span>
          </Link>
        </Button>
        <Button
          variant="outline"
          className="h-12 justify-start gap-3 text-blue-600 hover:bg-blue-50 border-blue-200 dark:text-blue-400 dark:border-blue-800/40 dark:hover:bg-blue-950/40"
          onClick={() => setIsAddProductOpen(true)}
        >
          <Plus className="w-5 h-5 shrink-0" />
          <span className="font-medium text-sm dark:text-[#e0e0f0]">Add Product</span>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-12 justify-start gap-3 text-orange-600 hover:bg-orange-50 border-orange-200 dark:text-orange-400 dark:border-orange-800/40 dark:hover:bg-orange-950/40"
        >
          <Link href="/pos/products">
            <Package className="w-5 h-5 shrink-0" />
            <span className="font-medium text-sm dark:text-[#e0e0f0]">Adjust Stock</span>
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="h-12 justify-start gap-3 text-green-600 hover:bg-green-50 border-green-200 dark:text-green-400 dark:border-green-800/40 dark:hover:bg-green-950/40"
        >
          <Link href="/pos/orders">
            <Truck className="w-5 h-5 shrink-0" />
            <span className="font-medium text-sm dark:text-[#e0e0f0]">Fulfill Orders</span>
          </Link>
        </Button>
      </div>

      {/* Add Product Modal - accessible from header button & Quick Actions */}
      <AddProductModal
        open={isAddProductOpen}
        onOpenChange={setIsAddProductOpen}
      />
    </div>
  )
}
