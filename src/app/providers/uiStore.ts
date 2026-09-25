import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Client-only UI state: which org/property the user is currently looking at, and sidebar
// collapse state. Never a cache of server data (properties/orgs themselves live in TanStack Query).
interface UiState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  currentOrganizationId: string | null
  setCurrentOrganizationId: (id: string | null) => void
  currentPropertyId: string | null
  setCurrentPropertyId: (id: string | null) => void
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      currentOrganizationId: null,
      setCurrentOrganizationId: (id) => set({ currentOrganizationId: id, currentPropertyId: null }),
      currentPropertyId: null,
      setCurrentPropertyId: (id) => set({ currentPropertyId: id }),
    }),
    { name: 'pgmet.ui' },
  ),
)
