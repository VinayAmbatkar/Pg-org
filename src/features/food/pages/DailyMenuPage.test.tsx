import { screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/renderWithProviders'
import { tokenStorage } from '@/infrastructure/auth/tokenStorage'
import { testMenu } from '@/test/handlers'
import { DailyMenuPage } from './DailyMenuPage'

describe('DailyMenuPage', () => {
  beforeEach(() => {
    tokenStorage.setRefreshToken('valid-refresh-token')
  })

  afterEach(() => {
    tokenStorage.clear()
  })

  it("shows the day's menu grouped by meal type with its draft status", async () => {
    renderWithProviders(<DailyMenuPage />)

    await waitFor(() => expect(screen.getByText(testMenu.items[0].name)).toBeInTheDocument())
    expect(screen.getByText('Draft')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^publish$/i })).toBeInTheDocument()
  })
})
