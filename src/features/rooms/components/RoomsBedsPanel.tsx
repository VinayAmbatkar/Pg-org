import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BedDouble, ChevronRight, LayoutGrid, List, Plus, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { DataTable, type DataTableColumn } from '@/components/data-table/DataTable'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { QueryState } from '@/components/feedback/QueryState'
import { useToast } from '@/components/feedback/ToastProvider'
import { useUrlParams } from '@/hooks/useUrlState'
import { ApiError } from '@/infrastructure/api/errors'
import { ROOM_TYPE_LABELS } from '@/lib/formatters/enumLabels'
import { cn } from '@/lib/utils/cn'
import type { Room, RoomType } from '@/types/api'
import { useBedsForRooms } from '@/features/beds/hooks/useBedsForRooms'
import { useRooms } from '../hooks/useRooms'
import { useCreateRoom } from '../hooks/useRoomMutations'
import {
  countActiveFilters,
  filterRooms,
  floorShort,
  floorsOf,
  priceBoundsOf,
  parseRoomFilters,
  ROOM_TYPES,
  summarizeRoomBeds,
  type RoomBedSummary,
} from '../lib/roomFilters'
import { toCreateRoomPayload, type RoomFormValues } from '../schemas/room.schema'
import { RoomCard, RoomPhoto } from './RoomCard'
import { roomPrice, roomTypeLine } from '../lib/roomDisplay'
import { RoomFiltersPanel } from './RoomFiltersPanel'
import { RoomForm } from './RoomForm'
import { RoomStatusBadge } from './RoomStatusBadge'

interface RoomsBedsPanelProps {
  propertyId: string
  canManage: boolean
  canArchive: boolean
}

const FILTER_KEYS = {
  room: null,
  roomType: null,
  floor: null,
  roomStatus: null,
  slots: null,
  amen: null,
  avail: null,
  pmin: null,
  pmax: null,
}

export function RoomsBedsPanel({ propertyId, canManage }: RoomsBedsPanelProps) {
  const { toast } = useToast()
  const navigate = useNavigate()
  const { get, set } = useUrlParams()
  const filters = useMemo(() => parseRoomFilters(get), [get])
  const view = get('view') === 'list' ? 'list' : 'grid'
  const hasActiveFilters = countActiveFilters(filters) > 0
  const clearFilters = () => set(FILTER_KEYS)

  const { data: rooms, isLoading, error, refetch } = useRooms(propertyId)
  // Filtering uses each room's server-computed occupancy; per-room bed lists (one request each)
  // are only needed for the grid's bed chips, and only for the rooms actually shown.
  const visibleRooms = useMemo(() => filterRooms(rooms ?? [], filters), [rooms, filters])
  const beds = useBedsForRooms(propertyId, view === 'grid' ? visibleRooms : undefined)
  const priceBounds = useMemo(() => priceBoundsOf(rooms ?? []), [rooms])
  const createRoom = useCreateRoom(propertyId)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  // Below xl the filter panel is collapsed behind a button so it doesn't push the rooms off-screen.
  const [filtersOpen, setFiltersOpen] = useState(false)
  const activeCount = countActiveFilters(filters)

  const summaries = useMemo(() => {
    const map = new Map<string, RoomBedSummary>()
    for (const room of rooms ?? []) map.set(room.id, summarizeRoomBeds(room, beds.beds))
    return map
  }, [rooms, beds.beds])
  // Only offer room types / floors that exist in this property.
  const typeCounts = useMemo(() => {
    const counts = new Map<RoomType, number>()
    for (const room of rooms ?? []) counts.set(room.roomType, (counts.get(room.roomType) ?? 0) + 1)
    return counts
  }, [rooms])
  const presentTypes = ROOM_TYPES.filter((t) => typeCounts.has(t))
  const floors = useMemo(() => floorsOf(rooms ?? []), [rooms])
  const roomPath = (room: Room) => `/app/properties/${propertyId}/rooms/${room.id}`

  async function handleCreate(values: RoomFormValues) {
    setFormError(null)
    try {
      await createRoom.mutateAsync(toCreateRoomPayload(values))
      toast({ title: 'Room created', variant: 'success' })
      setIsAddOpen(false)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Unable to create room.')
    }
  }
  const closeAdd = () => {
    setIsAddOpen(false)
    setFormError(null)
  }

  const listColumns: DataTableColumn<Room>[] = [
    {
      key: 'room',
      header: 'Room',
      render: (r) => (
        <span className="flex items-center gap-3">
          <span className="h-9 w-9 shrink-0 overflow-hidden rounded-md">
            <RoomPhoto room={r} iconClassName="h-4 w-4" />
          </span>
          <span className="whitespace-nowrap font-semibold text-[#182345]">Room {r.roomNumber}</span>
        </span>
      ),
    },
    { key: 'type', header: 'Type', render: (r) => <span className="whitespace-nowrap text-muted-foreground">{roomTypeLine(r)}</span> },
    { key: 'floor', header: 'Floor', render: (r) => floorShort(r.floor) },
    { key: 'beds', header: 'Beds', render: (r) => r.occupancy.totalBeds },
    {
      key: 'occupied',
      header: 'Occupied',
      render: (r) => (
        <CountPill value={r.occupancy.occupiedBeds} tone={r.occupancy.occupiedBeds > 0 ? 'red' : 'grey'} label="occupied" />
      ),
    },
    {
      key: 'available',
      header: 'Available',
      render: (r) => (
        <CountPill value={r.occupancy.vacantBeds} tone={r.occupancy.vacantBeds > 0 ? 'green' : 'red'} label="available" />
      ),
    },
    { key: 'price', header: 'Price/bed', render: (r) => <span className="whitespace-nowrap">{roomPrice(r) ?? '—'}</span> },
    { key: 'status', header: 'Status', render: (r) => <RoomStatusBadge status={r.status} /> },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (r) => (
        <Link
          to={roomPath(r)}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#f1f3ff] text-[#4d5ce7] hover:bg-[#e6e9ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label={`Open room ${r.roomNumber}`}
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ),
    },
  ]

  const emptyState = hasActiveFilters ? (
    <EmptyState
      icon={BedDouble}
      title="No rooms match these filters"
      action={
        <Button variant="outline" size="sm" onClick={clearFilters}>
          Clear filters
        </Button>
      }
    />
  ) : (
    <EmptyState
      icon={BedDouble}
      title="No rooms yet"
      description="Add your first room to start allocating beds."
      action={
        canManage ? (
          <Button className="gap-2" onClick={() => setIsAddOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Add Room
          </Button>
        ) : undefined
      }
    />
  )

  return (
    <div className="space-y-4">
      {/* Grid areas: stacked (toolbar → filters → rooms) below xl; rooms + sticky filter column at xl. */}
      <div className="grid gap-4 [grid-template-areas:'toolbar'_'filters'_'rooms'] xl:grid-cols-[minmax(0,1fr)_280px] xl:grid-rows-[auto_1fr] xl:[grid-template-areas:'toolbar_filters'_'rooms_filters']">
        <div className="[grid-area:toolbar]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              role="group"
              aria-label="Filter by room type"
              className="flex flex-wrap gap-1 rounded-xl bg-white p-1 shadow-[0_2px_8px_rgba(32,52,95,0.05)]"
            >
              <TypeTab
                label="All"
                count={rooms?.length ?? 0}
                active={filters.types.length === 0}
                onClick={() => set({ roomType: null })}
              />
              {presentTypes.map((type) => (
                <TypeTab
                  key={type}
                  label={ROOM_TYPE_LABELS[type]}
                  count={typeCounts.get(type) ?? 0}
                  active={filters.types.length === 1 && filters.types[0] === type}
                  onClick={() => set({ roomType: type })}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 xl:hidden"
                aria-expanded={filtersOpen}
                aria-controls="room-filters"
                onClick={() => setFiltersOpen((open) => !open)}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                Filters{activeCount > 0 ? ` (${activeCount})` : ''}
              </Button>
              <div role="group" aria-label="View" className="flex rounded-lg border border-[#e8edf5] bg-white p-0.5">
                <ViewButton icon={LayoutGrid} label="Grid" active={view === 'grid'} onClick={() => set({ view: null })} />
                <ViewButton icon={List} label="List" active={view === 'list'} onClick={() => set({ view: 'list' })} />
              </div>
              {canManage && (
                <Button className="gap-2" onClick={() => setIsAddOpen(true)}>
                  <Plus className="h-4 w-4" aria-hidden="true" /> Add Room
                </Button>
              )}
            </div>
          </div>
        </div>

        <div id="room-filters" className={cn('[grid-area:filters] xl:block', filtersOpen ? 'block' : 'hidden')}>
          <RoomFiltersPanel
            filters={filters}
            searchValue={get('room')}
            roomTypes={presentTypes}
            floors={floors}
            typeCounts={typeCounts}
            priceBounds={priceBounds}
            onChange={set}
            onClear={clearFilters}
          />
        </div>

        <div className="min-w-0 space-y-4 [grid-area:rooms]">
          {beds.error && !error && (
            <ErrorState compact title="Some bed layouts couldn't load" error={beds.error} onRetry={() => void beds.refetch()} />
          )}
          {!isLoading && !error && rooms && rooms.length > 0 && (
            <p className="text-xs text-muted-foreground" aria-live="polite">
              Showing {visibleRooms.length} of {rooms.length} room{rooms.length === 1 ? '' : 's'}
            </p>
          )}

          {view === 'list' ? (
            <DataTable
              caption="Rooms"
              columns={listColumns}
              data={visibleRooms}
              rowKey={(r) => r.id}
              isLoading={isLoading}
              error={error}
              onRetry={() => void refetch()}
              onRowClick={(r) => navigate(roomPath(r))}
              emptyState={emptyState}
            />
          ) : (
            <QueryState
              isLoading={isLoading}
              error={error}
              onRetry={() => void refetch()}
              isEmpty={visibleRooms.length === 0}
              empty={emptyState}
            >
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3" aria-label="Rooms">
                {visibleRooms.map((room) => (
                  <li key={room.id}>
                    <RoomCard room={room} summary={summaries.get(room.id)} bedsLoading={beds.isLoading} to={roomPath(room)} />
                  </li>
                ))}
              </ul>
            </QueryState>
          )}
        </div>
      </div>

      <Dialog open={isAddOpen} onClose={closeAdd} preventClose={createRoom.isPending} title="Add room">
        <RoomForm submitLabel="Create room" formError={formError} onCancel={closeAdd} onSubmit={handleCreate} />
      </Dialog>
    </div>
  )
}

function TypeTab({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6956e8]',
        active ? 'bg-[#eef0ff] text-[#4d5ce7]' : 'text-[#64708e] hover:bg-[#f5f7fb]',
      )}
    >
      {label}
      <span className={cn('rounded-full px-1.5 text-[10px]', active ? 'bg-white text-[#4d5ce7]' : 'bg-[#f1f3f8] text-[#8a93a8]')}>
        {count}
      </span>
    </button>
  )
}

function ViewButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof LayoutGrid
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6956e8]',
        active ? 'bg-[#6956e8] text-white' : 'text-[#64708e] hover:bg-[#f5f7fb]',
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </button>
  )
}

function CountPill({ value, tone, label }: { value: number; tone: 'red' | 'green' | 'grey'; label: string }) {
  const tones = { red: 'bg-[#fff0f1] text-[#c2334d]', green: 'bg-[#e5fbf3] text-[#0f8a61]', grey: 'bg-[#f3f4f7] text-[#8a93a8]' }
  return (
    <span className={cn('inline-flex min-w-9 justify-center rounded-md px-2 py-1 text-xs font-bold', tones[tone])}>
      {value}
      <span className="sr-only"> {label}</span>
    </span>
  )
}
