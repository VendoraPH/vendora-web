/**
 * Responsive Design Utilities
 *
 * This file contains utilities for handling responsive design across different device sizes.
 * Perfect for POS systems that need to work on tablets, phones, and desktop displays.
 */

import { useState, useEffect } from "react"

/**
 * Tailwind CSS Breakpoints (Default)
 *
 * Mobile First Approach:
 * - Default (mobile): < 640px
 * - sm (small tablets): >= 640px
 * - md (tablets): >= 768px
 * - lg (small laptops): >= 1024px
 * - xl (desktops): >= 1280px
 * - 2xl (large desktops): >= 1536px
 */

export const BREAKPOINTS = {
  mobile: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const

export type Breakpoint = keyof typeof BREAKPOINTS

/**
 * Custom hook to detect current breakpoint
 * Usage:
 * const breakpoint = useBreakpoint()
 * if (breakpoint === 'mobile') { ... }
 */
export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("mobile")

  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth
      if (width >= BREAKPOINTS["2xl"]) setBreakpoint("2xl")
      else if (width >= BREAKPOINTS.xl) setBreakpoint("xl")
      else if (width >= BREAKPOINTS.lg) setBreakpoint("lg")
      else if (width >= BREAKPOINTS.md) setBreakpoint("md")
      else if (width >= BREAKPOINTS.sm) setBreakpoint("sm")
      else setBreakpoint("mobile")
    }

    checkBreakpoint()
    window.addEventListener("resize", checkBreakpoint)
    return () => window.removeEventListener("resize", checkBreakpoint)
  }, [])

  return breakpoint
}

/**
 * Custom hook to check if viewport matches a specific breakpoint
 * Usage:
 * const isMobile = useMediaQuery('mobile')
 * const isTablet = useMediaQuery('md')
 */
export function useMediaQuery(breakpoint: Breakpoint): boolean {
  const [matches, setMatches] = useState(() => {
    const query = `(min-width: ${BREAKPOINTS[breakpoint]}px)`
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const query = `(min-width: ${BREAKPOINTS[breakpoint]}px)`
    const media = window.matchMedia(query)

    const listener = () => setMatches(media.matches)
    media.addEventListener("change", listener)
    return () => media.removeEventListener("change", listener)
  }, [breakpoint])

  return matches
}

/**
 * Custom hook to check if viewport is mobile
 * Usage:
 * const isMobile = useIsMobile()
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < BREAKPOINTS.md)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  return isMobile
}

/**
 * Custom hook to check if viewport is tablet
 * Usage:
 * const isTablet = useIsTablet()
 */
export function useIsTablet(): boolean {
  const [isTablet, setIsTablet] = useState(false)

  useEffect(() => {
    const checkTablet = () => {
      const width = window.innerWidth
      setIsTablet(width >= BREAKPOINTS.md && width < BREAKPOINTS.lg)
    }

    checkTablet()
    window.addEventListener("resize", checkTablet)
    return () => window.removeEventListener("resize", checkTablet)
  }, [])

  return isTablet
}

/**
 * Custom hook to check if viewport is desktop
 * Usage:
 * const isDesktop = useIsDesktop()
 */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= BREAKPOINTS.lg)
    }

    checkDesktop()
    window.addEventListener("resize", checkDesktop)
    return () => window.removeEventListener("resize", checkDesktop)
  }, [])

  return isDesktop
}

/**
 * Get window dimensions
 * Usage:
 * const { width, height } = useWindowSize()
 */
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: 0,
    height: 0,
  })

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return windowSize
}

/**
 * Check if device is touch-enabled
 * Usage:
 * const isTouch = useIsTouchDevice()
 */
export function useIsTouchDevice(): boolean {
  const [isTouch] = useState(() => 
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0
  )

  return isTouch
}

/**
 * Device type detection
 */
export type DeviceType = "mobile" | "tablet" | "desktop"

export function useDeviceType(): DeviceType {
  const breakpoint = useBreakpoint()

  if (breakpoint === "mobile" || breakpoint === "sm") return "mobile"
  if (breakpoint === "md") return "tablet"
  return "desktop"
}

/**
 * Orientation detection
 */
export type Orientation = "portrait" | "landscape"

export function useOrientation(): Orientation {
  const [orientation, setOrientation] = useState<Orientation>("portrait")

  useEffect(() => {
    const checkOrientation = () => {
      setOrientation(
        window.innerHeight > window.innerWidth ? "portrait" : "landscape"
      )
    }

    checkOrientation()
    window.addEventListener("resize", checkOrientation)
    return () => window.removeEventListener("resize", checkOrientation)
  }, [])

  return orientation
}

/**
 * Utility to get responsive value based on breakpoint
 * Usage:
 * const columns = getResponsiveValue({
 *   mobile: 1,
 *   sm: 2,
 *   md: 3,
 *   lg: 4,
 *   xl: 5
 * }, breakpoint)
 */
export function getResponsiveValue<T>(
  values: Partial<Record<Breakpoint, T>>,
  currentBreakpoint: Breakpoint
): T | undefined {
  const breakpointOrder: Breakpoint[] = ["mobile", "sm", "md", "lg", "xl", "2xl"]
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint)

  // Find the nearest defined value at or below the current breakpoint
  for (let i = currentIndex; i >= 0; i--) {
    const bp = breakpointOrder[i]
    if (!bp) continue
    const value = values[bp]
    if (value !== undefined) return value
  }

  return undefined
}

/**
 * Responsive container max widths (Tailwind defaults)
 */
export const CONTAINER_MAX_WIDTHS = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const

/**
 * Common responsive padding values
 */
export const RESPONSIVE_PADDING = {
  mobile: "1rem", // 16px
  sm: "1.5rem", // 24px
  md: "2rem", // 32px
  lg: "3rem", // 48px
  xl: "4rem", // 64px
} as const

/**
 * Common responsive grid columns
 */
export const RESPONSIVE_GRID_COLS = {
  mobile: 1,
  sm: 2,
  md: 3,
  lg: 4,
  xl: 5,
  "2xl": 6,
} as const

/**
 * POS-specific responsive configurations
 */
export const POS_LAYOUT = {
  // Product grid columns for different screens
  productGrid: {
    mobile: 2, // 2 columns on mobile
    sm: 3, // 3 columns on small tablets
    md: 4, // 4 columns on tablets
    lg: 5, // 5 columns on desktop
    xl: 6, // 6 columns on large desktop
  },
  // Cart visibility
  showCartSidebar: {
    mobile: false, // Hidden on mobile (use drawer)
    md: true, // Show on tablet and up
  },
  // Category sidebar
  showCategorySidebar: {
    mobile: false, // Hidden on mobile
    lg: true, // Show on desktop
  },
} as const

/**
 * E-commerce specific responsive configurations
 */
export const ECOMMERCE_LAYOUT = {
  // Product listing grid
  productListing: {
    mobile: 1, // 1 column on mobile
    sm: 2, // 2 columns on small tablets
    md: 2, // 2 columns on tablets
    lg: 3, // 3 columns on desktop
    xl: 4, // 4 columns on large desktop
  },
  // Sidebar filters
  showFilterSidebar: {
    mobile: false, // Hidden on mobile (use drawer)
    lg: true, // Show on desktop
  },
} as const
