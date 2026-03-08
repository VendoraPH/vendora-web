"use client"

import { useState, useCallback } from "react"
import {
  Plus,
  Loader2,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Search,
  FileText,
  TrendingUp,
  TrendingDown,
  Calculator,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Swal from "sweetalert2"
import { ledgerService } from "@/services"
import type {
  LedgerSummary,
  LedgerEntry,
  LedgerFilters,
  LedgerCreatePayload,
  PaginatedLedgerResponse,
} from "@/services"
import { useOfflineData } from "@/hooks/use-offline-data"
import { StaleDataBanner } from "@/components/pos/StaleDataBanner"

interface LedgerPageData {
  summary: LedgerSummary
  entries: LedgerEntry[]
  meta: {
    current_page: number
    per_page: number
    total: number
  }
}

export default function LedgerPage() {
  // Filter state
  const [filters, setFilters] = useState<LedgerFilters>({
    page: 1,
    per_page: 10,
  })
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [searchFilter, setSearchFilter] = useState("")

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [formType, setFormType] = useState<"income" | "expense">("income")
  const [formDescription, setFormDescription] = useState("")
  const [formAmount, setFormAmount] = useState("")
  const [formCategory, setFormCategory] = useState("")
  const [formReference, setFormReference] = useState("")
  const [formProductId, setFormProductId] = useState("")
  const [formQuantity, setFormQuantity] = useState("")

  // Build active filters object
  const buildFilters = useCallback((): LedgerFilters => {
    const f: LedgerFilters = {
      page: filters.page,
      per_page: filters.per_page,
    }
    if (typeFilter !== "all") f.type = typeFilter as "income" | "expense"
    if (categoryFilter.trim()) f.category = categoryFilter.trim()
    if (dateFrom) f.date_from = dateFrom
    if (dateTo) f.date_to = dateTo
    if (searchFilter.trim()) f.search = searchFilter.trim()
    return f
  }, [filters.page, filters.per_page, typeFilter, categoryFilter, dateFrom, dateTo, searchFilter])

  const {
    data,
    isLoading: loading,
    isStale,
    lastSyncedAt,
    error,
    refresh,
  } = useOfflineData<LedgerPageData>(
    `ledger-data-${JSON.stringify(buildFilters())}`,
    async () => {
      const activeFilters = buildFilters()
      const [summaryData, entriesData] = await Promise.all([
        ledgerService.getSummary(),
        ledgerService.getAll(activeFilters),
      ])

      const entries = Array.isArray(entriesData)
        ? entriesData
        : (entriesData as PaginatedLedgerResponse).data || []

      const meta = Array.isArray(entriesData)
        ? { current_page: 1, per_page: activeFilters.per_page || 10, total: (entriesData as LedgerEntry[]).length }
        : (entriesData as PaginatedLedgerResponse).meta || {
            current_page: activeFilters.page || 1,
            per_page: activeFilters.per_page || 10,
            total: entries.length,
          }

      return {
        summary: summaryData,
        entries,
        meta,
      }
    },
    { staleAfterMinutes: 15 }
  )

  const summary = data?.summary ?? null
  const entries = data?.entries ?? []
  const meta = data?.meta ?? { current_page: 1, per_page: 10, total: 0 }
  const totalPages = Math.max(1, Math.ceil(meta.total / meta.per_page))

  // Apply filters
  const handleApplyFilters = () => {
    setFilters((prev) => ({ ...prev, page: 1 }))
    refresh()
  }

  // Pagination
  const goToPage = (page: number) => {
    setFilters((prev) => ({ ...prev, page }))
    setTimeout(() => refresh(), 0)
  }

  const handlePerPageChange = (value: string) => {
    setFilters({ page: 1, per_page: parseInt(value) })
    setTimeout(() => refresh(), 0)
  }

  // Reset form
  const resetForm = () => {
    setFormType("income")
    setFormDescription("")
    setFormAmount("")
    setFormCategory("")
    setFormReference("")
    setFormProductId("")
    setFormQuantity("")
  }

  // Submit new entry
  const handleCreateEntry = async () => {
    if (!formDescription.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Validation Error",
        text: "Description is required.",
        confirmButtonColor: "#7C3AED",
      })
      return
    }
    if (!formAmount || parseFloat(formAmount) <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Validation Error",
        text: "Amount must be greater than 0.",
        confirmButtonColor: "#7C3AED",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const payload: LedgerCreatePayload = {
        type: formType,
        description: formDescription.trim(),
        amount: Math.round(parseFloat(formAmount)),
      }
      if (formCategory.trim()) (payload as any).category = formCategory.trim()
      if (formReference.trim()) payload.reference = formReference.trim()
      if (formProductId && parseInt(formProductId) > 0) payload.product_id = parseInt(formProductId)
      if (formQuantity && parseInt(formQuantity) > 0) payload.quantity = parseInt(formQuantity)

      await ledgerService.create(payload)

      Swal.fire({
        icon: "success",
        title: "Entry Created",
        text: "Ledger entry has been added successfully.",
        confirmButtonColor: "#7C3AED",
      })

      setDialogOpen(false)
      resetForm()
      refresh()
    } catch (err: any) {
      console.error("Failed to create ledger entry:", err)
      const validationErrors = err?.response?.data?.errors
        ? Object.values(err.response.data.errors).flat().join(", ")
        : ""
      Swal.fire({
        icon: "error",
        title: "Failed to Create Entry",
        text: validationErrors || err?.message || "An unexpected error occurred.",
        confirmButtonColor: "#7C3AED",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  // Error state (no cached data)
  if (error && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <p className="text-gray-600 dark:text-[#b4b4d0]">{error}</p>
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Ledger</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-[#b4b4d0] mt-0.5 sm:mt-1">
            Track all income and expense transactions
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-white dark:bg-[#13132a] border-gray-200 dark:border-[#2d1b69]">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">Add Ledger Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Type */}
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-[#b4b4d0]">
                  Type <span className="text-red-500">*</span>
                </Label>
                <Select value={formType} onValueChange={(v) => setFormType(v as "income" | "expense")}>
                  <SelectTrigger className="bg-white dark:bg-[#1a1a35] border-gray-200 dark:border-[#2d1b69] text-gray-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-[#b4b4d0]">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Enter description"
                  className="bg-white dark:bg-[#1a1a35] border-gray-200 dark:border-[#2d1b69] text-gray-900 dark:text-white"
                />
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-[#b4b4d0]">
                  Amount <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="1"
                  className="bg-white dark:bg-[#1a1a35] border-gray-200 dark:border-[#2d1b69] text-gray-900 dark:text-white"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-[#b4b4d0]">Category</Label>
                <Input
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  placeholder="e.g. Supplies, Sales, Rent"
                  className="bg-white dark:bg-[#1a1a35] border-gray-200 dark:border-[#2d1b69] text-gray-900 dark:text-white"
                />
              </div>

              {/* Reference */}
              <div className="space-y-2">
                <Label className="text-gray-700 dark:text-[#b4b4d0]">Reference</Label>
                <Input
                  value={formReference}
                  onChange={(e) => setFormReference(e.target.value)}
                  placeholder="e.g. Invoice #123"
                  className="bg-white dark:bg-[#1a1a35] border-gray-200 dark:border-[#2d1b69] text-gray-900 dark:text-white"
                />
              </div>

              {/* Product ID & Quantity (side by side) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-[#b4b4d0]">Product ID</Label>
                  <Input
                    type="number"
                    value={formProductId}
                    onChange={(e) => setFormProductId(e.target.value)}
                    placeholder="Optional"
                    min="0"
                    className="bg-white dark:bg-[#1a1a35] border-gray-200 dark:border-[#2d1b69] text-gray-900 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700 dark:text-[#b4b4d0]">Quantity</Label>
                  <Input
                    type="number"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value)}
                    placeholder="Optional"
                    min="0"
                    className="bg-white dark:bg-[#1a1a35] border-gray-200 dark:border-[#2d1b69] text-gray-900 dark:text-white"
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <DialogClose asChild>
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                className="bg-purple-600 hover:bg-purple-700"
                onClick={handleCreateEntry}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Entry"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-white dark:bg-[#13132a] p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0]">Total Entries</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-1">
                {(summary?.total_entries ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 sm:p-3 rounded-lg hidden sm:block">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#13132a] p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0]">Total Income</p>
              <p className="text-lg sm:text-2xl font-bold text-green-600 mt-0.5 sm:mt-1">
                ₱{(summary?.total_income ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-2 sm:p-3 rounded-lg hidden sm:block">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#13132a] p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0]">Total Expenses</p>
              <p className="text-lg sm:text-2xl font-bold text-red-600 mt-0.5 sm:mt-1">
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
              <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0]">Net Balance</p>
              <p className="text-lg sm:text-2xl font-bold text-purple-600 mt-0.5 sm:mt-1">
                ₱{(summary?.net_balance ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/30 p-2 sm:p-3 rounded-lg hidden sm:block">
              <Calculator className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#13132a] rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
          {/* Type */}
          <div className="sm:w-40">
            <label className="block text-xs font-medium text-gray-600 dark:text-[#b4b4d0] mb-1">Type</label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="bg-white dark:bg-[#1a1a35] border-gray-200 dark:border-[#2d1b69] text-gray-900 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div className="sm:w-40">
            <label className="block text-xs font-medium text-gray-600 dark:text-[#b4b4d0] mb-1">Category</label>
            <Input
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              placeholder="Category"
              className="bg-white dark:bg-[#1a1a35] border-gray-200 dark:border-[#2d1b69] text-gray-900 dark:text-white"
            />
          </div>

          {/* Date From */}
          <div className="sm:w-40">
            <label className="block text-xs font-medium text-gray-600 dark:text-[#b4b4d0] mb-1">Date From</label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-white dark:bg-[#1a1a35] border-gray-200 dark:border-[#2d1b69] text-gray-900 dark:text-white"
            />
          </div>

          {/* Date To */}
          <div className="sm:w-40">
            <label className="block text-xs font-medium text-gray-600 dark:text-[#b4b4d0] mb-1">Date To</label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-white dark:bg-[#1a1a35] border-gray-200 dark:border-[#2d1b69] text-gray-900 dark:text-white"
            />
          </div>

          {/* Search */}
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-medium text-gray-600 dark:text-[#b4b4d0] mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search entries..."
                className="pl-9 bg-white dark:bg-[#1a1a35] border-gray-200 dark:border-[#2d1b69] text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Apply */}
          <Button onClick={handleApplyFilters} className="bg-purple-600 hover:bg-purple-700 sm:w-auto">
            Apply Filters
          </Button>
        </div>
      </div>

      {/* Data Table - Desktop */}
      <div className="hidden md:block bg-white dark:bg-[#13132a] rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[#2d1b69]">
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-[#b4b4d0]">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-[#b4b4d0]">Type</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-[#b4b4d0]">Description</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-[#b4b4d0]">Category</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-[#b4b4d0]">Amount</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-[#b4b4d0]">Reference</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500 dark:text-[#b4b4d0]">
                    No ledger entries found
                  </td>
                </tr>
              ) : (
                entries.map((entry) => {
                  const isIncome = entry.type === "income"
                  return (
                    <tr
                      key={entry.id}
                      className="border-b border-gray-100 dark:border-[#2d1b69]/50 hover:bg-gray-50 dark:hover:bg-[#1a1a35] transition-colors"
                    >
                      <td className="py-3 px-4 text-gray-900 dark:text-white">
                        {entry.created_at
                          ? new Date(entry.created_at).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isIncome
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                          }`}
                        >
                          {isIncome ? "Income" : "Expense"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-900 dark:text-white max-w-[200px] truncate">
                        {entry.description}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-[#b4b4d0]">
                        {entry.category || "-"}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-semibold ${
                          isIncome ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {isIncome ? "+" : "-"}₱{Math.abs(entry.amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-[#b4b4d0]">
                        {entry.reference || "-"}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Cards - Mobile */}
      <div className="md:hidden space-y-3">
        {entries.length === 0 ? (
          <div className="bg-white dark:bg-[#13132a] rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm p-8 text-center">
            <p className="text-sm text-gray-500 dark:text-[#b4b4d0]">No ledger entries found</p>
          </div>
        ) : (
          entries.map((entry) => {
            const isIncome = entry.type === "income"
            return (
              <div
                key={entry.id}
                className="bg-white dark:bg-[#13132a] rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      isIncome
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                    }`}
                  >
                    {isIncome ? "Income" : "Expense"}
                  </span>
                  <span
                    className={`text-sm font-bold ${
                      isIncome ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {isIncome ? "+" : "-"}₱{Math.abs(entry.amount).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{entry.description}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-600 dark:text-[#b4b4d0]">
                  <span>
                    {entry.created_at
                      ? new Date(entry.created_at).toLocaleDateString()
                      : "-"}
                  </span>
                  {entry.category && (
                    <>
                      <span>&bull;</span>
                      <span>{entry.category}</span>
                    </>
                  )}
                  {entry.reference && (
                    <>
                      <span>&bull;</span>
                      <span>{entry.reference}</span>
                    </>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {entries.length > 0 && (
        <div className="bg-white dark:bg-[#13132a] rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-[#b4b4d0]">
              <span>Showing</span>
              <Select
                value={String(meta.per_page)}
                onValueChange={handlePerPageChange}
              >
                <SelectTrigger className="w-[70px] h-8 bg-white dark:bg-[#1a1a35] border-gray-200 dark:border-[#2d1b69] text-gray-900 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span>of {meta.total} entries</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(meta.current_page - 1)}
                disabled={meta.current_page <= 1}
                className="h-8"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </Button>
              <span className="text-sm text-gray-600 dark:text-[#b4b4d0] px-2">
                Page {meta.current_page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(meta.current_page + 1)}
                disabled={meta.current_page >= totalPages}
                className="h-8"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
