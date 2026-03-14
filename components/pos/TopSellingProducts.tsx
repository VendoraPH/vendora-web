"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Eye, TrendingUp, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import type { TopProducts } from "@/types/dashboard"

type TopSellingProductsProps = {
  data?: TopProducts | null
  variant?: "default" | "embedded"
}

export function TopSellingProducts({ data, variant = "default" }: TopSellingProductsProps) {
  const isEmbedded = variant === "embedded"
  const headerClass = isEmbedded ? "px-0 pt-0" : undefined
  const contentClass = isEmbedded ? "px-0 pb-0" : undefined
  const [viewOpen, setViewOpen] = useState(false)

  // Use API data or empty array
  const products = data?.items.map(item => ({
    name: item.name,
    units: item.units_sold,
    revenue: item.revenue / 100,
  })) || []

  // Calculate max revenue for percentage calculations
  const maxRevenue = products.length > 0 ? Math.max(...products.map(p => p.revenue)) : 1
  const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0)
  const totalUnits = products.reduce((sum, p) => sum + p.units, 0)

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
          className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:text-purple-300 dark:hover:bg-purple-950/50"
          onClick={() => setViewOpen(true)}
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
                  if (name === 'revenue') return [`₱ ${Number(value).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Revenue']
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
                      {"₱ "}{product.revenue.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

  const modal = (
    <Dialog open={viewOpen} onOpenChange={setViewOpen}>
      <DialogContent size="xl" className="dark:bg-[#13132a] dark:border-[#2d1b69]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Top Selling Products</DialogTitle>
          <DialogDescription>
            {data?.start_date && data?.end_date
              ? `${data.start_date} — ${data.end_date}`
              : "Current period"}
          </DialogDescription>
        </DialogHeader>

        {/* Summary row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
              <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-[#b4b4d0]">Total Revenue</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                ₱ {totalRevenue.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
              <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-[#b4b4d0]">Total Units Sold</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">{totalUnits.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Product table */}
        <div className="max-h-[400px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white dark:bg-[#13132a]">
              <tr className="border-b dark:border-[#2d1b69] text-left">
                <th className="py-2 pr-2 font-medium text-gray-500 dark:text-[#b4b4d0]">#</th>
                <th className="py-2 pr-2 font-medium text-gray-500 dark:text-[#b4b4d0]">Product</th>
                <th className="py-2 pr-2 font-medium text-gray-500 dark:text-[#b4b4d0] text-right">Units</th>
                <th className="py-2 font-medium text-gray-500 dark:text-[#b4b4d0] text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product, index) => (
                <tr key={index} className="border-b dark:border-[#2d1b69] last:border-0">
                  <td className="py-3 pr-2 text-gray-400 dark:text-[#b4b4d0]">{index + 1}</td>
                  <td className="py-3 pr-2 font-medium text-gray-900 dark:text-white">{product.name}</td>
                  <td className="py-3 pr-2 text-right text-gray-600 dark:text-[#b4b4d0]">{product.units}</td>
                  <td className="py-3 text-right font-semibold text-purple-600 dark:text-purple-400">
                    ₱ {product.revenue.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-400 dark:text-[#b4b4d0]">
                    No top selling products found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  )

  if (isEmbedded) {
    return <div>{content}{modal}</div>
  }

  return (
    <Card>
      {content}
      {modal}
    </Card>
  )
}
