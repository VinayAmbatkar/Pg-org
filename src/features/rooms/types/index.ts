import type { RoomAmenity, RoomType } from '@/types/api'

export interface CreateRoomPayload {
  roomNumber: string
  floor?: number
  roomType: RoomType
  capacity: number
  pricePerBed?: string
  amenities?: RoomAmenity[]
  imageUrl?: string
  description?: string
}

/** On update, null clears pricePerBed / imageUrl / description. */
export type UpdateRoomPayload = Partial<Omit<CreateRoomPayload, 'pricePerBed' | 'imageUrl' | 'description'>> & {
  pricePerBed?: string | null
  imageUrl?: string | null
  description?: string | null
}
