import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { tokenStorage } from '@/infrastructure/auth/tokenStorage'
import { testProperty } from '@/test/handlers'
import { api, ok } from '@/test/msw'
import { renderApp, resetUiStore } from '@/test/renderApp'
import { server } from '@/test/server'

describe('PropertyForm unsaved-changes guard', () => {
  beforeEach(() => {
    resetUiStore()
    tokenStorage.setRefreshToken('valid-refresh-token')
  })

  afterEach(() => {
    tokenStorage.clear()
  })

  it('asks before leaving a dirty form; Keep editing stays, Discard leaves', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/app/properties/new')
    await user.type(await screen.findByLabelText('Property name'), 'Half-typed PG')

    const nav = screen.getByRole('navigation', { name: 'Primary' })
    await user.click(within(nav).getByRole('link', { name: 'Dashboard' }))
    const dialog = await screen.findByRole('dialog', { name: 'Discard unsaved changes?' })
    expect(router.state.location.pathname).toBe('/app/properties/new')

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByLabelText('Property name')).toHaveValue('Half-typed PG')

    await user.click(within(nav).getByRole('link', { name: 'Dashboard' }))
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Discard changes' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/app/dashboard'))
  })

  it('does not prompt when leaving a pristine form, or after a successful save', async () => {
    server.use(http.get(api('/properties/property-2'), () => ok({ ...testProperty, id: 'property-2', name: 'New PG' })))
    const user = userEvent.setup()
    const { router } = renderApp('/app/properties/new')

    await user.type(await screen.findByLabelText('Property name'), 'New PG')
    await user.type(screen.getByLabelText('Address line 1'), '1 Main Road')
    await user.type(screen.getByLabelText('City'), 'Pune')
    await user.type(screen.getByLabelText('State'), 'Maharashtra')
    await user.type(screen.getByLabelText('Postal code'), '411001')
    await user.click(screen.getByRole('button', { name: 'Create property' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/app/properties/property-2'))
    expect(screen.queryByRole('dialog', { name: 'Discard unsaved changes?' })).not.toBeInTheDocument()
  })
})
