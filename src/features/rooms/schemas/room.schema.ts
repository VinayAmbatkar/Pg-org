import { z } from 'zod'
import { isSafeHttpUrl } from '@/lib/validators/url'
import type { CreateRoomPayload, UpdateRoomPayload } from '../types'

const AMENITY_VALUES = ['AC', 'WIFI', 'TV', 'FAN', 'ALMARI', 'STUDY_TABLE', 'ATTACHED_WASHROOM', 'GEYSER', 'BALCONY'] as const

// Mirrors CreateRoomDto/UpdateRoomDto exactly (create-room.dto.ts / update-room.dto.ts).
export const roomFormSchema = z.object({
  roomNumber: z.string().trim().min(1, 'Room number is required').max(50),
  floor: z.union([z.nan(), z.coerce.number().int()]).optional(),
  roomType: z.enum(['SINGLE', 'DOUBLE', 'TRIPLE', 'FOUR', 'DORMITORY', 'OTHER']),
  capacity: z.coerce.number().int().min(1, 'Capacity must be at least 1').max(50),
  // Same rule as pg-backend's DECIMAL_PATTERN: up to 10 digits, at most 2 decimals. Blank = not set.
  pricePerBed: z
    .string()
    .trim()
    .refine((v) => v === '' || /^\d{1,10}(\.\d{1,2})?$/.test(v), 'Enter an amount like 7000 or 7000.50'),
  amenities: z.array(z.enum(AMENITY_VALUES)),
  imageUrl: z
    .string()
    .trim()
    .max(2048)
    .refine((v) => v === '' || isSafeHttpUrl(v), 'Enter a full http(s) image link'),
  description: z.string().trim().max(1000, 'Keep the description under 1000 characters'),
})

export type RoomFormValues = z.infer<typeof roomFormSchema>

export const EMPTY_ROOM_DETAILS = { pricePerBed: '', amenities: [], imageUrl: '', description: '' } satisfies Pick<
  RoomFormValues,
  'pricePerBed' | 'amenities' | 'imageUrl' | 'description'
>

const floorOf = (floor: number | undefined) => (floor === undefined || Number.isNaN(floor) ? undefined : floor)

/** Create: blank optional fields are omitted. */
export function toCreateRoomPayload(values: RoomFormValues): CreateRoomPayload {
  return {
    roomNumber: values.roomNumber,
    floor: floorOf(values.floor),
    roomType: values.roomType,
    capacity: values.capacity,
    pricePerBed: values.pricePerBed || undefined,
    amenities: values.amenities,
    imageUrl: values.imageUrl || undefined,
    description: values.description || undefined,
  }
}

/** Update: a field the owner emptied is sent as null so the backend clears it. */
export function toUpdateRoomPayload(values: RoomFormValues): UpdateRoomPayload {
  return {
    roomNumber: values.roomNumber,
    floor: floorOf(values.floor),
    roomType: values.roomType,
    capacity: values.capacity,
    pricePerBed: values.pricePerBed || null,
    amenities: values.amenities,
    imageUrl: values.imageUrl || null,
    description: values.description || null,
  }
}
