"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  HelpCircle,
  Search,
  Book,
  MessageCircle,
  Mail,
  Phone,
  FileText,
  Video,
  ExternalLink
} from "lucide-react"

export default function HelpPage() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Help and Support</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-[#b4b4d0] mt-1 sm:mt-2">Get assistance and find answers to your questions</p>
      </div>

      {/* Search */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-[#9898b8]" />
          <Input
            placeholder="Search for help articles, guides, or FAQs..."
            className="pl-12 py-5 sm:py-6 text-sm sm:text-base"
          />
        </div>
      </div>

      {/* Quick Help Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        {[
          { icon: Book, color: "bg-purple-100", iconColor: "text-purple-600", title: "Documentation", desc: "Browse comprehensive guides and tutorials" },
          { icon: Video, color: "bg-blue-100", iconColor: "text-blue-600", title: "Video Tutorials", desc: "Watch step-by-step video guides" },
          { icon: MessageCircle, color: "bg-green-100", iconColor: "text-green-600", title: "Live Chat", desc: "Chat with our support team" },
          { icon: HelpCircle, color: "bg-orange-100", iconColor: "text-orange-600", title: "FAQs", desc: "Find answers to common questions" },
        ].map((card, idx) => {
          const Icon = card.icon
          return (
            <div key={idx} className="bg-white dark:bg-[#13132a] p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <div className="mb-3 sm:mb-4">
                <div className={`${card.color} p-2 sm:p-3 rounded-lg inline-block`}>
                  <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${card.iconColor}`} />
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base mb-1 sm:mb-2">{card.title}</h3>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0]">{card.desc}</p>
            </div>
          )
        })}
      </div>

      {/* Contact Support */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-white dark:bg-[#13132a] p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm">
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Mail className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Email Support</h3>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0] mb-3 sm:mb-4">Get help via email within 24 hours</p>
          <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">support@vendora.com</p>
          <Button className="w-full bg-purple-600 hover:bg-purple-700">Send Email</Button>
        </div>

        <div className="bg-white dark:bg-[#13132a] p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm">
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Phone className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Phone Support</h3>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0] mb-3 sm:mb-4">Talk to our support team</p>
          <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white mb-3 sm:mb-4">+63 2 8123 4567</p>
          <Button className="w-full" variant="outline">Call Now</Button>
        </div>

        <div className="bg-white dark:bg-[#13132a] p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm sm:col-span-2 md:col-span-1">
          <div className="flex items-center gap-3 mb-3 sm:mb-4">
            <div className="bg-green-100 p-2 rounded-lg">
              <MessageCircle className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Live Chat</h3>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0] mb-3 sm:mb-4">Chat with an agent now</p>
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Online</Badge>
            <span className="text-xs text-gray-600 dark:text-[#b4b4d0]">Usually responds in minutes</span>
          </div>
          <Button className="w-full" variant="outline">Start Chat</Button>
        </div>
      </div>

      {/* Popular Help Articles */}
      <div className="bg-white dark:bg-[#13132a] rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">Popular Help Articles</h2>
        <div className="space-y-3 sm:space-y-4">
          {[
            { title: "Getting Started with Vendora POS", category: "Getting Started", views: 1245 },
            { title: "How to Add Products to Your Inventory", category: "Products", views: 892 },
            { title: "Processing Sales and Payments", category: "Sales", views: 756 },
            { title: "Managing Customer Information", category: "Customers", views: 634 },
            { title: "Generating Sales Reports", category: "Reports", views: 521 },
            { title: "Setting Up Tax Rates", category: "Settings", views: 489 },
          ].map((article, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-[#1a1a35] rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="flex-shrink-0 bg-white dark:bg-[#13132a] p-1.5 sm:p-2 rounded">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-[#b4b4d0]" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{article.title}</div>
                  <div className="text-xs text-gray-600 dark:text-[#b4b4d0] mt-0.5 sm:mt-1">
                    {article.category} <span className="hidden sm:inline">• {article.views} views</span>
                  </div>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400 dark:text-[#9898b8] flex-shrink-0 ml-2" />
            </div>
          ))}
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white dark:bg-[#13132a] rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm p-4 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">System Status</h2>
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 w-fit">All Systems Operational</Badge>
        </div>
        <div className="space-y-2 sm:space-y-3">
          {[
            { service: "POS System", status: "operational" },
            { service: "Payment Processing", status: "operational" },
            { service: "Inventory Management", status: "operational" },
            { service: "Reports & Analytics", status: "operational" },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 dark:bg-[#1a1a35] rounded-lg">
              <span className="text-sm text-gray-900 dark:text-white">{item.service}</span>
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-xs">Operational</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
