"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Search,
  Plus,
  Users,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Edit,
  Trash2,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import { useLocalCustomers } from "@/hooks/use-local-data"
import { localDb } from "@/lib/local-first-service"
import type { LocalCustomer } from "@/lib/db"
import Swal from "sweetalert2"

// ==================== Toast ====================

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  showClass: {
    popup: "animate__animated animate__slideInRight animate__faster",
  },
  hideClass: {
    popup: "animate__animated animate__slideOutRight animate__faster",
  },
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer
    toast.onmouseleave = Swal.resumeTimer
  },
  customClass: {
    popup: "colored-toast",
    timerProgressBar: "toast-progress-bar",
  },
})

// ==================== Types ====================

type CustomerForm = {
  name: string
  email: string
  phone: string
  status: "active" | "inactive"
}

const emptyForm: CustomerForm = {
  name: "",
  email: "",
  phone: "",
  status: "active",
}

// ==================== Sync Status Icon ====================

function SyncStatusIcon({ status, error }: { status: string; error?: string }) {
  if (status === "synced") {
    return (
      <span title="Synced with server">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
      </span>
    )
  }
  if (status === "created" || status === "updated") {
    return (
      <span title="Pending sync">
        <Clock className="h-4 w-4 text-orange-500" />
      </span>
    )
  }
  if (error) {
    return (
      <span title={`Sync failed: ${error}`}>
        <AlertCircle className="h-4 w-4 text-red-500" />
      </span>
    )
  }
  return null
}

// ==================== Page Component ====================

export default function CustomersPage() {
  const { data: customers, isLoading, dirtyCount } = useLocalCustomers()

  const [searchQuery, setSearchQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<LocalCustomer | null>(null)
  const [form, setForm] = useState<CustomerForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<LocalCustomer | null>(null)
  const [deleting, setDeleting] = useState(false)

  // ==================== Computed Stats ====================

  const stats = useMemo(() => {
    const total = customers.length
    const active = customers.filter((c) => c.status === "active").length
    const inactive = customers.filter((c) => c.status === "inactive").length
    return { total, active, inactive }
  }, [customers])

  // ==================== Filtered Customers ====================

  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) return customers
    const q = searchQuery.toLowerCase()
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.phone && c.phone.toLowerCase().includes(q))
    )
  }, [customers, searchQuery])

  // ==================== Handlers ====================

  function openCreateDialog() {
    setEditingCustomer(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  function openEditDialog(customer: LocalCustomer) {
    setEditingCustomer(customer)
    setForm({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone || "",
      status: (customer.status === "inactive" ? "inactive" : "active") as "active" | "inactive",
    })
    setDialogOpen(true)
  }

  function openDeleteDialog(customer: LocalCustomer) {
    setCustomerToDelete(customer)
    setDeleteDialogOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) {
      Toast.fire({ icon: "warning", title: "Name is required", iconColor: "#f59e0b", background: "#fffbeb", color: "#92400e" })
      return
    }

    setSaving(true)
    try {
      if (editingCustomer) {
        await localDb.customers.update(editingCustomer.id, {
          name: form.name.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          status: form.status,
        })
        Toast.fire({ icon: "success", title: "Customer updated", iconColor: "#10b981", background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)", color: "#065f46" })
      } else {
        await localDb.customers.create({
          name: form.name.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          status: form.status,
        })
        Toast.fire({ icon: "success", title: "Customer created", iconColor: "#10b981", background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)", color: "#065f46" })
      }
      setDialogOpen(false)
    } catch (err: any) {
      console.error("Failed to save customer:", err)
      Toast.fire({ icon: "error", title: "Failed to save customer", text: err?.message || "Unknown error", iconColor: "#ef4444", background: "#fef2f2", color: "#991b1b" })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!customerToDelete) return
    setDeleting(true)
    try {
      await localDb.customers.delete(customerToDelete.id)
      Toast.fire({ icon: "success", title: "Customer deleted", iconColor: "#10b981", background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)", color: "#065f46" })
      setDeleteDialogOpen(false)
      setCustomerToDelete(null)
    } catch (err: any) {
      console.error("Failed to delete customer:", err)
      Toast.fire({ icon: "error", title: "Failed to delete customer", text: err?.message || "Unknown error", iconColor: "#ef4444", background: "#fef2f2", color: "#991b1b" })
    } finally {
      setDeleting(false)
    }
  }

  async function handleRefresh() {
    try {
      await localDb.customers.pullFresh()
      Toast.fire({ icon: "success", title: "Customers refreshed", iconColor: "#10b981", background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)", color: "#065f46" })
    } catch (err: any) {
      console.error("Failed to refresh customers:", err)
      Toast.fire({ icon: "error", title: "Failed to refresh", text: err?.message || "Unknown error", iconColor: "#ef4444", background: "#fef2f2", color: "#991b1b" })
    }
  }

  // ==================== Status Badge Renderer ====================

  function StatusBadge({ status }: { status: string }) {
    if (status === "active") {
      return (
        <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30">
          Active
        </Badge>
      )
    }
    return (
      <Badge className="bg-gray-100 dark:bg-[#1a1a35] text-gray-800 dark:text-[#e0e0f0] hover:bg-gray-100 dark:hover:bg-[#1a1a35]">
        Inactive
      </Badge>
    )
  }

  // ==================== Loading State ====================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <span className="ml-3 text-gray-600 dark:text-[#b4b4d0]">Loading customers...</span>
      </div>
    )
  }

  // ==================== Render ====================

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
            <Users className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Customers</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-[#b4b4d0] mt-0.5 sm:mt-1">
              Manage your customer relationships
              {dirtyCount > 0 && (
                <span className="ml-2 text-orange-500 text-xs font-medium">
                  ({dirtyCount} pending sync)
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="flex-1 sm:flex-none"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            className="bg-purple-600 hover:bg-purple-700 flex-1 sm:flex-none"
            onClick={openCreateDialog}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-white dark:bg-[#13132a] p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0]">Total Customers</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-1">
                {stats.total}
              </p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/30 p-2 sm:p-3 rounded-lg">
              <Users className="h-4 w-4 sm:h-6 sm:w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#13132a] p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0]">Active</p>
              <p className="text-xl sm:text-2xl font-bold text-green-600 mt-0.5 sm:mt-1">
                {stats.active}
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 p-2 sm:p-3 rounded-lg">
              <UserCheck className="h-4 w-4 sm:h-6 sm:w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#13132a] p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0]">Inactive</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-600 dark:text-[#b4b4d0] mt-0.5 sm:mt-1">
                {stats.inactive}
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800/50 p-2 sm:p-3 rounded-lg">
              <UserX className="h-4 w-4 sm:h-6 sm:w-6 text-gray-500 dark:text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-[#9898b8]" />
        <Input
          placeholder="Search customers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Empty State */}
      {filteredCustomers.length === 0 && (
        <div className="bg-white dark:bg-[#13132a] rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm p-12 text-center">
          <Users className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-[#b4b4d0] text-lg font-medium">
            {searchQuery ? "No customers match your search" : "No customers yet"}
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1 mb-4">
            {searchQuery ? "Try a different search term" : "Add your first customer to get started"}
          </p>
          {!searchQuery && (
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Add Customer
            </Button>
          )}
        </div>
      )}

      {/* Customers Table - Desktop */}
      {filteredCustomers.length > 0 && (
        <div className="hidden md:block bg-white dark:bg-[#13132a] rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-[#1a1a35] border-b border-gray-200 dark:border-[#2d1b69]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#b4b4d0] uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#b4b4d0] uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#b4b4d0] uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#b4b4d0] uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#b4b4d0] uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#b4b4d0] uppercase tracking-wider">
                    Sync
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#b4b4d0] uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#13132a] divide-y divide-gray-200 dark:divide-[#2d1b69]">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-[#1a1a35]">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 font-semibold">
                            {customer.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {customer.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {customer.email && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-[#b4b4d0]">
                            <Mail className="h-3 w-3 mr-1" />
                            {customer.email}
                          </div>
                        )}
                        {customer.phone && (
                          <div className="flex items-center text-sm text-gray-600 dark:text-[#b4b4d0]">
                            <Phone className="h-3 w-3 mr-1" />
                            {customer.phone}
                          </div>
                        )}
                        {!customer.email && !customer.phone && (
                          <span className="text-sm text-gray-400 dark:text-gray-600">No contact info</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {customer.orders_count ?? 0} orders
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {typeof customer.total_spent === "number"
                          ? `\u20B1${customer.total_spent.toLocaleString()}`
                          : "\u20B10"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={customer.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <SyncStatusIcon
                        status={customer._status}
                        error={customer._syncError}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(customer)}
                          title="Edit customer"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openDeleteDialog(customer)}
                          title="Delete customer"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Customers Cards - Mobile */}
      {filteredCustomers.length > 0 && (
        <div className="md:hidden space-y-3">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white dark:bg-[#13132a] p-4 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 h-10 w-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-semibold text-sm">
                      {customer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {customer.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-[#b4b4d0] mt-0.5">
                      {customer.orders_count ?? 0} orders
                      {typeof customer.total_spent === "number" && customer.total_spent > 0
                        ? ` \u2022 \u20B1${customer.total_spent.toLocaleString()}`
                        : ""}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <SyncStatusIcon
                    status={customer._status}
                    error={customer._syncError}
                  />
                  <StatusBadge status={customer.status} />
                </div>
              </div>

              <div className="space-y-1 text-sm mb-3">
                {customer.email && (
                  <div className="flex items-center text-gray-600 dark:text-[#b4b4d0]">
                    <Mail className="h-3 w-3 mr-2 flex-shrink-0" />
                    <span className="truncate">{customer.email}</span>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center text-gray-600 dark:text-[#b4b4d0]">
                    <Phone className="h-3 w-3 mr-2 flex-shrink-0" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                {!customer.email && !customer.phone && (
                  <div className="text-gray-400 dark:text-gray-600 text-xs">No contact info</div>
                )}
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-[#2d1b69]">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => openEditDialog(customer)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-red-500 border-red-200 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => openDeleteDialog(customer)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="dark:bg-[#13132a] dark:border-[#2d1b69]">
          <DialogHeader>
            <DialogTitle className="dark:text-white">
              {editingCustomer ? "Edit Customer" : "Add Customer"}
            </DialogTitle>
            <DialogDescription className="dark:text-[#b4b4d0]">
              {editingCustomer
                ? "Update the customer details below."
                : "Fill in the details to create a new customer."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Name */}
            <div className="space-y-2">
              <Label className="dark:text-[#b4b4d0]">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Customer name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="dark:bg-[#1a1a35] dark:border-[#2d1b69] dark:text-white"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label className="dark:text-[#b4b4d0]">Email</Label>
              <Input
                type="email"
                placeholder="customer@email.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="dark:bg-[#1a1a35] dark:border-[#2d1b69] dark:text-white"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label className="dark:text-[#b4b4d0]">Phone</Label>
              <Input
                type="tel"
                placeholder="+63 912 345 6789"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="dark:bg-[#1a1a35] dark:border-[#2d1b69] dark:text-white"
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="dark:text-[#b4b4d0]">Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm((f) => ({ ...f, status: value as "active" | "inactive" }))
                }
              >
                <SelectTrigger className="w-full dark:bg-[#1a1a35] dark:border-[#2d1b69] dark:text-white">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="dark:bg-[#1a1a35] dark:border-[#2d1b69]">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              onClick={handleSave}
              disabled={saving}
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingCustomer ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="dark:bg-[#13132a] dark:border-[#2d1b69] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Delete Customer</DialogTitle>
            <DialogDescription className="dark:text-[#b4b4d0]">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {customerToDelete?.name}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
