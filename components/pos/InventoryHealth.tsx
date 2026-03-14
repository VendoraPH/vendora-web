"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { InventoryHealth as InventoryHealthData } from "@/types/dashboard"

import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts"

type InventoryHealthProps = {
  data?: InventoryHealthData | null
  variant?: "default" | "embedded"
}

export function InventoryHealth({ data, variant = "default" }: InventoryHealthProps) {
  const isEmbedded = variant === "embedded"

  // Transform API data to chart format
  const chartData = data ? data.breakdown.map(item => {
    const label = item.status === "in_stock" ? "In Stock" :
      item.status === "low_stock" ? "Low Stock" : "Out of Stock"
    return {
      name: label,
      count: item.count,
      color: item.status === "in_stock" ? "#10b981" : // Emerald
        item.status === "low_stock" ? "#f59e0b" : // Amber
          "#f43f5e", // Rose
    }
  }) : []

  const content = (
    <>
      <CardHeader className={`${isEmbedded ? "px-0 pb-2 pt-0" : "pb-4 pt-5 px-5"} flex flex-row items-center justify-between border-b border-gray-100 dark:border-white/5`}>
        <div>
          <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">Inventory Health</CardTitle>
          <p className="text-xs text-gray-500 mt-1 dark:text-[#b4b4d0]">Stock levels overview</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900 dark:text-white leading-none">
            {data?.total_items.toLocaleString() || 0}
          </p>
          <p className="text-[10px] uppercase text-gray-400 font-medium tracking-wider mt-1">Total Items</p>
        </div>
      </CardHeader>
      <CardContent className={`${isEmbedded ? "px-0 pt-3 pb-0" : "px-5 py-6"} ${isEmbedded ? "h-[260px]" : "h-[300px]"}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              allowDecimals={false}
            />
            <RechartsTooltip
              cursor={{ fill: 'transparent' }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="bg-gray-900/95 dark:bg-black/90 backdrop-blur-sm border border-gray-800 dark:border-white/10 rounded-lg p-3 shadow-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
                        <span className="text-sm font-medium text-white">{data.name}</span>
                      </div>
                      <div className="text-lg font-bold text-white pl-4">
                        {data.count} <span className="text-xs font-normal text-gray-400">items</span>
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={50}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </>
  )

  if (isEmbedded) {
    return <div className="h-full flex flex-col">{content}</div>
  }

  return (
    <Card className="rounded-xl border border-gray-100 dark:border-white/5 shadow-sm h-full flex flex-col">
      {content}
    </Card>
  )
}
