import { BedDouble, Pencil, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/formatters/currency'
import { cn } from '@/lib/utils/cn'
import type { Bed } from '@/types/api'
import { initialsOf } from '../lib/roomDisplay'

interface RoomBedLayoutProps {
  beds: Bed[]
  canAssign: boolean
  canManageBeds: boolean
  onAssign: (bed: Bed) => void
  onEdit: (bed: Bed) => void
  onAddBed: () => void
}

const GROUPS = [
  { key: 'LOWER', title: 'Lower berth' },
  { key: 'UPPER', title: 'Upper berth' },
  { key: 'NONE', title: 'Beds' },
] as const

const sortBeds = (beds: Bed[]) => [...beds].sort((a, b) => a.bedNumber.localeCompare(b.bedNumber, undefined, { numeric: true }))

export function BedLegend() {
  const items = [
    { label: 'Vacant', dot: 'bg-[#6d7cf0]' },
    { label: 'Occupied', dot: 'bg-[#e0435e]' },
    { label: 'Blocked', dot: 'bg-[#9aa3b8]' },
  ]
  return (
    <ul className="flex flex-wrap gap-4 text-xs text-[#4b5675]" aria-label="Legend">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span className={cn('h-2 w-2 rounded-full', item.dot)} aria-hidden="true" />
          {item.label}
        </li>
      ))}
    </ul>
  )
}

export function RoomBedLayout({ beds, canAssign, canManageBeds, onAssign, onEdit, onAddBed }: RoomBedLayoutProps) {
  const active = beds.filter((b) => b.status !== 'ARCHIVED')
  if (active.length === 0) {
    return (
      <EmptyState
        icon={BedDouble}
        title="No beds yet"
        description="Add beds to this room so tenants can be checked in."
        action={
          canManageBeds ? (
            <Button className="gap-2" onClick={onAddBed}>
              <Plus className="h-4 w-4" aria-hidden="true" /> Add bed
            </Button>
          ) : undefined
        }
      />
    )
  }

  // Bunk layouts are grouped by berth; a room with no berths set shows one "Beds" group.
  const hasBerths = active.some((b) => b.berth)
  const groups = hasBerths
    ? GROUPS.map((g) => ({ ...g, beds: sortBeds(active.filter((b) => (b.berth ?? 'NONE') === g.key)) })).filter(
        (g) => g.beds.length > 0,
      )
    : [{ key: 'NONE', title: 'Beds', beds: sortBeds(active) }]

  return (
    <div className={cn('grid gap-4', groups.length > 1 && 'lg:grid-cols-2')}>
      {groups.map((group) => {
        const occupied = group.beds.filter((b) => b.occupant).length
        const vacant = group.beds.filter((b) => !b.occupant && b.status === 'AVAILABLE').length
        return (
          <section
            key={group.key}
            aria-labelledby={`group-${group.key}`}
            className="rounded-xl border border-[#edf0f6] bg-white p-4 shadow-[0_4px_16px_rgba(32,52,95,0.04)]"
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <h3 id={`group-${group.key}`} className="text-sm font-bold text-[#182345]">
                  {group.title}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {occupied}/{group.beds.length} occupied · {vacant} vacant
                </p>
              </div>
              <BedDouble className="h-5 w-5 text-[#64708e]" aria-hidden="true" />
            </div>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {group.beds.map((bed) => (
                <li key={bed.id}>
                  <BedTile bed={bed} canAssign={canAssign} canManageBeds={canManageBeds} onAssign={onAssign} onEdit={onEdit} />
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

function BedTile({
  bed,
  canAssign,
  canManageBeds,
  onAssign,
  onEdit,
}: {
  bed: Bed
  canAssign: boolean
  canManageBeds: boolean
  onAssign: (bed: Bed) => void
  onEdit: (bed: Bed) => void
}) {
  const occupant = bed.occupant
  const blocked = !occupant && bed.status === 'INACTIVE'
  const state = occupant ? 'Occupied' : blocked ? 'Blocked' : 'Vacant'

  return (
    <div
      className={cn(
        'relative flex h-full min-h-[112px] flex-col items-center rounded-xl border px-2 pb-3 pt-2 text-center',
        occupant ? 'border-[#ffd6dc] bg-[#fff4f5]' : blocked ? 'border-[#e6e8ee] bg-[#f4f5f8]' : 'border-[#e3e7fb] bg-[#f5f7ff]',
      )}
    >
      <span className={cn('text-xs font-semibold', occupant ? 'text-[#c2334d]' : blocked ? 'text-[#8a93a8]' : 'text-[#4d5ce7]')}>
        {bed.bedNumber}
      </span>
      <span className="sr-only">
        Bed {bed.bedNumber}: {state}
        {occupant ? `, ${occupant.name}` : ''}
      </span>

      {canManageBeds && (
        <button
          type="button"
          onClick={() => onEdit(bed)}
          aria-label={`Edit bed ${bed.bedNumber}`}
          className="absolute right-1.5 top-1.5 rounded p-1 text-[#9aa3b8] hover:bg-white hover:text-[#182345] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <Pencil className="h-3 w-3" aria-hidden="true" />
        </button>
      )}

      <div className="flex flex-1 flex-col items-center justify-center gap-1">
        {occupant ? (
          <Link
            to={`/app/residencies/${occupant.residencyId}`}
            className="flex flex-col items-center gap-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={`${occupant.name}, open tenant`}
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-xs font-bold text-[#c2334d] shadow-sm"
              aria-hidden="true"
            >
              {initialsOf(occupant.name)}
            </span>
            <span className="max-w-full truncate text-xs font-semibold text-[#182345]" aria-hidden="true">
              {occupant.name}
            </span>
            {occupant.monthlyRent && (
              <span className="text-[11px] font-medium text-[#c2334d]" aria-hidden="true">
                {formatCurrency(occupant.monthlyRent, occupant.currency ?? 'INR').replace(/\.00$/, '')}
              </span>
            )}
          </Link>
        ) : blocked ? (
          <span className="text-[11px] text-[#8a93a8]">Blocked</span>
        ) : canAssign ? (
          <button
            type="button"
            onClick={() => onAssign(bed)}
            aria-label={`Assign a tenant to bed ${bed.bedNumber}`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d9def8] bg-white text-[#4d5ce7] hover:bg-[#eef0ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : (
          <span className="text-[11px] text-[#4d5ce7]">Vacant</span>
        )}
      </div>
    </div>
  )
}
