import { screen, waitFor } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/renderWithProviders'
import { tokenStorage } from '@/infrastructure/auth/tokenStorage'
import { PaymentsListPage } from './PaymentsListPage'

function renderPaymentsList() {
  return renderWithProviders(
    <Routes>
      <Route path="/app/payments" element={<PaymentsListPage />} />
      <Route path="/app/payments/:paymentId" element={<div>Payment detail page</div>} />
    </Routes>,
    { route: '/app/payments' },
  )
}

describe('PaymentsListPage', () => {
  beforeEach(() => {
    // Fixture invoices are billed for Sept 2026; pin the clock so the default 3-month window holds.
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-09-23T10:00:00'))
    tokenStorage.setRefreshToken('valid-refresh-token')
  })

  afterEach(() => {
    vi.useRealTimers()
    tokenStorage.clear()
  })

  it('composes payments across every invoice for the current property', async () => {
    renderPaymentsList()

    // One captured payment exists, attached to the PARTIALLY_PAID invoice fixture.
    await waitFor(() => expect(screen.getByText('₹5,000.00')).toBeInTheDocument())
    expect(screen.getByText('₹50.00')).toBeInTheDocument() // platform fee
    expect(screen.getByText('₹4,950.00')).toBeInTheDocument() // owner settlement
    expect(screen.getByText('Captured')).toBeInTheDocument()
    // Invoice shown by number (linked), not a truncated UUID.
    expect(screen.getByRole('link', { name: 'INV-2026-000002' })).toHaveAttribute('href', '/app/billing/invoices/invoice-2')
  })

  it('bounds the per-invoice fan-out to the selected billing window', async () => {
    vi.setSystemTime(new Date('2026-11-05T10:00:00'))
    renderWithProviders(
      <Routes>
        <Route path="/app/payments" element={<PaymentsListPage />} />
      </Routes>,
      { route: '/app/payments?months=1' },
    )
    // "This month" is November: the September invoices (and their payments) are out of window.
    expect(await screen.findByText('No payments in this period')).toBeInTheDocument()
  })
})
