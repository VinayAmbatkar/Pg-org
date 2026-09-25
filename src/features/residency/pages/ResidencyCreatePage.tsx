import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/feedback/ToastProvider'
import { ApiError } from '@/infrastructure/api/errors'
import { useCreateResidency } from '../hooks/useResidencyMutations'
import { createResidencySchema, type CreateResidencyFormValues } from '../schemas/residency.schema'

export function ResidencyCreatePage() {
  const { propertyId = '' } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const createResidency = useCreateResidency(propertyId)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateResidencyFormValues>({
    resolver: zodResolver(createResidencySchema),
  })

  async function onSubmit(values: CreateResidencyFormValues) {
    try {
      const residency = await createResidency.mutateAsync({
        tenantId: values.tenantId,
        startDate: values.startDate,
        expectedEndDate: values.expectedEndDate || undefined,
      })
      toast({ title: 'Tenant added', variant: 'success' })
      navigate(`/app/residencies/${residency.id}`)
    } catch (error) {
      toast({
        title: 'Unable to add tenant',
        description: error instanceof ApiError ? error.message : undefined,
        variant: 'error',
      })
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Add Tenant</h1>
      <Card>
        <CardHeader>
          <CardTitle>Residency details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="tenantId">Tenant ID</Label>
              <Input id="tenantId" invalid={Boolean(errors.tenantId)} {...register('tenantId')} />
              <p className="text-xs text-muted-foreground">
                Enter the tenant's ID — self-service tenant registration happens outside this app for now.
              </p>
              {errors.tenantId && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.tenantId.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="startDate">Start Date</Label>
              <Input id="startDate" type="date" invalid={Boolean(errors.startDate)} {...register('startDate')} />
              {errors.startDate && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.startDate.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="expectedEndDate">Expected End Date (optional)</Label>
              <Input
                id="expectedEndDate"
                type="date"
                invalid={Boolean(errors.expectedEndDate)}
                {...register('expectedEndDate')}
              />
              {errors.expectedEndDate && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.expectedEndDate.message}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => navigate(`/app/properties/${propertyId}?tab=tenants`)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Add tenant
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
