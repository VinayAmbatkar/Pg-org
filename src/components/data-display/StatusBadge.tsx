import { Badge } from '@/components/ui/badge'
import { statusConfig, type StatusDomain } from '@/lib/status/statusConfig'

type StatusOf<D extends StatusDomain> = Parameters<(typeof statusConfig)[D]>[0]

/** Renders any backend status from the central statusConfig: always a text label (never colour
 * alone), plus an icon for attention/completion states. */
export function StatusBadge<D extends StatusDomain>({ domain, status }: { domain: D; status: StatusOf<D> }) {
  const style = (statusConfig[domain] as (s: StatusOf<D>) => ReturnType<(typeof statusConfig)[D]>)(status)
  const Icon = style.icon
  return (
    <Badge variant={style.variant} className="gap-1">
      {Icon && <Icon className="h-3 w-3" aria-hidden="true" />}
      {style.label}
    </Badge>
  )
}
