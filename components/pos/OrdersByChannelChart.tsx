"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import type { OrdersByChannel } from "@/types/dashboard"

type OrdersByChannelChartProps = {
  data?: OrdersByChannel | null
  className?: string
  contentClassName?: string
}

export function OrdersByChannelChart({ data, className, contentClassName }: OrdersByChannelChartProps) {
  // Transform API data to chart format
  const chartData = data ? data.channels.map(channel => ({
    name: channel.channel.toUpperCase(),
    value: channel.percentage,
    color: channel.channel === "pos" ? "#7c3aed" : "#a78bfa",
  })) : []

  return (
    <Card className={`rounded-xl border border-gray-100 dark:border-white/5 shadow-sm ${className ?? ""}`}>
      <CardHeader className="pb-4 pt-5 px-5 flex flex-row items-center justify-between border-b border-gray-100 dark:border-white/5">
        <div>
          <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">Orders by Channel</CardTitle>
          <p className="text-xs text-gray-500 mt-1 dark:text-[#b4b4d0]">POS vs Online</p>
        </div>
      </CardHeader>
      <CardContent className={`p-4 flex-1 flex flex-col ${contentClassName ?? ""}`.trim()}>
        <div className="flex flex-col items-center justify-center gap-4 flex-1">
          <div className="w-[180px] h-[180px] relative shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold text-gray-900 dark:text-white leading-none">
                {data?.total_orders?.toLocaleString() ?? 0}
              </span>
              <span className="text-[9px] uppercase text-gray-400 font-medium tracking-wider mt-0.5">Orders</span>
            </div>
          </div>
          <div className="flex justify-center gap-6 text-sm">
            {chartData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-gray-600 dark:text-[#b4b4d0]">{item.name}</span>
                <span className="font-bold" style={{ color: item.color }}>{item.value.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
