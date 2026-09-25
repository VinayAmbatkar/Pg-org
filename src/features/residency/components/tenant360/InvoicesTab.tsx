import { QueryState } from '@/components/feedback/QueryState'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { InvoiceStatusBadge } from '@/features/billing/components/InvoiceStatusBadge'
import { useInvoicesForProperty } from '@/features/billing/hooks/useInvoicesForProperty'
import { formatCurrency } from '@/lib/formatters/currency'

export function InvoicesTab({ propertyId, residencyId }: { propertyId: string; residencyId: string }) {
  const { data: invoices, isLoading, error, refetch } = useInvoicesForProperty(propertyId)
  // Memoized so this array keeps a stable reference across renders — PaymentsTab feeds the same
  // shape of filtered list into useQueries, where a fresh array on every render would rebuild its
  // whole query set unnecessarily.
  const forResidency = useMemo(() => (invoices ?? []).filter((i) => i.residencyId === residencyId), [invoices, residencyId])

  return (
    <QueryState
      isLoading={isLoading}
      error={error}
      onRetry={() => void refetch()}
      isEmpty={forResidency.length === 0}
      empty={<p className="text-sm text-muted-foreground">No invoices yet for this residency.</p>}
    >
      <ul className="divide-y divide-border">
        {forResidency.map((invoice) => (
          <li key={invoice.id} className="flex items-center justify-between py-2 text-sm">
            <Link to={`/app/billing/invoices/${invoice.id}`} className="font-medium underline underline-offset-2">
              {invoice.invoiceNumber}
            </Link>
            <div className="flex items-center gap-3">
              <span>{formatCurrency(invoice.total, invoice.currency)}</span>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
          </li>
        ))}
      </ul>
    </QueryState>
  )
}
