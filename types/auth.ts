/**
 * Authentication Type Definitions
 */

// User Types
export type UserType = "admin" | "vendor"

export type AdminRole = "super_admin" | "support" | "billing"

export type VendorStatus = "active" | "trial" | "canceled" | "past_due"

export type SubscriptionPlan = "basic" | "pro" | "enterprise"

// Admin User Interface
export interface AdminUser {
  id: string
  full_name: string
  email: string
  role: AdminRole
  is_email_verified: boolean
  two_factor_enabled: boolean
  last_login_at: string | null
  status: "active" | "suspended"
  created_at: string
  updated_at: string
}

// Vendor User Interface
export interface VendorUser {
  id: string
  business_name: string
  email: string
  subscription_plan: string | null
  subscription_status: VendorStatus
  store_domain: string | null
  is_email_verified: boolean
  two_factor_enabled: boolean
  last_login_at: string | null
  status: "active" | "suspended" | "deleted"
  created_at: string
  updated_at: string
}

// Generic User Type
export type User = AdminUser | VendorUser

// Login Credentials
export interface AdminLoginCredentials {
  email: string
  password: string
  user_type: "admin"
}

export interface VendorLoginCredentials {
  email: string
  password: string
  user_type: "vendor"
}

export type LoginCredentials = AdminLoginCredentials | VendorLoginCredentials

// Register Data
export interface AdminRegisterData {
  full_name: string
  email: string
  password: string
  password_confirmation: string
  user_type: "admin"
}

export interface VendorRegisterData {
  name?: string
  business_name: string
  email: string
  password: string
  password_confirmation: string
  subscription_plan: string
  user_type: "vendor"
}

export type RegisterData = AdminRegisterData | VendorRegisterData

// 2FA Verification
export interface TwoFactorVerification {
  email: string
  code: string
  user_type: UserType
}

// Email Verification
export interface EmailVerification {
  token: string
  user_type: UserType
}

// Password Reset
export interface PasswordResetRequest {
  email: string
  user_type: UserType
}

export interface PasswordReset {
  email: string
  token: string
  password: string
  password_confirmation: string
  user_type: UserType
}

// Auth State
export interface AuthState {
  user: User | null
  userType: UserType | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  requiresTwoFactor: boolean
  requiresEmailVerification: boolean
  accountLocked: boolean
  lockoutExpiry: string | null
}

// Auth Response
export interface AuthResponse {
  user: User
  token: string
  session_token: string
  refreshToken?: string
  expires_in?: number
  requires_two_factor?: boolean
  requires_email_verification?: boolean
}

// Session Info
export interface SessionInfo {
  id: string
  ip_address: string
  user_agent: string
  created_at: string
  expires_at: string
  is_active: boolean
}
