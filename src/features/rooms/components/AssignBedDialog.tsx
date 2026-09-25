import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { QueryState } from '@/components/feedback/QueryState'
import { useToast } from '@/components/feedback/ToastProvider'
import { useResidenciesForProperty } from '@/features/residency/hooks/useResidenciesForProperty'
import { useCheckIn } from '@/features/residency/hooks/useResidencyMutations'
import { ApiError } from '@/infrastructure/api/errors'
import { formatDate } from '@/lib/formatters/date'
import type { Bed } from '@/types/api'

interface AssignBedDialogProps {
  propertyId: string
  bed: Bed
  roomNumber: string
  onClose: () => void
}

/** Checks a tenant whose stay is awaiting check-in (PENDING residency) into this vacant bed. Uses
 * the real check-in endpoint — pg-backend stays authoritative (a bed taken meanwhile → 409). */
export function AssignBedDialog({ propertyId, bed, roomNumber, onClose }: AssignBedDialogProps) {
  const { toast } = useToast()
  const residencies = useResidenciesForProperty(propertyId)
  const pending = (residencies.data ?? []).filter((r) => r.status === 'PENDING')
  const [residencyId, setResidencyId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const checkIn = useCheckIn(residencyId)

  async function submit() {
    if (!residencyId) {
      setError('Choose the tenant to check in.')
      return
    }
    setError(null)
    try {
      await checkIn.mutateAsync({ bedId: bed.id })
      toast({ title: `Checked in to Room ${roomNumber}, bed ${bed.bedNumber}`, variant: 'success' })
      onClose()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to check in. Please try again.')
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      preventClose={checkIn.isPending}
      title={`Assign bed ${bed.bedNumber}`}
      description={`Room ${roomNumber}. Choose a tenant whose stay is waiting for check-in.`}
    >
      <QueryState
        isLoading={residencies.isLoading}
        error={residencies.error}
        onRetry={() => void residencies.refetch()}
        isEmpty={pending.length === 0}
        empty={
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">No tenants are waiting for check-in at this property.</p>
            <Link to={`/app/properties/${propertyId}/residencies/new`}>
              <Button size="sm">Add a tenant</Button>
            </Link>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="assign-residency">Tenant</Label>
            <Select
              id="assign-residency"
              value={residencyId}
              onChange={(e) => setResidencyId(e.target.value)}
              invalid={Boolean(error)}
              aria-describedby={error ? 'assign-error' : undefined}
            >
              <option value="">Select a tenant…</option>
              {pending.map((r) => (
                <option key={r.id} value={r.id}>
                  Tenant {r.tenantId.slice(0, 8)} · starts {formatDate(r.startDate)}
                </option>
              ))}
            </Select>
            {error && (
              <p id="assign-error" className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={checkIn.isPending}>
              Cancel
            </Button>
            <Button onClick={submit} isLoading={checkIn.isPending}>
              Check in
            </Button>
          </div>
        </div>
      </QueryState>
    </Dialog>
  )
}
