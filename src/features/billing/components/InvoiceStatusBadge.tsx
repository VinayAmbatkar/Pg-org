import { StatusBadge } from '@/components/data-display/StatusBadge'
import type { InvoiceStatus } from '@/types/api'

// Styling lives in src/lib/status/statusConfig.ts; this wrapper keeps the feature-level API.
export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return <StatusBadge domain="invoice" status={status} />
}
