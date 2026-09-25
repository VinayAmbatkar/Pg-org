import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, UtensilsCrossed } from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { DataTable, type DataTableColumn } from '@/components/data-table/DataTable'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/feedback/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { useToast } from '@/components/feedback/ToastProvider'
import { useCurrentOrganization } from '@/features/organizations/hooks/useCurrentOrganization'
import { useCurrentProperty } from '@/features/properties/hooks/useCurrentProperty'
import { hasPermission } from '@/infrastructure/permissions/permissions'
import { ApiError } from '@/infrastructure/api/errors'
import { formatCurrency } from '@/lib/formatters/currency'
import { MEAL_TYPE_LABELS } from '@/lib/formatters/enumLabels'
import type { FoodPlan, MealType } from '@/types/api'
import { FoodPlanStatusBadge } from '../components/FoodPlanStatusBadge'
import { useArchiveFoodPlan, useCreateFoodPlan, useFoodPlans } from '../hooks/useFoodPlans'
import { createFoodPlanSchema, type CreateFoodPlanFormValues } from '../schemas/foodPlan.schema'

const MEAL_TYPES: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'OTHER']

export function FoodPlansPage() {
  const { property, isLoading: propertyLoading } = useCurrentProperty()
  const organization = useCurrentOrganization()
  const canManage = hasPermission(organization?.yourRole, 'food.manage')
  const { toast } = useToast()

  const { data: plans, isLoading, error, refetch } = useFoodPlans(property?.id)
  const [createOpen, setCreateOpen] = useState(false)
  const [archiveTarget, setArchiveTarget] = useState<FoodPlan | null>(null)
  const archivePlan = useArchiveFoodPlan(archiveTarget?.id ?? '', property?.id ?? '')

  const columns: DataTableColumn<FoodPlan>[] = [
    { key: 'name', header: 'Plan', render: (p) => <span className="font-medium">{p.name}</span> },
    { key: 'meals', header: 'Meal Types', render: (p) => p.mealTypes.map((m) => MEAL_TYPE_LABELS[m]).join(', ') },
    { key: 'price', header: 'Price', render: (p) => `${formatCurrency(p.price, p.currency)} / month` },
    { key: 'status', header: 'Status', render: (p) => <FoodPlanStatusBadge status={p.status} /> },
    {
      key: 'actions',
      header: '',
      render: (p) =>
        canManage && p.status !== 'ARCHIVED' ? (
          <Button variant="outline" size="sm" className="text-destructive" onClick={() => setArchiveTarget(p)}>
            Archive
          </Button>
        ) : null,
      className: 'text-right',
    },
  ]

  async function onArchive() {
    if (!archiveTarget) return
    try {
      await archivePlan.mutateAsync()
      toast({ title: 'Plan archived', variant: 'success' })
      setArchiveTarget(null)
    } catch (err) {
      toast({ title: 'Unable to archive plan', description: err instanceof ApiError ? err.message : undefined, variant: 'error' })
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meal Plans"
        description={property ? `Optional meal plans for ${property.name}.` : undefined}
        action={
          canManage && (
            <Button className="gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> Add Plan
            </Button>
          )
        }
      />

      <DataTable
        columns={columns}
        data={plans}
        rowKey={(p) => p.id}
        isLoading={isLoading || propertyLoading}
        error={error}
        onRetry={() => refetch()}
        emptyState={
          <EmptyState
            icon={UtensilsCrossed}
            title="No meal plans yet"
            description="Create an optional meal plan tenants can subscribe to."
          />
        }
      />

      {createOpen && property && (
        <CreatePlanDialog
          propertyId={property.id}
          onClose={() => setCreateOpen(false)}
          onSuccess={() => {
            setCreateOpen(false)
            toast({ title: 'Plan created', variant: 'success' })
          }}
        />
      )}

      <ConfirmDialog
        open={Boolean(archiveTarget)}
        onClose={() => setArchiveTarget(null)}
        onConfirm={onArchive}
        title={`Archive ${archiveTarget?.name}?`}
        description="This cannot be undone. Existing subscriptions keep working, but no one can subscribe to this plan again."
        confirmLabel="Archive plan"
        isLoading={archivePlan.isPending}
      />
    </div>
  )
}

function CreatePlanDialog({ propertyId, onClose, onSuccess }: { propertyId: string; onClose: () => void; onSuccess: () => void }) {
  const createPlan = useCreateFoodPlan(propertyId)
  const { toast } = useToast()
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateFoodPlanFormValues>({ resolver: zodResolver(createFoodPlanSchema), defaultValues: { mealTypes: [] } })

  async function onSubmit(values: CreateFoodPlanFormValues) {
    try {
      await createPlan.mutateAsync({ ...values, description: values.description || undefined })
      onSuccess()
    } catch (err) {
      toast({ title: 'Unable to create plan', description: err instanceof ApiError ? err.message : undefined, variant: 'error' })
    }
  }

  return (
    <Dialog open onClose={onClose} title="Add meal plan" description="Define an optional meal plan tenants can subscribe to.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Plan name</Label>
          <Input id="name" invalid={Boolean(errors.name)} {...register('name')} placeholder="Full board" />
          {errors.name && <p className="text-sm text-destructive" role="alert">{errors.name.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="price">Monthly price (₹)</Label>
          <Input id="price" invalid={Boolean(errors.price)} {...register('price')} placeholder="3000" />
          {errors.price && <p className="text-sm text-destructive" role="alert">{errors.price.message}</p>}
        </div>
        <Controller
          control={control}
          name="mealTypes"
          render={({ field }) => (
            <div className="space-y-2">
              <Label>Meal types</Label>
              <div className="flex flex-wrap gap-3">
                {MEAL_TYPES.map((mealType) => (
                  <label key={mealType} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={field.value.includes(mealType)}
                      onChange={() =>
                        field.onChange(
                          field.value.includes(mealType) ? field.value.filter((m) => m !== mealType) : [...field.value, mealType],
                        )
                      }
                      className="h-4 w-4 rounded border-input"
                    />
                    {MEAL_TYPE_LABELS[mealType]}
                  </label>
                ))}
              </div>
              {errors.mealTypes && <p className="text-sm text-destructive" role="alert">{errors.mealTypes.message}</p>}
            </div>
          )}
        />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={isSubmitting}>Create plan</Button>
        </div>
      </form>
    </Dialog>
  )
}
