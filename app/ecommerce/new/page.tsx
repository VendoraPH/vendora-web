"use client"

import { useState, useEffect, useRef } from "react"
import { ProductCard } from "@/components/ecommerce/ProductCard"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import { Sparkles, TrendingUp, Clock, ShieldCheck, Loader2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { productService, categoryService } from "@/services"
import type { ApiProduct } from "@/services"

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
    vendor?: string
    daysAgo?: number
}

function mapApiProduct(p: ApiProduct): UIProduct {
    const price = Number(p.price)
    const cost = p.cost ? Number(p.cost) : undefined

    let badge: string | undefined = "New"
    let badgeType: UIProduct["badgeType"] = "hot"

    if (cost && cost > price) {
        const discount = Math.round(((cost - price) / cost) * 100)
        badge = `${discount}% OFF`
        badgeType = "discount"
    }

    // Calculate days ago
    const created = new Date(p.created_at)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - created.getTime())
    const daysAgo = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))

    return {
        id: String(p.id),
        name: p.name,
        price,
        originalPrice: cost && cost > price ? cost : undefined,
        category: p.category?.name || "Uncategorized",
        image: p.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80",
        badge,
        badgeType,
        vendor: p.vendor?.name,
        daysAgo,
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

export default function NewArrivalsPage() {
    const sliderPlugin = useRef<any>(
        Autoplay({ delay: 4500, stopOnInteraction: true })
    )

    const [products, setProducts] = useState<UIProduct[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [categoryNames, setCategoryNames] = useState<string[]>([])

    useEffect(() => {
        let cancelled = false

        async function fetchData() {
            setIsLoading(true)
            try {
                const [productsResult, catsResult] = await Promise.allSettled([
                    productService.getAll({ per_page: 100 }),
                    categoryService.getAll(),
                ])

                if (cancelled) return

                // Process products - sort by newest first
                if (productsResult.status === "fulfilled") {
                    const raw = Array.isArray(productsResult.value) ? productsResult.value : []
                    const active = raw.filter((p: ApiProduct) => p.is_active !== false)
                    // Sort by created_at descending (newest first)
                    const sorted = active.sort((a: ApiProduct, b: ApiProduct) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    )
                    setProducts(sorted.map(mapApiProduct))
                }

                // Process categories for trending section
                if (catsResult.status === "fulfilled") {
                    const cats = Array.isArray(catsResult.value) ? catsResult.value : []
                    setCategoryNames(cats.filter((c: any) => c.is_active !== false).map((c: any) => c.name).slice(0, 4))
                }
            } catch (err) {
                console.error("Failed to load new arrivals:", err)
            } finally {
                if (!cancelled) setIsLoading(false)
            }
        }

        fetchData()
        return () => { cancelled = true }
    }, [])

    const FEATURED = products.slice(0, 4)
    const CATEGORY_ICONS = ["💻", "👕", "💄", "🏠", "⚽", "🎁", "🍔", "📱"]

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-600">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_25%),radial-gradient(circle_at_80%_0%,white,transparent_30%)]" />
                <div className="container mx-auto px-4 lg:px-8 py-14 md:py-20 relative">
                    <div className="flex flex-col lg:flex-row items-center gap-8">
                        <div className="max-w-xl text-white space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
                                <Sparkles className="w-4 h-4" />
                                <span className="text-sm font-semibold">Fresh Arrivals</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black leading-tight">
                                New This Week
                            </h1>
                            <p className="text-lg md:text-xl text-white/90 leading-relaxed">
                                Discover the latest products across all categories — curated and refreshed regularly.
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <Link href="/ecommerce/products">
                                    <Button size="lg" className="h-12 px-6 bg-white text-indigo-700 hover:bg-gray-100 rounded-full font-semibold shadow-lg">
                                        <TrendingUp className="w-5 h-5 mr-2" />
                                        Shop Trending
                                    </Button>
                                </Link>
                                <Link href="/ecommerce/products">
                                    <Button size="lg" variant="outline" className="h-12 px-6 bg-transparent border-2 border-white text-white hover:bg-white/10 rounded-full font-semibold">
                                        View All Products
                                    </Button>
                                </Link>
                            </div>
                            <div className="flex items-center gap-4 text-white/80 text-sm pt-2">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4" />
                                    Curated & verified
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Updated regularly
                                </div>
                            </div>
                        </div>

                        <div className="w-full lg:w-[55%] bg-white/10 backdrop-blur-lg rounded-3xl p-4 shadow-2xl border border-white/10">
                            {isLoading ? (
                                <div className="flex items-center justify-center h-[260px] text-white/60">
                                    <Loader2 className="w-8 h-8 animate-spin mr-3" />
                                    Loading new arrivals...
                                </div>
                            ) : FEATURED.length > 0 ? (
                                <Carousel
                                    plugins={[sliderPlugin.current]}
                                    className="w-full"
                                    opts={{ loop: true, align: "start" }}
                                >
                                    <CarouselContent className="ml-0">
                                        {FEATURED.map((item) => (
                                            <CarouselItem key={item.id} className="pl-0">
                                                <div className="grid md:grid-cols-[1.1fr_0.9fr] items-center gap-4 md:gap-6">
                                                    <Link href={`/ecommerce/products/${item.id}`} className="relative h-[220px] md:h-[260px] rounded-2xl overflow-hidden bg-white block">
                                                        <Image
                                                            src={item.image}
                                                            alt={item.name}
                                                            fill
                                                            className="object-cover"
                                                            sizes="(max-width: 768px) 100vw, 50vw"
                                                            unoptimized
                                                        />
                                                        {item.badge && (
                                                            <Badge className="absolute top-3 left-3 bg-indigo-600 text-white rounded-full px-3 py-1 shadow">
                                                                {item.badge}
                                                            </Badge>
                                                        )}
                                                    </Link>
                                                    <div className="space-y-3 text-white">
                                                        <p className="text-xs uppercase tracking-[0.2em] text-white/70">{item.category}</p>
                                                        <h3 className="text-2xl font-bold leading-snug">{item.name}</h3>
                                                        {item.vendor && (
                                                            <p className="text-sm text-white/80">By {item.vendor}</p>
                                                        )}
                                                        <div className="flex items-center gap-3 text-lg font-semibold">
                                                            <span className="text-white">{"\u20B1"}{item.price.toFixed(2)}</span>
                                                            {item.originalPrice && (
                                                                <span className="text-white/60 line-through text-base">
                                                                    {"\u20B1"}{item.originalPrice.toFixed(2)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-6 pt-1 text-sm text-white/80">
                                                            <div className="hidden md:flex items-center gap-1.5">
                                                                <Clock className="w-4 h-4" />
                                                                {item.daysAgo === 1 ? "Today" : `${item.daysAgo}d ago`}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>
                                    <div className="flex items-center justify-end gap-2 pt-3">
                                        <CarouselPrevious className="static translate-y-0 h-10 w-10 rounded-full bg-white/20 border-white/20 text-white hover:bg-white/30" />
                                        <CarouselNext className="static translate-y-0 h-10 w-10 rounded-full bg-white/20 border-white/20 text-white hover:bg-white/30" />
                                    </div>
                                </Carousel>
                            ) : (
                                <div className="flex items-center justify-center h-[260px] text-white/60">
                                    No new arrivals yet
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Trending Categories */}
            {categoryNames.length > 0 && (
                <div className="container mx-auto px-4 lg:px-8 -mt-8 relative z-10 mb-12">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-indigo-600" />
                                Browse Categories
                            </h2>
                            <Link href="/ecommerce/categories">
                                <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700">
                                    View all
                                </Button>
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {categoryNames.map((name, i) => (
                                <Link key={name} href={`/ecommerce/products?category=${name}`}>
                                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 text-center hover:shadow-md transition-all cursor-pointer group">
                                        <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{CATEGORY_ICONS[i] || "📦"}</div>
                                        <h3 className="font-bold text-gray-900 mb-1">{name}</h3>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* New Arrivals Grid */}
            <div className="container mx-auto px-4 lg:px-8 pb-16">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Latest Arrivals</h2>
                        <p className="text-gray-600">Newest products added recently</p>
                    </div>
                    <Badge variant="secondary" className="hidden md:flex items-center gap-2 px-4 py-2 text-sm">
                        <Clock className="w-4 h-4" />
                        Updated regularly
                    </Badge>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                        {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
                    </div>
                ) : products.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
                        {products.map((product) => (
                            <div key={product.id} className="relative">
                                <ProductCard product={product} />
                                {product.daysAgo && (
                                    <div className="absolute top-3 left-3 z-10">
                                        <Badge className="bg-white/90 backdrop-blur-sm text-gray-700 border border-gray-200 shadow-sm">
                                            {product.daysAgo <= 1 ? "Today" : `${product.daysAgo}d ago`}
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <p className="text-lg font-semibold text-gray-900 mb-2">No products available yet</p>
                        <p className="text-gray-500 mb-6">Check back soon for new arrivals!</p>
                        <Link href="/ecommerce/products">
                            <Button className="bg-gray-900 hover:bg-gray-800 rounded-full">
                                Browse All Products
                            </Button>
                        </Link>
                    </div>
                )}
            </div>

            {/* Newsletter CTA */}
            <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 py-16">
                <div className="container mx-auto px-4 lg:px-8 text-center">
                    <Sparkles className="w-12 h-12 text-yellow-400 mx-auto mb-6" />
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Never Miss New Arrivals</h2>
                    <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                        Subscribe to get notified when new products drop from your favorite vendors
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="flex-1 h-12 px-4 rounded-full border-2 border-gray-700 bg-gray-800 text-white placeholder:text-gray-400 focus:outline-none focus:border-white"
                        />
                        <Button size="lg" className="h-12 px-8 bg-white text-gray-900 hover:bg-gray-100 rounded-full font-bold">
                            Subscribe
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
