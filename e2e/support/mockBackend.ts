import type { BrowserContext, Route } from '@playwright/test'

export const E2E_API_ORIGIN = 'http://api.pgmet.e2e'
const PREFIX = '/api/v1'

// Deterministic, in-memory stand-in for pg-backend. Mirrors the real contract where it matters for
// the flows under test: the {success,data,requestId} envelope, Bearer auth on every non-auth route,
// single-use rotating refresh tokens (re-use = 401 TOKEN_REVOKED, like AuthService.refresh), and
// the lifecycle transitions exercised (review → visit → approve, complaint start work).

export const IDS = {
  user: '11111111-1111-4111-8111-111111111111',
  tenantUser: '22222222-2222-4222-8222-222222222222',
  org: '33333333-3333-4333-8333-333333333333',
  property: '44444444-4444-4444-8444-444444444444',
  room: '55555555-5555-4555-8555-555555555555',
  bedA: '66666666-6666-4666-8666-666666666661',
  bedB: '66666666-6666-4666-8666-666666666662',
  residency: '77777777-7777-4777-8777-777777777777',
  tenant: '88888888-8888-4888-8888-888888888888',
  invoice: '99999999-9999-4999-8999-999999999991',
  payment: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  complaint: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
  application: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
} as const

const iso = (d: string) => new Date(d).toISOString()

function initialState() {
  const today = new Date()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const pastDue = new Date(today.getTime() - 5 * 86_400_000)
  return {
    user: { id: IDS.user, name: 'Asha Owner', email: 'owner@pgmet.test', phone: null, status: 'ACTIVE', platformRole: 'USER' },
    organization: { id: IDS.org, name: 'Sunrise Living', status: 'ACTIVE', yourRole: 'OWNER', createdAt: iso('2026-01-01') },
    property: {
      id: IDS.property,
      organizationId: IDS.org,
      name: 'Sunrise PG',
      propertyType: 'PG',
      addressLine1: '12 MG Road',
      addressLine2: null,
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560001',
      status: 'ACTIVE',
      createdAt: iso('2026-01-02'),
    },
    room: {
      id: IDS.room,
      propertyId: IDS.property,
      roomNumber: '204',
      floor: 2,
      roomType: 'DOUBLE',
      capacity: 2,
      status: 'ACTIVE',
      pricePerBed: '7000.00',
      currency: 'INR',
      amenities: ['AC', 'WIFI', 'TV', 'ATTACHED_WASHROOM'],
      imageUrl: null as string | null,
      description: 'Spacious room with good ventilation and natural light.',
      // Bed A holds the active residency below; bed B is vacant.
      occupancy: { totalBeds: 2, occupiedBeds: 1, vacantBeds: 1, blockedBeds: 0 },
      createdAt: iso('2026-01-03'),
    },
    beds: [
      {
        id: IDS.bedA,
        roomId: IDS.room,
        bedNumber: 'A',
        status: 'AVAILABLE',
        berth: 'LOWER',
        occupant: {
          residencyId: IDS.residency,
          tenantId: IDS.tenant,
          name: 'Rohit Sharma',
          phone: '9876500001',
          since: iso('2026-08-01'),
          monthlyRent: '7000.00',
          currency: 'INR',
        },
        createdAt: iso('2026-01-03'),
      },
      { id: IDS.bedB, roomId: IDS.room, bedNumber: 'B', status: 'AVAILABLE', berth: 'UPPER', occupant: null, createdAt: iso('2026-01-03') },
    ],
    residency: {
      id: IDS.residency,
      tenantId: IDS.tenant,
      propertyId: IDS.property,
      startDate: iso('2026-08-01'),
      expectedEndDate: null,
      actualEndDate: null,
      status: 'ACTIVE',
      createdAt: iso('2026-07-25'),
    },
    tenant: { id: IDS.tenant, userId: IDS.tenantUser, createdAt: iso('2026-07-25') },
    invoice: {
      id: IDS.invoice,
      residencyId: IDS.residency,
      invoiceNumber: 'INV-2026-000101',
      billingPeriodStart: monthStart.toISOString(),
      billingPeriodEnd: new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString(),
      issueDate: monthStart.toISOString(),
      dueDate: pastDue.toISOString(),
      subtotal: '9000.00',
      discount: '0.00',
      tax: '0.00',
      total: '9000.00',
      currency: 'INR',
      status: 'OVERDUE',
      createdAt: monthStart.toISOString(),
      items: [{ id: 'item-1', description: 'Monthly rent', itemType: 'RENT', quantity: 1, unitAmount: '9000.00', amount: '9000.00' }],
    },
    complaint: {
      id: IDS.complaint,
      organizationId: IDS.org,
      propertyId: IDS.property,
      residencyId: IDS.residency,
      tenantId: IDS.tenant,
      roomId: IDS.room,
      bedId: null,
      reportedByUserId: IDS.tenantUser,
      assignedToUserId: IDS.user,
      category: 'PLUMBING',
      priority: 'HIGH',
      status: 'ASSIGNED',
      title: 'Leaking bathroom tap',
      description: 'The tap in room 204 drips constantly.',
      resolutionNote: null,
      resolvedAt: null,
      closedAt: null,
      createdAt: iso('2026-09-20'),
      updatedAt: iso('2026-09-20'),
    },
    application: {
      id: IDS.application,
      organizationId: IDS.org,
      propertyId: IDS.property,
      applicantUserId: '99990000-0000-4000-8000-000000000001',
      fullName: 'Rahul Sharma',
      phone: '9876500000',
      email: 'rahul@example.com',
      status: 'SUBMITTED',
      preferredMoveInDate: iso('2026-11-01'),
      preferredRoomType: 'DOUBLE',
      preferredStayDuration: 6,
      notes: null,
      rejectionReason: null,
      reviewedByUserId: null as string | null,
      reviewedAt: null as string | null,
      decisionAt: null as string | null,
      submittedAt: iso('2026-09-22'),
      createdAt: iso('2026-09-22'),
      updatedAt: iso('2026-09-22'),
    },
    visits: [] as Array<Record<string, unknown>>,
    // Auth
    accessTokens: new Set<string>(),
    refreshTokens: new Map<string, 'active' | 'used'>(),
    tokenSeq: 0,
    sessionsRevoked: false,
  }
}

export type MockState = ReturnType<typeof initialState>

export interface MockBackend {
  state: MockState
  /** Every API call made, as "METHOD /path" (for asserting e.g. "no duplicate refresh"). */
  calls: string[]
  /** Calls that hit no mock handler — a test should normally assert this is empty. */
  unhandled: string[]
  /** Pre-seed a signed-in session (as if the user logged in earlier and reloaded). */
  seedSession: () => string
}

export async function installMockBackend(context: BrowserContext): Promise<MockBackend> {
  const state = initialState()
  const calls: string[] = []
  const unhandled: string[] = []

  const issueTokens = () => {
    state.tokenSeq += 1
    const accessToken = `access-${state.tokenSeq}`
    const refreshToken = `refresh-${state.tokenSeq}`
    state.accessTokens.add(accessToken)
    state.refreshTokens.set(refreshToken, 'active')
    return { accessToken, refreshToken, expiresIn: 900, tokenType: 'Bearer' }
  }

  await context.route(`${E2E_API_ORIGIN}${PREFIX}/**`, async (route: Route) => {
    const request = route.request()
    const url = new URL(request.url())
    const path = url.pathname.slice(PREFIX.length)
    const method = request.method()
    calls.push(`${method} ${path}`)

    const json = (status: number, body: unknown) =>
      route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) })
    const ok = (data: unknown, status = 200) => json(status, { success: true, data, requestId: 'e2e' })
    const fail = (status: number, code: string, message: string) => json(status, { success: false, error: { code, message }, requestId: 'e2e' })
    const body = () => (request.postData() ? JSON.parse(request.postData() as string) : {})

    if (method === 'OPTIONS') {
      return route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-headers': 'authorization,content-type',
          'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE',
        },
      })
    }

    // --- Auth (no Bearer required) ---
    if (method === 'POST' && path === '/auth/login') {
      const { password } = body()
      if (password !== 'correct-password') return fail(401, 'INVALID_CREDENTIALS', 'Invalid credentials')
      return ok({ user: state.user, tokens: issueTokens() })
    }
    if (method === 'POST' && path === '/auth/refresh') {
      const { refreshToken } = body()
      const status = state.refreshTokens.get(refreshToken)
      if (status === 'used') {
        // Reuse detection, like pg-backend: revoke every session of the user.
        state.sessionsRevoked = true
        state.accessTokens.clear()
        state.refreshTokens.clear()
        return fail(401, 'TOKEN_REVOKED', 'Refresh token reuse detected')
      }
      if (status !== 'active') return fail(401, 'TOKEN_INVALID', 'Invalid refresh token')
      state.refreshTokens.set(refreshToken, 'used')
      return ok(issueTokens())
    }
    if (method === 'POST' && path === '/auth/logout') {
      state.refreshTokens.delete(body().refreshToken)
      return ok({ message: 'Logged out.' })
    }

    const auth = request.headers()['authorization']?.replace('Bearer ', '')
    if (!auth || !state.accessTokens.has(auth)) return fail(401, 'UNAUTHORIZED', 'Unauthorized')

    const pid = IDS.property
    const routes: Array<[string, RegExp, (m: RegExpMatchArray) => Promise<void> | void]> = [
      ['GET', /^\/auth\/me$/, () => ok(state.user)],
      ['GET', /^\/organizations$/, () => ok([state.organization])],
      ['GET', /^\/properties$/, () => ok([state.property])],
      ['GET', new RegExp(`^/properties/${pid}$`), () => ok(state.property)],
      ['GET', new RegExp(`^/properties/${pid}/rooms$`), () => ok([state.room])],
      ['GET', new RegExp(`^/properties/${pid}/rooms/${IDS.room}$`), () => ok(state.room)],
      ['GET', new RegExp(`^/properties/${pid}/rooms/${IDS.room}/beds$`), () => ok(state.beds)],
      [
        'GET',
        new RegExp(`^/properties/${pid}/rooms/${IDS.room}/history$`),
        () =>
          ok([
            {
              allocationId: 'alloc-1',
              bedId: IDS.bedA,
              bedNumber: 'A',
              residencyId: IDS.residency,
              tenantId: IDS.tenant,
              tenantName: 'Rohit Sharma',
              startDate: iso('2026-08-01'),
              endDate: null,
              status: 'ACTIVE',
            },
          ]),
      ],
      ['GET', new RegExp(`^/properties/${pid}/residencies$`), () => ok([state.residency])],
      ['GET', new RegExp(`^/residencies/${IDS.residency}$`), () => ok(state.residency)],
      ['GET', new RegExp(`^/residencies/${IDS.residency}/rent-plan$`), () => fail(404, 'RENT_PLAN_NOT_FOUND', 'No rent plan')],
      ['GET', new RegExp(`^/tenants/${IDS.tenant}$`), () => ok(state.tenant)],
      ['GET', new RegExp(`^/properties/${pid}/invoices$`), () => ok([state.invoice])],
      ['GET', new RegExp(`^/invoices/${IDS.invoice}$`), () => ok(state.invoice)],
      ['GET', /^\/invoices\/[^/]+\/payments$/, () => ok([])],
      [
        'GET',
        /^\/complaints$/,
        () => {
          const status = url.searchParams.get('status')
          const priority = url.searchParams.get('priority')
          const search = url.searchParams.get('search')?.toLowerCase()
          const c = state.complaint
          const match = (!status || c.status === status) && (!priority || c.priority === priority) && (!search || c.title.toLowerCase().includes(search))
          const items = match ? [c] : []
          return ok({ items, total: items.length, page: 1, limit: Number(url.searchParams.get('limit') ?? 20) })
        },
      ],
      ['GET', new RegExp(`^/complaints/${IDS.complaint}$`), () => ok(state.complaint)],
      ['GET', new RegExp(`^/complaints/${IDS.complaint}/(activity|comments|attachments)$`), () => ok([])],
      [
        'POST',
        new RegExp(`^/complaints/${IDS.complaint}/start$`),
        () => {
          if (state.complaint.status !== 'ASSIGNED') return fail(409, 'COMPLAINT_INVALID_STATUS_TRANSITION', 'Invalid transition')
          state.complaint = { ...state.complaint, status: 'IN_PROGRESS', updatedAt: new Date().toISOString() }
          return ok(state.complaint)
        },
      ],
      ['GET', new RegExp(`^/properties/${pid}/food$`), () =>
        ok({
          id: 'food-1',
          organizationId: IDS.org,
          propertyId: pid,
          enabled: false,
          mealsIncludedInRent: false,
          includedMealTypes: [],
          optionalSubscriptionEnabled: false,
          createdAt: iso('2026-01-01'),
          updatedAt: iso('2026-01-01'),
        })],
      ['GET', new RegExp(`^/properties/${pid}/food/(menus|plans|subscriptions)$`), () => ok([])],
      [
        'GET',
        new RegExp(`^/properties/${pid}/applications$`),
        () => {
          const status = url.searchParams.get('status')
          const items = !status || state.application.status === status ? [state.application] : []
          return ok({ items, total: items.length, page: 1, limit: Number(url.searchParams.get('limit') ?? 20) })
        },
      ],
      ['GET', new RegExp(`^/applications/${IDS.application}$`), () => ok(state.application)],
      [
        'POST',
        new RegExp(`^/applications/${IDS.application}/review$`),
        () => {
          state.application = { ...state.application, status: 'UNDER_REVIEW', reviewedByUserId: IDS.user, reviewedAt: new Date().toISOString() }
          return ok(state.application)
        },
      ],
      [
        'POST',
        new RegExp(`^/applications/${IDS.application}/visits$`),
        () => {
          const { scheduledStartAt, scheduledEndAt } = body()
          const visit = {
            id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1',
            organizationId: IDS.org,
            propertyId: pid,
            applicationId: IDS.application,
            applicantUserId: state.application.applicantUserId,
            scheduledStartAt: new Date(scheduledStartAt).toISOString(),
            scheduledEndAt: new Date(scheduledEndAt).toISOString(),
            status: 'SCHEDULED',
            notes: null,
            cancelReason: null,
            createdByUserId: IDS.user,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          state.visits = [visit, ...state.visits]
          state.application = { ...state.application, status: 'VISIT_SCHEDULED' }
          return ok(visit, 201)
        },
      ],
      [
        'POST',
        new RegExp(`^/applications/${IDS.application}/approve$`),
        () => {
          if (!['UNDER_REVIEW', 'VISIT_SCHEDULED'].includes(state.application.status)) {
            return fail(409, 'APPLICATION_INVALID_STATE', 'Invalid state')
          }
          state.application = { ...state.application, status: 'APPROVED', decisionAt: new Date().toISOString() }
          return ok(state.application)
        },
      ],
      ['GET', new RegExp(`^/properties/${pid}/visits$`), () => ok({ items: state.visits, total: state.visits.length, page: 1, limit: 100 })],
      ['GET', /^\/me\/notifications$/, () => ok({ items: [], total: 0, page: 1, limit: 10 })],
      ['GET', /^\/me\/notifications\/unread-count$/, () => ok({ count: 0 })],
    ]

    for (const [m, pattern, handler] of routes) {
      const match = method === m ? path.match(pattern) : null
      if (match) return handler(match)
    }
    unhandled.push(`${method} ${path}${url.search}`)
    return fail(404, 'NOT_FOUND', `E2E mock has no handler for ${method} ${path}`)
  })

  return {
    state,
    calls,
    unhandled,
    seedSession: () => issueTokens().refreshToken,
  }
}
