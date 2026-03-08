"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Package, Mail, ArrowRight, Sparkles, Home } from "lucide-react"
import Link from "next/link"
import Confetti from "react-confetti"

export default function OrderSuccessPage() {
    const [showConfetti, setShowConfetti] = useState(true)
    const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })
    const [orderNumber, setOrderNumber] = useState<string | null>(null)
    const [estimatedDelivery, setEstimatedDelivery] = useState<string | null>(null)

    useEffect(() => {
        // Set window size for confetti
        setWindowSize({
            width: window.innerWidth,
            height: window.innerHeight,
        })

        // Generate client-only values to avoid hydration mismatch
        setOrderNumber(`ORD-${Math.random().toString(36).substring(2, 11).toUpperCase()}`)
        setEstimatedDelivery(
            new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
            })
        )

        // Stop confetti after 5 seconds
        const timer = setTimeout(() => {
            setShowConfetti(false)
        }, 5000)

        return () => clearTimeout(timer)
    }, [])

    return (
        <div className="min-h-screen bg-[#F5F3FF]">
            {/* Confetti */}
            {showConfetti && windowSize.width > 0 && (
                <Confetti
                    width={windowSize.width}
                    height={windowSize.height}
                    recycle={false}
                    numberOfPieces={500}
                    gravity={0.3}
                />
            )}

            {/* Header */}
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-5">
                    <Link href="/ecommerce" className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
                        ShopSphere
                    </Link>
                </div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-16 max-w-3xl">
                {/* Success Icon */}
                <div className="text-center mb-8 sm:mb-10 animate-in fade-in zoom-in duration-500">
                    <div className="relative inline-block">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-green-500/30">
                            <CheckCircle2 className="w-12 h-12 sm:w-16 sm:h-16 text-white" strokeWidth={2.5} />
                        </div>
                        <div className="absolute -top-2 -right-2 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>

                {/* Success Message */}
                <div className="text-center mb-8 sm:mb-12 space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-bottom duration-700">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900">
                        Order Confirmed!
                    </h1>
                    <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
                        Thank you for your purchase! Your order has been successfully placed and is being processed.
                    </p>
                </div>

                {/* Order Details Card */}
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-200 overflow-hidden mb-6 sm:mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-200">
                    <div className="bg-green-600 p-5 sm:p-6">
                        <div className="flex items-center justify-between text-white">
                            <div>
                                <p className="text-sm font-medium opacity-90 mb-1">Order Number</p>
                                <p className="text-xl sm:text-2xl font-bold tracking-wide">{orderNumber ?? "ORD-—"}</p>
                            </div>
                            <Package className="w-10 h-10 sm:w-12 sm:h-12 opacity-80" />
                        </div>
                    </div>

                    <div className="p-6 sm:p-8 space-y-6">
                        {/* Timeline */}
                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                </div>
                                <div className="flex-1 pt-1">
                                    <h3 className="font-bold text-gray-900 mb-1">Order Confirmed</h3>
                                    <p className="text-sm text-gray-600">Your order has been received and is being processed</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 opacity-60">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Package className="w-5 h-5 text-gray-400" />
                                </div>
                                <div className="flex-1 pt-1">
                                    <h3 className="font-bold text-gray-900 mb-1">Processing</h3>
                                    <p className="text-sm text-gray-600">We're preparing your items for shipment</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 opacity-60">
                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Mail className="w-5 h-5 text-gray-400" />
                                </div>
                                <div className="flex-1 pt-1">
                                    <h3 className="font-bold text-gray-900 mb-1">Shipped</h3>
                                    <p className="text-sm text-gray-600">Your order is on its way to you</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-5">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <Package className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 mb-1">Estimated Delivery</h4>
                                    <p className="text-sm text-gray-700 font-medium">{estimatedDelivery ?? "—"}</p>
                                    <p className="text-xs text-gray-600 mt-1">You'll receive tracking information via email</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Email Confirmation */}
                <div className="bg-purple-50 rounded-2xl p-5 sm:p-6 border border-purple-200 mb-6 sm:mb-8 animate-in fade-in slide-in-from-bottom duration-700 delay-300">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-[#7C3AED] rounded-full flex items-center justify-center flex-shrink-0">
                            <Mail className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900 mb-2">Confirmation Email Sent</h3>
                            <p className="text-sm text-gray-700 leading-relaxed">
                                We've sent a confirmation email with your order details and receipt. Please check your inbox and spam folder.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom duration-700 delay-500">
                    <Link href="/ecommerce/products" className="block">
                        <Button className="w-full h-12 sm:h-14 bg-[#D946EF] hover:bg-[#c026d3] text-white rounded-xl font-bold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all group">
                            Continue Shopping
                            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                    <Link href="/ecommerce" className="block">
                        <Button variant="outline" className="w-full h-12 sm:h-14 border-2 border-gray-900 text-gray-900 hover:bg-gray-50 rounded-xl font-bold text-sm sm:text-base transition-all">
                            <Home className="mr-2 w-5 h-5" />
                            Back to Home
                        </Button>
                    </Link>
                </div>

                {/* Help Section */}
                <div className="mt-10 sm:mt-12 text-center space-y-3 animate-in fade-in duration-700 delay-700">
                    <p className="text-sm text-gray-600">
                        Need help with your order?
                    </p>
                    <div className="flex items-center justify-center gap-4 text-sm">
                        <Link href="/ecommerce/contact" className="text-gray-900 font-semibold hover:underline">
                            Contact Support
                        </Link>
                        <span className="text-gray-300">|</span>
                        <Link href="/ecommerce/track-order" className="text-gray-900 font-semibold hover:underline">
                            Track Order
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
