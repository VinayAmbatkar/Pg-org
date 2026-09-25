import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/feedback/ToastProvider'
import { ApiError } from '@/infrastructure/api/errors'
import { useScheduleVisit } from '../hooks/useVisitMutations'
import { scheduleVisitSchema, type ScheduleVisitFormValues } from '../schemas/visit.schema'

export function ScheduleVisitDialog({
  applicationId,
  propertyId,
  onClose,
}: {
  applicationId: string
  propertyId: string
  onClose: () => void
}) {
  const scheduleVisit = useScheduleVisit(applicationId, propertyId)
  const { toast } = useToast()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ScheduleVisitFormValues>({ resolver: zodResolver(scheduleVisitSchema) })

  async function onSubmit(values: ScheduleVisitFormValues) {
    try {
      await scheduleVisit.mutateAsync({ ...values, notes: values.notes || undefined })
      toast({ title: 'Visit scheduled', variant: 'success' })
      onClose()
    } catch (err) {
      const message =
        err instanceof ApiError && err.code === 'VISIT_TIME_CONFLICT'
          ? 'This time overlaps with another scheduled visit at this property.'
          : err instanceof ApiError
            ? err.message
            : undefined
      toast({ title: 'Unable to schedule visit', description: message, variant: 'error' })
    }
  }

  return (
    <Dialog open onClose={onClose} title="Schedule visit" description="Pick a time slot for the applicant to visit the property.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="scheduledStartAt">Start time</Label>
          <Input id="scheduledStartAt" type="datetime-local" invalid={Boolean(errors.scheduledStartAt)} {...register('scheduledStartAt')} />
          {errors.scheduledStartAt && <p className="text-sm text-destructive" role="alert">{errors.scheduledStartAt.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="scheduledEndAt">End time</Label>
          <Input id="scheduledEndAt" type="datetime-local" invalid={Boolean(errors.scheduledEndAt)} {...register('scheduledEndAt')} />
          {errors.scheduledEndAt && <p className="text-sm text-destructive" role="alert">{errors.scheduledEndAt.message}</p>}
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={isSubmitting}>Schedule</Button>
        </div>
      </form>
    </Dialog>
  )
}
