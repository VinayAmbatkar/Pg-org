import { useQuery } from '@tanstack/react-query'
import { roomsApi } from '../api/roomsApi'
import { roomKeys } from '../api/queryKeys'

export function useRooms(propertyId: string | undefined) {
  return useQuery({
    queryKey: roomKeys.lists(propertyId ?? ''),
    queryFn: () => roomsApi.list(propertyId as string),
    enabled: Boolean(propertyId),
  })
}
