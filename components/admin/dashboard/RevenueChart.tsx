"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"

const data = [
    {
        month: "Aug",
        revenue: 28500,
    },
    {
        month: "Sep",
        revenue: 32400,
    },
    {
        month: "Oct",
        revenue: 35800,
    },
    {
        month: "Nov",
        revenue: 41200,
    },
    {
        month: "Dec",
        revenue: 38900,
    },
    {
        month: "Jan",
        revenue: 45231,
    },
]

export function RevenueChart() {
    return (
        <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                    dataKey="month"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                    content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                            return (
                                <div className="rounded-lg border bg-background p-2 shadow-sm">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="flex flex-col">
                                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                Revenue
                                            </span>
                                            <span className="font-bold text-purple-600">
                                                ₱{payload[0].value?.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )
                        }
                        return null
                    }}
                />
                <Bar
                    dataKey="revenue"
                    fill="#7C3AED"
                    radius={[8, 8, 0, 0]}
                    className="fill-purple-600"
                />
            </BarChart>
        </ResponsiveContainer>
    )
}
