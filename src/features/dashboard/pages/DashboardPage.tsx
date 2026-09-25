import { BedDouble, Building2, CalendarPlus, ClipboardList, DoorOpen, Plus, Receipt, UserPlus, Users, Utensils } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { APP_PATHS } from '@/app/router/paths'
import { MetricCard } from '@/components/data-display/MetricCard'
import { SectionBoundary } from '@/components/feedback/ErrorBoundary'
import { EmptyState } from '@/components/feedback/EmptyState'
import { buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { OperationalAlerts } from '@/features/alerts/components/OperationalAlerts'
import { useOperationalAlerts } from '@/features/alerts/hooks/useOperationalAlerts'
import { useCurrentOrganization } from '@/features/organizations/hooks/useCurrentOrganization'
import { useCurrentProperty } from '@/features/properties/hooks/useCurrentProperty'
import { useAuth } from '@/infrastructure/auth/AuthProvider'
import { hasPermission, type Permission } from '@/infrastructure/permissions/permissions'
import { formatDashboardDate } from '@/lib/formatters/date'
import { cn } from '@/lib/utils/cn'
import type { MembershipRole } from '@/types/api'
import { QuickActions, type QuickAction } from '../components/DashboardSections'
import { InvoiceTableCard } from '../components/InvoiceTableCard'
import { OccupancyCard } from '../components/OccupancyCard'
import { ApplicationPipelineCard, ComplaintsSummaryCard } from '../components/PipelineCards'
import { RecentActivityCard } from '../components/RecentActivityCard'
import { RentCollectionCard } from '../components/RentCollectionCard'
import { UpcomingVisitsCard } from '../components/UpcomingVisitsCard'
import { useComplaintCounts, useOccupancy } from '../hooks/useOperationalData'
import { greetingFor } from '../lib/metrics'

/** Renders children only when the role can view the module, inside a feature-level error
 * boundary keyed to the property — a crash in one section never takes down the dashboard. */
function Section({
  role,
  permission,
  propertyId,
  children,
}: {
  role: MembershipRole | null | undefined
  permission: Permission
  propertyId: string
  children: ReactNode
}) {
  if (!hasPermission(role, permission)) return null
  return <SectionBoundary resetKeys={[propertyId]}>{children}</SectionBoundary>
}

export function DashboardPage() {
  const { user } = useAuth()
  const organization = useCurrentOrganization()
  const { property, properties, isLoading: propertiesLoading } = useCurrentProperty()
  const role = organization?.yourRole
  const now = new Date()
  const firstName = user?.name?.split(' ')[0]

  if (propertiesLoading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <Skeleton className="h-9 w-72" />
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="space-y-6">
        <DashboardHeader greeting={greetingFor(now)} firstName={firstName} date={formatDashboardDate(now)} />
        <EmptyState
          icon={Building2}
          title="No properties yet"
          description="Create your first property to start managing your PG."
          action={
            hasPermission(role, 'properties.manage') ? (
              <Link to={`${APP_PATHS.properties}/new`} className={cn(buttonVariants(), 'flex items-center gap-2')}>
                <Plus className="h-4 w-4" aria-hidden="true" /> Add Property
              </Link>
            ) : undefined
          }
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <DashboardHeader
        greeting={greetingFor(now)}
        firstName={firstName}
        date={formatDashboardDate(now)}
        propertyName={property.name}
        propertyCount={properties.length}
      />

      <SectionBoundary resetKeys={[property.id]}>
        <DashboardAlerts propertyId={property.id} role={role} />
      </SectionBoundary>

      <SectionBoundary resetKeys={[property.id]}>
        <KeyMetrics propertyId={property.id} role={role} propertyCount={properties.length} />
      </SectionBoundary>

      <div className="grid gap-4 xl:grid-cols-2">
        <Section role={role} permission="rooms.view" propertyId={property.id}>
          <OccupancyCard propertyId={property.id} />
        </Section>
        <Section role={role} permission="billing.view" propertyId={property.id}>
          <RentCollectionCard propertyId={property.id} />
        </Section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Section role={role} permission="applications.view" propertyId={property.id}>
          <ApplicationPipelineCard propertyId={property.id} />
        </Section>
        <Section role={role} permission="complaints.view" propertyId={property.id}>
          <ComplaintsSummaryCard propertyId={property.id} />
        </Section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Section role={role} permission="billing.view" propertyId={property.id}>
          <InvoiceTableCard propertyId={property.id} kind="overdue" />
        </Section>
        <Section role={role} permission="billing.view" propertyId={property.id}>
          <InvoiceTableCard propertyId={property.id} kind="dueSoon" />
        </Section>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Section role={role} permission="visits.view" propertyId={property.id}>
          <UpcomingVisitsCard propertyId={property.id} />
        </Section>
        <SectionBoundary resetKeys={[property.id]}>
          <RecentActivityCard propertyId={property.id} role={role} className="xl:col-span-2" />
        </SectionBoundary>
      </div>

      <QuickActions actions={buildQuickActions(property.id, role)} />
    </div>
  )
}

function DashboardHeader({
  greeting,
  firstName,
  date,
  propertyName,
  propertyCount,
}: {
  greeting: string
  firstName?: string
  date: string
  propertyName?: string
  propertyCount?: number
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-[#182345] md:text-[28px]">
          {greeting}
          {firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {propertyName ? (
            <>
              Here&apos;s what&apos;s happening at <strong className="font-semibold text-[#182345]">{propertyName}</strong>{' '}
              today.
              {propertyCount && propertyCount > 1 ? ' Switch property from the header to see another.' : ''}
            </>
          ) : (
            "Here's what's happening across your PG business today."
          )}
        </p>
      </div>
      <p className="shrink-0 text-sm font-medium text-[#182345]">{date}</p>
    </div>
  )
}

function DashboardAlerts({ propertyId, role }: { propertyId: string; role: MembershipRole | null | undefined }) {
  const { alerts, isLoading } = useOperationalAlerts(propertyId, role)
  return <OperationalAlerts alerts={alerts} isLoading={isLoading} />
}

function KeyMetrics({
  propertyId,
  role,
  propertyCount,
}: {
  propertyId: string
  role: MembershipRole | null | undefined
  propertyCount: number
}) {
  const canRooms = hasPermission(role, 'rooms.view')
  const canComplaints = hasPermission(role, 'complaints.view')

  const occupancy = useOccupancy(canRooms ? propertyId : undefined)
  const complaints = useComplaintCounts(propertyId, canComplaints)
  const o = occupancy.snapshot
  // A failed domain shows "—" rather than a misleading 0; its section card below shows the error.
  const show = (failed: unknown, value: number | string) => (failed ? '—' : value)

  return (
    // Occupancy %, outstanding rent and pending applications are deliberately not tiles here:
    // the Occupancy, Tenant Rent Collection and Application Pipeline cards below show them.
    <section aria-label="Key metrics" className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
      <MetricCard label="Properties" value={propertyCount} icon={Building2} tone="blue" to={APP_PATHS.properties} />
      {canRooms && (
        <>
          <MetricCard
            label="Beds in service"
            value={show(occupancy.error, o.inServiceBeds)}
            hint={`${occupancy.roomCount} room(s)`}
            icon={BedDouble}
            tone="violet"
            isLoading={occupancy.isLoading}
            to={APP_PATHS.rooms}
          />
          <MetricCard
            label="Occupied"
            value={show(occupancy.error, o.occupiedBeds)}
            icon={Users}
            tone="green"
            isLoading={occupancy.isLoading}
            to={APP_PATHS.tenants}
          />
          <MetricCard
            label="Vacant"
            value={show(occupancy.error, o.vacantBeds)}
            icon={DoorOpen}
            tone="pink"
            isLoading={occupancy.isLoading}
            to={APP_PATHS.rooms}
          />
        </>
      )}
      {canComplaints && (
        <MetricCard
          label="Open complaints"
          value={show(complaints.error, complaints.unresolved)}
          hint="Open, assigned or in progress"
          icon={ClipboardList}
          tone="pink"
          isLoading={complaints.isLoading}
          to={APP_PATHS.complaints}
        />
      )}
    </section>
  )
}

function buildQuickActions(propertyId: string, role: MembershipRole | null | undefined): QuickAction[] {
  const actions: QuickAction[] = []
  if (hasPermission(role, 'residency.manage')) {
    actions.push({ label: 'Add Tenant', icon: UserPlus, to: `${APP_PATHS.properties}/${propertyId}/residencies/new`, tone: 'blue' })
  }
  if (hasPermission(role, 'rooms.manage')) {
    actions.push({ label: 'Add Room', icon: BedDouble, to: APP_PATHS.rooms, tone: 'pink' })
  }
  if (hasPermission(role, 'properties.manage')) {
    actions.push({ label: 'Add Property', icon: Building2, to: `${APP_PATHS.properties}/new`, tone: 'violet' })
  }
  if (hasPermission(role, 'billing.view')) {
    actions.push({ label: 'Invoices', icon: Receipt, to: `${APP_PATHS.billing}/invoices`, tone: 'orange' })
  }
  if (hasPermission(role, 'visits.view')) {
    actions.push({ label: 'Visits', icon: CalendarPlus, to: APP_PATHS.visits, tone: 'sky' })
  }
  if (hasPermission(role, 'food.manage')) {
    actions.push({ label: "Today's Menu", icon: Utensils, to: `${APP_PATHS.food}/menu`, tone: 'green' })
  }
  return actions
}
