import { ClipboardList } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { DataTable, type DataTableColumn } from '@/components/data-table/DataTable'
import { FilterBar, SearchInput } from '@/components/data-table/FilterBar'
import { EmptyState } from '@/components/feedback/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { useCurrentProperty } from '@/features/properties/hooks/useCurrentProperty'
import { useUrlParams } from '@/hooks/useUrlState'
import { formatDate } from '@/lib/formatters/date'
import { COMPLAINT_CATEGORY_LABELS, COMPLAINT_PRIORITY_LABELS, COMPLAINT_STATUS_LABELS } from '@/lib/formatters/enumLabels'
import { parseEnumParam, parsePageParam } from '@/lib/utils/listParams'
import type { Complaint, ComplaintCategory, ComplaintPriority, ComplaintStatus } from '@/types/api'
import { ComplaintPriorityBadge } from '../components/ComplaintPriorityBadge'
import { ComplaintStatusBadge } from '../components/ComplaintStatusBadge'
import { useComplaints } from '../hooks/useComplaints'

const STATUS_OPTIONS: ComplaintStatus[] = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED']
const PRIORITY_OPTIONS: ComplaintPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
const CATEGORY_OPTIONS: ComplaintCategory[] = [
  'PLUMBING', 'ELECTRICAL', 'WIFI', 'CLEANING', 'ROOM', 'BED', 'FURNITURE', 'FOOD', 'SECURITY', 'MAINTENANCE', 'OTHER',
]
const SORT_OPTIONS = [
  { value: '', label: 'Newest first' },
  { value: 'createdAt:asc', label: 'Oldest first' },
  { value: 'priority:desc', label: 'Priority' },
  { value: 'updatedAt:desc', label: 'Recently updated' },
] as const
const PAGE_SIZE = 20

export function ComplaintsListPage() {
  const { property, isLoading: propertyLoading } = useCurrentProperty()
  const navigate = useNavigate()
  const { get, set } = useUrlParams()

  const status = parseEnumParam(get('status'), STATUS_OPTIONS)
  const priority = parseEnumParam(get('priority'), PRIORITY_OPTIONS)
  const category = parseEnumParam(get('category'), CATEGORY_OPTIONS)
  const sort = SORT_OPTIONS.find((o) => o.value === get('sort'))?.value ?? ''
  const [sortBy, sortDir] = (sort || 'createdAt:desc').split(':') as [
    'createdAt' | 'updatedAt' | 'priority',
    'asc' | 'desc',
  ]
  const search = get('search').slice(0, 200)
  const page = parsePageParam(get('page'))
  const hasActiveFilters = Boolean(status || priority || category || search)

  // Wait for the property: firing first without propertyId would fetch org-wide, then refetch.
  const { data, isLoading, error, refetch } = useComplaints(
    { propertyId: property?.id, status, priority, category, search: search || undefined, sortBy, sortDir, page, limit: PAGE_SIZE },
    { enabled: Boolean(property) },
  )

  /** Any filter change resets to page 1. */
  const setFilter = (key: string, value: string, replace = false) => set({ [key]: value, page: null }, { replace })

  const columns: DataTableColumn<Complaint>[] = [
    { key: 'title', header: 'Complaint', render: (c) => <span className="font-medium">{c.title}</span> },
    { key: 'category', header: 'Category', render: (c) => COMPLAINT_CATEGORY_LABELS[c.category] },
    { key: 'priority', header: 'Priority', render: (c) => <ComplaintPriorityBadge priority={c.priority} /> },
    { key: 'status', header: 'Status', render: (c) => <ComplaintStatusBadge status={c.status} /> },
    { key: 'assignee', header: 'Assigned', render: (c) => (c.assignedToUserId ? 'Assigned' : 'Unassigned') },
    { key: 'created', header: 'Created', render: (c) => formatDate(c.createdAt) },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Complaints" description={property ? `Maintenance complaints for ${property.name}.` : undefined} />

      <FilterBar hasActiveFilters={hasActiveFilters} onClear={() => set({ status: null, priority: null, category: null, search: null, page: null })}>
        <SearchInput
          label="Search complaints"
          placeholder="Search title or description…"
          value={search}
          onChange={(value) => setFilter('search', value, true)}
        />
        <Select value={status ?? ''} onChange={(e) => setFilter('status', e.target.value)} aria-label="Filter by status" className="max-w-[180px]">
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{COMPLAINT_STATUS_LABELS[s]}</option>
          ))}
        </Select>
        <Select value={priority ?? ''} onChange={(e) => setFilter('priority', e.target.value)} aria-label="Filter by priority" className="max-w-[160px]">
          <option value="">All priorities</option>
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>{COMPLAINT_PRIORITY_LABELS[p]}</option>
          ))}
        </Select>
        <Select value={category ?? ''} onChange={(e) => setFilter('category', e.target.value)} aria-label="Filter by category" className="max-w-[180px]">
          <option value="">All categories</option>
          {CATEGORY_OPTIONS.map((c) => (
            <option key={c} value={c}>{COMPLAINT_CATEGORY_LABELS[c]}</option>
          ))}
        </Select>
        <Select value={sort} onChange={(e) => setFilter('sort', e.target.value)} aria-label="Sort complaints" className="max-w-[180px]">
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>
      </FilterBar>

      <DataTable
        caption="Complaints"
        columns={columns}
        data={data?.items}
        rowKey={(c) => c.id}
        isLoading={isLoading || propertyLoading}
        error={error}
        onRetry={() => refetch()}
        onRowClick={(c) => navigate(`/app/complaints/${c.id}`)}
        pagination={
          data ? { page: data.page, limit: data.limit, total: data.total, onPageChange: (p) => set({ page: p === 1 ? null : p }) } : undefined
        }
        emptyState={
          hasActiveFilters ? (
            <EmptyState
              icon={ClipboardList}
              title="No complaints match these filters"
              action={
                <Button variant="outline" size="sm" onClick={() => set({ status: null, priority: null, category: null, search: null, page: null })}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState icon={ClipboardList} title="No complaints" description="Tenant complaints for this property will show up here." />
          )
        }
      />
    </div>
  )
}
