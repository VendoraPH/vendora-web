"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check } from "lucide-react"
import { formatPHP } from "@/lib/currency"

const plans = [
  {
    id: "free",
    name: "1-Month Free Trial",
    price: 0,
    period: "month",
    description: "No credit card required",
    features: [
      "Full access to all POS features",
      "Product and inventory management",
      "Sales tracking with basic reports",
      "Analytics dashboard preview",
      "E-commerce store setup included",
      "Customer and transaction management",
      "No payment required during the trial",
      "Option to upgrade anytime to continue",
    ],
    highlighted: false,
    hidden: false,
  },
  {
    id: "business",
    name: "Business",
    price: 250,
    period: "month",
    description: "For serious vendors",
    features: [
      "Full POS system with uninterrupted access",
      "Integrated e-commerce website for your store",
      "Complete inventory and stock tracking",
      "Detailed sales reports and analytics",
      "Customer management and sales history",
      "Credit management and ledger tracking",
      "Secure cloud storage for business data",
      "Continuous updates with priority support",
    ],
    highlighted: true,
    hidden: true,
  },
]

export default function SubscriptionPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly")
  const visiblePlans = plans.filter((p) => !p.hidden)
  const showBillingToggle = visiblePlans.some((p) => p.price > 0)

  const getPrice = (monthlyPrice: number) => {
    if (billingCycle === "annual") {
      // 2 months free on annual billing
      return monthlyPrice * 10
    }
    return monthlyPrice
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-emerald-50">
      <div className="w-full py-6 sm:py-10 md:py-16">
        {/* Header Section */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16 px-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4">
            Choose Your Plan
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto">
            Start free for 1 month — no credit card required. Upgrade anytime.
          </p>

          {/* Billing Cycle Toggle */}
          {showBillingToggle && (
            <div className="inline-flex items-center gap-2 p-1 bg-muted rounded-lg shadow-sm">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
                  billingCycle === "monthly"
                    ? "bg-background shadow-md text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("annual")}
                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-md text-xs sm:text-sm font-medium transition-all flex items-center gap-2 ${
                  billingCycle === "annual"
                    ? "bg-background shadow-md text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Annual
                <Badge variant="secondary" className="px-2 py-0.5 text-xs">
                  Save 20%
                </Badge>
              </button>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className={`grid gap-4 sm:gap-6 md:gap-8 mb-12 sm:mb-16 ${
          visiblePlans.length === 1
            ? "grid-cols-1 max-w-md mx-auto"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-2"
        }`}>
          {visiblePlans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-xl border bg-card text-card-foreground shadow-sm p-6 sm:p-8 flex flex-col transition-all duration-300 ${
                plan.highlighted
                  ? "border-2 border-primary shadow-xl"
                  : "border-border hover:border-primary/30 hover:shadow-lg"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="px-3 py-1 text-xs font-semibold shadow-md">
                    Most Popular
                  </Badge>
                </div>
              )}

              {/* Plan Name & Description */}
              <div className="mb-4 sm:mb-6">
                <h3 className="text-xl sm:text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground min-h-[40px]">
                  {plan.description}
                </p>
              </div>

              {/* Pricing */}
              <div className="mb-6 sm:mb-8">
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                    {formatPHP(getPrice(plan.price))}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  per {billingCycle === "monthly" ? "month" : "year"}
                </p>
                {billingCycle === "annual" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatPHP(plan.price)}/mo billed annually
                  </p>
                )}
              </div>

              {/* Features */}
              <div className="flex-1 mb-6 sm:mb-8">
                <div className="border-t pt-4 sm:pt-6">
                  <p className="font-semibold text-xs sm:text-sm mb-3 sm:mb-4">Features included:</p>
                  <ul className="space-y-2 sm:space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="w-4 h-4 sm:w-5 sm:h-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-xs sm:text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* CTA Button */}
              <div>
                <Button
                  className="w-full text-sm sm:text-base"
                  size="lg"
                  variant={plan.highlighted ? "default" : "outline"}
                >
                  {plan.highlighted ? "Get Started Now" : "Get Started"}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="text-center mb-12 sm:mb-16 px-4">
          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
            No credit card required. Cancel anytime.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 sm:gap-8 text-xs sm:text-sm">
            <Link href="/login" className="text-primary hover:underline font-medium">
              Already have an account? Sign in
            </Link>
            <Link href="/contact" className="text-primary hover:underline font-medium">
              Need help choosing? Contact us
            </Link>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="w-full">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-10 px-4">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            <div className="space-y-2 sm:space-y-3 p-4 sm:p-6 rounded-lg bg-card border">
              <h3 className="font-semibold text-base sm:text-lg">Can I change plans later?</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div className="space-y-2 sm:space-y-3 p-4 sm:p-6 rounded-lg bg-card border">
              <h3 className="font-semibold text-base sm:text-lg">What payment methods do you accept?</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                We accept all major credit cards, debit cards, and GCash for your convenience.
              </p>
            </div>
            <div className="space-y-2 sm:space-y-3 p-4 sm:p-6 rounded-lg bg-card border">
              <h3 className="font-semibold text-base sm:text-lg">Is there a setup fee?</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                No setup fees. Just pay for your subscription. Start using the platform immediately.
              </p>
            </div>
            <div className="space-y-2 sm:space-y-3 p-4 sm:p-6 rounded-lg bg-card border">
              <h3 className="font-semibold text-base sm:text-lg">Can I cancel anytime?</h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Yes, you can cancel your subscription at any time with no penalties or cancellation fees.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
