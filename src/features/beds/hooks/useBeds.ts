import { useQuery } from '@tanstack/react-query'
import { bedsApi } from '../api/bedsApi'
import { bedKeys } from '../api/queryKeys'

export function useBeds(propertyId: string | undefined, roomId: string | undefined) {
  return useQuery({
    queryKey: bedKeys.lists(propertyId ?? '', roomId ?? ''),
    queryFn: () => bedsApi.list(propertyId as string, roomId as string),
    enabled: Boolean(propertyId) && Boolean(roomId),
  })
}
