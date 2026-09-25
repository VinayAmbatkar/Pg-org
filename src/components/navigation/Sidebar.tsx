import { Building2 } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useUiStore } from '@/app/providers/uiStore'
import { useCurrentOrganization } from '@/features/organizations/hooks/useCurrentOrganization'
import { hasPermission } from '@/infrastructure/permissions/permissions'
import { cn } from '@/lib/utils/cn'
import { NAV_ITEMS } from './navItems'

export function Sidebar() {
  const organization = useCurrentOrganization()
  const role = organization?.yourRole
  const { pathname } = useLocation()
  const collapsed = useUiStore((s) => s.sidebarCollapsed)

  // Below the lg breakpoint the sidebar is always icon-only (tablet widths); on desktop the user
  // can collapse it from the header toggle. Labels stay in the DOM as sr-only so screen readers
  // and tooltips still get the item name.
  const labelClass = collapsed ? 'sr-only' : 'sr-only lg:not-sr-only'

  return (
    <nav
      aria-label="Primary"
      className={cn(
        'sticky top-0 flex h-screen shrink-0 flex-col overflow-y-auto border-r border-[#e8edf5] bg-white px-3 py-5 transition-[width]',
        collapsed ? 'w-[68px]' : 'w-[68px] lg:w-[240px] lg:px-4',
      )}
    >
      <div className="mb-8 flex items-center gap-2.5 px-1">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#6956e8] text-white shadow-[0_5px_14px_rgba(105,86,232,0.28)]">
          <Building2 className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className={labelClass}>
          <p className="text-[17px] font-bold tracking-[-0.03em] text-[#182345]">PGMet</p>
          <p className="text-[9px] font-medium text-muted-foreground">Manage Smarter. Grow Faster.</p>
        </div>
      </div>

      <ul className="space-y-1">
        {NAV_ITEMS.filter((item) => hasPermission(role, item.permission)).map(({ to, label, icon: Icon, match }) => {
          const isActive = match(pathname)
          return (
            <li key={to}>
              <Link
                to={to}
                title={label}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6956e8]',
                  isActive ? 'bg-[#eef0ff] text-[#4d5ce7]' : 'text-[#64708e] hover:bg-[#f5f7fb] hover:text-foreground',
                )}
              >
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#6956e8]"
                    aria-hidden="true"
                  />
                )}
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className={labelClass}>{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
