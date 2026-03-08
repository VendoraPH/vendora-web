"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProductCard } from "@/components/ecommerce/ProductCard"
import { useCartStore } from "@/store/useCartStore"
import { productService } from "@/services"
import type { ApiProduct } from "@/services"
import {
    ShoppingCart,
    Heart,
    Share2,
    Truck,
    Shield,
    RotateCcw,
    ChevronRight,
    Check,
    Store,
} from "lucide-react"
import { cn } from "@/lib/utils"

const resolveImageUrl = (url: string | null | undefined): string | null => {
    if (!url) return null
    if (url.startsWith('http://') || url.startsWith('https://')) return url
    const base = 'https://vendora-api.abedubas.dev'
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`
}

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
        image: resolveImageUrl(p.image) || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80",
        description: p.description,
        badge,
        badgeType,
    }
}

function ProductDetailSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200">
                <div className="container mx-auto px-4 lg:px-8 py-4">
                    <div className="h-5 w-64 bg-gray-200 rounded animate-pulse" />
                </div>
            </div>
            <div className="container mx-auto px-4 lg:px-8 py-8">
                <div className="grid lg:grid-cols-2 gap-12 mb-16">
                    <div className="space-y-4">
                        <div className="aspect-square bg-gray-200 rounded-2xl animate-pulse" />
                        <div className="grid grid-cols-4 gap-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
                            ))}
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
                        <div className="h-10 w-3/4 bg-gray-200 rounded animate-pulse" />
                        <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
                        <div className="h-12 w-48 bg-gray-200 rounded animate-pulse" />
                        <div className="h-20 w-full bg-gray-200 rounded animate-pulse" />
                        <div className="h-14 w-full bg-gray-200 rounded animate-pulse" />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function ProductDetailPage() {
    const params = useParams()
    const productId = params.id as string
    const { addItem } = useCartStore()

    const [product, setProduct] = useState<ApiProduct | null>(null)
    const [relatedProducts, setRelatedProducts] = useState<UIProduct[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedImage, setSelectedImage] = useState(0)
    const [quantity, setQuantity] = useState(1)
    const [isWishlisted, setIsWishlisted] = useState(false)

    // Fetch product data
    useEffect(() => {
        let cancelled = false

        async function fetchProduct() {
            setIsLoading(true)
            setError(null)

            try {
                const data = await productService.getById(productId)
                if (cancelled) return
                setProduct(data)

                // Fetch related products from the same category
                if (data.category?.id) {
                    try {
                        const related = await productService.getByCategory(data.category.id)
                        if (!cancelled) {
                            const mapped = (Array.isArray(related) ? related : [])
                                .filter(p => String(p.id) !== productId)
                                .slice(0, 4)
                                .map(mapApiProduct)
                            setRelatedProducts(mapped)
                        }
                    } catch {
                        // Non-critical — related products can fail silently
                    }
                }
            } catch (err: any) {
                console.error("Failed to load product:", err)
                if (!cancelled) {
                    setError(err?.response?.status === 404
                        ? "Product not found."
                        : "Failed to load product. Please try again."
                    )
                }
            } finally {
                if (!cancelled) setIsLoading(false)
            }
        }

        fetchProduct()
        return () => { cancelled = true }
    }, [productId])

    if (isLoading) return <ProductDetailSkeleton />

    if (error || !product) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center space-y-4 max-w-md">
                    <h1 className="text-2xl font-bold text-gray-900">{error || "Product not found"}</h1>
                    <p className="text-gray-600">The product you're looking for might have been removed or is temporarily unavailable.</p>
                    <Link href="/ecommerce/products">
                        <Button className="bg-gray-900 hover:bg-gray-800 rounded-full">
                            Browse Products
                        </Button>
                    </Link>
                </div>
            </div>
        )
    }

    const price = Number(product.price)
    const cost = product.cost ? Number(product.cost) : undefined
    const originalPrice = cost && cost > price ? cost : undefined
    const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0
    const inStock = product.stock > 0
    const fallbackImage = "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80"
    const images = product.image
        ? [product.image]
        : [fallbackImage]
    const vendorName = product.vendor?.name || "Vendor"

    const cartProduct = {
        id: String(product.id),
        name: product.name,
        price,
        category: product.category?.name || "Uncategorized",
        image: images[0] ?? fallbackImage,
    }

    const handleAddToCart = () => {
        for (let i = 0; i < quantity; i++) {
            addItem(cartProduct)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Breadcrumb */}
            <div className="bg-white border-b border-gray-200">
                <div className="container mx-auto px-4 lg:px-8 py-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Link href="/ecommerce" className="hover:text-gray-900">Home</Link>
                        <ChevronRight className="w-4 h-4" />
                        <Link href="/ecommerce/products" className="hover:text-gray-900">Products</Link>
                        <ChevronRight className="w-4 h-4" />
                        <Link href={`/ecommerce/products?category=${product.category?.name}`} className="hover:text-gray-900">{product.category?.name || "All"}</Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-gray-900 font-medium">{product.name}</span>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 lg:px-8 py-8">
                <div className="grid lg:grid-cols-2 gap-12 mb-16">
                    {/* Image Gallery */}
                    <div className="space-y-4">
                        {/* Main Image */}
                        <div className="relative aspect-square bg-white rounded-2xl border-2 border-gray-200 overflow-hidden">
                            <Image
                                src={images[selectedImage] ?? images[0] ?? fallbackImage}
                                alt={product.name}
                                fill
                                className="object-cover"
                                unoptimized
                            />
                            {discount > 0 && (
                                <Badge className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-1.5 text-sm font-bold">
                                    {discount}% OFF
                                </Badge>
                            )}
                        </div>

                        {/* Thumbnail Images (if multiple) */}
                        {images.length > 1 && (
                            <div className="grid grid-cols-4 gap-3">
                                {images.map((image: string, index: number) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedImage(index)}
                                        className={cn(
                                            "relative aspect-square bg-white rounded-lg border-2 overflow-hidden transition-all",
                                            selectedImage === index
                                                ? "border-gray-900 shadow-md"
                                                : "border-gray-200 hover:border-gray-400"
                                        )}
                                    >
                                        <Image
                                            src={image}
                                            alt={`${product.name} - View ${index + 1}`}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="space-y-6">
                        {/* Vendor Badge */}
                        <Badge variant="secondary" className="mb-2 flex items-center gap-2 w-fit">
                            <Store className="w-3 h-3" />
                            {vendorName}
                        </Badge>

                        {/* Title */}
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{product.name}</h1>

                        {/* SKU */}
                        {product.sku && (
                            <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                        )}

                        {/* Price */}
                        <div className="flex items-center gap-4">
                            <span className="text-4xl font-black text-gray-900">{"\u20B1"}{price.toFixed(2)}</span>
                            {originalPrice && (
                                <span className="text-2xl text-gray-400 line-through">{"\u20B1"}{originalPrice.toFixed(2)}</span>
                            )}
                        </div>

                        {/* Stock Status */}
                        {inStock ? (
                            <div className="flex items-center gap-2 text-green-600">
                                <Check className="w-5 h-5" />
                                <span className="font-semibold">In Stock ({product.stock} available)</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-red-600">
                                <span className="font-semibold">Out of Stock</span>
                            </div>
                        )}

                        {/* Description */}
                        {product.description && (
                            <p className="text-gray-600 leading-relaxed">{product.description}</p>
                        )}

                        {/* Quantity Selector */}
                        <div className="flex items-center gap-4">
                            <span className="font-semibold text-gray-900">Quantity:</span>
                            <div className="flex items-center gap-3 border-2 border-gray-200 rounded-lg px-4 py-2">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="text-gray-600 hover:text-gray-900 font-bold text-lg"
                                >
                                    -
                                </button>
                                <span className="font-bold text-gray-900 w-8 text-center">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                                    className="text-gray-600 hover:text-gray-900 font-bold text-lg"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <Button
                                size="lg"
                                onClick={handleAddToCart}
                                disabled={!inStock}
                                className="flex-1 h-14 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-bold text-base shadow-md hover:shadow-xl transition-all"
                            >
                                <ShoppingCart className="w-5 h-5 mr-2" />
                                Add to Cart
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                onClick={() => setIsWishlisted(!isWishlisted)}
                                className={cn(
                                    "h-14 px-6 rounded-lg border-2 font-bold transition-all",
                                    isWishlisted
                                        ? "border-red-500 text-red-500 bg-red-50"
                                        : "border-gray-900 text-gray-900 hover:bg-gray-100"
                                )}
                            >
                                <Heart className={cn("w-5 h-5", isWishlisted && "fill-red-500")} />
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="h-14 px-6 rounded-lg border-2 border-gray-900 text-gray-900 hover:bg-gray-100 font-bold"
                            >
                                <Share2 className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Trust Features */}
                        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-100">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Shield className="w-5 h-5 text-blue-600" />
                                Why Buy From Us
                            </h3>
                            <div className="grid sm:grid-cols-3 gap-4">
                                <div className="flex items-center gap-2 text-sm">
                                    <Truck className="w-5 h-5 text-blue-600" />
                                    <span className="font-medium text-gray-700">Free Shipping</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Shield className="w-5 h-5 text-blue-600" />
                                    <span className="font-medium text-gray-700">Secure Payment</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <RotateCcw className="w-5 h-5 text-blue-600" />
                                    <span className="font-medium text-gray-700">30-Day Returns</span>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Tabs: Details & Specs */}
                <Card className="p-8 mb-16">
                    <Tabs defaultValue="details">
                        <TabsList className="w-full sm:w-auto mb-6">
                            <TabsTrigger value="details">Details</TabsTrigger>
                            <TabsTrigger value="specs">Specifications</TabsTrigger>
                        </TabsList>

                        <TabsContent value="details" className="space-y-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Product Details</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    {product.description || "No detailed description available for this product."}
                                </p>
                            </div>
                        </TabsContent>

                        <TabsContent value="specs">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Specifications</h3>
                                <div className="space-y-3">
                                    {[
                                        ["SKU", product.sku],
                                        ["Category", product.category?.name],
                                        ["Price", `\u20B1${price.toFixed(2)}`],
                                        ["Currency", product.currency],
                                        ["Stock", String(product.stock)],
                                        product.unit ? ["Unit", product.unit] : null,
                                        product.barcode ? ["Barcode", product.barcode] : null,
                                    ].filter(Boolean).map((spec) => (
                                        <div key={spec![0]} className="flex py-3 border-b border-gray-200 last:border-0">
                                            <span className="font-semibold text-gray-900 w-48">{spec![0]}</span>
                                            <span className="text-gray-600">{spec![1]}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </Card>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">You May Also Like</h2>
                                <p className="text-gray-600">Similar products from this category</p>
                            </div>
                            <Link href="/ecommerce/products">
                                <Button variant="ghost" className="hidden md:flex items-center gap-2">
                                    View all
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {relatedProducts.map((rp) => (
                                <ProductCard key={rp.id} product={rp} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
