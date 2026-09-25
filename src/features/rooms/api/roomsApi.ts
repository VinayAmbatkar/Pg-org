import { apiClient } from '@/infrastructure/api/client'
import type { Room, RoomHistoryEntry } from '@/types/api'
import type { CreateRoomPayload, UpdateRoomPayload } from '../types'

export const roomsApi = {
  async list(propertyId: string): Promise<Room[]> {
    const { data } = await apiClient.get<Room[]>(`/properties/${propertyId}/rooms`)
    return data
  },

  async get(propertyId: string, roomId: string): Promise<Room> {
    const { data } = await apiClient.get<Room>(`/properties/${propertyId}/rooms/${roomId}`)
    return data
  },

  async history(propertyId: string, roomId: string): Promise<RoomHistoryEntry[]> {
    const { data } = await apiClient.get<RoomHistoryEntry[]>(`/properties/${propertyId}/rooms/${roomId}/history`)
    return data
  },

  async create(propertyId: string, payload: CreateRoomPayload): Promise<Room> {
    const { data } = await apiClient.post<Room>(`/properties/${propertyId}/rooms`, payload)
    return data
  },

  async update(propertyId: string, roomId: string, payload: UpdateRoomPayload): Promise<Room> {
    const { data } = await apiClient.patch<Room>(`/properties/${propertyId}/rooms/${roomId}`, payload)
    return data
  },

  async archive(propertyId: string, roomId: string): Promise<Room> {
    const { data } = await apiClient.delete<Room>(`/properties/${propertyId}/rooms/${roomId}`)
    return data
  },
}
