"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/admin/layout/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
    Bell,
    AlertTriangle,
    CheckCircle,
    Info,
    XCircle,
    Settings,
    Trash2,
    MailOpen,
    Store,
    Users,
    ShoppingCart
} from "lucide-react"

// Mock data for notifications
const notifications = [
    {
        id: 1,
        type: "warning",
        title: "Low Stock Alert",
        message: "5 products across 3 vendors are running low on stock",
        time: "10 minutes ago",
        read: false,
        category: "inventory",
    },
    {
        id: 2,
        type: "success",
        title: "New Vendor Registered",
        message: "Fashion Hub has completed their registration and verification",
        time: "1 hour ago",
        read: false,
        category: "vendors",
    },
    {
        id: 3,
        type: "info",
        title: "Large Order Placed",
        message: "Order #ORD-2024-156 worth ₱45,000 has been placed",
        time: "2 hours ago",
        read: true,
        category: "orders",
    },
    {
        id: 4,
        type: "error",
        title: "Payment Failed",
        message: "Subscription payment for Electronics Plus has failed",
        time: "3 hours ago",
        read: false,
        category: "payments",
    },
    {
        id: 5,
        type: "info",
        title: "New User Registration Spike",
        message: "50 new users registered in the last 24 hours",
        time: "1 day ago",
        read: true,
        category: "users",
    },
    {
        id: 6,
        type: "success",
        title: "Monthly Report Ready",
        message: "Your January 2024 revenue report is ready for download",
        time: "1 day ago",
        read: true,
        category: "reports",
    },
]

const notificationSettings = [
    { id: "new_vendors", label: "New Vendor Registrations", enabled: true },
    { id: "low_stock", label: "Low Stock Alerts", enabled: true },
    { id: "large_orders", label: "Large Orders (>₱10,000)", enabled: true },
    { id: "payment_failed", label: "Failed Payments", enabled: true },
    { id: "user_milestones", label: "User Milestones", enabled: false },
    { id: "report_ready", label: "Report Generation Complete", enabled: true },
]

export default function NotificationsPage() {
    const [filter, setFilter] = useState("all")
    const [settings, setSettings] = useState(notificationSettings)

    const unreadCount = notifications.filter(n => !n.read).length

    const filteredNotifications = notifications.filter(n => {
        if (filter === "all") return true
        if (filter === "unread") return !n.read
        return n.category === filter
    })

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "warning":
                return <AlertTriangle className="h-5 w-5 text-yellow-600" />
            case "success":
                return <CheckCircle className="h-5 w-5 text-green-600" />
            case "error":
                return <XCircle className="h-5 w-5 text-red-600" />
            case "info":
            default:
                return <Info className="h-5 w-5 text-blue-600" />
        }
    }

    const getTypeBgColor = (type: string) => {
        switch (type) {
            case "warning":
                return "bg-yellow-100"
            case "success":
                return "bg-green-100"
            case "error":
                return "bg-red-100"
            case "info":
            default:
                return "bg-blue-100"
        }
    }

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case "vendors":
                return <Store className="h-4 w-4" />
            case "users":
                return <Users className="h-4 w-4" />
            case "orders":
                return <ShoppingCart className="h-4 w-4" />
            default:
                return <Bell className="h-4 w-4" />
        }
    }

    const toggleSetting = (id: string) => {
        setSettings(settings.map(s =>
            s.id === id ? { ...s, enabled: !s.enabled } : s
        ))
    }

    return (
        <DashboardLayout>
            {/* Page Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                    <p className="text-muted-foreground mt-2">
                        System alerts and important updates
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <Badge className="bg-purple-600">{unreadCount} unread</Badge>
                    )}
                    <Button variant="outline">
                        <MailOpen className="mr-2 h-4 w-4" />
                        Mark All Read
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Notifications List */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <Bell className="h-5 w-5 text-purple-600" />
                                    Recent Notifications
                                </CardTitle>
                                <div className="flex gap-2">
                                    {["all", "unread", "vendors", "orders"].map((f) => (
                                        <Button
                                            key={f}
                                            variant={filter === f ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setFilter(f)}
                                            className={filter === f ? "bg-purple-600 hover:bg-purple-700" : ""}
                                        >
                                            {f.charAt(0).toUpperCase() + f.slice(1)}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {filteredNotifications.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No notifications found
                                    </div>
                                ) : (
                                    filteredNotifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`flex items-start gap-4 p-4 rounded-lg transition-colors ${notification.read ? "bg-gray-50" : "bg-purple-50 border border-purple-200"
                                                }`}
                                        >
                                            <div className={`h-10 w-10 rounded-full ${getTypeBgColor(notification.type)} flex items-center justify-center flex-shrink-0`}>
                                                {getTypeIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className={`font-medium ${!notification.read ? "text-purple-900" : ""}`}>
                                                        {notification.title}
                                                    </p>
                                                    {!notification.read && (
                                                        <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">
                                                            New
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                                                <div className="flex items-center gap-4 mt-2">
                                                    <span className="text-xs text-muted-foreground">{notification.time}</span>
                                                    <Badge variant="outline" className="text-xs">
                                                        {getCategoryIcon(notification.category)}
                                                        <span className="ml-1 capitalize">{notification.category}</span>
                                                    </Badge>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-600">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Notification Settings */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5 text-purple-600" />
                                Notification Settings
                            </CardTitle>
                            <CardDescription>
                                Configure which notifications you receive
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {settings.map((setting) => (
                                    <div key={setting.id} className="flex items-center justify-between">
                                        <span className="text-sm">{setting.label}</span>
                                        <Switch
                                            checked={setting.enabled}
                                            onCheckedChange={() => toggleSetting(setting.id)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle className="text-lg">Quick Stats</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Total Notifications</span>
                                    <span className="font-medium">{notifications.length}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Unread</span>
                                    <span className="font-medium text-purple-600">{unreadCount}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Alerts</span>
                                    <span className="font-medium text-yellow-600">
                                        {notifications.filter(n => n.type === "warning" || n.type === "error").length}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    )
}
