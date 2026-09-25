import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils/cn'

interface MetricCardProps {
  label: string
  value: number | string
  icon: LucideIcon
  isLoading?: boolean
  tone?: 'blue' | 'violet' | 'pink' | 'green' | 'orange'
  /** Omit when there's no real trend to report — never fabricate one. */
  trend?: string
  /** One short line of context under the value (e.g. what the number counts). */
  hint?: string
  /** Makes the whole card a link to the module behind the number. */
  to?: string
}

const TONE_CLASSES = {
  blue: 'bg-[#eaf2ff] text-[#3775e8]',
  violet: 'bg-[#f0ebff] text-[#7651e7]',
  pink: 'bg-[#ffeaf5] text-[#ed4094]',
  green: 'bg-[#e5fbf3] text-[#12ad79]',
  orange: 'bg-[#fff4e5] text-[#f59e0b]',
}

/** Shared stat tile used across the dashboard, Property 360 and every module's summary cards. */
export function MetricCard({ label, value, icon: Icon, isLoading, tone = 'blue', trend, hint, to }: MetricCardProps) {
  const body = (
    <Card
      className={cn(
        'h-full border-[#edf0f6] bg-white shadow-[0_4px_16px_rgba(32,52,95,0.04)]',
        to && 'transition-colors group-hover:border-[#d9def0] group-hover:bg-[#fbfcff]',
      )}
    >
      <CardContent className="p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            {isLoading ? (
              <Skeleton className="mt-1.5 h-7 w-14" />
            ) : (
              <p className="mt-1 truncate text-2xl font-bold text-[#182345]">{value}</p>
            )}
            {hint && !isLoading && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
            {trend && (
              <p className="mt-1.5 flex items-center gap-0.5 text-[10px] font-medium text-emerald-600">
                <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                {trend}
              </p>
            )}
          </div>
          <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', TONE_CLASSES[tone])}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        </div>
      </CardContent>
    </Card>
  )

  if (!to) return body

  return (
    <Link
      to={to}
      className="group block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6956e8]"
    >
      {body}
    </Link>
  )
}
