import { Building2, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { DataTable, type DataTableColumn } from '@/components/data-table/DataTable'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useCurrentOrganization } from '@/features/organizations/hooks/useCurrentOrganization'
import { hasPermission } from '@/infrastructure/permissions/permissions'
import { cn } from '@/lib/utils/cn'
import type { Property } from '@/types/api'
import { PropertyStatusBadge } from '../components/PropertyStatusBadge'
import { useProperties } from '../hooks/useProperties'

export function PropertiesListPage() {
  const organization = useCurrentOrganization()
  const navigate = useNavigate()
  const { data: properties, isLoading, error, refetch } = useProperties(organization?.id)
  const [search, setSearch] = useState('')

  const canManage = hasPermission(organization?.yourRole, 'properties.manage')

  // The backend has no search/sort param on GET /properties, so filtering happens client-side
  // over the already-fetched list — acceptable at the scale of one organization's properties.
  const filtered = properties?.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))

  const columns: DataTableColumn<Property>[] = [
    { key: 'name', header: 'Property', render: (p) => <span className="font-medium">{p.name}</span> },
    { key: 'location', header: 'Location', render: (p) => `${p.city}, ${p.state}` },
    { key: 'type', header: 'Type', render: (p) => p.propertyType },
    { key: 'status', header: 'Status', render: (p) => <PropertyStatusBadge status={p.status} /> },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Properties</h1>
        {canManage && (
          <Link to="/app/properties/new" className={cn(buttonVariants(), 'gap-2')}>
            <Plus className="h-4 w-4" /> Add Property
          </Link>
        )}
      </div>

      <Input
        placeholder="Search properties…"
        className="max-w-xs"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        aria-label="Search properties"
      />

      <DataTable
        columns={columns}
        data={filtered}
        rowKey={(p) => p.id}
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        onRowClick={(p) => navigate(`/app/properties/${p.id}`)}
        emptyState={
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-medium">No properties yet.</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Create your first property to start managing your PG.
            </p>
            {canManage && (
              <Link to="/app/properties/new" className={cn(buttonVariants(), 'gap-2')}>
                <Plus className="h-4 w-4" /> Add Property
              </Link>
            )}
          </div>
        }
      />
    </div>
  )
}
