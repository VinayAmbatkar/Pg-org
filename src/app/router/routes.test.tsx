import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { matchRoutes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { env } from '@/app/config/env'
import { NAV_ITEMS } from '@/components/navigation/navItems'
import { tokenStorage } from '@/infrastructure/auth/tokenStorage'
import { testOrganization } from '@/test/handlers'
import { renderApp, resetUiStore } from '@/test/renderApp'
import { server } from '@/test/server'
import { APP_PATHS } from './paths'
import { routeObjects } from './routes'

// P0 regression suite for the Phase 3 "Rooms & Beds sidebar opens the wrong page" bug.
// Root cause: the sidebar item was hard-coded to /app/properties and no Rooms & Beds route existed.

function asRole(role: 'OWNER' | 'MANAGER' | 'STAFF' | 'STUDENT') {
  server.use(
    http.get(`${env.apiUrl}/organizations`, () =>
      HttpResponse.json({ success: true, data: [{ ...testOrganization, yourRole: role }], requestId: 't' }),
    ),
  )
}

async function findRoomsBedsHeading() {
  return screen.findByRole('heading', { level: 1, name: 'Rooms & Beds' }, { timeout: 5000 })
}

describe('Rooms & Beds routing (P0 regression)', () => {
  beforeEach(() => {
    resetUiStore()
    tokenStorage.setRefreshToken('valid-refresh-token')
  })

  afterEach(() => {
    tokenStorage.clear()
  })

  it('every sidebar item points at a route the router actually defines (and is not a duplicate)', () => {
    const targets = NAV_ITEMS.map((item) => item.to)
    expect(new Set(targets).size).toBe(targets.length)
    for (const to of targets) {
      const matches = matchRoutes(routeObjects, to)
      const leaf = matches?.at(-1)?.route
      expect(leaf, `no route for sidebar target ${to}`).toBeDefined()
      expect(leaf?.path, `sidebar target ${to} only matched the catch-all`).not.toBe('*')
    }
    expect(NAV_ITEMS.find((item) => item.label === 'Rooms & Beds')?.to).toBe(APP_PATHS.rooms)
  })

  it('clicking Rooms & Beds in the sidebar updates the URL and renders the Rooms & Beds page', async () => {
    const user = userEvent.setup()
    const { router } = renderApp(APP_PATHS.properties)

    const nav = await screen.findByRole('navigation', { name: 'Primary' }, { timeout: 5000 })
    await user.click(within(nav).getByRole('link', { name: 'Rooms & Beds' }))

    await waitFor(() => expect(router.state.location.pathname).toBe(APP_PATHS.rooms))
    await findRoomsBedsHeading()
    expect(await screen.findByText('Room 204')).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'Rooms & Beds' })).toHaveAttribute('aria-current', 'page')
    expect(within(nav).getByRole('link', { name: 'Properties' })).not.toHaveAttribute('aria-current')
  })

  it('opening /app/rooms directly renders the page', async () => {
    renderApp(APP_PATHS.rooms)
    await findRoomsBedsHeading()
    expect(await screen.findByText('Room 204')).toBeInTheDocument()
    expect(await screen.findByText('1 bed available')).toBeInTheDocument()
  })

  it('refreshing /app/rooms keeps the page accessible (session restored from the stored refresh token)', async () => {
    const first = renderApp(APP_PATHS.rooms)
    await findRoomsBedsHeading()
    first.unmount()

    // A browser reload drops the in-memory access token; only the (rotated) refresh token survives.
    tokenStorage.setAccessToken(null)
    expect(tokenStorage.getRefreshToken()).toBeTruthy()

    const second = renderApp(APP_PATHS.rooms)
    await findRoomsBedsHeading()
    expect(second.router.state.location.pathname).toBe(APP_PATHS.rooms)
  })

  it('STAFF can view Rooms & Beds but not manage it', async () => {
    asRole('STAFF')
    renderApp(APP_PATHS.rooms)
    await findRoomsBedsHeading()
    await screen.findByText('Room 204')
    expect(screen.queryByRole('button', { name: /add room/i })).not.toBeInTheDocument()
  })

  it('a role without rooms.view gets no sidebar entry and an access-denied page on direct URL', async () => {
    asRole('STUDENT')
    renderApp(APP_PATHS.rooms)

    expect(await screen.findByText("You don't have access to this page", {}, { timeout: 5000 })).toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: 'Primary' })
    expect(within(nav).queryByRole('link', { name: 'Rooms & Beds' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Rooms & Beds' })).not.toBeInTheDocument()
  })

  it('an unauthenticated visit to /app/rooms redirects to login', async () => {
    tokenStorage.clear()
    const { router } = renderApp(APP_PATHS.rooms)
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
  })
})
