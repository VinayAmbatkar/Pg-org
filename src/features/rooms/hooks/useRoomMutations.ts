import { useMutation, useQueryClient } from '@tanstack/react-query'
import { roomsApi } from '../api/roomsApi'
import { roomKeys } from '../api/queryKeys'
import type { CreateRoomPayload, UpdateRoomPayload } from '../types'

export function useCreateRoom(propertyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateRoomPayload) => roomsApi.create(propertyId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roomKeys.lists(propertyId) })
    },
  })
}

export function useUpdateRoom(propertyId: string, roomId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateRoomPayload) => roomsApi.update(propertyId, roomId, payload),
    onSuccess: (room) => {
      queryClient.setQueryData(roomKeys.detail(propertyId, roomId), room)
      void queryClient.invalidateQueries({ queryKey: roomKeys.lists(propertyId) })
    },
  })
}

export function useArchiveRoom(propertyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (roomId: string) => roomsApi.archive(propertyId, roomId),
    onSuccess: (room) => {
      queryClient.setQueryData(roomKeys.detail(propertyId, room.id), room)
      void queryClient.invalidateQueries({ queryKey: roomKeys.lists(propertyId) })
    },
  })
}
