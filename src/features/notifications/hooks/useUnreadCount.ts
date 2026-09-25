import { useQuery } from '@tanstack/react-query'
import { notificationsApi } from '../api/notificationsApi'
import { notificationKeys } from '../api/queryKeys'

// Notifications are REST/poll-only (no websocket channel exists on the backend), so the bell
// polls unread-count on an interval.
const POLL_INTERVAL_MS = 30_000

export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: notificationsApi.unreadCount,
    refetchInterval: POLL_INTERVAL_MS,
  })
}
