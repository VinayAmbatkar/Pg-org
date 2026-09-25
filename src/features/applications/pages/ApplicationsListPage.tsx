import { UserPlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { DataTable, type DataTableColumn } from '@/components/data-table/DataTable'
import { FilterBar } from '@/components/data-table/FilterBar'
import { EmptyState } from '@/components/feedback/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { useCurrentProperty } from '@/features/properties/hooks/useCurrentProperty'
import { useUrlParams } from '@/hooks/useUrlState'
import { formatDate } from '@/lib/formatters/date'
import { APPLICATION_STATUS_LABELS, ROOM_TYPE_LABELS } from '@/lib/formatters/enumLabels'
import { parseEnumParam, parsePageParam } from '@/lib/utils/listParams'
import type { Application, ApplicationStatus } from '@/types/api'
import { ApplicationStatusBadge } from '../components/ApplicationStatusBadge'
import { useApplicationsForProperty } from '../hooks/useApplications'

const STATUS_OPTIONS: ApplicationStatus[] = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'VISIT_SCHEDULED',
  'APPROVED',
  'REJECTED',
  'WITHDRAWN',
  'EXPIRED',
]
const PAGE_SIZE = 20

export function ApplicationsListPage() {
  const { property, isLoading: propertyLoading } = useCurrentProperty()
  const navigate = useNavigate()
  const { get, set } = useUrlParams()
  const page = parsePageParam(get('page'))
  const status = parseEnumParam(get('status'), STATUS_OPTIONS)

  const { data, isLoading, error, refetch } = useApplicationsForProperty(property?.id, { page, limit: PAGE_SIZE, status })

  const columns: DataTableColumn<Application>[] = [
    { key: 'applicant', header: 'Applicant', render: (a) => <span className="font-medium">{a.fullName}</span> },
    { key: 'phone', header: 'Phone', render: (a) => a.phone },
    { key: 'roomType', header: 'Preferred room type', render: (a) => (a.preferredRoomType ? ROOM_TYPE_LABELS[a.preferredRoomType] : '—') },
    { key: 'moveIn', header: 'Preferred move-in', render: (a) => formatDate(a.preferredMoveInDate) },
    { key: 'status', header: 'Status', render: (a) => <ApplicationStatusBadge status={a.status} /> },
    { key: 'submitted', header: 'Submitted', render: (a) => formatDate(a.submittedAt) },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Applications" description={property ? `Prospective tenant applications for ${property.name}.` : undefined} />

      <FilterBar hasActiveFilters={Boolean(status)} onClear={() => set({ status: null, page: null })}>
        <Select
          value={status ?? ''}
          onChange={(e) => set({ status: e.target.value, page: null })}
          aria-label="Filter by status"
          className="max-w-[200px]"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {APPLICATION_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
      </FilterBar>

      <DataTable
        caption="Applications"
        columns={columns}
        data={data?.items}
        rowKey={(a) => a.id}
        isLoading={isLoading || propertyLoading}
        error={error}
        onRetry={() => refetch()}
        onRowClick={(a) => navigate(`/app/applications/${a.id}`)}
        pagination={
          data ? { page: data.page, limit: data.limit, total: data.total, onPageChange: (p) => set({ page: p === 1 ? null : p }) } : undefined
        }
        emptyState={
          status ? (
            <EmptyState
              icon={UserPlus}
              title={`No ${APPLICATION_STATUS_LABELS[status].toLowerCase()} applications`}
              action={
                <Button variant="outline" size="sm" onClick={() => set({ status: null, page: null })}>
                  Show all applications
                </Button>
              }
            />
          ) : (
            <EmptyState icon={UserPlus} title="No applications yet" description="Applications submitted through your public listing will appear here." />
          )
        }
      />
    </div>
  )
}
