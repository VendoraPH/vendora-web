"use client"

import { ComponentType } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"

interface StatCard {
  title: string
  value: string
  change: string
  changeType: "positive" | "negative" | "neutral" | "label"
  subtitle?: string
  icon: ComponentType<{ className?: string }>
}

interface DashboardStatsProps {
  stats: StatCard[]
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        // Determine color based on change type or index if we wanted to vary it, 
        // but for now we'll keep a consistent brand feel or map to specific colors if needed.
        // The original used purple text. We'll use purple bg for the icon box to match the theme.
        const iconColor = "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"

        return (
          <Card key={index} className="border-0 shadow-sm dark:bg-card dark:border-border">
            <CardContent className="py-3 px-4 sm:py-4 sm:px-6">
              <div className="flex flex-col gap-1 min-w-0">
                {/* Row 1: Icon + Title + Change (Right aligned) */}
                <div className="flex items-start justify-between gap-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg ${iconColor}`}>
                      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-gray-500 dark:text-[#b4b4d0] truncate">{stat.title}</p>
                  </div>
                  {/* Change indicator moved to top right */}
                  <span
                    className={`text-xs sm:text-sm font-bold flex items-center gap-0.5 shrink-0 ${
                      stat.changeType === "positive"
                        ? "text-green-600 dark:text-green-400"
                        : stat.changeType === "negative"
                          ? "text-red-600 dark:text-red-400"
                          : "text-gray-500 dark:text-[#b4b4d0]"
                    }`}
                  >
                    {stat.changeType === "positive" && (
                      <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    )}
                    {stat.changeType === "negative" && (
                      <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    )}
                    <span className="hidden sm:inline">{stat.change}</span>
                  </span>
                </div>

                {/* Row 2: Large value + Subtitle */}
                <div className="flex items-baseline gap-2 mt-1 min-w-0">
                  <h3 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">{stat.value}</h3>
                  {stat.subtitle && (
                    <span className="text-xs text-gray-400 dark:text-muted-foreground hidden sm:inline">
                      {stat.subtitle}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div >
  )
}
