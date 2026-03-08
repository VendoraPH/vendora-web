"use client"

import { useState, useEffect } from "react"
import { ProductCard } from "@/components/ecommerce/ProductCard"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronRight, Package } from "lucide-react"
import Link from "next/link"
import { categoryService, productService } from "@/services"
import type { ApiCategory, ApiProduct } from "@/services"

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

    if (p.stock === 0) {
        badge = "Out of Stock"
        badgeType = "hot"
    } else if (p.is_low_stock && p.stock > 0) {
        badge = "Low Stock"
        badgeType = "hot"
    } else if (cost && cost > price) {
        const discount = Math.round(((cost - price) / cost) * 100)
        badge = `${discount}% OFF`
        badgeType = "discount"
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

// Color gradients for category cards
const CATEGORY_COLORS = [
    { color: "from-blue-500 to-blue-600", bgColor: "bg-blue-50" },
    { color: "from-pink-500 to-rose-600", bgColor: "bg-pink-50" },
    { color: "from-amber-500 to-orange-600", bgColor: "bg-amber-50" },
    { color: "from-purple-500 to-violet-600", bgColor: "bg-purple-50" },
    { color: "from-green-500 to-emerald-600", bgColor: "bg-green-50" },
    { color: "from-indigo-500 to-blue-600", bgColor: "bg-indigo-50" },
    { color: "from-red-500 to-rose-600", bgColor: "bg-red-50" },
    { color: "from-teal-500 to-cyan-600", bgColor: "bg-teal-50" },
]

function CategorySkeleton() {
    return (
        <Card className="overflow-hidden border-2 border-gray-100">
            <div className="p-8">
                <div className="w-20 h-20 rounded-2xl bg-gray-200 animate-pulse mb-6" />
                <div className="h-7 w-32 bg-gray-200 rounded animate-pulse mb-3" />
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-4" />
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-3 bg-gray-100" />
        </Card>
    )
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<ApiCategory[]>([])
    const [featuredProducts, setFeaturedProducts] = useState<UIProduct[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [totalProducts, setTotalProducts] = useState(0)

    useEffect(() => {
        let cancelled = false

        async function fetchData() {
            setIsLoading(true)
            setError(null)

            try {
                const [catsResult, productsResult] = await Promise.allSettled([
                    categoryService.getAll(),
                    productService.getAll({ per_page: 100 }),
                ])

                if (cancelled) return

                // Process categories
                if (catsResult.status === "fulfilled") {
                    const catList = Array.isArray(catsResult.value) ? catsResult.value : []
                    setCategories(catList.filter((c: ApiCategory) => c.is_active !== false))
                } else {
                    console.error("Failed to fetch categories:", catsResult.reason)
                    setError("Failed to load categories.")
                }

                // Process products for featured section and counts
                if (productsResult.status === "fulfilled") {
                    const products = Array.isArray(productsResult.value) ? productsResult.value : []
                    const active = products.filter((p: ApiProduct) => p.is_active !== false)
                    setTotalProducts(active.length)

                    // Take first 4 as featured
                    const mapped = active.slice(0, 4).map(mapApiProduct)
                    setFeaturedProducts(mapped)
                }
            } catch (err) {
                console.error("Failed to load categories:", err)
                if (!cancelled) setError("Failed to load categories. Please try again.")
            } finally {
                if (!cancelled) setIsLoading(false)
            }
        }

        fetchData()
        return () => { cancelled = true }
    }, [])

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="container mx-auto px-4 lg:px-8 py-12">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Shop by Category</h1>
                    <p className="text-lg text-gray-600">Browse products organized by category</p>
                </div>
            </div>

            <div className="container mx-auto px-4 lg:px-8 py-12">
                {/* Error state */}
                {error && !isLoading && categories.length === 0 && (
                    <div className="rounded-2xl p-8 text-center bg-white border border-gray-200 shadow-sm mb-8">
                        <p className="text-lg font-semibold text-gray-900 mb-1">{error}</p>
                        <p className="text-sm text-gray-500 mb-5">Please check your connection and try again.</p>
                        <Button onClick={() => window.location.reload()} className="bg-gray-900 hover:bg-gray-800">
                            Retry
                        </Button>
                    </div>
                )}

                {/* Categories Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                    {isLoading ? (
                        Array.from({ length: 6 }).map((_, i) => <CategorySkeleton key={i} />)
                    ) : (
                        categories.map((category, index) => {
                            const colorScheme = CATEGORY_COLORS[index % CATEGORY_COLORS.length] ?? CATEGORY_COLORS[0]!
                            return (
                                <Link key={category.id} href={`/ecommerce/products?category=${category.name}`}>
                                    <Card className="group overflow-hidden border-2 border-gray-100 hover:border-gray-300 hover:shadow-xl transition-all duration-300 cursor-pointer">
                                        <div className="p-8">
                                            {/* Icon Container */}
                                            <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${colorScheme.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                                                <Package className="w-10 h-10 text-white" strokeWidth={2} />
                                            </div>

                                            {/* Category Info */}
                                            <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-gray-700 transition-colors">
                                                {category.name}
                                            </h3>
                                            <p className="text-gray-600 mb-4 leading-relaxed">
                                                {category.description || `Browse ${category.name} products`}
                                            </p>

                                            {/* Arrow */}
                                            <div className="flex items-center justify-end">
                                                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-1 transition-all" />
                                            </div>
                                        </div>

                                        {/* Decorative Background */}
                                        <div className={`h-3 ${colorScheme.bgColor} opacity-50 group-hover:opacity-100 transition-opacity`}></div>
                                    </Card>
                                </Link>
                            )
                        })
                    )}
                </div>

                {/* Featured Products */}
                {featuredProducts.length > 0 && (
                    <div className="mb-16">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Featured Products</h2>
                                <p className="text-gray-600">Top picks across all categories</p>
                            </div>
                            <Link href="/ecommerce/products">
                                <Button variant="outline" className="hidden md:flex items-center gap-2">
                                    View all
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {featuredProducts.map((product) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    </div>
                )}

                {/* CTA Banner */}
                <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-8 md:p-12 text-white">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Can't find what you're looking for?</h2>
                        <p className="text-xl text-gray-300 mb-8">
                            Try browsing all products or use our search feature
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/ecommerce/products">
                                <Button size="lg" className="h-14 px-8 bg-white text-gray-900 hover:bg-gray-100 rounded-full font-bold shadow-xl w-full sm:w-auto">
                                    Browse all products
                                </Button>
                            </Link>
                            <Link href="/ecommerce/deals">
                                <Button size="lg" variant="outline" className="h-14 px-8 bg-transparent border-2 border-white text-white hover:bg-white/10 rounded-full font-bold w-full sm:w-auto">
                                    View deals
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Category Stats */}
                <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center p-6 bg-white rounded-2xl border border-gray-200">
                        <div className="text-4xl font-black text-gray-900 mb-2">{categories.length}</div>
                        <div className="text-sm text-gray-600 font-medium">Categories</div>
                    </div>
                    <div className="text-center p-6 bg-white rounded-2xl border border-gray-200">
                        <div className="text-4xl font-black text-gray-900 mb-2">{totalProducts > 0 ? `${totalProducts}+` : "---"}</div>
                        <div className="text-sm text-gray-600 font-medium">Products</div>
                    </div>
                    <div className="text-center p-6 bg-white rounded-2xl border border-gray-200">
                        <div className="text-4xl font-black text-gray-900 mb-2">24/7</div>
                        <div className="text-sm text-gray-600 font-medium">Support</div>
                    </div>
                    <div className="text-center p-6 bg-white rounded-2xl border border-gray-200">
                        <div className="text-4xl font-black text-gray-900 mb-2">Free</div>
                        <div className="text-sm text-gray-600 font-medium">Shipping</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
