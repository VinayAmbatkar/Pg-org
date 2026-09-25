import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageSpinner } from '@/components/feedback/PageSpinner'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ApiError } from '@/infrastructure/api/errors'
import { PropertyForm } from '../components/PropertyForm'
import { useProperty } from '../hooks/useProperty'
import { useUpdateProperty } from '../hooks/usePropertyMutations'
import type { PropertyFormValues } from '../schemas/property.schema'

export function PropertyEditPage() {
  const { propertyId = '' } = useParams()
  const navigate = useNavigate()
  const { data: property, isLoading, error, refetch } = useProperty(propertyId)
  const updateProperty = useUpdateProperty(propertyId)
  const [formError, setFormError] = useState<string | null>(null)

  if (isLoading) return <PageSpinner />
  if (error || !property) return <ErrorState error={error} onRetry={() => refetch()} />

  async function handleSubmit(values: PropertyFormValues) {
    setFormError(null)
    try {
      await updateProperty.mutateAsync(values)
      navigate(`/app/properties/${propertyId}`)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Unable to update property.')
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Edit Property</h1>
      <Card>
        <CardHeader>
          <CardTitle>Property details</CardTitle>
        </CardHeader>
        <CardContent>
          <PropertyForm
            defaultValues={{ ...property, addressLine2: property.addressLine2 ?? undefined }}
            onSubmit={handleSubmit}
            onCancel={() => navigate(`/app/properties/${propertyId}`)}
            submitLabel="Save changes"
            formError={formError}
          />
        </CardContent>
      </Card>
    </div>
  )
}
