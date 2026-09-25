import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarClock } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useSearchParams } from 'react-router-dom'
import { DataTable, type DataTableColumn } from '@/components/data-table/DataTable'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { EmptyState } from '@/components/feedback/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { useToast } from '@/components/feedback/ToastProvider'
import { useCurrentOrganization } from '@/features/organizations/hooks/useCurrentOrganization'
import { useCurrentProperty } from '@/features/properties/hooks/useCurrentProperty'
import { hasPermission } from '@/infrastructure/permissions/permissions'
import { ApiError } from '@/infrastructure/api/errors'
import type { Visit } from '@/types/api'
import { VisitStatusBadge } from '../components/VisitStatusBadge'
import { useVisitsForProperty } from '../hooks/useVisits'
import { useCancelVisit, useCompleteVisit, useConfirmVisit, useNoShowVisit, useRescheduleVisit } from '../hooks/useVisitMutations'
import { rescheduleVisitSchema, type RescheduleVisitFormValues } from '../schemas/visit.schema'

export function VisitsListPage() {
  const { property, isLoading: propertyLoading } = useCurrentProperty()
  const organization = useCurrentOrganization()
  const canManage = hasPermission(organization?.yourRole, 'visits.manage')
  const { toast } = useToast()

  const [searchParams, setSearchParams] = useSearchParams()
  const page = Number(searchParams.get('page') ?? '1')
  const { data, isLoading, error, refetch } = useVisitsForProperty(property?.id, { page, limit: 20 })
  const [rescheduleTarget, setRescheduleTarget] = useState<Visit | null>(null)
  const [cancelTarget, setCancelTarget] = useState<Visit | null>(null)

  const confirmVisit = useConfirmVisit(property?.id ?? '')
  const completeVisit = useCompleteVisit(property?.id ?? '')
  const noShowVisit = useNoShowVisit(property?.id ?? '')
  const cancelVisit = useCancelVisit(property?.id ?? '')

  async function onConfirm(id: string) {
    try {
      await confirmVisit.mutateAsync(id)
      toast({ title: 'Visit confirmed', variant: 'success' })
    } catch (err) {
      toast({ title: 'Unable to confirm visit', description: err instanceof ApiError ? err.message : undefined, variant: 'error' })
    }
  }

  async function onComplete(id: string) {
    try {
      await completeVisit.mutateAsync(id)
      toast({ title: 'Visit marked complete', variant: 'success' })
    } catch (err) {
      toast({ title: 'Unable to complete visit', description: err instanceof ApiError ? err.message : undefined, variant: 'error' })
    }
  }

  async function onNoShow(id: string) {
    try {
      await noShowVisit.mutateAsync(id)
      toast({ title: 'Visit marked no-show', variant: 'success' })
    } catch (err) {
      toast({ title: 'Unable to mark no-show', description: err instanceof ApiError ? err.message : undefined, variant: 'error' })
    }
  }

  async function onCancel() {
    if (!cancelTarget) return
    try {
      await cancelVisit.mutateAsync(cancelTarget.id)
      toast({ title: 'Visit cancelled', variant: 'success' })
      setCancelTarget(null)
    } catch (err) {
      toast({ title: 'Unable to cancel visit', description: err instanceof ApiError ? err.message : undefined, variant: 'error' })
    }
  }

  const columns: DataTableColumn<Visit>[] = [
    { key: 'applicant', header: 'Application', render: (v) => <span className="font-mono text-xs">{v.applicationId.slice(0, 8)}</span> },
    {
      key: 'time',
      header: 'Scheduled',
      render: (v) =>
        v.scheduledStartAt
          ? `${new Date(v.scheduledStartAt).toLocaleString()} – ${v.scheduledEndAt ? new Date(v.scheduledEndAt).toLocaleTimeString() : ''}`
          : 'Not scheduled',
    },
    { key: 'status', header: 'Status', render: (v) => <VisitStatusBadge status={v.status} /> },
    { key: 'createdBy', header: 'Created By', render: (v) => <span className="font-mono text-xs">{v.createdByUserId.slice(0, 8)}</span> },
    {
      key: 'actions',
      header: '',
      render: (v) =>
        canManage ? (
          <div className="flex justify-end gap-2">
            {v.status === 'REQUESTED' && (
              <Button size="sm" variant="outline" isLoading={confirmVisit.isPending} onClick={() => onConfirm(v.id)}>
                Confirm
              </Button>
            )}
            {v.status === 'SCHEDULED' && (
              <>
                <Button size="sm" variant="outline" onClick={() => setRescheduleTarget(v)}>Reschedule</Button>
                <Button size="sm" isLoading={completeVisit.isPending} onClick={() => onComplete(v.id)}>Complete</Button>
                <Button size="sm" variant="outline" isLoading={noShowVisit.isPending} onClick={() => onNoShow(v.id)}>No-show</Button>
              </>
            )}
            {(v.status === 'REQUESTED' || v.status === 'SCHEDULED') && (
              <Button size="sm" variant="outline" className="text-destructive" onClick={() => setCancelTarget(v)}>Cancel</Button>
            )}
          </div>
        ) : null,
      className: 'text-right',
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Visits" description={property ? `Scheduled property visits for ${property.name}.` : undefined} />

      <DataTable
        columns={columns}
        data={data?.items}
        rowKey={(v) => v.id}
        isLoading={isLoading || propertyLoading}
        error={error}
        onRetry={() => refetch()}
        pagination={
          data
            ? {
                page: data.page,
                limit: data.limit,
                total: data.total,
                onPageChange: (p) => {
                  const next = new URLSearchParams(searchParams)
                  next.set('page', String(p))
                  setSearchParams(next, { replace: true })
                },
              }
            : undefined
        }
        emptyState={<EmptyState icon={CalendarClock} title="No visits yet" description="Visits scheduled from applications will appear here." />}
      />

      {rescheduleTarget && (
        <RescheduleDialog
          visit={rescheduleTarget}
          propertyId={property?.id ?? ''}
          onClose={() => setRescheduleTarget(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={onCancel}
        title="Cancel this visit?"
        confirmLabel="Cancel visit"
        isLoading={cancelVisit.isPending}
      />
    </div>
  )
}

function RescheduleDialog({ visit, propertyId, onClose }: { visit: Visit; propertyId: string; onClose: () => void }) {
  const reschedule = useRescheduleVisit(propertyId)
  const { toast } = useToast()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RescheduleVisitFormValues>({ resolver: zodResolver(rescheduleVisitSchema) })

  async function onSubmit(values: RescheduleVisitFormValues) {
    try {
      await reschedule.mutateAsync({ id: visit.id, payload: values })
      toast({ title: 'Visit rescheduled', variant: 'success' })
      onClose()
    } catch (err) {
      const message =
        err instanceof ApiError && err.code === 'VISIT_TIME_CONFLICT'
          ? 'This time overlaps with another scheduled visit at this property.'
          : err instanceof ApiError
            ? err.message
            : undefined
      toast({ title: 'Unable to reschedule', description: message, variant: 'error' })
    }
  }

  return (
    <Dialog open onClose={onClose} title="Reschedule visit">
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
          <Button type="submit" isLoading={isSubmitting}>Reschedule</Button>
        </div>
      </form>
    </Dialog>
  )
}
