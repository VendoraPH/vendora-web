"use client"

import { Store, MapPin, Clock, Phone, Star } from "lucide-react"

interface StoreBannerProps {
    name?: string
    address?: string
    phone?: string
}

export function StoreBanner({ name, address, phone }: StoreBannerProps) {
    return (
        <section className="relative w-full overflow-hidden bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-[#110228] dark:via-[#1a0440] dark:to-[#110228]">
            {/* Decorative orbs */}
            <div className="absolute top-0 right-1/3 w-64 h-64 rounded-full opacity-10 dark:opacity-15 blur-3xl bg-[#7C3AED]" />
            <div className="absolute bottom-0 left-1/4 w-48 h-48 rounded-full opacity-5 dark:opacity-10 blur-3xl bg-[#7C3AED]" />

            <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-10 sm:py-14">
                <div className="flex flex-col items-center text-center space-y-5">
                    {/* Store Icon */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center backdrop-blur-sm bg-[#7C3AED]/10 border border-[#7C3AED]/20 dark:bg-[#7C3AED]/10 dark:border-[#7C3AED]/20">
                        <Store className="w-8 h-8 sm:w-10 sm:h-10 text-[#7C3AED] dark:text-[#7C3AED]" />
                    </div>

                    {/* Store Name */}
                    <div className="space-y-2">
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-gray-900 dark:text-white">
                            {name || "Luna Street Mart"}
                        </h1>
                        <p className="text-base sm:text-lg font-medium text-gray-500 dark:text-white/50">
                            Your Trusted Neighborhood Store
                        </p>
                    </div>

                    {/* Address */}
                    <div className="flex items-center gap-2 text-gray-600 dark:text-white/60">
                        <MapPin className="w-4 h-4 text-[#7C3AED] dark:text-[#7C3AED] shrink-0" />
                        <span className="text-sm sm:text-base">
                            {address || "123 Rizal Ave, Brgy. San Isidro, Quezon City"}
                        </span>
                    </div>

                    {/* Info Row */}
                    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-2">
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-white/45">
                            <Clock className="w-4 h-4 text-[#7C3AED] dark:text-[#7C3AED]" />
                            <span className="font-medium">8:00 AM - 9:00 PM</span>
                        </div>
                        <div className="hidden sm:block w-1 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-white/45">
                            <Phone className="w-4 h-4 text-[#7C3AED] dark:text-[#7C3AED]" />
                            <span className="font-medium">{phone || "+63 912 345 6789"}</span>
                        </div>
                        <div className="hidden sm:block w-1 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
                        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-white/45">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold text-gray-700 dark:text-white/70">4.8</span>
                            <span className="font-medium">(256 reviews)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom gradient fade */}
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#f8f8fc] dark:from-[#110228] to-transparent" />
        </section>
    )
}
