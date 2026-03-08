# Add Product Dialog from Dashboard — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire the two dead "Add Product" buttons on the POS dashboard (header + QuickActions) to open a full product-creation dialog without leaving the dashboard.

**Architecture:** Extract the existing add-product form (currently inline in `app/pos/products/page.tsx`) into a shared `AddProductDialog` component. Both the dashboard and the products page import this shared component. The dashboard lazily fetches categories when the dialog first opens.

**Tech Stack:** Next.js App Router, React 19, shadcn/ui Dialog, Zustand-free (local state only), Tailwind CSS, `productService` + `categoryService` from `@/services`

---

## Task 1: Create `AddProductDialog` component

**Files:**
- Create: `components/pos/AddProductDialog.tsx`

This component contains all form state and logic extracted from `app/pos/products/page.tsx` (lines ~60–730 of the dialog section). It is a pure "add only" dialog (no edit mode — the products page keeps its own edit logic).

**Step 1: Create the file with the component shell**

Copy the following types and helpers verbatim from `app/pos/products/page.tsx` into the new file:
- `ProductForm` type (lines 98–114)
- `initialFormState` constant (lines 118–134)
- `unitOptions` constant (line 136)
- `buildProductPayload` function (lines 275–292)
- `Toast`, `showSuccessToast` (lines 61–93)

Then write the component:

```tsx
"use client"

import { useEffect, useRef, useState } from "react"
import NextImage from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
  Package, Barcode, Camera, Image as ImageIcon, X,
  FileText, DollarSign, Boxes, Tags, Loader2,
} from "lucide-react"
import { productService } from "@/services"
import type { ApiCategory, ProductPayload } from "@/services"
import Swal from "sweetalert2"

// ── Paste ProductForm, initialFormState, unitOptions, buildProductPayload,
//    Toast, showSuccessToast here ──

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  categories: ApiCategory[]
  isCategoriesLoading?: boolean
  onSuccess?: () => void
}

export function AddProductDialog({
  open,
  onOpenChange,
  categories,
  isCategoriesLoading = false,
  onSuccess,
}: Props) {
  const [formData, setFormData] = useState<ProductForm>(initialFormState)
  const [isActiveProduct, setIsActiveProduct] = useState(true)
  const [isEcommerceProduct, setIsEcommerceProduct] = useState(true)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageName, setImageName] = useState("")
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null)
  const [hasCamera, setHasCamera] = useState(false)
  const [cameraNotice, setCameraNotice] = useState("")
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const galleryInputRef = useRef<HTMLInputElement | null>(null)

  // Camera detection
  useEffect(() => {
    let mounted = true
    const detect = async () => {
      if (!navigator?.mediaDevices?.enumerateDevices) { if (mounted) setHasCamera(false); return }
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        if (mounted) setHasCamera(devices.some(d => d.kind === "videoinput"))
      } catch { if (mounted) setHasCamera(false) }
    }
    detect()
    return () => { mounted = false }
  }, [])

  // Image dimension reader
  useEffect(() => {
    if (!imagePreview) return
    let active = true
    const img = new Image()
    img.onload = () => { if (active) setImageSize({ width: img.naturalWidth, height: img.naturalHeight }) }
    img.src = imagePreview
    return () => { active = false }
  }, [imagePreview])

  // Camera stream
  useEffect(() => {
    if (!isCameraOpen) return
    let active = true
    let stream: MediaStream | null = null
    const videoEl = videoRef.current
    const start = async () => {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setCameraNotice("Camera access not supported. Upload from Gallery.")
        setIsCameraOpen(false)
        return
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
        if (!active) { stream.getTracks().forEach(t => t.stop()); return }
        if (videoEl) { videoEl.srcObject = stream; await videoEl.play() }
      } catch {
        setCameraNotice("Unable to access camera. Upload from Gallery.")
        setIsCameraOpen(false)
      }
    }
    start()
    return () => {
      active = false
      stream?.getTracks().forEach(t => t.stop())
      if (videoEl) videoEl.srcObject = null
    }
  }, [isCameraOpen])

  const handleInputChange = (field: keyof ProductForm, value: string | number | boolean | null) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (field === "image") { setImageName(""); setImagePreview(value ? String(value) : null) }
  }

  const resetForm = () => {
    setFormData(initialFormState)
    setIsActiveProduct(true)
    setIsEcommerceProduct(true)
    setImagePreview(null)
    setImageFile(null)
    setImageName("")
    setImageSize(null)
    setCameraNotice("")
    setActionError(null)
  }

  const handleClose = (open: boolean) => {
    if (!open) { setIsCameraOpen(false); resetForm() }
    onOpenChange(open)
  }

  const handleImageSelect = (file?: File | null) => {
    if (!file) return
    setCameraNotice("")
    setImageFile(file)
    setImageName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      setImagePreview(typeof reader.result === "string" ? reader.result : null)
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
    canvas.toBlob(blob => {
      if (!blob) return
      handleImageSelect(new File([blob], `camera-${Date.now()}.jpg`, { type: "image/jpeg" }))
      setIsCameraOpen(false)
    }, "image/jpeg", 0.9)
  }

  const handleSave = async () => {
    if (!formData.name.trim()) { setActionError("Product name is required."); return }
    if (!formData.sku.trim()) { setActionError("SKU is required."); return }
    if (!formData.category_id) { setActionError("Category is required."); return }
    if (formData.price <= 0) { setActionError("Price must be greater than 0."); return }
    if (formData.stock === "") { setActionError("Stock is required."); return }
    if (formData.min_stock === "") { setActionError("Minimum stock is required."); return }
    if (!imageFile && !imagePreview) { setActionError("Product image is required."); return }

    setIsSaving(true)
    setActionError(null)
    try {
      const payload = buildProductPayload({ ...formData, is_active: isActiveProduct, is_ecommerce: isEcommerceProduct }, imageFile)
      await productService.create(payload)
      showSuccessToast("Product Created!", "New product added to inventory")
      handleClose(false)
      onSuccess?.()
    } catch (error: any) {
      setActionError(error?.message || "Failed to save product.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent size="4xl" showCloseButton={false} className="max-h-[90vh] overflow-hidden rounded-3xl border-white/10 bg-[#241a3a] text-white p-0">
        <div className="flex max-h-[90vh] flex-col">
          {/* Header */}
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-lg font-semibold">Add New Product</DialogTitle>
                <p className="text-xs text-white/60 mt-1">Fill in the essentials to add this product to inventory.</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-white/60 hover:text-white hover:bg-white/10" onClick={() => handleClose(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          {/* Error */}
          {actionError && (
            <div className="px-6 pt-4">
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-100">{actionError}</div>
            </div>
          )}

          {/* Scrollable body — paste ALL form sections from products page dialog here:
              Basic Information, Media, Description, Pricing, Stock & Thresholds, Visibility */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {/* ... form sections (copy verbatim from products/page.tsx lines ~1443–1836) ... */}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-white/10 px-6 py-4">
            <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/15" onClick={() => handleClose(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : "Save Product"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

**Step 2: Copy all form sections into the scrollable body**

From `app/pos/products/page.tsx`, copy the entire `<div className="flex-1 overflow-y-auto px-6 py-5">...</div>` block (approximately lines 1443–1836) into the matching location in `AddProductDialog.tsx`. Replace all references to `isEditing` with `false` (since this component is add-only).

**Step 3: Verify the file has no TypeScript errors**

```bash
cd /home/augustinm/dev/vendora && npx tsc --noEmit 2>&1 | head -40
```

Expected: no errors (or only pre-existing unrelated errors).

**Step 4: Commit**

```bash
git add components/pos/AddProductDialog.tsx
git commit -m "feat: extract AddProductDialog as shared component"
```

---

## Task 2: Wire `DesktopDashboard` to open the dialog

**Files:**
- Modify: `components/screens/dashboard/DesktopDashboard.tsx`

**Step 1: Add state and category loading**

At the top of `DesktopDashboard()` function, after the existing `useDashboardData()` call, add:

```tsx
import { useState, useEffect } from "react"
import { AddProductDialog } from "@/components/pos/AddProductDialog"
import { categoryService } from "@/services"
import type { ApiCategory } from "@/services"

// inside DesktopDashboard():
const [isAddOpen, setIsAddOpen] = useState(false)
const [categories, setCategories] = useState<ApiCategory[]>([])
const [isCategoriesLoading, setIsCategoriesLoading] = useState(false)

useEffect(() => {
  if (!isAddOpen || categories.length > 0) return
  setIsCategoriesLoading(true)
  categoryService.getAll()
    .then((res: any) => {
      const items = Array.isArray(res) ? res : (res?.data ?? [])
      setCategories(items)
    })
    .catch(() => {})
    .finally(() => setIsCategoriesLoading(false))
}, [isAddOpen, categories.length])
```

**Step 2: Wire the existing header "Add Product" button**

Find this block in `DesktopDashboard.tsx` (around line 131):
```tsx
<Button variant="outline" className="w-full sm:w-auto border-gray-300 dark:border-border">
  <Plus className="mr-2 h-4 w-4" />
  Add Product
</Button>
```

Replace with:
```tsx
<Button
  variant="outline"
  className="w-full sm:w-auto border-gray-300 dark:border-border"
  onClick={() => setIsAddOpen(true)}
>
  <Plus className="mr-2 h-4 w-4" />
  Add Product
</Button>
```

**Step 3: Pass `onAddProduct` to `QuickActions`**

Find:
```tsx
<QuickActions variant="embedded" />
```

Replace with:
```tsx
<QuickActions variant="embedded" onAddProduct={() => setIsAddOpen(true)} />
```

**Step 4: Render the dialog**

Just before the closing `</div>` of the main `return` in `DesktopDashboard`, add:

```tsx
<AddProductDialog
  open={isAddOpen}
  onOpenChange={setIsAddOpen}
  categories={categories}
  isCategoriesLoading={isCategoriesLoading}
/>
```

**Step 5: Type-check**

```bash
cd /home/augustinm/dev/vendora && npx tsc --noEmit 2>&1 | head -40
```

**Step 6: Commit**

```bash
git add components/screens/dashboard/DesktopDashboard.tsx
git commit -m "feat: wire Add Product button on dashboard to open dialog"
```

---

## Task 3: Wire `QuickActions` "Add a new product" button

**Files:**
- Modify: `components/pos/QuickActions.tsx`

**Step 1: Add `onAddProduct` prop**

Change the `QuickActionsProps` type:
```tsx
type QuickActionsProps = {
  variant?: "default" | "embedded"
  onAddProduct?: () => void
}
```

Update the function signature:
```tsx
export function QuickActions({ variant = "default", onAddProduct }: QuickActionsProps) {
```

**Step 2: Wire the "Add a new product" button**

The actions array is static. Find the Button that renders `action.label === "Add a new product"`. Currently all buttons are rendered with no `onClick`. Change the render loop to pass `onClick` only for the second item (index 1):

```tsx
{actions.map((action, index) => {
  const Icon = action.icon
  const handleClick = index === 1 ? onAddProduct : undefined
  return (
    <Button
      key={index}
      variant="ghost"
      className={`w-full justify-start gap-3 h-12 ${action.color}`}
      onClick={handleClick}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium dark:text-[#e0e0f0]">{action.label}</span>
    </Button>
  )
})}
```

**Step 3: Type-check**

```bash
cd /home/augustinm/dev/vendora && npx tsc --noEmit 2>&1 | head -40
```

**Step 4: Commit**

```bash
git add components/pos/QuickActions.tsx
git commit -m "feat: wire QuickActions Add Product button via prop"
```

---

## Task 4: Use `AddProductDialog` in products page (cleanup)

**Files:**
- Modify: `app/pos/products/page.tsx`

This task eliminates the duplicate inline dialog by using the shared component. The edit dialog (which uses `isEditing`) stays inline since `AddProductDialog` is add-only.

**Step 1: Import `AddProductDialog`**

At the top of `app/pos/products/page.tsx`, add:
```tsx
import { AddProductDialog } from "@/components/pos/AddProductDialog"
```

**Step 2: Replace the inline add-dialog block**

Find the `<Dialog open={isAddProductOpen} ...>` block that starts around line 1401. It ends a few hundred lines later. This is the add-product dialog (also used for edit when `isEditing` is true).

Since the existing dialog handles both add and edit in one block, we have two options:
- **Option A (minimal change):** Only replace the dialog when `!isEditing`. Wrap the existing Dialog in `{isEditing && ...}` and add `<AddProductDialog ... />` alongside for the add case.
- **Option B (full replacement):** Refactor the products page to have a separate edit dialog. This is larger scope.

**Use Option A:**

Before the existing `<Dialog open={isAddProductOpen} ...>` block, insert:

```tsx
{/* Add product: use shared component */}
<AddProductDialog
  open={isAddProductOpen && !isEditing}
  onOpenChange={(open) => {
    setIsAddProductOpen(open)
    if (!open) { setActionError(null) }
  }}
  categories={categories}
  isCategoriesLoading={isCategoriesLoading}
  onSuccess={loadProducts}
/>
```

Then wrap the existing `<Dialog>` block so it only shows in edit mode:

Change `<Dialog open={isAddProductOpen} ...>` to `<Dialog open={isAddProductOpen && isEditing} ...>`.

**Step 3: Type-check**

```bash
cd /home/augustinm/dev/vendora && npx tsc --noEmit 2>&1 | head -40
```

**Step 4: Manual smoke test**

1. `npm run dev`
2. Go to `/pos/dashboard`
3. Click header "Add Product" → dialog opens
4. Click QuickActions "Add a new product" → same dialog opens
5. Fill required fields, submit → success toast, dialog closes
6. Go to `/pos/products` → "Add Product" button → dialog still works

**Step 5: Commit**

```bash
git add app/pos/products/page.tsx
git commit -m "refactor: use shared AddProductDialog in products page"
```

---

## Summary

| Task | File | Change |
|------|------|--------|
| 1 | `components/pos/AddProductDialog.tsx` | Create — extracted form component |
| 2 | `components/screens/dashboard/DesktopDashboard.tsx` | Add state + lazy category fetch + wire buttons + render dialog |
| 3 | `components/pos/QuickActions.tsx` | Add `onAddProduct` prop + wire button |
| 4 | `app/pos/products/page.tsx` | Use shared component for add flow |
