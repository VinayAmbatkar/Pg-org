import { useQuery } from '@tanstack/react-query'
import { foodApi } from '../api/foodApi'
import { foodKeys } from '../api/queryKeys'

export function useFoodSubscriptions(propertyId: string | undefined) {
  return useQuery({
    queryKey: foodKeys.subscriptions(propertyId ?? ''),
    queryFn: () => foodApi.listSubscriptions(propertyId!),
    enabled: Boolean(propertyId),
  })
}
