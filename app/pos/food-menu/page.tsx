"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  UtensilsCrossed,
  Search,
  Plus,
  Calendar,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import Swal from "sweetalert2"
import { foodMenuService } from "@/services"
import type { FoodMenuCreatePayload, FoodMenuItem as ApiFoodMenuItem, FoodMenuReservation as ApiFoodMenuReservation } from "@/services"
import { useOfflineData } from "@/hooks/use-offline-data"
import { StaleDataBanner } from "@/components/pos/StaleDataBanner"

// ─── Types ────────────────────────────────────────────────────────────────────

type MenuCategory =
  | "Appetizer"
  | "Main Course"
  | "Dessert"
  | "Beverage"
  | "Snack"
  | "Soup"
  | "Salad"
  | "Combo"

const CATEGORIES: MenuCategory[] = [
  "Appetizer",
  "Main Course",
  "Dessert",
  "Beverage",
  "Snack",
  "Soup",
  "Salad",
  "Combo",
]

type MenuItem = {
  id: number
  name: string
  description: string
  category: MenuCategory
  price: number
  totalServings: number
  reservedServings: number
  isAvailable: boolean
}

type Reservation = {
  id: number
  menuItemId: number
  menuItemName: string
  employeeName: string
  phone: string
  servings: number
  notes: string
  total: number
  status: "Pending" | "Confirmed" | "Cancelled"
  createdAt: string
}

type ItemForm = {
  name: string
  description: string
  category: MenuCategory
  price: string
  totalServings: string
  isAvailable: boolean
}

type SortKey = "name" | "category" | "price" | "totalServings" | "reserved" | "status"
type SortDir = "asc" | "desc"

const PAGE_SIZES = [5, 10, 25, 50]

const initialForm: ItemForm = {
  name: "",
  description: "",
  category: "Main Course",
  price: "",
  totalServings: "",
  isAvailable: true,
}

// ─── API → UI Mapping Helpers ────────────────────────────────────────────────

function mapApiFoodMenuItem(item: ApiFoodMenuItem): MenuItem {
  return {
    id: item.id,
    name: item.name,
    description: item.description ?? "",
    category: (item.category ?? "Main Course") as MenuCategory,
    price: Number(item.price) || 0,
    totalServings: item.total_servings ?? 0,
    reservedServings: item.reserved_servings ?? 0,
    isAvailable: item.is_available ?? true,
  }
}

function mapApiReservation(r: ApiFoodMenuReservation): Reservation {
  const itemPrice = r.food_menu_item ? Number(r.food_menu_item.price) || 0 : 0
  const status = r.status
    ? (r.status.charAt(0).toUpperCase() + r.status.slice(1)) as Reservation["status"]
    : "Pending"

  return {
    id: r.id,
    menuItemId: r.food_menu_item_id,
    menuItemName: r.food_menu_item?.name ?? `Item #${r.food_menu_item_id}`,
    employeeName: r.customer_name,
    phone: r.customer_phone ?? "",
    servings: r.servings,
    notes: r.notes ?? "",
    total: r.servings * itemPrice,
    status,
    createdAt: r.created_at ?? "",
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAvailabilityInfo(item: MenuItem) {
  const left = item.totalServings - item.reservedServings
  if (!item.isAvailable || left === 0) {
    return { label: "Fully Reserved", color: "bg-red-500/15 text-red-400 border-red-500/30" }
  }
  if (left <= 5) {
    return { label: "Almost Full", color: "bg-orange-500/15 text-orange-400 border-orange-500/30" }
  }
  return { label: "Available", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" }
}

function getProgressPercent(item: MenuItem) {
  if (item.totalServings === 0) return 0
  return Math.min(100, Math.round((item.reservedServings / item.totalServings) * 100))
}

function getProgressColor(pct: number) {
  if (pct >= 100) return "bg-red-500"
  if (pct >= 75) return "bg-orange-500"
  return "bg-[#7C3AED]"
}

function getStatusBadge(status: Reservation["status"]) {
  switch (status) {
    case "Confirmed":  return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
    case "Pending":    return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
    case "Cancelled":  return "bg-red-500/15 text-red-400 border-red-500/30"
  }
}

// ─── Sort icon helper ─────────────────────────────────────────────────────────

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ArrowUpDown className="w-3.5 h-3.5 ml-1 opacity-40" />
  return sortDir === "asc"
    ? <ArrowUp className="w-3.5 h-3.5 ml-1 text-[#7C3AED]" />
    : <ArrowDown className="w-3.5 h-3.5 ml-1 text-[#7C3AED]" />
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FoodMenuPage() {
  const [activeTab, setActiveTab]     = useState<"items" | "reservations">("items")

  const { data, isLoading, isStale, lastSyncedAt, error, refresh } = useOfflineData<{
    items: MenuItem[];
    reservations: Reservation[];
  }>(
    "food-menu-data",
    async () => {
      const [itemsRes, reservationsRes] = await Promise.all([
        foodMenuService.getAll({ per_page: 200 }),
        foodMenuService.getReservations({ per_page: 200 }),
      ])
      const rawItems = Array.isArray(itemsRes) ? itemsRes : (itemsRes as any)?.data ?? []
      const rawRes = Array.isArray(reservationsRes) ? reservationsRes : (reservationsRes as any)?.data ?? []
      return {
        items: rawItems.map(mapApiFoodMenuItem),
        reservations: rawRes.map(mapApiReservation),
      }
    },
    { staleAfterMinutes: 15 }
  )

  const [menuItems, setMenuItems]     = useState<MenuItem[]>([])
  const reservations = data?.reservations ?? []

  // Sync menuItems state when data loads from API
  useEffect(() => {
    if (data?.items) {
      setMenuItems(data.items)
    }
  }, [data])

  // ── Menu Items filter/sort/page state ──────────────────────────────────────
  const [searchQuery, setSearchQuery]         = useState("")
  const [activeCategory, setActiveCategory]   = useState<MenuCategory | "All">("All")
  const [sortKey, setSortKey]                 = useState<SortKey>("name")
  const [sortDir, setSortDir]                 = useState<SortDir>("asc")
  const [currentPage, setCurrentPage]         = useState(1)
  const [pageSize, setPageSize]               = useState(10)

  // ── Dialog state ────────────────────────────────────────────────────────────
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing]       = useState(false)
  const [editingId, setEditingId]       = useState<number | null>(null)
  const [form, setForm]                 = useState<ItemForm>(initialForm)
  const [isSaving, setIsSaving]         = useState(false)

  // ── Reservations filter state ───────────────────────────────────────────────
  const [resSearch, setResSearch]           = useState("")
  const [resStatusFilter, setResStatusFilter] = useState<Reservation["status"] | "All">("All")

  // ── Categories used by current items ───────────────────────────────────────
  const usedCategories = useMemo(() => {
    const cats = new Set(menuItems.map((i) => i.category))
    return CATEGORIES.filter((c) => cats.has(c))
  }, [menuItems])

  // ── Filtered + sorted + paginated items ────────────────────────────────────
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCat    = activeCategory === "All" || item.category === activeCategory
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCat && matchesSearch
    })
  }, [menuItems, activeCategory, searchQuery])

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case "name":         cmp = a.name.localeCompare(b.name); break
        case "category":     cmp = a.category.localeCompare(b.category); break
        case "price":        cmp = a.price - b.price; break
        case "totalServings":cmp = a.totalServings - b.totalServings; break
        case "reserved":     cmp = (a.reservedServings / a.totalServings) - (b.reservedServings / b.totalServings); break
        case "status": {
          const order = (i: MenuItem) => {
            const left = i.totalServings - i.reservedServings
            if (!i.isAvailable || left === 0) return 2
            if (left <= 5) return 1
            return 0
          }
          cmp = order(a) - order(b); break
        }
      }
      return sortDir === "asc" ? cmp : -cmp
    })
  }, [filteredItems, sortKey, sortDir])

  const totalPages  = Math.max(1, Math.ceil(sortedItems.length / pageSize))
  const safePage    = Math.min(currentPage, totalPages)
  const pagedItems  = sortedItems.slice((safePage - 1) * pageSize, safePage * pageSize)

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
    setCurrentPage(1)
  }

  const handleCategoryChange = (cat: MenuCategory | "All") => {
    setActiveCategory(cat)
    setCurrentPage(1)
  }

  // ── Filtered reservations ───────────────────────────────────────────────────
  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      const matchesStatus = resStatusFilter === "All" || r.status === resStatusFilter
      const matchesSearch =
        r.employeeName.toLowerCase().includes(resSearch.toLowerCase()) ||
        r.menuItemName.toLowerCase().includes(resSearch.toLowerCase())
      return matchesStatus && matchesSearch
    })
  }, [reservations, resSearch, resStatusFilter])

  // ── Dialog helpers ──────────────────────────────────────────────────────────
  const openAdd = () => {
    setForm(initialForm)
    setIsEditing(false)
    setEditingId(null)
    setIsDialogOpen(true)
  }

  const openEdit = (item: MenuItem) => {
    setForm({
      name: item.name,
      description: item.description,
      category: item.category,
      price: String(item.price),
      totalServings: String(item.totalServings),
      isAvailable: item.isAvailable,
    })
    setIsEditing(true)
    setEditingId(item.id)
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    // Blur active element before closing to prevent Radix aria-hidden focus warning
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    setIsDialogOpen(false)
    setForm(initialForm)
    setIsEditing(false)
    setEditingId(null)
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name.trim()) {
      Swal.fire({ icon: "warning", title: "Name required", text: "Please enter a menu item name.", confirmButtonColor: "#7C3AED" })
      return
    }
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) {
      Swal.fire({ icon: "warning", title: "Invalid price", text: "Please enter a valid price.", confirmButtonColor: "#7C3AED" })
      return
    }
    if (!form.totalServings || isNaN(Number(form.totalServings)) || Number(form.totalServings) <= 0) {
      Swal.fire({ icon: "warning", title: "Invalid servings", text: "Please enter total servings.", confirmButtonColor: "#7C3AED" })
      return
    }

    setIsSaving(true)

    const payload: FoodMenuCreatePayload = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      price: Number(form.price),
      total_servings: Number(form.totalServings),
      is_available: form.isAvailable,
    }

    try {
      if (isEditing && editingId !== null) {
        await foodMenuService.update(editingId, payload)
        Swal.fire({ icon: "success", title: "Updated!", text: `"${form.name}" has been updated.`, confirmButtonColor: "#7C3AED", timer: 1800, showConfirmButton: false })
      } else {
        await foodMenuService.create(payload)
        Swal.fire({ icon: "success", title: "Created!", text: `"${form.name}" has been added.`, confirmButtonColor: "#7C3AED", timer: 1800, showConfirmButton: false })
      }
      refresh()
    } catch (err: any) {
      console.error("Food menu API error:", err?.response?.data || err?.message)
      // Fallback to local state if API fails
      if (isEditing && editingId !== null) {
        setMenuItems((prev) =>
          prev.map((item) =>
            item.id === editingId
              ? { ...item, name: form.name.trim(), description: form.description.trim(), category: form.category, price: Number(form.price), totalServings: Number(form.totalServings), isAvailable: form.isAvailable }
              : item
          )
        )
        Swal.fire({ icon: "success", title: "Updated (offline)!", text: `"${form.name}" has been updated locally.`, confirmButtonColor: "#7C3AED", timer: 1800, showConfirmButton: false })
      } else {
        const newItem: MenuItem = {
          id: Date.now(),
          name: form.name.trim(),
          description: form.description.trim(),
          category: form.category,
          price: Number(form.price),
          totalServings: Number(form.totalServings),
          reservedServings: 0,
          isAvailable: form.isAvailable,
        }
        setMenuItems((prev) => [newItem, ...prev])
        Swal.fire({ icon: "success", title: "Created (offline)!", text: `"${form.name}" has been added locally.`, confirmButtonColor: "#7C3AED", timer: 1800, showConfirmButton: false })
      }
    }

    setIsSaving(false)
    closeDialog()
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (item: MenuItem) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete menu item?",
      text: `"${item.name}" will be permanently removed.`,
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it",
    })
    if (result.isConfirmed) {
      try {
        await foodMenuService.delete(item.id)
        refresh()
      } catch {
        setMenuItems((prev) => prev.filter((i) => i.id !== item.id))
      }
      Swal.fire({ icon: "success", title: "Deleted", timer: 1500, showConfirmButton: false })
    }
  }

  // ── Toggle availability ─────────────────────────────────────────────────────
  const toggleAvailability = async (id: number) => {
    const current = menuItems.find((item) => item.id === id)
    if (!current) return
    // Optimistic update
    setMenuItems((prev) =>
      prev.map((item) => item.id === id ? { ...item, isAvailable: !item.isAvailable } : item)
    )
    try {
      await foodMenuService.update(id, { is_available: !current.isAvailable })
      refresh()
    } catch {
      // Revert on failure
      setMenuItems((prev) =>
        prev.map((item) => item.id === id ? { ...item, isAvailable: current.isAvailable } : item)
      )
    }
  }

  // ─── Th helper ──────────────────────────────────────────────────────────────
  const Th = ({ col, label, className = "" }: { col: SortKey; label: string; className?: string }) => (
    <th
      className={`px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400 cursor-pointer select-none whitespace-nowrap ${className}`}
      onClick={() => handleSort(col)}
    >
      <span className="inline-flex items-center hover:text-gray-900 dark:hover:text-white transition-colors">
        {label}
        <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
      </span>
    </th>
  )

  // ─── Loading / Error States ─────────────────────────────────────────────────
  if (isLoading && !data) {
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
        <p className="text-gray-600 dark:text-[#b4b4d0]">{String(error)}</p>
        <Button onClick={refresh} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <StaleDataBanner isStale={isStale} lastSyncedAt={lastSyncedAt} />

      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Food Menu</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your menu &amp; reservations</p>
        </div>
        <Button
          onClick={openAdd}
          className="flex items-center gap-2 bg-[#7C3AED] hover:bg-[#6d28d9] text-white shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </Button>
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────────────── */}
      <div className="flex rounded-xl overflow-hidden border border-gray-200 dark:border-purple-900/50 w-full sm:w-auto sm:inline-flex">
        <button
          onClick={() => setActiveTab("items")}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "items"
              ? "bg-[#7C3AED] text-white"
              : "bg-white dark:bg-[#1a0f2e] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
          }`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          Menu Items
        </button>
        <button
          onClick={() => setActiveTab("reservations")}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "reservations"
              ? "bg-[#7C3AED] text-white"
              : "bg-white dark:bg-[#1a0f2e] text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
          }`}
        >
          <Calendar className="w-4 h-4" />
          Reservations
          {reservations.filter((r) => r.status === "Pending").length > 0 && (
            <span className="flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full bg-white/20 text-white">
              {reservations.filter((r) => r.status === "Pending").length}
            </span>
          )}
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB: MENU ITEMS
      ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "items" && (
        <div className="space-y-4">

          {/* ── Toolbar: Search + Desktop Category Select + Page Size ─────────── */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

            {/* Left: Search + Category */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1 min-w-0">
              {/* Search */}
              <div className="relative flex-1 min-w-0 sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
                  className="pl-9 bg-white dark:bg-[#1a0f2e] border-gray-200 dark:border-purple-900/50 dark:text-white dark:placeholder:text-gray-500"
                />
              </div>

              {/* Desktop: Category dropdown (hidden on mobile/tablet) */}
              <div className="hidden md:block w-48">
                <Select
                  value={activeCategory}
                  onValueChange={(v) => handleCategoryChange(v as MenuCategory | "All")}
                >
                  <SelectTrigger className="bg-white dark:bg-[#1a0f2e] border-gray-200 dark:border-purple-900/50 dark:text-white focus:ring-[#7C3AED]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#1a0f2e] dark:border-purple-900/50">
                    <SelectItem value="All" className="dark:text-gray-200 dark:focus:bg-purple-900/30">All Categories</SelectItem>
                    {usedCategories.map((cat) => (
                      <SelectItem key={cat} value={cat} className="dark:text-gray-200 dark:focus:bg-purple-900/30">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right: Page size (desktop only) + item count */}
            <div className="hidden md:flex items-center gap-3">
              <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {filteredItems.length} {filteredItems.length === 1 ? "item" : "items"}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">Rows per page:</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1) }}
                >
                  <SelectTrigger className="w-20 h-8 text-sm bg-white dark:bg-[#1a0f2e] border-gray-200 dark:border-purple-900/50 dark:text-white focus:ring-[#7C3AED]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-[#1a0f2e] dark:border-purple-900/50">
                    {PAGE_SIZES.map((s) => (
                      <SelectItem key={s} value={String(s)} className="dark:text-gray-200 dark:focus:bg-purple-900/30">{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* ── Mobile / Tablet: Category pills (hidden on desktop) ───────────── */}
          <div className="flex flex-wrap gap-2 md:hidden">
            <button
              onClick={() => handleCategoryChange("All")}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                activeCategory === "All"
                  ? "bg-[#7C3AED] text-white border-[#7C3AED]"
                  : "bg-white dark:bg-[#1a0f2e] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-purple-900/50 hover:border-[#7C3AED] hover:text-[#7C3AED]"
              }`}
            >
              All
            </button>
            {usedCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                  activeCategory === cat
                    ? "bg-[#7C3AED] text-white border-[#7C3AED]"
                    : "bg-white dark:bg-[#1a0f2e] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-purple-900/50 hover:border-[#7C3AED] hover:text-[#7C3AED]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Mobile item count */}
          <p className="text-sm text-gray-500 dark:text-gray-400 md:hidden">
            {filteredItems.length} {filteredItems.length === 1 ? "Item" : "Items"}
          </p>

          {/* ── Empty State ─────────────────────────────────────────────────── */}
          {filteredItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-dashed border-gray-200 dark:border-purple-900/50 bg-white dark:bg-[#1a0f2e]/50">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-900/20 mb-4">
                <UtensilsCrossed className="w-8 h-8 text-[#7C3AED]" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">No menu items found</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {searchQuery || activeCategory !== "All"
                  ? "Try adjusting your search or filter."
                  : "Get started by adding your first menu item."}
              </p>
              {!searchQuery && activeCategory === "All" && (
                <Button onClick={openAdd} className="bg-[#7C3AED] hover:bg-[#6d28d9] text-white gap-2">
                  <Plus className="w-4 h-4" />
                  Add Item
                </Button>
              )}
            </div>
          )}

          {/* ── Desktop Table (md+) ──────────────────────────────────────────── */}
          {filteredItems.length > 0 && (
            <div className="hidden md:block rounded-2xl border border-gray-200 dark:border-purple-900/50 bg-white dark:bg-[#1a0f2e] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5">
                    <Th col="name"          label="Item"        />
                    <Th col="category"      label="Category"    />
                    <Th col="reserved"      label="Reservations" className="min-w-[200px]" />
                    <Th col="price"         label="Price"       className="text-right" />
                    <Th col="totalServings" label="Servings"    className="text-center" />
                    <Th col="status"        label="Status"      className="text-center" />
                    <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-400">Available</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                  {pagedItems.map((item) => {
                    const avail = getAvailabilityInfo(item)
                    const pct   = getProgressPercent(item)
                    const left  = item.totalServings - item.reservedServings
                    return (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">

                        {/* Item */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                              <UtensilsCrossed className="w-4 h-4 text-[#7C3AED]" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                              {item.description && (
                                <p className="text-xs text-gray-400 dark:text-gray-500 max-w-[180px] truncate">{item.description}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-4 py-3">
                          <span className="inline-block px-2.5 py-1 text-xs font-medium rounded-full bg-purple-50 dark:bg-purple-900/20 text-[#7C3AED] dark:text-purple-300">
                            {item.category}
                          </span>
                        </td>

                        {/* Reservations progress */}
                        <td className="px-4 py-3">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                              <span>{item.reservedServings} / {item.totalServings} reserved</span>
                              <span className="font-medium ml-2">{left} left</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${getProgressColor(pct)}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="px-4 py-3 text-right font-bold text-[#7C3AED]">
                          ₱{item.price.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                        </td>

                        {/* Total Servings */}
                        <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                          {item.totalServings}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full border ${avail.color}`}>
                            {avail.label}
                          </span>
                        </td>

                        {/* Available toggle */}
                        <td className="px-4 py-3 text-center">
                          <Switch
                            checked={item.isAvailable}
                            onCheckedChange={() => toggleAvailability(item.id)}
                            className="data-[state=checked]:bg-[#7C3AED]"
                          />
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEdit(item)}
                              className="w-8 h-8 rounded-lg text-gray-400 hover:text-[#7C3AED] hover:bg-purple-50 dark:hover:bg-purple-900/20"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(item)}
                              className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* ── Pagination bar ────────────────────────────────────────────── */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5">
                {/* Info */}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Showing{" "}
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    {sortedItems.length === 0 ? 0 : (safePage - 1) * pageSize + 1}
                  </span>
                  {" "}–{" "}
                  <span className="font-medium text-gray-700 dark:text-gray-200">
                    {Math.min(safePage * pageSize, sortedItems.length)}
                  </span>
                  {" "}of{" "}
                  <span className="font-medium text-gray-700 dark:text-gray-200">{sortedItems.length}</span>
                  {" "}results
                </p>

                {/* Controls */}
                <div className="flex items-center gap-1">
                  {/* First page */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentPage(1)}
                    disabled={safePage === 1}
                    className="w-8 h-8 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-30"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <ChevronLeft className="w-3.5 h-3.5 -ml-2" />
                  </Button>

                  {/* Prev */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="w-8 h-8 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  {/* Page numbers */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                    .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...")
                      acc.push(p)
                      return acc
                    }, [])
                    .map((p, idx) =>
                      p === "..." ? (
                        <span key={`ellipsis-${idx}`} className="px-1 text-gray-400 text-sm">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => setCurrentPage(p as number)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                            safePage === p
                              ? "bg-[#7C3AED] text-white"
                              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"
                          }`}
                        >
                          {p}
                        </button>
                      )
                    )}

                  {/* Next */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="w-8 h-8 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>

                  {/* Last page */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={safePage === totalPages}
                    className="w-8 h-8 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-30"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                    <ChevronRight className="w-3.5 h-3.5 -ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ── Mobile / Tablet Cards (< md) ────────────────────────────────── */}
          {filteredItems.length > 0 && (
            <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredItems.map((item) => {
                const avail = getAvailabilityInfo(item)
                const pct   = getProgressPercent(item)
                const left  = item.totalServings - item.reservedServings
                return (
                  <div
                    key={item.id}
                    className="relative flex flex-col rounded-2xl border border-gray-200 dark:border-purple-900/50 bg-white dark:bg-[#1a0f2e] overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-center h-36 bg-gradient-to-br from-purple-50 to-violet-100 dark:from-[#2a1a4e] dark:to-[#1f1040]">
                      <UtensilsCrossed className="w-12 h-12 text-purple-300 dark:text-purple-700" />
                    </div>

                    <span className={`absolute top-3 right-3 px-2.5 py-1 text-xs font-semibold rounded-full border ${avail.color}`}>
                      {avail.label}
                    </span>

                    <div className="flex flex-col flex-1 p-4 gap-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white leading-tight">{item.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.category}</p>
                        {item.description && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>{item.reservedServings} / {item.totalServings} reserved</span>
                          <span className="font-medium">{left} left</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${getProgressColor(pct)}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                          <UtensilsCrossed className="w-3.5 h-3.5" />
                          <span>{item.totalServings} servings</span>
                        </div>
                        <span className="text-base font-bold text-[#7C3AED]">
                          ₱{item.price.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="border-t border-gray-100 dark:border-white/5" />

                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={item.isAvailable}
                            onCheckedChange={() => toggleAvailability(item.id)}
                            className="data-[state=checked]:bg-[#7C3AED]"
                          />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {item.isAvailable ? "Available" : "Unavailable"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(item)}
                            className="w-8 h-8 rounded-lg text-gray-400 hover:text-[#7C3AED] hover:bg-purple-50 dark:hover:bg-purple-900/20">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(item)}
                            className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB: RESERVATIONS
      ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === "reservations" && (
        <div className="space-y-4">

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by employee or item..."
                value={resSearch}
                onChange={(e) => setResSearch(e.target.value)}
                className="pl-9 bg-white dark:bg-[#1a0f2e] border-gray-200 dark:border-purple-900/50 dark:text-white dark:placeholder:text-gray-500"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(["All", "Pending", "Confirmed", "Cancelled"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setResStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    resStatusFilter === s
                      ? "bg-[#7C3AED] text-white border-[#7C3AED]"
                      : "bg-white dark:bg-[#1a0f2e] text-gray-600 dark:text-gray-400 border-gray-200 dark:border-purple-900/50 hover:border-[#7C3AED] hover:text-[#7C3AED]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total",     count: reservations.length,                                         color: "text-gray-900 dark:text-white" },
              { label: "Pending",   count: reservations.filter((r) => r.status === "Pending").length,   color: "text-yellow-600 dark:text-yellow-400" },
              { label: "Confirmed", count: reservations.filter((r) => r.status === "Confirmed").length, color: "text-emerald-600 dark:text-emerald-400" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl p-4 bg-white dark:bg-[#1a0f2e] border border-gray-200 dark:border-purple-900/50 text-center">
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {filteredReservations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed border-gray-200 dark:border-purple-900/50 bg-white dark:bg-[#1a0f2e]/50">
              <Calendar className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No reservations found.</p>
            </div>
          )}

          {filteredReservations.length > 0 && (
            <>
              <div className="hidden md:block rounded-2xl border border-gray-200 dark:border-purple-900/50 bg-white dark:bg-[#1a0f2e] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5">
                      <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Employee</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Menu Item</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-400">Qty</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-600 dark:text-gray-400">Total</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-400">Date &amp; Time</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-600 dark:text-gray-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                    {filteredReservations.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 dark:text-white">{r.employeeName}</p>
                          <p className="text-xs text-gray-400">{r.phone}</p>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{r.menuItemName}</td>
                        <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">{r.servings}</td>
                        <td className="px-4 py-3 text-right font-semibold text-[#7C3AED]">₱{r.total.toLocaleString("en-PH")}</td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{r.createdAt}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(r.status)}`}>
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {filteredReservations.map((r) => (
                  <div key={r.id} className="rounded-2xl border border-gray-200 dark:border-purple-900/50 bg-white dark:bg-[#1a0f2e] p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{r.employeeName}</p>
                        <p className="text-xs text-gray-400">{r.phone}</p>
                      </div>
                      <span className={`shrink-0 px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(r.status)}`}>
                        {r.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{r.menuItemName}</span>
                      <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        <UtensilsCrossed className="w-3.5 h-3.5" />
                        <span>{r.servings} serving{r.servings > 1 ? "s" : ""}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{r.createdAt}</span>
                      <span className="font-bold text-[#7C3AED]">₱{r.total.toLocaleString("en-PH")}</span>
                    </div>
                    {r.notes && (
                      <p className="text-xs text-gray-400 border-t border-gray-100 dark:border-white/5 pt-2">Note: {r.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          ADD / EDIT DIALOG
      ═══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-[#110228] border-gray-200 dark:border-purple-900/40 p-0 gap-0">

          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100 dark:border-white/10">
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              {isEditing ? "Edit Menu Item" : "Add Menu Item"}
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-5 space-y-5">

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g. Chicken Adobo"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="h-12 rounded-xl bg-gray-50 dark:bg-[#1c0f35] border-gray-200 dark:border-purple-900/40 dark:text-white dark:placeholder:text-gray-500 focus-visible:ring-[#7C3AED]"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">Description</label>
              <textarea
                placeholder="Describe the dish..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-purple-900/40 bg-gray-50 dark:bg-[#1c0f35] text-gray-900 dark:text-white text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/50 resize-none transition-colors"
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">Category</label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm((f) => ({ ...f, category: v as MenuCategory }))}
              >
                <SelectTrigger className="h-12 rounded-xl bg-gray-50 dark:bg-[#1c0f35] border-gray-200 dark:border-purple-900/40 dark:text-white focus:ring-[#7C3AED]">
                  <SelectValue placeholder="e.g. Main Course" />
                </SelectTrigger>
                <SelectContent className="dark:bg-[#1c0f35] dark:border-purple-900/50">
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat} className="dark:text-gray-200 dark:focus:bg-purple-900/30 dark:focus:text-white">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price + Total Servings — 2 columns */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Price (₱) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number" min="0" step="0.01" placeholder="0.00"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className="h-12 rounded-xl bg-gray-50 dark:bg-[#1c0f35] border-gray-200 dark:border-purple-900/40 dark:text-white dark:placeholder:text-gray-500 focus-visible:ring-[#7C3AED]"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Total Servings <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number" min="1" placeholder="e.g. 50"
                  value={form.totalServings}
                  onChange={(e) => setForm((f) => ({ ...f, totalServings: e.target.value }))}
                  className="h-12 rounded-xl bg-gray-50 dark:bg-[#1c0f35] border-gray-200 dark:border-purple-900/40 dark:text-white dark:placeholder:text-gray-500 focus-visible:ring-[#7C3AED]"
                />
              </div>
            </div>

            {/* Available toggle */}
            <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-purple-900/40 bg-gray-50 dark:bg-[#1c0f35] px-4 py-3.5">
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">Available</span>
              <Switch
                checked={form.isAvailable}
                onCheckedChange={(v) => setForm((f) => ({ ...f, isAvailable: v }))}
                className="data-[state=checked]:bg-[#7C3AED]"
              />
            </div>

          </div>

          <div className="px-6 pb-6">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full h-12 rounded-xl bg-[#7C3AED] hover:bg-[#6d28d9] active:bg-[#5b21b6] text-white font-semibold text-base transition-colors"
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                isEditing ? "Save Changes" : "Create Item"
              )}
            </Button>
          </div>

        </DialogContent>
      </Dialog>

    </div>
  )
}
