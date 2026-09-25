import { StatusBadge } from '@/components/data-display/StatusBadge'
import type { RentPlanStatus } from '@/types/api'

// Styling lives in src/lib/status/statusConfig.ts; this wrapper keeps the feature-level API.
export function RentPlanStatusBadge({ status }: { status: RentPlanStatus }) {
  return <StatusBadge domain="rentPlan" status={status} />
}
