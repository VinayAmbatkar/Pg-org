import { useQuery } from '@tanstack/react-query'
import { applicationsApi } from '../api/applicationsApi'
import { applicationKeys } from '../api/queryKeys'
import type { ListApplicationsParams } from '../types'

export function useApplicationsForProperty(propertyId: string | undefined, params: ListApplicationsParams = {}) {
  return useQuery({
    queryKey: applicationKeys.listForProperty(propertyId ?? '', params),
    queryFn: () => applicationsApi.listForProperty(propertyId!, params),
    enabled: Boolean(propertyId),
  })
}

export function useApplication(id: string | undefined) {
  return useQuery({
    queryKey: applicationKeys.detail(id ?? ''),
    queryFn: () => applicationsApi.get(id!),
    enabled: Boolean(id),
  })
}
