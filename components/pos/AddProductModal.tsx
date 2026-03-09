"use client"

import { useEffect, useRef, useState } from "react"
import NextImage from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { productService, categoryService } from "@/services"
import type { ApiCategory, ProductPayload } from "@/services"
import { db } from "@/lib/db"
import { syncService } from "@/lib/sync-service"
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
    Package,
    Barcode,
    Camera,
    Image as ImageIcon,
    X,
    FileText,
    DollarSign,
    Boxes,
    Tags,
    Plus,
    Loader2,
    TrendingUp,
    Lock,
} from "lucide-react"
import Swal from "sweetalert2"

// ─── Types ──────────────────────────────────────────────────────────────────

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

const fallbackCategories: ApiCategory[] = [
    { id: 1, name: "Groceries" },
    { id: 2, name: "Hardware" },
    { id: 3, name: "Electronics" },
    { id: 4, name: "General" },
    { id: 5, name: "Beverages" },
    { id: 6, name: "Household" },
    { id: 7, name: "Personal Care" },
]

// ─── Success Toast ───────────────────────────────────────────────────────────

const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
})

const showSuccessToast = (title: string, message?: string) => {
    Toast.fire({
        icon: "success",
        title,
        text: message,
        iconColor: "#10b981",
        background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
        color: "#065f46",
    })
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getErrorMessage = (error: unknown): string => {
    if (error && typeof error === "object") {
        const err = error as { message?: string }
        return err.message || "Request failed"
    }
    return "Request failed"
}

const buildPayload = (data: ProductForm, imageFile?: File | null): ProductPayload => ({
    name: data.name,
    sku: data.sku,
    category_id: data.category_id ?? 0,
    price: data.price,
    currency: data.currency,
    stock: Number(data.stock) || 0,
    description: data.description || undefined,
    barcode: data.barcode || undefined,
    cost: Number(data.cost) || undefined,
    unit: data.unit || undefined,
    min_stock: data.min_stock !== "" ? Number(data.min_stock) : undefined,
    max_stock: data.max_stock !== "" ? Number(data.max_stock) : undefined,
    image: imageFile || undefined,
    is_active: data.is_active,
    is_ecommerce: data.is_ecommerce,
})

// ─── Props ───────────────────────────────────────────────────────────────────

export type AddProductModalProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: () => void
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AddProductModal({ open, onOpenChange, onSuccess }: AddProductModalProps) {
    const [formData, setFormData] = useState<ProductForm>(initialFormState)
    const [isActiveProduct, setIsActiveProduct] = useState(true)
    const [isEcommerceProduct, setIsEcommerceProduct] = useState(true)
    const [isBulkPricing, setIsBulkPricing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [actionError, setActionError] = useState<string | null>(null)

    // Markup state (UI-only, not sent to API)
    const [markupType, setMarkupType] = useState<'percentage' | 'fixed'>('percentage')
    const [markupValue, setMarkupValue] = useState<number>(0)

    // Image state
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imageName, setImageName] = useState("")
    const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null)

    // Camera state
    const [hasCamera, setHasCamera] = useState(false)
    const [cameraNotice, setCameraNotice] = useState("")
    const [isCameraOpen, setIsCameraOpen] = useState(false)
    const videoRef = useRef<HTMLVideoElement | null>(null)
    const canvasRef = useRef<HTMLCanvasElement | null>(null)
    const galleryInputRef = useRef<HTMLInputElement | null>(null)

    // Categories
    const [categories, setCategories] = useState<ApiCategory[]>([])
    const [isCategoriesLoading, setIsCategoriesLoading] = useState(false)

    // ── Load categories when dialog opens ──────────────────────────────────────
    useEffect(() => {
        if (!open) return
        let mounted = true

        const loadCategories = async () => {
            setIsCategoriesLoading(true)
            // Try IndexedDB cache first
            try {
                const cached = await db.categories.toArray()
                if (cached.length > 0 && mounted) {
                    setCategories(cached.map((c) => ({ id: c.id, name: c.name })) as ApiCategory[])
                    setIsCategoriesLoading(false)
                }
            } catch {
                // IndexedDB unavailable
            }
            // Always fetch fresh from API
            try {
                const response = await categoryService.getAll()
                const items: ApiCategory[] = Array.isArray(response)
                    ? response
                    : (response as { data?: ApiCategory[] }).data ?? []
                if (mounted) {
                    setCategories(items)
                    syncService.cacheCategories(items).catch(() => { })
                }
            } catch {
                if (mounted && categories.length === 0) setCategories(fallbackCategories)
            } finally {
                if (mounted) setIsCategoriesLoading(false)
            }
        }

        loadCategories()
        return () => { mounted = false }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open])

    // ── Detect camera on mount ─────────────────────────────────────────────────
    useEffect(() => {
        let mounted = true
        const detect = async () => {
            try {
                const devices = await navigator.mediaDevices?.enumerateDevices()
                if (mounted) setHasCamera(devices?.some((d) => d.kind === "videoinput") ?? false)
            } catch {
                if (mounted) setHasCamera(false)
            }
        }
        detect()
        return () => { mounted = false }
    }, [])

    // ── Image dimensions ───────────────────────────────────────────────────────
    useEffect(() => {
        if (!imagePreview) return
        let active = true
        const img = new Image()
        img.onload = () => { if (active) setImageSize({ width: img.naturalWidth, height: img.naturalHeight }) }
        img.src = imagePreview
        return () => { active = false }
    }, [imagePreview])

    // ── Auto-calculate selling price from cost + markup ────────────────────────
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

    // ── Camera stream ──────────────────────────────────────────────────────────
    useEffect(() => {
        let active = true
        let stream: MediaStream | null = null
        const videoEl = videoRef.current

        const startCamera = async () => {
            if (!isCameraOpen) return
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
                if (!active) { stream.getTracks().forEach((t) => t.stop()); return }
                if (videoEl) { videoEl.srcObject = stream; await videoEl.play() }
            } catch {
                setCameraNotice("Unable to access camera. Please upload from Gallery.")
                setIsCameraOpen(false)
            }
        }
        startCamera()

        return () => {
            active = false
            stream?.getTracks().forEach((t) => t.stop())
            if (videoEl) videoEl.srcObject = null
        }
    }, [isCameraOpen])

    // ── Handlers ───────────────────────────────────────────────────────────────

    const handleInputChange = (field: keyof ProductForm, value: string | number | boolean | null) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
        if (field === "image") {
            setImageName("")
            setImagePreview(value ? String(value) : null)
        }
    }

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
        ctx.drawImage(video, 0, 0)
        canvas.toBlob((blob) => {
            if (!blob) return
            const file = new File([blob], `camera-${Date.now()}.jpg`, { type: "image/jpeg" })
            handleImageSelect(file)
            setIsCameraOpen(false)
        }, "image/jpeg", 0.9)
    }

    const resetAll = () => {
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
        setIsCameraOpen(false)
        setActionError(null)
    }

    const handleClose = (open: boolean) => {
        if (!open) {
            setIsCameraOpen(false)
            resetAll()
        }
        onOpenChange(open)
    }

    const handleSave = async () => {
        // Validation
        if (!formData.name.trim()) return setActionError("Product name is required.")
        if (!formData.sku.trim()) return setActionError("SKU is required.")
        if (!formData.category_id) return setActionError("Category is required.")
        if (formData.cost <= 0) return setActionError("Purchase cost is required.")
        if (formData.price <= 0) return setActionError("Selling price must be greater than 0. Check your cost and markup.")
        if (formData.stock === "") return setActionError("Stock quantity is required.")
        if (formData.min_stock === "") return setActionError("Minimum stock is required.")
        if (!imageFile && !imagePreview) return setActionError("Product image is required.")

        setIsSaving(true)
        setActionError(null)

        try {
            const payload = buildPayload({ ...formData, is_active: isActiveProduct, is_ecommerce: isEcommerceProduct }, imageFile)
            await productService.create(payload)
            showSuccessToast("Product Created!", "New product added to inventory")
            resetAll()
            onOpenChange(false)
            onSuccess?.()
        } catch (error) {
            setActionError(getErrorMessage(error))
        } finally {
            setIsSaving(false)
        }
    }

    // ── JSX ────────────────────────────────────────────────────────────────────
    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent
                size="4xl"
                showCloseButton={false}
                className="max-h-[90vh] overflow-hidden rounded-3xl border-white/10 bg-[#241a3a] text-white p-0"
            >
                <div className="flex max-h-[90vh] flex-col">
                    {/* Header */}
                    <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/10">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <DialogTitle className="text-lg font-semibold">Add New Product</DialogTitle>
                                <p className="text-xs text-white/60 mt-1">
                                    Fill in the essentials to add this product to inventory.
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full text-white/60 hover:text-white hover:bg-white/10"
                                onClick={() => handleClose(false)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </DialogHeader>

                    {/* Error Banner */}
                    {actionError && (
                        <div className="px-6 pt-4">
                            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-100">
                                {actionError}
                            </div>
                        </div>
                    )}

                    {/* Scrollable Body */}
                    <div className="flex-1 overflow-y-auto px-6 py-5">
                        <div className="space-y-6">

                            {/* ── Basic Information ─────────────────────── */}
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
                                        <div className="flex items-center gap-2 rounded-xl bg-white/10 border border-white/10 px-3">
                                            <Barcode className="h-4 w-4 text-white/50" />
                                            <Input
                                                className="border-0 bg-transparent text-white placeholder:text-white/40 focus-visible:ring-0 focus-visible:ring-offset-0"
                                                placeholder="Scan or enter barcode"
                                                value={formData.barcode}
                                                onChange={(e) => handleInputChange("barcode", e.target.value)}
                                            />
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
                                                {categories.map((cat) => (
                                                    <SelectItem key={cat.id} value={String(cat.id)}>
                                                        {cat.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </section>

                            {/* ── Media ─────────────────────────────────── */}
                            <section className="space-y-4 sm:rounded-2xl sm:border sm:border-white/10 sm:bg-white/[0.04] sm:p-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-semibold">
                                        Media <span className="text-red-400">*</span>
                                    </h3>
                                    <span className="text-[11px] text-white/50">Image required for new products</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Camera */}
                                    <button
                                        type="button"
                                        className={`rounded-2xl border-2 border-dashed p-4 text-center transition ${hasCamera
                                                ? "border-purple-400/60 bg-purple-500/10 hover:border-purple-300 hover:bg-purple-500/15"
                                                : "border-white/10 bg-white/5 cursor-not-allowed opacity-50"
                                            }`}
                                        onClick={() => {
                                            if (hasCamera) { setCameraNotice(""); setIsCameraOpen(true) }
                                            else setCameraNotice("No camera detected. Please upload from Gallery.")
                                        }}
                                    >
                                        <div className={`mx-auto flex h-10 w-10 items-center justify-center rounded-xl ${hasCamera ? "bg-purple-600/20" : "bg-white/10"}`}>
                                            <Camera className={`h-5 w-5 ${hasCamera ? "text-purple-200" : "text-white/40"}`} />
                                        </div>
                                        <p className={`mt-2 text-sm font-medium ${hasCamera ? "text-purple-200" : "text-white/60"}`}>Camera</p>
                                        <p className="text-xs text-white/50">Take a photo</p>
                                    </button>

                                    {/* Gallery */}
                                    <button
                                        type="button"
                                        className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center transition hover:bg-white/10"
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

                                {/* Camera Preview */}
                                {isCameraOpen && (
                                    <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium">Camera preview</p>
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
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                className="border-white/20 bg-white/5 text-white hover:bg-white/15"
                                                onClick={() => setIsCameraOpen(false)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleCapture}>
                                                Capture Photo
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {cameraNotice && (
                                    <p className="text-xs text-yellow-200 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2">
                                        {cameraNotice}
                                    </p>
                                )}

                                {/* Image Preview */}
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
                                                    <p className="text-xs text-white/50">{imageSize.width} × {imageSize.height}</p>
                                                )}
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="border-white/20 bg-white/5 text-white hover:bg-white/15 shrink-0"
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

                            {/* ── Description ───────────────────────────── */}
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

                            {/* ── Pricing ───────────────────────────────── */}
                            <section className="space-y-4 sm:rounded-2xl sm:border sm:border-white/10 sm:bg-white/[0.04] sm:p-4">
                                <h3 className="text-sm font-semibold">Pricing</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Purchase Cost */}
                                    <div className="space-y-2">
                                        <p className="text-xs text-white/70">Purchase Cost *</p>
                                        <div className="flex items-center gap-2 rounded-xl bg-white/10 border border-white/10 px-3">
                                            <DollarSign className="h-4 w-4 text-white/50" />
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
                                    <div className="space-y-2 col-span-2">
                                        <p className="text-xs text-white/70">Selling Price</p>
                                        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3">
                                            <DollarSign className="h-4 w-4 text-emerald-400/70" />
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

                                    {/* Currency */}
                                    <div className="space-y-2">
                                        <p className="text-xs text-white/70">Currency</p>
                                        <Select
                                            value={formData.currency}
                                            onValueChange={(value) => handleInputChange("currency", value)}
                                        >
                                            <SelectTrigger className="rounded-xl bg-white/10 border-white/10 text-white" suppressHydrationWarning>
                                                <SelectValue placeholder="Currency" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="PHP">PHP</SelectItem>
                                                <SelectItem value="USD">USD</SelectItem>
                                            </SelectContent>
                                        </Select>
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
                                                {unitOptions.map((u) => (
                                                    <SelectItem key={u} value={u}>{u}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </section>

                            {/* ── Stock & Thresholds ────────────────────── */}
                            <section className="space-y-4 sm:rounded-2xl sm:border sm:border-white/10 sm:bg-white/[0.04] sm:p-4">
                                <h3 className="text-sm font-semibold">Stock &amp; Thresholds</h3>
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
                                                onChange={(e) =>
                                                    handleInputChange("stock", e.target.value === "" ? "" : Number(e.target.value))
                                                }
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
                                                onChange={(e) =>
                                                    handleInputChange("min_stock", e.target.value === "" ? "" : Number(e.target.value))
                                                }
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
                                                onChange={(e) =>
                                                    handleInputChange("max_stock", e.target.value === "" ? "" : Number(e.target.value))
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* ── Visibility ────────────────────────────── */}
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
                                onClick={() => handleClose(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700"
                                onClick={handleSave}
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
                                        Add Product
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
