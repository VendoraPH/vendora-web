"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, AlertCircle, Mail } from "lucide-react"
import { EmailVerification, UserType } from "@/types/auth"

interface EmailVerificationProps {
  userType: UserType
}

export function EmailVerificationComponent({ userType }: EmailVerificationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isVerifying, setIsVerifying] = useState(true)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isResending, setIsResending] = useState(false)

  const token = searchParams.get("token")

  useEffect(() => {
    if (token) {
      verifyEmail(token)
    } else {
      setIsVerifying(false)
      setError("Invalid verification link")
    }
  }, [token])

  const verifyEmail = async (verificationToken: string) => {
    try {
      const data: EmailVerification = {
        token: verificationToken,
        user_type: userType,
      }

      // TODO: Replace with actual API call
      const response = await fetch(`/api/${userType}/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Verification failed")
      }

      setIsSuccess(true)
      setError(null)

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push(`/${userType === "admin" ? "admin" : "pos"}/auth/login`)
      }, 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during verification")
      setIsSuccess(false)
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendVerification = async () => {
    setIsResending(true)
    setError(null)

    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/${userType}/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Failed to resend verification email")
      }

      alert("Verification email has been resent. Please check your inbox.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            {isVerifying && (
              <div className="bg-blue-100 p-3 rounded-full">
                <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
              </div>
            )}
            {isSuccess && (
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            )}
            {!isVerifying && !isSuccess && error && (
              <div className="bg-red-100 p-3 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            )}
          </div>
          <CardTitle className="text-2xl font-bold text-center">
            {isVerifying && "Verifying Your Email"}
            {isSuccess && "Email Verified!"}
            {!isVerifying && !isSuccess && "Verification Failed"}
          </CardTitle>
          <CardDescription className="text-center">
            {isVerifying && "Please wait while we verify your email address..."}
            {isSuccess && "Your email has been successfully verified. You can now sign in to your account."}
            {!isVerifying && !isSuccess && "We couldn't verify your email address. The link may have expired."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {isSuccess && (
            <p className="text-sm text-center text-gray-600">
              Redirecting to login page...
            </p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          {isSuccess && (
            <Button
              onClick={() => router.push(`/${userType === "admin" ? "admin" : "pos"}/auth/login`)}
              className="w-full"
            >
              Go to Login
            </Button>
          )}
          {!isVerifying && !isSuccess && (
            <>
              <Button
                onClick={handleResendVerification}
                className="w-full"
                disabled={isResending}
              >
                {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Mail className="mr-2 h-4 w-4" />
                Resend Verification Email
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.push(`/${userType === "admin" ? "admin" : "pos"}/auth/login`)}
                className="w-full"
              >
                Back to Login
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}