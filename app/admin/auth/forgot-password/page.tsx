"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react"

export default function AdminForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // TODO: Replace with actual forgot password logic using authService.admin.forgotPassword()
      // const response = await authService.admin.forgotPassword({ email })
      // if (response.success) {
      //   setSent(true)
      // }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))

      setSent(true)
      setLoading(false)
    } catch {
      setError("Failed to send reset email. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            {sent ? (
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            ) : (
              <ShieldCheck className="h-12 w-12 text-primary" />
            )}
          </div>
          <CardTitle className="text-2xl text-center">
            {sent ? "Check Your Email" : "Forgot Password?"}
          </CardTitle>
          <CardDescription className="text-center">
            {sent
              ? "We've sent password reset instructions to your email"
              : "Enter your email to receive a password reset link"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md">
                <CheckCircle2 className="h-4 w-4" />
                <span>Password reset email sent successfully!</span>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Please check your inbox and follow the instructions to reset your password.
                If you don&apos;t see the email, check your spam folder.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@vendora.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  disabled={loading}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4 py-5">
          <div className="text-sm text-center text-muted-foreground">
            Remember your password?{" "}
            <Link href="/admin/auth/login" className="text-primary hover:underline font-medium">
              Back to login
            </Link>
          </div>
          {sent && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setSent(false)}
            >
              Resend Email
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}