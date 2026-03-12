"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Package as PackageIcon, ShoppingCart, Box, Plus, Edit, Users, Tag, Wallet, Building2 } from "lucide-react"
import type { RecentActivity as RecentActivityData } from "@/types/dashboard"

type RecentActivityProps = {
  data?: RecentActivityData | null
  variant?: "default" | "embedded"
}

// Helper function to get icon and color based on activity
function getActivityStyle(action: string, modelType: string) {
  if (modelType.includes("Order")) {
    if (action === "create") return { icon: ShoppingCart, color: "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-900/30" }
    if (action === "update") return { icon: Edit, color: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30" }
    return { icon: FileText, color: "text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/30" }
  }
  if (modelType.includes("Product")) {
    if (action === "create") return { icon: Plus, color: "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/30" }
    if (action === "update") return { icon: Box, color: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30" }
    return { icon: PackageIcon, color: "text-orange-600 bg-orange-50 dark:text-orange-400 dark:bg-orange-900/30" }
  }
  if (modelType.includes("Inventory")) {
    return { icon: Box, color: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30" }
  }
  if (modelType.includes("Customer")) {
    return { icon: Users, color: "text-teal-600 bg-teal-50 dark:text-teal-400 dark:bg-teal-900/30" }
  }
  if (modelType.includes("Category")) {
    return { icon: Tag, color: "text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/30" }
  }
  if (modelType.includes("Payment")) {
    return { icon: Wallet, color: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30" }
  }
  if (modelType.includes("Store")) {
    return { icon: Building2, color: "text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-900/30" }
  }
  // Default
  return { icon: FileText, color: "text-gray-600 bg-gray-50 dark:text-[#b4b4d0] dark:bg-[#13132a]" }
}

// Helper function to format relative time
function getRelativeTime(timestamp: string) {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.round(diffMs / 60000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins} min ago`

  const diffHours = Math.round(diffMins / 60)
  if (diffHours < 24) return `${diffHours} hr ago`

  const diffDays = Math.round(diffHours / 24)
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
}

export function RecentActivity({ data, variant = "default" }: RecentActivityProps) {
  const isEmbedded = variant === "embedded"
  const headerClass = isEmbedded ? "px-0 pt-0" : undefined
  const contentClass = isEmbedded ? "px-0 pb-0" : undefined

  // Transform API data to activities format
  const activities = data?.items.map(item => {
    const style = getActivityStyle(item.action, item.model_type)
    return {
      icon: style.icon,
      title: item.message,
      userName: item.user_name,
      time: getRelativeTime(item.created_at),
      color: style.color,
    }
  }) || []

  const content = (
    <>
      <CardHeader className={headerClass}>
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
        <p className="text-sm text-gray-500 dark:text-[#b4b4d0]">Live updates</p>
      </CardHeader>
      <CardContent className={contentClass}>
        <div className="space-y-3">
          {activities.map((activity, index) => {
            const Icon = activity.icon
            return (
              <div key={index} className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${activity.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700 dark:text-[#e0e0f0]">{activity.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {activity.userName && (
                      <span className="text-xs text-gray-400 dark:text-[#9898b8]">by {activity.userName}</span>
                    )}
                    <span className="text-xs text-gray-500 dark:text-[#b4b4d0]">{activity.time}</span>
                  </div>
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
