"use client"

import { Product, useCartStore } from "@/store/useCartStore"
import { ShoppingCart, Star, Check } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface ProductCardProps {
    product: Product & {
        badge?: string
        badgeType?: "hot" | "bestseller" | "discount"
        originalPrice?: number
        rating?: number
        reviewCount?: number
    }
}

export function ProductCard({ product }: ProductCardProps) {
    const { addItem } = useCartStore()

    const getDeterministicReviewCount = (seed: string) => {
        let hash = 0
        for (let i = 0; i < seed.length; i += 1) {
            hash = (hash * 31 + seed.charCodeAt(i)) | 0
        }
        return 50 + (Math.abs(hash) % 300)
    }

    const getBadgeStyles = (type?: string) => {
        switch (type) {
            case "hot":
                return "bg-gradient-to-r from-red-500 to-orange-500 text-white"
            case "bestseller":
                return "bg-gradient-to-r from-[#7C3AED] to-[#7C3AED] text-white"
            case "discount":
                return "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
            default:
                return "bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white backdrop-blur-sm"
        }
    }

    const productImage = product.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80"
    const rating = product.rating || 4.8
    const reviewSeed = String(product.id ?? product.name ?? product.category ?? "product")
    const reviewCount = product.reviewCount ?? getDeterministicReviewCount(reviewSeed)

    const handleAddToCart = (e?: React.MouseEvent) => {
        e?.preventDefault()
        e?.stopPropagation()
        addItem(product)
        toast.success(
            <div className="flex items-start gap-3">
                <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gray-800 flex-shrink-0">
                    <Image src={productImage} alt={product.name} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 line-clamp-1">Added to cart</p>
                    <p className="text-xs text-gray-600 line-clamp-1">{product.name}</p>
                </div>
            </div>,
            {
                duration: 2000,
                className: "bg-white border border-gray-200 shadow-xl",
                icon: <Check className="w-5 h-5 text-emerald-500" />,
            }
        )
    }

    return (
        <div className="glass-card rounded-xl sm:rounded-2xl overflow-hidden flex flex-col h-full">
            {/* Product Image */}
            <Link href={`/ecommerce/products/${product.id}`} className="relative aspect-square overflow-hidden block">
                <Image
                    src={productImage}
                    alt={product.name}
                    fill
                    className="object-cover"
                    unoptimized
                />

                {/* Badge */}
                {product.badge && (
                    <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10">
                        <div className={cn(
                            "px-2 py-0.5 sm:px-3 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold shadow-lg",
                            getBadgeStyles(product.badgeType)
                        )}>
                            {product.badge}
                        </div>
                    </div>
                )}
            </Link>

            {/* Product Info */}
            <div className="p-2.5 sm:p-3 flex flex-col gap-0.5 sm:gap-1">
                {/* Category */}
                <p className="text-[10px] sm:text-xs uppercase tracking-wider font-semibold text-[#7C3AED]/80 dark:text-[#7C3AED]/80">
                    {product.category}
                </p>

                {/* Product Name */}
                <Link href={`/ecommerce/products/${product.id}`}>
                    <h3 className="font-medium text-xs sm:text-sm line-clamp-2 leading-tight text-gray-800 dark:text-white/85 hover:text-[#7C3AED] dark:hover:text-[#7C3AED] transition-colors cursor-pointer" style={{ minHeight: "2.5em" }}>
                        {product.name}
                    </h3>
                </Link>

                {/* Rating */}
                <div className="flex items-center gap-1 mt-0.5">
                    <div className="flex items-center gap-px">
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                className={cn(
                                    "w-3 h-3 sm:w-3.5 sm:h-3.5",
                                    i < Math.floor(rating)
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "fill-gray-200 dark:fill-white/10 text-gray-200 dark:text-white/10"
                                )}
                            />
                        ))}
                    </div>
                    <span className="text-[10px] sm:text-xs font-medium text-gray-400 dark:text-white/35">
                        ({reviewCount})
                    </span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1.5 mt-1 pt-1.5 border-t border-gray-100 dark:border-white/[0.06]">
                    <span className="text-sm sm:text-base font-black text-[#7C3AED] dark:text-[#7C3AED]">
                        ₱{product.price.toFixed(2)}
                    </span>
                    {product.originalPrice && (
                        <span className="text-[10px] sm:text-xs text-gray-400 dark:text-white/30 line-through">
                            ₱{product.originalPrice.toFixed(2)}
                        </span>
                    )}
                </div>

                {/* Add to Cart */}
                <button
                    onClick={() => handleAddToCart()}
                    className="w-full h-10 sm:h-11 rounded-lg text-xs sm:text-sm font-bold mt-1.5 transition-all active:scale-95 bg-[#7C3AED] hover:bg-[#6D28D9] dark:bg-[#7C3AED] dark:hover:bg-[#6D28D9] text-white dark:text-[#110228] flex items-center justify-center gap-1.5"
                >
                    <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Add to Cart
                </button>
            </div>
        </div>
    )
}
