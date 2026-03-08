/**
 * Navigation Configuration
 *
 * Defines navigation menus for different sections
 */

import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  CreditCard,
  Home,
  Search,
  User,
  Heart,
  Receipt,
} from "lucide-react"

export const adminNavigation = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Products",
    href: "/admin/products",
    icon: Package,
  },
  {
    title: "Orders",
    href: "/admin/orders",
    icon: ShoppingCart,
  },
  {
    title: "Inventory",
    href: "/admin/inventory",
    icon: Package,
  },
  {
    title: "Customers",
    href: "/admin/customers",
    icon: Users,
  },
  {
    title: "Reports",
    href: "/admin/reports",
    icon: BarChart3,
  },
  {
    title: "Subscriptions",
    href: "/admin/subscriptions",
    icon: CreditCard,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
]

export const posNavigation = [
  {
    title: "POS",
    href: "/pos",
    icon: ShoppingCart,
  },
  {
    title: "Transactions",
    href: "/pos/transactions",
    icon: Receipt,
  },
  {
    title: "Customers",
    href: "/pos/customers",
    icon: Users,
  },
  {
    title: "Settings",
    href: "/pos/settings",
    icon: Settings,
  },
]

export const ecommerceNavigation = [
  {
    title: "Home",
    href: "/ecommerce",
    icon: Home,
  },
  {
    title: "Products",
    href: "/ecommerce/products",
    icon: Package,
  },
  {
    title: "Search",
    href: "/ecommerce/search",
    icon: Search,
  },
  {
    title: "Cart",
    href: "/ecommerce/cart",
    icon: ShoppingCart,
  },
  {
    title: "Account",
    href: "/ecommerce/account",
    icon: User,
  },
]

export const ecommerceAccountNavigation = [
  {
    title: "Dashboard",
    href: "/ecommerce/account",
    icon: LayoutDashboard,
  },
  {
    title: "Orders",
    href: "/ecommerce/account/orders",
    icon: ShoppingCart,
  },
  {
    title: "Profile",
    href: "/ecommerce/account/profile",
    icon: User,
  },
  {
    title: "Addresses",
    href: "/ecommerce/account/addresses",
    icon: Home,
  },
  {
    title: "Wishlist",
    href: "/ecommerce/account/wishlist",
    icon: Heart,
  },
]

export const footerNavigation = {
  products: [
    { title: "Point of Sale", href: "/pos" },
    { title: "E-commerce", href: "/ecommerce" },
    { title: "Admin Dashboard", href: "/admin" },
    { title: "Pricing", href: "/subscription" },
  ],
  support: [
    { title: "Help Center", href: "/help" },
    { title: "Documentation", href: "/docs" },
    { title: "FAQ", href: "/faq" },
    { title: "Contact Us", href: "/contact" },
  ],
  company: [
    { title: "About", href: "/about" },
    { title: "Blog", href: "/blog" },
    { title: "Careers", href: "/careers" },
    { title: "Partners", href: "/partners" },
  ],
  legal: [
    { title: "Privacy Policy", href: "/privacy" },
    { title: "Terms of Service", href: "/terms" },
    { title: "Cookie Policy", href: "/cookies" },
  ],
}
