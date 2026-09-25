import { WalletCards } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DataTable, type DataTableColumn } from '@/components/data-table/DataTable'
import { EmptyState } from '@/components/feedback/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Select } from '@/components/ui/select'
import { useInvoicesForProperty } from '@/features/billing/hooks/useInvoicesForProperty'
import { useCurrentProperty } from '@/features/properties/hooks/useCurrentProperty'
import { useUrlState } from '@/hooks/useUrlState'
import { formatCurrency } from '@/lib/formatters/currency'
import { formatDate } from '@/lib/formatters/date'
import type { Payment } from '@/types/api'
import { PaymentStatusBadge } from '../components/PaymentStatusBadge'
import { usePaymentsForProperty } from '../hooks/usePaymentsForProperty'

// Payments are fetched per invoice (no backend payments list), so the page is scoped to a
// billing-period window to keep the request fan-out bounded under pg-backend's throttle.
const WINDOW_OPTIONS = [
  { value: '1', label: 'This month' },
  { value: '3', label: 'Last 3 months' },
  { value: '6', label: 'Last 6 months' },
  { value: '12', label: 'Last 12 months' },
]

export function PaymentsListPage() {
  const { property, isLoading: propertyLoading } = useCurrentProperty()
  const navigate = useNavigate()
  const [months, setMonths] = useUrlState('months', '3')

  const { data: invoices, isLoading: invoicesLoading, error: invoicesError, refetch } = useInvoicesForProperty(property?.id)

  const windowInvoices = useMemo(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() - (Number(months) - 1), 1)
    return (invoices ?? []).filter((invoice) => new Date(invoice.billingPeriodStart) >= start)
  }, [invoices, months])
  const invoiceNumbers = useMemo(() => new Map((invoices ?? []).map((i) => [i.id, i.invoiceNumber])), [invoices])

  const payments = usePaymentsForProperty(windowInvoices)
  const isLoading = propertyLoading || invoicesLoading || payments.isLoading

  const columns: DataTableColumn<Payment>[] = [
    {
      key: 'invoice',
      header: 'Invoice',
      render: (p) => (
        <Link
          to={`/app/billing/invoices/${p.invoiceId}`}
          onClick={(event) => event.stopPropagation()}
          className="font-medium underline underline-offset-2"
        >
          {invoiceNumbers.get(p.invoiceId) ?? 'View invoice'}
        </Link>
      ),
    },
    { key: 'gross', header: 'Tenant paid', render: (p) => formatCurrency(p.amount, p.currency) },
    { key: 'fee', header: 'PGMet fee', render: (p) => formatCurrency(p.platformFee, p.currency) },
    { key: 'settlement', header: 'Your settlement', render: (p) => formatCurrency(p.ownerSettlementAmount, p.currency) },
    { key: 'status', header: 'Status', render: (p) => <PaymentStatusBadge status={p.status} /> },
    { key: 'date', header: 'Date', render: (p) => formatDate(p.paidAt ?? p.createdAt) },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description={property ? `Tenant payments for ${property.name}, by invoice billing period.` : undefined}
        action={
          <Select
            aria-label="Billing period window"
            value={months}
            onChange={(e) => setMonths(e.target.value)}
            className="w-[180px]"
          >
            {WINDOW_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        }
      />

      <DataTable
        columns={columns}
        data={payments.payments}
        rowKey={(p) => p.id}
        isLoading={isLoading}
        error={invoicesError ?? payments.error}
        onRetry={() => (invoicesError ? void refetch() : void payments.refetch())}
        onRowClick={(p) => navigate(`/app/payments/${p.id}`)}
        emptyState={
          <EmptyState
            icon={WalletCards}
            title="No payments in this period"
            description="Payments appear here once tenants pay invoices for the selected billing period."
          />
        }
      />
    </div>
  )
}
