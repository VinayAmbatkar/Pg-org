import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { env } from '@/app/config/env'
import { useUiStore } from '@/app/providers/uiStore'
import { resetUiStore } from '@/test/renderApp'
import { server } from '@/test/server'
import { renderWithProviders } from '@/test/renderWithProviders'
import { tokenStorage } from '@/infrastructure/auth/tokenStorage'
import { testComplaintOpen, testInvoiceIssued, testOrganization, testProperty } from '@/test/handlers'
import { PropertyDetailPage } from './PropertyDetailPage'

function renderPropertyDetail() {
  return renderWithProviders(
    <Routes>
      <Route path="/app/properties/:propertyId" element={<PropertyDetailPage />} />
    </Routes>,
    { route: `/app/properties/${testProperty.id}` },
  )
}

describe('PropertyDetailPage — Property 360', () => {
  beforeEach(() => {
    tokenStorage.setRefreshToken('valid-refresh-token')
  })

  afterEach(() => {
    tokenStorage.clear()
  })

  it('shows the Billing tab scoped to this property', async () => {
    const user = userEvent.setup()
    renderPropertyDetail()

    await waitFor(() => expect(screen.getByRole('tab', { name: 'Billing' })).toBeInTheDocument())
    await user.click(screen.getByRole('tab', { name: 'Billing' }))

    expect(await screen.findByText(testInvoiceIssued.invoiceNumber)).toBeInTheDocument()
  })

  it('shows the Complaints tab scoped to this property', async () => {
    const user = userEvent.setup()
    renderPropertyDetail()

    await waitFor(() => expect(screen.getByRole('tab', { name: 'Complaints' })).toBeInTheDocument())
    await user.click(screen.getByRole('tab', { name: 'Complaints' }))

    expect(await screen.findByText(testComplaintOpen.title)).toBeInTheDocument()
  })
})

describe('PropertyDetailPage — Phase 3 Property 360', () => {
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

  it('opens on a health overview built from real data (no invented health score)', async () => {
    renderPropertyDetail()
    const health = await screen.findByRole('region', { name: 'Property health' })
    await waitFor(() => expect(within(health).getByText('50%')).toBeInTheDocument())
    expect(within(health).getByText('1 of 2 beds')).toBeInTheDocument()
    expect(screen.queryByText(/health score/i)).not.toBeInTheDocument()
  })

  it('makes the viewed property the app-wide current property', async () => {
    useUiStore.setState({ currentPropertyId: 'some-other-property' })
    renderPropertyDetail()
    await screen.findByRole('heading', { level: 1, name: testProperty.name })
    await waitFor(() => expect(useUiStore.getState().currentPropertyId).toBe(testProperty.id))
  })

  it('does not fight the switcher over a property missing from the org list (no render loop)', async () => {
    let listCalls = 0
    server.use(
      http.get(`${env.apiUrl}/properties`, () => {
        listCalls += 1
        return HttpResponse.json({ success: true, data: [{ ...testProperty, id: 'another-property' }], requestId: 't' })
      }),
    )
    renderPropertyDetail()
    await screen.findByRole('heading', { level: 1, name: testProperty.name })
    await waitFor(() => expect(useUiStore.getState().currentPropertyId).toBe('another-property'))
    await new Promise((r) => setTimeout(r, 100))
    expect(useUiStore.getState().currentPropertyId).toBe('another-property')
    expect(listCalls).toBe(1)
  })

  it('shows an error with retry — not a false empty state — when a tab query fails', async () => {
    server.use(
      http.get(`${env.apiUrl}/properties/:propertyId/invoices`, () =>
        HttpResponse.json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'x' } }, { status: 500 }),
      ),
    )
    const user = userEvent.setup()
    renderPropertyDetail()
    await user.click(await screen.findByRole('tab', { name: 'Billing' }))
    const panel = screen.getByRole('tabpanel')
    expect(await within(panel).findByRole('button', { name: /try again/i })).toBeInTheDocument()
    expect(within(panel).queryByText('No invoices yet.')).not.toBeInTheDocument()
  })

  it('supports arrow-key navigation between tabs', async () => {
    const user = userEvent.setup()
    renderPropertyDetail()
    const overview = await screen.findByRole('tab', { name: 'Overview' })
    overview.focus()
    await user.keyboard('{ArrowRight}')
    const listing = screen.getByRole('tab', { name: 'Listing' })
    expect(listing).toHaveFocus()
    expect(listing).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{End}')
    expect(screen.getByRole('tab', { name: 'Visits' })).toHaveFocus()
  })

  it('STAFF gets no Edit/Archive actions', async () => {
    server.use(
      http.get(`${env.apiUrl}/organizations`, () =>
        HttpResponse.json({ success: true, data: [{ ...testOrganization, yourRole: 'STAFF' }], requestId: 't' }),
      ),
    )
    renderPropertyDetail()
    await screen.findByRole('heading', { level: 1, name: testProperty.name })
    await screen.findByRole('tab', { name: 'Billing' })
    expect(screen.queryByRole('button', { name: /archive/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument()
  })
})
