import { useQueries } from '@tanstack/react-query'
import type { Bed, Room } from '@/types/api'
import { bedsApi } from '../api/bedsApi'
import { bedKeys } from '../api/queryKeys'

/** Fetches beds for every room of a property in parallel — there is no single "beds for
 * property" endpoint, only the nested per-room one, so this fans out client-side (one request per
 * room; see docs/backend-gaps.md — this is the main pressure on pg-backend's 100 req/min throttle).
 * Keys are shared with RoomDetailPage's useBeds, so a room's beds are fetched once and reused. */
export function useBedsForRooms(propertyId: string | undefined, rooms: Room[] | undefined) {
  return useQueries({
    queries: (rooms ?? []).map((room) => ({
      queryKey: bedKeys.lists(propertyId ?? '', room.id),
      queryFn: () => bedsApi.list(propertyId as string, room.id),
      enabled: Boolean(propertyId),
    })),
    // `combine` is memoized by TanStack Query, so `beds` keeps the same reference until a result
    // actually changes — consumers can safely use it as a memo dependency.
    combine: (queries) => ({
      beds: queries.flatMap((q) => q.data ?? []) as Bed[],
      isLoading: queries.some((q) => q.isLoading),
      error: queries.find((q) => q.error)?.error ?? null,
      refetch: () => Promise.all(queries.filter((q) => q.error).map((q) => q.refetch())),
    }),
  })
}
