import { formatCurrency } from '@/lib/formatters/currency'
import { ROOM_TYPE_LABELS } from '@/lib/formatters/enumLabels'
import type { Room } from '@/types/api'
import { floorLabel } from './roomFilters'

/** "AC · Triple" — the AC/Non-AC flag only when the room has amenities recorded at all. */
export function roomTypeLine(room: Room): string {
  const type = ROOM_TYPE_LABELS[room.roomType]
  if (room.amenities.length === 0) return type
  return `${room.amenities.includes('AC') ? 'AC' : 'Non-AC'} · ${type}`
}

/** "AC · Triple sharing · 1st floor" */
export function roomSubtitle(room: Room): string {
  return [roomTypeLine(room) + ' sharing', floorLabel(room.floor ?? 'none')].join(' · ')
}

export function roomPrice(room: Room): string | null {
  return room.pricePerBed === null ? null : formatCurrency(room.pricePerBed, room.currency).replace(/\.00$/, '')
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('')
}
