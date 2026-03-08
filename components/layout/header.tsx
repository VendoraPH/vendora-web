"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShoppingCart, Search, User, Menu, Bell } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface HeaderProps {
  /** Header variant for different sections */
  variant?: "admin" | "pos" | "ecommerce" | "default"
  /** Show search bar */
  showSearch?: boolean
  /** Show shopping cart icon */
  showCart?: boolean
  /** Show user menu */
  showUser?: boolean
  /** Show notifications */
  showNotifications?: boolean
  /** Additional actions */
  actions?: ReactNode
  /** Custom className */
  className?: string
  /** Cart item count */
  cartCount?: number
  /** Notification count */
  notificationCount?: number
  /** Logo component */
  logo?: ReactNode
}

/**
 * Reusable Header Component
 *
 * A flexible header that adapts to different sections (admin, pos, ecommerce)
 * with customizable features.
 *
 * @example
 * // Admin Header
 * <Header variant="admin" showUser showNotifications />
 *
 * // E-commerce Header
 * <Header variant="ecommerce" showSearch showCart showUser cartCount={3} />
 *
 * // POS Header
 * <Header variant="pos" showUser />
 */
export function Header({
  variant = "default",
  showSearch = false,
  showCart = false,
  showUser = true,
  showNotifications = false,
  actions,
  className,
  cartCount = 0,
  notificationCount = 0,
  logo,
}: HeaderProps) {
  const variantStyles = {
    admin: "bg-background border-b",
    pos: "bg-primary text-primary-foreground",
    ecommerce: "bg-background border-b",
    default: "bg-background border-b",
  }

  const LogoComponent = logo || (
    <Link href="/" className="flex items-center gap-2">
      <div className={cn(
        "text-2xl font-bold",
        variant === "pos" ? "text-primary-foreground" : "text-primary"
      )}>
        Vendora
      </div>
    </Link>
  )

  return (
    <header className={cn(variantStyles[variant], className)}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Logo */}
            {LogoComponent}

            {/* Variant-specific info */}
            {variant === "pos" && (
              <Badge variant="secondary" className="hidden md:flex">
                Terminal 1
              </Badge>
            )}
          </div>

          {/* Center Section - Search */}
          {showSearch && (
            <div className="hidden md:flex flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="pl-10"
                />
              </div>
            </div>
          )}

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Custom Actions */}
            {actions}

            {/* Search Icon (Mobile) */}
            {showSearch && (
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
              >
                <Search className="h-5 w-5" />
              </Button>
            )}

            {/* Notifications */}
            {showNotifications && (
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </Badge>
                )}
              </Button>
            )}

            {/* Shopping Cart */}
            {showCart && (
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {cartCount > 9 ? "9+" : cartCount}
                  </Badge>
                )}
              </Button>
            )}

            {/* User Menu */}
            {showUser && (
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
