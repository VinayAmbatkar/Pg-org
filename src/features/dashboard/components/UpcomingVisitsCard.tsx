import { useState } from 'react'
import { Link } from 'react-router-dom'
import { VisitStatusBadge } from '@/features/visits/components/VisitStatusBadge'
import { useVisitsForProperty } from '@/features/visits/hooks/useVisits'
import { formatDateTime } from '@/lib/formatters/date'
import { DashboardCard } from './DashboardSections'

// GET /properties/:id/visits has pagination only (no status/date filter) and is ordered by
// createdAt desc, so upcoming visits are filtered client-side from the most recent 100 (the
// backend max page size). A visit created long ago but scheduled far ahead could be missed —
// documented in docs/backend-gaps.md.
const RECENT_VISITS = { page: 1, limit: 100 }

export function UpcomingVisitsCard({ propertyId, className }: { propertyId: string; className?: string }) {
  const { data, isLoading, error, refetch } = useVisitsForProperty(propertyId, RECENT_VISITS)
  // Fixed at mount: "upcoming" is relative to when the card was opened.
  const [now] = useState(() => Date.now())
  const upcoming = (data?.items ?? [])
    .filter((v) => (v.status === 'SCHEDULED' || v.status === 'REQUESTED') && v.scheduledStartAt)
    .filter((v) => new Date(v.scheduledStartAt as string).getTime() >= now)
    .sort((a, b) => (a.scheduledStartAt as string).localeCompare(b.scheduledStartAt as string))

  return (
    <DashboardCard
      title="Upcoming Visits"
      link={{ to: '/app/visits' }}
      isLoading={isLoading}
      error={error}
      onRetry={() => void refetch()}
      className={className}
    >
      {upcoming.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">No upcoming visits scheduled.</p>
      ) : (
        <ul className="divide-y divide-[#f2f4f9]">
          {upcoming.slice(0, 5).map((visit) => (
            <li key={visit.id} className="flex items-center justify-between gap-3 py-2.5 text-xs">
              <div className="min-w-0">
                <p className="font-medium text-[#182345]">{formatDateTime(visit.scheduledStartAt)}</p>
                {visit.applicationId && (
                  <Link to={`/app/applications/${visit.applicationId}`} className="text-primary hover:underline">
                    View application
                  </Link>
                )}
              </div>
              <VisitStatusBadge status={visit.status} />
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  )
}
