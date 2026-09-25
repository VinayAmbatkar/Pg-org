import { StatusBadge } from '@/components/data-display/StatusBadge'
import type { RoomStatus } from '@/types/api'

// Styling lives in src/lib/status/statusConfig.ts; this wrapper keeps the feature-level API.
export function RoomStatusBadge({ status }: { status: RoomStatus }) {
  return <StatusBadge domain="room" status={status} />
}
