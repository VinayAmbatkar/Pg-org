import { useMutation, useQueryClient } from '@tanstack/react-query'
import { paymentsApi } from '../api/paymentsApi'
import { paymentKeys } from '../api/queryKeys'
import type { RefundPaymentPayload } from '../types'

export function useRefundPayment(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: RefundPaymentPayload) => paymentsApi.refund(id, payload),
    onSuccess: (payment) => {
      queryClient.setQueryData(paymentKeys.detail(id), payment)
      void queryClient.invalidateQueries({ queryKey: paymentKeys.listForInvoice(payment.invoiceId) })
    },
  })
}
