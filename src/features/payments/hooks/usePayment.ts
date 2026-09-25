import { useQuery } from '@tanstack/react-query'
import { paymentsApi } from '../api/paymentsApi'
import { paymentKeys } from '../api/queryKeys'

export function usePayment(id: string | undefined) {
  return useQuery({
    queryKey: paymentKeys.detail(id ?? ''),
    queryFn: () => paymentsApi.get(id!),
    enabled: Boolean(id),
  })
}
