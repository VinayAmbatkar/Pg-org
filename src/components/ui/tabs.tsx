import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '@/lib/utils/cn'

export interface TabItem {
  value: string
  label: string
}

interface TabsProps {
  items: TabItem[]
  value: string
  onChange: (value: string) => void
  className?: string
  /** Accessible name for the tab list, e.g. "Property sections". */
  label?: string
  /** Pass the same idBase to TabPanel so tabs and panels are linked via aria-controls/labelledby. */
  idBase?: string
}

const tabId = (base: string, value: string) => `${base}-tab-${value}`
const panelId = (base: string, value: string) => `${base}-panel-${value}`

/** WAI-ARIA tabs with roving tabindex: Tab enters/leaves the list, ←/→/Home/End move between
 * tabs (activating them, since panels are cheap to switch and lazily fetch their own data). */
export function Tabs({ items, value, onChange, className, label, idBase }: TabsProps) {
  const generatedId = useId()
  const base = idBase ?? generatedId
  const listRef = useRef<HTMLDivElement>(null)

  function focusTab(index: number) {
    const item = items[(index + items.length) % items.length]
    onChange(item.value)
    listRef.current?.querySelector<HTMLButtonElement>(`#${CSS.escape(tabId(base, item.value))}`)?.focus()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const keyActions: Record<string, () => void> = {
      ArrowRight: () => focusTab(index + 1),
      ArrowLeft: () => focusTab(index - 1),
      Home: () => focusTab(0),
      End: () => focusTab(items.length - 1),
    }
    const action = keyActions[event.key]
    if (action) {
      event.preventDefault()
      action()
    }
  }

  return (
    <div className="-mx-1 max-w-full overflow-x-auto px-1 pb-1">
      <div
        ref={listRef}
        role="tablist"
        aria-label={label}
        aria-orientation="horizontal"
        className={cn('inline-flex items-center gap-1 rounded-lg bg-muted p-1', className)}
      >
        {items.map((item, index) => {
          const selected = item.value === value
          return (
            <button
              key={item.value}
              id={tabId(base, item.value)}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={idBase ? panelId(base, item.value) : undefined}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(item.value)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                'whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                selected ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function TabPanel({ idBase, value, children }: { idBase: string; value: string; children: ReactNode }) {
  return (
    <div role="tabpanel" id={panelId(idBase, value)} aria-labelledby={tabId(idBase, value)} tabIndex={0} className="focus-visible:outline-none">
      {children}
    </div>
  )
}
