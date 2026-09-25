import { Search, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { cn } from '@/lib/utils/cn'

interface FilterBarProps {
  children: ReactNode
  /** Shows "Clear filters" when any filter is active. */
  hasActiveFilters?: boolean
  onClear?: () => void
  className?: string
}

/** Standard filter row above a DataTable: wraps on narrow screens, one Clear action. */
export function FilterBar({ children, hasActiveFilters, onClear, className }: FilterBarProps) {
  return (
    <div role="search" className={cn('flex flex-wrap items-center gap-3', className)}>
      {children}
      {hasActiveFilters && onClear && (
        <Button variant="ghost" size="sm" onClick={onClear} className="gap-1">
          <X className="h-3.5 w-3.5" aria-hidden="true" /> Clear filters
        </Button>
      )}
    </div>
  )
}

interface SearchInputProps {
  /** The committed value (normally from the URL). */
  value: string
  onChange: (value: string) => void
  label: string
  placeholder?: string
  debounceMs?: number
  className?: string
}

/** Text search that keeps typing local and commits after a pause — so server-side searches fire
 * once per pause, not per keystroke, and URL history isn't flooded. Re-syncs when the committed
 * value changes externally (Back/Forward, Clear filters). */
export function SearchInput({ value, onChange, label, placeholder, debounceMs = 300, className }: SearchInputProps) {
  const [draft, setDraft] = useState(value)
  const debounced = useDebouncedValue(draft, debounceMs)

  useEffect(() => {
    setDraft(value)
  }, [value])

  useEffect(() => {
    if (debounced !== value) onChange(debounced)
    // Only react to the debounced draft; `value`/`onChange` changing must not re-commit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  return (
    <div className={cn('relative w-full max-w-xs', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <Input
        type="search"
        aria-label={label}
        placeholder={placeholder}
        className="pl-9"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
    </div>
  )
}
