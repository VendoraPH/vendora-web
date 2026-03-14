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
    Plus,
    CheckCircle2,
    Loader2,
    BookOpen,
    TrendingDown,
    TrendingUp,
    ShoppingBag,
} from "lucide-react"
import { creditService } from "@/services"
import type { ApiCredit } from "@/services"
import Swal from "sweetalert2"
import { getOnlineStatus } from "@/lib/sync-service"

// Types for UI display
interface PurchasedItem {
    id: number
    name: string
    quantity: number
    unitPrice: number
    total: number
}

interface CreditAccount {
    id: number
    customer: {
        id: number
        name: string
        phone?: string
        email?: string
        address?: string
        memberSince?: string
    }
    totalAmount: number
    paidAmount: number
    remainingBalance: number
    creditLimit?: number
    dueDate?: string
    status: 'active' | 'overdue' | 'paid' | 'defaulted'
    createdAt: string
    notes?: string
    items: PurchasedItem[]
    orderNumber?: string
}

// ---------------------------------------------------------------------------
// Ledger entry type
// ---------------------------------------------------------------------------
interface LedgerEntry {
    date: string
    description: string
    debit: number | null
    credit: number | null
    balance: number
}

function buildLedgerEntries(account: CreditAccount, apiLedger?: ApiCredit['ledger_entries']): LedgerEntry[] {
    // Use real ledger entries from API when available
    if (apiLedger && apiLedger.length > 0) {
        let runningBalance = 0
        return apiLedger.map((entry) => {
            const amount = (Number(entry.amount) || 0) / 100
            const isDebit = entry.type === 'credit'
            if (isDebit) {
                runningBalance += amount
            } else {
                runningBalance -= amount
            }
            return {
                date: entry.created_at,
                description: entry.description || (isDebit ? 'Credit Issued' : 'Payment Received'),
                debit: isDebit ? amount : null,
                credit: isDebit ? null : amount,
                balance: runningBalance,
            }
        })
    }

    // Fallback: build synthetic entries from aggregated data
    const entries: LedgerEntry[] = []
    entries.push({
        date: account.createdAt,
        description: "Credit Issued",
        debit: account.totalAmount,
        credit: null,
        balance: account.totalAmount,
    })
    if (account.paidAmount > 0) {
        entries.push({
            date: new Date().toISOString(),
            description: "Payment Received",
            debit: null,
            credit: account.paidAmount,
            balance: account.remainingBalance,
        })
    }
    return entries
}

function mapApiCredit(c: ApiCredit): CreditAccount {
    const status: CreditAccount["status"] =
        c.status === "active" || c.status === "overdue" || c.status === "paid" || c.status === "defaulted"
            ? c.status
            : "active"

    const cc = c.credit_customer
    const fullName = c.customer?.name?.trim()
        ?? (cc ? [cc.first_name, cc.middle_name, cc.last_name].filter(Boolean).join(" ") : null)
        ?? `Customer #${c.customer_id}`

    const phone = c.customer?.phone ?? cc?.contact_number ?? undefined
    const address = c.customer?.address ?? cc?.address ?? undefined

    // Map order items if present
    const items: PurchasedItem[] = (c.order?.items ?? []).map((item, idx) => {
        const name = item.product_name ?? item.product?.name ?? `Product #${item.product_id ?? idx + 1}`

        // Use product catalog price as the authoritative source (in PHP pesos).
        // item.price may be stored in centavos by the backend, so prefer
        // item.product.price (catalog price in pesos) when available.
        const rawPrice =
            item.product?.price ??
            item.unit_price ??
            item.sale_price ??
            item.price ??
            0
        const unitPrice = (Number(rawPrice) || 0) / 100

        const qty = Number(item.quantity) || 1
        return {
            id: item.id,
            name,
            quantity: qty,
            unitPrice,
            total: (Number(item.total) || 0) / 100 || unitPrice * qty,
        }
    })

    return {
        id: c.id,
        customer: {
            id: c.customer?.id ?? c.customer_id,
            name: fullName,
            phone,
            email: c.customer?.email ?? undefined,
            address,
        },
        totalAmount: (Number(c.amount) || 0) / 100,
        paidAmount: (Number(c.paid_amount) || 0) / 100,
        remainingBalance: (Number(c.balance) || 0) / 100,
        creditLimit: c.credit_limit ? Number(c.credit_limit) / 100 : undefined,
        dueDate: c.due_date ?? undefined,
        status,
        createdAt: c.created_at,
        notes: c.notes ?? undefined,
        items,
        orderNumber: c.order?.order_number ?? undefined,
    }
}

export default function CreditAccountDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const resolvedParams = use(params)
    const accountId = resolvedParams.id

    const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false)
    const [paymentAmount, setPaymentAmount] = useState("")
    const [paymentMethod, setPaymentMethod] = useState("")
    const [paymentNotes, setPaymentNotes] = useState("")
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false)
    const [activeTab, setActiveTab] = useState<'overview' | 'ledger' | 'payments'>('overview')

    const [rawAccount, setRawAccount] = useState<ApiCredit | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const refresh = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        try {
            const data = await creditService.getById(accountId)
            setRawAccount(data)
        } catch (err: unknown) {
            const e = err as { message?: string }
            setError(e?.message || "Failed to load credit account")
        } finally {
            setIsLoading(false)
        }
    }, [accountId])

    useEffect(() => { refresh() }, [refresh])

    const account = rawAccount ? mapApiCredit(rawAccount) : null

    const handleSubmitPayment = async () => {
        if (!account || !paymentAmount || !paymentMethod) return

        if (!getOnlineStatus()) {
            Swal.fire({ icon: "info", title: "Unavailable Offline", text: "Payments cannot be recorded while offline." })
            return
        }

        const amountPesos = parseFloat(paymentAmount)
        if (isNaN(amountPesos) || amountPesos <= 0) {
            Swal.fire({ icon: "error", title: "Invalid Amount", text: "Please enter a valid payment amount." })
            return
        }
        if (amountPesos > account.remainingBalance) {
            Swal.fire({ icon: "error", title: "Amount Too High", text: `Payment cannot exceed remaining balance of ₱${account.remainingBalance.toLocaleString()}.` })
            return
        }

        const amountCents = Math.round(amountPesos * 100)

        setIsSubmittingPayment(true)
        try {
            const method = paymentMethod === "bank" ? "online" : paymentMethod as "cash" | "card" | "online"
            await creditService.recordPayment(account.id, { amount: amountCents, method })

            Swal.fire({
                icon: "success",
                title: "Payment Recorded",
                text: `₱${amountPesos.toLocaleString()} payment recorded for ${account.customer.name}.`,
                timer: 2000,
                showConfirmButton: false,
            })

            setIsAddPaymentOpen(false)
            refresh() // Refresh data
        } catch (err: any) {
            console.error("Failed to record payment:", err)
            const message = err?.response?.data?.message || err?.message || "Failed to record payment."
            Swal.fire({ icon: "error", title: "Payment Failed", text: message })
        } finally {
            setIsSubmittingPayment(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh] gap-3 text-gray-500 dark:text-[#b4b4d0]">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                <span className="text-sm font-medium">Loading credit account...</span>
            </div>
        )
    }

    if (!account) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <AlertCircle className="w-12 h-12 text-gray-300 dark:text-[#9898b8] mb-3" />
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                    {error ? "Error Loading Account" : "Account Not Found"}
                </h2>
                <p className="text-sm text-gray-500 dark:text-[#b4b4d0] mb-4">
                    {error || "This credit account doesn't exist."}
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

    const getStatusBadge = (status: CreditAccount['status']) => {
        const variants = {
            active: { className: "bg-blue-50 text-blue-700", text: "Active" },
            paid: { className: "bg-emerald-50 text-emerald-700", text: "Paid" },
            overdue: { className: "bg-red-50 text-red-700", text: "Overdue" },
            defaulted: { className: "bg-gray-100 text-gray-700 dark:text-[#e0e0f0]", text: "Defaulted" },
        }
        const config = variants[status]
        return (
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${config.className}`}>
                {config.text}
            </span>
        )
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    return (
        <div className="space-y-4 pb-6">
            {/* Compact Header */}
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
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-bold text-gray-900 dark:text-white">{account.customer.name}</h1>
                            {getStatusBadge(account.status)}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-[#b4b4d0]">{account.customer.phone}</p>
                    </div>
                </div>
                {account.remainingBalance > 0 && (
                    <Button
                        size="sm"
                        onClick={() => setIsAddPaymentOpen(true)}
                        className="bg-purple-600 hover:bg-purple-700 h-8"
                    >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add Payment
                    </Button>
                )}
            </div>

            {/* Compact Summary */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-3 bg-white dark:bg-[#13132a] rounded-lg border border-gray-100 dark:border-[#2d1b69] text-sm">
                <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-[#b4b4d0]">Total:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">₱{account.totalAmount.toLocaleString()}</span>
                </div>
                <div className="w-px h-4 bg-gray-200 dark:bg-[#2d1b69] hidden sm:block" />
                <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-[#b4b4d0]">Paid:</span>
                    <span className="font-semibold text-emerald-600">₱{account.paidAmount.toLocaleString()}</span>
                </div>
                <div className="w-px h-4 bg-gray-200 dark:bg-[#2d1b69] hidden sm:block" />
                <div className="flex items-center gap-2">
                    <span className="text-gray-500 dark:text-[#b4b4d0]">Balance:</span>
                    <span className={`font-bold ${account.remainingBalance > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                        ₱{account.remainingBalance.toLocaleString()}
                    </span>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-[#2d1b69]">
                <nav className="flex gap-4">
                    {[
                        { id: 'overview', label: 'Overview', icon: User },
                        { id: 'ledger', label: 'Ledger', icon: BookOpen },
                        { id: 'payments', label: 'Payments', icon: History },
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
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-4">
                        <div className="bg-white dark:bg-[#13132a] rounded-lg border border-gray-100 dark:border-[#2d1b69] p-4">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Customer Information</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center gap-2 text-gray-600 dark:text-[#b4b4d0]">
                                    <User className="w-4 h-4 text-gray-400 dark:text-[#9898b8]" />
                                    <span>{account.customer.name}</span>
                                </div>
                                {account.customer.phone && (
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-[#b4b4d0]">
                                        <Phone className="w-4 h-4 text-gray-400 dark:text-[#9898b8]" />
                                        <span>{account.customer.phone}</span>
                                    </div>
                                )}
                                {account.customer.email && (
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-[#b4b4d0]">
                                        <Mail className="w-4 h-4 text-gray-400 dark:text-[#9898b8]" />
                                        <span>{account.customer.email}</span>
                                    </div>
                                )}
                                {account.customer.address && (
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-[#b4b4d0] sm:col-span-2">
                                        <MapPin className="w-4 h-4 text-gray-400 dark:text-[#9898b8] flex-shrink-0" />
                                        <span>{account.customer.address}</span>
                                    </div>
                                )}
                                {account.customer.memberSince && (
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-[#b4b4d0]">
                                        <Calendar className="w-4 h-4 text-gray-400 dark:text-[#9898b8]" />
                                        <span>Member since {formatDate(account.customer.memberSince)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-[#13132a] rounded-lg border border-gray-100 dark:border-[#2d1b69] p-4">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Credit Details</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500 dark:text-[#b4b4d0] text-xs">Total Credit</span>
                                    <div className="text-lg font-bold text-gray-900 dark:text-white">₱{account.totalAmount.toLocaleString()}</div>
                                </div>
                                <div>
                                    <span className="text-gray-500 dark:text-[#b4b4d0] text-xs">Total Paid</span>
                                    <div className="text-lg font-bold text-emerald-600">₱{account.paidAmount.toLocaleString()}</div>
                                </div>
                                <div>
                                    <span className="text-gray-500 dark:text-[#b4b4d0] text-xs">Remaining</span>
                                    <div className={`text-lg font-bold ${account.remainingBalance > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                                        ₱{account.remainingBalance.toLocaleString()}
                                    </div>
                                </div>
                                {account.creditLimit && (
                                    <div>
                                        <span className="text-gray-500 dark:text-[#b4b4d0] text-xs">Credit Limit</span>
                                        <div className="text-lg font-bold text-gray-900 dark:text-white">₱{account.creditLimit.toLocaleString()}</div>
                                    </div>
                                )}
                                {account.dueDate && (
                                    <div>
                                        <span className="text-gray-500 dark:text-[#b4b4d0] text-xs">Due Date</span>
                                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(account.dueDate)}</div>
                                    </div>
                                )}
                                <div>
                                    <span className="text-gray-500 dark:text-[#b4b4d0] text-xs">Created</span>
                                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(account.createdAt)}</div>
                                </div>
                            </div>
                            {account.notes && (
                                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-[#2d1b69]">
                                    <span className="text-gray-500 dark:text-[#b4b4d0] text-xs">Notes</span>
                                    <p className="text-sm text-gray-700 dark:text-[#e0e0f0] mt-1">{account.notes}</p>
                                </div>
                            )}
                        </div>

                        {/* Purchased Items */}
                        <div className="bg-white dark:bg-[#13132a] rounded-lg border border-gray-100 dark:border-[#2d1b69] p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <ShoppingBag className="w-4 h-4 text-purple-500" />
                                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                                    Purchased Items
                                    {account.orderNumber && (
                                        <span className="ml-2 text-xs font-normal text-gray-400 dark:text-[#9898b8]">
                                            Order #{account.orderNumber}
                                        </span>
                                    )}
                                </h3>
                            </div>
                            {account.items.length > 0 ? (
                                <div className="space-y-0 divide-y divide-gray-50 dark:divide-[#2d1b69]">
                                    {account.items.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between py-2.5 text-sm">
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
                                    <div className="flex items-center justify-between pt-2.5 text-sm font-bold">
                                        <span className="text-gray-700 dark:text-[#e0e0f0]">Total</span>
                                        <span className="text-purple-600">₱{account.totalAmount.toLocaleString()}</span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-gray-400 dark:text-[#9898b8] text-center py-4">
                                    Item details not available
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Ledger Tab */}
                {activeTab === 'ledger' && (() => {
                    const entries = buildLedgerEntries(account, rawAccount?.ledger_entries)
                    const fmt = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
                    return (
                        <div className="space-y-4">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-white dark:bg-[#13132a] rounded-lg border border-gray-100 dark:border-[#2d1b69] p-3 text-center">
                                    <div className="flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-[#b4b4d0] mb-1">
                                        <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                                        Total Debit
                                    </div>
                                    <div className="text-base font-bold text-red-600">{fmt(account.totalAmount)}</div>
                                </div>
                                <div className="bg-white dark:bg-[#13132a] rounded-lg border border-gray-100 dark:border-[#2d1b69] p-3 text-center">
                                    <div className="flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-[#b4b4d0] mb-1">
                                        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                                        Total Credit
                                    </div>
                                    <div className="text-base font-bold text-emerald-600">{fmt(account.paidAmount)}</div>
                                </div>
                                <div className="bg-white dark:bg-[#13132a] rounded-lg border border-gray-100 dark:border-[#2d1b69] p-3 text-center">
                                    <div className="flex items-center justify-center gap-1 text-xs text-gray-500 dark:text-[#b4b4d0] mb-1">
                                        <Banknote className="w-3.5 h-3.5 text-orange-500" />
                                        Balance Due
                                    </div>
                                    <div className={`text-base font-bold ${account.remainingBalance > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                                        {fmt(account.remainingBalance)}
                                    </div>
                                </div>
                            </div>

                            {/* Ledger Table — Desktop */}
                            <div className="hidden sm:block bg-white dark:bg-[#13132a] rounded-lg border border-gray-100 dark:border-[#2d1b69] overflow-hidden">
                                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-[#2d1b69]">
                                    <BookOpen className="w-4 h-4 text-purple-500" />
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                        Account Ledger — {account.customer.name}
                                    </span>
                                </div>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-[#1a1a35] border-b border-gray-100 dark:border-[#2d1b69]">
                                            <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 dark:text-[#b4b4d0] uppercase tracking-wide">Date</th>
                                            <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 dark:text-[#b4b4d0] uppercase tracking-wide">Description</th>
                                            <th className="text-right py-2.5 px-4 text-xs font-semibold text-red-500 uppercase tracking-wide">Debit (₱)</th>
                                            <th className="text-right py-2.5 px-4 text-xs font-semibold text-emerald-600 uppercase tracking-wide">Credit (₱)</th>
                                            <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 dark:text-[#b4b4d0] uppercase tracking-wide">Balance (₱)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {entries.map((entry, i) => (
                                            <tr key={i} className="border-b border-gray-50 dark:border-[#2d1b69]/50 hover:bg-gray-50 dark:hover:bg-[#1a1a35] transition-colors">
                                                <td className="py-3 px-4 text-gray-600 dark:text-[#b4b4d0] whitespace-nowrap">{fmtDate(entry.date)}</td>
                                                <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">{entry.description}</td>
                                                <td className="py-3 px-4 text-right font-semibold text-red-600">
                                                    {entry.debit !== null ? fmt(entry.debit) : <span className="text-gray-300 dark:text-gray-600">—</span>}
                                                </td>
                                                <td className="py-3 px-4 text-right font-semibold text-emerald-600">
                                                    {entry.credit !== null ? fmt(entry.credit) : <span className="text-gray-300 dark:text-gray-600">—</span>}
                                                </td>
                                                <td className={`py-3 px-4 text-right font-bold ${entry.balance > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                                                    {fmt(entry.balance)}
                                                </td>
                                            </tr>
                                        ))}
                                        {/* Balance Due footer row */}
                                        <tr className={`border-t-2 ${account.remainingBalance > 0 ? 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/10' : 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10'}`}>
                                            <td colSpan={4} className={`py-3 px-4 text-sm font-bold ${account.remainingBalance > 0 ? 'text-orange-700 dark:text-orange-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                                                {account.remainingBalance > 0 ? 'Balance Due' : '✓ Fully Paid'}
                                            </td>
                                            <td className={`py-3 px-4 text-right text-base font-extrabold ${account.remainingBalance > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                                                {fmt(account.remainingBalance)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Ledger Cards — Mobile */}
                            <div className="sm:hidden space-y-2">
                                {entries.map((entry, i) => (
                                    <div key={i} className="bg-white dark:bg-[#13132a] rounded-lg border border-gray-100 dark:border-[#2d1b69] p-3">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">{entry.description}</span>
                                            <span className="text-xs text-gray-400 dark:text-[#9898b8]">{fmtDate(entry.date)}</span>
                                        </div>
                                        <div className="flex gap-4 text-xs mt-1">
                                            <span className="text-red-500">DR: {entry.debit !== null ? fmt(entry.debit) : '—'}</span>
                                            <span className="text-emerald-600">CR: {entry.credit !== null ? fmt(entry.credit) : '—'}</span>
                                            <span className={`font-semibold ml-auto ${entry.balance > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                                                Bal: {fmt(entry.balance)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                <div className={`rounded-lg border-2 p-3 text-center ${account.remainingBalance > 0 ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/10' : 'border-emerald-300 bg-emerald-50 dark:bg-emerald-900/10'}`}>
                                    <div className={`text-xs font-semibold mb-0.5 ${account.remainingBalance > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                                        {account.remainingBalance > 0 ? 'Balance Due' : '✓ Fully Paid'}
                                    </div>
                                    <div className={`text-lg font-extrabold ${account.remainingBalance > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                                        {fmt(account.remainingBalance)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                })()}

                {/* Payments Tab */}
                {activeTab === 'payments' && (() => {
                    const payments = rawAccount?.payments ?? []
                    const fmt = (n: number) => `₱${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
                    const fmtTime = (d: string) => new Date(d).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })
                    const methodLabel = (m: string) => {
                        const labels: Record<string, string> = { cash: 'Cash', card: 'Card', online: 'Bank Transfer' }
                        return labels[m] ?? m
                    }

                    if (payments.length === 0) {
                        return (
                            <div className="bg-white dark:bg-[#13132a] p-8 text-center rounded-lg border border-dashed border-gray-200 dark:border-[#2d1b69]">
                                <Banknote className="w-10 h-10 text-gray-300 dark:text-[#9898b8] mx-auto mb-2" />
                                <p className="text-sm text-gray-500 dark:text-[#b4b4d0]">No payments recorded yet.</p>
                            </div>
                        )
                    }

                    return (
                        <div className="space-y-3">
                            {/* Desktop table */}
                            <div className="hidden sm:block bg-white dark:bg-[#13132a] rounded-lg border border-gray-100 dark:border-[#2d1b69] overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-[#1a1a35] border-b border-gray-100 dark:border-[#2d1b69]">
                                            <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 dark:text-[#b4b4d0] uppercase tracking-wide">Date</th>
                                            <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 dark:text-[#b4b4d0] uppercase tracking-wide">Reference</th>
                                            <th className="text-left py-2.5 px-4 text-xs font-semibold text-gray-500 dark:text-[#b4b4d0] uppercase tracking-wide">Method</th>
                                            <th className="text-right py-2.5 px-4 text-xs font-semibold text-gray-500 dark:text-[#b4b4d0] uppercase tracking-wide">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map((p) => (
                                            <tr key={p.id} className="border-b border-gray-50 dark:border-[#2d1b69]/50 hover:bg-gray-50 dark:hover:bg-[#1a1a35] transition-colors">
                                                <td className="py-3 px-4 text-gray-600 dark:text-[#b4b4d0] whitespace-nowrap">
                                                    {fmtDate(p.paid_at)}
                                                    <span className="text-xs text-gray-400 dark:text-[#9898b8] ml-1">{fmtTime(p.paid_at)}</span>
                                                </td>
                                                <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">{p.payment_number}</td>
                                                <td className="py-3 px-4 text-gray-600 dark:text-[#b4b4d0]">{methodLabel(p.method)}</td>
                                                <td className="py-3 px-4 text-right font-semibold text-emerald-600">{fmt(p.amount / 100)}</td>
                                            </tr>
                                        ))}
                                        <tr className="border-t-2 border-gray-200 dark:border-[#2d1b69] bg-gray-50 dark:bg-[#1a1a35]">
                                            <td colSpan={3} className="py-3 px-4 text-sm font-bold text-gray-700 dark:text-[#e0e0f0]">Total Paid</td>
                                            <td className="py-3 px-4 text-right text-base font-extrabold text-emerald-600">
                                                {fmt(payments.reduce((sum, p) => sum + p.amount, 0) / 100)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile cards */}
                            <div className="sm:hidden space-y-2">
                                {payments.map((p) => (
                                    <div key={p.id} className="bg-white dark:bg-[#13132a] rounded-lg border border-gray-100 dark:border-[#2d1b69] p-3">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-sm font-medium text-gray-900 dark:text-white">{p.payment_number}</span>
                                            <span className="text-xs text-gray-400 dark:text-[#9898b8]">{fmtDate(p.paid_at)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs mt-1">
                                            <span className="text-gray-500 dark:text-[#b4b4d0]">{methodLabel(p.method)}</span>
                                            <span className="font-semibold text-emerald-600">{fmt(p.amount / 100)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                })()}
            </div>

            {/* Add Payment Dialog */}
            <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Record Payment</DialogTitle>
                        <DialogDescription>
                            Balance: ₱{account.remainingBalance.toLocaleString()}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
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

                        <div className="space-y-1.5">
                            <Label htmlFor="paymentNotes" className="text-sm">Notes (optional)</Label>
                            <Input
                                id="paymentNotes"
                                placeholder="Add notes..."
                                value={paymentNotes}
                                onChange={(e) => setPaymentNotes(e.target.value)}
                                className="h-10"
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button variant="outline" onClick={() => setIsAddPaymentOpen(false)} size="sm">
                            Cancel
                        </Button>
                        <Button
                            className="bg-purple-600 hover:bg-purple-700"
                            disabled={!paymentAmount || !paymentMethod || isSubmittingPayment}
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
