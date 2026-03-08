"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { ProductCard } from "@/components/ecommerce/ProductCard"
import { Hero } from "@/components/ecommerce/Hero"
import { StoreBanner } from "@/components/ecommerce/StoreBanner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    SlidersHorizontal, LayoutGrid, X, Search, ShoppingCart,
    Zap, TrendingUp, ChevronRight, Loader2
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useCartStore } from "@/store/useCartStore"
import { productService, categoryService } from "@/services"
import type { ApiProduct, ApiCategory } from "@/services"
import {
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet"
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"


// ---------------------------------------------------------------------------
// Resolve image URL — handles relative paths from API storage
const resolveImageUrl = (url: string | null | undefined): string | null => {
    if (!url) return null
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    const base = 'https://vendora-api.abedubas.dev'
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`
}

// ---------------------------------------------------------------------------
// Map API product to UI-friendly shape
// ---------------------------------------------------------------------------
type UIProduct = {
    id: string
    name: string
    price: number
    originalPrice?: number
    category: string
    image: string
    description?: string
    badge?: string
    badgeType?: "hot" | "bestseller" | "discount"
    rating?: number
    reviewCount?: number
    isFlashSale?: boolean
    isTrending?: boolean
    isNew?: boolean
    stock?: number
    createdAt?: string
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

    // Determine featured flags based on product attributes
    const hasDiscount = cost && cost > price

    return {
        id: String(p.id),
        name: p.name,
        price,
        originalPrice: cost && cost > price ? cost : undefined,
        category: p.category?.name || "Uncategorized",
        image: resolveImageUrl(p.image) || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80",
        description: p.description,
        badge,
        badgeType,
        isFlashSale: hasDiscount ? true : false,
        isTrending: p.stock > 10,
        isNew: isNewProduct(p.created_at),
        stock: p.stock,
        createdAt: p.created_at,
    }
}

function isNewProduct(createdAt: string): boolean {
    const created = new Date(createdAt)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    return created > sevenDaysAgo
}


// ---------------------------------------------------------------------------
// Countdown hook
// ---------------------------------------------------------------------------
function useCountdown(targetSeconds: number) {
    const [remaining, setRemaining] = useState(targetSeconds)

    useEffect(() => {
        const id = setInterval(() => {
            setRemaining((prev) => (prev > 0 ? prev - 1 : 0))
        }, 1000)
        return () => clearInterval(id)
    }, [])

    const h = Math.floor(remaining / 3600)
    const m = Math.floor((remaining % 3600) / 60)
    const s = remaining % 60
    return { h, m, s }
}


// ---------------------------------------------------------------------------
// Scroll reveal hook
// ---------------------------------------------------------------------------
function useScrollReveal() {
    const ref = useRef<HTMLDivElement>(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const el = ref.current
        if (!el) return

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0]
                if (entry?.isIntersecting) {
                    setIsVisible(true)
                    observer.unobserve(el)
                }
            },
            { threshold: 0.1 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [])

    return { ref, isVisible }
}


// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------
function ProductSkeleton() {
    return (
        <div className="rounded-xl sm:rounded-2xl overflow-hidden bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06]">
            <div className="aspect-square bg-gray-200 dark:bg-white/[0.06] animate-pulse" />
            <div className="p-2.5 sm:p-3 space-y-2">
                <div className="h-3 w-16 bg-gray-200 dark:bg-white/[0.06] rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-200 dark:bg-white/[0.06] rounded animate-pulse" />
                <div className="h-4 w-3/4 bg-gray-200 dark:bg-white/[0.06] rounded animate-pulse" />
                <div className="h-3 w-20 bg-gray-200 dark:bg-white/[0.06] rounded animate-pulse" />
                <div className="h-5 w-16 bg-gray-200 dark:bg-white/[0.06] rounded animate-pulse mt-1" />
                <div className="h-10 w-full bg-gray-200 dark:bg-white/[0.06] rounded-lg animate-pulse mt-1" />
            </div>
        </div>
    )
}

function FlashSaleSkeleton() {
    return (
        <div className="shrink-0 w-52 sm:w-60 rounded-2xl overflow-hidden flex flex-col"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="aspect-square bg-white/[0.06] animate-pulse" />
            <div className="p-3 space-y-2">
                <div className="h-3 w-16 bg-white/[0.06] rounded animate-pulse" />
                <div className="h-4 w-full bg-white/[0.06] rounded animate-pulse" />
                <div className="h-5 w-20 bg-white/[0.06] rounded animate-pulse" />
                <div className="h-9 w-full bg-white/[0.06] rounded-xl animate-pulse" />
            </div>
        </div>
    )
}


// ---------------------------------------------------------------------------
// Filter Panel (dark glass)
// ---------------------------------------------------------------------------
function FilterPanel({
    categories,
    selectedCategories,
    onCategoryToggle,
    priceRange,
    maxPrice,
    onPriceRangeChange,
    onClearFilters,
}: {
    categories: string[]
    selectedCategories: string[]
    onCategoryToggle: (cat: string) => void
    priceRange: [number, number]
    maxPrice: number
    onPriceRangeChange: (range: [number, number]) => void
    onClearFilters: () => void
}) {
    const hasActiveFilters = selectedCategories.length > 0 || priceRange[0] > 0 || priceRange[1] < maxPrice

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Filters</h3>
                {hasActiveFilters && (
                    <button
                        onClick={onClearFilters}
                        className="text-xs font-semibold text-[#7C3AED] dark:text-[#7C3AED] hover:text-[#6D28D9] dark:hover:text-[#6D28D9] transition-colors"
                    >
                        Clear all
                    </button>
                )}
            </div>

            {/* Category filter */}
            <div>
                <h4 className="text-sm font-semibold text-gray-500 dark:text-white/70 mb-3">Categories</h4>
                <div className="space-y-2.5">
                    {categories.map((cat) => (
                        <div key={cat} className="flex items-center gap-2.5">
                            <Checkbox
                                id={`sidebar-filter-${cat}`}
                                checked={selectedCategories.includes(cat)}
                                onCheckedChange={() => onCategoryToggle(cat)}
                                className="border-gray-300 dark:border-white/20 data-[state=checked]:bg-[#7C3AED] dark:data-[state=checked]:bg-[#7C3AED] data-[state=checked]:border-[#7C3AED] dark:data-[state=checked]:border-[#7C3AED] data-[state=checked]:text-white dark:data-[state=checked]:text-[#110228]"
                            />
                            <Label
                                htmlFor={`sidebar-filter-${cat}`}
                                className="text-sm text-gray-500 dark:text-white/50 cursor-pointer hover:text-gray-800 dark:hover:text-white/80 transition-colors"
                            >
                                {cat}
                            </Label>
                        </div>
                    ))}
                </div>
            </div>

            {/* Price range */}
            <div>
                <h4 className="text-sm font-semibold text-gray-500 dark:text-white/70 mb-3">Price Range</h4>
                <Slider
                    min={0}
                    max={maxPrice}
                    step={10}
                    value={priceRange}
                    onValueChange={(v) => onPriceRangeChange(v as [number, number])}
                    className="w-full"
                />
                <div className="flex justify-between mt-2 text-sm font-semibold">
                    <span className="text-[#7C3AED] dark:text-[#7C3AED]">{"\u20B1"}{priceRange[0]}</span>
                    <span className="text-[#7C3AED] dark:text-[#7C3AED]">{"\u20B1"}{priceRange[1]}</span>
                </div>
            </div>

            {hasActiveFilters && (
                <Button
                    variant="outline"
                    className="w-full font-semibold gap-1.5 rounded-xl border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-800 dark:hover:text-white"
                    onClick={onClearFilters}
                >
                    <X className="w-4 h-4" />
                    Clear all filters
                </Button>
            )}
        </div>
    )
}


// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function ProductsPage() {
    const [products, setProducts] = useState<UIProduct[]>([])
    const [apiCategories, setApiCategories] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [totalApiCount, setTotalApiCount] = useState(0)

    const [selectedCategories, setSelectedCategories] = useState<string[]>([])
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000])
    const [showFilters, setShowFilters] = useState(false)
    const [isMounted, setIsMounted] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [sortBy, setSortBy] = useState("featured")
    const [activeCategory, setActiveCategory] = useState("All")
    const countdown = useCountdown(2 * 3600 + 47 * 60 + 33)

    // Scroll reveal refs
    const categoryReveal = useScrollReveal()
    const flashSaleReveal = useScrollReveal()
    const trendingReveal = useScrollReveal()
    const gridReveal = useScrollReveal()

    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Fetch products and categories from API
    useEffect(() => {
        let cancelled = false

        async function fetchData() {
            setIsLoading(true)
            setError(null)

            try {
                const [apiProducts, cats] = await Promise.allSettled([
                    productService.getAll({ per_page: 200 }),
                    categoryService.getAll(),
                ])

                if (cancelled) return

                // Process products
                let rawProducts: ApiProduct[] = []
                if (apiProducts.status === "fulfilled") {
                    rawProducts = Array.isArray(apiProducts.value) ? apiProducts.value : []
                } else {
                    console.error("Failed to fetch products:", apiProducts.reason)
                }

                // Filter to ecommerce-enabled products and map
                const ecommerceProducts = rawProducts.filter(p => p.is_ecommerce !== false && p.is_active !== false)
                const mapped = ecommerceProducts.map(mapApiProduct)
                setProducts(mapped)
                setTotalApiCount(mapped.length)

                // Compute max price for filter range
                if (mapped.length > 0) {
                    const max = Math.max(...mapped.map(p => p.price))
                    const roundedMax = Math.ceil(max / 100) * 100
                    setPriceRange([0, roundedMax])
                }

                // Process categories
                if (cats.status === "fulfilled") {
                    const catList = Array.isArray(cats.value) ? cats.value : []
                    const catNames = catList
                        .filter((c: ApiCategory) => c.is_active !== false)
                        .map((c: ApiCategory) => c.name)
                    setApiCategories(catNames)
                } else {
                    // Fallback: derive categories from products
                    const uniqueCats = [...new Set(mapped.map(p => p.category))]
                    setApiCategories(uniqueCats)
                }

                if (rawProducts.length === 0) {
                    setError("No products available at the moment.")
                }
            } catch (err) {
                console.error("Failed to load products:", err)
                if (!cancelled) {
                    setError("Failed to load products. Please try again.")
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false)
                }
            }
        }

        fetchData()
        return () => { cancelled = true }
    }, [])

    // Compute max price for filter slider
    const maxPrice = useMemo(() => {
        if (products.length === 0) return 10000
        const max = Math.max(...products.map(p => p.price))
        return Math.ceil(max / 100) * 100 || 10000
    }, [products])

    // Flash sale products (products with discounts)
    const flashSaleProducts = useMemo(() => {
        return products.filter(p => p.isFlashSale && p.originalPrice).slice(0, 6)
    }, [products])

    // Trending products (in stock, sorted by stock level descending as a proxy for popularity)
    const trendingProducts = useMemo(() => {
        return products.filter(p => p.isTrending).slice(0, 6)
    }, [products])

    // Category chips from API data
    const categoryChips = useMemo(() => {
        return ["All", ...apiCategories]
    }, [apiCategories])

    // Category chip click — sets sidebar filter + active category
    const handleCategoryChipClick = useCallback((cat: string) => {
        setActiveCategory(cat)
        if (cat === "All") {
            setSelectedCategories([])
        } else {
            setSelectedCategories([cat])
        }
    }, [])

    // Filtering logic
    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            const matchesCat =
                selectedCategories.length > 0
                    ? selectedCategories.includes(p.category)
                    : true
            const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1]
            const matchesSearch =
                searchQuery.trim() === "" ||
                p.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
                p.category.toLowerCase().includes(searchQuery.trim().toLowerCase())
            return matchesCat && matchesPrice && matchesSearch
        })
    }, [products, selectedCategories, priceRange, searchQuery])

    // Sorting logic
    const sortedProducts = useMemo(() => {
        const items = [...filteredProducts]
        switch (sortBy) {
            case "price-asc":
                return items.sort((a, b) => a.price - b.price)
            case "price-desc":
                return items.sort((a, b) => b.price - a.price)
            case "rating":
                return items.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
            case "newest":
                return items.sort((a, b) => Number(b.id) - Number(a.id))
            default:
                return items
        }
    }, [filteredProducts, sortBy])

    const handleCategoryToggle = (cat: string) => {
        setSelectedCategories((prev) =>
            prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
        )
        setActiveCategory("All") // Reset pill when using sidebar
    }

    const clearFilters = () => {
        setSelectedCategories([])
        setPriceRange([0, maxPrice])
        setSearchQuery("")
        setActiveCategory("All")
    }

    return (
        <div className="min-h-screen bg-[#f8f8fc] dark:bg-[#110228]">

            {/* -- Store Identity Banner -- */}
            <StoreBanner />

            {/* -- Hero Banner -- */}
            <Hero />

            {/* -- Main Content -- */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10 sm:space-y-14">

                {/* -- Category Navigation Strip -- */}
                <div
                    ref={categoryReveal.ref}
                    className={`transition-all duration-700 ${categoryReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
                >
                    <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
                        {categoryChips.map((cat) => {
                            const isActive = activeCategory === cat
                            return (
                                <button
                                    key={cat}
                                    onClick={() => handleCategoryChipClick(cat)}
                                    className={`
                                        flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl
                                        text-sm font-semibold whitespace-nowrap shrink-0
                                        transition-all duration-300 active:scale-95
                                        ${isActive
                                            ? "bg-[#7C3AED] dark:bg-[#7C3AED] text-white dark:text-[#110228] shadow-lg shadow-[#7C3AED]/20 dark:shadow-[#7C3AED]/20"
                                            : "glass-card text-gray-500 dark:text-white/60 hover:text-gray-800 dark:hover:text-white/90"
                                        }
                                    `}
                                >
                                    {cat === "All" && <LayoutGrid className="w-4 h-4" />}
                                    {cat}
                                </button>
                            )
                        })}
                    </div>
                </div>


                {/* -- Flash Sale -- */}
                {(isLoading || flashSaleProducts.length > 0) && (
                    <div
                        ref={flashSaleReveal.ref}
                        className={`transition-all duration-700 delay-100 ${flashSaleReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
                    >
                        <div
                            className="relative rounded-2xl sm:rounded-3xl overflow-hidden animate-shimmer"
                            style={{ background: "linear-gradient(135deg, #110228 0%, #2E0F5F 50%, #7C3AED 100%)" }}
                        >
                            {/* Header */}
                            <div className="relative px-5 sm:px-8 pt-5 sm:pt-6 pb-4 sm:pb-5">
                                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    {/* Left: Branding */}
                                    <div className="flex items-center gap-3.5">
                                        <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-sm">
                                            <Zap className="w-6 h-6 text-[#7C3AED]" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-xs font-bold uppercase tracking-[0.2em] text-purple-200/80">Limited Time</span>
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide animate-pulse bg-[#7C3AED] text-[#110228]">
                                                    LIVE
                                                </span>
                                            </div>
                                            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-none">
                                                Flash Sale
                                            </h2>
                                        </div>
                                    </div>

                                    {/* Right: Countdown */}
                                    {isMounted && (
                                        <div className="flex flex-col items-start sm:items-end gap-1">
                                            <span className="text-xs text-purple-200/60 font-semibold uppercase tracking-wider">Ends in</span>
                                            <div className="flex items-end gap-1.5">
                                                {[
                                                    { val: countdown.h, label: "hrs" },
                                                    { val: countdown.m, label: "min" },
                                                    { val: countdown.s, label: "sec", accent: true },
                                                ].map((unit, i) => (
                                                    <div key={unit.label} className="flex items-end gap-1.5">
                                                        {i > 0 && <span className="text-2xl font-black text-white/30 mb-5">:</span>}
                                                        <div className="flex flex-col items-center">
                                                            <div className={`
                                                                min-w-[48px] sm:min-w-[52px] h-12 sm:h-14 rounded-xl flex items-center justify-center
                                                                backdrop-blur-sm shadow-inner
                                                                ${unit.accent
                                                                    ? "bg-[#7C3AED] border border-[#7C3AED]/50"
                                                                    : "bg-white/10 border border-white/15"
                                                                }
                                                            `}>
                                                                <span className={`text-2xl sm:text-3xl font-black tabular-nums leading-none ${unit.accent ? "text-[#110228]" : "text-white"}`}>
                                                                    {String(unit.val).padStart(2, "0")}
                                                                </span>
                                                            </div>
                                                            <span className="text-[10px] text-purple-200/50 mt-1 font-semibold uppercase tracking-wider">{unit.label}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Flash Sale Products Carousel */}
                            <div className="bg-white/[0.03] backdrop-blur-sm px-4 sm:px-6 pb-5 pt-4">
                                <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
                                    {isLoading ? (
                                        Array.from({ length: 4 }).map((_, i) => (
                                            <FlashSaleSkeleton key={i} />
                                        ))
                                    ) : (
                                        flashSaleProducts.map((product) => {
                                            const savings = product.originalPrice
                                                ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                                                : null
                                            const stockPct = product.stock != null
                                                ? Math.min(100, Math.max(5, Math.round((product.stock / 100) * 100)))
                                                : 50

                                            return (
                                                <div
                                                    key={product.id}
                                                    className="shrink-0 w-52 sm:w-60 rounded-2xl overflow-hidden group hover:-translate-y-1 transition-all duration-300 flex flex-col"
                                                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                                                >
                                                    {/* Image */}
                                                    <Link href={`/ecommerce/products/${product.id}`} className="relative block">
                                                        <div className="relative aspect-square overflow-hidden">
                                                            <Image
                                                                src={product.image}
                                                                alt={product.name}
                                                                fill
                                                                className="object-cover group-hover:scale-110 transition-transform duration-700"
                                                                unoptimized
                                                            />
                                                            {savings && (
                                                                <div className="absolute top-0 left-0 text-white text-xs font-black px-2.5 py-1.5 rounded-br-xl"
                                                                    style={{ background: "linear-gradient(135deg, #7C3AED, #9333EA)" }}
                                                                >
                                                                    -{savings}%
                                                                </div>
                                                            )}
                                                            <div className="absolute inset-0 bg-gradient-to-t from-[#110228]/50 via-transparent to-transparent" />
                                                        </div>
                                                    </Link>

                                                    {/* Info */}
                                                    <div className="p-3 flex flex-col flex-1 gap-1.5">
                                                        <p className="text-[10px] font-bold uppercase tracking-wide text-[#7C3AED]/70">{product.category}</p>
                                                        <Link href={`/ecommerce/products/${product.id}`}>
                                                            <h3 className="text-sm font-bold text-white/90 line-clamp-2 leading-snug hover:text-[#7C3AED] transition-colors">
                                                                {product.name}
                                                            </h3>
                                                        </Link>

                                                        <div className="flex-1" />

                                                        <div className="flex items-baseline gap-1.5">
                                                            <span className="text-lg font-black text-[#7C3AED]">{"\u20B1"}{product.price.toFixed(2)}</span>
                                                            {product.originalPrice && (
                                                                <span className="text-xs text-white/25 line-through">{"\u20B1"}{product.originalPrice.toFixed(2)}</span>
                                                            )}
                                                        </div>

                                                        {/* Stock bar */}
                                                        <div className="space-y-1 mt-1">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[10px] text-white/30">Stock</span>
                                                                <span className={`text-[10px] font-bold ${stockPct < 30 ? "text-red-400" : "text-[#7C3AED]/70"}`}>
                                                                    {stockPct < 30 ? "Almost gone!" : `${stockPct}% left`}
                                                                </span>
                                                            </div>
                                                            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full rounded-full transition-all"
                                                                    style={{
                                                                        width: `${stockPct}%`,
                                                                        background: stockPct < 30
                                                                            ? "linear-gradient(90deg, #ef4444, #f97316)"
                                                                            : "linear-gradient(90deg, #7C3AED, #7C3AED)"
                                                                    }}
                                                                />
                                                            </div>
                                                        </div>

                                                        <button
                                                            onClick={() => useCartStore.getState().addItem(product)}
                                                            className="mt-2 w-full h-9 rounded-xl text-xs font-bold text-[#110228] active:scale-95 transition-all flex items-center justify-center gap-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] shadow-md shadow-[#7C3AED]/10"
                                                        >
                                                            <ShoppingCart className="w-3.5 h-3.5" />
                                                            Add to Cart
                                                        </button>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}


                {/* -- Trending Now -- */}
                {(isLoading || trendingProducts.length > 0) && (
                    <div
                        ref={trendingReveal.ref}
                        className={`transition-all duration-700 delay-150 ${trendingReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
                    >
                        <div className="flex items-center justify-between mb-5 sm:mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#7C3AED]/20 dark:from-[#7C3AED]/20 to-[#7C3AED]/20 dark:to-[#7C3AED]/20 border border-gray-200 dark:border-white/10">
                                    <TrendingUp className="w-4.5 h-4.5 text-[#7C3AED] dark:text-[#7C3AED]" />
                                </div>
                                <div>
                                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                                        Trending Now
                                    </h2>
                                    <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">Most popular this week</p>
                                </div>
                            </div>
                            <Link href="/ecommerce/products" className="flex items-center gap-1 text-sm font-semibold text-[#7C3AED] dark:text-[#7C3AED] hover:text-[#6D28D9] dark:hover:text-[#6D28D9] transition-colors">
                                View All
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>

                        <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 snap-x snap-mandatory scroll-smooth">
                            {isLoading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="shrink-0 w-[72vw] sm:w-60 lg:w-72 snap-start">
                                        <ProductSkeleton />
                                    </div>
                                ))
                            ) : (
                                trendingProducts.map((product) => (
                                    <div key={product.id} className="shrink-0 w-[72vw] sm:w-60 lg:w-72 snap-start">
                                        <ProductCard product={product} />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}


                {/* -- All Products -- Grid + Filters -- */}
                <div
                    ref={gridReveal.ref}
                    className={`transition-all duration-700 delay-200 ${gridReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
                >
                    <section>
                        {/* Section header */}
                        <div className="flex items-center justify-between mb-5 sm:mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100 dark:bg-white/[0.06] border border-gray-200 dark:border-white/10">
                                    <LayoutGrid className="w-4.5 h-4.5 text-[#7C3AED] dark:text-[#7C3AED]" />
                                </div>
                                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                                    All Products
                                </h2>
                            </div>
                        </div>

                        {/* Error state */}
                        {error && !isLoading && products.length === 0 && (
                            <div className="rounded-2xl p-8 text-center bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] shadow-sm dark:shadow-none mb-6">
                                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{error}</p>
                                <p className="text-sm text-gray-500 dark:text-white/40 mb-5">Please check your connection and try again.</p>
                                <Button
                                    onClick={() => window.location.reload()}
                                    className="rounded-xl font-semibold bg-[#7C3AED] hover:bg-[#6D28D9] dark:bg-[#7C3AED] dark:hover:bg-[#6D28D9] text-white dark:text-[#110228]"
                                >
                                    Retry
                                </Button>
                            </div>
                        )}

                        {/* Search bar + Sort */}
                        <div className="flex flex-col sm:flex-row gap-3 mb-5">
                            <div className="relative flex-1">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/30" />
                                <Input
                                    placeholder="Search products..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 h-11 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 bg-white dark:bg-white/[0.04] border-gray-200 dark:border-white/10 focus-visible:ring-[#7C3AED]/50 dark:focus-visible:ring-[#7C3AED]/50 focus-visible:border-[#7C3AED]/50 dark:focus-visible:border-[#7C3AED]/50"
                                />
                            </div>
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-full sm:w-[170px] h-11 rounded-xl text-sm text-gray-600 dark:text-white/70 bg-white dark:bg-white/[0.04] border-gray-200 dark:border-white/10" suppressHydrationWarning>
                                    <SelectValue placeholder="Sort by" />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-[#1a1a35] border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
                                    <SelectItem value="featured">Featured</SelectItem>
                                    <SelectItem value="price-asc">Price: Low {"\u2192"} High</SelectItem>
                                    <SelectItem value="price-desc">Price: High {"\u2192"} Low</SelectItem>
                                    <SelectItem value="rating">Top Rated</SelectItem>
                                    <SelectItem value="newest">Newest</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Product count */}
                        {!isLoading && (
                            <p className="text-sm text-gray-400 dark:text-white/30 mb-4">
                                Showing <span className="font-semibold text-gray-600 dark:text-white/60">{sortedProducts.length}</span> of{" "}
                                <span className="font-semibold text-gray-600 dark:text-white/60">{totalApiCount}</span> products
                            </p>
                        )}

                        {/* Sidebar + Grid */}
                        <div className="flex gap-6">
                            {/* Desktop Filter Sidebar */}
                            <aside className="hidden lg:block w-56 shrink-0">
                                <div className="sticky top-24 rounded-2xl p-5 bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] shadow-sm dark:shadow-none">
                                    <FilterPanel
                                        categories={apiCategories}
                                        selectedCategories={selectedCategories}
                                        onCategoryToggle={handleCategoryToggle}
                                        priceRange={priceRange}
                                        maxPrice={maxPrice}
                                        onPriceRangeChange={setPriceRange}
                                        onClearFilters={clearFilters}
                                    />
                                </div>
                            </aside>

                            {/* Product Grid */}
                            <div className="flex-1 min-w-0">
                                {/* Mobile filter button */}
                                <div className="lg:hidden mb-4">
                                    {isMounted && (
                                        <Sheet open={showFilters} onOpenChange={setShowFilters}>
                                            <SheetTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-9 px-4 text-sm font-semibold gap-1.5 rounded-xl border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.04] text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/[0.08] hover:text-gray-900 dark:hover:text-white"
                                                >
                                                    <SlidersHorizontal className="w-3.5 h-3.5" />
                                                    Filter
                                                    {(selectedCategories.length > 0 || priceRange[1] < maxPrice) && (
                                                        <span className="ml-1 w-4 h-4 rounded-full text-[10px] flex items-center justify-center text-white dark:text-[#110228] font-bold bg-[#7C3AED] dark:bg-[#7C3AED]">
                                                            {selectedCategories.length + (priceRange[1] < maxPrice ? 1 : 0)}
                                                        </span>
                                                    )}
                                                </Button>
                                            </SheetTrigger>
                                            <SheetContent
                                                side="bottom"
                                                className="h-[85vh] rounded-t-2xl border-t border-gray-200 dark:border-white/10 bg-white dark:bg-[#13132a] flex flex-col p-0"
                                            >
                                                <div className="flex justify-center pt-3 pb-1 shrink-0">
                                                    <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
                                                </div>
                                                <SheetHeader className="px-5 pb-3 border-b border-gray-100 dark:border-white/[0.06] shrink-0">
                                                    <SheetTitle className="text-gray-900 dark:text-white text-lg font-bold">Filters</SheetTitle>
                                                </SheetHeader>
                                                <div className="flex-1 overflow-y-auto px-5 py-5">
                                                    <FilterPanel
                                                        categories={apiCategories}
                                                        selectedCategories={selectedCategories}
                                                        onCategoryToggle={handleCategoryToggle}
                                                        priceRange={priceRange}
                                                        maxPrice={maxPrice}
                                                        onPriceRangeChange={setPriceRange}
                                                        onClearFilters={clearFilters}
                                                    />
                                                </div>
                                                <div className="px-5 py-4 border-t border-gray-100 dark:border-white/[0.06] shrink-0 pb-safe">
                                                    <Button
                                                        className="w-full h-12 rounded-xl font-bold bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
                                                        onClick={() => setShowFilters(false)}
                                                    >
                                                        Show {sortedProducts.length} Products
                                                    </Button>
                                                </div>
                                            </SheetContent>
                                        </Sheet>
                                    )}
                                </div>

                                {/* Loading state */}
                                {isLoading ? (
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-white/40">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Loading products...
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3">
                                            {Array.from({ length: 10 }).map((_, i) => (
                                                <ProductSkeleton key={i} />
                                            ))}
                                        </div>
                                    </div>
                                ) : sortedProducts.length > 0 ? (
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3 stagger-children">
                                        {sortedProducts.map((product) => (
                                            <div key={product.id} className="animate-fade-in-up" style={{ opacity: 0 }}>
                                                <ProductCard product={product} />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="rounded-2xl p-10 text-center bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/[0.06] shadow-sm dark:shadow-none">
                                        <p className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No products found</p>
                                        <p className="text-sm text-gray-500 dark:text-white/40 mb-5">Try adjusting your search or filters</p>
                                        <Button
                                            onClick={clearFilters}
                                            className="rounded-xl font-semibold bg-[#7C3AED] hover:bg-[#6D28D9] dark:bg-[#7C3AED] dark:hover:bg-[#6D28D9] text-white dark:text-[#110228]"
                                        >
                                            Clear all filters
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                </div>

            </div>
        </div>
    )
}
