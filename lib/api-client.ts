/**
 * API Client Configuration
 *
 * High-level API helpers that wrap axiosClient from axios-client.ts.
 * Uses the single shared Axios instance so all requests benefit from
 * the same token injection, 401 handling, and user-type-aware refresh logic.
 */

import { AxiosRequestConfig } from "axios";
import axiosClient, { tokenManager } from "@/lib/axios-client";
import { env } from "@/config/env";

// Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

/**
 * Set auth tokens in storage
 */
export const setAuthTokens = (token: string, refreshToken?: string): void => {
  if (typeof window === "undefined") return;
  tokenManager.setAccessToken(token);
  localStorage.setItem(env.auth.tokenKey, token);
  if (refreshToken) {
    tokenManager.setRefreshToken(refreshToken);
    localStorage.setItem(env.auth.refreshTokenKey, refreshToken);
  }
};

/**
 * Clear auth tokens from storage
 */
export const clearAuthTokens = (): void => {
  if (typeof window === "undefined") return;
  tokenManager.clearTokens();
  localStorage.removeItem(env.auth.tokenKey);
  localStorage.removeItem(env.auth.refreshTokenKey);
};

// Re-export axiosClient as apiClient for backwards compatibility
export const apiClient = axiosClient;

/**
 * API Request Helper Functions
 *
 * These helpers use the shared axiosClient which already has:
 * - Token injection via request interceptor
 * - 401 handling with user-type-aware token refresh
 * - Proper redirect to admin/vendor login on auth failure
 */
export const api = {
  /**
   * GET request
   */
  get: async <T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const response = await axiosClient.get<ApiResponse<T>>(url, config);
    return response.data.data as T;
  },

  /**
   * POST request
   */
  post: async <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const response = await axiosClient.post<ApiResponse<T>>(url, data, config);
    return response.data.data as T;
  },

  /**
   * PUT request
   */
  put: async <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const response = await axiosClient.put<ApiResponse<T>>(url, data, config);
    return response.data.data as T;
  },

  /**
   * PATCH request
   */
  patch: async <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const response = await axiosClient.patch<ApiResponse<T>>(url, data, config);
    return response.data.data as T;
  },

  /**
   * DELETE request
   */
  delete: async <T = any>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    const response = await axiosClient.delete<ApiResponse<T>>(url, config);
    return response.data.data as T;
  },

  /**
   * Upload file(s)
   */
  upload: async <T = any>(
    url: string,
    formData: FormData,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<T> => {
    const response = await axiosClient.post<ApiResponse<T>>(url, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress,
    });
    return response.data.data as T;
  },
};

export default api;
