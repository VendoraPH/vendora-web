/**
 * Authentication Service
 *
 * Handles all authentication-related API calls
 */

import api, { setAuthTokens, clearAuthTokens } from "@/lib/api-client"
import { endpoints } from "@/lib/api-endpoints"
import { User, LoginCredentials, RegisterData, AuthResponse } from "@/types"

export const authService = {
  /**
   * Login user
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>(endpoints.auth.login(), credentials)

    // Store tokens
    setAuthTokens(response.token, response.refreshToken)

    return response
  },

  /**
   * Register new user
   */
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>(endpoints.auth.register(), data)

    // Store tokens
    setAuthTokens(response.token, response.refreshToken)

    return response
  },

  /**
   * Logout user
   */
  logout: async (): Promise<void> => {
    try {
      await api.post(endpoints.auth.logout())
    } finally {
      // Clear tokens even if API call fails
      clearAuthTokens()
    }
  },

  /**
   * Get current authenticated user
   */
  me: async (): Promise<User> => {
    return api.get<User>(endpoints.auth.me())
  },

  /**
   * Send password reset email
   */
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    return api.post(endpoints.auth.forgotPassword(), { email })
  },

  /**
   * Reset password with token
   */
  resetPassword: async (
    token: string,
    email: string,
    password: string,
    passwordConfirmation: string
  ): Promise<{ message: string }> => {
    return api.post(endpoints.auth.resetPassword(), {
      token,
      email,
      password,
      password_confirmation: passwordConfirmation,
    })
  },

  /**
   * Verify email with token
   */
  verifyEmail: async (token: string): Promise<{ message: string }> => {
    return api.post(endpoints.auth.verifyEmail(), { token })
  },

  /**
   * Resend email verification
   */
  resendVerification: async (): Promise<{ message: string }> => {
    return api.post(endpoints.auth.resendVerification())
  },
}
