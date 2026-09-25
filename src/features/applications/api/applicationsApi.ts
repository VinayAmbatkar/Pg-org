import { apiClient } from '@/infrastructure/api/client'
import type { Application, ConversionResult, PaginatedResult } from '@/types/api'
import type { ListApplicationsParams, RejectApplicationPayload } from '../types'

export const applicationsApi = {
  async listForProperty(propertyId: string, params: ListApplicationsParams = {}): Promise<PaginatedResult<Application>> {
    const { data } = await apiClient.get<PaginatedResult<Application>>(`/properties/${propertyId}/applications`, { params })
    return data
  },

  async get(id: string): Promise<Application> {
    const { data } = await apiClient.get<Application>(`/applications/${id}`)
    return data
  },

  async review(id: string): Promise<Application> {
    const { data } = await apiClient.post<Application>(`/applications/${id}/review`)
    return data
  },

  async approve(id: string): Promise<Application> {
    const { data } = await apiClient.post<Application>(`/applications/${id}/approve`)
    return data
  },

  async reject(id: string, payload: RejectApplicationPayload): Promise<Application> {
    const { data } = await apiClient.post<Application>(`/applications/${id}/reject`, payload)
    return data
  },

  async startOnboarding(id: string): Promise<ConversionResult> {
    const { data } = await apiClient.post<ConversionResult>(`/applications/${id}/start-onboarding`)
    return data
  },
}
