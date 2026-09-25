import { act, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { env } from '@/app/config/env'
import { apiClient, registerSessionExpiredHandler } from '@/infrastructure/api/client'
import { testTokens } from '@/test/handlers'
import { renderApp, resetUiStore } from '@/test/renderApp'
import { server } from '@/test/server'
import { REFRESH_TOKEN_KEY, tokenStorage, withRefreshLock } from './tokenStorage'

const api = (path: string) => `${env.apiUrl}${path}`
const ok = <T,>(data: T) => HttpResponse.json({ success: true, data, requestId: 't' })

/** Minimal FIFO implementation of navigator.locks.request for a single lock name. */
function installFakeLocks() {
  let tail: Promise<unknown> = Promise.resolve()
  const locks = {
    request: (_name: string, fn: () => Promise<unknown>) => {
      const run = tail.then(fn, fn)
      tail = run.catch(() => undefined)
      return run
    },
  }
  Object.defineProperty(navigator, 'locks', { value: locks, configurable: true })
  return () => Object.defineProperty(navigator, 'locks', { value: undefined, configurable: true })
}

describe('cross-tab session safety', () => {
  let uninstall: () => void

  beforeEach(() => {
    resetUiStore()
    tokenStorage.clear()
    registerSessionExpiredHandler(() => {})
    uninstall = installFakeLocks()
  })

  afterEach(() => {
    uninstall()
    tokenStorage.clear()
  })

  it('waits for another tab’s refresh and then uses the token it rotated in (never re-uses the old one)', async () => {
    tokenStorage.setAccessToken('expired-access-token')
    tokenStorage.setRefreshToken('token-A')
    const refreshBodies: string[] = []
    let propertiesCalls = 0
    server.use(
      http.post(api('/auth/refresh'), async ({ request }) => {
        const { refreshToken } = (await request.json()) as { refreshToken: string }
        refreshBodies.push(refreshToken)
        return ok({ ...testTokens, refreshToken: `${refreshToken}-rotated` })
      }),
      http.get(api('/properties'), () => {
        propertiesCalls += 1
        return propertiesCalls === 1
          ? HttpResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'expired' } }, { status: 401 })
          : ok([])
      }),
    )

    // "Other tab" holds the refresh lock and rotates A → B before releasing it.
    let release!: () => void
    const otherTab = withRefreshLock(
      () =>
        new Promise<void>((resolve) => {
          release = () => {
            tokenStorage.setRefreshToken('token-B')
            resolve()
          }
        }),
    )

    const request = apiClient.get('/properties')
    await waitFor(() => expect(propertiesCalls).toBe(1))
    await new Promise((r) => setTimeout(r, 20))
    expect(refreshBodies).toEqual([]) // blocked behind the other tab's lock

    release()
    await otherTab
    await request
    expect(refreshBodies).toEqual(['token-B'])
    expect(tokenStorage.getRefreshToken()).toBe('token-B-rotated')
  })

  it('ends this tab’s session when another tab logs out', async () => {
    tokenStorage.setRefreshToken('valid-refresh-token')
    const { router } = renderApp('/app/rooms')
    await screen.findByRole('navigation', { name: 'Primary' }, { timeout: 5000 })

    act(() => {
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      window.dispatchEvent(new StorageEvent('storage', { key: REFRESH_TOKEN_KEY, newValue: null }))
    })

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(tokenStorage.getAccessToken()).toBeNull()
  })
})
