import { describe, expect, it } from 'vitest'
import type { AppNotification } from '@/types/api'
import { resolveNotificationLink } from './resolveNotificationLink'

const UUID = '3f2b1c9e-8a7d-4e6f-9b1a-2c3d4e5f6a7b'
const n = (data: Record<string, unknown> | null): AppNotification => ({
  id: 'n1',
  type: 'X',
  title: 't',
  body: 'b',
  priority: 'NORMAL',
  data,
  isRead: false,
  readAt: null,
  createdAt: '2026-09-20T00:00:00.000Z',
})

describe('resolveNotificationLink', () => {
  it.each([
    [{ screen: 'COMPLAINT', complaintId: UUID }, `/app/complaints/${UUID}`],
    [{ screen: 'APPLICATION', applicationId: UUID }, `/app/applications/${UUID}`],
    [{ screen: 'INVOICE', invoiceId: UUID }, `/app/billing/invoices/${UUID}`],
    [{ screen: 'PAYMENT', paymentId: UUID, invoiceId: UUID }, `/app/payments/${UUID}`],
    [{ screen: 'RESIDENCY', residencyId: UUID }, `/app/residencies/${UUID}`],
    [{ screen: 'VISIT', visitId: UUID }, '/app/visits'],
    [{ screen: 'FOOD_MENU', propertyId: UUID, date: '2026-09-25', menuId: UUID }, '/app/food/menu?date=2026-09-25'],
    [{ screen: 'SAAS_SUBSCRIPTION', organizationId: UUID }, '/app/settings'],
  ])('deep-links %o', (data, expected) => {
    expect(resolveNotificationLink(n(data))).toBe(expected)
  })

  it('never builds a link from a missing, partial or malicious id', () => {
    expect(resolveNotificationLink(n({ screen: 'COMPLAINT' }))).toBeNull()
    expect(resolveNotificationLink(n({ screen: 'COMPLAINT', complaintId: '3f2b1c9e' }))).toBeNull()
    expect(resolveNotificationLink(n({ screen: 'INVOICE', invoiceId: '../../admin' }))).toBeNull()
    expect(resolveNotificationLink(n({ screen: 'INVOICE', invoiceId: `${UUID}?x=1` }))).toBeNull()
    expect(resolveNotificationLink(n({ screen: 'FOOD_MENU', date: 'javascript:alert(1)' }))).toBe('/app/food/menu')
  })

  it('returns null for screens with no Owner Web page, or no data', () => {
    expect(resolveNotificationLink(n({ screen: 'FOOD_INVOICE', invoiceId: UUID }))).toBeNull()
    expect(resolveNotificationLink(n(null))).toBeNull()
  })
})
