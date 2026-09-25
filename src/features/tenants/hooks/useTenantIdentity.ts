import { useApplicationsForProperty } from '@/features/applications/hooks/useApplications'
import type { Tenant } from '@/types/api'

export interface TenantIdentity {
  fullName: string
  phone: string
  email: string | null
  applicationId: string
}

/** pg-backend exposes no tenant name/phone to owners (TenantResponseDto is {id, userId, createdAt}
 * and there is no users endpoint). The one real link is the tenant's approved application:
 * `Tenant.userId === Application.applicantUserId` for anyone onboarded through an application.
 * Returns null — never a guess — when there is no such application (e.g. a tenant added directly),
 * so callers must keep a non-identifying fallback. Only APPROVED applications are considered
 * (max page size 100); see docs/backend-gaps.md. */
export function useTenantIdentity(propertyId: string | undefined, tenant: Tenant | undefined) {
  const approved = useApplicationsForProperty(tenant?.userId ? propertyId : undefined, { status: 'APPROVED', limit: 100 })
  const match = tenant ? approved.data?.items.find((a) => a.applicantUserId === tenant.userId) : undefined

  const identity: TenantIdentity | null = match
    ? { fullName: match.fullName, phone: match.phone, email: match.email, applicationId: match.id }
    : null

  return { identity, isLoading: approved.isLoading }
}
