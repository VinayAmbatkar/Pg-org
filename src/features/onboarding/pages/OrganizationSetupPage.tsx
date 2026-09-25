import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { organizationsApi } from '@/features/organizations/api/organizationsApi'
import { organizationFormSchema, type OrganizationFormValues } from '@/features/organizations/schemas/organization.schema'
import { ApiError } from '@/infrastructure/api/errors'
import { useAuth } from '@/infrastructure/auth/AuthProvider'
import { OnboardingShell } from '../components/OnboardingShell'

export function OrganizationSetupPage() {
  const { refetchOrganizations } = useAuth()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OrganizationFormValues>({ resolver: zodResolver(organizationFormSchema) })

  async function onSubmit(values: OrganizationFormValues) {
    setFormError(null)
    try {
      await organizationsApi.create(values)
      await refetchOrganizations()
      navigate('/onboarding/property', { replace: true })
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Unable to create your organization.')
    }
  }

  return (
    <OnboardingShell
      title="Let's set up your PG business"
      description="This is the organization your properties and team will belong to."
      currentStep="organization"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Organization / business name</Label>
          <Input id="name" invalid={Boolean(errors.name)} {...register('name')} placeholder="Sunrise Living" />
          {errors.name && (
            <p className="text-sm text-destructive" role="alert">
              {errors.name.message}
            </p>
          )}
        </div>

        {formError && (
          <p className="text-sm text-destructive" role="alert">
            {formError}
          </p>
        )}

        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Continue
        </Button>
      </form>
    </OnboardingShell>
  )
}
