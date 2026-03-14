import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a monetary value from cents to a display string.
 * @param cents - The amount in cents (e.g. 120000 = ₱1,200.00)
 * @param options - Optional overrides
 * @param options.showSymbol - Prefix with ₱ (default: true)
 * @param options.alreadyDecimal - Skip /100 if value is already in pesos (default: false)
 */
export function formatCurrency(
  cents: number | undefined | null,
  options?: { showSymbol?: boolean; alreadyDecimal?: boolean }
): string {
  const value = cents ?? 0
  const decimal = options?.alreadyDecimal ? value : value / 100
  const formatted = decimal.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return options?.showSymbol === false ? formatted : `₱${formatted}`
}

/**
 * Convert cents to pesos (number). Useful for chart data.
 */
export function centsToPesos(cents: number | undefined | null): number {
  return (cents ?? 0) / 100
}
