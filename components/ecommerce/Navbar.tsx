"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { ShoppingBag, Sun, Moon, UtensilsCrossed, User2, LogOut, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCartStore } from "@/store/useCartStore"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { BuyerAuthModal, BUYER_TOKEN_KEY, BUYER_USER_KEY, type BuyerUser } from "@/components/ecommerce/BuyerAuthModal"

export function Navbar() {
    const pathname = usePathname()
    const { items, setOpen } = useCartStore()
    const { setTheme, resolvedTheme } = useTheme()
    const [isScrolled, setIsScrolled] = useState(false)
    const [isMounted, setIsMounted] = useState(false)
    const [buyer, setBuyer] = useState<BuyerUser | null>(null)
    const [showAuthModal, setShowAuthModal] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const cartCount = items.length

    useEffect(() => {
        setIsMounted(true)
        try {
            const stored = localStorage.getItem(BUYER_USER_KEY)
            if (stored) setBuyer(JSON.parse(stored))
        } catch { /* ignore */ }
    }, [])

    // Listen for storage changes (login/logout from the food-menu page)
    useEffect(() => {
        const onStorage = () => {
            try {
                const stored = localStorage.getItem(BUYER_USER_KEY)
                setBuyer(stored ? JSON.parse(stored) : null)
            } catch { setBuyer(null) }
        }
        window.addEventListener("storage", onStorage)
        const interval = setInterval(onStorage, 1000)
        return () => {
            window.removeEventListener("storage", onStorage)
            clearInterval(interval)
        }
    }, [])

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false)
    }, [pathname])

    const handleLogout = () => {
        localStorage.removeItem(BUYER_TOKEN_KEY)
        localStorage.removeItem(BUYER_USER_KEY)
        setBuyer(null)
        window.dispatchEvent(new Event("storage"))
    }

    const handleAuthSuccess = (user: BuyerUser) => {
        setBuyer(user)
        setShowAuthModal(false)
    }

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 0)
        }
        window.addEventListener("scroll", handleScroll)
        return () => window.removeEventListener("scroll", handleScroll)
    }, [])

    const toggleTheme = () => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark")
    }

    // Extract store code from current URL path (e.g. /ecommerce/MAIN/products → MAIN)
    const pathSegments = pathname.split("/")
    const storeCode = pathSegments[2] || "store"

    const navLinks = [
        { href: `/ecommerce/${storeCode}/products`, label: "Shop", icon: null },
        { href: `/ecommerce/${storeCode}/food-menu`, label: "Food Menu", icon: UtensilsCrossed },
    ]

    return (
        <>
        <header
            className={`sticky top-0 z-50 w-full transition-all duration-300 ${
                isScrolled ? "backdrop-blur-xl shadow-md border-b" : "backdrop-blur-sm border-b"
            }`}
            style={{
                backgroundColor: '#110228',
                borderBottomColor: isScrolled ? '#7C3AED' : '#1a0440'
            }}
        >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
                <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20">

                    {/* Left: Hamburger (mobile) + Logo */}
                    <div className="flex items-center gap-3 sm:gap-10 lg:gap-14">
                        {/* Hamburger - mobile only */}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="sm:hidden h-10 w-10 rounded-full text-white hover:bg-white/10"
                            aria-label="Toggle menu"
                        >
                            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </Button>

                        <Link href={`/ecommerce/${storeCode}/products`} className="flex items-center">
                            <Image
                                src="/new-logo/website logo white.png"
                                alt="Vendora"
                                width={120}
                                height={36}
                                className="h-7 sm:h-8 w-auto object-contain"
                                priority
                            />
                        </Link>

                        {/* Desktop nav links - hidden on mobile */}
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="hidden sm:flex items-center gap-1.5 text-sm font-medium relative py-1 transition-all text-white hover:text-white/80"
                            >
                                {link.icon && <link.icon className="w-4 h-4" />}
                                {link.label}
                                <span
                                    className="absolute left-0 bottom-0 h-0.5 rounded-full transition-all duration-300"
                                    style={{
                                        backgroundColor: '#7C3AED',
                                        width: pathname === link.href ? '100%' : '0',
                                    }}
                                />
                            </Link>
                        ))}
                    </div>

                    {/* Right: User + Theme Toggle + Cart */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        {/* User Icon / Authenticated User Dropdown */}
                        {isMounted && (
                            buyer ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded-full bg-white/[0.08] border border-white/[0.12] hover:bg-white/[0.14] transition-colors outline-none">
                                            <div
                                                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-black shrink-0"
                                                style={{ backgroundColor: '#7C3AED' }}
                                            >
                                                {buyer.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
                                            </div>
                                            <span className="text-xs font-semibold text-white/90 max-w-[100px] truncate hidden sm:block">
                                                {buyer.name}
                                            </span>
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuLabel>
                                            <p className="text-sm font-semibold">{buyer.name}</p>
                                            <p className="text-xs text-muted-foreground">{buyer.email}</p>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 cursor-pointer">
                                            <LogOut className="w-4 h-4 mr-2" />
                                            Sign out
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setShowAuthModal(true)}
                                    className="relative h-10 w-10 rounded-full text-white hover:bg-white/10"
                                    title="Sign in"
                                >
                                    <User2 className="h-5 w-5" />
                                </Button>
                            )
                        )}

                        {/* Theme Toggle */}
                        {isMounted && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleTheme}
                                className="relative h-10 w-10 rounded-full text-white hover:bg-white/10"
                                title={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                            >
                                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                                <span className="sr-only">Toggle theme</span>
                            </Button>
                        )}

                        {/* Cart Icon */}
                        {isMounted && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="relative h-10 w-10 rounded-full transition-colors active:scale-95 text-white hover:bg-white/10"
                                onClick={() => setOpen(true)}
                                aria-label="Shopping cart"
                            >
                                <ShoppingBag className="w-5 h-5" />
                                {cartCount > 0 && (
                                    <span
                                        className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1.5 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-lg"
                                        style={{ backgroundColor: '#7C3AED' }}
                                    >
                                        {cartCount}
                                    </span>
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile slide-down menu */}
            <div
                className={`sm:hidden overflow-hidden transition-all duration-300 ease-in-out ${
                    mobileMenuOpen ? "max-h-60 border-t border-white/[0.08]" : "max-h-0"
                }`}
                style={{ backgroundColor: '#110228' }}
            >
                <div className="container mx-auto px-4 py-3 space-y-1">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                                    isActive
                                        ? "bg-[#7C3AED]/20 text-white"
                                        : "text-white/70 hover:bg-white/[0.06] hover:text-white"
                                }`}
                            >
                                {link.icon && <link.icon className="w-4.5 h-4.5" />}
                                {!link.icon && <ShoppingBag className="w-4.5 h-4.5" />}
                                {link.label}
                                {isActive && (
                                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
                                )}
                            </Link>
                        )
                    })}

                    {/* Mobile user info */}
                    {isMounted && buyer && (
                        <div className="flex items-center justify-between px-4 py-3 mt-2 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                            <div className="flex items-center gap-2.5">
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black"
                                    style={{ backgroundColor: '#7C3AED' }}
                                >
                                    {buyer.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white truncate max-w-[180px]">{buyer.name}</p>
                                    <p className="text-xs text-white/40 truncate max-w-[180px]">{buyer.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="text-white/40 hover:text-red-400 transition-colors p-2"
                                title="Sign out"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>

        {/* Auth Modal */}
        {showAuthModal && (
            <BuyerAuthModal
                onSuccess={handleAuthSuccess}
                onClose={() => setShowAuthModal(false)}
            />
        )}
        </>
    )
}
