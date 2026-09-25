import { useQuery } from '@tanstack/react-query'
import { residencyApi } from '../api/residencyApi'
import { residencyKeys } from '../api/queryKeys'

export function useResidency(id: string | undefined) {
  return useQuery({
    queryKey: residencyKeys.detail(id ?? ''),
    queryFn: () => residencyApi.get(id as string),
    enabled: Boolean(id),
  })
}
