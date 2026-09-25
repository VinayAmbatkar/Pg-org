import { cn } from '@/lib/utils/cn'
import type { RoomAmenity } from '@/types/api'
import { AMENITIES, AMENITY_BY_VALUE } from '../lib/amenities'

/** Compact inline list of a room's amenities (icon + label), e.g. on cards. */
export function AmenityList({ amenities, max, className }: { amenities: RoomAmenity[]; max?: number; className?: string }) {
  const shown = max ? amenities.slice(0, max) : amenities
  const hidden = amenities.length - shown.length
  if (amenities.length === 0) return null
  return (
    <ul
      className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#64708e]', className)}
      aria-label="Amenities"
    >
      {shown.map((value) => {
        const amenity = AMENITY_BY_VALUE.get(value)
        const Icon = amenity?.icon
        return (
          <li key={value} className="inline-flex items-center gap-1">
            {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
            {amenity?.label ?? value}
          </li>
        )
      })}
      {hidden > 0 && <li className="text-muted-foreground">+{hidden} more</li>}
    </ul>
  )
}

/** Tile grid (Room detail "Amenities"): every amenity, present ones highlighted. */
export function AmenityTiles({ amenities, showAbsent = false }: { amenities: RoomAmenity[]; showAbsent?: boolean }) {
  const items = showAbsent ? AMENITIES : AMENITIES.filter((a) => amenities.includes(a.value))
  if (items.length === 0) return <p className="text-sm text-muted-foreground">No amenities listed for this room yet.</p>
  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4" aria-label="Amenities">
      {items.map(({ value, label, icon: Icon }) => {
        const present = amenities.includes(value)
        return (
          <li
            key={value}
            className={cn(
              'flex flex-col items-center gap-1 rounded-lg px-2 py-3 text-center text-[11px] font-medium',
              present ? 'bg-[#f1f3ff] text-[#4d5ce7]' : 'bg-[#f7f8fb] text-[#a3abbd] line-through',
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
            {!present && <span className="sr-only">(not available)</span>}
          </li>
        )
      })}
    </ul>
  )
}
