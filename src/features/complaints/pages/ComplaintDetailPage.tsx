import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Tabs } from '@/components/ui/tabs'
import { ConfirmDialog } from '@/components/feedback/ConfirmDialog'
import { ErrorState } from '@/components/feedback/ErrorState'
import { PageSpinner } from '@/components/feedback/PageSpinner'
import { useToast } from '@/components/feedback/ToastProvider'
import { useAuth } from '@/infrastructure/auth/AuthProvider'
import { useCurrentOrganization } from '@/features/organizations/hooks/useCurrentOrganization'
import { hasPermission } from '@/infrastructure/permissions/permissions'
import { ApiError } from '@/infrastructure/api/errors'
import { COMPLAINT_CATEGORY_LABELS, COMPLAINT_PRIORITY_LABELS } from '@/lib/formatters/enumLabels'
import { isSafeHttpUrl } from '@/lib/validators/url'
import { ComplaintPriorityBadge } from '../components/ComplaintPriorityBadge'
import { ComplaintStatusBadge } from '../components/ComplaintStatusBadge'
import { useComplaint, useComplaintActivity, useComplaintAttachments, useComplaintComments } from '../hooks/useComplaint'
import {
  useAddComplaintAttachment,
  useAddComplaintComment,
  useAssignComplaint,
  useCancelComplaint,
  useCloseComplaint,
  useRemoveComplaintAttachment,
  useResolveComplaint,
  useSetComplaintPriority,
  useStartComplaint,
  useUnassignComplaint,
} from '../hooks/useComplaintMutations'
import { assignSchema, commentSchema, resolveSchema, type AssignFormValues, type CommentFormValues, type ResolveFormValues } from '../schemas/complaint.schema'

type TabValue = 'activity' | 'comments' | 'attachments'

export function ComplaintDetailPage() {
  const { complaintId = '' } = useParams()
  const { toast } = useToast()
  const { user } = useAuth()
  const organization = useCurrentOrganization()
  const role = organization?.yourRole
  const canManage = hasPermission(role, 'complaints.manage')
  const isOrgMember = hasPermission(role, 'complaints.view')

  const { data: complaint, isLoading, error, refetch } = useComplaint(complaintId)
  const [tab, setTab] = useState<TabValue>('activity')

  const [assignOpen, setAssignOpen] = useState(false)
  const [resolveOpen, setResolveOpen] = useState(false)
  const [closeOpen, setCloseOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [priorityOpen, setPriorityOpen] = useState(false)

  const assign = useAssignComplaint(complaintId)
  const unassign = useUnassignComplaint(complaintId)
  const start = useStartComplaint(complaintId)
  const resolve = useResolveComplaint(complaintId)
  const close = useCloseComplaint(complaintId)
  const cancel = useCancelComplaint(complaintId)
  const setPriority = useSetComplaintPriority(complaintId)

  if (isLoading) return <PageSpinner />
  if (error || !complaint) return <ErrorState error={error} onRetry={() => refetch()} />

  const isSelfAssigned = complaint.assignedToUserId === user?.id
  const canWork = canManage || (hasPermission(role, 'complaints.work') && isSelfAssigned)
  const canCancel = canManage || complaint.reportedByUserId === user?.id

  const showAssign = canManage && (complaint.status === 'OPEN' || complaint.status === 'ASSIGNED')
  const showUnassign = canManage && complaint.status === 'ASSIGNED'
  const showStart = canWork && complaint.status === 'ASSIGNED'
  const showResolve = canWork && complaint.status === 'IN_PROGRESS'
  const showClose = canManage && complaint.status === 'RESOLVED'
  const showCancel = canCancel && complaint.status === 'OPEN'
  const showPriority = canManage && complaint.status !== 'CLOSED' && complaint.status !== 'CANCELLED'

  async function onStart() {
    try {
      await start.mutateAsync()
      toast({ title: 'Work started', variant: 'success' })
    } catch (err) {
      toast({ title: 'Unable to start work', description: err instanceof ApiError ? err.message : undefined, variant: 'error' })
    }
  }

  async function onUnassign() {
    try {
      await unassign.mutateAsync()
      toast({ title: 'Complaint unassigned', variant: 'success' })
    } catch (err) {
      toast({ title: 'Unable to unassign', description: err instanceof ApiError ? err.message : undefined, variant: 'error' })
    }
  }

  async function onClose() {
    try {
      await close.mutateAsync()
      toast({ title: 'Complaint closed', variant: 'success' })
      setCloseOpen(false)
    } catch (err) {
      toast({ title: 'Unable to close', description: err instanceof ApiError ? err.message : undefined, variant: 'error' })
    }
  }

  async function onCancel() {
    try {
      await cancel.mutateAsync()
      toast({ title: 'Complaint cancelled', variant: 'success' })
      setCancelOpen(false)
    } catch (err) {
      toast({ title: 'Unable to cancel', description: err instanceof ApiError ? err.message : undefined, variant: 'error' })
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{complaint.title}</h1>
            <ComplaintStatusBadge status={complaint.status} />
            <ComplaintPriorityBadge priority={complaint.priority} />
          </div>
          <p className="text-sm text-muted-foreground">Complaint #{complaint.id.slice(0, 8)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {showAssign && <Button size="sm" onClick={() => setAssignOpen(true)}>{complaint.assignedToUserId ? 'Reassign' : 'Assign'}</Button>}
          {showUnassign && <Button size="sm" variant="outline" isLoading={unassign.isPending} onClick={onUnassign}>Unassign</Button>}
          {showStart && <Button size="sm" isLoading={start.isPending} onClick={onStart}>Start work</Button>}
          {showResolve && <Button size="sm" onClick={() => setResolveOpen(true)}>Resolve</Button>}
          {showClose && <Button size="sm" variant="outline" onClick={() => setCloseOpen(true)}>Close</Button>}
          {showPriority && <Button size="sm" variant="outline" onClick={() => setPriorityOpen(true)}>Change priority</Button>}
          {showCancel && <Button size="sm" variant="outline" className="text-destructive" onClick={() => setCancelOpen(true)}>Cancel</Button>}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground">Category</p>
            <p className="font-medium">{COMPLAINT_CATEGORY_LABELS[complaint.category]}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Tenant</p>
            <p className="font-mono text-xs">{complaint.tenantId.slice(0, 8)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Assigned to</p>
            <p className="font-mono text-xs">{complaint.assignedToUserId ? complaint.assignedToUserId.slice(0, 8) : 'Unassigned'}</p>
          </div>
          {complaint.roomId && (
            <div>
              <p className="text-muted-foreground">Room</p>
              <p className="font-mono text-xs">{complaint.roomId.slice(0, 8)}</p>
            </div>
          )}
          <div className="col-span-2 sm:col-span-3">
            <p className="text-muted-foreground">Description</p>
            <p className="mt-1 whitespace-pre-wrap">{complaint.description}</p>
          </div>
          {complaint.resolutionNote && (
            <div className="col-span-2 sm:col-span-3 border-t border-border pt-3">
              <p className="text-muted-foreground">Resolution note</p>
              <p className="mt-1 whitespace-pre-wrap">{complaint.resolutionNote}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Tabs
          items={[
            { value: 'activity', label: 'Activity' },
            { value: 'comments', label: 'Comments' },
            { value: 'attachments', label: 'Attachments' },
          ]}
          value={tab}
          onChange={(v) => setTab(v as TabValue)}
        />
        {tab === 'activity' && <ActivityTab complaintId={complaintId} />}
        {tab === 'comments' && <CommentsTab complaintId={complaintId} canPostInternal={isOrgMember} />}
        {tab === 'attachments' && <AttachmentsTab complaintId={complaintId} canRemove={canManage} currentUserId={user?.id} />}
      </div>

      {assignOpen && <AssignDialog complaintId={complaintId} onClose={() => setAssignOpen(false)} assign={assign} />}

      <Dialog open={resolveOpen} onClose={() => setResolveOpen(false)} title="Resolve complaint" description="Describe how this was resolved.">
        <ResolveForm
          resolve={resolve}
          onSuccess={() => {
            setResolveOpen(false)
            toast({ title: 'Complaint resolved', variant: 'success' })
          }}
        />
      </Dialog>

      {priorityOpen && (
        <PriorityDialog
          complaintId={complaintId}
          currentPriority={complaint.priority}
          setPriority={setPriority}
          onClose={() => setPriorityOpen(false)}
          onSuccess={() => {
            setPriorityOpen(false)
            toast({ title: 'Priority updated', variant: 'success' })
          }}
        />
      )}

      <ConfirmDialog
        open={closeOpen}
        onClose={() => setCloseOpen(false)}
        onConfirm={onClose}
        title="Close this complaint?"
        description="This marks the complaint as fully closed."
        confirmLabel="Close complaint"
        confirmVariant="default"
        isLoading={close.isPending}
      />

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={onCancel}
        title="Cancel this complaint?"
        description="This cannot be undone."
        confirmLabel="Cancel complaint"
        isLoading={cancel.isPending}
      />
    </div>
  )
}

function AssignDialog({
  onClose,
  assign,
}: {
  complaintId: string
  onClose: () => void
  assign: ReturnType<typeof useAssignComplaint>
}) {
  const { toast } = useToast()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AssignFormValues>({ resolver: zodResolver(assignSchema) })

  async function onSubmit(values: AssignFormValues) {
    try {
      await assign.mutateAsync(values)
      toast({ title: 'Complaint assigned', variant: 'success' })
      onClose()
    } catch (err) {
      toast({ title: 'Unable to assign', description: err instanceof ApiError ? err.message : undefined, variant: 'error' })
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title="Assign complaint"
      description="Enter the user ID of the manager/staff member to assign this to (pg-backend has no member lookup endpoint yet — see docs/backend-gaps.md)."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="assignedToUserId">User ID</Label>
          <Input id="assignedToUserId" invalid={Boolean(errors.assignedToUserId)} {...register('assignedToUserId')} />
          {errors.assignedToUserId && <p className="text-sm text-destructive" role="alert">{errors.assignedToUserId.message}</p>}
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" isLoading={isSubmitting}>Assign</Button>
        </div>
      </form>
    </Dialog>
  )
}

function ResolveForm({ resolve, onSuccess }: { resolve: ReturnType<typeof useResolveComplaint>; onSuccess: () => void }) {
  const { toast } = useToast()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResolveFormValues>({ resolver: zodResolver(resolveSchema) })

  async function onSubmit(values: ResolveFormValues) {
    try {
      await resolve.mutateAsync(values)
      onSuccess()
    } catch (err) {
      toast({ title: 'Unable to resolve', description: err instanceof ApiError ? err.message : undefined, variant: 'error' })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="resolutionNote">Resolution note</Label>
        <textarea
          id="resolutionNote"
          rows={4}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          {...register('resolutionNote')}
        />
        {errors.resolutionNote && <p className="text-sm text-destructive" role="alert">{errors.resolutionNote.message}</p>}
      </div>
      <div className="flex justify-end gap-3">
        <Button type="submit" isLoading={isSubmitting}>Mark resolved</Button>
      </div>
    </form>
  )
}

function PriorityDialog({
  currentPriority,
  setPriority,
  onClose,
  onSuccess,
}: {
  complaintId: string
  currentPriority: string
  setPriority: ReturnType<typeof useSetComplaintPriority>
  onClose: () => void
  onSuccess: () => void
}) {
  const { toast } = useToast()
  const [value, setValue] = useState(currentPriority)

  async function onSubmit() {
    try {
      await setPriority.mutateAsync({ priority: value as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' })
      onSuccess()
    } catch (err) {
      toast({ title: 'Unable to update priority', description: err instanceof ApiError ? err.message : undefined, variant: 'error' })
    }
  }

  return (
    <Dialog open onClose={onClose} title="Change priority">
      <div className="space-y-4">
        <Select value={value} onChange={(e) => setValue(e.target.value)}>
          {(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).map((p) => (
            <option key={p} value={p}>{COMPLAINT_PRIORITY_LABELS[p]}</option>
          ))}
        </Select>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="button" isLoading={setPriority.isPending} onClick={onSubmit}>Save</Button>
        </div>
      </div>
    </Dialog>
  )
}

function ActivityTab({ complaintId }: { complaintId: string }) {
  const { data: activity, isLoading } = useComplaintActivity(complaintId)
  if (isLoading) return <p className="text-sm text-muted-foreground">Loading activity…</p>
  if (!activity || activity.length === 0) return <p className="text-sm text-muted-foreground">No activity yet.</p>

  return (
    <ul className="space-y-3">
      {activity.map((event) => (
        <li key={event.id} className="rounded-lg border border-border p-3 text-sm">
          <p className="font-medium">{event.type.replace(/_/g, ' ').toLowerCase()}</p>
          <p className="text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleString()}</p>
        </li>
      ))}
    </ul>
  )
}

function CommentsTab({ complaintId, canPostInternal }: { complaintId: string; canPostInternal: boolean }) {
  const { data: comments, isLoading } = useComplaintComments(complaintId)
  const addComment = useAddComplaintComment(complaintId)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CommentFormValues>({ resolver: zodResolver(commentSchema), defaultValues: { visibility: 'PUBLIC' } })

  async function onSubmit(values: CommentFormValues) {
    try {
      await addComment.mutateAsync(values)
      reset({ body: '', visibility: values.visibility })
    } catch (err) {
      toast({ title: 'Unable to post comment', description: err instanceof ApiError ? err.message : undefined, variant: 'error' })
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-2">
        <textarea
          rows={3}
          placeholder="Add a comment…"
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Comment"
          {...register('body')}
        />
        {errors.body && <p className="text-sm text-destructive" role="alert">{errors.body.message}</p>}
        <div className="flex items-center justify-between">
          {canPostInternal ? (
            <Select className="max-w-[160px]" aria-label="Visibility" {...register('visibility')}>
              <option value="PUBLIC">Public</option>
              <option value="INTERNAL">Internal only</option>
            </Select>
          ) : (
            <span />
          )}
          <Button type="submit" size="sm" isLoading={isSubmitting}>Post comment</Button>
        </div>
      </form>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading comments…</p>
      ) : !comments || comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((comment) => (
            <li key={comment.id} className="rounded-lg border border-border p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-muted-foreground">{comment.authorUserId.slice(0, 8)}</span>
                {comment.visibility === 'INTERNAL' && (
                  <span className="rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-medium text-warning-foreground">
                    Internal
                  </span>
                )}
              </div>
              <p className="mt-1 whitespace-pre-wrap">{comment.body}</p>
              <p className="mt-1 text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function AttachmentsTab({
  complaintId,
  canRemove,
  currentUserId,
}: {
  complaintId: string
  canRemove: boolean
  currentUserId: string | undefined
}) {
  const { data: attachments, isLoading } = useComplaintAttachments(complaintId)
  const removeAttachment = useRemoveComplaintAttachment(complaintId)
  const addAttachment = useAddComplaintAttachment(complaintId)
  const { toast } = useToast()
  const [url, setUrl] = useState('')

  async function onRemove(attachmentId: string) {
    try {
      await removeAttachment.mutateAsync(attachmentId)
      toast({ title: 'Attachment removed', variant: 'success' })
    } catch (err) {
      toast({ title: 'Unable to remove attachment', description: err instanceof ApiError ? err.message : undefined, variant: 'error' })
    }
  }

  async function onAdd() {
    if (!url.trim()) return
    if (!isSafeHttpUrl(url.trim())) {
      toast({ title: 'Enter a valid image URL', description: 'The URL must start with http:// or https://.', variant: 'error' })
      return
    }
    const fileName = url.split('/').pop() || 'attachment'
    const extension = fileName.split('.').pop()?.toLowerCase()
    const mimeType = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg'
    try {
      // pg-backend registers a reference to an already-hosted image — it is not a file upload
      // endpoint (see docs/complaints.md). size is unknown for a pasted URL, so a conservative
      // placeholder within the 10MB limit is sent.
      await addAttachment.mutateAsync({ url: url.trim(), fileName, mimeType, size: 1 })
      setUrl('')
      toast({ title: 'Attachment added', variant: 'success' })
    } catch (err) {
      toast({ title: 'Unable to add attachment', description: err instanceof ApiError ? err.message : undefined, variant: 'error' })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="https://…/photo.jpg"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          aria-label="Attachment URL"
        />
        <Button type="button" isLoading={addAttachment.isPending} onClick={onAdd}>
          Add
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading attachments…</p>
      ) : !attachments || attachments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No attachments.</p>
      ) : (
        <ul className="space-y-2">
          {attachments.map((attachment) => (
            <li key={attachment.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
              {isSafeHttpUrl(attachment.url) ? (
                <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">
                  {attachment.fileName}
                </a>
              ) : (
                <span className="text-muted-foreground" title="This attachment's URL isn't a valid http(s) link">
                  {attachment.fileName}
                </span>
              )}
              {(canRemove || attachment.uploadedByUserId === currentUserId) && (
                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => onRemove(attachment.id)}>
                  Remove
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
