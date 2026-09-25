import { useMutation, useQueryClient } from '@tanstack/react-query'
import { residencyApi } from '../api/residencyApi'
import { residencyKeys } from '../api/queryKeys'
import { cacheAllocation } from '../api/allocationCache'
import { bedKeys } from '@/features/beds/api/queryKeys'
import { roomKeys } from '@/features/rooms/api/queryKeys'

/** Check-in/out change who is in a bed: refresh bed occupants, room occupancy and room history. */
function invalidateOccupancy(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: bedKeys.all })
  void queryClient.invalidateQueries({ queryKey: roomKeys.all })
}
import type { CheckInPayload, CreateResidencyPayload, UpdateResidencyPayload } from '../types'

export function useCreateResidency(propertyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateResidencyPayload) => residencyApi.create(propertyId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: residencyKeys.listForProperty(propertyId) })
    },
  })
}

export function useUpdateResidency(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateResidencyPayload) => residencyApi.update(id, payload),
    onSuccess: (residency) => {
      queryClient.setQueryData(residencyKeys.detail(id), residency)
      void queryClient.invalidateQueries({ queryKey: residencyKeys.listForProperty(residency.propertyId) })
    },
  })
}

export function useCheckIn(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CheckInPayload) => residencyApi.checkIn(id, payload),
    onSuccess: (result) => {
      cacheAllocation(queryClient, result.allocation)
      void queryClient.invalidateQueries({ queryKey: residencyKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: residencyKeys.listForProperty(result.residency.propertyId) })
      invalidateOccupancy(queryClient)
    },
  })
}

export function useCheckOut(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => residencyApi.checkOut(id),
    onSuccess: (result) => {
      cacheAllocation(queryClient, result.allocation)
      void queryClient.invalidateQueries({ queryKey: residencyKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: residencyKeys.listForProperty(result.residency.propertyId) })
      invalidateOccupancy(queryClient)
    },
  })
}
