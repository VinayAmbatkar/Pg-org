import { StatusBadge } from '@/components/data-display/StatusBadge'
import type { ApplicationStatus } from '@/types/api'

// Styling lives in src/lib/status/statusConfig.ts; this wrapper keeps the feature-level API.
export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  return <StatusBadge domain="application" status={status} />
}
