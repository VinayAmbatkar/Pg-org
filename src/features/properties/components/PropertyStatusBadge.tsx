import { StatusBadge } from '@/components/data-display/StatusBadge'
import type { PropertyStatus } from '@/types/api'

// Styling lives in src/lib/status/statusConfig.ts; this wrapper keeps the feature-level API.
export function PropertyStatusBadge({ status }: { status: PropertyStatus }) {
  return <StatusBadge domain="property" status={status} />
}
