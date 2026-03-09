"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import NextImage from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { categoryService } from "@/services"
import type { ApiProduct, ApiCategory } from "@/services"
import { tokenManager } from "@/lib/axios-client"
import { API_CONFIG } from "@/config/api.config"
import { db } from "@/lib/db"
import { syncService } from "@/lib/sync-service"
import { localDb } from "@/lib/local-first-service"
import { useLocalProducts } from "@/hooks/use-local-data"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  PackageOpen,
  Package,
  Barcode,
  Camera,
  Image as ImageIcon,
  X,
  FileText,
  Boxes,
  Tags,
  Plus,
  TrendingDown,
  AlertTriangle,
  Loader2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  Lock,
} from "lucide-react"
import Swal from "sweetalert2"

// Enhanced Toast configuration with attractive UI
const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  showClass: {
    popup: 'animate__animated animate__slideInRight animate__faster'
  },
  hideClass: {
    popup: 'animate__animated animate__slideOutRight animate__faster'
  },
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer
    toast.onmouseleave = Swal.resumeTimer
  },
  customClass: {
    popup: 'colored-toast',
    timerProgressBar: 'toast-progress-bar'
  }
})

// Success toast with custom styling
const showSuccessToast = (title: string, message?: string) => {
  Toast.fire({
    icon: "success",
    title: title,
    text: message,
    iconColor: '#10b981',
    background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
    color: '#065f46',
  })
}

/**
 * Product form state matching API fields
 */
type ProductForm = {
  name: string
  sku: string
  barcode: string
  category_id: number | null
  price: number
  cost: number
  currency: string
  stock: number | ""
  min_stock: number | ""
  max_stock: number | ""
  unit: string
  description: string
  image: string
  is_active: boolean
  is_ecommerce: boolean
}

type SortKey = "name" | "sku" | "category" | "price" | "stock" | "status"

const initialFormState: ProductForm = {
  name: "",
  sku: "",
  barcode: "",
  category_id: null,
  price: 0,
  cost: 0,
  currency: "PHP",
  stock: "",
  min_stock: "",
  max_stock: "",
  unit: "pc",
  description: "",
  image: "",
  is_active: true,
  is_ecommerce: true,
}

const unitOptions = ["pc", "pack", "box", "kg", "L", "g", "ml"]



const columnConfig = [
  { key: "product", label: "Product" },
  { key: "sku", label: "SKU" },
  { key: "category", label: "Category" },
  { key: "price", label: "Price" },
  { key: "stock", label: "Stock" },
  { key: "status", label: "Status" },
  { key: "actions", label: "Actions" },
] as const

const fallbackCategories: ApiCategory[] = [
  { id: 1, name: "Groceries" },
  { id: 2, name: "Hardware" },
  { id: 3, name: "Electronics" },
  { id: 4, name: "General" },
  { id: 5, name: "Beverages" },
  { id: 6, name: "Household" },
  { id: 7, name: "Personal Care" },
]

const getErrorMessage = (error: unknown): { message: string; isAuthError: boolean } => {
  if (error && typeof error === "object") {
    const err = error as { message?: string; status?: number }
    const status = err.status
    const message = err.message || "Request failed"

    // Check for authentication/authorization errors
    if (status === 401) {
      return { message: "Your session has expired. Please log in again.", isAuthError: true }
    }
    if (status === 403) {
      return { message: "You don't have permission to perform this action. Please log in with an authorized account.", isAuthError: true }
    }

    return { message, isAuthError: false }
  }
  return { message: "Request failed", isAuthError: false }
}

/**
 * Derive the storage base URL from the API base URL (strip trailing /api)
 */
const STORAGE_BASE_URL = (API_CONFIG.BASE_URL || '').replace(/\/api\/?$/, '')

/**
 * Resolve image URL — handles relative paths from API storage
 */
const resolveImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) return url
  return `${STORAGE_BASE_URL}${url.startsWith('/') ? '' : '/storage/'}${url}`
}

/**
 * Normalize API product response to consistent format
 */
const normalizeProduct = (raw: Partial<ApiProduct>): ApiProduct => {
  return {
    id: raw?.id ?? 0,
    name: raw?.name ?? "",
    description: raw?.description ?? "",
    sku: raw?.sku ?? "",
    barcode: raw?.barcode ?? null,
    category: {
      id: raw?.category?.id ?? 0,
      name: raw?.category?.name ?? "Uncategorized",
    },
    price: Number(raw?.price ?? 0),
    cost: Number(raw?.cost ?? 0),
    currency: raw?.currency ?? "PHP",
    unit: raw?.unit ?? "pc",
    stock: Number(raw?.stock ?? 0),
    min_stock: Number(raw?.min_stock ?? 0),
    max_stock: Number(raw?.max_stock ?? 0),
    is_low_stock: Boolean(raw?.is_low_stock ?? false),
    image: raw?.image ?? (raw as any)?.image_url ?? null,
    is_active: raw?.is_active ?? true,
    is_ecommerce: raw?.is_ecommerce ?? true,
    created_at: raw?.created_at ?? "",
    updated_at: raw?.updated_at ?? "",
  }
}

/**
 * Build product payload for API
 */
function DesktopInventoryLayout() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)
  const [isActiveProduct, setIsActiveProduct] = useState(true)
  const [isEcommerceProduct, setIsEcommerceProduct] = useState(true)
  const [isBulkPricing, setIsBulkPricing] = useState(false)
  const [markupType, setMarkupType] = useState<'percentage' | 'fixed'>('percentage')
  const [markupValue, setMarkupValue] = useState<number>(0)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ApiProduct | null>(null)
  const [formData, setFormData] = useState<ProductForm>(initialFormState)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageName, setImageName] = useState("")
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null)
  const [hasCamera, setHasCamera] = useState(false)
  const [cameraNotice, setCameraNotice] = useState("")
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  // Local-first data: products come from IndexedDB via liveQuery
  const { data: localProducts, isLoading: isLocalLoading } = useLocalProducts()
  const inventoryItems = useMemo(() =>
    localProducts.map(p => normalizeProduct({
      id: p.id, name: p.name, sku: p.sku, barcode: p.barcode || '',
      price: p.price, stock: p.stock, unit: p.unit,
      category: p.category_id ? { id: p.category_id, name: p.category_name || '' } : undefined,
      image_url: p.image_url, is_active: p.is_active,
      description: p.description, cost: p.cost, min_stock: p.min_stock,
      is_ecommerce: p.is_ecommerce,
      _status: (p as any)._status, _syncError: (p as any)._syncError,
    } as any)),
    [localProducts]
  )

  const [categories, setCategories] = useState<ApiCategory[]>([])
  const isLoading = isLocalLoading
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true)
  const [loadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [visibleColumns, setVisibleColumns] = useState({
    product: true,
    sku: true,
    category: true,
    price: true,
    stock: true,
    status: true,
    actions: true,
  })
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const galleryInputRef = useRef<HTMLInputElement | null>(null)

  /**
   * Check authentication on mount
   */
  useEffect(() => {
    const checkAuth = () => {
      const token = tokenManager.getAccessToken()
      if (!token) {
        setIsAuthenticated(false)
        router.push("/pos/auth/login")
        return
      }
      setIsAuthenticated(true)
    }
    checkAuth()
  }, [router])

  const handleInputChange = (field: keyof ProductForm, value: string | number | boolean | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (field === "image") {
      setImageName("")
      setImagePreview(value ? String(value) : null)
    }
  }

  const resetForm = () => {
    setFormData(initialFormState)
    setIsActiveProduct(true)
    setIsEcommerceProduct(true)
    setIsBulkPricing(false)
    setMarkupType('percentage')
    setMarkupValue(0)
    setImagePreview(null)
    setImageFile(null)
    setImageName("")
    setImageSize(null)
    setCameraNotice("")
  }

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
      return
    }
    setSortKey(key)
    setSortDirection("asc")
  }

  /**
   * Extract data array from API response
   */
  const extractDataArray = <T,>(response: T[] | { data?: T[] }): T[] => {
    if (Array.isArray(response)) {
      return response
    }
    if (response && typeof response === "object" && "data" in response && Array.isArray(response.data)) {
      return response.data
    }
    return []
  }

  // Products are now loaded reactively via useLocalProducts() hook
  // No loadProducts() needed — liveQuery auto-updates when IndexedDB changes

  /**
   * Load categories from API
   * GET /api/categories
   */
  const loadCategories = async () => {
    setIsCategoriesLoading(true)

    // Load from IndexedDB cache first
    try {
      const cachedCategories = await db.categories.toArray()
      if (cachedCategories.length > 0) {
        setCategories(cachedCategories.map(c => ({ id: c.id, name: c.name, description: c.description })) as ApiCategory[])
        setIsCategoriesLoading(false)
      }
    } catch {
      // IndexedDB may not be available
    }

    try {
      const response = await categoryService.getAll()
      const items = extractDataArray(response)
      setCategories(items)

      // Cache to IndexedDB
      syncService.cacheCategories(items).catch(() => { })
    } catch (error: any) {
      const { isAuthError } = getErrorMessage(error)
      if (isAuthError) {
        router.push("/pos/auth/login")
        return
      }
      if (categories.length === 0) {
        setCategories(fallbackCategories)
      }
    } finally {
      setIsCategoriesLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true
    const detectCamera = async () => {
      if (!navigator?.mediaDevices?.enumerateDevices) {
        if (mounted) setHasCamera(false)
        return
      }
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const found = devices.some((device) => device.kind === "videoinput")
        if (mounted) setHasCamera(found)
      } catch {
        if (mounted) setHasCamera(false)
      }
    }
    detectCamera()

    return () => {
      mounted = false
      if (imagePreview && imagePreview.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreview)
      }
    }
  }, [imagePreview])

  useEffect(() => {
    if (isAuthenticated) {
      loadCategories()
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!imagePreview) return
    let active = true
    const img = new Image()
    img.onload = () => {
      if (active) setImageSize({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.src = imagePreview
    return () => {
      active = false
    }
  }, [imagePreview])

  // Auto-calculate selling price from cost + markup
  useEffect(() => {
    const purchaseCost = formData.cost
    if (purchaseCost > 0 && markupValue >= 0) {
      let sellingPrice: number
      if (markupType === 'percentage') {
        sellingPrice = purchaseCost * (1 + markupValue / 100)
      } else {
        sellingPrice = purchaseCost + markupValue
      }
      setFormData(prev => ({ ...prev, price: Number(sellingPrice.toFixed(2)) }))
    } else if (purchaseCost <= 0) {
      setFormData(prev => ({ ...prev, price: 0 }))
    }
  }, [formData.cost, markupType, markupValue])

  useEffect(() => {
    let active = true
    let stream: MediaStream | null = null
    const videoEl = videoRef.current

    const startCamera = async () => {
      if (!isCameraOpen) return
      if (!navigator?.mediaDevices?.getUserMedia) {
        setCameraNotice("Camera access is not supported. Please upload from Gallery.")
        setIsCameraOpen(false)
        return
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        })
        if (!active) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        if (videoEl) {
          videoEl.srcObject = stream
          await videoEl.play()
        }
      } catch {
        setCameraNotice("Unable to access camera. Please upload from Gallery.")
        setIsCameraOpen(false)
      }
    }

    startCamera()

    return () => {
      active = false
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
      if (videoEl) {
        videoEl.srcObject = null
      }
    }
  }, [isCameraOpen])

  const handleImageSelect = (file?: File | null) => {
    if (!file) return
    setCameraNotice("")
    setImageFile(file)
    setImageName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : ""
      setImagePreview(result || null)
    }
    reader.readAsDataURL(file)
  }

  const handleCapture = () => {
    const video = videoRef.current
    if (!video) return
    const canvas = canvasRef.current ?? document.createElement("canvas")
    canvasRef.current = canvas
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (!blob) return
      const file = new File([blob], `camera-${Date.now()}.jpg`, { type: "image/jpeg" })
      handleImageSelect(file)
      setIsCameraOpen(false)
    }, "image/jpeg", 0.9)
  }

  const openAddModal = () => {
    setActionError(null)
    setIsEditing(false)
    setSelectedProduct(null)
    resetForm()
    setIsAddProductOpen(true)
  }

  const openEditModal = (product: ApiProduct) => {
    setActionError(null)
    setIsEditing(true)
    setSelectedProduct(product)
    setFormData({
      name: product.name,
      sku: product.sku,
      barcode: product.barcode || "",
      category_id: product.category?.id ?? null,
      price: product.price,
      cost: product.cost || 0,
      currency: product.currency,
      stock: product.stock,
      min_stock: product.min_stock ?? "",
      max_stock: product.max_stock ?? "",
      unit: product.unit || "pc",
      description: product.description || "",
      image: product.image || "",
      is_active: product.is_active ?? true,
      is_ecommerce: product.is_ecommerce ?? true,
    })
    setIsActiveProduct(product.is_active ?? true)
    setIsEcommerceProduct(product.is_ecommerce ?? true)
    setImagePreview(product.image || null)
    setImageFile(null)
    setImageName("")
    setImageSize(null)
    // Compute markup percentage from existing cost/price
    const existingCost = product.cost || 0
    const existingPrice = product.price || 0
    setMarkupType('percentage')
    if (existingCost > 0 && existingPrice > existingCost) {
      setMarkupValue(Math.round(((existingPrice - existingCost) / existingCost) * 100 * 100) / 100)
    } else {
      setMarkupValue(0)
    }
    setIsAddProductOpen(true)
  }

  /**
   * Save product (create or update)
   * POST /api/products (create)
   * PATCH /api/products/{product} (update)
   */
  const handleSaveProduct = async () => {
    if (!formData.name.trim()) {
      setActionError("Product name is required.")
      return
    }
    if (!formData.sku.trim()) {
      setActionError("SKU is required.")
      return
    }
    if (!formData.category_id) {
      setActionError("Category is required.")
      return
    }
    if (formData.price <= 0) {
      setActionError("Price must be greater than 0.")
      return
    }
    if (formData.stock === "") {
      setActionError("Stock is required.")
      return
    }
    if (formData.min_stock === "") {
      setActionError("Minimum stock is required.")
      return
    }
    // Validate image is required for new products
    if (!isEditing && !imageFile && !imagePreview) {
      setActionError("Product image is required.")
      return
    }

    setIsSaving(true)
    setActionError(null)
    try {
      if (isEditing && selectedProduct) {
        await localDb.products.update(selectedProduct.id, {
          name: formData.name,
          sku: formData.sku,
          barcode: formData.barcode || null,
          category_id: formData.category_id,
          category_name: categories.find(c => c.id === formData.category_id)?.name,
          price: formData.price,
          cost: formData.cost || undefined,
          stock: Number(formData.stock) || 0,
          min_stock: Number(formData.min_stock),
          unit: formData.unit,
          description: formData.description || undefined,
          is_active: isActiveProduct,
          is_ecommerce: isEcommerceProduct,
        }, imageFile || undefined)
        showSuccessToast("Product Updated!", "Your changes have been saved")
      } else {
        await localDb.products.create({
          name: formData.name,
          sku: formData.sku,
          barcode: formData.barcode || null,
          category_id: formData.category_id,
          category_name: categories.find(c => c.id === formData.category_id)?.name,
          price: formData.price,
          cost: formData.cost || undefined,
          stock: Number(formData.stock) || 0,
          min_stock: Number(formData.min_stock),
          unit: formData.unit,
          description: formData.description || undefined,
          is_active: isActiveProduct,
          is_ecommerce: isEcommerceProduct,
        }, imageFile || undefined)
        showSuccessToast("Product Created!", "New product added to inventory")
      }

      setIsAddProductOpen(false)
      setSelectedProduct(null)
      setIsEditing(false)
      resetForm()
    } catch (error) {
      console.error('❌ Error saving product:', error)
      const { message, isAuthError } = getErrorMessage(error)
      if (isAuthError) {
        setActionError(message)
        setTimeout(() => router.push("/pos/auth/login"), 2000)
      } else {
        setActionError(message)
      }
    } finally {
      setIsSaving(false)
    }
  }

  /**
   * Delete product
   * DELETE /api/products/{product}
   */
  const handleDeleteProduct = async (product: ApiProduct) => {
    const result = await Swal.fire({
      title: 'Delete Product?',
      html: `<p style="color: #6b7280; margin-top: 8px;">Are you sure you want to delete <strong style="color: #1f2937;">${product.name}</strong>?</p><p style="color: #9ca3af; font-size: 13px; margin-top: 4px;">This action cannot be undone.</p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#7c3aed',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      customClass: {
        popup: 'swal2-modern-popup',
        title: 'swal2-modern-title',
        confirmButton: 'swal2-modern-confirm',
        cancelButton: 'swal2-modern-cancel',
      }
    })

    if (!result.isConfirmed) {
      return
    }
    setIsDeleting(true)
    setActionError(null)
    try {
      await localDb.products.delete(product.id)
      showSuccessToast("Product Deleted!", "Item removed from inventory")
    } catch (error) {
      const { message, isAuthError } = getErrorMessage(error)
      if (isAuthError) {
        setActionError(message)
        setTimeout(() => router.push("/pos/auth/login"), 2000)
      } else {
        setActionError(message)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return inventoryItems
    return inventoryItems.filter((item) =>
      item.name.toLowerCase().includes(q) ||
      item.sku.toLowerCase().includes(q) ||
      (item.barcode || "").toLowerCase().includes(q) ||
      (item.category?.name || "").toLowerCase().includes(q)
    )
  }, [inventoryItems, searchQuery])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, pageSize])

  const sortedItems = useMemo(() => {
    const items = [...filteredItems]
    const direction = sortDirection === "asc" ? 1 : -1
    const getStatus = (item: ApiProduct) =>
      item.stock <= 0 ? "critical" : item.is_low_stock ? "low" : "ok"

    const getSortValue = (item: ApiProduct) => {
      switch (sortKey) {
        case "name":
          return item.name.toLowerCase()
        case "sku":
          return item.sku.toLowerCase()
        case "category":
          return (item.category?.name || "").toLowerCase()
        case "price":
          return item.price
        case "stock":
          return item.stock
        case "status":
          return getStatus(item)
        default:
          return item.name.toLowerCase()
      }
    }

    items.sort((a, b) => {
      const aVal = getSortValue(a)
      const bVal = getSortValue(b)
      if (typeof aVal === "number" && typeof bVal === "number") {
        return (aVal - bVal) * direction
      }
      return String(aVal).localeCompare(String(bVal)) * direction
    })

    return items
  }, [filteredItems, sortKey, sortDirection])

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / pageSize))
  const safePage = Math.min(currentPage, totalPages)
  const pageStart = (safePage - 1) * pageSize
  const pageEnd = pageStart + pageSize
  const paginatedItems = sortedItems.slice(pageStart, pageEnd)
  const visibleColumnCount = Math.max(
    1,
    Object.values(visibleColumns).filter(Boolean).length
  )
  const pageNumbers = (() => {
    const pages: number[] = []
    const maxPages = 5
    let start = Math.max(1, safePage - 2)
    let end = Math.min(totalPages, start + maxPages - 1)
    start = Math.max(1, end - maxPages + 1)
    for (let i = start; i <= end; i += 1) pages.push(i)
    return pages
  })()

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const totalItems = inventoryItems.length
  const outOfStockCount = inventoryItems.filter((item) => item.stock <= 0).length
  const lowStockCount = inventoryItems.filter((item) => item.stock > 0 && item.is_low_stock).length

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <p className="text-gray-600 dark:text-[#b4b4d0]">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Show message if not authenticated (will redirect)
  if (isAuthenticated === false) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <p className="text-gray-600 dark:text-[#b4b4d0]">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Product Management</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-[#b4b4d0] mt-0.5 sm:mt-1">Track stock levels and manage products</p>
        </div>
        <Button
          className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto"
          onClick={openAddModal}
        >
          <PackageOpen className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {loadError && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          Failed to load inventory: {loadError}
        </div>
      )}

      {isLoading && (
        <div className="rounded-lg border border-gray-200 dark:border-[#2d1b69] bg-gray-50 dark:bg-[#13132a] px-4 py-3 text-sm text-gray-600 dark:text-[#b4b4d0] flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading inventory...
        </div>
      )}

      {actionError && !isAddProductOpen && (
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {actionError}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <div className="bg-white dark:bg-[#13132a] p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0]">Total Items</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-0.5 sm:mt-1">{totalItems}</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center">
              <PackageOpen className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#13132a] p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0]">Low Stock</p>
              <p className="text-xl sm:text-2xl font-bold text-yellow-600 mt-0.5 sm:mt-1">{lowStockCount}</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 flex items-center justify-center">
              <TrendingDown className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#13132a] p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm col-span-2 sm:col-span-2 md:col-span-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-[#b4b4d0]">Out of Stock</p>
              <p className="text-xl sm:text-2xl font-bold text-red-600 mt-0.5 sm:mt-1">{outOfStockCount}</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-[#9898b8]" />
        <Input
          placeholder="Search by name, SKU, barcode, or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-gray-600 dark:text-[#b4b4d0]">
          Showing{" "}
          <span className="font-medium text-gray-900 dark:text-white">
            {sortedItems.length === 0 ? 0 : pageStart + 1}-{Math.min(pageEnd, sortedItems.length)}
          </span>{" "}
          of <span className="font-medium text-gray-900 dark:text-white">{sortedItems.length}</span> items
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={String(pageSize)} onValueChange={(value) => setPageSize(Number(value))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Rows" />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 50].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size} / page
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortKey} onValueChange={(value) => setSortKey(value as SortKey)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sort: Name</SelectItem>
              <SelectItem value="sku">Sort: SKU</SelectItem>
              <SelectItem value="category">Sort: Category</SelectItem>
              <SelectItem value="price">Sort: Price</SelectItem>
              <SelectItem value="stock">Sort: Stock</SelectItem>
              <SelectItem value="status">Sort: Status</SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">Columns</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columnConfig.map((column) => (
                <DropdownMenuItem
                  key={column.key}
                  onSelect={(event) => event.preventDefault()}
                  className="flex items-center gap-2"
                >
                  <Checkbox
                    checked={visibleColumns[column.key]}
                    onCheckedChange={(checked) =>
                      setVisibleColumns((prev) => ({ ...prev, [column.key]: Boolean(checked) }))
                    }
                  />
                  <span>{column.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Inventory Table - Desktop */}
      <div className="hidden md:block bg-white dark:bg-[#13132a] rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-[#1a1a35] border-b border-gray-200 dark:border-[#2d1b69]">
              <tr>
                {visibleColumns.product && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#b4b4d0] uppercase tracking-wider">
                    <button
                      type="button"
                      onClick={() => handleSort("name")}
                      className="flex items-center gap-2"
                    >
                      Product
                      {sortKey === "name" ? (
                        sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-gray-400 dark:text-[#9898b8]" />
                      )}
                    </button>
                  </th>
                )}
                {visibleColumns.sku && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#b4b4d0] uppercase tracking-wider">
                    <button
                      type="button"
                      onClick={() => handleSort("sku")}
                      className="flex items-center gap-2"
                    >
                      SKU
                      {sortKey === "sku" ? (
                        sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-gray-400 dark:text-[#9898b8]" />
                      )}
                    </button>
                  </th>
                )}
                {visibleColumns.category && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#b4b4d0] uppercase tracking-wider">
                    <button
                      type="button"
                      onClick={() => handleSort("category")}
                      className="flex items-center gap-2"
                    >
                      Category
                      {sortKey === "category" ? (
                        sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-gray-400 dark:text-[#9898b8]" />
                      )}
                    </button>
                  </th>
                )}
                {visibleColumns.price && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#b4b4d0] uppercase tracking-wider">
                    <button
                      type="button"
                      onClick={() => handleSort("price")}
                      className="flex items-center gap-2"
                    >
                      Price
                      {sortKey === "price" ? (
                        sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-gray-400 dark:text-[#9898b8]" />
                      )}
                    </button>
                  </th>
                )}
                {visibleColumns.stock && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#b4b4d0] uppercase tracking-wider">
                    <button
                      type="button"
                      onClick={() => handleSort("stock")}
                      className="flex items-center gap-2"
                    >
                      Stock
                      {sortKey === "stock" ? (
                        sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-gray-400 dark:text-[#9898b8]" />
                      )}
                    </button>
                  </th>
                )}
                {visibleColumns.status && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#b4b4d0] uppercase tracking-wider">
                    <button
                      type="button"
                      onClick={() => handleSort("status")}
                      className="flex items-center gap-2"
                    >
                      Status
                      {sortKey === "status" ? (
                        sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-gray-400 dark:text-[#9898b8]" />
                      )}
                    </button>
                  </th>
                )}
                {visibleColumns.actions && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[#b4b4d0] uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-[#13132a] divide-y divide-gray-200 dark:divide-[#2d1b69]">
              {paginatedItems.map((item) => {
                const status =
                  item.stock <= 0
                    ? "critical"
                    : item.is_low_stock
                      ? "low"
                      : "ok"
                return (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-[#1a1a35]">
                    {visibleColumns.product && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-[#1a1a35] flex-shrink-0 flex items-center justify-center">
                            {resolveImageUrl(item.image) ? (
                              <NextImage
                                src={resolveImageUrl(item.image)!}
                                alt={item.name}
                                width={40}
                                height={40}
                                className="object-cover w-full h-full"
                                unoptimized
                              />
                            ) : (
                              <Package className="w-5 h-5 text-gray-400 dark:text-gray-600" />
                            )}
                          </div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</div>
                        </div>
                      </td>
                    )}
                    {visibleColumns.sku && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 dark:text-[#b4b4d0]">{item.sku}</div>
                      </td>
                    )}
                    {visibleColumns.category && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600 dark:text-[#b4b4d0]">{item.category?.name || "—"}</div>
                      </td>
                    )}
                    {visibleColumns.price && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.currency} {item.price.toLocaleString()}
                        </div>
                      </td>
                    )}
                    {visibleColumns.stock && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">{item.stock} {item.unit}</div>
                      </td>
                    )}
                    {visibleColumns.status && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        {status === "ok" && (
                          <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 hover:bg-green-100">In Stock</Badge>
                        )}
                        {status === "low" && (
                          <Badge className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 hover:bg-yellow-100">Low Stock</Badge>
                        )}
                        {status === "critical" && (
                          <Badge className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 hover:bg-red-100">Out of Stock</Badge>
                        )}
                      </td>
                    )}
                    {visibleColumns.actions && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditModal(item)}>
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
                            onClick={() => handleDeleteProduct(item)}
                            disabled={isDeleting}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
              {!isLoading && sortedItems.length === 0 && (
                <tr>
                  <td colSpan={visibleColumnCount} className="px-6 py-8 text-center text-gray-500 dark:text-[#b4b4d0]">
                    {searchQuery ? "No products match your search." : "No products found. Add your first product."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-gray-200 dark:border-[#2d1b69] px-4 py-3">
          <div className="text-sm text-gray-600 dark:text-[#b4b4d0]">
            Page <span className="font-medium text-gray-900 dark:text-white">{safePage}</span> of{" "}
            <span className="font-medium text-gray-900 dark:text-white">{totalPages}</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={safePage === 1}
            >
              First
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={safePage === 1}
            >
              Prev
            </Button>
            {pageNumbers.map((page) => (
              <Button
                key={page}
                variant={page === safePage ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={safePage === totalPages}
            >
              Next
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={safePage === totalPages}
            >
              Last
            </Button>
          </div>
        </div>
      </div>

      {/* Inventory Cards - Mobile */}
      <div className="md:hidden space-y-3">
        {paginatedItems.map((item) => {
          const status =
            item.stock <= 0
              ? "critical"
              : item.is_low_stock
                ? "low"
                : "ok"
          return (
            <div key={item.id} className="bg-white dark:bg-[#13132a] p-4 rounded-lg border border-gray-200 dark:border-[#2d1b69] shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-[#1a1a35] flex-shrink-0 flex items-center justify-center">
                    {resolveImageUrl(item.image) ? (
                      <NextImage
                        src={resolveImageUrl(item.image)!}
                        alt={item.name}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                        unoptimized
                      />
                    ) : (
                      <Package className="w-6 h-6 text-gray-400 dark:text-gray-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-[#b4b4d0] mt-0.5">SKU: {item.sku}</p>
                    <p className="text-xs text-gray-500 dark:text-[#b4b4d0]">{item.category?.name || "Uncategorized"}</p>
                  </div>
                </div>
                <div>
                  {status === "ok" && (
                    <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 hover:bg-green-100 text-xs">In Stock</Badge>
                  )}
                  {status === "low" && (
                    <Badge className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 hover:bg-yellow-100 text-xs">Low Stock</Badge>
                  )}
                  {status === "critical" && (
                    <Badge className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 hover:bg-red-100 text-xs">Out of Stock</Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-[#13132a] p-3 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-[#b4b4d0] mb-1">Price</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{item.currency} {item.price.toLocaleString()}</p>
                </div>

                <div className="bg-gray-50 dark:bg-[#13132a] p-3 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-[#b4b4d0] mb-1">Stock</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{item.stock}</p>
                  <p className="text-xs text-gray-500 dark:text-[#b4b4d0]">{item.unit}</p>
                </div>
              </div>

              {(status === "low" || status === "critical") && (
                <div className={`mt-3 p-2 rounded-lg flex items-center gap-2 ${status === "critical" ? "bg-red-50 dark:bg-red-900/20" : "bg-yellow-50 dark:bg-yellow-900/20"
                  }`}>
                  <AlertTriangle className={`h-4 w-4 flex-shrink-0 ${status === "critical" ? "text-red-600" : "text-yellow-600"
                    }`} />
                  <p className={`text-xs ${status === "critical" ? "text-red-700 dark:text-red-400" : "text-yellow-700 dark:text-yellow-400"
                    }`}>
                    {status === "critical"
                      ? "Out of stock! Restock urgently."
                      : "Stock running low. Consider restocking soon."
                    }
                  </p>
                </div>
              )}

              <div className="mt-3 flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEditModal(item)} className="flex-1">
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
                  onClick={() => handleDeleteProduct(item)}
                  disabled={isDeleting}
                >
                  Delete
                </Button>
              </div>
            </div>
          )
        })}
        {!isLoading && sortedItems.length === 0 && (
          <div className="bg-white dark:bg-[#13132a] p-8 rounded-lg border border-gray-200 text-center text-gray-500 dark:text-[#b4b4d0]">
            {searchQuery ? "No products match your search." : "No products found. Add your first product."}
          </div>
        )}
      </div>

      <div className="md:hidden flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          disabled={safePage === 1}
        >
          Prev
        </Button>
        <div className="text-sm text-gray-600 dark:text-[#b4b4d0]">
          Page <span className="font-medium text-gray-900 dark:text-white">{safePage}</span> of{" "}
          <span className="font-medium text-gray-900 dark:text-white">{totalPages}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={safePage === totalPages}
        >
          Next
        </Button>
      </div>

      {/* Add/Edit Product Dialog */}
      <Dialog
        open={isAddProductOpen}
        onOpenChange={(open) => {
          setIsAddProductOpen(open)
          if (!open) {
            setIsCameraOpen(false)
            setCameraNotice("")
            setActionError(null)
          }
        }}
      >
        <DialogContent size="4xl" showCloseButton={false} className="max-h-[90vh] overflow-hidden rounded-3xl border-white/10 bg-[#241a3a] text-white p-0">
          <div className="flex max-h-[90vh] flex-col">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/10">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <DialogTitle className="text-lg font-semibold">
                    {isEditing ? "Edit Product" : "Add New Product"}
                  </DialogTitle>
                  <p className="text-xs text-white/60 mt-1">
                    {isEditing ? "Update the product details below." : "Fill in the essentials to add this product to inventory."}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-white/60 hover:text-white hover:bg-white/10"
                  onClick={() => setIsAddProductOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>

            {actionError && (
              <div className="px-6 pt-4">
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-100">
                  {actionError}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-6">
                {/* Basic Information */}
                <section className="space-y-4 sm:rounded-2xl sm:border sm:border-white/10 sm:bg-white/[0.04] sm:p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Basic Information</h3>
                    <span className="text-[11px] text-white/50">Required fields marked *</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {/* Product Name */}
                    <div className="space-y-2">
                      <p className="text-xs text-white/70">Product Name *</p>
                      <div className="flex items-center gap-2 rounded-xl bg-white/10 border border-white/10 px-3">
                        <Package className="h-4 w-4 text-white/50" />
                        <Input
                          className="border-0 bg-transparent text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0"
                          placeholder="Enter product name"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                        />
                      </div>
                    </div>

                    {/* SKU */}
                    <div className="space-y-2">
                      <p className="text-xs text-white/70">SKU *</p>
                      <div className="flex items-center gap-2 rounded-xl bg-white/10 border border-white/10 px-3">
                        <Tags className="h-4 w-4 text-white/50" />
                        <Input
                          className="border-0 bg-transparent text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0"
                          placeholder="e.g., GR-1001"
                          value={formData.sku}
                          onChange={(e) => handleInputChange("sku", e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Barcode */}
                    <div className="space-y-2 sm:col-span-2">
                      <p className="text-xs text-white/70">Barcode (optional)</p>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-1 items-center gap-2 rounded-xl bg-white/10 border border-white/10 px-3">
                          <Barcode className="h-4 w-4 text-white/50" />
                          <Input
                            className="border-0 bg-transparent text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0"
                            placeholder="Scan or enter barcode"
                            value={formData.barcode}
                            onChange={(e) => handleInputChange("barcode", e.target.value)}
                          />
                        </div>
                        <Button className="h-10 w-10 rounded-xl bg-purple-600 hover:bg-purple-700 p-0">
                          <Barcode className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Category */}
                    <div className="space-y-2 sm:col-span-2">
                      <p className="text-xs text-white/70">Category *</p>
                      <Select
                        value={formData.category_id ? String(formData.category_id) : ""}
                        onValueChange={(value) => handleInputChange("category_id", Number(value))}
                        disabled={isCategoriesLoading}
                      >
                        <SelectTrigger className="rounded-xl bg-white/10 border-white/10 text-white" suppressHydrationWarning>
                          <SelectValue placeholder={isCategoriesLoading ? "Loading categories..." : "Select a category"} />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={String(category.id)}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>

                {/* Media */}
                <section className="space-y-4 sm:rounded-2xl sm:border sm:border-white/10 sm:bg-white/[0.04] sm:p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Media {!isEditing && <span className="text-red-400">*</span>}</h3>
                    {!isEditing && <span className="text-[11px] text-white/50">Image required for new products</span>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      className={`rounded-2xl border-2 border-dashed p-4 text-center transition ${hasCamera
                        ? "border-purple-400/60 bg-purple-500/10 hover:border-purple-300 hover:bg-purple-500/15"
                        : "border-white/10 bg-white/5"
                        }`}
                      type="button"
                      onClick={() => {
                        if (hasCamera) {
                          setCameraNotice("")
                          setIsCameraOpen(true)
                        } else {
                          setCameraNotice("No camera detected. Please upload from Gallery.")
                        }
                      }}
                    >
                      <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl ${hasCamera ? "bg-purple-600/20" : "bg-white/10"}`}>
                        <Camera className={`h-5 w-5 ${hasCamera ? "text-purple-200" : "text-white/40"}`} />
                      </div>
                      <p className={`mt-2 text-sm font-medium ${hasCamera ? "text-purple-200" : "text-white/60"}`}>Camera</p>
                      <p className="text-xs text-white/50">Take a photo</p>
                    </button>
                    <button
                      className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center transition hover:bg-white/10"
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                    >
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                        <ImageIcon className="h-5 w-5 text-white/60" />
                      </div>
                      <p className="mt-2 text-sm font-medium text-white/80">Gallery</p>
                      <p className="text-xs text-white/50">Upload image</p>
                    </button>
                  </div>
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageSelect(e.target.files?.[0])}
                  />
                  {isCameraOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#1b132d]/95 p-4 sm:static sm:z-auto sm:bg-transparent sm:p-0">
                      <div className="w-full max-w-md sm:max-w-none rounded-2xl border border-white/10 bg-[#201836] p-4 space-y-3 sm:w-full sm:rounded-2xl sm:bg-black/40">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium text-white">Camera preview</div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-white/70 hover:text-white hover:bg-white/10"
                            onClick={() => setIsCameraOpen(false)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
                          <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                          <Button
                            variant="outline"
                            className="border-white/20 bg-white/5 text-white hover:bg-white/15 sm:hidden"
                            onClick={() => setIsCameraOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleCapture}>
                            Capture Photo
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  {cameraNotice && (
                    <p className="text-xs text-yellow-200 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2">
                      {cameraNotice}
                    </p>
                  )}
                  {imagePreview && (
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-3">
                      <div className="relative aspect-[3/1] w-full overflow-hidden rounded-lg bg-black/40">
                        <NextImage
                          src={imagePreview}
                          alt="Selected product"
                          fill
                          sizes="100vw"
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="text-sm text-white">Selected image</p>
                          {imageName && <p className="text-xs text-white/60 truncate">{imageName}</p>}
                          {imageSize && (
                            <p className="text-xs text-white/50">
                              {imageSize.width} x {imageSize.height}
                            </p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="border-white/20 bg-white/5 text-white hover:bg-white/15"
                          onClick={() => {
                            setImagePreview(null)
                            setImageFile(null)
                            setImageName("")
                            setImageSize(null)
                            handleInputChange("image", "")
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  )}
                </section>

                {/* Description */}
                <section className="space-y-3 sm:rounded-2xl sm:border sm:border-white/10 sm:bg-white/[0.04] sm:p-4">
                  <h3 className="text-sm font-semibold">Description</h3>
                  <div className="flex items-start gap-2 rounded-xl bg-white/10 border border-white/10 px-3 py-2">
                    <FileText className="mt-1 h-4 w-4 text-white/50" />
                    <Textarea
                      className="border-0 bg-transparent text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[80px]"
                      placeholder="Add product details..."
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                    />
                  </div>
                </section>

                {/* Pricing */}
                <section className="space-y-4 sm:rounded-2xl sm:border sm:border-white/10 sm:bg-white/[0.04] sm:p-4">
                  <h3 className="text-sm font-semibold">Pricing</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Purchase Cost */}
                    <div className="space-y-2">
                      <p className="text-xs text-white/70">Purchase Cost *</p>
                      <div className="flex items-center gap-2 rounded-xl bg-white/10 border border-white/10 px-3">
                        <span className="h-4 w-4 text-white/50 font-bold text-sm flex items-center justify-center">₱</span>
                        <Input
                          className="border-0 bg-transparent text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0"
                          placeholder="0.00"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.cost || ""}
                          onChange={(e) => handleInputChange("cost", Number(e.target.value))}
                        />
                      </div>
                    </div>

                    {/* Markup */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-white/70">Mark Up *</p>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition ${
                              markupType === 'percentage'
                                ? 'bg-purple-500/30 text-purple-200 border border-purple-400/50'
                                : 'bg-white/5 text-white/40 border border-transparent hover:bg-white/10 hover:text-white/60'
                            }`}
                            onClick={() => setMarkupType('percentage')}
                          >
                            %
                          </button>
                          <button
                            type="button"
                            className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition ${
                              markupType === 'fixed'
                                ? 'bg-purple-500/30 text-purple-200 border border-purple-400/50'
                                : 'bg-white/5 text-white/40 border border-transparent hover:bg-white/10 hover:text-white/60'
                            }`}
                            onClick={() => setMarkupType('fixed')}
                          >
                            Fixed
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 rounded-xl bg-white/10 border border-white/10 px-3">
                        <TrendingUp className="h-4 w-4 text-white/50" />
                        <Input
                          className="border-0 bg-transparent text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0"
                          placeholder={markupType === 'percentage' ? "0" : "0.00"}
                          type="number"
                          min="0"
                          step={markupType === 'percentage' ? "1" : "0.01"}
                          value={markupValue || ""}
                          onChange={(e) => setMarkupValue(Number(e.target.value))}
                        />
                      </div>
                    </div>

                    {/* Selling Price (auto-calculated, read-only) */}
                    <div className="space-y-2">
                      <p className="text-xs text-white/70">Selling Price</p>
                      <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3">
                        <span className="h-4 w-4 text-emerald-400/70 font-bold text-sm flex items-center justify-center">₱</span>
                        <Input
                          className="border-0 bg-transparent text-emerald-300 font-medium placeholder:text-emerald-400/30 focus-visible:ring-0 focus-visible:ring-offset-0"
                          placeholder="Auto-calculated"
                          value={formData.price > 0 ? formData.price.toFixed(2) : ""}
                          readOnly
                          tabIndex={-1}
                        />
                        <Lock className="h-3 w-3 text-emerald-400/40" />
                      </div>
                    </div>

                    {/* Unit */}
                    <div className="space-y-2">
                      <p className="text-xs text-white/70">Unit</p>
                      <Select
                        value={formData.unit}
                        onValueChange={(value) => handleInputChange("unit", value)}
                      >
                        <SelectTrigger className="rounded-xl bg-white/10 border-white/10 text-white" suppressHydrationWarning>
                          <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {unitOptions.map((unit) => (
                            <SelectItem key={unit} value={unit}>
                              {unit}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>

                {/* Stock & Thresholds */}
                <section className="space-y-4 sm:rounded-2xl sm:border sm:border-white/10 sm:bg-white/[0.04] sm:p-4">
                  <h3 className="text-sm font-semibold">Stock & Thresholds</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {/* Stock */}
                    <div className="space-y-2">
                      <p className="text-xs text-white/70">Stock *</p>
                      <div className="flex items-center gap-2 rounded-xl bg-white/10 border border-white/10 px-3">
                        <Boxes className="h-4 w-4 text-white/50" />
                        <Input
                          className="border-0 bg-transparent text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0"
                          placeholder="0"
                          type="number"
                          min="0"
                          value={formData.stock === "" ? "" : formData.stock}
                          onChange={(e) => handleInputChange("stock", e.target.value === "" ? "" : Number(e.target.value))}
                        />
                      </div>
                    </div>

                    {/* Min Stock */}
                    <div className="space-y-2">
                      <p className="text-xs text-white/70">Min Stock *</p>
                      <div className="flex items-center gap-2 rounded-xl bg-white/10 border border-white/10 px-3">
                        <Boxes className="h-4 w-4 text-white/50" />
                        <Input
                          className="border-0 bg-transparent text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0"
                          placeholder="0"
                          type="number"
                          min="0"
                          value={formData.min_stock === "" ? "" : formData.min_stock}
                          onChange={(e) => handleInputChange("min_stock", e.target.value === "" ? "" : Number(e.target.value))}
                        />
                      </div>
                    </div>

                    {/* Max Stock */}
                    <div className="space-y-2">
                      <p className="text-xs text-white/70">Max Stock</p>
                      <div className="flex items-center gap-2 rounded-xl bg-white/10 border border-white/10 px-3">
                        <Boxes className="h-4 w-4 text-white/50" />
                        <Input
                          className="border-0 bg-transparent text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0"
                          placeholder="0"
                          type="number"
                          min="0"
                          value={formData.max_stock === "" ? "" : formData.max_stock}
                          onChange={(e) => handleInputChange("max_stock", e.target.value === "" ? "" : Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                </section>

                {/* Visibility */}
                <section className="space-y-3 sm:rounded-2xl sm:border sm:border-white/10 sm:bg-white/[0.04] sm:p-4">
                  <h3 className="text-sm font-semibold">Visibility</h3>
                  <div className="flex items-center justify-between rounded-2xl border border-purple-500/40 bg-purple-500/10 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">Active Product</p>
                      <p className="text-xs text-white/60">Controls product availability</p>
                    </div>
                    <Switch
                      checked={isActiveProduct}
                      onCheckedChange={(checked) => {
                        setIsActiveProduct(checked)
                        handleInputChange("is_active", checked)
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-purple-500/40 bg-purple-500/10 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">Add to E-Commerce?</p>
                      <p className="text-xs text-white/60">Show this product on the store page</p>
                    </div>
                    <Switch
                      checked={isEcommerceProduct}
                      onCheckedChange={(checked) => {
                        setIsEcommerceProduct(checked)
                        handleInputChange("is_ecommerce", checked)
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">Bulk Pricing</p>
                      <p className="text-xs text-white/60">Set different prices for quantities</p>
                    </div>
                    <Switch checked={isBulkPricing} onCheckedChange={setIsBulkPricing} />
                  </div>
                </section>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 border-t border-white/10 bg-[#241a3a] px-6 py-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  variant="outline"
                  className="hidden sm:inline-flex border-white/20 bg-white/5 text-white hover:bg-white/15"
                  onClick={() => setIsAddProductOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700"
                  onClick={handleSaveProduct}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      {isEditing ? "Update Product" : "Add Product"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function InventoryPage() {
  return <DesktopInventoryLayout />
}
