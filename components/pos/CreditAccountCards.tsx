"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    Phone,
    Banknote,
    Eye,
    Package,
    ChevronDown,
    ChevronUp,
} from "lucide-react"

// Types
interface Payment {
    id: number
    amount: number
    paymentDate: string
    method: 'cash' | 'card' | 'bank'
    notes?: string
    receivedBy?: string
}

interface PurchasedItem {
    id: number
    name: string
    quantity: number
    unitPrice: number
    total: number
    date: string
    status: 'pending' | 'partial' | 'paid'
    paidAmount?: number
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
    installmentPlan?: {
        frequency: 'weekly' | 'monthly' | 'custom'
        amount: number
        nextDue: string
    }
    payments: Payment[]
    items: PurchasedItem[]
    status: 'active' | 'overdue' | 'paid' | 'defaulted'
    createdAt: string
    lastPaymentDate?: string
}

interface CreditAccountCardsProps {
    accounts: CreditAccount[]
    expandedAccounts: Set<number>
    onToggleExpanded: (accountId: number) => void
    onAddPayment: (account: CreditAccount) => void
}

// Progress Bar Component
function ProgressBar({ value, max, className = "", showPercent = true }: { value: number; max: number; className?: string; showPercent?: boolean }) {
    const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0

    return (
        <div className={`relative h-3 bg-gray-100 rounded-full overflow-hidden ${className}`}>
            <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out ${percentage === 100 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' :
                    percentage > 0 ? 'bg-gradient-to-r from-purple-500 to-purple-600' : 'bg-gray-200'
                    }`}
                style={{ width: `${percentage}%` }}
            />
            {showPercent && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-semibold text-gray-600 dark:text-[#b4b4d0] mix-blend-multiply">
                        {percentage.toFixed(0)}%
                    </span>
                </div>
            )}
        </div>
    )
}

// Item Status Badge Component
function ItemStatusBadge({ status, paidAmount, total }: { status: 'pending' | 'partial' | 'paid'; paidAmount?: number; total: number }) {
    const variants = {
        pending: {
            bg: "bg-amber-50",
            text: "text-amber-700",
            border: "border-amber-200",
            icon: Clock,
            label: "Pending"
        },
        partial: {
            bg: "bg-blue-50",
            text: "text-blue-700",
            border: "border-blue-200",
            icon: null,
            label: `₱${paidAmount?.toLocaleString()} / ₱${total.toLocaleString()}`
        },
        paid: {
            bg: "bg-emerald-50",
            text: "text-emerald-700",
            border: "border-emerald-200",
            icon: CheckCircle2,
            label: "Paid"
        },
    }

    const config = variants[status]
    const Icon = config.icon

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full border ${config.bg} ${config.text} ${config.border}`}>
            {Icon && <Icon className="w-3 h-3" />}
            {config.label}
        </span>
    )
}

// Status Badge Component
function StatusBadge({ status }: { status: CreditAccount['status'] }) {
    const variants = {
        active: { className: "bg-blue-50 text-blue-700 border-blue-200", icon: Clock, text: "Active" },
        paid: { className: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2, text: "Paid" },
        overdue: { className: "bg-red-50 text-red-700 border-red-200", icon: AlertCircle, text: "Overdue" },
        defaulted: { className: "bg-gray-100 text-gray-700 border-gray-300", icon: XCircle, text: "Defaulted" },
    }

    const config = variants[status]
    const Icon = config.icon

    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${config.className}`}>
            <Icon className="w-3.5 h-3.5" />
            {config.text}
        </span>
    )
}

export function CreditAccountCards({
    accounts,
    expandedAccounts,
    onToggleExpanded,
    onAddPayment,
}: CreditAccountCardsProps) {
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-PH', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    if (accounts.length === 0) {
        return (
            <div className="bg-white dark:bg-[#13132a] p-12 text-center rounded-xl border border-gray-100 shadow-sm">
                <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <Package className="w-8 h-8 text-gray-400 dark:text-[#9898b8]" />
                </div>
                <p className="text-gray-500 dark:text-[#b4b4d0] font-medium">No credit accounts found</p>
                <p className="text-gray-400 dark:text-[#9898b8] text-sm mt-1">
                    Try a different search term or create a new credit account
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {accounts.map((account) => {
                const isExpanded = expandedAccounts.has(account.id)
                const paidItems = account.items.filter(i => i.status === 'paid').length
                const partialItems = account.items.filter(i => i.status === 'partial').length
                const pendingItems = account.items.filter(i => i.status === 'pending').length

                return (
                    <div
                        key={account.id}
                        className="bg-white dark:bg-[#13132a] rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                    >
                        {/* Account Header */}
                        <div className="p-4 sm:p-5">
                            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                                {/* Customer Info */}
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center text-purple-700 font-semibold text-lg shadow-sm flex-shrink-0">
                                        {account.customer.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{account.customer.name}</h3>
                                            <StatusBadge status={account.status} />
                                        </div>
                                        {account.customer.phone && (
                                            <p className="text-sm text-gray-500 dark:text-[#b4b4d0] flex items-center gap-1 mt-0.5">
                                                <Phone className="w-3.5 h-3.5" />
                                                {account.customer.phone}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Amount Summary */}
                                <div className="flex items-center gap-4 sm:gap-6">
                                    <div className="text-center">
                                        <div className="text-xs text-gray-500 dark:text-[#b4b4d0]">Total</div>
                                        <div className="text-sm font-bold text-gray-900 dark:text-white">₱{account.totalAmount.toLocaleString()}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-gray-500 dark:text-[#b4b4d0]">Paid</div>
                                        <div className="text-sm font-bold text-emerald-600">₱{account.paidAmount.toLocaleString()}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-gray-500 dark:text-[#b4b4d0]">Balance</div>
                                        <div className={`text-sm font-bold ${account.remainingBalance > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                                            ₱{account.remainingBalance.toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 sm:ml-4">
                                    <Link href={`/pos/credit-accounts/${account.id}`}>
                                        <Button size="sm" variant="outline" className="h-9 border-gray-200 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200">
                                            <Eye className="h-4 w-4 mr-1.5" />
                                            Details
                                        </Button>
                                    </Link>
                                    {account.remainingBalance > 0 && (
                                        <Button
                                            size="sm"
                                            onClick={() => onAddPayment(account)}
                                            className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
                                        >
                                            <Banknote className="h-4 w-4 mr-1.5" />
                                            Pay
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-4">
                                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-[#b4b4d0] mb-1.5">
                                    <span>Payment Progress</span>
                                    <span className="font-medium">{((account.paidAmount / account.totalAmount) * 100).toFixed(0)}%</span>
                                </div>
                                <ProgressBar value={account.paidAmount} max={account.totalAmount} />
                            </div>

                            {/* Item Summary Pills */}
                            <div className="flex items-center gap-2 mt-4 flex-wrap">
                                <span className="text-xs text-gray-500 dark:text-[#b4b4d0] mr-1">Items:</span>
                                {paidItems > 0 && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        <CheckCircle2 className="w-3 h-3" />
                                        {paidItems} Paid
                                    </span>
                                )}
                                {partialItems > 0 && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                        <Package className="w-3 h-3" />
                                        {partialItems} Partial
                                    </span>
                                )}
                                {pendingItems > 0 && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                        <Clock className="w-3 h-3" />
                                        {pendingItems} Pending
                                    </span>
                                )}
                                <button
                                    onClick={() => onToggleExpanded(account.id)}
                                    className="ml-auto text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                                >
                                    {isExpanded ? (
                                        <>Hide Items <ChevronUp className="w-4 h-4" /></>
                                    ) : (
                                        <>Show Items <ChevronDown className="w-4 h-4" /></>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Expanded Items List */}
                        {isExpanded && (
                            <div className="border-t border-gray-100 bg-gray-50/50">
                                <div className="p-4 sm:p-5">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                        <Package className="w-4 h-4 text-purple-600" />
                                        Purchased Items
                                    </h4>
                                    <div className="space-y-2">
                                        {account.items.map((item) => (
                                            <div
                                                key={item.id}
                                                className={`
                                                    flex items-center justify-between p-3 rounded-lg border transition-all
                                                    ${item.status === 'paid'
                                                        ? 'bg-emerald-50/50 border-emerald-100'
                                                        : item.status === 'partial'
                                                            ? 'bg-blue-50/50 border-blue-100'
                                                            : 'bg-white border-gray-100'
                                                    }
                                                `}
                                            >
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className={`
                                                        w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                                                        ${item.status === 'paid'
                                                            ? 'bg-emerald-100 text-emerald-600'
                                                            : item.status === 'partial'
                                                                ? 'bg-blue-100 text-blue-600'
                                                                : 'bg-gray-100 text-gray-500'
                                                        }
                                                    `}>
                                                        {item.status === 'paid' ? (
                                                            <CheckCircle2 className="w-4 h-4" />
                                                        ) : item.status === 'partial' ? (
                                                            <Package className="w-4 h-4" />
                                                        ) : (
                                                            <Clock className="w-4 h-4" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</div>
                                                        <div className="text-xs text-gray-500 dark:text-[#b4b4d0]">
                                                            {item.quantity} × ₱{item.unitPrice.toLocaleString()} • {formatDate(item.date)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                                                    <div className="text-right">
                                                        <div className="text-sm font-semibold text-gray-900 dark:text-white">₱{item.total.toLocaleString()}</div>
                                                        {item.status === 'partial' && item.paidAmount !== undefined && (
                                                            <div className="text-xs text-blue-600">
                                                                Paid: ₱{item.paidAmount.toLocaleString()}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <ItemStatusBadge status={item.status} paidAmount={item.paidAmount} total={item.total} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Items Summary */}
                                    <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between">
                                        <span className="text-sm text-gray-600 dark:text-[#b4b4d0]">Total ({account.items.length} items)</span>
                                        <div className="text-right">
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">₱{account.totalAmount.toLocaleString()}</span>
                                            {account.remainingBalance > 0 && (
                                                <span className="text-xs text-orange-600 ml-2">
                                                    (₱{account.remainingBalance.toLocaleString()} remaining)
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
