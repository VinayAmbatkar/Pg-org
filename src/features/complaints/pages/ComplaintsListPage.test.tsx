import { screen, waitFor, within } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/renderWithProviders'
import { tokenStorage } from '@/infrastructure/auth/tokenStorage'
import { testComplaintOpen } from '@/test/handlers'
import { ComplaintsListPage } from './ComplaintsListPage'

function renderComplaintsList() {
  return renderWithProviders(
    <Routes>
      <Route path="/app/complaints" element={<ComplaintsListPage />} />
      <Route path="/app/complaints/:complaintId" element={<div>Complaint detail page</div>} />
    </Routes>,
    { route: '/app/complaints' },
  )
}

describe('ComplaintsListPage', () => {
  beforeEach(() => {
    tokenStorage.setRefreshToken('valid-refresh-token')
  })

  afterEach(() => {
    tokenStorage.clear()
  })

  it('lists complaints for the current property', async () => {
    renderComplaintsList()

    await waitFor(() => expect(screen.getByText(testComplaintOpen.title)).toBeInTheDocument())
    const row = screen.getByText(testComplaintOpen.title).closest('tr')!
    expect(within(row).getByText('Plumbing')).toBeInTheDocument()
    expect(within(row).getByText('High')).toBeInTheDocument()
    expect(within(row).getByText('Open')).toBeInTheDocument()
  })
})
