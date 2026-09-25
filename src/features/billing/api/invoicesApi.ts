import { apiClient } from '@/infrastructure/api/client'
import type { Invoice } from '@/types/api'
import type { GenerateInvoicePayload, UpdateInvoicePayload } from '../types'

export const invoicesApi = {
  /** No pagination/filter support on this endpoint — returns every invoice for the property. */
  async listForProperty(propertyId: string): Promise<Invoice[]> {
    const { data } = await apiClient.get<Invoice[]>(`/properties/${propertyId}/invoices`)
    return data
  },

  async get(id: string): Promise<Invoice> {
    const { data } = await apiClient.get<Invoice>(`/invoices/${id}`)
    return data
  },

  async generate(residencyId: string, payload: GenerateInvoicePayload): Promise<Invoice> {
    const { data } = await apiClient.post<Invoice>(`/residencies/${residencyId}/invoices`, payload)
    return data
  },

  async update(id: string, payload: UpdateInvoicePayload): Promise<Invoice> {
    const { data } = await apiClient.patch<Invoice>(`/invoices/${id}`, payload)
    return data
  },

  async issue(id: string): Promise<Invoice> {
    const { data } = await apiClient.post<Invoice>(`/invoices/${id}/issue`)
    return data
  },

  async void(id: string): Promise<Invoice> {
    const { data } = await apiClient.post<Invoice>(`/invoices/${id}/void`)
    return data
  },
}
