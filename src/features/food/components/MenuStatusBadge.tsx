import { StatusBadge } from '@/components/data-display/StatusBadge'
import type { MenuStatus } from '@/types/api'

// Styling lives in src/lib/status/statusConfig.ts; this wrapper keeps the feature-level API.
export function MenuStatusBadge({ status }: { status: MenuStatus }) {
  return <StatusBadge domain="menu" status={status} />
}
