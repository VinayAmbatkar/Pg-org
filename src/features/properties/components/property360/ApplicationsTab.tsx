import { QueryState } from '@/components/feedback/QueryState'
import { Link } from 'react-router-dom'
import { ApplicationStatusBadge } from '@/features/applications/components/ApplicationStatusBadge'
import { useApplicationsForProperty } from '@/features/applications/hooks/useApplications'

export function ApplicationsTab({ propertyId }: { propertyId: string }) {
  const { data, isLoading, error, refetch } = useApplicationsForProperty(propertyId, { limit: 10 })
  const recent = data?.items ?? []

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Most recent applications for this property.</p>
        <Link to="/app/applications" className="text-sm font-medium text-primary underline underline-offset-2">
          View all applications →
        </Link>
      </div>
      <QueryState
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        isEmpty={recent.length === 0}
        empty={<p className="text-sm text-muted-foreground">No applications yet.</p>}
      >
        <ul className="divide-y divide-border rounded-lg border border-border">
          {recent.map((application) => (
            <li key={application.id} className="flex items-center justify-between px-4 py-2 text-sm">
              <Link to={`/app/applications/${application.id}`} className="font-medium underline underline-offset-2">
                {application.fullName}
              </Link>
              <ApplicationStatusBadge status={application.status} />
            </li>
          ))}
        </ul>
      </QueryState>
    </div>
  )
}
