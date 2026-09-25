import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/PageHeader'
import { useCurrentProperty } from '@/features/properties/hooks/useCurrentProperty'
import { MEAL_TYPE_LABELS } from '@/lib/formatters/enumLabels'
import type { MealType } from '@/types/api'
import { MenuStatusBadge } from '../components/MenuStatusBadge'
import { useMenus } from '../hooks/useMenus'
import { toLocalDateString } from '@/lib/formatters/date'

const MEAL_TYPES: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'OTHER']

function startOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day // week starts Monday
  d.setDate(d.getDate() + diff)
  return d
}

export function WeeklyMenuPage() {
  const { property, isLoading: propertyLoading } = useCurrentProperty()
  const [weekAnchor, setWeekAnchor] = useState(() => startOfWeek(new Date()))

  const weekStart = toLocalDateString(weekAnchor)
  const weekEndDate = new Date(weekAnchor)
  weekEndDate.setDate(weekEndDate.getDate() + 6)
  const weekEnd = toLocalDateString(weekEndDate)

  const { data: menus, isLoading } = useMenus(property?.id, { from: weekStart, to: weekEnd })

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekAnchor)
    d.setDate(d.getDate() + i)
    return d
  })

  function shiftWeek(weeks: number) {
    const next = new Date(weekAnchor)
    next.setDate(next.getDate() + weeks * 7)
    setWeekAnchor(startOfWeek(next))
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Weekly Menu"
        description={property ? `Week overview for ${property.name}.` : undefined}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => shiftWeek(-1)} aria-label="Previous week">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-[200px] text-center text-sm font-medium">
              {weekAnchor.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – {weekEndDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <Button variant="outline" size="icon" onClick={() => shiftWeek(1)} aria-label="Next week">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {propertyLoading || isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
          {days.map((day) => {
            const dateStr = toLocalDateString(day)
            const menu = menus?.find((m) => m.date === dateStr)
            return (
              <Card key={dateStr}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{day.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</CardTitle>
                  {menu && <MenuStatusBadge status={menu.status} />}
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  {!menu ? (
                    <p className="text-muted-foreground">No menu</p>
                  ) : (
                    MEAL_TYPES.map((mealType) => {
                      const items = menu.items.filter((i) => i.mealType === mealType)
                      if (items.length === 0) return null
                      return (
                        <div key={mealType}>
                          <p className="font-medium text-muted-foreground">{MEAL_TYPE_LABELS[mealType]}</p>
                          <p>{items.map((i) => i.name).join(', ')}</p>
                        </div>
                      )
                    })
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
