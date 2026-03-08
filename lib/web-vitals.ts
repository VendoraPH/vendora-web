import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals'

function sendToAnalytics(metric: any) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Web Vital:', metric.name, Math.round(metric.value), metric.rating)
  }

  // Send to analytics in production
  // Example: Google Analytics 4
  if (typeof window !== 'undefined' && (window as any).gtag) {
    ;(window as any).gtag('event', metric.name, {
      value: Math.round(metric.value),
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta,
    })
  }

  // Or send to your custom analytics endpoint
  if (process.env.NODE_ENV === 'production') {
    fetch('/api/analytics', {
      method: 'POST',
      body: JSON.stringify(metric),
      headers: { 'Content-Type': 'application/json' },
    }).catch(console.error)
  }
}

/**
 * Initialize Web Vitals reporting
 *
 * Tracks:
 * - CLS (Cumulative Layout Shift) - Target: < 0.1
 * - FCP (First Contentful Paint) - Target: < 1.8s
 * - FID (First Input Delay) - Target: < 100ms
 * - INP (Interaction to Next Paint) - Target: < 200ms
 * - LCP (Largest Contentful Paint) - Target: < 2.5s
 * - TTFB (Time to First Byte) - Target: < 600ms
 */
export function reportWebVitals() {
  try {
    onCLS(sendToAnalytics)
    onFCP(sendToAnalytics)
    onINP(sendToAnalytics)
    onLCP(sendToAnalytics)
    onTTFB(sendToAnalytics)
  } catch (err) {
    console.error('Failed to track web vitals:', err)
  }
}
