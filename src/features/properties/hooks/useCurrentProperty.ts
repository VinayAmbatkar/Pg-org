import { useEffect } from 'react'
import { useUiStore } from '@/app/providers/uiStore'
import { useCurrentOrganization } from '@/features/organizations/hooks/useCurrentOrganization'
import type { Property } from '@/types/api'
import { useProperties } from './useProperties'

/** Resolves the "current" property for the property switcher, falling back to the first
 * property in the current organization. */
export function useCurrentProperty(): { property: Property | null; properties: Property[]; isLoading: boolean } {
  const organization = useCurrentOrganization()
  const { data: properties = [], isPending } = useProperties(organization?.id)
  const currentPropertyId = useUiStore((s) => s.currentPropertyId)
  const setCurrentPropertyId = useUiStore((s) => s.setCurrentPropertyId)

  const current = properties.find((p) => p.id === currentPropertyId) ?? properties[0] ?? null

  useEffect(() => {
    if (current && current.id !== currentPropertyId) {
      setCurrentPropertyId(current.id)
    }
  }, [current, currentPropertyId, setCurrentPropertyId])

  // Loading until the organization is known *and* its properties have arrived. A disabled query
  // (no org yet) must not read as "loaded, zero properties" — that flashed a false empty state.
  return { property: current, properties, isLoading: !organization || isPending }
}
