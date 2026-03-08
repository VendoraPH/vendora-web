# Philippine Peso Currency Utility - Usage Guide

This guide demonstrates how to use the Philippine Peso (PHP) currency utilities in your POS and e-commerce application.

## Basic Usage

```typescript
import PHP, { formatPHP, formatNumber } from "@/lib/currency"

// Format as Philippine Peso
const price = PHP(1234.56)
console.log(price.format()) // "₱1,234.56"

// Using helper function
console.log(formatPHP(1234.56)) // "₱1,234.56"

// Format without symbol
console.log(formatNumber(1234.56)) // "1,234.56"
```

## POS System Examples

### 1. Product Pricing

```typescript
import PHP, { formatPHP } from "@/lib/currency"

const product = {
  name: "Coffee",
  price: 150.00,
  quantity: 2
}

const total = PHP(product.price).multiply(product.quantity)
console.log(formatPHP(total)) // "₱300.00"
```

### 2. Calculate Subtotal

```typescript
import { calculateSubtotal, formatPHP } from "@/lib/currency"

const cartItems = [
  { name: "Coffee", price: 150, quantity: 2 },
  { name: "Cake", price: 250, quantity: 1 },
  { name: "Water", price: 25, quantity: 3 }
]

const subtotal = calculateSubtotal(cartItems)
console.log(formatPHP(subtotal)) // "₱625.00"
```

### 3. Apply Discount

```typescript
import { applyDiscount, calculateDiscount, formatPHP } from "@/lib/currency"

const subtotal = 1000
const discountPercent = 15

// Get discount amount
const discountAmount = calculateDiscount(subtotal, discountPercent)
console.log(formatPHP(discountAmount)) // "₱150.00"

// Get total after discount
const afterDiscount = applyDiscount(subtotal, discountPercent)
console.log(formatPHP(afterDiscount)) // "₱850.00"
```

### 4. Add VAT (12%)

```typescript
import { addVAT, calculateVAT, formatPHP } from "@/lib/currency"

const subtotal = 1000

// Calculate VAT amount (12% in Philippines)
const vatAmount = calculateVAT(subtotal)
console.log(formatPHP(vatAmount)) // "₱120.00"

// Add VAT to subtotal
const withVAT = addVAT(subtotal)
console.log(formatPHP(withVAT)) // "₱1,120.00"
```

### 5. Calculate Change

```typescript
import { calculateChange, formatPHP } from "@/lib/currency"

const total = 567.50
const amountPaid = 1000

const change = calculateChange(amountPaid, total)
console.log(formatPHP(change)) // "₱432.50"
```

### 6. Complete POS Transaction

```typescript
import {
  calculateSubtotal,
  applyDiscount,
  addVAT,
  calculateChange,
  formatPHP
} from "@/lib/currency"

// Cart items
const items = [
  { name: "Laptop", price: 35000, quantity: 1 },
  { name: "Mouse", price: 500, quantity: 2 },
  { name: "Keyboard", price: 1200, quantity: 1 }
]

// Calculate subtotal
const subtotal = calculateSubtotal(items)
console.log("Subtotal:", formatPHP(subtotal)) // "₱37,200.00"

// Apply 10% discount
const discount = 10
const afterDiscount = applyDiscount(subtotal, discount)
console.log("After Discount:", formatPHP(afterDiscount)) // "₱33,480.00"

// Add 12% VAT
const total = addVAT(afterDiscount, 12)
console.log("Total (with VAT):", formatPHP(total)) // "₱37,497.60"

// Calculate change
const amountPaid = 40000
const change = calculateChange(amountPaid, total)
console.log("Change:", formatPHP(change)) // "₱2,502.40"
```

## E-commerce Examples

### 1. Order Total Calculation

```typescript
import { calculateOrderTotal, formatPHP } from "@/lib/currency"

const subtotal = 5000
const shipping = 150
const taxRate = 12
const discountPercent = 10

const orderTotal = calculateOrderTotal(subtotal, shipping, taxRate, discountPercent)
console.log(formatPHP(orderTotal)) // "₱5,194.00"
```

### 2. Shipping Cost Calculation

```typescript
import { calculateShipping, formatPHP } from "@/lib/currency"

// Fixed rate shipping
const flatRate = calculateShipping(undefined, 100)
console.log(formatPHP(flatRate)) // "₱100.00"

// Weight-based shipping (5kg)
const weightBased = calculateShipping(5)
console.log(formatPHP(weightBased)) // "₱100.00" (₱50 base + ₱10/kg × 5kg)
```

### 3. Product with Variants

```typescript
import PHP, { formatPHP } from "@/lib/currency"

const basePrice = 1200
const variants = {
  size: { small: 0, medium: 100, large: 200 },
  color: { red: 0, blue: 50, gold: 150 }
}

// Large + Gold variant
const finalPrice = PHP(basePrice)
  .add(variants.size.large)
  .add(variants.color.gold)

console.log(formatPHP(finalPrice)) // "₱1,550.00"
```

## Display Components

### 1. Price Display Component

```typescript
import { formatPHP } from "@/lib/currency"

export function PriceDisplay({ amount }: { amount: number }) {
  return (
    <div className="text-2xl font-bold">
      {formatPHP(amount)}
    </div>
  )
}

// Usage
<PriceDisplay amount={1234.56} /> // Displays: ₱1,234.56
```

### 2. Receipt Component

```typescript
import {
  calculateSubtotal,
  calculateVAT,
  addVAT,
  formatPHP
} from "@/lib/currency"

export function Receipt({ items }: { items: any[] }) {
  const subtotal = calculateSubtotal(items)
  const vat = calculateVAT(subtotal)
  const total = addVAT(subtotal)

  return (
    <div className="space-y-2">
      <div>Subtotal: {formatPHP(subtotal)}</div>
      <div>VAT (12%): {formatPHP(vat)}</div>
      <div className="font-bold">Total: {formatPHP(total)}</div>
    </div>
  )
}
```

## Utility Functions

### 1. Remove VAT from Price (Get Base Price)

```typescript
import { removeVAT, formatPHP } from "@/lib/currency"

const priceWithVAT = 1120 // Price includes 12% VAT
const basePrice = removeVAT(priceWithVAT)
console.log(formatPHP(basePrice)) // "₱1,000.00"
```

### 2. Comparison

```typescript
import { isGreaterThan, isEqual } from "@/lib/currency"

const price1 = 1000
const price2 = 999
const price3 = 1000

console.log(isGreaterThan(price1, price2)) // true
console.log(isEqual(price1, price3)) // true
```

### 3. Rounding

```typescript
import { roundToPeso, roundToNickel, formatPHP } from "@/lib/currency"

const price = 156.78

// Round to nearest peso
console.log(formatPHP(roundToPeso(price))) // "₱157.00"

// Round to nearest 5 centavos
console.log(formatPHP(roundToNickel(156.78))) // "₱156.80"
```

### 4. Input Handling

```typescript
import { parseInput, formatForInput } from "@/lib/currency"

// Parse user input
const userInput = "₱1,234.56"
const parsed = parseInput(userInput)
console.log(parsed.value) // 1234.56

// Format for input field (no symbol)
console.log(formatForInput(1234.56)) // "1,234.56"
```

## React Component Examples

### POS Total Display

```typescript
"use client"

import { useState } from "react"
import { calculateSubtotal, addVAT, formatPHP } from "@/lib/currency"
import { Card } from "@/components/ui/card"

export function POSTotal({ items }: { items: any[] }) {
  const subtotal = calculateSubtotal(items)
  const total = addVAT(subtotal)

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatPHP(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>VAT (12%):</span>
          <span>{formatPHP(subtotal.multiply(0.12))}</span>
        </div>
        <div className="flex justify-between text-2xl font-bold border-t pt-4">
          <span>Total:</span>
          <span>{formatPHP(total)}</span>
        </div>
      </div>
    </Card>
  )
}
```

### Product Card

```typescript
import { formatPHP } from "@/lib/currency"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export function ProductCard({ product }: { product: any }) {
  const hasDiscount = product.discountPrice && product.discountPrice < product.price

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-semibold">{product.name}</h3>
        <div className="mt-2 flex items-center gap-2">
          {hasDiscount ? (
            <>
              <span className="text-2xl font-bold text-red-600">
                {formatPHP(product.discountPrice)}
              </span>
              <span className="line-through text-gray-500">
                {formatPHP(product.price)}
              </span>
              <Badge variant="destructive">Sale</Badge>
            </>
          ) : (
            <span className="text-2xl font-bold">
              {formatPHP(product.price)}
            </span>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Add to Cart</Button>
      </CardFooter>
    </Card>
  )
}
```

## API Integration

### Sending currency to backend

```typescript
import { getValue } from "@/lib/currency"

async function createOrder(items: any[]) {
  const subtotal = calculateSubtotal(items)

  // Convert to number for API
  const response = await fetch("/api/orders", {
    method: "POST",
    body: JSON.stringify({
      items,
      subtotal: getValue(subtotal), // Send as number
      currency: "PHP"
    })
  })
}
```

## Best Practices

1. **Always use the PHP() function** for calculations to ensure precision
2. **Format only for display** - keep calculations as currency objects
3. **Use helper functions** instead of direct operations for clarity
4. **Store as numbers in database** - format only in the UI layer
5. **Be consistent** - use formatPHP() throughout your app

## Common Patterns

### Cart Total Hook

```typescript
import { useMemo } from "react"
import { calculateSubtotal, addVAT } from "@/lib/currency"

export function useCartTotal(items: any[]) {
  return useMemo(() => {
    const subtotal = calculateSubtotal(items)
    const total = addVAT(subtotal)
    return { subtotal, total }
  }, [items])
}
```

### SweetAlert with Currency

```typescript
import Swal from "sweetalert2"
import { formatPHP } from "@/lib/currency"

export function showPaymentSuccess(amount: number) {
  Swal.fire({
    title: "Payment Successful!",
    text: `Total Amount: ${formatPHP(amount)}`,
    icon: "success",
    confirmButtonText: "Print Receipt"
  })
}
```
