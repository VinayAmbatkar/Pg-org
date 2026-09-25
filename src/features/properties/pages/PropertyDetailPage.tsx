import { Archive, ChevronLeft, Pencil } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { APP_PATHS } from '@/app/router/paths'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { SectionBoundary } from '@/components/feedback/ErrorBoundary'
import { ErrorState } from '@/components/feedback/ErrorState'
import { PageSpinner } from '@/components/feedback/PageSpinner'
import { TabPanel, Tabs } from '@/components/ui/tabs'
import { useToast } from '@/components/feedback/ToastProvider'
import { RoomsBedsPanel } from '@/features/rooms/components/RoomsBedsPanel'
import { TenantsPanel } from '@/features/tenants/components/TenantsPanel'
import { BillingTab } from '../components/property360/BillingTab'
import { ComplaintsTab } from '../components/property360/ComplaintsTab'
import { FoodTab } from '../components/property360/FoodTab'
import { ApplicationsTab } from '../components/property360/ApplicationsTab'
import { PropertyHealth } from '../components/property360/PropertyHealth'
import { VisitsTab } from '../components/property360/VisitsTab'
import { useCurrentOrganization } from '@/features/organizations/hooks/useCurrentOrganization'
import { hasPermission, type Permission } from '@/infrastructure/permissions/permissions'
import { ApiError } from '@/infrastructure/api/errors'
import { useUrlState } from '@/hooks/useUrlState'
import { useArchiveProperty } from '../hooks/usePropertyMutations'
import { useProperty } from '../hooks/useProperty'
import { useSyncCurrentProperty } from '../hooks/useSyncCurrentProperty'
import { PropertyStatusBadge } from '../components/PropertyStatusBadge'

// Each tab mounts (and therefore fetches) only when selected. A tab whose module the role can't
// view is not offered at all.
const TABS: { value: string; label: string; permission: Permission }[] = [
  { value: 'overview', label: 'Overview', permission: 'properties.view' },
  { value: 'rooms', label: 'Rooms & Beds', permission: 'rooms.view' },
  { value: 'tenants', label: 'Tenants', permission: 'tenants.view' },
  { value: 'billing', label: 'Billing', permission: 'billing.view' },
  { value: 'complaints', label: 'Complaints', permission: 'complaints.view' },
  { value: 'food', label: 'Food', permission: 'food.view' },
  { value: 'applications', label: 'Applications', permission: 'applications.view' },
  { value: 'visits', label: 'Visits', permission: 'visits.view' },
]

const TAB_ID = 'property-360'

export function PropertyDetailPage() {
  const { propertyId = '' } = useParams()
  const navigate = useNavigate()
  const organization = useCurrentOrganization()
  const { toast } = useToast()
  const { data: property, isLoading, error, refetch } = useProperty(propertyId)
  const archiveProperty = useArchiveProperty()
  const [requestedTab, setTab] = useUrlState('tab', 'overview')
  const [confirmArchive, setConfirmArchive] = useState(false)
  useSyncCurrentProperty(property?.id)

  const role = organization?.yourRole
  const canManage = hasPermission(role, 'properties.manage')
  const canArchive = hasPermission(role, 'properties.archive')
  const tabs = TABS.filter((t) => hasPermission(role, t.permission))
  // An unknown/forbidden ?tab= (old bookmark, role change) falls back to Overview.
  const tab = tabs.some((t) => t.value === requestedTab) ? requestedTab : 'overview'

  if (isLoading) return <PageSpinner />
  if (error || !property) return <ErrorState error={error} onRetry={() => refetch()} />

  async function handleArchive() {
    try {
      await archiveProperty.mutateAsync(propertyId)
      toast({ title: 'Property archived', variant: 'success' })
      setConfirmArchive(false)
      navigate(APP_PATHS.properties)
    } catch (err) {
      toast({ title: 'Unable to archive property', description: err instanceof ApiError ? err.message : undefined, variant: 'error' })
    }
  }

  return (
    <div className="space-y-6">
      <Link
        to={APP_PATHS.properties}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" /> All properties
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold">{property.name}</h1>
            <PropertyStatusBadge status={property.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {property.addressLine1}
            {property.addressLine2 ? `, ${property.addressLine2}` : ''}, {property.city}, {property.state} {property.postalCode}
          </p>
        </div>
        <div className="flex gap-2">
          {canManage && (
            <Link to={`${APP_PATHS.properties}/${propertyId}/edit`}>
              <Button variant="outline" className="gap-2">
                <Pencil className="h-4 w-4" aria-hidden="true" /> Edit
              </Button>
            </Link>
          )}
          {canArchive && property.status !== 'ARCHIVED' && (
            <Button variant="outline" className="gap-2 text-destructive" onClick={() => setConfirmArchive(true)}>
              <Archive className="h-4 w-4" aria-hidden="true" /> Archive
            </Button>
          )}
        </div>
      </div>

      <Tabs items={tabs} value={tab} onChange={setTab} label="Property sections" idBase={TAB_ID} />

      <TabPanel idBase={TAB_ID} value={tab}>
        <SectionBoundary resetKeys={[propertyId, tab]}>
          {tab === 'overview' && <PropertyHealth property={property} role={role} />}
          {tab === 'rooms' && (
            <RoomsBedsPanel
              propertyId={propertyId}
              canManage={hasPermission(role, 'rooms.manage')}
              canArchive={hasPermission(role, 'rooms.archive')}
            />
          )}
          {tab === 'tenants' && <TenantsPanel propertyId={propertyId} canManage={hasPermission(role, 'residency.manage')} />}
          {tab === 'billing' && <BillingTab propertyId={propertyId} />}
          {tab === 'complaints' && <ComplaintsTab propertyId={propertyId} />}
          {tab === 'food' && <FoodTab propertyId={propertyId} />}
          {tab === 'applications' && <ApplicationsTab propertyId={propertyId} />}
          {tab === 'visits' && <VisitsTab propertyId={propertyId} />}
        </SectionBoundary>
      </TabPanel>

      <ConfirmDialog
        open={confirmArchive}
        onClose={() => setConfirmArchive(false)}
        onConfirm={handleArchive}
        title={`Archive ${property.name}?`}
        description="Archived properties are hidden from active operations and can't take new rooms, beds or tenants. History stays viewable."
        confirmLabel="Archive property"
        isLoading={archiveProperty.isPending}
      />
    </div>
  )
}
