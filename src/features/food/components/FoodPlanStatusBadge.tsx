import { StatusBadge } from '@/components/data-display/StatusBadge'
import type { FoodPlanStatus } from '@/types/api'

// Styling lives in src/lib/status/statusConfig.ts; this wrapper keeps the feature-level API.
export function FoodPlanStatusBadge({ status }: { status: FoodPlanStatus }) {
  return <StatusBadge domain="foodPlan" status={status} />
}
