import type { Invoice, Residency, Room } from '@/types/api'

// Pure derivations behind the dashboard / Property 360 numbers. pg-backend exposes no owner-facing
// aggregate endpoints (the /admin/analytics routes are SUPER_ADMIN-only), so every figure here is
// computed from real list responses. Each function documents exactly what it can and can't know —
// the UI copy must match these definitions.

export interface OccupancySnapshot {
  /** Non-archived beds that are in service (not INACTIVE/blocked). */
  inServiceBeds: number
  /** Beds INACTIVE (out of service / blocked) with nobody in them. */
  outOfServiceBeds: number
  /** Beds with an ACTIVE allocation — exact, computed server-side per room. */
  occupiedBeds: number
  vacantBeds: number
  /** occupied / in-service, 0–100. null when there are no in-service beds (no meaningful rate). */
  occupancyRate: number | null
  pendingCheckIns: number
}

/** Property occupancy from each room's server-computed `occupancy` (pg-backend derives it from
 * ACTIVE bed allocations, so it's exact) — no per-room beds requests needed. */
export function computeOccupancy(rooms: Room[], residencies: Residency[]): OccupancySnapshot {
  let total = 0
  let occupied = 0
  let vacant = 0
  let blocked = 0
  for (const room of rooms) {
    if (room.status === 'ARCHIVED') continue
    total += room.occupancy.totalBeds
    occupied += room.occupancy.occupiedBeds
    vacant += room.occupancy.vacantBeds
    blocked += room.occupancy.blockedBeds
  }
  const inServiceBeds = total - blocked
  return {
    inServiceBeds,
    outOfServiceBeds: blocked,
    occupiedBeds: occupied,
    vacantBeds: vacant,
    occupancyRate: inServiceBeds > 0 ? Math.round((Math.min(occupied, inServiceBeds) / inServiceBeds) * 100) : null,
    pendingCheckIns: residencies.filter((r) => r.status === 'PENDING').length,
  }
}

/** Mirrors pg-backend's lazy OVERDUE transition (an ISSUED invoice past its due date is OVERDUE the
 * next time it's read) so a stale cached ISSUED invoice never shows as merely "due". */
export function isEffectivelyOverdue(invoice: Invoice, now: Date): boolean {
  return invoice.status === 'OVERDUE' || (invoice.status === 'ISSUED' && new Date(invoice.dueDate) < now)
}

export interface RentCollectionSnapshot {
  /** Sum of non-draft, non-void invoices whose billing period starts in the current month. */
  billedThisMonth: number
  /** Of those, the invoices with status PAID (paid in full). */
  paidInFullThisMonth: number
  invoicesThisMonth: number
  paidInvoicesThisMonth: number
  /** Exact outstanding across ISSUED/OVERDUE invoices (no payment can have landed on those). */
  outstandingExact: number
  /** PARTIALLY_PAID invoices: their remaining balance is not exposed by the backend (no amountPaid
   * field), so they're counted separately instead of being guessed. */
  partiallyPaidCount: number
  partiallyPaidTotal: number
  overdueAmount: number
  overdueInvoices: Invoice[]
  dueSoonInvoices: Invoice[]
  currency: string
}

const DAY_MS = 24 * 60 * 60 * 1000

export function computeRentCollection(invoices: Invoice[], now: Date, dueSoonDays = 7): RentCollectionSnapshot {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const dueSoonCutoff = new Date(now.getTime() + dueSoonDays * DAY_MS)

  const snapshot: RentCollectionSnapshot = {
    billedThisMonth: 0,
    paidInFullThisMonth: 0,
    invoicesThisMonth: 0,
    paidInvoicesThisMonth: 0,
    outstandingExact: 0,
    partiallyPaidCount: 0,
    partiallyPaidTotal: 0,
    overdueAmount: 0,
    overdueInvoices: [],
    dueSoonInvoices: [],
    currency: invoices[0]?.currency ?? 'INR',
  }

  for (const invoice of invoices) {
    if (invoice.status === 'DRAFT' || invoice.status === 'VOID') continue
    const total = Number(invoice.total)
    const periodStart = new Date(invoice.billingPeriodStart)

    if (periodStart >= monthStart && periodStart < nextMonthStart) {
      snapshot.billedThisMonth += total
      snapshot.invoicesThisMonth += 1
      if (invoice.status === 'PAID') {
        snapshot.paidInFullThisMonth += total
        snapshot.paidInvoicesThisMonth += 1
      }
    }

    if (invoice.status === 'PARTIALLY_PAID') {
      snapshot.partiallyPaidCount += 1
      snapshot.partiallyPaidTotal += total
    } else if (invoice.status === 'ISSUED' || invoice.status === 'OVERDUE') {
      snapshot.outstandingExact += total
    }

    if (isEffectivelyOverdue(invoice, now)) {
      snapshot.overdueAmount += total
      snapshot.overdueInvoices.push(invoice)
    } else if (invoice.status === 'ISSUED' && new Date(invoice.dueDate) <= dueSoonCutoff) {
      snapshot.dueSoonInvoices.push(invoice)
    }
  }

  snapshot.overdueInvoices.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  snapshot.dueSoonInvoices.sort((a, b) => a.dueDate.localeCompare(b.dueDate))
  return snapshot
}

export function daysBetween(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / DAY_MS)
}

export function greetingFor(date: Date): string {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}
