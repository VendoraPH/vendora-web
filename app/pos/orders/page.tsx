"use client"

import { Suspense, useEffect, useMemo, useState, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import api from "@/lib/api-client"
import { posOrderEndpoints } from "./api-endpoints"
import { type LocalOrder } from "@/lib/db"
import { useLocalOrders } from "@/hooks/use-local-data"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Search,
  ClipboardList,
  Clock,
  RefreshCw,
  CheckCircle,
  Eye,
  Printer,
  Filter,
  Loader2,
} from "lucide-react"

type OrderRow = {
  id: string
  numericId: number
  customer: string
  date: string
  total: number
  status: "completed" | "pending" | "processing" | "cancelled"
  items: number
}

const normalizeStatus = (status?: string): OrderRow["status"] => {
  if (!status) return "pending"
  if (status === "completed" || status === "pending" || status === "processing" || status === "cancelled") {
    return status
  }
  if (status === "delivered") return "completed"
  if (status === "confirmed" || status === "shipped") return "processing"
  if (status === "refunded") return "cancelled"
  return "pending"
}

/**
 * Normalize order details response - convert centavos to pesos
 */
const normalizeOrderDetails = (raw: any): any => {
  if (!raw) return null

  // Items may be under `items` or `order_items`
  const rawItems: any[] = Array.isArray(raw?.items)
    ? raw.items
    : Array.isArray(raw?.order_items)
      ? raw.order_items
      : []

  // Resolve customer display name — prefer credit_customer for credit orders
  const cc = raw?.credit_customer;
  const resolvedCustomerName = cc
    ? `${cc.first_name || ''} ${cc.last_name || ''}`.trim() || raw?.customer?.name || raw?.customer_name || 'Walk-in Customer'
    : raw?.customer?.name || raw?.customer_name || 'Walk-in Customer';

  return {
    ...raw,
    customer: raw?.customer
      ? { ...raw.customer, name: resolvedCustomerName }
      : resolvedCustomerName,
    total: Number(raw?.total ?? 0) / 100,
    subtotal: Number(raw?.subtotal ?? 0) / 100,
    tax: Number(raw?.tax ?? 0) / 100,
    delivery_fee: Number(raw?.delivery_fee ?? 0) / 100,
    discount: Number(raw?.discount ?? 0) / 100,
    items: rawItems.map((item: any) => {
      // Try every common field name the API might use for unit price
      const rawPrice =
        item?.price ??
        item?.unit_price ??
        item?.sale_price ??
        item?.product?.price ??
        0
      const unitPrice = Number(rawPrice)

      const qty = Number(item?.quantity ?? item?.qty ?? 1)

      // Try every common field name for line total
      const rawLineTotal =
        item?.total ??
        item?.subtotal ??
        item?.line_total ??
        item?.amount ??
        rawPrice * qty
      const lineTotal = Number(rawLineTotal)

      return {
        ...item,
        price: unitPrice,
        quantity: qty,
        total: lineTotal || unitPrice * qty,
      }
    }),
  }
}

// Default layout component
function DesktopOrdersLayout() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const { data: localOrders, isLoading: isLocalLoading } = useLocalOrders()
  const [loadError] = useState<string | null>(null)

  // Map local orders to OrderRow format
  const orders = useMemo(() => {
    return localOrders.map((o: LocalOrder): OrderRow => ({
      id: o.order_number || String(o.id),
      numericId: Number(o.id),
      customer: o.customer_name || "Walk-in Customer",
      date: o.ordered_at ? (o.ordered_at.includes("T") ? o.ordered_at.slice(0, 10) : o.ordered_at) : (o.created_at?.slice(0, 10) || "—"),
      total: Number(o.total || 0),
      status: normalizeStatus(o.status),
      items: o.items_count || (o.items?.length || 0),
    }))
  }, [localOrders])

  const isLoading = isLocalLoading

  const searchParams = useSearchParams()
  const highlightOrderId = searchParams.get("order")       // numeric DB id
  const highlightOrderNum = searchParams.get("highlight")  // human-readable order number
  const autoOpenedRef = useRef(false)

  const [orderDetails, setOrderDetails] = useState<any>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  // Orders loaded reactively via useLocalOrders() -- no manual loadOrders() needed



  const loadOrderDetails = useCallback(async (orderId: string) => {
    setIsLoadingDetails(true)
    setIsDetailsModalOpen(true)
    try {
      // Use local data first — avoids 404 for local-only transactions (TXN-XXXXXXXX)
      const localOrder = localOrders.find(
        o => o.order_number === orderId || String(o.id) === orderId
      )

      if (localOrder) {
        // Local DB stores prices in pesos — set directly without /100
        setOrderDetails({
          id: localOrder.id,
          order_number: localOrder.order_number,
          customer: localOrder.customer_name || "Walk-in Customer",
          ordered_at: localOrder.ordered_at,
          status: localOrder.status,
          total: Number(localOrder.total || 0),
          subtotal: Number(localOrder.subtotal || localOrder.total || 0),
          tax: Number(localOrder.tax || 0),
          discount: Number(localOrder.discount || 0),
          delivery_fee: Number(localOrder.delivery_fee || 0),
          payment_method: localOrder.payment_method,
          items: (localOrder.items || []).map(item => ({
            name: item.product_name || `Product #${item.product_id}`,
            product: { name: item.product_name || `Product #${item.product_id}` },
            quantity: item.quantity,
            price: Number(item.price || 0),
            total: Number(item.price || 0) * item.quantity,
          })),
        })
        return
      }

      // Fallback: API call only for real server numeric IDs
      const numericId = Number(orderId.replace(/\D/g, '') || 0)
      if (numericId && numericId < 1_000_000) {
        const response = await api.get(posOrderEndpoints.get(numericId))
        setOrderDetails(normalizeOrderDetails(response))
      } else {
        setOrderDetails(null)
      }
    } catch (error) {
      console.error("Failed to load order details:", error)
      setOrderDetails(null)
    } finally {
      setIsLoadingDetails(false)
    }
  }, [localOrders])

  const printInvoice = async (orderId: string) => {
    try {
      await loadOrderDetails(orderId)
      setTimeout(() => {
        window.print()
      }, 500)
    } catch (error: any) {
      console.error("Failed to load invoice:", error)
      alert("Failed to load invoice. Please try again.")
    }
  }



  // Auto-open order detail modal when navigated from Pending Orders dashboard
  useEffect(() => {
    if (!highlightOrderId || isLoading || orders.length === 0 || autoOpenedRef.current) return
    autoOpenedRef.current = true
    loadOrderDetails(highlightOrderId)
    // Scroll highlighted row into view
    setTimeout(() => {
      const rowEl = document.getElementById(`order-row-${highlightOrderNum || highlightOrderId}`)
      rowEl?.scrollIntoView({ behavior: "smooth", block: "center" })
    }, 400)
  }, [isLoading, orders.length, highlightOrderId])

  // liveQuery handles reactivity — no auto-refresh interval needed

  const filteredOrders = useMemo(() => {
    let result = orders
    // Filter by status dropdown
    if (statusFilter !== "all") {
      result = result.filter(order => order.status === statusFilter)
    }
    // Filter by search query
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      result = result.filter((order) =>
        order.id.toLowerCase().includes(q) ||
        order.customer.toLowerCase().includes(q) ||
        order.date.toLowerCase().includes(q)
      )
    }
    return result
  }, [orders, searchQuery, statusFilter])

  const totalOrders = orders.length
  const pendingOrders = orders.filter((order) => order.status === "pending").length
  const processingOrders = orders.filter((order) => order.status === "processing").length
  const completedOrders = orders.filter((order) => order.status === "completed").length

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <ClipboardList className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Orders</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-[#b4b4d0] mt-0.5 sm:mt-1">View and manage customer orders</p>
          </div>
        </div>
      </div>

      {loadError && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          Failed to load orders: {loadError}
        </div>
      )}

      {isLoading && (
        <div className="rounded-lg border border-gray-200 dark:border-[#2d1b69] bg-gray-50 dark:bg-[#13132a] px-4 py-3 text-sm text-gray-600 dark:text-[#b4b4d0]">
          Loading orders...
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-white dark:bg-[#13132a] p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0]">Total Orders</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-1">{totalOrders}</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 sm:p-3 rounded-lg">
              <ClipboardList className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#13132a] p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0]">Pending</p>
              <p className="text-xl sm:text-2xl font-bold text-yellow-600 mt-0.5 sm:mt-1">{pendingOrders}</p>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 sm:p-3 rounded-lg">
              <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#13132a] p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0]">Processing</p>
              <p className="text-xl sm:text-2xl font-bold text-purple-600 mt-0.5 sm:mt-1">{processingOrders}</p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/30 p-2 sm:p-3 rounded-lg">
              <RefreshCw className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#13132a] p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0]">Completed</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600 mt-0.5 sm:mt-1">{completedOrders}</p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-2 sm:p-3 rounded-lg">
              <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-[#9898b8]" />
          <Input
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table - Desktop */}
      <div className="hidden md:block bg-white dark:bg-[#13132a] rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-[#1a1a35] border-b border-gray-200 dark:border-[#2d1b69]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#b4b4d0] uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#b4b4d0] uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#b4b4d0] uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#b4b4d0] uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#b4b4d0] uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#b4b4d0] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#b4b4d0] uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#13132a] divide-y divide-gray-200 dark:divide-[#2d1b69]">
              {filteredOrders.map((order) => {
                const isHighlighted =
                  (highlightOrderNum && order.id === highlightOrderNum) ||
                  (highlightOrderId && order.id === highlightOrderId)
                return (
                  <tr
                    key={order.id}
                    id={`order-row-${order.id}`}
                    className={`transition-colors ${isHighlighted
                      ? "bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-l-yellow-400"
                      : "hover:bg-gray-50 dark:hover:bg-[#1a1a35]"
                      }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{order.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{order.customer}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-[#b4b4d0]">{order.date}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-[#b4b4d0]">{order.items} items</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">₱{order.total.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.status === "completed" && (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">Completed</Badge>
                      )}
                      {order.status === "pending" && (
                        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</Badge>
                      )}
                      {order.status === "processing" && (
                        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400">Processing</Badge>
                      )}
                      {order.status === "cancelled" && (
                        <Badge className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400">Cancelled</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" onClick={() => loadOrderDetails(order.numericId)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => printInvoice(order.numericId)}>
                          <Printer className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Orders Cards - Mobile */}
      <div className="md:hidden space-y-3">
        {filteredOrders.map((order) => (
          <div key={order.id} className="bg-white dark:bg-[#13132a] p-4 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">{order.id}</div>
                <div className="text-sm text-gray-600 dark:text-[#b4b4d0] mt-0.5">{order.customer}</div>
              </div>
              <div>
                {order.status === "completed" && (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 text-xs">Completed</Badge>
                )}
                {order.status === "pending" && (
                  <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 text-xs">Pending</Badge>
                )}
                {order.status === "processing" && (
                  <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400 text-xs">Processing</Badge>
                )}
                {order.status === "cancelled" && (
                  <Badge className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 text-xs">Cancelled</Badge>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              <div>
                <span className="text-gray-500 dark:text-[#b4b4d0]">Date:</span>
                <span className="text-gray-900 dark:text-white ml-1">{order.date}</span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-[#b4b4d0]">Items:</span>
                <span className="text-gray-900 dark:text-white ml-1">{order.items}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500 dark:text-[#b4b4d0]">Total:</span>
                <span className="text-gray-900 dark:text-white font-medium ml-1">₱{order.total.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-[#2d1b69]">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => loadOrderDetails(order.numericId)}>
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              <Button size="sm" variant="outline" className="flex-1" onClick={() => printInvoice(order.numericId)}>
                <Printer className="h-4 w-4 mr-1" />
                Print
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Order Details Modal - Professional Invoice Design */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-transparent border-0 p-0">
          <DialogTitle className="sr-only">Invoice</DialogTitle>

          {isLoadingDetails ? (
            <div className="text-center py-8 bg-white dark:bg-[#13132a] rounded-2xl">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-600" />
              <p className="text-gray-600 dark:text-[#b4b4d0] mt-3">Loading invoice...</p>
            </div>
          ) : orderDetails ? (
            <>
              {/* Modal View - Professional Invoice */}
              <div className="rounded-3xl bg-gradient-to-br from-[#2d1f5e] via-[#3a2570] to-[#2d1f5e] border border-white/10 overflow-hidden shadow-2xl">
                {/* Invoice Header */}
                <div className="bg-gradient-to-r from-purple-600 to-violet-600 px-8 py-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-white">INVOICE</h1>
                      <p className="text-purple-100 mt-1">Vendora POS System</p>
                    </div>
                    <div className="text-right">
                      <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30">
                        <p className="text-xs text-purple-100">Invoice No.</p>
                        <p className="text-lg font-bold text-white">{orderDetails.order_number || `INV-${orderDetails.id}`}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Invoice Details */}
                <div className="px-8 py-6 space-y-6">
                  {/* Billed To & Invoice Info */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Billed To</p>
                        <p className="text-lg font-semibold text-white">{orderDetails.customer?.name || orderDetails.customer || "Walk-in Customer"}</p>
                        {orderDetails.customer?.email && (
                          <p className="text-sm text-white/60 mt-1">{orderDetails.customer.email}</p>
                        )}
                        {orderDetails.customer?.phone && (
                          <p className="text-sm text-white/60">{orderDetails.customer.phone}</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-3 text-right">
                      <div>
                        <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Invoice Date</p>
                        <p className="text-white font-medium">{orderDetails.ordered_at || orderDetails.created_at}</p>
                      </div>
                      <div>
                        <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Status</p>
                        <Badge className={
                          orderDetails.status === "completed" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" :
                            orderDetails.status === "pending" ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" :
                              orderDetails.status === "processing" ? "bg-blue-500/20 text-blue-300 border-blue-500/30" :
                                "bg-red-500/20 text-red-300 border-red-500/30"
                        }>
                          {orderDetails.status.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="border border-white/10 rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-white/5 border-b border-white/10">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-white/70 uppercase tracking-wider">Item Description</th>
                          <th className="px-4 py-3 text-center text-xs font-semibold text-white/70 uppercase tracking-wider">Qty</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-white/70 uppercase tracking-wider">Unit Price</th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-white/70 uppercase tracking-wider">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderDetails.items?.map((item: any, idx: number) => (
                          <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3 text-sm text-white">{item.product?.name || item.name || "Product"}</td>
                            <td className="px-4 py-3 text-sm text-white/80 text-center">{item.quantity}</td>
                            <td className="px-4 py-3 text-sm text-white/80 text-right">₱{Number(item.price || 0).toFixed(2)}</td>
                            <td className="px-4 py-3 text-sm text-white font-medium text-right">
                              ₱{(Number(item.quantity) * Number(item.price || 0)).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals Section */}
                  <div className="flex justify-end">
                    <div className="w-80 space-y-3">
                      <div className="flex justify-between text-sm py-2 border-b border-white/10">
                        <span className="text-white/60">Subtotal</span>
                        <span className="text-white font-medium">₱{Number(orderDetails.subtotal || orderDetails.total || 0).toFixed(2)}</span>
                      </div>
                      {orderDetails.tax > 0 && (
                        <div className="flex justify-between text-sm py-2 border-b border-white/10">
                          <span className="text-white/60">Tax (12%)</span>
                          <span className="text-white font-medium">₱{Number(orderDetails.tax || 0).toFixed(2)}</span>
                        </div>
                      )}
                      {orderDetails.delivery_fee > 0 && (
                        <div className="flex justify-between text-sm py-2 border-b border-white/10">
                          <span className="text-white/60">Delivery Fee</span>
                          <span className="text-white font-medium">₱{Number(orderDetails.delivery_fee || 0).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center bg-purple-500/20 rounded-lg px-4 py-3 border border-purple-500/30">
                        <span className="text-white font-semibold text-lg">Total Amount</span>
                        <span className="text-emerald-400 font-bold text-2xl">₱{Number(orderDetails.total || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment & Notes */}
                  {(orderDetails.payment_method || orderDetails.notes) && (
                    <div className="grid grid-cols-2 gap-4 pt-4">
                      {orderDetails.payment_method && (
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                          <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Payment Method</p>
                          <p className="text-white font-medium capitalize">{orderDetails.payment_method}</p>
                        </div>
                      )}
                      {orderDetails.notes && (
                        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                          <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Notes</p>
                          <p className="text-white/80 text-sm">{orderDetails.notes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer Message */}
                  <div className="text-center pt-6 border-t border-white/10">
                    <p className="text-white/40 text-sm">Thank you for your business!</p>
                    <p className="text-white/30 text-xs mt-1">This invoice was generated by Vendora POS System</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="px-8 py-6 bg-black/20 border-t border-white/10 flex gap-3">
                  <Button
                    onClick={() => window.print()}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl py-6 text-base font-semibold"
                  >
                    <Printer className="h-5 w-5 mr-2" />
                    Print Invoice
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="rounded-xl bg-white/10 hover:bg-white/20 text-white border-white/20 py-6 px-8"
                  >
                    Close
                  </Button>
                </div>
              </div>

              {/* Printable Invoice (Hidden, for printing only) */}
              <div id="printable-invoice" className="hidden print:block">
                <div style={{ width: '210mm', minHeight: '297mm', padding: '15mm', fontFamily: 'Arial, sans-serif', background: 'white', color: '#000' }}>
                  {/* Print Header */}
                  <div style={{ borderBottom: '2px solid #000', paddingBottom: '15px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#000', margin: 0, lineHeight: '1' }}>INVOICE</h1>
                        <p style={{ fontSize: '13px', color: '#333', margin: '5px 0 0 0', fontWeight: '500' }}>Vendora POS System</p>
                      </div>
                      <div style={{ textAlign: 'right', background: '#f3f4f6', padding: '10px 15px', borderRadius: '6px', border: '1px solid #d1d5db' }}>
                        <p style={{ fontSize: '10px', color: '#333', margin: 0, fontWeight: '600' }}>Invoice No.</p>
                        <p style={{ fontSize: '16px', fontWeight: 'bold', margin: '3px 0 0 0', color: '#000' }}>{orderDetails.order_number || `INV-${orderDetails.id}`}</p>
                      </div>
                    </div>
                  </div>

                  {/* Print Details */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '20px' }}>
                    <div>
                      <p style={{ fontSize: '10px', color: '#333', textTransform: 'uppercase', marginBottom: '6px', fontWeight: '600', letterSpacing: '0.5px' }}>Billed To</p>
                      <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0, color: '#000' }}>{orderDetails.customer?.name || orderDetails.customer || "Walk-in Customer"}</p>
                      {orderDetails.customer?.email && <p style={{ fontSize: '11px', color: '#333', margin: '5px 0 0 0' }}>{orderDetails.customer.email}</p>}
                      {orderDetails.customer?.phone && <p style={{ fontSize: '11px', color: '#333', margin: '3px 0 0 0' }}>{orderDetails.customer.phone}</p>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ marginBottom: '12px' }}>
                        <p style={{ fontSize: '10px', color: '#333', textTransform: 'uppercase', marginBottom: '6px', fontWeight: '600', letterSpacing: '0.5px' }}>Invoice Date</p>
                        <p style={{ fontSize: '12px', fontWeight: '600', color: '#000', margin: 0 }}>{orderDetails.ordered_at || orderDetails.created_at}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '10px', color: '#333', textTransform: 'uppercase', marginBottom: '6px', fontWeight: '600', letterSpacing: '0.5px' }}>Status</p>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: '700',
                          border: '1.5px solid',
                          display: 'inline-block',
                          background: orderDetails.status === "completed" ? '#d1fae5' : orderDetails.status === "pending" ? '#fef3c7' : '#dbeafe',
                          color: orderDetails.status === "completed" ? '#065f46' : orderDetails.status === "pending" ? '#92400e' : '#1e40af',
                          borderColor: orderDetails.status === "completed" ? '#10b981' : orderDetails.status === "pending" ? '#f59e0b' : '#3b82f6'
                        }}>
                          {orderDetails.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Print Items Table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px', border: '1.5px solid #d1d5db' }}>
                    <thead>
                      <tr style={{ background: '#f9fafb', borderBottom: '1.5px solid #d1d5db' }}>
                        <th style={{ padding: '10px 8px', textAlign: 'left', fontSize: '10px', fontWeight: '700', color: '#000', textTransform: 'uppercase', letterSpacing: '0.3px', width: '45%' }}>Item Description</th>
                        <th style={{ padding: '10px 8px', textAlign: 'center', fontSize: '10px', fontWeight: '700', color: '#000', textTransform: 'uppercase', letterSpacing: '0.3px', width: '15%' }}>Qty</th>
                        <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: '10px', fontWeight: '700', color: '#000', textTransform: 'uppercase', letterSpacing: '0.3px', width: '20%' }}>Unit Price</th>
                        <th style={{ padding: '10px 8px', textAlign: 'right', fontSize: '10px', fontWeight: '700', color: '#000', textTransform: 'uppercase', letterSpacing: '0.3px', width: '20%' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderDetails.items?.map((item: any, idx: number) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={{ padding: '10px 8px', fontSize: '11px', color: '#000' }}>{item.product?.name || item.name || "Product"}</td>
                          <td style={{ padding: '10px 8px', fontSize: '11px', textAlign: 'center', color: '#000', fontWeight: '600' }}>{item.quantity}</td>
                          <td style={{ padding: '10px 8px', fontSize: '11px', textAlign: 'right', color: '#000' }}>₱{Number(item.price || 0).toFixed(2)}</td>
                          <td style={{ padding: '10px 8px', fontSize: '11px', textAlign: 'right', fontWeight: '600', color: '#000' }}>₱{(Number(item.quantity) * Number(item.price || 0)).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Print Totals */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                    <div style={{ width: '280px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #d1d5db' }}>
                        <span style={{ fontSize: '11px', color: '#333', fontWeight: '500' }}>Subtotal</span>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#000' }}>₱{Number(orderDetails.subtotal || orderDetails.total || 0).toFixed(2)}</span>
                      </div>
                      {orderDetails.tax > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #d1d5db' }}>
                          <span style={{ fontSize: '11px', color: '#333', fontWeight: '500' }}>Tax (12%)</span>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: '#000' }}>₱{Number(orderDetails.tax || 0).toFixed(2)}</span>
                        </div>
                      )}
                      {orderDetails.delivery_fee > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #d1d5db' }}>
                          <span style={{ fontSize: '11px', color: '#333', fontWeight: '500' }}>Delivery Fee</span>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: '#000' }}>₱{Number(orderDetails.delivery_fee || 0).toFixed(2)}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 15px', background: '#f3f4f6', borderRadius: '6px', marginTop: '10px', border: '2px solid #000' }}>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: '#000' }}>Total Amount</span>
                        <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#000' }}>₱{Number(orderDetails.total || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Print Footer */}
                  {(orderDetails.payment_method || orderDetails.notes) && (
                    <div style={{ marginTop: '25px', paddingTop: '15px', borderTop: '1.5px solid #d1d5db' }}>
                      {orderDetails.payment_method && (
                        <div style={{ marginBottom: '12px' }}>
                          <p style={{ fontSize: '10px', color: '#333', textTransform: 'uppercase', marginBottom: '5px', fontWeight: '600', letterSpacing: '0.3px' }}>Payment Method</p>
                          <p style={{ fontSize: '12px', fontWeight: '600', textTransform: 'capitalize', color: '#000', margin: 0 }}>{orderDetails.payment_method}</p>
                        </div>
                      )}
                      {orderDetails.notes && (
                        <div>
                          <p style={{ fontSize: '10px', color: '#333', textTransform: 'uppercase', marginBottom: '5px', fontWeight: '600', letterSpacing: '0.3px' }}>Notes</p>
                          <p style={{ fontSize: '11px', color: '#000', margin: 0 }}>{orderDetails.notes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ textAlign: 'center', marginTop: '40px', paddingTop: '15px', borderTop: '1.5px solid #d1d5db' }}>
                    <p style={{ fontSize: '12px', color: '#333', fontWeight: '500', margin: 0 }}>Thank you for your business!</p>
                    <p style={{ fontSize: '10px', color: '#666', marginTop: '5px', margin: 0 }}>This invoice was generated by Vendora POS System</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 bg-white dark:bg-[#13132a] rounded-2xl">
              <p className="text-red-600">Failed to load order details</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[calc(100vh-4rem)]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" /></div>}>
      <DesktopOrdersLayout />
    </Suspense>
  )
}
