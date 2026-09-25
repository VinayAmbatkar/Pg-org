import { apiClient } from '@/infrastructure/api/client'
import type { Organization } from '@/types/api'
import type { CreateOrganizationPayload, UpdateOrganizationPayload } from '../types'

export const organizationsApi = {
  async list(): Promise<Organization[]> {
    const { data } = await apiClient.get<Organization[]>('/organizations')
    return data
  },

  async get(id: string): Promise<Organization> {
    const { data } = await apiClient.get<Organization>(`/organizations/${id}`)
    return data
  },

  async create(payload: CreateOrganizationPayload): Promise<Organization> {
    const { data } = await apiClient.post<Organization>('/organizations', payload)
    return data
  },

  async update(id: string, payload: UpdateOrganizationPayload): Promise<Organization> {
    const { data } = await apiClient.patch<Organization>(`/organizations/${id}`, payload)
    return data
  },
}
