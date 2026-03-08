/**
 * POS Auth Endpoints
 *
 * Thin wrappers around the centralized API_ENDPOINTS for POS auth flows.
 * Keeps POS routes consistent and avoids hardcoding in pages/components.
 */

import { API_ENDPOINTS } from "@/config/api-endpoints"

export const posAuthEndpoints = {
  register: () => API_ENDPOINTS.VENDOR.REGISTER,
  login: () => API_ENDPOINTS.VENDOR.LOGIN,
  logout: () => API_ENDPOINTS.VENDOR.LOGOUT,
}

export default posAuthEndpoints
