"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  ShieldCheck,
  Loader2,
  LogOut,
  Eye,
  EyeOff,
  Store,
  Users,
  BarChart3,
  Globe,
  Lock,
  Mail
} from "lucide-react"
import { authService } from "@/services/auth-jwt.service"
import { toast } from "sonner"

// Professional error messages for different scenarios
const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: {
    title: "Incorrect email or password",
    description: "Please check your credentials and try again.",
  },
  NETWORK_ERROR: {
    title: "Unable to connect to server",
    description: "Please check your internet connection.",
  },
  SERVER_ERROR: {
    title: "Service temporarily unavailable",
    description: "Please try again in a few moments.",
  },
  DEFAULT: {
    title: "Unable to sign in",
    description: "Please try again or contact support.",
  },
} as const

// Platform features to showcase
const platformFeatures = [
  {
    icon: Store,
    title: "Multi-Vendor Management",
    description: "Manage thousands of vendors from one dashboard"
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description: "Track platform performance and revenue"
  },
  {
    icon: Users,
    title: "User Administration",
    description: "Complete control over all platform users"
  },
  {
    icon: Globe,
    title: "E-commerce Oversight",
    description: "Monitor all transactions and orders"
  }
]

export default function AdminLoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<{ title: string; description: string } | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const [currentFeature, setCurrentFeature] = useState(0)

  // Auto-dismiss error message after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [error])

  // Show logout success message if user just logged out
  useEffect(() => {
    const showLogout = sessionStorage.getItem('showLogout')
    if (showLogout) {
      sessionStorage.removeItem('showLogout')
      toast.success("Logged out successfully", {
        description: "You've been securely signed out. See you next time!",
        icon: <LogOut className="w-5 h-5 text-purple-600" />,
      })
    }
  }, [])

  // Rotate through features
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % platformFeatures.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await authService.admin.login({
        email,
        password,
        user_type: "admin",
      })

      if (!response.success) {
        throw new Error(response.message || "Login failed")
      }

      // Set flag for welcome message on dashboard
      sessionStorage.setItem('showWelcome', 'true')

      // Show loading overlay and redirect immediately
      setIsNavigating(true)
      router.push("/admin/dashboard")
    } catch (err: unknown) {
      const axiosError = err as {
        response?: {
          status?: number
          data?: {
            message?: string
          }
        }
        message?: string
        code?: string
      }

      // Handle network errors
      if (axiosError.code === 'ERR_NETWORK' || !axiosError.response) {
        setError(ERROR_MESSAGES.NETWORK_ERROR)
        return
      }

      // Handle server errors (5xx)
      if (axiosError.response?.status && axiosError.response.status >= 500) {
        setError(ERROR_MESSAGES.SERVER_ERROR)
        return
      }

      // Handle invalid credentials (401)
      if (axiosError.response?.status === 401) {
        setError(ERROR_MESSAGES.INVALID_CREDENTIALS)
        return
      }

      // Default error with server message
      setError({
        title: ERROR_MESSAGES.DEFAULT.title,
        description: axiosError.response?.data?.message || ERROR_MESSAGES.DEFAULT.description,
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Beautiful branded loading overlay
  if (isNavigating) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-300" style={{ backgroundColor: '#110228' }}>
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-600/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative flex flex-col items-center gap-8 p-8">
          {/* Logo with pulse animation */}
          <div className="relative">
            <div className="absolute inset-0 bg-white/20 rounded-3xl blur-xl animate-pulse" />
            <div className="relative flex items-center justify-center w-32 h-32 bg-white rounded-3xl shadow-2xl p-5">
              <Image
                src="/logos/logo.png"
                alt="Vendora"
                width={96}
                height={96}
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Brand name */}
          <h1 className="text-4xl font-bold text-white tracking-wide">Vendora</h1>

          {/* Loading indicator */}
          <div className="flex flex-col items-center gap-4 mt-2">
            <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
            <p className="text-purple-300 text-sm">Preparing your dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding & Features */}
      <div
        className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden"
        style={{ backgroundColor: '#110228' }}
      >
        {/* Decorative background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-pink-600/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/10 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />

          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '50px 50px'
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Logo and Brand */}
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center p-3">
              <Image
                src="/logos/logo.png"
                alt="Vendora"
                width={64}
                height={64}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Vendora</h1>
              <p className="text-purple-300 text-base">Admin Portal</p>
            </div>
          </div>

          {/* Main Headline */}
          <div className="flex-1 flex flex-col justify-center py-12">
            <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
              Power Your<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                E-commerce Empire
              </span>
            </h2>
            <p className="text-purple-200 text-lg xl:text-xl max-w-lg leading-relaxed">
              The complete multi-vendor marketplace platform. Manage vendors,
              monitor sales, and scale your business from one powerful dashboard.
            </p>

            {/* Animated Feature Showcase */}
            <div className="mt-12 bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 max-w-md">
              <div className="flex items-center gap-4">
                {(() => {
                  const Feature = platformFeatures[currentFeature] ?? platformFeatures[0]!
                  const Icon = Feature.icon
                  return (
                    <>
                      <div className="w-14 h-14 rounded-xl bg-purple-600 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <div className="animate-in fade-in slide-in-from-right-2 duration-500" key={currentFeature}>
                        <h3 className="text-white font-semibold text-lg">{Feature.title}</h3>
                        <p className="text-purple-300 text-sm">{Feature.description}</p>
                      </div>
                    </>
                  )
                })()}
              </div>

              {/* Feature indicators */}
              <div className="flex gap-2 mt-4">
                {platformFeatures.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1 rounded-full transition-all duration-300 ${idx === currentFeature
                      ? 'w-8 bg-purple-400'
                      : 'w-2 bg-white/20'
                      }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8">
            <div>
              <div className="text-3xl xl:text-4xl font-bold text-white">10K+</div>
              <div className="text-purple-300 text-sm">Active Vendors</div>
            </div>
            <div>
              <div className="text-3xl xl:text-4xl font-bold text-white">₱50M+</div>
              <div className="text-purple-300 text-sm">Monthly GMV</div>
            </div>
            <div>
              <div className="text-3xl xl:text-4xl font-bold text-white">99.9%</div>
              <div className="text-purple-300 text-sm">Uptime SLA</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-6 sm:p-12 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center p-2">
              <Image
                src="/logos/logo.png"
                alt="Vendora"
                width={40}
                height={40}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Vendora</h1>
              <p className="text-purple-600 text-xs">Admin Portal</p>
            </div>
          </div>

          {/* Header */}
          <div className="text-center lg:text-left mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-100 mb-4">
              <ShieldCheck className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h2>
            <p className="text-gray-500">
              Sign in to access your admin dashboard
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 animate-in fade-in-0 slide-in-from-top-1 duration-200">
                <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
                <div>
                  <p className="text-red-700 font-medium text-sm">{error.title}</p>
                  <p className="text-red-600 text-xs mt-0.5">{error.description}</p>
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@vendora.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  disabled={isLoading}
                  className="pl-12 h-12 text-base border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                  disabled={isLoading}
                  className="pl-12 pr-12 h-12 text-base border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  disabled={isLoading}
                  className="border-gray-300 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                />
                <label
                  htmlFor="remember"
                  className="text-sm text-gray-600 cursor-pointer"
                >
                  Keep me signed in
                </label>
              </div>
              <Link
                href="/admin/auth/forgot-password"
                className="text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Sign In Button */}
            <Button
              type="submit"
              size="lg"
              disabled={isLoading}
              className="w-full h-12 text-base font-semibold bg-purple-600 hover:bg-purple-700 transition-all duration-200 shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In to Dashboard"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
