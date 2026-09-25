import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { env } from '@/app/config/env'
import { server } from '@/test/server'
import { testTokens } from '@/test/handlers'
import { tokenStorage } from '@/infrastructure/auth/tokenStorage'
import { apiClient, registerSessionExpiredHandler } from './client'

const api = (path: string) => `${env.apiUrl}${path}`

function ok<T>(data: T) {
  return HttpResponse.json({ success: true, data, requestId: 'test-request-id' })
}

function fail(status: number, code: string, message: string) {
  return HttpResponse.json({ success: false, error: { code, message }, requestId: 'test-request-id' }, { status })
}

describe('apiClient 401/refresh handling', () => {
  beforeEach(() => {
    tokenStorage.clear()
    registerSessionExpiredHandler(() => {})
  })

  afterEach(() => {
    tokenStorage.clear()
  })

  it('refreshes the access token on a 401 and retries the original request', async () => {
    tokenStorage.setAccessToken('expired-access-token')
    tokenStorage.setRefreshToken('refresh-token')

    let refreshCalls = 0
    server.use(
      http.post(api('/auth/refresh'), () => {
        refreshCalls += 1
        return ok(testTokens)
      }),
      http.get(api('/protected'), ({ request }) => {
        const auth = request.headers.get('Authorization')
        if (auth !== `Bearer ${testTokens.accessToken}`) {
          return fail(401, 'UNAUTHORIZED', 'Token expired')
        }
        return ok({ ok: true })
      }),
    )

    const response = await apiClient.get('/protected')

    expect(response.data).toEqual({ ok: true })
    expect(refreshCalls).toBe(1)
    expect(tokenStorage.getAccessToken()).toBe(testTokens.accessToken)
  })

  it('deduplicates concurrent 401s behind a single refresh request', async () => {
    tokenStorage.setAccessToken('expired-access-token')
    tokenStorage.setRefreshToken('refresh-token')

    let refreshCalls = 0
    server.use(
      http.post(api('/auth/refresh'), async () => {
        refreshCalls += 1
        // Simulate refresh latency so all six requests below are genuinely in flight together.
        await new Promise((resolve) => setTimeout(resolve, 20))
        return ok(testTokens)
      }),
      http.get(api('/protected'), ({ request }) => {
        const auth = request.headers.get('Authorization')
        if (auth !== `Bearer ${testTokens.accessToken}`) {
          return fail(401, 'UNAUTHORIZED', 'Token expired')
        }
        return ok({ ok: true })
      }),
    )

    const results = await Promise.all(Array.from({ length: 6 }, () => apiClient.get('/protected')))

    expect(results.every((r) => r.data.ok === true)).toBe(true)
    expect(refreshCalls).toBe(1)
  })

  it('clears the session and fires the expired handler when the refresh token is invalid', async () => {
    tokenStorage.setAccessToken('expired-access-token')
    tokenStorage.setRefreshToken('revoked-refresh-token')

    const sessionExpired = vi.fn()
    registerSessionExpiredHandler(sessionExpired)

    server.use(
      http.post(api('/auth/refresh'), () => fail(401, 'TOKEN_REVOKED', 'This refresh token has already been used.')),
      http.get(api('/protected'), () => fail(401, 'UNAUTHORIZED', 'Token expired')),
    )

    await expect(apiClient.get('/protected')).rejects.toMatchObject({ status: 401 })

    expect(sessionExpired).toHaveBeenCalledTimes(1)
    expect(tokenStorage.getRefreshToken()).toBeNull()
    expect(tokenStorage.getAccessToken()).toBeNull()
  })

  it('does not clear a valid refresh token when the refresh call fails for network reasons', async () => {
    tokenStorage.setAccessToken('expired-access-token')
    tokenStorage.setRefreshToken('still-good-refresh-token')

    const sessionExpired = vi.fn()
    registerSessionExpiredHandler(sessionExpired)

    server.use(
      http.post(api('/auth/refresh'), () => HttpResponse.error()),
      http.get(api('/protected'), () => fail(401, 'UNAUTHORIZED', 'Token expired')),
    )

    await expect(apiClient.get('/protected')).rejects.toBeTruthy()

    expect(sessionExpired).not.toHaveBeenCalled()
    expect(tokenStorage.getRefreshToken()).toBe('still-good-refresh-token')
  })
})
