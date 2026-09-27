import { apiClient } from '@/infrastructure/api/client'
import type { Tenant } from '@/types/api'

/** GET /tenants/lookup - OWNER/MANAGER only; returns just enough to confirm the right person. */
export interface TenantLookup {
  tenantId: string
  code: string
  name: string
}

export const tenantsApi = {
  /** Creates a tenant profile for the CALLER only — there is no backend endpoint for an
   * Owner/Manager to create a tenant profile on behalf of someone else. */
  async createForSelf(): Promise<Tenant> {
    const { data } = await apiClient.post<Tenant>('/tenants')
    return data
  },

  /** Resolves a tenant code (TN-XXXX-XXXX) the tenant shared, e.g. at check-in. */
  async lookup(code: string): Promise<TenantLookup> {
    const { data } = await apiClient.get<TenantLookup>('/tenants/lookup', { params: { code } })
    return data
  },

  async get(id: string): Promise<Tenant> {
    const { data } = await apiClient.get<Tenant>(`/tenants/${id}`)
    return data
  },
}
