import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCurrentOrganization } from '@/features/organizations/hooks/useCurrentOrganization'
import { ApiError } from '@/infrastructure/api/errors'
import { PropertyForm } from '../components/PropertyForm'
import { useCreateProperty } from '../hooks/usePropertyMutations'
import type { PropertyFormValues } from '../schemas/property.schema'

export function PropertyCreatePage() {
  const organization = useCurrentOrganization()
  const navigate = useNavigate()
  const createProperty = useCreateProperty()
  const [formError, setFormError] = useState<string | null>(null)

  async function handleSubmit(values: PropertyFormValues) {
    if (!organization) return
    setFormError(null)
    try {
      const property = await createProperty.mutateAsync({ ...values, organizationId: organization.id })
      navigate(`/app/properties/${property.id}`)
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Unable to create property.')
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Add Property</h1>
      <Card>
        <CardHeader>
          <CardTitle>Property details</CardTitle>
        </CardHeader>
        <CardContent>
          <PropertyForm
            onSubmit={handleSubmit}
            onCancel={() => navigate('/app/properties')}
            submitLabel="Create property"
            formError={formError}
          />
        </CardContent>
      </Card>
    </div>
  )
}
