import { BedDouble, DoorOpen, UserCheck } from 'lucide-react'
import { MetricCard } from '@/components/data-display/MetricCard'
import { useOccupancy } from '@/features/dashboard/hooks/useOperationalData'
import { Link } from 'react-router-dom'
import { APP_PATHS } from '@/app/router/paths'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/feedback/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { useCurrentOrganization } from '@/features/organizations/hooks/useCurrentOrganization'
import { useCurrentProperty } from '@/features/properties/hooks/useCurrentProperty'
import { hasPermission } from '@/infrastructure/permissions/permissions'
import { RoomsBedsPanel } from '../components/RoomsBedsPanel'

/** Top-level Rooms & Beds module (/app/rooms). Scoped to the property chosen in the header
 * switcher — the same property context the Tenants module uses — rather than duplicating
 * property selection state here. */
export function RoomsBedsPage() {
  const organization = useCurrentOrganization()
  const { property, isLoading } = useCurrentProperty()
  const role = organization?.yourRole

  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (!property) {
    return (
      <EmptyState
        icon={BedDouble}
        title="No property yet"
        description="Add a property first, then set up its rooms and beds."
        action={
          <Link to={APP_PATHS.properties}>
            <Button size="sm">Go to Properties</Button>
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rooms & Beds"
        description={`${property.name} · ${property.city}. Switch property from the header to see another property's rooms.`}
      />
      <RoomStats propertyId={property.id} />
      <RoomsBedsPanel
        propertyId={property.id}
        canManage={hasPermission(role, 'rooms.manage')}
        canArchive={hasPermission(role, 'rooms.archive')}
      />
    </div>
  )
}

/** Property-level occupancy. Per-room/per-bed occupancy isn't readable from pg-backend (no
 * bed-allocation lookup), so occupied/vacant are shown for the property as a whole only. */
function RoomStats({ propertyId }: { propertyId: string }) {
  const { snapshot: o, roomCount, isLoading, error } = useOccupancy(propertyId)
  const show = (value: number | string) => (error ? '—' : value)
  return (
    <section aria-label="Room summary" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <MetricCard label="Rooms" value={show(roomCount)} icon={DoorOpen} tone="violet" isLoading={isLoading} />
      <MetricCard label="Beds in service" value={show(o.inServiceBeds)} icon={BedDouble} tone="blue" isLoading={isLoading} />
      <MetricCard
        label="Occupied"
        value={show(o.occupiedBeds)}
        hint={o.occupancyRate === null ? undefined : `${o.occupancyRate}% of beds in service`}
        icon={UserCheck}
        tone="green"
        isLoading={isLoading}
      />
      <MetricCard
        label="Vacant"
        value={show(o.vacantBeds)}
        hint={o.inServiceBeds > 0 ? `${100 - (o.occupancyRate ?? 0)}% of beds in service` : undefined}
        icon={BedDouble}
        tone="orange"
        isLoading={isLoading}
      />
    </section>
  )
}
