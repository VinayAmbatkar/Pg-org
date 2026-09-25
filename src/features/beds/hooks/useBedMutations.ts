import { useMutation, useQueryClient } from '@tanstack/react-query'
import { bedsApi } from '../api/bedsApi'
import { roomKeys } from '@/features/rooms/api/queryKeys'
import { bedKeys } from '../api/queryKeys'
import type { CreateBedPayload, UpdateBedPayload } from '../types'

export function useCreateBed(propertyId: string, roomId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateBedPayload) => bedsApi.create(propertyId, roomId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bedKeys.lists(propertyId, roomId) })
      // Bed count/status feeds the room's server-computed occupancy.
      void queryClient.invalidateQueries({ queryKey: roomKeys.all })
    },
  })
}

export function useUpdateBed(propertyId: string, roomId: string, bedId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateBedPayload) => bedsApi.update(propertyId, roomId, bedId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bedKeys.lists(propertyId, roomId) })
      // Bed count/status feeds the room's server-computed occupancy.
      void queryClient.invalidateQueries({ queryKey: roomKeys.all })
    },
  })
}

export function useArchiveBed(propertyId: string, roomId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (bedId: string) => bedsApi.archive(propertyId, roomId, bedId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bedKeys.lists(propertyId, roomId) })
      // Bed count/status feeds the room's server-computed occupancy.
      void queryClient.invalidateQueries({ queryKey: roomKeys.all })
    },
  })
}
