import { apiClient } from '@/infrastructure/api/client'
import type { Bed } from '@/types/api'
import type { CreateBedPayload, UpdateBedPayload } from '../types'

export const bedsApi = {
  async list(propertyId: string, roomId: string): Promise<Bed[]> {
    const { data } = await apiClient.get<Bed[]>(`/properties/${propertyId}/rooms/${roomId}/beds`)
    return data
  },

  async create(propertyId: string, roomId: string, payload: CreateBedPayload): Promise<Bed> {
    const { data } = await apiClient.post<Bed>(`/properties/${propertyId}/rooms/${roomId}/beds`, payload)
    return data
  },

  async update(propertyId: string, roomId: string, bedId: string, payload: UpdateBedPayload): Promise<Bed> {
    const { data } = await apiClient.patch<Bed>(`/properties/${propertyId}/rooms/${roomId}/beds/${bedId}`, payload)
    return data
  },

  async archive(propertyId: string, roomId: string, bedId: string): Promise<Bed> {
    const { data } = await apiClient.delete<Bed>(`/properties/${propertyId}/rooms/${roomId}/beds/${bedId}`)
    return data
  },
}
