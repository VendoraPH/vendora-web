"use client"

import { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/lib/responsive"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

interface ResponsiveSidebarProps {
  children: ReactNode
  /** Trigger button for mobile drawer */
  trigger?: ReactNode
  /** Sidebar position */
  side?: "left" | "right"

  /** Additional className */
  className?: string
  /** Width of the sidebar on desktop */
  width?: "sm" | "md" | "lg"
}

/**
 * Responsive Sidebar Component
 *
 * Shows as a sidebar on desktop and a drawer/sheet on mobile.
 * Perfect for filters, cart, navigation menus, etc.
 *
 * @example
 * <ResponsiveSidebar
 *   trigger={<Button>Open Filters</Button>}
 *   side="left"
 * >
 *   <FilterOptions />
 * </ResponsiveSidebar>
 */
export function ResponsiveSidebar({
  children,
  trigger,
  side = "left",
  className,
  width = "md",
}: ResponsiveSidebarProps) {
  const isMobile = useIsMobile()

  const widthClasses = {
    sm: "w-64",
    md: "w-80",
    lg: "w-96",
  }

  // On mobile, render as a Sheet (drawer)
  if (isMobile) {
    return (
      <Sheet>
        {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
        <SheetContent side={side} className={className}>
          {children}
        </SheetContent>
      </Sheet>
    )
  }

  // On desktop, render as a fixed sidebar
  return (
    <aside
      className={cn(
        "hidden lg:block",
        widthClasses[width],
        "shrink-0",
        side === "left" ? "border-r" : "border-l",
        className
      )}
    >
      <div className="sticky top-0 h-screen overflow-y-auto p-6">
        {children}
      </div>
    </aside>
  )
}

/**
 * Responsive Layout with Sidebar
 *
 * Complete layout with sidebar and main content area.
 * Automatically adjusts based on screen size.
 */
interface ResponsiveLayoutProps {
  sidebar: ReactNode
  children: ReactNode
  sidebarTrigger?: ReactNode
  sidebarSide?: "left" | "right"
  sidebarWidth?: "sm" | "md" | "lg"
  className?: string
}

export function ResponsiveLayout({
  sidebar,
  children,
  sidebarTrigger,
  sidebarSide = "left",
  sidebarWidth = "md",
  className,
}: ResponsiveLayoutProps) {
  return (
    <div className={cn("flex min-h-screen", className)}>
      {sidebarSide === "left" && (
        <ResponsiveSidebar
          trigger={sidebarTrigger}
          side={sidebarSide}
          width={sidebarWidth}
        >
          {sidebar}
        </ResponsiveSidebar>
      )}

      <main className="flex-1 overflow-x-hidden">{children}</main>

      {sidebarSide === "right" && (
        <ResponsiveSidebar
          trigger={sidebarTrigger}
          side={sidebarSide}
          width={sidebarWidth}
        >
          {sidebar}
        </ResponsiveSidebar>
      )}
    </div>
  )
}
