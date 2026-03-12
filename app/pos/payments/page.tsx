"use client"

import { useState, useMemo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  CreditCard,
  TrendingUp,
  Download,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  CloudOff,
  Clock,
} from "lucide-react"
import { useLocalPayments } from "@/hooks/use-local-data"
import { localDb } from "@/lib/local-first-service"
import type { LocalPayment } from "@/lib/db"
import { getOnlineStatus } from "@/lib/sync-service"

// ==================== Helpers ====================

/** API amounts are already in pesos */
const formatCurrency = (amount: number) =>
  `₱${(amount ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const formatDateTime = (value?: string) => {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

const capitalizeMethod = (method: string) => {
  if (!method) return "—"
  return method.charAt(0).toUpperCase() + method.slice(1).toLowerCase()
}

// ==================== Status Badges ====================

function PaymentStatusBadge({ status }: { status: string }) {
  if (status === "completed")
    return (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400">
        Completed
      </Badge>
    )
  if (status === "pending")
    return (
      <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400">
        Pending
      </Badge>
    )
  if (status === "refunded")
    return (
      <Badge className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400">
        Refunded
      </Badge>
    )
  if (status === "failed")
    return (
      <Badge className="bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400">
        Failed
      </Badge>
    )
  return (
    <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400">
      {capitalizeMethod(status)}
    </Badge>
  )
}

function SyncStatusIndicator({ payment }: { payment: LocalPayment }) {
  if (payment._syncError) {
    return (
      <span title={`Sync error: ${payment._syncError}`} className="inline-flex items-center">
        <AlertCircle className="h-3.5 w-3.5 text-red-500" />
      </span>
    )
  }
  if (payment._status === "created" || payment._status === "updated") {
    return (
      <span title="Pending sync" className="inline-flex items-center">
        <CloudOff className="h-3.5 w-3.5 text-yellow-500" />
      </span>
    )
  }
  return (
    <span title="Synced" className="inline-flex items-center">
      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
    </span>
  )
}

// ==================== Stats Computation ====================

function computeStats(payments: LocalPayment[]) {
  let totalRevenue = 0
  let cashTotal = 0
  let cardTotal = 0
  let onlineTotal = 0

  for (const p of payments) {
    const amt = p.amount ?? 0
    totalRevenue += amt

    const method = (p.method ?? "").toLowerCase()
    if (method === "cash") cashTotal += amt
    else if (method === "card") cardTotal += amt
    else if (method === "online") onlineTotal += amt
  }

  return { totalRevenue, cashTotal, cardTotal, onlineTotal }
}

// ==================== Main Page ====================

export default function PaymentsPage() {
  const { data: payments, isLoading, dirtyCount } = useLocalPayments()
  const [searchQuery, setSearchQuery] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Pull fresh data from API
  const handleRefresh = useCallback(async () => {
    if (!getOnlineStatus()) return
    setIsRefreshing(true)
    try {
      await localDb.payments.pullFresh()
    } catch (err) {
      console.error("Failed to refresh payments:", err)
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  // Sort payments by paid_at descending (newest first), fallback to created_at
  const sortedPayments = useMemo(() => {
    return [...payments].sort((a, b) => {
      const dateA = new Date(a.paid_at || a.created_at || 0).getTime()
      const dateB = new Date(b.paid_at || b.created_at || 0).getTime()
      return dateB - dateA
    })
  }, [payments])

  // Filter by search
  const filteredPayments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return sortedPayments
    return sortedPayments.filter(
      (p) =>
        (p.payment_number ?? "").toLowerCase().includes(q) ||
        String(p.order_id ?? "").includes(q) ||
        (p.customer_name ?? "").toLowerCase().includes(q) ||
        (p.method ?? "").toLowerCase().includes(q)
    )
  }, [sortedPayments, searchQuery])

  // Compute stats from all local data (not filtered)
  const stats = useMemo(() => computeStats(payments), [payments])

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Payments</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-[#b4b4d0] mt-0.5 sm:mt-1">
            Track and manage payment transactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dirtyCount > 0 && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-600 dark:text-yellow-400 dark:border-yellow-400">
              <CloudOff className="h-3 w-3 mr-1" />
              {dirtyCount} unsynced
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-full sm:w-auto"
          >
            {isRefreshing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
          <Button variant="outline" className="w-full sm:w-auto">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && payments.length === 0 && (
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <span className="ml-3 text-gray-600 dark:text-[#b4b4d0]">Loading payments...</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-white dark:bg-[#13132a] p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0]">Total Revenue</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-1">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-2 sm:p-3 rounded-lg">
              <span className="h-4 w-4 sm:h-6 sm:w-6 text-green-600 font-bold text-base sm:text-xl flex items-center justify-center">₱</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#13132a] p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0]">Cash Payments</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-1">
                {formatCurrency(stats.cashTotal)}
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 sm:p-3 rounded-lg">
              <span className="h-4 w-4 sm:h-6 sm:w-6 text-blue-600 font-bold text-base sm:text-xl flex items-center justify-center">₱</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#13132a] p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0]">Card Payments</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-1">
                {formatCurrency(stats.cardTotal)}
              </p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/30 p-2 sm:p-3 rounded-lg">
              <CreditCard className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#13132a] p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0]">Online Payments</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-1">
                {formatCurrency(stats.onlineTotal)}
              </p>
            </div>
            <div className="bg-orange-100 dark:bg-orange-900/30 p-2 sm:p-3 rounded-lg">
              <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-[#9898b8]" />
        <Input
          placeholder="Search payments by ID, order, customer, or method..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Empty State */}
      {!isLoading && filteredPayments.length === 0 && (
        <div className="bg-white dark:bg-[#13132a] rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm p-8 text-center">
          <Clock className="h-12 w-12 text-gray-300 dark:text-[#3d3d5c] mx-auto mb-3" />
          <p className="text-gray-600 dark:text-[#b4b4d0] font-medium">
            {searchQuery ? "No payments match your search" : "No payments yet"}
          </p>
          <p className="text-sm text-gray-500 dark:text-[#8888a8] mt-1">
            {searchQuery
              ? "Try a different search term"
              : "Payments will appear here after completing POS transactions"}
          </p>
        </div>
      )}

      {/* Payments Table - Desktop */}
      {filteredPayments.length > 0 && (
        <div className="hidden md:block bg-white dark:bg-[#13132a] rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-[#1a1a35] border-b border-gray-200 dark:border-[#2d1b69]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#b4b4d0] uppercase tracking-wider">
                    Payment ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#b4b4d0] uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#b4b4d0] uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#b4b4d0] uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#b4b4d0] uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#b4b4d0] uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#b4b4d0] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#b4b4d0] uppercase tracking-wider">
                    Sync
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#13132a] divide-y divide-gray-200 dark:divide-[#2d1b69]">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-[#1a1a35]">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {payment.payment_number || `PAY-${payment.id}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        ORD-{payment.order_id}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {payment.customer_name || "Walk-in"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-[#b4b4d0]">
                        {formatDateTime(payment.paid_at || payment.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        {formatCurrency(payment.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant="outline">{capitalizeMethod(payment.method)}</Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <PaymentStatusBadge status={payment.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SyncStatusIndicator payment={payment} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payments Cards - Mobile */}
      {filteredPayments.length > 0 && (
        <div className="md:hidden space-y-3">
          {filteredPayments.map((payment) => (
            <div
              key={payment.id}
              className="bg-white dark:bg-[#13132a] p-4 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {payment.payment_number || `PAY-${payment.id}`}
                    </div>
                    <SyncStatusIndicator payment={payment} />
                  </div>
                  <div className="text-xs text-gray-500 dark:text-[#b4b4d0] mt-0.5">
                    ORD-{payment.order_id} &bull; {payment.customer_name || "Walk-in"}
                  </div>
                </div>
                <PaymentStatusBadge status={payment.status} />
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-[#2d1b69]">
                <div className="text-xs text-gray-500 dark:text-[#b4b4d0]">
                  {formatDateTime(payment.paid_at || payment.created_at)}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {capitalizeMethod(payment.method)}
                  </Badge>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {formatCurrency(payment.amount)}
                  </span>
                </div>
              </div>
              {payment._syncError && (
                <div className="mt-2 px-2 py-1 rounded bg-red-50 dark:bg-red-900/20 text-xs text-red-600 dark:text-red-400">
                  Sync error: {payment._syncError}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
