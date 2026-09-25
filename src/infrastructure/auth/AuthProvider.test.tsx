import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { env } from '@/app/config/env'
import { server } from '@/test/server'
import { testOrganization, testUser } from '@/test/handlers'
import { AuthProvider, useAuth } from './AuthProvider'
import { tokenStorage } from './tokenStorage'

const api = (path: string) => `${env.apiUrl}${path}`

function ok<T>(data: T) {
  return HttpResponse.json({ success: true, data, requestId: 'test-request-id' })
}

function fail(status: number, code: string, message: string) {
  return HttpResponse.json({ success: false, error: { code, message }, requestId: 'test-request-id' }, { status })
}

function Probe() {
  const { status, user } = useAuth()
  return <div>status: {status}{user ? ` user: ${user.name}` : ''}</div>
}

function renderAuth({ strict = false }: { strict?: boolean } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const tree = (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Probe />
      </AuthProvider>
    </QueryClientProvider>
  )
  return render(strict ? <StrictMode>{tree}</StrictMode> : tree)
}

describe('AuthProvider session restoration', () => {
  beforeEach(() => {
    tokenStorage.clear()
  })

  afterEach(() => {
    tokenStorage.clear()
  })

  it('restores an authenticated session on load when a refresh token is stored (reload simulation)', async () => {
    tokenStorage.setRefreshToken('valid-refresh-token')

    renderAuth()

    await waitFor(() => expect(screen.getByText(/status: authenticated/)).toBeInTheDocument())
    expect(screen.getByText(new RegExp(testUser.name))).toBeInTheDocument()
  })

  it('goes straight to unauthenticated when there is no stored refresh token', async () => {
    renderAuth()

    await waitFor(() => expect(screen.getByText(/status: unauthenticated/)).toBeInTheDocument())
  })

  it('clears storage and lands on unauthenticated when the refresh token is invalid/revoked', async () => {
    tokenStorage.setRefreshToken('revoked-refresh-token')

    server.use(
      http.post(api('/auth/refresh'), () =>
        fail(401, 'TOKEN_REVOKED', 'This refresh token has already been used.'),
      ),
    )

    renderAuth()

    await waitFor(() => expect(screen.getByText(/status: unauthenticated/)).toBeInTheDocument())
    expect(tokenStorage.getRefreshToken()).toBeNull()
  })

  it('does not wipe a valid refresh token when bootstrap refresh fails for network reasons', async () => {
    tokenStorage.setRefreshToken('valid-refresh-token')

    server.use(http.post(api('/auth/refresh'), () => HttpResponse.error()))

    renderAuth()

    await waitFor(() => expect(screen.getByText(/status: unauthenticated/)).toBeInTheDocument())
    // The refresh token itself must survive — a later reload with connectivity back can still restore.
    expect(tokenStorage.getRefreshToken()).toBe('valid-refresh-token')
  })

  it('survives React StrictMode double-invoking the bootstrap effect without logging out', async () => {
    tokenStorage.setRefreshToken('single-use-refresh-token')

    // Mirrors pg-backend's single-use/rotated refresh tokens: the SAME stored token can only be
    // redeemed once. A second concurrent request with that same token must fail server-side, exactly
    // as it would in production. Without the StrictMode-safe guard in AuthProvider, this used to
    // race two refresh calls off one mount and log the user straight back out.
    let redeemed = false
    server.use(
      http.post(api('/auth/refresh'), async () => {
        if (redeemed) {
          return fail(401, 'TOKEN_REVOKED', 'This refresh token has already been used.')
        }
        redeemed = true
        return ok({ accessToken: 'new-access-token', refreshToken: 'rotated-refresh-token', expiresIn: 900, tokenType: 'Bearer' })
      }),
      http.get(api('/auth/me'), ({ request }) => {
        const auth = request.headers.get('Authorization')
        if (auth !== 'Bearer new-access-token') return fail(401, 'UNAUTHORIZED', 'Unauthorized')
        return ok(testUser)
      }),
      http.get(api('/organizations'), () => ok([testOrganization])),
    )

    renderAuth({ strict: true })

    await waitFor(() => expect(screen.getByText(/status: authenticated/)).toBeInTheDocument(), { timeout: 3000 })
    expect(tokenStorage.getRefreshToken()).toBe('rotated-refresh-token')
  })
})
