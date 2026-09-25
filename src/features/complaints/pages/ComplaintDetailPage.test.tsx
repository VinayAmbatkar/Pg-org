import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/renderWithProviders'
import { tokenStorage } from '@/infrastructure/auth/tokenStorage'
import { testComplaintOpen } from '@/test/handlers'
import { ComplaintDetailPage } from './ComplaintDetailPage'

function renderComplaintDetail() {
  return renderWithProviders(
    <Routes>
      <Route path="/app/complaints/:complaintId" element={<ComplaintDetailPage />} />
    </Routes>,
    { route: `/app/complaints/${testComplaintOpen.id}` },
  )
}

describe('ComplaintDetailPage', () => {
  beforeEach(() => {
    tokenStorage.setRefreshToken('valid-refresh-token')
  })

  afterEach(() => {
    tokenStorage.clear()
  })

  it('shows complaint details and only the transitions valid for an OPEN complaint', async () => {
    renderComplaintDetail()

    await waitFor(() => expect(screen.getByText(testComplaintOpen.title)).toBeInTheDocument())
    // OWNER can assign or cancel an OPEN complaint, but not unassign/start/resolve/close.
    expect(screen.getByRole('button', { name: /^assign$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^cancel$/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /start work/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^resolve$/i })).not.toBeInTheDocument()
  })

  it('assigns the complaint to a user by ID', async () => {
    const user = userEvent.setup()
    renderComplaintDetail()

    await waitFor(() => expect(screen.getByRole('button', { name: /^assign$/i })).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /^assign$/i }))

    const dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText(/user id/i), '11111111-1111-4111-8111-111111111111')
    await user.click(within(dialog).getByRole('button', { name: /^assign$/i }))

    expect(await screen.findByText('Complaint assigned')).toBeInTheDocument()
  })
})
