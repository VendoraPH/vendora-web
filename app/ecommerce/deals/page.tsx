"use client"

import { useState, useEffect } from "react"
import { ProductCard } from "@/components/ecommerce/ProductCard"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { productService } from "@/services"
import type { ApiProduct } from "@/services"
import {
    Zap,
    Flame,
    Clock,
    Tag,
    TrendingDown,
    Percent,
    ChevronRight,
    ShieldCheck,
    Sparkles,
} from "lucide-react"

type UIProduct = {
    id: string
    name: string
    price: number
    originalPrice?: number
    category: string
    image: string
    badge?: string
    badgeType?: "hot" | "bestseller" | "discount"
    rating?: number
    reviewCount?: number
}

function mapApiProduct(p: ApiProduct): UIProduct {
    const price = Number(p.price)
    const cost = p.cost ? Number(p.cost) : undefined

    let badge: string | undefined
    let badgeType: UIProduct["badgeType"]

    if (cost && cost > price) {
        const discount = Math.round(((cost - price) / cost) * 100)
        badge = `${discount}% OFF`
        badgeType = "discount"
    } else if (p.is_low_stock && p.stock > 0) {
        badge = "Low Stock"
        badgeType = "hot"
    }

    return {
        id: String(p.id),
        name: p.name,
        price,
        originalPrice: cost && cost > price ? cost : undefined,
        category: p.category?.name || "Uncategorized",
        image: p.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80",
        badge,
        badgeType,
    }
}

function ProductSkeleton() {
    return (
        <div className="rounded-xl sm:rounded-2xl overflow-hidden bg-white border border-gray-200">
            <div className="aspect-square bg-gray-200 animate-pulse" />
            <div className="p-3 space-y-2">
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-10 w-full bg-gray-200 rounded-lg animate-pulse" />
            </div>
        </div>
    )
}

export default function DealsPage() {
    const [activeTab, setActiveTab] = useState("flash")
    const [allProducts, setAllProducts] = useState<UIProduct[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        let cancelled = false

        async function fetchProducts() {
            setIsLoading(true)
            try {
                // Try featured endpoint first, fall back to all products
                let products: ApiProduct[] = []
                try {
                    const featured = await productService.getFeatured()
                    products = Array.isArray(featured) ? featured : []
                } catch {
                    // Fallback to all products
                    const all = await productService.getAll({ per_page: 100 })
                    products = Array.isArray(all) ? all : []
                }

                if (!cancelled) {
                    const active = products.filter((p: ApiProduct) => p.is_active !== false && p.stock > 0)
                    setAllProducts(active.map(mapApiProduct))
                }
            } catch (err) {
                console.error("Failed to load deals:", err)
            } finally {
                if (!cancelled) setIsLoading(false)
            }
        }

        fetchProducts()
        return () => { cancelled = true }
    }, [])

    // Split products into deal categories
    const flashDeals = allProducts.filter(p => p.originalPrice && p.originalPrice > p.price).slice(0, 4)
    const dailyDeals = allProducts.filter(p => p.originalPrice).slice(0, 6)
    const clearanceDeals = allProducts.filter(p => p.originalPrice && p.originalPrice > p.price * 1.3).slice(0, 4)
    const maxDiscount = allProducts.reduce((max, p) => {
        if (!p.originalPrice) return max
        const disc = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)
        return disc > max ? disc : max
    }, 0)

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Enhanced Hero Banner */}
            <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
                {/* Animated Background Elements */}
                <div className="absolute inset-0">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-full blur-3xl" />
                </div>

                <div className="absolute inset-0 opacity-[0.02]" style={{
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '50px 50px'
                }} />

                <div className="container mx-auto px-4 lg:px-8 py-16 md:py-20 relative">
                    <div className="grid lg:grid-cols-[1.3fr_0.7fr] items-center gap-12">
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-sm rounded-full border border-orange-500/30">
                                <Flame className="w-4 h-4 text-orange-400" />
                                <span className="text-sm font-semibold text-white">Limited Time Offers</span>
                            </div>

                            <div className="space-y-4">
                                <p className="text-blue-400 text-sm uppercase tracking-[0.2em] font-semibold">Deals Refreshed Daily</p>
                                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] text-white">
                                    Mega Deals &<br />
                                    <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                                        Discounts
                                    </span>
                                </h1>
                                <p className="text-xl text-gray-300 leading-relaxed max-w-xl">
                                    {maxDiscount > 0
                                        ? `Save up to ${maxDiscount}% across all categories. Curated, verified, and updated regularly.`
                                        : "Discover great deals across all categories. Updated regularly."}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-4 pt-2">
                                <Button
                                    size="lg"
                                    className="h-14 px-8 bg-white text-gray-900 hover:bg-gray-100 rounded-full font-bold text-base shadow-xl hover:shadow-2xl transition-all hover:scale-105 group"
                                    onClick={() => setActiveTab("flash")}
                                >
                                    <Zap className="w-5 h-5 mr-2 group-hover:text-yellow-500 transition-colors" />
                                    Shop Flash Deals
                                </Button>
                                <Button
                                    size="lg"
                                    variant="outline"
                                    className="h-14 px-8 border-2 border-white/30 bg-white/5 backdrop-blur-sm text-white hover:bg-white/10 hover:border-white/50 rounded-full font-bold text-base transition-all"
                                    onClick={() => setActiveTab("daily")}
                                >
                                    View All Offers
                                    <ChevronRight className="w-5 h-5 ml-2" />
                                </Button>
                            </div>

                            <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-white/10">
                                <div className="flex items-center gap-2 text-gray-300">
                                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                    <Clock className="w-5 h-5" />
                                    <span className="text-sm font-medium">Updated regularly</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-300">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                                    <ShieldCheck className="w-5 h-5" />
                                    <span className="text-sm font-medium">Verified Deals Only</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5">
                            <div className="flex items-center justify-between">
                                <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg">
                                    {maxDiscount > 0 ? `Up to ${maxDiscount}% OFF` : "Great Deals"}
                                </Badge>
                                <Badge className="bg-white/10 text-white border border-white/20 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
                                    {isLoading ? "Loading..." : `${allProducts.length} items`}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-5 space-y-2">
                                    <div className="text-xs uppercase tracking-wide text-blue-300 font-semibold">Flash Deals</div>
                                    <div className="text-3xl font-black text-white">{isLoading ? "--" : String(flashDeals.length).padStart(2, "0")}</div>
                                    <div className="text-sm text-gray-400">live now</div>
                                </div>
                                <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-2xl p-5 space-y-2">
                                    <div className="text-xs uppercase tracking-wide text-purple-300 font-semibold">Daily Picks</div>
                                    <div className="text-3xl font-black text-white">{isLoading ? "--" : String(dailyDeals.length).padStart(2, "0")}</div>
                                    <div className="text-sm text-gray-400">available</div>
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400">Max discount</span>
                                    <span className="font-bold text-green-400">{maxDiscount > 0 ? `${maxDiscount}% OFF` : "---"}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400">Total deals</span>
                                    <span className="font-bold text-white">{isLoading ? "..." : allProducts.length}</span>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-4">
                                <Sparkles className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                                <p className="text-xs text-gray-300 leading-relaxed">
                                    <span className="font-semibold text-white">Pro tip:</span> Flash deals sell out fast. Add items to cart early and checkout before stock runs out.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Deal Stats */}
            <div className="container mx-auto px-4 lg:px-8 -mt-8 relative z-10 mb-12">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-white p-6 text-center border-2 border-gray-100 shadow-lg">
                        <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                        <div className="text-2xl font-black text-gray-900">{isLoading ? "--" : flashDeals.length}</div>
                        <div className="text-sm text-gray-600 font-medium">Flash Deals</div>
                    </Card>
                    <Card className="bg-white p-6 text-center border-2 border-gray-100 shadow-lg">
                        <Tag className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                        <div className="text-2xl font-black text-gray-900">{isLoading ? "--" : dailyDeals.length}</div>
                        <div className="text-sm text-gray-600 font-medium">Daily Deals</div>
                    </Card>
                    <Card className="bg-white p-6 text-center border-2 border-gray-100 shadow-lg">
                        <TrendingDown className="w-8 h-8 text-green-500 mx-auto mb-2" />
                        <div className="text-2xl font-black text-gray-900">{maxDiscount > 0 ? `${maxDiscount}%` : "--"}</div>
                        <div className="text-sm text-gray-600 font-medium">Max Discount</div>
                    </Card>
                    <Card className="bg-white p-6 text-center border-2 border-gray-100 shadow-lg">
                        <Percent className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                        <div className="text-2xl font-black text-gray-900">{isLoading ? "--" : `${allProducts.length}+`}</div>
                        <div className="text-sm text-gray-600 font-medium">Items on Sale</div>
                    </Card>
                </div>
            </div>

            {/* Deals Tabs */}
            <div className="container mx-auto px-4 lg:px-8 pb-16">
                <Tabs defaultValue="flash" value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="w-full md:w-auto mb-8 bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
                        <TabsTrigger value="flash" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-500 data-[state=active]:text-white">
                            <Zap className="w-4 h-4" />
                            Flash Deals
                        </TabsTrigger>
                        <TabsTrigger value="daily" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white">
                            <Tag className="w-4 h-4" />
                            Daily Deals
                        </TabsTrigger>
                        <TabsTrigger value="clearance" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white">
                            <Percent className="w-4 h-4" />
                            Clearance
                        </TabsTrigger>
                    </TabsList>

                    {/* Flash Deals Tab */}
                    <TabsContent value="flash" className="mt-0">
                        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-6 md:p-8 mb-8 border border-red-100">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                                        <Zap className="w-7 h-7 text-red-600" />
                                        Flash Deals
                                    </h2>
                                    <p className="text-gray-600">Limited time offers - grab them before they're gone!</p>
                                </div>
                                <Badge className="bg-red-600 text-white px-3 py-1 text-sm hidden md:flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Ends soon
                                </Badge>
                            </div>
                            {isLoading ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)}
                                </div>
                            ) : flashDeals.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {flashDeals.map((product) => (
                                        <ProductCard key={product.id} product={product} />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 py-8">No flash deals available right now. Check back soon!</p>
                            )}
                        </div>
                    </TabsContent>

                    {/* Daily Deals Tab */}
                    <TabsContent value="daily" className="mt-0">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 md:p-8 mb-8 border border-blue-100">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                                        <Tag className="w-7 h-7 text-blue-600" />
                                        Daily Deals
                                    </h2>
                                    <p className="text-gray-600">Great deals available now</p>
                                </div>
                                <Badge className="bg-blue-600 text-white px-3 py-1 text-sm hidden md:flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Updated regularly
                                </Badge>
                            </div>
                            {isLoading ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {Array.from({ length: 6 }).map((_, i) => <ProductSkeleton key={i} />)}
                                </div>
                            ) : dailyDeals.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {dailyDeals.map((product) => (
                                        <ProductCard key={product.id} product={product} />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 py-8">No daily deals available right now. Check back soon!</p>
                            )}
                        </div>
                    </TabsContent>

                    {/* Clearance Tab */}
                    <TabsContent value="clearance" className="mt-0">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 md:p-8 mb-8 border border-green-100">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                                        <Percent className="w-7 h-7 text-green-600" />
                                        Clearance Sale
                                    </h2>
                                    <p className="text-gray-600">Deep discounts on select items - while stocks last</p>
                                </div>
                                <Badge className="bg-green-600 text-white px-3 py-1 text-sm hidden md:flex">
                                    Limited stock
                                </Badge>
                            </div>
                            {isLoading ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)}
                                </div>
                            ) : clearanceDeals.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {clearanceDeals.map((product) => (
                                        <ProductCard key={product.id} product={product} />
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 py-8">No clearance items available right now.</p>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Newsletter CTA */}
                <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-8 md:p-12 text-white mt-12">
                    <div className="max-w-3xl mx-auto text-center">
                        <Flame className="w-12 h-12 text-orange-400 mx-auto mb-6" />
                        <h2 className="text-3xl md:text-4xl font-black mb-4">Never Miss a Deal</h2>
                        <p className="text-xl text-gray-300 mb-8">
                            Subscribe to get notified about flash sales and exclusive offers
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="flex-1 h-12 px-4 rounded-full border-2 border-gray-700 bg-gray-800 text-white placeholder:text-gray-400 focus:outline-none focus:border-white"
                            />
                            <Button size="lg" className="h-12 px-8 bg-orange-500 hover:bg-orange-600 text-white rounded-full font-bold">
                                Subscribe
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
