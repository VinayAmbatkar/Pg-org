import { apiClient } from '@/infrastructure/api/client'
import type { Tenant } from '@/types/api'

export const tenantsApi = {
  /** Creates a tenant profile for the CALLER only — there is no backend endpoint for an
   * Owner/Manager to create a tenant profile on behalf of someone else. */
  async createForSelf(): Promise<Tenant> {
    const { data } = await apiClient.post<Tenant>('/tenants')
    return data
  },

  async get(id: string): Promise<Tenant> {
    const { data } = await apiClient.get<Tenant>(`/tenants/${id}`)
    return data
  },
}
