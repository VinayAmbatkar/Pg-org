import { apiClient } from '@/infrastructure/api/client'
import type { Residency, ResidencyActionResult } from '@/types/api'
import type { CheckInPayload, CreateResidencyPayload, UpdateResidencyPayload } from '../types'

export const residencyApi = {
  async listForProperty(propertyId: string): Promise<Residency[]> {
    const { data } = await apiClient.get<Residency[]>(`/properties/${propertyId}/residencies`)
    return data
  },

  async create(propertyId: string, payload: CreateResidencyPayload): Promise<Residency> {
    const { data } = await apiClient.post<Residency>(`/properties/${propertyId}/residencies`, payload)
    return data
  },

  async get(id: string): Promise<Residency> {
    const { data } = await apiClient.get<Residency>(`/residencies/${id}`)
    return data
  },

  async update(id: string, payload: UpdateResidencyPayload): Promise<Residency> {
    const { data } = await apiClient.patch<Residency>(`/residencies/${id}`, payload)
    return data
  },

  async checkIn(id: string, payload: CheckInPayload): Promise<ResidencyActionResult> {
    const { data } = await apiClient.post<ResidencyActionResult>(`/residencies/${id}/check-in`, payload)
    return data
  },

  async checkOut(id: string): Promise<ResidencyActionResult> {
    const { data } = await apiClient.post<ResidencyActionResult>(`/residencies/${id}/check-out`)
    return data
  },
}
