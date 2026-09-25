import { lazy, Suspense } from 'react'
import { SectionBoundary } from '@/components/feedback/ErrorBoundary'
import { Skeleton } from '@/components/ui/skeleton'
import { useOccupancy } from '../hooks/useOperationalData'
import { DashboardCard } from './DashboardSections'

// Recharts is ~90 kB gzipped. Loading the donut lazily keeps it out of the Dashboard and
// Property 360 chunks: the numbers (the legend) render immediately, the chart streams in after.
const OccupancyDonut = lazy(() => import('./OccupancyDonut').then((m) => ({ default: m.OccupancyDonut })))

// Duplicated from OccupancyDonut on purpose — importing them from there would defeat the lazy split.
const OCCUPIED_COLOR = '#4775ed'
const VACANT_COLOR = '#dfe5f0'

export function OccupancyCard({ propertyId, className }: { propertyId: string; className?: string }) {
  const { snapshot, isLoading, error, refetch } = useOccupancy(propertyId)

  return (
    <DashboardCard
      title="Occupancy"
      description="Current snapshot. Historical occupancy isn't available from the backend yet."
      link={{ to: '/app/rooms', label: 'Rooms & Beds' }}
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
      className={className}
    >
      <div className="flex flex-wrap items-center gap-6">
        <SectionBoundary resetKeys={[propertyId]} title="Chart unavailable">
          <Suspense fallback={<Skeleton className="h-32 w-32 rounded-full" />}>
            <OccupancyDonut
              occupied={Math.min(snapshot.occupiedBeds, snapshot.inServiceBeds)}
              vacant={snapshot.vacantBeds}
              occupancyRate={snapshot.occupancyRate}
            />
          </Suspense>
        </SectionBoundary>
        <dl className="grid gap-2 text-xs text-[#64708e]">
          <LegendRow color={OCCUPIED_COLOR} label="Occupied beds" value={snapshot.occupiedBeds} />
          <LegendRow color={VACANT_COLOR} label="Vacant beds" value={snapshot.vacantBeds} />
          <LegendRow label="Beds in service" value={snapshot.inServiceBeds} />
          {snapshot.outOfServiceBeds > 0 && <LegendRow label="Out of service" value={snapshot.outOfServiceBeds} />}
          <LegendRow
            label="Occupancy rate"
            value={snapshot.occupancyRate === null ? 'No beds yet' : `${snapshot.occupancyRate}%`}
          />
        </dl>
      </div>
    </DashboardCard>
  )
}

function LegendRow({ color, label, value }: { color?: string; label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <dt className="flex items-center gap-2">
        {color ? (
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />
        ) : (
          <span className="inline-block h-2.5 w-2.5" aria-hidden="true" />
        )}
        {label}
      </dt>
      <dd className="font-semibold text-[#182345]">{value}</dd>
    </div>
  )
}
