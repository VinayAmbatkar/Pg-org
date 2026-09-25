import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/renderWithProviders'
import { tokenStorage } from '@/infrastructure/auth/tokenStorage'
import { testVisitScheduled } from '@/test/handlers'
import { VisitsListPage } from './VisitsListPage'

describe('VisitsListPage', () => {
  beforeEach(() => {
    tokenStorage.setRefreshToken('valid-refresh-token')
  })

  afterEach(() => {
    tokenStorage.clear()
  })

  it('lists visits and shows the Complete/Reschedule/No-show/Cancel actions for a scheduled visit', async () => {
    renderWithProviders(<VisitsListPage />)

    await waitFor(() => expect(screen.getByRole('button', { name: /reschedule/i })).toBeInTheDocument())
    expect(screen.getByRole('button', { name: /^complete$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /no-show/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^cancel$/i })).toBeInTheDocument()
  })

  it('marks a visit complete and updates the row status without waiting on a refetch', async () => {
    const user = userEvent.setup()
    renderWithProviders(<VisitsListPage />)

    await waitFor(() => expect(screen.getByRole('button', { name: /^complete$/i })).toBeInTheDocument())
    const row = screen.getByRole('button', { name: /^complete$/i }).closest('tr')!
    await user.click(screen.getByRole('button', { name: /^complete$/i }))

    expect(await screen.findByText('Visit marked complete')).toBeInTheDocument()
    await waitFor(() => expect(within(row).getByText('Completed')).toBeInTheDocument())
  })

  it('cancels a visit after confirming and updates the row status', async () => {
    const user = userEvent.setup()
    renderWithProviders(<VisitsListPage />)

    await waitFor(() => expect(screen.getByRole('button', { name: /^cancel$/i })).toBeInTheDocument())
    const row = screen.getByText(testVisitScheduled.applicationId.slice(0, 8)).closest('tr')!
    await user.click(screen.getByRole('button', { name: /^cancel$/i }))

    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: /cancel visit/i }))

    expect(await screen.findByText('Visit cancelled')).toBeInTheDocument()
    await waitFor(() => expect(within(row).getByText('Cancelled')).toBeInTheDocument())
  })
})
