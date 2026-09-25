import { describe, expect, it } from 'vitest'
import { statusConfig } from './statusConfig'

// Every status pg-backend can return (schema.prisma enums), per domain.
const ALL: Record<keyof typeof statusConfig, string[]> = {
  application: ['SUBMITTED', 'UNDER_REVIEW', 'VISIT_SCHEDULED', 'APPROVED', 'REJECTED', 'WITHDRAWN', 'EXPIRED'],
  invoice: ['DRAFT', 'ISSUED', 'OVERDUE', 'PARTIALLY_PAID', 'PAID', 'VOID'],
  rentPlan: ['ACTIVE', 'INACTIVE'],
  complaint: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED'],
  complaintPriority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
  foodPlan: ['ACTIVE', 'INACTIVE', 'ARCHIVED'],
  foodSubscription: ['ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED'],
  menu: ['DRAFT', 'PUBLISHED', 'CANCELLED'],
  payment: ['CREATED', 'PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED'],
  property: ['ACTIVE', 'INACTIVE', 'ARCHIVED'],
  room: ['ACTIVE', 'INACTIVE', 'ARCHIVED'],
  residency: ['PENDING', 'ACTIVE', 'NOTICE_PERIOD', 'CHECKED_OUT'],
  visit: ['REQUESTED', 'SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
}

describe('statusConfig', () => {
  it.each(Object.entries(ALL))('%s: every status has a human label (not the raw enum) and a variant', (domain, statuses) => {
    const resolve = statusConfig[domain as keyof typeof statusConfig] as (s: string) => { label: string; variant: string }
    for (const status of statuses) {
      const style = resolve(status)
      expect(style.label, `${domain}.${status}`).not.toBe(status)
      expect(style.label.length).toBeGreaterThan(0)
      expect(['success', 'secondary', 'outline', 'warning', 'destructive']).toContain(style.variant)
    }
  })

  it('never renders an attention state as "success"', () => {
    expect(statusConfig.invoice('OVERDUE').variant).toBe('destructive')
    expect(statusConfig.payment('FAILED').variant).toBe('destructive')
    expect(statusConfig.complaintPriority('MEDIUM').variant).not.toBe('success')
  })
})
