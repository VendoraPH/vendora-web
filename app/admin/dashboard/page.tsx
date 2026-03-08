"use client"

import { DashboardLayout } from "@/components/admin/layout/DashboardLayout"
import { StatsCard } from "@/components/admin/dashboard/StatsCard"
import { RevenueChart } from "@/components/admin/dashboard/RevenueChart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Users,
  Store,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
} from "lucide-react"

export default function AdminDashboardPage() {
  return (
    <DashboardLayout>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here&apos;s what&apos;s happening with your platform today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatsCard
          title="Total Revenue"
          value="$45,231"
          change="+20.1% from last month"
          changeType="positive"
          icon={DollarSign}
          iconColor="bg-green-500"
        />
        <StatsCard
          title="Active Vendors"
          value="23"
          change="+3 new this week"
          changeType="positive"
          icon={Store}
          iconColor="bg-blue-500"
        />
        <StatsCard
          title="Total Orders"
          value="1,234"
          change="+12.5% from last month"
          changeType="positive"
          icon={ShoppingCart}
          iconColor="bg-purple-500"
        />
        <StatsCard
          title="Active Users"
          value="573"
          change="-2.4% from last week"
          changeType="negative"
          icon={Users}
          iconColor="bg-orange-500"
        />
      </div>

      {/* Charts and Tables Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mb-8">
        {/* Revenue Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>
              Monthly revenue for the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <RevenueChart />
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest platform activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  title: "New vendor registered",
                  description: "Tech Store submitted for approval",
                  time: "2 minutes ago",
                  icon: Store,
                  iconColor: "bg-blue-100 text-blue-600",
                },
                {
                  title: "Payment received",
                  description: "$299.00 from Fashion Hub",
                  time: "1 hour ago",
                  icon: DollarSign,
                  iconColor: "bg-green-100 text-green-600",
                },
                {
                  title: "New order placed",
                  description: "Order #1234 from Customer A",
                  time: "3 hours ago",
                  icon: ShoppingCart,
                  iconColor: "bg-purple-100 text-purple-600",
                },
                {
                  title: "User registered",
                  description: "New user: john@example.com",
                  time: "5 hours ago",
                  icon: Users,
                  iconColor: "bg-orange-100 text-orange-600",
                },
              ].map((activity, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${activity.iconColor}`}>
                    <activity.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Vendors & Top Products */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        {/* Recent Vendors */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Vendors</CardTitle>
              <CardDescription>Latest vendor registrations</CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              View All
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Tech Store", email: "tech@store.com", status: "Pending" },
                { name: "Fashion Hub", email: "info@fashion.com", status: "Active" },
                { name: "Food Market", email: "hello@food.com", status: "Active" },
                { name: "Book Shop", email: "books@shop.com", status: "Pending" },
              ].map((vendor, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                      {vendor.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{vendor.name}</p>
                      <p className="text-xs text-muted-foreground">{vendor.email}</p>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${vendor.status === "Active"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                      }`}
                  >
                    {vendor.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Performing */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Top Performing</CardTitle>
              <CardDescription>Vendors by revenue</CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              View All
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Fashion Hub", revenue: "$12,345", growth: "+24%", trend: "up" },
                { name: "Tech Store", revenue: "$9,876", growth: "+18%", trend: "up" },
                { name: "Food Market", revenue: "$7,654", growth: "+12%", trend: "up" },
                { name: "Book Shop", revenue: "$5,432", growth: "-5%", trend: "down" },
              ].map((vendor, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{vendor.name}</p>
                      <p className="text-xs text-muted-foreground">{vendor.revenue}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {vendor.trend === "up" ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <span
                      className={`text-xs font-medium ${vendor.trend === "up" ? "text-green-600" : "text-red-600"
                        }`}
                    >
                      {vendor.growth}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
