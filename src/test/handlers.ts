import { http, HttpResponse } from 'msw'
import { env } from '@/app/config/env'
import type {
  AppNotification,
  Application,
  Bed,
  AuthTokens,
  Complaint,
  ComplaintActivity,
  ComplaintComment,
  FoodConfiguration,
  Invoice,
  Menu,
  Organization,
  Payment,
  Property,
  Residency,
  RentPlan,
  Room,
  RoomHistoryEntry,
  Tenant,
  User,
  Visit,
} from '@/types/api'

const api = (path: string) => `${env.apiUrl}${path}`

// pg-backend wraps every response in `{success, data, requestId}` (success) or
// `{success: false, error: {code, message}, requestId}` (failure) — see
// src/infrastructure/api/envelope.ts. These helpers keep the fixtures below honest to that shape.
function ok<T>(data: T, status = 200) {
  return HttpResponse.json({ success: true, data, requestId: 'test-request-id' }, { status })
}

function fail(status: number, code: string, message: string) {
  return HttpResponse.json({ success: false, error: { code, message }, requestId: 'test-request-id' }, { status })
}

export const testUser: User = {
  id: 'user-1',
  name: 'Test Owner',
  email: 'owner@example.com',
  phone: null,
  status: 'ACTIVE',
  platformRole: 'USER',
}

export const testTokens: AuthTokens = {
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  expiresIn: 900,
  tokenType: 'Bearer',
}

export const testOrganization: Organization = {
  id: 'org-1',
  name: 'Sunrise Living',
  status: 'ACTIVE',
  yourRole: 'OWNER',
  createdAt: new Date().toISOString(),
}

export const testProperty: Property = {
  id: 'property-1',
  organizationId: 'org-1',
  name: 'Sunrise PG',
  propertyType: 'PG',
  addressLine1: '123 Main St',
  addressLine2: null,
  city: 'Hyderabad',
  state: 'Telangana',
  postalCode: '500001',
  status: 'ACTIVE',
  createdAt: new Date().toISOString(),
}

export const testInvoiceIssued: Invoice = {
  id: 'invoice-1',
  residencyId: 'residency-1',
  invoiceNumber: 'INV-2026-000001',
  billingPeriodStart: '2026-09-01T00:00:00.000Z',
  billingPeriodEnd: '2026-09-30T00:00:00.000Z',
  issueDate: '2026-09-01T00:00:00.000Z',
  dueDate: '2026-09-10T00:00:00.000Z',
  subtotal: '8500.00',
  discount: '0.00',
  tax: '0.00',
  total: '8500.00',
  currency: 'INR',
  status: 'ISSUED',
  createdAt: '2026-09-01T00:00:00.000Z',
  items: [{ id: 'item-1', description: 'Rent', itemType: 'RENT', quantity: 1, unitAmount: '8500.00', amount: '8500.00' }],
}

export const testInvoicePartiallyPaid: Invoice = {
  ...testInvoiceIssued,
  id: 'invoice-2',
  invoiceNumber: 'INV-2026-000002',
  status: 'PARTIALLY_PAID',
}

export const testPaymentCaptured: Payment = {
  id: 'payment-1',
  organizationId: 'org-1',
  propertyId: 'property-1',
  residencyId: 'residency-1',
  invoiceId: 'invoice-2',
  payerUserId: 'user-2',
  amount: '5000.00',
  currency: 'INR',
  platformFee: '50.00',
  ownerSettlementAmount: '4950.00',
  method: 'upi',
  status: 'CAPTURED',
  provider: 'RAZORPAY',
  providerOrderId: 'order_1',
  providerPaymentId: 'pay_1',
  failureCode: null,
  failureMessage: null,
  paidAt: '2026-09-05T00:00:00.000Z',
  createdAt: '2026-09-05T00:00:00.000Z',
}

export const testComplaintOpen: Complaint = {
  id: 'complaint-1',
  organizationId: 'org-1',
  propertyId: 'property-1',
  residencyId: 'residency-1',
  tenantId: 'tenant-1',
  roomId: 'room-1',
  bedId: null,
  reportedByUserId: 'user-2',
  assignedToUserId: null,
  category: 'PLUMBING',
  priority: 'HIGH',
  status: 'OPEN',
  title: 'Leaking tap',
  description: 'The bathroom tap has been leaking for two days.',
  resolutionNote: null,
  resolvedAt: null,
  closedAt: null,
  createdAt: '2026-09-10T00:00:00.000Z',
  updatedAt: '2026-09-10T00:00:00.000Z',
}

export const testComplaintActivity: ComplaintActivity[] = [
  {
    id: 'activity-1',
    actorUserId: 'user-2',
    type: 'CREATED',
    oldStatus: null,
    newStatus: 'OPEN',
    oldPriority: null,
    newPriority: 'HIGH',
    oldAssigneeId: null,
    newAssigneeId: null,
    createdAt: '2026-09-10T00:00:00.000Z',
  },
]

export const testComplaintComments: ComplaintComment[] = []

export const testFoodConfiguration: FoodConfiguration = {
  id: 'food-config-1',
  organizationId: 'org-1',
  propertyId: 'property-1',
  enabled: true,
  mealsIncludedInRent: true,
  includedMealTypes: ['BREAKFAST', 'DINNER'],
  optionalSubscriptionEnabled: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

export const testMenu: Menu = {
  id: 'menu-1',
  organizationId: 'org-1',
  propertyId: 'property-1',
  date: '2026-09-23',
  status: 'DRAFT',
  items: [
    { id: 'item-1', menuId: 'menu-1', mealType: 'BREAKFAST', name: 'Poha', description: null, isVegetarian: true, isAvailable: true },
  ],
  createdAt: '2026-09-20T00:00:00.000Z',
  updatedAt: '2026-09-20T00:00:00.000Z',
}

export const testResidencyActive: Residency = {
  id: 'residency-1',
  tenantId: 'tenant-1',
  propertyId: 'property-1',
  startDate: '2026-08-01T00:00:00.000Z',
  expectedEndDate: null,
  actualEndDate: null,
  status: 'ACTIVE',
  createdAt: '2026-08-01T00:00:00.000Z',
}

export const testTenant: Tenant = {
  id: 'tenant-1',
  code: 'TN-3K7Q-9XZ2',
  userId: 'user-2',
  createdAt: '2026-08-01T00:00:00.000Z',
}

export const testRentPlan: RentPlan = {
  id: 'rent-plan-1',
  residencyId: 'residency-1',
  amount: '8500.00',
  currency: 'INR',
  billingCycle: 'MONTHLY',
  dueDay: 5,
  effectiveFrom: '2026-08-01T00:00:00.000Z',
  effectiveTo: null,
  status: 'ACTIVE',
  createdAt: '2026-08-01T00:00:00.000Z',
}

export const testApplicationUnderReview: Application = {
  id: 'application-1',
  organizationId: 'org-1',
  propertyId: 'property-1',
  applicantUserId: null,
  fullName: 'Priya Nair',
  phone: '9876543210',
  email: 'priya@example.com',
  status: 'UNDER_REVIEW',
  preferredMoveInDate: '2026-10-01T00:00:00.000Z',
  preferredRoomType: 'DOUBLE',
  preferredStayDuration: 6,
  notes: 'Prefers a quiet room.',
  rejectionReason: null,
  reviewedByUserId: 'user-1',
  reviewedAt: '2026-09-15T00:00:00.000Z',
  decisionAt: null,
  submittedAt: '2026-09-10T00:00:00.000Z',
  createdAt: '2026-09-10T00:00:00.000Z',
  updatedAt: '2026-09-15T00:00:00.000Z',
}

export const testVisitScheduled: Visit = {
  id: 'visit-1',
  organizationId: 'org-1',
  propertyId: 'property-1',
  applicationId: 'application-1',
  applicantUserId: null,
  scheduledStartAt: '2026-09-25T10:00:00.000Z',
  scheduledEndAt: '2026-09-25T10:30:00.000Z',
  status: 'SCHEDULED',
  notes: null,
  cancelReason: null,
  createdByUserId: 'user-1',
  createdAt: '2026-09-16T00:00:00.000Z',
  updatedAt: '2026-09-16T00:00:00.000Z',
}

export const testRoom: Room = {
  id: 'room-1',
  propertyId: 'property-1',
  roomNumber: '204',
  floor: 2,
  roomType: 'DOUBLE',
  capacity: 2,
  status: 'ACTIVE',
  pricePerBed: '8500.00',
  currency: 'INR',
  amenities: ['AC', 'WIFI', 'ATTACHED_WASHROOM'],
  imageUrl: null,
  description: 'Corner room with a balcony view.',
  // Bed A holds testResidencyActive; bed B is free.
  occupancy: { totalBeds: 2, occupiedBeds: 1, vacantBeds: 1, blockedBeds: 0 },
  createdAt: '2026-08-01T00:00:00.000Z',
}

export const testBeds: Bed[] = [
  {
    id: '0b7f3a8e-1c2d-4e5f-8a9b-000000000001',
    roomId: 'room-1',
    bedNumber: 'A',
    status: 'AVAILABLE',
    berth: null,
    occupant: {
      residencyId: 'residency-1',
      tenantId: 'tenant-1',
      name: 'Rohit Sharma',
      phone: '9876500001',
      since: '2026-08-01T00:00:00.000Z',
      monthlyRent: '8500.00',
      currency: 'INR',
    },
    createdAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: '0b7f3a8e-1c2d-4e5f-8a9b-000000000002',
    roomId: 'room-1',
    bedNumber: 'B',
    status: 'AVAILABLE',
    berth: null,
    occupant: null,
    createdAt: '2026-08-01T00:00:00.000Z',
  },
]

export const testRoomHistory: RoomHistoryEntry[] = [
  {
    allocationId: 'allocation-1',
    bedId: '0b7f3a8e-1c2d-4e5f-8a9b-000000000001',
    bedNumber: 'A',
    residencyId: 'residency-1',
    tenantId: 'tenant-1',
    tenantName: 'Rohit Sharma',
    startDate: '2026-08-01T00:00:00.000Z',
    endDate: null,
    status: 'ACTIVE',
  },
]

export const testNotifications: AppNotification[] = []

export const handlers = [
  http.post(api('/auth/login'), async ({ request }) => {
    const body = (await request.json()) as { identifier: string; password: string }
    if (body.password !== 'correct-password') {
      return fail(401, 'UNAUTHORIZED', 'Invalid credentials')
    }
    return ok({ user: testUser, tokens: testTokens })
  }),

  http.post(api('/auth/register'), async () => {
    return ok({ user: testUser, tokens: testTokens }, 201)
  }),

  http.post(api('/auth/refresh'), async () => {
    return ok(testTokens)
  }),

  http.post(api('/auth/logout'), async () => {
    return ok({ message: 'Logged out.' })
  }),

  http.get(api('/auth/me'), async ({ request }) => {
    const auth = request.headers.get('Authorization')
    if (!auth) return fail(401, 'UNAUTHORIZED', 'Unauthorized')
    return ok(testUser)
  }),

  http.get(api('/organizations'), async () => {
    return ok([testOrganization])
  }),

  http.post(api('/organizations'), async ({ request }) => {
    const body = (await request.json()) as { name: string }
    return ok({ ...testOrganization, name: body.name }, 201)
  }),

  http.get(api('/properties'), async () => {
    return ok([testProperty])
  }),

  http.get(api('/properties/:id'), async ({ params }) => {
    if (params.id !== testProperty.id) {
      return fail(404, 'PROPERTY_NOT_FOUND', 'Property not found')
    }
    return ok(testProperty)
  }),

  http.post(api('/properties'), async ({ request }) => {
    const body = (await request.json()) as Partial<Property>
    return ok({ ...testProperty, ...body, id: 'property-2' }, 201)
  }),

  http.get(api('/properties/:propertyId/invoices'), async () => {
    return ok([testInvoiceIssued, testInvoicePartiallyPaid])
  }),

  http.get(api('/invoices/:id'), async ({ params }) => {
    const invoice = [testInvoiceIssued, testInvoicePartiallyPaid].find((i) => i.id === params.id)
    if (!invoice) return fail(404, 'INVOICE_NOT_FOUND', 'Invoice not found')
    return ok(invoice)
  }),

  http.post(api('/invoices/:id/issue'), async ({ params }) => {
    const invoice = [testInvoiceIssued, testInvoicePartiallyPaid].find((i) => i.id === params.id)
    if (!invoice) return fail(404, 'INVOICE_NOT_FOUND', 'Invoice not found')
    return ok({ ...invoice, status: 'ISSUED', issueDate: new Date().toISOString() })
  }),

  http.post(api('/invoices/:id/void'), async ({ params }) => {
    const invoice = [testInvoiceIssued, testInvoicePartiallyPaid].find((i) => i.id === params.id)
    if (!invoice) return fail(404, 'INVOICE_NOT_FOUND', 'Invoice not found')
    return ok({ ...invoice, status: 'VOID' })
  }),

  http.get(api('/invoices/:invoiceId/payments'), async ({ params }) => {
    if (params.invoiceId === testInvoicePartiallyPaid.id) return ok([testPaymentCaptured])
    return ok([])
  }),

  http.get(api('/payments/:id'), async ({ params }) => {
    if (params.id !== testPaymentCaptured.id) return fail(404, 'PAYMENT_NOT_FOUND', 'Payment not found')
    return ok(testPaymentCaptured)
  }),

  http.post(api('/payments/:id/refund'), async ({ params }) => {
    if (params.id !== testPaymentCaptured.id) return fail(404, 'PAYMENT_NOT_FOUND', 'Payment not found')
    return ok({ ...testPaymentCaptured, status: 'REFUNDED' })
  }),

  // Honors the same filters pg-backend's ListComplaintsQueryDto does, so per-status count queries
  // (limit: 1, read `.total`) behave like production instead of all returning the same fixture.
  http.get(api('/complaints'), async ({ request }) => {
    const params = new URL(request.url).searchParams
    const status = params.get('status')
    const priority = params.get('priority')
    const search = params.get('search')?.toLowerCase()
    const page = Number(params.get('page') ?? '1')
    const limit = Number(params.get('limit') ?? '20')
    const filtered = [testComplaintOpen].filter(
      (c) =>
        (!status || c.status === status) &&
        (!priority || c.priority === priority) &&
        (!search || c.title.toLowerCase().includes(search) || c.description.toLowerCase().includes(search)),
    )
    return ok({ items: filtered.slice((page - 1) * limit, page * limit), total: filtered.length, page, limit })
  }),

  http.get(api('/complaints/:id'), async ({ params }) => {
    if (params.id !== testComplaintOpen.id) return fail(404, 'COMPLAINT_NOT_FOUND', 'Complaint not found')
    return ok(testComplaintOpen)
  }),

  http.get(api('/complaints/:id/activity'), async () => {
    return ok(testComplaintActivity)
  }),

  http.get(api('/complaints/:id/comments'), async () => {
    return ok(testComplaintComments)
  }),

  http.get(api('/complaints/:id/attachments'), async () => {
    return ok([])
  }),

  http.post(api('/complaints/:id/assign'), async ({ params }) => {
    return ok({ ...testComplaintOpen, id: params.id as string, status: 'ASSIGNED', assignedToUserId: 'user-3' })
  }),

  http.get(api('/properties/:propertyId/food'), async () => {
    return ok(testFoodConfiguration)
  }),

  http.patch(api('/properties/:propertyId/food'), async ({ request }) => {
    const body = (await request.json()) as Partial<FoodConfiguration>
    return ok({ ...testFoodConfiguration, ...body })
  }),

  http.get(api('/properties/:propertyId/food/menus'), async () => {
    return ok([testMenu])
  }),

  http.get(api('/properties/:propertyId/food/plans'), async () => {
    return ok([])
  }),

  http.get(api('/properties/:propertyId/food/subscriptions'), async () => {
    return ok([])
  }),

  http.get(api('/properties/:propertyId/applications'), async ({ request }) => {
    const status = new URL(request.url).searchParams.get('status')
    const all = [testApplicationUnderReview]
    const filtered = status ? all.filter((a) => a.status === status) : all
    return ok({ items: filtered, total: filtered.length, page: 1, limit: 20 })
  }),

  http.get(api('/applications/:id'), async ({ params }) => {
    if (params.id !== testApplicationUnderReview.id) return fail(404, 'APPLICATION_NOT_FOUND', 'Application not found')
    return ok(testApplicationUnderReview)
  }),

  http.post(api('/applications/:id/approve'), async ({ params }) => {
    return ok({ ...testApplicationUnderReview, id: params.id as string, status: 'APPROVED' })
  }),

  http.post(api('/applications/:id/reject'), async ({ params }) => {
    return ok({ ...testApplicationUnderReview, id: params.id as string, status: 'REJECTED' })
  }),

  http.post(api('/applications/:id/start-onboarding'), async () => {
    return ok({ tenantId: 'tenant-99', tenantCode: 'TN-8R4M-2QXD', applicationId: testApplicationUnderReview.id, reused: false })
  }),

  // GET /tenants/lookup (OWNER/MANAGER): resolves the short tenant code a tenant shares.
  http.get(api('/tenants/lookup'), ({ request }) => {
    const code = new URL(request.url).searchParams.get('code')?.toUpperCase().replace(/[\s-]/g, '')
    if (code === 'TN8R4M2QXD') return ok({ tenantId: '8f3c2a1b-9e44-4c1d-8a2b-1234567890ab', code: 'TN-8R4M-2QXD', name: 'Priya Tenant' })
    return fail(404, 'TENANT_NOT_FOUND', 'Tenant not found.')
  }),

  http.get(api('/properties/:propertyId/visits'), async () => {
    return ok({ items: [testVisitScheduled], total: 1, page: 1, limit: 20 })
  }),

  http.post(api('/visits/:id/complete'), async ({ params }) => {
    return ok({ ...testVisitScheduled, id: params.id as string, status: 'COMPLETED' })
  }),

  http.post(api('/visits/:id/cancel'), async ({ params }) => {
    return ok({ ...testVisitScheduled, id: params.id as string, status: 'CANCELLED' })
  }),

  http.get(api('/residencies/:id'), async ({ params }) => {
    if (params.id !== testResidencyActive.id) return fail(404, 'RESIDENCY_NOT_FOUND', 'Residency not found')
    return ok(testResidencyActive)
  }),

  http.get(api('/tenants/:id'), async ({ params }) => {
    if (params.id !== testTenant.id) return fail(404, 'TENANT_NOT_FOUND', 'Tenant not found')
    return ok(testTenant)
  }),

  http.get(api('/residencies/:residencyId/rent-plan'), async () => {
    return ok(testRentPlan)
  }),

  http.get(api('/properties/:propertyId/rooms'), async () => {
    return ok([testRoom])
  }),

  http.get(api('/properties/:propertyId/rooms/:roomId'), async ({ params }) => {
    if (params.roomId !== testRoom.id) return fail(404, 'ROOM_NOT_FOUND', 'Room not found')
    return ok(testRoom)
  }),

  http.get(api('/properties/:propertyId/rooms/:roomId/history'), async ({ params }) => {
    return ok(params.roomId === testRoom.id ? testRoomHistory : [])
  }),

  http.get(api('/properties/:propertyId/rooms/:roomId/beds'), async ({ params }) => {
    return ok(testBeds.filter((bed) => bed.roomId === params.roomId))
  }),

  http.get(api('/me/notifications'), async () => {
    return ok({ items: testNotifications, total: testNotifications.length, page: 1, limit: 10 })
  }),

  http.get(api('/me/notifications/unread-count'), async () => {
    return ok({ count: testNotifications.filter((n) => !n.isRead).length })
  }),

  http.get(api('/properties/:propertyId/residencies'), async () => {
    return ok([testResidencyActive])
  }),
]
