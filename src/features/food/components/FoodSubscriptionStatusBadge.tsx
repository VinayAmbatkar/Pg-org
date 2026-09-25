import { StatusBadge } from '@/components/data-display/StatusBadge'
import type { FoodSubscriptionStatus } from '@/types/api'

// Styling lives in src/lib/status/statusConfig.ts; this wrapper keeps the feature-level API.
export function FoodSubscriptionStatusBadge({ status }: { status: FoodSubscriptionStatus }) {
  return <StatusBadge domain="foodSubscription" status={status} />
}
