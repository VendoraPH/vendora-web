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
    ChevronDown,
    ChevronUp,
} from "lucide-react"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
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
    dueDate?: string
    installmentPlan?: {
        frequency: 'weekly' | 'monthly' | 'custom'
        amount: number
        nextDue: string
    }
    payments: {
        id: number
        amount: number
        paymentDate: string
        method: 'cash' | 'card' | 'bank'
        notes?: string
        receivedBy?: string
    }[]
    items: {
        id: number
        name: string
        quantity: number
        unitPrice: number
        total: number
        date: string
        status: 'pending' | 'partial' | 'paid'
        paidAmount?: number
    }[]
    status: 'active' | 'overdue' | 'paid' | 'defaulted'
    createdAt: string
    orderNumber?: string
    lastPaymentDate?: string
    creditLimit?: number
}

interface GroupedCreditAccount {
    customerId: number
    customer: CreditAccount['customer']
    totalAmount: number
    paidAmount: number
    remainingBalance: number
    status: CreditAccount['status']
    credits: CreditAccount[]
}

interface CreditAccountCardsProps {
    groups: GroupedCreditAccount[]
    expandedAccounts: Set<number>
    onToggleExpanded: (customerId: number) => void
    onAddPayment: (account: CreditAccount) => void
}

// ---------------------------------------------------------------------------
// Progress Bar
// ---------------------------------------------------------------------------
function ProgressBar({ value, max, className = "" }: { value: number; max: number; className?: string }) {
    const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0

    return (
        <div className={`relative h-3 bg-gray-100 dark:bg-[#1a1a35] rounded-full overflow-hidden ${className}`}>
            <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out ${percentage === 100 ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' :
                    percentage > 0 ? 'bg-gradient-to-r from-purple-500 to-purple-600' : 'bg-gray-200'
                    }`}
                style={{ width: `${percentage}%` }}
            />
        </div>
    )
}

// ---------------------------------------------------------------------------
// Status Badge
// ---------------------------------------------------------------------------
function StatusBadge({ status }: { status: CreditAccount['status'] }) {
    const variants = {
        active: { className: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800", icon: Clock, text: "Active" },
        paid: { className: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800", icon: CheckCircle2, text: "Paid" },
        overdue: { className: "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800", icon: AlertCircle, text: "Overdue" },
        defaulted: { className: "bg-gray-100 dark:bg-gray-800/30 text-gray-700 dark:text-[#b4b4d0] border-gray-300 dark:border-gray-700", icon: XCircle, text: "Defaulted" },
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

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export function CreditAccountCards({
    groups,
    expandedAccounts,
    onToggleExpanded,
    onAddPayment,
}: CreditAccountCardsProps) {
    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })

    const formatDateTime = (dateStr: string) =>
        new Date(dateStr).toLocaleString('en-PH', {
            month: '2-digit', day: '2-digit', year: 'numeric',
            hour: 'numeric', minute: '2-digit', hour12: true,
        })

    if (groups.length === 0) {
        return (
            <div className="bg-white dark:bg-[#13132a] p-12 text-center rounded-xl border border-gray-100 dark:border-[#2d1b69] shadow-sm">
                <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 dark:bg-[#1a1a35] flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-gray-400 dark:text-[#9898b8]" />
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
            {groups.map((group) => {
                const isExpanded = expandedAccounts.has(group.customerId)
                const creditCount = group.credits.length

                return (
                    <div
                        key={group.customerId}
                        className="bg-white dark:bg-[#13132a] rounded-xl border border-gray-100 dark:border-[#2d1b69] shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                    >
                        {/* Customer Header */}
                        <div className="p-4 sm:p-5">
                            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                                {/* Customer Info */}
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/40 dark:to-purple-800/20 flex items-center justify-center text-purple-700 dark:text-purple-300 font-semibold text-lg shadow-sm flex-shrink-0">
                                        {group.customer.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-base font-semibold text-gray-900 dark:text-white">{group.customer.name}</h3>
                                            <StatusBadge status={group.status} />
                                        </div>
                                        {group.customer.phone && (
                                            <p className="text-sm text-gray-500 dark:text-[#b4b4d0] flex items-center gap-1 mt-0.5">
                                                <Phone className="w-3.5 h-3.5" />
                                                {group.customer.phone}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Amount Summary */}
                                <div className="flex items-center gap-4 sm:gap-6">
                                    <div className="text-center">
                                        <div className="text-xs text-gray-500 dark:text-[#b4b4d0]">Total</div>
                                        <div className="text-sm font-bold text-gray-900 dark:text-white">₱{group.totalAmount.toLocaleString()}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-gray-500 dark:text-[#b4b4d0]">Paid</div>
                                        <div className="text-sm font-bold text-emerald-600">₱{group.paidAmount.toLocaleString()}</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs text-gray-500 dark:text-[#b4b4d0]">Balance</div>
                                        <div className={`text-sm font-bold ${group.remainingBalance > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                                            ₱{group.remainingBalance.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-4">
                                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-[#b4b4d0] mb-1.5">
                                    <span>Payment Progress</span>
                                    <span className="font-medium">
                                        {group.totalAmount > 0 ? ((group.paidAmount / group.totalAmount) * 100).toFixed(0) : 0}%
                                    </span>
                                </div>
                                <ProgressBar value={group.paidAmount} max={group.totalAmount} />
                            </div>

                            {/* Expand Toggle */}
                            <button
                                onClick={() => onToggleExpanded(group.customerId)}
                                className="mt-4 w-full flex items-center justify-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium py-1.5"
                            >
                                {isExpanded ? (
                                    <>Hide Transactions <ChevronUp className="w-4 h-4" /></>
                                ) : (
                                    <>Show {creditCount} {creditCount === 1 ? 'Transaction' : 'Transactions'} <ChevronDown className="w-4 h-4" /></>
                                )}
                            </button>
                        </div>

                        {/* Expanded Transactions */}
                        {isExpanded && (
                            <div className="border-t border-gray-100 dark:border-[#2d1b69] bg-gray-50/50 dark:bg-[#0e0e22]">
                                <div className="p-4 sm:p-5 space-y-3">
                                    {group.credits.map((credit) => (
                                        <div
                                            key={credit.id}
                                            className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-[#2d1b69] bg-white dark:bg-[#13132a]"
                                        >
                                            {/* Transaction ID & Date */}
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-gray-800 dark:text-gray-200 text-sm">
                                                    {credit.orderNumber || `#${credit.id}`}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-[#9898b8]">
                                                    {formatDateTime(credit.createdAt)}
                                                </div>
                                            </div>

                                            {/* Amounts */}
                                            <div className="flex items-center gap-4 text-sm">
                                                <div className="text-center">
                                                    <div className="text-[10px] text-gray-400 dark:text-[#9898b8]">Total</div>
                                                    <div className="font-semibold text-gray-900 dark:text-white">₱{credit.totalAmount.toLocaleString()}</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-[10px] text-gray-400 dark:text-[#9898b8]">Paid</div>
                                                    <div className="font-medium text-emerald-600">₱{credit.paidAmount.toLocaleString()}</div>
                                                </div>
                                                <div className="text-center">
                                                    <div className="text-[10px] text-gray-400 dark:text-[#9898b8]">Balance</div>
                                                    <div className={`font-bold ${credit.remainingBalance > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                                                        ₱{credit.remainingBalance.toLocaleString()}
                                                    </div>
                                                </div>
                                                {credit.dueDate && (
                                                    <div className="text-center">
                                                        <div className="text-[10px] text-gray-400 dark:text-[#9898b8]">Due</div>
                                                        <div className="text-gray-600 dark:text-[#b4b4d0] text-xs">{formatDate(credit.dueDate)}</div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-2 sm:ml-2">
                                                <Link href={`/pos/credit-accounts/${credit.id}`}>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-8 border-gray-200 dark:border-[#2d1b69] hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 hover:border-purple-200"
                                                    >
                                                        <Eye className="h-3.5 w-3.5 mr-1" />
                                                        Details
                                                    </Button>
                                                </Link>
                                                {credit.remainingBalance > 0 && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => onAddPayment(credit)}
                                                        className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                                                    >
                                                        <Banknote className="h-3.5 w-3.5 mr-1" />
                                                        Pay
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
