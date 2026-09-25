import { StatusBadge } from '@/components/data-display/StatusBadge'
import type { PaymentStatus } from '@/types/api'

// Styling lives in src/lib/status/statusConfig.ts; this wrapper keeps the feature-level API.
export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <StatusBadge domain="payment" status={status} />
}
