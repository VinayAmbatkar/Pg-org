import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/feedback/ToastProvider'
import { tenantsApi, type TenantLookup } from '@/features/tenants/api/tenantsApi'
import { ApiError } from '@/infrastructure/api/errors'
import { useCreateResidency } from '../hooks/useResidencyMutations'
import { createResidencySchema, isTenantUuid, type CreateResidencyFormValues } from '../schemas/residency.schema'

function lookupErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404) return 'No tenant found with this code. Check it with the tenant.'
    if (error.code === 'TENANT_CODE_AMBIGUOUS') return 'This code matches more than one tenant. Ask the tenant for their full tenant ID.'
    return error.message
  }
  return 'Unable to find this tenant.'
}

export function ResidencyCreatePage() {
  const { propertyId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const createResidency = useCreateResidency(propertyId)
  // Resolved tenant for the code currently in the field (null until looked up).
  const [resolved, setResolved] = useState<(TenantLookup & { ref: string }) | null>(null)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [lookingUp, setLookingUp] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<CreateResidencyFormValues>({
    resolver: zodResolver(createResidencySchema),
    // "Continue to check-in" from an application passes the code along (?tenant=TN-…).
    defaultValues: { tenantRef: searchParams.get('tenant')?.slice(0, 64) ?? '', startDate: '', expectedEndDate: '' },
  })
  const tenantRef = useWatch({ control, name: 'tenantRef' }).trim()
  const current = resolved && resolved.ref === tenantRef ? resolved : null

  async function resolveTenant(ref: string): Promise<string | null> {
    if (isTenantUuid(ref)) return ref
    if (current) return current.tenantId
    setLookingUp(true)
    setLookupError(null)
    try {
      const result = await tenantsApi.lookup(ref)
      setResolved({ ...result, ref })
      return result.tenantId
    } catch (error) {
      setResolved(null)
      setLookupError(lookupErrorMessage(error))
      return null
    } finally {
      setLookingUp(false)
    }
  }

  // Pre-filled from the link: look it up straight away so the owner sees who it is.
  const prefilled = searchParams.get('tenant')
  useEffect(() => {
    if (!prefilled) return
    void trigger('tenantRef').then((valid) => {
      if (valid) void resolveTenant(prefilled.trim())
    })
    // Runs once for the value the page was opened with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onSubmit(values: CreateResidencyFormValues) {
    const tenantId = await resolveTenant(values.tenantRef.trim())
    if (!tenantId) return
    try {
      const residency = await createResidency.mutateAsync({
        tenantId,
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

  const tenantError = errors.tenantRef?.message ?? lookupError

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
              <Label htmlFor="tenantRef">Tenant code</Label>
              <div className="flex gap-2">
                <Input
                  id="tenantRef"
                  placeholder="TN-3K7Q-9XZ2"
                  autoComplete="off"
                  spellCheck={false}
                  className="font-mono uppercase"
                  invalid={Boolean(tenantError)}
                  aria-describedby="tenantRef-hint"
                  {...register('tenantRef', { onChange: () => setLookupError(null) })}
                />
                <Button
                  type="button"
                  variant="outline"
                  isLoading={lookingUp}
                  disabled={!tenantRef || isTenantUuid(tenantRef)}
                  onClick={async () => {
                    if (await trigger('tenantRef')) void resolveTenant(tenantRef)
                  }}
                >
                  Find
                </Button>
              </div>
              <p id="tenantRef-hint" className="text-xs text-muted-foreground">
                The tenant can see their code on their PGMet Profile page. It is also shown here after you start onboarding an approved
                application.
              </p>
              {current && (
                <p className="flex items-center gap-1.5 text-sm text-success" role="status">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  <span className="font-medium">{current.name}</span>
                  <span className="font-mono">{current.code}</span>
                </p>
              )}
              {tenantError && (
                <p className="text-sm text-destructive" role="alert">
                  {tenantError}
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
