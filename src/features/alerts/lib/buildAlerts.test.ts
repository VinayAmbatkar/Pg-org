import { describe, expect, it } from 'vitest'
import { computeOccupancy, computeRentCollection } from '@/features/dashboard/lib/metrics'
import { testInvoiceIssued } from '@/test/handlers'
import { buildAlerts } from './buildAlerts'

const now = new Date('2026-09-25T10:00:00')

describe('buildAlerts', () => {
  it('raises nothing from domains that did not load', () => {
    expect(buildAlerts({})).toEqual([])
  })

  it('raises nothing when every loaded domain is healthy', () => {
    expect(
      buildAlerts({
        rent: computeRentCollection([], now),
        occupancy: computeOccupancy([], []),
        complaints: { openUnassigned: 0, highPriorityUnassigned: 0 },
        applications: { newCount: 0 },
        food: { enabled: true, todayPublished: true },
      }),
    ).toEqual([])
  })

  it('orders critical before warning before info, each linking to the relevant filtered module', () => {
    const alerts = buildAlerts({
      rent: computeRentCollection([{ ...testInvoiceIssued, dueDate: '2026-09-10T00:00:00.000Z' }], now),
      occupancy: {
        inServiceBeds: 4,
        outOfServiceBeds: 0,
        occupiedBeds: 2,
        vacantBeds: 2,
        occupancyRate: 50,
        pendingCheckIns: 1,
      },
      complaints: { openUnassigned: 3, highPriorityUnassigned: 2 },
      applications: { newCount: 5 },
      food: { enabled: true, todayPublished: false },
    })

    expect(alerts.map((a) => [a.id, a.severity, a.action.to])).toEqual([
      ['overdue-invoices', 'critical', '/app/billing/invoices?status=OVERDUE'],
      ['high-priority-complaints', 'critical', '/app/complaints?status=OPEN'],
      ['pending-check-ins', 'warning', '/app/tenants?status=PENDING'],
      ['new-applications', 'warning', '/app/applications?status=SUBMITTED'],
      ['menu-not-published', 'warning', '/app/food/menu'],
      ['vacant-beds', 'info', '/app/rooms'],
    ])
    expect(alerts[0].title).toBe('1 overdue invoice')
    expect(alerts[3].title).toBe('5 new applications to review')
  })

  it('does not nag about the menu when food service is disabled', () => {
    expect(buildAlerts({ food: { enabled: false, todayPublished: false } })).toEqual([])
  })
})
