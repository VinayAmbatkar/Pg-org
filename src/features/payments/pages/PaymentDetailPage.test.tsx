import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/renderWithProviders'
import { tokenStorage } from '@/infrastructure/auth/tokenStorage'
import { testPaymentCaptured } from '@/test/handlers'
import { PaymentDetailPage } from './PaymentDetailPage'

function renderPaymentDetail() {
  return renderWithProviders(
    <Routes>
      <Route path="/app/payments/:paymentId" element={<PaymentDetailPage />} />
    </Routes>,
    { route: `/app/payments/${testPaymentCaptured.id}` },
  )
}

describe('PaymentDetailPage', () => {
  beforeEach(() => {
    tokenStorage.setRefreshToken('valid-refresh-token')
  })

  afterEach(() => {
    tokenStorage.clear()
  })

  it('shows gross amount, platform fee, and owner settlement as separate figures', async () => {
    renderPaymentDetail()

    await waitFor(() => expect(screen.getByText('₹5,000.00')).toBeInTheDocument())
    expect(screen.getByText('-₹50.00')).toBeInTheDocument()
    expect(screen.getByText('₹4,950.00')).toBeInTheDocument()
  })

  it('lets an owner refund a captured payment', async () => {
    const user = userEvent.setup()
    renderPaymentDetail()

    await waitFor(() => expect(screen.getByRole('button', { name: /^refund$/i })).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /^refund$/i }))

    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: /^refund$/i }))

    expect(await screen.findByText('Refund processed')).toBeInTheDocument()
  })
})
