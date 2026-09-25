import { StatusBadge } from '@/components/data-display/StatusBadge'
import type { ResidencyStatus } from '@/types/api'

// Styling lives in src/lib/status/statusConfig.ts; this wrapper keeps the feature-level API.
export function ResidencyStatusBadge({ status }: { status: ResidencyStatus }) {
  return <StatusBadge domain="residency" status={status} />
}
