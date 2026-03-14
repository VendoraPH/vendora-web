"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  TrendingUp,
  ShoppingCart,
  Users,
  Download,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { dashboardService } from "@/services"
import type { DashboardKPIs, TopProducts } from "@/types/dashboard"
import { useOfflineData } from "@/hooks/use-offline-data"
import { StaleDataBanner } from "@/components/pos/StaleDataBanner"
import { formatCurrency } from "@/lib/utils"

export default function ReportsPage() {
  const { data, isLoading: loading, isStale, lastSyncedAt, error, refresh } = useOfflineData<{
    kpis: DashboardKPIs;
    topProducts: TopProducts;
  }>(
    "reports-data",
    async () => {
      const [kpiData, topData] = await Promise.all([
        dashboardService.getKPIs(),
        dashboardService.getTopProducts({ limit: 5 }),
      ])
      return { kpis: kpiData, topProducts: topData }
    },
    { staleAfterMinutes: 30 }
  )
  const kpis = data?.kpis ?? null
  const topProducts = data?.topProducts ?? null

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-gray-600 dark:text-[#b4b4d0]">{error as string}</p>
        <Button onClick={refresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <StaleDataBanner isStale={isStale} lastSyncedAt={lastSyncedAt} />
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Reports and Analytics</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-[#b4b4d0] mt-0.5 sm:mt-1">View business performance and insights</p>
        </div>
        <Button variant="outline" className="w-full sm:w-auto">
          <Download className="w-4 h-4 mr-2" />
          Export All Reports
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-white dark:bg-[#13132a] p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0]">Total Sales</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-1">
                {formatCurrency(kpis?.total_sales ?? 0)}
              </p>
            </div>
            <div className="bg-purple-100 p-2 sm:p-3 rounded-lg hidden sm:block">
              <span className="h-6 w-6 text-purple-600 font-bold text-xl flex items-center justify-center">₱</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#13132a] p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0]">Total Orders</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-1">
                {(kpis?.total_orders ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-100 p-2 sm:p-3 rounded-lg hidden sm:block">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#13132a] p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0]">Items Sold</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-1">
                {(kpis?.items_sold ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-green-100 p-2 sm:p-3 rounded-lg hidden sm:block">
              <Users className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#13132a] p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0]">Avg. Order Value</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-1">
                {formatCurrency(kpis?.average_order_value ?? 0)}
              </p>
            </div>
            <div className="bg-orange-100 p-2 sm:p-3 rounded-lg hidden sm:block">
              <BarChart3 className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Report Categories */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {[
          { title: "Sales Report", desc: "View detailed sales analytics, trends, and performance metrics", icon: BarChart3, color: "text-purple-600", primary: true },
          { title: "Inventory Report", desc: "Monitor stock levels, turnover rates, and inventory health", icon: ShoppingCart, color: "text-blue-600", primary: false },
          { title: "Customer Report", desc: "Analyze customer behavior, retention, and lifetime value", icon: Users, color: "text-green-600", primary: false },
          { title: "Product Performance", desc: "Track best sellers, slow movers, and product trends", icon: TrendingUp, color: "text-orange-600", primary: false },
          { title: "Financial Report", desc: "Review revenue, expenses, profit margins, and cash flow", icon: ({ className }: { className?: string }) => <span className={`font-bold ${className ?? ''}`}>₱</span>, color: "text-purple-600", primary: false },
          { title: "Custom Reports", desc: "Create and manage custom reports tailored to your needs", icon: BarChart3, color: "text-gray-600 dark:text-[#b4b4d0]", primary: false },
        ].map((report, idx) => {
          const Icon = report.icon
          return (
            <div key={idx} className="bg-white dark:bg-[#13132a] p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{report.title}</h3>
                <Icon className={`h-5 w-5 ${report.color}`} />
              </div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0] mb-3 sm:mb-4">{report.desc}</p>
              <Button className={`w-full ${report.primary ? 'bg-purple-600 hover:bg-purple-700' : ''}`} variant={report.primary ? "default" : "outline"}>
                {report.title === "Custom Reports" ? "Create Report" : "View Report"}
              </Button>
            </div>
          )
        })}
      </div>

      {/* Top Selling Products */}
      <div className="bg-white dark:bg-[#13132a] rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Top Selling Products</h3>
        {(!topProducts?.items || topProducts.items.length === 0) ? (
          <p className="text-sm text-gray-500 dark:text-[#b4b4d0] text-center py-8">No product data available</p>
        ) : (
          <div className="space-y-3">
            {topProducts.items.map((product, idx) => (
              <div key={product.product_id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#1a1a35] rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge className="bg-purple-100 text-purple-800">{idx + 1}</Badge>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(product.revenue)}</div>
                  <div className="text-xs text-gray-600 dark:text-[#b4b4d0]">{product.units_sold} units</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
