import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorState } from '@/components/feedback/ErrorState'
import { PageSpinner } from '@/components/feedback/PageSpinner'
import { useToast } from '@/components/feedback/ToastProvider'
import { useCurrentOrganization } from '@/features/organizations/hooks/useCurrentOrganization'
import { useCurrentProperty } from '@/features/properties/hooks/useCurrentProperty'
import { hasPermission } from '@/infrastructure/permissions/permissions'
import { ApiError } from '@/infrastructure/api/errors'
import { MEAL_TYPE_LABELS } from '@/lib/formatters/enumLabels'
import type { FoodConfiguration, MealType } from '@/types/api'
import { useFoodConfiguration, useUpdateFoodConfiguration } from '../hooks/useFoodConfiguration'

const MEAL_TYPES: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'OTHER']

export function FoodConfigurationPage() {
  const { property, isLoading: propertyLoading } = useCurrentProperty()
  const organization = useCurrentOrganization()
  const canManage = hasPermission(organization?.yourRole, 'food.manage')

  const { data: config, isLoading, error, refetch } = useFoodConfiguration(property?.id)

  if (propertyLoading || isLoading) return <PageSpinner />
  if (error) return <ErrorState error={error} onRetry={() => refetch()} />
  if (!property || !config) return null

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title="Food Configuration" description={`Meal settings for ${property.name}.`} />
      {/* Keyed on config.id so a refetched config (e.g. after another tab's edit) re-initializes
          this form's local state via remount, instead of a useEffect syncing it post-render. */}
      <ConfigForm key={config.id} propertyId={property.id} config={config} canManage={canManage} />
    </div>
  )
}

function ConfigForm({ propertyId, config, canManage }: { propertyId: string; config: FoodConfiguration; canManage: boolean }) {
  const { toast } = useToast()
  const updateConfig = useUpdateFoodConfiguration(propertyId)

  const [enabled, setEnabled] = useState(config.enabled)
  const [mealsIncludedInRent, setMealsIncludedInRent] = useState(config.mealsIncludedInRent)
  const [includedMealTypes, setIncludedMealTypes] = useState<MealType[]>(config.includedMealTypes)
  const [optionalSubscriptionEnabled, setOptionalSubscriptionEnabled] = useState(config.optionalSubscriptionEnabled)

  const dirty =
    enabled !== config.enabled ||
    mealsIncludedInRent !== config.mealsIncludedInRent ||
    optionalSubscriptionEnabled !== config.optionalSubscriptionEnabled ||
    includedMealTypes.length !== config.includedMealTypes.length ||
    includedMealTypes.some((m) => !config.includedMealTypes.includes(m))

  function toggleMealType(mealType: MealType) {
    setIncludedMealTypes((prev) => (prev.includes(mealType) ? prev.filter((m) => m !== mealType) : [...prev, mealType]))
  }

  async function onSave() {
    try {
      await updateConfig.mutateAsync({ enabled, mealsIncludedInRent, includedMealTypes, optionalSubscriptionEnabled })
      toast({ title: 'Food configuration saved', variant: 'success' })
    } catch (err) {
      toast({ title: 'Unable to save', description: err instanceof ApiError ? err.message : undefined, variant: 'error' })
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Food included in rent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleRow label="Food module enabled" checked={enabled} onChange={setEnabled} disabled={!canManage} />
          <ToggleRow
            label="Meals included in rent"
            checked={mealsIncludedInRent}
            onChange={setMealsIncludedInRent}
            disabled={!canManage || !enabled}
          />
          {mealsIncludedInRent && (
            <div className="space-y-2 pl-1">
              <p className="text-sm text-muted-foreground">Included meals</p>
              <div className="flex flex-wrap gap-3">
                {MEAL_TYPES.map((mealType) => (
                  <label key={mealType} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={includedMealTypes.includes(mealType)}
                      onChange={() => toggleMealType(mealType)}
                      disabled={!canManage}
                      className="h-4 w-4 rounded border-input"
                    />
                    {MEAL_TYPE_LABELS[mealType]}
                  </label>
                ))}
              </div>
            </div>
          )}
          <ToggleRow
            label="Optional meal subscriptions"
            checked={optionalSubscriptionEnabled}
            onChange={setOptionalSubscriptionEnabled}
            disabled={!canManage || !enabled}
          />
        </CardContent>
      </Card>

      {canManage && (
        <div className="flex justify-end">
          <Button disabled={!dirty} isLoading={updateConfig.isPending} onClick={onSave}>
            Save changes
          </Button>
        </div>
      )}
    </>
  )
}

function ToggleRow({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}) {
  return (
    <label className="flex items-center justify-between gap-4">
      <span className="text-sm font-medium">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 ${checked ? 'bg-primary' : 'bg-muted'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
        />
      </button>
    </label>
  )
}
