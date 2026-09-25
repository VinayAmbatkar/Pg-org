import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import type { AppNotification, PaginatedResult } from '@/types/api'
import { notificationsApi } from '../api/notificationsApi'
import { notificationKeys } from '../api/queryKeys'
import type { ListNotificationsParams } from '../types'

export function useNotifications(
  params: ListNotificationsParams,
  { enabled = true, staleTime }: { enabled?: boolean; staleTime?: number } = {},
) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => notificationsApi.list(params),
    enabled,
    staleTime,
  })
}

type Snapshot = Array<[readonly unknown[], unknown]>

/** Applies `update` to every cached notifications list + the unread count, returning the previous
 * values so a failed request can be rolled back. */
async function applyOptimistic(
  queryClient: QueryClient,
  update: (n: AppNotification) => AppNotification,
  countDelta: (count: number) => number,
): Promise<Snapshot> {
  await queryClient.cancelQueries({ queryKey: notificationKeys.all })
  const snapshot = queryClient.getQueriesData({ queryKey: notificationKeys.all }) as Snapshot

  queryClient.setQueriesData<PaginatedResult<AppNotification>>({ queryKey: notificationKeys.lists() }, (page) =>
    page ? { ...page, items: page.items.map(update) } : page,
  )
  queryClient.setQueryData<number>(notificationKeys.unreadCount(), (count) =>
    count === undefined ? count : Math.max(0, countDelta(count)),
  )
  return snapshot
}

function rollback(queryClient: QueryClient, snapshot: Snapshot | undefined) {
  for (const [key, value] of snapshot ?? []) queryClient.setQueryData(key, value)
}

// Optimistic on purpose (marking read is low-stakes and instantly reversible); the server response
// still wins via the invalidation in onSettled. Financial/occupancy mutations elsewhere are never
// optimistic.
export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onMutate: async (id) => {
      const wasUnread = queryClient
        .getQueriesData<PaginatedResult<AppNotification>>({ queryKey: notificationKeys.lists() })
        .some(([, page]) => page?.items.some((n) => n.id === id && !n.isRead))
      const snapshot = await applyOptimistic(
        queryClient,
        (n) => (n.id === id ? { ...n, isRead: true, readAt: n.readAt ?? new Date().toISOString() } : n),
        (count) => (wasUnread ? count - 1 : count),
      )
      return { snapshot }
    },
    onError: (_error, _id, context) => rollback(queryClient, context?.snapshot),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  })
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onMutate: async () => {
      const now = new Date().toISOString()
      const snapshot = await applyOptimistic(
        queryClient,
        (n) => (n.isRead ? n : { ...n, isRead: true, readAt: now }),
        () => 0,
      )
      return { snapshot }
    },
    onError: (_error, _vars, context) => rollback(queryClient, context?.snapshot),
    onSettled: () => void queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  })
}
