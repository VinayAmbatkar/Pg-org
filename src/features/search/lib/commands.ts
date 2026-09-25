import type { LucideIcon } from 'lucide-react'
import { Building2, Plus, Receipt, UserPlus, Utensils } from 'lucide-react'
import { APP_PATHS } from '@/app/router/paths'
import { NAV_ITEMS } from '@/components/navigation/navItems'
import { hasPermission, type Permission } from '@/infrastructure/permissions/permissions'
import type { MembershipRole } from '@/types/api'

export interface SearchResult {
  id: string
  group: string
  title: string
  subtitle?: string
  to: string
  icon?: LucideIcon
}

interface ActionCommand {
  title: string
  to: (ctx: { propertyId?: string }) => string | null
  permission: Permission
  icon: LucideIcon
  keywords: string
}

const ACTIONS: ActionCommand[] = [
  { title: 'Add property', to: () => `${APP_PATHS.properties}/new`, permission: 'properties.manage', icon: Building2, keywords: 'new create' },
  {
    title: 'Add tenant',
    to: ({ propertyId }) => (propertyId ? `${APP_PATHS.properties}/${propertyId}/residencies/new` : null),
    permission: 'residency.manage',
    icon: UserPlus,
    keywords: 'new create residency onboard',
  },
  { title: 'Add room', to: () => APP_PATHS.rooms, permission: 'rooms.manage', icon: Plus, keywords: 'new create bed' },
  { title: "Today's menu", to: () => `${APP_PATHS.food}/menu`, permission: 'food.view', icon: Utensils, keywords: 'food meal' },
  {
    title: 'Overdue invoices',
    to: () => `${APP_PATHS.billing}/invoices?status=OVERDUE`,
    permission: 'billing.view',
    icon: Receipt,
    keywords: 'rent unpaid late',
  },
]

export function matches(query: string, ...fields: Array<string | null | undefined>) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return fields.some((f) => f?.toLowerCase().includes(q))
}

/** Pages and actions, filtered by the same permissions as the sidebar/routes. */
export function navigationResults(query: string, role: MembershipRole | null | undefined, propertyId?: string): SearchResult[] {
  const pages = NAV_ITEMS.filter((item) => hasPermission(role, item.permission) && matches(query, item.label)).map((item) => ({
    id: `nav-${item.to}`,
    group: 'Go to',
    title: item.label,
    to: item.to,
    icon: item.icon,
  }))
  const actions = ACTIONS.filter((a) => hasPermission(role, a.permission) && matches(query, a.title, a.keywords)).flatMap((a) => {
    const to = a.to({ propertyId })
    return to ? [{ id: `action-${a.title}`, group: 'Actions', title: a.title, to, icon: a.icon }] : []
  })
  return [...pages, ...actions]
}
