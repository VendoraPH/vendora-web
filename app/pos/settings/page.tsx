"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Store,
  Bell,
  Lock,
  CreditCard,
  Users,
  Printer,
  Globe,
  Loader2,
  AlertCircle,
  RefreshCw,
  UserPlus,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { storeService, storeStaffService } from "@/services"
import type { ApiStore, StoreStaffMember, StoreRole } from "@/services"
import { useOfflineData } from "@/hooks/use-offline-data"
import { StaleDataBanner } from "@/components/pos/StaleDataBanner"
import { getOnlineStatus } from "@/lib/sync-service"
import Swal from "sweetalert2"

export default function SettingsPage() {
  const [saving, setSaving] = useState(false)

  // Staff management state
  const [showStaffPanel, setShowStaffPanel] = useState(false)
  const [staffEmail, setStaffEmail] = useState("")
  const [staffRole, setStaffRole] = useState("cashier")
  const [addingStaff, setAddingStaff] = useState(false)
  const [staffError, setStaffError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<number | null>(null)

  // Form state
  const [storeName, setStoreName] = useState("")
  const [storeEmail, setStoreEmail] = useState("")
  const [storePhone, setStorePhone] = useState("")
  const [storeAddress, setStoreAddress] = useState("")

  const { data: settingsData, isLoading: loading, isStale, lastSyncedAt, error, refresh } = useOfflineData<{
    store: ApiStore | null;
    staff: StoreStaffMember[];
    roles: StoreRole[];
  }>(
    "settings-data",
    async () => {
      const storesRaw = await storeService.getAll()
      const stores = Array.isArray(storesRaw) ? storesRaw : (storesRaw as any).data || []
      const firstStore = stores[0] ?? null
      let staff: StoreStaffMember[] = [], roles: StoreRole[] = []
      if (firstStore) {
        try {
          [staff, roles] = await Promise.all([
            storeStaffService.getStaff(firstStore.id),
            storeStaffService.getRoles(),
          ])
        } catch {}
      }
      return {
        store: firstStore,
        staff: Array.isArray(staff) ? staff : [],
        roles: Array.isArray(roles) ? roles : [],
      }
    },
    { staleAfterMinutes: 60 }
  )

  const store = settingsData?.store ?? null
  const [staffMembers, setStaffMembers] = useState<StoreStaffMember[]>([])
  const [roles, setRoles] = useState<StoreRole[]>([])

  useEffect(() => {
    if (settingsData) {
      setStaffMembers(settingsData.staff)
      setRoles(settingsData.roles)
      if (settingsData.store) {
        setStoreName(settingsData.store.name || "")
        setStoreAddress(settingsData.store.address || "")
      }
    }
  }, [settingsData])

  const handleSave = async () => {
    if (!store) return
    if (!getOnlineStatus()) {
      Swal.fire({ icon: "info", title: "Unavailable Offline", text: "Settings cannot be saved while offline." })
      return
    }
    setSaving(true)
    try {
      await storeService.update(store.id, {
        name: storeName,
        address: storeAddress,
      })
    } catch (err: any) {
      console.error("Failed to save store:", err)
      alert(err?.message || "Failed to save changes")
    } finally {
      setSaving(false)
    }
  }

  const handleAddStaff = async () => {
    if (!store || !staffEmail.trim()) return
    if (!getOnlineStatus()) {
      Swal.fire({ icon: "info", title: "Unavailable Offline", text: "Staff cannot be added while offline." })
      return
    }
    setAddingStaff(true)
    setStaffError(null)
    try {
      const newMember = await storeStaffService.addStaff(store.id, {
        email: staffEmail.trim(),
        role: staffRole,
      })
      setStaffMembers(prev => [...prev, newMember])
      setStaffEmail("")
      setStaffRole("cashier")
    } catch (err: any) {
      const msg = err?.response?.data?.message
        || Object.values(err?.response?.data?.errors || {}).flat().join(", ")
        || err?.message
        || "Failed to add staff member"
      setStaffError(msg)
    } finally {
      setAddingStaff(false)
    }
  }

  const handleRemoveStaff = async (userId: number) => {
    if (!store) return
    if (!getOnlineStatus()) {
      Swal.fire({ icon: "info", title: "Unavailable Offline", text: "Staff cannot be removed while offline." })
      return
    }
    setRemovingId(userId)
    try {
      await storeStaffService.removeStaff(store.id, userId)
      setStaffMembers(prev => prev.filter(s => s.id !== userId))
    } catch (err: any) {
      alert(err?.message || "Failed to remove staff member")
    } finally {
      setRemovingId(null)
    }
  }

  const activeStaff = staffMembers.filter(s => s.status !== "inactive").length

  const availableRoles = roles.length > 0
    ? roles.map(r => r.name)
    : ["cashier", "manager", "supervisor"]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (error && !settingsData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] gap-4">
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
      {!getOnlineStatus() && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 text-blue-700 text-xs">
          Read-only mode — settings cannot be saved while offline
        </div>
      )}
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-[#b4b4d0] mt-0.5 sm:mt-1">Manage your store settings and preferences</p>
      </div>

      {/* Settings Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Store Information */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <div className="bg-white dark:bg-[#13132a] rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
                <Store className="h-5 w-5 text-purple-600" />
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Store Information</h2>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="storeName">Store Name</Label>
                <Input
                  id="storeName"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={storeEmail}
                  onChange={(e) => setStoreEmail(e.target.value)}
                  placeholder="vendor@example.com"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                  placeholder="+63 912 345 6789"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="address">Business Address</Label>
                <Input
                  id="address"
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  className="mt-1.5"
                />
              </div>
              <Button
                className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto"
                onClick={handleSave}
                disabled={saving}
              >
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white dark:bg-[#13132a] rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Notifications</h2>
            </div>
            <div className="space-y-4">
              {[
                { name: "Order Notifications", desc: "Receive alerts for new orders", checked: true },
                { name: "Low Stock Alerts", desc: "Get notified when products are running low", checked: true },
                { name: "Payment Notifications", desc: "Receive payment confirmation alerts", checked: true },
                { name: "Marketing Updates", desc: "Get updates about promotions and campaigns", checked: false },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white text-sm sm:text-base">{item.name}</div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0]">{item.desc}</p>
                  </div>
                  <Switch defaultChecked={item.checked} />
                </div>
              ))}
            </div>
          </div>

          {/* Security */}
          <div className="bg-white dark:bg-[#13132a] rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-lg">
                <Lock className="h-5 w-5 text-red-600" />
              </div>
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Security</h2>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" className="mt-1.5" />
              </div>
              <Button variant="outline" className="w-full sm:w-auto">Update Password</Button>
            </div>
          </div>
        </div>

        {/* Right Column - Quick Settings */}
        <div className="space-y-4 sm:space-y-6">
          {/* Payment Settings */}
          <div className="bg-white dark:bg-[#13132a] rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                <CreditCard className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Payment Methods</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-[#e0e0f0]">Cash</span>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-[#e0e0f0]">Card</span>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-[#e0e0f0]">Online Payment</span>
                <Switch defaultChecked />
              </div>
            </div>
            <Button className="w-full mt-4" variant="outline" size="sm">
              Configure
            </Button>
          </div>

          {/* Staff Management */}
          <div className="bg-white dark:bg-[#13132a] rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm p-4 sm:p-6">
            <button
              className="flex items-center justify-between w-full mb-2"
              onClick={() => setShowStaffPanel(v => !v)}
            >
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg">
                  <Users className="h-5 w-5 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Staff & Roles</h3>
              </div>
              {showStaffPanel
                ? <ChevronUp className="h-4 w-4 text-gray-500" />
                : <ChevronDown className="h-4 w-4 text-gray-500" />
              }
            </button>

            <div className="flex justify-between text-sm mb-3">
              <span className="text-gray-600 dark:text-[#b4b4d0]">Total Staff</span>
              <span className="font-semibold dark:text-white">{staffMembers.length}</span>
            </div>
            <div className="flex justify-between text-sm mb-4">
              <span className="text-gray-600 dark:text-[#b4b4d0]">Active</span>
              <span className="font-semibold text-green-600">{activeStaff}</span>
            </div>

            {showStaffPanel && (
              <div className="space-y-4 border-t border-gray-100 dark:border-[#2d1b69] pt-4">
                {/* Add staff form */}
                <div className="space-y-2">
                  <Label className="text-sm">Add Staff Member</Label>
                  <Input
                    type="email"
                    placeholder="staff@example.com"
                    value={staffEmail}
                    onChange={e => setStaffEmail(e.target.value)}
                    className="text-sm"
                  />
                  <select
                    value={staffRole}
                    onChange={e => setStaffRole(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-[#2d1b69] dark:bg-[#13132a] dark:text-white rounded-lg text-sm"
                  >
                    {availableRoles.map(r => (
                      <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                    ))}
                  </select>
                  {staffError && (
                    <p className="text-xs text-red-500">{staffError}</p>
                  )}
                  <Button
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    size="sm"
                    onClick={handleAddStaff}
                    disabled={addingStaff || !staffEmail.trim()}
                  >
                    {addingStaff
                      ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      : <UserPlus className="w-4 h-4 mr-2" />
                    }
                    Add Staff
                  </Button>
                </div>

                {/* Staff list */}
                {staffMembers.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm">Current Staff</Label>
                    {staffMembers.map(member => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between bg-gray-50 dark:bg-[#1a1a3a] rounded-lg px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium dark:text-white truncate">
                            {member.name || member.email}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-[#b4b4d0] truncate">
                            {member.name ? member.email : ""}{member.role ? ` · ${member.role}` : ""}
                          </p>
                        </div>
                        <button
                          className="ml-2 shrink-0 text-red-400 hover:text-red-600 disabled:opacity-40"
                          onClick={() => handleRemoveStaff(member.id)}
                          disabled={removingId === member.id}
                        >
                          {removingId === member.id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Trash2 className="w-4 h-4" />
                          }
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {staffMembers.length === 0 && (
                  <p className="text-xs text-center text-gray-400 dark:text-[#b4b4d0] py-2">
                    No staff members yet
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Printer Settings */}
          <div className="bg-white dark:bg-[#13132a] rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
                <Printer className="h-5 w-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Receipt Printer</h3>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0] mb-4">Configure receipt printing settings</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-[#e0e0f0]">Auto Print</span>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-[#e0e0f0]">Show Logo</span>
                <Switch defaultChecked />
              </div>
            </div>
            <Button className="w-full mt-4" variant="outline" size="sm">
              Test Print
            </Button>
          </div>

          {/* Language & Region */}
          <div className="bg-white dark:bg-[#13132a] rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                <Globe className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Language & Region</h3>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="language" className="text-sm">Language</Label>
                <select id="language" className="w-full mt-1.5 px-3 py-2 border border-gray-200 dark:border-[#2d1b69] dark:bg-[#13132a] dark:text-white rounded-lg text-sm">
                  <option>English</option>
                  <option>Filipino</option>
                </select>
              </div>
              <div>
                <Label htmlFor="currency" className="text-sm">Currency</Label>
                <select id="currency" className="w-full mt-1.5 px-3 py-2 border border-gray-200 dark:border-[#2d1b69] dark:bg-[#13132a] dark:text-white rounded-lg text-sm">
                  <option>PHP (₱)</option>
                  <option>USD ($)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
