import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { foodApi } from '../api/foodApi'
import { foodKeys } from '../api/queryKeys'
import type { CreateMealConsumptionPayload, ListMealConsumptionsParams } from '../types'

export function useMealConsumptions(propertyId: string | undefined, params: ListMealConsumptionsParams) {
  return useQuery({
    queryKey: foodKeys.mealConsumptions(propertyId ?? '', params),
    queryFn: () => foodApi.listMealConsumptions(propertyId!, params),
    enabled: Boolean(propertyId),
  })
}

export function useRecordMealConsumption(propertyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateMealConsumptionPayload) => foodApi.recordMealConsumption(propertyId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...foodKeys.all, 'meal-consumptions', propertyId] })
    },
  })
}
