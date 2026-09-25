import { describe, expect, it } from 'vitest'
import type { Bed, Room } from '@/types/api'
import { countActiveFilters, filterRooms, floorLabel, floorShort, floorsOf, parseRoomFilters, priceBoundsOf, summarizeRoomBeds } from './roomFilters'

const room = (id: string, overrides: Partial<Room> = {}): Room => ({
  id,
  propertyId: 'p',
  roomNumber: id,
  floor: 1,
  roomType: 'DOUBLE',
  capacity: 2,
  status: 'ACTIVE',
  pricePerBed: null,
  currency: 'INR',
  amenities: [],
  imageUrl: null,
  description: null,
  occupancy: { totalBeds: 0, occupiedBeds: 0, vacantBeds: 0, blockedBeds: 0 },
  createdAt: '',
  ...overrides,
})
const bed = (id: string, roomId: string, status: Bed['status'] = 'AVAILABLE'): Bed => ({ id, roomId, bedNumber: id, status, berth: null, occupant: null, createdAt: '' })
const params = (q: string) => {
  const sp = new URLSearchParams(q)
  return (key: string) => sp.get(key) ?? ''
}

const occ = (totalBeds: number, occupiedBeds: number, vacantBeds: number, blockedBeds = 0) => ({ totalBeds, occupiedBeds, vacantBeds, blockedBeds })

describe('roomFilters', () => {
  const rooms = [
    room('101', { roomType: 'SINGLE', capacity: 1, floor: 1, amenities: ['WIFI'], pricePerBed: '5500.00', occupancy: occ(1, 1, 0) }),
    room('204', { roomType: 'DOUBLE', capacity: 2, floor: 2, amenities: ['AC', 'WIFI', 'TV'], pricePerBed: '8000.00', occupancy: occ(2, 0, 2) }),
    room('305', { roomType: 'TRIPLE', capacity: 3, floor: null, status: 'INACTIVE', amenities: ['AC'], pricePerBed: null, occupancy: occ(1, 0, 0, 1) }),
  ]
  const beds = [bed('A', '101'), bed('A2', '204'), bed('B2', '204'), bed('A3', '305'), bed('X3', '305', 'ARCHIVED')]

  it('summarizes beds per room, ignoring archived beds, and derives free slots from capacity', () => {
    expect(summarizeRoomBeds(rooms[2], beds)).toMatchObject({ total: 1, inService: 1, freeSlots: 2 })
    expect(summarizeRoomBeds(rooms[1], beds)).toMatchObject({ total: 2, freeSlots: 0 })
  })

  it('parses and validates URL params (unknown values are ignored)', () => {
    const f = parseRoomFilters(
      params('roomType=SINGLE,BOGUS,TRIPLE&floor=2&roomStatus=NOPE&slots=1&room=20&amen=AC,NON_AC,POOL&avail=vacant,x&pmin=3000&pmax=abc'),
    )
    expect(f).toEqual({
      search: '20',
      types: ['SINGLE', 'TRIPLE'],
      floor: 2,
      status: null,
      amenities: ['AC', 'NON_AC'],
      vacantOnly: true,
      emptyOnly: false,
      hasFreeSlots: true,
      priceMin: 3000,
      priceMax: null,
    })
    expect(parseRoomFilters(params('floor=none')).floor).toBe('none')
    expect(parseRoomFilters(params('floor=abc')).floor).toBeNull()
    expect(countActiveFilters(f)).toBe(9)
  })

  it('filters by type, floor, status, search, capacity, amenities, availability and price together', () => {
    const ids = (q: string) => filterRooms(rooms, parseRoomFilters(params(q))).map((r) => r.roomNumber)
    expect(ids('')).toEqual(['101', '204', '305'])
    expect(ids('roomType=SINGLE,DOUBLE')).toEqual(['101', '204'])
    expect(ids('floor=2')).toEqual(['204'])
    expect(ids('floor=none')).toEqual(['305'])
    expect(ids('roomStatus=INACTIVE')).toEqual(['305'])
    expect(ids('slots=1')).toEqual(['305'])
    expect(ids('room=20')).toEqual(['204'])
    // Amenities are AND-ed; NON_AC means "no AC".
    expect(ids('amen=AC')).toEqual(['204', '305'])
    expect(ids('amen=AC,TV')).toEqual(['204'])
    expect(ids('amen=NON_AC')).toEqual(['101'])
    // Availability uses the server-computed occupancy.
    expect(ids('avail=vacant')).toEqual(['204'])
    expect(ids('avail=empty')).toEqual(['204', '305'])
    // A price bound hides rooms with no advertised price.
    expect(ids('pmin=6000')).toEqual(['204'])
    expect(ids('pmax=6000')).toEqual(['101'])
  })

  it('computes the price slider bounds from rooms that have a price', () => {
    expect(priceBoundsOf(rooms)).toEqual({ min: 5500, max: 8000 })
    expect(priceBoundsOf([rooms[2]])).toBeNull()
  })

  it('lists only floors that exist, with "no floor" last, and labels floors as ordinals', () => {
    expect(floorsOf(rooms)).toEqual([1, 2, 'none'])
    expect([0, 1, 2, 3, 4, 11, 12, 13, 21, 22].map(floorShort)).toEqual(['Ground', '1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd'])
    expect(floorLabel(1)).toBe('1st floor')
  })
})
