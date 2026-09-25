import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/renderWithProviders'
import { tokenStorage } from '@/infrastructure/auth/tokenStorage'
import { testApplicationUnderReview } from '@/test/handlers'
import { ApplicationDetailPage } from './ApplicationDetailPage'

function renderApplicationDetail() {
  return renderWithProviders(
    <Routes>
      <Route path="/app/applications/:applicationId" element={<ApplicationDetailPage />} />
    </Routes>,
    { route: `/app/applications/${testApplicationUnderReview.id}` },
  )
}

describe('ApplicationDetailPage', () => {
  beforeEach(() => {
    tokenStorage.setRefreshToken('valid-refresh-token')
  })

  afterEach(() => {
    tokenStorage.clear()
  })

  it('shows applicant details and the visit scheduled for this application', async () => {
    renderApplicationDetail()

    await waitFor(() => expect(screen.getByText(testApplicationUnderReview.fullName)).toBeInTheDocument())
    expect(screen.getByText(testApplicationUnderReview.phone)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^approve$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^reject$/i })).toBeInTheDocument()
  })

  it('approving does not itself create a residency — it only unlocks Start Onboarding', async () => {
    const user = userEvent.setup()
    renderApplicationDetail()

    await waitFor(() => expect(screen.getByRole('button', { name: /^approve$/i })).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /^approve$/i }))

    expect(await screen.findByText('Application approved')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /start onboarding/i })).toBeInTheDocument()
    expect(
      screen.getByText(/approval only records a decision/i),
    ).toBeInTheDocument()
  })

  it('starting onboarding creates a tenant and links to the manual check-in step', async () => {
    const user = userEvent.setup()
    renderApplicationDetail()

    await waitFor(() => expect(screen.getByRole('button', { name: /^approve$/i })).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /^approve$/i }))
    await user.click(await screen.findByRole('button', { name: /start onboarding/i }))

    expect(await screen.findByText(/tenant-99/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /continue to check-in/i })).toHaveAttribute(
      'href',
      `/app/properties/${testApplicationUnderReview.propertyId}/residencies/new`,
    )
  })
})
