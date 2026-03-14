"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingBag, Clock, RefreshCw } from "lucide-react"
import { formatCurrency } from "@/lib/utils"
import { dashboardService } from "@/services/dashboard.service"
import type { PendingOrder } from "@/types/dashboard"

type PendingOrdersProps = {
  variant?: "default" | "embedded"
}

export function PendingOrders({ variant = "default" }: PendingOrdersProps) {
  const router = useRouter()
  const [orders, setOrders] = useState<PendingOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const isEmbedded = variant === "embedded"
  const headerClass = isEmbedded ? "px-0 pt-0" : undefined
  const contentClass = isEmbedded ? "px-0 pb-0" : undefined

  useEffect(() => {
    const fetchPendingOrders = async () => {
      try {
        const data = await dashboardService.getPendingOrders()
        setOrders(data.items)
      } catch (error) {
        console.error("Failed to fetch pending orders:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPendingOrders()
  }, [])

  const content = (
    <>
      <CardHeader className={headerClass}>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-500" />
          Pending Orders
        </CardTitle>
        <p className="text-sm text-gray-500 dark:text-[#b4b4d0]">
          {isLoading ? "Loading orders..." : `${orders.length} orders in queue`}
        </p>
      </CardHeader>
      <CardContent className={contentClass}>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400 dark:text-[#9898b8]" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-[#b4b4d0] text-sm">
            No pending orders. All caught up!
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-3 border border-blue-100 dark:border-blue-800/40 bg-blue-50/30 dark:bg-blue-950/20 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{order.order_number}</p>
                    <p className="text-xs text-gray-600 dark:text-[#e0e0f0]">{order.customer}</p>
                    <p className="text-xs text-gray-500 dark:text-[#b4b4d0]">
                      {order.items_count} items • {order.ordered_at}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                    {formatCurrency(order.total)}
                  </p>
                  <Button
                    size="sm"
                    variant="default"
                    className="text-xs bg-blue-600 hover:bg-blue-700"
                    onClick={() => router.push(`/pos/orders?order=${order.id}&highlight=${encodeURIComponent(order.order_number)}`)}
                  >
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
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
