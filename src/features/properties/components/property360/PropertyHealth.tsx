import { BedDouble, ClipboardList, DoorOpen, Receipt, UserPlus, Users } from 'lucide-react'
import { MetricCard } from '@/components/data-display/MetricCard'
import { SectionBoundary } from '@/components/feedback/ErrorBoundary'
import { OperationalAlerts } from '@/features/alerts/components/OperationalAlerts'
import { useOperationalAlerts } from '@/features/alerts/hooks/useOperationalAlerts'
import { OccupancyCard } from '@/features/dashboard/components/OccupancyCard'
import { RentCollectionCard } from '@/features/dashboard/components/RentCollectionCard'
import {
  useApplicationPipeline,
  useComplaintCounts,
  useOccupancy,
  useRentCollection,
} from '@/features/dashboard/hooks/useOperationalData'
import { hasPermission } from '@/infrastructure/permissions/permissions'
import { formatCurrency } from '@/lib/formatters/currency'
import { PROPERTY_TYPE_LABELS } from '@/lib/formatters/enumLabels'
import type { MembershipRole, Property } from '@/types/api'

/** Property 360 overview. Deliberately a set of real, individually-sourced figures rather than a
 * single "health score": there is no agreed business formula for one, and a made-up weighting
 * would look authoritative while meaning nothing. */
export function PropertyHealth({ property, role }: { property: Property; role: MembershipRole | null | undefined }) {
  const canRooms = hasPermission(role, 'rooms.view')
  const canBilling = hasPermission(role, 'billing.view')
  const canComplaints = hasPermission(role, 'complaints.view')
  const canApplications = hasPermission(role, 'applications.view')

  const occupancy = useOccupancy(canRooms ? property.id : undefined)
  const rent = useRentCollection(canBilling ? property.id : undefined)
  const complaints = useComplaintCounts(property.id, canComplaints)
  const pipeline = useApplicationPipeline(canApplications ? property.id : undefined)
  const { alerts, isLoading: alertsLoading } = useOperationalAlerts(property.id, role)
  const o = occupancy.snapshot
  const show = (failed: unknown, value: number | string) => (failed ? '—' : value)

  return (
    <div className="space-y-6">
      <section aria-label="Property health" className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {canRooms && (
          <>
            <MetricCard
              label="Occupancy"
              value={show(occupancy.error, o.occupancyRate === null ? '—' : `${o.occupancyRate}%`)}
              hint={`${o.occupiedBeds} of ${o.inServiceBeds} beds`}
              icon={BedDouble}
              tone="blue"
              isLoading={occupancy.isLoading}
            />
            <MetricCard
              label="Vacant beds"
              value={show(occupancy.error, o.vacantBeds)}
              icon={DoorOpen}
              tone="pink"
              isLoading={occupancy.isLoading}
            />
            <MetricCard
              label="Awaiting check-in"
              value={show(occupancy.error, o.pendingCheckIns)}
              icon={Users}
              tone="violet"
              isLoading={occupancy.isLoading}
            />
          </>
        )}
        {canBilling && (
          <MetricCard
            label="Outstanding rent"
            value={show(rent.error, formatCurrency(rent.snapshot.outstandingExact, rent.snapshot.currency))}
            hint={rent.snapshot.overdueInvoices.length > 0 ? `${rent.snapshot.overdueInvoices.length} overdue` : undefined}
            icon={Receipt}
            tone="orange"
            isLoading={rent.isLoading}
          />
        )}
        {canComplaints && (
          <MetricCard
            label="Open complaints"
            value={show(complaints.error, complaints.unresolved)}
            icon={ClipboardList}
            tone="pink"
            isLoading={complaints.isLoading}
          />
        )}
        {canApplications && (
          <MetricCard
            label="Pending applications"
            value={show(pipeline.error, pipeline.pending)}
            icon={UserPlus}
            tone="green"
            isLoading={pipeline.isLoading}
          />
        )}
      </section>

      <SectionBoundary resetKeys={[property.id]}>
        <OperationalAlerts alerts={alerts} isLoading={alertsLoading} title="Needs attention at this property" />
      </SectionBoundary>

      <div className="grid gap-4 xl:grid-cols-2">
        {canRooms && (
          <SectionBoundary resetKeys={[property.id]}>
            <OccupancyCard propertyId={property.id} />
          </SectionBoundary>
        )}
        {canBilling && (
          <SectionBoundary resetKeys={[property.id]}>
            <RentCollectionCard propertyId={property.id} />
          </SectionBoundary>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-white p-5 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">Property type</dt>
          <dd className="font-medium">{PROPERTY_TYPE_LABELS[property.propertyType] ?? property.propertyType}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Rooms</dt>
          <dd className="font-medium">{canRooms ? occupancy.roomCount : '—'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">City</dt>
          <dd className="font-medium">{property.city}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">State</dt>
          <dd className="font-medium">{property.state}</dd>
        </div>
      </dl>
    </div>
  )
}
