import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react'
import { useUiStore } from '@/app/providers/uiStore'
import { PropertySwitcher } from '@/components/navigation/PropertySwitcher'
import { NAV_ITEMS } from '@/components/navigation/navItems'
import { Sidebar } from '@/components/navigation/Sidebar'
import { UserMenu } from '@/components/navigation/UserMenu'
import { NotificationBell } from '@/features/notifications/components/NotificationBell'
import { CommandPalette } from '@/features/search/components/CommandPalette'

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

export function AppShellLayout() {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const collapsed = useUiStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUiStore((s) => s.toggleSidebar)
  const { pathname } = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const isFirstRender = useRef(true)

  // Route-change a11y: name the page in the tab title, and move focus to <main> so screen-reader
  // and keyboard users land on the new content instead of staying on the link they activated.
  // Only on path changes — filter/page (?query) changes keep focus where it is.
  useEffect(() => {
    const section = NAV_ITEMS.find((item) => item.match(pathname))?.label
    document.title = section ? `${section} · PGMet` : pathname.startsWith('/app/notifications') ? 'Notifications · PGMet' : 'PGMet'
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    mainRef.current?.focus({ preventScroll: true })
    mainRef.current?.scrollTo?.({ top: 0 })
  }, [pathname])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setPaletteOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="flex min-h-screen bg-[#f7f9fc]">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-white px-4 py-2 text-sm font-medium shadow focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[72px] shrink-0 items-center gap-3 border-b border-[#e8edf5] bg-white px-4 md:gap-4 md:px-8">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-pressed={collapsed}
            className="hidden rounded-md p-2 text-[#64708e] hover:bg-[#f5f7fb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6956e8] lg:inline-flex"
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" aria-hidden="true" /> : <PanelLeftClose className="h-4 w-4" aria-hidden="true" />}
          </button>
          <PropertySwitcher />
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            aria-keyshortcuts={isMac ? 'Meta+K' : 'Control+K'}
            className="mx-auto flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#e8edf5] bg-[#fbfcff] text-xs text-muted-foreground hover:border-[#d9def0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6956e8] lg:w-full lg:min-w-0 lg:max-w-xl lg:shrink lg:justify-start lg:px-4"
          >
            <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="sr-only lg:not-sr-only lg:flex-1 lg:truncate lg:text-left">Search pages, properties, invoices…</span>
            <kbd className="hidden rounded border border-[#e8edf5] bg-white px-1.5 py-0.5 text-[10px] font-medium text-[#64708e] lg:inline">
              {isMac ? '⌘ K' : 'Ctrl K'}
            </kbd>
          </button>
          <div className="ml-auto flex shrink-0 items-center gap-2 md:gap-4">
            <NotificationBell />
            <UserMenu />
          </div>
        </header>
        <main ref={mainRef} id="main-content" tabIndex={-1} className="flex-1 overflow-y-auto px-4 py-6 focus:outline-none md:px-8 md:py-7">
          <Outlet />
        </main>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  )
}
