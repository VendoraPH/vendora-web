"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Building2, Mail, Lock, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react"
import { SubscriptionPlanSelector } from "@/components/auth/subscription-plan-selector"
import { authService } from "@/services/auth-jwt.service"

const registerSchema = z.object({
  business_name: z.string().min(2, "Business name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  password_confirmation: z.string(),
}).refine((data) => data.password === data.password_confirmation, {
  message: "Passwords do not match",
  path: ["password_confirmation"],
})

type RegisterForm = z.infer<typeof registerSchema>

export default function VendorRegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1) // 1: Plan selection, 2: Account details
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const handlePlanSelection = (planId: string) => {
    setSelectedPlan(planId)
  }

  const handleNextStep = () => {
    if (step === 1 && !selectedPlan) {
      setError("Please select a subscription plan")
      return
    }
    setError(null)
    setStep(2)
  }

  const handlePrevStep = () => {
    setError(null)
    setStep(1)
  }

  const onSubmit = async (data: RegisterForm) => {
    if (!selectedPlan) {
      setError("Please select a subscription plan")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await authService.pos.register({
        name: data.business_name,
        business_name: data.business_name,
        email: data.email,
        password: data.password,
        password_confirmation: data.password_confirmation,
        subscription_plan: selectedPlan,
        user_type: "vendor",
      })

      if (response.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push("/pos/auth/login")
        }, 3000)
      } else {
        setError(response.message ?? "Registration failed. Please try again.")
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } }; message?: string }
      const validationErrors = error.response?.data?.errors
      if (validationErrors) {
        const firstError = Object.values(validationErrors)[0]
        setError(Array.isArray(firstError) ? (firstError[0] ?? "Validation error") : String(firstError))
      } else {
        setError(error.response?.data?.message || error.message || "An error occurred during registration")
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 rounded-full bg-purple-600">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">Registration Successful!</CardTitle>
            <CardDescription className="text-center">
              Your vendor account has been created. You can now sign in with your credentials.
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col space-y-4">
            <p className="text-sm text-center text-gray-600">
              Redirecting to login...
            </p>
            <Button onClick={() => router.push("/pos/auth/login")} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <>
      {step === 2 ? (
        // Step 2: Full viewport layout without wrapper
        <div className="min-h-screen w-full flex flex-col md:flex-row">
          {/* Left Column - Image */}
          <div className="relative w-full h-48 sm:h-64 md:h-screen md:w-1/2 lg:w-3/5 bg-slate-900">
            <img
              src="/images/Register.jpg"
              alt="Register Background"
              className="absolute inset-0 w-full h-full object-cover object-center md:object-left"
            />
            <div className="hidden md:block lg:hidden absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
          </div>

          {/* Right Column - Registration Form */}
          <div className="w-full md:w-1/2 lg:w-2/5 md:h-screen flex flex-col bg-white">
            {/* Progress Steps */}
            <div className="border-b bg-white py-4 px-6">
              <div className="flex items-start justify-center gap-3">
                {[
                  { num: 1, label: "Choose Plan" },
                  { num: 2, label: "Account Details" },
                ].map((s, idx) => (
                  <div key={s.num} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm ${step >= s.num
                          ? "bg-purple-600 text-white"
                          : "bg-gray-200 text-gray-600"
                          }`}
                      >
                        {s.num}
                      </div>
                      <span className={`mt-2 text-xs text-center whitespace-nowrap ${step >= s.num ? "font-medium text-purple-600" : "text-gray-500"}`}>
                        {s.label}
                      </span>
                    </div>
                    {idx < 1 && (
                      <div
                        className={`w-12 h-0.5 mx-1 mb-5 ${step > s.num ? "bg-purple-600" : "bg-gray-200"}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Form Container */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-8 md:p-10 lg:p-12">
              <div className="w-full max-w-sm space-y-4">
                <div className="text-left">
                  <h2 className="text-2xl font-bold text-gray-900">Create Your Account</h2>
                  <p className="text-gray-500 mt-1 text-xs">Enter your business details to get started</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="business_name">Business Name</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-[#9898b8]" />
                      <Input
                        {...register("business_name")}
                        id="business_name"
                        type="text"
                        placeholder="Your Business Name"
                        className="pl-10 h-9"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.business_name && (
                      <p className="text-sm text-red-500">{errors.business_name.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-[#9898b8]" />
                      <Input
                        {...register("email")}
                        id="email"
                        type="email"
                        placeholder="business@example.com"
                        className="pl-10 h-9"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-[#9898b8]" />
                      <Input
                        {...register("password")}
                        id="password"
                        type="password"
                        placeholder="Create a strong password"
                        className="pl-10 h-9"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.password && (
                      <p className="text-sm text-red-500">{errors.password.message}</p>
                    )}
                    <p className="text-[10px] text-gray-500 leading-tight">
                      Min 8 chars, 1 uppercase, 1 lowercase, 1 number
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password_confirmation">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-[#9898b8]" />
                      <Input
                        {...register("password_confirmation")}
                        id="password_confirmation"
                        type="password"
                        placeholder="Confirm your password"
                        className="pl-10 h-9"
                        disabled={isLoading}
                      />
                    </div>
                    {errors.password_confirmation && (
                      <p className="text-sm text-red-500">{errors.password_confirmation.message}</p>
                    )}
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-between pt-2">
                    <Button type="button" variant="ghost" onClick={handlePrevStep}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      type="submit"
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      disabled={isLoading}
                    >
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Account
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Step 1: Plan selection
        <div className="min-h-screen p-4 py-3">
          <div className="w-full max-w-6xl mx-auto pb-20">
            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex items-start justify-center gap-4">
                {[
                  { num: 1, label: "Choose Plan" },
                  { num: 2, label: "Account Details" },
                ].map((s, idx) => (
                  <div key={s.num} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${step >= s.num
                          ? "bg-purple-600 text-white"
                          : "bg-gray-200 text-gray-600"
                          }`}
                      >
                        {s.num}
                      </div>
                      <span className={`mt-3 text-sm text-center whitespace-nowrap ${step >= s.num ? "font-medium text-purple-600" : "text-gray-500"}`}>
                        {s.label}
                      </span>
                    </div>
                    {idx < 1 && (
                      <div
                        className={`w-16 h-1 mx-2 mb-6 ${step > s.num ? "bg-purple-600" : "bg-gray-200"}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6 max-w-2xl mx-auto">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Step 1: Plan Selection */}
            <div className="mb-24">
              <SubscriptionPlanSelector
                selectedPlan={selectedPlan}
                onSelectPlan={handlePlanSelection}
              />
            </div>

            {/* Sticky Navigation Buttons */}
            <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t shadow-lg">
              <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
                <Link href="/pos/auth/login">
                  <Button variant="ghost">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Login
                  </Button>
                </Link>
                <Button
                  onClick={handleNextStep}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  disabled={!selectedPlan}
                >
                  Continue
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
