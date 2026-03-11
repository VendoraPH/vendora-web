"use client"

import { useState, useMemo, useEffect } from "react"
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
    Search,
    Plus,
    Users,
    TrendingUp,
    AlertCircle,
    Wallet,
    CheckCircle2,
    CreditCard,
    FileText,
    Banknote,
    RefreshCw,
    Loader2,
} from "lucide-react"
import { CreditAccountsDataTable } from "@/components/pos/CreditAccountsDataTable"
import { CreditAccountCards } from "@/components/pos/CreditAccountCards"
import { creditService } from "@/services"
import type { ApiCredit } from "@/services"
import Swal from "sweetalert2"
import { useOfflineData } from "@/hooks/use-offline-data"
import { StaleDataBanner } from "@/components/pos/StaleDataBanner"
import { getOnlineStatus } from "@/lib/sync-service"

// ---------------------------------------------------------------------------
// Types (kept identical to what DataTable + Cards expect)
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Dummy data — used when the API credits endpoint is unavailable
// ---------------------------------------------------------------------------
const DUMMY_CREDITS: CreditAccount[] = [
    {
        id: 1,
        customer: { id: 1, name: "Juan dela Cruz", phone: "09171234567", email: "juan@email.com", address: "123 Rizal St, Manila" },
        totalAmount: 5000, paidAmount: 2000, remainingBalance: 3000,
        status: "active", createdAt: "2026-02-01T08:00:00Z",
        payments: [], items: [],
    },
    {
        id: 2,
        customer: { id: 2, name: "Maria Santos", phone: "09281234567", email: "maria@email.com", address: "456 Mabini Ave, Quezon City" },
        totalAmount: 8500, paidAmount: 8500, remainingBalance: 0,
        status: "paid", createdAt: "2026-01-15T08:00:00Z",
        payments: [], items: [],
    },
    {
        id: 3,
        customer: { id: 3, name: "Pedro Reyes", phone: "09351234567", address: "789 Luna St, Cebu City" },
        totalAmount: 12000, paidAmount: 3000, remainingBalance: 9000,
        dueDate: "2026-03-01T00:00:00Z",
        status: "overdue", createdAt: "2026-01-10T08:00:00Z",
        payments: [], items: [],
    },
    {
        id: 4,
        customer: { id: 4, name: "Ana Gomez", phone: "09461234567", email: "ana@email.com" },
        totalAmount: 3500, paidAmount: 1000, remainingBalance: 2500,
        status: "active", createdAt: "2026-02-20T08:00:00Z",
        payments: [], items: [],
    },
]

// ---------------------------------------------------------------------------
// Map API credit → UI CreditAccount shape
// ---------------------------------------------------------------------------
function mapApiCredit(c: ApiCredit): CreditAccount {
    const status: CreditAccount["status"] =
        c.status === "active" || c.status === "overdue" || c.status === "paid" || c.status === "defaulted"
            ? c.status
            : "active"

    return {
        id: c.id,
        customer: {
            id: c.customer?.id ?? c.customer_id,
            name: c.customer?.name ?? `Customer #${c.customer_id}`,
            phone: c.customer?.phone ?? undefined,
            email: c.customer?.email ?? undefined,
            address: c.customer?.address ?? undefined,
        },
        totalAmount: Number(c.amount) || 0,
        paidAmount: Number(c.paid_amount) || 0,
        remainingBalance: Number(c.balance) || 0,
        creditLimit: c.credit_limit ? Number(c.credit_limit) : undefined,
        dueDate: c.due_date ?? undefined,
        payments: [],   // individual transactions not provided by list endpoint
        items: [],
        status,
        createdAt: c.created_at,
    }
}

// ---------------------------------------------------------------------------
// Progress Bar Component
// ---------------------------------------------------------------------------
function ProgressBar({ value, max }: { value: number; max: number }) {
    const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0

    return (
        <div className="relative h-3 bg-gray-100 dark:bg-[#1a1a35] rounded-full overflow-hidden">
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
// Custom hook: desktop detection
// ---------------------------------------------------------------------------
function useIsDesktop() {
    const [isDesktop, setIsDesktop] = useState(false)

    useEffect(() => {
        const checkIsDesktop = () => setIsDesktop(window.innerWidth >= 1024)
        checkIsDesktop()
        window.addEventListener('resize', checkIsDesktop)
        return () => window.removeEventListener('resize', checkIsDesktop)
    }, [])

    return isDesktop
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------
export default function CreditAccountsPage() {
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [selectedAccount, setSelectedAccount] = useState<CreditAccount | null>(null)
    const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false)
    const [paymentAmount, setPaymentAmount] = useState("")
    const [paymentMethod, setPaymentMethod] = useState("")
    const [paymentNotes, setPaymentNotes] = useState("")
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false)
    const [expandedAccounts, setExpandedAccounts] = useState<Set<number>>(new Set())

    const isDesktop = useIsDesktop()

    // ── Fetch via offline-first hook ──────────────────────────────────────
    const { data: rawAccounts, isLoading, isStale, lastSyncedAt, error, refresh } = useOfflineData<any[]>(
        "credit-accounts",
        async () => {
            const response = await creditService.getAll({ per_page: 200 })
            return Array.isArray(response) ? response : (response as any).data ?? []
        },
        { staleAfterMinutes: 5 }
    )
    const accounts = useMemo(() => {
        const mapped = (rawAccounts ?? []).map(mapApiCredit)
        return mapped.length > 0 ? mapped : DUMMY_CREDITS
    }, [rawAccounts])

    // ── Helpers ───────────────────────────────────────────────────────────
    const toggleExpanded = (accountId: number) => {
        setExpandedAccounts(prev => {
            const next = new Set(prev)
            if (next.has(accountId)) next.delete(accountId)
            else next.add(accountId)
            return next
        })
    }

    const filteredAccounts = useMemo(() => {
        return accounts.filter(account => {
            const matchesSearch =
                account.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                account.customer.phone?.includes(searchQuery) ||
                account.customer.email?.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesStatus = statusFilter === "all" || account.status === statusFilter
            return matchesSearch && matchesStatus
        })
    }, [accounts, searchQuery, statusFilter])

    const stats = useMemo(() => {
        const totalAccounts = accounts.length
        const activeAccounts = accounts.filter(a => a.status === 'active').length
        const overdueAccounts = accounts.filter(a => a.status === 'overdue').length
        const totalOutstanding = accounts.reduce((sum, a) => sum + a.remainingBalance, 0)
        return { totalAccounts, activeAccounts, overdueAccounts, totalOutstanding }
    }, [accounts])

    const handleAddPayment = (account: CreditAccount) => {
        setSelectedAccount(account)
        setPaymentAmount("")
        setPaymentMethod("")
        setPaymentNotes("")
        setIsAddPaymentOpen(true)
    }

    const handleSubmitPayment = async () => {
        if (!selectedAccount || !paymentAmount || !paymentMethod) return

        if (!getOnlineStatus()) {
            Swal.fire({ icon: "info", title: "Unavailable Offline", text: "Payments cannot be recorded while offline." })
            return
        }

        const amount = Math.round(parseFloat(paymentAmount))
        if (isNaN(amount) || amount <= 0) {
            Swal.fire({ icon: "error", title: "Invalid Amount", text: "Please enter a valid payment amount." })
            return
        }
        if (amount > selectedAccount.remainingBalance) {
            Swal.fire({ icon: "error", title: "Amount Too High", text: `Payment cannot exceed remaining balance of ₱${selectedAccount.remainingBalance.toLocaleString()}.` })
            return
        }

        setIsSubmittingPayment(true)
        try {
            // Map "bank" to "online" for API compatibility
            const method = paymentMethod === "bank" ? "online" : paymentMethod as "cash" | "card" | "online"
            await creditService.recordPayment(selectedAccount.id, { amount, method })

            Swal.fire({
                icon: "success",
                title: "Payment Recorded",
                text: `₱${amount.toLocaleString()} payment recorded for ${selectedAccount.customer.name}.`,
                timer: 2000,
                showConfirmButton: false,
            })

            setIsAddPaymentOpen(false)
            refresh() // Refresh list
        } catch (err: any) {
            console.error("Failed to record payment:", err)
            const message = err?.response?.data?.message || err?.message || "Failed to record payment."
            Swal.fire({ icon: "error", title: "Payment Failed", text: message })
        } finally {
            setIsSubmittingPayment(false)
        }
    }

    // ── Render ─────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            <StaleDataBanner isStale={isStale} lastSyncedAt={lastSyncedAt} />
            {/* Header */}
            <div className="relative pb-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                            Credit Accounts
                        </h1>
                        <p className="text-sm sm:text-base text-gray-500 dark:text-[#b4b4d0] mt-1 leading-relaxed">
                            Manage customer credit, track balances, and record payments
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={refresh}
                            className="border-gray-200 dark:border-[#2d1b69] hover:bg-gray-50 dark:hover:bg-[#1a1a35]"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                        {/* New Credit Account button hidden for now */}
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-purple-500/20 via-purple-500/40 to-purple-500/20" />
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div className="group relative bg-white dark:bg-[#13132a] p-4 sm:p-5 rounded-xl border border-gray-100 dark:border-[#2d1b69] shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 dark:from-purple-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-start justify-between gap-3">
                        <div>
                            <div className="text-xs sm:text-sm font-medium text-gray-500 dark:text-[#b4b4d0]">Total Accounts</div>
                            <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                {isLoading ? <span className="inline-block w-8 h-7 bg-gray-200 dark:bg-[#2d1b69] rounded animate-pulse" /> : stats.totalAccounts}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-[#9898b8] mt-1">All time</div>
                        </div>
                        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/40 dark:to-purple-900/20 text-purple-600 flex items-center justify-center shadow-sm">
                            <Users className="h-5 w-5" />
                        </div>
                    </div>
                </div>

                <div className="group relative bg-white dark:bg-[#13132a] p-4 sm:p-5 rounded-xl border border-gray-100 dark:border-[#2d1b69] shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 dark:from-blue-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-start justify-between gap-3">
                        <div>
                            <div className="text-xs sm:text-sm font-medium text-gray-500 dark:text-[#b4b4d0]">Active</div>
                            <div className="text-2xl sm:text-3xl font-bold text-blue-600 mt-1">
                                {isLoading ? <span className="inline-block w-8 h-7 bg-gray-200 dark:bg-[#2d1b69] rounded animate-pulse" /> : stats.activeAccounts}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-[#9898b8] mt-1">On track</div>
                        </div>
                        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-blue-900/20 text-blue-600 flex items-center justify-center shadow-sm">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                    </div>
                </div>

                <div className="group relative bg-white dark:bg-[#13132a] p-4 sm:p-5 rounded-xl border border-gray-100 dark:border-[#2d1b69] shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 dark:from-red-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-start justify-between gap-3">
                        <div>
                            <div className="text-xs sm:text-sm font-medium text-gray-500 dark:text-[#b4b4d0]">Overdue</div>
                            <div className="text-2xl sm:text-3xl font-bold text-red-600 mt-1">
                                {isLoading ? <span className="inline-block w-8 h-7 bg-gray-200 dark:bg-[#2d1b69] rounded animate-pulse" /> : stats.overdueAccounts}
                            </div>
                            <div className="text-xs text-red-400 mt-1">Needs attention</div>
                        </div>
                        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/40 dark:to-red-900/20 text-red-600 flex items-center justify-center shadow-sm">
                            <AlertCircle className="h-5 w-5" />
                        </div>
                    </div>
                </div>

                <div className="group relative bg-white dark:bg-[#13132a] p-4 sm:p-5 rounded-xl border border-gray-100 dark:border-[#2d1b69] shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 dark:from-orange-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-start justify-between gap-3">
                        <div>
                            <div className="text-xs sm:text-sm font-medium text-gray-500 dark:text-[#b4b4d0]">Outstanding</div>
                            <div className="text-xl sm:text-2xl font-bold text-orange-600 mt-1">
                                {isLoading
                                    ? <span className="inline-block w-20 h-7 bg-gray-200 dark:bg-[#2d1b69] rounded animate-pulse" />
                                    : `₱${stats.totalOutstanding.toLocaleString()}`}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-[#9898b8] mt-1">To collect</div>
                        </div>
                        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/40 dark:to-orange-900/20 text-orange-600 flex items-center justify-center shadow-sm">
                            <Wallet className="h-5 w-5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Error state */}
            {error && !isLoading && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="font-semibold text-sm">{error}</p>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={refresh}
                        className="border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30"
                    >
                        Retry
                    </Button>
                </div>
            )}

            {/* Search and Filters */}
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                <div className="flex-1 relative group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-[#9898b8] group-focus-within:text-purple-500 transition-colors" />
                    <Input
                        placeholder="Search by customer name, phone, or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-11 border-gray-200 dark:border-[#2d1b69] focus:border-purple-300 focus:ring-purple-200 transition-all"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] h-11 border-gray-200 dark:border-[#2d1b69]">
                        <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="overdue">Overdue</SelectItem>
                        <SelectItem value="defaulted">Defaulted</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Loading state */}
            {isLoading ? (
                <div className="flex items-center justify-center py-16 gap-3 text-gray-500 dark:text-[#b4b4d0]">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                    <span className="text-sm font-medium">Loading credit accounts…</span>
                </div>
            ) : (
                /* Responsive Layout */
                isDesktop ? (
                    <CreditAccountsDataTable
                        accounts={accounts}
                        searchQuery={searchQuery}
                        statusFilter={statusFilter}
                        onAddPayment={handleAddPayment}
                    />
                ) : (
                    <CreditAccountCards
                        accounts={filteredAccounts}
                        expandedAccounts={expandedAccounts}
                        onToggleExpanded={toggleExpanded}
                        onAddPayment={handleAddPayment}
                    />
                )
            )}

            {/* Add Payment Dialog */}
            <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">Record Payment</DialogTitle>
                        <DialogDescription className="text-gray-500 dark:text-[#b4b4d0]">
                            Add a payment for {selectedAccount?.customer.name}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 py-4">
                        {/* Balance Summary */}
                        <div className="p-4 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-[#13132a] rounded-xl border border-purple-100 dark:border-[#2d1b69]">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm text-gray-600 dark:text-[#b4b4d0]">Remaining Balance</span>
                                <span className="text-2xl font-bold text-purple-600">
                                    ₱{selectedAccount?.remainingBalance.toLocaleString()}
                                </span>
                            </div>
                            <ProgressBar
                                value={selectedAccount?.paidAmount || 0}
                                max={selectedAccount?.totalAmount || 1}
                            />
                            <div className="flex justify-between text-xs text-gray-500 dark:text-[#b4b4d0] mt-2">
                                <span>Paid: ₱{selectedAccount?.paidAmount.toLocaleString()}</span>
                                <span>Total: ₱{selectedAccount?.totalAmount.toLocaleString()}</span>
                            </div>
                        </div>

                        {/* Pending Items Preview */}
                        {selectedAccount && selectedAccount.items.filter(i => i.status !== 'paid').length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-700 dark:text-[#e0e0f0]">Unpaid Items</Label>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                    {selectedAccount.items.filter(i => i.status !== 'paid').map(item => (
                                        <div key={item.id} className="flex items-center justify-between text-xs p-2 bg-gray-50 dark:bg-[#1a1a35] rounded-lg">
                                            <span className="text-gray-700 dark:text-[#e0e0f0] truncate flex-1">{item.name}</span>
                                            <span className="text-orange-600 font-medium ml-2">
                                                ₱{(item.total - (item.paidAmount || 0)).toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Payment Amount */}
                        <div className="space-y-2">
                            <Label htmlFor="paymentAmount" className="text-sm font-medium text-gray-700 dark:text-[#e0e0f0]">
                                Payment Amount (₱)
                            </Label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-[#9898b8] font-bold text-sm flex items-center justify-center">₱</span>
                                <Input
                                    id="paymentAmount"
                                    type="number"
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    className="pl-9 h-11 text-lg font-semibold border-gray-200 dark:border-[#2d1b69] focus:border-purple-300 focus:ring-purple-200"
                                />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-[#b4b4d0]">
                                Enter the amount to apply to the remaining balance
                            </p>
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700 dark:text-[#e0e0f0]">Payment Method</Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger className="h-11 border-gray-200 dark:border-[#2d1b69]">
                                    <SelectValue placeholder="Select payment method" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">
                                        <div className="flex items-center gap-2">
                                            <Banknote className="w-4 h-4" />
                                            Cash
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="card">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="w-4 h-4" />
                                            Card
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="bank">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4" />
                                            Bank Transfer
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label htmlFor="paymentNotes" className="text-sm font-medium text-gray-700 dark:text-[#e0e0f0]">
                                Notes <span className="text-gray-400 dark:text-[#9898b8] font-normal">(Optional)</span>
                            </Label>
                            <Input
                                id="paymentNotes"
                                placeholder="Add any notes about this payment..."
                                value={paymentNotes}
                                onChange={(e) => setPaymentNotes(e.target.value)}
                                className="h-11 border-gray-200 dark:border-[#2d1b69] focus:border-purple-300 focus:ring-purple-200"
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setIsAddPaymentOpen(false)}
                            className="border-gray-200 hover:bg-gray-50 dark:bg-[#1a1a35]"
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all duration-200 hover:shadow-xl hover:shadow-purple-200 hover:-translate-y-0.5"
                            disabled={!paymentAmount || !paymentMethod || isSubmittingPayment}
                            onClick={handleSubmitPayment}
                        >
                            {isSubmittingPayment ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                            )}
                            {isSubmittingPayment ? "Processing..." : "Record Payment"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
