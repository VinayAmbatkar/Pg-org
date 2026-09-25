import { apiClient } from '@/infrastructure/api/client'
import type { Payment } from '@/types/api'
import type { RefundPaymentPayload } from '../types'

export const paymentsApi = {
  /** No pagination/filter support on this endpoint — returns every payment for the invoice. */
  async listForInvoice(invoiceId: string): Promise<Payment[]> {
    const { data } = await apiClient.get<Payment[]>(`/invoices/${invoiceId}/payments`)
    return data
  },

  async get(id: string): Promise<Payment> {
    const { data } = await apiClient.get<Payment>(`/payments/${id}`)
    return data
  },

  async refund(id: string, payload: RefundPaymentPayload): Promise<Payment> {
    const { data } = await apiClient.post<Payment>(`/payments/${id}/refund`, payload)
    return data
  },
}
