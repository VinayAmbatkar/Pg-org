import { useQuery } from '@tanstack/react-query'
import { tenantsApi } from '../api/tenantsApi'
import { tenantKeys } from '../api/queryKeys'

export function useTenant(id: string | undefined) {
  return useQuery({
    queryKey: tenantKeys.detail(id ?? ''),
    queryFn: () => tenantsApi.get(id as string),
    enabled: Boolean(id),
  })
}
