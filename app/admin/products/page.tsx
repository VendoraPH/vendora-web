"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/admin/layout/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Search,
    MoreVertical,
    Package,
    Eye,
    Store,
    Filter,
    AlertTriangle,
    CheckCircle,
    XCircle,
    TrendingUp,
    Loader2,
    AlertCircle,
    RefreshCw,
} from "lucide-react"
import { productService, type ApiProduct } from "@/services"

const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(price)

const getStockStatus = (stock: number) => {
    if (stock === 0) return "out_of_stock"
    if (stock <= 5) return "low_stock"
    return "in_stock"
}

const getProductImageUrl = (product: ApiProduct): string | null => {
    return (product as any).image_url || product.image || null
}

export default function ProductsPage() {
    const [products, setProducts] = useState<ApiProduct[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")

    const fetchProducts = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await productService.getAll({ per_page: 100 })
            const data = Array.isArray(res) ? res : (res as any).data || []
            setProducts(data)
        } catch (err: any) {
            console.error("Failed to load products:", err)
            setError(err?.message || "Failed to load products")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchProducts()
    }, [fetchProducts])

    const filteredProducts = products.filter((product) => {
        const stock = product.stock ?? 0
        const stockStatus = getStockStatus(stock)
        const matchesSearch =
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (product.sku || "").toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === "all" || stockStatus === statusFilter
        return matchesSearch && matchesStatus
    })

    const getStockBadge = (stock: number) => {
        const status = getStockStatus(stock)
        switch (status) {
            case "in_stock":
                return (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        <CheckCircle className="w-3 h-3 mr-1" />In Stock
                    </Badge>
                )
            case "low_stock":
                return (
                    <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                        <AlertTriangle className="w-3 h-3 mr-1" />Low Stock
                    </Badge>
                )
            case "out_of_stock":
                return (
                    <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                        <XCircle className="w-3 h-3 mr-1" />Out of Stock
                    </Badge>
                )
            default:
                return <Badge variant="secondary">{status}</Badge>
        }
    }

    const inStock = products.filter(p => (p.stock ?? 0) > 5).length
    const lowStock = products.filter(p => { const s = p.stock ?? 0; return s > 0 && s <= 5 }).length
    const outOfStock = products.filter(p => (p.stock ?? 0) === 0).length

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                </div>
            </DashboardLayout>
        )
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                    <AlertCircle className="h-12 w-12 text-red-500" />
                    <p className="text-muted-foreground">{error}</p>
                    <Button onClick={fetchProducts} variant="outline">
                        <RefreshCw className="w-4 h-4 mr-2" />Retry
                    </Button>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            {/* Page Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Products Overview</h1>
                <p className="text-muted-foreground mt-2">
                    View and manage all products across the platform from all vendors
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{products.length}</div>
                        <p className="text-xs text-muted-foreground">Across all vendors</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">In Stock</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{inStock}</div>
                        <p className="text-xs text-muted-foreground">Available products</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{lowStock}</div>
                        <p className="text-xs text-muted-foreground">Needs attention</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
                        <XCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{outOfStock}</div>
                        <p className="text-xs text-muted-foreground">Unavailable</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Card */}
            <Card>
                <CardHeader>
                    <div>
                        <CardTitle>All Products</CardTitle>
                        <CardDescription>
                            Browse and manage products from all vendors on the platform
                        </CardDescription>
                    </div>

                    {/* Filters and Search */}
                    <div className="flex flex-wrap items-center gap-4 mt-4">
                        <div className="relative flex-1 min-w-[200px] max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or SKU..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[150px]">
                                <Filter className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="Stock Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="in_stock">In Stock</SelectItem>
                                <SelectItem value="low_stock">Low Stock</SelectItem>
                                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Stock</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>E-commerce</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredProducts.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                        No products found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredProducts.map((product) => {
                                    const stock = product.stock ?? 0
                                    const category = typeof product.category === "object"
                                        ? (product.category as any)?.name || "—"
                                        : (product.category as any) || "—"
                                    return (
                                        <TableRow key={product.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                                                        {getProductImageUrl(product)
                                                            ? <img src={getProductImageUrl(product)!} alt={product.name} className="h-full w-full object-cover" />
                                                            : <Package className="h-6 w-6 text-gray-400" />
                                                        }
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{product.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {product.is_active
                                                                ? <span className="text-green-600">Active</span>
                                                                : <span className="text-red-600">Inactive</span>
                                                            }
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                                                    {product.sku || "—"}
                                                </code>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{category}</Badge>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {formatPrice(product.price)}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`font-medium ${stock === 0 ? "text-red-600" : stock <= 5 ? "text-yellow-600" : "text-green-600"}`}>
                                                    {stock} units
                                                </span>
                                            </TableCell>
                                            <TableCell>{getStockBadge(stock)}</TableCell>
                                            <TableCell>
                                                {product.is_ecommerce ? (
                                                    <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                                                        <TrendingUp className="w-3 h-3 mr-1" />Listed
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline">POS Only</Badge>
                                                )}
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
                                                        <DropdownMenuItem>
                                                            <Eye className="mr-2 h-4 w-4" />View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Store className="mr-2 h-4 w-4" />View Vendor
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </DashboardLayout>
    )
}
