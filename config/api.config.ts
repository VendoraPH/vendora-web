/**
 * Centralized API Configuration
 * Single source of truth for all API-related configuration
 */

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
  TIMEOUT: Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 60000, // Increased to 60s for analytics endpoints
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const

export const TOKEN_CONFIG = {
  ACCESS_TOKEN_KEY: 'vendora_access_token',
  REFRESH_TOKEN_KEY: 'vendora_refresh_token',
  USER_TYPE_KEY: 'vendora_user_type',
  TOKEN_EXPIRY_KEY: 'vendora_token_expiry',
  USER_PROFILE_KEY: 'vendora_user_profile',
} as const

export const API_HEADERS = {
  CONTENT_TYPE: 'application/json',
  ACCEPT: 'application/json',
} as const
