import { QueryState } from '@/components/feedback/QueryState'
import { Link } from 'react-router-dom'
import { ComplaintStatusBadge } from '@/features/complaints/components/ComplaintStatusBadge'
import { useComplaints } from '@/features/complaints/hooks/useComplaints'

export function ComplaintsTab({ propertyId, residencyId }: { propertyId: string; residencyId: string }) {
  // The complaints list endpoint has no residencyId filter (see docs/backend-gaps.md) — fetch a
  // generous page for the property and filter client-side. Acceptable at typical PG complaint
  // volume; a residency with more than 100 complaints would need a dedicated backend filter.
  const { data, isLoading, error, refetch } = useComplaints({ propertyId, limit: 100, sortBy: 'createdAt', sortDir: 'desc' })
  const forResidency = (data?.items ?? []).filter((c) => c.residencyId === residencyId)

  return (
    <QueryState
      isLoading={isLoading}
      error={error}
      onRetry={() => void refetch()}
      isEmpty={forResidency.length === 0}
      empty={<p className="text-sm text-muted-foreground">No complaints from this tenant.</p>}
    >
      <ul className="divide-y divide-border">
        {forResidency.map((complaint) => (
          <li key={complaint.id} className="flex items-center justify-between py-2 text-sm">
            <Link to={`/app/complaints/${complaint.id}`} className="font-medium underline underline-offset-2">
              {complaint.title}
            </Link>
            <ComplaintStatusBadge status={complaint.status} />
          </li>
        ))}
      </ul>
    </QueryState>
  )
}
