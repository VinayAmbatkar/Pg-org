import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { env } from '@/app/config/env'
import { tokenStorage } from '@/infrastructure/auth/tokenStorage'
import { testOrganization } from '@/test/handlers'
import { resetUiStore } from '@/test/renderApp'
import { renderWithProviders } from '@/test/renderWithProviders'
import { server } from '@/test/server'
import { DashboardPage } from './DashboardPage'

const api = (path: string) => `${env.apiUrl}${path}`
const fail = (status: number) =>
  HttpResponse.json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'boom' } }, { status })

// Fixtures (src/test/handlers.ts): 1 room with 2 in-service beds, 1 ACTIVE residency, invoice-1
// ISSUED and past due, invoice-2 PARTIALLY_PAID, 1 OPEN HIGH-priority complaint, 1 UNDER_REVIEW
// application, 1 SCHEDULED visit, a DRAFT menu for today with food enabled.

function metric(label: string) {
  const region = screen.getByRole('region', { name: 'Key metrics' })
  return within(region).getByText(label).closest('a, div.h-full') as HTMLElement
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-09-23T10:00:00'))
    resetUiStore()
    tokenStorage.setRefreshToken('valid-refresh-token')
  })

  afterEach(() => {
    vi.useRealTimers()
    tokenStorage.clear()
  })

  it('shows real, correctly-derived operational metrics', async () => {
    renderWithProviders(<DashboardPage />)

    expect(await screen.findByRole('heading', { level: 1, name: /good morning, test/i })).toBeInTheDocument()
    await waitFor(() => expect(metric('Beds in service').textContent).toContain('2'))
    // In-service beds are NOT all vacant: 1 of the 2 is backed by an active stay.
    expect(metric('Occupied').textContent).toContain('1')
    expect(metric('Vacant').textContent).toContain('1')
    await waitFor(() => expect(metric('Open complaints').textContent).toContain('1'))

    // Occupancy %, outstanding rent and pending applications live in their cards, not as tiles.
    const tiles = screen.getByRole('region', { name: 'Key metrics' })
    for (const label of ['Occupancy', 'Outstanding rent', 'Pending applications']) {
      expect(within(tiles).queryByText(label)).not.toBeInTheDocument()
    }
    const occupancy = screen.getByRole('heading', { name: 'Occupancy' }).closest('.rounded-lg') as HTMLElement
    await waitFor(() => expect(within(occupancy).getAllByText('50%').length).toBeGreaterThan(0))
    // Only the exact ISSUED/OVERDUE balance — the partially-paid invoice is reported separately.
    const rent = screen.getByRole('heading', { name: 'Tenant Rent Collection' }).closest('.rounded-lg') as HTMLElement
    await waitFor(() => expect(within(rent).getByText('Outstanding').nextElementSibling?.textContent).toContain('8,500'))
    const pipeline = screen.getByRole('heading', { name: 'Application Pipeline' }).closest('.rounded-lg') as HTMLElement
    await waitFor(() => expect(within(pipeline).getByRole('link', { name: /under review/i })).toHaveTextContent('1'))
  })

  it('raises actionable alerts from real data, each linking to the filtered module', async () => {
    renderWithProviders(<DashboardPage />)

    const alerts = await screen.findByRole('region', { name: 'Needs your attention' })
    await waitFor(() => expect(within(alerts).getByText('1 overdue invoice')).toBeInTheDocument())
    expect(within(alerts).getByText('1 high-priority complaint not yet assigned')).toBeInTheDocument()
    expect(within(alerts).getByText("Today's menu isn't published")).toBeInTheDocument()
    expect(within(alerts).getByRole('link', { name: /view invoices/i })).toHaveAttribute(
      'href',
      '/app/billing/invoices?status=OVERDUE',
    )
  })

  it('lists the past-due ISSUED invoice under Overdue, not under Due Soon', async () => {
    renderWithProviders(<DashboardPage />)

    const overdue = (await screen.findByRole('heading', { name: 'Overdue Invoices' })).closest('.rounded-lg') as HTMLElement
    await waitFor(() => expect(within(overdue).getByText('INV-2026-000001')).toBeInTheDocument())
    const dueSoon = screen.getByRole('heading', { name: 'Due in the Next 7 Days' }).closest('.rounded-lg') as HTMLElement
    expect(within(dueSoon).queryByText('INV-2026-000001')).not.toBeInTheDocument()
  })

  it('never renders a fabricated historical trend chart', async () => {
    renderWithProviders(<DashboardPage />)
    await screen.findByRole('heading', { name: 'Occupancy' })
    expect(screen.queryByText(/revenue overview/i)).not.toBeInTheDocument()
    expect(screen.getByText(/historical occupancy isn't available/i)).toBeInTheDocument()
  })

  it('isolates a failed domain: billing errors show a retry, occupancy still renders', async () => {
    server.use(http.get(api('/properties/:propertyId/invoices'), () => fail(500)))
    renderWithProviders(<DashboardPage />)

    const rent = (await screen.findByRole('heading', { name: 'Tenant Rent Collection' })).closest('.rounded-lg') as HTMLElement
    await waitFor(() => expect(within(rent).getByRole('alert')).toBeInTheDocument())
    expect(within(rent).getByRole('button', { name: /try again/i })).toBeInTheDocument()
    await waitFor(() => expect(metric('Occupied').textContent).toContain('1'))
    // No overdue alert may be raised from a domain that failed to load.
    expect(screen.queryByText(/overdue invoice/)).not.toBeInTheDocument()
  })

  it('shows the empty state when the organization has no properties', async () => {
    server.use(http.get(api('/properties'), () => HttpResponse.json({ success: true, data: [], requestId: 't' })))
    renderWithProviders(<DashboardPage />)
    expect(await screen.findByText('No properties yet')).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /add property/i })).toBeInTheDocument()
  })

  it('STAFF sees no manage-only quick actions', async () => {
    server.use(
      http.get(api('/organizations'), () =>
        HttpResponse.json({ success: true, data: [{ ...testOrganization, yourRole: 'STAFF' }], requestId: 't' }),
      ),
    )
    renderWithProviders(<DashboardPage />)
    await screen.findByRole('heading', { name: 'Quick Actions' })
    expect(screen.queryByRole('link', { name: 'Add Tenant' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Add Room' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Invoices' })).toBeInTheDocument()
  })
})
