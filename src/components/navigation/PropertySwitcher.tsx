import { Building2 } from 'lucide-react'
import { useUiStore } from '@/app/providers/uiStore'
import { Select } from '@/components/ui/select'
import { useCurrentProperty } from '@/features/properties/hooks/useCurrentProperty'

export function PropertySwitcher() {
  const { property, properties, isLoading } = useCurrentProperty()
  const setCurrentPropertyId = useUiStore((s) => s.setCurrentPropertyId)

  if (isLoading || properties.length === 0) return null

  function formatLabel(id: string) {
    const p = properties.find((item) => item.id === id)
    if (!p) return ''
    return `${p.name}, ${p.city}, ${p.state}`
  }

  return (
    // shrink-0: the Select's own width is clamped; letting this container shrink made the select
    // spill over the header search bar at 1024px. The search bar absorbs the squeeze instead.
    <div className="flex shrink-0 items-center gap-2">
      <Building2 className="h-4 w-4 shrink-0 text-[#64708e]" aria-hidden="true" />
      <Select
        aria-label="Switch property"
        className="h-9 w-[clamp(140px,20vw,320px)] border-0 bg-transparent px-0 pr-8 text-sm font-medium text-[#182345] shadow-none focus-visible:ring-0"
        value={property?.id ?? ''}
        onChange={(e) => setCurrentPropertyId(e.target.value)}
      >
        {properties.map((p) => (
          <option key={p.id} value={p.id}>
            {formatLabel(p.id)}
          </option>
        ))}
      </Select>
    </div>
  )
}
