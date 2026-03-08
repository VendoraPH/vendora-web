"use client"

import { DashboardLayout } from "@/components/admin/layout/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Users,
    Store,
    ShoppingCart,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react"

// Mock data for analytics
const kpiData = {
    totalRevenue: { value: 2453000, change: 12.5, trend: "up" },
    totalOrders: { value: 1842, change: 8.3, trend: "up" },
    activeVendors: { value: 45, change: 15.2, trend: "up" },
    totalUsers: { value: 3256, change: -2.1, trend: "down" },
}

const topVendors = [
    { name: "Tech Store", revenue: 452000, orders: 234, growth: 24.5 },
    { name: "Fashion Hub", revenue: 328000, orders: 189, growth: 18.2 },
    { name: "Food Market", revenue: 275000, orders: 456, growth: 12.8 },
    { name: "Electronics Plus", revenue: 198000, orders: 98, growth: 31.2 },
    { name: "Book Shop", revenue: 156000, orders: 312, growth: -5.4 },
]

const monthlyRevenue = [
    { month: "Jan", revenue: 185000, orders: 145 },
    { month: "Feb", revenue: 198000, orders: 156 },
    { month: "Mar", revenue: 220000, orders: 178 },
    { month: "Apr", revenue: 195000, orders: 162 },
    { month: "May", revenue: 245000, orders: 198 },
    { month: "Jun", revenue: 268000, orders: 215 },
]

export default function AnalyticsPage() {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
            maximumFractionDigits: 0,
        }).format(value)
    }

    const formatNumber = (value: number) => {
        return new Intl.NumberFormat("en-US").format(value)
    }

    return (
        <DashboardLayout>
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
                <p className="text-muted-foreground mt-2">
                    Platform-wide metrics and performance insights
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(kpiData.totalRevenue.value)}</div>
                        <div className="flex items-center mt-1">
                            {kpiData.totalRevenue.trend === "up" ? (
                                <>
                                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                                    <span className="text-sm text-green-500 font-medium">+{kpiData.totalRevenue.change}%</span>
                                </>
                            ) : (
                                <>
                                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                                    <span className="text-sm text-red-500 font-medium">{kpiData.totalRevenue.change}%</span>
                                </>
                            )}
                            <span className="text-xs text-muted-foreground ml-2">vs last month</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                        <ShoppingCart className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(kpiData.totalOrders.value)}</div>
                        <div className="flex items-center mt-1">
                            {kpiData.totalOrders.trend === "up" ? (
                                <>
                                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                                    <span className="text-sm text-green-500 font-medium">+{kpiData.totalOrders.change}%</span>
                                </>
                            ) : (
                                <>
                                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                                    <span className="text-sm text-red-500 font-medium">{kpiData.totalOrders.change}%</span>
                                </>
                            )}
                            <span className="text-xs text-muted-foreground ml-2">vs last month</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
                        <Store className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{kpiData.activeVendors.value}</div>
                        <div className="flex items-center mt-1">
                            {kpiData.activeVendors.trend === "up" ? (
                                <>
                                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                                    <span className="text-sm text-green-500 font-medium">+{kpiData.activeVendors.change}%</span>
                                </>
                            ) : (
                                <>
                                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                                    <span className="text-sm text-red-500 font-medium">{kpiData.activeVendors.change}%</span>
                                </>
                            )}
                            <span className="text-xs text-muted-foreground ml-2">vs last month</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatNumber(kpiData.totalUsers.value)}</div>
                        <div className="flex items-center mt-1">
                            {kpiData.totalUsers.trend === "up" ? (
                                <>
                                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                                    <span className="text-sm text-green-500 font-medium">+{kpiData.totalUsers.change}%</span>
                                </>
                            ) : (
                                <>
                                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                                    <span className="text-sm text-red-500 font-medium">{kpiData.totalUsers.change}%</span>
                                </>
                            )}
                            <span className="text-xs text-muted-foreground ml-2">vs last month</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid gap-6 md:grid-cols-2 mb-8">
                {/* Revenue Trend Chart Placeholder */}
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue Trend</CardTitle>
                        <CardDescription>Monthly revenue over the last 6 months</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            {/* Bar chart visualization */}
                            <div className="flex items-end justify-between h-full gap-4 pt-4">
                                {monthlyRevenue.map((data, index) => {
                                    const maxRevenue = Math.max(...monthlyRevenue.map(d => d.revenue))
                                    const height = (data.revenue / maxRevenue) * 100
                                    return (
                                        <div key={index} className="flex flex-col items-center flex-1">
                                            <div className="w-full flex flex-col items-center">
                                                <span className="text-xs text-muted-foreground mb-1">
                                                    {formatCurrency(data.revenue).replace("₱", "₱")}
                                                </span>
                                                <div
                                                    className="w-full bg-purple-500 rounded-t-md transition-all hover:bg-purple-600"
                                                    style={{ height: `${height * 1.5}px` }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium mt-2">{data.month}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Orders Trend Chart Placeholder */}
                <Card>
                    <CardHeader>
                        <CardTitle>Orders Trend</CardTitle>
                        <CardDescription>Monthly orders over the last 6 months</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            {/* Bar chart visualization */}
                            <div className="flex items-end justify-between h-full gap-4 pt-4">
                                {monthlyRevenue.map((data, index) => {
                                    const maxOrders = Math.max(...monthlyRevenue.map(d => d.orders))
                                    const height = (data.orders / maxOrders) * 100
                                    return (
                                        <div key={index} className="flex flex-col items-center flex-1">
                                            <div className="w-full flex flex-col items-center">
                                                <span className="text-xs text-muted-foreground mb-1">
                                                    {data.orders}
                                                </span>
                                                <div
                                                    className="w-full bg-blue-500 rounded-t-md transition-all hover:bg-blue-600"
                                                    style={{ height: `${height * 1.5}px` }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium mt-2">{data.month}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Top Vendors */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-purple-600" />
                        Top Performing Vendors
                    </CardTitle>
                    <CardDescription>Vendors ranked by revenue this month</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {topVendors.map((vendor, index) => (
                            <div key={vendor.name} className="flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-700 text-sm font-bold">
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium">{vendor.name}</span>
                                        <span className="font-bold">{formatCurrency(vendor.revenue)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                        <span>{vendor.orders} orders</span>
                                        <div className="flex items-center gap-1">
                                            {vendor.growth >= 0 ? (
                                                <>
                                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                                    <span className="text-green-500">+{vendor.growth}%</span>
                                                </>
                                            ) : (
                                                <>
                                                    <TrendingDown className="h-4 w-4 text-red-500" />
                                                    <span className="text-red-500">{vendor.growth}%</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {/* Progress bar */}
                                    <div className="mt-2 h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-purple-500 rounded-full"
                                            style={{ width: `${(vendor.revenue / (topVendors[0]?.revenue || 1)) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </DashboardLayout>
    )
}
