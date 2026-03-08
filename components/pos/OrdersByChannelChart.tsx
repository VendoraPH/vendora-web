"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts"
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
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Orders by Channel</CardTitle>
        <p className="text-sm text-gray-500 dark:text-[#b4b4d0]">POS vs Online</p>
      </CardHeader>
      <CardContent className={contentClassName}>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 flex justify-around text-sm">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
              <span className="text-gray-600 dark:text-[#b4b4d0]">{item.name}</span>
              <span className="font-semibold dark:text-white">{item.value.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
