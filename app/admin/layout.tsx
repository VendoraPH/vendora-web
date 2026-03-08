import type { Metadata } from "next"

export const metadata: Metadata = {
  title: {
    default: "Vendora",
    template: "%s | POS and E-commerce",
  },
  description: "Vendora Admin Panel - Manage vendors, users, and platform settings",
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
