"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { TopProducts } from "@/types/dashboard"

type TopSellingProductsProps = {
  data?: TopProducts | null
  variant?: "default" | "embedded"
}

export function TopSellingProducts({ data, variant = "default" }: TopSellingProductsProps) {
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

  const content = (
    <>
      <CardHeader className={`flex flex-row items-center justify-between ${headerClass ?? ""}`}>
        <div>
          <CardTitle className="text-lg font-semibold">Top Selling Products</CardTitle>
          <p className="text-sm text-gray-500 dark:text-[#b4b4d0]">Units and revenue</p>
        </div>
        <Button variant="ghost" size="sm" className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-950/50">
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
