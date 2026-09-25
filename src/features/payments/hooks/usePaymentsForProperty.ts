import { useQueries } from '@tanstack/react-query'
import type { Invoice, Payment } from '@/types/api'
import { paymentsApi } from '../api/paymentsApi'
import { paymentKeys } from '../api/queryKeys'

/** The backend has no "list all payments for a property/org" endpoint (see docs/backend-gaps.md) —
 * only "payments for one invoice". This composes the view by fanning out one request per invoice,
 * so callers must pass a *bounded* invoice set (e.g. one residency, or a billing-period window):
 * pg-backend throttles at 100 requests/min per client. DRAFT invoices are skipped — they can't be
 * paid, so they can never have payments. */
export function usePaymentsForProperty(invoices: Invoice[] | undefined) {
  const payable = (invoices ?? []).filter((invoice) => invoice.status !== 'DRAFT')

  return useQueries({
    queries: payable.map((invoice) => ({
      queryKey: paymentKeys.listForInvoice(invoice.id),
      queryFn: () => paymentsApi.listForInvoice(invoice.id),
    })),
    combine: (queries) => ({
      payments: (queries.flatMap((q) => q.data ?? []) as Payment[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      isLoading: queries.some((q) => q.isLoading),
      error: queries.find((q) => q.error)?.error ?? null,
      refetch: () => Promise.all(queries.filter((q) => q.error).map((q) => q.refetch())),
      requestCount: queries.length,
    }),
  })
}
