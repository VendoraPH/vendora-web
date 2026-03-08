"use client"

import { Button } from "@/components/ui/button"
import {
  Calculator,
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  Download,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"
import { ledgerService } from "@/services"
import type { LedgerSummary, LedgerEntry } from "@/services"
import { useOfflineData } from "@/hooks/use-offline-data"
import { StaleDataBanner } from "@/components/pos/StaleDataBanner"

export default function AccountingPage() {
  const { data, isLoading: loading, isStale, lastSyncedAt, error, refresh } = useOfflineData<{
    summary: LedgerSummary;
    entries: LedgerEntry[];
  }>(
    "accounting-data",
    async () => {
      const [summaryData, entriesData] = await Promise.all([
        ledgerService.getSummary(),
        ledgerService.getAll({ per_page: 10 }),
      ])
      return {
        summary: summaryData,
        entries: Array.isArray(entriesData) ? entriesData : (entriesData as any).data || [],
      }
    },
    { staleAfterMinutes: 30 }
  )
  const summary = data?.summary ?? null
  const entries = data?.entries ?? []

  const profitMargin = summary && summary.total_income > 0
    ? ((summary.net_balance / summary.total_income) * 100).toFixed(1)
    : "0.0"

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-gray-600 dark:text-[#b4b4d0]">{error as string}</p>
        <Button onClick={refresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <StaleDataBanner isStale={isStale} lastSyncedAt={lastSyncedAt} />
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Accounting</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-[#b4b4d0] mt-0.5 sm:mt-1">Manage finances, expenses, and accounting records</p>
        </div>
        <Button variant="outline" className="w-full sm:w-auto">
          <Download className="w-4 h-4 mr-2" />
          Export Financial Report
        </Button>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-white dark:bg-[#13132a] p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0]">Total Revenue</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-1">
                ₱{(summary?.total_income ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-2 sm:p-3 rounded-lg hidden sm:block">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#13132a] p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0]">Total Expenses</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-1">
                ₱{(summary?.total_expenses ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-red-100 dark:bg-red-900/30 p-2 sm:p-3 rounded-lg hidden sm:block">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#13132a] p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0]">Net Profit</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-1">
                ₱{(summary?.net_balance ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/30 p-2 sm:p-3 rounded-lg hidden sm:block">
              <Calculator className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#13132a] p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0]">Profit Margin</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-1">{profitMargin}%</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 sm:p-3 rounded-lg hidden sm:block">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-white dark:bg-[#13132a] p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Invoices</h3>
            <FileText className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0] mb-3 sm:mb-4">Create and manage customer invoices</p>
          <Button className="w-full bg-purple-600 hover:bg-purple-700">Create Invoice</Button>
        </div>

        <div className="bg-white dark:bg-[#13132a] p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Expenses</h3>
            <TrendingDown className="h-5 w-5 text-red-600" />
          </div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0] mb-3 sm:mb-4">Track and categorize business expenses</p>
          <div className="space-y-2 mb-3 sm:mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-[#b4b4d0]">Total Expenses</span>
              <span className="font-semibold dark:text-[#e0e0f0]">₱{(summary?.total_expenses ?? 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-[#b4b4d0]">Entries</span>
              <span className="font-semibold dark:text-[#e0e0f0]">{summary?.total_entries ?? 0}</span>
            </div>
          </div>
          <Button className="w-full" variant="outline">Add Expense</Button>
        </div>

        <div className="bg-white dark:bg-[#13132a] p-4 sm:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm hover:shadow-md transition-shadow sm:col-span-2 md:col-span-1">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Tax Records</h3>
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0] mb-3 sm:mb-4">Manage tax compliance and records</p>
          <Button className="w-full" variant="outline">View Tax</Button>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-[#13132a] rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
          <Link
            href="/pos/ledger"
            className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
          >
            View All
          </Link>
        </div>
        {entries.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-[#b4b4d0] text-center py-8">No transactions found</p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => {
              const isIncome = entry.type === "income"
              return (
                <div key={entry.id} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 dark:bg-[#13132a] rounded-lg">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`flex-shrink-0 p-1.5 sm:p-2 rounded-lg ${isIncome ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                      {isIncome ? (
                        <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{entry.description}</div>
                      <div className="text-xs text-gray-600 dark:text-[#b4b4d0] mt-0.5 sm:mt-1">
                        {entry.created_at ? new Date(entry.created_at).toLocaleDateString() : ""}
                        {entry.category && <span className="hidden sm:inline"> &bull; {entry.category}</span>}
                      </div>
                    </div>
                  </div>
                  <div className={`text-sm font-bold ${isIncome ? "text-green-600" : "text-red-600"}`}>
                    {isIncome ? "+" : "-"}₱{Math.abs(entry.amount).toLocaleString()}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
