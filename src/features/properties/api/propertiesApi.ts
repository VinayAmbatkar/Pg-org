import { apiClient } from '@/infrastructure/api/client'
import type { Property } from '@/types/api'
import type { CreatePropertyPayload, ListPropertiesParams, UpdatePropertyPayload } from '../types'

export const propertiesApi = {
  async list(params: ListPropertiesParams): Promise<Property[]> {
    const { data } = await apiClient.get<Property[]>('/properties', { params })
    return data
  },

  async get(id: string): Promise<Property> {
    const { data } = await apiClient.get<Property>(`/properties/${id}`)
    return data
  },

  async create(payload: CreatePropertyPayload): Promise<Property> {
    const { data } = await apiClient.post<Property>('/properties', payload)
    return data
  },

  async update(id: string, payload: UpdatePropertyPayload): Promise<Property> {
    const { data } = await apiClient.patch<Property>(`/properties/${id}`, payload)
    return data
  },

  /** Archives the property (soft-delete) — DELETE returns 200 with the archived property, never a hard delete. */
  async archive(id: string): Promise<Property> {
    const { data } = await apiClient.delete<Property>(`/properties/${id}`)
    return data
  },
}
