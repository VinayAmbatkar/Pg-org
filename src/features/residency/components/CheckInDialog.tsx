import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useToast } from '@/components/feedback/ToastProvider'
import { useBedsForRooms } from '@/features/beds/hooks/useBedsForRooms'
import { useRooms } from '@/features/rooms/hooks/useRooms'
import { ApiError } from '@/infrastructure/api/errors'
import { useCheckIn } from '../hooks/useResidencyMutations'
import { checkInSchema, type CheckInFormValues } from '../schemas/residency.schema'

interface CheckInDialogProps {
  residencyId: string
  propertyId: string
  onClose: () => void
}

/** Mounted only while open, so the rooms + per-room beds fan-out it needs runs only when someone
 * actually starts a check-in — not on every Tenant 360 page view. */
export function CheckInDialog({ residencyId, propertyId, onClose }: CheckInDialogProps) {
  const { toast } = useToast()
  const checkIn = useCheckIn(residencyId)
  const rooms = useRooms(propertyId)
  const { beds, isLoading: bedsLoading } = useBedsForRooms(propertyId, rooms.data)
  // Vacant = in service and nobody allocated (occupant comes from pg-backend's ACTIVE allocation).
  const inServiceBeds = beds.filter((bed) => bed.status === 'AVAILABLE' && !bed.occupant)
  const roomById = new Map((rooms.data ?? []).map((room) => [room.id, room]))
  const isLoadingBeds = rooms.isLoading || bedsLoading

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CheckInFormValues>({ resolver: zodResolver(checkInSchema) })

  async function onSubmit(values: CheckInFormValues) {
    try {
      await checkIn.mutateAsync({ bedId: values.bedId })
      toast({ title: 'Tenant checked in', variant: 'success' })
      onClose()
    } catch (err) {
      // Backend stays authoritative for occupancy: an occupied bed comes back as 409
      // BED_ALREADY_OCCUPIED, whose mapped message tells the user to pick another bed.
      const message = err instanceof ApiError ? err.message : 'Unable to check in. Please try again.'
      if (err instanceof ApiError && err.code === 'BED_ALREADY_OCCUPIED') {
        setError('bedId', { message })
      } else {
        toast({ title: 'Unable to check in', description: message, variant: 'error' })
      }
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      preventClose={isSubmitting}
      title="Check in tenant"
      description="Choose a vacant bed. If someone takes it in the meantime, you'll be asked to pick another."
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="bedId">Bed</Label>
          <Select
            id="bedId"
            invalid={Boolean(errors.bedId)}
            disabled={isLoadingBeds}
            aria-describedby={errors.bedId ? 'bedId-error' : undefined}
            {...register('bedId')}
          >
            <option value="">{isLoadingBeds ? 'Loading beds…' : 'Select a bed'}</option>
            {inServiceBeds.map((bed) => {
              const room = roomById.get(bed.roomId)
              return (
                <option key={bed.id} value={bed.id}>
                  {room ? `Room ${room.roomNumber} — Bed ${bed.bedNumber}` : `Bed ${bed.bedNumber}`}
                </option>
              )
            })}
          </Select>
          {errors.bedId && (
            <p id="bedId-error" className="text-sm text-destructive" role="alert">
              {errors.bedId.message}
            </p>
          )}
          {!isLoadingBeds && inServiceBeds.length === 0 && (
            <p className="text-sm text-muted-foreground">No vacant beds at this property right now.</p>
          )}
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting || isLoadingBeds}>
            Check in
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
