import type { Invoice, Payment } from '@/types/api'

export interface InvoiceBalance {
  paid: number
  outstanding: number
  /** True when `paid`/`outstanding` are a best-effort derivation rather than a backend-authoritative
   * figure — see docs/backend-gaps.md ("Invoice paid/outstanding amount"). */
  isApproximate: boolean
}

// pg-backend's InvoiceResponseDto has no amountPaid/outstandingAmount field (see docs/backend-gaps.md).
// The backend IS authoritative for invoice.status (DRAFT/ISSUED/OVERDUE/PARTIALLY_PAID/PAID/VOID) and
// invoice.total, so those drive the summary whenever they alone are enough:
//   - PAID    -> paid = total, outstanding = 0 (exact)
//   - VOID    -> paid = 0, outstanding = 0 (exact — a voided invoice is never collectable)
//   - ISSUED/OVERDUE -> by backend invariant, OVERDUE only applies while status stays ISSUED (a captured
//     payment always moves status to PARTIALLY_PAID/PAID), so no capture has landed yet: paid = 0,
//     outstanding = total (exact)
//   - PARTIALLY_PAID -> the only case with no exact backend figure. We sum CAPTURED payments for this
//     invoice as a best-effort paid amount. This undercounts if any of those payments were later
//     partially refunded (the Payment record's `amount` stays the original gross amount; refunded value
//     is not exposed anywhere in the Payment response), so this figure is flagged `isApproximate`.
export function computeInvoiceBalance(invoice: Invoice, payments: Payment[] | undefined): InvoiceBalance {
  const total = Number(invoice.total)

  if (invoice.status === 'PAID') return { paid: total, outstanding: 0, isApproximate: false }
  if (invoice.status === 'VOID') return { paid: 0, outstanding: 0, isApproximate: false }
  if (invoice.status === 'DRAFT' || invoice.status === 'ISSUED' || invoice.status === 'OVERDUE') {
    return { paid: 0, outstanding: total, isApproximate: false }
  }

  // PARTIALLY_PAID
  const paid = (payments ?? []).filter((p) => p.status === 'CAPTURED').reduce((sum, p) => sum + Number(p.amount), 0)
  return { paid, outstanding: Math.max(0, total - paid), isApproximate: true }
}
