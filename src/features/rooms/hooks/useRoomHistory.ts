import { useQuery } from '@tanstack/react-query'
import { roomsApi } from '../api/roomsApi'
import { roomKeys } from '../api/queryKeys'

export function useRoomHistory(propertyId: string | undefined, roomId: string | undefined) {
  return useQuery({
    queryKey: roomKeys.history(propertyId ?? '', roomId ?? ''),
    queryFn: () => roomsApi.history(propertyId!, roomId!),
    enabled: Boolean(propertyId && roomId),
  })
}
