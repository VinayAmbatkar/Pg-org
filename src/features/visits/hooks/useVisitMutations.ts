import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { PaginatedResult, Visit } from '@/types/api'
import { visitsApi } from '../api/visitsApi'
import { visitKeys } from '../api/queryKeys'
import type { RescheduleVisitPayload, ScheduleVisitPayload } from '../types'

// Updates every cached list page in place with the mutation's response (so the row reflects the
// new status immediately, across whichever page/limit is currently cached) and sets the detail
// cache, rather than relying solely on an invalidate-triggered refetch to pick it up.
function afterAction(queryClient: ReturnType<typeof useQueryClient>, propertyId: string, visit: Visit) {
  queryClient.setQueryData(visitKeys.detail(visit.id), visit)
  queryClient.setQueriesData<PaginatedResult<Visit>>({ queryKey: [...visitKeys.all, 'property', propertyId] }, (current) =>
    current && { ...current, items: current.items.map((v) => (v.id === visit.id ? visit : v)) },
  )
}

export function useScheduleVisit(applicationId: string, propertyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ScheduleVisitPayload) => visitsApi.schedule(applicationId, payload),
    onSuccess: () => {
      // Prefix-only key (no params) so this matches every cached list page/limit for this property.
      void queryClient.invalidateQueries({ queryKey: [...visitKeys.all, 'property', propertyId] })
    },
  })
}

// The following take the visit `id` as the mutate-time variable (rather than binding it when the
// hook is called) so a single hook instance can drive every row's action button on a list page.

export function useConfirmVisit(propertyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => visitsApi.confirm(id),
    onSuccess: (visit) => afterAction(queryClient, propertyId, visit),
  })
}

export function useRescheduleVisit(propertyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: RescheduleVisitPayload }) => visitsApi.reschedule(id, payload),
    onSuccess: (visit) => afterAction(queryClient, propertyId, visit),
  })
}

export function useCompleteVisit(propertyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => visitsApi.complete(id),
    onSuccess: (visit) => afterAction(queryClient, propertyId, visit),
  })
}

export function useNoShowVisit(propertyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => visitsApi.noShow(id),
    onSuccess: (visit) => afterAction(queryClient, propertyId, visit),
  })
}

export function useCancelVisit(propertyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => visitsApi.cancel(id),
    onSuccess: (visit) => afterAction(queryClient, propertyId, visit),
  })
}
