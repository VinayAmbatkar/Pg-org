import { z } from 'zod'
import { isSafeHttpUrl } from '@/lib/validators/url'
import { LISTING_AMENITIES, type Listing, type UpsertListingPayload } from '../types'

// Mirrors UpsertListingDto limits. Numbers are edited as strings and converted on submit.
const optionalNumber = (label: string, min: number, max: number) =>
  z
    .string()
    .trim()
    .refine((v) => v === '' || (Number.isFinite(Number(v)) && Number(v) >= min && Number(v) <= max), `${label} must be between ${min} and ${max}.`)

export const listingFormSchema = z.object({
  title: z.string().trim().max(200, 'Title must be 200 characters or fewer.'),
  description: z.string().trim().max(4000, 'Description must be 4000 characters or fewer.'),
  locality: z.string().trim().max(200, 'Locality must be 200 characters or fewer.'),
  coverImageUrl: z
    .string()
    .trim()
    .refine((v) => v === '' || isSafeHttpUrl(v), 'Enter a full image URL starting with https://'),
  startingFromPrice: optionalNumber('Starting price', 0, 10_000_000),
  latitude: optionalNumber('Latitude', -90, 90),
  longitude: optionalNumber('Longitude', -180, 180),
  amenities: z.array(z.enum(LISTING_AMENITIES)),
})

export type ListingFormValues = z.infer<typeof listingFormSchema>

export function toFormValues(listing: Listing): ListingFormValues {
  return {
    title: listing.title ?? '',
    description: listing.description ?? '',
    locality: listing.locality ?? '',
    coverImageUrl: listing.coverImageUrl ?? '',
    startingFromPrice: listing.startingFromPrice ? String(Number(listing.startingFromPrice)) : '',
    latitude: listing.latitude?.toString() ?? '',
    longitude: listing.longitude?.toString() ?? '',
    amenities: listing.amenities,
  }
}

/** Text fields are always sent (an empty string clears them). Numbers are only sent when filled:
 * UpsertListingDto has no way to *clear* a number (it keeps the existing value when omitted and
 * rejects null), so the form blocks emptying one that is already set - see ListingPanel. */
export function toUpsertPayload(values: ListingFormValues): UpsertListingPayload {
  const payload: UpsertListingPayload = {
    title: values.title.trim(),
    description: values.description.trim(),
    locality: values.locality.trim(),
    coverImageUrl: values.coverImageUrl.trim(),
    amenities: values.amenities,
  }
  if (values.startingFromPrice !== '') payload.startingFromPrice = Number(values.startingFromPrice)
  if (values.latitude !== '') payload.latitude = Number(values.latitude)
  if (values.longitude !== '') payload.longitude = Number(values.longitude)
  return payload
}

/** Fields pg-backend requires before it will publish (PropertyListingsService.publish). */
export function missingForPublish(listing: Pick<Listing, 'title' | 'description' | 'city' | 'locality'>): string[] {
  const missing: string[] = []
  if (!listing.title) missing.push('Title')
  if (!listing.description) missing.push('Description')
  if (!listing.city) missing.push('City (from the property address)')
  if (!listing.locality) missing.push('Locality')
  return missing
}
