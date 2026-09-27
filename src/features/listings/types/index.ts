// Verified against pg-backend tenant-discovery/dto/listing-response.dto.ts and create-listing.dto.ts.

export type ListingStatus = 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED'

/** Listing amenities (pg-backend `Amenity` enum) - a different set from in-room RoomAmenity. */
export const LISTING_AMENITIES = [
  'WIFI',
  'LAUNDRY',
  'PARKING',
  'AC',
  'POWER_BACKUP',
  'HOUSEKEEPING',
  'SECURITY',
  'CCTV',
  'FOOD',
  'GYM',
  'COMMON_AREA',
] as const
export type ListingAmenity = (typeof LISTING_AMENITIES)[number]

export interface Listing {
  id: string
  organizationId: string
  propertyId: string
  status: ListingStatus
  title: string | null
  description: string | null
  /** Always copied from the property's own city by the backend - not editable here. */
  city: string | null
  locality: string | null
  latitude: number | null
  longitude: number | null
  coverImageUrl: string | null
  contactEnabled: boolean
  /** Decimal string, e.g. "8500.00". */
  startingFromPrice: string | null
  amenities: ListingAmenity[]
  createdAt: string
  updatedAt: string
  publishedAt: string | null
}

/** UpsertListingDto - every field optional; `amenities`, when sent, replaces the whole set. */
export interface UpsertListingPayload {
  title?: string
  description?: string
  locality?: string
  latitude?: number
  longitude?: number
  coverImageUrl?: string
  contactEnabled?: boolean
  startingFromPrice?: number
  amenities?: ListingAmenity[]
}
