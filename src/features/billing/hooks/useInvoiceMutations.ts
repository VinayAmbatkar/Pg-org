import { useMutation, useQueryClient } from '@tanstack/react-query'
import { invoicesApi } from '../api/invoicesApi'
import { invoiceKeys } from '../api/queryKeys'
import type { UpdateInvoicePayload, GenerateInvoicePayload } from '../types'

export function useGenerateInvoice(residencyId: string, propertyId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: GenerateInvoicePayload) => invoicesApi.generate(residencyId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.listForProperty(propertyId) })
    },
  })
}

export function useUpdateInvoice(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateInvoicePayload) => invoicesApi.update(id, payload),
    onSuccess: (invoice) => {
      queryClient.setQueryData(invoiceKeys.detail(id), invoice)
    },
  })
}

export function useIssueInvoice(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => invoicesApi.issue(id),
    onSuccess: (invoice) => {
      queryClient.setQueryData(invoiceKeys.detail(id), invoice)
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.all })
    },
  })
}

export function useVoidInvoice(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => invoicesApi.void(id),
    onSuccess: (invoice) => {
      queryClient.setQueryData(invoiceKeys.detail(id), invoice)
      void queryClient.invalidateQueries({ queryKey: invoiceKeys.all })
    },
  })
}
