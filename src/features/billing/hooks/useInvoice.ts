import { useQuery } from '@tanstack/react-query'
import { invoicesApi } from '../api/invoicesApi'
import { invoiceKeys } from '../api/queryKeys'

export function useInvoice(id: string | undefined) {
  return useQuery({
    queryKey: invoiceKeys.detail(id ?? ''),
    queryFn: () => invoicesApi.get(id!),
    enabled: Boolean(id),
  })
}
