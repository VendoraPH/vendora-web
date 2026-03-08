/**
 * Centralized Authentication Service with JWT
 * All authentication API calls go through here
 * NO HARDCODED ENDPOINTS - uses centralized config
 */

import axiosClient, { tokenManager } from '@/lib/axios-client'
import { API_ENDPOINTS } from '@/config/api-endpoints'
import { TOKEN_CONFIG } from '@/config/api.config'
import {
  AdminLoginCredentials,
  VendorLoginCredentials,
  AdminRegisterData,
  VendorRegisterData,
  AuthResponse,
  User,
  TwoFactorVerification,
  PasswordReset,
} from '@/types/auth'

// Response type for API calls
interface ApiResponse<T = any> {
  success: boolean
  message: string
  data: T
}

interface PosAuthResponse extends AuthResponse {
  payment_url?: string
}

const readString = (value: unknown): string => (typeof value === 'string' ? value : '')

const getTokenFromRecord = (record: Record<string, unknown>): string =>
  readString(record.token) || readString(record.access_token)

const getRefreshTokenFromRecord = (record: Record<string, unknown>): string | undefined =>
  readString(record.refreshToken) || readString(record.refresh_token) || undefined

const storeUserProfile = (user?: User) => {
  if (typeof window === 'undefined' || !user) return
  localStorage.setItem(TOKEN_CONFIG.USER_PROFILE_KEY, JSON.stringify(user))
}

const clearUserProfile = () => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_CONFIG.USER_PROFILE_KEY)
}

const normalizePosAuthResponse = (raw: unknown): ApiResponse<PosAuthResponse> => {
  if (raw && typeof raw === 'object') {
    const record = raw as Record<string, unknown>

    if ('success' in record && 'data' in record) {
      const data = record.data as Record<string, unknown>
      const token = getTokenFromRecord(data)
      const refreshToken = getRefreshTokenFromRecord(data)

      return {
        success: Boolean(record.success),
        message: typeof record.message === 'string' ? record.message : 'OK',
        data: {
          ...(data as unknown as PosAuthResponse),
          token,
          refreshToken,
        },
      }
    }

    const message = typeof record.message === 'string' ? record.message : 'OK'
    const token = getTokenFromRecord(record)
    const refreshToken = getRefreshTokenFromRecord(record)
    const requiresTwoFactor =
      typeof record.requires_two_factor === 'boolean' ? record.requires_two_factor : undefined
    const requiresEmailVerification =
      typeof record.requires_email_verification === 'boolean'
        ? record.requires_email_verification
        : undefined

    return {
      success: Boolean(token || requiresTwoFactor || requiresEmailVerification),
      message,
      data: {
        user: (record.user ?? {}) as User,
        token,
        session_token:
          typeof record.session_token === 'string' ? record.session_token : '',
        refreshToken,
        expires_in: typeof record.expires_in === 'number' ? record.expires_in : undefined,
        requires_two_factor: requiresTwoFactor,
        requires_email_verification: requiresEmailVerification,
        payment_url: typeof record.payment_url === 'string' ? record.payment_url : undefined,
      },
    }
  }

  return {
    success: false,
    message: 'Invalid response from server',
    data: {
      user: {} as User,
      token: '',
      session_token: '',
    },
  }
}

export const authService = {
  /**
   * Admin Authentication Methods
   */
  admin: {
    /**
     * Register a new admin user
     */
    async register(data: AdminRegisterData): Promise<ApiResponse<AuthResponse>> {
      const response = await axiosClient.post<ApiResponse<AuthResponse>>(
        API_ENDPOINTS.ADMIN.REGISTER,
        data
      )

      // Store token if registration is successful and returns a token
      const registerData = (response.data.data ?? {}) as unknown as Record<string, unknown>
      const registerToken = getTokenFromRecord(registerData)
      if (response.data.success && registerToken) {
        tokenManager.setAccessToken(registerToken)
        tokenManager.setUserType('admin')
        storeUserProfile(response.data.data?.user)

        if (response.data.data.expires_in) {
          tokenManager.setTokenExpiry(response.data.data.expires_in)
        }
      }

      return response.data
    },

    /**
     * Login admin user
     */
    async login(credentials: AdminLoginCredentials): Promise<ApiResponse<AuthResponse>> {
      const response = await axiosClient.post<ApiResponse<AuthResponse>>(
        API_ENDPOINTS.ADMIN.LOGIN,
        credentials
      )

      // API returns token at top level: { success, token, user, ... }
      // Not nested in data: { success, data: { token, user } }
      const responseData = response.data as unknown as Record<string, unknown>
      const loginToken = getTokenFromRecord(responseData)

      // Also check nested data structure for backwards compatibility
      const nestedData = (responseData.data ?? {}) as Record<string, unknown>
      const nestedToken = getTokenFromRecord(nestedData)
      const finalToken = loginToken || nestedToken

      console.log('🔐 Admin login response:', {
        success: response.data.success,
        hasTopLevelToken: !!loginToken,
        hasNestedToken: !!nestedToken,
        tokenPreview: finalToken ? finalToken.substring(0, 20) + '...' : null
      })

      if (response.data.success && finalToken) {
        tokenManager.setAccessToken(finalToken)
        tokenManager.setUserType('admin')
        // User can be at top level or nested
        const user = (responseData.user ?? nestedData.user) as User | undefined
        storeUserProfile(user)

        const expiresIn = responseData.expires_in ?? nestedData.expires_in
        if (expiresIn) {
          tokenManager.setTokenExpiry(expiresIn as number)
        }
      }

      return response.data
    },

    /**
     * Verify 2FA code
     */
    async verify2FA(data: TwoFactorVerification): Promise<ApiResponse<AuthResponse>> {
      const response = await axiosClient.post<ApiResponse<AuthResponse>>(
        API_ENDPOINTS.ADMIN.VERIFY_2FA,
        data
      )

      const verifyData = (response.data.data ?? {}) as unknown as Record<string, unknown>
      const verifyToken = getTokenFromRecord(verifyData)
      if (response.data.success && verifyToken) {
        tokenManager.setAccessToken(verifyToken)
        tokenManager.setUserType('admin')
        storeUserProfile(response.data.data?.user)

        if (response.data.data.expires_in) {
          tokenManager.setTokenExpiry(response.data.data.expires_in)
        }
      }

      return response.data
    },

    /**
     * Logout admin user
     */
    async logout(): Promise<void> {
      try {
        await axiosClient.post(API_ENDPOINTS.ADMIN.LOGOUT)
      } finally {
        tokenManager.clearTokens()
        clearUserProfile()
      }
    },

    /**
     * Refresh admin token
     */
    async refresh(): Promise<ApiResponse<AuthResponse>> {
      const response = await axiosClient.post<ApiResponse<AuthResponse>>(
        API_ENDPOINTS.ADMIN.REFRESH
      )
      const refreshData = (response.data.data ?? {}) as unknown as Record<string, unknown>
      const refreshToken = getTokenFromRecord(refreshData)
      if (response.data.success && refreshToken) {
        tokenManager.setAccessToken(refreshToken)
        tokenManager.setUserType('admin')
        storeUserProfile(response.data.data?.user)

        if (response.data.data.expires_in) {
          tokenManager.setTokenExpiry(response.data.data.expires_in)
        }
      }
      return response.data
    },

    /**
     * Get current authenticated admin user
     */
    async me(): Promise<User> {
      const response = await axiosClient.get<ApiResponse<{ user: User }>>(API_ENDPOINTS.ADMIN.ME)
      storeUserProfile(response.data.data.user)
      return response.data.data.user
    },

    /**
     * Request password reset
     */
    async forgotPassword(email: string): Promise<{ message: string }> {
      const response = await axiosClient.post<ApiResponse>(
        API_ENDPOINTS.ADMIN.FORGOT_PASSWORD,
        { email, user_type: 'admin' }
      )
      return { message: response.data.message }
    },

    /**
     * Reset password with token
     */
    async resetPassword(data: PasswordReset): Promise<{ message: string }> {
      const response = await axiosClient.post<ApiResponse>(
        API_ENDPOINTS.ADMIN.RESET_PASSWORD,
        data
      )
      return { message: response.data.message }
    },

    /**
     * Verify email with token
     */
    async verifyEmail(token: string): Promise<{ message: string; user: User }> {
      const response = await axiosClient.post<ApiResponse<{ user: User }>>(
        API_ENDPOINTS.ADMIN.VERIFY_EMAIL,
        { token, user_type: 'admin' }
      )
      return {
        message: response.data.message,
        user: response.data.data.user,
      }
    },

    /**
     * Resend email verification
     */
    async resendVerification(): Promise<{ message: string }> {
      const response = await axiosClient.post<ApiResponse>(
        API_ENDPOINTS.ADMIN.RESEND_VERIFICATION
      )
      return { message: response.data.message }
    },
  },

  /**
   * Vendor Authentication Methods
   */
  vendor: {
    /**
     * Register a new vendor
     */
    async register(data: VendorRegisterData): Promise<ApiResponse<{ user: User; payment_url?: string; message: string }>> {
      const response = await axiosClient.post<ApiResponse>(API_ENDPOINTS.VENDOR.REGISTER, data)
      const registerData = (response.data.data ?? {}) as unknown as Record<string, unknown>
      const registerToken = getTokenFromRecord(registerData)
      if (response.data.success && registerToken) {
        tokenManager.setAccessToken(registerToken)
        tokenManager.setUserType('vendor')
        storeUserProfile(response.data.data?.user)

        if (response.data.data.expires_in) {
          tokenManager.setTokenExpiry(response.data.data.expires_in)
        }
      }
      return response.data
    },

    /**
     * Login vendor user
     */
    async login(credentials: VendorLoginCredentials): Promise<ApiResponse<AuthResponse>> {
      const response = await axiosClient.post<ApiResponse<AuthResponse>>(
        API_ENDPOINTS.VENDOR.LOGIN,
        credentials
      )

      // API returns token at top level: { success, token, user, ... }
      // Not nested in data: { success, data: { token, user } }
      const responseData = response.data as unknown as Record<string, unknown>
      const loginToken = getTokenFromRecord(responseData)

      // Also check nested data structure for backwards compatibility
      const nestedData = (responseData.data ?? {}) as Record<string, unknown>
      const nestedToken = getTokenFromRecord(nestedData)
      const finalToken = loginToken || nestedToken

      if (response.data.success && finalToken) {
        tokenManager.setAccessToken(finalToken)
        tokenManager.setUserType('vendor')
        // User can be at top level or nested
        const user = (responseData.user ?? nestedData.user) as User | undefined
        storeUserProfile(user)

        const expiresIn = responseData.expires_in ?? nestedData.expires_in
        if (expiresIn) {
          tokenManager.setTokenExpiry(expiresIn as number)
        }
      }

      return response.data
    },

    /**
     * Logout vendor user
     */
    async logout(): Promise<void> {
      try {
        await axiosClient.post(API_ENDPOINTS.VENDOR.LOGOUT)
      } finally {
        tokenManager.clearTokens()
        clearUserProfile()
      }
    },

    /**
     * Refresh vendor token
     */
    async refresh(): Promise<ApiResponse<AuthResponse>> {
      const response = await axiosClient.post<ApiResponse<AuthResponse>>(
        API_ENDPOINTS.VENDOR.REFRESH
      )
      const refreshData = (response.data.data ?? {}) as unknown as Record<string, unknown>
      const refreshToken = getTokenFromRecord(refreshData)
      if (response.data.success && refreshToken) {
        tokenManager.setAccessToken(refreshToken)
        tokenManager.setUserType('vendor')
        storeUserProfile(response.data.data?.user)

        if (response.data.data.expires_in) {
          tokenManager.setTokenExpiry(response.data.data.expires_in)
        }
      }
      return response.data
    },

    /**
     * Get current authenticated vendor user
     */
    async me(): Promise<User> {
      const response = await axiosClient.get<ApiResponse<{ user: User }>>(API_ENDPOINTS.VENDOR.ME)
      storeUserProfile(response.data.data.user)
      return response.data.data.user
    },

    /**
     * Verify vendor 2FA
     */
    async verify2FA(data: TwoFactorVerification): Promise<ApiResponse<AuthResponse>> {
      const response = await axiosClient.post<ApiResponse<AuthResponse>>(
        API_ENDPOINTS.VENDOR.VERIFY_2FA,
        data
      )
      const verifyData = (response.data.data ?? {}) as unknown as Record<string, unknown>
      const verifyToken = getTokenFromRecord(verifyData)
      if (response.data.success && verifyToken) {
        tokenManager.setAccessToken(verifyToken)
        tokenManager.setUserType('vendor')
        storeUserProfile(response.data.data?.user)

        if (response.data.data.expires_in) {
          tokenManager.setTokenExpiry(response.data.data.expires_in)
        }
      }
      return response.data
    },

    /**
     * Request password reset
     */
    async forgotPassword(email: string): Promise<{ message: string }> {
      const response = await axiosClient.post<ApiResponse>(
        API_ENDPOINTS.VENDOR.FORGOT_PASSWORD,
        { email, user_type: 'vendor' }
      )
      return { message: response.data.message }
    },

    /**
     * Reset password with token
     */
    async resetPassword(data: PasswordReset): Promise<{ message: string }> {
      const response = await axiosClient.post<ApiResponse>(
        API_ENDPOINTS.VENDOR.RESET_PASSWORD,
        data
      )
      return { message: response.data.message }
    },

    /**
     * Verify email with token
     */
    async verifyEmail(token: string): Promise<{ message: string; user: User }> {
      const response = await axiosClient.post<ApiResponse<{ user: User }>>(
        API_ENDPOINTS.VENDOR.VERIFY_EMAIL,
        { token, user_type: 'vendor' }
      )
      return {
        message: response.data.message,
        user: response.data.data.user,
      }
    },

    /**
     * Resend email verification
     */
    async resendVerification(): Promise<{ message: string }> {
      const response = await axiosClient.post<ApiResponse>(
        API_ENDPOINTS.VENDOR.RESEND_VERIFICATION
      )
      return { message: response.data.message }
    },
  },

  /**
   * POS Authentication Methods
   */
  pos: {
    /**
     * Register a new POS vendor user
     */
    async register(data: VendorRegisterData): Promise<ApiResponse<PosAuthResponse>> {
      const response = await axiosClient.post(API_ENDPOINTS.VENDOR.REGISTER, data)
      const normalized = normalizePosAuthResponse(response.data)

      if (normalized.success && normalized.data.token) {
        tokenManager.setAccessToken(normalized.data.token)
        tokenManager.setUserType('vendor')
        storeUserProfile(normalized.data.user)

        if (normalized.data.expires_in) {
          tokenManager.setTokenExpiry(normalized.data.expires_in)
        }
      }

      return normalized
    },

    /**
     * Login POS vendor user
     */
    async login(credentials: VendorLoginCredentials): Promise<ApiResponse<PosAuthResponse>> {
      const response = await axiosClient.post(API_ENDPOINTS.VENDOR.LOGIN, credentials)
      const normalized = normalizePosAuthResponse(response.data)

      // Debug logging in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 POS Login Response:', {
          success: normalized.success,
          hasToken: !!normalized.data.token,
          tokenPreview: normalized.data.token ? normalized.data.token.substring(0, 15) + '...' : 'none',
        })
      }

      if (normalized.success && normalized.data.token) {
        tokenManager.setAccessToken(normalized.data.token)
        tokenManager.setUserType('vendor')
        storeUserProfile(normalized.data.user)

        if (normalized.data.expires_in) {
          tokenManager.setTokenExpiry(normalized.data.expires_in)
        }

        // Verify token was stored correctly
        if (process.env.NODE_ENV === 'development') {
          const storedToken = tokenManager.getAccessToken()
          console.log('🔐 Token verification:', {
            stored: !!storedToken,
            matches: storedToken === normalized.data.token,
          })
        }
      }

      return normalized
    },

    /**
     * Verify POS vendor 2FA
     */
    async verify2FA(data: TwoFactorVerification): Promise<ApiResponse<PosAuthResponse>> {
      const response = await axiosClient.post(API_ENDPOINTS.VENDOR.VERIFY_2FA, data)
      const normalized = normalizePosAuthResponse(response.data)

      if (normalized.success && normalized.data.token) {
        tokenManager.setAccessToken(normalized.data.token)
        tokenManager.setUserType('vendor')
        storeUserProfile(normalized.data.user)

        if (normalized.data.expires_in) {
          tokenManager.setTokenExpiry(normalized.data.expires_in)
        }
      }

      return normalized
    },

    /**
     * Logout POS vendor user
     */
    async logout(): Promise<void> {
      try {
        await axiosClient.post(API_ENDPOINTS.VENDOR.LOGOUT)
      } finally {
        tokenManager.clearTokens()
        clearUserProfile()
      }
    },

    /**
     * Refresh POS vendor token
     */
    async refresh(): Promise<ApiResponse<AuthResponse>> {
      const response = await axiosClient.post<ApiResponse<AuthResponse>>(
        API_ENDPOINTS.VENDOR.REFRESH
      )
      const refreshData = (response.data.data ?? {}) as unknown as Record<string, unknown>
      const refreshToken = getTokenFromRecord(refreshData)
      if (response.data.success && refreshToken) {
        tokenManager.setAccessToken(refreshToken)
        tokenManager.setUserType('vendor')
        storeUserProfile(response.data.data?.user)

        if (response.data.data.expires_in) {
          tokenManager.setTokenExpiry(response.data.data.expires_in)
        }
      }
      return response.data
    },

    /**
     * Get current authenticated vendor user (POS)
     */
    async me(): Promise<User> {
      const response = await axiosClient.get<ApiResponse<{ user: User }>>(API_ENDPOINTS.VENDOR.ME)
      storeUserProfile(response.data.data.user)
      return response.data.data.user
    },

    /**
     * Request password reset (POS)
     */
    async forgotPassword(email: string): Promise<{ message: string }> {
      const response = await axiosClient.post<ApiResponse>(
        API_ENDPOINTS.VENDOR.FORGOT_PASSWORD,
        { email, user_type: 'vendor' }
      )
      return { message: response.data.message }
    },

    /**
     * Reset password with token (POS)
     */
    async resetPassword(data: PasswordReset): Promise<{ message: string }> {
      const response = await axiosClient.post<ApiResponse>(
        API_ENDPOINTS.VENDOR.RESET_PASSWORD,
        data
      )
      return { message: response.data.message }
    },

    /**
     * Verify email with token (POS)
     */
    async verifyEmail(token: string): Promise<{ message: string; user: User }> {
      const response = await axiosClient.post<ApiResponse<{ user: User }>>(
        API_ENDPOINTS.VENDOR.VERIFY_EMAIL,
        { token, user_type: 'vendor' }
      )
      return {
        message: response.data.message,
        user: response.data.data.user,
      }
    },

    /**
     * Resend email verification (POS)
     */
    async resendVerification(): Promise<{ message: string }> {
      const response = await axiosClient.post<ApiResponse>(
        API_ENDPOINTS.VENDOR.RESEND_VERIFICATION
      )
      return { message: response.data.message }
    },
  },
}

// Export token manager for use in other parts of the app
export { tokenManager }
