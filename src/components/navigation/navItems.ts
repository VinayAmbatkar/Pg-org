import {
  BedDouble,
  Building2,
  CalendarClock,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  Settings,
  UserPlus,
  UtensilsCrossed,
  Users,
  WalletCards,
} from 'lucide-react'
import { APP_PATHS } from '@/app/router/paths'
import type { Permission } from '@/infrastructure/permissions/permissions'

// Sidebar / command-palette / page-title source of truth. Each `to` comes from APP_PATHS and each
// `permission` must equal the permission its route group is guarded with in routes.tsx
// (routes.test.tsx enforces that every target resolves to a real route).
export interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  /** Must be the same permission the matching route group is guarded with in routes.tsx. */
  permission: Permission
  match: (pathname: string) => boolean
}

const ROOM_DETAIL = /^\/app\/properties\/[^/]+\/rooms\//
const RESIDENCY = /^\/app\/(residencies\/|properties\/[^/]+\/residencies\/)/

const startsWithSegment = (base: string) => (pathname: string) => pathname === base || pathname.startsWith(`${base}/`)

export const NAV_ITEMS: NavItem[] = [
  {
    to: APP_PATHS.dashboard,
    label: 'Dashboard',
    icon: LayoutDashboard,
    permission: 'dashboard.view',
    match: startsWithSegment(APP_PATHS.dashboard),
  },
  {
    to: APP_PATHS.properties,
    label: 'Properties',
    icon: Building2,
    permission: 'properties.view',
    match: (p) => startsWithSegment(APP_PATHS.properties)(p) && !ROOM_DETAIL.test(p) && !RESIDENCY.test(p),
  },
  {
    to: APP_PATHS.rooms,
    label: 'Rooms & Beds',
    icon: BedDouble,
    permission: 'rooms.view',
    match: (p) => startsWithSegment(APP_PATHS.rooms)(p) || ROOM_DETAIL.test(p),
  },
  {
    to: APP_PATHS.tenants,
    label: 'Tenants',
    icon: Users,
    permission: 'tenants.view',
    match: (p) => startsWithSegment(APP_PATHS.tenants)(p) || RESIDENCY.test(p),
  },
  {
    to: APP_PATHS.billing,
    label: 'Billing',
    icon: WalletCards,
    permission: 'billing.view',
    match: startsWithSegment(APP_PATHS.billing),
  },
  {
    to: APP_PATHS.payments,
    label: 'Payments',
    icon: CreditCard,
    permission: 'payments.view',
    match: startsWithSegment(APP_PATHS.payments),
  },
  {
    to: APP_PATHS.complaints,
    label: 'Complaints',
    icon: ClipboardList,
    permission: 'complaints.view',
    match: startsWithSegment(APP_PATHS.complaints),
  },
  {
    to: APP_PATHS.food,
    label: 'Food',
    icon: UtensilsCrossed,
    permission: 'food.view',
    match: startsWithSegment(APP_PATHS.food),
  },
  {
    to: APP_PATHS.applications,
    label: 'Applications',
    icon: UserPlus,
    permission: 'applications.view',
    match: startsWithSegment(APP_PATHS.applications),
  },
  {
    to: APP_PATHS.visits,
    label: 'Visits',
    icon: CalendarClock,
    permission: 'visits.view',
    match: startsWithSegment(APP_PATHS.visits),
  },
  {
    to: APP_PATHS.settings,
    label: 'Settings',
    icon: Settings,
    permission: 'organizations.view',
    match: startsWithSegment(APP_PATHS.settings),
  },
]
