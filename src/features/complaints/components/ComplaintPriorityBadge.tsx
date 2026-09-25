import { StatusBadge } from '@/components/data-display/StatusBadge'
import type { ComplaintPriority } from '@/types/api'

// Styling lives in src/lib/status/statusConfig.ts; this wrapper keeps the feature-level API.
export function ComplaintPriorityBadge({ priority }: { priority: ComplaintPriority }) {
  return <StatusBadge domain="complaintPriority" status={priority} />
}
