import { CornerDownLeft, Loader2, Search } from 'lucide-react'
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils/cn'
import { useCommandSearch } from '../hooks/useCommandSearch'

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  if (!open) return null
  return createPortal(<PaletteContent onClose={onClose} />, document.body)
}

function PaletteContent({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listboxId = useId()
  const optionId = (i: number) => `${listboxId}-option-${i}`
  const { results, isSearching, propertyName, minQuery } = useCommandSearch(query, true)

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    inputRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus?.()
    }
  }, [])

  // Keep the highlighted option in range as results change, and scrolled into view.
  const safeIndex = results.length === 0 ? -1 : Math.min(activeIndex, results.length - 1)
  useEffect(() => {
    if (safeIndex < 0) return
    document.getElementById(optionId(safeIndex))?.scrollIntoView?.({ block: 'nearest' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeIndex])

  function open(index: number) {
    const result = results[index]
    if (!result) return
    onClose()
    navigate(result.to)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((i) => (results.length === 0 ? 0 : (Math.max(i, -1) + 1) % results.length))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((i) => (results.length === 0 ? 0 : (i - 1 + results.length) % results.length))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      open(safeIndex)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      onClose()
    } else if (event.key === 'Tab') {
      // The input is the palette's only tab stop; results are reached with the arrow keys.
      event.preventDefault()
    }
  }

  let lastGroup = ''

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]">
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search PGMet"
        className="relative z-10 w-full max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded="true"
            aria-controls={listboxId}
            aria-activedescendant={safeIndex >= 0 ? optionId(safeIndex) : undefined}
            aria-autocomplete="list"
            aria-label="Search pages, properties, rooms, invoices, applications and complaints"
            placeholder="Search PGMet…"
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActiveIndex(0)
            }}
            onKeyDown={handleKeyDown}
          />
          {isSearching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-label="Searching" />}
        </div>

        <ul id={listboxId} role="listbox" aria-label="Results" className="max-h-[50vh] overflow-y-auto p-2">
          {results.map((result, index) => {
            const showGroup = result.group !== lastGroup
            lastGroup = result.group
            const Icon = result.icon
            return (
              <li key={result.id} role="none">
                {showGroup && (
                  <p role="presentation" className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {result.group}
                  </p>
                )}
                <div
                  id={optionId(index)}
                  role="option"
                  aria-selected={index === safeIndex}
                  onMouseMove={() => setActiveIndex(index)}
                  onClick={() => open(index)}
                  className={cn(
                    'flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm',
                    index === safeIndex ? 'bg-accent text-accent-foreground' : 'text-foreground',
                  )}
                >
                  {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{result.title}</span>
                    {result.subtitle && <span className="block truncate text-xs text-muted-foreground">{result.subtitle}</span>}
                  </span>
                  {index === safeIndex && <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />}
                </div>
              </li>
            )
          })}
          {results.length === 0 && !isSearching && (
            <li role="none" className="px-3 py-8 text-center text-sm text-muted-foreground">
              {query.trim().length < minQuery ? 'Type to search.' : `No results for “${query.trim()}”.`}
            </li>
          )}
        </ul>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
          <span>
            <kbd className="rounded border border-border px-1">↑</kbd> <kbd className="rounded border border-border px-1">↓</kbd> move ·{' '}
            <kbd className="rounded border border-border px-1">Enter</kbd> open · <kbd className="rounded border border-border px-1">Esc</kbd> close
          </span>
          {propertyName && <span>Rooms, invoices &amp; applications: {propertyName}</span>}
        </div>
      </div>
    </div>
  )
}
