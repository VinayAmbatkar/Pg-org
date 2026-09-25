import type { LucideIcon } from 'lucide-react'
import { CalendarCheck, ClipboardList, CreditCard, LogOut, Receipt, UserPlus } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { QueryState } from '@/components/feedback/QueryState'
import { useInvoicesForProperty } from '@/features/billing/hooks/useInvoicesForProperty'
import { useComplaints } from '@/features/complaints/hooks/useComplaints'
import { usePaymentsForProperty } from '@/features/payments/hooks/usePaymentsForProperty'
import { formatCurrency } from '@/lib/formatters/currency'
import { formatDate } from '@/lib/formatters/date'
import type { Residency } from '@/types/api'

interface TimelineEvent {
  id: string
  at: string
  title: string
  icon: LucideIcon
  to?: string
}

/** pg-backend has no activity/audit endpoint for owners, so this is a *record history*: every
 * entry is a real timestamp on a real record, described as exactly what that timestamp records.
 * Nothing is inferred (e.g. startDate is the planned start, so it is not labelled "checked in"). */
export function ActivityTab({ residency }: { residency: Residency }) {
  const invoicesQuery = useInvoicesForProperty(residency.propertyId)
  const invoices = useMemo(
    () => (invoicesQuery.data ?? []).filter((i) => i.residencyId === residency.id),
    [invoicesQuery.data, residency.id],
  )
  const payments = usePaymentsForProperty(invoices)
  const complaints = useComplaints({ propertyId: residency.propertyId, limit: 100, sortBy: 'createdAt', sortDir: 'desc' })

  const events: TimelineEvent[] = [
    { id: 'created', at: residency.createdAt, title: 'Stay created', icon: UserPlus },
    { id: 'start', at: residency.startDate, title: 'Stay start date', icon: CalendarCheck },
  ]
  if (residency.status === 'CHECKED_OUT' && residency.actualEndDate) {
    events.push({ id: 'checked-out', at: residency.actualEndDate, title: 'Checked out', icon: LogOut })
  }
  for (const invoice of invoices) {
    if (!invoice.issueDate || invoice.status === 'DRAFT') continue
    events.push({
      id: `invoice-${invoice.id}`,
      at: invoice.issueDate,
      title: `Invoice ${invoice.invoiceNumber} issued · ${formatCurrency(invoice.total, invoice.currency)}`,
      icon: Receipt,
      to: `/app/billing/invoices/${invoice.id}`,
    })
  }
  for (const payment of payments.payments) {
    if (payment.status !== 'CAPTURED' || !payment.paidAt) continue
    events.push({
      id: `payment-${payment.id}`,
      at: payment.paidAt,
      title: `Payment received · ${formatCurrency(payment.amount, payment.currency)}`,
      icon: CreditCard,
      to: `/app/payments/${payment.id}`,
    })
  }
  for (const complaint of complaints.data?.items ?? []) {
    if (complaint.residencyId !== residency.id) continue
    events.push({
      id: `complaint-${complaint.id}`,
      at: complaint.createdAt,
      title: `Complaint reported: ${complaint.title}`,
      icon: ClipboardList,
      to: `/app/complaints/${complaint.id}`,
    })
  }
  events.sort((a, b) => b.at.localeCompare(a.at))

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Built from this tenant&apos;s stay, invoices, payments and complaints. PGMet doesn&apos;t keep a full activity log yet.
      </p>
      <QueryState
        isLoading={invoicesQuery.isLoading || payments.isLoading || complaints.isLoading}
        error={invoicesQuery.error ?? payments.error ?? complaints.error}
        onRetry={() => {
          if (invoicesQuery.error) void invoicesQuery.refetch()
          if (payments.error) void payments.refetch()
          if (complaints.error) void complaints.refetch()
        }}
      >
        <ol className="relative space-y-4 border-l border-border pl-6">
          {events.map(({ id, at, title, icon: Icon, to }) => (
            <li key={id} className="relative">
              <span className="absolute -left-[33px] flex h-6 w-6 items-center justify-center rounded-full border border-border bg-white">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              </span>
              <time dateTime={at} className="block text-xs text-muted-foreground">
                {formatDate(at)}
              </time>
              {to ? (
                <Link to={to} className="text-sm font-medium underline underline-offset-2">
                  {title}
                </Link>
              ) : (
                <p className="text-sm font-medium">{title}</p>
              )}
            </li>
          ))}
        </ol>
      </QueryState>
    </div>
  )
}
