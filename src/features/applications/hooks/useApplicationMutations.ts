import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Application } from '@/types/api'
import { applicationsApi } from '../api/applicationsApi'
import { applicationKeys } from '../api/queryKeys'
import type { RejectApplicationPayload } from '../types'

function afterAction(queryClient: ReturnType<typeof useQueryClient>, id: string, propertyId: string, application: Application) {
  queryClient.setQueryData(applicationKeys.detail(id), application)
  // Prefix-only key (no params) so this matches every cached list page/limit for this property.
  void queryClient.invalidateQueries({ queryKey: [...applicationKeys.all, 'property', propertyId] })
}

export function useReviewApplication(id: string, propertyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => applicationsApi.review(id),
    onSuccess: (application) => afterAction(queryClient, id, propertyId, application),
  })
}

export function useApproveApplication(id: string, propertyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => applicationsApi.approve(id),
    onSuccess: (application) => afterAction(queryClient, id, propertyId, application),
  })
}

export function useRejectApplication(id: string, propertyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: RejectApplicationPayload) => applicationsApi.reject(id, payload),
    onSuccess: (application) => afterAction(queryClient, id, propertyId, application),
  })
}

export function useStartOnboarding(id: string) {
  return useMutation({
    mutationFn: () => applicationsApi.startOnboarding(id),
  })
}
