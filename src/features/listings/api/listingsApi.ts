import { apiClient } from '@/infrastructure/api/client'
import type { Listing, UpsertListingPayload } from '../types'

// pg-backend tenant-discovery/controllers/property-listings.controller.ts. Read: OWNER/MANAGER/STAFF
// (GET lazily creates an empty DRAFT the first time). Write/publish/unpublish: OWNER/MANAGER.
const base = (propertyId: string) => `/properties/${propertyId}/listing`

export const listingsApi = {
  async get(propertyId: string): Promise<Listing> {
    const { data } = await apiClient.get<Listing>(base(propertyId))
    return data
  },
  async update(propertyId: string, payload: UpsertListingPayload): Promise<Listing> {
    const { data } = await apiClient.patch<Listing>(base(propertyId), payload)
    return data
  },
  /** 400 LISTING_INCOMPLETE unless title, description, city and locality are all set. */
  async publish(propertyId: string): Promise<Listing> {
    const { data } = await apiClient.post<Listing>(`${base(propertyId)}/publish`)
    return data
  },
  async unpublish(propertyId: string): Promise<Listing> {
    const { data } = await apiClient.post<Listing>(`${base(propertyId)}/unpublish`)
    return data
  },
}
