import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { env } from '@/app/config/env'
import { tokenStorage } from '@/infrastructure/auth/tokenStorage'
import { testOrganization } from '@/test/handlers'
import { renderApp, resetUiStore } from '@/test/renderApp'
import { server } from '@/test/server'

async function openPalette(user: ReturnType<typeof userEvent.setup>) {
  await screen.findByRole('navigation', { name: 'Primary' }, { timeout: 5000 })
  await user.keyboard('{Control>}k{/Control}')
  return screen.findByRole('combobox', { name: /search pages/i })
}

function asRole(role: 'OWNER' | 'STAFF') {
  server.use(
    http.get(`${env.apiUrl}/organizations`, () =>
      HttpResponse.json({ success: true, data: [{ ...testOrganization, yourRole: role }], requestId: 't' }),
    ),
  )
}

describe('CommandPalette', () => {
  beforeEach(() => {
    resetUiStore()
    tokenStorage.setRefreshToken('valid-refresh-token')
  })

  afterEach(() => {
    tokenStorage.clear()
  })

  it('opens with Ctrl+K, navigates with the keyboard, and Enter opens the page', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/app/properties')
    const input = await openPalette(user)
    expect(input).toHaveFocus()

    await user.type(input, 'rooms')
    const listbox = screen.getByRole('listbox')
    expect(within(listbox).getByRole('option', { name: /rooms & beds/i })).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{Enter}')

    await waitFor(() => expect(router.state.location.pathname).toBe('/app/rooms'))
    expect(screen.queryByRole('combobox', { name: /search pages/i })).not.toBeInTheDocument()
  })

  it('searches complaints server-side and invoices/rooms from the current property', async () => {
    const user = userEvent.setup()
    renderApp('/app/properties')
    const input = await openPalette(user)

    await user.type(input, 'leak')
    expect(await screen.findByRole('option', { name: /leaking tap/i })).toBeInTheDocument()

    await user.clear(input)
    await user.type(input, 'INV-2026-000002')
    expect(await screen.findByRole('option', { name: /INV-2026-000002/ })).toBeInTheDocument()

    await user.clear(input)
    await user.type(input, '204')
    expect(await screen.findByRole('option', { name: /room 204/i })).toBeInTheDocument()

    await user.clear(input)
    await user.type(input, 'priya')
    expect(await screen.findByRole('option', { name: /priya nair/i })).toBeInTheDocument()
  })

  it('says so when nothing matches, and Escape closes it', async () => {
    const user = userEvent.setup()
    renderApp('/app/properties')
    const input = await openPalette(user)
    await user.type(input, 'zzzzqq')
    expect(await screen.findByText(/no results for/i)).toBeInTheDocument()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('combobox', { name: /search pages/i })).not.toBeInTheDocument())
  })

  it('only offers actions the role is allowed to take', async () => {
    asRole('STAFF')
    const user = userEvent.setup()
    renderApp('/app/properties')
    const input = await openPalette(user)
    await user.type(input, 'add')
    await waitFor(() => expect(screen.queryByText(/searching/i)).not.toBeInTheDocument())
    expect(screen.queryByRole('option', { name: /add property/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /add tenant/i })).not.toBeInTheDocument()
  })

  it('is reachable from the header search button', async () => {
    const user = userEvent.setup()
    renderApp('/app/properties')
    await screen.findByRole('navigation', { name: 'Primary' }, { timeout: 5000 })
    await user.click(within(screen.getByRole('banner')).getByRole('button', { name: /search pages/i }))
    expect(await screen.findByRole('combobox', { name: /search pages/i })).toHaveFocus()
  })
})
