import { Inter, Poppins, JetBrains_Mono } from 'next/font/google'

/**
 * Primary font - used for body text
 * Inter is a highly readable sans-serif font optimized for UI
 */
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  fallback: ['system-ui', 'arial'],
})

/**
 * Display font - used for headings
 * Poppins provides a bold, modern look for headings
 */
export const poppins = Poppins({
  weight: ['400', '600', '700', '900'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
  preload: true,
  fallback: ['system-ui', 'arial'],
})

/**
 * Monospace font - used for code
 * JetBrains Mono is optimized for code readability
 */
export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  preload: false, // Only load when needed
  fallback: ['Courier New', 'monospace'],
})
