import { ReactNode } from "react"

/**
 * Clean Authentication Layout - No Sidebar, No Navigation
 * Minimal wrapper for auth pages
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
