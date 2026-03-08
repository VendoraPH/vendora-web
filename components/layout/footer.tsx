import { ReactNode } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin } from "lucide-react"

interface FooterProps {
  /** Footer variant */
  variant?: "simple" | "full"
  /** Custom className */
  className?: string
  /** Show social media links */
  showSocial?: boolean
  /** Additional content */
  children?: ReactNode
}

/**
 * Reusable Footer Component
 *
 * @example
 * // Simple footer
 * <Footer variant="simple" />
 *
 * // Full footer with all sections
 * <Footer variant="full" showSocial />
 */
export function Footer({
  variant = "simple",
  className,
  showSocial = true,
  children,
}: FooterProps) {
  if (variant === "simple") {
    return (
      <footer className={cn("border-t bg-background", className)}>
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2024 Vendora. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-foreground">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-foreground">
                Terms of Service
              </Link>
              <Link href="/contact" className="hover:text-foreground">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    )
  }

  return (
    <footer className={cn("border-t bg-muted/30", className)}>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-lg font-bold mb-4">Vendora</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Complete POS and e-commerce solution for Philippine businesses.
              Manage your store, inventory, and sales all in one place.
            </p>
            {showSocial && (
              <div className="flex items-center gap-3">
                <Link
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Facebook className="h-5 w-5" />
                </Link>
                <Link
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Instagram className="h-5 w-5" />
                </Link>
                <Link
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Twitter className="h-5 w-5" />
                </Link>
              </div>
            )}
          </div>

          {/* Products Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Products</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/pos" className="hover:text-foreground">
                  Point of Sale
                </Link>
              </li>
              <li>
                <Link href="/ecommerce" className="hover:text-foreground">
                  E-commerce
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-foreground">
                  Admin Dashboard
                </Link>
              </li>
              <li>
                <Link href="/subscription" className="hover:text-foreground">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/help" className="hover:text-foreground">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/docs" className="hover:text-foreground">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-foreground">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-foreground">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 shrink-0" />
                <a href="mailto:support@vendora.com" className="hover:text-foreground">
                  support@vendora.com
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 shrink-0" />
                <a href="tel:+639123456789" className="hover:text-foreground">
                  +63 912 345 6789
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  Manila, Philippines
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Custom Content */}
        {children}

        {/* Bottom Bar */}
        <div className="border-t mt-12 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2024 Vendora. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-foreground">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-foreground">
                Terms of Service
              </Link>
              <Link href="/cookies" className="hover:text-foreground">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
