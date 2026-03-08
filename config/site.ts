/**
 * Site Configuration
 *
 * Central configuration for site metadata and settings
 */

export const siteConfig = {
  name: "Vendora",
  description: "Complete POS and E-commerce Solution for Philippine Businesses",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ogImage: "/og-image.png",
  links: {
    facebook: "https://facebook.com/vendora",
    instagram: "https://instagram.com/vendora",
    twitter: "https://twitter.com/vendora",
  },
  contact: {
    email: "support@vendora.com",
    phone: "+63 912 345 6789",
    address: "Manila, Philippines",
  },
}

export const businessConfig = {
  currency: "PHP",
  currencySymbol: "₱",
  taxRate: 12, // 12% VAT for Philippines
  dateFormat: "MM/DD/YYYY",
  timeFormat: "12h", // 12-hour or 24-hour
  timezone: "Asia/Manila",
}
