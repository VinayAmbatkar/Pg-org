import type { BedBerth } from '@/types/api'

export interface CreateBedPayload {
  bedNumber: string
  berth?: BedBerth
}

export interface UpdateBedPayload {
  bedNumber?: string
  status?: 'AVAILABLE' | 'INACTIVE'
  /** null makes it a regular (non-bunk) bed. */
  berth?: BedBerth | null
}
