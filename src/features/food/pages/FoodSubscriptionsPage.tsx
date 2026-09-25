import { Utensils } from 'lucide-react'
import { DataTable, type DataTableColumn } from '@/components/data-table/DataTable'
import { EmptyState } from '@/components/feedback/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { useCurrentProperty } from '@/features/properties/hooks/useCurrentProperty'
import { formatCurrency } from '@/lib/formatters/currency'
import { MEAL_TYPE_LABELS } from '@/lib/formatters/enumLabels'
import type { FoodSubscription } from '@/types/api'
import { FoodSubscriptionStatusBadge } from '../components/FoodSubscriptionStatusBadge'
import { useFoodSubscriptions } from '../hooks/useFoodSubscriptions'

export function FoodSubscriptionsPage() {
  const { property, isLoading: propertyLoading } = useCurrentProperty()
  const { data: subscriptions, isLoading, error, refetch } = useFoodSubscriptions(property?.id)

  const columns: DataTableColumn<FoodSubscription>[] = [
    { key: 'tenant', header: 'Tenant', render: (s) => <span className="font-mono text-xs">{s.tenantId.slice(0, 8)}</span> },
    { key: 'meals', header: 'Meal Types', render: (s) => s.mealTypesSnapshot.map((m) => MEAL_TYPE_LABELS[m]).join(', ') },
    { key: 'price', header: 'Price', render: (s) => `${formatCurrency(s.priceSnapshot, s.currency)} / month` },
    { key: 'status', header: 'Status', render: (s) => <FoodSubscriptionStatusBadge status={s.status} /> },
    { key: 'start', header: 'Start Date', render: (s) => new Date(s.startDate).toLocaleDateString() },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Food Subscriptions" description={property ? `Tenant meal subscriptions for ${property.name}.` : undefined} />

      <DataTable
        columns={columns}
        data={subscriptions}
        rowKey={(s) => s.id}
        isLoading={isLoading || propertyLoading}
        error={error}
        onRetry={() => refetch()}
        emptyState={<EmptyState icon={Utensils} title="No subscriptions yet" description="Tenant meal subscriptions will appear here." />}
      />
    </div>
  )
}
