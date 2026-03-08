# Design: Add Product Dialog from POS Dashboard

**Date**: 2026-02-25
**Status**: Approved

## Problem

The POS dashboard has two "Add Product" entry points — the header button and the QuickActions widget — but both are unhooked (no `onClick`, no navigation). Vendors can only add products by manually navigating to `/pos/products`.

## Solution

Extract the full add-product form from the Products page into a shared `AddProductDialog` component. Wire both dashboard entry points to open it as a centered Dialog, keeping the vendor on the dashboard.

## Architecture

### New Component: `components/pos/AddProductDialog.tsx`

- Controlled dialog: `open`, `onOpenChange` props
- Accepts `categories: ApiCategory[]` (passed from parent to avoid duplicate fetching)
- Accepts `onSuccess?: () => void` callback (called after successful save)
- Contains all form state extracted from `app/pos/products/page.tsx`:
  - `ProductForm` state, handlers
  - Image upload + camera capture logic
  - `productService.create()` API call
  - Toast notifications (same `showSuccessToast` pattern)
  - Form reset on close

### Modified: `components/screens/dashboard/DesktopDashboard.tsx`

- Add `isAddOpen: boolean` state
- Lazy-load categories when dialog first opens (`useEffect` on `isAddOpen`)
- Wire header "Add Product" button: `onClick={() => setIsAddOpen(true)}`
- Render `<AddProductDialog open={isAddOpen} onOpenChange={setIsAddOpen} categories={categories} onSuccess={handleAddSuccess} />`
- Pass `onAddProduct={() => setIsAddOpen(true)}` to `<QuickActions />`

### Modified: `components/pos/QuickActions.tsx`

- Add optional `onAddProduct?: () => void` prop
- Wire "Add a new product" button to call `onAddProduct?.()` when provided

### Modified: `app/pos/products/page.tsx`

- Replace the inline add-product dialog JSX block with `<AddProductDialog ... />`
- Pass `categories`, `isAddProductOpen`, and `setIsAddProductOpen`
- No behavioral change — just uses the extracted component

## Data Flow

```
DesktopDashboard
  ├── [isAddOpen, setIsAddOpen] state
  ├── [categories] state — fetched once when dialog first opens
  ├── Header "Add Product" button → setIsAddOpen(true)
  ├── <QuickActions onAddProduct={() => setIsAddOpen(true)} />
  └── <AddProductDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        categories={categories}
        onSuccess={() => toast("Product added!")}
      />
```

## Success Behavior

- Toast notification on save (sonner or sweetalert2, matching products page)
- Dialog closes
- No dashboard data refresh needed (KPIs are sales-based, not product-list-based)

## Non-goals

- No quick-add (minimal fields) variant
- No Sheet/slide-over UI
- No auto-navigation to products page after save

## Files to Create/Modify

| File | Change |
|------|--------|
| `components/pos/AddProductDialog.tsx` | **Create** — extracted form |
| `components/screens/dashboard/DesktopDashboard.tsx` | **Modify** — state + wire buttons |
| `components/pos/QuickActions.tsx` | **Modify** — add `onAddProduct` prop |
| `app/pos/products/page.tsx` | **Modify** — use shared component |
