"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ShoppingCart, Plus, Package, Truck } from "lucide-react"


type QuickActionsProps = {
  variant?: "default" | "embedded"
  onAddProduct?: () => void
}

export function QuickActions({ variant = "default", onAddProduct }: QuickActionsProps) {
  const isEmbedded = variant === "embedded"
  const headerClass = isEmbedded ? "px-0 pt-0" : undefined
  const contentClass = isEmbedded ? "px-0 pb-0" : undefined

  const content = (
    <>
      <CardHeader className={headerClass}>
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        <p className="text-sm text-gray-500 dark:text-[#b4b4d0]">Common tasks</p>
      </CardHeader>
      <CardContent className={contentClass}>
        <div className="space-y-2">
          {/* Start a new POS sale */}
          <Button
            asChild
            variant="ghost"
            className="w-full justify-start gap-3 h-12 text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-950/40"
          >
            <Link href="/pos/pos-screen">
              <ShoppingCart className="w-5 h-5" />
              <span className="font-medium dark:text-[#e0e0f0]">Start a new POS sale</span>
            </Link>
          </Button>

          {/* Add a new product */}
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-12 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
            onClick={onAddProduct}
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium dark:text-[#e0e0f0]">Add a new product</span>
          </Button>

          {/* Adjust stock levels */}
          <Button
            asChild
            variant="ghost"
            className="w-full justify-start gap-3 h-12 text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-950/40"
          >
            <Link href="/pos/products">
              <Package className="w-5 h-5" />
              <span className="font-medium dark:text-[#e0e0f0]">Adjust stock levels</span>
            </Link>
          </Button>

          {/* Fulfill online orders */}
          <Button
            asChild
            variant="ghost"
            className="w-full justify-start gap-3 h-12 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/40"
          >
            <Link href="/pos/orders">
              <Truck className="w-5 h-5" />
              <span className="font-medium dark:text-[#e0e0f0]">Fulfill online orders</span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </>
  )

  if (isEmbedded) {
    return <div>{content}</div>
  }

  return (
    <Card>
      {content}
    </Card>
  )
}
