"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Bell, Package, ShoppingCart, AlertTriangle, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const notifications = [
  {
    id: 1,
    type: "alert",
    icon: AlertTriangle,
    title: "Low Stock Alert",
    message: "PVC Pipe 1 inch is running low (8 units remaining)",
    time: "5 min ago",
    color: "text-orange-600 bg-orange-50",
    unread: true,
  },
  {
    id: 2,
    type: "order",
    icon: ShoppingCart,
    title: "New Order Received",
    message: "Order #ORD-10495 from Sarah K. - \u20B1 2,340",
    time: "12 min ago",
    color: "text-blue-600 bg-blue-50",
    unread: true,
  },
  {
    id: 3,
    type: "alert",
    icon: AlertTriangle,
    title: "Stock Alert",
    message: "Egg Tray needs reordering (6 units left)",
    time: "28 min ago",
    color: "text-orange-600 bg-orange-50",
    unread: true,
  },
  {
    id: 4,
    type: "sales",
    icon: TrendingUp,
    title: "Sales Milestone",
    message: "You've reached \u20B1 100,000 in sales this month!",
    time: "1 hour ago",
    color: "text-green-600 bg-green-50",
    unread: false,
  },
  {
    id: 5,
    type: "inventory",
    icon: Package,
    title: "Stock Updated",
    message: "Cooking Oil 1L inventory adjusted (+50 units)",
    time: "2 hours ago",
    color: "text-purple-600 bg-purple-50",
    unread: false,
  },
]

export function NotificationPanel() {
  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-white/10 text-white"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-pink-500 text-white text-xs font-semibold border-2 border-purple-600"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-96 max-h-[500px] overflow-y-auto">
        <div className="flex items-center justify-between p-3 border-b">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
            <p className="text-xs text-gray-500 dark:text-[#b4b4d0]">{unreadCount} unread notifications</p>
          </div>
          <Button variant="ghost" size="sm" className="text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50">
            Mark all as read
          </Button>
        </div>

        <div className="divide-y">
          {notifications.map((notification) => {
            const Icon = notification.icon
            return (
              <div
                key={notification.id}
                className={`p-3 hover:bg-gray-50 dark:bg-[#1a1a35] cursor-pointer transition-colors ${notification.unread ? 'bg-blue-50/30' : ''
                  }`}
              >
                <div className="flex gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${notification.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{notification.title}</h4>
                      {notification.unread && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1"></div>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-[#b4b4d0] mt-1 line-clamp-2">{notification.message}</p>
                    <p className="text-xs text-gray-400 dark:text-[#9898b8] mt-1">{notification.time}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <DropdownMenuSeparator />
        <div className="p-2">
          <Button variant="ghost" className="w-full text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50">
            View all notifications
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}





