import { useQuery } from '@tanstack/react-query'
import { propertiesApi } from '../api/propertiesApi'
import { propertyKeys } from '../api/queryKeys'

export function useProperty(id: string | undefined) {
  return useQuery({
    queryKey: propertyKeys.detail(id ?? ''),
    queryFn: () => propertiesApi.get(id as string),
    enabled: Boolean(id),
  })
}
