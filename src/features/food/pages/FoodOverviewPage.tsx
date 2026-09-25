import { CalendarDays, CheckSquare, Settings, UtensilsCrossed, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/PageHeader'
import { useCurrentProperty } from '@/features/properties/hooks/useCurrentProperty'

const LINKS = [
  { to: '/app/food/configuration', label: 'Configuration', description: 'Meals included in rent, optional subscriptions', icon: Settings },
  { to: '/app/food/plans', label: 'Meal Plans', description: 'Optional plans tenants can subscribe to', icon: UtensilsCrossed },
  { to: '/app/food/menu', label: 'Daily Menu', description: "Edit and publish today's menu", icon: CalendarDays },
  { to: '/app/food/menu/week', label: 'Weekly Menu', description: 'Week-at-a-glance overview', icon: CalendarDays },
  { to: '/app/food/subscriptions', label: 'Subscriptions', description: 'Tenant meal subscriptions', icon: Users },
  { to: '/app/food/consumption', label: 'Meal Consumption', description: "Mark today's meal attendance", icon: CheckSquare },
]

export function FoodOverviewPage() {
  const { property } = useCurrentProperty()

  return (
    <div className="space-y-6">
      <PageHeader title="Food" description={property ? `Food management for ${property.name}.` : undefined} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {LINKS.map(({ to, label, description, icon: Icon }) => (
          <Link key={to} to={to}>
            <Card className="h-full transition-colors hover:bg-accent/50">
              <CardContent className="flex items-start gap-3 p-5">
                <Icon className="mt-0.5 h-5 w-5 text-primary" aria-hidden="true" />
                <div>
                  <p className="font-medium">{label}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
