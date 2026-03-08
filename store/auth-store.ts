import { create } from "zustand"
import { persist } from "zustand/middleware"
import { AuthState, User } from "@/types"

interface AuthStore extends AuthState {
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  login: (user: User, token: string) => void
  logout: () => void
}

/**
 * Authentication Store
 *
 * Manages authentication state with persistence
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      userType: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      requiresTwoFactor: false,
      requiresEmailVerification: false,
      accountLocked: false,
      lockoutExpiry: null,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      login: (user, token) => {
        // Store token in localStorage
        localStorage.setItem("auth-token", token)
        set({
          user,
          isAuthenticated: true,
          error: null,
        })
      },

      logout: () => {
        // Clear token from localStorage
        localStorage.removeItem("auth-token")
        set({
          user: null,
          userType: null,
          isAuthenticated: false,
          error: null,
          requiresTwoFactor: false,
          requiresEmailVerification: false,
          accountLocked: false,
          lockoutExpiry: null,
        })
      },
    }),
    {
      name: "auth-storage",
    }
  )
)
