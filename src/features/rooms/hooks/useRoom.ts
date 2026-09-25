import { useQuery } from '@tanstack/react-query'
import { roomsApi } from '../api/roomsApi'
import { roomKeys } from '../api/queryKeys'

export function useRoom(propertyId: string | undefined, roomId: string | undefined) {
  return useQuery({
    queryKey: roomKeys.detail(propertyId ?? '', roomId ?? ''),
    queryFn: () => roomsApi.get(propertyId as string, roomId as string),
    enabled: Boolean(propertyId) && Boolean(roomId),
  })
}
