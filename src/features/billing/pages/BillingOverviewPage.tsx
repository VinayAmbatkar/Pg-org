import { AlertTriangle, CalendarClock, CheckCircle2, Receipt } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { buttonVariants } from '@/components/ui/button'
import { MetricCard } from '@/components/data-display/MetricCard'
import { PageHeader } from '@/components/layout/PageHeader'
import { useCurrentProperty } from '@/features/properties/hooks/useCurrentProperty'
import { cn } from '@/lib/utils/cn'
import { formatCurrency } from '@/lib/formatters/currency'
import { useInvoicesForProperty } from '../hooks/useInvoicesForProperty'

const DUE_SOON_DAYS = 7

export function BillingOverviewPage() {
  const { property, isLoading: propertyLoading } = useCurrentProperty()
  const { data: invoices, isLoading } = useInvoicesForProperty(property?.id)

  // Real aggregation over the fetched invoice list (each invoice's `total`/`status` is
  // backend-authoritative) — never a fabricated number. PARTIALLY_PAID invoices are counted toward
  // "Upcoming"/"Overdue" at their full total since the exact paid amount requires a per-invoice
  // payments fetch (see docs/backend-gaps.md); this overview intentionally stays a single request.
  const { totalOutstanding, overdue, dueSoon, paid } = useMemo(() => {
    const now = new Date().getTime()
    const dueSoonCutoff = now + DUE_SOON_DAYS * 24 * 60 * 60 * 1000
    let totalOutstandingSum = 0
    let overdueSum = 0
    let dueSoonSum = 0
    let paidSum = 0

    for (const invoice of invoices ?? []) {
      const total = Number(invoice.total)
      const dueDate = new Date(invoice.dueDate).getTime()
      // Mirrors the backend's lazy OVERDUE computation (status stays ISSUED until the invoice is
      // next read) so a past-due ISSUED invoice counts as overdue here, not as "due soon".
      const isEffectivelyOverdue = invoice.status === 'OVERDUE' || (invoice.status === 'ISSUED' && dueDate < now)

      if (invoice.status === 'PAID') {
        paidSum += total
      } else if (isEffectivelyOverdue) {
        overdueSum += total
        totalOutstandingSum += total
      } else if (invoice.status === 'ISSUED' || invoice.status === 'PARTIALLY_PAID') {
        totalOutstandingSum += total
        if (dueDate <= dueSoonCutoff) {
          dueSoonSum += total
        }
      }
    }

    return { totalOutstanding: totalOutstandingSum, overdue: overdueSum, dueSoon: dueSoonSum, paid: paidSum }
  }, [invoices])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description={property ? `Rent billing for ${property.name}.` : undefined}
        action={
          <div className="flex gap-2">
            <Link to="/app/billing/rent-plans" className={cn(buttonVariants({ variant: 'outline' }))}>
              Rent Plans
            </Link>
            <Link to="/app/billing/invoices" className={cn(buttonVariants())}>
              View Invoices
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <MetricCard label="Total Outstanding" value={formatCurrency(totalOutstanding)} icon={Receipt} tone="blue" isLoading={isLoading || propertyLoading} />
        <MetricCard label="Overdue" value={formatCurrency(overdue)} icon={AlertTriangle} tone="pink" isLoading={isLoading || propertyLoading} />
        <MetricCard label="Due Soon" value={formatCurrency(dueSoon)} icon={CalendarClock} tone="orange" isLoading={isLoading || propertyLoading} />
        <MetricCard label="Paid" value={formatCurrency(paid)} icon={CheckCircle2} tone="green" isLoading={isLoading || propertyLoading} />
      </div>
    </div>
  )
}
