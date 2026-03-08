"use client"

import { ReactNode, useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  Settings,
  Menu,
  LogOut,
  User,
  ChevronDown,
  Store,
  CreditCard,
  HelpCircle,
  ClipboardList,
  Megaphone,
  Calculator,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Loader2,
  UtensilsCrossed,
  BookOpen
} from "lucide-react"
import { NotificationPanel } from "@/components/pos/NotificationPanel"
import { ThemeToggle } from "@/components/pos/ThemeToggle"
// import { NetworkStatusBadge } from "@/components/pos/NetworkStatusBadge"
import { OfflineBanner } from "@/components/pos/OfflineBanner"
import { useOfflineInit } from "@/hooks/use-offline-init"
import { db } from "@/lib/db"
import { syncService } from "@/lib/sync-service"
import { authService } from "@/services/auth-jwt.service"
import { tokenManager } from "@/lib/axios-client"
import { TOKEN_CONFIG } from "@/config/api.config"

// Sidebar menu structure based on data.docx
const sidebarSections = [
  {
    title: "Primary Menus",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/pos/dashboard", comingSoon: false },
      { icon: ShoppingCart, label: "POS", href: "/pos/pos-screen", comingSoon: false },
      { icon: UtensilsCrossed, label: "Food Menu", href: "/pos/food-menu", comingSoon: false },
      { icon: Package, label: "Products", href: "/pos/products", comingSoon: false },
      { icon: CreditCard, label: "Credit Accounts", href: "/pos/credit-accounts", comingSoon: false },
      { icon: ClipboardList, label: "Orders", href: "/pos/orders", comingSoon: false },
      { icon: Users, label: "Customers", href: "/pos/customers", comingSoon: false },
    ]
  },
  {
    title: "Growth & Finance",
    items: [
      { icon: Store, label: "E-commerce Store", href: "/pos/ecommerce", comingSoon: false },
      { icon: CreditCard, label: "Payments", href: "/pos/payments", comingSoon: false },
      { icon: BarChart3, label: "Reports and Analytics", href: "/pos/reports", comingSoon: true },
      { icon: Megaphone, label: "Marketing and Ads", href: "/pos/marketing", comingSoon: true },
    ]
  },
  {
    title: "Management",
    items: [
      { icon: Calculator, label: "Accounting", href: "/pos/accounting", comingSoon: true },
      { icon: BookOpen, label: "Ledger", href: "/pos/ledger", comingSoon: false },
      { icon: Settings, label: "Settings", href: "/pos/settings", comingSoon: true },
      { icon: HelpCircle, label: "Help and Support", href: "/pos/help", comingSoon: true },
    ]
  }
]

/**
 * POS Main Layout - Conditionally applies sidebar/nav
 * Auth pages (login, register, etc.) will use their own layout
 * App pages (dashboard, sales, etc.) will use this layout with sidebar
 */
export default function POSLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [wasCollapsedByRoute, setWasCollapsedByRoute] = useState(false)
  const [mobileSidebarMoreOpen, setMobileSidebarMoreOpen] = useState(false)
  const [userData, setUserData] = useState<{ name?: string; email?: string } | null>(null)
  const [mounted, setMounted] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Initialize offline support for all POS pages
  const offline = useOfflineInit()
  const [isInitialSync, setIsInitialSync] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Check if this is first login (no products in IndexedDB)
    const checkInitialSync = async () => {
      try {
        // Don't sync if user is not authenticated (e.g. on login page)
        if (!tokenManager.getAccessToken()) return
        const productCount = await db.products.count()
        if (productCount === 0 && navigator.onLine) {
          setIsInitialSync(true)
          await syncService.pullAllFresh()
          setIsInitialSync(false)
        }
      } catch {
        setIsInitialSync(false)
      }
    }
    checkInitialSync()
  }, [])

  // Auto-collapse sidebar when navigating to POS screen for maximum width
  useEffect(() => {
    if (pathname === "/pos/pos-screen") {
      if (!sidebarCollapsed) {
        setSidebarCollapsed(true)
        setWasCollapsedByRoute(true)
      }
    } else if (wasCollapsedByRoute) {
      setSidebarCollapsed(false)
      setWasCollapsedByRoute(false)
    }
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  // Resizable sidebar state
  const [sidebarWidth, setSidebarWidth] = useState(256) // 16rem = 256px (default w-64)
  const [isResizing, setIsResizing] = useState(false)
  const MIN_SIDEBAR_WIDTH = 200
  const MAX_SIDEBAR_WIDTH = 400
  const sidebarRef = useRef<HTMLElement>(null)

  // Check if desktop on mount and resize
  useEffect(() => {
    const checkDesktop = () => {
      const newIsDesktop = window.innerWidth >= 1024  // 1024px+ for sidebar (laptop/desktop)

      // Close mobile sidebar when switching to desktop
      if (newIsDesktop && sidebarOpen) {
        setSidebarOpen(false)
        setMobileSidebarMoreOpen(false)
      }

      // Reset sidebar width if it's outside bounds on mobile
      if (!newIsDesktop && sidebarWidth !== 256) {
        setSidebarWidth(256)
      }

      // Stop resizing if switching to mobile
      if (!newIsDesktop && isResizing) {
        setIsResizing(false)
      }
    }
    checkDesktop()
    window.addEventListener('resize', checkDesktop)
    return () => window.removeEventListener('resize', checkDesktop)
  }, [sidebarOpen, sidebarWidth, isResizing])

  // Handle resize mouse events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || sidebarCollapsed) return

      const newWidth = e.clientX
      if (newWidth >= MIN_SIDEBAR_WIDTH && newWidth <= MAX_SIDEBAR_WIDTH) {
        setSidebarWidth(newWidth)
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
  }, [isResizing, sidebarCollapsed, MIN_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH])

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (typeof window === "undefined") return
      try {
        const cached = localStorage.getItem(TOKEN_CONFIG.USER_PROFILE_KEY)
        if (cached) {
          try {
            const parsed = JSON.parse(cached) as { name?: string; email?: string }
            setUserData(parsed)
          } catch {
            localStorage.removeItem(TOKEN_CONFIG.USER_PROFILE_KEY)
          }
        }

        if (!tokenManager.getAccessToken()) return
        const user = await authService.pos.me()
        const displayName = 'business_name' in user ? user.business_name : user.full_name
        setUserData({
          name: displayName,
          email: user.email,
        })
      } catch {
        // Silently fail - keep cached/default
      }
    }

    if (!pathname?.startsWith("/pos/auth")) {
      fetchUserData()
    }
  }, [pathname])

  // Get first letter of name for avatar
  const avatarLetter = userData?.name?.charAt(0).toUpperCase() || 'V'
  const displayName = userData?.name || 'Vendor Store'
  const displayEmail = userData?.email || 'vendor@example.com'

  // Check if current route is an auth page
  const isAuthPage = pathname?.startsWith("/pos/auth")

  // If it's an auth page, just render children without sidebar/nav
  if (isAuthPage) {
    return <>{children}</>
  }

  // Check if current page is the POS terminal for full-bleed layout
  const isPOSDashboard = pathname === "/pos/dashboard"
  const isPOSScreen = pathname === "/pos/pos-screen"
  const pageBackgroundClass = isPOSDashboard
    ? "bg-white dark:bg-[#0b0b1a]"
    : isPOSScreen
      ? "bg-gray-50 dark:bg-gradient-to-br dark:from-[#1f1633] dark:via-[#241a3a] dark:to-[#2b1f4a]"
      : "bg-background"
  const mainBackgroundClass = isPOSScreen ? "bg-transparent" : "bg-gray-100 dark:bg-[#0f0f23]"

  // Calculate effective sidebar width for styles
  const effectiveSidebarWidth = sidebarCollapsed ? 80 : sidebarWidth

  // Show loading screen until client is ready to prevent hydration crash
  if (!mounted) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#110228' }}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center gap-4">
            <div className="relative flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg p-3">
              <Image src="/new-logo/vendora 2.png" alt="Vendora" width={48} height={48} className="object-contain" />
            </div>
            <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  // For non-auth pages, render with sidebar and navigation
  return (
    <div
      className={`min-h-screen overflow-x-hidden ${pageBackgroundClass}`}
      style={{
        '--sidebar-width': `${effectiveSidebarWidth}px`
      } as React.CSSProperties}
      suppressHydrationWarning
    >
      {/* Logout Loading Overlay */}
      {isLoggingOut && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center animate-in fade-in duration-300" style={{ backgroundColor: '#110228' }}>
          {/* Decorative background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl" />
          </div>

          {/* Content */}
          <div className="relative flex flex-col items-center gap-8 p-8">
            {/* Logo */}
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-3xl blur-xl animate-pulse" />
              <div className="relative flex items-center justify-center w-32 h-32 bg-white rounded-3xl shadow-2xl p-5">
                <Image
                  src="/new-logo/vendora 2.png"
                  alt="Vendora"
                  width={96}
                  height={96}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Brand name */}
            <h1 className="text-4xl font-bold text-white tracking-wide">Vendora</h1>

            {/* Loading indicator */}
            <div className="flex flex-col items-center gap-4 mt-2">
              <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
              <p className="text-purple-300 text-sm">Signing out...</p>
            </div>
          </div>
        </div>
      )}

      {/* Initial Sync Overlay - shown on first login */}
      {isInitialSync && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center animate-in fade-in duration-300" style={{ backgroundColor: '#110228' }}>
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
          </div>
          <div className="relative flex flex-col items-center gap-6 p-8">
            <div className="relative flex items-center justify-center w-24 h-24 bg-white rounded-2xl shadow-lg p-4">
              <Image src="/new-logo/vendora 2.png" alt="Vendora" width={72} height={72} className="object-contain" />
            </div>
            <h2 className="text-2xl font-bold text-white">Syncing your data...</h2>
            <p className="text-purple-300 text-sm text-center max-w-xs">Setting up your products, customers, and more for offline use. This only happens once.</p>
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        </div>
      )}

      {/* Sidebar Overlay (Mobile/Tablet) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => {
            setSidebarOpen(false)
            setMobileSidebarMoreOpen(false)
          }}
        />
      )}

      {/* Collapse Toggle Button (Laptop/Desktop Only - 1024px+) - Hidden on Mobile/Tablet */}
      <div
        className="fixed z-50 top-20 transition-all duration-300 hidden lg:block"
        style={{
          left: sidebarCollapsed ? '68px' : `${sidebarWidth - 12}px`
        }}
      >
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="w-6 h-6 bg-white border-purple-300 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-[#1a1a35]"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4 text-purple-700" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-purple-700" />
          )}
        </Button>
      </div>

      {/* Sidebar - Mobile/Tablet: Hidden with hamburger toggle | Laptop/Desktop: Always visible & Collapsible */}
      <aside
        ref={sidebarRef}
        className={`
          fixed top-0 left-0 h-screen border-r border-purple-900 z-40
          transform ease-in-out overflow-hidden flex flex-col
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
          ${isResizing ? "" : "transition-all duration-300"}
          w-64 lg:w-[var(--sidebar-width)]
        `}
        style={{
          backgroundColor: '#110228',
        }}
      >
        {/* Logo */}
        <div className={`flex items-center h-16 px-6 border-b border-white/20 transition-all duration-300 flex-shrink-0 ${sidebarCollapsed ? 'lg:px-2 lg:justify-center' : ''}`}>
          <div className={`flex items-center gap-2 transition-all duration-300 ${sidebarCollapsed ? 'lg:justify-center lg:w-full' : ''}`}>
            <div className="relative flex items-center justify-center w-8 h-8 rounded">
              <Image src="/new-logo/vendora 2 white.png" alt="Vendora Logo" width={32} height={32} className="object-contain" />
            </div>
            <div className={`overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
              <h1 className="text-lg font-bold text-white whitespace-nowrap">Vendora</h1>
              <p className="text-xs text-white/80 whitespace-nowrap">Vendor Dashboard</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 min-h-0 px-3 pt-2 pb-4 overflow-y-auto overflow-x-hidden transition-all duration-300 ${sidebarCollapsed ? 'lg:px-2' : ''}`}>
          <div className="space-y-4">
            {/* Mobile/Tablet: Show only Primary Menus + View More button */}
            <div className="lg:hidden">
              {/* Primary Menus Section */}
              <div>
                <h3 className="px-3 mb-2 text-xs font-semibold tracking-wider uppercase text-white/70">
                  {sidebarSections[0]?.title}
                </h3>
                <ul className="space-y-1">
                  {sidebarSections[0]?.items.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || (item.href === "/pos/pos-screen" && pathname === "/pos")

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => {
                            setSidebarOpen(false)
                            setMobileSidebarMoreOpen(false)
                          }}
                          className={`
                            relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                            transition-all duration-200
                            ${isActive
                              ? "bg-white text-purple-700 font-medium shadow-lg"
                              : "text-white/90 hover:bg-white/10 hover:text-white"
                            }
                          `}
                        >
                          <Icon className="flex-shrink-0 w-5 h-5" />
                          <span className="flex-1">{item.label}</span>
                          {item.comingSoon && (
                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gradient-to-r from-purple-500 to-violet-600 text-white whitespace-nowrap shadow-sm">
                              Soon
                            </span>
                          )}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>

              {/* View More Button */}
              <div className="mt-4">
                <button
                  onClick={() => setMobileSidebarMoreOpen(!mobileSidebarMoreOpen)}
                  className={`
                    w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm
                    transition-all duration-200
                    ${mobileSidebarMoreOpen ? "bg-white/20 text-white" : "text-white/90 hover:bg-white/10 hover:text-white"}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <MoreVertical className="flex-shrink-0 w-5 h-5" />
                    <span className="flex-1">View More</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${mobileSidebarMoreOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* View More Dropdown Content - Always rendered, shown/hidden with CSS */}
                <div className={`mt-2 space-y-4 pl-4 overflow-hidden transition-all duration-300 ${mobileSidebarMoreOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                  }`}>
                  {sidebarSections.slice(1).map((section, sectionIndex) => (
                    <div key={sectionIndex}>
                      <h3 className="px-3 mb-2 text-xs font-semibold tracking-wider uppercase text-white/60">
                        {section.title}
                      </h3>
                      <ul className="space-y-1">
                        {section.items.map((item) => {
                          const Icon = item.icon
                          const isActive = pathname === item.href

                          return (
                            <li key={item.href}>
                              <Link
                                href={item.href}
                                onClick={() => {
                                  setSidebarOpen(false)
                                  setMobileSidebarMoreOpen(false)
                                }}
                                className={`
                                  relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                                  transition-all duration-200
                                  ${isActive
                                    ? "bg-white text-purple-700 font-medium shadow-lg"
                                    : "text-white/90 hover:bg-white/10 hover:text-white"
                                  }
                                `}
                              >
                                <Icon className="flex-shrink-0 w-5 h-5" />
                                <span className="flex-1">{item.label}</span>
                                {item.comingSoon && (
                                  <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gradient-to-r from-purple-500 to-violet-600 text-white whitespace-nowrap shadow-sm">
                                    Soon
                                  </span>
                                )}
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Laptop/Desktop: Show all sections normally */}
            <div className="hidden lg:block">
              {sidebarSections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="mb-4">
                  {/* Section Title - Hidden when collapsed on laptop/desktop */}
                  <h3 className={`px-3 mb-1.5 text-xs font-semibold tracking-wider uppercase text-white/70 ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
                    {section.title}
                  </h3>

                  {/* Section Items */}
                  <ul className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon
                      const isActive = pathname === item.href || (item.href === "/pos/pos-screen" && pathname === "/pos")

                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`
                              relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                              transition-all duration-200 group
                              ${sidebarCollapsed ? 'lg:justify-center lg:px-2' : ''}
                              ${isActive
                                ? "bg-white text-purple-700 font-medium shadow-lg"
                                : "text-white/90 hover:bg-white/10 hover:text-white"
                              }
                            `}
                            title={sidebarCollapsed ? item.label : ''}
                          >
                            <Icon className="flex-shrink-0 w-5 h-5" />
                            <span className={`flex-1 ${sidebarCollapsed ? 'lg:hidden' : ''}`}>{item.label}</span>
                            <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gradient-to-r from-purple-500 to-violet-600 text-white whitespace-nowrap shadow-sm ${sidebarCollapsed ? 'lg:hidden' : ''} ${item.comingSoon ? '' : 'hidden'}`}>
                              Soon
                            </span>

                            {/* Tooltip for collapsed state - Laptop/Desktop only */}
                            {sidebarCollapsed && (
                              <div className="hidden lg:block absolute left-full ml-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none whitespace-nowrap z-[100] shadow-xl">
                                <div className="flex items-center gap-2">
                                  <span>{item.label}</span>
                                  {item.comingSoon && (
                                    <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-gradient-to-r from-purple-500 to-violet-600 shadow-sm">
                                      Soon
                                    </span>
                                  )}
                                </div>
                                {/* Arrow */}
                                <div className="absolute -translate-y-1/2 border-4 border-transparent right-full top-1/2 border-r-gray-900"></div>
                              </div>
                            )}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </nav>

        {/* Resize Handle - Desktop Only */}
        {!sidebarCollapsed && (
          <div
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize group hover:bg-purple-400 transition-colors z-50 hidden lg:block"
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

      {/* Main Content */}
      <main
        className={`
          min-h-screen ${mainBackgroundClass} overflow-x-hidden
          ${isResizing ? "" : "transition-all duration-300"}
          ml-0 lg:ml-[var(--sidebar-width)]
        `}
        style={{
          paddingTop: '4rem',
        }}
      >
        {/* Offline Banner */}
        <OfflineBanner
          isOnline={offline.isOnline}
          networkQuality={offline.networkQuality}
          pendingCount={offline.pendingCount + offline.dirtyCount}
        />

        {/* Header */}
        <header
          className={`
            fixed left-0 z-30 flex items-center h-16 px-6 border-b w-full
            ${isResizing ? "" : "transition-all duration-300"}
            lg:left-[var(--sidebar-width)] lg:w-[calc(100%-var(--sidebar-width))]
          `}
          style={{
            backgroundColor: '#2e0f5f',
            borderColor: '#1f0a3d',
            top: 0,
          }}
        >
          <div className="flex items-center justify-between flex-1">
            {/* Left Side - Logo (Mobile) / Title & Search (Desktop) */}
            <div className="flex items-center flex-1 gap-4">
              {/* Mobile/Tablet: Clickable Logo to open sidebar */}
              <button
                onClick={() => {
                  setSidebarOpen(!sidebarOpen)
                  if (sidebarOpen) setMobileSidebarMoreOpen(false)
                }}
                className="flex items-center gap-2 lg:hidden"
              >
                <div className="relative flex items-center justify-center w-8 h-8 rounded">
                  <Image src="/new-logo/vendora 2 white.png" alt="Vendora Logo" width={32} height={32} className="object-contain" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">Vendora</h1>
                </div>
              </button>

              {/* Laptop/Desktop: Title */}
              <h2 className="hidden text-xl font-semibold text-white lg:block">POS System</h2>

              {/*
              Search Bar (disabled per request)
              <div className="items-center hidden w-full max-w-md gap-2 px-4 py-2 ml-4 border rounded-lg lg:flex bg-white/10 border-white/20">
                <Search className="w-4 h-4 text-white/70" />
                <input
                  type="text"
                  placeholder="Search products, customers..."
                  className="w-full text-sm text-white bg-transparent border-none outline-none placeholder:text-white/60"
                />
              </div>
              */}
            </div>

            {/* Right Side - Theme Toggle, Notifications & User Profile */}
            <div className="flex items-center gap-3">
              {/* Network Status — hidden for now */}

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Notifications */}
              <NotificationPanel />

              {/* User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center h-auto gap-3 px-3 py-2 hover:bg-white/10"
                  >
                    {/* Avatar */}
                    <div className="flex items-center justify-center font-semibold text-purple-700 bg-white rounded-full h-9 w-9">
                      {avatarLetter}
                    </div>
                    {/* User Info */}
                    <div className="flex-col items-start hidden lg:flex">
                      <span className="text-sm font-semibold text-white">{displayName}</span>
                      <span className="text-xs text-white/70">{displayEmail}</span>
                    </div>
                    <ChevronDown className="hidden w-4 h-4 text-white lg:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="text-gray-900">My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer hover:bg-gray-50 dark:bg-[#1a1a35]">
                    <User className="w-4 h-4 mr-2 text-gray-600" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer hover:bg-gray-50 dark:bg-[#1a1a35]">
                    <Store className="w-4 h-4 mr-2 text-gray-600" />
                    <span>My Store</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer hover:bg-gray-50 dark:bg-[#1a1a35]">
                    <CreditCard className="w-4 h-4 mr-2 text-gray-600" />
                    <span>Subscription</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer hover:bg-gray-50 dark:bg-[#1a1a35]">
                    <Settings className="w-4 h-4 mr-2 text-gray-600" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer hover:bg-gray-50 dark:bg-[#1a1a35]">
                    <HelpCircle className="w-4 h-4 mr-2 text-gray-600" />
                    <span>Help & Support</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 cursor-pointer hover:bg-red-50 focus:bg-red-50 focus:text-red-700"
                    onClick={async () => {
                      setIsLoggingOut(true)
                      try {
                        await authService.pos.logout()
                        sessionStorage.setItem('showLogout', 'true')
                        window.location.href = "/pos/auth/login"
                      } catch (error) {
                        console.error('Logout error:', error)
                        sessionStorage.setItem('showLogout', 'true')
                        window.location.href = "/pos/auth/login"
                      }
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className={`max-w-full overflow-x-hidden ${isPOSScreen ? '' : 'px-4 pt-6 pb-6 sm:px-6 sm:pt-6 sm:pb-6'}`}>
          {children}
        </div>

        {/* Floating Menu Button - Tablet Only (640px - 1023px) */}
        <div className="fixed bottom-6 right-6 z-50 hidden sm:block lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="w-14 h-14 rounded-full bg-white hover:bg-white/90 text-gray-900 shadow-xl"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>

      </main>
    </div>
  )
}
{/*
        Sidebar search (disabled per request)
        <div className={`px-4 py-3 flex-shrink-0 ${sidebarCollapsed ? 'lg:hidden' : ''}`}>
          <div className="relative">
            <Search className="absolute w-4 h-4 transform -translate-y-1/2 left-3 top-1/2 text-white/60" />
            <input
              type="text"
              placeholder="Search menu"
              className="w-full py-2 pl-10 pr-4 text-sm text-white border rounded-lg bg-white/10 border-white/20 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
            />
          </div>
        </div>
        */}
