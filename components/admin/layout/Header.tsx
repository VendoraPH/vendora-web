"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Bell, Search, Settings, LogOut, User, ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { authService } from "@/services/auth-jwt.service"

export function Header() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      await authService.admin.logout()
      // Set flag to show logout success message on login page
      sessionStorage.setItem('showLogout', 'true')
      router.push("/admin/auth/login")
    } catch (error) {
      console.error("Logout error:", error)
      // Clear tokens anyway and redirect
      sessionStorage.setItem('showLogout', 'true')
      router.push("/admin/auth/login")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <header
      className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b px-6"
      style={{
        backgroundColor: '#2e0f5f',
        borderColor: '#1f0a3d',
      }}
    >
      {/* Left Side - Title & Search Bar */}
      <div className="flex items-center flex-1 gap-4">
        <h2 className="text-xl font-semibold text-white">Admin Portal</h2>

        {/* Search Bar */}
        <div className="hidden md:flex items-center w-full max-w-md gap-2 px-4 py-2 border rounded-lg bg-white/10 border-white/20">
          <Search className="w-4 h-4 text-white/70" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full text-sm text-white bg-transparent border-none outline-none placeholder:text-white/60"
          />
        </div>
      </div>

      {/* Right Side - Notifications & User Menu */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative hover:bg-white/10">
              <Bell className="h-5 w-5 text-white" />
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
              >
                3
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-96 overflow-y-auto">
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                <div className="flex w-full items-center justify-between">
                  <span className="font-medium">New vendor registration</span>
                  <span className="text-xs text-muted-foreground">2m ago</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Tech Store submitted registration for approval
                </p>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                <div className="flex w-full items-center justify-between">
                  <span className="font-medium">Payment received</span>
                  <span className="text-xs text-muted-foreground">1h ago</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  $299.00 from Fashion Hub subscription
                </p>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                <div className="flex w-full items-center justify-between">
                  <span className="font-medium">System update</span>
                  <span className="text-xs text-muted-foreground">3h ago</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Platform upgraded to v2.1.0
                </p>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-primary">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center h-auto gap-3 px-3 py-2 hover:bg-white/10"
            >
              {/* Avatar */}
              <div className="flex items-center justify-center font-semibold text-purple-700 bg-white rounded-full h-9 w-9">
                AD
              </div>
              {/* User Info */}
              <div className="flex-col items-start hidden md:flex">
                <span className="text-sm font-semibold text-white">Admin User</span>
                <span className="text-xs text-white/70">Super Admin</span>
              </div>
              <ChevronDown className="hidden w-4 h-4 text-white md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="text-gray-900">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push("/admin/profile")}
              className="cursor-pointer hover:bg-gray-50"
            >
              <User className="mr-2 h-4 w-4 text-gray-600" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/admin/settings")}
              className="cursor-pointer hover:bg-gray-50"
            >
              <Settings className="mr-2 h-4 w-4 text-gray-600" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              disabled={isLoading}
              className="text-red-600 cursor-pointer hover:bg-red-50 focus:bg-red-50 focus:text-red-700"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>{isLoading ? "Logging out..." : "Logout"}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
