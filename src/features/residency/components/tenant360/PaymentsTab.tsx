import { QueryState } from '@/components/feedback/QueryState'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PaymentStatusBadge } from '@/features/payments/components/PaymentStatusBadge'
import { useInvoicesForProperty } from '@/features/billing/hooks/useInvoicesForProperty'
import { usePaymentsForProperty } from '@/features/payments/hooks/usePaymentsForProperty'
import { formatCurrency } from '@/lib/formatters/currency'

export function PaymentsTab({ propertyId, residencyId }: { propertyId: string; residencyId: string }) {
  const { data: invoices, isLoading: invoicesLoading, error: invoicesError, refetch } = useInvoicesForProperty(propertyId)
  // Memoized: usePaymentsForProperty builds a useQueries config from this array, and a fresh
  // array reference on every render would rebuild (and potentially re-fire) that whole query set.
  const residencyInvoices = useMemo(() => (invoices ?? []).filter((i) => i.residencyId === residencyId), [invoices, residencyId])
  const {
    payments,
    isLoading: paymentsLoading,
    error: paymentsError,
    refetch: refetchPayments,
  } = usePaymentsForProperty(residencyInvoices)

  return (
    <QueryState
      isLoading={invoicesLoading || paymentsLoading}
      error={invoicesError ?? paymentsError}
      onRetry={() => (invoicesError ? void refetch() : void refetchPayments())}
      isEmpty={payments.length === 0}
      empty={<p className="text-sm text-muted-foreground">No payments yet for this residency.</p>}
    >
      <ul className="divide-y divide-border">
        {payments.map((payment) => (
          <li key={payment.id} className="flex items-center justify-between py-2 text-sm">
            <Link to={`/app/payments/${payment.id}`} className="font-medium underline underline-offset-2">
              {formatCurrency(payment.amount, payment.currency)}
            </Link>
            <PaymentStatusBadge status={payment.status} />
          </li>
        ))}
      </ul>
    </QueryState>
  )
}
