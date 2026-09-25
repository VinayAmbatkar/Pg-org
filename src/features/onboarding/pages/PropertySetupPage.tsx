import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useCurrentOrganization } from '@/features/organizations/hooks/useCurrentOrganization'
import { propertiesApi } from '@/features/properties/api/propertiesApi'
import { propertyFormSchema, type PropertyFormValues } from '@/features/properties/schemas/property.schema'
import { ApiError } from '@/infrastructure/api/errors'
import { OnboardingShell } from '../components/OnboardingShell'

export function PropertySetupPage() {
  const organization = useCurrentOrganization()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: { propertyType: 'PG' },
  })

  async function onSubmit(values: PropertyFormValues) {
    if (!organization) return
    setFormError(null)
    try {
      await propertiesApi.create({ ...values, organizationId: organization.id })
      navigate('/onboarding/ready', { replace: true })
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Unable to create your property.')
    }
  }

  return (
    <OnboardingShell
      title="Add your first PG"
      description="You can add more properties, rooms, and beds anytime."
      currentStep="property"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Property name</Label>
          <Input id="name" invalid={Boolean(errors.name)} {...register('name')} placeholder="Sunrise PG" />
          {errors.name && (
            <p className="text-sm text-destructive" role="alert">
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="propertyType">Property type</Label>
          <Select id="propertyType" {...register('propertyType')}>
            <option value="PG">PG</option>
            <option value="HOSTEL">Hostel</option>
            <option value="CO_LIVING">Co-living</option>
            <option value="STUDENT_HOUSING">Student housing</option>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="addressLine1">Address</Label>
          <Input id="addressLine1" invalid={Boolean(errors.addressLine1)} {...register('addressLine1')} />
          {errors.addressLine1 && (
            <p className="text-sm text-destructive" role="alert">
              {errors.addressLine1.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="city">City</Label>
            <Input id="city" invalid={Boolean(errors.city)} {...register('city')} placeholder="Hyderabad" />
            {errors.city && (
              <p className="text-sm text-destructive" role="alert">
                {errors.city.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="state">State</Label>
            <Input id="state" invalid={Boolean(errors.state)} {...register('state')} placeholder="Telangana" />
            {errors.state && (
              <p className="text-sm text-destructive" role="alert">
                {errors.state.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="postalCode">Postal code</Label>
          <Input id="postalCode" invalid={Boolean(errors.postalCode)} {...register('postalCode')} />
          {errors.postalCode && (
            <p className="text-sm text-destructive" role="alert">
              {errors.postalCode.message}
            </p>
          )}
        </div>

        {formError && (
          <p className="text-sm text-destructive" role="alert">
            {formError}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="button" variant="outline" className="flex-1" onClick={() => navigate('/app/dashboard')}>
            Skip for now
          </Button>
          <Button type="submit" className="flex-1" isLoading={isSubmitting}>
            Continue
          </Button>
        </div>
      </form>
    </OnboardingShell>
  )
}
