import { useQuery } from '@tanstack/react-query'
import { invoicesApi } from '../api/invoicesApi'
import { invoiceKeys } from '../api/queryKeys'

export function useInvoicesForProperty(propertyId: string | undefined) {
  return useQuery({
    queryKey: invoiceKeys.listForProperty(propertyId ?? ''),
    queryFn: () => invoicesApi.listForProperty(propertyId!),
    enabled: Boolean(propertyId),
  })
}
