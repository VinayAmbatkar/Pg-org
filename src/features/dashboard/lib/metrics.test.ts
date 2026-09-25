import { describe, expect, it } from 'vitest'
import { testInvoiceIssued, testRoom } from '@/test/handlers'
import type { Invoice, Residency, Room } from '@/types/api'
import { computeOccupancy, computeRentCollection, greetingFor, isEffectivelyOverdue } from './metrics'

const room = (occupancy: Room['occupancy'], status: Room['status'] = 'ACTIVE'): Room => ({
  ...testRoom,
  id: Math.random().toString(36),
  status,
  occupancy,
})
const residency = (id: string, status: Residency['status']): Residency => ({
  id,
  tenantId: `t-${id}`,
  propertyId: 'p',
  startDate: '',
  expectedEndDate: null,
  actualEndDate: null,
  status,
  createdAt: '',
})
const invoice = (overrides: Partial<Invoice>): Invoice => ({ ...testInvoiceIssued, ...overrides })

describe('computeOccupancy', () => {
  it("sums each room's server-computed occupancy (archived rooms excluded)", () => {
    const result = computeOccupancy(
      [
        room({ totalBeds: 3, occupiedBeds: 2, vacantBeds: 1, blockedBeds: 0 }),
        room({ totalBeds: 2, occupiedBeds: 0, vacantBeds: 1, blockedBeds: 1 }),
        room({ totalBeds: 4, occupiedBeds: 0, vacantBeds: 4, blockedBeds: 0 }, 'ARCHIVED'),
      ],
      [residency('1', 'ACTIVE'), residency('2', 'NOTICE_PERIOD'), residency('3', 'PENDING'), residency('4', 'CHECKED_OUT')],
    )
    expect(result).toEqual({
      inServiceBeds: 4,
      outOfServiceBeds: 1,
      occupiedBeds: 2,
      vacantBeds: 2,
      occupancyRate: 50,
      pendingCheckIns: 1,
    })
  })

  it('returns a null rate (not 0%) when there are no in-service beds', () => {
    expect(computeOccupancy([], []).occupancyRate).toBeNull()
  })

  it('never reports over 100% when an occupied bed was later taken out of service', () => {
    const result = computeOccupancy([room({ totalBeds: 2, occupiedBeds: 2, vacantBeds: 0, blockedBeds: 1 })], [])
    expect(result.occupancyRate).toBe(100)
    expect(result.vacantBeds).toBe(0)
  })
})

describe('computeRentCollection', () => {
  const now = new Date('2026-09-25T10:00:00')

  it('splits billed / paid-in-full for the current month and exact outstanding across months', () => {
    const result = computeRentCollection(
      [
        invoice({ id: '1', status: 'PAID', total: '8000.00', billingPeriodStart: '2026-09-01T00:00:00.000Z' }),
        invoice({ id: '2', status: 'ISSUED', total: '5000.00', billingPeriodStart: '2026-09-01T00:00:00.000Z', dueDate: '2026-09-30T00:00:00.000Z' }),
        invoice({ id: '3', status: 'OVERDUE', total: '3000.00', billingPeriodStart: '2026-08-01T00:00:00.000Z', dueDate: '2026-08-10T00:00:00.000Z' }),
        invoice({ id: '4', status: 'PARTIALLY_PAID', total: '4000.00', billingPeriodStart: '2026-09-01T00:00:00.000Z' }),
        invoice({ id: '5', status: 'DRAFT', total: '9999.00', billingPeriodStart: '2026-09-01T00:00:00.000Z' }),
        invoice({ id: '6', status: 'VOID', total: '9999.00', billingPeriodStart: '2026-09-01T00:00:00.000Z' }),
      ],
      now,
    )
    expect(result.billedThisMonth).toBe(17000)
    expect(result.paidInFullThisMonth).toBe(8000)
    expect(result.invoicesThisMonth).toBe(3)
    expect(result.paidInvoicesThisMonth).toBe(1)
    // Partially-paid balances aren't exposed by the backend, so they're never folded in as a guess.
    expect(result.outstandingExact).toBe(8000)
    expect(result.partiallyPaidCount).toBe(1)
    expect(result.overdueAmount).toBe(3000)
    expect(result.dueSoonInvoices.map((i) => i.id)).toEqual(['2'])
  })

  it('treats an ISSUED invoice past its due date as overdue (backend flips it lazily on read)', () => {
    const stale = invoice({ status: 'ISSUED', dueDate: '2026-09-10T00:00:00.000Z' })
    expect(isEffectivelyOverdue(stale, now)).toBe(true)
    expect(computeRentCollection([stale], now).overdueInvoices).toHaveLength(1)
  })
})

describe('greetingFor', () => {
  it('uses the local time of day', () => {
    expect(greetingFor(new Date('2026-09-25T08:00:00'))).toBe('Good morning')
    expect(greetingFor(new Date('2026-09-25T14:00:00'))).toBe('Good afternoon')
    expect(greetingFor(new Date('2026-09-25T20:00:00'))).toBe('Good evening')
  })
})
