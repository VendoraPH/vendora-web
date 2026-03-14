"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import type { SalesTrend } from "@/types/dashboard"
import { centsToPesos } from "@/lib/utils"

type SalesTrendChartProps = {
  data?: SalesTrend | null
  className?: string
  contentClassName?: string
}

export function SalesTrendChart({ data, className, contentClassName }: SalesTrendChartProps) {
  // Detect dark mode for chart colors
  const isDark = typeof window !== 'undefined' && document.documentElement.classList.contains('dark')
  const gridColor = isDark ? '#374151' : '#f0f0f0'
  const axisColor = isDark ? '#9ca3af' : '#888'
  const totalLineColor = isDark ? '#4b5563' : '#e0e0e0'
  // Transform API data to chart format
  const salesData = data ? data.labels.map((label, index) => {
    const posData = data.series.find(s => s.name === "pos")?.data[index] || 0
    const onlineData = data.series.find(s => s.name === "online")?.data[index] || 0

    // Convert date to day of week
    const date = new Date(label)
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })

    return {
      day: dayName,
      pos: centsToPesos(posData),
      online: centsToPesos(onlineData),
      total: centsToPesos(posData + onlineData),
    }
  }) : []

  return (
    <Card className={`col-span-2 flex flex-col ${className ?? ""}`.trim()}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Sales Trend</CardTitle>
        <p className="text-sm text-gray-500 dark:text-[#b4b4d0]">Compare POS and Online sales</p>
      </CardHeader>
      <CardContent className={`flex-1 ${contentClassName ?? ""}`.trim()}>
        <div className="min-h-[260px] h-[260px] sm:h-[300px] lg:h-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="day" stroke={axisColor} fontSize={12} />
              <YAxis stroke={axisColor} fontSize={12} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="online"
                stroke="#a78bfa"
                strokeWidth={2}
                dot={{ fill: "#a78bfa", r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="pos"
                stroke="#7c3aed"
                strokeWidth={2}
                dot={{ fill: "#7c3aed", r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke={totalLineColor}
                strokeWidth={1}
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
