"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/admin/layout/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Search,
    MoreVertical,
    ShoppingCart,
    Eye,
    Store,
    Filter,
    Clock,
    CheckCircle,
    XCircle,
    Truck,
    Package,
    DollarSign,
    Loader2,
    AlertCircle,
    RefreshCw,
} from "lucide-react"
import { orderService } from "@/services"

interface Order {
    id: number
    order_number?: string
    customer?: { name?: string; id: number }
    customer_id?: number
    vendor?: { name?: string }
    store?: { name?: string }
    ordered_at: string
    items?: any[]
    total?: number
    status: string
    payment_status?: string
}

const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(price)

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [cancellingId, setCancellingId] = useState<number | null>(null)

    const fetchOrders = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await orderService.getAll()
            const data = Array.isArray(res) ? res : (res as any).data || []
            setOrders(data)
        } catch (err: any) {
            console.error("Failed to load orders:", err)
            setError(err?.message || "Failed to load orders")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchOrders()
    }, [fetchOrders])

    const handleCancel = async (id: number) => {
        setCancellingId(id)
        try {
            await orderService.cancel(id)
            setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "cancelled" } : o))
        } catch (err: any) {
            console.error("Failed to cancel order:", err)
        } finally {
            setCancellingId(null)
        }
    }

    const filteredOrders = orders.filter((order) => {
        const orderNum = order.order_number || `#${order.id}`
        const customer = order.customer?.name || ""
        const matchesSearch =
            orderNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customer.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === "all" || order.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "pending":
                return (
                    <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                        <Clock className="w-3 h-3 mr-1" />Pending
                    </Badge>
                )
            case "processing":
                return (
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                        <Package className="w-3 h-3 mr-1" />Processing
                    </Badge>
                )
            case "shipped":
                return (
                    <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                        <Truck className="w-3 h-3 mr-1" />Shipped
                    </Badge>
                )
            case "delivered":
                return (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        <CheckCircle className="w-3 h-3 mr-1" />Delivered
                    </Badge>
                )
            case "cancelled":
                return (
                    <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                        <XCircle className="w-3 h-3 mr-1" />Cancelled
                    </Badge>
                )
            default:
                return <Badge variant="secondary" className="capitalize">{status}</Badge>
        }
    }

    const getPaymentBadge = (status?: string) => {
        switch (status) {
            case "paid": return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Paid</Badge>
            case "pending": return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Pending</Badge>
            case "refunded": return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Refunded</Badge>
            default: return <Badge variant="outline">{status || "—"}</Badge>
        }
    }

    const totalRevenue = orders
        .filter(o => o.payment_status === "paid")
        .reduce((sum, o) => sum + (o.total || 0), 0)

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
                    <Button onClick={fetchOrders} variant="outline">
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
                <h1 className="text-3xl font-bold tracking-tight">Orders Overview</h1>
                <p className="text-muted-foreground mt-2">
                    View and manage all orders across the platform from all vendors
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-5 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{orders.length}</div>
                        <p className="text-xs text-muted-foreground">All time orders</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatPrice(totalRevenue)}</div>
                        <p className="text-xs text-muted-foreground">From paid orders</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        <Clock className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {orders.filter(o => o.status === "pending").length}
                        </div>
                        <p className="text-xs text-muted-foreground">Awaiting action</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">In Transit</CardTitle>
                        <Truck className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {orders.filter(o => o.status === "shipped").length}
                        </div>
                        <p className="text-xs text-muted-foreground">Being delivered</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Delivered</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {orders.filter(o => o.status === "delivered").length}
                        </div>
                        <p className="text-xs text-muted-foreground">Completed orders</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Card */}
            <Card>
                <CardHeader>
                    <div>
                        <CardTitle>All Orders</CardTitle>
                        <CardDescription>
                            Browse and manage orders from all vendors on the platform
                        </CardDescription>
                    </div>

                    {/* Filters and Search */}
                    <div className="flex flex-wrap items-center gap-4 mt-4">
                        <div className="relative flex-1 min-w-[200px] max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by order number or customer..."
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
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="processing">Processing</SelectItem>
                                <SelectItem value="shipped">Shipped</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Vendor</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Payment</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredOrders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                        No orders found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredOrders.map((order) => {
                                    const orderNum = order.order_number || `#${order.id}`
                                    const customerName = order.customer?.name || `Customer #${order.customer_id || order.id}`
                                    const vendorName = order.store?.name || order.vendor?.name || "—"
                                    return (
                                        <TableRow key={order.id}>
                                            <TableCell className="font-medium">
                                                <code className="text-sm bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                                    {orderNum}
                                                </code>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-semibold">
                                                        {customerName.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <span>{customerName}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Store className="h-4 w-4 text-muted-foreground" />
                                                    {vendorName}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {order.ordered_at}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {order.items?.length ?? "—"} items
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {order.total != null ? formatPrice(order.total) : "—"}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                                            <TableCell>{getPaymentBadge(order.payment_status)}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" disabled={cancellingId === order.id}>
                                                            {cancellingId === order.id
                                                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                                                : <MoreVertical className="h-4 w-4" />
                                                            }
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                        {order.status === "pending" && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-red-600"
                                                                    onClick={() => handleCancel(order.id)}
                                                                >
                                                                    <XCircle className="mr-2 h-4 w-4" />
                                                                    Cancel Order
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
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
