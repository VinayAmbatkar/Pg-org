import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/feedback/EmptyState'
import { QueryState } from '@/components/feedback/QueryState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Tabs } from '@/components/ui/tabs'
import { useUrlParams } from '@/hooks/useUrlState'
import { NotificationItem } from '../components/NotificationItem'
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from '../hooks/useNotifications'
import { useUnreadCount } from '../hooks/useUnreadCount'

const PAGE_SIZE = 20

export function NotificationsPage() {
  const { get, set } = useUrlParams()
  const filter = get('filter', 'all')
  const page = Math.max(1, Number(get('page', '1')) || 1)
  const setPage = (next: number) => set({ page: next === 1 ? null : next })
  const unreadOnly = filter === 'unread'

  const { data, isLoading, error, refetch, isPlaceholderData } = useNotifications({ page, limit: PAGE_SIZE, unreadOnly })
  const { data: unreadCount = 0 } = useUnreadCount()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()
  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Notifications"
        description="Your notification history. Items link to the record they're about when it exists in Owner Web."
        action={
          unreadCount > 0 ? (
            <Button variant="outline" onClick={() => markAllRead.mutate()} isLoading={markAllRead.isPending}>
              Mark all as read
            </Button>
          ) : undefined
        }
      />

      <Tabs
        label="Notification filter"
        items={[
          { value: 'all', label: 'All' },
          { value: 'unread', label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ''}` },
        ]}
        value={filter}
        onChange={(value) => set({ filter: value === 'all' ? null : value, page: null })}
      />

      <QueryState
        isLoading={isLoading}
        error={error}
        onRetry={() => void refetch()}
        isEmpty={data?.items.length === 0}
        empty={
          <EmptyState
            icon={Bell}
            title={unreadOnly ? "You're all caught up" : 'No notifications yet'}
            description={unreadOnly ? 'No unread notifications.' : "You'll see updates about your properties here."}
          />
        }
      >
        <ul className="divide-y divide-border rounded-lg border border-border bg-white" aria-busy={isPlaceholderData}>
          {data?.items.map((notification) => (
            <li key={notification.id} className="p-1">
              <NotificationItem notification={notification} onMarkRead={(id) => markRead.mutate(id)} />
            </li>
          ))}
        </ul>
        {totalPages > 1 && (
          <nav aria-label="Pagination" className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                Next
              </Button>
            </div>
          </nav>
        )}
      </QueryState>
    </div>
  )
}
