import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/renderWithProviders'
import { tokenStorage } from '@/infrastructure/auth/tokenStorage'
import { InvoicesListPage } from './InvoicesListPage'

function renderInvoicesList() {
  return renderWithProviders(
    <Routes>
      <Route path="/app/billing/invoices" element={<InvoicesListPage />} />
      <Route path="/app/billing/invoices/:invoiceId" element={<div>Invoice detail page</div>} />
    </Routes>,
    { route: '/app/billing/invoices' },
  )
}

describe('InvoicesListPage', () => {
  beforeEach(() => {
    tokenStorage.setRefreshToken('valid-refresh-token')
  })

  afterEach(() => {
    tokenStorage.clear()
  })

  it('lists invoices for the current property once the session restores', async () => {
    renderInvoicesList()

    await waitFor(() => expect(screen.getByText('INV-2026-000001')).toBeInTheDocument())
    expect(screen.getByText('INV-2026-000002')).toBeInTheDocument()
  })

  it('filters the list by status client-side', async () => {
    const user = userEvent.setup()
    renderInvoicesList()

    await waitFor(() => expect(screen.getByText('INV-2026-000001')).toBeInTheDocument())

    await user.selectOptions(screen.getByLabelText(/filter by status/i), 'PARTIALLY_PAID')

    expect(screen.queryByText('INV-2026-000001')).not.toBeInTheDocument()
    expect(screen.getByText('INV-2026-000002')).toBeInTheDocument()
  })

  it('navigates to the invoice detail page on row click', async () => {
    const user = userEvent.setup()
    renderInvoicesList()

    await waitFor(() => expect(screen.getByText('INV-2026-000001')).toBeInTheDocument())
    await user.click(screen.getByText('INV-2026-000001'))

    expect(await screen.findByText('Invoice detail page')).toBeInTheDocument()
  })
})
