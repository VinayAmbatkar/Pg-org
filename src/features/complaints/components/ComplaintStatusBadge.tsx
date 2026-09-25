import { StatusBadge } from '@/components/data-display/StatusBadge'
import type { ComplaintStatus } from '@/types/api'

// Styling lives in src/lib/status/statusConfig.ts; this wrapper keeps the feature-level API.
export function ComplaintStatusBadge({ status }: { status: ComplaintStatus }) {
  return <StatusBadge domain="complaint" status={status} />
}
