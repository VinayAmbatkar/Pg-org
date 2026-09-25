import { zodResolver } from '@hookform/resolvers/zod'
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/feedback/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { useToast } from '@/components/feedback/ToastProvider'
import { useCurrentOrganization } from '@/features/organizations/hooks/useCurrentOrganization'
import { useCurrentProperty } from '@/features/properties/hooks/useCurrentProperty'
import { hasPermission } from '@/infrastructure/permissions/permissions'
import { ApiError } from '@/infrastructure/api/errors'
import { MEAL_TYPE_LABELS } from '@/lib/formatters/enumLabels'
import type { MealType, MenuItem } from '@/types/api'
import { MenuStatusBadge } from '../components/MenuStatusBadge'
import { useCreateMenu, useMenus, usePublishMenu, useCancelMenu, useAddMenuItem, useRemoveMenuItem } from '../hooks/useMenus'
import { menuItemSchema, type MenuItemFormValues } from '../schemas/menu.schema'
import { toLocalDateString } from '@/lib/formatters/date'
import { useUrlState } from '@/hooks/useUrlState'

const MEAL_TYPES: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'OTHER']

export function DailyMenuPage() {
  const { property, isLoading: propertyLoading } = useCurrentProperty()
  const organization = useCurrentOrganization()
  const canManage = hasPermission(organization?.yourRole, 'food.manage')
  const { toast } = useToast()

  // Date lives in the URL (?date=YYYY-MM-DD) so refresh keeps the day and FOOD_MENU notification
  // deep links can open a specific day. Anything malformed falls back to today.
  const today = toLocalDateString(new Date())
  const [dateParam, setDate] = useUrlState('date', today)
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : today
  const { data: menus, isLoading, refetch } = useMenus(property?.id, { from: date, to: date })
  const menu = menus?.[0]

  const createMenu = useCreateMenu(property?.id ?? '')
  const publishMenu = usePublishMenu(menu?.id ?? '', property?.id ?? '')
  const cancelMenu = useCancelMenu(menu?.id ?? '', property?.id ?? '')
  const addItem = useAddMenuItem(menu?.id ?? '')
  const removeItem = useRemoveMenuItem(menu?.id ?? '')

  function shiftDate(days: number) {
    // Parse as *local* midnight: `new Date('YYYY-MM-DD')` is UTC midnight, which is the previous
    // local day in any timezone behind UTC.
    const next = new Date(`${date}T00:00:00`)
    next.setDate(next.getDate() + days)
    setDate(toLocalDateString(next))
  }

  async function onCreateMenu() {
    if (!property) return
    try {
      await createMenu.mutateAsync({ date })
      toast({ title: 'Menu created', variant: 'success' })
      void refetch()
    } catch (err) {
      toast({ title: 'Unable to create menu', description: err instanceof ApiError ? err.message : undefined, variant: 'error' })
    }
  }

  async function onPublish() {
    try {
      await publishMenu.mutateAsync()
      toast({ title: 'Menu published', variant: 'success' })
    } catch (err) {
      toast({ title: 'Unable to publish menu', description: err instanceof ApiError ? err.message : undefined, variant: 'error' })
    }
  }

  async function onCancel() {
    try {
      await cancelMenu.mutateAsync()
      toast({ title: 'Menu cancelled', variant: 'success' })
    } catch (err) {
      toast({ title: 'Unable to cancel menu', description: err instanceof ApiError ? err.message : undefined, variant: 'error' })
    }
  }

  async function onRemoveItem(itemId: string) {
    try {
      await removeItem.mutateAsync(itemId)
    } catch (err) {
      toast({ title: 'Unable to remove item', description: err instanceof ApiError ? err.message : undefined, variant: 'error' })
    }
  }

  const itemsByMeal = (menu?.items ?? []).reduce<Record<string, MenuItem[]>>((acc, item) => {
    ;(acc[item.mealType] ??= []).push(item)
    return acc
  }, {})

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Daily Menu"
        description={property ? `Menu for ${property.name}.` : undefined}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => shiftDate(-1)} aria-label="Previous day">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[160px] text-center text-sm font-medium">
              {new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <Button variant="outline" size="icon" onClick={() => shiftDate(1)} aria-label="Next day">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {propertyLoading || isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !menu ? (
        <EmptyState
          title="No menu for this day"
          description="Create a menu to start adding items."
          action={canManage && <Button onClick={onCreateMenu} isLoading={createMenu.isPending}>Create menu</Button>}
        />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <MenuStatusBadge status={menu.status} />
            {canManage && menu.status !== 'CANCELLED' && (
              <div className="flex gap-2">
                {menu.status === 'DRAFT' && <Button size="sm" isLoading={publishMenu.isPending} onClick={onPublish}>Publish</Button>}
                <Button size="sm" variant="outline" className="text-destructive" isLoading={cancelMenu.isPending} onClick={onCancel}>
                  Cancel menu
                </Button>
              </div>
            )}
          </div>

          {MEAL_TYPES.map((mealType) => (
            <Card key={mealType}>
              <CardHeader>
                <CardTitle className="text-base">{MEAL_TYPE_LABELS[mealType]}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(itemsByMeal[mealType] ?? []).length === 0 && <p className="text-sm text-muted-foreground">No items yet.</p>}
                <ul className="space-y-2">
                  {(itemsByMeal[mealType] ?? []).map((item) => (
                    <li key={item.id} className="flex items-center justify-between text-sm">
                      <span>
                        {item.name}
                        {!item.isVegetarian && <span className="ml-1 text-xs text-muted-foreground">(non-veg)</span>}
                      </span>
                      {canManage && menu.status !== 'CANCELLED' && (
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => onRemoveItem(item.id)} aria-label={`Remove ${item.name}`}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
                {canManage && menu.status !== 'CANCELLED' && <AddItemForm mealType={mealType} addItem={addItem} />}
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  )
}

function AddItemForm({ mealType, addItem }: { mealType: MealType; addItem: ReturnType<typeof useAddMenuItem> }) {
  const { toast } = useToast()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MenuItemFormValues>({ resolver: zodResolver(menuItemSchema), defaultValues: { mealType } })

  async function onSubmit(values: MenuItemFormValues) {
    try {
      await addItem.mutateAsync({ ...values, description: values.description || undefined })
      reset({ mealType, name: '', description: '' })
    } catch (err) {
      toast({ title: 'Unable to add item', description: err instanceof ApiError ? err.message : undefined, variant: 'error' })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex items-end gap-2 border-t border-border pt-3">
      <input type="hidden" {...register('mealType')} value={mealType} />
      <div className="flex-1 space-y-1">
        <Label htmlFor={`item-${mealType}`} className="sr-only">Item name</Label>
        <Input id={`item-${mealType}`} placeholder="e.g. Poha" invalid={Boolean(errors.name)} {...register('name')} />
      </div>
      <Button type="submit" size="sm" variant="outline" isLoading={isSubmitting} className="gap-1">
        <Plus className="h-3.5 w-3.5" /> Add
      </Button>
    </form>
  )
}
