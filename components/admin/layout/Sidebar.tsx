"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  ShoppingCart,
  BarChart3 as BarChart3Icon,
  Settings,
  FileText,
  Bell,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

const navItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Vendors",
    href: "/admin/vendors",
    icon: Store,
    badge: "12",
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    title: "Products",
    href: "/admin/products",
    icon: Package,
  },
  {
    title: "Orders",
    href: "/admin/orders",
    icon: ShoppingCart,
    badge: "3",
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3Icon,
  },
  {
    title: "Payments",
    href: "/admin/payments",
    icon: CreditCard,
  },
  {
    title: "Reports",
    href: "/admin/reports",
    icon: FileText,
  },
  {
    title: "Notifications",
    href: "/admin/notifications",
    icon: Bell,
    badge: "5",
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
]

interface SidebarProps {
  onWidthChange?: (width: number) => void
  onCollapseChange?: (collapsed: boolean) => void
}

export function Sidebar({ onWidthChange, onCollapseChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(256) // 16rem = 256px
  const [isResizing, setIsResizing] = useState(false)
  const pathname = usePathname()
  const sidebarRef = useRef<HTMLElement>(null)

  const MIN_SIDEBAR_WIDTH = 200
  const MAX_SIDEBAR_WIDTH = 400

  // Handle resize mouse events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || collapsed) return

      const newWidth = e.clientX
      if (newWidth >= MIN_SIDEBAR_WIDTH && newWidth <= MAX_SIDEBAR_WIDTH) {
        setSidebarWidth(newWidth)
        onWidthChange?.(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing, collapsed, onWidthChange])

  // Notify parent of width changes
  useEffect(() => {
    const effectiveWidth = collapsed ? 80 : sidebarWidth
    onWidthChange?.(effectiveWidth)
  }, [collapsed, sidebarWidth, onWidthChange])

  // Notify parent of collapse changes
  useEffect(() => {
    onCollapseChange?.(collapsed)
  }, [collapsed, onCollapseChange])

  const handleCollapse = () => {
    setCollapsed(!collapsed)
  }

  const effectiveWidth = collapsed ? 80 : sidebarWidth

  return (
    <>
      {/* Collapse Toggle Button - positioned outside sidebar */}
      <button
        onClick={handleCollapse}
        className="fixed z-50 top-20 flex h-6 w-6 items-center justify-center rounded-full border border-purple-300 bg-white shadow-lg hover:bg-gray-100 transition-all duration-300"
        style={{
          left: collapsed ? '68px' : `${sidebarWidth - 12}px`
        }}
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4 text-purple-700" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-purple-700" />
        )}
      </button>

      <aside
        ref={sidebarRef}
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r border-purple-900 flex flex-col overflow-hidden",
          isResizing ? "" : "transition-all duration-300"
        )}
        style={{
          backgroundColor: '#110228',
          width: `${effectiveWidth}px`,
        }}
      >
        {/* Logo Section */}
        <div className={cn(
          "flex items-center h-16 border-b border-white/20 transition-all duration-300 flex-shrink-0",
          collapsed ? "px-2 justify-center" : "px-6"
        )}>
          <div className={cn(
            "flex items-center gap-2 transition-all duration-300",
            collapsed ? "justify-center w-full" : ""
          )}>
            <div className="relative flex items-center justify-center w-8 h-8 rounded">
              <Image src="/logos/logo.png" alt="Vendora Logo" width={32} height={32} className="object-contain" />
            </div>
            {!collapsed && (
              <div className="overflow-hidden transition-all duration-300">
                <h1 className="text-lg font-bold text-white whitespace-nowrap">Vendora</h1>
                <p className="text-xs text-white/80 whitespace-nowrap">Admin Dashboard</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className={cn(
          "flex-1 min-h-0 overflow-y-auto overflow-x-hidden pt-2 pb-4 transition-all duration-300",
          collapsed ? "px-2" : "px-3"
        )}>
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group",
                    collapsed ? "justify-center px-2" : "",
                    isActive
                      ? "bg-white text-purple-700 font-medium shadow-lg"
                      : "text-white/90 hover:bg-white/10 hover:text-white"
                  )}
                  title={collapsed ? item.title : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.title}</span>
                      {item.badge && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-xs text-white">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  {collapsed && item.badge && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-xs text-white">
                      {item.badge}
                    </span>
                  )}

                  {/* Tooltip for collapsed state */}
                  {collapsed && (
                    <div className="absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none whitespace-nowrap z-[100] shadow-xl">
                      <div className="flex items-center gap-2">
                        <span>{item.title}</span>
                        {item.badge && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-purple-600">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {/* Arrow */}
                      <div className="absolute -translate-y-1/2 border-4 border-transparent right-full top-1/2 border-r-gray-900"></div>
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Resize Handle */}
        {!collapsed && (
          <div
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize group hover:bg-purple-400 transition-colors z-50"
            onMouseDown={(e) => {
              e.preventDefault()
              setIsResizing(true)
            }}
          >
            {/* Hover indicator - shows arrows */}
            <div className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="flex items-center justify-center w-5 h-12 bg-purple-600 rounded shadow-lg">
                <div className="flex flex-col items-center">
                  <ChevronLeft className="w-3 h-3 text-white -mb-1" />
                  <ChevronRight className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
