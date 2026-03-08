"use client"

import { Check, Loader2 } from "lucide-react"
import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface SubscriptionPlan {
  id: string
  name: string
  price: number | string
  yearlyPrice?: number | string
  interval?: "monthly" | "yearly"
  features: string[]
  popular?: boolean
  trialDays?: number
  description?: string
}

const plans: SubscriptionPlan[] = [
  {
    id: "free",
    name: "14-Day Free Trial",
    price: "0",
    trialDays: 14,
    description: "No credit card required",
    features: [
      "Up to 10 products",
      "1 POS terminal",
      "Basic reporting",
      "Community support",
    ],
  },
  {
    id: "basic_monthly",
    name: "Basic",
    price: 29,
    yearlyPrice: 290,
    interval: "monthly",
    trialDays: 14,
    description: "Ideal for small businesses",
    features: [
      "Up to 100 products",
      "1 POS terminal",
      "Basic analytics",
      "Email support",
      "Mobile app access",
    ],
  },
  {
    id: "pro_monthly",
    name: "Pro",
    price: 79,
    yearlyPrice: 790,
    interval: "monthly",
    popular: true,
    trialDays: 14,
    description: "Best for growing businesses",
    features: [
      "Unlimited products",
      "5 POS terminals",
      "Advanced analytics",
      "Priority support",
      "Mobile app access",
      "Inventory management",
      "Customer database",
      "Multi-location support",
    ],
  },
]

interface SubscriptionPlanSelectorProps {
  selectedPlan: string | null
  onSelectPlan: (planId: string) => void
  loading?: boolean
  disabled?: boolean
  showYearlyToggle?: boolean
  className?: string
}

export function SubscriptionPlanSelector({
  selectedPlan,
  onSelectPlan,
  loading = false,
  disabled = false,
  showYearlyToggle = true,
  className,
}: SubscriptionPlanSelectorProps) {
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">("monthly")

  const handlePlanSelect = (planId: string) => {
    if (disabled || loading) return
    onSelectPlan(planId)
  }

  const handleKeyDown = (e: React.KeyboardEvent, planId: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      handlePlanSelect(planId)
    }
  }

  const getDisplayPrice = (plan: SubscriptionPlan) => {
    if (plan.price === "0") return "0"
    if (billingInterval === "yearly" && plan.yearlyPrice) {
      return plan.yearlyPrice
    }
    return plan.price
  }

  const getSavingsPercentage = (plan: SubscriptionPlan) => {
    if (!plan.yearlyPrice || plan.price === "0") return 0
    const monthlyTotal = Number(plan.price) * 12
    const yearlyPrice = Number(plan.yearlyPrice)
    return Math.round(((monthlyTotal - yearlyPrice) / monthlyTotal) * 100)
  }

  return (
    <div className={cn("w-full max-w-[1400px] mx-auto px-4", className)}>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2 text-purple-700 dark:text-purple-400">
          Choose Your Plan
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Start free for 14 days — no credit card required. Upgrade anytime.
        </p>

        {/* Billing Interval Toggle */}
        {showYearlyToggle && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setBillingInterval("monthly")}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-all",
                billingInterval === "monthly"
                  ? "bg-purple-600 text-white shadow-md"
                  : "text-gray-600 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400"
              )}
              disabled={disabled}
              aria-pressed={billingInterval === "monthly"}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval("yearly")}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2",
                billingInterval === "yearly"
                  ? "bg-purple-600 text-white shadow-md"
                  : "text-gray-600 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400"
              )}
              disabled={disabled}
              aria-pressed={billingInterval === "yearly"}
            >
              Yearly
              <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                Save up to 17%
              </Badge>
            </button>
          </div>
        )}
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-fr">
        {plans.map((plan) => {
          const displayPrice = getDisplayPrice(plan)
          const savings = getSavingsPercentage(plan)
          const isSelected = selectedPlan === plan.id
          const isFree = plan.price === "0"

          return (
            <div key={plan.id} className="flex">
              <Card
                role="button"
                tabIndex={disabled ? -1 : 0}
                aria-label={`Select ${plan.name} plan`}
                aria-pressed={isSelected}
                aria-disabled={disabled}
                className={cn(
                  "relative cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col w-full",
                  isSelected
                    ? "border-2 border-purple-600 shadow-xl ring-2 ring-purple-200 dark:ring-purple-800"
                    : isFree
                    ? "border-2 border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/20"
                    : "border border-gray-200 dark:border-gray-700",
                  disabled && "opacity-60 cursor-not-allowed hover:shadow-none hover:translate-y-0"
                )}
                onClick={() => handlePlanSelect(plan.id)}
                onKeyDown={(e) => handleKeyDown(e, plan.id)}
              >
                {/* Free Trial badge */}
                {isFree && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="bg-purple-600 hover:bg-purple-600 text-white px-3 py-1 shadow-md font-semibold">
                      🎉 No Credit Card
                    </Badge>
                  </div>
                )}

                {/* Most Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                    <Badge className="bg-purple-600 hover:bg-purple-600 text-white px-3 py-1 shadow-md">
                      Most Popular
                    </Badge>
                  </div>
                )}

                {/* Yearly savings badge */}
                {billingInterval === "yearly" && savings > 0 && (
                  <div className="absolute -top-3 right-4 z-10">
                    <Badge className="bg-orange-500 hover:bg-orange-500 text-white px-2 py-1 text-xs shadow-sm">
                      Save {savings}%
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-4">
                  <CardTitle className={cn(
                    "text-2xl font-bold",
                    isSelected ? "text-purple-700 dark:text-purple-400" : "text-gray-900 dark:text-gray-100"
                  )}>
                    {plan.name}
                  </CardTitle>

                  {plan.description && (
                    <CardDescription className="mt-1 text-sm">
                      {plan.description}
                    </CardDescription>
                  )}

                  <div className="mt-4 mb-2">
                    {displayPrice === "0" ? (
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-4xl font-bold text-purple-600 dark:text-purple-400">Free</span>
                        <Badge className="text-xs font-semibold px-3 py-1 bg-purple-100 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/40 dark:text-purple-300">
                          14-Day Trial
                        </Badge>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <div>
                          <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                            ${displayPrice}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400 ml-2">
                            /{billingInterval === "yearly" ? "year" : "month"}
                          </span>
                        </div>
                        {billingInterval === "yearly" && (
                          <span className="text-sm text-gray-500 mt-1">
                            ${(Number(displayPrice) / 12).toFixed(2)}/month billed annually
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {plan.trialDays && displayPrice !== "0" && (
                    <CardDescription className="mt-2 text-sm font-medium text-purple-600 dark:text-purple-400">
                      {plan.trialDays}-day free trial included
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-3 pb-6 grow">
                  {plan.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 animate-in fade-in-50"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <Check className="h-5 w-5 shrink-0 mt-0.5 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                    </div>
                  ))}
                </CardContent>

                <CardFooter className="pt-0 mt-auto">
                  <Button
                    className={cn(
                      "w-full transition-all duration-300 font-semibold",
                      isSelected
                        ? "bg-purple-600 hover:bg-purple-700 text-white shadow-md"
                        : isFree
                        ? "bg-purple-100 hover:bg-purple-600 text-purple-700 hover:text-white dark:bg-purple-900/40 dark:text-purple-300 dark:hover:bg-purple-600 dark:hover:text-white"
                        : "bg-gray-100 hover:bg-purple-600 text-gray-800 hover:text-white dark:bg-gray-800 dark:hover:bg-purple-600 dark:text-gray-100",
                      loading && "opacity-70"
                    )}
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePlanSelect(plan.id)
                    }}
                    disabled={disabled || loading}
                    aria-busy={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : isSelected ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Selected
                      </>
                    ) : isFree ? (
                      "Start Free Trial"
                    ) : (
                      "Select Plan"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )
        })}
      </div>
    </div>
  )
}
