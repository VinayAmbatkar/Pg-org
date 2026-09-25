import { useQueries } from '@tanstack/react-query'
import type { Residency } from '@/types/api'
import { rentPlansApi } from '../api/rentPlansApi'
import { rentPlanKeys } from '../api/queryKeys'

/** The backend has no "list all rent plans for a property" endpoint (see docs/backend-gaps.md) —
 * only "current active plan for one residency". This composes the property-wide view by fanning out
 * one request per residency, which is fine at typical PG scale but should move server-side if a
 * property ever has hundreds of residencies. */
export function useRentPlansForProperty(residencies: Residency[] | undefined) {
  const queries = useQueries({
    queries: (residencies ?? []).map((residency) => ({
      queryKey: rentPlanKeys.forResidency(residency.id),
      queryFn: () => rentPlansApi.getCurrentForResidency(residency.id),
    })),
  })

  const isLoading = queries.some((q) => q.isLoading)
  const rows = (residencies ?? []).map((residency, i) => ({
    residency,
    rentPlan: queries[i]?.data ?? null,
  }))

  return { rows, isLoading }
}
