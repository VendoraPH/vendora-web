"use client"

import { useState, useEffect } from "react"
import { formatCurrency } from "@/lib/utils"
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
  Link2,
  Check,
  Pencil,
} from "lucide-react"
import { storeService, orderService } from "@/services"
import type { ApiStore } from "@/services"
import type { ApiProduct } from "@/services/product.service"
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
  const [store, setStore] = useState<ApiStore | null>(null)
  const [products, setProducts] = useState<ApiProduct[]>([])
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [slugInput, setSlugInput] = useState("")
  const [isEditingSlug, setIsEditingSlug] = useState(false)
  const [slugSaving, setSlugSaving] = useState(false)
  const [slugError, setSlugError] = useState<string | null>(null)
  const [storeName, setStoreName] = useState("")
  const [storeTagline, setStoreTagline] = useState("")
  const [storeAddress, setStoreAddress] = useState("")
  const [storePhone, setStorePhone] = useState("")
  const [storeHours, setStoreHours] = useState("")
  const [designSaving, setDesignSaving] = useState(false)
  const [foodMenuEnabled, setFoodMenuEnabled] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const storesRaw = await storeService.getAll()
      const stores = Array.isArray(storesRaw) ? storesRaw : (storesRaw as any).data || []
      const firstStore = stores[0] ?? null
      setStore(firstStore)
      if (firstStore) {
        setStoreActive(firstStore.is_active)
        setSlugInput(firstStore.slug || "")
        setStoreName(firstStore.name || "")
        setStoreTagline((firstStore as any).settings?.tagline || "")
        setStoreAddress(firstStore.address || "")
        setStorePhone(firstStore.phone || "")
        setStoreHours((firstStore as any).settings?.operating_hours || "")
        setFoodMenuEnabled(firstStore.settings?.food_menu_enabled ?? true)
        try { setProducts(await storeService.getProducts(firstStore.id, { per_page: 500 })) } catch {}
        try {
          const ord = await orderService.getAll({ per_page: 10, channel: 'online' })
          setRecentOrders(Array.isArray(ord) ? ord : (ord as any).data || [])
        } catch {}
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load store data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleStoreToggle = async (active: boolean) => {
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

  const handleSlugSave = async () => {
    if (!store) return
    const trimmed = slugInput.trim().toLowerCase()
    if (!trimmed) {
      setSlugError("Store URL cannot be empty")
      return
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmed)) {
      setSlugError("Only lowercase letters, numbers, and hyphens allowed")
      return
    }
    if (trimmed === store.slug) {
      setIsEditingSlug(false)
      return
    }
    setSlugSaving(true)
    setSlugError(null)
    try {
      const updated = await storeService.update(store.id, { slug: trimmed } as any)
      const updatedStore = (updated as any)?.data ?? updated
      setStore({ ...store, slug: updatedStore.slug ?? trimmed })
      setSlugInput(updatedStore.slug ?? trimmed)
      setIsEditingSlug(false)
      Swal.fire({ icon: "success", title: "URL Updated", text: "Your store URL has been updated.", timer: 2000, showConfirmButton: false })
    } catch (err: any) {
      const msg = err?.response?.data?.errors?.slug?.[0] || err?.response?.data?.message || "Failed to update store URL"
      setSlugError(msg)
    } finally {
      setSlugSaving(false)
    }
  }

  const handleDesignSave = async () => {
    if (!store) return
    setDesignSaving(true)
    try {
      const updatedSettings = { ...(store as any).settings, tagline: storeTagline, operating_hours: storeHours }
      await storeService.update(store.id, {
        name: storeName,
        address: storeAddress,
        phone: storePhone,
        settings: updatedSettings,
      } as any)
      setStore({ ...store, name: storeName, address: storeAddress, phone: storePhone, settings: updatedSettings } as any)
      Swal.fire({ icon: "success", title: "Design Saved", text: "Your storefront design has been updated.", timer: 2000, showConfirmButton: false })
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "Error", text: err?.response?.data?.message || "Failed to save design settings." })
    } finally {
      setDesignSaving(false)
    }
  }

  const storeUrl = `/ecommerce/${store?.slug ?? "store"}/products`

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

  if (error && !store) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-gray-600 dark:text-[#b4b4d0]">{error}</p>
        <Button onClick={fetchData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">E-commerce Store</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-[#b4b4d0] mt-0.5 sm:mt-1">Manage your online store and web presence</p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-purple-600 hover:bg-purple-700 flex-1 sm:flex-none" asChild>
            <a href={storeUrl} target="_blank">
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

      {/* Store URL / Slug Setting */}
      {store && (
        <div className="bg-white dark:bg-[#13132a] rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
              <Link2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Store URL</h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0]">Customize your public store link</p>
            </div>
          </div>

          {isEditingSlug ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-[#b4b4d0] whitespace-nowrap hidden sm:inline">/ecommerce/</span>
                <Input
                  value={slugInput}
                  onChange={(e) => {
                    setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                    setSlugError(null)
                  }}
                  placeholder="your-store-name"
                  className="flex-1"
                  disabled={slugSaving}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSlugSave() }}
                />
                <span className="text-sm text-gray-500 dark:text-[#b4b4d0] whitespace-nowrap hidden sm:inline">/products</span>
              </div>
              {slugError && (
                <p className="text-xs text-red-500">{slugError}</p>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700"
                  onClick={handleSlugSave}
                  disabled={slugSaving}
                >
                  {slugSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSlugInput(store.slug || "")
                    setSlugError(null)
                    setIsEditingSlug(false)
                  }}
                  disabled={slugSaving}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <code className="text-sm bg-gray-100 dark:bg-[#1a1a35] px-3 py-1.5 rounded-md text-purple-600 dark:text-purple-400 truncate">
                  /ecommerce/{store.slug}/products
                </code>
                <button
                  onClick={() => setIsEditingSlug(true)}
                  className="text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors shrink-0"
                  title="Edit store URL"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-fit"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.origin + storeUrl)
                  Swal.fire({ icon: "success", title: "Copied!", text: "Store URL copied to clipboard.", timer: 1500, showConfirmButton: false })
                }}
              >
                Copy Link
              </Button>
            </div>
          )}
        </div>
      )}

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

      {/* Recent Online Orders */}
      <div className="bg-white dark:bg-[#13132a] rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-6">Recent Online Orders</h2>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-[#b4b4d0] text-center py-8">No online orders found</p>
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
                      {formatCurrency(order.total ?? 0)}
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
              <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-[#e0e0f0] mb-2 block">Store Tagline</label>
              <Input value={storeTagline} onChange={(e) => setStoreTagline(e.target.value)} placeholder="Your trusted neighborhood store" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-[#e0e0f0] mb-2 block">Address</label>
              <Input value={storeAddress} onChange={(e) => setStoreAddress(e.target.value)} placeholder="123 Rizal Ave, Brgy. San Isidro, Quezon City" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-[#e0e0f0] mb-2 block">Phone</label>
              <Input value={storePhone} onChange={(e) => setStorePhone(e.target.value)} placeholder="+63 912 345 6789" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-[#e0e0f0] mb-2 block">Operating Hours</label>
              <Input value={storeHours} onChange={(e) => setStoreHours(e.target.value)} placeholder="8:00 AM - 9:00 PM" />
            </div>
            <Button className="w-full bg-purple-600 hover:bg-purple-700" onClick={handleDesignSave} disabled={designSaving}>
              {designSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save Design
            </Button>
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
            {/* Food Menu — functional toggle */}
            <div className="flex items-center justify-between py-3 border-b dark:border-[#2d1b69]">
              <div>
                <div className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">Food Menu</div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0]">Show Food Menu in navigation and store page</p>
              </div>
              <Switch
                checked={foodMenuEnabled}
                onCheckedChange={async (enabled) => {
                  setFoodMenuEnabled(enabled)
                  if (store) {
                    try {
                      const updatedSettings = { ...store.settings, food_menu_enabled: enabled }
                      await storeService.update(store.id, { settings: updatedSettings })
                      setStore({ ...store, settings: updatedSettings } as any)
                      window.dispatchEvent(new CustomEvent("store-settings-changed", { detail: updatedSettings }))
                    } catch {
                      setFoodMenuEnabled(!enabled)
                    }
                  }
                }}
              />
            </div>
            {/* Decorative toggles */}
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
          <Button className="bg-purple-600 hover:bg-purple-700 flex-1 sm:flex-none" onClick={fetchData}>
            Sync Now
          </Button>
          <Button variant="outline" className="flex-1 sm:flex-none">
            Manage Products
          </Button>
        </div>
      </div>

    </div>
  )
}
