import { Plus, Users } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { EmptyState } from '@/components/feedback/EmptyState'
import { DataTable, type DataTableColumn } from '@/components/data-table/DataTable'
import { FilterBar, SearchInput } from '@/components/data-table/FilterBar'
import { useResidenciesForProperty } from '@/features/residency/hooks/useResidenciesForProperty'
import { ResidencyStatusBadge } from '@/features/residency/components/ResidencyStatusBadge'
import { useUrlParams } from '@/hooks/useUrlState'
import { formatDate } from '@/lib/formatters/date'
import { RESIDENCY_STATUS_LABELS } from '@/lib/formatters/enumLabels'
import { paginate, parseEnumParam, parsePageParam } from '@/lib/utils/listParams'
import type { Residency, ResidencyStatus } from '@/types/api'

const STATUS_OPTIONS: ResidencyStatus[] = ['PENDING', 'ACTIVE', 'NOTICE_PERIOD', 'CHECKED_OUT']
const PAGE_SIZE = 25

interface TenantsPanelProps {
  propertyId: string
  canManage: boolean
}

export function TenantsPanel({ propertyId, canManage }: TenantsPanelProps) {
  const navigate = useNavigate()
  const { get, set } = useUrlParams()
  const status = parseEnumParam(get('status'), STATUS_OPTIONS)
  const search = get('search').trim().toLowerCase()
  const page = parsePageParam(get('page'))
  const hasActiveFilters = Boolean(status || search)
  const clearFilters = () => set({ status: null, search: null, page: null })

  const { data: residencies, isLoading, error, refetch } = useResidenciesForProperty(propertyId)

  // GET /properties/:id/residencies has no filter/pagination params — filtered client-side.
  const filtered = useMemo(
    () =>
      (residencies ?? []).filter(
        (r) => (!status || r.status === status) && (!search || r.tenantId.toLowerCase().includes(search)),
      ),
    [residencies, status, search],
  )
  const pageData = paginate(filtered, page, PAGE_SIZE)
  const addTenant = () => navigate(`/app/properties/${propertyId}/residencies/new`)

  const columns: DataTableColumn<Residency>[] = [
    {
      key: 'tenantId',
      header: 'Tenant ID',
      render: (row) => <span className="font-mono text-xs">{row.tenantId.slice(0, 8)}</span>,
    },
    { key: 'status', header: 'Status', render: (row) => <ResidencyStatusBadge status={row.status} /> },
    { key: 'startDate', header: 'Start date', render: (row) => formatDate(row.startDate) },
    { key: 'expectedEndDate', header: 'Expected end date', render: (row) => formatDate(row.expectedEndDate) },
  ]

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterBar hasActiveFilters={hasActiveFilters} onClear={clearFilters}>
          <SearchInput
            label="Search by tenant ID"
            placeholder="Search tenant ID…"
            value={get('search')}
            onChange={(value) => set({ search: value, page: null }, { replace: true })}
            debounceMs={150}
          />
          <Select
            value={status ?? ''}
            onChange={(e) => set({ status: e.target.value, page: null })}
            aria-label="Filter by stay status"
            className="max-w-[200px]"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {RESIDENCY_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </FilterBar>
        {canManage && (
          <Button size="sm" className="gap-2" onClick={addTenant}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Add Tenant
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Tenants are identified by ID — PGMet doesn&apos;t expose tenant names to owners yet. Open a tenant to see their
        name when they were onboarded from an application.
      </p>

      <DataTable
        caption="Tenants"
        columns={columns}
        data={pageData.items}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        onRowClick={(row) => navigate(`/app/residencies/${row.id}`)}
        pagination={{ page: pageData.page, limit: PAGE_SIZE, total: pageData.total, onPageChange: (p) => set({ page: p === 1 ? null : p }) }}
        emptyState={
          hasActiveFilters ? (
            <EmptyState
              icon={Users}
              title="No tenants match these filters"
              action={
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Users}
              title="No tenants yet."
              description="Add a tenant to start tracking their stay."
              action={
                canManage && (
                  <Button size="sm" className="gap-2" onClick={addTenant}>
                    <Plus className="h-4 w-4" aria-hidden="true" /> Add Tenant
                  </Button>
                )
              }
            />
          )
        }
      />
    </div>
  )
}
