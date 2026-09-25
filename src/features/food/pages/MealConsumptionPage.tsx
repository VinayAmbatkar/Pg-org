import { Check } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { PageHeader } from '@/components/layout/PageHeader'
import { useToast } from '@/components/feedback/ToastProvider'
import { useCurrentProperty } from '@/features/properties/hooks/useCurrentProperty'
import { useResidenciesForProperty } from '@/features/residency/hooks/useResidenciesForProperty'
import { ApiError } from '@/infrastructure/api/errors'
import { MEAL_TYPE_LABELS } from '@/lib/formatters/enumLabels'
import type { MealType } from '@/types/api'
import { useMealConsumptions, useRecordMealConsumption } from '../hooks/useMealConsumptions'
import { toLocalDateString } from '@/lib/formatters/date'

const MEAL_TYPES: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'OTHER']

export function MealConsumptionPage() {
  const { property, isLoading: propertyLoading } = useCurrentProperty()
  const { toast } = useToast()
  const [date] = useState(() => toLocalDateString())
  const [mealType, setMealType] = useState<MealType>('LUNCH')

  const { data: residencies, isLoading: residenciesLoading } = useResidenciesForProperty(property?.id)
  const activeResidencies = (residencies ?? []).filter((r) => r.status === 'ACTIVE')

  const { data: consumptions, isLoading: consumptionsLoading } = useMealConsumptions(property?.id, {
    from: date,
    to: date,
    limit: 200,
  })
  const recordConsumption = useRecordMealConsumption(property?.id ?? '')

  const markedResidencyIds = new Set(
    (consumptions?.items ?? []).filter((c) => c.mealType === mealType).map((c) => c.residencyId),
  )

  async function onMark(residencyId: string) {
    try {
      await recordConsumption.mutateAsync({ residencyId, mealType, mealDate: date })
    } catch (err) {
      toast({ title: 'Unable to record meal', description: err instanceof ApiError ? err.message : undefined, variant: 'error' })
    }
  }

  const isLoading = propertyLoading || residenciesLoading || consumptionsLoading

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader
        title="Meal Consumption"
        description={`${new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}`}
        action={
          <Select value={mealType} onChange={(e) => setMealType(e.target.value as MealType)} className="max-w-[160px]" aria-label="Meal">
            {MEAL_TYPES.map((m) => (
              <option key={m} value={m}>{MEAL_TYPE_LABELS[m]}</option>
            ))}
          </Select>
        }
      />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : activeResidencies.length === 0 ? (
        <p className="text-sm text-muted-foreground">No active tenants at this property.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {activeResidencies.map((residency) => {
            const marked = markedResidencyIds.has(residency.id)
            return (
              <li key={residency.id} className="flex items-center justify-between px-4 py-3">
                <span className="font-mono text-xs">{residency.tenantId.slice(0, 8)}</span>
                {marked ? (
                  <span className="flex items-center gap-1 text-sm font-medium text-success">
                    <Check className="h-4 w-4" aria-hidden="true" /> Marked
                  </span>
                ) : (
                  <Button size="sm" variant="outline" isLoading={recordConsumption.isPending} onClick={() => onMark(residency.id)}>
                    Mark
                  </Button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
