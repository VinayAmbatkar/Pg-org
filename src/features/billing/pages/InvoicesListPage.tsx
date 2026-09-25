import { Receipt } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable, type DataTableColumn } from '@/components/data-table/DataTable'
import { FilterBar, SearchInput } from '@/components/data-table/FilterBar'
import { EmptyState } from '@/components/feedback/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { isEffectivelyOverdue } from '@/features/dashboard/lib/metrics'
import { useCurrentProperty } from '@/features/properties/hooks/useCurrentProperty'
import { useUrlParams } from '@/hooks/useUrlState'
import { formatCurrency } from '@/lib/formatters/currency'
import { formatDate } from '@/lib/formatters/date'
import { INVOICE_STATUS_LABELS } from '@/lib/formatters/enumLabels'
import { paginate, parseEnumParam, parsePageParam } from '@/lib/utils/listParams'
import type { Invoice, InvoiceStatus } from '@/types/api'
import { InvoiceStatusBadge } from '../components/InvoiceStatusBadge'
import { useInvoicesForProperty } from '../hooks/useInvoicesForProperty'

const STATUS_OPTIONS: InvoiceStatus[] = ['DRAFT', 'ISSUED', 'OVERDUE', 'PARTIALLY_PAID', 'PAID', 'VOID']
const SORTS = {
  '': { label: 'Due date (latest)', compare: (a: Invoice, b: Invoice) => b.dueDate.localeCompare(a.dueDate) },
  due_asc: { label: 'Due date (earliest)', compare: (a: Invoice, b: Invoice) => a.dueDate.localeCompare(b.dueDate) },
  amount_desc: { label: 'Amount (highest)', compare: (a: Invoice, b: Invoice) => Number(b.total) - Number(a.total) },
  number: { label: 'Invoice number', compare: (a: Invoice, b: Invoice) => a.invoiceNumber.localeCompare(b.invoiceNumber) },
} as const
type SortKey = keyof typeof SORTS
const PAGE_SIZE = 25

export function InvoicesListPage() {
  const { property, isLoading: propertyLoading } = useCurrentProperty()
  const navigate = useNavigate()
  const { get, set } = useUrlParams()

  const status = parseEnumParam(get('status'), STATUS_OPTIONS)
  const search = get('search')
  const sortParam = get('sort')
  const sort: SortKey = sortParam in SORTS ? (sortParam as SortKey) : ''
  const page = parsePageParam(get('page'))
  const hasActiveFilters = Boolean(status || search)

  const { data: invoices, isLoading, error, refetch } = useInvoicesForProperty(property?.id)

  // GET /properties/:propertyId/invoices has no filter/search/pagination params on the backend
  // (see docs/backend-gaps.md), so filter, sort and paginate client-side over the full list.
  // "Overdue" uses the same definition as the dashboard (incl. ISSUED past due), so the dashboard
  // alert count and this filtered list always agree.
  const filtered = useMemo(() => {
    const now = new Date()
    const q = search.trim().toLowerCase()
    return (invoices ?? [])
      .filter((invoice) => {
        if (status === 'OVERDUE' && !isEffectivelyOverdue(invoice, now)) return false
        if (status === 'ISSUED' && (invoice.status !== 'ISSUED' || isEffectivelyOverdue(invoice, now))) return false
        if (status && status !== 'OVERDUE' && status !== 'ISSUED' && invoice.status !== status) return false
        if (q && !invoice.invoiceNumber.toLowerCase().includes(q)) return false
        return true
      })
      .sort(SORTS[sort].compare)
  }, [invoices, status, search, sort])
  const pageData = paginate(filtered, page, PAGE_SIZE)
  const clearFilters = () => set({ status: null, search: null, page: null })

  const columns: DataTableColumn<Invoice>[] = [
    { key: 'number', header: 'Invoice', render: (i) => <span className="font-medium">{i.invoiceNumber}</span> },
    { key: 'period', header: 'Billing period', render: (i) => `${formatDate(i.billingPeriodStart)} – ${formatDate(i.billingPeriodEnd)}` },
    { key: 'total', header: 'Amount', render: (i) => formatCurrency(i.total, i.currency) },
    { key: 'dueDate', header: 'Due date', render: (i) => formatDate(i.dueDate) },
    {
      key: 'status',
      header: 'Status',
      render: (i) => <InvoiceStatusBadge status={isEffectivelyOverdue(i, new Date()) ? 'OVERDUE' : i.status} />,
    },
  ]

  if (!propertyLoading && !property) {
    return (
      <div className="space-y-6">
        <PageHeader title="Invoices" description="Rent invoices for your properties." />
        <EmptyState icon={Receipt} title="No property selected" description="Add a property to start generating invoices." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Invoices" description={property ? `Rent invoices for ${property.name}.` : undefined} />

      <FilterBar hasActiveFilters={hasActiveFilters} onClear={clearFilters}>
        <SearchInput
          label="Search invoices"
          placeholder="Search invoice number…"
          value={search}
          onChange={(value) => set({ search: value, page: null }, { replace: true })}
          debounceMs={150}
        />
        <Select
          value={status ?? ''}
          onChange={(e) => set({ status: e.target.value, page: null })}
          aria-label="Filter by status"
          className="max-w-[200px]"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {INVOICE_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
        <Select value={sort} onChange={(e) => set({ sort: e.target.value, page: null })} aria-label="Sort invoices" className="max-w-[200px]">
          {(Object.keys(SORTS) as SortKey[]).map((key) => (
            <option key={key} value={key}>
              {SORTS[key].label}
            </option>
          ))}
        </Select>
      </FilterBar>

      <DataTable
        caption="Invoices"
        columns={columns}
        data={pageData.items}
        rowKey={(i) => i.id}
        isLoading={isLoading || propertyLoading}
        error={error}
        onRetry={() => refetch()}
        onRowClick={(i) => navigate(`/app/billing/invoices/${i.id}`)}
        pagination={{
          page: pageData.page,
          limit: PAGE_SIZE,
          total: pageData.total,
          onPageChange: (p) => set({ page: p === 1 ? null : p }),
        }}
        emptyState={
          hasActiveFilters ? (
            <EmptyState
              icon={Receipt}
              title="No invoices match these filters"
              action={
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState icon={Receipt} title="No invoices yet" description="Invoices are generated from a tenant's residency once a rent plan is set." />
          )
        }
      />
    </div>
  )
}
