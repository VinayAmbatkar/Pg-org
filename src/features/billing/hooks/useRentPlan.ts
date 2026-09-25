import { useQuery } from '@tanstack/react-query'
import { rentPlansApi } from '../api/rentPlansApi'
import { rentPlanKeys } from '../api/queryKeys'

export function useRentPlan(residencyId: string | undefined) {
  return useQuery({
    queryKey: rentPlanKeys.forResidency(residencyId ?? ''),
    queryFn: () => rentPlansApi.getCurrentForResidency(residencyId!),
    enabled: Boolean(residencyId),
  })
}
