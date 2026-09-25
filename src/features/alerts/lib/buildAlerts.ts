import type { OccupancySnapshot, RentCollectionSnapshot } from '@/features/dashboard/lib/metrics'
import { formatCurrency } from '@/lib/formatters/currency'

export type AlertSeverity = 'critical' | 'warning' | 'info'

export interface OperationalAlert {
  id: string
  severity: AlertSeverity
  title: string
  description?: string
  action: { label: string; to: string }
}

/** Inputs are optional per domain: a domain is omitted when the role can't view it, it's still
 * loading, or it failed — an alert is only ever raised from data that actually loaded. */
export interface AlertInputs {
  rent?: RentCollectionSnapshot
  occupancy?: OccupancySnapshot
  complaints?: { openUnassigned: number; highPriorityUnassigned: number }
  applications?: { newCount: number }
  food?: { enabled: boolean; todayPublished: boolean }
}

const SEVERITY_ORDER: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 }

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

export function buildAlerts({ rent, occupancy, complaints, applications, food }: AlertInputs): OperationalAlert[] {
  const alerts: OperationalAlert[] = []

  if (rent && rent.overdueInvoices.length > 0) {
    alerts.push({
      id: 'overdue-invoices',
      severity: 'critical',
      title: `${plural(rent.overdueInvoices.length, 'overdue invoice')}`,
      description: `${formatCurrency(rent.overdueAmount, rent.currency)} past due`,
      action: { label: 'View invoices', to: '/app/billing/invoices?status=OVERDUE' },
    })
  }

  if (complaints && complaints.highPriorityUnassigned > 0) {
    alerts.push({
      id: 'high-priority-complaints',
      severity: 'critical',
      title: `${plural(complaints.highPriorityUnassigned, 'high-priority complaint')} not yet assigned`,
      action: { label: 'Assign now', to: '/app/complaints?status=OPEN' },
    })
  } else if (complaints && complaints.openUnassigned > 0) {
    alerts.push({
      id: 'open-complaints',
      severity: 'warning',
      title: `${plural(complaints.openUnassigned, 'complaint')} awaiting assignment`,
      action: { label: 'View complaints', to: '/app/complaints?status=OPEN' },
    })
  }

  if (occupancy && occupancy.pendingCheckIns > 0) {
    alerts.push({
      id: 'pending-check-ins',
      severity: 'warning',
      title: `${plural(occupancy.pendingCheckIns, 'tenant')} waiting to be checked in`,
      action: { label: 'View tenants', to: '/app/tenants?status=PENDING' },
    })
  }

  if (applications && applications.newCount > 0) {
    alerts.push({
      id: 'new-applications',
      severity: 'warning',
      title: `${plural(applications.newCount, 'new application')} to review`,
      action: { label: 'Review', to: '/app/applications?status=SUBMITTED' },
    })
  }

  if (food && food.enabled && !food.todayPublished) {
    alerts.push({
      id: 'menu-not-published',
      severity: 'warning',
      title: "Today's menu isn't published",
      description: 'Tenants can only see published menus.',
      action: { label: 'Open menu', to: '/app/food/menu' },
    })
  }

  if (occupancy && occupancy.vacantBeds > 0) {
    alerts.push({
      id: 'vacant-beds',
      severity: 'info',
      title: `${plural(occupancy.vacantBeds, 'vacant bed')}`,
      action: { label: 'View rooms', to: '/app/rooms' },
    })
  }

  return alerts.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
}
