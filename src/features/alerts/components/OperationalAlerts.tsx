import { AlertOctagon, AlertTriangle, ArrowRight, CheckCircle2, Info } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils/cn'
import type { AlertSeverity, OperationalAlert } from '../lib/buildAlerts'

const SEVERITY_STYLES: Record<AlertSeverity, { icon: typeof Info; label: string; className: string; iconClass: string }> = {
  critical: {
    icon: AlertOctagon,
    label: 'Critical',
    className: 'border-red-200 bg-red-50',
    iconClass: 'text-red-600',
  },
  warning: {
    icon: AlertTriangle,
    label: 'Needs attention',
    className: 'border-amber-200 bg-amber-50',
    iconClass: 'text-amber-600',
  },
  info: {
    icon: Info,
    label: 'For your information',
    className: 'border-sky-200 bg-sky-50',
    iconClass: 'text-sky-600',
  },
}

interface OperationalAlertsProps {
  alerts: OperationalAlert[]
  isLoading?: boolean
  /** Heading shown above the list; alerts render as a region labelled by it. */
  title?: string
}

export function OperationalAlerts({ alerts, isLoading, title = 'Needs your attention' }: OperationalAlertsProps) {
  if (isLoading && alerts.length === 0) {
    return (
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Loading alerts">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    )
  }

  return (
    <section aria-labelledby="operational-alerts-heading" className="space-y-3">
      <h2 id="operational-alerts-heading" className="text-sm font-bold text-[#182345]">
        {title}
      </h2>
      {alerts.length === 0 ? (
        <p className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          All clear — nothing needs action right now.
        </p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {alerts.map((alert) => {
            const style = SEVERITY_STYLES[alert.severity]
            const Icon = style.icon
            return (
              <li key={alert.id} className={cn('flex items-center gap-3 rounded-lg border px-4 py-3', style.className)}>
                <Icon className={cn('h-5 w-5 shrink-0', style.iconClass)} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#182345]">
                    <span className="sr-only">{style.label}: </span>
                    {alert.title}
                  </p>
                  {alert.description && <p className="text-xs text-[#4b5675]">{alert.description}</p>}
                </div>
                <Link
                  to={alert.action.to}
                  className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-primary hover:bg-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {alert.action.label}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
