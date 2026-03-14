"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    getFilteredRowModel,
    useReactTable,
    SortingState,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Eye,
    CheckCircle2,
    XCircle,
    Clock,
    AlertCircle,
    Banknote,
    Phone,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
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
    primaryCreditId?: number
}

interface CreditAccountsDataTableProps {
    accounts: CreditAccount[]
    searchQuery: string
    statusFilter: string
    onAddPayment: (account: CreditAccount) => void
}

// Status Badge component
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

// Progress Bar component
function ProgressBar({ value, max }: { value: number; max: number }) {
    const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0

    return (
        <div className="relative h-2 w-20 bg-gray-100 dark:bg-[#1a1a35] rounded-full overflow-hidden">
            <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out ${percentage === 100 ? 'bg-emerald-500' : percentage > 0 ? 'bg-purple-500' : 'bg-gray-200'
                    }`}
                style={{ width: `${percentage}%` }}
            />
        </div>
    )
}

export function CreditAccountsDataTable({
    accounts,
    searchQuery,
    statusFilter,
    onAddPayment,
}: CreditAccountsDataTableProps) {
    const [sorting, setSorting] = useState<SortingState>([])

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-PH', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    // Filter accounts based on search and status
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

    // Define table columns
    const columns: ColumnDef<CreditAccount>[] = useMemo(() => [
        {
            accessorKey: "customer",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="h-8 px-2 -ml-2 font-semibold text-gray-700 dark:text-[#b4b4d0] hover:bg-purple-50 dark:hover:bg-purple-900/20"
                >
                    Customer
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => {
                const customer = row.original.customer
                return (
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/40 dark:to-purple-800/20 flex items-center justify-center text-purple-700 dark:text-purple-300 font-semibold text-sm shadow-sm flex-shrink-0">
                            {customer.name.charAt(0)}
                        </div>
                        <div>
                            <div className="font-medium text-gray-900 dark:text-white">{customer.name}</div>
                            {customer.phone && (
                                <div className="text-xs text-gray-500 dark:text-[#b4b4d0] flex items-center gap-1">
                                    <Phone className="w-3 h-3" />
                                    {customer.phone}
                                </div>
                            )}
                        </div>
                    </div>
                )
            },
            sortingFn: (rowA, rowB) => {
                return rowA.original.customer.name.localeCompare(rowB.original.customer.name)
            },
        },
        {
            accessorKey: "status",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="h-8 px-2 -ml-2 font-semibold text-gray-700 dark:text-[#b4b4d0] hover:bg-purple-50 dark:hover:bg-purple-900/20"
                >
                    Status
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
        },
        {
            accessorKey: "totalAmount",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="h-8 px-2 -ml-2 font-semibold text-gray-700 dark:text-[#b4b4d0] hover:bg-purple-50 dark:hover:bg-purple-900/20"
                >
                    Total
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <span className="font-semibold text-gray-900 dark:text-white">
                    ₱{row.original.totalAmount.toLocaleString()}
                </span>
            ),
        },
        {
            accessorKey: "paidAmount",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="h-8 px-2 -ml-2 font-semibold text-gray-700 dark:text-[#b4b4d0] hover:bg-purple-50 dark:hover:bg-purple-900/20"
                >
                    Paid
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <span className="font-medium text-emerald-600">
                        ₱{row.original.paidAmount.toLocaleString()}
                    </span>
                    <ProgressBar value={row.original.paidAmount} max={row.original.totalAmount} />
                </div>
            ),
        },
        {
            accessorKey: "remainingBalance",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="h-8 px-2 -ml-2 font-semibold text-gray-700 dark:text-[#b4b4d0] hover:bg-purple-50 dark:hover:bg-purple-900/20"
                >
                    Balance
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <span className={`font-bold ${row.original.remainingBalance > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
                    ₱{row.original.remainingBalance.toLocaleString()}
                </span>
            ),
        },
        {
            accessorKey: "dueDate",
            header: ({ column }) => (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    className="h-8 px-2 -ml-2 font-semibold text-gray-700 dark:text-[#b4b4d0] hover:bg-purple-50 dark:hover:bg-purple-900/20"
                >
                    Due Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            ),
            cell: ({ row }) => (
                <span className="text-gray-600 dark:text-[#b4b4d0]">
                    {row.original.dueDate ? formatDate(row.original.dueDate) : '-'}
                </span>
            ),
        },
        {
            id: "actions",
            header: () => <span className="font-semibold text-gray-700 dark:text-[#b4b4d0]">Actions</span>,
            cell: ({ row }) => (
                <div className="flex items-center gap-2">
                    <Link href={`/pos/credit-accounts/${row.original.id}`}>
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 border-gray-200 dark:border-[#2d1b69] hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:text-purple-700 hover:border-purple-200"
                        >
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            Details
                        </Button>
                    </Link>
                    {row.original.remainingBalance > 0 && (
                        <Button
                            size="sm"
                            onClick={() => onAddPayment(row.original)}
                            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            <Banknote className="h-3.5 w-3.5 mr-1" />
                            Pay
                        </Button>
                    )}
                </div>
            ),
        },
    ], [onAddPayment])

    const table = useReactTable({
        data: filteredAccounts,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        state: {
            sorting,
        },
        initialState: {
            pagination: {
                pageSize: 10,
            },
        },
    })

    return (
        <div className="space-y-4">
            {/* Table */}
            <div className="bg-white dark:bg-[#13132a] rounded-xl border border-gray-100 dark:border-[#2d1b69] shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id} className="bg-gray-50/80 dark:bg-[#1a1a35] border-b border-gray-100 dark:border-[#2d1b69]">
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id} className="py-3 px-4">
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row, index) => (
                                <TableRow
                                    key={row.id}
                                    className={`${index % 2 === 0 ? 'bg-white dark:bg-[#13132a]' : 'bg-gray-50/30 dark:bg-[#1a1a35]/50'} hover:bg-purple-50/30 dark:hover:bg-purple-900/20 transition-colors`}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className="py-3 px-4">
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-32 text-center text-gray-500 dark:text-[#b4b4d0]"
                                >
                                    No credit accounts found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-[#b4b4d0]">
                    <span>Show</span>
                    <Select
                        value={String(table.getState().pagination.pageSize)}
                        onValueChange={(value) => table.setPageSize(Number(value))}
                    >
                        <SelectTrigger className="h-8 w-[70px] border-gray-200 dark:border-[#2d1b69]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[10, 25, 50].map((pageSize) => (
                                <SelectItem key={pageSize} value={String(pageSize)}>
                                    {pageSize}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <span>entries</span>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-[#b4b4d0]">
                        Page {table.getState().pagination.pageIndex + 1} of{" "}
                        {table.getPageCount() || 1}
                    </span>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 border-gray-200 dark:border-[#2d1b69]"
                            onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 border-gray-200 dark:border-[#2d1b69]"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 border-gray-200 dark:border-[#2d1b69]"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 border-gray-200 dark:border-[#2d1b69]"
                            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                            disabled={!table.getCanNextPage()}
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
