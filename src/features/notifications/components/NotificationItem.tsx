import { Link } from 'react-router-dom'
import { formatRelativeTime } from '@/lib/formatters/date'
import { cn } from '@/lib/utils/cn'
import type { AppNotification } from '@/types/api'
import { resolveNotificationLink } from '../utils/resolveNotificationLink'

interface NotificationItemProps {
  notification: AppNotification
  onMarkRead: (id: string) => void
  onNavigate?: () => void
}

export function NotificationItem({ notification, onMarkRead, onNavigate }: NotificationItemProps) {
  const link = resolveNotificationLink(notification)
  const urgent = notification.priority === 'HIGH' || notification.priority === 'URGENT'

  const body = (
    <>
      <p className="flex items-center gap-2 font-medium text-foreground">
        {!notification.isRead && (
          <>
            <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
            <span className="sr-only">Unread: </span>
          </>
        )}
        <span className="min-w-0 flex-1">{notification.title}</span>
        {urgent && (
          <span className="shrink-0 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-red-700">
            {notification.priority === 'URGENT' ? 'Urgent' : 'High'}
          </span>
        )}
      </p>
      <p className="mt-0.5 text-muted-foreground">{notification.body}</p>
      <time dateTime={notification.createdAt} className="mt-1 block text-xs text-muted-foreground">
        {formatRelativeTime(notification.createdAt)}
      </time>
    </>
  )

  const className = cn('block rounded-md px-3 py-2 text-left text-sm', !notification.isRead && 'bg-accent/60')

  if (link) {
    return (
      <Link
        to={link}
        className={cn(className, 'hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary')}
        onClick={() => {
          if (!notification.isRead) onMarkRead(notification.id)
          onNavigate?.()
        }}
      >
        {body}
      </Link>
    )
  }

  return (
    <div className={className}>
      {body}
      {!notification.isRead && (
        <button
          type="button"
          className="mt-1 text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          onClick={() => onMarkRead(notification.id)}
        >
          Mark as read
        </button>
      )}
    </div>
  )
}
