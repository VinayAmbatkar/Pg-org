import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ApiError } from '@/infrastructure/api/errors'
import { listingsApi } from '../api/listingsApi'
import { listingKeys } from '../api/queryKeys'
import type { Listing, UpsertListingPayload } from '../types'

export function useListing(propertyId: string) {
  return useQuery<Listing, ApiError>({
    queryKey: listingKeys.detail(propertyId),
    queryFn: () => listingsApi.get(propertyId),
    enabled: Boolean(propertyId),
  })
}

function useListingMutation<TVars>(propertyId: string, fn: (vars: TVars) => Promise<Listing>) {
  const queryClient = useQueryClient()
  return useMutation<Listing, ApiError, TVars>({
    mutationFn: fn,
    onSuccess: (listing) => queryClient.setQueryData(listingKeys.detail(propertyId), listing),
  })
}

export function useUpdateListing(propertyId: string) {
  return useListingMutation(propertyId, (payload: UpsertListingPayload) => listingsApi.update(propertyId, payload))
}

export function usePublishListing(propertyId: string) {
  return useListingMutation(propertyId, () => listingsApi.publish(propertyId))
}

export function useUnpublishListing(propertyId: string) {
  return useListingMutation(propertyId, () => listingsApi.unpublish(propertyId))
}
