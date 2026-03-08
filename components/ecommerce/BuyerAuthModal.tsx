"use client"

import { useState } from "react"
import { X, AlertTriangle, Eye, EyeOff, Lock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import axiosClient from "@/lib/axios-client"

export const BUYER_TOKEN_KEY = "rbtesa_buyer_token"
export const BUYER_USER_KEY = "rbtesa_buyer_user"

export type BuyerUser = {
    id: number
    name: string
    email: string
    user_type: string
}

type AuthMode = "login" | "register"

export function BuyerAuthModal({ onSuccess, onClose }: { onSuccess: (user: BuyerUser) => void; onClose: () => void }) {
    const [mode, setMode] = useState<AuthMode>("login")
    const [loginForm, setLoginForm] = useState({ email: "", password: "" })
    const [regForm, setRegForm] = useState({ name: "", email: "", password: "", password_confirmation: "" })
    const [showPass, setShowPass] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const extractAuthData = (raw: unknown): { token?: string; user?: BuyerUser; message?: string } => {
        if (!raw || typeof raw !== "object") return {}
        const r = raw as Record<string, unknown>
        const nested = r.data && typeof r.data === "object" ? r.data as Record<string, unknown> : null
        return {
            token: (r.token ?? nested?.token) as string | undefined,
            user: (r.user ?? nested?.user) as BuyerUser | undefined,
            message: (r.message ?? nested?.message) as string | undefined,
        }
    }

    const extractErrorMsg = (err: unknown, fallback: string): string => {
        if (!err || typeof err !== "object") return fallback
        const e = err as Record<string, unknown>
        const resp = e.response && typeof e.response === "object" ? e.response as Record<string, unknown> : null
        const respData = resp?.data && typeof resp.data === "object" ? resp.data as Record<string, unknown> : null
        if (respData?.errors && typeof respData.errors === "object") {
            return Object.values(respData.errors as Record<string, unknown[]>).flat().join(" ")
        }
        return (respData?.message as string) || fallback
    }

    const handleLogin = async () => {
        if (!loginForm.email || !loginForm.password) { setError("Please fill in all fields."); return }
        setIsLoading(true)
        setError("")
        try {
            const res = await axiosClient.post("/auth/login", loginForm)
            const { token, user, message } = extractAuthData(res.data)
            if (token && user) {
                localStorage.setItem(BUYER_TOKEN_KEY, token)
                localStorage.setItem(BUYER_USER_KEY, JSON.stringify(user))
                window.dispatchEvent(new Event("storage"))
                onSuccess(user)
            } else {
                setError(message || "Login failed. Please check your credentials.")
            }
        } catch (err: unknown) {
            setError(extractErrorMsg(err, "Invalid email or password."))
        } finally {
            setIsLoading(false)
        }
    }

    const handleRegister = async () => {
        if (!regForm.name || !regForm.email || !regForm.password || !regForm.password_confirmation) {
            setError("Please fill in all fields."); return
        }
        if (regForm.password !== regForm.password_confirmation) {
            setError("Passwords do not match."); return
        }
        setIsLoading(true)
        setError("")
        try {
            const res = await axiosClient.post("/auth/register", regForm)
            const { token, user, message } = extractAuthData(res.data)
            if (token && user) {
                localStorage.setItem(BUYER_TOKEN_KEY, token)
                localStorage.setItem(BUYER_USER_KEY, JSON.stringify(user))
                window.dispatchEvent(new Event("storage"))
                onSuccess(user)
            } else {
                setError(message || "Registration failed. Please try again.")
            }
        } catch (err: unknown) {
            setError(extractErrorMsg(err, "Registration failed. Please try again."))
        } finally {
            setIsLoading(false)
        }
    }

    const submit = mode === "login" ? handleLogin : handleRegister

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70">
            <div className="w-full max-w-md bg-white dark:bg-[#110228] rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-white/[0.08] animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">

                {/* Header */}
                <div className="px-5 sm:px-6 pt-6 sm:pt-8 pb-5 sm:pb-6 text-center relative" style={{ background: "linear-gradient(135deg,#110228,#2E0F5F,#7C3AED)" }}>
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                    >
                        <X className="w-4 h-4 text-white" />
                    </button>
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                        <Lock className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-white mb-1">
                        {mode === "login" ? "Sign in to Reserve" : "Create an Account"}
                    </h2>
                    <p className="text-sm text-purple-200/70">
                        {mode === "login"
                            ? "Log in to reserve food from today's menu."
                            : "Register to start reserving from today's menu."}
                    </p>
                </div>

                {/* Tab switcher */}
                <div className="flex border-b border-gray-100 dark:border-white/[0.06]">
                    {(["login", "register"] as AuthMode[]).map(m => (
                        <button
                            key={m}
                            onClick={() => { setMode(m); setError("") }}
                            className={`flex-1 py-3 text-sm font-bold capitalize transition-colors ${
                                mode === m
                                    ? "text-[#7C3AED] border-b-2 border-[#7C3AED]"
                                    : "text-gray-500 dark:text-white/40 hover:text-gray-700 dark:hover:text-white/60"
                            }`}
                        >
                            {m === "login" ? "Login" : "Register"}
                        </button>
                    ))}
                </div>

                {/* Form */}
                <div className="px-5 sm:px-6 py-5 sm:py-6 space-y-4">
                    {error && (
                        <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}

                    {mode === "register" && (
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            <Input
                                placeholder="e.g. Juan Dela Cruz"
                                value={regForm.name}
                                onChange={e => setRegForm(f => ({ ...f, name: e.target.value }))}
                                className="h-11 rounded-xl bg-gray-50 dark:bg-white/[0.05] border border-gray-200 dark:border-white/10 dark:text-white dark:placeholder:text-white/30 focus-visible:ring-[#7C3AED]/50"
                            />
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <Input
                            type="email"
                            placeholder="your@email.com"
                            value={mode === "login" ? loginForm.email : regForm.email}
                            onChange={e => mode === "login"
                                ? setLoginForm(f => ({ ...f, email: e.target.value }))
                                : setRegForm(f => ({ ...f, email: e.target.value }))
                            }
                            className="h-11 rounded-xl bg-gray-50 dark:bg-white/[0.05] border border-gray-200 dark:border-white/10 dark:text-white dark:placeholder:text-white/30 focus-visible:ring-[#7C3AED]/50"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            Password <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Input
                                type={showPass ? "text" : "password"}
                                placeholder="••••••••"
                                value={mode === "login" ? loginForm.password : regForm.password}
                                onChange={e => mode === "login"
                                    ? setLoginForm(f => ({ ...f, password: e.target.value }))
                                    : setRegForm(f => ({ ...f, password: e.target.value }))
                                }
                                onKeyDown={e => e.key === "Enter" && mode === "login" && submit()}
                                className="h-11 pr-11 rounded-xl bg-gray-50 dark:bg-white/[0.05] border border-gray-200 dark:border-white/10 dark:text-white dark:placeholder:text-white/30 focus-visible:ring-[#7C3AED]/50"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(s => !s)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white/60 transition-colors"
                            >
                                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {mode === "register" && (
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                Confirm Password <span className="text-red-500">*</span>
                            </label>
                            <Input
                                type="password"
                                placeholder="Re-enter your password"
                                value={regForm.password_confirmation}
                                onChange={e => setRegForm(f => ({ ...f, password_confirmation: e.target.value }))}
                                onKeyDown={e => e.key === "Enter" && submit()}
                                className="h-11 rounded-xl bg-gray-50 dark:bg-white/[0.05] border border-gray-200 dark:border-white/10 dark:text-white dark:placeholder:text-white/30 focus-visible:ring-[#7C3AED]/50"
                            />
                        </div>
                    )}

                    <Button
                        onClick={submit}
                        disabled={isLoading}
                        className="w-full h-11 rounded-xl font-bold text-white mt-1"
                        style={{ backgroundColor: "#7C3AED" }}
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                {mode === "login" ? "Signing in..." : "Creating account..."}
                            </span>
                        ) : (
                            mode === "login" ? "Sign In" : "Create Account"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    )
}
