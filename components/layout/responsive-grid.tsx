"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ResponsiveGridProps {
  children: ReactNode
  className?: string
  /** Number of columns for each breakpoint */
  cols?: {
    mobile?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
    "2xl"?: number
  }
  /** Gap between items */
  gap?: "none" | "sm" | "md" | "lg" | "xl"
}

/**
 * Responsive Grid Component
 *
 * Automatically adjusts the number of columns based on screen size.
 * Perfect for product listings, image galleries, and card layouts.
 *
 * @example
 * <ResponsiveGrid
 *   cols={{ mobile: 1, sm: 2, md: 3, lg: 4 }}
 *   gap="md"
 * >
 *   {products.map(product => <ProductCard key={product.id} {...product} />)}
 * </ResponsiveGrid>
 */
export function ResponsiveGrid({
  children,
  className,
  cols = { mobile: 1, sm: 2, md: 3, lg: 4 },
  gap = "md",
}: ResponsiveGridProps) {
  const gapClasses = {
    none: "gap-0",
    sm: "gap-2 sm:gap-3",
    md: "gap-4 sm:gap-6",
    lg: "gap-6 sm:gap-8",
    xl: "gap-8 sm:gap-10",
  }

  const getGridCols = () => {
    const classes: string[] = []

    if (cols.mobile) classes.push(`grid-cols-${cols.mobile}`)
    if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`)
    if (cols.md) classes.push(`md:grid-cols-${cols.md}`)
    if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`)
    if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`)
    if (cols["2xl"]) classes.push(`2xl:grid-cols-${cols["2xl"]}`)

    return classes.join(" ")
  }

  return (
    <div className={cn("grid", getGridCols(), gapClasses[gap], className)}>
      {children}
    </div>
  )
}

/**
 * Preset configurations for common layouts
 */

/** Product Grid - Perfect for POS product selection */
export function ProductGrid({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <ResponsiveGrid
      cols={{ mobile: 2, sm: 3, md: 4, lg: 5, xl: 6 }}
      gap="md"
      className={className}
    >
      {children}
    </ResponsiveGrid>
  )
}

/** E-commerce Grid - Perfect for online store product listings */
export function EcommerceGrid({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <ResponsiveGrid
      cols={{ mobile: 1, sm: 2, md: 2, lg: 3, xl: 4 }}
      gap="lg"
      className={className}
    >
      {children}
    </ResponsiveGrid>
  )
}

/** Dashboard Grid - Perfect for dashboard widgets/cards */
export function DashboardGrid({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <ResponsiveGrid
      cols={{ mobile: 1, sm: 1, md: 2, lg: 3, xl: 4 }}
      gap="md"
      className={className}
    >
      {children}
    </ResponsiveGrid>
  )
}
