import { QueryState } from '@/components/feedback/QueryState'
import { Link } from 'react-router-dom'
import { ComplaintPriorityBadge } from '@/features/complaints/components/ComplaintPriorityBadge'
import { ComplaintStatusBadge } from '@/features/complaints/components/ComplaintStatusBadge'
import { useComplaints } from '@/features/complaints/hooks/useComplaints'

export function ComplaintsTab({ propertyId }: { propertyId: string }) {
  const { data, isLoading, error, refetch } = useComplaints({ propertyId, limit: 10, sortBy: 'createdAt', sortDir: 'desc' })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Most recent complaints for this property.</p>
        <Link to="/app/complaints" className="text-sm font-medium text-primary underline underline-offset-2">
          View all complaints →
        </Link>
      </div>
      <QueryState
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        isEmpty={!data || data.items.length === 0}
        empty={<p className="text-sm text-muted-foreground">No complaints yet.</p>}
      >
        <ul className="divide-y divide-border rounded-lg border border-border">
          {data?.items.map((complaint) => (
            <li key={complaint.id} className="flex items-center justify-between px-4 py-2 text-sm">
              <Link to={`/app/complaints/${complaint.id}`} className="font-medium underline underline-offset-2">
                {complaint.title}
              </Link>
              <div className="flex items-center gap-2">
                <ComplaintPriorityBadge priority={complaint.priority} />
                <ComplaintStatusBadge status={complaint.status} />
              </div>
            </li>
          ))}
        </ul>
      </QueryState>
    </div>
  )
}
