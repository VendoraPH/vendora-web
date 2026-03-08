import { create } from "zustand"

interface UIStore {
  // Sidebar state
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void

  // Cart drawer state
  cartDrawerOpen: boolean
  setCartDrawerOpen: (open: boolean) => void
  toggleCartDrawer: () => void

  // Filter drawer state
  filterDrawerOpen: boolean
  setFilterDrawerOpen: (open: boolean) => void
  toggleFilterDrawer: () => void

  // Modal states
  modals: Record<string, boolean>
  openModal: (modalId: string) => void
  closeModal: (modalId: string) => void
  toggleModal: (modalId: string) => void
}

/**
 * UI State Store
 *
 * Manages UI state (sidebars, drawers, modals, etc.)
 */
export const useUIStore = create<UIStore>((set, get) => ({
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),

  cartDrawerOpen: false,
  setCartDrawerOpen: (open) => set({ cartDrawerOpen: open }),
  toggleCartDrawer: () => set({ cartDrawerOpen: !get().cartDrawerOpen }),

  filterDrawerOpen: false,
  setFilterDrawerOpen: (open) => set({ filterDrawerOpen: open }),
  toggleFilterDrawer: () => set({ filterDrawerOpen: !get().filterDrawerOpen }),

  modals: {},
  openModal: (modalId) =>
    set((state) => ({ modals: { ...state.modals, [modalId]: true } })),
  closeModal: (modalId) =>
    set((state) => ({ modals: { ...state.modals, [modalId]: false } })),
  toggleModal: (modalId) =>
    set((state) => ({
      modals: { ...state.modals, [modalId]: !state.modals[modalId] },
    })),
}))
