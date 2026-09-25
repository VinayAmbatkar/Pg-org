import { ArrowRight, BedDouble, BedSingle, Plus } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'
import { isSafeHttpUrl } from '@/lib/validators/url'
import type { Bed, Room } from '@/types/api'
import { initialsOf, roomPrice, roomSubtitle } from '../lib/roomDisplay'
import type { RoomBedSummary } from '../lib/roomFilters'
import { AmenityList } from './amenities'
import { RoomStatusBadge } from './RoomStatusBadge'

interface RoomCardProps {
  room: Room
  summary: RoomBedSummary | undefined
  bedsLoading: boolean
  to: string
}

// Header tint per room type when there's no photo — decorative; the type is always printed as text.
const TYPE_TINTS: Record<string, string> = {
  SINGLE: 'from-[#eef4ff] to-[#dde8ff] text-[#3775e8]',
  DOUBLE: 'from-[#f3efff] to-[#e5dcff] text-[#6956e8]',
  TRIPLE: 'from-[#ecfbf5] to-[#d4f5e7] text-[#12ad79]',
  FOUR: 'from-[#fff6e9] to-[#ffe8c7] text-[#d97706]',
  DORMITORY: 'from-[#fff0f7] to-[#ffd9eb] text-[#db2777]',
  OTHER: 'from-[#f3f5f9] to-[#e6eaf2] text-[#64708e]',
}

export function RoomPhoto({ room, className, iconClassName }: { room: Room; className?: string; iconClassName?: string }) {
  const [failed, setFailed] = useState(false)
  const TypeIcon = room.roomType === 'SINGLE' ? BedSingle : BedDouble
  if (room.imageUrl && isSafeHttpUrl(room.imageUrl) && !failed) {
    return (
      <img
        src={room.imageUrl}
        alt={`Room ${room.roomNumber}`}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={cn('h-full w-full object-cover', className)}
      />
    )
  }
  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center bg-gradient-to-br',
        TYPE_TINTS[room.roomType] ?? TYPE_TINTS.OTHER,
        className,
      )}
      aria-hidden="true"
    >
      <TypeIcon className={cn('h-10 w-10 opacity-80', iconClassName)} />
    </div>
  )
}

export function BedChip({ bed, compact = false }: { bed: Bed; compact?: boolean }) {
  const occupied = Boolean(bed.occupant)
  const blocked = !occupied && bed.status === 'INACTIVE'
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg px-1.5 py-2 text-center',
        occupied ? 'bg-[#fff0f1] text-[#b4234a]' : blocked ? 'bg-[#f1f2f6] text-[#8a93a8]' : 'bg-[#f1f3ff] text-[#4d5ce7]',
      )}
    >
      <span className="text-xs font-semibold">{bed.bedNumber}</span>
      {occupied ? (
        <>
          <span
            className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#b4234a] shadow-sm"
            aria-hidden="true"
          >
            {initialsOf(bed.occupant!.name)}
          </span>
          <span className="mt-0.5 w-full truncate text-[10px] font-medium text-[#182345]">
            {bed.occupant!.name.split(' ')[0]}
          </span>
        </>
      ) : (
        !compact && <span className="text-[10px]">{blocked ? 'Blocked' : 'Vacant'}</span>
      )}
      <span className="sr-only">{occupied ? `occupied by ${bed.occupant!.name}` : blocked ? 'blocked' : 'vacant'}</span>
    </div>
  )
}

export function RoomCard({ room, summary, bedsLoading, to }: RoomCardProps) {
  const price = roomPrice(room)
  const { vacantBeds, occupiedBeds, totalBeds } = room.occupancy

  return (
    <Card className="flex h-full flex-col overflow-hidden border-[#edf0f6] bg-white shadow-[0_4px_16px_rgba(32,52,95,0.05)] transition-shadow hover:shadow-[0_8px_24px_rgba(32,52,95,0.09)]">
      <div className="relative h-32">
        <RoomPhoto room={room} />
        <span
          className={cn(
            'absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[11px] font-semibold shadow-sm',
            vacantBeds > 0 ? 'bg-[#e5fbf3] text-[#0f8a61]' : 'bg-white/90 text-[#182345]',
          )}
        >
          {totalBeds === 0
            ? 'No beds yet'
            : vacantBeds > 0
              ? `${vacantBeds} bed${vacantBeds === 1 ? '' : 's'} available`
              : `${occupiedBeds} / ${totalBeds} occupied`}
        </span>
      </div>

      <CardContent className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-[#182345]">Room {room.roomNumber}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{roomSubtitle(room)}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {price ? (
              <p className="text-right">
                <span className="text-base font-bold text-[#182345]">{price}</span>
                <span className="block text-[10px] text-muted-foreground">per bed / month</span>
              </p>
            ) : (
              <RoomStatusBadge status={room.status} />
            )}
          </div>
        </div>

        <AmenityList amenities={room.amenities} max={4} />

        <div className="flex-1">
          {bedsLoading && !summary ? (
            <p className="text-xs text-muted-foreground">Loading beds…</p>
          ) : (
            <ul className="grid grid-cols-3 gap-2" aria-label={`Beds in room ${room.roomNumber}`}>
              {summary?.beds.map((bed) => (
                <li key={bed.id}>
                  <BedChip bed={bed} />
                </li>
              ))}
              {Array.from({ length: summary?.freeSlots ?? 0 }).map((_, i) => (
                <li
                  key={`slot-${i}`}
                  className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#d9def0] px-2 py-2 text-[#9aa3b8]"
                >
                  <Plus className="h-3 w-3" aria-hidden="true" />
                  <span className="text-[10px]">Free slot</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Link
          to={to}
          className="flex items-center justify-center gap-1 rounded-lg bg-[#f1f3ff] py-2 text-xs font-semibold text-[#4d5ce7] hover:bg-[#e6e9ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          View details <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only">for room {room.roomNumber}</span>
        </Link>
      </CardContent>
    </Card>
  )
}
