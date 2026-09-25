import { Link } from 'react-router-dom'
import { COMPLAINT_STATUS_LABELS } from '@/lib/formatters/enumLabels'
import { PIPELINE_STAGES, useApplicationPipeline, useComplaintCounts } from '../hooks/useOperationalData'
import { DashboardCard } from './DashboardSections'

interface StageBarProps {
  label: string
  count: number
  max: number
  to: string
  color: string
}

/** One row of a stage breakdown. Bar width is relative to the largest stage, purely visual — the
 * count is always printed, so nothing depends on reading the bar. */
function StageBar({ label, count, max, to, color }: StageBarProps) {
  const width = max > 0 ? Math.max(4, Math.round((count / max) * 100)) : 0
  return (
    <li>
      <Link
        to={to}
        className="group block rounded-md px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#4b5675] group-hover:text-[#182345] group-hover:underline">{label}</span>
          <span className="font-semibold text-[#182345]">{count}</span>
        </div>
        <div className="mt-1 h-2 w-full rounded-full bg-[#eef1f7]" aria-hidden="true">
          <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: color }} />
        </div>
      </Link>
    </li>
  )
}

const PIPELINE_COLORS = ['#8b7cf7', '#6956e8', '#4775ed', '#12ad79']

export function ApplicationPipelineCard({ propertyId, className }: { propertyId: string; className?: string }) {
  const { counts, isLoading, error, refetch } = useApplicationPipeline(propertyId)
  const max = Math.max(...Object.values(counts))

  return (
    <DashboardCard
      title="Application Pipeline"
      description="Applications currently at each stage (not a conversion funnel)."
      link={{ to: '/app/applications' }}
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
      className={className}
    >
      <ol className="space-y-2">
        {PIPELINE_STAGES.map((stage, i) => (
          <StageBar
            key={stage.status}
            label={stage.label}
            count={counts[stage.status]}
            max={max}
            to={`/app/applications?status=${stage.status}`}
            color={PIPELINE_COLORS[i]}
          />
        ))}
      </ol>
      <p className="mt-3 text-[11px] text-muted-foreground">
        Approved applicants move on to tenant onboarding from the application page.
      </p>
    </DashboardCard>
  )
}

const COMPLAINT_ROWS = [
  { status: 'OPEN', color: '#ed4094' },
  { status: 'ASSIGNED', color: '#f59e0b' },
  { status: 'IN_PROGRESS', color: '#4775ed' },
  { status: 'RESOLVED', color: '#12ad79' },
] as const

export function ComplaintsSummaryCard({ propertyId, className }: { propertyId: string; className?: string }) {
  const { counts, unresolved, highPriorityUnassigned, isLoading, error, refetch } = useComplaintCounts(propertyId, true)
  const max = Math.max(...Object.values(counts))

  return (
    <DashboardCard
      title="Complaints"
      link={{ to: '/app/complaints' }}
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
      className={className}
    >
      <div className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <p>
          <span className="text-2xl font-bold text-[#182345]">{unresolved}</span>{' '}
          <span className="text-xs text-muted-foreground">unresolved</span>
        </p>
        {highPriorityUnassigned > 0 && (
          <p className="text-xs font-semibold text-red-700">{highPriorityUnassigned} high priority, unassigned</p>
        )}
        {counts.OPEN > 0 && <p className="text-xs text-[#4b5675]">{counts.OPEN} awaiting assignment</p>}
      </div>
      <ol className="space-y-2">
        {COMPLAINT_ROWS.map((row) => (
          <StageBar
            key={row.status}
            label={COMPLAINT_STATUS_LABELS[row.status]}
            count={counts[row.status]}
            max={max}
            to={`/app/complaints?status=${row.status}`}
            color={row.color}
          />
        ))}
      </ol>
    </DashboardCard>
  )
}
