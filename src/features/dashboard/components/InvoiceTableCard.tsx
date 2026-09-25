import { Link } from 'react-router-dom'
import { InvoiceStatusBadge } from '@/features/billing/components/InvoiceStatusBadge'
import { formatCurrency } from '@/lib/formatters/currency'
import { formatDate } from '@/lib/formatters/date'
import { useRentCollection } from '../hooks/useOperationalData'
import { daysBetween } from '../lib/metrics'
import { DashboardCard } from './DashboardSections'

interface InvoiceTableCardProps {
  propertyId: string
  kind: 'overdue' | 'dueSoon'
  className?: string
}

const CONFIG = {
  overdue: {
    title: 'Overdue Invoices',
    empty: 'No overdue invoices. Nice.',
    dayLabel: 'Days overdue',
    link: '/app/billing/invoices?status=OVERDUE',
  },
  dueSoon: {
    title: 'Due in the Next 7 Days',
    empty: 'Nothing due in the next 7 days.',
    dayLabel: 'Days left',
    link: '/app/billing/invoices?status=ISSUED',
  },
}

export function InvoiceTableCard({ propertyId, kind, className }: InvoiceTableCardProps) {
  const { snapshot, isLoading, error, refetch } = useRentCollection(propertyId)
  const config = CONFIG[kind]
  const invoices = kind === 'overdue' ? snapshot.overdueInvoices : snapshot.dueSoonInvoices
  const now = new Date()

  return (
    <DashboardCard
      title={config.title}
      link={{ to: config.link }}
      isLoading={isLoading}
      error={error}
      onRetry={() => void refetch()}
      className={className}
    >
      {invoices.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">{config.empty}</p>
      ) : (
        <div className="-mx-5 overflow-x-auto md:-mx-6">
          <table className="w-full min-w-[480px] text-left text-xs">
            <caption className="sr-only">{config.title}</caption>
            <thead className="text-[10px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-5 py-2 font-medium md:px-6">Invoice</th>
                <th scope="col" className="py-2 font-medium">Due</th>
                <th scope="col" className="py-2 font-medium">Amount</th>
                <th scope="col" className="py-2 font-medium">Status</th>
                <th scope="col" className="py-2 pr-5 text-right font-medium md:pr-6">{config.dayLabel}</th>
              </tr>
            </thead>
            <tbody>
              {invoices.slice(0, 5).map((invoice) => (
                <tr key={invoice.id} className="border-t border-[#f2f4f9]">
                  <td className="px-5 py-2.5 md:px-6">
                    <Link
                      to={`/app/billing/invoices/${invoice.id}`}
                      className="font-medium text-[#182345] underline underline-offset-2"
                    >
                      {invoice.invoiceNumber}
                    </Link>
                  </td>
                  <td className="py-2.5">{formatDate(invoice.dueDate)}</td>
                  <td className="py-2.5">{formatCurrency(invoice.total, invoice.currency)}</td>
                  <td className="py-2.5">
                    <InvoiceStatusBadge status={kind === 'overdue' ? 'OVERDUE' : invoice.status} />
                  </td>
                  <td className="py-2.5 pr-5 text-right md:pr-6">
                    {Math.abs(daysBetween(now, new Date(invoice.dueDate)))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {invoices.length > 5 && (
            <p className="px-5 pt-2 text-[11px] text-muted-foreground md:px-6">
              Showing 5 of {invoices.length}.
            </p>
          )}
        </div>
      )}
    </DashboardCard>
  )
}
