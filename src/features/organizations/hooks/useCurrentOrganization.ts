import { useEffect, useMemo } from 'react'
import { useUiStore } from '@/app/providers/uiStore'
import { useAuth } from '@/infrastructure/auth/AuthProvider'
import { effectiveRole } from '@/infrastructure/permissions/permissions'
import type { Organization } from '@/types/api'

/** Resolves which organization is "current" for the session — the one the user last picked,
 * falling back to their first organization. Keeps the client-owned selection in sync with
 * server-fetched org list (e.g. after the selected org disappears). */
export function useCurrentOrganization(): Organization | null {
  const { organizations, user } = useAuth()
  const currentOrganizationId = useUiStore((s) => s.currentOrganizationId)
  const setCurrentOrganizationId = useUiStore((s) => s.setCurrentOrganizationId)

  const current = organizations.find((org) => org.id === currentOrganizationId) ?? organizations[0] ?? null

  useEffect(() => {
    if (current && current.id !== currentOrganizationId) {
      setCurrentOrganizationId(current.id)
    }
  }, [current, currentOrganizationId, setCurrentOrganizationId])

  // `yourRole` is the effective role (see effectiveRole): a platform SUPER_ADMIN, who has no
  // membership and so gets `null` from the backend, is treated as OWNER like the backend does.
  const platformRole = user?.platformRole
  return useMemo(() => {
    if (!current) return null
    const role = effectiveRole(current.yourRole, platformRole)
    return role === current.yourRole ? current : { ...current, yourRole: role }
  }, [current, platformRole])
}
