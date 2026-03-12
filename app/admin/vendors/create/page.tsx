"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { DashboardLayout } from "@/components/admin/layout/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { ArrowLeft, Loader2, Store, CheckCircle2, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { API_ENDPOINTS } from "@/config/api-endpoints"
import axiosClient from "@/lib/axios-client"

// Form validation schema
const createVendorSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    password_confirmation: z.string(),
    business_name: z.string().min(2, "Business name must be at least 2 characters"),
    subscription_plan: z.enum(["free", "business"], {
        error: () => ({ message: "Please select a subscription plan" }),
    }),
}).refine((data) => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"],
})

type CreateVendorFormData = z.infer<typeof createVendorSchema>

export default function CreateVendorPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<CreateVendorFormData>({
        resolver: zodResolver(createVendorSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
            password_confirmation: "",
            business_name: "",
            subscription_plan: undefined,
        },
    })

    const selectedPlan = watch("subscription_plan")

    const onSubmit = async (data: CreateVendorFormData) => {
        setIsLoading(true)
        try {
            await axiosClient.post(API_ENDPOINTS.ADMIN.VENDORS.CREATE, data)

            toast.success("Vendor created successfully!", {
                description: `${data.business_name} has been added to the platform.`,
                icon: <CheckCircle2 className="w-5 h-5 text-green-600" />,
            })

            router.push("/admin/vendors")
        } catch (error: unknown) {
            console.error("Error creating vendor:", error)

            // Handle specific error responses
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } } }
                if (axiosError.response?.status === 422) {
                    const validationErrors = axiosError.response.data?.errors
                    if (validationErrors) {
                        Object.entries(validationErrors).forEach(([field, messages]) => {
                            toast.error(`${field}: ${messages.join(", ")}`)
                        })
                        return
                    }
                }

                toast.error(axiosError.response?.data?.message || "Failed to create vendor")
            } else {
                toast.error("An unexpected error occurred. Please try again.")
            }
        } finally {
            setIsLoading(false)
        }
    }

    const subscriptionPlans = [
        {
            value: "free",
            label: "1-Month Free Trial",
            description: "Full access for 30 days, no payment required",
            color: "bg-gray-100 text-gray-700",
        },
        {
            value: "business",
            label: "Business",
            description: "P250/month, all features, priority support",
            color: "bg-purple-100 text-purple-700",
        },
    ]

    return (
        <DashboardLayout>
            {/* Page Header */}
            <div className="mb-6">
                <Link
                    href="/admin/vendors"
                    className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Vendors
                </Link>
                <h1 className="text-3xl font-bold tracking-tight">Create New Vendor</h1>
                <p className="text-muted-foreground mt-2">
                    Add a new vendor to the Vendora platform
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Form */}
                <div className="lg:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Store className="h-5 w-5 text-purple-600" />
                                Vendor Information
                            </CardTitle>
                            <CardDescription>
                                Enter the vendor&apos;s account and business details
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                {/* Owner Information */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-gray-700 border-b pb-2">Owner Information</h3>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Owner Name <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="name"
                                                placeholder="John Doe"
                                                {...register("name")}
                                                className={errors.name ? "border-red-500 focus:ring-red-500" : "focus:ring-purple-500 focus:border-purple-500"}
                                            />
                                            {errors.name && (
                                                <p className="text-sm text-red-500">{errors.name.message}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="vendor@example.com"
                                                {...register("email")}
                                                className={errors.email ? "border-red-500 focus:ring-red-500" : "focus:ring-purple-500 focus:border-purple-500"}
                                            />
                                            {errors.email && (
                                                <p className="text-sm text-red-500">{errors.email.message}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Password Section */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-gray-700 border-b pb-2">Account Security</h3>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="password">Password <span className="text-red-500">*</span></Label>
                                            <div className="relative">
                                                <Input
                                                    id="password"
                                                    type={showPassword ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    {...register("password")}
                                                    className={errors.password ? "border-red-500 focus:ring-red-500 pr-10" : "focus:ring-purple-500 focus:border-purple-500 pr-10"}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                >
                                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                            {errors.password && (
                                                <p className="text-sm text-red-500">{errors.password.message}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="password_confirmation">Confirm Password <span className="text-red-500">*</span></Label>
                                            <div className="relative">
                                                <Input
                                                    id="password_confirmation"
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    placeholder="••••••••"
                                                    {...register("password_confirmation")}
                                                    className={errors.password_confirmation ? "border-red-500 focus:ring-red-500 pr-10" : "focus:ring-purple-500 focus:border-purple-500 pr-10"}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                >
                                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                            {errors.password_confirmation && (
                                                <p className="text-sm text-red-500">{errors.password_confirmation.message}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Business Information */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-medium text-gray-700 border-b pb-2">Business Information</h3>

                                    <div className="space-y-2">
                                        <Label htmlFor="business_name">Business Name <span className="text-red-500">*</span></Label>
                                        <Input
                                            id="business_name"
                                            placeholder="Vendor Corp"
                                            {...register("business_name")}
                                            className={errors.business_name ? "border-red-500 focus:ring-red-500" : "focus:ring-purple-500 focus:border-purple-500"}
                                        />
                                        {errors.business_name && (
                                            <p className="text-sm text-red-500">{errors.business_name.message}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="subscription_plan">Subscription Plan <span className="text-red-500">*</span></Label>
                                        <Select
                                            value={selectedPlan}
                                            onValueChange={(value: "free" | "business") => setValue("subscription_plan", value)}
                                        >
                                            <SelectTrigger
                                                id="subscription_plan"
                                                className={errors.subscription_plan ? "border-red-500" : "focus:ring-purple-500 focus:border-purple-500"}
                                            >
                                                <SelectValue placeholder="Select a subscription plan" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {subscriptionPlans.map((plan) => (
                                                    <SelectItem key={plan.value} value={plan.value}>
                                                        <div className="flex items-center gap-2">
                                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${plan.color}`}>
                                                                {plan.label}
                                                            </span>
                                                            <span className="text-muted-foreground text-sm">
                                                                - {plan.description}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.subscription_plan && (
                                            <p className="text-sm text-red-500">{errors.subscription_plan.message}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Form Actions */}
                                <div className="flex items-center justify-end gap-4 pt-4 border-t">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.push("/admin/vendors")}
                                        disabled={isLoading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="bg-purple-600 hover:bg-purple-700"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            <>
                                                <Store className="mr-2 h-4 w-4" />
                                                Create Vendor
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Info */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Subscription Plans</CardTitle>
                            <CardDescription>
                                Choose the right plan for the vendor
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {subscriptionPlans.map((plan) => (
                                <div
                                    key={plan.value}
                                    className={`p-4 rounded-lg border-2 transition-colors ${selectedPlan === plan.value
                                        ? "border-purple-500 bg-purple-50"
                                        : "border-gray-200 hover:border-gray-300"
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className={`px-2 py-1 rounded text-sm font-medium ${plan.color}`}>
                                            {plan.label}
                                        </span>
                                        {selectedPlan === plan.value && (
                                            <CheckCircle2 className="h-5 w-5 text-purple-600" />
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600">{plan.description}</p>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="mt-4">
                        <CardHeader>
                            <CardTitle className="text-lg">Quick Tips</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-600">•</span>
                                    The vendor will receive a welcome email with login credentials
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-600">•</span>
                                    They can change their password after first login
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-600">•</span>
                                    Subscription plan can be changed later from vendor details
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    )
}
