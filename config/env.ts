/**
 * Environment Configuration
 *
 * Centralized access to environment variables with type safety
 */

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue
  if (!value) {
    console.warn(`Missing environment variable: ${key}`)
  }
  return value || ""
}

const getOptionalEnvVar = (key: string, defaultValue = ""): string => {
  const value = process.env[key]
  if (value === undefined) return defaultValue
  return value
}

const getBoolEnvVar = (key: string, defaultValue = false): boolean => {
  const value = process.env[key]
  if (value === undefined) return defaultValue
  return value === "true" || value === "1"
}

const getNumberEnvVar = (key: string, defaultValue: number): number => {
  const value = process.env[key]
  if (value === undefined) return defaultValue
  const num = parseInt(value, 10)
  return isNaN(num) ? defaultValue : num
}

export interface Environment {
  app: {
    name: string
    url: string
    env: string
    isDevelopment: boolean
    isProduction: boolean
  }
  api: {
    baseUrl: string
    version: string
    timeout: number
    withCredentials: boolean
  }
  auth: {
    jwtSecret: string
    tokenKey: string
    refreshTokenKey: string
    sessionTimeout: number
  }
  sanctum: {
    url: string
    statefulDomains: string
  }
  payment: {
    gcash: {
      enabled: boolean
      publicKey: string
    }
    paymaya: {
      enabled: boolean
      publicKey: string
    }
    stripe: {
      publishableKey: string
    }
  }
  storage: {
    url: string
    cdnUrl: string
  }
  features: {
    analytics: boolean
    liveChat: boolean
    barcodeScanner: boolean
    receiptPrinter: boolean
  }
  services: {
    googleMapsApiKey: string
    gaTrackingId: string
    fbPixelId: string
  }
  business: {
    currency: string
    currencySymbol: string
    taxRate: number
    timezone: string
  }
  contact: {
    supportEmail: string
    salesEmail: string
  }
  social: {
    facebook: string
    instagram: string
    twitter: string
  }
  debug: {
    enabled: boolean
    showErrorDetails: boolean
    mockApi: boolean
  }
}

const createEnv = (): Environment => ({
  // Application
  app: {
    name: getEnvVar("NEXT_PUBLIC_APP_NAME", "Vendora"),
    url: getEnvVar("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
    env: getEnvVar("NEXT_PUBLIC_APP_ENV", "development"),
    isDevelopment: getEnvVar("NEXT_PUBLIC_APP_ENV", "development") === "development",
    isProduction: getEnvVar("NEXT_PUBLIC_APP_ENV", "development") === "production",
  },

  // API Configuration
  api: {
    baseUrl: getEnvVar("NEXT_PUBLIC_API_URL", "https://vendora-api.abedubas.dev/api"),
    version: getOptionalEnvVar("NEXT_PUBLIC_API_VERSION", ""),
    timeout: getNumberEnvVar("NEXT_PUBLIC_API_TIMEOUT", 30000),
    withCredentials: getBoolEnvVar("NEXT_PUBLIC_API_WITH_CREDENTIALS", false),
  },

  // Authentication
  auth: {
    jwtSecret: getOptionalEnvVar("NEXT_PUBLIC_JWT_SECRET", ""),
    tokenKey: getEnvVar("NEXT_PUBLIC_AUTH_TOKEN_KEY", "vendora_access_token"),
    refreshTokenKey: getEnvVar("NEXT_PUBLIC_REFRESH_TOKEN_KEY", "vendora_refresh_token"),
    sessionTimeout: getNumberEnvVar("NEXT_PUBLIC_SESSION_TIMEOUT", 60)
  },

  // Laravel Sanctum
  sanctum: {
    url: getEnvVar("NEXT_PUBLIC_SANCTUM_URL", "http://localhost:8000"),
    statefulDomains: getEnvVar("NEXT_PUBLIC_SANCTUM_STATEFUL_DOMAINS", "localhost:3000"),
  },

  // Payment Gateways
  payment: {
    gcash: {
      enabled: getBoolEnvVar("NEXT_PUBLIC_GCASH_ENABLED", true),
      publicKey: getOptionalEnvVar("NEXT_PUBLIC_GCASH_PUBLIC_KEY", ""),
    },
    paymaya: {
      enabled: getBoolEnvVar("NEXT_PUBLIC_PAYMAYA_ENABLED", true),
      publicKey: getOptionalEnvVar("NEXT_PUBLIC_PAYMAYA_PUBLIC_KEY", ""),
    },
    stripe: {
      publishableKey: getOptionalEnvVar("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", ""),
    },
  },

  // Storage & Assets
  storage: {
    url: getEnvVar("NEXT_PUBLIC_STORAGE_URL", "http://localhost:8000/storage"),
    cdnUrl: getOptionalEnvVar("NEXT_PUBLIC_CDN_URL", ""),
  },

  // Feature Flags
  features: {
    analytics: getBoolEnvVar("NEXT_PUBLIC_ENABLE_ANALYTICS", false),
    liveChat: getBoolEnvVar("NEXT_PUBLIC_ENABLE_LIVE_CHAT", false),
    barcodeScanner: getBoolEnvVar("NEXT_PUBLIC_ENABLE_BARCODE_SCANNER", true),
    receiptPrinter: getBoolEnvVar("NEXT_PUBLIC_ENABLE_RECEIPT_PRINTER", true),
  },

  // Third-party Services
  services: {
    googleMapsApiKey: getOptionalEnvVar("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", ""),
    gaTrackingId: getOptionalEnvVar("NEXT_PUBLIC_GA_TRACKING_ID", ""),
    fbPixelId: getOptionalEnvVar("NEXT_PUBLIC_FB_PIXEL_ID", ""),
  },

  // Business Configuration
  business: {
    currency: getEnvVar("NEXT_PUBLIC_CURRENCY", "PHP"),
    currencySymbol: getEnvVar("NEXT_PUBLIC_CURRENCY_SYMBOL", "₱"),
    taxRate: getNumberEnvVar("NEXT_PUBLIC_TAX_RATE", 12),
    timezone: getEnvVar("NEXT_PUBLIC_TIMEZONE", "Asia/Manila"),
  },

  // Contact
  contact: {
    supportEmail: getEnvVar("NEXT_PUBLIC_SUPPORT_EMAIL", "support@vendora.com"),
    salesEmail: getEnvVar("NEXT_PUBLIC_SALES_EMAIL", "sales@vendora.com"),
  },

  // Social Media
  social: {
    facebook: getOptionalEnvVar("NEXT_PUBLIC_FACEBOOK_URL", ""),
    instagram: getOptionalEnvVar("NEXT_PUBLIC_INSTAGRAM_URL", ""),
    twitter: getOptionalEnvVar("NEXT_PUBLIC_TWITTER_URL", ""),
  },

  // Development/Debug
  debug: {
    enabled: getBoolEnvVar("NEXT_PUBLIC_DEBUG", false),
    showErrorDetails: getBoolEnvVar("NEXT_PUBLIC_SHOW_ERROR_DETAILS", false),
    mockApi: getBoolEnvVar("NEXT_PUBLIC_MOCK_API", false),
  },
})

export const env = createEnv()
