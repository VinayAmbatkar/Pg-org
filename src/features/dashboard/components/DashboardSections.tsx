import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/feedback/ErrorState'
import { cn } from '@/lib/utils/cn'

export const DASHBOARD_CARD_CLASS = 'border-[#edf0f6] bg-white shadow-[0_4px_16px_rgba(32,52,95,0.04)]'

interface DashboardCardProps {
  title: string
  description?: string
  /** "View all" style link to the module behind the card. */
  link?: { to: string; label?: string }
  isLoading?: boolean
  error?: unknown
  onRetry?: () => void
  className?: string
  children: ReactNode
}

/** Shell for every dashboard / Property 360 section: consistent heading, and the section's own
 * loading and error states so one failed query never blanks the rest of the page. */
export function DashboardCard({ title, description, link, isLoading, error, onRetry, className, children }: DashboardCardProps) {
  return (
    <Card className={cn(DASHBOARD_CARD_CLASS, className)}>
      <CardContent className="flex h-full flex-col p-5 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-[#182345]">{title}</h2>
            {description && <p className="mt-1 text-[11px] text-muted-foreground">{description}</p>}
          </div>
          {link && (
            <Link
              to={link.to}
              className="shrink-0 rounded text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {link.label ?? 'View all'} <ArrowUpRight className="inline h-3.5 w-3.5" aria-hidden="true" />
              <span className="sr-only"> — {title}</span>
            </Link>
          )}
        </div>
        <div className="mt-4 flex-1">
          {error ? (
            <ErrorState compact error={error} onRetry={onRetry} />
          ) : isLoading ? (
            <div className="space-y-2" aria-busy="true">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
            </div>
          ) : (
            children
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export interface QuickAction {
  label: string
  icon: LucideIcon
  to: string
  tone: 'blue' | 'violet' | 'pink' | 'green' | 'orange' | 'sky'
}

const TONE_CLASSES = {
  blue: 'bg-[#eaf2ff] text-[#3775e8] hover:bg-[#dbeafe]',
  violet: 'bg-[#f0ebff] text-[#7651e7] hover:bg-[#e9dfff]',
  pink: 'bg-[#ffeaf5] text-[#ed4094] hover:bg-[#ffd6ea]',
  green: 'bg-[#e5fbf3] text-[#12ad79] hover:bg-[#ccf5e6]',
  orange: 'bg-[#fff4e5] text-[#b45309] hover:bg-[#ffedd5]',
  sky: 'bg-[#e8f4ff] text-[#0369a1] hover:bg-[#d6ebff]',
}

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  if (actions.length === 0) return null
  return (
    <DashboardCard title="Quick Actions">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {actions.map(({ label, icon: Icon, to, tone }) => (
          <Link
            key={label}
            to={to}
            className={cn(
              'flex flex-col items-center justify-center gap-2 rounded-xl px-3 py-4 text-center text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              TONE_CLASSES[tone],
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            {label}
          </Link>
        ))}
      </div>
    </DashboardCard>
  )
}
