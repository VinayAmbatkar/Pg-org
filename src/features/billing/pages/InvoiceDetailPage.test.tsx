import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/renderWithProviders'
import { tokenStorage } from '@/infrastructure/auth/tokenStorage'
import { testInvoiceIssued, testInvoicePartiallyPaid } from '@/test/handlers'
import { InvoiceDetailPage } from './InvoiceDetailPage'

function renderInvoiceDetail(invoiceId: string) {
  return renderWithProviders(
    <Routes>
      <Route path="/app/billing/invoices/:invoiceId" element={<InvoiceDetailPage />} />
    </Routes>,
    { route: `/app/billing/invoices/${invoiceId}` },
  )
}

describe('InvoiceDetailPage', () => {
  beforeEach(() => {
    tokenStorage.setRefreshToken('valid-refresh-token')
  })

  afterEach(() => {
    tokenStorage.clear()
  })

  it('shows the amount breakdown and total for an issued invoice with no payments yet', async () => {
    renderInvoiceDetail(testInvoiceIssued.id)

    await waitFor(() => expect(screen.getByText(`Invoice ${testInvoiceIssued.invoiceNumber}`)).toBeInTheDocument())
    // Item amount, subtotal, and total are all 8500.00 (no discount/tax) -> three occurrences.
    expect(screen.getAllByText('₹8,500.00')).toHaveLength(4)
    expect(await screen.findByText('No payments recorded for this invoice yet.')).toBeInTheDocument()
    expect(screen.getByText('Paid').nextSibling).toHaveTextContent('₹0.00')
    expect(screen.getByText('Outstanding').nextSibling).toHaveTextContent('₹8,500.00')
  })

  it('derives paid/outstanding from captured payments for a partially paid invoice', async () => {
    renderInvoiceDetail(testInvoicePartiallyPaid.id)

    await waitFor(() =>
      expect(screen.getByText(`Invoice ${testInvoicePartiallyPaid.invoiceNumber}`)).toBeInTheDocument(),
    )

    // Total 8500.00, one captured payment of 5000.00 -> paid 5000, outstanding 3500.
    await waitFor(() => expect(screen.getByText('Paid').nextSibling).toHaveTextContent('₹5,000.00'))
    expect(screen.getByText('Outstanding').nextSibling).toHaveTextContent('₹3,500.00')
    expect(screen.getByText(/estimated from completed payments/i)).toBeInTheDocument()
  })

  it('issues a draft invoice and reflects the new status', async () => {
    const user = userEvent.setup()
    // Reuse the issued fixture's shape but as a DRAFT invoice via a dedicated handler override.
    const { server } = await import('@/test/server')
    const { http, HttpResponse } = await import('msw')
    const { env } = await import('@/app/config/env')
    const api = (path: string) => `${env.apiUrl}${path}`
    // Mutable so the invalidateQueries-triggered refetch after issuing reflects the new status,
    // exactly as a real backend would (rather than serving a stale, hardcoded response).
    let draftInvoice: typeof testInvoiceIssued = {
      ...testInvoiceIssued,
      id: 'invoice-draft',
      status: 'DRAFT',
      issueDate: null,
    }

    server.use(
      http.get(api('/invoices/:id'), () => HttpResponse.json({ success: true, data: draftInvoice, requestId: 'r' })),
      http.get(api('/invoices/:invoiceId/payments'), () => HttpResponse.json({ success: true, data: [], requestId: 'r' })),
      http.post(api('/invoices/:id/issue'), () => {
        draftInvoice = { ...draftInvoice, status: 'ISSUED', issueDate: new Date().toISOString() }
        return HttpResponse.json({ success: true, data: draftInvoice, requestId: 'r' })
      }),
    )

    renderInvoiceDetail(draftInvoice.id)

    await waitFor(() => expect(screen.getByRole('button', { name: /issue invoice/i })).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /issue invoice/i }))

    expect(await screen.findByText('Invoice issued')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('button', { name: /issue invoice/i })).not.toBeInTheDocument(), {
      timeout: 3000,
    })
  })
})
