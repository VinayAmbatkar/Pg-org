import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/renderWithProviders'
import { tokenStorage } from '@/infrastructure/auth/tokenStorage'
import { FoodConfigurationPage } from './FoodConfigurationPage'

describe('FoodConfigurationPage', () => {
  beforeEach(() => {
    tokenStorage.setRefreshToken('valid-refresh-token')
  })

  afterEach(() => {
    tokenStorage.clear()
  })

  it('reflects the fetched configuration and disables save until something changes', async () => {
    renderWithProviders(<FoodConfigurationPage />)

    await waitFor(() => expect(screen.getByRole('switch', { name: /food module enabled/i })).toBeInTheDocument())
    expect(screen.getByRole('switch', { name: /food module enabled/i })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('switch', { name: /meals included in rent/i })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('button', { name: /save changes/i })).toBeDisabled()
  })

  it('enables save once a toggle is changed, and persists it', async () => {
    const user = userEvent.setup()
    renderWithProviders(<FoodConfigurationPage />)

    await waitFor(() => expect(screen.getByRole('switch', { name: /optional meal subscriptions/i })).toBeInTheDocument())
    await user.click(screen.getByRole('switch', { name: /optional meal subscriptions/i }))

    const saveButton = screen.getByRole('button', { name: /save changes/i })
    expect(saveButton).toBeEnabled()
    await user.click(saveButton)

    expect(await screen.findByText('Food configuration saved')).toBeInTheDocument()
  })
})
