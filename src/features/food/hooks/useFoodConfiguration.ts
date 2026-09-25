import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { foodApi } from '../api/foodApi'
import { foodKeys } from '../api/queryKeys'
import type { UpdateFoodConfigurationPayload } from '../types'

export function useFoodConfiguration(propertyId: string | undefined) {
  return useQuery({
    queryKey: foodKeys.configuration(propertyId ?? ''),
    queryFn: () => foodApi.getConfiguration(propertyId!),
    enabled: Boolean(propertyId),
  })
}

export function useUpdateFoodConfiguration(propertyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateFoodConfigurationPayload) => foodApi.updateConfiguration(propertyId, payload),
    onSuccess: (config) => {
      queryClient.setQueryData(foodKeys.configuration(propertyId), config)
    },
  })
}
