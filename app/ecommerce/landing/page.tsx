"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, Store, Lock, Shield, Users } from "lucide-react"
import Link from "next/link"

export default function LandingPage() {
    return (
        <div className="flex flex-col min-h-screen bg-white">
            {/* Navigation Bar */}
            <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="flex items-center justify-between h-16 lg:h-20">
                        {/* Logo */}
                        <Link href="/ecommerce/landing" className="text-2xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
                            ShopSphere Market
                        </Link>

                        {/* Center Links - Hidden on mobile */}
                        <div className="hidden md:flex items-center gap-8">
                            <Link href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                                How it works
                            </Link>
                            <Link href="#vendors" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                                For Vendors
                            </Link>
                            <Link href="#support" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                                Support
                            </Link>
                        </div>

                        {/* Auth Buttons */}
                        <div className="flex items-center gap-3">
                            <Button variant="outline" className="rounded-full border-2 border-gray-900 text-gray-900 hover:bg-gray-100 font-semibold">
                                Login
                            </Button>
                            <Button className="rounded-full bg-gray-900 hover:bg-gray-800 text-white font-semibold shadow-md">
                                Create Account
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="container mx-auto px-4 lg:px-8 py-12 md:py-20">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left Content */}
                    <div className="space-y-8">
                        {/* Label */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
                            <Store className="w-4 h-4 text-gray-700" />
                            <span className="text-sm font-semibold text-gray-700">Multi-Vendor Marketplace</span>
                        </div>

                        {/* Headline */}
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 leading-tight">
                            Discover Thousands of Products From Trusted Vendors
                        </h1>

                        {/* Supporting Text */}
                        <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-xl">
                            Sign in or create an account to explore exclusive deals, track orders, and manage your favorite shops.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-2">
                            <Button size="lg" className="h-14 px-8 bg-gray-900 hover:bg-gray-800 text-white rounded-full font-bold text-base shadow-lg hover:shadow-xl transition-all hover:scale-105">
                                Login to Continue
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                            <Button size="lg" variant="outline" className="h-14 px-8 border-2 border-gray-900 text-gray-900 hover:bg-gray-100 rounded-full font-bold text-base transition-all">
                                Register for Free
                            </Button>
                        </div>

                        {/* Vendor Link */}
                        <Link href="#vendors" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors group">
                            Vendor? Become a Seller
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>

                    {/* Right Side - Locked Marketplace Preview */}
                    <div className="relative">
                        <div className="relative rounded-3xl overflow-hidden border-2 border-gray-200 shadow-2xl bg-gray-50">
                            {/* Locked Overlay */}
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-md z-10 flex flex-col items-center justify-center p-8">
                                <div className="bg-white rounded-full p-6 shadow-xl mb-6">
                                    <Lock className="w-12 h-12 text-gray-900" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-3 text-center">Login to unlock the marketplace</h3>
                                <p className="text-gray-600 text-center mb-6">Sign in to browse thousands of products</p>
                                <Button className="rounded-full bg-gray-900 hover:bg-gray-800 text-white font-semibold h-12 px-8">
                                    Sign In Now
                                </Button>
                            </div>

                            {/* Blurred Product Grid Preview */}
                            <div className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                                            <div className="aspect-square bg-gray-200 rounded-lg mb-3"></div>
                                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="bg-gradient-to-b from-gray-50 to-white py-16 md:py-24">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How ShopSphere Market Works</h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">Get started in three simple steps</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 md:gap-12 max-w-6xl mx-auto">
                        {/* Step 1 */}
                        <div className="text-center space-y-4">
                            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                                <Users className="w-10 h-10 text-white" strokeWidth={2} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Create your account</h3>
                            <p className="text-gray-600 leading-relaxed">Sign up in seconds with your email. No credit card required to browse.</p>
                        </div>

                        {/* Step 2 */}
                        <div className="text-center space-y-4">
                            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                                <Store className="w-10 h-10 text-white" strokeWidth={2} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Browse vendors & products</h3>
                            <p className="text-gray-600 leading-relaxed">Explore thousands of products from verified vendors across all categories.</p>
                        </div>

                        {/* Step 3 */}
                        <div className="text-center space-y-4">
                            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30">
                                <Shield className="w-10 h-10 text-white" strokeWidth={2} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Checkout securely</h3>
                            <p className="text-gray-600 leading-relaxed">Pay safely with encrypted checkout and track your orders in real-time.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Vendor & Product Teaser */}
            <section id="vendors" className="py-16 md:py-24">
                <div className="container mx-auto px-4 lg:px-8">
                    {/* Featured Vendors */}
                    <div className="mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">Featured Vendors</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 max-w-5xl mx-auto">
                            {["TechHub", "StyleCo", "HomeEssentials", "GadgetZone", "FashionFirst", "BeautyBox"].map((vendor) => (
                                <div key={vendor} className="relative group">
                                    <div className="bg-gray-100 rounded-2xl p-6 text-center opacity-50 group-hover:opacity-60 transition-opacity">
                                        <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-3"></div>
                                        <p className="text-sm font-bold text-gray-700">{vendor}</p>
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Lock className="w-6 h-6 text-gray-400" />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="text-center text-sm text-gray-500 mt-6 font-medium">Available after login</p>
                    </div>

                    {/* Product Preview */}
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">Sample Products</h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                            {[
                                { name: "Premium Headphones", price: "$89.00", image: "🎧" },
                                { name: "Running Shoes", price: "$129.00", image: "👟" },
                                { name: "Home Decor", price: "$45.00", image: "🏠" },
                                { name: "Smart Watch", price: "$199.00", image: "⌚" }
                            ].map((product, i) => (
                                <div key={i} className="relative bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm">
                                    {/* Lock Overlay */}
                                    <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center">
                                        <Lock className="w-8 h-8 text-gray-400" />
                                    </div>

                                    <div className="p-5 space-y-3">
                                        <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center text-6xl">
                                            {product.image}
                                        </div>
                                        <h3 className="font-bold text-gray-900">{product.name}</h3>
                                        <p className="text-xl font-black text-gray-900">{product.price}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Auth Highlight Strip */}
            <section className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 py-16">
                <div className="container mx-auto px-4 lg:px-8 text-center">
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-6">Ready to start shopping?</h2>
                    <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">Join thousands of happy customers shopping from trusted vendors</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" className="h-14 px-10 bg-white text-indigo-600 hover:bg-gray-100 rounded-full font-bold text-base shadow-xl hover:shadow-2xl transition-all hover:scale-105">
                            Login
                        </Button>
                        <Button size="lg" variant="outline" className="h-14 px-10 bg-transparent border-2 border-white text-white hover:bg-white/10 rounded-full font-bold text-base transition-all">
                            Register
                        </Button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer id="support" className="bg-gray-50 border-t border-gray-200 py-12">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="text-2xl font-bold tracking-tight bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent">
                            ShopSphere Market
                        </div>
                        <div className="flex flex-wrap justify-center gap-8 text-sm">
                            <Link href="#about" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                                About
                            </Link>
                            <Link href="#privacy" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                                Privacy Policy
                            </Link>
                            <Link href="#terms" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                                Terms
                            </Link>
                            <Link href="#help" className="text-gray-600 hover:text-gray-900 font-medium transition-colors">
                                Help Center
                            </Link>
                        </div>
                    </div>
                    <div className="text-center mt-8 text-sm text-gray-500">
                        © 2025 ShopSphere Market. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    )
}
