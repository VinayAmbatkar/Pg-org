import { useQuery } from '@tanstack/react-query'
import { propertiesApi } from '../api/propertiesApi'
import { propertyKeys } from '../api/queryKeys'

export function useProperties(organizationId: string | undefined) {
  return useQuery({
    queryKey: propertyKeys.list({ organizationId }),
    queryFn: () => propertiesApi.list({ organizationId }),
    enabled: Boolean(organizationId),
  })
}
