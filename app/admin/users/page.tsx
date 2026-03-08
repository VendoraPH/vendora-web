"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/admin/layout/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
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
    Search,
    MoreVertical,
    Users,
    UserCheck,
    UserX,
    Shield,
    Store,
    ShoppingBag,
    Filter,
    Mail,
    Plus,
    Pencil,
    Trash2,
    Loader2,
    AlertCircle,
    RefreshCcw,
} from "lucide-react"
import {
    adminUserService,
    type AdminUser,
    type AdminUserCreatePayload,
    type AdminUserUpdatePayload,
} from "@/services"

export default function UsersPage() {
    // Data state
    const [users, setUsers] = useState<AdminUser[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Filter state
    const [searchQuery, setSearchQuery] = useState("")
    const [typeFilter, setTypeFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState("all")
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalUsers, setTotalUsers] = useState(0)

    // Dialog states
    const [createOpen, setCreateOpen] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)

    // Create form state
    const [createForm, setCreateForm] = useState<AdminUserCreatePayload>({
        name: "",
        email: "",
        password: "",
        user_type: "buyer",
    })

    // Edit form state
    const [editForm, setEditForm] = useState<AdminUserUpdatePayload>({
        name: "",
        email: "",
        user_type: "buyer",
    })

    // Load users from API
    const loadUsers = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        try {
            const params: Record<string, string | number> = { per_page: 20, page }
            if (searchQuery) params.search = searchQuery
            if (typeFilter !== "all") params.user_type = typeFilter
            if (statusFilter !== "all") params.status = statusFilter

            const response = await adminUserService.getAll(params)

            // Handle both array and paginated responses
            if (Array.isArray(response)) {
                setUsers(response)
                setTotalUsers(response.length)
                setTotalPages(1)
            } else if (response?.data && Array.isArray(response.data)) {
                setUsers(response.data)
                setTotalUsers(response.meta?.total ?? response.data.length)
                setTotalPages(Math.ceil((response.meta?.total ?? response.data.length) / (response.meta?.per_page ?? 20)))
            } else {
                // Might be unwrapped array from api-client
                const arr = response as unknown
                if (Array.isArray(arr)) {
                    setUsers(arr as AdminUser[])
                    setTotalUsers((arr as AdminUser[]).length)
                    setTotalPages(1)
                } else {
                    setUsers([])
                    setTotalUsers(0)
                }
            }
        } catch (err: any) {
            console.error("Failed to load users:", JSON.stringify(err, null, 2))
            setError(err?.message || "Failed to load users")
        } finally {
            setIsLoading(false)
        }
    }, [searchQuery, typeFilter, statusFilter, page])

    useEffect(() => {
        loadUsers()
    }, [loadUsers])

    // Debounced search
    useEffect(() => {
        setPage(1)
    }, [searchQuery, typeFilter, statusFilter])

    // Create user
    const handleCreate = async () => {
        setIsSubmitting(true)
        setFormError(null)
        try {
            await adminUserService.create(createForm)
            setCreateOpen(false)
            setCreateForm({ name: "", email: "", password: "", user_type: "buyer" })
            loadUsers()
        } catch (err: any) {
            const validationErrors = err?.errors
                ? Object.values(err.errors).flat().join(", ")
                : ""
            setFormError(validationErrors || err?.message || "Failed to create user")
        } finally {
            setIsSubmitting(false)
        }
    }

    // Update user
    const handleUpdate = async () => {
        if (!selectedUser) return
        setIsSubmitting(true)
        setFormError(null)
        try {
            await adminUserService.update(selectedUser.id, editForm)
            setEditOpen(false)
            setSelectedUser(null)
            loadUsers()
        } catch (err: any) {
            const validationErrors = err?.errors
                ? Object.values(err.errors).flat().join(", ")
                : ""
            setFormError(validationErrors || err?.message || "Failed to update user")
        } finally {
            setIsSubmitting(false)
        }
    }

    // Delete user
    const handleDelete = async () => {
        if (!selectedUser) return
        setIsSubmitting(true)
        setFormError(null)
        try {
            await adminUserService.delete(selectedUser.id)
            setDeleteOpen(false)
            setSelectedUser(null)
            loadUsers()
        } catch (err: any) {
            setFormError(err?.message || "Failed to delete user")
        } finally {
            setIsSubmitting(false)
        }
    }

    // Update status
    const handleStatusUpdate = async (user: AdminUser, newStatus: "active" | "inactive" | "suspended") => {
        try {
            await adminUserService.updateStatus(user.id, newStatus)
            loadUsers()
        } catch (err: any) {
            setError(err?.message || "Failed to update status")
        }
    }

    // Open edit dialog
    const openEditDialog = (user: AdminUser) => {
        setSelectedUser(user)
        setEditForm({
            name: user.name,
            email: user.email,
            user_type: user.user_type,
        })
        setFormError(null)
        setEditOpen(true)
    }

    // Open delete dialog
    const openDeleteDialog = (user: AdminUser) => {
        setSelectedUser(user)
        setFormError(null)
        setDeleteOpen(true)
    }

    // Stats
    const vendorCount = users.filter(u => u.user_type === "vendor").length
    const buyerCount = users.filter(u => u.user_type === "buyer").length
    const adminCount = users.filter(u => u.user_type === "admin").length

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "active":
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>
            case "inactive":
                return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">Inactive</Badge>
            case "suspended":
                return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Suspended</Badge>
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    const getUserTypeBadge = (type: string) => {
        switch (type) {
            case "admin":
                return (
                    <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                        <Shield className="w-3 h-3 mr-1" />
                        Admin
                    </Badge>
                )
            case "vendor":
                return (
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                        <Store className="w-3 h-3 mr-1" />
                        Vendor
                    </Badge>
                )
            case "buyer":
                return (
                    <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                        <ShoppingBag className="w-3 h-3 mr-1" />
                        Buyer
                    </Badge>
                )
            default:
                return <Badge variant="outline">{type}</Badge>
        }
    }

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "—"
        try {
            return new Date(dateStr).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
            })
        } catch {
            return dateStr
        }
    }

    return (
        <DashboardLayout>
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Users Management</h1>
                    <p className="text-muted-foreground mt-2">
                        View and manage all platform users including admins, vendors, and buyers
                    </p>
                </div>
                <Button onClick={() => { setCreateForm({ name: "", email: "", password: "", user_type: "buyer" }); setFormError(null); setCreateOpen(true) }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add User
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalUsers}</div>
                        <p className="text-xs text-muted-foreground">All platform users</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Vendors</CardTitle>
                        <Store className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{vendorCount}</div>
                        <p className="text-xs text-muted-foreground">Active store owners</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Buyers</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{buyerCount}</div>
                        <p className="text-xs text-muted-foreground">Registered customers</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Admins</CardTitle>
                        <Shield className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{adminCount}</div>
                        <p className="text-xs text-muted-foreground">Platform administrators</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>All Users</CardTitle>
                            <CardDescription>
                                View and manage user accounts across the platform
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={loadUsers} disabled={isLoading}>
                            <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                    </div>

                    {/* Filters and Search */}
                    <div className="flex flex-wrap items-center gap-4 mt-4">
                        <div className="relative flex-1 min-w-[200px] max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-[150px]">
                                <Filter className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="User Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="admin">Admins</SelectItem>
                                <SelectItem value="vendor">Vendors</SelectItem>
                                <SelectItem value="buyer">Buyers</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                                <SelectItem value="suspended">Suspended</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Error state */}
                    {error && (
                        <div className="flex items-center gap-2 p-4 mb-4 rounded-lg bg-red-50 text-red-700 border border-red-200">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span className="text-sm">{error}</span>
                            <Button variant="ghost" size="sm" className="ml-auto text-red-700" onClick={loadUsers}>
                                Retry
                            </Button>
                        </div>
                    )}

                    {/* Loading state */}
                    {isLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Registered</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                No users found
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        users.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-semibold">
                                                            {user.name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium">{user.name}</p>
                                                            <p className="text-xs text-muted-foreground">ID: {user.id}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                                        {user.email}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{getUserTypeBadge(user.user_type)}</TableCell>
                                                <TableCell>{getStatusBadge(user.status)}</TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {formatDate(user.created_at)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                Edit User
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            {user.status !== "active" && (
                                                                <DropdownMenuItem
                                                                    className="text-green-600"
                                                                    onClick={() => handleStatusUpdate(user, "active")}
                                                                >
                                                                    <UserCheck className="mr-2 h-4 w-4" />
                                                                    Activate
                                                                </DropdownMenuItem>
                                                            )}
                                                            {user.status !== "inactive" && (
                                                                <DropdownMenuItem
                                                                    className="text-gray-600"
                                                                    onClick={() => handleStatusUpdate(user, "inactive")}
                                                                >
                                                                    <UserX className="mr-2 h-4 w-4" />
                                                                    Deactivate
                                                                </DropdownMenuItem>
                                                            )}
                                                            {user.status !== "suspended" && (
                                                                <DropdownMenuItem
                                                                    className="text-orange-600"
                                                                    onClick={() => handleStatusUpdate(user, "suspended")}
                                                                >
                                                                    <UserX className="mr-2 h-4 w-4" />
                                                                    Suspend
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-red-600"
                                                                onClick={() => openDeleteDialog(user)}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete User
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                    <p className="text-sm text-muted-foreground">
                                        Page {page} of {totalPages} ({totalUsers} users)
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page <= 1}
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={page >= totalPages}
                                            onClick={() => setPage(p => p + 1)}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Create User Dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create New User</DialogTitle>
                        <DialogDescription>
                            Add a new user to the platform. They will receive login credentials.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        {formError && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                {formError}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="create-name">Full Name</Label>
                            <Input
                                id="create-name"
                                placeholder="John Doe"
                                value={createForm.name}
                                onChange={(e) => setCreateForm(f => ({ ...f, name: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-email">Email</Label>
                            <Input
                                id="create-email"
                                type="email"
                                placeholder="john@example.com"
                                value={createForm.email}
                                onChange={(e) => setCreateForm(f => ({ ...f, email: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-password">Password</Label>
                            <Input
                                id="create-password"
                                type="password"
                                placeholder="Minimum 8 characters"
                                value={createForm.password}
                                onChange={(e) => setCreateForm(f => ({ ...f, password: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-type">User Type</Label>
                            <Select
                                value={createForm.user_type}
                                onValueChange={(v) => setCreateForm(f => ({ ...f, user_type: v as "admin" | "vendor" | "buyer" }))}
                            >
                                <SelectTrigger id="create-type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="buyer">Buyer</SelectItem>
                                    <SelectItem value="vendor">Vendor</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreate}
                            disabled={isSubmitting || !createForm.name || !createForm.email || !createForm.password}
                        >
                            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Create User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit User Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>
                            Update user information for {selectedUser?.name}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        {formError && (
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                {formError}
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Full Name</Label>
                            <Input
                                id="edit-name"
                                value={editForm.name}
                                onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                                id="edit-email"
                                type="email"
                                value={editForm.email}
                                onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-type">User Type</Label>
                            <Select
                                value={editForm.user_type}
                                onValueChange={(v) => setEditForm(f => ({ ...f, user_type: v as "admin" | "vendor" | "buyer" }))}
                            >
                                <SelectTrigger id="edit-type">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="buyer">Buyer</SelectItem>
                                    <SelectItem value="vendor">Vendor</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditOpen(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdate}
                            disabled={isSubmitting || !editForm.name || !editForm.email}
                        >
                            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Delete User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{selectedUser?.name}</strong>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    {formError && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200 text-sm">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {formError}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isSubmitting}
                        >
                            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Delete User
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    )
}
