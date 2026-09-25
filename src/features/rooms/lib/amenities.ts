import type { LucideIcon } from 'lucide-react'
import { AirVent, Archive, Bath, Fan, Flame, LampDesk, Sun, Tv, Wifi } from 'lucide-react'
import type { RoomAmenity } from '@/types/api'

export const AMENITIES: Array<{ value: RoomAmenity; label: string; icon: LucideIcon }> = [
  { value: 'AC', label: 'AC', icon: AirVent },
  { value: 'WIFI', label: 'WiFi', icon: Wifi },
  { value: 'TV', label: 'TV', icon: Tv },
  { value: 'FAN', label: 'Fan', icon: Fan },
  { value: 'ALMARI', label: 'Almari', icon: Archive },
  { value: 'STUDY_TABLE', label: 'Study table', icon: LampDesk },
  { value: 'ATTACHED_WASHROOM', label: 'Attached washroom', icon: Bath },
  { value: 'GEYSER', label: 'Geyser', icon: Flame },
  { value: 'BALCONY', label: 'Balcony', icon: Sun },
]

export const AMENITY_BY_VALUE = new Map(AMENITIES.map((a) => [a.value, a]))

export function amenityLabel(value: RoomAmenity): string {
  return AMENITY_BY_VALUE.get(value)?.label ?? value
}
