import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { foodApi } from '../api/foodApi'
import { foodKeys } from '../api/queryKeys'
import type { CreateFoodPlanPayload, UpdateFoodPlanPayload } from '../types'

export function useFoodPlans(propertyId: string | undefined) {
  return useQuery({
    queryKey: foodKeys.plans(propertyId ?? ''),
    queryFn: () => foodApi.listPlans(propertyId!),
    enabled: Boolean(propertyId),
  })
}

export function useCreateFoodPlan(propertyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateFoodPlanPayload) => foodApi.createPlan(propertyId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: foodKeys.plans(propertyId) })
    },
  })
}

export function useUpdateFoodPlan(id: string, propertyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateFoodPlanPayload) => foodApi.updatePlan(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: foodKeys.plans(propertyId) })
    },
  })
}

export function useArchiveFoodPlan(id: string, propertyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => foodApi.archivePlan(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: foodKeys.plans(propertyId) })
    },
  })
}
