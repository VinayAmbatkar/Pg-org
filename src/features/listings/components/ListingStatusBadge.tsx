import { Badge } from '@/components/ui/badge'
import type { ListingStatus } from '../types'

const CONFIG: Record<ListingStatus, { label: string; variant: 'success' | 'secondary' | 'warning' }> = {
  PUBLISHED: { label: 'Published', variant: 'success' },
  DRAFT: { label: 'Draft', variant: 'secondary' },
  UNPUBLISHED: { label: 'Unpublished', variant: 'warning' },
}

export function ListingStatusBadge({ status }: { status: ListingStatus }) {
  const { label, variant } = CONFIG[status] ?? { label: status, variant: 'secondary' as const }
  return <Badge variant={variant}>{label}</Badge>
}
