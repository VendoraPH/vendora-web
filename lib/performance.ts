import dynamic from 'next/dynamic'

/**
 * Lazy load component with loading state
 *
 * @example
 * const HeavyChart = lazyLoad(() => import('./HeavyChart'))
 */
export function lazyLoad<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  loading?: () => React.ReactNode
) {
  return dynamic(importFn, {
    loading: loading,
    ssr: false,
  })
}

/**
 * Debounce function for expensive operations
 *
 * @example
 * const debouncedSearch = debounce(searchFunction, 300)
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }

    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Check if user prefers reduced motion
 * Use this to disable animations for accessibility
 *
 * @example
 * if (!prefersReducedMotion()) {
 *   // Apply animations
 * }
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Throttle function to limit execution rate
 *
 * @example
 * const throttledScroll = throttle(handleScroll, 100)
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}
