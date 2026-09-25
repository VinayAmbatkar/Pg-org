import { QueryState } from '@/components/feedback/QueryState'
import { Link } from 'react-router-dom'
import { InvoiceStatusBadge } from '@/features/billing/components/InvoiceStatusBadge'
import { useInvoicesForProperty } from '@/features/billing/hooks/useInvoicesForProperty'
import { formatCurrency } from '@/lib/formatters/currency'

export function BillingTab({ propertyId }: { propertyId: string }) {
  const { data: invoices, isLoading, error, refetch } = useInvoicesForProperty(propertyId)
  const recent = (invoices ?? []).slice(0, 10)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Most recent invoices for this property.</p>
        <Link to="/app/billing/invoices" className="text-sm font-medium text-primary underline underline-offset-2">
          View all invoices →
        </Link>
      </div>
      <QueryState
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        isEmpty={recent.length === 0}
        empty={<p className="text-sm text-muted-foreground">No invoices yet.</p>}
      >
        <ul className="divide-y divide-border rounded-lg border border-border">
          {recent.map((invoice) => (
            <li key={invoice.id} className="flex items-center justify-between px-4 py-2 text-sm">
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
    </div>
  )
}
