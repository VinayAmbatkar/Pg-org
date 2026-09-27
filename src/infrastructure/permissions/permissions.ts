import type { MembershipRole } from '@/types/api'

// Mirrors the role matrices verified directly against pg-backend service code
// (properties.service.ts / rooms.service.ts / beds.service.ts / residencies.service.ts /
// organizations.service.ts). STAFF can never create/update/archive/check-in — only view.
export type Permission =
  | 'dashboard.view'
  | 'organizations.view'
  | 'organizations.manage'
  | 'properties.view'
  | 'properties.manage'
  | 'properties.archive'
  | 'rooms.view'
  | 'rooms.manage'
  | 'rooms.archive'
  | 'beds.view'
  | 'beds.manage'
  | 'beds.archive'
  | 'tenants.view'
  | 'residency.view'
  | 'residency.manage'
  | 'notifications.view'
  | 'billing.view'
  | 'billing.manage'
  | 'payments.view'
  | 'payments.refund'
  | 'complaints.view'
  | 'complaints.manage'
  | 'complaints.work'
  | 'food.view'
  | 'food.manage'
  | 'applications.view'
  | 'applications.manage'
  | 'visits.view'
  | 'visits.manage'
  | 'listing.view'
  | 'listing.manage'

const VIEW_ROLES: MembershipRole[] = ['OWNER', 'MANAGER', 'STAFF']
const MANAGE_ROLES: MembershipRole[] = ['OWNER', 'MANAGER']
const OWNER_ONLY: MembershipRole[] = ['OWNER']
const ALWAYS: MembershipRole[] = ['OWNER', 'MANAGER', 'STAFF', 'STUDENT']

const PERMISSION_ROLES: Record<Permission, MembershipRole[]> = {
  'dashboard.view': ALWAYS,
  'organizations.view': ALWAYS,
  'organizations.manage': OWNER_ONLY,
  'properties.view': VIEW_ROLES,
  'properties.manage': MANAGE_ROLES,
  'properties.archive': OWNER_ONLY,
  'rooms.view': VIEW_ROLES,
  'rooms.manage': MANAGE_ROLES,
  'rooms.archive': OWNER_ONLY,
  'beds.view': VIEW_ROLES,
  'beds.manage': MANAGE_ROLES,
  'beds.archive': OWNER_ONLY,
  'tenants.view': VIEW_ROLES,
  'residency.view': VIEW_ROLES,
  'residency.manage': MANAGE_ROLES,
  'notifications.view': ALWAYS,
  'billing.view': VIEW_ROLES,
  'billing.manage': MANAGE_ROLES,
  'payments.view': VIEW_ROLES,
  'payments.refund': MANAGE_ROLES,
  'complaints.view': VIEW_ROLES,
  'complaints.manage': MANAGE_ROLES,
  // Start/resolve a complaint *assigned to you* (pg-backend lets STAFF do this for their own).
  'complaints.work': VIEW_ROLES,
  'food.view': VIEW_ROLES,
  'food.manage': MANAGE_ROLES,
  'applications.view': VIEW_ROLES,
  'applications.manage': MANAGE_ROLES,
  'visits.view': VIEW_ROLES,
  'visits.manage': MANAGE_ROLES,
  // PropertyListingsService: READ_ROLES may view, MANAGE_ROLES may edit/publish/unpublish.
  'listing.view': VIEW_ROLES,
  'listing.manage': MANAGE_ROLES,
}

/** The role the UI should authorize with. pg-backend returns every organization to a platform
 * SUPER_ADMIN but with `yourRole: null` (they are not a member), while its services let a
 * SUPER_ADMIN through every role check (e.g. `if (user.platformRole === 'SUPER_ADMIN') return`).
 * Mirroring that bypass here - as OWNER, the broadest role - keeps the UI from hiding pages the
 * backend would allow. A real membership role always wins. The backend still authorizes every call. */
export function effectiveRole(
  membershipRole: MembershipRole | null | undefined,
  platformRole: 'SUPER_ADMIN' | 'USER' | null | undefined,
): MembershipRole | null {
  if (membershipRole) return membershipRole
  return platformRole === 'SUPER_ADMIN' ? 'OWNER' : null
}

export function hasPermission(role: MembershipRole | null | undefined, permission: Permission): boolean {
  if (!role) return false
  return PERMISSION_ROLES[permission].includes(role)
}

export function hasAnyPermission(role: MembershipRole | null | undefined, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission))
}

export function hasAllPermissions(role: MembershipRole | null | undefined, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission))
}
