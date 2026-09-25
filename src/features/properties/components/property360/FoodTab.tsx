import { QueryState } from '@/components/feedback/QueryState'
import { Link } from 'react-router-dom'
import { useFoodConfiguration } from '@/features/food/hooks/useFoodConfiguration'
import { useFoodSubscriptions } from '@/features/food/hooks/useFoodSubscriptions'
import { MEAL_TYPE_LABELS } from '@/lib/formatters/enumLabels'

export function FoodTab({ propertyId }: { propertyId: string }) {
  const { data: config, isLoading: configLoading, error: configError, refetch: refetchConfig } = useFoodConfiguration(propertyId)
  const { data: subscriptions, isLoading: subsLoading, error: subsError, refetch: refetchSubs } = useFoodSubscriptions(propertyId)
  const activeCount = (subscriptions ?? []).filter((s) => s.status === 'ACTIVE').length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Food summary for this property.</p>
        <Link to="/app/food" className="text-sm font-medium text-primary underline underline-offset-2">
          Manage food →
        </Link>
      </div>
      <QueryState
        isLoading={configLoading || subsLoading}
        error={configError ?? subsError}
        onRetry={() => {
          if (configError) void refetchConfig()
          if (subsError) void refetchSubs()
        }}
      >
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground">Food module</p>
            <p className="font-medium">{config?.enabled ? 'Enabled' : 'Disabled'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Included in rent</p>
            <p className="font-medium">
              {config?.mealsIncludedInRent ? config.includedMealTypes.map((m) => MEAL_TYPE_LABELS[m]).join(', ') || '—' : 'No'}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Active subscriptions</p>
            <p className="font-medium">{activeCount}</p>
          </div>
        </div>
      </QueryState>
    </div>
  )
}
