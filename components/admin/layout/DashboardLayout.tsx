"use client"

import { useState } from "react"
import { Sidebar } from "./Sidebar"
import { Header } from "./Header"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarWidth, setSidebarWidth] = useState(256)

  return (
    <div
      className="min-h-screen bg-background"
      style={{
        '--sidebar-width': `${sidebarWidth}px`
      } as React.CSSProperties}
    >
      <Sidebar
        onWidthChange={setSidebarWidth}
      />

      <div
        className="transition-all duration-300"
        style={{
          marginLeft: `${sidebarWidth}px`
        }}
      >
        <Header />

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
