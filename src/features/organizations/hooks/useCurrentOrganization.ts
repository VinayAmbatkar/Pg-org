import { useEffect } from 'react'
import { useUiStore } from '@/app/providers/uiStore'
import { useAuth } from '@/infrastructure/auth/AuthProvider'
import type { Organization } from '@/types/api'

/** Resolves which organization is "current" for the session — the one the user last picked,
 * falling back to their first organization. Keeps the client-owned selection in sync with
 * server-fetched org list (e.g. after the selected org disappears). */
export function useCurrentOrganization(): Organization | null {
  const { organizations } = useAuth()
  const currentOrganizationId = useUiStore((s) => s.currentOrganizationId)
  const setCurrentOrganizationId = useUiStore((s) => s.setCurrentOrganizationId)

  const current = organizations.find((org) => org.id === currentOrganizationId) ?? organizations[0] ?? null

  useEffect(() => {
    if (current && current.id !== currentOrganizationId) {
      setCurrentOrganizationId(current.id)
    }
  }, [current, currentOrganizationId, setCurrentOrganizationId])

  return current
}
