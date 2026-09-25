import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { tokenStorage } from '@/infrastructure/auth/tokenStorage'
import { testApplicationUnderReview, testInvoiceIssued, testInvoicePartiallyPaid, testResidencyActive } from '@/test/handlers'
import { api, ok } from '@/test/msw'
import { renderApp, resetUiStore } from '@/test/renderApp'
import { server } from '@/test/server'

describe('list URL state', () => {
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

  it('invoices ?status=OVERDUE uses the dashboard definition (ISSUED past due counts)', async () => {
    renderApp('/app/billing/invoices?status=OVERDUE')
    const table = await screen.findByRole('table', { name: 'Invoices' })
    expect(within(table).getByText(testInvoiceIssued.invoiceNumber)).toBeInTheDocument()
    expect(within(table).queryByText(testInvoicePartiallyPaid.invoiceNumber)).not.toBeInTheDocument()
    expect(screen.getByLabelText('Filter by status')).toHaveValue('OVERDUE')
  })

  it('filter changes push history, so Back restores the previous filter', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/app/billing/invoices')
    await screen.findByRole('table', { name: 'Invoices' })

    await user.selectOptions(screen.getByLabelText('Filter by status'), 'PARTIALLY_PAID')
    await waitFor(() => expect(router.state.location.search).toBe('?status=PARTIALLY_PAID'))
    expect(screen.queryByText(testInvoiceIssued.invoiceNumber)).not.toBeInTheDocument()

    await act(() => router.navigate(-1))
    await waitFor(() => expect(router.state.location.search).toBe(''))
    expect(await screen.findByText(testInvoiceIssued.invoiceNumber)).toBeInTheDocument()
    expect(screen.getByLabelText('Filter by status')).toHaveValue('')
  })

  it('a filter with no matches says so and offers to clear, instead of "No invoices yet"', async () => {
    const user = userEvent.setup()
    renderApp('/app/billing/invoices?status=VOID')
    expect(await screen.findByText('No invoices match these filters')).toBeInTheDocument()
    expect(screen.queryByText('No invoices yet')).not.toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: /clear filters/i })[0])
    expect(await screen.findByText(testInvoiceIssued.invoiceNumber)).toBeInTheDocument()
  })

  it('applications ?status= is forwarded to the backend filter', async () => {
    const statuses: Array<string | null> = []
    server.use(
      http.get(api('/properties/:propertyId/applications'), ({ request }) => {
        const status = new URL(request.url).searchParams.get('status')
        statuses.push(status)
        const items = status === 'UNDER_REVIEW' || !status ? [testApplicationUnderReview] : []
        return ok({ items, total: items.length, page: 1, limit: 20 })
      }),
    )
    renderApp('/app/applications?status=SUBMITTED')
    expect(await screen.findByText('No submitted applications')).toBeInTheDocument()
    expect(statuses).toContain('SUBMITTED')
  })

  it('tenants ?status=PENDING (the check-in alert target) filters stays', async () => {
    server.use(
      http.get(api('/properties/:propertyId/residencies'), () =>
        ok([testResidencyActive, { ...testResidencyActive, id: 'residency-2', tenantId: 'pending-tenant-xyz', status: 'PENDING' }]),
      ),
    )
    renderApp('/app/tenants?status=PENDING')
    const table = await screen.findByRole('table', { name: 'Tenants' })
    expect(within(table).getByText('pending-')).toBeInTheDocument()
    expect(within(table).queryByText('tenant-1')).not.toBeInTheDocument()
  })

  it('complaint search is debounced: one request per pause, not per keystroke', async () => {
    const searches: string[] = []
    server.use(
      http.get(api('/complaints'), ({ request }) => {
        const search = new URL(request.url).searchParams.get('search')
        if (search) searches.push(search)
        return ok({ items: [], total: 0, page: 1, limit: 20 })
      }),
    )
    const user = userEvent.setup()
    const { router } = renderApp('/app/complaints')
    await user.type(await screen.findByRole('searchbox', { name: 'Search complaints' }), 'leaking')
    await waitFor(() => expect(router.state.location.search).toBe('?search=leaking'))
    await waitFor(() => expect(searches).toEqual(['leaking']))
  })
})
