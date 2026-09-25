import { useQuery } from '@tanstack/react-query'
import { paymentsApi } from '../api/paymentsApi'
import { paymentKeys } from '../api/queryKeys'

export function usePaymentsForInvoice(invoiceId: string | undefined) {
  return useQuery({
    queryKey: paymentKeys.listForInvoice(invoiceId ?? ''),
    queryFn: () => paymentsApi.listForInvoice(invoiceId!),
    enabled: Boolean(invoiceId),
  })
}
