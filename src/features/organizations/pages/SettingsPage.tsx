import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/feedback/ToastProvider'
import { ApiError } from '@/infrastructure/api/errors'
import { hasPermission } from '@/infrastructure/permissions/permissions'
import { useCurrentOrganization } from '../hooks/useCurrentOrganization'
import { useUpdateOrganization } from '../hooks/useOrganizationMutations'
import { organizationFormSchema, type OrganizationFormValues } from '../schemas/organization.schema'

export function SettingsPage() {
  const organization = useCurrentOrganization()
  const { toast } = useToast()
  const canManage = hasPermission(organization?.yourRole, 'organizations.manage')
  const updateOrganization = useUpdateOrganization(organization?.id ?? '')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<OrganizationFormValues>({ resolver: zodResolver(organizationFormSchema) })

  useEffect(() => {
    if (organization) reset({ name: organization.name })
  }, [organization, reset])

  if (!organization) return null

  async function onSubmit(values: OrganizationFormValues) {
    try {
      await updateOrganization.mutateAsync(values)
      toast({ title: 'Organization updated', variant: 'success' })
    } catch (error) {
      toast({
        title: 'Unable to update organization',
        description: error instanceof ApiError ? error.message : undefined,
        variant: 'error',
      })
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Organization name</Label>
              <Input id="name" invalid={Boolean(errors.name)} disabled={!canManage} {...register('name')} />
              {errors.name && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>
            {canManage && (
              <Button type="submit" isLoading={isSubmitting}>
                Save changes
              </Button>
            )}
            {!canManage && <p className="text-sm text-muted-foreground">Only the organization owner can edit this.</p>}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
