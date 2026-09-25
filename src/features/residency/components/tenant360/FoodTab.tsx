import { QueryState } from '@/components/feedback/QueryState'
import { FoodSubscriptionStatusBadge } from '@/features/food/components/FoodSubscriptionStatusBadge'
import { useFoodSubscriptions } from '@/features/food/hooks/useFoodSubscriptions'
import { formatCurrency } from '@/lib/formatters/currency'
import { MEAL_TYPE_LABELS } from '@/lib/formatters/enumLabels'

export function FoodTab({ propertyId, residencyId }: { propertyId: string; residencyId: string }) {
  const { data: subscriptions, isLoading, error, refetch } = useFoodSubscriptions(propertyId)
  const subscription = (subscriptions ?? []).find((s) => s.residencyId === residencyId)

  if (isLoading || error || !subscription) {
    return (
      <QueryState
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        isEmpty
        empty={<p className="text-sm text-muted-foreground">No food subscription for this residency.</p>}
      >
        {null}
      </QueryState>
    )
  }

  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Meal types</span>
        <span>{subscription.mealTypesSnapshot.map((m) => MEAL_TYPE_LABELS[m]).join(', ')}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Price</span>
        <span>{formatCurrency(subscription.priceSnapshot, subscription.currency)} / month</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Status</span>
        <FoodSubscriptionStatusBadge status={subscription.status} />
      </div>
    </div>
  )
}
