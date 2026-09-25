import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard'
import { propertyFormSchema, type PropertyFormValues } from '../schemas/property.schema'

interface PropertyFormProps {
  defaultValues?: Partial<PropertyFormValues>
  onSubmit: (values: PropertyFormValues) => Promise<void>
  onCancel?: () => void
  submitLabel: string
  formError?: string | null
}

export function PropertyForm({ defaultValues, onSubmit, onCancel, submitLabel, formError }: PropertyFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: { propertyType: 'PG', ...defaultValues },
  })
  const unsavedChangesDialog = useUnsavedChangesGuard(isDirty && !isSubmitting)

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {unsavedChangesDialog}
      <div className="space-y-1.5">
        <Label htmlFor="name">Property name</Label>
        <Input id="name" invalid={Boolean(errors.name)} {...register('name')} />
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
        <Label htmlFor="addressLine1">Address line 1</Label>
        <Input id="addressLine1" invalid={Boolean(errors.addressLine1)} {...register('addressLine1')} />
        {errors.addressLine1 && (
          <p className="text-sm text-destructive" role="alert">
            {errors.addressLine1.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="addressLine2">Address line 2 (optional)</Label>
        <Input id="addressLine2" {...register('addressLine2')} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="city">City</Label>
          <Input id="city" invalid={Boolean(errors.city)} {...register('city')} />
          {errors.city && (
            <p className="text-sm text-destructive" role="alert">
              {errors.city.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="state">State</Label>
          <Input id="state" invalid={Boolean(errors.state)} {...register('state')} />
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

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
