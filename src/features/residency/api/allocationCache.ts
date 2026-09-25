import type { QueryClient } from '@tanstack/react-query'
import type { BedAllocation } from '@/types/api'

// pg-backend has no GET endpoint for BedAllocation at all — it's only ever returned inline by
// POST /residencies/:id/check-in and /check-out. There is no way to ask "who is in this bed" or
// "what bed is this residency in" after the fact. As a best-effort UX (not a source of truth),
// we cache whatever allocation the check-in/check-out response gives us, keyed by both bedId and
// residencyId, for the rest of the session. A page reload loses it — callers must render a
// graceful fallback ("occupant unknown after reload") rather than assume this is always populated.
// See docs/backend-gaps.md.

export const allocationCacheKeys = {
  byBed: (bedId: string) => ['bedAllocationCache', 'bed', bedId] as const,
  byResidency: (residencyId: string) => ['bedAllocationCache', 'residency', residencyId] as const,
}

export function cacheAllocation(queryClient: QueryClient, allocation: BedAllocation) {
  queryClient.setQueryData(allocationCacheKeys.byBed(allocation.bedId), allocation)
  queryClient.setQueryData(allocationCacheKeys.byResidency(allocation.residencyId), allocation)
}

export function clearCachedAllocationForBed(queryClient: QueryClient, bedId: string) {
  queryClient.removeQueries({ queryKey: allocationCacheKeys.byBed(bedId) })
}

export function getCachedAllocationForBed(queryClient: QueryClient, bedId: string): BedAllocation | undefined {
  return queryClient.getQueryData<BedAllocation>(allocationCacheKeys.byBed(bedId))
}

export function getCachedAllocationForResidency(queryClient: QueryClient, residencyId: string): BedAllocation | undefined {
  return queryClient.getQueryData<BedAllocation>(allocationCacheKeys.byResidency(residencyId))
}
