"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useCartStore } from "@/store/useCartStore"
import { orderService } from "@/services"
import { paymentService } from "@/services"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowLeft, CreditCard, Truck, ShieldCheck, Lock, MapPin, Mail, Home } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { formatCurrency, centsToPesos } from "@/lib/utils"

export default function CheckoutPage() {
    const router = useRouter()
    const { items, clearCart } = useCartStore()
    const [isProcessing, setIsProcessing] = useState(false)
    const [orderError, setOrderError] = useState<string | null>(null)
    const [paymentMethod, setPaymentMethod] = useState("card")

    // Form state
    const [formData, setFormData] = useState({
        email: "",
        phone: "",
        firstName: "",
        lastName: "",
        address: "",
        apartment: "",
        city: "",
        state: "",
        zipCode: "",
        country: "Philippines",
        cardNumber: "",
        cardName: "",
        expiryDate: "",
        cvv: "",
    })

    const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0) // cents
    const shipping = subtotal > 50000 ? 0 : 9900 // Free over ₱500, else ₱99 (in cents)
    const tax = subtotal * 0.12 // 12% VAT (in cents)
    const total = subtotal + shipping + tax

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsProcessing(true)
        setOrderError(null)

        try {
            // Build order payload
            const now = new Date()
            const orderedAt = now.toISOString().split("T")[0] // YYYY-MM-DD
            const paidAt = `${orderedAt} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}` // YYYY-MM-DD HH:mm

            const orderPayload = {
                ordered_at: orderedAt,
                status: "pending" as const,
                total: Math.round(total),
                items: items.map(item => ({
                    product_id: Number(item.id),
                    quantity: item.quantity,
                    price: Math.round(item.price),
                })),
                // Customer info as notes (no customer account required for ecommerce guest checkout)
                notes: `Guest: ${formData.firstName} ${formData.lastName}, ${formData.email}, ${formData.phone}, ${formData.address} ${formData.apartment}, ${formData.city} ${formData.state} ${formData.zipCode}`,
            }

            // Create order
            const order = await orderService.create(orderPayload as any)
            const orderId = (order as any).id

            if (orderId) {
                // Create payment
                const paymentPayload = {
                    order_id: orderId,
                    amount: Math.round(total),
                    method: (paymentMethod === "card" ? "card" : "online") as "cash" | "card" | "online",
                    status: "completed" as const,
                    paid_at: paidAt,
                }

                try {
                    await paymentService.create(paymentPayload)
                } catch (payErr) {
                    console.error("Payment creation failed (order was created):", payErr)
                    // Order was still created, proceed to success
                }
            }

            // Clear cart and redirect to success page with order info
            clearCart()
            const params = new URLSearchParams({
                orderId: orderId ? String(orderId) : "",
                total: centsToPesos(total).toFixed(2),
                items: String(items.length),
            })
            router.push(`/ecommerce/order-success?${params.toString()}`)
        } catch (err: any) {
            console.error("=== ORDER CREATION ERROR ===")
            console.error("Status:", err?.response?.status)
            console.error("Response:", JSON.stringify(err?.response?.data, null, 2))

            const validationErrors = err?.response?.data?.errors
                ? Object.values(err.response.data.errors).flat().join(", ")
                : ""

            setOrderError(
                validationErrors ||
                err?.response?.data?.message ||
                err?.message ||
                "Failed to place order. Please try again."
            )
        } finally {
            setIsProcessing(false)
        }
    }

    // Redirect if cart is empty
    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center space-y-6 max-w-md">
                    <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
                        <Truck className="w-12 h-12 text-gray-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Your cart is empty</h1>
                    <p className="text-gray-600">Add some products to your cart before checking out.</p>
                    <Link href="/ecommerce/products">
                        <Button className="bg-gray-900 hover:bg-gray-800 rounded-full">
                            Continue Shopping
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-5">
                    <div className="flex items-center justify-between">
                        <Link href="/ecommerce" className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
                            ShopSphere
                        </Link>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Lock className="w-4 h-4" />
                            <span className="hidden sm:inline">Secure Checkout</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 max-w-7xl">
                {/* Back Button */}
                <Link href="/ecommerce" className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-6 sm:mb-8 transition-colors group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Continue Shopping
                </Link>

                {/* Order Error */}
                {orderError && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                        <p className="font-semibold mb-1">Order Failed</p>
                        <p>{orderError}</p>
                    </div>
                )}

                <div className="grid lg:grid-cols-5 gap-6 sm:gap-8 lg:gap-10">
                    {/* Left Column - Forms */}
                    <div className="lg:col-span-3 space-y-6 sm:space-y-8">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Checkout</h1>

                        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                            {/* Contact Information */}
                            <div className="bg-white rounded-2xl p-5 sm:p-7 shadow-sm border border-gray-200">
                                <div className="flex items-center gap-3 mb-5 sm:mb-6">
                                    <div className="w-10 h-10 bg-[#7C3AED] rounded-full flex items-center justify-center">
                                        <Mail className="w-5 h-5 text-white" />
                                    </div>
                                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Contact Information</h2>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
                                    <div className="sm:col-span-2">
                                        <Label htmlFor="email" className="text-sm font-semibold text-gray-700 mb-2 block">Email Address *</Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="your.email@example.com"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            required
                                            className="h-12 rounded-lg border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <Label htmlFor="phone" className="text-sm font-semibold text-gray-700 mb-2 block">Phone Number *</Label>
                                        <Input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            placeholder="+63 912 345 6789"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            required
                                            className="h-12 rounded-lg border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Shipping Address */}
                            <div className="bg-white rounded-2xl p-5 sm:p-7 shadow-sm border border-gray-200">
                                <div className="flex items-center gap-3 mb-5 sm:mb-6">
                                    <div className="w-10 h-10 bg-[#D946EF] rounded-full flex items-center justify-center">
                                        <MapPin className="w-5 h-5 text-white" />
                                    </div>
                                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Shipping Address</h2>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
                                    <div>
                                        <Label htmlFor="firstName" className="text-sm font-semibold text-gray-700 mb-2 block">First Name *</Label>
                                        <Input
                                            id="firstName"
                                            name="firstName"
                                            placeholder="Juan"
                                            value={formData.firstName}
                                            onChange={handleInputChange}
                                            required
                                            className="h-12 rounded-lg border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="lastName" className="text-sm font-semibold text-gray-700 mb-2 block">Last Name *</Label>
                                        <Input
                                            id="lastName"
                                            name="lastName"
                                            placeholder="Dela Cruz"
                                            value={formData.lastName}
                                            onChange={handleInputChange}
                                            required
                                            className="h-12 rounded-lg border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <Label htmlFor="address" className="text-sm font-semibold text-gray-700 mb-2 block">Street Address *</Label>
                                        <Input
                                            id="address"
                                            name="address"
                                            placeholder="123 Rizal Street"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            required
                                            className="h-12 rounded-lg border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <Label htmlFor="apartment" className="text-sm font-semibold text-gray-700 mb-2 block">Apartment, Suite, etc. (Optional)</Label>
                                        <Input
                                            id="apartment"
                                            name="apartment"
                                            placeholder="Unit 4B"
                                            value={formData.apartment}
                                            onChange={handleInputChange}
                                            className="h-12 rounded-lg border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="city" className="text-sm font-semibold text-gray-700 mb-2 block">City *</Label>
                                        <Input
                                            id="city"
                                            name="city"
                                            placeholder="Makati"
                                            value={formData.city}
                                            onChange={handleInputChange}
                                            required
                                            className="h-12 rounded-lg border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="state" className="text-sm font-semibold text-gray-700 mb-2 block">Province / Region *</Label>
                                        <Input
                                            id="state"
                                            name="state"
                                            placeholder="Metro Manila"
                                            value={formData.state}
                                            onChange={handleInputChange}
                                            required
                                            className="h-12 rounded-lg border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="zipCode" className="text-sm font-semibold text-gray-700 mb-2 block">ZIP Code *</Label>
                                        <Input
                                            id="zipCode"
                                            name="zipCode"
                                            placeholder="1200"
                                            value={formData.zipCode}
                                            onChange={handleInputChange}
                                            required
                                            className="h-12 rounded-lg border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div className="bg-white rounded-2xl p-5 sm:p-7 shadow-sm border border-gray-200">
                                <div className="flex items-center gap-3 mb-5 sm:mb-6">
                                    <div className="w-10 h-10 bg-[#110228] rounded-full flex items-center justify-center">
                                        <CreditCard className="w-5 h-5 text-white" />
                                    </div>
                                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Payment Method</h2>
                                </div>

                                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3 mb-5 sm:mb-6">
                                    <div className="flex items-center space-x-3 border-2 border-gray-200 rounded-lg p-4 hover:border-gray-900 cursor-pointer transition-colors">
                                        <RadioGroupItem value="card" id="card" />
                                        <Label htmlFor="card" className="flex-1 flex items-center justify-between cursor-pointer">
                                            <span className="font-semibold text-gray-900">Credit / Debit Card</span>
                                            <span className="text-xs text-gray-500">Visa, Mastercard, Amex</span>
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-3 border-2 border-gray-200 rounded-lg p-4 hover:border-gray-900 cursor-pointer transition-colors">
                                        <RadioGroupItem value="online" id="online" />
                                        <Label htmlFor="online" className="flex-1 cursor-pointer font-semibold text-gray-900">
                                            Online Payment (GCash, PayMaya)
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-3 border-2 border-gray-200 rounded-lg p-4 hover:border-gray-900 cursor-pointer transition-colors">
                                        <RadioGroupItem value="cod" id="cod" />
                                        <Label htmlFor="cod" className="flex-1 cursor-pointer font-semibold text-gray-900">
                                            Cash on Delivery
                                        </Label>
                                    </div>
                                </RadioGroup>

                                {paymentMethod === "card" && (
                                    <div className="grid sm:grid-cols-2 gap-4 sm:gap-5 pt-4 border-t border-gray-200">
                                        <div className="sm:col-span-2">
                                            <Label htmlFor="cardNumber" className="text-sm font-semibold text-gray-700 mb-2 block">Card Number *</Label>
                                            <Input
                                                id="cardNumber"
                                                name="cardNumber"
                                                placeholder="1234 5678 9012 3456"
                                                value={formData.cardNumber}
                                                onChange={handleInputChange}
                                                required={paymentMethod === "card"}
                                                className="h-12 rounded-lg border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                                            />
                                        </div>
                                        <div className="sm:col-span-2">
                                            <Label htmlFor="cardName" className="text-sm font-semibold text-gray-700 mb-2 block">Name on Card *</Label>
                                            <Input
                                                id="cardName"
                                                name="cardName"
                                                placeholder="Juan Dela Cruz"
                                                value={formData.cardName}
                                                onChange={handleInputChange}
                                                required={paymentMethod === "card"}
                                                className="h-12 rounded-lg border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="expiryDate" className="text-sm font-semibold text-gray-700 mb-2 block">Expiry Date *</Label>
                                            <Input
                                                id="expiryDate"
                                                name="expiryDate"
                                                placeholder="MM/YY"
                                                value={formData.expiryDate}
                                                onChange={handleInputChange}
                                                required={paymentMethod === "card"}
                                                className="h-12 rounded-lg border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor="cvv" className="text-sm font-semibold text-gray-700 mb-2 block">CVV *</Label>
                                            <Input
                                                id="cvv"
                                                name="cvv"
                                                placeholder="123"
                                                value={formData.cvv}
                                                onChange={handleInputChange}
                                                required={paymentMethod === "card"}
                                                maxLength={4}
                                                className="h-12 rounded-lg border-gray-300 focus:border-gray-900 focus:ring-gray-900"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Submit Button - Mobile */}
                            <div className="lg:hidden">
                                <Button
                                    type="submit"
                                    disabled={isProcessing}
                                    className="w-full h-14 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isProcessing ? (
                                        <span className="flex items-center gap-2">
                                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Processing...
                                        </span>
                                    ) : (
                                        `Place Order \u2022 ${formatCurrency(total)}`
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>

                    {/* Right Column - Order Summary */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl p-5 sm:p-7 shadow-sm border border-gray-200 lg:sticky lg:top-24">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-5 sm:mb-6">Order Summary</h2>

                            {/* Products */}
                            <div className="space-y-4 mb-5 sm:mb-6 max-h-[300px] overflow-y-auto pr-2">
                                {items.map((item) => (
                                    <div key={item.id} className="flex gap-4">
                                        <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 bg-gray-50">
                                            <Image
                                                src={item.image}
                                                alt={item.name}
                                                fill
                                                className="object-cover"
                                                unoptimized
                                            />
                                            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gray-900 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                                {item.quantity}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-sm text-gray-900 line-clamp-2">{item.name}</h4>
                                            <p className="text-xs text-gray-500 mt-0.5">{item.category}</p>
                                            <p className="font-bold text-gray-900 mt-1">{formatCurrency(item.price * item.quantity)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Separator className="my-5 sm:my-6" />

                            {/* Pricing Breakdown */}
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Subtotal</span>
                                    <span className="font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Shipping</span>
                                    <span className="font-semibold text-green-600">{shipping === 0 ? "Free" : formatCurrency(shipping)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">VAT (12%)</span>
                                    <span className="font-semibold text-gray-900">{formatCurrency(tax)}</span>
                                </div>
                                <Separator className="my-3" />
                                <div className="flex justify-between text-lg">
                                    <span className="font-bold text-gray-900">Total</span>
                                    <span className="font-black text-gray-900">{formatCurrency(total)}</span>
                                </div>
                            </div>

                            {/* Trust Badges */}
                            <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
                                    <span>SSL Encrypted & Secure Payment</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Truck className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                    <span>Free shipping on orders over {"\u20B1"}500</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                    <Home className="w-5 h-5 text-purple-600 flex-shrink-0" />
                                    <span>30-day money-back guarantee</span>
                                </div>
                            </div>

                            {/* Submit Button - Desktop */}
                            <div className="hidden lg:block mt-6">
                                <Button
                                    type="submit"
                                    onClick={handleSubmit}
                                    disabled={isProcessing}
                                    className="w-full h-14 bg-[#D946EF] hover:bg-[#c026d3] text-white rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isProcessing ? (
                                        <span className="flex items-center gap-2">
                                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Processing...
                                        </span>
                                    ) : (
                                        `Place Order \u2022 ${formatCurrency(total)}`
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
