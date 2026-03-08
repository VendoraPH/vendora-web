"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/admin/layout/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    FileText,
    Download,
    Calendar,
    BarChart3,
    Users,
    Store,
    ShoppingCart,
    DollarSign,
    Clock
} from "lucide-react"

// Mock data for reports
const reportTypes = [
    {
        id: "revenue",
        name: "Revenue Report",
        description: "Detailed breakdown of platform revenue by vendor, category, and time period",
        icon: DollarSign,
        color: "text-green-600",
        bgColor: "bg-green-100",
        lastGenerated: "2024-01-15",
    },
    {
        id: "vendors",
        name: "Vendor Performance",
        description: "Analytics on vendor sales, growth, and customer satisfaction",
        icon: Store,
        color: "text-blue-600",
        bgColor: "bg-blue-100",
        lastGenerated: "2024-01-14",
    },
    {
        id: "orders",
        name: "Orders Report",
        description: "Summary of all orders including status, fulfillment times, and trends",
        icon: ShoppingCart,
        color: "text-purple-600",
        bgColor: "bg-purple-100",
        lastGenerated: "2024-01-15",
    },
    {
        id: "users",
        name: "User Analytics",
        description: "User registration trends, activity levels, and demographics",
        icon: Users,
        color: "text-orange-600",
        bgColor: "bg-orange-100",
        lastGenerated: "2024-01-13",
    },
]

const recentReports = [
    {
        id: 1,
        name: "Monthly Revenue Report - January 2024",
        type: "revenue",
        generatedAt: "2024-01-15 14:30",
        status: "ready",
        size: "2.4 MB",
    },
    {
        id: 2,
        name: "Vendor Performance Q4 2023",
        type: "vendors",
        generatedAt: "2024-01-14 09:15",
        status: "ready",
        size: "1.8 MB",
    },
    {
        id: 3,
        name: "Weekly Orders Summary",
        type: "orders",
        generatedAt: "2024-01-15 08:00",
        status: "ready",
        size: "856 KB",
    },
    {
        id: 4,
        name: "User Growth Analysis",
        type: "users",
        generatedAt: "2024-01-13 16:45",
        status: "processing",
        size: "-",
    },
]

export default function ReportsPage() {
    const [selectedPeriod, setSelectedPeriod] = useState("monthly")

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "ready":
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Ready</Badge>
            case "processing":
                return (
                    <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                        <Clock className="w-3 h-3 mr-1 animate-spin" />
                        Processing
                    </Badge>
                )
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    return (
        <DashboardLayout>
            {/* Page Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
                    <p className="text-muted-foreground mt-2">
                        Generate and download platform reports
                    </p>
                </div>
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="w-[180px]">
                        <Calendar className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Time Period" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Report Types */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                {reportTypes.map((report) => {
                    const Icon = report.icon
                    return (
                        <Card key={report.id} className="hover:shadow-md transition-shadow cursor-pointer">
                            <CardHeader className="pb-3">
                                <div className={`h-12 w-12 rounded-lg ${report.bgColor} flex items-center justify-center mb-3`}>
                                    <Icon className={`h-6 w-6 ${report.color}`} />
                                </div>
                                <CardTitle className="text-lg">{report.name}</CardTitle>
                                <CardDescription className="text-sm">{report.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">
                                        Last: {report.lastGenerated}
                                    </span>
                                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                                        <BarChart3 className="mr-2 h-4 w-4" />
                                        Generate
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Recent Reports */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-purple-600" />
                                Recent Reports
                            </CardTitle>
                            <CardDescription>
                                Previously generated reports available for download
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {recentReports.map((report) => (
                            <div
                                key={report.id}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                        <FileText className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{report.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Generated: {report.generatedAt} • {report.size}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {getStatusBadge(report.status)}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={report.status !== "ready"}
                                    >
                                        <Download className="mr-2 h-4 w-4" />
                                        Download
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </DashboardLayout>
    )
}
