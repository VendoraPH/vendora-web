"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface ResponsiveContainerProps {
  children: ReactNode
  className?: string
  /** Maximum width breakpoint: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full"
  /** Add horizontal padding */
  padded?: boolean
  /** Center the container */
  centered?: boolean
}

/**
 * Responsive Container Component
 *
 * A flexible container that adapts to different screen sizes.
 * Perfect for creating consistent layouts across devices.
 *
 * @example
 * <ResponsiveContainer maxWidth="xl" padded>
 *   <h1>My Content</h1>
 * </ResponsiveContainer>
 */
export function ResponsiveContainer({
  children,
  className,
  maxWidth = "xl",
  padded = true,
  centered = true,
}: ResponsiveContainerProps) {
  const maxWidthClasses = {
    sm: "max-w-screen-sm",
    md: "max-w-screen-md",
    lg: "max-w-screen-lg",
    xl: "max-w-screen-xl",
    "2xl": "max-w-screen-2xl",
    full: "max-w-full",
  }

  return (
    <div
      className={cn(
        "w-full",
        maxWidthClasses[maxWidth],
        padded && "px-4 sm:px-6 lg:px-8",
        centered && "mx-auto",
        className
      )}
    >
      {children}
    </div>
  )
}
