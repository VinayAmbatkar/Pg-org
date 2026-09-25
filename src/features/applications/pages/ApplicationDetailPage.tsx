import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { ErrorState } from '@/components/feedback/ErrorState'
import { PageSpinner } from '@/components/feedback/PageSpinner'
import { useToast } from '@/components/feedback/ToastProvider'
import { useCurrentOrganization } from '@/features/organizations/hooks/useCurrentOrganization'
import { useVisitsForProperty } from '@/features/visits/hooks/useVisits'
import { VisitStatusBadge } from '@/features/visits/components/VisitStatusBadge'
import { ScheduleVisitDialog } from '@/features/visits/components/ScheduleVisitDialog'
import { hasPermission } from '@/infrastructure/permissions/permissions'
import { ApiError } from '@/infrastructure/api/errors'
import { ROOM_TYPE_LABELS } from '@/lib/formatters/enumLabels'
import { ApplicationStatusBadge } from '../components/ApplicationStatusBadge'
import { useApplication } from '../hooks/useApplications'
import { useApproveApplication, useRejectApplication, useReviewApplication, useStartOnboarding } from '../hooks/useApplicationMutations'
import { rejectSchema, type RejectFormValues } from '../schemas/reject.schema'

export function ApplicationDetailPage() {
  const { applicationId = '' } = useParams()
  const { toast } = useToast()
  const organization = useCurrentOrganization()
  const canManage = hasPermission(organization?.yourRole, 'applications.manage')

  const { data: application, isLoading, error, refetch } = useApplication(applicationId)
  const { data: visits } = useVisitsForProperty(application?.propertyId, { limit: 100 })
  const applicationVisits = (visits?.items ?? []).filter((v) => v.applicationId === applicationId)

  const review = useReviewApplication(applicationId, application?.propertyId ?? '')
  const approve = useApproveApplication(applicationId, application?.propertyId ?? '')
  const startOnboarding = useStartOnboarding(applicationId)

  const [rejectOpen, setRejectOpen] = useState(false)
  const [scheduleVisitOpen, setScheduleVisitOpen] = useState(false)
  const [onboardingResult, setOnboardingResult] = useState<{ tenantId: string; reused: boolean } | null>(null)

  if (isLoading) return <PageSpinner />
  if (error || !application) return <ErrorState error={error} onRetry={() => refetch()} />

  async function onReview() {
    try {
      await review.mutateAsync()
      toast({ title: 'Application moved to review', variant: 'success' })
    } catch (err) {
      toast({ title: 'Unable to update application', description: err instanceof ApiError ? err.message : undefined, variant: 'error' })
    }
  }

  async function onApprove() {
    try {
      await approve.mutateAsync()
      toast({ title: 'Application approved', variant: 'success' })
    } catch (err) {
      toast({ title: 'Unable to approve', description: err instanceof ApiError ? err.message : undefined, variant: 'error' })
    }
  }

  async function onStartOnboarding() {
    try {
      const result = await startOnboarding.mutateAsync()
      setOnboardingResult(result)
    } catch (err) {
      toast({ title: 'Unable to start onboarding', description: err instanceof ApiError ? err.message : undefined, variant: 'error' })
    }
  }

  const showReview = canManage && application.status === 'SUBMITTED'
  const showApprove = canManage && (application.status === 'UNDER_REVIEW' || application.status === 'VISIT_SCHEDULED')
  const showReject = canManage && (application.status === 'UNDER_REVIEW' || application.status === 'VISIT_SCHEDULED')
  const showScheduleVisit = canManage && application.status !== 'APPROVED' && application.status !== 'REJECTED' && application.status !== 'WITHDRAWN' && application.status !== 'EXPIRED'
  const showStartOnboarding = canManage && application.status === 'APPROVED'

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{application.fullName}</h1>
            <ApplicationStatusBadge status={application.status} />
          </div>
          <p className="text-sm text-muted-foreground">Application #{application.id.slice(0, 8)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {showReview && <Button size="sm" isLoading={review.isPending} onClick={onReview}>Start review</Button>}
          {showScheduleVisit && <Button size="sm" variant="outline" onClick={() => setScheduleVisitOpen(true)}>Schedule visit</Button>}
          {showApprove && <Button size="sm" isLoading={approve.isPending} onClick={onApprove}>Approve</Button>}
          {showReject && <Button size="sm" variant="outline" className="text-destructive" onClick={() => setRejectOpen(true)}>Reject</Button>}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Applicant</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground">Phone</p>
            <p className="font-medium">{application.phone}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Email</p>
            <p className="font-medium">{application.email ?? '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Preferred move-in</p>
            <p className="font-medium">{application.preferredMoveInDate ? new Date(application.preferredMoveInDate).toLocaleDateString() : '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Preferred room type</p>
            <p className="font-medium">{application.preferredRoomType ? ROOM_TYPE_LABELS[application.preferredRoomType] : '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Preferred stay (months)</p>
            <p className="font-medium">{application.preferredStayDuration ?? '—'}</p>
          </div>
          {application.notes && (
            <div className="col-span-2 sm:col-span-3">
              <p className="text-muted-foreground">Notes</p>
              <p className="mt-1 whitespace-pre-wrap font-medium">{application.notes}</p>
            </div>
          )}
          {application.rejectionReason && (
            <div className="col-span-2 sm:col-span-3 border-t border-border pt-3">
              <p className="text-muted-foreground">Rejection reason</p>
              <p className="mt-1 whitespace-pre-wrap">{application.rejectionReason}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Visits</CardTitle>
        </CardHeader>
        <CardContent>
          {applicationVisits.length === 0 ? (
            <p className="text-sm text-muted-foreground">No visits scheduled.</p>
          ) : (
            <ul className="space-y-2">
              {applicationVisits.map((visit) => (
                <li key={visit.id} className="flex items-center justify-between text-sm">
                  <span>
                    {visit.scheduledStartAt ? new Date(visit.scheduledStartAt).toLocaleString() : 'Not yet scheduled'}
                  </span>
                  <VisitStatusBadge status={visit.status} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {application.status === 'APPROVED' && (
        <Card>
          <CardHeader>
            <CardTitle>Onboarding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Approval only records a decision. Starting onboarding creates a tenant profile; check-in (residency + bed) is a
              separate, manual step afterward.
            </p>
            {onboardingResult ? (
              <div className="space-y-2 rounded-lg border border-border p-3 text-sm">
                <p>
                  Tenant {onboardingResult.reused ? 'already existed' : 'created'}:{' '}
                  <span className="font-mono text-xs">{onboardingResult.tenantId}</span>
                </p>
                <Link
                  to={`/app/properties/${application.propertyId}/residencies/new`}
                  className="font-medium text-primary underline underline-offset-2"
                >
                  Continue to check-in →
                </Link>
              </div>
            ) : (
              showStartOnboarding && (
                <Button isLoading={startOnboarding.isPending} onClick={onStartOnboarding}>
                  Start onboarding
                </Button>
              )
            )}
          </CardContent>
        </Card>
      )}

      <RejectDialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        applicationId={applicationId}
        propertyId={application.propertyId}
      />

      {scheduleVisitOpen && (
        <ScheduleVisitDialog
          applicationId={applicationId}
          propertyId={application.propertyId}
          onClose={() => setScheduleVisitOpen(false)}
        />
      )}
    </div>
  )
}

function RejectDialog({
  open,
  onClose,
  applicationId,
  propertyId,
}: {
  open: boolean
  onClose: () => void
  applicationId: string
  propertyId: string
}) {
  const reject = useRejectApplication(applicationId, propertyId)
  const { toast } = useToast()
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<RejectFormValues>({ resolver: zodResolver(rejectSchema) })

  async function onSubmit(values: RejectFormValues) {
    try {
      await reject.mutateAsync({ reason: values.reason || undefined })
      toast({ title: 'Application rejected', variant: 'success' })
      onClose()
    } catch (err) {
      toast({ title: 'Unable to reject', description: err instanceof ApiError ? err.message : undefined, variant: 'error' })
    }
  }

  return (
    <Dialog open={open} onClose={onClose} title="Reject this application?" description="Optionally include a reason.">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <textarea
          rows={3}
          placeholder="Reason (optional)"
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          {...register('reason')}
        />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="destructive" isLoading={isSubmitting}>Reject</Button>
        </div>
      </form>
    </Dialog>
  )
}
