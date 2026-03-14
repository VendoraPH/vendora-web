"use client"

import { useState, use, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    ArrowLeft,
    Phone,
    Mail,
    User,
    Calendar,
    MapPin,
    History,
    AlertCircle,
    Banknote,
    CheckCircle2,
    Clock,
    XCircle,
    Loader2,
    BookOpen,
    TrendingDown,
    TrendingUp,
    ShoppingBag,
    ChevronDown,
    ChevronRight,
} from "lucide-react"
import { creditService, orderService } from "@/services"
import type { ApiCredit } from "@/services"
import Swal from "sweetalert2"
import { getOnlineStatus } from "@/lib/sync-service"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface PurchasedItem {
    id: number
    name: string
    quantity: number
    unitPrice: number
    total: number
}

interface CreditTransaction {
    id: number
    amount: number
    paidAmount: number
    balance: number
    status: 'active' | 'overdue' | 'paid' | 'defaulted'
    createdAt: string
    dueDate?: string
    orderNumber?: string
    notes?: string
    items: PurchasedItem[]
}

interface CustomerInfo {
    id: number
    name: string
    phone?: string
    email?: string
    address?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function resolveCustomerInfo(c: ApiCredit): CustomerInfo {
    const cc = c.credit_customer
    const name = c.customer?.name?.trim()
        ?? (cc ? [cc.first_name, cc.middle_name, cc.last_name].filter(Boolean).join(" ") : null)
        ?? `Customer #${c.customer_id}`
    return {
        id: c.customer?.id ?? c.customer_id,
        name,
        phone: c.customer?.phone ?? cc?.contact_number ?? undefined,
        email: c.customer?.email ?? undefined,
        address: c.customer?.address ?? cc?.address ?? undefined,
    }
}

function mapItems(c: ApiCredit): PurchasedItem[] {
    return (c.order?.items ?? []).map((item: any, idx: number) => {
        const name =
            item.product_name ??
            item.product?.name ??
            item.name ??
            `Product #${item.product_id ?? idx + 1}`

        const catalogPrice = item.product?.price ?? item.unit_price ?? item.sale_price ?? null
        const storedPrice = item.price != null ? Number(item.price) / 100 : 0
        const unitPrice = catalogPrice != null ? Number(catalogPrice) : storedPrice
        const qty = Number(item.quantity ?? item.qty) || 1
        const lineTotal = item.total != null ? Number(item.total) / 100 : unitPrice * qty

        return { id: item.id ?? idx, name, quantity: qty, unitPrice, total: lineTotal }
    })
}

function mapCreditToTransaction(c: ApiCredit): CreditTransaction {
    const status: CreditTransaction['status'] =
        c.status === "active" || c.status === "overdue" || c.status === "paid" || c.status === "defaulted"
            ? c.status : "active"
    return {
        id: c.id,
        amount: Number(c.amount) / 100 || 0,
        paidAmount: Number(c.paid_amount) / 100 || 0,
        balance: Number(c.balance) / 100 || 0,
        status,
        createdAt: c.created_at,
        dueDate: c.due_date ?? undefined,
        orderNumber: c.order?.order_number ?? undefined,
        notes: c.notes ?? undefined,
        items: mapItems(c),
    }
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------
function StatusBadge({ status }: { status: CreditTransaction['status'] }) {
    const variants = {
        active: { cls: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300", icon: Clock, text: "Active" },
        paid: { cls: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300", icon: CheckCircle2, text: "Paid" },
        overdue: { cls: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300", icon: AlertCircle, text: "Overdue" },
        defaulted: { cls: "bg-gray-100 dark:bg-gray-800/30 text-gray-700 dark:text-[#b4b4d0]", icon: XCircle, text: "Defaulted" },
    }
    const { cls, icon: Icon, text } = variants[status]
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${cls}`}>
            <Icon className="w-3 h-3" />
            {text}
        </span>
    )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function CreditAccountDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const resolvedParams = use(params)
    const customerId = resolvedParams.id

    const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false)
    const [paymentAmount, setPaymentAmount] = useState("")
    const [paymentMethod, setPaymentMethod] = useState("")
    const [selectedCreditId, setSelectedCreditId] = useState<number | null>(null)
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false)
    const [activeTab, setActiveTab] = useState<'transactions' | 'ledger'>('transactions')
    const [expandedTxn, setExpandedTxn] = useState<Set<number>>(new Set())

    const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null)
    const [transactions, setTransactions] = useState<CreditTransaction[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const refresh = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        try {
            const raw = await creditService.getByCustomer(customerId)
            const arr: ApiCredit[] = Array.isArray(raw)
                ? (raw as ApiCredit[])
                : ((raw as { data?: ApiCredit[] }).data ?? [])

            if (arr.length === 0) {
                setCustomerInfo(null)
                setTransactions([])
                return
            }

            // Extract customer info from first credit that has it
            const infoSource = arr.find(c => c.customer?.name || c.credit_customer) ?? arr[0]!
            setCustomerInfo(resolveCustomerInfo(infoSource))

            // For each credit that has order_id but no embedded items, fetch order
            const enriched = await Promise.all(arr.map(async (credit) => {
                if (credit.order_id && (!credit.order?.items || credit.order.items.length === 0)) {
                    try {
                        const order = await orderService.getById(credit.order_id)
                        const rawOrder = order as any
                        const rawItems = Array.isArray(rawOrder?.items)
                            ? rawOrder.items
                            : Array.isArray(rawOrder?.order_items)
                                ? rawOrder.order_items
                                : []
                        return {
                            ...credit,
                            order: {
                                id: rawOrder.id ?? credit.order_id,
                                order_number: rawOrder.order_number ?? null,
                                ordered_at: rawOrder.ordered_at ?? null,
                                items: rawItems,
                            },
                        }
                    } catch {
                        return credit
                    }
                }
                return credit
            }))

            setTransactions(enriched.map(mapCreditToTransaction))
        } catch (err: unknown) {
            const e = err as { message?: string }
            setError(e?.message || "Failed to load credit account")
        } finally {
            setIsLoading(false)
        }
    }, [customerId])

    useEffect(() => { refresh() }, [refresh])

    // Aggregated totals
    const totalAmount = transactions.reduce((s, t) => s + t.amount, 0)
    const paidAmount = transactions.reduce((s, t) => s + t.paidAmount, 0)
    const remainingBalance = transactions.reduce((s, t) => s + t.balance, 0)

    // Unpaid credits for payment dialog
    const unpaidCredits = transactions.filter(t => t.balance > 0)

    const openAddPayment = (creditId?: number) => {
        const defaultCredit = creditId
            ? transactions.find(t => t.id === creditId)
            : unpaidCredits[0]
        setSelectedCreditId(defaultCredit?.id ?? null)
        setPaymentAmount("")
        setPaymentMethod("")
        setIsAddPaymentOpen(true)
    }

    const handleSubmitPayment = async () => {
        if (!selectedCreditId || !paymentAmount || !paymentMethod) return

        if (!getOnlineStatus()) {
            Swal.fire({ icon: "info", title: "Unavailable Offline", text: "Payments cannot be recorded while offline." })
            return
        }

        const amount = Math.round(parseFloat(paymentAmount))
        const txn = transactions.find(t => t.id === selectedCreditId)
        if (isNaN(amount) || amount <= 0) {
            Swal.fire({ icon: "error", title: "Invalid Amount", text: "Please enter a valid payment amount." })
            return
        }
        if (txn && amount > txn.balance) {
            Swal.fire({ icon: "error", title: "Amount Too High", text: `Payment cannot exceed remaining balance of ₱${txn.balance.toLocaleString()}.` })
            return
        }

        setIsSubmittingPayment(true)
        try {
            const method = paymentMethod === "bank" ? "online" : paymentMethod as "cash" | "card" | "online"
            await creditService.recordPayment(selectedCreditId, { amount, method })

            Swal.fire({
                icon: "success",
                title: "Payment Recorded",
                text: `₱${amount.toLocaleString()} payment recorded.`,
                timer: 2000,
                showConfirmButton: false,
            })

            setIsAddPaymentOpen(false)
            refresh()
        } catch (err: any) {
            console.error("Failed to record payment:", err)
            const message = err?.response?.data?.message || err?.message || "Failed to record payment."
            Swal.fire({ icon: "error", title: "Payment Failed", text: message })
        } finally {
            setIsSubmittingPayment(false)
        }
    }

    const toggleExpanded = (id: number) => {
        setExpandedTxn(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id); else next.add(id)
            return next
        })
    }

    const fmt = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh] gap-3 text-gray-500 dark:text-[#b4b4d0]">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                <span className="text-sm font-medium">Loading credit account...</span>
            </div>
        )
    }

    if (error || !customerInfo) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <AlertCircle className="w-12 h-12 text-gray-300 dark:text-[#9898b8] mb-3" />
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                    {error ? "Error Loading Account" : "No Credits Found"}
                </h2>
                <p className="text-sm text-gray-500 dark:text-[#b4b4d0] mb-4">
                    {error || "This customer has no credit transactions."}
                </p>
                <Button asChild size="sm">
                    <Link href="/pos/credit-accounts">
                        <ArrowLeft className="w-4 h-4 mr-1.5" />
                        Back
                    </Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-4 pb-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push('/pos/credit-accounts')}
                        className="h-8 w-8 rounded-full border border-gray-200 dark:border-[#2d1b69]"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 dark:text-white">{customerInfo.name}</h1>
                        {customerInfo.phone && (
                            <p className="text-xs text-gray-500 dark:text-[#b4b4d0]">{customerInfo.phone}</p>
                        )}
                    </div>
                </div>
                {remainingBalance > 0 && (
                    <Button
                        size="sm"
                        onClick={() => openAddPayment()}
                        className="bg-purple-600 hover:bg-purple-700 h-8"
                    >
                        <Banknote className="w-3.5 h-3.5 mr-1" />
                        Record Payment
                    </Button>
                )}
            </div>

            {/* Summary bar */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3 bg-white dark:bg-[#13132a] rounded-lg border border-gray-100 dark:border-[#2d1b69] text-sm">
                <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-[#b4b4d0]">Total:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">{fmt(totalAmount)}</span>
                </div>
                <div className="w-px h-4 bg-gray-200 dark:bg-[#2d1b69] hidden sm:block" />
                <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-[#b4b4d0]">Paid:</span>
                    <span className="font-semibold text-emerald-600">{fmt(paidAmount)}</span>
                </div>
                <div className="w-px h-4 bg-gray-200 dark:bg-[#2d1b69] hidden sm:block" />
                <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-[#b4b4d0]">Balance:</span>
                    <span className={`font-bold ${remainingBalance > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                        {fmt(remainingBalance)}
                    </span>
                </div>
                <div className="w-px h-4 bg-gray-200 dark:bg-[#2d1b69] hidden sm:block" />
                <span className="text-xs text-gray-400 dark:text-[#9898b8]">
                    {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-[#2d1b69]">
                <nav className="flex gap-4">
                    {[
                        { id: 'transactions', label: 'Transactions', icon: History },
                        { id: 'ledger', label: 'Ledger', icon: BookOpen },
                    ].map((tab) => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                className={`flex items-center gap-1.5 py-2 px-1 border-b-2 text-sm font-medium transition-colors ${isActive
                                    ? 'border-purple-600 text-purple-600'
                                    : 'border-transparent text-gray-500 dark:text-[#b4b4d0] hover:text-gray-700 dark:hover:text-white'
                                    }`}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        )
                    })}
                </nav>
            </div>

            {/* Tab Content */}
            <div>
                {/* Transactions Tab */}
                {activeTab === 'transactions' && (
                    <div className="space-y-3">
                        {/* Customer info card */}
                        <div className="bg-white dark:bg-[#13132a] rounded-lg border border-gray-100 dark:border-[#2d1b69] p-4">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Customer Information</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                <div className="flex items-center gap-2 text-gray-600 dark:text-[#b4b4d0]">
                                    <User className="w-4 h-4 text-gray-400" />
                                    <span>{customerInfo.name}</span>
                                </div>
                                {customerInfo.phone && (
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-[#b4b4d0]">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        <span>{customerInfo.phone}</span>
                                    </div>
                                )}
                                {customerInfo.email && (
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-[#b4b4d0]">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        <span>{customerInfo.email}</span>
                                    </div>
                                )}
                                {customerInfo.address && (
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-[#b4b4d0] sm:col-span-2">
                                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                        <span>{customerInfo.address}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Transaction list */}
                        <div className="space-y-2">
                            {transactions.map((txn) => {
                                const isExpanded = expandedTxn.has(txn.id)
                                return (
                                    <div
                                        key={txn.id}
                                        className="bg-white dark:bg-[#13132a] rounded-lg border border-gray-100 dark:border-[#2d1b69] overflow-hidden"
                                    >
                                        {/* Transaction header row */}
                                        <div className="flex items-center justify-between gap-3 p-4">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <button
                                                    onClick={() => toggleExpanded(txn.id)}
                                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors flex-shrink-0"
                                                >
                                                    {isExpanded
                                                        ? <ChevronDown className="w-4 h-4" />
                                                        : <ChevronRight className="w-4 h-4" />
                                                    }
                                                </button>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {txn.orderNumber ? `Order #${txn.orderNumber}` : `Credit #${txn.id}`}
                                                        </span>
                                                        <StatusBadge status={txn.status} />
                                                    </div>
                                                    <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400 dark:text-[#9898b8]">
                                                        <Calendar className="w-3 h-3" />
                                                        {formatDate(txn.createdAt)}
                                                        {txn.dueDate && (
                                                            <span className="ml-2">· Due: {formatDate(txn.dueDate)}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm flex-shrink-0">
                                                <div className="text-right hidden sm:block">
                                                    <div className="text-xs text-gray-400 dark:text-[#9898b8]">Amount</div>
                                                    <div className="font-semibold text-gray-900 dark:text-white">{fmt(txn.amount)}</div>
                                                </div>
                                                <div className="text-right hidden sm:block">
                                                    <div className="text-xs text-gray-400 dark:text-[#9898b8]">Paid</div>
                                                    <div className="font-semibold text-emerald-600">{fmt(txn.paidAmount)}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs text-gray-400 dark:text-[#9898b8]">Balance</div>
                                                    <div className={`font-bold ${txn.balance > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                                                        {fmt(txn.balance)}
                                                    </div>
                                                </div>
                                                {txn.balance > 0 && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => openAddPayment(txn.id)}
                                                        className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white hidden sm:flex"
                                                    >
                                                        <Banknote className="w-3 h-3 mr-1" />
                                                        Pay
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Expanded: purchased items */}
                                        {isExpanded && (
                                            <div className="border-t border-gray-100 dark:border-[#2d1b69] px-4 pb-4 pt-3">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <ShoppingBag className="w-3.5 h-3.5 text-purple-500" />
                                                    <span className="text-xs font-semibold text-gray-700 dark:text-[#e0e0f0]">Purchased Items</span>
                                                </div>
                                                {txn.items.length > 0 ? (
                                                    <div className="space-y-0 divide-y divide-gray-50 dark:divide-[#2d1b69]">
                                                        {txn.items.map((item) => (
                                                            <div key={item.id} className="flex items-center justify-between py-2 text-sm">
                                                                <div className="flex-1 min-w-0">
                                                                    <span className="font-medium text-gray-900 dark:text-white truncate block">{item.name}</span>
                                                                    <span className="text-xs text-gray-400 dark:text-[#9898b8]">
                                                                        {item.quantity} × ₱{item.unitPrice.toLocaleString()}
                                                                    </span>
                                                                </div>
                                                                <span className="font-semibold text-gray-900 dark:text-white ml-4">
                                                                    ₱{item.total.toLocaleString()}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-xs text-gray-400 dark:text-[#9898b8]">Item details not available</p>
                                                )}
                                                {txn.notes && (
                                                    <p className="mt-2 text-xs text-gray-500 dark:text-[#b4b4d0] italic">{txn.notes}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Ledger Tab */}
                {activeTab === 'ledger' && (
                    <div className="space-y-4">
                        {/* Summary */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-white dark:bg-[#13132a] rounded-lg border border-gray-100 dark:border-[#2d1b69] p-3 text-center">
                                <div className="flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-[#b4b4d0] mb-1">
                                    <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                                    Total Debit
                                </div>
                                <div className="text-base font-bold text-red-600">{fmt(totalAmount)}</div>
                            </div>
                            <div className="bg-white dark:bg-[#13132a] rounded-lg border border-gray-100 dark:border-[#2d1b69] p-3 text-center">
                                <div className="flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-[#b4b4d0] mb-1">
                                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                                    Total Paid
                                </div>
                                <div className="text-base font-bold text-emerald-600">{fmt(paidAmount)}</div>
                            </div>
                            <div className="bg-white dark:bg-[#13132a] rounded-lg border border-gray-100 dark:border-[#2d1b69] p-3 text-center">
                                <div className="flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-[#b4b4d0] mb-1">
                                    <Banknote className="w-3.5 h-3.5 text-orange-500" />
                                    Balance Due
                                </div>
                                <div className={`text-base font-bold ${remainingBalance > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                                    {fmt(remainingBalance)}
                                </div>
                            </div>
                        </div>

                        {/* Ledger table — Desktop */}
                        <div className="hidden sm:block bg-white dark:bg-[#13132a] rounded-lg border border-gray-100 dark:border-[#2d1b69] overflow-hidden">
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-[#2d1b69]">
                                <BookOpen className="w-4 h-4 text-purple-500" />
                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    Account Ledger — {customerInfo.name}
                                </span>
                            </div>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-[#1a1a35] border-b border-gray-100 dark:border-[#2d1b69]">
                                        <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 dark:text-[#b4b4d0] uppercase tracking-wide">Date</th>
                                        <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 dark:text-[#b4b4d0] uppercase tracking-wide">Reference</th>
                                        <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 dark:text-[#b4b4d0] uppercase tracking-wide">Status</th>
                                        <th className="text-right py-2.5 px-4 text-xs font-semibold text-red-500 uppercase tracking-wide">Debit (₱)</th>
                                        <th className="text-right py-2.5 px-4 text-xs font-semibold text-emerald-600 uppercase tracking-wide">Paid (₱)</th>
                                        <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 dark:text-[#b4b4d0] uppercase tracking-wide">Balance (₱)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((txn) => (
                                        <tr key={txn.id} className="border-b border-gray-50 dark:border-[#2d1b69]/50 hover:bg-gray-50 dark:hover:bg-[#1a1a35] transition-colors">
                                            <td className="py-3 px-4 text-gray-600 dark:text-[#b4b4d0] whitespace-nowrap">{formatDate(txn.createdAt)}</td>
                                            <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">
                                                {txn.orderNumber ? `Order #${txn.orderNumber}` : `Credit #${txn.id}`}
                                            </td>
                                            <td className="py-3 px-4">
                                                <StatusBadge status={txn.status} />
                                            </td>
                                            <td className="py-3 px-4 text-right font-semibold text-red-600">{fmt(txn.amount)}</td>
                                            <td className="py-3 px-4 text-right font-semibold text-emerald-600">{fmt(txn.paidAmount)}</td>
                                            <td className={`py-3 px-4 text-right font-bold ${txn.balance > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                                                {fmt(txn.balance)}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className={`border-t-2 ${remainingBalance > 0 ? 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10' : 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10'}`}>
                                        <td colSpan={5} className={`py-3 px-4 text-sm font-bold ${remainingBalance > 0 ? 'text-orange-700 dark:text-orange-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                                            {remainingBalance > 0 ? 'Balance Due' : '✓ Fully Paid'}
                                        </td>
                                        <td className={`py-3 px-4 text-right text-base font-extrabold ${remainingBalance > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                                            {fmt(remainingBalance)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Ledger — Mobile */}
                        <div className="sm:hidden space-y-2">
                            {transactions.map((txn) => (
                                <div key={txn.id} className="bg-white dark:bg-[#13132a] rounded-lg border border-gray-100 dark:border-[#2d1b69] p-3">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {txn.orderNumber ? `Order #${txn.orderNumber}` : `Credit #${txn.id}`}
                                        </span>
                                        <StatusBadge status={txn.status} />
                                    </div>
                                    <div className="text-xs text-gray-400 dark:text-[#9898b8] mb-1">{formatDate(txn.createdAt)}</div>
                                    <div className="flex gap-4 text-xs">
                                        <span className="text-red-500">DR: {fmt(txn.amount)}</span>
                                        <span className="text-emerald-600">Paid: {fmt(txn.paidAmount)}</span>
                                        <span className={`font-semibold ml-auto ${txn.balance > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                                            Bal: {fmt(txn.balance)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            <div className={`rounded-lg border-2 p-3 text-center ${remainingBalance > 0 ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/10' : 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/10'}`}>
                                <div className={`text-xs font-semibold mb-0.5 ${remainingBalance > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                                    {remainingBalance > 0 ? 'Balance Due' : '✓ Fully Paid'}
                                </div>
                                <div className={`text-lg font-extrabold ${remainingBalance > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                                    {fmt(remainingBalance)}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Payment Dialog */}
            <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Record Payment</DialogTitle>
                        <DialogDescription>
                            {customerInfo.name} — Balance: {fmt(remainingBalance)}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        {/* Select credit if multiple unpaid */}
                        {unpaidCredits.length > 1 && (
                            <div className="space-y-1.5">
                                <Label className="text-sm">Apply to Credit</Label>
                                <Select
                                    value={selectedCreditId ? String(selectedCreditId) : ""}
                                    onValueChange={(v) => setSelectedCreditId(Number(v))}
                                >
                                    <SelectTrigger className="h-10">
                                        <SelectValue placeholder="Select credit" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {unpaidCredits.map((t) => (
                                            <SelectItem key={t.id} value={String(t.id)}>
                                                {t.orderNumber ? `Order #${t.orderNumber}` : `Credit #${t.id}`} — Balance: {fmt(t.balance)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label htmlFor="paymentAmount" className="text-sm">Amount (₱)</Label>
                            <Input
                                id="paymentAmount"
                                type="number"
                                placeholder="0.00"
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                className="h-10"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-sm">Method</Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Select method" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="card">Card</SelectItem>
                                    <SelectItem value="bank">Bank Transfer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsAddPaymentOpen(false)} size="sm">
                            Cancel
                        </Button>
                        <Button
                            className="bg-purple-600 hover:bg-purple-700"
                            disabled={!paymentAmount || !paymentMethod || !selectedCreditId || isSubmittingPayment}
                            onClick={handleSubmitPayment}
                            size="sm"
                        >
                            {isSubmittingPayment ? (
                                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                                <CheckCircle2 className="w-4 h-4 mr-1" />
                            )}
                            {isSubmittingPayment ? "Processing..." : "Record Payment"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
