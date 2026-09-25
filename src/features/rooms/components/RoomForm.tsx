import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { ROOM_TYPE_LABELS } from '@/lib/formatters/enumLabels'
import type { RoomType } from '@/types/api'
import { EMPTY_ROOM_DETAILS, roomFormSchema, type RoomFormValues } from '../schemas/room.schema'
import { AMENITIES } from '../lib/amenities'

const ROOM_TYPES: RoomType[] = ['SINGLE', 'DOUBLE', 'TRIPLE', 'FOUR', 'DORMITORY', 'OTHER']

type RoomFormInput = z.input<typeof roomFormSchema>

interface RoomFormProps {
  defaultValues?: Partial<RoomFormValues>
  onSubmit: (values: RoomFormValues) => Promise<void>
  onCancel?: () => void
  submitLabel: string
  formError?: string | null
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} className="text-sm text-destructive" role="alert">
      {message}
    </p>
  )
}

export function RoomForm({ defaultValues, onSubmit, onCancel, submitLabel, formError }: RoomFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RoomFormInput, unknown, RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: { roomType: 'SINGLE', ...EMPTY_ROOM_DETAILS, ...defaultValues },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="roomNumber">Room number</Label>
          <Input
            id="roomNumber"
            invalid={Boolean(errors.roomNumber)}
            aria-describedby="roomNumber-error"
            {...register('roomNumber')}
          />
          <FieldError id="roomNumber-error" message={errors.roomNumber?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="roomType">Room type</Label>
          <Select id="roomType" invalid={Boolean(errors.roomType)} {...register('roomType')}>
            {ROOM_TYPES.map((type) => (
              <option key={type} value={type}>
                {ROOM_TYPE_LABELS[type]} sharing
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="floor">Floor</Label>
          <Input id="floor" type="number" invalid={Boolean(errors.floor)} aria-describedby="floor-error" {...register('floor')} />
          <FieldError id="floor-error" message={errors.floor?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="capacity">Capacity (beds)</Label>
          <Input
            id="capacity"
            type="number"
            invalid={Boolean(errors.capacity)}
            aria-describedby="capacity-error"
            {...register('capacity')}
          />
          <FieldError id="capacity-error" message={errors.capacity?.message} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pricePerBed">Price / bed (₹)</Label>
          <Input
            id="pricePerBed"
            inputMode="decimal"
            placeholder="7000"
            invalid={Boolean(errors.pricePerBed)}
            aria-describedby="pricePerBed-help pricePerBed-error"
            {...register('pricePerBed')}
          />
          <FieldError id="pricePerBed-error" message={errors.pricePerBed?.message} />
        </div>
      </div>
      <p id="pricePerBed-help" className="-mt-2 text-xs text-muted-foreground">
        The advertised monthly rate. Each tenant is still billed by their own rent plan.
      </p>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Amenities</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {AMENITIES.map(({ value, label, icon: Icon }) => (
            <label
              key={value}
              className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-2.5 py-2 text-sm hover:bg-accent/40"
            >
              <input type="checkbox" value={value} className="h-4 w-4 accent-[#6956e8]" {...register('amenities')} />
              <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="imageUrl">Photo link (optional)</Label>
        <Input
          id="imageUrl"
          type="url"
          placeholder="https://…"
          invalid={Boolean(errors.imageUrl)}
          aria-describedby="imageUrl-error"
          {...register('imageUrl')}
        />
        <FieldError id="imageUrl-error" message={errors.imageUrl?.message} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description (optional)</Label>
        <textarea
          id="description"
          rows={3}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-[invalid=true]:border-destructive"
          aria-invalid={Boolean(errors.description)}
          aria-describedby="description-error"
          {...register('description')}
        />
        <FieldError id="description-error" message={errors.description?.message} />
      </div>

      {formError && (
        <p className="text-sm text-destructive" role="alert">
          {formError}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
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
