import { ReactNode } from "react"

export default function SubscriptionLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  )
}
