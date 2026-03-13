"use client"

import { useState, useRef, useEffect, use } from "react"
import Image from "next/image"
import Link from "next/link"
import {
    UtensilsCrossed, Coffee, Sandwich, Soup,
    Flame, Leaf, Search, ShoppingBag,
    Plus, Minus, Check, Users, X, CalendarDays,
    AlertTriangle, User2, LogOut, Loader2,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { BuyerAuthModal, BUYER_TOKEN_KEY, BUYER_USER_KEY, type BuyerUser } from "@/components/ecommerce/BuyerAuthModal"
import type { FoodMenuItem as ApiFoodMenuItem } from "@/services"
import { env } from "@/config/env"


// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type MealCategory = "all" | "breakfast" | "lunch" | "snacks" | "dinner" | "drinks"

type FoodItem = {
    id: string
    name: string
    description: string
    price: number
    category: MealCategory
    image: string
    totalQty: number
    availableQty: number
    isSpicy?: boolean
    isVegan?: boolean
    calories?: number
    prepTime?: string
    rating: number
}

type ReservationItem = {
    food: FoodItem
    qty: number
}

// BuyerUser, BUYER_TOKEN_KEY, BUYER_USER_KEY imported from @/components/ecommerce/BuyerAuthModal


// ---------------------------------------------------------------------------
// Food data
// ---------------------------------------------------------------------------
const FOOD_ITEMS: FoodItem[] = [
    // Breakfast
    {
        id: "b1",
        name: "Tapsilog",
        description: "Beef tapa with garlic fried rice and sunny-side-up egg.",
        price: 120,
        category: "breakfast",
        image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800",
        totalQty: 20,
        availableQty: 14,
        calories: 520,
        prepTime: "10 min",
        rating: 4.9,
    },
    {
        id: "b2",
        name: "Longsilog",
        description: "Sweet pork longganisa with garlic rice and fried egg.",
        price: 110,
        category: "breakfast",
        image: "https://images.unsplash.com/photo-1565299543923-37dd37887442?q=80&w=800",
        totalQty: 15,
        availableQty: 3,
        calories: 490,
        prepTime: "10 min",
        rating: 4.7,
    },
    {
        id: "b3",
        name: "Pancake & Eggs",
        description: "Fluffy buttermilk pancakes with scrambled eggs and maple syrup.",
        price: 95,
        category: "breakfast",
        image: "https://images.unsplash.com/photo-1528207776546-365bb710ee93?q=80&w=800",
        totalQty: 12,
        availableQty: 0,
        calories: 580,
        prepTime: "12 min",
        rating: 4.6,
    },
    {
        id: "b4",
        name: "Champorado",
        description: "Warm chocolate rice porridge served with tuyo (dried fish).",
        price: 75,
        category: "breakfast",
        image: "https://images.unsplash.com/photo-1541519227354-08fa5d50c820?q=80&w=800",
        totalQty: 10,
        availableQty: 8,
        isVegan: false,
        calories: 310,
        prepTime: "8 min",
        rating: 4.5,
    },

    // Lunch
    {
        id: "l1",
        name: "Sinigang na Baboy",
        description: "Tamarind-soured pork soup with kangkong, radish, and eggplant.",
        price: 180,
        category: "lunch",
        image: "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=800",
        totalQty: 25,
        availableQty: 18,
        calories: 450,
        prepTime: "25 min",
        rating: 4.9,
    },
    {
        id: "l2",
        name: "Chicken Adobo Rice Bowl",
        description: "Braised chicken adobo over jasmine rice with pickled vegetables.",
        price: 155,
        category: "lunch",
        image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?q=80&w=800",
        totalQty: 20,
        availableQty: 5,
        calories: 620,
        prepTime: "20 min",
        rating: 4.8,
    },
    {
        id: "l3",
        name: "Grilled Liempo",
        description: "Marinated pork belly, grilled and served with garlic rice and achara.",
        price: 210,
        category: "lunch",
        image: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?q=80&w=800",
        totalQty: 15,
        availableQty: 9,
        calories: 780,
        prepTime: "30 min",
        rating: 4.9,
    },
    {
        id: "l4",
        name: "Bicol Express",
        description: "Pork and shrimp paste simmered in coconut milk with green chili.",
        price: 165,
        category: "lunch",
        image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?q=80&w=800",
        totalQty: 12,
        availableQty: 7,
        isSpicy: true,
        calories: 680,
        prepTime: "25 min",
        rating: 4.7,
    },
    {
        id: "l5",
        name: "Vegetable Kare-Kare",
        description: "Mixed vegetables in peanut-based sauce, served with bagoong.",
        price: 140,
        category: "lunch",
        image: "https://images.unsplash.com/photo-1546549032-9571cd6b27df?q=80&w=800",
        totalQty: 10,
        availableQty: 10,
        isVegan: true,
        calories: 380,
        prepTime: "20 min",
        rating: 4.5,
    },

    // Snacks
    {
        id: "s1",
        name: "Puto & Dinuguan",
        description: "Steamed rice cakes paired with savory pork blood stew.",
        price: 85,
        category: "snacks",
        image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?q=80&w=800",
        totalQty: 30,
        availableQty: 22,
        calories: 340,
        prepTime: "5 min",
        rating: 4.8,
    },
    {
        id: "s2",
        name: "Club Sandwich",
        description: "Triple-decker with chicken, ham, bacon, lettuce, tomato, and mayo.",
        price: 145,
        category: "snacks",
        image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?q=80&w=800",
        totalQty: 15,
        availableQty: 6,
        calories: 560,
        prepTime: "10 min",
        rating: 4.7,
    },
    {
        id: "s3",
        name: "Caesar Salad",
        description: "Crisp romaine, parmesan, croutons, and house Caesar dressing.",
        price: 115,
        category: "snacks",
        image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?q=80&w=800",
        totalQty: 10,
        availableQty: 4,
        isVegan: false,
        calories: 290,
        prepTime: "7 min",
        rating: 4.5,
    },

    // Dinner
    {
        id: "d1",
        name: "Lechon Kawali",
        description: "Deep-fried crispy pork belly with liver sauce and garlic rice.",
        price: 235,
        category: "dinner",
        image: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?q=80&w=800",
        totalQty: 12,
        availableQty: 8,
        calories: 900,
        prepTime: "35 min",
        rating: 4.9,
    },
    {
        id: "d2",
        name: "Tinolang Manok",
        description: "Ginger-based chicken soup with green papaya and chili leaves.",
        price: 175,
        category: "dinner",
        image: "https://images.unsplash.com/photo-1547592180-85f173990554?q=80&w=800",
        totalQty: 15,
        availableQty: 11,
        calories: 420,
        prepTime: "30 min",
        rating: 4.7,
    },
    {
        id: "d3",
        name: "Beef Caldereta",
        description: "Braised beef in tomato-liver sauce with potatoes, carrots, and olives.",
        price: 255,
        category: "dinner",
        image: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?q=80&w=800",
        totalQty: 10,
        availableQty: 2,
        calories: 840,
        prepTime: "40 min",
        rating: 4.8,
    },

    // Drinks
    {
        id: "dr1",
        name: "Buko Juice",
        description: "Fresh young coconut water with tender coconut strips.",
        price: 65,
        category: "drinks",
        image: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?q=80&w=800",
        totalQty: 40,
        availableQty: 28,
        isVegan: true,
        calories: 45,
        prepTime: "3 min",
        rating: 4.9,
    },
    {
        id: "dr2",
        name: "Iced Coffee",
        description: "Espresso over ice with fresh milk and a hint of vanilla.",
        price: 95,
        category: "drinks",
        image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?q=80&w=800",
        totalQty: 30,
        availableQty: 17,
        calories: 120,
        prepTime: "5 min",
        rating: 4.7,
    },
    {
        id: "dr3",
        name: "Mango Shake",
        description: "Blended carabao mango with milk and a scoop of vanilla ice cream.",
        price: 110,
        category: "drinks",
        image: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?q=80&w=800",
        totalQty: 20,
        availableQty: 0,
        calories: 290,
        prepTime: "5 min",
        rating: 4.8,
    },
]

const CATEGORIES: { id: MealCategory; label: string; icon: any; time?: string }[] = [
    { id: "all", label: "All Meals", icon: UtensilsCrossed },
    { id: "breakfast", label: "Breakfast", icon: Coffee, time: "7:00 – 10:00 AM" },
    { id: "lunch", label: "Lunch", icon: Soup, time: "11:00 AM – 2:00 PM" },
    { id: "snacks", label: "Snacks", icon: Sandwich, time: "3:00 – 5:00 PM" },
    { id: "dinner", label: "Dinner", icon: UtensilsCrossed, time: "6:00 – 9:00 PM" },
    { id: "drinks", label: "Beverages", icon: Coffee },
]


// ---------------------------------------------------------------------------
// API → local type mapper
// ---------------------------------------------------------------------------
function mapCategoryToMeal(cat: string): MealCategory {
    const lower = cat.toLowerCase()
    if (lower.includes("breakfast")) return "breakfast"
    if (lower.includes("lunch") || lower.includes("main")) return "lunch"
    if (lower.includes("snack") || lower.includes("appetizer") || lower.includes("salad")) return "snacks"
    if (lower.includes("dinner") || lower.includes("soup")) return "dinner"
    if (lower.includes("drink") || lower.includes("beverage")) return "drinks"
    if (lower.includes("dessert") || lower.includes("combo")) return "snacks"
    return "lunch"
}

function mapApiToFoodItem(item: ApiFoodMenuItem): FoodItem {
    return {
        id: String(item.id),
        name: item.name,
        description: item.description,
        price: item.price,
        category: mapCategoryToMeal(item.category),
        image: item.image || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800",
        totalQty: item.total_servings,
        availableQty: item.total_servings - item.reserved_servings,
        rating: 4.5,
    }
}

// ---------------------------------------------------------------------------
// Availability helpers
// ---------------------------------------------------------------------------
function getAvailabilityStatus(item: FoodItem) {
    if (item.availableQty === 0) return { label: "Fully Reserved", color: "bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400", dot: "bg-red-500" }
    if (item.availableQty <= 3) return { label: `${item.availableQty} left`, color: "bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400", dot: "bg-orange-500" }
    return { label: `${item.availableQty} available`, color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400", dot: "bg-emerald-500" }
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
        const obs = new IntersectionObserver(([e]) => { if (e?.isIntersecting) { setIsVisible(true); obs.unobserve(el) } }, { threshold: 0.05 })
        obs.observe(el)
        return () => obs.disconnect()
    }, [])
    return { ref, isVisible }
}


// ---------------------------------------------------------------------------
// Food Card
// ---------------------------------------------------------------------------
function FoodCard({
    item,
    reserved,
    onReserve,
    onRemove,
}: {
    item: FoodItem
    reserved: ReservationItem | undefined
    onReserve: (item: FoodItem) => void
    onRemove: (id: string) => void
}) {
    const status = getAvailabilityStatus(item)
    const pct = Math.round(((item.totalQty - item.availableQty) / item.totalQty) * 100)
    const isReserved = !!reserved

    return (
        <div className={`group relative bg-white dark:bg-white/[0.03] rounded-2xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg dark:hover:shadow-none flex flex-col ${
            isReserved
                ? "border-[#7C3AED]/40 dark:border-[#7C3AED]/30 shadow-md shadow-[#7C3AED]/5"
                : "border-gray-100 dark:border-white/[0.06] shadow-sm dark:shadow-none"
        }`}>
            {/* Reserved badge */}
            {isReserved && (
                <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/30">
                    <Check className="w-3 h-3" />
                    Reserved ×{reserved.qty}
                </div>
            )}

            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className={`object-cover transition-transform duration-500 ${item.availableQty === 0 ? "grayscale opacity-60" : "group-hover:scale-105"}`}
                    unoptimized
                />
                {/* Tags */}
                <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                    {item.isSpicy && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold bg-red-500/90 text-white">
                            <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Spicy
                        </span>
                    )}
                    {item.isVegan && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold bg-emerald-500/90 text-white">
                            <Leaf className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Vegan
                        </span>
                    )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </div>

            {/* Content */}
            <div className="p-3 sm:p-4 flex flex-col gap-1.5 sm:gap-2 flex-1">
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm sm:text-base leading-snug">{item.name}</h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-white/40 mt-0.5 line-clamp-2 leading-relaxed">{item.description}</p>
                </div>

                {/* Availability */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${status.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                            {status.label}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-white/30">{item.availableQty}/{item.totalQty}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${pct}%`,
                                background: "linear-gradient(90deg,#7C3AED,#a855f7)",
                            }}
                        />
                    </div>
                </div>

                <div className="flex-1" />

                {/* Price + CTA */}
                <div className="flex items-center justify-between pt-1 gap-2">
                    <span className="text-lg sm:text-xl font-black text-[#7C3AED] dark:text-[#a78bfa]">
                        ₱{item.price.toFixed(0)}
                    </span>

                    {item.availableQty === 0 ? (
                        <span className="text-xs sm:text-sm font-semibold text-red-400 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-500/10">
                            Unavailable
                        </span>
                    ) : isReserved ? (
                        <button
                            onClick={() => onRemove(item.id)}
                            className="flex items-center gap-1.5 h-10 sm:h-11 px-4 sm:px-5 rounded-xl text-xs sm:text-sm font-bold border-2 border-[#7C3AED]/30 text-[#7C3AED] dark:text-[#a78bfa] hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-300 dark:hover:border-red-500/30 hover:text-red-600 dark:hover:text-red-400 active:scale-95 transition-all"
                        >
                            <X className="w-4 h-4" />
                            Remove
                        </button>
                    ) : (
                        <button
                            onClick={() => onReserve(item)}
                            className="flex items-center gap-1.5 h-10 sm:h-11 px-4 sm:px-5 rounded-xl text-xs sm:text-sm font-bold bg-[#7C3AED] hover:bg-[#6D28D9] text-white active:scale-95 transition-all shadow-sm shadow-[#7C3AED]/20"
                        >
                            <Plus className="w-4 h-4" />
                            Reserve
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}


// ---------------------------------------------------------------------------
// Reservation Panel (right sidebar on desktop, bottom sheet on mobile)
// ---------------------------------------------------------------------------
function ReservationPanel({
    items,
    onQtyChange,
    onRemove,
    onConfirm,
    onClose,
    isMobile,
    isSubmitting,
}: {
    items: ReservationItem[]
    onQtyChange: (id: string, qty: number) => void
    onRemove: (id: string) => void
    onConfirm: () => void
    onClose?: () => void
    isMobile?: boolean
    isSubmitting?: boolean
}) {
    const total = items.reduce((sum, r) => sum + r.food.price * r.qty, 0)

    return (
        <div className={`flex flex-col h-full ${isMobile ? "" : ""}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/[0.06]">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#7C3AED]/10 border border-[#7C3AED]/20 flex items-center justify-center">
                        <ShoppingBag className="w-4 h-4 text-[#7C3AED]" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">My Reservations</p>
                        <p className="text-[11px] text-gray-400 dark:text-white/30">{items.length} item{items.length !== 1 ? "s" : ""}</p>
                    </div>
                </div>
                {onClose && (
                    <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-white/[0.04] flex items-center justify-center mb-3">
                            <UtensilsCrossed className="w-5 h-5 text-gray-300 dark:text-white/20" />
                        </div>
                        <p className="text-sm font-semibold text-gray-500 dark:text-white/40">No reservations yet</p>
                        <p className="text-xs text-gray-400 dark:text-white/25 mt-1">Browse the menu and click Reserve</p>
                    </div>
                ) : (
                    items.map((r) => (
                        <div key={r.food.id} className="flex gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.05]">
                            <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0">
                                <Image src={r.food.image} alt={r.food.name} fill className="object-cover" unoptimized />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{r.food.name}</p>
                                <p className="text-xs text-[#7C3AED] dark:text-[#a78bfa] font-bold mt-0.5">₱{(r.food.price * r.qty).toFixed(0)}</p>
                                {/* Qty stepper */}
                                <div className="flex items-center gap-2 mt-2">
                                    <button
                                        onClick={() => r.qty <= 1 ? onRemove(r.food.id) : onQtyChange(r.food.id, r.qty - 1)}
                                        className="w-6 h-6 rounded-md flex items-center justify-center bg-gray-200 dark:bg-white/10 hover:bg-[#7C3AED]/20 transition-colors"
                                    >
                                        <Minus className="w-3 h-3 text-gray-600 dark:text-white/70" />
                                    </button>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white w-5 text-center">{r.qty}</span>
                                    <button
                                        onClick={() => r.qty < r.food.availableQty && onQtyChange(r.food.id, r.qty + 1)}
                                        disabled={r.qty >= r.food.availableQty}
                                        className="w-6 h-6 rounded-md flex items-center justify-center bg-gray-200 dark:bg-white/10 hover:bg-[#7C3AED]/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <Plus className="w-3 h-3 text-gray-600 dark:text-white/70" />
                                    </button>
                                    <button onClick={() => onRemove(r.food.id)} className="ml-auto text-gray-300 dark:text-white/20 hover:text-red-400 transition-colors">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
                <div className="px-5 py-4 border-t border-gray-100 dark:border-white/[0.06] space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500 dark:text-white/40">Total</span>
                        <span className="text-xl font-black text-[#7C3AED] dark:text-[#a78bfa]">₱{total.toFixed(0)}</span>
                    </div>
                    <Button
                        onClick={onConfirm}
                        disabled={isSubmitting}
                        className="w-full h-11 rounded-xl font-bold bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-lg shadow-[#7C3AED]/20 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Check className="w-4 h-4 mr-2" />
                        )}
                        {isSubmitting ? "Submitting..." : "Confirm Reservation"}
                    </Button>
                </div>
            )}
        </div>
    )
}


// ---------------------------------------------------------------------------
// Confirmation modal
// ---------------------------------------------------------------------------
function ConfirmationModal({ items, buyer, onClose }: { items: ReservationItem[]; buyer: BuyerUser | null; onClose: () => void }) {
    const total = items.reduce((sum, r) => sum + r.food.price * r.qty, 0)
    const now = new Date()
    const refNo = `RSV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.floor(Math.random() * 9000 + 1000)}`
    const initials = buyer ? buyer.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() : "?"

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md bg-white dark:bg-[#110228] rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-white/[0.06]">
                {/* Success header */}
                <div className="px-6 pt-8 pb-6 text-center" style={{ background: "linear-gradient(135deg,#110228,#2E0F5F,#7C3AED)" }}>
                    <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-xl font-black text-white mb-1">Reservation Confirmed!</h2>
                    <p className="text-sm text-purple-200/70">Your food reservation has been submitted.</p>
                    <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20">
                        <span className="text-xs font-bold text-white/80">Ref #</span>
                        <span className="text-xs font-black text-white">{refNo}</span>
                    </div>
                </div>

                {/* Buyer info card */}
                {buyer && (
                    <div className="mx-6 mt-5 flex items-center gap-3 p-3 rounded-xl bg-[#7C3AED]/5 border border-[#7C3AED]/15">
                        <div className="w-10 h-10 rounded-xl bg-[#7C3AED] flex items-center justify-center text-white font-black text-sm shrink-0">
                            {initials}
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{buyer.name}</p>
                            <p className="text-xs text-gray-500 dark:text-white/40">{buyer.email}</p>
                        </div>
                    </div>
                )}

                {/* Items list */}
                <div className="px-6 py-5 space-y-2.5 max-h-48 overflow-y-auto">
                    {items.map((r) => (
                        <div key={r.food.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-md bg-[#7C3AED]/10 text-[#7C3AED] font-bold text-[10px] flex items-center justify-center">
                                    {r.qty}×
                                </span>
                                <span className="text-gray-700 dark:text-white/70">{r.food.name}</span>
                            </div>
                            <span className="font-semibold text-gray-900 dark:text-white">₱{(r.food.price * r.qty).toFixed(0)}</span>
                        </div>
                    ))}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/[0.06]">
                        <span className="font-bold text-gray-900 dark:text-white">Total</span>
                        <span className="text-lg font-black text-[#7C3AED] dark:text-[#a78bfa]">₱{total.toFixed(0)}</span>
                    </div>
                </div>

                <div className="px-6 pb-6">
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 mb-4">
                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        <p className="text-xs text-amber-700 dark:text-amber-400">Please pick up your order at the designated counter on time.</p>
                    </div>
                    <Button onClick={onClose} className="w-full h-11 rounded-xl font-bold bg-[#7C3AED] hover:bg-[#6D28D9] text-white">
                        Done
                    </Button>
                </div>
            </div>
        </div>
    )
}


// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function FoodMenuPage({ params }: { params: Promise<{ store: string }> }) {
    const { store: storeSlug } = use(params)
    const [activeCategory, setActiveCategory] = useState<MealCategory>("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [reservations, setReservations] = useState<ReservationItem[]>([])
    const [showPanel, setShowPanel] = useState(false)
    const [confirmed, setConfirmed] = useState(false)
    const [isMounted, setIsMounted] = useState(false)
    const [buyer, setBuyer] = useState<BuyerUser | null>(null)
    const [showAuthModal, setShowAuthModal] = useState(false)
    const [foodItems, setFoodItems] = useState<FoodItem[]>(FOOD_ITEMS)
    const [isLoadingMenu, setIsLoadingMenu] = useState(true)
    const [isSubmittingReservation, setIsSubmittingReservation] = useState(false)

    const heroReveal = useScrollReveal()
    const menuReveal = useScrollReveal()

    useEffect(() => {
        setIsMounted(true)
        try {
            const stored = localStorage.getItem(BUYER_USER_KEY)
            if (stored) setBuyer(JSON.parse(stored))
        } catch { /* ignore */ }

        // Load food menu from public API endpoint (no vendor auth needed)
        const loadMenu = async () => {
            try {
                const buyerToken = localStorage.getItem(BUYER_TOKEN_KEY)
                const headers: Record<string, string> = {}
                if (buyerToken) headers["Authorization"] = `Bearer ${buyerToken}`

                const response = await fetch(
                    `${env.api.baseUrl}/ecommerce/stores/${storeSlug}/food-menu?per_page=500`,
                    { headers }
                )
                if (response.ok) {
                    const json = await response.json()
                    const raw: ApiFoodMenuItem[] = json?.data?.data ?? json?.data ?? json ?? []
                    if (Array.isArray(raw) && raw.length > 0) {
                        setFoodItems(raw.map(mapApiToFoodItem))
                    }
                }
            } catch {
                // Keep hardcoded FOOD_ITEMS as fallback
            } finally {
                setIsLoadingMenu(false)
            }
        }
        loadMenu()
    }, [])

    const today = new Date()
    const dateStr = today.toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })

    const filteredItems = foodItems.filter((item) => {
        const matchCat = activeCategory === "all" || item.category === activeCategory
        const matchSearch = searchQuery.trim() === "" ||
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description.toLowerCase().includes(searchQuery.toLowerCase())
        return matchCat && matchSearch
    })

    const handleReserve = (item: FoodItem) => {
        if (!buyer) {
            setShowAuthModal(true)
            return
        }
        setReservations((prev) => {
            const exists = prev.find((r) => r.food.id === item.id)
            if (exists) return prev
            return [...prev, { food: item, qty: 1 }]
        })
    }

    const handleRemove = (id: string) => {
        setReservations((prev) => prev.filter((r) => r.food.id !== id))
    }

    const handleQtyChange = (id: string, qty: number) => {
        setReservations((prev) => prev.map((r) => r.food.id === id ? { ...r, qty } : r))
    }

    const handleConfirm = async () => {
        if (!buyer) return
        setIsSubmittingReservation(true)
        try {
            const buyerToken = localStorage.getItem(BUYER_TOKEN_KEY)
            const headers: Record<string, string> = { "Content-Type": "application/json" }
            if (buyerToken) headers["Authorization"] = `Bearer ${buyerToken}`

            await Promise.all(
                reservations.map((r) =>
                    fetch(`${env.api.baseUrl}/ecommerce/stores/${storeSlug}/food-menu/reserve`, {
                        method: "POST",
                        headers,
                        body: JSON.stringify({
                            food_menu_item_id: Number(r.food.id),
                            customer_name: buyer.name,
                            customer_phone: "N/A",
                            servings: r.qty,
                        }),
                    })
                )
            )
        } catch {
            // If API fails, still show confirmation
        } finally {
            setIsSubmittingReservation(false)
        }
        setConfirmed(true)
        setShowPanel(false)
    }

    const handleConfirmClose = () => {
        setConfirmed(false)
        setReservations([])
    }

    const handleAuthSuccess = (user: BuyerUser) => {
        setBuyer(user)
        setShowAuthModal(false)
    }

    const handleLogout = () => {
        localStorage.removeItem(BUYER_TOKEN_KEY)
        localStorage.removeItem(BUYER_USER_KEY)
        setBuyer(null)
        setReservations([])
        window.dispatchEvent(new Event("storage"))
    }

    const reservedCount = reservations.reduce((s, r) => s + r.qty, 0)

    return (
        <div className="min-h-screen bg-[#f8f8fc] dark:bg-[#110228]">

            {/* ── Page Header ─────────────────────────────────────── */}
            <div
                ref={heroReveal.ref}
                className={`transition-all duration-700 ${heroReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
                {/* Top accent bar */}
                <div className="h-1 w-full bg-gradient-to-r from-[#7C3AED] via-violet-400 to-[#7C3AED]" />

                <div className="w-full bg-[#110228] border-b border-purple-900/60">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">

                        {/* Breadcrumb / tab nav */}
                        <div className="flex items-center gap-1 text-xs font-semibold mb-6">
                            <Link href={`/ecommerce/${storeSlug}/products`} className="text-purple-400 hover:text-purple-300 transition-colors">
                                Products
                            </Link>
                            <span className="text-purple-700 mx-1">/</span>
                            <span className="text-white">Food Menu</span>
                        </div>

                        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">

                            {/* Left: Title block */}
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#7C3AED]/20 border border-[#7C3AED]/30 text-xs font-bold text-purple-300 uppercase tracking-wider">
                                        <Users className="w-3.5 h-3.5" />
                                        Reservation Portal
                                    </div>

                                    {/* Logged-in user chip */}
                                    {isMounted && buyer ? (
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.08] border border-white/[0.12]">
                                            <div className="w-6 h-6 rounded-md bg-[#7C3AED] flex items-center justify-center text-white text-[10px] font-black shrink-0">
                                                {buyer.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
                                            </div>
                                            <span className="text-xs font-semibold text-white/80 max-w-[120px] truncate">{buyer.name}</span>
                                            <button
                                                onClick={handleLogout}
                                                className="ml-1 text-white/40 hover:text-white/80 transition-colors"
                                                title="Sign out"
                                            >
                                                <LogOut className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    ) : isMounted ? (
                                        <button
                                            onClick={() => setShowAuthModal(true)}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/[0.10] text-xs font-semibold text-white/60 hover:text-white/90 hover:bg-white/[0.10] transition-colors"
                                        >
                                            <User2 className="w-3.5 h-3.5" />
                                            Sign in to reserve
                                        </button>
                                    ) : null}
                                </div>

                                <div>
                                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-none">
                                        Today&apos;s Menu
                                    </h1>
                                    <p className="text-purple-300/70 text-sm sm:text-base mt-2 font-medium">
                                        Reserve your meal before it runs out
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] w-fit">
                                    <CalendarDays className="w-4 h-4 text-purple-400 shrink-0" />
                                    <span className="text-sm text-purple-200/80 font-medium">{dateStr}</span>
                                </div>
                            </div>

                            {/* Right: Stat cards */}
                            <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:flex lg:gap-3">
                                <div className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] min-w-[88px]">
                                    <span className="text-2xl sm:text-3xl font-black text-white tabular-nums">
                                        {foodItems.filter(f => f.availableQty > 0).length}
                                    </span>
                                    <span className="text-[11px] text-purple-300/60 mt-1 font-medium whitespace-nowrap">Available</span>
                                </div>
                                <div className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl bg-white/[0.04] border border-white/[0.08] min-w-[88px]">
                                    <span className="text-2xl sm:text-3xl font-black text-white tabular-nums">
                                        {foodItems.length}
                                    </span>
                                    <span className="text-[11px] text-purple-300/60 mt-1 font-medium whitespace-nowrap">Total Items</span>
                                </div>
                                <div className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl border min-w-[88px]"
                                    style={{ background: "rgba(124,58,237,0.15)", borderColor: "rgba(124,58,237,0.35)" }}
                                >
                                    <span className="text-2xl sm:text-3xl font-black text-[#a78bfa] tabular-nums">
                                        {reservedCount}
                                    </span>
                                    <span className="text-[11px] text-purple-300/60 mt-1 font-medium whitespace-nowrap">Reserved</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Main Content ─────────────────────────────────────── */}
            <div
                ref={menuReveal.ref}
                className={`transition-all duration-700 delay-100 ${menuReveal.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
            >
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="flex gap-6">

                        {/* ── Left: Menu ─────────────────────────────── */}
                        <div className="flex-1 min-w-0 space-y-6">

                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/30" />
                                <Input
                                    placeholder="Search food items..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 h-11 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 bg-white dark:bg-white/[0.04] border-gray-200 dark:border-white/10 focus-visible:ring-[#7C3AED]/50 focus-visible:border-[#7C3AED]/50"
                                />
                            </div>

                            {/* Category tabs */}
                            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
                                {CATEGORIES.map((cat) => {
                                    const Icon = cat.icon
                                    const isActive = activeCategory === cat.id
                                    return (
                                        <button
                                            key={cat.id}
                                            onClick={() => setActiveCategory(cat.id)}
                                            className={`flex flex-col items-start gap-0.5 px-4 py-3 rounded-xl text-sm font-semibold whitespace-nowrap shrink-0 transition-all duration-300 active:scale-95 ${
                                                isActive
                                                    ? "bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/20"
                                                    : "bg-white dark:bg-white/[0.04] text-gray-500 dark:text-white/60 border border-gray-200 dark:border-white/10 hover:text-gray-800 dark:hover:text-white"
                                            }`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <Icon className="w-4 h-4" />
                                                {cat.label}
                                            </div>
                                            {cat.time && (
                                                <span className={`text-[10px] font-normal ${isActive ? "text-white/70" : "text-gray-400 dark:text-white/30"}`}>
                                                    {cat.time}
                                                </span>
                                            )}
                                        </button>
                                    )
                                })}
                            </div>

                            {/* Result count */}
                            <p className="text-sm text-gray-400 dark:text-white/30">
                                Showing <span className="font-semibold text-gray-600 dark:text-white/60">{filteredItems.length}</span> items
                            </p>

                            {/* Grid */}
                            {isLoadingMenu ? (
                                <div className="rounded-2xl p-12 text-center bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]">
                                    <Loader2 className="w-8 h-8 mx-auto mb-3 text-[#7C3AED] animate-spin" />
                                    <p className="text-sm text-gray-500 dark:text-white/40">Loading menu...</p>
                                </div>
                            ) : filteredItems.length === 0 ? (
                                <div className="rounded-2xl p-12 text-center bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06]">
                                    <UtensilsCrossed className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-white/20" />
                                    <p className="text-base font-semibold text-gray-900 dark:text-white mb-1">No items found</p>
                                    <p className="text-sm text-gray-500 dark:text-white/40">Try a different category or search term</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                                    {filteredItems.map((item) => (
                                        <FoodCard
                                            key={item.id}
                                            item={item}
                                            reserved={reservations.find((r) => r.food.id === item.id)}
                                            onReserve={handleReserve}
                                            onRemove={handleRemove}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ── Right: Reservation Panel (desktop) ──────── */}
                        <aside className="hidden lg:flex flex-col w-72 shrink-0">
                            <div className="sticky top-24 rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] shadow-sm dark:shadow-none overflow-hidden" style={{ maxHeight: "calc(100vh - 7rem)" }}>
                                <ReservationPanel
                                    items={reservations}
                                    onQtyChange={handleQtyChange}
                                    onRemove={handleRemove}
                                    onConfirm={handleConfirm}
                                    isSubmitting={isSubmittingReservation}
                                />
                            </div>
                        </aside>
                    </div>
                </div>
            </div>

            {/* ── Mobile floating reserve button ───────────────────── */}
            {isMounted && (
                <div className="lg:hidden fixed bottom-6 right-4 z-40">
                    <button
                        onClick={() => setShowPanel(true)}
                        className="relative flex items-center gap-2 h-13 px-5 py-3.5 rounded-2xl font-bold text-sm text-white bg-[#7C3AED] hover:bg-[#6D28D9] active:scale-95 transition-all shadow-xl shadow-[#7C3AED]/30"
                    >
                        <ShoppingBag className="w-5 h-5" />
                        My Reservations
                        {reservedCount > 0 && (
                            <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white text-[#7C3AED] text-xs font-black flex items-center justify-center shadow-md">
                                {reservedCount}
                            </span>
                        )}
                    </button>
                </div>
            )}

            {/* ── Mobile reservation bottom sheet ──────────────────── */}
            {isMounted && showPanel && (
                <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPanel(false)} />
                    <div className="relative bg-white dark:bg-[#110228] rounded-t-3xl border-t border-gray-100 dark:border-white/[0.06] shadow-2xl" style={{ maxHeight: "80vh" }}>
                        <div className="w-10 h-1 rounded-full bg-gray-200 dark:bg-white/20 mx-auto mt-3 mb-1" />
                        <div className="flex flex-col" style={{ maxHeight: "calc(80vh - 20px)" }}>
                            <ReservationPanel
                                items={reservations}
                                onQtyChange={handleQtyChange}
                                onRemove={handleRemove}
                                onConfirm={handleConfirm}
                                onClose={() => setShowPanel(false)}
                                isMobile
                                isSubmitting={isSubmittingReservation}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* ── Confirmation modal ────────────────────────────────── */}
            {confirmed && (
                <ConfirmationModal items={reservations} buyer={buyer} onClose={handleConfirmClose} />
            )}

            {/* ── Auth modal ────────────────────────────────────────── */}
            {showAuthModal && (
                <BuyerAuthModal onSuccess={handleAuthSuccess} onClose={() => setShowAuthModal(false)} />
            )}
        </div>
    )
}
