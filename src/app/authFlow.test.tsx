import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { env } from '@/app/config/env'
import { tokenStorage } from '@/infrastructure/auth/tokenStorage'
import { testProperty } from '@/test/handlers'
import { renderApp, resetUiStore } from '@/test/renderApp'
import { server } from '@/test/server'
import { APP_PATHS } from './router/paths'

// App-level regression coverage for the Phase 2 session fix, exercised through the real router,
// guards and API client rather than AuthProvider in isolation.

const api = (path: string) => `${env.apiUrl}${path}`

async function findShell() {
  return screen.findByRole('navigation', { name: 'Primary' }, { timeout: 5000 })
}

describe('authentication flow (app level)', () => {
  beforeEach(() => {
    resetUiStore()
    tokenStorage.clear()
  })

  afterEach(() => {
    tokenStorage.clear()
  })

  it('login → dashboard → browser refresh → still authenticated', async () => {
    const user = userEvent.setup()
    const first = renderApp('/login')

    await user.type(await screen.findByLabelText(/email or phone/i), 'owner@example.com')
    await user.type(screen.getByLabelText(/password/i), 'correct-password')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => expect(first.router.state.location.pathname).toBe(APP_PATHS.dashboard))
    await findShell()
    first.unmount()

    // Reload: in-memory access token is gone, only the persisted refresh token remains.
    tokenStorage.setAccessToken(null)
    const second = renderApp(APP_PATHS.dashboard)
    await findShell()
    expect(second.router.state.location.pathname).toBe(APP_PATHS.dashboard)
    expect(tokenStorage.getRefreshToken()).toBeTruthy()
  })

  it('an expired access token is refreshed mid-session and the original request succeeds', async () => {
    tokenStorage.setRefreshToken('valid-refresh-token')
    let propertiesCalls = 0
    server.use(
      http.get(api('/properties'), () => {
        propertiesCalls += 1
        // First call behaves as if the access token had just expired.
        if (propertiesCalls === 1) {
          return HttpResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Token expired' } }, { status: 401 })
        }
        return HttpResponse.json({ success: true, data: [testProperty], requestId: 't' })
      }),
    )

    renderApp(APP_PATHS.rooms)
    expect(await screen.findByRole('heading', { level: 1, name: 'Rooms & Beds' }, { timeout: 5000 })).toBeInTheDocument()
    // Exactly one failed call + one retry: no duplicate fetches between the switcher and the page.
    expect(propertiesCalls).toBe(2)
  })

  it('an invalid refresh token clears the session and lands on login', async () => {
    tokenStorage.setRefreshToken('revoked-refresh-token')
    server.use(
      http.post(api('/auth/refresh'), () =>
        HttpResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid refresh token' } }, { status: 401 }),
      ),
    )

    const { router } = renderApp(APP_PATHS.dashboard)
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(tokenStorage.getRefreshToken()).toBeNull()
  })

  it('after a login bounce, returns to the original page with its filters intact', async () => {
    const user = userEvent.setup()
    const { router } = renderApp('/app/billing/invoices?status=OVERDUE')
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))

    await user.type(await screen.findByLabelText(/email or phone/i), 'owner@example.com')
    await user.type(screen.getByLabelText(/password/i), 'correct-password')
    await user.click(screen.getByRole('button', { name: /log in/i }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/app/billing/invoices'))
    expect(router.state.location.search).toBe('?status=OVERDUE')
  })

  it('logout clears the stored session and returns to login', async () => {
    const user = userEvent.setup()
    tokenStorage.setRefreshToken('valid-refresh-token')
    const { router } = renderApp(APP_PATHS.rooms)
    await findShell()

    const header = screen.getByRole('banner')
    await user.click(within(header).getByRole('button', { expanded: false, name: /sunrise living|test owner/i }))
    await user.click(await screen.findByRole('menuitem', { name: /log out/i }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(tokenStorage.getRefreshToken()).toBeNull()
    expect(tokenStorage.getAccessToken()).toBeNull()
  })
})
