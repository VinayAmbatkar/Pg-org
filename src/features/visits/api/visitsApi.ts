import { apiClient } from '@/infrastructure/api/client'
import type { PaginatedResult, Visit } from '@/types/api'
import type { ListVisitsParams, RescheduleVisitPayload, ScheduleVisitPayload } from '../types'

export const visitsApi = {
  async listForProperty(propertyId: string, params: ListVisitsParams = {}): Promise<PaginatedResult<Visit>> {
    const { data } = await apiClient.get<PaginatedResult<Visit>>(`/properties/${propertyId}/visits`, { params })
    return data
  },

  async get(id: string): Promise<Visit> {
    const { data } = await apiClient.get<Visit>(`/visits/${id}`)
    return data
  },

  async schedule(applicationId: string, payload: ScheduleVisitPayload): Promise<Visit> {
    const { data } = await apiClient.post<Visit>(`/applications/${applicationId}/visits`, payload)
    return data
  },

  async confirm(id: string): Promise<Visit> {
    const { data } = await apiClient.post<Visit>(`/visits/${id}/confirm`)
    return data
  },

  async reschedule(id: string, payload: RescheduleVisitPayload): Promise<Visit> {
    const { data } = await apiClient.post<Visit>(`/visits/${id}/reschedule`, payload)
    return data
  },

  async complete(id: string): Promise<Visit> {
    const { data } = await apiClient.post<Visit>(`/visits/${id}/complete`)
    return data
  },

  async noShow(id: string): Promise<Visit> {
    const { data } = await apiClient.post<Visit>(`/visits/${id}/no-show`)
    return data
  },

  async cancel(id: string): Promise<Visit> {
    const { data } = await apiClient.post<Visit>(`/visits/${id}/cancel`)
    return data
  },
}
