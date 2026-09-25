import { useMutation, useQueryClient } from '@tanstack/react-query'
import { rentPlansApi } from '../api/rentPlansApi'
import { rentPlanKeys } from '../api/queryKeys'
import type { CreateRentPlanPayload, UpdateRentPlanPayload } from '../types'

export function useCreateRentPlan(residencyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateRentPlanPayload) => rentPlansApi.create(residencyId, payload),
    onSuccess: (rentPlan) => {
      queryClient.setQueryData(rentPlanKeys.forResidency(residencyId), rentPlan)
    },
  })
}

export function useUpdateRentPlan(id: string, residencyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateRentPlanPayload) => rentPlansApi.update(id, payload),
    onSuccess: (rentPlan) => {
      queryClient.setQueryData(rentPlanKeys.forResidency(residencyId), rentPlan)
    },
  })
}
