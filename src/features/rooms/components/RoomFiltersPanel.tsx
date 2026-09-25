import { AirVent, SlidersHorizontal } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { SearchInput } from '@/components/data-table/FilterBar'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { formatCurrency } from '@/lib/formatters/currency'
import { PROPERTY_STATUS_LABELS, ROOM_TYPE_LABELS } from '@/lib/formatters/enumLabels'
import type { RoomType } from '@/types/api'
import { countActiveFilters, floorLabel, ROOM_STATUSES, type AmenityFilter, type RoomFilters } from '../lib/roomFilters'
import { AMENITIES } from '../lib/amenities'

type Updates = Record<string, string | null>

interface RoomFiltersPanelProps {
  filters: RoomFilters
  /** Raw search text as it sits in the URL. */
  searchValue: string
  roomTypes: RoomType[]
  floors: Array<number | 'none'>
  typeCounts: Map<RoomType, number>
  priceBounds: { min: number; max: number } | null
  onChange: (updates: Updates, options?: { replace?: boolean }) => void
  onClear: () => void
}

const checkboxClass =
  'h-4 w-4 rounded border-[#cfd5e3] accent-[#6956e8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6956e8]'

const AMENITY_OPTIONS: Array<{ value: AmenityFilter; label: string; icon: typeof AirVent }> = [
  AMENITIES[0],
  { value: 'NON_AC', label: 'Non-AC', icon: AirVent },
  ...AMENITIES.slice(1),
]

function toggle<T extends string>(list: T[], value: T): string | null {
  const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
  return next.length > 0 ? next.join(',') : null
}

/** "Find Available Room". Filters apply immediately and live in the URL (shareable, survive
 * refresh, Back undoes them). */
export function RoomFiltersPanel({
  filters,
  searchValue,
  roomTypes,
  floors,
  typeCounts,
  priceBounds,
  onChange,
  onClear,
}: RoomFiltersPanelProps) {
  const active = countActiveFilters(filters)
  const availability = [filters.vacantOnly && 'vacant', filters.emptyOnly && 'empty'].filter(Boolean) as string[]
  const setAvailability = (value: 'vacant' | 'empty') => onChange({ avail: toggle(availability, value) })

  return (
    <aside
      aria-labelledby="room-filters-heading"
      className="h-fit space-y-5 rounded-xl border border-[#edf0f6] bg-white p-5 shadow-[0_4px_16px_rgba(32,52,95,0.04)] xl:sticky xl:top-4"
    >
      <div>
        <h2 id="room-filters-heading" className="flex items-center gap-2 text-sm font-bold text-[#182345]">
          <SlidersHorizontal className="h-4 w-4 text-[#6956e8]" aria-hidden="true" />
          Find Available Room
        </h2>
        <p className="mt-1 text-[11px] text-muted-foreground">Quickly filter rooms with vacant beds.</p>
      </div>

      <SearchInput
        label="Search by room number"
        placeholder="Search by room number…"
        value={searchValue}
        onChange={(value) => onChange({ room: value || null }, { replace: true })}
        debounceMs={150}
        className="max-w-none"
      />

      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#182345]">Filters{active > 0 ? ` (${active})` : ''}</span>
        {active > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="rounded text-xs font-semibold text-[#4d5ce7] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Clear all
          </button>
        )}
      </div>

      {roomTypes.length > 0 && (
        <fieldset className="space-y-2">
          <legend className="mb-2 text-xs font-semibold text-[#182345]">Room type</legend>
          {roomTypes.map((type) => (
            <label key={type} className="flex cursor-pointer items-center justify-between gap-2 text-xs text-[#4b5675]">
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className={checkboxClass}
                  checked={filters.types.includes(type)}
                  onChange={() => onChange({ roomType: toggle(filters.types, type) })}
                />
                {ROOM_TYPE_LABELS[type]} sharing
              </span>
              <span className="text-[11px] text-muted-foreground">{typeCounts.get(type) ?? 0}</span>
            </label>
          ))}
        </fieldset>
      )}

      <fieldset className="space-y-2">
        <legend className="mb-2 text-xs font-semibold text-[#182345]">Amenities</legend>
        {AMENITY_OPTIONS.map(({ value, label, icon: Icon }) => (
          <label key={value} className="flex cursor-pointer items-center gap-2 text-xs text-[#4b5675]">
            <input
              type="checkbox"
              className={checkboxClass}
              checked={filters.amenities.includes(value)}
              onChange={() => onChange({ amen: toggle(filters.amenities, value) })}
            />
            <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            {label}
          </label>
        ))}
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="room-floor" className="text-xs font-semibold text-[#182345]">
          Floor
        </Label>
        <Select
          id="room-floor"
          value={filters.floor === null ? '' : String(filters.floor)}
          onChange={(e) => onChange({ floor: e.target.value || null })}
        >
          <option value="">All floors</option>
          {floors.map((floor) => (
            <option key={String(floor)} value={String(floor)}>
              {floorLabel(floor)}
            </option>
          ))}
        </Select>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-xs font-semibold text-[#182345]">Availability</legend>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-[#4b5675]">
          <input
            type="checkbox"
            className={checkboxClass}
            checked={filters.vacantOnly}
            onChange={() => setAvailability('vacant')}
          />
          Show only rooms with vacant beds
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-[#4b5675]">
          <input
            type="checkbox"
            className={checkboxClass}
            checked={filters.emptyOnly}
            onChange={() => setAvailability('empty')}
          />
          Show empty rooms only
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-[#4b5675]">
          <input
            type="checkbox"
            className={checkboxClass}
            checked={filters.hasFreeSlots}
            onChange={(e) => onChange({ slots: e.target.checked ? '1' : null })}
          />
          Has room for more beds
        </label>
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="room-status" className="text-xs font-semibold text-[#182345]">
          Room status
        </Label>
        <Select id="room-status" value={filters.status ?? ''} onChange={(e) => onChange({ roomStatus: e.target.value || null })}>
          <option value="">All statuses</option>
          {ROOM_STATUSES.map((s) => (
            <option key={s} value={s}>
              {PROPERTY_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
      </div>

      <PriceRange bounds={priceBounds} min={filters.priceMin} max={filters.priceMax} onChange={onChange} />
    </aside>
  )
}

/** Dual-handle price slider over the property's actual price range. Commits to the URL after the
 * user stops dragging; handles at the extremes mean "no bound". */
function PriceRange({
  bounds,
  min,
  max,
  onChange,
}: {
  bounds: { min: number; max: number } | null
  min: number | null
  max: number | null
  onChange: (updates: Updates, options?: { replace?: boolean }) => void
}) {
  const lo = bounds?.min ?? 0
  const hi = bounds?.max ?? 0
  const [draft, setDraft] = useState<[number, number]>([min ?? lo, max ?? hi])
  const debounced = useDebouncedValue(draft, 250)
  // Only a handle the user actually moved may write to the URL. Without this, the initial [0, 0]
  // draft (before rooms load) could debounce in *after* the real bounds arrived and commit pmax=0,
  // hiding every room.
  const touched = useRef(false)

  useEffect(() => {
    setDraft([min ?? lo, max ?? hi])
  }, [min, max, lo, hi])

  useEffect(() => {
    if (!bounds || !touched.current) return
    const [a, b] = debounced
    const nextMin = a <= lo ? null : a
    const nextMax = b >= hi ? null : b
    if (nextMin !== min || nextMax !== max) {
      onChange(
        { pmin: nextMin === null ? null : String(nextMin), pmax: nextMax === null ? null : String(nextMax) },
        { replace: true },
      )
    }
    // Only react to the debounced draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  if (!bounds) {
    return (
      <div>
        <p className="text-xs font-semibold text-[#182345]">Price range (per bed)</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          No room has a price per bed yet. Add one from a room&apos;s Edit dialog.
        </p>
      </div>
    )
  }

  if (lo === hi) {
    return (
      <div>
        <p className="text-xs font-semibold text-[#182345]">Price range (per bed)</p>
        <p className="mt-1 text-[11px] text-muted-foreground">
          Every priced room is {formatCurrency(lo).replace(/\.00$/, '')} per bed, so there&apos;s nothing to narrow yet.
        </p>
      </div>
    )
  }

  const span = Math.max(1, hi - lo)
  const step = span > 1000 ? 500 : 100
  const pct = (v: number) => ((v - lo) / span) * 100

  return (
    <fieldset>
      <legend className="text-xs font-semibold text-[#182345]">Price range (per bed)</legend>
      <div className="relative mt-4 h-5">
        <div className="absolute top-1/2 h-1.5 w-full -translate-y-1/2 rounded-full bg-[#e6e9f2]" aria-hidden="true" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-[#6956e8]"
          style={{ left: `${pct(draft[0])}%`, right: `${100 - pct(draft[1])}%` }}
          aria-hidden="true"
        />
        {(['Minimum', 'Maximum'] as const).map((which, i) => (
          <input
            key={which}
            type="range"
            aria-label={`${which} price per bed`}
            aria-valuetext={formatCurrency(draft[i])}
            min={lo}
            max={hi}
            step={step}
            value={draft[i]}
            onChange={(e) => {
              touched.current = true
              const value = Number(e.target.value)
              setDraft((d) => (i === 0 ? [Math.min(value, d[1]), d[1]] : [d[0], Math.max(value, d[0])]))
            }}
            className="range-thumb pointer-events-none absolute inset-0 h-5 w-full appearance-none bg-transparent"
          />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-muted-foreground">
        <span>{formatCurrency(draft[0]).replace(/\.00$/, '')}</span>
        <span>{formatCurrency(draft[1]).replace(/\.00$/, '')}</span>
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">Rooms without a price are hidden while a range is set.</p>
    </fieldset>
  )
}
