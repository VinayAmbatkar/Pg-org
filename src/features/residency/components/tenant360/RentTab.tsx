import { Link } from 'react-router-dom'
import { formatCurrency } from '@/lib/formatters/currency'
import { RentPlanStatusBadge } from '@/features/billing/components/RentPlanStatusBadge'
import { useRentPlan } from '@/features/billing/hooks/useRentPlan'

export function RentTab({ residencyId }: { residencyId: string }) {
  const { data: rentPlan, isLoading } = useRentPlan(residencyId)

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>

  if (!rentPlan) {
    return (
      <p className="text-sm text-muted-foreground">
        No rent plan set yet.{' '}
        <Link to="/app/billing/rent-plans" className="underline underline-offset-2">
          Set one up →
        </Link>
      </p>
    )
  }

  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Amount</span>
        <span className="font-medium">{formatCurrency(rentPlan.amount, rentPlan.currency)} / month</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Due day</span>
        <span>{rentPlan.dueDay}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Effective from</span>
        <span>{new Date(rentPlan.effectiveFrom).toLocaleDateString()}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Status</span>
        <RentPlanStatusBadge status={rentPlan.status} />
      </div>
      <Link to="/app/billing/rent-plans" className="inline-block text-sm font-medium text-primary underline underline-offset-2">
        Manage rent plan →
      </Link>
    </div>
  )
}
