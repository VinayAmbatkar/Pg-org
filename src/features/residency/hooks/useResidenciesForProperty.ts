import { useQuery } from '@tanstack/react-query'
import { residencyApi } from '../api/residencyApi'
import { residencyKeys } from '../api/queryKeys'

export function useResidenciesForProperty(propertyId: string | undefined) {
  return useQuery({
    queryKey: residencyKeys.listForProperty(propertyId ?? ''),
    queryFn: () => residencyApi.listForProperty(propertyId as string),
    enabled: Boolean(propertyId),
  })
}
