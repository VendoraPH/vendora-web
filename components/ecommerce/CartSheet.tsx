"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useCartStore } from "@/store/useCartStore"
import { Minus, Plus, ShoppingBag, Trash2, Truck, Shield, ArrowRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

// Helper for currency
const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(price)
}

export function CartSheet() {
    const { items, isOpen, setOpen, removeItem, updateQuantity, clearCart } = useCartStore()

    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0)
    const shipping = 0
    const total = subtotal + shipping

    const itemCount = items.reduce((acc, item) => acc + item.quantity, 0)

    return (
        <Sheet open={isOpen} onOpenChange={setOpen}>
            <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
                <SheetHeader className="px-6 py-5 border-b bg-gray-50">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="flex items-center gap-2 text-xl">
                            <ShoppingBag className="w-6 h-6" />
                            Shopping Cart
                            {itemCount > 0 && (
                                <Badge className="ml-2 bg-gray-900 text-white rounded-full">
                                    {itemCount}
                                </Badge>
                            )}
                        </SheetTitle>
                        {items.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearCart}
                                className="text-gray-500 hover:text-gray-900"
                            >
                                Clear all
                            </Button>
                        )}
                    </div>
                </SheetHeader>

                {items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
                        <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                            <ShoppingBag className="w-12 h-12 text-gray-400" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-bold text-xl text-gray-900">Your cart is empty</h3>
                            <p className="text-gray-600 text-sm max-w-xs">
                                Looks like you haven't added anything to your cart yet. Start shopping now!
                            </p>
                        </div>
                        <Link href="/ecommerce/products">
                            <Button onClick={() => setOpen(false)} className="rounded-full bg-gray-900 hover:bg-gray-800">
                                Start Shopping
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <>
                        <ScrollArea className="flex-1 px-6">
                            <div className="py-6 space-y-6">
                                {items.map((item) => (
                                    <div key={item.id} className="flex gap-4 group">
                                        <Link
                                            href={`/ecommerce/products/${item.id}`}
                                            onClick={() => setOpen(false)}
                                            className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200 hover:border-gray-300 transition-all shrink-0 bg-gray-50"
                                        >
                                            <Image
                                                src={item.image}
                                                alt={item.name}
                                                fill
                                                className="object-cover"
                                            />
                                        </Link>
                                        <div className="flex-1 flex flex-col justify-between min-w-0">
                                            <div className="space-y-1">
                                                <Link
                                                    href={`/ecommerce/products/${item.id}`}
                                                    onClick={() => setOpen(false)}
                                                >
                                                    <h4 className="font-semibold text-sm line-clamp-2 text-gray-900 hover:text-gray-600 transition-colors">
                                                        {item.name}
                                                    </h4>
                                                </Link>
                                                <p className="text-xs text-gray-500">{item.category}</p>
                                            </div>
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="font-bold text-gray-900">{formatPrice(item.price)}</div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center border-2 border-gray-200 rounded-lg h-9">
                                                        <button
                                                            className="px-3 hover:bg-gray-100 h-full flex items-center justify-center transition-colors"
                                                            onClick={() => {
                                                                if (item.quantity > 1) {
                                                                    updateQuantity(item.id, item.quantity - 1)
                                                                } else {
                                                                    removeItem(item.id)
                                                                }
                                                            }}
                                                        >
                                                            <Minus className="w-3.5 h-3.5 text-gray-600" />
                                                        </button>
                                                        <span className="w-10 text-center text-sm font-semibold text-gray-900">{item.quantity}</span>
                                                        <button
                                                            className="px-3 hover:bg-gray-100 h-full flex items-center justify-center transition-colors"
                                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        >
                                                            <Plus className="w-3.5 h-3.5 text-gray-600" />
                                                        </button>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => removeItem(item.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        {/* Benefits Banner */}
                        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-y border-blue-100">
                            <div className="flex items-center justify-around text-xs">
                                <div className="flex items-center gap-2">
                                    <Truck className="w-4 h-4 text-blue-600" />
                                    <span className="font-medium text-gray-700">Free Shipping</span>
                                </div>
                                <div className="w-px h-4 bg-blue-200"></div>
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-blue-600" />
                                    <span className="font-medium text-gray-700">Secure Checkout</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="border-t p-6 space-y-4 bg-white">
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-semibold text-gray-900">{formatPrice(subtotal)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">Shipping</span>
                                    <span className="text-green-600 font-bold">Free</span>
                                </div>
                                <Separator className="my-3" />
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-lg text-gray-900">Total</span>
                                    <span className="font-black text-2xl text-gray-900">{formatPrice(total)}</span>
                                </div>
                            </div>
                            <div className="space-y-3 pt-2">
                                <Link href="/ecommerce/checkout">
                                    <Button
                                        onClick={() => setOpen(false)}
                                        className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-bold text-base shadow-md hover:shadow-xl transition-all group"
                                        size="lg"
                                    >
                                        Proceed to Checkout
                                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                                <Button
                                    variant="outline"
                                    onClick={() => setOpen(false)}
                                    className="w-full h-11 border-2 border-gray-200 rounded-lg font-semibold hover:bg-gray-50"
                                >
                                    Continue Shopping
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    )
}
