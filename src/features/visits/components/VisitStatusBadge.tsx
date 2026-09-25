import { StatusBadge } from '@/components/data-display/StatusBadge'
import type { VisitStatus } from '@/types/api'

// Styling lives in src/lib/status/statusConfig.ts; this wrapper keeps the feature-level API.
export function VisitStatusBadge({ status }: { status: VisitStatus }) {
  return <StatusBadge domain="visit" status={status} />
}
