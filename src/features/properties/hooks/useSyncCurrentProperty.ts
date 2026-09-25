import { useEffect } from 'react'
import { useUiStore } from '@/app/providers/uiStore'
import { useCurrentProperty } from './useCurrentProperty'

/** Makes the property a detail page is showing the app-wide current property. Module pages
 * (/app/rooms, /app/tenants, /app/billing/invoices, …) are scoped to the header switcher's
 * property, so without this, "View all invoices" on Property B's page would open Property A's
 * invoices. There is exactly one property context (uiStore) — this only writes to it.
 *
 * Only syncs to a property that is in the current organization's list: useCurrentProperty resets
 * an unknown id back to the first property, so syncing an unlisted one (e.g. just created, list
 * refetch still in flight) would make the two effects fight in a render loop. */
export function useSyncCurrentProperty(propertyId: string | undefined) {
  const { properties } = useCurrentProperty()
  const currentPropertyId = useUiStore((s) => s.currentPropertyId)
  const setCurrentPropertyId = useUiStore((s) => s.setCurrentPropertyId)
  const isListed = Boolean(propertyId) && properties.some((p) => p.id === propertyId)

  useEffect(() => {
    if (propertyId && isListed && propertyId !== currentPropertyId) setCurrentPropertyId(propertyId)
  }, [propertyId, isListed, currentPropertyId, setCurrentPropertyId])
}
