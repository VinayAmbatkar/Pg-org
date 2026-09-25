import { apiClient } from '@/infrastructure/api/client'
import type { AppNotification, PaginatedResult } from '@/types/api'
import type { ListNotificationsParams } from '../types'

export const notificationsApi = {
  async list({ page, limit, unreadOnly }: ListNotificationsParams): Promise<PaginatedResult<AppNotification>> {
    // pg-backend converts `unreadOnly` with @Type(() => Boolean), so the *string* "false" becomes
    // true. "All notifications" must therefore omit the param entirely, never send false.
    const params: Record<string, number | boolean> = {}
    if (page) params.page = page
    if (limit) params.limit = limit
    if (unreadOnly) params.unreadOnly = true
    const { data } = await apiClient.get<PaginatedResult<AppNotification>>('/me/notifications', { params })
    return data
  },

  async unreadCount(): Promise<number> {
    const { data } = await apiClient.get<{ count: number }>('/me/notifications/unread-count')
    return data.count
  },

  async markRead(id: string): Promise<AppNotification> {
    const { data } = await apiClient.post<AppNotification>(`/me/notifications/${encodeURIComponent(id)}/read`)
    return data
  },

  async markAllRead(): Promise<{ updated: number }> {
    const { data } = await apiClient.post<{ updated: number }>('/me/notifications/read-all')
    return data
  },
}
