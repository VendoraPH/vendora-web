"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Megaphone,
  Mail,
  MessageSquare,
  Tag,
  Users,
  TrendingUp,
  Plus
} from "lucide-react"

export default function MarketingPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Marketing and Ads</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-[#b4b4d0] mt-0.5 sm:mt-1">Promote your business and engage customers</p>
        </div>
        <Button className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Marketing Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-white dark:bg-[#13132a] p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0]">Active Campaigns</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-1">8</p>
            </div>
            <div className="bg-purple-100 p-2 sm:p-3 rounded-lg hidden sm:block">
              <Megaphone className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#13132a] p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0]">Total Reach</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-1">12.4K</p>
            </div>
            <div className="bg-blue-100 p-2 sm:p-3 rounded-lg hidden sm:block">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#13132a] p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0]">Click Rate</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-1">3.8%</p>
            </div>
            <div className="bg-green-100 p-2 sm:p-3 rounded-lg hidden sm:block">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#13132a] p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0]">Conversions</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-1">142</p>
            </div>
            <div className="bg-orange-100 p-2 sm:p-3 rounded-lg hidden sm:block">
              <Tag className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Marketing Channels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        {/* Email Marketing */}
        <div className="bg-white dark:bg-[#13132a] p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Email Marketing</h3>
            <Mail className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0] mb-3 sm:mb-4">Send newsletters and promotional emails to customers</p>
          <div className="space-y-2 mb-3 sm:mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-[#b4b4d0]">Subscribers</span>
              <span className="font-semibold">2,456</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-[#b4b4d0]">Open Rate</span>
              <span className="font-semibold text-green-600">24.5%</span>
            </div>
          </div>
          <Button className="w-full bg-purple-600 hover:bg-purple-700">Create Email</Button>
        </div>

        {/* SMS Marketing */}
        <div className="bg-white dark:bg-[#13132a] p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">SMS Marketing</h3>
            <MessageSquare className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0] mb-3 sm:mb-4">Send text messages and promotions to customers</p>
          <div className="space-y-2 mb-3 sm:mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-[#b4b4d0]">Recipients</span>
              <span className="font-semibold">1,842</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-[#b4b4d0]">Delivery Rate</span>
              <span className="font-semibold text-green-600">96.2%</span>
            </div>
          </div>
          <Button className="w-full" variant="outline">Send SMS</Button>
        </div>

        {/* Promotions & Discounts */}
        <div className="bg-white dark:bg-[#13132a] p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm hover:shadow-md transition-shadow sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Promotions</h3>
            <Tag className="h-5 w-5 text-orange-600" />
          </div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0] mb-3 sm:mb-4">Create discount codes and special offers</p>
          <div className="space-y-2 mb-3 sm:mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-[#b4b4d0]">Active Promos</span>
              <span className="font-semibold">5</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-[#b4b4d0]">Total Redemptions</span>
              <span className="font-semibold text-green-600">342</span>
            </div>
          </div>
          <Button className="w-full" variant="outline">Create Promo</Button>
        </div>
      </div>

      {/* Active Campaigns */}
      <div className="bg-white dark:bg-[#13132a] rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Active Campaigns</h3>
        <div className="space-y-3 sm:space-y-4">
          {[
            { name: "Summer Sale 2026", type: "Email", status: "active", reach: 2456, clicks: 312 },
            { name: "New Customer Welcome", type: "SMS", status: "active", reach: 145, clicks: 67 },
            { name: "Weekend Flash Sale", type: "Promotion", status: "active", reach: 1842, clicks: 521 },
            { name: "Loyalty Rewards", type: "Email", status: "scheduled", reach: 0, clicks: 0 },
          ].map((campaign, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-[#1a1a35] rounded-lg">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex-shrink-0">
                  {campaign.type === "Email" && <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />}
                  {campaign.type === "SMS" && <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />}
                  {campaign.type === "Promotion" && <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{campaign.name}</div>
                  <div className="text-xs text-gray-600 dark:text-[#b4b4d0] mt-0.5 sm:mt-1">
                    {campaign.reach > 0 ? `${campaign.reach} reached • ${campaign.clicks} clicks` : "Not started"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                {campaign.status === "active" && (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">Active</Badge>
                )}
                {campaign.status === "scheduled" && (
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-xs">Scheduled</Badge>
                )}
                <Button size="sm" variant="ghost" className="hidden sm:inline-flex">View</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
