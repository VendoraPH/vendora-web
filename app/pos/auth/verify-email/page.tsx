"use client"

import { Suspense } from "react"
import { EmailVerificationComponent } from "@/components/auth/email-verification"
import { Loader2 } from "lucide-react"

function EmailVerificationContent() {
  return <EmailVerificationComponent userType="vendor" />
}

export default function VendorEmailVerificationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      }
    >
      <EmailVerificationContent />
    </Suspense>
  )
}