import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/feedback/EmptyState'
import { useCurrentOrganization } from '@/features/organizations/hooks/useCurrentOrganization'
import { useCurrentProperty } from '@/features/properties/hooks/useCurrentProperty'
import { hasPermission } from '@/infrastructure/permissions/permissions'
import { TenantsPanel } from '../components/TenantsPanel'

export function TenantsPage() {
  const organization = useCurrentOrganization()
  const { property, isLoading } = useCurrentProperty()
  const canManage = hasPermission(organization?.yourRole, 'residency.manage')

  if (isLoading) return null

  if (!property) {
    return (
      <EmptyState
        title="No property selected"
        description="Add a property first to start tracking tenants."
        action={
          <Link to="/app/properties">
            <Button size="sm">Go to Properties</Button>
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Tenants — {property.name}</h1>
      <TenantsPanel propertyId={property.id} canManage={canManage} />
    </div>
  )
}
