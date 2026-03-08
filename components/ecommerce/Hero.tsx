"use client"

import Autoplay from "embla-carousel-autoplay"
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel"
import { Button } from "@/components/ui/button"
import { ArrowRight, Package, Shield, Headphones, Star, Sparkles } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRef, useState, useEffect } from "react"

export function Hero() {
    const plugin = useRef<any>(
        Autoplay({ delay: 5000, stopOnInteraction: true })
    )
    const [api, setApi] = useState<any>()
    const [current, setCurrent] = useState(0)

    useEffect(() => {
        if (!api) return
        setCurrent(api.selectedScrollSnap())
        api.on("select", () => {
            setCurrent(api.selectedScrollSnap())
        })
    }, [api])

    const slides = [
        {
            id: 1,
            badge: "New Arrivals",
            title: "Upgrade Your Everyday",
            titleAccent: "Essentials",
            subtitle: "Premium quality products at unbeatable prices. Save up to 40% on selected items.",
            productImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop",
            productName: "Premium Wireless Headphones",
            originalPrice: "$299.00",
            price: "$209.00",
            discount: "-30%",
            rating: 4.8,
            reviewCount: 256,
        },
        {
            id: 2,
            badge: "Limited Time Sale",
            title: "Style Meets",
            titleAccent: "Comfort",
            subtitle: "Discover the latest trends in fashion and lifestyle. Exclusive deals just for you.",
            productImage: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop",
            productName: "Ultra Comfort Running Shoes",
            originalPrice: "$159.00",
            price: "$119.00",
            discount: "-25%",
            rating: 4.9,
            reviewCount: 312,
        },
        {
            id: 3,
            badge: "Best Sellers",
            title: "Elevate Your",
            titleAccent: "Living Space",
            subtitle: "Transform your home with our curated collection of modern essentials.",
            productImage: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=2058&auto=format&fit=crop",
            productName: "Minimalist Table Lamp",
            originalPrice: "$89.00",
            price: "$62.00",
            discount: "-30%",
            rating: 4.7,
            reviewCount: 184,
        },
    ]

    return (
        <section className="relative w-full overflow-hidden">
            <Carousel
                plugins={[plugin.current]}
                setApi={setApi}
                className="w-full"
                opts={{ loop: true, align: "start" }}
            >
                <CarouselContent className="ml-0">
                    {slides.map((slide, index) => (
                        <CarouselItem key={slide.id} className="pl-0">
                            {/* Desktop Layout */}
                            <div className="hidden lg:block relative overflow-hidden animate-gradient-mesh bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-[#110228] dark:via-[#1a0440] dark:to-[#0d0120]">
                                <div className="container mx-auto px-8 xl:px-12">
                                    <div className="grid lg:grid-cols-2 gap-8 items-center min-h-[380px] py-10">
                                        {/* Left Content */}
                                        <div className="space-y-5">
                                            {/* Badge */}
                                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#7C3AED]/30 bg-[#7C3AED]/10 dark:border-[#7C3AED]/30 dark:bg-[#7C3AED]/10 backdrop-blur-sm">
                                                <Sparkles className="w-4 h-4 text-[#7C3AED] dark:text-[#7C3AED]" />
                                                <span className="text-sm font-semibold text-[#7C3AED] dark:text-[#7C3AED] tracking-wide">
                                                    {slide.badge}
                                                </span>
                                            </div>

                                            {/* Headline */}
                                            <h1 className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white">
                                                {slide.title}{" "}
                                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] to-[#7C3AED] dark:from-[#7C3AED] dark:to-[#7C3AED]">
                                                    {slide.titleAccent}
                                                </span>
                                            </h1>

                                            <p className="text-lg leading-relaxed max-w-xl text-gray-600 dark:text-white/60">
                                                {slide.subtitle}
                                            </p>

                                            {/* CTA Buttons */}
                                            <div className="flex flex-wrap items-center gap-4 pt-2">
                                                <Link href="/ecommerce/products">
                                                    <Button
                                                        size="lg"
                                                        className="bg-[#7C3AED] hover:bg-[#6D28D9] dark:bg-[#7C3AED] dark:hover:bg-[#6D28D9] text-white dark:text-[#110228] rounded-full px-8 h-12 text-base font-bold shadow-lg shadow-[#7C3AED]/20 dark:shadow-[#7C3AED]/20 hover:shadow-[#7C3AED]/40 dark:hover:shadow-[#7C3AED]/40 transition-all hover:scale-105"
                                                    >
                                                        Shop Now
                                                        <ArrowRight className="ml-2 w-5 h-5" />
                                                    </Button>
                                                </Link>
                                                <Link href="/ecommerce/deals">
                                                    <Button
                                                        size="lg"
                                                        variant="outline"
                                                        className="border-2 border-gray-300 dark:border-white/20 text-gray-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-400 dark:hover:border-white/40 rounded-full px-8 h-12 text-base font-semibold transition-all"
                                                    >
                                                        View Deals
                                                    </Button>
                                                </Link>
                                            </div>

                                            {/* Trust Indicators */}
                                            <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-gray-200 dark:border-white/10">
                                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-white/50">
                                                    <Package className="w-4 h-4 text-[#7C3AED] dark:text-[#7C3AED]" />
                                                    <span className="font-medium">Free Shipping over $50</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-white/50">
                                                    <Shield className="w-4 h-4 text-[#7C3AED] dark:text-[#7C3AED]" />
                                                    <span className="font-medium">Secure Payments</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-white/50">
                                                    <Headphones className="w-4 h-4 text-[#7C3AED] dark:text-[#7C3AED]" />
                                                    <span className="font-medium">24/7 Support</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Product Showcase */}
                                        <div className="relative">
                                            <div className="relative rounded-3xl p-5 max-w-sm ml-auto backdrop-blur-xl bg-white dark:bg-white/[0.06] border border-gray-200 dark:border-white/10 shadow-lg dark:shadow-none">
                                                {/* Discount Badge */}
                                                <div className="absolute -top-3 -right-3 z-10">
                                                    <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg shadow-red-500/30">
                                                        {slide.discount}
                                                    </div>
                                                </div>

                                                {/* Product Image */}
                                                <div className="relative w-full aspect-[4/3] mb-4 rounded-2xl overflow-hidden">
                                                    <Image
                                                        src={slide.productImage}
                                                        alt={slide.productName}
                                                        fill
                                                        className="object-cover"
                                                        priority={index === 0}
                                                        quality={90}
                                                    />
                                                </div>

                                                {/* Product Details */}
                                                <div className="space-y-3">
                                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                                        {slide.productName}
                                                    </h3>

                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center gap-0.5">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star
                                                                    key={i}
                                                                    className={`w-4 h-4 ${i < Math.floor(slide.rating)
                                                                        ? "fill-yellow-400 text-yellow-400"
                                                                        : "fill-gray-200 dark:fill-white/10 text-gray-200 dark:text-white/10"
                                                                    }`}
                                                                />
                                                            ))}
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-400 dark:text-white/40">
                                                            {slide.rating} ({slide.reviewCount})
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <span className="text-2xl font-black text-[#7C3AED] dark:text-[#7C3AED]">
                                                            {slide.price}
                                                        </span>
                                                        <span className="text-base line-through text-gray-400 dark:text-white/30">
                                                            {slide.originalPrice}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Mobile Layout */}
                            <div className="lg:hidden relative overflow-hidden pb-5 bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-[#110228] dark:via-[#1a0440] dark:to-[#2E0F5F]">
                                <div className="container mx-auto px-4 sm:px-6">
                                    {/* Product Image */}
                                    <div className="relative w-full aspect-[4/3] max-w-[85vw] sm:max-w-xs mx-auto mb-4 pt-4">
                                        <div className="absolute top-8 right-2 z-10">
                                            <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                                                {slide.discount}
                                            </div>
                                        </div>
                                        <div className="relative w-full h-full rounded-2xl overflow-hidden bg-white dark:bg-white/[0.06] border border-gray-200 dark:border-white/10 shadow-md dark:shadow-none">
                                            <Image
                                                src={slide.productImage}
                                                alt={slide.productName}
                                                fill
                                                className="object-cover"
                                                priority={index === 0}
                                                quality={90}
                                            />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="space-y-4 text-center px-2">
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#7C3AED]/30 bg-[#7C3AED]/10 dark:border-[#7C3AED]/30 dark:bg-[#7C3AED]/10">
                                            <Sparkles className="w-3.5 h-3.5 text-[#7C3AED] dark:text-[#7C3AED]" />
                                            <span className="text-xs font-semibold text-[#7C3AED] dark:text-[#7C3AED]">
                                                {slide.badge}
                                            </span>
                                        </div>

                                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight px-2 text-gray-900 dark:text-white">
                                            {slide.title}{" "}
                                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] to-[#7C3AED] dark:from-[#7C3AED] dark:to-[#7C3AED]">
                                                {slide.titleAccent}
                                            </span>
                                        </h1>

                                        <p className="text-sm sm:text-base leading-relaxed max-w-md mx-auto text-gray-500 dark:text-white/50">
                                            {slide.subtitle}
                                        </p>

                                        <div className="pt-2 space-y-3 sm:flex sm:flex-row sm:space-y-0 sm:gap-3 sm:justify-center">
                                            <Link href="/ecommerce/products" className="block sm:inline-block">
                                                <Button
                                                    size="lg"
                                                    className="w-full sm:w-auto sm:min-w-40 bg-[#7C3AED] hover:bg-[#6D28D9] dark:bg-[#7C3AED] dark:hover:bg-[#6D28D9] text-white dark:text-[#110228] rounded-full h-12 text-base font-bold shadow-lg shadow-[#7C3AED]/20 dark:shadow-[#7C3AED]/20 active:scale-95 transition-all"
                                                >
                                                    Shop Now
                                                    <ArrowRight className="ml-2 w-5 h-5" />
                                                </Button>
                                            </Link>
                                        </div>

                                        <div className="flex flex-wrap items-center justify-center gap-3 pt-4 text-xs">
                                            <div className="flex items-center gap-1.5 text-gray-400 dark:text-white/40">
                                                <Package className="w-4 h-4 text-[#7C3AED] dark:text-[#7C3AED]" />
                                                <span className="font-medium">Free Ship $50+</span>
                                            </div>
                                            <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
                                            <div className="flex items-center gap-1.5 text-gray-400 dark:text-white/40">
                                                <Shield className="w-4 h-4 text-[#7C3AED] dark:text-[#7C3AED]" />
                                                <span className="font-medium">Secure</span>
                                            </div>
                                            <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
                                            <div className="flex items-center gap-1.5 text-gray-400 dark:text-white/40">
                                                <Headphones className="w-4 h-4 text-[#7C3AED] dark:text-[#7C3AED]" />
                                                <span className="font-medium">24/7 Support</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>

                {/* Desktop Navigation */}
                <div className="hidden lg:flex absolute bottom-8 left-1/2 -translate-x-1/2 items-center gap-3 z-10">
                    <CarouselPrevious className="static translate-y-0 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 border border-gray-200 dark:border-white/20 text-gray-700 dark:text-white rounded-full h-10 w-10 backdrop-blur-sm" />
                    <div className="flex items-center gap-2 px-4">
                        {slides.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => api?.scrollTo(index)}
                                className={`transition-all duration-300 rounded-full ${
                                    current === index
                                        ? "w-8 h-2 bg-[#7C3AED] dark:bg-[#7C3AED] shadow-lg shadow-[#7C3AED]/40 dark:shadow-[#7C3AED]/40"
                                        : "w-2 h-2 bg-gray-300 dark:bg-white/30 hover:bg-gray-400 dark:hover:bg-white/50"
                                }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                    <CarouselNext className="static translate-y-0 bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 border border-gray-200 dark:border-white/20 text-gray-700 dark:text-white rounded-full h-10 w-10 backdrop-blur-sm" />
                </div>

                {/* Mobile Dots */}
                <div className="flex lg:hidden justify-center items-center gap-2 py-5 bg-[#f8f8fc] dark:bg-[#110228]">
                    {slides.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => api?.scrollTo(index)}
                            className={`transition-all duration-300 rounded-full active:scale-90 ${
                                current === index
                                    ? "w-8 h-2.5 bg-[#7C3AED] dark:bg-[#7C3AED] shadow-lg shadow-[#7C3AED]/40 dark:shadow-[#7C3AED]/40"
                                    : "w-2.5 h-2.5 bg-gray-300 dark:bg-white/30 hover:bg-gray-400 dark:hover:bg-white/50"
                            }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </Carousel>
        </section>
    )
}
