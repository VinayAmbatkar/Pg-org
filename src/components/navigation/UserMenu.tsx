import { LogOut } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCurrentOrganization } from '@/features/organizations/hooks/useCurrentOrganization'
import { getInitials } from '@/lib/formatters/date'
import { humanizeEnum } from '@/lib/formatters/enumLabels'
import { useAuth } from '@/infrastructure/auth/AuthProvider'

export function UserMenu() {
  const { user, logout } = useAuth()
  const organization = useCurrentOrganization()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    // Menu pattern: focus moves into the menu on open; Escape closes and returns focus.
    ref.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  const initials = user?.name ? getInitials(user.name) : '?'
  // A platform super admin has no membership role of their own - say so instead of "Owner".
  const roleLabel =
    user?.platformRole === 'SUPER_ADMIN' ? 'Super Admin' : organization?.yourRole ? humanizeEnum(organization.yourRole) : 'Member'

  return (
    <div className="relative" ref={ref}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Account menu: ${user?.name ?? 'you'}, ${roleLabel}`}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 rounded-lg px-1 py-1 text-left hover:bg-[#f5f7fb]"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#4775ed] text-xs font-semibold text-white">
          {initials}
        </span>
        <span className="hidden min-w-0 md:block">
          <span className="block truncate text-sm font-semibold text-[#182345]">{organization?.name ?? user?.name}</span>
          <span className="block text-[11px] text-muted-foreground">{roleLabel}</span>
        </span>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-40 mt-2 w-48 rounded-md border border-border bg-card p-1 shadow-lg">
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
