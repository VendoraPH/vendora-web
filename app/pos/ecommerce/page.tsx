"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Globe,
  ShoppingCart,
  Package,
  TrendingUp,
  Eye,
  Settings,
  ExternalLink,
  Palette,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { storeService, orderService } from "@/services"
import type { ApiStore } from "@/services"
import type { ApiProduct } from "@/services/product.service"
import { useOfflineData } from "@/hooks/use-offline-data"
import { StaleDataBanner } from "@/components/pos/StaleDataBanner"
import { getOnlineStatus } from "@/lib/sync-service"
import Swal from "sweetalert2"

interface RecentOrder {
  id: number | string
  order_number?: string
  customer?: string | { name?: string }
  ordered_at?: string
  created_at?: string
  total?: number
  status?: string
}

export default function EcommercePage() {
  const [storeActive, setStoreActive] = useState(true)

  const { data, isLoading: loading, isStale, lastSyncedAt, error, refresh } = useOfflineData<{
    store: ApiStore | null;
    products: ApiProduct[];
    recentOrders: RecentOrder[];
  }>(
    "ecommerce-store",
    async () => {
      const storesRaw = await storeService.getAll()
      const stores = Array.isArray(storesRaw) ? storesRaw : (storesRaw as any).data || []
      const firstStore = stores[0] ?? null
      let products: ApiProduct[] = []
      let recentOrders: RecentOrder[] = []
      if (firstStore) {
        try { products = await storeService.getProducts(firstStore.id, { per_page: 500 }) } catch {}
        try {
          const ord = await orderService.getAll({ per_page: 10 } as any)
          recentOrders = Array.isArray(ord) ? ord : (ord as any).data || []
        } catch {}
      }
      return { store: firstStore, products, recentOrders }
    },
    { staleAfterMinutes: 10 }
  )

  const store = data?.store ?? null
  const products = data?.products ?? []
  const recentOrders = data?.recentOrders ?? []

  useEffect(() => {
    if (data?.store) setStoreActive(data.store.is_active)
  }, [data?.store])

  const handleStoreToggle = async (active: boolean) => {
    if (!getOnlineStatus()) {
      Swal.fire({ icon: "info", title: "Unavailable Offline", text: "Store activation cannot be changed while offline." })
      return
    }
    setStoreActive(active)
    if (store) {
      try {
        await storeService.update(store.id, { is_active: active })
      } catch (err: any) {
        console.error("Failed to update store status:", err)
        setStoreActive(!active) // revert
      }
    }
  }

  const totalProducts = products.length
  const publishedProducts = products.filter((p: any) => p.is_active !== false && p.status !== "draft").length
  const draftProducts = totalProducts - publishedProducts

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-gray-600 dark:text-[#b4b4d0]">{error as string}</p>
        <Button onClick={refresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <StaleDataBanner isStale={isStale} lastSyncedAt={lastSyncedAt} />
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">E-commerce Store</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-[#b4b4d0] mt-0.5 sm:mt-1">Manage your online store and web presence</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-purple-600 hover:bg-purple-700 flex-1 sm:flex-none" asChild>
            <a href="/ecommerce/rbtesa/products" target="_blank">
              <ExternalLink className="w-4 h-4 mr-2" />
              Visit Store
            </a>
          </Button>
        </div>
      </div>

      {/* Store Status */}
      <div className="bg-white dark:bg-[#13132a] rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-2 sm:p-3 rounded-lg">
              <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Online Store Status</h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0] mt-0.5 sm:mt-1">
                {store?.name || "Your Store"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 dark:text-[#b4b4d0]">
              {storeActive ? "Store is Live" : "Store is Offline"}
            </span>
            <Switch
              checked={storeActive}
              onCheckedChange={handleStoreToggle}
              className="data-[state=checked]:bg-green-600"
            />
          </div>
        </div>
      </div>

      {/* Store Analytics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-white dark:bg-[#13132a] p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0]">Online Orders</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-1">{recentOrders.length}</p>
              <p className="text-[10px] sm:text-xs text-gray-600 dark:text-[#b4b4d0] mt-1 sm:mt-2">
                Recent orders
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 sm:p-3 rounded-lg hidden sm:block">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#13132a] p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0]">Store Visitors</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-1">--</p>
              <p className="text-[10px] sm:text-xs text-gray-600 dark:text-[#b4b4d0] mt-1 sm:mt-2">
                No analytics API
              </p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/30 p-2 sm:p-3 rounded-lg hidden sm:block">
              <Eye className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#13132a] p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0]">Conversion Rate</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-1">--</p>
              <p className="text-[10px] sm:text-xs text-gray-600 dark:text-[#b4b4d0] mt-1 sm:mt-2">
                No analytics API
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-2 sm:p-3 rounded-lg hidden sm:block">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#13132a] p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0]">Online Products</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-1">{totalProducts}</p>
              <p className="text-[10px] sm:text-xs text-gray-600 dark:text-[#b4b4d0] mt-1 sm:mt-2">
                Active listings
              </p>
            </div>
            <div className="bg-orange-100 dark:bg-orange-900/30 p-2 sm:p-3 rounded-lg hidden sm:block">
              <Package className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Store Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Storefront Design */}
        <div className="bg-white dark:bg-[#13132a] rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
              <Palette className="h-5 w-5 text-purple-600" />
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Storefront Design</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-[#e0e0f0] mb-2 block">Store Name</label>
              <Input defaultValue={store?.name || ""} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-[#e0e0f0] mb-2 block">Store Tagline</label>
              <Input defaultValue="Your trusted neighborhood store" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-[#e0e0f0] mb-2 block">Theme Color</label>
              <div className="flex gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-600 rounded-lg border-2 border-purple-800 cursor-pointer"></div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-lg border-2 border-gray-200 cursor-pointer"></div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-600 rounded-lg border-2 border-gray-200 cursor-pointer"></div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-600 rounded-lg border-2 border-gray-200 cursor-pointer"></div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-pink-600 rounded-lg border-2 border-gray-200 cursor-pointer"></div>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 border-t dark:border-[#2d1b69]">
              <div>
                <div className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Dark Mode</div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0]">Enable dark theme for your store</p>
              </div>
              <Switch />
            </div>
            <Button className="w-full bg-purple-600 hover:bg-purple-700">Save Design</Button>
          </div>
        </div>

        {/* Store Features */}
        <div className="bg-white dark:bg-[#13132a] rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4 sm:mb-6">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
              <Settings className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Store Features</h2>
          </div>
          <div className="space-y-4">
            {[
              { name: "Product Search", desc: "Allow customers to search products", checked: true },
              { name: "Shopping Cart", desc: "Enable cart functionality", checked: true },
              { name: "Customer Reviews", desc: "Allow product reviews and ratings", checked: true },
              { name: "Wishlist", desc: "Let customers save favorite items", checked: false },
              { name: "Live Chat Support", desc: "Provide real-time customer support", checked: false },
              { name: "Email Notifications", desc: "Send order confirmations via email", checked: true },
            ].map((feature, idx) => (
              <div key={idx} className={`flex items-center justify-between py-3 ${idx < 5 ? 'border-b dark:border-[#2d1b69]' : ''}`}>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">{feature.name}</div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0]">{feature.desc}</p>
                </div>
                <Switch defaultChecked={feature.checked} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Product Sync */}
      <div className="bg-white dark:bg-[#13132a] rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Package className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Product Synchronization</h2>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0]">Sync your POS products with online store</p>
            </div>
          </div>
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 w-fit">Synced</Badge>
        </div>
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="p-3 sm:p-4 bg-gray-50 dark:bg-[#1a1a35] rounded-lg">
            <div className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0] mb-1">Total Products</div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{totalProducts}</div>
          </div>
          <div className="p-3 sm:p-4 bg-gray-50 dark:bg-[#1a1a35] rounded-lg">
            <div className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0] mb-1">Published</div>
            <div className="text-xl sm:text-2xl font-bold text-green-600">{publishedProducts}</div>
          </div>
          <div className="p-3 sm:p-4 bg-gray-50 dark:bg-[#1a1a35] rounded-lg">
            <div className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0] mb-1">Draft/Hidden</div>
            <div className="text-xl sm:text-2xl font-bold text-gray-600 dark:text-[#b4b4d0]">{draftProducts}</div>
          </div>
        </div>
        <div className="flex gap-3 mt-4 sm:mt-6">
          <Button className="bg-purple-600 hover:bg-purple-700 flex-1 sm:flex-none" onClick={refresh}>
            Sync Now
          </Button>
          <Button variant="outline" className="flex-1 sm:flex-none">
            Manage Products
          </Button>
        </div>
      </div>

      {/* Recent Online Orders */}
      <div className="bg-white dark:bg-[#13132a] rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-6">Recent Online Orders</h2>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-[#b4b4d0] text-center py-8">No orders found</p>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => {
              const statusColor = order.status === "completed"
                ? "bg-green-100 text-green-800"
                : order.status === "pending"
                  ? "bg-purple-100 text-purple-800"
                  : "bg-blue-100 text-blue-800"
              const statusLabel = order.status
                ? order.status.charAt(0).toUpperCase() + order.status.slice(1)
                : "Unknown"
              const customerName = typeof order.customer === "object"
                ? order.customer?.name || "Customer"
                : order.customer || "Customer"
              const orderDate = order.ordered_at || order.created_at || ""

              return (
                <div key={order.id} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-[#1a1a35] rounded-lg">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="flex-shrink-0 bg-purple-100 p-1.5 sm:p-2 rounded">
                      <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {order.order_number || `#${order.id}`}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-[#b4b4d0] mt-0.5 sm:mt-1">
                        {customerName}
                        {orderDate && <span className="hidden sm:inline"> &bull; {orderDate}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="text-sm font-bold text-gray-900 dark:text-white">
                      ₱{(order.total ?? 0).toLocaleString()}
                    </div>
                    <Badge className={`${statusColor} hidden sm:inline-flex`}>
                      {statusLabel}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
