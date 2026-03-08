import currency from "currency.js"

/**
 * Philippine Peso (PHP) Currency Configuration
 *
 * This utility provides consistent currency formatting throughout the application
 * using Philippine Peso as the default currency.
 */

// Philippine Peso Configuration
export const PHP = (value: currency.Any) =>
  currency(value, {
    symbol: "₱",
    precision: 2,
    separator: ",",
    decimal: ".",
    pattern: "!#", // Symbol before amount (₱1,234.56)
  })

// Alternative: Symbol after amount (1,234.56₱)
export const PHPAfter = (value: currency.Any) =>
  currency(value, {
    symbol: "₱",
    precision: 2,
    separator: ",",
    decimal: ".",
    pattern: "#!", // Amount before symbol
  })

// Format without symbol, just the number
export const formatNumber = (value: currency.Any) =>
  currency(value, {
    symbol: "",
    precision: 2,
    separator: ",",
    decimal: ".",
  }).format()

// Format with PHP text instead of symbol
export const formatPHPText = (value: currency.Any) =>
  `PHP ${currency(value, {
    symbol: "",
    precision: 2,
    separator: ",",
    decimal: ".",
  }).format()}`

/**
 * Currency Helper Functions
 */

// Add two amounts
export const add = (a: currency.Any, b: currency.Any) => PHP(a).add(b)

// Subtract two amounts
export const subtract = (a: currency.Any, b: currency.Any) => PHP(a).subtract(b)

// Multiply amount
export const multiply = (amount: currency.Any, multiplier: number) =>
  PHP(amount).multiply(multiplier)

// Divide amount
export const divide = (amount: currency.Any, divisor: number) =>
  PHP(amount).divide(divisor)

// Calculate percentage
export const percentage = (amount: currency.Any, percent: number) =>
  PHP(amount).multiply(percent / 100)

// Add percentage (e.g., add 12% VAT)
export const addPercentage = (amount: currency.Any, percent: number) =>
  PHP(amount).add(PHP(amount).multiply(percent / 100))

// Subtract percentage (e.g., apply discount)
export const subtractPercentage = (amount: currency.Any, percent: number) =>
  PHP(amount).subtract(PHP(amount).multiply(percent / 100))

// Calculate total from array of amounts
export const calculateTotal = (amounts: currency.Any[]) =>
  amounts.reduce((total: currency, amount) => total.add(amount), PHP(0))

// Format as Philippine Peso string
export const formatPHP = (value: currency.Any): string => PHP(value).format()

// Get value as number
export const getValue = (value: currency.Any): number => PHP(value).value

/**
 * POS-specific utilities
 */

// Calculate change
export const calculateChange = (amountPaid: currency.Any, total: currency.Any) =>
  PHP(amountPaid).subtract(total)

// Calculate discount amount
export const calculateDiscount = (
  amount: currency.Any,
  discountPercent: number
) => PHP(amount).multiply(discountPercent / 100)

// Apply discount
export const applyDiscount = (amount: currency.Any, discountPercent: number) =>
  subtractPercentage(amount, discountPercent)

// Calculate VAT (12% in Philippines)
export const calculateVAT = (amount: currency.Any, vatRate: number = 12) =>
  percentage(amount, vatRate)

// Add VAT to amount
export const addVAT = (amount: currency.Any, vatRate: number = 12) =>
  addPercentage(amount, vatRate)

// Remove VAT from amount (get base price)
export const removeVAT = (amount: currency.Any, vatRate: number = 12) =>
  PHP(amount).divide(1 + vatRate / 100)

// Calculate subtotal from items
export const calculateSubtotal = (
  items: Array<{ price: currency.Any; quantity: number }>
) => {
  return items.reduce((total, item) => {
    return total.add(PHP(item.price).multiply(item.quantity))
  }, PHP(0))
}

/**
 * E-commerce specific utilities
 */

// Calculate shipping cost based on weight or fixed rate
export const calculateShipping = (weight?: number, fixedRate?: number) => {
  if (fixedRate) return PHP(fixedRate)
  // Example: ₱50 base + ₱10 per kg
  const baseRate = 50
  const perKgRate = 10
  return PHP(baseRate).add(PHP(perKgRate).multiply(weight || 0))
}

// Calculate order total with shipping and tax
export const calculateOrderTotal = (
  subtotal: currency.Any,
  shipping: currency.Any = 0,
  taxRate: number = 12,
  discount: number = 0
) => {
  const discountedSubtotal = applyDiscount(subtotal, discount)
  const withTax = addVAT(discountedSubtotal, taxRate)
  return withTax.add(shipping)
}

/**
 * Display utilities
 */

// Format for display in tables/lists
export const formatForDisplay = (value: currency.Any): string =>
  formatPHP(value)

// Format for input fields (no symbol)
export const formatForInput = (value: currency.Any): string => formatNumber(value)

// Parse input value
export const parseInput = (value: string): currency => {
  const cleaned = value.replace(/[₱,PHP\s]/g, "")
  return PHP(cleaned)
}

// Check if amount is zero
export const isZero = (value: currency.Any): boolean => PHP(value).value === 0

// Check if amount is positive
export const isPositive = (value: currency.Any): boolean => PHP(value).value > 0

// Check if amount is negative
export const isNegative = (value: currency.Any): boolean => PHP(value).value < 0

// Compare two amounts
export const isGreaterThan = (a: currency.Any, b: currency.Any): boolean =>
  PHP(a).value > PHP(b).value

export const isLessThan = (a: currency.Any, b: currency.Any): boolean =>
  PHP(a).value < PHP(b).value

export const isEqual = (a: currency.Any, b: currency.Any): boolean =>
  PHP(a).value === PHP(b).value

/**
 * Rounding utilities
 */

// Round to nearest peso (no centavos)
export const roundToPeso = (value: currency.Any) =>
  PHP(Math.round(PHP(value).value))

// Round to nearest 5 centavos
export const roundToNickel = (value: currency.Any) =>
  PHP(Math.round(PHP(value).value * 20) / 20)

// Round to nearest 25 centavos
export const roundToQuarter = (value: currency.Any) =>
  PHP(Math.round(PHP(value).value * 4) / 4)

export default PHP
