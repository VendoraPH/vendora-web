"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/admin/layout/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
    Search,
    CreditCard,
    DollarSign,
    TrendingUp,
    CheckCircle,
    Clock,
    XCircle,
    Filter,
    Loader2,
    AlertCircle,
    RefreshCw,
} from "lucide-react"
import { paymentService, type ApiPayment, type PaymentSummary } from "@/services"

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value)

export default function PaymentsPage() {
    const [payments, setPayments] = useState<ApiPayment[]>([])
    const [summary, setSummary] = useState<PaymentSummary | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")

    const fetchData = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const [paymentsRes, summaryRes] = await Promise.allSettled([
                paymentService.getAll({ per_page: 100 }),
                paymentService.getSummary(),
            ])

            if (paymentsRes.status === "fulfilled") {
                const data = Array.isArray(paymentsRes.value)
                    ? paymentsRes.value
                    : (paymentsRes.value as any).data || []
                setPayments(data)
            }
            if (summaryRes.status === "fulfilled") {
                setSummary(summaryRes.value)
            }
        } catch (err: any) {
            console.error("Failed to load payments:", err)
            setError(err?.message || "Failed to load payments")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const filteredPayments = payments.filter((payment) => {
        const txnId = (payment as any).transaction_id || `#${payment.id}`
        const matchesSearch =
            txnId.toLowerCase().includes(searchQuery.toLowerCase()) ||
            String(payment.order_id || "").includes(searchQuery)
        const matchesStatus = statusFilter === "all" || payment.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "completed":
                return (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        <CheckCircle className="w-3 h-3 mr-1" />Completed
                    </Badge>
                )
            case "pending":
                return (
                    <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                        <Clock className="w-3 h-3 mr-1" />Pending
                    </Badge>
                )
            case "failed":
                return (
                    <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                        <XCircle className="w-3 h-3 mr-1" />Failed
                    </Badge>
                )
            default:
                return <Badge variant="secondary" className="capitalize">{status}</Badge>
        }
    }

    const totalRevenue = payments
        .filter(p => p.status === "completed")
        .reduce((sum, p) => sum + p.amount, 0)
    const completedCount = payments.filter(p => p.status === "completed").length
    const pendingCount = payments.filter(p => p.status === "pending").length

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                </div>
            </DashboardLayout>
        )
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                    <AlertCircle className="h-12 w-12 text-red-500" />
                    <p className="text-muted-foreground">{error}</p>
                    <Button onClick={fetchData} variant="outline">
                        <RefreshCw className="w-4 h-4 mr-2" />Retry
                    </Button>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
                <p className="text-muted-foreground mt-2">
                    View and manage all platform payment transactions
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {summary ? formatCurrency(summary.total_revenue ?? totalRevenue) : formatCurrency(totalRevenue)}
                        </div>
                        <p className="text-xs text-muted-foreground">Completed payments</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completedCount}</div>
                        <p className="text-xs text-muted-foreground">Successful payments</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingCount}</div>
                        <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                        <TrendingUp className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{payments.length}</div>
                        <p className="text-xs text-muted-foreground">All time</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Card */}
            <Card>
                <CardHeader>
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-purple-600" />
                            Transaction History
                        </CardTitle>
                        <CardDescription>
                            View and manage all payment transactions
                        </CardDescription>
                    </div>

                    {/* Filters and Search */}
                    <div className="flex flex-wrap items-center gap-4 mt-4">
                        <div className="relative flex-1 min-w-[200px] max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by transaction ID or order..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[150px]">
                                <Filter className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Transaction ID</TableHead>
                                <TableHead>Order</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredPayments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        No payments found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPayments.map((payment) => {
                                    const txnId = (payment as any).transaction_id || `#${payment.id}`
                                    return (
                                        <TableRow key={payment.id}>
                                            <TableCell className="font-medium">
                                                <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                                                    {txnId}
                                                </code>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                Order #{payment.order_id}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {formatCurrency(payment.amount)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {(payment.method || "—").replace("_", " ")}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{getStatusBadge(payment.status)}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {payment.paid_at || (payment as any).created_at || "—"}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </DashboardLayout>
    )
}
