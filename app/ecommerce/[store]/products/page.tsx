"use client"

import { useState, useEffect, useMemo, useRef, useCallback, use } from "react"
import { ProductCard } from "@/components/ecommerce/ProductCard"
import { StoreBanner } from "@/components/ecommerce/StoreBanner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    SlidersHorizontal, LayoutGrid, X, Search, Loader2,
} from "lucide-react"
import { categoryService, storeService } from "@/services"
import type { ApiProduct, ApiCategory, ApiStore } from "@/services"
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
}

function mapApiProduct(p: ApiProduct): UIProduct {
    const price = Number(p.price)
    const cost = p.cost ? Number(p.cost) : undefined

    // Determine badge based on product attributes
    let badge: string | undefined
    let badgeType: UIProduct["badgeType"]

    if (p.is_low_stock && p.stock > 0) {
        badge = "Low Stock"
        badgeType = "hot"
    } else if (p.stock === 0) {
        badge = "Out of Stock"
        badgeType = "hot"
    } else if (cost && cost < price * 0.8) {
        // Good margin products
        badge = "Best Seller"
        badgeType = "bestseller"
    }

    return {
        id: String(p.id),
        name: p.name,
        price,
        originalPrice: cost && cost > price ? cost : undefined,
        category: p.category?.name || "Uncategorized",
        image: p.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80",
        description: p.description,
        badge,
        badgeType,
    }
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
// Filter Panel
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
                    <span className="text-[#7C3AED] dark:text-[#7C3AED]">₱{priceRange[0]}</span>
                    <span className="text-[#7C3AED] dark:text-[#7C3AED]">₱{priceRange[1]}</span>
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


// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function StoreProductsPage({ params }: { params: Promise<{ store: string }> }) {
    const { store: storeSlug } = use(params)

    const [storeInfo, setStoreInfo] = useState<ApiStore | null>(null)
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

    // Scroll reveal refs
    const categoryReveal = useScrollReveal()
    const gridReveal = useScrollReveal()

    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Fetch store info, products, and categories from API
    useEffect(() => {
        let cancelled = false

        async function fetchData() {
            setIsLoading(true)
            setError(null)

            try {
                const [storeResult, apiProducts, cats] = await Promise.allSettled([
                    storeService.getBySlug(storeSlug),
                    storeService.getProductsBySlug(storeSlug, { per_page: 200 }),
                    categoryService.getAll(),
                ])

                if (cancelled) return

                // Resolve store info by code
                if (storeResult.status === "fulfilled") {
                    setStoreInfo(storeResult.value)
                }

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
    }, [storeSlug])

    // Compute max price for filter slider
    const maxPrice = useMemo(() => {
        if (products.length === 0) return 10000
        const max = Math.max(...products.map(p => p.price))
        return Math.ceil(max / 100) * 100 || 10000
    }, [products])

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

    // Build category chips from API data
    const categoryChips = useMemo(() => {
        return ["All", ...apiCategories]
    }, [apiCategories])

    return (
        <div className="min-h-screen bg-[#f8f8fc] dark:bg-[#110228]">

            {/* ── Store Identity Banner ──────────────────────────────── */}
            <StoreBanner
                name={storeInfo?.name}
                address={storeInfo?.address}
                phone={storeInfo?.phone}
            />

            {/* ── Main Content ────────────────────────────────────────── */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10 sm:space-y-14">

                {/* ── Category Navigation Strip ───────────────────────── */}
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


                {/* ── All Products — Grid + Filters ───────────────────── */}
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
                                    <SelectItem value="price-asc">Price: Low → High</SelectItem>
                                    <SelectItem value="price-desc">Price: High → Low</SelectItem>
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
                                                {/* Handle bar */}
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
                                                {/* Apply button */}
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
