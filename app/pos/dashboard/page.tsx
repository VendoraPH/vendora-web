"use client"

import { useEffect } from "react"
import DesktopDashboard from "@/components/screens/dashboard/DesktopDashboard"
import { toast } from "sonner"
import { CheckCircle2 } from "lucide-react"

/**
 * POS Dashboard Page
 * Uses the default layout for all devices
 */
export default function POSDashboard() {
  // Show welcome toast if user just logged in
  useEffect(() => {
    const showWelcome = sessionStorage.getItem('showWelcome')
    if (showWelcome) {
      sessionStorage.removeItem('showWelcome')
      toast.success("Welcome back!", {
        description: "You've successfully signed in to your dashboard.",
        icon: <CheckCircle2 className="w-5 h-5 text-purple-600" />,
      })
    }
  }, [])

  return <DesktopDashboard />
}
