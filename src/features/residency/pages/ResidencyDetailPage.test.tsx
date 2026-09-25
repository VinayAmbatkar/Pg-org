import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { env } from '@/app/config/env'
import { renderWithProviders } from '@/test/renderWithProviders'
import { resetUiStore } from '@/test/renderApp'
import { server } from '@/test/server'
import { tokenStorage } from '@/infrastructure/auth/tokenStorage'
import {
  testApplicationUnderReview,
  testInvoiceIssued,
  testInvoicePartiallyPaid,
  testProperty,
  testResidencyActive,
  testTenant,
} from '@/test/handlers'
import { ResidencyDetailPage } from './ResidencyDetailPage'

const api = (path: string) => `${env.apiUrl}${path}`
const ok = <T,>(data: T) => HttpResponse.json({ success: true, data, requestId: 't' })

function renderResidencyDetail(route = `/app/residencies/${testResidencyActive.id}`) {
  return renderWithProviders(
    <Routes>
      <Route path="/app/residencies/:residencyId" element={<ResidencyDetailPage />} />
    </Routes>,
    { route },
  )
}

describe('ResidencyDetailPage — Tenant 360', () => {
  beforeEach(() => {
    resetUiStore()
    tokenStorage.setRefreshToken('valid-refresh-token')
  })

  afterEach(() => {
    tokenStorage.clear()
  })

  it("shows the Rent tab with the residency's active rent plan", async () => {
    const user = userEvent.setup()
    renderResidencyDetail()

    await user.click(await screen.findByRole('tab', { name: 'Rent' }))
    expect(await screen.findByText('₹8,500.00 / month')).toBeInTheDocument()
  })

  it('shows the Invoices tab scoped to this residency', async () => {
    const user = userEvent.setup()
    renderResidencyDetail()

    await user.click(await screen.findByRole('tab', { name: 'Invoices' }))
    expect(await screen.findByText(testInvoiceIssued.invoiceNumber)).toBeInTheDocument()
    expect(screen.getByText(testInvoicePartiallyPaid.invoiceNumber)).toBeInTheDocument()
  })

  it('keeps the selected tab in the URL so refresh/back restore it', async () => {
    renderResidencyDetail(`/app/residencies/${testResidencyActive.id}?tab=invoices`)
    expect(await screen.findByRole('tab', { name: 'Invoices' })).toHaveAttribute('aria-selected', 'true')
    expect(await screen.findByText(testInvoiceIssued.invoiceNumber)).toBeInTheDocument()
  })

  it('shows the property name, not an ID fragment, and a non-identifying fallback when no name is known', async () => {
    renderResidencyDetail()
    expect(await screen.findByRole('link', { name: testProperty.name })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Tenant tenant-1')
    expect(screen.getByText(/name and phone appear for tenants onboarded from an application/i)).toBeInTheDocument()
  })

  it("shows the tenant's name and phone from their approved application (Tenant.userId = applicantUserId)", async () => {
    server.use(
      http.get(api('/properties/:propertyId/applications'), ({ request }) => {
        const status = new URL(request.url).searchParams.get('status')
        const approved = { ...testApplicationUnderReview, status: 'APPROVED' as const, applicantUserId: testTenant.userId }
        const items = status === 'APPROVED' ? [approved] : []
        return ok({ items, total: items.length, page: 1, limit: 100 })
      }),
    )
    renderResidencyDetail()
    expect(await screen.findByRole('heading', { level: 1, name: testApplicationUnderReview.fullName })).toBeInTheDocument()
    expect(screen.getByText(testApplicationUnderReview.phone)).toBeInTheDocument()
  })

  it('does not fetch rooms/beds on page open — only when the check-in dialog opens', async () => {
    let roomRequests = 0
    server.use(
      http.get(api('/residencies/:id'), () => ok({ ...testResidencyActive, status: 'PENDING' })),
      http.get(api('/properties/:propertyId/rooms'), () => {
        roomRequests += 1
        return ok([])
      }),
    )
    const user = userEvent.setup()
    renderResidencyDetail()

    const checkIn = await screen.findByRole('button', { name: 'Check in' })
    await screen.findByRole('link', { name: testProperty.name })
    expect(roomRequests).toBe(0)

    await user.click(checkIn)
    const dialog = await screen.findByRole('dialog', { name: 'Check in tenant' })
    await waitFor(() => expect(roomRequests).toBe(1))
    expect(within(dialog).getByText(/no vacant beds/i)).toBeInTheDocument()
  })

  it('surfaces a 409 BED_ALREADY_OCCUPIED on the bed field with an actionable message', async () => {
    server.use(
      http.get(api('/residencies/:id'), () => ok({ ...testResidencyActive, status: 'PENDING' })),
      http.post(api('/residencies/:id/check-in'), () =>
        HttpResponse.json(
          { success: false, error: { code: 'BED_ALREADY_OCCUPIED', message: 'Bed is already occupied' } },
          { status: 409 },
        ),
      ),
    )
    const user = userEvent.setup()
    renderResidencyDetail()
    await user.click(await screen.findByRole('button', { name: 'Check in' }))
    const dialog = await screen.findByRole('dialog', { name: 'Check in tenant' })
    const select = within(dialog).getByLabelText('Bed')
    await waitFor(() => expect(within(select).getByRole('option', { name: 'Room 204 — Bed B' })).toBeInTheDocument())
    await user.selectOptions(select, 'Room 204 — Bed B')
    await user.click(within(dialog).getByRole('button', { name: 'Check in' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(/pick a different bed/i)
    expect(screen.getByRole('dialog', { name: 'Check in tenant' })).toBeInTheDocument()
  })

  it('confirms check-out with its consequences before calling the API', async () => {
    const user = userEvent.setup()
    renderResidencyDetail()
    await user.click(await screen.findByRole('button', { name: 'Check out' }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent(/frees their bed/i)
    expect(dialog).toHaveTextContent(/can't be undone/i)
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('builds the Activity tab only from real record timestamps', async () => {
    const user = userEvent.setup()
    renderResidencyDetail()
    await user.click(await screen.findByRole('tab', { name: 'Activity' }))
    const panel = screen.getByRole('tabpanel')
    expect(await within(panel).findByText('Stay created')).toBeInTheDocument()
    expect(within(panel).getByText('Stay start date')).toBeInTheDocument()
    await waitFor(() => expect(within(panel).getByText(/Invoice INV-2026-000001 issued/)).toBeInTheDocument())
    await waitFor(() => expect(within(panel).getByText(/Payment received · ₹5,000.00/)).toBeInTheDocument())
    expect(within(panel).getByText('Complaint reported: Leaking tap')).toBeInTheDocument()
    // Never an inferred event: this stay is ACTIVE, so no check-out entry.
    expect(within(panel).queryByText('Checked out')).not.toBeInTheDocument()
  })
})
