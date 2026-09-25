import { QueryState } from '@/components/feedback/QueryState'
import { Link } from 'react-router-dom'
import { VisitStatusBadge } from '@/features/visits/components/VisitStatusBadge'
import { useVisitsForProperty } from '@/features/visits/hooks/useVisits'
import { formatDateTime } from '@/lib/formatters/date'

export function VisitsTab({ propertyId }: { propertyId: string }) {
  // The visits list endpoint has no status filter, so a generous limit is fetched and narrowed
  // client-side — see docs/backend-gaps.md.
  const { data, isLoading, error, refetch } = useVisitsForProperty(propertyId, { page: 1, limit: 100 })
  const upcoming = (data?.items ?? []).filter((v) => v.status === 'REQUESTED' || v.status === 'SCHEDULED').slice(0, 10)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Upcoming visits for this property.</p>
        <Link to="/app/visits" className="text-sm font-medium text-primary underline underline-offset-2">
          View all visits →
        </Link>
      </div>
      <QueryState
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        isEmpty={upcoming.length === 0}
        empty={<p className="text-sm text-muted-foreground">No upcoming visits.</p>}
      >
        <ul className="divide-y divide-border rounded-lg border border-border">
          {upcoming.map((visit) => (
            <li key={visit.id} className="flex items-center justify-between px-4 py-2 text-sm">
              <span>{visit.scheduledStartAt ? formatDateTime(visit.scheduledStartAt) : 'Not yet scheduled'}</span>
              <VisitStatusBadge status={visit.status} />
            </li>
          ))}
        </ul>
      </QueryState>
    </div>
  )
}
