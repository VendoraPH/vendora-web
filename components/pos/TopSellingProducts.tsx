"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Eye, Trophy, TrendingUp, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { TopProducts } from "@/types/dashboard"

type TopSellingProductsProps = {
  data?: TopProducts | null
  variant?: "default" | "embedded"
}

export function TopSellingProducts({ data, variant = "default" }: TopSellingProductsProps) {
  const [open, setOpen] = useState(false)
  const isEmbedded = variant === "embedded"
  const headerClass = isEmbedded ? "px-0 pt-0" : undefined
  const contentClass = isEmbedded ? "px-0 pb-0" : undefined

  // Use API data or empty array
  const products = data?.items.map(item => ({
    name: item.name,
    units: item.units_sold,
    revenue: item.revenue,
  })) || []

  // Calculate max revenue for percentage calculations
  const maxRevenue = products.length > 0 ? Math.max(...products.map(p => p.revenue)) : 1

  const rankColors = ["text-yellow-500", "text-gray-400", "text-amber-600"]
  const rankBg = ["bg-yellow-50 dark:bg-yellow-900/20", "bg-gray-50 dark:bg-gray-800/30", "bg-amber-50 dark:bg-amber-900/20"]

  const content = (
    <>
      <CardHeader className={`flex flex-row items-center justify-between ${headerClass ?? ""}`}>
        <div>
          <CardTitle className="text-lg font-semibold">Top Selling Products</CardTitle>
          <p className="text-sm text-gray-500 dark:text-[#b4b4d0]">Units and revenue</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setOpen(true)}
          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-950/50"
        >
          <Eye className="w-4 h-4 mr-1" />
          View
        </Button>
      </CardHeader>
      <CardContent className={contentClass}>
        {/* Bar Chart */}
        <div className="mb-6">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={products} barCategoryGap={18} barGap={6}>
              <XAxis dataKey="name" hide />
              <YAxis hide />
              <Tooltip
                formatter={(value, name) => {
                  if (name === 'revenue') return [`₱ ${value.toLocaleString()}`, 'Revenue']
                  return [value, 'Units']
                }}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: '12px' }}
              />
              <Bar dataKey="revenue" fill="#a78bfa" radius={[4, 4, 0, 0]} name="Revenue" barSize={28} />
              <Bar dataKey="units" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Units" barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Product List with Visual Bars */}
        <div className="space-y-3">
          {products.map((product, index) => {
            const revenuePercentage = (product.revenue / maxRevenue) * 100

            return (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 dark:text-[#e0e0f0] font-medium">{product.name}</span>
                  <div className="flex gap-3 text-xs">
                    <span className="text-gray-500 dark:text-[#b4b4d0]">{product.units} units</span>
                    <span className="font-semibold text-purple-600 dark:text-purple-400 min-w-[80px] text-right">
                      {"₱ "}{product.revenue.toLocaleString()}
                    </span>
                  </div>
                </div>
                {/* Revenue Bar */}
                <div className="w-full bg-gray-100 dark:bg-[#1a1a35] rounded-full h-[2px] overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-purple-400 h-[2px] rounded-full transition-all duration-500"
                    style={{ width: `${revenuePercentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>

      {/* View Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Top Selling Products
            </DialogTitle>
            {data?.start_date && data?.end_date && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(data.start_date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                {" — "}
                {new Date(data.end_date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            )}
          </DialogHeader>

          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-400">
              <Package className="w-10 h-10" />
              <p className="text-sm">No sales data available</p>
            </div>
          ) : (
            <div className="space-y-3 mt-2">
              {products.map((product, index) => {
                const revenuePercentage = (product.revenue / maxRevenue) * 100
                const isTop3 = index < 3

                return (
                  <div
                    key={index}
                    className={`rounded-lg p-3 border border-transparent ${isTop3 ? rankBg[index] : "bg-gray-50 dark:bg-gray-800/20"}`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank */}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isTop3 ? `${rankColors[index]} bg-white dark:bg-gray-900 border border-current` : "text-gray-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"}`}>
                        {index + 1}
                      </div>

                      {/* Product info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate pr-2">
                            {product.name}
                          </span>
                          <span className="text-sm font-bold text-purple-600 dark:text-purple-400 flex-shrink-0">
                            ₱ {product.revenue.toLocaleString()}
                          </span>
                        </div>

                        {/* Revenue bar */}
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden mb-1.5">
                          <div
                            className="bg-gradient-to-r from-purple-600 to-purple-400 h-1.5 rounded-full transition-all duration-700"
                            style={{ width: `${revenuePercentage}%` }}
                          />
                        </div>

                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <TrendingUp className="w-3 h-3" />
                          <span>{product.units} units sold</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )

  if (isEmbedded) {
    return <div>{content}</div>
  }

  return (
    <Card>
      {content}
    </Card>
  )
}
