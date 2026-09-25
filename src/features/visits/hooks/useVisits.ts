import { useQuery } from '@tanstack/react-query'
import { visitsApi } from '../api/visitsApi'
import { visitKeys } from '../api/queryKeys'
import type { ListVisitsParams } from '../types'

export function useVisitsForProperty(propertyId: string | undefined, params: ListVisitsParams = {}) {
  return useQuery({
    queryKey: visitKeys.listForProperty(propertyId ?? '', params),
    queryFn: () => visitsApi.listForProperty(propertyId!, params),
    enabled: Boolean(propertyId),
  })
}

export function useVisit(id: string | undefined) {
  return useQuery({
    queryKey: visitKeys.detail(id ?? ''),
    queryFn: () => visitsApi.get(id!),
    enabled: Boolean(id),
  })
}
