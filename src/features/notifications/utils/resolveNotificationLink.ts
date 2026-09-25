import type { AppNotification } from '@/types/api'

// IDs from notification metadata are interpolated into app paths, so they must be real UUIDs —
// never a guessed or partial value, and never anything that could alter the path ("../", "?").
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DATE = /^\d{4}-\d{2}-\d{2}$/

function id(data: Record<string, unknown>, key: string): string | null {
  const value = data[key]
  return typeof value === 'string' && UUID.test(value) ? value : null
}

/** Maps a notification's `data` (set by pg-backend's NotificationEventService — always a `screen`
 * plus the IDs for that screen) to an in-app route. Returns null when the screen has no Owner Web
 * page (e.g. tenant food invoices) or the required ID is missing/invalid: the notification stays
 * readable but isn't a link. Only notifications an owner/manager can actually receive matter in
 * practice, but every screen is mapped defensively. */
export function resolveNotificationLink(notification: AppNotification): string | null {
  const data = notification.data
  if (!data || typeof data.screen !== 'string') return null

  switch (data.screen) {
    case 'RESIDENCY': {
      const residencyId = id(data, 'residencyId')
      return residencyId ? `/app/residencies/${residencyId}` : null
    }
    case 'APPLICATION': {
      const applicationId = id(data, 'applicationId')
      return applicationId ? `/app/applications/${applicationId}` : null
    }
    case 'VISIT':
      // No visit detail route exists; the visits list is the closest real destination.
      return id(data, 'visitId') ? '/app/visits' : null
    case 'INVOICE': {
      const invoiceId = id(data, 'invoiceId')
      return invoiceId ? `/app/billing/invoices/${invoiceId}` : null
    }
    case 'PAYMENT': {
      const paymentId = id(data, 'paymentId')
      return paymentId ? `/app/payments/${paymentId}` : null
    }
    case 'COMPLAINT': {
      const complaintId = id(data, 'complaintId')
      return complaintId ? `/app/complaints/${complaintId}` : null
    }
    case 'FOOD_MENU': {
      const date = typeof data.date === 'string' && DATE.test(data.date.slice(0, 10)) ? data.date.slice(0, 10) : null
      return date ? `/app/food/menu?date=${date}` : '/app/food/menu'
    }
    case 'FOOD_SUBSCRIPTION':
      return '/app/food/subscriptions'
    case 'SAAS_SUBSCRIPTION':
      return '/app/settings'
    default:
      return null
  }
}
