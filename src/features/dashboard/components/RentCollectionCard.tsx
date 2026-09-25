import { formatCurrency } from '@/lib/formatters/currency'
import { useRentCollection } from '../hooks/useOperationalData'
import { DashboardCard } from './DashboardSections'

/** Tenant rent only — the owner's operational income from their tenants' invoices. PGMet's own
 * platform fees / SaaS billing are deliberately not mixed in here. */
export function RentCollectionCard({ propertyId, className }: { propertyId: string; className?: string }) {
  const { snapshot: s, isLoading, error, refetch } = useRentCollection(propertyId)
  const month = new Date().toLocaleDateString('en-IN', { month: 'long' })
  const paidShare = s.billedThisMonth > 0 ? Math.round((s.paidInFullThisMonth / s.billedThisMonth) * 100) : null

  return (
    <DashboardCard
      title="Tenant Rent Collection"
      description={`Rent invoiced to your tenants. PGMet platform fees are not included.`}
      link={{ to: '/app/billing/invoices', label: 'Invoices' }}
      isLoading={isLoading}
      error={error}
      onRetry={() => void refetch()}
      className={className}
    >
      <div className="space-y-4">
        <div>
          <p className="text-xs text-muted-foreground">Billed for {month}</p>
          <p className="text-2xl font-bold text-[#182345]">{formatCurrency(s.billedThisMonth, s.currency)}</p>
          {paidShare !== null ? (
            <>
              <div
                className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#eef1f7]"
                role="progressbar"
                aria-label={`Paid in full for ${month}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={paidShare}
              >
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${paidShare}%` }} />
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                {formatCurrency(s.paidInFullThisMonth, s.currency)} paid in full ({s.paidInvoicesThisMonth} of{' '}
                {s.invoicesThisMonth} invoices)
              </p>
            </>
          ) : (
            <p className="mt-1 text-[11px] text-muted-foreground">No invoices issued for {month} yet.</p>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg bg-[#f7f9fc] p-3">
            <dt className="text-muted-foreground">Outstanding</dt>
            <dd className="mt-0.5 text-base font-bold text-[#182345]">{formatCurrency(s.outstandingExact, s.currency)}</dd>
            <dd className="text-[10px] text-muted-foreground">Issued &amp; overdue, all months</dd>
          </div>
          <div className="rounded-lg bg-red-50 p-3">
            <dt className="text-red-700">Overdue</dt>
            <dd className="mt-0.5 text-base font-bold text-red-700">{formatCurrency(s.overdueAmount, s.currency)}</dd>
            <dd className="text-[10px] text-red-700/80">{s.overdueInvoices.length} invoice(s) past due</dd>
          </div>
        </dl>

        {s.partiallyPaidCount > 0 && (
          <p className="text-[11px] text-muted-foreground">
            {`Plus ${s.partiallyPaidCount} partially paid invoice(s) totalling ${formatCurrency(s.partiallyPaidTotal, s.currency)}. `}
            Their remaining balance is shown on each invoice.
          </p>
        )}
      </div>
    </DashboardCard>
  )
}
