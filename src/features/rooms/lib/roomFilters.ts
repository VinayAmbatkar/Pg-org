import type { Bed, Room, RoomAmenity, RoomStatus, RoomType } from '@/types/api'

// Rooms & Beds filters. Everything here filters on fields pg-backend returns for each room:
// number, floor, type, capacity, status, amenities, pricePerBed and the server-computed `occupancy`
// (exact: from ACTIVE bed allocations). All client-side over the property's room list, which the
// backend returns in full (no pagination).

export const ROOM_TYPES: RoomType[] = ['SINGLE', 'DOUBLE', 'TRIPLE', 'FOUR', 'DORMITORY', 'OTHER']
export const ROOM_STATUSES: RoomStatus[] = ['ACTIVE', 'INACTIVE', 'ARCHIVED']
export const ROOM_AMENITIES: RoomAmenity[] = ['AC', 'WIFI', 'TV', 'FAN', 'ALMARI', 'STUDY_TABLE', 'ATTACHED_WASHROOM', 'GEYSER', 'BALCONY']
/** Amenity filter values: every RoomAmenity plus NON_AC ("rooms without AC"). */
export type AmenityFilter = RoomAmenity | 'NON_AC'

export interface RoomFilters {
  search: string
  types: RoomType[]
  /** A floor number, 'none' for rooms without a floor, or null for all floors. */
  floor: number | 'none' | null
  status: RoomStatus | null
  amenities: AmenityFilter[]
  /** Only rooms with at least one vacant (in-service, unoccupied) bed. */
  vacantOnly: boolean
  /** Only rooms with beds but nobody in them. */
  emptyOnly: boolean
  /** Only rooms whose capacity allows adding more beds. */
  hasFreeSlots: boolean
  priceMin: number | null
  priceMax: number | null
}

export interface RoomBedSummary {
  beds: Bed[]
  /** Non-archived beds. */
  total: number
  inService: number
  /** capacity − non-archived beds: room for more beds, NOT vacancy. */
  freeSlots: number
}

export function summarizeRoomBeds(room: Room, allBeds: Bed[]): RoomBedSummary {
  const beds = allBeds
    .filter((b) => b.roomId === room.id && b.status !== 'ARCHIVED')
    .sort((a, b) => a.bedNumber.localeCompare(b.bedNumber, undefined, { numeric: true }))
  return {
    beds,
    total: beds.length,
    inService: beds.filter((b) => b.status === 'AVAILABLE').length,
    freeSlots: Math.max(0, room.capacity - beds.length),
  }
}

const numberParam = (value: string): number | null => {
  if (value === '') return null
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : null
}

export function parseRoomFilters(get: (key: string) => string): RoomFilters {
  const list = (key: string) => get(key).split(',').filter(Boolean)
  const floorParam = get('floor')
  const statusParam = get('roomStatus')
  return {
    search: get('room').trim().toLowerCase(),
    types: list('roomType').filter((t): t is RoomType => (ROOM_TYPES as string[]).includes(t)),
    floor: floorParam === 'none' ? 'none' : floorParam !== '' && Number.isInteger(Number(floorParam)) ? Number(floorParam) : null,
    status: (ROOM_STATUSES as string[]).includes(statusParam) ? (statusParam as RoomStatus) : null,
    amenities: list('amen').filter((a): a is AmenityFilter => a === 'NON_AC' || (ROOM_AMENITIES as string[]).includes(a)),
    vacantOnly: get('avail').split(',').includes('vacant'),
    emptyOnly: get('avail').split(',').includes('empty'),
    hasFreeSlots: get('slots') === '1',
    priceMin: numberParam(get('pmin')),
    priceMax: numberParam(get('pmax')),
  }
}

export function countActiveFilters(f: RoomFilters): number {
  return (
    (f.search ? 1 : 0) +
    f.types.length +
    (f.floor !== null ? 1 : 0) +
    (f.status ? 1 : 0) +
    f.amenities.length +
    (f.vacantOnly ? 1 : 0) +
    (f.emptyOnly ? 1 : 0) +
    (f.hasFreeSlots ? 1 : 0) +
    (f.priceMin !== null || f.priceMax !== null ? 1 : 0)
  )
}

export function freeSlotsOf(room: Room): number {
  return Math.max(0, room.capacity - room.occupancy.totalBeds)
}

export function filterRooms(rooms: Room[], f: RoomFilters): Room[] {
  return rooms
    .filter((room) => {
      if (f.search && !room.roomNumber.toLowerCase().includes(f.search)) return false
      if (f.types.length > 0 && !f.types.includes(room.roomType)) return false
      if (f.floor === 'none' && room.floor !== null) return false
      if (typeof f.floor === 'number' && room.floor !== f.floor) return false
      if (f.status && room.status !== f.status) return false
      for (const amenity of f.amenities) {
        if (amenity === 'NON_AC' ? room.amenities.includes('AC') : !room.amenities.includes(amenity)) return false
      }
      if (f.vacantOnly && room.occupancy.vacantBeds === 0) return false
      if (f.emptyOnly && (room.occupancy.totalBeds === 0 || room.occupancy.occupiedBeds > 0)) return false
      if (f.hasFreeSlots && freeSlotsOf(room) === 0) return false
      if (f.priceMin !== null || f.priceMax !== null) {
        // With a price range set, a room with no advertised price can't be said to match it.
        if (room.pricePerBed === null) return false
        const price = Number(room.pricePerBed)
        if (f.priceMin !== null && price < f.priceMin) return false
        if (f.priceMax !== null && price > f.priceMax) return false
      }
      return true
    })
    .sort((a, b) => a.roomNumber.localeCompare(b.roomNumber, undefined, { numeric: true }))
}

/** Lowest/highest advertised price in the property (for the price slider), or null if none set. */
export function priceBoundsOf(rooms: Room[]): { min: number; max: number } | null {
  const prices = rooms.map((r) => (r.pricePerBed === null ? NaN : Number(r.pricePerBed))).filter(Number.isFinite)
  if (prices.length === 0) return null
  return { min: Math.min(...prices), max: Math.max(...prices) }
}

/** Distinct floors present in the property, for the floor dropdown (never a hard-coded list). */
export function floorsOf(rooms: Room[]): Array<number | 'none'> {
  const floors = new Set<number | 'none'>(rooms.map((r) => r.floor ?? 'none'))
  return [...floors].sort((a, b) => (a === 'none' ? 1 : b === 'none' ? -1 : a - b))
}

function ordinal(n: number): string {
  const mod100 = n % 100
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`
  return `${n}${({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'}`
}

/** "Ground floor", "1st floor", "2nd floor", … */
export function floorLabel(floor: number | 'none'): string {
  if (floor === 'none') return 'No floor set'
  if (floor === 0) return 'Ground floor'
  if (floor < 0) return `Basement ${Math.abs(floor)}`
  return `${ordinal(floor)} floor`
}

/** Short floor for tables: "G", "1st", "2nd". */
export function floorShort(floor: number | null): string {
  if (floor === null) return '—'
  if (floor === 0) return 'Ground'
  if (floor < 0) return `B${Math.abs(floor)}`
  return ordinal(floor)
}
