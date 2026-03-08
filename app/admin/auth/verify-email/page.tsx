"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle2, Mail, ShieldCheck } from "lucide-react"

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState("")
  const token = searchParams.get("token")

  useEffect(() => {
    // If token is present in URL, auto-verify
    if (token) {
      handleVerify()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const handleVerify = async () => {
    if (!token) return

    setVerifying(true)
    setError("")

    try {
      // TODO: Replace with actual verification logic using authService.admin.verifyEmail()
      // const response = await authService.admin.verifyEmail(token)
      // if (response.success) {
      //   setVerified(true)
      //   setTimeout(() => router.push("/admin/auth/login"), 2000)
      // }

      // Simulate verification
      await new Promise(resolve => setTimeout(resolve, 1500))

      setVerified(true)
      // Auto-redirect after 2 seconds
      setTimeout(() => router.push("/admin/auth/login"), 2000)
    } catch {
      setError("Invalid or expired verification token")
      setVerifying(false)
    }
  }

  const handleResendVerification = async () => {
    setLoading(true)
    setError("")

    try {
      // TODO: Replace with actual resend logic using authService.admin.resendVerification()
      // const response = await authService.admin.resendVerification()
      // if (response.success) {
      //   alert("Verification email sent!")
      // }

      // Simulate resend
      await new Promise(resolve => setTimeout(resolve, 1000))
      alert("Verification email sent! Please check your inbox.")
      setLoading(false)
    } catch {
      setError("Failed to resend verification email")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            {verified ? (
              <CheckCircle2 className="h-12 w-12 text-green-500" />
            ) : verifying ? (
              <ShieldCheck className="h-12 w-12 text-primary animate-pulse" />
            ) : (
              <Mail className="h-12 w-12 text-primary" />
            )}
          </div>
          <CardTitle className="text-2xl text-center">
            {verified ? "Email Verified!" : verifying ? "Verifying..." : "Verify Your Email"}
          </CardTitle>
          <CardDescription className="text-center">
            {verified
              ? "Your email has been successfully verified"
              : verifying
                ? "Please wait while we verify your email"
                : "Check your email for a verification link"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md mb-4">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {verified && (
            <div className="flex items-center gap-2 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-md mb-4">
              <CheckCircle2 className="h-4 w-4" />
              <span>Redirecting to login page...</span>
            </div>
          )}

          {/* Verification Instructions */}
          {!verified && !verifying && !token && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                We&apos;ve sent a verification email to your registered email address.
                Please click the link in the email to verify your account.
              </p>
              <Button
                onClick={handleResendVerification}
                variant="outline"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Sending..." : "Resend Verification Email"}
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-sm text-center text-muted-foreground">
            <Link href="/admin/auth/login" className="text-primary hover:underline font-medium">
              Back to login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function AdminVerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <ShieldCheck className="h-12 w-12 text-primary animate-pulse" />
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}