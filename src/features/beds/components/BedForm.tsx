import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { bedEditFormSchema, bedFormSchema, type BedEditFormValues, type BedFormValues } from '../schemas/bed.schema'

interface BedCreateFormProps {
  mode?: 'create'
  defaultValues?: Partial<BedFormValues>
  onSubmit: (values: BedFormValues) => Promise<void>
  onCancel?: () => void
  submitLabel: string
  formError?: string | null
}

interface BedEditFormProps {
  mode: 'edit'
  defaultValues?: Partial<BedEditFormValues>
  onSubmit: (values: BedEditFormValues) => Promise<void>
  onCancel?: () => void
  submitLabel: string
  formError?: string | null
}

type BedFormProps = BedCreateFormProps | BedEditFormProps

/** Bed number is always required. Status (AVAILABLE/INACTIVE only — never ARCHIVED, which is
 * DELETE-only) is only editable once a bed exists — CreateBedDto has no status field, beds are
 * always created AVAILABLE server-side. */
export function BedForm(props: BedFormProps) {
  if (props.mode === 'edit') {
    return <BedEditForm {...props} />
  }
  return <BedCreateForm {...props} />
}

function BedCreateForm({ defaultValues, onSubmit, onCancel, submitLabel, formError }: BedCreateFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BedFormValues>({
    resolver: zodResolver(bedFormSchema),
    defaultValues: { berth: '', ...defaultValues },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="bedNumber">Bed number</Label>
        <Input id="bedNumber" invalid={Boolean(errors.bedNumber)} {...register('bedNumber')} />
        {errors.bedNumber && (
          <p className="text-sm text-destructive" role="alert">
            {errors.bedNumber.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="berth">Bed type</Label>
        <Select id="berth" {...register('berth')}>
          <option value="">Regular bed</option>
          <option value="LOWER">Bunk — lower berth</option>
          <option value="UPPER">Bunk — upper berth</option>
        </Select>
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

function BedEditForm({ defaultValues, onSubmit, onCancel, submitLabel, formError }: BedEditFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<BedEditFormValues>({
    resolver: zodResolver(bedEditFormSchema),
    defaultValues: { status: 'AVAILABLE', berth: '', ...defaultValues },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="bedNumber">Bed number</Label>
        <Input id="bedNumber" invalid={Boolean(errors.bedNumber)} {...register('bedNumber')} />
        {errors.bedNumber && (
          <p className="text-sm text-destructive" role="alert">
            {errors.bedNumber.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="status">Status</Label>
        <Select id="status" invalid={Boolean(errors.status)} {...register('status')}>
          <option value="AVAILABLE">In service</option>
          <option value="INACTIVE">Blocked (out of service)</option>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="berth">Bed type</Label>
        <Select id="berth" {...register('berth')}>
          <option value="">Regular bed</option>
          <option value="LOWER">Bunk — lower berth</option>
          <option value="UPPER">Bunk — upper berth</option>
        </Select>
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
