import Link from "next/link"
import { Shield } from "lucide-react"

interface AuthFooterProps {
  variant?: "default" | "dark"
  className?: string
}

export function AuthFooter({ variant = "default", className = "" }: AuthFooterProps) {
  const isDark = variant === "dark"

  return (
    <footer className={`w-full ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Links Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-6 border-t border-opacity-10" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}>
          {/* Left - Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm">
            <Link
              href="/pos/help"
              className={`transition-colors font-light ${
                isDark
                  ? "text-white/50 hover:text-white/80"
                  : "text-gray-500 dark:text-[#b4b4d0] hover:text-gray-900 dark:text-white"
              }`}
            >
              Help Center
            </Link>
            <span className={isDark ? "text-white/20" : "text-gray-300 dark:text-[#9898b8]"}>•</span>
            <Link
              href="/pos/privacy"
              className={`transition-colors font-light ${
                isDark
                  ? "text-white/50 hover:text-white/80"
                  : "text-gray-500 dark:text-[#b4b4d0] hover:text-gray-900 dark:text-white"
              }`}
            >
              Privacy Policy
            </Link>
            <span className={isDark ? "text-white/20" : "text-gray-300 dark:text-[#9898b8]"}>•</span>
            <Link
              href="/pos/terms"
              className={`transition-colors font-light ${
                isDark
                  ? "text-white/50 hover:text-white/80"
                  : "text-gray-500 dark:text-[#b4b4d0] hover:text-gray-900 dark:text-white"
              }`}
            >
              Terms of Service
            </Link>
            <span className={isDark ? "text-white/20" : "text-gray-300 dark:text-[#9898b8]"}>•</span>
            <Link
              href="/pos/contact"
              className={`transition-colors font-light ${
                isDark
                  ? "text-white/50 hover:text-white/80"
                  : "text-gray-500 dark:text-[#b4b4d0] hover:text-gray-900 dark:text-white"
              }`}
            >
              Contact
            </Link>
          </div>

          {/* Right - Security Badge */}
          <div className="flex items-center gap-2">
            <Shield className={`h-3.5 w-3.5 ${isDark ? "text-purple-400" : "text-purple-600"}`} />
            <span className={`text-xs font-light ${isDark ? "text-white/40" : "text-gray-500 dark:text-[#b4b4d0]"}`}>
              Secured with SSL
            </span>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="py-6 border-t border-opacity-10" style={{ borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" }}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <p className={`font-light tracking-wide ${isDark ? "text-white/40" : "text-gray-500 dark:text-[#b4b4d0]"}`}>
              © 2026 Vendora POS. All rights reserved.
            </p>
            <p className={`font-light ${isDark ? "text-white/30" : "text-gray-400 dark:text-[#9898b8]"}`}>
              Empowering retail businesses worldwide
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
