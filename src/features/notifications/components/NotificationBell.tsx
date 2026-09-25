import { Bell } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { APP_PATHS } from '@/app/router/paths'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { QueryState } from '@/components/feedback/QueryState'
import { EmptyState } from '@/components/feedback/EmptyState'
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from '../hooks/useNotifications'
import { useUnreadCount } from '../hooks/useUnreadCount'
import { NotificationItem } from './NotificationItem'

const RECENT = { limit: 10 }

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  const { data: unreadCount = 0 } = useUnreadCount()
  // The list is only fetched while the popover is open (the badge uses the cheap unread-count
  // endpoint). staleTime 0 makes every open fetch fresh; while open, a change in the polled unread
  // count refetches it so new notifications appear without reopening.
  const { data, isLoading, error, refetch } = useNotifications(RECENT, { enabled: open, staleTime: 0 })
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()
  const previousCount = useRef(unreadCount)

  useEffect(() => {
    if (open && unreadCount > previousCount.current) void refetch({ cancelRefetch: false })
    previousCount.current = unreadCount
  }, [open, unreadCount, refetch])

  useEffect(() => {
    if (!open) return
    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false)
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div className="relative" ref={containerRef}>
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <Badge variant="destructive" className="absolute -right-1 -top-1 h-5 min-w-5 justify-center px-1" aria-hidden="true">
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {open && (
        <div
          id={panelId}
          role="region"
          aria-label="Recent notifications"
          className="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-lg border border-border bg-card shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                className="text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto p-2">
            <QueryState
              isLoading={isLoading}
              error={error}
              onRetry={() => void refetch()}
              isEmpty={data?.items.length === 0}
              empty={<EmptyState title="No notifications yet" description="You'll see updates about your properties here." />}
            >
              <ul className="space-y-1">
                {data?.items.map((notification) => (
                  <li key={notification.id}>
                    <NotificationItem
                      notification={notification}
                      onMarkRead={(id) => markRead.mutate(id)}
                      onNavigate={() => setOpen(false)}
                    />
                  </li>
                ))}
              </ul>
            </QueryState>
          </div>

          <div className="border-t border-border px-4 py-2 text-right">
            <Link
              to={APP_PATHS.notifications}
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
